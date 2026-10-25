import fs from 'fs/promises';
import path from 'path';
import { pool } from '../db/index.js';

/**
 * Automatically crawls active bulletin pages, ads, blog articles, and other dynamic entities
 * to update the sitemap.xml file, ensuring public content is discoverable by search engines.
 * 
 * Logic:
 * 1. Aggregates static core routes.
 * 2. Fetches active bulletin pages (creator profiles).
 * 3. Fetches approved bulletin ads (posts/classifieds).
 * 4. Fetches public studio workspaces.
 * 5. Writes the combined set to public/sitemap.xml.
 */
export async function updateSitemapXml() {
  const baseUrl = (process.env.VITE_APP_URL || process.env.APP_URL || 'https://perplexta.app').replace(/\/$/, '');
  const sitemapPath = path.resolve(process.cwd(), 'public', 'sitemap.xml');
  const now = new Date().toISOString().split('T')[0];

  console.log(`[Sitemap] 🌐 Generating sitemap.xml for base URL: ${baseUrl}`);

  const urls: string[] = [];

  // 1. Static Routes (Core Platform Nodes)
  const staticRoutes = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/subscription', priority: '0.8', changefreq: 'weekly' },
    { path: '/rewards', priority: '0.7', changefreq: 'weekly' },
    { path: '/about', priority: '0.6', changefreq: 'monthly' },
    { path: '/terms', priority: '0.5', changefreq: 'monthly' },
    { path: '/privacy', priority: '0.5', changefreq: 'monthly' },
    { path: '/copyright', priority: '0.5', changefreq: 'monthly' },
    { path: '/bulletin', priority: '0.9', changefreq: 'daily' },
    { path: '/viralbook', priority: '0.9', changefreq: 'daily' },
    { path: '/overview', priority: '0.8', changefreq: 'weekly' },
    { path: '/discover', priority: '0.8', changefreq: 'daily' },
  ];

  for (const route of staticRoutes) {
    urls.push(`
  <url>
    <loc>${baseUrl}${route.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`);
  }

  // 2. Dynamic Bulletin Pages (Creators & Businesses)
  try {
    const pages = await pool.query('SELECT id, slug, updated_at FROM bulletin_pages ORDER BY updated_at DESC LIMIT 5000');
    for (const page of pages.rows) {
      const pagePath = page.slug ? `/creator/${page.slug}` : `/creator/${page.id}`;
      const lastMod = new Date(page.updated_at || new Date()).toISOString().split('T')[0];
      urls.push(`
  <url>
    <loc>${baseUrl}${pagePath}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
    }
  } catch (err: any) {
    console.warn('[Sitemap] Warning fetching bulletin pages:', err.message);
  }

  // 3. Dynamic Bulletin Ads (ViralBook Posts & Classifieds)
  try {
    const ads = await pool.query(`
      SELECT id, updated_at 
      FROM bulletin_ads 
      WHERE (deleted_at IS NULL) 
        AND (status = 'approved' OR status = 'active' OR status IS NULL)
      ORDER BY updated_at DESC LIMIT 10000
    `);
    for (const ad of ads.rows) {
      const lastMod = new Date(ad.updated_at || new Date()).toISOString().split('T')[0];
      // Support both legacy bulletin and unified viralbook routing
      urls.push(`
  <url>
    <loc>${baseUrl}/bulletin/${ad.id}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
      urls.push(`
  <url>
    <loc>${baseUrl}/viralbook/${ad.id}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
    }
  } catch (err: any) {
    console.warn('[Sitemap] Warning fetching bulletin ads:', err.message);
  }

  // 4. Dynamic Blog Articles (If table exists)
  try {
    const blogRes = await pool.query("SELECT id, slug, updated_at FROM blog_articles ORDER BY updated_at DESC LIMIT 1000").catch(() => null);
    if (blogRes && blogRes.rows) {
      for (const article of blogRes.rows) {
        const lastMod = new Date(article.updated_at || new Date()).toISOString().split('T')[0];
        urls.push(`
  <url>
    <loc>${baseUrl}/blog/${article.slug || article.id}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
      }
    }
  } catch {}

  // 5. Dynamic Marketplace Items (If table exists)
  try {
    const marketRes = await pool.query("SELECT id, updated_at FROM marketplace_items WHERE status = 'approved' ORDER BY updated_at DESC LIMIT 2000").catch(() => null);
    if (marketRes && marketRes.rows) {
      for (const item of marketRes.rows) {
        const lastMod = new Date(item.updated_at || new Date()).toISOString().split('T')[0];
        urls.push(`
  <url>
    <loc>${baseUrl}/marketplace/${item.id}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
      }
    }
  } catch {}

  // 6. Public Studio Workspaces (High-value shareable snapshots)
  try {
    const workspaceRes = await pool.query("SELECT id, updated_at FROM studio_workspaces WHERE is_public = true ORDER BY updated_at DESC LIMIT 1000").catch(() => null);
    if (workspaceRes && workspaceRes.rows) {
      for (const ws of workspaceRes.rows) {
        const lastMod = new Date(ws.updated_at || new Date()).toISOString().split('T')[0];
        urls.push(`
  <url>
    <loc>${baseUrl}/share/${ws.id}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`);
      }
    }
  } catch {}

  // Assemble the Final XML payload
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls.join('')}
</urlset>`;

  try {
    await fs.writeFile(sitemapPath, xml, 'utf8');
    console.log(`[Sitemap] ✅ Successfully updated sitemap.xml with ${urls.length} URLs.`);
  } catch (err: any) {
    console.error('[Sitemap] ❌ Failed to write sitemap.xml:', err.message);
    throw err;
  }

  return { success: true, count: urls.length, timestamp: new Date().toISOString() };
}
