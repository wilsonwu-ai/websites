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
