import { CanvasElement } from '../components/chat/artifacts/ArtifactImageEditor';
import { RataqRepoTemplate, TemplateObject } from '../data/templates';
import { lookupStaticAsset } from './staticAssetMap';

const loadedFontsCache = new Set<string>();

/**
 * Dynamically ensures font file is registered in document.fonts before drawing text
 */
export async function ensureCustomFontLoaded(fontFamily?: string): Promise<boolean> {
  if (!fontFamily || ['sans-serif', 'Arial', 'Tahoma', 'Verdana', 'Times New Roman', 'serif', 'Tajawal', 'Cairo', 'Alexandria', 'Almarai'].some(f => fontFamily.includes(f))) {
    return true;
  }
  if (loadedFontsCache.has(fontFamily)) {
    return true;
  }
  loadedFontsCache.add(fontFamily);

  try {
    if (typeof document !== 'undefined' && document.fonts?.check?.(`12px "${fontFamily}"`)) {
      return true;
    }
    if (typeof document === 'undefined' || typeof FontFace === 'undefined') {
      return true;
    }
    const fontNamesToTry = [
      `/fonts/${fontFamily}.ttf`,
      `/fonts/${fontFamily}.woff2`
    ];
    for (const fontUrl of fontNamesToTry) {
      try {
        const font = new FontFace(fontFamily, `url("${fontUrl}")`);
        const loaded = await font.load();
        if (document.fonts?.add) {
          document.fonts.add(loaded);
        }
        return true;
      } catch (err) {
        // Continue trying
      }
    }
  } catch (err) {
    console.warn(`Font load attempt failed for ${fontFamily}`, err);
  }
  return false;
}

const ASSET_NATURAL_DIMS: Record<string, { w: number; h: number }> = {
  "/templates/girl_gym.jpg": { w: 1365, h: 2048 },
  "/templates/easy_salada_recipes.jpeg": { w: 1080, h: 1620 },
  "/templates/learn_basic_analysis.PNG": { w: 486, h: 725 },
  "/templates/easy_diet.jpg": { w: 1440, h: 1920 },
  "/templates/cardio_exercice.png": { w: 900, h: 675 },
  "/templates/bitcoins.png": { w: 1193, h: 1591 },
  "/templates/bitcoin.png": { w: 512, h: 512 },
  "/templates/red_background.jpg": { w: 2500, h: 1667 },
  "/templates/girl_yellow.jpg": { w: 217, h: 300 },
  "/templates/snoopy_beagle_dog.jpg": { w: 1200, h: 630 },
  "/templates/frame_orange.jpg": { w: 250, h: 334 },
  "/templates/dress_girl.jpg": { w: 512, h: 768 },
  "/templates/boy_occulos.jpeg": { w: 1600, h: 2133 },
  "/templates/girl_sleep.jpg": { w: 800, h: 1200 },
  "/templates/girl_money.jpeg": { w: 1200, h: 1800 },
  "/templates/girl_umbrella.jpg": { w: 1200, h: 1900 },
  "/templates/thunder-yellow.png": { w: 512, h: 512 },
  "/templates/girls_on_the_stairs.jpg": { w: 333, h: 500 },
  "/templates/girl_seat.jpg": { w: 107, h: 160 },
  "/templates/girl_gym2.jpg": { w: 1080, h: 1080 },
  "/templates/girl_up_ball.jpg": { w: 600, h: 900 },
  "/templates/pato-de-borracha.png": { w: 512, h: 512 },
  "/templates/skateboarding-stance-hd-sports.jpg": { w: 800, h: 1200 },
  "/templates/girl_cordon.jpg": { w: 800, h: 1200 },
  "/templates/girl_model.jpg": { w: 1365, h: 2048 },
  "/templates/men_model.jpg": { w: 300, h: 450 },
  "/templates/girl_model2.jpg": { w: 800, h: 1200 },
  "/templates/waffler_table.jpg": { w: 1000, h: 1400 },
  "/templates/control.jpg": { w: 1200, h: 800 },
  "/templates/united_state.jpg": { w: 1062, h: 708 },
  "/templates/united_state.svg": { w: 1062, h: 708 },
  "/templates/bussola.png": { w: 512, h: 512 },
  "/templates/binoculars.png": { w: 698, h: 543 },
  "/templates/flower-material.png": { w: 1980, h: 1837 },
  "/templates/men-walk.png": { w: 341, h: 512 },
  "/templates/global.png": { w: 512, h: 512 }
};

export function createSolidColorBackground(color?: string | null, width = 1080, height = 1080): string {
  const safeColor = color || '#1e293b';
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${encodeURIComponent(safeColor)}"/></svg>`;
}

