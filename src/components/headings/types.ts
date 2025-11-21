import { z } from 'zod';
import { BaseValidator } from '../../types/validation';
import { RuntimeError } from '../../types/errors';
import { logger } from '../../utils/logger';

export const HEADING_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingTag = (typeof HEADING_TAGS)[number];

export type HeadingsErrorCode =
  | 'HEADING_ANALYSIS_ERROR'
  | 'HEADING_VALIDATION_ERROR'
  | 'EXECUTION_ERROR'
  | 'NO_DOCUMENT_ACCESS'
  | 'UNKNOWN_ERROR';

export interface IHeadingsError extends RuntimeError {
  type: 'runtime';
  code: HeadingsErrorCode;
  message: string;
  stack?: string;
}

export class HeadingsError extends Error implements IHeadingsError {
  readonly type = 'runtime' as const;
  readonly code: HeadingsErrorCode;
  readonly message: string;

  constructor(code: HeadingsErrorCode, message: string) {
    super(message);
    this.name = 'HeadingsError';
    this.code = code;
    this.message = message;
  }
}

export interface HeadingData {
  text: string;
  level: HeadingLevel;
  index: number;
  domId: string;
}

export interface HeadingCount {
  h1: number;
  h2: number;
  h3: number;
  h4: number;
  h5: number;
  h6: number;
}

export interface AnalysisResult {
  counts: HeadingCount | null;
  headings: HeadingData[];
}

export type AnalysisStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AnalysisState {
  status: AnalysisStatus;
  error: HeadingsError | null;
  result: AnalysisResult | null;
}

export interface HeadingTreeProps {
  headings: HeadingData[];
  loading: boolean;
  headingCounts: HeadingCount | null;
}

export interface HeadingNodeProps {
  heading: HeadingData;
  isExpanded: boolean;
  hasChildNodes: boolean;
  onToggle: () => void;
  isVisible: boolean;
}

export interface HeadingToolbarProps {
  headings: HeadingData[];
  loading: boolean;
  headingCounts: HeadingCount | null;
}

export interface QuickMetricsProps {
  headingCounts: HeadingCount | null;
  loading: boolean;
  className?: string;
}

export const HeadingDataSchema = z.object({
  text: z.string(),
  level: z.number().int().min(1).max(6),
  index: z.number().int().nonnegative(),
  domId: z.string(),
});

export const HeadingCountSchema = z.object({
  h1: z.number().int().nonnegative(),
  h2: z.number().int().nonnegative(),
  h3: z.number().int().nonnegative(),
  h4: z.number().int().nonnegative(),
  h5: z.number().int().nonnegative(),
  h6: z.number().int().nonnegative(),
});

export class HeadingDataValidator extends BaseValidator<HeadingData> {
  constructor() {
    super(HeadingDataSchema);
  }
}

export class HeadingCountValidator extends BaseValidator<HeadingCount> {
  constructor() {
    super(HeadingCountSchema);
  }
}

export function isValidHeadingLevel(level: number): level is HeadingLevel {
  return Number.isInteger(level) && level >= 1 && level <= 6;
}

export function validateHeadingElement(element: Element): HeadingData | null {
  try {
    if (!(element instanceof HTMLHeadingElement)) {
      throw new HeadingsError('HEADING_VALIDATION_ERROR', 'Element is not a heading element');
    }

    const tag = element.tagName.toLowerCase() as HeadingTag;
    if (!HEADING_TAGS.includes(tag)) {
      throw new HeadingsError('HEADING_VALIDATION_ERROR', 'Invalid heading tag');
    }

    const level = parseInt(tag[1], 10) as HeadingLevel;
    if (!isValidHeadingLevel(level)) {
      throw new HeadingsError('HEADING_VALIDATION_ERROR', 'Invalid heading level');
    }

    const text = element.textContent?.trim() || '';
    if (!text) {
      throw new HeadingsError('HEADING_VALIDATION_ERROR', 'Empty heading text');
    }

    return {
      text,
      level,
      index: Array.from(document.querySelectorAll(tag)).indexOf(element),
      domId: element.id || `heading-${level}-${Date.now()}`,
    };
  } catch (error) {
    if (error instanceof HeadingsError) {
      throw error;
    }
    throw new HeadingsError('HEADING_VALIDATION_ERROR', 'Failed to validate heading element');
  }
}

export function getAllHeadings(document: Document): HeadingData[] {
  try {
    logger.log('Headings', 'Starting heading extraction...', 'info');
    const headings: HeadingData[] = [];
    HEADING_TAGS.forEach((tag) => {
      const elements = document.querySelectorAll(tag);
      logger.log('Headings', `Found ${elements.length} ${tag} elements`, 'info');
      elements.forEach((element) => {
        const heading = validateHeadingElement(element);
        if (heading) {
          headings.push(heading);
        }
      });
    });
    logger.log('Headings', `Completed with ${headings.length} headings`, 'info');
    return headings;
  } catch (error) {
    logger.log('Headings', 'Failed to get all headings: ' + error, 'error');
    throw new HeadingsError('HEADING_ANALYSIS_ERROR', 'Failed to get all headings');
  }
}

export function getHeadingCounts(document: Document): HeadingCount {
  try {
    logger.log('Headings', 'Starting heading count...', 'info');
    const counts: HeadingCount = {
      h1: 0,
      h2: 0,
      h3: 0,
      h4: 0,
      h5: 0,
      h6: 0,
    };

    HEADING_TAGS.forEach((tag) => {
      const elements = document.getElementsByTagName(tag);
      counts[tag] = elements.length;
      logger.log('Headings', `Found ${elements.length} ${tag} elements`, 'info');
    });

    logger.log('Headings', 'Completed heading count', 'info');
    return counts;
  } catch (error) {
    logger.log('Headings', 'Failed to get heading counts: ' + error, 'error');
    throw new HeadingsError('HEADING_ANALYSIS_ERROR', 'Failed to get heading counts');
  }
}

export function escapeCSVValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function formatHeadingsForCSV(headings: HeadingData[]): string {
  const headers = ['Heading', 'Text'];
  const rows = headings.map((heading) => [`H${heading.level}`, escapeCSVValue(heading.text)]);
  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

export function formatHeadingsForCopy(headings: HeadingData[]): string {
  return headings.map((heading) => `H${heading.level}: ${heading.text}`).join('\n');
}
