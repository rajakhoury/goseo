import { ScriptTag } from '../types';

export type ScriptCategory = 'core' | 'third-party' | 'framework' | 'functionality';

export interface ScriptAnalysisResult {
  category: ScriptCategory;
  library?: string;
  version?: string;
  securityFlags: string[];
  description: string;
}

const LIBRARY_PATTERNS = [
  {
    pattern: /react(-dom)?\.(?:development|production\.min)?\.js/i,
    name: 'React',
    category: 'framework' as const,
  },
  { pattern: /vue(?:\.min)?\.js/i, name: 'Vue.js', category: 'framework' as const },
  { pattern: /angular(?:\.min)?\.js/i, name: 'Angular', category: 'framework' as const },
  {
    pattern: /jquery(?:-\d+\.\d+\.\d+)?(?:\.min)?\.js/i,
    name: 'jQuery',
    category: 'framework' as const,
  },
  {
    pattern: /google-analytics\.com\/analytics\.js/i,
    name: 'Google Analytics',
    category: 'third-party' as const,
  },
  {
    pattern: /googletagmanager\.com\/gtag\/js/i,
    name: 'Google Tag Manager',
    category: 'third-party' as const,
  },
  {
    pattern: /googletagmanager\.com\/gtm\.js/i,
    name: 'Google Tag Manager',
    category: 'third-party' as const,
  },
  {
    pattern: /google-analytics\.com\/ga\.js/i,
    name: 'Google Analytics (Legacy)',
    category: 'third-party' as const,
  },
  { pattern: /connect\.facebook\.net/i, name: 'Facebook SDK', category: 'third-party' as const },
  { pattern: /platform\.twitter\.com/i, name: 'Twitter Widgets', category: 'third-party' as const },
  {
    pattern: /platform\.linkedin\.com/i,
    name: 'LinkedIn Widgets',
    category: 'third-party' as const,
  },
  {
    pattern: /instagram\.com\/embed\.js/i,
    name: 'Instagram Embed',
    category: 'third-party' as const,
  },
  { pattern: /googleadservices\.com/i, name: 'Google Ads', category: 'third-party' as const },
  { pattern: /doubleclick\.net/i, name: 'DoubleClick', category: 'third-party' as const },
  { pattern: /googlesyndication\.com/i, name: 'Google AdSense', category: 'third-party' as const },
  { pattern: /jsdelivr\.net/i, name: 'jsDelivr CDN', category: 'third-party' as const },
  { pattern: /unpkg\.com/i, name: 'unpkg CDN', category: 'third-party' as const },
  { pattern: /cdnjs\.cloudflare\.com/i, name: 'cdnjs', category: 'third-party' as const },
  { pattern: /cdn\.jsdelivr\.net/i, name: 'jsDelivr CDN', category: 'third-party' as const },
  { pattern: /wp-content\/themes/i, name: 'WordPress Theme', category: 'framework' as const },
  { pattern: /wp-content\/plugins/i, name: 'WordPress Plugin', category: 'framework' as const },
  { pattern: /wp-includes\/js/i, name: 'WordPress Core', category: 'framework' as const },
  { pattern: /newrelic\.com/i, name: 'New Relic', category: 'third-party' as const },
  { pattern: /sentry\.io/i, name: 'Sentry', category: 'third-party' as const },
  { pattern: /datadoghq\.com/i, name: 'Datadog', category: 'third-party' as const },
  { pattern: /zendesk\.com/i, name: 'Zendesk', category: 'functionality' as const },
  { pattern: /intercom\.io/i, name: 'Intercom', category: 'functionality' as const },
  { pattern: /drift\.com/i, name: 'Drift', category: 'functionality' as const },
  { pattern: /freshchat\.com/i, name: 'Freshchat', category: 'functionality' as const },
  {
    pattern: /youtube\.com\/iframe_api/i,
    name: 'YouTube Player',
    category: 'functionality' as const,
  },
  { pattern: /vimeo\.com\/api/i, name: 'Vimeo Player', category: 'functionality' as const },
  { pattern: /hotjar\.com|hotjar\.io/i, name: 'Hotjar', category: 'third-party' as const },
  { pattern: /mixpanel\.com/i, name: 'Mixpanel', category: 'third-party' as const },
  { pattern: /segment\.com|segment\.io/i, name: 'Segment', category: 'third-party' as const },
  { pattern: /clarity\.ms/i, name: 'Microsoft Clarity', category: 'third-party' as const },
  { pattern: /matomo\.org|matomo\.cloud/i, name: 'Matomo', category: 'third-party' as const },
  { pattern: /adobedtm\.com|adobe\.com/i, name: 'Adobe', category: 'third-party' as const },
  {
    pattern: /snowplowanalytics\.com|snowplow\.io/i,
    name: 'Snowplow',
    category: 'third-party' as const,
  },
  { pattern: /optimizely\.com/i, name: 'Optimizely', category: 'third-party' as const },
  {
    pattern: /cdn\.shopify\.com|shopifycloud\.com|shopifycdn/i,
    name: 'Shopify',
    category: 'framework' as const,
  },
  {
    pattern: /bigcommerce\.com|cdn\d*\.bigcommerce\.com/i,
    name: 'BigCommerce',
    category: 'framework' as const,
  },
  {
    pattern: /wixstatic\.com|static\.parastorage\.com|wix\.com/i,
    name: 'Wix',
    category: 'framework' as const,
  },
  {
    pattern: /static\.squarespace\.com|squarespace\.com/i,
    name: 'Squarespace',
    category: 'framework' as const,
  },
  {
    pattern: /framer\.com|framerusercontent\.com/i,
    name: 'Framer',
    category: 'framework' as const,
  },
  { pattern: /webflow\.com|website-files\.com/i, name: 'Webflow', category: 'framework' as const },
];

