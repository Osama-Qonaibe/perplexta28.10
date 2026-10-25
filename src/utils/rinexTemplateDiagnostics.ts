/**
 * Rinex Studio Template Diagnostic Engine
 * 
 * Provides real-time forensic tracking and diagnostic logging when images fail
 * to render during template initialization, and audits whether CSS variables
 * from index.html and the design system are correctly applied at that specific
 * lifecycle moment.
 */

export interface CssVariableAudit {
  name: string;
  source: 'index.html:style' | 'index.html:inline-script' | 'design-system:tokens';
  computedValue: string;
  inlineValue: string;
  isApplied: boolean;
  notes?: string;
}

export interface IndexHtmlCssDiagnostics {
  appliedCorrectly: boolean;
  appliedCount: number;
  totalCount: number;
  themeMode: string | null;
  datasetTheme: string | undefined;
  rootClasses: string[];
  colorScheme: string;
  variables: Record<string, CssVariableAudit>;
  missingOrEmptyVariables: string[];
}

export interface TemplateImageDiagnosticEntry {
  id: string;
  timestamp: string;
  lifecycleMoment: 
    | 'template_initialization'
    | 'template_replace'
    | 'template_initial_mount'
    | 'template_element_image_init'
    | 'template_frame_image_init'
    | 'template_poster_init'
    | 'template_background_init';
  templateId?: string;
  templateTitle?: string;
  elementId?: string;
  elementType?: string;
  imageSrc: string;
  failureReason: string;
  error?: any;
  naturalDimensions?: { width: number; height: number };
  cssVariablesStatus: IndexHtmlCssDiagnostics;
}

// Key CSS variables established in or expected by index.html and core layout
const INDEX_HTML_CSS_VARS: Array<{ name: string; source: 'index.html:style' | 'index.html:inline-script' | 'design-system:tokens' }> = [
  { name: '--pwa-theme-color', source: 'index.html:style' },
  { name: '--pwa-bg-color', source: 'index.html:style' },
  { name: '--surface-page', source: 'index.html:style' },
  { name: '--kb-height', source: 'index.html:inline-script' },
  { name: '--vv-height', source: 'index.html:inline-script' },
  { name: '--surface-card', source: 'design-system:tokens' },
  { name: '--surface-subtle', source: 'design-system:tokens' },
  { name: '--border-main', source: 'design-system:tokens' },
  { name: '--text-primary', source: 'design-system:tokens' },
  { name: '--text-secondary', source: 'design-system:tokens' },
  { name: '--text-muted', source: 'design-system:tokens' },
  { name: '--comp-button-primary-bg', source: 'design-system:tokens' },
  { name: '--comp-button-primary-fg', source: 'design-system:tokens' }
];

/**
 * Audits whether CSS variables declared in index.html (and the root theme engine)
 * are correctly applied to the document at this specific lifecycle moment.
 */
