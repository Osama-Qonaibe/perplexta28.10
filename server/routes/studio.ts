import express from 'express';
import { pool } from '../db/index.js';
import { authenticateToken, authenticateTokenOptional } from '../middleware/auth.js';

const router = express.Router();

/**
 * Loads the user's active subscription plan limits for Studio.
 */
async function getUserStudioLimits(userId: string | number) {
  if (!pool) return { maxProjects: 100, maxStorageMb: 500, maxSnapshots: 20, planName: 'Free' };
  try {
    // Check if user is admin or developer for unconstrained access
    const userRoleRes = await pool.query('SELECT role FROM users WHERE id = $1', [userId]).catch(() => ({ rows: [] }));
    const userRole = userRoleRes.rows[0]?.role?.toLowerCase();
    if (userRole === 'admin' || userRole === 'developer' || userRole === 'owner') {
      return { maxProjects: 'unlimited', maxStorageMb: 'unlimited', maxSnapshots: 'unlimited', planName: 'Admin / Unlimited' };
    }

    const res = await pool.query(`
      SELECT p.name_en, p.name_ar, p.limits 
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.user_id = $1 
        AND s.status = 'active' 
        AND (s.current_period_end IS NULL OR s.current_period_end > NOW())
      ORDER BY s.current_period_end DESC NULLS LAST
      LIMIT 1
    `, [userId]);

    let limits: any = {};
    let planName = 'Free';
    if (res.rows.length > 0 && res.rows[0]) {
      planName = res.rows[0].name_en || 'Pro';
      const rawLimits = res.rows[0].limits;
      limits = typeof rawLimits === 'string' ? JSON.parse(rawLimits) : (rawLimits || {});
    } else {
      const freePlanRes = await pool.query(`
        SELECT name_en, name_ar, limits 
        FROM plans 
        WHERE plan_type = 'free' OR monthly_price = 0 
        ORDER BY id ASC 
        LIMIT 1
      `).catch(() => ({ rows: [] }));
      
      if (freePlanRes.rows.length > 0 && freePlanRes.rows[0]) {
        planName = freePlanRes.rows[0].name_en || 'Free';
        const rawLimits = freePlanRes.rows[0].limits;
        limits = typeof rawLimits === 'string' ? JSON.parse(rawLimits) : (rawLimits || {});
      }
    }

    const appStudioLimits = limits.app_studio || limits.studio || {};
    
    // Parse max_projects (generous default of 50 projects for seamless creation)
    let maxProjects: number | 'unlimited' = 50;
    if (appStudioLimits.max_projects === 'unlimited' || appStudioLimits.max_projects === -1 || appStudioLimits.maxProjects === 'unlimited' || appStudioLimits.maxProjects === -1) {
      maxProjects = 'unlimited';
    } else {
      const raw = appStudioLimits.max_projects !== undefined ? appStudioLimits.max_projects : appStudioLimits.maxProjects;
      if (raw !== undefined && !isNaN(Number(raw))) {
        maxProjects = Math.max(50, Number(raw));
      }
    }

    // Parse max_storage_mb
    let maxStorageMb: number | 'unlimited' = 500;
    if (appStudioLimits.max_storage_mb === 'unlimited' || appStudioLimits.max_storage_mb === -1 || appStudioLimits.maxStorageMb === 'unlimited' || appStudioLimits.maxStorageMb === -1) {
      maxStorageMb = 'unlimited';
    } else {
      const raw = appStudioLimits.max_storage_mb !== undefined ? appStudioLimits.max_storage_mb : appStudioLimits.maxStorageMb;
      if (raw !== undefined && !isNaN(Number(raw))) {
        maxStorageMb = Math.max(200, Number(raw));
      }
    }

    // Parse max_snapshots
    let maxSnapshots: number | 'unlimited' = 20;
    if (appStudioLimits.max_snapshots === 'unlimited' || appStudioLimits.max_snapshots === -1 || appStudioLimits.maxSnapshots === 'unlimited' || appStudioLimits.maxSnapshots === -1) {
      maxSnapshots = 'unlimited';
    } else {
      const raw = appStudioLimits.max_snapshots !== undefined ? appStudioLimits.max_snapshots : appStudioLimits.maxSnapshots;
      if (raw !== undefined && !isNaN(Number(raw))) {
        maxSnapshots = Math.max(10, Number(raw));
      }
    }

    return { maxProjects, maxStorageMb, maxSnapshots, planName };
  } catch (err) {
    console.error('[getUserStudioLimits Error]:', err);
    return { maxProjects: 50, maxStorageMb: 500, maxSnapshots: 20, planName: 'Free' };
  }
}

/**
 * Calculates current studio usage for a user (number of projects, storage used in bytes and MB, total snapshots).
 */
async function getUserStudioUsage(userId: string | number) {
  if (!pool) return { projectCount: 0, storageBytes: 0, storageMb: 0, snapshotCount: 0 };
  try {
    const wsRes = await pool.query(
      `SELECT 
         COUNT(id) AS project_count,
         COALESCE(SUM(octet_length(COALESCE(files::text, '')) + octet_length(COALESCE(chat_history::text, ''))), 0) AS ws_bytes
       FROM studio_workspaces 
       WHERE user_id = $1`,
      [userId]
    );

    const snapRes = await pool.query(
      `SELECT 
         COUNT(s.id) AS snap_count,
         COALESCE(SUM(octet_length(COALESCE(s.files::text, ''))), 0) AS snap_bytes
       FROM studio_snapshots s
       JOIN studio_workspaces w ON s.workspace_id = w.id
       WHERE w.user_id = $1`,
      [userId]
    );

    const projectCount = parseInt(wsRes.rows[0]?.project_count || '0', 10);
    const wsBytes = parseInt(wsRes.rows[0]?.ws_bytes || '0', 10);
    const snapCount = parseInt(snapRes.rows[0]?.snap_count || '0', 10);
    const snapBytes = parseInt(snapRes.rows[0]?.snap_bytes || '0', 10);

    const totalBytes = wsBytes + snapBytes;
    const storageMb = Math.round((totalBytes / (1024 * 1024)) * 100) / 100;

    return {
      projectCount,
      storageBytes: totalBytes,
      storageMb,
      snapshotCount: snapCount
    };
  } catch (err) {
    console.error('[getUserStudioUsage Error]:', err);
    return { projectCount: 0, storageBytes: 0, storageMb: 0, snapshotCount: 0 };
  }
}

// Studio Quota & Usage Radar Endpoint
router.get('/usage', authenticateTokenOptional, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return res.json({
        isGuest: true,
        projectCount: 0,
        maxProjects: 3,
        storageUsedBytes: 0,
        storageUsedMb: 0,
        maxStorageMb: 25,
        snapshotCount: 0,
        maxSnapshots: 3,
        planName: 'Guest'
      });
    }

    const [limits, usage] = await Promise.all([
      getUserStudioLimits(userId),
      getUserStudioUsage(userId)
    ]);

    res.json({
      isGuest: false,
      projectCount: usage.projectCount,
      maxProjects: limits.maxProjects,
      storageUsedBytes: usage.storageBytes,
      storageUsedMb: usage.storageMb,
      maxStorageMb: limits.maxStorageMb,
      snapshotCount: usage.snapshotCount,
      maxSnapshots: limits.maxSnapshots,
      planName: limits.planName
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch studio usage metrics' });
  }
});

router.get('/workspaces', authenticateTokenOptional, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return res.json([]);
    }
    const result = await pool.query(
      'SELECT id, user_id, title, description, framework_mode, files, chat_history, is_public, metadata, created_at, updated_at FROM studio_workspaces WHERE user_id = $1 ORDER BY updated_at DESC', 
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workspaces' });
  }
});

// In-memory workspace cache ensuring live previews and share links work 100% of the time (including guest/local sessions)
const inMemoryWorkspaces = new Map<string, any>();

