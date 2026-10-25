/**
 * CONTEXTUAL SUGGESTIONS & AUTOCOMPLETE REGISTRY
 * 
 * High-performance, zero-latency client-side suggestion index.
 * Covers all platform tools with domain-specific, professional prompts
 * in both Arabic and English.
 */

export interface ContextualSuggestion {
  id: string;
  text: string;
  titleAr: string;
  titleEn: string;
  toolId: string;
  categoryAr: string;
  categoryEn: string;
}

export const SUGGESTIONS_CATALOG: ContextualSuggestion[] = [
  // --- Research, Deep Analysis & Intelligence (perplexta_analysis) ---
  {
    id: 's_search_1',
    text: 'تاريخ الخليل بن أحمد الفراهيدي وتأسيس علم العروض والمعاجم العربية',
    titleAr: 'تاريخ الفراهيدي',
    titleEn: 'Al-Farahidi History',
    toolId: 'perplexta_analysis',
    categoryAr: 'توثيق تاريخي',
    categoryEn: 'Historical Research',
  },
  {
    id: 's_search_2',
    text: 'تطور الحوسبة الكمومية وتطبيقاتها في خوارزميات التشفير الحديثة',
    titleAr: 'الحوسبة الكمومية',
    titleEn: 'Quantum Computing',
    toolId: 'perplexta_analysis',
    categoryAr: 'بحث علمي',
    categoryEn: 'Scientific Research',
  },
  {
    id: 's_search_3',
    text: 'مقارنة منهجية شاملة بين معماريات الذكاء الاصطناعي Transformer و Mamba',
    titleAr: 'معماريات الذكاء',
    titleEn: 'AI Architectures',
    toolId: 'perplexta_analysis',
    categoryAr: 'تحليل تقني',
    categoryEn: 'Technical Analysis',
  },
  {
    id: 's_search_4',
    text: 'استراتيجيات إدارة السيولة والمخاطر المالية للشركات التقنية الناشئة',
    titleAr: 'إدارة المخاطر',
    titleEn: 'Risk Management',
    toolId: 'perplexta_analysis',
    categoryAr: 'تحليل مالي',
    categoryEn: 'Financial Analysis',
  },
  {
    id: 's_search_5',
    text: 'كفاءة خلايا الهيدروجين الأخضر كبديل مستدام في قطاع الطاقة النظيفة',
    titleAr: 'الهيدروجين الأخضر',
    titleEn: 'Green Hydrogen',
    toolId: 'perplexta_analysis',
    categoryAr: 'طاقات متجددة',
    categoryEn: 'Clean Energy',
  },
  {
    id: 's_search_6',
    text: 'معايير الأمان السيبراني Zero Trust وتطبيقاتها في البنية السحابية',
    titleAr: 'الأمان السيبراني',
    titleEn: 'Cyber Security',
    toolId: 'perplexta_analysis',
    categoryAr: 'أمن سيبراني',
    categoryEn: 'Cybersecurity',
  },
  {
    id: 's_search_7',
    text: 'دراسة الجدوى المالية وتقييم وحدة الاقتصاد لنموذج الاشتراكات B2B SaaS',
    titleAr: 'دراسة جدوى',
    titleEn: 'Feasibility Study',
    toolId: 'perplexta_analysis',
    categoryAr: 'جدوى استثمارية',
    categoryEn: 'Investment Feasibility',
  },
  {
    id: 's_search_8',
    text: 'تاريخ الخليل وأبرز معالمها الحضارية والتاريخية عبر العصور',
    titleAr: 'تاريخ الخليل',
    titleEn: 'Hebron History',
    toolId: 'perplexta_analysis',
    categoryAr: 'توثيق تاريخي',
    categoryEn: 'Historical Research',
  },

  // --- English Research & Analysis ---
  {
    id: 's_en_search_1',
    text: 'Post-quantum cryptography standards and NIST migration roadmap',
    titleAr: 'تشفير ما بعد الكم',
    titleEn: 'Post-Quantum Crypto',
    toolId: 'perplexta_analysis',
    categoryAr: 'بحث وتوثيق',
    categoryEn: 'Search & Verification',
  },
  {
    id: 's_en_search_2',
    text: 'Deep comparative analysis of Transformer vs Mamba AI model architectures',
    titleAr: 'مقارنة النماذج',
    titleEn: 'Model Comparison',
    toolId: 'perplexta_analysis',
    categoryAr: 'تحليل استقصائي',
    categoryEn: 'Deep Analysis',
  },
  {
    id: 's_en_search_3',
    text: 'Unit economics and financial risk evaluation for enterprise SaaS platforms',
    titleAr: 'اقتصاديات الوحدة',
    titleEn: 'Unit Economics',
    toolId: 'perplexta_analysis',
    categoryAr: 'تحليل مالي',
    categoryEn: 'Financial Analysis',
  },

  // --- Software Engineering & Code (code) ---
  {
    id: 's_code_1',
    text: 'بناء خادم REST API احترافي بـ Express مع توثيق JWT ونظام الحد من المعدل',
    titleAr: 'بناء API',
    titleEn: 'Build API',
    toolId: 'code',
    categoryAr: 'برمجة وتطوير',
    categoryEn: 'Code & Engineering',
  },
  {
    id: 's_code_2',
    text: 'تصميم واجهة مستخدم متجاوبة فائقة الأداء بـ React و Tailwind CSS',
    titleAr: 'تصميم واجهة',
    titleEn: 'UI Design',
    toolId: 'code',
    categoryAr: 'واجهات مستخدم',
    categoryEn: 'UI Engineering',
  },
  {
    id: 's_code_3',
    text: 'تطوير خوارزمية تخزين مؤقت LRU Cache بلغة TypeScript بكفاءة O(1)',
    titleAr: 'تطوير خوارزمية',
    titleEn: 'Algorithm Development',
    toolId: 'code',
    categoryAr: 'خوارزميات',
    categoryEn: 'Algorithms',
  },
  {
    id: 's_code_4',
    text: 'كتابة استعلامات PostgreSQL متقدمة مع تحليل خطط التنفيذ والفهارس المركبة',
    titleAr: 'استعلامات SQL',
    titleEn: 'SQL Queries',
    toolId: 'code',
    categoryAr: 'قواعد بيانات',
    categoryEn: 'Databases',
  },
  {
    id: 's_code_5',
    text: 'ربط بوابة الدفع Stripe ومعالجة الأحداث المباشرة Webhooks بـ Node.js',
    titleAr: 'ربط الدفع',
    titleEn: 'Payment Integration',
    toolId: 'code',
    categoryAr: 'تكامل برمجي',
    categoryEn: 'API Integration',
  },
  {
    id: 's_code_6',
    text: 'تطبيق معايير الأمان وإمكانية الوصول الشاملة WCAG AA في مكونات React',
    titleAr: 'معايير الأمان',
    titleEn: 'Security Standards',
    toolId: 'code',
    categoryAr: 'هندسة البرمجيات',
    categoryEn: 'Software Engineering',
  },
  {
    id: 's_en_code_1',
    text: 'Build a production-ready Express API with JWT authentication and rate limiting',
    titleAr: 'خادم Express',
    titleEn: 'Express API',
    toolId: 'code',
    categoryAr: 'برمجة وتطوير',
    categoryEn: 'Code & Engineering',
  },
  {
    id: 's_en_code_2',
    text: 'Design a responsive high-performance UI layout with React and Tailwind CSS',
    titleAr: 'تجاوب الواجهات',
    titleEn: 'Responsive UI',
    toolId: 'code',
    categoryAr: 'واجهات مستخدم',
    categoryEn: 'UI Engineering',
  },
  {
    id: 's_en_code_3',
    text: 'Optimize PostgreSQL query execution plans and composite index structures',
    titleAr: 'تحسين قواعد البيانات',
    titleEn: 'DB Optimization',
    toolId: 'code',
    categoryAr: 'قواعد بيانات',
    categoryEn: 'Databases',
  },

  // --- Visual Design, Image & Video (image / video) ---
  {
    id: 's_media_1',
    text: 'تصميم واجهة مستخدم للوحة تحكم مالية فاخرة بنظام ألوان داكن أنيق',
    titleAr: 'تصميم لوحة',
    titleEn: 'Dashboard Design',
    toolId: 'image',
    categoryAr: 'تصميم واجهات',
    categoryEn: 'UI/UX Design',
  },
  {
    id: 's_media_2',
    text: 'توليد صورة سينمائية فائقة الدقة لمشهد معماري مستقبلي بإضاءة دافئة',
    titleAr: 'توليد معماري',
    titleEn: 'Architectural Gen',
    toolId: 'image',
    categoryAr: 'توليد بصري',
    categoryEn: 'Visual Synthesis',
  },
  {
    id: 's_media_3',
    text: 'إنتاج مقطع فيديو تسلسلي يوضح انسياب البيانات عبر الخوادم السحابية',
    titleAr: 'فيديو البيانات',
    titleEn: 'Data Video',
    toolId: 'video',
    categoryAr: 'إنتاج فيديو',
    categoryEn: 'Video Production',
  },
  {
    id: 's_media_4',
    text: 'توليد مشهد تصويري سينمائي بآفاق 4K لحركة السحب فوق قمم جبلية',
    titleAr: 'مشهد سينمائي',
    titleEn: 'Cinematic Scene',
    toolId: 'video',
    categoryAr: 'إنتاج فيديو',
    categoryEn: 'Video Production',
  },
  {
    id: 's_en_media_1',
    text: 'Generate a photorealistic 8K architectural render of a minimalist concrete pavilion at golden hour',
    titleAr: 'رندر معماري',
    titleEn: 'Arch Render',
    toolId: 'image',
    categoryAr: 'توليد بصري',
    categoryEn: 'Visual Synthesis',
  },

  // --- Executive Consulting & Business Intelligence (chat_pro / professional_advisory) ---
  {
    id: 's_pro_1',
    text: 'تقييم المخاطر التشغيلية والمالية قبل التوسع في أسواق إقليمية جديدة',
    titleAr: 'تقييم المخاطر',
    titleEn: 'Risk Evaluation',
    toolId: 'chat_pro',
    categoryAr: 'استشارات تنفيذية',
    categoryEn: 'Executive Advisory',
  },
  {
    id: 's_pro_2',
    text: 'صياغة مؤشرات الأداء الرئيسية (KPIs) لقياس كفاءة الفرق البرمجية والإنتاجية',
    titleAr: 'مؤشرات الأداء',
    titleEn: 'KPI Metrics',
    toolId: 'chat_pro',
    categoryAr: 'إدارة أداء',
    categoryEn: 'Performance Management',
  },
  {
    id: 's_pro_3',
    text: 'استراتيجيات هيكلة جولات التمويل المستهدفة للشركات الناشئة في مرحلة Seed',
    titleAr: 'جولات التمويل',
    titleEn: 'Funding Rounds',
    toolId: 'chat_pro',
    categoryAr: 'تمويل واستثمار',
    categoryEn: 'Venture Capital',
  },

  // --- Research & Academic Studies (sovereign_search) ---
  {
    id: 's_learn_1',
    text: 'تركيب دراسة مرجعية ومراجعة منهجة حول خوارزميات التعلم المعزز بمكافآت بشرية (RLHF)',
    titleAr: 'دراسة RLHF',
    titleEn: 'RLHF Study',
    toolId: 'sovereign_search',
    categoryAr: 'بحوث ودراسات',
    categoryEn: 'Academic Research',
  },
  {
    id: 's_learn_2',
    text: 'تفكيك الأطر النظرية والمصفوفة الأدبية لمبادئ نظرية النسبية العامة وانحناء نسيج الزمكان',
    titleAr: 'النسبية العامة',
    titleEn: 'General Relativity',
    toolId: 'sovereign_search',
    categoryAr: 'دراسات فيزيائية',
    categoryEn: 'Physics & Science',
  },
  {
    id: 's_learn_3',
    text: 'صياغة إطار عمل بحثي وفرضية علمية لإتقان هندسة النظم الموزعة والحوسبة السحابية',
    titleAr: 'النظم الموزعة',
    titleEn: 'Distributed Systems',
    toolId: 'sovereign_search',
    categoryAr: 'إطار بحثي',
    categoryEn: 'Research Framework',
  },

  // --- Ads & Growth Copilot (ads_copilot) ---
  {
    id: 's_ads_1',
    text: 'صياغة استراتيجية إعلانية متكاملة ونصوص إعلانية ممولة لإطلاق منتجي عبر منصة فيرال بوك',
    titleAr: 'استراتيجية إعلانية',
    titleEn: 'Ad Strategy',
    toolId: 'ads_copilot',
    categoryAr: 'حملات فيرال بوك',
    categoryEn: 'ViralBook Campaigns',
  },
  {
    id: 's_ads_2',
    text: 'كتابة نصوص إعلانية بأسلوب Hook & PAS مخصصة لحملات Meta Ads وتيك توك',
    titleAr: 'نصوص إعلانية',
    titleEn: 'Ad Copy',
    toolId: 'ads_copilot',
    categoryAr: 'نصوص إعلانية',
    categoryEn: 'Ad Copywriting',
  },
  {
    id: 's_ads_3',
    text: 'تنسيق استهداف الجماهير وتوزيع ميزانية الحملات الإعلانية بين الاختبار والتوسع',
    titleAr: 'استهداف الجماهير',
    titleEn: 'Audience Targeting',
    toolId: 'ads_copilot',
    categoryAr: 'ميزانية واستهداف',
    categoryEn: 'Targeting & Budget',
  },

  // --- Sound & Acoustic Design (audio_studio) ---
  {
    id: 's_audio_1',
    text: 'تأليف مقطوعة موسيقية هادئة بالبيانو والتشيلو لتعزيز التركيز الذهني العميق',
    titleAr: 'تأليف موسيقي',
    titleEn: 'Music Composition',
    toolId: 'audio_studio',
    categoryAr: 'تأليف صوتي',
    categoryEn: 'Acoustic Composition',
  },
  {
    id: 's_audio_2',
    text: 'تصميم حزمة مؤثرات صوتية احترافية لتفاعلات واجهات المستخدم الحديثة',
    titleAr: 'تأثيرات صوتية',
    titleEn: 'Sound FX',
    toolId: 'audio_studio',
    categoryAr: 'تصميم صوتي',
    categoryEn: 'Sound Design',
  },
];

