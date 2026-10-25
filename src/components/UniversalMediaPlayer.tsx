import React, { useState, useRef, useEffect, useId, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize2,
  Minimize2,
  Film,
  RotateCcw,
  Loader2,
  AlertCircle,
  Activity,
  Settings2,
  Check,
  Gauge
} from 'lucide-react';
import { parseVideoUrl, getMediaUrl } from '../utils/mediaUtils';
import {
  notifyMediaPlaying,
  stopAllMedia
} from '../utils/mediaCoordinator';
import { useVideoResource, MediaAspectRatio, MediaFitMode, MediaFormatType } from '../context/VideoResourceContext';
import { UniversalMediaContainer } from './UniversalMediaContainer';
import { useVideoPlayerSession } from '../hooks/useVideoPlayerSession';
import { videoPlayerStateService } from '../services/videoPlayerStateService';
import { OnScreenDiagnostics } from './OnScreenDiagnostics';
import { trackMediaEvent } from '../utils/analytics';

export interface UniversalMediaPlayerProps {
  url: string;
  resourceId?: string | number;
  format?: MediaFormatType;
  aspectRatio?: MediaAspectRatio;
  fitMode?: MediaFitMode;
  posterUrl?: string;
  title?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
  isRtl?: boolean;
  showControls?: boolean;
  maxHeight?: string;
  onOpenReels?: () => void;
  onEnded?: () => void;
}

/**
 * UniversalMediaPlayer
 * A layout-agnostic, responsive media player supporting dynamic video aspect ratios
 * (1:1 square, 16:9 widescreen, 9:16 portrait/reels, 4:5 vertical, 21:9 banner).
 * Features:
 * - Protocols to prevent simultaneous and background playback
 * - Smooth, professional pausing during scrolling (IntersectionObserver)
 * - Persistent volume settings and playback state continuity when toggling fullscreen
 * - Cohesive instant Reels expand without audio overlap
 * - Optimized 'preload=metadata' resource management
 * - Self-healing error recovery handler with exponential backoff for intermittent connections
 */
