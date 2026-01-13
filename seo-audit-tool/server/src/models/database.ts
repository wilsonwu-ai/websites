import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { AuditResults, AuditStatus, PageData } from '../../shared/types';

const DATA_DIR = process.env.DATABASE_PATH
  ? path.dirname(process.env.DATABASE_PATH)
  : path.join(__dirname, '../../data');

const DB_PATH = process.env.DATABASE_PATH || path.join(DATA_DIR, 'audits.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db: DatabaseType = new Database(DB_PATH);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS audits (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    site_health_score INTEGER,
    total_pages INTEGER,
    pages_crawled INTEGER,
    errors_count INTEGER,
    warnings_count INTEGER,
    results JSON
  );

  CREATE TABLE IF NOT EXISTS pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    audit_id TEXT REFERENCES audits(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    status_code INTEGER,
    issues JSON,
    meta_data JSON,
    crawled_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_audits_status ON audits(status);
  CREATE INDEX IF NOT EXISTS idx_pages_audit_id ON pages(audit_id);
`);

export interface CreateAuditParams {
  id: string;
  url: string;
}

export interface UpdateAuditParams {
  id: string;
  status?: AuditStatus;
  completedAt?: string;
  siteHealthScore?: number;
  totalPages?: number;
  pagesCrawled?: number;
  errorsCount?: number;
  warningsCount?: number;
  results?: AuditResults;
}

export interface SavePageParams {
  auditId: string;
  url: string;
  statusCode: number;
  issues: any;
  metaData: any;
}

// Prepared statements for better performance
const stmts = {
  createAudit: db.prepare(`
    INSERT INTO audits (id, url, status)
    VALUES (@id, @url, 'pending')
  `),

  getAudit: db.prepare(`
    SELECT * FROM audits WHERE id = ?
  `),

  updateAuditStatus: db.prepare(`
    UPDATE audits SET status = @status WHERE id = @id
  `),

  updateAuditComplete: db.prepare(`
    UPDATE audits SET
      status = @status,
      completed_at = @completedAt,
      site_health_score = @siteHealthScore,
      total_pages = @totalPages,
      pages_crawled = @pagesCrawled,
      errors_count = @errorsCount,
      warnings_count = @warningsCount,
      results = @results
    WHERE id = @id
  `),

  savePage: db.prepare(`
    INSERT INTO pages (audit_id, url, status_code, issues, meta_data)
    VALUES (@auditId, @url, @statusCode, @issues, @metaData)
  `),

  getPages: db.prepare(`
    SELECT * FROM pages WHERE audit_id = ?
  `),

  deleteAudit: db.prepare(`
    DELETE FROM audits WHERE id = ?
  `),

  deletePages: db.prepare(`
    DELETE FROM pages WHERE audit_id = ?
  `),
};

export function createAudit(params: CreateAuditParams): void {
  stmts.createAudit.run(params);
}

export function getAudit(id: string): AuditResults | null {
  const row = stmts.getAudit.get(id) as any;
  if (!row) return null;

  if (row.results) {
    return JSON.parse(row.results);
  }

  return {
    id: row.id,
    url: row.url,
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    siteHealthScore: row.site_health_score || 0,
    totalPages: row.total_pages || 0,
    pagesCrawled: row.pages_crawled || 0,
    errorsCount: row.errors_count || 0,
    warningsCount: row.warnings_count || 0,
    crawledPages: {
      total: row.pages_crawled || 0,
      healthy: 0,
      withIssues: 0,
      redirects: 0,
      broken: 0,
    },
    errors: [],
    warnings: [],
    pages: [],
  };
}

export function updateAuditStatus(id: string, status: AuditStatus): void {
  stmts.updateAuditStatus.run({ id, status });
}

export function updateAuditComplete(params: UpdateAuditParams): void {
  stmts.updateAuditComplete.run({
    id: params.id,
    status: params.status || 'complete',
    completedAt: params.completedAt || new Date().toISOString(),
    siteHealthScore: params.siteHealthScore || 0,
    totalPages: params.totalPages || 0,
    pagesCrawled: params.pagesCrawled || 0,
    errorsCount: params.errorsCount || 0,
    warningsCount: params.warningsCount || 0,
    results: JSON.stringify(params.results),
  });
}

export function savePage(params: SavePageParams): void {
  stmts.savePage.run({
    auditId: params.auditId,
    url: params.url,
    statusCode: params.statusCode,
    issues: JSON.stringify(params.issues),
    metaData: JSON.stringify(params.metaData),
  });
}

export function getPages(auditId: string): PageData[] {
  const rows = stmts.getPages.all(auditId) as any[];
  return rows.map((row) => ({
    ...JSON.parse(row.meta_data || '{}'),
    url: row.url,
    statusCode: row.status_code,
    issues: JSON.parse(row.issues || '[]'),
  }));
}

export function deleteAudit(id: string): void {
  stmts.deletePages.run(id);
  stmts.deleteAudit.run(id);
}

export default db;
