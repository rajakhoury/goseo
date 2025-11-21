import React, { useState, useEffect } from 'react';
import { BiSearch, BiExport, BiBarChart } from 'react-icons/bi';
import QuickMetrics from './QuickMetrics';
import WordTable from './WordTable';
import DensityChart from './DensityChart';
import ErrorScreen from '../common/ErrorScreen';
import Input from '../common/Input';
import Button from '../common/Button';
import { analyzeText } from './textAnalyzer';
import {
  WordGroupOption,
  WORD_GROUP_OPTIONS,
  WordsError,
  AnalysisFilters,
  WordAnalysisResult,
  WordCount,
} from './types';
import ListBox from '../common/ListBox';
import { usePageAnalysis } from '../../hooks/usePageAnalysis';
import { useSettings } from '../../contexts/settingsCore';
import {
  getStoredGroupSize,
  getStoredMinCount,
  setStoredGroupSize,
  setStoredMinCount,
  WORD_ANALYSIS_DEFAULTS,
} from './constants';
import { createLoggedError, logSystemAware } from '../../utils/logger';
import { buildExportSlug } from '../overview/utils/urlUtils';

const initialState = {
  status: 'idle' as const,
  error: null,
  result: null,
};

const WordAnalysis: React.FC = () => {
  const { settings } = useSettings();
  const [filters, setFilters] = useState<AnalysisFilters>(() => ({
    groupSize:
      WORD_GROUP_OPTIONS.find((opt) => opt.value === getStoredGroupSize()) || WORD_GROUP_OPTIONS[0],
    minCount: getStoredMinCount(),
    searchTerm: '',
  }));

  const [showDensityChart, setShowDensityChart] = useState(false);

  const handleGroupSizeChange = (option: WordGroupOption) => {
    setFilters((prev) => ({ ...prev, groupSize: option }));
    setStoredGroupSize(option.value);
  };

  const handleMinCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      setFilters((prev) => ({ ...prev, minCount: numValue }));
      setStoredMinCount(numValue);
    }
  };

  const handleResetFilters = () => {
    const defaultGroup = WORD_GROUP_OPTIONS[0];
    const defaultMin = WORD_ANALYSIS_DEFAULTS.MIN_COUNT;
    setFilters({ groupSize: defaultGroup, minCount: defaultMin, searchTerm: '' });
    setStoredGroupSize(defaultGroup.value);
    setStoredMinCount(defaultMin);
  };

  const {
    state: analysisState,
    analyzeCurrentPage,
    resetState,
  } = usePageAnalysis<WordAnalysisResult, WordsError>({
    initialState,
    errorType: 'TEXT_ANALYSIS_ERROR',
    createError: (message: string) =>
      createLoggedError(
        'Word Analysis',
        message,
        (msg) => new WordsError('TEXT_ANALYSIS_ERROR', msg)
      ),
    executeScript: async (tabId: number) => {
      try {
        const getTextResult = await chrome.scripting.executeScript({
          target: { tabId },
          world: 'MAIN',
          func: () => {
            const styleCache = new WeakMap<Element, CSSStyleDeclaration>();

            const isVisible = (el: Element): boolean => {
              let cached = styleCache.get(el);
              if (!cached) {
                cached = window.getComputedStyle(el);
                styleCache.set(el, cached);
              }
              return cached.display !== 'none' && cached.visibility !== 'hidden';
            };

            const getVisibleText = (node: Node): string => {
              if (node.nodeType === Node.TEXT_NODE) {
                const el = node.parentElement;
                if (el && !isVisible(el)) {
                  return '';
                }
                return node.textContent || '';
              }

              if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as Element;
                if (el.tagName === 'IFRAME' || !isVisible(el)) {
                  return '';
                }

                const texts: string[] = [];
                for (const child of node.childNodes) {
                  texts.push(getVisibleText(child));
                }
                return texts.join('');
              }

              return '';
            };

            const text = getVisibleText(document.body || document.documentElement);
            const html = document.documentElement?.outerHTML || '';
            const cleanText = text.replace(/\s+/g, ' ').trim();
            const cleanHtml = html.replace(/\s+/g, ' ').trim();
            const ratio = cleanHtml ? Math.round((cleanText.length / cleanHtml.length) * 100) : 0;

            return { text: cleanText, textHtmlRatio: ratio };
          },
        });

        if (!getTextResult?.[0]?.result) {
          throw new Error('Failed to get page text content');
        }

        const { text, textHtmlRatio } = getTextResult[0].result;

        return analyzeText(
          text,
          {
            groupSize: filters.groupSize.value,
            minCount: filters.minCount,
            caseSensitive: settings.components.wordAnalysis.caseSensitive,
          },
          textHtmlRatio
        );
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logSystemAware('Word Analysis', `Execution error: ${msg}`);
        throw error;
      }
    },
  });

  useEffect(() => {
    resetState();
  }, [
    resetState,
    filters.groupSize.value,
    filters.minCount,
    settings.components.wordAnalysis.caseSensitive,
  ]);

  useEffect(() => {
    if (analysisState.status === 'idle') {
      analyzeCurrentPage();
    }
  }, [analyzeCurrentPage, analysisState.status]);

  const handleExport = async () => {
    if (!analysisState.result) return;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const fullUrl = tab.url || '';
    const slug = buildExportSlug(fullUrl);

    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');

    const csv = [
      ['Word/Phrase', 'Count', 'Density'],
      ...analysisState.result.words.map((word: WordCount) => [
        word.text.includes(',') ? `"${word.text.replace(/"/g, '""')}"` : word.text,
        word.count,
        word.density.toFixed(2),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], {
      type: 'text/csv;charset=utf-8;',
    });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;

    const filename = `keywords-${slug}-${date}-${time}.csv`;
    a.download = filename;

    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  if (analysisState.error) {
    return (
      <ErrorScreen
        title="Analysis Failed"
        message={analysisState.error.message}
        onRetry={analyzeCurrentPage}
      />
    );
  }

  return (
    <div className="h-full flex flex-col dark:bg-gray-900">
      <div className="flex items-center justify-center flex-shrink-0 mt-3">
        <QuickMetrics
          analysis={analysisState.result}
          loading={analysisState.status === 'loading'}
          className="grid grid-cols-5 gap-4"
        />
      </div>

      <div className="flex-1 bg-white dark:bg-gray-800 mt-3 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-shrink-0 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          {analysisState.status === 'loading' ? (
            <div className="flex items-center gap-3">
              <div className="w-40 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="w-32 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="flex-1">
                <div className="w-56 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <ListBox<WordGroupOption>
                options={WORD_GROUP_OPTIONS}
                value={filters.groupSize}
                onChange={handleGroupSizeChange}
                className="w-40"
              />

              <Input
                type="number"
                value={filters.minCount}
                onChange={handleMinCountChange}
                className="w-32"
                min={1}
                prefix="Count"
                enforcePositiveInteger
              />

              <div className="flex-1">
                <Input
                  type="text"
                  value={filters.searchTerm}
                  onChange={(e) =>
                    setFilters((prevFilters) => ({
                      ...prevFilters,
                      searchTerm: e.target.value,
                    }))
                  }
                  placeholder="Search words..."
                  icon={<BiSearch className="h-4 w-4" />}
                  className="w-56"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<BiBarChart className="h-4 w-4" />}
                  onClick={() => setShowDensityChart(!showDensityChart)}
                  title="Toggle Density Chart"
                >
                  Chart
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={<BiExport className="h-4 w-4" />}
                  onClick={handleExport}
                >
                  Export
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          {showDensityChart && analysisState.result && analysisState.status === 'success' ? (
            <div className="flex-1 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
              <DensityChart words={analysisState.result.words} />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {analysisState.status === 'success' &&
              analysisState.result &&
              (analysisState.result.words?.length || 0) === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 dark:text-brand-400">
                  <div className="flex items-center gap-3">
                    <p className="text-sm">
                      {(analysisState.result.totalWords || 0) > 0
                        ? 'No words match current filters'
                        : 'No visible text on this page'}
                    </p>
                    {(analysisState.result.totalWords || 0) > 0 ? (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="text-sm text-gray-500 underline hover:underline dark:text-gray-400"
                      >
                        Reset
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <WordTable
                  words={analysisState.result?.words || []}
                  loading={analysisState.status === 'loading'}
                  searchTerm={filters.searchTerm}
                  className="flex-1"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordAnalysis;
