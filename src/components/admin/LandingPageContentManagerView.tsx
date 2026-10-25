import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../hooks/useToast';
import { 
  LayoutTemplate, Image, Tv, LayoutGrid, Volume2, Code2, Users, 
  Save, RotateCcw, Plus, Trash2, Sparkles, Globe,
  Video, Play, Upload, CheckCircle2, AlertCircle, Info, ExternalLink,
  Film, ShieldCheck, FileVideo, Eye
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { extractYouTubeId, getYouTubeEmbedUrl } from '../../utils/videoUtils';

export const LandingPageContentManagerView: React.FC = () => {
  const { language, token } = useAppContext();
  const isRtl = language === 'ar';
  const { showToast } = useToast(3000);

  const [activeTab, setActiveTab] = useState<'hero' | 'heroVideo' | 'images' | 'video' | 'rinex' | 'audio' | 'apps' | 'viral'>('heroVideo');
  const [selectedVideoLang, setSelectedVideoLang] = useState<'ar' | 'en'>('ar');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState<string>('');
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);

  const [cmsConfig, setCmsConfig] = useState(() => {
    const saved = localStorage.getItem('perplexta_landing_cms');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      hero: {
        badgeAr: 'منصة الذكاء الاصطناعي والاستوديوهات السيادية المتكاملة',
        badgeEn: 'Sovereign Multi-Model AI & Studio Ecosystem',
        titleAr: 'عصر جديد من هندسة الذكاء الاصطناعي السيادي والإنتاج الاحترافي',
        titleEn: 'A New Era of Sovereign AI Engineering & Professional Production',
        subtitleAr: 'منصة متكاملة تجمع استوديوهات توليد الصور، الفيديو، الصوت، هندسة التطبيقات، وشبكة أرباح المبدعين.',
        subtitleEn: 'Unified ecosystem combining AI image, video, audio studios, full-stack app engineering, and creator royalties.'
      },
      heroVideo: {
        enabled: true,
        sourceType: 'file' as 'file' | 'youtube',
        sourceTypeAr: 'file' as 'file' | 'youtube',
        sourceTypeEn: 'file' as 'file' | 'youtube',
        videoUrl: '',
        videoUrlAr: '',
        videoUrlEn: '',
        youtubeUrl: '',
        youtubeUrlAr: '',
        youtubeUrlEn: '',
        posterUrl: '',
        posterUrlAr: '',
        posterUrlEn: '',
        titleAr: 'جولة سريعة داخل منظومة بيربليكستا',
        titleEn: 'Quick Tour Inside Perplexta Ecosystem',
        descriptionAr: 'شاهد كيف يمكنك توليد تطبيقات كاملة، وتصميم قوالب بصرية حرة، وإنجاز أبحاثك الأكاديمية في بيئة عمل سيادية متكاملة.',
        descriptionEn: 'Experience how you can generate full-stack apps, design multi-layer templates, and complete scholarly research inside a unified sovereign platform.',
        autoplay: false,
        muted: true,
        loop: true,
        controls: true,
      },
      imageStudio: [
        { titleAr: 'نيون سايبربانك 4K', titleEn: 'Cyberpunk Neon Genesis', prompt: 'Cinematic cyberpunk city, neon glowing reflections, photorealistic 8k', tag: 'Flux Pro 4K', img: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop&q=80' },
        { titleAr: 'شبكة الحوسبة العصبية', titleEn: 'Quantum Neural Grid', prompt: 'Abstract neural network compute nodes, vibrant cyan and purple glow', tag: 'Neural V2', img: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=80' },
        { titleAr: 'محارب السيبرانيك الملحمي', titleEn: 'Cybernetic Armor Warrior', prompt: 'Epic sci-fi warrior portrait, cinematic volumetric lighting, unreal engine 5', tag: 'SDXL Ultra', img: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80' }
      ],
      videoStudio: [
        { titleAr: 'انيميشن سينيماطيجي 4K', titleEn: 'Cinematic Sci-Fi Motion', prompt: 'Drone shot flying through sci-fi nebula corridor, 60fps', duration: '00:15s', img: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80' },
        { titleAr: 'إعلان تجاري فائق الدقة', titleEn: 'Commercial Product Reveal', prompt: 'Luxury watch rotating in zero gravity, studio lighting', duration: '00:10s', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80' }
      ],
      rinexStudio: [
        { titleAr: 'قالب هوية شركة تقنية', titleEn: 'Tech Startup Brand Kit', category: 'Motion Identity', layers: '14 Vector Layers', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80' },
        { titleAr: 'تصميم منشورات السوشيال', titleEn: 'Social Media Growth Reel', category: 'Viral Marketing', layers: '8 Keyframe Tracks', img: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format&fit=crop&q=80' }
      ],
      audioStudio: [
        { titleAr: 'طرب أصيل - ليالي العود', titleEn: 'Classic Tarab - Oud Night', genre: 'Tarab & Strings', duration: '04:12s', tag: '24kHz Lossless', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80' },
        { titleAr: 'سيمفونية بيانو كلاسيكية', titleEn: 'Classical Piano Symphony', genre: 'Classical Masterpiece', duration: '03:50s', tag: 'Acoustic Grand', img: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80' }
      ],
      appStudio: [
        { titleAr: 'منصة التجارة الإلكترونية الذكية', titleEn: 'Neural E-Commerce Platform', desc: 'React, Vite, Tailwind & Stripe Checkout Integration', tag: 'Full-Stack 0.8s', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80' },
        { titleAr: 'لوحة تحكم SaaS المتقدمة', titleEn: 'Advanced SaaS Analytics Dashboard', desc: 'Real-time telemetry, charts & PostgreSQL dual schema', tag: 'Enterprise Ready', img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80' }
      ],
      viralBook: [
        { titleAr: 'قالب إعلان ترويجي لشركة ناشئة', titleEn: 'Startup Growth Ad Campaign Kit', category: 'Viral Marketing', royalty: '$0.70 / use', img: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80' },
        { titleAr: 'حزمة قصص انستغرام وتيك توك', titleEn: 'TikTok & Reels Viral Story Pack', category: 'Social Commerce', royalty: '20% Recurring', img: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format&fit=crop&q=80' }
      ]
    };
  });

  // Sync CMS config from server on mount
  useEffect(() => {
    let isMounted = true;
    fetch('/api/admin/cms/config', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.config && isMounted) {
          setCmsConfig((prev: any) => ({
            ...prev,
            ...data.config,
            heroVideo: {
              ...(prev.heroVideo || {}),
              ...(data.config.heroVideo || {})
            }
          }));
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [token]);

  const handleSave = async () => {
    triggerHaptic('medium');
    setIsSaving(true);
    localStorage.setItem('perplexta_landing_cms', JSON.stringify(cmsConfig));

    try {
      if (token) {
        await fetch('/api/admin/cms/config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ config: cmsConfig })
        });
      }
      window.dispatchEvent(new CustomEvent('landing-cms-updated', { detail: cmsConfig }));
      showToast(isRtl ? 'تم حفظ وتحديث محتوى صفحة الهبوط والفيديوهات بنجاح تام' : 'Landing CMS and showcase videos saved successfully', 'success');
    } catch {
      showToast(isRtl ? 'تم الحفظ محلياً مع تعذر المزامنة السحابية' : 'Saved locally with cloud sync pending', 'warning');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    triggerHaptic('light');
    localStorage.removeItem('perplexta_landing_cms');
    window.location.reload();
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, langTarget?: 'ar' | 'en') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const target = langTarget || selectedVideoLang;

    if (file.size > 100 * 1024 * 1024) {
      showToast(isRtl ? 'حجم الفيديو يتجاوز 100 ميجابايت الحد الأقصى' : 'Video exceeds maximum 100MB limit', 'error');
      return;
    }

    setIsUploadingVideo(true);
    setVideoUploadProgress(isRtl ? `جاري رفع فيديو اللغة ${target === 'ar' ? 'العربية' : 'الإنجليزية'}...` : `Uploading ${target === 'ar' ? 'Arabic' : 'English'} video...`);

    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('lang', target);

      const res = await fetch('/api/admin/cms/upload-video', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setCmsConfig((prev: any) => {
          const hv = prev.heroVideo || {};
          if (target === 'en') {
            return {
              ...prev,
              heroVideo: {
                ...hv,
                videoUrlEn: data.videoUrl,
                videoUrl: hv.videoUrl || data.videoUrl,
                sourceTypeEn: 'file',
                autoplay: true,
                muted: true,
                controls: true
              }
            };
          } else {
            return {
              ...prev,
              heroVideo: {
                ...hv,
                videoUrlAr: data.videoUrl,
                videoUrl: data.videoUrl,
                sourceTypeAr: 'file',
                autoplay: true,
                muted: true,
                controls: true
              }
            };
          }
        });
        showToast(isRtl ? `تم رفع فيديو اللغة ${target === 'ar' ? 'العربية' : 'الإنجليزية'} بنجاح` : `Video uploaded for ${target === 'ar' ? 'Arabic' : 'English'} successfully`, 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || (isRtl ? 'فشل رفع الفيديو' : 'Video upload failed'), 'error');
      }
    } catch (err: any) {
      showToast(err.message || (isRtl ? 'خطأ في الاتصال أثناء الرفع' : 'Upload error'), 'error');
    } finally {
      setIsUploadingVideo(false);
      setVideoUploadProgress('');
      if (e.target) e.target.value = '';
    }
  };

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>, langTarget?: 'ar' | 'en') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const target = langTarget || selectedVideoLang;

    setIsUploadingPoster(true);
    try {
      const formData = new FormData();
      formData.append('poster', file);
      formData.append('lang', target);

      const res = await fetch('/api/admin/cms/upload-poster', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setCmsConfig((prev: any) => {
          const hv = prev.heroVideo || {};
          if (target === 'en') {
            return {
              ...prev,
              heroVideo: {
                ...hv,
                posterUrlEn: data.posterUrl,
                posterUrl: hv.posterUrl || data.posterUrl
              }
            };
          } else {
            return {
              ...prev,
              heroVideo: {
                ...hv,
                posterUrlAr: data.posterUrl,
                posterUrl: data.posterUrl
              }
            };
          }
        });
        showToast(isRtl ? `تم رفع صورة غلاف ${target === 'ar' ? 'العربية' : 'الإنجليزية'} بنجاح` : `Poster uploaded for ${target === 'ar' ? 'Arabic' : 'English'} successfully`, 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || (isRtl ? 'فشل رفع صورة الغلاف' : 'Poster upload failed'), 'error');
      }
    } catch (err: any) {
      showToast(err.message || (isRtl ? 'خطأ في الاتصال' : 'Connection error'), 'error');
    } finally {
      setIsUploadingPoster(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 pb-16" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs font-mono font-bold text-[var(--fg-accent)] mb-2">
            <LayoutTemplate size={14} />
            <span>{isRtl ? 'إدارة محتوى صفحة الهبوط السيادية (CMS)' : 'Landing Page CMS & Content Manager'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            {isRtl ? 'تحكم شامل بالعناوين، الفيديو، الصور، ومقاطع القوالب' : 'Complete Control over Hero Video, Media & Showcase'}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            {isRtl 
              ? 'تخصيص فيديو الواجهة الرئيسي مع دعم الرفع المباشر ورابط يوتيوب، وضبط صور ومقاطع المعاينات مع حفظ فوري.'
              : 'Customize the main showcase hero video with file upload & YouTube support, media cards, and instant persistence.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 min-h-[44px] rounded-shape-sm border border-[var(--border-main)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-secondary)] font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            title={isRtl ? 'استعادة الافتراضيات' : 'Reset to Defaults'}
          >
            <RotateCcw size={16} />
            <span>{isRtl ? 'إعادة الإعدادات الافتراضية' : 'Reset Defaults'}</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 min-h-[44px] rounded-shape-sm bg-[var(--fg-accent)] text-white font-bold text-xs flex items-center gap-2 shadow-md hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <Sparkles size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{isRtl ? 'حفظ ونشر التغييرات' : 'Save & Publish Changes'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'heroVideo', label: isRtl ? 'فيديو المعاينة الرئيسي (Showcase Video)' : 'Hero Showcase Video', icon: <Video size={15} /> },
          { id: 'hero', label: isRtl ? 'نصوص الهيدر (Hero Texts)' : 'Hero Texts', icon: <Globe size={15} /> },
          { id: 'images', label: isRtl ? 'استوديو الصور' : 'Image Studio', icon: <Image size={15} /> },
          { id: 'video', label: isRtl ? 'استوديو الفيديو' : 'Video Studio', icon: <Tv size={15} /> },
          { id: 'rinex', label: isRtl ? 'قوالب رينكس' : 'Rinex Canvas', icon: <LayoutGrid size={15} /> },
          { id: 'audio', label: isRtl ? 'استوديو الصوت' : 'Audio Studio', icon: <Volume2 size={15} /> },
          { id: 'apps', label: isRtl ? 'استوديو التطبيقات' : 'App Studio', icon: <Code2 size={15} /> },
          { id: 'viral', label: isRtl ? 'شبكة فيرال بوك' : 'ViralBook Hub', icon: <Users size={15} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { triggerHaptic('light'); setActiveTab(tab.id as any); }}
            className={`px-4 py-2.5 min-h-[44px] rounded-shape-sm text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[var(--fg-accent)] text-white shadow-xs'
                : 'bg-[var(--surface-card)] border border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] shadow-sm space-y-6">
        {activeTab === 'heroVideo' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--border-main)] pb-4">
              <div>
                <h2 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
                  <Video size={20} className="text-[var(--fg-accent)]" />
                  <span>{isRtl ? 'إدارة فيديو الواجهة الرئيسي والمقاطع متعددة اللغات' : 'Hero Showcase Video & Multilingual Manager'}</span>
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {isRtl 
                    ? 'خصص مقطع فيديو مستقل للغة العربية وآخَر للغة الإنجليزية يظهر تلقائياً عند تغيير لغة الزائر بصفحة الهبوط.' 
                    : 'Customize language-specific videos for Arabic and English displayed dynamically based on visitor language.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--text-secondary)]">
                  {isRtl ? 'تفعيل الفيديو بالواجهة:' : 'Enable Video:'}
                </span>
                <input
                  type="checkbox"
                  checked={cmsConfig.heroVideo.enabled}
                  onChange={(e) => setCmsConfig({
                    ...cmsConfig,
                    heroVideo: { ...cmsConfig.heroVideo, enabled: e.target.checked }
                  })}
                  className="w-4 h-4 rounded text-accent cursor-pointer"
                />
              </div>
            </div>

            {/* Language Selection Tabs for Video Configuration */}
            <div className="p-1.5 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center gap-2">
              <button
                type="button"
                onClick={() => { triggerHaptic('light'); setSelectedVideoLang('ar'); }}
                className={`flex-1 py-2 px-4 rounded-shape-xs text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectedVideoLang === 'ar'
                    ? 'bg-[var(--surface-card)] text-accent shadow-xs border border-[var(--border-default)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span className="text-sm">🇸🇦</span>
                <span>{isRtl ? 'فيديو اللغة العربية (Arabic Video)' : 'Arabic Video (🇸🇦)'}</span>
                {(cmsConfig.heroVideo.videoUrlAr || cmsConfig.heroVideo.videoUrl || cmsConfig.heroVideo.youtubeUrlAr || cmsConfig.heroVideo.youtubeUrl) && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>

              <button
                type="button"
                onClick={() => { triggerHaptic('light'); setSelectedVideoLang('en'); }}
                className={`flex-1 py-2 px-4 rounded-shape-xs text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectedVideoLang === 'en'
                    ? 'bg-[var(--surface-card)] text-accent shadow-xs border border-[var(--border-default)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span className="text-sm">🇬🇧</span>
                <span>{isRtl ? 'فيديو اللغة الإنجليزية (English Video)' : 'English Video (🇬🇧)'}</span>
                {(cmsConfig.heroVideo.videoUrlEn || cmsConfig.heroVideo.youtubeUrlEn) ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-500/50" />
                )}
              </button>
            </div>

            {/* Live Interactive Player Preview Container */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Eye size={14} className="text-accent" />
                  <span>
                    {isRtl 
                      ? `المعاينة الحية لشاشة العرض - [${selectedVideoLang === 'ar' ? 'فيديو العربية 🇸🇦' : 'فيديو الإنجليزية 🇬🇧'}]` 
                      : `Live Player Preview - [${selectedVideoLang === 'ar' ? 'Arabic Video 🇸🇦' : 'English Video 🇬🇧'}]`}
                  </span>
                </span>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">
                  16:9 Widescreen (1920×1080)
                </span>
              </div>

              <div className="relative aspect-[16/9] w-full max-w-3xl mx-auto rounded-shape-md overflow-hidden bg-[var(--surface-code,#010409)] border border-[var(--border-main)] shadow-xl flex flex-col">
                {/* Mock Window Controls Header */}
                <div className="h-9 bg-[var(--surface-subtle)] border-b border-[var(--border-main)] flex items-center justify-between px-3 shrink-0">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-shape-full bg-[#ff5f56]" />
                    <span className="w-2.5 h-2.5 rounded-shape-full bg-[#ffbd2e]" />
                    <span className="w-2.5 h-2.5 rounded-shape-full bg-[#27c93f]" />
                  </div>
                  <div className="px-2.5 py-0.5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-main)] text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-1.5">
                    <span>https://perplexta.ai/landing</span>
                    <span className="px-1.5 py-0.2 rounded bg-accent/20 text-accent font-bold uppercase">{selectedVideoLang}</span>
                  </div>
                  <div className="w-8" />
                </div>

                {/* Video / Embed Content */}
                <div className="flex-1 w-full h-full relative bg-black flex items-center justify-center overflow-hidden">
                  {(() => {
                    const activeSourceType = selectedVideoLang === 'en' 
                      ? (cmsConfig.heroVideo.sourceTypeEn || cmsConfig.heroVideo.sourceType || 'file')
                      : (cmsConfig.heroVideo.sourceTypeAr || cmsConfig.heroVideo.sourceType || 'file');

                    const activeVideoUrl = selectedVideoLang === 'en'
                      ? (cmsConfig.heroVideo.videoUrlEn || cmsConfig.heroVideo.videoUrlAr || cmsConfig.heroVideo.videoUrl || '')
                      : (cmsConfig.heroVideo.videoUrlAr || cmsConfig.heroVideo.videoUrl || '');

                    const activeYoutubeUrl = selectedVideoLang === 'en'
                      ? (cmsConfig.heroVideo.youtubeUrlEn || cmsConfig.heroVideo.youtubeUrlAr || cmsConfig.heroVideo.youtubeUrl || '')
                      : (cmsConfig.heroVideo.youtubeUrlAr || cmsConfig.heroVideo.youtubeUrl || '');

                    const activePosterUrl = selectedVideoLang === 'en'
                      ? (cmsConfig.heroVideo.posterUrlEn || cmsConfig.heroVideo.posterUrlAr || cmsConfig.heroVideo.posterUrl || '')
                      : (cmsConfig.heroVideo.posterUrlAr || cmsConfig.heroVideo.posterUrl || '');

                    if (activeSourceType === 'youtube' && activeYoutubeUrl) {
                      const ytId = extractYouTubeId(activeYoutubeUrl);
                      if (ytId) {
                        return (
                          <iframe
                            key={`${selectedVideoLang}-${activeYoutubeUrl}`}
                            src={getYouTubeEmbedUrl(activeYoutubeUrl, false) || ''}
                            title={`YouTube Showcase Video (${selectedVideoLang})`}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        );
                      } else {
                        return (
                          <div className="p-6 text-center text-xs text-amber-400 flex flex-col items-center gap-2">
                            <AlertCircle size={24} />
                            <span>{isRtl ? 'رابط يوتيوب غير صالح للغة المختارة، يرجى التحقق من الرابط' : 'Invalid YouTube link for selected language'}</span>
                          </div>
                        );
                      }
                    } else if (activeVideoUrl) {
                      return (
                        <video
                          key={`${selectedVideoLang}-${activeVideoUrl}`}
                          src={activeVideoUrl}
                          poster={activePosterUrl || undefined}
                          controls={cmsConfig.heroVideo.controls}
                          muted={cmsConfig.heroVideo.muted}
                          loop={cmsConfig.heroVideo.loop}
                          playsInline
                          className="w-full h-full object-contain"
                        />
                      );
                    } else {
                      return (
                        <div className="p-8 text-center text-[var(--text-muted)] flex flex-col items-center gap-3">
                          <div className="size-14 rounded-shape-full bg-[var(--surface-card)]/80 border border-[var(--border-main)] flex items-center justify-center text-accent">
                            <Film size={26} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-[var(--text-primary)]">
                              {isRtl 
                                ? `لم يتم رفع فيديو مخصص للغة ${selectedVideoLang === 'ar' ? 'العربية' : 'الإنجليزية'} بعد` 
                                : `No video uploaded for ${selectedVideoLang === 'ar' ? 'Arabic' : 'English'} yet`}
                            </p>
                            <p className="text-[11px] text-[var(--text-secondary)] max-w-sm">
                              {isRtl 
                                ? 'قم برفع ملف فيديو من جهازك أو أدخل رابط يوتيوب في الخيارات أدناه.'
                                : 'Upload a video file or enter a YouTube URL in the section below.'}
                            </p>
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            </div>

            {/* Source Type Selector for selected language */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-[var(--text-primary)] block">
                {isRtl 
                  ? `اختر مصدر الفيديو للغة ${selectedVideoLang === 'ar' ? 'العربية 🇸🇦' : 'الإنجليزية 🇬🇧'}:` 
                  : `Select Video Source for ${selectedVideoLang === 'ar' ? 'Arabic 🇸🇦' : 'English 🇬🇧'}:`}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const hv = cmsConfig.heroVideo || {};
                    if (selectedVideoLang === 'en') {
                      setCmsConfig({ ...cmsConfig, heroVideo: { ...hv, sourceTypeEn: 'file' } });
                    } else {
                      setCmsConfig({ ...cmsConfig, heroVideo: { ...hv, sourceTypeAr: 'file', sourceType: 'file' } });
                    }
                  }}
                  className={`p-3.5 rounded-shape-md border text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
                    (selectedVideoLang === 'en' ? (cmsConfig.heroVideo.sourceTypeEn || cmsConfig.heroVideo.sourceType || 'file') : (cmsConfig.heroVideo.sourceTypeAr || cmsConfig.heroVideo.sourceType || 'file')) === 'file'
                      ? 'bg-accent/10 border-accent text-accent shadow-xs'
                      : 'bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-card)]'
                  }`}
                >
                  <Upload size={18} />
                  <div className="text-start">
                    <div className="font-black">{isRtl ? 'رفع ملف فيديو من الجهاز (أو رابط مباشر)' : 'Upload Video File from Device'}</div>
                    <div className="text-[10px] font-normal opacity-80">{isRtl ? 'MP4, WebM, MOV حتى 100 ميجابايت' : 'MP4, WebM, MOV up to 100MB'}</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const hv = cmsConfig.heroVideo || {};
                    if (selectedVideoLang === 'en') {
                      setCmsConfig({ ...cmsConfig, heroVideo: { ...hv, sourceTypeEn: 'youtube' } });
                    } else {
                      setCmsConfig({ ...cmsConfig, heroVideo: { ...hv, sourceTypeAr: 'youtube', sourceType: 'youtube' } });
                    }
                  }}
                  className={`p-3.5 rounded-shape-md border text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
                    (selectedVideoLang === 'en' ? cmsConfig.heroVideo.sourceTypeEn : (cmsConfig.heroVideo.sourceTypeAr || cmsConfig.heroVideo.sourceType)) === 'youtube'
                      ? 'bg-accent/10 border-accent text-accent shadow-xs'
                      : 'bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-card)]'
                  }`}
                >
                  <Tv size={18} />
                  <div className="text-start">
                    <div className="font-black">{isRtl ? 'تضمين رابط يوتيوب (YouTube Video)' : 'Embed YouTube Video Link'}</div>
                    <div className="text-[10px] font-normal opacity-80">{isRtl ? 'رابط مباشر أو فيديو Shorts أو Embed' : 'Direct watch, shorts, or share link'}</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Source Specific Configuration */}
            {((selectedVideoLang === 'en' ? (cmsConfig.heroVideo.sourceTypeEn || cmsConfig.heroVideo.sourceType || 'file') : (cmsConfig.heroVideo.sourceTypeAr || cmsConfig.heroVideo.sourceType || 'file')) === 'file') ? (
              <div className="p-4 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-default)] space-y-4">
                <h3 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Upload size={15} className="text-accent" />
                  <span>
                    {isRtl 
                      ? `رفع فيديو للغة ${selectedVideoLang === 'ar' ? 'العربية 🇸🇦' : 'الإنجليزية 🇬🇧'} مباشرةً` 
                      : `Upload Video File for ${selectedVideoLang === 'ar' ? 'Arabic 🇸🇦' : 'English 🇬🇧'}`}
                  </span>
                </h3>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <label className="flex-1 w-full border-2 border-dashed border-[var(--border-default)] hover:border-accent rounded-shape-md p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-[var(--surface-card)]">
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/m4v,video/*"
                      onChange={(e) => handleVideoUpload(e, selectedVideoLang)}
                      disabled={isUploadingVideo}
                      className="hidden"
                    />
                    <FileVideo size={32} className={isUploadingVideo ? 'animate-bounce text-accent' : 'text-[var(--text-muted)]'} />
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      {isUploadingVideo 
                        ? (videoUploadProgress || (isRtl ? 'جاري الرفع والمعالجة...' : 'Uploading and processing...')) 
                        : (isRtl ? `اضغط لاختيار ملف فيديو للغة ${selectedVideoLang === 'ar' ? 'العربية' : 'الإنجليزية'} من جهازك` : `Click to browse video file for ${selectedVideoLang === 'ar' ? 'Arabic' : 'English'}`)}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      MP4 / WebM / MOV • Max 100MB • 16:9 (1920×1080)
                    </span>
                  </label>
                </div>

                {((selectedVideoLang === 'en' ? cmsConfig.heroVideo.videoUrlEn : (cmsConfig.heroVideo.videoUrlAr || cmsConfig.heroVideo.videoUrl)) as string) && (
                  <div className="p-3 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-emerald-500 font-bold truncate">
                      <CheckCircle2 size={16} className="shrink-0" />
                      <span className="font-mono truncate">
                        {selectedVideoLang === 'en' ? cmsConfig.heroVideo.videoUrlEn : (cmsConfig.heroVideo.videoUrlAr || cmsConfig.heroVideo.videoUrl)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const hv = cmsConfig.heroVideo || {};
                        if (selectedVideoLang === 'en') {
                          setCmsConfig({ ...cmsConfig, heroVideo: { ...hv, videoUrlEn: '' } });
                        } else {
                          setCmsConfig({ ...cmsConfig, heroVideo: { ...hv, videoUrlAr: '', videoUrl: '' } });
                        }
                      }}
                      className="p-1.5 rounded text-red-500 hover:bg-red-500/10 cursor-pointer shrink-0"
                      title={isRtl ? 'إزالة الفيديو' : 'Remove Video'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)]">
                    {isRtl ? `رابط مباشر لفيديو اللغة ${selectedVideoLang === 'ar' ? 'العربية' : 'الإنجليزية'}:` : `Direct video URL for ${selectedVideoLang === 'ar' ? 'Arabic' : 'English'}:`}
                  </label>
                  <input
                    type="text"
                    value={selectedVideoLang === 'en' ? (cmsConfig.heroVideo.videoUrlEn || '') : (cmsConfig.heroVideo.videoUrlAr || cmsConfig.heroVideo.videoUrl || '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      const hv = cmsConfig.heroVideo || {};
                      if (selectedVideoLang === 'en') {
                        setCmsConfig({ ...cmsConfig, heroVideo: { ...hv, videoUrlEn: val } });
                      } else {
                        setCmsConfig({ ...cmsConfig, heroVideo: { ...hv, videoUrlAr: val, videoUrl: val } });
                      }
                    }}
                    placeholder="https://domain.com/videos/showcase.mp4"
                    className="w-full px-3 py-2 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-default)] space-y-4">
                <h3 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Tv size={15} className="text-accent" />
                  <span>
                    {isRtl 
                      ? `رابط فيديو يوتيوب للغة ${selectedVideoLang === 'ar' ? 'العربية 🇸🇦' : 'الإنجليزية 🇬🇧'}` 
                      : `YouTube Video Link for ${selectedVideoLang === 'ar' ? 'Arabic 🇸🇦' : 'English 🇬🇧'}`}
                  </span>
                </h3>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)]">
                    {isRtl ? 'رابط مقطع يوتيوب (Watch, Share, أو Shorts):' : 'YouTube Link (Watch, Share, or Shorts):'}
                  </label>
                  <input
                    type="text"
                    value={selectedVideoLang === 'en' ? (cmsConfig.heroVideo.youtubeUrlEn || '') : (cmsConfig.heroVideo.youtubeUrlAr || cmsConfig.heroVideo.youtubeUrl || '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      const hv = cmsConfig.heroVideo || {};
                      if (selectedVideoLang === 'en') {
                        setCmsConfig({ ...cmsConfig, heroVideo: { ...hv, youtubeUrlEn: val } });
                      } else {
                        setCmsConfig({ ...cmsConfig, heroVideo: { ...hv, youtubeUrlAr: val, youtubeUrl: val } });
                      }
                    }}
                    placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ أو https://youtu.be/..."
                    className="w-full px-3 py-2 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-accent"
                  />

                  {((selectedVideoLang === 'en' ? cmsConfig.heroVideo.youtubeUrlEn : (cmsConfig.heroVideo.youtubeUrlAr || cmsConfig.heroVideo.youtubeUrl)) as string) && (
                    <div className="flex items-center gap-2 text-xs">
                      {extractYouTubeId(selectedVideoLang === 'en' ? cmsConfig.heroVideo.youtubeUrlEn : (cmsConfig.heroVideo.youtubeUrlAr || cmsConfig.heroVideo.youtubeUrl)) ? (
                        <div className="flex items-center gap-1.5 text-emerald-500 font-bold">
                          <CheckCircle2 size={14} />
                          <span>
                            {isRtl 
                              ? `تم التعرف على الفيديو بنجاح (المعرف: ${extractYouTubeId(selectedVideoLang === 'en' ? cmsConfig.heroVideo.youtubeUrlEn : (cmsConfig.heroVideo.youtubeUrlAr || cmsConfig.heroVideo.youtubeUrl))})`
                              : `Valid YouTube ID: ${extractYouTubeId(selectedVideoLang === 'en' ? cmsConfig.heroVideo.youtubeUrlEn : (cmsConfig.heroVideo.youtubeUrlAr || cmsConfig.heroVideo.youtubeUrl))}`}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-amber-500">
                          <AlertCircle size={14} />
                          <span>{isRtl ? 'الرجاء إدخال رابط يوتيوب صحيح' : 'Please enter a valid YouTube URL'}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Poster / Cover Image for Selected Language */}
            <div className="p-4 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-default)] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Image size={15} className="text-accent" />
                  <span>
                    {isRtl 
                      ? `صورة الغلاف / المعاينة المصغرة للغة ${selectedVideoLang === 'ar' ? 'العربية 🇸🇦' : 'الإنجليزية 🇬🇧'}:` 
                      : `Video Cover Poster for ${selectedVideoLang === 'ar' ? 'Arabic 🇸🇦' : 'English 🇬🇧'}:`}
                  </span>
                </label>
                <label className="px-3 py-1.5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] hover:border-accent text-xs font-bold cursor-pointer flex items-center gap-1.5">
                  <Upload size={12} />
                  <span>{isUploadingPoster ? (isRtl ? 'جاري الرفع...' : 'Uploading...') : (isRtl ? 'رفع صورة غلاف' : 'Upload Poster')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePosterUpload(e, selectedVideoLang)}
                    disabled={isUploadingPoster}
                    className="hidden"
                  />
                </label>
              </div>

              <input
                type="text"
                value={selectedVideoLang === 'en' ? (cmsConfig.heroVideo.posterUrlEn || '') : (cmsConfig.heroVideo.posterUrlAr || cmsConfig.heroVideo.posterUrl || '')}
                onChange={(e) => {
                  const val = e.target.value;
                  const hv = cmsConfig.heroVideo || {};
                  if (selectedVideoLang === 'en') {
                    setCmsConfig({ ...cmsConfig, heroVideo: { ...hv, posterUrlEn: val } });
                  } else {
                    setCmsConfig({ ...cmsConfig, heroVideo: { ...hv, posterUrlAr: val, posterUrl: val } });
                  }
                }}
                placeholder="https://images.unsplash.com/... أو /uploads/videos/posters/..."
                className="w-full px-3 py-2 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-accent"
              />
            </div>

            {/* Titles & Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)]">
                  {isRtl ? 'عنوان الفيديو بالعربية (يظهر في نافذة المعاينة):' : 'Video Title (Arabic):'}
                </label>
                <input
                  type="text"
                  value={cmsConfig.heroVideo.titleAr}
                  onChange={(e) => setCmsConfig({
                    ...cmsConfig,
                    heroVideo: { ...cmsConfig.heroVideo, titleAr: e.target.value }
                  })}
                  className="w-full px-3 py-2 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)]">
                  {isRtl ? 'عنوان الفيديو بالإنجليزية:' : 'Video Title (English):'}
                </label>
                <input
                  type="text"
                  value={cmsConfig.heroVideo.titleEn}
                  onChange={(e) => setCmsConfig({
                    ...cmsConfig,
                    heroVideo: { ...cmsConfig.heroVideo, titleEn: e.target.value }
                  })}
                  className="w-full px-3 py-2 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-[var(--text-secondary)]">
                  {isRtl ? 'وصف الفيديو بالعربية:' : 'Video Description (Arabic):'}
                </label>
                <textarea
                  rows={2}
                  value={cmsConfig.heroVideo.descriptionAr}
                  onChange={(e) => setCmsConfig({
                    ...cmsConfig,
                    heroVideo: { ...cmsConfig.heroVideo, descriptionAr: e.target.value }
                  })}
                  className="w-full px-3 py-2 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Playback Toggles */}
            <div className="p-4 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-default)]">
              <label className="text-xs font-bold text-[var(--text-primary)] block mb-3">
                {isRtl ? 'خيارات وسلوك التشغيل الافتراضي:' : 'Default Playback Options:'}
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={cmsConfig.heroVideo.autoplay}
                    onChange={(e) => setCmsConfig({
                      ...cmsConfig,
                      heroVideo: { ...cmsConfig.heroVideo, autoplay: e.target.checked }
                    })}
                    className="w-4 h-4 rounded text-accent cursor-pointer"
                  />
                  <span>{isRtl ? 'تشغيل تلقائي' : 'Autoplay'}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={cmsConfig.heroVideo.muted}
                    onChange={(e) => setCmsConfig({
                      ...cmsConfig,
                      heroVideo: { ...cmsConfig.heroVideo, muted: e.target.checked }
                    })}
                    className="w-4 h-4 rounded text-accent cursor-pointer"
                  />
                  <span>{isRtl ? 'كتم الصوت الافتراضي' : 'Muted'}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={cmsConfig.heroVideo.loop}
                    onChange={(e) => setCmsConfig({
                      ...cmsConfig,
                      heroVideo: { ...cmsConfig.heroVideo, loop: e.target.checked }
                    })}
                    className="w-4 h-4 rounded text-accent cursor-pointer"
                  />
                  <span>{isRtl ? 'تكرار مستمر (Loop)' : 'Looping'}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={cmsConfig.heroVideo.controls}
                    onChange={(e) => setCmsConfig({
                      ...cmsConfig,
                      heroVideo: { ...cmsConfig.heroVideo, controls: e.target.checked }
                    })}
                    className="w-4 h-4 rounded text-accent cursor-pointer"
                  />
                  <span>{isRtl ? 'أزرار التحكم (Controls)' : 'Show Controls'}</span>
                </label>
              </div>
            </div>

            {/* PROFESSIONAL DIMENSIONS & TECHNICAL SPECS GUIDE CARD */}
            <div className="p-5 rounded-shape-md bg-gradient-to-br from-accent/5 via-[var(--surface-card)] to-accent/10 border border-accent/30 space-y-4">
              <div className="flex items-center gap-2 text-accent font-black text-sm">
                <ShieldCheck size={20} />
                <span>
                  {isRtl 
                    ? 'دليل الأبعاد الهندسية والمواصفات الاحترافية لتجهيز ورفع الفيديو' 
                    : 'Professional Video Dimensions & Technical Export Guide'}
                </span>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {isRtl 
                  ? 'لضمان ظهور الفيديو بأعلى جودة واحترافية بدون تشويه أو شريط أسود جانبي، وبأسرع تحميل فوري للزوار دون تقطيع، نوصي بتجهيز مقطع الفيديو وفق المعايير التالية:'
                  : 'To ensure your showcase video displays with maximum fidelity, zero letterboxing, and instantaneous loading, please prepare your video with these exact standards:'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-accent">{isRtl ? 'الأبعاد الموصى بها (1080p)' : 'Recommended (1080p)'}</span>
                  <div className="text-base font-black font-mono text-[var(--text-primary)]">1920 × 1080</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{isRtl ? 'نسبة الأبعاد الذهبية 16:9' : '16:9 Widescreen Ratio'}</div>
                </div>

                <div className="p-3 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">{isRtl ? 'دقة فائقة (2K / 4K)' : 'Ultra HD (2K / 4K)'}</span>
                  <div className="text-base font-black font-mono text-[var(--text-primary)]">2560 × 1440</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{isRtl ? 'أو 3840×2160 لشاشات Retina' : 'Or 3840×2160 for 4K'}</div>
                </div>

                <div className="p-3 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-500">{isRtl ? 'الترميز ومعدل الإطارات' : 'Codec & Frame Rate'}</span>
                  <div className="text-base font-black font-mono text-[var(--text-primary)]">H.264 / 30fps</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{isRtl ? 'توافق 100% مع كافة الأجهزة' : 'Universal HTML5 Standard'}</div>
                </div>

                <div className="p-3 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-amber-500">{isRtl ? 'معدل البت والحجم' : 'Bitrate & Max Size'}</span>
                  <div className="text-base font-black font-mono text-[var(--text-primary)]">4 - 8 Mbps</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{isRtl ? 'أقصى حجم للملف: 100MB' : 'Max File Size: 100MB'}</div>
                </div>
              </div>

              <div className="p-3 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[11px] text-[var(--text-secondary)] space-y-1">
                <div className="font-bold text-[var(--text-primary)]">
                  {isRtl ? '💡 نصيحة التصدير السريعة لمصممي الفيديو:' : '💡 Quick Export Pro-Tip for Video Editors:'}
                </div>
                <p>
                  {isRtl 
                    ? 'عند التصدير من برامج مثل Adobe Premiere أو DaVinci Resolve أو Final Cut: اختر التصدير بصيغة MP4 وبترميز H.264 بمعدل بت VBR 2-Pass (Target 6 Mbps, Max 10 Mbps) وصوت AAC Stereo 256kbps للحصول على توازن استثنائي بين جودة الكريستال وحجم التحميل الخفيف.'
                    : 'When exporting from Premiere or DaVinci: select MP4 (H.264), VBR 2-Pass Target 6 Mbps, Audio AAC Stereo 256kbps for crystal-clear clarity and instant streaming without buffering.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hero' && (
          <div className="space-y-6">
            <h2 className="text-lg font-black text-[var(--text-primary)] border-b border-[var(--border-main)] pb-3 flex items-center gap-2">
              <Globe size={18} className="text-[var(--fg-accent)]" />
              <span>{isRtl ? 'تخصيص الهيدر والعنوان الرئيسي (Hero Section)' : 'Customize Hero Header & Titles'}</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)]">
                  {isRtl ? 'الشارة العلوية (بالعربية)' : 'Top Badge (Arabic)'}
                </label>
                <input
                  type="text"
                  value={cmsConfig.hero.badgeAr}
                  onChange={(e) => setCmsConfig({ ...cmsConfig, hero: { ...cmsConfig.hero, badgeAr: e.target.value } })}
                  className="w-full px-3.5 py-2.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--fg-accent)]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)]">
                  {isRtl ? 'الشارة العلوية (بالإنجليزية)' : 'Top Badge (English)'}
                </label>
                <input
                  type="text"
                  value={cmsConfig.hero.badgeEn}
                  onChange={(e) => setCmsConfig({ ...cmsConfig, hero: { ...cmsConfig.hero, badgeEn: e.target.value } })}
                  className="w-full px-3.5 py-2.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--fg-accent)]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)]">
                  {isRtl ? 'العنوان الرئيسي (بالعربية)' : 'Main Title (Arabic)'}
                </label>
                <textarea
                  rows={2}
                  value={cmsConfig.hero.titleAr}
                  onChange={(e) => setCmsConfig({ ...cmsConfig, hero: { ...cmsConfig.hero, titleAr: e.target.value } })}
                  className="w-full px-3.5 py-2.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--fg-accent)]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)]">
                  {isRtl ? 'العنوان الرئيسي (بالإنجليزية)' : 'Main Title (English)'}
                </label>
                <textarea
                  rows={2}
                  value={cmsConfig.hero.titleEn}
                  onChange={(e) => setCmsConfig({ ...cmsConfig, hero: { ...cmsConfig.hero, titleEn: e.target.value } })}
                  className="w-full px-3.5 py-2.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--fg-accent)]"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-[var(--text-secondary)]">
                  {isRtl ? 'الوصف التوضيحي (بالعربية)' : 'Subtitle Description (Arabic)'}
                </label>
                <textarea
                  rows={3}
                  value={cmsConfig.hero.subtitleAr}
                  onChange={(e) => setCmsConfig({ ...cmsConfig, hero: { ...cmsConfig.hero, subtitleAr: e.target.value } })}
                  className="w-full px-3.5 py-2.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--fg-accent)]"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'images' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
              <h2 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
                <Image size={18} className="text-[var(--fg-accent)]" />
                <span>{isRtl ? 'إدارة قوالب وعروض استوديو الصور' : 'Image Studio Showcase Marquee'}</span>
              </h2>
              <button
                onClick={() => {
                  setCmsConfig({
                    ...cmsConfig,
                    imageStudio: [...cmsConfig.imageStudio, { titleAr: 'صورة جديدة', titleEn: 'New Image', prompt: 'Cinematic AI prompt here', tag: 'Flux Pro', img: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80' }]
                  });
                }}
                className="px-3.5 py-2 rounded-shape-xs bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-primary)] text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-[var(--border-default)]"
              >
                <Plus size={14} />
                <span>{isRtl ? 'إضافة صورة جديدة' : 'Add Item'}</span>
              </button>
            </div>

            <div className="space-y-4">
              {cmsConfig.imageStudio.map((item: any, idx: number) => (
                <div key={idx} className="p-4 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-default)] grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-2">
                    <img src={item.img} alt={item.titleAr} className="w-full aspect-[16/10] rounded-shape-xs object-cover border border-[var(--border-default)]" />
                  </div>
                  <div className="md:col-span-9 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={item.titleAr}
                        onChange={(e) => {
                          const updated = [...cmsConfig.imageStudio];
                          updated[idx].titleAr = e.target.value;
                          setCmsConfig({ ...cmsConfig, imageStudio: updated });
                        }}
                        placeholder="العنوان بالعربية"
                        className="px-3 py-1.5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-xs text-[var(--text-primary)]"
                      />
                      <input
                        type="text"
                        value={item.tag}
                        onChange={(e) => {
                          const updated = [...cmsConfig.imageStudio];
                          updated[idx].tag = e.target.value;
                          setCmsConfig({ ...cmsConfig, imageStudio: updated });
                        }}
                        placeholder="الشارة التقنية"
                        className="px-3 py-1.5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-xs text-[var(--text-primary)]"
                      />
                    </div>
                    <input
                      type="text"
                      value={item.img}
                      onChange={(e) => {
                        const updated = [...cmsConfig.imageStudio];
                        updated[idx].img = e.target.value;
                        setCmsConfig({ ...cmsConfig, imageStudio: updated });
                      }}
                      placeholder="رابط الصورة المباشر (Image URL)"
                      className="w-full px-3 py-1.5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] font-mono"
                    />
                  </div>
                  <div className="md:col-span-1 flex justify-center">
                    <button
                      onClick={() => {
                        const updated = cmsConfig.imageStudio.filter((_: any, i: number) => i !== idx);
                        setCmsConfig({ ...cmsConfig, imageStudio: updated });
                      }}
                      className="p-2 rounded-shape-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'video' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
              <h2 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
                <Tv size={18} className="text-[var(--fg-accent)]" />
                <span>{isRtl ? 'إدارة عروض استوديو الفيديو' : 'Video Studio Showcase Manager'}</span>
              </h2>
              <button
                onClick={() => {
                  setCmsConfig({
                    ...cmsConfig,
                    videoStudio: [...cmsConfig.videoStudio, { titleAr: 'فيديو جديد', titleEn: 'New Video', prompt: 'Cinematic prompt', duration: '00:10s', img: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80' }]
                  });
                }}
                className="px-3.5 py-2 rounded-shape-xs bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-primary)] text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-[var(--border-default)]"
              >
                <Plus size={14} />
                <span>{isRtl ? 'إضافة فيديو جديد' : 'Add Item'}</span>
              </button>
            </div>

            <div className="space-y-4">
              {cmsConfig.videoStudio.map((item: any, idx: number) => (
                <div key={idx} className="p-4 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-default)] grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-2">
                    <img src={item.img} alt={item.titleAr} className="w-full aspect-[16/10] rounded-shape-xs object-cover border border-[var(--border-default)]" />
                  </div>
                  <div className="md:col-span-9 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={item.titleAr}
                        onChange={(e) => {
                          const updated = [...cmsConfig.videoStudio];
                          updated[idx].titleAr = e.target.value;
                          setCmsConfig({ ...cmsConfig, videoStudio: updated });
                        }}
                        placeholder="العنوان بالعربية"
                        className="px-3 py-1.5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-xs text-[var(--text-primary)]"
                      />
                      <input
                        type="text"
                        value={item.duration}
                        onChange={(e) => {
                          const updated = [...cmsConfig.videoStudio];
                          updated[idx].duration = e.target.value;
                          setCmsConfig({ ...cmsConfig, videoStudio: updated });
                        }}
                        placeholder="المدة (مثل 00:15s)"
                        className="px-3 py-1.5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-xs text-[var(--text-primary)]"
                      />
                    </div>
                    <input
                      type="text"
                      value={item.img}
                      onChange={(e) => {
                        const updated = [...cmsConfig.videoStudio];
                        updated[idx].img = e.target.value;
                        setCmsConfig({ ...cmsConfig, videoStudio: updated });
                      }}
                      placeholder="رابط الصورة المباشر (Image URL)"
                      className="w-full px-3 py-1.5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] font-mono"
                    />
                  </div>
                  <div className="md:col-span-1 flex justify-center">
                    <button
                      onClick={() => {
                        const updated = cmsConfig.videoStudio.filter((_: any, i: number) => i !== idx);
                        setCmsConfig({ ...cmsConfig, videoStudio: updated });
                      }}
                      className="p-2 rounded-shape-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'rinex' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
              <h2 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
                <LayoutGrid size={18} className="text-[var(--fg-accent)]" />
                <span>{isRtl ? 'إدارة قوالب رينكس الحركية' : 'Rinex Canvas Showcase Manager'}</span>
              </h2>
              <button
                onClick={() => {
                  setCmsConfig({
                    ...cmsConfig,
                    rinexStudio: [...cmsConfig.rinexStudio, { titleAr: 'قالب جديد', titleEn: 'New Template', category: 'Motion Identity', layers: '10 Layers', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80' }]
                  });
                }}
                className="px-3.5 py-2 rounded-shape-xs bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-primary)] text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-[var(--border-default)]"
              >
                <Plus size={14} />
                <span>{isRtl ? 'إضافة قالب جديد' : 'Add Item'}</span>
              </button>
            </div>

            <div className="space-y-4">
              {cmsConfig.rinexStudio.map((item: any, idx: number) => (
                <div key={idx} className="p-4 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-default)] grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-2">
                    <img src={item.img} alt={item.titleAr} className="w-full aspect-[16/10] rounded-shape-xs object-cover border border-[var(--border-default)]" />
                  </div>
                  <div className="md:col-span-9 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={item.titleAr}
                        onChange={(e) => {
                          const updated = [...cmsConfig.rinexStudio];
                          updated[idx].titleAr = e.target.value;
                          setCmsConfig({ ...cmsConfig, rinexStudio: updated });
                        }}
                        placeholder="العنوان بالعربية"
                        className="px-3 py-1.5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-xs text-[var(--text-primary)]"
                      />
                      <input
                        type="text"
                        value={item.category}
                        onChange={(e) => {
                          const updated = [...cmsConfig.rinexStudio];
                          updated[idx].category = e.target.value;
                          setCmsConfig({ ...cmsConfig, rinexStudio: updated });
                        }}
                        placeholder="التصنيف"
                        className="px-3 py-1.5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-xs text-[var(--text-primary)]"
                      />
                    </div>
                    <input
                      type="text"
                      value={item.img}
                      onChange={(e) => {
                        const updated = [...cmsConfig.rinexStudio];
                        updated[idx].img = e.target.value;
                        setCmsConfig({ ...cmsConfig, rinexStudio: updated });
                      }}
                      placeholder="رابط الصورة (Image URL)"
                      className="w-full px-3 py-1.5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] font-mono"
                    />
                  </div>
                  <div className="md:col-span-1 flex justify-center">
                    <button
                      onClick={() => {
                        const updated = cmsConfig.rinexStudio.filter((_: any, i: number) => i !== idx);
                        setCmsConfig({ ...cmsConfig, rinexStudio: updated });
                      }}
                      className="p-2 rounded-shape-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
              <h2 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
                <Volume2 size={18} className="text-[var(--fg-accent)]" />
                <span>{isRtl ? 'إدارة استوديو الصوت والموسيقى' : 'Audio Studio Showcase Manager'}</span>
              </h2>
              <button
                onClick={() => {
                  setCmsConfig({
                    ...cmsConfig,
                    audioStudio: [...cmsConfig.audioStudio, { titleAr: 'مقطوعة جديدة', titleEn: 'New Track', genre: 'Tarab', duration: '03:00s', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80' }]
                  });
                }}
                className="px-3.5 py-2 rounded-shape-xs bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-primary)] text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-[var(--border-default)]"
              >
                <Plus size={14} />
                <span>{isRtl ? 'إضافة مقطوعة جديدة' : 'Add Item'}</span>
              </button>
            </div>

            <div className="space-y-4">
              {cmsConfig.audioStudio.map((item: any, idx: number) => (
                <div key={idx} className="p-4 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-default)] grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-2">
                    <img src={item.img} alt={item.titleAr} className="w-full aspect-[16/10] rounded-shape-xs object-cover border border-[var(--border-default)]" />
                  </div>
                  <div className="md:col-span-9 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={item.titleAr}
                        onChange={(e) => {
                          const updated = [...cmsConfig.audioStudio];
                          updated[idx].titleAr = e.target.value;
                          setCmsConfig({ ...cmsConfig, audioStudio: updated });
                        }}
                        placeholder="العنوان بالعربية"
                        className="px-3 py-1.5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-xs text-[var(--text-primary)]"
                      />
                      <input
                        type="text"
                        value={item.genre}
                        onChange={(e) => {
                          const updated = [...cmsConfig.audioStudio];
                          updated[idx].genre = e.target.value;
                          setCmsConfig({ ...cmsConfig, audioStudio: updated });
                        }}
                        placeholder="النوع الموسيقي"
                        className="px-3 py-1.5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-xs text-[var(--text-primary)]"
                      />
                    </div>
                    <input
                      type="text"
                      value={item.img}
                      onChange={(e) => {
                        const updated = [...cmsConfig.audioStudio];
                        updated[idx].img = e.target.value;
                        setCmsConfig({ ...cmsConfig, audioStudio: updated });
                      }}
                      placeholder="رابط الصورة (Image URL)"
                      className="w-full px-3 py-1.5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] font-mono"
                    />
                  </div>
                  <div className="md:col-span-1 flex justify-center">
                    <button
                      onClick={() => {
                        const updated = cmsConfig.audioStudio.filter((_: any, i: number) => i !== idx);
                        setCmsConfig({ ...cmsConfig, audioStudio: updated });
                      }}
                      className="p-2 rounded-shape-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'apps' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
              <h2 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
                <Code2 size={18} className="text-[var(--fg-accent)]" />
                <span>{isRtl ? 'إدارة استوديو التطبيقات والمشاريع' : 'App Studio Showcase Manager'}</span>
              </h2>
              <button
                onClick={() => {
                  setCmsConfig({
                    ...cmsConfig,
                    appStudio: [...cmsConfig.appStudio, { titleAr: 'تطبيق جديد', titleEn: 'New App', desc: 'Full-stack application', tag: 'React', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80' }]
                  });
                }}
                className="px-3.5 py-2 rounded-shape-xs bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-primary)] text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-[var(--border-default)]"
              >
                <Plus size={14} />
                <span>{isRtl ? 'إضافة تطبيق جديد' : 'Add Item'}</span>
              </button>
            </div>

            <div className="space-y-4">
              {cmsConfig.appStudio.map((item: any, idx: number) => (
                <div key={idx} className="p-4 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-default)] grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-2">
                    <img src={item.img} alt={item.titleAr} className="w-full aspect-[16/10] rounded-shape-xs object-cover border border-[var(--border-default)]" />
                  </div>
                  <div className="md:col-span-9 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={item.titleAr}
                        onChange={(e) => {
                          const updated = [...cmsConfig.appStudio];
                          updated[idx].titleAr = e.target.value;
                          setCmsConfig({ ...cmsConfig, appStudio: updated });
                        }}
                        placeholder="العنوان بالعربية"
                        className="px-3 py-1.5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-xs text-[var(--text-primary)]"
                      />
                      <input
                        type="text"
                        value={item.tag}
                        onChange={(e) => {
                          const updated = [...cmsConfig.appStudio];
                          updated[idx].tag = e.target.value;
                          setCmsConfig({ ...cmsConfig, appStudio: updated });
                        }}
                        placeholder="الشارة التقنية"
                        className="px-3 py-1.5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-xs text-[var(--text-primary)]"
                      />
                    </div>
                    <input
                      type="text"
                      value={item.img}
                      onChange={(e) => {
                        const updated = [...cmsConfig.appStudio];
                        updated[idx].img = e.target.value;
                        setCmsConfig({ ...cmsConfig, appStudio: updated });
                      }}
                      placeholder="رابط الصورة (Image URL)"
                      className="w-full px-3 py-1.5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] font-mono"
                    />
                  </div>
                  <div className="md:col-span-1 flex justify-center">
                    <button
                      onClick={() => {
                        const updated = cmsConfig.appStudio.filter((_: any, i: number) => i !== idx);
                        setCmsConfig({ ...cmsConfig, appStudio: updated });
                      }}
                      className="p-2 rounded-shape-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'viral' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
              <h2 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
                <Users size={18} className="text-[var(--fg-accent)]" />
                <span>{isRtl ? 'إدارة محتوى شبكة فيرال بوك' : 'ViralBook Showcase Manager'}</span>
              </h2>
              <button
                onClick={() => {
                  setCmsConfig({
                    ...cmsConfig,
                    viralBook: [...cmsConfig.viralBook, { titleAr: 'منشور ترويجي جديد', titleEn: 'New Viral Post', category: 'Viral Marketing', royalty: '$0.50 / use', img: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80' }]
                  });
                }}
                className="px-3.5 py-2 rounded-shape-xs bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-primary)] text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-[var(--border-default)]"
              >
                <Plus size={14} />
                <span>{isRtl ? 'إضافة منشور جديد' : 'Add Item'}</span>
              </button>
            </div>

            <div className="space-y-4">
              {cmsConfig.viralBook.map((item: any, idx: number) => (
                <div key={idx} className="p-4 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-default)] grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-2">
                    <img src={item.img} alt={item.titleAr} className="w-full aspect-[16/10] rounded-shape-xs object-cover border border-[var(--border-default)]" />
                  </div>
                  <div className="md:col-span-9 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={item.titleAr}
                        onChange={(e) => {
                          const updated = [...cmsConfig.viralBook];
                          updated[idx].titleAr = e.target.value;
                          setCmsConfig({ ...cmsConfig, viralBook: updated });
                        }}
                        placeholder="العنوان بالعربية"
                        className="px-3 py-1.5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-xs text-[var(--text-primary)]"
                      />
                      <input
                        type="text"
                        value={item.royalty}
                        onChange={(e) => {
                          const updated = [...cmsConfig.viralBook];
                          updated[idx].royalty = e.target.value;
                          setCmsConfig({ ...cmsConfig, viralBook: updated });
                        }}
                        placeholder="نسبة الأرباح (Royalty)"
                        className="px-3 py-1.5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-xs text-[var(--text-primary)]"
                      />
                    </div>
                    <input
                      type="text"
                      value={item.img}
                      onChange={(e) => {
                        const updated = [...cmsConfig.viralBook];
                        updated[idx].img = e.target.value;
                        setCmsConfig({ ...cmsConfig, viralBook: updated });
                      }}
                      placeholder="رابط الصورة (Image URL)"
                      className="w-full px-3 py-1.5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] font-mono"
                    />
                  </div>
                  <div className="md:col-span-1 flex justify-center">
                    <button
                      onClick={() => {
                        const updated = cmsConfig.viralBook.filter((_: any, i: number) => i !== idx);
                        setCmsConfig({ ...cmsConfig, viralBook: updated });
                      }}
                      className="p-2 rounded-shape-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
