// Shared types between client and server

export interface AuditRequest {
  url: string;
}

export interface AuditResponse {
  id: string;
  status: AuditStatus;
}

export type AuditStatus = 'pending' | 'crawling' | 'analyzing' | 'complete' | 'failed';

export type IssueType = 'error' | 'warning';

export interface Issue {
  type: IssueType;
  code: string;
  title: string;
  description: string;
  urls: string[];
  count: number;
}

export interface PageData {
  url: string;
  statusCode: number;
  responseTime: number;
  title: string | null;
  metaDescription: string | null;
  h1Tags: string[];
  h1Count: number;
  hasCanonical: boolean;
  canonicalUrl: string | null;
  hasViewport: boolean;
  hasRobotsMeta: boolean;
  robotsContent: string | null;
  ogTags: {
    title: string | null;
    description: string | null;
    image: string | null;
  };
  images: {
    total: number;
    withoutAlt: number;
  };
  textToHtmlRatio: number;
  pageSize: number;
  internalLinks: string[];
  externalLinks: string[];
  issues: Issue[];
}

export interface CrawledPages {
  total: number;
  healthy: number;
  withIssues: number;
  redirects: number;
  broken: number;
}

export interface IssueGroup {
  type: string;
  code: string;
  title: string;
  description: string;
  issueType: IssueType;
  count: number;
  urls: string[];
}

export interface AuditResults {
  id: string;
  url: string;
  status: AuditStatus;
  createdAt: string;
  completedAt: string | null;
  siteHealthScore: number;
  crawledPages: CrawledPages;
  totalPages: number;
  pagesCrawled: number;
  errorsCount: number;
  warningsCount: number;
  errors: IssueGroup[];
  warnings: IssueGroup[];
  pages: PageData[];
}

export interface AuditProgress {
  status: 'initializing' | 'crawling' | 'analyzing' | 'generating_report' | 'complete' | 'failed';
  pagesCrawled: number;
  totalPagesFound: number;
  currentUrl: string;
  percentComplete: number;
  error?: string;
}

export interface HealthCheckResponse {
  status: 'ok';
  timestamp: string;
}

// Issue codes for errors
export const ERROR_CODES = {
  BROKEN_INTERNAL_LINK: 'broken_internal_link',
  BROKEN_EXTERNAL_LINK: 'broken_external_link',
  SERVER_ERROR: 'server_error_5xx',
  MISSING_TITLE: 'missing_title',
  REDIRECT_CHAIN: 'redirect_chain',
  REDIRECT_LOOP: 'redirect_loop',
} as const;

// Issue codes for warnings
export const WARNING_CODES = {
  MISSING_META_DESCRIPTION: 'missing_meta_description',
  MISSING_H1: 'missing_h1',
  MULTIPLE_H1: 'multiple_h1',
  LOW_TEXT_HTML_RATIO: 'low_text_html_ratio',
  TITLE_TOO_LONG: 'title_too_long',
  TITLE_TOO_SHORT: 'title_too_short',
  META_DESCRIPTION_TOO_LONG: 'meta_description_too_long',
  META_DESCRIPTION_TOO_SHORT: 'meta_description_too_short',
  MISSING_CANONICAL: 'missing_canonical',
  MISSING_VIEWPORT: 'missing_viewport',
  MISSING_ALT_TEXT: 'missing_alt_text',
  LARGE_PAGE_SIZE: 'large_page_size',
  SLOW_RESPONSE: 'slow_response',
  ORPHAN_PAGE: 'orphan_page',
  MISSING_OG_TAGS: 'missing_og_tags',
  MISSING_ROBOTS_META: 'missing_robots_meta',
} as const;

