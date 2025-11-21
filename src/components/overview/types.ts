import type { ReactNode } from 'react';
import { RuntimeError } from '../../types/errors';

export class OverviewError extends Error implements RuntimeError {
  public type = 'runtime' as const;

  constructor(
    public code:
      | 'NO_DOCUMENT_ACCESS'
      | 'EXECUTION_ERROR'
      | 'VALIDATION_ERROR'
      | 'ANALYSIS_ERROR'
      | 'OVERVIEW_ANALYSIS_ERROR',
    message: string
  ) {
    super(message);
    this.name = 'OverviewError';
  }
}

export interface BaseTag {
  raw: string;
  content?: string;
}

export interface MetaTag extends BaseTag {
  name?: string;
  property?: string;
  charset?: string;
  httpEquiv?: string;
  type: 'standard' | 'opengraph' | 'twitter' | 'other';
}

export interface TitleTag extends MetaTag {
  name: 'title';
  type: 'standard';
  content: string;
}

export interface LinkTag extends BaseTag {
  rel: string;
  href: string;
  type?: string;
  hreflang?: string;
  media?: string;
  sizes?: string;
  crossOrigin?: string;
  integrity?: string;
}

export interface ScriptTag extends BaseTag {
  type: string;
  src?: string;
  async: boolean;
  defer: boolean;
  integrity?: string;
  crossOrigin?: string;
}

export interface XFNRelationship extends BaseTag {
  type: string;
  href: string;
  text: string;
  category: 'xfn' | 'nofollow' | 'noopener' | 'noreferrer' | 'ugc' | 'sponsored' | 'other';
}

export interface RelationshipLink {
  href: string;
  text: string;
  raw: string;
}

export interface TypedRelationshipLink extends RelationshipLink {
  type: string;
}

export interface PlatformRelationshipLink extends RelationshipLink {
  platform: string;
}

export interface RelationshipData {
  xfn: {
    identity: TypedRelationshipLink[];
    friendship: TypedRelationshipLink[];
    physical: TypedRelationshipLink[];
    professional: TypedRelationshipLink[];
    geographical: TypedRelationshipLink[];
    family: TypedRelationshipLink[];
    romantic: TypedRelationshipLink[];
  };
  seo: {
    nofollow: RelationshipLink[];
    noopener: RelationshipLink[];
    noreferrer: RelationshipLink[];
    ugc: RelationshipLink[];
    sponsored: RelationshipLink[];
  };
  social: {
    platforms: {
      facebook: RelationshipLink[];
      twitter: RelationshipLink[];
      linkedin: RelationshipLink[];
      instagram: RelationshipLink[];
      youtube: RelationshipLink[];
      pinterest: RelationshipLink[];
      other: PlatformRelationshipLink[];
    };
    policies: TypedRelationshipLink[];
  };
}

export interface PageStructure {
  headings: {
    h1: Array<{ content: string; raw: string }>;
    h2: Array<{ content: string; raw: string }>;
    h3: Array<{ content: string; raw: string }>;
    h4: Array<{ content: string; raw: string }>;
    h5: Array<{ content: string; raw: string }>;
    h6: Array<{ content: string; raw: string }>;
  };
  images: Array<{
    src: string;
    alt?: string;
    title?: string;
    width?: number;
    height?: number;
    raw: string;
  }>;
  links: Array<{
    href: string;
    text: string;
    title?: string;
    rel?: string;
    target?: string;
    isInternal: boolean;
    raw: string;
  }>;
}

export interface ResourceLink {
  href: string;
  as?: string;
  crossOrigin?: string;
  type?: string;
  fetchPriority?: string;
  media?: string;
  raw: string;
}

export interface ResourceLinks {
  preconnect: ResourceLink[];
  prefetch: ResourceLink[];
  preload: ResourceLink[];
  dnsPrefetch: ResourceLink[];
  prerender: ResourceLink[];
}

export interface TechnicalInfo {
  doctype: string | null;
  charset: string | null;
  viewport: string | null;
  language: string | null;
  compatMode: string;
  renderingMode: string;
}

export interface PageElements {
  meta: {
    standard: MetaTag[];
    opengraph: MetaTag[];
    twitter: MetaTag[];
    other: MetaTag[];
    raw: string[];
  };
  link: {
    byType: {
      alternate: LinkTag[];
      canonical: LinkTag[];
      stylesheet: LinkTag[];
      icon: LinkTag[];
      manifest: LinkTag[];
      other: LinkTag[];
    };
    raw: string[];
  };
  script: {
    byType: {
      async: ScriptTag[];
      defer: ScriptTag[];
      inline: ScriptTag[];
      external: ScriptTag[];
    };
    raw: string[];
  };
  relationships: RelationshipData;
}

export interface PageAnalysis {
  url: string;
  timestamp: number;
  technical: TechnicalInfo;
  elements: PageElements;
  structure: PageStructure;
  resources: ResourceLinks;
  raw: {
    head: string;
    body: string;
  };
}

export interface WebVitalMetric {
  value: number;
  name: 'CLS' | 'FCP' | 'INP' | 'LCP' | 'TTFB';
  rating: 'good' | 'needs-improvement' | 'poor';
  score: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  entries?: unknown[];
}

export interface AnalysisResult {
  pageAnalysis: PageAnalysis;
  webVitals?: Record<string, WebVitalMetric>;
}

export interface AnalysisCardProps {
  title: string | ReactNode;
  tooltip?: string;
  children: ReactNode;
  loading?: boolean;
}

export interface AnalysisState {
  status: 'idle' | 'loading' | 'success' | 'error';
  error: OverviewError | null;
  result: AnalysisResult | null;
}

export const initialAnalysisState: AnalysisState = {
  status: 'idle',
  error: null,
  result: null,
};