export const UniversalMediaPlayer: React.FC<UniversalMediaPlayerProps> = ({
  url,
  resourceId,
  format = 'auto',
  aspectRatio = 'auto',
  fitMode = 'contain',
  posterUrl,
  title,
  autoPlay = false,
  muted = false,
  loop = false,
  className = '',
  isRtl = true,
  showControls = true,
  maxHeight,
  onOpenReels,
  onEnded
}) => {
  const reactId = useId();
  const playerId = useRef(resourceId ? `universal_media_${resourceId}` : `universal_media_${reactId.replace(/:/g, '_')}`).current;
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { updateMediaMetadata } = useVideoResource();

  const {
    session,
    update: updateSession,
    attachVideoElement,
    detachVideoElement,
    play: playSession,
    pause: pauseSession,
    togglePlay: togglePlaySession,
    setVolume: setSessionVolume,
    setMuted: setSessionMuted,
    seek: seekSession,
    setFullscreenTransition
  } = useVideoPlayerSession(playerId, { url, autoPlay, muted });

  const { isPlaying, volume, isMuted, currentTime, duration, isFullscreen, isTransitioningFullscreen } = session;

  const initialRatio: MediaAspectRatio = (aspectRatio && aspectRatio !== 'auto')
    ? aspectRatio
    : (format === 'reel' || format === 'story' ? '9:16' : (format === 'square' || format === 'sidebar' ? '1:1' : '16:9'));
  const [detectedRatio, setDetectedRatio] = useState<MediaAspectRatio>(initialRatio);
  const [videoResolution, setVideoResolution] = useState<{ width: number; height: number; qualityLabel: string } | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ percent: number; time: number; clientX: number } | null>(null);
  const [showOverlayControls, setShowOverlayControls] = useState(false);
  const [isCssFullscreen, setIsCssFullscreen] = useState(false);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mute / Unmute Visual Feedback Overlay State
  const [muteFeedback, setMuteFeedback] = useState<{ show: boolean; isMuted: boolean } | null>(null);
  const muteFeedbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTogglingMuteRef = useRef(false);

  // Network & Buffering States
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasFatalError, setHasFatalError] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const lastPlaybackTimeRef = useRef(0);

  // Advanced TikTok-Grade Feature States & References
  const [autoPosterUrl, setAutoPosterUrl] = useState<string | null>(null);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const lastClickRef = useRef<number>(0);
  const clickTimeoutRef = useRef<number | null>(null);
  const loopCountRef = useRef<number>(0);

  // Proximity-based lazy loading of video resource to free up decoder memory
  const [isNearViewport, setIsNearViewport] = useState(autoPlay);
  const [hasBeenNearViewport, setHasBeenNearViewport] = useState(autoPlay);

  // RTL-compliant robust seekbar & localization states
  const effectiveIsRtl = isRtl ?? (typeof document !== 'undefined' && document.documentElement.dir === 'rtl');
  const scrubberRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [bufferedPercent, setBufferedPercent] = useState(0);

  const updateBuffered = useCallback(() => {
    const video = videoRef.current;
    if (video && video.duration > 0 && video.buffered.length > 0) {
      try {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBufferedPercent(Math.min(100, Math.max(0, (bufferedEnd / video.duration) * 100)));
      } catch (_) {}
    }
  }, []);

  const seekFromPointer = useCallback((clientX: number) => {
    if (!scrubberRef.current || duration <= 0) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const relativeX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (relativeX / rect.width) * 100;
    const targetTime = (relativeX / rect.width) * duration;
    seekSession(targetTime, videoRef.current);
    lastPlaybackTimeRef.current = targetTime;
    setHoverPosition({ percent, time: targetTime, clientX: relativeX });
  }, [duration, seekSession]);

  const handleScrubberPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setIsScrubbing(true);
    seekFromPointer(e.clientX);

    const onPointerMove = (moveEvent: PointerEvent) => {
      seekFromPointer(moveEvent.clientX);
    };

    const onPointerUp = () => {
      setIsScrubbing(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  useEffect(() => {
    if (isNearViewport) {
      setHasBeenNearViewport(true);
    }
  }, [isNearViewport]);

  useEffect(() => {
    setHasBeenNearViewport(autoPlay);
  }, [url, autoPlay]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsNearViewport(true);
          } else {
            // Unload if scrolled far away to free up resources
            setIsNearViewport(false);
          }
        });
      },
      { rootMargin: '450px 0px 450px 0px', threshold: 0.01 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, []);

  // Track media drop-off when player component is unmounted
  useEffect(() => {
    return () => {
      const video = videoRef.current;
      if (video && !video.paused) {
        trackMediaEvent('drop_off', playerId, video.currentTime, video.duration, {
          reason: 'unmount'
        });
      }
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, [playerId]);

  // Handle double-tap: open fullscreen TikTok-style if normal, and like if inside fullscreen
  const handleVideoClick = (e: React.MouseEvent<HTMLVideoElement>) => {
    const currentTimeClick = Date.now();
    const delay = 260; // time window for detecting double tap
    
    if (currentTimeClick - lastClickRef.current < delay) {
      // Clear scheduled single-tap toggle
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      
      const isCurrentlyFs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement || isFullscreen);
      const isVerticalVideo = detectedRatio === '9:16' || format === 'reel' || format === 'story' || aspectRatio === '9:16';

      if (!isCurrentlyFs) {
        // Double-click outside fullscreen: open fullscreen TikTok-style
        if (isVerticalVideo || onOpenReels) {
          if (videoRef.current) {
            try {
              pauseSession(videoRef.current);
            } catch (_) {}
          }
          try {
            window.dispatchEvent(new CustomEvent('perplexta:stop_all_media', {
              detail: { exceptMediaId: playerId }
            }));
          } catch (_) {}
          if (onOpenReels) {
            onOpenReels();
          }
          const adId = resourceId ? Number(resourceId) : undefined;
          window.dispatchEvent(new CustomEvent('open-reel-fullscreen', {
            detail: { adId, url, title }
          }));
        } else {
          // Standard native fullscreen for landscape videos
          toggleFullscreen(e);
        }
      } else {
        // Double-click inside fullscreen: like
        // Compute click coordinates relative to the video component
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const newHeart = {
          id: Date.now() + Math.random(),
          x,
          y,
        };
        
        setHearts((prev) => [...prev, newHeart]);
        
        // Track like event to GTM
        const video = videoRef.current;
        trackMediaEvent('like', playerId, video ? video.currentTime : 0, video ? video.duration : 0);

        // Dispatch a global event so the feed can handle liking
        if (resourceId) {
          window.dispatchEvent(new CustomEvent('ad-double-tap-like', {
            detail: { adId: Number(resourceId) }
          }));
        }
        
        // Clean up heart element after animation completes
        setTimeout(() => {
          setHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
        }, 800);
      }
    } else {
      // Schedule single click play/pause toggle
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      clickTimeoutRef.current = window.setTimeout(() => {
        togglePlay();
        clickTimeoutRef.current = null;
      }, delay);
    }
    
    lastClickRef.current = currentTimeClick;
  };

  // Extract first frame automatically as video poster if none provided
  const handleLoadedData = () => {
    if (!posterUrl && !autoPosterUrl && videoRef.current) {
      const video = videoRef.current;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAutoPosterUrl(dataUrl);
        }
      } catch (err) {
        console.warn('Auto-poster extraction bypassed (CORS restriction):', err);
      }
    }
  };

  // Loop & End-of-Stream Analytics Tracker
  const handleEnded = () => {
    updateSession({ isPlaying: false });
    setIsBuffering(false);
    
    const video = videoRef.current;
    if (video && video.loop) {
      loopCountRef.current += 1;
      trackMediaEvent('loop', playerId, video.currentTime, video.duration, {
        loopCount: loopCountRef.current,
      });
    } else {
      trackMediaEvent('drop_off', playerId, video ? video.currentTime : 0, video ? video.duration : 0, {
        reason: 'ended'
      });
    }
    
    if (onEnded) onEnded();
  };

  const videoInfo = parseVideoUrl(url);

  // Callback ref for HTMLVideoElement attachment
  const setVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      if (videoRef.current && videoRef.current !== node) {
        detachVideoElement(videoRef.current);
      }
      videoRef.current = node;
      if (node) {
        attachVideoElement(node);
      }
    },
    [attachVideoElement, detachVideoElement]
  );

  // Sync aspect ratio when prop changes
  useEffect(() => {
    if (aspectRatio && aspectRatio !== 'auto') {
      setDetectedRatio(aspectRatio);
    } else if (format === 'reel' || format === 'story') {
      setDetectedRatio('9:16');
    }
  }, [aspectRatio, format]);

  // Synchronize mute state when prop changes
  useEffect(() => {
    if (muted !== undefined) {
      setSessionMuted(muted);
    }
  }, [muted, setSessionMuted]);

  // Reset player states when the URL changes
  useEffect(() => {
    updateSession({ currentTime: 0, duration: 0, isPlaying: autoPlay });
    setVideoResolution(null);
    setHoverPosition(null);
    lastPlaybackTimeRef.current = 0;
    setIsBuffering(false);
    setHasFatalError(false);
  }, [url, autoPlay, updateSession]);

  // Synchronize with global media coordinator to prevent double-audio clashing
  useEffect(() => {
    const handleStopMedia = (e: Event) => {
      const customEvent = e as CustomEvent<{ exceptMediaId?: string }>;
      if (customEvent.detail?.exceptMediaId !== playerId) {
        pauseSession(videoRef.current);
      }
    };

    const handleMediaPlaying = (e: Event) => {
      const customEvent = e as CustomEvent<{ mediaId: string }>;
      if (customEvent.detail?.mediaId !== playerId) {
        pauseSession(videoRef.current);
      }
    };

    window.addEventListener('perplexta:stop_all_media', handleStopMedia);
    window.addEventListener('perplexta:media_playing', handleMediaPlaying);

    return () => {
      window.removeEventListener('perplexta:stop_all_media', handleStopMedia);
      window.removeEventListener('perplexta:media_playing', handleMediaPlaying);
    };
  }, [playerId, pauseSession]);

  // Background playback prevention: Pause when tab becomes hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseSession(videoRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pauseSession]);

  // Smooth pausing during scrolling (IntersectionObserver) - bypassed during Fullscreen mode
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.15) {
            const isFsActive = !!(
              document.fullscreenElement ||
              (document as any).webkitFullscreenElement ||
              isFullscreen ||
              isTransitioningFullscreen
            );
            if (!isFsActive && videoRef.current && !videoRef.current.paused) {
              pauseSession(videoRef.current);
            }
          }
        });
      },
      { threshold: [0, 0.15, 0.5, 1.0] }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [isFullscreen, isTransitioningFullscreen, pauseSession]);

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;

    const dur = video.duration || 0;
    updateSession({ duration: dur });

    const naturalWidth = video.videoWidth || 0;
    const naturalHeight = video.videoHeight || 0;

    if (naturalWidth > 0 && naturalHeight > 0) {
      let qualityLabel = `${naturalHeight}p`;
      if (naturalHeight >= 2160 || naturalWidth >= 3840) {
        qualityLabel = '4K';
      } else if (naturalHeight >= 1440 || naturalWidth >= 2560) {
        qualityLabel = '2K QHD';
      } else if (naturalHeight >= 1080 || naturalWidth >= 1920) {
        qualityLabel = '1080p FHD';
      } else if (naturalHeight >= 720 || naturalWidth >= 1280) {
        qualityLabel = '720p HD';
      } else if (naturalHeight >= 480) {
        qualityLabel = '480p SD';
      } else {
        qualityLabel = `${naturalWidth}×${naturalHeight}`;
      }

      setVideoResolution({
        width: naturalWidth,
        height: naturalHeight,
        qualityLabel
      });

      const ratioNum = naturalWidth / naturalHeight;
      let calculatedRatio: MediaAspectRatio = '16:9';

      if (ratioNum >= 1.9) {
        calculatedRatio = '21:9';
      } else if (ratioNum > 1.15) {
        calculatedRatio = '16:9';
      } else if (ratioNum >= 0.92) {
        calculatedRatio = '1:1';
      } else if (ratioNum > 0.68) {
        calculatedRatio = '4:5';
      } else {
        calculatedRatio = '9:16';
      }

      // If aspectRatio is auto, or if default 16:9 was passed but the video is actually vertical or square, adapt dynamically
      if (!aspectRatio || aspectRatio === 'auto' || (aspectRatio === '16:9' && (calculatedRatio === '9:16' || calculatedRatio === '4:5' || calculatedRatio === '1:1'))) {
        setDetectedRatio(calculatedRatio);
      }

      if (resourceId) {
        updateMediaMetadata(resourceId, {
          naturalWidth,
          naturalHeight,
          calculatedRatio: ratioNum,
          aspectRatio: calculatedRatio,
          format
        });
      }
    }
  };

  const resetHideTimer = useCallback(() => {
    setShowOverlayControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    if (isPlaying) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowOverlayControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (hasFatalError) {
      setHasFatalError(false);
      setIsBuffering(true);
      const resumeTime = lastPlaybackTimeRef.current || currentTime || 0;
      try {
        video.load();
        video.currentTime = resumeTime;
        playSession(video);
      } catch (_) {}
      return;
    }

    if (duration > 0 && currentTime >= duration - 0.3) {
      video.currentTime = 0;
      seekSession(0, video);
      playSession(video);
      resetHideTimer();
      return;
    }

    if (isPlaying) {
      pauseSession(video);
      setShowOverlayControls(true);
    } else {
      playSession(video);
      resetHideTimer();
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setSessionVolume(newVol);
  };

  const toggleMute = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const newMuted = !isMuted;
    isTogglingMuteRef.current = true;
    setTimeout(() => {
      isTogglingMuteRef.current = false;
    }, 400);

    setSessionMuted(newMuted);

    const video = videoRef.current;
    if (video) {
      try {
        video.muted = newMuted;
        if (isPlaying || !video.paused) {
          // If the video is playing, unmuting might trigger a browser pause.
          // Calling play() synchronously inside this user gesture event handler
          // guarantees browser authorization for unmuted playback.
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                updateSession({ isPlaying: true });
              })
              .catch((err) => {
                console.warn('[UniversalMediaPlayer] Play failed on unmute, trying muted fallback:', err);
                if (!newMuted) {
                  video.muted = true;
                  video.play()
                    .then(() => updateSession({ isPlaying: true }))
                    .catch(() => updateSession({ isPlaying: false }));
                } else {
                  updateSession({ isPlaying: false });
                }
              });
          } else {
            updateSession({ isPlaying: true });
          }
        }
      } catch (_) {}
    }

    if (muteFeedbackTimerRef.current) {
      clearTimeout(muteFeedbackTimerRef.current);
    }
    setMuteFeedback({ show: true, isMuted: newMuted });
    muteFeedbackTimerRef.current = setTimeout(() => {
      setMuteFeedback(null);
    }, 1100);
  };

  const toggleFullscreen = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container) return;

    setFullscreenTransition(true, 1000);

    if (video) {
      updateSession({
        currentTime: video.currentTime,
        duration: !isNaN(video.duration) ? video.duration : duration,
        isPlaying: !video.paused && !video.ended,
        volume: video.volume,
        isMuted: video.muted
      });
    }

    const restoreAndResume = () => {
      const isFsActive = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      updateSession({ isFullscreen: isFsActive });
      if (video) {
        attachVideoElement(video);
      }
    };

    if (isCssFullscreen) {
      setIsCssFullscreen(false);
      updateSession({ isFullscreen: false });
      return;
    }

    if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen()
          .then(restoreAndResume)
          .catch(() => {
            if ((video as any)?.webkitEnterFullscreen) {
              try {
                (video as any).webkitEnterFullscreen();
                restoreAndResume();
                return;
              } catch (_) {}
            }
            setIsCssFullscreen(true);
            updateSession({ isFullscreen: true });
          });
      } else if ((container as any).webkitRequestFullscreen) {
        try {
          (container as any).webkitRequestFullscreen();
          restoreAndResume();
        } catch (_) {
          setIsCssFullscreen(true);
          updateSession({ isFullscreen: true });
        }
      } else if ((video as any)?.webkitEnterFullscreen) {
        try {
          (video as any).webkitEnterFullscreen();
          restoreAndResume();
        } catch (_) {
          setIsCssFullscreen(true);
          updateSession({ isFullscreen: true });
        }
      } else {
        setIsCssFullscreen(true);
        updateSession({ isFullscreen: true });
      }
    } else {
      setIsCssFullscreen(false);
      if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
        if (document.exitFullscreen) {
          document.exitFullscreen()
            .then(restoreAndResume)
            .catch(restoreAndResume);
        } else if ((document as any).webkitExitFullscreen) {
          try {
            (document as any).webkitExitFullscreen();
          } catch (_) {}
          restoreAndResume();
        }
      } else {
        updateSession({ isFullscreen: false });
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCssFullscreen) {
        setIsCssFullscreen(false);
        updateSession({ isFullscreen: false });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCssFullscreen, updateSession]);

  useEffect(() => {
    const handleFsChange = () => {
      const isFsActive = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      updateSession({ isFullscreen: isFsActive });

      const video = videoRef.current;
      if (video) {
        attachVideoElement(video);
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);

    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.addEventListener('webkitbeginfullscreen', handleFsChange);
      videoEl.addEventListener('webkitendfullscreen', handleFsChange);
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      if (videoEl) {
        videoEl.removeEventListener('webkitbeginfullscreen', handleFsChange);
        videoEl.removeEventListener('webkitendfullscreen', handleFsChange);
      }
    };
  }, [updateSession, attachVideoElement]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Embed Renderer for external video providers
  if (videoInfo.type !== 'direct' && videoInfo.embedUrl) {
    return (
      <UniversalMediaContainer
        aspectRatio={detectedRatio}
        fitMode={fitMode}
        maxHeight={maxHeight}
        className={`rounded-shape-lg border border-[var(--border-default)] ${className}`}
      >
        <iframe
          src={videoInfo.embedUrl}
          className="w-full h-full border-0 absolute inset-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-shape-sm bg-black/75 backdrop-blur-md text-[var(--fg-accent)] text-[11px] font-bold border border-[var(--border-accent)]/20 flex items-center gap-1 pointer-events-none">
          <Film size={12} />
          <span>{videoInfo.type.toUpperCase()}</span>
        </div>
      </UniversalMediaContainer>
    );
  }

  const directVideoUrl = getMediaUrl(videoInfo.directUrl || url);
  const isVertical = detectedRatio === '9:16' || detectedRatio === '4:5' || format === 'reel' || format === 'story' || aspectRatio === '9:16' || aspectRatio === '4:5';

  // For vertical media (Reels/Stories) embedded in feed cards, default container ratio to 4:5 (Facebook/Instagram standard feed aspect ratio).
  // This guarantees clean viewport presence without clipping, and keeps all top and bottom controls 100% visible inside the visible frame.
  const effectiveRatio: MediaAspectRatio = isVertical ? '4:5' : detectedRatio;

  const effectiveFullscreen = isFullscreen || isCssFullscreen;

  return (
    <div
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onMouseEnter={() => setShowOverlayControls(true)}
      onMouseLeave={() => isPlaying && setShowOverlayControls(false)}
      className={`w-full relative flex items-center justify-center bg-black select-none ${
        effectiveFullscreen ? 'fixed inset-0 z-[99999] w-screen h-screen bg-black' : ''
      }`}
    >
      <UniversalMediaContainer
        aspectRatio={effectiveFullscreen ? undefined : effectiveRatio}
        fitMode={effectiveFullscreen ? 'contain' : (fitMode || (isVertical ? 'cover' : 'contain'))}
        maxHeight={effectiveFullscreen ? '100vh' : maxHeight}
        backdropUrl={posterUrl}
        ambientGlow={false}
        className={`w-full group select-none ${className} ${effectiveFullscreen ? '!w-full !h-full !max-h-screen' : ''}`}
        overlaySlot={
          <>
            {showControls ? (
              <div
                onClick={(e) => e.stopPropagation()}
                className={`absolute bottom-0 inset-x-0 z-30 px-3 pb-2 pt-1 bg-transparent flex flex-col gap-1.5 transition-opacity duration-300 pointer-events-auto ${
                  showOverlayControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                {/* Seek Progress Bar with Hover Metadata Preview - Strictly LTR coordinates for smooth seeking */}
                <div
                  ref={scrubberRef}
                  dir="ltr"
                  className="relative flex items-center w-full group/slider py-1.5 cursor-pointer touch-none select-none"
                  onPointerDown={handleScrubberPointerDown}
                  onMouseMove={(e) => {
                    if (isScrubbing) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    if (rect.width > 0 && duration > 0) {
                      const relativeX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                      const percent = (relativeX / rect.width) * 100;
                      const hoverTime = (relativeX / rect.width) * duration;
                      setHoverPosition({ percent, time: hoverTime, clientX: relativeX });
                    }
                  }}
                  onMouseLeave={() => {
                    if (!isScrubbing) {
                      setHoverPosition(null);
                    }
                  }}
                >
                  {/* Floating Metadata Tooltip on Hover */}
                  {hoverPosition && duration > 0 && (
                    <div
                      style={{
                        left: `${Math.max(8, Math.min(92, hoverPosition.percent))}%`,
                        transform: 'translateX(-50%)'
                      }}
                      className="absolute bottom-full mb-1.5 z-30 pointer-events-none flex flex-col items-center animate-in fade-in zoom-in-95 duration-fast"
                    >
                      <div className="px-2 py-0.5 rounded-shape-xs bg-neutral-900/95 backdrop-blur-md border border-white/20 shadow-xl text-white text-[10px] font-mono flex items-center gap-1.5 whitespace-nowrap">
                        <span className="font-bold text-[var(--fg-accent,#60a5fa)]">
                          {formatTime(hoverPosition.time)}
                        </span>
                        <span className="text-gray-400 text-[9px]">
                          / {formatTime(duration)}
                        </span>
                        <div className="flex items-center gap-1 ps-1 border-s border-white/20">
                          <span className="px-1.5 py-0.5 rounded-shape-xs bg-[var(--fg-accent,#3b82f6)]/20 text-[var(--fg-accent,#60a5fa)] font-bold text-[8px] uppercase tracking-wider">
                            {videoResolution?.qualityLabel || (effectiveIsRtl ? '1080p' : '1080p')}
                          </span>
                        </div>
                      </div>
                      {/* Tiny triangle caret */}
                      <div className="w-1.5 h-1.5 rotate-45 bg-neutral-900 border-r border-b border-white/20 -mt-0.5" />
                    </div>
                  )}

                  {/* Scrubber Visual Track Bar */}
                  <div className="relative w-full h-1 group-hover/slider:h-1.5 rounded-full bg-white/25 overflow-hidden transition-all duration-fast shadow-xs">
                    {/* Buffered Progress */}
                    <div
                      style={{ width: `${bufferedPercent}%` }}
                      className="absolute top-0 left-0 bottom-0 bg-white/35 transition-all duration-150"
                    />
                    {/* Played Progress Track */}
                    <div
                      style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                      className="absolute top-0 left-0 bottom-0 bg-[var(--comp-button-primary-bg,#3b82f6)] transition-none shadow-sm"
                    />
                  </div>

                  {/* Scrubber Thumb Knob */}
                  <div
                    style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-md border border-black/30 pointer-events-none scale-0 group-hover/slider:scale-100 transition-transform duration-fast"
                  />
                </div>

                {/* Control Action Buttons & Status Row */}
                <div className="flex items-center justify-between text-white text-xs font-mono gap-2 px-0.5">
                  {/* Left Controls: Play/Pause, Volume, Time */}
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="w-7 h-7 min-w-[28px] min-h-[28px] rounded-shape-xs bg-black/40 hover:bg-black/60 backdrop-blur-xs text-white transition-all cursor-pointer flex items-center justify-center border border-white/10 active:scale-90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                      title={
                        isPlaying
                          ? (effectiveIsRtl ? 'إيقاف مؤقت' : 'Pause')
                          : (duration > 0 && currentTime >= duration - 0.3)
                            ? (effectiveIsRtl ? 'إعادة التشغيل' : 'Replay')
                            : (effectiveIsRtl ? 'تشغيل' : 'Play')
                      }
                      aria-label={
                        isPlaying
                          ? (effectiveIsRtl ? 'إيقاف مؤقت' : 'Pause')
                          : (duration > 0 && currentTime >= duration - 0.3)
                            ? (effectiveIsRtl ? 'إعادة التشغيل' : 'Replay')
                            : (effectiveIsRtl ? 'تشغيل' : 'Play')
                      }
                    >
                      {isPlaying ? (
                        <Pause size={14} />
                      ) : (duration > 0 && currentTime >= duration - 0.3) ? (
                        <RotateCcw size={14} className="hover:rotate-180 transition-transform duration-300" />
                      ) : (
                        <Play size={14} className="ms-0.5 fill-current" />
                      )}
                    </button>

                    {/* Compact Volume Control */}
                    <div className="relative flex items-center group/volume bg-black/40 hover:bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded-shape-xs transition-all border border-white/10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                      <button
                        type="button"
                        onClick={toggleMute}
                        className="w-6 h-6 flex items-center justify-center text-white/90 hover:text-white transition-colors cursor-pointer"
                        title={isMuted ? (effectiveIsRtl ? 'تشغيل الصوت' : 'Unmute') : (effectiveIsRtl ? 'كتم الصوت' : 'Mute')}
                        aria-label={isMuted ? (effectiveIsRtl ? 'تشغيل الصوت' : 'Unmute') : (effectiveIsRtl ? 'كتم الصوت' : 'Mute')}
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX size={14} className="text-red-400 animate-pulse" />
                        ) : volume < 0.5 ? (
                          <Volume1 size={14} />
                        ) : (
                          <Volume2 size={14} />
                        )}
                      </button>
                      <div dir="ltr" className="overflow-hidden transition-all duration-200 ease-out flex items-center max-w-0 group-hover/volume:max-w-[65px] focus-within/volume:max-w-[65px] opacity-0 group-hover/volume:opacity-100 focus-within/volume:opacity-100 ps-1">
                        <input
                          dir="ltr"
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={isMuted ? 0 : volume}
                          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                          className="w-13 h-1 bg-white/40 hover:h-1.5 rounded-shape-xs appearance-none cursor-pointer accent-[var(--accent)]"
                          title={effectiveIsRtl ? `مستوى الصوت: ${Math.round(volume * 100)}%` : `Volume: ${Math.round(volume * 100)}%`}
                          aria-label={effectiveIsRtl ? `مستوى الصوت: ${Math.round(volume * 100)}%` : `Volume: ${Math.round(volume * 100)}%`}
                        />
                      </div>
                    </div>

                    <span className="text-[10px] sm:text-[11px] text-white font-mono select-none font-bold tabular-nums ms-1 whitespace-nowrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                      {formatTime(currentTime)} <span className="text-white/40">/</span> {formatTime(duration)}
                    </span>
                  </div>

                  {/* Right Controls: Playback Speed, Quality, Fullscreen */}
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    {/* Playback Speed Control */}
                    <div className="relative flex items-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSpeedMenu(!showSpeedMenu);
                          setShowQualityMenu(false);
                        }}
                        className="h-7 px-2 rounded-shape-xs bg-black/40 hover:bg-black/60 backdrop-blur-xs text-white/90 hover:text-white transition-all flex items-center gap-1 cursor-pointer border border-white/10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                        title={effectiveIsRtl ? `سرعة التشغيل: ${playbackSpeed}x` : `Playback Speed: ${playbackSpeed}x`}
                        aria-label={effectiveIsRtl ? 'سرعة التشغيل' : 'Playback Speed'}
                      >
                        <Gauge size={12} className="text-white/80" />
                        <span className="font-mono text-[10px] font-bold">{playbackSpeed}x</span>
                      </button>

                      {/* Speed Popup Menu */}
                      {showSpeedMenu && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute bottom-full mb-2 end-0 flex flex-col bg-neutral-900/95 backdrop-blur-md border border-white/20 rounded-shape-sm py-1 min-w-[100px] shadow-2xl z-50 text-xs animate-in fade-in zoom-in-95"
                        >
                          <div className="px-2.5 py-1 text-[9px] font-bold text-gray-400 border-b border-white/10 uppercase tracking-wider">
                            {effectiveIsRtl ? 'سرعة التشغيل' : 'Speed'}
                          </div>
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((spd) => (
                            <button
                              key={spd}
                              type="button"
                              onClick={() => {
                                setPlaybackSpeed(spd);
                                if (videoRef.current) {
                                  videoRef.current.playbackRate = spd;
                                }
                                setShowSpeedMenu(false);
                              }}
                              className={`px-2.5 py-1 text-start flex items-center justify-between hover:bg-white/15 transition-colors cursor-pointer text-[10px] ${
                                playbackSpeed === spd ? 'text-[var(--fg-accent,#60a5fa)] font-bold bg-white/10' : 'text-gray-200'
                              }`}
                            >
                              <span>{spd === 1 ? (effectiveIsRtl ? '1x (عادي)' : '1x Normal') : `${spd}x`}</span>
                              {playbackSpeed === spd && <Check size={11} className="text-[var(--fg-accent,#60a5fa)]" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quality Selector */}
                    <div className="relative flex items-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowQualityMenu(!showQualityMenu);
                          setShowSpeedMenu(false);
                        }}
                        className="h-7 px-2 rounded-shape-xs bg-black/40 hover:bg-black/60 backdrop-blur-xs text-white/90 hover:text-white transition-all flex items-center gap-1 cursor-pointer border border-white/10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                        title={effectiveIsRtl ? `الدقة: ${videoResolution?.qualityLabel || 'تلقائي'}` : `Quality: ${videoResolution?.qualityLabel || 'Auto'}`}
                        aria-label={effectiveIsRtl ? 'الدقة' : 'Quality'}
                      >
                        <Settings2 size={12} className="text-white/80" />
                        <span className="font-mono text-[10px] font-bold text-[var(--fg-accent,#60a5fa)]">
                          {videoResolution?.qualityLabel || '1080p'}
                        </span>
                      </button>

                      {/* Quality Popup Menu */}
                      {showQualityMenu && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute bottom-full mb-2 end-0 flex flex-col bg-neutral-900/95 backdrop-blur-md border border-white/20 rounded-shape-sm py-1 min-w-[130px] shadow-2xl z-50 text-xs animate-in fade-in zoom-in-95"
                        >
                          <div className="px-2.5 py-1 text-[9px] font-bold text-gray-400 border-b border-white/10 uppercase tracking-wider">
                            {effectiveIsRtl ? 'دقة وجودة العرض' : 'Playback Quality'}
                          </div>
                          {[
                            { id: '4k', labelAr: '4K فائق الدقة', labelEn: '4K Ultra HD', label: '4K', w: 3840, h: 2160 },
                            { id: '1080p', labelAr: '1080p عالي الدقة', labelEn: '1080p Full HD', label: '1080p', w: 1920, h: 1080 },
                            { id: '720p', labelAr: '720p قياسي HD', labelEn: '720p HD', label: '720p', w: 1280, h: 720 },
                            { id: '480p', labelAr: '480p توفير البيانات', labelEn: '480p SD', label: '480p', w: 854, h: 480 },
                            { id: 'auto', labelAr: 'تلقائية (ذكية)', labelEn: 'Auto (Recommended)', label: 'Auto', w: 0, h: 0 }
                          ].map((item) => {
                            const isCurrent = videoResolution
                              ? (item.id === 'auto' ? false : videoResolution.qualityLabel.toLowerCase().includes(item.id.toLowerCase()))
                              : item.id === 'auto';
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  if (item.w > 0) {
                                    setVideoResolution({
                                      width: item.w,
                                      height: item.h,
                                      qualityLabel: item.label
                                    });
                                  } else {
                                    setVideoResolution(null);
                                  }
                                  setShowQualityMenu(false);
                                }}
                                className={`px-2.5 py-1 text-start flex items-center justify-between hover:bg-white/15 transition-colors cursor-pointer text-[10px] ${
                                  isCurrent ? 'text-[var(--fg-accent,#60a5fa)] font-bold bg-white/10' : 'text-gray-200'
                                }`}
                              >
                                <span>{effectiveIsRtl ? item.labelAr : item.labelEn}</span>
                                {isCurrent && <Check size={11} className="text-[var(--fg-accent,#60a5fa)]" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Fullscreen / Zoom Button - Fully Activated */}
                    <button
                      type="button"
                      onClick={(e) => {
                        setShowQualityMenu(false);
                        setShowSpeedMenu(false);
                        if (format === 'reel' && onOpenReels) {
                          onOpenReels();
                        } else {
                          toggleFullscreen(e);
                        }
                      }}
                      className="w-7 h-7 min-w-[28px] min-h-[28px] rounded-shape-xs bg-black/40 hover:bg-black/60 backdrop-blur-xs text-white/90 hover:text-white transition-all cursor-pointer flex items-center justify-center border border-white/10 active:scale-90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                      title={
                        effectiveFullscreen
                          ? (effectiveIsRtl ? 'إنهاء ملء الشاشة (Esc)' : 'Exit Fullscreen (Esc)')
                          : (effectiveIsRtl ? 'تكبير وملء الشاشة' : 'Fullscreen / Zoom')
                      }
                      aria-label={
                        effectiveFullscreen
                          ? (effectiveIsRtl ? 'إنهاء ملء الشاشة' : 'Exit Fullscreen')
                          : (effectiveIsRtl ? 'تكبير وملء الشاشة' : 'Fullscreen / Zoom')
                      }
                    >
                      {effectiveFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
        </>
      }
      >
        {directVideoUrl && hasBeenNearViewport ? (
          <>
            <video
              ref={setVideoRef}
              src={directVideoUrl}
              poster={posterUrl || autoPosterUrl || undefined}
              preload="metadata"
              playsInline
              loop={loop}
              data-media-id={playerId}
              muted={isMuted}
              autoPlay={autoPlay}
              onTimeUpdate={() => {
                if (videoRef.current) {
                  const cur = videoRef.current.currentTime;
                  updateSession({ currentTime: cur });
                  lastPlaybackTimeRef.current = cur;
                  if (isBuffering) setIsBuffering(false);
                  updateBuffered();
                }
              }}
              onProgress={updateBuffered}
              onLoadedMetadata={handleLoadedMetadata}
              onLoadedData={handleLoadedData}
              onCanPlay={() => {
                setIsBuffering(false);
                setHasFatalError(false);
              }}
              onPlaying={() => {
                updateSession({ isPlaying: true });
                setIsBuffering(false);
                setHasFatalError(false);
                const video = videoRef.current;
                trackMediaEvent('play', playerId, video ? video.currentTime : 0, video ? video.duration : 0);
              }}
              onWaiting={() => {
                if (isPlaying) {
                  setIsBuffering(true);
                }
              }}
              onError={() => {
                setIsBuffering(false);
                const video = videoRef.current;
                // Only consider fatal if initial resource load genuinely fails before any playback or duration
                if (
                  video &&
                  video.error &&
                  video.error.code === 4 &&
                  (!video.duration || isNaN(video.duration)) &&
                  video.readyState === 0 &&
                  !isPlaying &&
                  lastPlaybackTimeRef.current === 0
                ) {
                  setHasFatalError(true);
                }
              }}
              onPause={() => {
                if (isTransitioningFullscreen && isPlaying) {
                  // Ignore transient pause triggered by browser DOM reparenting during fullscreen transitions
                  if (videoRef.current && videoRef.current.paused) {
                    videoRef.current.play().then(() => updateSession({ isPlaying: true })).catch(() => {});
                  }
                  return;
                }
                if (isTogglingMuteRef.current && videoRef.current) {
                  videoRef.current
                    .play()
                    .then(() => updateSession({ isPlaying: true }))
                    .catch(() => {
                      if (videoRef.current) {
                        videoRef.current.muted = true;
                        videoRef.current
                          .play()
                          .then(() => updateSession({ isPlaying: true }))
                          .catch(() => {
                            updateSession({ isPlaying: false });
                          });
                      }
                    });
                  return;
                }
                updateSession({ isPlaying: false });
                setIsBuffering(false);
                const video = videoRef.current;
                trackMediaEvent('pause', playerId, video ? video.currentTime : 0, video ? video.duration : 0);
              }}
              onEnded={handleEnded}
              className={`w-full h-full relative z-10 cursor-pointer ${
                fitMode === 'cover'
                  ? 'object-cover'
                  : fitMode === 'contain'
                  ? 'object-contain'
                  : 'object-fill'
              }`}
              onClick={handleVideoClick}
            />

            {/* Floating Heart Elements for TikTok-grade double-tap interactions */}
            <AnimatePresence>
              {hearts.map((h) => (
                <motion.div
                  key={h.id}
                  initial={{ scale: 0, opacity: 0, x: h.x - 24, y: h.y - 24 }}
                  animate={{
                    scale: [0, 1.4, 1.2, 0.8],
                    opacity: [0, 1, 1, 0],
                    y: h.y - 140,
                    rotate: [-15, 15, -10, 0]
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.75, ease: 'easeOut' }}
                  className="absolute z-25 pointer-events-none select-none text-red-500 text-5xl flex items-center justify-center filter drop-shadow-lg"
                >
                  ❤️
                </motion.div>
              ))}
            </AnimatePresence>
          </>
        ) : (
          <div 
            className="w-full h-full relative cursor-pointer flex items-center justify-center bg-black overflow-hidden" 
            onClick={(e) => {
              e.stopPropagation();
              setIsNearViewport(true);
              setHasBeenNearViewport(true);
            }}
          >
            {posterUrl || autoPosterUrl ? (
              <img
                src={posterUrl || autoPosterUrl || undefined}
                alt={title || "Media Poster"}
                loading="lazy"
                className={`w-full h-full ${
                  fitMode === 'cover'
                    ? 'object-cover'
                    : fitMode === 'contain'
                    ? 'object-contain'
                    : 'object-fill'
                }`}
              />
            ) : (
              <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-gray-500" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center transition-all">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-shape-sm bg-black/40 hover:bg-black/60 backdrop-blur-xs flex items-center justify-center border border-white/20 transition-all scale-100 hover:scale-105 shadow-md">
                <Play size={18} className="text-white fill-white ms-0.5" />
              </div>
            </div>
          </div>
        )}

        {/* Soft Buffering Spinner Overlay (No flash / No stream abort) */}
        {isBuffering && isPlaying && !hasFatalError && (
          <div className="absolute inset-0 z-25 flex items-center justify-center pointer-events-none">
            <div className="w-9 h-9 rounded-shape-sm bg-black/50 backdrop-blur-xs flex items-center justify-center shadow-md border border-white/15">
              <Loader2 size={18} className="animate-spin text-[var(--fg-accent)]" />
            </div>
          </div>
        )}

        {/* Fatal Error Fallback with Clean Manual Retry */}
        {hasFatalError && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-center">
            <AlertCircle size={28} className="text-amber-400 mb-2" />
            <p className="text-white text-xs font-bold mb-3">
              {isRtl ? 'تعذر تشغيل الفيديو' : 'Video playback error'}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setHasFatalError(false);
                setIsBuffering(true);
                const v = videoRef.current;
                if (v) {
                  const resumeTime = lastPlaybackTimeRef.current || 0;
                  try {
                    v.load();
                    v.currentTime = resumeTime;
                    v.play().catch(() => {});
                  } catch (_) {}
                }
              }}
              className="px-4 py-2 rounded-shape-sm bg-[var(--accent)] text-white text-xs font-bold flex items-center gap-1.5 hover:opacity-90 shadow-md border border-[var(--border-main)] cursor-pointer active:scale-95 transition-all"
            >
              <RotateCcw size={14} />
              <span>{isRtl ? 'إعادة المحاولة' : 'Retry'}</span>
            </button>
          </div>
        )}

        {/* Center Play/Pause Floating Transparent Button */}
        {!isPlaying && !isBuffering && !hasFatalError && directVideoUrl && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 z-20 m-auto w-10 h-10 sm:w-11 sm:h-11 rounded-shape-sm bg-black/40 hover:bg-black/60 text-white border border-white/20 flex items-center justify-center shadow-lg backdrop-blur-xs transition-all duration-base hover:scale-105 active:scale-95 cursor-pointer group"
            title={isRtl ? 'تشغيل الفيديو' : 'Play Video'}
          >
            <Play size={18} className="ms-0.5 fill-white text-white group-hover:scale-105 transition-transform" />
          </button>
        )}

        {/* Visual Mute / Unmute Indicator Overlay */}
        <AnimatePresence>
          {muteFeedback?.show && (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="absolute inset-0 m-auto w-fit h-fit z-35 pointer-events-none flex items-center gap-2 px-4 py-2.5 rounded-shape-lg bg-black/85 backdrop-blur-md border border-white/20 text-white shadow-2xl"
            >
              {muteFeedback.isMuted ? (
                <div className="w-7 h-7 rounded-shape-xs bg-red-500/20 text-red-400 flex items-center justify-center">
                  <VolumeX size={16} />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-shape-xs bg-[var(--fg-success)]/20 text-[var(--fg-success)] flex items-center justify-center">
                  <Volume2 size={16} />
                </div>
              )}
              <span className="text-xs font-bold font-sans select-none tracking-wide">
                {muteFeedback.isMuted
                  ? (isRtl ? 'تم كتم الصوت' : 'Muted')
                  : (isRtl ? 'تم تشغيل الصوت' : 'Sound Unmuted')}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {showDiagnostics && (
          <OnScreenDiagnostics
            isPlaying={isPlaying}
            isMuted={isMuted}
            volume={volume}
            currentTime={currentTime}
            duration={duration}
            isBuffering={isBuffering}
            hasFatalError={hasFatalError}
            videoResolution={videoResolution}
            videoElement={videoRef.current}
            playerId={playerId}
            onClose={() => setShowDiagnostics(false)}
            isRtl={isRtl}
          />
        )}
      </UniversalMediaContainer>
    </div>
  );
};

