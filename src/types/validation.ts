import { z } from 'zod';
import { ValidationError } from './errors';

export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  error?: ValidationError;
};

export interface Validator<T> {
  validate(data: unknown): ValidationResult<T>;
  validatePartial(data: Partial<T>): ValidationResult<Partial<T>>;
}

export abstract class BaseValidator<T> implements Validator<T> {
  protected schema: z.ZodType;

  constructor(schema: z.ZodType) {
    this.schema = schema;
  }

  validate(data: unknown): ValidationResult<T> {
    try {
      const validatedData = this.schema.parse(data);
      return {
        success: true,
        data: validatedData as T,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: {
            type: 'validation',
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            violations: error.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
              value: issue.path.length > 0 ? this.getValueAtPath(data, issue.path) : data,
            })),
          },
        };
      }
      throw error;
    }
  }

  validatePartial(data: Partial<T>): ValidationResult<Partial<T>> {
    return this.validate(data) as ValidationResult<Partial<T>>;
  }

  private getValueAtPath(obj: unknown, path: (string | number | symbol)[]): unknown {
    return path.reduce<unknown>((acc, key) => {
      if (acc && typeof acc === 'object') {
        const record = acc as Record<PropertyKey, unknown>;
        return record[key];
      }
      return undefined;
    }, obj);
  }
}

export type ValidationRule<T> = {
  validate: (value: T) => boolean;
  message: string;
};
