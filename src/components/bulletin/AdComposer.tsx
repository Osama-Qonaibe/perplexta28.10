import React from 'react';
import { Radio, Video, Clapperboard, Sparkles } from 'lucide-react';
import { BulletinAvatar } from '../BulletinAvatar';
import { toast } from '@/design-system';

export interface AdComposerProps {
  user: any;
  token: string | null;
  isRtl: boolean;
  setIsAdModalOpen: (open: boolean) => void;
  setIsStreamSetupOpen: (open: boolean) => void;
  openPostUploadModal: () => void;
  openReelUploadModal: () => void;
  openStudioModal?: () => void;
}

export const AdComposer: React.FC<AdComposerProps> = ({
  user,
  token,
  isRtl,
  setIsAdModalOpen,
  setIsStreamSetupOpen,
  openPostUploadModal,
  openReelUploadModal,
  openStudioModal
}) => {
  return (
    <div className="p-2.5 sm:p-4 bg-[var(--surface-card)] rounded-shape-md border border-[var(--border-default)] shadow-xs flex flex-col gap-2 sm:gap-3 w-full">
      <div className="flex items-center gap-2 sm:gap-2.5 w-full">
        <BulletinAvatar
          src={user?.avatar}
          alt={user?.name || 'User'}
          size="sm"
        />
        <button
          type="button"
          onClick={() => {
            if (!token) {
              toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
              return;
            }
            setIsAdModalOpen(true);
          }}
          className="flex-1 min-w-0 text-start px-3 h-8 min-h-[32px] max-h-[32px] rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] text-xs text-[var(--text-muted)] font-medium transition-all duration-fast border border-[var(--border-default)] hover:border-accent/40 cursor-pointer truncate flex items-center shadow-2xs active:scale-[0.99]"
        >
          <span className="h-[23px] leading-[23px] inline-flex items-center truncate">
            {isRtl ? 'بم تفكر اليوم؟' : "What's on your mind?"}
          </span>
        </button>
      </div>

      <div className="flex items-center justify-around border-t border-[var(--border-default)] pt-1.5 sm:pt-2.5 text-xs text-[var(--text-muted)] gap-1 sm:gap-2 w-full">
        <button
          type="button"
          onClick={() => {
            if (!token) {
              toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
              return;
            }
            setIsStreamSetupOpen(true);
          }}
          className="flex-1 h-8 min-h-[32px] max-h-[32px] flex items-center justify-center gap-1.5 px-2 rounded-shape-sm hover:bg-rose-500/10 font-bold transition-all duration-fast text-rose-500 whitespace-nowrap cursor-pointer shadow-2xs active:scale-95 touch-target-44-expanded"
        >
          <Radio size={13} className="text-rose-500 shrink-0" />
          <span className="h-[23px] leading-[23px] inline-flex items-center truncate">
            {isRtl ? 'بث مباشر' : 'Live'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (!token) {
              toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
              return;
            }
            openPostUploadModal();
          }}
          className="flex-1 h-8 min-h-[32px] max-h-[32px] flex items-center justify-center gap-1.5 px-2 rounded-shape-sm hover:bg-accent/10 font-bold transition-all duration-fast text-accent whitespace-nowrap cursor-pointer shadow-2xs active:scale-95 touch-target-44-expanded"
        >
          <Video size={13} className="text-accent shrink-0" />
          <span className="h-[23px] leading-[23px] inline-flex items-center truncate">
            {isRtl ? 'فيديو/صورة' : 'Media'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (!token) {
              toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
              return;
            }
            openReelUploadModal();
          }}
          className="flex-1 h-8 min-h-[32px] max-h-[32px] flex items-center justify-center gap-1.5 px-2 rounded-shape-sm hover:bg-purple-500/10 font-bold transition-all duration-fast text-purple-500 whitespace-nowrap cursor-pointer shadow-2xs active:scale-95 touch-target-44-expanded"
        >
          <Clapperboard size={13} className="text-purple-500 shrink-0" />
          <span className="h-[23px] leading-[23px] inline-flex items-center truncate">
            {isRtl ? 'ريلز' : 'Reel'}
          </span>
        </button>
      </div>
    </div>
  );
};
