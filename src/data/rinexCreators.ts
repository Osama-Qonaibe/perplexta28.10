// Rinex Creators & Marketplace Ecosystem Architecture
import { secureStorage } from '../lib/storage';

export interface RinexCreator {
  id: string;
  userId?: number;
  username: string;
  name: string;
  roleAr: string;
  roleEn: string;
  avatar: string;
  bioAr: string;
  bioEn: string;
  verified: boolean;
  totalViews: number;
  totalUses: number;
  rating: number;
  earningsBalance: number;
  followersCount: number;
  likesCount: number;
  profileVisitsCount: number;
  socialLinks: {
    twitter?: string;
    behance?: string;
    instagram?: string;
    website?: string;
  };
  email?: string;
  createdAt: number;
  pendingBonusUsd?: number;
  bonusClaimed?: boolean;
  bonusClaimedAt?: string;
  publishedTemplatesCount?: number;
}

export interface MarketplaceTemplate {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorUsername: string;
  creatorAvatar: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  thumbnail: string;
  category: 'reels' | 'story' | 'marketing' | 'social' | 'youtube' | 'cards' | 'video' | 'tiktok';
  categoryLabelAr: string;
  dimensions: string;
  priceType: 'free' | 'pro' | 'points';
  price: number; // 0 if free, or points/credits
  viewsCount: number;
  usesCount: number;
  rating: number;
  createdAt: number;
  elements?: any[];
  canvasBackground?: string;
  videoUrl?: string;
  previewVideoUrl?: string;
}

export interface CreatorPayoutRequest {
  id: string;
  creatorId: string;
  amount: number;
  method: string;
  details: string;
  status: 'pending' | 'completed' | 'rejected';
  requestedAt: number;
}

const INITIAL_FALLBACK_CREATORS = [
  {
    id: 'creator-1',
    username: 'sarah_designs',
    name: 'سارة العتيبي',
    role_ar: 'خبيرة تصميم هويات وقوالب سوشيال ميديا',
    role_en: 'Brand & Social Media Design Expert',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah_designs&backgroundColor=b6e3f4',
    bio_ar: 'مصممة جرافيك بخبرة 7 سنوات. متخصصة في ابتكار قوالب احترافية تخدم صناع المحتوى والشركات الناشئة في رينكس.',
    bio_en: 'Graphic designer with 7 years of experience. Specialized in creating high-impact templates for creators.',
    verified: true,
    total_views: 48200,
    total_uses: 12450,
    rating: 4.9,
    earnings_balance: 1840.50,
    followers_count: 3820,
    likes_count: 14200,
    profile_visits_count: 61500,
    social_links: {
      behance: 'https://behance.net',
      instagram: 'https://instagram.com',
      twitter: 'https://twitter.com'
    },
    email: 'sarah@example.com',
    created_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'creator-2',
    username: 'ahmad_media',
    name: 'مهندس أحمد الشمري',
    role_ar: 'صانع محتوى مرئي وخبير موشن جرافيك',
    role_en: 'Visual Creator & Motion Expert',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ahmad_media&backgroundColor=c0aede',
    bio_ar: 'أبتكر قوالب ريلز سينمائية وقصص عمودية تسويقية تساعد العلامات التجارية على النمو السريع.',
    bio_en: 'Creating cinematic reels and vertical marketing stories that help brands scale quickly.',
    verified: true,
    total_views: 35100,
    total_uses: 9800,
    rating: 4.8,
    earnings_balance: 1420.00,
    followers_count: 2910,
    likes_count: 9800,
    profile_visits_count: 42300,
    social_links: {
      twitter: 'https://twitter.com',
      website: 'https://rinex.studio'
    },
    email: 'ahmad@example.com',
    created_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'creator-3',
    username: 'lina_graphics',
    name: 'لينا مصطفى',
    role_ar: 'مصممة واجهات ومبدعة محتوى إعلاني',
    role_en: 'UI/UX & Ad Creative Designer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lina_graphics&backgroundColor=ffd5dc',
    bio_ar: 'شغوفة بتصميم البوسترات التسويقية والكتالوجات التفاعلية بأعلى معايير الجودة والجمالية البصرية.',
    bio_en: 'Passionate about crafting marketing posters and interactive catalogs with highest visual standards.',
    verified: true,
    total_views: 29400,
    total_uses: 8100,
    rating: 4.9,
    earnings_balance: 980.25,
    followers_count: 2150,
    likes_count: 7600,
    profile_visits_count: 34100,
    social_links: {
      behance: 'https://behance.net',
      instagram: 'https://instagram.com'
    },
    email: 'lina@example.com',
    created_at: '2026-01-01T00:00:00.000Z'
  }
];

