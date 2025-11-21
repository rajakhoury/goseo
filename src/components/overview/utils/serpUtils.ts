export const SERP_LIMITS = {
  TITLE_MAX: 60,
  DESCRIPTION_MAX: 160,
  URL_MAX: 60,
} as const;

export function formatSerpTitle(text: string): string {
  if (!text) return '';

  if (text.length <= SERP_LIMITS.TITLE_MAX) {
    return text;
  }

  return truncateSerpText(text, SERP_LIMITS.TITLE_MAX);
}

export function formatSerpDescription(text: string): string {
  if (!text) return '';

  if (text.length <= SERP_LIMITS.DESCRIPTION_MAX) {
    return text;
  }

  return truncateSerpText(text, SERP_LIMITS.DESCRIPTION_MAX);
}

export function truncateSerpText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}

export function formatSerpUrl(url: string): string {
  if (!url) return '';

  try {
    const urlObj = new URL(url);
    let displayUrl = urlObj.hostname + urlObj.pathname;

    displayUrl = displayUrl.replace(/^www\./, '');

    displayUrl = displayUrl.replace(/\/$/, '');

    if (displayUrl.length > SERP_LIMITS.URL_MAX) {
      const parts = displayUrl.split('/');
      if (parts.length > 2) {
        return `${parts[0]}/${parts[1]}/.../${parts[parts.length - 1]}`;
      }
      return truncateSerpText(displayUrl, SERP_LIMITS.URL_MAX);
    }

    return displayUrl;
  } catch {
    return url
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')
      .substring(0, SERP_LIMITS.URL_MAX);
  }
}

export function extractDomain(url: string): string {
  if (!url) return '';

  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return url
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];
  }
}
