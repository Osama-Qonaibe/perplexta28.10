import React, { useState, useRef, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { 
  AlertTriangle, 
  RefreshCw, 
  Maximize2, 
  Download, 
  Palette,
  Sparkles,
  Layers,
  X
} from 'lucide-react';
import { toast } from '@/design-system';
import { useAppContext } from '../../../../context/AppContext';
import { ArtifactContext } from '../../../../context/ArtifactContext';
import { ASPECT_RATIO_CLASSES } from '../../../../constants/chat';
import { saveUserStudioProject } from '../../../../data/rataqProjects';

export const SimpleImageLoadingPlaceholder = ({ dir, aspectRatio = '1:1' }: { dir: 'ltr' | 'rtl'; aspectRatio?: string }) => {
  const containerAspectClass = ASPECT_RATIO_CLASSES[aspectRatio] || ASPECT_RATIO_CLASSES['1:1'];

  return (
    <div className="w-full flex flex-col my-2 items-start">
      <div 
        className={`relative overflow-hidden rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-subtle)]/70 backdrop-blur-xl ${containerAspectClass} w-full`}
      >
        {/* Calm, serene ambient breathing pulse */}
        <motion.div
          animate={{
            opacity: [0.35, 0.65, 0.35],
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 4.0,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-gradient-to-br from-accent/10 via-[var(--surface-card)]/50 to-accent/5 pointer-events-none"
        />

        {/* Gentle, subtle light sheen sweep */}
        <motion.div
          animate={{
            x: dir === 'rtl' ? ['160%', '-160%'] : ['-160%', '160%']
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] dark:via-white/[0.03] to-transparent skew-x-12 pointer-events-none z-10"
        />
      </div>
    </div>
  );
};

export const SimpleImageErrorPlaceholder = ({ dir, errorMessage, onRetry, aspectRatio = '1:1' }: { dir: 'ltr' | 'rtl'; errorMessage?: string; onRetry?: () => void; aspectRatio?: string }) => {
  const containerAspectClass = ASPECT_RATIO_CLASSES[aspectRatio] || ASPECT_RATIO_CLASSES['1:1'];

  return (
    <div className="w-full flex flex-col my-3 items-start gap-3">
      <div 
        className={`relative overflow-hidden rounded-shape-md border border-rose-500/30 bg-rose-500/10 ${containerAspectClass} w-full shadow-sm flex flex-col items-center justify-center p-6 text-center`}
      >
        <AlertTriangle className="text-rose-500 mb-3" size={24} />
        <span className="text-xs font-bold text-[var(--text-primary)] mb-1">
          {dir === 'rtl' ? 'تعذر إنشاء الصورة' : 'Synthesis failed'}
        </span>
        <span className="text-[10px] text-rose-500 font-medium break-words max-w-full leading-relaxed px-2">
          {errorMessage || (dir === 'rtl' ? 'خطأ غير معروف.' : 'Unknown generation error.')}
        </span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-shape-sm border border-rose-500/30 bg-[var(--surface-subtle)] text-rose-500 hover:bg-rose-500/20 transition-theme text-[11px] font-black uppercase cursor-pointer"
          >
            <RefreshCw size={12} className="animate-spin-slow" />
            <span>{dir === 'rtl' ? 'إعادة المحاولة' : 'Retry'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

const loadedImageCache = new Set<string>();
loadedImageCache.clear();

export const ShareableImageOutput = ({ src, dir: propDir, alt }: { src?: string; dir?: string; alt?: string; [key: string]: any }) => {
  const { dir: contextDir, user } = useAppContext();
  const artifactContext = useContext(ArtifactContext);
  const dir = propDir || contextDir || (document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr');
  
  const rawSrc = (src || '').trim();
  const unescapedSrc = rawSrc.replace(/^!\[.*?\]\((.*?)\)$/, '$1').trim();
  const withoutHash = unescapedSrc.split('#')[0].trim();
  
  const cleanUrl = withoutHash.startsWith('http://') || withoutHash.startsWith('https://') || withoutHash.startsWith('data:') || withoutHash.startsWith('blob:')
    ? withoutHash
    : (withoutHash.startsWith('/') ? withoutHash : (withoutHash ? `/${withoutHash}` : ''));

  const aspectMatch = rawSrc.match(/#aspect=([0-9]+:[0-9]+)/);
  const selectedRatio = aspectMatch ? aspectMatch[1] : '1:1';
  const containerAspectClass = ASPECT_RATIO_CLASSES[selectedRatio] || ASPECT_RATIO_CLASSES['1:1'];

  const [isImageFocused, setIsImageFocused] = useState(() => Boolean(cleanUrl && loadedImageCache.has(cleanUrl)));
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!cleanUrl) return;

    if (loadedImageCache.has(cleanUrl) || (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0)) {
      setIsImageFocused(true);
      loadedImageCache.add(cleanUrl);
    }

    const timer = setTimeout(() => {
      setIsImageFocused(true);
      if (cleanUrl) loadedImageCache.add(cleanUrl);
    }, 400);

    return () => clearTimeout(timer);
  }, [cleanUrl]);

  const handleImageError = () => {
    if (retryCount < 3 && cleanUrl && !cleanUrl.startsWith('data:')) {
      const nextRetry = retryCount + 1;
      setRetryCount(nextRetry);
      setTimeout(() => {
        if (imgRef.current) {
          const sep = cleanUrl.includes('?') ? '&' : '?';
          imgRef.current.src = `${cleanUrl}${sep}_r=${Date.now()}`;
        }
      }, 500 * nextRetry);
    } else {
      setIsImageFocused(true);
      setImageError(true);
    }
  };

  // Helper 1: Execute creating a brand new workspace (Auto-saves current workspace to projects, wipes working session, opens clean workspace)
  const executeCreateNewWorkspace = (imgUrl: string) => {
    const newId = `project-img-${Date.now()}`;
    const newTitle = dir === 'rtl' ? 'تصميم جديد' : 'New Design';

    // Auto-save existing session if present
    try {
      const sessionActive = typeof window !== 'undefined' && localStorage.getItem('rataq_studio_session_active') === 'true';
      if (sessionActive && user?.id) {
        const storedPages = localStorage.getItem('rataq_studio_session_pages');
        const storedProjId = localStorage.getItem('rataq_studio_session_projectId');
        const storedTitle = localStorage.getItem('rataq_studio_session_designTitle');
        if (storedPages) {
          const parsedPages = JSON.parse(storedPages);
          if (Array.isArray(parsedPages) && parsedPages.length > 0) {
            const projectToSave = {
              id: storedProjId || `project-${Date.now()}`,
              userId: String(user.id),
              title: storedTitle || (dir === 'rtl' ? 'مشروع سابق' : 'Previous Project'),
              previewUrl: parsedPages[0]?.bgImgSrc || imgUrl,
              width: 1080,
              height: 1080,
              canvasBackground: parsedPages[0]?.bgImgSrc || '#ffffff',
              elements: [],
              pages: parsedPages,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              tags: [dir === 'rtl' ? 'استوديو رينكس' : 'Rinex Studio']
            };
            saveUserStudioProject(user.id, projectToSave as any);
          }
        }
      }
    } catch (err) {
      console.warn('Auto-save existing studio project error:', err);
    }

    // Clear old working session storage
    try {
      localStorage.removeItem('rataq_studio_session_active');
      localStorage.removeItem('rataq_studio_session_projectId');
      localStorage.removeItem('rataq_studio_session_artifact');
      localStorage.removeItem('rataq_studio_session_elements');
      localStorage.removeItem('rataq_studio_session_pages');
      localStorage.removeItem('rataq_studio_session_designTitle');
    } catch {}

    const initialPage = {
      id: 'page-1',
      title: dir === 'rtl' ? 'الصفحة 1' : 'Page 1',
      elements: [],
      bgImgSrc: imgUrl,
      locked: false
    };

    const artifactObj = {
      id: newId,
      title: newTitle,
      type: 'image' as const,
      content: imgUrl,
      version: 1,
      files: {}
    };

    try {
      localStorage.setItem('rataq_studio_session_active', 'true');
      localStorage.setItem('rataq_studio_session_projectId', newId);
      localStorage.setItem('rataq_studio_session_artifact', JSON.stringify(artifactObj));
      localStorage.setItem('rataq_studio_session_elements', '[]');
      localStorage.setItem('rataq_studio_session_pages', JSON.stringify([initialPage]));
      localStorage.setItem('rataq_studio_session_designTitle', newTitle);
    } catch {}

    if (artifactContext) {
      artifactContext.setActiveArtifact(artifactObj);
      artifactContext.setIsArtifactOpen(true);
      artifactContext.setActiveTab('preview');
    }

    window.dispatchEvent(new CustomEvent('rataq_studio_workspace_reset', {
      detail: { artifact: artifactObj }
    }));

    toast.success(dir === 'rtl' ? 'تم إنشاء ساحة عمل جديدة وحفظ المشروع السابق في مشاريعك ☁️' : 'Created new workspace & saved previous project ☁️');
  };

  // Helper 2: Append as a new page to active workspace
  const executeAppendAsNewPage = (imgUrl: string) => {
    if (artifactContext) {
      artifactContext.setIsArtifactOpen(true);
      artifactContext.setActiveTab('preview');
    }

    window.dispatchEvent(new CustomEvent('rataq_studio_append_page', {
      detail: { bgImgSrc: imgUrl }
    }));

    toast.success(dir === 'rtl' ? 'تمت إضافة الصورة كصفحة جديدة في الساحة الحالية 📄✨' : 'Added image as a new page in active workspace 📄✨');
  };

  const handleEditImage = () => {
    if (!cleanUrl) return;
    if (!artifactContext) {
      toast.error(dir === 'rtl' ? 'محرر رينكس غير متوفر حالياً' : 'Rinex editor is not available');
      return;
    }

    const activeArt = artifactContext.activeArtifact;
    const isSessionActive = typeof window !== 'undefined' && (
      localStorage.getItem('rataq_studio_session_active') === 'true' ||
      Boolean(artifactContext.isArtifactOpen && activeArt)
    );

    // If exact same image is already open in active artifact, just focus
    if (activeArt && (activeArt.content === cleanUrl || activeArt.id === cleanUrl)) {
      artifactContext.setIsArtifactOpen(true);
      artifactContext.setActiveTab('preview');
      return;
    }

    // If an active session exists with different content/image, show choice modal (Replace vs Add Page)
    if (isSessionActive) {
      setIsOptionModalOpen(true);
    } else {
      // Immediate fresh workspace
      executeCreateNewWorkspace(cleanUrl);
    }
  };

  const handleDownload = async () => {
    if (!cleanUrl) return;
    try {
      const targetUrl = cleanUrl.startsWith('/') ? `${window.location.origin}${cleanUrl}` : cleanUrl;
      const cleanResponse = await fetch(targetUrl);
      const cleanBlob = await cleanResponse.blob();
      const cleanObjectUrl = window.URL.createObjectURL(cleanBlob);
      const link = document.createElement('a');
      link.href = cleanObjectUrl;
      link.download = `Generated_Image_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(cleanObjectUrl);
      toast.success(dir === 'rtl' ? 'تم تنزيل الصورة بنجاح!' : 'Image downloaded successfully!');
    } catch (err) {
      const link = document.createElement('a');
      link.href = cleanUrl;
      link.download = `Generated_Image_${Date.now()}.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="w-full flex flex-col my-2 items-start">
      {/* Image Container */}
      <div 
        className={`relative group overflow-hidden rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-subtle)] ${containerAspectClass} w-full transition-all duration-300 shadow-sm`}
      >
        {!imageError && cleanUrl && (
          <img 
            ref={imgRef}
            onLoad={() => {
              setIsImageFocused(true);
              setImageError(false);
              if (cleanUrl) loadedImageCache.add(cleanUrl);
            }}
            onError={handleImageError}
            src={cleanUrl}
            alt={alt || "Generated Image"}
            className="block w-full h-full object-cover select-none cursor-pointer"
            onClick={() => setIsPreviewOpen(true)}
            style={{
              filter: isImageFocused ? 'blur(0px)' : 'blur(8px)',
              opacity: isImageFocused ? 1 : 0.6,
              transition: 'filter 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            referrerPolicy="no-referrer"
          />
        )}

        {/* Download, Edit, & Enlarge Buttons */}
        {isImageFocused && !imageError && (
          <div className={`absolute top-2 ${dir === 'rtl' ? 'left-2' : 'right-2'} flex items-center gap-1.5 z-25`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditImage();
              }}
              className="w-7 h-7 rounded-shape-xs bg-indigo-600 border border-indigo-500 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-md cursor-pointer"
              title={dir === 'rtl' ? 'تعديل وتأثيرات بعد الإنتاج' : 'Edit & Post-Production FX'}
            >
              <Palette size={13} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="w-7 h-7 rounded-shape-xs bg-[var(--surface-card)]/80 backdrop-blur-md border border-[var(--border-default)] text-[var(--text-primary)] flex items-center justify-center hover:bg-[var(--surface-subtle)] transition-colors shadow-md cursor-pointer"
              title={dir === 'rtl' ? 'تنزيل' : 'Download'}
            >
              <Download size={13} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPreviewOpen(true);
              }}
              className="w-7 h-7 rounded-shape-xs bg-[var(--surface-card)]/80 backdrop-blur-md border border-[var(--border-default)] text-[var(--text-primary)] flex items-center justify-center hover:bg-[var(--surface-subtle)] transition-colors shadow-md cursor-pointer"
              title={dir === 'rtl' ? 'تكبير' : 'Enlarge'}
            >
              <Maximize2 size={13} />
            </button>
          </div>
        )}

        {!isImageFocused && !imageError && (
          <div className="absolute inset-0 bg-white/10 backdrop-blur-[6px] pointer-events-none transition-all duration-300" />
        )}

        {imageError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-500/10 p-4 text-center">
            <AlertTriangle className="text-rose-500 mb-2" size={20} />
            <span className="text-[11px] font-bold text-rose-500">
              {dir === 'rtl' ? 'تعذر تحميل الصورة' : 'Failed to load image'}
            </span>
            <button
              onClick={() => {
                setImageError(false);
                setRetryCount(0);
                if (imgRef.current) {
                  const sep = cleanUrl.includes('?') ? '&' : '?';
                  imgRef.current.src = `${cleanUrl}${sep}_t=${Date.now()}`;
                }
              }}
              className="mt-2 text-[11px] underline font-bold cursor-pointer text-rose-500 hover:text-rose-600"
            >
              {dir === 'rtl' ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        )}
      </div>

      {/* Lightbox Modal (Enlarge view) */}
      {isPreviewOpen && createPortal(
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[999999] flex items-center justify-center p-4"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <img 
              src={cleanUrl} 
              alt={alt || "Enlarged Image"} 
              className="max-w-full max-h-[82vh] object-contain rounded-shape-md shadow-2xl"
              referrerPolicy="no-referrer"
            />
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => {
                  setIsPreviewOpen(false);
                  handleEditImage();
                }}
                className="px-4 py-2 min-h-[44px] rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] hover:opacity-90 text-xs font-bold flex items-center gap-2 shadow-md transition-theme cursor-pointer"
              >
                <Palette size={14} />
                <span>{dir === 'rtl' ? 'تعديل الصورة' : 'Edit Image'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-shape-sm bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] text-[var(--text-primary)] text-xs font-bold flex items-center gap-2 border border-[var(--border-default)] backdrop-blur-md transition-colors cursor-pointer"
              >
                <Download size={14} />
                <span>{dir === 'rtl' ? 'تنزيل' : 'Download'}</span>
              </button>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-primary)] text-xs font-bold transition-colors cursor-pointer"
              >
                {dir === 'rtl' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Choice Modal: Replace Current Workspace vs Add as New Page */}
      {isOptionModalOpen && createPortal(
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[999999] flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsOptionModalOpen(false)}
        >
          <div 
            className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-lg shadow-2xl max-w-md w-full p-6 space-y-5 relative text-[var(--text-primary)]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-shape-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-500 flex items-center justify-center shrink-0">
                <Palette size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold leading-tight">
                  {dir === 'rtl' ? 'فتح الصورة في استوديو رينكس' : 'Open Image in Rinex Studio'}
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {dir === 'rtl' 
                    ? 'توجد لديك ساحة عمل نشطة حالياً. كيف ترغب في فتح هذه الصورة؟' 
                    : 'You have an active studio workspace. How would you like to open this image?'}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              {/* Option 1: Replace & Start Fresh Workspace */}
              <button
                type="button"
                onClick={() => {
                  setIsOptionModalOpen(false);
                  executeCreateNewWorkspace(cleanUrl);
                }}
                className="w-full p-3.5 rounded-shape-md bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-default)] hover:border-indigo-500/50 flex items-center gap-3 transition-all cursor-pointer group text-start active:scale-[0.99]"
              >
                <div className="w-8 h-8 rounded-shape-xs bg-indigo-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                  <Sparkles size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[var(--text-primary)] group-hover:text-indigo-500 transition-colors">
                    {dir === 'rtl' ? 'إنشاء ساحة عمل جديدة (حفظ واستبدال)' : 'New Workspace (Save & Replace)'}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                    {dir === 'rtl' ? 'حفظ المشروع السابق تلقائياً والبدء بساحة نظيفة للصورة' : 'Auto-save active project and start a clean workspace'}
                  </div>
                </div>
              </button>

              {/* Option 2: Add as New Page */}
              <button
                type="button"
                onClick={() => {
                  setIsOptionModalOpen(false);
                  executeAppendAsNewPage(cleanUrl);
                }}
                className="w-full p-3.5 rounded-shape-md bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-default)] hover:border-emerald-500/50 flex items-center gap-3 transition-all cursor-pointer group text-start active:scale-[0.99]"
              >
                <div className="w-8 h-8 rounded-shape-xs bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                  <Layers size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[var(--text-primary)] group-hover:text-emerald-500 transition-colors">
                    {dir === 'rtl' ? 'إضافة كصفحة جديدة في الساحة الحالية' : 'Add as New Page in Active Workspace'}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                    {dir === 'rtl' ? 'إدراج الصورة كصفحة إضافية دون مسح تصميمك الحالي' : 'Append image as a new page without clearing current edits'}
                  </div>
                </div>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOptionModalOpen(false)}
                className="px-4 py-2 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-bold transition-colors cursor-pointer"
              >
                {dir === 'rtl' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
