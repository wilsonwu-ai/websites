import { AuditProgress } from '../types/audit';

interface ProgressTrackerProps {
  progress: AuditProgress | null;
}

const statusMessages: Record<string, string> = {
  initializing: 'Initializing audit...',
  crawling: 'Crawling website...',
  analyzing: 'Analyzing pages...',
  generating_report: 'Generating report...',
  complete: 'Audit complete!',
  failed: 'Audit failed',
};

export default function ProgressTracker({ progress }: ProgressTrackerProps) {
  if (!progress) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-gray-600">Connecting...</p>
      </div>
    );
  }

  const { status, pagesCrawled, totalPagesFound, currentUrl, percentComplete } = progress;

  return (
    <div className="w-full max-w-xl">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {statusMessages[status] || status}
          </span>
          <span className="text-sm font-medium text-primary-600">
            {percentComplete}%
          </span>
        </div>
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-600 rounded-full transition-all duration-300"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-2xl font-bold text-primary-600">{pagesCrawled}</p>
          <p className="text-sm text-gray-500">Pages Crawled</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-2xl font-bold text-gray-700">{totalPagesFound}</p>
          <p className="text-sm text-gray-500">Pages Found</p>
        </div>
      </div>

      {/* Current URL */}
      {currentUrl && status === 'crawling' && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Currently crawling:</p>
          <p className="text-sm text-gray-700 truncate">{currentUrl}</p>
        </div>
      )}

      {/* Loading animation */}
      {status !== 'complete' && status !== 'failed' && (
        <div className="flex justify-center mt-6">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}

      {/* Error message */}
      {progress.error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{progress.error}</p>
        </div>
      )}
    </div>
  );
}
