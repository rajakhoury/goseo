import React, { useState } from 'react';
import { FilterOptions, SortField, ImageToolbarProps } from './types';
import Button from '../common/Button';
import ListBox from '../common/ListBox';
import Checkbox from '../common/Checkbox';
import {
  BiDownload,
  BiSortUp,
  BiSortDown,
  BiArchive,
  BiFilter,
  BiX,
  BiChevronDown,
  BiChevronUp,
} from 'react-icons/bi';

interface SortOption {
  id: SortField;
  name: string;
}

const sortOptions: readonly SortOption[] = [
  { id: 'appearance', name: 'DOM Order' },
  { id: 'url', name: 'URL' },
  { id: 'dimensions', name: 'Dimensions' },
  { id: 'fileSize', name: 'File Size' },
  { id: 'missingAlt', name: 'Missing ALT' },
  { id: 'optimized', name: 'Next-Gen' },
  { id: 'lazy', name: 'Lazy Candidates' },
  { id: 'missingDimensions', name: 'Missing Dimensions' },
  { id: 'format', name: 'Format' },
  { id: 'oversized', name: 'Oversized (>100KB)' },
] as const;

const DEFAULT_SORT_DIRECTION: Record<SortField, 'asc' | 'desc'> = {
  appearance: 'asc',
  url: 'asc',
  dimensions: 'asc',
  fileSize: 'desc',
  missingAlt: 'asc',
  optimized: 'asc',
  lazy: 'desc',
  missingDimensions: 'asc',
  format: 'asc',
  oversized: 'desc',
};

const ImageToolbar: React.FC<ImageToolbarProps> = ({
  filters,
  sort,
  onFilterChange,
  onSortChange,
  onExport,
  onDownloadImages,
  disabled,
  filterCounts,
}) => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFiltersCount = Object.values(filters || {}).filter(Boolean).length;

  const clearFilters = () => {
    onFilterChange({
      ...filters,
      showMissingAlt: false,
      showNeedsOptimization: false,
      showOversized: false,
      showMissingDimensions: false,
      showLazyCandidates: false,
    });
  };
  const handleSortFieldChange = (option: SortOption) => {
    const dir = DEFAULT_SORT_DIRECTION[option.id] || 'asc';
    onSortChange({ field: option.id, direction: dir });
  };

  const toggleSortDirection = () => {
    onSortChange({
      ...sort,
      direction: sort.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  const handleFilterChange = (key: keyof FilterOptions, value: boolean) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="mt-3 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-md">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <div className="flex items-center gap-2">
          {disabled ? (
            <>
              <div className="h-4 w-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </>
          ) : (
            <>
              <span className="font-medium text-gray-500 dark:text-gray-400 hidden">Sort</span>
              <ListBox
                options={sortOptions}
                value={sortOptions.find((opt) => opt.id === sort.field) || sortOptions[0]}
                onChange={handleSortFieldChange}
                disabled={disabled}
                className="w-48"
                size="sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSortDirection}
                disabled={disabled}
                className="inline-flex items-center gap-1 px-2"
                aria-label={sort.direction === 'asc' ? 'Sort ascending' : 'Sort descending'}
              >
                {sort.direction === 'asc' ? (
                  <BiSortUp className="h-4 w-4" />
                ) : (
                  <BiSortDown className="h-4 w-4" />
                )}
              </Button>

              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 m-0" />

              <Button
                variant="outline"
                size="sm"
                onClick={() => setFiltersOpen((v) => !v)}
                disabled={disabled}
                className="inline-flex items-center gap-1"
                title={filtersOpen ? 'Hide filters' : 'Show filters'}
                aria-label={filtersOpen ? 'Hide filters' : 'Show filters'}
                aria-expanded={filtersOpen}
              >
                <BiFilter className="h-4 w-4" />
                {activeFiltersCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded font-bold bg-gray-100 text-gray-700 dark:bg-green-900/40 dark:text-green-300 text-[11px] leading-[1]">
                    {activeFiltersCount}
                  </span>
                )}
                {filtersOpen ? (
                  <BiChevronUp className="h-4 w-4 ml-0.5" />
                ) : (
                  <BiChevronDown className="h-4 w-4 ml-0.5" />
                )}
              </Button>
              {activeFiltersCount > 0 && !disabled && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="ml-0 cursor-pointer text-gray-500 hover:text-gray-700"
                  title="Clear filters"
                  aria-label="Clear filters"
                >
                  <BiX className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>

        <div className="flex items-center">
          {disabled ? (
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ) : (
            <>
              <Button
                variant="outline"
                size="xs"
                onClick={onExport}
                disabled={disabled}
                title="Export CSV"
                aria-label="Export CSV"
                className="inline-flex items-center gap-1 px-2 mr-2"
              >
                <BiDownload className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={onDownloadImages}
                disabled={disabled}
                title="Download ZIP"
                aria-label="Download ZIP"
                className="inline-flex items-center gap-1 px-2 mr-3"
              >
                <BiArchive className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
      <div className={`${filtersOpen ? 'mt-2' : 'hidden'}`}>
        {disabled ? (
          <div className="flex items-center gap-2">
            <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        ) : (
          <div className="px-1 py-1 border-t border-gray-100 dark:border-gray-800">
            <div className="grid grid-cols-3 gap-3 pt-2">
              <Checkbox
                label="Missing ALT"
                checked={filters.showMissingAlt}
                onChange={(checked) => handleFilterChange('showMissingAlt', checked)}
                disabled={disabled || (filterCounts && filterCounts.missingAlt === 0)}
                className="ml-0"
              />
              <Checkbox
                label="Needs Optimization"
                checked={filters.showNeedsOptimization}
                onChange={(checked) => handleFilterChange('showNeedsOptimization', checked)}
                disabled={disabled || (filterCounts && filterCounts.needsOptimization === 0)}
              />
              <Checkbox
                label="Oversized"
                checked={!!filters.showOversized}
                onChange={(checked) => handleFilterChange('showOversized', checked)}
                disabled={disabled || (filterCounts && filterCounts.oversized === 0)}
              />
              <Checkbox
                label="Missing Dimensions"
                checked={!!filters.showMissingDimensions}
                onChange={(checked) => handleFilterChange('showMissingDimensions', checked)}
                disabled={disabled || (filterCounts && filterCounts.missingDimensions === 0)}
              />
              <Checkbox
                label="Lazy Candidates"
                checked={!!filters.showLazyCandidates}
                onChange={(checked) => handleFilterChange('showLazyCandidates', checked)}
                disabled={disabled || (filterCounts && filterCounts.lazyCandidates === 0)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageToolbar;
