import { z } from 'zod';
import { RuntimeError } from '../../types/errors';
import { BaseValidator } from '../../types/validation';

export const IMAGE_FORMATS: Record<string, string | undefined> = {
  avif: undefined,
  jxl: undefined,
  webp: undefined,
  webp2: 'webp',
  heif: undefined,
  heic: 'heif',
  jpeg: undefined,
  jpg: 'jpeg',
  jfif: 'jpeg',
  pjpeg: 'jpeg',
  pjp: 'jpeg',
  png: undefined,
  gif: undefined,
  svg: undefined,
  'svg+xml': 'svg',
  svgz: 'svg',
  bmp: undefined,
  ico: undefined,
  cur: 'ico',
  'x-icon': 'ico',
  'vnd.microsoft.icon': 'ico',
  ani: 'ico',
  wbmp: undefined,
  tiff: undefined,
  tif: 'tiff',
  dng: undefined,
  apng: 'png',
  mng: undefined,
  flif: undefined,
  anim: 'gif',
  psd: undefined,
  psb: 'psd',
  xcf: undefined,
  ai: undefined,
  eps: undefined,
  pdf: undefined,
  cdr: undefined,
  indd: undefined,
  qxd: undefined,
  sketch: undefined,
  figma: undefined,
  raw: undefined,
  arw: 'raw',
  cr2: 'raw',
  cr3: 'raw',
  crw: 'raw',
  dcr: 'raw',
  erf: 'raw',
  kdc: 'raw',
  mef: 'raw',
  mos: 'raw',
  mrw: 'raw',
  nef: 'raw',
  nrw: 'raw',
  orf: 'raw',
  pef: 'raw',
  raf: 'raw',
  rw2: 'raw',
  rwl: 'raw',
  srf: 'raw',
  srw: 'raw',
  x3f: 'raw',
  '3fr': 'raw',
  pcx: undefined,
  tga: undefined,
  vda: 'tga',
  icb: 'tga',
  vst: 'tga',
  dds: undefined,
  hdr: undefined,
  exr: undefined,
  emf: undefined,
  wmf: undefined,
  art: undefined,
  mac: undefined,
  msp: undefined,
  rgbe: 'hdr',
  xyze: 'hdr',
  dicom: undefined,
  dcm: 'dicom',
  fits: undefined,
  fit: 'fits',
  fts: 'fits',
  nii: undefined,
  'nii.gz': 'nii',
  analyze: undefined,
  mgh: undefined,
  mgz: 'mgh',
  minc: undefined,
  mnc: 'minc',
  jpeg2000: undefined,
  jp2: 'jpeg2000',
  j2k: 'jpeg2000',
  jpf: 'jpeg2000',
  jpx: 'jpeg2000',
  j2c: 'jpeg2000',
  jpc: 'jpeg2000',
  jxr: undefined,
  hdp: 'jxr',
  wdp: 'jxr',
  qoi: undefined,
  ktx: undefined,
  ktx2: undefined,
  pnm: undefined,
  ppm: 'pnm',
  pgm: 'pnm',
  pbm: 'pnm',
  pam: 'pnm',
  sct: undefined,
  pct: undefined,
  pict: 'pct',
  ras: undefined,
  xpm: undefined,
  djvu: undefined,
  djv: 'djvu',
  pic: undefined,
  psp: undefined,
  wpg: undefined,
  fpx: undefined,
  pgf: undefined,
  cin: undefined,
  dpx: undefined,
  ecw: undefined,
  ima: 'dicom',
  sgi: undefined,
  rgb: 'sgi',
  bw: 'sgi',
  rgba: 'sgi',
  sun: undefined,
  viff: undefined,
  xbm: undefined,
  xwd: undefined,
  '360': undefined,
  mpo: undefined,
  jps: undefined,
  pns: undefined,
};

export const CANONICAL_FORMATS = new Set(
  Object.entries(IMAGE_FORMATS)
    .filter(([_, canonical]) => canonical === undefined)
    .map(([format]) => format)
);

export type ImagesErrorCode =
  | 'IMAGES_ERROR'
  | 'EXECUTION_ERROR'
  | 'VALIDATION_ERROR'
  | 'ANALYSIS_ERROR'
  | 'NO_DOCUMENT_ACCESS'
  | 'UNKNOWN_ERROR'
  | 'INVALID_DATA_URL'
  | 'FETCH_ERROR'
  | 'EXPORT_ERROR';

