import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { 
  Wallet, Shield, Bell, Languages, Moon, Sun, 
  LogOut, ChevronLeft, ChevronRight, User, Award, 
  Clock, CreditCard, HelpCircle, ExternalLink, Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { triggerHaptic } from '../../utils/haptics';

export const MobileProfilePage: React.FC = () => {
  const { user, logout, theme, setTheme, language, setLanguage, t, dir } = useAppContext();
  const navigate = useNavigate();
  const isRtl = dir === 'rtl';

  if (!user) return null;

  const menuGroups = [
    {
      title: isRtl ? 'المالية والاشتراكات' : 'Finance & Subscriptions',
      items: [
        { id: 'wallet', icon: <Wallet size={20} className="text-emerald-500" />, label: isRtl ? 'المحفظة الرقمية' : 'Digital Wallet', path: '/wallet' },
        { id: 'subscription', icon: <CreditCard size={20} className="text-blue-500" />, label: isRtl ? 'إدارة الاشتراك' : 'Manage Subscription', path: '/subscription' },
        { id: 'rewards', icon: <Award size={20} className="text-amber-500" />, label: isRtl ? 'المكافآت والنقاط' : 'Rewards & Points', path: '/rewards' },
      ]
    },
    {
      title: isRtl ? 'تفضيلات النظام' : 'System Preferences',
      items: [
        { 
          id: 'theme', 
          icon: theme === 'dark' ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-400" />, 
          label: isRtl ? 'المظهر (داكن/فاتح)' : 'Appearance (Dark/Light)', 
          onClick: () => setTheme(theme === 'dark' ? 'light' : 'dark') 
        },
        { 
          id: 'language', 
          icon: <Languages size={20} className="text-purple-500" />, 
          label: isRtl ? 'تغيير اللغة' : 'Change Language', 
          onClick: () => setLanguage(language === 'ar' ? 'en' : 'ar') 
        },
        { id: 'notifications', icon: <Bell size={20} className="text-rose-500" />, label: isRtl ? 'الإشعارات' : 'Notifications', path: '/settings/account' },
      ]
    },
    {
      title: isRtl ? 'الدعم والمساعدة' : 'Support & Help',
      items: [
        { id: 'about', icon: <HelpCircle size={20} className="text-slate-400" />, label: isRtl ? 'عن المنصة' : 'About Platform', path: '/about' },
        { id: 'terms', icon: <Shield size={20} className="text-slate-400" />, label: isRtl ? 'شروط الخدمة' : 'Terms of Service', path: '/terms' },
      ]
    }
  ];

  return (
    <div className="flex flex-col min-h-full bg-[var(--surface-subtle)] pb-20">
      {/* 1. Profile Header Hero */}
      <div className="bg-[var(--surface-card)] px-6 pt-12 pb-8 border-b border-[var(--border-default)] shadow-sm">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-accent/20 to-accent/5 border-2 border-accent/30 flex items-center justify-center overflow-hidden shadow-xl">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <User size={48} className="text-accent" />
              )}
            </div>
            {user.subscription?.status === 'active' && (
              <div className="absolute -bottom-1 -right-1 bg-accent text-white p-1.5 rounded-full border-4 border-[var(--surface-card)] shadow-lg">
                <Sparkles size={14} />
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            <h1 className="text-xl font-black text-[var(--text-primary)] tracking-tight">
              {user.name || 'User'}
            </h1>
            <p className="text-xs font-bold text-[var(--text-muted)] opacity-70">
              {user.email}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-wider">
            {user.role === 'admin' ? (isRtl ? 'مسؤول النظام' : 'System Admin') : (isRtl ? 'عضو نخبة' : 'Elite Member')}
          </div>
        </div>
      </div>

      {/* 2. Menu Navigation Tiles */}
      <div className="p-4 space-y-6">
        {menuGroups.map((group, gIdx) => (
          <div key={`group-${gIdx}`} className="space-y-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] px-2">
              {group.title}
            </h3>
            <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-default)] divide-y divide-[var(--border-default)] overflow-hidden shadow-2xs">
              {group.items.map((item, iIdx) => (
                <button
                  key={`item-${iIdx}`}
                  onClick={() => {
                    triggerHaptic('selection');
                    if (item.onClick) item.onClick();
                    else if (item.path) navigate(item.path);
                  }}
                  className="w-full flex items-center justify-between px-4 py-4 active:bg-[var(--surface-subtle)] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] flex items-center justify-center transition-transform group-active:scale-90">
                      {item.icon}
                    </div>
                    <span className="text-sm font-bold text-[var(--text-primary)]">
                      {item.label}
                    </span>
                  </div>
                  {isRtl ? <ChevronLeft size={18} className="text-[var(--text-muted)]" /> : <ChevronRight size={18} className="text-[var(--text-muted)]" />}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* 3. Logout Action */}
        <button
          onClick={() => {
            triggerHaptic('medium');
            logout();
          }}
          className="w-full mt-4 flex items-center justify-center gap-2 py-4 rounded-[var(--radius-lg)] bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold text-sm shadow-2xs active:bg-rose-500/20 active:scale-[0.98] transition-all cursor-pointer"
        >
          <LogOut size={18} />
          <span>{isRtl ? 'تسجيل الخروج من المنصة' : 'Logout from Platform'}</span>
        </button>

        <div className="text-center pt-4 pb-8 space-y-1">
          <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-40">
            Perplexta Mobile v1.0.0
          </p>
          <p className="text-[8px] font-medium text-[var(--text-muted)] opacity-30">
            Secure Native Handshake Enabled
          </p>
        </div>
      </div>
    </div>
  );
};
