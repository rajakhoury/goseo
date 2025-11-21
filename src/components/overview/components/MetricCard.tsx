import type { ReactNode } from 'react';

interface MetricCardProps {
  title: string | ReactNode;
  tooltip: string;
  children: ReactNode;
  renderHeader?: ReactNode;
  hideHeader?: boolean;
  contentClassName?: string;
}

export default function MetricCard({
  title,
  tooltip,
  children,
  renderHeader,
  hideHeader = false,
  contentClassName,
}: MetricCardProps) {
  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700"
      role="region"
      aria-label={typeof title === 'string' ? title : 'Metric Card'}
    >
      {!hideHeader && (
        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
          {renderHeader ? (
            renderHeader
          ) : (
            <h2
              className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1"
              title={tooltip}
              id="metric-card-title"
            >
              {title}
            </h2>
          )}
        </div>
      )}
      <div className={contentClassName || 'p-3'} aria-labelledby="metric-card-title">
        {children}
      </div>
    </div>
  );
}
