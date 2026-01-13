import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import robotsParser from 'robots-parser';
import { EventEmitter } from 'events';
import {
  isInternalLink,
  resolveUrl,
  sanitizeUrlForCrawl,
  shouldCrawlUrl,
  getBaseDomain,
} from '../utils/helpers';
import { AuditProgress } from '../../shared/types';

export interface CrawlerConfig {
  maxPages: number;
  maxDepth: number;
  timeout: number;
  respectRobotsTxt: boolean;
  userAgent: string;
  maxConcurrentRequests: number;
}

export interface CrawlResult {
  url: string;
  statusCode: number;
  responseTime: number;
  html: string;
  headers: Record<string, string>;
  redirectChain: string[];
  error?: string;
}

const DEFAULT_CONFIG: CrawlerConfig = {
  maxPages: parseInt(process.env.MAX_PAGES_PER_AUDIT || '50', 10),
  maxDepth: 3,
  timeout: parseInt(process.env.PAGE_TIMEOUT_MS || '10000', 10),
  respectRobotsTxt: true,
  userAgent: 'SnappySEOBot/1.0 (+https://gosnappy.io)',
  maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '5', 10),
};

export class Crawler extends EventEmitter {
  private config: CrawlerConfig;
  private visited: Set<string> = new Set();
  private queue: Array<{ url: string; depth: number }> = [];
  private results: CrawlResult[] = [];
  private robotsTxt: any = null;
  private baseUrl: string = '';
  private baseDomain: string = '';
  private activeRequests = 0;
  private stopped = false;

  constructor(config: Partial<CrawlerConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async crawl(startUrl: string): Promise<CrawlResult[]> {
    this.baseUrl = startUrl;
    this.baseDomain = getBaseDomain(startUrl);
    this.visited.clear();
    this.queue = [];
    this.results = [];
    this.stopped = false;

    // Fetch and parse robots.txt
    if (this.config.respectRobotsTxt) {
      await this.fetchRobotsTxt();
    }

    // Start with the homepage
    this.queue.push({ url: startUrl, depth: 0 });

    this.emitProgress('crawling', 0, 1, startUrl);

    // Process queue with concurrency limit
    await this.processQueue();

    this.emitProgress('complete', this.results.length, this.results.length, '');

    return this.results;
  }

  stop(): void {
    this.stopped = true;
  }

  private async fetchRobotsTxt(): Promise<void> {
    try {
      const robotsUrl = new URL('/robots.txt', this.baseUrl).href;
      const response = await axios.get(robotsUrl, {
        timeout: this.config.timeout,
        headers: { 'User-Agent': this.config.userAgent },
        validateStatus: () => true,
      });

      if (response.status === 200) {
        this.robotsTxt = robotsParser(robotsUrl, response.data);
      }
    } catch (e) {
      // Robots.txt not available, continue without it
      this.robotsTxt = null;
    }
  }

  private isAllowedByRobots(url: string): boolean {
    if (!this.robotsTxt) return true;
    return this.robotsTxt.isAllowed(url, this.config.userAgent) !== false;
  }

  private async processQueue(): Promise<void> {
    const promises: Promise<void>[] = [];

    while ((this.queue.length > 0 || this.activeRequests > 0) && !this.stopped) {
      // Start new requests up to the concurrency limit
      while (
        this.queue.length > 0 &&
        this.activeRequests < this.config.maxConcurrentRequests &&
        this.results.length < this.config.maxPages &&
        !this.stopped
      ) {
        const item = this.queue.shift();
        if (!item) break;

        const normalizedUrl = sanitizeUrlForCrawl(item.url);

        // Skip if already visited
        if (this.visited.has(normalizedUrl)) continue;

        // Skip if depth exceeds limit
        if (item.depth > this.config.maxDepth) continue;

        // Skip if not allowed by robots.txt
        if (!this.isAllowedByRobots(normalizedUrl)) continue;

        // Mark as visited
        this.visited.add(normalizedUrl);

        // Crawl the page
        this.activeRequests++;
        const promise = this.crawlPage(normalizedUrl, item.depth)
          .finally(() => {
            this.activeRequests--;
          });
        promises.push(promise);
      }

      // Wait a bit before checking queue again
      if (this.activeRequests > 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      } else if (this.queue.length === 0) {
        break;
      }
    }

    // Wait for all remaining requests to complete
    await Promise.all(promises);
  }

  private async crawlPage(url: string, depth: number): Promise<void> {
    const startTime = Date.now();
    let result: CrawlResult = {
      url,
      statusCode: 0,
      responseTime: 0,
      html: '',
      headers: {},
      redirectChain: [],
    };

    try {
      const redirectChain: string[] = [];

      const response = await axios.get(url, {
        timeout: this.config.timeout,
        headers: {
          'User-Agent': this.config.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        maxRedirects: 10,
        validateStatus: () => true, // Don't throw on non-2xx status
        // Track redirects
        beforeRedirect: (options, { headers }) => {
          redirectChain.push(options.href || '');
        },
      });

      result = {
        url,
        statusCode: response.status,
        responseTime: Date.now() - startTime,
        html: typeof response.data === 'string' ? response.data : '',
        headers: response.headers as Record<string, string>,
        redirectChain,
      };

      // Only extract links from successful HTML responses
      if (
        response.status >= 200 &&
        response.status < 400 &&
        typeof response.data === 'string' &&
        this.results.length < this.config.maxPages
      ) {
        const links = this.extractLinks(response.data, url);

        // Add new internal links to queue
        for (const link of links) {
          if (
            isInternalLink(this.baseUrl, link) &&
            shouldCrawlUrl(link) &&
            !this.visited.has(sanitizeUrlForCrawl(link)) &&
            this.results.length + this.queue.length < this.config.maxPages
          ) {
            this.queue.push({ url: link, depth: depth + 1 });
          }
        }
      }
    } catch (error: any) {
      result = {
        url,
        statusCode: 0,
        responseTime: Date.now() - startTime,
        html: '',
        headers: {},
        redirectChain: [],
        error: error.message || 'Unknown error',
      };
    }

    this.results.push(result);

    // Emit progress
    this.emitProgress(
      'crawling',
      this.results.length,
      Math.max(this.results.length, this.queue.length + this.results.length),
      url
    );
  }

  private extractLinks(html: string, baseUrl: string): string[] {
    const links: string[] = [];
    const $ = cheerio.load(html);

    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        try {
          const absoluteUrl = resolveUrl(baseUrl, href);
          if (absoluteUrl && !links.includes(absoluteUrl)) {
            links.push(absoluteUrl);
          }
        } catch {
          // Invalid URL, skip
        }
      }
    });

    return links;
  }

  private emitProgress(
    status: AuditProgress['status'],
    pagesCrawled: number,
    totalPagesFound: number,
    currentUrl: string
  ): void {
    const progress: AuditProgress = {
      status,
      pagesCrawled,
      totalPagesFound,
      currentUrl,
      percentComplete: totalPagesFound > 0 ? Math.round((pagesCrawled / totalPagesFound) * 100) : 0,
    };
    this.emit('progress', progress);
  }
}

export async function crawlWebsite(
  url: string,
  config: Partial<CrawlerConfig> = {},
  onProgress?: (progress: AuditProgress) => void
): Promise<CrawlResult[]> {
  const crawler = new Crawler(config);

  if (onProgress) {
    crawler.on('progress', onProgress);
  }

  return crawler.crawl(url);
}
