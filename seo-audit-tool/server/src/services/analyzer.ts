import * as cheerio from 'cheerio';
import axios from 'axios';
import { CrawlResult } from './crawler';
import {
  PageData,
  Issue,
  ERROR_CODES,
  WARNING_CODES,
  ISSUE_DEFINITIONS,
} from '../../shared/types';
import { calculateTextToHtmlRatio, isInternalLink, resolveUrl } from '../utils/helpers';

interface AnalyzerConfig {
  checkExternalLinks: boolean;
  externalLinkTimeout: number;
}

const DEFAULT_CONFIG: AnalyzerConfig = {
  checkExternalLinks: true,
  externalLinkTimeout: 5000,
};

export async function analyzeCrawlResults(
  crawlResults: CrawlResult[],
  baseUrl: string,
  config: Partial<AnalyzerConfig> = {}
): Promise<PageData[]> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const pageDataList: PageData[] = [];

  // First pass: analyze each page
  for (const result of crawlResults) {
    const pageData = await analyzePage(result, baseUrl, cfg);
    pageDataList.push(pageData);
  }

  // Second pass: detect orphan pages and cross-page issues
  detectOrphanPages(pageDataList, baseUrl);

  return pageDataList;
}

async function analyzePage(
  result: CrawlResult,
  baseUrl: string,
  config: AnalyzerConfig
): Promise<PageData> {
  const issues: Issue[] = [];
  const $ = result.html ? cheerio.load(result.html) : null;

  // Basic page data
  const pageData: PageData = {
    url: result.url,
    statusCode: result.statusCode,
    responseTime: result.responseTime,
    title: null,
    metaDescription: null,
    h1Tags: [],
    h1Count: 0,
    hasCanonical: false,
    canonicalUrl: null,
    hasViewport: false,
    hasRobotsMeta: false,
    robotsContent: null,
    ogTags: {
      title: null,
      description: null,
      image: null,
    },
    images: {
      total: 0,
      withoutAlt: 0,
    },
    textToHtmlRatio: 0,
    pageSize: result.html?.length || 0,
    internalLinks: [],
    externalLinks: [],
    issues: [],
  };

  // Check for server errors (5XX)
  if (result.statusCode >= 500) {
    issues.push(createIssue(ERROR_CODES.SERVER_ERROR));
  }

  // Check for redirect chains (3+ hops)
  if (result.redirectChain && result.redirectChain.length >= 3) {
    issues.push(createIssue(ERROR_CODES.REDIRECT_CHAIN));
  }

  // If we don't have HTML, we can't do further analysis
  if (!$ || !result.html) {
    pageData.issues = issues;
    return pageData;
  }

  // Extract and check title
  const title = $('title').first().text().trim();
  pageData.title = title || null;

  if (!title) {
    issues.push(createIssue(ERROR_CODES.MISSING_TITLE));
  } else {
    if (title.length > 60) {
      issues.push(createIssue(WARNING_CODES.TITLE_TOO_LONG));
    }
    if (title.length < 30) {
      issues.push(createIssue(WARNING_CODES.TITLE_TOO_SHORT));
    }
  }

  // Extract and check meta description
  const metaDescription = $('meta[name="description"]').attr('content')?.trim() || null;
  pageData.metaDescription = metaDescription;

  if (!metaDescription) {
    issues.push(createIssue(WARNING_CODES.MISSING_META_DESCRIPTION));
  } else {
    if (metaDescription.length > 160) {
      issues.push(createIssue(WARNING_CODES.META_DESCRIPTION_TOO_LONG));
    }
    if (metaDescription.length < 70) {
      issues.push(createIssue(WARNING_CODES.META_DESCRIPTION_TOO_SHORT));
    }
  }

  // Check H1 tags
  const h1Elements = $('h1');
  pageData.h1Count = h1Elements.length;
  h1Elements.each((_, el) => {
    const text = $(el).text().trim();
    if (text) pageData.h1Tags.push(text);
  });

  if (pageData.h1Count === 0) {
    issues.push(createIssue(WARNING_CODES.MISSING_H1));
  } else if (pageData.h1Count > 1) {
    issues.push(createIssue(WARNING_CODES.MULTIPLE_H1));
  }

  // Check canonical tag
  const canonical = $('link[rel="canonical"]').attr('href');
  pageData.hasCanonical = !!canonical;
  pageData.canonicalUrl = canonical || null;

  if (!canonical) {
    issues.push(createIssue(WARNING_CODES.MISSING_CANONICAL));
  }

  // Check viewport meta
  const viewport = $('meta[name="viewport"]').attr('content');
  pageData.hasViewport = !!viewport;

  if (!viewport) {
    issues.push(createIssue(WARNING_CODES.MISSING_VIEWPORT));
  }

  // Check robots meta
  const robotsMeta = $('meta[name="robots"]').attr('content');
  pageData.hasRobotsMeta = !!robotsMeta;
  pageData.robotsContent = robotsMeta || null;

  if (!robotsMeta) {
    issues.push(createIssue(WARNING_CODES.MISSING_ROBOTS_META));
  }

  // Check Open Graph tags
  pageData.ogTags = {
    title: $('meta[property="og:title"]').attr('content') || null,
    description: $('meta[property="og:description"]').attr('content') || null,
    image: $('meta[property="og:image"]').attr('content') || null,
  };

  if (!pageData.ogTags.title && !pageData.ogTags.description && !pageData.ogTags.image) {
    issues.push(createIssue(WARNING_CODES.MISSING_OG_TAGS));
  }

  // Check images for alt text
  const images = $('img');
  let imagesWithoutAlt = 0;
  images.each((_, img) => {
    const alt = $(img).attr('alt');
    if (alt === undefined || alt === '') {
      imagesWithoutAlt++;
    }
  });

  pageData.images = {
    total: images.length,
    withoutAlt: imagesWithoutAlt,
  };

  if (imagesWithoutAlt > 0) {
    issues.push(createIssue(WARNING_CODES.MISSING_ALT_TEXT));
  }

  // Calculate text to HTML ratio
  pageData.textToHtmlRatio = calculateTextToHtmlRatio(result.html);

  if (pageData.textToHtmlRatio < 10) {
    issues.push(createIssue(WARNING_CODES.LOW_TEXT_HTML_RATIO));
  }

  // Check page size (warn if > 3MB)
  if (pageData.pageSize > 3 * 1024 * 1024) {
    issues.push(createIssue(WARNING_CODES.LARGE_PAGE_SIZE));
  }

  // Check response time (warn if > 3 seconds)
  if (result.responseTime > 3000) {
    issues.push(createIssue(WARNING_CODES.SLOW_RESPONSE));
  }

  // Extract links
  const internalLinks: string[] = [];
  const externalLinks: string[] = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      try {
        const absoluteUrl = resolveUrl(result.url, href);
        if (absoluteUrl) {
          if (isInternalLink(baseUrl, absoluteUrl)) {
            if (!internalLinks.includes(absoluteUrl)) {
              internalLinks.push(absoluteUrl);
            }
          } else if (absoluteUrl.startsWith('http')) {
            if (!externalLinks.includes(absoluteUrl)) {
              externalLinks.push(absoluteUrl);
            }
          }
        }
      } catch {
        // Invalid URL, skip
      }
    }
  });

  pageData.internalLinks = internalLinks;
  pageData.externalLinks = externalLinks;

  pageData.issues = issues;
  return pageData;
}

