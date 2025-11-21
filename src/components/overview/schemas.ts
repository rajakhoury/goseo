import { z } from 'zod';
export const baseTagSchema = z
  .looseObject({
    raw: z.string(),
    content: z.string().optional(),
  })
  .catchall(z.unknown());

export const metaTagSchema = baseTagSchema
  .extend({
    name: z.string().optional(),
    property: z.string().optional(),
    charset: z.string().optional(),
    httpEquiv: z.string().optional(),
    type: z.enum(['standard', 'opengraph', 'twitter', 'other']),
    raw: z.string(),
  })
  .catchall(z.unknown());

export const titleTagSchema = metaTagSchema
  .extend({
    name: z.literal('title'),
    type: z.literal('standard'),
    content: z.string(),
  })
  .catchall(z.unknown());

export const linkTagSchema = baseTagSchema
  .extend({
    rel: z.string(),
    href: z.string(),
    type: z.string().optional(),
    hreflang: z.string().optional(),
    media: z.string().optional(),
    sizes: z.string().optional(),
    crossOrigin: z.string().optional(),
    integrity: z.string().optional(),
  })
  .catchall(z.unknown());

export const scriptTagSchema = baseTagSchema
  .extend({
    type: z.string(),
    src: z.string().optional(),
    async: z.boolean(),
    defer: z.boolean(),
    integrity: z.string().optional(),
    crossOrigin: z.string().optional(),
  })
  .catchall(z.unknown());

const relationshipLinkSchema = z
  .looseObject({
    href: z.string(),
    text: z.string(),
    raw: z.string(),
  })
  .catchall(z.unknown());

const typedRelationshipLinkSchema = relationshipLinkSchema
  .extend({
    type: z.string(),
  })
  .catchall(z.unknown());

const platformRelationshipLinkSchema = relationshipLinkSchema
  .extend({
    platform: z.string(),
  })
  .catchall(z.unknown());

export const relationshipDataSchema = z
  .looseObject({
    xfn: z.object({
      identity: z.array(typedRelationshipLinkSchema),
      friendship: z.array(typedRelationshipLinkSchema),
      physical: z.array(typedRelationshipLinkSchema),
      professional: z.array(typedRelationshipLinkSchema),
      geographical: z.array(typedRelationshipLinkSchema),
      family: z.array(typedRelationshipLinkSchema),
      romantic: z.array(typedRelationshipLinkSchema),
    }),
    seo: z.object({
      nofollow: z.array(relationshipLinkSchema),
      noopener: z.array(relationshipLinkSchema),
      noreferrer: z.array(relationshipLinkSchema),
      ugc: z.array(relationshipLinkSchema),
      sponsored: z.array(relationshipLinkSchema),
    }),
    social: z.object({
      platforms: z.object({
        facebook: z.array(relationshipLinkSchema),
        twitter: z.array(relationshipLinkSchema),
        linkedin: z.array(relationshipLinkSchema),
        instagram: z.array(relationshipLinkSchema),
        youtube: z.array(relationshipLinkSchema),
        pinterest: z.array(relationshipLinkSchema),
        other: z.array(platformRelationshipLinkSchema),
      }),
      policies: z.array(typedRelationshipLinkSchema),
    }),
  })
  .catchall(z.unknown());

const headingContentSchema = z
  .looseObject({
    content: z.string(),
    raw: z.string(),
  })
  .catchall(z.unknown());

export const pageStructureSchema = z
  .looseObject({
    headings: z.object({
      h1: z.array(headingContentSchema),
      h2: z.array(headingContentSchema),
      h3: z.array(headingContentSchema),
      h4: z.array(headingContentSchema),
      h5: z.array(headingContentSchema),
      h6: z.array(headingContentSchema),
    }),
    images: z.array(
      z.object({
        src: z.string(),
        alt: z.string().optional(),
        title: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
        raw: z.string(),
      })
    ),
    links: z.array(
      z.object({
        href: z.string(),
        text: z.string(),
        title: z.string().optional(),
        rel: z.string().optional(),
        target: z.string().optional(),
        isInternal: z.boolean(),
        raw: z.string(),
      })
    ),
  })
  .catchall(z.unknown());

const resourceLinkSchema = z
  .looseObject({
    href: z.string(),
    as: z.string().optional(),
    crossOrigin: z.string().optional(),
    type: z.string().optional(),
    fetchPriority: z.string().optional(),
    media: z.string().optional(),
    raw: z.string(),
  })
  .catchall(z.unknown());

export const resourceLinksSchema = z
  .looseObject({
    preconnect: z.array(resourceLinkSchema),
    prefetch: z.array(resourceLinkSchema),
    preload: z.array(resourceLinkSchema),
    dnsPrefetch: z.array(resourceLinkSchema),
    prerender: z.array(resourceLinkSchema),
  })
  .catchall(z.unknown());

export const technicalInfoSchema = z
  .looseObject({
    doctype: z.string().nullable(),
    charset: z.string().nullable(),
    viewport: z.string().nullable(),
    language: z.string().nullable(),
    compatMode: z.string(),
    renderingMode: z.string(),
  })
  .catchall(z.unknown());

export const pageElementsSchema = z
  .looseObject({
    meta: z.object({
      standard: z.array(metaTagSchema),
      opengraph: z.array(metaTagSchema),
      twitter: z.array(metaTagSchema),
      other: z.array(metaTagSchema),
      raw: z.array(z.string()),
    }),
    link: z.object({
      byType: z.object({
        alternate: z.array(linkTagSchema),
        canonical: z.array(linkTagSchema),
        stylesheet: z.array(linkTagSchema),
        icon: z.array(linkTagSchema),
        manifest: z.array(linkTagSchema),
        other: z.array(linkTagSchema),
      }),
      raw: z.array(z.string()),
    }),
    script: z.object({
      byType: z.object({
        async: z.array(scriptTagSchema),
        defer: z.array(scriptTagSchema),
        inline: z.array(scriptTagSchema),
        external: z.array(scriptTagSchema),
      }),
      raw: z.array(z.string()),
    }),
    relationships: relationshipDataSchema,
  })
  .catchall(z.unknown());

export const webVitalMetricSchema = z
  .looseObject({
    name: z.enum(['CLS', 'FCP', 'INP', 'LCP', 'TTFB']),
    rating: z.enum(['good', 'needs-improvement', 'poor']),
    score: z.enum(['good', 'needs-improvement', 'poor']),
  })
  .extend({
    value: z.number(),
    delta: z.number(),
    id: z.string(),
    entries: z.array(z.any()).optional(),
  })
  .catchall(z.unknown());

export const pageAnalysisSchema = z
  .looseObject({
    url: z.string(),
    timestamp: z.number(),
    technical: technicalInfoSchema,
    elements: pageElementsSchema,
    structure: pageStructureSchema,
    resources: resourceLinksSchema,
    raw: z.object({
      head: z.string(),
      body: z.string(),
    }),
  })
  .catchall(z.unknown());

export const analysisResultSchema = z
  .looseObject({
    pageAnalysis: pageAnalysisSchema,
    webVitals: z.record(z.string(), webVitalMetricSchema).optional(),
  })
  .catchall(z.unknown());