export class ImagesError extends Error implements RuntimeError {
  readonly type = 'runtime';
  readonly code: ImagesErrorCode;

  constructor(code: ImagesErrorCode, message: string) {
    super(message);
    this.name = 'ImagesError';
    this.code = code;
  }
}

export type ImageData = {
  src: string;
  alt: string | null;
  title: string | null;
  width: number | null;
  height: number | null;
  fileSize: number | null;
  hasAlt: boolean;
  hasAltContent: boolean;
  hasTitle: boolean;
  format: string | null;
  isNextGen?: boolean;
  caption?: string | null;
  loading?: string | null;
  sources?: string[];
  isLazy?: boolean;
  position: number;
};

export type ImageMetrics = {
  totalCount: number;
  missingAltCount: number;
  missingTitleCount: number;
  totalFileSize: number;
  averageFileSize: number;
  needsOptimizationCount: number;
  optimizedCount: number;
  oversizedCount?: number;
  missingDimensionsCount?: number;
  lazyCandidatesCount?: number;
};

export type SortField =
  | 'appearance'
  | 'url'
  | 'dimensions'
  | 'fileSize'
  | 'missingAlt'
  | 'optimized'
  | 'lazy'
  | 'missingDimensions'
  | 'format'
  | 'oversized';
export type SortDirection = 'asc' | 'desc';

export interface SortOptions {
  field: SortField;
  direction: SortDirection;
}

export interface FilterOptions {
  showMissingAlt: boolean;
  showNeedsOptimization: boolean;
  showOversized?: boolean;
  showMissingDimensions?: boolean;
  showLazyCandidates?: boolean;
}

export interface ImageToolbarProps {
  filters: FilterOptions;
  sort: SortOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onSortChange: (sort: SortOptions) => void;
  onExport: () => void;
  onDownloadImages: () => void;
  disabled: boolean;
  filterCounts?: {
    missingAlt: number;
    needsOptimization: number;
    oversized: number;
    missingDimensions: number;
    lazyCandidates: number;
  };
}

export type AnalysisResult = {
  metrics: ImageMetrics;
  images: ImageData[];
};

export interface AnalysisState {
  status: 'idle' | 'loading' | 'loading-sizes' | 'success' | 'error';
  error: ImagesError | null;
  result: AnalysisResult | null;
}

export interface ErrorScreenProps {
  title?: string;
  message: string;
  error?: RuntimeError;
  onRetry?: () => void;
}

export interface QuickMetricsProps {
  metrics: ImageMetrics | null;
  isLoading: boolean;
}

const imageDataSchema = z
  .object({
    src: z.string(),
    alt: z.string().nullable(),
    title: z.string().nullable(),
    width: z.number().nullable(),
    height: z.number().nullable(),
    fileSize: z.number().nullable(),
    hasAlt: z.boolean(),
    hasAltContent: z.boolean(),
    hasTitle: z.boolean(),
    format: z.string().nullable(),
    isNextGen: z.boolean().optional(),
    caption: z.string().nullable().optional(),
    loading: z.string().nullable().optional(),
    sources: z.array(z.string()).optional(),
    isLazy: z.boolean().optional(),
    position: z.number(),
  })
  .strict();

const imageMetricsSchema = z
  .object({
    totalCount: z.number(),
    missingAltCount: z.number(),
    missingTitleCount: z.number(),
    totalFileSize: z.number(),
    averageFileSize: z.number(),
    needsOptimizationCount: z.number(),
    optimizedCount: z.number(),
    oversizedCount: z.number().optional(),
    missingDimensionsCount: z.number().optional(),
    lazyCandidatesCount: z.number().optional(),
  })
  .strict();

const analysisResultSchema = z
  .object({
    metrics: imageMetricsSchema,
    images: z.array(imageDataSchema),
  })
  .strict();

export type ImageDataSchemaType = z.infer<typeof imageDataSchema>;
export type AnalysisResultSchemaType = z.infer<typeof analysisResultSchema>;

export class ImageDataValidator extends BaseValidator<ImageDataSchemaType> {
  constructor() {
    super(imageDataSchema);
  }
}

export class AnalysisResultValidator extends BaseValidator<AnalysisResultSchemaType> {
  constructor() {
    super(analysisResultSchema);
  }
}

export const hasDimensions = (img: ImageData): boolean => {
  return !!(img.width && img.width > 0 && img.height && img.height > 0);
};
