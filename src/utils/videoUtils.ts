/**
 * Video Utilities for Perplexta Platform
 * Handles YouTube URL parsing, embed link generation, and video specs.
 */

export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.trim().match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export function getYouTubeEmbedUrl(url: string | null | undefined, autoplay = true): string | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;
  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    rel: '0',
    modestbranding: '1',
    playsinline: '1'
  });
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

export const RECOMMENDED_VIDEO_SPECS = {
  aspectRatio: '16:9',
  resolutions: {
    recommended: '1920x1080 (1080p Full HD)',
    ultra2k: '2560x1440 (2K QHD)',
    cinema4k: '3840x2160 (4K UHD)'
  },
  codecs: {
    video: 'H.264 / AVC (MP4)',
    audio: 'AAC Stereo 192-320 kbps'
  },
  frameRate: '30fps or 60fps',
  bitrate: '4000 - 8000 Kbps (4-8 Mbps)',
  maxFileSizeMB: 100
};
