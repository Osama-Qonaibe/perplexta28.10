import React, { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, Layout, Type, Image as ImageIcon } from 'lucide-react';
import { checkIndexHtmlCssVariables, IndexHtmlCssDiagnostics } from '../../../utils/rinexTemplateDiagnostics';

export interface TemplateCompositionLoadingStateProps {
  isAr?: boolean;
  templateTitle?: string;
  templateDimensions?: { width: number; height: number };
  aspectRatio?: string;
  currentStep?: 'mounting' | 'fonts' | 'assets' | 'composing' | 'rendering';
  onForceLaunch?: () => void;
  timeoutMs?: number;
}

export const TemplateCompositionLoadingState: React.FC<TemplateCompositionLoadingStateProps> = ({
  isAr = true,
  templateTitle,
  templateDimensions = { width: 1080, height: 1080 },
  aspectRatio = '1:1',
  currentStep = 'mounting',
  onForceLaunch,
  timeoutMs = 2800
}) => {
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [isTimedOut, setIsTimedOut] = useState<boolean>(false);
  const [cssAudit, setCssAudit] = useState<IndexHtmlCssDiagnostics | null>(null);

  // Track elapsed composition time and trigger fallback state if taking too long
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = now - startTime;
      setElapsedMs(diff);
      if (diff >= timeoutMs && !isTimedOut) {
        setIsTimedOut(true);
      }
    }, 150);

    // Audit CSS variables from index.html at this exact lifecycle moment
    try {
      const audit = checkIndexHtmlCssVariables();
      setCssAudit(audit);
    } catch (e) {
      console.warn('CSS variables audit during template loading warning:', e);
    }

    return () => clearInterval(interval);
  }, [timeoutMs, isTimedOut]);

  // Determine stage progress messages
  const steps = [
    {
      id: 'mounting',
      labelAr: 'التحقق من تثبيت مساحة العمل (DOM Canvas)',
      labelEn: 'Verifying Canvas DOM Elements Mounting',
      icon: Layout,
      done: elapsedMs > 400 || currentStep !== 'mounting'
    },
    {
      id: 'fonts',
      labelAr: 'تهيئة الخطوط ومقاييس النصوص (Typography Engine)',
      labelEn: 'Synchronizing Typography & Arabic Font Metrics',
      icon: Type,
      done: elapsedMs > 900
    },
    {
      id: 'assets',
      labelAr: 'تجهيز الوسائط والأصول البصرية (Asset Preloader)',
      labelEn: 'Preloading Template Media & Image Assets',
      icon: ImageIcon,
      done: elapsedMs > 1800
    },
    {
      id: 'composing',
      labelAr: 'توليف وتركيب عناصر القالب (Composition Engine)',
      labelEn: 'Finalizing Canvas Composition & Layout Layers',
      icon: Sparkles,
      done: elapsedMs > 2400
    }
  ];

  // Calculate proportional skeleton preview box
  const targetW = templateDimensions.width || 1080;
  const targetH = templateDimensions.height || 1080;
  const ratioCalc = targetW / targetH;
  const previewMaxH = 240;
  const previewH = previewMaxH;
  const previewW = Math.round(previewMaxH * ratioCalc);

  return (
    <div 
      className="absolute inset-0 z-40 bg-[var(--surface-page)]/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-200"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-lg bg-[var(--surface-card)] border border-[var(--border-main)] rounded-shape-lg p-6 sm:p-7 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        
        {/* Subtle Shimmering Ambient Glow - Never dark or black */}
        <div className="absolute -top-24 -start-24 w-48 h-48 bg-[var(--fg-accent,#38bdf8)]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -end-24 w-48 h-48 bg-[var(--accent,#38bdf8)]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Badge */}
        <div className="flex items-center gap-2 mb-4 px-3 py-1 rounded-shape-full bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs font-bold text-[var(--text-secondary)]">
          <RefreshCw size={12} className="animate-spin text-[var(--fg-accent,#38bdf8)]" />
          <span>
            {isTimedOut 
              ? (isAr ? 'جاري استكمال التوليف الاحتياطي' : 'Fallback Composition Active')
              : (isAr ? 'جاري معالجة وتوليف القالب' : 'Composing Visual Template')}
          </span>
          {templateDimensions.width > 0 && (
            <span className="font-mono text-[10px] text-[var(--text-muted)] border-s border-[var(--border-default)] ps-2">
              {templateDimensions.width} × {templateDimensions.height} px
            </span>
          )}
        </div>

        {/* Template Title */}
        <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)] mb-1 truncate max-w-full">
          {templateTitle || (isAr ? 'قالب رينكس الذكي' : 'Rinex Studio Template')}
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-5 max-w-sm">
          {isTimedOut
            ? (isAr ? 'استغرق تحميل الأصول الخارجية وقتاً إضافياً، تم تفعيل وضع التحرير المباشر الآمن لمنع الشاشة السوداء.' : 'Asset loading took longer than expected. Fallback workspace activated to ensure smooth editing without blank screens.')
            : (isAr ? 'نقوم بفحص طبقات التصميم، مقاييس النصوص، وتثبيت عناصر الـ Canvas بدقة عالية...' : 'Verifying canvas layers, typography metrics, and ensuring DOM elements are fully mounted...')}
        </p>

        {/* Canvas Shimmer Skeleton (Preview of aspect ratio) */}
        <div 
          style={{ width: `${Math.min(previewW, 300)}px`, height: `${Math.min(previewH, 180)}px` }}
          className="relative rounded-shape-sm bg-[var(--surface-subtle)] border-2 border-dashed border-[var(--border-main)] overflow-hidden mb-6 flex flex-col items-center justify-center shadow-inner group"
        >
          {/* Shimmer sweep animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          
          <Sparkles className="text-[var(--fg-accent,#38bdf8)] mb-1.5 animate-pulse" size={24} />
          <span className="text-[11px] font-bold text-[var(--text-muted)]">
            {targetW} × {targetH} ({aspectRatio || '1:1'})
          </span>
          <span className="text-[10px] text-[var(--text-muted)] mt-0.5">
            {isAr ? 'لوحة تصميم آمنة ومطابقة' : 'Safe Surface Rendering'}
          </span>
        </div>

        {/* Real-time Checklist of Composition Milestones */}
        <div className="w-full space-y-2 mb-6 text-start">
          {steps.map(s => {
            const Icon = s.icon;
            return (
              <div 
                key={s.id} 
                className={`flex items-center justify-between p-2 rounded-shape-xs text-xs transition-colors ${
                  s.done 
                    ? 'bg-[var(--surface-subtle)]/60 text-[var(--text-primary)]' 
                    : 'text-[var(--text-muted)] opacity-70'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon size={14} className={s.done ? 'text-[var(--fg-accent,#38bdf8)]' : 'text-[var(--text-muted)]'} />
                  <span className="font-semibold truncate">{isAr ? s.labelAr : s.labelEn}</span>
                </div>
                {s.done ? (
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                ) : (
                  <RefreshCw size={12} className="animate-spin text-[var(--text-muted)] shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Index.html CSS Variables Audit Badge */}
        {cssAudit && (
          <div className="w-full mb-5 px-3 py-1.5 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-between text-[11px]">
            <span className="text-[var(--text-muted)]">
              {isAr ? 'متغيرات CSS وتنسيقات النظام:' : 'index.html CSS Variables:'}
            </span>
            <span className={`font-bold flex items-center gap-1 ${cssAudit.appliedCorrectly ? 'text-emerald-500' : 'text-amber-500'}`}>
              {cssAudit.appliedCorrectly ? (
                <>
                  <CheckCircle2 size={12} />
                  <span>{isAr ? 'مطبقة بالكامل (100%)' : 'Fully Applied'}</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={12} />
                  <span>{cssAudit.appliedCount}/{cssAudit.totalCount} {isAr ? 'مطبق' : 'applied'}</span>
                </>
              )}
            </span>
          </div>
        )}

        {/* Fallback Action Buttons if Composition Takes Too Long */}
        {isTimedOut ? (
          <div className="w-full flex flex-col sm:flex-row gap-2 pt-2 border-t border-[var(--border-default)]">
            <button
              type="button"
              onClick={onForceLaunch}
              className="flex-1 min-h-[44px] px-4 py-2 rounded-shape-sm bg-[var(--comp-button-primary-bg,#0284c7)] hover:bg-[var(--comp-button-primary-bg,#0284c7)]/90 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
            >
              <Sparkles size={14} />
              <span>{isAr ? 'فتح اللوحة فوراً وتخطي الأصول المتأخرة' : 'Force Open Workspace Canvas'}</span>
            </button>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center pt-2">
            <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
              <RefreshCw size={11} className="animate-spin" />
              <span>{isAr ? 'جاري استكمال العرض في أجزاء من الثانية...' : 'Completing composition in milliseconds...'}</span>
            </span>
          </div>
        )}

      </div>
    </div>
  );
};