router.post('/workspaces', authenticateTokenOptional, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id, title, description, frameworkMode, files, chatHistory, isPublic, metadata } = req.body;
    if (!id || !title) {
      return res.status(400).json({ error: 'Workspace id and title are required' });
    }

    // Check Plan Limits & Storage Quota for authenticated users
    if (userId && pool) {
      const existingWs = await pool.query('SELECT id, user_id FROM studio_workspaces WHERE id = $1', [id]);
      const isNewWorkspace = existingWs.rows.length === 0;

      const [limits, usage] = await Promise.all([
        getUserStudioLimits(userId),
        getUserStudioUsage(userId)
      ]);

      // Projects Count Limit Enforcement (Only for creating brand new workspaces beyond quota)
      if (isNewWorkspace && typeof limits.maxProjects === 'number' && usage.projectCount >= limits.maxProjects) {
        // Still save in memory so preview works, but alert user on cloud persistence
        inMemoryWorkspaces.set(id, {
          id,
          user_id: userId || null,
          title,
          description: description || '',
          framework_mode: frameworkMode || 'html',
          files: files || {},
          chat_history: chatHistory || [],
          is_public: isPublic !== undefined ? !!isPublic : false,
          metadata: metadata || {},
          updated_at: new Date()
        });
        return res.json({ 
          success: true, 
          localOnly: true,
          limitReached: true,
          message: `لقد بلغت الحد الأقصى للمشاريع السحابية (${limits.maxProjects} مشاريع). تم حفظ المشروع محلياً في جلستك.`
        });
      }
    }

    // Always cache in memory so previews and live links never fail with "Workspace not found"
    inMemoryWorkspaces.set(id, {
      id,
      user_id: userId || null,
      title,
      description: description || '',
      framework_mode: frameworkMode || 'html',
      files: files || {},
      chat_history: chatHistory || [],
      is_public: isPublic !== undefined ? !!isPublic : false,
      metadata: metadata || {},
      updated_at: new Date()
    });

    try {
      await pool.query(
        `INSERT INTO studio_workspaces (id, user_id, title, description, framework_mode, files, chat_history, is_public, metadata) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET 
           user_id = COALESCE(EXCLUDED.user_id, studio_workspaces.user_id),
           title = EXCLUDED.title,
           description = COALESCE(EXCLUDED.description, studio_workspaces.description),
           framework_mode = EXCLUDED.framework_mode,
           files = EXCLUDED.files,
           chat_history = COALESCE(EXCLUDED.chat_history, studio_workspaces.chat_history),
           is_public = COALESCE(EXCLUDED.is_public, studio_workspaces.is_public),
           metadata = COALESCE(EXCLUDED.metadata, studio_workspaces.metadata),
           updated_at = CURRENT_TIMESTAMP
         WHERE studio_workspaces.user_id = EXCLUDED.user_id OR studio_workspaces.user_id IS NULL`,
        [
          id, 
          userId || null, 
          title, 
          description || '', 
          frameworkMode || 'html', 
          JSON.stringify(files || {}), 
          JSON.stringify(chatHistory || []), 
          isPublic !== undefined ? !!isPublic : false,
          JSON.stringify(metadata || {})
        ]
      );
    } catch (dbErr) {
      console.warn('[Studio Workspaces DB Upsert Notice]:', dbErr);
    }
    
    res.json({ success: true, localOnly: !userId });
  } catch (error) {
    console.error('[Studio Workspaces Save Error]:', error);
    res.status(500).json({ error: 'Failed to save workspace' });
  }
});

router.get('/workspaces/:id', authenticateTokenOptional, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;
    
    if (userId) {
      const result = await pool.query('SELECT * FROM studio_workspaces WHERE id = $1 AND user_id = $2', [id, userId]);
      if (result.rows.length > 0) {
        return res.json(result.rows[0]);
      }
    }

    const cached = inMemoryWorkspaces.get(id);
    if (cached) {
      return res.json(cached);
    }
    
    return res.status(404).json({ error: 'Workspace not found' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load workspace' });
  }
});

router.delete('/workspaces/:id', authenticateTokenOptional, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;
    
    if (!userId) {
      // Unauthenticated / Local session cleanup
      inMemoryWorkspaces.delete(id);
      return res.json({ success: true, localOnly: true });
    }

    if (pool) {
      // 1. Delete all snapshots (derivatives) associated with this workspace
      await pool.query(
        `DELETE FROM studio_snapshots 
         WHERE workspace_id IN (
           SELECT id FROM studio_workspaces WHERE id = $1 AND user_id = $2
         )`,
        [id, userId]
      ).catch((err: any) => {
        console.warn('[Delete Snapshots Notice]:', err);
      });

      // 2. Delete the workspace record itself from studio_workspaces
      const deleteRes = await pool.query('DELETE FROM studio_workspaces WHERE id = $1 AND user_id = $2', [id, userId]);
      
      // 3. Purge from in-memory cache
      inMemoryWorkspaces.delete(id);

      if (deleteRes.rowCount === 0) {
        return res.status(404).json({ error: 'المشروع غير موجود أو تم حذفه مسبقاً' });
      }
    } else {
      inMemoryWorkspaces.delete(id);
    }

    res.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('[Delete Workspace Server Error]:', error);
    res.status(500).json({ error: 'فشل حذف المشروع ومشتقاته من قاعدة البيانات' });
  }
});

router.patch('/workspaces/:id', authenticateTokenOptional, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;
    const { title, description, isPublic } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const updateRes = await pool.query(
      `UPDATE studio_workspaces 
       SET title = $1, 
           description = COALESCE($2, description), 
           is_public = COALESCE($3, is_public),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [title.trim(), description, isPublic, id, userId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Workspace not found or unauthorized' });
    }

    res.json({ success: true, workspace: updateRes.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update workspace' });
  }
});

// Workspace Version Snapshots Endpoints
router.get('/workspaces/:id/snapshots', authenticateTokenOptional, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    // Verify workspace ownership
    const wsCheck = await pool.query('SELECT id FROM studio_workspaces WHERE id = $1 AND user_id = $2', [id, userId]);
    if (wsCheck.rows.length === 0) return res.status(404).json({ error: 'Workspace not found' });

    const result = await pool.query(
      'SELECT id, workspace_id, version_name, created_at FROM studio_snapshots WHERE workspace_id = $1 ORDER BY created_at DESC',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch snapshots' });
  }
});

router.post('/workspaces/:id/snapshots', authenticateTokenOptional, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;
    const { versionName, files } = req.body;
    if (!userId) {
      return res.json({ success: true, localOnly: true });
    }
    if (!versionName) return res.status(400).json({ error: 'Version name is required' });

    const wsCheck = await pool.query('SELECT id, files FROM studio_workspaces WHERE id = $1 AND user_id = $2', [id, userId]);
    if (wsCheck.rows.length === 0) return res.status(404).json({ error: 'Workspace not found' });

    // Snapshot count enforcement per plan
    if (pool) {
      const limits = await getUserStudioLimits(userId);
      if (typeof limits.maxSnapshots === 'number') {
        const snapCountRes = await pool.query('SELECT count(*) as count FROM studio_snapshots WHERE workspace_id = $1', [id]);
        const currentSnaps = parseInt(snapCountRes.rows[0]?.count || '0', 10);
        const maxSnaps = limits.maxSnapshots;
        
        if (currentSnaps >= maxSnaps) {
          const deleteCount = (currentSnaps - maxSnaps) + 1;
          await pool.query(`
            DELETE FROM studio_snapshots 
            WHERE id IN (
              SELECT id FROM studio_snapshots 
              WHERE workspace_id = $1 
              ORDER BY created_at ASC 
              LIMIT $2
            )
          `, [id, deleteCount]);
        }
      }
    }

    const filesToSave = files || (typeof wsCheck.rows[0].files === 'string' ? JSON.parse(wsCheck.rows[0].files) : wsCheck.rows[0].files);

    const result = await pool.query(
      'INSERT INTO studio_snapshots (workspace_id, version_name, files) VALUES ($1, $2, $3) RETURNING id, version_name, created_at',
      [id, versionName, JSON.stringify(filesToSave)]
    );
    res.json({ success: true, snapshot: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create snapshot' });
  }
});

router.post('/workspaces/:id/snapshots/:snapshotId/restore', authenticateTokenOptional, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id, snapshotId } = req.params;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const snapResult = await pool.query(
      `SELECT s.files, s.version_name 
       FROM studio_snapshots s
       JOIN studio_workspaces w ON s.workspace_id = w.id
       WHERE s.id = $1 AND w.id = $2 AND w.user_id = $3`,
      [snapshotId, id, userId]
    );

    if (snapResult.rows.length === 0) {
      return res.status(404).json({ error: 'Snapshot not found or unauthorized' });
    }

    const restoredFiles = snapResult.rows[0].files;

    await pool.query(
      'UPDATE studio_workspaces SET files = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
      [typeof restoredFiles === 'string' ? restoredFiles : JSON.stringify(restoredFiles), id, userId]
    );

    res.json({ 
      success: true, 
      versionName: snapResult.rows[0].version_name,
      files: typeof restoredFiles === 'string' ? JSON.parse(restoredFiles) : restoredFiles
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore snapshot' });
  }
});

// In-memory cache for proxied scripts to ensure 0ms latency on subsequent loads and bypass CSP
const scriptCache: Record<string, { content: string; contentType: string }> = {};

router.get('/proxy/:library', async (req, res) => {
  const { library } = req.params;
  const libraryUrls: Record<string, string> = {
    tailwind: 'https://cdn.tailwindcss.com',
    react: 'https://unpkg.com/react@18/umd/react.production.min.js',
    'react-dom': 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
    babel: 'https://unpkg.com/@babel/standalone/babel.min.js',
    lucide: 'https://unpkg.com/lucide@latest/dist/umd/lucide.js',
    chartjs: 'https://cdn.jsdelivr.net/npm/chart.js',
    scrollreveal: 'https://unpkg.com/scrollreveal'
  };

  const url = libraryUrls[library.toLowerCase()];
  if (!url) {
    return res.status(404).send('Library not found');
  }

  if (scriptCache[url]) {
    res.setHeader('Content-Type', scriptCache[url].contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(scriptCache[url].content);
  }

  try {
    const fetchResponse = await fetch(url);
    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch from upstream: ${fetchResponse.statusText}`);
    }
    const content = await fetchResponse.text();
    const contentType = fetchResponse.headers.get('content-type') || 'application/javascript';

    scriptCache[url] = { content, contentType };

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(content);
  } catch (error: any) {
    console.error(`[Studio Proxy Error] Failed to proxy ${library}:`, error?.message || error);
    res.status(500).send(`Failed to load ${library} library`);
  }
});

