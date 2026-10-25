import express from 'express';
import { pool, ledgerPool, isDatabaseConnected } from '../db/index.js';
import { authenticateToken, authenticateTokenOptional } from '../middleware/auth.js';
import { getUserWallet } from '../services/wallet.js';

const router = express.Router();

const DEFAULT_CREATORS = [
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
    email: 'sarah@example.com'
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
    email: 'ahmad@example.com'
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
    email: 'lina@example.com'
  }
];

const DEFAULT_MARKETPLACE_TEMPLATES = [
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
    elements: [
      {
        id: 'el-1-tag',
        type: 'text',
        name: 'Badge Tag',
        x: 340,
        y: 150,
        w: 400,
        h: 56,
        text: '🔥 عرض خاص وحصري',
        color: '#f8fafc',
        fontSize: 26,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textBgColor: 'rgba(255,255,255,0.25)',
        textBgCornerRadius: 28
      },
      {
        id: 'el-1-title',
        type: 'text',
        name: 'Main Title',
        x: 90,
        y: 280,
        w: 900,
        h: 150,
        text: 'أطلق مشروعك الرقمي',
        color: '#ffffff',
        fontSize: 76,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textShadow: true
      },
      {
        id: 'el-1-sub',
        type: 'text',
        name: 'Subtitle',
        x: 90,
        y: 460,
        w: 900,
        h: 100,
        text: 'تصاميم تسويقية استثنائية تصنع الفارق لعلامتك التجارية',
        color: '#e2e8f0',
        fontSize: 32,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'normal',
        textAlign: 'center'
      },
      {
        id: 'el-1-cta',
        type: 'text',
        name: 'CTA Button',
        x: 340,
        y: 650,
        w: 400,
        h: 74,
        text: 'ابدأ الآن بخصم 40%',
        color: '#1e1b4b',
        fontSize: 30,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textBgColor: '#f59e0b',
        textBgCornerRadius: 18
      }
    ]
  },
  {
    id: 'm-tpl-2',
    creator_id: 'creator-2',
    creator_name: 'مهندس أحمد الشمري',
    creator_username: 'ahmad_media',
    creator_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ahmad_media&backgroundColor=c0aede',
    title_ar: 'قالب ريلز سينمائي ترويجي 9:16',
    title_en: 'Cinematic Promo Reels 9:16',
    description_ar: 'قالب ريلز عمودي مذهل مع طبقات إضاءة وتأثيرات بصرية حية لزيادة التفاعل والمشاركة.',
    description_en: 'Stunning vertical reels template with lighting layers and live visual effects.',
    thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="540" height="960" viewBox="0 0 540 960"><defs><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%230f172a"/><stop offset="60%" stop-color="%231e1b4b"/><stop offset="100%" stop-color="%230284c7"/></linearGradient></defs><rect width="540" height="960" fill="url(%23g2)"/><circle cx="270" cy="300" r="160" fill="none" stroke="%2338bdf8" stroke-width="4" stroke-dasharray="12 8"/><text x="270" y="240" fill="%2394a3b8" font-size="18" font-family="sans-serif" font-weight="bold" text-anchor="middle">REELS PRO 9:16</text><text x="270" y="320" fill="%2338bdf8" font-size="44" font-family="sans-serif" font-weight="900" text-anchor="middle">سر الانتشار السريع</text><text x="270" y="370" fill="%23ffffff" font-size="20" font-family="sans-serif" text-anchor="middle">ضاعف مشاهداتك 10 أضعاف</text><rect x="120" y="700" width="300" height="60" rx="30" fill="%230ea5e9"/><text x="270" y="738" fill="%23ffffff" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">شاهد الفيديو الكامل 🚀</text></svg>',
    canvas_background: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><defs><linearGradient id="bg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%230f172a"/><stop offset="60%" stop-color="%231e1b4b"/><stop offset="100%" stop-color="%230284c7"/></linearGradient></defs><rect width="1080" height="1920" fill="url(%23bg2)"/><circle cx="540" cy="600" r="320" fill="none" stroke="%2338bdf8" stroke-width="6" stroke-dasharray="24 16"/><circle cx="540" cy="600" r="300" fill="%2338bdf8" fill-opacity="0.05"/></svg>',
    category: 'reels',
    category_label_ar: 'فيديو وريلز',
    dimensions: '1080 × 1920',
    price_type: 'pro',
    price: 5,
    views_count: 18900,
    uses_count: 5600,
    rating: 4.9,
    elements: [
      {
        id: 'el-2-badge',
        type: 'text',
        name: 'Reel Tag',
        x: 390,
        y: 440,
        w: 300,
        h: 50,
        text: 'REELS PRO 9:16',
        color: '#38bdf8',
        fontSize: 24,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textBgColor: 'rgba(56,189,248,0.15)',
        textBgCornerRadius: 25
      },
      {
        id: 'el-2-hook',
        type: 'text',
        name: 'Reel Hook',
        x: 140,
        y: 530,
        w: 800,
        h: 90,
        text: 'هل تبحث عن زيادة المبيعات؟',
        color: '#f8fafc',
        fontSize: 44,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center'
      },
      {
        id: 'el-2-main',
        type: 'text',
        name: 'Main Headline',
        x: 90,
        y: 650,
        w: 900,
        h: 180,
        text: 'سر الانتشار السريع',
        color: '#facc15',
        fontSize: 88,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textShadow: true
      },
      {
        id: 'el-2-sub',
        type: 'text',
        name: 'Subtitle',
        x: 140,
        y: 850,
        w: 800,
        h: 90,
        text: 'ضاعف تفاعل جمهورك وعائداتك 10 أضعاف',
        color: '#ffffff',
        fontSize: 36,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'normal',
        textAlign: 'center'
      },
      {
        id: 'el-2-cta',
        type: 'text',
        name: 'CTA Action',
        x: 240,
        y: 1360,
        w: 600,
        h: 90,
        text: 'شاهد الفيديو الكامل في البايو 🚀',
        color: '#ffffff',
        fontSize: 34,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textBgColor: '#0ea5e9',
        textBgCornerRadius: 45
      }
    ]
  },
  {
    id: 'm-tpl-3',
    creator_id: 'creator-3',
    creator_name: 'لينا مصطفى',
    creator_username: 'lina_graphics',
    creator_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lina_graphics&backgroundColor=ffd5dc',
    title_ar: 'استوري أزياء وموضة حصرية',
    title_en: 'Exclusive Fashion Story Template',
    description_ar: 'تصميم أنيق وراقي لعروض الأزياء والمتاجر الإلكترونية مع إطار ذهبي فاخر.',
    description_en: 'Elegant and classy design for fashion showcases and e-commerce stores.',
    thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="540" height="960" viewBox="0 0 540 960"><defs><linearGradient id="g3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%231c1917"/><stop offset="100%" stop-color="%2344403c"/></linearGradient></defs><rect width="540" height="960" fill="url(%23g3)"/><rect x="30" y="30" width="480" height="900" rx="16" fill="none" stroke="%23d4af37" stroke-width="3"/><text x="270" y="200" fill="%23d4af37" font-size="20" font-family="serif" letter-spacing="4" text-anchor="middle">LUXURY COLLECTION</text><text x="270" y="320" fill="%23ffffff" font-size="40" font-family="sans-serif" font-weight="bold" text-anchor="middle">أناقة لا تضاهى</text><text x="270" y="380" fill="%23e7e5e4" font-size="20" font-family="sans-serif" text-anchor="middle">تشكيلة الموسم الجديد 2026</text><rect x="150" y="720" width="240" height="55" rx="8" fill="%23d4af37"/><text x="270" y="755" fill="%231c1917" font-size="18" font-family="sans-serif" font-weight="bold" text-anchor="middle">تسوق المجموعة الآن</text></svg>',
    canvas_background: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><defs><linearGradient id="bg3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%231c1917"/><stop offset="100%" stop-color="%2344403c"/></linearGradient></defs><rect width="1080" height="1920" fill="url(%23bg3)"/><rect x="50" y="50" width="980" height="1820" rx="24" fill="none" stroke="%23d4af37" stroke-width="5"/><rect x="70" y="70" width="940" height="1780" rx="20" fill="none" stroke="%23d4af37" stroke-width="1" stroke-dasharray="12 8"/></svg>',
    category: 'story',
    category_label_ar: 'قصة واستوري',
    dimensions: '1080 × 1920',
    price_type: 'free',
    price: 0,
    views_count: 9400,
    uses_count: 2550,
    rating: 4.8,
    elements: [
      {
        id: 'el-3-brand',
        type: 'text',
        name: 'Brand Name',
        x: 140,
        y: 380,
        w: 800,
        h: 70,
        text: 'LUXURY COLLECTION 2026',
        color: '#d4af37',
        fontSize: 38,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center'
      },
      {
        id: 'el-3-title',
        type: 'text',
        name: 'Collection Title',
        x: 90,
        y: 560,
        w: 900,
        h: 160,
        text: 'أناقة لا تضاهى لكل لحظة',
        color: '#ffffff',
        fontSize: 76,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textShadow: true
      },
      {
        id: 'el-3-sub',
        type: 'text',
        name: 'Subtitle',
        x: 140,
        y: 740,
        w: 800,
        h: 90,
        text: 'تشكيلة الموسم الجديد الحصرية الفاخرة',
        color: '#e7e5e4',
        fontSize: 34,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'normal',
        textAlign: 'center'
      },
      {
        id: 'el-3-cta',
        type: 'text',
        name: 'CTA Button',
        x: 290,
        y: 1380,
        w: 500,
        h: 86,
        text: 'تسوق المجموعة الآن',
        color: '#1c1917',
        fontSize: 32,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textBgColor: '#d4af37',
        textBgCornerRadius: 16
      }
    ]
  }
];

