import { z } from 'zod';
import { BaseValidator } from '../../types/validation';
import { LoadingState } from '../../types/states';
import { ValidationError, RuntimeError } from '../../types/errors';

export interface ThemeOption {
  id: ThemeMode;
  name: string;
  value: ThemeMode;
}

export type ThemeMode = 'light' | 'dark' | 'system';
const ThemeModeEnum = z.enum(['light', 'dark', 'system']);

export interface DensityRanges {
  underOptimized: number;
  optimal: {
    max: number;
  };
}

export interface WordAnalysisSettings {
  caseSensitive: boolean;
  densityRanges: DensityRanges;
}

export interface GlobalSettings {
  theme: ThemeMode;
  language: string;
}

export interface Settings {
  global: GlobalSettings;
  components: {
    wordAnalysis: WordAnalysisSettings;
  };
}

export interface ValidationErrors {
  defaultGroupSize?: string;
  defaultMinCount?: string;
  densityRanges?: {
    underOptimized?: string;
    optimalMax?: string;
  };
}

export interface SettingsState {
  status: LoadingState;
  data: Settings | null;
  error: RuntimeError | Error | null;
}

export const DensityRangesSchema = z
  .object({
    underOptimized: z.number().min(0).max(100),
    optimal: z.object({
      max: z.number().min(0).max(100),
    }),
  })
  .refine((data) => data.underOptimized < data.optimal.max, {
    message: 'Under-optimized threshold must be less than optimal maximum',
  });

export const WordAnalysisSettingsSchema = z.object({
  caseSensitive: z.boolean(),
  densityRanges: DensityRangesSchema,
});

export const GlobalSettingsSchema = z.object({
  theme: ThemeModeEnum,
  language: z.string(),
});

export const SettingsSchema = z.object({
  global: GlobalSettingsSchema,
  components: z.object({
    wordAnalysis: WordAnalysisSettingsSchema,
  }),
});

export class SettingsValidator extends BaseValidator<Settings> {
  constructor() {
    super(SettingsSchema);
  }
}

export interface SettingsValidationError extends Pick<ValidationError, 'type' | 'message'> {
  component: 'global' | 'wordAnalysis';
}

export const defaultDensityRanges: DensityRanges = {
  underOptimized: 0.5,
  optimal: {
    max: 2.0,
  },
};

export const defaultWordAnalysisSettings: WordAnalysisSettings = {
  caseSensitive: false,
  densityRanges: defaultDensityRanges,
};

export const defaultGlobalSettings: GlobalSettings = {
  theme: 'system',
  language: 'en',
};

export const defaultSettings: Settings = {
  global: defaultGlobalSettings,
  components: {
    wordAnalysis: defaultWordAnalysisSettings,
  },
};