const INITIAL_FALLBACK_TEMPLATES = [
  {
    id: 'm-tpl-1',
    creator_id: 'creator-1',
    creator_name: 'سارة العتيبي',
    creator_username: 'sarah_designs',
    creator_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah_designs&backgroundColor=b6e3f4',
    title_ar: 'قالب إعلان سوشيال ميديا عصري متدرج',
    title_en: 'Modern Gradient Social Media Ad',
    description_ar: 'قالب احترافي مصمم خصيصاً لحملات إنستغرام وتويتر مع خط تجوال فاخر وتوزيع ألوان مدروس.',
    description_en: 'Professional template crafted for Instagram & Twitter campaigns with exquisite typography.',
    thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%236366f1"/><stop offset="50%" stop-color="%238b5cf6"/><stop offset="100%" stop-color="%23ec4899"/></linearGradient></defs><rect width="800" height="800" fill="url(%23g1)"/><rect x="60" y="60" width="680" height="680" rx="24" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/><rect x="250" y="140" width="300" height="50" rx="25" fill="rgba(255,255,255,0.25)"/><text x="400" y="174" fill="%23ffffff" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">🔥 عرض خاص وحصري</text><text x="400" y="320" fill="%23ffffff" font-size="52" font-family="sans-serif" font-weight="900" text-anchor="middle">أطلق مشروعك الرقمي</text><text x="400" y="390" fill="rgba(255,255,255,0.85)" font-size="24" font-family="sans-serif" text-anchor="middle">تصاميم استثنائية تصنع الفارق لعلامتك</text><rect x="260" y="520" width="280" height="70" rx="16" fill="%23f59e0b"/><text x="400" y="565" fill="%231e1b4b" font-size="24" font-family="sans-serif" font-weight="900" text-anchor="middle">ابدأ الآن بخصم 40%</text></svg>',
    canvas_background: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080"><defs><linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%236366f1"/><stop offset="50%" stop-color="%238b5cf6"/><stop offset="100%" stop-color="%23ec4899"/></linearGradient></defs><rect width="1080" height="1080" fill="url(%23bg1)"/><rect x="60" y="60" width="960" height="960" rx="32" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="3"/></svg>',
    category: 'marketing',
    category_label_ar: 'بوسترات تسويقية',
    dimensions: '1080 × 1080',
    price_type: 'free',
    price: 0,
    views_count: 14200,
    uses_count: 4300,
    rating: 4.9,
    created_at: '2026-01-01T00:00:00.000Z',
    elements: []
  }
];

