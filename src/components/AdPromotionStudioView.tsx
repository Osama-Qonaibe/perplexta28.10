import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Rocket,
  MessageCircle,
  ThumbsUp,
  Globe,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  MapPin,
  Sparkles,
  Smartphone,
  Monitor,
  Film,
  Clock,
  Plus,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  Check,
  ShieldCheck,
  Edit3,
  Share2,
  Eye,
  Heart,
  Bookmark,
  ChevronUp,
  MoreHorizontal,
  Battery,
  Wifi,
  Disc,
  Volume2,
  MessageSquare,
  CheckCheck,
  Activity,
  Search,
  Sliders,
  Navigation,
  Briefcase,
  ShoppingBag,
  Cpu,
  GraduationCap,
  Crosshair,
  ZoomIn,
  ZoomOut,
  Minus,
  Info,
  ExternalLink,
  Zap,
  RotateCcw
} from 'lucide-react';
import { BulletinAd } from '../../server/db/types';
import { getMediaUrl } from '../utils/mediaUtils';
import { PALESTINE_GEO } from '../constants/geoData';
import { toast } from '@/design-system';
import { MASTER_PLATFORM_CATEGORIES } from '../constants/categories';

interface AdPromotionStudioViewProps {
  ad: BulletinAd;
  walletBalance: number;
  token: string | null;
  isRtl: boolean;
  onBack: () => void;
  onSuccess: (updatedAd: BulletinAd) => void;
  onNavigateToWallet?: () => void;
  onRequestDepositModal?: () => void;
}

export type CampaignGoal = 'automatic' | 'engagement' | 'traffic' | 'page_followers' | 'whatsapp_leads';
export type PlacementMode = 'mobile' | 'desktop' | 'reels' | 'story';
export type TargetGender = 'all' | 'male' | 'female';
export type AudiencePresetType = 'advantage_plus' | 'custom_targeted' | 'page_followers' | 'lookalike_followers' | 'local_area';
export type CtaButtonType = 'whatsapp_message' | 'send_message' | 'shop_now' | 'learn_more' | 'call_now' | 'book_now';
export type PromotionStatus = 'in_review' | 'scheduled' | 'active' | 'completed';

export interface SelectedGeoLocation {
  nameAr: string;
  nameEn: string;
  countryAr: string;
  countryEn: string;
  radiusKm: number; // 0 means city only
  lat: number;
  lng: number;
}

export interface DetailedTargetingItem {
  id: string;
  nameAr: string;
  nameEn: string;
  type: 'demographics' | 'interests' | 'behaviors';
  groupAr: string;
  groupEn: string;
  reachEstimate: string;
}

export const PROMOTION_STATUS_CONFIG: Record<PromotionStatus, {
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  badgeBg: string;
  badgeFg: string;
  badgeBorder: string;
  dotColor: string;
  icon: any;
}> = {
  in_review: {
    labelAr: 'قيد المراجعة',
    labelEn: 'In Review',
    descAr: 'فحص الإعلان والتحقق من التوافق مع السياسات الإعلانية.',
    descEn: 'Checking policy compliance and ad parameters.',
    badgeBg: 'bg-amber-500/10',
    badgeFg: 'text-amber-600 dark:text-amber-400',
    badgeBorder: 'border-amber-500/30',
    dotColor: 'bg-amber-500',
    icon: Clock
  },
  scheduled: {
    labelAr: 'مجدول',
    labelEn: 'Scheduled',
    descAr: 'تمت جدولة الحملة للانطلاق تلقائياً في التاريخ والوقت المحددين.',
    descEn: 'Campaign is scheduled to launch automatically at the chosen date and time.',
    badgeBg: 'bg-indigo-500/10',
    badgeFg: 'text-indigo-600 dark:text-indigo-400',
    badgeBorder: 'border-indigo-500/30',
    dotColor: 'bg-indigo-500',
    icon: Calendar
  },
  active: {
    labelAr: 'نشط',
    labelEn: 'Active',
    descAr: 'الحملة الإعلانية قيد التشغيل والعرض حالياً.',
    descEn: 'Campaign is live and active.',
    badgeBg: 'bg-[var(--status-success-subtle)]',
    badgeFg: 'text-[var(--fg-success)] dark:text-[var(--fg-success)]',
    badgeBorder: 'border-[var(--fg-success)]/30',
    dotColor: 'bg-[var(--fg-success)]',
    icon: Rocket
  },
  completed: {
    labelAr: 'مكتمل',
    labelEn: 'Completed',
    descAr: 'انتهت مدة الترويج المحددة للحملة.',
    descEn: 'Campaign duration finished successfully.',
    badgeBg: 'bg-blue-500/10',
    badgeFg: 'text-blue-600 dark:text-blue-400',
    badgeBorder: 'border-blue-500/30',
    dotColor: 'bg-blue-500',
    icon: CheckCheck
  }
};