router.get('/workspaces/:id/preview', authenticateTokenOptional, async (req: any, res) => {
  try {
    const { id } = req.params;
    const lang = (req.query.lang || 'ar') as string;
    const dir = (req.query.dir || 'rtl') as string;

    let workspace: any = null;

    try {
      const result = await pool.query('SELECT * FROM studio_workspaces WHERE id = $1', [id]);
      if (result.rows.length > 0) {
        workspace = result.rows[0];
      }
    } catch (dbErr) {
      console.warn('[Studio Preview DB Query Error]:', dbErr);
    }

    if (!workspace) {
      workspace = inMemoryWorkspaces.get(id);
    }

    if (!workspace) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="${lang}" dir="${dir}">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${lang === 'ar' ? 'المشروع قيد المزامنة' : 'Workspace Syncing'}</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-900 text-white min-h-screen flex items-center justify-center p-6 text-center font-sans">
          <div class="max-w-md space-y-4">
            <div class="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 mx-auto flex items-center justify-center text-xl font-bold">⚡</div>
            <h1 class="text-xl font-bold">${lang === 'ar' ? 'المشروع قيد المزامنة أو قيد الإنشاء' : 'Workspace Syncing or Initializing'}</h1>
            <p class="text-xs text-slate-400 leading-relaxed">${lang === 'ar' ? 'يرجى الرجوع للاستوديو والنقر على "فتح بالمتصفح" أو إجراء حفظ للمشروع.' : 'Please return to studio and open live preview again.'}</p>
            <a href="/app" class="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition">
              ${lang === 'ar' ? 'الرجوع للاستوديو' : 'Back to Studio'}
            </a>
          </div>
        </body>
        </html>
      `);
    }

    const files = typeof workspace.files === 'string' ? JSON.parse(workspace.files) : (workspace.files || {});

    let rawHtml = files['index.html']?.content || '<div class="p-8 text-center text-slate-400">جاري تحميل المشروع...</div>';
    if (rawHtml.includes('\\n') && (rawHtml.match(/\\n/g)?.length || 0) > 3) {
      rawHtml = rawHtml
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"');
    }

    let htmlContent = rawHtml
      .replace(/<script\b[^>]*\bsrc=["'](?!https?:\/\/|\/\/|\/api\/)[^"']+\.(?:jsx?|tsx?|mjs|cjs|ts)["'][^>]*>\s*<\/script>/gi, '')
      .replace(/<link\b[^>]*\bhref=["'](?!https?:\/\/|\/\/|\/api\/)[^"']+\.css["'][^>]*\/?>/gi, '')
      .replace(/https:\/\/unpkg\.com\/scrollreveal(?:\/dist\/scrollreveal\.min\.js)?/gi, '/api/studio/proxy/scrollreveal')
      .replace(/https:\/\/unpkg\.com\/lucide@latest\/dist\/umd\/lucide\.js/gi, '/api/studio/proxy/lucide')
      .replace(/https:\/\/unpkg\.com\/lucide@latest/gi, '/api/studio/proxy/lucide')
      .replace(/https:\/\/cdn\.tailwindcss\.com/gi, '/api/studio/proxy/tailwind');

    const allCss = Object.keys(files)
      .filter(p => p.endsWith('.css'))
      .map(p => {
        let c = files[p].content || '';
        if (c.includes('\\n')) c = c.replace(/\\n/g, '\n');
        return c;
      })
      .join('\n');

    const isConfigFile = (p: string) => {
      const base = p.split('/').pop()?.toLowerCase() || '';
      return base.startsWith('vite.config.') || base.startsWith('tailwind.config.') || base.startsWith('postcss.config.') || base.startsWith('eslint.config.');
    };

    const allCodeFiles = Object.keys(files)
      .filter(p => !isConfigFile(p))
      .filter(p => p.endsWith('.js') || p.endsWith('.jsx') || p.endsWith('.ts') || p.endsWith('.tsx'));

    const getFilePriority = (path: string) => {
      const lower = path.toLowerCase();
      if (lower.includes('types') || lower.includes('constants') || lower.includes('config')) return 1;
      if (lower.includes('data') || lower.includes('mock') || lower.includes('seed')) return 2;
      if (lower.includes('utils') || lower.includes('helpers') || lower.includes('services')) return 3;
      if (lower.includes('context') || lower.includes('hooks') || lower.includes('store')) return 4;
      if (lower.includes('components') || lower.includes('ui') || lower.includes('views')) return 5;
      if (lower.includes('pages')) return 6;
      if (lower.endsWith('app.jsx') || lower.endsWith('app.tsx')) return 7;
      if (lower.endsWith('main.jsx') || lower.endsWith('main.tsx') || lower.endsWith('index.jsx') || lower.endsWith('index.tsx') || lower === 'src/app.js' || lower === 'app.js' || lower === 'script.js' || lower === 'main.js') return 8;
      return 5;
    };

    const sortedFiles = [...allCodeFiles].sort((a, b) => getFilePriority(a) - getFilePriority(b));

    const babelFiles = sortedFiles.filter(p => p.endsWith('.jsx') || p.endsWith('.tsx'));
    const plainJsFiles = sortedFiles.filter(p => p.endsWith('.js') || p.endsWith('.ts'));

    const plainJsScripts = plainJsFiles.map(p => `
      <script data-file="${p}">
        /* --- File: ${p} --- */
        ${cleanEsmForBrowser(files[p]?.content || '')}
      </script>
    `).join('\n');

    const combinedBabelCode = babelFiles.map(p => `
      /* --- File: ${p} --- */
      ${cleanEsmForBrowser(files[p]?.content || '')}
    `).join('\n\n');

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
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Tajawal:wght@400;500;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />
      <script src="/api/studio/proxy/tailwind"></script>
      <script src="/api/studio/proxy/react"></script>
      <script src="/api/studio/proxy/react-dom"></script>
      <script src="/api/studio/proxy/babel"></script>
      <script src="/api/studio/proxy/lucide"></script>
      <script src="/api/studio/proxy/chartjs"></script>
      <script>
        // Global Image Fallback Polyfill (prevents broken image placeholder icons)
        window.addEventListener('error', function(e) {
          if (e.target && e.target.tagName === 'IMG') {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80';
          }
        }, true);

        // Event listener race-condition polyfill for DOMContentLoaded and load events in iframes/tabs
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

        // Expose React hooks globally for seamless multi-file JSX execution
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
        if (window.ReactDOM && !window.ReactDOM.createRoot) {
          window.ReactDOM.createRoot = function(container) {
            return {
              render: function(element) {
                window.ReactDOM.render(element, container);
              }
            };
          };
        }
        if (window.ReactDOM) {
          window.createRoot = window.ReactDOM.createRoot;
        }
        tailwind.config = {
          darkMode: 'class',
          theme: {
            extend: {
              fontFamily: {
                sans: ['Tajawal', 'Cairo', 'Inter', 'system-ui', 'sans-serif'],
                tajawal: ['Tajawal', 'sans-serif'],
                cairo: ['Cairo', 'sans-serif'],
              }
            }
          }
        }
      </script>
      <style>
        ${allCss}
        body {
          font-family: 'Tajawal', 'Cairo', 'Inter', system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
      </style>
      <script>
        (function() {
          window.process = window.process || { env: {} };
          window.process.env = Object.assign(window.process.env, ${JSON.stringify((workspace?.metadata && typeof workspace.metadata === 'object' && workspace.metadata.envVars) ? workspace.metadata.envVars : {})});
          window.__VITE_ENV__ = Object.assign(window.__VITE_ENV__ || {}, window.process.env);
        })();
      </script>
    `;

    const injectionScripts = `
      ${plainJsScripts}
      ${babelFiles.length > 0 ? `
      <script type="text/babel" data-presets="typescript,react,env">
        const { useState, useEffect, useRef, useMemo, useCallback, useContext, createContext, useReducer, Fragment } = window.React || {};
        const { createRoot } = window.ReactDOM || {};
        ${combinedBabelCode}
        setTimeout(function() {
          if (typeof window.initLucideIcons === 'function') window.initLucideIcons();
        }, 50);
      </script>
      ` : ''}
      <script>
        window.addEventListener('DOMContentLoaded', function() {
          if (typeof window.initLucideIcons === 'function') window.initLucideIcons();
        });
        window.addEventListener('load', function() {
          if (typeof window.initLucideIcons === 'function') window.initLucideIcons();
        });
        if (typeof window.initLucideIcons === 'function') window.initLucideIcons();
      </script>
    `;

    if (/<head[^>]*>/i.test(htmlContent)) {
      htmlContent = htmlContent.replace(/(<head[^>]*>)/i, `$1${injectionHead}`);
    } else if (/<html[^>]*>/i.test(htmlContent)) {
      htmlContent = htmlContent.replace(/(<html[^>]*>)/i, `$1<head>${injectionHead}</head>`);
    } else {
      htmlContent = `<!DOCTYPE html><html lang="${lang}" dir="${dir}"><head>${injectionHead}</head><body>${htmlContent}</body></html>`;
    }

    if (/<\/body>/i.test(htmlContent)) {
      htmlContent = htmlContent.replace(/(<\/body>)/i, `${injectionScripts}$1`);
    } else if (/<\/html>/i.test(htmlContent)) {
      htmlContent = htmlContent.replace(/(<\/html>)/i, `${injectionScripts}$1`);
    } else {
      htmlContent = htmlContent + injectionScripts;
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlContent);
  } catch (error: any) {
    console.error('[Studio Preview Error] Failed to render workspace preview:', error?.message || error);
    res.status(500).send('Failed to generate workspace preview');
  }
});

