import React, { useState, useEffect, useMemo, memo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Code2,
  Image as ImageIcon,
  GraduationCap,
  Activity,
  Users,
  ShieldCheck,
  Check,
  CheckCircle2,
  Star,
  Plus,
  Play,
  X,
  Menu,
  ChevronDown,
  Terminal,
  Cpu,
  Layers,
  Sparkles,
  BookOpen,
  Clock,
  MessageCircle,
  Puzzle,
  Zap,
  Lock,
  ArrowRight,
  ExternalLink,
  Github,
  Twitter,
  Linkedin,
  Share2,
  FileCode2,
  Search,
  MessageSquare,
  HelpCircle,
  Settings,
  Headphones,
  Sliders,
  DollarSign,
  LayoutGrid,
  Tv,
  Music,
  Mic,
  Volume2,
  Key,
  Cloud,
  Megaphone,
  Wallet,
  Workflow,
  Network,
  TrendingUp,
  BarChart3,
  Coins,
  Gift,
  ArrowUpRight,
  PieChart,
  FileText,
  Scale,
  RotateCcw,
  Database,
  Server,
  Download,
  Maximize2,
  Award,
  Send,
  Bot,
  CornerDownLeft,
  RefreshCw,
  CreditCard,
  Globe,
  Loader2,
  UserPlus,
  Film,
  AlertCircle
} from 'lucide-react';
import { toast, AssistantIcon } from '@/design-system';
import { motion, AnimatePresence, useInView, useMotionValue, useSpring, useTransform, animate, type Variants } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { Logo } from '../components/common/Logo';
import { AnimatedCounterNumber } from '../components/common/AnimatedCounterNumber';
import { CognitiveOrbitRing } from '../components/chat/common/CognitiveOrbitRing';
import { ThemeToggleButton } from '../components/ThemeToggleButton';
import { AuthModal } from '../components/AuthModal';
import { ALL_TOOLS } from '../constants';
import { extractYouTubeId, getYouTubeEmbedUrl } from '../utils/videoUtils';
import { 
  PLATFORM_COMMERCIAL_CONFIG, 
  LANDING_HERO_DEFAULTS, 
  ECOSYSTEM_PARTNER_COLORS 
} from '../constants/platformConfig';

// --- Animation Variants (Matching ChatDeck) ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const fadeUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const scaleInVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

// --- Limit Item Component for Daily Tool Quotas (SubscriptionPage Standard) ---
const LimitItem = memo(({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: any; color: string }) => {
  let daily = null;
  if (typeof value === 'object' && value !== null) {
    daily = value.daily;
  } else {
    daily = value;
  }
  const formatLimit = (v: any) => (v === 'unlimited' ? '∞' : (v || 0));

  return (
    <div
      title={label}
      className="flex flex-col items-center justify-center p-1.5 md:p-2 rounded-shape-xs border bg-[var(--surface-subtle)] border-[var(--border-main)] hover:border-[var(--border-accent)] hover:bg-[var(--surface-card)] transition-all duration-150 group"
    >
      <div className="transition-transform group-hover:scale-105 mb-1" style={{ color }}>
        {icon}
      </div>
      <span className="text-[10px] md:text-[11px] font-black text-[var(--text-primary)] leading-none">
        {formatLimit(daily)}
      </span>
    </div>
  );
});
LimitItem.displayName = 'LimitItem';

// --- Typewriter Text Effect Component ---
const TypewriterText: React.FC<{ text: string; speed?: number; className?: string }> = memo(({ text, speed = 18, className = '' }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className={className}>
      {displayedText}
      {isTyping && <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-[var(--fg-accent)] animate-pulse align-middle" />}
    </span>
  );
});
TypewriterText.displayName = 'TypewriterText';

const toolIcons: Record<string, React.ReactNode> = {
  chat: <MessageSquare size={12} className="md:w-3.5 md:h-3.5" />,
  chat_fast: <MessageSquare size={12} className="md:w-3.5 md:h-3.5" />,
  chat_pro: <Sparkles size={12} className="md:w-3.5 md:h-3.5" />,
  chat_reasoning: <Cpu size={12} className="md:w-3.5 md:h-3.5" />,
  sovereign_search: <Search size={12} className="md:w-3.5 md:h-3.5" />,
  perplexta_analysis: <Search size={12} className="md:w-3.5 md:h-3.5" />,
  ads_copilot: <Megaphone size={12} className="md:w-3.5 md:h-3.5" />,
  vision: <Sparkles size={12} className="md:w-3.5 md:h-3.5" />,
  image: <Sparkles size={12} className="md:w-3.5 md:h-3.5" />,
  video: <Tv size={12} className="md:w-3.5 md:h-3.5" />,
  code: <Code2 size={12} className="md:w-3.5 md:h-3.5" />,
  canvas: <LayoutGrid size={12} className="md:w-3.5 md:h-3.5" />,
  audio_studio: <Music size={12} className="md:w-3.5 md:h-3.5" />,
  stt: <Mic size={12} className="md:w-3.5 md:h-3.5" />,
  tts: <Volume2 size={12} className="md:w-3.5 md:h-3.5" />,
  perplexta_music: <Music size={12} className="md:w-3.5 md:h-3.5" />,
  x402_api: <Key size={12} className="md:w-3.5 md:h-3.5" />,
  storage_mb: <Cloud size={12} className="md:w-3.5 md:h-3.5" />,
};

// --- Shimmer Button Component ---
interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  children?: React.ReactNode;
}

const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = '#ffffff',
      shimmerSize = '0.05em',
      shimmerDuration = '3s',
      borderRadius = 'var(--comp-button-radius, 8px)',
      background = 'var(--comp-button-primary-bg)',
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        style={
          {
            '--spread': '90deg',
            '--shimmer-color': shimmerColor,
            '--radius': borderRadius,
            '--speed': shimmerDuration,
            '--cut': shimmerSize,
            '--bg': background,
          } as React.CSSProperties
        }
        className={`group relative z-0 inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-shape-sm border border-white/20 px-6 h-10 leading-none whitespace-nowrap text-[var(--comp-button-primary-fg)] [background:var(--bg)] transform-gpu transition-all duration-300 ease-in-out active:scale-95 shadow-md hover:shadow-lg font-bold text-xs before:absolute before:-inset-1 before:content-[''] ${className}`}
        ref={ref}
        {...props}
      >
        <div className="-z-30 blur-[2px] [container-type:size] absolute inset-0 overflow-visible pointer-events-none">
          <div className="animate-shimmer-slide absolute inset-0 [aspect-ratio:1] h-[100cqh] [border-radius:0] [mask:none]">
            <div className="animate-spin-around absolute -inset-full w-auto [translate:0_0] rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))]" />
          </div>
        </div>
        <span className="relative z-10 inline-flex items-center justify-center gap-2 leading-none">{children}</span>
        <div className="absolute inset-0 size-full rounded-shape-sm px-4 py-1.5 text-xs font-medium shadow-[inset_0_-8px_10px_#ffffff25] transform-gpu transition-all duration-300 ease-in-out group-hover:shadow-[inset_0_-6px_10px_#ffffff40] group-active:shadow-[inset_0_-10px_10px_#ffffff40] pointer-events-none" />
        <div className="absolute [inset:var(--cut)] -z-20 [border-radius:var(--radius)] [background:var(--bg)] pointer-events-none" />
      </button>
    );
  }
);
ShimmerButton.displayName = 'ShimmerButton';

const getPartnerIcon = (name: string) => {
  switch (name) {
    case 'Google Gemini':
      return <Sparkles className="w-4 h-4 text-white" />;
    case 'Perplexity':
      return <Globe className="w-4 h-4 text-white" />;
    case 'OpenAI':
      return <Cpu className="w-4 h-4 text-white" />;
    case 'Anthropic':
      return <Layers className="w-4 h-4 text-white" />;
    case 'Meta Llama':
      return <Network className="w-4 h-4 text-white" />;
    case 'Mistral AI':
      return <Zap className="w-4 h-4 text-white" />;
    case 'DeepSeek':
      return <Search className="w-4 h-4 text-white" />;
    case 'Hugging Face':
      return <Bot className="w-4 h-4 text-white" />;
    case 'Cohere':
      return <Workflow className="w-4 h-4 text-white" />;
    case 'Alibaba Qwen':
      return <Database className="w-4 h-4 text-white" />;
    case 'Ollama':
      return <Server className="w-4 h-4 text-white" />;
    case 'Stability AI':
      return <ImageIcon className="w-4 h-4 text-white" />;
    default:
      return <Sparkles className="w-4 h-4 text-white" />;
  }
};

// --- Certified AI Ecosystem & Partners (Matching Uploaded Video) ---
const aiEcosystemPartners = [
  { name: 'Google Gemini', desc: 'Multimodal & Vision AI', color: ECOSYSTEM_PARTNER_COLORS.GOOGLE },
  { name: 'Perplexity', desc: 'Neural Search Engine', color: ECOSYSTEM_PARTNER_COLORS.PERPLEXITY },
  { name: 'Hugging Face', desc: 'Open ML Models Hub', color: ECOSYSTEM_PARTNER_COLORS.HUGGING_FACE },
  { name: 'Cohere', desc: 'Enterprise NLP & Embed', color: ECOSYSTEM_PARTNER_COLORS.COHERE },
  { name: 'Mistral AI', desc: 'European Open Weights', color: ECOSYSTEM_PARTNER_COLORS.MISTRAL },
  { name: 'DeepSeek', desc: 'Deep Reasoning Engine', color: ECOSYSTEM_PARTNER_COLORS.DEEPSEEK },
  { name: 'Alibaba Qwen', desc: 'Multimodal AI Suite', color: ECOSYSTEM_PARTNER_COLORS.QWEN },
  { name: 'Ollama', desc: 'Local LLM Runner', color: ECOSYSTEM_PARTNER_COLORS.OLLAMA },
  { name: 'Stability AI', desc: 'Stable Diffusion XL', color: ECOSYSTEM_PARTNER_COLORS.STABILITY },
  { name: 'Meta Llama', desc: 'Open Foundation Models', color: ECOSYSTEM_PARTNER_COLORS.META },
  { name: 'Anthropic', desc: 'Claude 3.5 Sonnet', color: ECOSYSTEM_PARTNER_COLORS.ANTHROPIC },
  { name: 'OpenAI', desc: 'GPT-4o & Reasoning', color: ECOSYSTEM_PARTNER_COLORS.OPENAI }
];

