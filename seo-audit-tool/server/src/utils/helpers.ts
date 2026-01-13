import { URL } from 'url';
import { AuditResults, IssueGroup, ISSUE_DEFINITIONS, PageData } from '../../shared/types';

const CHECKS_PER_PAGE = 16; // Number of checks performed per page

/**
 * Normalize a URL by adding protocol if missing
 */
export function normalizeUrl(url: string): string {
  let normalized = url.trim();

  // Add protocol if missing
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }

  // Remove trailing slash for consistency
  if (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

/**
 * Validate a URL
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);

    // Check for valid protocol
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Invalid protocol. Use http:// or https://' };
    }

    // Check for localhost or private IPs
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.endsWith('.local')
    ) {
      return { valid: false, error: 'Cannot audit localhost or private IP addresses' };
    }

    // Check for valid domain
    if (!hostname.includes('.')) {
      return { valid: false, error: 'Invalid domain name' };
    }

    return { valid: true };
  } catch (e) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Get the base domain from a URL
 */
export function getBaseDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return '';
  }
}

/**
 * Check if a URL is internal (same domain)
 */
export function isInternalLink(baseUrl: string, linkUrl: string): boolean {
  try {
    const base = new URL(baseUrl);
    const link = new URL(linkUrl, baseUrl);
    return base.hostname === link.hostname;
  } catch {
    return false;
  }
}

/**
 * Resolve a relative URL to an absolute URL
 */
export function resolveUrl(baseUrl: string, relativeUrl: string): string {
  try {
    return new URL(relativeUrl, baseUrl).href;
  } catch {
    return '';
  }
}

/**
 * Calculate site health score based on errors and warnings
 */
export function calculateSiteHealthScore(
  errorsCount: number,
  warningsCount: number,
  totalPages: number
): number {
  if (totalPages === 0) return 0;

  const totalChecks = totalPages * CHECKS_PER_PAGE;
  const errorWeight = 10; // Each error costs 10 points
  const warningWeight = 2; // Each warning costs 2 points

  const deductions = errorsCount * errorWeight + warningsCount * warningWeight;
  const score = Math.max(0, 100 - (deductions / totalChecks) * 100);

  return Math.round(score);
}

/**
 * Group issues by type for the report
 */
export function groupIssues(pages: PageData[]): {
  errors: IssueGroup[];
  warnings: IssueGroup[];
} {
  const issueMap = new Map<string, IssueGroup>();

  for (const page of pages) {
    for (const issue of page.issues || []) {
      const key = issue.code;
      const existing = issueMap.get(key);

      if (existing) {
        existing.count++;
        if (!existing.urls.includes(page.url)) {
          existing.urls.push(page.url);
        }
      } else {
        const definition = ISSUE_DEFINITIONS[key];
        if (definition) {
          issueMap.set(key, {
            type: key,
            code: key,
            title: definition.title,
            description: definition.description,
            issueType: definition.type,
            count: 1,
            urls: [page.url],
          });
        }
      }
    }
  }

  const allIssues = Array.from(issueMap.values());
  const errors = allIssues.filter((i) => i.issueType === 'error').sort((a, b) => b.count - a.count);
  const warnings = allIssues.filter((i) => i.issueType === 'warning').sort((a, b) => b.count - a.count);

  return { errors, warnings };
}

/**
 * Calculate crawled pages breakdown
 */
export function calculateCrawledPagesBreakdown(pages: PageData[]): {
  total: number;
  healthy: number;
  withIssues: number;
  redirects: number;
  broken: number;
} {
  let healthy = 0;
  let withIssues = 0;
  let redirects = 0;
  let broken = 0;

  for (const page of pages) {
    const statusCode = page.statusCode;

    if (statusCode >= 300 && statusCode < 400) {
      redirects++;
    } else if (statusCode >= 400) {
      broken++;
    } else if (page.issues && page.issues.length > 0) {
      withIssues++;
    } else {
      healthy++;
    }
  }

  return {
    total: pages.length,
    healthy,
    withIssues,
    redirects,
    broken,
  };
}

/**
 * Clean and sanitize URL for crawling
 */
export function sanitizeUrlForCrawl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove hash fragments
    parsed.hash = '';
    // Remove common tracking parameters
    const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'];
    paramsToRemove.forEach((param) => parsed.searchParams.delete(param));
    return parsed.href;
  } catch {
    return url;
  }
}

/**
 * Check if a URL should be crawled (not a file, mailto, tel, etc.)
 */
export function shouldCrawlUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Skip non-http protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    // Skip file extensions that aren't web pages
    const skipExtensions = [
      '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico',
      '.mp4', '.webm', '.avi', '.mov', '.wmv',
      '.mp3', '.wav', '.ogg',
      '.zip', '.rar', '.tar', '.gz',
      '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.css', '.js', '.json', '.xml', '.txt',
    ];

    const pathname = parsed.pathname.toLowerCase();
    if (skipExtensions.some((ext) => pathname.endsWith(ext))) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Extract text content from HTML
 */
export function extractTextContent(html: string): string {
  // Remove script and style tags and their content
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return text;
}

/**
 * Calculate text to HTML ratio
 */
export function calculateTextToHtmlRatio(html: string): number {
  const text = extractTextContent(html);
  if (html.length === 0) return 0;
  return (text.length / html.length) * 100;
}