import fs from 'fs';
import path from 'path';

function getImportedTemplatesData(): any[] {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'importedTemplates.ts');
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/IMPORTED_TEMPLATES:\s*any\[\]\s*=\s*(\[[\s\S]*\]);/);
    if (match && match[1]) {
      return JSON.parse(match[1]);
    }
  } catch (err) {
    console.error('Error parsing importedTemplates.ts in rinex route:', err);
  }
  return [];
}

// Helper to seed Rinex data if empty
let isRinexSeeded = false;
let isRinexSeeding = false;

async function ensureRinexSeeded() {
  if (!isDatabaseConnected() || isRinexSeeded) return;
  if (isRinexSeeding) {
    while (isRinexSeeding) {
      await new Promise(r => setTimeout(r, 50));
    }
    return;
  }
  isRinexSeeding = true;
  try {
    const creatorCheck = await pool.query('SELECT count(*) AS count FROM rinex_creators');
    if (creatorCheck.rows && creatorCheck.rows[0] && parseInt(creatorCheck.rows[0].count, 10) === 0) {
      console.log('[Rinex API] Seeding default creators into database...');
      for (const c of DEFAULT_CREATORS) {
        await pool.query(
          `INSERT INTO rinex_creators (id, username, name, email, role_ar, role_en, avatar, bio_ar, bio_en, verified, total_views, total_uses, rating, earnings_balance, followers_count, likes_count, profile_visits_count, social_links)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) ON CONFLICT DO NOTHING`,
          [
            c.id, c.username, c.name, c.email, c.role_ar, c.role_en, c.avatar, c.bio_ar, c.bio_en, c.verified,
            c.total_views, c.total_uses, c.rating, c.earnings_balance, c.followers_count, c.likes_count, c.profile_visits_count,
            JSON.stringify(c.social_links)
          ]
        );
      }
    }

    const templateCheck = await pool.query('SELECT count(*) AS count FROM rinex_templates');
    if (templateCheck.rows && templateCheck.rows[0] && parseInt(templateCheck.rows[0].count, 10) < 50) {
      console.log('[Rinex API] Seeding default & imported templates into database...');
      for (const t of DEFAULT_MARKETPLACE_TEMPLATES) {
        await pool.query(
          `INSERT INTO rinex_templates (id, creator_id, creator_name, creator_username, creator_avatar, title_ar, title_en, description_ar, description_en, thumbnail, canvas_background, category, category_label_ar, dimensions, price_type, price, views_count, uses_count, rating, elements)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) ON CONFLICT (id) DO NOTHING`,
          [
            t.id, t.creator_id, t.creator_name, t.creator_username, t.creator_avatar, t.title_ar, t.title_en,
            t.description_ar, t.description_en, t.thumbnail, t.canvas_background, t.category, t.category_label_ar,
            t.dimensions, t.price_type, t.price, t.views_count, t.uses_count, t.rating, JSON.stringify(t.elements)
          ]
        );
      }

      const imported = getImportedTemplatesData();
      for (const t of imported) {
        await pool.query(
          `INSERT INTO rinex_templates (id, creator_id, creator_name, creator_username, creator_avatar, title_ar, title_en, description_ar, description_en, thumbnail, canvas_background, category, category_label_ar, dimensions, price_type, price, views_count, uses_count, rating, elements)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) ON CONFLICT (id) DO UPDATE SET thumbnail = EXCLUDED.thumbnail, elements = EXCLUDED.elements`,
          [
            t.id, 'creator-2', t.creatorName || 'مستودع بيربليكستا', t.creatorUsername || 'perplexta_official', t.creatorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
            t.titleAr, t.titleEn, 'قالب فيديو حركي واحترافي مستورد مباشرة بدقة عالية لبيربليكستا', 'High-quality dynamic Perplexta video template imported with high fidelity',
            t.thumbnailUrl, t.backgroundColor, t.category || 'marketing', 'قوالب بيربليكستا', `${t.width || 1920} × ${t.height || 1080}`, 'free', 0,
            Math.floor(Math.random() * 500) + 100, t.usesCount || 1500, 5.0, JSON.stringify(t.elements || [])
          ]
        );
      }
    }
    isRinexSeeded = true;
  } catch (err) {
    console.error('[Rinex API] Error seeding default data:', err);
  } finally {
    isRinexSeeding = false;
  }
}

