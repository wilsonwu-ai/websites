import { Router, Request, Response } from 'express';
import { getAudit } from '../models/database';

const router = Router();

// GET /api/report/:id/pdf - Generate and download PDF report
router.get('/:id/pdf', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const audit = getAudit(id);

    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    if (audit.status !== 'complete') {
      return res.status(400).json({ error: 'Audit is not complete' });
    }

    // For now, return JSON data that the frontend will use to generate PDF
    // Full server-side PDF generation would require puppeteer which adds complexity
    res.json({ audit });
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

export default router;
