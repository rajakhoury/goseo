import { z } from 'zod';
import { BaseValidator } from '../../types/validation';
import { RuntimeError } from '../../types/errors';
import { logger } from '../../utils/logger';

export interface WordCount {
  text: string;
  count: number;
  density: number;
}

export interface WordAnalysisResult {
  words: WordCount[];
  totalWords: number;
  uniqueWords: number;
  avgWordLength: number;
  readingTime: number;
  textHtmlRatio: number;
  title?: string;
  headings?: string[];
}

export interface AnalyzeOptions {
  groupSize: number;
  minCount: number;
  caseSensitive: boolean;
}

export type AnalysisStatus = 'idle' | 'loading' | 'success' | 'error';

export interface WordGroupOption {
  id: number;
  name: string;
  value: number;
}

export const WORD_GROUP_OPTIONS: readonly WordGroupOption[] = [
  { id: 1, name: 'Single words', value: 1 },
  { id: 2, name: 'Two words', value: 2 },
  { id: 3, name: 'Three words', value: 3 },
  { id: 4, name: 'Four words', value: 4 },
  { id: 5, name: 'Five words', value: 5 },
];

export interface AnalysisState {
  status: AnalysisStatus;
  error: WordsError | null;
  result: WordAnalysisResult | null;
}

export interface AnalysisFilters {
  groupSize: WordGroupOption;
  minCount: number;
  searchTerm: string;
}

export type WordsErrorCode =
  | 'WORD_ANALYSIS_ERROR'
  | 'TEXT_ANALYSIS_ERROR'
  | 'EXECUTION_ERROR'
  | 'VALIDATION_ERROR'
  | 'NO_DOCUMENT_ACCESS'
  | 'UNKNOWN_ERROR';

export interface IWordsError extends RuntimeError {
  type: 'runtime';
  code: WordsErrorCode;
  message: string;
  stack?: string;
}

export class WordsError extends Error implements IWordsError {
  readonly type = 'runtime' as const;
  readonly code: WordsErrorCode;
  readonly message: string;

  constructor(code: WordsErrorCode, message: string) {
    super(message);
    this.name = 'WordsError';
    this.code = code;
    this.message = message;
  }
}

export type SortField = 'text' | 'count' | 'density';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: SortField;
  direction: SortDirection;
}

export interface WordTableProps {
  words: WordCount[];
  loading: boolean;
  searchTerm: string;
  children?: React.ReactNode;
  className?: string;
}

export interface WordTableState {
  sortConfig: SortConfig;
  filteredWords: WordCount[];
}

export const WordCountSchema = z.object({
  text: z.string(),
  count: z.number().int().positive(),
  density: z.number().min(0).max(100),
});

export const WordAnalysisResultSchema = z.object({
  words: z.array(WordCountSchema),
  totalWords: z.number().int().nonnegative(),
  uniqueWords: z.number().int().nonnegative(),
  avgWordLength: z.number().nonnegative(),
  readingTime: z.number().nonnegative(),
  textHtmlRatio: z.number().nonnegative(),
  title: z.string().optional(),
  headings: z.array(z.string()).optional(),
});

export const AnalyzeOptionsSchema = z.object({
  groupSize: z.number().int().min(1).max(5),
  minCount: z.number().int().positive(),
  caseSensitive: z.boolean(),
});

export const SortConfigSchema = z.object({
  key: z.enum(['text', 'count', 'density']),
  direction: z.enum(['asc', 'desc']),
});

export function formatWordsForCSV(words: WordCount[]): string {
  const headers = ['Word', 'Count', 'Density'];
  const rows = words.map((word) => [word.text, word.count.toString(), word.density.toFixed(2)]);
  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

export function formatWordsForCopy(words: WordCount[]): string {
  return words
    .map((word) => `${word.text} (${word.count}x, ${word.density.toFixed(2)}%)`)
    .join('\n');
}

export function validateWordAnalysisOptions(options: unknown): AnalyzeOptions | null {
  try {
    const validator = new AnalyzeOptionsValidator();
    const result = validator.validate(options);
    return result.success && result.data ? result.data : null;
  } catch (error) {
    logger.log('Word Analysis', 'Invalid word analysis options: ' + error, 'error');
    return null;
  }
}

export class WordAnalysisValidator extends BaseValidator<WordAnalysisResult> {
  constructor() {
    super(WordAnalysisResultSchema);
  }
}

export class AnalyzeOptionsValidator extends BaseValidator<AnalyzeOptions> {
  constructor() {
    super(AnalyzeOptionsSchema);
  }
}
