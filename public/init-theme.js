(function() {
  try {
    var savedLang = localStorage.getItem('language') || 'en';
    document.documentElement.setAttribute('lang', savedLang);
    document.documentElement.setAttribute('dir', savedLang === 'ar' ? 'rtl' : 'ltr');
    document.title = savedLang === 'ar' ? 'بيربليكستا - منصة التحليل والذكاء الاصطناعي الفاخر والمستقل' : 'Perplexta Platform - Professional Elite AI Platform';

    // Typography is authoritatively handled by index.html preconnect and stylesheet links

    var savedTheme = localStorage.getItem('perplexta_theme') || localStorage.getItem('theme');
    var isDark = false;
    if (savedTheme === 'dark') {
      isDark = true;
    } else if (savedTheme === 'light') {
      isDark = false;
    } else {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    var meta = document.getElementById('theme-color-meta');
    var root = document.documentElement;
    
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      root.style.setProperty('--pwa-theme-color', '#0d1117');
      root.style.setProperty('--pwa-bg-color', '#0d1117');
      if (meta) meta.setAttribute('content', '#0d1117');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.setProperty('--pwa-theme-color', '#f8fafc');
      root.style.setProperty('--pwa-bg-color', '#f8fafc');
      if (meta) meta.setAttribute('content', '#f8fafc');
    }
  } catch (e) {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