export function normalizeTemplateImageSrc(src?: string): string {
  if (!src || typeof src !== 'string') return '';
  const trimmed = src.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  const mapped = lookupStaticAsset(trimmed);
  if (mapped) return mapped;

  if (trimmed.startsWith('/')) {
    return trimmed;
  }
  if (trimmed.startsWith('templates/')) {
    return '/' + trimmed;
  }
  return '/templates/' + trimmed;
}

/**
 * Converts a RataqRepoTemplate JSON object into an array of native CanvasElements 
 * for full compatibility with Rataq Sovereign Studio's multi-page canvas system.
 */
export function convertRataqTemplateToCanvasElements(template: RataqRepoTemplate): {
  elements: CanvasElement[];
  width: number;
  height: number;
  backgroundColor: string;
  canvasBackground: string;
  previewUrl: string;
} {
  const width = template.width || 1080;
  const height = template.height || 1080;
  const backgroundColor = template.backgroundColor || '#ffffff';
  const previewUrl = template.filename ? (lookupStaticAsset(template.filename) || `/templates/data/${template.filename}`) : '';
  const rawBg = template.backgroundImage 
    ? template.backgroundImage 
    : (template.backgroundColor || '#ffffff');
  const canvasBackground = (typeof rawBg === 'string' && !rawBg.startsWith('#') && !rawBg.startsWith('rgb') && !rawBg.startsWith('hsl'))
    ? normalizeTemplateImageSrc(rawBg)
    : rawBg;

  const elements: CanvasElement[] = (template.objects || []).map((obj: TemplateObject, idx: number) => {
    const id = `el-${template.id}-${idx}-${Date.now()}`;
    const name = obj.text ? `نص: ${obj.text.slice(0, 15)}` : `عنصر ${obj.type.toUpperCase()}`;

    // Standard positioning
    const x = Math.round(obj.left || 0);
    const y = Math.round(obj.top || 0);
    const angle = obj.angle || 0;
    const opacity = obj.opacity ?? 1;

    if (obj.type === 'i-text' || obj.type === 'text') {
      ensureCustomFontLoaded(obj.fontFamily);
      const fontSize = Math.round((obj.fontSize || 36) * (obj.scaleY || 1));
      const textVal = obj.text || '';
      const lines = textVal.split('\n');
      const maxLineLen = Math.max(...lines.map(l => l.length), 1);
      const hasArabic = /[\u0600-\u06FF]/.test(textVal);
      
      const calcW = (obj as any).width ? Math.round((obj as any).width * (obj.scaleX || 1)) : (Math.ceil(maxLineLen * fontSize * 0.85) + 60);
      const calcH = (obj as any).height ? Math.round((obj as any).height * (obj.scaleY || 1)) : (Math.ceil(lines.length * fontSize * (hasArabic ? 1.4 : 1.3)) + 20);
      const resolvedAlign = obj.textAlign || (hasArabic ? 'center' : 'left');
      const resolvedWeight = obj.fontWeight || 'bold';

      return {
        id,
        type: 'text',
        name,
        x,
        y,
        w: Math.max(120, calcW),
        h: Math.max(36, calcH),
        text: textVal,
        color: obj.fill || '#ffffff',
        fontSize,
        fontFamily: obj.fontFamily || (hasArabic ? 'Tajawal, sans-serif' : 'sans-serif'),
        fontWeight: resolvedWeight,
        textAlign: resolvedAlign,
        textLineHeight: hasArabic ? 1.4 : 1.3,
        rotation: angle,
        opacity,
        strokeColor: obj.stroke || undefined,
        strokeWidth: obj.strokeWidth || 0,
        textShadow: false
      };
    } else if (obj.type === 'image') {
      const normalizedPath = normalizeTemplateImageSrc(obj.src);
      const cleanSrc = normalizedPath.split('?')[0];
      const baseDims = ASSET_NATURAL_DIMS[cleanSrc] || ASSET_NATURAL_DIMS['/' + cleanSrc];
      const jsonW = (obj as any).width || (obj as any).w;
      const jsonH = (obj as any).height || (obj as any).h;

      let baseW = 800;
      let baseH = 800;
      if (baseDims) {
        baseW = baseDims.w;
        baseH = baseDims.h;
      } else if (jsonW && jsonH) {
        baseW = jsonW;
        baseH = jsonH;
      }

      const w = Math.round(baseW * (obj.scaleX || 1));
      const h = Math.round(baseH * (obj.scaleY || 1));
      return {
        id,
        type: 'sticker',
        name: name || 'صورة القالب',
        x,
        y,
        w: Math.max(40, w),
        h: Math.max(40, h),
        src: normalizedPath,
        imgSrc: normalizedPath,
        rotation: angle,
        opacity,
        color: obj.fill || '#ffffff',
        strokeWidth: obj.strokeWidth || 0
      };
    } else if (obj.type === 'svg') {
      const baseW = (obj as any).width || (obj as any).w || 64;
      const baseH = (obj as any).height || (obj as any).h || 64;
      const w = Math.round(baseW * (obj.scaleX || 1));
      const h = Math.round(baseH * (obj.scaleY || 1));
      return {
        id,
        type: 'svg',
        name: 'شكل مجسم SVG',
        x,
        y,
        w: Math.max(16, w),
        h: Math.max(16, h),
        svgPath: (obj as any).path || (obj as any).svgPath || undefined,
        src: obj.src || '',
        imgSrc: obj.src || '',
        color: obj.fill || '#38bdf8',
        fillColor: obj.fill || 'transparent',
        strokeColor: obj.stroke || obj.fill || '#38bdf8',
        strokeWidth: obj.strokeWidth || 1,
        rotation: angle,
        opacity
      };
    }

    // Default fallback rect
    return {
      id,
      type: 'rect',
      name,
      x,
      y,
      w: 200,
      h: 200,
      color: '#38bdf8',
      fillColor: 'transparent',
      strokeWidth: 0,
      rotation: angle,
      opacity
    };
  });

  return {
    elements,
    width,
    height,
    backgroundColor,
    canvasBackground,
    previewUrl
  };
}