// Local helper to fetch with Bearer token
async function apiFetch(url: string, options: RequestInit = {}) {
  const token = secureStorage.getSync('app_token');
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    // Gracefully handle HTML or non-JSON fallbacks without crashing JSON.parse
    throw new Error(`Invalid non-JSON response from ${url} (status: ${response.status})`);
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Map database snake_case keys back to camelCase frontend models
function mapCreatorToFrontend(c: any): RinexCreator {
  return {
    id: c.id,
    userId: c.user_id ? parseInt(c.user_id, 10) : (c.userId ? parseInt(c.userId, 10) : undefined),
    username: c.username,
    name: c.name,
    roleAr: c.role_ar,
    roleEn: c.role_en,
    avatar: c.avatar,
    bioAr: c.bio_ar,
    bioEn: c.bio_en,
    verified: c.verified,
    totalViews: c.total_views || 0,
    totalUses: c.total_uses || 0,
    rating: parseFloat(c.rating || '5.0'),
    earningsBalance: parseFloat(c.earnings_balance || '0'),
    followersCount: c.followers_count || 0,
    likesCount: c.likes_count || 0,
    profileVisitsCount: c.profile_visits_count || 0,
    socialLinks: typeof c.social_links === 'string' ? JSON.parse(c.social_links) : (c.social_links || {}),
    email: c.email || undefined,
    createdAt: new Date(c.created_at).getTime(),
    pendingBonusUsd: parseFloat(c.pending_bonus_usd || '0'),
    bonusClaimed: Boolean(c.bonus_claimed),
    bonusClaimedAt: c.bonus_claimed_at || undefined,
    publishedTemplatesCount: parseInt(c.published_templates_count || '0', 10)
  };
}

function mapTemplateToFrontend(t: any): MarketplaceTemplate {
  const isRemotion = String(t.id).startsWith('remotion_');
  const remId = isRemotion ? String(t.id).replace('remotion_', '') : t.id;
  const computedVideoUrl = t.video_url || t.videoUrl || (isRemotion ? `https://raw.githubusercontent.com/Osama-Qonaibe/remotion-templates2/main/site/previews/${remId}.mp4` : undefined);

  return {
    id: t.id,
    creatorId: t.creator_id,
    creatorName: t.creator_name,
    creatorUsername: t.creator_username,
    creatorAvatar: t.creator_avatar,
    titleAr: t.title_ar,
    titleEn: t.title_en,
    descriptionAr: t.description_ar || '',
    descriptionEn: t.description_en || '',
    thumbnail: t.thumbnail || '',
    canvasBackground: t.canvas_background || '',
    category: t.category,
    categoryLabelAr: t.category_label_ar || '',
    dimensions: t.dimensions || '1080 × 1080',
    priceType: t.price_type || 'free',
    price: parseFloat(t.price || '0'),
    viewsCount: t.views_count || 0,
    usesCount: t.uses_count || 0,
    rating: parseFloat(t.rating || '5.0'),
    createdAt: new Date(t.created_at).getTime(),
    elements: typeof t.elements === 'string' ? JSON.parse(t.elements) : (t.elements || []),
    videoUrl: computedVideoUrl,
    previewVideoUrl: computedVideoUrl
  };
}

function mapPayoutToFrontend(p: any): CreatorPayoutRequest {
  return {
    id: p.id,
    creatorId: p.creator_id,
    amount: parseFloat(p.amount || '0'),
    method: p.method,
    details: p.details || '',
    status: p.status,
    requestedAt: new Date(p.requested_at).getTime()
  };
}

// In-flight request deduplication promises & in-memory caches to prevent redundant duplicate queries
let creatorsPromise: Promise<RinexCreator[]> | null = null;
let creatorsCache: { data: RinexCreator[]; timestamp: number } | null = null;

let templatesPromise: Promise<MarketplaceTemplate[]> | null = null;
let templatesCache: { data: MarketplaceTemplate[]; timestamp: number } | null = null;

const CACHE_TTL_MS = 60000; // 60 seconds cache

// 1. Get all creators
export async function getStoredCreators(): Promise<RinexCreator[]> {
  const now = Date.now();
  if (creatorsCache && (now - creatorsCache.timestamp < CACHE_TTL_MS)) {
    return creatorsCache.data;
  }

  if (creatorsPromise) {
    return creatorsPromise;
  }

  creatorsPromise = (async () => {
    try {
      const list = await apiFetch('/api/rinex/creators');
      if (Array.isArray(list) && list.length > 0) {
        const mapped = list.map(mapCreatorToFrontend);
        creatorsCache = { data: mapped, timestamp: Date.now() };
        return mapped;
      }
    } catch (err: any) {
      console.warn('getStoredCreators using fallback list:', err?.message || err);
    } finally {
      creatorsPromise = null;
    }
    const fallback = INITIAL_FALLBACK_CREATORS.map(mapCreatorToFrontend);
    creatorsCache = { data: fallback, timestamp: Date.now() };
    return fallback;
  })();

  return creatorsPromise;
}

// 2. Get all marketplace templates
export async function getStoredMarketplaceTemplates(): Promise<MarketplaceTemplate[]> {
  const now = Date.now();
  if (templatesCache && (now - templatesCache.timestamp < CACHE_TTL_MS)) {
    return templatesCache.data;
  }

  if (templatesPromise) {
    return templatesPromise;
  }

  templatesPromise = (async () => {
    try {
      const list = await apiFetch('/api/rinex/templates');
      if (Array.isArray(list) && list.length > 0) {
        const mapped = list.map(mapTemplateToFrontend);
        templatesCache = { data: mapped, timestamp: Date.now() };
        return mapped;
      }
    } catch (err: any) {
      console.warn('getStoredMarketplaceTemplates using fallback list:', err?.message || err);
    } finally {
      templatesPromise = null;
    }
    const fallback = INITIAL_FALLBACK_TEMPLATES.map(mapTemplateToFrontend);
    templatesCache = { data: fallback, timestamp: Date.now() };
    return fallback;
  })();

  return templatesPromise;
}

export function clearCreatorsCache(): void {
  creatorsCache = null;
  creatorsPromise = null;
}

// 2.1 Get authenticated user's 1:1 creator profile directly from server
export async function getMyCreatorProfile(): Promise<{ isCreator: boolean; creator: RinexCreator | null }> {
  try {
    const res = await apiFetch('/api/rinex/creators/me');
    if (res && res.isCreator && res.creator) {
      return {
        isCreator: true,
        creator: mapCreatorToFrontend(res.creator)
      };
    }
  } catch (err: any) {
    // Unauthenticated or network error
  }
  return { isCreator: false, creator: null };
}

// 3. Register creator (strictly one profile per user)
export async function registerNewCreator(data: {
  username: string;
  name: string;
  roleAr: string;
  roleEn: string;
  bioAr: string;
  bioEn: string;
  avatar?: string;
  email?: string;
  socialLinks?: RinexCreator['socialLinks'];
}): Promise<RinexCreator> {
  const payload = {
    username: data.username,
    name: data.name,
    roleAr: data.roleAr,
    roleEn: data.roleEn,
    bioAr: data.bioAr,
    bioEn: data.bioEn,
    avatar: data.avatar,
    portfolioUrl: data.socialLinks?.website
  };

  const result = await apiFetch('/api/rinex/creators', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  // Invalidate cache immediately so UI reflects updated creator state
  clearCreatorsCache();

  return mapCreatorToFrontend(result);
}

// 4. Record template use
export async function recordTemplateUse(templateId: string): Promise<void> {
  try {
    await apiFetch(`/api/rinex/templates/${templateId}/use`, {
      method: 'POST'
    });
  } catch (err) {
    console.error('recordTemplateUse error:', err);
  }
}

// 5. Publish template
export async function publishMarketplaceTemplate(template: Omit<MarketplaceTemplate, 'id' | 'viewsCount' | 'usesCount' | 'rating' | 'createdAt'>): Promise<MarketplaceTemplate> {
  const payload = {
    creatorId: template.creatorId,
    creatorName: template.creatorName,
    creatorUsername: template.creatorUsername,
    creatorAvatar: template.creatorAvatar,
    titleAr: template.titleAr,
    titleEn: template.titleEn,
    descriptionAr: template.descriptionAr,
    descriptionEn: template.descriptionEn,
    thumbnail: template.thumbnail,
    canvasBackground: template.canvasBackground,
    category: template.category,
    categoryLabelAr: template.categoryLabelAr,
    dimensions: template.dimensions,
    priceType: template.priceType,
    price: template.price,
    elements: template.elements
  };

  const result = await apiFetch('/api/rinex/templates', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return mapTemplateToFrontend(result);
}

// 6. Get creator profile and templates
export async function getCreatorProfile(username: string): Promise<{ creator: RinexCreator; templates: MarketplaceTemplate[] } | null> {
  try {
    const result = await apiFetch(`/api/rinex/creators/${encodeURIComponent(username)}`);
    return {
      creator: mapCreatorToFrontend(result.creator),
      templates: result.templates.map(mapTemplateToFrontend)
    };
  } catch (err) {
    console.error('getCreatorProfile error:', err);
    return null;
  }
}

// 7. Toggle Follow
const FOLLOWS_STORAGE_KEY = 'rinex_followed_creators_v1';
export function isCreatorFollowed(creatorId: string): boolean {
  try {
    const raw = localStorage.getItem(FOLLOWS_STORAGE_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    return list.includes(creatorId);
  } catch (e) {
    return false;
  }
}

export async function toggleFollowCreator(creatorId: string): Promise<{ isFollowed: boolean; followersCount: number }> {
  let list: string[] = [];
  try {
    const raw = localStorage.getItem(FOLLOWS_STORAGE_KEY);
    list = raw ? JSON.parse(raw) : [];
  } catch (e) {}

  const isFollowed = list.includes(creatorId);
  let updatedList: string[];
  const action = isFollowed ? 'unfollow' : 'follow';

  if (isFollowed) {
    updatedList = list.filter(id => id !== creatorId);
  } else {
    updatedList = [...list, creatorId];
  }

  localStorage.setItem(FOLLOWS_STORAGE_KEY, JSON.stringify(updatedList));

  const result = await apiFetch(`/api/rinex/creators/${creatorId}/follow`, {
    method: 'POST',
    body: JSON.stringify({ action })
  });

  return { isFollowed: !isFollowed, followersCount: result.followersCount };
}

// 8. Toggle Like
const LIKES_STORAGE_KEY = 'rinex_liked_creators_v1';
export function isCreatorLiked(creatorId: string): boolean {
  try {
    const raw = localStorage.getItem(LIKES_STORAGE_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    return list.includes(creatorId);
  } catch (e) {
    return false;
  }
}

export async function toggleLikeCreator(creatorId: string): Promise<{ isLiked: boolean; likesCount: number }> {
  let list: string[] = [];
  try {
    const raw = localStorage.getItem(LIKES_STORAGE_KEY);
    list = raw ? JSON.parse(raw) : [];
  } catch (e) {}

  const isLiked = list.includes(creatorId);
  let updatedList: string[];
  const action = isLiked ? 'unlike' : 'like';

  if (isLiked) {
    updatedList = list.filter(id => id !== creatorId);
  } else {
    updatedList = [...list, creatorId];
  }

  localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(updatedList));

  const result = await apiFetch(`/api/rinex/creators/${creatorId}/like`, {
    method: 'POST',
    body: JSON.stringify({ action })
  });

  return { isLiked: !isLiked, likesCount: result.likesCount };
}

// 9. Increment profile visits
export async function incrementProfileVisits(creatorId: string): Promise<number> {
  try {
    const result = await apiFetch(`/api/rinex/creators/${creatorId}/visit`, {
      method: 'POST'
    });
    return result.profileVisitsCount;
  } catch (err) {
    console.error('incrementProfileVisits error:', err);
    return 1;
  }
}

// 10. Toggle Favorite Template
const FAV_TEMPLATES_KEY = 'rinex_favorite_templates_v1';
export function isTemplateFavorite(templateId: string): boolean {
  try {
    const raw = localStorage.getItem(FAV_TEMPLATES_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    return list.includes(templateId);
  } catch (e) {
    return false;
  }
}

export async function toggleFavoriteTemplate(templateId: string): Promise<{ isFavorite: boolean }> {
  let list: string[] = [];
  try {
    const raw = localStorage.getItem(FAV_TEMPLATES_KEY);
    list = raw ? JSON.parse(raw) : [];
  } catch (e) {}

  const isFav = list.includes(templateId);
  let updatedList: string[];

  if (isFav) {
    updatedList = list.filter(id => id !== templateId);
  } else {
    updatedList = [...list, templateId];
  }

  localStorage.setItem(FAV_TEMPLATES_KEY, JSON.stringify(updatedList));

  try {
    await apiFetch(`/api/rinex/templates/${templateId}/favorite`, {
      method: 'POST'
    });
  } catch {}

  return { isFavorite: !isFav };
}

// 11. Record Rating
export async function recordCreatorRating(creatorId: string, rating: number): Promise<number> {
  try {
    const result = await apiFetch(`/api/rinex/creators/${creatorId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating })
    });
    return result.rating;
  } catch (err) {
    console.error('recordCreatorRating error:', err);
    return rating;
  }
}

// 12. Get Payout Requests
export async function getStoredPayoutRequests(creatorId?: string): Promise<CreatorPayoutRequest[]> {
  try {
    const url = creatorId ? `/api/rinex/payouts?creatorId=${encodeURIComponent(creatorId)}` : '/api/rinex/payouts';
    const list = await apiFetch(url);
    return list.map(mapPayoutToFrontend);
  } catch (err) {
    console.error('getStoredPayoutRequests error:', err);
    return [];
  }
}

// 13. Request Payout
export async function requestCreatorPayout(
  creatorId: string,
  amount: number,
  method: string,
  details: string
): Promise<{ success: boolean; newBalance: number; payout?: CreatorPayoutRequest; error?: string }> {
  try {
    const result = await apiFetch('/api/rinex/payouts', {
      method: 'POST',
      body: JSON.stringify({ creatorId, amount, method, details })
    });
    return {
      success: true,
      newBalance: result.newBalance,
      payout: mapPayoutToFrontend(result.payout)
    };
  } catch (err: any) {
    return {
      success: false,
      newBalance: 0,
      error: err.message || 'Failed to request payout'
    };
  }
}

// 7. Claim creator welcome bonus upon meeting required template threshold
export async function claimCreatorBonus(creatorId: string): Promise<{
  success: boolean;
  claimedAmount?: number;
  newBalance?: number;
  creator?: any;
  error?: string;
  required?: number;
  current?: number;
}> {
  try {
    const result = await apiFetch(`/api/rinex/creators/${creatorId}/claim-bonus`, {
      method: 'POST'
    });
    // Invalidate creators cache to ensure immediate state freshness
    creatorsCache = null;
    return result;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to claim creator bonus'
    };
  }
}
