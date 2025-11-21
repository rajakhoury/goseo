import React, { useMemo } from 'react';

import MetricCard from '../components/MetricCard';
import Button from '../../common/Button';
import ScriptAnalysisTable from '../components/ScriptAnalysisTable';
import { AnalysisResult, ScriptTag } from '../types';

interface AllScriptsCardProps {
  data: AnalysisResult;
}

export function AllScriptsCard({ data }: AllScriptsCardProps) {
  const { script } = data.pageAnalysis.elements;
  const [rawMode, setRawMode] = React.useState(false);

  const allScripts: ScriptTag[] = useMemo(() => {
    return [
      ...script.byType.async,
      ...script.byType.defer,
      ...script.byType.inline,
      ...script.byType.external,
    ];
  }, [script]);

  const rawRows = useMemo(() => {
    const limit = 400;
    return allScripts.map((s) => {
      const isExternal = !!s.src;
      const typeLower = (s.type || '').toLowerCase();
      const flags: string[] = [];
      if (isExternal) {
        if (!s.async && !s.defer && !typeLower.includes('module')) flags.push('blocking');
      }

      const attrs: { name: string; value: string }[] = [];
      if (s.src) attrs.push({ name: 'src', value: s.src });
      if (s.type && s.type !== 'text/javascript') attrs.push({ name: 'type', value: s.type });
      if (s.integrity) attrs.push({ name: 'integrity', value: s.integrity });
      if (s.crossOrigin) attrs.push({ name: 'crossorigin', value: s.crossOrigin });

      const booleanAttrs: string[] = [];
      if (s.async) booleanAttrs.push('async');
      if (s.defer) booleanAttrs.push('defer');

      let inner = '';
      if (!isExternal) {
        const raw = s.raw || '';
        inner = raw.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
        inner = inner.replace(/\s+/g, ' ').trim();
      }
      const truncated = inner.length > limit;
      const content = !isExternal ? (truncated ? inner.slice(0, limit) : inner) : '';

      return {
        kind: isExternal ? 'external' : 'inline',
        attrs,
        booleanAttrs,
        flags,
        content,
        truncated,
      };
    });
  }, [allScripts]);

  const getBooleanAttrClass = (b: string) =>
    b === 'async'
      ? 'text-blue-700 dark:text-blue-300 ml-1'
      : 'text-purple-700 dark:text-purple-300 ml-1';

  if (allScripts.length === 0) {
    return null;
  }

  return (
    <MetricCard
      contentClassName="p-0"
      title={`All Scripts (${allScripts.length})`}
      tooltip="All scripts on the page"
      renderHeader={
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            All Scripts ({allScripts.length})
          </h2>
          <Button size="xs" variant="outline" onClick={() => setRawMode((v) => !v)}>
            {rawMode ? 'VIEW' : 'RAW'}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        {rawMode ? (
          <div className="font-mono text-[11px] leading-5 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-2 overflow-auto">
            <div className="space-y-1">
              {rawRows.map((row, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-blue-700 dark:text-blue-300">&lt;script</span>
                    {row.booleanAttrs.map((b, i) => (
                      <span key={`b-${i}`} className={getBooleanAttrClass(b)}>
                        {b}
                      </span>
                    ))}
                    {row.attrs.map((a, i) => (
                      <span key={i} className="ml-1 whitespace-nowrap">
                        <span className="text-indigo-700 dark:text-indigo-300">{a.name}</span>
                        <span className="text-gray-500 dark:text-gray-400">=</span>
                        <span className="text-gray-800 dark:text-gray-100">
                          &quot;{a.value}&quot;
                        </span>
                      </span>
                    ))}
                    <span className="text-blue-700 dark:text-blue-300">&gt;</span>
                  </div>
                  {row.kind === 'inline' && (
                    <div className="ml-2 text-gray-800 dark:text-gray-100 break-words">
                      {row.content}
                      {row.truncated && (
                        <span className="ml-1 text-[13px] font-semibold text-brand-600 dark:text-brand-400">
                          …
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="text-blue-700 dark:text-blue-300">&lt;/script&gt;</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="">
            <ScriptAnalysisTable scripts={allScripts} />
          </div>
        )}
      </div>
    </MetricCard>
  );
}

export default React.memo(AllScriptsCard);
