import { useNavigate } from 'react-router-dom';
import AuditForm from '../components/AuditForm';
import { useAudit } from '../hooks/useAudit';

export default function Home() {
  const navigate = useNavigate();
  const { startAudit, loading, error } = useAudit();

  const handleSubmit = async (url: string) => {
    const id = await startAudit(url);
    if (id) {
      navigate(`/audit/${id}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img
              src="https://gosnappy.io/images/Snappy-Purple-Logo2x.png"
              alt="Snappy"
              className="h-10"
            />
            <span className="text-xl font-semibold text-gray-900">SEO Audit</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Technical SEO Audit Tool
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Analyze your website for technical SEO issues. We'll crawl up to 50 pages
            and check for broken links, missing meta tags, and other critical issues.
          </p>
        </div>

        <AuditForm onSubmit={handleSubmit} loading={loading} error={error} />

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-primary-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Deep Crawl</h3>
            <p className="text-gray-600">
              Crawl up to 50 pages to discover all technical issues
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-primary-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Detailed Analysis</h3>
            <p className="text-gray-600">
              Check for 15+ technical SEO factors on every page
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-primary-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">PDF Reports</h3>
            <p className="text-gray-600">
              Download branded PDF reports to share with clients
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              Powered by <a href="https://gosnappy.io" className="text-primary-600 hover:underline">Snappy</a>
            </p>
            <p className="text-sm text-gray-500">
              &copy; 2026 Snappy. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
