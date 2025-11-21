export function getBaseUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}`;
  } catch {
    return '';
  }
}

export function getRobotsUrl(pageUrl: string): string {
  const baseUrl = getBaseUrl(pageUrl);
  return baseUrl ? `${baseUrl}/robots.txt` : '';
}

export function getSitemapUrl(pageUrl: string): string {
  const baseUrl = getBaseUrl(pageUrl);
  return baseUrl ? `${baseUrl}/sitemap.xml` : '';
}

export function getAiTxtUrl(pageUrl: string): string {
  const baseUrl = getBaseUrl(pageUrl);
  return baseUrl ? `${baseUrl}/ai.txt` : '';
}

export function getLlmsTxtUrl(pageUrl: string): string {
  const baseUrl = getBaseUrl(pageUrl);
  return baseUrl ? `${baseUrl}/llms.txt` : '';
}

export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];
  }
}

export function buildExportSlug(pageUrl: string, maxLength = 50): string {
  try {
    const u = new URL(pageUrl);
    const raw = `${u.hostname}${u.pathname}`;
    const normalized = raw
      .replace(/\/+$/g, '/')
      .replace(/\/{2,}/g, '/')
      .toLowerCase();
    let slug = normalized
      .replace(/[^a-z0-9/]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/\/$/, '')
      .replace(/^-|-$/g, '')
      .replace(/\//g, '-');

    if (!slug) {
      slug = (u.hostname || 'page')
        .toLowerCase()
        .replace(/[^a-z0-9]/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }

    const reserved = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
    if (reserved.test(slug)) {
      slug = `site-${slug.toLowerCase()}`;
    }

    return slug.slice(0, maxLength);
  } catch {
    const noProto = pageUrl.replace(/^https?:\/\//, '');
    const noQuery = noProto.split(/[?#]/)[0];
    let slug = noQuery
      .toLowerCase()
      .replace(/[^a-z0-9/]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/\/$/, '')
      .replace(/^-|-$/g, '')
      .replace(/\//g, '-');

    if (!slug) slug = 'page';

    const reserved = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
    if (reserved.test(slug)) {
      slug = `site-${slug.toLowerCase()}`;
    }

    return slug.slice(0, maxLength);
  }
}

export async function checkUrlAccessibility(url: string): Promise<{
  accessible: boolean;
  status?: number;
  statusText?: string;
  error?: string;
}> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
    });

    return {
      accessible: true,
      status: response.status || 0,
      statusText: response.statusText || 'OK',
    };
  } catch (error) {
    return {
      accessible: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