/**
 * Standard Fabric.js Template Loader Function as specified in user guidelines.
 * Loads objects directly onto a fabric.Canvas instance.
 */
export async function loadTemplate(canvas: any, template: RataqRepoTemplate) {
  if (!canvas) return;

  // 1. Clear current canvas
  canvas.clear();

  // 2. Set background color or background image
  if (template.backgroundColor) {
    canvas.backgroundColor = template.backgroundColor;
  }
  
  if (template.backgroundImage && (window as any).fabric) {
    const fabric = (window as any).fabric;
    const resolvedBg = normalizeTemplateImageSrc(template.backgroundImage);
    fabric.Image.fromURL(resolvedBg, (img: any) => {
      if (img) canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
    }, { crossOrigin: 'anonymous' });
  }

  // 3. Read each element and add it to canvas
  for (const obj of template.objects) {
    if ((window as any).fabric) {
      const fabric = (window as any).fabric;

      // a) Text (IText)
      if (obj.type === 'i-text' || obj.type === 'text') {
        if (obj.fontFamily) {
          await ensureCustomFontLoaded(obj.fontFamily);
        }
        const textObj = new fabric.IText(obj.text || '', {
          left: obj.left,
          top: obj.top,
          fontSize: obj.fontSize,
          fill: obj.fill,
          fontFamily: obj.fontFamily || 'sans-serif',
          angle: obj.angle || 0,
          opacity: obj.opacity ?? 1,
          stroke: obj.stroke,
          strokeWidth: obj.strokeWidth,
          backgroundColor: obj.backgroundColor
        });
        canvas.add(textObj);
      } 
      // b) Image
      else if (obj.type === 'image' && obj.src) {
        await new Promise<void>((resolve) => {
          const resolvedSrc = normalizeTemplateImageSrc(obj.src);
          fabric.Image.fromURL(resolvedSrc, (img: any) => {
            if (img) {
              img.set({
                left: obj.left,
                top: obj.top,
                scaleX: obj.scaleX || 1,
                scaleY: obj.scaleY || 1,
                angle: obj.angle || 0,
                opacity: obj.opacity ?? 1
              });
              canvas.add(img);
            }
            resolve();
          }, { crossOrigin: 'anonymous' });
        });
      }
      // c) Vector (SVG)
      else if (obj.type === 'svg' && obj.src) {
        await new Promise<void>((resolve) => {
          fabric.loadSVGFromURL(obj.src, (objects: any, options: any) => {
            if (objects && fabric.util) {
              const svgObj = fabric.util.groupSVGElements(objects, options);
              svgObj.set({
                left: obj.left,
                top: obj.top,
                scaleX: obj.scaleX || 1,
                scaleY: obj.scaleY || 1,
                angle: obj.angle || 0,
                fill: obj.fill
              });
              canvas.add(svgObj);
            }
            resolve();
          });
        });
      }
    }
  }

  // 4. Render canvas after loading completes
  if (canvas.renderAll) {
    canvas.renderAll();
  }
}
