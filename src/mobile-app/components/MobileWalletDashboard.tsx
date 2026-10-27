import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  RefreshCcw, 
  ShieldCheck,
  History,
  Lock,
  ChevronRight,
  Plus
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { triggerHaptic } from '../../utils/haptics';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'usage' | 'reward';
  amount: number;
  currency: 'USD' | 'POINTS';
  status: 'completed' | 'pending' | 'failed';
  description: string;
  date: string;
}

export const MobileWalletDashboard: React.FC = () => {
  const { user, theme, dir, language } = useAppContext();
  const isRtl = dir === 'rtl';
  const [activeTab, setActiveTab] = useState<'balance' | 'history'>('balance');

  // Mock data for the demonstration of the "Professional Elite" design
  const transactions: Transaction[] = [
    { id: '1', type: 'reward', amount: 50.00, currency: 'USD', status: 'completed', description: isRtl ? 'مكافأة ترحيبية للمبدعين' : 'Creator Welcome Bonus', date: '2024-03-20T10:00:00Z' },
    { id: '2', type: 'usage', amount: -0.15, currency: 'USD', status: 'completed', description: isRtl ? 'استخدام نموذج Pro' : 'Pro Model Usage', date: '2024-03-19T14:30:00Z' },
    { id: '3', type: 'deposit', amount: 10.00, currency: 'USD', status: 'completed', description: isRtl ? 'شحن رصيد' : 'Wallet Top-up', date: '2024-03-18T09:15:00Z' },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Balanced Card - Elite Design */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-500/20">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-black/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
              <ShieldCheck size={14} className="text-blue-100" />
              <span className="text-[10px] font-bold tracking-widest uppercase">{isRtl ? 'رصيد محمي' : 'SECURE BALANCE'}</span>
            </div>
            <Wallet size={20} className="text-blue-200" />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-blue-100 text-xs font-medium opacity-80">
              {isRtl ? 'إجمالي الرصيد القابل للاستخدام' : 'Total Available Balance'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black tracking-tighter">
                ${(user?.balance || 0).toFixed(2)}
              </span>
              <span className="text-blue-200 text-sm font-bold uppercase tracking-widest">USD</span>
            </div>
          </div>

          <div className="h-px w-full bg-white/10 my-1" />

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">{isRtl ? 'النقاط' : 'POINTS'}</span>
              <span className="text-lg font-bold">{user?.points || 0}</span>
            </div>
            <button 
              onClick={() => triggerHaptic('medium')}
              className="flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-xl font-black text-sm active:scale-95 transition-transform shadow-lg shadow-black/10"
            >
              <Plus size={16} />
              <span>{isRtl ? 'شحن الرصيد' : 'Top Up'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={() => triggerHaptic('light')}
          className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-main)] active:bg-[var(--surface-subtle)] transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <ArrowDownLeft size={20} />
          </div>
          <span className="text-xs font-bold text-[var(--text-primary)]">{isRtl ? 'إيداع' : 'Deposit'}</span>
        </button>

        <button 
          onClick={() => triggerHaptic('light')}
          className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-main)] active:bg-[var(--surface-subtle)] transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <ArrowUpRight size={20} />
          </div>
          <span className="text-xs font-bold text-[var(--text-primary)]">{isRtl ? 'سحب' : 'Withdraw'}</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-main)] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
            <TrendingUp size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[var(--text-primary)]">{isRtl ? 'معدل النمو' : 'Growth Rate'}</span>
            <span className="text-[10px] text-[var(--text-muted)]">{isRtl ? 'آخر 30 يوم' : 'Last 30 days'}</span>
          </div>
        </div>
        <span className="text-emerald-500 font-bold">+12.4%</span>
      </div>

      {/* Recent Transactions */}
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black text-[var(--text-primary)]">{isRtl ? 'العمليات الأخيرة' : 'Recent Activity'}</h3>
          <button className="text-xs font-bold text-blue-500 active:opacity-60">{isRtl ? 'عرض الكل' : 'See All'}</button>
        </div>

        <div className="flex flex-col gap-2">
          {transactions.map((tx) => (
            <div 
              key={tx.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-main)] active:bg-[var(--surface-subtle)] transition-colors"
              onClick={() => triggerHaptic('light')}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.type === 'reward' ? 'bg-emerald-500/10 text-emerald-500' :
                  tx.type === 'usage' ? 'bg-orange-500/10 text-orange-500' :
                  'bg-blue-500/10 text-blue-500'
                }`}>
                  {tx.type === 'reward' ? <CreditCard size={18} /> :
                   tx.type === 'usage' ? <RefreshCcw size={18} /> :
                   <ArrowDownLeft size={18} />}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[var(--text-primary)]">{tx.description}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {new Date(tx.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-xs font-black ${tx.amount > 0 ? 'text-emerald-500' : 'text-[var(--text-primary)]'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                </span>
                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">{tx.currency}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Banner */}
      <div className="mt-4 p-4 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-main)] border-dashed flex items-start gap-3">
        <Lock size={16} className="text-[var(--text-muted)] mt-0.5" />
        <p className="text-[10px] leading-relaxed text-[var(--text-muted)]">
          {isRtl 
            ? 'تستخدم محفظة بيربليكستا تقنية التشفير من طرف إلى طرف. جميع المعاملات المالية مسجلة في سجل محاسبي غير قابل للتغيير لضمان أقصى درجات الأمان.'
            : 'Perplexta Wallet uses end-to-end encryption. All financial transactions are recorded on an immutable ledger to ensure maximum security and transparency.'}
        </p>
      </div>
    </div>
  );
};