function createIssue(code: string): Issue {
  const definition = ISSUE_DEFINITIONS[code];
  return {
    type: definition?.type || 'warning',
    code,
    title: definition?.title || code,
    description: definition?.description || '',
    urls: [],
    count: 1,
  };
}

function detectOrphanPages(pages: PageData[], baseUrl: string): void {
  // Build a set of all linked pages
  const linkedPages = new Set<string>();

  // The homepage is always considered linked
  linkedPages.add(baseUrl);
  linkedPages.add(baseUrl + '/');

  for (const page of pages) {
    for (const link of page.internalLinks) {
      linkedPages.add(link);
      // Also add without trailing slash
      if (link.endsWith('/')) {
        linkedPages.add(link.slice(0, -1));
      } else {
        linkedPages.add(link + '/');
      }
    }
  }

  // Check each page to see if it's an orphan
  for (const page of pages) {
    const url = page.url;
    const urlWithSlash = url.endsWith('/') ? url : url + '/';
    const urlWithoutSlash = url.endsWith('/') ? url.slice(0, -1) : url;

    if (!linkedPages.has(url) && !linkedPages.has(urlWithSlash) && !linkedPages.has(urlWithoutSlash)) {
      // Skip the homepage
      if (url !== baseUrl && url !== baseUrl + '/') {
        page.issues.push(createIssue(WARNING_CODES.ORPHAN_PAGE));
      }
    }
  }
}

export async function checkBrokenLinks(
  pages: PageData[],
  crawlResults: CrawlResult[]
): Promise<void> {
  // Create a map of crawled URLs to their status codes
  const crawledUrls = new Map<string, number>();
  for (const result of crawlResults) {
    crawledUrls.set(result.url, result.statusCode);
    // Also add with/without trailing slash
    if (result.url.endsWith('/')) {
      crawledUrls.set(result.url.slice(0, -1), result.statusCode);
    } else {
      crawledUrls.set(result.url + '/', result.statusCode);
    }
  }

  // Check internal links for broken ones
  for (const page of pages) {
    for (const link of page.internalLinks) {
      const statusCode = crawledUrls.get(link) || crawledUrls.get(link + '/') || crawledUrls.get(link.replace(/\/$/, ''));
      if (statusCode && statusCode >= 400 && statusCode < 600) {
        // Check if already has this issue
        const hasIssue = page.issues.some(i => i.code === ERROR_CODES.BROKEN_INTERNAL_LINK);
        if (!hasIssue) {
          page.issues.push(createIssue(ERROR_CODES.BROKEN_INTERNAL_LINK));
        }
      }
    }
  }
}

export async function checkExternalLinks(
  pages: PageData[],
  timeout: number = 5000
): Promise<void> {
  // Collect unique external links
  const externalLinks = new Map<string, boolean>();

  for (const page of pages) {
    for (const link of page.externalLinks) {
      if (!externalLinks.has(link)) {
        externalLinks.set(link, true);
      }
    }
  }

  // Check a sample of external links (to avoid slowing down the audit too much)
  const linksToCheck = Array.from(externalLinks.keys()).slice(0, 50);
  const brokenLinks = new Set<string>();

  await Promise.all(
    linksToCheck.map(async (link) => {
      try {
        const response = await axios.head(link, {
          timeout,
          validateStatus: () => true,
          maxRedirects: 5,
        });
        if (response.status >= 400) {
          brokenLinks.add(link);
        }
      } catch {
        brokenLinks.add(link);
      }
    })
  );

  // Add issues for pages with broken external links
  for (const page of pages) {
    for (const link of page.externalLinks) {
      if (brokenLinks.has(link)) {
        const hasIssue = page.issues.some(i => i.code === ERROR_CODES.BROKEN_EXTERNAL_LINK);
        if (!hasIssue) {
          page.issues.push(createIssue(ERROR_CODES.BROKEN_EXTERNAL_LINK));
        }
      }
    }
  }
}
