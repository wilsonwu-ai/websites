import { useState } from 'react';
import { PageData } from '../types/audit';

interface PagesListProps {
  pages: PageData[];
  showAll?: boolean;
}

export default function PagesList({ pages, showAll = false }: PagesListProps) {
  const [expandedPage, setExpandedPage] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'healthy' | 'issues' | 'broken'>('all');

  const categorizedPages = pages.map(page => {
    const hasIssues = page.issues && page.issues.length > 0;
    const isBroken = page.statusCode >= 400;
    const isRedirect = page.statusCode >= 300 && page.statusCode < 400;

    return {
      ...page,
      category: isBroken ? 'broken' : isRedirect ? 'redirect' : hasIssues ? 'issues' : 'healthy',
    };
  });

  const filteredPages = filter === 'all'
    ? categorizedPages
    : categorizedPages.filter(p => p.category === filter);

  const displayedPages = showAll ? filteredPages : filteredPages.slice(0, 20);

  const counts = {
    all: pages.length,
    healthy: categorizedPages.filter(p => p.category === 'healthy').length,
    issues: categorizedPages.filter(p => p.category === 'issues').length,
    broken: categorizedPages.filter(p => p.category === 'broken').length,
  };

  const toggleExpand = (url: string) => {
    setExpandedPage(expandedPage === url ? null : url);
  };

  const getStatusColor = (code: number) => {
    if (code >= 200 && code < 300) return 'text-green-600';
    if (code >= 300 && code < 400) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'healthy':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Healthy</span>;
      case 'issues':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">Has Issues</span>;
      case 'broken':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Broken</span>;
      case 'redirect':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Redirect</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Filter tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        <button
          className={`flex-1 min-w-[100px] px-4 py-3 text-sm font-medium whitespace-nowrap ${
            filter === 'all' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setFilter('all')}
        >
          All ({counts.all})
        </button>
        <button
          className={`flex-1 min-w-[100px] px-4 py-3 text-sm font-medium whitespace-nowrap ${
            filter === 'healthy' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setFilter('healthy')}
        >
          Healthy ({counts.healthy})
        </button>
        <button
          className={`flex-1 min-w-[100px] px-4 py-3 text-sm font-medium whitespace-nowrap ${
            filter === 'issues' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setFilter('issues')}
        >
          With Issues ({counts.issues})
        </button>
        <button
          className={`flex-1 min-w-[100px] px-4 py-3 text-sm font-medium whitespace-nowrap ${
            filter === 'broken' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setFilter('broken')}
        >
          Broken ({counts.broken})
        </button>
      </div>

      {/* Pages list */}
      <div className="divide-y divide-gray-200">
        {displayedPages.map((page) => (
          <div key={page.url}>
            <div
              className="px-4 py-4 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleExpand(page.url)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <svg
                    className={`w-4 h-4 flex-shrink-0 transition-transform ${
                      expandedPage === page.url ? 'rotate-90' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <p className="text-sm text-gray-700 truncate">{page.url}</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className={`text-sm font-medium ${getStatusColor(page.statusCode)}`}>
                    {page.statusCode}
                  </span>
                  {getCategoryBadge(page.category)}
                </div>
              </div>
            </div>

            {/* Expanded details */}
            {expandedPage === page.url && (
              <div className="px-4 py-4 bg-gray-50 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Title</p>
                    <p className="text-gray-900">{page.title || 'No title'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Response Time</p>
                    <p className="text-gray-900">{page.responseTime}ms</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Meta Description</p>
                    <p className="text-gray-900 truncate">{page.metaDescription || 'No description'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Page Size</p>
                    <p className="text-gray-900">{(page.pageSize / 1024).toFixed(1)} KB</p>
                  </div>
                  <div>
                    <p className="text-gray-500">H1 Tags</p>
                    <p className="text-gray-900">{page.h1Count}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Images</p>
                    <p className="text-gray-900">
                      {page.images.total} total, {page.images.withoutAlt} missing alt
                    </p>
                  </div>
                </div>

                {page.issues && page.issues.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Issues on this page:</p>
                    <ul className="space-y-1">
                      {page.issues.map((issue, idx) => (
                        <li
                          key={idx}
                          className={`text-sm ${
                            issue.type === 'error' ? 'text-red-600' : 'text-orange-600'
                          }`}
                        >
                          • {issue.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {!showAll && filteredPages.length > 20 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-center">
          <span className="text-sm text-gray-500">
            Showing 20 of {filteredPages.length} pages
          </span>
        </div>
      )}
    </div>
  );
}
