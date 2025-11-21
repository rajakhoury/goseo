import { MetaTag } from '../types';

export interface MetaCategory {
  id: string;
  name: string;
  description: string;
  tags: MetaTag[];
  subcategories?: MetaCategory[];
}

export interface ValidationIssue {
  type: 'duplicate' | 'conflict' | 'missing' | 'deprecated';
  severity: 'error' | 'warning' | 'info';
  message: string;
  tags?: MetaTag[];
}

export function categorizeMeta(allTags: MetaTag[]): MetaCategory[] {
  const categories: MetaCategory[] = [];

  const seoTags = allTags.filter((tag) => {
    const name = tag.name?.toLowerCase() || '';
    const property = tag.property?.toLowerCase() || '';
    return (
      name === 'title' ||
      name === 'description' ||
      name === 'keywords' ||
      name === 'robots' ||
      name === 'author' ||
      name === 'publisher' ||
      property === 'canonical' ||
      name.includes('lang')
    );
  });

  if (seoTags.length > 0) {
    categories.push({
      id: 'seo',
      name: 'SEO Metadata',
      description: 'Basic SEO meta tags (title, description, keywords, robots)',
      tags: seoTags,
    });
  }

  const socialCategories: MetaCategory[] = [];

  const ogTags = allTags.filter((tag) => tag.property?.toLowerCase().startsWith('og:'));
  if (ogTags.length > 0) {
    socialCategories.push({
      id: 'opengraph',
      name: 'Open Graph',
      description: 'Facebook and social sharing tags',
      tags: ogTags,
    });
  }

  const twitterTags = allTags.filter(
    (tag) =>
      tag.name?.toLowerCase().startsWith('twitter:') ||
      tag.property?.toLowerCase().startsWith('twitter:')
  );
  if (twitterTags.length > 0) {
    socialCategories.push({
      id: 'twitter',
      name: 'Twitter Cards',
      description: 'Twitter-specific meta tags',
      tags: twitterTags,
    });
  }

  const fbTags = allTags.filter((tag) => {
    const property = tag.property?.toLowerCase() || '';
    return property.startsWith('fb:') || property.includes('facebook');
  });
  if (fbTags.length > 0) {
    socialCategories.push({
      id: 'facebook',
      name: 'Facebook',
      description: 'Facebook-specific meta tags',
      tags: fbTags,
    });
  }

  if (socialCategories.length > 0) {
    categories.push({
      id: 'social',
      name: 'Social Media Tags',
      description: 'Tags for social media platforms',
      tags: [],
      subcategories: socialCategories,
    });
  }

  const technicalTags = allTags.filter((tag) => {
    const name = tag.name?.toLowerCase() || '';
    const httpEquiv = tag.httpEquiv?.toLowerCase() || '';
    return (
      tag.charset ||
      name === 'viewport' ||
      httpEquiv.includes('content-security-policy') ||
      httpEquiv.includes('content-type') ||
      httpEquiv.includes('cache-control') ||
      httpEquiv.includes('refresh') ||
      name === 'format-detection'
    );
  });

  if (technicalTags.length > 0) {
    categories.push({
      id: 'technical',
      name: 'Technical Metadata',
      description: 'Character encoding, viewport, CSP, cache control',
      tags: technicalTags,
    });
  }

  const appTags = allTags.filter((tag) => {
    const name = tag.name?.toLowerCase() || '';
    return (
      name.startsWith('apple-') ||
      name.startsWith('msapplication-') ||
      name === 'mobile-web-app-capable' ||
      name === 'theme-color' ||
      name.includes('app-')
    );
  });

  if (appTags.length > 0) {
    categories.push({
      id: 'application',
      name: 'Application Metadata',
      description: 'Mobile app, PWA, and platform-specific tags',
      tags: appTags,
    });
  }

  const analyticsTags = allTags.filter((tag) => {
    const name = tag.name?.toLowerCase() || '';
    const property = tag.property?.toLowerCase() || '';
    return (
      name.includes('google') ||
      name.includes('gtm') ||
      name.includes('ga-') ||
      property.includes('google') ||
      name.includes('facebook-domain-verification') ||
      name.includes('pinterest-') ||
      name.includes('verify')
    );
  });

  if (analyticsTags.length > 0) {
    categories.push({
      id: 'analytics',
      name: 'Analytics & Tracking',
      description: 'Google, Facebook, and other analytics tags',
      tags: analyticsTags,
    });
  }

  const categorizedIds = new Set(
    categories.flatMap((cat) => {
      if (cat.subcategories) {
        return cat.subcategories.flatMap((sub) => sub.tags.map((t) => t.raw));
      }
      return cat.tags.map((t) => t.raw);
    })
  );

  const otherTags = allTags.filter((tag) => !categorizedIds.has(tag.raw));
  if (otherTags.length > 0) {
    categories.push({
      id: 'other',
      name: 'Other Tags',
      description: 'Uncategorized or custom meta tags',
      tags: otherTags,
    });
  }

  return categories;
}

export function findDuplicates(tags: MetaTag[]): MetaTag[][] {
  const duplicates: MetaTag[][] = [];
  const seen = new Map<string, MetaTag[]>();

  tags.forEach((tag) => {
    const key = tag.name || tag.property || tag.charset || tag.httpEquiv || '';
    if (!key) return;

    if (!seen.has(key)) {
      seen.set(key, []);
    }
    seen.get(key)!.push(tag);
  });

  seen.forEach((group) => {
    if (group.length > 1) {
      duplicates.push(group);
    }
  });

  return duplicates;
}

export function validateMetaTags(tags: MetaTag[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const duplicates = findDuplicates(tags);
  duplicates.forEach((group) => {
    const identifier = group[0].name || group[0].property || 'unknown';
    issues.push({
      type: 'duplicate',
      severity: 'warning',
      message: `Duplicate meta tag: ${identifier} (found ${group.length} times)`,
      tags: group,
    });
  });

  const hasTitle = tags.some((t) => t.name === 'title');
  const hasDescription = tags.some((t) => t.name === 'description');
  const hasViewport = tags.some((t) => t.name === 'viewport');

  if (!hasTitle) {
    issues.push({
      type: 'missing',
      severity: 'error',
      message: 'Missing title tag - essential for SEO',
    });
  }

  if (!hasDescription) {
    issues.push({
      type: 'missing',
      severity: 'warning',
      message: 'Missing description tag - important for SEO',
    });
  }

  if (!hasViewport) {
    issues.push({
      type: 'missing',
      severity: 'warning',
      message: 'Missing viewport tag - important for mobile responsiveness',
    });
  }

  const hasKeywords = tags.some((t) => t.name === 'keywords');
  if (hasKeywords) {
    issues.push({
      type: 'deprecated',
      severity: 'info',
      message: 'Keywords meta tag is largely ignored by modern search engines',
    });
  }

  const robotsTags = tags.filter((t) => t.name === 'robots');
  if (robotsTags.length > 0) {
    robotsTags.forEach((tag) => {
      const content = tag.content?.toLowerCase() || '';
      if (content.includes('noindex') && content.includes('index')) {
        issues.push({
          type: 'conflict',
          severity: 'error',
          message: 'Conflicting robots directives: both index and noindex specified',
          tags: [tag],
        });
      }
    });
  }

  return issues;
}
