import { SEOTool } from './types';

export const SEO_TOOLS: SEOTool[] = [
  // TECHNICAL SEO & VALIDATION
  {
    id: 'google-search-console',
    name: 'Google Search Console',
    description: 'Monitor site presence & indexing',
    url: 'https://search.google.com/search-console',
    category: 'technical',
  },
  {
    id: 'google-rich-results',
    name: 'Google Rich Results Test',
    description: 'Validate structured data',
    url: 'https://search.google.com/test/rich-results',
    category: 'technical',
  },
  {
    id: 'mobile-friendly-test',
    name: 'Mobile-Friendly Test',
    description: 'Check mobile compatibility',
    url: 'https://search.google.com/test/mobile-friendly',
    category: 'technical',
  },
  {
    id: 'w3c-html-validator',
    name: 'W3C HTML Validator',
    description: 'Validate HTML markup',
    url: 'https://validator.w3.org/check',
    category: 'technical',
  },
  {
    id: 'w3c-css-validator',
    name: 'W3C CSS Validator',
    description: 'Validate CSS',
    url: 'https://jigsaw.w3.org/css-validator/validator',
    category: 'technical',
  },
  {
    id: 'schema-markup-validator',
    name: 'Schema Markup Validator',
    description: 'Test structured data',
    url: 'https://validator.schema.org/',
    category: 'technical',
  },
  {
    id: 'google-safe-browsing',
    name: 'Google Safe Browsing',
    description: 'Check for malware/phishing',
    url: 'https://transparencyreport.google.com/safe-browsing/search',
    category: 'technical',
  },

  // PERFORMANCE & SPEED
  {
    id: 'pagespeed-insights',
    name: 'Google PageSpeed Insights',
    description: 'Core Web Vitals & optimization tips',
    url: 'https://developers.google.com/speed/pagespeed/insights/',
    category: 'performance',
  },
  {
    id: 'gtmetrix',
    name: 'GTmetrix',
    description: 'Detailed performance analysis',
    url: 'https://gtmetrix.com/',
    category: 'performance',
  },
  {
    id: 'webpagetest',
    name: 'WebPageTest',
    description: 'Advanced testing with global locations',
    url: 'https://www.webpagetest.org/',
    category: 'performance',
  },

  // CONTENT & SOCIAL
  {
    id: 'facebook-debugger',
    name: 'Facebook Sharing Debugger',
    description: 'Test Open Graph tags',
    url: 'https://developers.facebook.com/tools/debug/',
    category: 'content',
  },
  {
    id: 'twitter-card-validator',
    name: 'Twitter Card Validator',
    description: 'Validate Twitter cards',
    url: 'https://cards-dev.twitter.com/validator',
    category: 'content',
  },
  {
    id: 'linkedin-inspector',
    name: 'LinkedIn Post Inspector',
    description: 'Preview LinkedIn shares',
    url: 'https://www.linkedin.com/post-inspector/',
    category: 'content',
  },
  {
    id: 'hemingway',
    name: 'Hemingway Editor',
    description: 'Improve readability',
    url: 'https://hemingwayapp.com/',
    category: 'content',
  },

  // KEYWORDS & RESEARCH
  {
    id: 'google-keyword-planner',
    name: 'Google Keyword Planner',
    description: 'Search volume & keyword ideas',
    url: 'https://ads.google.com/home/tools/keyword-planner/',
    category: 'keywords',
  },
  {
    id: 'google-trends',
    name: 'Google Trends',
    description: 'Trending topics & search interest',
    url: 'https://trends.google.com/',
    category: 'keywords',
  },
  {
    id: 'answerthepublic',
    name: 'Answer The Public',
    description: 'Question-based keyword research',
    url: 'https://answerthepublic.com/',
    category: 'keywords',
  },

  // BACKLINKS & AUTHORITY
  {
    id: 'ahrefs-backlink-checker',
    name: 'Ahrefs Backlink Checker',
    description: 'Free backlink analysis (limited)',
    url: 'https://ahrefs.com/backlink-checker',
    category: 'backlinks',
  },
  {
    id: 'moz-link-explorer',
    name: 'Moz Link Explorer',
    description: 'Domain authority & backlink data',
    url: 'https://moz.com/link-explorer',
    category: 'backlinks',
  },

  // GOOGLE SEARCH OPERATORS
  {
    id: 'google-site-images',
    name: 'Site Images',
    description: 'View all indexed images from this site',
    url: 'https://www.google.com/search',
    category: 'search',
  },
  {
    id: 'google-indexed-pages',
    name: 'Indexed Pages',
    description: 'See all pages indexed by Google',
    url: 'https://www.google.com/search',
    category: 'search',
  },
  {
    id: 'google-similar-sites',
    name: 'Similar Sites',
    description: 'Find sites similar to this one',
    url: 'https://www.google.com/search',
    category: 'search',
  },
  {
    id: 'google-links-to-page',
    name: 'Links to Page',
    description: 'Find pages linking to this URL',
    url: 'https://www.google.com/search',
    category: 'search',
  },
];

export function buildToolUrl(tool: SEOTool, currentUrl: string): string {
  if (!currentUrl) return tool.url;

  const encodedUrl = encodeURIComponent(currentUrl);
  const domain = currentUrl ? new URL(currentUrl).hostname : '';

  const urlParam: Record<string, string> = {
    'pagespeed-insights': `?url=${encodedUrl}`,
    gtmetrix: `?url=${currentUrl}`,
    'mobile-friendly-test': `?url=${encodedUrl}`,
    'google-rich-results': `?url=${encodedUrl}`,
    'w3c-html-validator': `?uri=${currentUrl}`,
    'w3c-css-validator': `?uri=${currentUrl}`,
    'schema-markup-validator': `#url=${encodedUrl}`,
    'facebook-debugger': `?q=${encodedUrl}`,
    'linkedin-inspector': `inspect/${encodedUrl}`,
    'ahrefs-backlink-checker': `?input=${encodedUrl}`,
    'moz-link-explorer': `?input=${domain}`,
    'google-safe-browsing': `?url=${domain}`,
    'google-site-images': `?tbm=isch&q=site:${domain}`,
    'google-indexed-pages': `?q=site:${domain}`,
    'google-similar-sites': `?q=related:${domain}`,
    'google-links-to-page': `?q=link:${currentUrl}`,
  };

  return tool.url + (urlParam[tool.id] || '');
}

export function getToolsByCategory(category: string): SEOTool[] {
  return SEO_TOOLS.filter((tool) => tool.category === category);
}

export function getAllCategories(): string[] {
  return Array.from(new Set(SEO_TOOLS.map((tool) => tool.category)));
}
