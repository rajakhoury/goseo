import React, { useMemo } from 'react';
import { BiChevronDown, BiChevronUp } from 'react-icons/bi';
import MetricCard from '../components/MetricCard';
import StructureMetrics, { Metric } from '../components/StructureMetrics';
import Button from '../../common/Button';
import { AnalysisResult } from '../types';

interface ResourcesCardProps {
  data: AnalysisResult;
}

export function ResourcesCard({ data }: ResourcesCardProps) {
  const resources = data.pageAnalysis.resources;
  const [rawMode, setRawMode] = React.useState(false);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

  const counts = useMemo(() => {
    return {
      preconnect: resources.preconnect.length,
      preload: resources.preload.length,
      prefetch: resources.prefetch.length,
      dnsPrefetch: resources.dnsPrefetch.length,
      prerender: resources.prerender.length,
    };
  }, [resources]);

  const metrics: Metric[] = [
    { label: 'Preconnect', value: counts.preconnect, tooltip: 'link[rel="preconnect"] hints' },
    { label: 'Preload', value: counts.preload, tooltip: 'link[rel="preload"] hints' },
    { label: 'Prefetch', value: counts.prefetch, tooltip: 'link[rel="prefetch"] hints' },
    { label: 'DNS Prefetch', value: counts.dnsPrefetch, tooltip: 'link[rel="dns-prefetch"] hints' },
    { label: 'Prerender', value: counts.prerender, tooltip: 'link[rel="prerender"] hints' },
  ];

  const rows = useMemo(() => {
    const toRows = (type: string, list: { href: string }[]) =>
      list.map((item) => ({ type, href: item.href }));
    return [
      ...toRows('preconnect', resources.preconnect),
      ...toRows('preload', resources.preload),
      ...toRows('prefetch', resources.prefetch),
      ...toRows('dns-prefetch', resources.dnsPrefetch),
      ...toRows('prerender', resources.prerender),
    ];
  }, [resources]);

  const sortedRows = useMemo(() => {
    const list = [...rows];
    list.sort((a, b) => {
      const cmp = a.type.localeCompare(b.type);
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [rows, sortDirection]);

  const handleSort = () => {
    setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
  };

  const getTypeChipClass = (type: string) => {
    switch (type) {
      case 'preconnect':
        return 'px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'preload':
        return 'px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'prefetch':
        return 'px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
      case 'dns-prefetch':
        return 'px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300';
      case 'prerender':
        return 'px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      default:
        return 'px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300';
    }
  };

  const getTypeTextClass = (type: string) => {
    switch (type) {
      case 'preconnect':
        return 'text-blue-700 dark:text-blue-300';
      case 'preload':
        return 'text-purple-700 dark:text-purple-300';
      case 'prefetch':
        return 'text-indigo-700 dark:text-indigo-300';
      case 'dns-prefetch':
        return 'text-cyan-700 dark:text-cyan-300';
      case 'prerender':
        return 'text-emerald-700 dark:text-emerald-300';
      default:
        return 'text-gray-700 dark:text-gray-300';
    }
  };

  const rawLines = useMemo(() => {
    return rows.map((r) => `${r.type}: ${r.href}`);
  }, [rows]);

  if (rows.length === 0) {
    return null;
  }

  return (
    <MetricCard
      contentClassName="p-0"
      title="Resources"
      tooltip="Resource hint link tags"
      renderHeader={
        <div className="flex items-center justify-between">
          <h2
            className="text-sm font-semibold text-gray-900 dark:text-gray-100"
            title="Counts and validations for resource hint link tags"
          >
            Resource Hints
          </h2>
          <Button size="xs" variant="outline" onClick={() => setRawMode((v) => !v)}>
            {rawMode ? 'VIEW' : 'RAW'}
          </Button>
        </div>
      }
    >
      <div className="space-y-2 p-0">
        {!rawMode && <StructureMetrics metrics={metrics} className="grid-cols-5 gap-1 p-2" />}

        {rawMode ? (
          <div className="font-mono text-[11px] leading-5 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-2 overflow-auto">
            <div className="space-y-1">
              {rawLines.map((line, idx) => {
                const sep = line.indexOf(': ');
                const type = sep >= 0 ? line.slice(0, sep) : '';
                const value = sep >= 0 ? line.slice(sep + 2) : line;
                return (
                  <div key={idx} className="flex items-start gap-1">
                    {type && <span className={getTypeTextClass(type)}>{type}</span>}
                    {type && <span className="text-gray-500 dark:text-gray-400">:</span>}
                    <span className="text-gray-800 dark:text-gray-100 break-all whitespace-pre-wrap">
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="!mt-0">
            <div className="overflow-hidden mt-0">
              <div className="grid grid-cols-12 gap-2 py-2 px-4 bg-gray-50 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300">
                <button
                  onClick={handleSort}
                  className="col-span-3 flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  Type{' '}
                  {sortDirection === 'asc' ? (
                    <BiChevronUp className="w-4 h-4" />
                  ) : (
                    <BiChevronDown className="w-4 h-4" />
                  )}
                </button>
                <div className="col-span-9">URL</div>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {sortedRows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 p-2 text-left">
                    <div className="col-span-3 text-xs text-gray-900 dark:text-gray-100">
                      <span className={getTypeChipClass(row.type)}>{row.type}</span>
                    </div>
                    <div className="col-span-9 text-xs text-gray-700 dark:text-gray-300 truncate">
                      {row.href}
                    </div>
                  </div>
                ))}
                {rows.length === 0 && (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-xs">
                    No resource hints found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MetricCard>
  );
}

export default React.memo(ResourcesCard);
