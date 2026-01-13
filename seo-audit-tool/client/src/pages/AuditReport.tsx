import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ScoreCard from '../components/ScoreCard';
import IssuesList from '../components/IssuesList';
import PagesList from '../components/PagesList';
import CrawledPagesChart from '../components/CrawledPagesChart';
import { useAudit } from '../hooks/useAudit';
import { generatePDF } from '../utils/pdfGenerator';

type TabType = 'overview' | 'issues' | 'pages';

export default function AuditReport() {
  const { id } = useParams<{ id: string }>();
  const { audit, loading, error, fetchAudit } = useAudit();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAudit(id);
    }
  }, [id, fetchAudit]);

  const handleDownloadPDF = async () => {
    if (!audit) return;
    setGenerating(true);
    try {
      await generatePDF(audit);
    } catch (e) {
      console.error('Failed to generate PDF:', e);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Report not found'}</p>
          <Link to="/" className="text-primary-600 hover:underline">
            Start a new audit
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(audit.completedAt || audit.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="https://gosnappy.io/images/Snappy-Purple-Logo2x.png"
                alt="Snappy"
                className="h-10"
              />
              <span className="text-xl font-semibold text-gray-900">SEO Audit</span>
            </div>
            <button
              onClick={handleDownloadPDF}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Report header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Site Audit: {new URL(audit.url).hostname}
          </h1>
          <p className="text-gray-500">Generated on {formattedDate}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('issues')}
              className={`py-4 border-b-2 font-medium text-sm ${
                activeTab === 'issues'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              All Issues ({audit.errorsCount + audit.warningsCount})
            </button>
            <button
              onClick={() => setActiveTab('pages')}
              className={`py-4 border-b-2 font-medium text-sm ${
                activeTab === 'pages'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              All Pages ({audit.pagesCrawled})
            </button>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Score and chart row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Score card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 flex items-center justify-center">
                  <ScoreCard score={audit.siteHealthScore} />
                </div>

                {/* Crawled pages chart */}
                <CrawledPagesChart data={audit.crawledPages} />
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <p className="text-3xl font-bold text-gray-900">{audit.pagesCrawled}</p>
                  <p className="text-sm text-gray-500">Pages Crawled</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <p className="text-3xl font-bold text-red-600">{audit.errorsCount}</p>
                  <p className="text-sm text-gray-500">Errors</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <p className="text-3xl font-bold text-orange-600">{audit.warningsCount}</p>
                  <p className="text-sm text-gray-500">Warnings</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <p className="text-3xl font-bold text-green-600">{audit.crawledPages.healthy}</p>
                  <p className="text-sm text-gray-500">Healthy Pages</p>
                </div>
              </div>

              {/* Top issues */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Issues</h2>
                <IssuesList errors={audit.errors} warnings={audit.warnings} />
              </div>
            </div>
          )}

          {activeTab === 'issues' && (
            <IssuesList errors={audit.errors} warnings={audit.warnings} showAll />
          )}

          {activeTab === 'pages' && (
            <PagesList pages={audit.pages} showAll />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              Powered by <a href="https://gosnappy.io" className="text-primary-600 hover:underline">Snappy</a> | gosnappy.io
            </p>
            <Link to="/" className="text-sm text-primary-600 hover:underline">
              Start a new audit
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
