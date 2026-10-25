import React from 'react';
import { Camera, Smartphone, Monitor, FileText, Layers, Sparkles, Edit3, UploadCloud } from 'lucide-react';

export interface CanvasPreset {
  id: string;
  nameAr: string;
  nameEn: string;
  width: number;
  height: number;
  icon: React.ReactNode;
  aspectRatio: string;
  category: 'social' | 'marketing' | 'print' | 'custom';
}

export const CANVAS_PRESETS: CanvasPreset[] = [
  {
    id: 'instagram_post',
    nameAr: 'منشور إنستغرام (مربع 1:1)',
    nameEn: 'Instagram Post (1:1)',
    width: 1080,
    height: 1080,
    icon: <Camera className="w-5 h-5 text-pink-500" />,
    aspectRatio: '1:1',
    category: 'social'
  },
  {
    id: 'instagram_portrait',
    nameAr: 'منشور إنستغرام (عمودي 4:5)',
    nameEn: 'Instagram Portrait (4:5)',
    width: 1080,
    height: 1350,
    icon: <Camera className="w-5 h-5 text-pink-600" />,
    aspectRatio: '4:5',
    category: 'social'
  },
  {
    id: 'instagram_story',
    nameAr: 'قصة إنستغرام / ستوري (9:16)',
    nameEn: 'Instagram Story (9:16)',
    width: 1080,
    height: 1920,
    icon: <Smartphone className="w-5 h-5 text-purple-500" />,
    aspectRatio: '9:16',
    category: 'social'
  },
  {
    id: 'tiktok_post',
    nameAr: 'منشور تيك توك / شورتس (9:16)',
    nameEn: 'TikTok & Shorts Post (9:16)',
    width: 1080,
    height: 1920,
    icon: <Smartphone className="w-5 h-5 text-rose-500" />,
    aspectRatio: '9:16',
    category: 'social'
  },
  {
    id: 'youtube_banner',
    nameAr: 'غلاف يوتيوب عريض (16:9)',
    nameEn: 'YouTube Wide Banner (16:9)',
    width: 1920,
    height: 1080,
    icon: <Monitor className="w-5 h-5 text-red-500" />,
    aspectRatio: '16:9',
    category: 'marketing'
  },
  {
    id: 'youtube_thumbnail',
    nameAr: 'صورة يوتيوب مصغرة (16:9)',
    nameEn: 'YouTube Thumbnail',
    width: 1280,
    height: 720,
    icon: <Monitor className="w-5 h-5 text-red-400" />,
    aspectRatio: '16:9',
    category: 'marketing'
  },
  {
    id: 'facebook_post',
    nameAr: 'منشور فيسبوك عريض',
    nameEn: 'Facebook Post',
    width: 1200,
    height: 630,
    icon: <Camera className="w-5 h-5 text-blue-500" />,
    aspectRatio: '1.91:1',
    category: 'social'
  },
  {
    id: 'facebook_story',
    nameAr: 'ستوري فيسبوك (9:16)',
    nameEn: 'Facebook Story',
    width: 1080,
    height: 1920,
    icon: <Smartphone className="w-5 h-5 text-blue-400" />,
    aspectRatio: '9:16',
    category: 'social'
  },
  {
    id: 'twitter_banner',
    nameAr: 'غلاف تويتر / إكس (X)',
    nameEn: 'Twitter / X Banner',
    width: 1500,
    height: 500,
    icon: <Monitor className="w-5 h-5 text-sky-400" />,
    aspectRatio: '3:1',
    category: 'marketing'
  },
  {
    id: 'linkedin_post',
    nameAr: 'منشور لينكد إن احترافي',
    nameEn: 'LinkedIn Post',
    width: 1200,
    height: 627,
    icon: <Monitor className="w-5 h-5 text-blue-700" />,
    aspectRatio: '1.91:1',
    category: 'marketing'
  },
  {
    id: 'linkedin_banner',
    nameAr: 'بانر لينكد إن للشركات',
    nameEn: 'LinkedIn Company Banner',
    width: 1128,
    height: 376,
    icon: <Monitor className="w-5 h-5 text-blue-600" />,
    aspectRatio: '3:1',
    category: 'marketing'
  },
  {
    id: 'pinterest_pin',
    nameAr: 'تصميم بينتريست (Pin 2:3)',
    nameEn: 'Pinterest Pin',
    width: 1000,
    height: 1500,
    icon: <Smartphone className="w-5 h-5 text-red-600" />,
    aspectRatio: '2:3',
    category: 'social'
  },
  {
    id: 'snapchat_ad',
    nameAr: 'إعلان سناب شات / ستوري',
    nameEn: 'Snapchat Ad & Story',
    width: 1080,
    height: 1920,
    icon: <Smartphone className="w-5 h-5 text-amber-400" />,
    aspectRatio: '9:16',
    category: 'social'
  },
  {
    id: 'whatsapp_status',
    nameAr: 'حالة واتساب (9:16)',
    nameEn: 'WhatsApp Status',
    width: 1080,
    height: 1920,
    icon: <Smartphone className="w-5 h-5 text-[var(--fg-success)]" />,
    aspectRatio: '9:16',
    category: 'social'
  },
  {
    id: 'a4_print',
    nameAr: 'مستند طباعة (A4)',
    nameEn: 'A4 Print Document',
    width: 2480,
    height: 3508,
    icon: <FileText className="w-5 h-5 text-amber-600" />,
    aspectRatio: '1:1.41',
    category: 'print'
  }
];

