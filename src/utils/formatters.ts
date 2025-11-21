export const formatBytes = (bytes: number | null): string => {
  if (bytes === null) return 'Unknown';
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
};

export const formatFileSize = formatBytes;

export function formatWebVitalValue(metric: string, value: number): string {
  switch (metric) {
    case 'CLS':
      return value.toFixed(3);
    default:
      return `${value.toFixed(0)}ms`;
  }
}
