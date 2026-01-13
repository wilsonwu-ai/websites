import { useState } from 'react';
import { IssueGroup } from '../types/audit';

interface IssuesListProps {
  errors: IssueGroup[];
  warnings: IssueGroup[];
  showAll?: boolean;
}

export default function IssuesList({ errors, warnings, showAll = false }: IssuesListProps) {
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'errors' | 'warnings'>('all');

  const allIssues = [
    ...errors.map(e => ({ ...e, issueType: 'error' as const })),
    ...warnings.map(w => ({ ...w, issueType: 'warning' as const })),
  ].sort((a, b) => b.count - a.count);

  const filteredIssues = filter === 'all'
    ? allIssues
    : allIssues.filter(i => i.issueType === (filter === 'errors' ? 'error' : 'warning'));

  const displayedIssues = showAll ? filteredIssues : filteredIssues.slice(0, 10);

  const toggleExpand = (code: string) => {
    setExpandedIssue(expandedIssue === code ? null : code);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Filter tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`flex-1 px-4 py-3 text-sm font-medium ${
            filter === 'all' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setFilter('all')}
        >
          All Issues ({allIssues.length})
        </button>
        <button
          className={`flex-1 px-4 py-3 text-sm font-medium ${
            filter === 'errors' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setFilter('errors')}
        >
          Errors ({errors.length})
        </button>
        <button
          className={`flex-1 px-4 py-3 text-sm font-medium ${
            filter === 'warnings' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setFilter('warnings')}
        >
          Warnings ({warnings.length})
        </button>
      </div>

      {/* Issues table */}
      <div className="overflow-x-auto">
        <table className="w-full issues-table">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Issue
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Type
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Count
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayedIssues.map((issue) => (
              <>
                <tr
                  key={issue.code}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleExpand(issue.code)}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          expandedIssue === issue.code ? 'rotate-90' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-900">{issue.title}</p>
                        <p className="text-sm text-gray-500">{issue.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        issue.issueType === 'error'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {issue.issueType === 'error' ? 'Error' : 'Warning'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="font-semibold text-gray-900">{issue.count}</span>
                  </td>
                </tr>
                {/* Expanded row showing URLs */}
                {expandedIssue === issue.code && (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 bg-gray-50">
                      <div className="pl-6">
                        <p className="text-sm font-medium text-gray-700 mb-2">Affected URLs:</p>
                        <ul className="space-y-1 max-h-48 overflow-y-auto">
                          {issue.urls.slice(0, 20).map((url, idx) => (
                            <li key={idx} className="text-sm text-gray-600 truncate">
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-primary-600 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {url}
                              </a>
                            </li>
                          ))}
                          {issue.urls.length > 20 && (
                            <li className="text-sm text-gray-500 italic">
                              ...and {issue.urls.length - 20} more
                            </li>
                          )}
                        </ul>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {!showAll && filteredIssues.length > 10 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-center">
          <span className="text-sm text-gray-500">
            Showing 10 of {filteredIssues.length} issues
          </span>
        </div>
      )}
    </div>
  );
}