export const PUBLIC_STUDIO_FEATURES = [
  {
    icon: <Layers className="w-5 h-5 text-[var(--accent)]" />,
    titleAr: 'محرر متعدد الصفحات (Multi-Page Canvas)',
    titleEn: 'Multi-Page Canvas System',
    descAr: 'إضافة وتنظيم وتنسيق صفحات متعددة داخل مساحة عمل مرنة مع التمرير السلس بين الصفحات.',
    descEn: 'Create, reorder, and edit stacked multi-page canvases seamlessly.'
  },
  {
    icon: <Sparkles className="w-5 h-5 text-[var(--accent)]" />,
    titleAr: 'المحو السحري وتنقية الخلفيات',
    titleEn: 'AI Magic Eraser & Inpainting',
    descAr: 'إزالة الأجسام غير المرغوبة وترميم خلفية الصور بالذكاء الاصطناعي بنقرة واحدة.',
    descEn: 'Instantly remove unwanted objects and repair background textures.'
  },
  {
    icon: <Edit3 className="w-5 h-5 text-[var(--accent)]" />,
    titleAr: 'خطوط عربية وتشكيل نصوص احترافي',
    titleEn: 'Arabic Calligraphy & Typography',
    descAr: 'مكتبة خطوط عربية فاخرة مع التحكم في ظلال النصوص، الحدود، والتشكيل الجمالي.',
    descEn: 'Curated Arabic fonts with precise text shadows, strokes, and letter spacing.'
  },
  {
    icon: <UploadCloud className="w-5 h-5 text-[var(--accent)]" />,
    titleAr: 'تصدير عالي الدقة 4K بدون علامات مائية',
    titleEn: 'High-Res 4K Exporting',
    descAr: 'حفظ واستخراج التصميمات بصيغ PNG, WEBP, PDF, SVG عالية الجودة مباشرة.',
    descEn: 'Export high-definition graphics in PNG, WEBP, PDF, and SVG vector formats.'
  }
];

export function parseTemplateDimensions(dimStr?: string): { width: number; height: number } | undefined {
  if (!dimStr) return undefined;
  const match = dimStr.match(/(\d+)\s*[×xX*]\s*(\d+)/);
  if (match) {
    const w = parseInt(match[1], 10);
    const h = parseInt(match[2], 10);
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
      return { width: w, height: h };
    }
  }
  return undefined;
}
