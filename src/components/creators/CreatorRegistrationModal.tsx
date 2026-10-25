import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  X, Sparkles, CheckCircle2, Award, User, Palette, Globe, 
  Coins, ArrowLeft, ArrowRight, ShieldCheck, Zap, AlertCircle
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { registerNewCreator, getMyCreatorProfile, RinexCreator } from '../../data/rinexCreators';
import { toast } from '@/design-system';

interface CreatorRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatorRegistrationModal: React.FC<CreatorRegistrationModalProps> = ({ isOpen, onClose }) => {
  const { language, dir, user, economySettings } = useAppContext();
  const navigate = useNavigate();
  const isAr = language === 'ar' || dir === 'rtl';

  const [step, setStep] = useState<1 | 2>(1);
  const [existingCreator, setExistingCreator] = useState<RinexCreator | null>(null);
  const [isCheckingExisting, setIsCheckingExisting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: (user as any)?.username || 'designer_' + Math.floor(Math.random() * 8999 + 1000),
    roleAr: 'مصمم قوالب وهويات بصرية احترافية',
    roleEn: 'Brand & Template Design Specialist',
    bioAr: 'صانع محتوى في شبكة رينكس للإبداع، أبتكر قوالب تسويقية وحركية عالية الجودة لمساعدة رواد الأعمال والمصممين.',
    bioEn: 'Rinex Creative Network member, crafting high-performance visual and motion templates.',
    portfolioUrl: '',
    payoutMethod: 'wallet',
    categories: ['marketing', 'reels', 'story']
  });

  // Verify whether the current authenticated user already has an active creator profile
  useEffect(() => {
    if (isOpen && user) {
      setIsCheckingExisting(true);
      getMyCreatorProfile()
        .then(res => {
          if (res.isCreator && res.creator) {
            setExistingCreator(res.creator);
          } else {
            setExistingCreator(null);
          }
        })
        .catch(() => setExistingCreator(null))
        .finally(() => setIsCheckingExisting(false));
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (existingCreator) {
      toast.warning(
        isAr 
          ? `لديك حساب مبدع معتمد بالفعل (@${existingCreator.username}). يُمنع إنشاء حسابات متعددة.` 
          : `You already have an active creator profile (@${existingCreator.username}).`
      );
      onClose();
      navigate('/settings/creators-hub');
      return;
    }

    const cleanName = formData.name.trim();
    const cleanUsername = formData.username.trim().toLowerCase().replace('@', '');

    if (!cleanName || !cleanUsername) {
      toast.error(isAr ? 'يرجى إدخال الاسم واسم المستخدم.' : 'Please enter your name and handle.');
      return;
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      toast.error(isAr ? 'يجب أن يكون اسم المستخدم بين 3 و 30 حرفاً.' : 'Username must be between 3 and 30 characters.');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      toast.error(
        isAr 
          ? 'معرف البروفايل يمكن أن يحتوي على أحرف إنجليزية وأرقام وشرطة سفلية (_) فقط.' 
          : 'Username can only contain English letters, numbers, and underscores.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const createdCreator = await registerNewCreator({
        username: cleanUsername,
        name: cleanName,
        email: user?.email,
        roleAr: formData.roleAr,
        roleEn: formData.roleEn,
        bioAr: formData.bioAr,
        bioEn: formData.bioEn,
        socialLinks: formData.portfolioUrl ? { website: formData.portfolioUrl } : {}
      });

      try {
        localStorage.setItem('last_registered_creator_username', createdCreator.username);
      } catch (e) {}

      toast.success(
        isAr 
          ? `تهانينا! تم اعتماد حسابك كمبدع رسمياً (${createdCreator.name}). تم حجز مكافأة الترحيب وسيتم فك قفلها وتحويلها لمحفظتك فور نشر أول 10 قوالب احترافية!` 
          : `Congratulations! Certified as a Rinex Creator. Your welcome bonus is reserved and unlocks upon publishing your first 10 verified templates!`
      );

      onClose();
      // Navigate immediately to their newly created creator profile
      navigate(`/creator/${createdCreator.username.replace('@', '')}`);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('already have') || msg.includes('409') || msg.includes('مسجل بالفعل')) {
        toast.warning(isAr ? 'لديك حساب مبدع مسجل بالفعل ولا يمكن إنشاء حساب آخر.' : 'You already have an active creator profile.');
        onClose();
        navigate('/settings/creators-hub');
      } else {
        toast.error(err.message || (isAr ? 'عذراً، فشل تسجيل الحساب كمبدع' : 'Failed to register creator'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCategory = (cat: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat]
    }));
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in select-none h-screen w-screen overflow-hidden">
      <div className="relative w-full max-w-xl rounded-shape-xl bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header with gradient banner */}
        <div className="relative p-6 bg-gradient-to-r from-[var(--surface-subtle)] via-[color-mix(in_oklab,var(--accent)_10%,transparent)] to-[var(--surface-subtle)] border-b border-[var(--border-default)]">
          <button
            onClick={onClose}
            className="absolute top-4 end-4 w-8 h-8 rounded-shape-full bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-shape-md bg-gradient-to-tr from-[var(--accent)] to-purple-500 text-slate-950 flex items-center justify-center shadow-md shrink-0 font-black">
              <Award size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-[var(--text-primary)]">
                  {isAr ? 'الانضمام لنخبة صناع المحتوى في رينكس' : 'Join Rinex Creators Network'}
                </h3>
                <span className="px-2 py-0.5 rounded-shape-xs bg-[var(--bg-success-muted)] text-[var(--fg-success)] text-[10px] font-black font-mono border border-[color-mix(in_srgb,var(--fg-success)_30%,transparent)]">
                  PRO
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {isAr ? 'ابتكر قوالبك، شاركها مع ملايين المستخدمين، وابدأ جني الأرباح اليومية.' : 'Monetize your design templates and reach millions of creators.'}
              </p>
            </div>
          </div>
        </div>

        {/* Body: Either Already Registered Notice OR Multi-Step Registration Form */}
        {existingCreator ? (
          <div className="p-6 sm:p-8 space-y-6 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-shape-full bg-[var(--bg-success-muted)] text-[var(--fg-success)] flex items-center justify-center border-2 border-[color-mix(in_srgb,var(--fg-success)_30%,transparent)] shadow-lg">
              <CheckCircle2 size={36} className="stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-black text-[var(--text-primary)]">
                {isAr ? 'أنت مسجل بالفعل كصانع محتوى معتمد' : 'You are Already a Certified Creator'}
              </h4>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-shape-full bg-[var(--surface-subtle)] border border-[var(--border-default)]">
                <span className="text-xs font-mono font-bold text-[var(--accent)]">@{existingCreator.username}</span>
                <span className="text-xs text-[var(--text-secondary)]">({existingCreator.name})</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-md mx-auto pt-2">
                {isAr
                  ? 'وفقاً لسياسة المنصة، يُسمح بملف مبدع واحد فقط لكل مستخدم لضمان نزاهة نظام الأرباح والمكافآت السحابية. يمكنك إدارة قوالبك وتتبع أرباحك وعمولاتك مباشرة من لوحة التحكم.'
                  : 'Platform governance permits strictly one creator profile per user. You can manage your templates, royalties, and payouts from your creator dashboard.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[var(--border-default)]">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/settings/creators-hub');
                }}
                className="h-10 px-4 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer shadow-md"
              >
                <Coins size={14} />
                <span>{isAr ? 'لوحة تحكم الأرباح' : 'Creator Dashboard'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/creator/${existingCreator.username}`);
                }}
                className="h-10 px-4 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-default)] text-[var(--text-primary)] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <User size={14} />
                <span>{isAr ? 'عرض ملفي الشخصي' : 'View Public Profile'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Content form */
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
            
            {step === 1 ? (
              <div className="space-y-4">
              
              {/* Creator Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <User size={13} className="text-[var(--accent)]" />
                    <span>{isAr ? 'الاسم الكامل أو التجاري' : 'Creator Name'}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={isAr ? 'مثال: سارة العتيبي' : 'e.g. Sarah Al-Otaibi'}
                    className="w-full h-10 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] focus:border-[var(--accent)] text-xs font-bold outline-none text-[var(--text-primary)] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Sparkles size={13} className="text-purple-400" />
                    <span>{isAr ? 'معرّف البروفايل (Handle)' : 'Username (@handle)'}</span>
                  </label>
                  <div className="relative">
                    <span className="absolute start-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[var(--text-muted)]">@</span>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="username"
                      className="w-full h-10 ps-7 pe-3.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] focus:border-[var(--accent)] text-xs font-mono font-bold outline-none text-[var(--text-primary)] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Role Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Palette size={13} className="text-amber-400" />
                  <span>{isAr ? 'التخصص الإبداعي' : 'Specialization Role'}</span>
                </label>
                <input
                  type="text"
                  value={isAr ? formData.roleAr : formData.roleEn}
                  onChange={(e) => setFormData({ ...formData, roleAr: e.target.value, roleEn: e.target.value })}
                  placeholder={isAr ? 'مثال: مصمم قوالب سوشيال ميديا وموشن جرافيك' : 'e.g. Social Media & Motion Designer'}
                  className="w-full h-10 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] focus:border-[var(--accent)] text-xs font-bold outline-none text-[var(--text-primary)] transition-all"
                />
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-primary)]">
                  {isAr ? 'نبذة تعريفية مختصرة' : 'Short Bio'}
                </label>
                <textarea
                  rows={3}
                  value={isAr ? formData.bioAr : formData.bioEn}
                  onChange={(e) => setFormData({ ...formData, bioAr: e.target.value, bioEn: e.target.value })}
                  className="w-full p-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] focus:border-[var(--accent)] text-xs text-[var(--text-secondary)] outline-none leading-relaxed resize-none transition-all"
                />
              </div>

              {/* Portfolio Link */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Globe size={13} className="text-sky-400" />
                  <span>{isAr ? 'رابط معرض الأعمال (Behance / Portfolio)' : 'Portfolio Link'}</span>
                </label>
                <input
                  type="url"
                  value={formData.portfolioUrl}
                  onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                  placeholder="https://behance.net/yourprofile"
                  className="w-full h-10 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] focus:border-[var(--accent)] text-xs font-mono outline-none text-[var(--text-primary)] transition-all"
                />
              </div>

            </div>
          ) : (
            <div className="space-y-5">
              
              {/* Category Preferences */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-primary)]">
                  {isAr ? 'حدد الفئات التي تبدع في تقديم قوالبها:' : 'Select template categories you create:'}
                </label>
                
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'marketing', labelAr: 'بوسترات تسويقية', labelEn: 'Marketing Posters' },
                    { id: 'reels', labelAr: 'فيديو وريلز 9:16', labelEn: 'Vertical Video Reels' },
                    { id: 'story', labelAr: 'قصص واستوري', labelEn: 'Stories & Statuses' },
                    { id: 'social', labelAr: 'سوشيال ميديا وقنوات', labelEn: 'Social Media & Banners' }
                  ].map(cat => {
                    const isSelected = formData.categories.includes(cat.id);
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        className={`p-3 rounded-shape-md border text-start flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] border-[var(--accent)] text-[var(--accent)] font-bold'
                            : 'bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-accent)]'
                        }`}
                      >
                        <span className="text-xs">{isAr ? cat.labelAr : cat.labelEn}</span>
                        {isSelected && <CheckCircle2 size={14} className="text-[var(--accent)] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Monetization Perks summary */}
              <div className="p-4 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-default)] space-y-3">
                <h4 className="text-xs font-black text-[var(--text-primary)] flex items-center gap-1.5">
                  <Coins size={14} className="text-amber-500" />
                  <span>{isAr ? 'ميزات ونظام أرباح صانع محتوى استوديو رينكس في بيربليكستا:' : 'Rinex & Perplexta Creator Earnings & Perks:'}</span>
                </h4>
                
                <ul className="space-y-2 text-[11px] text-[var(--text-secondary)] font-medium">
                  <li className="flex items-center gap-2">
                    <Sparkles size={12} className="text-amber-500 shrink-0" />
                    <span>{isAr ? `مكافأة ترحيبية نقدية ($${economySettings?.creator_welcome_bonus_usd || 50}) تُحوّل تلقائياً لمحفظتك فور نشر أول ${economySettings?.creator_bonus_required_templates || 10} قوالب احترافية.` : `$${economySettings?.creator_welcome_bonus_usd || 50} welcome bonus credited to your wallet after publishing ${economySettings?.creator_bonus_required_templates || 10} verified pro templates.`}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap size={12} className="text-[var(--fg-success)] shrink-0" />
                    <span>{isAr ? `ربح عمولة فورية $${Number(economySettings?.creator_template_usage_royalty_usd ?? 0.15).toFixed(2)} عن كل مرة يتم فيها استخدام قالبه المجاني.` : `$${Number(economySettings?.creator_template_usage_royalty_usd ?? 0.15).toFixed(2)} commission per free template use.`}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap size={12} className="text-[var(--fg-success)] shrink-0" />
                    <span>{isAr ? `نسبة ${economySettings?.creator_pro_commission_percent ?? 70}% من أرباح القوالب المدفوعة والممتازة (Pro).` : `${economySettings?.creator_pro_commission_percent ?? 70}% revenue share on Pro paid templates.`}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck size={12} className="text-sky-500 shrink-0" />
                    <span>{isAr ? 'توثيق الحساب بالشارة وتوفير رابط خاص perplexta.com/creator/@username' : 'Verified badge & custom vanity link perplexta.com/creator/@username.'}</span>
                  </li>
                </ul>
              </div>

            </div>
          )}

          {/* Modal Action Footer Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border-default)]">
            {step === 2 ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-10 px-4 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] font-bold text-xs flex items-center gap-1.5 hover:bg-[var(--surface-inset)] cursor-pointer"
              >
                {isAr ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                <span>{isAr ? 'السابق' : 'Back'}</span>
              </button>
            ) : (
              <div />
            )}

            {step === 1 ? (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="h-10 px-5 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-bold text-xs flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer shadow-md ms-auto"
              >
                <span>{isAr ? 'المتابعة للخطوة التالية' : 'Next Step'}</span>
                {isAr ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
              </button>
            ) : (
              <button
                type="submit"
                className="h-10 px-6 rounded-shape-sm bg-gradient-to-r from-[var(--accent)] to-purple-600 text-slate-950 font-black text-xs flex items-center gap-2 hover:brightness-110 transition-all cursor-pointer shadow-lg active:scale-95 ms-auto"
              >
                <Award size={15} />
                <span>{isAr ? 'اعتماد الحساب وبدء الربح الآن' : 'Certify & Activate Profile'}</span>
              </button>
            )}
          </div>

        </form>
        )}

      </div>
    </div>,
    document.body
  );
};