interface RinexCacheEntry<T> {
  data: T;
  timestamp: number;
}

let creatorsCache: RinexCacheEntry<any> | null = null;
let templatesCache: RinexCacheEntry<any> | null = null;
const RINEX_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

export function invalidateRinexCache() {
  creatorsCache = null;
  templatesCache = null;
}

// 1. Get all creators
router.get('/creators', async (req, res) => {
  if (creatorsCache && (Date.now() - creatorsCache.timestamp < RINEX_CACHE_TTL_MS)) {
    return res.json(creatorsCache.data);
  }
  try {
    await ensureRinexSeeded();
    const result = await pool.query(`
      SELECT rc.*,
             COALESCE((SELECT COUNT(*) FROM rinex_templates rt WHERE rt.creator_id = rc.id), 0) as published_templates_count
      FROM rinex_creators rc
      ORDER BY rc.rating DESC, rc.total_uses DESC
    `);
    if (result.rows && result.rows.length > 0) {
      creatorsCache = { data: result.rows, timestamp: Date.now() };
      return res.json(result.rows);
    }
  } catch (err: any) {
    console.warn('[Rinex API] DB fetch failed, falling back to in-memory creators:', err.message);
  }
  res.json(DEFAULT_CREATORS);
});

// 1.1 Get current authenticated user's creator profile (1:1 sovereign creator identity)
router.get('/creators/me', authenticateToken, async (req: any, res) => {
  const userId = req.user?.id ? parseInt(String(req.user.id), 10) : null;
  const userEmail = (req.user?.email || '').trim().toLowerCase();

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    await ensureRinexSeeded();
    const result = await pool.query(`
      SELECT rc.*,
             COALESCE((SELECT COUNT(*) FROM rinex_templates rt WHERE rt.creator_id = rc.id), 0) as published_templates_count
      FROM rinex_creators rc
      WHERE rc.user_id = $1 OR (rc.email IS NOT NULL AND LOWER(rc.email) = LOWER($2))
      ORDER BY rc.created_at ASC
      LIMIT 1
    `, [userId, userEmail]);

    if (result.rows && result.rows.length > 0) {
      const creator = result.rows[0];
      // Sync user_id if it was matched by email but user_id was null
      if (!creator.user_id && userId) {
        pool.query('UPDATE rinex_creators SET user_id = $1 WHERE id = $2 AND user_id IS NULL', [userId, creator.id]).catch(() => {});
      }
      return res.json({
        isCreator: true,
        creator
      });
    }

    return res.json({
      isCreator: false,
      creator: null
    });
  } catch (err: any) {
    console.error('[Rinex API] Error fetching current creator profile:', err);
    return res.status(500).json({ error: 'Failed to verify creator status: ' + err.message });
  }
});