export function categorizeScript(script: ScriptTag): ScriptCategory {
  if (!script.src) {
    return 'core';
  }

  const src = script.src.toLowerCase();
  for (const lib of LIBRARY_PATTERNS) {
    if (lib.pattern.test(src)) {
      return lib.category;
    }
  }
  try {
    if (typeof window !== 'undefined') {
      const scriptUrl = new URL(script.src, window.location.href);
      const pageUrl = new URL(window.location.href);
      if (scriptUrl.hostname === pageUrl.hostname) {
        return 'core';
      }
      return 'third-party';
    }
    const isAbsolute = /^https?:\/\//i.test(script.src);
    return isAbsolute ? 'third-party' : 'core';
  } catch {
    return 'third-party';
  }
}

export function detectLibrary(src: string): string | undefined {
  if (!src) return undefined;
  for (const lib of LIBRARY_PATTERNS) {
    if (lib.pattern.test(src)) {
      return lib.name;
    }
  }
  return undefined;
}

export function extractVersion(src: string): string | undefined {
  if (!src) return undefined;
  const versionMatch = src.match(/[@/v]?(\d+\.\d+(?:\.\d+)?)/);
  if (versionMatch) {
    return versionMatch[1];
  }
  return undefined;
}

function getSecurityFlags(script: ScriptTag): string[] {
  const flags: string[] = [];

  const hasWindow = typeof window !== 'undefined';
  let pageProtocol = '';
  let pageHost = '';
  if (hasWindow) {
    const pageUrl = new URL(window.location.href);
    pageProtocol = pageUrl.protocol;
    pageHost = pageUrl.hostname;
  }
  let resolved: URL | null = null;
  try {
    resolved = script.src
      ? hasWindow
        ? new URL(script.src, window.location.href)
        : new URL(script.src)
      : null;
  } catch {
    resolved = null;
  }

  const protocol = resolved?.protocol || '';
  const isHttp = protocol === 'http:';
  const isHttps = protocol === 'https:';
  const isExternal = resolved
    ? pageHost
      ? resolved.hostname !== pageHost
      : /^https?:/i.test(script.src || '')
    : false;

  const allowlist = [
    'googletagmanager.com',
    'google-analytics.com',
    'gstatic.com',
    'googleapis.com',
    'cdnjs.cloudflare.com',
    'jsdelivr.net',
    'unpkg.com',
  ];

  const host = resolved?.hostname || '';
  const isAllowlisted = allowlist.some((d) => host.endsWith(d) || host === d);

  if (pageProtocol === 'https:' && isHttp) {
    flags.push('mixed-content');
  }

  if (!script.src) {
    const raw = (script.raw || '').toLowerCase();
    if (raw.includes('eval(') || raw.includes('new function') || raw.includes('document.write')) {
      flags.push('dangerous-inline');
    }
  }

  if (script.src && isHttps && isExternal && !script.integrity) {
    if (isAllowlisted) flags.push('external-no-sri-known-vendor');
    else flags.push('unknown-external-no-sri');
  }

  if (script.src && isHttps && isExternal && script.integrity) {
    const cors = (script.crossOrigin || '').toLowerCase();
    if (cors !== 'anonymous' && cors !== 'use-credentials') {
      flags.push('sri-without-crossorigin');
    }
  }

  if (
    script.src &&
    !script.async &&
    !script.defer &&
    !(script.type || '').toLowerCase().includes('module')
  ) {
    flags.push('blocking');
  }

  return flags;
}

