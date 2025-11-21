import React, { useState, useMemo } from 'react';
import { BiSortUp, BiSortDown } from 'react-icons/bi';
import clsx from 'clsx';
import { WordTableProps, SortConfig, SortField, WordsError, SortConfigSchema } from './types';
import { useSettings } from '../../contexts/settingsCore';
import { logger } from '../../utils/logger';

const validateSortConfig = (config: unknown): SortConfig => {
  try {
    return SortConfigSchema.parse(config) as SortConfig;
  } catch {
    throw new WordsError('WORD_ANALYSIS_ERROR', 'Invalid sort configuration');
  }
};

const WordTable: React.FC<WordTableProps> = ({
  words,
  loading,
  searchTerm,
  children,
  className,
}) => {
  const { settings } = useSettings();
  const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
    const defaultConfig = { key: 'count' as SortField, direction: 'desc' as const };
    return validateSortConfig(defaultConfig);
  });

  const handleSort = (key: SortField) => {
    const newConfig = {
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'desc' ? 'asc' : 'desc',
    };

    try {
      setSortConfig(validateSortConfig(newConfig));
    } catch (error) {
      logger.log('Words', 'Sort configuration error: ' + error, 'warn');
      setSortConfig({ key: 'count', direction: 'desc' });
    }
  };

  const sortedWords = useMemo(() => {
    if (!words?.length) return [];

    try {
      return [...words].sort((a, b) => {
        const key = sortConfig.key;
        if (key === 'text') {
          const result = a.text.localeCompare(b.text);
          return sortConfig.direction === 'asc' ? result : -result;
        }
        const av = a[key];
        const bv = b[key];
        if (av === bv) return 0;
        return sortConfig.direction === 'asc' ? (av > bv ? 1 : -1) : av < bv ? 1 : -1;
      });
    } catch (error) {
      logger.log('Words', 'Word sorting error: ' + error, 'warn');
      return words;
    }
  }, [words, sortConfig]);

  const filteredWords = useMemo(() => {
    if (!searchTerm) return sortedWords;

    const caseSensitive = settings.components.wordAnalysis.caseSensitive;
    const term = caseSensitive ? searchTerm : searchTerm.toLowerCase();

    return sortedWords.filter((word) => {
      const wordText = caseSensitive ? word.text : word.text.toLowerCase();
      return wordText.includes(term);
    });
  }, [sortedWords, searchTerm, settings.components.wordAnalysis.caseSensitive]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-100 dark:bg-gray-700" />
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="w-1/3 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="w-1/6 h-4 bg-gray-200 dark:bg-gray-700 rounded ml-auto" />
              <div className="w-1/6 h-4 bg-gray-200 dark:bg-gray-700 rounded ml-8" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('overflow-x-auto min-h-[6rem]', className)}>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            <th scope="col" className="px-4 py-2 text-left w-full">
              <button
                onClick={() => handleSort('text')}
                className="group inline-flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                Word/Phrase
                {sortConfig.key === 'text' ? (
                  <BiSortDown
                    className={clsx(
                      'ml-1 h-4 w-4 flex-shrink-0',
                      'text-gray-700 dark:text-gray-300'
                    )}
                  />
                ) : (
                  <BiSortUp
                    className={clsx(
                      'ml-1 h-4 w-4 flex-shrink-0',
                      'text-gray-400 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                    )}
                  />
                )}
              </button>
            </th>
            <th scope="col" className="pl-12 pr-3 py-2 text-right">
              <button
                onClick={() => handleSort('count')}
                className="group inline-flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                Count
                {sortConfig.key === 'count' ? (
                  <BiSortDown
                    className={clsx(
                      'ml-1 h-4 w-4 flex-shrink-0',
                      'text-gray-700 dark:text-gray-300'
                    )}
                  />
                ) : (
                  <BiSortUp
                    className={clsx(
                      'ml-1 h-4 w-4 flex-shrink-0',
                      'text-gray-400 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                    )}
                  />
                )}
              </button>
            </th>
            <th scope="col" className="pl-12 pr-3 py-2 text-right">
              <button
                onClick={() => handleSort('density')}
                className="group inline-flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                Density
                {sortConfig.key === 'density' ? (
                  <BiSortDown
                    className={clsx(
                      'ml-1 h-4 w-4 flex-shrink-0',
                      'text-gray-700 dark:text-gray-300'
                    )}
                  />
                ) : (
                  <BiSortUp
                    className={clsx(
                      'ml-1 h-4 w-4 flex-shrink-0',
                      'text-gray-400 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                    )}
                  />
                )}
              </button>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {filteredWords.map((word) => (
            <tr key={word.text} className="bg-white dark:bg-gray-800">
              <td className="px-4 py-1.5 text-xs whitespace-nowrap text-gray-900 dark:text-gray-100">
                {word.text}
              </td>
              <td className="pl-12 pr-3 py-1.5 text-xs whitespace-nowrap text-gray-900 dark:text-gray-100 text-right">
                {word.count}
              </td>
              <td className="px-2 py-1.5 text-xs whitespace-nowrap text-right pr-8 text-gray-900 dark:text-gray-100">
                {word.density.toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {children}
    </div>
  );
};

export default WordTable;
