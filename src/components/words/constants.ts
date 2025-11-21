export const WORD_ANALYSIS_DEFAULTS = {
  GROUP_SIZE: 1,
  MIN_COUNT: 2,
} as const;

const STORAGE_KEYS = {
  GROUP_SIZE: 'word-analysis-group-size',
  MIN_COUNT: 'word-analysis-min-count',
} as const;

export const getStoredGroupSize = (): number => {
  const stored = localStorage.getItem(STORAGE_KEYS.GROUP_SIZE);
  return stored ? parseInt(stored, 10) : WORD_ANALYSIS_DEFAULTS.GROUP_SIZE;
};

export const getStoredMinCount = (): number => {
  const stored = localStorage.getItem(STORAGE_KEYS.MIN_COUNT);
  return stored ? parseInt(stored, 10) : WORD_ANALYSIS_DEFAULTS.MIN_COUNT;
};

export const setStoredGroupSize = (value: number): void => {
  localStorage.setItem(STORAGE_KEYS.GROUP_SIZE, value.toString());
};

export const setStoredMinCount = (value: number): void => {
  localStorage.setItem(STORAGE_KEYS.MIN_COUNT, value.toString());
};