export const ProjectOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    language,
    setLanguage,
    siteSettings,
    setIsAuthModalOpen,
    user,
    token,
    plans,
    t,
    balanceUSD,
    payWithBalance,
    stripeCheckout,
    refreshUser,
    isAuthModalOpen
  } = useAppContext();

  // Sovereign Visitor Landing Page Gate: If user is authenticated, route immediately to chosen target or /chat
  useEffect(() => {
    const isLanding = location.pathname === '/' || location.pathname === '/overview' || location.pathname === '/welcome';
    if ((user || token) && isLanding) {
      let targetRoute = '/chat';
      try {
        const savedRedirect = sessionStorage.getItem('perplexta_post_auth_redirect');
        if (savedRedirect && savedRedirect.startsWith('/')) {
          targetRoute = savedRedirect;
          sessionStorage.removeItem('perplexta_post_auth_redirect');
        }
      } catch {}
      navigate(targetRoute, { replace: true });
    }
  }, [user, token, navigate, location.pathname]);
  const isRtl = language === 'ar';
  const brandName = (isRtl ? siteSettings?.siteNameAr : siteSettings?.siteName) || (isRtl ? 'بيربليكستا' : 'Perplexta');

  const [menuState, setMenuState] = useState(false);
  const [isStudiosNavDropdownOpen, setIsStudiosNavDropdownOpen] = useState(false);
  const [isToolsNavDropdownOpen, setIsToolsNavDropdownOpen] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  const videoFrameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const assistantMessagesRef = useRef<HTMLDivElement>(null);
  const assistantInputPopoverRef = useRef<HTMLFormElement>(null);

  // Sovereign Landing CMS & Showcase Video State
  const [landingCms, setLandingCms] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('perplexta_landing_cms');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const heroVideoConfig = landingCms?.heroVideo || {
    enabled: true,
    ...LANDING_HERO_DEFAULTS,
    videoUrl: '',
    youtubeUrl: '',
    posterUrl: '',
  };

  const activeVideoUrl = useMemo(() => {
    if (isRtl) {
      return heroVideoConfig.videoUrlAr || heroVideoConfig.videoUrl || '';
    } else {
      return heroVideoConfig.videoUrlEn || heroVideoConfig.videoUrl || '';
    }
  }, [isRtl, heroVideoConfig]);

  const activeYoutubeUrl = useMemo(() => {
    if (isRtl) {
      return heroVideoConfig.youtubeUrlAr || heroVideoConfig.youtubeUrl || '';
    } else {
      return heroVideoConfig.youtubeUrlEn || heroVideoConfig.youtubeUrl || '';
    }
  }, [isRtl, heroVideoConfig]);

  const activePosterUrl = useMemo(() => {
    if (isRtl) {
      return heroVideoConfig.posterUrlAr || heroVideoConfig.posterUrl || '';
    } else {
      return heroVideoConfig.posterUrlEn || heroVideoConfig.posterUrl || '';
    }
  }, [isRtl, heroVideoConfig]);

  const activeVideoSourceType = useMemo(() => {
    if (isRtl) {
      return heroVideoConfig.sourceTypeAr || (activeYoutubeUrl ? 'youtube' : (activeVideoUrl ? 'file' : heroVideoConfig.sourceType || 'file'));
    } else {
      return heroVideoConfig.sourceTypeEn || (activeYoutubeUrl ? 'youtube' : (activeVideoUrl ? 'file' : heroVideoConfig.sourceType || 'file'));
    }
  }, [isRtl, heroVideoConfig, activeVideoUrl, activeYoutubeUrl]);

  useEffect(() => {
    let isMounted = true;
    let timer: any = null;
    let idleId: any = null;

    const fetchCms = () => {
      fetch('/api/cms/landing')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.config && isMounted) {
            setLandingCms(data.config);
            try {
              localStorage.setItem('perplexta_landing_cms', JSON.stringify(data.config));
            } catch {}
          }
        })
        .catch(() => {});
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = (window as any).requestIdleCallback(() => {
        if (isMounted) fetchCms();
      }, { timeout: 5000 });
    } else {
      timer = setTimeout(fetchCms, 4500);
    }

    const handleCmsUpdate = (e: any) => {
      if (e.detail && isMounted) {
        setLandingCms(e.detail);
      }
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

  // Auto-play / load when CMS video URL changes or language changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      if (heroVideoConfig.autoplay !== false) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [activeVideoUrl, activeYoutubeUrl, activeVideoSourceType]);

  // Auto-pause video when scrolled out of viewport & resume when back in view
  useEffect(() => {
    const targetElement = videoFrameRef.current;
    if (!targetElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (videoRef.current) {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
              videoRef.current.play().catch(() => {});
            } else {
              videoRef.current.pause();
            }
          }
        });
      },
      {
        threshold: [0, 0.2, 0.4, 0.6, 0.8, 1.0]
      }
    );

    observer.observe(targetElement);

    return () => {
      observer.unobserve(targetElement);
      observer.disconnect();
    };
  }, [activeVideoUrl]);

  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({});
  const [selectedPersonaPath, setSelectedPersonaPath] = useState<'developers' | 'creators' | 'enterprises'>('developers');
  const [selectedModularStudioTab, setSelectedModularStudioTab] = useState<'all' | 'apps' | 'motion' | 'video' | 'audio' | 'viral'>('all');

  // Newsletter & Contact Form States (Unified Platform Model)
  const [newsletterEmail, setNewsletterEmail] = useState<string>('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState<boolean>(false);
  const [contactName, setContactName] = useState<string>('');
  const [contactRole, setContactRole] = useState<string>('');
  const [contactReason, setContactReason] = useState<string>('suggestion');
  const [contactFile, setContactFile] = useState<File | null>(null);
  const [contactMessage, setContactMessage] = useState<string>('');
  const [isSubmittingContact, setIsSubmittingContact] = useState<boolean>(false);
  const [contactSubmitted, setContactSubmitted] = useState<boolean>(false);
  const [expandedPlanFeatures, setExpandedPlanFeatures] = useState<Record<string, boolean>>({});

  // Floating Live Chat & Assistant Widget State (Connected to Fast AI Engine)
  const [isLiveAssistantOpen, setIsLiveAssistantOpen] = useState<boolean>(false);
  const [assistantInput, setAssistantInput] = useState<string>('');
  const [showAssistantSuggestions, setShowAssistantSuggestions] = useState<boolean>(false);
  const [visitorMessageCount, setVisitorMessageCount] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem('perplexta_assistant_visitor_count');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });
  const [isAssistantSending, setIsAssistantSending] = useState<boolean>(false);
  const [assistantMessages, setAssistantMessages] = useState<Array<{
    id: string;
    sender: 'assistant' | 'user';
    text: string;
    time: string;
    actionType?: string;
    actionLink?: string;
    actionLabel?: string;
  }>>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: isRtl
        ? 'أهلاً بك. أنا المساعد الرقمي لمنصة بيربليكستا.\nيمكنني إجابتك حول خدماتنا التقنية، خيارات التكامل، وأمان البيانات، أو توجيهك للفريق المختص.\n\nما الذي تود الاستفسار عنه؟'
        : 'Welcome. I am the digital assistant for the Perplexta platform.\nI can answer your questions about our technical services, integration options, and data security, or direct you to the specialized team.\n\nWhat would you like to inquire about?',
      time: isRtl ? 'الآن' : 'Just Now'
    }
  ]);

  // Auto-scroll assistant messages to center on update
  useEffect(() => {
    if (isLiveAssistantOpen && assistantMessagesRef.current) {
      const timer = setTimeout(() => {
        const container = assistantMessagesRef.current;
        if (!container) return;
        const lastMessage = container.lastElementChild;
        if (lastMessage) {
          lastMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [assistantMessages, isAssistantSending, isLiveAssistantOpen]);

  // Click-outside listener for Assistant Input Popover Suggestions (smooth fade-out)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        assistantInputPopoverRef.current &&
        !assistantInputPopoverRef.current.contains(event.target as Node)
      ) {
        setShowAssistantSuggestions(false);
      }
    };

    if (showAssistantSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showAssistantSuggestions]);

  const toggleFaq = (index: number) => {
    setOpenFaqs((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // --- Real Plan State & Synchronous Fetching (SubscriptionPage Model) ---
  const [activeTab, setActiveTab] = useState<'user' | 'developer'>('user');
  const [selectedPlanCycles, setSelectedPlanCycles] = useState<Record<string, 'daily' | 'monthly' | 'annual'>>({});
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({});

  const togglePlanExpand = (id: string) => {
    setExpandedPlans((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const visiblePlans = useMemo(() => {
    return (plans || []).filter((p: any) => p.isVisible);
  }, [plans]);

  const displayedPlans = useMemo(() => {
    return visiblePlans.filter((p: any) => {
      if (activeTab === 'developer') return p.planType === 'developer';
      return !p.planType || p.planType === 'user';
    });
  }, [visiblePlans, activeTab]);

  const getPlanAvailableCycles = (plan: any): Array<'daily' | 'monthly' | 'annual'> => {
    const cycles: Array<'daily' | 'monthly' | 'annual'> = [];
    if (plan.isDailyEnabled) cycles.push('daily');
    if (plan.isMonthlyEnabled !== false) cycles.push('monthly');
    if (plan.isAnnualEnabled !== false) cycles.push('annual');
    return cycles.length > 0 ? cycles : ['monthly'];
  };

  const getEffectiveCycleForPlan = (plan: any): 'daily' | 'monthly' | 'annual' => {
    const planSpecific = selectedPlanCycles[plan.id];
    const avail = getPlanAvailableCycles(plan);
    if (planSpecific && avail.includes(planSpecific)) return planSpecific;
    if (avail.includes(isYearly ? 'annual' : 'monthly')) return isYearly ? 'annual' : 'monthly';
    return avail[0];
  };

  const getDisplayPrice = (plan: any, cycle: 'daily' | 'monthly' | 'annual') => {
    if (cycle === 'daily') return Number(plan.dailyPrice || 0);
    const m = Number(plan.monthlyPrice || 0);
    const a = Number(plan.annualPrice || 0);
    const d = Number(plan.discount || 0);
    if (cycle === 'monthly') return m;
    if (a > 0) return a;
    return m * 12 * (1 - d / 100);
  };

  const getSavingPercentage = (plan: any) => {
    const m = Number(plan.monthlyPrice || 0);
    const a = Number(plan.annualPrice || 0);
    const d = Number(plan.discount || 0);
    if (a > 0 && m > 0) {
      const fullPrice = m * 12;
      const saving = Math.round((1 - a / fullPrice) * 100);
      return saving > 0 ? saving : 0;
    }
    if (d > 0) return d;
    return 0;
  };

  const isActivePlan = (planId: string) => {
    return user?.subscription?.plan_id?.toString() === planId.toString() && user?.subscription?.status === 'active';
  };

  const getBadgeLabel = (badge: string) => {
    if (!badge || badge === 'none') return '';
    const translations: Record<string, { ar: string; en: string }> = {
      popular: { ar: 'الأكثر طلباً', en: 'Most Popular' },
      'Best Value': { ar: 'أفضل قيمة', en: 'Best Value' },
      Standard: { ar: 'أساسي', en: 'Standard' },
      Elite: { ar: 'مؤسسي', en: 'Enterprise' },
      'Dev Entry': { ar: 'مطور مبتدئ', en: 'Dev Entry' },
      'Best Dev Value': { ar: 'أفضل قيمة للمطورين', en: 'Best Dev Value' },
      exclusive: { ar: 'حصري', en: 'Exclusive' },
      best_seller: { ar: 'الأكثر مبيعاً', en: 'Best Seller' },
      trending: { ar: 'شائع', en: 'Trending' },
      pro: { ar: 'احترافي', en: 'Pro' },
    };
    if (translations[badge]) {
      return isRtl ? translations[badge].ar : translations[badge].en;
    }
    const translated = t ? t(badge) : '';
    return translated || badge;
  };

  const getFeatureText = (feat: any) => {
    if (typeof feat === 'string') return feat;
    if (typeof feat === 'object' && feat !== null) {
      return isRtl ? feat.textAr || feat.textEn || feat.text : feat.textEn || feat.textAr || feat.text;
    }
    return '';
  };

  const handlePlanAction = async (planId: string, actionType: 'free' | 'subscribe' | 'balance' = 'subscribe') => {
    if (!user) {
      try {
        sessionStorage.setItem('perplexta_post_auth_redirect', '/subscription');
      } catch {}
      setIsAuthModalOpen(true);
      return;
    }

    const targetPlan = (plans || []).find((p: any) => p.id.toString() === planId.toString());
    const effectiveCycle = targetPlan ? getEffectiveCycleForPlan(targetPlan) : (isYearly ? 'annual' : 'monthly');

    if (actionType === 'free') {
      navigate('/chat');
      return;
    }

    if (actionType === 'balance') {
      const price = targetPlan ? getDisplayPrice(targetPlan, effectiveCycle) : 0;
      if (balanceUSD < price) {
        navigate('/subscription');
        return;
      }
      try {
        const res = await payWithBalance(planId, effectiveCycle);
        if (res.success) {
          await refreshUser();
          navigate('/subscription');
        } else {
          navigate('/subscription');
        }
      } catch {
        navigate('/subscription');
      }
      return;
    }

    // Default checkout action via Stripe / Subscription page
    try {
      const res = await stripeCheckout(planId, effectiveCycle);
      if (res.url) {
        window.location.href = res.url;
      } else {
        navigate('/subscription');
      }
    } catch {
      navigate('/subscription');
    }
  };

  const handleStartNow = () => {
    setIsToolsNavDropdownOpen(false);
    setIsStudiosNavDropdownOpen(false);
    setMenuState(false);
    try {
      sessionStorage.setItem('perplexta_post_auth_redirect', '/chat');
    } catch {}
    if (user || token) {
      navigate('/chat');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleLivePreviewClick = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    handleStartNow();
  };

  const handleNavigateToSection = (route: string) => {
    setIsToolsNavDropdownOpen(false);
    setIsStudiosNavDropdownOpen(false);
    setMenuState(false);
    try {
      sessionStorage.setItem('perplexta_post_auth_redirect', route);
    } catch {}
    if (user || token) {
      navigate(route);
      return;
    }
    // Routes that require active session on entry prompt AuthModal and redirect directly to the chosen route after login
    if (route.startsWith('/chat') || route.startsWith('/audio-studio')) {
      setIsAuthModalOpen(true);
    } else {
      navigate(route);
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactMessage.trim()) {
      toast.error(isRtl ? 'يرجى إدخال الاسم ورسالة الاتصال' : 'Please provide name and message');
      return;
    }

    const lowerMsg = contactMessage.toLowerCase();
    const hasCodeOrUrl = lowerMsg.includes('http://') || lowerMsg.includes('https://') || lowerMsg.includes('www.') || lowerMsg.includes('<script') || lowerMsg.includes('select *') || lowerMsg.includes('drop table') || lowerMsg.includes('eval(');
    if (hasCodeOrUrl) {
      toast.error(isRtl ? 'عذراً، يُمنع إرسال روابط أو أكواد برمجية في رسائل الاتصال لأسباب أمنية.' : 'Links, URLs, and code snippets are strictly prohibited for security reasons.');
      return;
    }

    setIsSubmittingContact(true);
    setTimeout(() => {
      setIsSubmittingContact(false);
      setContactName('');
      setContactRole('');
      setContactMessage('');
      setContactFile(null);
      setContactSubmitted(true);
      toast.success(isRtl ? 'تم إرسال رسالتك بنجاح! سيتم الرد عليك قريباً من قبل فريق الإدارة.' : 'Your message has been sent successfully!');
    }, 800);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes('@')) {
      toast.error(isRtl ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address');
      return;
    }
    setNewsletterSubmitted(true);
    toast.success(isRtl ? 'تم اشتراكك بنجاح في نشرة التحديثات الدورية!' : 'Successfully subscribed to our newsletter!');
  };


  const handleSendAssistantMessage = async (customQuery?: string) => {
    const q = (customQuery !== undefined ? customQuery : assistantInput).trim();
    if (!q || isAssistantSending) return;
    setShowAssistantSuggestions(false);

    if (visitorMessageCount >= 5) {
      toast.error(isRtl ? 'استنفدت الحد المسموح به للزوار (5 استفسارات). يرجى التسجيل للاستمرار.' : 'Maximum 5 visitor queries reached. Please sign in to continue.');
      return;
    }

    const nextCount = visitorMessageCount + 1;
    setVisitorMessageCount(nextCount);
    try {
      sessionStorage.setItem('perplexta_assistant_visitor_count', String(nextCount));
    } catch {}

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user' as const,
      text: q,
      time: 'الآن'
    };

    setAssistantMessages((prev) => [...prev, userMsg]);
    setAssistantInput('');
    setIsAssistantSending(true);

    try {
      const res = await fetch('/api/ai/live-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          language: isRtl ? 'ar' : 'en',
          history: assistantMessages.map(m => ({ role: m.sender, content: m.text }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAssistantMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'assistant',
            text: data.reply || (isRtl ? 'مساعد بيربليكستا في خدمتكم. كيف يمكننا المساعدة اليوم؟' : 'Perplexta Assistant is at your service. How may we assist you today?'),
            time: 'الآن',
            actionType: data.actionType,
            actionLink: data.actionLink,
            actionLabel: data.actionLabel
          }
        ]);
      } else {
        throw new Error('Live assistant service error');
      }
    } catch {
      // Grounded fallback
      let reply = isRtl
        ? 'تُعد منصة بيربليكستا منظومة هندسية متكاملة تدمج استوديو البرمجيات، محرّر التصميم المتجه، المساعد الأكاديمي، وسوق القوالب في بيئة سحابية مشفرة.'
        : 'Perplexta is an integrated engineering platform combining software development, vector design editors, academic research engines, and the ViralBook hub within an encrypted environment.';
      let actionLink: string | undefined = '/chat';
      let actionLabel: string | undefined = isRtl ? 'استكشاف الحلول التقنية' : 'Explore Technical Solutions';
      let actionType: string | undefined = undefined;

      const lower = q.toLowerCase();
      if (lower.includes('سعر') || lower.includes('اسعار') || lower.includes('باقة') || lower.includes('plan') || lower.includes('price')) {
        reply = isRtl
          ? 'نوفر خططاً مرنة تبدأ من خطط الاستخدام اليومي والشهري مع خصم 20% على الاشتراك السنوي.'
          : 'We offer flexible daily and monthly plans with a 20% discount on annual billing.';
        actionLink = '#pricing';
        actionLabel = isRtl ? 'عرض الخطط والأسعار' : 'View Pricing Plans';
      } else if (lower.includes('استرداد') || lower.includes('ضمان') || lower.includes('refund')) {
        reply = isRtl
          ? 'نضمن لك استرداداً نقدياً كاملاً بنسبة 100% خلال 14 يوماً عند عدم استهلاك حصص الاشتراك.'
          : 'We offer a 100% money-back guarantee within 14 days for unconsumed plan resources.';
        actionLink = '#refund-policy';
        actionLabel = isRtl ? 'سياسة الاسترداد' : 'Refund Policy';
      } else if (lower.includes('مشكلة') || lower.includes('استفسار') || lower.includes('دعم') || lower.includes('bug') || lower.includes('fix') || lower.includes('تذكرة')) {
        reply = isRtl
          ? 'لتقديم طلب دعم تقني رسمي أو استفسار فني متخصص، يرجى تعبئة نموذج "اتصل بنا" لفتح تذكرة دعم مباشرة ليتم معالجتها من قبل المهندسين المختصين.'
          : 'To submit an official technical support request or specialized inquiry, please complete our "Contact Us" form to create a direct support ticket for engineering review.';
        actionType = 'contact';
        actionLink = '#contact';
        actionLabel = isRtl ? 'فتح تذكرة دعم فني رسمية' : 'Open Official Support Ticket';
      }

      setAssistantMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: reply,
          time: 'الآن',
          actionType,
          actionLink,
          actionLabel
        }
      ]);
    } finally {
      setIsAssistantSending(false);
    }
  };

  // --- Specialized Engineering Studios Data (Asymmetric Bento Grid) ---
  const features = useMemo(
    () => [
      {
        id: 'rinex_motion',
        colSpan: 'lg:col-span-2',
        number: '01',
        title: isRtl ? 'استوديو التصميم والموشن (رينكس)' : 'Rinex Design & Motion Studio',
        description: isRtl
          ? 'محرر طبقات متجهة وتصميم حر لتحريك العناصر، صناعة إعلانات الريلز والموشن جرافيك، وتصديرها بدقة 4K فائقة.'
          : 'Advanced freeform vector layer editor to create, animate, and export 4K motion graphics and promotional reels.',
        icon: <ImageIcon className="size-5 text-indigo-500" />,
        badge: isRtl ? 'تصميم وموشن' : 'Vector & Motion',
        route: '/image-studio',
      },
      {
        id: 'app_studio',
        colSpan: 'lg:col-span-1',
        number: '02',
        title: isRtl ? 'استوديو تطوير البرمجيات' : 'Software Studio',
        description: isRtl
          ? 'توليد وتجميع تطبيقات الويب الكاملة مع شجرة ملفات حقيقية، معاينة حية، وتصدير فوري للمشروع.'
          : 'Full-stack web application development with real file trees, live browser compilation, and instant project export.',
        icon: <Code2 className="size-5 text-blue-500" />,
        badge: isRtl ? 'تطبيقات ويب' : 'Web Apps',
        route: '/app',
      },
      {
        id: 'audio_studio',
        colSpan: 'lg:col-span-1',
        number: '03',
        title: isRtl ? 'استوديو الهندسة والإنتاج الصوتي' : 'Neural Audio Studio',
        description: isRtl
          ? 'توليد الأصوات العصبية الواقعية، تحويل النصوص إلى كلام (TTS) بنقاء 24kHz، ومعالجة الترددات والأوامر الصوتية.'
          : 'High-fidelity neural voice synthesis, 24kHz studio text-to-speech, and real-time voice command processing.',
        icon: <Volume2 className="size-5 text-rose-500" />,
        badge: isRtl ? 'هندسة صوتية' : 'Neural Audio',
        route: '/audio-studio',
      },
      {
        id: 'creator_economy',
        colSpan: 'lg:col-span-2',
        number: '04',
        title: isRtl ? 'مجتمع وشبكة فيرال بوك' : 'ViralBook Community & Marketplace',
        description: isRtl
          ? 'نشر القوالب والتصاميم في الدليل العام بعائد مباشر ($0.70 لكل استخدام)، عمولة إحالة 20% متكررة، ومكافأة ترحيبية $50.'
          : 'Publish templates to the marketplace, earn $0.70 per execution, 20% recurring referral split, and a $50 welcome bonus.',
        icon: <Users className="size-5 text-emerald-500" />,
        badge: isRtl ? 'مجتمع وعوائد' : 'Community & Royalties',
        route: '/viralbook',
      },
    ],
    [isRtl]
  );

  // --- Reviews Data (ChatDeck Dual Marquee with Hierarchical Structure) ---
  const reviews = useMemo(
    () => [
      {
        name: isRtl ? 'عمر الفاروق' : 'Omar Farouk',
        username: '@omar_tech',
        role: isRtl ? 'هندسة البرمجيات والأنظمة' : 'Full-Stack Software Engineer',
        headline: isRtl ? 'تسريع دورة التطوير وبناء الهيكل البرمجي بالكامل' : 'Accelerated Full-Stack Dev Cycles & Tree Export',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        body: isRtl
          ? 'استوديو تطوير البرمجيات وفر عليّ أسابيع من التطوير. تم توليد تطبيق ويب متكامل مع شجرة ملفات قابلة للتصدير في ثوانٍ معدودة.'
          : 'Perplexta Software Studio saved me weeks of frontend & backend dev. Generated an entire functional web app with full file tree in seconds.',
      },
      {
        name: isRtl ? 'د. حسام الدين' : 'Dr. Hussam Eddin',
        username: '@hussam_research',
        role: isRtl ? 'باحث أكاديمي وتحليل بيانات' : 'Academic Research & Data Analysis',
        headline: isRtl ? 'دقة استثنائية في تلخيص وتنسيق المراجع الأكاديمية' : 'Precision Academic Citation & Research Synthesis',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        body: isRtl
          ? 'المساعد الأكاديمي والبحوث فائق الدقة. استطعت مراجعة وتنسيق أكثر من 80 دراسة سابقة وفق نظام APA مع تلخيص النتائج بدقة استثنائية.'
          : 'The Academic Vault is remarkably accurate. Formatted over 80 references to APA standards while distilling core insights effortlessly.',
      },
      {
        name: isRtl ? 'ليلى مراد' : 'Layla Murad',
        username: '@layla_designs',
        role: isRtl ? 'تصميم واجهات المستخدم والموشن' : 'UI/UX & Motion Systems Designer',
        headline: isRtl ? 'استبدال الأدوات الخارجية باستوديو التصميم والموشن' : 'Completely Replaced External Canvas Design Tools',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        body: isRtl
          ? 'استوديو التصميم والموشن (رينكس) يغنيك تماماً عن أي برنامج خارجي. توليد الصور وتحرير النصوص في نفس الموضع بدقة 100% أمر عملي جداً.'
          : 'Rinex Design & Motion Studio completely replaced external tools for my agency. In-place text editing directly on the canvas is pure perfection.',
      },
      {
        name: isRtl ? 'يوسف كمال' : 'Youssef Kamal',
        username: '@youssef_dev',
        role: isRtl ? 'هندسة البنية التحتية وقواعد البيانات' : 'Cloud Infrastructure & Database Security',
        headline: isRtl ? 'عزل كامل لقواعد البيانات واعتمادية تشغيلية مستمرة' : 'Strict Database Isolation & High System Reliability',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        body: isRtl
          ? 'عزل قواعد البيانات والتشفير القياسي للبيانات هو ما جعلنا ننقل عملياتنا بالكامل إلى بيربليكستا. سرعة استجابة عالية واعتمادية مستمرة.'
          : 'Strict database isolation and standard encryption convinced our engineering team to switch completely. High speed and reliable execution.',
      },
      {
        name: isRtl ? 'رنا الشامي' : 'Rana Al-Shami',
        username: '@rana_marketing',
        role: isRtl ? 'إدارة النمو والتسويق الرقمي' : 'Growth & Digital Marketing Lead',
        headline: isRtl ? 'عوائد نقدية مباشرة من مجتمع وشبكة فيرال بوك' : 'Direct Recurring Revenue from ViralBook Templates',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        body: isRtl
          ? 'مجتمع وشبكة فيرال بوك ونظام عوائد المبدعين حوّل قوالبي الإعلانية إلى مصدر دخل مستمر. تجربة منظمة وسلسة بكل المقاييس.'
          : 'ViralBook Community and creator royalties turned my marketing templates into a steady revenue stream. Truly an outstanding ecosystem.',
      },
      {
        name: isRtl ? 'أحمد ناصر' : 'Ahmed Nasser',
        username: '@ahmed_startup',
        role: isRtl ? 'مؤسس تقني ومدير منتج' : 'Tech Founder & Product Lead',
        headline: isRtl ? 'رفع إنتاجية الفريق بنسبة 400% عبر أدوات موحدة' : 'Boosted Startup Velocity by 400% via Unified Platform',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        body: isRtl
          ? 'التحليل المتعدد والأوامر الصوتية السريعة رفعت إنتاجية فريقنا بأكثر من 400%. منصة موحدة تغنيك عن 5 اشتراكات منفصلة ومكلفة.'
          : 'Multi-modal analysis and live voice features boosted our startup velocity by 400%. Replaced 5 disparate subscriptions.',
      },
    ],
    [isRtl]
  );

  const firstRow = reviews.slice(0, 3);
  const secondRow = reviews.slice(3, 6);

  const videoArtRow1 = useMemo(
    () => [
      { title: isRtl ? 'انيميشن سينيماطيجي 4K' : 'Cinematic Sci-Fi Motion', prompt: 'Drone shot flying through sci-fi nebula corridor, 60fps', img: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=70', duration: '00:15s', studioRoute: '/image-studio?category=reels' },
      { title: isRtl ? 'إعلان تجاري فائق الدقة' : 'Commercial Product Reveal', prompt: 'Luxury watch rotating in zero gravity, studio lighting', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=70', duration: '00:10s', studioRoute: '/image-studio?category=reels' },
      { title: isRtl ? 'مؤثرات بصرية هوليوودية' : 'VFX Explosion & Particles', prompt: 'Cinematic hyper-detailed cosmic explosion, 4k 120fps slowmo', img: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=70', duration: '00:08s', studioRoute: '/image-studio?category=reels' },
    ],
    [isRtl]
  );

  const videoArtRow2 = useMemo(
    () => [
      { title: isRtl ? 'رحلة عبر الزمن في الطبيعة' : 'Time-Lapse Alpine Sunrise', prompt: 'Sun rising over misty mountain peaks, dramatic cloud movement', img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500&auto=format&fit=crop&q=70', duration: '00:20s', studioRoute: '/image-studio?category=reels' },
      { title: isRtl ? 'مقدمة وثائقية تقنية' : 'Tech Document Intro Reel', prompt: 'Futuristic HUD data stream, glowing neural networks, dark cinematic', img: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=70', duration: '00:12s', studioRoute: '/image-studio?category=reels' },
      { title: isRtl ? 'مؤثرات موجات بحرية واقعية' : 'Ocean Waves Cinematic Drone', prompt: 'Crystal clear turquoise ocean waves crashing on white sand', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=70', duration: '00:15s', studioRoute: '/image-studio?category=reels' },
    ],
    [isRtl]
  );

  const rinexTemplateRow1 = useMemo(
    () => [
      { title: isRtl ? 'قالب هوية شركة تقنية' : 'Tech Startup Brand Kit', category: 'Motion Identity', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80', layers: '14 Vector Layers', studioRoute: '/image-studio' },
      { title: isRtl ? 'تصميم منشورات السوشيال' : 'Social Media Growth Reel', category: 'Viral Marketing', img: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&auto=format&fit=crop&q=80', layers: '8 Keyframe Tracks', studioRoute: '/image-studio' },
      { title: isRtl ? 'واجهة تطبيق موبايل UI' : 'Mobile App UI Mockup', category: 'Product Showcase', img: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&auto=format&fit=crop&q=80', layers: '22 Component Nodes', studioRoute: '/image-studio' },
    ],
    [isRtl]
  );

  const rinexTemplateRow2 = useMemo(
    () => [
      { title: isRtl ? 'لوغو متحرك ثلاثي الأبعاد' : '3D Metallic Logo Reveal', category: 'Branding Motion', img: '/uploads/default_3d_motion.jpg', layers: '5 Camera Angles', studioRoute: '/image-studio' },
      { title: isRtl ? 'عرض تقديمي استثماري Pitch' : 'Startup Pitch Deck Canvas', category: 'Presentation', img: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=80', layers: '18 Interactive Slides', studioRoute: '/image-studio' },
      { title: isRtl ? 'مؤثرات بصرية إعلانية' : 'Dynamic Ad Banner Set', category: 'Performance Mkt', img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80', layers: '10 Vector Timelines', studioRoute: '/image-studio' },
    ],
    [isRtl]
  );

  const audioArtRow1 = useMemo(
    () => [
      { title: isRtl ? 'طرب أصيل - ليالي العود' : 'Classic Tarab - Oud Night', genre: isRtl ? 'طرب أصيل' : 'Tarab & Strings', duration: '04:12s', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80', tag: '24kHz Lossless', studioRoute: '/audio-studio' },
      { title: isRtl ? 'سيمفونية بيانو كلاسيكية' : 'Classical Piano Symphony', genre: isRtl ? 'كلاسيكي هادئ' : 'Classical Masterpiece', duration: '03:50s', img: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80', tag: 'Acoustic Grand', studioRoute: '/audio-studio' },
      { title: isRtl ? 'بودكاست تقني - مستقبل الذكاء' : 'Tech Podcast - Neural Future', genre: isRtl ? 'بودكاست واوديو' : 'Voice Synthesis', duration: '02:30s', img: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&auto=format&fit=crop&q=80', tag: 'Neural Voice', studioRoute: '/audio-studio' },
    ],
    [isRtl]
  );

  const audioArtRow2 = useMemo(
    () => [
      { title: isRtl ? 'مقطوعة سينمائية ملحمية' : 'Epic Cinematic Soundtrack', genre: isRtl ? 'سينمائي درامي' : 'Cinematic Score', duration: '05:15s', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80', tag: 'Orchestral 5.1', studioRoute: '/audio-studio' },
      { title: isRtl ? 'موسيقى استرخاء وتأمل آكواريل' : 'Ambient Meditation & Zen', genre: isRtl ? 'تأمل واسترخاء' : 'Ambient Lo-Fi', duration: '06:00s', img: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&auto=format&fit=crop&q=80', tag: 'Binaural Beats', studioRoute: '/audio-studio' },
      { title: isRtl ? 'إيقاعات شرقية حديثة' : 'Modern Oriental Fusion', genre: isRtl ? 'إيقاعي شرقي' : 'Modern Fusion', duration: '03:20s', img: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=600&auto=format&fit=crop&q=80', tag: 'Mastered Studio', studioRoute: '/audio-studio' },
    ],
    [isRtl]
  );

  const appStudioRow1 = useMemo(
    () => [
      { title: isRtl ? 'منصة التجارة الإلكترونية الذكية' : 'Neural E-Commerce Platform', desc: 'React, Vite, Tailwind & Stripe Checkout Integration', tag: 'Full-Stack 0.8s', img: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=600&auto=format&fit=crop&q=80', studioRoute: '/app' },
      { title: isRtl ? 'لوحة تحكم SaaS المتقدمة' : 'Advanced SaaS Analytics Dashboard', desc: 'Real-time telemetry, charts & PostgreSQL dual schema', tag: 'Enterprise Ready', img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80', studioRoute: '/app' },
      { title: isRtl ? 'منظومة إدارة الذكاء الاصطناعي' : 'AI Orchestrator Portal', desc: 'Multi-model fallback routing & silent failover gateway', tag: 'Zero-Latency', img: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80', studioRoute: '/app' },
    ],
    [isRtl]
  );

  const appStudioRow2 = useMemo(
    () => [
      { title: isRtl ? 'تطبيق إدارة المشاريع الرشيق' : 'Agile Project Management Suite', desc: 'Kanban boards, real-time collaboration & RBAC roles', tag: 'Multi-Role Security', img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=80', studioRoute: '/app' },
      { title: isRtl ? 'بوابة الرعاية الصحية والعيادات' : 'Healthcare Telehealth Portal', desc: 'Encrypted patient records, HIPAA compliant workflows', tag: 'Encrypted Vault', img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80', studioRoute: '/app' },
      { title: isRtl ? 'منصة التعليم عن بعد التفاعلية' : 'Interactive E-Learning LMS', desc: 'Video streaming, quizzes & automated progress grading', tag: 'PWA Offline Ready', img: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600&auto=format&fit=crop&q=80', studioRoute: '/app' },
    ],
    [isRtl]
  );

  const viralBookRow1 = useMemo(
    () => [
      { title: isRtl ? 'قالب إعلان ترويجي لشركة ناشئة' : 'Startup Growth Ad Campaign Kit', category: 'Viral Marketing', royalty: PLATFORM_COMMERCIAL_CONFIG.AD_USE_ROYALTY, img: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80', studioRoute: '/viralbook' },
      { title: isRtl ? 'حزمة قصص انستغرام وتيك توك' : 'TikTok & Reels Viral Story Pack', category: 'Social Commerce', royalty: PLATFORM_COMMERCIAL_CONFIG.RECURRING_COMMISSION, img: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&auto=format&fit=crop&q=80', studioRoute: '/viralbook' },
      { title: isRtl ? 'تصاميم الهوية التجارية السريعة' : 'Instant Brand Identity Assets', category: 'Branding Kit', royalty: PLATFORM_COMMERCIAL_CONFIG.CREATOR_WELCOME_BONUS, img: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=600&auto=format&fit=crop&q=80', studioRoute: '/viralbook' },
    ],
    [isRtl]
  );

  const viralBookRow2 = useMemo(
    () => [
      { title: isRtl ? 'قوالب البريد التسويقي السريع' : 'High-Conversion Email Blast Kit', category: 'Email Automation', royalty: PLATFORM_COMMERCIAL_CONFIG.AD_USE_ROYALTY, img: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80', studioRoute: '/viralbook' },
      { title: isRtl ? 'حقيبة ترويج التطبيقات البرمجية' : 'App Launch Press & Media Kit', category: 'Product Launch', royalty: PLATFORM_COMMERCIAL_CONFIG.RECURRING_COMMISSION, img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80', studioRoute: '/viralbook' },
      { title: isRtl ? 'استراتيجيات نمو الشركات الناشئة' : 'Growth Hacker Playbook Templates', category: 'SaaS Growth', royalty: PLATFORM_COMMERCIAL_CONFIG.CREATOR_WELCOME_BONUS, img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&auto=format&fit=crop&q=80', studioRoute: '/viralbook' },
    ],
    [isRtl]
  );

  const coreToolsStrip = useMemo(
    () => [
      {
        id: 'fast',
        name: isRtl ? 'الاستجابة اللحظية (Fast)' : 'Ultra-Fast Model',
        category: isRtl ? 'الاستجابة اللحظية الفورية' : 'Ultra-Fast Response',
        desc: isRtl ? 'نموذج التوليد والاستجابة اللحظية بزمن استجابة أقل من 0.08 ثانية للإجابة الفورية والأسئلة اليومية.' : 'Sub-0.08s ultra-fast neural dispatch for quick Q&A and rapid ideation.',
        badge: isRtl ? 'استجابة لحظية' : '< 0.08s',
        icon: <Zap className="size-5 text-amber-500" />,
        route: '/chat?mode=fast',
      },
      {
        id: 'pro',
        name: isRtl ? 'المساعد الإبداعي (Pro)' : 'Pro Creative AI',
        category: isRtl ? 'توليد متعدد الأنماط' : 'Multi-Modal Pro',
        desc: isRtl ? 'أعلى المستويات التوليدية لبناء المشروعات المعقدة والتصاميم الهندسية والأكواد الضخمة.' : 'Enterprise multi-modal model engineered for complex full-stack web apps and assets.',
        badge: isRtl ? 'جودة فائقة' : 'Ultra Quality',
        icon: <Sparkles className="size-5 text-indigo-500" />,
        route: '/chat?mode=pro',
      },
      {
        id: 'reasoning',
        name: isRtl ? 'التفكير والتنظير العميق' : 'Deep Reasoning',
        category: isRtl ? 'تحليل منطقي ورياضي' : 'Deep Logical Reasoning',
        desc: isRtl ? 'محرك التفكير متعدد الخطوات، يفكك المسائل المعقدة ويصيغ خوارزميات الاستنتاج بدقة متناهية.' : 'Deep multi-step reasoning model that analyzes mathematical proofs and algorithm invariants.',
        badge: isRtl ? 'تفكير عميق' : 'Multi-step Logic',
        icon: <Cpu className="size-5 text-purple-500" />,
        route: '/chat?mode=reasoning',
      },
      {
        id: 'search',
        name: isRtl ? 'البحث الحي وتحليل الويب' : 'Live Web Grounding',
        category: isRtl ? 'ربط سحابي بالويب' : 'Real-time Web Search',
        desc: isRtl ? 'البحث الحي المباشر في الويب مع تحليل المستندات الضخمة واستخراج كشوف الحقائق الموثقة.' : 'Live web grounding and large document ingestion with traceable citations.',
        badge: isRtl ? 'بحث حي' : 'NEW',
        icon: <Search className="size-5 text-emerald-500" />,
        route: '/chat?mode=search',
      },
      {
        id: 'ads',
        name: isRtl ? 'مساعد الإعلانات والحملات' : 'Ads Copilot',
        category: isRtl ? 'حملات وتسويق' : 'Marketing & Ad Campaigns',
        desc: isRtl ? 'صياغة نصوص الحملات الإعلانية عالية التحويل وزيادة معدل النقر والوصول للعملاء المستهدفين.' : 'High-converting ad copy synthesis, ViralBook sponsored post builder, and conversion hooks.',
        badge: isRtl ? 'تسويق ذكي' : 'Viral Growth',
        icon: <Megaphone className="size-5 text-amber-500" />,
        route: '/viralbook?tab=ads',
      },
      {
        id: 'academic',
        name: isRtl ? 'المساعد الأكاديمي والبحوث' : 'Academic Vault',
        category: isRtl ? 'توثيق وأوراق بحثية' : 'Scholarly Literature',
        desc: isRtl ? 'قراءة وتلخيص المراجع العلمية، صياغة الفرضيات، وتنسيق الاقتباسات آلياً وفق معايير التوثيق الشاملة.' : 'Deep scholarly paper digestion, research hypothesis generation, and automatic citation formatting.',
        badge: isRtl ? 'توثيق علمي' : 'APA & IEEE',
        icon: <BookOpen className="size-5 text-teal-500" />,
        route: '/chat?mode=academic',
      },
    ],
    [isRtl]
  );

  // --- FAQs Data (10 Comprehensive Features - Two Columns) ---
  const faqs = useMemo(
    () => [
      {
        icon: Terminal,
        title: isRtl ? 'ما الذي يميز استوديو البرمجة عن أدوات الذكاء التقليدية؟' : 'How does Perplexta Code Studio differ from traditional bots?',
        content: isRtl
          ? 'يقوم الاستوديو بهندسة وتوليد تطبيقات ومواقع برمجية متكاملة بملفات حقيقية وليست مجرد مقتطفات نصية، مع ربط الواجهات بالخلفية والمعاينة الحية والتصدير بنقرة واحدة كملف ZIP.'
          : 'Perplexta generates complete production-grade applications, not just code snippets. It builds full directory trees, links backends, provides live previews, and offers 1-click ZIP export.',
      },
      {
        icon: ShieldCheck,
        title: isRtl ? 'كيف تضمن المنصة الأمان المشفر وعزل البيانات التام؟' : 'How does the platform ensure enterprise data security and encryption?',
        content: isRtl
          ? 'نعتمد بنية الفصل التام لقواعد البيانات (Dual-Database)، حيث تعزل البيانات التشغيلية عن السجلات المالية، مع تشفير محلي قياسي AES-256 للمفاتيح دون أي أدوات تتبع خارجية.'
          : 'We enforce strict database segregation separating operational data from financial ledgers, alongside AES-256 local encrypted execution without third-party tracking.',
      },
      {
        icon: GraduationCap,
        title: isRtl ? 'كيف يدعم المساعد الأكاديمي الباحثين وطلبة الدراسات العليا؟' : 'How does the Academic Assistant empower scholarly research?',
        content: isRtl
          ? 'يحلل ويقارن مئات الدراسات السابقة في دقائق، يصيغ الفرضيات، ويقوم بتدقيق وتنسيق المراجع والاقتباسات تلقائياً وفق أدق المعايير العالمية المعتمدة مثل APA وHarvard وIEEE.'
          : 'It analyzes and synthesizes scholarly literature in minutes, formulates hypotheses, and auto-formats citations to exact APA, Harvard, and IEEE standards.',
      },
      {
        icon: ImageIcon,
        title: isRtl ? 'ما هي مميزات استوديو التصميم وتوليد الصور بالطبقات المتجهة؟' : 'What are the capabilities of the Vector Layer Design Studio?',
        content: isRtl
          ? 'كانفاس تفاعلي لا محدود يدعم تحرير وتوليد الصور بالذكاء الاصطناعي، والتحكم بالطبقات، وتعديل النصوص والأشكال في نفس الموضع مباشرة، وتصدير التصاميم بأعلى دقة WebP وPNG.'
          : 'An unbounded canvas featuring AI generation, layer management, in-place text manipulation directly on the canvas, and crisp WebP/PNG export with template reuse.',
      },
      {
        icon: Wallet,
        title: isRtl ? 'ما هي المحفظة المالية المشفرة وكيف يعمل دفتر الأستاذ المالي؟' : 'What is the Encrypted Financial Vault and Append-Only Ledger?',
        content: isRtl
          ? 'محفظة مالية مشفرة ومحمية تسجل كل عملية كقيد مالي موثق لا يقبل الحذف أو التعديل، وتتيح للمستخدمين والمبدعين سحب أرباحهم فورياً إلى الحسابات البنكية والمحافظ الرقمية.'
          : 'An encrypted financial vault powered by an append-only ledger protocol. Every transaction is immutably logged, enabling instant withdrawals to bank accounts and digital wallets.',
      },
      {
        icon: Users,
        title: isRtl ? 'كيف يعمل نظام أرباح الإحالات وما هي نسب العمولات النقدية؟' : 'How does the Referral Tree work and what is the royalty rate?',
        content: isRtl
          ? 'يحصل كل مستخدم على رابط إحالة مشفر؛ وعند اشتراك أي شخص عبره، يحصل الداعي على عمولة نقدية متكررة بنسبة 20% مدى الحياة عن كل تجديد، بينما يحصل المدعو على خصم فوري 15%.'
          : 'Every member receives a personalized referral link. You earn a lifelong 20% recurring cash commission on every plan renewal your invitee completes, while they get an instant 15% discount.',
      },
      {
        icon: Sparkles,
        title: isRtl ? 'كيف يربح صناع المحتوى من تصاميم الاستوديو وبونص المبدعين؟' : 'How do creators earn template royalties and the welcome bonus?',
        content: isRtl
          ? 'فور اعتماد ملفك كمبدع في المنصة، تحصل على مكافأة ترحيبية فورية قدرها $50 في محفظتك، بالإضافة لعائد نقدي ثابت قدره $0.70 عن كل مرة يقوم فيها أي مستخدم باستخدام وتصدير قوالبك.'
          : 'Once verified as a creator, an instant $50 welcome bonus is deposited into your vault, and you earn an automated $0.70 cash royalty each time another user uses or exports your template.',
      },
      {
        icon: Megaphone,
        title: isRtl ? 'ما هي شبكة فيرال بوك وكيف تدعم نمو الأنشطة التجارية؟' : 'What is ViralBook and how does it drive commercial growth?',
        content: isRtl
          ? 'شبكة نشر وتسويق رقمي مدمجة، تتيح نشر المحتوى، والترويج للمنتجات والخدمات، وعرض مقاطع الريلز، وإطلاق حملات إعلانية مدعومة بالذكاء الاصطناعي مع تحويل مباشر عبر واتساب.'
          : 'An integrated social & commercial hub uniting rich publishing, fast reels, business discovery, and AI-boosted ad campaigns with direct conversion hooks to WhatsApp.',
      },
      {
        icon: Mic,
        title: isRtl ? 'هل تدعم المنصة التفاعل بالأوامر الصوتية وتحليل الملفات الكبيرة؟' : 'Does the platform support live voice mode and 100MB files?',
        content: isRtl
          ? 'نعم، تتضمن المنصة محرك تفاعل صوتي حي فائق السرعة، ومعالجة للملفات والوسائط حتى 100 ميجابايت (PDF، مستندات برمجية، صور، وفيديوهات)، مع استخلاص ذكي وتحليل شامل.'
          : 'Yes, featuring an ultra-fast live voice interaction engine and multi-modal file ingestion up to 100MB (PDFs, code repositories, high-res images, and video reels) with deep analysis.',
      },
      {
        icon: Coins,
        title: isRtl ? 'كيف تعمل خطط الاشتراك وهل تتزامن حصص التوليد تلقائياً؟' : 'How do pricing plans work and are credit quotas live-synced?',
        content: isRtl
          ? 'ترتبط صفحة الأسعار بقاعدة البيانات المركزية لحظياً؛ أي تعديل على الباقات أو الأسعار أو حصص الكريديت من لوحة التحكم يظهر فوراً للمستخدمين، مع ترقية فورية بنقرة واحدة.'
          : 'The pricing section syncs live with central database APIs in real time. Any plan addition, pricing update, or credit adjustment by admins appears instantly, with zero-friction upgrades.',
      },
    ],
    [isRtl]
  );

  return (
    <div className="min-h-screen bg-[var(--surface-page)] text-[var(--text-primary)] font-sans antialiased selection:bg-[var(--fg-accent)] selection:text-white">
      {/* =========================================================================
          1. FLOATING PILL NAVBAR (Exact ChatDeck Structure & Perplexta M3 Tokens)
          ========================================================================= */}
      {createPortal(
        <nav
          data-state={menuState && 'active'}
          className={`fixed top-0 left-0 right-0 z-[99999] w-full bg-[var(--surface-card)]/95 backdrop-blur-xl border-b border-[var(--border-main)] shadow-md transition-all duration-300 ease-in-out ${
            isAuthModalOpen
              ? 'opacity-0 pointer-events-none -translate-y-4 scale-98'
              : 'opacity-100 pointer-events-auto translate-y-0 scale-100'
          }`}
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-12 py-3">
            <div className="relative flex flex-wrap items-center justify-between gap-6 lg:gap-0">
              {/* Brand Logo Zone */}
              <div className="flex w-full justify-between lg:w-auto items-center">
                <Link 
                  to={user ? "/chat" : "/"} 
                  onClick={(e) => {
                    if (!user) {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  aria-label="home" 
                  className="flex items-center gap-2.5 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-shape-sm overflow-hidden border border-[var(--border-default)] flex items-center justify-center bg-[var(--surface-subtle)] transition-transform group-hover:scale-105 shadow-2xs">
                    <Logo size={28} shape="none" showName={false} />
                  </div>
                  <span className="text-lg font-black tracking-tight text-[var(--text-primary)]">
                    {brandName}
                  </span>
                </Link>

              {/* Mobile Menu Toggle */}
                <button
                  type="button"
                  onClick={() => setMenuState(!menuState)}
                  aria-label={menuState ? 'Close Menu' : 'Open Menu'}
                  className="relative z-20 -m-2.5 p-2.5 lg:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  {menuState ? <X className="size-6" /> : <Menu className="size-6" />}
                </button>
              </div>

              {/* Desktop Center Links */}
              <div className="absolute inset-0 m-auto hidden size-fit lg:block">
                <ul className="flex items-center gap-7 text-sm font-bold">
                  {/* Studios Professional Dropdown Menu */}
                  <li 
                    className="relative group"
                    onMouseEnter={() => setIsStudiosNavDropdownOpen(true)}
                    onMouseLeave={() => setIsStudiosNavDropdownOpen(false)}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsStudiosNavDropdownOpen(!isStudiosNavDropdownOpen);
                        setIsToolsNavDropdownOpen(false);
                      }}
                      className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:text-[var(--fg-accent)] transition-colors inline-flex items-center gap-1.5 cursor-pointer py-1.5"
                    >
                      <span>{isRtl ? 'الاستوديوهات' : 'Studios'}</span>
                      <ChevronDown size={14} className={`transition-transform duration-200 ${isStudiosNavDropdownOpen ? 'rotate-180 text-[var(--fg-accent)]' : ''}`} />
                    </button>

                    {/* Glassmorphic Dropdown Menu for Main Studios & Platforms */}
                    <AnimatePresence>
                      {isStudiosNavDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.98 }}
                          transition={{ duration: 0.18, ease: 'easeOut' }}
                          className={`absolute top-full ${isRtl ? 'right-0' : 'left-0'} pt-2 w-[520px] z-[100000]`}
                        >
                          <div className="bg-[var(--surface-card)]/98 backdrop-blur-2xl border border-[var(--border-main)] rounded-shape-md p-3.5 shadow-2xl space-y-2 text-start">
                            <div className="px-2 py-1.5 border-b border-[var(--border-main)]/60 flex items-center justify-between">
                              <span className="text-[11px] font-black uppercase tracking-wider text-[var(--fg-accent)] flex items-center gap-1.5">
                                <Sparkles size={13} />
                                <span>{isRtl ? 'دليل الاستوديوهات والمنصات الرئيسية' : 'Main Studios & Platforms Catalog'}</span>
                              </span>
                              <span className="text-[10px] text-[var(--text-muted)] font-medium">
                                {isRtl ? 'انتقال مباشر بضغطة واحدة' : 'Direct 1-Click Launch'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              {/* Group 1: استوديوهات الإبداع والتطوير */}
                              <div className="space-y-1">
                                <div className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] px-1.5 py-1">
                                  {isRtl ? '🎨 استوديوهات الإبداع والتطوير' : '🎨 Creative & Dev Studios'}
                                </div>
                                {[
                                  {
                                    titleAr: 'استوديو تطوير البرمجيات',
                                    titleEn: 'Software Studio',
                                    descAr: 'تطوير وتجميع تطبيقات الويب الكاملة',
                                    descEn: 'Full-stack web app development',
                                    icon: <Code2 className="size-3.5 text-blue-500" />,
                                    route: '/app'
                                  },
                                  {
                                    titleAr: 'استوديو التصميم والموشن (رينكس)',
                                    titleEn: 'Rinex Design & Motion Studio',
                                    descAr: 'محرر طبقات متجهة وتصاميم احترافية',
                                    descEn: 'Vector layer & motion canvas',
                                    icon: <ImageIcon className="size-3.5 text-indigo-500" />,
                                    route: '/image-studio'
                                  },
                                  {
                                    titleAr: 'الإنتاج المرئي والريلز 4K',
                                    titleEn: '4K Video & Reels Studio',
                                    descAr: 'صناعة وإخراج الفيديوهات والريلز',
                                    descEn: 'High-res motion & video reels',
                                    icon: <Tv className="size-3.5 text-purple-500" />,
                                    route: '/image-studio?category=reels'
                                  },
                                  {
                                    titleAr: 'استوديو الهندسة والإنتاج الصوتي',
                                    titleEn: 'Audio Engineering Studio',
                                    descAr: 'تركيب صوتي عصبي 24kHz ومؤثرات',
                                    descEn: 'Neural voice & 24kHz TTS',
                                    icon: <Music className="size-3.5 text-rose-500" />,
                                    route: '/audio-studio'
                                  }
                                ].map((item, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      setIsStudiosNavDropdownOpen(false);
                                      handleNavigateToSection(item.route);
                                    }}
                                    className="w-full p-1.5 rounded-shape-xs hover:bg-[var(--surface-subtle)] text-start transition-colors flex items-start gap-1.5 group/item cursor-pointer border border-transparent hover:border-[var(--border-main)]"
                                  >
                                    <div className="p-1 rounded-shape-xs bg-[var(--surface-subtle)] group-hover/item:bg-[var(--surface-card)] transition-colors shrink-0 mt-0.5">
                                      {item.icon}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-[10.5px] font-bold text-[var(--text-primary)] group-hover/item:text-[var(--fg-accent)] transition-colors truncate">
                                        {isRtl ? item.titleAr : item.titleEn}
                                      </div>
                                      <div className="text-[8.5px] text-[var(--text-muted)] truncate">
                                        {isRtl ? item.descAr : item.descEn}
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>

                              {/* Group 2: المنصات والخدمات */}
                              <div className="space-y-1 border-s border-[var(--border-main)]/40 ps-2">
                                <div className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] px-1.5 py-1">
                                  {isRtl ? '🌐 المنصات والخدمات' : '🌐 Platforms & Ecosystem'}
                                </div>
                                {[
                                  {
                                    titleAr: 'مجتمع وشبكة فيرال بوك',
                                    titleEn: 'ViralBook Community & Hub',
                                    descAr: 'شبكة تفاعلية ومجتمع المبدعين',
                                    descEn: 'Social feed & creator network',
                                    icon: <Users className="size-3.5 text-purple-500" />,
                                    route: '/viralbook'
                                  },
                                  {
                                    titleAr: 'سوق القوالب وعوائد المبدعين',
                                    titleEn: 'Creator Royalties Hub',
                                    descAr: 'عوائد $0.70 وبونص $50 للمصممين',
                                    descEn: '$0.70 royalty & $50 bonus',
                                    icon: <Coins className="size-3.5 text-emerald-500" />,
                                    route: '/creator'
                                  },
                                  {
                                    titleAr: 'بوابة المطورين ومفاتيح API',
                                    titleEn: 'Developer Portal & API Keys',
                                    descAr: 'مفاتيح API وتوجيه النماذج الذكية',
                                    descEn: 'API keys & model orchestration',
                                    icon: <Key className="size-3.5 text-cyan-500" />,
                                    route: '/chat?mode=pro'
                                  },
                                  {
                                    titleAr: 'خطط الاشتراك والباقات',
                                    titleEn: 'Subscription Plans & Tiers',
                                    descAr: 'باقات الأفراد والمطورين والمؤسسات',
                                    descEn: 'Individual, Dev & Enterprise plans',
                                    icon: <CreditCard className="size-3.5 text-emerald-500" />,
                                    route: '/subscription'
                                  }
                                ].map((item, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      setIsStudiosNavDropdownOpen(false);
                                      handleNavigateToSection(item.route);
                                    }}
                                    className="w-full p-1.5 rounded-shape-xs hover:bg-[var(--surface-subtle)] text-start transition-colors flex items-start gap-1.5 group/item cursor-pointer border border-transparent hover:border-[var(--border-main)]"
                                  >
                                    <div className="p-1 rounded-shape-xs bg-[var(--surface-subtle)] group-hover/item:bg-[var(--surface-card)] transition-colors shrink-0 mt-0.5">
                                      {item.icon}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-[10.5px] font-bold text-[var(--text-primary)] group-hover/item:text-[var(--fg-accent)] transition-colors truncate">
                                        {isRtl ? item.titleAr : item.titleEn}
                                      </div>
                                      <div className="text-[8.5px] text-[var(--text-muted)] truncate">
                                        {isRtl ? item.descAr : item.descEn}
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>

                  {/* Tools Professional Dropdown Menu (Dedicated Tools List) */}
                  <li 
                    className="relative group"
                    onMouseEnter={() => setIsToolsNavDropdownOpen(true)}
                    onMouseLeave={() => setIsToolsNavDropdownOpen(false)}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsToolsNavDropdownOpen(!isToolsNavDropdownOpen);
                        setIsStudiosNavDropdownOpen(false);
                      }}
                      className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:text-[var(--fg-accent)] transition-colors inline-flex items-center gap-1.5 cursor-pointer py-1.5"
                    >
                      <span>{isRtl ? 'الأدوات' : 'Tools'}</span>
                      <ChevronDown size={14} className={`transition-transform duration-200 ${isToolsNavDropdownOpen ? 'rotate-180 text-[var(--fg-accent)]' : ''}`} />
                    </button>

                    {/* Glassmorphic Dropdown Menu for AI Tools & Assistants */}
                    <AnimatePresence>
                      {isToolsNavDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.98 }}
                          transition={{ duration: 0.18, ease: 'easeOut' }}
                          className={`absolute top-full ${isRtl ? 'right-0' : 'left-0'} pt-2 w-[520px] z-[100000]`}
                        >
                          <div className="bg-[var(--surface-card)]/98 backdrop-blur-2xl border border-[var(--border-main)] rounded-shape-md p-3.5 shadow-2xl space-y-2 text-start">
                            <div className="px-2 py-1.5 border-b border-[var(--border-main)]/60 flex items-center justify-between">
                              <span className="text-[11px] font-black uppercase tracking-wider text-[var(--fg-accent)] flex items-center gap-1.5">
                                <Zap size={13} />
                                <span>{isRtl ? 'دليل أدوات الذكاء والمساعدين المتقدمة' : 'AI Tools & Assistants Vault'}</span>
                              </span>
                              <button 
                                type="button"
                                onClick={(e) => handleLivePreviewClick(e)}
                                className="text-[10px] text-[var(--fg-accent)] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <span>{isRtl ? 'معاينة الأدوات الحية' : 'Live Tools Preview'}</span>
                                <ArrowRight size={10} className={isRtl ? 'rotate-180' : ''} />
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              {/* Group 1: محركات الذكاء والتفكير */}
                              <div className="space-y-1">
                                <div className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] px-1.5 py-1">
                                  {isRtl ? '🧠 محركات الذكاء والتفكير' : '🧠 AI Models & Logic'}
                                </div>
                                {[
                                  {
                                    titleAr: 'الاستجابة اللحظية (Fast)',
                                    titleEn: 'Ultra-Fast Model',
                                    descAr: 'استجابة سريعة أقل من 0.08ث',
                                    descEn: '< 0.08s rapid response',
                                    icon: <Zap className="size-3.5 text-amber-500" />,
                                    route: '/chat?mode=fast'
                                  },
                                  {
                                    titleAr: 'التفكير والتنظير العميق',
                                    titleEn: 'Deep Reasoning',
                                    descAr: 'استنتاج منطقي ورياضي معقد',
                                    descEn: 'Multi-step logical chain',
                                    icon: <Cpu className="size-3.5 text-purple-500" />,
                                    route: '/chat?mode=reasoning'
                                  },
                                  {
                                    titleAr: 'المساعد الإبداعي (Pro)',
                                    titleEn: 'Pro Creative AI',
                                    descAr: 'نماذج متعددة الأنماط عالية الجودة',
                                    descEn: 'Ultra-high quality multi-modal',
                                    icon: <Sparkles className="size-3.5 text-indigo-500" />,
                                    route: '/chat?mode=pro'
                                  }
                                ].map((item, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      setIsToolsNavDropdownOpen(false);
                                      handleNavigateToSection(item.route);
                                    }}
                                    className="w-full p-1.5 rounded-shape-xs hover:bg-[var(--surface-subtle)] text-start transition-colors flex items-start gap-1.5 group/item cursor-pointer border border-transparent hover:border-[var(--border-main)]"
                                  >
                                    <div className="p-1 rounded-shape-xs bg-[var(--surface-subtle)] group-hover/item:bg-[var(--surface-card)] transition-colors shrink-0 mt-0.5">
                                      {item.icon}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-[10.5px] font-bold text-[var(--text-primary)] group-hover/item:text-[var(--fg-accent)] transition-colors truncate">
                                        {isRtl ? item.titleAr : item.titleEn}
                                      </div>
                                      <div className="text-[8.5px] text-[var(--text-muted)] truncate">
                                        {isRtl ? item.descAr : item.descEn}
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>

                              {/* Group 2: البحث والتسويق التخصصي */}
                              <div className="space-y-1 border-s border-[var(--border-main)]/40 ps-2">
                                <div className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] px-1.5 py-1">
                                  {isRtl ? '📚 البحث والتسويق التخصصي' : '📚 Research & Ad Tools'}
                                </div>
                                {[
                                  {
                                    titleAr: 'البحث الحي وتحليل الويب',
                                    titleEn: 'Live Web Grounding',
                                    descAr: 'ربط مباشر بالويب وتدقيق المصادر',
                                    descEn: 'Live web & fact checking',
                                    icon: <Search className="size-3.5 text-emerald-500" />,
                                    route: '/chat?mode=search'
                                  },
                                  {
                                    titleAr: 'المساعد الأكاديمي والعلمي',
                                    titleEn: 'Academic Vault',
                                    descAr: 'تحليل أوراق وتوثيق APA/IEEE',
                                    descEn: 'Paper ingestion & APA format',
                                    icon: <BookOpen className="size-3.5 text-teal-500" />,
                                    route: '/chat?mode=academic'
                                  },
                                  {
                                    titleAr: 'مساعد الإعلانات والحملات',
                                    titleEn: 'Ads Copilot',
                                    descAr: 'صياغة إعلانات وحملات تحويل',
                                    descEn: 'High-converting ad builder',
                                    icon: <Megaphone className="size-3.5 text-amber-500" />,
                                    route: '/viralbook?tab=ads'
                                  }
                                ].map((item, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      setIsToolsNavDropdownOpen(false);
                                      handleNavigateToSection(item.route);
                                    }}
                                    className="w-full p-1.5 rounded-shape-xs hover:bg-[var(--surface-subtle)] text-start transition-colors flex items-start gap-1.5 group/item cursor-pointer border border-transparent hover:border-[var(--border-main)]"
                                  >
                                    <div className="p-1 rounded-shape-xs bg-[var(--surface-subtle)] group-hover/item:bg-[var(--surface-card)] transition-colors shrink-0 mt-0.5">
                                      {item.icon}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-[10.5px] font-bold text-[var(--text-primary)] group-hover/item:text-[var(--fg-accent)] transition-colors truncate">
                                        {isRtl ? item.titleAr : item.titleEn}
                                      </div>
                                      <div className="text-[8.5px] text-[var(--text-muted)] truncate">
                                        {isRtl ? item.descAr : item.descEn}
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>

                  {/* Features Link */}
                  <li>
                    <a href="#features" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:text-[var(--fg-accent)] transition-colors">
                      {isRtl ? 'المميزات' : 'Features'}
                    </a>
                  </li>
                  <li>
                    <a href="#comparison" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:text-[var(--fg-accent)] transition-colors">
                      {isRtl ? 'مؤشرات الأداء' : 'Performance'}
                    </a>
                  </li>

                  <li>
                    <a href="#pricing" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:text-[var(--fg-accent)] transition-colors">
                      {isRtl ? 'الأسعار' : 'Pricing'}
                    </a>
                  </li>
                  <li>
                    <a href="#faq" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:text-[var(--fg-accent)] transition-colors">
                      {isRtl ? 'الأسئلة' : 'FAQ'}
                    </a>
                  </li>
                </ul>
              </div>

              {/* Right Action Controls */}
              <div className="hidden lg:flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setLanguage(isRtl ? 'en' : 'ar')}
                  className="px-3.5 py-1.5 min-h-[36px] rounded-[var(--comp-button-radius,8px)] text-xs font-bold border border-[var(--border-main)] hover:border-[var(--border-accent)] hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] transition-colors cursor-pointer flex items-center justify-center"
                  title={isRtl ? 'Switch to English' : 'التحويل للعربية'}
                >
                  {isRtl ? 'EN' : 'عربي'}
                </button>
                <ThemeToggleButton variant="icon-button" size="sm" />
                <button
                  type="button"
                  onClick={handleStartNow}
                  className="rounded-[var(--comp-button-radius,8px)] min-h-[36px] px-4 py-1.5 text-xs font-black uppercase tracking-wider bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] hover:opacity-90 transition-all active:scale-95 cursor-pointer shadow-sm flex items-center justify-center"
                >
                  <span>{isRtl ? 'ابدأ الآن' : 'Get Started'}</span>
                </button>
              </div>

              {/* Mobile Dropdown Panel */}
              <AnimatePresence>
                {menuState && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full bg-[var(--surface-card)] rounded-shape-lg border border-[var(--border-main)] p-5 shadow-2xl space-y-5 lg:hidden mt-4 max-h-[82vh] overflow-y-auto"
                  >
                    {/* Studios Quick Grid in Mobile Menu */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-black uppercase tracking-wider text-[var(--fg-accent)]">
                        {isRtl ? '🎨 الاستوديوهات والمنصات' : '🎨 Studios & Platforms'}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { labelAr: 'استوديو البرمجيات (IDE)', labelEn: 'Software IDE', route: '/app' },
                          { labelAr: 'استوديو رينكس للموشن', labelEn: 'Rinex Studio', route: '/image-studio' },
                          { labelAr: 'استوديو الهندسة الصوتية', labelEn: 'Audio Studio', route: '/audio-studio' },
                          { labelAr: 'مجتمع فيرال بوك', labelEn: 'ViralBook Hub', route: '/viralbook' },
                          { labelAr: 'سوق القوالب والعوائد', labelEn: 'Creator Hub', route: '/creator' },
                          { labelAr: 'خطط الاشتراك والباقات', labelEn: 'Plans & Tiers', route: '/subscription' },
                        ].map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setMenuState(false);
                              handleNavigateToSection(item.route);
                            }}
                            className="p-2 rounded-shape-xs bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-main)] text-start text-xs font-bold text-[var(--text-primary)] truncate cursor-pointer"
                          >
                            {isRtl ? item.labelAr : item.labelEn}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tools Quick Grid in Mobile Menu */}
                    <div className="space-y-2 pt-2 border-t border-[var(--border-main)]">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-[var(--fg-accent)]">
                          {isRtl ? '🛠️ الأدوات والمساعدين' : '🛠️ AI Tools & Assistants'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            setMenuState(false);
                            handleLivePreviewClick(e);
                          }}
                          className="text-[11px] font-bold text-[var(--fg-accent)] hover:underline cursor-pointer"
                        >
                          {isRtl ? 'معاينة الأدوات الحية ←' : 'Live Tools Preview →'}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { labelAr: 'الاستجابة اللحظية (Fast)', labelEn: 'Ultra-Fast AI', route: '/chat?mode=fast' },
                          { labelAr: 'التفكير العميق', labelEn: 'Deep Reasoning', route: '/chat?mode=reasoning' },
                          { labelAr: 'المساعد الإبداعي (Pro)', labelEn: 'Pro Creative AI', route: '/chat?mode=pro' },
                          { labelAr: 'البحث الحي للويب', labelEn: 'Live Web Search', route: '/chat?mode=search' },
                          { labelAr: 'المساعد الأكاديمي', labelEn: 'Academic Vault', route: '/chat?mode=academic' },
                          { labelAr: 'مساعد الإعلانات', labelEn: 'Ads Copilot', route: '/viralbook?tab=ads' },
                        ].map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setMenuState(false);
                              handleNavigateToSection(item.route);
                            }}
                            className="p-2 rounded-shape-xs bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-main)] text-start text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] truncate cursor-pointer"
                          >
                            {isRtl ? item.labelAr : item.labelEn}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Page Section Anchors */}
                    <ul className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[var(--border-main)] text-xs font-bold">
                      <li>
                        <a href="#features" onClick={() => setMenuState(false)} className="block py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                          {isRtl ? 'المميزات' : 'Features'}
                        </a>
                      </li>
                      <li>
                        <a href="#comparison" onClick={() => setMenuState(false)} className="block py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                          {isRtl ? 'مؤشرات الأداء' : 'Performance'}
                        </a>
                      </li>
                      <li>
                        <a href="#pricing" onClick={() => setMenuState(false)} className="block py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                          {isRtl ? 'الأسعار' : 'Pricing'}
                        </a>
                      </li>
                      <li>
                        <a href="#testimonials" onClick={() => setMenuState(false)} className="block py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                          {isRtl ? 'تقييمات المختصين' : 'Testimonials'}
                        </a>
                      </li>
                      <li>
                        <a href="#refund-policy" onClick={() => setMenuState(false)} className="block py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                          {isRtl ? 'الضمان والاسترداد' : 'Refund Policy'}
                        </a>
                      </li>
                      <li>
                        <a href="#faq" onClick={() => setMenuState(false)} className="block py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                          {isRtl ? 'الأسئلة الشائعة' : 'FAQ'}
                        </a>
                      </li>
                    </ul>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-[var(--border-main)] gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setLanguage(isRtl ? 'en' : 'ar');
                            setMenuState(false);
                          }}
                          className="px-4 py-2 min-h-[44px] rounded-shape-md text-xs font-bold border border-[var(--border-main)] hover:border-[var(--border-accent)] text-[var(--text-secondary)] cursor-pointer flex items-center justify-center transition-all active:scale-95 flex-1 sm:flex-none"
                        >
                          {isRtl ? 'English' : 'العربية'}
                        </button>
                        <ThemeToggleButton variant="icon-button" size="sm" />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuState(false);
                          handleStartNow();
                        }}
                        className="rounded-shape-md min-h-[44px] px-6 py-2.5 text-xs font-black uppercase tracking-wider bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] hover:opacity-90 transition-all cursor-pointer shadow-md flex items-center justify-center active:scale-95 w-full sm:w-auto"
                      >
                        {isRtl ? 'ابدأ الآن' : 'Get Started'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </nav>,
        document.body
      )}

      {/* =========================================================================
          MAIN CONTAINER (Exact ChatDeck Padding & Centering: pt-36 max-w-7xl)
          ========================================================================= */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-32 sm:pt-40">
        {/* =========================================================================
            2. HERO SECTION (Corporate High-Tech Ambient Backdrop & Concise Copy)
            ========================================================================= */}
        <div className="relative">
          {/* Hero Content Box with High-Tech Ambient Background Image Backdrop */}
          <div className="relative rounded-shape-lg overflow-hidden p-6 sm:p-10 lg:p-12 border border-[var(--border-main)]/60 shadow-xl mb-10 bg-[var(--surface-card)]/85 backdrop-blur-md">
            {/* High-Performance High-Tech Ambient Grid Backdrop (Zero External Network Overhead) */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--surface-subtle)] via-[var(--surface-card)] to-[var(--surface-subtle)] opacity-80 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
            {/* Radial Glow & Gradient Overlay Masks */}
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--surface-page)]/40 via-[var(--surface-page)]/80 to-[var(--surface-page)] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[300px] bg-[var(--fg-accent)]/15 rounded-full blur-[110px] pointer-events-none" />

            <div className="relative z-10">
              {/* Corporate Top Kicker Badge - Instant Paint */}
              <div className="flex items-center justify-center">
                <div className="inline-flex items-center gap-2 h-7 px-3.5 rounded-shape-sm bg-[var(--surface-card)]/90 border border-[var(--border-main)] text-[11px] font-bold leading-none text-[var(--text-secondary)] shadow-2xs backdrop-blur-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--fg-accent)] animate-pulse shrink-0" />
                  <span>
                    {isRtl
                      ? 'منظومة الذكاء الاصطناعي والحوسبة المتقدمة للمؤسسات'
                      : 'Enterprise AI & Advanced Computing Infrastructure'}
                  </span>
                </div>
              </div>

              {/* Hero Typography - Instant LCP Paint (No Animation Delay) */}
              <div className="text-center mt-4 max-w-5xl mx-auto">
                <h1 className="text-2xl sm:text-4xl lg:text-[42px] xl:text-[46px] font-black tracking-tight text-[var(--text-primary)] leading-[1.22] text-balance">
                  {isRtl ? (
                    <>
                      <span className="block sm:whitespace-nowrap">
                        بيئة عمل متكاملة لتطوير البرمجيات
                      </span>
                      <span className="block sm:whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-[var(--fg-accent)] via-blue-500 to-indigo-500 mt-1">
                        والإنتاج الرقمي متعدد الأنماط
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="block sm:whitespace-nowrap">
                        Unified Ecosystem for Software Engineering
                      </span>
                      <span className="block sm:whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-[var(--fg-accent)] via-blue-500 to-indigo-500 mt-1">
                        & Multimodal Digital Production
                      </span>
                    </>
                  )}
                </h1>

                <p className="mt-3.5 text-xs sm:text-sm lg:text-[15px] leading-relaxed text-[var(--text-secondary)] max-w-3xl mx-auto font-medium text-balance">
                  {isRtl
                    ? 'منصة هندسية متكاملة تجمع تطوير البرمجيات، تصميم الطبقات المتجهة، التحليل الأكاديمي، ومعالجة الوسائط.'
                    : 'An integrated engineering platform uniting software development, vector layer design, academic analysis, and media compute.'}
                </p>
              </div>

              {/* Action CTAs Buttons - Unified 40px Perplexta Standard */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 px-4 sm:px-0">
                <ShimmerButton onClick={handleStartNow} className="w-full sm:w-auto h-10 px-6 rounded-shape-sm">
                  <span className="text-xs font-bold leading-none">{isRtl ? 'البدء في استخدام المنصة' : 'Get Started Now'}</span>
                  <ArrowRight size={15} className={isRtl ? 'rotate-180 stroke-[2.5] shrink-0' : 'stroke-[2.5] shrink-0'} />
                </ShimmerButton>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('modular-showcase');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="relative h-10 px-6 rounded-shape-sm bg-[var(--surface-card)]/90 hover:bg-[var(--surface-subtle)] text-[var(--text-primary)] border border-[var(--border-main)] hover:border-[var(--border-accent)] font-bold text-xs leading-none inline-flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-2xs backdrop-blur-md w-full sm:w-auto before:absolute before:-inset-1 before:content-['']"
                >
                  <LayoutGrid size={15} className="text-[var(--fg-accent)] shrink-0" />
                  <span>{isRtl ? 'استعراض الحلول والقدرات' : 'Explore Solutions'}</span>
                </button>
              </div>

              {/* Compact Audience Persona Path Switcher */}
              <div className="mt-7 flex justify-center">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 p-1 rounded-shape-md bg-[var(--surface-subtle)]/70 border border-[var(--border-main)] backdrop-blur-xl w-full max-w-2xl">
                  {[
                    { id: 'developers', studioTab: 'apps', icon: <Code2 size={15} />, labelAr: 'مسار المطورين والمهندسين', labelEn: 'Engineers & Developers' },
                    { id: 'creators', studioTab: 'motion', icon: <Sparkles size={15} />, labelAr: 'مسار المبدعين وصناع المحتوى', labelEn: 'Creators & Designers' },
                    { id: 'enterprises', studioTab: 'video', icon: <Cpu size={15} />, labelAr: 'مسار المؤسسات والباحثين', labelEn: 'Enterprise & Researchers' },
                  ].map((path) => (
                    <button
                      key={path.id}
                      type="button"
                      onClick={() => {
                        setSelectedPersonaPath(path.id as any);
                        setSelectedModularStudioTab(path.studioTab as any);
                        const el = document.getElementById('modular-showcase');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`relative h-9 px-3.5 rounded-shape-sm text-xs font-bold leading-none inline-flex items-center justify-center gap-2 transition-all cursor-pointer before:absolute before:-inset-1 before:content-[''] ${
                        selectedPersonaPath === path.id
                          ? 'bg-[var(--surface-card)] text-[var(--fg-accent)] shadow-2xs border border-[var(--border-accent)]/30'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card)]/40 border border-transparent'
                      }`}
                    >
                      <span className={`shrink-0 flex items-center ${selectedPersonaPath === path.id ? 'text-[var(--fg-accent)]' : 'text-[var(--text-muted)]'}`}>
                        {path.icon}
                      </span>
                      <span className="whitespace-nowrap">{isRtl ? path.labelAr : path.labelEn}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Certified AI Ecosystem Marquee Strip */}
          <motion.div className="mb-14 text-center max-w-5xl mx-auto" variants={fadeUpVariants}>
            <div className="rounded-shape-lg bg-[var(--surface-card)]/60 border border-[var(--border-main)]/60 p-4 sm:p-5 overflow-hidden shadow-xs relative backdrop-blur-md">
              <p className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3">
                {isRtl ? 'محركات الحوسبة والشراكات التكنولوجية المدعومة' : 'Supported AI Engines & Technology Partnerships'}
              </p>
              
              {/* Mobile Balanced Grid View (Point 3) */}
              <div className="grid grid-cols-2 sm:hidden gap-2 pt-1">
                {aiEcosystemPartners.map((partner, index) => (
                  <div
                    key={`mobile-partner-${index}`}
                    className="flex items-center gap-2 p-2 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-main)] shadow-2xs"
                  >
                    <div className="w-6 h-6 rounded-shape-xs flex items-center justify-center text-white shrink-0 shadow-2xs" style={{ backgroundColor: partner.color }}>
                      {getPartnerIcon(partner.name)}
                    </div>
                    <div className="text-start min-w-0 flex-1">
                      <div className="text-[11px] font-black text-[var(--text-primary)] truncate">
                        {partner.name}
                      </div>
                      <div className="text-[9px] text-[var(--text-muted)] truncate">
                        {partner.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop / Smooth Auto-Scroll Marquee with Pause on Touch/Hover (Point 3) */}
              <div className="hidden sm:block relative overflow-hidden group" dir={isRtl ? 'rtl' : 'ltr'}>
                {/* Gradient Fade Masks */}
                <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-[var(--surface-card)] via-[var(--surface-card)]/80 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-[var(--surface-card)] via-[var(--surface-card)]/80 to-transparent z-10 pointer-events-none" />

                <div className="animate-logo-scroll group-hover:[animation-play-state:paused] group-active:[animation-play-state:paused] flex items-center gap-3 sm:gap-4 w-max">
                  {[...aiEcosystemPartners, ...aiEcosystemPartners, ...aiEcosystemPartners].map((partner, index) => (
                    <div
                      key={`hero-partner-${index}`}
                      className="shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-main)] hover:border-[var(--border-accent)] transition-all duration-300 shadow-2xs select-none group/item cursor-default"
                    >
                      <div className="w-7 h-7 rounded-shape-xs flex items-center justify-center text-white shrink-0 shadow-2xs" style={{ backgroundColor: partner.color }}>
                        {getPartnerIcon(partner.name)}
                      </div>
                      <div className="text-start dir-ltr">
                        <div className="text-xs font-black text-[var(--text-primary)] group-hover/item:text-[var(--fg-accent)] transition-colors whitespace-nowrap">
                          {partner.name}
                        </div>
                        <div className="text-[10px] font-medium text-[var(--text-muted)] whitespace-nowrap">
                          {partner.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Hero Video Showcase Frame - Seamless Integrated Video Player */}
          <motion.div id="sandbox" ref={videoFrameRef} className="relative max-w-5xl mx-auto" variants={scaleInVariants}>
            <div className="relative aspect-[16/9] w-full rounded-shape-lg overflow-hidden bg-black shadow-2xl flex items-center justify-center group border border-white/5">
              {activeVideoSourceType === 'youtube' && activeYoutubeUrl ? (
                extractYouTubeId(activeYoutubeUrl) ? (
                  <iframe
                    key={`hero-yt-${isRtl ? 'ar' : 'en'}-${extractYouTubeId(activeYoutubeUrl)}`}
                    src={getYouTubeEmbedUrl(activeYoutubeUrl, heroVideoConfig.autoplay ?? true) || ''}
                    title={isRtl ? (heroVideoConfig.titleAr || 'جولة سريعة داخل منظومة بيربليكستا') : (heroVideoConfig.titleEn || 'Quick Tour Inside Perplexta Ecosystem')}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <div className="p-8 text-center text-amber-400 flex flex-col items-center gap-2">
                    <AlertCircle size={28} />
                    <span className="text-sm font-bold">{isRtl ? 'رابط يوتيوب غير صالح' : 'Invalid YouTube link'}</span>
                  </div>
                )
              ) : (
                <video
                  ref={videoRef}
                  key={`hero-vid-${isRtl ? 'ar' : 'en'}-${activeVideoUrl || '/videos/hero_showcase.mp4'}`}
                  src={activeVideoUrl || '/videos/hero_showcase.mp4'}
                  poster={activePosterUrl || undefined}
                  autoPlay
                  muted={heroVideoConfig.muted ?? true}
                  loop={heroVideoConfig.loop ?? true}
                  controls={heroVideoConfig.controls ?? true}
                  playsInline
                  preload="auto"
                  onError={(e: any) => {
                    const target = e.target as HTMLVideoElement;
                    if (target && target.src !== window.location.origin + '/videos/hero_showcase.mp4') {
                      target.src = '/videos/hero_showcase.mp4';
                      target.load();
                      target.play().catch(() => {});
                    }
                  }}
                  className="w-full h-full object-contain bg-black"
                />
              )}
            </div>
          </motion.div>
        </div>




        {/* =========================================================================
            1.5. CORE TOOLS & CAPABILITIES DUAL MARQUEE STRIP
            ========================================================================= */}
        <section className="pt-12 pb-16 sm:pt-16 sm:pb-24 overflow-hidden relative">
          <div className="text-center mb-10 max-w-4xl mx-auto px-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-shape-xs border border-[var(--border-main)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] text-xs font-bold mb-3.5 shadow-2xs">
              <Cpu size={14} className="text-[var(--fg-accent)]" />
              <span>{isRtl ? 'قدرات المعالجة والحوسبة' : 'Advanced Processing Engines'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-2.5 tracking-tight text-[var(--text-primary)] text-balance">
              {isRtl ? 'محركات معالجة برمجية وتحليلية متخصصة' : 'Specialized Computing & Neural Engines'}
            </h2>
            <p className="text-xs sm:text-sm lg:text-[15px] text-[var(--text-secondary)] font-medium leading-relaxed max-w-3xl mx-auto text-balance">
              {isRtl 
                ? 'نماذج متخصصة للاستجابة الفورية، الاستنتاج المنطقي، تحليل البيانات، والتوثيق الأكاديمي.' 
                : 'High-performance models optimized for fast execution, logical reasoning, data intelligence, and scholarly research.'}
            </p>
          </div>

          <div className="relative w-full overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
            {/* Smooth Edge Fade Masks matching page background */}
            <div className="absolute left-0 top-0 bottom-0 w-28 sm:w-48 bg-gradient-to-r from-[var(--surface-page)] via-[var(--surface-page)]/85 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-28 sm:w-48 bg-gradient-to-l from-[var(--surface-page)] via-[var(--surface-page)]/85 to-transparent z-10 pointer-events-none" />

            {/* Marquee Row - Strict Pyramid Hierarchy (Shortest -> Medium -> Longest) */}
            <div className="flex gap-6 w-max animate-logo-scroll py-2">
              {[...coreToolsStrip, ...coreToolsStrip, ...coreToolsStrip].map((tool, idx) => (
                <div
                  key={`tool-strip-${idx}`}
                  className="w-[310px] sm:w-[360px] p-5 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] shadow-sm flex flex-col justify-between shrink-0 group hover:border-[var(--border-accent)] hover:shadow-md transition-all cursor-pointer text-start"
                  onClick={() => handleNavigateToSection((tool as any).route || '/chat')}
                >
                  {/* Level 1 (Shortest): Icon + Short Kicker Badge at Start */}
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="p-2 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-main)] text-[var(--fg-accent)] group-hover:scale-105 transition-transform shrink-0">
                      {tool.icon}
                    </div>
                    <span className="px-2.5 py-0.5 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-main)] text-[11px] font-sans font-bold text-[var(--fg-accent)]">
                      {tool.badge}
                    </span>
                  </div>
                  {/* Level 2 (Medium): Main Engine Title */}
                  <h3 className="text-sm sm:text-[15px] font-black text-[var(--text-primary)] mb-1.5 leading-snug">
                    {tool.name}
                  </h3>
                  {/* Level 3 (Longest): Balanced 2-Line Description */}
                  <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed line-clamp-2">
                    {tool.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. SPECIALIZED ENGINEERING STUDIOS (Asymmetric Bento-Grid Layout)
            ========================================================================= */}
        <section id="features" className="py-16 sm:py-24">
          <motion.div
            className="text-center mb-12 max-w-4xl mx-auto px-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-main)] text-xs font-bold text-[var(--fg-accent)] mb-3.5 shadow-2xs">
              <span>{isRtl ? 'بيئات العمل المتخصصة' : 'Specialized Engineering Studios'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-2.5 tracking-tight text-[var(--text-primary)] text-balance">
              {isRtl ? 'أربع بيئات عمل متخصصة للإنتاج التقني المتكامل' : 'Four Specialized Studios for Integrated Production'}
            </h2>
            <p className="text-xs sm:text-sm lg:text-[15px] text-[var(--text-secondary)] font-medium leading-relaxed max-w-3xl mx-auto text-balance">
              {isRtl
                ? 'بيئات عمل معيارية لتطوير التطبيقات، التصميم المتجه، الهندسة الصوتية، وسوق القوالب.'
                : 'Modular production environments for full-stack apps, vector motion design, neural audio, and template royalties.'}
            </p>
          </motion.div>

          {/* Asymmetric Bento Grid with Strict Start-Aligned Pyramid Text Hierarchy */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                id={feature.id === 'creator_economy' ? 'economy' : undefined}
                className={`flex flex-col justify-between p-6 sm:p-7 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] hover:border-[var(--border-accent)] transition-all duration-300 shadow-xs hover:shadow-xl group/card overflow-hidden text-start ${feature.colSpan}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div>
                  {/* Level 1 (Shortest): Icon + Compact Studio Badge at Start */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="p-2 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-main)] group-hover/card:scale-105 transition-transform shrink-0">
                      {feature.icon}
                    </div>
                    <span className="px-2.5 py-1 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-main)] text-[11px] font-sans font-bold text-[var(--fg-accent)]">
                      {isRtl ? `استوديو ${feature.number} • ${feature.badge}` : `Studio ${feature.number} • ${feature.badge}`}
                    </span>
                  </div>

                  {/* Level 2 (Medium): Main Studio Title */}
                  <h3 className="text-lg sm:text-xl font-black text-[var(--text-primary)] leading-snug mb-2">
                    {feature.title}
                  </h3>

                  {/* Level 3 (Longest): Balanced Description Base */}
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-medium mb-5">
                    {feature.description}
                  </p>

                  {/* =========================================================
                      LEVEL 4: LOCALIZED STUDIO VISUAL GRAPHIC PREVIEWS
                      ========================================================= */}
                  <div className="mb-5 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-main)] p-4 overflow-hidden relative group-hover/card:border-[var(--border-accent)] transition-all">
                    {feature.id === 'rinex_motion' && (
                      <div className="space-y-3 text-start">
                        <div className="flex items-center justify-between text-[11px] font-sans font-bold text-[var(--text-muted)]">
                          <span className="flex items-center gap-1.5 text-indigo-400">
                            <ImageIcon size={13} />
                            <span>{isRtl ? 'مساحة عمل الموشن والطبقات المتجهة' : 'Rinex Motion & Graphic Canvas'}</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-shape-xs bg-indigo-500/10 text-indigo-400 text-[10px] font-bold">
                            {isRtl ? 'شريط زمني 4K' : '4K Vector Timeline'}
                          </span>
                        </div>
                        {/* Simulated Freeform Motion Editor Layers */}
                        <div className="p-3 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-main)] space-y-2 text-[11px]">
                          <div className="flex items-center justify-between p-1.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold">
                            <span>{isRtl ? 'الطبقة 1: تحريك الأشكال المتجهة' : 'Layer 1: Motion Vector Shape'}</span>
                            <span className="text-[10px] text-emerald-500 font-bold">
                              {isRtl ? 'إطار 0ث - 2.4ث' : 'Keyframe 0s - 2.4s'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-1.5 rounded bg-[var(--surface-subtle)] border border-[var(--border-main)] text-[var(--text-secondary)] font-medium">
                            <span>{isRtl ? 'الطبقة 2: تحرير النصوص المباشر' : 'Layer 2: In-Place Text Overlay'}</span>
                            <span className="text-[10px] font-bold">{isRtl ? 'نشط للمعاينة' : 'Active Focus'}</span>
                          </div>
                          {/* Animated Timeline Scrubber */}
                          <div className="pt-2 flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[var(--text-muted)]">
                              {isRtl ? 'المسار الزمني' : 'Timeline'}
                            </span>
                            <div className="flex-1 h-1.5 rounded-full bg-slate-800 relative overflow-hidden">
                              <div className="h-full bg-indigo-500 w-3/4 animate-pulse" />
                            </div>
                            <span className="text-[10px] text-indigo-400 font-mono font-bold">02:14s</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {feature.id === 'app_studio' && (
                      <div className="space-y-3 text-start text-[11px]">
                        <div className="flex items-center justify-between text-[11px] font-sans font-bold text-[var(--text-muted)]">
                          <span className="flex items-center gap-1.5 text-blue-400">
                            <Code2 size={13} />
                            <span>{isRtl ? 'مترجم التطبيقات السحابي' : 'Full-Stack Compiler'}</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-shape-xs bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                            {isRtl ? 'تجميع خلال 0.8ث' : 'Compiled in 0.8s'}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-shape-xs bg-[var(--surface-code,#010409)] text-[var(--text-primary)] leading-relaxed text-[10px] font-mono dir-ltr text-start">
                          <div className="text-blue-400">const app = new EnterpriseApp();</div>
                          <div className="text-emerald-400">await app.deployDualDatabase();</div>
                          <div className="text-[var(--text-muted)] font-sans">
                            {isRtl ? '// معاينة حية ومباشرة للتطبيق في المتصفح' : '// Auto-sync live in browser preview'}
                          </div>
                        </div>
                      </div>
                    )}

                    {feature.id === 'audio_studio' && (
                      <div className="space-y-3 text-start">
                        <div className="flex items-center justify-between text-[11px] font-sans font-bold text-[var(--text-muted)]">
                          <span className="flex items-center gap-1.5 text-rose-400">
                            <Volume2 size={13} />
                            <span>{isRtl ? 'مُركّب الصوت العصبي المتقدم' : 'Neural Voice Synthesizer'}</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-shape-xs bg-rose-500/10 text-rose-400 text-[10px] font-bold">
                            {isRtl ? 'جودة 24kHz' : '24kHz Audio'}
                          </span>
                        </div>
                        {/* Equalizer Frequency Bars */}
                        <div className="flex justify-center items-center gap-1 h-8 py-1">
                          {[30, 60, 90, 45, 80, 100, 70, 40, 85, 60, 95, 50, 75, 35].map((h, i) => (
                            <span
                              key={i}
                              className="w-1.5 rounded-full bg-rose-500/80 animate-pulse"
                              style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {feature.id === 'creator_economy' && (
                      <div className="space-y-3 text-start text-[11px]">
                        <div className="flex items-center justify-between text-[11px] font-sans font-bold text-[var(--text-muted)]">
                          <span className="flex items-center gap-1.5 text-emerald-500">
                            <Users size={13} />
                            <span>{isRtl ? 'مؤشر عوائد وأرباح القوالب' : 'ViralBook Monetization Radar'}</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-shape-xs bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                            {isRtl ? 'مكافأة $50 نشطة' : '$50 Creator Bonus Active'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-start">
                          <div className="p-2.5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-main)]">
                            <span className="text-[10px] font-sans font-bold text-[var(--text-muted)] block mb-0.5">
                              {isRtl ? 'عائد استخدام القالب' : 'Template Royalty'}
                            </span>
                            <span className="text-xs font-black text-emerald-500">
                              {isRtl ? '$0.70 / لكل استخدام' : '$0.70 / use'}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-main)]">
                            <span className="text-[10px] font-sans font-bold text-[var(--text-muted)] block mb-0.5">
                              {isRtl ? 'عمولة الإحالة المستمرة' : 'Referral Split'}
                            </span>
                            <span className="text-xs font-black text-[var(--fg-accent)]">
                              {isRtl ? '20% عمولة متكررة' : '20% Recurring'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Interactive CTA Action Link */}
                <div className="pt-3 border-t border-[var(--border-main)] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleNavigateToSection((feature as any).route || '/app')}
                    className="inline-flex items-center gap-2 text-xs font-bold font-sans text-[var(--fg-accent)] hover:underline cursor-pointer"
                  >
                    <span>{isRtl ? 'فتح الاستوديو مباشرة' : 'Open Studio Directly'}</span>
                    <ArrowRight size={14} className={isRtl ? 'rotate-180' : ''} />
                  </button>
                  <span className="text-[10px] font-sans font-bold text-[var(--text-muted)]">
                    {isRtl ? 'جاهز للتشغيل الفوري' : 'PRODUCTION READY'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            PILLARS 2 & 4: MODULAR UI STUDIO SHOWCASE WITH CONTEXTUAL CTAS
            ========================================================================= */}
        <section id="modular-showcase" className="py-16 sm:py-24 overflow-hidden relative border-t border-[var(--border-main)]">
          <div className="text-center mb-10 max-w-4xl mx-auto px-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-main)] text-xs font-bold text-[var(--fg-accent)] mb-3.5 shadow-2xs">
              <Sparkles size={14} />
              <span>{isRtl ? 'استعراض البيئات والقوالب' : 'Interactive Studio & Template Showcase'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-2.5 tracking-tight text-[var(--text-primary)] text-balance">
              {isRtl ? 'استعراض بيئات التوليد والإنتاج في واجهة موحدة' : 'Integrated Multimodal Production Environment'}
            </h2>
            <p className="text-xs sm:text-sm lg:text-[15px] text-[var(--text-secondary)] font-medium leading-relaxed max-w-3xl mx-auto text-balance">
              {isRtl 
                ? 'نماذج تطبيقية حية تشمل تطوير البرمجيات، التصميم المتجه، الإنتاج المرئي، الهندسة الصوتية، والقوالب.' 
                : 'Live interactive showcase across software development, vector motion, video production, neural audio, and templates.'}
            </p>

            {/* Modular UI Showcase Category Navigation Tabs - Unified 36px Standard */}
            <div className="mt-7 flex justify-center w-full">
              <div className="inline-flex items-center gap-1.5 p-1 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-main)] max-w-full overflow-x-auto scrollbar-none shadow-2xs">
                {[
                  { id: 'all', labelAr: 'المنظومة الكاملة', labelEn: 'All Studios', icon: <LayoutGrid size={14} /> },
                  { id: 'apps', labelAr: 'استوديو البرمجيات (IDE)', labelEn: 'Software IDE', icon: <Code2 size={14} /> },
                  { id: 'motion', labelAr: 'استوديو التصميم والموشن', labelEn: 'Design & Motion', icon: <ImageIcon size={14} /> },
                  { id: 'video', labelAr: 'الإنتاج المرئي والريلز', labelEn: 'Video & Reels', icon: <Tv size={14} /> },
                  { id: 'audio', labelAr: 'الهندسة الصوتية', labelEn: 'Audio Engineering', icon: <Volume2 size={14} /> },
                  { id: 'viral', labelAr: 'مجتمع وسوق فيرال بوك', labelEn: 'ViralBook Hub', icon: <Users size={14} /> },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedModularStudioTab(tab.id as any)}
                    className={`relative h-9 px-3.5 rounded-shape-sm text-xs font-bold leading-none inline-flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 before:absolute before:-inset-1 before:content-[''] ${
                      selectedModularStudioTab === tab.id
                        ? 'bg-[var(--surface-card)] text-[var(--fg-accent)] shadow-2xs border border-[var(--border-main)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                    }`}
                  >
                    <span className="shrink-0 flex items-center">{tab.icon}</span>
                    <span>{isRtl ? tab.labelAr : tab.labelEn}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full">
            {/* Tab: ALL - Dual Balanced Marquee Streams */}
            {selectedModularStudioTab === 'all' && (
              <div className="relative w-full overflow-hidden space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
                {/* Smooth Edge Fade Masks matching page background */}
                <div className="absolute left-0 top-0 bottom-0 w-28 sm:w-52 bg-gradient-to-r from-[var(--surface-page)] via-[var(--surface-page)]/85 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-28 sm:w-52 bg-gradient-to-l from-[var(--surface-page)] via-[var(--surface-page)]/85 to-transparent z-10 pointer-events-none" />

                {/* Stream 1 */}
                <div className="flex gap-6 w-max animate-logo-scroll">
                  {[...appStudioRow1, ...rinexTemplateRow1, ...videoArtRow1].map((item, idx) => (
                    <div
                      key={`modular-all-r1-${idx}`}
                      className="w-[320px] sm:w-[380px] p-4 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] shadow-sm flex flex-col justify-between space-y-3 shrink-0 group hover:border-[var(--border-accent)] transition-all cursor-pointer text-start"
                      onClick={() => handleNavigateToSection((item as any).studioRoute || '/app')}
                    >
                      <div className="relative rounded-shape-md overflow-hidden aspect-[16/10] bg-[var(--surface-subtle)] border border-[var(--border-default)]">
                        <img src={item.img} alt={item.title} onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80'; }} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-2.5 end-2.5 px-2.5 py-1 rounded-shape-xs bg-black/75 backdrop-blur-md text-[10px] font-sans font-bold text-blue-400 border border-blue-500/30">
                          {'tag' in item ? item.tag : 'layers' in item ? item.layers : 'duration' in item ? item.duration : ''}
                        </div>
                      </div>
                      {/* Pyramid Text Block: Shortest Category -> Medium Title -> Longest Description */}
                      <div className="space-y-1 text-start">
                        <div className="text-[11px] font-sans font-bold text-[var(--fg-accent)]">
                          {'category' in item ? item.category : ''}
                        </div>
                        <div className="text-sm font-black text-[var(--text-primary)] leading-snug">
                          {item.title}
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] font-medium truncate">
                          {'desc' in item ? item.desc : 'prompt' in item ? item.prompt : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stream 2 */}
                <div className="flex gap-6 w-max animate-logo-scroll-reverse">
                  {[...audioArtRow1, ...viralBookRow1, ...appStudioRow2].map((item, idx) => (
                    <div
                      key={`modular-all-r2-${idx}`}
                      className="w-[320px] sm:w-[380px] p-4 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] shadow-sm flex flex-col justify-between space-y-3 shrink-0 group hover:border-[var(--border-accent)] transition-all cursor-pointer text-start"
                      onClick={() => handleNavigateToSection((item as any).studioRoute || '/app')}
                    >
                      <div className="relative rounded-shape-md overflow-hidden aspect-[16/10] bg-[var(--surface-subtle)] border border-[var(--border-default)]">
                        <img src={item.img} alt={item.title} onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80'; }} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-2.5 end-2.5 px-2.5 py-1 rounded-shape-xs bg-black/75 backdrop-blur-md text-[10px] font-sans font-bold text-emerald-400 border border-emerald-500/30">
                          {'royalty' in item ? (item as any).royalty : 'tag' in item ? (item as any).tag : 'duration' in item ? (item as any).duration : ''}
                        </div>
                      </div>
                      {/* Pyramid Text Block: Shortest Category -> Medium Title -> Longest Description */}
                      <div className="space-y-1 text-start">
                        <div className="text-[11px] font-sans font-bold text-[var(--fg-accent)]">
                          {'category' in item ? (item as any).category : 'genre' in item ? (item as any).genre : ''}
                        </div>
                        <div className="text-sm font-black text-[var(--text-primary)] leading-snug">
                          {item.title}
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] font-medium truncate">
                          {'desc' in item ? (item as any).desc : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: APPS (Software Compiler Studio) */}
            {selectedModularStudioTab === 'apps' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-4 text-start">
                {[...appStudioRow1, ...appStudioRow2].map((app, idx) => (
                  <div
                    key={`grid-app-${idx}`}
                    className="p-4 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] shadow-xs hover:border-[var(--border-accent)] hover:shadow-md transition-all flex flex-col justify-between space-y-3 cursor-pointer group text-start"
                    onClick={() => handleNavigateToSection('/app')}
                  >
                    <div className="relative rounded-shape-md overflow-hidden aspect-[16/10] bg-[var(--surface-subtle)] border border-[var(--border-default)]">
                      <img src={app.img} alt={app.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-2.5 end-2.5 px-2.5 py-1 rounded-shape-xs bg-black/75 backdrop-blur-md text-[10px] font-sans font-bold text-blue-400 border border-blue-500/30">
                        {app.tag}
                      </div>
                    </div>
                    <div className="space-y-1 text-start">
                      <div className="text-[11px] font-sans font-bold text-[var(--fg-accent)]">{app.tag}</div>
                      <div className="text-sm font-black text-[var(--text-primary)] leading-snug">{app.title}</div>
                      <p className="text-xs text-[var(--text-secondary)] font-medium line-clamp-2 leading-relaxed">{app.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab: MOTION (Rinex Vector Canvas) */}
            {selectedModularStudioTab === 'motion' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-4 text-start">
                {[...rinexTemplateRow1, ...rinexTemplateRow2].map((tmpl, idx) => (
                  <div
                    key={`grid-motion-${idx}`}
                    className="p-4 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] shadow-xs hover:border-[var(--border-accent)] hover:shadow-md transition-all flex flex-col justify-between space-y-3 cursor-pointer group text-start"
                    onClick={() => handleNavigateToSection('/image-studio')}
                  >
                    <div className="relative rounded-shape-md overflow-hidden aspect-[16/10] bg-[var(--surface-subtle)] border border-[var(--border-default)]">
                      <img src={tmpl.img} alt={tmpl.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-2.5 end-2.5 px-2.5 py-1 rounded-shape-xs bg-black/75 backdrop-blur-md text-[10px] font-sans font-bold text-emerald-400 border border-emerald-500/30">
                        {tmpl.layers}
                      </div>
                    </div>
                    <div className="space-y-1 text-start">
                      <div className="text-[11px] font-sans font-bold text-[var(--fg-accent)]">{tmpl.category}</div>
                      <div className="text-sm font-black text-[var(--text-primary)] leading-snug">{tmpl.title}</div>
                      <p className="text-xs text-[var(--text-secondary)] font-medium line-clamp-2 leading-relaxed">{tmpl.layers}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab: VIDEO (Cinematic & Reels) */}
            {selectedModularStudioTab === 'video' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-4 text-start">
                {[...videoArtRow1, ...videoArtRow2].map((vid, idx) => (
                  <div
                    key={`grid-video-${idx}`}
                    className="p-4 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] shadow-xs hover:border-[var(--border-accent)] hover:shadow-md transition-all flex flex-col justify-between space-y-3 cursor-pointer group text-start"
                    onClick={() => handleNavigateToSection('/image-studio?category=reels')}
                  >
                    <div className="relative rounded-shape-md overflow-hidden aspect-[16/10] bg-[var(--surface-subtle)] border border-[var(--border-default)]">
                      <img src={vid.img} alt={vid.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-2.5 end-2.5 px-2.5 py-1 rounded-shape-xs bg-black/75 backdrop-blur-md text-[10px] font-mono font-bold text-white border border-white/25 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span>{vid.duration}</span>
                      </div>
                    </div>
                    <div className="space-y-1 text-start">
                      <div className="text-[11px] font-sans font-bold text-[var(--fg-accent)]">{vid.duration}</div>
                      <div className="text-sm font-black text-[var(--text-primary)] leading-snug">{vid.title}</div>
                      <p className="text-xs text-[var(--text-secondary)] font-medium line-clamp-2 leading-relaxed">{vid.prompt}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab: AUDIO (Neural Sound & Speech) */}
            {selectedModularStudioTab === 'audio' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-4 text-start">
                {[...audioArtRow1, ...audioArtRow2].map((aud, idx) => (
                  <div
                    key={`grid-audio-${idx}`}
                    className="p-4 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] shadow-xs hover:border-[var(--border-accent)] hover:shadow-md transition-all flex flex-col justify-between space-y-3 cursor-pointer group text-start"
                    onClick={() => handleNavigateToSection('/audio-studio')}
                  >
                    <div className="relative rounded-shape-md overflow-hidden aspect-[16/10] bg-[var(--surface-subtle)] border border-[var(--border-default)]">
                      <img src={aud.img} alt={aud.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-2.5 end-2.5 px-2.5 py-1 rounded-shape-xs bg-black/75 backdrop-blur-md text-[10px] font-mono font-bold text-pink-400 border border-pink-500/30 flex items-center gap-1.5">
                        <Volume2 size={12} className="animate-pulse text-pink-400" />
                        <span>{aud.duration}</span>
                      </div>
                    </div>
                    <div className="space-y-1 text-start">
                      <div className="text-[11px] font-sans font-bold text-[var(--fg-accent)]">
                        {aud.genre} • {aud.tag}
                      </div>
                      <div className="text-sm font-black text-[var(--text-primary)] leading-snug">{aud.title}</div>
                      <p className="text-xs text-[var(--text-secondary)] font-medium line-clamp-2 leading-relaxed">{aud.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab: VIRALBOOK (Templates Marketplace) */}
            {selectedModularStudioTab === 'viral' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-4 text-start">
                {[...viralBookRow1, ...viralBookRow2].map((vb, idx) => (
                  <div
                    key={`grid-viral-${idx}`}
                    className="p-4 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] shadow-xs hover:border-[var(--border-accent)] hover:shadow-md transition-all flex flex-col justify-between space-y-3 cursor-pointer group text-start"
                    onClick={() => handleNavigateToSection('/viralbook')}
                  >
                    <div className="relative rounded-shape-md overflow-hidden aspect-[16/10] bg-[var(--surface-subtle)] border border-[var(--border-default)]">
                      <img src={vb.img} alt={vb.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-2.5 end-2.5 px-2.5 py-1 rounded-shape-xs bg-black/75 backdrop-blur-md text-[10px] font-mono font-bold text-emerald-400 border border-emerald-500/30">
                        {vb.royalty}
                      </div>
                    </div>
                    <div className="space-y-1 text-start">
                      <div className="text-[11px] font-sans font-bold text-[var(--fg-accent)]">{vb.category}</div>
                      <div className="text-sm font-black text-[var(--text-primary)] leading-snug">{vb.title}</div>
                      <p className="text-xs text-[var(--text-secondary)] font-medium line-clamp-2 leading-relaxed">{vb.royalty}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contextual Action CTA Button (Pillar 4 - Unified 40px Standard) */}
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => {
                if (selectedModularStudioTab === 'apps') handleNavigateToSection('/app');
                else if (selectedModularStudioTab === 'motion') handleNavigateToSection('/image-studio');
                else if (selectedModularStudioTab === 'video') handleNavigateToSection('/image-studio?category=reels');
                else if (selectedModularStudioTab === 'audio') handleNavigateToSection('/audio-studio');
                else if (selectedModularStudioTab === 'viral') handleNavigateToSection('/viralbook');
                else handleNavigateToSection('/app');
              }}
              className="relative h-10 px-6 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-bold text-xs leading-none inline-flex items-center justify-center gap-2 shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer before:absolute before:-inset-1 before:content-['']"
            >
              <span>
                {selectedModularStudioTab === 'apps' && (isRtl ? 'فتح استوديو تطوير البرمجيات (IDE)' : 'Launch Software IDE Studio')}
                {selectedModularStudioTab === 'motion' && (isRtl ? 'فتح استوديو التصميم والموشن (رينكس)' : 'Launch Rinex Design & Motion Studio')}
                {selectedModularStudioTab === 'video' && (isRtl ? 'فتح استوديو الإنتاج المرئي والريلز' : 'Launch Video & Reels Studio')}
                {selectedModularStudioTab === 'audio' && (isRtl ? 'تشغيل استوديو الهندسة الصوتية' : 'Launch Audio Engineering Studio')}
                {selectedModularStudioTab === 'viral' && (isRtl ? 'استكشاف مجتمع وسوق فيرال بوك' : 'Explore ViralBook Community & Hub')}
                {selectedModularStudioTab === 'all' && (isRtl ? 'استكشاف بيئات العمل المتخصصة' : 'Explore Specialized Studios')}
              </span>
              <ArrowRight size={14} className={isRtl ? 'rotate-180 shrink-0' : 'shrink-0'} />
            </button>
          </div>
        </section>

        {/* =========================================================================
            3. PLATFORM OPERATING METRICS (High-Impact Animated Numbers Section)
            ========================================================================= */}
        <section id="comparison" className="py-16 sm:py-24 border-t border-[var(--border-main)]">
          <div className="text-center mb-12 max-w-4xl mx-auto px-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-main)] text-xs font-bold text-emerald-500 mb-3.5 shadow-2xs">
              <Activity size={14} />
              <span>{isRtl ? 'مؤشرات الأداء والتشغيل' : 'Performance & Reliability Metrics'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-2.5 tracking-tight text-[var(--text-primary)] text-balance">
              {isRtl ? 'مؤشرات الأداء والاعتمادية التشغيلية' : 'Global Operating Standards & SLA'}
            </h2>
            <p className="text-xs sm:text-sm lg:text-[15px] text-[var(--text-secondary)] font-medium leading-relaxed max-w-3xl mx-auto text-balance">
              {isRtl
                ? 'بنية سحابية عالية التوافر تضمن استقرار المعالجة وأمن البيانات للمطورين والمؤسسات.'
                : 'High-availability cloud infrastructure ensuring continuous execution and data stability.'}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Stat 1: Total Generations */}
            <motion.div 
              className="p-6 sm:p-8 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] text-center shadow-xs hover:border-[var(--border-accent)] transition-all"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-3xl sm:text-5xl font-black text-[var(--text-primary)] tracking-tighter mb-2 dir-ltr">
                <AnimatedCounterNumber to={5.4} decimals={1} useLocale suffix="M+" duration={2} />
              </div>
              <div className="text-xs sm:text-sm font-bold text-[var(--text-secondary)]">
                {isRtl ? 'عملية معالجة برمجية' : 'Code Operations'}
              </div>
            </motion.div>

            {/* Stat 2: Verified Developers */}
            <motion.div 
              className="p-6 sm:p-8 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] text-center shadow-xs hover:border-[var(--border-accent)] transition-all"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="text-3xl sm:text-5xl font-black text-blue-500 tracking-tighter mb-2 dir-ltr">
                <AnimatedCounterNumber to={128} useLocale suffix="K+" duration={2} />
              </div>
              <div className="text-xs sm:text-sm font-bold text-[var(--text-secondary)]">
                {isRtl ? 'مطور ومؤسسة مسجلة' : 'Registered Developers'}
              </div>
            </motion.div>

            {/* Stat 3: Uptime SLA */}
            <motion.div 
              className="p-6 sm:p-8 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] text-center shadow-xs hover:border-[var(--border-accent)] transition-all"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="text-3xl sm:text-5xl font-black text-emerald-500 tracking-tighter mb-2 dir-ltr">
                <AnimatedCounterNumber to={99.98} decimals={2} suffix="%" duration={2.5} />
              </div>
              <div className="text-xs sm:text-sm font-bold text-[var(--text-secondary)]">
                {isRtl ? 'نسبة جاهزية الخوادم' : 'SLA Uptime'}
              </div>
            </motion.div>

            {/* Stat 4: AI Tools / Models */}
            <motion.div 
              className="p-6 sm:p-8 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] text-center shadow-xs hover:border-[var(--border-accent)] transition-all"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="text-3xl sm:text-5xl font-black text-amber-500 tracking-tighter mb-2 dir-ltr">
                <AnimatedCounterNumber to={18} suffix="+" duration={2} />
              </div>
              <div className="text-xs sm:text-sm font-bold text-[var(--text-secondary)]">
                {isRtl ? 'محرك حوسبة متكامل' : 'Integrated Engines'}
              </div>
            </motion.div>
          </div>
        </section>

        {/* =========================================================================
            4. PRICING SECTION (Authentic Platform Model from SubscriptionPage)
            ========================================================================= */}
        <section id="pricing" className="py-16 sm:py-24 border border-[var(--border-main)] bg-[var(--surface-card)] rounded-shape-lg p-6 sm:p-10 shadow-xs">
          {/* Section Header */}
          <div className="mx-auto max-w-4xl text-center mb-8">
            <div className="inline-block px-3.5 py-1 rounded-shape-xs border border-[var(--border-main)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] text-xs font-bold mb-3.5 shadow-2xs">
              {isRtl ? 'باقات الاستخدام والاشتراكات' : 'Subscription & API Plans'}
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-[28px] xl:text-3xl font-black tracking-tight mb-2.5 text-[var(--text-primary)] md:whitespace-nowrap max-w-4xl mx-auto">
              {isRtl ? 'خطط اشتراك مرنة للأفراد وفرق العمل والمطورين' : 'Flexible Subscription Plans for Individuals & Teams'}
            </h2>
            <p className="text-xs sm:text-sm lg:text-[15px] text-[var(--text-secondary)] mb-6 font-medium leading-relaxed max-w-2xl mx-auto text-balance">
              {isRtl
                ? 'وصول متكامل لكافة الاستوديوهات مع حصص حوسبة مخصصة وترقية فورية.'
                : 'Full access to all engineering studios with dedicated compute quotas and instant activation.'}
            </p>

            {/* Unified Horizontal Pricing Controls Bar (Category + Billing Cycle in 1 Row) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-1.5 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-main)] max-w-3xl mx-auto shadow-2xs">
              {/* Plan Category Selector */}
              <div className="flex items-center gap-1 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('user')}
                  className={`relative flex-1 sm:flex-initial h-9 px-4 rounded-shape-sm text-xs font-bold leading-none transition-all inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap before:absolute before:-inset-1 before:content-[''] ${
                    activeTab === 'user'
                      ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-2xs border border-[var(--border-main)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent'
                  }`}
                >
                  <Sparkles size={14} className={activeTab === 'user' ? 'text-[var(--fg-accent)] shrink-0' : 'shrink-0'} />
                  <span>{isRtl ? 'خطط الاستخدام العام' : 'Standard Plans'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('developer')}
                  className={`relative flex-1 sm:flex-initial h-9 px-4 rounded-shape-sm text-xs font-bold leading-none transition-all inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap before:absolute before:-inset-1 before:content-[''] ${
                    activeTab === 'developer'
                      ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-2xs border border-[var(--border-main)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent'
                  }`}
                >
                  <Code2 size={14} className={activeTab === 'developer' ? 'text-[var(--fg-accent)] shrink-0' : 'shrink-0'} />
                  <span>{isRtl ? 'خطط المطورين والوكلاء' : 'Developer & API Plans'}</span>
                </button>
              </div>

              {/* Vertical Divider on Desktop */}
              <div className="hidden sm:block w-px h-5 bg-[var(--border-main)]" />

              {/* Billing Cycle Selector + Savings Tag */}
              <div className="flex items-center justify-center gap-1.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsYearly(false)}
                  className={`relative flex-1 sm:flex-initial h-9 px-4 rounded-shape-sm text-xs font-bold leading-none transition-all inline-flex items-center justify-center cursor-pointer whitespace-nowrap before:absolute before:-inset-1 before:content-[''] ${
                    !isYearly
                      ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-2xs border border-[var(--border-main)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent'
                  }`}
                >
                  {isRtl ? 'شهرياً' : 'Monthly'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsYearly(true)}
                  className={`relative flex-1 sm:flex-initial h-9 px-4 rounded-shape-sm text-xs font-bold leading-none transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap before:absolute before:-inset-1 before:content-[''] ${
                    isYearly
                      ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-2xs border border-[var(--border-main)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent'
                  }`}
                >
                  <span>{isRtl ? 'سنوياً' : 'Annually'}</span>
                  <span className="px-1.5 py-0.5 rounded-shape-xs bg-emerald-500/15 text-emerald-500 text-[10px] font-mono font-bold leading-none">
                    -20%
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="mx-auto max-w-6xl">
            {displayedPlans.length === 0 ? (
              <div className="w-full max-w-2xl mx-auto rounded-shape-md border border-[var(--border-main)] bg-[var(--surface-card)] p-8 text-center flex flex-col items-center justify-center min-h-[260px] shadow-xs">
                <Code2 size={36} className="text-[var(--fg-accent)] mb-3 animate-pulse" />
                <h3 className="text-lg font-bold mb-2 text-[var(--text-primary)]">
                  {isRtl ? 'بوابة المطورين والوكلاء (قيد التجهيز)' : 'Developer Portal Under Ingestion'}
                </h3>
                <p className="text-xs text-[var(--text-muted)] max-w-md leading-relaxed">
                  {isRtl
                    ? 'سيتم إدراج خطط المطورين وحصص مفاتيح API المخصصة قريباً مباشرة من لوحة الإدارة.'
                    : 'Developer tier plans and dedicated API key allocations will be available shortly.'}
                </p>
              </div>
            ) : (
              <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch overflow-x-auto md:overflow-visible snap-x snap-mandatory pt-6 pb-6 md:pt-7 md:pb-4 scrollbar-none px-4 -mx-4 sm:px-0 sm:mx-0">
                {displayedPlans.map((plan: any, planIdx: number) => {
                  const isPlanActive = isActivePlan(plan.id);
                  const availableCycles = getPlanAvailableCycles(plan);
                  const effectiveCycle = getEffectiveCycleForPlan(plan);
                  const planPrice = getDisplayPrice(plan, effectiveCycle);

                  // Badge & Color Assignment
                  let cardBadgeText = getBadgeLabel(plan.badge);
                  let cardAccentColor = plan.color || '#3b82f6';
                  let cardBadgeColor = cardAccentColor;

                  const isStarter = planPrice === 0 || planIdx === 0 || plan.id === 'starter';
                  const isPopularPlan = Boolean(plan.is_popular) || planIdx === 1 || plan.badge === 'Best Value' || plan.badge === 'popular' || plan.badge === 'best_seller' || plan.badge === 'BEST SELLER';

                  if (isStarter) {
                    cardBadgeText = cardBadgeText || (isRtl ? 'أساسي' : 'STANDARD');
                    cardAccentColor = '#334155'; // Dark slate
                    cardBadgeColor = '#1e293b';
                  } else if (isPopularPlan) {
                    cardBadgeText = cardBadgeText || (isRtl ? 'الأكثر طلباً' : 'BEST SELLER');
                    cardAccentColor = '#2563eb'; // Bright Blue
                    cardBadgeColor = '#2563eb';
                  } else {
                    cardBadgeText = cardBadgeText || (isRtl ? 'مؤسسي' : 'ENTERPRISE');
                    cardAccentColor = '#9333ea'; // Purple
                    cardBadgeColor = '#9333ea';
                  }

                  // Hero Featured Card: Pro / Best Seller gets prominent elevation and glowing blue border
                  const isFeatured = isPopularPlan;
                  const isElite = !isFeatured && (cardBadgeText.toUpperCase() === 'ENTERPRISE' || cardBadgeText === 'مؤسسي' || cardBadgeText.toUpperCase() === 'ELITE' || planIdx === 2);

                  const planTitle = isRtl ? plan.nameAr || plan.nameEn : plan.nameEn || plan.nameAr;
                  const rawSubtitle = isRtl ? plan.descAr || plan.descEn : plan.descEn || plan.descAr;
                  const planSubtitle = rawSubtitle
                    ? rawSubtitle.trim().charAt(0).toUpperCase() + rawSubtitle.trim().slice(1)
                    : '';

                  const allFeatures = plan.features || [];
                  const isFeatExpanded = expandedPlanFeatures[plan.id.toString()] ?? false;
                  const displayedFeatures = isFeatExpanded ? allFeatures : allFeatures.slice(0, 4);

                  return (
                    <div
                      key={`plan-${plan.id || planIdx}`}
                      className={`relative rounded-shape-md border p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 bg-[var(--surface-card)] group shadow-sm shrink-0 w-[86vw] sm:w-[320px] md:w-auto snap-center ${
                        isFeatured
                          ? 'border-2 border-blue-500 shadow-xl shadow-blue-500/15 md:-translate-y-2 z-20 ring-1 ring-blue-500/20'
                          : isElite
                          ? 'border border-purple-500/40 hover:border-purple-500 shadow-md shadow-purple-500/5 z-10'
                          : 'border-[var(--border-main)] hover:border-[var(--border-accent)] z-1'
                      }`}
                    >
                      {/* Overlapping Top-Right Badge - Elevated Foreground Layer */}
                      <div className={`absolute top-0 ${isRtl ? 'left-6' : 'right-6'} -translate-y-1/2 z-30 pointer-events-none drop-shadow-md`}>
                        <span
                          className="inline-flex items-center justify-center px-3.5 py-1 text-[11px] sm:text-xs font-black uppercase tracking-wider text-white rounded-shape-xs shadow-lg border border-white/30 whitespace-nowrap"
                          style={{ backgroundColor: cardBadgeColor }}
                        >
                          {cardBadgeText}
                        </span>
                      </div>

                      {/* Header with Title & Subtitle */}
                      <div className="mb-4 pt-1">
                        <h3 className="text-xl sm:text-2xl font-black mb-1 flex items-center gap-2 text-[var(--text-primary)]">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs inline-block"
                            style={{ backgroundColor: cardAccentColor }}
                          />
                          <span>{planTitle}</span>
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed min-h-[32px]">
                          {planSubtitle}
                        </p>
                      </div>

                      {/* In-Card Segmented Billing Cycle Toggle (MONTHLY / ANNUAL) */}
                      <div className="p-1 rounded-shape-sm flex items-center bg-[var(--surface-subtle)] border border-[var(--border-main)] mb-4">
                        <button
                          type="button"
                          onClick={() => setSelectedPlanCycles((prev) => ({ ...prev, [plan.id]: 'monthly' }))}
                          className={`flex-1 py-1.5 px-3 rounded-shape-xs text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            effectiveCycle === 'monthly'
                              ? 'bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-main)] shadow-xs'
                              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {isRtl ? 'شهرياً' : 'MONTHLY'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPlanCycles((prev) => ({ ...prev, [plan.id]: 'annual' }))}
                          className={`flex-1 py-1.5 px-3 rounded-shape-xs text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            effectiveCycle === 'annual'
                              ? 'bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-main)] shadow-xs'
                              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {isRtl ? 'سنوياً' : 'ANNUAL'}
                        </button>
                      </div>

                      {/* Pricing Tag & Savings Info */}
                      <div className="mb-4">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--text-primary)] font-mono">
                            ${planPrice.toFixed(2)}
                          </span>
                          <span className="text-xs text-[var(--text-muted)] font-bold">
                            / {effectiveCycle === 'annual' ? (isRtl ? 'سنوياً' : 'Annually') : (isRtl ? 'شهرياً' : 'Monthly')}
                          </span>
                        </div>
                        {planPrice > 0 && getSavingPercentage(plan) > 0 && (
                          <div className="mt-1 text-[11px] font-bold" style={{ color: cardAccentColor }}>
                            {isRtl
                              ? `وفر ${getSavingPercentage(plan)}% عند اختيار الدفع السنوي`
                              : `Save ${getSavingPercentage(plan)}% with annual billing`}
                          </div>
                        )}
                      </div>

                      {/* Credits Allowance Box (exact match to image.png) */}
                      <div className="mb-4 p-2.5 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-main)] flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-2 text-xs font-black text-[var(--text-primary)]">
                          <Sparkles size={15} style={{ color: cardAccentColor }} className="shrink-0" />
                          <span className="font-mono">
                            {Number(
                              effectiveCycle === 'daily'
                                ? plan.dailyCredits || Math.round((plan.dailyPrice || 0) * 1000)
                                : effectiveCycle === 'annual'
                                ? plan.annualCredits || (plan.monthlyCredits ? plan.monthlyCredits * 12 : Math.round((plan.annualPrice || 0) * 1000))
                                : plan.monthlyCredits || Math.round((plan.monthlyPrice || 0) * 1000) || 50000
                            ).toLocaleString()}
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)] font-bold">
                            {isRtl ? 'نقاط ذكاء اصطناعي' : 'AI Credits'}
                          </span>
                        </div>
                      </div>

                      {/* Top Feature Highlights for clarity (Fix 6) */}
                      <div className="mb-5 space-y-2 px-1">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-secondary)]">
                          <div className="w-1 h-1 rounded-full bg-[var(--fg-accent)] shrink-0" />
                          <span>{isRtl ? 'دخول كامل للاستوديوهات' : 'Full Studios Access'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-secondary)]">
                          <div className="w-1 h-1 rounded-full bg-[var(--fg-accent)] shrink-0" />
                          <span>{isRtl ? 'توليد موشن جرافيك 4K' : '4K Motion Generation'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-secondary)]">
                          <div className="w-1 h-1 rounded-full bg-[var(--fg-accent)] shrink-0" />
                          <span>{isRtl ? 'حقوق الملكية الفكرية' : 'Full IP Ownership'}</span>
                        </div>
                      </div>

                      {/* Action Buttons matching image.png */}
                      <div className="mb-5">
                        {planPrice === 0 ? (
                          <button
                            type="button"
                            onClick={() => handlePlanAction(plan.id, 'free')}
                            className="w-full min-h-[44px] py-3 rounded-shape-xs bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-primary)] border border-[var(--border-main)] font-bold text-xs uppercase tracking-wider transition-all duration-150 shadow-xs cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                          >
                            {isPlanActive ? (
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 size={16} />
                                <span>{isRtl ? 'الخطة الحالية النشطة' : 'Current Active Plan'}</span>
                              </div>
                            ) : (
                              <span>{isRtl ? 'تفعيل الخطة المجانية' : 'Activate Free Plan'}</span>
                            )}
                          </button>
                        ) : (
                          <div className="grid grid-cols-2 gap-2.5">
                            <button
                              type="button"
                              onClick={() => handlePlanAction(plan.id, 'subscribe')}
                              className="w-full min-h-[44px] py-3 rounded-shape-xs text-white font-black text-xs uppercase tracking-wider transition-all duration-150 shadow-md cursor-pointer flex items-center justify-center gap-1.5 hover:opacity-95 active:scale-98"
                              style={{ backgroundColor: cardAccentColor }}
                            >
                              {isPlanActive ? (
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 size={14} />
                                  <span>{isRtl ? 'نشط' : 'Active'}</span>
                                </div>
                              ) : (
                                <span>{isRtl ? 'اشتراك' : 'Subscribe'}</span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePlanAction(plan.id, 'balance')}
                              className="w-full min-h-[44px] py-3 rounded-shape-xs font-black text-xs uppercase tracking-wider transition-all duration-150 border bg-transparent hover:bg-[var(--surface-subtle)] cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                              style={{ borderColor: cardAccentColor, color: cardAccentColor }}
                            >
                              <span>{isRtl ? 'دفع بالرصيد' : 'Pay with Balance'}</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Features & Benefits List matching image.png */}
                      <div className="my-2 pt-4 border-t border-[var(--border-main)] flex-1 space-y-2.5">
                        <p className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                          {isRtl ? 'الميزات والخصائص' : 'Features & Benefits'}
                        </p>
                        {displayedFeatures.map((feat: any, idx: number) => (
                          <div key={`feat-${plan.id}-${idx}`} className="flex items-start gap-2.5">
                            <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                              <Check size={11} className="stroke-[3]" />
                            </div>
                            <span className="text-xs text-[var(--text-secondary)] font-medium leading-snug">
                              {getFeatureText(feat)}
                            </span>
                          </div>
                        ))}

                        {allFeatures.length > 4 && (
                          <button
                            type="button"
                            onClick={() => setExpandedPlanFeatures(prev => ({ ...prev, [plan.id.toString()]: !isFeatExpanded }))}
                            className="mt-2 text-[11px] font-bold text-[var(--fg-accent)] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span>
                              {isFeatExpanded
                                ? (isRtl ? 'إخفاء المزايا التفصيلية' : 'Show Less')
                                : (isRtl ? `عرض كافة المزايا (${allFeatures.length})` : `Show All ${allFeatures.length} Features`)}
                            </span>
                            <ChevronDown size={13} className={`transition-transform duration-200 ${isFeatExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                      </div>

                      {/* Collapsible Daily Tool Limits */}
                      {!plan.hideTools && (
                        <div className="mt-auto pt-4 border-t border-[var(--border-main)]">
                          <div className="flex justify-between items-center px-0.5 mb-2.5">
                            <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] m-0">
                              {isRtl ? 'حدود الأدوات اليومية' : 'Daily Tool Limits'}
                            </p>
                            <button
                              type="button"
                              onClick={() => togglePlanExpand(plan.id.toString())}
                              className="text-xs font-bold flex items-center gap-1 transition-opacity hover:opacity-80 cursor-pointer"
                              style={{ color: cardAccentColor }}
                            >
                              <span>
                                {expandedPlans[plan.id.toString()]
                                  ? isRtl
                                    ? 'إخفاء'
                                    : 'Hide'
                                  : isRtl
                                  ? 'تفاصيل'
                                  : 'Details'}
                              </span>
                              <ChevronDown
                                size={14}
                                className={`transition-transform duration-150 ${
                                  expandedPlans[plan.id.toString()] ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                          </div>

                          {expandedPlans[plan.id.toString()] && (
                            <div className="overflow-hidden">
                              <div className="max-h-[200px] overflow-y-auto scrollbar-none pb-1 pt-1">
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                                  {ALL_TOOLS.map((toolId) => {
                                    const limitVal =
                                      plan.limits && plan.limits[toolId] !== undefined
                                        ? plan.limits[toolId]
                                        : { daily: 0, monthly: 0 };

                                    if (limitVal?.isHidden === true || limitVal?.isHidden === 'true') return null;

                                    const label = t ? t(toolId) || toolId : toolId;
                                    const icon = toolIcons[toolId] || <CheckCircle2 size={12} className="w-3.5 h-3.5" />;

                                    return (
                                      <LimitItem
                                        key={`tool-${plan.id}-${toolId}`}
                                        icon={icon}
                                        label={label}
                                        value={limitVal}
                                        color={cardAccentColor}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* =========================================================================
            10B. TESTIMONIALS DUAL MARQUEE SECTION (id="testimonials")
            ========================================================================= */}
        <section id="testimonials" className="py-16 sm:py-24 overflow-hidden relative">
          <div className="text-center mb-12 max-w-4xl mx-auto px-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-shape-xs border border-[var(--border-main)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] text-xs font-bold mb-3.5 shadow-2xs">
              <Sparkles size={14} className="text-[var(--fg-accent)]" />
              <span>{isRtl ? 'تقييمات المختصين وفرق العمل' : 'Verified Engineer & Creator Reviews'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-2.5 tracking-tight text-[var(--text-primary)] text-balance">
              {isRtl ? 'تجارب المطورين والباحثين وصناع المحتوى' : 'Trusted by Developers, Researchers & Creators'}
            </h2>
            <p className="text-xs sm:text-sm lg:text-[15px] text-[var(--text-secondary)] font-medium leading-relaxed max-w-3xl mx-auto text-balance">
              {isRtl ? 'شهادات موثقة لمختصين اعتمدوا على استوديوهات المنصة لتسريع بناء مشاريعهم.' : 'Verified feedback from professionals who accelerated their workflows with Perplexta.'}
            </p>
          </div>

          <div className="relative w-full overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
            {/* Smooth Edge Fade Masks matching page background */}
            <div className="absolute left-0 top-0 bottom-0 w-28 sm:w-52 bg-gradient-to-r from-[var(--surface-page)] via-[var(--surface-page)]/85 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-28 sm:w-52 bg-gradient-to-l from-[var(--surface-page)] via-[var(--surface-page)]/85 to-transparent z-10 pointer-events-none" />

            {/* Row 1 Marquee with Strict Pyramid Hierarchy */}
            <div className="flex gap-6 w-max animate-logo-scroll mb-6">
              {[...firstRow, ...firstRow, ...firstRow].map((review, idx) => (
                <div
                  key={`review-r1-${idx}`}
                  dir={isRtl ? 'rtl' : 'ltr'}
                  className="w-[350px] sm:w-[420px] p-5 sm:p-6 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] shadow-xs flex flex-col justify-between space-y-3 shrink-0 text-start hover:border-[var(--border-accent)] hover:shadow-md transition-all group"
                >
                  {/* Level 1 (Shortest - Header Level): Reviewer Profile, Role & 5-Star Rating */}
                  <div className="flex items-start justify-between gap-3 text-start">
                    <div className="flex items-center gap-3 text-start min-w-0">
                      <img
                        src={review.avatar}
                        alt={review.name}
                        className="w-10 h-10 aspect-square shrink-0 rounded-shape-xs object-cover border border-[var(--border-default)] shadow-2xs group-hover:scale-105 transition-transform"
                      />
                      <div className="min-w-0 text-start">
                        <div className="flex items-center gap-1.5 text-start">
                          <span className="text-xs sm:text-[13px] font-bold text-[var(--text-primary)] truncate">{review.name}</span>
                          <CheckCircle2 size={12} className="text-blue-500 shrink-0" />
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] font-medium truncate text-start">
                          {review.role} • <span className="font-mono dir-ltr inline-block">{review.username}</span>
                        </div>
                      </div>
                    </div>

                    {/* 5-Star Rating Indicator */}
                    <div role="img" className="flex items-center gap-0.5 text-amber-400 shrink-0" aria-label="5 stars rating">
                      {[...Array(5)].map((_, starIdx) => (
                        <Star key={starIdx} size={12} className="fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>

                  {/* Level 2 (Medium - Headline Level): Key Highlight Summary */}
                  <div className="text-xs sm:text-[13px] font-black text-[var(--text-primary)] leading-snug text-start">
                    {review.headline}
                  </div>

                  {/* Level 3 (Longest - Body Level): Detailed Testimonial Quote */}
                  <p className="text-xs sm:text-[12.5px] text-[var(--text-secondary)] leading-relaxed font-medium text-start">
                    "{review.body}"
                  </p>
                </div>
              ))}
            </div>

            {/* Row 2 Marquee (Reverse Direction) with Strict Pyramid Hierarchy */}
            <div className="flex gap-6 w-max animate-logo-scroll-reverse">
              {[...secondRow, ...secondRow, ...secondRow].map((review, idx) => (
                <div
                  key={`review-r2-${idx}`}
                  dir={isRtl ? 'rtl' : 'ltr'}
                  className="w-[350px] sm:w-[420px] p-5 sm:p-6 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] shadow-xs flex flex-col justify-between space-y-3 shrink-0 text-start hover:border-[var(--border-accent)] hover:shadow-md transition-all group"
                >
                  {/* Level 1 (Shortest - Header Level): Reviewer Profile, Role & 5-Star Rating */}
                  <div className="flex items-start justify-between gap-3 text-start">
                    <div className="flex items-center gap-3 text-start min-w-0">
                      <img
                        src={review.avatar}
                        alt={review.name}
                        className="w-10 h-10 aspect-square shrink-0 rounded-shape-xs object-cover border border-[var(--border-default)] shadow-2xs group-hover:scale-105 transition-transform"
                      />
                      <div className="min-w-0 text-start">
                        <div className="flex items-center gap-1.5 text-start">
                          <span className="text-xs sm:text-[13px] font-bold text-[var(--text-primary)] truncate">{review.name}</span>
                          <CheckCircle2 size={12} className="text-blue-500 shrink-0" />
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] font-medium truncate text-start">
                          {review.role} • <span className="font-mono dir-ltr inline-block">{review.username}</span>
                        </div>
                      </div>
                    </div>

                    {/* 5-Star Rating Indicator */}
                    <div role="img" className="flex items-center gap-0.5 text-amber-400 shrink-0" aria-label="5 stars rating">
                      {[...Array(5)].map((_, starIdx) => (
                        <Star key={starIdx} size={12} className="fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>

                  {/* Level 2 (Medium - Headline Level): Key Highlight Summary */}
                  <div className="text-xs sm:text-[13px] font-black text-[var(--text-primary)] leading-snug text-start">
                    {review.headline}
                  </div>

                  {/* Level 3 (Longest - Body Level): Detailed Testimonial Quote */}
                  <p className="text-xs sm:text-[12.5px] text-[var(--text-secondary)] leading-relaxed font-medium text-start">
                    "{review.body}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            10C. ENTERPRISE REFUND & BILLING GUARANTEE POLICY SECTION (id="refund-policy")
            ========================================================================= */}
        <section id="refund-policy" className="py-16 sm:py-24 max-w-6xl mx-auto px-4">
          <div className="p-8 sm:p-12 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] shadow-sm space-y-8">
            <div className="flex flex-col md:flex-row items-center gap-6 justify-between border-b border-[var(--border-main)] pb-6">
              <div className="flex items-center gap-4 text-start">
                <div className="w-14 h-14 rounded-shape-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/30 shrink-0">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--fg-success)] uppercase tracking-wider mb-1">
                    {isRtl ? 'اتفاقية الضمان المالي المعتمدة' : 'Official Financial Guarantee Agreement'}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
                    {isRtl ? 'سياسة الاسترداد والضمان النقدي (14 يوماً)' : '14-Day Money-Back Guarantee & Refund Policy'}
                  </h2>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-main)] text-xs font-mono font-bold text-[var(--text-secondary)]">
                <Lock size={13} className="text-emerald-500" />
                <span>{isRtl ? 'مسجل في دفتر الأستاذ المشفر' : 'Logged in Append-Only Ledger'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-medium text-start">
              <div className="p-5 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-main)] space-y-2 text-start">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-shape-xs bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-500">
                  <CheckCircle2 size={13} />
                  <span>{isRtl ? 'ضمان 100%' : '100% Guarantee'}</span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-[var(--text-primary)]">
                  {isRtl ? 'استرداد مالي كامل خلال 14 يوماً' : 'Full Refund Within 14 Days'}
                </h3>
                <p>
                  {isRtl 
                    ? 'يحق لكل مشترك جديد طلب استرداد مالي كامل بنسبة 100% خلال أول 14 يوماً من التفعيل، بشرط عدم تجاوز استهلاك الموارد نسبة 5%.'
                    : 'Every new subscriber is entitled to a 100% full refund within 14 days of activation, provided compute resource usage remains below 5%.'}
                </p>
              </div>

              <div className="p-5 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-main)] space-y-2 text-start">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-shape-xs bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-500">
                  <CheckCircle2 size={13} />
                  <span>{isRtl ? 'معالجة آلية' : 'Automated Refund'}</span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-[var(--text-primary)]">
                  {isRtl ? 'معالجة فورية وآمنة للمدفوعات' : 'Instant & Secure Processing'}
                </h3>
                <p>
                  {isRtl 
                    ? 'تتم معالجة طلبات الاسترداد آلياً عبر بوابة الدفع المركزية وإعادتها لذات وسيلة الدفع أو رصيد المحفظة خلال 3 إلى 5 أيام عمل.'
                    : 'Refund requests are processed automatically and credited back to the original payment method or wallet within 3-5 business days.'}
                </p>
              </div>

              <div className="p-5 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-main)] space-y-2 text-start">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-shape-xs bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-500">
                  <CheckCircle2 size={13} />
                  <span>{isRtl ? 'توثيق مالي' : 'Ledger Verified'}</span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-[var(--text-primary)]">
                  {isRtl ? 'شفافية تامة في الدفاتر المالية' : 'Absolute Ledger Transparency'}
                </h3>
                <p>
                  {isRtl 
                    ? 'تُسجل كافة المعاملات وعمليات الاسترداد في دفتر الأستاذ المالي المشفر غير القابل للتعديل لضمان حقوق كافة الأطراف.'
                    : 'All transactions and refunds are immutably logged in our append-only financial ledger guaranteeing complete auditability.'}
                </p>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border-main)]">
              <span className="text-xs text-[var(--text-muted)]">
                {isRtl ? 'هل لديك استفسار حول سياسة الفوترة؟ تواصل مع الدعم المالي مباشرة.' : 'Questions about billing? Contact our financial support directly.'}
              </span>
              <a
                href="#contact"
                className="h-10 px-5 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-main)] text-xs font-bold text-[var(--text-primary)] transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>{isRtl ? 'التواصل مع الدعم المالي' : 'Contact Financial Support'}</span>
                <ArrowRight size={14} className={isRtl ? 'rotate-180' : ''} />
              </a>
            </div>
          </div>
        </section>

        {/* =========================================================================
            10. FAQ SECTION (10 Comprehensive Questions in Professional 2 Columns)
            ========================================================================= */}
        <section id="faq" className="py-16 sm:py-24 max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12 max-w-4xl mx-auto px-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-shape-xs border border-[var(--border-main)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] text-xs font-bold mb-3.5 shadow-2xs">
              <HelpCircle size={14} className="text-[var(--fg-accent)]" />
              <span>{isRtl ? 'قاعدة المعرفة والأسئلة الشائعة' : 'Knowledge Base & Technical FAQ'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-2.5 tracking-tight text-[var(--text-primary)] text-balance">
              {isRtl ? 'الأسئلة التقنية الشائعة حول المنصة' : 'Frequently Asked Technical Questions'}
            </h2>
            <p className="text-xs sm:text-sm lg:text-[15px] text-[var(--text-secondary)] font-medium leading-relaxed max-w-3xl mx-auto text-balance">
              {isRtl
                ? 'إجابات تفصيلية تغطي بيئات البرمجة والتصميم، أمن البيانات، المحفظة المالية، ونظام العوائد.'
                : 'Detailed architectural answers covering Code & Design Studios, data security, wallets, royalties, and plans.'}
            </p>
          </div>

          {/* Professional 2-Column Grid (5 Questions Each Column) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-start">
            {/* Column 1: Questions 1 to 5 */}
            <div className="space-y-3.5">
              {faqs.slice(0, 5).map((faq, idx) => {
                const questionIndex = idx; // 0 to 4
                const isOpen = !!openFaqs[questionIndex];

                return (
                  <div
                    key={`faq-c1-${questionIndex}`}
                    className="rounded-shape-md border border-[var(--border-main)] bg-[var(--surface-card)] overflow-hidden transition-all shadow-xs hover:border-[var(--border-accent)] group"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(questionIndex)}
                      className="w-full min-h-[64px] sm:min-h-[68px] py-3.5 px-4 sm:px-5 flex items-center justify-between text-start gap-3.5 cursor-pointer text-[var(--text-primary)]"
                    >
                      <span className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="w-7 h-7 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-main)] flex items-center justify-center text-[var(--fg-accent)] shrink-0 text-xs font-black select-none">
                          {String(questionIndex + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[13.5px] sm:text-sm font-bold text-[var(--text-primary)] leading-snug">
                          {faq.title}
                        </span>
                      </span>
                      <div className="w-6 h-6 rounded-shape-xs flex items-center justify-center shrink-0 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
                        <Plus
                          className={`size-4.5 shrink-0 transition-transform duration-200 ${
                            isOpen ? 'rotate-45 text-[var(--fg-accent)]' : ''
                          }`}
                        />
                      </div>
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="px-5 sm:px-6 pb-6 text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed font-medium border-t border-[var(--border-main)] pt-4">
                            {faq.content}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Column 2: Questions 6 to 10 */}
            <div className="space-y-3.5">
              {faqs.slice(5, 10).map((faq, idx) => {
                const questionIndex = idx + 5; // 5 to 9
                const isOpen = !!openFaqs[questionIndex];

                return (
                  <div
                    key={`faq-c2-${questionIndex}`}
                    className="rounded-shape-md border border-[var(--border-main)] bg-[var(--surface-card)] overflow-hidden transition-all shadow-xs hover:border-[var(--border-accent)] group"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(questionIndex)}
                      className="w-full min-h-[64px] sm:min-h-[68px] py-3.5 px-4 sm:px-5 flex items-center justify-between text-start gap-3.5 cursor-pointer text-[var(--text-primary)]"
                    >
                      <span className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="w-7 h-7 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-main)] flex items-center justify-center text-[var(--fg-accent)] shrink-0 text-xs font-black select-none">
                          {String(questionIndex + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[13.5px] sm:text-sm font-bold text-[var(--text-primary)] leading-snug">
                          {faq.title}
                        </span>
                      </span>
                      <div className="w-6 h-6 rounded-shape-xs flex items-center justify-center shrink-0 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
                        <Plus
                          className={`size-4.5 shrink-0 transition-transform duration-200 ${
                            isOpen ? 'rotate-45 text-[var(--fg-accent)]' : ''
                          }`}
                        />
                      </div>
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="px-5 sm:px-6 pb-6 text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed font-medium border-t border-[var(--border-main)] pt-4">
                            {faq.content}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =========================================================================
            9B. UNIFIED CONTACT US SECTION (Exact Unified Platform Model matching Rinax)
            ========================================================================= */}
        <section id="contact" className="space-y-8 py-8 max-w-7xl mx-auto px-4 my-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent)]">
              <MessageSquare size={14} />
              <span>{isRtl ? 'تواصل معنا' : 'Contact Us'}</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
              {isRtl ? 'نحن هنا لدعم نجاحك وإجابة استفساراتك' : 'We Are Here to Support Your Success'}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)]">
              {isRtl ? 'أرسل لنا استفسارك، مقترحك، أو طلب الشراكة وسيتم الرد خلال ساعات معدودة.' : 'Send us your inquiry, proposal, or partnership request.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Visual Partnership & Support Image Column (5 cols - placed first on right) */}
            <div className="lg:col-span-5 order-1 lg:order-1 space-y-4">
              <div className="relative rounded-shape-lg overflow-hidden border border-[var(--border-main)] shadow-xl group aspect-4/3 lg:aspect-square">
                <img 
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=70" 
                  alt="Perplexta Support & Partnership"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-end p-6 text-white space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-shape-xs bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold w-fit">
                    <ShieldCheck size={12} />
                    <span>{isRtl ? 'فريق دعم فني معتمد' : 'Verified Support Team'}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight">
                    {isRtl ? 'شراكة حقيقية ونمو مستدام لمشاريعك' : 'True Partnership & Sustainable Growth'}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {isRtl ? 'نحن نؤمن بأن نجاحك هو نجاح لمنظومتنا، وفريقنا المتخصص مستعد دوماً لمساعدتك.' : 'We believe your success is our success. Our dedicated team is always ready.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Form Column (7 cols - placed second on left) */}
            <div className="lg:col-span-7 order-2 lg:order-2">
              {contactSubmitted ? (
                <div className="p-10 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] shadow-sm text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-500">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">
                    {isRtl ? 'تم استلام رسالتك بنجاح' : 'Message Received Successfully'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
                    {isRtl
                      ? 'نشكر تواصلك مع بيربليكستا. قام نظامنا بتوجيه استفسارك للفريق المختص وسيتواصل معك أحد مهندسينا خلال أقل من ساعتين.'
                      : 'Thank you for reaching out. Your inquiry has been routed to our dedicated staff, and an engineer will reply within 2 hours.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setContactSubmitted(false)}
                    className="h-10 px-6 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface-inset)] cursor-pointer"
                  >
                    {isRtl ? 'إرسال رسالة أخرى' : 'Send Another Message'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="p-6 sm:p-8 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] shadow-sm space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label htmlFor="overview-contact-name" className="space-y-1.5 block cursor-pointer">
                      <span className="text-xs font-bold text-[var(--text-secondary)] block">
                        {isRtl ? 'الاسم الكريم' : 'Full Name'}
                      </span>
                      <input
                        id="overview-contact-name"
                        name="contactName"
                        type="text"
                        required
                        aria-label={isRtl ? 'الاسم الكريم' : 'Full Name'}
                        title={isRtl ? 'الاسم الكريم' : 'Full Name'}
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder={isRtl ? 'مثال: أحمد الملا' : 'John Doe'}
                        className="w-full h-11 sm:h-10 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] text-sm sm:text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                      />
                    </label>

                    <label htmlFor="overview-contact-role" className="space-y-1.5 block cursor-pointer">
                      <span className="text-xs font-bold text-[var(--text-secondary)] block">
                        {isRtl ? 'المهنة أو التخصص' : 'Profession / Role'}
                      </span>
                      <input
                        id="overview-contact-role"
                        name="contactRole"
                        type="text"
                        aria-label={isRtl ? 'المهنة أو التخصص' : 'Profession / Role'}
                        title={isRtl ? 'المهنة أو التخصص' : 'Profession / Role'}
                        value={contactRole}
                        onChange={(e) => setContactRole(e.target.value)}
                        placeholder={isRtl ? 'مثال: مصمم واجهات، صانع محتوى' : 'Graphic Designer'}
                        className="w-full h-11 sm:h-10 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] text-sm sm:text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label htmlFor="overview-contact-reason" className="space-y-1.5 block cursor-pointer">
                      <span className="text-xs font-bold text-[var(--text-secondary)] block">
                        {isRtl ? 'سبب الاتصال' : 'Contact Reason'}
                      </span>
                      <select
                        id="overview-contact-reason"
                        name="contactReason"
                        aria-label={isRtl ? 'سبب الاتصال' : 'Contact Reason'}
                        title={isRtl ? 'سبب الاتصال' : 'Contact Reason'}
                        value={contactReason}
                        onChange={(e) => setContactReason(e.target.value)}
                        className="w-full h-11 sm:h-10 px-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] text-sm sm:text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                      >
                        <option value="suggestion">{isRtl ? 'اقتراح تطويري' : 'Feature Suggestion'}</option>
                        <option value="partnership">{isRtl ? 'طلب شراكة أو تعاون' : 'Partnership Request'}</option>
                        <option value="bug">{isRtl ? 'طلب دعم تقني' : 'Technical Support Request'}</option>
                        <option value="career">{isRtl ? 'طلب انضمام أو توظيف' : 'Career Opportunity'}</option>
                        <option value="other">{isRtl ? 'استفسار عام' : 'General Inquiry'}</option>
                      </select>
                    </label>

                    <label htmlFor="overview-contact-file" className="space-y-1.5 block cursor-pointer">
                      <span className="text-xs font-bold text-[var(--text-secondary)] block">
                        {isRtl ? 'إرفاق ملف أو صورة (اختياري - صور أو PDF فقط)' : 'Attach Image or PDF (Optional)'}
                      </span>
                      <input
                        id="overview-contact-file"
                        name="contactFile"
                        type="file"
                        accept="image/*,.pdf"
                        aria-label={isRtl ? 'إرفاق ملف أو صورة (اختياري - صور أو PDF فقط)' : 'Attach Image or PDF (Optional)'}
                        title={isRtl ? 'إرفاق ملف أو صورة (اختياري - صور أو PDF فقط)' : 'Attach Image or PDF (Optional)'}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                              toast.error(isRtl ? 'حجم الملف يجب ألا يتجاوز 10 ميجابايت' : 'File size must not exceed 10MB');
                              return;
                            }
                            setContactFile(file);
                          }
                        }}
                        className="w-full text-xs text-[var(--text-muted)] file:me-3 file:py-2.5 file:px-3.5 file:rounded-shape-xs file:border-0 file:text-xs file:font-bold file:bg-[var(--surface-subtle)] file:text-[var(--text-primary)] hover:file:bg-[var(--surface-inset)] cursor-pointer"
                      />
                    </label>
                  </div>

                  <label htmlFor="overview-contact-message" className="space-y-1.5 block cursor-pointer">
                    <span className="text-xs font-bold text-[var(--text-secondary)] block">
                      {isRtl ? 'نص الرسالة (يُمنع رفع الروابط أو الأكواد)' : 'Message (URLs and code snippets are prohibited)'}
                    </span>
                    <textarea
                      id="overview-contact-message"
                      name="contactMessage"
                      required
                      rows={3}
                      aria-label={isRtl ? 'نص الرسالة' : 'Message text'}
                      title={isRtl ? 'نص الرسالة' : 'Message text'}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder={isRtl ? 'اكتب تفاصيل استفسارك أو طلبك بوضوح...' : 'Write your message details clearly...'}
                      className="w-full p-3.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] text-sm sm:text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                    />
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {isRtl ? 'تنبيه أمني: يمنع منعاً باتاً إدراج روابط خارجية أو أكواد برمجية في الرسالة.' : 'Security note: External links and code snippets are strictly prohibited.'}
                    </p>
                  </label>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingContact}
                      className="relative w-full sm:w-auto h-10 px-6 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-bold text-xs leading-none shadow-sm hover:opacity-90 transition-all active:scale-95 cursor-pointer inline-flex items-center justify-center gap-2 before:absolute before:-inset-1 before:content-['']"
                    >
                      {isSubmittingContact ? <Loader2 size={15} className="animate-spin shrink-0" /> : <Send size={15} className="shrink-0" />}
                      <span>{isRtl ? 'إرسال الرسالة' : 'Send Message'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* =========================================================================
            9C. UNIFIED NEWSLETTER SECTION (Placed right before Start Journey)
            ========================================================================= */}
        <section id="newsletter" className="space-y-8 py-8 max-w-7xl mx-auto px-4 my-8">
          <div className="p-6 sm:p-10 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Visual Newsletter Image Column (5 cols - placed first, reversing position) */}
              <div className="lg:col-span-5 order-2 lg:order-1">
                <div className="relative rounded-shape-md overflow-hidden border border-[var(--border-main)] shadow-xl group aspect-4/3 lg:aspect-square">
                  <img 
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=70" 
                    alt="Perplexta Updates & Innovation"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-end p-6 text-white space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-shape-xs bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 text-[10px] font-bold w-fit">
                      <Zap size={12} />
                      <span>{isRtl ? 'تحديثات حصرية أسبوعية' : 'Weekly Exclusive Updates'}</span>
                    </div>
                    <h3 className="text-base font-black tracking-tight">
                      {isRtl ? 'كن دائماً في طليعة المبدعين وصناع المحتوى' : 'Always Stay Ahead of the Curve'}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Newsletter Text & Form Column (7 cols - placed second) */}
              <div className="lg:col-span-7 space-y-4 text-center lg:text-start order-1 lg:order-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-shape-full bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] border border-[color-mix(in_oklab,var(--accent)_25%,transparent)] text-[var(--accent)] text-xs font-bold">
                  <Globe size={14} />
                  <span>{isRtl ? 'النشرة البريدية الحصرية' : 'Exclusive Newsletter'}</span>
                </div>
                <h2 className="text-xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
                  {isRtl ? 'اشترك في نشرتنا البريدية حول التحديثات' : 'Subscribe to Our Product Updates'}
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed max-w-xl">
                  {isRtl ? 'احصل على أحدث القوالب، ميزات الذكاء الاصطناعي، وتحديثات استوديو رينكس مباشرة في بريدك الإلكتروني.' : 'Get the latest templates, AI features, and studio updates directly in your inbox.'}
                </p>

                {newsletterSubmitted ? (
                  <div className="p-3.5 rounded-shape-sm bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-bold text-xs flex items-center justify-center lg:justify-start gap-2 max-w-md">
                    <CheckCircle2 size={16} />
                    <span>{isRtl ? 'تم اشتراكك بنجاح في النشرة البريدية!' : 'Successfully subscribed to the newsletter!'}</span>
                  </div>
                ) : (
                  <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                    <input
                      type="email"
                      required
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder={isRtl ? 'ادخل بريدك الإلكتروني...' : 'Enter your email...'}
                      className="w-full sm:w-80 h-10 px-4 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                    />
                    <button
                      type="submit"
                      className="w-full sm:w-auto h-10 px-6 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-bold text-xs shadow-2xs hover:opacity-90 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Send size={14} />
                      <span>{isRtl ? 'اشتراك' : 'Subscribe'}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            9D. UNIFIED START YOUR JOURNEY SECTION (Exact Unified Platform Model matching Rinax)
            ========================================================================= */}
        <section id="start-journey" className="space-y-8 py-8 max-w-7xl mx-auto px-4 my-8">
          <div className="p-6 sm:p-10 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Text & Button Column (7 cols) */}
              <div className="lg:col-span-7 order-2 lg:order-1 space-y-4 text-center lg:text-start">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-shape-xs bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] border border-[color-mix(in_oklab,var(--accent)_25%,transparent)] text-[var(--accent)] text-xs font-bold">
                  <Sparkles size={14} />
                  <span>{isRtl ? 'ابدأ رحلتك اليوم' : 'Start Your Journey Today'}</span>
                </div>
                <h2 className="text-xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
                  {isRtl ? 'جاهز لبدء مشروعك التقني أو الإبداعي؟' : 'Ready to Launch Your Next Project?'}
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed max-w-xl">
                  {isRtl 
                    ? 'انضم إلينا اليوم مجاناً، وأنشئ مشاريعك بحماية مشفرة وحفظ كامل لحقوق الملكية الفكرية.' 
                    : 'Join thousands of developers and creators today. Register for free with full IP protection.'
                  }
                </p>
                <div className="pt-2 flex items-center justify-center lg:justify-start gap-3">
                  <button
                    type="button"
                    onClick={handleStartNow}
                    className="relative h-10 px-6 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-bold text-xs leading-none shadow-2xs hover:opacity-90 transition-all active:scale-95 cursor-pointer inline-flex items-center justify-center gap-2 before:absolute before:-inset-1 before:content-['']"
                  >
                    <UserPlus size={15} className="shrink-0" />
                    <span>{isRtl ? 'إنشاء حساب مجاني الآن' : 'Create Free Account'}</span>
                  </button>
                </div>
              </div>

              {/* Visual Launch Image Column (5 cols) */}
              <div className="lg:col-span-5 order-1 lg:order-2">
                <div className="relative rounded-shape-md overflow-hidden border border-[var(--border-main)] shadow-xl group aspect-4/3 lg:aspect-square">
                  <img 
                    src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=70" 
                    alt="Launch Creative Project"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-end p-6 text-white space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-shape-xs bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold w-fit">
                      <ShieldCheck size={12} />
                      <span>{isRtl ? 'تشفير قياسي وحماية الملكية' : 'Encrypted IP Protection'}</span>
                    </div>
                    <h3 className="text-base font-black tracking-tight">
                      {isRtl ? 'بيئة متكاملة للتطوير والتصميم وصناعة المحتوى' : 'Integrated Environment for Code & Design'}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================================
          11. FOOTER (Exact ChatDeck 4-Column Layout & Perplexta Tokens)
          ========================================================================= */}
      <footer className="border-t border-[var(--border-main)] bg-[var(--surface-subtle)] mt-24">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Brand Section */}
            <div>
              <div className="flex items-center gap-2.5 mb-4 group">
                <div className="w-8 h-8 rounded-shape-sm overflow-hidden border border-[var(--border-default)] flex items-center justify-center bg-[var(--surface-card)] shadow-2xs">
                  <Logo size={28} shape="none" showName={false} />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                  {brandName}
                </h3>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">
                {isRtl
                  ? 'منصة الحوسبة والذكاء الاصطناعي المتكاملة للمطورين والباحثين وصناع المحتوى.'
                  : 'Integrated cloud computing and AI platform for developers, researchers, and creators.'}
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-primary)] mb-6 opacity-90">
                {isRtl ? 'المنتجات والحلول' : 'Products & Solutions'}
              </h4>
              <ul className="flex flex-col text-[13px] font-bold text-[var(--text-muted)] space-y-1">
                <li><a href="#pricing" className="block py-3 hover:text-[var(--text-primary)] hover:text-[var(--fg-accent)] transition-all transform hover:translate-x-1">{isRtl ? 'باقات الأسعار' : 'Pricing Plans'}</a></li>
                <li><a href="#features" className="block py-3 hover:text-[var(--text-primary)] hover:text-[var(--fg-accent)] transition-all transform hover:translate-x-1">{isRtl ? 'المميزات والحلول' : 'Features Suite'}</a></li>
                <li><a href="#comparison" className="block py-3 hover:text-[var(--text-primary)] hover:text-[var(--fg-accent)] transition-all transform hover:translate-x-1">{isRtl ? 'مؤشرات الأداء والاعتماد' : 'System Performance Metrics'}</a></li>
                <li><a href="#modular-showcase" className="block py-3 hover:text-[var(--text-primary)] hover:text-[var(--fg-accent)] transition-all transform hover:translate-x-1">{isRtl ? 'معاينة كافة الاستوديوهات الحية' : 'Live Interactive Studio Preview'}</a></li>
              </ul>
            </div>

            {/* Platform Modules */}
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-primary)] mb-6 opacity-90">
                {isRtl ? 'الاستوديوهات والخدمات' : 'Studios & Applications'}
              </h4>
              <ul className="flex flex-col text-[13px] font-bold text-[var(--text-muted)] space-y-1">
                <li><button type="button" onClick={() => handleNavigateToSection('/app')} className="w-full py-2.5 border-0 bg-transparent text-start font-bold hover:text-[var(--text-primary)] hover:text-[var(--fg-accent)] transition-all transform hover:translate-x-1 cursor-pointer block">{isRtl ? 'استوديو تطوير البرمجيات (IDE)' : 'Software IDE Studio'}</button></li>
                <li><button type="button" onClick={() => handleNavigateToSection('/image-studio')} className="w-full py-2.5 border-0 bg-transparent text-start font-bold hover:text-[var(--text-primary)] hover:text-[var(--fg-accent)] transition-all transform hover:translate-x-1 cursor-pointer block">{isRtl ? 'استوديو التصميم والموشن (رينكس)' : 'Rinex Design & Motion Studio'}</button></li>
                <li><button type="button" onClick={() => handleNavigateToSection('/audio-studio')} className="w-full py-2.5 border-0 bg-transparent text-start font-bold hover:text-[var(--text-primary)] hover:text-[var(--fg-accent)] transition-all transform hover:translate-x-1 cursor-pointer block">{isRtl ? 'استوديو الهندسة والإنتاج الصوتي' : 'Audio Engineering Studio'}</button></li>
                <li><button type="button" onClick={() => handleNavigateToSection('/viralbook')} className="w-full py-2.5 border-0 bg-transparent text-start font-bold hover:text-[var(--text-primary)] hover:text-[var(--fg-accent)] transition-all transform hover:translate-x-1 cursor-pointer block">{isRtl ? 'مجتمع وشبكة فيرال بوك' : 'ViralBook Community & Hub'}</button></li>
                <li><button type="button" onClick={() => handleNavigateToSection('/creator')} className="w-full py-2.5 border-0 bg-transparent text-start font-bold hover:text-[var(--text-primary)] hover:text-[var(--fg-accent)] transition-all transform hover:translate-x-1 cursor-pointer block">{isRtl ? 'سوق القوالب وعوائد المبدعين' : 'Creator Royalties Hub'}</button></li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)] mb-4">
                {isRtl ? 'الحوكمة والقانونية' : 'Governance & Legal'}
              </h4>
              <ul className="flex flex-col text-xs font-medium text-[var(--text-muted)]">
                <li><Link to="/terms" className="block py-3 hover:text-[var(--text-primary)] hover:text-[var(--fg-accent)] transition-colors block">{isRtl ? 'شروط الخدمة' : 'Terms of Service'}</Link></li>
                <li><Link to="/privacy" className="block py-3 hover:text-[var(--text-primary)] hover:text-[var(--fg-accent)] transition-colors block">{isRtl ? 'سياسة الخصوصية' : 'Privacy Protection Policy'}</Link></li>
                <li><Link to="/docs/legal/10-billing-refund-policy" className="block py-3 hover:text-[var(--text-primary)] hover:text-[var(--fg-accent)] transition-colors block">{isRtl ? 'سياسة الاسترداد والفوترة' : 'Billing & Refund Guarantee Policy'}</Link></li>
                <li><a href="#faq" className="block py-3 hover:text-[var(--text-primary)] hover:text-[var(--fg-accent)] transition-colors block">{isRtl ? 'الأسئلة الشائعة والضمانات الرسمية' : 'Frequently Asked Questions & Guarantee'}</a></li>
                <li><Link to="/docs/legal" className="block py-3 hover:text-[var(--text-primary)] hover:text-[var(--fg-accent)] transition-colors block">{isRtl ? 'دليل الوثائق والحوكمة القانونية الشاملة' : 'Official Legal Governance Documentation Index'}</Link></li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-12 pt-8 border-t border-[var(--border-main)] text-center text-xs text-[var(--text-muted)]">
            <p>© {new Date().getFullYear()} {brandName}. {isRtl ? 'كافة الحقوق محفوظة.' : 'All rights reserved.'}</p>
          </div>
        </div>
      </footer>

      {/* Floating Live Assistant & Support Chat Widget */}
      {createPortal(
        <div className={`fixed bottom-5 ${isRtl ? 'left-5' : 'right-5'} z-[1000]`}>
          {/* Floating Launcher Button / Chat Drawer Modal */}
          <AnimatePresence mode="popLayout">
            {!isLiveAssistantOpen ? (
              <motion.button
                key="assistant-launcher"
                initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5, rotate: 20 }}
                type="button"
                onClick={() => {
                  setIsLiveAssistantOpen(true);
                  setShowAssistantSuggestions(false);
                }}
                title={isRtl ? 'المساعد الفوري والأسئلة المباشرة' : 'Live AI Concierge'}
                className="relative w-8 h-8 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] shadow-2xl flex items-center justify-center hover:opacity-95 transition-all active:scale-95 cursor-pointer border border-[var(--border-accent)]"
              >
                <MessageSquare size={16} />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-[var(--comp-button-primary-bg)]" />
                </span>
              </motion.button>
            ) : (
              <motion.div
                key="assistant-drawer"
                initial={{ opacity: 0, scale: 0.85, y: 30, filter: 'blur(20px)' }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.85, y: 30, filter: 'blur(20px)' }}
                transition={{ 
                  type: 'spring', 
                  damping: 28, 
                  stiffness: 300, 
                  mass: 1, 
                  duration: 0.5 
                }}
                style={{ transformOrigin: isRtl ? 'bottom left' : 'bottom right' }}
                className="w-[calc(100vw-32px)] sm:w-[400px] rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-accent)]/40 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col h-[560px] max-h-[82vh] relative backdrop-blur-3xl"
              >
                {/* Header */}
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="p-4 bg-[var(--surface-subtle)] border-b border-[var(--border-main)] flex items-center justify-between z-10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-main)] flex items-center justify-center text-[var(--fg-accent)] shadow-2xs relative shrink-0">
                      <Headphones size={16} />
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[var(--surface-card)] animate-pulse" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-[var(--text-primary)] tracking-tight">
                        {isRtl ? 'مساعد بيربليكستا' : 'Perplexta Assistant'}
                      </div>
                      <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-emerald-500" />
                        {isRtl ? 'نشط الآن' : 'Active Now'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLiveAssistantOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-shape-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] cursor-pointer transition-colors"
                  >
                    <X size={16} />
                  </button>
                </motion.div>

                {/* Chat Messages Feed */}
                <div 
                  ref={assistantMessagesRef}
                  className="flex-1 p-3.5 space-y-3.5 overflow-y-auto text-xs scroll-smooth"
                >
                  {assistantMessages.map((msg, idx) => {
                    return msg.sender === 'user' ? (
                      <div key={msg.id} className="w-full flex flex-col items-end gap-1.5 my-2 animate-in fade-in slide-in-from-right-2 duration-300">
                        <div className={`px-3.5 py-2 rounded-shape-md ${isRtl ? 'rounded-te-[2px]' : 'rounded-ts-[2px]'} border border-[var(--border-main)] bg-[var(--surface-subtle)] text-[var(--text-primary)] shadow-2xs max-w-[85%] sm:max-w-[80%]`}>
                          <p className="text-[12.5px] font-medium leading-relaxed break-words whitespace-pre-wrap">
                            {msg.text}
                          </p>
                        </div>
                        <span className="text-[9px] font-mono text-[var(--text-muted)] px-1 select-none">{msg.time}</span>
                      </div>
                    ) : (
                      <div key={msg.id} className="w-full relative py-3 space-y-3 animate-in fade-in slide-in-from-left-2 duration-400">
                        {/* Header matching AssistantMessageBubble */}
                        <div className="flex items-center justify-between gap-2.5 mb-2 px-0.5">
                          <div className="flex items-center gap-2">
                            <div className="relative flex items-center justify-center shrink-0 w-[24px] h-[24px]">
                              <Logo size={18} fallbackType="cpu" shape="circle" />
                              <CognitiveOrbitRing
                                isSpinning={isAssistantSending && idx === assistantMessages.length - 1}
                                dir={isRtl ? 'rtl' : 'ltr'}
                                size={26}
                                radius={10.5}
                                strokeWidth={1.2}
                                strokeDasharray="4 2"
                              />
                            </div>
                            <span className="text-[11px] font-bold text-[var(--text-primary)] tracking-tight">
                              {isRtl ? 'مساعد بيربليكستا' : 'Perplexta Assistant'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 bg-[var(--surface-subtle)] px-2 py-0.5 rounded-full border border-[var(--border-main)] shadow-2xs select-none">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--fg-accent)] animate-pulse" />
                            <span className="text-[9px] font-bold text-[var(--fg-accent)] uppercase tracking-wider">AI Support</span>
                          </div>
                        </div>

                        {/* Professional Chat Response Content */}
                        <div className="px-0.5 text-[13px] text-[var(--text-primary)] font-medium leading-relaxed whitespace-pre-wrap">
                          <TypewriterText text={msg.text} speed={10} />
                        </div>

                        {/* Action Link / Button (Re-styled for professional look) */}
                        {msg.actionLink && msg.actionLabel && (
                          <div className="pt-2 flex items-center w-full">
                            {msg.actionType === 'contact' || msg.actionLink === '#contact' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsLiveAssistantOpen(false);
                                  setContactReason('bug');
                                  const el = document.getElementById('contact');
                                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-accent)] text-xs font-bold text-[var(--fg-accent)] hover:bg-[var(--surface-inset)] cursor-pointer shadow-sm transition-all active:scale-95"
                              >
                                <span>{msg.actionLabel}</span>
                                <ArrowRight size={13} className={isRtl ? 'rotate-180' : ''} />
                              </button>
                            ) : (
                              <a
                                href={msg.actionLink}
                                onClick={() => {
                                  setIsLiveAssistantOpen(false);
                                  if (msg.actionLink?.startsWith('#')) {
                                    const el = document.querySelector(msg.actionLink);
                                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                                  }
                                }}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-main)] text-xs font-bold text-[var(--fg-accent)] hover:bg-[var(--surface-inset)] shadow-sm transition-all active:scale-95"
                              >
                                <span>{msg.actionLabel}</span>
                                <ArrowRight size={13} className={isRtl ? 'rotate-180' : ''} />
                              </a>
                            )}
                          </div>
                        )}

                        <div className="text-[9px] font-mono text-[var(--text-muted)] px-1 select-none">
                          {msg.time}
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing Indicator */}
                  {isAssistantSending && (
                    <div className="flex flex-col items-center justify-center my-2">
                      <div className="px-4 py-2.5 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-accent)]/50 text-xs text-[var(--text-primary)] font-bold flex items-center gap-2 font-mono shadow-2xs">
                        <Loader2 size={14} className="animate-spin text-[var(--fg-accent)]" />
                        <span>{isRtl ? 'جاري الصياغة والرد المباشر...' : 'Formulating live response...'}</span>
                      </div>
                    </div>
                  )}

                  {/* Visitor Limit Warning Card */}
                  {visitorMessageCount >= 5 && (
                    <div className="p-3.5 rounded-shape-md bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs space-y-2.5 animate-in fade-in duration-300">
                      <div className="flex items-center gap-2 font-black">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>{isRtl ? 'استنفدت الحد المسموح للأسئلة لهذا اليوم' : 'Daily question limit reached'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsLiveAssistantOpen(false);
                            setIsAuthModalOpen(true);
                          }}
                          className="px-4 py-2.5 min-h-[44px] rounded-shape-md bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-bold text-xs hover:opacity-90 cursor-pointer shadow-md flex items-center justify-center transition-all active:scale-95 w-full sm:w-auto"
                        >
                          {isRtl ? 'تسجيل الدخول / حساب جديد' : 'Sign In / Register'}
                        </button>
                        <a
                          href="#contact"
                          onClick={() => {
                            setIsLiveAssistantOpen(false);
                            setContactReason('bug');
                            const el = document.getElementById('contact');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="px-4 py-2.5 min-h-[44px] rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-main)] font-bold text-xs hover:bg-[var(--surface-inset)] cursor-pointer text-[var(--text-primary)] flex items-center justify-center transition-all active:scale-95 shadow-sm w-full sm:w-auto"
                        >
                          {isRtl ? 'فتح تذكرة اتصل بنا' : 'Contact Support'}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Form with Floating Popover Suggestions (Matching Image 2) */}
                <motion.form
                  ref={assistantInputPopoverRef}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendAssistantMessage();
                  }}
                  className="p-3 bg-[var(--surface-card)] border-t border-[var(--border-main)] relative flex items-center gap-2"
                >
                  {/* Front Small Dark Speech Bubble Popover Card (Matching image_7fb75122.png) */}
                  <AnimatePresence>
                    {showAssistantSuggestions && visitorMessageCount < 5 && (
                      <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={`absolute bottom-[calc(100%+8px)] ${isRtl ? 'right-2' : 'left-2'} z-50 bg-[#18181b] text-white rounded-xl shadow-2xl p-2.5 border border-zinc-700/80 font-sans text-start max-w-[340px] after:content-[''] after:absolute after:-bottom-2 ${isRtl ? 'after:right-12' : 'after:left-12'} after:border-8 after:border-transparent after:border-t-[#18181b]`}
                      >
                        <div className="flex flex-col space-y-0.5">
                          {[
                            isRtl ? 'ما هي أسعار الخطط والباقات؟' : 'What are the subscription plan prices?',
                            isRtl ? 'كيف تعمل سياسة الضمان والاسترداد؟' : 'How does the 14-day refund policy work?',
                            isRtl ? 'كيف أربح من برنامج المبدعين والقوالب؟' : 'How to earn royalties as a creator?',
                            isRtl ? 'أريد تقديم طلب دعم فني مباشر' : 'I want to submit a technical support ticket',
                            isRtl ? 'هل يمكن الربح من دعوة الأصدقاء؟' : 'Can I earn commissions by inviting friends?'
                          ].map((promptText, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setShowAssistantSuggestions(false);
                                handleSendAssistantMessage(promptText);
                              }}
                              className="w-full text-start px-3 py-2 rounded-lg text-xs sm:text-[12.5px] font-bold text-zinc-100 hover:text-white hover:bg-zinc-800/90 transition-colors cursor-pointer flex items-center justify-between"
                            >
                              <span className="leading-snug">{promptText}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <input
                    id="assistant-chat-input"
                    name="assistantChatInput"
                    type="text"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    aria-label={
                      visitorMessageCount >= 5 
                        ? (isRtl ? 'استنفدت الحد المسموح به للزوار' : 'Visitor limit reached')
                        : (isRtl ? 'اكتب سؤالك هنا عن خدمات المنصة' : 'Ask about platform capabilities')
                    }
                    disabled={visitorMessageCount >= 5 || isAssistantSending}
                    value={assistantInput}
                    onFocus={() => {
                      if (!assistantInput.trim()) setShowAssistantSuggestions(true);
                    }}
                    onClick={() => {
                      if (!assistantInput.trim()) setShowAssistantSuggestions(true);
                    }}
                    onChange={(e) => {
                      setAssistantInput(e.target.value);
                      if (e.target.value.trim().length > 0) {
                        setShowAssistantSuggestions(false);
                      }
                    }}
                    placeholder={
                      visitorMessageCount >= 5 
                        ? (isRtl ? 'استنفدت الحد المسموح به للزوار...' : 'Visitor limit reached...')
                        : (isRtl ? 'اكتب سؤالك هنا عن خدمات المنصة...' : 'Ask about platform capabilities...')
                    }
                    className="flex-1 px-3.5 py-2.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-accent)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  />
                  <button
                    type="submit"
                    aria-label={isRtl ? 'إرسال الرسالة' : 'Send message'}
                    disabled={visitorMessageCount >= 5 || isAssistantSending || !assistantInput.trim()}
                    className="w-10 h-10 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-bold text-xs flex items-center justify-center hover:opacity-90 transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isAssistantSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className={isRtl ? 'rotate-180' : ''} />}
                  </button>
                </motion.form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>,
        document.body
      )}

      {/* Native Project Auth Modal */}
      <AuthModal />
    </div>
  );
};

export default ProjectOverviewPage;
