import { z } from 'zod';
import { BaseValidator } from '../../types/validation';
import { RuntimeError } from '../../types/errors';

export interface FilterOptions {
  internal: boolean;
  external: boolean;
  missingTitle: boolean;
  broken: boolean;
  communication: boolean;
  nofollow: boolean;
}

export type LinkType =
  | 'standard'
  | 'communication'
  | 'anchor'
  | 'javascript'
  | 'data'
  | 'blob'
  | 'file'
  | 'ftp'
  | 'unknown';

export interface DOMPosition {
  index: number;
  path: string;
  id: string;
}

export interface LinkData {
  href: string;
  text: string;
  title: string | null;
  rel: string[];
  target: string | null;
  isInternal: boolean;
  isNoFollow: boolean;
  isDoFollow: boolean;
  isNoOpener: boolean;
  isNoReferrer: boolean;
  type: LinkType;
  broken: boolean;
  domPosition: DOMPosition;
  attributes: Record<string, string>;
}

export interface LinkMetrics {
  total: number;
  unique: number;
  internal: number;
  external: number;
  noFollow: number;
  doFollow: number;
  noOpener: number;
  noReferrer: number;
  communication: number;
  missingTitles: number;
  broken: number;
}

export interface AnalysisResult {
  links: LinkData[];
  metrics: LinkMetrics;
}

export interface AnalysisState {
  status: 'idle' | 'loading' | 'success' | 'error';
  error: LinksError | null;
  result: AnalysisResult;
}

export const initialAnalysisState: AnalysisState = {
  status: 'idle',
  error: null,
  result: {
    links: [],
    metrics: {
      total: 0,
      unique: 0,
      internal: 0,
      external: 0,
      noFollow: 0,
      doFollow: 0,
      noOpener: 0,
      noReferrer: 0,
      communication: 0,
      missingTitles: 0,
      broken: 0,
    },
  },
};

export type LinkCategory =
  | 'internal'
  | 'external'
  | 'broken'
  | 'communication'
  | 'nofollow'
  | 'dofollow'
  | 'noopener'
  | 'noreferrer'
  | 'missing-title'
  | 'all';

export type LinksErrorCode =
  | 'LINK_ANALYSIS_ERROR'
  | 'EXECUTION_ERROR'
  | 'VALIDATION_ERROR'
  | 'NO_DOCUMENT_ACCESS'
  | 'UNKNOWN_ERROR';

export class LinksError extends Error implements RuntimeError {
  readonly type = 'runtime';
  readonly code: LinksErrorCode;

  constructor(code: LinksErrorCode, message: string) {
    super(message);
    this.name = 'LinksError';
    this.code = code;
  }
}

const domPositionSchema = z.object({
  index: z.number(),
  path: z.string(),
  id: z.string(),
});

const linkDataSchema = z
  .object({
    href: z.string(),
    text: z.string(),
    title: z.string().nullable(),
    rel: z.array(z.string()),
    target: z.string().nullable(),
    isInternal: z.boolean(),
    isNoFollow: z.boolean(),
    isDoFollow: z.boolean(),
    isNoOpener: z.boolean(),
    isNoReferrer: z.boolean(),
    type: z.enum([
      'standard',
      'communication',
      'anchor',
      'javascript',
      'data',
      'blob',
      'file',
      'ftp',
      'unknown',
    ]),
    broken: z.boolean(),
    domPosition: domPositionSchema,
    attributes: z.record(z.string(), z.string()),
  })
  .strict();

const linkMetricsSchema = z
  .object({
    total: z.number(),
    unique: z.number(),
    internal: z.number(),
    external: z.number(),
    noFollow: z.number(),
    doFollow: z.number(),
    noOpener: z.number(),
    noReferrer: z.number(),
    communication: z.number(),
    missingTitles: z.number(),
    broken: z.number(),
  })
  .strict();

const analysisResultSchema = z
  .object({
    links: z.array(linkDataSchema),
    metrics: linkMetricsSchema,
  })
  .strict();

export type LinkDataSchemaType = z.infer<typeof linkDataSchema>;
export type AnalysisResultSchemaType = z.infer<typeof analysisResultSchema>;

export class LinkDataValidator extends BaseValidator<LinkDataSchemaType> {
  constructor() {
    super(linkDataSchema);
  }
}

export class AnalysisResultValidator extends BaseValidator<AnalysisResultSchemaType> {
  constructor() {
    super(analysisResultSchema);
  }
}
