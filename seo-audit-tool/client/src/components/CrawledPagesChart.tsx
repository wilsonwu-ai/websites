import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CrawledPages } from '../types/audit';

interface CrawledPagesChartProps {
  data: CrawledPages;
}

const COLORS = {
  healthy: '#10B981',
  withIssues: '#F59E0B',
  redirects: '#3B82F6',
  broken: '#EF4444',
};

export default function CrawledPagesChart({ data }: CrawledPagesChartProps) {
  const chartData = [
    { name: 'Healthy', value: data.healthy, color: COLORS.healthy },
    { name: 'With Issues', value: data.withIssues, color: COLORS.withIssues },
    { name: 'Redirects', value: data.redirects, color: COLORS.redirects },
    { name: 'Broken', value: data.broken, color: COLORS.broken },
  ].filter(item => item.value > 0);

  const total = data.total;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Crawled Pages</h3>

      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Pie chart */}
        <div className="w-48 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [
                  `${value} (${((value / total) * 100).toFixed(1)}%)`,
                  'Pages'
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{item.value}</span>
                <span className="text-sm text-gray-500">
                  ({((item.value / total) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
          ))}
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total</span>
              <span className="text-sm font-bold text-gray-900">{total} pages</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