/**
 * Fast text normalizer for Arabic & English strings.
 * Strips tashkeel/diacritics, normalizes alif variants and hamzas.
 */
export const normalizeQueryText = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // Remove Arabic tashkeel / diacritics
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^\w\s\u0600-\u06FF]/gi, '') // Remove punctuation for clean matching
    .replace(/[\s\-_]+/g, ' ')
    .trim();
};

/**
 * Helper to retrieve personal suggestion usage frequency from localStorage
 */
const getPersonalUsageStats = (): Record<string, number> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('perplexta_suggestion_usage');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

/**
 * Filter and rank suggestions with zero latency.
 * Combines prefix matching, token containment, Arabic character normalization,
 * personal usage frequency (localStorage), and tool affinity.
 */
export const getMatchingSuggestions = (
  rawQuery: string,
  toolId: string,
  dir: 'rtl' | 'ltr',
  limit: number = 6
): Array<{
  suggestion: ContextualSuggestion;
  matchedPrefix: string;
  remainingText: string;
}> => {
  const normQuery = normalizeQueryText(rawQuery);
  const isRtl = dir === 'rtl';
  const personalUsage = getPersonalUsageStats();

  // 1. Empty query (Zero-State) -> rank by personal usage + tool affinity + catalog defaults
  if (!normQuery) {
    const candidates = SUGGESTIONS_CATALOG.filter(s => {
      const isArabicText = /[\u0600-\u06FF]/.test(s.text);
      if (isRtl && !isArabicText) return false;
      if (!isRtl && isArabicText) return false;
      return true;
    });

    const rankedZeroState = candidates.map(s => {
      let score = 0;
      // Personal usage boost
      const usageCount = personalUsage[s.id] || 0;
      score += Math.min(usageCount * 10, 50);

      // Tool affinity boost
      if (toolId && s.toolId === toolId) {
        score += 35;
      }

      // 🎲 Random variety factor to ensure different, fresh suggestions on every focus/load event
      score += Math.random() * 25;

      return { suggestion: s, score };
    })
    .sort((a, b) => b.score - a.score);

    return rankedZeroState
      .slice(0, limit)
      .map(item => ({
        suggestion: item.suggestion,
        matchedPrefix: '',
        remainingText: item.suggestion.text,
      }));
  }

  // 2. Non-empty query -> rank by match quality + personal usage
  const queryTokens = normQuery.split(' ').filter(Boolean);

  const scored = SUGGESTIONS_CATALOG.map(s => {
    const isArabicText = /[\u0600-\u06FF]/.test(s.text);
    if (isRtl && !isArabicText) return null;
    if (!isRtl && isArabicText) return null;

    const normText = normalizeQueryText(s.text);
    let score = 0;

    // Direct prefix match (highest priority for first letters like "ب" or "كود")
    if (normText.startsWith(normQuery)) {
      score += 120;
    } else if (normText.includes(normQuery)) {
      score += 60;
    }

    // Token matching
    const matchesAllTokens = queryTokens.every(tok => normText.includes(tok));
    if (matchesAllTokens) {
      score += 30;
    } else {
      const matchCount = queryTokens.filter(tok => normText.includes(tok)).length;
      if (matchCount === 0) return null;
      score += matchCount * 8;
    }

    // Affinity for currently selected tool
    if (s.toolId === toolId) {
      score += 15;
    }

    // Personal usage score boost
    const usageCount = personalUsage[s.id] || 0;
    score += Math.min(usageCount * 5, 40);

    // Calculate matched prefix vs completion continuation
    let matchedPrefix = '';
    let remainingText = s.text;

    if (normText.startsWith(normQuery)) {
      const matchLen = Math.min(rawQuery.trim().length, s.text.length);
      matchedPrefix = s.text.substring(0, matchLen);
      remainingText = s.text.substring(matchLen);
    } else {
      matchedPrefix = '';
      remainingText = s.text;
    }

    return {
      suggestion: s,
      score,
      matchedPrefix,
      remainingText,
    };
  })
  .filter((item): item is NonNullable<typeof item> => item !== null)
  .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
};
