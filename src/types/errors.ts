export interface BaseError {
  code: string;
  message: string;
  field?: string;
}

export interface ValidationError extends BaseError {
  type: 'validation';
  violations: {
    field: string;
    message: string;
    value?: unknown;
  }[];
}

export interface RuntimeError extends BaseError {
  type: 'runtime';
  stack?: string;
}

export const isValidationError = (error: unknown): error is ValidationError => {
  return (error as ValidationError)?.type === 'validation';
};

export const isRuntimeError = (error: unknown): error is RuntimeError => {
  return (error as RuntimeError)?.type === 'runtime';
};
