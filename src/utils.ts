import { Card, RarityDefinition } from './types';
import { DEFAULT_RARITIES } from './data';

/**
 * Splits HTML content into multiple safe chunks according to page character limits.
 * It ensures that HTML tags are not broken or left unclosed.
 */
export function splitHTMLByLength(html: string, pageLimits: number[]): string[] {
  if (!html) return [''];
  
  const chunks: string[] = [];
  let currentChunkHtml = '';
  let currentChunkTextLength = 0;
  let openTags: string[] = [];
  
  let i = 0;
  const len = html.length;
  
  let limitIndex = 0;
  let currentLimit = pageLimits[limitIndex] || pageLimits[pageLimits.length - 1];

  while (i < len) {
    // Check if we are at an HTML tag
    if (html[i] === '<') {
      let tag = '';
      let isClosing = false;
      let isSelfClosing = false;
      
      // Read the tag
      while (i < len && html[i] !== '>') {
        tag += html[i];
        i++;
      }
      if (i < len) {
        tag += '>'; // add the closing '>'
        i++;
      }
      
      // Analyze the tag
      if (tag.startsWith('</')) {
        isClosing = true;
      } else if (tag.endsWith('/>') || /<br\s*\/?>/i.test(tag) || /<hr\s*\/?>/i.test(tag)) {
        isSelfClosing = true;
      }
      
      // Extract tag name
      let tagName = '';
      const match = tag.match(/<\/?([a-zA-Z0-9]+)/);
      if (match) {
        tagName = match[1].toLowerCase();
      }
      
      // Block-level elements that cause a vertical break (simulate newline height)
      const isBlockTag = ['div', 'p', 'li', 'tr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'blockquote'].includes(tagName);
      const isOpening = !isClosing && !isSelfClosing;

      if (isSelfClosing) {
        currentChunkHtml += tag;
        // <br> should count as a penalty to simulate height
        if (tagName === 'br') {
          currentChunkTextLength += 35;
        }
      } else if (isClosing) {
        currentChunkHtml += tag;
        // Pop the matching opening tag from openTags
        if (openTags.length > 0 && openTags[openTags.length - 1].toLowerCase() === tagName) {
          openTags.pop();
        }
      } else {
        // Opening tag
        currentChunkHtml += tag;
        if (tagName) {
          openTags.push(tagName);
        }
        // If opening a block element, add a penalty to simulate vertical height of a newline
        if (isOpening && isBlockTag) {
          currentChunkTextLength += 35;
        }
      }
      
      // Check split opportunity immediately after a tag, just in case a <br> or block tag penalty put us over the limit
      if (currentChunkTextLength >= currentLimit) {
        let closedTagsHtml = '';
        for (let t = openTags.length - 1; t >= 0; t--) {
          closedTagsHtml += `</${openTags[t]}>`;
        }
        
        chunks.push(currentChunkHtml + closedTagsHtml);
        
        let reopenedTagsHtml = '';
        for (let t = 0; t < openTags.length; t++) {
          reopenedTagsHtml += `<${openTags[t]}>`;
        }
        
        currentChunkHtml = reopenedTagsHtml;
        currentChunkTextLength = 0;
        limitIndex++;
        currentLimit = pageLimits[limitIndex] || pageLimits[pageLimits.length - 1];
      }
    } else {
      // Plain text character
      const char = html[i];
      currentChunkHtml += char;
      currentChunkTextLength++;
      i++;
      
      // Check if we reached/exceeded the limit and it's a good splitting point
      const isWordBoundary = /\s/.test(char) || char === '-' || char === ',' || char === '.';
      if (currentChunkTextLength >= currentLimit && (isWordBoundary || currentChunkTextLength >= currentLimit + 40)) {
        // Time to split!
        // 1. Close all currently open tags in reverse order
        let closedTagsHtml = '';
        for (let t = openTags.length - 1; t >= 0; t--) {
          closedTagsHtml += `</${openTags[t]}>`;
        }
        
        chunks.push(currentChunkHtml + closedTagsHtml);
        
        // 2. Start a new chunk, reopen all the open tags in forward order
        let reopenedTagsHtml = '';
        for (let t = 0; t < openTags.length; t++) {
          reopenedTagsHtml += `<${openTags[t]}>`;
        }
        
        currentChunkHtml = reopenedTagsHtml;
        currentChunkTextLength = 0;
        // Move to the next page limit
        limitIndex++;
        currentLimit = pageLimits[limitIndex] || pageLimits[pageLimits.length - 1];
      }
    }
  }
  
  // Add the last chunk if there's any content left
  if (currentChunkHtml.trim().length > 0) {
    // Close any unclosed tags
    let closedTagsHtml = '';
    for (let t = openTags.length - 1; t >= 0; t--) {
      closedTagsHtml += `</${openTags[t]}>`;
    }
    chunks.push(currentChunkHtml + closedTagsHtml);
  }
  
  // Filter out chunks that are practically empty (just closed/reopened tags and whitespace)
  const cleanedChunks = chunks.filter(c => {
    // A chunk is non-empty if it contains text or visual tags like br, img, hr, etc.
    const cleanText = c.replace(/<[^>]*>/g, '').trim();
    if (cleanText.length > 0) return true;
    
    // Check if it has empty tags that actually do something like <br>, <hr>
    return /<br\s*\/?>/i.test(c) || /<hr\s*\/?>/i.test(c) || /<img\s*[^>]*>/i.test(c);
  });
  
  return cleanedChunks.length > 0 ? cleanedChunks : [''];
}

/**
 * Tokenizes HTML into individual tags and words with trailing whitespaces.
 */
export function tokenizeHTML(html: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  const len = html.length;
  
  while (i < len) {
    if (html[i] === '<') {
      let tag = '';
      while (i < len && html[i] !== '>') {
        tag += html[i];
        i++;
      }
      if (i < len) {
        tag += '>';
        i++;
      }
      tokens.push(tag);
    } else {
      let text = '';
      // Read a word or sequence of non-tag characters
      while (i < len && html[i] !== '<') {
        text += html[i];
        if (/\s/.test(html[i])) {
          // stop after reading whitespace to keep words separate
          i++;
          break;
        }
        i++;
      }
      if (text) {
        tokens.push(text);
      }
    }
  }
  return tokens;
}

/**
 * Splits a card's content into pages based on whether text overflow is enabled
 * and the card's properties (illustration, stats block, subtitle, footer, etc.).
 * Uses a real DOM mirror of the card to calculate precise available heights and splitting.
 */
const PAGES_CACHE_LIMIT = 500;
const pagesCache = new Map<string, string[]>();

function getCacheKey(card: Card, rarities?: RarityDefinition[]): string {
  return JSON.stringify({
    id: card.id,
    content: card.content,
    enableTextOverflow: card.enableTextOverflow !== false,
    fullIllustration: !!card.fullIllustration,
    borderRadius: card.borderRadius,
    width: card.width,
    height: card.height,
    fontSize: card.fontSize,
    title: card.title,
    autoScaleTitle: card.autoScaleTitle,
    showIcon: card.showIcon,
    hideTitle: card.hideTitle,
    hideSubtitle: card.hideSubtitle,
    subtitle: card.subtitle,
    rarity: card.rarity,
    artUrl: card.artUrl,
    illustrationHeight: card.illustrationHeight,
    stats: card.stats,
    hideFooter: card.hideFooter,
    footerText: card.footerText,
    customFooterTextColor: card.customFooterTextColor,
    footerTextLeft: card.footerTextLeft,
    footerTextMiddle: card.footerTextMiddle,
    footerTextRight: card.footerTextRight,
    hideFooterLeft: card.hideFooterLeft,
    hideFooterMiddle: card.hideFooterMiddle,
    hideFooterRight: card.hideFooterRight,
    customFooterLeftColor: card.customFooterLeftColor,
    customFooterMiddleColor: card.customFooterMiddleColor,
    customFooterRightColor: card.customFooterRightColor,
    cardNumber: card.cardNumber,
    customCardNumberColor: card.customCardNumberColor,
    raritiesHash: rarities ? rarities.map(r => `${r.id}:${r.name}`).join(',') : ''
  });
}

function getTitleFontSize(title: string, showIcon: boolean = true) {
  const lines = title.split('\n');
  const maxLineLen = Math.max(...lines.map(l => l.length), 0);
  if (showIcon) {
    if (maxLineLen <= 14) return 'text-sm';
    if (maxLineLen <= 18) return 'text-xs';
    if (maxLineLen <= 24) return 'text-[11px]';
    if (maxLineLen <= 30) return 'text-[10px]';
    return 'text-[9px]';
  } else {
    if (maxLineLen <= 18) return 'text-sm';
    if (maxLineLen <= 23) return 'text-xs';
    if (maxLineLen <= 29) return 'text-[11px]';
    if (maxLineLen <= 35) return 'text-[10px]';
    return 'text-[9px]';
  }
}

function getStatValueFontSize(val: string) {
  const len = val.length;
  if (len <= 10) return 'text-[10px]';
  if (len <= 15) return 'text-[9px]';
  if (len <= 20) return 'text-[8px]';
  return 'text-[7px]';
}

function getSubtitleFontSize(subtitle: string) {
  const lines = subtitle.split('\n');
  const maxLineLen = Math.max(...lines.map(l => l.length), 0);
  if (maxLineLen <= 24) return 'text-[9px]';
  if (maxLineLen <= 34) return 'text-[8.5px]';
  return 'text-[8px]';
}

function getRarityLabel(rarityId?: string, rarities?: RarityDefinition[]): string {
  if (!rarityId || rarityId === 'none') return '';
  const list = rarities || DEFAULT_RARITIES;
  const found = list.find(r => r.id === rarityId);
  return found ? found.name.toUpperCase() : rarityId.toUpperCase();
}

function addToCache(key: string, value: string[]) {
  if (pagesCache.size >= PAGES_CACHE_LIMIT) {
    const firstKey = pagesCache.keys().next().value;
    if (firstKey !== undefined) {
      pagesCache.delete(firstKey);
    }
  }
  pagesCache.set(key, value);
}

export function getIllustrationHeight(card: Card): number {
  return card.illustrationHeight !== undefined ? card.illustrationHeight : 112;
}

export function isStatsOnSecondPage(card: Card, rarities?: RarityDefinition[]): boolean {
  if (!card.artUrl || !card.stats || card.stats.length === 0) return false;
  if (card.fullIllustration) {
    return card.enableTextOverflow !== false;
  }

  const cardH = card.height && card.height > 0 ? card.height : 88;
  const cardH_px = cardH * (96 / 25.4); // approx 332.6px for 88mm

  // Header height estimation
  const hasHeader = !card.hideTitle || card.showIcon !== false;
  const titleLines = (!card.hideTitle && card.title ? card.title.split('\n').length : 1);
  const headerHeight = hasHeader ? Math.max(32, 28 + (titleLines - 1) * 16) : 0;

  // Subtitle height estimation
  const hasSubtitle = !card.hideSubtitle || (card.rarity && card.rarity !== 'none');
  const subLines = (!card.hideSubtitle && card.subtitle ? card.subtitle.split('\n').length : 1);
  const subtitleHeight = hasSubtitle ? Math.max(22, 18 + (subLines - 1) * 14) : 0;

  // Illustration height
  const artHeight = getIllustrationHeight(card);

  // Stats height (each row of 2 stats is ~31px)
  const statRows = Math.ceil(card.stats.length / 2);
  const statsHeight = statRows * 31;

  // Footer height
  const showLeft = !card.hideFooterLeft;
  const showMiddle = !card.hideFooterMiddle && !!card.footerTextMiddle;
  const showRight = !card.hideFooterRight;
  const footerHeight = (showLeft || showMiddle || showRight) ? 22 : 0;

  // Available space for stats on page 1 (after outer 4px borders, header, subtitle, art, footer)
  const availableSpace = cardH_px - 4 - headerHeight - subtitleHeight - artHeight - footerHeight;

  // If available space is smaller than statsHeight + 6px, stats cannot fit on page 1
  return availableSpace < (statsHeight + 6);
}

export function shouldRenderCardStats(card: Card, pageIdx: number, rarities?: RarityDefinition[]): boolean {
  if (!card.stats || card.stats.length === 0) return false;
  if (card.fullIllustration) {
    if (card.enableTextOverflow === false) return false;
    return pageIdx === 1;
  }
  const onPage2 = isStatsOnSecondPage(card, rarities);
  if (onPage2) {
    return pageIdx === 1;
  }
  return pageIdx === 0;
}

interface OpenTagInfo {
  tagName: string;
  openingTagHtml: string;
}

export function getCardPages(card: Card, rarities?: RarityDefinition[]): string[] {
  if (card.fullIllustration) {
    if (card.enableTextOverflow === false) {
      return [''];
    }
  }

  const statsOnPage2 = isStatsOnSecondPage(card, rarities);
  if (!card.content && !statsOnPage2 && !card.fullIllustration) return [''];
  if (card.enableTextOverflow === false && !statsOnPage2 && !card.fullIllustration) {
    return [card.content || ''];
  }
  
  if (typeof document === 'undefined') {
    if (card.fullIllustration) {
      return ['', card.content || ''];
    }
    return statsOnPage2 ? [card.content || '', ''] : [card.content || ''];
  }

  const cacheKey = getCacheKey(card, rarities);
  const cached = pagesCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Create temporary hidden container for measurements
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.visibility = 'hidden';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '-1000';
  document.body.appendChild(container);

  const createCardMirror = (pageIdx: number, hasMultiplePages: boolean) => {
    const isFirstPage = pageIdx === 0;
    // Outer card container with exact dimensions and Tailwind classes
    const cardW = card.width && card.width > 0 ? card.width : 63;
    const cardH = card.height && card.height > 0 ? card.height : 88;
    const cardEl = document.createElement('div');
    cardEl.className = 'bg-white border-2 border-stone-950 flex flex-col overflow-hidden relative select-none font-body';
    cardEl.style.width = `${cardW}mm`;
    cardEl.style.height = `${cardH}mm`;
    cardEl.style.boxSizing = 'border-box';
    cardEl.style.borderRadius = card.borderRadius !== undefined ? `${card.borderRadius}px` : '3px';

    // Header Section
    const hasHeader = !card.hideTitle || card.showIcon !== false;
    if (hasHeader) {
      const headerEl = document.createElement('div');
      headerEl.className = 'px-2 py-1 flex items-center justify-between gap-1 border-b border-stone-950 shrink-0 text-white min-h-[32px] h-auto';
      
      const titleWrapper = document.createElement('div');
      titleWrapper.className = 'grow min-w-0 flex items-center';

      if (!card.hideTitle) {
        const titleEl = document.createElement('div');
        const titleFontSize = card.autoScaleTitle !== false ? getTitleFontSize(card.title || '', card.showIcon !== false) : 'text-sm';
        titleEl.className = `font-serif font-black tracking-tight leading-tight grow break-words whitespace-pre-wrap px-1 py-0.5 rounded ${titleFontSize}`;
        titleEl.textContent = card.title || '';
        titleWrapper.appendChild(titleEl);

        if (hasMultiplePages) {
          const pageBadge = document.createElement('span');
          pageBadge.className = 'text-[10px] opacity-75 font-mono ml-1 shrink-0 select-none';
          pageBadge.textContent = isFirstPage ? '(1/2)' : '(2/2)';
          titleWrapper.appendChild(pageBadge);
        }
      }
      headerEl.appendChild(titleWrapper);

      if (card.showIcon !== false) {
        const iconContainer = document.createElement('div');
        iconContainer.className = 'w-6 h-6 rounded bg-black/25 flex items-center justify-center shrink-0 border border-white/20';
        iconContainer.innerHTML = '<span>🛡️</span>';
        headerEl.appendChild(iconContainer);
      }
      cardEl.appendChild(headerEl);
    }

    // Subtitle / Subtype bar
    const hasSubtitle = !card.hideSubtitle || (card.rarity && card.rarity !== 'none');
    if (hasSubtitle) {
      const subtitleEl = document.createElement('div');
      subtitleEl.className = 'px-2 py-1 font-serif font-bold tracking-wide uppercase border-b border-stone-950 shrink-0 flex justify-between items-center gap-1.5 min-w-0 h-auto min-h-[22px]';
      
      const subSpan = document.createElement('span');
      const subtitleText = !card.hideSubtitle ? (card.subtitle || '') : '';
      const subtitleSizeClass = getSubtitleFontSize(subtitleText);
      
      subSpan.className = `${subtitleSizeClass} break-words whitespace-pre-wrap leading-tight grow min-w-0 px-1 py-0.5`;
      subSpan.textContent = subtitleText;
      subtitleEl.appendChild(subSpan);

      if (card.rarity && card.rarity !== 'none') {
        const badgeSpan = document.createElement('span');
        badgeSpan.className = 'text-[8px] px-1 py-0.5 rounded tracking-normal shrink-0 font-bold uppercase border border-black/10 shadow-sm';
        badgeSpan.textContent = getRarityLabel(card.rarity, rarities);
        subtitleEl.appendChild(badgeSpan);
      }
      cardEl.appendChild(subtitleEl);
    }

    // Illustration: Page 1 only
    if (card.artUrl && isFirstPage) {
      const imgEl = document.createElement('div');
      if (card.fullIllustration) {
        imgEl.className = 'w-full bg-stone-900 relative overflow-hidden flex-1';
      } else {
        const artHeight = getIllustrationHeight(card);
        imgEl.className = 'w-full bg-stone-900 relative overflow-hidden border-b border-stone-950 shrink-0';
        imgEl.style.height = `${artHeight}px`;
      }
      cardEl.appendChild(imgEl);

      if (card.fullIllustration) {
        return { cardEl, textEl: null as any };
      }
    }

    // Stats Grid: Render on appropriate page
    const renderStats = shouldRenderCardStats(card, pageIdx, rarities);
    if (renderStats && card.stats && card.stats.length > 0) {
      const statsEl = document.createElement('div');
      statsEl.className = 'grid grid-cols-2 border-b border-stone-950 shrink-0 divide-x divide-stone-200';
      card.stats.forEach(stat => {
        const statItem = document.createElement('div');
        statItem.className = 'flex flex-col justify-center px-1.5 py-0.5 leading-none min-w-0';
        
        const label = document.createElement('span');
        label.className = 'text-[7px] uppercase font-bold tracking-wider leading-none px-0.5 h-[12px]';
        label.textContent = stat.label || '';
        statItem.appendChild(label);
        
        const val = document.createElement('span');
        val.className = `font-mono font-bold tracking-tight leading-none px-0.5 h-[15px] ${getStatValueFontSize(stat.value || '—')}`;
        val.textContent = stat.value || '—';
        statItem.appendChild(val);
        
        statsEl.appendChild(statItem);
      });
      cardEl.appendChild(statsEl);
    }

    // Rich Description Block
    const descBlock = document.createElement('div');
    descBlock.className = 'flex-1 p-2.5 overflow-hidden flex flex-col justify-between';
    
    const innerWrapper = document.createElement('div');
    innerWrapper.className = 'flex-1 min-h-0 flex flex-col overflow-hidden';

    const editorWrapper = document.createElement('div');
    editorWrapper.className = 'relative flex-1 flex flex-col min-h-0';

    const textEl = document.createElement('div');
    textEl.className = 'rich-editor-preview pr-0.5 flex-1 min-h-0 break-words font-body leading-relaxed text-justify overflow-hidden rounded px-1 py-0.5 border border-transparent';
    textEl.style.fontSize = card.fontSize !== undefined ? `${card.fontSize}px` : '9px';
    textEl.style.outline = 'none';

    editorWrapper.appendChild(textEl);
    innerWrapper.appendChild(editorWrapper);
    descBlock.appendChild(innerWrapper);

    // Footer
    const leftText = card.footerTextLeft !== undefined && card.footerTextLeft !== '' 
      ? card.footerTextLeft 
      : (card.footerText !== undefined && card.footerText !== '' ? card.footerText : '• VITRUVIUM •');
    const middleText = card.footerTextMiddle !== undefined ? card.footerTextMiddle : '';
    const rightText = card.cardNumber !== undefined && card.cardNumber !== '' 
      ? card.cardNumber 
      : (card.footerTextRight !== undefined && card.footerTextRight !== '' ? card.footerTextRight : `#${card.id.slice(-4)}`);

    const showLeft = !card.hideFooterLeft;
    const showMiddle = !card.hideFooterMiddle && middleText !== '';
    const showRight = !card.hideFooterRight;

    const hasAnyFooter = showLeft || showMiddle || showRight;

    if (hasAnyFooter) {
      const footerEl = document.createElement('div');
      footerEl.className = 'grid grid-cols-3 w-full items-center mt-1 border-t border-stone-200 pt-1 shrink-0 text-[6px] font-mono select-none';
      
      const activeCount = (showLeft ? 1 : 0) + (showMiddle ? 1 : 0) + (showRight ? 1 : 0);

      let leftSpan = "col-span-1 text-left";
      let middleSpan = "col-span-1 text-center";
      let rightSpan = "col-span-1 text-right";

      if (activeCount === 1) {
        if (showLeft) leftSpan = "col-span-3 text-left";
        if (showMiddle) middleSpan = "col-span-3 text-center";
        if (showRight) rightSpan = "col-span-3 text-right";
      } else if (activeCount === 2) {
        if (showLeft && showRight) {
          leftSpan = "col-span-2 text-left";
          rightSpan = "col-span-1 text-right";
        } else if (showLeft && showMiddle) {
          leftSpan = "col-span-1 text-left";
          middleSpan = "col-span-2 text-center";
        } else if (showMiddle && showRight) {
          middleSpan = "col-span-2 text-center";
          rightSpan = "col-span-1 text-right";
        }
      }

      if (showLeft) {
        const footerL = document.createElement('span');
        footerL.className = `${leftSpan} truncate text-stone-400 uppercase`;
        footerL.textContent = leftText;
        footerEl.appendChild(footerL);
      }

      if (showMiddle) {
        const footerM = document.createElement('span');
        footerM.className = `${middleSpan} truncate text-stone-400 uppercase px-1`;
        footerM.textContent = middleText;
        footerEl.appendChild(footerM);
      }

      if (showRight) {
        const footerR = document.createElement('span');
        footerR.className = `${rightSpan} truncate text-stone-400 uppercase`;
        footerR.textContent = rightText;
        footerEl.appendChild(footerR);
      }

      descBlock.appendChild(footerEl);
    }

    cardEl.appendChild(descBlock);
    return { cardEl, textEl };
  };

  const tokens = tokenizeHTML(card.content || '');
  const pages: string[] = card.fullIllustration ? [''] : [];
  
  let currentTokenIdx = 0;
  let pageIdx = card.fullIllustration ? 1 : 0;
  let openTags: OpenTagInfo[] = [];

  // Helper to check if a specific token sequence fits into a measured textEl
  const checkTokenFit = (
    textEl: HTMLElement,
    maxHeight: number,
    startIdx: number,
    count: number,
    baseOpenTags: OpenTagInfo[]
  ) => {
    let reopenedHtml = '';
    for (const tag of baseOpenTags) {
      reopenedHtml += tag.openingTagHtml;
    }
    
    let tokensHtml = '';
    const pageOpenTags = [...baseOpenTags];

    for (let i = 0; i < count; i++) {
      const token = tokens[startIdx + i];
      if (token.startsWith('</')) {
        const tagName = token.match(/<\/?([a-zA-Z0-9]+)/)?.[1]?.toLowerCase();
        if (tagName && pageOpenTags.length > 0 && pageOpenTags[pageOpenTags.length - 1].tagName === tagName) {
          pageOpenTags.pop();
        }
      } else if (token.startsWith('<') && !token.endsWith('/>') && !/<br\s*\/?>/i.test(token) && !/<hr\s*\/?>/i.test(token)) {
        const tagName = token.match(/<([a-zA-Z0-9]+)/)?.[1]?.toLowerCase();
        if (tagName) {
          pageOpenTags.push({ tagName, openingTagHtml: token });
        }
      }
      tokensHtml += token;
    }

    let closedTagsHtml = '';
    for (let t = pageOpenTags.length - 1; t >= 0; t--) {
      closedTagsHtml += `</${pageOpenTags[t].tagName}>`;
    }

    const fullHtml = reopenedHtml + tokensHtml + closedTagsHtml;
    textEl.innerHTML = fullHtml;

    const cleanText = fullHtml.replace(/<[^>]*>/g, '').trim();
    const hasVisualElements = /<img\s*[^>]*>/i.test(fullHtml) || /<hr\s*\/?>/i.test(fullHtml) || /<br\s*\/?>/i.test(fullHtml);
    const hasContent = cleanText.length > 0 || hasVisualElements;

    // Strict fit check: content must not overflow the available height
    const fits = !hasContent || (textEl.scrollHeight <= maxHeight);

    return { fits, finalOpenTags: pageOpenTags, html: fullHtml };
  };

  // Step 1: Check if ALL content fits on a single card (without multi-page indicator) if stats are on page 1 and not full illustration
  if (!statsOnPage2 && !card.fullIllustration) {
    const singleMirror = createCardMirror(0, false);
    container.appendChild(singleMirror.cardEl);
    const singleMaxHeight = singleMirror.textEl.clientHeight;
    singleMirror.textEl.style.height = `${singleMaxHeight}px`;
    singleMirror.textEl.style.maxHeight = `${singleMaxHeight}px`;
    singleMirror.textEl.style.overflowY = 'auto';

    const singleFit = checkTokenFit(singleMirror.textEl, singleMaxHeight, 0, tokens.length, []);
    if (singleFit.fits) {
      container.removeChild(singleMirror.cardEl);
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
      const result = [card.content || ''];
      addToCache(cacheKey, result);
      return result;
    }
    container.removeChild(singleMirror.cardEl);
  }

  // Step 2: Content spans across multiple pages (or stats moved to page 2 or fullIllustration).
  // Iterate and partition page by page.
  while (currentTokenIdx < tokens.length || (statsOnPage2 && pageIdx < 2) || (card.fullIllustration && pageIdx < 2)) {
    const { cardEl, textEl } = createCardMirror(pageIdx, true);
    container.appendChild(cardEl);

    const maxHeight = textEl.clientHeight;
    textEl.style.height = `${maxHeight}px`;
    textEl.style.maxHeight = `${maxHeight}px`;
    textEl.style.overflowY = 'auto';

    const remainingTokens = tokens.length - currentTokenIdx;

    if (remainingTokens === 0) {
      pages.push('');
      container.removeChild(cardEl);
      pageIdx++;
      break;
    }

    // Fast check: do all remaining tokens fit on this page?
    const fullFit = checkTokenFit(textEl, maxHeight, currentTokenIdx, remainingTokens, openTags);
    if (fullFit.fits) {
      pages.push(fullFit.html);
      openTags = fullFit.finalOpenTags;
      currentTokenIdx = tokens.length;
      container.removeChild(cardEl);
      pageIdx++;
      break;
    }

    // Binary search for exact split point
    let low = 1;
    let high = remainingTokens - 1;
    let bestCount = 0;
    let bestResult: ReturnType<typeof checkTokenFit> | null = null;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const res = checkTokenFit(textEl, maxHeight, currentTokenIdx, mid, openTags);
      if (res.fits) {
        bestCount = mid;
        bestResult = res;
        low = mid + 1; // Try to fit more tokens
      } else {
        high = mid - 1; // Try to fit fewer tokens
      }
    }

    if (bestCount === 0) {
      // If no tokens fit on page 0 (e.g. huge image with tiny remaining space), push empty page on page 0
      if (pageIdx === 0 && statsOnPage2) {
        pages.push('');
      } else {
        // Force-add at least one token to prevent infinite loop on oversized elements
        const forceRes = checkTokenFit(textEl, maxHeight, currentTokenIdx, 1, openTags);
        pages.push(forceRes.html);
        openTags = forceRes.finalOpenTags;
        currentTokenIdx += 1;
      }
    } else if (bestResult) {
      pages.push(bestResult.html);
      openTags = bestResult.finalOpenTags;
      currentTokenIdx += bestCount;
    }

    // Advance past leading whitespace/newlines on the next page so it starts cleanly
    while (currentTokenIdx < tokens.length) {
      const nextToken = tokens[currentTokenIdx];
      if (nextToken === ' ' || nextToken === '\n' || nextToken === '\r' || nextToken === '\t') {
        currentTokenIdx++;
      } else {
        break;
      }
    }

    pageIdx++;
    container.removeChild(cardEl);
  }

  // Ensure if stats are on page 2 or fullIllustration, we have at least 2 pages
  if ((statsOnPage2 || card.fullIllustration) && pages.length < 2) {
    while (pages.length < 2) {
      pages.push('');
    }
  }

  // Clean up global container
  if (document.body.contains(container)) {
    document.body.removeChild(container);
  }
  
  const finalResult = pages.length > 0 ? pages : [''];
  addToCache(cacheKey, finalResult);
  return finalResult;
}


