import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Compass, 
  Sliders, 
  Settings,
  Megaphone, 
  Zap, 
  RefreshCw, 
  Activity,
  UserCheck,
  Cpu,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { RecommendationWidget } from '../components/RecommendationWidget';
import { RecommendationPreferencesModal } from '../components/RecommendationPreferencesModal';

const EngagementTrendsChart = lazy(() => import('../components/EngagementTrendsChart'));

export const RecommendationsPage: React.FC = () => {
  const { language, token, user, setIsAuthModalOpen, dir } = useAppContext();
  const navigate = useNavigate();
  const [isPrefModalOpen, setIsPrefModalOpen] = useState<boolean>(false);
  const [userSummary, setUserSummary] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    if (token && user) {
      fetchUserSummary();
    }
  }, [token, user, refreshKey]);

  const fetchUserSummary = async () => {
    try {
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/recommendations?limit=4', { headers });
      if (!res.ok) return;
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) return;
      const data = await res.json();
      if (data.success && data.user_summary) {
        setUserSummary(data.user_summary);
      }
    } catch (err) {
      console.error('[RecommendationsPage] Fetch summary error:', err);
    }
  };

  if (!user || !token) {
    return (
      <div className="min-h-screen-safe bg-[var(--surface-page)] text-[var(--text-primary)] flex items-center justify-center p-6 transition-theme">
        <motion.div 
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-md w-full p-6 sm:p-8 rounded-shape-lg border border-[var(--border-default)] bg-[var(--surface-card)] text-center shadow-2xs relative overflow-hidden transition-theme"
        >
          <div className="w-12 h-12 rounded-shape-md bg-[var(--bg-accent-muted)] border border-[var(--border-accent)]/20 flex items-center justify-center text-[var(--fg-accent)] mx-auto mb-4">
            <Sparkles size={24} />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-2 tracking-wide">
            {language === 'ar' ? 'محرك الاستكشاف والتوصيات الذكية' : 'AI Discovery & Recommendation Hub'}
          </h2>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6">
            {language === 'ar' 
              ? 'ميزة التوصيات الذكية متاحة حصرياً للأعضاء المسجلين. سجّل الدخول للحصول على ترشيحات دقيقة ومخصصة بناءً على نشاطك واهتماماتك.'
              : 'The smart recommendation engine is exclusively available to logged-in members to deliver tailored recommendations based on your activity and preferences.'}
          </p>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full py-2.5 min-h-[44px] rounded-shape-sm font-bold text-xs md:text-sm transition-all duration-150 bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] hover:opacity-90 active:scale-95 shadow-2xs flex items-center justify-center gap-2 cursor-pointer touch-target-44"
          >
            <UserCheck size={16} />
            <span>{language === 'ar' ? 'تسجيل الدخول / إنشاء حساب' : 'Sign In / Register'}</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen-safe bg-[var(--surface-page)] text-[var(--text-primary)] pb-24 transition-theme">
      {/* Page Sticky Header */}
      <div className="sticky top-0 z-30 bg-[var(--surface-page)]/95 backdrop-blur-md border-b border-[var(--border-default)] px-3 sm:px-6 py-2.5 transition-theme shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="h-8 px-2.5 flex items-center gap-1 rounded-shape-sm bg-transparent border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-accent)]/60 hover:bg-[var(--surface-subtle)] transition-all duration-150 active:scale-95 cursor-pointer"
              title={dir === 'rtl' ? 'رجوع' : 'Back'}
            >
              <div className="h-[23px] leading-[23px] flex items-center gap-1">
                {dir === 'rtl' ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                <span className="text-xs font-bold">{dir === 'rtl' ? 'رجوع' : 'Back'}</span>
              </div>
            </button>

            <div className="w-8 h-8 rounded-shape-sm bg-[var(--bg-accent-muted)] border border-[var(--border-accent)]/20 flex items-center justify-center text-[var(--fg-accent)] shrink-0">
              <Compass size={16} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                {language === 'ar' ? 'استكشاف التوصيات' : 'Explore Recommendations'}
              </h1>
              <p className="hidden sm:block text-[11px] text-[var(--text-muted)] truncate">
                {language === 'ar' 
                  ? 'تحليل التفضيلات وترشيح الخدمات والأدوات الرقمية المتوافقة' 
                  : 'Analysis of preferences and curated recommendations for tools and services'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsPrefModalOpen(true)}
              title={language === 'ar' ? 'ضبط التفضيلات' : 'Customize Preferences'}
              className="h-8 px-3 rounded-shape-sm text-xs font-bold btn-long-standard bg-transparent border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-accent)]/60 hover:bg-[var(--surface-subtle)] flex items-center cursor-pointer active:scale-95 transition-theme"
            >
              <div className="h-[23px] leading-[23px] flex items-center gap-1.5">
                <Settings size={14} className="shrink-0 text-[var(--fg-accent)]" />
                <span className="hidden sm:inline">{language === 'ar' ? 'ضبط التفضيلات' : 'Customize Preferences'}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-3.5 sm:pt-6 space-y-4 sm:space-y-6">
        {/* User Interaction & Vector Summary Banner */}
        <div className="p-3.5 sm:p-5 rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-card)] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 relative overflow-hidden shadow-2xs transition-theme">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-8 h-8 rounded-shape-sm bg-[var(--bg-accent-muted)] border border-[var(--border-accent)]/20 flex items-center justify-center text-[var(--fg-accent)] shrink-0 mt-0.5">
              <Activity size={16} />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5 flex-wrap">
                {language === 'ar' ? 'سجل التوصيات المخصصة لـ ' : 'Recommendation Profile for '}
                <span className="text-[var(--fg-accent)]">{user?.name || (language === 'ar' ? 'المستخدم' : 'Developer')}</span>
              </h3>
              <p className="text-[11px] sm:text-xs text-[var(--text-muted)] mt-0.5 leading-snug">
                {language === 'ar'
                  ? 'تحليل التفاعلات والخدمات المحفوظة لاحتساب معدلات التوافق بدقة.'
                  : 'Synthesizing activity and saved services to calculate precise match scores.'}
              </p>

              {userSummary?.top_inferred_categories?.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 mt-2">
                  <span className="text-[10px] font-bold text-[var(--text-muted)]">
                    {language === 'ar' ? 'المجالات المرتبطة:' : 'Related Categories:'}
                  </span>
                  {userSummary.top_inferred_categories.map((cat: string, idx: number) => (
                    <span
                      key={`rec-cat-${cat}-${idx}`}
                      className="px-2 py-0.5 rounded-shape-xs bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)] text-[10px] font-bold"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sleek Elongated Metric Bars (Replaced Bulky Vertical Squares) */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 w-full sm:w-auto pt-2.5 sm:pt-0 border-t border-[var(--border-default)] sm:border-0">
            <div className="h-8 px-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center gap-2 shadow-2xs">
              <span className="text-[11px] font-medium text-[var(--text-muted)]">
                {language === 'ar' ? 'دقة الترشيح:' : 'Match Precision:'}
              </span>
              <span className="text-xs font-bold text-[var(--fg-accent)] font-mono">
                {userSummary?.avg_match_percentage ? `${userSummary.avg_match_percentage}%` : '88%'}
              </span>
            </div>
            <div className="h-8 px-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center gap-2 shadow-2xs">
              <span className="text-[11px] font-medium text-[var(--text-muted)]">
                {language === 'ar' ? 'العناصر المرشحة:' : 'Active Recommendations:'}
              </span>
              <span className="text-xs font-bold text-[var(--fg-accent)] font-mono">
                {userSummary?.total_recommendations ? `${userSummary.total_recommendations}+` : '15+'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 0: D3 Analytics & Engagement Trends */}
        <section className="p-3.5 sm:p-5 rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-card)] shadow-2xs transition-theme">
          <Suspense fallback={<div className="p-8 text-center text-sm text-[var(--text-muted)] animate-pulse">Loading chart...</div>}>
            <EngagementTrendsChart initialTimeframe="30d" />
          </Suspense>
        </section>

        {/* Section 1: Top Picks Unified Widget */}
        <section className="p-3.5 sm:p-5 rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-card)] shadow-2xs transition-theme">
          <RecommendationWidget
            variant="full"
            limit={8}
            onOpenPreferences={() => setIsPrefModalOpen(true)}
          />
        </section>

        {/* Section 2: Business Board Posts & Ads */}
        <section className="p-3.5 sm:p-5 rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-card)] shadow-2xs transition-theme">
          <div className="flex items-center justify-between mb-3 sm:mb-4 pb-2.5 sm:pb-3 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-8 h-8 rounded-shape-sm bg-[var(--bg-accent-muted)] border border-[var(--border-accent)]/20 flex items-center justify-center text-[var(--fg-accent)] shrink-0">
                <Megaphone size={16} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                  {language === 'ar' ? 'خدمات وعروض شبكة الأعمال' : 'Business Board & Verified Listings'}
                </h3>
                <p className="text-[10px] sm:text-xs text-[var(--text-muted)] hidden sm:block">
                  {language === 'ar' ? 'منشورات وخدمات نشطة تحظى بتفاعل مباشر في شبكة الأعمال' : 'Active listings and services with direct business engagement'}
                </p>
              </div>
            </div>
          </div>

          <RecommendationWidget
            variant="compact"
            filterType="bulletin"
            limit={4}
          />
        </section>

        {/* Section 3: AI Tools & Productivity */}
        <section className="p-3.5 sm:p-5 rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-card)] shadow-2xs transition-theme">
          <div className="flex items-center justify-between mb-3 sm:mb-4 pb-2.5 sm:pb-3 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-8 h-8 rounded-shape-sm bg-[var(--bg-accent-muted)] border border-[var(--border-accent)]/20 flex items-center justify-center text-[var(--fg-accent)] shrink-0">
                <Zap size={16} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                  {language === 'ar' ? 'أدوات الإنتاجية المقترحة' : 'Recommended Productivity Tools'}
                </h3>
                <p className="text-[10px] sm:text-xs text-[var(--text-muted)] hidden sm:block">
                  {language === 'ar' ? 'أدوات رقمية مساعدة لتطوير البرمجيات والتحليل وإدارة الأعمال' : 'Digital tools for engineering, analytics, and operational efficiency'}
                </p>
              </div>
            </div>
          </div>

          <RecommendationWidget
            variant="compact"
            filterType="tool"
            limit={4}
          />
        </section>
      </div>

      {/* Preferences Modal */}
      <RecommendationPreferencesModal
        isOpen={isPrefModalOpen}
        onClose={() => setIsPrefModalOpen(false)}
        onSaved={() => setRefreshKey(prev => prev + 1)}
      />
    </div>
  );
};
export default RecommendationsPage;

