export type ValidationStatus = 'good' | 'warning' | 'error';

export interface ValidationResult {
  status: ValidationStatus;
  count: number;
  message: string;
}

export function validateTitleLength(text: string): ValidationResult {
  const count = text.length;

  if (count >= 55 && count <= 60) {
    return {
      status: 'good',
      count,
      message: 'Optimal length for search results',
    };
  }

  if (count >= 30 && count < 55) {
    return {
      status: 'warning',
      count,
      message: 'Could be longer for better visibility',
    };
  }

  if (count < 30) {
    return {
      status: 'error',
      count,
      message: 'Too short - aim for 55-60 characters',
    };
  }

  return {
    status: 'error',
    count,
    message: 'Too long - will be truncated in search results',
  };
}

export function validateDescriptionLength(text: string): ValidationResult {
  const count = text.length;

  if (count >= 150 && count <= 160) {
    return {
      status: 'good',
      count,
      message: 'Optimal length for search results',
    };
  }

  if (count >= 120 && count < 150) {
    return {
      status: 'warning',
      count,
      message: 'Could be longer for better description',
    };
  }

  if (count < 120) {
    return {
      status: 'error',
      count,
      message: 'Too short - aim for 150-160 characters',
    };
  }

  return {
    status: 'error',
    count,
    message: 'Too long - will be truncated in search results',
  };
}

export function getValidationColorClass(status: ValidationStatus): string {
  switch (status) {
    case 'good':
      return 'text-green-600 dark:text-green-400';
    case 'warning':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'error':
      return 'text-red-600 dark:text-red-400';
  }
}