const TIME_SLOTS_30MIN: string[] = Array.from({ length: 48 }, (_, idx) => {
  const h = String(Math.floor(idx / 2)).padStart(2, '0');
  const m = idx % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const ARABIC_WEEKDAYS = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const ENGLISH_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const GOAL_OPTIONS: {
  id: CampaignGoal;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  icon: any;
  badgeAr?: string;
  badgeEn?: string;
}[] = [
  {
    id: 'automatic',
    titleAr: 'تلقائي',
    titleEn: 'Automatic',
    descAr: 'يحدد النظام الهدف الأكثر ملاءمة استناداً إلى إعدادات المنشور وسلوك الجمهور.',
    descEn: 'Automatically selects the most relevant objective based on your post settings.',
    icon: Sparkles,
    badgeAr: 'تكيفي',
    badgeEn: 'Adaptive'
  },
  {
    id: 'engagement',
    titleAr: 'زيادة معدل التفاعل',
    titleEn: 'Get More Engagement',
    descAr: 'سيتم عرض إعلانك للأشخاص الذين من المرجح أن يتفاعلوا مع المنشور ويعلقوا عليه ويشاركوه.',
    descEn: 'Show your ad to people most likely to react, comment, and share.',
    icon: ThumbsUp
  },
  {
    id: 'traffic',
    titleAr: 'زيادة عمليات الشراء وزيارات الموقع',
    titleEn: 'Get More Website Purchases & Visits',
    descAr: 'سيتم عرض إعلانك للأشخاص الذين من المرجح أن ينقروا على رابط موقعك الإلكتروني.',
    descEn: 'Show your ad to people likely to click through to your website or store.',
    icon: Globe
  },
  {
    id: 'page_followers',
    titleAr: 'جذب المزيد من الزيارات والمتابعين إلى الصفحة',
    titleEn: 'Grow Page Visits & Followers',
    descAr: 'سيتم عرض إعلانك للأشخاص الذين من المرجح أن يزوروا صفحتك ويتابعوها.',
    descEn: 'Reach users likely to visit and follow your commercial page.',
    icon: Users
  },
  {
    id: 'whatsapp_leads',
    titleAr: 'تلقي المزيد من الرسائل',
    titleEn: 'Get More Messages',
    descAr: 'سيتم عرض إعلانك للأشخاص الذين من المحتمل أن يرسلوا إليك رسالة عبر واتساب أو صندوق الرسائل.',
    descEn: 'Show your ad to people likely to send you a direct message on WhatsApp or inbox.',
    icon: MessageCircle,
    badgeAr: 'موصى به',
    badgeEn: 'Recommended'
  }
];

const CTA_BUTTON_OPTIONS: {
  id: CtaButtonType;
  labelAr: string;
  labelEn: string;
}[] = [
  { id: 'whatsapp_message', labelAr: 'إرسال رسالة على واتساب', labelEn: 'Send WhatsApp Message' },
  { id: 'send_message', labelAr: 'إرسال رسالة', labelEn: 'Send Message' },
  { id: 'shop_now', labelAr: 'التسوق الآن', labelEn: 'Shop Now' },
  { id: 'learn_more', labelAr: 'تعرف على المزيد', labelEn: 'Learn More' },
  { id: 'call_now', labelAr: 'اتصال الآن', labelEn: 'Call Now' },
  { id: 'book_now', labelAr: 'احجز الآن', labelEn: 'Book Now' }
];

const AVAILABLE_GEO_LOCATIONS: SelectedGeoLocation[] = [
  { nameAr: 'فلسطين', nameEn: 'Palestine', countryAr: 'المنطقة بالكامل', countryEn: 'Country / Region', radiusKm: 40, lat: 31.9522, lng: 35.2332 },
  { nameAr: 'القدس الشريف', nameEn: 'Jerusalem', countryAr: 'فلسطين', countryEn: 'Palestine', radiusKm: 25, lat: 31.7683, lng: 35.2137 },
  { nameAr: 'رام الله والبيرة', nameEn: 'Ramallah & Al-Bireh', countryAr: 'فلسطين', countryEn: 'Palestine', radiusKm: 40, lat: 31.9038, lng: 35.2034 },
  { nameAr: 'غزة', nameEn: 'Gaza', countryAr: 'فلسطين', countryEn: 'Palestine', radiusKm: 25, lat: 31.5017, lng: 34.4668 },
  { nameAr: 'الخليل', nameEn: 'Hebron', countryAr: 'فلسطين', countryEn: 'Palestine', radiusKm: 35, lat: 31.5326, lng: 35.0998 },
  { nameAr: 'نابلس', nameEn: 'Nablus', countryAr: 'فلسطين', countryEn: 'Palestine', radiusKm: 30, lat: 32.2211, lng: 35.2544 },
  { nameAr: 'بيت لحم', nameEn: 'Bethlehem', countryAr: 'فلسطين', countryEn: 'Palestine', radiusKm: 20, lat: 31.7054, lng: 35.2024 },
  { nameAr: 'جنين', nameEn: 'Jenin', countryAr: 'فلسطين', countryEn: 'Palestine', radiusKm: 25, lat: 32.4646, lng: 35.2939 },
  { nameAr: 'طولكرم', nameEn: 'Tulkarm', countryAr: 'فلسطين', countryEn: 'Palestine', radiusKm: 20, lat: 32.3104, lng: 35.0286 },
  { nameAr: 'قلقيلية', nameEn: 'Qalqilya', countryAr: 'فلسطين', countryEn: 'Palestine', radiusKm: 20, lat: 32.1897, lng: 34.9706 },
  { nameAr: 'أريحا', nameEn: 'Jericho', countryAr: 'فلسطين', countryEn: 'Palestine', radiusKm: 25, lat: 31.8611, lng: 35.4618 },
  { nameAr: 'عمّان', nameEn: 'Amman', countryAr: 'الأردن', countryEn: 'Jordan', radiusKm: 40, lat: 31.9454, lng: 35.9284 },
  { nameAr: 'إربد', nameEn: 'Irbid', countryAr: 'الأردن', countryEn: 'Jordan', radiusKm: 30, lat: 32.5568, lng: 35.8469 },
  { nameAr: 'العقبة', nameEn: 'Aqaba', countryAr: 'الأردن', countryEn: 'Jordan', radiusKm: 30, lat: 29.5321, lng: 35.0063 },
  { nameAr: 'الرياض', nameEn: 'Riyadh', countryAr: 'السعودية', countryEn: 'Saudi Arabia', radiusKm: 50, lat: 24.7136, lng: 46.6753 },
  { nameAr: 'جدة', nameEn: 'Jeddah', countryAr: 'السعودية', countryEn: 'Saudi Arabia', radiusKm: 40, lat: 21.4858, lng: 39.1925 },
  { nameAr: 'دبي', nameEn: 'Dubai', countryAr: 'الإمارات', countryEn: 'UAE', radiusKm: 40, lat: 25.2048, lng: 55.2708 },
  { nameAr: 'القاهرة', nameEn: 'Cairo', countryAr: 'مصر', countryEn: 'Egypt', radiusKm: 50, lat: 30.0444, lng: 31.2357 }
];

const DETAILED_TARGETING_TAXONOMY: DetailedTargetingItem[] = [
  // 1. Demographics (البيانات الديموغرافية)
  { id: 'demo_edu_uni', nameAr: 'خريجو الجامعات والدراسات العليا', nameEn: 'University & Postgraduate Alumni', type: 'demographics', groupAr: 'التعليم', groupEn: 'Education', reachEstimate: '420K' },
  { id: 'demo_edu_students', nameAr: 'طلاب الجامعات والكليات', nameEn: 'College & University Students', type: 'demographics', groupAr: 'التعليم', groupEn: 'Education', reachEstimate: '310K' },
  { id: 'demo_edu_fields', nameAr: 'تخصصات الهندسة وتكنولوجيا المعلومات', nameEn: 'Engineering & IT Fields of Study', type: 'demographics', groupAr: 'التعليم', groupEn: 'Education', reachEstimate: '185K' },
  { id: 'demo_fin_high', nameAr: 'شريحة الدخل والقدرة الشرائية المرتفعة', nameEn: 'High Purchasing Power & Income Tier', type: 'demographics', groupAr: 'المالية والدخل', groupEn: 'Financial', reachEstimate: '140K' },
  { id: 'demo_fin_investors', nameAr: 'المستثمرون وأصحاب رؤوس الأموال', nameEn: 'Active Investors & Capital Owners', type: 'demographics', groupAr: 'المالية والدخل', groupEn: 'Financial', reachEstimate: '95K' },
  { id: 'demo_life_newlyweds', nameAr: 'المتزوجون حديثاً أو المخطوبون', nameEn: 'Newly Engaged or Newlyweds', type: 'demographics', groupAr: 'المناسبات الشخصية', groupEn: 'Life Events', reachEstimate: '110K' },
  { id: 'demo_life_newjob', nameAr: 'المنتقلون لوظيفة أو مسكن جديد', nameEn: 'Recently Moved or Started New Job', type: 'demographics', groupAr: 'المناسبات الشخصية', groupEn: 'Life Events', reachEstimate: '88K' },
  { id: 'demo_parents_all', nameAr: 'كل الآباء والأمهات', nameEn: 'All Parents', type: 'demographics', groupAr: 'الآباء والأسرة', groupEn: 'Parents', reachEstimate: '540K' },
  { id: 'demo_parents_early', nameAr: 'آباء وأمهات الأطفال (0 - 12 سنة)', nameEn: 'Parents with Children (0-12 yrs)', type: 'demographics', groupAr: 'الآباء والأسرة', groupEn: 'Parents', reachEstimate: '320K' },
  { id: 'demo_work_founders', nameAr: 'أصحاب الشركات والمديرون التنفيذيون', nameEn: 'Business Owners & Executives', type: 'demographics', groupAr: 'العمل والوظائف', groupEn: 'Work & Industry', reachEstimate: '165K' },
  { id: 'demo_work_freelance', nameAr: 'المستقلون وأصحاب المهن الحرة (Freelancers)', nameEn: 'Freelancers & Self-Employed', type: 'demographics', groupAr: 'العمل والوظائف', groupEn: 'Work & Industry', reachEstimate: '230K' },
  { id: 'demo_work_admin', nameAr: 'الإدارة والخدمات المكتبية والمحاسبة', nameEn: 'Management, Corporate & Accounting', type: 'demographics', groupAr: 'العمل والوظائف', groupEn: 'Work & Industry', reachEstimate: '190K' },

  // 2. Interests (الاهتمامات)
  { id: 'ecom_general_store', nameAr: 'التجارة الإلكترونية والتسوق عبر الإنترنت', nameEn: 'E-Commerce & Online Shopping', type: 'interests', groupAr: 'الأعمال والصناعة', groupEn: 'Business & Industry', reachEstimate: '680K' },
  { id: 'biz_digital_marketing', nameAr: 'التسويق الرقمي وإدارة الإعلانات', nameEn: 'Digital Marketing & Advertising', type: 'interests', groupAr: 'الأعمال والصناعة', groupEn: 'Business & Industry', reachEstimate: '290K' },
  { id: 'int_biz_entrepreneurship', nameAr: 'ريادة الأعمال والمشاريع الصغيرة (Small Business)', nameEn: 'Entrepreneurship & Small Business', type: 'interests', groupAr: 'الأعمال والصناعة', groupEn: 'Business & Industry', reachEstimate: '410K' },
  { id: 'int_biz_design', nameAr: 'التصميم الجرافيكي والموشن جرافيك', nameEn: 'Graphic Design & Motion Graphics', type: 'interests', groupAr: 'الأعمال والصناعة', groupEn: 'Business & Industry', reachEstimate: '215K' },
  { id: 'int_biz_realestate', nameAr: 'الاستثمار العقاري والمقاولات', nameEn: 'Real Estate & Construction', type: 'interests', groupAr: 'الأعمال والصناعة', groupEn: 'Business & Industry', reachEstimate: '340K' },
  { id: 'tech_software_dev', nameAr: 'تطوير البرمجيات والذكاء الاصطناعي', nameEn: 'Software Development & AI', type: 'interests', groupAr: 'التكنولوجيا والإلكترونيات', groupEn: 'Technology & Electronics', reachEstimate: '275K' },
  { id: 'int_tech_mobile', nameAr: 'الهواتف الذكية والأجهزة الإلكترونية', nameEn: 'Smartphones & Consumer Electronics', type: 'interests', groupAr: 'التكنولوجيا والإلكترونيات', groupEn: 'Technology & Electronics', reachEstimate: '790K' },
  { id: 'int_shop_fashion', nameAr: 'الأزياء والملابس والإكسسوارات', nameEn: 'Fashion, Apparel & Accessories', type: 'interests', groupAr: 'التسوق والموضة', groupEn: 'Shopping & Fashion', reachEstimate: '820K' },
  { id: 'int_shop_beauty', nameAr: 'مستحضرات التجميل والعناية الشخصية', nameEn: 'Cosmetics & Personal Care', type: 'interests', groupAr: 'التسوق والموضة', groupEn: 'Shopping & Fashion', reachEstimate: '610K' },
  { id: 'int_food_restaurants', nameAr: 'المطاعم والمقاهي والوجبات السريعة', nameEn: 'Restaurants, Cafes & Fast Food', type: 'interests', groupAr: 'المأكولات والمشروبات', groupEn: 'Food & Drink', reachEstimate: '750K' },
  { id: 'int_fitness_health', nameAr: 'اللياقة البدنية والصحة والتغذية', nameEn: 'Fitness, Health & Nutrition', type: 'interests', groupAr: 'اللياقة والصحة', groupEn: 'Fitness & Wellness', reachEstimate: '460K' },
  { id: 'int_auto_vehicles', nameAr: 'السيارات والمركبات وقطع الغيار', nameEn: 'Automobiles & Vehicles', type: 'interests', groupAr: 'السيارات والمركبات', groupEn: 'Automotive', reachEstimate: '390K' },

  // 3. Behaviors (السلوكيات)
  { id: 'beh_engaged_shoppers', nameAr: 'المتسوقون المتفاعلون (نقروا على زر التسوق مؤخراً)', nameEn: 'Engaged Shoppers', type: 'behaviors', groupAr: 'السلوك الشرائي', groupEn: 'Purchase Behavior', reachEstimate: '490K' },
  { id: 'beh_online_payers', nameAr: 'مستخدمو عمليات الدفع الإلكتروني (آخر 30 يوماً)', nameEn: 'Active Online Payment Users (30 Days)', type: 'behaviors', groupAr: 'السلوك الشرائي', groupEn: 'Purchase Behavior', reachEstimate: '240K' },
  { id: 'beh_page_admins', nameAr: 'مسؤولو الصفحات التجارية والمتاجر الرقمية', nameEn: 'Business Page & Store Admins', type: 'behaviors', groupAr: 'الأنشطة الرقمية', groupEn: 'Digital Activities', reachEstimate: '175K' },
  { id: 'beh_mobile_high_end', nameAr: 'مستخدمو الهواتف الذكية الحديثة واتصال 4G/5G', nameEn: 'High-End Mobile & Fast Network Users', type: 'behaviors', groupAr: 'مستخدمو الأجهزة المحمولة', groupEn: 'Mobile Device Users', reachEstimate: '670K' },
  { id: 'beh_frequent_travelers', nameAr: 'المسافرون الدائمون والمتنقلون بين المدن', nameEn: 'Frequent Travelers & Commuters', type: 'behaviors', groupAr: 'السفر والتنقل', groupEn: 'Travel & Commuting', reachEstimate: '210K' }
];

export const AdPromotionStudioView: React.FC<AdPromotionStudioViewProps> = ({
  ad,
  walletBalance,
  token,
  isRtl,
  onBack,
  onSuccess,
  onNavigateToWallet,
  onRequestDepositModal
}) => {
  const draftStorageKey = `perplexta_boost_draft_${ad.id}`;

  // Load saved draft state from sessionStorage if available
  const savedDraft = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(draftStorageKey);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return null;
  }, [draftStorageKey]);

  const [liveBalance, setLiveBalance] = useState<number>(walletBalance);

  useEffect(() => {
    setLiveBalance(walletBalance);
  }, [walletBalance]);

  const refreshWallet = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/wallet', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data) {
        const bal = parseFloat(data.balance) || 0;
        setLiveBalance(bal);
      }
    } catch (_) {}
  };

  useEffect(() => {
    refreshWallet();
    const handleWalletUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ balance?: number }>;
      if (typeof customEvent.detail?.balance === 'number') {
        setLiveBalance(customEvent.detail.balance);
      } else {
        refreshWallet();
      }
    };
    window.addEventListener('perplexta:wallet_balance_updated', handleWalletUpdate);
    window.addEventListener('focus', refreshWallet);
    return () => {
      window.removeEventListener('perplexta:wallet_balance_updated', handleWalletUpdate);
      window.removeEventListener('focus', refreshWallet);
    };
  }, [token]);

  // ============================================================================
  // CAMPAIGN STATE (Initialized from savedDraft or defaults)
  // ============================================================================
  const [goal, setGoal] = useState<CampaignGoal>(savedDraft?.goal || 'whatsapp_leads');
  const [advantageCreative, setAdvantageCreative] = useState<boolean>(savedDraft?.advantageCreative ?? true);
  const [ctaButton, setCtaButton] = useState<CtaButtonType>(savedDraft?.ctaButton || 'whatsapp_message');
  const [isCtaDropdownOpen, setIsCtaDropdownOpen] = useState<boolean>(false);
  const ctaDropdownRef = useRef<HTMLDivElement>(null);

  // Messaging & WhatsApp State
  const [whatsappNumber, setWhatsappNumber] = useState<string>(
    savedDraft?.whatsappNumber ?? (ad.whatsapp_number || ad.phone_number || '+970599000000')
  );
  const [countryCode, setCountryCode] = useState<string>(savedDraft?.countryCode || 'PS +970');
  const [welcomeMessage, setWelcomeMessage] = useState<string>(
    savedDraft?.welcomeMessage || 'مرحباً! يرجى إخبارنا بالطريقة التي يمكننا مساعدتك بها.'
  );
  const [quickQuestions, setQuickQuestions] = useState<string[]>(
    savedDraft?.quickQuestions || [
      'مرحباً! هل يمكنني الحصول على مزيد من المعلومات حول هذا؟',
      'كم السعر ومواعيد التوصيل والتوفر؟',
      'هل هذا العرض متوفر حالياً؟'
    ]
  );
  const [enablePrefilledQuestions, setEnablePrefilledQuestions] = useState<boolean>(
    savedDraft?.enablePrefilledQuestions ?? true
  );
  const [autoMessageRouting, setAutoMessageRouting] = useState<boolean>(
    savedDraft?.autoMessageRouting ?? false
  );
  const [destInbox, setDestInbox] = useState<boolean>(savedDraft?.destInbox ?? true);
  const [destWhatsApp, setDestWhatsApp] = useState<boolean>(savedDraft?.destWhatsApp ?? true);

  // Audience State
  const [audiencePreset, setAudiencePreset] = useState<AudiencePresetType>(
    savedDraft?.audiencePreset || 'custom_targeted'
  );
  const [gender, setGender] = useState<TargetGender>(savedDraft?.gender || 'all');
  const [ageMin, setAgeMin] = useState<number>(savedDraft?.ageMin || 18);
  const [ageMax, setAgeMax] = useState<number>(savedDraft?.ageMax || 55);
  const [selectedLocations, setSelectedLocations] = useState<SelectedGeoLocation[]>(
    savedDraft?.selectedLocations || [
      AVAILABLE_GEO_LOCATIONS[0], // فلسطين
      AVAILABLE_GEO_LOCATIONS[2]  // رام الله والبيرة
    ]
  );
  const [reachBeyondLocations, setReachBeyondLocations] = useState<boolean>(
    savedDraft?.reachBeyondLocations ?? true
  );
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    savedDraft?.selectedInterests || [
      'ecom_general_store',
      'biz_digital_marketing',
      'beh_online_payers',
      'demo_work_freelance'
    ]
  );

  // Schedule, Duration & Budget State
  const getTodayIso = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const getCurrentRoundedTime = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = now.getMinutes() < 30 ? '00' : '30';
    return `${h}:${m}`;
  };

  const [startDate, setStartDate] = useState<string>(() => {
    return savedDraft?.startDate || getTodayIso();
  });
  const [startTime, setStartTime] = useState<string>(() => {
    return savedDraft?.startTime || getCurrentRoundedTime();
  });
  const [scheduleMode, setScheduleMode] = useState<'continuous' | 'fixed_duration'>(
    savedDraft?.scheduleMode || 'fixed_duration'
  );
  const [durationDays, setDurationDays] = useState<number>(savedDraft?.durationDays || 7);
  const [runDuringBusinessHours, setRunDuringBusinessHours] = useState<boolean>(
    savedDraft?.runDuringBusinessHours ?? false
  );
  const [dailyBudget, setDailyBudget] = useState<number>(savedDraft?.dailyBudget || 30.00);
  const [flexibleBudgetBoost, setFlexibleBudgetBoost] = useState<boolean>(
    savedDraft?.flexibleBudgetBoost ?? false
  );
  const [shareBudgetAcrossPlacements, setShareBudgetAcrossPlacements] = useState<boolean>(
    savedDraft?.shareBudgetAcrossPlacements ?? false
  );

  // Custom Schedule Popovers & Inline Budget Edit State
  const [activeSchedulePopover, setActiveSchedulePopover] = useState<'none' | 'start_date' | 'start_time' | 'end_date'>('none');
  const [calendarViewMonth, setCalendarViewMonth] = useState<{ year: number; month: number }>(() => {
    const d = startDate ? new Date(`${startDate}T00:00:00`) : new Date();
    return {
      year: isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear(),
      month: isNaN(d.getTime()) ? new Date().getMonth() : d.getMonth()
    };
  });
  const [isEditingBudget, setIsEditingBudget] = useState<boolean>(false);
  const [budgetInputValue, setBudgetInputValue] = useState<string>(String(dailyBudget.toFixed(2)));
  const scheduleContainerRef = useRef<HTMLDivElement>(null);
  const timeListRef = useRef<HTMLDivElement>(null);
  const budgetInputRef = useRef<HTMLInputElement>(null);

  // Placements State
  const [autoPlacements, setAutoPlacements] = useState<boolean>(savedDraft?.autoPlacements ?? false);
  const [placementFeed, setPlacementFeed] = useState<boolean>(savedDraft?.placementFeed ?? true);
  const [placementReels, setPlacementReels] = useState<boolean>(savedDraft?.placementReels ?? true);
  const [placementMessages, setPlacementMessages] = useState<boolean>(savedDraft?.placementMessages ?? true);

  // Live Preview & Status State
  const [placementMode, setPlacementMode] = useState<PlacementMode>('mobile');
  const [previewStatus, setPreviewStatus] = useState<PromotionStatus>(() => {
    const existingSettings = typeof (ad as any).boost_settings === 'string'
      ? (() => { try { return JSON.parse((ad as any).boost_settings); } catch { return {}; } })()
      : ((ad as any).boost_settings || {});
    if (existingSettings?.scheduled_start_at && new Date(existingSettings.scheduled_start_at) > new Date()) {
      return 'scheduled';
    }
    if (ad.is_boosted) {
      if (ad.boosted_until && new Date(ad.boosted_until) < new Date()) return 'completed';
      if (ad.status === 'pending') return 'in_review';
      return 'active';
    }
    return ad.status === 'pending' ? 'in_review' : 'active';
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [liveGeoResults, setLiveGeoResults] = useState<SelectedGeoLocation[]>([]);

  // ============================================================================
  // POPUP MODALS STATE (بطاقات منبثقة احترافية)
  // ============================================================================
  const [activeModal, setActiveModal] = useState<
    null | 'goal' | 'template' | 'whatsapp_link' | 'audience' | 'all_previews'
  >(null);

  // Temporary states inside Modals before clicking "حفظ"
  const [tempGoal, setTempGoal] = useState<CampaignGoal>(goal);
  const [tempWelcomeMsg, setTempWelcomeMsg] = useState<string>(welcomeMessage);
  const [tempQuestions, setTempQuestions] = useState<string[]>(quickQuestions);
  const [newQuestionInput, setNewQuestionInput] = useState<string>('');
  const [tempWhatsappPhone, setTempWhatsappPhone] = useState<string>(whatsappNumber);

  // Audience Modal Internal States
  const [audienceModalView, setAudienceModalView] = useState<'main' | 'browse_taxonomy'>('main');
  const [taxonomyTab, setTaxonomyTab] = useState<'demographics' | 'interests' | 'behaviors'>('interests');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'الأعمال والصناعة': true,
    'التعليم': true,
    'السلوك الشرائي': true
  });
  const [locationSearchQuery, setLocationSearchQuery] = useState<string>('');
  const [isLocationSuggestionsOpen, setIsLocationSuggestionsOpen] = useState<boolean>(false);
  const [openRadiusDropdownCity, setOpenRadiusDropdownCity] = useState<string | null>(null);
  const [targetingSearchQuery, setTargetingSearchQuery] = useState<string>('');
  const [mapZoom, setMapZoom] = useState<number>(8);
  const [isPinDropActive, setIsPinDropActive] = useState<boolean>(false);
  const audienceScrollRef = useRef<HTMLDivElement>(null);

  // Lock background scroll when any modal is active and reset audience modal scroll position to top
  useEffect(() => {
    if (!activeModal) return;
    const prevBodyOverflow = document.body.style.overflow;
    const scrollContainers = Array.from(document.querySelectorAll<HTMLElement>('.main-scroll-container'));
    const prevContainerOverflows = scrollContainers.map(el => el.style.overflow);

    document.body.style.overflow = 'hidden';
    scrollContainers.forEach(el => {
      el.style.overflow = 'hidden';
    });

    if (audienceScrollRef.current) {
      audienceScrollRef.current.scrollTop = 0;
    }

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      scrollContainers.forEach((el, idx) => {
        el.style.overflow = prevContainerOverflows[idx] || '';
      });
    };
  }, [activeModal, audienceModalView]);

  // Persist campaign draft in sessionStorage on any change
  useEffect(() => {
    try {
      sessionStorage.setItem(
        draftStorageKey,
        JSON.stringify({
          goal,
          advantageCreative,
          ctaButton,
          whatsappNumber,
          countryCode,
          welcomeMessage,
          quickQuestions,
          enablePrefilledQuestions,
          autoMessageRouting,
          destInbox,
          destWhatsApp,
          audiencePreset,
          gender,
          ageMin,
          ageMax,
          selectedLocations,
          reachBeyondLocations,
          selectedInterests,
          startDate,
          startTime,
          scheduleMode,
          durationDays,
          runDuringBusinessHours,
          dailyBudget,
          flexibleBudgetBoost,
          shareBudgetAcrossPlacements,
          autoPlacements,
          placementFeed,
          placementReels,
          placementMessages
        })
      );
    } catch (_) {}
  }, [
    draftStorageKey,
    goal,
    advantageCreative,
    ctaButton,
    whatsappNumber,
    countryCode,
    welcomeMessage,
    quickQuestions,
    enablePrefilledQuestions,
    autoMessageRouting,
    destInbox,
    destWhatsApp,
    audiencePreset,
    gender,
    ageMin,
    ageMax,
    selectedLocations,
    reachBeyondLocations,
    selectedInterests,
    startDate,
    startTime,
    scheduleMode,
    durationDays,
    runDuringBusinessHours,
    dailyBudget,
    flexibleBudgetBoost,
    shareBudgetAcrossPlacements,
    autoPlacements,
    placementFeed,
    placementReels,
    placementMessages
  ]);

  // Close CTA dropdown & Schedule popovers on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ctaDropdownRef.current && !ctaDropdownRef.current.contains(e.target as Node)) {
        setIsCtaDropdownOpen(false);
      }
      if (scheduleContainerRef.current && !scheduleContainerRef.current.contains(e.target as Node)) {
        setActiveSchedulePopover('none');
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Scroll Time Picker to active time when opened
  useEffect(() => {
    if (activeSchedulePopover === 'start_time' && timeListRef.current) {
      const activeEl = timeListRef.current.querySelector('[data-active-time="true"]') as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'center' });
      }
    }
  }, [activeSchedulePopover]);

  // Focus inline budget input when editing starts
  useEffect(() => {
    if (isEditingBudget && budgetInputRef.current) {
      budgetInputRef.current.focus();
      budgetInputRef.current.select();
    }
  }, [isEditingBudget]);

  // Dynamic live geocoding search for Audience Modal
  useEffect(() => {
    const q = locationSearchQuery.trim();
    if (q.length < 2) {
      setLiveGeoResults([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/bulletin/geocoding/search?q=${encodeURIComponent(q)}&limit=10&lang=${isRtl ? 'ar' : 'en'}`,
          { signal: ctrl.signal }
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.results)) {
            const mapped: SelectedGeoLocation[] = data.results.map((r: any) => ({
              nameAr: r.city || r.title || q,
              nameEn: r.city || r.title || q,
              countryAr: r.country || r.subtitle || 'موقع جغرافي',
              countryEn: r.country || r.subtitle || 'Location',
              radiusKm: 25,
              lat: parseFloat(r.lat) || 31.9038,
              lng: parseFloat(r.lon) || 35.2034
            }));
            setLiveGeoResults(mapped);
          }
        }
      } catch (_) {}
    }, 300);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [locationSearchQuery, isRtl]);

  // ============================================================================
  // CALCULATIONS & FORMATTED VALUES
  // ============================================================================
  const effectiveDays = scheduleMode === 'continuous' ? 7 : Math.max(1, durationDays);
  const totalCost = Number((effectiveDays * dailyBudget).toFixed(2));
  const hasSufficientBalance = liveBalance >= totalCost;
  const missingAmount = Math.max(0, totalCost - liveBalance);

  // Detect if user selected a future start date or time (> 5 minutes from now)
  const scheduledStartDateObj = useMemo(() => {
    if (!startDate) return null;
    const timePart = startTime && /^\d{2}:\d{2}$/.test(startTime) ? startTime : '00:00';
    const d = new Date(`${startDate}T${timePart}:00`);
    return isNaN(d.getTime()) ? null : d;
  }, [startDate, startTime]);

  const isScheduledForFuture = useMemo(() => {
    if (!scheduledStartDateObj) return false;
    return scheduledStartDateObj.getTime() > Date.now() + 5 * 60 * 1000;
  }, [scheduledStartDateObj]);

  // Daily Reach Formula (Matches reference video scale e.g. $30/day -> 9K - 16.7K, $45/day -> 13.4K - 24.9K)
  const estReachMin = Math.round(dailyBudget * 300);
  const estReachMax = Math.round(dailyBudget * 555);
  const estActionsMin = Math.max(2, Math.round(dailyBudget * 0.45));
  const estActionsMax = Math.max(5, Math.round(dailyBudget * 1.15));

  const formatCompactNumber = (num: number) => {
    if (num >= 1000) {
      const k = (num / 1000).toFixed(1).replace(/\.0$/, '');
      return isRtl ? `${k} ألف` : `${k}K`;
    }
    return String(num);
  };

  const formatSlashDate = (isoDate: string) => {
    if (!isoDate) return '';
    return isoDate.replace(/-/g, '/');
  };

  const computedEndDate = useMemo(() => {
    const base = startDate ? new Date(`${startDate}T00:00:00`) : new Date();
    if (isNaN(base.getTime())) return '';
    base.setDate(base.getDate() + effectiveDays);
    const y = base.getFullYear();
    const m = String(base.getMonth() + 1).padStart(2, '0');
    const d = String(base.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [startDate, effectiveDays]);

  const endDateFormatted = useMemo(() => {
    const base = startDate ? new Date(`${startDate}T00:00:00`) : new Date();
    if (isNaN(base.getTime())) return '';
    base.setDate(base.getDate() + effectiveDays);
    return base.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, [startDate, effectiveDays, isRtl]);

  const scheduledStartFormatted = useMemo(() => {
    if (!scheduledStartDateObj) return '';
    return `${formatSlashDate(startDate)} (${startTime})`;
  }, [scheduledStartDateObj, startDate, startTime]);

  const activeGoalObj = GOAL_OPTIONS.find(g => g.id === goal) || GOAL_OPTIONS[4];
  const activeCtaObj = CTA_BUTTON_OPTIONS.find(c => c.id === ctaButton) || CTA_BUTTON_OPTIONS[0];

  const getCtaIcon = (cta: CtaButtonType, isColored = true) => {
    switch (cta) {
      case 'whatsapp_message':
        return <MessageCircle size={13} className={isColored ? 'text-[#25D366]' : ''} />;
      case 'send_message':
        return <MessageSquare size={13} className={isColored ? 'text-accent' : ''} />;
      case 'shop_now':
        return <ShoppingBag size={13} className={isColored ? 'text-accent' : ''} />;
      case 'call_now':
        return <Phone size={13} className={isColored ? 'text-accent' : ''} />;
      case 'book_now':
        return <Calendar size={13} className={isColored ? 'text-accent' : ''} />;
      case 'learn_more':
      default:
        return <ExternalLink size={13} className={isColored ? 'text-accent' : ''} />;
    }
  };

  // Resolve detailed targeting objects
  const resolvedTargetingItems = useMemo(() => {
    return selectedInterests.map(id => {
      const fromTax = DETAILED_TARGETING_TAXONOMY.find(item => item.id === id);
      if (fromTax) return fromTax;
      const fromMaster = MASTER_PLATFORM_CATEGORIES.find(c => c.id === id);
      if (fromMaster) {
        return {
          id: fromMaster.id,
          nameAr: fromMaster.nameAr,
          nameEn: fromMaster.nameEn,
          type: 'interests' as const,
          groupAr: fromMaster.groupAr,
          groupEn: fromMaster.groupEn,
          reachEstimate: '180K'
        };
      }
      return {
        id,
        nameAr: id,
        nameEn: id,
        type: 'interests' as const,
        groupAr: 'اهتمامات عامة',
        groupEn: 'General Interests',
        reachEstimate: '120K'
      };
    });
  }, [selectedInterests]);

  const filteredGeoSuggestions = useMemo(() => {
    const q = locationSearchQuery.trim().toLowerCase();
    const combinedPool = [...AVAILABLE_GEO_LOCATIONS];
    for (const dyn of liveGeoResults) {
      if (!combinedPool.some(item => item.nameAr === dyn.nameAr)) {
        combinedPool.push(dyn);
      }
    }
    return combinedPool.filter(loc => {
      const alreadyAdded = selectedLocations.some(s => s.nameAr === loc.nameAr);
      if (alreadyAdded) return false;
      if (!q) return true;
      return (
        loc.nameAr.toLowerCase().includes(q) ||
        loc.nameEn.toLowerCase().includes(q) ||
        loc.countryAr.toLowerCase().includes(q)
      );
    });
  }, [locationSearchQuery, selectedLocations, liveGeoResults]);

  const filteredTaxonomyItems = useMemo(() => {
    const q = targetingSearchQuery.trim().toLowerCase();
    return DETAILED_TARGETING_TAXONOMY.filter(item => {
      if (q) {
        return (
          item.nameAr.toLowerCase().includes(q) ||
          item.nameEn.toLowerCase().includes(q) ||
          item.groupAr.toLowerCase().includes(q)
        );
      }
      return item.type === taxonomyTab;
    });
  }, [targetingSearchQuery, taxonomyTab]);

  const groupedTaxonomy = useMemo(() => {
    const groups: Record<string, DetailedTargetingItem[]> = {};
    filteredTaxonomyItems.forEach(item => {
      const gKey = isRtl ? item.groupAr : item.groupEn;
      if (!groups[gKey]) groups[gKey] = [];
      groups[gKey].push(item);
    });
    return groups;
  }, [filteredTaxonomyItems, isRtl]);

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleAddGeoLocation = (loc: SelectedGeoLocation) => {
    if (!selectedLocations.some(l => l.nameAr === loc.nameAr)) {
      setSelectedLocations(prev => [...prev, loc]);
    }
    setLocationSearchQuery('');
    setIsLocationSuggestionsOpen(false);
  };

  const handleRemoveGeoLocation = (nameAr: string) => {
    if (selectedLocations.length <= 1) {
      toast.info(isRtl ? 'يجب الإبقاء على موقع جغرافي واحد على الأقل' : 'At least one location is required');
      return;
    }
    setSelectedLocations(prev => prev.filter(l => l.nameAr !== nameAr));
  };

  const handleUpdateLocationRadius = (nameAr: string, radiusKm: number) => {
    setSelectedLocations(prev =>
      prev.map(l => (l.nameAr === nameAr ? { ...l, radiusKm } : l))
    );
    setOpenRadiusDropdownCity(null);
  };

  const handleToggleTargetingItem = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCommitBudgetEdit = () => {
    setIsEditingBudget(false);
    const parsed = parseFloat(budgetInputValue.replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed) && parsed >= 1) {
      const clamped = Math.min(500, Math.max(1, Number(parsed.toFixed(2))));
      setDailyBudget(clamped);
      setBudgetInputValue(clamped.toFixed(2));
    } else {
      setBudgetInputValue(dailyBudget.toFixed(2));
    }
  };

  const handleResetToNow = () => {
    const nowIso = getTodayIso();
    const nowTime = getCurrentRoundedTime();
    setStartDate(nowIso);
    setStartTime(nowTime);
    toast.success(isRtl ? 'تم الضبط على الانطلاق الفوري بالوقت الفعلي' : 'Set to launch immediately in real-time');
  };

  // Interactive Calendar Popover Renderer (Used for both Start Date and End Date)
  const renderCalendarPopover = (mode: 'start_date' | 'end_date') => {
    const fallbackDate = startDate ? new Date(`${startDate}T00:00:00`) : new Date();
    const year =
      typeof calendarViewMonth?.year === 'number' && !isNaN(calendarViewMonth.year)
        ? calendarViewMonth.year
        : fallbackDate.getFullYear();
    const month =
      typeof calendarViewMonth?.month === 'number' && !isNaN(calendarViewMonth.month)
        ? calendarViewMonth.month
        : fallbackDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun ... 6 = Sat
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const todayStr = getTodayIso();
    const minDateStr = mode === 'end_date' ? startDate : todayStr;
    const selectedDateStr = mode === 'start_date' ? startDate : computedEndDate;

    const cells: { day: number; currentMonth: boolean; dateStr: string; disabled: boolean }[] = [];

    // Leading days from previous month
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const pm = month === 0 ? 12 : month;
      const py = month === 0 ? year - 1 : year;
      const dateStr = `${py}-${String(pm).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isDisabled = mode === 'end_date' ? dateStr <= minDateStr : dateStr < minDateStr;
      cells.push({ day: d, currentMonth: false, dateStr, disabled: isDisabled });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isDisabled = mode === 'end_date' ? dateStr <= minDateStr : dateStr < minDateStr;
      cells.push({ day: d, currentMonth: true, dateStr, disabled: isDisabled });
    }

    // Trailing days to complete 5 rows (35 cells) or 6 rows (42 cells)
    const totalCells = cells.length <= 35 ? 35 : 42;
    const remaining = totalCells - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const nm = month === 11 ? 1 : month + 2;
      const ny = month === 11 ? year + 1 : year;
      const dateStr = `${ny}-${String(nm).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isDisabled = mode === 'end_date' ? dateStr <= minDateStr : dateStr < minDateStr;
      cells.push({ day: d, currentMonth: false, dateStr, disabled: isDisabled });
    }

    const handleSelectCell = (cell: typeof cells[0]) => {
      if (cell.disabled) return;
      if (mode === 'start_date') {
        setStartDate(cell.dateStr);
      } else {
        const startObj = new Date(`${startDate}T00:00:00`);
        const endObj = new Date(`${cell.dateStr}T00:00:00`);
        const diffDays = Math.max(1, Math.round((endObj.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24)));
        setDurationDays(Math.min(90, diffDays));
      }
      setActiveSchedulePopover('none');
    };

    const goPrevMonth = () => {
      setCalendarViewMonth(
        month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
      );
    };

    const goNextMonth = () => {
      setCalendarViewMonth(
        month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
      );
    };

    const weekdays = isRtl ? ARABIC_WEEKDAYS : ENGLISH_WEEKDAYS;
    const monthTitle = `${isRtl ? ARABIC_MONTHS[month] : ENGLISH_MONTHS[month]} ${year}`;

    return (
      <div
        className="absolute top-full mt-1.5 start-0 z-50 w-[290px] sm:w-[310px] p-3.5 rounded-shape-md bg-[#242526] text-white border border-white/15 shadow-2xl select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Month Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <button
            type="button"
            onClick={goPrevMonth}
            className="w-8 h-8 rounded-shape-xs hover:bg-white/10 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            {isRtl ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          <div className="flex items-center gap-1.5 font-extrabold text-sm text-white">
            <span>{monthTitle}</span>
            <ChevronDown size={14} className="text-gray-400" />
          </div>

          <button
            type="button"
            onClick={goNextMonth}
            className="w-8 h-8 rounded-shape-xs hover:bg-white/10 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            {isRtl ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
          {weekdays.map((dayName) => (
            <span key={dayName} className="text-[11px] font-bold text-gray-400 py-1">
              {dayName}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {cells.map((cell, idx) => {
            const isSelected = cell.dateStr === selectedDateStr;
            const isToday = cell.dateStr === todayStr;
            return (
              <button
                key={`${cell.dateStr}-${idx}`}
                type="button"
                disabled={cell.disabled}
                onClick={() => handleSelectCell(cell)}
                className={`h-8 rounded-shape-xs text-xs font-mono font-bold flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'bg-[#2d88ff] text-white font-black shadow-sm cursor-pointer'
                    : cell.disabled
                    ? 'text-gray-500/40 cursor-not-allowed'
                    : !cell.currentMonth
                    ? 'text-gray-400 hover:bg-white/10 cursor-pointer'
                    : isToday
                    ? 'border border-[#2d88ff] text-[#2d88ff] hover:bg-[#2d88ff]/20 cursor-pointer'
                    : 'text-gray-100 hover:bg-white/10 cursor-pointer'
                }`}
              >
                {cell.day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const handleLaunchPromotion = async () => {
    if (!token) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً لإطلاق الحملة الإعلانية' : 'Please log in first to launch campaign');
      return;
    }

    if (!hasSufficientBalance) {
      toast.error(
        isRtl
          ? `رصيد المحفظة الحالي ($${liveBalance.toFixed(2)}) غير كافٍ لتغطية تكلفة الحملة ($${totalCost.toFixed(2)} USD).`
          : `Insufficient wallet balance ($${liveBalance.toFixed(2)}). $${totalCost.toFixed(2)} required.`
      );
      if (onRequestDepositModal) onRequestDepositModal();
      else if (onNavigateToWallet) onNavigateToWallet();
      return;
    }

    setIsSubmitting(true);

    try {
      const scheduledIso = isScheduledForFuture && scheduledStartDateObj
        ? scheduledStartDateObj.toISOString()
        : null;

      const payload = {
        days: effectiveDays,
        daily_budget: dailyBudget,
        tierName: isRtl ? activeGoalObj.titleAr : activeGoalObj.titleEn,
        goal,
        settings: {
          objective: goal,
          advantage_creative: advantageCreative,
          cta_button: ctaButton,
          whatsapp_number: whatsappNumber,
          country_code: countryCode,
          welcome_message: welcomeMessage,
          quick_questions: enablePrefilledQuestions ? quickQuestions : [],
          enable_prefilled_questions: enablePrefilledQuestions,
          auto_message_routing: autoMessageRouting,
          destinations: {
            inbox: destInbox,
            whatsapp: destWhatsApp
          },
          audience_preset: audiencePreset,
          target_gender: gender,
          age_min: ageMin,
          age_max: ageMax,
          target_cities: selectedLocations.map(l => l.nameAr),
          target_locations_detail: selectedLocations,
          reach_beyond_locations: reachBeyondLocations,
          target_interests: selectedInterests,
          start_date: startDate,
          start_time: startTime,
          is_scheduled: isScheduledForFuture,
          scheduled_start_at: scheduledIso,
          boost_status: isScheduledForFuture ? 'scheduled' : 'active',
          schedule_mode: scheduleMode,
          run_during_business_hours: runDuringBusinessHours,
          daily_budget: dailyBudget,
          flexible_budget_boost: flexibleBudgetBoost,
          share_budget_across_placements: shareBudgetAcrossPlacements,
          total_budget: totalCost,
          duration_days: effectiveDays,
          auto_placements: autoPlacements,
          placements: {
            feed: placementFeed,
            reels: placementReels,
            messages: placementMessages
          }
        }
      };

      const res = await fetch(`/api/bulletin/ads/${ad.id}/boost-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.ad) {
        const newCalculatedBalance =
          typeof data.new_balance === 'number'
            ? data.new_balance
            : Math.max(0, liveBalance - totalCost);

        setLiveBalance(newCalculatedBalance);
        window.dispatchEvent(
          new CustomEvent('perplexta:wallet_balance_updated', {
            detail: { balance: newCalculatedBalance }
          })
        );

        try {
          sessionStorage.removeItem(draftStorageKey);
        } catch (_) {}

        toast.success(
          isScheduledForFuture
            ? (isRtl
                ? `تمت جدولة الحملة الإعلانية بنجاح للانطلاق في ${scheduledStartFormatted}! تم حجز $${totalCost.toFixed(2)} USD.`
                : `Campaign scheduled for ${scheduledStartFormatted}! $${totalCost.toFixed(2)} USD reserved.`)
            : (isRtl
                ? `تم تأكيد وإطلاق الحملة الإعلانية بنجاح! تم خصم $${totalCost.toFixed(2)} USD من المحفظة.`
                : `Ad campaign launched successfully! $${totalCost.toFixed(2)} USD deducted.`)
        );
        onSuccess(data.ad);
        onBack();
      } else {
        toast.error(data.error || (isRtl ? 'تعذر إطلاق الحملة الترويجية' : 'Failed to launch campaign'));
      }
    } catch (err) {
      console.error('[Promotion Studio] Launch error:', err);
      toast.error(isRtl ? 'حدث خطأ تقني أثناء معالجة الحملة الإعلانية' : 'Error processing campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface-page)] text-[var(--text-primary)] pb-24 transition-theme" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* ==================================================================== */}
      {/* TOP NAVIGATION HEADER                                                */}
      {/* ==================================================================== */}
      <header className="sticky top-0 z-30 bg-[var(--surface-card)]/95 backdrop-blur-md border-b border-[var(--border-main)] shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="h-8 min-h-[32px] max-h-[32px] px-3 rounded-shape-sm touch-target-44-expanded bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-main)] transition-theme inline-flex items-center gap-2 cursor-pointer shrink-0"
            >
              {isRtl ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
              <span className="h-[23px] leading-[23px] inline-flex items-center text-xs font-bold">
                {isRtl ? 'رجوع' : 'Back'}
              </span>
            </button>
            <div className="h-5 w-px bg-[var(--border-main)] hidden sm:block shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-[var(--text-primary)] truncate">
                  {isRtl ? 'إدارة الحملات والترويج الإعلاني' : 'Campaign & Promotion Manager'}
                </h1>
                <span className="text-[11px] text-[var(--text-muted)] hidden md:inline">·</span>
                <span className="text-[11px] font-medium text-[var(--text-muted)] truncate hidden md:inline">
                  {ad.title || (isRtl ? 'منشور إعلاني' : 'Sponsored Post')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="h-8 min-h-[32px] max-h-[32px] px-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] inline-flex items-center gap-2 text-xs">
              <Wallet size={14} className="text-[var(--fg-success)] shrink-0" />
              <span className="text-[var(--text-muted)] font-medium hidden sm:inline">
                {isRtl ? 'الرصيد المتاح:' : 'Balance:'}
              </span>
              <span className="h-[23px] leading-[23px] inline-flex items-center font-extrabold text-[var(--fg-success)] font-mono">
                ${liveBalance.toFixed(2)} USD
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* MAIN 2-COLUMN WORKSPACE                                              */}
      {/* ==================================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================================================================ */}
          {/* COLUMN 1: CONFIGURATION CARDS WITH POPUP MODALS & DROPDOWNS (7)  */}
          {/* ================================================================ */}
          <div className="lg:col-span-7 space-y-4">

            {/* -------------------------------------------------------------- */}
            {/* CARD 1: الهدف (CAMPAIGN GOAL - OPENS POPUP MODAL)               */}
            {/* -------------------------------------------------------------- */}
            <section className="bg-[var(--surface-card)] rounded-shape-md border border-[var(--border-main)] p-4 sm:p-5 shadow-2xs">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-shape-sm bg-accent/10 border border-accent/20 text-accent flex items-center justify-center shrink-0 mt-0.5">
                    <activeGoalObj.icon size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-[var(--text-muted)]">
                        {isRtl ? 'الهدف' : 'Objective'}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">·</span>
                      <h2 className="text-sm font-extrabold text-[var(--text-primary)]">
                        {isRtl ? activeGoalObj.titleAr : activeGoalObj.titleEn}
                      </h2>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                      {isRtl ? activeGoalObj.descAr : activeGoalObj.descEn}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setTempGoal(goal);
                    setActiveModal('goal');
                  }}
                  className="h-8 min-h-[32px] max-h-[32px] px-3.5 rounded-shape-sm touch-target-44-expanded bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-primary)] border border-[var(--border-main)] text-xs font-bold transition-theme inline-flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <span className="h-[23px] leading-[23px] inline-flex items-center">
                    {isRtl ? 'تغيير' : 'Change'}
                  </span>
                </button>
              </div>
            </section>

            {/* -------------------------------------------------------------- */}
            {/* CARD 2: محتوى الإعلان والزر (CREATIVE, ADVANTAGE+ & CTA MENU)   */}
            {/* -------------------------------------------------------------- */}
            <section className="bg-[var(--surface-card)] rounded-shape-md border border-[var(--border-main)] p-4 sm:p-5 shadow-2xs space-y-4">
              {/* Content Row */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--border-main)]">
                <div className="space-y-1 min-w-0 flex-1">
                  <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
                    {isRtl ? 'المحتوى ونص الإعلان' : 'Ad Content & Copy'}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                    {ad.description || ad.title}
                  </p>
                </div>
                {(ad.image_url || ad.video_url) && (
                  <img
                    src={getMediaUrl(ad.image_url) || '/default-avatar.png'}
                    alt={ad.title}
                    className="w-14 h-14 rounded-shape-sm object-cover border border-[var(--border-main)] shrink-0"
                  />
                )}
              </div>

              {/* Advantage+ Creative Toggle */}
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--border-main)]">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-accent" />
                    <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                      {isRtl ? 'تحسين التصميم التلقائي (Advantage+)' : 'Advantage+ Creative Optimization'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    {isRtl
                      ? 'الاستفادة من بيانات المنصة لعرض إصدارات محسّنة لتصميم الإعلان تلقائياً عندما يحسّن ذلك من الأداء.'
                      : 'Automatically optimize media framing and visual contrast per placement to maximize performance.'}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={advantageCreative}
                  onClick={() => setAdvantageCreative(!advantageCreative)}
                  className={`w-11 h-6 rounded-shape-full p-0.5 transition-colors cursor-pointer shrink-0 flex items-center ${
                    advantageCreative ? 'bg-accent justify-end' : 'bg-gray-300 dark:bg-gray-700 justify-start'
                  }`}
                >
                  <span className="w-5 h-5 rounded-shape-full bg-white shadow-xs block" />
                </button>
              </div>

              {/* CTA Button Dropdown Menu (قائمة منبثقة للزر) */}
              <div className="space-y-3">
                <div ref={ctaDropdownRef} className="relative">
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                    {isRtl ? 'الزر (إجراء الحث على التفاعل)' : 'Button (Call to Action)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCtaDropdownOpen(!isCtaDropdownOpen)}
                    className="w-full h-10 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-main)] text-xs sm:text-sm font-bold text-[var(--text-primary)] flex items-center justify-between transition-theme cursor-pointer"
                  >
                    <span>{isRtl ? activeCtaObj.labelAr : activeCtaObj.labelEn}</span>
                    <ChevronDown size={15} className={`text-[var(--text-muted)] transition-transform ${isCtaDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Popup Dropdown List */}
                  <AnimatePresence>
                    {isCtaDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.12 }}
                        className="absolute inset-x-0 top-full mt-1.5 z-40 bg-[var(--surface-card)] border border-[var(--border-main)] rounded-shape-md shadow-xl p-1.5 space-y-0.5"
                      >
                        {CTA_BUTTON_OPTIONS.map((opt) => {
                          const isSel = ctaButton === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setCtaButton(opt.id);
                                setIsCtaDropdownOpen(false);
                              }}
                              className={`w-full h-9 px-3 rounded-shape-sm text-xs font-bold flex items-center justify-between transition-theme cursor-pointer ${
                                isSel
                                  ? 'bg-accent/10 text-accent'
                                  : 'text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
                              }`}
                            >
                              <span>{isRtl ? opt.labelAr : opt.labelEn}</span>
                              <span className={`w-4 h-4 rounded-shape-full border flex items-center justify-center ${
                                isSel ? 'border-accent bg-accent text-white' : 'border-[var(--border-main)]'
                              }`}>
                                {isSel && <span className="w-1.5 h-1.5 rounded-shape-full bg-white" />}
                              </span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Connected WhatsApp Business Number Box */}
                <div className="p-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-shape-xs bg-[#25D366]/15 text-[#25D366] flex items-center justify-center shrink-0">
                      <MessageCircle size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] text-[var(--text-muted)] block">
                        {isRtl ? 'رقم واتساب للأعمال المرتبط' : 'Connected WhatsApp Business Number'}
                      </span>
                      <span className="text-xs font-extrabold font-mono text-[var(--text-primary)] block truncate" dir="ltr">
                        {whatsappNumber || '+970599000000'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTempWhatsappPhone(whatsappNumber);
                      setActiveModal('whatsapp_link');
                    }}
                    className="h-8 min-h-[32px] max-h-[32px] px-3 rounded-shape-sm touch-target-44-expanded bg-[var(--surface-card)] hover:bg-[var(--surface-inset)] border border-[var(--border-main)] text-xs font-bold text-[var(--text-primary)] inline-flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <span className="h-[23px] leading-[23px] inline-flex items-center">
                      {isRtl ? 'تعديل' : 'Edit'}
                    </span>
                  </button>
                </div>
              </div>
            </section>

            {/* -------------------------------------------------------------- */}
            {/* CARD 3: المراسلة وقالب الرسالة الترحيبية (MESSAGING & TEMPLATE)  */}
            {/* -------------------------------------------------------------- */}
            <section className="bg-[var(--surface-card)] rounded-shape-md border border-[var(--border-main)] p-4 sm:p-5 shadow-2xs space-y-4">
              <div>
                <h2 className="text-sm font-extrabold text-[var(--text-primary)]">
                  {isRtl ? 'المراسلة وقالب الرسالة' : 'Messaging & Welcome Template'}
                </h2>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  {isRtl
                    ? 'حدد طريقة الترحيب بالأشخاص وتوجيه رسائلهم بعد نقرهم على إعلانك.'
                    : 'Configure how users are greeted and routed when they click your ad.'}
                </p>
              </div>

              {/* Welcome Message Template Summary Box */}
              <div className="p-3.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[var(--text-primary)]">
                    {isRtl ? 'قالب الرسالة الترحيبية الافتراضية' : 'Default Welcome Message Template'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setTempWelcomeMsg(welcomeMessage);
                        setTempQuestions([...quickQuestions]);
                        setActiveModal('template');
                      }}
                      className="h-8 min-h-[32px] max-h-[32px] px-2.5 rounded-shape-sm touch-target-44-expanded bg-[var(--surface-card)] hover:bg-[var(--surface-inset)] border border-[var(--border-main)] text-xs font-bold text-[var(--text-primary)] inline-flex items-center gap-1.5 cursor-pointer"
                      title={isRtl ? 'تعديل قالب الرسالة' : 'Edit Message Template'}
                    >
                      <Edit3 size={13} className="text-accent" />
                      <span className="h-[23px] leading-[23px] inline-flex items-center">
                        {isRtl ? 'تعديل القالب' : 'Edit Template'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs border-t border-[var(--border-main)]/60 pt-2.5">
                  <div>
                    <span className="text-[11px] font-bold text-[var(--text-muted)] block">
                      {isRtl ? 'الرسالة الترحيبية:' : 'Greeting Message:'}
                    </span>
                    <p className="text-[var(--text-primary)] font-medium mt-0.5">{welcomeMessage}</p>
                  </div>
                  {quickQuestions.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold text-[var(--text-muted)] block">
                        {isRtl ? 'رسالة مسبقة الملء للعميل:' : 'Pre-filled Customer Inquiry:'}
                      </span>
                      <p className="text-[var(--text-secondary)] mt-0.5">{quickQuestions[0]}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Destinations Routing */}
              <div className="space-y-2.5 pt-1 border-t border-[var(--border-main)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-extrabold text-[var(--text-primary)]">
                      {isRtl ? 'وجهة الرسائل' : 'Message Destinations'}
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {isRtl ? 'حدد التطبيقات التي تريد إرسال الأشخاص إليها لبدء المحادثة.' : 'Select applications where customer messages will be routed.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoMessageRouting}
                    onClick={() => setAutoMessageRouting(!autoMessageRouting)}
                    className={`w-10 h-5 rounded-shape-full p-0.5 transition-colors cursor-pointer flex items-center ${
                      autoMessageRouting ? 'bg-accent justify-end' : 'bg-gray-300 dark:bg-gray-700 justify-start'
                    }`}
                    title={isRtl ? 'الوجهة التلقائية' : 'Automatic Destination'}
                  >
                    <span className="w-4 h-4 rounded-shape-full bg-white shadow-2xs block" />
                  </button>
                </div>

                <div className="space-y-2">
                  {/* Option 1: Platform Inbox */}
                  <label className="flex items-center justify-between p-2.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={destInbox}
                        onChange={(e) => setDestInbox(e.target.checked)}
                        className="w-4 h-4 accent-accent rounded-shape-xs cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-[var(--text-primary)] block">
                          {isRtl ? 'صندوق رسائل المنصة المباشر' : 'Platform Direct Messenger'}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] block">
                          {ad.page_name || ad.author_name || (isRtl ? 'حساب المعلن' : 'Advertiser Account')}
                        </span>
                      </div>
                    </div>
                    <MessageSquare size={16} className="text-accent" />
                  </label>

                  {/* Option 2: WhatsApp Business */}
                  <div className="p-2.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] space-y-2.5">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={destWhatsApp}
                          onChange={(e) => setDestWhatsApp(e.target.checked)}
                          className="w-4 h-4 accent-accent rounded-shape-xs cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-bold text-[var(--text-primary)] block">
                            {isRtl ? 'واتساب للأعمال (WhatsApp)' : 'WhatsApp Business'}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] font-mono block" dir="ltr">
                            {whatsappNumber}
                          </span>
                        </div>
                      </div>
                      <MessageCircle size={16} className="text-[#25D366]" />
                    </label>

                    {destWhatsApp && (
                      <div className="flex items-center gap-2 pt-1 border-t border-[var(--border-main)]/50">
                        <button
                          type="button"
                          onClick={() => {
                            setTempWhatsappPhone(whatsappNumber);
                            setActiveModal('whatsapp_link');
                          }}
                          className="h-8 min-h-[32px] max-h-[32px] px-3 rounded-shape-sm bg-[var(--surface-card)] hover:bg-[var(--surface-inset)] border border-[var(--border-main)] text-xs font-bold text-[var(--text-primary)] inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus size={13} className="text-accent" />
                          <span className="h-[23px] leading-[23px] inline-flex items-center">
                            {isRtl ? 'إضافة أو تغيير الرقم' : 'Add / Change Number'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* -------------------------------------------------------------- */}
            {/* CARD 4: الجمهور (AUDIENCE SETUP & POPUP MODAL TRIGGER)          */}
            {/* -------------------------------------------------------------- */}
            <section className="bg-[var(--surface-card)] rounded-shape-md border border-[var(--border-main)] p-4 sm:p-5 shadow-2xs space-y-4">
              <div>
                <h2 className="text-sm font-extrabold text-[var(--text-primary)]">
                  {isRtl ? 'الجمهور' : 'Audience'}
                </h2>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  {isRtl ? 'حدد من يجب أن يرى إعلانك.' : 'Define who should see your ad.'}
                </p>
              </div>

              {/* Radio List of Audience Presets (Matching Video 00:42 - 00:45) */}
              <div className="space-y-3">
                {/* 1. Advantage+ Recommended Audience */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="audience_preset"
                    checked={audiencePreset === 'advantage_plus'}
                    onChange={() => setAudiencePreset('advantage_plus')}
                    className="mt-1 w-4 h-4 accent-accent cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] block">
                      {isRtl ? 'الجمهور باستخدام +Advantage' : 'Advantage+ Audience'}
                    </span>
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mt-0.5">
                      {isRtl
                        ? 'يستخدم النظام بيانات النشاط لتحسين الاستهداف تلقائياً والوصول إلى الفئات الأكثر استجابة.'
                        : 'Automatically finds and adapts to the highest-converting audience segments.'}
                    </p>
                  </div>
                </label>

                {/* 2. Custom Targeted Audience (With Summary Box & Edit Modal Button) */}
                <div className="space-y-2.5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="audience_preset"
                      checked={audiencePreset === 'custom_targeted'}
                      onChange={() => setAudiencePreset('custom_targeted')}
                      className="w-4 h-4 accent-accent cursor-pointer"
                    />
                    <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                      {isRtl ? 'الأشخاص الذين تختارهم عن طريق الاستهداف' : 'People you choose through targeting'}
                    </span>
                  </label>

                  {/* Audience Details Summary Box (Matching Video 00:43) */}
                  <div className="ms-7 p-3.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] flex items-start justify-between gap-3">
                    <div className="space-y-1.5 text-xs min-w-0 flex-1">
                      <span className="font-extrabold text-[var(--text-primary)] block">
                        {isRtl ? 'تفاصيل الجمهور' : 'Audience Details'}
                      </span>
                      <div className="text-[11px] text-[var(--text-secondary)] space-y-1 leading-relaxed">
                        <p>
                          <span className="text-[var(--text-muted)]">{isRtl ? 'الموقع: ' : 'Location: '}</span>
                          <span className="font-semibold text-[var(--text-primary)]">
                            {selectedLocations
                              .map(l =>
                                isRtl
                                  ? `${l.nameAr}${l.radiusKm > 0 ? ` (+${l.radiusKm} كم)` : ''}`
                                  : `${l.nameEn}${l.radiusKm > 0 ? ` (+${l.radiusKm} km)` : ''}`
                              )
                              .join('، ')}
                          </span>
                        </p>
                        <p>
                          <span className="text-[var(--text-muted)]">{isRtl ? 'العمر: ' : 'Age: '}</span>
                          <span className="font-semibold font-mono text-[var(--text-primary)]">
                            {ageMin} - {ageMax >= 65 ? '+65' : ageMax}
                          </span>
                          <span className="mx-2 text-[var(--text-muted)]">·</span>
                          <span className="text-[var(--text-muted)]">{isRtl ? 'الجنس: ' : 'Gender: '}</span>
                          <span className="font-semibold text-[var(--text-primary)]">
                            {gender === 'all'
                              ? isRtl ? 'الكل' : 'All'
                              : gender === 'male'
                              ? isRtl ? 'الرجال' : 'Men'
                              : isRtl ? 'النساء' : 'Women'}
                          </span>
                        </p>
                        {resolvedTargetingItems.length > 0 && (
                          <p className="line-clamp-2">
                            <span className="text-[var(--text-muted)]">
                              {isRtl ? 'الأشخاص الذين يتطابقون مع: ' : 'People who match: '}
                            </span>
                            <span className="font-semibold text-[var(--text-primary)]">
                              {resolvedTargetingItems
                                .map(item => (isRtl ? item.nameAr : item.nameEn))
                                .join('، ')}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Pencil Edit Button -> Opens "تعديل الجمهور" Popup Modal */}
                    <button
                      type="button"
                      onClick={() => {
                        setAudiencePreset('custom_targeted');
                        setAudienceModalView('main');
                        setActiveModal('audience');
                      }}
                      className="w-8 h-8 min-w-[32px] max-w-[32px] min-h-[32px] max-h-[32px] rounded-shape-sm touch-target-44-expanded bg-[var(--surface-card)] hover:bg-[var(--surface-inset)] border border-[var(--border-main)] text-[var(--text-primary)] flex items-center justify-center transition-theme cursor-pointer shrink-0"
                      title={isRtl ? 'تعديل الجمهور' : 'Edit Audience'}
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>
                </div>

                {/* 3. Page Followers */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="audience_preset"
                    checked={audiencePreset === 'page_followers'}
                    onChange={() => setAudiencePreset('page_followers')}
                    className="w-4 h-4 accent-accent cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                    {isRtl ? 'الأشخاص المتابعون لملفك الشخصي أو صفحتك' : 'People who follow your profile or page'}
                  </span>
                </label>

                {/* 4. Followers + Lookalike */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="audience_preset"
                    checked={audiencePreset === 'lookalike_followers'}
                    onChange={() => setAudiencePreset('lookalike_followers')}
                    className="w-4 h-4 accent-accent cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                    {isRtl
                      ? 'الأشخاص المتابعون لملفك الشخصي والأشخاص المشابهون لهم'
                      : 'People who follow you and people similar to them'}
                  </span>
                </label>

                {/* 5. Local Area */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="audience_preset"
                    checked={audiencePreset === 'local_area'}
                    onChange={() => setAudiencePreset('local_area')}
                    className="w-4 h-4 accent-accent cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                    {isRtl ? 'الأشخاص في منطقتك المحلية' : 'People in your local area'}
                  </span>
                </label>
              </div>

              {/* Audience Card Footer Buttons */}
              <div className="pt-2 border-t border-[var(--border-main)] flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAudiencePreset('custom_targeted');
                    setAudienceModalView('main');
                    setActiveModal('audience');
                  }}
                  className="h-8 min-h-[32px] max-h-[32px] px-3.5 rounded-shape-sm touch-target-44-expanded bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-main)] text-xs font-bold text-[var(--text-primary)] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Sliders size={13} className="text-accent" />
                  <span className="h-[23px] leading-[23px] inline-flex items-center">
                    {isRtl ? 'تعديل الجمهور' : 'Edit Audience'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAudiencePreset('custom_targeted');
                    setAudienceModalView('browse_taxonomy');
                    setActiveModal('audience');
                  }}
                  className="h-8 min-h-[32px] max-h-[32px] px-3.5 rounded-shape-sm touch-target-44-expanded bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-main)] text-xs font-bold text-[var(--text-primary)] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={13} className="text-accent" />
                  <span className="h-[23px] leading-[23px] inline-flex items-center">
                    {isRtl ? 'إنشاء جمهور جديد' : 'Create New Audience'}
                  </span>
                </button>
              </div>
            </section>

            {/* -------------------------------------------------------------- */}
            {/* CARD 5: الجدول الزمني والميزانية اليومية والمواضع (SCHEDULE & BUDGET) */}
            {/* -------------------------------------------------------------- */}
            <section
              ref={scheduleContainerRef}
              className="bg-[var(--surface-card)] rounded-shape-md border border-[var(--border-main)] p-4 sm:p-5 shadow-2xs space-y-5"
            >
              {/* Part A: Schedule & Duration (Matching Attached Video 00:00 - 00:15) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-extrabold text-[var(--text-primary)]">
                      {isRtl ? 'الجدول الزمني والمدة' : 'Schedule & Duration'}
                    </h2>
                    {isScheduledForFuture ? (
                      <span className="px-2 py-0.5 rounded-shape-xs bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                        <Calendar size={11} />
                        <span>{isRtl ? 'حملة مجدولة' : 'Scheduled Campaign'}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-shape-xs bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                        <Zap size={11} />
                        <span>{isRtl ? 'البدء الفوري (الوقت الفعلي)' : 'Immediate Start (Real-time)'}</span>
                      </span>
                    )}
                  </div>

                  {isScheduledForFuture && (
                    <button
                      type="button"
                      onClick={handleResetToNow}
                      className="h-7 px-2.5 rounded-shape-xs bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-main)] text-[11px] font-bold text-accent inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RotateCcw size={11} />
                      <span>{isRtl ? 'البدء الآن (الوقت الفعلي)' : 'Start Now (Real-time)'}</span>
                    </button>
                  )}
                </div>

                {/* Start Date & Start Time Custom Pickers (Exact Video Match 00:00 - 00:06) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                  {/* 1. Start Date Box + Calendar Popover */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        if (activeSchedulePopover === 'start_date') {
                          setActiveSchedulePopover('none');
                        } else {
                          const d = new Date(`${startDate}T00:00:00`);
                          if (!isNaN(d.getTime())) {
                            setCalendarViewMonth({ year: d.getFullYear(), month: d.getMonth() });
                          }
                          setActiveSchedulePopover('start_date');
                        }
                      }}
                      className={`w-full min-h-[54px] px-3.5 py-2 rounded-shape-sm bg-[var(--surface-subtle)] border text-start flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        activeSchedulePopover === 'start_date'
                          ? 'border-[#2d88ff] ring-2 ring-[#2d88ff]/20'
                          : 'border-[var(--border-main)] hover:border-[var(--text-muted)]'
                      }`}
                    >
                      <div className="min-w-0">
                        <span
                          className={`block text-[10px] font-bold mb-0.5 ${
                            activeSchedulePopover === 'start_date'
                              ? 'text-[#2d88ff]'
                              : 'text-[var(--text-muted)]'
                          }`}
                        >
                          {isRtl ? 'تاريخ البدء' : 'Start Date'}
                        </span>
                        <span
                          className="block text-xs sm:text-sm font-extrabold font-mono text-[var(--text-primary)]"
                          dir="ltr"
                        >
                          {formatSlashDate(startDate)}
                        </span>
                      </div>
                      <Calendar
                        size={18}
                        className={
                          activeSchedulePopover === 'start_date'
                            ? 'text-[#2d88ff] shrink-0'
                            : 'text-[var(--text-secondary)] shrink-0'
                        }
                      />
                    </button>

                    {activeSchedulePopover === 'start_date' && renderCalendarPopover('start_date')}
                  </div>

                  {/* 2. Start Time Box + 30-Min Scrollable Dropdown (Video 00:00 - 00:02) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveSchedulePopover(
                          activeSchedulePopover === 'start_time' ? 'none' : 'start_time'
                        )
                      }
                      className={`w-full min-h-[54px] px-3.5 py-2 rounded-shape-sm bg-[var(--surface-subtle)] border text-start flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        activeSchedulePopover === 'start_time'
                          ? 'border-[#2d88ff] ring-2 ring-[#2d88ff]/20'
                          : 'border-[var(--border-main)] hover:border-[var(--text-muted)]'
                      }`}
                    >
                      <div className="min-w-0">
                        <span
                          className={`block text-[10px] font-bold mb-0.5 ${
                            activeSchedulePopover === 'start_time'
                              ? 'text-[#2d88ff]'
                              : 'text-[var(--text-muted)]'
                          }`}
                        >
                          {isRtl ? 'وقت البدء' : 'Start Time'}
                        </span>
                        <span
                          className="block text-xs sm:text-sm font-extrabold font-mono text-[var(--text-primary)]"
                          dir="ltr"
                        >
                          {startTime}
                        </span>
                      </div>
                      <Clock
                        size={18}
                        className={
                          activeSchedulePopover === 'start_time'
                            ? 'text-[#2d88ff] shrink-0'
                            : 'text-[var(--text-secondary)] shrink-0'
                        }
                      />
                    </button>

                    {activeSchedulePopover === 'start_time' && (
                      <div
                        ref={timeListRef}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-full mt-1.5 inset-x-0 z-50 max-h-64 overflow-y-auto rounded-shape-md bg-[#242526] text-white border border-white/15 shadow-2xl py-1.5 select-none"
                      >
                        <div className="px-3 py-1.5 border-b border-white/10 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-gray-400">
                            {isRtl ? 'تحديد وقت دقيق:' : 'Exact time:'}
                          </span>
                          <input
                            type="time"
                            value={startTime}
                            onChange={(e) => {
                              if (e.target.value) setStartTime(e.target.value);
                            }}
                            className="bg-black/40 border border-white/15 focus:border-[#2d88ff] rounded-shape-xs px-2 py-0.5 text-xs font-mono font-bold text-white outline-hidden"
                            dir="ltr"
                          />
                        </div>
                        {TIME_SLOTS_30MIN.map((slot) => {
                          const isSelectedSlot = startTime === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              data-active-time={isSelectedSlot ? 'true' : 'false'}
                              onClick={() => {
                                setStartTime(slot);
                                setActiveSchedulePopover('none');
                              }}
                              className={`w-full px-4 py-2 text-xs font-extrabold font-mono flex items-center justify-between transition-colors cursor-pointer ${
                                isSelectedSlot
                                  ? 'bg-[#2d88ff] text-white'
                                  : 'text-gray-200 hover:bg-white/10'
                              }`}
                              dir="ltr"
                            >
                              <span>{slot}</span>
                              {isSelectedSlot && <Check size={13} />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Scheduled Campaign Informative Banner when Future Date/Time is Selected */}
                {isScheduledForFuture && (
                  <div className="p-3 rounded-shape-sm bg-indigo-500/10 border border-indigo-500/30 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 text-xs">
                      <Calendar size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-[var(--text-primary)] block">
                          {isRtl
                            ? 'تم تفعيل وضع الجدولة الزمنية للحملة'
                            : 'Campaign Scheduling Mode Activated'}
                        </span>
                        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                          {isRtl
                            ? `سيتم حفظ الحملة وحجز ميزانيتها الآن، ولن يبدأ ظهور الإعلان للجمهور أو احتساب المدة إلا في التاريخ المحدد (${formatSlashDate(startDate)} الساعة ${startTime}).`
                            : `Your campaign will be scheduled and start delivering automatically on ${formatSlashDate(startDate)} at ${startTime}.`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Continuous vs End Date Radio (Matching Video 00:07 - 00:14) */}
                <div className="space-y-3.5 pt-1">
                  <label className="flex items-start justify-between gap-3 cursor-pointer">
                    <div className="min-w-0 flex-1">
                      <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] block">
                        {isRtl ? 'تشغيل الإعلان باستمرار' : 'Run this ad continuously'}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)] block mt-0.5">
                        {isRtl
                          ? 'سيتم تشغيل إعلانك حتى تقوم بإيقافه مؤقتاً.'
                          : 'Your ad will run continuously until you pause it.'}
                      </span>
                    </div>
                    <input
                      type="radio"
                      name="schedule_mode"
                      checked={scheduleMode === 'continuous'}
                      onChange={() => setScheduleMode('continuous')}
                      className="mt-1 w-5 h-5 accent-[#2d88ff] cursor-pointer shrink-0"
                    />
                  </label>

                  <div className="space-y-3">
                    <label className="flex items-center justify-between gap-3 cursor-pointer">
                      <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                        {isRtl ? 'اختيار تاريخ انتهاء' : 'Choose when this ad will end'}
                      </span>
                      <input
                        type="radio"
                        name="schedule_mode"
                        checked={scheduleMode === 'fixed_duration'}
                        onChange={() => setScheduleMode('fixed_duration')}
                        className="w-5 h-5 accent-[#2d88ff] cursor-pointer shrink-0"
                      />
                    </label>

                    {scheduleMode === 'fixed_duration' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                        {/* Days Box with Circular (-) and (+) Stepper Buttons (Video 00:09 - 00:14) */}
                        <div className="min-h-[54px] px-3.5 py-2 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] focus-within:border-[#2d88ff] flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-0.5">
                              {isRtl ? 'الأيام' : 'Days'}
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={90}
                              value={durationDays}
                              onChange={(e) =>
                                setDurationDays(
                                  Math.max(1, Math.min(90, parseInt(e.target.value) || 1))
                                )
                              }
                              className="w-full bg-transparent text-xs sm:text-sm font-extrabold font-mono text-[var(--text-primary)] outline-hidden"
                            />
                          </div>

                          {/* Circular (-) and (+) Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setDurationDays((d) => Math.max(1, d - 1))}
                              disabled={durationDays <= 1}
                              className="w-7 h-7 rounded-shape-full border border-[var(--border-main)] hover:border-[#2d88ff] bg-[var(--surface-card)] text-[var(--text-primary)] disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
                              title={isRtl ? 'إنقاص يوم' : 'Decrease days'}
                            >
                              <Minus size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDurationDays((d) => Math.min(90, d + 1))}
                              disabled={durationDays >= 90}
                              className="w-7 h-7 rounded-shape-full border border-[var(--border-main)] hover:border-[#2d88ff] bg-[var(--surface-card)] text-[var(--text-primary)] disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
                              title={isRtl ? 'زيادة يوم' : 'Increase days'}
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        </div>

                        {/* End Date Box with Calendar Popover (Video 00:11 - 00:13) */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              if (activeSchedulePopover === 'end_date') {
                                setActiveSchedulePopover('none');
                              } else {
                                const d = new Date(`${computedEndDate}T00:00:00`);
                                if (!isNaN(d.getTime())) {
                                  setCalendarViewMonth({ year: d.getFullYear(), month: d.getMonth() });
                                }
                                setActiveSchedulePopover('end_date');
                              }
                            }}
                            className={`w-full min-h-[54px] px-3.5 py-2 rounded-shape-sm bg-[var(--surface-subtle)] border text-start flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                              activeSchedulePopover === 'end_date'
                                ? 'border-[#2d88ff] ring-2 ring-[#2d88ff]/20'
                                : 'border-[var(--border-main)] hover:border-[var(--text-muted)]'
                            }`}
                          >
                            <div className="min-w-0">
                              <span
                                className={`block text-[10px] font-bold mb-0.5 ${
                                  activeSchedulePopover === 'end_date'
                                    ? 'text-[#2d88ff]'
                                    : 'text-[var(--text-muted)]'
                                }`}
                              >
                                {isRtl ? 'تاريخ الانتهاء' : 'End Date'}
                              </span>
                              <span
                                className="block text-xs sm:text-sm font-extrabold font-mono text-[var(--text-primary)]"
                                dir="ltr"
                              >
                                {formatSlashDate(computedEndDate)}
                              </span>
                            </div>
                            <Calendar
                              size={18}
                              className={
                                activeSchedulePopover === 'end_date'
                                  ? 'text-[#2d88ff] shrink-0'
                                  : 'text-[var(--text-secondary)] shrink-0'
                              }
                            />
                          </button>

                          {activeSchedulePopover === 'end_date' && renderCalendarPopover('end_date')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Business Hours Only Toggle (Video 00:14) */}
                <div className="flex items-center justify-between gap-4 pt-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] inline-flex items-center gap-1.5">
                      <span>
                        {isRtl
                          ? 'تشغيل هذا الإعلان أثناء ساعات العمل'
                          : 'Run this ad during business hours'}
                      </span>
                      <Info size={13} className="text-[var(--text-muted)] shrink-0" />
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] block mt-0.5">
                      {isRtl
                        ? 'لن يرى الأشخاص إعلانك إلا خلال ساعات العمل التي توصي بها.'
                        : 'People will only see your ad during your recommended business hours.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={runDuringBusinessHours}
                    onClick={() => setRunDuringBusinessHours(!runDuringBusinessHours)}
                    className={`w-11 h-6 rounded-shape-full p-0.5 transition-colors cursor-pointer shrink-0 flex items-center ${
                      runDuringBusinessHours
                        ? 'bg-[#2d88ff] justify-end'
                        : 'bg-gray-400/50 dark:bg-gray-700 justify-start'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-shape-full bg-white shadow-2xs block" />
                  </button>
                </div>
              </div>

              {/* Part B: Daily Budget (Matching Attached Video 00:15 - 00:25) */}
              <div className="pt-4 border-t border-[var(--border-main)] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-extrabold text-[var(--text-primary)]">
                    {isRtl ? 'الميزانية اليومية' : 'Daily Budget'}
                  </h3>
                  <Info size={14} className="text-[var(--text-muted)]" />
                </div>

                <div className="p-4 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-main)] text-center space-y-4">
                  <p className="text-xs font-bold text-[var(--text-secondary)]">
                    {isRtl
                      ? `مرات الظهور التقديرية من ${formatCompactNumber(estReachMin)} إلى ${formatCompactNumber(estReachMax)} في اليوم`
                      : `Estimated ${formatCompactNumber(estReachMin)} – ${formatCompactNumber(estReachMax)} daily impressions`}
                  </p>

                  {/* Large Inline-Editable Daily Budget Display with Pencil Icon (Video 00:16 - 00:21) */}
                  <div className="flex items-center justify-center">
                    {isEditingBudget ? (
                      <div className="inline-flex items-center justify-center">
                        <input
                          ref={budgetInputRef}
                          type="number"
                          min={1}
                          max={500}
                          step={0.5}
                          value={budgetInputValue}
                          onChange={(e) => setBudgetInputValue(e.target.value)}
                          onBlur={handleCommitBudgetEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCommitBudgetEdit();
                            if (e.key === 'Escape') setIsEditingBudget(false);
                          }}
                          className="w-36 h-12 px-3 rounded-shape-sm bg-[var(--surface-card)] border-2 border-[#2d88ff] text-center text-2xl sm:text-3xl font-black font-mono text-[var(--text-primary)] outline-hidden shadow-md"
                          dir="ltr"
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setBudgetInputValue(dailyBudget.toFixed(2));
                          setIsEditingBudget(true);
                        }}
                        className="group inline-flex items-center justify-center gap-2.5 px-3 py-1 rounded-shape-sm hover:bg-[var(--surface-card)] transition-colors cursor-pointer"
                        title={isRtl ? 'انقر لتعديل الميزانية اليومية' : 'Click to edit daily budget'}
                      >
                        <span
                          className="text-2xl sm:text-3xl font-black font-mono text-[#2d88ff]"
                          dir="ltr"
                        >
                          {dailyBudget.toFixed(2)} $
                        </span>
                        <span className="w-7 h-7 rounded-shape-full bg-[#2d88ff]/10 group-hover:bg-[#2d88ff]/20 text-[#2d88ff] flex items-center justify-center transition-colors">
                          <Edit3 size={14} />
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Smooth Budget Slider ($1.00 - $500.00 Matching Video 00:21 - 00:24) */}
                  <div className="px-2 space-y-1.5">
                    <div className="flex items-center gap-3" dir={isRtl ? 'rtl' : 'ltr'}>
                      <span className="text-[11px] font-bold font-mono text-[var(--text-muted)] shrink-0">
                        $1.00
                      </span>
                      <input
                        type="range"
                        min={1}
                        max={500}
                        step={1}
                        value={dailyBudget}
                        onChange={(e) => setDailyBudget(parseFloat(e.target.value))}
                        className="w-full accent-[#2d88ff] cursor-pointer h-1.5"
                      />
                      <span className="text-[11px] font-bold font-mono text-[var(--text-muted)] shrink-0">
                        $500.00
                      </span>
                    </div>
                  </div>
                </div>

                {/* Benchmark Recommendation Notice (Matching Video 00:22) */}
                <div className="p-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] flex items-center justify-between gap-2.5 text-xs text-[var(--text-secondary)]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-shape-full bg-[#2d88ff] shrink-0 block" />
                    <span>
                      {isRtl
                        ? 'عادةً ما تنفق الأنشطة التجارية المماثلة $18.00 ويمكنها تحقيق 7 من الردود يومياً.'
                        : 'Similar businesses typically spend $18.00 and achieve 7 responses per day.'}
                    </span>
                  </div>
                  <Info size={14} className="text-[var(--text-muted)] shrink-0" />
                </div>

                {/* Advanced Budget Toggles (Exact Copy from Video 00:17 - 00:25) */}
                <div className="space-y-4 pt-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] inline-flex items-center gap-1.5">
                        <span>
                          {isRtl
                            ? 'توسيع نطاق هذا الإعلان إذا كان يحقق أداءً جيداً'
                            : 'Scale this ad when performing strongly'}
                        </span>
                        <Info size={13} className="text-[var(--text-muted)] shrink-0" />
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)] block leading-relaxed mt-0.5">
                        {isRtl
                          ? 'إذا كان هذا الإعلان يحقق نتائج أفضل مقارنة بنسبة 80% من الإعلانات المشابهة، فسنزيد ميزانيتك تلقائياً بنسبة 10% أو سنمدد مدة تشغيله لمدة 2 أيام إذا كان يتبقى على انتهائه أقل من 4 أيام.'
                          : 'If this ad performs better than 80% of similar ads, we will automatically scale budget by 10% or extend duration by 2 days.'}
                      </span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={flexibleBudgetBoost}
                      onClick={() => setFlexibleBudgetBoost(!flexibleBudgetBoost)}
                      className={`w-11 h-6 rounded-shape-full p-0.5 transition-colors cursor-pointer shrink-0 flex items-center mt-0.5 ${
                        flexibleBudgetBoost
                          ? 'bg-[#2d88ff] justify-end'
                          : 'bg-gray-400/50 dark:bg-gray-700 justify-start'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-shape-full bg-white shadow-2xs block" />
                    </button>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] inline-flex items-center gap-1.5">
                        <span>
                          {isRtl ? 'مشاركة الميزانية' : 'Share Budget Across Campaigns'}
                        </span>
                        <Info size={13} className="text-[var(--text-muted)] shrink-0" />
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)] block leading-relaxed mt-0.5">
                        {isRtl
                          ? 'شارك بعضاً من ميزانية هذا الإعلان مع الإعلانات الأخرى التي لديها نفس الهدف. وسنخصص جزءاً أكبر من الميزانية للإعلان الأفضل أداءً. مما يمكن أن يساعد على تحسين النتائج الإجمالية دون إنفاق المزيد من المال.'
                          : 'Share part of this budget with other ads sharing the same objective to allocate more budget to the best-performing ad.'}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-500 block mt-1">
                        {isRtl
                          ? 'النتائج التقديرية: انخفاض التكلفة لكل نتيجة بنسبة تصل إلى 3.3%'
                          : 'Estimated Results: Up to 3.3% lower cost per result'}
                      </span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={shareBudgetAcrossPlacements}
                      onClick={() => setShareBudgetAcrossPlacements(!shareBudgetAcrossPlacements)}
                      className={`w-11 h-6 rounded-shape-full p-0.5 transition-colors cursor-pointer shrink-0 flex items-center mt-0.5 ${
                        shareBudgetAcrossPlacements
                          ? 'bg-[#2d88ff] justify-end'
                          : 'bg-gray-400/50 dark:bg-gray-700 justify-start'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-shape-full bg-white shadow-2xs block" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Part C: Placements (المواضع) */}
              <div className="pt-4 border-t border-[var(--border-main)] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
                      {isRtl ? 'المواضع الإعلانية' : 'Placements'}
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {isRtl ? 'اختر الأماكن التي سيظهر بها إعلانك عبر المنصة.' : 'Choose where your ad will be displayed across the platform.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoPlacements}
                    onClick={() => {
                      const next = !autoPlacements;
                      setAutoPlacements(next);
                      if (next) {
                        setPlacementFeed(true);
                        setPlacementReels(true);
                        setPlacementMessages(true);
                      }
                    }}
                    className={`w-11 h-6 rounded-shape-full p-0.5 transition-colors cursor-pointer shrink-0 flex items-center ${
                      autoPlacements ? 'bg-[#2d88ff] justify-end' : 'bg-gray-400/50 dark:bg-gray-700 justify-start'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-shape-full bg-white shadow-2xs block" />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] cursor-pointer">
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      {isRtl ? 'خلاصة المنشورات والأقسام الرئيسية' : 'Main Feed & Categories'}
                    </span>
                    <input
                      type="checkbox"
                      checked={placementFeed}
                      onChange={(e) => setPlacementFeed(e.target.checked)}
                      className="w-4 h-4 accent-[#2d88ff] rounded-shape-xs cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] cursor-pointer">
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      {isRtl ? 'مقاطع الريلز والقصص التفاعلية' : 'Reels & Interactive Stories'}
                    </span>
                    <input
                      type="checkbox"
                      checked={placementReels}
                      onChange={(e) => setPlacementReels(e.target.checked)}
                      className="w-4 h-4 accent-[#2d88ff] rounded-shape-xs cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] cursor-pointer">
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      {isRtl ? 'قسم الاستكشاف وصندوق الرسائل' : 'Explore & Messenger Hub'}
                    </span>
                    <input
                      type="checkbox"
                      checked={placementMessages}
                      onChange={(e) => setPlacementMessages(e.target.checked)}
                      className="w-4 h-4 accent-[#2d88ff] rounded-shape-xs cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </section>

          </div>

          {/* ================================================================ */}
          {/* COLUMN 2: STICKY AD PREVIEW, ESTIMATED RESULTS & PAYMENT SUMMARY */}
          {/* ================================================================ */}
          <div className="lg:col-span-5 space-y-4 sticky top-18">
            
            {/* CARD 1: معاينة الإعلان (AD PREVIEW) */}
            <section className="bg-[var(--surface-card)] rounded-shape-md border border-[var(--border-main)] p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-[var(--text-primary)]">
                    {isRtl ? 'معاينة الإعلان' : 'Ad Preview'}
                  </h3>
                  {(() => {
                    const effectiveStatus: PromotionStatus = isScheduledForFuture ? 'scheduled' : previewStatus;
                    const cfg = PROMOTION_STATUS_CONFIG[effectiveStatus] || PROMOTION_STATUS_CONFIG.active;
                    const StatusIcon = cfg.icon;
                    return (
                      <span className={`px-2 py-0.5 rounded-shape-xs text-[10px] font-bold inline-flex items-center gap-1 ${cfg.badgeBg} ${cfg.badgeFg}`}>
                        <StatusIcon size={10} />
                        <span>{isRtl ? cfg.labelAr : cfg.labelEn}</span>
                      </span>
                    );
                  })()}
                </div>

                {/* Placement Segmented Switcher */}
                <div className="flex items-center gap-1 p-0.5 bg-[var(--surface-subtle)] rounded-shape-sm border border-[var(--border-main)]">
                  {[
                    { id: 'mobile', icon: Smartphone, labelAr: 'هاتف', labelEn: 'Mobile' },
                    { id: 'desktop', icon: Monitor, labelAr: 'مكتب', labelEn: 'Desktop' },
                    { id: 'reels', icon: Film, labelAr: 'ريلز', labelEn: 'Reel' },
                    { id: 'story', icon: Clock, labelAr: 'قصة', labelEn: 'Story' }
                  ].map((p) => {
                    const Icon = p.icon;
                    const isAct = placementMode === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPlacementMode(p.id as PlacementMode)}
                        className={`h-7 px-2 rounded-shape-xs text-[11px] font-bold inline-flex items-center gap-1 transition-theme cursor-pointer ${
                          isAct
                            ? 'bg-[var(--surface-card)] text-accent shadow-2xs border border-[var(--border-main)]'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <Icon size={12} />
                        <span>{isRtl ? p.labelAr : p.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Ad Card Preview */}
              <div className="relative flex items-center justify-center">
                {placementMode === 'mobile' || placementMode === 'desktop' ? (
                  <div className="w-full rounded-shape-sm border border-[var(--border-main)] bg-[var(--surface-card)] overflow-hidden">
                    {/* Post Author Header */}
                    <div className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={ad.page_avatar || ad.author_avatar || '/default-avatar.png'}
                          alt={ad.author_name || 'Advertiser'}
                          className="w-9 h-9 rounded-shape-xs object-cover border border-[var(--border-main)]"
                        />
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-xs text-[var(--text-primary)]">
                              {ad.page_name || ad.author_name || (isRtl ? 'المعلن' : 'Advertiser')}
                            </span>
                            {ad.page_is_verified && (
                              <CheckCircle2 size={12} className="text-blue-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                            <span className="font-bold text-[var(--text-secondary)]">
                              {isRtl ? 'مُموَّل' : 'Sponsored'}
                            </span>
                            <span>·</span>
                            <Globe size={10} />
                          </div>
                        </div>
                      </div>
                      <MoreHorizontal size={15} className="text-[var(--text-muted)]" />
                    </div>

                    {/* Post Copy */}
                    <div className="px-3 pb-2.5 text-xs text-[var(--text-primary)] space-y-1">
                      {ad.title && <p className="font-bold">{ad.title}</p>}
                      {ad.description && (
                        <p className="text-[11px] text-[var(--text-secondary)] line-clamp-3 leading-relaxed">
                          {ad.description}
                        </p>
                      )}
                    </div>

                    {/* Media */}
                    {(ad.image_url || ad.video_url) && (
                      <div className="relative aspect-4/3 bg-black/5 overflow-hidden border-t border-[var(--border-main)]">
                        {ad.image_url ? (
                          <img
                            src={getMediaUrl(ad.image_url) || undefined}
                            alt={ad.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-white/60">
                            <Film size={24} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* CTA Bar */}
                    <div className="p-2.5 bg-[var(--surface-subtle)] border-t border-b border-[var(--border-main)] flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-[var(--text-muted)] block truncate">
                          {ctaButton === 'whatsapp_message' ? 'WhatsApp' : 'Perplexta'}
                        </span>
                        <span className="text-xs font-bold text-[var(--text-primary)] truncate block">
                          {ad.page_name || ad.title || (isRtl ? 'تواصل مباشر' : 'Direct Contact')}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="h-8 min-h-[32px] max-h-[32px] px-3 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-main)] text-xs font-bold text-[var(--text-primary)] inline-flex items-center gap-1.5 shrink-0"
                      >
                        {getCtaIcon(ctaButton)}
                        <span className="h-[23px] leading-[23px] inline-flex items-center">
                          {isRtl ? activeCtaObj.labelAr : activeCtaObj.labelEn}
                        </span>
                      </button>
                    </div>

                    {/* Social Reactions Footer */}
                    <div className="px-3 py-2 grid grid-cols-3 text-center text-[11px] font-bold text-[var(--text-secondary)]">
                      <div className="flex items-center justify-center gap-1.5">
                        <ThumbsUp size={13} />
                        <span>{isRtl ? 'أعجبني' : 'Like'}</span>
                      </div>
                      <div className="flex items-center justify-center gap-1.5">
                        <MessageSquare size={13} />
                        <span>{isRtl ? 'تعليق' : 'Comment'}</span>
                      </div>
                      <div className="flex items-center justify-center gap-1.5">
                        <Share2 size={13} />
                        <span>{isRtl ? 'مشاركة' : 'Share'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Reels / Story Vertical Preview */
                  <div className="w-full max-w-[240px] aspect-9/16 rounded-shape-md border border-[var(--border-main)] bg-black text-white relative overflow-hidden flex flex-col justify-between p-3">
                    {ad.image_url && (
                      <img
                        src={getMediaUrl(ad.image_url) || undefined}
                        alt={ad.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-85"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />

                    <div className="relative z-10 flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5">
                        <Film size={13} className="text-accent" />
                        <span>{placementMode === 'reels' ? (isRtl ? 'ريلز مُموَّل' : 'Sponsored Reel') : (isRtl ? 'قصة مُموَّلة' : 'Sponsored Story')}</span>
                      </span>
                      <Volume2 size={14} />
                    </div>

                    <div className="relative z-10 space-y-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={ad.page_avatar || ad.author_avatar || '/default-avatar.png'}
                          alt={ad.author_name || 'Advertiser'}
                          className="w-7 h-7 rounded-shape-xs object-cover border border-white/40"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-bold block truncate">
                            {ad.page_name || ad.author_name || (isRtl ? 'المعلن' : 'Advertiser')}
                          </span>
                          <span className="text-[9px] text-white/70 block">
                            {isRtl ? 'مُموَّل' : 'Sponsored'}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] font-bold line-clamp-1">{ad.title}</p>
                      <button
                        type="button"
                        className="w-full h-8 min-h-[32px] max-h-[32px] px-3 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-white text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        {getCtaIcon(ctaButton)}
                        <span className="h-[23px] leading-[23px] inline-flex items-center">
                          {isRtl ? activeCtaObj.labelAr : activeCtaObj.labelEn}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* View All Previews Button (Matching Video 00:01) */}
              <button
                type="button"
                onClick={() => setActiveModal('all_previews')}
                className="w-full h-9 min-h-[36px] px-3 rounded-shape-sm touch-target-44-expanded bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-main)] text-xs font-bold text-[var(--text-primary)] inline-flex items-center justify-center gap-1.5 transition-theme cursor-pointer"
              >
                <Eye size={13} />
                <span className="h-[23px] leading-[23px] inline-flex items-center">
                  {isRtl ? 'عرض كل المعاينات' : 'View All Previews'}
                </span>
              </button>
            </section>

            {/* CARD 2: النتائج اليومية التقديرية (ESTIMATED DAILY RESULTS) */}
            <section className="bg-[var(--surface-card)] rounded-shape-md border border-[var(--border-main)] p-4 shadow-2xs space-y-3">
              <h3 className="font-extrabold text-sm text-[var(--text-primary)]">
                {isRtl ? 'النتائج اليومية التقديرية' : 'Estimated Daily Results'}
              </h3>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)]">
                    {isRtl ? 'مرات الظهور الإعلاني' : 'Ad Impressions'}
                  </span>
                  <span className="text-sm sm:text-base font-black text-[var(--text-primary)] font-mono">
                    {formatCompactNumber(estReachMin)} - {formatCompactNumber(estReachMax)}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[var(--surface-subtle)] rounded-shape-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-shape-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(18, (dailyBudget / 60) * 100))}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)]">
                    {isRtl ? 'الرسائل والنقرات المتوقعة' : 'Estimated Messages & Clicks'}
                  </span>
                  <span className="text-xs font-extrabold text-[var(--fg-success)] font-mono">
                    {estActionsMin} - {estActionsMax} / {isRtl ? 'يوم' : 'day'}
                  </span>
                </div>
              </div>
            </section>

            {/* CARD 3: ملخص الدفع والمحفظة (PAYMENT SUMMARY & LAUNCH CTA) */}
            <section className="bg-[var(--surface-card)] rounded-shape-md border border-[var(--border-main)] p-4 shadow-2xs space-y-4">
              <div>
                <h3 className="font-extrabold text-sm text-[var(--text-primary)]">
                  {isRtl ? 'ملخص الدفع' : 'Payment Summary'}
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  {isScheduledForFuture
                    ? isRtl
                      ? `مجدول للبدء في ${formatSlashDate(startDate)} (${startTime}) ولمدة ${effectiveDays} أيام حتى ${endDateFormatted}.`
                      : `Scheduled to start on ${formatSlashDate(startDate)} (${startTime}) for ${effectiveDays} days until ${endDateFormatted}.`
                    : isRtl
                    ? `سيرى الجمهور إعلانك لمدة ${effectiveDays} من الأيام حتى ${endDateFormatted}.`
                    : `Your ad will run for ${effectiveDays} days until ${endDateFormatted}.`}
                </p>
              </div>

              <div className="space-y-2 text-xs border-t border-b border-[var(--border-main)] py-3">
                <div className="flex items-center justify-between text-[var(--text-secondary)]">
                  <span>{isRtl ? 'الميزانية اليومية × عدد الأيام' : 'Daily Budget × Days'}</span>
                  <span className="font-bold font-mono text-[var(--text-primary)]">
                    ${dailyBudget.toFixed(2)} × {effectiveDays}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[var(--text-secondary)]">
                  <span>{isRtl ? 'إجمالي الميزانية' : 'Total Budget'}</span>
                  <span className="font-bold font-mono text-[var(--text-primary)]">${totalCost.toFixed(2)} USD</span>
                </div>
                <div className="flex items-center justify-between text-[var(--text-secondary)]">
                  <span>{isRtl ? 'الضرائب والرسوم المقدرة' : 'Estimated Taxes & Fees'}</span>
                  <span className="font-bold font-mono text-[var(--text-primary)]">$0.00 USD</span>
                </div>
                <div className="flex items-center justify-between font-extrabold text-sm text-[var(--text-primary)] pt-1 border-t border-[var(--border-main)]/60">
                  <span>{isRtl ? 'المبلغ الإجمالي' : 'Total Amount'}</span>
                  <span className="font-mono text-accent">${totalCost.toFixed(2)} USD</span>
                </div>
              </div>

              {/* Payment Method Row */}
              <div className="p-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-shape-xs bg-[var(--status-success-subtle)] text-[var(--fg-success)] flex items-center justify-center shrink-0">
                    <Wallet size={15} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[var(--text-primary)] block">
                      {isRtl ? 'طريقة الدفع: محفظة المنصة' : 'Payment Method: Platform Wallet'}
                    </span>
                    <span className={`text-[11px] font-mono font-bold block ${hasSufficientBalance ? 'text-[var(--fg-success)]' : 'text-red-500'}`}>
                      {isRtl ? `الرصيد المتاح: $${liveBalance.toFixed(2)} USD` : `Available: $${liveBalance.toFixed(2)} USD`}
                    </span>
                  </div>
                </div>
                {!hasSufficientBalance && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onRequestDepositModal) onRequestDepositModal();
                      else if (onNavigateToWallet) onNavigateToWallet();
                    }}
                    className="h-9 min-h-[36px] px-3 rounded-shape-sm touch-target-44-expanded bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold inline-flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <span className="h-[23px] leading-[23px] inline-flex items-center">
                      {isRtl ? 'شحن الرصيد' : 'Top Up'}
                    </span>
                  </button>
                )}
              </div>

              {/* Master Launch / Schedule Button (Strictly 44px M3 Touch Target) */}
              <button
                type="button"
                disabled={isSubmitting || !hasSufficientBalance}
                onClick={handleLaunchPromotion}
                className={`w-full h-11 min-h-[44px] px-4 rounded-shape-sm font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-sm transition-theme ${
                  hasSufficientBalance && !isSubmitting
                    ? isScheduledForFuture
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer active:scale-[0.99]'
                      : 'bg-accent hover:opacity-90 text-white cursor-pointer active:scale-[0.99]'
                    : 'bg-[var(--surface-subtle)] border border-[var(--border-main)] text-gray-500 cursor-not-allowed opacity-75'
                }`}
              >
                {isSubmitting ? (
                  <span className="h-[23px] leading-[23px] inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-shape-full animate-spin" />
                    <span>
                      {isScheduledForFuture
                        ? isRtl
                          ? 'جاري جدولة الحملة...'
                          : 'Scheduling Campaign...'
                        : isRtl
                        ? 'جاري تنشيط الحملة...'
                        : 'Activating Campaign...'}
                    </span>
                  </span>
                ) : (
                  <span className="h-[23px] leading-[23px] inline-flex items-center gap-2">
                    {isScheduledForFuture ? <Calendar size={15} /> : <Rocket size={15} />}
                    <span>
                      {isScheduledForFuture
                        ? isRtl
                          ? `جدولة الحملة الإعلانية ($${totalCost.toFixed(2)} USD)`
                          : `Schedule Campaign ($${totalCost.toFixed(2)} USD)`
                        : isRtl
                        ? `تأكيد وإطلاق الحملة ($${totalCost.toFixed(2)} USD)`
                        : `Launch Campaign ($${totalCost.toFixed(2)} USD)`}
                    </span>
                  </span>
                )}
              </button>
            </section>

          </div>

        </div>
      </main>

      {/* ==================================================================== */}
      {/* POPUP MODALS (البطاقات المنبثقة الاحترافية في منتصف الشاشة دائماً)      */}
      {/* ==================================================================== */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {activeModal && (
              <div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 overflow-hidden"
                dir={isRtl ? 'rtl' : 'ltr'}
              >
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setActiveModal(null)}
                  className="fixed inset-0 bg-black/65 backdrop-blur-xs"
                />

                {/* -------------------------------------------------------------- */}
                {/* MODAL 1: الهدف (CAMPAIGN GOAL MODAL - Video 00:02 - 00:08)      */}
                {/* -------------------------------------------------------------- */}
                {activeModal === 'goal' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 10 }}
                    className="relative z-10 w-full max-w-lg max-h-[85dvh] flex flex-col my-auto rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] shadow-2xl overflow-hidden text-[var(--text-primary)]"
                  >
                    {/* Modal Header */}
                    <div className="shrink-0 px-5 py-3.5 border-b border-[var(--border-main)] bg-[var(--surface-card)] flex items-center justify-between">
                      <h3 className="text-sm sm:text-base font-extrabold text-[var(--text-primary)]">
                        {isRtl ? 'الهدف' : 'Objective'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveModal(null)}
                        className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Modal Body: Radio Goal Options */}
                    <div className="flex-1 min-h-0 p-4 sm:p-5 space-y-2.5 overflow-y-auto overscroll-contain">
                      {GOAL_OPTIONS.map((g) => {
                        const Icon = g.icon;
                        const isSel = tempGoal === g.id;
                        return (
                          <label
                            key={g.id}
                            onClick={() => setTempGoal(g.id)}
                            className={`p-3.5 rounded-shape-md border flex items-start justify-between gap-3.5 cursor-pointer transition-theme ${
                              isSel
                                ? 'border-accent bg-accent/5'
                                : 'border-[var(--border-main)] bg-[var(--surface-subtle)]/50 hover:bg-[var(--surface-subtle)]'
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div
                                className={`w-10 h-10 rounded-shape-sm flex items-center justify-center shrink-0 ${
                                  isSel
                                    ? 'bg-accent text-white'
                                    : 'bg-[var(--surface-card)] text-[var(--text-secondary)] border border-[var(--border-main)]'
                                }`}
                              >
                                <Icon size={18} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs sm:text-sm font-extrabold text-[var(--text-primary)]">
                                    {isRtl ? g.titleAr : g.titleEn}
                                  </span>
                                  {g.badgeAr && (
                                    <span className="text-[10px] font-bold text-accent">
                                      · {isRtl ? g.badgeAr : g.badgeEn}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                                  {isRtl ? g.descAr : g.descEn}
                                </p>
                              </div>
                            </div>

                            <input
                              type="radio"
                              name="modal_goal_option"
                              checked={isSel}
                              onChange={() => setTempGoal(g.id)}
                              className="mt-1.5 w-4 h-4 accent-accent cursor-pointer shrink-0"
                            />
                          </label>
                        );
                      })}
                    </div>

                    {/* Modal Footer */}
                    <div className="shrink-0 px-5 py-3 border-t border-[var(--border-main)] bg-[var(--surface-subtle)] flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveModal(null)}
                        className="h-8 min-h-[32px] max-h-[32px] px-4 rounded-shape-sm border border-[var(--border-main)] bg-[var(--surface-card)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex items-center justify-center cursor-pointer"
                      >
                        <span className="h-[23px] leading-[23px] inline-flex items-center">
                          {isRtl ? 'إلغاء' : 'Cancel'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setGoal(tempGoal);
                          setActiveModal(null);
                        }}
                        className="h-8 min-h-[32px] max-h-[32px] px-5 rounded-shape-sm bg-accent hover:opacity-90 text-white text-xs font-bold inline-flex items-center justify-center cursor-pointer"
                      >
                        <span className="h-[23px] leading-[23px] inline-flex items-center">
                          {isRtl ? 'حفظ' : 'Save'}
                        </span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* -------------------------------------------------------------- */}
                {/* MODAL 2: تعديل قالب الرسالة (WELCOME TEMPLATE MODAL - Video 00:23) */}
                {/* -------------------------------------------------------------- */}
                {activeModal === 'template' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 10 }}
                    className="relative z-10 w-full max-w-3xl max-h-[85dvh] flex flex-col my-auto rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] shadow-2xl overflow-hidden text-[var(--text-primary)]"
                  >
                    {/* Modal Header */}
                    <div className="shrink-0 px-5 py-3.5 border-b border-[var(--border-main)] bg-[var(--surface-card)] flex items-center justify-between">
                      <h3 className="text-sm sm:text-base font-extrabold text-[var(--text-primary)]">
                        {isRtl ? 'تعديل قالب الرسالة' : 'Edit Message Template'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveModal(null)}
                        className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Modal Split Body (Form Editor + Live WhatsApp Preview) */}
                    <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 overflow-y-auto overscroll-contain">
                      {/* Right Side: Editor Controls (7 cols) */}
                      <div className="md:col-span-7 p-5 space-y-5 border-b md:border-b-0 md:border-e border-[var(--border-main)]">
                        {/* Welcome Message */}
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs font-extrabold text-[var(--text-primary)]">
                              {isRtl ? 'الرسالة الترحيبية' : 'Greeting Message'}
                            </label>
                            <p className="text-[11px] text-[var(--text-muted)]">
                              {isRtl
                                ? 'رحّب بالأشخاص للانضمام إلى المحادثة بعد نقرهم للتواصل على إعلانك.'
                                : 'Greet people after they tap your ad to start a conversation.'}
                            </p>
                          </div>
                          <div className="relative">
                            <textarea
                              rows={3}
                              maxLength={150}
                              value={tempWelcomeMsg}
                              onChange={(e) => setTempWelcomeMsg(e.target.value)}
                              className="w-full p-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] text-xs text-[var(--text-primary)] focus:border-accent outline-hidden resize-none"
                            />
                            <span className="block text-end text-[10px] font-mono text-[var(--text-muted)] mt-1">
                              {tempWelcomeMsg.length}/150
                            </span>
                          </div>
                        </div>

                        {/* Pre-filled Message / Quick Questions */}
                        <div className="space-y-3 pt-2 border-t border-[var(--border-main)]">
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="block text-xs font-extrabold text-[var(--text-primary)]">
                                {isRtl
                                  ? 'رسالة مسبقة الملء والأسئلة المقترحة'
                                  : 'Pre-filled Message & Quick Inquiries'}
                              </label>
                              <p className="text-[11px] text-[var(--text-muted)]">
                                {isRtl
                                  ? 'يمكنك إنشاء رسائلك الأولى المقترحة للمستخدمين.'
                                  : 'Create preset starter messages for your customers.'}
                              </p>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={enablePrefilledQuestions}
                              onClick={() => setEnablePrefilledQuestions(!enablePrefilledQuestions)}
                              className={`w-10 h-5 rounded-shape-full p-0.5 transition-colors cursor-pointer flex items-center ${
                                enablePrefilledQuestions
                                  ? 'bg-accent justify-end'
                                  : 'bg-gray-300 dark:bg-gray-700 justify-start'
                              }`}
                            >
                              <span className="w-4 h-4 rounded-shape-full bg-white shadow-2xs block" />
                            </button>
                          </div>

                          {enablePrefilledQuestions && (
                            <div className="space-y-2">
                              {tempQuestions.map((q, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={q}
                                    onChange={(e) => {
                                      const next = [...tempQuestions];
                                      next[idx] = e.target.value;
                                      setTempQuestions(next);
                                    }}
                                    className="flex-1 h-9 px-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] text-xs text-[var(--text-primary)] outline-hidden focus:border-accent"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setTempQuestions(tempQuestions.filter((_, i) => i !== idx))
                                    }
                                    className="w-8 h-8 rounded-shape-xs text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 flex items-center justify-center cursor-pointer shrink-0"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ))}

                              {tempQuestions.length < 5 && (
                                <div className="flex items-center gap-2 pt-1">
                                  <input
                                    type="text"
                                    value={newQuestionInput}
                                    onChange={(e) => setNewQuestionInput(e.target.value)}
                                    placeholder={
                                      isRtl ? 'أضف سؤالاً مسبق الملء...' : 'Add a pre-filled question...'
                                    }
                                    className="flex-1 h-8 px-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] text-xs text-[var(--text-primary)] outline-hidden"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!newQuestionInput.trim()) return;
                                      setTempQuestions([...tempQuestions, newQuestionInput.trim()]);
                                      setNewQuestionInput('');
                                    }}
                                    className="h-8 min-h-[32px] max-h-[32px] px-3 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-main)] text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Plus size={13} />
                                    <span className="h-[23px] leading-[23px] inline-flex items-center">
                                      {isRtl ? 'إضافة' : 'Add'}
                                    </span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Left Side: Live Chat Screen Preview (5 cols - Matching Video 00:24) */}
                      <div className="md:col-span-5 p-5 bg-[var(--surface-subtle)] flex flex-col items-center justify-center">
                        <span className="text-xs font-bold text-[var(--text-secondary)] mb-2 self-start">
                          {isRtl ? 'معاينة' : 'Preview'}
                        </span>
                        <div className="w-full max-w-[260px] rounded-shape-md border border-[var(--border-main)] bg-[#ECE5DD] dark:bg-zinc-900 overflow-hidden shadow-md flex flex-col h-[340px]">
                          {/* WhatsApp Top Bar */}
                          <div className="p-2.5 bg-[#075E54] text-white flex items-center gap-2">
                            <img
                              src={ad.page_avatar || ad.author_avatar || '/default-avatar.png'}
                              alt="Avatar"
                              className="w-8 h-8 rounded-shape-full object-cover border border-white/30"
                            />
                            <div className="min-w-0">
                              <span className="text-xs font-bold block truncate">
                                {ad.page_name || ad.author_name || 'Advertiser'}
                              </span>
                              <span className="text-[9px] text-white/80 block">
                                {isRtl ? 'حساب تجاري' : 'Business Account'}
                              </span>
                            </div>
                          </div>

                          {/* Chat Messages Area */}
                          <div className="flex-1 p-3 space-y-2.5 overflow-y-auto flex flex-col justify-end">
                            {/* Ad Context Mini Snippet */}
                            <div className="p-2 rounded-shape-xs bg-white/90 dark:bg-zinc-800 border border-black/10 text-[10px] text-zinc-700 dark:text-zinc-200 shadow-2xs">
                              <span className="font-bold block truncate">{ad.title}</span>
                              <span className="text-[9px] opacity-75">
                                {isRtl ? 'إعلان مُموَّل' : 'Sponsored Ad'}
                              </span>
                            </div>

                            {/* Welcome Message Bubble */}
                            {tempWelcomeMsg && (
                              <div className="self-start max-w-[88%] p-2.5 rounded-shape-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-[11px] shadow-2xs leading-relaxed">
                                {tempWelcomeMsg}
                              </div>
                            )}

                            {/* Pre-filled Customer Question Bubble */}
                            {enablePrefilledQuestions && tempQuestions[0] && (
                              <div className="self-end max-w-[88%] p-2.5 rounded-shape-sm bg-[#DCF8C6] dark:bg-emerald-900 text-zinc-900 dark:text-zinc-100 text-[11px] shadow-2xs leading-relaxed">
                                {tempQuestions[0]}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="shrink-0 px-5 py-3 border-t border-[var(--border-main)] bg-[var(--surface-subtle)] flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveModal(null)}
                        className="h-8 min-h-[32px] max-h-[32px] px-4 rounded-shape-sm border border-[var(--border-main)] bg-[var(--surface-card)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex items-center justify-center cursor-pointer"
                      >
                        <span className="h-[23px] leading-[23px] inline-flex items-center">
                          {isRtl ? 'إلغاء' : 'Cancel'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setWelcomeMessage(tempWelcomeMsg);
                          setQuickQuestions(tempQuestions.filter(q => q.trim()));
                          setActiveModal(null);
                        }}
                        className="h-8 min-h-[32px] max-h-[32px] px-5 rounded-shape-sm bg-accent hover:opacity-90 text-white text-xs font-bold inline-flex items-center justify-center cursor-pointer"
                      >
                        <span className="h-[23px] leading-[23px] inline-flex items-center">
                          {isRtl ? 'حفظ' : 'Save'}
                        </span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* -------------------------------------------------------------- */}
                {/* MODAL 3: ربط واتساب (CONNECT WHATSAPP MODAL - Video 00:38)      */}
                {/* -------------------------------------------------------------- */}
                {activeModal === 'whatsapp_link' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 10 }}
                    className="relative z-10 w-full max-w-md max-h-[85dvh] flex flex-col my-auto rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] shadow-2xl overflow-hidden text-[var(--text-primary)]"
                  >
                    <div className="shrink-0 px-5 py-3.5 border-b border-[var(--border-main)] bg-[var(--surface-card)] flex items-center justify-between">
                      <h3 className="text-sm sm:text-base font-extrabold text-[var(--text-primary)]">
                        {isRtl ? 'ربط رقم واتساب للأعمال' : 'Connect WhatsApp Business'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveModal(null)}
                        className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="flex-1 min-h-0 p-5 space-y-4 overflow-y-auto overscroll-contain">
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="w-12 h-12 rounded-shape-full bg-[#25D366]/15 text-[#25D366] flex items-center justify-center">
                          <MessageCircle size={24} />
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                          {isRtl
                            ? 'لإنشاء إعلان يمكّن الأشخاص من بدء محادثات على واتساب مباشرة من منشورك، أدخل رقم واتساب المعتمد.'
                            : 'Enter your active WhatsApp Business number to receive direct customer messages from your ad.'}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-1">
                            {isRtl ? 'الرمز' : 'Code'}
                          </label>
                          <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="w-full h-9 px-2 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] text-xs font-bold font-mono text-[var(--text-primary)] outline-hidden"
                            dir="ltr"
                          >
                            <option value="PS +970">PS +970</option>
                            <option value="PS +972">PS +972</option>
                            <option value="JO +962">JO +962</option>
                            <option value="SA +966">SA +966</option>
                            <option value="AE +971">AE +971</option>
                            <option value="EG +20">EG +20</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-1">
                            {isRtl ? 'رقم واتساب' : 'WhatsApp Number'}
                          </label>
                          <input
                            type="text"
                            value={tempWhatsappPhone}
                            onChange={(e) => setTempWhatsappPhone(e.target.value)}
                            placeholder="+970599000000"
                            className="w-full h-9 px-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] text-xs font-bold font-mono text-[var(--text-primary)] outline-hidden focus:border-accent"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 px-5 py-3 border-t border-[var(--border-main)] bg-[var(--surface-subtle)] flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveModal(null)}
                        className="h-8 min-h-[32px] max-h-[32px] px-4 rounded-shape-sm border border-[var(--border-main)] bg-[var(--surface-card)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex items-center justify-center cursor-pointer"
                      >
                        <span className="h-[23px] leading-[23px] inline-flex items-center">
                          {isRtl ? 'إلغاء' : 'Cancel'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const raw = tempWhatsappPhone.trim();
                          if (raw) {
                            const dialPrefix = (countryCode.split(' ')[1] || '+970').trim();
                            const cleaned = raw.startsWith('+')
                              ? raw
                              : `${dialPrefix}${raw.replace(/^0+/, '')}`;
                            setWhatsappNumber(cleaned);
                            setTempWhatsappPhone(cleaned);
                            toast.success(
                              isRtl ? 'تم حفظ رقم واتساب للأعمال بنجاح' : 'WhatsApp number updated'
                            );
                          }
                          setActiveModal(null);
                        }}
                        className="h-8 min-h-[32px] max-h-[32px] px-5 rounded-shape-sm bg-accent hover:opacity-90 text-white text-xs font-bold inline-flex items-center justify-center cursor-pointer"
                      >
                        <span className="h-[23px] leading-[23px] inline-flex items-center">
                          {isRtl ? 'تأكيد الرقم' : 'Confirm Number'}
                        </span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* -------------------------------------------------------------- */}
                {/* MODAL 4: تعديل الجمهور + متصفح الاستهداف التفصيلي (Video 00:46 - 01:53) */}
                {/* -------------------------------------------------------------- */}
                {activeModal === 'audience' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 10 }}
                    className="relative z-10 w-full max-w-xl max-h-[85dvh] flex flex-col my-auto rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] shadow-2xl overflow-hidden text-[var(--text-primary)]"
                  >
                    {audienceModalView === 'main' ? (
                      <>
                        {/* Header: تعديل الجمهور */}
                        <div className="shrink-0 px-5 py-3.5 border-b border-[var(--border-main)] bg-[var(--surface-card)] flex items-center justify-between">
                          <h3 className="text-sm sm:text-base font-extrabold text-[var(--text-primary)]">
                            {isRtl ? 'تعديل الجمهور' : 'Edit Audience'}
                          </h3>
                          <button
                            type="button"
                            onClick={() => setActiveModal(null)}
                            className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center cursor-pointer"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        {/* Body: Gender, Age, Locations + Map, Detailed Targeting */}
                        <div
                          ref={audienceScrollRef}
                          className="flex-1 min-h-0 p-5 space-y-5 overflow-y-auto overscroll-contain"
                        >
                          <p className="text-xs text-[var(--text-secondary)]">
                            {isRtl
                              ? 'حدد موقع وعمر وجنس واهتمامات الأشخاص الذين تريد الوصول إليهم بإعلانك.'
                              : 'Select the location, age, gender, and detailed interests of the people you want to reach.'}
                          </p>

                          {/* 1. Gender (الجنس - 3 Radio Buttons like Video 00:47) */}
                          <div className="space-y-2">
                            <label className="block text-xs font-extrabold text-[var(--text-primary)]">
                              {isRtl ? 'الجنس' : 'Gender'}
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { id: 'all', labelAr: 'الكل', labelEn: 'All' },
                                { id: 'male', labelAr: 'الرجال', labelEn: 'Men' },
                                { id: 'female', labelAr: 'النساء', labelEn: 'Women' }
                              ].map((g) => {
                                const isSel = gender === g.id;
                                return (
                                  <button
                                    key={g.id}
                                    type="button"
                                    onClick={() => setGender(g.id as TargetGender)}
                                    className={`h-9 px-3 rounded-shape-sm border text-xs font-bold flex items-center justify-between transition-theme cursor-pointer ${
                                      isSel
                                        ? 'border-accent bg-accent/10 text-accent'
                                        : 'border-[var(--border-main)] bg-[var(--surface-subtle)] text-[var(--text-primary)]'
                                    }`}
                                  >
                                    <span>{isRtl ? g.labelAr : g.labelEn}</span>
                                    <span
                                      className={`w-4 h-4 rounded-shape-full border flex items-center justify-center ${
                                        isSel ? 'border-accent bg-accent' : 'border-[var(--border-main)]'
                                      }`}
                                    >
                                      {isSel && (
                                        <span className="w-1.5 h-1.5 rounded-shape-full bg-white" />
                                      )}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* 2. Age Range (العمر - Single Continuous Track Range Slider) */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-extrabold text-[var(--text-primary)]">
                                {isRtl ? 'العمر' : 'Age'}
                              </label>
                              <span className="text-xs font-extrabold font-mono text-accent bg-accent/10 px-2.5 py-0.5 rounded-shape-sm">
                                {ageMin} – {ageMax >= 65 ? '65+' : ageMax} {isRtl ? 'سنة' : 'yrs'}
                              </span>
                            </div>
                            <div className="p-4 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] space-y-3" dir="ltr">
                              <div className="relative flex items-center h-8">
                                {/* Single continuous track line */}
                                <div className="absolute inset-x-0 h-2 bg-[var(--border-main)] rounded-shape-full" />
                                <div
                                  className="absolute h-2 bg-accent rounded-shape-full"
                                  style={{
                                    left: `${((ageMin - 18) / (65 - 18)) * 100}%`,
                                    right: `${100 - ((ageMax - 18) / (65 - 18)) * 100}%`
                                  }}
                                />
                                {/* Min slider thumb */}
                                <input
                                  type="range"
                                  min={18}
                                  max={65}
                                  value={ageMin}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (val <= ageMax) setAgeMin(val);
                                  }}
                                  className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none accent-accent cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
                                />
                                {/* Max slider thumb */}
                                <input
                                  type="range"
                                  min={18}
                                  max={65}
                                  value={ageMax}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (val >= ageMin) setAgeMax(val);
                                  }}
                                  className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none accent-accent cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
                                />
                              </div>
                              <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] px-1" dir="ltr">
                                <span>18</span>
                                <span>30</span>
                                <span>45</span>
                                <span>65+</span>
                              </div>
                            </div>
                          </div>

                          {/* 3. Locations + Radius + Interactive Map (المواقع - Video 00:55 - 01:12) */}
                          <div className="space-y-2.5">
                            <label className="block text-xs font-extrabold text-[var(--text-primary)]">
                              {isRtl ? 'المواقع' : 'Locations'}
                            </label>

                            {/* Search & Selected Location Chips Box */}
                            <div className="p-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] space-y-2.5 relative">
                              <div className="relative">
                                <Search
                                  size={14}
                                  className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                                />
                                <input
                                  type="text"
                                  value={locationSearchQuery}
                                  onFocus={() => setIsLocationSuggestionsOpen(true)}
                                  onChange={(e) => {
                                    setLocationSearchQuery(e.target.value);
                                    setIsLocationSuggestionsOpen(true);
                                  }}
                                  placeholder={
                                    isRtl
                                      ? 'ابحث عن الدول أو المدن أو المناطق...'
                                      : 'Search countries, cities, or regions...'
                                  }
                                  className="w-full h-9 ps-9 pe-3 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-main)] text-xs text-[var(--text-primary)] outline-hidden focus:border-accent"
                                />

                                {/* Location Autocomplete Dropdown */}
                                {isLocationSuggestionsOpen && filteredGeoSuggestions.length > 0 && (
                                  <div className="absolute inset-x-0 top-full mt-1 z-30 bg-[var(--surface-card)] border border-[var(--border-main)] rounded-shape-sm shadow-xl max-h-48 overflow-y-auto p-1">
                                    {filteredGeoSuggestions.map((loc) => (
                                      <button
                                        key={loc.nameAr}
                                        type="button"
                                        onClick={() => handleAddGeoLocation(loc)}
                                        className="w-full px-3 py-2 rounded-shape-xs text-start text-xs hover:bg-[var(--surface-subtle)] flex items-center justify-between cursor-pointer"
                                      >
                                        <div>
                                          <span className="font-bold text-[var(--text-primary)] block">
                                            {isRtl ? loc.nameAr : loc.nameEn}
                                          </span>
                                          <span className="text-[10px] text-[var(--text-muted)] block">
                                            {isRtl ? loc.countryAr : loc.countryEn}
                                          </span>
                                        </div>
                                        <Plus size={14} className="text-accent" />
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Selected Locations with Radius Dropdowns */}
                              <div className="flex flex-wrap gap-2">
                                {selectedLocations.map((loc) => (
                                  <div
                                    key={loc.nameAr}
                                    className="relative inline-flex items-center gap-1.5 h-8 px-2.5 rounded-shape-sm bg-accent/10 border border-accent/30 text-accent text-xs font-bold"
                                  >
                                    <MapPin size={12} />
                                    <span>{isRtl ? loc.nameAr : loc.nameEn}</span>

                                    {/* Radius Trigger */}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setOpenRadiusDropdownCity(
                                          openRadiusDropdownCity === loc.nameAr ? null : loc.nameAr
                                        )
                                      }
                                      className="px-1.5 py-0.5 rounded-shape-xs bg-accent/15 hover:bg-accent/25 text-[10px] font-mono inline-flex items-center gap-0.5 cursor-pointer"
                                    >
                                      <span>
                                        {loc.radiusKm > 0
                                          ? `+${loc.radiusKm} ${isRtl ? 'كم' : 'km'}`
                                          : isRtl
                                          ? 'المدينة فقط'
                                          : 'City only'}
                                      </span>
                                      <ChevronDown size={10} />
                                    </button>

                                    {/* Remove Location */}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveGeoLocation(loc.nameAr)}
                                      className="hover:text-red-500 cursor-pointer ms-0.5"
                                    >
                                      <X size={13} />
                                    </button>

                                    {/* Radius Popup Dropdown */}
                                    {openRadiusDropdownCity === loc.nameAr && (
                                      <div className="absolute top-full start-0 mt-1 z-40 w-36 bg-[var(--surface-card)] border border-[var(--border-main)] rounded-shape-sm shadow-xl p-1 space-y-0.5 text-[var(--text-primary)]">
                                        {[0, 15, 25, 40, 60, 80].map((r) => (
                                          <button
                                            key={r}
                                            type="button"
                                            onClick={() => handleUpdateLocationRadius(loc.nameAr, r)}
                                            className={`w-full px-2.5 py-1.5 text-start text-[11px] font-bold rounded-shape-xs flex items-center justify-between cursor-pointer ${
                                              loc.radiusKm === r
                                                ? 'bg-accent/10 text-accent'
                                                : 'hover:bg-[var(--surface-subtle)]'
                                            }`}
                                          >
                                            <span>
                                              {r === 0
                                                ? isRtl
                                                  ? 'المدينة فقط'
                                                  : 'City only'
                                                : `+${r} ${isRtl ? 'كم' : 'km'}`}
                                            </span>
                                            {loc.radiusKm === r && <Check size={12} />}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Reach Beyond Selected Locations Checkbox */}
                            <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                              <input
                                type="checkbox"
                                checked={reachBeyondLocations}
                                onChange={(e) => setReachBeyondLocations(e.target.checked)}
                                className="mt-0.5 w-4 h-4 accent-accent rounded-shape-xs cursor-pointer"
                              />
                              <div className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                                <span className="font-bold text-[var(--text-primary)] block">
                                  {isRtl
                                    ? 'الوصول إلى المزيد من الأشخاص الذين من المرجح أن يستجيبوا'
                                    : 'Reach more people likely to respond'}
                                </span>
                                <span>
                                  {isRtl
                                    ? 'توسيع النطاق تلقائياً عند وجود جمهور متفاعل خارج الحدود المحددة.'
                                    : 'Allow delivery slightly beyond selected boundaries when likely to improve results.'}
                                </span>
                              </div>
                            </label>

                            {/* Interactive Visual Map Container (Matching Video 00:58 - 01:12) */}
                            <div
                              onClick={(e) => {
                                if (!isPinDropActive) return;
                                const rect = e.currentTarget.getBoundingClientRect();
                                const relX = (e.clientX - rect.left) / rect.width;
                                const relY = (e.clientY - rect.top) / rect.height;
                                const lat = Number((32.5 - relY * 1.6).toFixed(4));
                                const lng = Number((34.4 + relX * 1.4).toFixed(4));
                                const nearest = AVAILABLE_GEO_LOCATIONS.reduce((prev, curr) => {
                                  const dPrev = Math.hypot(prev.lat - lat, prev.lng - lng);
                                  const dCurr = Math.hypot(curr.lat - lat, curr.lng - lng);
                                  return dCurr < dPrev ? curr : prev;
                                }, AVAILABLE_GEO_LOCATIONS[0]);
                                handleAddGeoLocation(nearest);
                                setIsPinDropActive(false);
                              }}
                              className={`relative h-44 rounded-shape-sm border border-[var(--border-main)] bg-[#0f172a] overflow-hidden select-none ${
                                isPinDropActive ? 'cursor-crosshair ring-2 ring-accent' : ''
                              }`}
                            >
                              {/* Stylized Map Grid & Geography */}
                              <div
                                className="absolute inset-0 opacity-30 transition-transform duration-200"
                                style={{
                                  transform: `scale(${1 + (mapZoom - 8) * 0.15})`,
                                  backgroundImage:
                                    'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.35), transparent 65%), linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)',
                                  backgroundSize: '100% 100%, 28px 28px, 28px 28px'
                                }}
                              />

                              {/* Map City Labels & Radius Circle Visualization */}
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                {(() => {
                                  const avgRadius =
                                    selectedLocations.length > 0
                                      ? selectedLocations.reduce((acc, l) => acc + (l.radiusKm || 20), 0) /
                                        selectedLocations.length
                                      : 30;
                                  const circleSize = Math.max(
                                    72,
                                    Math.min(148, Math.round(avgRadius * 2.4 + (mapZoom - 8) * 6))
                                  );
                                  return (
                                    <div className="relative flex items-center justify-center">
                                      <div
                                        style={{ width: `${circleSize}px`, height: `${circleSize}px` }}
                                        className="rounded-shape-full bg-blue-500/20 border-2 border-blue-400/70 flex items-center justify-center transition-all duration-200"
                                      >
                                        <div className="w-7 h-7 rounded-shape-full bg-blue-600 text-white flex items-center justify-center shadow-lg border-2 border-white">
                                          <MapPin size={14} />
                                        </div>
                                      </div>
                                      <span className="absolute -bottom-6 px-2 py-0.5 rounded-shape-xs bg-black/80 text-white text-[10px] font-bold whitespace-nowrap border border-white/15">
                                        {selectedLocations
                                          .map(
                                            l =>
                                              `${isRtl ? l.nameAr : l.nameEn}${
                                                l.radiusKm > 0 ? ` (+${l.radiusKm}km)` : ''
                                              }`
                                          )
                                          .join(' · ')}
                                      </span>
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Drop Pin Button (إفلات دبوس) */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsPinDropActive(!isPinDropActive);
                                  toast.info(
                                    !isPinDropActive
                                      ? isRtl
                                        ? 'انقر في أي مكان على الخريطة لإفلات الدبوس وتحديد المنطقة'
                                        : 'Click anywhere on the map to drop a pin'
                                      : isRtl
                                      ? 'تم إلغاء وضع إفلات الدبوس'
                                      : 'Pin drop mode cancelled'
                                  );
                                }}
                                className={`absolute top-2.5 start-2.5 h-8 min-h-[32px] max-h-[32px] px-3 rounded-shape-sm text-xs font-bold inline-flex items-center gap-1.5 border shadow-md cursor-pointer transition-theme ${
                                  isPinDropActive
                                    ? 'bg-accent text-white border-accent'
                                    : 'bg-zinc-900/90 text-white border-white/20 hover:bg-zinc-800'
                                }`}
                              >
                                <MapPin size={13} />
                                <span className="h-[23px] leading-[23px] inline-flex items-center">
                                  {isRtl ? 'إفلات دبوس' : 'Drop Pin'}
                                </span>
                              </button>

                              {/* Zoom Controls (+ / -) */}
                              <div className="absolute bottom-2.5 end-2.5 flex flex-col gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMapZoom(z => Math.min(14, z + 1));
                                  }}
                                  className="w-7 h-7 rounded-shape-xs bg-zinc-900/90 hover:bg-zinc-800 text-white border border-white/20 flex items-center justify-center cursor-pointer"
                                >
                                  <ZoomIn size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMapZoom(z => Math.max(5, z - 1));
                                  }}
                                  className="w-7 h-7 rounded-shape-xs bg-zinc-900/90 hover:bg-zinc-800 text-white border border-white/20 flex items-center justify-center cursor-pointer"
                                >
                                  <ZoomOut size={13} />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* 4. Detailed Targeting Summary & Browse Button (الاستهداف التفصيلي - Video 01:13 & 01:51) */}
                          <div className="space-y-3 pt-2 border-t border-[var(--border-main)]">
                            <div>
                              <label className="block text-xs font-extrabold text-[var(--text-primary)]">
                                {isRtl ? 'الاستهداف التفصيلي' : 'Detailed Targeting'}
                              </label>
                              <p className="text-[11px] text-[var(--text-muted)]">
                                {isRtl
                                  ? 'سيتم عرض إعلانك للأشخاص الذين يستوفون معياراً واحداً على الأقل من المعايير التالية:'
                                  : 'Your ad will be shown to people matching at least one of the following criteria:'}
                              </p>
                            </div>

                            {/* Search Input + "تصفح" Button */}
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <Search
                                  size={14}
                                  className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                                />
                                <input
                                  type="text"
                                  value={targetingSearchQuery}
                                  onChange={(e) => setTargetingSearchQuery(e.target.value)}
                                  onFocus={() => setAudienceModalView('browse_taxonomy')}
                                  placeholder={
                                    isRtl
                                      ? 'ابحث في البيانات الديموغرافية، الاهتمامات، أو السلوكيات...'
                                      : 'Search demographics, interests, or behaviors...'
                                  }
                                  className="w-full h-9 ps-9 pe-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] text-xs text-[var(--text-primary)] outline-hidden focus:border-accent"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => setAudienceModalView('browse_taxonomy')}
                                className="h-9 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-main)] text-xs font-bold text-[var(--text-primary)] inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                              >
                                <span>{isRtl ? 'تصفح' : 'Browse'}</span>
                                {isRtl ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                              </button>
                            </div>

                            {/* Selected Detailed Targeting Chips */}
                            {resolvedTargetingItems.length > 0 && (
                              <div className="p-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] space-y-2">
                                <span className="text-[11px] font-bold text-[var(--text-muted)] block">
                                  {isRtl
                                    ? `المعايير المختارة (${resolvedTargetingItems.length}):`
                                    : `Selected Criteria (${resolvedTargetingItems.length}):`}
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {resolvedTargetingItems.map((item) => (
                                    <span
                                      key={item.id}
                                      className="h-7 px-2.5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-main)] text-xs font-bold text-[var(--text-primary)] inline-flex items-center gap-1.5"
                                    >
                                      <span>{isRtl ? item.nameAr : item.nameEn}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleTargetingItem(item.id)}
                                        className="text-[var(--text-muted)] hover:text-red-500 cursor-pointer"
                                      >
                                        <X size={12} />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Quick Suggested Chips ("اقتراحات قد تعجبك" - Video 01:51) */}
                            <div className="space-y-1.5">
                              <span className="text-[11px] font-bold text-[var(--text-muted)] block">
                                {isRtl ? 'اقتراحات سريعة ذات صلة:' : 'Suggested Criteria:'}
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {DETAILED_TARGETING_TAXONOMY.filter(
                                  item => !selectedInterests.includes(item.id)
                                )
                                  .slice(0, 6)
                                  .map((sug) => (
                                    <button
                                      key={sug.id}
                                      type="button"
                                      onClick={() => handleToggleTargetingItem(sug.id)}
                                      className="h-7 px-2.5 rounded-shape-xs bg-[var(--surface-subtle)] hover:bg-accent/10 border border-[var(--border-main)] hover:border-accent/30 text-[11px] font-bold text-[var(--text-secondary)] hover:text-accent inline-flex items-center gap-1 cursor-pointer transition-theme"
                                    >
                                      <Plus size={11} />
                                      <span>{isRtl ? sug.nameAr : sug.nameEn}</span>
                                    </button>
                                  ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Footer: حفظ الجمهور */}
                        <div className="shrink-0 px-5 py-3 border-t border-[var(--border-main)] bg-[var(--surface-subtle)] flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveModal(null)}
                            className="h-8 min-h-[32px] max-h-[32px] px-4 rounded-shape-sm border border-[var(--border-main)] bg-[var(--surface-card)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex items-center justify-center cursor-pointer"
                          >
                            <span className="h-[23px] leading-[23px] inline-flex items-center">
                              {isRtl ? 'إلغاء' : 'Cancel'}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAudiencePreset('custom_targeted');
                              setActiveModal(null);
                              toast.success(
                                isRtl ? 'تم حفظ إعدادات الجمهور المستهدف' : 'Target audience saved'
                              );
                            }}
                            className="h-8 min-h-[32px] max-h-[32px] px-5 rounded-shape-sm bg-accent hover:opacity-90 text-white text-xs font-bold inline-flex items-center justify-center cursor-pointer"
                          >
                            <span className="h-[23px] leading-[23px] inline-flex items-center">
                              {isRtl ? 'حفظ الجمهور' : 'Save Audience'}
                            </span>
                          </button>
                        </div>
                      </>
                    ) : (
                      /* ---------------------------------------------------------- */
                      /* NESTED VIEW: متصفح الاستهداف التفصيلي (Video 01:14 - 01:48) */
                      /* ---------------------------------------------------------- */
                      <>
                        <div className="shrink-0 px-5 py-3.5 border-b border-[var(--border-main)] bg-[var(--surface-card)] flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => setAudienceModalView('main')}
                              className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-primary)] flex items-center justify-center cursor-pointer"
                            >
                              {isRtl ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
                            </button>
                            <h3 className="text-sm sm:text-base font-extrabold text-[var(--text-primary)]">
                              {isRtl ? 'الاستهداف التفصيلي' : 'Detailed Targeting'}
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveModal(null)}
                            className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center cursor-pointer"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        <div
                          ref={audienceScrollRef}
                          className="flex-1 min-h-0 p-5 space-y-4 overflow-y-auto overscroll-contain"
                        >
                          {/* Search Bar */}
                          <div className="relative">
                            <Search
                              size={14}
                              className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                            />
                            <input
                              type="text"
                              value={targetingSearchQuery}
                              onChange={(e) => setTargetingSearchQuery(e.target.value)}
                              placeholder={
                                isRtl
                                  ? 'الاستهداف التفصيلي (بحث سريع)...'
                                  : 'Search detailed targeting...'
                              }
                              className="w-full h-9 ps-9 pe-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] text-xs text-[var(--text-primary)] outline-hidden focus:border-accent"
                            />
                            {targetingSearchQuery && (
                              <button
                                type="button"
                                onClick={() => setTargetingSearchQuery('')}
                                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                              >
                                <X size={13} />
                              </button>
                            )}
                          </div>

                          {/* 3 Taxonomy Tabs: البيانات الديموغرافية | الاهتمامات | السلوكيات */}
                          <div className="grid grid-cols-3 border-b border-[var(--border-main)] text-xs font-extrabold text-center">
                            {[
                              { id: 'demographics', labelAr: 'البيانات الديموغرافية', labelEn: 'Demographics' },
                              { id: 'interests', labelAr: 'الاهتمامات', labelEn: 'Interests' },
                              { id: 'behaviors', labelAr: 'السلوكيات', labelEn: 'Behaviors' }
                            ].map((t) => {
                              const isAct = taxonomyTab === t.id;
                              return (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => {
                                    setTaxonomyTab(t.id as any);
                                    setTargetingSearchQuery('');
                                  }}
                                  className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
                                    isAct
                                      ? 'border-accent text-accent'
                                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                  }`}
                                >
                                  {isRtl ? t.labelAr : t.labelEn}
                                </button>
                              );
                            })}
                          </div>

                          {/* Helper Description per Tab */}
                          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                            {taxonomyTab === 'demographics'
                              ? isRtl
                                ? 'الوصول إلى الأشخاص استناداً إلى تفاصيل التعليم، والتوظيف، والأسرة، والمناسبات الشخصية.'
                                : 'Reach people based on education, employment, household, and life events.'
                              : taxonomyTab === 'interests'
                              ? isRtl
                                ? 'الوصول إلى جماهير محددة من خلال الاطلاع على اهتماماتهم ومجالات أعمالهم والصفحات التي يتفاعلون معها.'
                                : 'Reach specific audiences by looking at their business sectors, interests, and activities.'
                              : isRtl
                              ? 'الوصول إلى الأشخاص استناداً إلى السلوك الشرائي، والأنشطة الرقمية، واستخدام الأجهزة المحمولة، والسفر.'
                              : 'Reach people based on purchase behavior, digital activities, device usage, and travel.'}
                          </p>

                          {/* Accordion Groups */}
                          <div className="space-y-2">
                            {Object.entries(groupedTaxonomy).map(([groupTitle, items]) => {
                              const isExp = expandedGroups[groupTitle] ?? true;
                              return (
                                <div
                                  key={groupTitle}
                                  className="rounded-shape-sm border border-[var(--border-main)] bg-[var(--surface-subtle)]/50 overflow-hidden"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedGroups(prev => ({
                                        ...prev,
                                        [groupTitle]: !isExp
                                      }))
                                    }
                                    className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-extrabold text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] cursor-pointer"
                                  >
                                    <span>{groupTitle}</span>
                                    <ChevronDown
                                      size={15}
                                      className={`text-[var(--text-muted)] transition-transform ${
                                        isExp ? 'rotate-180' : ''
                                      }`}
                                    />
                                  </button>

                                  {isExp && (
                                    <div className="px-3.5 pb-2.5 pt-1 space-y-1.5 border-t border-[var(--border-main)]/50 bg-[var(--surface-card)]">
                                      {items.map((item) => {
                                        const isChecked = selectedInterests.includes(item.id);
                                        return (
                                          <label
                                            key={item.id}
                                            className="flex items-center justify-between py-1.5 px-2 rounded-shape-xs hover:bg-[var(--surface-subtle)] cursor-pointer"
                                          >
                                            <div className="flex items-center gap-2.5">
                                              <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => handleToggleTargetingItem(item.id)}
                                                className="w-4 h-4 accent-accent rounded-shape-xs cursor-pointer"
                                              />
                                              <span className="text-xs font-bold text-[var(--text-primary)]">
                                                {isRtl ? item.nameAr : item.nameEn}
                                              </span>
                                            </div>
                                            <span className="text-[10px] font-mono text-[var(--text-muted)]">
                                              ~{item.reachEstimate}
                                            </span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Footer: الرجوع لحفظ الجمهور */}
                        <div className="shrink-0 px-5 py-3 border-t border-[var(--border-main)] bg-[var(--surface-subtle)] flex items-center justify-between">
                          <span className="text-xs font-bold text-[var(--text-secondary)]">
                            {isRtl
                              ? `تم تحديد ${selectedInterests.length} معيار`
                              : `${selectedInterests.length} selected`}
                          </span>
                          <button
                            type="button"
                            onClick={() => setAudienceModalView('main')}
                            className="h-8 min-h-[32px] max-h-[32px] px-5 rounded-shape-sm bg-accent hover:opacity-90 text-white text-xs font-bold inline-flex items-center justify-center cursor-pointer"
                          >
                            <span className="h-[23px] leading-[23px] inline-flex items-center">
                              {isRtl ? 'تطبيق والعودة' : 'Apply & Back'}
                            </span>
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {/* -------------------------------------------------------------- */}
                {/* MODAL 5: عرض كل المعاينات (ALL PLACEMENTS PREVIEW MODAL)        */}
                {/* -------------------------------------------------------------- */}
                {activeModal === 'all_previews' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 10 }}
                    className="relative z-10 w-full max-w-4xl max-h-[85dvh] flex flex-col my-auto rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] shadow-2xl overflow-hidden text-[var(--text-primary)]"
                  >
                    <div className="shrink-0 px-5 py-3.5 border-b border-[var(--border-main)] bg-[var(--surface-card)] flex items-center justify-between">
                      <h3 className="text-sm sm:text-base font-extrabold text-[var(--text-primary)]">
                        {isRtl ? 'معاينة الإعلان في جميع المواضع' : 'All Placement Previews'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveModal(null)}
                        className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="flex-1 min-h-0 p-5 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto overscroll-contain bg-[var(--surface-subtle)]">
                      {[
                        { titleAr: 'خلاصة الهاتف المحمول', titleEn: 'Mobile Feed', icon: Smartphone },
                        { titleAr: 'خلاصة سطح المكتب', titleEn: 'Desktop Feed', icon: Monitor },
                        { titleAr: 'مقاطع الريلز والقصص', titleEn: 'Reels & Stories', icon: Film }
                      ].map((place, idx) => {
                        const Icon = place.icon;
                        return (
                          <div
                            key={idx}
                            className="rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-main)] p-3.5 space-y-3 flex flex-col justify-between"
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-center gap-2 text-xs font-extrabold text-[var(--text-primary)] pb-2 border-b border-[var(--border-main)]">
                                <Icon size={14} className="text-accent" />
                                <span>{isRtl ? place.titleAr : place.titleEn}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <img
                                  src={ad.page_avatar || ad.author_avatar || '/default-avatar.png'}
                                  alt="Avatar"
                                  className="w-8 h-8 rounded-shape-xs object-cover border border-[var(--border-main)]"
                                />
                                <div>
                                  <span className="text-xs font-bold block">
                                    {ad.page_name || ad.author_name || 'Advertiser'}
                                  </span>
                                  <span className="text-[10px] text-accent font-bold block">
                                    {isRtl ? 'مُموَّل' : 'Sponsored'}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs font-bold line-clamp-1">{ad.title}</p>
                              <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2">
                                {ad.description}
                              </p>
                              {ad.image_url && (
                                <img
                                  src={getMediaUrl(ad.image_url) || undefined}
                                  alt={ad.title}
                                  className="w-full aspect-4/3 object-cover rounded-shape-xs border border-[var(--border-main)]"
                                />
                              )}
                            </div>
                            <div className="pt-2 border-t border-[var(--border-main)] flex items-center justify-between">
                              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                                {whatsappNumber}
                              </span>
                              <span className="px-2.5 py-1 rounded-shape-xs bg-accent/10 text-accent text-[11px] font-bold">
                                {isRtl ? activeCtaObj.labelAr : activeCtaObj.labelEn}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};
