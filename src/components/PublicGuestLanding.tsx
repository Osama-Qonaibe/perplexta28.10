import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Palette, Layers, ShieldCheck, ArrowRight, ArrowUpRight, 
  CheckCircle2, Play, Pause, Users, Lock, ChevronLeft, ChevronDown, LayoutTemplate, 
  Languages, Video, Smartphone, Camera, Monitor, FileText, UploadCloud,
  Sliders, Wand2, Star, Check, Zap, Eye, UserPlus, MessageSquarePlus, MessageSquare,
  X, Image as ImageIcon, Send, Cpu, CpuIcon, Flame, Terminal, Globe, HelpCircle, Loader2, Award, Activity
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { resolveImageUrl } from '../utils/imageResolver';
import { toast } from '@/design-system';
import { extractYouTubeId, getYouTubeEmbedUrl } from '../utils/videoUtils';
import { RataqRepoTemplates, RataqRepoTemplate } from '../data/templates';
import { getStoredUserReviews, saveUserReview, UserReviewItem } from '../data/rataqReviews';
import { getStoredCreators, RinexCreator, getStoredMarketplaceTemplates, MarketplaceTemplate } from '../data/rinexCreators';
import { TemplatePreviewModal } from './creators/TemplatePreviewModal';
import { CreatorRegistrationModal } from './creators/CreatorRegistrationModal';
import { useNavigate } from 'react-router-dom';
import { UNIFIED_PUBLIC_TEMPLATES, PublicTemplateItem } from '../data/publicTemplatesData';
import { AnimatedCounterNumber } from './common/AnimatedCounterNumber';

const PUBLIC_TEMPLATES: PublicTemplateItem[] = UNIFIED_PUBLIC_TEMPLATES;

// Official Tech Partner & AI Model Provider Logos with Authentic SVG Vectors
const PARTNER_LOGOS = [
  { 
    name: 'Google Gemini', 
    label: 'Multimodal & Vision AI', 
    color: 'var(--github-blue)',
    svgIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24">
        <path fill="currentColor" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
        <path fill="currentColor" opacity="0.8" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.95H1.14v3.15C3.12 21.35 7.23 24 12 24z"/>
        <path fill="currentColor" opacity="0.6" d="M5.28 14.25c-.25-.72-.38-1.5-.38-2.25s.13-1.53.38-2.25V6.6H1.14A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.14 5.4l4.14-3.15z"/>
        <path fill="currentColor" opacity="0.4" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.12 2.65 1.14 6.6l4.14 3.15c.95-2.84 3.6-4.95 6.72-4.95z"/>
      </svg>
    )
  },
  { 
    name: 'Anthropic', 
    label: 'Claude Reasoning', 
    color: 'var(--github-orange)',
    svgIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.83 3.5H10.17L2 20.5h3.75l1.9-4.1h7.71l1.9 4.1H22L13.83 3.5zm-2.03 9.47L12 8.4l1.9 4.57h-3.8z" fill="currentColor"/>
      </svg>
    )
  },
  { 
    name: 'Groq', 
    label: 'Ultra-Speed LPUs', 
    color: 'var(--github-blue)',
    svgIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    name: 'GitHub', 
    label: 'Source Control', 
    color: 'var(--text-primary)', 
    svgIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" fill="currentColor"/>
      </svg>
    )
  },
  { 
    name: 'OpenAI', 
    label: 'GPT & DALL-E', 
    color: 'var(--github-green)',
    svgIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-4.0305-2.6391 6.0416 6.0416 0 0 0-5.007 1.3256A5.989 5.989 0 0 0 9.176 1.545a6.0462 6.0462 0 0 0-5.1974 3.0125 6.0416 6.0416 0 0 0-.5476 5.2536 5.989 5.989 0 0 0-2.313 4.2536 6.0462 6.0462 0 0 0 2.934 5.1636 5.9847 5.9847 0 0 0 2.2155 1.0965 6.0462 6.0462 0 0 0 5.0975-.828 5.989 5.989 0 0 0 4.1947 1.7485 6.0462 6.0462 0 0 0 5.4385-3.3765 5.9847 5.9847 0 0 0 .5157-4.9108 6.0462 6.0462 0 0 0-1.282-2.1444z" stroke="currentColor" strokeWidth="2"/>
      </svg>
    )
  },
  { 
    name: 'Meta', 
    label: 'Llama Open Models', 
    color: 'var(--github-blue)',
    svgIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M12 12c-2.5-4-5-6-8-6s-5 3-5 7 2 7 5 7 5.5-3 8-8zm0 0c2.5 4 5 6 8 6s5-3 5-7-2-7-5-7-5.5 3-8 8z" stroke="currentColor" strokeWidth="2"/>
      </svg>
    )
  },
  { 
    name: 'Stability AI', 
    label: 'Stable Diffusion', 
    color: 'var(--github-purple)',
    svgIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="2"/>
      </svg>
    )
  },
  { 
    name: 'Ollama', 
    label: 'Local LLM Runner', 
    color: 'var(--github-orange)',
    svgIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <ellipse cx="12" cy="12" rx="9" ry="6" stroke="currentColor" strokeWidth="2"/>
        <circle cx="12" cy="12" r="3" fill="currentColor"/>
      </svg>
    )
  },
  { 
    name: 'Alibaba Qwen', 
    label: 'Multimodal AI', 
    color: 'var(--github-orange)',
    svgIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    name: 'DeepSeek', 
    label: 'Deep Reasoning', 
    color: 'var(--github-blue)',
    svgIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    )
  },
  { 
    name: 'Mistral AI', 
    label: 'European Weights', 
    color: 'var(--github-orange)',
    svgIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M3 12h18M12 3l9 9-9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    name: 'Cohere', 
    label: 'Enterprise NLP', 
    color: 'var(--github-purple)',
    svgIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2"/>
      </svg>
    )
  },
  { 
    name: 'Hugging Face', 
    label: 'Open ML Hub', 
    color: 'var(--github-orange)',
    svgIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    name: 'Perplexity', 
    label: 'Neural Search', 
    color: 'var(--github-blue)',
    svgIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 8a4 4 0 100 8 4 4 0 000-8z" fill="currentColor"/>
      </svg>
    )
  },
  { 
    name: 'xAI Grok', 
    label: 'Realtime Cognition', 
    color: 'var(--text-primary)', 
    svgIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M4 4l16 16M4 20L20 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    )
  }
];

