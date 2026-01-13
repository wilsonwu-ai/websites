import jsPDF from 'jspdf';
import { AuditResults } from '../types/audit';

const COLORS = {
  primary: '#6B46C1',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#1F2937',
  textLight: '#6B7280',
  border: '#E5E7EB',
};

export async function generatePDF(audit: AuditResults): Promise<void> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Helper functions
  const addPage = () => {
    doc.addPage();
    yPos = margin;
    addFooter();
  };

  const checkNewPage = (neededHeight: number) => {
    if (yPos + neededHeight > pageHeight - 30) {
      addPage();
    }
  };

  const addFooter = () => {
    const footerY = pageHeight - 10;
    doc.setFontSize(8);
    doc.setTextColor(COLORS.textLight);
    doc.text('Powered by Snappy | gosnappy.io | © 2026', pageWidth / 2, footerY, { align: 'center' });
  };

  // Cover page
  doc.setFillColor(COLORS.primary);
  doc.rect(0, 0, pageWidth, 60, 'F');

  // Logo placeholder (text instead of image for simplicity)
  doc.setFontSize(24);
  doc.setTextColor('#FFFFFF');
  doc.text('Snappy', margin, 35);
  doc.setFontSize(14);
  doc.text('SEO Audit Report', margin, 45);

  yPos = 80;

  // Site info
  doc.setFontSize(28);
  doc.setTextColor(COLORS.text);
  doc.text('Site Audit Report', margin, yPos);
  yPos += 15;

  doc.setFontSize(16);
  doc.setTextColor(COLORS.primary);
  doc.text(new URL(audit.url).hostname, margin, yPos);
  yPos += 10;

  doc.setFontSize(12);
  doc.setTextColor(COLORS.textLight);
  const formattedDate = new Date(audit.completedAt || audit.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Generated on ${formattedDate}`, margin, yPos);
  yPos += 30;

  // Site Health Score
  doc.setFontSize(14);
  doc.setTextColor(COLORS.text);
  doc.text('Site Health Score', margin, yPos);
  yPos += 10;

  const scoreColor = audit.siteHealthScore >= 80 ? COLORS.success :
    audit.siteHealthScore >= 60 ? COLORS.warning : COLORS.error;

  doc.setFontSize(48);
  doc.setTextColor(scoreColor);
  doc.text(`${audit.siteHealthScore}%`, margin, yPos + 15);
  yPos += 35;

  // Summary stats
  doc.setFontSize(14);
  doc.setTextColor(COLORS.text);
  doc.text('Summary', margin, yPos);
  yPos += 10;

  doc.setFontSize(11);
  doc.setTextColor(COLORS.textLight);
  const stats = [
    ['Pages Crawled', audit.pagesCrawled.toString()],
    ['Errors Found', audit.errorsCount.toString()],
    ['Warnings Found', audit.warningsCount.toString()],
    ['Healthy Pages', audit.crawledPages.healthy.toString()],
  ];

  stats.forEach(([label, value]) => {
    doc.setTextColor(COLORS.textLight);
    doc.text(label + ':', margin, yPos);
    doc.setTextColor(COLORS.text);
    doc.text(value, margin + 50, yPos);
    yPos += 7;
  });

  addFooter();

  // Errors page
  addPage();

  doc.setFontSize(18);
  doc.setTextColor(COLORS.error);
  doc.text(`Errors (${audit.errors.length})`, margin, yPos);
  yPos += 12;

  if (audit.errors.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(COLORS.textLight);
    doc.text('No errors found!', margin, yPos);
    yPos += 10;
  } else {
    doc.setFontSize(10);
    audit.errors.forEach((error) => {
      checkNewPage(15);

      doc.setTextColor(COLORS.text);
      doc.text(`• ${error.title}`, margin, yPos);
      yPos += 5;

      doc.setTextColor(COLORS.textLight);
      doc.text(`  ${error.count} occurrence(s)`, margin, yPos);
      yPos += 8;
    });
  }

  // Warnings page
  addPage();

  doc.setFontSize(18);
  doc.setTextColor(COLORS.warning);
  doc.text(`Warnings (${audit.warnings.length})`, margin, yPos);
  yPos += 12;

  if (audit.warnings.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(COLORS.textLight);
    doc.text('No warnings found!', margin, yPos);
    yPos += 10;
  } else {
    doc.setFontSize(10);
    audit.warnings.forEach((warning) => {
      checkNewPage(15);

      doc.setTextColor(COLORS.text);
      doc.text(`• ${warning.title}`, margin, yPos);
      yPos += 5;

      doc.setTextColor(COLORS.textLight);
      doc.text(`  ${warning.count} occurrence(s)`, margin, yPos);
      yPos += 8;
    });
  }

  // Pages summary
  addPage();

  doc.setFontSize(18);
  doc.setTextColor(COLORS.text);
  doc.text('Crawled Pages Summary', margin, yPos);
  yPos += 12;

  const pageCategories = [
    { label: 'Healthy', count: audit.crawledPages.healthy, color: COLORS.success },
    { label: 'With Issues', count: audit.crawledPages.withIssues, color: COLORS.warning },
    { label: 'Redirects', count: audit.crawledPages.redirects, color: '#3B82F6' },
    { label: 'Broken', count: audit.crawledPages.broken, color: COLORS.error },
  ];

  doc.setFontSize(11);
  pageCategories.forEach((cat) => {
    doc.setTextColor(cat.color);
    doc.text(`${cat.label}: ${cat.count}`, margin, yPos);
    yPos += 7;
  });

  yPos += 10;
  doc.setTextColor(COLORS.text);
  doc.text(`Total: ${audit.crawledPages.total} pages`, margin, yPos);

  // Save the PDF
  const filename = `seo-audit-${new URL(audit.url).hostname}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
