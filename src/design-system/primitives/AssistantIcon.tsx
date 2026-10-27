/**
 * 🏛️ PERPLEXTA DESIGN SYSTEM — ASSISTANT ICON PRIMITIVE
 * 
 * Branded AI assistant icon with spin state, directional awareness,
 * and seamless theme integration using the real logo from site settings/control panel.
 */

import React from 'react';
import { Cpu } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { resolveImageUrl } from '../../utils/imageResolver';
import { NotificationIconRenderer } from '../../utils/imageProcessor';

export interface AssistantIconProps {
  size?: number;
  isSpinning?: boolean;
  dir?: 'ltr' | 'rtl';
  className?: string;
  fallbackType?: 'cpu' | 'sparkles';
  shape?: 'circle' | 'square';
  spinDirection?: 'normal' | 'reverse';
}

const PerplextaBrandAiMark: React.FC<{ size: number; className?: string }> = ({ size, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    style={{ width: `${size}px`, height: `${size}px`, maxWidth: `${size}px`, maxHeight: `${size}px` }}
  >
    <path
      d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z"
      fill="currentColor"
      fillOpacity="0.15"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 7L13.2 10.8L17 12L13.2 13.2L12 17L10.8 13.2L7 12L10.8 10.8L12 7Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const AssistantIcon: React.FC<AssistantIconProps> = ({
  size = 22,
  isSpinning = false,
  dir = 'ltr',
  className = '',
  fallbackType = 'sparkles',
  shape = 'square',
  spinDirection = 'normal',
}) => {
  const { siteSettings, theme, language } = useAppContext();
  const isRtl = language === 'ar';

  const settingsAny = siteSettings as any;
  const rawLogo = (theme === 'light' && siteSettings?.logoLightBase64) 
    ? siteSettings?.logoLightBase64 
    : (siteSettings?.logoBase64 || settingsAny?.logoUrl || settingsAny?.siteLogo || settingsAny?.appLogo || siteSettings?.seoImageUrl);
  const logoUrl = rawLogo ? resolveImageUrl(rawLogo, 'general') : null;
  const displayName = isRtl 
    ? (siteSettings?.siteNameAr || siteSettings?.siteName || 'بيربليكستا') 
    : (siteSettings?.siteName || 'Perplexta');

  const spinClass = isSpinning 
    ? (spinDirection === 'reverse' ? 'animate-spin-reverse' : 'animate-spin') 
    : '';

  const fallback = fallbackType === 'cpu' ? (
    <Cpu
      size={size}
      className={`shrink-0 transition-transform ${spinClass}`}
    />
  ) : (
    <PerplextaBrandAiMark
      size={size}
      className={`shrink-0 transition-transform ${spinClass}`}
    />
  );

  const radiusClass = shape === 'circle' ? 'rounded-full' : 'rounded-shape-sm';

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: `${size}px`, height: `${size}px`, maxWidth: `${size}px`, maxHeight: `${size}px` }}
      dir={dir}
    >
      {logoUrl ? (
        <div 
          className={`${radiusClass} overflow-hidden flex items-center justify-center shrink-0 transition-transform ${spinClass}`}
          style={{ width: `${size}px`, height: `${size}px`, maxWidth: `${size}px`, maxHeight: `${size}px` }}
        >
          <NotificationIconRenderer
            src={logoUrl}
            alt={displayName}
            size={size}
            className="w-full h-full object-contain block max-w-full max-h-full"
            fallbackIcon={fallback}
          />
        </div>
      ) : (
        fallback
      )}
    </span>
  );
};
