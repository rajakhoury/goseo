import React, { useState, useMemo } from 'react';
import { BiChevronDown, BiChevronUp, BiCode } from 'react-icons/bi';
import { ScriptTag } from '../types';
import { analyzeScript } from '../utils/scriptAnalysis';

export type SortField = 'type' | 'src';
export type SortDirection = 'asc' | 'desc';

interface ScriptAnalysisTableProps {
  scripts: ScriptTag[];
}
export const ScriptAnalysisTable: React.FC<ScriptAnalysisTableProps> = ({ scripts }) => {
  const [sortField, setSortField] = useState<SortField>('type');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const analyzedScripts = useMemo(() => {
    return scripts.map((script, index) => ({
      script,
      analysis: analyzeScript(script),
      index,
    }));
  }, [scripts]);

  const filteredScripts = useMemo(() => analyzedScripts, [analyzedScripts]);

  const sortedScripts = useMemo(() => {
    const sorted = [...filteredScripts];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'type': {
          const aType = a.script.src ? 0 : 1;
          const bType = b.script.src ? 0 : 1;
          comparison = aType - bType;
          break;
        }
        case 'src':
          comparison = (a.script.src || '').localeCompare(b.script.src || '');
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredScripts, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleRow = (index: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <BiChevronUp className="w-4 h-4" />
    ) : (
      <BiChevronDown className="w-4 h-4" />
    );
  };

  return (
    <div className="space-y-2">
      <div className="overflow-hidden">
        <div className="grid grid-cols-12 gap-2 py-2 px-4 bg-gray-50 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300">
          <button
            onClick={() => handleSort('type')}
            className="col-span-3 flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100"
          >
            Type
            <SortIcon field="type" />
          </button>
          <button
            onClick={() => handleSort('src')}
            className="col-span-9 flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100"
          >
            Source / Description
            <SortIcon field="src" />
          </button>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {sortedScripts.map(({ script, analysis, index }) => (
            <div key={index}>
              <button
                onClick={() => toggleRow(index)}
                className="w-full grid grid-cols-12 gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
              >
                <div className="col-span-3 text-xs text-gray-900 dark:text-gray-100">
                  {script.src ? (
                    <span className="flex items-center gap-1">
                      {script.async && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          async
                        </span>
                      )}
                      {script.defer && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                          defer
                        </span>
                      )}
                      {(script.type || '').toLowerCase().includes('module') && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                          module
                        </span>
                      )}
                      {!script.async &&
                        !script.defer &&
                        !(script.type || '').toLowerCase().includes('module') && (
                          <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                            blocking
                          </span>
                        )}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <BiCode className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300">
                        inline
                      </span>
                    </span>
                  )}
                </div>

                <div className="col-span-9 text-xs text-gray-700 dark:text-gray-300 truncate">
                  {analysis.description}
                </div>
              </button>

              {expandedRows.has(index) && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                  <div className="space-y-2 text-xs">
                    {script.src && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Source:{' '}
                        </span>
                        <code className="font-mono text-[11px] bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 px-1 py-0.5 rounded break-all">
                          {script.src}
                        </code>
                      </div>
                    )}

                    {analysis.library && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Library:{' '}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {analysis.library} {analysis.version && `v${analysis.version}`}
                        </span>
                      </div>
                    )}

                    {script.type && script.type !== 'text/javascript' && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Type: </span>
                        <code className="font-mono text-[11px] bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 px-1 py-0.5 rounded">
                          {script.type}
                        </code>
                      </div>
                    )}

                    {script.integrity && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Integrity:{' '}
                        </span>
                        <code className="font-mono text-[11px] bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 px-1 py-0.5 rounded">
                          {script.integrity}
                        </code>
                      </div>
                    )}

                    {script.crossOrigin && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">CORS: </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {script.crossOrigin}
                        </span>
                      </div>
                    )}

                    {!script.src && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Content:{' '}
                        </span>
                        <code className="font-mono text-[11px] bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 px-1 py-0.5 rounded block mt-1 max-h-32 overflow-auto">
                          {script.raw.substring(0, 500)}
                          {script.raw.length > 500 && '...'}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {sortedScripts.length === 0 && (
        <div className="text-center text-sm py-8 text-gray-500 dark:text-gray-400">
          No scripts match the selected filters
        </div>
      )}
    </div>
  );
};

export default ScriptAnalysisTable;