export const ISSUE_DEFINITIONS: Record<string, { title: string; description: string; type: IssueType }> = {
  // Errors
  [ERROR_CODES.BROKEN_INTERNAL_LINK]: {
    title: 'Broken internal links',
    description: 'Internal links returning 4XX status codes',
    type: 'error',
  },
  [ERROR_CODES.BROKEN_EXTERNAL_LINK]: {
    title: 'Broken external links',
    description: 'External links returning 4XX or 5XX status codes',
    type: 'error',
  },
  [ERROR_CODES.SERVER_ERROR]: {
    title: 'Pages with server errors',
    description: 'Pages returning 5XX status codes',
    type: 'error',
  },
  [ERROR_CODES.MISSING_TITLE]: {
    title: 'Pages missing title tag',
    description: 'Pages without a title tag or with empty title',
    type: 'error',
  },
  [ERROR_CODES.REDIRECT_CHAIN]: {
    title: 'Redirect chains detected',
    description: 'URLs with 3 or more redirect hops',
    type: 'error',
  },
  [ERROR_CODES.REDIRECT_LOOP]: {
    title: 'Redirect loops detected',
    description: 'URLs with circular redirects',
    type: 'error',
  },
  // Warnings
  [WARNING_CODES.MISSING_META_DESCRIPTION]: {
    title: 'Pages missing meta description',
    description: 'Pages without a meta description tag',
    type: 'warning',
  },
  [WARNING_CODES.MISSING_H1]: {
    title: 'Pages missing H1 heading',
    description: 'Pages without an H1 heading tag',
    type: 'warning',
  },
  [WARNING_CODES.MULTIPLE_H1]: {
    title: 'Pages with multiple H1 tags',
    description: 'Pages with more than one H1 heading',
    type: 'warning',
  },
  [WARNING_CODES.LOW_TEXT_HTML_RATIO]: {
    title: 'Pages with low text-to-HTML ratio',
    description: 'Pages with less than 10% text content',
    type: 'warning',
  },
  [WARNING_CODES.TITLE_TOO_LONG]: {
    title: 'Title tags too long',
    description: 'Title tags exceeding 60 characters',
    type: 'warning',
  },
  [WARNING_CODES.TITLE_TOO_SHORT]: {
    title: 'Title tags too short',
    description: 'Title tags shorter than 30 characters',
    type: 'warning',
  },
  [WARNING_CODES.META_DESCRIPTION_TOO_LONG]: {
    title: 'Meta descriptions too long',
    description: 'Meta descriptions exceeding 160 characters',
    type: 'warning',
  },
  [WARNING_CODES.META_DESCRIPTION_TOO_SHORT]: {
    title: 'Meta descriptions too short',
    description: 'Meta descriptions shorter than 70 characters',
    type: 'warning',
  },
  [WARNING_CODES.MISSING_CANONICAL]: {
    title: 'Pages missing canonical tag',
    description: 'Pages without a canonical URL specified',
    type: 'warning',
  },
  [WARNING_CODES.MISSING_VIEWPORT]: {
    title: 'Pages missing viewport meta tag',
    description: 'Pages without viewport meta for mobile responsiveness',
    type: 'warning',
  },
  [WARNING_CODES.MISSING_ALT_TEXT]: {
    title: 'Images missing alt text',
    description: 'Pages with images lacking alt attributes',
    type: 'warning',
  },
  [WARNING_CODES.LARGE_PAGE_SIZE]: {
    title: 'Large page size',
    description: 'Pages larger than 3MB',
    type: 'warning',
  },
  [WARNING_CODES.SLOW_RESPONSE]: {
    title: 'Slow page response time',
    description: 'Pages taking more than 3 seconds to respond',
    type: 'warning',
  },
  [WARNING_CODES.ORPHAN_PAGE]: {
    title: 'Orphan pages detected',
    description: 'Pages not linked from any other crawled page',
    type: 'warning',
  },
  [WARNING_CODES.MISSING_OG_TAGS]: {
    title: 'Missing Open Graph tags',
    description: 'Pages without OG tags for social sharing',
    type: 'warning',
  },
  [WARNING_CODES.MISSING_ROBOTS_META]: {
    title: 'Missing robots meta tag',
    description: 'Pages without robots meta tag',
    type: 'warning',
  },
};
