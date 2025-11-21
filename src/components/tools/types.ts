import { z } from 'zod';
import { BaseValidator } from '../../types/validation';
import { RuntimeError } from '../../types/errors';

export type ToolsErrorCode =
  | 'TOOLS_ERROR'
  | 'EXECUTION_ERROR'
  | 'VALIDATION_ERROR'
  | 'NO_DOCUMENT_ACCESS'
  | 'UNKNOWN_ERROR';

export class ToolsError extends Error implements RuntimeError {
  readonly type = 'runtime';
  readonly code: ToolsErrorCode;

  constructor(code: ToolsErrorCode, message: string) {
    super(message);
    this.name = 'ToolsError';
    this.code = code;
  }
}

export interface SEOTool {
  id: string;
  name: string;
  description: string;
  url: string;
  category: ToolCategory;
  icon?: string;
}

export type ToolCategory =
  | 'technical'
  | 'performance'
  | 'content'
  | 'keywords'
  | 'backlinks'
  | 'search';

export interface AnalysisResult {
  tools: SEOTool[];
  currentUrl: string;
}

export interface AnalysisState {
  status: 'idle' | 'loading' | 'success' | 'error';
  error: ToolsError | null;
  result: AnalysisResult | null;
}

export const initialAnalysisState: AnalysisState = {
  status: 'idle',
  error: null,
  result: null,
};

const seoToolSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    url: z.string().url(),
    category: z.enum(['technical', 'performance', 'content', 'keywords', 'backlinks', 'search']),
    icon: z.string().optional(),
  })
  .strict();

const analysisResultSchema = z
  .object({
    tools: z.array(seoToolSchema),
    currentUrl: z.string().url(),
  })
  .strict();

export type SEOToolSchemaType = z.infer<typeof seoToolSchema>;
export type AnalysisResultSchemaType = z.infer<typeof analysisResultSchema>;

export class AnalysisResultValidator extends BaseValidator<AnalysisResultSchemaType> {
  constructor() {
    super(analysisResultSchema);
  }
}