export function checkIndexHtmlCssVariables(): IndexHtmlCssDiagnostics {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return {
      appliedCorrectly: false,
      appliedCount: 0,
      totalCount: INDEX_HTML_CSS_VARS.length,
      themeMode: null,
      datasetTheme: undefined,
      rootClasses: [],
      colorScheme: 'unknown',
      variables: {},
      missingOrEmptyVariables: INDEX_HTML_CSS_VARS.map(v => v.name)
    };
  }

  const root = document.documentElement;
  const computed = window.getComputedStyle(root);
  const variables: Record<string, CssVariableAudit> = {};
  const missingOrEmptyVariables: string[] = [];
  let appliedCount = 0;

  for (const { name, source } of INDEX_HTML_CSS_VARS) {
    const inlineValue = root.style.getPropertyValue(name).trim();
    const computedValue = computed.getPropertyValue(name).trim();
    const isApplied = computedValue.length > 0;

    if (isApplied) {
      appliedCount++;
    } else {
      missingOrEmptyVariables.push(name);
    }

    variables[name] = {
      name,
      source,
      computedValue: computedValue || '(not applied)',
      inlineValue: inlineValue || '(not set inline)',
      isApplied,
      notes: isApplied ? 'Applied' : 'Missing from root computed styles'
    };
  }

  const rootClasses = Array.from(root.classList);
  const datasetTheme = root.dataset.theme;
  const colorScheme = computed.colorScheme || root.style.colorScheme || 'unknown';
  const themeMode = datasetTheme || (rootClasses.includes('dark') ? 'dark' : rootClasses.includes('light') ? 'light' : null);

  // In index.html, either --surface-page or --pwa-bg-color must resolve, plus theme attributes
  const isEssentialCoreApplied = Boolean(
    (variables['--surface-page']?.isApplied || variables['--pwa-bg-color']?.isApplied) &&
    (datasetTheme || rootClasses.includes('light') || rootClasses.includes('dark'))
  );

  return {
    appliedCorrectly: isEssentialCoreApplied && missingOrEmptyVariables.length === 0,
    appliedCount,
    totalCount: INDEX_HTML_CSS_VARS.length,
    themeMode,
    datasetTheme,
    rootClasses,
    colorScheme,
    variables,
    missingOrEmptyVariables
  };
}

// In-memory diagnostic ring buffer (last 50 diagnostic events)
const MAX_DIAGNOSTIC_ENTRIES = 50;
const diagnosticHistory: TemplateImageDiagnosticEntry[] = [];

// Global window registry for debugging and test runner inspection
if (typeof window !== 'undefined') {
  (window as any).__RINEX_DIAGNOSTIC_LOGS__ = diagnosticHistory;
}

/**
 * Diagnostic logs function in the template loading logic of the Rinex editor.
 * Tracks when images fail to render during template initialization,
 * and logs if the CSS variables from index.html are correctly applied at that specific moment.
 */