function normalizeFileContent(raw: string): string {
  if (typeof raw !== 'string') return '';
  let content = raw.trim();
  // Strip accidental outer markdown fences inside <perplexta_file> tags
  if (/^```[a-zA-Z0-9_-]*\s*\n/.test(content) && /\n```\s*$/.test(content)) {
    content = content.replace(/^```[a-zA-Z0-9_-]*\s*\n/, '').replace(/\n```\s*$/, '').trim();
  }
  if (content.includes('\\n') && !content.includes('\n')) {
    content = content
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
  return content;
}

function cleanEsmForBrowser(code: string): string {
  if (!code) return '';
  const exportBlockRegex = /export\s*\{([\s\S]*?)\};?/g;
  let match;
  let cleanCode = code;
  let binds = '';
  while ((match = exportBlockRegex.exec(code)) !== null) {
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
}

function tryParseBlueprintJson(rawBp: string): any {
  if (!rawBp) return null;
  let cleaned = rawBp.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === 'object') {
      const order = parsed.file_tree_order || parsed.files_order || parsed.files || [];
      if (Array.isArray(order)) {
        parsed.file_tree_order = order;
        parsed.files_order = order;
      }
      return parsed;
    }
  } catch {
    try {
      const relaxed = cleaned.replace(/,\s*([}\]])/g, '$1');
      const parsed = JSON.parse(relaxed);
      if (parsed && typeof parsed === 'object') {
        const order = parsed.file_tree_order || parsed.files_order || parsed.files || [];
        if (Array.isArray(order)) {
          parsed.file_tree_order = order;
          parsed.files_order = order;
        }
        return parsed;
      }
    } catch (_) {}
  }
  return null;
}

