import { z } from 'zod';
import { BaseValidator } from '../../types/validation';
import { RuntimeError } from '../../types/errors';

export type SchemaErrorCode =
  | 'SCHEMA_ERROR'
  | 'EXECUTION_ERROR'
  | 'UNKNOWN_ERROR'
  | 'VALIDATION_ERROR'
  | 'NO_DOCUMENT_ACCESS';

export class SchemaError extends Error implements RuntimeError {
  readonly type = 'runtime';
  readonly code: SchemaErrorCode;

  constructor(code: SchemaErrorCode, message: string) {
    super(message);
    this.name = 'SchemaError';
    this.code = code;
  }
}

export interface SchemaObject {
  id: string;
  type: string | string[];
  raw: string;
  parsed: Record<string, unknown>;
  position: number;
}

export interface AnalysisResult {
  schemas: SchemaObject[];
}

export interface AnalysisState {
  status: 'idle' | 'loading' | 'success' | 'error';
  error: SchemaError | null;
  result: AnalysisResult | null;
}

export const initialAnalysisState: AnalysisState = {
  status: 'idle',
  error: null,
  result: null,
};

const schemaObjectSchema = z
  .object({
    id: z.string(),
    type: z.union([z.string(), z.array(z.string())]),
    raw: z.string(),
    parsed: z.record(z.string(), z.any()),
    position: z.number(),
  })
  .strict();

const analysisResultSchema = z
  .object({
    schemas: z.array(schemaObjectSchema),
  })
  .strict();

export type SchemaObjectSchemaType = z.infer<typeof schemaObjectSchema>;
export type AnalysisResultSchemaType = z.infer<typeof analysisResultSchema>;

export class AnalysisResultValidator extends BaseValidator<AnalysisResultSchemaType> {
  constructor() {
    super(analysisResultSchema);
  }
}
