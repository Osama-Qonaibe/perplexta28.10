import React, { useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { DARK_MODE, LIGHT_MODE } from '../../constants/brand';

/**
 * PWAMetaSync Component
 * 
 * Dynamically injects and updates meta tags for PWA compliance and native-like feel
 * on iOS and Android platforms based on the current theme and brand identity.
 */
export const PWAMetaSync: React.FC = () => {
  const { theme, siteSettings } = useAppContext();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isDark =
      theme === 'dark' ||
      (theme === 'system' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    // 1. Resolve effective colors from theme or brand constants
    const themeColor = isDark ? DARK_MODE.surface.page : LIGHT_MODE.surface.page;
    const tileColor = isDark ? DARK_MODE.surface.page : LIGHT_MODE.surface.page;
    
    // Status bar style: 
    // - 'default': white background with dark text (on iOS)
    // - 'black': black background with white text
    // - 'black-translucent': transparent background (content goes behind status bar)
    const iosStatusBarStyle = isDark ? 'black-translucent' : 'default';

    const updateMeta = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Update Theme Color (Android & general PWA)
    updateMeta('theme-color', themeColor);
    
    // Update iOS specific meta tags
    updateMeta('apple-mobile-web-app-status-bar-style', iosStatusBarStyle);
    updateMeta('apple-mobile-web-app-capable', 'yes');
    
    // Update App Title from settings if available
    const appName = siteSettings?.siteName || 'Perplexta';
    updateMeta('apple-mobile-web-app-title', appName);
    updateMeta('application-name', appName);

    // 2. Handle Localized & Theme-aware Manifest
    // Force browser to see the localized/theme-aware manifest by adding params
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      const currentLang = localStorage.getItem('language') || 'en';
      const currentTheme = isDark ? 'dark' : 'light';
      manifestLink.setAttribute('href', `/manifest.json?lang=${currentLang}&theme=${currentTheme}`);
    }

  }, [theme, siteSettings]);

  return null;
};
