import React from 'react';
import { BiDownload, BiCopy } from 'react-icons/bi';
import { HeadingToolbarProps, formatHeadingsForCSV, formatHeadingsForCopy } from './types';
import Button from '../common/Button';
import QuickMetrics from './QuickMetrics';
import { logger } from '../../utils/logger';
import { buildExportSlug } from '../overview/utils/urlUtils';

const HEADING_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

const LoadingSkeleton: React.FC = () => (
  <div className="flex items-center justify-between animate-pulse">
    <div className="flex items-center gap-4">
      {HEADING_TAGS.map((tag) => (
        <div key={tag} className="flex flex-col items-center gap-1">
          <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-6 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ))}
    </div>
    <div className="flex items-center gap-2">
      <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  </div>
);

const HeadingToolbar: React.FC<HeadingToolbarProps> = ({ headings, loading, headingCounts }) => {
  const handleCopy = React.useCallback(() => {
    if (!headings?.length) return;
    navigator.clipboard
      .writeText(formatHeadingsForCopy(headings))
      .then(() => logger.log('Headings', 'Copied headings to clipboard', 'info'))
      .catch((error: unknown) =>
        logger.log(
          'Headings',
          'Failed to copy headings: ' + (error instanceof Error ? error.message : String(error)),
          'error'
        )
      );
  }, [headings]);

  const handleExport = React.useCallback(() => {
    if (!headings?.length) return;

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      try {
        const fullUrl = tab.url || '';
        const slug = buildExportSlug(fullUrl);

        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');

        const csvContent = formatHeadingsForCSV(headings);
        const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
          type: 'text/csv;charset=utf-8;',
        });
        const link = document.createElement('a');
        const blobUrl = URL.createObjectURL(blob);
        link.href = blobUrl;

        const filename = `headings-${slug}-${date}-${time}.csv`;
        link.download = filename;

        link.click();
        URL.revokeObjectURL(blobUrl);
        logger.log('Headings', `Exported ${headings.length} headings to CSV`, 'info');
      } catch (error: unknown) {
        logger.log(
          'Headings',
          'Failed to export headings: ' + (error instanceof Error ? error.message : String(error)),
          'error'
        );
      }
    });
  }, [headings]);

  if (loading) {
    return (
      <div className="flex-shrink-0 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <QuickMetrics headingCounts={headingCounts} loading={loading} />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            onClick={handleCopy}
            disabled={!!loading}
            title="Copy Headings"
            aria-label="Copy Headings"
            className="inline-flex items-center gap-1 px-2 mr-0"
          >
            <BiCopy className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={handleExport}
            disabled={!!loading}
            title="Export as CSV"
            aria-label="Export as CSV"
            className="inline-flex items-center gap-1 px-2 mr-3"
          >
            <BiDownload className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(HeadingToolbar);
