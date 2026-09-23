/**
 * Utilities for extracting and dynamically colorizing SVG icons.
 * Allows custom uploaded SVG icons to adapt to the card's icon glyph color (customTitleColor).
 */

const svgColorCache = new Map<string, string>();

/**
 * Extracts raw SVG string from a data URL, base64 string, or raw SVG markup.
 */
export function extractSvgContent(dataUrlOrSvg: string): string | null {
  if (!dataUrlOrSvg || typeof dataUrlOrSvg !== 'string') return null;
  const trimmed = dataUrlOrSvg.trim();

  // If already raw SVG markup
  if (trimmed.startsWith('<svg') || trimmed.includes('<svg')) {
    const startIdx = trimmed.indexOf('<svg');
    const endIdx = trimmed.lastIndexOf('</svg>');
    if (startIdx !== -1 && endIdx !== -1) {
      return trimmed.substring(startIdx, endIdx + 6);
    }
    return trimmed;
  }

  // If SVG data URL (e.g. data:image/svg+xml;...)
  if (trimmed.startsWith('data:image/svg+xml')) {
    const commaIdx = trimmed.indexOf(',');
    if (commaIdx !== -1) {
      const meta = trimmed.substring(0, commaIdx).toLowerCase();
      const payload = trimmed.substring(commaIdx + 1);
      if (meta.includes('base64')) {
        try {
          return decodeURIComponent(escape(atob(payload)));
        } catch {
          try {
            return atob(payload);
          } catch (e) {
            console.warn('Failed to decode base64 SVG:', e);
          }
        }
      } else {
        try {
          return decodeURIComponent(payload);
        } catch {
          return payload;
        }
      }
    }
  }

  return null;
}

/**
 * Fallback regex-based colorizer if DOMParser is unavailable or encounters syntax error.
 */