// 2. Get a single creator and their templates
router.get('/creators/:username', async (req, res) => {
  const username = req.params.username.toLowerCase().replace('@', '');
  try {
    await ensureRinexSeeded();
    const creatorRes = await pool.query(`
      SELECT rc.*,
             COALESCE((SELECT COUNT(*) FROM rinex_templates rt WHERE rt.creator_id = rc.id), 0) as published_templates_count
      FROM rinex_creators rc
      WHERE LOWER(rc.username) = $1
    `, [username]);
    if (creatorRes.rows && creatorRes.rows.length > 0) {
      const creator = creatorRes.rows[0];
      const templatesRes = await pool.query('SELECT * FROM rinex_templates WHERE creator_id = $1 ORDER BY created_at DESC', [creator.id]);
      return res.json({
        creator,
        templates: templatesRes.rows
      });
    }
  } catch (err: any) {
    console.warn('[Rinex API] DB fetch failed, searching in-memory creators:', err.message);
  }

  const fallbackCreator = DEFAULT_CREATORS.find(c => c.username.toLowerCase() === username);
  if (!fallbackCreator) {
    return res.status(404).json({ error: 'Creator not found' });
  }
  const fallbackTemplates = DEFAULT_MARKETPLACE_TEMPLATES.filter(t => t.creator_username.toLowerCase() === username);
  return res.json({
    creator: fallbackCreator,
    templates: fallbackTemplates
  });
});

