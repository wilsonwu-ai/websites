import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  createAudit,
  getAudit,
  updateAuditStatus,
  updateAuditComplete,
  savePage,
} from '../models/database';
import { crawlWebsite } from '../services/crawler';
import { analyzeCrawlResults, checkBrokenLinks, checkExternalLinks } from '../services/analyzer';
import {
  normalizeUrl,
  validateUrl,
  groupIssues,
  calculateCrawledPagesBreakdown,
  calculateSiteHealthScore,
} from '../utils/helpers';
import { AuditProgress, AuditResults } from '../../shared/types';

const router = Router();

// Store active audit progress for SSE
const auditProgress = new Map<string, AuditProgress>();

// POST /api/audit - Start a new audit
router.post('/', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const normalizedUrl = normalizeUrl(url);
    const validation = validateUrl(normalizedUrl);

    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const id = uuidv4();

    // Create audit record
    createAudit({ id, url: normalizedUrl });

    // Start the audit process in the background
    runAudit(id, normalizedUrl);

    res.json({ id, status: 'pending' });
  } catch (error: any) {
    console.error('Error starting audit:', error);
    res.status(500).json({ error: 'Failed to start audit' });
  }
});

// GET /api/audit/:id - Get audit results
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const audit = getAudit(id);

    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    res.json({ audit });
  } catch (error: any) {
    console.error('Error getting audit:', error);
    res.status(500).json({ error: 'Failed to get audit' });
  }
});

// GET /api/audit/:id/progress - SSE endpoint for progress updates
router.get('/:id/progress', async (req: Request, res: Response) => {
  const { id } = req.params;

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Send initial progress
  const sendProgress = () => {
    const progress = auditProgress.get(id) || {
      status: 'initializing',
      pagesCrawled: 0,
      totalPagesFound: 0,
      currentUrl: '',
      percentComplete: 0,
    };
    res.write(`data: ${JSON.stringify(progress)}\n\n`);
  };

  // Send progress immediately
  sendProgress();

  // Set up interval to send progress updates
  const interval = setInterval(() => {
    const progress = auditProgress.get(id);
    if (progress) {
      res.write(`data: ${JSON.stringify(progress)}\n\n`);

      // If complete or failed, stop sending updates
      if (progress.status === 'complete' || progress.status === 'failed') {
        clearInterval(interval);
        res.end();
      }
    }
  }, 500);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(interval);
  });
});

async function runAudit(id: string, url: string): Promise<void> {
  try {
    // Update status to crawling
    updateAuditStatus(id, 'crawling');

    // Initialize progress
    auditProgress.set(id, {
      status: 'initializing',
      pagesCrawled: 0,
      totalPagesFound: 0,
      currentUrl: url,
      percentComplete: 0,
    });

    // Crawl the website
    const crawlResults = await crawlWebsite(url, {}, (progress) => {
      auditProgress.set(id, progress);
    });

    // Update status to analyzing
    updateAuditStatus(id, 'analyzing');
    auditProgress.set(id, {
      status: 'analyzing',
      pagesCrawled: crawlResults.length,
      totalPagesFound: crawlResults.length,
      currentUrl: '',
      percentComplete: 75,
    });

    // Analyze the crawl results
    const pages = await analyzeCrawlResults(crawlResults, url);

    // Check for broken links
    await checkBrokenLinks(pages, crawlResults);

    // Check external links (limited to avoid slowdown)
    await checkExternalLinks(pages, 5000);

    // Save pages to database
    for (const page of pages) {
      savePage({
        auditId: id,
        url: page.url,
        statusCode: page.statusCode,
        issues: page.issues,
        metaData: page,
      });
    }

    // Calculate summary data
    const { errors, warnings } = groupIssues(pages);
    const crawledPages = calculateCrawledPagesBreakdown(pages);
    const errorsCount = errors.reduce((sum, e) => sum + e.count, 0);
    const warningsCount = warnings.reduce((sum, w) => sum + w.count, 0);
    const siteHealthScore = calculateSiteHealthScore(errorsCount, warningsCount, pages.length);

    // Build final results
    const results: AuditResults = {
      id,
      url,
      status: 'complete',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      siteHealthScore,
      crawledPages,
      totalPages: pages.length,
      pagesCrawled: pages.length,
      errorsCount,
      warningsCount,
      errors,
      warnings,
      pages,
    };

    // Save to database
    updateAuditComplete({
      id,
      status: 'complete',
      completedAt: new Date().toISOString(),
      siteHealthScore,
      totalPages: pages.length,
      pagesCrawled: pages.length,
      errorsCount,
      warningsCount,
      results,
    });

    // Update progress to complete
    auditProgress.set(id, {
      status: 'complete',
      pagesCrawled: pages.length,
      totalPagesFound: pages.length,
      currentUrl: '',
      percentComplete: 100,
    });

    // Clean up progress after a delay
    setTimeout(() => {
      auditProgress.delete(id);
    }, 60000);
  } catch (error: any) {
    console.error('Audit failed:', error);

    // Update status to failed
    updateAuditStatus(id, 'failed');
    auditProgress.set(id, {
      status: 'failed',
      pagesCrawled: 0,
      totalPagesFound: 0,
      currentUrl: '',
      percentComplete: 0,
      error: error.message || 'Unknown error',
    });
  }
}

export default router;