function fallbackColorizeSvg(svgString: string, targetColor: string): string {
  return svgString
    .replace(/fill="(?!none|transparent|url)[^"]*"/gi, `fill="${targetColor}"`)
    .replace(/stroke="(?!none|transparent|url)[^"]*"/gi, `stroke="${targetColor}"`)
    .replace(/fill:\s*(?!none|transparent|url)[^;"]+/gi, `fill: ${targetColor}`)
    .replace(/stroke:\s*(?!none|transparent|url)[^;"]+/gi, `stroke: ${targetColor}`);
}

/**
 * Dynamically colorizes an SVG icon string to match the specified target color.
 * Works seamlessly with filled icons (game-icons.net, FontAwesome), outline icons (Lucide),
 * and handles background rectangles and inline styles.
 */
export function colorizeSvg(svgString: string, targetColor: string = '#ffffff'): string {
  if (!svgString) return '';
  const trimmed = svgString.trim();
  if (!trimmed) return '';

  const cacheKey = `${trimmed.length}_${trimmed.slice(0, 40)}_${trimmed.slice(-40)}_${targetColor}`;
  const cached = svgColorCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  if (typeof DOMParser === 'undefined') {
    const res = fallbackColorizeSvg(trimmed, targetColor);
    svgColorCache.set(cacheKey, res);
    return res;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(trimmed, 'image/svg+xml');
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      const res = fallbackColorizeSvg(trimmed, targetColor);
      svgColorCache.set(cacheKey, res);
      return res;
    }

    const svgEl = doc.querySelector('svg');
    if (!svgEl) {
      const res = fallbackColorizeSvg(trimmed, targetColor);
      svgColorCache.set(cacheKey, res);
      return res;
    }

    // Remove any harmful or unwanted tags
    const scripts = svgEl.querySelectorAll('script');
    scripts.forEach(s => s.remove());

    // Normalize viewBox if missing
    let viewBoxWidth = 0;
    let viewBoxHeight = 0;
    const existingViewBox = svgEl.getAttribute('viewBox');
    if (existingViewBox) {
      const parts = existingViewBox.trim().split(/[\s,]+/).map(p => parseFloat(p));
      if (parts.length === 4) {
        viewBoxWidth = parts[2];
        viewBoxHeight = parts[3];
      }
    } else {
      const width = parseFloat(svgEl.getAttribute('width') || '0');
      const height = parseFloat(svgEl.getAttribute('height') || '0');
      if (width > 0 && height > 0) {
        svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`);
        viewBoxWidth = width;
        viewBoxHeight = height;
      }
    }

    // Set width and height to 100% so it scales to container without distortion
    svgEl.setAttribute('width', '100%');
    svgEl.setAttribute('height', '100%');
    svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    // Check if original SVG was outline style (fill="none")
    const origRootFill = svgEl.getAttribute('fill')?.trim().toLowerCase();
    const isOutlineIcon = origRootFill === 'none';

    if (isOutlineIcon) {
      svgEl.setAttribute('fill', 'none');
      svgEl.setAttribute('stroke', targetColor);
    } else {
      svgEl.setAttribute('fill', targetColor);
    }
    svgEl.setAttribute('color', targetColor);

    // Process all child elements
    const elements = Array.from(svgEl.querySelectorAll('*'));

    // Check for full-canvas background rectangle (e.g. game-icons.net black background box)
    // If there are other graphical elements (paths, polygons, etc.), the background rect should be transparent
    const graphicalElements = elements.filter(el => {
      const tag = el.tagName.toLowerCase();
      return ['path', 'circle', 'ellipse', 'polygon', 'polyline', 'text', 'line'].includes(tag);
    });

    if (graphicalElements.length > 0) {
      elements.forEach(el => {
        if (el.tagName.toLowerCase() === 'rect') {
          const x = parseFloat(el.getAttribute('x') || '0');
          const y = parseFloat(el.getAttribute('y') || '0');
          const w = el.getAttribute('width');
          const h = el.getAttribute('height');
          const numW = parseFloat(w || '0');
          const numH = parseFloat(h || '0');

          const isFullW = w === '100%' || (viewBoxWidth > 0 && Math.abs(numW - viewBoxWidth) < 2);
          const isFullH = h === '100%' || (viewBoxHeight > 0 && Math.abs(numH - viewBoxHeight) < 2);

          if ((x === 0 || isNaN(x)) && (y === 0 || isNaN(y)) && isFullW && isFullH) {
            // Set background rect to transparent / none so only the actual icon glyph is drawn
            el.setAttribute('fill', 'none');
            el.setAttribute('stroke', 'none');
          }
        }
      });
    }

    elements.forEach(el => {
      const tag = el.tagName.toLowerCase();
      // Skip defs, masks, clippaths, gradients, filters
      if (['defs', 'clippath', 'mask', 'filter', 'lineargradient', 'radialgradient', 'pattern'].includes(tag)) {
        return;
      }

      // 1. Process fill attribute
      const fill = el.getAttribute('fill');
      if (fill !== null) {
        const trimmedFill = fill.trim().toLowerCase();
        if (trimmedFill === 'none' || trimmedFill === 'transparent') {
          // Keep none / transparent
        } else if (trimmedFill.startsWith('url(')) {
          // Keep gradient / pattern reference
        } else {
          el.setAttribute('fill', targetColor);
        }
      }

      // 2. Process stroke attribute
      const stroke = el.getAttribute('stroke');
      if (stroke !== null) {
        const trimmedStroke = stroke.trim().toLowerCase();
        if (trimmedStroke === 'none' || trimmedStroke === 'transparent') {
          // Keep none
        } else if (trimmedStroke.startsWith('url(')) {
          // Keep gradient / pattern reference
        } else {
          el.setAttribute('stroke', targetColor);
        }
      }

      // 3. Process inline style attribute
      const styleAttr = el.getAttribute('style');
      if (styleAttr) {
        let updatedStyle = styleAttr;
        updatedStyle = updatedStyle.replace(/fill\s*:\s*([^;!]+)(!important)?/gi, (match, val) => {
          const trimmedVal = val.trim().toLowerCase();
          if (trimmedVal === 'none' || trimmedVal === 'transparent' || trimmedVal.startsWith('url(')) {
            return match;
          }
          return `fill: ${targetColor}`;
        });
        updatedStyle = updatedStyle.replace(/stroke\s*:\s*([^;!]+)(!important)?/gi, (match, val) => {
          const trimmedVal = val.trim().toLowerCase();
          if (trimmedVal === 'none' || trimmedVal === 'transparent' || trimmedVal.startsWith('url(')) {
            return match;
          }
          return `stroke: ${targetColor}`;
        });
        el.setAttribute('style', updatedStyle);
      }
    });

    // 4. Process <style> tags inside the SVG
    const styleTags = svgEl.querySelectorAll('style');
    styleTags.forEach(styleTag => {
      if (styleTag.textContent) {
        styleTag.textContent = styleTag.textContent
          .replace(/fill\s*:\s*(?!none|transparent|url)[^;!}]+/gi, `fill: ${targetColor}`)
          .replace(/stroke\s*:\s*(?!none|transparent|url)[^;!}]+/gi, `stroke: ${targetColor}`);
      }
    });

    const serializer = new XMLSerializer();
    const result = serializer.serializeToString(svgEl);

    // Keep cache size bounded
    if (svgColorCache.size > 500) {
      svgColorCache.clear();
    }
    svgColorCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn('colorizeSvg error:', err);
    const res = fallbackColorizeSvg(trimmed, targetColor);
    svgColorCache.set(cacheKey, res);
    return res;
  }
}