// 3. Register a creator (Strict 1:1 Profile Enforcement & Anti-Duplication Protection)
router.post('/creators', authenticateToken, async (req: any, res) => {
  await ensureRinexSeeded();
  const userId = req.user?.id ? parseInt(String(req.user.id), 10) : null;
  const userEmail = (req.user?.email || '').trim().toLowerCase();

  if (!userId) {
    return res.status(401).json({ 
      error: 'Authentication is required to register as a certified creator',
      error_ar: 'يلزم تسجيل الدخول أولاً للانضمام لشبكة المبدعين المعتمدين.'
    });
  }

  const { username, name, roleAr, roleEn, bioAr, bioEn, avatar, portfolioUrl } = req.body;
  
  if (!username || !name) {
    return res.status(400).json({ 
      error: 'Name and Username are required',
      error_ar: 'الاسم الكامل ومعرف البروفايل مطلوبان.'
    });
  }

  const cleanUsername = username.trim().toLowerCase().replace('@', '');

  // 1. Handle format and length validation
  if (cleanUsername.length < 3 || cleanUsername.length > 30) {
    return res.status(400).json({
      error: 'Username must be between 3 and 30 characters',
      error_ar: 'يجب أن يكون اسم المستخدم بين 3 و 30 حرفاً.'
    });
  }

  if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
    return res.status(400).json({
      error: 'Username can only contain letters, numbers, and underscores',
      error_ar: 'معرف البروفايل يمكن أن يحتوي على أحرف إنجليزية وأرقام وشرطة سفلية (_) فقط.'
    });
  }

  // Reserved keyword blocklist
  const RESERVED_HANDLES = ['admin', 'perplexta', 'rinex', 'official', 'support', 'system', 'root', 'api', 'help', 'me', 'explore'];
  if (RESERVED_HANDLES.includes(cleanUsername)) {
    return res.status(400).json({
      error: 'This username handle is reserved for system administration',
      error_ar: 'اسم المستخدم هذا محجوز لإدارة المنظمة ولا يمكن استخدامه.'
    });
  }

  try {
    // 2. Strict 1:1 Identity Rule: Check if current user ALREADY has a creator profile
    const existingUserCreator = await pool.query(
      `SELECT id, username, name FROM rinex_creators 
       WHERE user_id = $1 OR (email IS NOT NULL AND LOWER(email) = LOWER($2)) 
       LIMIT 1`,
      [userId, userEmail]
    );

    if (existingUserCreator.rows.length > 0) {
      const activeCreator = existingUserCreator.rows[0];
      return res.status(409).json({
        error: `You already have an active creator profile (@${activeCreator.username}). Multiple creator profiles per user are strictly forbidden.`,
        error_ar: `لديك حساب مبدع معتمد بالفعل باسم (@${activeCreator.username}). يُمنع منعاً باتاً إنشاء أكثر من ملف مبدع واحد لنفس المستخدم وفقاً لسياسة المنصة.`,
        creator: activeCreator
      });
    }

    // 3. Check if username handle is already taken by someone else
    const usernameCheck = await pool.query('SELECT id FROM rinex_creators WHERE LOWER(username) = $1 LIMIT 1', [cleanUsername]);
    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Username handle is already registered by another creator',
        error_ar: 'اسم المستخدم محجوز بالفعل لمصمم آخر، يرجى اختيار معرّف بديل.'
      });
    }

    // Fetch economy settings to get configured welcome bonus
    const { getEconomySettings } = await import('../services/wallet.js');
    const ecoSettings = await getEconomySettings();
    const bonusEnabled = ecoSettings.creator_bonus_enabled !== false;
    const bonusUsd = bonusEnabled ? Number(ecoSettings.creator_welcome_bonus_usd || 50.00) : 0.00;

    const id = `creator-${Date.now()}`;
    const defaultAvatar = avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`;
    const defaultRoleAr = roleAr || 'صانع قوالب ومحتوى معتمد';
    const defaultRoleEn = roleEn || 'Certified Creator & Designer';
    const defaultBioAr = bioAr || 'صانع محتوى في شبكة رينكس للإبداع، أبتكر قوالب تسويقية وحركية عالية الجودة لمساعدة رواد الأعمال والمصممين.';
    const defaultBioEn = bioEn || 'Rinex Creative Network member, crafting high-performance visual and motion templates.';
    const socialLinks = portfolioUrl ? { website: portfolioUrl } : {};

    // Sync verification status with global roles
    const userRole = req.user.role?.toLowerCase() || 'user';
    const isVerified = ['admin', 'owner', 'elite', 'developer', 'verified'].includes(userRole);

    // ZERO immediate earnings balance; bonus is locked in pending_bonus_usd until requirements are satisfied
    const insertRes = await pool.query(
      `INSERT INTO rinex_creators (
         id, user_id, username, name, email, role_ar, role_en, avatar, bio_ar, bio_en, 
         verified, total_views, total_uses, rating, earnings_balance, pending_bonus_usd, bonus_claimed, 
         followers_count, likes_count, profile_visits_count, social_links
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 1, 0, 5.0, 0.00, $12, false, 1, 0, 1, $13) RETURNING *`,
      [
        id, userId, cleanUsername, name, req.user.email || null, 
        defaultRoleAr, defaultRoleEn, defaultAvatar, defaultBioAr, defaultBioEn, 
        isVerified, bonusUsd, JSON.stringify(socialLinks)
      ]
    );

    const newCreator = {
      ...insertRes.rows[0],
      published_templates_count: 0
    };

    invalidateRinexCache();
    res.json(newCreator);
  } catch (err: any) {
    console.error('[Rinex API] Failed to register creator:', err);
    res.status(500).json({ error: 'Failed to register creator: ' + err.message });
  }
});

// 4. Claim Creator Welcome Bonus (Unlocks only upon publishing minimum required templates)
router.post('/creators/:id/claim-bonus', authenticateToken, async (req: any, res) => {
  const creatorId = req.params.id;
  const userId = req.user.id || req.user.userId;

  try {
    const creatorRes = await pool.query('SELECT * FROM rinex_creators WHERE id = $1', [creatorId]);
    if (creatorRes.rows.length === 0) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    const creator = creatorRes.rows[0];

    // Ownership verification
    if (creator.user_id && creator.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to claim bonus for this creator profile' });
    }

    if (creator.bonus_claimed) {
      return res.status(400).json({ error: 'Creator welcome bonus has already been claimed' });
    }

    const pendingBonus = Number(creator.pending_bonus_usd || 0);
    if (pendingBonus <= 0) {
      return res.status(400).json({ error: 'No pending bonus available to claim' });
    }

    // Get requirement from economy settings
    const { getEconomySettings } = await import('../services/wallet.js');
    const ecoSettings = await getEconomySettings();
    const requiredCount = parseInt(String(ecoSettings.creator_bonus_required_templates || 10), 10);

    // Verify published templates count in database
    const countRes = await pool.query('SELECT COUNT(*) as count FROM rinex_templates WHERE creator_id = $1', [creatorId]);
    const actualPublished = parseInt(countRes.rows[0].count || '0', 10);

    if (actualPublished < requiredCount) {
      return res.status(400).json({
        error: `Must publish at least ${requiredCount} templates to unlock bonus (current: ${actualPublished})`,
        required: requiredCount,
        current: actualPublished,
        remaining: requiredCount - actualPublished
      });
    }

    // Unlock bonus and credit wallet & earnings balance
    const updateRes = await pool.query(
      `UPDATE rinex_creators 
       SET bonus_claimed = true, bonus_claimed_at = CURRENT_TIMESTAMP, earnings_balance = earnings_balance + $1 
       WHERE id = $2 RETURNING *`,
      [pendingBonus, creatorId]
    );

    const targetLedger = ledgerPool || pool;
    if (targetLedger && creator.user_id) {
      const walletRes = await targetLedger.query(
        `INSERT INTO wallets (user_id, balance, usd_balance, points) VALUES ($1, $2, $2, 0)
         ON CONFLICT (user_id) DO UPDATE SET balance = wallets.balance + $2, usd_balance = wallets.usd_balance + $2 RETURNING id`,
        [creator.user_id, pendingBonus]
      );
      const walletId = walletRes.rows?.[0]?.id;
      if (walletId) {
        await targetLedger.query(
          `INSERT INTO ledger_transactions (user_id, wallet_id, amount, points, transaction_type, status, description)
           VALUES ($1, $2, $3, 0, 'creator_welcome_bonus', 'success', $4)`,
          [
            creator.user_id, 
            walletId, 
            pendingBonus, 
            `مكافأة إنجاز شبكة المبدعين - نشر ${actualPublished} قوالب احترافية ($${pendingBonus})`
          ]
        );
      }
    }

    // Dispatch celebration in-app notification
    const { createNotification } = await import('../services/notifications.js');
    if (creator.user_id) {
      await createNotification(
        creator.user_id,
        'creator_bonus_unlocked',
        'Creator Welcome Bonus Unlocked! 🎉',
        'تم فك قفل مكافأة المبدع بنجاح! 🎉',
        `Congratulations! You published ${actualPublished} templates. $${pendingBonus} welcome bonus was credited to your wallet.`,
        `تهانينا! لقد نشرت ${actualPublished} قوالب بنجاح. تم صرف مكافأة الانضمام بقيمة $${pendingBonus} وإضافتها لمحفظتك المالية.`,
        { creatorId, amount: pendingBonus, publishedCount: actualPublished }
      ).catch(() => {});
    }

    res.json({
      success: true,
      claimedAmount: pendingBonus,
      newBalance: parseFloat(updateRes.rows[0].earnings_balance || '0'),
      creator: updateRes.rows[0]
    });
  } catch (err: any) {
    console.error('[Claim Creator Bonus] Error:', err);
    res.status(500).json({ error: 'Failed to claim creator bonus: ' + err.message });
  }
});

// 5. Toggle Follow Creator
router.post('/creators/:id/follow', authenticateTokenOptional, async (req: any, res) => {
  const creatorId = req.params.id;
  try {
    const check = await pool.query('SELECT id, followers_count FROM rinex_creators WHERE id = $1', [creatorId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Creator not found' });
    }
    
    const { action } = req.body;
    const delta = action === 'unfollow' ? -1 : 1;
    
    const updateRes = await pool.query(
      'UPDATE rinex_creators SET followers_count = GREATEST(0, followers_count + $1) WHERE id = $2 RETURNING followers_count',
      [delta, creatorId]
    );
    res.json({
      success: true,
      followersCount: updateRes.rows[0].followers_count
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Toggle Like Creator
router.post('/creators/:id/like', authenticateTokenOptional, async (req: any, res) => {
  const creatorId = req.params.id;
  try {
    const check = await pool.query('SELECT id, likes_count FROM rinex_creators WHERE id = $1', [creatorId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Creator not found' });
    }
    
    const { action } = req.body;
    const delta = action === 'unlike' ? -1 : 1;
    
    const updateRes = await pool.query(
      'UPDATE rinex_creators SET likes_count = GREATEST(0, likes_count + $1) WHERE id = $2 RETURNING likes_count',
      [delta, creatorId]
    );
    res.json({
      success: true,
      likesCount: updateRes.rows[0].likes_count
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Visit Profile
router.post('/creators/:id/visit', async (req, res) => {
  const creatorId = req.params.id;
  try {
    const updateRes = await pool.query(
      'UPDATE rinex_creators SET profile_visits_count = profile_visits_count + 1 WHERE id = $1 RETURNING profile_visits_count',
      [creatorId]
    );
    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Creator not found' });
    }
    res.json({
      success: true,
      profileVisitsCount: updateRes.rows[0].profile_visits_count
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Rate Creator
router.post('/creators/:id/rate', authenticateToken, async (req, res) => {
  const creatorId = req.params.id;
  const { rating } = req.body;
  if (!rating || isNaN(rating)) {
    return res.status(400).json({ error: 'Valid rating is required' });
  }
  try {
    const creatorCheck = await pool.query('SELECT rating FROM rinex_creators WHERE id = $1', [creatorId]);
    if (creatorCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Creator not found' });
    }
    
    const current = parseFloat(creatorCheck.rows[0].rating || '5.0');
    const updatedRating = Math.round(((current * 4 + parseFloat(rating)) / 5) * 10) / 10;
    
    await pool.query('UPDATE rinex_creators SET rating = $1 WHERE id = $2', [updatedRating, creatorId]);
    res.json({
      success: true,
      rating: updatedRating
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Get all templates
router.get('/templates', async (req, res) => {
  if (templatesCache && (Date.now() - templatesCache.timestamp < RINEX_CACHE_TTL_MS)) {
    return res.json(templatesCache.data);
  }
  try {
    await ensureRinexSeeded();
    const result = await pool.query('SELECT * FROM rinex_templates ORDER BY created_at DESC');
    if (result.rows && result.rows.length > 0) {
      templatesCache = { data: result.rows, timestamp: Date.now() };
      return res.json(result.rows);
    }
  } catch (err: any) {
    console.warn('[Rinex API] DB fetch failed, falling back to in-memory templates:', err.message);
  }
  const imported = getImportedTemplatesData().map(t => ({
    id: t.id,
    creator_id: 'creator-2',
    creator_name: t.creatorName || 'مستودع بيربليكستا',
    creator_username: t.creatorUsername || 'perplexta_official',
    creator_avatar: t.creatorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    title_ar: t.titleAr,
    title_en: t.titleEn,
    description_ar: 'قالب فيديو حركي واحترافي مستورد بدقة عالية لمنصة بيربليكستا',
    description_en: 'High-quality dynamic Perplexta video template with rich layers',
    thumbnail: t.thumbnailUrl,
    canvas_background: t.backgroundColor,
    category: t.category || 'marketing',
    category_label_ar: 'قوالب بيربليكستا',
    dimensions: `${t.width || 1920} × ${t.height || 1080}`,
    price_type: 'free',
    price: 0,
    views_count: 500,
    uses_count: t.usesCount || 1500,
    rating: 5.0,
    elements: t.elements || [],
    created_at: new Date().toISOString()
  }));
  res.json([...DEFAULT_MARKETPLACE_TEMPLATES, ...imported]);
});

// 9. Publish a template
router.post('/templates', authenticateToken, async (req, res) => {
  await ensureRinexSeeded();
  const { creatorId, creatorName, creatorUsername, creatorAvatar, titleAr, titleEn, descriptionAr, descriptionEn, thumbnail, canvasBackground, category, categoryLabelAr, dimensions, priceType, price, elements } = req.body;
  
  if (!creatorId || !titleAr || !category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const id = `m-tpl-${Date.now()}`;
    const insertRes = await pool.query(
      `INSERT INTO rinex_templates (id, creator_id, creator_name, creator_username, creator_avatar, title_ar, title_en, description_ar, description_en, thumbnail, canvas_background, category, category_label_ar, dimensions, price_type, price, views_count, uses_count, rating, elements)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 1, 0, 5.0, $17) RETURNING *`,
      [
        id, creatorId, creatorName, creatorUsername, creatorAvatar, titleAr, titleEn || titleAr,
        descriptionAr || '', descriptionEn || '', thumbnail || '', canvasBackground || '', category,
        categoryLabelAr || category, dimensions || '1080 × 1080', priceType || 'free', price || 0,
        JSON.stringify(elements || [])
      ]
    );

    await pool.query('UPDATE rinex_creators SET total_views = total_views + 1 WHERE id = $1', [creatorId]);

    invalidateRinexCache();
    res.json(insertRes.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to publish template: ' + err.message });
  }
});

// 10. Record template use and add commission with dynamic economy settings & anti-abuse protection
router.post('/templates/:id/use', authenticateTokenOptional, async (req: any, res) => {
  const templateId = req.params.id;
  try {
    const tplRes = await pool.query('SELECT * FROM rinex_templates WHERE id = $1', [templateId]);
    if (tplRes.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    const tpl = tplRes.rows[0];

    // Always increment template uses_count
    await pool.query('UPDATE rinex_templates SET uses_count = uses_count + 1 WHERE id = $1', [templateId]);

    // Retrieve dynamic economy settings
    const { getEconomySettings } = await import('../services/wallet.js');
    const ecoSettings = await getEconomySettings();

    const currentUserId = req.user?.id ? parseInt(String(req.user.id), 10) : null;
    const ipAddress = (req.ip || req.headers['x-forwarded-for'] || '').toString().slice(0, 100);

    // Fetch creator details to check for self-use & user linkage
    const creatorRes = await pool.query('SELECT user_id, email, earnings_balance FROM rinex_creators WHERE id = $1', [tpl.creator_id]);
    const creator = creatorRes.rows[0];

    let commission = 0;
    let isRoyaltyGranted = false;
    let bypassReason = '';

    // Anti-Abuse 1: Self-Usage prevention (creator using their own template cannot generate royalties)
    if (creator && currentUserId && creator.user_id && creator.user_id === currentUserId) {
      bypassReason = 'self_usage';
    }

    // Anti-Abuse 2: Deduplication / Frequency check (prevent bots spamming use to siphon funds)
    if (!bypassReason) {
      if (currentUserId) {
        const userRecent = await pool.query(
          `SELECT id FROM rinex_template_usages 
           WHERE template_id = $1 AND user_id = $2 AND created_at > NOW() - INTERVAL '24 hours' 
           LIMIT 1`,
          [templateId, currentUserId]
        );
        if (userRecent.rows.length > 0) {
          bypassReason = 'user_frequency_cap';
        }
      } else if (ipAddress) {
        const ipRecent = await pool.query(
          `SELECT id FROM rinex_template_usages 
           WHERE template_id = $1 AND ip_address = $2 AND created_at > NOW() - INTERVAL '2 hours' 
           LIMIT 1`,
          [templateId, ipAddress]
        );
        if (ipRecent.rows.length > 0) {
          bypassReason = 'ip_frequency_cap';
        }
      }
    }

    if (!bypassReason) {
      if (tpl.price_type === 'free') {
        const usageRoyaltyEnabled = ecoSettings.creator_usage_royalty_enabled !== false;
        if (usageRoyaltyEnabled) {
          const baseRoyalty = parseFloat(String(ecoSettings.creator_template_usage_royalty_usd ?? 0.15));
          
          // Anti-Abuse 3: Creator Daily Free Royalties Cap
          const dailyCap = parseFloat(String(ecoSettings.creator_max_daily_royalty_usd ?? 15));
          if (dailyCap > 0) {
            const dailyRes = await pool.query(
              `SELECT COALESCE(SUM(royalty_paid), 0) as total 
               FROM rinex_template_usages 
               WHERE creator_id = $1 AND price_type = 'free' AND created_at >= CURRENT_DATE`,
              [tpl.creator_id]
            );
            const todayTotal = parseFloat(dailyRes.rows[0].total || '0');
            if (todayTotal >= dailyCap) {
              commission = 0;
              bypassReason = 'daily_cap_reached';
            } else {
              commission = Math.min(baseRoyalty, Math.max(0, dailyCap - todayTotal));
              isRoyaltyGranted = commission > 0;
            }
          } else {
            commission = baseRoyalty;
            isRoyaltyGranted = commission > 0;
          }
        }
      } else {
        // Pro template purchase/use: percentage of price defined in economy_settings
        const commissionPercent = parseFloat(String(ecoSettings.creator_pro_commission_percent ?? 70));
        const templatePrice = parseFloat(tpl.price || '0');
        commission = (templatePrice * commissionPercent) / 100;
        isRoyaltyGranted = commission > 0;
      }
    }

    // Log usage in rinex_template_usages audit table
    await pool.query(
      `INSERT INTO rinex_template_usages (template_id, creator_id, user_id, ip_address, royalty_paid, price_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [templateId, tpl.creator_id, currentUserId, ipAddress, commission, tpl.price_type || 'free']
    ).catch((err: any) => console.warn('[Rinex Usage Log Warning]:', err.message));

    // Increment creator total_uses and earnings_balance if royalty granted
    await pool.query(
      `UPDATE rinex_creators 
       SET total_uses = total_uses + 1, earnings_balance = earnings_balance + $1 
       WHERE id = $2`,
      [commission, tpl.creator_id]
    );

    // Ledger Database Integration (Append-Only Audit Log)
    if (commission > 0 && ledgerPool) {
      let creatorUserId = creator?.user_id;
      if (!creatorUserId && creator?.email) {
        const uRes = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [creator.email]);
        if (uRes.rows[0]?.id) {
          creatorUserId = parseInt(uRes.rows[0].id, 10);
          pool.query('UPDATE rinex_creators SET user_id = $1 WHERE id = $2 AND user_id IS NULL', [creatorUserId, tpl.creator_id]).catch(() => {});
        }
      }

      if (creatorUserId) {
        const wallet = await getUserWallet(creatorUserId);
        if (wallet && wallet.id) {
          await ledgerPool.query(
            `INSERT INTO ledger_transactions (
              user_id, wallet_id, transaction_type, amount, status, reference_id, metadata, description
            ) VALUES ($1, $2, 'rinex_template_royalty', $3, 'success', $4, $5, $6)`,
            [
              creatorUserId,
              wallet.id,
              commission,
              templateId,
              JSON.stringify({ 
                creator_id: tpl.creator_id, 
                template_title: tpl.title_en,
                usage_type: tpl.price_type,
                rate: commission
              }),
              `Royalty for template use: ${tpl.title_en} (@${tpl.creator_username})`
            ]
          ).catch((err: any) => console.warn('[Rinex Ledger Transaction Log Error]:', err));
        }
      }
    }

    res.json({ 
      success: true, 
      commission, 
      isRoyaltyGranted, 
      bypassReason: bypassReason || null 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Toggle favorite template
router.post('/templates/:id/favorite', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const templateId = req.params.id;
    if (!userId || !templateId) {
      return res.status(400).json({ error: 'User ID and Template ID are required' });
    }
    const existing = await pool.query(
      'SELECT id FROM rinex_favorite_templates WHERE user_id = $1 AND template_id = $2',
      [userId, templateId]
    );
    let isFavorite = false;
    if (existing.rows.length > 0) {
      await pool.query(
        'DELETE FROM rinex_favorite_templates WHERE user_id = $1 AND template_id = $2',
        [userId, templateId]
      );
      isFavorite = false;
    } else {
      await pool.query(
        'INSERT INTO rinex_favorite_templates (user_id, template_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, templateId]
      );
      isFavorite = true;
    }
    res.json({ success: true, isFavorite });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to toggle favorite template: ' + err.message });
  }
});

