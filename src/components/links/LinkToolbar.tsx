import React, { useCallback } from 'react';
import { FilterOptions, LinkData } from './types';
import Button from '../common/Button';
import Checkbox from '../common/Checkbox';
import { BiDownload, BiCopy } from 'react-icons/bi';

interface LinkToolbarProps {
  loading?: boolean;
  filters?: FilterOptions;
  links?: LinkData[];
  onFilterChange?: (filters: FilterOptions) => void;
  onCopy?: () => void;
  onExport?: () => void;
  showBrokenFilter?: boolean;
}

const DEFAULT_FILTERS: FilterOptions = {
  internal: false,
  external: false,
  nofollow: false,
  missingTitle: false,
  broken: false,
  communication: false,
};

const LinkToolbar: React.FC<LinkToolbarProps> = ({
  loading = false,
  filters = DEFAULT_FILTERS,
  onFilterChange,
  onCopy,
  onExport,
  showBrokenFilter = false,
}: LinkToolbarProps) => {
  const handleFilterChange = useCallback(
    (key: keyof FilterOptions, value: boolean) => {
      if (loading || !onFilterChange) return;

      const updatedFilters = {
        ...filters,
        [key]: value,
      };

      onFilterChange(updatedFilters);
    },
    [loading, filters, onFilterChange]
  );

  const handleCopy = useCallback(() => {
    if (loading || !onCopy) return;
    onCopy();
  }, [loading, onCopy]);

  const handleExport = useCallback(() => {
    if (loading || !onExport) return;
    onExport();
  }, [loading, onExport]);

  if (loading) {
    return (
      <div className="mt-3 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-md">
        <div className="flex flex-wrap items-center justify-between gap-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-[72px] h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="w-[72px] h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="w-[80px] h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="w-[96px] h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="w-[72px] h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="w-[72px] h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mr-2" />
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mr-3" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-md">
      <div className="flex flex-wrap items-center justify-between gap-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4">
            <Checkbox
              label="Internal"
              checked={!!filters.internal}
              onChange={(checked) => handleFilterChange('internal', checked)}
              disabled={loading}
              className="ml-1"
            />
            <Checkbox
              label="External"
              checked={!!filters.external}
              onChange={(checked) => handleFilterChange('external', checked)}
              disabled={loading}
              className="ml-2"
            />
            <Checkbox
              label="NoFollow"
              checked={!!filters.nofollow}
              onChange={(checked) => handleFilterChange('nofollow', checked)}
              disabled={loading}
              className="ml-2"
            />
            <Checkbox
              label="Missing Title"
              checked={!!filters.missingTitle}
              onChange={(checked) => handleFilterChange('missingTitle', checked)}
              disabled={loading}
              className="ml-2"
            />
            <Checkbox
              label="COMM."
              checked={!!filters.communication}
              onChange={(checked) => handleFilterChange('communication', checked)}
              disabled={loading}
              className="ml-2"
            />
            {showBrokenFilter && (
              <Checkbox
                label="Broken"
                checked={!!filters.broken}
                onChange={(checked) => handleFilterChange('broken', checked)}
                disabled={loading}
                className="ml-2"
              />
            )}
          </div>
        </div>

        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 ml-2 mr-2 hidden" role="separator" />

        <div className="flex items-center gap-2">
          {onCopy && (
            <Button
              variant="outline"
              size="xs"
              onClick={handleCopy}
              disabled={loading}
              title="Copy URLs"
              aria-label="Copy URLs"
              className="inline-flex items-center gap-1 px-2 mr-0"
            >
              <BiCopy className="h-4 w-4" />
            </Button>
          )}
          {onExport && (
            <Button
              variant="outline"
              size="xs"
              onClick={handleExport}
              disabled={loading}
              title="Export as CSV"
              aria-label="Export as CSV"
              className="inline-flex items-center gap-1 px-2 mr-3"
            >
              <BiDownload className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(LinkToolbar);
