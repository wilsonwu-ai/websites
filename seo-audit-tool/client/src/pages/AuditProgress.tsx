import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProgressTracker from '../components/ProgressTracker';
import { useAudit } from '../hooks/useAudit';

export default function AuditProgress() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { progress, subscribeToProgress } = useAudit();

  useEffect(() => {
    if (!id) return;

    const unsubscribe = subscribeToProgress(id);

    return () => {
      unsubscribe();
    };
  }, [id, subscribeToProgress]);

  useEffect(() => {
    if (progress?.status === 'complete') {
      navigate(`/report/${id}`);
    }
  }, [progress?.status, id, navigate]);

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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Analyzing Your Website
          </h1>
          <p className="text-gray-600">
            Please wait while we crawl and analyze your website...
          </p>
        </div>

        <ProgressTracker progress={progress} />

        {progress?.status === 'failed' && (
          <div className="mt-8">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 text-white bg-primary-600 rounded-lg hover:bg-primary-700"
            >
              Try Again
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500 text-center">
            Powered by <a href="https://gosnappy.io" className="text-primary-600 hover:underline">Snappy</a> | gosnappy.io | &copy; 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