export function analyzeScript(script: ScriptTag): ScriptAnalysisResult {
  const category = categorizeScript(script);
  const library = script.src ? detectLibrary(script.src) : undefined;
  const version = script.src ? extractVersion(script.src) : undefined;
  const securityFlags = getSecurityFlags(script);

  let description = '';

  if (!script.src) {
    description = 'Inline script embedded in the page';
  } else if (library) {
    description = `${library}${version ? ` v${version}` : ''}`;
  } else {
    try {
      const url =
        typeof window !== 'undefined'
          ? new URL(script.src, window.location.href)
          : new URL(script.src);
      description = `External script from ${url.hostname}`;
    } catch {
      description = 'External script';
    }
  }

  return {
    category,
    library,
    version,
    securityFlags,
    description,
  };
}

export function getCategoryDisplayName(category: ScriptCategory): string {
  switch (category) {
    case 'core':
      return 'Core Scripts';
    case 'third-party':
      return 'Third-Party';
    case 'framework':
      return 'Framework/Library';
    case 'functionality':
      return 'Functionality';
  }
}

export function getScriptStatistics(scripts: ScriptTag[]) {
  const analyses = scripts.map(analyzeScript);
  const pageUrl = typeof window !== 'undefined' ? new URL(window.location.href) : null;

  return {
    total: scripts.length,
    inline: scripts.filter((s) => !s.src).length,
    external: scripts.filter((s) => s.src).length,
    async: scripts.filter((s) => s.async).length,
    defer: scripts.filter((s) => s.defer).length,
    module: scripts.filter((s) => (s.type || '').toLowerCase().includes('module')).length,
    withIntegrity: scripts.filter((s) => s.integrity).length,
    blocking:
      scripts.length -
      scripts.filter((s) => !s.src).length -
      scripts.filter((s) => s.async).length -
      scripts.filter((s) => s.defer).length -
      scripts.filter((s) => (s.type || '').toLowerCase().includes('module')).length,
    mixedContent: scripts.filter((s) => {
      if (!s.src) return false;
      try {
        if (!pageUrl) return false;
        const resolved = new URL(s.src, pageUrl.href);
        return pageUrl.protocol === 'https:' && resolved.protocol === 'http:';
      } catch {
        return false;
      }
    }).length,
    externalWithoutIntegrity: scripts.filter((s) => {
      if (!s.src) return false;
      const src = s.src.toLowerCase();
      return (src.startsWith('http://') || src.startsWith('https://')) && !s.integrity;
    }).length,
    byCategory: {
      core: analyses.filter((a) => a.category === 'core').length,
      'third-party': analyses.filter((a) => a.category === 'third-party').length,
      framework: analyses.filter((a) => a.category === 'framework').length,
      functionality: analyses.filter((a) => a.category === 'functionality').length,
    },
    flagsCount: {
      mixedContent: analyses.filter((a) => a.securityFlags.includes('mixed-content')).length,
      dangerousInline: analyses.filter((a) => a.securityFlags.includes('dangerous-inline')).length,
      externalNoSriKnownVendor: analyses.filter((a) =>
        a.securityFlags.includes('external-no-sri-known-vendor')
      ).length,
      unknownExternalNoSri: analyses.filter((a) =>
        a.securityFlags.includes('unknown-external-no-sri')
      ).length,
      sriWithoutCrossorigin: analyses.filter((a) =>
        a.securityFlags.includes('sri-without-crossorigin')
      ).length,
      blocking: analyses.filter((a) => a.securityFlags.includes('blocking')).length,
    },
  };
}
