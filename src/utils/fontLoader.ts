export interface FontLanguageConfig {
  fontFamily: string;
  enabled: boolean;
  url: string;
  weights?: number[];
  fallback?: string[];
}

export interface FontLoadingConfig {
  ar: FontLanguageConfig;
  en: FontLanguageConfig;
  dynamicLoading: boolean;
  [key: string]: any;
}

export const DEFAULT_FONT_CONFIG: FontLoadingConfig = {
  ar: {
    fontFamily: 'Tajawal',
    enabled: false, // Unified typography stack (Inter + Tajawal) is loaded authoritatively in index.html
    url: 'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap'
  },
  en: {
    fontFamily: 'Inter',
    enabled: false, // Unified typography stack (Inter + Tajawal) is loaded authoritatively in index.html
    url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
  },
  dynamicLoading: false
};

/**
 * Ensures any legacy dynamic font links (Cairo, Geist, Space Grotesk) are purged
 * so the platform strictly uses the single unified Inter (English) + Tajawal (Arabic) font stack.
 */
export function applyLanguageFont(_lang: 'ar' | 'en', _config?: FontLoadingConfig | null) {
  if (typeof document === 'undefined') return;

  const legacyLinkIds = [
    'font-stylesheet-tajawal',
    'font-stylesheet-space-grotesk',
    'dynamic-language-font'
  ];

  for (const id of legacyLinkIds) {
    const el = document.getElementById(id);
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }
}