// 12. Get payout requests
router.get('/payouts', authenticateToken, async (req: any, res) => {
  const { creatorId } = req.query;
  try {
    let query = 'SELECT * FROM rinex_payout_requests';
    const params = [];
    if (creatorId) {
      query += ' WHERE creator_id = $1';
      params.push(creatorId);
    }
    query += ' ORDER BY requested_at DESC';
    const result = await ledgerPool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch payout requests: ' + err.message });
  }
});

// 13. Request payout with dynamic minimum threshold validation
router.post('/payouts', authenticateToken, async (req: any, res) => {
  const { creatorId, amount, method, details } = req.body;
  if (!creatorId || !amount || !method) {
    return res.status(400).json({ error: 'Creator ID, Amount, and Method are required' });
  }

  const payoutAmount = parseFloat(amount);
  if (isNaN(payoutAmount) || payoutAmount <= 0) {
    return res.status(400).json({ error: 'Invalid payout amount' });
  }

  const { getEconomySettings } = await import('../services/wallet.js');
  const ecoSettings = await getEconomySettings();
  const minPayout = parseFloat(String(ecoSettings.creator_min_payout_usd || ecoSettings.min_payout_usd || 50));

  if (payoutAmount < minPayout) {
    return res.status(400).json({
      error: `Minimum payout threshold is $${minPayout.toFixed(2)} USD`,
      minPayout
    });
  }

  try {
    const creatorRes = await pool.query('SELECT earnings_balance, name FROM rinex_creators WHERE id = $1', [creatorId]);
    if (creatorRes.rows.length === 0) {
      return res.status(404).json({ error: 'Creator not found' });
    }
    const creator = creatorRes.rows[0];
    const currentBalance = parseFloat(creator.earnings_balance || '0');

    if (currentBalance < payoutAmount) {
      return res.status(400).json({ error: 'Insufficient earnings balance' });
    }

    const newBalance = Math.max(0, currentBalance - payoutAmount);
    const id = `payout-${Date.now()}`;
    const authUser = (req as any).user;
    const isWalletTransfer = method === 'wallet' && Boolean(authUser?.id);
    const initialStatus = isWalletTransfer ? 'completed' : 'pending';

    const insertRes = await ledgerPool.query(
      `INSERT INTO rinex_payout_requests (id, creator_id, amount, method, details, status, processed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, creatorId, payoutAmount, method, details || '', initialStatus, isWalletTransfer ? new Date() : null]
    );

    if (authUser?.id) {
      if (isWalletTransfer) {
        await ledgerPool.query(
          `INSERT INTO wallets (user_id, balance, usd_balance)
           VALUES ($1, $2, $2)
           ON CONFLICT (user_id) DO UPDATE SET
             balance = wallets.balance + EXCLUDED.balance,
             usd_balance = COALESCE(wallets.usd_balance, 0) + EXCLUDED.usd_balance,
             updated_at = CURRENT_TIMESTAMP`,
          [authUser.id, payoutAmount]
        );
        await ledgerPool.query(
          `INSERT INTO ledger_transactions (user_id, amount, points, transaction_type, status, description, reference_id)
           VALUES ($1, $2, 0, 'rinex_creator_payout_wallet', 'completed', $3, $4)`,
          [authUser.id, payoutAmount, `تحويل فوري لأرباح مبدع رينكس (${creator.name || creatorId}) إلى محفظة المنصة`, id]
        ).catch((tErr: any) => console.warn('[Rinex Payout Ledger Transaction] Notice:', tErr?.message || tErr));
      } else {
        await ledgerPool.query(
          `INSERT INTO ledger_transactions (user_id, amount, points, transaction_type, status, description, reference_id)
           VALUES ($1, $2, 0, 'rinex_creator_payout_request', 'pending', $3, $4)`,
          [authUser.id, -payoutAmount, `طلب سحب أرباح مبدع رينكس (${creator.name || creatorId}) - ${method}`, id]
        ).catch((tErr: any) => console.warn('[Rinex Payout Ledger Transaction] Notice:', tErr?.message || tErr));
      }
    }

    await pool.query('UPDATE rinex_creators SET earnings_balance = $1 WHERE id = $2', [newBalance, creatorId]);

    res.json({
      success: true,
      newBalance,
      payout: insertRes.rows[0]
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to request payout: ' + err.message });
  }
});

export default router;