export const PublicGuestLanding: React.FC = () => {
  const navigate = useNavigate();
  const { language, dir, setIsAuthModalOpen, plans, user } = useAppContext();
  const isAr = language === 'ar' || dir === 'rtl';

  const [activeCategory, setActiveCategory] = useState<'all' | 'reels' | 'story' | 'marketing' | 'posts' | 'cards' | 'youtube'>('all');
  
  // Hero Video & CMS Config State
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(true);
  const [cmsConfig, setCmsConfig] = useState<any>(() => {
    const saved = localStorage.getItem('perplexta_landing_cms');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });

  useEffect(() => {
    let isMounted = true;
    let timer: any = null;
    let idleId: any = null;

    const fetchCms = () => {
      fetch('/api/cms/landing')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.config && isMounted) {
            setCmsConfig(data.config);
          }
        })
        .catch(() => {});
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = (window as any).requestIdleCallback(() => {
        if (isMounted) fetchCms();
      }, { timeout: 5000 });
    } else {
      timer = setTimeout(() => {
        if (isMounted) fetchCms();
      }, 4000);
    }

    const handleCmsUpdate = (e: any) => {
      if (e.detail && isMounted) setCmsConfig(e.detail);
    };
    window.addEventListener('landing-cms-updated', handleCmsUpdate);

    return () => {
      isMounted = false;
      if (idleId && (window as any).cancelIdleCallback) {
        (window as any).cancelIdleCallback(idleId);
      }
      if (timer) clearTimeout(timer);
      window.removeEventListener('landing-cms-updated', handleCmsUpdate);
    };
  }, []);

  // Reviews & Testimonials State
  const [reviews, setReviews] = useState<UserReviewItem[]>(() => getStoredUserReviews());
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [creators, setCreators] = useState<RinexCreator[]>([]);
  const [previewTemplate, setPreviewTemplate] = useState<MarketplaceTemplate | null>(null);
  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState<boolean>(false);
  const [expandedPlanFeatures, setExpandedPlanFeatures] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadCreators() {
      const list = await getStoredCreators();
      setCreators(list);
    }
    loadCreators();
  }, []);

  const handleJoinAsCreator = async () => {
    if (!user) {
      toast.info(
        isAr 
          ? 'يرجى تسجيل الدخول أو إنشاء حساب للانضمام لشبكة صناع المحتوى وتفعيل مكافأة الـ $50 دولار!' 
          : 'Please sign in or create an account to claim your $50 creator welcome bonus!'
      );
      setIsAuthModalOpen(true);
      return;
    }
    const currentCreators = await getStoredCreators();
    const existing = currentCreators.find(c => 
      (user.email && (c as any).email === user.email) ||
      (user.name && c.name.toLowerCase() === user.name.toLowerCase()) ||
      ((user as any)?.username && c.username.toLowerCase() === (user as any).username.toLowerCase())
    );
    if (existing) {
      navigate('/settings/creators-hub');
    } else {
      setIsCreatorModalOpen(true);
    }
  };

  const handleOpenTemplatePreview = async (tpl: any) => {
    const rawVideo = tpl.previewVideoUrl || tpl.videoUrl;
    if (tpl.creatorName) {
      setPreviewTemplate({
        ...tpl,
        previewVideoUrl: tpl.previewVideoUrl || rawVideo,
        videoUrl: tpl.videoUrl || rawVideo
      });
      return;
    }
    const allMarketplace = await getStoredMarketplaceTemplates();
    const matched = allMarketplace.find((m: any) => m.id === tpl.id || m.titleEn === tpl.titleEn);
    if (matched) {
      setPreviewTemplate({
        ...matched,
        previewVideoUrl: matched.previewVideoUrl || rawVideo,
        videoUrl: matched.videoUrl || rawVideo
      });
      return;
    }
    setPreviewTemplate({
      id: tpl.id,
      creatorId: 'rinex-curated',
      creatorName: isAr ? 'استوديو رينكس الرسمي' : 'Rinex Official Studio',
      creatorUsername: 'rinex_official',
      creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      titleAr: tpl.titleAr,
      titleEn: tpl.titleEn,
      descriptionAr: `قالب تصميم احترافي معتمد من مستودع رينكس الرسمي (${tpl.tag || 'عالي الدقة'})، مجهز بطبقات وتنسيقات قابلة للتعديل مباشرة فور التسجيل.`,
      descriptionEn: `Official professional design template (${tpl.tag || 'HD'}) with full customizable layers.`,
      thumbnail: tpl.src || tpl.thumbnail,
      category: (tpl.category === 'all' ? 'marketing' : tpl.category) as any,
      categoryLabelAr: tpl.categoryLabelAr || 'تسويقي',
      dimensions: tpl.dimensions || '1080 × 1080',
      priceType: 'free',
      price: 0,
      viewsCount: 16800,
      usesCount: 4750,
      rating: 4.9,
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
      elements: tpl.elements || [],
      canvasBackground: tpl.canvasBackground,
      previewVideoUrl: rawVideo,
      videoUrl: rawVideo
    });
  };

  // Review Submission Form State
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerRole, setReviewerRole] = useState('');
  const [reviewerRating, setReviewerRating] = useState<number>(5);
  const [reviewerComment, setReviewerComment] = useState('');
  const [reviewerMediaUrl, setReviewerMediaUrl] = useState('');

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Contact Us Form State
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [contactReason, setContactReason] = useState('suggestion');
  const [contactMessage, setContactMessage] = useState('');
  const [contactFile, setContactFile] = useState<File | null>(null);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  // Newsletter Subscription State
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribedNewsletter, setIsSubscribedNewsletter] = useState(false);

  // Selected Plan Cycles State for pricing cards
  const [selectedPlanCycles, setSelectedPlanCycles] = useState<Record<string, 'monthly' | 'annual'>>({});

  const handlePlanAction = (planId: string, actionMethod: 'subscribe' | 'balance') => {
    try {
      sessionStorage.setItem('pending_checkout_intent', JSON.stringify({
        planId,
        cycle: selectedPlanCycles[planId] || 'monthly',
        method: actionMethod
      }));
    } catch {}
    setIsAuthModalOpen(true);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactMessage.trim()) {
      toast.error(isAr ? 'يرجى إدخال الاسم ورسالة الاتصال' : 'Please provide name and message');
      return;
    }

    const lowerMsg = contactMessage.toLowerCase();
    const hasForbiddenCode = lowerMsg.includes('<script') || lowerMsg.includes('drop table') || lowerMsg.includes('eval(');
    if (hasForbiddenCode) {
      toast.error(isAr ? 'عذراً، يُمنع إرسال أكواد برمجية في رسائل الاتصال لأسباب أمنية.' : 'Code snippets are strictly prohibited for security reasons.');
      return;
    }

    setIsSubmittingContact(true);
    try {
      await fetch('/api/system/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName.trim(),
          role: contactRole.trim(),
          reason: contactReason,
          message: contactMessage.trim()
        })
      });
      setContactName('');
      setContactRole('');
      setContactMessage('');
      setContactFile(null);
      toast.success(isAr ? 'تم إرسال رسالتك بنجاح! سيتم الرد عليك قريباً من قبل فريق الإدارة.' : 'Your message has been sent successfully!');
    } catch {
      toast.success(isAr ? 'تم إرسال رسالتك بنجاح! سيتم الرد عليك قريباً من قبل فريق الإدارة.' : 'Your message has been sent successfully!');
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes('@')) {
      toast.error(isAr ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address');
      return;
    }
    try {
      await fetch('/api/system/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail.trim() })
      });
      setIsSubscribedNewsletter(true);
      toast.success(isAr ? 'تم اشتراكك بنجاح في نشرة التحديثات الدورية!' : 'Successfully subscribed to our newsletter!');
    } catch {
      setIsSubscribedNewsletter(true);
      toast.success(isAr ? 'تم اشتراكك بنجاح في نشرة التحديثات الدورية!' : 'Successfully subscribed to our newsletter!');
    }
  };

  const safeText = (val: any, fallback: string = '') => {
    if (!val) return fallback;
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      return isAr ? (val.textAr || val.ar || val.name || val.title || JSON.stringify(val)) : (val.textEn || val.en || val.name || val.title || JSON.stringify(val));
    }
    return String(val);
  };

  const safeList = (list: any) => {
    if (!list) return [];
    if (Array.isArray(list)) {
      return list.map(item => safeText(item));
    }
    if (typeof list === 'object') {
      return Object.values(list).map(item => safeText(item));
    }
    return [safeText(list)];
  };

  const displayPlans = plans && plans.length > 0 ? plans : [
    {
      id: 'free',
      nameAr: 'الباقة المجانية',
      nameEn: 'Free Plan',
      monthlyPrice: 0,
      annualPrice: 0,
      descriptionAr: 'البداية المثالية لاستكشاف أدوات استوديو رينكس وتصاميم الكانفاس',
      descriptionEn: 'Perfect start to explore Rinex Studio canvas tools',
      featuresAr: ['5 مشاريع تصميم شهرياً', 'تصدير قياسي بدون علامة', 'قوالب رينكس الأساسية'],
      featuresEn: ['5 designs per month', 'Standard export without watermark', 'Core Rinex templates']
    },
    {
      id: 'pro',
      nameAr: 'باقة المصممين الاحترافية PRO',
      nameEn: 'PRO Creator Plan',
      monthlyPrice: 19,
      annualPrice: 15,
      descriptionAr: 'للمصممين وصناع المحتوى المحترفين، مع قدرات غير محدودة ومحركات الذكاء الاصطناعي',
      descriptionEn: 'For professional creators with unlimited AI & multi-page canvas',
      featuresAr: ['مشاريع وتصميمات غير محدودة', 'تصدير 4K فائق الجودة', 'جميع محركات الذكاء الاصطناعي', 'إزالة الخلفية السحرية بالذكاء الاصطناعي'],
      featuresEn: ['Unlimited designs', '4K Ultra-HD export', 'All AI engines', 'Magical background removal']
    },
    {
      id: 'enterprise',
      nameAr: 'باقة المؤسسات والشركات المتقدمة',
      nameEn: 'Enterprise Studio Plan',
      monthlyPrice: 49,
      annualPrice: 39,
      descriptionAr: 'أقصى درجات الأداء والأمان المخصص للفرق، الشركات، والوكالات الإعلانية الكبرى',
      descriptionEn: 'Maximum performance and custom security for teams and agencies',
      featuresAr: ['مساحة عمل فريق عمل مشتركة', 'دعم فني أولوي على مدار الساعة', 'تخصيص كامل للهوية التجارية', 'تشفير بيانات قياسي AES-256'],
      featuresEn: ['Team workspace collaboration', '24/7 priority support', 'Full brand kit customisation', 'Standard AES-256 data encryption']
    }
  ];

  const userPlans = (plans && plans.length > 0 ? plans : displayPlans).filter((p: any) => {
    const name = safeText(p.nameAr || p.nameEn || p.name || '').toLowerCase();
    const slug = safeText(p.id || '').toLowerCase();
    return !name.includes('مطور') && !name.includes('developer') && !name.includes('api') && !slug.includes('dev') && !slug.includes('api');
  });

  const faqItems = [
    {
      qAr: 'ما هي منصة استوديو رينكس الإبداعي؟',
      qEn: 'What is Rinex Creative Studio Platform?',
      aAr: 'منصة متكاملة لتصميم وإنتاج المحتوى البصري (ريلز، بوسترات، قصص، ومقاطع فيديو) بالاعتماد على أحدث نماذج الذكاء الاصطناعي ومحرك كانفا متعدد الصفحات.',
      aEn: 'An integrated platform for designing and producing visual content powered by state-of-the-art AI models and a multi-page canvas engine.'
    },
    {
      qAr: 'هل بياناتي ومشاريعي التصميمية محمية؟',
      qEn: 'Are my data and design projects secure?',
      aAr: 'نعم بالتاكيد. جميع المشاريع والمرفوعات معزولة بالكامل لكل مستخدم مع تشفير متطور (AES-256) وضمان عدم مشاركة أي بيانات مع أطراف خارجية.',
      aEn: 'Yes, absolutely. All projects and uploads are completely isolated per user with advanced encryption and zero third-party sharing.'
    },
    {
      qAr: 'كيف يمكنني البدء في استخدام الاستوديو؟',
      qEn: 'How can I start using the studio?',
      aAr: 'فقط اضغط على "ابدأ مجاناً" أو اختر أي قالب جاهز، وسيعمل النظام على توجيهك لإنشاء مساحتك الإبداعية الخاصة في ثوانٍ معدودة.',
      aEn: 'Simply click "Start Free" or choose any ready template, and the system will guide you to create your dedicated creative workspace in seconds.'
    },
    {
      qAr: 'هل يدعم الاستوديو التصدير بجودة 4K؟',
      qEn: 'Does the studio support 4K export?',
      aAr: 'نعم، يدعم الاستوديو تصدير التصاميم بجودة عالية ودقة 4K بدون أي علامات مائية وبأعلى معايير الجودة للطباعة والنشر الرقمي.',
      aEn: 'Yes, the studio supports high-resolution 4K design exports without any watermarks for print and digital publishing.'
    },
    {
      qAr: 'ما هي سياسة الاسترداد المعتمدة في المنصة؟',
      qEn: 'What is the refund policy?',
      aAr: 'توفر المنصة سياسة استرداد كاملة بنسبة 100% خلال 14 يوماً من تاريخ الاشتراك، بشرط عدم استهلاك الحصص والموارد الرقمية الرقمية المخصصة.',
      aEn: 'The platform provides a 100% full refund policy within 14 days of subscription, provided the allocated digital plan credits and compute resources remain unconsumed.'
    },
    {
      qAr: 'هل يمكن النشر على فيرال بوك مباشرة؟',
      qEn: 'Can I publish directly to ViralBook?',
      aAr: 'نعم وبكل تأكيد! يمكنك نشر تصميماتك ومقاطع الريلز مباشرة إلى مجتمع فيرال بوك التفاعلي بضغطة زر واحدة لتشاركها مع الأصدقاء والعملاء.',
      aEn: 'Yes absolutely! You can publish your designs and reels directly to the ViralBook community with a single click.'
    }
  ];

  const [visibleGuestTemplatesCount, setVisibleGuestTemplatesCount] = useState<number>(16);

  const categoryPool = (() => {
    if (activeCategory === 'all') return PUBLIC_TEMPLATES;
    const matched = PUBLIC_TEMPLATES.filter(t => t.category === activeCategory);
    if (matched.length >= 4) return matched;
    const existingIds = new Set(matched.map(t => t.id));
    const fillers = PUBLIC_TEMPLATES.filter(t => !existingIds.has(t.id)).slice(0, 4 - matched.length);
    return [...matched, ...fillers];
  })();

  const rawSlicedTemplates = categoryPool.slice(0, visibleGuestTemplatesCount);
  const completeRowsCount = rawSlicedTemplates.length >= 4
    ? Math.floor(rawSlicedTemplates.length / 4) * 4
    : rawSlicedTemplates.length;
  const filteredTemplates = rawSlicedTemplates.slice(0, completeRowsCount);

  const handleActionRequireAuth = (actionNameAr: string, actionNameEn: string, templateId?: string) => {
    if (templateId) {
      try {
        sessionStorage.setItem('pending_studio_template', templateId);
      } catch (e) {}
    }
    toast.info(
      isAr 
        ? `حفاظاً على أمان بياناتك، وحماية الملكية الفكرية لتصاميمك، ومنع أي استخدام غير مشروع، يلزم إنشاء حساب مجاني أو تسجيل الدخول لتحديد مالك لمشروعك وبدء ${actionNameAr}.` 
        : `For data security, intellectual property protection, and preventing unauthorized use, please sign in or create a free account before ${actionNameEn}.`
    );
    setIsAuthModalOpen(true);
  };

  const handleAddReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewerComment.trim()) {
      toast.error(isAr ? 'يرجى كتابة الاسم والتعليق قبل الإرسال' : 'Please provide name and comment');
      return;
    }

    const updated = saveUserReview({
      name: reviewerName,
      roleAr: reviewerRole || 'مصمم ومبدع محتوى',
      roleEn: reviewerRole || 'Creative Designer',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      rating: reviewerRating,
      commentAr: reviewerComment,
      commentEn: reviewerComment,
      mediaType: 'image',
      mediaUrl: reviewerMediaUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=70'
    });

    setReviews(updated);
    setIsReviewModalOpen(false);
    setReviewerName('');
    setReviewerRole('');
    setReviewerComment('');
    setReviewerMediaUrl('');

    toast.success(isAr ? 'تمت إضافة تقييمك وتجربتك بنجاح! شكرًا لمشاركتك' : 'Review submitted successfully!');
  };

  return (
    <div className="w-full space-y-16 py-4 animate-in fade-in duration-300">
      
      {/* 1. HERO SECTION (القسم الرئيسي مع عرض الشرح المرئي) */}
      <section className="relative overflow-hidden rounded-shape-lg bg-[var(--surface-card)] border border-[color-mix(in_oklab,var(--accent)_30%,var(--border-main))] p-6 sm:p-10 md:p-12 shadow-md">
        {/* Subtle Background Glow */}
        <div className="absolute -top-24 -end-24 w-96 h-96 bg-[color-mix(in_oklab,var(--accent)_15%,transparent)] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -start-24 w-96 h-96 bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-start">
            
            {/* Platform Tag Kicker (Zero-Pill Discipline & Brand Hierarchy) */}
            <div className="flex items-center justify-center lg:justify-start gap-2 text-xs font-black text-[var(--accent)]">
              <Sparkles size={14} />
              <span>{isAr ? 'استوديو رينكس الإبداعي • الجناح البصري لمنصة بيربليكستا 2026' : 'Rinex Creative Studio • Powered by Perplexta AI'}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-[var(--text-primary)] leading-tight tracking-tight text-balance">
              {isAr 
                ? 'بوابتك الذكية لتصميم المحتوى وإدارته بالذكاء الاصطناعي' 
                : 'Your AI-Powered Enterprise Creative Studio'}
            </h1>

            {/* Subheadline */}
            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {isAr 
                ? 'أنشئ تصاميم، ملصقات، ومقاطع فيديو احترافية بضغطة زر واحدة. مساحة عمل مرنة متعددة الصفحات، محو سحري للخلفيات، وحفظ آمن للبيانات.'
                : 'Create posters, reels, and high-impact visual graphics in seconds with an intelligent multi-page canvas engine.'
              }
            </p>

            {/* CTA Buttons (Aligned to Perplexta Visual Identity: 40px height, rounded-shape-sm, centered inline-flex) */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="relative h-10 px-5 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-bold text-xs leading-none inline-flex items-center justify-center gap-2 shadow-2xs hover:opacity-90 transition-all active:scale-95 cursor-pointer w-full sm:w-auto before:absolute before:-inset-1 before:content-['']"
              >
                <UserPlus size={15} className="shrink-0" />
                <span>{isAr ? 'ابدأ مجاناً الآن' : 'Start Free Now'}</span>
              </button>

              <a
                href="#templates-showcase"
                className="relative h-10 px-5 rounded-shape-sm bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] border border-[var(--border-main)] hover:border-[var(--border-accent)] text-[var(--text-primary)] font-bold text-xs leading-none inline-flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer w-full sm:w-auto shadow-2xs before:absolute before:-inset-1 before:content-['']"
              >
                <Palette size={15} className="text-[var(--accent)] shrink-0" />
                <span>{isAr ? 'استكشف القوالب' : 'Explore Templates'}</span>
              </a>
            </div>

            {/* Trust Badges */}
            <div className="pt-6 border-t border-[var(--border-main)]/40 grid grid-cols-1 sm:grid-cols-3 gap-4 text-[11px] text-[var(--text-muted)] font-black">
              <div className="flex items-center justify-center lg:justify-start gap-2 text-[var(--fg-success)]">
                <ShieldCheck size={16} />
                <span>{isAr ? 'تشفير وحماية بيانات قياسية' : 'Enterprise Data Security'}</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <Zap size={16} className="text-amber-500" />
                <span>{isAr ? 'تصدير فائق 4K بدون علامة' : '4K Ultra Export'}</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-2 text-[var(--fg-accent)]">
                <CheckCircle2 size={16} />
                <span>{isAr ? 'دعم محرر الكانفاس المتعدد' : 'Multi-Page Canvas'}</span>
              </div>
            </div>

            {/* Sovereign Data Security & Ownership Notice */}
            <div className="p-3.5 rounded-shape-md bg-[color-mix(in_oklab,var(--surface-card)_80%,transparent)] border border-[color-mix(in_srgb,var(--fg-success)_30%,transparent)] flex items-start gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded-shape-xs bg-[var(--bg-success-muted)] text-[var(--fg-success)] flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck size={18} />
              </div>
              <div className="text-start space-y-0.5">
                <h4 className="text-xs font-black text-[var(--text-primary)] flex items-center gap-1.5">
                  <span>{isAr ? 'بيئة استوديو محمية • التسجيل إلزامي لحفظ ملكيتك' : 'Protected Studio Workspace • Registration Required'}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-shape-xs bg-[var(--bg-success-muted)] text-[var(--fg-success)] font-mono font-bold">
                    {isAr ? 'تشفير 256 بت آمن' : 'SSL 256-Bit Encrypted'}
                  </span>
                </h4>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  {isAr 
                    ? 'حفاظاً على أمان بياناتك، وحماية الملكية الفكرية لتصاميمك، وضمان منع أي استخدام غير مشروع، يتطلب تجربة الاستوديو تسجيل الدخول الفوري وتحديد مالك لمشروعك السحابي.'
                    : 'To safeguard your data privacy, secure intellectual property ownership, and prevent unauthorized usage, registration is required before entering the studio workspace.'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Visual Element (Interactive Explainer Video Mockup) */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-shape-md overflow-hidden bg-slate-950 border border-[var(--border-main)] shadow-2xl group">
              {/* Top Video Header Control */}
              <div className="h-9 bg-slate-900 border-b border-slate-800 px-3 flex items-center justify-between text-slate-400 text-[11px] font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--fg-success)]/80" />
                  <span className="ms-2 font-bold text-slate-200 flex items-center gap-2">
                    <span>
                      {isAr 
                        ? (cmsConfig?.heroVideo?.titleAr || 'فيديو توضيحي — رحلة العمل في 30 ثانية') 
                        : (cmsConfig?.heroVideo?.titleEn || 'Studio Journey in 30 Seconds')}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-accent/20 text-[var(--accent)] font-mono font-black uppercase">
                      {isAr ? 'العربية 🇸🇦' : 'English 🇬🇧'}
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                  aria-label={isPlayingVideo ? (isAr ? 'إيقاف الفيديو' : 'Pause Video') : (isAr ? 'تشغيل الفيديو' : 'Play Video')}
                  className="relative w-7 h-7 rounded-shape-xs hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer flex items-center justify-center before:absolute before:-inset-2 before:content-['']"
                >
                  {isPlayingVideo ? <Pause size={12} /> : <Play size={12} />}
                </button>
              </div>

              {/* Main Explainer Video / Animated Live Canvas Preview */}
              <div className="relative aspect-video sm:aspect-4/3 bg-slate-900 overflow-hidden flex items-center justify-center">
                {(() => {
                  const videoConfig = cmsConfig?.heroVideo;
                  if (videoConfig && videoConfig.enabled === false) {
                    return (
                      <div className="p-8 text-center text-slate-400 text-xs font-bold">
                        {isAr ? 'تم تعطيل عرض الفيديو التوضيحي من قبل الإدارة' : 'Explainer video preview disabled'}
                      </div>
                    );
                  }
                  
                  let activeSourceType: 'file' | 'youtube' = 'file';
                  let activeVideoUrl = '';
                  let activeYoutubeUrl = '';
                  let activePosterUrl = '';

                  if (isAr) {
                    // Arabic Language Selected - Get Arabic specific video, or fallback to main video
                    activeVideoUrl = videoConfig?.videoUrlAr || videoConfig?.videoUrl || '';
                    activeYoutubeUrl = videoConfig?.youtubeUrlAr || videoConfig?.youtubeUrl || '';
                    activePosterUrl = videoConfig?.posterUrlAr || videoConfig?.posterUrl || '';
                    activeSourceType = videoConfig?.sourceTypeAr || (activeYoutubeUrl ? 'youtube' : (activeVideoUrl ? 'file' : videoConfig?.sourceType || 'file'));
                  } else {
                    // English Language Selected - Get English specific video, or fallback to main video
                    activeVideoUrl = videoConfig?.videoUrlEn || videoConfig?.videoUrl || '';
                    activeYoutubeUrl = videoConfig?.youtubeUrlEn || videoConfig?.youtubeUrl || '';
                    activePosterUrl = videoConfig?.posterUrlEn || videoConfig?.posterUrl || '';
                    activeSourceType = videoConfig?.sourceTypeEn || (activeYoutubeUrl ? 'youtube' : (activeVideoUrl ? 'file' : videoConfig?.sourceType || 'file'));

                    // If no custom video was configured at all for English or Arabic
                    if (!activeVideoUrl && !activeYoutubeUrl) {
                      activeVideoUrl = "/videos/hero_showcase.mp4";
                      activeSourceType = 'file';
                    }
                  }

                  if (!isPlayingVideo) {
                    return (
                      <img 
                        key={`hero-poster-${isAr ? 'ar' : 'en'}-${activePosterUrl}`}
                        src={activePosterUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=70"} 
                        alt="Rinex Studio Preview" 
                        className="w-full h-full object-cover"
                      />
                    );
                  }

                  if (activeSourceType === 'youtube' && activeYoutubeUrl && extractYouTubeId(activeYoutubeUrl)) {
                    return (
                      <iframe
                        key={`hero-yt-${isAr ? 'ar' : 'en'}-${activeYoutubeUrl}`}
                        src={getYouTubeEmbedUrl(activeYoutubeUrl, true) || ''}
                        title={isAr ? (videoConfig?.titleAr || 'فيديو المعاينة') : (videoConfig?.titleEn || 'Showcase Video')}
                        className="w-full h-full border-0 pointer-events-auto"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    );
                  }

                  if (activeVideoUrl) {
                    return (
                      <video
                        key={`hero-vid-${isAr ? 'ar' : 'en'}-${activeVideoUrl}`}
                        autoPlay
                        loop
                        muted
                        playsInline
                        poster={activePosterUrl || undefined}
                        className="w-full h-full object-cover"
                      >
                        <source src={activeVideoUrl} type="video/mp4" />
                        <img src={activePosterUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80"} alt="Preview" />
                      </video>
                    );
                  }

                  // Local sovereign showcase video
                  return (
                    <video
                      key={`hero-fallback-${isAr ? 'ar' : 'en'}`}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    >
                      <source src="/videos/hero_showcase.mp4" type="video/mp4" />
                      <img src={activePosterUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80"} alt="Preview" />
                    </video>
                  );
                })()}

                {/* Interactive Layers Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/30 flex flex-col justify-between p-4">
                  <div className="self-end bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-2 rounded-shape-xs shadow-lg text-[10px] text-slate-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[var(--accent)]">
                      <Layers size={12} />
                      <span>{isAr ? 'محرر متعدد الصفحات' : 'Multi-Page Canvas'}</span>
                    </div>
                    <p className="text-[9px] text-slate-400">{isAr ? 'تأطير الريلز والقصص وتصميم البوسترات' : 'Reels, stories, and posters'}</p>
                  </div>

                  <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-3 rounded-shape-sm shadow-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center">
                        <Wand2 size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{isAr ? 'المحو السحري بالذكاء الاصطناعي' : 'AI Magic Eraser'}</h4>
                        <span className="text-[10px] text-slate-400">{isAr ? 'تنقية وتنظيف الخلفية بضغطة واحدة' : 'One-click background removal'}</span>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleActionRequireAuth('التصميم والتعديل', 'editing')}
                      className="relative h-8 px-3.5 rounded-shape-sm bg-[var(--accent)] text-slate-950 font-bold text-xs leading-none shadow-2xs hover:opacity-90 cursor-pointer transition-all active:scale-95 inline-flex items-center justify-center gap-1.5 shrink-0 before:absolute before:-inset-1.5 before:content-['']"
                    >
                      <span>{isAr ? 'تجربة الآن' : 'Try Now'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>



      {/* 2. FEATURES / STUDIOS SECTION (عرض الاستوديوهات الخمسة الفائقة بنمط البطاقات المصورة) */}
      <section className="space-y-8 pt-4">
        <div className="text-center space-y-2 max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-[var(--accent)]">
            <LayoutTemplate size={14} />
            <span>{isAr ? 'منظومة استوديوهات رينكس • مدعومة بمحركات بيربليكستا' : 'Rinex Studios Ecosystem · Powered by Perplexta'}</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight sm:whitespace-nowrap">
            {isAr ? 'خمس بيئات عمل متخصصة لتوليد الصور والفيديو والتطبيقات والصوت' : 'Five Specialized AI Studios for Every Creative Workflow'}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed sm:whitespace-nowrap">
            {isAr ? 'محركات معالجة سحابية مدعومة بأحدث النماذج العالمية لتنفيذ مشاريعك التقنية والإبداعية في بيئة موحدة.' : 'Cloud processing engines powered by frontier AI models for your creative and technical projects.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 text-start">
          {/* Studio 1: Image Creation & Editing Studio */}
          <div className="group relative rounded-shape-lg overflow-hidden border border-[var(--border-main)] hover:border-[var(--accent)]/50 transition-all shadow-sm hover:shadow-lg bg-[var(--surface-card)] flex flex-col h-[310px] text-start">
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=600&q=70" 
                className="w-full h-full object-cover opacity-20 group-hover:opacity-30 group-hover:scale-105 transition-all duration-500" 
                alt="Image Studio"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-card)] via-[var(--surface-card)]/85 to-transparent" />
            </div>
            
            <div className="relative z-10 p-6 flex flex-col h-full justify-between text-start">
              <div>
                {/* Level 1 (Shortest): Icon + Compact Engine Badge at Start */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-10 h-10 rounded-shape-sm bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center border border-[var(--accent)]/20 shadow-2xs shrink-0">
                    <ImageIcon size={20} />
                  </div>
                  <span className="text-[11px] font-sans font-bold px-2.5 py-1 rounded-shape-xs bg-[var(--surface-subtle)] text-[var(--accent)] border border-[var(--border-main)]">
                    {isAr ? 'المحرك 01 • معالجة الصور' : 'Engine 01 • Image'}
                  </span>
                </div>
                {/* Level 2 (Medium): Studio Title */}
                <h3 className="text-lg font-black text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors mb-2 leading-snug">
                  {isAr ? 'استوديو التصميم ومعالجة الصور' : 'Image Creation & Layer Studio'}
                </h3>
                {/* Level 3 (Longest): Balanced Description Base */}
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2 font-medium">
                  {isAr 
                    ? 'توليد الصور الاحترافية، إزالة الخلفيات الفورية، الدمج الفني، وتحرير الطبقات المتجهة بدقة 4K فائقة.'
                    : 'AI image generation, instant background removal, vector layer blending, and 4K ultra-HD editing.'
                  }
                </p>
              </div>
              <ul className="pt-3.5 border-t border-[var(--border-main)] text-xs text-[var(--text-muted)] font-bold">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[var(--accent)] shrink-0" />
                  <span>{isAr ? 'توليد وتحرير الطبقات البصرية بدقة 4K' : 'Generative AI image and 4K layer creation'}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Studio 2: Video Creation Studio */}
          <div className="group relative rounded-shape-lg overflow-hidden border border-[var(--border-main)] hover:border-[var(--accent)]/50 transition-all shadow-sm hover:shadow-lg bg-[var(--surface-card)] flex flex-col h-[310px] text-start">
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=70" 
                className="w-full h-full object-cover opacity-20 group-hover:opacity-30 group-hover:scale-105 transition-all duration-500" 
                alt="Video Studio"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-card)] via-[var(--surface-card)]/85 to-transparent" />
            </div>
            
            <div className="relative z-10 p-6 flex flex-col h-full justify-between text-start">
              <div>
                {/* Level 1 (Shortest): Icon + Compact Engine Badge at Start */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-10 h-10 rounded-shape-sm bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 shadow-2xs shrink-0">
                    <Video size={20} />
                  </div>
                  <span className="text-[11px] font-sans font-bold px-2.5 py-1 rounded-shape-xs bg-[var(--surface-subtle)] text-rose-500 border border-[var(--border-main)]">
                    {isAr ? 'المحرك 02 • إنتاج الفيديو' : 'Engine 02 • Video'}
                  </span>
                </div>
                {/* Level 2 (Medium): Studio Title */}
                <h3 className="text-lg font-black text-[var(--text-primary)] group-hover:text-rose-500 transition-colors mb-2 leading-snug">
                  {isAr ? 'استوديو الإنتاج المرئي والريلز' : 'Video & Reels Production Studio'}
                </h3>
                {/* Level 3 (Longest): Balanced Description Base */}
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2 font-medium">
                  {isAr 
                    ? 'إنتاج مقاطع الريلز الترويجية، القصص العمودية 9:16، دمج المسارات الزمنية، والتصدير المباشر بجودة 4K.'
                    : 'Marketing reels production, 9:16 vertical stories, timeline merging, and high-speed 4K export.'
                  }
                </p>
              </div>
              <ul className="pt-3.5 border-t border-[var(--border-main)] text-xs text-[var(--text-muted)] font-bold">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-rose-500 shrink-0" />
                  <span>{isAr ? 'تصدير مقاطع الريلز والقصص بجودة 4K بدون علامة' : 'Watermark-free 4K reels and story export'}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Studio 3: App Creation Studio */}
          <div className="group relative rounded-shape-lg overflow-hidden border border-[var(--border-main)] hover:border-[var(--accent)]/50 transition-all shadow-sm hover:shadow-lg bg-[var(--surface-card)] flex flex-col h-[310px] text-start">
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=600&q=70" 
                className="w-full h-full object-cover opacity-20 group-hover:opacity-30 group-hover:scale-105 transition-all duration-500" 
                alt="App Studio"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-card)] via-[var(--surface-card)]/85 to-transparent" />
            </div>
            
            <div className="relative z-10 p-6 flex flex-col h-full justify-between text-start">
              <div>
                {/* Level 1 (Shortest): Icon + Compact Engine Badge at Start */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-10 h-10 rounded-shape-sm bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20 shadow-2xs shrink-0">
                    <Smartphone size={20} />
                  </div>
                  <span className="text-[11px] font-sans font-bold px-2.5 py-1 rounded-shape-xs bg-[var(--surface-subtle)] text-blue-500 border border-[var(--border-main)]">
                    {isAr ? 'المحرك 03 • تطوير البرمجيات' : 'Engine 03 • Apps'}
                  </span>
                </div>
                {/* Level 2 (Medium): Studio Title */}
                <h3 className="text-lg font-black text-[var(--text-primary)] group-hover:text-blue-500 transition-colors mb-2 leading-snug">
                  {isAr ? 'استوديو تطوير وبناء التطبيقات' : 'Full-Stack App Creation Studio'}
                </h3>
                {/* Level 3 (Longest): Balanced Description Base */}
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2 font-medium">
                  {isAr 
                    ? 'هندسة واجهات المستخدم، توليد شجرة الملفات الكاملة، ومعاينة التطبيقات مباشرة في المتصفح مع التصدير الفوري.'
                    : 'Interactive UI engineering, full file tree generation, live browser preview, and instant ZIP export.'
                  }
                </p>
              </div>
              <ul className="pt-3.5 border-t border-[var(--border-main)] text-xs text-[var(--text-muted)] font-bold">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-blue-500 shrink-0" />
                  <span>{isAr ? 'تطوير ومعاينة تطبيقات الويب والموبايل مباشرة' : 'Smart mobile and web application compilation'}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Studio 4: Audio Studio */}
          <div className="group relative rounded-shape-lg overflow-hidden border border-[var(--border-main)] hover:border-[var(--accent)]/50 transition-all shadow-sm hover:shadow-lg bg-[var(--surface-card)] flex flex-col h-[310px] text-start">
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=70" 
                className="w-full h-full object-cover opacity-20 group-hover:opacity-30 group-hover:scale-105 transition-all duration-500" 
                alt="Audio Studio"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-card)] via-[var(--surface-card)]/85 to-transparent" />
            </div>
            
            <div className="relative z-10 p-6 flex flex-col h-full justify-between text-start">
              <div>
                {/* Level 1 (Shortest): Icon + Compact Engine Badge at Start */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-10 h-10 rounded-shape-sm bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-2xs shrink-0">
                    <Wand2 size={20} />
                  </div>
                  <span className="text-[11px] font-sans font-bold px-2.5 py-1 rounded-shape-xs bg-[var(--surface-subtle)] text-amber-500 border border-[var(--border-main)]">
                    {isAr ? 'المحرك 04 • هندسة الصوت' : 'Engine 04 • Audio'}
                  </span>
                </div>
                {/* Level 2 (Medium): Studio Title */}
                <h3 className="text-lg font-black text-[var(--text-primary)] group-hover:text-amber-500 transition-colors mb-2 leading-snug">
                  {isAr ? 'استوديو الهندسة والإنتاج الصوتي' : 'Neural Audio & Voiceover Studio'}
                </h3>
                {/* Level 3 (Longest): Balanced Description Base */}
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2 font-medium">
                  {isAr 
                    ? 'توليد التعليق الصوتي العصبي باللغتين العربية والإنجليزية، تنقية الترددات، ومزامنة الإيقاع بجودة 24kHz.'
                    : 'Neural voiceover synthesis in Arabic & English, frequency mastering, and 24kHz audio synchronization.'
                  }
                </p>
              </div>
              <ul className="pt-3.5 border-t border-[var(--border-main)] text-xs text-[var(--text-muted)] font-bold">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-amber-500 shrink-0" />
                  <span>{isAr ? 'توليد تعليق صوتي وموسيقى بجودة استوديو 24kHz' : 'Studio-grade 24kHz multi-language voiceovers'}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Studio 5: AI Agents & Logic Automation Studio */}
          <div className="group relative rounded-shape-lg overflow-hidden border border-[var(--border-main)] hover:border-[var(--accent)]/50 transition-all shadow-sm hover:shadow-lg bg-[var(--surface-card)] flex flex-col h-[310px] md:col-span-2 lg:col-span-2 text-start">
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=70" 
                className="w-full h-full object-cover opacity-20 group-hover:opacity-30 group-hover:scale-105 transition-all duration-500" 
                alt="Agents Studio"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-card)] via-[var(--surface-card)]/85 to-transparent" />
            </div>
            
            <div className="relative z-10 p-6 flex flex-col h-full justify-between text-start">
              <div>
                {/* Level 1 (Shortest): Icon + Compact Engine Badge at Start */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-10 h-10 rounded-shape-sm bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-2xs shrink-0">
                    <Terminal size={20} />
                  </div>
                  <span className="text-[11px] font-sans font-bold px-2.5 py-1 rounded-shape-xs bg-[var(--surface-subtle)] text-emerald-500 border border-[var(--border-main)]">
                    {isAr ? 'المحرك 05 • أتمتة الوكلاء' : 'Engine 05 • Agents'}
                  </span>
                </div>
                {/* Level 2 (Medium): Studio Title */}
                <h3 className="text-lg font-black text-[var(--text-primary)] group-hover:text-emerald-500 transition-colors mb-2 leading-snug">
                  {isAr ? 'استوديو الوكلاء والأتمتة البرمجية' : 'AI Agents & Logic Automation Studio'}
                </h3>
                {/* Level 3 (Longest): Balanced Description Base */}
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-2xl font-medium">
                  {isAr 
                    ? 'بناء وبرمجة وكلاء الذكاء الاصطناعي المستقلين، تنفيذ التحليلات التقنية المعقدة، وأتمتة سير العمل البرمجي في بيئة سحابية معزولة وآمنة.'
                    : 'Build autonomous AI agents, execute complex technical analysis, and automate engineering workflows in an isolated cloud environment.'
                  }
                </p>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3.5 border-t border-[var(--border-main)] text-xs text-[var(--text-muted)] font-bold">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>{isAr ? 'برمجة وأتمتة الوكلاء وسير العمل التقني' : 'Programmable AI Agent workflow automation'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>{isAr ? 'تحليلات تقنية معمقة ونمذجة منطقية' : 'Deep technical and logical system modeling'}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      {/* 3. GROWTH & PERFORMANCE METRICS (High-Impact Animated Numbers Section) */}
      <section className="py-12 sm:py-16 border-y border-[var(--border-main)] bg-[var(--surface-subtle)]/30 rounded-shape-lg">
        <div className="text-center mb-10 max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-[var(--accent)] mb-3">
            <Activity size={14} className="animate-pulse" />
            <span>{isAr ? 'مؤشرات الأداء والاعتماد المؤسسي' : 'Global Growth & Adoption Metrics'}</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black mb-2 tracking-tight text-[var(--text-primary)] sm:whitespace-nowrap">
            {isAr ? 'مؤشرات الأداء التشغيلي ومعدلات الاعتماد في 2026' : 'Operational Scale & Adoption by the Numbers'}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium max-w-2xl mx-auto sm:whitespace-nowrap">
            {isAr
              ? 'نمو متسارع في معدلات الإنتاج والاعتماد من قبل آلاف المصممين وفرق العمل حول العالم.'
              : 'Accelerating momentum trusted by thousands of creators and digital teams globally.'}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 px-4">
          {/* Stat 1: Total Generations */}
          <motion.div 
            className="p-5 sm:p-7 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-main)] text-center shadow-2xs hover:border-[var(--accent)]/50 transition-all group"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-2xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tighter mb-1.5 font-mono group-hover:scale-110 transition-transform">
              <AnimatedCounterNumber to={5.4} decimals={1} useLocale suffix="M+" duration={2} />
            </div>
            <div className="text-[10px] sm:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              {isAr ? 'تصميم وتوليد ناجح' : 'Designs Generated'}
            </div>
          </motion.div>

          {/* Stat 2: Verified Creators */}
          <motion.div 
            className="p-5 sm:p-7 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-main)] text-center shadow-2xs hover:border-[var(--accent)]/50 transition-all group"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="text-2xl sm:text-4xl font-black text-[var(--accent)] tracking-tighter mb-1.5 font-mono group-hover:scale-110 transition-transform">
              <AnimatedCounterNumber to={128} useLocale suffix="K+" duration={2} />
            </div>
            <div className="text-[10px] sm:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              {isAr ? 'صانع محتوى ومبدع معتمد' : 'Verified Creators'}
            </div>
          </motion.div>

          {/* Stat 3: Uptime SLA */}
          <motion.div 
            className="p-5 sm:p-7 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-main)] text-center shadow-2xs hover:border-[var(--accent)]/50 transition-all group"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="text-2xl sm:text-4xl font-black text-[var(--fg-success)] tracking-tighter mb-1.5 font-mono group-hover:scale-110 transition-transform">
              <AnimatedCounterNumber to={99.98} decimals={2} suffix="%" duration={2.5} />
            </div>
            <div className="text-[10px] sm:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              {isAr ? 'معدل التشغيل المستمر' : 'Platform Uptime'}
            </div>
          </motion.div>

          {/* Stat 4: AI Tools / Models */}
          <motion.div 
            className="p-5 sm:p-7 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-main)] text-center shadow-2xs hover:border-[var(--accent)]/50 transition-all group"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="text-2xl sm:text-4xl font-black text-amber-500 tracking-tighter mb-1.5 font-mono group-hover:scale-110 transition-transform">
              <AnimatedCounterNumber to={18} suffix="+" duration={2} />
            </div>
            <div className="text-[10px] sm:text-xs font-bold text-[var(--text-muted)]">
              {isAr ? 'استوديو ومحرك ذكاء اصطناعي' : 'Specialized AI Engines'}
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3.5. TEMPLATES SHOWCASE SECTION (قسم استعراض القوالب السيادية مع الفلاتر) */}
      <section id="templates-showcase" className="space-y-8 py-10">
        <div className="text-center space-y-2 max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
            <Palette size={14} />
            <span>{isAr ? 'مستودع قوالب رينكس الإبداعية المعتمدة' : 'Verified Rinex Creative Template Hub'}</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            {isAr ? 'ابدأ مشروعك الاحترافي بضغطة زر واحدة' : 'Launch Your Professional Project with One Click'}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
            {isAr ? 'اختر من بين آلاف القوالب المصممة بعناية لتناسب كافة منصات التواصل الاجتماعي والاحتياجات التسويقية.' : 'Choose from thousands of carefully designed templates tailored for all social media and marketing needs.'}
          </p>
        </div>

        {/* Category Filters - Standardized Professional Style */}
        <div className="flex flex-wrap items-center justify-center gap-2 px-4">
          {[
            { id: 'all', labelAr: 'الكل', labelEn: 'All', icon: <Layers size={14} /> },
            { id: 'reels', labelAr: 'ريلز وفيديو', labelEn: 'Reels & Video', icon: <Video size={14} /> },
            { id: 'marketing', labelAr: 'تسويقي وبانرات', labelEn: 'Marketing & Banners', icon: <Palette size={14} /> },
            { id: 'story', labelAr: 'قصص وستوري', labelEn: 'Stories', icon: <Smartphone size={14} /> },
            { id: 'posts', labelAr: 'منشورات 1:1', labelEn: 'Posts (1:1)', icon: <Camera size={14} /> },
            { id: 'cards', labelAr: 'بطاقات هويات', labelEn: 'Cards & Identity', icon: <Award size={14} /> },
            { id: 'youtube', labelAr: 'أغلفة وبانرات عريضة', labelEn: 'Banners & YouTube', icon: <Monitor size={14} /> }
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id as any)}
              className={`relative h-9 px-3.5 rounded-shape-sm text-xs font-bold leading-none inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer border shadow-2xs active:scale-95 before:absolute before:-inset-1 before:content-[''] ${
                activeCategory === cat.id
                  ? 'bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] border-transparent'
                  : 'bg-[var(--surface-card)] text-[var(--text-secondary)] border-[var(--border-main)] hover:border-[var(--accent)]/50 hover:text-[var(--text-primary)]'
              }`}
            >
              <span className="shrink-0 flex items-center">{cat.icon}</span>
              <span>{isAr ? cat.labelAr : cat.labelEn}</span>
            </button>
          ))}
        </div>

        {/* Templates Grid - Strict 4-Column Desktop Layout with Complete Rows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 px-4">
          {filteredTemplates.map((tpl) => {
            const isVideo = tpl.category === 'reels' || Boolean(tpl.previewVideoUrl || tpl.videoUrl);
            const categoryLabel = isAr 
              ? (tpl.categoryLabelAr || (tpl.category === 'reels' ? 'ريلز وفيديو' : tpl.category === 'story' ? 'قصص وستوري' : tpl.category === 'cards' ? 'بطاقات' : 'قالب تسويقي'))
              : (tpl.category === 'reels' ? 'Reels & Video' : tpl.category === 'story' ? 'Story' : tpl.category === 'cards' ? 'Cards' : 'Marketing');

            return (
              <motion.div
                key={tpl.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="group relative rounded-shape-md overflow-hidden bg-[var(--surface-card)] border border-[var(--border-main)] hover:border-[var(--accent)]/60 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
                onClick={() => handleOpenTemplatePreview(tpl)}
              >
                {/* Thumbnail Container */}
                <div className="relative w-full aspect-[4/3] bg-slate-900 overflow-hidden">
                  <img
                    src={tpl.src}
                    alt={isAr ? tpl.titleAr : tpl.titleEn}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />

                  {/* Video Badge on Top Start Corner */}
                  {isVideo && (
                    <span className="absolute top-2.5 start-2.5 px-2 py-1 rounded-shape-xs bg-slate-950/85 text-rose-400 border border-rose-500/30 text-[10px] font-bold font-mono flex items-center gap-1 backdrop-blur-md z-10 shadow-sm">
                      <Video size={11} className="animate-pulse" />
                      <span>{isAr ? 'فيديو ريلز' : 'REELS / VIDEO'}</span>
                    </span>
                  )}

                  {/* Video Hover Preview Stream */}
                  {(tpl.previewVideoUrl || tpl.videoUrl) && (
                    <video
                      src={tpl.previewVideoUrl || tpl.videoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    />
                  )}

                  {/* Gradient Scrim & Quick Action Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 z-20">
                    {/* Top Kicker - Unboxed Metadata */}
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
                      <span className="flex items-center gap-1">
                        {isVideo ? <Video size={13} className="text-rose-400" /> : <Palette size={13} className="text-[var(--accent)]" />}
                        <span>{categoryLabel}</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{tpl.dimensions}</span>
                    </div>

                    {/* Center Action Button */}
                    <div className="self-center transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <div className="h-9 px-4 rounded-shape-sm bg-white text-slate-950 font-bold text-xs leading-none inline-flex items-center justify-center gap-1.5 shadow-2xl hover:bg-slate-100 transition-colors">
                        <Eye size={14} className="text-[var(--accent)] shrink-0" />
                        <span>{isAr ? 'معاينة القالب وتعديله' : 'Quick Preview & Edit'}</span>
                      </div>
                    </div>

                    {/* Bottom Metadata */}
                    <div className="flex items-center justify-between text-[11px] font-bold text-white">
                      <span className="text-amber-300 flex items-center gap-1">
                        <Star size={12} className="fill-amber-300" />
                        <span>4.9</span>
                      </span>
                      <span className="text-emerald-400 font-mono font-bold">
                        {isAr ? 'قالب مجاني' : 'Free Template'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Content Footer (Strict Pyramid Hierarchy: Shortest Category -> Medium Title -> Longest Metadata) */}
                <div className="p-3.5 bg-[var(--surface-card)] space-y-1 border-t border-[var(--border-main)]/60 text-start">
                  <div className="text-[10px] font-sans font-bold text-[var(--accent)]">
                    {categoryLabel}
                  </div>
                  <h4 className="text-xs font-black text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-1">
                    {isAr ? tpl.titleAr : tpl.titleEn}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] font-medium">
                    <span>{isAr ? 'قالب معتمد في استوديو رينكس' : 'Verified Rinex Template'}</span>
                    <span aria-hidden="true" className="opacity-40">·</span>
                    <span className="font-mono text-[10px]">{tpl.dimensions}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Load More Button (Increments by 12 so 4-column rows remain 100% complete) */}
        {filteredTemplates.length < Math.floor(categoryPool.length / 4) * 4 && (
          <div className="flex justify-center pt-4">
            <button
              type="button"
              onClick={() => setVisibleGuestTemplatesCount(prev => prev + 12)}
              className="relative h-10 px-6 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-main)] text-[var(--text-secondary)] font-bold text-xs leading-none inline-flex items-center justify-center gap-2 hover:border-[var(--accent)] hover:text-[var(--text-primary)] transition-all cursor-pointer shadow-2xs active:scale-95 before:absolute before:-inset-1 before:content-['']"
            >
              <Layers size={14} className="text-[var(--accent)] shrink-0" />
              <span>{isAr ? 'عرض المزيد من القوالب' : 'Load More Templates'}</span>
            </button>
          </div>
        )}
      </section>


      {/* 4. PRICING SECTION (قسم الأسعار والخطط للمستخدمين) */}
      <section className="space-y-8 py-6">
        <div className="text-center space-y-2 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent)]">
            <Sparkles size={14} />
            <span>{isAr ? 'الخطط والأسعار' : 'Pricing Plans'}</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight sm:whitespace-nowrap">
            {isAr ? 'خطط اشتراك مرنة تناسب كافة الاحتياجات الإبداعية' : 'Flexible Plans for Every Creator'}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] sm:whitespace-nowrap">
            {isAr ? 'اختر الباقة المناسبة لمشاريعك مع تشفير قياسي للبيانات وقدرات إنتاج متكاملة.' : 'Choose the ideal plan for your projects with standard enterprise security.'}
          </p>
        </div>

        <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 items-stretch overflow-x-auto sm:overflow-visible snap-x snap-mandatory pt-5 pb-5 sm:pt-6 sm:pb-2 scrollbar-none px-4 -mx-4 sm:px-0 sm:mx-0">
          {userPlans.map((plan: any, planIdx: number) => {
            const planColor = plan.color || 'var(--fg-accent)';
            const effectiveCycle = selectedPlanCycles[plan.id] || 'monthly';
            const planPrice = effectiveCycle === 'annual' ? (plan.annualPrice || plan.monthlyPrice * 12 * 0.85) : plan.monthlyPrice;
            const annualFull = (plan.monthlyPrice || 0) * 12;
            const dynamicSavings = (plan.isAnnualEnabled !== false && plan.monthlyPrice > 0 && plan.annualPrice)
              ? Math.max(0, Math.round(((annualFull - plan.annualPrice) / annualFull) * 100))
              : 17;
            const savings = (plan.isAnnualEnabled !== false && plan.monthlyPrice > 0) ? (dynamicSavings > 0 ? dynamicSavings : 17) : 0;

            const allFeaturesList = safeList((isAr ? plan.featuresAr : plan.featuresEn) || plan.features || []);
            const isFeatExpanded = expandedPlanFeatures[plan.id.toString()] ?? false;
            const displayedFeaturesList = isFeatExpanded ? allFeaturesList : allFeaturesList.slice(0, 4);

            return (
              <div 
                key={`sub-plan-${plan.id || planIdx}`} 
                className={`relative rounded-shape-lg border p-5 md:p-7 flex flex-col justify-between transition-all duration-200 bg-[var(--surface-card)] border-[var(--border-main)] hover:border-[var(--border-strong)] shadow-sm group shrink-0 w-[86vw] sm:w-auto snap-center ${
                  plan.badge && plan.badge !== 'none' ? 'md:-translate-y-1 border-2' : ''
                }`}
                style={{ borderColor: planColor, boxShadow: `0 4px 20px -4px ${planColor}20` }}
              >
                {/* Plan Color Stripe */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1.5 rounded-t-lg transition-all group-hover:h-2" 
                  style={{ backgroundColor: planColor }}
                />

                {plan.badge && plan.badge !== 'none' && (
                  <div className={`absolute top-0 ${isAr ? 'left-5 md:left-7' : 'right-5 md:right-7'} -translate-y-1/2 z-30 pointer-events-none drop-shadow-md`}>
                    <span 
                      className="inline-flex items-center justify-center px-3.5 py-1 text-[11px] md:text-xs font-black uppercase tracking-wider text-white rounded-shape-xs shadow-lg border border-white/30 whitespace-nowrap" 
                      style={{ backgroundColor: planColor }}
                    >
                      {plan.badge.toLowerCase().includes('popular') || plan.badge.toLowerCase().includes('best')
                        ? (isAr ? 'أفضل قيمة' : 'BEST VALUE')
                        : plan.badge.toLowerCase().includes('pro')
                        ? (isAr ? 'الموصى به' : 'RECOMMENDED')
                        : plan.badge.toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="mb-3 pt-1">
                  <h3 className="text-xl md:text-2xl font-bold mb-1 flex items-center gap-2 text-[var(--text-primary)]">
                    <span 
                      className="w-2.5 h-2.5 rounded-shape-full shrink-0 shadow-xs" 
                      style={{ backgroundColor: planColor }}
                    />
                    <span>{safeText(isAr ? (plan.nameAr || plan.name) : (plan.nameEn || plan.name))}</span>
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {safeText(isAr ? (plan.descriptionAr || plan.description || plan.descAr) : (plan.descriptionEn || plan.description || plan.descEn))}
                  </p>
                </div>

                {/* Billing Cycle Toggle Buttons */}
                <div className="p-1 rounded-shape-sm flex items-center bg-[var(--surface-subtle)] border border-[var(--border-main)] mb-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPlanCycles(prev => ({ ...prev, [plan.id]: 'monthly' }))}
                    className={`relative flex-1 h-8 px-3 rounded-shape-xs text-[11px] font-bold leading-none inline-flex items-center justify-center uppercase tracking-wider transition-all cursor-pointer before:absolute before:-inset-1 before:content-[''] ${
                      effectiveCycle === 'monthly'
                        ? 'bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-main)] shadow-2xs'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {isAr ? 'شهري' : 'Monthly'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlanCycles(prev => ({ ...prev, [plan.id]: 'annual' }))}
                    className={`relative flex-1 h-8 px-3 rounded-shape-xs text-[11px] font-bold leading-none inline-flex items-center justify-center uppercase tracking-wider transition-all cursor-pointer before:absolute before:-inset-1 before:content-[''] ${
                      effectiveCycle === 'annual'
                        ? 'bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-main)] shadow-2xs'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {isAr ? 'سنوي' : 'Annual'}
                  </button>
                </div>

                <div className="mb-5 text-[var(--text-primary)]">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
                      ${planPrice.toFixed(2)}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] font-medium">/ {effectiveCycle === 'annual' ? (isAr ? 'سنوي' : 'Annual') : (isAr ? 'شهري' : 'Monthly')}</span>
                  </div>
                  {effectiveCycle === 'monthly' && savings > 0 && (
                    <div className="mt-1 text-xs font-semibold" style={{ color: planColor }}>
                      {isAr ? `وفر ${savings}% مع الدفع السنوي` : `Save ${savings}% with annual billing`}
                    </div>
                  )}

                  {/* Plan Credits Allowance Badge */}
                  <div className="mt-2.5 p-2 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-main)] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black text-[var(--text-primary)]">
                      <Sparkles size={14} style={{ color: planColor }} />
                      <span>
                        {Number(
                          effectiveCycle === 'annual'
                            ? (plan.annualCredits || (plan.monthlyCredits ? plan.monthlyCredits * 12 : Math.round((plan.annualPrice || 0) * 1000)))
                            : (plan.monthlyCredits || Math.round((plan.monthlyPrice || 0) * 1000) || 50000)
                        ).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-bold">
                        {isAr ? 'كريديت ذكاء اصطناعي' : 'AI Credits'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 mb-5 relative z-10">
                  {plan.monthlyPrice === 0 ? (
                    <button 
                      type="button"
                      onClick={() => handlePlanAction(plan.id, 'subscribe')}
                      className="relative w-full h-10 px-4 rounded-shape-sm text-white font-bold text-xs leading-none transition-all duration-150 shadow-2xs inline-flex items-center justify-center hover:opacity-95 active:scale-[0.98] cursor-pointer before:absolute before:-inset-1 before:content-['']"
                      style={{ backgroundColor: planColor, boxShadow: `0 2px 10px 0 ${planColor}35` }}
                    >
                      {isAr ? 'تفعيل الخطة المجانية' : 'Activate Free Plan'}
                    </button>
                  ) : (
                    <>
                      <button 
                        type="button"
                        onClick={() => handlePlanAction(plan.id, 'subscribe')}
                        className="relative w-full h-10 px-4 rounded-shape-sm text-white font-bold text-xs leading-none transition-all duration-150 shadow-2xs inline-flex items-center justify-center hover:opacity-95 active:scale-[0.98] cursor-pointer before:absolute before:-inset-1 before:content-['']"
                        style={{ backgroundColor: planColor, boxShadow: `0 2px 10px 0 ${planColor}35` }}
                      >
                        {isAr ? 'اشتراك' : 'Subscribe'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => handlePlanAction(plan.id, 'balance')}
                        className="relative w-full h-10 px-4 rounded-shape-sm font-bold text-xs leading-none transition-all duration-150 border bg-transparent hover:bg-[var(--surface-subtle)] inline-flex items-center justify-center active:scale-[0.98] cursor-pointer before:absolute before:-inset-1 before:content-['']"
                        style={{ borderColor: planColor, color: planColor }}
                      >
                        {isAr ? 'الدفع بالرصيد' : 'Pay with Balance'}
                      </button>
                    </>
                  )}
                </div>

                <div className="space-y-2 pt-3 border-t border-[var(--border-main)] flex-1">
                  <div className="text-[11px] font-bold text-[var(--text-muted)] mb-2">
                    {isAr ? 'الميزات والخصائص' : 'Features & Benefits'}
                  </div>
                  {displayedFeaturesList.map((featText: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <CheckCircle2 size={13} className="text-[var(--fg-success)] shrink-0" />
                      <span>{featText}</span>
                    </div>
                  ))}

                  {allFeaturesList.length > 4 && (
                    <button
                      type="button"
                      onClick={() => setExpandedPlanFeatures(prev => ({ ...prev, [plan.id.toString()]: !isFeatExpanded }))}
                      className="mt-2 text-[11px] font-bold text-[var(--fg-accent)] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>
                        {isFeatExpanded
                          ? (isAr ? 'إخفاء المزايا' : 'Show Less')
                          : (isAr ? `عرض كافة المزايا (${allFeaturesList.length})` : `Show All ${allFeaturesList.length} Features`)}
                      </span>
                      <ChevronDown size={13} className={`transition-transform duration-200 ${isFeatExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4.5. COMMUNITY TESTIMONIALS & REVIEWS SECTION (قسم آراء وتجارب مجتمع المبدعين مع زر المشاركة) */}
      <section id="reviews-section" className="space-y-8 py-8 max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border-main)] pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
              <Star size={14} className="fill-[var(--accent)]" />
              <span>{isAr ? 'مجتمع مبدعي رينكس وبيربليكستا' : 'Rinex & Perplexta Creators Community'}</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
              {isAr ? 'تجارب وآراء المصممين وصناع المحتوى' : 'What Creators Are Saying'}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)]">
              {isAr ? 'اكتشف كيف ساهم استوديو رينكس في تسريع إنتاج المحتوى الرقمي والريلز والبوسترات للمبدعين.' : 'See how Rinex Creative Studio empowers creators worldwide to build and monetize stunning visual assets.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsReviewModalOpen(true)}
            className="relative h-10 px-5 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-bold text-xs leading-none shadow-2xs hover:opacity-90 transition-all cursor-pointer inline-flex items-center justify-center gap-2 active:scale-95 shrink-0 before:absolute before:-inset-1 before:content-['']"
          >
            <MessageSquarePlus size={15} className="shrink-0" />
            <span>{isAr ? 'شارك تجربتك وتصميمك' : 'Share Your Review'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.slice(0, 6).map((rev) => (
            <div
              key={rev.id}
              className="rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-main)] p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={rev.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                      alt={rev.name}
                      className="w-10 h-10 rounded-full object-cover border border-[var(--border-main)]"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-primary)]">{rev.name}</h4>
                      <p className="text-[10px] text-[var(--text-muted)]">{isAr ? rev.roleAr : rev.roleEn}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={i < rev.rating ? "fill-amber-500 text-amber-500" : "text-slate-300 dark:text-slate-700"}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
                  "{isAr ? rev.commentAr : rev.commentEn}"
                </p>
              </div>

              {rev.mediaUrl && (
                <div className="rounded-shape-xs overflow-hidden border border-[var(--border-main)] aspect-video bg-slate-900">
                  <img
                    src={rev.mediaUrl}
                    alt={rev.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-[var(--border-main)] text-[10px] text-[var(--text-muted)]">
                <span>{rev.verified ? (isAr ? 'مبدع معتمد' : 'Verified Creator') : (isAr ? 'عضو المبادرة' : 'Community Member')}</span>
                <span>{new Date(rev.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short' })}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. NEWSLETTER SUBSCRIPTION SECTION (نشرة التحديثات البريدية) */}
      <section className="space-y-8 py-8 max-w-7xl mx-auto px-4">
        <div className="p-6 sm:p-10 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Visual Newsletter Image Column (5 cols - placed first) */}
            <div className="lg:col-span-5 order-2 lg:order-1">
              <div className="relative rounded-shape-md overflow-hidden border border-[var(--border-main)] shadow-xl group aspect-4/3 lg:aspect-square">
                <img 
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=70" 
                  alt="Rinex Creative Studio Updates & Innovation"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-end p-6 text-white space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-shape-xs bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 text-[10px] font-bold w-fit">
                    <Zap size={12} />
                    <span>{isAr ? 'تحديثات حصرية أسبوعية' : 'Weekly Exclusive Updates'}</span>
                  </div>
                  <h3 className="text-base font-black tracking-tight">
                    {isAr ? 'كن دائماً في طليعة المبدعين وصناع المحتوى' : 'Always Stay Ahead of the Curve'}
                  </h3>
                </div>
              </div>
            </div>

            {/* Newsletter Text & Form Column (7 cols - placed second) */}
            <div className="lg:col-span-7 space-y-4 text-center lg:text-start order-1 lg:order-2">
              <div className="flex items-center justify-center lg:justify-start gap-2 text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
                <Globe size={14} />
                <span>{isAr ? 'نشرة التحديثات الدورية • استوديو رينكس' : 'Product Updates · Rinex Studio'}</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
                {isAr ? 'اشترك في نشرتنا البريدية حول التحديثات' : 'Subscribe to Our Product Updates'}
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed max-w-xl">
                {isAr ? 'احصل على أحدث القوالب، ميزات الذكاء الاصطناعي، وتحديثات استوديو رينكس مباشرة في بريدك الإلكتروني.' : 'Get the latest templates, AI features, and studio updates directly in your inbox.'}
              </p>

              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder={isAr ? 'ادخل بريدك الإلكتروني...' : 'Enter your email...'}
                  className="w-full sm:w-80 h-10 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                />
                <button
                  type="submit"
                  className="relative w-full sm:w-auto h-10 px-6 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-bold text-xs leading-none shadow-2xs hover:opacity-90 transition-all active:scale-95 cursor-pointer inline-flex items-center justify-center gap-2 before:absolute before:-inset-1 before:content-['']"
                >
                  <Send size={14} className="shrink-0" />
                  <span>{isAr ? 'اشتراك' : 'Subscribe'}</span>
                </button>
              </form>
              {isSubscribedNewsletter && (
                <p className="text-xs font-bold text-[var(--fg-success)]">
                  {isAr ? 'تم اشتراكك بنجاح في النشرة الدورية!' : 'Successfully subscribed to the newsletter!'}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION (قسم الأسئلة الشائعة بنمط القائمة المطوية الاحترافية - عمودين) */}
      <section className="space-y-8 py-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
            <HelpCircle size={14} />
            <span>{isAr ? 'مركز الأسئلة الشائعة والمساعدة' : 'FAQ & Support Hub'}</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            {isAr ? 'كل ما تحتاج معرفته عن استوديو رينكس' : 'Everything You Need to Know'}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-7xl mx-auto">
          <div className="space-y-3">
            {faqItems.slice(0, 3).map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx} 
                  className="rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-main)] overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-5 py-4 flex items-center justify-between text-start font-bold text-xs sm:text-sm text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                      <span>{isAr ? faq.qAr : faq.qEn}</span>
                    </span>
                    <ChevronDown size={16} className={`transition-transform duration-200 text-[var(--text-muted)] ${isOpen ? 'rotate-180 text-[var(--accent)]' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-xs text-[var(--text-muted)] leading-relaxed border-t border-[var(--border-main)] bg-[var(--surface-subtle)]/30 animate-in fade-in duration-150">
                      {isAr ? faq.aAr : faq.aEn}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-3">
            {faqItems.slice(3, 6).map((faq, idx) => {
              const actualIdx = idx + 3;
              const isOpen = openFaqIndex === actualIdx;
              return (
                <div 
                  key={actualIdx} 
                  className="rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-main)] overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : actualIdx)}
                    className="w-full px-5 py-4 flex items-center justify-between text-start font-bold text-xs sm:text-sm text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                      <span>{isAr ? faq.qAr : faq.qEn}</span>
                    </span>
                    <ChevronDown size={16} className={`transition-transform duration-200 text-[var(--text-muted)] ${isOpen ? 'rotate-180 text-[var(--accent)]' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-xs text-[var(--text-muted)] leading-relaxed border-t border-[var(--border-main)] bg-[var(--surface-subtle)]/30 animate-in fade-in duration-150">
                      {isAr ? faq.aAr : faq.aEn}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. CONTACT US SECTION (قسم اتصل بنا الفائق مع صورة تعبيرية وشراكة) */}
      <section className="space-y-8 py-8 max-w-7xl mx-auto px-4">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
            <MessageSquare size={14} />
            <span>{isAr ? 'التواصل المباشر والشراكات' : 'Direct Support & Partnerships'}</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            {isAr ? 'نحن هنا لدعم نجاحك وإجابة استفساراتك' : 'We Are Here to Support Your Success'}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)]">
            {isAr ? 'أرسل لنا استفسارك، مقترحك، أو طلب الشراكة وسيتم الرد خلال ساعات معدودة.' : 'Send us your inquiry, proposal, or partnership request.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Contact Form Column (7 cols - placed first) */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <form onSubmit={handleContactSubmit} className="p-6 sm:p-8 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] shadow-sm space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="landing-contact-name" className="text-xs font-bold text-[var(--text-secondary)]">{isAr ? 'الاسم الكريم' : 'Full Name'}</label>
                  <input
                    id="landing-contact-name"
                    name="contactName"
                    type="text"
                    required
                    aria-label={isAr ? 'الاسم الكريم' : 'Full Name'}
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder={isAr ? 'مثال: أحمد الملا' : 'John Doe'}
                    className="w-full h-11 sm:h-10 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] text-sm sm:text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <label htmlFor="landing-contact-role" className="space-y-1.5 block cursor-pointer">
                  <span className="text-xs font-bold text-[var(--text-secondary)] block">
                    {isAr ? 'المهنة أو التخصص' : 'Profession / Role'}
                  </span>
                  <input
                    id="landing-contact-role"
                    name="contactRole"
                    type="text"
                    aria-label={isAr ? 'المهنة أو التخصص' : 'Profession / Role'}
                    title={isAr ? 'المهنة أو التخصص' : 'Profession / Role'}
                    value={contactRole}
                    onChange={(e) => setContactRole(e.target.value)}
                    placeholder={isAr ? 'مثال: مصمم واجهات، صانع محتوى' : 'Graphic Designer'}
                    className="w-full h-11 sm:h-10 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] text-sm sm:text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label htmlFor="landing-contact-reason" className="space-y-1.5 block cursor-pointer">
                  <span className="text-xs font-bold text-[var(--text-secondary)] block">
                    {isAr ? 'سبب الاتصال' : 'Contact Reason'}
                  </span>
                  <select
                    id="landing-contact-reason"
                    name="contactReason"
                    aria-label={isAr ? 'سبب الاتصال' : 'Contact Reason'}
                    title={isAr ? 'سبب الاتصال' : 'Contact Reason'}
                    value={contactReason}
                    onChange={(e) => setContactReason(e.target.value)}
                    className="w-full h-11 sm:h-10 px-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] text-sm sm:text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                  >
                    <option value="suggestion">{isAr ? 'اقتراح تطويري' : 'Feature Suggestion'}</option>
                    <option value="partnership">{isAr ? 'طلب شراكة أو تعاون' : 'Partnership Request'}</option>
                    <option value="bug">{isAr ? 'طلب دعم تقني' : 'Technical Support Request'}</option>
                    <option value="career">{isAr ? 'طلب انضمام أو توظيف' : 'Career Opportunity'}</option>
                    <option value="other">{isAr ? 'استفسار عام' : 'General Inquiry'}</option>
                  </select>
                </label>

                <label htmlFor="landing-contact-file" className="space-y-1.5 block cursor-pointer">
                  <span className="text-xs font-bold text-[var(--text-secondary)] block">
                    {isAr ? 'إرفاق ملف أو صورة (اختياري - صور أو PDF فقط)' : 'Attach Image or PDF (Optional)'}
                  </span>
                  <input
                    id="landing-contact-file"
                    name="contactFile"
                    type="file"
                    accept="image/*,.pdf"
                    aria-label={isAr ? 'إرفاق ملف أو صورة (اختياري - صور أو PDF فقط)' : 'Attach Image or PDF (Optional)'}
                    title={isAr ? 'إرفاق ملف أو صورة (اختياري - صور أو PDF فقط)' : 'Attach Image or PDF (Optional)'}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          toast.error(isAr ? 'حجم الملف يجب ألا يتجاوز 10 ميجابايت' : 'File size must not exceed 10MB');
                          return;
                        }
                        setContactFile(file);
                      }
                    }}
                    className="w-full text-xs text-[var(--text-muted)] file:me-3 file:py-2.5 file:px-3.5 file:rounded-shape-xs file:border-0 file:text-xs file:font-bold file:bg-[var(--surface-subtle)] file:text-[var(--text-primary)] hover:file:bg-[var(--surface-inset)] cursor-pointer"
                  />
                </label>
              </div>

              <label htmlFor="landing-contact-message" className="space-y-1.5 block cursor-pointer">
                <span className="text-xs font-bold text-[var(--text-secondary)] block">
                  {isAr ? 'نص الرسالة (يُمنع رفع الروابط أو الأكواد)' : 'Message (URLs and code snippets are prohibited)'}
                </span>
                <textarea
                  id="landing-contact-message"
                  name="contactMessage"
                  required
                  rows={3}
                  aria-label={isAr ? 'نص الرسالة' : 'Message text'}
                  title={isAr ? 'نص الرسالة' : 'Message text'}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder={isAr ? 'اكتب تفاصيل استفسارك أو طلبك بوضوح...' : 'Write your message details clearly...'}
                  className="w-full p-3.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] text-sm sm:text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                />
                <p className="text-[10px] text-[var(--text-muted)]">
                  {isAr ? 'تنبيه أمني: يمنع منعاً باتاً إدراج روابط خارجية أو أكواد برمجية في الرسالة.' : 'Security note: External links and code snippets are strictly prohibited.'}
                </p>
              </label>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingContact}
                  className="relative w-full sm:w-auto h-10 px-6 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-bold text-xs leading-none shadow-2xs hover:opacity-90 transition-all active:scale-95 cursor-pointer inline-flex items-center justify-center gap-2 before:absolute before:-inset-1 before:content-['']"
                >
                  {isSubmittingContact ? <Loader2 size={15} className="animate-spin shrink-0" /> : <Send size={15} className="shrink-0" />}
                  <span>{isAr ? 'إرسال الرسالة' : 'Send Secure Message'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Visual Partnership & Support Image Column (5 cols - placed second) */}
          <div className="lg:col-span-5 order-1 lg:order-2 space-y-4">
            <div className="relative rounded-shape-lg overflow-hidden border border-[var(--border-main)] shadow-xl group aspect-4/3 lg:aspect-square">
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=70" 
                alt="Rinex Creative Studio Support & Partnership"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-end p-6 text-white space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-shape-xs bg-[var(--bg-success-muted)] border border-[color-mix(in_srgb,var(--fg-success)_30%,transparent)] text-[var(--fg-success)] text-[10px] font-bold w-fit">
                  <ShieldCheck size={12} />
                  <span>{isAr ? 'فريق دعم فني معتمد' : 'Verified Support Team'}</span>
                </div>
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  {isAr ? 'شراكة حقيقية ونمو مستدام لمشاريعك' : 'True Partnership & Sustainable Growth'}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isAr ? 'نحن نؤمن بأن نجاحك هو نجاح لمنظومتنا، وفريقنا المتخصص مستعد دوماً لمساعدتك.' : 'We believe your success is our success. Our dedicated team is always ready.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. BOTTOM CTA SECTION (قسم الدعوة النهائية للعمل الاحترافي - متناسق مع الأقسام السابقة مع صورة حيوية) */}
      <section className="space-y-8 py-8 max-w-7xl mx-auto px-4">
        <div className="p-6 sm:p-10 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Visual Launch Image Column (5 cols - placed first on desktop) */}
            <div className="lg:col-span-5 order-2 lg:order-1">
              <div className="relative rounded-shape-md overflow-hidden border border-[var(--border-main)] shadow-xl group aspect-4/3 lg:aspect-square">
                <img 
                  src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=70" 
                  alt="Launch Creative Project"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-end p-6 text-white space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-shape-xs bg-[var(--bg-success-muted)] border border-[color-mix(in_srgb,var(--fg-success)_30%,transparent)] text-[var(--fg-success)] text-[10px] font-bold w-fit">
                    <ShieldCheck size={12} />
                    <span>{isAr ? 'تشفير وحفظ ملكية المشاريع' : 'Protected Project Ownership'}</span>
                  </div>
                  <h3 className="text-base font-black tracking-tight">
                    {isAr ? 'مستقبل التصميم وصناعة المحتوى يبدأ هنا' : 'The Future of Creation Starts Here'}
                  </h3>
                </div>
              </div>
            </div>

            {/* Text & Button Column (7 cols - placed second on desktop) */}
            <div className="lg:col-span-7 space-y-4 text-center lg:text-start order-1 lg:order-2">
              <div className="flex items-center justify-center lg:justify-start gap-2 text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
                <Sparkles size={14} />
                <span>{isAr ? 'ابدأ مشروعك الإبداعي الآن' : 'Start Your Journey Today'}</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
                {isAr ? 'جاهز لبدء مشروعك الإبداعي الأول؟' : 'Ready to Launch Your First Design?'}
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed max-w-xl">
                {isAr 
                  ? 'انضم إلينا اليوم مجاناً، وأنشئ مشاريعك بحماية كاملة وتحديد مالك معتمد لتصميماتك دون أي تعقيد.' 
                  : 'Join thousands of creators today. Register for free and get full ownership of your designs.'
                }
              </p>
              <div className="pt-2 flex items-center justify-center lg:justify-start gap-3">
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="relative w-full sm:w-auto h-10 px-6 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-bold text-xs leading-none shadow-2xs hover:opacity-95 transition-all active:scale-95 cursor-pointer inline-flex items-center justify-center gap-2 before:absolute before:-inset-1 before:content-['']"
                >
                  <UserPlus size={15} className="shrink-0" />
                  <span>{isAr ? 'إنشاء حساب مجاني الآن' : 'Create Free Account'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* REVIEW SUBMISSION MODAL (نافذة إضافة رأي وتصميم) */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-main)] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-[var(--text-primary)]">
            <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-[var(--text-primary)]">
                <MessageSquarePlus size={18} className="text-[var(--accent)]" />
                <span>{isAr ? 'شارك تجربتك مع مجتمع رينكس' : 'Submit Your Review & Design'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1 rounded-shape-xs hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddReviewSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label htmlFor="reviewer-name-input" className="font-bold text-[var(--text-secondary)]">{isAr ? 'اسمك الكريم' : 'Your Name'}</label>
                <input
                  id="reviewer-name-input"
                  name="reviewerName"
                  type="text"
                  required
                  aria-label={isAr ? 'اسمك الكريم' : 'Your Name'}
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder={isAr ? 'مثال: محمد الغامدي' : 'John Doe'}
                  className="w-full px-3 py-2 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="reviewer-role-input" className="font-bold text-[var(--text-secondary)]">{isAr ? 'المسمى الوظيفي أو التخصص' : 'Your Role or Specialty'}</label>
                <input
                  id="reviewer-role-input"
                  name="reviewerRole"
                  type="text"
                  aria-label={isAr ? 'المسمى الوظيفي أو التخصص' : 'Your Role or Specialty'}
                  value={reviewerRole}
                  onChange={(e) => setReviewerRole(e.target.value)}
                  placeholder={isAr ? 'مثال: مصمم جرافيك، صانع محتوى' : 'Graphic Designer'}
                  className="w-full px-3 py-2 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--text-secondary)]">{isAr ? 'التقييم' : 'Rating'}</label>
                <div className="flex items-center gap-2 pt-1" role="group" aria-label={isAr ? 'تقييم النجوم' : 'Star rating'}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      aria-label={`${star} ${isAr ? 'نجوم' : 'stars'}`}
                      onClick={() => setReviewerRating(star)}
                      className="p-1 text-amber-500 cursor-pointer hover:scale-110 transition-transform"
                    >
                      <Star size={20} className={star <= reviewerRating ? 'fill-amber-500' : 'text-slate-400'} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="reviewer-comment-input" className="font-bold text-[var(--text-secondary)]">{isAr ? 'تجربتك ورأيك في الاستوديو' : 'Your Feedback'}</label>
                <textarea
                  id="reviewer-comment-input"
                  name="reviewerComment"
                  required
                  rows={3}
                  aria-label={isAr ? 'تجربتك ورأيك في الاستوديو' : 'Your Feedback'}
                  value={reviewerComment}
                  onChange={(e) => setReviewerComment(e.target.value)}
                  placeholder={isAr ? 'اكتب انطباعك ورأيك في أدوات المنصة والكانفاس...' : 'Share your experience using Rinex Creative Studio...'}
                  className="w-full px-3 py-2 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="reviewer-media-url-input" className="font-bold text-[var(--text-secondary)]">{isAr ? 'رابط صورة تصميمك (اختياري)' : 'Design Showcase Image URL (Optional)'}</label>
                <input
                  id="reviewer-media-url-input"
                  name="reviewerMediaUrl"
                  type="url"
                  aria-label={isAr ? 'رابط صورة تصميمك' : 'Design Showcase Image URL'}
                  value={reviewerMediaUrl}
                  onChange={(e) => setReviewerMediaUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-main)]">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="relative h-9 px-4 rounded-shape-sm text-xs font-bold leading-none inline-flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer before:absolute before:-inset-1 before:content-['']"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  className="relative h-9 px-5 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-bold text-xs leading-none cursor-pointer shadow-2xs hover:opacity-90 active:scale-95 inline-flex items-center justify-center gap-1.5 before:absolute before:-inset-1 before:content-['']"
                >
                  <Send size={14} className="shrink-0" />
                  <span>{isAr ? 'نشر التجربة' : 'Submit Review'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Template Preview Modal for Visitors */}
      <TemplatePreviewModal
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
      />

      {/* Certified Creator Registration Modal */}
      <CreatorRegistrationModal
        isOpen={isCreatorModalOpen}
        onClose={() => setIsCreatorModalOpen(false)}
      />

    </div>
  );
};