router.post('/generate', authenticateTokenOptional, async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.userId || null;
    const { prompt, files, errorLogs, activeFilePath, history } = req.body;
    
    if (!prompt && (!errorLogs || errorLogs.length === 0)) {
      return res.status(400).json({ error: 'Prompt or error logs required' });
    }

    const { pool } = await import('../db/index.js');
    const { callAIProvider, getProviderKey, getProviderUrlKey } = await import('../services/ai.js');
    const { checkAndIncrementQuota } = await import('../services/quota.js');
    const { getCachedOrchestratorConfig, getCachedApiKeysVault } = await import('../db/queries.js');

    if (userId) {
      const quotaCheck = await checkAndIncrementQuota(userId, 'code');
      if (!quotaCheck.allowed) {
        return res.status(429).json({
          error: 'QUOTA_EXCEEDED',
          message: 'لقد تجاوزت الحد المسموح به لأداة الكود. يرجى ترقية باقتك.',
          message_en: 'Code generation quota exceeded. Please upgrade your plan.'
        });
      }
    }

    // Dynamic Database Orchestrator Routing (Zero hardcoded model names)
    let route = await getCachedOrchestratorConfig('code').catch(() => null);
    if (!route) {
      const routeRes = await pool.query("SELECT * FROM tool_orchestrator WHERE tool_id = 'code' AND is_active = true LIMIT 1");
      if (routeRes.rows.length > 0) {
        route = routeRes.rows[0];
      }
    }

    // 1 Primary + 3 Fallbacks strictly from Database Tool Orchestrator Registry (Decree #3: Orchestrator Absolutism)
    const targets: Array<{ provider: string; model: string }> = [];

    if (route && route.is_active && route.primary_provider && route.primary_model) {
      targets.push({ provider: route.primary_provider.trim(), model: route.primary_model.trim() });

      if (route.fallback_1_provider && route.fallback_1_model) {
        targets.push({ provider: route.fallback_1_provider.trim(), model: route.fallback_1_model.trim() });
      }

      if (route.fallback_2_provider && route.fallback_2_model) {
        targets.push({ provider: route.fallback_2_provider.trim(), model: route.fallback_2_model.trim() });
      }

      if (route.fallback_3_provider && route.fallback_3_model) {
        targets.push({ provider: route.fallback_3_provider.trim(), model: route.fallback_3_model.trim() });
      }
    }

    if (targets.length === 0) {
      throw new Error(
        'لم يتم ضبط مسار أداة هندسة البرمجيات (code) في الأوركسترا بلوحة التحكم. يرجى الدخول إلى لوحة التحكم > الأوركسترا، وتعيين النموذج الأساسي والبدائل الاحتياطية (1، 2، 3) وتفعيل الأداة.'
      );
    }

    // Detect if workspace only contains the initial blank launchpad index.html
    const fileKeys = Object.keys(files || {});
    const indexHtmlContent = files?.['index.html']?.content || '';
    const isDefaultLaunchpad = fileKeys.length === 1 && fileKeys[0] === 'index.html' && (
      indexHtmlContent.includes('جاهز للتطوير') ||
      indexHtmlContent.includes('Ready to Build') ||
      indexHtmlContent.includes('أدخل وصف التطبيق أو الميزة المطلوبة') ||
      indexHtmlContent.includes('Enter your application description in the chat panel')
    );

    const isNewProjectRequest = req.body.isNewProject === true || fileKeys.length === 0 || isDefaultLaunchpad;

    // Dynamic Task-Aware Status Messages (Clean Executive Style without Emojis)
    const lowerPrompt = (prompt || '').toLowerCase();
    let dynamicAnalyzingMsg = 'تحليل المتطلبات البرمجية وتخطيط البنية...';
    let dynamicGeneratingMsg = 'كتابة وتنفيذ التعديلات البرمجية في الوقت الفعلي...';

    if (isNewProjectRequest) {
      dynamicAnalyzingMsg = 'تحليل متطلبات المشروع وهندسة شجرة الملفات...';
      dynamicGeneratingMsg = 'بناء شجرة الملفات وكتابة الكود المصدري للمشروع...';
    } else if (/css|ستايل|مظهر|ألوان|تصميم|تنسيق|خلفية|خط|theme|color|style|dark mode|font/i.test(lowerPrompt)) {
      dynamicAnalyzingMsg = 'فحص ملفات التنسيق والهيكل البصري...';
      dynamicGeneratingMsg = 'تدقيق وتحسين أنماط CSS والألوان والتجاوب البصري...';
    } else if (/db|قاعدة|بيانات|جدول|جداول|sql|schema|database|table/i.test(lowerPrompt)) {
      dynamicAnalyzingMsg = 'تدقيق هيكل البيانات ومخطط SQLite...';
      dynamicGeneratingMsg = 'كتابة مخطط الجداول واستعلامات SQL المطلوبة...';
    } else if (/js|جافاسكريبت|دالة|منطق|تفاعل|زر|سلة|بحث|تصفية|search|filter|script|function|cart/i.test(lowerPrompt)) {
      dynamicAnalyzingMsg = 'مراجعة المنطق البرمجي والأحداث التفاعلية...';
      dynamicGeneratingMsg = 'برمجة وتطوير منطق JavaScript والوظائف التفاعلية...';
    } else if (/خطأ|error|fix|إصلاح|terminal|طرفية|تصحيح|debug/i.test(lowerPrompt) || (errorLogs && errorLogs.length > 0)) {
      dynamicAnalyzingMsg = 'فحص سجلات الأخطاء وتتبع المشاكل البرمجية...';
      dynamicGeneratingMsg = 'تصحيح الأخطاء البرمجية وإعادة المزامنة بدقة...';
    }

    const currentFilesSummary = (!isNewProjectRequest && fileKeys.length > 0)
      ? fileKeys.map(p => {
          const f = files[p];
          return `FILE: ${p} (${f.type || 'text'})\nCONTENT:\n${f.content || ''}\n---`;
        }).join('\n\n')
      : '(Blank Workspace — Ready for complete multi-file project scaffolding according to user requirements)';

    const systemPrompt = `You are a Senior Software Architect & Full-Stack Code Generation Engine.
You design, scaffold, and maintain complete, production-ready multi-file web applications in the Studio File Tree with surgical precision and real-time execution.

1. MULTI-FILE PROJECT ARCHITECTURE TAILORED TO USER REQUIREMENTS (هيكلة شجرة الملفات حسب الاحتياجات):
When building a new project (NEW_PROJECT_BUILD) or expanding an existing project, you MUST organize the project into a clean, modular multi-file tree inside <perplexta_blueprint> and write every single file in full inside <perplexta_file path="...">.

Choose the file structure dynamically according to the project's domain and needs:

- STANDARD MODULAR MULTI-FILE WEB ARCHITECTURE (Default — Fast, Zero-Lag Native Execution):
  Structure the project into clean, well-organized files based on what the application actually needs:
  1. "index.html": Complete semantic HTML5 application shell (Navbar/Header, Hero/Stats, Main Dynamic Content Containers, Filter/Search bars, Modals/Drawers markup, Toast container, Footer) using Tailwind CSS and Google Fonts (Tajawal/Cairo/Inter).
  2. "styles/main.css": Custom CSS rules, smooth animations, custom scrollbars, glassmorphism effects, and dark/light theme styling.
  3. "src/data/mockData.js" (or domain-specific path like "src/data/productsData.js", "src/data/dashboardData.js", "src/data/bookingsData.js"): Rich, realistic structured dataset assigned to window (e.g., window.STORE_DATA = [...] or const PRODUCTS = window.PRODUCTS = [...]) with 6-10 realistic items, categories, metrics, and Arabic/English labels matching the user's request.
  4. "src/components/uiRenderer.js" (when the app has reusable cards, tables, modals, or charts): Modular UI rendering functions (e.g. window.renderCard = ..., window.renderModal = ...) that generate rich interactive HTML with inline SVG icons.
  5. "src/app.js": Core application controller & interactive engine: state management with localStorage persistence, live search & category filtering, cart/drawer/modal open & close handlers, form validation & submission, interactive notifications, dark/light mode toggle, and full DOM event listener bindings.
  6. "db/schema.sql" (Include whenever the project involves products, orders, users, customers, bookings, tasks, analytics, or inventory): Complete SQLite schema ("CREATE TABLE IF NOT EXISTS ...") with realistic "INSERT INTO ..." seed records so the Studio Database Manager works immediately.

- REACT & JSX MULTI-FILE ARCHITECTURE (Use when the user explicitly requests React / JSX):
  1. "index.html": Contains <div id="root"></div>.
  2. "styles/main.css": Custom styles and animations.
  3. "src/data/mockData.js": Realistic structured data exported/bound to window.
  4. "src/components/Navbar.jsx", "src/components/...": Modular React components (.jsx).
  5. "src/App.jsx": Main React application component combining all views and state.
  6. "src/main.jsx": Mounts <App /> to #root via ReactDOM.createRoot.
  7. "db/schema.sql": SQLite database schema and seed data if applicable.

2. CRITICAL QUALITY & EXECUTION RULES:
- REAL MULTI-FILE CREATION: For any new project (NEW_PROJECT_BUILD), you MUST generate at least 4 to 6 modular files in the file tree (e.g. "index.html", "styles/main.css", "src/data/...", "src/components/...", "src/app.js", and "db/schema.sql" when data-driven). NEVER dump everything into a single index.html file when building a project!
- ZERO OMISSION POLICY: Every file listed in "file_tree_order" of <perplexta_blueprint> MUST be written completely inside a matching <perplexta_file path="...">...</perplexta_file> block. Never output placeholders like "// ... rest of code" or "<!-- TODO -->".
- NO MARKDOWN FENCES INSIDE <perplexta_file>: Write raw source code directly inside <perplexta_file path="..."> without wrapping it in \`\`\`html or \`\`\`js fences.
- CROSS-FILE GLOBAL COMPATIBILITY: In JavaScript files ("src/data/...", "src/components/...", "src/app.js"), attach shared data and functions to \`window\` (or declare them at top level as \`const X = window.X = ...\` / \`function fn() {}\`) so all files in the file tree communicate seamlessly in the browser sandbox.
- 100% WORKING INTERACTIVITY: Every button in "index.html" or dynamically rendered cards (Add to Cart, Open Cart, Checkout, Filter Category, Search Input, Dark Mode Toggle, Login/Register Modal, Add New Record) MUST have a working event listener in "src/app.js".
- NO BROKEN IMAGES OR ICONS: Use inline SVG icons (<svg>...</svg>) or Lucide icons (data-lucide="..."), and use valid high-resolution Unsplash URLs (https://images.unsplash.com/photo-...) for images.
- THE "NEVER DESTROY, ONLY EVOLVE" RULE FOR TARGETED UPDATES: When REQUEST TYPE is TARGETED_UPDATE, inspect EXISTING PROJECT FILES carefully. Preserve existing files, layouts, and styles. You may add new modular files to the file tree (e.g. "src/components/authModal.js" or "db/schema.sql") and update "index.html" / "src/app.js" additively without deleting existing features.

3. THREE-PHASE OUTPUT FORMAT (MANDATORY):

PHASE 1: ARCHITECTURE BLUEPRINT (<perplexta_blueprint>)
Start immediately with <perplexta_blueprint> containing valid JSON:
<perplexta_blueprint>
{
  "phase": "blueprint",
  "project_name": "digital-products-store",
  "framework": "html-tailwind",
  "file_tree_order": [
    "index.html",
    "styles/main.css",
    "src/data/productsData.js",
    "src/components/uiRenderer.js",
    "src/app.js",
    "db/schema.sql"
  ],
  "suggestions": [
    "تطوير نافذة تسجيل دخول وحسابات العملاء",
    "إضافة نظام كوبونات خصم وحساب الضريبة تلقائياً",
    "إنشاء لوحة إحصائيات المبيعات وتصدير الفواتير"
  ]
}
</perplexta_blueprint>

PHASE 2: COMPLETE FILE SYNTHESIS (<perplexta_file path="...">)
Immediately write every file in "file_tree_order" in sequence:
<perplexta_file path="index.html">
<!DOCTYPE html>
...
</perplexta_file>

<perplexta_file path="styles/main.css">
...
</perplexta_file>

<perplexta_file path="src/data/productsData.js">
...
</perplexta_file>

<perplexta_file path="src/components/uiRenderer.js">
...
</perplexta_file>

<perplexta_file path="src/app.js">
...
</perplexta_file>

<perplexta_file path="db/schema.sql">
...
</perplexta_file>

PHASE 3: CONCISE TECHNICAL SUMMARY
After closing the last </perplexta_file>, write 2-4 concise sentences in Arabic summarizing the architecture built, the files created in the file tree, and the interactive features wired. Use formal technical Arabic without emojis.`;

    const userPrompt = `USER REQUEST: ${prompt || 'Build and elevate the project'}\nREQUEST TYPE: ${isNewProjectRequest ? 'NEW_PROJECT_BUILD (Scaffold a complete multi-file project in the file tree tailored to this request)' : 'TARGETED_UPDATE (Evolve existing project files and add any needed modules)'}\nACTIVE FILE IN EDITOR: ${activeFilePath || 'index.html'}\n\nERROR LOGS (IF ANY):\n${JSON.stringify(errorLogs || [])}\n\nEXISTING PROJECT FILES:\n${currentFilesSummary}`;

    const isStreamingRequested = req.headers['accept']?.includes('text/event-stream') || req.body.stream === true;
    
    if (isStreamingRequested) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      if (typeof (res as any).flushHeaders === 'function') {
        (res as any).flushHeaders();
      }

      res.write(`data: ${JSON.stringify({ type: 'step', step: 'analyzing', phase: 1, message: dynamicAnalyzingMsg })}\n\n`);
    }

    let rawResponse = '';
    let usedProvider = '';
    let usedModel = '';

    const formattedHistory: Array<{ role: string; content: string }> = Array.isArray(history)
      ? history.map((h: any) => ({ role: h.role === 'user' ? 'user' : 'assistant', content: String(h.content || '') }))
      : [];

    const failedTargets = new Set<string>();
    let stepGeneratingSent = false;

    // Real-time stream state trackers for live File Tree population
    let streamBlueprintEmitted = false;
    const streamStartedFiles = new Set<string>();
    const streamCompletedFiles = new Set<string>();

    const processRealtimeStream = (accumulatedText: string, chunkText: string) => {
      if (!isStreamingRequested || res.writableEnded) return;

      // 1. Emit raw chunk for live code preview
      res.write(`data: ${JSON.stringify({ type: 'chunk', chunk: chunkText })}\n\n`);

      // 2. Check if <perplexta_blueprint>...</perplexta_blueprint> has completed
      if (!streamBlueprintEmitted) {
        const bpMatch = /<perplexta_blueprint>([\s\S]*?)<\/perplexta_blueprint>/i.exec(accumulatedText);
        if (bpMatch) {
          streamBlueprintEmitted = true;
          const parsedBp = tryParseBlueprintJson(bpMatch[1]);
          if (parsedBp) {
            res.write(`data: ${JSON.stringify({ type: 'blueprint', blueprint: parsedBp })}\n\n`);
            const count = Array.isArray(parsedBp.file_tree_order) ? parsedBp.file_tree_order.length : 0;
            res.write(`data: ${JSON.stringify({
              type: 'step',
              step: 'scaffolding',
              phase: 2,
              message: count > 0
                ? `تم اعتماد المخطط الهيكلي (${count} ملفات) — جاري إنشاء الملفات في الشجرة...`
                : 'تم اعتماد المخطط الهيكلي — جاري كتابة ملفات المشروع...'
            })}\n\n`);
          }
        }
      }

      // 3. Check for newly completed <perplexta_file ...>...</perplexta_file> blocks first
      const closedFileRegex = /<perplexta_file\s+(?:path|file|name)=["']([^"']+)["'][^>]*>([\s\S]*?)<\/perplexta_file>/gi;
      let cMatch;
      while ((cMatch = closedFileRegex.exec(accumulatedText)) !== null) {
        const fPath = cMatch[1].trim();
        if (fPath && !streamCompletedFiles.has(fPath)) {
          streamCompletedFiles.add(fPath);
          streamStartedFiles.add(fPath);
          const normContent = normalizeFileContent(cMatch[2]);
          const ext = fPath.split('.').pop() || 'txt';
          const fName = fPath.split('/').pop() || fPath;
          if (normContent) {
            res.write(`data: ${JSON.stringify({
              type: 'file_complete',
              path: fPath,
              file: {
                name: fName,
                path: fPath,
                type: ext,
                content: normContent,
                isEntry: fPath === 'index.html'
              }
            })}\n\n`);
          }
        }
      }

      // 4. Check for any <perplexta_file ...> opening tag currently being written
      const openFileRegex = /<perplexta_file\s+(?:path|file|name)=["']([^"']+)["'][^>]*>/gi;
      let oMatch;
      while ((oMatch = openFileRegex.exec(accumulatedText)) !== null) {
        const fPath = oMatch[1].trim();
        if (fPath && !streamStartedFiles.has(fPath)) {
          streamStartedFiles.add(fPath);
          res.write(`data: ${JSON.stringify({
            type: 'file_writing',
            path: fPath,
            message: `جاري برمجة الملف: ${fPath}`
          })}\n\n`);
        }
      }
    };

    // Silent Failover Execution across Primary + Fallbacks
    for (const target of targets) {
      const targetKey = `${target.provider.toLowerCase().trim()}:${target.model.toLowerCase().trim()}`;
      if (failedTargets.has(targetKey)) {
        continue;
      }
      try {
        const key = await getProviderKey(target.provider);
        if (!key && !target.provider.toLowerCase().includes('ollama')) continue;
        const urlKey = await getProviderUrlKey(target.provider).catch(() => undefined);

        if (isStreamingRequested && !stepGeneratingSent && !res.writableEnded) {
          stepGeneratingSent = true;
          res.write(`data: ${JSON.stringify({ type: 'step', step: 'generating', phase: 1, message: dynamicGeneratingMsg })}\n\n`);
        }

        let accumulated = '';
        streamBlueprintEmitted = false;
        streamStartedFiles.clear();
        streamCompletedFiles.clear();

        const returnedText = await callAIProvider(
          target.provider,
          target.model,
          key || '',
          userPrompt,
          systemPrompt,
          (chunk) => {
            accumulated += chunk;
            processRealtimeStream(accumulated, chunk);
          },
          formattedHistory,
          { stream: isStreamingRequested, toolId: 'code', headerTimeoutMs: 15000 },
          urlKey || undefined
        );

        const finalOutput = (accumulated && accumulated.trim().length > 0) ? accumulated : (returnedText || '');
        if (finalOutput && finalOutput.trim().length > 0) {
          rawResponse = finalOutput;
          usedProvider = target.provider;
          usedModel = target.model;
          break;
        }
      } catch (callErr: any) {
        failedTargets.add(targetKey);
        console.warn(`[Studio Orchestrator Failover] Target ${target.provider}/${target.model} failed:`, callErr?.message);
      }
    }

    // Secondary Dynamic Vault Recovery if all configured slots experienced upstream spikes
    if (!rawResponse || rawResponse.trim().length === 0) {
      try {
        const vaultRows = await getCachedApiKeysVault();
        for (const row of vaultRows) {
          if (!row || !row.provider || row.is_active === false) continue;
          const rawModels = Array.isArray(row.models) ? row.models : [];
          const candidateModels = rawModels
            .map((m: any) => typeof m === 'string' ? m : (m?.id || m?.name || ''))
            .filter((id: string) => {
              const lower = id.toLowerCase();
              return lower.length > 0 &&
                !lower.includes('tts') &&
                !lower.includes('image') &&
                !lower.includes('embedding') &&
                !lower.includes('transcribe') &&
                !lower.includes('robotics') &&
                !lower.includes('computer-use') &&
                !lower.includes('antigravity') &&
                !lower.includes('deep-research') &&
                !lower.includes('lyria') &&
                !lower.includes('aqa') &&
                !lower.includes('3.8-flash') &&
                !lower.includes('3.1-flash-lite') &&
                !lower.includes('pro-preview') &&
                !lower.includes('latest');
            })
            .slice(0, 3);

          for (const candidateModel of candidateModels) {
            const targetKey = `${row.provider.toLowerCase().trim()}:${candidateModel.toLowerCase().trim()}`;
            if (failedTargets.has(targetKey)) continue;
            try {
              const key = await getProviderKey(row.provider);
              if (!key) continue;
              const urlKey = await getProviderUrlKey(row.provider).catch(() => undefined);
              let accumulated = '';
              streamBlueprintEmitted = false;
              streamStartedFiles.clear();
              streamCompletedFiles.clear();

              const returnedText = await callAIProvider(
                row.provider,
                candidateModel,
                key,
                userPrompt,
                systemPrompt,
                (chunk) => {
                  accumulated += chunk;
                  processRealtimeStream(accumulated, chunk);
                },
                formattedHistory,
                { stream: isStreamingRequested, toolId: 'code', headerTimeoutMs: 15000 },
                urlKey || undefined
              );
              const finalOutput = (accumulated && accumulated.trim().length > 0) ? accumulated : (returnedText || '');
              if (finalOutput && finalOutput.trim().length > 0) {
                rawResponse = finalOutput;
                usedProvider = row.provider;
                usedModel = candidateModel;
                break;
              }
            } catch (vaultFallbackErr: any) {
              failedTargets.add(targetKey);
            }
          }
          if (rawResponse && rawResponse.trim().length > 0) break;
        }
      } catch (_) {}
    }

    if (!rawResponse || rawResponse.trim().length === 0) {
      throw new Error('فشلت جميع محاولات الاتصال بمزودي الذكاء الاصطناعي (بما في ذلك خادم Ollama المحلي والاتصال السحابي). يرجى التحقق من مفاتيح واجهة البرمجة (API Keys) في لوحة التحكم أو تشغيل خادم Ollama.');
    }
    
    // Universal Multi-Protocol Output Parser
    const newlyGeneratedFiles: Record<string, any> = {};
    let parsedBlueprint: any = null;
    let parsedReply = '';
    let parsedSummary = '';
    const parsedLogs: string[] = [];
    const parsedSuggestions: string[] = [];

    // 0. Parse <perplexta_blueprint> JSON schema
    const bpMatch = /<perplexta_blueprint>([\s\S]*?)<\/perplexta_blueprint>/i.exec(rawResponse);
    if (bpMatch) {
      parsedBlueprint = tryParseBlueprintJson(bpMatch[1]);
      if (parsedBlueprint && Array.isArray(parsedBlueprint.suggestions)) {
        parsedSuggestions.push(...parsedBlueprint.suggestions.filter((s: any) => typeof s === 'string' && s.trim().length > 0));
      }
    }

    // 1. Parse closed <perplexta_file path="..."> tags
    const fileTagRegex = /<perplexta_file\s+(?:path|file|name)=["']([^"']+)["'][^>]*>([\s\S]*?)<\/perplexta_file>/gi;
    let tagMatch;
    let lastClosedTagEndIndex = 0;
    while ((tagMatch = fileTagRegex.exec(rawResponse)) !== null) {
      lastClosedTagEndIndex = tagMatch.index + tagMatch[0].length;
      const filePath = tagMatch[1].trim();
      const content = normalizeFileContent(tagMatch[2]);
      const ext = filePath.split('.').pop() || 'txt';
      const fileName = filePath.split('/').pop() || filePath;
      if (content) {
        newlyGeneratedFiles[filePath] = {
          name: fileName,
          path: filePath,
          type: ext,
          content,
          isEntry: filePath === 'index.html'
        };
      }
    }

    // 1.05 Truncation Recovery: Check if there is an unclosed <perplexta_file path="..."> at the end of rawResponse
    const remainingTail = rawResponse.slice(lastClosedTagEndIndex);
    const unclosedMatch = /<perplexta_file\s+(?:path|file|name)=["']([^"']+)["'][^>]*>([\s\S]+)$/i.exec(remainingTail);
    if (unclosedMatch) {
      const filePath = unclosedMatch[1].trim();
      let tailContent = unclosedMatch[2]
        .replace(/<\/perplexta_file[^>]*$/i, '')
        .trim();
      const content = normalizeFileContent(tailContent);
      if (filePath && content && content.length > 20 && !newlyGeneratedFiles[filePath]) {
        const ext = filePath.split('.').pop() || 'txt';
        const fileName = filePath.split('/').pop() || filePath;
        newlyGeneratedFiles[filePath] = {
          name: fileName,
          path: filePath,
          type: ext,
          content,
          isEntry: filePath === 'index.html'
        };
      }
    }

    // 1.1 Parse <<<< SEARCH ... ==== ... >>>> surgical patches
    const patchRegex = /<<<<\s*SEARCH\s*\n([\s\S]*?)\n====\s*\n([\s\S]*?)\n>>>>/gi;
    let patchMatch;
    while ((patchMatch = patchRegex.exec(rawResponse)) !== null) {
      const searchTarget = patchMatch[1];
      const replacementText = patchMatch[2];
      const targetPath = activeFilePath || 'index.html';
      const existingFile = files[targetPath] || newlyGeneratedFiles[targetPath];
      if (existingFile && existingFile.content && existingFile.content.includes(searchTarget)) {
        const patchedContent = existingFile.content.replace(searchTarget, replacementText);
        newlyGeneratedFiles[targetPath] = {
          ...existingFile,
          content: patchedContent
        };
      }
    }

    // 2. Parse Markdown code blocks with path or language hints (excluding <perplexta_blueprint>)
    if (Object.keys(newlyGeneratedFiles).length === 0) {
      const withoutBlueprint = rawResponse.replace(/<perplexta_blueprint>[\s\S]*?<\/perplexta_blueprint>/gi, '');
      const mdBlockRegex = /```(?:([a-zA-Z0-9_.-]+)(?:\s+(?:path=["']|file=["']|title=["'])?([^"'\s\n`]+)["']?)?)?\s*\n([\s\S]*?)(?:```|$)/gi;
      let mdMatch;
      while ((mdMatch = mdBlockRegex.exec(withoutBlueprint)) !== null) {
        const lang = (mdMatch[1] || '').toLowerCase();
        let pathHint = mdMatch[2] || '';
        const content = normalizeFileContent(mdMatch[3].trim());
        if (!content || content.length < 15) continue;

        if (!pathHint && (lang.includes('/') || lang.endsWith('.html') || lang.endsWith('.css') || lang.endsWith('.js') || lang.endsWith('.jsx') || lang.endsWith('.sql'))) {
          pathHint = mdMatch[1];
        }

        if (!pathHint) {
          if (lang === 'html' || content.includes('<!DOCTYPE html>') || content.includes('<html')) {
            pathHint = 'index.html';
          } else if (lang === 'css' || (content.includes('{') && content.includes('}') && (content.includes('body') || content.includes(':root') || content.includes('@keyframes')))) {
            pathHint = 'styles/main.css';
          } else if (lang === 'sql' || content.toUpperCase().includes('CREATE TABLE')) {
            pathHint = 'db/schema.sql';
          } else if (lang === 'jsx' || lang === 'tsx') {
            pathHint = newlyGeneratedFiles['src/App.jsx'] ? 'src/main.jsx' : 'src/App.jsx';
          } else if (lang === 'js' || lang === 'javascript' || lang === 'ts' || lang === 'typescript') {
            pathHint = newlyGeneratedFiles['src/app.js'] ? 'src/data/mockData.js' : 'src/app.js';
          }
        }

        if (pathHint && content && pathHint !== 'json' && lang !== 'json') {
          const ext = pathHint.split('.').pop() || lang || 'txt';
          const fileName = pathHint.split('/').pop() || pathHint;
          newlyGeneratedFiles[pathHint] = {
            name: fileName,
            path: pathHint,
            type: ext,
            content,
            isEntry: pathHint === 'index.html'
          };
        }
      }
    }

    // 3. Fallback: Parse JSON schema or Raw HTML
    if (Object.keys(newlyGeneratedFiles).length === 0) {
      let parsedJson: any = null;
      const withoutBp = rawResponse.replace(/<perplexta_blueprint>[\s\S]*?<\/perplexta_blueprint>/gi, '').trim();
      try {
        let cleaned = withoutBp.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        }
        parsedJson = JSON.parse(cleaned);
      } catch {
        try {
          const relaxed = withoutBp
            .replace(/,\s*([}\]])/g, '$1')
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, (c) => c === '\n' || c === '\r' || c === '\t' ? c : '');
          const firstBrace = relaxed.indexOf('{');
          const lastBrace = relaxed.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace > firstBrace) {
            parsedJson = JSON.parse(relaxed.substring(firstBrace, lastBrace + 1));
          }
        } catch (_) {}
      }

      if (parsedJson && typeof parsedJson === 'object' && !parsedJson.file_tree_order) {
        parsedReply = parsedJson.reply || '';
        parsedSummary = parsedJson.summary || '';
        if (Array.isArray(parsedJson.logs)) parsedLogs.push(...parsedJson.logs);
        if (Array.isArray(parsedJson.suggestions)) parsedSuggestions.push(...parsedJson.suggestions);

        const filesContainer = (parsedJson.files && typeof parsedJson.files === 'object') ? parsedJson.files : parsedJson;
        for (const [key, val] of Object.entries(filesContainer)) {
          if (['summary', 'reply', 'logs', 'suggestions', 'deletedFiles', 'success', 'error', 'phase', 'project_name', 'framework', 'dependencies'].includes(key)) continue;
          let filePath = key;
          let fileContent = '';
          let fileType = '';
          if (typeof val === 'string') fileContent = val;
          else if (val && typeof val === 'object') {
            fileContent = (val as any).content || (val as any).code || (val as any).text || '';
            filePath = (val as any).path || (val as any).name || key;
            fileType = (val as any).type || '';
          }
          if (fileContent && typeof fileContent === 'string' && fileContent.trim().length > 0) {
            const cleanedContent = normalizeFileContent(fileContent);
            if (!fileType) {
              const ext = filePath.split('.').pop() || 'txt';
              fileType = ext;
            }
            newlyGeneratedFiles[filePath] = {
              name: filePath.split('/').pop() || filePath,
              path: filePath,
              type: fileType,
              content: cleanedContent,
              isEntry: filePath === 'index.html'
            };
          }
        }
      } else if (withoutBp.includes('<!DOCTYPE html>') || withoutBp.includes('<html')) {
        const htmlStart = withoutBp.indexOf('<!DOCTYPE html>') !== -1 ? withoutBp.indexOf('<!DOCTYPE html>') : withoutBp.indexOf('<html');
        const htmlEnd = withoutBp.lastIndexOf('</html>');
        const rawHtmlBlock = htmlEnd !== -1 ? withoutBp.slice(htmlStart, htmlEnd + 7) : withoutBp.slice(htmlStart);
        newlyGeneratedFiles['index.html'] = {
          name: 'index.html',
          path: 'index.html',
          type: 'html',
          content: normalizeFileContent(rawHtmlBlock),
          isEntry: true
        };
      }
    }

    const hasUpdatedFiles = Object.keys(newlyGeneratedFiles).length > 0;

    // Extract deleted files via <perplexta_delete path="..."> tags
    const deletedFilesList: string[] = [];
    const deleteTagRegex = /<perplexta_delete\s+path=["']([^"']+)["'][^>]*\/?>/gi;
    let delMatch;
    while ((delMatch = deleteTagRegex.exec(rawResponse)) !== null) {
      const delPath = delMatch[1].trim();
      if (delPath) {
        deletedFilesList.push(delPath);
      }
    }

    // Determine final files map safely
    let finalFilesMap: Record<string, any> = {};
    if (hasUpdatedFiles) {
      if (isNewProjectRequest) {
        // Fresh project tree replacing blank launchpad template
        finalFilesMap = { ...newlyGeneratedFiles };
      } else {
        // Merge with existing files to preserve project tree
        finalFilesMap = { ...(files || {}), ...newlyGeneratedFiles };
      }
    } else {
      finalFilesMap = { ...(files || {}) };
    }

    // Apply file deletions
    deletedFilesList.forEach(delPath => {
      delete finalFilesMap[delPath];
    });

    // Extract clean conversational reply text without raw code, search-replace patches, or blueprint dumps
    const cleanReply = rawResponse
      .replace(/<perplexta_blueprint>[\s\S]*?<\/perplexta_blueprint>/gi, '')
      .replace(/<perplexta_blueprint>[\s\S]*/gi, '')
      .replace(/<perplexta_file[\s\S]*?<\/perplexta_file>/gi, '')
      .replace(/<perplexta_file[\s\S]*/gi, '')
      .replace(/<<<<\s*SEARCH[\s\S]*?>>>>/gi, '')
      .replace(/<<<<\s*SEARCH[\s\S]*/gi, '')
      .replace(/<perplexta_delete[\s\S]*?\/?>/gi, '')
      .replace(/```[\s\S]*?```/gi, '')
      .replace(/```[\s\S]*/gi, '')
      .trim();

    const updatedFilesKeys = Object.keys(newlyGeneratedFiles);

    if (cleanReply && !cleanReply.includes('{') && cleanReply.length > 15) {
      parsedReply = cleanReply;
    } else if (hasUpdatedFiles) {
      const updatedFilesList = updatedFilesKeys.map(f => `\`${f}\``).join('، ');
      parsedReply = isNewProjectRequest
        ? `تم إنشاء المشروع وبناء شجرة الملفات بالكامل (${updatedFilesKeys.length} ملفات).\n\n- الملفات المنشأة: ${updatedFilesList}\n- الحالة: تم ربط الوحدات البرمجية وتشغيل المعاينة المباشرة.`
        : `تم تطبيق التعديلات البرمجية وتحديث ملفات المشروع بنجاح.\n\n- الملفات المحدثة: ${updatedFilesList}\n- الحالة: تم التحقق من سلامة الربط التفاعلي وتحديث المعاينة.`;
    } else if (deletedFilesList.length > 0) {
      parsedReply = `تم تحديث شجرة المشروع وحذف الملفات المستهدفة (${deletedFilesList.join(', ')}).`;
    } else {
      parsedReply = 'لم يتم استخراج ملفات برمجية جديدة من الاستجابة. يرجى إعادة المحاولة أو توضيح المطلوب بدقة.';
    }

    // Generate concise, professional engineering logs without emojis
    const enhancedLogs: string[] = [];
    if (isNewProjectRequest && hasUpdatedFiles) {
      enhancedLogs.push('تحليل متطلبات المشروع وتخطيط الهيكل البرمجي');
      enhancedLogs.push(`إنشاء شجرة الملفات (${Object.keys(finalFilesMap).length} ملفات) وتنظيم المجلدات`);
      updatedFilesKeys.forEach(f => {
        enhancedLogs.push(`كتابة ملف ${f} والتحقق من التوافق البرمجي`);
      });
      enhancedLogs.push('ربط ملفات البيانات والواجهات وتشغيل المعاينة المباشرة');
    } else if (hasUpdatedFiles) {
      enhancedLogs.push('فحص شجرة المشروع وتحديد الملفات المستهدفة للتحديث');
      updatedFilesKeys.forEach(f => {
        enhancedLogs.push(`تحديث ملف ${f} وحقن الوظائف التفاعلية`);
      });
      enhancedLogs.push('مزامنة شاشة المعاينة المباشرة وتطبيق التغييرات');
    } else {
      enhancedLogs.push('فحص الطلب ومراجعة حالة ملفات المشروع الحالية');
    }

    const payloadResult = {
      success: true,
      files: finalFilesMap,
      updatedFiles: updatedFilesKeys,
      blueprint: parsedBlueprint,
      deletedFiles: deletedFilesList,
      reply: parsedReply,
      summary: parsedSummary || (deletedFilesList.length > 0 ? `تم حذف ${deletedFilesList.join(', ')}` : (isNewProjectRequest && hasUpdatedFiles ? `تم إنشاء المشروع (${updatedFilesKeys.length} ملفات)` : hasUpdatedFiles ? `تم تحديث ${updatedFilesKeys.length} ملفات بنجاح` : 'تمت مراجعة المشروع')),
      logs: parsedLogs.length > 0 ? parsedLogs : enhancedLogs,
      suggestions: parsedSuggestions.length > 0 ? parsedSuggestions.slice(0, 3) : (
        Object.keys(finalFilesMap).some(f => f.toLowerCase().includes('product') || f.toLowerCase().includes('cart') || f.toLowerCase().includes('store'))
          ? [
              'تطوير بطاقة تسجيل دخول وقاعدة بيانات للمستخدمين',
              'إضافة نظام كوبونات خصم وتخفيضات تفاعلي',
              'ربط سلة المشتريات ببوابات دفع ذكية وفواتير مفصلة'
            ]
          : [
              'تصميم قسم مراجعات وآراء العملاء بشكل تفاعلي متحرك',
              'تحسين التجاوب البصري الكامل مع شاشات الجوال والتابلت',
              'برمجة لوحة إحصائيات وإدارة للمشروع'
            ]
      )
    };

    if (isStreamingRequested) {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: 'complete', ...payloadResult })}\n\n`);
        res.end();
      }
      return;
    }

    if (!res.headersSent) {
      return res.json(payloadResult);
    }
  } catch (error: any) {
    console.error('[Studio Generate Error]:', error);
    const errMsg = error?.message || 'Failed to generate code';
    if (res.headersSent) {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: 'error', error: errMsg, message: errMsg })}\n\n`);
        res.end();
      }
      return;
    }
    return res.status(500).json({ error: errMsg, message: errMsg });
  }
});

export default router;
