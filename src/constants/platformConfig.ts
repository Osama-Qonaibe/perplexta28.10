/**
 * PERPLEXTA PLATFORM CONFIGURATION
 * 
 * Centralized registry for platform metrics, default configurations, 
 * and fallback strings to satisfy the Orchestrator Absolutism principle.
 */

export const PLATFORM_COMMERCIAL_CONFIG = {
  AD_USE_ROYALTY: '$0.70 / use',
  RECURRING_COMMISSION: '20% Recurring',
  CREATOR_WELCOME_BONUS: '$50 Creator Bonus'
};

export const LANDING_HERO_DEFAULTS = {
  titleAr: 'جولة سريعة داخل منظومة بيربليكستا',
  titleEn: 'Quick Tour Inside Perplexta Ecosystem',
  descriptionAr: 'شاهد كيف يمكنك توليد تطبيقات كاملة، وتصميم قوالب بصرية متجهة، وإنجاز أبحاثك الأكاديمية في بيئة عمل هندسية متكاملة.',
  descriptionEn: 'Experience how you can generate full-stack apps, design multi-layer templates, and complete scholarly research inside a unified enterprise platform.',
  autoplay: true,
  muted: true,
  loop: true,
  controls: true,
  sourceType: 'file' as const
};

export const ECOSYSTEM_PARTNER_COLORS = {
  GOOGLE: 'var(--github-blue)',
  PERPLEXITY: 'var(--github-blue)',
  HUGGING_FACE: 'var(--github-orange)',
  COHERE: 'var(--github-purple)',
  MISTRAL: 'var(--github-orange)',
  DEEPSEEK: 'var(--github-blue)',
  QWEN: 'var(--github-orange)',
  OLLAMA: 'var(--github-green)',
  STABILITY: 'var(--github-purple)',
  META: 'var(--github-blue)',
  ANTHROPIC: 'var(--github-orange)',
  OPENAI: 'var(--github-green)'
};