export function logTemplateImageDiagnostic(params: {
  lifecycleMoment: TemplateImageDiagnosticEntry['lifecycleMoment'];
  imageSrc: string;
  failureReason: string;
  templateId?: string;
  templateTitle?: string;
  elementId?: string;
  elementType?: string;
  error?: any;
  naturalDimensions?: { width: number; height: number };
}): TemplateImageDiagnosticEntry {
  const cssAudit = checkIndexHtmlCssVariables();
  const entry: TemplateImageDiagnosticEntry = {
    id: `diag-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    lifecycleMoment: params.lifecycleMoment,
    templateId: params.templateId,
    templateTitle: params.templateTitle,
    elementId: params.elementId,
    elementType: params.elementType,
    imageSrc: params.imageSrc,
    failureReason: params.failureReason,
    error: params.error,
    naturalDimensions: params.naturalDimensions,
    cssVariablesStatus: cssAudit
  };

  // Push to circular buffer
  diagnosticHistory.unshift(entry);
  if (diagnosticHistory.length > MAX_DIAGNOSTIC_ENTRIES) {
    diagnosticHistory.pop();
  }

  // Structured console output with high visibility
  const statusBadge = cssAudit.appliedCorrectly ? '✅ CSS VARS APPLIED' : '⚠️ CSS VARS DEGRADED';
  const groupLabel = `[Rinex Editor Diagnostic] 🚨 Image Failed to Render During Template Initialization [${params.lifecycleMoment}] — ${statusBadge}`;

  // Log diagnostic payload to console
  if (typeof console !== 'undefined') {
    if (console.groupCollapsed) {
      console.groupCollapsed(groupLabel);
    } else {
      console.warn(groupLabel);
    }

    console.warn('📌 Image Details:', {
      src: params.imageSrc,
      elementId: params.elementId || '(canvas background)',
      elementType: params.elementType || 'background',
      templateId: params.templateId || 'unknown',
      templateTitle: params.templateTitle || 'unknown',
      failureReason: params.failureReason,
      naturalDimensions: params.naturalDimensions,
      rawError: params.error
    });

    console.warn('🎨 CSS Variables from index.html Audit:', {
      allAppliedCorrectly: cssAudit.appliedCorrectly,
      appliedRatio: `${cssAudit.appliedCount}/${cssAudit.totalCount}`,
      themeMode: cssAudit.themeMode,
      datasetTheme: cssAudit.datasetTheme,
      rootClasses: cssAudit.rootClasses,
      colorScheme: cssAudit.colorScheme,
      missingOrEmpty: cssAudit.missingOrEmptyVariables,
      variablesBreakdown: cssAudit.variables
    });

    if (console.table) {
      const summaryTable = Object.values(cssAudit.variables).map(v => ({
        Variable: v.name,
        Source: v.source,
        Applied: v.isApplied ? 'YES' : 'NO',
        ComputedValue: v.computedValue,
        InlineValue: v.inlineValue
      }));
      console.table(summaryTable);
    }

    if (console.groupEnd) {
      console.groupEnd();
    }
  }

  // Dispatch custom window event so developer tools or UI can subscribe
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(
        new CustomEvent('rinex:template-image-diagnostic', {
          detail: entry
        })
      );
    } catch {}
  }

  return entry;
}

/**
 * Returns all captured Rinex template diagnostic log entries.
 */
export function getTemplateDiagnosticLogs(): TemplateImageDiagnosticEntry[] {
  return [...diagnosticHistory];
}

/**
 * Clears the diagnostic buffer (useful for test runs).
 */
export function clearTemplateDiagnosticLogs(): void {
  diagnosticHistory.length = 0;
}

/**
 * Proactively verifies all image assets within a template during initialization
 * and triggers diagnostic logging if any fail to decode or load.
 */
export function auditAndPreloadTemplateImages(
  template: {
    id?: string;
    titleAr?: string;
    titleEn?: string;
    backgroundColor?: string;
    canvasBackground?: string;
    backgroundImage?: string;
    thumbnailUrl?: string;
    elements?: any[];
  },
  lifecycleMoment: TemplateImageDiagnosticEntry['lifecycleMoment'] = 'template_initialization'
): void {
  if (!template) return;

  const tplId = template.id;
  const tplTitle = template.titleAr || template.titleEn || 'Untitled Template';
  const urlsToCheck: Array<{
    src: string;
    type: string;
    elementId?: string;
  }> = [];

  // 1. Background image candidates
  const bgCandidate = template.backgroundImage || 
    (template.canvasBackground && !template.canvasBackground.startsWith('data:image/svg+xml') && !template.canvasBackground.startsWith('<svg') ? template.canvasBackground : null) ||
    template.thumbnailUrl || null;

  if (bgCandidate && typeof bgCandidate === 'string' && !bgCandidate.startsWith('#') && !bgCandidate.startsWith('rgb')) {
    urlsToCheck.push({ src: bgCandidate, type: 'background' });
  }

  // 2. Elements image candidates
  if (Array.isArray(template.elements)) {
    for (const el of template.elements) {
      if (el.imgSrc && typeof el.imgSrc === 'string' && !el.imgSrc.startsWith('data:image/svg')) {
        urlsToCheck.push({ src: el.imgSrc, type: el.type || 'image', elementId: el.id });
      } else if (el.src && typeof el.src === 'string') {
        urlsToCheck.push({ src: el.src, type: el.type || 'image', elementId: el.id });
      } else if (el.url && typeof el.url === 'string' && (el.type === 'image' || el.type === 'sticker')) {
        urlsToCheck.push({ src: el.url, type: el.type || 'image', elementId: el.id });
      }

      if (el.frameImgSrc && typeof el.frameImgSrc === 'string') {
        urlsToCheck.push({ src: el.frameImgSrc, type: 'frame_photo', elementId: el.id });
      }

      if (el.videoPoster && typeof el.videoPoster === 'string') {
        urlsToCheck.push({ src: el.videoPoster, type: 'video_poster', elementId: el.id });
      }
    }
  }

  // Pre-flight image testing
  for (const item of urlsToCheck) {
    if (!item.src) continue;
    const testImg = new Image();
    if (item.src.startsWith('http')) {
      testImg.crossOrigin = 'anonymous';
    }

    testImg.onerror = (err) => {
      logTemplateImageDiagnostic({
        lifecycleMoment,
        imageSrc: item.src,
        failureReason: 'Failed to load image resource (network 404, CORS, or invalid source)',
        templateId: tplId,
        templateTitle: tplTitle,
        elementId: item.elementId,
        elementType: item.type,
        error: err
      });
    };

    testImg.onload = () => {
      if (testImg.naturalWidth === 0 || testImg.naturalHeight === 0) {
        logTemplateImageDiagnostic({
          lifecycleMoment,
          imageSrc: item.src,
          failureReason: 'Image loaded but has zero natural width or height (corrupt or unrenderable)',
          templateId: tplId,
          templateTitle: tplTitle,
          elementId: item.elementId,
          elementType: item.type,
          naturalDimensions: { width: testImg.naturalWidth, height: testImg.naturalHeight }
        });
      }
    };

    testImg.src = item.src;
  }
}

/**
 * Checks whether the canvas and its host container are fully mounted in the document DOM
 * before applying template styles and dimensions.
 */
export function isCanvasDomMounted(
  canvas: HTMLCanvasElement | null,
  container?: HTMLElement | null
): boolean {
  if (typeof document === 'undefined') return false;
  if (!canvas) return false;
  if (!document.body.contains(canvas)) return false;
  if (container && !document.body.contains(container)) return false;
  return true;
}

/**
 * Ensures DOM elements are fully mounted in the browser tree before applying template styles.
 * Yields via requestAnimationFrame loop until elements are mounted or timeout expires.
 */
export function waitForCanvasDomMount(
  getCanvas: () => HTMLCanvasElement | null,
  getContainer?: () => HTMLElement | null,
  timeoutMs: number = 1800
): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(false);
      return;
    }

    const initialCanvas = getCanvas();
    const initialContainer = getContainer ? getContainer() : undefined;
    if (isCanvasDomMounted(initialCanvas, initialContainer)) {
      resolve(true);
      return;
    }

    const startTime = performance.now();
    const checkMount = () => {
      const currentCanvas = getCanvas();
      const currentContainer = getContainer ? getContainer() : undefined;
      if (isCanvasDomMounted(currentCanvas, currentContainer)) {
        resolve(true);
        return;
      }

      if (performance.now() - startTime >= timeoutMs) {
        console.warn('[Rinex Diagnostics] Canvas DOM mount timeout reached, proceeding with fallback.');
        resolve(false);
        return;
      }

      requestAnimationFrame(checkMount);
    };

    requestAnimationFrame(checkMount);
  });
}

/**
 * Asynchronously waits for document fonts and core CSS variables to be ready
 * to ensure text measurements and styles are not executed with fallback system fonts.
 */
export async function ensureFontsAndCssReady(
  fontFamilies: string[] = ['Tajawal, sans-serif'],
  timeoutMs: number = 1200
): Promise<boolean> {
  if (typeof document === 'undefined') return true;

  try {
    const promises: Promise<any>[] = [];
    if (document.fonts && document.fonts.load) {
      for (const f of fontFamilies) {
        try {
          promises.push(document.fonts.load(`16px "${f.replace(/,.*$/, '').trim()}"`));
        } catch {}
      }
      if (document.fonts.ready) {
        promises.push(document.fonts.ready);
      }
    }

    const timeoutPromise = new Promise(resolve => setTimeout(resolve, timeoutMs));
    await Promise.race([
      Promise.all(promises),
      timeoutPromise
    ]);
    return true;
  } catch (err) {
    console.warn('[Rinex Diagnostics] Non-fatal font load wait notice:', err);
    return true;
  }
}

