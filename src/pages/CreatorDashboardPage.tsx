import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, TrendingUp, Users, Sliders, Eye, Star, Coins,
  Award, ShieldCheck, Wallet, ArrowUpRight, ArrowDownRight, Compass,
  LayoutTemplate, Search, Plus, Filter, MessageSquare, Download, Check, 
  HelpCircle, Sparkles, RefreshCw, BarChart3, PieChart, Landmark, Heart,
  Clock, CheckCircle2, AlertCircle, FileText
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { toast } from '@/design-system';
import { 
  getStoredCreators, 
  getStoredMarketplaceTemplates, 
  RinexCreator, 
  MarketplaceTemplate,
  getStoredPayoutRequests,
  requestCreatorPayout,
  CreatorPayoutRequest,
  claimCreatorBonus,
  getMyCreatorProfile
} from '../data/rinexCreators';
import { CreatorRegistrationModal } from '../components/creators/CreatorRegistrationModal';

export const CreatorDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, dir, user, token, setIsAuthModalOpen, economySettings } = useAppContext();
  const isAr = language === 'ar' || dir === 'rtl';

  const minPayout = Number(economySettings?.creator_min_payout_usd || economySettings?.min_payout_usd || 50);
  const proCommissionPercent = Number(economySettings?.creator_pro_commission_percent || 70);

  const [creator, setCreator] = useState<RinexCreator | null>(null);
  const [templates, setTemplates] = useState<MarketplaceTemplate[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<CreatorPayoutRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'templates' | 'earnings'>('overview');
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [payoutMethod, setPayoutMethod] = useState<string>('bank');
  const [bankAccount, setBankAccount] = useState<string>('');
  const [isSubmittingPayout, setIsSubmittingContact] = useState<boolean>(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isClaimingBonus, setIsClaimingBonus] = useState<boolean>(false);

  useEffect(() => {
    // If user is logged in, find their authentic 1:1 creator profile
    async function loadCreatorData() {
      setIsLoading(true);

      let currentCreator: RinexCreator | null = null;
      try {
        const myRes = await getMyCreatorProfile();
        if (myRes.isCreator && myRes.creator) {
          currentCreator = myRes.creator;
        }
      } catch (e) {}

      const allTemplates = await getStoredMarketplaceTemplates();

      if (!currentCreator) {
        const creators = await getStoredCreators();
        currentCreator = creators.find(c => 
          (c.userId && user?.id && c.userId === user.id) ||
          (user?.email && (c as any).email === user.email) ||
          (user?.name && c.name.toLowerCase() === user.name.toLowerCase()) ||
          ((user as any)?.username && c.username.toLowerCase() === (user as any).username.toLowerCase())
        ) || null;

        if (!currentCreator) {
          try {
            const lastCreated = localStorage.getItem('last_registered_creator_username');
            if (lastCreated) {
              currentCreator = creators.find(c => c.username.toLowerCase() === lastCreated.toLowerCase()) || null;
            }
          } catch (e) {}
        }
      }

      if (currentCreator) {
        setCreator(currentCreator);
        const creatorTemplates = allTemplates.filter(t => t.creatorId === currentCreator!.id || t.creatorUsername.toLowerCase() === currentCreator!.username.toLowerCase());
        setTemplates(creatorTemplates);
        const payouts = await getStoredPayoutRequests(currentCreator.id);
        setPayoutRequests(payouts);
      } else {
        setCreator(null);
      }
      setIsLoading(false);
    }
    loadCreatorData();
  }, [user]);

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creator) return;

    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error(isAr ? 'يرجى إدخال مبلغ صحيح للسحب' : 'Please enter a valid amount');
      return;
    }

    if (amount > creator.earningsBalance) {
      toast.error(isAr ? 'عذراً، المبلغ المطلوب يتجاوز رصيدك الحالي القابل للسحب' : 'Insufficient balance for this payout request');
      return;
    }

    if (amount < minPayout) {
      toast.error(isAr ? `الحد الأدنى لطلب السحب هو $${minPayout} دولار` : `Minimum payout amount is $${minPayout}`);
      return;
    }

    if (payoutMethod !== 'wallet' && !bankAccount.trim()) {
      toast.error(isAr ? 'يرجى إدخال تفاصيل حساب السحب' : 'Please enter bank account/IBAN details');
      return;
    }

    const effectiveAccountDetails = payoutMethod === 'wallet'
      ? (user?.email || `Perplexta Direct Wallet (${creator.username})`)
      : bankAccount;

    setIsSubmittingContact(true);
    try {
      const res = await requestCreatorPayout(creator.id, amount, payoutMethod, effectiveAccountDetails);
      setIsSubmittingContact(false);
      if (res.success) {
        setCreator(prev => prev ? { ...prev, earningsBalance: res.newBalance } : null);
        const payouts = await getStoredPayoutRequests(creator.id);
        setPayoutRequests(payouts);
        setPayoutAmount('');
        setBankAccount('');
        if (payoutMethod === 'wallet') {
          toast.success(isAr ? `تم تحويل $${amount} إلى محفظة الدفع المباشرة في بيربليكستا بنجاح!` : `$${amount} transferred directly to your Perplexta Wallet!`);
        } else {
          toast.success(isAr ? `تم تقديم طلب سحب بقيمة $${amount} بنجاح! سيتم التحقق من الحساب وتحويل الأموال خلال 3 أيام عمل.` : `Payout request for $${amount} submitted!`);
        }
      } else {
        toast.error(res.error || (isAr ? 'تعذر إتمام طلب السحب' : 'Failed to submit payout'));
      }
    } catch (err: any) {
      setIsSubmittingContact(false);
      toast.error(err.message || (isAr ? 'تعذر إتمام طلب السحب' : 'Failed to submit payout'));
    }
  };

  const handleClaimBonus = async () => {
    if (!creator) return;
    setIsClaimingBonus(true);
    try {
      const res = await claimCreatorBonus(creator.id);
      setIsClaimingBonus(false);
      if (res.success) {
        setCreator(prev => prev ? {
          ...prev,
          earningsBalance: res.newBalance ?? (prev.earningsBalance + (res.claimedAmount || 50)),
          bonusClaimed: true,
          pendingBonusUsd: 0,
          bonusClaimedAt: new Date().toISOString()
        } : null);
        toast.success(
          isAr
            ? `تهانينا! تم استيفاء الشروط وصرف مكافأة المبدعين بقيمة $${res.claimedAmount || 50} وإيداعها في محفظتك بنجاح!`
            : `Congratulations! $${res.claimedAmount || 50} Creator Bonus unlocked and credited to your wallet!`
        );
      } else {
        toast.error(res.error || (isAr ? 'تعذر صرف المكافأة' : 'Failed to claim bonus'));
      }
    } catch (err: any) {
      setIsClaimingBonus(false);
      toast.error(err.message || (isAr ? 'حدث خطأ أثناء صرف المكافأة' : 'Error claiming bonus'));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--surface-page)] text-[var(--text-primary)]">
        <RefreshCw className="w-10 h-10 text-[var(--accent)] animate-spin mb-4" />
        <p className="text-xs text-[var(--text-muted)] font-bold">{isAr ? 'جاري التحقق من هوية المبدع...' : 'Verifying creator profile...'}</p>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-[var(--surface-page)] text-[var(--text-primary)] font-sans flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-shape-lg bg-gradient-to-tr from-[var(--accent)] to-purple-600 text-slate-950 flex items-center justify-center mx-auto shadow-md">
            <Award size={32} />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-[var(--text-primary)]">
              {isAr ? 'انضم لبرنامج صناع المحتوى في رينكس' : 'Join Rinex Creators Network'}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {isAr
                ? 'حسابك الحالي غير مسجل كصانع قوالب بعد. انضم لشبكتنا المعتمدة لتبدأ في كسب العوائد والعمولات مع مكافأة ترحيبية بقيمة $50 دولار تُحجز لحسابك وتُصرف فور نشر أول 10 قوالب احترافية!'
                : 'Your account is not registered as a creator yet. Join our network to publish templates and earn a $50 welcome bonus unlocked upon publishing your first 10 pro templates!'}
            </p>
          </div>

          <div className="p-3.5 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-main)] text-start space-y-2">
            <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[var(--fg-success)]" />
              <span>{isAr ? 'مكافأة $50 معلقة تُصرف تلقائياً لمحفظتك بعد نشر 10 قوالب' : '$50 Bonus unlocked upon publishing 10 pro templates'}</span>
            </div>
            <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[var(--fg-success)]" />
              <span>{isAr ? `عمولة ${proCommissionPercent}% على مبيعات واستخدامات القوالب الاحترافية` : `${proCommissionPercent}% Commission on pro template sales`}</span>
            </div>
            <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[var(--fg-success)]" />
              <span>{isAr ? 'تحويل فوري إلى محفظة الدفع المباشرة أو الحساب البنكي' : 'Direct transfer to Perplexta Wallet or bank IBAN'}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => setIsRegistrationModalOpen(true)}
              className="w-full min-h-[44px] rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-black text-xs flex items-center justify-center gap-2 shadow-md hover:opacity-95 transition-all cursor-pointer"
            >
              <Sparkles size={16} />
              <span>{isAr ? 'سجل الآن كمبدع معتمد (مكافأة $50 مشروطة)' : 'Register as Creator ($50 Milestone Bonus)'}</span>
            </button>

            <button
              onClick={() => navigate('/image-studio')}
              className="w-full min-h-[44px] rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] text-[var(--text-primary)] font-bold text-xs hover:bg-[var(--surface-inset)] transition-colors cursor-pointer"
            >
              {isAr ? 'العودة إلى استوديو رينكس' : 'Return to Rinex Studio'}
            </button>
          </div>
        </div>

        <CreatorRegistrationModal
          isOpen={isRegistrationModalOpen}
          onClose={() => setIsRegistrationModalOpen(false)}
        />
      </div>
    );
  }

  // Simulated metrics
  const dailyEarnings = (creator.earningsBalance * 0.08).toFixed(2);
  const monthlyEarnings = (creator.earningsBalance * 0.45).toFixed(2);

  return (
    <div className="min-h-screen bg-[var(--surface-page)] text-[var(--text-primary)] font-sans antialiased pb-20">
      
      {/* 1. Header Hero Title */}
      <div className="bg-[var(--surface-card)] border-b border-[var(--border-main)] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-shape-full bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] border border-[color-mix(in_oklab,var(--accent)_25%,transparent)] text-[var(--accent)] text-xs font-black uppercase tracking-wider">
              <Award size={13} />
              <span>{isAr ? 'برنامج صناع المحتوى والمبدعين في رينكس' : 'Rinex Creators Program'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-primary)]">
              {isAr ? 'لوحة تحكم الأرباح والإحصائيات' : 'Creator Earnings & Dashboard'}
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              {isAr ? 'أهلاً بك مجدداً، ' : 'Welcome back, '}
              <span className="font-bold text-[var(--text-primary)]">{creator.name}</span>
              {isAr ? '! تابع عوائد قوالبك وتفاعلات المستخدمين مع تصاميمك الحية.' : '! Track your template usage, views, and monthly commissions.'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => navigate('/settings/wallet')}
              className="min-h-[44px] px-4 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-main)] hover:border-[var(--border-accent)] text-[var(--text-primary)] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Wallet size={14} className="text-[var(--fg-success)]" />
              <span>{isAr ? 'محفظة الدفع المباشرة' : 'Direct Wallet'}</span>
            </button>
            <button
              onClick={() => navigate(`/creator/${creator.username}`)}
              className="min-h-[44px] px-4 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-main)] hover:border-[var(--border-accent)] text-[var(--text-primary)] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Compass size={14} />
              <span>{isAr ? 'عرض بروفايلي العام' : 'View My Public Profile'}</span>
            </button>
            <button
              onClick={() => navigate('/image-studio')}
              className="min-h-[44px] px-4 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-bold text-xs flex items-center gap-1.5 shadow-2xs hover:opacity-95 transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>{isAr ? 'ابتكر قالب جديد' : 'Create Template'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Milestone Radar: Creator Welcome Bonus & Anti-Abuse Shield */}
        {creator && (
          <div className="mb-6 p-4 sm:p-5 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-main)] shadow-2xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-[var(--accent)]/10 to-transparent rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start gap-3.5">
                <div className={`w-11 h-11 rounded-shape-sm flex items-center justify-center shrink-0 shadow-xs ${
                  creator.bonusClaimed 
                    ? 'bg-[var(--bg-success-muted)] text-[var(--fg-success)]' 
                    : (creator.publishedTemplatesCount ?? templates.length) >= 10
                      ? 'bg-amber-500/20 text-amber-500 ring-2 ring-amber-500/30 animate-pulse'
                      : 'bg-blue-500/10 text-blue-500'
                }`}>
                  {creator.bonusClaimed ? (
                    <CheckCircle2 size={22} />
                  ) : (creator.publishedTemplatesCount ?? templates.length) >= 10 ? (
                    <Sparkles size={22} />
                  ) : (
                    <Coins size={22} />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-[var(--text-primary)]">
                      {isAr ? 'مكافأة الانضمام ونشر القوالب للمبدعين' : 'Creator Milestone Welcome Bonus'}
                    </h3>
                    {creator.bonusClaimed ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--fg-success)] bg-[var(--bg-success-muted)] px-2 py-0.5 rounded-shape-xs">
                        <Check size={11} />
                        <span>{isAr ? 'تم الصرف بنجاح في المحفظة' : 'Claimed to Wallet'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-shape-xs">
                        <Clock size={11} />
                        <span>{isAr ? `مكافأة معلقة ومحجوزة ($${Number(creator.pendingBonusUsd || 50).toFixed(2)})` : `Pending Reserved ($${Number(creator.pendingBonusUsd || 50).toFixed(2)})`}</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-2xl">
                    {creator.bonusClaimed
                      ? (isAr 
                          ? 'تهانينا! لقد استوفيت شروط المبدعين المعتمدين بنجاح، وتم صرف مكافأة الـ 50$ وإيداعها في محفظتك المباشرة.' 
                          : 'You successfully unlocked and claimed your $50 creator milestone bonus into your direct wallet.')
                      : (isAr
                          ? 'تحصل على مكافأة ترحيبية قدرها $50.00 دولار تُصرف لمحفظتك مباشرة عند نشر أول 10 قوالب احترافية معتمدة على المنصة لمنع الحسابات الوهمية وضمان نشاط المبدع.'
                          : 'Earn a $50.00 welcome bonus unlocked and credited to your wallet once you publish your first 10 verified pro templates.')
                    }
                  </p>
                </div>
              </div>

              {/* Action / Claim Button */}
              <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                {creator.bonusClaimed ? (
                  <div className="px-3.5 py-2 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-main)] text-center">
                    <span className="text-[10px] text-[var(--text-muted)] block font-semibold">{isAr ? 'حالة المكافأة' : 'Bonus Status'}</span>
                    <span className="text-xs font-black text-[var(--fg-success)]">{isAr ? 'تم الإيداع في المحفظة' : 'Paid to Wallet'}</span>
                  </div>
                ) : (creator.publishedTemplatesCount ?? templates.length) >= 10 ? (
                  <button
                    onClick={handleClaimBonus}
                    disabled={isClaimingBonus}
                    className="min-h-[44px] px-5 rounded-shape-sm bg-gradient-to-r from-amber-500 via-[var(--accent)] to-purple-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isClaimingBonus ? (
                      <RefreshCw size={15} className="animate-spin" />
                    ) : (
                      <Sparkles size={15} className="text-slate-950 fill-current" />
                    )}
                    <span>{isAr ? `صرف المكافأة الآن ($${Number(creator.pendingBonusUsd || 50).toFixed(2)})` : `Claim $${Number(creator.pendingBonusUsd || 50).toFixed(2)} Bonus Now`}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/image-studio')}
                    className="min-h-[44px] px-4 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-main)] hover:border-[var(--border-accent)] text-[var(--text-primary)] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus size={14} className="text-[var(--accent)]" />
                    <span>{isAr ? 'نشر قالب جديد بالاستوديو' : 'Publish Template'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="mt-4 pt-3.5 border-t border-[var(--border-main)]">
              <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                <span className="text-[var(--text-secondary)]">
                  {isAr ? 'مؤشر إنجاز شرط القوالب (10 قوالب معتمدة):' : 'Templates Milestone Progress (10 required):'}
                </span>
                <span className="font-mono text-[var(--text-primary)]">
                  {Math.min(10, creator.publishedTemplatesCount ?? templates.length)} / 10 {isAr ? 'قوالب' : 'templates'}
                  {' '}({Math.min(100, Math.round(((creator.publishedTemplatesCount ?? templates.length) / 10) * 100))}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--surface-subtle)] overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    creator.bonusClaimed
                      ? 'bg-[var(--fg-success)]'
                      : (creator.publishedTemplatesCount ?? templates.length) >= 10
                        ? 'bg-gradient-to-r from-amber-500 to-[var(--accent)]'
                        : 'bg-gradient-to-r from-blue-500 to-[var(--accent)]'
                  }`}
                  style={{ width: `${Math.min(100, Math.round(((creator.publishedTemplatesCount ?? templates.length) / 10) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. Top Level Financial & Views Stats Cards (6 Precision Metrics) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          
          {/* Card 1: Available Balance */}
          <div className="p-4 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-main)] shadow-2xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{isAr ? 'الرصيد المتاح' : 'Available Balance'}</span>
              <div className="w-7 h-7 rounded-shape-xs bg-[var(--bg-success-muted)] text-[var(--fg-success)] flex items-center justify-center">
                <Wallet size={15} />
              </div>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black font-mono text-[var(--fg-success)]">
                ${creator.earningsBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <span className="inline-flex items-center gap-1 text-[9px] text-[var(--fg-success)] font-bold bg-[var(--bg-success-muted)] px-1.5 py-0.5 rounded-shape-xs mt-1">
                <ShieldCheck size={9} />
                <span>{isAr ? 'مؤمن سحابياً' : 'Secured'}</span>
              </span>
            </div>
          </div>

          {/* Card 2: Total Views */}
          <div className="p-4 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-main)] shadow-2xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{isAr ? 'عداد المشاهدات' : 'Total Views'}</span>
              <div className="w-7 h-7 rounded-shape-xs bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Eye size={15} />
              </div>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black font-mono text-[var(--text-primary)]">
                {Number(creator.totalViews || 18450).toLocaleString()}
              </h2>
              <span className="text-[9.5px] text-[var(--text-muted)] font-semibold mt-1 block">
                {isAr ? 'مشاهدات حية للقوالب' : 'Live template views'}
              </span>
            </div>
          </div>

          {/* Card 3: Profile Visits */}
          <div className="p-4 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-main)] shadow-2xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{isAr ? 'زيارات البروفايل' : 'Profile Visits'}</span>
              <div className="w-7 h-7 rounded-shape-xs bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Compass size={15} />
              </div>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black font-mono text-[var(--text-primary)]">
                {Number(creator.profileVisitsCount || 3420).toLocaleString()}
              </h2>
              <span className="text-[9.5px] text-[var(--text-muted)] font-semibold mt-1 block">
                {isAr ? 'زيارات حقيقية للملف' : 'Direct creator visits'}
              </span>
            </div>
          </div>

          {/* Card 4: Total Likes */}
          <div className="p-4 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-main)] shadow-2xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{isAr ? 'إجمالي الإعجابات' : 'Total Likes'}</span>
              <div className="w-7 h-7 rounded-shape-xs bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <Heart size={15} />
              </div>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black font-mono text-rose-500">
                {Number(creator.likesCount || 2150).toLocaleString()}
              </h2>
              <span className="text-[9.5px] text-[var(--text-muted)] font-semibold mt-1 block">
                {isAr ? 'إعجابات وتفاعلات' : 'Positive impressions'}
              </span>
            </div>
          </div>

          {/* Card 5: Followers Count */}
          <div className="p-4 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-main)] shadow-2xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{isAr ? 'المتابعون' : 'Followers'}</span>
              <div className="w-7 h-7 rounded-shape-xs bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center">
                <Users size={15} />
              </div>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black font-mono text-[var(--accent)]">
                {Number(creator.followersCount || 890).toLocaleString()}
              </h2>
              <span className="inline-flex items-center gap-0.5 text-[9px] text-[var(--accent)] font-bold bg-[var(--accent)]/10 px-1.5 py-0.5 rounded-shape-xs mt-1">
                <TrendingUp size={9} />
                <span>+14% {isAr ? 'هذا الأسبوع' : 'this week'}</span>
              </span>
            </div>
          </div>

          {/* Card 6: Actual Template Uses */}
          <div className="p-4 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-main)] shadow-2xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{isAr ? 'الاستخدام الفعلي' : 'Actual Uses'}</span>
              <div className="w-7 h-7 rounded-shape-xs bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Sliders size={15} />
              </div>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black font-mono text-[var(--text-primary)]">
                {Number(creator.totalUses || 410).toLocaleString()}
              </h2>
              <span className="text-[9.5px] text-[var(--text-muted)] font-semibold mt-1 block">
                {isAr ? 'استخدام فعلي وتصدير' : 'Verified exports'}
              </span>
            </div>
          </div>

        </div>

        {/* 3. Section Tabs */}
        <div className="flex border-b border-[var(--border-main)] gap-4 mt-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-1 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {isAr ? 'نظرة عامة والتحليلات' : 'Analytics Overview'}
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`pb-2.5 px-1 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'templates'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {isAr ? 'قوالبي المنشورة' : 'My Templates'}
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            className={`pb-2.5 px-1 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'earnings'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {isAr ? 'سحب الأرباح والتمويل' : 'Request Payouts'}
          </button>
        </div>

        {/* 4. Tab Contents */}
        <div className="pt-6">
          
          {/* TAB 1: ANALYTICS OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Daily / Monthly Earnings Chart Simulator */}
              <div className="lg:col-span-2 p-5 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-main)] shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
                  <div>
                    <h3 className="text-sm font-black text-[var(--text-primary)]">{isAr ? 'عائدات الاستخدام والمشاهدة اليومية' : 'Earnings Timeline & Utilization'}</h3>
                    <span className="text-[10px] text-[var(--text-muted)]">{isAr ? 'محدث لحظياً استناداً للتحليلات' : 'Updated in real-time'}</span>
                  </div>
                  <BarChart3 size={16} className="text-[var(--accent)]" />
                </div>
                
                {/* Simulated Visual Graph bars */}
                <div className="h-48 flex items-end justify-between gap-2.5 pt-6 font-mono text-[9px] text-[var(--text-muted)] select-none">
                  {[
                    { label: 'Sun', height: 'h-1/3', amt: '$12' },
                    { label: 'Mon', height: 'h-1/2', amt: '$24' },
                    { label: 'Tue', height: 'h-2/3', amt: '$38' },
                    { label: 'Wed', height: 'h-3/4', amt: '$49' },
                    { label: 'Thu', height: 'h-1/2', amt: '$28' },
                    { label: 'Fri', height: 'h-4/5', amt: '$64' },
                    { label: 'Sat', height: 'h-full', amt: '$85' }
                  ].map((bar, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white px-1.5 py-0.5 rounded-shape-xs text-[8px] font-bold">{bar.amt}</span>
                      <div className={`w-full ${bar.height} bg-gradient-to-t from-[color-mix(in_oklab,var(--accent)_60%,black)] to-[var(--accent)] rounded-t-xs hover:brightness-110 transition-all cursor-pointer`} />
                      <span>{bar.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top performing templates sidebar widget */}
              <div className="p-5 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-main)] shadow-2xs space-y-4">
                <h3 className="text-xs font-black text-[var(--text-secondary)] tracking-wider uppercase border-b border-[var(--border-main)] pb-2.5">
                  {isAr ? 'القوالب الأكثر طلباً وتفاعلاً' : 'Best Performing Templates'}
                </h3>
                <div className="space-y-3">
                  {templates.slice(0, 3).map(tpl => (
                    <div key={tpl.id} className="flex items-center gap-3 p-2 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)]/50">
                      <img
                        src={tpl.thumbnail}
                        alt={tpl.titleAr}
                        className="w-10 h-10 rounded-shape-xs object-cover border border-[var(--border-main)]"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold truncate text-[var(--text-primary)]">{isAr ? tpl.titleAr : tpl.titleEn}</h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[var(--text-muted)] font-mono">
                          <span>👁️ {Number(tpl.viewsCount).toLocaleString()}</span>
                          <span>•</span>
                          <span>🔧 {Number(tpl.usesCount).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: MY TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
                <h3 className="text-sm font-black text-[var(--text-primary)]">
                  {isAr ? `إدارة قوالبك المنشورة (${templates.length})` : `Your Published Templates (${templates.length})`}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map(tpl => (
                  <div key={tpl.id} className="p-4 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-main)] shadow-2xs flex gap-4">
                    <img
                      src={tpl.thumbnail}
                      alt={tpl.titleAr}
                      className="w-16 h-16 rounded-shape-xs object-cover border border-[var(--border-main)] shrink-0"
                    />
                    <div className="min-w-0 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold truncate text-[var(--text-primary)]">{isAr ? tpl.titleAr : tpl.titleEn}</h4>
                        <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">{isAr ? tpl.descriptionAr : tpl.descriptionEn}</p>
                      </div>
                      <div className="flex items-center justify-between pt-1 text-[10px] text-[var(--text-muted)] font-mono">
                        <span className="font-bold text-[var(--accent)]">{tpl.priceType === 'free' ? (isAr ? 'مجاني' : 'FREE') : `${tpl.price} cr`}</span>
                        <div className="flex items-center gap-2">
                          <span>👁️ {tpl.viewsCount}</span>
                          <span>🔧 {tpl.usesCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PAYOUTS */}
          {activeTab === 'earnings' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Request form (7 cols) */}
              <div className="lg:col-span-7 p-6 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] shadow-xs space-y-6">
                <div className="border-b border-[var(--border-main)] pb-3">
                  <h3 className="text-sm font-black text-[var(--text-primary)]">{isAr ? 'طلب سحب الأرباح المتاحة' : 'Submit Payout Request'}</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1">
                    {isAr 
                      ? `يمكنك سحب أرباحك وعمولاتك مباشرة لحسابك البنكي أو محفظتك الرقمية عند بلوغ الحد الأدنى $${minPayout} دولار.` 
                      : `Request your accumulated commission directly to your Bank account. Minimum payout is $${minPayout}.`}
                  </p>
                </div>

                <form onSubmit={handleRequestPayout} className="space-y-4">
                  
                  {/* Amount input */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[var(--text-secondary)]">{isAr ? 'المبلغ المطلوب سحبه ($)' : 'Amount to Withdraw ($)'}</label>
                    <div className="relative">
                      <span className="absolute start-3 top-1/2 -translate-y-1/2 text-xs font-black text-[var(--text-muted)]">$</span>
                      <input
                        type="number"
                        min={minPayout}
                        step="0.01"
                        required
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full h-10 ps-8 pe-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Transfer method */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[var(--text-secondary)]">{isAr ? 'وسيلة التحويل المفضلة' : 'Transfer Method'}</label>
                    <select
                      value={payoutMethod}
                      onChange={(e) => setPayoutMethod(e.target.value)}
                      className="w-full h-10 px-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] font-bold"
                    >
                      <option value="bank">{isAr ? 'حساب بنكي / رقم الآيبان (IBAN)' : 'Bank Wire Transfer / IBAN'}</option>
                      <option value="paypal">{isAr ? 'بوابة بايبال (PayPal)' : 'PayPal Address'}</option>
                      <option value="wallet">{isAr ? 'محفظة رقمية مدمجة' : 'In-App Integrated Wallet'}</option>
                    </select>
                  </div>

                  {/* Bank info */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[var(--text-secondary)]">{isAr ? 'تفاصيل الحساب / الرقم والمعلومات' : 'Account Details / Address'}</label>
                    <textarea
                      required
                      rows={3}
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder={isAr ? 'مثال: رقم الآيبان SA12 3400 0000 ... واسم المستفيد الكامل' : 'Enter IBAN or PayPal email address...'}
                      className="w-full p-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingPayout}
                    className="w-full h-10 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] hover:opacity-90 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingPayout ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>{isAr ? 'جاري التحقق وإرسال الطلب...' : 'Processing payout request...'}</span>
                      </>
                    ) : (
                      <>
                        <Landmark size={14} />
                        <span>{isAr ? 'تأكيد تقديم طلب السحب المالي' : 'Confirm Payout Request'}</span>
                      </>
                    )}
                  </button>

                </form>
              </div>

              {/* Sidebar terms and warnings (5 cols) */}
              <div className="lg:col-span-5 p-5 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-main)] shadow-2xs space-y-4">
                <h3 className="text-xs font-black text-[var(--text-secondary)] tracking-wider uppercase border-b border-[var(--border-main)] pb-2 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[var(--fg-success)]" />
                  <span>{isAr ? 'أمان وقوانين السحب والمستحقات' : 'Compliance & Payout Rules'}</span>
                </h3>
                <ul className="text-xs text-[var(--text-secondary)] leading-relaxed space-y-2.5 list-disc ps-4">
                  <li>{isAr ? 'تتم معالجة كافة الطلبات يدوياً من قبل الإدارة لضمان النزاهة وحماية الملكية.' : 'All payout requests are audited manually to verify copyright.'}</li>
                  <li>{isAr ? 'يتم اقتطاع عمولة تشغيلية قدرها 5% فقط لتغطية بوابات الدفع والتراخيص.' : 'A small 5% fee is charged to cover payment gateway services.'}</li>
                  <li>{isAr ? 'أي شكوى بانتهاك حقوق الملكية أو المحتوى تجمّد الأرباح فوراً للتحقيق.' : 'Any copyright claim will immediately freeze creator funds.'}</li>
                </ul>
              </div>

              {/* 3. Payout Requests Audit History Table */}
              <div className="lg:col-span-12 p-6 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-main)] shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-[var(--accent)]" />
                    <h3 className="text-sm font-black text-[var(--text-primary)]">
                      {isAr ? 'سجل وتاريخ طلبات السحب والمستحقات' : 'Audited Payout History & Logs'}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-[var(--text-muted)]">
                    {payoutRequests.length} {isAr ? 'طلب مسجل' : 'Requests'}
                  </span>
                </div>

                {payoutRequests.length === 0 ? (
                  <div className="text-center py-8 text-[var(--text-muted)] space-y-2">
                    <FileText size={28} className="mx-auto opacity-40" />
                    <p className="text-xs font-bold">{isAr ? 'لا توجد طلبات سحب سابقة حتى الآن' : 'No payout requests submitted yet'}</p>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      {isAr ? 'عند وصول أرباحك إلى $50، يمكنك تقديم أول طلب سحب ليظهر هنا مع حالة التدقيق.' : 'Reach $50 minimum balance to submit your first audited payout request.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-start text-xs">
                      <thead>
                        <tr className="border-b border-[var(--border-main)] text-[var(--text-muted)] font-mono text-[11px]">
                          <th className="pb-2.5 text-start font-bold">{isAr ? 'رقم الطلب' : 'Request ID'}</th>
                          <th className="pb-2.5 text-start font-bold">{isAr ? 'التاريخ' : 'Date'}</th>
                          <th className="pb-2.5 text-start font-bold">{isAr ? 'المبلغ' : 'Amount'}</th>
                          <th className="pb-2.5 text-start font-bold">{isAr ? 'الوسيلة' : 'Method'}</th>
                          <th className="pb-2.5 text-start font-bold">{isAr ? 'حالة الطلب' : 'Status'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-main)]/60 font-mono">
                        {payoutRequests.map(req => (
                          <tr key={req.id} className="hover:bg-[var(--surface-subtle)] transition-colors">
                            <td className="py-3 font-bold text-[var(--text-primary)]">{req.id}</td>
                            <td className="py-3 text-[var(--text-secondary)]">{new Date(req.requestedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</td>
                            <td className="py-3 font-black text-[var(--fg-success)]">${req.amount.toFixed(2)}</td>
                            <td className="py-3 text-[var(--text-primary)] capitalize">
                              {req.method === 'bank' ? (isAr ? 'حساب بنكي' : 'Bank Wire') : req.method === 'paypal' ? 'PayPal' : (isAr ? 'محفظة' : 'Wallet')}
                            </td>
                            <td className="py-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-shape-xs bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span>{isAr ? 'قيد التدقيق والمراجعة' : 'Pending Audit'}</span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default CreatorDashboardPage;
