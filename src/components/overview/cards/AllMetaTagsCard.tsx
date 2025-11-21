import React, { useState, useMemo, useRef } from 'react';
import { BiSearch, BiError, BiCheckCircle, BiInfoCircle } from 'react-icons/bi';
import MetricCard from '../components/MetricCard';
import Input from '../../common/Input';
import Button from '../../common/Button';
import MetaTagTree from '../components/MetaTagTree';
import { categorizeMeta, validateMetaTags } from '../utils/metaCategories';
import { AnalysisResult, MetaTag } from '../types';

interface AllMetaTagsCardProps {
  data: AnalysisResult;
}

export function AllMetaTagsCard({ data }: AllMetaTagsCardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showValidation, setShowValidation] = useState(true);
  const [rawMode, setRawMode] = useState(false);
  const treeRef = useRef<{ expandAll: () => void; collapseAll: () => void }>(null);

  const { meta } = data.pageAnalysis.elements;

  const allMetaTags: MetaTag[] = useMemo(() => {
    return [...meta.standard, ...meta.opengraph, ...meta.twitter, ...meta.other];
  }, [meta]);

  const categories = useMemo(() => {
    return categorizeMeta(allMetaTags);
  }, [allMetaTags]);

  const validationIssues = useMemo(() => {
    return validateMetaTags(allMetaTags);
  }, [allMetaTags]);

  const rawLines = useMemo(() => {
    return data.pageAnalysis.elements.meta.raw || [];
  }, [data.pageAnalysis.elements.meta.raw]);

  const parseTag = (
    html: string
  ): { tag: string; attrs: { name: string; value: string }[]; inner: string } => {
    const tagMatch = html.match(/<\s*([a-zA-Z0-9:-]+)/);
    const tag = tagMatch ? tagMatch[1].toLowerCase() : 'meta';
    const attrs: { name: string; value: string }[] = [];
    const attrRegex = /([a-zA-Z-:]+)\s*=\s*"([^"]*)"/g;
    let m: RegExpExecArray | null;
    while ((m = attrRegex.exec(html)) !== null) {
      attrs.push({ name: m[1], value: m[2] });
    }
    let inner = '';
    if (tag === 'title') {
      const openEnd = html.indexOf('>');
      const closeStart = html.toLowerCase().lastIndexOf('</title>');
      if (openEnd >= 0 && closeStart > openEnd) {
        inner = html
          .slice(openEnd + 1, closeStart)
          .replace(/\s+/g, ' ')
          .trim();
      }
    }
    return { tag, attrs, inner };
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <BiError className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case 'warning':
        return <BiError className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
      case 'info':
        return <BiInfoCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      default:
        return <BiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700';
    }
  };

  if (allMetaTags.length === 0 && rawLines.length === 0) {
    return null;
  }

  return (
    <MetricCard
      contentClassName={rawMode ? 'p-0' : 'p-3'}
      title={`All Meta Tags (${allMetaTags.length})`}
      tooltip="Comprehensive view of all meta tags on the page, organized by category"
      renderHeader={
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            All Meta Tags ({allMetaTags.length})
          </h2>
          <Button size="xs" variant="outline" onClick={() => setRawMode((v) => !v)}>
            {rawMode ? 'VIEW' : 'RAW'}
          </Button>
        </div>
      }
    >
      {rawMode ? (
        <div className="font-mono text-[11px] leading-5 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-2 overflow-auto">
          <div className="space-y-1">
            {rawLines.map((line, idx) => {
              const { tag, attrs, inner } = parseTag(line);
              const isTitle = tag === 'title';
              const limit = 200;
              const truncated = isTitle && inner.length > limit;
              const innerText = isTitle ? (truncated ? inner.slice(0, limit) : inner) : '';
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-blue-700 dark:text-blue-300">&lt;{tag}</span>
                    {attrs.map((a, i) => (
                      <span key={i} className="ml-1 whitespace-nowrap">
                        <span className="text-orange-600 dark:text-orange-400">{a.name}</span>
                        <span className="text-gray-500 dark:text-gray-400">=</span>
                        <span className="text-green-600 dark:text-green-400">
                          &quot;{a.value}&quot;
                        </span>
                      </span>
                    ))}
                    <span className="text-blue-700 dark:text-blue-300">&gt;</span>
                  </div>
                  {isTitle && (
                    <div className="ml-2 text-green-600 dark:text-green-400 break-words">
                      {innerText}
                      {truncated && (
                        <span className="ml-1 text-[13px] font-semibold text-brand-600 dark:text-brand-400">
                          …
                        </span>
                      )}
                    </div>
                  )}
                  {isTitle && (
                    <div className="flex items-center gap-1">
                      <span className="text-blue-700 dark:text-blue-300">&lt;/title&gt;</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-[2] min-w-[240px]">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search meta tags..."
                icon={<BiSearch className="h-4 w-4" />}
              />
            </div>
            <div className="flex gap-2">
              <Button size="xs" variant="outline" onClick={() => treeRef.current?.expandAll()}>
                Expand All
              </Button>
              <Button size="xs" variant="outline" onClick={() => treeRef.current?.collapseAll()}>
                Collapse All
              </Button>
            </div>
          </div>

          {showValidation && validationIssues.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Validation Issues ({validationIssues.length})
                </h4>
                <button
                  onClick={() => setShowValidation(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  Hide
                </button>
              </div>
              <div className="space-y-1">
                {validationIssues.map((issue, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2 p-2 rounded border ${getSeverityColor(issue.severity)}`}
                  >
                    <div className="flex-shrink-0 mt-0.5">{getSeverityIcon(issue.severity)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-gray-100">{issue.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!showValidation && validationIssues.length > 0 && (
            <button
              onClick={() => setShowValidation(true)}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
            >
              Show {validationIssues.length} validation issue
              {validationIssues.length !== 1 ? 's' : ''}
            </button>
          )}

          <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
            <MetaTagTree ref={treeRef} categories={categories} searchQuery={searchQuery} />
          </div>
        </div>
      )}
    </MetricCard>
  );
}

export default React.memo(AllMetaTagsCard);
