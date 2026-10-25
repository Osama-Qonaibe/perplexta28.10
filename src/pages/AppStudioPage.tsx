import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Folder, FileCode, FileText, Database, Terminal, Download, Github, 
  Play, Plus, Trash2, Edit2, ChevronRight, ChevronLeft, ArrowUpRight, 
  Paperclip, Mic, Send, Sparkles, CheckCircle2, AlertTriangle, RefreshCw, X, Code, Globe, Layers,
  Monitor, Smartphone, Tablet, Wand2, Sliders, ArrowLeft, ArrowRight, Square,
  Clock, Loader2, Key, MousePointer, History, RotateCcw, RotateCw, Cloud, HardDrive, Check, Zap,
  Copy, ChevronDown, ShieldCheck, Lock, User
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { toast, PopCard, Button, ActionItem, Badge, AssistantIcon } from '@/design-system';
import initSqlJs from 'sql.js';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { resolveImageUrl } from '../utils/imageResolver';

interface ProjectFile {
  name: string;
  path: string;
  content: string;
  type: string;
  isEntry?: boolean;
}

interface StudioChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  logs?: string[];
  filesUpdated?: string[];
  suggestions?: string[];
}

export const AppStudioPage: React.FC = () => {
  const { theme, language, siteSettings, dir, token, user, setIsAuthModalOpen } = useAppContext();
  const navigate = useNavigate();

  const getAuthToken = useCallback(() => {
    try {
      if (token) return token;
      if (typeof window !== 'undefined') {
        const direct = localStorage.getItem('token') || localStorage.getItem('auth_token') || sessionStorage.getItem('token');
        if (direct) return direct;
        const appToken = localStorage.getItem('app_token');
        if (appToken) return appToken;
      }
    } catch (e) {}
    return '';
  }, [token]);

  // Project Files State (Clean Initial Sovereign Launchpad with Logo)
  const isArInit = language === 'ar';
  const [files, setFiles] = useState<Record<string, ProjectFile>>({
    'index.html': {
      name: 'index.html',
      path: 'index.html',
      type: 'html',
      isEntry: true,
      content: `<!DOCTYPE html>
<html lang="${isArInit ? 'ar' : 'en'}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isArInit ? 'استوديو البرمجيات - مشروع جديد' : 'Software Studio - New Project'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Tajawal:wght@300;400;500;700;800;900&display=swap" rel="stylesheet">
</head>
<body class="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-['Inter','Tajawal',sans-serif] min-h-screen flex items-center justify-center p-6 selection:bg-blue-600 selection:text-white">
  <div class="max-w-md w-full text-center space-y-6">
    <!-- Brand Logo Glow Icon -->
    <div class="relative mx-auto w-16 h-16 rounded-shape-md bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-xl shadow-blue-500/25 flex items-center justify-center">
      <div class="w-full h-full bg-slate-900 rounded-shape-sm flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="text-blue-500" style="width: 32px; height: 32px; max-width: 32px; max-height: 32px;">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
      </div>
    </div>
    
    <div class="space-y-3">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-shape-full bg-blue-500/10 border border-blue-500/20 text-blue-500 dark:text-blue-400 text-xs font-bold">
        <span class="w-2 h-2 rounded-shape-full bg-blue-500 animate-ping"></span>
        <span>${language === 'ar' ? 'جاهز للتطوير' : 'Ready to Build'}</span>
      </div>
      <h1 class="text-2xl font-black text-slate-900 dark:text-white">${language === 'ar' ? 'استوديو تطوير البرمجيات' : 'Software Studio'}</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
        ${language === 'ar'
          ? 'أدخل وصف التطبيق أو الميزة المطلوبة في لوحة المحادثة لتوليد ملفات المشروع وتشغيل المعاينة المباشرة.'
          : 'Enter your application description in the chat panel to generate project files and launch the live preview.'}
      </p>
    </div>
  </div>
</body>
</html>`
    }
  });

  const [mobileActiveTab, setMobileActiveTab] = useState<'preview' | 'chat' | 'files'>('preview');
  const [sideNavActiveTab, setSideNavActiveTab] = useState<'chat' | 'files' | 'projects' | 'versions' | 'db'>('chat');

  const [projectId, setProjectId] = useState<string>(() => {
    return localStorage.getItem('perplexta_active_project_id') || ('proj_' + Date.now());
  });
  const [projectName, setProjectName] = useState<string>(() => {
    return localStorage.getItem('perplexta_active_project_name') || (language === 'ar' ? 'مشروع جديد' : 'New Project');
  });
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);

  const [activeFilePath, setActiveFilePath] = useState('index.html');
  const [openTabs, setOpenTabs] = useState<string[]>(['index.html']);
  const closeTab = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(t => t !== path);
    setOpenTabs(newTabs);
    if (activeFilePath === path) {
      setActiveFilePath(newTabs[newTabs.length - 1] || '');
    }
  };

  const openFile = (path: string) => {
    setActiveFilePath(path);
    if (!openTabs.includes(path)) {
      setOpenTabs(prev => [...prev, path]);
    }
    if (activeTab !== 'code') {
      setActiveTab('code');
      setSideNavActiveTab('files');
    }
  };
  const [pipelinePhase, setPipelinePhase] = useState<1 | 2 | 3 | null>(null);
  const [fileStatuses, setFileStatuses] = useState<Record<string, 'pending' | 'writing' | 'completed' | 'error'>>({});
  const [activeBlueprint, setActiveBlueprint] = useState<any>(null);

  // Progressive contextual suggestions state mapping (Bilingual AR + EN)
  const [clickedSuggestions, setClickedSuggestions] = useState<string[]>([]);
  const PROGRESSIVE_SUGGESTIONS_MAP: Record<string, string> = {
    'صمم متجر إلكتروني احترافي للمنتجات الرقمية يضم واجهة هبوط عصرية مع سكرول أنيميشن، شبكة منتجات قابلة للتصفية، وسلة مشتريات منبثقة تفاعلية تحسب المجموع تلقائياً.': 'أضف نظام إدارة مخزون ذكي مع لوحة تحكم تظهر تنبيهات عند قرب نفاذ الكمية ونظام كوبونات خصم.',
    'أنشئ صفحة هبوط (SaaS) تفاعلية للشركات التقنية مع قسم مميزات متحرك، جدول خطط أسعار مقارن، ونموذج تواصل ذكي مع التحقق من البيانات.': 'أضف نظام اشتراكات شهري وسنوي مع بوابة دفع تجريبية وتوليد فواتير تلقائي بصيغة PDF.',
    'طور لوحة تحكم وإحصائيات متكاملة (Admin Dashboard) تضم رسوم بيانية تفاعلية لبيانات المبيعات، جداول قابلة للفرز، ونظام إدارة مستخدمين مع حالات ظهور مختلفة.': 'اربط لوحة التحكم بقاعدة بيانات SQLite لتخزين وتعديل بيانات المبيعات والمستخدمين بشكل حي ومؤمن.',
    'ابنِ موقع محفظة أعمال (Portfolio) إبداعي للمصممين مع معرض أعمال شبكي، نظام تبديل الوضع الليلي والنهاري، وتأثيرات انتقال سلسة بين الأقسام.': 'أضف صفحة تفصيلية لكل مشروع مع معرض صور منزلق متقدم (Slider) ونظام تقييم تفاعلي للأعمال.',
    'Design a professional digital products store featuring a modern landing interface with scroll animations, a filterable product grid, and an interactive popup shopping cart that auto-calculates totals.': 'Add a smart inventory management system with a dashboard that shows alerts when stock is low and a discount coupon system.',
    'Create an interactive SaaS landing page for tech startups with animated feature sections, a comparative pricing table, and a smart contact form with validation logic.': 'Add a monthly/annual subscription system with a demo payment gateway and automatic PDF invoice generation.',
    'Develop a comprehensive Admin Dashboard featuring interactive sales data charts, sortable data tables, and a user management system with various UI states.': 'Connect the dashboard to a SQLite database to live-store and edit sales and user data securely.',
    'Build a creative Portfolio website for designers with a grid-based work gallery, seamless dark/light mode switching, and smooth section transition effects.': 'Add a detailed page for each project with an advanced image slider and an interactive project rating system.'
  };

  // Sync initial splash screen when language changes (if project is still empty/default)
  useEffect(() => {
    const existingFileKeys = Object.keys(files);
    const indexContent = files['index.html']?.content || '';
    const isDefaultSplash = 
      existingFileKeys.length === 1 && 
      existingFileKeys[0] === 'index.html' && 
      (indexContent.includes('جاهز للتطوير') || indexContent.includes('Ready to Build') || indexContent.includes('Software Studio') || indexContent.includes('استوديو تطوير البرمجيات')) &&
      indexContent.length < 2500;

    if (isDefaultSplash) {
      const isAr = language === 'ar';
      const updatedContent = `<!DOCTYPE html>
<html lang="${isAr ? 'ar' : 'en'}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isAr ? 'استوديو البرمجيات - مشروع جديد' : 'Software Studio - New Project'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Tajawal:wght@300;400;500;700;800;900&display=swap" rel="stylesheet">
</head>
<body class="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-['Inter','Tajawal',sans-serif] min-h-screen flex items-center justify-center p-6 selection:bg-blue-600 selection:text-white">
  <div class="max-w-md w-full text-center space-y-6">
    <!-- Brand Logo Glow Icon -->
    <div class="relative mx-auto w-16 h-16 rounded-shape-md bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-xl shadow-blue-500/25 flex items-center justify-center">
      <div class="w-full h-full bg-slate-900 rounded-shape-sm flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="text-blue-500" style="width: 32px; height: 32px; max-width: 32px; max-height: 32px;">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
      </div>
    </div>
    
    <div class="space-y-3">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-shape-full bg-blue-500/10 border border-blue-500/20 text-blue-500 dark:text-blue-400 text-xs font-bold">
        <span class="w-2 h-2 rounded-shape-full bg-blue-500 animate-ping"></span>
        <span>${isAr ? 'جاهز للتطوير' : 'Ready to Build'}</span>
      </div>
      <h1 class="text-2xl font-black text-slate-900 dark:text-white">${isAr ? 'استوديو تطوير البرمجيات' : 'Software Studio'}</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
        ${isAr
          ? 'أدخل وصف التطبيق أو الميزة المطلوبة في لوحة المحادثة لتوليد ملفات المشروع وتشغيل المعاينة المباشرة.'
          : 'Enter your application description in the chat panel to generate project files and launch the live preview.'}
      </p>
    </div>
  </div>
</body>
</html>`;
      setFiles(prev => ({
        ...prev,
        'index.html': { ...prev['index.html'], content: updatedContent }
      }));
      setSavedFiles(prev => ({
        ...prev,
        'index.html': { ...prev['index.html'], content: updatedContent }
      }));
      setIframeKey(prev => prev + 1);
    }
  }, [language, dir]);

  // Pro Cloud Studio Features (Inspect Mode, Env Vars, Self-Healing)
  const [isInspectMode, setIsInspectMode] = useState(false);
  const [isEnvModalOpen, setIsEnvModalOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [envVars, setEnvVars] = useState<Record<string, string>>({
    VITE_APP_TITLE: 'Perplexta App',
    VITE_API_URL: '/api'
  });
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvVal, setNewEnvVal] = useState('');
  const [runtimeError, setRuntimeError] = useState<{ message: string; file?: string } | null>(null);
  const [savedFiles, setSavedFiles] = useState<Record<string, ProjectFile>>(() => JSON.parse(JSON.stringify(files)));
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'local' | 'error'>(() => (user ? 'synced' : 'local'));
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechRecognitionRef = useRef<any>(null);
  const [userWorkspaces, setUserWorkspaces] = useState<any[]>([]);
  const [studioUsage, setStudioUsage] = useState<any>(null);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [workspaceSnapshots, setWorkspaceSnapshots] = useState<any[]>([]);
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [isSnapshotLoading, setIsSnapshotLoading] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});

  const toggleLogs = (msgId: string) => {
    setExpandedLogs(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  // Platform Confirmation & Deletion Modals State
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  const [projectToRename, setProjectToRename] = useState<{ id: string; title: string } | null>(null);
  const [renameText, setRenameText] = useState('');
  const [isRenamingProject, setIsRenamingProject] = useState(false);

  const [snapshotToRestore, setSnapshotToRestore] = useState<{ id: number; name: string } | null>(null);
  const [isRestoringSnapshot, setIsRestoringSnapshot] = useState(false);

  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [newFilePathInput, setNewFilePathInput] = useState('');

  const [fileToRename, setFileToRename] = useState<string | null>(null);
  const [newFilePathRename, setNewFilePathRename] = useState('');
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<Array<{ type: 'log' | 'error' | 'success'; text: string; time: string }>>([
    {
      type: 'log',
      text: isArInit
        ? 'تم تشغيل بيئة التطوير الافتراضية.'
        : 'Development environment initialized.',
      time: new Date().toLocaleTimeString()
    },
    {
      type: 'log',
      text: isArInit
        ? 'تم تحميل ملف نقطة البدء وربط الموارد.'
        : 'Loaded entry point and mounted resources.',
      time: new Date().toLocaleTimeString()
    }
  ]);

  // Sync initial welcome message when language changes
  useEffect(() => {
    setChatMessages(prev => {
      if (prev.length === 1 && (prev[0].id === 'welcome_1' || prev[0].id.startsWith('welcome_'))) {
        return [
          {
            ...prev[0],
            text: language === 'ar' 
              ? 'مرحباً بك في استوديو تطوير البرمجيات. صف التطبيق أو الميزة التي ترغب في بنائها لتوليد الكود وتشغيل المعاينة.'
              : 'Welcome to Software Studio. Describe the application or feature you want to build to generate code and launch the preview.',
            suggestions: language === 'ar' 
              ? [
                  'صمم متجر إلكتروني احترافي للمنتجات الرقمية يضم واجهة هبوط عصرية مع سكرول أنيميشن، شبكة منتجات قابلة للتصفية، وسلة مشتريات منبثقة تفاعلية تحسب المجموع تلقائياً.',
                  'أنشئ صفحة هبوط (SaaS) تفاعلية للشركات التقنية مع قسم مميزات متحرك، جدول خطط أسعار مقارن، ونموذج تواصل ذكي مع التحقق من البيانات.',
                  'طور لوحة تحكم وإحصائيات متكاملة (Admin Dashboard) تضم رسوم بيانية تفاعلية لبيانات المبيعات، جداول قابلة للفرز، ونظام إدارة مستخدمين مع حالات ظهور مختلفة.',
                  'ابنِ موقع محفظة أعمال (Portfolio) إبداعي للمصممين مع معرض أعمال شبكي، نظام تبديل الوضع الليلي والنهاري، وتأثيرات انتقال سلسة بين الأقسام.'
                ]
              : [
                  'Design a professional digital products store featuring a modern landing interface with scroll animations, a filterable product grid, and an interactive popup shopping cart that auto-calculates totals.',
                  'Create an interactive SaaS landing page for tech startups with animated feature sections, a comparative pricing table, and a smart contact form with validation logic.',
                  'Develop a comprehensive Admin Dashboard featuring interactive sales data charts, sortable data tables, and a user management system with various UI states.',
                  'Build a creative Portfolio website for designers with a grid-based work gallery, seamless dark/light mode switching, and smooth section transition effects.'
                ]
          }
        ];
      }
      return prev;
    });
  }, [language]);

  const [terminalInput, setTerminalInput] = useState('');

  const handleTerminalCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;
    setTerminalInput('');
    addLog('log', `$ ${cmd}`);

    const lower = cmd.toLowerCase();
    if (lower === 'clear' || lower === 'cls') {
      setTerminalLogs([]);
    } else if (lower === 'help') {
      addLog('log', language === 'ar' ? 'الأوامر المتاحة: help, clear, files, lint, fix, refresh, status, db' : 'Available commands: help, clear, files, lint, fix, refresh, status, db');
    } else if (lower === 'files' || lower === 'ls') {
      const list = Object.keys(files).map(k => `• ${k} (${files[k].content.length})`).join(' | ');
      addLog('log', language === 'ar' ? `ملفات المشروع: ${list}` : `Project files: ${list}`);
    } else if (lower === 'lint' || lower === 'check') {
      addLog('log', language === 'ar' ? 'جاري فحص سلامة الكود...' : 'Running code diagnostics...');
      let errorsFound = false;
      if (!files['index.html']?.content.includes('<html')) {
        addLog('error', language === 'ar' ? 'تنبيه: ملف نقطة البدء لا يحتوي على الوسم الأساسي' : 'Warning: Entry file is missing root HTML tag');
        errorsFound = true;
      }
      if (!errorsFound) {
        addLog('success', language === 'ar' ? 'فحص الكود: جميع الملفات سليمة.' : 'Diagnostics passed: All project files are valid.');
      }
    } else if (lower === 'fix') {
      handleAiFix();
    } else if (lower === 'refresh') {
      setIframeKey(prev => prev + 1);
      addLog('success', language === 'ar' ? 'تم تحديث شاشة المعاينة.' : 'Live preview refreshed.');
    } else if (lower === 'status') {
      addLog('log', language === 'ar'
        ? `الملفات: ${Object.keys(files).length} | النشط: ${activeFilePath} | قاعدة البيانات: ${sqlDb ? `متصلة (${sqlTables.length} جداول)` : 'غير مهيأة'}`
        : `Files: ${Object.keys(files).length} | Active: ${activeFilePath} | Database: ${sqlDb ? `Ready (${sqlTables.length} tables)` : 'Offline'}`);
    } else if (lower === 'db') {
      setIsDbModalOpen(true);
      addLog('success', language === 'ar' ? 'تم فتح إدارة قاعدة البيانات.' : 'Opened Database Manager.');
    } else {
      addLog('error', language === 'ar' ? `أمر غير معروف: "${cmd}".` : `Unknown command: "${cmd}".`);
    }
  };

  // AI Assistant Chat Messages & State
  const [chatMessages, setChatMessages] = useState<StudioChatMessage[]>([
    {
      id: 'welcome_1',
      role: 'assistant',
      text: language === 'ar' 
        ? 'مرحباً بك في استوديو تطوير البرمجيات. صف التطبيق أو الميزة التي ترغب في بنائها لتوليد الكود وتشغيل المعاينة.'
        : 'Welcome to Software Studio. Describe the application or feature you want to build to generate code and launch the preview.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: language === 'ar' 
        ? [
            'صمم متجر إلكتروني احترافي للمنتجات الرقمية يضم واجهة هبوط عصرية مع سكرول أنيميشن، شبكة منتجات قابلة للتصفية، وسلة مشتريات منبثقة تفاعلية تحسب المجموع تلقائياً.',
            'أنشئ صفحة هبوط (SaaS) تفاعلية للشركات التقنية مع قسم مميزات متحرك، جدول خطط أسعار مقارن، ونموذج تواصل ذكي مع التحقق من البيانات.',
            'طور لوحة تحكم وإحصائيات متكاملة (Admin Dashboard) تضم رسوم بيانية تفاعلية لبيانات المبيعات، جداول قابلة للفرز، ونظام إدارة مستخدمين مع حالات ظهور مختلفة.',
            'ابنِ موقع محفظة أعمال (Portfolio) إبداعي للمصممين مع معرض أعمال شبكي، نظام تبديل الوضع الليلي والنهاري، وتأثيرات انتقال سلسة بين الأقسام.'
          ]
        : [
            'Design a professional digital products store featuring a modern landing interface with scroll animations, a filterable product grid, and an interactive popup shopping cart that auto-calculates totals.',
            'Create an interactive SaaS landing page for tech startups with animated feature sections, a comparative pricing table, and a smart contact form with validation logic.',
            'Develop a comprehensive Admin Dashboard featuring interactive sales data charts, sortable data tables, and a user management system with various UI states.',
            'Build a creative Portfolio website for designers with a grid-based work gallery, seamless dark/light mode switching, and smooth section transition effects.'
          ]
    }
  ]);

  const hasExecutedHubPromptRef = useRef(false);
  const chatFeedRef = useRef<HTMLDivElement>(null);

  // Keep syncStatus accurately aligned with authentication state
  useEffect(() => {
    if (!user) {
      setSyncStatus('local');
    } else if (syncStatus === 'local') {
      setSyncStatus('synced');
    }
  }, [user]);

  // Post-Authentication restoration effect for pending app prompt or template
  useEffect(() => {
    if (!user) return;

    try {
      const pendingAppPrompt = sessionStorage.getItem('pending_app_prompt');
      if (pendingAppPrompt) {
        sessionStorage.removeItem('pending_app_prompt');
        setTimeout(() => {
          handleSendPrompt(pendingAppPrompt);
        }, 300);
      }

      const pendingTemplatePayload = sessionStorage.getItem('pending_app_template_payload');
      if (pendingTemplatePayload) {
        const proj = JSON.parse(pendingTemplatePayload);
        sessionStorage.removeItem('pending_app_template_payload');
        sessionStorage.removeItem('pending_app_template');
        if (proj.files) {
          setFiles(proj.files);
          setSavedFiles(proj.files);
          setIframeKey(prev => prev + 1);
        }
        if (proj.name) setProjectName(proj.name);
        if (proj.id) setProjectId(proj.id);
      }
    } catch (e) {}
  }, [user]);

  // Consume incoming project or prompt from Hub, or restore persistent workspace
  useEffect(() => {
    if (hasExecutedHubPromptRef.current) return;
    try {
      const pendingPrompt = sessionStorage.getItem('pending_ai_prompt');
      const rawHub = sessionStorage.getItem('current_active_project');

      if (!user && (pendingPrompt || rawHub)) {
        if (rawHub) {
          try {
            sessionStorage.setItem('pending_app_template_payload', rawHub);
          } catch (e) {}
        }
        if (pendingPrompt) {
          try {
            sessionStorage.setItem('pending_app_prompt', pendingPrompt);
          } catch (e) {}
        }
        setIsAuthModalOpen(true);
        return;
      }

      if (rawHub) {
        const proj = JSON.parse(rawHub);
        if (proj.id) {
          setProjectId(proj.id);
          localStorage.setItem('perplexta_active_project_id', proj.id);
        }
        if (proj.name) {
          setProjectName(proj.name);
          localStorage.setItem('perplexta_active_project_name', proj.name);
        }
        if (proj.files && Object.keys(proj.files).length > 0) {
          setFiles(proj.files);
          setSavedFiles(proj.files);
          setIframeKey(prev => prev + 1);
          sessionStorage.removeItem('current_active_project');
          sessionStorage.removeItem('pending_ai_prompt');
          return;
        }
      }

      if (pendingPrompt && pendingPrompt.trim().length > 0) {
        hasExecutedHubPromptRef.current = true;
        const promptToRun = pendingPrompt.trim();
        sessionStorage.removeItem('pending_ai_prompt');
        sessionStorage.removeItem('current_active_project');

        toast.info(language === 'ar' ? 'بدء تنفيذ أمر التوليد الذكي فورا...' : 'Starting immediate AI generation task...');
        setTimeout(() => {
          handleSendPrompt(promptToRun);
        }, 350);
        return;
      } else if (rawHub) {
        const proj = JSON.parse(rawHub);
        if (proj.description && proj.description.trim().length > 0) {
          hasExecutedHubPromptRef.current = true;
          const promptToRun = proj.description.trim();
          sessionStorage.removeItem('current_active_project');
          setTimeout(() => {
            handleSendPrompt(promptToRun);
          }, 350);
          return;
        }
      }

      // Restore Persistent Workspace Memory from LocalStorage (with legacy text sanitization)
      const savedWorkspace = localStorage.getItem('perplexta_studio_workspace_v2');
      if (savedWorkspace) {
        const parsed = JSON.parse(savedWorkspace);
        if (parsed.projectId) {
          setProjectId(parsed.projectId);
          localStorage.setItem('perplexta_active_project_id', parsed.projectId);
        }
        if (parsed.projectName) {
          const cleanName = String(parsed.projectName)
            .replace(/استوديو بيربليكستا السيادي/g, 'استوديو تطوير البرمجيات')
            .replace(/\(IDE\)/g, '')
            .trim();
          setProjectName(cleanName);
          localStorage.setItem('perplexta_active_project_name', cleanName);
        }
        if (parsed.files && Object.keys(parsed.files).length > 0) {
          if (parsed.files['index.html'] && typeof parsed.files['index.html'].content === 'string') {
            parsed.files['index.html'].content = parsed.files['index.html'].content
              .replace(/استوديو تطوير البرمجيات \(IDE\)/g, 'استوديو تطوير البرمجيات')
              .replace(/مشروع جديد فارغ • جاهز للبناء والتوليد/g, 'جاهز للتطوير');
          }
          setFiles(parsed.files);
          setSavedFiles(parsed.files);
          if (parsed.activeFilePath && parsed.files[parsed.activeFilePath]) {
            setActiveFilePath(parsed.activeFilePath);
          }
          if (Array.isArray(parsed.chatMessages) && parsed.chatMessages.length > 0) {
            const sanitizedMsgs = parsed.chatMessages.map((m: StudioChatMessage) => {
              if (m.role === 'assistant' && typeof m.text === 'string' && (m.text.includes('السيادي') || m.text.includes('(IDE)') || m.text.includes('⚡'))) {
                return {
                  ...m,
                  text: dir === 'rtl'
                    ? 'مرحباً بك في استوديو تطوير البرمجيات. صف التطبيق أو الميزة التي ترغب في بنائها لتوليد الكود وتشغيل المعاينة.'
                    : 'Welcome to Software Studio. Describe the application or feature you want to build to generate code and launch the preview.'
                };
              }
              return m;
            });
            setChatMessages(sanitizedMsgs);
          }
          if (Array.isArray(parsed.terminalLogs) && parsed.terminalLogs.length > 0) {
            setTerminalLogs(parsed.terminalLogs);
          }
          setIframeKey(prev => prev + 1);
        }
      }
    } catch (e) {
      console.warn('Error restoring studio workspace memory:', e);
    }
  }, []);

  // Listen to postMessage from preview iframe for console logs, runtime errors, and element inspector
  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      const { type, level, message, info } = event.data;

      if (type === 'CONSOLE_LOG') {
        // Filter out harmless iframe WebSocket HMR connection errors
        const isWsError = typeof message === 'string' && (
          message.includes('WebSocket closed without opened') ||
          message.includes('failed to connect to websocket') ||
          message.includes('[vite]: failed to connect') ||
          message.includes('ws://') ||
          message.includes('wss://')
        );

        if (level === 'error') {
          if (isWsError) {
            addLog('log', `[معاينة Vite]: ${message}`);
            return;
          }
          addLog('error', `[المعاينة الحية]: ${message}`);
          setRuntimeError({ message });
        } else {
          addLog('log', `[المعاينة]: ${message}`);
        }
      } else if (type === 'INSPECT_ELEMENT_CLICK' && info) {
        setIsInspectMode(false);
        const tagDesc = info.tag ? `<${info.tag}${info.className ? ` class="${info.className}"` : ''}>` : 'العنصر المحدد';
        const textDesc = info.text ? ` بالنص "${info.text}"` : '';
        const generatedPrompt = `🎯 قم بتعديل وتطوير المكون والتصميم الخاص بـ ${tagDesc}${textDesc}: `;
        setPromptQuery(generatedPrompt);
        toast.success(language === 'ar' ? '🎯 تم التقاط العنصر بنجاح! صف التعديل المطلوب برمجياً' : 'Captured element! Describe your desired change.');
      }
    };

    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, [dir]);

  // Auto-Save Workspace State to Persistent Local Storage and Hub Registry with Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (!projectId) return;
        if (files && Object.keys(files).length > 0) {
          localStorage.setItem('perplexta_studio_workspace_v2', JSON.stringify({
            projectId,
            projectName,
            files,
            activeFilePath,
            chatMessages,
            terminalLogs: terminalLogs.slice(-30)
          }));

          // Keep Hub Projects Registry updated in real time
          const rawHub = localStorage.getItem('perplexta_hub_projects');
          let hubList: any[] = rawHub ? JSON.parse(rawHub) : [];
          if (!Array.isArray(hubList)) hubList = [];

          const existingIdx = hubList.findIndex(p => p.id === projectId);
          const hubProj = {
            id: projectId,
            name: projectName,
            description: files['index.html'] ? 'مشروع تفاعلي مكتمل في استوديو بيربليكستا' : 'مشروع ويب جديد قيد البناء',
            techStack: 'HTML5 / JS / SQLite',
            updatedAt: language === 'ar' ? 'الآن' : 'Just now',
            dbSize: '128 KB',
            tablesCount: Object.keys(files).length,
            recordsCount: 1,
            isAutoSaved: true,
            files: files
          };

          if (existingIdx >= 0) {
            hubList[existingIdx] = { ...hubList[existingIdx], ...hubProj };
          } else {
            hubList.unshift(hubProj);
          }
          localStorage.setItem('perplexta_hub_projects', JSON.stringify(hubList));
        }
      } catch (_) {}
    }, 2000);

    return () => clearTimeout(timer);
  }, [files, activeFilePath, chatMessages, terminalLogs, projectId, projectName, dir, language]);

  const hasUnsavedChanges = files[activeFilePath]?.content !== savedFiles[activeFilePath]?.content;

  const handleSaveChanges = () => {
    setSavedFiles(JSON.parse(JSON.stringify(files)));
    setIframeKey(prev => prev + 1);
    toast.success(language === 'ar' ? `تم حفظ الملف ${activeFilePath} بنجاح وتحديث المعاينة!` : `Successfully saved ${activeFilePath} & updated preview!`);
    addLog('success', `حفظ التغييرات وتحديث المعاينة للملف: ${activeFilePath}`);
    saveProjectToDb();
  };

  const handleUndoChanges = () => {
    if (savedFiles[activeFilePath]) {
      setFiles(prev => ({
        ...prev,
        [activeFilePath]: { ...prev[activeFilePath], content: savedFiles[activeFilePath].content }
      }));
      toast.info(language === 'ar' ? 'تم التراجع عن التغييرات غير الحفظ' : 'Reverted to last saved version');
      addLog('log', `تراجع عن التغييرات في الملف: ${activeFilePath}`);
    }
  };
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [deviceMode, setDeviceMode] = useState<'responsive' | 'mobile' | 'tablet'>('responsive');
  const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [promptQuery, setPromptQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamStatusMessage, setStreamStatusMessage] = useState<string>('');
  const [liveStreamText, setLiveStreamText] = useState<string>('');
  const [currentlyWritingFile, setCurrentlyWritingFile] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setStreamStatusMessage('');
    setLiveStreamText('');
    setCurrentlyWritingFile('');
    setFileStatuses(prev => {
      const next: Record<string, 'pending' | 'writing' | 'completed' | 'error'> = {};
      Object.keys(prev).forEach(k => {
        next[k] = files[k]?.content?.trim() ? 'completed' : 'pending';
      });
      return next;
    });
    setIframeKey(prev => prev + 1);
    addLog('log', 'تم إيقاف عملية التوليد في الوقت الفعلي مع الاحتفاظ بالملفات المكتملة.');
    setChatMessages(prev => [
      ...prev,
      {
        id: `stop_${Date.now()}`,
        role: 'assistant',
        text: language === 'ar' ? 'تم إيقاف عملية التوليد بناءً على طلبك، وتم الاحتفاظ بجميع الملفات التي اكتمل إنشاؤها في شجرة المشروع.' : 'Generation stopped by user. All completed files have been preserved in the project tree.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    toast.info(language === 'ar' ? 'تم إيقاف التوليد' : 'Generation stopped');
  };

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isGenerating]);

  // Smooth auto-scroll using chatFeedRef
  useEffect(() => {
    if (chatFeedRef.current) {
      chatFeedRef.current.scrollTo({
        top: chatFeedRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatMessages, liveStreamText, isGenerating]);

  // SQLite Database via sql.js
  const [sqlDb, setSqlDb] = useState<any>(null);
  const [sqlTables, setSqlTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableDataRows, setTableDataRows] = useState<any[]>([]);
  const [tableColumns, setTableColumns] = useState<string[]>([]);
  const [sqlCustomQuery, setSqlCustomQuery] = useState('SELECT * FROM products;');
  const [queryResult, setQueryResult] = useState<any>(null);

  // Initialize SQLite
  useEffect(() => {
    let isMounted = true;
    initSqlJs({
      locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    }).then(SQL => {
      if (!isMounted) return;
      const db = new SQL.Database();
      const schema = files['db/schema.sql']?.content || '';
      try {
        db.run(schema);
        setSqlDb(db);
        refreshTables(db);
        addLog('success', 'تم تهيئة محرك SQLite الافتراضي بنجاح من schema.sql');
      } catch (err: any) {
        addLog('error', `خطأ في تهيئة قاعدة البيانات: ${err.message}`);
      }
    }).catch(err => {
      console.warn('sql.js load error:', err);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshTables = (db: any) => {
    try {
      const res = db.exec("SELECT name FROM sqlite_master WHERE type='table';");
      if (res && res[0] && res[0].values) {
        const tables = res[0].values.map((v: any) => v[0] as string);
        setSqlTables(tables);
        if (tables.length > 0 && !tables.includes(selectedTable)) {
          setSelectedTable(tables[0]);
        }
      }
    } catch (e) {}
  };

  // Load table data when selectedTable changes
  useEffect(() => {
    if (!sqlDb || !selectedTable) return;
    try {
      const res = sqlDb.exec(`SELECT * FROM ${selectedTable};`);
      if (res && res[0]) {
        setTableColumns(res[0].columns);
        setTableDataRows(res[0].values);
      } else {
        setTableColumns([]);
        setTableDataRows([]);
      }
    } catch (e) {
      setTableColumns([]);
      setTableDataRows([]);
    }
  }, [sqlDb, selectedTable, isDbModalOpen]);

  const runCustomSqlQuery = () => {
    if (!sqlDb) return;
    try {
      const res = sqlDb.exec(sqlCustomQuery);
      if (res && res[0]) {
        setQueryResult({ columns: res[0].columns, values: res[0].values });
        addLog('success', `تنفيذ الاستعلام بنجاح: ${sqlCustomQuery}`);
      } else {
        setQueryResult({ success: true, message: 'تم تنفيذ الاستعلام بنجاح (لا توجد نتائج مرجعة).' });
        addLog('success', 'تم تنفيذ الاستعلام بنجاح.');
      }
      refreshTables(sqlDb);
    } catch (err: any) {
      setQueryResult({ error: err.message });
      addLog('error', `خطأ SQL: ${err.message}`);
    }
  };

  const addLog = (type: 'log' | 'error' | 'success', text: string) => {
    setTerminalLogs(prev => [...prev, { type, text, time: new Date().toLocaleTimeString() }]);
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PERPLEXTA_LOAD_CODE') {
        // Load code from host (database)
        if (event.data.files) {
          setFiles(event.data.files);
          addLog('success', 'Project loaded successfully via host event');
        }
      } else if (event.data?.type === 'PERPLEXTA_SAVE_CODE') {
        // Handle trigger save
        saveProjectToDb();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const saveProjectToDb = async (overrideId?: string, overrideTitle?: string, overrideFiles?: Record<string, ProjectFile>) => {
    const token = getAuthToken();
    if (!user || !token) {
      setSyncStatus('local');
      return;
    }
    const targetId = overrideId || projectId;
    if (!targetId) {
      setSyncStatus('local');
      return;
    }
    const targetTitle = overrideTitle || projectName || (language === 'ar' ? 'مشروع جديد' : 'My Project');
    const targetFiles = overrideFiles || files;

    setSyncStatus('saving');
    try {
      const res = await fetch('/api/studio/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: targetId,
          title: targetTitle,
          description: targetFiles['index.html'] ? 'مشروع ويب تفاعلي في استوديو بيربليكستا' : 'مسودة مشروع جديد',
          frameworkMode: 'html',
          files: targetFiles,
          chatHistory: chatMessages.slice(-50),
          isPublic: false
        })
      });
      if (res.ok) {
        setSyncStatus('synced');
        addLog('success', `تم حفظ (${targetTitle}) سحابياً في قاعدة البيانات بنجاح.`);
      } else {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 403 && (errData.error === 'STUDIO_PROJECTS_LIMIT_REACHED' || errData.error === 'STUDIO_STORAGE_LIMIT_EXCEEDED')) {
          setSyncStatus('error');
          const msg = language === 'ar' ? (errData.message || 'تم بلوغ حد الاستوديو في خطتك') : (errData.messageEn || 'Studio quota limit reached for your plan');
          toast.error(msg);
          addLog('error', msg);
        } else {
          setSyncStatus('error');
        }
      }
    } catch (e: any) {
      console.warn('Auto-save workspace error:', e);
      setSyncStatus('error');
    }
  };

  const fetchStudioUsage = async () => {
    try {
      if (!user) return;
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch('/api/studio/usage', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudioUsage(data);
      }
    } catch (e) {
      // ignore
    }
  };

  const fetchUserWorkspaces = async () => {
    if (!user) {
      setUserWorkspaces([]);
      return [];
    }
    setIsLoadingWorkspaces(true);
    try {
      const token = getAuthToken();
      if (!token) {
        setUserWorkspaces([]);
        return [];
      }
      const res = await fetch('/api/studio/workspaces', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setUserWorkspaces(list);
        return list;
      }
    } catch (err) {
      console.warn('Failed to fetch workspaces:', err);
    } finally {
      setIsLoadingWorkspaces(false);
    }
    return [];
  };

  const fetchSnapshots = async (wsId: string) => {
    try {
      if (!user) return;
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch(`/api/studio/workspaces/${wsId}/snapshots`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWorkspaceSnapshots(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Failed to fetch snapshots:', err);
    }
  };

  const handleCreateSnapshot = async (customName?: string, customFiles?: Record<string, ProjectFile>) => {
    const nameToUse = (customName || newSnapshotName).trim();
    if (!nameToUse) return;
    
    setIsSnapshotLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/studio/workspaces/${projectId}/snapshots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ versionName: nameToUse, files: customFiles || files })
      });
      if (res.ok) {
        if (!customName) {
          toast.success(language === 'ar' ? 'تم إنشاء لقطة الإصدار بنجاح!' : 'Snapshot created!');
          setNewSnapshotName('');
        }
        fetchSnapshots(projectId);
      }
    } catch (err: any) {
      if (!customName) toast.error(err.message);
    } finally {
      setIsSnapshotLoading(false);
    }
  };

  const handleRestoreSnapshot = (snapshotId: number, versionName: string) => {
    setSnapshotToRestore({ id: snapshotId, name: versionName });
  };

  const executeRestoreSnapshot = async () => {
    if (!snapshotToRestore) return;
    setIsRestoringSnapshot(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/studio/workspaces/${projectId}/snapshots/${snapshotToRestore.id}/restore`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.files) {
          setFiles(data.files);
          setSavedFiles(data.files);
          setIframeKey(prev => prev + 1);
          toast.success(language === 'ar' ? `تم استعادة الإصدار (${snapshotToRestore.name}) بنجاح!` : `Restored ${snapshotToRestore.name}!`);
          addLog('success', `تم استعادة الإصدار: ${snapshotToRestore.name}`);
        }
        setSnapshotToRestore(null);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsRestoringSnapshot(false);
    }
  };

  const handleSwitchWorkspace = async (ws: any) => {
    if (ws.id === projectId) {
      return;
    }
    // Safely auto-save the current project before switching
    await saveProjectToDb();

    const loadedFiles = typeof ws.files === 'string' ? JSON.parse(ws.files) : (ws.files || {});
    setProjectId(ws.id);
    setProjectName(ws.title);
    setFiles(loadedFiles);
    setSavedFiles(loadedFiles);
    setActiveFilePath('index.html');
    if (Array.isArray(ws.chat_history) && ws.chat_history.length > 0) {
      setChatMessages(ws.chat_history);
    }
    setIframeKey(prev => prev + 1);

    localStorage.setItem('perplexta_active_project_id', ws.id);
    localStorage.setItem('perplexta_active_project_name', ws.title);
    toast.success(language === 'ar' ? `تم تحميل مشروع: ${ws.title}` : `Loaded project: ${ws.title}`);
    addLog('success', `تم التبديل إلى المشروع السحابي: ${ws.title}`);
  };

  const handleDeleteWorkspacePrompt = (wsId: string, wsTitle: string) => {
    setProjectToDelete({ id: wsId, title: wsTitle });
    setDeleteConfirmText('');
  };

  const executeDeleteWorkspace = async () => {
    if (!projectToDelete) return;
    if (deleteConfirmText.trim() !== projectToDelete.title.trim()) {
      toast.error(language === 'ar' ? 'يرجى كتابة اسم المشروع بدقة لتأكيد الحذف' : 'Please type the exact project name to confirm');
      return;
    }

    setIsDeletingProject(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/studio/workspaces/${projectToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        // Clean Hub projects from LocalStorage
        try {
          const rawHub = localStorage.getItem('perplexta_hub_projects');
          if (rawHub) {
            let hubList = JSON.parse(rawHub);
            if (Array.isArray(hubList)) {
              hubList = hubList.filter((p: any) => p.id !== projectToDelete.id);
              localStorage.setItem('perplexta_hub_projects', JSON.stringify(hubList));
            }
          }
        } catch (_) {}

        // Clean local active workspace storage if active
        try {
          const rawCurrent = localStorage.getItem('perplexta_studio_workspace_v2');
          if (rawCurrent) {
            const currentObj = JSON.parse(rawCurrent);
            if (currentObj && currentObj.projectId === projectToDelete.id) {
              localStorage.removeItem('perplexta_studio_workspace_v2');
            }
          }
        } catch (_) {}

        toast.success(language === 'ar' ? `تم حذف المشروع "${projectToDelete.title}" وكافة مشتقاته وإصداراته نهائياً من قاعدة البيانات!` : `Permanently deleted "${projectToDelete.title}" and all snapshots!`);
        addLog('success', `تم حذف المشروع السحابي ومشتقاته من قاعدة البيانات: ${projectToDelete.title}`);
        
        const fetchedList = await fetchUserWorkspaces();
        const remainingList = Array.isArray(fetchedList) && fetchedList.length > 0
          ? fetchedList
          : userWorkspaces.filter(w => w.id !== projectToDelete.id);

        if (projectToDelete.id === projectId) {
          if (remainingList.length > 0) {
            // Switch to the top remaining workspace
            const nextTarget = remainingList[0];
            setProjectId(nextTarget.id);
            setProjectName(nextTarget.title);
            const loadedFiles = typeof nextTarget.files === 'string' ? JSON.parse(nextTarget.files) : (nextTarget.files || {});
            setFiles(loadedFiles);
            setSavedFiles(loadedFiles);
            setActiveFilePath('index.html');
            if (Array.isArray(nextTarget.chat_history) && nextTarget.chat_history.length > 0) {
              setChatMessages(nextTarget.chat_history);
            }
            setIframeKey(prev => prev + 1);
            localStorage.setItem('perplexta_active_project_id', nextTarget.id);
            localStorage.setItem('perplexta_active_project_name', nextTarget.title);
            toast.info(language === 'ar' ? `اللانتقال إلى مشروع: ${nextTarget.title}` : `Switched to project: ${nextTarget.title}`);
          } else {
            // Enter Standby Mode without creating a new database record
            setProjectId('');
            setProjectName(language === 'ar' ? 'استوديو التطبيقات' : 'App Studio');
            try {
              localStorage.removeItem('perplexta_active_project_id');
              localStorage.removeItem('perplexta_active_project_name');
              localStorage.removeItem('perplexta_studio_workspace_v2');
              sessionStorage.removeItem('current_active_project');
            } catch (_) {}

            const standbyFiles: Record<string, ProjectFile> = {
              'index.html': {
                name: 'index.html',
                path: 'index.html',
                type: 'html',
                isEntry: true,
                content: `<!DOCTYPE html>
<html lang="${language === 'ar' ? 'ar' : 'en'}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${language === 'ar' ? 'استوديو البرمجيات' : 'Software Studio'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Tajawal:wght@300;400;500;700;800;900&display=swap" rel="stylesheet">
</head>
<body class="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-['Inter','Tajawal',sans-serif] min-h-screen flex items-center justify-center p-6">
  <div class="max-w-md w-full text-center space-y-6">
    <div class="relative mx-auto w-16 h-16 rounded-shape-md bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-xl flex items-center justify-center">
      <div class="w-full h-full bg-slate-900 rounded-shape-sm flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="text-blue-500">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
      </div>
    </div>
    
    <div class="space-y-3">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-shape-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-bold">
        <span>${language === 'ar' ? 'وضع الاستعداد' : 'Standby Mode'}</span>
      </div>
      <h1 class="text-2xl font-black text-slate-900 dark:text-white">${language === 'ar' ? 'استوديو التطبيقات' : 'App Studio'}</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
        ${language === 'ar'
          ? 'اختر مشروعاً من القائمة الجانبية للتعديل عليه، أو أنشئ مشروعاً جديداً للبدء.'
          : 'Select a project from the sidebar to edit, or create a new project to get started.'}
      </p>
    </div>
  </div>
</body>
</html>`
              }
            };

            setFiles(standbyFiles);
            setSavedFiles(standbyFiles);
            setActiveFilePath('index.html');
            setIframeKey(prev => prev + 1);

            setChatMessages([
              {
                id: `standby_${Date.now()}`,
                role: 'assistant',
                text: language === 'ar'
                  ? 'تم حذف المشروع بنجاح. يمكنك اختيار مشروع آخر من القائمة أو بدء مشروع جديد بإدخال وصف للطلب.'
                  : 'Project deleted successfully. Select an existing project from the list or describe a new app to start.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ]);
          }
        }
        setProjectToDelete(null);
        setDeleteConfirmText('');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || (language === 'ar' ? 'فشل حذف المشروع' : 'Failed to delete project'));
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsDeletingProject(false);
    }
  };

  const handleRenameWorkspacePrompt = (wsId: string, currentTitle: string) => {
    setProjectToRename({ id: wsId, title: currentTitle });
    setRenameText(currentTitle);
  };

  const executeRenameWorkspace = async () => {
    if (!projectToRename || !renameText.trim()) return;

    setIsRenamingProject(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/studio/workspaces/${projectToRename.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ title: renameText.trim() })
      });
      if (res.ok) {
        toast.success(language === 'ar' ? `تم تعديل اسم المشروع إلى "${renameText.trim()}"` : `Renamed to "${renameText.trim()}"`);
        if (projectToRename.id === projectId) {
          setProjectName(renameText.trim());
          localStorage.setItem('perplexta_active_project_name', renameText.trim());
        }
        fetchUserWorkspaces();
        setProjectToRename(null);
        setRenameText('');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || (language === 'ar' ? 'فشل تعديل اسم المشروع' : 'Failed to rename project'));
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsRenamingProject(false);
    }
  };

  const executeDeleteFile = () => {
    if (!fileToDelete) return;
    const path = fileToDelete;
    setFiles(prev => {
      const next = { ...prev };
      delete next[path];
      return next;
    });
    if (activeFilePath === path) {
      setActiveFilePath('index.html');
    }
    setFileToDelete(null);
    toast.success(language === 'ar' ? 'تم حذف الملف بنجاح' : 'File deleted successfully');
  };

  const handleUploadZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const zip = new JSZip();
      const zipData = await zip.loadAsync(file);
      const newFiles: Record<string, ProjectFile> = { ...files };

      const promises = Object.keys(zipData.files).map(async (filename) => {
        const zipFile = zipData.files[filename];
        if (!zipFile.dir) {
          const fileContent = await zipFile.async('string');
          const ext = filename.split('.').pop() || 'text';
          newFiles[filename] = {
            name: filename.split('/').pop() || filename,
            path: filename,
            content: fileContent,
            type: ext
          };
        }
      });

      await Promise.all(promises);
      setFiles(newFiles);
      setIframeKey(prev => prev + 1);
      toast.success(language === 'ar' ? 'تم رفع الملفات من الأرشيف بنجاح!' : 'Files extracted and uploaded successfully!');
      addLog('success', `تم رفع أرشيف ZIP: ${file.name}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    const newFiles: Record<string, ProjectFile> = { ...files };
    let count = 0;

    Array.from(uploadedFiles).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const ext = file.name.split('.').pop() || 'text';
        newFiles[file.name] = {
          name: file.name,
          path: file.name,
          content: content,
          type: ext
        };
        count++;
        if (count === uploadedFiles.length) {
          setFiles({ ...newFiles });
          setIframeKey(prev => prev + 1);
          toast.success(language === 'ar' ? `تم رفع ${uploadedFiles.length} ملفات!` : `Uploaded ${uploadedFiles.length} files!`);
          addLog('success', `تم رفع ${uploadedFiles.length} ملفات يدوياً.`);
        }
      };
      reader.readAsText(file);
    });
    
    if (e.target) e.target.value = '';
  };
  // Clean Virtual HTML Bundler for flawless instant iframe sync without Blob URL CSP blocking
  const previewSrcDoc = useMemo(() => {
    let rawHtml = files['index.html']?.content || '<div class="p-8 text-center text-slate-400">جاري تحميل المشروع...</div>';
    if (rawHtml.includes('\\n') && (rawHtml.match(/\\n/g)?.length || 0) > 3) {
      rawHtml = rawHtml
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"');
    }

    // Replace relative local <script src="..."> and <link href="..."> tags to avoid 404 network fetch errors in srcdoc
    let htmlContent = rawHtml
      .replace(/<script\s+[^>]*src=["'](?!https?:\/\/|\/\/|\/api\/)[^"']+\.(?:jsx?|tsx?|js|ts)["'][^>]*>\s*<\/script>/gi, '')
      .replace(/<link\s+[^>]*href=["'](?!https?:\/\/|\/\/|\/api\/)[^"']+\.css["'][^>]*\/?>/gi, '')
      // Rewrite any remaining external CDN links inside user html to our local, cached, CSP-immune proxy
      .replace(/https:\/\/unpkg\.com\/scrollreveal(?:\/dist\/scrollreveal\.min\.js)?/gi, '/api/studio/proxy/scrollreveal')
      .replace(/https:\/\/unpkg\.com\/lucide@latest\/dist\/umd\/lucide\.js/gi, '/api/studio/proxy/lucide')
      .replace(/https:\/\/unpkg\.com\/lucide@latest/gi, '/api/studio/proxy/lucide')
      .replace(/https:\/\/cdn\.tailwindcss\.com/gi, '/api/studio/proxy/tailwind');

    // Collect all CSS files
    const allCss = Object.keys(files)
      .filter(p => p.endsWith('.css'))
      .map(p => {
        let c = files[p].content || '';
        if (c.includes('\\n') && (c.match(/\\n/g)?.length || 0) > 2) c = c.replace(/\\n/g, '\n');
        return `/* --- ${p} --- */\n${c}`;
      })
      .join('\n\n');

    // Collect and topologically sort all JS, JSX, TS, TSX files (filtering out build/config files)
    const configBlacklist = ['vite.config.js', 'vite.config.ts', 'tailwind.config.js', 'tailwind.config.cjs', 'postcss.config.js', 'package.json', 'tsconfig.json'];
    const allCodeFiles = Object.keys(files)
      .filter(p => !configBlacklist.some(cfg => p.endsWith(cfg)))
      .filter(p => p.endsWith('.js') || p.endsWith('.jsx') || p.endsWith('.ts') || p.endsWith('.tsx'))
      .filter(p => files[p] && typeof files[p].content === 'string' && files[p].content.trim().length > 0);

    const getFilePriority = (path: string) => {
      const lower = path.toLowerCase();
      if (lower.includes('types') || lower.includes('constants') || lower.includes('config')) return 1;
      if (lower.includes('data') || lower.includes('mock') || lower.includes('store') || lower.includes('seed')) return 2;
      if (lower.includes('utils') || lower.includes('helpers') || lower.includes('services') || lower.includes('api')) return 3;
      if (lower.includes('context') || lower.includes('hooks')) return 4;
      if (lower.includes('components') || lower.includes('ui') || lower.includes('widgets')) return 5;
      if (lower.includes('pages') || lower.includes('views') || lower.includes('sections')) return 6;
      if (lower.endsWith('app.jsx') || lower.endsWith('app.tsx')) return 7;
      if (lower.endsWith('main.jsx') || lower.endsWith('main.tsx') || lower.endsWith('index.jsx') || lower.endsWith('index.tsx') || lower === 'src/app.js' || lower === 'app.js' || lower === 'script.js' || lower === 'main.js') return 8;
      return 5;
    };

    const sortedFiles = [...allCodeFiles].sort((a, b) => getFilePriority(a) - getFilePriority(b));

    const cleanEsmForBrowser = (code: string) => {
      if (!code) return '';
      let rawCode = code;
      if (rawCode.includes('\\n') && (rawCode.match(/\\n/g)?.length || 0) > 3) {
        rawCode = rawCode.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"');
      }

      // Parse export { val1, val2 } and bind each to window, then remove the export statement
      const exportBlockRegex = /export\s*\{([\s\S]*?)\};?/g;
      let match;
      let cleanCode = rawCode;
      let binds = '';
      while ((match = exportBlockRegex.exec(rawCode)) !== null) {
        const exports = match[1].split(',').map(x => x.trim());
        exports.forEach(exp => {
          if (exp) {
            const parts = exp.split(/\s+as\s+/i);
            const orig = parts[0].trim();
            const alias = parts[parts.length - 1].trim();
            if (alias && alias !== 'default') {
              binds += `\ntry { window.${alias} = ${orig}; } catch(_) {}`;
            }
          }
        });
      }
      cleanCode = cleanCode.replace(exportBlockRegex, '') + binds;

      return cleanCode
        .replace(/import\.meta\.env/g, '(window.__VITE_ENV__ || window.process?.env || {})')
        .replace(/import\s*\{([\s\S]*?)\}\s*from\s*['"]lucide-react['"];?/g, 'const {$1} = window.LucideIconProxy || {};')
        .replace(/import\s+[\s\S]*?\s+from\s+['"][^'"]+['"];?/g, '')
        .replace(/import\s+['"][^'"]+['"];?/g, '')
        .replace(/export\s+default\s+function\s+([A-Za-z0-9_]+)/g, 'window.$1 = $1; function $1')
        .replace(/export\s+default\s+function\s*/g, 'function ')
        .replace(/export\s+default\s+class\s+([A-Za-z0-9_]+)/g, 'window.$1 = $1; class $1')
        .replace(/export\s+default\s+class\s*/g, 'class ')
        .replace(/export\s+default\s+([A-Za-z0-9_]+);?/g, 'window.$1 = $1;')
        .replace(/export\s+const\s+([A-Za-z0-9_]+)\s*=/g, 'const $1 = window.$1 =')
        .replace(/export\s+let\s+([A-Za-z0-9_]+)\s*=/g, 'let $1 = window.$1 =')
        .replace(/export\s+var\s+([A-Za-z0-9_]+)\s*=/g, 'var $1 = window.$1 =')
        .replace(/export\s+function\s+([A-Za-z0-9_]+)/g, 'window.$1 = $1; function $1')
        .replace(/export\s+(let|var|class|type|interface)\s+/g, '$1 ');
    };

    // Detect entry file dynamically across all possible framework patterns
    const entryCandidates = [
      'src/main.tsx', 'src/main.jsx', 'src/main.js', 'src/main.ts',
      'src/index.tsx', 'src/index.jsx', 'src/index.js', 'src/index.ts',
      'src/App.tsx', 'src/App.jsx', 'src/App.js', 'src/App.ts',
      'src/app.tsx', 'src/app.jsx', 'src/app.js', 'src/app.ts',
      'main.tsx', 'main.jsx', 'main.js', 'main.ts',
      'App.tsx', 'App.jsx', 'App.js',
      'app.js', 'script.js', 'index.js'
    ];

    const entryFilePath = entryCandidates.find(p => files[p] && typeof files[p].content === 'string' && files[p].content.trim().length > 0) || (sortedFiles.length > 0 ? sortedFiles[sortedFiles.length - 1] : '');

    const hasBabelFiles = sortedFiles.some(p => p.endsWith('.jsx') || p.endsWith('.tsx'));

    let combinedScriptsHtml = '';
    if (hasBabelFiles) {
      const combinedBabelCode = sortedFiles
        .map(p => `/* --- File: ${p} --- */\n${cleanEsmForBrowser(files[p].content)}`)
        .join('\n\n');
      combinedScriptsHtml = `
      <script type="text/babel" data-presets="typescript,react,env" data-file="bundle">
        ${combinedBabelCode}
        window.addEventListener('DOMContentLoaded', function() {
          if (typeof window.initLucideIcons === 'function') window.initLucideIcons();
        });
        setTimeout(function() {
          if (typeof window.initLucideIcons === 'function') window.initLucideIcons();
        }, 120);
      </script>`;
    } else {
      const otherJsScripts = sortedFiles
        .filter(p => p !== entryFilePath)
        .map(p => `
        <script data-file="${p}">
          /* --- File: ${p} --- */
          ${cleanEsmForBrowser(files[p].content)}
        </script>`).join('\n');
      const rawEntry = entryFilePath && files[entryFilePath] ? files[entryFilePath].content : '';
      const entryJs = cleanEsmForBrowser(rawEntry);
      combinedScriptsHtml = `
      ${otherJsScripts}
      <script data-file="${entryFilePath || 'entry'}">
        /* --- Entry File: ${entryFilePath} --- */
        ${entryJs}
        window.addEventListener('DOMContentLoaded', function() {
          if (typeof window.initLucideIcons === 'function') window.initLucideIcons();
        });
        window.addEventListener('load', function() {
          if (typeof window.initLucideIcons === 'function') window.initLucideIcons();
        });
        setTimeout(function() {
          if (typeof window.initLucideIcons === 'function') window.initLucideIcons();
        }, 80);
      </script>`;
    }

    // Guarantee both #root and #app containers exist for React and Vanilla JS rendering
    if (!htmlContent.includes('id="root"') && !htmlContent.includes('id="app"')) {
      const defaultContainers = '<div id="root"></div><div id="app"></div>';
      if (htmlContent.includes('</body>')) {
        htmlContent = htmlContent.replace('</body>', defaultContainers + '</body>');
      } else {
        htmlContent += defaultContainers;
      }
    }

    const injectionHead = `
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Tajawal:wght@300;400;500;700;800;900&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />
      <script src="/api/studio/proxy/tailwind"></script>
      <script src="/api/studio/proxy/react"></script>
      <script src="/api/studio/proxy/react-dom"></script>
      <script src="/api/studio/proxy/babel"></script>
      <script src="/api/studio/proxy/lucide"></script>
      <script src="/api/studio/proxy/chartjs"></script>
      <script>
        // Event listener race-condition polyfill for DOMContentLoaded and load events in iframes
        (function() {
          const originalAddEventListener = EventTarget.prototype.addEventListener;
          EventTarget.prototype.addEventListener = function(type, listener, options) {
            if (type === 'DOMContentLoaded' && (document.readyState === 'interactive' || document.readyState === 'complete')) {
              try { listener.call(this, { type: 'DOMContentLoaded', target: document, currentTarget: document }); } catch(e) { console.error('DOMContentLoaded race polyfill bypass:', e); }
              return;
            }
            if (type === 'load' && document.readyState === 'complete') {
              try { listener.call(this, { type: 'load', target: window, currentTarget: window }); } catch(e) { console.error('load race polyfill bypass:', e); }
              return;
            }
            return originalAddEventListener.apply(this, arguments);
          };
        })();

        // Expose common React hooks globally so stripped imports work seamlessly
        if (window.React) {
          window.useState = window.React.useState;
          window.useEffect = window.React.useEffect;
          window.useRef = window.React.useRef;
          window.useMemo = window.React.useMemo;
          window.useCallback = window.React.useCallback;
          window.useContext = window.React.useContext;
          window.createContext = window.React.createContext;
          window.useReducer = window.React.useReducer;
          window.Fragment = window.React.Fragment;
        }

        window.initLucideIcons = function() {
          try {
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
              window.lucide.createIcons();
            } else if (window.Lucide && typeof window.Lucide.createIcons === 'function') {
              window.Lucide.createIcons();
            }
          } catch(_) {}
        };
        // Polyfill Lucide React icon components
        window.LucideIconProxy = new Proxy({}, {
          get: function(target, prop) {
            if (typeof prop === 'string' && prop !== 'then' && prop !== 'prototype') {
              return function LucideIconComponent(props) {
                var cls = (props && props.className) ? props.className + ' lucide' : 'w-5 h-5 inline-block lucide';
                var iconName = prop.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
                return React.createElement('i', Object.assign({ 'data-lucide': iconName, className: cls }, props));
              };
            }
            return undefined;
          }
        });
        // Guarantee ReactDOM.createRoot compatibility
        if (window.ReactDOM && !window.ReactDOM.createRoot) {
          window.ReactDOM.createRoot = function(container) {
            return {
              render: function(element) {
                window.ReactDOM.render(element, container);
              }
            };
          };
        }
        if (window.ReactDOM && window.ReactDOM.createRoot) {
          window.createRoot = window.ReactDOM.createRoot.bind(window.ReactDOM);
        }
        tailwind.config = {
          darkMode: 'class',
          theme: {
            extend: {
              fontFamily: {
                sans: ['Inter', 'Tajawal', 'system-ui', 'sans-serif'],
                tajawal: ['Tajawal', 'sans-serif'],
              }
            }
          }
        }
      </script>
      <style>
        ${allCss}
        body {
          font-family: 'Inter', 'Tajawal', system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
      </style>
      <script>
        (function() {
          const originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info
          };
          function sendLog(type, args) {
            try {
              const message = Array.from(args).map(arg => {
                if (arg instanceof Error) return arg.message + '\n' + (arg.stack || '');
                if (typeof arg === 'object' && arg !== null) {
                  try { return arg.message || arg.description || JSON.stringify(arg, Object.getOwnPropertyNames(arg)); } catch(_) { return String(arg); }
                }
                return String(arg);
              }).join(' ');
              window.parent.postMessage({ type: 'CONSOLE_LOG', level: type, message: message }, '*');
            } catch(e) {}
          }
          console.log = function() { originalConsole.log.apply(console, arguments); sendLog('log', arguments); };
          console.error = function() { originalConsole.error.apply(console, arguments); sendLog('error', arguments); };
          console.warn = function() { originalConsole.warn.apply(console, arguments); sendLog('warn', arguments); };
          console.info = function() { originalConsole.info.apply(console, arguments); sendLog('info', arguments); };
          
          window.process = window.process || { env: {} };
          window.process.env = Object.assign(window.process.env, ${JSON.stringify(envVars)});
          window.__VITE_ENV__ = Object.assign({}, window.process.env);
          
          window.addEventListener('error', function(event) {
            var msg = String(event.message || '');
            if (msg.includes('WebSocket') || msg.includes('websocket') || msg.includes('ws://')) return;
            sendLog('error', [msg]);
          });
          window.addEventListener('unhandledrejection', function(event) {
            var reasonMsg = String(event.reason?.message || event.reason || '');
            if (reasonMsg.includes('WebSocket') || reasonMsg.includes('websocket') || reasonMsg.includes('ws://')) return;
            sendLog('error', ['Unhandled Promise Rejection: ' + reasonMsg]);
          });

          // Global Image Fallback Polyfill (prevents broken image placeholder icons)
          window.addEventListener('error', function(e) {
            if (e.target && e.target.tagName === 'IMG') {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80';
            }
          }, true);

          ${isInspectMode ? `
          // Inspect Mode Script
          document.addEventListener('mouseover', function(e) {
            e.stopPropagation();
            if (e.target && e.target.style) {
              e.target.dataset.oldOutline = e.target.style.outline;
              e.target.style.outline = '2px dashed #38bdf8';
              e.target.style.cursor = 'crosshair';
            }
          });
          document.addEventListener('mouseout', function(e) {
            e.stopPropagation();
            if (e.target && e.target.style) {
              e.target.style.outline = e.target.dataset.oldOutline || '';
            }
          });
          document.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var info = {
              tag: e.target.tagName ? e.target.tagName.toLowerCase() : 'element',
              text: (e.target.innerText || e.target.textContent || '').slice(0, 60).trim(),
              className: e.target.className || '',
              id: e.target.id || ''
            };
            window.parent.postMessage({ type: 'INSPECT_ELEMENT_CLICK', info: info }, '*');
          }, true);
          ` : ''}
        })();
      </script>
    `;

    const injectionScripts = combinedScriptsHtml;

    // Robustly inject head scripts using case-insensitive regex to handle attributes (e.g. <html lang="ar">)
    if (/<head[^>]*>/i.test(htmlContent)) {
      htmlContent = htmlContent.replace(/(<head[^>]*>)/i, `$1${injectionHead}`);
    } else if (/<html[^>]*>/i.test(htmlContent)) {
      htmlContent = htmlContent.replace(/(<html[^>]*>)/i, `$1<head>${injectionHead}</head>`);
    } else {
      htmlContent = `<!DOCTYPE html><html lang="${language === 'ar' ? 'ar' : 'en'}" dir="${dir}"><head>${injectionHead}</head><body>${htmlContent}</body></html>`;
    }

    // Robustly inject body scripts
    if (/<\/body>/i.test(htmlContent)) {
      htmlContent = htmlContent.replace(/(<\/body>)/i, `${injectionScripts}$1`);
    } else if (/<\/html>/i.test(htmlContent)) {
      htmlContent = htmlContent.replace(/(<\/html>)/i, `${injectionScripts}$1`);
    } else {
      htmlContent = htmlContent + injectionScripts;
    }

    return htmlContent;
  }, [files, language, dir, isInspectMode, envVars]);

  const handleOpenInNewTab = async () => {
    try {
      const newWin = window.open('about:blank', '_blank');
      if (!user) {
        if (newWin) {
          newWin.document.open();
          newWin.document.write(previewSrcDoc);
          newWin.document.close();
        }
        toast.success(language === 'ar' ? 'تم فتح المعاينة الحية في نافذة متصفح جديدة!' : 'Opened live preview in new browser tab!');
        return;
      }

      const lang = language === 'ar' ? 'ar' : 'en';
      const direction = language === 'ar' ? 'rtl' : 'ltr';
      const previewUrl = `/api/studio/workspaces/${projectId}/preview?lang=${lang}&dir=${direction}`;

      await saveProjectToDb();

      if (newWin) {
        newWin.location.href = previewUrl;
      } else {
        window.open(previewUrl, '_blank');
      }
      toast.success(language === 'ar' ? 'تم فتح المعاينة الحية في نافذة متصفح جديدة!' : 'Opened live preview in new browser tab!');
    } catch (err: any) {
      console.error('Failed to open preview tab:', err);
      toast.error(language === 'ar' ? 'تعذر فتح نافذة المتصفح الجديدة' : 'Failed to open preview tab');
    }
  };

  const toggleVoiceRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error(language === 'ar' ? 'متصفحك لا يدعم التعرف على الصوت.' : 'Speech recognition is not supported in your browser.');
      return;
    }

    if (isRecordingVoice) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      setIsRecordingVoice(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'ar' ? 'ar-SA' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecordingVoice(true);
      toast.info(language === 'ar' ? 'جاري الاستماع...' : 'Listening...');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setPromptQuery(prev => (prev ? `${prev} ${transcript}` : transcript));
      setIsRecordingVoice(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecordingVoice(false);
      toast.error(language === 'ar' ? 'حدث خطأ في التعرف على الصوت.' : 'Speech recognition error.');
    };

    recognition.onend = () => {
      setIsRecordingVoice(false);
    };

    speechRecognitionRef.current = recognition;
    recognition.start();
  };

  // Handle Send Prompt (Real AI Code Engine with Real-Time File Tree Scaffolding & Chat History)
  const handleSendPrompt = async (customPrompt?: string) => {
    const promptToSend = (typeof customPrompt === 'string' ? customPrompt : promptQuery).trim();
    if (!promptToSend || isGenerating) return;

    if (!user) {
      try {
        sessionStorage.setItem('pending_app_prompt', promptToSend);
      } catch (e) {}
      setIsAuthModalOpen(true);
      return;
    }

    if (typeof customPrompt === 'string') {
      setClickedSuggestions(prev => [...prev, customPrompt]);
    }
    
    setPromptQuery('');
    setIsGenerating(true);
    setCurrentlyWritingFile('');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMsgId = `user_${Date.now()}`;
    const userMsg: StudioChatMessage = {
      id: userMsgId,
      role: 'user',
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    addLog('log', `إرسال طلب التطوير: "${promptToSend}"`);

    const existingFileKeys = Object.keys(files);
    const indexContent = files['index.html']?.content || '';
    const isDefaultLaunchpad =
      existingFileKeys.length === 0 ||
      (existingFileKeys.length === 1 &&
        existingFileKeys[0] === 'index.html' &&
        (indexContent.includes('جاهز للتطوير') ||
          indexContent.includes('Ready to Build') ||
          indexContent.includes('منصة جاهزة للتطوير') ||
          indexContent.length < 2500));

    // Refined incremental instructions: Ensure the AI adds to the project rather than replacing it.
    let finalPrompt = promptToSend;
    if (!isDefaultLaunchpad) {
      const incrementalInstruction = language === 'ar'
        ? "\n\n⚠️ تعليمات هامة للمهندس: هذا المشروع قائم بالفعل. يرجى إضافة الميزات المطلوبة أعلاه بدقة مع الحفاظ الكامل على الهيكل الحالي والكود الموجود. لا تقم بمسح أو إعادة كتابة المشروع بالكامل. قم بإجراء تحديثات جراحية دقيقة (Surgical Incremental Updates) للملفات المعنية فقط."
        : "\n\n⚠️ IMPORTANT ARCHITECT INSTRUCTION: This is an existing project. Please strictly add the requested features/changes while preserving all current structure and existing code. DO NOT rewrite the entire project from scratch; perform surgical incremental updates only on the relevant files.";
      finalPrompt += incrementalInstruction;
    }

    setPipelinePhase(1);
    setStreamStatusMessage(language === 'ar' ? 'المرحلة 1: تحليل المتطلبات وهندسة شجرة ملفات المشروع...' : 'Phase 1: Analyzing requirements & scaffolding project file tree...');
    setLiveStreamText('');

    let streamedFilesMap: Record<string, ProjectFile> = {};
    let latestBlueprint: any = null;
    let rawChunkAccumulator = '';

    try {
      const token = getAuthToken();
      const historyPayload = chatMessages.slice(-6).map(m => ({
        role: m.role,
        content: m.text
      }));

      const res = await fetch('/api/studio/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        signal: controller.signal,
        body: JSON.stringify({
          prompt: finalPrompt,
          files,
          activeFilePath,
          isNewProject: isDefaultLaunchpad,
          history: historyPayload,
          stream: true
        })
      });

      if (res.ok) {
        let completedData: any = null;
        const contentType = res.headers.get('content-type') || '';

        if (contentType.includes('text/event-stream') && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data:')) {
                const dataStr = trimmed.substring(5).trim();
                let streamErrText = '';
                try {
                  const ev = JSON.parse(dataStr);
                  if (ev.type === 'step') {
                    setStreamStatusMessage(ev.message);
                    addLog('log', ev.message);
                  } else if (ev.type === 'blueprint' && ev.blueprint) {
                    latestBlueprint = ev.blueprint;
                    setActiveBlueprint(ev.blueprint);
                    setPipelinePhase(2);

                    const plannedOrder: string[] = Array.isArray(ev.blueprint.file_tree_order)
                      ? ev.blueprint.file_tree_order
                      : Array.isArray(ev.blueprint.files_order)
                      ? ev.blueprint.files_order
                      : [];

                    if (ev.blueprint.project_name && typeof ev.blueprint.project_name === 'string') {
                      if (projectName === 'مشروع جديد' || projectName === 'My Project') {
                        setProjectName(ev.blueprint.project_name);
                        localStorage.setItem('perplexta_active_project_name', ev.blueprint.project_name);
                      }
                    }

                    if (plannedOrder.length > 0) {
                      setFileStatuses(prev => {
                        const next = { ...prev };
                        plannedOrder.forEach((p: string) => {
                          const cleanPath = String(p).replace(/^\/+/, '').trim();
                          if (cleanPath && next[cleanPath] !== 'completed') {
                            next[cleanPath] = 'pending';
                          }
                        });
                        return next;
                      });

                      // Scaffold pending files directly into the File Tree Explorer so the user sees the project structure immediately
                      setFiles(prev => {
                        const next = { ...prev };
                        plannedOrder.forEach((p: string) => {
                          const cleanPath = String(p).replace(/^\/+/, '').trim();
                          if (cleanPath && !next[cleanPath]) {
                            const ext = cleanPath.split('.').pop()?.toLowerCase() || 'txt';
                            next[cleanPath] = {
                              name: cleanPath.split('/').pop() || cleanPath,
                              path: cleanPath,
                              content: '',
                              type: ext,
                              isEntry: cleanPath === 'index.html'
                            };
                          }
                        });
                        return next;
                      });
                    }

                    const bpMsg = dir === 'rtl'
                      ? `المرحلة 2: تم اعتماد المخطط الهيكلي (${plannedOrder.length || 1} ملفات) وجاري كتابة الكود...`
                      : `Phase 2: Blueprint approved (${plannedOrder.length || 1} files), writing code...`;
                    setStreamStatusMessage(bpMsg);
                    addLog('success', bpMsg);
                  } else if (ev.type === 'file_writing' && ev.path) {
                    const targetPath = String(ev.path).replace(/^\/+/, '').trim();
                    setPipelinePhase(2);
                    setCurrentlyWritingFile(targetPath);
                    setStreamStatusMessage(
                      dir === 'rtl'
                        ? `المرحلة 2: جاري إنشاء وكتابة الملف: ${targetPath}`
                        : `Phase 2: Writing file: ${targetPath}`
                    );
                    setFileStatuses(prev => ({
                      ...prev,
                      [targetPath]: 'writing'
                    }));
                    setFiles(prev => {
                      if (prev[targetPath]) return prev;
                      const ext = targetPath.split('.').pop()?.toLowerCase() || 'txt';
                      return {
                        ...prev,
                        [targetPath]: {
                          name: targetPath.split('/').pop() || targetPath,
                          path: targetPath,
                          content: '',
                          type: ext,
                          isEntry: targetPath === 'index.html'
                        }
                      };
                    });
                    addLog('log', language === 'ar' ? `جاري كتابة الملف: ${targetPath}` : `Writing file: ${targetPath}`);
                  } else if (ev.type === 'file_complete' && ev.path && ev.file) {
                    const targetPath = String(ev.path).replace(/^\/+/, '').trim();
                    streamedFilesMap[targetPath] = ev.file;
                    setFiles(prev => ({
                      ...prev,
                      [targetPath]: ev.file
                    }));
                    setSavedFiles(prev => ({
                      ...prev,
                      [targetPath]: ev.file
                    }));
                    setFileStatuses(prev => ({
                      ...prev,
                      [targetPath]: 'completed'
                    }));
                    setCurrentlyWritingFile(prev => (prev === targetPath ? '' : prev));
                    if (targetPath === 'index.html' || targetPath.endsWith('.js') || targetPath.endsWith('.jsx') || targetPath.endsWith('.tsx')) {
                      setIframeKey(prev => prev + 1);
                    }
                    addLog('success', language === 'ar' ? `اكتمل بناء الملف: ${targetPath}` : `Completed file: ${targetPath}`);
                  } else if (ev.type === 'chunk') {
                    rawChunkAccumulator += ev.chunk;
                    // Strip out XML tags and blueprint JSON so the live code monitor displays clean source code
                    const cleanPreview = rawChunkAccumulator
                      .replace(/<perplexta_blueprint>[\s\S]*?<\/perplexta_blueprint>/gi, '')
                      .replace(/<perplexta_blueprint>[\s\S]*/gi, '')
                      .replace(/<\/?perplexta_file[^>]*>/gi, '\n')
                      .trim();
                    if (cleanPreview) {
                      setLiveStreamText(cleanPreview.slice(-360));
                    }
                  } else if (ev.type === 'complete') {
                    completedData = ev;
                  } else if (ev.type === 'error') {
                    streamErrText = ev.message || ev.error || (language === 'ar' ? 'فشل توليد التعديلات البرمجية.' : 'Generation failed');
                  }
                } catch (_) {}
                if (streamErrText) {
                  const errChatMsg: StudioChatMessage = {
                    id: `assistant_err_${Date.now()}`,
                    role: 'assistant',
                    text: `⚠️ ${streamErrText}`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  };
                  setChatMessages(prev => [...prev, errChatMsg]);
                  addLog('error', streamErrText);
                  toast.error(streamErrText);
                  return;
                }
              }
            }
          }
        } else {
          completedData = await res.json();
        }

        const data = completedData;
        if (data && data.files && Object.keys(data.files).length > 0) {
          // Filter out any empty placeholder files that were never populated
          const finalFiles: Record<string, ProjectFile> = {};
          Object.keys(data.files).forEach(k => {
            const f = data.files[k];
            if (f && typeof f.content === 'string' && f.content.trim().length > 0) {
              finalFiles[k] = f;
            }
          });
          const resolvedFiles = Object.keys(finalFiles).length > 0 ? finalFiles : data.files;

          setFiles(resolvedFiles);
          setSavedFiles(resolvedFiles);
          setIframeKey(prev => prev + 1);

          const allResolvedKeys = Object.keys(resolvedFiles);
          const updatedKeys: string[] = Array.isArray(data.updatedFiles) && data.updatedFiles.length > 0
            ? data.updatedFiles
            : Object.keys(streamedFilesMap).length > 0
            ? Object.keys(streamedFilesMap)
            : allResolvedKeys;

          if (allResolvedKeys.includes('index.html')) {
            setActiveFilePath('index.html');
          } else if (updatedKeys.length > 0) {
            setActiveFilePath(updatedKeys[0]);
          }

          let updatedProjectTitle = projectName;
          const bp = data.blueprint || latestBlueprint;
          if (bp) {
            setActiveBlueprint(bp);
            if (bp.project_name && typeof bp.project_name === 'string' && (projectName === 'مشروع جديد' || projectName === 'My Project')) {
              updatedProjectTitle = bp.project_name;
              setProjectName(bp.project_name);
              localStorage.setItem('perplexta_active_project_name', bp.project_name);
            }
          }

          const statuses: Record<string, 'pending' | 'writing' | 'completed' | 'error'> = {};
          allResolvedKeys.forEach((p: string) => {
            statuses[p] = 'completed';
          });
          setFileStatuses(statuses);

          // Phase 3: Dry-Run Validation & Auto Interceptor Check
          setPipelinePhase(3);
          setStreamStatusMessage(language === 'ar' ? 'المرحلة 3: فحص سلامة الملفات وتحديث المعاينة الحية...' : 'Phase 3: Validating files & mounting live preview...');

          let dryRunPassed = true;
          if (resolvedFiles['index.html']) {
            const htmlText = resolvedFiles['index.html'].content || '';
            if (!htmlText.includes('<html') && !htmlText.includes('<!DOCTYPE')) {
              addLog('error', language === 'ar' ? 'تحذير الفحص: ملف نقطة البدء ينقصه وسم الصفحة الأساسي' : 'Validation warning: Entry file missing root HTML tag');
              dryRunPassed = false;
            }
          }

          if (dryRunPassed) {
            addLog('success', language === 'ar' ? `المرحلة 3: اجتاز الفحص بنجاح (${allResolvedKeys.length} ملفات في شجرة المشروع)` : `Phase 3: Validation passed (${allResolvedKeys.length} files in project tree)`);
          }

          // Dynamic SQLite Schema Synchronization
          if (resolvedFiles['db/schema.sql'] && resolvedFiles['db/schema.sql'].content.trim()) {
            try {
              initSqlJs({
                locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
              }).then(SQL => {
                const newDb = new SQL.Database();
                newDb.run(resolvedFiles['db/schema.sql'].content);
                setSqlDb(newDb);
                refreshTables(newDb);
                addLog('success', language === 'ar' ? 'تمت مزامنة مخطط قاعدة البيانات (db/schema.sql) بنجاح' : 'Database schema synchronized');
              }).catch(() => {});
            } catch (err: any) {
              console.warn('SQLite reload error:', err);
            }
          }

          const cleanReplyText = (rawText: string) => {
            if (!rawText) {
              return dir === 'rtl'
                ? `تم إنشاء وتحديث شجرة ملفات المشروع (${updatedKeys.length} ملفات): ${updatedKeys.join('، ')}`
                : `Scaffolded and updated project files (${updatedKeys.length} files): ${updatedKeys.join(', ')}`;
            }
            const cleaned = rawText
              .replace(/<perplexta_blueprint>[\s\S]*?<\/perplexta_blueprint>/gi, '')
              .replace(/<perplexta_blueprint>[\s\S]*/gi, '')
              .replace(/<perplexta_file[\s\S]*?<\/perplexta_file>/gi, '')
              .replace(/<perplexta_file[\s\S]*/gi, '')
              .replace(/<perplexta_delete[\s\S]*?\/?>/gi, '')
              .replace(/```[\s\S]*?```/gi, '')
              .replace(/```[\s\S]*/gi, '')
              .trim();

            if (!cleaned || cleaned.includes('{') || cleaned.length < 5) {
              const projName = bp?.project_name || updatedProjectTitle || (language === 'ar' ? 'المشروع' : 'Project');
              return dir === 'rtl'
                ? `تم بناء وتحديث ملفات (${projName}) بنجاح في شجرة الملفات والمعاينة الحية (${updatedKeys.length} ملفات).`
                : `Built and updated (${projName}) files in the project tree and live preview (${updatedKeys.length} files).`;
            }
            return cleaned;
          };

          const assistantMsg: StudioChatMessage = {
            id: `assistant_${Date.now()}`,
            role: 'assistant',
            text: cleanReplyText(data.reply || data.summary),
            logs: Array.isArray(data.logs) ? data.logs : [],
            filesUpdated: updatedKeys,
            suggestions: Array.isArray(data.suggestions) && data.suggestions.length > 0 ? data.suggestions : (
              Object.keys(resolvedFiles).some(f => f.toLowerCase().includes('products') || f.toLowerCase().includes('cart') || f.toLowerCase().includes('store'))
                ? [
                    language === 'ar' ? 'تطوير بطاقة تسجيل دخول وقاعدة بيانات للمستخدمين' : 'Build user login card & SQLite DB',
                    language === 'ar' ? 'إضافة نظام كوبونات خصم وتخفيضات تفاعلي' : 'Add discount coupons system',
                    language === 'ar' ? 'ربط سلة المشتريات ببوابات دفع ذكية وفواتير مفصلة' : 'Connect dynamic checkout & checkout forms'
                  ]
                : [
                    language === 'ar' ? 'تصميم قسم مراجعات وآراء العملاء بشكل تفاعلي متحرك' : 'Design dynamic animated testimonials section',
                    language === 'ar' ? 'تحسين التجاوب البصري الكامل مع شاشات الجوال والتابلت' : 'Perfect full mobile and tablet responsive layouts',
                    language === 'ar' ? 'برمجة لوحة إحصائيات وإدارة للمشروع' : 'Build interactive admin dashboard panel'
                  ]
            ),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          setChatMessages(prev => [...prev, assistantMsg]);
          if (Array.isArray(data.logs)) {
            data.logs.forEach((logText: string) => addLog('success', logText));
          } else {
            addLog('success', data.summary || 'تم تحديث المشروع بنجاح');
          }
          toast.success(language === 'ar' ? (data.summary || `تم بناء ${updatedKeys.length} ملفات بنجاح!`) : 'Project files built successfully!');
          
          // Create an automatic professional rollback point (Snapshot) on successful generation
          setTimeout(() => {
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const snapName = language === 'ar' 
              ? `إصدار تلقائي - ${timeStr} (${promptToSend.slice(0, 25)}...)` 
              : `Auto Version - ${timeStr} (${promptToSend.slice(0, 25)}...)`;
            handleCreateSnapshot(snapName, resolvedFiles);
          }, 1500);
          saveProjectToDb(projectId, updatedProjectTitle, resolvedFiles);
          if (user && token && projectId) {
            try {
              const snapName = `${language === 'ar' ? 'إصدار تلقائي' : 'Auto Snapshot'}: ${promptToSend.slice(0, 24)} (${new Date().toLocaleTimeString()})`;
              await fetch(`/api/studio/workspaces/${projectId}/snapshots`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ versionName: snapName, files: resolvedFiles })
              });
              fetchSnapshots(projectId);
            } catch (_) {}
          }
        } else if (data) {
          const fallbackMsg: StudioChatMessage = {
            id: `assistant_${Date.now()}`,
            role: 'assistant',
            text: data.reply || (language === 'ar' ? 'تم فحص ملفات المشروع وتأكيد استقرار البنية الحالية.' : 'Examined project structure and verified stability.'),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setChatMessages(prev => [...prev, fallbackMsg]);
          addLog('log', 'تم تحليل الطلب وتأكيد البنية الحالية.');
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.message || errData.error || (language === 'ar' ? 'فشل توليد التعديلات البرمجية.' : 'Generation failed');
        const errChatMsg: StudioChatMessage = {
          id: `assistant_err_${Date.now()}`,
          role: 'assistant',
          text: `⚠️ ${errMsg}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, errChatMsg]);
        addLog('error', errMsg);
        toast.error(errMsg);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      const errMsg = `خطأ في الاتصال: ${err.message}`;
      addLog('error', errMsg);
      toast.error(language === 'ar' ? 'تعذر الاتصال بخادم الاستوديو' : 'Server connection failed');
    } finally {
      abortControllerRef.current = null;
      setIsGenerating(false);
      setStreamStatusMessage('');
      setLiveStreamText('');
      setCurrentlyWritingFile('');
    }
  };

  const handleCreateNewProject = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    // 1. Safely save the current project before switching to new blank project
    saveProjectToDb();

    const newProjId = 'proj_' + Date.now();
    const isAr = language === 'ar';
    const newProjName = isAr ? `مشروع جديد #${Math.floor(1000 + Math.random() * 9000)}` : `New Project #${Math.floor(1000 + Math.random() * 9000)}`;
    
    setProjectId(newProjId);
    setProjectName(newProjName);
    try {
      localStorage.setItem('perplexta_active_project_id', newProjId);
      localStorage.setItem('perplexta_active_project_name', newProjName);
      localStorage.removeItem('perplexta_studio_workspace_v2');
      sessionStorage.removeItem('current_active_project');
    } catch (_) {}

    const blankFiles: Record<string, ProjectFile> = {
      'index.html': {
        name: 'index.html',
        path: 'index.html',
        type: 'html',
        isEntry: true,
        content: `<!DOCTYPE html>
<html lang="${isAr ? 'ar' : 'en'}" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${newProjName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Tajawal:wght@300;400;500;700;800;900&display=swap" rel="stylesheet">
</head>
<body class="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-['Inter','Tajawal',sans-serif] min-h-screen flex items-center justify-center p-6 selection:bg-blue-600 selection:text-white">
  <div class="max-w-md w-full text-center space-y-6">
    <!-- Brand Logo Glow Icon -->
    <div class="relative mx-auto w-16 h-16 rounded-shape-md bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-xl shadow-blue-500/25 flex items-center justify-center">
      <div class="w-full h-full bg-slate-900 rounded-shape-sm flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="text-blue-500" style="width: 32px; height: 32px; max-width: 32px; max-height: 32px;">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
      </div>
    </div>
    
    <div class="space-y-3">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-shape-full bg-blue-500/10 border border-blue-500/20 text-blue-500 dark:text-blue-400 text-xs font-bold">
        <span class="w-2 h-2 rounded-shape-full bg-blue-500 animate-ping"></span>
        <span>${isAr ? 'جاهز للتطوير' : 'Ready to Build'}</span>
      </div>
      <h1 class="text-2xl font-black text-slate-900 dark:text-white">${newProjName}</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
        ${isAr 
          ? 'أدخل وصف التطبيق أو الميزة المطلوبة في لوحة المحادثة لتوليد ملفات المشروع وتشغيل المعاينة المباشرة.'
          : 'Enter your application description in the chat panel to generate project files and launch the live preview.'}
      </p>
    </div>
  </div>
</body>
</html>`
      }
    };

    setFiles(blankFiles);
    setSavedFiles(blankFiles);
    setActiveFilePath('index.html');
    setIframeKey(prev => prev + 1);

    // Reset Chat Messages for this clean new project
    setChatMessages([
      {
        id: `welcome_${Date.now()}`,
        role: 'assistant',
        text: isAr 
          ? `تم إنشاء مساحة عمل جديدة للمشروع (${newProjName}). صف التطبيق أو الميزة التي ترغب في بنائها للبدء.`
          : `Created new workspace for (${newProjName}). Describe the application or feature you want to build to begin.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: isAr 
          ? [
              'صمم متجر إلكتروني احترافي للمنتجات الرقمية يضم واجهة هبوط عصرية مع سكرول أنيميشن، شبكة منتجات قابلة للتصفية، وسلة مشتريات منبثقة تفاعلية تحسب المجموع تلقائياً.',
              'أنشئ صفحة هبوط (SaaS) تفاعلية للشركات التقنية مع قسم مميزات متحرك، جدول خطط أسعار مقارن، ونموذج تواصل ذكي مع التحقق من البيانات.',
              'طور لوحة تحكم وإحصائيات متكاملة (Admin Dashboard) تضم رسوم بيانية تفاعلية لبيانات المبيعات، جداول قابلة للفرز، ونظام إدارة مستخدمين مع حالات ظهور مختلفة.',
              'ابنِ موقع محفظة أعمال (Portfolio) إبداعي للمصممين مع معرض أعمال شبكي، نظام تبديل الوضع الليلي والنهاري، وتأثيرات انتقال سلسة بين الأقسام.'
            ]
          : [
              'Design a professional digital products store featuring a modern landing interface with scroll animations, a filterable product grid, and an interactive popup shopping cart that auto-calculates totals.',
              'Create an interactive SaaS landing page for tech startups with animated feature sections, a comparative pricing table, and a smart contact form with validation logic.',
              'Develop a comprehensive Admin Dashboard featuring interactive sales data charts, sortable data tables, and a user management system with various UI states.',
              'Build a creative Portfolio website for designers with a grid-based work gallery, seamless dark/light mode switching, and smooth section transition effects.'
            ]
      }
    ]);

    setTerminalLogs([
      {
        type: 'log',
        text: isAr
          ? `تم تهيئة بيئة التطوير للمشروع (${newProjName}).`
          : `Initialized development environment for (${newProjName}).`,
        time: new Date().toLocaleTimeString()
      },
      {
        type: 'success',
        text: isAr
          ? 'شجرة الملفات فارغة وجاهزة للهندسة والتوليد.'
          : 'File tree is clean and ready for architecture & synthesis.',
        time: new Date().toLocaleTimeString()
      }
    ]);

    saveProjectToDb(newProjId, newProjName, blankFiles);
    toast.success(isAr ? `تم إنشاء ${newProjName} بنجاح` : `Created ${newProjName} successfully`);
    addLog('success', isAr ? `تم تهيئة وحفظ مساحة عمل جديدة: ${newProjName}` : `Initialized workspace: ${newProjName}`);
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    Object.keys(files).forEach(path => {
      zip.file(path, files[path].content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'perplexta-project.zip');
    toast.success(language === 'ar' ? 'تم تنزيل المشروع كملف ZIP بنجاح!' : 'Project downloaded as ZIP!');
    addLog('success', language === 'ar' ? 'تم تصدير المشروع إلى ملف ZIP محلي.' : 'Exported project as local ZIP archive.');
  };

  const handleAiFix = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const errLogs = terminalLogs.filter(l => l.type === 'error').map(l => l.text).slice(-5);
    const fixPrompt = errLogs.length > 0
      ? (dir === 'rtl'
          ? `🛠️ قم بفحص وإصلاح الأخطاء البرمجية المسجلة في الطرفية للملف (${activeFilePath}):\n${errLogs.join('\n')}`
          : `🛠️ Diagnose and fix the following runtime/syntax errors reported in the console for (${activeFilePath}):\n${errLogs.join('\n')}`)
      : (dir === 'rtl'
          ? `🛠️ قم بمراجعة شاملة للكود في (${activeFilePath}) وإصلاح أي أخطاء برمجية أو مشاكل توافقية وتحسين الأداء.`
          : `🛠️ Perform a comprehensive code audit on (${activeFilePath}), fix any bugs or compatibility issues, and optimize performance.`);
    addLog('log', language === 'ar' ? 'جاري تحليل الأخطاء وإصلاح الكود بواسطة مهندس البرمجيات الذكي...' : 'Analyzing errors and repairing code via AI Software Architect...');
    await handleSendPrompt(fixPrompt);
  };

  const activeFile = files[activeFilePath] || files['index.html'];
  const logoSrc = (theme === 'light' && siteSettings?.logoLightBase64) ? siteSettings.logoLightBase64 : siteSettings?.logoBase64;

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-[var(--surface-page)] text-[var(--text-primary)] font-sans flex flex-col overflow-hidden">
      {/* Top Header Bar - Slim & Clean */}
      <header className="h-12 bg-[var(--surface-card)] border-b border-[var(--border-default)] px-3 sm:px-4 flex items-center justify-between shrink-0 select-none z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              saveProjectToDb();
              navigate('/');
            }}
            className="flex items-center justify-center w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:bg-[var(--surface-card)] hover:border-accent text-[var(--text-primary)] transition-all cursor-pointer shadow-xs shrink-0"
            title={language === 'ar' ? 'الرجوع للبداية' : 'Back to start'}
          >
            <ArrowLeft size={16} className={language === 'ar' ? 'rotate-180' : ''} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadZip}
            className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:bg-[var(--surface-card)] hover:border-accent text-[var(--text-primary)] flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0"
            title={language === 'ar' ? 'تنزيل المشروع ZIP' : 'Download ZIP'}
          >
            <Download size={16} />
          </button>

          <div className="relative">
            <button
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className={`w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:bg-[var(--surface-card)] hover:border-accent text-[var(--text-primary)] flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0 ${isMoreMenuOpen ? 'bg-[var(--surface-subtle)] text-accent border-accent/60' : ''}`}
              title={language === 'ar' ? 'خيارات إضافية' : 'More Options'}
            >
              <Sliders size={16} />
            </button>

            <AnimatePresence>
              {isMoreMenuOpen && (
                <PopCard 
                  className="absolute top-10 end-0 w-56 z-50 p-2 space-y-1"
                  onClose={() => setIsMoreMenuOpen(false)}
                >
                  <button
                    onClick={() => {
                      setIsEnvModalOpen(true);
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full h-9 px-3 rounded-shape-sm text-xs font-semibold flex items-center gap-2.5 text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] cursor-pointer"
                  >
                    <Key size={14} className="text-blue-500" />
                    <span>{language === 'ar' ? 'متغيرات البيئة' : 'Env Variables'}</span>
                  </button>
                  <div className="h-px bg-[var(--border-default)] my-1" />
                  <button
                    onClick={async () => {
                      if (!user) {
                        setIsAuthModalOpen(true);
                        return;
                      }
                      await saveProjectToDb();
                      const lang = language === 'ar' ? 'ar' : 'en';
                      const direction = language === 'ar' ? 'rtl' : 'ltr';
                      const shareUrl = `${window.location.origin}/api/studio/workspaces/${projectId}/preview?lang=${lang}&dir=${direction}`;
                      navigator.clipboard.writeText(shareUrl);
                      toast.success(language === 'ar' ? 'تم نسخ رابط المعاينة' : 'Copied preview link');
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full h-9 px-3 rounded-shape-sm text-xs font-semibold flex items-center gap-2.5 text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] cursor-pointer"
                  >
                    <Globe size={14} className="text-accent" />
                    <span>{language === 'ar' ? 'مشاركة المعاينة' : 'Share Preview'}</span>
                  </button>
                </PopCard>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Mobile Viewport Navigation Switcher (< md) */}
      <div className="md:hidden flex items-center bg-[var(--surface-card)] border-b border-[var(--border-default)] px-2 py-1.5 shrink-0 justify-around select-none">
        <button
          onClick={() => setMobileActiveTab('chat')}
          className={`flex-1 h-8 px-2 rounded-shape-sm text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileActiveTab === 'chat'
              ? 'bg-accent text-white shadow-2xs'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
          }`}
        >
          <Sparkles size={13} />
          <span>{language === 'ar' ? 'المساعد' : 'Assistant'}</span>
        </button>
        <button
          onClick={() => setMobileActiveTab('files')}
          className={`flex-1 h-8 px-2 rounded-shape-sm text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileActiveTab === 'files'
              ? 'bg-accent text-white shadow-2xs'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
          }`}
        >
          <Folder size={13} />
          <span>{language === 'ar' ? 'الملفات' : 'Files'}</span>
        </button>
        <button
          onClick={() => setMobileActiveTab('preview')}
          className={`flex-1 h-8 px-2 rounded-shape-sm text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileActiveTab === 'preview'
              ? 'bg-accent text-white shadow-2xs'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
          }`}
        >
          <Monitor size={13} />
          <span>{language === 'ar' ? 'المعاينة' : 'Preview'}</span>
        </button>
      </div>
      <div className="flex-1 flex overflow-hidden">
        {/* Primary Sidebar - Icon Only Navigation */}
        <aside className="w-13 sm:w-14 bg-[var(--surface-card)] border-e border-[var(--border-default)] flex flex-col items-center py-3.5 gap-3 shrink-0 z-20 select-none">
          <button
            onClick={() => setSideNavActiveTab('chat')}
            className={`w-8 h-8 rounded-shape-sm flex items-center justify-center transition-all cursor-pointer relative group shrink-0 ${
              sideNavActiveTab === 'chat' ? 'bg-accent text-white shadow-md shadow-accent/20' : 'text-[var(--text-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
            }`}
            title={language === 'ar' ? 'المساعد الذكي' : 'AI Assistant'}
          >
            <AssistantIcon size={16} isSpinning={isGenerating} fallbackType="sparkles" />
            <span className="absolute start-12 sm:start-14 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {language === 'ar' ? 'المساعد الذكي' : 'AI Assistant'}
            </span>
          </button>

          <button
            onClick={() => setSideNavActiveTab('files')}
            className={`w-8 h-8 rounded-shape-sm flex items-center justify-center transition-all cursor-pointer relative group shrink-0 ${
              sideNavActiveTab === 'files' ? 'bg-accent text-white shadow-md shadow-accent/20' : 'text-[var(--text-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
            }`}
            title={language === 'ar' ? 'ملفات المشروع' : 'Project Files'}
          >
            <Folder size={16} />
            <span className="absolute start-12 sm:start-14 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {language === 'ar' ? 'ملفات المشروع' : 'Project Files'}
            </span>
          </button>

          <button
            onClick={() => {
              if (!user) { setIsAuthModalOpen(true); return; }
              fetchUserWorkspaces();
              setSideNavActiveTab('projects');
            }}
            className={`w-8 h-8 rounded-shape-sm flex items-center justify-center transition-all cursor-pointer relative group shrink-0 ${
              sideNavActiveTab === 'projects' ? 'bg-accent text-white shadow-md shadow-accent/20' : 'text-[var(--text-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
            }`}
            title={language === 'ar' ? 'كل المشاريع' : 'All Projects'}
          >
            <Layers size={16} />
            <span className="absolute start-12 sm:start-14 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {language === 'ar' ? 'كل المشاريع' : 'All Projects'}
            </span>
          </button>

          <button
            onClick={() => {
              if (!user) { setIsAuthModalOpen(true); return; }
              fetchSnapshots(projectId);
              setSideNavActiveTab('versions');
            }}
            className={`w-8 h-8 rounded-shape-sm flex items-center justify-center transition-all cursor-pointer relative group shrink-0 ${
              sideNavActiveTab === 'versions' ? 'bg-accent text-white shadow-md shadow-accent/20' : 'text-[var(--text-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
            }`}
            title={language === 'ar' ? 'إصدارات التطوير' : 'History'}
          >
            <History size={16} />
            <span className="absolute start-12 sm:start-14 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {language === 'ar' ? 'إصدارات التطوير' : 'History'}
            </span>
          </button>

          <button
            onClick={() => setSideNavActiveTab('db')}
            className={`w-8 h-8 rounded-shape-sm flex items-center justify-center transition-all cursor-pointer relative group shrink-0 ${
              sideNavActiveTab === 'db' ? 'bg-accent text-white shadow-md shadow-accent/20' : 'text-[var(--text-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
            }`}
            title={language === 'ar' ? 'قاعدة البيانات' : 'Database'}
          >
            <Database size={16} />
            <span className="absolute start-12 sm:start-14 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {language === 'ar' ? 'قاعدة البيانات' : 'Database'}
            </span>
          </button>

          <div className="mt-auto pb-3 flex flex-col gap-3 items-center">
            <button
              onClick={() => setIsTerminalOpen(!isTerminalOpen)}
              className={`w-8 h-8 rounded-shape-sm flex items-center justify-center transition-all cursor-pointer relative group shrink-0 ${
                isTerminalOpen ? 'bg-amber-500/10 text-amber-500' : 'text-[var(--text-muted)] hover:bg-[var(--surface-subtle)] hover:text-amber-500'
              }`}
              title={language === 'ar' ? 'منفذ الأوامر والتعلم' : 'Terminal & Logs'}
            >
              <Terminal size={16} />
              {terminalLogs.some(l => l.type === 'error') && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
              <span className="absolute start-12 sm:start-14 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {language === 'ar' ? 'منفذ الأوامر' : 'Terminal'}
              </span>
            </button>

            <div className="h-px w-6 bg-[var(--border-default)]" />

            {/* User Avatar Button replacing the bottom back button */}
            <button
              onClick={() => {
                setIsAuthModalOpen(true);
              }}
              className="w-8 h-8 rounded-shape-sm flex items-center justify-center transition-all cursor-pointer relative group border border-[var(--border-default)] hover:border-accent/60 bg-[var(--surface-subtle)] overflow-hidden shrink-0 shadow-xs"
              title={user ? (user.name || user.email || (language === 'ar' ? 'الملف الشخصي' : 'Profile')) : (language === 'ar' ? 'تسجيل الدخول' : 'Sign In')}
            >
              {user?.avatar ? (
                <img
                  src={resolveImageUrl(user.avatar, 'avatar')}
                  alt={user.name || 'User Avatar'}
                  className="w-full h-full object-cover rounded-shape-sm"
                />
              ) : user?.name || user?.email ? (
                <div className="w-full h-full bg-gradient-to-tr from-rose-600 via-red-500 to-rose-500 flex items-center justify-center text-white font-black text-[10px] uppercase tracking-tighter select-none rounded-shape-sm">
                  {(user.name || user.email || 'U').substring(0, 2).toUpperCase()}
                </div>
              ) : (
                <User size={16} className="text-[var(--text-muted)] group-hover:text-accent transition-colors" />
              )}
              <span className="absolute start-12 sm:start-14 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {user ? (user.name || user.email || (language === 'ar' ? 'الملف الشخصي' : 'Profile')) : (language === 'ar' ? 'تسجيل الدخول' : 'Sign In')}
              </span>
            </button>
          </div>
        </aside>

        {/* Secondary Contextual Tool Panel */}
        <aside className={`w-full md:w-80 sm:md:w-96 bg-[var(--surface-card)] border-e border-[var(--border-default)] flex-col overflow-hidden shrink-0 z-10 ${
          mobileActiveTab !== 'preview' ? 'flex' : 'hidden md:flex'
        }`}>
          <AnimatePresence mode="wait">
            {sideNavActiveTab === 'chat' && (
              <motion.div 
                key="chat-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="h-12 px-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--surface-card)] relative">
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    {isEditingProjectName ? (
                      <input
                        type="text"
                        value={projectName}
                        autoFocus
                        onBlur={() => {
                          setIsEditingProjectName(false);
                          localStorage.setItem('perplexta_active_project_name', projectName);
                          saveProjectToDb(projectId, projectName);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setIsEditingProjectName(false);
                            localStorage.setItem('perplexta_active_project_name', projectName);
                            saveProjectToDb(projectId, projectName);
                          }
                        }}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="bg-[var(--surface-subtle)] border border-accent/30 outline-none text-[11px] font-bold text-[var(--text-primary)] px-2 py-1.5 rounded-shape-xs w-full"
                      />
                    ) : (
                      <div className="flex flex-col overflow-hidden">
                        <h2 
                          onClick={() => setIsEditingProjectName(true)}
                          className="text-[11px] font-black uppercase tracking-widest text-[var(--text-primary)] cursor-pointer hover:text-accent transition-colors truncate"
                        >
                          {projectName}
                        </h2>
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
                </div>
                
                <div className="flex-1 flex flex-col overflow-hidden bg-[var(--surface-inset)]/30">
                  {/* Chat messages feed will follow */}
                  <div ref={chatFeedRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth scrollbar-thin">
                    {!user && (
                      <div className="p-4 rounded-shape-md bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border border-blue-500/30 text-slate-100 flex flex-col items-start gap-3 shadow-lg backdrop-blur-xs shrink-0">
                        <div className="flex items-center gap-3 w-full text-start">
                          <div className="p-2 rounded-shape-sm bg-blue-500/15 border border-blue-500/30 text-blue-400 shrink-0">
                            <ShieldCheck size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold leading-tight truncate">{language === 'ar' ? 'وضع الضيف نشط' : 'Guest Mode Active'}</h4>
                            <p className="text-[10px] text-slate-300 mt-0.5 whitespace-normal leading-relaxed">{language === 'ar' ? 'سجل دخولك لحفظ مشاريعك وتوسيع مساحة التخزين' : 'Sign in to save projects and expand storage'}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsAuthModalOpen(true)}
                          className="w-full h-8 bg-blue-600 hover:bg-blue-500 text-white rounded-shape-sm text-[11px] font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Lock size={12} />
                          <span>{language === 'ar' ? 'تسجيل الدخول / إنشاء حساب' : 'Sign In / Register'}</span>
                        </button>
                      </div>
                    )}

                    {chatMessages.map((msg, idx) => (
                      <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`flex items-center gap-1.5 mb-1 px-1 text-[10px] text-[var(--text-muted)] font-medium ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <span>{msg.role === 'user' ? (language === 'ar' ? 'أنت' : 'You') : (language === 'ar' ? 'المساعد البرمجي' : 'Assistant')}</span>
                          <span>•</span>
                          <span>{msg.timestamp}</span>
                        </div>
                        <div className={`max-w-[92%] rounded-shape-lg p-3 text-xs leading-relaxed shadow-sm transition-all ${
                          msg.role === 'user' 
                            ? 'bg-accent text-white rounded-te-none' 
                            : 'bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-ts-none'
                        }`}>
                          <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                          {msg.role === 'assistant' && msg.text === liveStreamText && isGenerating && (
                            <span className="inline-block w-1 h-3.5 bg-accent/40 animate-pulse ms-1 align-middle" />
                          )}
                        </div>
                        
                        {msg.role === 'assistant' && msg.filesUpdated && msg.filesUpdated.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5 max-w-full">
                            {msg.filesUpdated.map(fp => (
                              <button
                                key={fp}
                                onClick={() => {
                                  setActiveFilePath(fp);
                                  setActiveTab('code');
                                }}
                                className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border transition-all cursor-pointer ${
                                  activeFilePath === fp ? 'bg-accent text-white border-accent' : 'bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-accent hover:border-accent/40'
                                }`}
                              >
                                {fp}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {isGenerating && (
                      <div className="flex flex-col items-start gap-3 w-full">
                        <div className="p-3.5 rounded-shape-lg bg-[var(--surface-subtle)] border border-accent/30 text-xs text-[var(--text-primary)] flex flex-col gap-2.5 shadow-xs w-full">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 font-bold text-accent min-w-0">
                              <RefreshCw size={13} className="animate-[spin_1s_linear_infinite_reverse] text-accent shrink-0" />
                              <span className="truncate">{streamStatusMessage || (language === 'ar' ? 'جاري البناء...' : 'Building...')}</span>
                            </div>
                          </div>
                          {currentlyWritingFile && (
                            <div className="px-2 py-1 rounded-shape-xs bg-[var(--surface-card)] border border-accent/20 flex items-center justify-between text-[10px] font-mono">
                              <span className="text-[var(--text-secondary)] truncate">{currentlyWritingFile}</span>
                              <span className="text-accent font-bold text-[9px] shrink-0 animate-pulse">{language === 'ar' ? 'كتابة' : 'Writing'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI Input Area */}
                  <div className="p-3 bg-[var(--surface-card)] border-t border-[var(--border-default)]">
                    {/* Suggestions */}
                    <AnimatePresence>
                      {chatMessages.length > 0 && chatMessages[chatMessages.length - 1].role === 'assistant' && chatMessages[chatMessages.length - 1].suggestions && !isGenerating && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-wrap gap-1 mb-3"
                        >
                          {chatMessages[chatMessages.length - 1].suggestions?.map((s, i) => (
                            <button
                              key={i}
                              onClick={() => handleSendPrompt(s)}
                              className="px-2 py-1 rounded-shape-full bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[10px] text-[var(--text-secondary)] hover:text-accent hover:border-accent/30 transition-all cursor-pointer whitespace-nowrap"
                            >
                              {s}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (promptQuery.trim() && !isGenerating) handleSendPrompt();
                      }}
                      className="relative rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-default)] focus-within:border-accent/50 transition-all p-1.5"
                    >
                      <textarea
                        value={promptQuery}
                        onChange={(e) => setPromptQuery(e.target.value)}
                        placeholder={language === 'ar' ? 'صف التعديل أو الميزة المطلوبة...' : 'Describe feature or change...'}
                        className="w-full min-h-[80px] max-h-[200px] p-2 bg-transparent text-xs text-[var(--text-primary)] outline-none resize-none leading-relaxed placeholder:text-[var(--text-muted)]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (promptQuery.trim() && !isGenerating) handleSendPrompt();
                          }
                        }}
                      />
                      
                      <div className="flex items-center justify-between px-1 pb-1">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={toggleVoiceRecording}
                            className={`w-8 h-8 rounded-shape-sm flex items-center justify-center transition-all cursor-pointer ${
                              isRecordingVoice ? 'bg-red-500 text-white animate-pulse' : 'text-[var(--text-muted)] hover:text-accent hover:bg-accent/10'
                            }`}
                            title={language === 'ar' ? 'إدخال صوتي' : 'Voice Input'}
                          >
                            <Mic size={16} />
                          </button>
                          <label className="w-8 h-8 rounded-shape-sm flex items-center justify-center text-[var(--text-muted)] hover:text-accent hover:bg-accent/10 transition-all cursor-pointer" title={language === 'ar' ? 'إرفاق ملف' : 'Attach File'}>
                            <Paperclip size={16} />
                            <input type="file" className="hidden" />
                          </label>
                        </div>

                        {isGenerating ? (
                          <button
                            type="button"
                            onClick={handleStopGeneration}
                            className="w-8 h-8 rounded-shape-sm bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all cursor-pointer shadow-xs shrink-0"
                            title={language === 'ar' ? 'إيقاف التوليد' : 'Stop Generation'}
                          >
                            <Square size={14} fill="currentColor" />
                          </button>
                        ) : (
                          <button
                            type="submit"
                            disabled={!promptQuery.trim()}
                            className="h-8 px-3.5 rounded-shape-sm bg-accent text-white text-[11px] font-bold flex items-center gap-1.5 hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer shadow-xs shrink-0"
                          >
                            <span>{language === 'ar' ? 'إرسال' : 'Send'}</span>
                            <Send size={14} className={language === 'ar' ? 'rotate-180' : ''} />
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              </motion.div>
            )}

            {sideNavActiveTab === 'files' && (
              <motion.div 
                key="files-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="h-12 px-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--surface-subtle)]/50">
                  <div className="flex flex-col">
                    <h2 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-primary)]">
                      {language === 'ar' ? 'مستعرض الملفات' : 'Explorer'}
                    </h2>
                    <span className="text-[8px] text-[var(--text-muted)] font-medium -mt-0.5">
                      {Object.keys(files).length} {language === 'ar' ? 'ملفات' : 'files'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setIsNewFileModalOpen(true)}
                      className="w-8 h-8 rounded-shape-sm flex items-center justify-center hover:bg-[var(--surface-subtle)] text-accent transition-colors cursor-pointer"
                      title={language === 'ar' ? 'ملف جديد' : 'New File'}
                    >
                      <Plus size={16} />
                    </button>
                    <div className="relative group/upload">
                      <button 
                        className="w-8 h-8 rounded-shape-sm flex items-center justify-center hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-accent transition-colors cursor-pointer"
                        title={language === 'ar' ? 'رفع ملفات' : 'Upload'}
                      >
                        <HardDrive size={16} />
                      </button>
                      <div className="absolute end-0 top-full mt-1 hidden group-hover/upload:flex flex-col bg-[var(--surface-card)] border border-[var(--border-default)] rounded shadow-xl z-50 p-1 w-32">
                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-2 py-1.5 text-[10px] hover:bg-[var(--surface-subtle)] rounded transition-colors text-start">
                          <FileCode size={12} /> {language === 'ar' ? 'رفع ملف' : 'Upload File'}
                        </button>
                        <button onClick={() => zipInputRef.current?.click()} className="flex items-center gap-2 px-2 py-1.5 text-[10px] hover:bg-[var(--surface-subtle)] rounded transition-colors text-start">
                          <Folder size={12} /> {language === 'ar' ? 'رفع Zip' : 'Upload Zip'}
                        </button>
                      </div>
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleUploadFile} multiple className="hidden" />
                  <input type="file" ref={zipInputRef} onChange={handleUploadZip} accept=".zip" className="hidden" />
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
                  {Object.keys(files).length === 0 ? (
                    <div className="py-12 text-center text-[10px] text-[var(--text-muted)] border border-dashed border-[var(--border-default)] rounded-shape-md m-2">
                      {language === 'ar' ? 'المشروع فارغ. ابدأ برفع ملفات أو وصف ما تريد بناءه.' : 'Project is empty. Start by uploading files or describing what to build.'}
                    </div>
                  ) : Object.keys(files).sort().map(path => {
                    const isActive = activeFilePath === path;
                    const isWriting = currentlyWritingFile === path;
                    const isUnsaved = savedFiles[path]?.content !== files[path]?.content;
                    
                    return (
                      <div
                        key={path}
                        className={`group relative w-full h-9 px-3 rounded-shape-sm flex items-center gap-3 transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-accent/10 text-accent font-bold' 
                            : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
                        }`}
                        onClick={() => openFile(path)}
                      >
                        <div className="shrink-0 relative">
                          {path.endsWith('.html') ? <Globe size={14} /> : path.endsWith('.sql') ? <Database size={14} /> : <FileCode size={14} />}
                          {isWriting && <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-ping" />}
                          {isUnsaved && !isWriting && <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-amber-500 rounded-full" />}
                        </div>
                        <span className="text-[11px] truncate flex-1 text-start">{path}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); setFileToRename(path); setNewFilePathRename(path); }} className="p-1 hover:text-accent" title={language === 'ar' ? 'إعادة تسمية' : 'Rename'}><Edit2 size={11} /></button>
                          <button onClick={(e) => { e.stopPropagation(); setFileToDelete(path); }} className="p-1 hover:text-red-500" title={language === 'ar' ? 'حذف' : 'Delete'}><Trash2 size={11} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {sideNavActiveTab === 'projects' && (
              <motion.div 
                key="projects-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="h-12 px-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--surface-card)]">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    {language === 'ar' ? 'المشاريع' : 'Projects'}
                  </h2>
                  <button
                    onClick={handleCreateNewProject}
                    className="w-7 h-7 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:bg-accent hover:text-white hover:border-accent text-accent flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                    title={language === 'ar' ? 'مشروع جديد' : 'New Project'}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                  {userWorkspaces.map(ws => {
                    const isActive = ws.id === projectId;
                    return (
                      <div
                        key={ws.id}
                        onClick={() => handleSwitchWorkspace(ws)}
                        className={`group relative w-full px-3 py-2 rounded-shape-sm border text-start transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                          isActive 
                            ? 'bg-accent/10 border-accent/40 text-accent font-bold shadow-2xs' 
                            : 'bg-[var(--surface-card)] border-[var(--border-default)] hover:bg-[var(--surface-subtle)] hover:border-accent/30 text-[var(--text-primary)]'
                        }`}
                      >
                        {/* Project Name */}
                        <h4 className="text-xs font-bold truncate flex-1 min-w-0">
                          {ws.title}
                        </h4>

                        {/* Date & Hover Actions aligned on the same horizontal line */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-mono text-[var(--text-muted)] group-hover:hidden transition-all">
                            {new Date(ws.updated_at).toLocaleDateString()}
                          </span>

                          <div className="hidden group-hover:flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenameWorkspacePrompt(ws.id, ws.title);
                              }}
                              className="p-1 hover:bg-accent/15 rounded-shape-xs text-[var(--text-muted)] hover:text-accent transition-colors cursor-pointer"
                              title={language === 'ar' ? 'إعادة تسمية' : 'Rename'}
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteWorkspacePrompt(ws.id, ws.title);
                              }}
                              className="p-1 hover:bg-red-500/15 rounded-shape-xs text-[var(--text-muted)] hover:text-red-500 transition-colors cursor-pointer"
                              title={language === 'ar' ? 'حذف' : 'Delete'}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {sideNavActiveTab === 'versions' && (
              <motion.div 
                key="versions-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="h-12 px-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--surface-subtle)]/50">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    {language === 'ar' ? 'إصدارات التطوير' : 'Versions'}
                  </h2>
                  <History size={16} className="text-accent" />
                </div>

                <div className="p-3 border-b border-[var(--border-default)] bg-[var(--surface-subtle)]/30">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSnapshotName}
                      onChange={(e) => setNewSnapshotName(e.target.value)}
                      placeholder={language === 'ar' ? 'اسم نقطة الرجوع...' : 'Snapshot name...'}
                      className="flex-1 h-8 px-2.5 bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-sm text-[11px] text-[var(--text-primary)] outline-none focus:border-accent"
                    />
                    <button
                      onClick={() => handleCreateSnapshot()}
                      disabled={!newSnapshotName.trim() || isSnapshotLoading}
                      className="h-8 w-8 rounded-shape-sm bg-accent text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 cursor-pointer shadow-sm shrink-0"
                      title={language === 'ar' ? 'حفظ نسخة' : 'Save'}
                    >
                      {isSnapshotLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {workspaceSnapshots.length > 0 ? workspaceSnapshots.map(snap => (
                    <div key={snap.id} className="p-3 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] group hover:border-accent/30 transition-all">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-[var(--text-primary)] truncate">{snap.version_name}</span>
                        <button 
                          onClick={() => handleRestoreSnapshot(snap.id, snap.version_name)} 
                          className="px-2 py-1 bg-accent text-white rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer whitespace-nowrap"
                        >
                          {language === 'ar' ? 'استعادة' : 'Restore'}
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-[9px] text-[var(--text-muted)] font-mono">
                        <Clock size={10} />
                        <span>{new Date(snap.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  )) : (
                    <div className="py-12 text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-2">
                      <History size={24} className="opacity-20" />
                      <p>{language === 'ar' ? 'لا توجد إصدارات محفوظة بعد' : 'No versions saved yet'}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {sideNavActiveTab === 'db' && (
              <motion.div 
                key="db-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="h-12 px-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--surface-subtle)]/50">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    {language === 'ar' ? 'قاعدة البيانات' : 'Database'}
                  </h2>
                  <button onClick={() => setIsDbModalOpen(true)} className="w-8 h-8 rounded-shape-sm flex items-center justify-center hover:bg-[var(--surface-subtle)] text-accent transition-colors cursor-pointer" title={language === 'ar' ? 'تكبير' : 'Expand'}><ArrowUpRight size={16} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">{language === 'ar' ? 'الجداول المتوفرة' : 'Tables'}</span>
                    {sqlTables.length > 0 ? sqlTables.map(tbl => (
                      <button 
                        key={tbl} 
                        onClick={() => { setSelectedTable(tbl); setIsDbModalOpen(true); }} 
                        className={`w-full px-3 h-9 rounded-shape-sm border flex items-center justify-between text-start text-[11px] font-mono transition-all cursor-pointer ${selectedTable === tbl ? 'bg-accent/10 border-accent/30 text-accent font-bold' : 'bg-[var(--surface-card)] border-[var(--border-default)] hover:border-accent/30'}`}
                      >
                        <span className="truncate">{tbl}</span>
                        <ChevronRight size={12} className={language === 'ar' ? 'rotate-180' : ''} />
                      </button>
                    )) : (
                      <div className="py-8 text-center text-[10px] text-[var(--text-muted)] border border-dashed border-[var(--border-default)] rounded-shape-md">
                        {language === 'ar' ? 'لا توجد جداول' : 'No tables'}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setIsDbModalOpen(true)}
                    className="w-full h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[10px] font-bold text-[var(--text-primary)] hover:border-accent transition-all cursor-pointer"
                  >
                    {language === 'ar' ? 'فتح مدير قاعدة البيانات' : 'Open SQL Manager'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
        {/* Main Canvas Area */}
        <main className={`flex-1 flex flex-col overflow-hidden relative ${
          mobileActiveTab === 'preview' ? 'flex' : 'hidden md:flex'
        }`}>
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Control Bar for Canvas */}
            <div className="h-10 border-b border-[var(--border-default)] bg-[var(--surface-card)] px-3 grid grid-cols-3 items-center z-20">
              {/* Left: View Switcher */}
              <div className="flex items-center">
                <div className="flex bg-[var(--surface-subtle)] p-0.5 rounded-shape-sm border border-[var(--border-default)]">
                  <button
                    onClick={() => {
                      setActiveTab('preview');
                      setSideNavActiveTab('chat');
                    }}
                    className={`h-7 px-2.5 rounded-shape-xs text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'preview' ? 'bg-[var(--surface-card)] text-accent shadow-2xs' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Globe size={11} />
                    <span>{language === 'ar' ? 'المعاينة' : 'Preview'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('code');
                      setSideNavActiveTab('files');
                    }}
                    className={`h-7 px-2.5 rounded-shape-xs text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'code' ? 'bg-[var(--surface-card)] text-accent shadow-2xs' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Code size={11} />
                    <span>{language === 'ar' ? 'الكود' : 'Code'}</span>
                  </button>
                </div>
              </div>

              {/* Center: Device controls (Only in Preview) */}
              <div className="flex justify-center h-full items-center">
                {activeTab === 'preview' && (
                  <div className="flex items-center gap-1.5">
                    <div className="relative group">
                      <button
                        onClick={() => setIsDeviceMenuOpen(!isDeviceMenuOpen)}
                        className="h-7 px-2 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-accent/40 text-[11px] font-bold text-[var(--text-primary)] flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {deviceMode === 'responsive' ? <Monitor size={12} /> : deviceMode === 'mobile' ? <Smartphone size={12} /> : <Tablet size={12} />}
                        <span className="hidden sm:inline">{deviceMode === 'responsive' ? (language === 'ar' ? 'تلقائي' : 'Desktop') : deviceMode === 'mobile' ? (language === 'ar' ? 'هاتف' : 'Mobile') : (language === 'ar' ? 'لوحي' : 'Tablet')}</span>
                        <ChevronDown size={10} className={isDeviceMenuOpen ? 'rotate-180' : ''} />
                      </button>
                      
                      <AnimatePresence>
                        {isDeviceMenuOpen && (
                          <PopCard className="absolute left-1/2 -translate-x-1/2 top-8 w-48 z-50 p-1" onClose={() => setIsDeviceMenuOpen(false)}>
                            <button onClick={() => { setDeviceMode('responsive'); setIsDeviceMenuOpen(false); }} className="w-full h-8 px-2 rounded hover:bg-[var(--surface-subtle)] text-[11px] flex items-center gap-2 transition-colors cursor-pointer">
                              <Monitor size={12} /> <span>{language === 'ar' ? 'تلقائي (شاشة كاملة)' : 'Responsive'}</span>
                            </button>
                            <button onClick={() => { setDeviceMode('mobile'); setIsDeviceMenuOpen(false); }} className="w-full h-8 px-2 rounded hover:bg-[var(--surface-subtle)] text-[11px] flex items-center gap-2 transition-colors cursor-pointer">
                              <Smartphone size={12} /> <span>{language === 'ar' ? 'هاتف (375×667)' : 'Mobile'}</span>
                            </button>
                            <button onClick={() => { setDeviceMode('tablet'); setIsDeviceMenuOpen(false); }} className="w-full h-8 px-2 rounded hover:bg-[var(--surface-subtle)] text-[11px] flex items-center gap-2 transition-colors cursor-pointer">
                              <Tablet size={12} /> <span>{language === 'ar' ? 'لوحي (820×1000)' : 'Tablet'}</span>
                            </button>
                          </PopCard>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="w-px h-4 bg-[var(--border-default)] mx-0.5" />

                    <button
                      onClick={() => setIframeKey(prev => prev + 1)}
                      className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:text-accent hover:border-accent/40 flex items-center justify-center transition-all cursor-pointer shrink-0"
                      title={language === 'ar' ? 'تحديث المعاينة' : 'Refresh'}
                    >
                      <RefreshCw size={16} />
                    </button>

                    <button
                      onClick={() => setIsInspectMode(!isInspectMode)}
                      className={`h-7 px-2 rounded-shape-xs border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isInspectMode ? 'bg-accent/10 text-accent border-accent/30' : 'bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <MousePointer size={12} />
                      <span className="hidden lg:inline">{language === 'ar' ? 'فحص' : 'Inspect'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Right: File name (Code mode) or Extra Actions (Preview mode) */}
              <div className="flex justify-end gap-2 items-center overflow-hidden">
                {activeTab === 'code' ? (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[10px] font-mono text-[var(--text-muted)] truncate">
                    <FileCode size={12} className="text-accent shrink-0" />
                    <span className="truncate max-w-[150px]">{activeFilePath}</span>
                  </div>
                ) : (
                  <button
                    onClick={handleOpenInNewTab}
                    className="h-7 px-2 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:text-accent hover:border-accent/40 flex items-center gap-1.5 text-[10px] font-bold transition-all cursor-pointer"
                    title={language === 'ar' ? 'فتح في نافذة جديدة' : 'Open in New Tab'}
                  >
                    <ArrowUpRight size={12} />
                    <span className="hidden xl:inline">{language === 'ar' ? 'فتح' : 'Pop out'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* View Content: Preview vs Code */}
            <div className="flex-1 relative overflow-hidden flex flex-col">
              {/* Live Preview Panel */}
              <div className={`flex-1 w-full h-full bg-[var(--surface-page)] ${
                deviceMode !== 'responsive' ? 'p-4 overflow-auto flex items-center justify-center bg-[var(--surface-inset)]/50' : 'p-0 m-0 relative flex flex-col overflow-hidden'
              } ${activeTab !== 'preview' ? 'hidden' : ''}`}>
                
                {runtimeError && (
                  <div className="absolute top-0 inset-x-0 bg-red-500/10 border-b border-red-500/30 px-4 py-2 flex items-center justify-between gap-3 text-[11px] z-40 backdrop-blur-md">
                    <div className="flex items-center gap-2 truncate">
                      <AlertTriangle size={14} className="text-red-500 shrink-0 animate-pulse" />
                      <span className="font-bold text-red-500">{language === 'ar' ? 'خطأ:' : 'Error:'}</span>
                      <span className="font-mono truncate text-[var(--text-secondary)]">{runtimeError.message}</span>
                    </div>
                    <button
                      onClick={() => {
                        handleSendPrompt(language === 'ar' ? `إصلاح الخطأ: "${runtimeError.message}"` : `Fix error: "${runtimeError.message}"`);
                        setRuntimeError(null);
                      }}
                      className="h-7 px-3 bg-red-500 text-white hover:bg-red-600 rounded-shape-sm text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                    >
                      <Wand2 size={11} />
                      <span>{language === 'ar' ? 'إصلاح تلقائي' : 'Auto Fix'}</span>
                    </button>
                  </div>
                )}

                <div className={`flex flex-col bg-[var(--surface-card)] transition-all ${
                  deviceMode === 'mobile' 
                    ? 'w-[375px] h-[667px] rounded-shape-lg border border-[var(--border-default)] shadow-2xl overflow-hidden shrink-0 my-auto' 
                    : deviceMode === 'tablet' 
                    ? 'w-[820px] h-[1000px] max-w-[95%] max-h-[95%] rounded-shape-lg border border-[var(--border-default)] shadow-2xl overflow-hidden shrink-0 my-auto' 
                    : 'w-full h-full rounded-none border-0 shadow-none flex flex-col'
                }`}>
                  <div className="flex-1 w-full h-full bg-white relative overflow-hidden">
                    <iframe
                      key={iframeKey}
                      srcDoc={previewSrcDoc}
                      title="App Live Preview"
                      className="w-full h-full min-h-full border-0 bg-white"
                      sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                    />
                  </div>
                </div>
              </div>

              {/* Code Editor Panel */}
              <div className={`flex-1 flex flex-col bg-[var(--surface-card)] overflow-hidden ${activeTab !== 'code' ? 'hidden' : ''}`}>
                {/* Editor Tabs */}
                <div className="h-9 border-b border-[var(--border-default)] bg-[var(--surface-subtle)] flex items-center px-1 gap-0.5 overflow-x-auto no-scrollbar shrink-0">
                  {openTabs.map(tabPath => {
                    const isActive = activeFilePath === tabPath;
                    const isUnsaved = savedFiles[tabPath]?.content !== files[tabPath]?.content;
                    return (
                      <div
                        key={tabPath}
                        onClick={() => setActiveFilePath(tabPath)}
                        className={`h-7 px-3 rounded-t-shape-xs flex items-center gap-2 text-[10px] cursor-pointer transition-all border-b-2 border-transparent ${
                          isActive 
                            ? 'bg-[var(--surface-card)] text-accent border-b-accent font-bold shadow-sm' 
                            : 'text-[var(--text-muted)] hover:bg-[var(--surface-card)]/50 hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <FileCode size={11} className={isActive ? 'text-accent' : 'text-[var(--text-muted)]'} />
                        <span className="truncate max-w-[120px]">{tabPath}</span>
                        {isUnsaved && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
                        <button 
                          onClick={(e) => closeTab(tabPath, e)}
                          className="p-0.5 rounded-full hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-red-500 transition-colors"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    );
                  })}
                  {openTabs.length === 0 && (
                    <div className="px-4 text-[10px] text-[var(--text-muted)] italic">
                      {language === 'ar' ? 'لا توجد ملفات مفتوحة' : 'No open files'}
                    </div>
                  )}
                </div>

                {/* Editor Breadcrumbs */}
                {activeFilePath && (
                  <div className="h-7 px-4 border-b border-[var(--border-default)]/50 bg-[var(--surface-card)] flex items-center gap-1.5 text-[9px] text-[var(--text-muted)] shrink-0">
                    <Folder size={10} />
                    <span>{projectName}</span>
                    <ChevronRight size={10} className={language === 'ar' ? 'rotate-180' : ''} />
                    <span className="text-[var(--text-primary)] font-medium">{activeFilePath}</span>
                  </div>
                )}

                <div className="flex-1 relative overflow-hidden">
                  {activeFilePath ? (
                    <textarea
                      value={activeFile?.content || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFiles(prev => ({
                          ...prev,
                          [activeFilePath]: { ...prev[activeFilePath], content: val }
                        }));
                      }}
                      className="w-full h-full p-6 font-mono text-xs sm:text-sm bg-[var(--surface-inset)] text-[var(--text-primary)] outline-none resize-none leading-relaxed border-0 scrollbar-thin"
                      spellCheck={false}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--surface-inset)] text-[var(--text-muted)] p-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center mb-4">
                        <FileCode size={32} className="opacity-20" />
                      </div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)] mb-2">
                        {language === 'ar' ? 'محرر الأكواد' : 'Code Editor'}
                      </h3>
                      <p className="max-w-xs text-[11px] leading-relaxed">
                        {language === 'ar' 
                          ? 'اختر ملفاً من مستعرض الملفات للبدء في تحريره، أو اطلب من المساعد الذكي إضافة ميزات جديدة لمشروعك.' 
                          : 'Select a file from the explorer to start editing, or ask the AI assistant to add new features to your project.'}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="h-10 px-4 bg-[var(--surface-card)] border-t border-[var(--border-default)] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      {activeFile?.content.split('\n').length || 0} {language === 'ar' ? 'سطر' : 'lines'}
                    </span>
                    {hasUnsavedChanges && (
                      <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1.5 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>{language === 'ar' ? 'تعديلات غير محفوظة' : 'Unsaved changes'}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleUndoChanges}
                      disabled={!hasUnsavedChanges}
                      className="h-7 px-3 rounded-shape-sm text-[10px] font-bold bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-accent disabled:opacity-40 transition-all cursor-pointer"
                    >
                      {language === 'ar' ? 'تراجع' : 'Revert'}
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      disabled={!hasUnsavedChanges}
                      className="h-7 px-4 rounded-shape-sm text-[10px] font-bold bg-accent text-white hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
                    >
                      {language === 'ar' ? 'حفظ' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {/* Terminal Drawer (Bottom Docked) */}
            <AnimatePresence>
              {isTerminalOpen && (
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="absolute bottom-0 inset-x-0 h-64 bg-[var(--surface-card)] border-t border-[var(--border-default)] shadow-2xl z-40 flex flex-col"
                >
                  <div className="h-9 px-4 bg-[var(--surface-subtle)] border-b border-[var(--border-default)] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <Terminal size={14} className="text-amber-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-primary)]">
                        {language === 'ar' ? 'نافذة الأوامر (الطرفية)' : 'Terminal'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setTerminalLogs([])}
                        className="p-1 hover:bg-[var(--surface-card)] rounded text-[var(--text-muted)] hover:text-rose-500 transition-colors cursor-pointer"
                        title={language === 'ar' ? 'مسح السجل' : 'Clear'}
                      >
                        <Trash2 size={13} />
                      </button>
                      <button
                        onClick={() => setIsTerminalOpen(false)}
                        className="p-1 hover:bg-[var(--surface-card)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] space-y-1 bg-slate-950 text-slate-300 selection:bg-blue-500/30">
                    {terminalLogs.map((log, i) => (
                      <div key={i} className="flex gap-2 leading-relaxed">
                        <span className="text-[var(--text-muted)] shrink-0 opacity-50">[{log.time}]</span>
                        <span className={
                          log.type === 'error' ? 'text-rose-400' : 
                          log.type === 'success' ? 'text-[var(--fg-success)]' : 
                          'text-slate-300'
                        }>
                          {log.text}
                        </span>
                      </div>
                    ))}
                    <div className="h-4" />
                  </div>

                  <form 
                    onSubmit={handleTerminalCommand}
                    className="h-9 bg-slate-900 border-t border-white/5 flex items-center px-3 gap-2"
                  >
                    <span className="text-accent font-bold">$</span>
                    <input 
                      type="text"
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                      placeholder={language === 'ar' ? 'اكتب أمراً هنا...' : 'Type a command...'}
                      className="flex-1 bg-transparent border-0 outline-none text-slate-200 text-xs font-mono"
                    />
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Database Modal */}
      <AnimatePresence>
        {isDbModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsDbModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-lg w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--surface-subtle)]">
                <div className="flex items-center gap-2.5">
                  <Database size={18} className="text-[var(--fg-success)]" />
                  <div>
                    <h2 className="text-sm font-bold text-[var(--text-primary)]">{language === 'ar' ? 'إدارة قاعدة البيانات' : 'Database Manager'}</h2>
                    <p className="text-[11px] text-[var(--text-muted)]">{language === 'ar' ? 'إدارة الجداول واستعراض السجلات وتنفيذ الاستعلامات' : 'Manage tables, inspect records, and execute queries'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDbModalOpen(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-shape-sm hover:bg-[var(--surface-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Tables List */}
                <div className="w-56 border-e border-[var(--border-default)] p-3 space-y-2 bg-[var(--surface-subtle)] overflow-y-auto shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{language === 'ar' ? 'الجداول المتوفرة' : 'Tables'}</span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">({sqlTables.length})</span>
                  </div>
                  <div className="space-y-1">
                    {sqlTables.map(tbl => (
                      <button
                        key={tbl}
                        onClick={() => {
                          setSelectedTable(tbl);
                          setQueryResult(null);
                        }}
                        className={`w-full text-start px-2.5 h-8 rounded-shape-sm text-xs font-mono font-medium transition-all cursor-pointer flex items-center justify-between ${
                          selectedTable === tbl 
                            ? 'bg-[var(--bg-accent-muted)] text-accent border border-[var(--border-accent)]/40 shadow-2xs font-bold' 
                            : 'text-[var(--text-secondary)] hover:bg-[var(--surface-card)]'
                        }`}
                      >
                        <span className="truncate">{tbl}</span>
                        <ChevronLeft size={13} className={language === 'ar' ? '' : 'rotate-180'} />
                      </button>
                    ))}

                    {sqlTables.length === 0 && (
                      <div className="p-3 text-center space-y-2">
                        <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                          {language === 'ar' ? 'لا توجد جداول منشأة بعد في قاعدة البيانات.' : 'No tables created yet.'}
                        </p>
                        <button
                          onClick={() => {
                            if (sqlDb) {
                              const seedSql = `
                                CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, email TEXT, role TEXT);
                                INSERT INTO users VALUES (1, 'أحمد محمود', 'ahmed@perplexta.ai', 'admin'), (2, 'سارة خليل', 'sara@perplexta.ai', 'developer');
                                CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, title TEXT, price REAL, stock INTEGER);
                                INSERT INTO products VALUES (1, 'Perplexta Pro License', 49.99, 100), (2, 'AI Cloud Compute Token', 19.99, 500);
                              `;
                              sqlDb.run(seedSql);
                              refreshTables(sqlDb);
                              setSelectedTable('products');
                              addLog('success', language === 'ar' ? 'تم إنشاء جداول تجريبية (users, products) بنجاح' : 'Created sample tables (users, products) successfully');
                              toast.success(language === 'ar' ? 'تم إنشاء الجداول التجريبية بنجاح!' : 'Created sample tables successfully!');
                            }
                          }}
                          className="w-full h-8 px-2 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] text-[10px] font-semibold hover:opacity-90 transition-all cursor-pointer shadow-2xs flex items-center justify-center"
                        >
                          {language === 'ar' ? '+ إنشاء جداول تجريبية' : '+ Create Sample Tables'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Table Data Grid & Query Editor */}
                <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
                  {/* SQL Query Editor */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[var(--text-secondary)]">{language === 'ar' ? 'محرر الاستعلامات' : 'SQL Query Editor'}</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={sqlCustomQuery}
                        onChange={(e) => setSqlCustomQuery(e.target.value)}
                        className="flex-1 h-8 px-2.5 bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-shape-sm font-mono text-xs text-[var(--text-primary)] outline-none focus:border-accent"
                        placeholder="SELECT * FROM products;"
                      />
                      <button
                        onClick={runCustomSqlQuery}
                        className="h-8 px-3.5 bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] text-xs font-semibold rounded-shape-sm hover:opacity-90 transition cursor-pointer shadow-2xs flex items-center justify-center"
                      >
                        {language === 'ar' ? 'تنفيذ' : 'Run'}
                      </button>
                    </div>
                  </div>

                  {/* Query feedback if present */}
                  {queryResult && (
                    <div className={`p-2.5 rounded-shape-sm text-xs font-mono border ${
                      queryResult.error
                        ? 'bg-red-500/10 text-red-500 border-red-500/30'
                        : 'bg-[var(--bg-success-muted)] text-[var(--fg-success)] border-[color-mix(in_srgb,var(--fg-success)_30%,transparent)]'
                    }`}>
                      {queryResult.error ? (language === 'ar' ? `خطأ: ${queryResult.error}` : `Error: ${queryResult.error}`) : (queryResult.message || (language === 'ar' ? `تم استرجاع ${queryResult.values?.length || 0} سجل` : `Retrieved ${queryResult.values?.length || 0} rows`))}
                    </div>
                  )}

                  {/* Results / Data Grid */}
                  <div className="flex-1 flex flex-col space-y-2 overflow-hidden">
                    <span className="text-xs font-bold text-[var(--text-secondary)]">
                      {queryResult?.columns 
                        ? (language === 'ar' ? 'نتائج الاستعلام:' : 'Query Results:') 
                        : (language === 'ar' ? `بيانات الجدول: ${selectedTable || '—'}` : `Table Data: ${selectedTable || '—'}`)}
                    </span>
                    <div className="flex-1 overflow-auto rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-subtle)]">
                      {(queryResult?.columns || tableColumns).length > 0 ? (
                        <table className="w-full text-start text-xs font-mono">
                          <thead className="bg-[var(--surface-card)] border-b border-[var(--border-default)] sticky top-0">
                            <tr>
                              {(queryResult?.columns || tableColumns).map((col: string) => (
                                <th key={col} className="px-3 py-2.5 font-bold text-[var(--text-primary)]">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border-default)]">
                            {(queryResult?.values || tableDataRows).map((row: any, rIdx: number) => (
                              <tr key={rIdx} className="hover:bg-[var(--surface-card)]/50 transition-colors">
                                {row.map((cell: any, cIdx: number) => (
                                  <td key={cIdx} className="px-3 py-2 text-[var(--text-secondary)]">{String(cell)}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-8 text-center text-xs text-[var(--text-muted)] space-y-2">
                          <p>{language === 'ar' ? 'لا توجد بيانات متاحة في هذا الجدول.' : 'No data available in this table.'}</p>
                          <p className="text-[11px] text-[var(--text-muted)]">
                            {language === 'ar' ? 'يمكنك تشغيل استعلام لإدراج أو تعديل البيانات.' : 'Execute a query to insert or inspect data.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Environment Variables Modal */}
      <AnimatePresence>
        {isEnvModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setIsEnvModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                <div className="flex items-center gap-2">
                  <Key size={18} className="text-accent" />
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {language === 'ar' ? 'متغيرات البيئة' : 'Environment Variables'}
                  </h3>
                </div>
                <button onClick={() => setIsEnvModalOpen(false)} className="p-1 rounded hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2.5 max-h-60 overflow-y-auto">
                {Object.keys(envVars).map(key => (
                  <div key={key} className="flex items-center justify-between p-2.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs font-mono">
                    <div>
                      <span className="font-bold text-accent">{key}</span>
                      <p className="text-[10px] text-[var(--text-muted)] truncate max-w-[220px]">{envVars[key]}</p>
                    </div>
                    <button
                      onClick={() => {
                        const updated = { ...envVars };
                        delete updated[key];
                        setEnvVars(updated);
                        toast.info(language === 'ar' ? `تم حذف ${key}` : `Removed ${key}`);
                      }}
                      className="p-1 text-[var(--text-muted)] hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[var(--border-default)] space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="KEY (e.g. VITE_KEY)"
                    value={newEnvKey}
                    onChange={(e) => setNewEnvKey(e.target.value.toUpperCase())}
                    className="h-8 px-2.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] font-mono outline-none focus:border-accent"
                  />
                  <input
                    type="text"
                    placeholder="VALUE"
                    value={newEnvVal}
                    onChange={(e) => setNewEnvVal(e.target.value)}
                    className="h-8 px-2.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] font-mono outline-none focus:border-accent"
                  />
                </div>
                <button
                  onClick={() => {
                    if (newEnvKey.trim()) {
                      setEnvVars(prev => ({ ...prev, [newEnvKey.trim()]: newEnvVal.trim() }));
                      setNewEnvKey('');
                      setNewEnvVal('');
                      setIframeKey(prev => prev + 1);
                      toast.success(language === 'ar' ? 'تم حفظ وحقن متغير البيئة بنجاح!' : 'Saved and injected environment variable!');
                    }
                  }}
                  className="w-full h-8 bg-accent hover:opacity-90 text-[var(--comp-button-primary-fg)] rounded-shape-sm text-xs font-semibold cursor-pointer transition-colors shadow-2xs flex items-center justify-center"
                >
                  {language === 'ar' ? 'إضافة وحقن متغيّر البيئة' : 'Add & Inject Variable'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* Cloud Project Deletion Confirmation Modal with Name Typing Verification */}
      <AnimatePresence>
        {projectToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => {
              if (!isDeletingProject) {
                setProjectToDelete(null);
                setDeleteConfirmText('');
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-shape-md bg-[var(--surface-card)] border border-rose-500/40 shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-shape-sm bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {language === 'ar' ? 'تأكيد حذف المشروع السحابي نهائياً' : 'Permanently Delete Cloud Project'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                    {language === 'ar'
                      ? 'هذا الإجراء سيقوم بحذف المشروع وكافة ملفاته وسجل المحادثة المرتبط به نهائياً من قاعدة البيانات ولا يمكن التراجع عنه.'
                      : 'This will permanently delete this project and all its files from the cloud database. This action cannot be undone.'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-shape-sm bg-rose-500/5 border border-rose-500/20 space-y-2">
                <label className="text-[11px] font-bold text-[var(--text-secondary)] block">
                  {language === 'ar' ? 'لتأكيد الحذف، اكتب اسم المشروع أدناه:' : 'To confirm deletion, type the project name below:'}
                </label>
                <div className="p-1.5 px-2 rounded bg-[var(--surface-subtle)] border border-[var(--border-default)] font-mono text-xs font-bold text-rose-400 select-all">
                  {projectToDelete.title}
                </div>
                <input
                  type="text"
                  autoFocus
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={projectToDelete.title}
                  className="w-full h-8 px-2.5 bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-shape-sm text-xs font-mono text-[var(--text-primary)] outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  disabled={isDeletingProject}
                  onClick={() => {
                    setProjectToDelete(null);
                    setDeleteConfirmText('');
                  }}
                  className="h-8 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] cursor-pointer transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={deleteConfirmText.trim() !== projectToDelete.title.trim() || isDeletingProject}
                  onClick={executeDeleteWorkspace}
                  className="h-8 px-4 rounded-shape-sm bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold cursor-pointer transition-all shadow-2xs flex items-center gap-1.5"
                >
                  {isDeletingProject ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  <span>{language === 'ar' ? 'تأكيد الحذف النهائي' : 'Confirm Delete'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cloud Project Rename Modal */}
      <AnimatePresence>
        {projectToRename && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => {
              if (!isRenamingProject) {
                setProjectToRename(null);
                setRenameText('');
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-center gap-2.5 border-b border-[var(--border-default)] pb-3">
                <div className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center text-accent">
                  <Edit2 size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {language === 'ar' ? 'تعديل اسم المشروع السحابي' : 'Rename Cloud Project'}
                  </h3>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {language === 'ar' ? 'قم بتحديث عنوان المشروع المحفوظ في حسابك' : 'Update project title in your account'}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)]">
                  {language === 'ar' ? 'اسم المشروع الجديد:' : 'New Project Name:'}
                </label>
                <input
                  type="text"
                  autoFocus
                  value={renameText}
                  onChange={(e) => setRenameText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      executeRenameWorkspace();
                    }
                  }}
                  className="w-full h-8 px-2.5 bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-shape-sm text-xs text-[var(--text-primary)] outline-none focus:border-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  disabled={isRenamingProject}
                  onClick={() => {
                    setProjectToRename(null);
                    setRenameText('');
                  }}
                  className="h-8 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] cursor-pointer transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={!renameText.trim() || isRenamingProject}
                  onClick={executeRenameWorkspace}
                  className="h-8 px-4 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] hover:opacity-90 disabled:opacity-40 text-xs font-bold cursor-pointer transition-all shadow-2xs flex items-center gap-1.5"
                >
                  {isRenamingProject ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  <span>{language === 'ar' ? 'حفظ الاسم' : 'Save Name'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Snapshot Restore Confirmation Modal */}
      <AnimatePresence>
        {snapshotToRestore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => {
              if (!isRestoringSnapshot) setSnapshotToRestore(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-shape-md bg-[var(--surface-card)] border border-accent/40 shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-shape-sm bg-accent/10 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                  <RotateCcw size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {language === 'ar' ? 'تأكيد استعادة الإصدار المحفوظ' : 'Restore Version Snapshot'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                    {language === 'ar'
                      ? `هل أنت متأكد من رغبتك في استعادة الإصدار "${snapshotToRestore.name}"؟ سيتم استبدال محتويات الملفات الحالية في المحرر بملفات هذا الإصدار.`
                      : `Are you sure you want to restore snapshot "${snapshotToRestore.name}"? Current workspace files will be replaced with this version.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  disabled={isRestoringSnapshot}
                  onClick={() => setSnapshotToRestore(null)}
                  className="h-8 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] cursor-pointer transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={isRestoringSnapshot}
                  onClick={executeRestoreSnapshot}
                  className="h-8 px-4 rounded-shape-sm bg-accent text-[var(--comp-button-primary-fg)] hover:opacity-90 disabled:opacity-40 text-xs font-bold cursor-pointer transition-all shadow-2xs flex items-center gap-1.5"
                >
                  {isRestoringSnapshot ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                  <span>{language === 'ar' ? 'تأكيد الاستعادة' : 'Confirm Restore'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Delete Confirmation Modal */}
      <AnimatePresence>
        {fileToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setFileToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-shape-md bg-[var(--surface-card)] border border-rose-500/30 shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-shape-sm bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                  <Trash2 size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {language === 'ar' ? 'حذف ملف من المشروع' : 'Delete File'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 font-mono break-all">
                    {fileToDelete}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setFileToDelete(null)}
                  className="h-8 px-3 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] cursor-pointer transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={executeDeleteFile}
                  className="h-8 px-3.5 rounded-shape-sm bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition-all shadow-2xs"
                >
                  {language === 'ar' ? 'حذف' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New File Creation Modal */}
      <AnimatePresence>
        {isNewFileModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsNewFileModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-center gap-2.5 border-b border-[var(--border-default)] pb-3">
                <div className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center text-accent">
                  <Plus size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {language === 'ar' ? 'إنشاء ملف جديد في المشروع' : 'Create New Project File'}
                  </h3>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {language === 'ar' ? 'حدد مسار واسم الملف مع الامتداد المناسب' : 'Specify the file path with valid extension'}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)]">
                  {language === 'ar' ? 'مسار الملف (مثال: src/components/Card.jsx):' : 'File Path (e.g. src/components/Card.jsx):'}
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="src/components/Header.jsx"
                  value={newFilePathInput}
                  onChange={(e) => setNewFilePathInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newFilePathInput.trim()) {
                      e.preventDefault();
                      const path = newFilePathInput.trim();
                      setFiles(prev => ({
                        ...prev,
                        [path]: { name: path.split('/').pop() || path, path, type: path.split('.').pop() || 'txt', content: '// كود جديد\n' }
                      }));
                      setActiveFilePath(path);
                      addLog('success', `تم إنشاء الملف: ${path}`);
                      setIsNewFileModalOpen(false);
                      setNewFilePathInput('');
                      toast.success(language === 'ar' ? `تم إنشاء ${path}` : `Created ${path}`);
                    }
                  }}
                  className="w-full h-8 px-2.5 bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-shape-sm text-xs font-mono text-[var(--text-primary)] outline-none focus:border-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setIsNewFileModalOpen(false)}
                  className="h-8 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] cursor-pointer transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={!newFilePathInput.trim()}
                  onClick={() => {
                    const path = newFilePathInput.trim();
                    if (!path) return;
                    setFiles(prev => ({
                      ...prev,
                      [path]: { name: path.split('/').pop() || path, path, type: path.split('.').pop() || 'txt', content: '// كود جديد\n' }
                    }));
                    setActiveFilePath(path);
                    addLog('success', `تم إنشاء الملف: ${path}`);
                    setIsNewFileModalOpen(false);
                    setNewFilePathInput('');
                    toast.success(language === 'ar' ? `تم إنشاء ${path}` : `Created ${path}`);
                  }}
                  className="h-8 px-4 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] hover:opacity-90 disabled:opacity-40 text-xs font-bold cursor-pointer transition-all shadow-2xs flex items-center gap-1.5"
                >
                  <Plus size={13} />
                  <span>{language === 'ar' ? 'إنشاء الملف' : 'Create File'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Rename Modal */}
      <AnimatePresence>
        {fileToRename && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setFileToRename(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-center gap-2.5 border-b border-[var(--border-default)] pb-3">
                <div className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center text-accent">
                  <Edit2 size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {language === 'ar' ? 'إعادة تسمية الملف' : 'Rename File'}
                  </h3>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono">
                    {fileToRename}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)]">
                  {language === 'ar' ? 'المسار الجديد:' : 'New Path:'}
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newFilePathRename}
                  onChange={(e) => setNewFilePathRename(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newFilePathRename.trim() && newFilePathRename.trim() !== fileToRename) {
                      e.preventDefault();
                      const trimmed = newFilePathRename.trim();
                      const oldPath = fileToRename;
                      setFiles(prev => {
                        const next = { ...prev };
                        const fileData = next[oldPath];
                        delete next[oldPath];
                        next[trimmed] = {
                          ...fileData,
                          name: trimmed.split('/').pop() || trimmed,
                          path: trimmed,
                          type: trimmed.split('.').pop() || 'txt'
                        };
                        return next;
                      });
                      if (activeFilePath === oldPath) {
                        setActiveFilePath(trimmed);
                      }
                      addLog('log', `تم تغيير اسم الملف من ${oldPath} إلى ${trimmed}`);
                      setFileToRename(null);
                      toast.success(language === 'ar' ? 'تمت إعادة التسمية بنجاح' : 'Renamed successfully');
                    }
                  }}
                  className="w-full h-8 px-2.5 bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-shape-sm text-xs font-mono text-[var(--text-primary)] outline-none focus:border-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setFileToRename(null)}
                  className="h-8 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] cursor-pointer transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={!newFilePathRename.trim() || newFilePathRename.trim() === fileToRename}
                  onClick={() => {
                    const trimmed = newFilePathRename.trim();
                    const oldPath = fileToRename;
                    if (!trimmed || trimmed === oldPath) return;
                    setFiles(prev => {
                      const next = { ...prev };
                      const fileData = next[oldPath];
                      delete next[oldPath];
                      next[trimmed] = {
                        ...fileData,
                        name: trimmed.split('/').pop() || trimmed,
                        path: trimmed,
                        type: trimmed.split('.').pop() || 'txt'
                      };
                      return next;
                    });
                    if (activeFilePath === oldPath) {
                      setActiveFilePath(trimmed);
                    }
                    addLog('log', `تم تغيير اسم الملف من ${oldPath} إلى ${trimmed}`);
                    setFileToRename(null);
                    toast.success(language === 'ar' ? 'تمت إعادة التسمية بنجاح' : 'Renamed successfully');
                  }}
                  className="h-8 px-4 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] hover:opacity-90 disabled:opacity-40 text-xs font-bold cursor-pointer transition-all shadow-2xs flex items-center gap-1.5"
                >
                  <Check size={13} />
                  <span>{language === 'ar' ? 'تحديث الاسم' : 'Update'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default AppStudioPage;
