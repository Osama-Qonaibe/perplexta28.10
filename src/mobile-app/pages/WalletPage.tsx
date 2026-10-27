import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileWalletDashboard } from '../components/MobileWalletDashboard';
import { useAppContext } from '../../context/AppContext';
import { ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

export const MobileWalletPage: React.FC = () => {
  const { theme, dir } = useAppContext();
  const navigate = useNavigate();
  const isRtl = dir === 'rtl';

  return (
    <div className="flex flex-col min-h-screen bg-[var(--surface-page)] pb-24">
      {/* Native-style Mobile Header */}
      <div className="sticky top-0 z-50 w-full h-14 px-4 flex items-center justify-between bg-[var(--surface-page)]/95 backdrop-blur-md border-b border-[var(--border-main)] pt-[env(safe-area-inset-top,0px)]">
        <button
          onClick={() => {
            triggerHaptic('light');
            navigate(-1);
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-primary)] active:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
        >
          {isRtl ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </button>
        
        <div className="flex flex-col items-center">
          <h1 className="text-sm font-black tracking-tight text-[var(--text-primary)] uppercase">
            {isRtl ? 'المحفظة الرقمية' : 'Digital Wallet'}
          </h1>
          <div className="flex items-center gap-1 text-[8px] font-black text-[var(--fg-success)] uppercase tracking-[0.2em]">
            <ShieldCheck size={10} strokeWidth={3} />
            <span>{isRtl ? 'اتصال مشفر' : 'SECURE CORE'}</span>
          </div>
        </div>

        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Main Wallet Content */}
      <div className="flex-1 p-4 max-w-lg mx-auto w-full">
        <MobileWalletDashboard />
      </div>
    </div>
  );
};
