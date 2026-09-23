import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Icons from 'lucide-react';
import { Card, CardType, CardRarity, CardStat, TypeDefinition, RarityDefinition, ColorPreset, PresetColors, UserCustomIcon } from './types';
import { CARD_TYPES, STARTER_CARDS, DEFAULT_RARITIES, DEFAULT_COLOR_PRESETS, COLOR_ELEMENT_DEFINITIONS } from './data';
import { getCardPages, getIllustrationHeight, isStatsOnSecondPage, shouldRenderCardStats, getCardArtBgState } from './utils';
import { GoogleDriveAuthModal } from './components/GoogleDriveAuthModal';
import { GoogleDriveDecksModal } from './components/GoogleDriveDecksModal';
import { DriveUserProfile, DeckData, saveDeckToDrive } from './googleDrive';
import { AppSettingsModal } from './components/AppSettingsModal';
import { UploadCustomIconModal } from './components/UploadCustomIconModal';
import { DeleteCustomIconConfirmModal } from './components/DeleteCustomIconConfirmModal';
import { AppSettings, DEFAULT_APP_SETTINGS, UI_TRANSLATIONS, FUNNY_MESSAGES_I18N, EXPORT_STEPS_DECK_RU, EXPORT_STEPS_DECK_EN, EXPORT_STEPS_SINGLE_RU, EXPORT_STEPS_SINGLE_EN } from './i18n';
import { extractSvgContent, colorizeSvg } from './svgIconUtils';

const AVAILABLE_ICONS = [
  // Бой и защита
  'Sword', 'Swords', 'Shield', 'ShieldCheck', 'ShieldX', 'ShieldQuestion', 'ShieldAlert', 'PocketKnife', 'Axe', 'Hammer', 'Pickaxe', 'Target', 'Crosshair', 'Bomb',
  // Магия, эффекты и алхимия
  'Wand', 'Wand2', 'Sparkles', 'Sparkle', 'Flame', 'Zap', 'FlaskConical', 'FlaskRound', 'GlassWater', 'Brain', 'Infinity', 'Biohazard', 'HeartCrack', 'Lightbulb',
  // Существа и животные
  'Skull', 'Ghost', 'Bird', 'Cat', 'Dog', 'Rabbit', 'Fish', 'Snail', 'Bug', 'Turtle', 'Squirrel', 'Footprints', 'Bone',
  // Элементы и природа
  'Wind', 'Droplet', 'Mountain', 'Sun', 'Moon', 'MoonStar', 'CloudLightning', 'Snowflake', 'Tornado', 'Waves', 'CloudMoon', 'CloudSun',
  // Путешествия, приключения и снаряжение
  'Backpack', 'Tent', 'Bed', 'Compass', 'Map', 'MapPin', 'Key', 'KeyRound', 'Lock', 'Unlock', 'Anchor', 'Link', 'Lamp', 'Flag', 'Hourglass', 'Clock', 'Binoculars',
  // Книги, свитки и летописи
  'Scroll', 'BookOpen', 'Book', 'Notebook', 'PenTool', 'Feather', 'Library',
  // Сокровища и ценности
  'Gem', 'Crown', 'Trophy', 'Medal', 'Coins', 'Gift', 'Scale', 'Dices',
  // Еда и отдых
  'Beer', 'Wine', 'CupSoda', 'Soup', 'Apple', 'Drumstick',
  // Персонажи и общение
  'User', 'Users', 'Fingerprint', 'Eye', 'EyeOff', 'Bell', 'Music', 'Speech', 'MessageSquare', 'Search', 'Puzzle', 'Settings', 'Heart', 'Star', 'Activity', 'Package'
];

const ICON_CATEGORIES = [
  { id: 'fav', name: '★ Избранное' },
  { id: 'all', name: 'Все' },
  { id: 'custom', name: 'Пользовательские' },
  { id: 'weapon', name: 'Оружие' },
  { id: 'creature', name: 'Существа' },
  { id: 'magic', name: 'Магия' },
  { id: 'nature', name: 'Природа' },
  { id: 'gear', name: 'Снаряжение' },
  { id: 'treasure', name: 'Сокровища' },
  { id: 'other', name: 'Прочее' }
];

const getIconCategoryLabel = (catId: string, t: any): string => {
  switch (catId) {
    case 'fav': return t.iconCatFav;
    case 'all': return t.iconCatAll;
    case 'custom': return t.iconCatCustom;
    case 'weapon': return t.iconCatWeapon;
    case 'creature': return t.iconCatCreature;
    case 'magic': return t.iconCatMagic;
    case 'nature': return t.iconCatNature;
    case 'gear': return t.iconCatGear;
    case 'treasure': return t.iconCatTreasure;
    case 'other': return t.iconCatOther;
    default: return catId;
  }
};

const getIconCategory = (iconName: string): string => {
  const weapons = ['Sword', 'Swords', 'Shield', 'ShieldCheck', 'ShieldX', 'ShieldQuestion', 'ShieldAlert', 'PocketKnife', 'Axe', 'Hammer', 'Pickaxe', 'Target', 'Crosshair', 'Bomb'];
  const magic = ['Wand', 'Wand2', 'Sparkles', 'Sparkle', 'Flame', 'Zap', 'FlaskConical', 'FlaskRound', 'GlassWater', 'Brain', 'Infinity', 'Biohazard', 'HeartCrack', 'Lightbulb'];
  const creatures = ['Skull', 'Ghost', 'Bird', 'Cat', 'Dog', 'Rabbit', 'Fish', 'Snail', 'Bug', 'Turtle', 'Squirrel', 'Footprints', 'Bone'];
  const nature = ['Wind', 'Droplet', 'Mountain', 'Sun', 'Moon', 'MoonStar', 'CloudLightning', 'Snowflake', 'Tornado', 'Waves', 'CloudMoon', 'CloudSun'];
  const gear = ['Backpack', 'Tent', 'Bed', 'Compass', 'Map', 'MapPin', 'Key', 'KeyRound', 'Lock', 'Unlock', 'Anchor', 'Link', 'Lamp', 'Flag', 'Hourglass', 'Clock', 'Binoculars'];
  const treasure = ['Gem', 'Crown', 'Trophy', 'Medal', 'Coins', 'Gift', 'Scale', 'Dices'];
  
  if (weapons.includes(iconName)) return 'weapon';
  if (magic.includes(iconName)) return 'magic';
  if (creatures.includes(iconName)) return 'creature';
  if (nature.includes(iconName)) return 'nature';
  if (gear.includes(iconName)) return 'gear';
  if (treasure.includes(iconName)) return 'treasure';
  return 'other';
};

const ICON_COLOR_PRESETS = [
  { name: 'Белый', value: '#ffffff' },
  { name: 'Желтый', value: '#fbbf24' },
  { name: 'Красный', value: '#ef4444' },
  { name: 'Синий', value: '#3b82f6' },
  { name: 'Зеленый', value: '#10b981' },
  { name: 'Фиолетовый', value: '#a855f7' },
  { name: 'Черный', value: '#1c1917' },
];

const ICON_BG_PRESETS = [
  { name: 'Красный', value: '#7f1d1d' },
  { name: 'Оранжевый', value: '#7c2d12' },
  { name: 'Синий', value: '#1e3a8a' },
  { name: 'Бирюзовый', value: '#115e59' },
  { name: 'Зеленый', value: '#064e3b' },
  { name: 'Пурпурный', value: '#581c87' },
  { name: 'Розовый', value: '#9d174d' },
  { name: 'Каменный', value: '#292524' },
  { name: 'Серый', value: '#18181b' },
];

function groupCardsIntoPrintPages(items: any[]): { rows: { items: (any | null)[] }[] }[] {
  const PAGE_WIDTH = 190;
  const PAGE_HEIGHT = 277;
  const GAP_X = 2;
  const GAP_Y = 2;

  const pages: { rows: { items: (any | null)[] }[] }[] = [];
  let currentRows: { items: (any | null)[] }[] = [];
  let currentRowsHeight = 0;

  let currentRowItems: any[] = [];
  let currentRowWidth = 0;
  let currentRowMaxHeight = 0;

  const pushCurrentRow = () => {
    if (currentRowItems.length === 0) return;
    currentRows.push({ items: [...currentRowItems] });
    currentRowsHeight += (currentRows.length > 1 ? GAP_Y : 0) + currentRowMaxHeight;
    currentRowItems = [];
    currentRowWidth = 0;
    currentRowMaxHeight = 0;
  };

  const pushCurrentPage = () => {
    pushCurrentRow();
    if (currentRows.length > 0) {
      pages.push({ rows: currentRows });
      currentRows = [];
      currentRowsHeight = 0;
    }
  };

  for (const item of items) {
    const cardW = item.card.width && item.card.width > 0 ? item.card.width : 63;
    const cardH = item.card.height && item.card.height > 0 ? item.card.height : 88;

    const neededRowWidth = currentRowItems.length === 0
      ? cardW
      : currentRowWidth + GAP_X + cardW;

    if (neededRowWidth <= PAGE_WIDTH) {
      const newRowMaxHeight = Math.max(currentRowMaxHeight, cardH);
      const addedHeight = newRowMaxHeight - currentRowMaxHeight;
      const neededPageHeight = currentRowsHeight + (currentRows.length > 0 && currentRowItems.length === 0 ? GAP_Y : 0) + addedHeight + (currentRowItems.length === 0 ? cardH : 0);

      if (neededPageHeight <= PAGE_HEIGHT) {
        currentRowItems.push(item);
        currentRowWidth = neededRowWidth;
        currentRowMaxHeight = newRowMaxHeight;
        continue;
      }
    }

    pushCurrentRow();

    const neededPageHeightWithNewRow = currentRowsHeight + (currentRows.length > 0 ? GAP_Y : 0) + cardH;

    if (neededPageHeightWithNewRow <= PAGE_HEIGHT) {
      currentRowItems.push(item);
      currentRowWidth = cardW;
      currentRowMaxHeight = cardH;
    } else {
      pushCurrentPage();
      currentRowItems.push(item);
      currentRowWidth = cardW;
      currentRowMaxHeight = cardH;
    }
  }

  pushCurrentPage();
  return pages;
}

// Global ref so CardIcon can resolve custom icon definitions outside React component tree
const globalUserIconsRef: { current: UserCustomIcon[] } = { current: [] };

// Helper to render lucide icons dynamically or custom uploaded icons
function CardIcon({ name, className, size = 20, style }: { name: string; className?: string; size?: number; style?: React.CSSProperties }) {
  if (!name) {
    const Fallback = Icons.HelpCircle;
    return <Fallback className={className} size={size} style={style} />;
  }

  const targetColor = (style?.color as string) || '#ffffff';

  // Check if icon matches an uploaded user icon
  const matchedCustom = globalUserIconsRef.current.find(i => i.id === name || i.dataUrl === name);

  // Check if this icon has SVG content (from custom icon object or encoded in data URL or raw SVG markup)
  const svgText = matchedCustom?.svgContent || extractSvgContent(matchedCustom?.dataUrl || '') || extractSvgContent(name);

  if (svgText) {
    const colorized = colorizeSvg(svgText, targetColor);
    return (
      <span
        className={`inline-flex items-center justify-center select-none pointer-events-none shrink-0 ${className || ''}`}
        style={{
          width: size,
          height: size,
          minWidth: size,
          minHeight: size,
          maxWidth: size,
          maxHeight: size,
          lineHeight: 0,
          ...style,
          color: targetColor,
        }}
        dangerouslySetInnerHTML={{ __html: colorized }}
      />
    );
  }

  // If the icon is a raster base64 data URL or external URL (PNG, WEBP, JPG, GIF, etc.)
  if (name.startsWith('data:') || name.startsWith('http://') || name.startsWith('https://') || name.startsWith('blob:')) {
    return (
      <img
        src={name}
        alt="icon"
        className={`inline-block object-contain select-none pointer-events-none ${className || ''}`}
        style={{
          width: size,
          height: size,
          maxWidth: size,
          maxHeight: size,
          ...style
        }}
        referrerPolicy="no-referrer"
      />
    );
  }

  if (matchedCustom) {
    return (
      <img
        src={matchedCustom.dataUrl}
        alt={matchedCustom.name || 'icon'}
        className={`inline-block object-contain select-none pointer-events-none ${className || ''}`}
        style={{
          width: size,
          height: size,
          maxWidth: size,
          maxHeight: size,
          ...style
        }}
        referrerPolicy="no-referrer"
      />
    );
  }

  const IconComponent = (Icons as any)[name] || Icons.HelpCircle;
  return <IconComponent className={className} size={size} style={style} />;
}

// Helper to determine optimal font size for card title based on its length and icon presence
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

function getSubtitleFontSize(subtitle: string) {
  const lines = subtitle.split('\n');
  const maxLineLen = Math.max(...lines.map(l => l.length), 0);
  if (maxLineLen <= 24) return 'text-[9px]';
  if (maxLineLen <= 34) return 'text-[8.5px]';
  return 'text-[8px]';
}

function AutoResizeTextarea({
  value,
  onChange,
  className,
  style,
  placeholder,
  title,
  rows = 1,
  disabled = false,
  onKeyDown,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  title?: string;
  rows?: number;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={rows}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      disabled={disabled}
      placeholder={placeholder}
      title={title}
      className={className}
      style={style}
    />
  );
}

function getStatValueFontSize(val: string) {
  const len = val.length;
  if (len <= 10) return 'text-[10px]';
  if (len <= 15) return 'text-[9px]';
  if (len <= 20) return 'text-[8px]';
  return 'text-[7px]';
}

function getContentFontSize(htmlOrText: string) {
  return '';
}

function getContentAlignClass(align?: 'left' | 'center' | 'right' | 'justify') {
  switch (align) {
    case 'left':
      return 'text-left';
    case 'center':
      return 'text-center';
    case 'right':
      return 'text-right';
    case 'justify':
    default:
      return 'text-justify';
  }
}

function renderCardArtBackground(
  card: Card,
  opacity?: number,
  brightness?: number
) {
  if (!card.artUrl) return null;
  const op = (opacity !== undefined ? opacity : 100) / 100;
  const br = (brightness !== undefined ? brightness : 100) / 100;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <img
        src={card.artUrl}
        alt=""
        className="w-full h-full object-cover transition-transform"
        style={{
          transform: `translate(${(card.illustrationPositionX || 0)}px, ${(card.illustrationPositionY || 0)}px) scale(${(card.illustrationScale || 100) / 100}) rotate(${(card.illustrationRotation || 0)}deg)`,
          transformOrigin: 'center center',
          opacity: op,
          filter: `brightness(${br})`,
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        }}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
      />
    </div>
  );
}

export function getInlineIconHtml(iconName: string): string {
  if (!iconName) return '';

  const customList = globalUserIconsRef.current || [];
  const matchedCustom = customList.find(i => i.id === iconName || i.dataUrl === iconName);

  const svgText = matchedCustom?.svgContent || extractSvgContent(matchedCustom?.dataUrl || '') || extractSvgContent(iconName);

  if (svgText) {
    let colorized = colorizeSvg(svgText, 'currentColor');
    colorized = colorized
      .replace(/<svg\b([^>]*)>/i, (_match, attrs) => {
        const cleanAttrs = attrs
          .replace(/\bwidth="[^"]*"/gi, '')
          .replace(/\bheight="[^"]*"/gi, '')
          .replace(/\bstyle="[^"]*"/gi, '');
        return `<svg ${cleanAttrs} width="100%" height="100%" style="display:block;">`;
      });
    return `<span class="inline-card-icon inline-card-svg-icon" contenteditable="false" data-icon-name="${iconName}" style="display:inline-flex; align-items:center; justify-content:center; vertical-align:-0.15em; line-height:1; width:1.25em; height:1.25em; margin:0 0.15em; background:transparent; user-select:none;">${colorized}</span>`;
  }

  if (matchedCustom && !matchedCustom.svgContent && matchedCustom.dataUrl) {
    return `<span class="inline-card-icon" contenteditable="false" data-icon-name="${iconName}" style="display:inline-flex; align-items:center; justify-content:center; vertical-align:-0.15em; line-height:1; width:1.25em; height:1.25em; margin:0 0.15em; background:transparent; user-select:none;"><img src="${matchedCustom.dataUrl}" alt="${matchedCustom.name || 'icon'}" style="width:100%; height:100%; object-fit:contain; display:block;" /></span>`;
  }

  const IconComponent = (Icons as any)[iconName] || Icons.Sparkles;
  if (!IconComponent) return '';

  try {
    const vnode = typeof IconComponent.render === 'function' ? IconComponent.render({}, null) : null;
    let iconNodes = vnode?.props?.iconNode;
    if (!Array.isArray(iconNodes)) {
      const fallbackVnode = typeof (Icons.Sparkles as any).render === 'function' ? (Icons.Sparkles as any).render({}, null) : null;
      iconNodes = fallbackVnode?.props?.iconNode;
    }
    if (Array.isArray(iconNodes)) {
      const innerSvg = iconNodes.map(([tag, attrs]: [string, Record<string, any>]) => {
        const attrStr = Object.entries(attrs || {})
          .filter(([k]) => k !== 'key')
          .map(([k, v]) => `${k}="${v}"`)
          .join(' ');
        return `<${tag} ${attrStr}></${tag}>`;
      }).join('');
      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;">${innerSvg}</svg>`;
      return `<span class="inline-card-icon" contenteditable="false" data-icon-name="${iconName}" style="display:inline-flex; align-items:center; justify-content:center; vertical-align:-0.15em; line-height:1; width:1.25em; height:1.25em; margin:0 0.15em; background:transparent; user-select:none;">${svgString}</span>`;
    }
  } catch (e) {
    console.error('Failed to generate inline icon svg:', e);
  }
  return '';
}

export function formatInlineText(text: string | undefined | null): string {
  if (!text) return '';
  if (text.includes('inline-card-icon')) {
    return text.replace(/\[icon:([a-zA-Z0-9_.-]+)\]/gi, (_, iconName) => {
      return getInlineIconHtml(iconName);
    });
  }
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped.replace(/\[icon:([a-zA-Z0-9_.-]+)\]/gi, (_, iconName) => {
    return getInlineIconHtml(iconName);
  });
}

export function stringToInlineHtml(str: string | undefined | null): string {
  if (!str) return '';
  const escaped = str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped.replace(/\[icon:([a-zA-Z0-9_.-]+)\]/gi, (_, iconName) => {
    return getInlineIconHtml(iconName);
  });
}

export function domToInlineString(root: Node): string {
  let result = '';
  function traverse(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent || '';
      return;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.classList.contains('inline-card-icon') || el.dataset.iconName) {
        const iconName = el.dataset.iconName;
        if (iconName) {
          result += `[icon:${iconName}]`;
          return;
        }
      }
      if (el.tagName === 'BR') {
        return;
      }
      for (let i = 0; i < el.childNodes.length; i++) {
        traverse(el.childNodes[i]);
      }
    }
  }
  for (let i = 0; i < root.childNodes.length; i++) {
    traverse(root.childNodes[i]);
  }
  return result;
}

export function countNodeStringLength(node: Node): number {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent || '').length;
  }
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    if (el.classList.contains('inline-card-icon') || el.dataset.iconName) {
      return `[icon:${el.dataset.iconName || ''}]`.length;
    }
    let len = 0;
    for (let i = 0; i < node.childNodes.length; i++) {
      len += countNodeStringLength(node.childNodes[i]);
    }
    return len;
  }
  return 0;
}

export function getInlineCaretStringOffset(root: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !root.contains(sel.anchorNode)) {
    return -1;
  }
  const range = sel.getRangeAt(0);

  let offset = 0;
  let found = false;

  function traverse(node: Node): boolean {
    if (found) return true;

    if (node === range.startContainer) {
      if (node.nodeType === Node.TEXT_NODE) {
        offset += range.startOffset;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        for (let i = 0; i < range.startOffset && i < node.childNodes.length; i++) {
          offset += countNodeStringLength(node.childNodes[i]);
        }
      }
      found = true;
      return true;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      offset += (node.textContent || '').length;
      return false;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.classList.contains('inline-card-icon') || el.dataset.iconName) {
        offset += `[icon:${el.dataset.iconName || ''}]`.length;
        return false;
      }

      for (let i = 0; i < node.childNodes.length; i++) {
        if (traverse(node.childNodes[i])) return true;
      }
    }
    return false;
  }

  traverse(root);
  return found ? offset : -1;
}

export function insertIconIntoInlineElement(
  el: HTMLElement,
  iconName: string,
  onChange: (newVal: string) => void
) {
  const iconHtml = getInlineIconHtml(iconName);
  if (!iconHtml || !el) return;

  try {
    const saved = localStorage.getItem('vitruvius_recent_desc_icons');
    const prev = saved ? JSON.parse(saved) : [];
    const updated = [iconName, ...(Array.isArray(prev) ? prev.filter((x: string) => x !== iconName) : [])].slice(0, 10);
    localStorage.setItem('vitruvius_recent_desc_icons', JSON.stringify(updated));
  } catch (e) {}

  const sel = window.getSelection();
  const savedRange = (el as any).__savedRange as Range | undefined;
  const savedOffset = (el as any).__savedOffset as number | undefined;

  let range: Range | null = null;
  if (savedRange && el.contains(savedRange.commonAncestorContainer)) {
    range = savedRange;
  } else if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
    range = sel.getRangeAt(0);
  }

  if (range) {
    const container = document.createElement('div');
    container.innerHTML = iconHtml + '\u00A0';
    const frag = document.createDocumentFragment();
    let lastNode: Node | null = null;
    while (container.firstChild) {
      lastNode = container.firstChild;
      frag.appendChild(lastNode);
    }

    range.deleteContents();
    range.insertNode(frag);

    if (lastNode && sel) {
      const newRange = document.createRange();
      newRange.setStartAfter(lastNode);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
      (el as any).__savedRange = newRange.cloneRange();
      const newOff = getInlineCaretStringOffset(el);
      if (newOff >= 0) {
        (el as any).__savedOffset = newOff;
      }
    }

    (el as any).__isProgrammaticFocus = true;
    el.focus();
    setTimeout(() => {
      (el as any).__isProgrammaticFocus = false;
    }, 50);

    const newStr = domToInlineString(el);
    onChange(newStr);
    return;
  }

  // Fallback: If DOM Range was detached or element re-rendered, use saved character offset
  const curStr = domToInlineString(el);
  const tag = `[icon:${iconName}] `;
  if (savedOffset !== undefined && savedOffset >= 0 && savedOffset <= curStr.length) {
    const newStr = curStr.slice(0, savedOffset) + tag + curStr.slice(savedOffset);
    (el as any).__savedOffset = savedOffset + tag.length;
    onChange(newStr);
  } else {
    // If no marker was set, append to the END (not beginning)
    const newStr = curStr + (curStr.endsWith(' ') || curStr.length === 0 ? '' : ' ') + tag;
    (el as any).__savedOffset = newStr.length;
    onChange(newStr);
  }

  setTimeout(() => {
    (el as any).__isProgrammaticFocus = true;
    el.focus();
    setTimeout(() => {
      (el as any).__isProgrammaticFocus = false;
    }, 50);
  }, 10);
}

export interface InlineRichInputProps {
  id?: string;
  value?: string;
  onChange: (val: string) => void;
  placeholder?: string;
  placeholderClassName?: string;
  className?: string;
  wrapperClassName?: string;
  style?: React.CSSProperties;
  title?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
  disabled?: boolean;
  maxLength?: number;
}

export const InlineRichInput = React.forwardRef<HTMLDivElement, InlineRichInputProps>(({
  id,
  value = '',
  onChange,
  placeholder,
  placeholderClassName,
  className = '',
  wrapperClassName = '',
  style,
  title,
  onFocus,
  onBlur,
  onKeyDown,
  onClick,
  onPointerDown,
  onMouseDown,
  disabled = false,
  maxLength
}, ref) => {
  const localRef = useRef<HTMLDivElement | null>(null);
  const elementRef = (ref as React.RefObject<HTMLDivElement>) || localRef;
  const isFocusedRef = useRef(false);
  const [isFocused, setIsFocused] = useState(false);
  const lastEmittedValueRef = useRef(value);

  const saveSelection = () => {
    if (!elementRef.current) return;
    if ((elementRef.current as any).__isProgrammaticFocus) return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && elementRef.current.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      (elementRef.current as any).__savedRange = range.cloneRange();
      const offset = getInlineCaretStringOffset(elementRef.current);
      if (offset >= 0) {
        (elementRef.current as any).__savedOffset = offset;
      }
    }
  };

  useEffect(() => {
    lastEmittedValueRef.current = value;
    if (elementRef.current && !isFocusedRef.current) {
      const expectedHtml = stringToInlineHtml(value);
      if (elementRef.current.innerHTML !== expectedHtml) {
        elementRef.current.innerHTML = expectedHtml;
      }
    }
  }, [value, elementRef]);

  const handleInput = () => {
    if (!elementRef.current) return;
    saveSelection();
    const newStr = domToInlineString(elementRef.current);
    if (maxLength && newStr.length > maxLength) {
      elementRef.current.innerHTML = stringToInlineHtml(lastEmittedValueRef.current);
      return;
    }
    if (newStr !== lastEmittedValueRef.current) {
      lastEmittedValueRef.current = newStr;
      onChange(newStr);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      elementRef.current?.blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      elementRef.current?.blur();
    }
    onKeyDown?.(e);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain').replace(/[\r\n]+/g, ' ');
    if (!text) return;
    if (text.includes('[icon:')) {
      const html = stringToInlineHtml(text);
      document.execCommand('insertHTML', false, html);
    } else {
      document.execCommand('insertText', false, text);
    }
    handleInput();
  };

  const isEmpty = !value || value.trim() === '';

  return (
    <div className={`relative inline-flex items-center w-full min-w-0 ${wrapperClassName}`}>
      <div
        id={id}
        ref={elementRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="false"
        title={title}
        onFocus={() => {
          isFocusedRef.current = true;
          setIsFocused(true);
          onFocus?.();
        }}
        onBlur={() => {
          isFocusedRef.current = false;
          setIsFocused(false);
          saveSelection();
          onBlur?.();
        }}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onClick={(e) => {
          e.stopPropagation();
          saveSelection();
          onClick?.(e);
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onPointerDown?.(e);
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          onMouseDown?.(e);
        }}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        className={`outline-none cursor-text whitespace-nowrap overflow-x-hidden select-text ${className}`}
        style={style}
      />
      {isEmpty && !isFocused && placeholder && (
        <span
          className={`absolute inset-0 flex items-center pointer-events-none select-none truncate ${
            placeholderClassName || 'px-2 text-stone-400 dark:text-stone-500 opacity-60 text-inherit font-inherit'
          }`}
          style={{ pointerEvents: 'none' }}
        >
          {placeholder}
        </span>
      )}
    </div>
  );
});
InlineRichInput.displayName = 'InlineRichInput';

export function stripHtml(str?: string): string {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').replace(/\[icon:[^\]]+\]/gi, '');
}

interface InlineIconPickerMenuProps {
  onSelectIcon: (iconName: string) => void;
  onClose: () => void;
  triggerRef?: React.RefObject<any>;
  triggerEl?: HTMLElement | null;
  userCustomIcons?: UserCustomIcon[];
  t?: any;
  className?: string;
  style?: React.CSSProperties;
}

export function InlineIconPickerMenu({
  onSelectIcon,
  onClose,
  triggerRef,
  triggerEl,
  userCustomIcons: propUserCustomIcons,
  t: propT,
  className,
  style
}: InlineIconPickerMenuProps) {
  const currentLang = (typeof window !== 'undefined' ? localStorage.getItem('vitruvius_lang') || 'ru' : 'ru') as 'ru' | 'en';
  const t = propT || UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS.ru;
  const userCustomIcons = propUserCustomIcons || globalUserIconsRef.current || [];

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [iconSearchQuery, setIconSearchQuery] = useState<string>('');
  const [recentIcons, setRecentIcons] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('vitruvius_recent_desc_icons');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 10);
        }
      }
    } catch (e) {
      console.error(e);
    }
    return ['Sword', 'Shield', 'Flame', 'Sparkles', 'Heart', 'Skull', 'Wand2', 'Gem', 'Zap', 'Crosshair'];
  });

  const menuRef = useRef<HTMLDivElement>(null);
  const activeTrigger = triggerEl || triggerRef?.current;

  const [floatingPos, setFloatingPos] = useState<{ top: number; left: number } | null>(() => {
    if (triggerEl && typeof window !== 'undefined') {
      const rect = triggerEl.getBoundingClientRect();
      const menuWidth = Math.min(320, window.innerWidth - 20);
      const menuHeight = 350;
      let top = rect.bottom + 6;
      if (top + menuHeight > window.innerHeight && rect.top - menuHeight - 6 > 0) {
        top = rect.top - menuHeight - 6;
      }
      let left = rect.right - menuWidth;
      if (left < 10) left = 10;
      if (left + menuWidth > window.innerWidth - 10) {
        left = window.innerWidth - menuWidth - 10;
      }
      return { top, left };
    }
    return null;
  });

  useEffect(() => {
    if (triggerEl) {
      const updatePos = () => {
        const rect = triggerEl.getBoundingClientRect();
        const menuWidth = Math.min(320, window.innerWidth - 20);
        const menuHeight = 350;
        let top = rect.bottom + 6;
        if (top + menuHeight > window.innerHeight && rect.top - menuHeight - 6 > 0) {
          top = rect.top - menuHeight - 6;
        }
        let left = rect.right - menuWidth;
        if (left < 10) left = 10;
        if (left + menuWidth > window.innerWidth - 10) {
          left = window.innerWidth - menuWidth - 10;
        }
        setFloatingPos({ top, left });
      };
      updatePos();
      window.addEventListener('resize', updatePos);
      window.addEventListener('scroll', updatePos, true);
      return () => {
        window.removeEventListener('resize', updatePos);
        window.removeEventListener('scroll', updatePos, true);
      };
    }
  }, [triggerEl]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (activeTrigger && activeTrigger.contains(target)) {
        return;
      }
      if (menuRef.current && !menuRef.current.contains(target)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, true);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, activeTrigger]);

  const handlePick = (iconName: string) => {
    try {
      const raw = localStorage.getItem('vitruvius_recent_desc_icons');
      const prev: string[] = raw ? JSON.parse(raw) : [];
      const updated = [iconName, ...prev.filter(x => x !== iconName)].slice(0, 10);
      localStorage.setItem('vitruvius_recent_desc_icons', JSON.stringify(updated));
      setRecentIcons(updated);
    } catch (e) {
      console.error(e);
    }
    onSelectIcon(iconName);
  };

  const menuCategories = useMemo(() => {
    const cats = [
      { id: 'all', label: t.iconCatAll || 'Все', icon: Icons.LayoutGrid },
      { id: 'weapon', label: t.iconCatWeapon || 'Оружие', icon: Icons.Sword },
      { id: 'magic', label: t.iconCatMagic || 'Магия', icon: Icons.Wand2 },
      { id: 'creature', label: t.iconCatCreature || 'Существа', icon: Icons.Skull },
      { id: 'nature', label: t.iconCatNature || 'Природа', icon: Icons.Sun },
      { id: 'gear', label: t.iconCatGear || 'Снаряжение', icon: Icons.Backpack },
      { id: 'treasure', label: t.iconCatTreasure || 'Сокровища', icon: Icons.Gem },
      { id: 'other', label: t.iconCatOther || 'Прочее', icon: Icons.Sparkles },
    ];
    if (userCustomIcons && userCustomIcons.length > 0) {
      cats.splice(1, 0, { id: 'custom', label: t.iconCatCustom || 'Свои', icon: Icons.UploadCloud });
    }
    return cats;
  }, [t, userCustomIcons]);

  const displayedIcons = useMemo(() => {
    let list: string[] = [];
    if (activeCategory === 'custom') {
      list = (userCustomIcons || []).map(i => i.dataUrl || i.id);
    } else if (activeCategory === 'all') {
      list = AVAILABLE_ICONS;
    } else {
      list = AVAILABLE_ICONS.filter(iconName => getIconCategory(iconName) === activeCategory);
    }

    if (iconSearchQuery.trim()) {
      const q = iconSearchQuery.toLowerCase().trim();
      const all = [
        ...AVAILABLE_ICONS,
        ...(userCustomIcons || []).map(i => i.name || i.id)
      ];
      return all.filter(name => name.toLowerCase().includes(q));
    }

    return list;
  }, [activeCategory, iconSearchQuery, userCustomIcons]);

  return (
    <div
      ref={menuRef}
      className={className || "w-72 sm:w-80 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-2xl flex flex-col overflow-hidden select-none text-stone-800 dark:text-stone-100 animate-in fade-in zoom-in-95 duration-100 z-50"}
      style={{
        maxHeight: '350px',
        ...(floatingPos ? { position: 'fixed', top: `${floatingPos.top}px`, left: `${floatingPos.left}px`, zIndex: 9999 } : {}),
        ...style
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header with Search and Close */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850 shrink-0">
        <div className="flex-1 relative flex items-center">
          <Icons.Search size={12} className="absolute left-2 text-stone-400 pointer-events-none" />
          <input
            type="text"
            value={iconSearchQuery}
            onChange={(e) => setIconSearchQuery(e.target.value)}
            placeholder={t.searchIconsPlaceholder || 'Поиск значка...'}
            className="w-full pl-6 pr-6 py-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-md text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          {iconSearchQuery && (
            <button
              type="button"
              onClick={() => setIconSearchQuery('')}
              className="absolute right-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5 cursor-pointer"
            >
              <Icons.X size={11} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-stone-200 dark:hover:bg-stone-750 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
          title="Закрыть"
        >
          <Icons.X size={13} />
        </button>
      </div>

      {/* Section 1: Categories horizontal scroll */}
      <div className="flex items-center gap-1 px-1.5 py-1.5 overflow-x-auto no-scrollbar border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850/50 shrink-0">
        {menuCategories.map(cat => {
          const IconComp = cat.icon;
          const isActive = activeCategory === cat.id && !iconSearchQuery;
          return (
            <button
              key={cat.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setActiveCategory(cat.id);
                setIconSearchQuery('');
              }}
              className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 font-bold border border-amber-300/60 dark:border-amber-700/60 shadow-2xs'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 border border-transparent'
              }`}
            >
              <IconComp size={12} className="shrink-0" />
              <span className="whitespace-nowrap">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Section 2: Recent 10 icons */}
      {!iconSearchQuery && (
        <div className="px-2.5 pt-2 pb-1.5 border-b border-stone-100 dark:border-stone-800 bg-stone-50/20 dark:bg-stone-850/20 shrink-0">
          <div className="flex items-center justify-between text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-1">
            <div className="flex items-center gap-1">
              <Icons.History size={11} />
              <span>{t.recentIconsHeader || 'Недавние (10)'}</span>
            </div>
          </div>
          <div className="grid grid-cols-10 gap-1">
            {recentIcons.slice(0, 10).map((iconName, idx) => (
              <button
                key={`rec-${iconName}-${idx}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handlePick(iconName)}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-amber-100/70 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 hover:text-amber-600 dark:hover:text-amber-400 transition-all cursor-pointer group active:scale-90"
                title={iconName}
              >
                <CardIcon name={iconName} size={15} style={{ color: 'currentColor' }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Section 3: Full list of icons */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 max-h-[190px]">
        {displayedIcons.length === 0 ? (
          <div className="py-6 text-center text-xs text-stone-400">
            {t.noIconsInCategory || 'Значки не найдены'}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1.5">
            {displayedIcons.map(iconName => (
              <button
                key={iconName}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handlePick(iconName)}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-amber-100/80 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 hover:text-amber-600 dark:hover:text-amber-400 transition-all cursor-pointer hover:scale-115 active:scale-95"
                title={iconName}
              >
                <CardIcon name={iconName} size={18} style={{ color: 'currentColor' }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function renderCardFooter(
  card: Card,
  isEditable?: boolean,
  onUpdateField?: (field: keyof Card, value: any) => void
) {
  const currentLang = (typeof window !== 'undefined' ? localStorage.getItem('vitruvius_lang') || 'ru' : 'ru') as 'ru' | 'en';
  const t = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS.ru;
  const leftText = card.footerTextLeft !== undefined && card.footerTextLeft !== '' 
    ? card.footerTextLeft 
    : (card.footerText !== undefined && card.footerText !== '' ? card.footerText : t.defaultFooterText);
  const middleText = card.footerTextMiddle !== undefined ? card.footerTextMiddle : '';
  const rightText = card.cardNumber !== undefined && card.cardNumber !== '' 
    ? card.cardNumber 
    : (card.footerTextRight !== undefined && card.footerTextRight !== '' ? card.footerTextRight : `#${card.id.slice(-4)}`);

  const showLeft = !card.hideFooterLeft;
  const showMiddle = !card.hideFooterMiddle && (isEditable || middleText !== '');
  const showRight = !card.hideFooterRight;

  const hasAnyFooter = showLeft || showMiddle || showRight;

  if (!hasAnyFooter) return null;

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

  const rawLeft = card.footerTextLeft !== undefined ? card.footerTextLeft : (card.footerText !== undefined ? card.footerText : '');
  const rawMiddle = card.footerTextMiddle !== undefined ? card.footerTextMiddle : '';
  const rawRight = card.footerTextRight !== undefined ? card.footerTextRight : (card.cardNumber !== undefined ? card.cardNumber : '');

  return (
    <div className="grid grid-cols-3 w-full items-center mt-1 border-t border-stone-200 pt-1 shrink-0 text-[6px] font-mono select-none">
      {showLeft && (
        isEditable && onUpdateField ? (
          <div className={`${leftSpan} flex items-center min-w-0 pr-0.5 relative group`}>
            <InlineRichInput
              value={rawLeft}
              onChange={(val) => {
                onUpdateField('footerTextLeft', val);
                onUpdateField('footerText', val);
              }}
              placeholder={t.footerLeftPlaceholder}
              title={t.clickToEditFooterLeftTooltip}
              maxLength={80}
              className="w-full bg-transparent border border-transparent hover:border-stone-400/50 hover:bg-stone-500/10 focus:border-amber-500 focus:bg-white/80 focus:ring-1 focus:ring-amber-400/40 focus:outline-none rounded px-0.5 py-0 text-[6px] font-mono uppercase tracking-tight text-left cursor-text flex items-center min-h-[10px]"
              placeholderClassName="px-0.5 text-[6px] font-mono uppercase tracking-tight text-stone-300 opacity-60"
              style={{ color: card.customFooterLeftColor || card.customFooterTextColor || '#a8a29e' }}
            />
          </div>
        ) : (
          <span 
            className={`${leftSpan} truncate text-stone-400 uppercase inline-flex items-center`}
            style={{ color: card.customFooterLeftColor || card.customFooterTextColor || undefined }}
            title={stripHtml(leftText)}
            dangerouslySetInnerHTML={{ __html: formatInlineText(leftText) }}
          />
        )
      )}
      {showMiddle && (
        isEditable && onUpdateField ? (
          <div className={`${middleSpan} flex items-center justify-center min-w-0 px-0.5 relative group`}>
            <InlineRichInput
              value={rawMiddle}
              onChange={(val) => onUpdateField('footerTextMiddle', val)}
              placeholder=""
              title={t.clickToEditFooterMiddleTooltip}
              maxLength={80}
              className="w-full bg-transparent border border-transparent hover:border-stone-400/50 hover:bg-stone-500/10 focus:border-amber-500 focus:bg-white/80 focus:ring-1 focus:ring-amber-400/40 focus:outline-none rounded px-0.5 py-0 text-[6px] font-mono uppercase tracking-tight text-center cursor-text flex items-center justify-center min-h-[10px]"
              placeholderClassName="px-0.5 text-[6px] font-mono uppercase tracking-tight text-stone-300 opacity-60 text-center"
              style={{ color: card.customFooterMiddleColor || card.customFooterTextColor || '#a8a29e' }}
            />
          </div>
        ) : (
          <span 
            className={`${middleSpan} truncate text-stone-400 uppercase px-1 inline-flex items-center justify-center`}
            style={{ color: card.customFooterMiddleColor || card.customFooterTextColor || undefined }}
            title={stripHtml(middleText)}
            dangerouslySetInnerHTML={{ __html: formatInlineText(middleText) }}
          />
        )
      )}
      {showRight && (
        isEditable && onUpdateField ? (
          <div className={`${rightSpan} flex items-center justify-end min-w-0 pl-0.5 relative group`}>
            <InlineRichInput
              value={rawRight}
              onChange={(val) => {
                onUpdateField('footerTextRight', val);
                onUpdateField('cardNumber', val);
              }}
              placeholder={`#${card.id.slice(-4)}`}
              title={t.clickToEditFooterRightTooltip}
              maxLength={80}
              className="w-full bg-transparent border border-transparent hover:border-stone-400/50 hover:bg-stone-500/10 focus:border-amber-500 focus:bg-white/80 focus:ring-1 focus:ring-amber-400/40 focus:outline-none rounded px-0.5 py-0 text-[6px] font-mono uppercase tracking-tight text-right cursor-text flex items-center justify-end min-h-[10px]"
              placeholderClassName="px-0.5 text-[6px] font-mono uppercase tracking-tight text-stone-300 opacity-60 text-right"
              style={{ color: card.customFooterRightColor || card.customCardNumberColor || card.customFooterTextColor || '#a8a29e' }}
            />
          </div>
        ) : (
          <span 
            className={`${rightSpan} truncate text-stone-400 uppercase inline-flex items-center justify-end`}
            style={{ color: card.customFooterRightColor || card.customCardNumberColor || card.customFooterTextColor || undefined }}
            title={stripHtml(rightText)}
            dangerouslySetInnerHTML={{ __html: formatInlineText(rightText) }}
          />
        )
      )}
    </div>
  );
}

interface RichTextEditorProps {
  key?: React.Key;
  value: string;
  onChange: (val: string) => void;
  cardId: string;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  isCardPreview?: boolean;
  t?: any;
  userCustomIcons?: UserCustomIcon[];
}

function RichTextEditor({ value, onChange, cardId, className, style, placeholder, isCardPreview, t: propT, userCustomIcons: propUserCustomIcons }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarCoords, setToolbarCoords] = useState({ top: 0, left: 0 });
  const [isFocused, setIsFocused] = useState(false);
  const isFocusedRef = useRef(false);
  const lastEmittedValueRef = useRef(value || '');

  // Icon picker state
  const [iconMenuOpen, setIconMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [iconSearchQuery, setIconSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const t = propT || (typeof window !== 'undefined' && (localStorage.getItem('vitruvius_lang') || 'ru') === 'en' ? UI_TRANSLATIONS.en : UI_TRANSLATIONS.ru);
  const userCustomIcons = propUserCustomIcons || globalUserIconsRef.current || [];

  const DEFAULT_RECENT_ICONS = ['Sword', 'Shield', 'Flame', 'Sparkles', 'Skull', 'Heart', 'Zap', 'Gem', 'Wand', 'Droplet'];

  const [recentIcons, setRecentIcons] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vitruvius_recent_desc_icons');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 10);
        }
      }
    } catch (e) {}
    return DEFAULT_RECENT_ICONS;
  });

  const isProgrammaticFocusRef = useRef(false);

  const saveCurrentSelection = () => {
    if (isProgrammaticFocusRef.current) return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current && editorRef.current.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  useEffect(() => {
    lastEmittedValueRef.current = value || '';
  }, [value]);

  // Load card description into contentEditable div on card switch or when value updates while not typing
  useEffect(() => {
    if (editorRef.current && !isFocusedRef.current) {
      if (editorRef.current.innerHTML !== (value || '')) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [cardId, value]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      if (html !== lastEmittedValueRef.current) {
        lastEmittedValueRef.current = html;
        onChange(html);
      }
    }
  };

  const applyFormat = (command: string) => {
    document.execCommand(command, false);
    handleInput();
    checkSelection();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      editorRef.current?.blur();
      isFocusedRef.current = false;
      setIsFocused(false);
      setShowToolbar(false);
      setIconMenuOpen(false);
      const sel = window.getSelection();
      if (sel && editorRef.current && editorRef.current.contains(sel.anchorNode)) {
        sel.removeAllRanges();
      }
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === 'b' || key === 'и') {
        e.preventDefault();
        applyFormat('bold');
      } else if (key === 'i' || key === 'ш') {
        e.preventDefault();
        applyFormat('italic');
      } else if (key === 'u' || key === 'г') {
        e.preventDefault();
        applyFormat('underline');
      } else if (key === 's' || key === 'ы') {
        e.preventDefault();
        applyFormat('strikeThrough');
      }
    }
  };

  const checkSelection = () => {
    saveCurrentSelection();
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.toString().trim().length === 0) {
        setShowToolbar(false);
        return;
      }

      try {
        const range = selection.getRangeAt(0);
        if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
          const rect = range.getBoundingClientRect();
          setToolbarCoords({
            top: rect.top - 8,
            left: rect.left + rect.width / 2,
          });
          setShowToolbar(true);
        } else {
          setShowToolbar(false);
        }
      } catch (e) {
        setShowToolbar(false);
      }
    }, 20);
  };

  useEffect(() => {
    document.addEventListener('selectionchange', checkSelection);
    return () => {
      document.removeEventListener('selectionchange', checkSelection);
    };
  }, []);

  // Click outside to stop editing
  useEffect(() => {
    const handleGlobalPointerDown = (e: MouseEvent | PointerEvent) => {
      if (!editorRef.current) return;
      const target = e.target as Node;
      const toolbar = document.getElementById(`rich-toolbar-${cardId}`);
      if (
        editorRef.current.contains(target) ||
        (toolbar && toolbar.contains(target)) ||
        (menuRef.current && menuRef.current.contains(target)) ||
        (triggerButtonRef.current && triggerButtonRef.current.contains(target))
      ) {
        return;
      }
      if (isFocusedRef.current || showToolbar) {
        editorRef.current.blur();
        isFocusedRef.current = false;
        setIsFocused(false);
        setShowToolbar(false);
        const sel = window.getSelection();
        if (sel && editorRef.current.contains(sel.anchorNode)) {
          sel.removeAllRanges();
        }
        handleInput();
      }
    };

    document.addEventListener('pointerdown', handleGlobalPointerDown);
    document.addEventListener('mousedown', handleGlobalPointerDown);
    return () => {
      document.removeEventListener('pointerdown', handleGlobalPointerDown);
      document.removeEventListener('mousedown', handleGlobalPointerDown);
    };
  }, [cardId, showToolbar]);

  // Click outside & Escape listener for icon picker menu
  useEffect(() => {
    if (!iconMenuOpen) return;

    const handlePointerDown = (e: MouseEvent | PointerEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        triggerButtonRef.current &&
        !triggerButtonRef.current.contains(target)
      ) {
        setIconMenuOpen(false);
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIconMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [iconMenuOpen]);

  const insertIcon = (iconName: string) => {
    const iconHtml = getInlineIconHtml(iconName);
    if (!iconHtml || !editorRef.current) return;

    // Update recent icons list (top 10 unique)
    setRecentIcons(prev => {
      const updated = [iconName, ...prev.filter(x => x !== iconName)].slice(0, 10);
      try {
        localStorage.setItem('vitruvius_recent_desc_icons', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    const sel = window.getSelection();
    let range: Range | null = null;

    if (savedRangeRef.current && editorRef.current.contains(savedRangeRef.current.commonAncestorContainer)) {
      range = savedRangeRef.current;
    } else if (sel && sel.rangeCount > 0 && editorRef.current.contains(sel.anchorNode)) {
      range = sel.getRangeAt(0);
    } else {
      range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
    }

    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }

    const container = document.createElement('div');
    container.innerHTML = iconHtml + '\u00A0';
    const frag = document.createDocumentFragment();
    let lastNode: Node | null = null;
    while (container.firstChild) {
      lastNode = container.firstChild;
      frag.appendChild(lastNode);
    }

    range.deleteContents();
    range.insertNode(frag);

    if (lastNode && sel) {
      const newRange = document.createRange();
      newRange.setStartAfter(lastNode);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
      savedRangeRef.current = newRange.cloneRange();
    }

    isProgrammaticFocusRef.current = true;
    editorRef.current.focus();
    setTimeout(() => {
      isProgrammaticFocusRef.current = false;
    }, 50);

    handleInput();
  };

  const menuCategories = useMemo(() => {
    const cats = [
      { id: 'all', label: t.iconCatAll || 'Все', icon: Icons.LayoutGrid },
      { id: 'weapon', label: t.iconCatWeapon || 'Оружие', icon: Icons.Sword },
      { id: 'magic', label: t.iconCatMagic || 'Магия', icon: Icons.Wand2 },
      { id: 'creature', label: t.iconCatCreature || 'Существа', icon: Icons.Skull },
      { id: 'nature', label: t.iconCatNature || 'Природа', icon: Icons.Sun },
      { id: 'gear', label: t.iconCatGear || 'Снаряжение', icon: Icons.Backpack },
      { id: 'treasure', label: t.iconCatTreasure || 'Сокровища', icon: Icons.Gem },
      { id: 'other', label: t.iconCatOther || 'Прочее', icon: Icons.Sparkles },
    ];
    if (userCustomIcons && userCustomIcons.length > 0) {
      cats.splice(1, 0, { id: 'custom', label: t.iconCatCustom || 'Свои', icon: Icons.UploadCloud });
    }
    return cats;
  }, [t, userCustomIcons]);

  const displayedIcons = useMemo(() => {
    let list: string[] = [];
    if (activeCategory === 'custom') {
      list = (userCustomIcons || []).map(i => i.dataUrl || i.id);
    } else if (activeCategory === 'all') {
      list = AVAILABLE_ICONS;
    } else {
      list = AVAILABLE_ICONS.filter(iconName => getIconCategory(iconName) === activeCategory);
    }

    if (iconSearchQuery.trim()) {
      const q = iconSearchQuery.toLowerCase().trim();
      const all = [
        ...AVAILABLE_ICONS,
        ...(userCustomIcons || []).map(i => i.name || i.id)
      ];
      return all.filter(name => name.toLowerCase().includes(q));
    }

    return list;
  }, [activeCategory, iconSearchQuery, userCustomIcons]);

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const clipboardData = e.clipboardData;
    const html = clipboardData.getData('text/html');
    const text = clipboardData.getData('text/plain');

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    selection.deleteFromDocument();
    const range = selection.getRangeAt(0);
    const fragment = document.createDocumentFragment();

    if (html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const cleanNode = (node: Node): Node | null => {
        if (node.nodeType === Node.TEXT_NODE) {
          return document.createTextNode(node.textContent || '');
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const tagName = el.tagName.toLowerCase();

          const allowedSvgTags = ['svg', 'path', 'circle', 'line', 'polyline', 'polygon', 'rect', 'g'];
          const allowedTextFormats = ['b', 'strong', 'i', 'em', 'u', 's', 'strike', 'del', 'br', 'span', 'img', ...allowedSvgTags];
          const allowedBlocks = ['p', 'div', 'li'];

          if (allowedSvgTags.includes(tagName)) {
            const newEl = document.createElementNS('http://www.w3.org/2000/svg', tagName);
            Array.from(el.attributes).forEach(attr => {
              newEl.setAttribute(attr.name, attr.value);
            });
            el.childNodes.forEach(child => {
              const cleanedChild = cleanNode(child);
              if (cleanedChild) {
                newEl.appendChild(cleanedChild);
              }
            });
            return newEl;
          } else if (allowedTextFormats.includes(tagName)) {
            const newEl = document.createElement(tagName);
            Array.from(el.attributes).forEach(attr => {
              newEl.setAttribute(attr.name, attr.value);
            });
            el.childNodes.forEach(child => {
              const cleanedChild = cleanNode(child);
              if (cleanedChild) {
                newEl.appendChild(cleanedChild);
              }
            });
            return newEl;
          } else if (allowedBlocks.includes(tagName)) {
            const newEl = document.createElement(tagName);
            el.childNodes.forEach(child => {
              const cleanedChild = cleanNode(child);
              if (cleanedChild) {
                newEl.appendChild(cleanedChild);
              }
            });
            if (newEl.childNodes.length === 0) {
              newEl.appendChild(document.createElement('br'));
            }
            return newEl;
          } else {
            const frag = document.createDocumentFragment();
            el.childNodes.forEach(child => {
              const cleanedChild = cleanNode(child);
              if (cleanedChild) {
                frag.appendChild(cleanedChild);
              }
            });
            return frag;
          }
        }

        return null;
      };

      doc.body.childNodes.forEach(node => {
        const cleaned = cleanNode(node);
        if (cleaned) {
          fragment.appendChild(cleaned);
        }
      });
    } else {
      const lines = text.split(/\r?\n/);
      lines.forEach((line, idx) => {
        if (line) {
          fragment.appendChild(document.createTextNode(line));
        }
        if (idx < lines.length - 1) {
          fragment.appendChild(document.createElement('br'));
        }
      });
    }

    range.insertNode(fragment);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);

    handleInput();
  };

  const defaultClassName = "rich-editor w-full min-h-[110px] max-h-[220px] overflow-y-auto px-3 pt-2 pb-8 bg-stone-50 dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white dark:focus:bg-stone-800 text-stone-800 dark:text-stone-100 font-body leading-relaxed select-text cursor-text";
  const placeholderText = placeholder || "Опишите свойства техники или доспеха...";

  const previewFrameClasses = isCardPreview ? (
    isFocused
      ? 'border border-amber-500 bg-white/50 ring-1 ring-amber-400/40'
      : 'border border-transparent hover:border-stone-400/60 hover:bg-stone-500/5'
  ) : '';

  return (
    <div className="relative flex-1 flex flex-col min-h-0">
      <style>{`
        .rich-editor:empty:before, .rich-editor-preview:empty:before {
          content: attr(data-placeholder);
          color: #a8a29e;
          pointer-events: none;
          font-style: italic;
        }
      `}</style>
      <div
        ref={editorRef}
        contentEditable
        data-placeholder={placeholderText}
        onInput={handleInput}
        onMouseUp={saveCurrentSelection}
        onKeyUp={saveCurrentSelection}
        onClick={saveCurrentSelection}
        onFocus={() => {
          isFocusedRef.current = true;
          setIsFocused(true);
        }}
        onBlur={() => {
          isFocusedRef.current = false;
          setIsFocused(false);
          handleInput();
        }}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        className={`${className || defaultClassName} ${previewFrameClasses} ${isCardPreview ? 'rounded px-1 py-0.5 transition-all duration-150 cursor-text' : ''}`}
        style={{
          outline: 'none',
          ...style
        }}
      />

      {/* Button in bottom-right corner of description block to open icon picker */}
      {!isCardPreview && (
        <>
          <div className="absolute bottom-1.5 right-2 z-20">
            <button
              ref={triggerButtonRef}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                saveCurrentSelection();
              }}
              onClick={() => {
                saveCurrentSelection();
                setIconMenuOpen(prev => !prev);
              }}
              className={`w-6 h-6 flex items-center justify-center rounded-md border transition-all cursor-pointer select-none ${
                iconMenuOpen
                  ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-300 shadow-xs ring-2 ring-amber-400/20'
                  : 'bg-white/95 dark:bg-stone-750/95 hover:bg-amber-50 dark:hover:bg-stone-700 border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 shadow-2xs'
              }`}
              title={t.insertIconTooltip || "Вставить значок в текст"}
              aria-label="Вставить значок"
            >
              <Icons.Smile size={14} />
            </button>
          </div>

          {/* Emoji-like messenger icon picker popover */}
          {iconMenuOpen && (
            <div className="absolute bottom-8.5 right-0 z-50">
              <InlineIconPickerMenu
                onSelectIcon={(iconName) => {
                  insertIcon(iconName);
                }}
                onClose={() => setIconMenuOpen(false)}
                triggerRef={triggerButtonRef}
                userCustomIcons={userCustomIcons}
                t={t}
              />
            </div>
          )}
        </>
      )}

      {showToolbar && (
        <div
          id={`rich-toolbar-${cardId}`}
          className="fixed bg-stone-900 border border-stone-700 text-stone-100 px-1.5 py-1 rounded-lg shadow-xl flex items-center gap-1 z-[9999] animate-in fade-in zoom-in-95 duration-100"
          style={{
            top: `${toolbarCoords.top}px`,
            left: `${toolbarCoords.left}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {(() => {
            const isEn = (typeof window !== 'undefined' && (localStorage.getItem('vitruvius_lang') || 'ru') === 'en');
            return (
              <>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyFormat('bold');
                  }}
                  className="w-7 h-7 flex items-center justify-center font-bold hover:bg-stone-800 hover:text-amber-400 rounded transition-colors text-xs cursor-pointer"
                  title={isEn ? "Bold (Ctrl+B)" : "Жирный (Ctrl+B)"}
                >
                  {isEn ? "B" : "Ж"}
                </button>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyFormat('italic');
                  }}
                  className="w-7 h-7 flex items-center justify-center italic hover:bg-stone-800 hover:text-amber-400 rounded transition-colors text-xs cursor-pointer"
                  title={isEn ? "Italic (Ctrl+I)" : "Курсив (Ctrl+I)"}
                >
                  {isEn ? "I" : "К"}
                </button>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyFormat('underline');
                  }}
                  className="w-7 h-7 flex items-center justify-center underline hover:bg-stone-800 hover:text-amber-400 rounded transition-colors text-xs cursor-pointer"
                  title={isEn ? "Underline (Ctrl+U)" : "Подчеркнутый (Ctrl+U)"}
                >
                  {isEn ? "U" : "Ч"}
                </button>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyFormat('strikeThrough');
                  }}
                  className="w-7 h-7 flex items-center justify-center line-through hover:bg-stone-800 hover:text-amber-400 rounded transition-colors text-xs cursor-pointer"
                  title={isEn ? "Strikethrough" : "Зачеркнутый"}
                >
                  {isEn ? "S" : "З"}
                </button>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default function App() {
  // Эффект для принудительного обновления вкладки (заголовка и фавикона) на случай кэширования браузером
  useEffect(() => {
    document.title = "Sora — мастерская карт";
    
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.type = 'image/svg+xml';
    link.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' width='512' height='512'%3E%3Crect width='512' height='512' rx='96' fill='%23d97706'/%3E%3Cg transform='translate(76.8, 166.05) scale(0.7)'%3E%3Cpath d='M0 0L176 81.5L256 257L83 174L0 0Z' fill='%230c0a09' fill-rule='evenodd'/%3E%3Cpath d='M0 0L176 81.5L256 257L83 174L0 0Z' fill='%230c0a09' fill-rule='evenodd' transform='matrix(-1 0 0 1 512 0)'/%3E%3C/g%3E%3C/svg%3E";
  }, []);

  // Dynamic lists states
  const [cardTypes, setCardTypes] = useState<TypeDefinition[]>(() => {
    const saved = localStorage.getItem('vitruvius_card_types');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return CARD_TYPES;
  });

  const [rarities, setRarities] = useState<RarityDefinition[]>(() => {
    const saved = localStorage.getItem('vitruvius_rarities');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_RARITIES;
  });

  const [listEditorOpen, setListEditorOpen] = useState(false);
  const [listEditorTab, setListEditorTab] = useState<'types' | 'rarities'>('types');
  const [isViewMode, setIsViewMode] = useState<boolean>(false);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('vitruvius_header_expanded');
      return saved !== 'false'; // Default to true (expanded)
    } catch {
      return true;
    }
  });

  const toggleHeader = () => {
    setIsHeaderExpanded(prev => {
      const next = !prev;
      try {
        localStorage.setItem('vitruvius_header_expanded', String(next));
      } catch (e) {}
      return next;
    });
  };

  // States for Icon Picker Modal
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [iconPickerTarget, setIconPickerTarget] = useState<'type' | 'custom'>('type');
  const [iconCategoryTab, setIconCategoryTab] = useState<string>('all');
  const [favoriteIcons, setFavoriteIcons] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vitruvius_favorite_icons');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Custom User Icons Library
  const [userCustomIcons, setUserCustomIcons] = useState<UserCustomIcon[]>(() => {
    try {
      const saved = localStorage.getItem('vitruvius_user_icons');
      const parsed = saved ? JSON.parse(saved) : [];
      globalUserIconsRef.current = parsed;
      return parsed;
    } catch {
      return [];
    }
  });

  useEffect(() => {
    globalUserIconsRef.current = userCustomIcons;
  }, [userCustomIcons]);

  const saveUserCustomIcons = (newIcons: UserCustomIcon[]) => {
    setUserCustomIcons(newIcons);
    globalUserIconsRef.current = newIcons;
    try {
      localStorage.setItem('vitruvius_user_icons', JSON.stringify(newIcons));
    } catch (e: any) {
      console.error('Failed to save user icons', e);
      requestAlert('local_storage_generic');
    }
  };

  const [iconColorsAccordionOpen, setIconColorsAccordionOpen] = useState(false);
  const [sidebarIconColorsAccordionOpen, setSidebarIconColorsAccordionOpen] = useState(false);
  const [uploadCustomIconModalOpen, setUploadCustomIconModalOpen] = useState(false);
  const [deleteCustomIconTarget, setDeleteCustomIconTarget] = useState<UserCustomIcon | null>(null);

  // Active icon picker popover for inputs in the right sidebar (stats, footers, etc.)
  const [sidebarIconPicker, setSidebarIconPicker] = useState<{
    id: string;
    triggerEl: HTMLElement;
    onInsert: (iconName: string) => void;
  } | null>(null);

  const handleInsertIconToInput = (
    id: string,
    triggerEl: HTMLElement,
    currentVal: string,
    onUpdate: (newVal: string) => void,
    inputEl?: HTMLElement | null
  ) => {
    if (sidebarIconPicker?.id === id) {
      setSidebarIconPicker(null);
      return;
    }

    if (inputEl) {
      if (inputEl.isContentEditable) {
        const offset = getInlineCaretStringOffset(inputEl);
        if (offset >= 0) {
          (inputEl as any).__savedOffset = offset;
        }
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && inputEl.contains(sel.anchorNode)) {
          (inputEl as any).__savedRange = sel.getRangeAt(0).cloneRange();
        }
      } else if ('selectionStart' in (inputEl as any)) {
        const htmlInput = inputEl as HTMLInputElement;
        (htmlInput as any).__savedStart = htmlInput.selectionStart;
        (htmlInput as any).__savedEnd = htmlInput.selectionEnd;
      }
    }

    setSidebarIconPicker({
      id,
      triggerEl,
      onInsert: (iconName: string) => {
        if (inputEl && inputEl.isContentEditable) {
          insertIconIntoInlineElement(inputEl, iconName, onUpdate);
        } else if (inputEl && 'value' in (inputEl as any)) {
          const htmlInput = inputEl as HTMLInputElement;
          const tag = `[icon:${iconName}] `;
          const savedStart = (htmlInput as any).__savedStart;
          const savedEnd = (htmlInput as any).__savedEnd;
          const start = typeof savedStart === 'number' && savedStart >= 0 ? savedStart : (htmlInput.selectionStart ?? (currentVal || '').length);
          const end = typeof savedEnd === 'number' && savedEnd >= 0 ? savedEnd : (htmlInput.selectionEnd ?? (currentVal || '').length);
          const cur = currentVal || '';
          const newVal = cur.slice(0, start) + tag + cur.slice(end);
          const newPos = start + tag.length;
          onUpdate(newVal);
          setTimeout(() => {
            htmlInput.focus();
            htmlInput.setSelectionRange(newPos, newPos);
          }, 10);
        } else {
          onUpdate((currentVal || '') + `[icon:${iconName}] `);
        }
      }
    });
  };

  const toggleFavoriteIcon = (iconName: string) => {
    setFavoriteIcons(prev => {
      const next = prev.includes(iconName)
        ? prev.filter(name => name !== iconName)
        : [...prev, iconName];
      localStorage.setItem('vitruvius_favorite_icons', JSON.stringify(next));
      return next;
    });
  };

  // Temporary creation form states for custom lists
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState('#b45309');
  const [newTypeSubColor, setNewTypeSubColor] = useState('#78350f');
  const [newTypeIcon, setNewTypeIcon] = useState('Flame');
  const [typeIconPickerOpen, setTypeIconPickerOpen] = useState(false);
  const [typeIconCategoryTab, setTypeIconCategoryTab] = useState('all');
  const [typeIconColorsAccordionOpen, setTypeIconColorsAccordionOpen] = useState(false);

  const [newRarityName, setNewRarityName] = useState('');
  const [newRarityPreset, setNewRarityPreset] = useState<'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'custom'>('common');
  const [customRarityGlowColor, setCustomRarityGlowColor] = useState('#8b5cf6');
  const [newRarityMatchGlowColor, setNewRarityMatchGlowColor] = useState(true);
  const [newRarityCustomBadgeColor, setNewRarityCustomBadgeColor] = useState('#78716c');

  // State for cards
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedRarityFilter, setSelectedRarityFilter] = useState<string>('all');
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [fileImportModal, setFileImportModal] = useState<{
    isOpen: boolean;
    status: 'success' | 'error';
    message: string;
    errorDetails?: string;
    errorAdvice?: string;
    cardsToImport: Card[];
  }>({
    isOpen: false,
    status: 'success',
    message: '',
    errorDetails: '',
    errorAdvice: '',
    cardsToImport: []
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'templates' | 'cardback'>('editor');
  const [editorSubTab, setEditorSubTab] = useState<'data' | 'colors' | 'layout'>('data');
  const [colorPresets, setColorPresets] = useState<ColorPreset[]>(() => {
    try {
      const saved = localStorage.getItem('vitruvius_color_presets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_COLOR_PRESETS;
  });
  const [selectedColorPresetId, setSelectedColorPresetId] = useState<string>('');
  const [isColorPresetsModalOpen, setIsColorPresetsModalOpen] = useState<boolean>(false);
  const [isSaveColorPresetModalOpen, setIsSaveColorPresetModalOpen] = useState<boolean>(false);
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editingPresetName, setEditingPresetName] = useState<string>('');
  const [isFooterAccordionOpen, setIsFooterAccordionOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('vitruvius_filters_open');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleFiltersAccordion = () => {
    setIsFiltersOpen(prev => {
      const next = !prev;
      try {
        localStorage.setItem('vitruvius_filters_open', String(next));
      } catch (e) {}
      return next;
    });
  };

  const [isViewModeFiltersOpen, setIsViewModeFiltersOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('vitruvius_viewmode_filters_open');
      return saved === 'true'; // Default to false (collapsed)
    } catch {
      return false;
    }
  });

  const toggleViewModeFiltersAccordion = () => {
    setIsViewModeFiltersOpen(prev => {
      const next = !prev;
      try {
        localStorage.setItem('vitruvius_viewmode_filters_open', String(next));
      } catch (e) {}
      return next;
    });
  };

  const [sortOrder, setSortOrder] = useState<'default' | 'title_asc' | 'title_desc' | 'type' | 'rarity'>('default');
  const [shirtSubTab, setShirtSubTab] = useState<'general' | 'individual'>('general');

  // Google Drive Integration state
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(() => {
    const token = sessionStorage.getItem('vitruvius_drive_token');
    const expiresAt = sessionStorage.getItem('vitruvius_drive_token_expires_at');
    if (!token) return null;
    if (expiresAt && Date.now() > parseInt(expiresAt, 10)) {
      sessionStorage.removeItem('vitruvius_drive_token');
      sessionStorage.removeItem('vitruvius_drive_token_expires_at');
      sessionStorage.removeItem('vitruvius_drive_user');
      return null;
    }
    return token;
  });
  const [driveUserProfile, setDriveUserProfile] = useState<DriveUserProfile | null>(() => {
    const token = sessionStorage.getItem('vitruvius_drive_token');
    if (!token) return null;
    const saved = sessionStorage.getItem('vitruvius_drive_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });
  const [isDriveAuthModalOpen, setIsDriveAuthModalOpen] = useState(false);
  const [isDriveDecksModalOpen, setIsDriveDecksModalOpen] = useState(false);
  const [currentDeckDriveId, setCurrentDeckDriveId] = useState<string | null>(() => {
    return localStorage.getItem('vitruvius_current_drive_id');
  });
  const [currentDeckTitle, setCurrentDeckTitle] = useState<string | null>(() => {
    return localStorage.getItem('vitruvius_current_drive_title');
  });
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const skipNextAutoSaveRef = useRef<boolean>(true); // Skip auto-save on initial load

  const handleDriveAuthSuccess = (token: string, user: DriveUserProfile, expiresIn: number = 3600) => {
    skipNextAutoSaveRef.current = true;
    setDriveAccessToken(token);
    setDriveUserProfile(user);
    sessionStorage.setItem('vitruvius_drive_token', token);
    sessionStorage.setItem('vitruvius_drive_token_expires_at', String(Date.now() + Math.max(300, expiresIn) * 1000));
    sessionStorage.setItem('vitruvius_drive_user', JSON.stringify(user));
    showToast(`Успешная авторизация! Добро пожаловать, ${user.name}!`, 'success');
  };

  const handleDriveSignOut = (silent: boolean = false) => {
    setDriveAccessToken(null);
    setDriveUserProfile(null);
    sessionStorage.removeItem('vitruvius_drive_token');
    sessionStorage.removeItem('vitruvius_drive_token_expires_at');
    sessionStorage.removeItem('vitruvius_drive_user');
    setIsDriveDecksModalOpen(false);
    if (!silent) {
      showToast('Вы вышли из Google Диска');
    }
  };

  const [illustrationLibrary, setIllustrationLibrary] = useState<string[]>(() => {
    const saved = localStorage.getItem('vitruvius_illustrations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=max&q=80',
      'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=800&auto=format&fit=max&q=80',
      'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&auto=format&fit=max&q=80',
      'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&auto=format&fit=max&q=80',
      'https://images.unsplash.com/photo-1550572017-edd951b55104?w=800&auto=format&fit=max&q=80'
    ];
  });

  const saveIllustrationLibrary = (updated: string[]) => {
    setIllustrationLibrary(updated);
    try {
      localStorage.setItem('vitruvius_illustrations', JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save illustrations to localStorage:', e);
    }
  };

  const addMultipleToLibrary = (urls: (string | undefined | null)[]) => {
    const validUrls = urls
      .filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
      .map(u => u.trim());
    if (validUrls.length === 0) return;

    setIllustrationLibrary(prev => {
      const existingSet = new Set(prev);
      const newUnique = validUrls.filter(u => !existingSet.has(u));
      if (newUnique.length === 0) return prev;
      const updated = [...newUnique, ...prev];
      try {
        localStorage.setItem('vitruvius_illustrations', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save illustrations to localStorage:', e);
      }
      return updated;
    });
  };

  const addToLibrary = (url: string) => {
    if (!url || url.trim() === '') return;
    addMultipleToLibrary([url]);
  };

  const removeFromLibrary = (url: string) => {
    const updated = illustrationLibrary.filter(item => item !== url);
    saveIllustrationLibrary(updated);
  };

  const syncDeckImagesToLibrary = (deckCards: Card[], backUrl?: string) => {
    const images: string[] = [];
    if (backUrl && backUrl.trim()) {
      images.push(backUrl.trim());
    }
    if (Array.isArray(deckCards)) {
      deckCards.forEach(c => {
        if (c.artUrl && c.artUrl.trim()) images.push(c.artUrl.trim());
        if (c.shirtUrl && c.shirtUrl.trim()) images.push(c.shirtUrl.trim());
      });
    }
    if (images.length > 0) {
      addMultipleToLibrary(images);
    }
  };

  const handleLoadDeckToEditor = (deckData: DeckData, driveFileId: string, openInViewMode: boolean = false) => {
    skipNextAutoSaveRef.current = true;
    if (deckData.cards && Array.isArray(deckData.cards) && deckData.cards.length > 0) {
      const normalizedCards = deckData.cards.map(c => ({
        ...c,
        enableTextOverflow: c.enableTextOverflow !== false,
      }));
      saveCards(normalizedCards);
      setSelectedCardId(normalizedCards[0].id);
    }
    if (deckData.cardTypes && Array.isArray(deckData.cardTypes) && deckData.cardTypes.length > 0) {
      saveCardTypes(deckData.cardTypes);
    }
    if (deckData.rarities && Array.isArray(deckData.rarities) && deckData.rarities.length > 0) {
      saveRarities(deckData.rarities);
    }
    if (deckData.cardBackEnabled !== undefined) {
      saveCardBackEnabled(deckData.cardBackEnabled);
    }
    if (deckData.cardBackUrl !== undefined) {
      saveCardBackUrl(deckData.cardBackUrl);
    }
    if (deckData.cardBackScale !== undefined) {
      saveCardBackScale(deckData.cardBackScale);
    }
    if (deckData.cardBackPositionX !== undefined) {
      saveCardBackPositionX(deckData.cardBackPositionX);
    }
    if (deckData.cardBackPositionY !== undefined) {
      saveCardBackPositionY(deckData.cardBackPositionY);
    }
    if (deckData.cardBackRotation !== undefined) {
      saveCardBackRotation(deckData.cardBackRotation);
    }
    
    // Automatically pull all images from the loaded deck into the illustration library
    syncDeckImagesToLibrary(deckData.cards || [], deckData.cardBackUrl);

    const deckTitle = deckData.title || 'Моя колода';
    setCurrentDeckDriveId(driveFileId);
    setCurrentDeckTitle(deckTitle);
    localStorage.setItem('vitruvius_current_drive_id', driveFileId);
    localStorage.setItem('vitruvius_current_drive_title', deckTitle);
    setIsViewMode(openInViewMode);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Stateful confirmation modal for RPG-styled prompts
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    iconType?: 'help' | 'alert' | 'success' | 'warning' | 'magic';
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Да',
    cancelText: 'Отмена',
    onConfirm: () => {},
    iconType: 'help',
  });

  const [cardBackEnabled, setCardBackEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('vitruvius_card_back_enabled');
    return saved === 'true'; // Defaults to false
  });

  const [cardBackUrl, setCardBackUrl] = useState<string>(() => {
    return localStorage.getItem('vitruvius_card_back_url') || '';
  });

  const [cardBackScale, setCardBackScale] = useState<number>(() => {
    const saved = localStorage.getItem('vitruvius_card_back_scale');
    return saved ? parseInt(saved) : 100;
  });

  const [cardBackPositionX, setCardBackPositionX] = useState<number>(() => {
    const saved = localStorage.getItem('vitruvius_card_back_x');
    return saved ? parseInt(saved) : 0;
  });

  const [cardBackPositionY, setCardBackPositionY] = useState<number>(() => {
    const saved = localStorage.getItem('vitruvius_card_back_y');
    return saved ? parseInt(saved) : 0;
  });

  const [cardBackRotation, setCardBackRotation] = useState<number>(() => {
    const saved = localStorage.getItem('vitruvius_card_back_rotation');
    return saved ? parseInt(saved) : 0;
  });

  const saveCardBackEnabled = (val: boolean) => {
    setCardBackEnabled(val);
    localStorage.setItem('vitruvius_card_back_enabled', String(val));
  };

  const saveCardBackUrl = (val: string) => {
    setCardBackUrl(val);
    localStorage.setItem('vitruvius_card_back_url', val);
  };

  const saveCardBackScale = (val: number) => {
    setCardBackScale(val);
    localStorage.setItem('vitruvius_card_back_scale', String(val));
  };

  const saveCardBackPositionX = (val: number) => {
    setCardBackPositionX(val);
    localStorage.setItem('vitruvius_card_back_x', String(val));
  };

  const saveCardBackPositionY = (val: number) => {
    setCardBackPositionY(val);
    localStorage.setItem('vitruvius_card_back_y', String(val));
  };

  const saveCardBackRotation = (val: number) => {
    setCardBackRotation(val);
    localStorage.setItem('vitruvius_card_back_rotation', String(val));
  };

  // Automatic saving to Google Drive when current deck changes
  useEffect(() => {
    if (skipNextAutoSaveRef.current) {
      skipNextAutoSaveRef.current = false;
      return;
    }

    if (!currentDeckDriveId || !driveAccessToken || !currentDeckTitle) {
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    setAutoSaveStatus('saving');

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const deckData: DeckData = {
          title: currentDeckTitle,
          cards,
          cardTypes,
          rarities,
          cardBackEnabled,
          cardBackUrl,
          cardBackScale,
          cardBackPositionX,
          cardBackPositionY,
          cardBackRotation,
        };

        const result = await saveDeckToDrive(driveAccessToken, deckData, currentDeckDriveId);
        if (result.fileId && result.fileId !== currentDeckDriveId) {
          setCurrentDeckDriveId(result.fileId);
          localStorage.setItem('vitruvius_current_drive_id', result.fileId);
        }
        setAutoSaveStatus('saved');

        setTimeout(() => {
          setAutoSaveStatus((prev) => (prev === 'saved' ? 'idle' : prev));
        }, 3000);
      } catch (err: any) {
        console.warn('Auto-save to Google Drive notice:', err);
        setAutoSaveStatus('error');
      }
    }, 1500);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [
    cards,
    cardTypes,
    rarities,
    cardBackEnabled,
    cardBackUrl,
    cardBackScale,
    cardBackPositionX,
    cardBackPositionY,
    cardBackRotation,
    currentDeckTitle,
    currentDeckDriveId,
    driveAccessToken,
  ]);
  const [showPrintWarning, setShowPrintWarning] = useState(false);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  // App Settings (Language, Theme, Background)
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('vitruvius_app_settings');
      if (saved) {
        return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to load app settings from localStorage', e);
    }
    return DEFAULT_APP_SETTINGS;
  });

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const updateAppSettings = (newSettings: Partial<AppSettings>) => {
    setAppSettings(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('vitruvius_app_settings', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save app settings to localStorage', e);
      }
      return updated;
    });
  };

  useEffect(() => {
    if (appSettings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [appSettings.theme]);

  const t = UI_TRANSLATIONS[appSettings.language] || UI_TRANSLATIONS.ru;
  const isEn = appSettings.language === 'en';

  const requestConfirmation = (
    type: 'download' | 'download_single' | 'delete_card' | 'delete_image' | 'delete_type' | 'delete_rarity' | 'delete_preset' | 'reset_deck' | 'clear_deck',
    onConfirm: () => void,
    options?: { confirmText?: string; cancelText?: string; title?: string }
  ) => {
    const lang = appSettings.language;
    const funny = FUNNY_MESSAGES_I18N[lang] || FUNNY_MESSAGES_I18N.ru;
    let title = options?.title || '';
    let list: string[] = [];
    if (type === 'download') {
      title = title || (lang === 'en' ? 'Confirm Archive Creation' : 'Подтверждение создания архива');
      list = funny.deckDownload || [];
    } else if (type === 'download_single') {
      title = title || (lang === 'en' ? 'Confirm Card Inscription' : 'Подтверждение запечатления карты');
      list = funny.cardDownloadSingle || [];
    } else if (type === 'delete_card') {
      title = title || (lang === 'en' ? 'Confirm Card Deletion' : 'Подтверждение удаления карты');
      list = funny.cardDelete || [];
    } else if (type === 'delete_image') {
      title = title || (lang === 'en' ? 'Confirm Image Deletion' : 'Подтверждение удаления изображения');
      list = funny.imageDelete || [];
    } else if (type === 'delete_type') {
      title = title || (lang === 'en' ? 'Confirm Type Deletion' : 'Подтверждение удаления типа');
      list = funny.typeDelete || [];
    } else if (type === 'delete_rarity') {
      title = title || (lang === 'en' ? 'Confirm Rarity Deletion' : 'Подтверждение удаления редкости');
      list = funny.rarityDelete || [];
    } else if (type === 'delete_preset') {
      title = title || (lang === 'en' ? 'Confirm Preset Deletion' : 'Подтверждение удаления пресета');
      list = lang === 'en' ? [
        'Are you sure you want to erase this color masterpiece from the spellbook?',
        'Delete this color palette preset? Existing cards will keep their colors.',
        'Erase this color scheme from the Alchemists Guild registry?'
      ] : [
        'Вы уверены, что хотите стереть этот цветовой шедевр из книги пресетов?',
        'Удалить этот пресет палитры? Цвета на уже созданных картах сохранятся.',
        'Стереть эту цветовую схему из списка доступных пресетов гильдии алхимиков?'
      ];
    } else if (type === 'reset_deck') {
      title = title || (lang === 'en' ? 'RESET CARDS TO DEFAULT' : 'СБРОС КАРТ В НАЧАЛЬНОЕ СОСТОЯНИЕ');
      list = funny.deckReset || [];
    } else if (type === 'clear_deck') {
      title = title || (lang === 'en' ? 'CLEAR ENTIRE DECK' : 'ПОЛНАЯ ОЧИСТКА КОЛОДЫ');
      list = funny.deckClear || [];
    }

    if (!list || list.length === 0) {
      list = lang === 'en' ? ['Are you sure you want to proceed?'] : ['Вы уверены, что хотите продолжить?'];
    }

    const randomMsg = list[Math.floor(Math.random() * list.length)];
    setConfirmModal({
      isOpen: true,
      title,
      message: randomMsg,
      confirmText: options?.confirmText || (lang === 'en' ? 'Yes' : 'Да'),
      cancelText: options?.cancelText || (lang === 'en' ? 'Cancel' : 'Отмена'),
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      iconType: (type === 'download' || type === 'download_single') ? 'magic' : ((type === 'reset_deck' || type === 'clear_deck') ? 'warning' : 'help')
    });
  };

  const requestAlert = (
    type: 'local_storage_error' | 'local_storage_generic' | 'local_storage_types_error' | 'local_storage_rarities_error' | 'last_card' | 'import_success' | 'import_array_error' | 'import_parse_error' | 'image_load_failed' | 'image_error' | 'export_png_error' | 'clipboard_copied' | 'custom_error',
    onConfirm?: () => void,
    customMessage?: string
  ) => {
    const lang = appSettings.language;
    let title = lang === 'en' ? 'SORA • BROADCAST' : 'SORA • ВЕЩАНИЕ';
    let message = '';
    let iconType: 'help' | 'alert' | 'success' | 'warning' | 'magic' = 'warning';
    
    if (type === 'local_storage_error') {
      title = lang === 'en' ? 'BAG OF HOLDING OVERFLOW' : 'ПЕРЕПОЛНЕНИЕ СУМКИ ХРАНЕНИЯ';
      message = lang === 'en' 
        ? "Oh no! Your Bag of Holding (LocalStorage) is packed full of orcish trophies and rusty armor! Remove unused card backgrounds."
        : "О нет! Ваша Сумка Хранения (LocalStorage) забита до отказа орочьими трофеями и ржавыми доспехами! Вы пытаетесь сохранить слишком много или слишком объемные изображения. Удалите неиспользуемые фоны карт.";
      iconType = 'alert';
    } else if (type === 'local_storage_generic') {
      title = lang === 'en' ? 'ANCIENT CHEST ERROR' : 'ОШИБКА ДРЕВНЕГО СУНДУКА';
      message = lang === 'en'
        ? "Failed to save changes to browser local storage. Looks like the chest is locked by a warding spell!"
        : "Не удалось сохранить изменения в локальное хранилище браузера. Похоже, сундук заблокирован заклинанием Запрета!";
      iconType = 'alert';
    } else if (type === 'local_storage_types_error') {
      title = lang === 'en' ? 'CARTOGRAPHERS GUILD GLITCH' : 'СБОЙ ГИЛЬДИИ КАРТОГРАФОВ';
      message = lang === 'en'
        ? "Error saving card types: local storage full! Unable to record new categories."
        : "Ошибка при сохранении типов карточек: локальное хранилище переполнено! Невозможно внести новые категории в летопись.";
      iconType = 'alert';
    } else if (type === 'local_storage_rarities_error') {
      title = lang === 'en' ? 'JEWELERS GUILD GLITCH' : 'СБОЙ ЮВЕЛИРНОЙ ГИЛЬДИИ';
      message = lang === 'en'
        ? "Error saving rarities: local storage full! The gem safe is completely loaded."
        : "Ошибка при сохранении степеней редкости: локальное хранилище переполнено! Сейф для драгоценных плашек забит.";
      iconType = 'alert';
    } else if (type === 'last_card') {
      title = lang === 'en' ? 'LAST STAND OF REALITY' : 'ПОСЛЕДНИЙ РУБЕЖ РЕАЛЬНОСТИ';
      const messages = lang === 'en' ? [
        "The High Council forbids destroying the last card in existence! Keep at least one spark of creation in your deck.",
        "Halt the caster's hand! Erasing this last card would shatter spacetime itself.",
        "You are attempting to erase void itself. The last card is protected by a ward of unyielding endurance!",
        "Archive goblins are clinging to this final scroll with their teeth. They will not surrender it!"
      ] : [
        "Магический совет запрещает уничтожать последнюю карту бытия! У вас должна оставаться хотя бы одна искра творения в колоде.",
        "Остановить руку заклинателя! Если стереть эту последнюю карту, ткань пространства-времени разорвётся.",
        "Вы пытаетесь стереть саму пустоту. Последняя карта защищена нерушимым заклинанием истинной стойкости!",
        "Гоблины-архивариусы вцепились зубами в этот последний свиток. Они не отдадут его на растерзание бездне!"
      ];
      message = messages[Math.floor(Math.random() * messages.length)];
      iconType = 'warning';
    } else if (type === 'import_success') {
      title = lang === 'en' ? 'SUMMONING RITUAL COMPLETE' : 'РИТУАЛ ПРИЗЫВА ЗАВЕРШЕН';
      const messages = lang === 'en' ? [
        "Summoning scrolls worked flawlessly! New cards have materialized in your deck.",
        "Courier goblins safely delivered the chest of new cards. Unloading the loot!",
        "Wonderful! The ancient manuscript was read without a hitch, adding new artifacts to your chronicles.",
        "A portal opened and a torrent of new ideas poured into your adventure! All cards are here."
      ] : [
        "Свитки призыва сработали идеально! Новые карты успешно материализовались в вашей колоде.",
        "Гоблины-курьеры доставили сундук с новыми картами в целости и сохранности. Разгружаем контрабанду!",
        "Чудесно! Древний манускрипт прочитан без запинки, и новые артефакты вошли в хроники вашей кампании.",
        "Портал открылся, и поток новых идей успешно влился в ваше приключение! Все карты на месте."
      ];
      message = messages[Math.floor(Math.random() * messages.length)];
      iconType = 'success';
    } else if (type === 'import_array_error') {
      title = lang === 'en' ? 'CURSE OF WRONG SHAPE' : 'ПРОКЛЯТИЕ НЕВЕРНОЙ ФОРМЫ';
      message = lang === 'en'
        ? "Oh no! Your import scroll contains an anomaly. Magic runes do not form a valid card array!"
        : "О нет! Ваш свиток импорта содержит аномалию. Магические символы не складываются в правильный массив карт!";
      iconType = 'alert';
    } else if (type === 'import_parse_error') {
      title = lang === 'en' ? 'ILLUSION SHATTERED' : 'ИЛЛЮЗИЯ РАСПАЛАСЬ';
      message = lang === 'en'
        ? "Ancient goblin cipher is unreadable! The archivist could not decode the provided JSON file."
        : "Древний гоблинский шифр нечитаем! Наш архивариус перепутал буквы и не смог расшифровать присланный JSON-файл.";
      iconType = 'alert';
    } else if (type === 'image_load_failed') {
      title = lang === 'en' ? 'ARTIST CRITICAL MISS' : 'КРИТИЧЕСКИЙ ПРОМАХ ХУДОЖНИКА';
      message = lang === 'en'
        ? "Magic mist obscured some artworks! Portraits were warded or use an unsupported format."
        : "Магический туман скрыл часть картин! Портреты существ оказались зачарованы или имеют неподдерживаемый формат.";
      iconType = 'warning';
    } else if (type === 'image_error') {
      title = lang === 'en' ? 'SURGE OF WILD PIGMENTS' : 'МАГИЧЕСКИЙ ВСПЛЕСК КРАСОК';
      message = lang === 'en'
        ? "Visual illusion failed while processing canvases! An invisibility potion was spilled on your images."
        : "Иллюзия дала сбой при обработке холстов! Гоблин-живописец случайно пролил зелье невидимости на ваши изображения.";
      iconType = 'alert';
    } else if (type === 'export_png_error') {
      title = lang === 'en' ? 'ALCHEMIST CONFUSION' : 'ЗАМЕШАТЕЛЬСТВО АЛХИМИКА';
      message = lang === 'en'
        ? "Card crystallization to PNG failed! The alchemist dropped a flask... Please try again."
        : "Кристаллизация карт в формат PNG провалилась! Алхимик уронил реторту, чернила потекли... Попробуйте ещё раз.";
      iconType = 'alert';
    } else if (type === 'clipboard_copied') {
      title = lang === 'en' ? 'RUNE TELEPORTATION' : 'ТЕЛЕПОРТАЦИЯ СИМВОЛОВ';
      const messages = lang === 'en' ? [
        "A teleportation charm moved the secret rune (link) straight into your pocket (clipboard)!",
        "The link was nicked by a rogue and tucked neatly into your clipboard. Share it with your party!",
        "Magic echo copied! The rune of connection is stored in memory.",
        "Your clipboard glows brightly! A copy of this adventure is ready to be shared."
      ] : [
        "Заклинание телепортации перенесло тайную руну (ссылку) прямо в ваш карман (буфер обмена)!",
        "Ссылка похищена ловким вором и бережно вложена в ваш буфер обмена. Поделитесь ей с соратниками!",
        "Магическое эхо скопировано! Руна связи теперь хранится в вашей памяти. Можете отправлять её почтовыми голубями.",
        "Буфер обмена ярко засиял! Копия этого приключения готова для передачи вашим игрокам."
      ];
      message = messages[Math.floor(Math.random() * messages.length)];
      iconType = 'magic';
    } else if (type === 'custom_error') {
      title = lang === 'en' ? 'RITUAL FAILED' : 'ОШИБКА РИТУАЛА';
      message = customMessage || (lang === 'en' ? "An unexpected error occurred during magical calculations." : "Произошла непредвиденная ошибка во время магических вычислений.");
      iconType = 'alert';
    }

    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText: lang === 'en' ? 'So be it!' : 'Да будет так!',
      cancelText: '', // Empty means hide Cancel button
      onConfirm: () => {
        if (onConfirm) onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      iconType
    });
  };

  const [exportProgress, setExportProgress] = useState<{
    active: boolean;
    progress: number;
    stepText: string;
    isSingleCard?: boolean;
  }>({
    active: false,
    progress: 0,
    stepText: '',
    isSingleCard: false,
  });

  const [applyRoundingToAll, setApplyRoundingToAll] = useState<boolean>(false);
  const [applySizeToAll, setApplySizeToAll] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);

  // Initialize from LocalStorage or starters
  useEffect(() => {
    const normalizeCard = (card: Card): Card => ({
      ...card,
      enableTextOverflow: card.enableTextOverflow !== false,
    });

    const saved = localStorage.getItem('vitruvius_cards');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed.map(normalizeCard);
          setCards(normalized);
          setSelectedCardId(normalized[0].id);
          syncDeckImagesToLibrary(normalized, cardBackUrl);
        } else {
          const normalizedStarters = STARTER_CARDS.map(normalizeCard);
          setCards(normalizedStarters);
          setSelectedCardId(normalizedStarters[0].id);
          syncDeckImagesToLibrary(normalizedStarters, cardBackUrl);
        }
      } catch (e) {
        const normalizedStarters = STARTER_CARDS.map(normalizeCard);
        setCards(normalizedStarters);
        setSelectedCardId(normalizedStarters[0].id);
        syncDeckImagesToLibrary(normalizedStarters, cardBackUrl);
      }
    } else {
      const normalizedStarters = STARTER_CARDS.map(normalizeCard);
      setCards(normalizedStarters);
      setSelectedCardId(normalizedStarters[0].id);
      syncDeckImagesToLibrary(normalizedStarters, cardBackUrl);
    }
  }, []);

  // Save changes to localstorage
  const saveCards = (newCardsOrUpdater: Card[] | ((prev: Card[]) => Card[])) => {
    setCards(prevCards => {
      const nextCards = typeof newCardsOrUpdater === 'function' ? newCardsOrUpdater(prevCards) : newCardsOrUpdater;
      try {
        localStorage.setItem('vitruvius_cards', JSON.stringify(nextCards));
      } catch (e: any) {
        console.error("Storage quota exceeded", e);
        if (e.name === 'QuotaExceededError' || e.code === 22) {
          requestAlert('local_storage_error');
        } else {
          requestAlert('local_storage_generic');
        }
      }
      return nextCards;
    });
  };

  const saveCardTypes = (newTypes: TypeDefinition[]) => {
    setCardTypes(newTypes);
    try {
      localStorage.setItem('vitruvius_card_types', JSON.stringify(newTypes));
    } catch (e: any) {
      console.error("Storage quota exceeded for card types", e);
      requestAlert('local_storage_types_error');
    }
  };

  const saveRarities = (newRarities: RarityDefinition[]) => {
    setRarities(newRarities);
    try {
      localStorage.setItem('vitruvius_rarities', JSON.stringify(newRarities));
    } catch (e: any) {
      console.error("Storage quota exceeded for rarities", e);
      requestAlert('local_storage_rarities_error');
    }
  };

  const saveColorPresets = (newPresets: ColorPreset[]) => {
    setColorPresets(newPresets);
    try {
      localStorage.setItem('vitruvius_color_presets', JSON.stringify(newPresets));
    } catch (e: any) {
      console.error("Storage quota exceeded for color presets", e);
      requestAlert('local_storage_generic');
    }
  };

  // Select the current card object
  const selectedCard = cards.find(c => c.id === selectedCardId) || cards[0] || null;

  // Add new card
  const handleAddCard = (typeId?: CardType) => {
    const actualTypeId = (typeId && cardTypes.some(t => t.id === typeId)) ? typeId : (cardTypes[0]?.id || 'ability');
    const newCard: Card = {
      id: Date.now().toString(),
      typeId: actualTypeId,
      title: 'Новая карта',
      subtitle: 'Подзаголовок',
      content: 'Описание эффекта или свойства... Используйте <b>жирный</b> или <i>курсив</i>.',
      stats: [
        { id: Date.now().toString() + '-1', label: 'Расход', value: '1 ед.' }
      ],
      rarity: 'common',
      autoScaleTitle: true,
      enableTextOverflow: true,
      showIcon: true,
      borderRadius: applyRoundingToAll && selectedCard?.borderRadius !== undefined ? selectedCard.borderRadius : 3,
      width: applySizeToAll && selectedCard?.width !== undefined ? selectedCard.width : 63,
      height: applySizeToAll && selectedCard?.height !== undefined ? selectedCard.height : 88,
    };
    const updated = [newCard, ...cards];
    saveCards(updated);
    setSelectedCardId(newCard.id);
  };

  // Duplicate card
  const handleDuplicateCard = (card: Card, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const cloned: Card = {
      ...JSON.parse(JSON.stringify(card)),
      id: Date.now().toString(),
      title: `${card.title} (Копия)`
    };
    const index = cards.findIndex(c => c.id === card.id);
    const updated = [...cards];
    if (index !== -1) {
      updated.splice(index + 1, 0, cloned);
    } else {
      updated.push(cloned);
    }
    saveCards(updated);
    setSelectedCardId(cloned.id);
  };

  // Delete card
  const handleDeleteCard = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (cards.length <= 1) {
      requestAlert('last_card');
      return;
    }
    requestConfirmation('delete_card', () => {
      const filtered = cards.filter(c => c.id !== id);
      saveCards(filtered);
      if (selectedCardId === id) {
        setSelectedCardId(filtered[0].id);
      }
    });
  };

  const sortActiveFirst = (list: Card[]) => {
    const active = list.filter(c => !c.hideFromPrint);
    const hidden = list.filter(c => c.hideFromPrint);
    return [...active, ...hidden];
  };

  const handleTogglePrint = (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveCards(prev => {
      const updated = prev.map(c => c.id === cardId ? { ...c, hideFromPrint: !c.hideFromPrint } : c);
      return sortActiveFirst(updated);
    });
  };

  const handleCardDragStart = (e: React.DragEvent, id: string) => {
    const target = e.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable || target.closest('.rich-editor') || target.closest('button') || target.closest('.rich-toolbar-bubble'))) {
      e.preventDefault();
      return;
    }
    setDraggedCardId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData('text/plain', id);
  };

  const handleContainerDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const scrollThreshold = 60;

    if (offsetY < scrollThreshold && offsetY >= 0) {
      const intensity = (scrollThreshold - offsetY) / scrollThreshold;
      container.scrollTop -= Math.max(5, Math.round(intensity * 20));
    } else if (rect.height - offsetY < scrollThreshold && rect.height - offsetY >= 0) {
      const intensity = (scrollThreshold - (rect.height - offsetY)) / scrollThreshold;
      container.scrollTop += Math.max(5, Math.round(intensity * 20));
    }
  };

  const handleContainerWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (draggedCardId) {
      e.currentTarget.scrollTop += e.deltaY;
    }
  };

  const handleCardDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverCardId !== id) {
      setDragOverCardId(id);
    }

    const container = e.currentTarget.closest('.overflow-y-auto') as HTMLElement | null;
    if (container) {
      const rect = container.getBoundingClientRect();
      const offsetY = e.clientY - rect.top;
      const scrollThreshold = 60;

      if (offsetY < scrollThreshold && offsetY >= 0) {
        const intensity = (scrollThreshold - offsetY) / scrollThreshold;
        container.scrollTop -= Math.max(5, Math.round(intensity * 20));
      } else if (rect.height - offsetY < scrollThreshold && rect.height - offsetY >= 0) {
        const intensity = (scrollThreshold - (rect.height - offsetY)) / scrollThreshold;
        container.scrollTop += Math.max(5, Math.round(intensity * 20));
      }
    }
  };

  const handleCardDragLeave = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (dragOverCardId === id) {
      setDragOverCardId(null);
    }
  };

  const handleCardDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverCardId(null);
    const sourceId = draggedCardId || e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) {
      setDraggedCardId(null);
      return;
    }

    const sourceIndex = cards.findIndex(c => c.id === sourceId);
    const targetIndex = cards.findIndex(c => c.id === targetId);

    if (sourceIndex !== -1 && targetIndex !== -1) {
      const updated = [...cards];
      const [draggedItem] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, draggedItem);
      saveCards(updated);
    }
    setDraggedCardId(null);
  };

  const handleCardDragEnd = () => {
    setDraggedCardId(null);
    setDragOverCardId(null);
  };

  const handleMoveCard = (cardId: string, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = cards.findIndex(c => c.id === cardId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= cards.length) return;

    const updated = [...cards];
    const [movedCard] = updated.splice(idx, 1);
    updated.splice(targetIdx, 0, movedCard);
    saveCards(updated);
  };

  // Update specific fields of any card by ID
  const handleUpdateCardFieldById = (cardId: string, field: keyof Card, value: any) => {
    saveCards(prev => prev.map(c => {
      if (c.id === cardId) {
        return { ...c, [field]: value };
      }
      return c;
    }));
  };

  // Update specific fields of selected card
  const handleUpdateCardField = (field: keyof Card, value: any) => {
    if (!selectedCardId) return;
    handleUpdateCardFieldById(selectedCardId, field, value);
  };

  // Update specific stat of any card by ID
  const handleUpdateCardStatById = (cardId: string, statId: string, label: string, value: string) => {
    saveCards(prev => prev.map(c => {
      if (c.id === cardId) {
        const updatedStats = (c.stats || []).map(s => {
          if (s.id === statId) {
            return { ...s, label, value };
          }
          return s;
        });
        return { ...c, stats: updatedStats };
      }
      return c;
    }));
  };

  // Update multiple fields of selected card simultaneously
  const handleUpdateMultipleFields = (fieldsObj: Partial<Card>) => {
    if (!selectedCardId) return;
    saveCards(prev => prev.map(c => {
      if (c.id === selectedCardId) {
        return { ...c, ...fieldsObj };
      }
      return c;
    }));
  };

  const handleUpdateCardRounding = (radius: number) => {
    if (!selectedCard) return;
    const clamped = Math.min(30, Math.max(0, radius));
    if (applyRoundingToAll) {
      saveCards(prev => prev.map(c => ({ ...c, borderRadius: clamped })));
    } else {
      handleUpdateCardField('borderRadius', clamped);
    }
  };

  const handleUpdateCardDimensions = (width?: number, height?: number) => {
    if (!selectedCard) return;
    const currentW = selectedCard.width !== undefined ? selectedCard.width : 63;
    const currentH = selectedCard.height !== undefined ? selectedCard.height : 88;
    const newWidth = width !== undefined ? Math.min(200, Math.max(20, width)) : currentW;
    const newHeight = height !== undefined ? Math.min(300, Math.max(20, height)) : currentH;

    if (applySizeToAll) {
      saveCards(prev => prev.map(c => ({ ...c, width: newWidth, height: newHeight })));
    } else {
      handleUpdateMultipleFields({ width: newWidth, height: newHeight });
    }
  };

  // Update specific stat of selected card
  const handleUpdateStat = (statId: string, label: string, value: string) => {
    if (!selectedCard) return;
    handleUpdateCardStatById(selectedCard.id, statId, label, value);
  };

  // Add stat row
  const handleAddStatRow = () => {
    if (!selectedCard) return;
    const newStat: CardStat = {
      id: Date.now().toString(),
      label: 'Свойство',
      value: 'Значение'
    };
    handleUpdateCardField('stats', [...selectedCard.stats, newStat]);
  };

  // Remove stat row
  const handleRemoveStatRow = (statId: string) => {
    if (!selectedCard) return;
    const filtered = selectedCard.stats.filter(s => s.id !== statId);
    handleUpdateCardField('stats', filtered);
  };

  // Reset to default cards
  const handleReset = () => {
    requestConfirmation('reset_deck', () => {
      saveCards(STARTER_CARDS);
      setSelectedCardId(STARTER_CARDS[0]?.id || null);
      saveCardTypes(CARD_TYPES);
      saveRarities(DEFAULT_RARITIES);
      const DEFAULT_ILLS = [
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=max&q=80',
        'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=800&auto=format&fit=max&q=80',
        'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&auto=format&fit=max&q=80',
        'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&auto=format&fit=max&q=80',
        'https://images.unsplash.com/photo-1550572017-edd951b55104?w=800&auto=format&fit=max&q=80'
      ];
      saveIllustrationLibrary(DEFAULT_ILLS);
      setFavoriteIcons([]);
      localStorage.setItem('vitruvius_favorite_icons', JSON.stringify([]));
      saveCardBackEnabled(false);
      saveCardBackUrl('');
      saveCardBackScale(100);
      saveCardBackPositionX(0);
      saveCardBackPositionY(0);
      saveCardBackRotation(0);
      setIsHeaderExpanded(true);
      localStorage.setItem('vitruvius_header_expanded', 'true');
      setCurrentDeckDriveId(null);
      setCurrentDeckTitle(null);
      localStorage.removeItem('vitruvius_current_drive_id');
      localStorage.removeItem('vitruvius_current_drive_title');
      showToast('Приложение полностью сброшено к первому запуску!');
    });
  };

  // Completely clear the deck of all cards
  const handleClearDeck = () => {
    requestConfirmation('clear_deck', () => {
      saveCards([]);
      setSelectedCardId(null);
      showToast('Колода полностью очищена!');
    });
  };

  // JSON Export
  const handleExportJSON = () => {
    const exportedCards = cards.map(card => ({
      ...card,
      hideFooter: card.hideFooter !== undefined ? !!card.hideFooter : false,
      enableTextOverflow: card.enableTextOverflow !== undefined ? !!card.enableTextOverflow : true,
      autoScaleTitle: card.autoScaleTitle !== undefined ? !!card.autoScaleTitle : true,
      showIcon: card.showIcon !== undefined ? !!card.showIcon : true,
    }));
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportedCards, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'vitruvius_cards_export.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // JSON Import File Selection
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileContent = event.target?.result as string;
        let parsed: any;
        try {
          parsed = JSON.parse(fileContent);
        } catch (parseErr: any) {
          setFileImportModal({
            isOpen: true,
            status: 'error',
            message: 'ИЛЛЮЗИЯ РАСПАЛАСЬ (Ошибка синтаксиса JSON)',
            errorDetails: parseErr?.message || 'Некорректная структура файла',
            errorAdvice: 'Пожалуйста, проверьте файл в текстовом редакторе. Убедитесь, что все кавычки, двоеточия и запятые расставлены верно, и файл сохранен в кодировке UTF-8.',
            cardsToImport: []
          });
          e.target.value = '';
          return;
        }

        if (!Array.isArray(parsed)) {
          setFileImportModal({
            isOpen: true,
            status: 'error',
            message: 'ПРОКЛЯТИЕ НЕВЕРНОЙ ФОРМЫ (Ожидался массив)',
            errorDetails: 'Файл содержит объект или иную структуру данных вместо квадратных скобок [...] с массивом карточек.',
            errorAdvice: 'Убедитесь, что ваш JSON-файл представляет собой массив объектов карточек, заключенный в квадратные скобки `[ ... ]`.',
            cardsToImport: []
          });
          e.target.value = '';
          return;
        }

        const seenIds = new Set<string>();
        const validated = parsed.map((item: any, idx: number) => {
          let importId = item.id;
          if (!importId || seenIds.has(importId)) {
            importId = `${Date.now()}-import-${idx}-${Math.floor(Math.random() * 1000000)}`;
          }
          seenIds.add(importId);
          
          return {
            id: importId,
            typeId: item.typeId || 'item',
            title: item.title || 'Без названия',
            subtitle: item.subtitle || '',
            content: item.content || item.description || '',
            stats: Array.isArray(item.stats) ? item.stats : [],
            rarity: item.rarity || 'common',
            artUrl: item.artUrl || '',
            customColor: item.customColor || undefined,
            customSubColor: item.customSubColor || undefined,
            customIcon: item.customIcon || undefined,
            illustrationHeight: item.illustrationHeight !== undefined ? Number(item.illustrationHeight) : undefined,
            illustrationScale: item.illustrationScale || undefined,
            illustrationPositionX: item.illustrationPositionX || undefined,
            illustrationPositionY: item.illustrationPositionY || undefined,
            illustrationRotation: item.illustrationRotation !== undefined ? Number(item.illustrationRotation) : undefined,
            footerText: item.footerText || undefined,
            customFooterTextColor: item.customFooterTextColor || undefined,
            hideFooter: item.hideFooter !== undefined ? !!item.hideFooter : false,
            footerTextLeft: item.footerTextLeft || undefined,
            footerTextMiddle: item.footerTextMiddle || undefined,
            footerTextRight: item.footerTextRight || undefined,
            hideFooterLeft: item.hideFooterLeft !== undefined ? !!item.hideFooterLeft : undefined,
            hideFooterMiddle: item.hideFooterMiddle !== undefined ? !!item.hideFooterMiddle : undefined,
            hideFooterRight: item.hideFooterRight !== undefined ? !!item.hideFooterRight : undefined,
            customFooterLeftColor: item.customFooterLeftColor || undefined,
            customFooterMiddleColor: item.customFooterMiddleColor || undefined,
            customFooterRightColor: item.customFooterRightColor || undefined,
            enableTextOverflow: item.enableTextOverflow !== undefined ? !!item.enableTextOverflow : true,
            cardNumber: item.cardNumber || undefined,
            customCardNumberColor: item.customCardNumberColor || undefined,
            fontSize: item.fontSize !== undefined ? Number(item.fontSize) : undefined,
            contentAlign: (['left', 'center', 'right', 'justify'].includes(item.contentAlign)) ? item.contentAlign : undefined,
          };
        });

        if (validated.length === 0) {
          setFileImportModal({
            isOpen: true,
            status: 'error',
            message: 'ХРАНИЛИЩЕ ОКАЗАЛОСЬ ПУСТО',
            errorDetails: 'Массив JSON пуст, в нем нет ни одной карточки.',
            errorAdvice: 'Убедитесь, что внутри квадратных скобок `[ ... ]` записана хотя бы одна карточка со свойствами.',
            cardsToImport: []
          });
          e.target.value = '';
          return;
        }

        setFileImportModal({
          isOpen: true,
          status: 'success',
          message: `РИТУАЛ ПРИЗЫВА ГОТОВ (Найдено карт: ${validated.length})`,
          errorDetails: `Карты успешно расшифрованы и готовы пополнить Хроники Кампании.`,
          errorAdvice: `Выберите, хотите ли вы заменить вашу текущую колоду полностью или бережно добавить новые карты к уже существующим.`,
          cardsToImport: validated
        });

      } catch (err: any) {
        setFileImportModal({
          isOpen: true,
          status: 'error',
          message: 'НЕВЕДОМАЯ КАТАСТРОФА ПРИ ИМПОРТЕ',
          errorDetails: err?.message || 'Неизвестная ошибка разбора данных',
          errorAdvice: 'Попробуйте проверить структуру файла или экспортировать его заново из источника.',
          cardsToImport: []
        });
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const compressImage = (file: File, maxWidth = 600, maxHeight = 600, quality = 0.75): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate dimensions maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress as JPEG
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.onerror = () => {
          reject(new Error('Не удалось загрузить изображение для сжатия.'));
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Не удалось прочитать файл.'));
      reader.readAsDataURL(file);
    });
  };

  const handleBgImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files) as File[];
    let failedCount = 0;

    try {
      const promises = fileList.map(async (file) => {
        if (!file.type.startsWith('image/')) {
          failedCount++;
          return null;
        }
        try {
          const compressed = await compressImage(file, 800, 800, 0.8);
          return compressed;
        } catch (err) {
          console.error('Ошибка сжатия файла:', file.name, err);
          failedCount++;
          return null;
        }
      });

      const results = await Promise.all(promises);
      const validImages = results.filter((img): img is string => !!img);

      if (validImages.length > 0) {
        // Add all unique images to the library at once
        addMultipleToLibrary(validImages);
        // Auto-select the first uploaded image for convenience
        if (activeTab === 'cardback') {
          if (shirtSubTab === 'individual' && selectedCard && selectedCard.shirtMode === 'image') {
            handleUpdateCardField('shirtUrl', validImages[0]);
          } else {
            saveCardBackUrl(validImages[0]);
          }
        } else if (selectedCard) {
          handleUpdateCardField('artUrl', validImages[0]);
        }
      }

      if (failedCount > 0) {
        requestAlert('image_load_failed');
      }
    } catch (err: any) {
      requestAlert('image_error');
    }

    e.target.value = '';
  };

  // Copy prompt helper for JSON generator
  const handleCopyPrompt = () => {
    const templatePrompt = `Привет! Помоги мне создать карту / набор карт для НРИ "Sora". Я это делаю через веб-приложение, которое поддерживает импорт json массивов. Мне нужно создать карточки для способностей, оружия, доспехов, зелий и предметов.
Пришли мне json массив, который я смогу вставить в конструктор карточек, чтобы получить сразу готовый результат. Вот шаблон json-массива, который используется в данном веб-приложении:

[
  {
    "title": "Название карты",
    "subtitle": "Подзаголовок (например, тип предмета, школа магии или требования)",
    "typeId": "ability", // Доступные типы: "ability", "weapon", "armor", "item", "potion", "effect", "trait", "loot", "enemy", "note"
    "rarity": "common", // Доступные редкости: "none", "common", "uncommon", "rare", "epic", "legendary"
    "content": "Текст описания или эффекта. Поддерживает теги <b>жирный</b>, <i>курсив</i>, <u>подчеркнутый</u>, <s>зачеркнутый</s>, а также переносы строк <br>",
    "stats": [
      { "label": "Расход", "value": "15 Маны" },
      { "label": "Дистанция", "value": "Ближний бой" }
    ],
    "cardNumber": "001", // Необязательное поле
    "fontSize": 9 // Необязательное поле (размер шрифта описания, по умолчанию 9)
  }
]

Пожалуйста, сгенерируй для меня интересный тематический набор из 3-5 карточек по этой структуре. Верни только чистый JSON-массив без лишних слов.`;

    navigator.clipboard.writeText(templatePrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  // Sanitizes unescaped newlines within JSON string fields
  const sanitizeJsonString = (str: string): string => {
    let result = '';
    let inString = false;
    let escape = false;
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (escape) {
        result += char;
        escape = false;
        continue;
      }
      if (char === '\\') {
        result += char;
        escape = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        result += char;
        continue;
      }
      if (inString && (char === '\n' || char === '\r')) {
        result += '\\n';
        continue;
      }
      result += char;
    }
    return result;
  };

  // Apply JSON pasted text
  const handleApplyJsonText = (append: boolean = false) => {
    try {
      setJsonError(null);
      const sanitizedInput = sanitizeJsonString(jsonInput);
      const parsed = JSON.parse(sanitizedInput);
      
      if (Array.isArray(parsed)) {
        const seenIds = new Set<string>();
        const validated = parsed.map((item: any, idx: number) => {
          let importId = item.id;
          if (!importId || seenIds.has(importId)) {
            importId = `${Date.now()}-import-${idx}-${Math.floor(Math.random() * 1000000)}`;
          }
          seenIds.add(importId);

          return {
            id: importId,
            typeId: item.typeId || 'item',
            title: item.title || 'Без названия',
            subtitle: item.subtitle || '',
            content: item.content || item.description || '',
            stats: Array.isArray(item.stats) ? item.stats : [],
            rarity: item.rarity || 'common',
            artUrl: item.artUrl || '',
            customColor: item.customColor || undefined,
            customSubColor: item.customSubColor || undefined,
            customIcon: item.customIcon || undefined,
            illustrationHeight: item.illustrationHeight !== undefined ? Number(item.illustrationHeight) : undefined,
            illustrationScale: item.illustrationScale || undefined,
            illustrationPositionX: item.illustrationPositionX || undefined,
            illustrationPositionY: item.illustrationPositionY || undefined,
            illustrationRotation: item.illustrationRotation !== undefined ? Number(item.illustrationRotation) : undefined,
            footerText: item.footerText || undefined,
            customFooterTextColor: item.customFooterTextColor || undefined,
            hideFooter: item.hideFooter !== undefined ? !!item.hideFooter : false,
            footerTextLeft: item.footerTextLeft || undefined,
            footerTextMiddle: item.footerTextMiddle || undefined,
            footerTextRight: item.footerTextRight || undefined,
            hideFooterLeft: item.hideFooterLeft !== undefined ? !!item.hideFooterLeft : undefined,
            hideFooterMiddle: item.hideFooterMiddle !== undefined ? !!item.hideFooterMiddle : undefined,
            hideFooterRight: item.hideFooterRight !== undefined ? !!item.hideFooterRight : undefined,
            customFooterLeftColor: item.customFooterLeftColor || undefined,
            customFooterMiddleColor: item.customFooterMiddleColor || undefined,
            customFooterRightColor: item.customFooterRightColor || undefined,
            enableTextOverflow: item.enableTextOverflow !== undefined ? !!item.enableTextOverflow : true,
            cardNumber: item.cardNumber || undefined,
            customCardNumberColor: item.customCardNumberColor || undefined,
            fontSize: item.fontSize !== undefined ? Number(item.fontSize) : undefined,
            contentAlign: (['left', 'center', 'right', 'justify'].includes(item.contentAlign)) ? item.contentAlign : undefined,
          };
        });
        
        if (append) {
          // ensure imported cards get unique ids if they collide, or just append them.
          const existingIds = new Set(cards.map(c => c.id));
          const validatedWithUniqueIds = validated.map((c, idx) => {
            if (existingIds.has(c.id)) {
              return { ...c, id: `${Date.now()}-append-${idx}-${Math.floor(Math.random() * 1000000)}` };
            }
            return c;
          });
          const combined = [...cards, ...validatedWithUniqueIds];
          saveCards(combined);
          if (validatedWithUniqueIds.length > 0) {
            setSelectedCardId(validatedWithUniqueIds[0].id);
          }
          syncDeckImagesToLibrary(validatedWithUniqueIds, cardBackUrl);
          showToast(`Добавлено карточек в колоду: ${validatedWithUniqueIds.length}`);
        } else {
          saveCards(validated);
          if (validated.length > 0) {
            setSelectedCardId(validated[0].id);
          }
          syncDeckImagesToLibrary(validated, cardBackUrl);
          showToast('Колода успешно заменена!');
        }
        
        setJsonModalOpen(false);
        setJsonInput('');
      } else {
        setJsonError('JSON должен быть массивом объектов. Пожалуйста, проверьте образец промта.');
      }
    } catch (e: any) {
      console.error(e);
      setJsonError(`Неверный формат JSON: ${e.message}. Убедитесь, что все скобки, кавычки и запятые расставлены верно.`);
    }
  };

  // Filters logic for card list in editor sidebar
  const filteredCards = cards.filter(card => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
                          (card.title || '').toLowerCase().includes(q) ||
                          (card.subtitle || '').toLowerCase().includes(q) ||
                          (card.content || '').toLowerCase().includes(q);
    const matchesType = selectedTypeFilter === 'all' || card.typeId === selectedTypeFilter;
    const matchesRarity = selectedRarityFilter === 'all' || (card.rarity || 'none') === selectedRarityFilter;
    return matchesSearch && matchesType && matchesRarity;
  });

  // Filters and sorting logic for View Mode
  const viewProcessedCards = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let result = cards.filter(card => {
      const matchesSearch = !q ||
                            (card.title || '').toLowerCase().includes(q) ||
                            (card.subtitle || '').toLowerCase().includes(q) ||
                            (card.content || '').toLowerCase().includes(q);
      const matchesType = selectedTypeFilter === 'all' || card.typeId === selectedTypeFilter;
      const matchesRarity = selectedRarityFilter === 'all' || (card.rarity || 'none') === selectedRarityFilter;
      return matchesSearch && matchesType && matchesRarity;
    });

    if (sortOrder === 'title_asc') {
      result = [...result].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'ru', { sensitivity: 'base' }));
    } else if (sortOrder === 'title_desc') {
      result = [...result].sort((a, b) => (b.title || '').localeCompare(a.title || '', 'ru', { sensitivity: 'base' }));
    } else if (sortOrder === 'type') {
      const typeMap = new Map<string, number>(cardTypes.map((t, i) => [t.id, i]));
      result = [...result].sort((a, b) => ((typeMap.get(a.typeId) ?? 999) as number) - ((typeMap.get(b.typeId) ?? 999) as number));
    } else if (sortOrder === 'rarity') {
      const rarityMap = new Map<string, number>(rarities.map((r, i) => [r.id, i]));
      result = [...result].sort((a, b) => ((rarityMap.get(a.rarity || 'none') ?? 999) as number) - ((rarityMap.get(b.rarity || 'none') ?? 999) as number));
    }

    return result;
  }, [cards, searchQuery, selectedTypeFilter, selectedRarityFilter, sortOrder, cardTypes, rarities]);

  // Get active style colors
  const getCardColors = (card: Card) => {
    const typeInfo = cardTypes.find(t => t.id === card.typeId) || cardTypes[0] || {
      color: '#292524',
      subColor: '#44403c',
      icon: 'HelpCircle'
    };
    return {
      primary: card.customColor || typeInfo.color,
      secondary: card.customSubColor || typeInfo.subColor,
      icon: card.customIcon || typeInfo.icon
    };
  };

  const handleApplyColorPreset = (preset: ColorPreset) => {
    if (!selectedCard) return;
    handleUpdateMultipleFields({
      customColor: preset.colors.customColor,
      customTitleColor: preset.colors.customTitleColor,
      customSubColor: preset.colors.customSubColor,
      customSubtitleColor: preset.colors.customSubtitleColor,
      customStatsBgColor: preset.colors.customStatsBgColor,
      customStatsTextColor: preset.colors.customStatsTextColor,
      customContentBgColor: preset.colors.customContentBgColor,
      customContentColor: preset.colors.customContentColor,
      customFooterTextColor: preset.colors.customFooterTextColor,
    });
    setSelectedColorPresetId(preset.id);
    showToast(`Цветовой пресет «${preset.name}» применён!`, 'success');
  };

  const handleSaveCurrentAsPreset = () => {
    if (!selectedCard) return;
    const trimmedName = newPresetName.trim() || `Пресет ${colorPresets.length + 1}`;
    const cardColors = getCardColors(selectedCard);
    
    const newPreset: ColorPreset = {
      id: 'preset_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      name: trimmedName,
      colors: {
        customColor: selectedCard.customColor || cardColors.primary,
        customTitleColor: selectedCard.customTitleColor || '#ffffff',
        customSubColor: selectedCard.customSubColor || cardColors.secondary,
        customSubtitleColor: selectedCard.customSubtitleColor || '#ffffff',
        customStatsBgColor: selectedCard.customStatsBgColor || '#f5f5f4',
        customStatsTextColor: selectedCard.customStatsTextColor || '#1c1917',
        customContentBgColor: selectedCard.customContentBgColor || '#fafaf9',
        customContentColor: selectedCard.customContentColor || '#1c1917',
        customFooterTextColor: selectedCard.customFooterTextColor || '#a8a29e',
      }
    };

    const updated = [...colorPresets, newPreset];
    saveColorPresets(updated);
    setSelectedColorPresetId(newPreset.id);
    setIsSaveColorPresetModalOpen(false);
    setNewPresetName('');
    showToast(`Пресет «${trimmedName}» успешно сохранён!`, 'success');
  };

  const handleUpdatePresetColor = (presetId: string, colorKey: keyof PresetColors, newColor: string) => {
    const updated = colorPresets.map(p => {
      if (p.id === presetId) {
        return {
          ...p,
          colors: {
            ...p.colors,
            [colorKey]: newColor,
          }
        };
      }
      return p;
    });
    saveColorPresets(updated);
    
    // If this preset is the currently selected one on the active card, update the card as well
    if (selectedColorPresetId === presetId && selectedCard) {
      handleUpdateCardField(colorKey as keyof Card, newColor as any);
    }
  };

  const handleStartRenamePreset = (preset: ColorPreset) => {
    setEditingPresetId(preset.id);
    setEditingPresetName(preset.name);
  };

  const handleSaveRenamePreset = (presetId: string) => {
    if (!editingPresetName.trim()) {
      setEditingPresetId(null);
      return;
    }
    const updated = colorPresets.map(p => {
      if (p.id === presetId) {
        return { ...p, name: editingPresetName.trim() };
      }
      return p;
    });
    saveColorPresets(updated);
    setEditingPresetId(null);
    showToast('Название пресета обновлено', 'success');
  };

  const handleDeletePreset = (presetId: string) => {
    const preset = colorPresets.find(p => p.id === presetId);
    const presetName = preset ? preset.name : 'пресет';
    
    requestConfirmation(
      'delete_preset',
      () => {
        const updated = colorPresets.filter(p => p.id !== presetId);
        saveColorPresets(updated);
        if (selectedColorPresetId === presetId) {
          setSelectedColorPresetId('');
        }
        showToast(`Пресет «${presetName}» удалён`, 'info');
      },
      {
        title: 'УДАЛЕНИЕ ЦВЕТОВОГО ПРЕСЕТА',
      }
    );
  };

  const handleResetPresetsToDefault = () => {
    requestConfirmation(
      'delete_preset',
      () => {
        saveColorPresets(DEFAULT_COLOR_PRESETS);
        setSelectedColorPresetId('');
        showToast('Пресеты сброшены к стандартным', 'info');
      },
      {
        title: 'Сброс пресетов к стандартным',
      }
    );
  };

  const getRarityLabel = (rarityId?: CardRarity) => {
    if (!rarityId || rarityId === 'none') return '';
    const found = rarities.find(r => r.id === rarityId);
    return found ? found.name.toUpperCase() : '';
  };

  const getRarityStyles = (rarityId?: CardRarity) => {
    if (!rarityId || rarityId === 'none') {
      return {
        border: 'border-stone-400',
        badgeBg: 'hidden',
        glow: '',
        headingGlow: '',
        glowColor: '#78716c',
      };
    }
    const found = rarities.find(r => r.id === rarityId);
    const preset = found ? found.stylePreset : 'common';

    if (preset === 'custom' && found?.customColor) {
      const hex = found.customColor;
      return {
        border: '', // overridden in inline styles
        badgeBg: '',
        glow: '', // overridden in inline styles
        headingGlow: '', // overridden in inline styles
        customBorderColor: hex,
        customGlowStyle: `0 0 15px ${hex}50`,
        customHeadingGlowStyle: { textShadow: `0 0 8px ${hex}80` },
        glowColor: hex,
      };
    }

    switch (preset) {
      case 'uncommon':
        return {
          border: 'border-emerald-600',
          badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          glow: 'shadow-[0_0_12px_rgba(16,185,129,0.15)]',
          headingGlow: '',
          glowColor: '#10b981',
        };
      case 'rare':
        return {
          border: 'border-blue-600',
          badgeBg: 'bg-blue-50 text-blue-800 border-blue-300',
          glow: 'shadow-[0_0_15px_rgba(59,130,246,0.25)]',
          headingGlow: 'text-shadow-[0_0_8px_rgba(59,130,246,0.5)]',
          glowColor: '#3b82f6',
        };
      case 'epic':
        return {
          border: 'border-purple-600',
          badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
          glow: 'shadow-[0_0_20px_rgba(168,85,247,0.4)]',
          headingGlow: 'text-shadow-[0_0_10px_rgba(168,85,247,0.6)]',
          glowColor: '#a855f7',
        };
      case 'legendary':
        return {
          border: 'border-amber-500',
          badgeBg: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 border-amber-300 font-extrabold',
          glow: 'shadow-[0_0_25px_rgba(245,158,11,0.5)] ring-2 ring-amber-400/20',
          headingGlow: 'text-shadow-[0_0_12px_rgba(245,158,11,0.8)]',
          glowColor: '#f59e0b',
        };
      case 'common':
      default:
        return {
          border: 'border-stone-500',
          badgeBg: 'bg-stone-100 text-stone-800 border-stone-300',
          glow: '',
          headingGlow: '',
          glowColor: '#78716c',
        };
    }
  };

  const getRarityBadgeStyle = (card: Card) => {
    if (!card.rarity || card.rarity === 'none') {
      return { bg: 'transparent', text: 'transparent', isSubtitleStyle: true };
    }
    
    const found = rarities.find(r => r.id === card.rarity);
    const preset = found ? found.stylePreset : 'common';
    
    let defaultMatchGlow = true;
    let defaultBadgeColor = undefined;
    if (found) {
      if (found.matchGlowColor !== undefined) {
        defaultMatchGlow = found.matchGlowColor;
      }
      if (found.customBadgeColor !== undefined) {
        defaultBadgeColor = found.customBadgeColor;
      }
    }

    const matchGlowColor = card.matchGlowColor !== undefined ? card.matchGlowColor : defaultMatchGlow;
    const badgeColor = card.customRarityBadgeColor !== undefined ? card.customRarityBadgeColor : defaultBadgeColor;

    if (!matchGlowColor && badgeColor === 'subtitle') {
      return { bg: 'rgba(0,0,0,0.2)', text: card.customSubtitleColor || 'rgba(255, 255, 255, 0.95)', isSubtitleStyle: true };
    }

    let glowColor = '#78716c';
    if (preset === 'custom' && found?.customColor) {
      glowColor = found.customColor;
    } else {
      switch (preset) {
        case 'uncommon': glowColor = '#10b981'; break;
        case 'rare': glowColor = '#3b82f6'; break;
        case 'epic': glowColor = '#a855f7'; break;
        case 'legendary': glowColor = '#f59e0b'; break;
        case 'common':
        default:
          glowColor = '#78716c'; break;
      }
    }

    let bg = glowColor;
    if (!matchGlowColor && badgeColor) {
      bg = badgeColor;
    }

    // Determine text color based on background luminance
    let text = '#ffffff';
    const cleanBg = bg.toLowerCase();
    const isLight = cleanBg === '#ffffff' || 
                    cleanBg === '#f59e0b' || 
                    cleanBg === '#fbbf24' || 
                    cleanBg === '#facc15' || 
                    cleanBg === '#eab308' ||
                    cleanBg.startsWith('#fff') ||
                    cleanBg === '#a3e635' ||
                    cleanBg === '#fb7185' ||
                    cleanBg === '#f87171';
    if (isLight) {
      text = '#1c1917';
    }

    return { bg, text, isSubtitleStyle: false };
  };

  const renderCardBackContent = (card: Card | null | undefined, pageIdx: number = 0, forceGeneral: boolean = false) => {
    if (!card) return null;
    const isContinuation = !forceGeneral && cardBackEnabled && card.shirtMode === 'continuation' && card.enableTextOverflow !== false;
    const pages = getCardPages(card, rarities);
    const hasNextPage = pageIdx + 1 < pages.length;

    if (isContinuation && hasNextPage) {
      // Render the next page as the card back
      const nextPageIdx = pageIdx + 1;
      const pageContent = pages[nextPageIdx];
      const colors = getCardColors(card);
      const rarityStyle = getRarityStyles(card.rarity);

      return (
        <div className="w-full h-full bg-white flex flex-col overflow-hidden relative">
          {/* Header Section */}
          <div
            className="px-2 py-1.5 flex items-center justify-between gap-1 border-b border-stone-950 shrink-0 text-white"
            style={{ backgroundColor: colors.primary, color: card.customTitleColor || '#ffffff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
          >
            <h4 
              className={`font-serif font-black tracking-tight leading-tight grow break-words ${
                card.autoScaleTitle !== false
                  ? `${getTitleFontSize(card.title || 'БЕЗ НАЗВАНИЯ', card.showIcon !== false)} whitespace-normal`
                  : 'text-sm truncate'
              } ${rarityStyle.headingGlow}`} 
              style={{ 
                textShadow: '1px 1px 0px rgba(0,0,0,0.8)', 
                color: card.customTitleColor || '#ffffff',
                ...rarityStyle.customHeadingGlowStyle
              }}
            >
              {card.title || 'БЕЗ НАЗВАНИЯ'}
              <span className="text-[10px] opacity-75 font-mono ml-1">({nextPageIdx + 1}/{pages.length})</span>
            </h4>
            {card.showIcon !== false && (
              <div className="w-6 h-6 rounded bg-black/25 flex items-center justify-center shrink-0 border border-white/20">
                <CardIcon name={colors.icon} size={13} style={{ color: card.customTitleColor || '#ffffff' }} />
              </div>
            )}
          </div>

          {/* Subtitle / Subtype bar */}
          {(!card.hideSubtitle || (card.rarity && card.rarity !== 'none')) && (
            <div
              className="px-2 py-1 font-serif font-bold tracking-wide uppercase border-b border-stone-950 shrink-0 flex justify-between items-center gap-1.5 min-w-0 h-auto min-h-[22px]"
              style={{ backgroundColor: colors.secondary, color: card.customSubtitleColor || 'rgba(255, 255, 255, 0.95)', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
            >
              <span className={`${getSubtitleFontSize(!card.hideSubtitle ? (card.subtitle || 'Снаряжение / Особенность') : '')} break-words whitespace-pre-wrap leading-tight grow min-w-0`}>
                {!card.hideSubtitle ? (card.subtitle || 'Снаряжение / Особенность') : ''}
              </span>
              {card.rarity && card.rarity !== 'none' && (() => {
                const badgeStyle = getRarityBadgeStyle(card);
                return (
                  <span 
                    className={`text-[8px] px-1 py-0.5 rounded tracking-normal shrink-0 font-bold ${
                      badgeStyle.isSubtitleStyle 
                        ? '' 
                        : 'border border-black/10 shadow-sm'
                    }`} 
                    style={{ 
                      backgroundColor: badgeStyle.bg, 
                      color: badgeStyle.text,
                      WebkitPrintColorAdjust: 'exact',
                      printColorAdjust: 'exact'
                    }}
                  >
                    {getRarityLabel(card.rarity)}
                  </span>
                );
              })()}
            </div>
          )}

          {/* Rich Description Block */}
          <div className="flex-1 p-2.5 overflow-hidden flex flex-col justify-between"
               style={{ backgroundColor: card.customContentBgColor || 'rgba(250, 250, 249, 0.5)', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
            <div
              className={`leading-relaxed ${getContentAlignClass(card.contentAlign)} overflow-hidden pr-0.5 flex-1 min-h-0 break-words font-body ${getContentFontSize(card.content || '')}`}
              style={{
                color: card.customContentColor || '#1c1917',
                fontSize: card.fontSize !== undefined ? `${card.fontSize}px` : '9px',
                textAlign: card.contentAlign || 'justify'
              }}
              dangerouslySetInnerHTML={{
                __html: pageContent || '<i>Описание отсутствует...</i>',
              }}
            />
            {renderCardFooter(card)}
          </div>
        </div>
      );
    }

    // Determine the background image settings to render
    const useIndividualImage = !forceGeneral && cardBackEnabled && card.shirtMode === 'image' && card.shirtUrl;
    const activeBackUrl = useIndividualImage ? card.shirtUrl : cardBackUrl;
    const activeScale = useIndividualImage ? (card.shirtScale !== undefined ? card.shirtScale : 100) : cardBackScale;
    const activeX = useIndividualImage ? (card.shirtPositionX !== undefined ? card.shirtPositionX : 0) : cardBackPositionX;
    const activeY = useIndividualImage ? (card.shirtPositionY !== undefined ? card.shirtPositionY : 0) : cardBackPositionY;
    const activeRotation = useIndividualImage ? (card.shirtRotation !== undefined ? card.shirtRotation : 0) : cardBackRotation;

    if (cardBackEnabled && activeBackUrl) {
      return (
        <div className="w-full h-full relative overflow-hidden">
          <img
            src={activeBackUrl}
            alt="Рубашка"
            className="absolute max-w-none max-h-none"
            style={{
              left: '50%',
              top: '50%',
              width: 'auto',
              height: 'auto',
              minWidth: '100%',
              minHeight: '100%',
              transform: `translate(-50%, -50%) translate(${activeX}px, ${activeY}px) scale(${activeScale / 100}) rotate(${activeRotation}deg)`,
              transformOrigin: 'center center',
            }}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
          />
        </div>
      );
    }

    // Default Medallion card back
    return (
      <div className="w-full h-full bg-gradient-to-b from-stone-900 via-stone-800 to-stone-950 flex flex-col items-center justify-start p-4 relative">
        {/* Inner gold border */}
        <div 
          className="absolute inset-2 border border-amber-600/30 rounded" 
          style={{ borderRadius: card.borderRadius !== undefined ? `${Math.max(0, card.borderRadius - 2)}px` : '2px' }} 
        />
        <div className="absolute inset-4 border border-stone-700/50 rounded" />
        
        {/* Top ornament */}
        <div className="text-amber-500/40 text-[8px] font-serif tracking-widest uppercase mt-4 z-10">
          • SORA •
        </div>

        {/* Medallion */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-amber-600/40 bg-stone-950/80 flex items-center justify-center shadow-lg z-10 overflow-hidden">
          <div 
            className="absolute inset-1.5 border border-amber-500/20 rounded-full animate-spin" 
            style={{ animationDuration: '16s' }}
          />
          <div className="text-amber-500 font-serif font-bold text-4xl relative z-10 drop-shadow-[0_0_2px_rgba(255,255,255,0.95)]">
            S
          </div>
        </div>
      </div>
    );
  };

  const handleDownloadDefaultCardBackSvg = () => {
    const brandName = 'SORA';
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 420" width="750" height="1050">
  <defs>
    <linearGradient id="cardBackGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1c1917" />
      <stop offset="50%" stop-color="#292524" />
      <stop offset="100%" stop-color="#0c0a09" />
    </linearGradient>
    <radialGradient id="medallionBg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1c1917" />
      <stop offset="100%" stop-color="#0c0a09" />
    </radialGradient>
    <filter id="medallionShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Background Card Base -->
  <rect width="300" height="420" fill="url(#cardBackGradient)" rx="10" />

  <!-- Outer Amber Border -->
  <rect x="12" y="12" width="276" height="396" rx="6" fill="none" stroke="#d97706" stroke-opacity="0.35" stroke-width="1.5" />

  <!-- Inner Stone Border -->
  <rect x="20" y="20" width="260" height="380" rx="4" fill="none" stroke="#78716c" stroke-opacity="0.4" stroke-width="1" />

  <!-- Top Brand Ornament -->
  <text x="150" y="52" text-anchor="middle" font-family="'Cinzel', 'Georgia', serif" font-size="10" font-weight="700" fill="#f59e0b" fill-opacity="0.45" letter-spacing="4">• ${brandName} •</text>

  <!-- Central Medallion -->
  <g filter="url(#medallionShadow)">
    <circle cx="150" cy="210" r="48" fill="url(#medallionBg)" stroke="#d97706" stroke-opacity="0.45" stroke-width="2" />
    <circle cx="150" cy="210" r="42" fill="none" stroke="#f59e0b" stroke-opacity="0.25" stroke-width="1" stroke-dasharray="4,2" />
    
    <!-- Central Emblem -->
    <g transform="translate(150, 210) scale(0.12) translate(-256, -128.5)" fill="#f59e0b">
      <path d="M0 0L176 81.5L256 257L83 174L0 0Z" fill="#f59e0b" fill-rule="evenodd" />
      <path d="M0 0L176 81.5L256 257L83 174L0 0Z" fill="#f59e0b" fill-rule="evenodd" transform="matrix(-1 0 0 1 512 0)" />
    </g>
  </g>

  <!-- Bottom Brand Ornament -->
  <text x="150" y="380" text-anchor="middle" font-family="'Cinzel', 'Georgia', serif" font-size="10" font-weight="700" fill="#f59e0b" fill-opacity="0.45" letter-spacing="4">• ${brandName} •</text>
</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${isEn ? 'Vitruvium_Card_Back' : 'Рубашка_ВИТРУВИЙ'}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const isIframe = window.self !== window.top;
    if (isIframe) {
      setShowPrintWarning(true);
    } else {
      window.print();
    }
  };

  const handleDownloadPNGDeck = () => {
    if (cards.length === 0) return;

    requestConfirmation('download', async () => {
      const steps = appSettings.language === 'en' ? EXPORT_STEPS_DECK_EN : EXPORT_STEPS_DECK_RU;
      const isEn = appSettings.language === 'en';

      setExportProgress({
        active: true,
        progress: 5,
        stepText: steps[0]
      });

      await new Promise(r => setTimeout(r, 600));
      setExportProgress({
        active: true,
        progress: 15,
        stepText: steps[1]
      });

      await new Promise(r => setTimeout(r, 600));
      setExportProgress({
        active: true,
        progress: 30,
        stepText: steps[2]
      });

      await new Promise(r => setTimeout(r, 600));
      setExportProgress({
        active: true,
        progress: 45,
        stepText: steps[3]
      });

      await new Promise(r => setTimeout(r, 600));
      setExportProgress({
        active: true,
        progress: 60,
        stepText: steps[4]
      });

      await new Promise(r => setTimeout(r, 600));
      setExportProgress({
        active: true,
        progress: 75,
        stepText: steps[5]
      });

      await new Promise(r => setTimeout(r, 600));
      setExportProgress({
        active: true,
        progress: 85,
        stepText: steps[6]
      });

      try {
        const JSZipModule = await import('jszip');
        const JSZip = JSZipModule.default || (JSZipModule as any).JSZip || JSZipModule;
        const htmlToImage = await import('html-to-image');
        const zip = new (JSZip as any)();

        // Gather all pages of all cards
        const flatCards = cards.flatMap((card, cardIdx) => {
          const pages = getCardPages(card, rarities);
          return pages.map((pageContent, pageIdx) => ({
            card,
            cardIdx,
            pageContent,
            pageIdx,
            totalPages: pages.length
          }));
        });

        for (let i = 0; i < flatCards.length; i++) {
          const { card, cardIdx, pageContent, pageIdx, totalPages } = flatCards[i];
          const percent = 85 + Math.round((i / flatCards.length) * 10);
          
          setExportProgress({
            active: true,
            progress: percent,
            stepText: isEn 
              ? `Magical seal is being applied to card: "${card.title || 'UNTITLED'}" ${totalPages > 1 ? `(pg. ${pageIdx + 1})` : ''}...`
              : `Магическая печать наносится на карту: "${card.title || 'БЕЗ НАЗВАНИЯ'}" ${totalPages > 1 ? `(стр. ${pageIdx + 1})` : ''}...`
          });

          // Small pause for React rendering updates
          await new Promise(r => requestAnimationFrame(r));
          await new Promise(r => setTimeout(r, 150));

          const elementId = `export-card-${cardIdx}-${pageIdx}`;
          const element = document.getElementById(elementId);
          if (element) {
            const dataUrl = await htmlToImage.toPng(element, {
              cacheBust: true,
              pixelRatio: 2.5,
              style: {
                transform: 'scale(1)',
                transformOrigin: 'top left',
              }
            });

            const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
            const safeTitle = (card.title || (isEn ? 'UNTITLED' : 'БЕЗ НАЗВАНИЯ')).replace(/[\\/:*?"<>|]/g, '_').trim();
            const filename = totalPages > 1
              ? `${safeTitle}_${isEn ? 'pg' : 'стр'}_${pageIdx + 1}.png`
              : `${safeTitle}.png`;

            zip.file(filename, base64Data, { base64: true });
          }
        }

        // Add Card Back to zip if enabled
        if (cardBackEnabled) {
          setExportProgress({
            active: true,
            progress: 95,
            stepText: isEn ? 'Inscribing runes onto the card back...' : 'Наносим руны на рубашку карт...'
          });
          await new Promise(r => requestAnimationFrame(r));
          await new Promise(r => setTimeout(r, 150));

          const element = document.getElementById('export-cardback');
          if (element) {
            const dataUrl = await htmlToImage.toPng(element, {
              cacheBust: true,
              pixelRatio: 2.5,
              style: {
                transform: 'scale(1)',
                transformOrigin: 'top left',
              }
            });
            const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
            zip.file(isEn ? 'Card_Back.png' : 'Рубашка.png', base64Data, { base64: true });
          }

          // Capture individual card backs if they have a custom shirt image
          for (let cardIdx = 0; cardIdx < cards.length; cardIdx++) {
            const card = cards[cardIdx];
            if (card.shirtMode === 'image' && card.shirtUrl) {
              const backElementId = `export-cardback-${cardIdx}`;
              const backElement = document.getElementById(backElementId);
              if (backElement) {
                const dataUrl = await htmlToImage.toPng(backElement, {
                  cacheBust: true,
                  pixelRatio: 2.5,
                  style: {
                    transform: 'scale(1)',
                    transformOrigin: 'top left',
                  }
                });
                const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
                const safeTitle = (card.title || (isEn ? 'UNTITLED' : 'БЕЗ НАЗВАНИЯ')).replace(/[\\/:*?"<>|]/g, '_').trim();
                zip.file(`${safeTitle} - ${isEn ? 'Back' : 'Рубашка'}.png`, base64Data, { base64: true });
              }
            }
          }
        }

        setExportProgress({
          active: true,
          progress: 96,
          stepText: steps[7]
        });
        await new Promise(r => setTimeout(r, 600));

        const content = await zip.generateAsync({ type: 'blob' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = isEn ? 'My Sora Deck.zip' : 'Моя колода Sora.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setExportProgress({
          active: true,
          progress: 100,
          stepText: steps[8]
        });

        await new Promise(r => setTimeout(r, 1000));
      } catch (err) {
        console.error('Error exporting PNG pack:', err);
        requestAlert('export_png_error');
      } finally {
        setExportProgress({ active: false, progress: 0, stepText: '' });
      }
    });
  };

  const handleDownloadSingleCardPNG = (card: Card) => {
    if (!card) return;
    const cardIdx = cards.findIndex(c => c.id === card.id);
    if (cardIdx === -1) return;

    requestConfirmation('download_single', async () => {
      const steps = appSettings.language === 'en' ? EXPORT_STEPS_SINGLE_EN : EXPORT_STEPS_SINGLE_RU;
      const isEn = appSettings.language === 'en';

      setExportProgress({
        active: true,
        progress: 5,
        stepText: steps[0],
        isSingleCard: true
      });

      await new Promise(r => setTimeout(r, 650));
      setExportProgress({
        active: true,
        progress: 25,
        stepText: steps[1],
        isSingleCard: true
      });

      await new Promise(r => setTimeout(r, 650));
      setExportProgress({
        active: true,
        progress: 50,
        stepText: steps[2],
        isSingleCard: true
      });

      await new Promise(r => setTimeout(r, 650));
      setExportProgress({
        active: true,
        progress: 75,
        stepText: steps[3],
        isSingleCard: true
      });

      await new Promise(r => setTimeout(r, 650));
      setExportProgress({
        active: true,
        progress: 90,
        stepText: steps[4],
        isSingleCard: true
      });

      try {
        const pages = getCardPages(card, rarities);
        const htmlToImage = await import('html-to-image');
        const safeTitle = (card.title || (isEn ? 'UNTITLED' : 'БЕЗ НАЗВАНИЯ')).replace(/[\\/:*?"<>|]/g, '_').trim();

        const hasIndividualBack = cardBackEnabled && card.shirtMode === 'image' && !!card.shirtUrl;

        if (pages.length <= 1 && !hasIndividualBack) {
          // Download directly as a single PNG file
          setExportProgress({
            active: true,
            progress: 95,
            stepText: isEn ? 'Performing final crystallization into PNG...' : 'Производим окончательную кристаллизацию в PNG...',
            isSingleCard: true
          });
          await new Promise(r => requestAnimationFrame(r));
          await new Promise(r => setTimeout(r, 200));

          const elementId = `export-card-${cardIdx}-0`;
          const element = document.getElementById(elementId);
          if (element) {
            const dataUrl = await htmlToImage.toPng(element, {
              cacheBust: true,
              pixelRatio: 2.5,
              style: {
                transform: 'scale(1)',
                transformOrigin: 'top left',
              }
            });

            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `${safeTitle}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } else {
            throw new Error('Preview card element not found');
          }
        } else {
          // Download as a ZIP of all split pages and/or back
          setExportProgress({
            active: true,
            progress: 93,
            stepText: isEn ? 'Packing scrolls into sealed tube...' : 'Упаковываем страницы в запечатанный тубус...',
            isSingleCard: true
          });
          const JSZipModule = await import('jszip');
          const JSZip = JSZipModule.default || (JSZipModule as any).JSZip || JSZipModule;
          const zip = new (JSZip as any)();

          for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
            setExportProgress({
              active: true,
              progress: 93 + Math.round((pageIdx / pages.length) * 3),
              stepText: isEn 
                ? `Sealing page ${pageIdx + 1} with wax...`
                : `Запечатываем страницу ${pageIdx + 1} сургучом...`,
              isSingleCard: true
            });

            await new Promise(r => requestAnimationFrame(r));
            await new Promise(r => setTimeout(r, 200));

            const elementId = `export-card-${cardIdx}-${pageIdx}`;
            const element = document.getElementById(elementId);
            if (element) {
              const dataUrl = await htmlToImage.toPng(element, {
                cacheBust: true,
                pixelRatio: 2.5,
                style: {
                  transform: 'scale(1)',
                  transformOrigin: 'top left',
                }
              });

              const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
              const filename = pages.length > 1 
                ? `${safeTitle}_${isEn ? 'pg' : 'стр'}_${pageIdx + 1}.png`
                : `${safeTitle}.png`;
              zip.file(filename, base64Data, { base64: true });
            }
          }

          // Add card back if card backs are enabled and we have an individual back
          if (hasIndividualBack) {
            setExportProgress({
              active: true,
              progress: 97,
              stepText: isEn ? 'Magical seal is applied to card back...' : 'Магическая печать наносится на рубашку...',
              isSingleCard: true
            });
            await new Promise(r => requestAnimationFrame(r));
            await new Promise(r => setTimeout(r, 200));

            const elementId = `export-cardback-${cardIdx}`;
            const element = document.getElementById(elementId);
            if (element) {
              const dataUrl = await htmlToImage.toPng(element, {
                cacheBust: true,
                pixelRatio: 2.5,
                style: {
                  transform: 'scale(1)',
                  transformOrigin: 'top left',
                }
              });
              const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
              zip.file(`${safeTitle} - ${isEn ? 'Back' : 'Рубашка'}.png`, base64Data, { base64: true });
            }
          }

          const content = await zip.generateAsync({ type: 'blob' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(content);
          link.download = `${safeTitle}.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        setExportProgress({
          active: true,
          progress: 100,
          stepText: steps[5],
          isSingleCard: true
        });

        await new Promise(r => setTimeout(r, 1000));
      } catch (err) {
        console.error('Error exporting single card:', err);
        requestAlert('export_png_error');
      } finally {
        setExportProgress({ active: false, progress: 0, stepText: '', isSingleCard: false });
      }
    });
  };

  // Dynamic lists helper methods
  const handleCreateType = (name: string, color: string, subColor: string, icon: string) => {
    if (!name.trim()) return;
    const newId = 'type_' + Date.now();
    const updated = [...cardTypes, { id: newId, name, color, subColor, icon }];
    saveCardTypes(updated);
  };

  const handleDeleteType = (id: string) => {
    if (cardTypes.length <= 1) {
      showToast(t.toastKeepAtLeastOneType, 'error');
      return;
    }
    requestConfirmation('delete_type', () => {
      const remainingTypes = cardTypes.filter(t => t.id !== id);
      const fallbackId = remainingTypes[0].id;
      const updatedCards = cards.map(c => c.typeId === id ? { ...c, typeId: fallbackId } : c);
      saveCardTypes(remainingTypes);
      saveCards(updatedCards);
      showToast(t.toastTypeDeleted);
    }, {
      title: t.deleteTypeModalTitle,
      confirmText: t.deleteTypeConfirmBtn,
      cancelText: t.deleteTypeCancelBtn
    });
  };

  const handleMoveType = (id: string, direction: 'up' | 'down') => {
    const index = cardTypes.findIndex(t => t.id === id);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= cardTypes.length) return;
    const updated = [...cardTypes];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    saveCardTypes(updated);
  };

  const handleCreateRarity = (name: string, stylePreset: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'custom', customColor?: string, matchGlowColor?: boolean, customBadgeColor?: string) => {
    if (!name.trim()) return;
    const newId = 'rarity_' + Date.now();
    const updated = [...rarities, { id: newId, name, stylePreset, customColor, matchGlowColor, customBadgeColor }];
    saveRarities(updated);
  };

  const handleDeleteRarity = (id: string) => {
    requestConfirmation('delete_rarity', () => {
      const remainingRarities = rarities.filter(r => r.id !== id);
      const updatedCards = cards.map(c => c.rarity === id ? { ...c, rarity: 'none' as CardRarity } : c);
      saveRarities(remainingRarities);
      saveCards(updatedCards);
      showToast(t.toastRarityDeleted);
    }, {
      title: t.deleteRarityModalTitle,
      confirmText: t.deleteRarityConfirmBtn,
      cancelText: t.deleteRarityCancelBtn
    });
  };

  const handleMoveRarity = (id: string, direction: 'up' | 'down') => {
    const index = rarities.findIndex(r => r.id === id);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= rarities.length) return;
    const updated = [...rarities];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    saveRarities(updated);
  };

  const pageBgStyle: React.CSSProperties = useMemo(() => {
    const style: React.CSSProperties = {};
    if (appSettings.pageBgColor) {
      style.backgroundColor = appSettings.pageBgColor;
    } else if (appSettings.theme === 'dark') {
      style.backgroundColor = '#1c1917';
    } else {
      style.backgroundColor = '#f5f5f4';
    }

    if (appSettings.pageBgImage) {
      style.backgroundImage = `url(${appSettings.pageBgImage})`;
      if (appSettings.pageBgFit === 'repeat') {
        style.backgroundRepeat = 'repeat';
        style.backgroundSize = 'auto';
      } else if (appSettings.pageBgFit === 'contain') {
        style.backgroundRepeat = 'no-repeat';
        style.backgroundSize = 'contain';
        style.backgroundPosition = 'center';
      } else {
        style.backgroundRepeat = 'no-repeat';
        style.backgroundSize = 'cover';
        style.backgroundPosition = 'center';
      }
      style.backgroundAttachment = 'fixed';
    }
    return style;
  }, [appSettings.pageBgColor, appSettings.pageBgImage, appSettings.pageBgFit, appSettings.theme]);

  return (
    <div
      className={`min-h-screen flex flex-col font-body selection:bg-stone-300 selection:text-stone-900 ${
        appSettings.theme === 'dark' ? 'dark text-stone-100' : 'text-stone-900'
      }`}
      style={pageBgStyle}
    >
      {/* Header */}
      <header className="no-print bg-stone-950 border-b border-stone-800 text-stone-100 py-3 xl:py-4 px-4 xl:px-6 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-3 xl:gap-4">
          
          {/* Logo, Title and Toggle */}
          <div className="flex items-center justify-between w-full xl:w-auto gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded bg-amber-600/20 flex items-center justify-center text-amber-500 shadow-inner shrink-0 overflow-hidden border border-amber-500/60 font-serif font-bold text-xl tracking-wider drop-shadow-[0_0_2px_rgba(255,255,255,0.9)]">
                S
              </div>
              <div className="min-w-0">
                <h1 className="text-lg xl:text-2xl font-bold font-serif tracking-wider uppercase text-amber-500 truncate">
                  {t.headerTitle || t.appName}
                </h1>
                <p className="text-[10px] xl:text-xs text-stone-400 truncate hidden sm:block">
                  {t.headerSubtitle || t.appSubtitle}
                </p>
              </div>
            </div>

            {/* Toggle Button for Mobile and Tablet */}
            <button
              onClick={toggleHeader}
              className="xl:hidden p-1.5 bg-stone-900 border border-stone-800 hover:border-amber-500/40 text-stone-400 hover:text-amber-500 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-amber-500 shrink-0 cursor-pointer"
              title={isHeaderExpanded ? t.collapseHeaderTooltip : t.expandHeaderTooltip}
            >
              {isHeaderExpanded ? <Icons.ChevronUp size={18} /> : <Icons.ChevronDown size={18} />}
            </button>
          </div>

          {/* Collapsible Action Buttons on Mobile */}
          <div
            className={`
              overflow-hidden transition-all duration-300 ease-in-out
              ${isHeaderExpanded 
                ? 'max-h-[500px] opacity-100 mt-2 xl:mt-0' 
                : 'max-h-0 opacity-0 xl:max-h-none xl:opacity-100'
              }
              flex flex-col xl:flex-row xl:items-center gap-3 xl:gap-4 w-full xl:w-auto
            `}
          >
            {/* Mobile-only visible sub-description when expanded */}
            <p className="text-[10px] text-stone-400 sm:hidden block pb-1 border-b border-stone-900 leading-relaxed">
              {t.headerSubtitle || t.appSubtitle}
            </p>

            <div className="flex items-center flex-wrap xl:flex-nowrap gap-2 xl:gap-2.5 w-full xl:w-auto">
              {/* PDF Print */}
              <button
                onClick={handlePrint}
                className="flex-1 xl:flex-initial flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-stone-900/90 border border-stone-800 hover:border-amber-500/50 hover:bg-stone-850 text-stone-300 hover:text-amber-400 transition-all cursor-pointer shadow-sm shrink-0"
                title={t.printPdfTooltip}
              >
                <Icons.Printer size={15} />
                <span>{t.printPdf}</span>
              </button>

              {/* PNG Download */}
              <button
                onClick={handleDownloadPNGDeck}
                className="flex-1 xl:flex-initial flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-stone-900/90 border border-stone-800 hover:border-amber-500/50 hover:bg-stone-850 text-stone-300 hover:text-amber-400 transition-all cursor-pointer shadow-sm shrink-0"
                title={t.downloadPngTooltip}
              >
                <Icons.FolderDown size={15} />
                <span>{t.downloadDeckPngBtn || t.downloadPng}</span>
              </button>

              {/* View Mode Toggle */}
              <button
                onClick={() => setIsViewMode(!isViewMode)}
                className={`flex-1 xl:flex-initial flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-sm shrink-0 ${
                  isViewMode
                    ? 'bg-amber-600 border-amber-500 text-stone-950 hover:bg-amber-500 font-bold'
                    : 'bg-stone-900/90 border-stone-800 hover:border-amber-500/50 hover:bg-stone-850 text-stone-300 hover:text-amber-400'
                }`}
                title={isViewMode ? t.editorModeTooltip : t.viewModeTooltip}
              >
                {isViewMode ? <Icons.Edit3 size={15} /> : <Icons.Eye size={15} />}
                <span>{isViewMode ? t.openEditorBtn : t.openViewModeBtn}</span>
              </button>

              {/* JSON Tools Box */}
              <div className="flex items-center justify-center bg-stone-900/90 border border-stone-800 rounded-lg p-1 w-full xl:w-auto gap-1 shrink-0">
                <button
                  onClick={handleExportJSON}
                  title={t.exportJsonTooltip}
                  className="flex-grow xl:flex-grow-0 p-1.5 text-stone-400 hover:text-amber-400 rounded hover:bg-stone-800 transition-colors flex justify-center cursor-pointer"
                >
                  <Icons.Upload size={15} />
                </button>
                <button
                  onClick={handleImportClick}
                  title={t.importJsonTooltip}
                  className="flex-grow xl:flex-grow-0 p-1.5 text-stone-400 hover:text-amber-400 rounded hover:bg-stone-800 transition-colors flex justify-center cursor-pointer"
                >
                  <Icons.Download size={15} />
                </button>
                <button
                  onClick={() => {
                    setJsonError(null);
                    setJsonModalOpen(true);
                  }}
                  title={t.editJsonTooltip}
                  className="flex-grow xl:flex-grow-0 p-1.5 text-stone-400 hover:text-amber-400 rounded hover:bg-stone-800 transition-colors flex justify-center cursor-pointer"
                >
                  <Icons.FileCode size={15} />
                </button>
              </div>

              {/* App Settings Button */}
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                title={t.settingsTooltip || t.settingsTitle}
                className="p-2 bg-stone-900/90 border border-stone-800 text-stone-400 hover:text-amber-400 hover:border-amber-500/50 rounded-lg transition-all w-full xl:w-auto flex justify-center cursor-pointer shrink-0"
              >
                <Icons.Settings size={15} />
              </button>

              {/* Divider line for desktop */}
              <div className="hidden xl:block h-6 w-px bg-stone-800/80 mx-0.5 shrink-0" />

              {/* Google Drive Auth / Decks Button (Far Right) */}
              {!driveAccessToken || !driveUserProfile ? (
                <button
                  onClick={() => setIsDriveAuthModalOpen(true)}
                  className="w-full xl:w-auto flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-950/90 hover:bg-emerald-900/90 text-emerald-300 hover:text-emerald-100 transition-all cursor-pointer border border-emerald-600/50 hover:border-emerald-500 shadow-sm shrink-0"
                  title={t.loginDriveTooltip}
                >
                  <Icons.HardDrive size={15} className="text-emerald-400" />
                  <span>{t.loginDriveBtn}</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsDriveDecksModalOpen(true)}
                  className="w-full xl:w-auto flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-900/90 via-emerald-800/90 to-teal-900/90 hover:from-emerald-800 hover:to-teal-800 text-stone-100 transition-all cursor-pointer border border-emerald-500/60 shadow-md shadow-emerald-950/40 shrink-0"
                  title={t.myDecksDriveTooltip}
                >
                  <div className="flex items-center gap-1.5">
                    {driveUserProfile.picture ? (
                      <img src={driveUserProfile.picture} alt="" className="w-4 h-4 rounded-full border border-emerald-400/50" />
                    ) : (
                      <Icons.FolderHeart size={15} className="text-amber-300" />
                    )}
                    <span>{t.myDecksDriveBtn}</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      {isViewMode ? (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 no-print">
          {/* Search, Filter & Sort Accordion at Top of View Mode */}
          {cards.length > 0 && (
            <div className="mb-6 bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
              <button
                type="button"
                onClick={toggleViewModeFiltersAccordion}
                className="w-full p-4 flex items-center justify-between hover:bg-stone-50/80 dark:hover:bg-stone-800/80 transition-colors text-left select-none cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Icons.Filter size={16} className="text-amber-700 dark:text-amber-500" />
                    <h3 className="font-serif font-bold text-sm uppercase tracking-wider text-stone-800 dark:text-stone-100">
                      {t.filtersAccordionTitle}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 font-sans">
                    <span>{t.shownCardsCount(viewProcessedCards.length, cards.length)}</span>
                    {(searchQuery.trim() !== '' || selectedTypeFilter !== 'all' || selectedRarityFilter !== 'all' || sortOrder !== 'default') && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                        {t.activeFiltersBadge}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Icons.ChevronDown
                    size={18}
                    className={`text-stone-500 dark:text-stone-400 transition-transform duration-200 ${isViewModeFiltersOpen ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              {isViewModeFiltersOpen && (
                <div className="px-4 pb-4 pt-2 border-t border-stone-100 dark:border-stone-800 flex flex-col gap-4">
                  {/* Top row: Search input + Sorting select + Reset button */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    {/* Search */}
                    <div className="md:col-span-6 relative">
                      <Icons.Search className="absolute left-3 top-2.5 text-stone-400 dark:text-stone-500" size={16} />
                      <input
                        type="text"
                        placeholder={t.searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-stone-50 dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white dark:focus:bg-stone-800 text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-2.5 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 p-0.5 cursor-pointer"
                          title={t.clearSearchTooltip}
                        >
                          <Icons.X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Sorting selector */}
                    <div className="md:col-span-4 flex items-center gap-2">
                      <div className="relative w-full">
                        <select
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value as any)}
                          className="w-full pl-3 pr-8 py-2 bg-stone-50 dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 rounded-lg text-xs font-semibold text-stone-700 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white dark:focus:bg-stone-800 appearance-none cursor-pointer"
                        >
                          <option value="default">{t.sortDefault}</option>
                          <option value="title_asc">{t.sortNameAsc}</option>
                          <option value="title_desc">{t.sortNameDesc}</option>
                          <option value="type">{t.sortType}</option>
                          <option value="rarity">{t.sortRarity}</option>
                        </select>
                        <Icons.ArrowUpDown size={13} className="absolute right-2.5 top-3 text-stone-400 dark:text-stone-500 pointer-events-none" />
                      </div>
                    </div>

                    {/* Reset button */}
                    <div className="md:col-span-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedTypeFilter('all');
                          setSelectedRarityFilter('all');
                          setSortOrder('default');
                        }}
                        disabled={searchQuery.trim() === '' && selectedTypeFilter === 'all' && selectedRarityFilter === 'all' && sortOrder === 'default'}
                        className={`w-full py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          searchQuery.trim() !== '' || selectedTypeFilter !== 'all' || selectedRarityFilter !== 'all' || sortOrder !== 'default'
                            ? 'bg-stone-200 dark:bg-stone-750 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <Icons.RotateCcw size={13} />
                        <span>{t.resetFiltersBtn}</span>
                      </button>
                    </div>
                  </div>

                  {/* Type Filter Buttons */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-600 dark:text-stone-300">{t.filterByTypeLabel}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setListEditorTab('types');
                          setListEditorOpen(true);
                        }}
                        className="text-stone-400 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 p-0.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                        title={t.editTypesListTitle}
                      >
                        <Icons.Settings size={12} />
                        <span>{t.customizeTypesBtn}</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedTypeFilter('all')}
                        className={`text-xs px-3 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                          selectedTypeFilter === 'all'
                            ? 'bg-stone-900 dark:bg-amber-600 text-white dark:text-stone-950 shadow-sm'
                            : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        {t.allTypesWithCount(cards.length)}
                      </button>
                      {cardTypes.map(type => {
                        const count = cards.filter(c => c.typeId === type.id).length;
                        return (
                          <button
                            type="button"
                            key={type.id}
                            onClick={() => setSelectedTypeFilter(type.id)}
                            className={`text-xs px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 font-medium cursor-pointer ${
                              selectedTypeFilter === type.id
                                ? 'bg-stone-900 dark:bg-amber-600 text-white dark:text-stone-950 shadow-sm'
                                : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: type.color }} />
                            <span>{type.name.split(' / ')[0]}</span>
                            <span className="text-[10px] opacity-75">({count})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Rarity Filter Buttons */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-600 dark:text-stone-300">{t.filterByRarityLabel}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setListEditorTab('rarities');
                          setListEditorOpen(true);
                        }}
                        className="text-stone-400 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 p-0.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                        title={t.editRaritiesListTitle}
                      >
                        <Icons.Settings size={12} />
                        <span>{t.customizeRaritiesBtn}</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedRarityFilter('all')}
                        className={`text-xs px-3 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                          selectedRarityFilter === 'all'
                            ? 'bg-stone-900 dark:bg-amber-600 text-white dark:text-stone-950 shadow-sm'
                            : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        {t.filterRarityAll}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRarityFilter('none')}
                        className={`text-xs px-3 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                          selectedRarityFilter === 'none'
                            ? 'bg-stone-900 dark:bg-amber-600 text-white dark:text-stone-950 shadow-sm'
                            : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        {t.noRarityWithCount(cards.filter(c => !c.rarity || c.rarity === 'none').length)}
                      </button>
                      {rarities.map(r => {
                        const count = cards.filter(c => c.rarity === r.id).length;
                        return (
                          <button
                            type="button"
                            key={r.id}
                            onClick={() => setSelectedRarityFilter(r.id)}
                            className={`text-xs px-3 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                              selectedRarityFilter === r.id
                                ? 'bg-stone-900 dark:bg-amber-600 text-white dark:text-stone-950 shadow-sm'
                                : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300'
                            }`}
                          >
                            <span>{r.name}</span>
                            <span className="text-[10px] opacity-75 ml-1">({count})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="rounded-xl p-2 md:p-4">
            {cards.length === 0 ? (
              <div className="text-center py-16 text-stone-500 dark:text-stone-400">
                <Icons.Inbox size={48} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm font-semibold text-stone-300 dark:text-stone-400">{t.emptyDeckTitle}</p>
                <button
                  onClick={() => {
                    handleAddCard(cardTypes[0]?.id);
                    setIsViewMode(false);
                  }}
                  className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {t.createFirstCardBtn}
                </button>
              </div>
            ) : viewProcessedCards.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 shadow-sm p-6 max-w-lg mx-auto">
                <Icons.SearchX size={44} className="mx-auto mb-3 text-stone-400 dark:text-stone-500" />
                <p className="text-sm font-bold text-stone-800 dark:text-stone-100">{t.emptySearchTitle}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{t.emptySearchDesc}</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTypeFilter('all');
                    setSelectedRarityFilter('all');
                    setSortOrder('default');
                  }}
                  className="mt-4 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Icons.RotateCcw size={13} />
                  <span>{t.resetFiltersBtn}</span>
                </button>
              </div>
            ) : (
              <div 
                onDragOver={handleContainerDragOver}
                onWheel={handleContainerWheel}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8 justify-items-center p-2 pt-5"
              >
                {viewProcessedCards.flatMap((card, idx) => {
                  const colors = getCardColors(card);
                  const rarityStyle = getRarityStyles(card.rarity);
                  const isHiddenFromPrint = !!card.hideFromPrint;
                  const pages = getCardPages(card, rarities);
                  const isCardHovered = hoveredCardId === card.id;
                  const originalDeckIndex = cards.findIndex(c => c.id === card.id);

                  return pages.map((pageContent, pageIdx) => {
                    return (
                      <div
                        key={`viewmode-${card.id}-page-${pageIdx}`}
                        draggable={!isHiddenFromPrint}
                        onDragStart={(e) => handleCardDragStart(e, card.id)}
                        onDragOver={(e) => handleCardDragOver(e, card.id)}
                        onDragLeave={(e) => handleCardDragLeave(e, card.id)}
                        onDrop={(e) => handleCardDrop(e, card.id)}
                        onDragEnd={handleCardDragEnd}
                        onMouseEnter={() => setHoveredCardId(card.id)}
                        onMouseLeave={() => setHoveredCardId(null)}
                        onDoubleClick={() => {
                          setSelectedCardId(card.id);
                          setIsViewMode(false);
                        }}
                        className={`relative group transition-all duration-200 ${
                          draggedCardId === card.id ? 'opacity-30 scale-95' : 'opacity-100'
                        } ${
                          isCardHovered 
                            ? '-translate-y-2.5 z-20 ' + (pages.length > 1 ? 'ring-2 ring-amber-500 shadow-2xl' : 'shadow-xl') 
                            : 'hover:-translate-y-1'
                        } ${dragOverCardId === card.id ? 'ring-2 ring-amber-500 scale-[1.02]' : ''} ${
                          isHiddenFromPrint ? 'opacity-50' : ''
                        }`}
                        title={t.doubleClickToEdit}
                      >
                        {/* Overlay Controls (placed outside the card frame above the top-right corner) */}
                        <div className="absolute -top-3.5 right-0 z-20 flex items-center gap-1 bg-stone-900/95 backdrop-blur-md rounded-full px-2 py-0.5 border border-stone-700 shadow-md opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCardId(card.id);
                              setIsViewMode(false);
                            }}
                            className="p-1 rounded-full text-amber-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                            title={t.editCardBtn}
                          >
                            <Icons.Edit3 size={13} />
                          </button>
                          <button
                            onClick={(e) => handleDuplicateCard(card, e)}
                            className="p-1 rounded-full text-stone-300 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                            title={t.duplicateCardTitle}
                          >
                            <Icons.Copy size={13} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadSingleCardPNG(card);
                            }}
                            className="p-1 rounded-full text-stone-300 hover:text-amber-400 hover:bg-stone-800 transition-colors cursor-pointer"
                            title={t.downloadCardPngTitle}
                          >
                            <Icons.Download size={13} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePrint(card.id, e);
                            }}
                            className={`p-1 rounded-full transition-colors cursor-pointer ${
                              isHiddenFromPrint ? 'text-red-500 hover:text-red-400 hover:bg-stone-800' : 'text-stone-300 hover:text-white hover:bg-stone-800'
                            }`}
                            title={isHiddenFromPrint ? t.includeInPrintTitle : t.excludeFromPrintTitle}
                          >
                            {isHiddenFromPrint ? <Icons.EyeOff size={13} /> : <Icons.Printer size={13} />}
                          </button>
                          <button
                            onClick={(e) => handleDeleteCard(card.id, e)}
                            className="p-1 rounded-full text-stone-400 hover:text-white hover:bg-red-500 transition-colors cursor-pointer"
                            title={t.deleteCardTitle}
                          >
                            <Icons.Trash2 size={13} />
                          </button>
                        </div>

                        {/* Hidden/Excluded Indicator Watermark */}
                        {isHiddenFromPrint && (
                          <div 
                            className="absolute inset-0 bg-stone-950/80 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-2 border-2 border-red-900 pointer-events-none"
                            style={{ borderRadius: card.borderRadius !== undefined ? `${card.borderRadius}px` : '3px' }}
                          >
                            {pageIdx === 0 && (
                              <>
                                <div className="w-10 h-10 rounded-full bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-500">
                                  <Icons.EyeOff size={18} />
                                </div>
                                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest font-serif">
                                  {t.excludedFromPrint}
                                </span>
                              </>
                            )}
                          </div>
                        )}

                        {/* Number Badge outside the card frame */}
                        {!isHiddenFromPrint && (
                          <div className="absolute -top-3.5 left-0 z-20 bg-amber-600 text-stone-950 text-[10px] font-mono font-black h-5 px-2 rounded-full flex items-center justify-center shadow-md border border-stone-900 pointer-events-none min-w-[22px]">
                            #{originalDeckIndex !== -1 ? originalDeckIndex + 1 : idx + 1}
                            {pages.length > 1 && <span className="text-[8px] ml-0.5">({pageIdx + 1}/{pages.length})</span>}
                          </div>
                        )}

                        {/* The High-Fidelity Card itself */}
                        <div
                          className={`bg-white border-2 border-stone-950 flex flex-col overflow-hidden relative select-none transition-all duration-300 ${
                            rarityStyle.border
                          }`}
                          style={{ 
                            width: `${card.width || 63}mm`,
                            height: `${card.height || 88}mm`,
                            boxSizing: 'border-box',
                            borderColor: rarityStyle.customBorderColor || undefined,
                            boxShadow: rarityStyle.customGlowStyle || undefined,
                            borderRadius: card.borderRadius !== undefined ? `${card.borderRadius}px` : '3px',
                          }}
                        >
                          {/* Header */}
                          {(!card.hideTitle || card.showIcon !== false) && (
                            <div
                              className="px-2 py-1 flex items-center justify-between gap-1 border-b border-stone-950 shrink-0 text-white min-h-[32px] h-auto"
                              style={{ backgroundColor: colors.primary }}
                            >
                              <div className="grow min-w-0 flex items-center">
                                {!card.hideTitle && (
                                  <AutoResizeTextarea
                                    value={card.title || ''}
                                    onChange={(e) => handleUpdateCardFieldById(card.id, 'title', e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        e.currentTarget.blur();
                                      }
                                    }}
                                    rows={1}
                                    placeholder={t.untitledCardPlaceholder}
                                    className={`bg-transparent border border-transparent hover:border-white/40 hover:bg-black/15 focus:border-white focus:bg-black/25 focus:outline-none w-full font-serif font-black tracking-tight leading-tight break-words whitespace-pre-wrap resize-none overflow-hidden transition-all px-1 py-0.5 rounded cursor-text ${
                                      card.autoScaleTitle !== false
                                        ? `${getTitleFontSize(card.title || t.untitledCardDefault, card.showIcon !== false)}`
                                        : 'text-sm'
                                    } ${rarityStyle.headingGlow}`}
                                    style={{
                                      textShadow: '1px 1px 0px rgba(0,0,0,0.8)',
                                      color: card.customTitleColor || '#ffffff',
                                      ...rarityStyle.customHeadingGlowStyle
                                    }}
                                    title={t.clickToEditTitleTooltip}
                                  />
                                )}
                                {pages.length > 1 && !card.hideTitle && <span className="text-[10px] opacity-75 font-mono ml-1 shrink-0 select-none">({pageIdx + 1}/{pages.length})</span>}
                              </div>
                              {card.showIcon !== false && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCardId(card.id);
                                    setIconPickerTarget('custom');
                                    setIconPickerOpen(true);
                                  }}
                                  className="w-6 h-6 rounded bg-black/25 hover:bg-black/40 flex items-center justify-center shrink-0 border border-white/20 hover:border-amber-300 transition-all cursor-pointer group/icon"
                                  title={t.clickToChooseIconTooltip}
                                >
                                  <CardIcon name={colors.icon} size={13} style={{ color: card.customTitleColor || '#ffffff' }} className="group-hover/icon:scale-110 transition-transform" />
                                </button>
                              )}
                            </div>
                          )}

                          {/* Subtitle / Subtype bar */}
                          {(!card.hideSubtitle || (card.rarity && card.rarity !== 'none')) && (
                            <div
                              className="px-2 py-1 font-serif font-bold tracking-wide uppercase border-b border-stone-950 shrink-0 flex justify-between items-center gap-1.5 min-w-0 h-auto min-h-[22px]"
                              style={{ backgroundColor: colors.secondary, color: card.customSubtitleColor || 'rgba(255, 255, 255, 0.95)' }}
                            >
                              {!card.hideSubtitle ? (
                                <AutoResizeTextarea
                                  value={card.subtitle || ''}
                                  onChange={(e) => handleUpdateCardFieldById(card.id, 'subtitle', e.target.value)}
                                  placeholder={t.cardSubtitlePlaceholderInline}
                                  className={`bg-transparent border border-transparent hover:border-white/40 hover:bg-black/15 focus:border-white focus:bg-black/25 focus:outline-none w-full font-serif font-bold tracking-wide uppercase rounded px-1 py-0.5 transition-all cursor-text min-w-0 grow resize-none overflow-hidden break-words whitespace-pre-wrap leading-tight ${getSubtitleFontSize(card.subtitle || '')}`}
                                  style={{ color: card.customSubtitleColor || 'rgba(255, 255, 255, 0.95)' }}
                                  title={t.clickToEditSubtitleTooltip}
                                />
                              ) : (
                                <span className="grow"></span>
                              )}
                              {card.rarity && card.rarity !== 'none' && (() => {
                                const badgeStyle = getRarityBadgeStyle(card);
                                return (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedCardId(card.id);
                                      setListEditorTab('rarities');
                                      setListEditorOpen(true);
                                    }}
                                    className={`text-[8px] px-1 py-0.5 rounded tracking-normal shrink-0 font-bold uppercase cursor-pointer hover:scale-105 hover:brightness-110 transition-all ${
                                      badgeStyle.isSubtitleStyle 
                                        ? '' 
                                        : 'border border-black/10 shadow-sm'
                                    }`} 
                                    style={{ 
                                      backgroundColor: badgeStyle.bg, 
                                      color: badgeStyle.text 
                                    }}
                                    title={t.clickToEditRarityTooltip}
                                  >
                                    {getRarityLabel(card.rarity)}
                                  </button>
                                );
                              })()}
                            </div>
                          )}

                          {/* Optional Illustration Area */}
                          {card.artUrl && pageIdx === 0 && !card.artAsDescriptionBg && !card.artAsStatsBg && (
                            <div className={`w-full bg-stone-900 relative overflow-hidden shrink-0 ${card.fullIllustration ? 'flex-1' : 'border-b border-stone-950'}`}
                                 style={card.fullIllustration ? undefined : { height: `${getIllustrationHeight(card)}px` }}>
                              <img
                                src={card.artUrl}
                                alt={card.title}
                                className="absolute max-w-none max-h-none transition-transform"
                                style={{
                                  left: '50%',
                                  top: '50%',
                                  width: 'auto',
                                  height: 'auto',
                                  minWidth: '100%',
                                  minHeight: '100%',
                                  transform: `translate(-50%, -50%) translate(${(card.illustrationPositionX || 0)}px, ${(card.illustrationPositionY || 0)}px) scale(${(card.illustrationScale || 100) / 100}) rotate(${(card.illustrationRotation || 0)}deg)`,
                                  transformOrigin: 'center center',
                                }}
                                referrerPolicy="no-referrer"
                                crossOrigin="anonymous"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                            </div>
                          )}

                          {/* Stats and Description Area with optional Art Backgrounds */}
                          {(() => {
                            const artBg = getCardArtBgState(card);
                            const showStats = Boolean(card.stats && card.stats.length > 0 && shouldRenderCardStats(card, pageIdx, rarities));
                            const showDesc = Boolean(!card.fullIllustration || pageIdx > 0);

                            if (!showStats && !showDesc) return null;

                            const isFullIll = Boolean(card.fullIllustration && pageIdx === 0);

                            return (
                              <div className={`${isFullIll ? 'shrink-0' : 'flex-1'} flex flex-col min-h-0 relative overflow-hidden`}>
                                {/* Continuous Background Art across BOTH blocks if both checkboxes are enabled */}
                                {artBg.isBoth && renderCardArtBackground(
                                  card,
                                  card.descriptionArtOpacity ?? 100,
                                  card.descriptionArtBrightness ?? 100
                                )}

                                {/* Optional Custom Stats Table */}
                                {showStats && (
                                  <div
                                    className="grid grid-cols-2 border-b border-stone-950 shrink-0 divide-x divide-stone-200 relative z-1 overflow-hidden"
                                    style={{
                                      backgroundColor: (artBg.isBoth || artBg.isStatsOnly)
                                        ? 'transparent'
                                        : (card.customStatsBgColor || '#f5f5f4'),
                                    }}
                                  >
                                    {/* Individual background if only stats is checked */}
                                    {artBg.isStatsOnly && renderCardArtBackground(
                                      card,
                                      card.statsArtOpacity ?? 100,
                                      card.statsArtBrightness ?? 75
                                    )}

                                    {/* Darkening overlay when both are checked ("просто на блоке характеристик будет чуть темнее") */}
                                    {artBg.isBoth && (
                                      <div
                                        className="absolute inset-0 pointer-events-none z-0"
                                        style={{
                                          backgroundColor: `rgba(0, 0, 0, ${Math.max(0.15, Math.min(0.75, 1 - (card.statsArtBrightness ?? 75) / 125))})`,
                                          opacity: (card.statsArtOpacity ?? 100) / 100,
                                          backdropFilter: `brightness(${(card.statsArtBrightness ?? 75) / 100})`,
                                          WebkitPrintColorAdjust: 'exact',
                                          printColorAdjust: 'exact',
                                        }}
                                      />
                                    )}

                                    {card.stats.map((stat) => (
                                      <div key={stat.id} className="flex flex-col justify-center px-1.5 py-0.5 leading-none min-w-0 relative z-1">
                                        <div className="relative group flex items-center w-full">
                                          <InlineRichInput
                                            value={stat.label || ''}
                                            onChange={(val) => handleUpdateCardStatById(card.id, stat.id, val, stat.value)}
                                            placeholder={t.propLabelPlaceholder}
                                            className="text-[7px] uppercase font-bold tracking-wider leading-none bg-transparent border border-transparent hover:border-stone-400/50 hover:bg-stone-200/50 focus:border-amber-500 focus:bg-white focus:outline-none rounded-sm px-0.5 py-0 h-[12px] transition-all w-full cursor-text flex items-center"
                                            placeholderClassName="px-0.5 text-[7px] uppercase font-bold tracking-wider leading-none text-stone-400 opacity-60"
                                            style={{
                                              color: card.customStatsTextColor || (artBg.isBoth || artBg.isStatsOnly ? '#f5f5f4' : '#78716c'),
                                              textShadow: (artBg.isBoth || artBg.isStatsOnly) ? '0 1px 2px rgba(0,0,0,0.8)' : undefined,
                                              opacity: card.customStatsTextColor ? 0.8 : 1
                                            }}
                                            title={t.clickToEditParamTooltip}
                                          />
                                        </div>
                                        <div className="relative group flex items-center w-full">
                                          <InlineRichInput
                                            value={stat.value || ''}
                                            onChange={(val) => handleUpdateCardStatById(card.id, stat.id, stat.label, val)}
                                            placeholder={t.propValuePlaceholder}
                                            className={`font-mono font-bold tracking-tight leading-none bg-transparent border border-transparent hover:border-stone-400/50 hover:bg-stone-200/50 focus:border-amber-500 focus:bg-white focus:outline-none rounded-sm px-0.5 py-0 h-[15px] transition-all w-full cursor-text flex items-center ${getStatValueFontSize(stat.value || '—')}`}
                                            placeholderClassName={`px-0.5 font-mono font-bold tracking-tight leading-none text-stone-400 opacity-60 ${getStatValueFontSize(stat.value || '—')}`}
                                            style={{
                                              color: card.customStatsTextColor || (artBg.isBoth || artBg.isStatsOnly ? '#ffffff' : '#1c1917'),
                                              textShadow: (artBg.isBoth || artBg.isStatsOnly) ? '0 1px 2px rgba(0,0,0,0.8)' : undefined
                                            }}
                                            title={t.clickToEditValueTooltip}
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Rich Description Block */}
                                {showDesc && (
                                  <div
                                    className="flex-1 p-2.5 overflow-hidden flex flex-col justify-between relative z-1"
                                    style={{
                                      backgroundColor: (artBg.isBoth || artBg.isDescOnly)
                                        ? 'transparent'
                                        : (card.customContentBgColor || 'rgba(250, 250, 249, 0.5)'),
                                    }}
                                  >
                                    {/* Individual background if only description is checked */}
                                    {artBg.isDescOnly && renderCardArtBackground(
                                      card,
                                      card.descriptionArtOpacity ?? 100,
                                      card.descriptionArtBrightness ?? 100
                                    )}

                                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative z-1">
                                      <RichTextEditor
                                        key={`view-desc-${card.id}-${pageIdx}`}
                                        value={pages.length > 1 ? pageContent : (card.content || '')}
                                        onChange={(val) => {
                                          if (pages.length > 1) {
                                            const newPages = [...pages];
                                            newPages[pageIdx] = val;
                                            handleUpdateCardFieldById(card.id, 'content', newPages.join(''));
                                          } else {
                                            handleUpdateCardFieldById(card.id, 'content', val);
                                          }
                                        }}
                                        cardId={`view-${card.id}-${pageIdx}`}
                                        placeholder={t.cardDescPlaceholder}
                                        isCardPreview={true}
                                        className={`rich-editor-preview pr-0.5 flex-1 min-h-0 break-words font-body select-text cursor-text leading-relaxed ${getContentAlignClass(card.contentAlign)} outline-none ${card.enableTextOverflow ? 'overflow-hidden' : 'overflow-y-auto'}`}
                                        style={{
                                          color: card.customContentColor || '#1c1917',
                                          fontSize: card.fontSize !== undefined ? `${card.fontSize}px` : '9px',
                                          textAlign: card.contentAlign || 'justify',
                                          backgroundColor: 'transparent',
                                        }}
                                      />
                                    </div>
                                    <div className="relative z-1">
                                      {renderCardFooter(card, true, (field, val) => handleUpdateCardFieldById(card.id, field, val))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  });
                })}
              </div>
            )}
          </div>
        </main>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 no-print">
        {/* Left column: Card Lists & Search Filters */}
        <section className="lg:col-span-3 flex flex-col gap-4">
          {/* Print size suggestion islet */}
          <div className="bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-xl p-3 flex items-start gap-2.5 shadow-sm">
            <Icons.Printer className="text-amber-700 dark:text-amber-500 shrink-0 mt-0.5" size={14} />
            <span className="text-[11px] text-stone-600 dark:text-stone-300 leading-normal">
              {t.printSizeSuggestionPre} <span className="font-semibold text-stone-950 dark:text-stone-100">{t.printSizeDimensions}</span>. {t.printSizeSuggestionPost}
            </span>
          </div>

          {/* Search & Filters Accordion */}
          <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
            <button
              type="button"
              onClick={toggleFiltersAccordion}
              className="w-full p-4 flex items-center justify-between hover:bg-stone-50/80 dark:hover:bg-stone-800/80 transition-colors text-left select-none cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="font-serif font-bold text-sm uppercase tracking-wider text-stone-800 dark:text-stone-100">
                  {t.filtersAccordionTitle}
                </h3>
                {(searchQuery.trim() !== '' || selectedTypeFilter !== 'all' || selectedRarityFilter !== 'all') && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                    {t.activeFiltersBadge}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Icons.ChevronDown
                  size={16}
                  className={`text-stone-500 dark:text-stone-400 transition-transform duration-200 ${isFiltersOpen ? 'rotate-180' : ''}`}
                />
              </div>
            </button>

            {isFiltersOpen && (
              <div className="px-4 pb-4 pt-1 flex flex-col gap-3 border-t border-stone-100 dark:border-stone-800">
                {/* Search Input */}
                <div className="relative">
                  <Icons.Search className="absolute left-3 top-2.5 text-stone-400 dark:text-stone-500" size={16} />
                  <input
                    type="text"
                    placeholder={t.searchByNamePlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-stone-50 dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white dark:focus:bg-stone-800 text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500"
                  />
                </div>

                {/* Type Filters */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-500 dark:text-stone-400">{t.cardTypeFilterLabel}</span>
                    <button
                      onClick={() => {
                        setListEditorTab('types');
                        setListEditorOpen(true);
                      }}
                      className="text-stone-400 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 p-0.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1 text-[10px]"
                      title={t.editTypesListTitle}
                    >
                      <Icons.Settings size={12} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => setSelectedTypeFilter('all')}
                      className={`text-xs px-2.5 py-1 rounded transition-colors font-medium cursor-pointer ${
                        selectedTypeFilter === 'all'
                          ? 'bg-stone-900 dark:bg-amber-600 text-white dark:text-stone-950 font-bold'
                          : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {t.allFilterBtn}
                    </button>
                    {cardTypes.map(type => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedTypeFilter(type.id)}
                        className={`text-xs px-2.5 py-1 rounded transition-colors flex items-center gap-1 font-medium cursor-pointer ${
                          selectedTypeFilter === type.id
                            ? 'bg-stone-900 dark:bg-amber-600 text-white dark:text-stone-950 font-bold'
                            : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        <span>{type.name.split(' / ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rarity Filters */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-500 dark:text-stone-400">{t.rarityFilterLabel}</span>
                    <button
                      onClick={() => {
                        setListEditorTab('rarities');
                        setListEditorOpen(true);
                      }}
                      className="text-stone-400 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 p-0.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1 text-[10px]"
                      title={t.editRaritiesListTitle}
                    >
                      <Icons.Settings size={12} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => setSelectedRarityFilter('all')}
                      className={`text-xs px-2 py-0.5 rounded transition-colors font-medium cursor-pointer ${
                        selectedRarityFilter === 'all'
                          ? 'bg-stone-900 dark:bg-amber-600 text-white dark:text-stone-950 font-bold'
                          : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {t.allFilterBtn}
                    </button>
                    <button
                      onClick={() => setSelectedRarityFilter('none')}
                      className={`text-xs px-2 py-0.5 rounded transition-colors font-medium cursor-pointer ${
                        selectedRarityFilter === 'none'
                          ? 'bg-stone-900 dark:bg-amber-600 text-white dark:text-stone-950 font-bold'
                          : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {t.noRarityHideBadge}
                    </button>
                    {rarities.map(r => (
                      <button
                        key={r.id}
                        onClick={() => setSelectedRarityFilter(r.id)}
                        className={`text-xs px-2 py-0.5 rounded transition-colors font-medium cursor-pointer ${
                          selectedRarityFilter === r.id
                            ? 'bg-stone-900 dark:bg-amber-600 text-white dark:text-stone-950 font-bold'
                            : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        {r.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Creator / Add buttons */}
          <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 p-4">
            <div className="mb-3">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 grow">
                  {currentDeckDriveId && currentDeckTitle ? (
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 text-stone-800 dark:text-stone-100 font-serif font-bold text-xs uppercase tracking-wider">
                        <Icons.HardDrive size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{t.deckDriveLabel}</span>
                        <span className="text-stone-500 dark:text-stone-400 font-normal text-xs font-sans">({filteredCards.length})</span>
                      </div>
                      <div 
                        className="text-xs font-serif font-bold uppercase tracking-wider text-amber-900 dark:text-amber-400 break-words whitespace-normal leading-snug mt-0.5"
                        title={currentDeckTitle}
                      >
                        {currentDeckTitle}
                      </div>
                    </div>
                  ) : (
                    <h3 className="font-serif font-bold text-sm uppercase tracking-wider text-stone-800 dark:text-stone-100 flex items-center gap-1.5">
                      <span>{t.myDeckTitle}</span>
                      <span className="text-stone-500 dark:text-stone-400 font-normal text-xs font-sans">({filteredCards.length})</span>
                    </h3>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0 pt-0.5">
                  <button
                    onClick={handleClearDeck}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 p-1 rounded transition-colors mr-1 cursor-pointer"
                    title={t.clearDeckBtn}
                  >
                    <Icons.Trash2 size={18} />
                  </button>
                  <button
                    onClick={() => handleAddCard(cardTypes[0]?.id)}
                    className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 p-1 rounded transition-colors cursor-pointer"
                    title={t.addCardTitle}
                  >
                    <Icons.Plus size={18} />
                  </button>
                </div>
              </div>

              {/* Auto-save status indicator if loaded from Google Drive */}
              {currentDeckDriveId && (
                <div className="w-full flex items-center justify-between text-[10px] mt-2 px-2.5 py-1 rounded-md bg-stone-50 dark:bg-stone-800/80 border border-stone-100 dark:border-stone-700/80 select-none">
                  {autoSaveStatus === 'saving' && (
                    <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5">
                      <Icons.Loader2 size={11} className="animate-spin text-amber-500" />
                      <span>{t.autoSaveSaving}</span>
                    </span>
                  )}
                  {autoSaveStatus === 'saved' && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                      <Icons.CheckCircle2 size={11} />
                      <span>{t.autoSaveSaved}</span>
                    </span>
                  )}
                  {autoSaveStatus === 'error' && (
                    <span className="text-red-500 dark:text-red-400 font-medium flex items-center gap-1.5">
                      <Icons.AlertCircle size={11} />
                      <span>{t.autoSaveError}</span>
                    </span>
                  )}
                  {autoSaveStatus === 'idle' && (
                    <span className="text-stone-500 dark:text-stone-400 font-normal flex items-center gap-1.5">
                      <Icons.CloudCheck size={11} className="text-emerald-600/80 dark:text-emerald-400/80" />
                      <span>{t.autoSaveSynced}</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="text-[10px] text-stone-400 dark:text-stone-500 mb-2 flex items-center gap-1 select-none">
              <Icons.GripVertical size={11} className="text-stone-400 dark:text-stone-500" />
              <span>{t.dragCardsHint}</span>
            </div>

             <div 
               onDragOver={handleContainerDragOver}
               onWheel={handleContainerWheel}
               className="flex flex-col gap-1.5 max-h-[350px] overflow-y-auto pr-1"
             >
               {filteredCards.length === 0 ? (
                 <div className="text-center py-6 text-stone-400 dark:text-stone-500 text-xs">
                   {t.nothingFound}
                 </div>
               ) : (
                 filteredCards.map(card => {
                   const colors = getCardColors(card);
                   const isSelected = card.id === selectedCardId;
                   const isHiddenFromPrint = !!card.hideFromPrint;
                   const isBeingDragged = draggedCardId === card.id;
                   const isDragOver = dragOverCardId === card.id;
                   const cardIndexInFullList = cards.findIndex(c => c.id === card.id);

                   return (
                     <div
                       key={card.id}
                       draggable={true}
                       onDragStart={(e) => handleCardDragStart(e, card.id)}
                       onDragOver={(e) => handleCardDragOver(e, card.id)}
                       onDragLeave={(e) => handleCardDragLeave(e, card.id)}
                       onDrop={(e) => handleCardDrop(e, card.id)}
                       onDragEnd={handleCardDragEnd}
                       onClick={() => setSelectedCardId(card.id)}
                       className={`flex items-center justify-between p-2 rounded border cursor-pointer group transition-all relative ${
                         isBeingDragged
                           ? 'opacity-30 border-dashed border-amber-500 bg-amber-50 dark:bg-amber-950/40 scale-[0.98]'
                           : ''
                       } ${
                         isDragOver && !isBeingDragged
                           ? 'border-2 border-amber-500 bg-amber-500/10 scale-[1.01] shadow-md'
                           : ''
                       } ${
                         !isBeingDragged && !isDragOver
                           ? isSelected
                             ? 'bg-stone-900 dark:bg-stone-800 border-stone-950 dark:border-amber-500/60 text-white dark:text-stone-100 shadow-sm ring-1 ring-amber-500/30'
                             : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200'
                           : ''
                       }`}
                     >
                       <div className="flex items-center gap-1.5 min-w-0 flex-1">
                         <div
                           className={`w-6 h-6 rounded flex items-center justify-center text-white shrink-0 transition-all relative ${
                             isHiddenFromPrint ? 'opacity-30 saturate-50' : 'opacity-100'
                           }`}
                           style={{ backgroundColor: colors.primary, color: card.customTitleColor || '#ffffff' }}
                         >
                           <CardIcon name={colors.icon} size={14} style={{ color: card.customTitleColor || '#ffffff' }} />
                           {getCardPages(card, rarities).length > 1 && (
                             <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-amber-500 text-stone-950 rounded-full flex items-center justify-center text-[8px] font-black border border-white shadow-sm" title={t.splitIntoPagesCount(getCardPages(card, rarities).length)}>
                               {getCardPages(card, rarities).length}
                             </div>
                           )}
                         </div>
                         <div className={`min-w-0 flex-1 transition-opacity ${isHiddenFromPrint ? 'opacity-40' : 'opacity-100'}`}>
                           <p className="text-xs font-bold truncate flex items-center gap-1">
                             <span>{card.title || t.newCardDefaultName}</span>
                             {isHiddenFromPrint && (
                               <span className="text-[8px] bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800 rounded px-1 scale-90 origin-left">{t.hiddenStatusShort}</span>
                             )}
                           </p>
                           <p className={`text-[10px] truncate ${isSelected ? 'text-stone-400 dark:text-stone-400' : 'text-stone-500 dark:text-stone-400'}`}>
                             {card.subtitle || t.noSubtitleText}
                           </p>
                         </div>
                       </div>

                       <div className="flex items-center gap-0.5 shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                         <button
                           onClick={(e) => handleMoveCard(card.id, 'up', e)}
                           disabled={cardIndexInFullList <= 0}
                           title={t.moveUpTitle}
                           className={`p-0.5 rounded transition-colors ${
                             cardIndexInFullList <= 0
                               ? 'opacity-20 cursor-not-allowed text-stone-400 dark:text-stone-600'
                               : isSelected
                                 ? 'hover:bg-stone-800 dark:hover:bg-stone-700 text-stone-400 hover:text-white cursor-pointer'
                                 : 'hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer'
                           }`}
                         >
                           <Icons.ChevronUp size={12} />
                         </button>
                         <button
                           onClick={(e) => handleMoveCard(card.id, 'down', e)}
                           disabled={cardIndexInFullList >= cards.length - 1}
                           title={t.moveDownTitle}
                           className={`p-0.5 rounded transition-colors ${
                             cardIndexInFullList >= cards.length - 1
                               ? 'opacity-20 cursor-not-allowed text-stone-400 dark:text-stone-600'
                               : isSelected
                                 ? 'hover:bg-stone-800 dark:hover:bg-stone-700 text-stone-400 hover:text-white cursor-pointer'
                                 : 'hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer'
                           }`}
                         >
                           <Icons.ChevronDown size={12} />
                         </button>
                         <button
                           onClick={(e) => handleTogglePrint(card.id, e)}
                           title={isHiddenFromPrint ? t.includeInPrintTitle : t.excludeFromPrintTitle}
                           className={`p-1 rounded transition-colors ${
                             isHiddenFromPrint
                               ? 'text-red-500 hover:bg-red-500 hover:text-white'
                               : isSelected
                                 ? 'hover:bg-stone-800 dark:hover:bg-stone-700 text-stone-400 hover:text-white'
                                 : 'hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                           }`}
                         >
                           {isHiddenFromPrint ? <Icons.EyeOff size={12} /> : <Icons.Printer size={12} />}
                         </button>
                         <button
                           onClick={(e) => handleDuplicateCard(card, e)}
                           title={t.duplicateCardTooltip}
                           className={`p-1 rounded ${isSelected ? 'hover:bg-stone-800 dark:hover:bg-stone-700 text-stone-400 hover:text-white' : 'hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'}`}
                         >
                           <Icons.Copy size={12} />
                         </button>
                         <button
                           onClick={(e) => handleDeleteCard(card.id, e)}
                           title={t.deleteCardTooltip}
                           className="p-1 rounded hover:bg-red-500 hover:text-white text-stone-400"
                         >
                           <Icons.Trash2 size={12} />
                         </button>
                       </div>
                     </div>
                   );
                 })
               )}
             </div>
 
          </div>
        </section>

        {/* Center column: Live Card View stage */}
        <section 
          className={`lg:col-span-5 flex flex-col items-center justify-center gap-6 min-h-[500px] ${
            selectedCard 
              ? getCardPages(selectedCard, rarities).length <= 1 
                ? 'lg:sticky lg:top-[max(24px,calc(50vh-250px))] lg:self-start' 
                : 'lg:sticky lg:top-[24px] lg:self-start'
              : ''
          }`} 
          style={{ overflowAnchor: 'none' }}
        >
          {selectedCard ? (
            <div className="flex flex-col items-center gap-4 w-full" style={{ overflowAnchor: 'none' }}>
              {activeTab === 'cardback' ? (
                <>
                  {/* Decorative Stage Label */}
                  <div className="text-center no-print">
                    <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 tracking-widest uppercase bg-stone-200 dark:bg-stone-800 px-3 py-1 rounded-full border border-stone-300/40 dark:border-stone-700/60">
                      {t.cardBackPreviewStageLabel}
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-2" style={{ overflowAnchor: 'none' }}>
                    <div
                      className="bg-stone-900 border-2 border-stone-950 flex flex-col overflow-hidden relative select-none shadow-lg transition-all duration-300"
                      style={{
                        width: `${selectedCard.width || 63}mm`,
                        height: `${selectedCard.height || 88}mm`,
                        boxSizing: 'border-box',
                        borderRadius: selectedCard.borderRadius !== undefined ? `${selectedCard.borderRadius}px` : '3px',
                      }}
                    >
                      {renderCardBackContent(selectedCard)}
                    </div>
                  </div>
                </>
              ) : (
                <>
                {/* Decorative Stage Label */}
                <div className="text-center no-print">
                  <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 tracking-widest uppercase bg-stone-200 dark:bg-stone-800 px-3 py-1 rounded-full border border-stone-300/40 dark:border-stone-700/60">
                    {t.cardPreviewStageLabel}
                  </span>
                </div>

                {/* High-fidelity TTRPG Card Frames (Split by pages if text overflow is enabled) */}
                {getCardPages(selectedCard, rarities).map((pageContent, pageIdx, pagesArr) => {
                  const colors = getCardColors(selectedCard);
                  const rarityStyle = getRarityStyles(selectedCard.rarity);
                  return (
                    <div 
                      key={pageIdx} 
                      className="flex flex-col items-center gap-2" 
                      style={{ overflowAnchor: 'none' }}
                    >
                      {pagesArr.length > 1 && (
                        <span className="text-[10px] font-mono font-bold text-stone-500 dark:text-stone-400 bg-stone-200 dark:bg-stone-800 border border-stone-300/40 dark:border-stone-700/60 px-2 py-0.5 rounded">
                          {t.cardPageXofY(pageIdx + 1, pagesArr.length)}
                        </span>
                      )}
                    <div
                      id={`card-${selectedCard.id}-${pageIdx}`}
                      className={`bg-white border-2 border-stone-950 flex flex-col overflow-hidden relative select-none transition-all duration-300 ${
                        rarityStyle.glow
                      } ${rarityStyle.border}`}
                      style={{
                        width: `${selectedCard.width || 63}mm`,
                        height: `${selectedCard.height || 88}mm`,
                        boxSizing: 'border-box',
                        borderColor: rarityStyle.customBorderColor || undefined,
                        boxShadow: rarityStyle.customGlowStyle || undefined,
                        borderRadius: selectedCard.borderRadius !== undefined ? `${selectedCard.borderRadius}px` : '3px',
                      }}
                    >
                      {/* Header Section */}
                      {(!selectedCard.hideTitle || selectedCard.showIcon !== false) && (
                        <div
                          className="px-2 py-1 flex items-center justify-between gap-1 border-b border-stone-950 shrink-0 text-white min-h-[32px] h-auto"
                          style={{ backgroundColor: colors.primary }}
                        >
                          <div className="grow min-w-0 flex items-center">
                            {!selectedCard.hideTitle && (
                              <AutoResizeTextarea
                                value={selectedCard.title || ''}
                                onChange={(e) => handleUpdateCardField('title', e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    e.currentTarget.blur();
                                  }
                                }}
                                rows={1}
                                placeholder={t.untitledCardPlaceholder}
                                className={`bg-transparent border border-transparent hover:border-white/40 hover:bg-black/15 focus:border-white focus:bg-black/25 focus:outline-none w-full font-serif font-black tracking-tight leading-tight break-words whitespace-pre-wrap resize-none overflow-hidden transition-all px-1 py-0.5 rounded cursor-text ${
                                  selectedCard.autoScaleTitle !== false
                                    ? `${getTitleFontSize(selectedCard.title || 'БЕЗ НАЗВАНИЯ', selectedCard.showIcon !== false)}`
                                    : 'text-sm'
                                } ${rarityStyle.headingGlow}`}
                                style={{
                                  textShadow: '1px 1px 0px rgba(0,0,0,0.8)',
                                  color: selectedCard.customTitleColor || '#ffffff',
                                  ...rarityStyle.customHeadingGlowStyle
                                }}
                                title={t.clickToEditTitleTooltip}
                              />
                            )}
                            {pagesArr.length > 1 && !selectedCard.hideTitle && <span className="text-[10px] opacity-75 font-mono ml-1 shrink-0 select-none">({pageIdx + 1}/{pagesArr.length})</span>}
                          </div>
                          {selectedCard.showIcon !== false && (
                            <button
                              type="button"
                              onClick={() => {
                                setIconPickerTarget('custom');
                                setIconPickerOpen(true);
                              }}
                              className="w-6 h-6 rounded bg-black/25 hover:bg-black/40 flex items-center justify-center shrink-0 border border-white/20 hover:border-amber-300 transition-all cursor-pointer group/icon"
                              title={t.clickToChooseIconTooltip}
                            >
                              <CardIcon name={colors.icon} size={13} style={{ color: selectedCard.customTitleColor || '#ffffff' }} className="group-hover/icon:scale-110 transition-transform" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Subtitle / Subtype bar */}
                      {(!selectedCard.hideSubtitle || (selectedCard.rarity && selectedCard.rarity !== 'none')) && (
                        <div
                          className="px-2 py-1 font-serif font-bold tracking-wide uppercase border-b border-stone-950 shrink-0 flex justify-between items-center gap-1.5 min-w-0 h-auto min-h-[22px]"
                          style={{ backgroundColor: colors.secondary, color: selectedCard.customSubtitleColor || 'rgba(255, 255, 255, 0.95)' }}
                        >
                          {!selectedCard.hideSubtitle ? (
                            <AutoResizeTextarea
                              value={selectedCard.subtitle || ''}
                              onChange={(e) => handleUpdateCardField('subtitle', e.target.value)}
                              placeholder={t.cardSubtitlePlaceholderInline}
                              className={`bg-transparent border border-transparent hover:border-white/40 hover:bg-black/15 focus:border-white focus:bg-black/25 focus:outline-none w-full font-serif font-bold tracking-wide uppercase rounded px-1 py-0.5 transition-all cursor-text min-w-0 grow resize-none overflow-hidden break-words whitespace-pre-wrap leading-tight ${getSubtitleFontSize(selectedCard.subtitle || '')}`}
                              style={{ color: selectedCard.customSubtitleColor || 'rgba(255, 255, 255, 0.95)' }}
                              title={t.clickToEditSubtitleTooltip}
                            />
                          ) : (
                            <span className="grow"></span>
                          )}
                          {selectedCard.rarity && selectedCard.rarity !== 'none' && (() => {
                            const badgeStyle = getRarityBadgeStyle(selectedCard);
                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  setListEditorTab('rarities');
                                  setListEditorOpen(true);
                                }}
                                className={`text-[8px] px-1 py-0.5 rounded tracking-normal shrink-0 font-bold uppercase cursor-pointer hover:scale-105 hover:brightness-110 transition-all ${
                                  badgeStyle.isSubtitleStyle 
                                    ? '' 
                                    : 'border border-black/10 shadow-sm'
                                }`} 
                                style={{ 
                                  backgroundColor: badgeStyle.bg, 
                                  color: badgeStyle.text 
                                }}
                                title={t.clickToEditRarityTooltip}
                              >
                                {getRarityLabel(selectedCard.rarity)}
                              </button>
                            );
                          })()}
                        </div>
                      )}

                      {/* Optional Illustration Area: ONLY on first page */}
                      {selectedCard.artUrl && pageIdx === 0 && !selectedCard.artAsDescriptionBg && !selectedCard.artAsStatsBg && (
                        <div className={`w-full bg-stone-900 relative overflow-hidden shrink-0 ${selectedCard.fullIllustration ? 'flex-1' : 'border-b border-stone-950'}`}
                             style={selectedCard.fullIllustration ? undefined : { height: `${getIllustrationHeight(selectedCard)}px` }}>
                          <img
                            src={selectedCard.artUrl}
                            alt={selectedCard.title}
                            className="absolute max-w-none max-h-none transition-transform"
                            style={{
                              left: '50%',
                              top: '50%',
                              width: 'auto',
                              height: 'auto',
                              minWidth: '100%',
                              minHeight: '100%',
                              transform: `translate(-50%, -50%) translate(${(selectedCard.illustrationPositionX || 0)}px, ${(selectedCard.illustrationPositionY || 0)}px) scale(${(selectedCard.illustrationScale || 100) / 100}) rotate(${(selectedCard.illustrationRotation || 0)}deg)`,
                              transformOrigin: 'center center',
                            }}
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                        </div>
                      )}

                      {/* Stats and Description Area with optional Art Backgrounds */}
                      {(() => {
                        const artBg = getCardArtBgState(selectedCard);
                        const showStats = Boolean(selectedCard.stats && selectedCard.stats.length > 0 && shouldRenderCardStats(selectedCard, pageIdx, rarities));
                        const showDesc = Boolean(!selectedCard.fullIllustration || pageIdx > 0);

                        if (!showStats && !showDesc) return null;

                        const isFullIll = Boolean(selectedCard.fullIllustration && pageIdx === 0);

                        return (
                          <div className={`${isFullIll ? 'shrink-0' : 'flex-1'} flex flex-col min-h-0 relative overflow-hidden`}>
                            {/* Continuous Background Art across BOTH blocks if both checkboxes are enabled */}
                            {artBg.isBoth && renderCardArtBackground(
                              selectedCard,
                              selectedCard.descriptionArtOpacity ?? 100,
                              selectedCard.descriptionArtBrightness ?? 100
                            )}

                            {/* Optional Custom Stats Table */}
                            {showStats && (
                              <div
                                className="grid grid-cols-2 border-b border-stone-950 shrink-0 divide-x divide-stone-200 relative z-1 overflow-hidden"
                                style={{
                                  backgroundColor: (artBg.isBoth || artBg.isStatsOnly)
                                    ? 'transparent'
                                    : (selectedCard.customStatsBgColor || '#f5f5f4'),
                                }}
                              >
                                {/* Individual background if only stats is checked */}
                                {artBg.isStatsOnly && renderCardArtBackground(
                                  selectedCard,
                                  selectedCard.statsArtOpacity ?? 100,
                                  selectedCard.statsArtBrightness ?? 75
                                )}

                                {/* Darkening overlay when both are checked ("просто на блоке характеристик будет чуть темнее") */}
                                {artBg.isBoth && (
                                  <div
                                    className="absolute inset-0 pointer-events-none z-0"
                                    style={{
                                      backgroundColor: `rgba(0, 0, 0, ${Math.max(0.15, Math.min(0.75, 1 - (selectedCard.statsArtBrightness ?? 75) / 125))})`,
                                      opacity: (selectedCard.statsArtOpacity ?? 100) / 100,
                                      backdropFilter: `brightness(${(selectedCard.statsArtBrightness ?? 75) / 100})`,
                                      WebkitPrintColorAdjust: 'exact',
                                      printColorAdjust: 'exact',
                                    }}
                                  />
                                )}

                                {selectedCard.stats.map((stat) => (
                                  <div key={stat.id} className="flex flex-col justify-center px-1.5 py-0.5 leading-none min-w-0 relative z-1">
                                    <div className="relative group flex items-center w-full">
                                      <InlineRichInput
                                        value={stat.label || ''}
                                        onChange={(val) => handleUpdateStat(stat.id, val, stat.value)}
                                        placeholder={t.propLabelPlaceholder}
                                        className="text-[7px] uppercase font-bold tracking-wider leading-none bg-transparent border border-transparent hover:border-stone-400/50 hover:bg-stone-200/50 focus:border-amber-500 focus:bg-white focus:outline-none rounded-sm px-0.5 py-0 h-[12px] transition-all w-full cursor-text flex items-center"
                                        placeholderClassName="px-0.5 text-[7px] uppercase font-bold tracking-wider leading-none text-stone-400 opacity-60"
                                        style={{
                                          color: selectedCard.customStatsTextColor || (artBg.isBoth || artBg.isStatsOnly ? '#f5f5f4' : '#78716c'),
                                          textShadow: (artBg.isBoth || artBg.isStatsOnly) ? '0 1px 2px rgba(0,0,0,0.8)' : undefined,
                                          opacity: selectedCard.customStatsTextColor ? 0.8 : 1
                                        }}
                                        title={t.clickToEditParamTooltip}
                                      />
                                    </div>
                                    <div className="relative group flex items-center w-full">
                                      <InlineRichInput
                                        value={stat.value || ''}
                                        onChange={(val) => handleUpdateStat(stat.id, stat.label, val)}
                                        placeholder={t.propValuePlaceholder}
                                        className={`font-mono font-bold tracking-tight leading-none bg-transparent border border-transparent hover:border-stone-400/50 hover:bg-stone-200/50 focus:border-amber-500 focus:bg-white focus:outline-none rounded-sm px-0.5 py-0 h-[15px] transition-all w-full cursor-text flex items-center ${getStatValueFontSize(stat.value || '—')}`}
                                        placeholderClassName={`px-0.5 font-mono font-bold tracking-tight leading-none text-stone-400 opacity-60 ${getStatValueFontSize(stat.value || '—')}`}
                                        style={{
                                          color: selectedCard.customStatsTextColor || (artBg.isBoth || artBg.isStatsOnly ? '#ffffff' : '#1c1917'),
                                          textShadow: (artBg.isBoth || artBg.isStatsOnly) ? '0 1px 2px rgba(0,0,0,0.8)' : undefined
                                        }}
                                        title={t.clickToEditValueTooltip}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Rich Description Block */}
                            {showDesc && (
                              <div
                                className="flex-1 p-2.5 overflow-hidden flex flex-col justify-between relative z-1"
                                style={{
                                  backgroundColor: (artBg.isBoth || artBg.isDescOnly)
                                    ? 'transparent'
                                    : (selectedCard.customContentBgColor || 'rgba(250, 250, 249, 0.5)'),
                                }}
                              >
                                {/* Individual background if only description is checked */}
                                {artBg.isDescOnly && renderCardArtBackground(
                                  selectedCard,
                                  selectedCard.descriptionArtOpacity ?? 100,
                                  selectedCard.descriptionArtBrightness ?? 100
                                )}

                                <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative z-1">
                                  <RichTextEditor
                                    key={`editor-desc-${selectedCard.id}-${pageIdx}`}
                                    value={pagesArr.length > 1 ? pageContent : (selectedCard.content || '')}
                                    onChange={(val) => {
                                      if (pagesArr.length > 1) {
                                        const newPages = [...pagesArr];
                                        newPages[pageIdx] = val;
                                        handleUpdateCardField('content', newPages.join(''));
                                      } else {
                                        handleUpdateCardField('content', val);
                                      }
                                    }}
                                    cardId={`editor-${selectedCard.id}-${pageIdx}`}
                                    placeholder={t.cardDescPlaceholder}
                                    isCardPreview={true}
                                    className={`rich-editor-preview pr-0.5 flex-1 min-h-0 break-words font-body select-text cursor-text leading-relaxed ${getContentAlignClass(selectedCard.contentAlign)} outline-none ${selectedCard.enableTextOverflow ? 'overflow-hidden' : 'overflow-y-auto'}`}
                                    style={{
                                      color: selectedCard.customContentColor || '#1c1917',
                                      fontSize: selectedCard.fontSize !== undefined ? `${selectedCard.fontSize}px` : '9px',
                                      textAlign: selectedCard.contentAlign || 'justify',
                                      backgroundColor: 'transparent',
                                    }}
                                  />
                                </div>

                                {/* Tiny decorative footprint or watermark */}
                                <div className="relative z-1">
                                  {renderCardFooter(selectedCard, true, (field, val) => handleUpdateCardFieldById(selectedCard.id, field, val))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
                </>
              )}

              {/* Stage buttons */}
              <div className="flex flex-col gap-2 no-print">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDuplicateCard(selectedCard)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer border border-stone-300/50 dark:border-stone-700/60"
                  >
                    <Icons.Copy size={13} />
                    <span>{t.duplicateCardBtn}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteCard(selectedCard.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-100 dark:bg-red-950/50 hover:bg-red-200 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer border border-red-200/60 dark:border-red-800/60"
                  >
                    <Icons.Trash2 size={13} />
                    <span>{t.deleteCardBtn}</span>
                  </button>
                </div>
                <button
                  onClick={() => handleDownloadSingleCardPNG(selectedCard)}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-stone-850 hover:bg-stone-800 text-amber-500 border border-stone-700 rounded text-xs font-bold shadow-sm transition-all cursor-pointer w-full"
                  title={t.downloadCardPngTitle}
                >
                  <Icons.Download size={13} />
                  <span>{t.downloadCardPngBtn}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-stone-400 font-serif text-center py-10">
              {t.selectCardPrompt}
            </div>
          )}
        </section>

        {/* Right column: Card Form Editor & Live Tools */}
        <section className="lg:col-span-4 flex flex-col gap-4">
          {selectedCard ? (
            <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 p-4 flex flex-col gap-4">
              <div className="flex border-b border-stone-100 dark:border-stone-800">
                <button
                  onClick={() => setActiveTab('editor')}
                  className={`flex-1 pb-2 font-serif font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-colors border-b-2 text-center ${
                    activeTab === 'editor'
                      ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                      : 'border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
                  }`}
                >
                  {t.tabProperties}
                </button>
                <button
                  onClick={() => setActiveTab('templates')}
                  className={`flex-1 pb-2 font-serif font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-colors border-b-2 text-center ${
                    activeTab === 'templates'
                      ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                      : 'border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
                  }`}
                >
                  {t.tabTemplates}
                </button>
                <button
                  onClick={() => setActiveTab('cardback')}
                  className={`flex-1 pb-2 font-serif font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-colors border-b-2 text-center ${
                    activeTab === 'cardback'
                      ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                      : 'border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
                  }`}
                >
                  {t.tabCardback}
                </button>
              </div>

              {activeTab === 'editor' ? (
                <div className="flex flex-col gap-4">
                  {/* Sub-tabs "Данные", "Цвета", "Разметка" */}
                  <div className="flex bg-stone-100 dark:bg-stone-800 p-0.5 rounded-lg border border-stone-200 dark:border-stone-700 shrink-0">
                    <button
                      onClick={() => setEditorSubTab('data')}
                      className={`flex-1 py-1.5 px-2 rounded-md font-serif font-bold text-[10px] uppercase tracking-wider transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                        editorSubTab === 'data'
                          ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-sm font-black'
                          : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                      }`}
                    >
                      <Icons.FileText size={12} />
                      <span>{t.tabData}</span>
                    </button>
                    <button
                      onClick={() => setEditorSubTab('colors')}
                      className={`flex-1 py-1.5 px-2 rounded-md font-serif font-bold text-[10px] uppercase tracking-wider transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                        editorSubTab === 'colors'
                          ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-sm font-black'
                          : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                      }`}
                    >
                      <Icons.Palette size={12} />
                      <span>{t.tabColors}</span>
                    </button>
                    <button
                      onClick={() => setEditorSubTab('layout')}
                      className={`flex-1 py-1.5 px-2 rounded-md font-serif font-bold text-[10px] uppercase tracking-wider transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                        editorSubTab === 'layout'
                          ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-sm font-black'
                          : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                      }`}
                    >
                      <Icons.Layout size={12} />
                      <span>{t.tabLayout}</span>
                    </button>
                  </div>

                  {editorSubTab === 'data' && (
                    <div className="flex flex-col gap-4">
                      {/* Card Main Info */}
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-stone-600 dark:text-stone-300 flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!selectedCard.hideTitle}
                          onChange={(e) => handleUpdateCardField('hideTitle', !e.target.checked)}
                          className="rounded border-stone-300 dark:border-stone-600 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
                        />
                        <span>{t.cardTitleLabel}</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] font-semibold text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200">
                        <input
                          type="checkbox"
                          checked={selectedCard.showIcon !== false}
                          onChange={(e) => handleUpdateCardField('showIcon', e.target.checked)}
                          className="rounded border-stone-300 dark:border-stone-600 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
                        />
                        <span>{t.enableIconCheckbox}</span>
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={selectedCard.title}
                        onChange={(e) => handleUpdateCardField('title', e.target.value)}
                        disabled={selectedCard.hideTitle}
                        placeholder={t.cardTitlePlaceholder}
                        className={`flex-1 min-w-0 px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-sm focus:outline-none focus:ring-1 focus:ring-stone-400 focus:bg-white dark:focus:bg-stone-800 text-stone-800 dark:text-stone-100 font-bold transition-opacity ${
                          selectedCard.hideTitle ? 'opacity-50 cursor-not-allowed bg-stone-100 dark:bg-stone-800' : ''
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIconPickerTarget('custom');
                          setIconPickerOpen(true);
                        }}
                        title={t.chooseCardIconTitle}
                        className="px-2.5 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded text-stone-700 dark:text-stone-300 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                        style={{ height: '34px' }}
                      >
                        <div 
                          className="w-6 h-6 rounded flex items-center justify-center text-white" 
                          style={{ 
                            backgroundColor: selectedCard.customColor || getCardColors(selectedCard).primary,
                            color: selectedCard.customTitleColor || '#ffffff'
                          }}
                        >
                          <CardIcon name={selectedCard.customIcon || getCardColors(selectedCard).icon} size={14} style={{ color: selectedCard.customTitleColor || '#ffffff' }} />
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-stone-600 dark:text-stone-300 flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!selectedCard.hideSubtitle}
                          onChange={(e) => handleUpdateCardField('hideSubtitle', !e.target.checked)}
                          className="rounded border-stone-300 dark:border-stone-600 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
                        />
                        <span>{t.cardSubtitleLabel}</span>
                      </label>
                      <span className="text-[10px] font-medium text-stone-400">
                        {selectedCard.hideSubtitle ? t.hiddenStatus : t.visibleStatus}
                      </span>
                    </div>
                    <AutoResizeTextarea
                      rows={1}
                      value={selectedCard.subtitle || ''}
                      onChange={(e) => handleUpdateCardField('subtitle', e.target.value)}
                      disabled={selectedCard.hideSubtitle}
                      placeholder={t.cardSubtitlePlaceholder}
                      className={`w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-stone-400 focus:bg-white dark:focus:bg-stone-800 text-stone-700 dark:text-stone-200 transition-opacity resize-none overflow-hidden ${
                        selectedCard.hideSubtitle ? 'opacity-50 cursor-not-allowed bg-stone-100 dark:bg-stone-800' : ''
                      }`}
                    />
                  </div>

                  {/* Card Type & Rarity */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-stone-600 dark:text-stone-300">{t.categoryTypeLabel}</label>
                        <button
                          onClick={() => {
                            setListEditorTab('types');
                            setListEditorOpen(true);
                          }}
                          className="text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 p-0.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                          title={t.editTypesListTitle}
                        >
                          <Icons.Settings size={12} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIconPickerTarget('type');
                          setIconPickerOpen(true);
                        }}
                        className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-xs text-stone-800 dark:text-stone-200 font-semibold flex items-center justify-between hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                        style={{ height: '30px' }}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div 
                            className="w-4 h-4 rounded flex items-center justify-center text-white shrink-0" 
                            style={{ backgroundColor: getCardColors(selectedCard).primary }}
                          >
                            <CardIcon name={getCardColors(selectedCard).icon} size={10} />
                          </div>
                          <span className="truncate">{(cardTypes.find(t => t.id === selectedCard.typeId) || cardTypes[0])?.name || t.selectTypePrompt}</span>
                        </div>
                        <Icons.ChevronDown size={14} className="text-stone-500 dark:text-stone-400 shrink-0" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-stone-600 dark:text-stone-300">{t.itemRarityLabel}</label>
                        <button
                          onClick={() => {
                            setListEditorTab('rarities');
                            setListEditorOpen(true);
                          }}
                          className="text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 p-0.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                          title={t.editRaritiesListTitle}
                        >
                          <Icons.Settings size={12} />
                        </button>
                      </div>
                      <select
                        value={selectedCard.rarity || 'none'}
                        onChange={(e) => handleUpdateCardField('rarity', e.target.value as CardRarity)}
                        className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-stone-400 focus:bg-white dark:focus:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold cursor-pointer"
                      >
                        <option value="none">{t.noRarityHideBadge}</option>
                        {rarities.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedCard.rarity && selectedCard.rarity !== 'none' && (
                    <div className="flex flex-col gap-2.5 bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700 p-2.5 rounded w-full">
                      <label className="flex items-center gap-2 cursor-pointer select-none w-full">
                        <input
                          type="checkbox"
                          checked={selectedCard.matchGlowColor !== false}
                          onChange={(e) => handleUpdateCardField('matchGlowColor', e.target.checked)}
                          className="accent-amber-600 rounded text-amber-600 h-3.5 w-3.5 cursor-pointer"
                        />
                        <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 leading-tight">
                          {t.matchGlowColorLabel}
                        </span>
                      </label>

                      {selectedCard.matchGlowColor === false && (
                        <div className="flex flex-col gap-1.5 border-t border-stone-200/40 dark:border-stone-700/60 pt-2 w-full">
                          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">{t.rarityBadgeBgColorLabel}</span>
                          <div className="flex items-center justify-between bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 p-2 rounded-md w-full">
                            {[
                              '#78716c', // Gray
                              '#ef4444', // Red
                              '#f59e0b', // Yellow
                              '#10b981', // Green
                              '#3b82f6', // Blue
                              '#a855f7', // Purple
                            ].map((colorHex) => {
                              const isSelected = selectedCard.customRarityBadgeColor === colorHex;
                              return (
                                <button
                                  key={colorHex}
                                  onClick={() => handleUpdateCardField('customRarityBadgeColor', colorHex)}
                                  className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                                    isSelected 
                                      ? 'border-stone-900 dark:border-white scale-110 ring-2 ring-stone-900/20 dark:ring-white/30' 
                                      : 'border-stone-300 dark:border-stone-600 hover:scale-105'
                                  }`}
                                  style={{ backgroundColor: colorHex }}
                                  title={colorHex}
                                />
                              );
                            })}
                            {/* Custom palette color picker */}
                            <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-700/60 border border-stone-200 dark:border-stone-600 rounded-full px-2 py-0.5 shrink-0">
                              <div className="relative w-4 h-4 rounded-full border border-stone-300 hover:scale-105 flex items-center justify-center cursor-pointer bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white overflow-hidden">
                                <Icons.Palette size={10} />
                                <input
                                  type="color"
                                  value={selectedCard.customRarityBadgeColor && selectedCard.customRarityBadgeColor !== 'subtitle' ? selectedCard.customRarityBadgeColor : '#78716c'}
                                  onChange={(e) => handleUpdateCardField('customRarityBadgeColor', e.target.value)}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                  title={t.chooseCustomColorTitle}
                                />
                              </div>
                              <input
                                type="text"
                                placeholder={t.customHexPlaceholder}
                                value={selectedCard.customRarityBadgeColor && selectedCard.customRarityBadgeColor !== 'subtitle' ? selectedCard.customRarityBadgeColor.toUpperCase() : ''}
                                onChange={(e) => {
                                  let val = e.target.value;
                                  if (!val) {
                                    handleUpdateCardField('customRarityBadgeColor', undefined);
                                    return;
                                  }
                                  if (!val.startsWith('#') && /^[0-9a-fA-F]{1,6}$/.test(val)) {
                                    val = '#' + val;
                                  }
                                  handleUpdateCardField('customRarityBadgeColor', val);
                                }}
                                className="text-[10px] font-mono text-stone-700 dark:text-stone-200 font-bold bg-transparent w-[60px] focus:outline-none uppercase border-none p-0"
                              />
                            </div>
                            {/* Clear/Subtitle style cross button */}
                            <button
                              onClick={() => handleUpdateCardField('customRarityBadgeColor', 'subtitle')}
                              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600 hover:text-stone-800 dark:hover:text-stone-100 cursor-pointer ${
                                selectedCard.customRarityBadgeColor === 'subtitle'
                                  ? 'border-stone-900 dark:border-white scale-110 ring-2 ring-stone-900/20 dark:ring-white/30 font-bold bg-stone-200 dark:bg-stone-600'
                                  : 'border-stone-300 dark:border-stone-600'
                              }`}
                              title={t.matchSubtitleBgTitle}
                            >
                              <Icons.X size={12} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Аккордеон: Настройка цветов значка и плашки */}
                  <div className="border border-stone-200 dark:border-stone-750 rounded-lg overflow-hidden bg-white dark:bg-stone-850 shadow-xs">
                    <button
                      type="button"
                      onClick={() => setSidebarIconColorsAccordionOpen(prev => !prev)}
                      className="w-full p-2.5 flex items-center justify-between bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 transition-colors text-left cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2">
                        <Icons.Palette size={14} className="text-amber-600 dark:text-amber-400" />
                        <div>
                          <div className="text-xs font-bold text-stone-700 dark:text-stone-200">
                            {t.iconColorCustomization}
                          </div>
                          <div className="text-[10px] text-stone-500 dark:text-stone-400 font-normal">
                            {t.iconColorsAccordionSubtitle}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center -space-x-1.5" title={t.currentColorSettingsTitle}>
                          <div
                            className="w-4 h-4 rounded-full border border-white dark:border-stone-800 shadow-xs"
                            style={{ backgroundColor: selectedCard.customColor || getCardColors(selectedCard).primary }}
                            title={t.iconBgColorLabel}
                          />
                          <div
                            className="w-4 h-4 rounded-full border border-white dark:border-stone-800 shadow-xs flex items-center justify-center text-[8px]"
                            style={{ backgroundColor: selectedCard.customTitleColor || '#ffffff' }}
                            title={t.iconGlyphColorLabel}
                          />
                        </div>
                        <div className={`p-0.5 rounded text-stone-400 transition-transform duration-200 ${sidebarIconColorsAccordionOpen ? 'rotate-180 text-amber-600 dark:text-amber-400' : ''}`}>
                          <Icons.ChevronDown size={14} />
                        </div>
                      </div>
                    </button>

                    {sidebarIconColorsAccordionOpen && (
                      <div className="p-3 border-t border-stone-200 dark:border-stone-750 flex flex-col gap-3 bg-white dark:bg-stone-900">
                        {/* 1. Цвет фона значка */}
                        <div className="flex flex-col gap-1.5 bg-stone-50 dark:bg-stone-800/70 p-2 rounded border border-stone-200/80 dark:border-stone-700">
                          <span className="text-[10px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider flex items-center justify-between">
                            <span>{t.iconBgColorLabel}</span>
                            <span className="text-[9px] font-mono lowercase text-amber-600 dark:text-amber-400">{t.clickOrPipetteHint}</span>
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {ICON_BG_PRESETS.map(preset => (
                              <button
                                key={preset.value}
                                type="button"
                                onClick={() => handleUpdateCardField('customColor', preset.value)}
                                className={`w-5 h-5 rounded-full border transition-all flex items-center justify-center shrink-0 cursor-pointer hover:scale-110 active:scale-95 ${
                                  (selectedCard.customColor || getCardColors(selectedCard).primary) === preset.value
                                    ? 'border-amber-600 scale-105 shadow-xs ring-2 ring-amber-500/30'
                                    : 'border-stone-300 dark:border-stone-600'
                                }`}
                                style={{ backgroundColor: preset.value }}
                                title={preset.name}
                              >
                                {(selectedCard.customColor || getCardColors(selectedCard).primary) === preset.value && (
                                  <Icons.Check size={10} className="text-white drop-shadow-xs font-bold" />
                                )}
                              </button>
                            ))}
                            <div className="flex items-center gap-1 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-full px-1.5 py-0.5 shrink-0">
                              <div className="relative flex items-center shrink-0 w-4 h-4">
                                <input
                                  type="color"
                                  value={selectedCard.customColor || getCardColors(selectedCard).primary}
                                  onChange={(e) => handleUpdateCardField('customColor', e.target.value)}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                  title={t.customColorTitle}
                                />
                                <div className="w-4 h-4 rounded-full border border-stone-300 dark:border-stone-600 flex items-center justify-center bg-white dark:bg-stone-800 pointer-events-none">
                                  <Icons.Pipette size={9} className="text-stone-500 dark:text-stone-400" />
                                </div>
                              </div>
                              <input
                                type="text"
                                placeholder={t.customHexPlaceholder}
                                value={selectedCard.customColor ? selectedCard.customColor.toUpperCase() : ''}
                                onChange={(e) => {
                                  let val = e.target.value;
                                  if (!val) {
                                    handleUpdateCardField('customColor', undefined);
                                    return;
                                  }
                                  if (!val.startsWith('#') && /^[0-9a-fA-F]{1,6}$/.test(val)) val = '#' + val;
                                  handleUpdateCardField('customColor', val);
                                }}
                                className="text-[9px] font-mono text-stone-700 dark:text-stone-200 font-bold bg-transparent w-[54px] focus:outline-none uppercase border-none p-0"
                              />
                            </div>
                            {selectedCard.customColor && (
                              <button
                                type="button"
                                onClick={() => handleUpdateCardField('customColor', undefined)}
                                className="px-1.5 py-0.5 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-300 text-[9px] font-bold rounded transition-colors cursor-pointer"
                                title={t.resetColorToDefaultTitle}
                              >
                                {t.resetColorToDefault}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 2. Цвет символа значка */}
                        <div className="flex flex-col gap-1.5 bg-stone-50 dark:bg-stone-800/70 p-2 rounded border border-stone-200/80 dark:border-stone-700">
                          <span className="text-[10px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider flex items-center justify-between">
                            <span>{t.iconGlyphColorLabel}</span>
                            <span className="text-[9px] font-mono lowercase text-amber-600 dark:text-amber-400">{t.clickOrPipetteHint}</span>
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {ICON_COLOR_PRESETS.map(preset => (
                              <button
                                key={preset.value}
                                type="button"
                                onClick={() => handleUpdateCardField('customTitleColor', preset.value)}
                                className={`w-5 h-5 rounded-full border transition-all flex items-center justify-center shrink-0 cursor-pointer hover:scale-110 active:scale-95 ${
                                  (selectedCard.customTitleColor || '#ffffff') === preset.value
                                    ? 'border-amber-600 scale-105 shadow-xs ring-2 ring-amber-500/30'
                                    : 'border-stone-300 dark:border-stone-600'
                                }`}
                                style={{ backgroundColor: preset.value }}
                                title={preset.name}
                              >
                                {(selectedCard.customTitleColor || '#ffffff') === preset.value && (
                                  <Icons.Check size={10} className={preset.value === '#ffffff' ? 'text-stone-950 font-bold' : 'text-white drop-shadow-xs font-bold'} />
                                )}
                              </button>
                            ))}
                            <div className="flex items-center gap-1 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-full px-1.5 py-0.5 shrink-0">
                              <div className="relative flex items-center shrink-0 w-4 h-4">
                                <input
                                  type="color"
                                  value={selectedCard.customTitleColor || '#ffffff'}
                                  onChange={(e) => handleUpdateCardField('customTitleColor', e.target.value)}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                  title={t.customColorTitle}
                                />
                                <div className="w-4 h-4 rounded-full border border-stone-300 dark:border-stone-600 flex items-center justify-center bg-white dark:bg-stone-800 pointer-events-none">
                                  <Icons.Pipette size={9} className="text-stone-500 dark:text-stone-400" />
                                </div>
                              </div>
                              <input
                                type="text"
                                placeholder={t.customHexPlaceholder}
                                value={selectedCard.customTitleColor ? selectedCard.customTitleColor.toUpperCase() : ''}
                                onChange={(e) => {
                                  let val = e.target.value;
                                  if (!val) {
                                    handleUpdateCardField('customTitleColor', undefined);
                                    return;
                                  }
                                  if (!val.startsWith('#') && /^[0-9a-fA-F]{1,6}$/.test(val)) val = '#' + val;
                                  handleUpdateCardField('customTitleColor', val);
                                }}
                                className="text-[9px] font-mono text-stone-700 dark:text-stone-200 font-bold bg-transparent w-[54px] focus:outline-none uppercase border-none p-0"
                              />
                            </div>
                            {selectedCard.customTitleColor && (
                              <button
                                type="button"
                                onClick={() => handleUpdateCardField('customTitleColor', undefined)}
                                className="px-1.5 py-0.5 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-300 text-[9px] font-bold rounded transition-colors cursor-pointer"
                                title={t.resetColorToDefaultTitle}
                              >
                                {t.resetColorToDefault}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Кнопка вызова библиотеки иконок */}
                        <div className="flex items-center justify-between pt-1 border-t border-stone-100 dark:border-stone-800">
                          <button
                            type="button"
                            onClick={() => {
                              setIconPickerTarget('custom');
                              setIconPickerOpen(true);
                            }}
                            className="w-full py-1.5 px-2.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Icons.Sparkles size={13} className="text-amber-600 dark:text-amber-400" />
                            <span>{t.openIconPickerBtn || t.chooseCardIconTitle}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stats Block (Key / Value grid) */}
                  <div className="flex flex-col gap-2.5 border-t border-stone-100 dark:border-stone-800 pt-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-stone-600 dark:text-stone-300">{t.propertiesLabel}</label>
                      <button
                        onClick={handleAddStatRow}
                        className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1 font-bold cursor-pointer"
                      >
                        <Icons.Plus size={12} />
                        <span>{t.addPropertyBtn}</span>
                      </button>
                    </div>

                    <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                      {selectedCard.stats && selectedCard.stats.length > 0 ? (
                        selectedCard.stats.map(stat => (
                          <div key={stat.id} className="flex items-center gap-1.5">
                            <div className="relative w-1/2 flex items-center">
                              <InlineRichInput
                                id={`stat-label-input-${stat.id}`}
                                value={stat.label}
                                placeholder={t.propLabelPlaceholder || "Свойство"}
                                onChange={(val) => handleUpdateStat(stat.id, val, stat.value)}
                                className="w-full pl-2 pr-5 py-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-[10px] text-stone-600 dark:text-stone-300 font-bold focus:bg-white dark:focus:bg-stone-750 flex items-center min-h-[22px]"
                                placeholderClassName="pl-2 pr-5 py-1 text-[10px] text-stone-400 font-bold"
                              />
                              <button
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  const inputEl = document.getElementById(`stat-label-input-${stat.id}`);
                                  if (inputEl) {
                                    const offset = getInlineCaretStringOffset(inputEl);
                                    if (offset >= 0) (inputEl as any).__savedOffset = offset;
                                    const sel = window.getSelection();
                                    if (sel && sel.rangeCount > 0 && inputEl.contains(sel.anchorNode)) {
                                      (inputEl as any).__savedRange = sel.getRangeAt(0).cloneRange();
                                    }
                                  }
                                }}
                                onClick={(e) => {
                                  const inputEl = document.getElementById(`stat-label-input-${stat.id}`);
                                  handleInsertIconToInput(`stat-label-${stat.id}`, e.currentTarget, stat.label, (val) => handleUpdateStat(stat.id, val, stat.value), inputEl);
                                }}
                                className={`absolute right-1 w-3.5 h-3.5 flex items-center justify-center rounded transition-colors cursor-pointer ${
                                  sidebarIconPicker?.id === `stat-label-${stat.id}`
                                    ? 'text-amber-600 bg-amber-100 dark:bg-amber-950/70'
                                    : 'text-stone-400 hover:text-amber-600 dark:hover:text-amber-400'
                                }`}
                                title={t.insertIconTooltip || "Вставить значок"}
                              >
                                <Icons.Smile size={10} />
                              </button>
                            </div>
                            <div className="relative w-1/2 flex items-center">
                              <InlineRichInput
                                id={`stat-val-input-${stat.id}`}
                                value={stat.value}
                                placeholder={t.propValuePlaceholder || "Значение"}
                                onChange={(val) => handleUpdateStat(stat.id, stat.label, val)}
                                className="w-full pl-2 pr-5 py-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-[10px] text-stone-800 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-750 flex items-center min-h-[22px]"
                                placeholderClassName="pl-2 pr-5 py-1 text-[10px] text-stone-400"
                              />
                              <button
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  const inputEl = document.getElementById(`stat-val-input-${stat.id}`);
                                  if (inputEl) {
                                    const offset = getInlineCaretStringOffset(inputEl);
                                    if (offset >= 0) (inputEl as any).__savedOffset = offset;
                                    const sel = window.getSelection();
                                    if (sel && sel.rangeCount > 0 && inputEl.contains(sel.anchorNode)) {
                                      (inputEl as any).__savedRange = sel.getRangeAt(0).cloneRange();
                                    }
                                  }
                                }}
                                onClick={(e) => {
                                  const inputEl = document.getElementById(`stat-val-input-${stat.id}`);
                                  handleInsertIconToInput(`stat-val-${stat.id}`, e.currentTarget, stat.value, (val) => handleUpdateStat(stat.id, stat.label, val), inputEl);
                                }}
                                className={`absolute right-1 w-3.5 h-3.5 flex items-center justify-center rounded transition-colors cursor-pointer ${
                                  sidebarIconPicker?.id === `stat-val-${stat.id}`
                                    ? 'text-amber-600 bg-amber-100 dark:bg-amber-950/70'
                                    : 'text-stone-400 hover:text-amber-600 dark:hover:text-amber-400'
                                }`}
                                title={t.insertIconTooltip || "Вставить значок"}
                              >
                                <Icons.Smile size={10} />
                              </button>
                            </div>
                            <button
                              onClick={() => handleRemoveStatRow(stat.id)}
                              className="text-stone-400 hover:text-red-500 dark:hover:text-red-400 p-1 cursor-pointer shrink-0"
                              title={t.deletePropertyTitle}
                            >
                              <Icons.X size={12} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-stone-400 text-center py-2">
                          {t.noStatsText}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description / Text Area */}
                  <div className="flex flex-col gap-2 border-t border-stone-100 dark:border-stone-800 pt-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-stone-600 dark:text-stone-300">{t.descriptionLabel}</label>
                      <div className="flex items-center gap-1 select-none">
                        {/* 4 alignment buttons replacing font size text label */}
                        <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-0.5 rounded border border-stone-200 dark:border-stone-700 gap-0.5 mr-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateCardField('contentAlign', 'left')}
                            className={`w-5 h-5 flex items-center justify-center rounded text-xs transition-colors cursor-pointer ${
                              selectedCard.contentAlign === 'left'
                                ? 'bg-white dark:bg-stone-700 text-amber-600 dark:text-amber-400 shadow-xs font-bold'
                                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-750'
                            }`}
                            title={t.alignLeftTitle || 'По левому краю'}
                          >
                            <Icons.AlignLeft size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateCardField('contentAlign', 'center')}
                            className={`w-5 h-5 flex items-center justify-center rounded text-xs transition-colors cursor-pointer ${
                              selectedCard.contentAlign === 'center'
                                ? 'bg-white dark:bg-stone-700 text-amber-600 dark:text-amber-400 shadow-xs font-bold'
                                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-750'
                            }`}
                            title={t.alignCenterTitle || 'По центру'}
                          >
                            <Icons.AlignCenter size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateCardField('contentAlign', 'right')}
                            className={`w-5 h-5 flex items-center justify-center rounded text-xs transition-colors cursor-pointer ${
                              selectedCard.contentAlign === 'right'
                                ? 'bg-white dark:bg-stone-700 text-amber-600 dark:text-amber-400 shadow-xs font-bold'
                                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-750'
                            }`}
                            title={t.alignRightTitle || 'По правому краю'}
                          >
                            <Icons.AlignRight size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateCardField('contentAlign', 'justify')}
                            className={`w-5 h-5 flex items-center justify-center rounded text-xs transition-colors cursor-pointer ${
                              (!selectedCard.contentAlign || selectedCard.contentAlign === 'justify')
                                ? 'bg-white dark:bg-stone-700 text-amber-600 dark:text-amber-400 shadow-xs font-bold'
                                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-750'
                            }`}
                            title={t.alignJustifyTitle || 'По ширине (как сейчас)'}
                          >
                            <Icons.AlignJustify size={12} />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const currentSize = selectedCard.fontSize !== undefined ? selectedCard.fontSize : 9;
                            handleUpdateCardField('fontSize', Math.max(5, currentSize - 1));
                          }}
                          className="w-5 h-5 flex items-center justify-center bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 rounded text-xs font-bold cursor-pointer"
                          title={t.decreaseFontSizeTitle}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={selectedCard.fontSize !== undefined ? selectedCard.fontSize : 9}
                          title={t.fontSizeTitle}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) {
                              handleUpdateCardField('fontSize', Math.max(1, Math.min(40, val)));
                            } else {
                              handleUpdateCardField('fontSize', 9);
                            }
                          }}
                          className="w-9 h-5 text-center bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-[10px] text-stone-800 dark:text-stone-100 font-bold focus:outline-none focus:ring-1 focus:ring-stone-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const currentSize = selectedCard.fontSize !== undefined ? selectedCard.fontSize : 9;
                            handleUpdateCardField('fontSize', Math.min(40, currentSize + 1));
                          }}
                          className="w-5 h-5 flex items-center justify-center bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 rounded text-xs font-bold cursor-pointer"
                          title={t.increaseFontSizeTitle}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <RichTextEditor
                      value={selectedCard.content}
                      onChange={(val) => handleUpdateCardField('content', val)}
                      cardId={selectedCard.id}
                      style={{ textAlign: selectedCard.contentAlign || 'justify' }}
                      t={t}
                      userCustomIcons={userCustomIcons}
                    />
                    
                    {/* Text Overflow Toggle Checkbox */}
                    <div className="flex items-center gap-2 mt-1 px-1">
                      <input
                        type="checkbox"
                        id="enableTextOverflow"
                        checked={selectedCard.enableTextOverflow !== false}
                        onChange={(e) => handleUpdateCardField('enableTextOverflow', e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-stone-300 dark:border-stone-600 text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <label htmlFor="enableTextOverflow" className="text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer select-none">
                        {t.textOverflowLabel}
                      </label>
                    </div>
                  </div>

                    <div className="text-[10px] text-stone-500 dark:text-stone-400 leading-snug bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded border border-amber-200/50 dark:border-amber-800/40 flex gap-2 items-start">
                      <Icons.Sparkles size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        {t.richTextHint}
                      </div>
                    </div>

                    {/* Аккордеон: Нижний колонтитул (Подвал) */}
                    <div className="border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden mt-1 bg-white dark:bg-stone-850">
                      <button
                        type="button"
                        onClick={() => setIsFooterAccordionOpen(!isFooterAccordionOpen)}
                        className="w-full flex items-center justify-between p-2.5 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 transition-colors text-left cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2">
                          <Icons.PanelBottom size={15} className="text-amber-700 dark:text-amber-400" />
                          <span className="text-xs font-bold text-stone-700 dark:text-stone-200">{t.footerSectionLabel}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono font-medium">
                            {(!selectedCard.hideFooterLeft || !selectedCard.hideFooterMiddle || !selectedCard.hideFooterRight) ? t.enabledStatus : t.hiddenStatus}
                          </span>
                          {isFooterAccordionOpen ? (
                            <Icons.ChevronUp size={16} className="text-stone-500 dark:text-stone-400" />
                          ) : (
                            <Icons.ChevronDown size={16} className="text-stone-500 dark:text-stone-400" />
                          )}
                        </div>
                      </button>

                      {isFooterAccordionOpen && (
                        <div className="p-3 border-t border-stone-200 dark:border-stone-800 flex flex-col gap-3 bg-white dark:bg-stone-900">
                          <div className="flex items-center gap-2 bg-stone-50 dark:bg-stone-800/60 p-2.5 rounded border border-stone-200 dark:border-stone-700">
                            <input
                              type="checkbox"
                              id="hideFooterCheckbox"
                              checked={!selectedCard.hideFooterLeft || !selectedCard.hideFooterMiddle || !selectedCard.hideFooterRight}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                handleUpdateMultipleFields({
                                  hideFooter: !isChecked,
                                  hideFooterLeft: !isChecked,
                                  hideFooterMiddle: !isChecked,
                                  hideFooterRight: !isChecked
                                });
                              }}
                              className="w-4 h-4 text-amber-600 border-stone-300 dark:border-stone-600 rounded focus:ring-amber-500 accent-amber-600 cursor-pointer"
                            />
                            <label htmlFor="hideFooterCheckbox" className="text-xs text-stone-700 dark:text-stone-300 font-medium cursor-pointer select-none">
                              {t.showFooterCheckbox}
                            </label>
                          </div>

                          <div className="flex flex-col gap-4 pl-1">
                            {/* Левый колонтитул */}
                            <div className="grid grid-cols-[auto_1fr_auto] gap-x-2 gap-y-1 items-center">
                              <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400 col-span-3">{t.footerLeftLabel}:</label>
                              
                              <button
                                type="button"
                                onClick={() => handleUpdateCardField('hideFooterLeft', !selectedCard.hideFooterLeft)}
                                className="w-8 h-8 rounded border border-stone-200 dark:border-stone-700 flex items-center justify-center transition-all cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800 bg-white dark:bg-stone-800 shadow-sm"
                                title={!selectedCard.hideFooterLeft ? t.hideLeftFooterTitle : t.showLeftFooterTitle}
                              >
                                {!selectedCard.hideFooterLeft ? (
                                  <Icons.Eye size={16} className="text-red-600 dark:text-red-400" />
                                ) : (
                                  <Icons.EyeOff size={16} className="text-stone-400" />
                                )}
                              </button>

                              <div className="relative flex items-center w-full">
                                <InlineRichInput
                                  id="footer-left-input"
                                  value={selectedCard.footerTextLeft !== undefined ? selectedCard.footerTextLeft : (selectedCard.footerText !== undefined ? selectedCard.footerText : '')}
                                  onChange={(val) => handleUpdateMultipleFields({ footerTextLeft: val, footerText: val })}
                                  placeholder={t.footerLeftPlaceholder}
                                  maxLength={80}
                                  disabled={!!selectedCard.hideFooterLeft}
                                  className={`px-2.5 pr-7 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-stone-400 focus:bg-white dark:focus:bg-stone-750 text-stone-700 dark:text-stone-200 w-full flex items-center min-h-[30px] ${selectedCard.hideFooterLeft ? 'opacity-50 select-none' : ''}`}
                                  placeholderClassName="px-2.5 pr-7 py-1.5 text-xs text-stone-400"
                                />
                                {!selectedCard.hideFooterLeft && (
                                  <button
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      const inputEl = document.getElementById('footer-left-input');
                                      if (inputEl) {
                                        const offset = getInlineCaretStringOffset(inputEl);
                                        if (offset >= 0) (inputEl as any).__savedOffset = offset;
                                        const sel = window.getSelection();
                                        if (sel && sel.rangeCount > 0 && inputEl.contains(sel.anchorNode)) {
                                          (inputEl as any).__savedRange = sel.getRangeAt(0).cloneRange();
                                        }
                                      }
                                    }}
                                    onClick={(e) => {
                                      const inputEl = document.getElementById('footer-left-input');
                                      const curVal = selectedCard.footerTextLeft !== undefined ? selectedCard.footerTextLeft : (selectedCard.footerText !== undefined ? selectedCard.footerText : '');
                                      handleInsertIconToInput('footer-left', e.currentTarget, curVal, (newVal) => handleUpdateMultipleFields({ footerTextLeft: newVal, footerText: newVal }), inputEl);
                                    }}
                                    className={`absolute right-1.5 w-5 h-5 flex items-center justify-center rounded transition-colors cursor-pointer ${
                                      sidebarIconPicker?.id === 'footer-left'
                                        ? 'text-amber-600 bg-amber-100 dark:bg-amber-950/70'
                                        : 'text-stone-400 hover:text-amber-600 dark:hover:text-amber-400'
                                    }`}
                                    title={t.insertIconTooltip || "Вставить значок"}
                                  >
                                    <Icons.Smile size={13} />
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <label className={`w-8 h-8 rounded border border-stone-200 dark:border-stone-700 cursor-pointer flex items-center justify-center bg-white dark:bg-stone-800 shadow-sm hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors ${selectedCard.hideFooterLeft ? 'opacity-50 pointer-events-none' : ''}`} title={t.chooseColorTitle}>
                                  <input
                                    type="color"
                                    value={selectedCard.customFooterLeftColor || selectedCard.customFooterTextColor || '#a8a29e'}
                                    onChange={(e) => handleUpdateCardField('customFooterLeftColor', e.target.value)}
                                    className="sr-only"
                                    disabled={!!selectedCard.hideFooterLeft}
                                  />
                                  <div 
                                    className="w-4 h-4 rounded border border-black/10 dark:border-white/10" 
                                    style={{ backgroundColor: selectedCard.customFooterLeftColor || selectedCard.customFooterTextColor || '#a8a29e' }}
                                  />
                                </label>
                                {selectedCard.customFooterLeftColor && !selectedCard.hideFooterLeft && (
                                  <button
                                    onClick={() => handleUpdateCardField('customFooterLeftColor', undefined)}
                                    className="w-8 h-8 rounded border border-stone-200 dark:border-stone-700 hover:border-red-200 dark:hover:border-red-800 text-stone-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center transition-all cursor-pointer"
                                    title={t.resetColorBtn}
                                  >
                                    <Icons.X size={14} />
                                  </button>
                                )}
                              </div>
                              
                              <span className="text-[9px] text-stone-400 leading-none col-span-3">
                                {t.footerLeftHelp}
                              </span>
                            </div>

                            {/* Средний колонтитул */}
                            <div className="grid grid-cols-[auto_1fr_auto] gap-x-2 gap-y-1 items-center mt-1">
                              <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400 col-span-3">{t.footerMiddleLabel}:</label>
                              
                              <button
                                type="button"
                                onClick={() => handleUpdateCardField('hideFooterMiddle', !selectedCard.hideFooterMiddle)}
                                className="w-8 h-8 rounded border border-stone-200 dark:border-stone-700 flex items-center justify-center transition-all cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800 bg-white dark:bg-stone-800 shadow-sm"
                                title={!selectedCard.hideFooterMiddle ? t.hideMiddleFooterTitle : t.showMiddleFooterTitle}
                              >
                                {!selectedCard.hideFooterMiddle ? (
                                  <Icons.Eye size={16} className="text-red-600 dark:text-red-400" />
                                ) : (
                                  <Icons.EyeOff size={16} className="text-stone-400" />
                                )}
                              </button>

                              <div className="relative flex items-center w-full">
                                <InlineRichInput
                                  id="footer-middle-input"
                                  value={selectedCard.footerTextMiddle !== undefined ? selectedCard.footerTextMiddle : ''}
                                  onChange={(val) => handleUpdateCardField('footerTextMiddle', val)}
                                  placeholder={t.footerMiddlePlaceholder}
                                  maxLength={80}
                                  disabled={!!selectedCard.hideFooterMiddle}
                                  className={`px-2.5 pr-7 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-stone-400 focus:bg-white dark:focus:bg-stone-750 text-stone-700 dark:text-stone-200 w-full flex items-center min-h-[30px] ${selectedCard.hideFooterMiddle ? 'opacity-50 select-none' : ''}`}
                                  placeholderClassName="px-2.5 pr-7 py-1.5 text-xs text-stone-400"
                                />
                                {!selectedCard.hideFooterMiddle && (
                                  <button
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      const inputEl = document.getElementById('footer-middle-input');
                                      if (inputEl) {
                                        const offset = getInlineCaretStringOffset(inputEl);
                                        if (offset >= 0) (inputEl as any).__savedOffset = offset;
                                        const sel = window.getSelection();
                                        if (sel && sel.rangeCount > 0 && inputEl.contains(sel.anchorNode)) {
                                          (inputEl as any).__savedRange = sel.getRangeAt(0).cloneRange();
                                        }
                                      }
                                    }}
                                    onClick={(e) => {
                                      const inputEl = document.getElementById('footer-middle-input');
                                      const curVal = selectedCard.footerTextMiddle || '';
                                      handleInsertIconToInput('footer-middle', e.currentTarget, curVal, (newVal) => handleUpdateCardField('footerTextMiddle', newVal), inputEl);
                                    }}
                                    className={`absolute right-1.5 w-5 h-5 flex items-center justify-center rounded transition-colors cursor-pointer ${
                                      sidebarIconPicker?.id === 'footer-middle'
                                        ? 'text-amber-600 bg-amber-100 dark:bg-amber-950/70'
                                        : 'text-stone-400 hover:text-amber-600 dark:hover:text-amber-400'
                                    }`}
                                    title={t.insertIconTooltip || "Вставить значок"}
                                  >
                                    <Icons.Smile size={13} />
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <label className={`w-8 h-8 rounded border border-stone-200 dark:border-stone-700 cursor-pointer flex items-center justify-center bg-white dark:bg-stone-800 shadow-sm hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors ${selectedCard.hideFooterMiddle ? 'opacity-50 pointer-events-none' : ''}`} title={t.chooseColorTitle}>
                                  <input
                                    type="color"
                                    value={selectedCard.customFooterMiddleColor || '#a8a29e'}
                                    onChange={(e) => handleUpdateCardField('customFooterMiddleColor', e.target.value)}
                                    className="sr-only"
                                    disabled={!!selectedCard.hideFooterMiddle}
                                  />
                                  <div 
                                    className="w-4 h-4 rounded border border-black/10 dark:border-white/10" 
                                    style={{ backgroundColor: selectedCard.customFooterMiddleColor || '#a8a29e' }}
                                  />
                                </label>
                                {selectedCard.customFooterMiddleColor && !selectedCard.hideFooterMiddle && (
                                  <button
                                    onClick={() => handleUpdateCardField('customFooterMiddleColor', undefined)}
                                    className="w-8 h-8 rounded border border-stone-200 dark:border-stone-700 hover:border-red-200 dark:hover:border-red-800 text-stone-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center transition-all cursor-pointer"
                                    title={t.resetColorBtn}
                                  >
                                    <Icons.X size={14} />
                                  </button>
                                )}
                              </div>
                              
                              <span className="text-[9px] text-stone-400 leading-none col-span-3">
                                {t.footerMiddleHelp}
                              </span>
                            </div>

                            {/* Правый колонтитул */}
                            <div className="grid grid-cols-[auto_1fr_auto] gap-x-2 gap-y-1 items-center mt-1">
                              <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400 col-span-3">{t.footerRightLabel}:</label>
                              
                              <button
                                type="button"
                                onClick={() => handleUpdateCardField('hideFooterRight', !selectedCard.hideFooterRight)}
                                className="w-8 h-8 rounded border border-stone-200 dark:border-stone-700 flex items-center justify-center transition-all cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800 bg-white dark:bg-stone-800 shadow-sm"
                                title={!selectedCard.hideFooterRight ? t.hideRightFooterTitle : t.showRightFooterTitle}
                              >
                                {!selectedCard.hideFooterRight ? (
                                  <Icons.Eye size={16} className="text-red-600 dark:text-red-400" />
                                ) : (
                                  <Icons.EyeOff size={16} className="text-stone-400" />
                                )}
                              </button>

                              <div className="relative flex items-center w-full">
                                <InlineRichInput
                                  id="footer-right-input"
                                  value={selectedCard.footerTextRight !== undefined ? selectedCard.footerTextRight : (selectedCard.cardNumber !== undefined ? selectedCard.cardNumber : '')}
                                  onChange={(val) => handleUpdateMultipleFields({ footerTextRight: val, cardNumber: val })}
                                  placeholder={`#${selectedCard.id.slice(-4)}`}
                                  maxLength={40}
                                  disabled={!!selectedCard.hideFooterRight}
                                  className={`px-2.5 pr-7 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-stone-400 focus:bg-white dark:focus:bg-stone-750 text-stone-700 dark:text-stone-200 font-mono w-full flex items-center min-h-[30px] ${selectedCard.hideFooterRight ? 'opacity-50 select-none' : ''}`}
                                  placeholderClassName="px-2.5 pr-7 py-1.5 text-xs text-stone-400 font-mono"
                                />
                                {!selectedCard.hideFooterRight && (
                                  <button
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      const inputEl = document.getElementById('footer-right-input');
                                      if (inputEl) {
                                        const offset = getInlineCaretStringOffset(inputEl);
                                        if (offset >= 0) (inputEl as any).__savedOffset = offset;
                                        const sel = window.getSelection();
                                        if (sel && sel.rangeCount > 0 && inputEl.contains(sel.anchorNode)) {
                                          (inputEl as any).__savedRange = sel.getRangeAt(0).cloneRange();
                                        }
                                      }
                                    }}
                                    onClick={(e) => {
                                      const inputEl = document.getElementById('footer-right-input');
                                      const curVal = selectedCard.footerTextRight !== undefined ? selectedCard.footerTextRight : (selectedCard.cardNumber !== undefined ? selectedCard.cardNumber : '');
                                      handleInsertIconToInput('footer-right', e.currentTarget, curVal, (newVal) => handleUpdateMultipleFields({ footerTextRight: newVal, cardNumber: newVal }), inputEl);
                                    }}
                                    className={`absolute right-1.5 w-5 h-5 flex items-center justify-center rounded transition-colors cursor-pointer ${
                                      sidebarIconPicker?.id === 'footer-right'
                                        ? 'text-amber-600 bg-amber-100 dark:bg-amber-950/70'
                                        : 'text-stone-400 hover:text-amber-600 dark:hover:text-amber-400'
                                    }`}
                                    title={t.insertIconTooltip || "Вставить значок"}
                                  >
                                    <Icons.Smile size={13} />
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <label className={`w-8 h-8 rounded border border-stone-200 dark:border-stone-700 cursor-pointer flex items-center justify-center bg-white dark:bg-stone-800 shadow-sm hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors ${selectedCard.hideFooterRight ? 'opacity-50 pointer-events-none' : ''}`} title={t.chooseColorTitle}>
                                  <input
                                    type="color"
                                    value={selectedCard.customFooterRightColor || selectedCard.customCardNumberColor || '#a8a29e'}
                                    onChange={(e) => handleUpdateMultipleFields({ customFooterRightColor: e.target.value, customCardNumberColor: e.target.value })}
                                    className="sr-only"
                                    disabled={!!selectedCard.hideFooterRight}
                                  />
                                  <div 
                                    className="w-4 h-4 rounded border border-black/10 dark:border-white/10" 
                                    style={{ backgroundColor: selectedCard.customFooterRightColor || selectedCard.customCardNumberColor || '#a8a29e' }}
                                  />
                                </label>
                                {(selectedCard.customFooterRightColor || selectedCard.customCardNumberColor) && !selectedCard.hideFooterRight && (
                                  <button
                                    onClick={() => handleUpdateMultipleFields({ customFooterRightColor: undefined, customCardNumberColor: undefined })}
                                    className="w-8 h-8 rounded border border-stone-200 dark:border-stone-700 hover:border-red-200 dark:hover:border-red-800 text-stone-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center transition-all cursor-pointer"
                                    title={t.resetColorBtn}
                                  >
                                    <Icons.X size={14} />
                                  </button>
                                )}
                              </div>
                              
                              <span className="text-[9px] text-stone-400 leading-none col-span-3">
                                {t.footerRightHelp}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* Sub-tab 2: Цвета */}
                  {editorSubTab === 'colors' && (
                    <div className="flex flex-col gap-4">
                      {/* Custom Theme Overrides */}
                  <div className="flex flex-col gap-3 border-t border-stone-100 dark:border-stone-800 pt-3">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">{t.cardColorCustomizationLabel}</label>
                      {(selectedCard.customColor || 
                        selectedCard.customTitleColor || 
                        selectedCard.customSubColor || 
                        selectedCard.customSubtitleColor || 
                        selectedCard.customStatsBgColor || 
                        selectedCard.customStatsTextColor || 
                        selectedCard.customContentBgColor || 
                        selectedCard.customContentColor ||
                        selectedCard.customFooterTextColor) && (
                        <button
                          onClick={() => {
                            handleUpdateMultipleFields({
                              customColor: undefined,
                              customTitleColor: undefined,
                              customSubColor: undefined,
                              customSubtitleColor: undefined,
                              customStatsBgColor: undefined,
                              customStatsTextColor: undefined,
                              customContentBgColor: undefined,
                              customContentColor: undefined,
                              customFooterTextColor: undefined,
                            });
                            setSelectedColorPresetId('');
                          }}
                          className="text-[10px] text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-bold flex items-center gap-0.5 cursor-pointer"
                        >
                          <Icons.RotateCcw size={10} />
                          <span>{t.resetAllColorsBtn || t.resetColorBtn}</span>
                        </button>
                      )}
                    </div>

                    {/* Preset Dropdown & Gear Button */}
                    <div className="flex items-center gap-2 bg-stone-50 dark:bg-stone-800/60 p-2 rounded-lg border border-stone-200 dark:border-stone-700">
                      <label htmlFor="color-preset-select" className="text-xs font-bold text-stone-600 dark:text-stone-300 shrink-0">{t.colorPresetLabel || "Preset:"}</label>
                      <div className="flex-1 flex items-center gap-1.5 min-w-0">
                        <select
                          id="color-preset-select"
                          value={selectedColorPresetId}
                          onChange={(e) => {
                            const pId = e.target.value;
                            setSelectedColorPresetId(pId);
                            const preset = colorPresets.find(p => p.id === pId);
                            if (preset) {
                              handleApplyColorPreset(preset);
                            }
                          }}
                          className="flex-1 min-w-0 px-2.5 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-xs font-semibold text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-xs"
                        >
                          <option value="">{t.selectPresetPrompt || "— Select preset —"}</option>
                          {colorPresets.map(preset => (
                            <option key={preset.id} value={preset.id}>
                              {preset.name}
                            </option>
                          ))}
                        </select>
                        
                        <button
                          type="button"
                          id="manage-color-presets-btn"
                          onClick={() => setIsColorPresetsModalOpen(true)}
                          className="w-8 h-8 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white flex items-center justify-center transition-all shadow-xs cursor-pointer shrink-0"
                          title={t.managePresetsBtn}
                        >
                          <Icons.Settings size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Row 1, Col 1: Фон заголовка */}
                      <div className="flex flex-col gap-1 bg-stone-50 dark:bg-stone-800/60 p-2 rounded border border-stone-200 dark:border-stone-700">
                        <span className="text-[9px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider">{t.headerBgColor}</span>
                        <div className="flex items-center justify-between gap-1.5 mt-0.5">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={selectedCard.customColor || getCardColors(selectedCard).primary}
                              onChange={(e) => handleUpdateCardField('customColor', e.target.value)}
                              className="w-6 h-6 rounded border border-stone-300 dark:border-stone-600 cursor-pointer p-0 shrink-0"
                            />
                            <input
                              type="text"
                              placeholder={t.defaultStatus || "Default"}
                              value={selectedCard.customColor ? selectedCard.customColor.toUpperCase() : ''}
                              onChange={(e) => {
                                let val = e.target.value;
                                if (!val) {
                                  handleUpdateCardField('customColor', undefined);
                                  return;
                                }
                                if (/^[0-9a-fA-F]{1,6}$/.test(val)) {
                                  val = '#' + val;
                                }
                                handleUpdateCardField('customColor', val);
                              }}
                              className="text-[10px] font-mono text-stone-700 dark:text-stone-200 font-bold bg-transparent w-[72px] focus:outline-none focus:bg-white dark:focus:bg-stone-800 rounded px-1 py-0.5 border border-transparent focus:border-stone-300 dark:focus:border-stone-600 transition-all uppercase"
                            />
                          </div>
                          {selectedCard.customColor && (
                            <button
                              onClick={() => handleUpdateCardField('customColor', undefined)}
                              title={t.resetColorBtn}
                              className="p-1 rounded bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
                            >
                              <Icons.RotateCcw size={11} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Row 1, Col 2: Текст заголовка */}
                      <div className="flex flex-col gap-1 bg-stone-50 dark:bg-stone-800/60 p-2 rounded border border-stone-200 dark:border-stone-700">
                        <span className="text-[9px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider">{t.headerTextColor}</span>
                        <div className="flex items-center justify-between gap-1.5 mt-0.5">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={selectedCard.customTitleColor || '#ffffff'}
                              onChange={(e) => handleUpdateCardField('customTitleColor', e.target.value)}
                              className="w-6 h-6 rounded border border-stone-300 dark:border-stone-600 cursor-pointer p-0 shrink-0"
                            />
                            <input
                              type="text"
                              placeholder={t.defaultStatus || "Default"}
                              value={selectedCard.customTitleColor ? selectedCard.customTitleColor.toUpperCase() : ''}
                              onChange={(e) => {
                                let val = e.target.value;
                                if (!val) {
                                  handleUpdateCardField('customTitleColor', undefined);
                                  return;
                                }
                                if (/^[0-9a-fA-F]{1,6}$/.test(val)) {
                                  val = '#' + val;
                                }
                                handleUpdateCardField('customTitleColor', val);
                              }}
                              className="text-[10px] font-mono text-stone-700 dark:text-stone-200 font-bold bg-transparent w-[72px] focus:outline-none focus:bg-white dark:focus:bg-stone-800 rounded px-1 py-0.5 border border-transparent focus:border-stone-300 dark:focus:border-stone-600 transition-all uppercase"
                            />
                          </div>
                          {selectedCard.customTitleColor && (
                            <button
                              onClick={() => handleUpdateCardField('customTitleColor', undefined)}
                              title={t.resetColorBtn}
                              className="p-1 rounded bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
                            >
                              <Icons.RotateCcw size={11} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Row 2, Col 1: Фон подзаголовка */}
                      <div className="flex flex-col gap-1 bg-stone-50 dark:bg-stone-800/60 p-2 rounded border border-stone-200 dark:border-stone-700">
                        <span className="text-[9px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider">{t.subtitleBgColor}</span>
                        <div className="flex items-center justify-between gap-1.5 mt-0.5">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={selectedCard.customSubColor || getCardColors(selectedCard).secondary}
                              onChange={(e) => handleUpdateCardField('customSubColor', e.target.value)}
                              className="w-6 h-6 rounded border border-stone-300 dark:border-stone-600 cursor-pointer p-0 shrink-0"
                            />
                            <input
                              type="text"
                              placeholder={t.defaultStatus || "Default"}
                              value={selectedCard.customSubColor ? selectedCard.customSubColor.toUpperCase() : ''}
                              onChange={(e) => {
                                let val = e.target.value;
                                if (!val) {
                                  handleUpdateCardField('customSubColor', undefined);
                                  return;
                                }
                                if (/^[0-9a-fA-F]{1,6}$/.test(val)) {
                                  val = '#' + val;
                                }
                                handleUpdateCardField('customSubColor', val);
                              }}
                              className="text-[10px] font-mono text-stone-700 dark:text-stone-200 font-bold bg-transparent w-[72px] focus:outline-none focus:bg-white dark:focus:bg-stone-800 rounded px-1 py-0.5 border border-transparent focus:border-stone-300 dark:focus:border-stone-600 transition-all uppercase"
                            />
                          </div>
                          {selectedCard.customSubColor && (
                            <button
                              onClick={() => handleUpdateCardField('customSubColor', undefined)}
                              title={t.resetColorBtn}
                              className="p-1 rounded bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
                            >
                              <Icons.RotateCcw size={11} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Row 2, Col 2: Текст подзаголовка */}
                      <div className="flex flex-col gap-1 bg-stone-50 dark:bg-stone-800/60 p-2 rounded border border-stone-200 dark:border-stone-700">
                        <span className="text-[9px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider">{t.subtitleTextColor}</span>
                        <div className="flex items-center justify-between gap-1.5 mt-0.5">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={selectedCard.customSubtitleColor || '#ffffff'}
                              onChange={(e) => handleUpdateCardField('customSubtitleColor', e.target.value)}
                              className="w-6 h-6 rounded border border-stone-300 dark:border-stone-600 cursor-pointer p-0 shrink-0"
                            />
                            <input
                              type="text"
                              placeholder={t.defaultStatus || "Default"}
                              value={selectedCard.customSubtitleColor ? selectedCard.customSubtitleColor.toUpperCase() : ''}
                              onChange={(e) => {
                                let val = e.target.value;
                                if (!val) {
                                  handleUpdateCardField('customSubtitleColor', undefined);
                                  return;
                                }
                                if (/^[0-9a-fA-F]{1,6}$/.test(val)) {
                                  val = '#' + val;
                                }
                                handleUpdateCardField('customSubtitleColor', val);
                              }}
                              className="text-[10px] font-mono text-stone-700 dark:text-stone-200 font-bold bg-transparent w-[72px] focus:outline-none focus:bg-white dark:focus:bg-stone-800 rounded px-1 py-0.5 border border-transparent focus:border-stone-300 dark:focus:border-stone-600 transition-all uppercase"
                            />
                          </div>
                          {selectedCard.customSubtitleColor && (
                            <button
                              onClick={() => handleUpdateCardField('customSubtitleColor', undefined)}
                              title={t.resetColorBtn}
                              className="p-1 rounded bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
                            >
                              <Icons.RotateCcw size={11} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Row 3, Col 1: Фон характеристик */}
                      <div className="flex flex-col gap-1 bg-stone-50 dark:bg-stone-800/60 p-2 rounded border border-stone-200 dark:border-stone-700">
                        <span className="text-[9px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider">{t.statsBgColor}</span>
                        <div className="flex items-center justify-between gap-1.5 mt-0.5">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={selectedCard.customStatsBgColor || '#f5f5f4'}
                              onChange={(e) => handleUpdateCardField('customStatsBgColor', e.target.value)}
                              className="w-6 h-6 rounded border border-stone-300 dark:border-stone-600 cursor-pointer p-0 shrink-0"
                            />
                            <input
                              type="text"
                              placeholder={t.defaultStatus || "Default"}
                              value={selectedCard.customStatsBgColor ? selectedCard.customStatsBgColor.toUpperCase() : ''}
                              onChange={(e) => {
                                let val = e.target.value;
                                if (!val) {
                                  handleUpdateCardField('customStatsBgColor', undefined);
                                  return;
                                }
                                if (/^[0-9a-fA-F]{1,6}$/.test(val)) {
                                  val = '#' + val;
                                }
                                handleUpdateCardField('customStatsBgColor', val);
                              }}
                              className="text-[10px] font-mono text-stone-700 dark:text-stone-200 font-bold bg-transparent w-[72px] focus:outline-none focus:bg-white dark:focus:bg-stone-800 rounded px-1 py-0.5 border border-transparent focus:border-stone-300 dark:focus:border-stone-600 transition-all uppercase"
                            />
                          </div>
                          {selectedCard.customStatsBgColor && (
                            <button
                              onClick={() => handleUpdateCardField('customStatsBgColor', undefined)}
                              title={t.resetColorBtn}
                              className="p-1 rounded bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
                            >
                              <Icons.RotateCcw size={11} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Row 3, Col 2: Текст характеристик */}
                      <div className="flex flex-col gap-1 bg-stone-50 dark:bg-stone-800/60 p-2 rounded border border-stone-200 dark:border-stone-700">
                        <span className="text-[9px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider">{t.statsTextColor}</span>
                        <div className="flex items-center justify-between gap-1.5 mt-0.5">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={selectedCard.customStatsTextColor || '#1c1917'}
                              onChange={(e) => handleUpdateCardField('customStatsTextColor', e.target.value)}
                              className="w-6 h-6 rounded border border-stone-300 dark:border-stone-600 cursor-pointer p-0 shrink-0"
                            />
                            <input
                              type="text"
                              placeholder={t.defaultStatus || "Default"}
                              value={selectedCard.customStatsTextColor ? selectedCard.customStatsTextColor.toUpperCase() : ''}
                              onChange={(e) => {
                                let val = e.target.value;
                                if (!val) {
                                  handleUpdateCardField('customStatsTextColor', undefined);
                                  return;
                                }
                                if (/^[0-9a-fA-F]{1,6}$/.test(val)) {
                                  val = '#' + val;
                                }
                                handleUpdateCardField('customStatsTextColor', val);
                              }}
                              className="text-[10px] font-mono text-stone-700 dark:text-stone-200 font-bold bg-transparent w-[72px] focus:outline-none focus:bg-white dark:focus:bg-stone-800 rounded px-1 py-0.5 border border-transparent focus:border-stone-300 dark:focus:border-stone-600 transition-all uppercase"
                            />
                          </div>
                          {selectedCard.customStatsTextColor && (
                            <button
                              onClick={() => handleUpdateCardField('customStatsTextColor', undefined)}
                              title={t.resetColorBtn}
                              className="p-1 rounded bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
                            >
                              <Icons.RotateCcw size={11} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Row 4, Col 1: Фон описания */}
                      <div className="flex flex-col gap-1 bg-stone-50 dark:bg-stone-800/60 p-2 rounded border border-stone-200 dark:border-stone-700">
                        <span className="text-[9px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider">{t.contentBgColor}</span>
                        <div className="flex items-center justify-between gap-1.5 mt-0.5">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={selectedCard.customContentBgColor || '#fafaf9'}
                              onChange={(e) => handleUpdateCardField('customContentBgColor', e.target.value)}
                              className="w-6 h-6 rounded border border-stone-300 dark:border-stone-600 cursor-pointer p-0 shrink-0"
                            />
                            <input
                              type="text"
                              placeholder={t.defaultStatus || "Default"}
                              value={selectedCard.customContentBgColor ? selectedCard.customContentBgColor.toUpperCase() : ''}
                              onChange={(e) => {
                                let val = e.target.value;
                                if (!val) {
                                  handleUpdateCardField('customContentBgColor', undefined);
                                  return;
                                }
                                if (/^[0-9a-fA-F]{1,6}$/.test(val)) {
                                  val = '#' + val;
                                }
                                handleUpdateCardField('customContentBgColor', val);
                              }}
                              className="text-[10px] font-mono text-stone-700 dark:text-stone-200 font-bold bg-transparent w-[72px] focus:outline-none focus:bg-white dark:focus:bg-stone-800 rounded px-1 py-0.5 border border-transparent focus:border-stone-300 dark:focus:border-stone-600 transition-all uppercase"
                            />
                          </div>
                          {selectedCard.customContentBgColor && (
                            <button
                              onClick={() => handleUpdateCardField('customContentBgColor', undefined)}
                              title={t.resetColorBtn}
                              className="p-1 rounded bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
                            >
                              <Icons.RotateCcw size={11} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Row 4, Col 2: Текст описания */}
                      <div className="flex flex-col gap-1 bg-stone-50 dark:bg-stone-800/60 p-2 rounded border border-stone-200 dark:border-stone-700">
                        <span className="text-[9px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider">{t.contentTextColor}</span>
                        <div className="flex items-center justify-between gap-1.5 mt-0.5">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={selectedCard.customContentColor || '#1c1917'}
                              onChange={(e) => handleUpdateCardField('customContentColor', e.target.value)}
                              className="w-6 h-6 rounded border border-stone-300 dark:border-stone-600 cursor-pointer p-0 shrink-0"
                            />
                            <input
                              type="text"
                              placeholder={t.defaultStatus || "Default"}
                              value={selectedCard.customContentColor ? selectedCard.customContentColor.toUpperCase() : ''}
                              onChange={(e) => {
                                let val = e.target.value;
                                if (!val) {
                                  handleUpdateCardField('customContentColor', undefined);
                                  return;
                                }
                                if (/^[0-9a-fA-F]{1,6}$/.test(val)) {
                                  val = '#' + val;
                                }
                                handleUpdateCardField('customContentColor', val);
                              }}
                              className="text-[10px] font-mono text-stone-700 dark:text-stone-200 font-bold bg-transparent w-[72px] focus:outline-none focus:bg-white dark:focus:bg-stone-800 rounded px-1 py-0.5 border border-transparent focus:border-stone-300 dark:focus:border-stone-600 transition-all uppercase"
                            />
                          </div>
                          {selectedCard.customContentColor && (
                            <button
                              onClick={() => handleUpdateCardField('customContentColor', undefined)}
                              title={t.resetColorBtn}
                              className="p-1 rounded bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
                            >
                              <Icons.RotateCcw size={11} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Row 5: Текст колонтитула (подвала) */}
                      <div className="col-span-2 flex flex-col gap-1 bg-stone-50 dark:bg-stone-800/60 p-2 rounded border border-stone-200 dark:border-stone-700">
                        <span className="text-[9px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider">{t.footerTextColor || 'Текст колонтитула (подвала)'}</span>
                        <div className="flex items-center justify-between gap-1.5 mt-0.5">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={selectedCard.customFooterTextColor || '#a8a29e'}
                              onChange={(e) => handleUpdateCardField('customFooterTextColor', e.target.value)}
                              className="w-6 h-6 rounded border border-stone-300 dark:border-stone-600 cursor-pointer p-0 shrink-0"
                            />
                            <input
                              type="text"
                              placeholder={t.defaultStatus || "Default"}
                              value={selectedCard.customFooterTextColor ? selectedCard.customFooterTextColor.toUpperCase() : ''}
                              onChange={(e) => {
                                let val = e.target.value;
                                if (!val) {
                                  handleUpdateCardField('customFooterTextColor', undefined);
                                  return;
                                }
                                if (/^[0-9a-fA-F]{1,6}$/.test(val)) {
                                  val = '#' + val;
                                }
                                handleUpdateCardField('customFooterTextColor', val);
                              }}
                              className="text-[10px] font-mono text-stone-700 dark:text-stone-200 font-bold bg-transparent w-[72px] focus:outline-none focus:bg-white dark:focus:bg-stone-800 rounded px-1 py-0.5 border border-transparent focus:border-stone-300 dark:focus:border-stone-600 transition-all uppercase"
                            />
                          </div>
                          {selectedCard.customFooterTextColor && (
                            <button
                              onClick={() => handleUpdateCardField('customFooterTextColor', undefined)}
                              title={t.resetColorBtn}
                              className="p-1 rounded bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
                            >
                              <Icons.RotateCcw size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Save as Preset Button */}
                    <button
                      type="button"
                      id="save-as-preset-btn"
                      onClick={() => {
                        setNewPresetName(appSettings.language === 'en' ? `Preset ${colorPresets.length + 1}` : `Пресет ${colorPresets.length + 1}`);
                        setIsSaveColorPresetModalOpen(true);
                      }}
                      className="mt-1 w-full py-2 px-3 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded shadow-xs hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Icons.BookmarkPlus size={15} />
                      <span>{t.saveAsPresetBtn}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-tab 3: Разметка */}
              {editorSubTab === 'layout' && (
                <div className="flex flex-col gap-5">
                  {/* Section 1: Card Dimensions */}
                  <div className="flex flex-col gap-3">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-1.5">
                      <span>{t.cardDimensionsLabel}</span>
                      <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200/50 dark:border-amber-800/40">
                        {selectedCard.width || 63} × {selectedCard.height || 88} {appSettings.language === 'en' ? 'mm' : 'мм'}
                      </span>
                    </label>

                    {/* Two side-by-side text/number inputs */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Width input */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400">{t.cardWidthLabel}</span>
                        <div className="flex items-center gap-0">
                          <button
                            type="button"
                            onClick={() => handleUpdateCardDimensions(Math.max(20, (selectedCard.width || 63) - 1), undefined)}
                            className="w-7 h-7 flex items-center justify-center border border-stone-300 dark:border-stone-600 rounded-l bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 hover:text-stone-950 dark:hover:text-white font-bold cursor-pointer transition-colors shrink-0"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="20"
                            max="200"
                            value={selectedCard.width !== undefined ? selectedCard.width : 63}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val)) {
                                handleUpdateCardDimensions(val, undefined);
                              }
                            }}
                            className="w-full text-center py-1 border-y border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 text-xs font-bold text-stone-800 dark:text-stone-100 focus:outline-none focus:bg-white dark:focus:bg-stone-750"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateCardDimensions(Math.min(200, (selectedCard.width || 63) + 1), undefined)}
                            className="w-7 h-7 flex items-center justify-center border border-stone-300 dark:border-stone-600 rounded-r bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 hover:text-stone-950 dark:hover:text-white font-bold cursor-pointer transition-colors shrink-0"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Height input */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400">{t.cardHeightLabel}</span>
                        <div className="flex items-center gap-0">
                          <button
                            type="button"
                            onClick={() => handleUpdateCardDimensions(undefined, Math.max(20, (selectedCard.height || 88) - 1))}
                            className="w-7 h-7 flex items-center justify-center border border-stone-300 dark:border-stone-600 rounded-l bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 hover:text-stone-950 dark:hover:text-white font-bold cursor-pointer transition-colors shrink-0"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="20"
                            max="300"
                            value={selectedCard.height !== undefined ? selectedCard.height : 88}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val)) {
                                handleUpdateCardDimensions(undefined, val);
                              }
                            }}
                            className="w-full text-center py-1 border-y border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 text-xs font-bold text-stone-800 dark:text-stone-100 focus:outline-none focus:bg-white dark:focus:bg-stone-750"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateCardDimensions(undefined, Math.min(300, (selectedCard.height || 88) + 1))}
                            className="w-7 h-7 flex items-center justify-center border border-stone-300 dark:border-stone-600 rounded-r bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 hover:text-stone-950 dark:hover:text-white font-bold cursor-pointer transition-colors shrink-0"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Popular Size Templates */}
                    <div className="flex flex-col gap-1.5 mt-1">
                      <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400">{t.popularSizesLabel}</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { labelRu: 'Стандарт (63 × 88 мм)', labelEn: 'Standard (63 × 88 mm)', w: 63, h: 88, subRu: 'Покер / MTG', subEn: 'Poker / MTG' },
                          { labelRu: 'Мини (44 × 67 мм)', labelEn: 'Mini (44 × 67 mm)', w: 44, h: 67, subRu: 'Настолки', subEn: 'Boardgames' },
                          { labelRu: 'Евро / Бридж (56 × 87 мм)', labelEn: 'Euro / Bridge (56 × 87 mm)', w: 56, h: 87, subRu: 'Бридж', subEn: 'Bridge' },
                          { labelRu: 'Таро (70 × 120 мм)', labelEn: 'Tarot (70 × 120 mm)', w: 70, h: 120, subRu: 'Большой формат', subEn: 'Large format' },
                          { labelRu: 'Квадрат (70 × 70 мм)', labelEn: 'Square (70 × 70 mm)', w: 70, h: 70, subRu: 'Квадратная', subEn: 'Square' },
                          { labelRu: 'Домино (41 × 63 мм)', labelEn: 'Domino (41 × 63 mm)', w: 41, h: 63, subRu: 'Компакт', subEn: 'Compact' },
                        ].map((preset) => {
                          const isMatch = (selectedCard.width || 63) === preset.w && (selectedCard.height || 88) === preset.h;
                          const label = appSettings.language === 'en' ? preset.labelEn : preset.labelRu;
                          const sub = appSettings.language === 'en' ? preset.subEn : preset.subRu;
                          return (
                            <button
                              key={preset.labelRu}
                              type="button"
                              onClick={() => handleUpdateCardDimensions(preset.w, preset.h)}
                              className={`px-2.5 py-1.5 border rounded text-[10px] font-medium text-left transition-colors cursor-pointer flex flex-col justify-between ${
                                isMatch
                                  ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold shadow-xs'
                                  : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                              }`}
                            >
                              <span className="leading-tight">{label}</span>
                              <span className={`text-[9px] ${isMatch ? 'text-amber-700 dark:text-amber-400' : 'text-stone-400 dark:text-stone-500'}`}>{sub}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Checkbox: Apply size to entire deck */}
                    <div className="flex items-center gap-2.5 p-2.5 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-lg shadow-2xs mt-1">
                      <input
                        type="checkbox"
                        id="applySizeToAll"
                        checked={applySizeToAll}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setApplySizeToAll(checked);
                          if (checked && selectedCard) {
                            const currentW = selectedCard.width || 63;
                            const currentH = selectedCard.height || 88;
                            const updated = cards.map(c => ({ ...c, width: currentW, height: currentH }));
                            saveCards(updated);
                          }
                        }}
                        className="w-4 h-4 text-amber-600 border-stone-300 dark:border-stone-600 rounded focus:ring-amber-500 accent-amber-600 cursor-pointer shrink-0"
                      />
                      <label htmlFor="applySizeToAll" className="text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer select-none leading-tight">
                        {t.applySizeToAllDeck}
                      </label>
                    </div>
                  </div>

                  {/* Section 2: Corner Rounding Settings */}
                  <div className="flex flex-col gap-3 border-t border-stone-200 dark:border-stone-800 pt-4">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-1.5">
                      <span>{t.cardRoundingLabel}</span>
                      <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200/50 dark:border-amber-800/40">
                        {selectedCard.borderRadius !== undefined ? selectedCard.borderRadius : 3} px
                      </span>
                    </label>

                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="30"
                        step="1"
                        value={selectedCard.borderRadius !== undefined ? selectedCard.borderRadius : 3}
                        onChange={(e) => handleUpdateCardRounding(parseInt(e.target.value))}
                        className="flex-1 accent-amber-600 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg cursor-pointer"
                      />
                      
                      <div className="flex items-center gap-0 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const current = selectedCard.borderRadius !== undefined ? selectedCard.borderRadius : 3;
                            handleUpdateCardRounding(Math.max(0, current - 1));
                          }}
                          className="w-7 h-7 flex items-center justify-center border border-stone-300 dark:border-stone-600 rounded-l bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 hover:text-stone-950 dark:hover:text-white font-bold cursor-pointer transition-colors"
                        >
                          -
                        </button>
                        <input
                          type="text"
                          value={`${selectedCard.borderRadius !== undefined ? selectedCard.borderRadius : 3} px`}
                          onChange={(e) => {
                            const numeric = parseInt(e.target.value.replace(/\D/g, ''));
                            const val = isNaN(numeric) ? 0 : numeric;
                            handleUpdateCardRounding(Math.min(30, Math.max(0, val)));
                          }}
                          className="w-12 text-center py-1 border-y border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 text-[11px] font-bold text-stone-700 dark:text-stone-200 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const current = selectedCard.borderRadius !== undefined ? selectedCard.borderRadius : 3;
                            handleUpdateCardRounding(Math.min(30, current + 1));
                          }}
                          className="w-7 h-7 flex items-center justify-center border border-stone-300 dark:border-stone-600 rounded-r bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 hover:text-stone-950 dark:hover:text-white font-bold cursor-pointer transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 mt-1">
                      <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400">{t.popularRoundingLabel}</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { label: t.roundingSharp, val: 0 },
                          { label: t.roundingStandard, val: 3 },
                          { label: t.roundingMtg, val: 10 },
                          { label: t.roundingPoker, val: 12 },
                          { label: t.roundingCollectible, val: 14 },
                          { label: t.roundingRound, val: 18 },
                        ].map((preset) => (
                          <button
                            key={preset.val}
                            type="button"
                            onClick={() => handleUpdateCardRounding(preset.val)}
                            className={`px-2.5 py-1.5 border rounded text-[10px] font-medium text-left transition-colors cursor-pointer leading-tight ${
                              (selectedCard.borderRadius !== undefined ? selectedCard.borderRadius : 3) === preset.val
                                ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold shadow-xs'
                                : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Checkbox: Apply rounding to entire deck */}
                    <div className="flex items-center gap-2.5 p-2.5 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-lg shadow-2xs mt-1">
                      <input
                        type="checkbox"
                        id="applyRoundingToAll"
                        checked={applyRoundingToAll}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setApplyRoundingToAll(checked);
                          if (checked && selectedCard) {
                            const currentR = selectedCard.borderRadius !== undefined ? selectedCard.borderRadius : 3;
                            const updated = cards.map(c => ({ ...c, borderRadius: currentR }));
                            saveCards(updated);
                          }
                        }}
                        className="w-4 h-4 text-amber-600 border-stone-300 dark:border-stone-600 rounded focus:ring-amber-500 accent-amber-600 cursor-pointer shrink-0"
                      />
                      <label htmlFor="applyRoundingToAll" className="text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer select-none leading-tight">
                        {t.applyRoundingToAllDeck}
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'templates' ? (
                <div className="flex flex-col gap-4">
                  {/* Art Link Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-stone-600 dark:text-stone-300">{t.artUrlLabel}</label>
                    <div className="flex gap-2 w-full">
                      <input
                        type="text"
                        value={selectedCard.artUrl || ''}
                        onChange={(e) => handleUpdateCardField('artUrl', e.target.value)}
                        placeholder={t.artUrlPlaceholder}
                        className="flex-grow px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-stone-400 focus:bg-white dark:focus:bg-stone-750 text-stone-800 dark:text-stone-100 min-w-0"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const url = selectedCard.artUrl?.trim();
                          if (url) {
                            addToLibrary(url);
                          }
                        }}
                        disabled={!selectedCard.artUrl?.trim()}
                        className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-100 dark:disabled:bg-stone-800 disabled:text-stone-400 dark:disabled:text-stone-600 disabled:border-stone-200 dark:disabled:border-stone-700 text-stone-950 font-bold text-xs rounded transition-all shadow-sm shrink-0 flex items-center gap-1 cursor-pointer border border-amber-700 disabled:cursor-not-allowed"
                        title={t.addToLibraryBtn}
                      >
                        <Icons.Plus size={13} />
                        <span>{t.addToLibraryBtn}</span>
                      </button>
                    </div>
                  </div>

                  {/* Sliders for scale and offset */}
                  {selectedCard.artUrl && (
                    <div className="flex flex-col gap-3 bg-stone-50 dark:bg-stone-800/70 p-2.5 rounded border border-stone-200 dark:border-stone-700">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-stone-700 dark:text-stone-200">{t.blockAndArtSettings}</span>
                        {isStatsOnSecondPage(selectedCard, rarities) && (
                          <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-700" title={t.statsOnPageTwoTooltip}>
                            {t.statsOnPageTwoBadge}
                          </span>
                        )}
                      </div>

                      {/* Full illustration checkbox */}
                      <label className={`flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300 select-none bg-stone-100/80 dark:bg-stone-800 p-1.5 rounded transition-colors border border-stone-200/60 dark:border-stone-700 ${
                        (selectedCard.artAsDescriptionBg || selectedCard.artAsStatsBg)
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-stone-200/60 dark:hover:bg-stone-750 cursor-pointer'
                      }`}
                      title={(selectedCard.artAsDescriptionBg || selectedCard.artAsStatsBg) ? 'Заблокировано, так как включено использование иллюстрации как фон' : undefined}
                      >
                        <input
                          type="checkbox"
                          disabled={!!(selectedCard.artAsDescriptionBg || selectedCard.artAsStatsBg)}
                          checked={!!selectedCard.fullIllustration}
                          onChange={(e) => handleUpdateCardField('fullIllustration', e.target.checked)}
                          className="accent-amber-600 rounded cursor-pointer disabled:cursor-not-allowed"
                        />
                        <span className="font-medium text-stone-800 dark:text-stone-100">{t.fullIllustrationCheckbox}</span>
                      </label>

                      {/* Checkbox: Art as description background */}
                      <div className="flex flex-col gap-2 bg-stone-100/80 dark:bg-stone-800 p-2 rounded border border-stone-200/60 dark:border-stone-700">
                        <label className={`flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300 select-none transition-colors ${
                          selectedCard.fullIllustration ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                        title={selectedCard.fullIllustration ? 'Заблокировано, так как включена иллюстрация на всю карту' : undefined}
                        >
                          <input
                            type="checkbox"
                            disabled={!!selectedCard.fullIllustration}
                            checked={!!selectedCard.artAsDescriptionBg}
                            onChange={(e) => handleUpdateCardField('artAsDescriptionBg', e.target.checked)}
                            className="accent-amber-600 rounded cursor-pointer disabled:cursor-not-allowed"
                          />
                          <span className="font-medium text-stone-800 dark:text-stone-100">{t.artAsDescriptionBgCheckbox}</span>
                        </label>

                        {/* Description art opacity & brightness sliders */}
                        {selectedCard.artAsDescriptionBg && !selectedCard.fullIllustration && (
                          <div className="flex flex-col gap-2 pt-2 border-t border-stone-200/60 dark:border-stone-700">
                            {/* Opacity slider */}
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400">
                                <span>{t.artDescriptionOpacityLabel} {selectedCard.descriptionArtOpacity !== undefined ? selectedCard.descriptionArtOpacity : 100}%</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={selectedCard.descriptionArtOpacity !== undefined ? selectedCard.descriptionArtOpacity : 100}
                                  onChange={(e) => handleUpdateCardField('descriptionArtOpacity', parseInt(e.target.value))}
                                  className="flex-1 accent-amber-600 cursor-pointer"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCardField('descriptionArtOpacity', 100)}
                                  title="100%"
                                  className="p-1 text-stone-400 dark:text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-200/50 dark:hover:bg-stone-700/50 rounded transition-colors cursor-pointer shrink-0"
                                >
                                  <Icons.RotateCcw size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Brightness slider */}
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400">
                                <span>{t.artDescriptionBrightnessLabel} {selectedCard.descriptionArtBrightness !== undefined ? selectedCard.descriptionArtBrightness : 100}%</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="10"
                                  max="200"
                                  value={selectedCard.descriptionArtBrightness !== undefined ? selectedCard.descriptionArtBrightness : 100}
                                  onChange={(e) => handleUpdateCardField('descriptionArtBrightness', parseInt(e.target.value))}
                                  className="flex-1 accent-amber-600 cursor-pointer"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCardField('descriptionArtBrightness', 100)}
                                  title="100%"
                                  className="p-1 text-stone-400 dark:text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-200/50 dark:hover:bg-stone-700/50 rounded transition-colors cursor-pointer shrink-0"
                                >
                                  <Icons.RotateCcw size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Checkbox: Art as stats background */}
                      <div className="flex flex-col gap-2 bg-stone-100/80 dark:bg-stone-800 p-2 rounded border border-stone-200/60 dark:border-stone-700">
                        <label className={`flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300 select-none transition-colors ${
                          selectedCard.fullIllustration ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                        title={selectedCard.fullIllustration ? 'Заблокировано, так как включена иллюстрация на всю карту' : undefined}
                        >
                          <input
                            type="checkbox"
                            disabled={!!selectedCard.fullIllustration}
                            checked={!!selectedCard.artAsStatsBg}
                            onChange={(e) => handleUpdateCardField('artAsStatsBg', e.target.checked)}
                            className="accent-amber-600 rounded cursor-pointer disabled:cursor-not-allowed"
                          />
                          <span className="font-medium text-stone-800 dark:text-stone-100">{t.artAsStatsBgCheckbox}</span>
                        </label>

                        {/* Stats art opacity & brightness sliders */}
                        {selectedCard.artAsStatsBg && !selectedCard.fullIllustration && (
                          <div className="flex flex-col gap-2 pt-2 border-t border-stone-200/60 dark:border-stone-700">
                            {/* Opacity slider */}
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400">
                                <span>{t.artStatsOpacityLabel} {selectedCard.statsArtOpacity !== undefined ? selectedCard.statsArtOpacity : 100}%</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={selectedCard.statsArtOpacity !== undefined ? selectedCard.statsArtOpacity : 100}
                                  onChange={(e) => handleUpdateCardField('statsArtOpacity', parseInt(e.target.value))}
                                  className="flex-1 accent-amber-600 cursor-pointer"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCardField('statsArtOpacity', 100)}
                                  title="100%"
                                  className="p-1 text-stone-400 dark:text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-200/50 dark:hover:bg-stone-700/50 rounded transition-colors cursor-pointer shrink-0"
                                >
                                  <Icons.RotateCcw size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Brightness slider */}
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400">
                                <span>{t.artStatsBrightnessLabel} {selectedCard.statsArtBrightness !== undefined ? selectedCard.statsArtBrightness : 75}%</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="10"
                                  max="200"
                                  value={selectedCard.statsArtBrightness !== undefined ? selectedCard.statsArtBrightness : 75}
                                  onChange={(e) => handleUpdateCardField('statsArtBrightness', parseInt(e.target.value))}
                                  className="flex-1 accent-amber-600 cursor-pointer"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCardField('statsArtBrightness', 75)}
                                  title="75%"
                                  className="p-1 text-stone-400 dark:text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-200/50 dark:hover:bg-stone-700/50 rounded transition-colors cursor-pointer shrink-0"
                                >
                                  <Icons.RotateCcw size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Illustration Height Slider */}
                      {!selectedCard.fullIllustration && !selectedCard.artAsDescriptionBg && !selectedCard.artAsStatsBg && (
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400">
                            <span>{t.blockHeightLabel} {selectedCard.illustrationHeight || 112}px</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="40"
                              max="280"
                              step="2"
                              value={selectedCard.illustrationHeight || 112}
                              onChange={(e) => handleUpdateCardField('illustrationHeight', parseInt(e.target.value))}
                              className="flex-1 accent-amber-600 cursor-pointer"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateCardField('illustrationHeight', 112)}
                              title={`${t.resetBlockHeightTitle} (112px)`}
                              className="p-1 text-stone-400 dark:text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-200/50 dark:hover:bg-stone-700/50 rounded transition-colors cursor-pointer shrink-0"
                            >
                              <Icons.RotateCcw size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400">
                          <span>{t.scaleLabel} {selectedCard.illustrationScale || 100}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="10"
                            max="300"
                            value={selectedCard.illustrationScale || 100}
                            onChange={(e) => handleUpdateCardField('illustrationScale', parseInt(e.target.value))}
                            className="flex-1 accent-amber-600 cursor-pointer"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateCardField('illustrationScale', 100)}
                            title={t.resetScaleTitle}
                            className="p-1 text-stone-400 dark:text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-200/50 dark:hover:bg-stone-700/50 rounded transition-colors cursor-pointer shrink-0"
                          >
                            <Icons.RotateCcw size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400">
                          <span>{t.shiftXLabel} {selectedCard.illustrationPositionX || 0}px</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            value={selectedCard.illustrationPositionX || 0}
                            onChange={(e) => handleUpdateCardField('illustrationPositionX', parseInt(e.target.value))}
                            className="flex-1 accent-amber-600 cursor-pointer"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateCardField('illustrationPositionX', 0)}
                            title={t.resetShiftXTitle}
                            className="p-1 text-stone-400 dark:text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-200/50 dark:hover:bg-stone-700/50 rounded transition-colors cursor-pointer shrink-0"
                          >
                            <Icons.RotateCcw size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400">
                          <span>{t.shiftYLabel} {selectedCard.illustrationPositionY || 0}px</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            value={selectedCard.illustrationPositionY || 0}
                            onChange={(e) => handleUpdateCardField('illustrationPositionY', parseInt(e.target.value))}
                            className="flex-1 accent-amber-600 cursor-pointer"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateCardField('illustrationPositionY', 0)}
                            title={t.resetShiftYTitle}
                            className="p-1 text-stone-400 dark:text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-200/50 dark:hover:bg-stone-700/50 rounded transition-colors cursor-pointer shrink-0"
                          >
                            <Icons.RotateCcw size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400">
                          <span>{t.rotationLabel} {selectedCard.illustrationRotation || 0}°</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="-180"
                            max="180"
                            value={selectedCard.illustrationRotation || 0}
                            onChange={(e) => handleUpdateCardField('illustrationRotation', parseInt(e.target.value))}
                            className="flex-1 accent-amber-600 cursor-pointer"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateCardField('illustrationRotation', 0)}
                            title={t.resetRotationTitle}
                            className="p-1 text-stone-400 dark:text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-200/50 dark:hover:bg-stone-700/50 rounded transition-colors cursor-pointer shrink-0"
                          >
                            <Icons.RotateCcw size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Illustration Library */}
                  <div className="flex flex-col gap-2.5 border-t border-stone-100 dark:border-stone-800 pt-3">
                    {/* Action buttons above illustration library */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => bgImageInputRef.current?.click()}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-950 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 rounded font-bold text-xs transition-colors shadow-sm cursor-pointer"
                      >
                        <Icons.Upload size={13} />
                        <span>{t.uploadBgBtn}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateCardField('artUrl', '')}
                        disabled={!selectedCard.artUrl}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2 border rounded font-bold text-xs transition-colors shadow-sm ${
                          selectedCard.artUrl
                            ? 'bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/50 cursor-pointer'
                            : 'bg-stone-50 dark:bg-stone-800 text-stone-400 dark:text-stone-600 border-stone-200 dark:border-stone-700 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <Icons.Trash2 size={13} />
                        <span>{t.resetBgBtn}</span>
                      </button>
                    </div>

                    {/* Recommendation hint text */}
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-normal bg-stone-50 dark:bg-stone-800/60 p-2 rounded border border-stone-200/50 dark:border-stone-700/60">
                      {t.artRecommendationHint}
                    </p>

                    <div className="flex items-center justify-between border-t border-stone-100 dark:border-stone-800 pt-2.5 mt-1">
                      <span className="text-xs font-bold text-stone-600 dark:text-stone-300">{t.chooseFromLibraryLabel}</span>
                      <span className="text-[10px] text-stone-400 dark:text-stone-500 font-medium">({illustrationLibrary.length})</span>
                    </div>

                    {illustrationLibrary.length > 0 ? (
                      <div className="max-h-[160px] overflow-y-auto pr-1 w-full bg-stone-50/50 dark:bg-stone-800/40 p-2 border border-stone-200 dark:border-stone-700 rounded-lg">
                        <div className="grid grid-cols-4 gap-2 w-full">
                          {illustrationLibrary.map((url, index) => {
                            const isSelected = selectedCard.artUrl === url;
                            return (
                              <div
                                key={index}
                                className={`relative w-full aspect-square rounded-md overflow-hidden cursor-pointer group min-h-0 min-w-0 ${
                                  isSelected ? 'ring-2 ring-amber-500 border-transparent shadow' : 'border border-stone-200 dark:border-stone-700 hover:border-amber-400'
                                }`}
                                onClick={() => {
                                  if (isSelected) {
                                    handleUpdateCardField('artUrl', '');
                                  } else {
                                    handleUpdateCardField('artUrl', url);
                                  }
                                }}
                              >
                                <img src={url} className="absolute inset-0 w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                {/* Selection overlay indicator */}
                                {isSelected && (
                                  <div className="absolute inset-0 bg-amber-500/10 flex items-center justify-center">
                                    <div className="bg-amber-500 text-stone-950 rounded-full p-0.5 shadow">
                                      <Icons.Check size={10} strokeWidth={3} />
                                    </div>
                                  </div>
                                )}

                                {/* Delete button from library (on hover) */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    requestConfirmation('delete_image', () => {
                                      removeFromLibrary(url);
                                      if (isSelected) {
                                        handleUpdateCardField('artUrl', '');
                                      }
                                    });
                                  }}
                                  className="absolute top-1 right-1 w-4 h-4 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shadow-sm z-20 cursor-pointer"
                                  title={t.deleteFromLibraryTitle}
                                >
                                  <Icons.X size={10} strokeWidth={2.5} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="border border-dashed border-stone-200 dark:border-stone-700 rounded-lg p-4 text-center bg-stone-50/50 dark:bg-stone-800/40">
                        <Icons.Image size={20} className="mx-auto text-stone-400 dark:text-stone-500 mb-1" />
                        <span className="text-[10px] text-stone-500 dark:text-stone-400 block leading-tight">{t.libraryEmptyText}</span>
                        <span className="text-[9px] text-stone-400 dark:text-stone-500 block mt-0.5">{t.libraryEmptySubtext}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Enabled Checkbox */}
                  <div className="flex items-center gap-2.5 p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-sm">
                    <input
                      type="checkbox"
                      id="cardBackEnabled"
                      checked={cardBackEnabled}
                      onChange={(e) => saveCardBackEnabled(e.target.checked)}
                      className="w-4 h-4 text-amber-600 border-stone-300 dark:border-stone-600 rounded focus:ring-amber-500 accent-amber-600 cursor-pointer"
                    />
                    <label htmlFor="cardBackEnabled" className="text-xs font-bold text-stone-800 dark:text-stone-100 cursor-pointer select-none">
                      {t.enableCardBackCheckbox}
                    </label>
                  </div>

                  {/* Sub-tabs "Общая" and "Индивидуальная" */}
                  <div className="flex bg-stone-100 dark:bg-stone-800 p-0.5 rounded-lg border border-stone-200 dark:border-stone-700 shrink-0">
                    <button
                      onClick={() => setShirtSubTab('general')}
                      className={`flex-1 py-1.5 px-2 rounded-md font-serif font-bold text-[10px] uppercase tracking-wider transition-all text-center cursor-pointer ${
                        shirtSubTab === 'general'
                          ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-sm font-black'
                          : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                      }`}
                    >
                      {t.subTabGeneral}
                    </button>
                    <button
                      onClick={() => setShirtSubTab('individual')}
                      className={`flex-1 py-1.5 px-2 rounded-md font-serif font-bold text-[10px] uppercase tracking-wider transition-all text-center cursor-pointer ${
                        shirtSubTab === 'individual'
                          ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-sm font-black'
                          : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                      }`}
                    >
                      {t.subTabIndividual}
                    </button>
                  </div>

                  {/* Wrapper that gets disabled/faded if not enabled */}
                  <div className={`flex flex-col gap-4 transition-opacity duration-300 ${!cardBackEnabled ? 'opacity-40 pointer-events-none select-none' : ''}`}>
                    {shirtSubTab === 'general' ? (
                      <>
                        {/* Art Link Input */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-stone-600 dark:text-stone-300">{t.shirtUrlLabel}</label>
                          <div className="flex gap-2 w-full">
                            <input
                              type="text"
                              value={cardBackUrl}
                              onChange={(e) => saveCardBackUrl(e.target.value)}
                              disabled={!cardBackEnabled}
                              placeholder={t.artUrlPlaceholder}
                              className="flex-grow px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-stone-500 focus:bg-white dark:focus:bg-stone-750 text-stone-800 dark:text-stone-100 min-w-0"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const url = cardBackUrl.trim();
                                if (url) {
                                  addToLibrary(url);
                                }
                              }}
                              disabled={!cardBackEnabled || !cardBackUrl.trim()}
                              className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-100 dark:disabled:bg-stone-800 disabled:text-stone-400 dark:disabled:text-stone-600 disabled:border-stone-200 dark:disabled:border-stone-700 text-stone-950 font-bold text-xs rounded transition-all shadow-sm shrink-0 flex items-center gap-1 cursor-pointer border border-amber-700 disabled:cursor-not-allowed"
                              title={t.addToLibraryBtn}
                            >
                              <Icons.Plus size={13} />
                              <span>{t.addToLibraryBtn}</span>
                            </button>
                          </div>
                        </div>

                        {/* Sliders for scale and offset */}
                        {cardBackUrl && (
                          <div className="flex flex-col gap-3 bg-stone-50 dark:bg-stone-800/70 p-3 rounded-lg border border-stone-200 dark:border-stone-700 shadow-inner">
                            <span className="text-[11px] font-bold text-stone-700 dark:text-stone-200 uppercase tracking-wider flex items-center gap-1">
                              <Icons.Settings size={12} className="text-amber-600 dark:text-amber-400" />
                              <span>{t.shirtPositionSettings}</span>
                            </span>
                            
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400 font-medium">
                                <span>{t.scaleLabel}</span>
                                <span className="font-bold text-stone-700 dark:text-stone-200">{cardBackScale}%</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="10"
                                  max="300"
                                  value={cardBackScale}
                                  disabled={!cardBackEnabled}
                                  onChange={(e) => saveCardBackScale(parseInt(e.target.value))}
                                  className="flex-1 accent-amber-600 cursor-pointer"
                                />
                                <button
                                  type="button"
                                  disabled={!cardBackEnabled}
                                  onClick={() => saveCardBackScale(100)}
                                  title={t.resetScaleTitle}
                                  className="p-1 text-stone-400 dark:text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-200/50 dark:hover:bg-stone-700/50 rounded transition-colors cursor-pointer shrink-0 disabled:opacity-50 disabled:hover:text-stone-400 disabled:hover:bg-transparent"
                                >
                                  <Icons.RotateCcw size={14} />
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400 font-medium">
                                <span>{t.shirtShiftXLabel}</span>
                                <span className="font-bold text-stone-700 dark:text-stone-200">{cardBackPositionX}px</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="-100"
                                  max="100"
                                  value={cardBackPositionX}
                                  disabled={!cardBackEnabled}
                                  onChange={(e) => saveCardBackPositionX(parseInt(e.target.value))}
                                  className="flex-1 accent-amber-600 cursor-pointer"
                                />
                                <button
                                  type="button"
                                  disabled={!cardBackEnabled}
                                  onClick={() => saveCardBackPositionX(0)}
                                  title={t.resetShiftXTitle}
                                  className="p-1 text-stone-400 dark:text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-200/50 dark:hover:bg-stone-700/50 rounded transition-colors cursor-pointer shrink-0 disabled:opacity-50 disabled:hover:text-stone-400 disabled:hover:bg-transparent"
                                >
                                  <Icons.RotateCcw size={14} />
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400 font-medium">
                                <span>{t.shirtShiftYLabel}</span>
                                <span className="font-bold text-stone-700 dark:text-stone-200">{cardBackPositionY}px</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="-100"
                                  max="100"
                                  value={cardBackPositionY}
                                  disabled={!cardBackEnabled}
                                  onChange={(e) => saveCardBackPositionY(parseInt(e.target.value))}
                                  className="flex-1 accent-amber-600 cursor-pointer"
                                />
                                <button
                                  type="button"
                                  disabled={!cardBackEnabled}
                                  onClick={() => saveCardBackPositionY(0)}
                                  title={t.resetShiftYTitle}
                                  className="p-1 text-stone-400 dark:text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-200/50 dark:hover:bg-stone-700/50 rounded transition-colors cursor-pointer shrink-0 disabled:opacity-50 disabled:hover:text-stone-400 disabled:hover:bg-transparent"
                                >
                                  <Icons.RotateCcw size={14} />
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400 font-medium">
                                <span>{t.shirtRotationLabel}</span>
                                <span className="font-bold text-stone-700 dark:text-stone-200">{cardBackRotation}°</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="-180"
                                  max="180"
                                  value={cardBackRotation}
                                  disabled={!cardBackEnabled}
                                  onChange={(e) => saveCardBackRotation(parseInt(e.target.value))}
                                  className="flex-1 accent-amber-600 cursor-pointer"
                                />
                                <button
                                  type="button"
                                  disabled={!cardBackEnabled}
                                  onClick={() => saveCardBackRotation(0)}
                                  title={t.resetRotationTitle}
                                  className="p-1 text-stone-400 dark:text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-200/50 dark:hover:bg-stone-700/50 rounded transition-colors cursor-pointer shrink-0 disabled:opacity-50 disabled:hover:text-stone-400 disabled:hover:bg-transparent"
                                >
                                  <Icons.RotateCcw size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Illustration Library */}
                        <div className="flex flex-col gap-2.5 border-t border-stone-100 dark:border-stone-800 pt-3">
                          {/* Action buttons above library */}
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              disabled={!cardBackEnabled}
                              onClick={() => bgImageInputRef.current?.click()}
                              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-950 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 rounded font-bold text-xs transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Icons.Upload size={13} />
                              <span>{t.uploadBgBtn}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => saveCardBackUrl('')}
                              disabled={!cardBackEnabled || !cardBackUrl}
                              className={`flex items-center justify-center gap-1.5 px-3 py-2 border rounded font-bold text-xs transition-colors shadow-sm ${
                                cardBackEnabled && cardBackUrl
                                  ? 'bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/50 cursor-pointer'
                                  : 'bg-stone-50 dark:bg-stone-800 text-stone-400 dark:text-stone-600 border-stone-200 dark:border-stone-700 cursor-not-allowed opacity-50'
                              }`}
                            >
                              <Icons.Trash2 size={13} />
                              <span>{t.resetShirtBtn}</span>
                            </button>
                          </div>

                          {/* Download Default Card Back (SVG) Button */}
                          <button
                            type="button"
                            onClick={handleDownloadDefaultCardBackSvg}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-100 dark:bg-stone-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-stone-700 dark:text-stone-200 hover:text-amber-800 dark:hover:text-amber-300 border border-stone-300 dark:border-stone-700 hover:border-amber-400 dark:hover:border-amber-700/60 rounded font-bold text-xs transition-all shadow-sm cursor-pointer"
                            title={t.downloadStandardShirtSvgTooltip}
                          >
                            <Icons.Download size={13} />
                            <span>{t.downloadStandardShirtSvgBtn}</span>
                          </button>

                          {/* Recommendation hint text */}
                          <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-normal bg-stone-50 dark:bg-stone-800/60 p-2 rounded border border-stone-200/50 dark:border-stone-700/60">
                            {t.shirtRecommendationHint}
                          </p>

                          <div className="flex items-center justify-between border-t border-stone-100 dark:border-stone-800 pt-2.5 mt-1">
                            <span className="text-xs font-bold text-stone-600 dark:text-stone-300">{t.chooseShirtFromLibraryLabel}</span>
                            <span className="text-[10px] text-stone-400 dark:text-stone-500 font-medium">({illustrationLibrary.length})</span>
                          </div>

                          {illustrationLibrary.length > 0 ? (
                            <div className="max-h-[160px] overflow-y-auto pr-1 w-full bg-stone-50/50 dark:bg-stone-800/40 p-2 border border-stone-200 dark:border-stone-700 rounded-lg">
                              <div className="grid grid-cols-4 gap-2 w-full">
                                {illustrationLibrary.map((url, index) => {
                                  const isSelected = cardBackUrl === url;
                                  return (
                                    <div
                                      key={index}
                                      className={`relative w-full aspect-square rounded-md overflow-hidden cursor-pointer group min-h-0 min-w-0 ${
                                        isSelected ? 'ring-2 ring-amber-500 border-transparent shadow' : 'border border-stone-200 dark:border-stone-700 hover:border-amber-400'
                                      }`}
                                      onClick={() => {
                                        if (!cardBackEnabled) return;
                                        if (isSelected) {
                                          saveCardBackUrl('');
                                        } else {
                                          saveCardBackUrl(url);
                                        }
                                      }}
                                    >
                                      <img src={url} className="absolute inset-0 w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                      
                                      {/* Selection overlay indicator */}
                                      {isSelected && (
                                        <div className="absolute inset-0 bg-amber-500/10 flex items-center justify-center">
                                          <div className="bg-amber-500 text-stone-950 rounded-full p-0.5 shadow">
                                            <Icons.Check size={10} strokeWidth={3} />
                                          </div>
                                        </div>
                                      )}

                                      {/* Delete button from library (on hover) */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          requestConfirmation('delete_image', () => {
                                            removeFromLibrary(url);
                                            if (isSelected) {
                                              saveCardBackUrl('');
                                            }
                                          });
                                        }}
                                        className="absolute top-1 right-1 w-4 h-4 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shadow-sm z-20 cursor-pointer"
                                        title={t.deleteFromLibraryTitle}
                                      >
                                        <Icons.X size={10} strokeWidth={2.5} />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="border border-dashed border-stone-200 dark:border-stone-700 rounded-lg p-4 text-center bg-stone-50/50 dark:bg-stone-800/40">
                              <Icons.Image size={20} className="mx-auto text-stone-400 dark:text-stone-500 mb-1" />
                              <span className="text-[10px] text-stone-500 dark:text-stone-400 block leading-tight">{t.libraryEmptyText}</span>
                              <span className="text-[9px] text-stone-400 dark:text-stone-500 block mt-0.5">{t.libraryEmptySubtext}</span>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Individual cardback controls */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-stone-600 dark:text-stone-300">{t.individualShirtModeLabel}</label>
                          <select
                            value={selectedCard.shirtMode || 'none'}
                            onChange={(e) => handleUpdateCardField('shirtMode', e.target.value)}
                            className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-stone-500 focus:bg-white dark:focus:bg-stone-750 text-stone-800 dark:text-stone-100 font-bold"
                          >
                            <option value="none" className="dark:bg-stone-900 dark:text-stone-100">{t.shirtModeDeckDefault}</option>
                            <option value="image" className="dark:bg-stone-900 dark:text-stone-100">{t.shirtModeCustomImage}</option>
                            <option value="continuation" className="dark:bg-stone-900 dark:text-stone-100">{t.shirtModeContinuation}</option>
                          </select>
                        </div>

                        {selectedCard.shirtMode === 'none' || !selectedCard.shirtMode ? (
                          <div className="bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 p-3 rounded-lg text-xs text-stone-600 dark:text-stone-300 flex flex-col gap-1.5">
                            <span className="font-bold text-stone-700 dark:text-stone-200 flex items-center gap-1">
                              <Icons.Info size={14} className="text-amber-600 dark:text-amber-400" />
                              <span>{t.globalShirtInfoTitle}</span>
                            </span>
                            <p className="leading-relaxed">
                              {t.globalShirtInfoDesc}
                            </p>
                          </div>
                        ) : selectedCard.shirtMode === 'continuation' ? (
                          <div className="bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 p-3 rounded-lg text-xs text-stone-600 dark:text-stone-300 flex flex-col gap-1.5">
                            <span className="font-bold text-stone-700 dark:text-stone-200 flex items-center gap-1">
                              <Icons.BookOpen size={14} className="text-amber-600 dark:text-amber-400" />
                              <span>{t.continuationModeTitle}</span>
                            </span>
                            <p className="leading-relaxed">
                              {t.continuationModeDesc}
                            </p>
                            {selectedCard.enableTextOverflow === false && (
                              <p className="text-red-600 dark:text-red-400 font-semibold mt-1">
                                {t.continuationWarning}
                              </p>
                            )}
                          </div>
                        ) : (
                          <>
                            {/* Individual image mode */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-bold text-stone-600 dark:text-stone-300">{t.individualShirtUrlLabel}</label>
                              <div className="flex gap-2 w-full">
                                <input
                                  type="text"
                                  value={selectedCard.shirtUrl || ''}
                                  onChange={(e) => handleUpdateCardField('shirtUrl', e.target.value)}
                                  placeholder={t.artUrlPlaceholder}
                                  className="flex-grow px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-stone-500 focus:bg-white dark:focus:bg-stone-750 text-stone-800 dark:text-stone-100 min-w-0"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const url = (selectedCard.shirtUrl || '').trim();
                                    if (url) {
                                      addToLibrary(url);
                                    }
                                  }}
                                  disabled={!(selectedCard.shirtUrl || '').trim()}
                                  className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-100 dark:disabled:bg-stone-800 disabled:text-stone-400 dark:disabled:text-stone-600 disabled:border-stone-200 dark:disabled:border-stone-700 text-stone-950 font-bold text-xs rounded transition-all shadow-sm shrink-0 flex items-center gap-1 cursor-pointer border border-amber-700 disabled:cursor-not-allowed"
                                  title={t.addToLibraryBtn}
                                >
                                  <Icons.Plus size={13} />
                                  <span>{t.addToLibraryBtn}</span>
                                </button>
                              </div>
                            </div>

                            {/* Position Controls for Individual image */}
                            {(selectedCard.shirtUrl || '').trim() && (
                              <div className="flex flex-col gap-3 bg-stone-50 dark:bg-stone-800/70 p-3 rounded-lg border border-stone-200 dark:border-stone-700 shadow-inner">
                                <span className="text-[11px] font-bold text-stone-700 dark:text-stone-200 uppercase tracking-wider flex items-center gap-1">
                                  <Icons.Settings size={12} className="text-amber-600 dark:text-amber-400" />
                                  <span>{t.individualShirtPosition}</span>
                                </span>
                                
                                <div className="flex flex-col gap-1">
                                  <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400 font-medium">
                                    <span>{t.scaleLabel}</span>
                                    <span className="font-bold text-stone-700 dark:text-stone-200">{selectedCard.shirtScale !== undefined ? selectedCard.shirtScale : 100}%</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="range"
                                      min="10"
                                      max="300"
                                      value={selectedCard.shirtScale !== undefined ? selectedCard.shirtScale : 100}
                                      onChange={(e) => handleUpdateCardField('shirtScale', parseInt(e.target.value))}
                                      className="flex-1 accent-amber-600 cursor-pointer"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateCardField('shirtScale', 100)}
                                      title={t.resetScaleTitle}
                                      className="p-1 text-stone-400 dark:text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-200/50 dark:hover:bg-stone-700/50 rounded transition-colors cursor-pointer shrink-0"
                                    >
                                      <Icons.RotateCcw size={14} />
                                    </button>
                                  </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                  <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400 font-medium">
                                    <span>{t.shirtShiftXLabel}</span>
                                    <span className="font-bold text-stone-700 dark:text-stone-200">{selectedCard.shirtPositionX !== undefined ? selectedCard.shirtPositionX : 0}px</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="range"
                                      min="-100"
                                      max="100"
                                      value={selectedCard.shirtPositionX !== undefined ? selectedCard.shirtPositionX : 0}
                                      onChange={(e) => handleUpdateCardField('shirtPositionX', parseInt(e.target.value))}
                                      className="flex-1 accent-amber-600 cursor-pointer"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateCardField('shirtPositionX', 0)}
                                      title={t.resetShiftXTitle}
                                      className="p-1 text-stone-400 dark:text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-200/50 dark:hover:bg-stone-700/50 rounded transition-colors cursor-pointer shrink-0"
                                    >
                                      <Icons.RotateCcw size={14} />
                                    </button>
                                  </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                  <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400 font-medium">
                                    <span>{t.shirtShiftYLabel}</span>
                                    <span className="font-bold text-stone-700 dark:text-stone-200">{selectedCard.shirtPositionY !== undefined ? selectedCard.shirtPositionY : 0}px</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="range"
                                      min="-100"
                                      max="100"
                                      value={selectedCard.shirtPositionY !== undefined ? selectedCard.shirtPositionY : 0}
                                      onChange={(e) => handleUpdateCardField('shirtPositionY', parseInt(e.target.value))}
                                      className="flex-1 accent-amber-600 cursor-pointer"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateCardField('shirtPositionY', 0)}
                                      title={t.resetShiftYTitle}
                                      className="p-1 text-stone-400 dark:text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-200/50 dark:hover:bg-stone-700/50 rounded transition-colors cursor-pointer shrink-0"
                                    >
                                      <Icons.RotateCcw size={14} />
                                    </button>
                                  </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                  <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400 font-medium">
                                    <span>{t.shirtRotationLabel}</span>
                                    <span className="font-bold text-stone-700 dark:text-stone-200">{selectedCard.shirtRotation !== undefined ? selectedCard.shirtRotation : 0}°</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="range"
                                      min="-180"
                                      max="180"
                                      value={selectedCard.shirtRotation !== undefined ? selectedCard.shirtRotation : 0}
                                      onChange={(e) => handleUpdateCardField('shirtRotation', parseInt(e.target.value))}
                                      className="flex-1 accent-amber-600 cursor-pointer"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateCardField('shirtRotation', 0)}
                                      title={t.resetRotationTitle}
                                      className="p-1 text-stone-400 dark:text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-200/50 dark:hover:bg-stone-700/50 rounded transition-colors cursor-pointer shrink-0"
                                    >
                                      <Icons.RotateCcw size={14} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Action Buttons for Individual Image */}
                            <div className="flex flex-col gap-2.5 border-t border-stone-100 dark:border-stone-800 pt-3">
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => bgImageInputRef.current?.click()}
                                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-950 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 rounded font-bold text-xs transition-colors shadow-sm cursor-pointer"
                                >
                                  <Icons.Upload size={13} />
                                  <span>{t.uploadBgBtn}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCardField('shirtUrl', '')}
                                  disabled={!selectedCard.shirtUrl}
                                  className={`flex items-center justify-center gap-1.5 px-3 py-2 border rounded font-bold text-xs transition-colors shadow-sm ${
                                    selectedCard.shirtUrl
                                      ? 'bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/50 cursor-pointer'
                                      : 'bg-stone-50 dark:bg-stone-800 text-stone-400 dark:text-stone-600 border-stone-200 dark:border-stone-700 cursor-not-allowed opacity-50'
                                  }`}
                                >
                                  <Icons.Trash2 size={13} />
                                  <span>{t.resetBgBtn}</span>
                                </button>
                              </div>

                              <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-normal bg-stone-50 dark:bg-stone-800/60 p-2 rounded border border-stone-200/50 dark:border-stone-700/60">
                                {t.individualShirtRecHint}
                              </p>

                              <div className="flex items-center justify-between border-t border-stone-100 dark:border-stone-800 pt-2.5 mt-1">
                                <span className="text-xs font-bold text-stone-600 dark:text-stone-300">{t.chooseIndividualShirtFromLibrary}</span>
                                <span className="text-[10px] text-stone-400 dark:text-stone-500 font-medium">({illustrationLibrary.length})</span>
                              </div>

                              {illustrationLibrary.length > 0 ? (
                                <div className="max-h-[160px] overflow-y-auto pr-1 w-full bg-stone-50/50 dark:bg-stone-800/40 p-2 border border-stone-200 dark:border-stone-700 rounded-lg">
                                  <div className="grid grid-cols-4 gap-2 w-full">
                                    {illustrationLibrary.map((url, index) => {
                                      const isSelected = selectedCard.shirtUrl === url;
                                      return (
                                        <div
                                          key={index}
                                          className={`relative w-full aspect-square rounded-md overflow-hidden cursor-pointer group min-h-0 min-w-0 ${
                                            isSelected ? 'ring-2 ring-amber-500 border-transparent shadow' : 'border border-stone-200 dark:border-stone-700 hover:border-amber-400'
                                          }`}
                                          onClick={() => {
                                            if (isSelected) {
                                              handleUpdateCardField('shirtUrl', '');
                                            } else {
                                              handleUpdateCardField('shirtUrl', url);
                                            }
                                          }}
                                        >
                                          <img src={url} className="absolute inset-0 w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                                          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                          
                                          {/* Selection overlay indicator */}
                                          {isSelected && (
                                            <div className="absolute inset-0 bg-amber-500/10 flex items-center justify-center">
                                              <div className="bg-amber-500 text-stone-950 rounded-full p-0.5 shadow">
                                                <Icons.Check size={10} strokeWidth={3} />
                                              </div>
                                            </div>
                                          )}

                                          {/* Delete button from library (on hover) */}
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              requestConfirmation('delete_image', () => {
                                                removeFromLibrary(url);
                                                if (isSelected) {
                                                  handleUpdateCardField('shirtUrl', '');
                                                }
                                              });
                                            }}
                                            className="absolute top-1 right-1 w-4 h-4 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shadow-sm z-20 cursor-pointer"
                                            title={t.deleteFromLibraryTitle}
                                          >
                                            <Icons.X size={10} strokeWidth={2.5} />
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <div className="border border-dashed border-stone-200 dark:border-stone-700 rounded-lg p-4 text-center bg-stone-50/50 dark:bg-stone-800/40">
                                  <Icons.Image size={20} className="mx-auto text-stone-400 dark:text-stone-500 mb-1" />
                                  <span className="text-[10px] text-stone-500 dark:text-stone-400 block leading-tight">{t.libraryEmptyText}</span>
                                  <span className="text-[9px] text-stone-400 dark:text-stone-500 block mt-0.5">{t.libraryEmptySubtext}</span>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {sidebarIconPicker && (
            <InlineIconPickerMenu
              onSelectIcon={(iconName) => {
                sidebarIconPicker.onInsert(iconName);
              }}
              onClose={() => setSidebarIconPicker(null)}
              triggerEl={sidebarIconPicker.triggerEl}
              userCustomIcons={userCustomIcons}
              t={t}
            />
          )}
        </section>
      </main>
      )}



      {/* Print View container: purely rendered when printing */}
      <div className="hidden print:block">
        {(() => {
          const frontPages = cards.filter(card => !card.hideFromPrint).flatMap(card => {
            const pages = getCardPages(card, rarities);
            const colors = getCardColors(card);
            const rarityStyle = getRarityStyles(card.rarity);
            
            const isContinuation = cardBackEnabled && card.shirtMode === 'continuation' && card.enableTextOverflow !== false;
            
            return pages
              .map((pageContent, pageIdx) => ({
                card,
                pageContent,
                pageIdx,
                totalPages: pages.length,
                colors,
                rarityStyle
              }))
              .filter((_, pageIdx) => {
                if (isContinuation) {
                  return pageIdx % 2 === 0;
                }
                return true;
              });
          });

          const printChunks = groupCardsIntoPrintPages(frontPages);

          const renderSinglePrintCardFront = (item: any) => {
            const { card, pageContent, pageIdx, totalPages, colors, rarityStyle } = item;
            const cardW = card.width && card.width > 0 ? card.width : 63;
            const cardH = card.height && card.height > 0 ? card.height : 88;
            return (
              <div
                key={`${card.id}-print-page-${pageIdx}`}
                className={`bg-white border-2 flex flex-col overflow-hidden relative card-print-wrapper ${rarityStyle.border}`}
                style={{ 
                  width: `${cardW}mm`,
                  height: `${cardH}mm`,
                  boxSizing: 'border-box',
                  borderColor: rarityStyle.customBorderColor || undefined,
                  boxShadow: rarityStyle.customGlowStyle || undefined,
                  borderRadius: card.borderRadius !== undefined ? `${card.borderRadius}px` : '3px',
                }}
              >
                {/* Header */}
                {(!card.hideTitle || card.showIcon !== false) && (
                  <div
                    className="px-2 py-1 flex items-center justify-between gap-1 border-b border-stone-950 shrink-0 text-white min-h-[32px] h-auto"
                    style={{ backgroundColor: colors.primary, color: card.customTitleColor || '#ffffff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                  >
                    {!card.hideTitle && (
                      <h4 
                        className={`font-serif font-black tracking-tight leading-tight grow break-words whitespace-pre-wrap ${
                          card.autoScaleTitle !== false
                            ? `${getTitleFontSize(card.title || 'БЕЗ НАЗВАНИЯ', card.showIcon !== false)}`
                            : 'text-sm'
                        } ${rarityStyle.headingGlow}`} 
                        style={{ 
                          textShadow: '1px 1px 0px rgba(0,0,0,0.8)', 
                          color: card.customTitleColor || '#ffffff',
                          ...rarityStyle.customHeadingGlowStyle
                        }}
                      >
                        {card.title || 'БЕЗ НАЗВАНИЯ'}
                        {totalPages > 1 && <span className="text-[10px] opacity-75 font-mono ml-1">({pageIdx + 1}/{totalPages})</span>}
                      </h4>
                    )}
                    {card.hideTitle && <div className="grow min-w-0" />}
                    {card.showIcon !== false && (
                      <div className="w-5 h-5 rounded bg-black/25 flex items-center justify-center shrink-0 border border-white/20">
                        <CardIcon name={colors.icon} size={11} style={{ color: card.customTitleColor || '#ffffff' }} />
                      </div>
                    )}
                  </div>
                )}

                {/* Subtitle */}
                {(!card.hideSubtitle || (card.rarity && card.rarity !== 'none')) && (
                  <div
                    className="px-2 py-1 font-serif font-bold tracking-wide uppercase border-b border-stone-950 shrink-0 flex justify-between items-center gap-1.5 min-w-0 h-auto min-h-[22px]"
                    style={{ backgroundColor: colors.secondary, color: card.customSubtitleColor || 'rgba(255, 255, 255, 0.95)', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                  >
                    <span className={`${getSubtitleFontSize(!card.hideSubtitle ? card.subtitle : '')} break-words whitespace-pre-wrap leading-tight grow min-w-0`}>
                      {!card.hideSubtitle ? card.subtitle : ''}
                    </span>
                    {card.rarity && card.rarity !== 'none' && (() => {
                      const badgeStyle = getRarityBadgeStyle(card);
                      return (
                        <span 
                          className={`text-[8px] px-1 py-0.5 rounded tracking-normal shrink-0 font-bold ${
                            badgeStyle.isSubtitleStyle 
                              ? '' 
                              : 'border border-black/10 shadow-sm'
                          }`} 
                          style={{ 
                            backgroundColor: badgeStyle.bg, 
                            color: badgeStyle.text,
                            WebkitPrintColorAdjust: 'exact',
                            printColorAdjust: 'exact'
                          }}
                        >
                          {getRarityLabel(card.rarity)}
                        </span>
                      );
                    })()}
                  </div>
                )}

                {/* Optional Art: ONLY on page 0 */}
                {card.artUrl && pageIdx === 0 && !card.artAsDescriptionBg && !card.artAsStatsBg && (
                  <div className={`w-full bg-stone-900 relative overflow-hidden shrink-0 ${card.fullIllustration ? 'flex-1' : 'border-b border-stone-950'}`}
                       style={card.fullIllustration ? undefined : { height: `${getIllustrationHeight(card)}px` }}>
                    <img
                      src={card.artUrl}
                      alt={card.title}
                      className="absolute max-w-none max-h-none"
                      style={{
                        left: '50%',
                        top: '50%',
                        width: 'auto',
                        height: 'auto',
                        minWidth: '100%',
                        minHeight: '100%',
                        transform: `translate(-50%, -50%) translate(${(card.illustrationPositionX || 0)}px, ${(card.illustrationPositionY || 0)}px) scale(${(card.illustrationScale || 100) / 100}) rotate(${(card.illustrationRotation || 0)}deg)`,
                        transformOrigin: 'center center',
                      }}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                    />
                  </div>
                )}

                {/* Stats and Description Area with optional Art Backgrounds */}
                {(() => {
                  const artBg = getCardArtBgState(card);
                  const showStats = Boolean(card.stats && card.stats.length > 0 && shouldRenderCardStats(card, pageIdx, rarities));
                  const showDesc = Boolean(!card.fullIllustration || pageIdx > 0);

                  if (!showStats && !showDesc) return null;

                  const isFullIll = Boolean(card.fullIllustration && pageIdx === 0);

                  return (
                    <div className={`${isFullIll ? 'shrink-0' : 'flex-1'} flex flex-col min-h-0 relative overflow-hidden`}>
                      {/* Continuous Background Art across BOTH blocks if both checkboxes are enabled */}
                      {artBg.isBoth && renderCardArtBackground(
                        card,
                        card.descriptionArtOpacity ?? 100,
                        card.descriptionArtBrightness ?? 100
                      )}

                      {/* Stats table */}
                      {showStats && (
                        <div
                          className="grid grid-cols-2 border-b border-stone-950 shrink-0 divide-x divide-stone-200 relative z-1 overflow-hidden" 
                          style={{
                            backgroundColor: (artBg.isBoth || artBg.isStatsOnly)
                              ? 'transparent'
                              : (card.customStatsBgColor || '#f5f5f4'),
                            WebkitPrintColorAdjust: 'exact',
                            printColorAdjust: 'exact'
                          }}
                        >
                          {/* Individual background if only stats is checked */}
                          {artBg.isStatsOnly && renderCardArtBackground(
                            card,
                            card.statsArtOpacity ?? 100,
                            card.statsArtBrightness ?? 75
                          )}

                          {/* Darkening overlay when both are checked ("просто на блоке характеристик будет чуть темнее") */}
                          {artBg.isBoth && (
                            <div
                              className="absolute inset-0 pointer-events-none z-0"
                              style={{
                                backgroundColor: `rgba(0, 0, 0, ${Math.max(0.15, Math.min(0.75, 1 - (card.statsArtBrightness ?? 75) / 125))})`,
                                opacity: (card.statsArtOpacity ?? 100) / 100,
                                backdropFilter: `brightness(${(card.statsArtBrightness ?? 75) / 100})`,
                                WebkitPrintColorAdjust: 'exact',
                                printColorAdjust: 'exact',
                              }}
                            />
                          )}

                          {card.stats.map(stat => (
                            <div key={stat.id} className="flex flex-col justify-center px-1.5 py-0.5 leading-none min-w-0 relative z-1">
                              <span
                                className="text-[7px] uppercase font-bold tracking-wider leading-none px-0.5 h-[12px] break-words whitespace-normal inline-flex items-center"
                                style={{
                                  color: card.customStatsTextColor || (artBg.isBoth || artBg.isStatsOnly ? '#f5f5f4' : '#78716c'),
                                  textShadow: (artBg.isBoth || artBg.isStatsOnly) ? '0 1px 2px rgba(0,0,0,0.8)' : undefined,
                                  opacity: card.customStatsTextColor ? 0.8 : 1
                                }}
                                dangerouslySetInnerHTML={{ __html: formatInlineText(stat.label) }}
                              />
                              <span
                                className={`font-mono font-bold tracking-tight leading-none px-0.5 h-[15px] break-words whitespace-normal inline-flex items-center ${getStatValueFontSize(stat.value || '—')}`}
                                style={{
                                  color: card.customStatsTextColor || (artBg.isBoth || artBg.isStatsOnly ? '#ffffff' : '#1c1917'),
                                  textShadow: (artBg.isBoth || artBg.isStatsOnly) ? '0 1px 2px rgba(0,0,0,0.8)' : undefined
                                }}
                                dangerouslySetInnerHTML={{ __html: formatInlineText(stat.value) }}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Description */}
                      {showDesc && (
                        <div
                          className="flex-1 p-2.5 overflow-hidden flex flex-col justify-between relative z-1" 
                          style={{
                            backgroundColor: (artBg.isBoth || artBg.isDescOnly)
                              ? 'transparent'
                              : (card.customContentBgColor || 'rgba(250, 250, 249, 0.5)'),
                            WebkitPrintColorAdjust: 'exact',
                            printColorAdjust: 'exact'
                          }}
                        >
                          {/* Individual background if only description is checked */}
                          {artBg.isDescOnly && renderCardArtBackground(
                            card,
                            card.descriptionArtOpacity ?? 100,
                            card.descriptionArtBrightness ?? 100
                          )}

                          <div
                            className={`leading-relaxed ${getContentAlignClass(card.contentAlign)} ${card.enableTextOverflow ? 'overflow-hidden' : 'overflow-y-auto'} flex-1 min-h-0 break-words font-body relative z-1 ${getContentFontSize(card.content || '')}`}
                            style={{
                              color: card.customContentColor || '#1c1917',
                              fontSize: card.fontSize !== undefined ? `${card.fontSize}px` : '9px',
                              textAlign: card.contentAlign || 'justify'
                            }}
                            dangerouslySetInnerHTML={{
                              __html: pageContent || '<i>Описание отсутствует...</i>',
                            }}
                          />
                          <div className="relative z-1">
                            {renderCardFooter(card)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          };

          const renderSinglePrintCardBack = (item: any, backGridIdx: number) => {
            const { card, pageIdx } = item;
            const cardW = card.width && card.width > 0 ? card.width : 63;
            const cardH = card.height && card.height > 0 ? card.height : 88;
            return (
              <div
                key={`${card.id}-print-back-${backGridIdx}`}
                className="bg-stone-900 border-2 flex flex-col overflow-hidden relative card-print-wrapper"
                style={{ 
                  width: `${cardW}mm`,
                  height: `${cardH}mm`,
                  boxSizing: 'border-box',
                  borderColor: '#000000',
                  borderRadius: card.borderRadius !== undefined ? `${card.borderRadius}px` : '3px',
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact'
                }}
              >
                {renderCardBackContent(card, pageIdx)}
              </div>
            );
          };

          if (!cardBackEnabled) {
            return printChunks.map((chunk, chunkIdx) => (
              <div
                key={`print-group-${chunkIdx}-fronts`}
                className="print-container w-full"
                style={{ breakAfter: 'page', pageBreakAfter: 'always', marginBottom: '20px' }}
              >
                {chunk.rows.map((row, rowIdx) => (
                  <div key={`row-${rowIdx}`} className="print-row print-row-front">
                    {row.items.map((item, colIdx) => {
                      if (!item) return null;
                      return renderSinglePrintCardFront(item);
                    })}
                  </div>
                ))}
              </div>
            ));
          }

          return printChunks.flatMap((chunk, chunkIdx) => {
            const frontPageNode = (
              <div
                key={`print-group-${chunkIdx}-fronts`}
                className="print-container w-full"
                style={{ breakAfter: 'page', pageBreakAfter: 'always', marginBottom: '20px' }}
              >
                {chunk.rows.map((row, rowIdx) => (
                  <div key={`row-${rowIdx}`} className="print-row print-row-front">
                    {row.items.map((item, colIdx) => {
                      if (!item) return null;
                      return renderSinglePrintCardFront(item);
                    })}
                  </div>
                ))}
              </div>
            );

            const backPageNode = (
              <div
                key={`print-group-${chunkIdx}-backs`}
                className="print-container w-full"
                style={{ breakAfter: 'page', pageBreakAfter: 'always', marginBottom: '20px' }}
              >
                {chunk.rows.map((row, rowIdx) => {
                  const reversedItems = row.items.slice().reverse();
                  return (
                    <div key={`back-row-${rowIdx}`} className="print-row print-row-back">
                      {reversedItems.map((item, colIdx) => {
                        if (!item) return null;
                        return renderSinglePrintCardBack(item, colIdx);
                      })}
                    </div>
                  );
                })}
              </div>
            );

            return [frontPageNode, backPageNode];
          });
        })()}
      </div>

      {/* RPG-Styled Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm" 
            onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} 
          />
          
          <div className="bg-stone-900 w-full max-w-md rounded-xl shadow-2xl border-2 border-amber-600/50 overflow-hidden flex flex-col relative z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Ornament header */}
            <div className="px-4 py-3 border-b border-stone-800 flex items-center gap-3 bg-stone-950">
              <div className="w-8 h-8 rounded-full bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Icons.Sparkles size={18} />
              </div>
              <h3 className="font-serif font-bold text-sm tracking-wide text-amber-400 uppercase">
                {confirmModal.title || t.vitruviusConfirmModalDefaultTitle || (isEn ? 'SORA • CONFIRMATION' : 'SORA • ПОДТВЕРЖДЕНИЕ')}
              </h3>
            </div>
            
            <div className="p-6 flex flex-col items-center gap-4 text-center bg-stone-900">
              {confirmModal.iconType === 'alert' && <Icons.ShieldX size={48} className="text-red-500/80 animate-bounce" />}
              {confirmModal.iconType === 'warning' && <Icons.Flame size={48} className="text-amber-500/80 animate-pulse" />}
              {confirmModal.iconType === 'success' && <Icons.Sparkles size={48} className="text-emerald-500/80 animate-pulse" />}
              {confirmModal.iconType === 'magic' && <Icons.Wand2 size={48} className="text-purple-400/80 animate-pulse" />}
              {(!confirmModal.iconType || confirmModal.iconType === 'help') && <Icons.HelpCircle size={48} className="text-amber-500/80 animate-pulse" />}
              <p className="text-stone-200 font-serif text-base leading-relaxed italic px-2">
                « {confirmModal.message} »
              </p>
            </div>
            
            <div className="p-4 border-t border-stone-800 bg-stone-950 flex justify-center gap-3">
              {confirmModal.cancelText && (
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-lg text-xs font-bold font-mono uppercase tracking-wider text-stone-400 hover:text-white hover:bg-stone-850 transition-all border border-stone-800"
                >
                  {confirmModal.cancelText}
                </button>
              )}
              <button
                onClick={confirmModal.onConfirm}
                className="px-6 py-2 rounded-lg text-xs font-bold font-mono uppercase tracking-wider bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 shadow-lg shadow-amber-900/20 active:scale-95 transition-all border border-amber-500/30"
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Import Result Modal */}
      {fileImportModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm" 
            onClick={() => setFileImportModal(prev => ({ ...prev, isOpen: false }))} 
          />
          
          <div className="bg-stone-900 w-full max-w-lg rounded-xl shadow-2xl border-2 border-amber-600/50 overflow-hidden flex flex-col relative z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Ornament header */}
            <div className="px-4 py-3 border-b border-stone-800 flex items-center gap-3 bg-stone-950">
              <div className="w-8 h-8 rounded-full bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
                {fileImportModal.status === 'success' ? <Icons.Sparkles size={18} /> : <Icons.AlertTriangle size={18} />}
              </div>
              <h3 className="font-serif font-bold text-sm tracking-wide text-amber-400 uppercase">
                {fileImportModal.status === 'success' ? t.importScrollSuccessTitle : t.importScrollFailTitle}
              </h3>
            </div>
            
            <div className="p-6 flex flex-col items-center gap-4 bg-stone-900 text-stone-200 max-h-[60vh] overflow-y-auto">
              {fileImportModal.status === 'success' ? (
                <Icons.Sparkles size={48} className="text-emerald-500/80 animate-pulse shrink-0" />
              ) : (
                <Icons.Flame size={48} className="text-red-500/80 animate-bounce shrink-0" />
              )}
              
              <div className="text-center">
                <h4 className="font-serif font-bold text-base text-stone-100 mb-1 leading-normal uppercase">
                  {fileImportModal.message}
                </h4>
                <p className="text-stone-300 text-xs leading-relaxed max-w-md mx-auto italic font-serif">
                  « {fileImportModal.errorDetails} »
                </p>
              </div>

              {/* Tip / Advice Section */}
              <div className="w-full bg-stone-950/50 border border-stone-800 rounded-lg p-3.5 flex items-start gap-3 mt-1">
                <Icons.Lightbulb className={fileImportModal.status === 'success' ? "text-amber-500 shrink-0 mt-0.5" : "text-red-400 shrink-0 mt-0.5"} size={16} />
                <div className="flex-1 flex flex-col gap-1 text-left">
                  <span className="text-[10px] font-bold tracking-wider text-stone-400 uppercase">{t.sageAdviceLabel}</span>
                  <span className="text-stone-300 text-xs leading-normal">
                    {fileImportModal.errorAdvice}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-stone-800 bg-stone-950 flex flex-col sm:flex-row justify-center gap-2.5">
              {fileImportModal.status === 'success' ? (
                <>
                  <button
                    onClick={() => setFileImportModal(prev => ({ ...prev, isOpen: false }))}
                    className="px-4 py-2 rounded-lg text-xs font-bold font-mono uppercase tracking-wider text-stone-400 hover:text-white hover:bg-stone-850 transition-all border border-stone-800 order-last sm:order-none cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={() => {
                      saveCards(fileImportModal.cardsToImport);
                      if (fileImportModal.cardsToImport.length > 0) {
                        setSelectedCardId(fileImportModal.cardsToImport[0].id);
                      }
                      syncDeckImagesToLibrary(fileImportModal.cardsToImport, cardBackUrl);
                      showToast(t.deckReplacedToast);
                      setFileImportModal(prev => ({ ...prev, isOpen: false }));
                    }}
                    className="px-4 py-2 rounded-lg text-xs font-bold font-mono uppercase tracking-wider text-stone-300 hover:text-white hover:bg-stone-800 transition-all border border-stone-700 cursor-pointer"
                    title={t.replaceDeckTitle}
                  >
                    {t.replaceDeckBtn}
                  </button>
                  <button
                    onClick={() => {
                      const existingIds = new Set(cards.map(c => c.id));
                      const validatedWithUniqueIds = fileImportModal.cardsToImport.map((c, idx) => {
                        if (existingIds.has(c.id)) {
                          return { ...c, id: `${Date.now()}-append-${idx}-${Math.floor(Math.random() * 1000000)}` };
                        }
                        return c;
                      });
                      const combined = [...cards, ...validatedWithUniqueIds];
                      saveCards(combined);
                      if (validatedWithUniqueIds.length > 0) {
                        setSelectedCardId(validatedWithUniqueIds[0].id);
                      }
                      syncDeckImagesToLibrary(validatedWithUniqueIds, cardBackUrl);
                      showToast(t.cardsAddedToast(validatedWithUniqueIds.length));
                      setFileImportModal(prev => ({ ...prev, isOpen: false }));
                    }}
                    className="px-6 py-2 rounded-lg text-xs font-bold font-mono uppercase tracking-wider bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 shadow-lg shadow-amber-900/20 active:scale-95 transition-all border border-amber-500/30 cursor-pointer"
                    title={t.addToDeckTitle}
                  >
                    {t.addToDeckBtn}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setFileImportModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-6 py-2 rounded-lg text-xs font-bold font-mono uppercase tracking-wider bg-gradient-to-r from-stone-700 to-stone-800 hover:from-stone-650 hover:to-stone-750 text-stone-200 shadow-lg active:scale-95 transition-all border border-stone-600/30 cursor-pointer"
                >
                  {t.gotItBtn}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* JSON Import Modal */}
      {jsonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setJsonModalOpen(false)} />
          
          <div className="bg-white dark:bg-stone-900 w-full max-w-2xl rounded-xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col relative z-10 max-h-[80vh]">
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-850">
              <h3 className="font-serif font-bold text-lg text-stone-800 dark:text-stone-100 flex items-center gap-2">
                <Icons.FileCode className="text-amber-600 dark:text-amber-500" />
                <span>{t.jsonModalTitle}</span>
              </h3>
              <button onClick={() => setJsonModalOpen(false)} className="text-stone-400 hover:text-red-500 transition-colors">
                <Icons.X size={20} />
              </button>
            </div>
            
            <div className="p-4 bg-stone-100 dark:bg-stone-950 flex-1 overflow-hidden flex flex-col gap-3">
              <div id="json-import-tip" className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 rounded-lg p-3.5 text-xs text-amber-900 dark:text-amber-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 leading-normal">
                <div className="flex items-start gap-2.5">
                  <Icons.Lightbulb className="text-amber-500 shrink-0 mt-0.5" size={16} />
                  <span>
                    {t.jsonTipText}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold shadow-sm transition-all cursor-pointer ${
                    copiedPrompt
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold'
                  }`}
                >
                  {copiedPrompt ? (
                    <>
                      <Icons.Check size={14} />
                      <span>{t.promptCopied}</span>
                    </>
                  ) : (
                    <>
                      <Icons.Copy size={14} />
                      <span>{t.copyPromptBtn}</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full h-80 p-3 font-mono text-xs bg-white dark:bg-stone-850 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none text-stone-700 dark:text-stone-200 placeholder:text-stone-400 dark:placeholder:text-stone-500 shadow-inner"
                placeholder={t.jsonPlaceholder}
              />

              {jsonError && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg p-3 text-xs text-red-800 dark:text-red-300 flex items-start gap-2 leading-relaxed max-h-24 overflow-y-auto">
                  <Icons.AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <span>{jsonError}</span>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850 flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={() => setJsonModalOpen(false)}
                className="px-4 py-2 rounded text-sm font-semibold text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors order-last sm:order-none cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => handleApplyJsonText(false)}
                className="px-4 py-2 rounded text-sm font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-300 dark:border-stone-700 shadow-sm transition-all cursor-pointer"
                title={t.replaceDeckTitle}
              >
                {t.replaceDeckBtn}
              </button>
              <button
                type="button"
                onClick={() => handleApplyJsonText(true)}
                className="px-5 py-2 rounded text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-md transition-all cursor-pointer font-bold"
                title={t.addToDeckTitle}
              >
                {t.addToDeckBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Warning Modal (For iframe/AI Studio sandbox environment) */}
      {showPrintWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
          <div 
            className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm transition-opacity" 
            onClick={() => setShowPrintWarning(false)} 
          />
          
          <div className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center bg-stone-50/80 dark:bg-stone-850/80 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <Icons.AlertTriangle size={18} />
                </div>
                <h3 className="font-serif font-bold text-base text-stone-950 dark:text-stone-100 tracking-tight">
                  {t.printWarningTitle}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowPrintWarning(false)} 
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                title={t.closeModalTooltip || 'Закрыть'}
              >
                <Icons.X size={18} />
              </button>
            </div>
            
            <div className="p-5 text-sm text-stone-700 dark:text-stone-300 space-y-4">
              <p className="font-medium text-stone-900 dark:text-stone-200 leading-relaxed">
                {t.printWarningMessage}
              </p>

              <div className="flex flex-col gap-2.5 bg-stone-50 dark:bg-stone-800/60 p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-700/60 shadow-sm">
                <p className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                  <Icons.Globe size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>{t.openInNewTabHint}</span>
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      window.open(window.location.href, '_blank');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-stone-950 rounded-lg text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer select-none"
                  >
                    <Icons.ExternalLink size={15} />
                    <span>{t.openInNewTabBtn}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      requestAlert('clipboard_copied');
                    }}
                    className="px-3.5 py-2.5 bg-white dark:bg-stone-700/80 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-100 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-stone-300/80 dark:border-stone-600/80 shadow-sm select-none"
                    title={t.copyLinkTitle}
                  >
                    <Icons.Copy size={15} />
                    <span>{t.copyLinkBtn}</span>
                  </button>
                </div>
                <div className="relative mt-0.5">
                  <input
                    type="text"
                    readOnly
                    value={window.location.href}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-full px-2.5 py-1.5 text-[11px] font-mono bg-white dark:bg-stone-900/90 border border-stone-200 dark:border-stone-700/80 rounded-lg text-stone-600 dark:text-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-500 selection:bg-amber-500/30 cursor-pointer"
                  />
                </div>
              </div>
              
              <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 rounded-xl p-3.5 text-xs text-amber-950 dark:text-amber-200 space-y-2">
                <p className="font-bold font-serif flex items-center gap-1.5 text-amber-900 dark:text-amber-300 uppercase tracking-wider text-[11px]">
                  <Icons.FileText size={14} className="shrink-0" />
                  <span>{t.pdfGuideTitle}</span>
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-amber-900/90 dark:text-amber-200/90 pl-1 leading-relaxed">
                  <li>{t.pdfStep1}</li>
                  <li>{t.pdfStep2}</li>
                  <li>{t.pdfStep3}</li>
                  <li>{t.pdfStep4}</li>
                </ol>
              </div>
            </div>
            
            <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850 flex justify-end items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowPrintWarning(false);
                  window.print();
                }}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-200/70 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-200 transition-all cursor-pointer"
              >
                {t.tryAnywayBtn}
              </button>
              <button
                type="button"
                onClick={() => setShowPrintWarning(false)}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-stone-900 hover:bg-stone-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white dark:text-stone-950 shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Icons.Check size={14} />
                <span>{t.gotItBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Icon & Type Picker Modal */}
      {iconPickerOpen && selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
          <div className="fixed inset-0 bg-stone-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setIconPickerOpen(false)} />
          
          <div className="bg-white dark:bg-stone-900 w-full max-w-2xl rounded-xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col relative z-10 max-h-[92vh] h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-850 shrink-0">
              <h3 className="font-serif font-bold text-lg text-stone-800 dark:text-stone-100 flex items-center gap-2">
                <Icons.Sparkles className="text-amber-600 dark:text-amber-400 animate-pulse" size={20} />
                <span>{iconPickerTarget === 'type' ? t.chooseTypeModalTitle : t.chooseIconModalTitle}</span>
              </h3>
              <button onClick={() => setIconPickerOpen(false)} className="text-stone-400 hover:text-red-500 transition-colors cursor-pointer p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800">
                <Icons.X size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 min-h-0 p-4 sm:p-5 flex flex-col gap-3.5 bg-white dark:bg-stone-900 overflow-hidden">
              
              {/* Color Customization Accordion */}
              <div className="border border-stone-200 dark:border-stone-750 rounded-xl overflow-hidden bg-stone-50 dark:bg-stone-850 transition-all shadow-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setIconColorsAccordionOpen(prev => !prev)}
                  className="w-full p-3 sm:p-3.5 flex items-center justify-between hover:bg-stone-100/80 dark:hover:bg-stone-800/80 transition-colors cursor-pointer text-left select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 dark:bg-amber-500/25 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Icons.Palette size={15} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                        {t.iconColorCustomization}
                      </div>
                      <div className="text-[10px] text-stone-500 dark:text-stone-400 font-normal">
                        {t.iconColorsAccordionSubtitle}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center -space-x-1.5" title={t.currentColorSettingsTitle}>
                      <div
                        className="w-5 h-5 rounded-full border-2 border-white dark:border-stone-850 shadow-xs"
                        style={{ backgroundColor: selectedCard.customColor || getCardColors(selectedCard).primary }}
                        title={t.iconBgColorLabel}
                      />
                      <div
                        className="w-5 h-5 rounded-full border-2 border-white dark:border-stone-850 shadow-xs flex items-center justify-center text-[9px]"
                        style={{ backgroundColor: selectedCard.customTitleColor || '#ffffff' }}
                        title={t.iconGlyphColorLabel}
                      />
                    </div>
                    <div className={`p-1 rounded-full text-stone-400 dark:text-stone-500 transition-transform duration-200 ${iconColorsAccordionOpen ? 'rotate-180 text-amber-600 dark:text-amber-400' : ''}`}>
                      <Icons.ChevronDown size={16} />
                    </div>
                  </div>
                </button>

                {iconColorsAccordionOpen && (
                  <div className="p-3.5 pt-1.5 border-t border-stone-200/80 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 flex flex-col gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* 1. Icon Background Color ("цвет фона иконки") */}
                      <div className="flex flex-col gap-1.5 bg-stone-50 dark:bg-stone-800/80 p-2.5 rounded-lg border border-stone-200 dark:border-stone-700 shadow-2xs">
                        <span className="text-[11px] text-stone-600 dark:text-stone-300 font-bold uppercase tracking-wider flex items-center justify-between">
                          <span>{t.iconBgColorLabel}</span>
                          <span className="text-[10px] font-mono lowercase text-amber-600 dark:text-amber-400">{t.clickOrPipetteHint}</span>
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Preset background colors */}
                          {ICON_BG_PRESETS.map(preset => (
                            <button
                              key={preset.value}
                              type="button"
                              onClick={() => handleUpdateCardField('customColor', preset.value)}
                              className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center shrink-0 cursor-pointer hover:scale-110 active:scale-95 ${
                                (selectedCard.customColor || getCardColors(selectedCard).primary) === preset.value
                                  ? 'border-amber-600 scale-105 shadow-xs ring-2 ring-amber-500/30'
                                  : 'border-stone-200 dark:border-stone-600'
                              }`}
                              style={{ backgroundColor: preset.value }}
                              title={preset.name}
                            >
                              {(selectedCard.customColor || getCardColors(selectedCard).primary) === preset.value && (
                                <Icons.Check size={12} className="text-white drop-shadow-xs font-bold" />
                              )}
                            </button>
                          ))}
                          
                          {/* Custom Background Color Picker */}
                          <div className="flex items-center gap-1 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-full px-2 py-0.5 shrink-0">
                            <div className="relative flex items-center shrink-0 w-4 h-4">
                              <input
                                type="color"
                                value={selectedCard.customColor || getCardColors(selectedCard).primary}
                                onChange={(e) => handleUpdateCardField('customColor', e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                title={t.customColorTitle}
                              />
                              <div className="w-4 h-4 rounded-full border border-stone-300 dark:border-stone-600 flex items-center justify-center bg-white dark:bg-stone-800 pointer-events-none">
                                <Icons.Pipette size={10} className="text-stone-500 dark:text-stone-400" />
                              </div>
                            </div>
                            <input
                              type="text"
                              placeholder={t.customHexPlaceholder}
                              value={selectedCard.customColor ? selectedCard.customColor.toUpperCase() : ''}
                              onChange={(e) => {
                                let val = e.target.value;
                                if (!val) {
                                  handleUpdateCardField('customColor', undefined);
                                  return;
                                }
                                if (!val.startsWith('#') && /^[0-9a-fA-F]{1,6}$/.test(val)) {
                                  val = '#' + val;
                                }
                                handleUpdateCardField('customColor', val);
                              }}
                              className="text-[10px] font-mono text-stone-700 dark:text-stone-200 font-bold bg-transparent w-[55px] focus:outline-none uppercase border-none p-0"
                            />
                          </div>
                          
                          {/* Reset background color */}
                          {selectedCard.customColor && (
                            <button
                              type="button"
                              onClick={() => handleUpdateCardField('customColor', undefined)}
                              className="px-2 py-0.5 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 border border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-200 font-bold text-[10px] rounded transition-colors cursor-pointer"
                              title={t.resetColorToDefaultTitle}
                            >
                              {t.resetColorToDefault}
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* 2. Icon Glyphs Color ("цвет самого значка иконки") */}
                      <div className="flex flex-col gap-1.5 bg-stone-50 dark:bg-stone-800/80 p-2.5 rounded-lg border border-stone-200 dark:border-stone-700 shadow-2xs">
                        <span className="text-[11px] text-stone-600 dark:text-stone-300 font-bold uppercase tracking-wider flex items-center justify-between">
                          <span>{t.iconGlyphColorLabel}</span>
                          <span className="text-[10px] font-mono lowercase text-amber-600 dark:text-amber-400">{t.clickOrPipetteHint}</span>
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Preset icon colors */}
                          {ICON_COLOR_PRESETS.map(preset => (
                            <button
                              key={preset.value}
                              type="button"
                              onClick={() => handleUpdateCardField('customTitleColor', preset.value)}
                              className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center shrink-0 cursor-pointer hover:scale-110 active:scale-95 ${
                                (selectedCard.customTitleColor || '#ffffff') === preset.value
                                  ? 'border-amber-600 scale-105 shadow-xs ring-2 ring-amber-500/30'
                                  : 'border-stone-200 dark:border-stone-600'
                              }`}
                              style={{ backgroundColor: preset.value }}
                              title={preset.name}
                            >
                              {(selectedCard.customTitleColor || '#ffffff') === preset.value && (
                                <Icons.Check size={12} className={preset.value === '#ffffff' ? 'text-stone-950 font-bold' : 'text-white drop-shadow-xs font-bold'} />
                              )}
                            </button>
                          ))}
                          
                          {/* Custom Icon Color Picker */}
                          <div className="flex items-center gap-1 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-full px-2 py-0.5 shrink-0">
                            <div className="relative flex items-center shrink-0 w-4 h-4">
                              <input
                                type="color"
                                value={selectedCard.customTitleColor || '#ffffff'}
                                onChange={(e) => handleUpdateCardField('customTitleColor', e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                title={t.customColorTitle}
                              />
                              <div className="w-4 h-4 rounded-full border border-stone-300 dark:border-stone-600 flex items-center justify-center bg-white dark:bg-stone-800 pointer-events-none">
                                <Icons.Pipette size={10} className="text-stone-500 dark:text-stone-400" />
                              </div>
                            </div>
                            <input
                              type="text"
                              placeholder={t.customHexPlaceholder}
                              value={selectedCard.customTitleColor ? selectedCard.customTitleColor.toUpperCase() : ''}
                              onChange={(e) => {
                                let val = e.target.value;
                                if (!val) {
                                  handleUpdateCardField('customTitleColor', undefined);
                                  return;
                                }
                                if (!val.startsWith('#') && /^[0-9a-fA-F]{1,6}$/.test(val)) {
                                  val = '#' + val;
                                }
                                handleUpdateCardField('customTitleColor', val);
                              }}
                              className="text-[10px] font-mono text-stone-700 dark:text-stone-200 font-bold bg-transparent w-[55px] focus:outline-none uppercase border-none p-0"
                            />
                          </div>
                          
                          {/* Reset icon color */}
                          {selectedCard.customTitleColor && (
                            <button
                              type="button"
                              onClick={() => handleUpdateCardField('customTitleColor', undefined)}
                              className="px-2 py-0.5 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 border border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-200 font-bold text-[10px] rounded transition-colors cursor-pointer"
                              title={t.resetColorToDefaultTitle}
                            >
                              {t.resetColorToDefault}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Main Selection Area */}
              <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
                <div className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center justify-between shrink-0">
                  <span>{iconPickerTarget === 'type' ? t.chooseTypeSectionLabel : t.chooseIconSectionLabel}</span>
                  <span className="text-[10px] text-stone-400 dark:text-stone-400 font-normal">
                    {iconPickerTarget === 'type' ? t.chooseTypeSectionSub : t.chooseIconSectionSub}
                  </span>
                </div>
                
                {iconPickerTarget === 'type' ? (
                  /* Grid of Card Types with Icons displayed directly */
                  <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {cardTypes.map(type => {
                      const isSelected = selectedCard.typeId === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => {
                            handleUpdateCardField('typeId', type.id);
                            setIconPickerOpen(false);
                          }}
                          className={`p-3.5 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2.5 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800 active:scale-98 ${
                            isSelected
                              ? 'border-amber-600 bg-amber-50/20 dark:bg-amber-950/30 shadow-md scale-102 ring-2 ring-amber-500/10'
                              : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-stone-300 dark:hover:border-stone-600 shadow-sm'
                          }`}
                        >
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md transition-all" 
                            style={{ backgroundColor: type.color }}
                          >
                            <CardIcon name={type.icon} size={22} />
                          </div>
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-xs font-bold text-stone-800 dark:text-stone-200 tracking-tight leading-tight">
                              {type.name}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                    </div>
                  </div>
                ) : (
                  /* Grid of all beautiful TTRPG preset icons */
                  <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
                    {/* Category tabs */}
                    <div className="flex flex-wrap gap-1 border-b border-stone-200 dark:border-stone-750 pb-2 shrink-0">
                      {ICON_CATEGORIES.map(cat => {
                        const count = cat.id === 'all' 
                          ? AVAILABLE_ICONS.length + userCustomIcons.length
                          : cat.id === 'fav'
                          ? favoriteIcons.length
                          : cat.id === 'custom'
                          ? userCustomIcons.length
                          : AVAILABLE_ICONS.filter(icon => getIconCategory(icon) === cat.id).length;
                        
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setIconCategoryTab(cat.id)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                              iconCategoryTab === cat.id
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                            }`}
                          >
                            <span>{getIconCategoryLabel(cat.id, t)}</span>
                            {count > 0 && <span className="opacity-75 text-[10px]">({count})</span>}
                          </button>
                        );
                      })}
                    </div>

                    {/* Scrollable container for icons */}
                    <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-3">
                      {/* Custom Icons category tab view */}
                    {iconCategoryTab === 'custom' && (
                      userCustomIcons.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50/50 dark:bg-stone-850/50 gap-3">
                          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-sm">
                            <Icons.UploadCloud size={24} />
                          </div>
                          <div className="flex flex-col gap-1 max-w-xs">
                            <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                              {t.noCustomIconsYet}
                            </span>
                            <span className="text-[11px] text-stone-400 dark:text-stone-500">
                              {t.noCustomIconsYetSub}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setUploadCustomIconModalOpen(true)}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
                          >
                            <Icons.Upload size={14} />
                            <span>{t.uploadCustomIconBtn}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2.5 max-h-[300px] overflow-y-auto p-1.5 border border-stone-100 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-850">
                          {userCustomIcons.map(icon => {
                            const isSelected = selectedCard.customIcon === icon.dataUrl || selectedCard.customIcon === icon.id;
                            return (
                              <div key={icon.id} className="relative group">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleUpdateCardField('customIcon', icon.dataUrl);
                                    setIconPickerOpen(false);
                                  }}
                                  className={`w-full p-2 rounded-xl border-2 transition-all flex items-center justify-center cursor-pointer bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 active:scale-95 ${
                                    isSelected
                                      ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 shadow-md scale-105 ring-2 ring-amber-500/15'
                                      : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                                  }`}
                                  title={icon.name}
                                >
                                  <div 
                                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 shadow-inner overflow-hidden"
                                    style={{ 
                                      backgroundColor: selectedCard.customColor || getCardColors(selectedCard).primary,
                                      color: selectedCard.customTitleColor || '#ffffff'
                                    }}
                                  >
                                    <CardIcon
                                      name={icon.svgContent || icon.dataUrl || icon.id}
                                      size={22}
                                      style={{ color: selectedCard.customTitleColor || '#ffffff' }}
                                    />
                                  </div>
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteCustomIconTarget(icon);
                                  }}
                                  className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-white dark:bg-stone-800 shadow-md border border-stone-200 dark:border-stone-700 text-stone-400 hover:text-red-500 hover:scale-110 hover:border-red-300 dark:hover:border-red-700 transition-all opacity-0 group-hover:opacity-100 cursor-pointer z-10"
                                  title={t.deleteCustomIconTitle}
                                >
                                  <Icons.Trash2 size={11} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )
                    )}

                    {/* All / Preset categories */}
                    {iconCategoryTab !== 'custom' && (() => {
                      const filteredIcons = AVAILABLE_ICONS.filter(iconName => {
                        if (iconCategoryTab === 'all') return true;
                        if (iconCategoryTab === 'fav') return favoriteIcons.includes(iconName);
                        return getIconCategory(iconName) === iconCategoryTab;
                      });

                      return (
                        <div className="flex flex-col gap-3">
                          {/* If in 'all' and user has custom icons, show custom icons section first */}
                          {iconCategoryTab === 'all' && userCustomIcons.length > 0 && (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                                <span>{t.iconCatCustom} ({userCustomIcons.length})</span>
                                <button
                                  type="button"
                                  onClick={() => setUploadCustomIconModalOpen(true)}
                                  className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                                >
                                  <Icons.Plus size={12} />
                                  <span>{t.uploadCustomIconBtn}</span>
                                </button>
                              </div>
                              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2.5 p-1.5 border border-stone-100 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-850">
                                {userCustomIcons.map(icon => {
                                  const isSelected = selectedCard.customIcon === icon.dataUrl || selectedCard.customIcon === icon.id;
                                  return (
                                    <div key={icon.id} className="relative group">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleUpdateCardField('customIcon', icon.dataUrl);
                                          setIconPickerOpen(false);
                                        }}
                                        className={`w-full p-2 rounded-xl border-2 transition-all flex items-center justify-center cursor-pointer bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 active:scale-95 ${
                                          isSelected
                                            ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 shadow-md scale-105 ring-2 ring-amber-500/15'
                                            : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                                        }`}
                                        title={icon.name}
                                      >
                                        <div 
                                          className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 shadow-inner overflow-hidden"
                                          style={{ 
                                            backgroundColor: selectedCard.customColor || getCardColors(selectedCard).primary,
                                            color: selectedCard.customTitleColor || '#ffffff'
                                          }}
                                        >
                                          <CardIcon
                                            name={icon.svgContent || icon.dataUrl || icon.id}
                                            size={22}
                                            style={{ color: selectedCard.customTitleColor || '#ffffff' }}
                                          />
                                        </div>
                                      </button>
                                      
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeleteCustomIconTarget(icon);
                                        }}
                                        className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-white dark:bg-stone-800 shadow-md border border-stone-200 dark:border-stone-700 text-stone-400 hover:text-red-500 hover:scale-110 hover:border-red-300 dark:hover:border-red-700 transition-all opacity-0 group-hover:opacity-100 cursor-pointer z-10"
                                        title={t.deleteCustomIconTitle}
                                      >
                                        <Icons.Trash2 size={11} />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {filteredIcons.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50/50 dark:bg-stone-850/50">
                              <Icons.Star className="text-amber-400 mb-2 animate-bounce" size={28} fill="currentColor" />
                              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                                {iconCategoryTab === 'fav' 
                                  ? t.noFavIconsYet 
                                  : t.noIconsInCategory}
                              </span>
                            </div>
                          ) : (
                            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2.5 max-h-[300px] overflow-y-auto p-1.5 border border-stone-100 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-850">
                              {filteredIcons.map(iconName => {
                                const currentColors = getCardColors(selectedCard);
                                const isSelected = selectedCard.customIcon === iconName || (!selectedCard.customIcon && currentColors.icon === iconName);
                                const isFav = favoriteIcons.includes(iconName);
                                return (
                                  <div key={iconName} className="relative group">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleUpdateCardField('customIcon', iconName);
                                        setIconPickerOpen(false);
                                      }}
                                      className={`w-full p-2 rounded-xl border-2 transition-all flex items-center justify-center cursor-pointer bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 active:scale-95 ${
                                        isSelected
                                          ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 shadow-md scale-105 ring-2 ring-amber-500/15'
                                          : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                                      }`}
                                      title={iconName}
                                    >
                                      <div 
                                        className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 shadow-inner"
                                        style={{ 
                                          backgroundColor: selectedCard.customColor || getCardColors(selectedCard).primary,
                                          color: selectedCard.customTitleColor || '#ffffff'
                                        }}
                                      >
                                        <CardIcon name={iconName} size={18} style={{ color: selectedCard.customTitleColor || '#ffffff' }} />
                                      </div>
                                    </button>
                                    
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavoriteIcon(iconName);
                                      }}
                                      className={`absolute -top-1.5 -right-1.5 p-1 rounded-full bg-white dark:bg-stone-800 shadow-md border border-stone-200 dark:border-stone-700 transition-all cursor-pointer z-10 ${
                                        isFav 
                                          ? 'text-amber-500 scale-100 opacity-100' 
                                          : 'text-stone-300 dark:text-stone-600 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:text-amber-500 hover:scale-110'
                                      }`}
                                      title={isFav ? t.removeFromFavTitle : t.addToFavTitle}
                                    >
                                      <Icons.Star size={10} fill={isFav ? "currentColor" : "none"} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Modal Footer with "Upload Custom Icon" button */}
            <div className="p-3.5 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between bg-stone-50 dark:bg-stone-850 gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setUploadCustomIconModalOpen(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-bold text-xs rounded-lg transition-all shadow-sm flex items-center gap-2 cursor-pointer hover:shadow"
              >
                <Icons.Upload size={14} />
                <span>{t.uploadCustomIconBtn}</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedCard.customIcon && (
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateCardField('customIcon', undefined);
                      setIconPickerOpen(false);
                    }}
                    className="px-3.5 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs rounded-lg transition-colors border border-stone-200 dark:border-stone-700 shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <Icons.RotateCcw size={14} className="text-stone-600 dark:text-stone-400" />
                    <span>{t.resetToTypeDefaultIcon}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIconPickerOpen(false)}
                  className="px-5 py-2 bg-stone-800 dark:bg-stone-700 hover:bg-stone-900 dark:hover:bg-stone-600 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-md"
                >
                  {t.doneBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List Editor Modal */}
      {listEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
          <div className="fixed inset-0 bg-stone-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setListEditorOpen(false)} />
          
          <div className="bg-white dark:bg-stone-900 w-full max-w-2xl rounded-xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col relative z-10 max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-850">
              <h3 className="font-serif font-bold text-lg text-stone-800 dark:text-stone-100 flex items-center gap-2">
                <Icons.Settings className="text-amber-600 dark:text-amber-400" />
                <span>{t.listEditorTitle}</span>
              </h3>
              <button onClick={() => setListEditorOpen(false)} className="text-stone-400 hover:text-red-500 transition-colors">
                <Icons.X size={20} />
              </button>
            </div>

            {/* Tabs selector */}
            <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-850">
              <button
                onClick={() => setListEditorTab('types')}
                className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                  listEditorTab === 'types'
                    ? 'border-amber-600 text-amber-600 dark:text-amber-400 bg-white dark:bg-stone-900'
                    : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800'
                }`}
              >
                {t.cardTypesTab(cardTypes.length)}
              </button>
              <button
                onClick={() => setListEditorTab('rarities')}
                className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                  listEditorTab === 'rarities'
                    ? 'border-amber-600 text-amber-600 dark:text-amber-400 bg-white dark:bg-stone-900'
                    : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800'
                }`}
              >
                {t.raritiesTab(rarities.length)}
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex-1 overflow-y-auto bg-stone-50 dark:bg-stone-900 space-y-6">
              {listEditorTab === 'types' ? (
                <div className="space-y-5">
                  {/* Create Type Form */}
                  <div className="bg-white dark:bg-stone-850 p-4 rounded-lg border border-stone-200 dark:border-stone-750 shadow-sm space-y-3">
                    <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider flex items-center gap-1">
                      <Icons.Plus size={14} className="text-amber-600 dark:text-amber-400" />
                      <span>{t.createNewTypeHeader}</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400">{t.typeNameLabel}</label>
                        <input
                          type="text"
                          value={newTypeName}
                          onChange={(e) => setNewTypeName(e.target.value)}
                          placeholder={t.typeNamePlaceholder}
                          className="px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white dark:focus:bg-stone-750 text-stone-800 dark:text-stone-100"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400">{t.iconLabel}</label>
                        <button
                          type="button"
                          onClick={() => {
                            setTypeIconCategoryTab('all');
                            setTypeIconPickerOpen(true);
                          }}
                          className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 border border-stone-200 dark:border-stone-700 rounded text-xs text-stone-800 dark:text-stone-200 font-semibold flex items-center justify-between transition-colors cursor-pointer"
                          style={{ height: '30px' }}
                          title={t.chooseIconFromLibTitle}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div 
                              className="w-5 h-5 rounded flex items-center justify-center text-white shrink-0 shadow-sm" 
                              style={{ backgroundColor: newTypeColor }}
                            >
                              <CardIcon name={newTypeIcon} size={11} />
                            </div>
                            <span className="truncate">{newTypeIcon}</span>
                          </div>
                          <Icons.ChevronDown size={14} className="text-stone-400 shrink-0" />
                        </button>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400">{t.mainBadgeColorLabel}</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={newTypeColor}
                            onChange={(e) => setNewTypeColor(e.target.value)}
                            className="w-8 h-8 rounded border border-stone-300 dark:border-stone-600 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={newTypeColor}
                            onChange={(e) => setNewTypeColor(e.target.value)}
                            placeholder="#b45309"
                            className="flex-1 px-2.5 py-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white dark:focus:bg-stone-750 text-stone-800 dark:text-stone-100 font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400">{t.secondaryBadgeColorLabel}</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={newTypeSubColor}
                            onChange={(e) => setNewTypeSubColor(e.target.value)}
                            className="w-8 h-8 rounded border border-stone-300 dark:border-stone-600 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={newTypeSubColor}
                            onChange={(e) => setNewTypeSubColor(e.target.value)}
                            placeholder="#78350f"
                            className="flex-1 px-2.5 py-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white dark:focus:bg-stone-750 text-stone-800 dark:text-stone-100 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => {
                          if (!newTypeName.trim()) return;
                          handleCreateType(newTypeName, newTypeColor, newTypeSubColor, newTypeIcon);
                          setNewTypeName('');
                        }}
                        className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded transition-all shadow-sm cursor-pointer"
                      >
                        {t.addToListBtn}
                      </button>
                    </div>
                  </div>

                  {/* List of current Types */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">{t.currentTypesHeader}</span>
                    <div className="bg-white dark:bg-stone-850 rounded-lg border border-stone-200 dark:border-stone-750 divide-y divide-stone-100 dark:divide-stone-800 overflow-hidden">
                      {cardTypes.map((type, idx) => (
                        <div key={type.id} className="p-3 flex items-center justify-between gap-4 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded flex items-center justify-center text-white shrink-0 shadow-inner" style={{ backgroundColor: type.color }}>
                              <CardIcon name={type.icon} size={16} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">{type.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="w-2.5 h-2.5 rounded-full border border-stone-300 dark:border-stone-600 shrink-0 inline-block" style={{ backgroundColor: type.color }} title={t.mainColorTooltip} />
                                <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400">{type.color}</span>
                                <span className="w-2.5 h-2.5 rounded-full border border-stone-300 dark:border-stone-600 shrink-0 inline-block ml-1" style={{ backgroundColor: type.subColor }} title={t.secondaryColorTooltip} />
                                <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400">{type.subColor}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action controls */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleMoveType(type.id, 'up')}
                              disabled={idx === 0}
                              className={`p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-750 text-stone-500 dark:text-stone-400 transition-colors ${idx === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                              title={t.moveUpTitle}
                            >
                              <Icons.ChevronUp size={14} />
                            </button>
                            <button
                              onClick={() => handleMoveType(type.id, 'down')}
                              disabled={idx === cardTypes.length - 1}
                              className={`p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-750 text-stone-500 dark:text-stone-400 transition-colors ${idx === cardTypes.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                              title={t.moveDownTitle}
                            >
                              <Icons.ChevronDown size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteType(type.id)}
                              className="p-1.5 rounded hover:bg-red-500 hover:text-white text-stone-400 dark:text-stone-500 transition-colors ml-1 cursor-pointer"
                              title={t.deleteTitle}
                            >
                              <Icons.Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Create Rarity Form */}
                  <div className="bg-white dark:bg-stone-850 p-4 rounded-lg border border-stone-200 dark:border-stone-750 shadow-sm space-y-3">
                    <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider flex items-center gap-1">
                      <Icons.Plus size={14} className="text-amber-600 dark:text-amber-400" />
                      <span>{t.createNewRarityHeader}</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400">{t.rarityNameLabel}</label>
                        <input
                          type="text"
                          value={newRarityName}
                          onChange={(e) => setNewRarityName(e.target.value)}
                          placeholder={t.rarityNamePlaceholder}
                          className="px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white dark:focus:bg-stone-750 text-stone-800 dark:text-stone-100"
                        />
                      </div>

                      <div className="flex items-end pb-1.5">
                        <label className="flex items-center gap-2 cursor-pointer select-none w-full">
                          <input
                            type="checkbox"
                            checked={newRarityMatchGlowColor}
                            onChange={(e) => setNewRarityMatchGlowColor(e.target.checked)}
                            className="accent-amber-600 rounded text-amber-600 h-3.5 w-3.5"
                          />
                          <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 leading-tight">
                            {t.badgeMatchesGlowLabel}
                          </span>
                        </label>
                      </div>

                      <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400">{t.glowVisualPresetLabel}</label>
                        <div className="flex flex-wrap items-center gap-2">
                          {[
                            { value: 'common', color: '#78716c', label: t.rarityPresetLabels.common },
                            { value: 'uncommon', color: '#10b981', label: t.rarityPresetLabels.uncommon },
                            { value: 'rare', color: '#3b82f6', label: t.rarityPresetLabels.rare },
                            { value: 'epic', color: '#a855f7', label: t.rarityPresetLabels.epic },
                            { value: 'legendary', color: '#f59e0b', label: t.rarityPresetLabels.legendary },
                          ].map((preset) => {
                            const isSelected = newRarityPreset === preset.value;
                            return (
                              <button
                                type="button"
                                key={preset.value}
                                onClick={() => setNewRarityPreset(preset.value as any)}
                                className={`w-8 h-8 rounded-full border transition-all flex items-center justify-center relative cursor-pointer ${
                                  isSelected 
                                    ? 'border-amber-600 scale-110 ring-2 ring-amber-600/20 shadow-md' 
                                    : 'border-stone-200 dark:border-stone-700 hover:scale-105 hover:shadow-sm'
                                }`}
                                style={{ backgroundColor: preset.color }}
                                title={preset.label}
                              >
                                {isSelected && <Icons.Check size={14} className={preset.value === 'legendary' ? 'text-stone-900' : 'text-white'} />}
                              </button>
                            );
                          })}
                          
                          {/* Custom Color Circle with Palette Icon */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setNewRarityPreset('custom')}
                              className={`w-8 h-8 rounded-full border transition-all flex items-center justify-center relative overflow-hidden text-white cursor-pointer ${
                                newRarityPreset === 'custom'
                                  ? 'border-amber-600 scale-110 ring-2 ring-amber-600/20 shadow-md'
                                  : 'border-stone-200 dark:border-stone-700 hover:scale-105 hover:shadow-sm'
                              }`}
                              style={{ 
                                backgroundColor: newRarityPreset === 'custom' ? customRarityGlowColor : '#1e1b4b',
                                backgroundImage: newRarityPreset !== 'custom' ? 'linear-gradient(to top right, #6366f1, #a855f7, #ec4899)' : undefined
                              }}
                              title={t.customStyleGlowTitle}
                            >
                              <Icons.Palette size={14} />
                              {newRarityPreset === 'custom' && (
                                <div className="absolute right-0 bottom-0 bg-amber-600 text-stone-950 p-0.5 rounded-tl-sm">
                                  <Icons.Check size={8} />
                                </div>
                              )}
                            </button>
                          </div>

                          {/* Custom color input */}
                          {newRarityPreset === 'custom' && (
                            <div className="flex items-center gap-1.5 ml-2 animate-fadeIn">
                              <input
                                type="color"
                                value={customRarityGlowColor}
                                onChange={(e) => setCustomRarityGlowColor(e.target.value)}
                                className="w-8 h-8 rounded border border-stone-300 dark:border-stone-600 cursor-pointer p-0.5"
                                title={t.colorPaletteTitle}
                              />
                              <input
                                type="text"
                                value={customRarityGlowColor}
                                onChange={(e) => setCustomRarityGlowColor(e.target.value)}
                                placeholder="#8b5cf6"
                                className="w-20 px-2 py-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-stone-800 dark:text-stone-100"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Custom badge color selection when match is disabled */}
                      {!newRarityMatchGlowColor && (
                        <div className="flex flex-col gap-1.5 md:col-span-2 border-t border-stone-100 dark:border-stone-800 pt-3">
                          <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400">{t.badgeBgColorLabel}</label>
                          <div className="flex flex-wrap items-center gap-2">
                            {[
                              { value: '#78716c', label: t.rarityColorLabels.grey },
                              { value: '#ef4444', label: t.rarityColorLabels.red },
                              { value: '#f59e0b', label: t.rarityColorLabels.yellow },
                              { value: '#10b981', label: t.rarityColorLabels.green },
                              { value: '#3b82f6', label: t.rarityColorLabels.blue },
                              { value: '#a855f7', label: t.rarityColorLabels.purple },
                            ].map((preset) => {
                              const isSelected = newRarityCustomBadgeColor === preset.value;
                              return (
                                <button
                                  type="button"
                                  key={preset.value}
                                  onClick={() => setNewRarityCustomBadgeColor(preset.value)}
                                  className={`w-8 h-8 rounded-full border transition-all flex items-center justify-center relative cursor-pointer ${
                                    isSelected 
                                      ? 'border-amber-600 scale-110 ring-2 ring-amber-600/20 shadow-md' 
                                      : 'border-stone-200 dark:border-stone-700 hover:scale-105'
                                  }`}
                                  style={{ backgroundColor: preset.value }}
                                  title={preset.label}
                                >
                                  {isSelected && <Icons.Check size={14} className="text-white" />}
                                </button>
                              );
                            })}
                            
                            {/* Palette input */}
                            <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full px-2 py-0.5 shrink-0">
                              <div className="relative w-5 h-5 shrink-0">
                                <button
                                  type="button"
                                  className={`w-5 h-5 rounded-full border transition-all flex items-center justify-center relative overflow-hidden text-white ${
                                    newRarityCustomBadgeColor !== 'subtitle' && !['#78716c', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#a855f7'].includes(newRarityCustomBadgeColor)
                                      ? 'border-amber-600'
                                      : 'border-stone-200 dark:border-stone-700 hover:scale-105'
                                  }`}
                                  style={{ 
                                    backgroundColor: newRarityCustomBadgeColor !== 'subtitle' && !['#78716c', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#a855f7'].includes(newRarityCustomBadgeColor) ? newRarityCustomBadgeColor : '#1e1b4b',
                                    backgroundImage: newRarityCustomBadgeColor === 'subtitle' || ['#78716c', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#a855f7'].includes(newRarityCustomBadgeColor) ? 'linear-gradient(to top right, #6366f1, #a855f7, #ec4899)' : undefined
                                  }}
                                  title={t.customColorTitle}
                                >
                                  <Icons.Palette size={10} />
                                  <input
                                    type="color"
                                    value={newRarityCustomBadgeColor !== 'subtitle' ? newRarityCustomBadgeColor : '#78716c'}
                                    onChange={(e) => setNewRarityCustomBadgeColor(e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                  />
                                </button>
                              </div>
                              <input
                                type="text"
                                placeholder={t.customHexPlaceholder}
                                value={newRarityCustomBadgeColor !== 'subtitle' ? newRarityCustomBadgeColor.toUpperCase() : ''}
                                onChange={(e) => {
                                  let val = e.target.value;
                                  if (!val) {
                                    setNewRarityCustomBadgeColor('subtitle');
                                    return;
                                  }
                                  if (!val.startsWith('#') && /^[0-9a-fA-F]{1,6}$/.test(val)) {
                                    val = '#' + val;
                                  }
                                  setNewRarityCustomBadgeColor(val);
                                }}
                                className="text-[10px] font-mono text-stone-700 dark:text-stone-200 font-bold bg-transparent w-[60px] focus:outline-none uppercase border-none p-0"
                              />
                            </div>

                            {/* Subtitle / Cross button */}
                            <button
                              type="button"
                              onClick={() => setNewRarityCustomBadgeColor('subtitle')}
                              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 hover:text-stone-800 dark:hover:text-stone-100 relative cursor-pointer ${
                                newRarityCustomBadgeColor === 'subtitle'
                                  ? 'border-amber-600 scale-110 ring-2 ring-amber-600/20 shadow-md bg-stone-200 dark:bg-stone-700'
                                  : 'border-stone-200 dark:border-stone-700 hover:scale-105'
                              }`}
                              title={t.matchSubtitleBgTitle}
                            >
                              <Icons.X size={14} />
                              {newRarityCustomBadgeColor === 'subtitle' && (
                                <div className="absolute right-0 bottom-0 bg-amber-600 text-stone-950 p-0.5 rounded-tl-sm">
                                  <Icons.Check size={8} />
                                </div>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => {
                          if (!newRarityName.trim()) return;
                          handleCreateRarity(
                            newRarityName,
                            newRarityPreset,
                            newRarityPreset === 'custom' ? customRarityGlowColor : undefined,
                            newRarityMatchGlowColor,
                            newRarityMatchGlowColor ? undefined : newRarityCustomBadgeColor
                          );
                          setNewRarityName('');
                          setNewRarityPreset('common');
                          setNewRarityMatchGlowColor(true);
                          setNewRarityCustomBadgeColor('#78716c');
                        }}
                        className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded transition-all shadow-sm cursor-pointer"
                      >
                        {t.addToListBtn}
                      </button>
                    </div>
                  </div>

                  {/* List of current Rarities */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">{t.currentRaritiesHeader}</span>
                    <div className="bg-white dark:bg-stone-850 rounded-lg border border-stone-200 dark:border-stone-750 divide-y divide-stone-100 dark:divide-stone-800 overflow-hidden">
                      {rarities.map((r, idx) => (
                        <div key={r.id} className="p-3 flex items-center justify-between gap-4 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-stone-800 dark:text-stone-200">{r.name}</span>
                              <span className="text-[9px] text-stone-400 dark:text-stone-500 font-mono">({r.stylePreset})</span>
                            </div>
                          </div>

                          {/* Action controls */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleMoveRarity(r.id, 'up')}
                              disabled={idx === 0}
                              className={`p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-750 text-stone-500 dark:text-stone-400 transition-colors ${idx === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                              title={t.moveUpTitle}
                            >
                              <Icons.ChevronUp size={14} />
                            </button>
                            <button
                              onClick={() => handleMoveRarity(r.id, 'down')}
                              disabled={idx === rarities.length - 1}
                              className={`p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-750 text-stone-500 dark:text-stone-400 transition-colors ${idx === rarities.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                              title={t.moveDownTitle}
                            >
                              <Icons.ChevronDown size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteRarity(r.id)}
                              className="p-1.5 rounded hover:bg-red-500 hover:text-white text-stone-400 dark:text-stone-500 transition-colors ml-1 cursor-pointer"
                              title={t.deleteTitle}
                            >
                              <Icons.Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850 flex justify-end">
              <button
                onClick={() => setListEditorOpen(false)}
                className="px-5 py-2 rounded text-xs font-bold bg-stone-900 dark:bg-stone-800 text-white hover:bg-stone-800 dark:hover:bg-stone-700 shadow-sm transition-all cursor-pointer"
              >
                {t.doneBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Type Icon Picker Modal */}
      {typeIconPickerOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 no-print">
          <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm" onClick={() => setTypeIconPickerOpen(false)} />
          
          <div className="bg-white dark:bg-stone-900 w-full max-w-xl rounded-xl shadow-2xl border-2 border-amber-600/50 dark:border-amber-500/50 overflow-hidden flex flex-col relative z-10 max-h-[90vh] h-[86vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-850 shrink-0">
              <h3 className="font-serif font-bold text-sm text-stone-800 dark:text-stone-100 flex items-center gap-2 uppercase tracking-wide">
                <Icons.Sparkles className="text-amber-600 dark:text-amber-400" size={16} />
                <span>{t.chooseIconForTypeTitle}</span>
              </h3>
              <button 
                onClick={() => setTypeIconPickerOpen(false)} 
                className="text-stone-400 hover:text-red-500 transition-colors cursor-pointer p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <Icons.X size={18} />
              </button>
            </div>
            
            {/* Body */}
            <div className="flex-1 min-h-0 p-4 flex flex-col gap-3 bg-white dark:bg-stone-900 overflow-hidden">
              {/* Color Customization Accordion */}
              <div className="border border-stone-200 dark:border-stone-750 rounded-xl overflow-hidden bg-stone-50 dark:bg-stone-850 transition-all shadow-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setTypeIconColorsAccordionOpen(prev => !prev)}
                  className="w-full p-3 sm:p-3.5 flex items-center justify-between hover:bg-stone-100/80 dark:hover:bg-stone-800/80 transition-colors cursor-pointer text-left select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 dark:bg-amber-500/25 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Icons.Palette size={15} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                        {t.iconColorCustomization}
                      </div>
                      <div className="text-[10px] text-stone-500 dark:text-stone-400 font-normal">
                        {t.iconColorsAccordionSubtitle}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center -space-x-1.5" title={t.currentColorSettingsTitle}>
                      <div
                        className="w-5 h-5 rounded-full border-2 border-white dark:border-stone-850 shadow-xs"
                        style={{ backgroundColor: newTypeColor }}
                        title={t.mainBadgeColorLabel}
                      />
                      <div
                        className="w-5 h-5 rounded-full border-2 border-white dark:border-stone-850 shadow-xs"
                        style={{ backgroundColor: newTypeSubColor }}
                        title={t.secondaryBadgeColorLabel}
                      />
                    </div>
                    <div className={`p-1 rounded-full text-stone-400 dark:text-stone-500 transition-transform duration-200 ${typeIconColorsAccordionOpen ? 'rotate-180 text-amber-600 dark:text-amber-400' : ''}`}>
                      <Icons.ChevronDown size={16} />
                    </div>
                  </div>
                </button>

                {typeIconColorsAccordionOpen && (
                  <div className="p-3.5 pt-1.5 border-t border-stone-200/80 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900 flex flex-col gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Main Badge Color */}
                      <div className="flex flex-col gap-1.5 bg-stone-50 dark:bg-stone-800/80 p-2.5 rounded-lg border border-stone-200 dark:border-stone-700 shadow-2xs">
                        <span className="text-[11px] text-stone-600 dark:text-stone-300 font-bold uppercase tracking-wider flex items-center justify-between">
                          <span>{t.mainBadgeColorLabel}</span>
                          <span className="text-[10px] font-mono lowercase text-amber-600 dark:text-amber-400">{t.clickOrPipetteHint}</span>
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {ICON_BG_PRESETS.map(preset => (
                            <button
                              key={preset.value}
                              type="button"
                              onClick={() => setNewTypeColor(preset.value)}
                              className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center shrink-0 cursor-pointer hover:scale-110 active:scale-95 ${
                                newTypeColor === preset.value
                                  ? 'border-amber-600 scale-105 shadow-xs ring-2 ring-amber-500/30'
                                  : 'border-stone-200 dark:border-stone-600'
                              }`}
                              style={{ backgroundColor: preset.value }}
                              title={preset.name}
                            >
                              {newTypeColor === preset.value && (
                                <Icons.Check size={12} className="text-white drop-shadow-xs font-bold" />
                              )}
                            </button>
                          ))}
                          <div className="flex items-center gap-1 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-full px-2 py-0.5 shrink-0">
                            <div className="relative flex items-center shrink-0 w-4 h-4">
                              <input
                                type="color"
                                value={newTypeColor}
                                onChange={(e) => setNewTypeColor(e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                title={t.customColorTitle}
                              />
                              <div className="w-4 h-4 rounded-full border border-stone-300 dark:border-stone-600 flex items-center justify-center bg-white dark:bg-stone-800 pointer-events-none">
                                <Icons.Pipette size={10} className="text-stone-500 dark:text-stone-400" />
                              </div>
                            </div>
                            <input
                              type="text"
                              value={newTypeColor.toUpperCase()}
                              onChange={(e) => {
                                let val = e.target.value;
                                if (!val.startsWith('#') && /^[0-9a-fA-F]{1,6}$/.test(val)) val = '#' + val;
                                setNewTypeColor(val);
                              }}
                              className="text-[10px] font-mono text-stone-700 dark:text-stone-200 font-bold bg-transparent w-[55px] focus:outline-none uppercase border-none p-0"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Secondary Badge Color */}
                      <div className="flex flex-col gap-1.5 bg-stone-50 dark:bg-stone-800/80 p-2.5 rounded-lg border border-stone-200 dark:border-stone-700 shadow-2xs">
                        <span className="text-[11px] text-stone-600 dark:text-stone-300 font-bold uppercase tracking-wider flex items-center justify-between">
                          <span>{t.secondaryBadgeColorLabel}</span>
                          <span className="text-[10px] font-mono lowercase text-amber-600 dark:text-amber-400">{t.clickOrPipetteHint}</span>
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {ICON_BG_PRESETS.map(preset => (
                            <button
                              key={preset.value}
                              type="button"
                              onClick={() => setNewTypeSubColor(preset.value)}
                              className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center shrink-0 cursor-pointer hover:scale-110 active:scale-95 ${
                                newTypeSubColor === preset.value
                                  ? 'border-amber-600 scale-105 shadow-xs ring-2 ring-amber-500/30'
                                  : 'border-stone-200 dark:border-stone-600'
                              }`}
                              style={{ backgroundColor: preset.value }}
                              title={preset.name}
                            >
                              {newTypeSubColor === preset.value && (
                                <Icons.Check size={12} className="text-white drop-shadow-xs font-bold" />
                              )}
                            </button>
                          ))}
                          <div className="flex items-center gap-1 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-full px-2 py-0.5 shrink-0">
                            <div className="relative flex items-center shrink-0 w-4 h-4">
                              <input
                                type="color"
                                value={newTypeSubColor}
                                onChange={(e) => setNewTypeSubColor(e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                title={t.customColorTitle}
                              />
                              <div className="w-4 h-4 rounded-full border border-stone-300 dark:border-stone-600 flex items-center justify-center bg-white dark:bg-stone-800 pointer-events-none">
                                <Icons.Pipette size={10} className="text-stone-500 dark:text-stone-400" />
                              </div>
                            </div>
                            <input
                              type="text"
                              value={newTypeSubColor.toUpperCase()}
                              onChange={(e) => {
                                let val = e.target.value;
                                if (!val.startsWith('#') && /^[0-9a-fA-F]{1,6}$/.test(val)) val = '#' + val;
                                setNewTypeSubColor(val);
                              }}
                              className="text-[10px] font-mono text-stone-700 dark:text-stone-200 font-bold bg-transparent w-[55px] focus:outline-none uppercase border-none p-0"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Category tabs */}
              <div className="flex flex-wrap gap-1 border-b border-stone-200 dark:border-stone-750 pb-2 shrink-0">
                {ICON_CATEGORIES.map(cat => {
                  const count = cat.id === 'all' 
                    ? AVAILABLE_ICONS.length + userCustomIcons.length
                    : cat.id === 'fav'
                    ? favoriteIcons.length
                    : cat.id === 'custom'
                    ? userCustomIcons.length
                    : AVAILABLE_ICONS.filter(icon => getIconCategory(icon) === cat.id).length;
                  
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setTypeIconCategoryTab(cat.id)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                        typeIconCategoryTab === cat.id
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                      }`}
                    >
                      {getIconCategoryLabel(cat.id, t)} {count > 0 && <span className="opacity-75 text-[9px] ml-0.5">({count})</span>}
                    </button>
                  );
                })}
              </div>

              {/* Scrollable Icon List */}
              <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-3">
                {/* Custom Icons category tab view */}
              {typeIconCategoryTab === 'custom' && (
                userCustomIcons.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50/50 dark:bg-stone-850/50 gap-2">
                    <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-sm">
                      <Icons.UploadCloud size={20} />
                    </div>
                    <div className="flex flex-col gap-0.5 max-w-xs">
                      <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                        {t.noCustomIconsYet}
                      </span>
                      <span className="text-[10px] text-stone-400 dark:text-stone-500">
                        {t.noCustomIconsYetSub}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadCustomIconModalOpen(true)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Icons.Upload size={13} />
                      <span>{t.uploadCustomIconBtn}</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-[350px] overflow-y-auto p-1.5 border border-stone-100 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-850">
                    {userCustomIcons.map(icon => {
                      const isSelected = newTypeIcon === icon.dataUrl || newTypeIcon === icon.id || newTypeIcon === icon.svgContent;
                      return (
                        <div key={icon.id} className="relative group">
                          <button
                            type="button"
                            onClick={() => {
                              setNewTypeIcon(icon.svgContent || icon.dataUrl || icon.id);
                              setTypeIconPickerOpen(false);
                            }}
                            className={`w-full p-2 rounded-lg border transition-all flex items-center justify-center cursor-pointer bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 active:scale-95 ${
                              isSelected
                                ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 shadow-sm ring-1 ring-amber-500/15'
                                : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                            }`}
                            title={icon.name}
                          >
                            <div 
                              className="w-8 h-8 rounded-md flex items-center justify-center text-white shrink-0 shadow-inner overflow-hidden"
                              style={{ backgroundColor: newTypeColor }}
                            >
                              <CardIcon name={icon.svgContent || icon.dataUrl || icon.id} size={16} style={{ color: '#ffffff' }} />
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )
              )}



              {/* Grid of preset icons */}
              {typeIconCategoryTab !== 'custom' && typeIconCategoryTab !== 'vitruvium' && (() => {
                const filteredIcons = AVAILABLE_ICONS.filter(iconName => {
                  if (typeIconCategoryTab === 'all') return true;
                  if (typeIconCategoryTab === 'fav') return favoriteIcons.includes(iconName);
                  return getIconCategory(iconName) === typeIconCategoryTab;
                });

                return (
                  <div className="flex flex-col gap-3">
                    {/* If in 'all' and user has custom icons, show custom icons section first */}
                    {typeIconCategoryTab === 'all' && userCustomIcons.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                          <span>{t.iconCatCustom} ({userCustomIcons.length})</span>
                          <button
                            type="button"
                            onClick={() => setUploadCustomIconModalOpen(true)}
                            className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                          >
                            <Icons.Plus size={12} />
                            <span>{t.uploadCustomIconBtn}</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 p-1.5 border border-stone-100 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-850">
                          {userCustomIcons.map(icon => {
                            const isSelected = newTypeIcon === icon.dataUrl || newTypeIcon === icon.id || newTypeIcon === icon.svgContent;
                            return (
                              <button
                                key={icon.id}
                                type="button"
                                onClick={() => {
                                  setNewTypeIcon(icon.svgContent || icon.dataUrl || icon.id);
                                  setTypeIconPickerOpen(false);
                                }}
                                className={`w-full p-2 rounded-lg border transition-all flex items-center justify-center cursor-pointer bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 active:scale-95 ${
                                  isSelected
                                    ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 shadow-sm ring-1 ring-amber-500/15'
                                    : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                                }`}
                                title={icon.name}
                              >
                                <div 
                                  className="w-8 h-8 rounded-md flex items-center justify-center text-white shrink-0 shadow-inner overflow-hidden"
                                  style={{ backgroundColor: newTypeColor }}
                                >
                                  <CardIcon name={icon.svgContent || icon.dataUrl || icon.id} size={16} style={{ color: '#ffffff' }} />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {filteredIcons.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50/50 dark:bg-stone-850/50">
                        <Icons.Star className="text-amber-400 mb-1 animate-bounce" size={24} fill="currentColor" />
                        <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                          {typeIconCategoryTab === 'fav' 
                            ? t.noFavIconsYetShort 
                            : t.noIconsInCategory}
                        </span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-[350px] overflow-y-auto p-1.5 border border-stone-100 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-850">
                        {filteredIcons.map(iconName => {
                          const isSelected = newTypeIcon === iconName;
                          const isFav = favoriteIcons.includes(iconName);
                          return (
                            <div key={iconName} className="relative group">
                              <button
                                type="button"
                                onClick={() => {
                                  setNewTypeIcon(iconName);
                                  setTypeIconPickerOpen(false);
                                }}
                                className={`w-full p-2 rounded-lg border transition-all flex items-center justify-center cursor-pointer bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 active:scale-95 ${
                                  isSelected
                                    ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 shadow-sm ring-1 ring-amber-500/15'
                                    : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                                }`}
                                title={iconName}
                              >
                                <div 
                                  className="w-8 h-8 rounded-md flex items-center justify-center text-white shrink-0 shadow-inner"
                                  style={{ backgroundColor: newTypeColor }}
                                >
                                  <CardIcon name={iconName} size={14} style={{ color: '#ffffff' }} />
                                </div>
                              </button>
                              
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavoriteIcon(iconName);
                                }}
                                className={`absolute -top-1 -right-1 p-0.5 rounded-full bg-white dark:bg-stone-800 shadow-md border border-stone-200 dark:border-stone-700 transition-all cursor-pointer z-10 ${
                                  isFav 
                                    ? 'text-amber-500 scale-100 opacity-100' 
                                    : 'text-stone-300 dark:text-stone-600 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:text-amber-500 hover:scale-110'
                                }`}
                                title={isFav ? t.removeFromFavTitle : t.addToFavTitle}
                              >
                                <Icons.Star size={8} fill={isFav ? "currentColor" : "none"} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-3 border-t border-stone-200 dark:border-stone-800 flex justify-end bg-stone-50 dark:bg-stone-850 shrink-0">
              <button
                type="button"
                onClick={() => setTypeIconPickerOpen(false)}
                className="px-4 py-1.5 bg-stone-800 dark:bg-stone-700 hover:bg-stone-900 dark:hover:bg-stone-600 text-white font-semibold text-xs rounded transition-colors cursor-pointer"
              >
                {t.closeBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Сохранение текущих цветов как пресет */}
      {isSaveColorPresetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-xl shadow-2xl max-w-md w-full border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-850">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 flex items-center justify-center">
                  <Icons.BookmarkPlus size={18} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-sm">{t.saveColorPresetTitle}</h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">{t.saveColorPresetSubtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveColorPresetModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <Icons.X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col gap-4 bg-white dark:bg-stone-900">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">{t.presetNameLabel}</label>
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveCurrentAsPreset();
                    }
                  }}
                  autoFocus
                  placeholder={t.presetNameInputPlaceholder}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-sm text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
              </div>

              {/* Color preview of elements */}
              {selectedCard && (
                <div className="flex flex-col gap-2 bg-stone-50 dark:bg-stone-850 p-3 rounded-lg border border-stone-200/80 dark:border-stone-750">
                  <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">{t.presetColorsPreviewLabel}</span>
                  <div className="grid grid-cols-3 gap-2">
                    {COLOR_ELEMENT_DEFINITIONS.map(elem => {
                      const colorVal = (selectedCard as any)[elem.key] || (elem.key.includes('Title') || elem.key.includes('Subtitle') ? '#ffffff' : (elem.key.includes('Footer') ? '#a8a29e' : (elem.key.includes('Text') ? '#1c1917' : (elem.key.includes('Stats') || elem.key.includes('Content') ? '#f5f5f4' : getCardColors(selectedCard).primary))));
                      return (
                        <div key={elem.key} className="flex items-center gap-1.5 bg-white dark:bg-stone-800 p-1.5 rounded border border-stone-200/60 dark:border-stone-700 shadow-xs" title={`${elem.label}: ${colorVal}`}>
                          <div 
                            className="w-4 h-4 rounded-full border border-black/15 shrink-0 shadow-xs"
                            style={{ backgroundColor: colorVal }}
                          />
                          <span className="text-[9px] font-medium text-stone-700 dark:text-stone-300 truncate leading-tight">{elem.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-2 bg-stone-50/50 dark:bg-stone-850">
              <button
                type="button"
                onClick={() => setIsSaveColorPresetModalOpen(false)}
                className="px-3.5 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleSaveCurrentAsPreset}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Icons.Check size={14} />
                <span>{t.savePresetBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Управление сохраненными пресетами (Шестеренка) */}
      {isColorPresetsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-850 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 flex items-center justify-center">
                  <Icons.Palette size={18} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-base">{t.manageColorPresetsTitle}</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{t.manageColorPresetsSubtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsColorPresetsModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <Icons.X size={18} />
              </button>
            </div>

            {/* Body / Preset List */}
            <div className="p-5 overflow-y-auto flex flex-col gap-3 grow bg-white dark:bg-stone-900">
              {colorPresets.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
                  <Icons.Palette size={36} className="text-stone-300 dark:text-stone-600" />
                  <p className="text-sm font-serif text-stone-500 dark:text-stone-400">{t.noSavedPresetsText}</p>
                  <button
                    type="button"
                    onClick={handleResetPresetsToDefault}
                    className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer"
                  >
                    {t.restoreStandardPresetsBtn}
                  </button>
                </div>
              ) : (
                colorPresets.map(preset => {
                  const isEditing = editingPresetId === preset.id;
                  const isApplied = selectedColorPresetId === preset.id;

                  return (
                    <div
                      key={preset.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col gap-2.5 ${
                        isApplied 
                          ? 'border-amber-400 dark:border-amber-500 bg-amber-50/30 dark:bg-amber-950/20 shadow-xs' 
                          : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850 hover:border-stone-300 dark:hover:border-stone-700 shadow-2xs'
                      }`}
                    >
                      {/* Top Row: Name and Actions */}
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        {/* Name (View / Edit) */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 w-full max-w-xs">
                              <input
                                type="text"
                                value={editingPresetName}
                                onChange={(e) => setEditingPresetName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveRenamePreset(preset.id);
                                  if (e.key === 'Escape') setEditingPresetId(null);
                                }}
                                autoFocus
                                className="px-2 py-1 bg-white dark:bg-stone-800 border border-amber-400 rounded text-xs font-bold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500 flex-1"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveRenamePreset(preset.id)}
                                className="p-1 rounded bg-amber-600 hover:bg-amber-500 text-stone-950 cursor-pointer"
                                title={t.saveNameTitle}
                              >
                                <Icons.Check size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingPresetId(null)}
                                className="p-1 rounded bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 cursor-pointer"
                                title={t.cancel}
                              >
                                <Icons.X size={13} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 truncate">{preset.name}</span>
                              {isApplied && (
                                <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-700">
                                  {t.selectedPresetBadge}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action buttons on the right */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleApplyColorPreset(preset)}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                            title={t.applyPresetTitle}
                          >
                            <Icons.Sparkles size={12} />
                            <span>{t.applyPresetBtn}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStartRenamePreset(preset)}
                            className="px-2 py-1 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-semibold text-xs rounded border border-stone-200/80 dark:border-stone-700 transition-colors flex items-center gap-1 cursor-pointer"
                            title={t.renamePresetTitle}
                          >
                            <Icons.Edit2 size={12} />
                            <span>{t.renamePresetBtn}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeletePreset(preset.id)}
                            className="px-2 py-1 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-semibold text-xs rounded border border-red-200/80 dark:border-red-800 transition-colors flex items-center gap-1 cursor-pointer"
                            title={t.deletePresetTitle}
                          >
                            <Icons.Trash2 size={12} />
                            <span>{t.deletePresetBtn}</span>
                          </button>
                        </div>
                      </div>

                      {/* Bottom Row: Color Circles with Interactive Color Pickers */}
                      <div className="flex items-center gap-2.5 pt-2 border-t border-stone-100 dark:border-stone-800 overflow-x-auto pb-0.5">
                        {COLOR_ELEMENT_DEFINITIONS.map(elem => {
                          const currentColor = preset.colors[elem.key] || elem.defaultFallback;
                          return (
                            <label
                              key={elem.key}
                              className="group relative flex flex-col items-center gap-1 cursor-pointer select-none shrink-0"
                              title={`${elem.label}: ${currentColor} ${t.clickToChangeColorHint}`}
                            >
                              <div className="relative">
                                <div
                                  className="w-7 h-7 rounded-full border-2 border-white dark:border-stone-700 shadow-md group-hover:scale-110 group-hover:ring-2 group-hover:ring-amber-500/50 transition-all flex items-center justify-center overflow-hidden"
                                  style={{ backgroundColor: currentColor }}
                                >
                                  <input
                                    type="color"
                                    value={currentColor}
                                    onChange={(e) => handleUpdatePresetColor(preset.id, elem.key, e.target.value)}
                                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                  />
                                </div>
                              </div>
                              <span className="text-[8.5px] font-medium text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-200 truncate max-w-[60px] text-center leading-tight transition-colors">
                                {elem.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-850 shrink-0">
              <button
                type="button"
                onClick={handleResetPresetsToDefault}
                className="text-xs font-semibold text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Icons.RotateCcw size={13} />
                <span>{t.resetPresetsToDefaultBtn}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsColorPresetsModalOpen(false)}
                className="px-4 py-1.5 bg-stone-800 dark:bg-stone-700 hover:bg-stone-900 dark:hover:bg-stone-600 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                {t.closeBtn}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Full-screen blur backdrop overlay for PNG exporting */}
      {exportProgress.active && (
        <div className="fixed inset-0 z-[100] bg-stone-950/70 backdrop-blur-md flex flex-col items-center justify-center p-6 no-print">
          <div className="bg-stone-900 border border-stone-800 p-8 rounded-2xl shadow-2xl max-w-md w-full flex flex-col gap-6 text-center select-none">
            <div className="flex flex-col gap-2">
              <h3 className="font-serif font-black text-2xl text-amber-500 flex items-center justify-center gap-2">
                {exportProgress.isSingleCard ? (
                  <>
                    <Icons.Wand2 className="animate-bounce text-amber-500" size={24} />
                    <span>{t.exportSingleCardHeading}</span>
                  </>
                ) : (
                  <>
                    <Icons.FolderDown className="animate-bounce text-amber-500" size={28} />
                    <span>{t.exportDeckHeading}</span>
                  </>
                )}
              </h3>
              <p className="text-xs text-stone-400">
                {exportProgress.isSingleCard ? (
                  <span>{t.exportSingleCardSubtext}</span>
                ) : (
                  <span>{t.exportDeckSubtext}</span>
                )}
              </p>
            </div>

            {/* Progress Bar Container */}
            <div className="w-full flex flex-col gap-2">
              <div className="w-full bg-stone-950 rounded-full h-4 border border-stone-800 overflow-hidden relative">
                <motion.div 
                  className="bg-gradient-to-r from-amber-600 to-amber-500 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${exportProgress.progress}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-stone-400 font-bold px-1">
                <span>{t.readinessLabel}</span>
                <span className="text-amber-500">{exportProgress.progress}%</span>
              </div>
            </div>

            {/* Step description */}
            <div className="bg-stone-950/60 border border-stone-850 p-4 rounded-xl min-h-[72px] flex items-center justify-center">
              <span className="text-sm font-serif italic text-stone-200 text-center leading-relaxed">
                {exportProgress.stepText}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Offscreen high-fidelity card container for PNG captures */}
      <div id="png-export-container" className="fixed top-[-9999px] left-[-9999px] flex flex-col gap-10" style={{ pointerEvents: 'none' }}>
        {cards.flatMap((card, cardIdx) => {
          const pages = getCardPages(card, rarities);
          const colors = getCardColors(card);
          const rarityStyle = getRarityStyles(card.rarity);
          return pages.map((pageContent, pageIdx) => ({
            card,
            cardIdx,
            pageContent,
            pageIdx,
            totalPages: pages.length,
            colors,
            rarityStyle
          }));
        }).map(({ card, cardIdx, pageContent, pageIdx, totalPages, colors, rarityStyle }) => (
          <div
            key={`export-card-key-${cardIdx}-${pageIdx}`}
            id={`export-card-${cardIdx}-${pageIdx}`}
            className={`bg-white border-2 flex flex-col overflow-hidden relative card-print-wrapper ${rarityStyle.border}`}
            style={{ 
              width: `${Math.round(((card.width || 63) * 96) / 25.4)}px`,
              height: `${Math.round(((card.height || 88) * 96) / 25.4)}px`,
              boxSizing: 'border-box',
              borderColor: rarityStyle.customBorderColor || undefined,
              boxShadow: rarityStyle.customGlowStyle || undefined,
              borderRadius: card.borderRadius !== undefined ? `${card.borderRadius}px` : '3px',
            }}
          >
            {/* Header */}
            {(!card.hideTitle || card.showIcon !== false) && (
              <div
                className="px-2 py-1 flex items-center justify-between gap-1 border-b border-stone-950 shrink-0 text-white min-h-[32px] h-auto"
                style={{ backgroundColor: colors.primary }}
              >
                {!card.hideTitle && (
                  <h4 
                    className={`font-serif font-black tracking-tight leading-tight grow break-words whitespace-pre-wrap ${
                      card.autoScaleTitle !== false
                        ? `${getTitleFontSize(card.title || 'БЕЗ НАЗВАНИЯ', card.showIcon !== false)}`
                        : 'text-sm'
                    } ${rarityStyle.headingGlow}`} 
                    style={{ 
                      textShadow: '1px 1px 0px rgba(0,0,0,0.8)', 
                      color: card.customTitleColor || '#ffffff',
                      ...rarityStyle.customHeadingGlowStyle
                    }}
                  >
                    {card.title || 'БЕЗ НАЗВАНИЯ'}
                    {totalPages > 1 && <span className="text-[10px] opacity-75 font-mono ml-1">({pageIdx + 1}/{totalPages})</span>}
                  </h4>
                )}
                {card.hideTitle && <div className="grow min-w-0" />}
                {card.showIcon !== false && (
                  <div className="w-5 h-5 rounded bg-black/25 flex items-center justify-center shrink-0 border border-white/20">
                    <CardIcon name={colors.icon} size={11} style={{ color: card.customTitleColor || '#ffffff' }} />
                  </div>
                )}
              </div>
            )}

            {/* Subtitle / Subtype bar */}
            {(!card.hideSubtitle || (card.rarity && card.rarity !== 'none')) && (
              <div
                className="px-2 py-1 font-serif font-bold tracking-wide uppercase border-b border-stone-950 shrink-0 flex justify-between items-center gap-1.5 min-w-0 h-auto min-h-[22px]"
                style={{ backgroundColor: colors.secondary, color: card.customSubtitleColor || 'rgba(255, 255, 255, 0.95)' }}
              >
                <span className={`${getSubtitleFontSize(!card.hideSubtitle ? (card.subtitle || 'Снаряжение / Особенность') : '')} break-words whitespace-pre-wrap leading-tight grow min-w-0`}>
                  {!card.hideSubtitle ? (card.subtitle || 'Снаряжение / Особенность') : ''}
                </span>
                {card.rarity && card.rarity !== 'none' && (() => {
                  const badgeStyle = getRarityBadgeStyle(card);
                  return (
                    <span 
                      className={`text-[8px] px-1 py-0.5 rounded tracking-normal shrink-0 font-bold ${
                        badgeStyle.isSubtitleStyle 
                          ? '' 
                          : 'border border-black/10 shadow-sm'
                      }`} 
                      style={{ 
                        backgroundColor: badgeStyle.bg, 
                        color: badgeStyle.text 
                      }}
                    >
                      {getRarityLabel(card.rarity)}
                    </span>
                  );
                })()}
              </div>
            )}

            {/* Optional Illustration Area: ONLY on first page */}
            {card.artUrl && pageIdx === 0 && !card.artAsDescriptionBg && !card.artAsStatsBg && (
              <div className={`w-full bg-stone-900 relative overflow-hidden shrink-0 ${card.fullIllustration ? 'flex-1' : 'border-b border-stone-950'}`}
                   style={card.fullIllustration ? undefined : { height: `${getIllustrationHeight(card)}px` }}>
                <img
                  src={card.artUrl}
                  alt={card.title}
                  className="absolute max-w-none max-h-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: 'auto',
                    height: 'auto',
                    minWidth: '100%',
                    minHeight: '100%',
                    transform: `translate(-50%, -50%) translate(${(card.illustrationPositionX || 0)}px, ${(card.illustrationPositionY || 0)}px) scale(${(card.illustrationScale || 100) / 100}) rotate(${(card.illustrationRotation || 0)}deg)`,
                    transformOrigin: 'center center',
                  }}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>
            )}

            {/* Stats and Description Area with optional Art Backgrounds */}
            {(() => {
              const artBg = getCardArtBgState(card);
              const showStats = Boolean(card.stats && card.stats.length > 0 && shouldRenderCardStats(card, pageIdx, rarities));
              const showDesc = Boolean(!card.fullIllustration || pageIdx > 0);

              if (!showStats && !showDesc) return null;

              const isFullIll = Boolean(card.fullIllustration && pageIdx === 0);

              return (
                <div className={`${isFullIll ? 'shrink-0' : 'flex-1'} flex flex-col min-h-0 relative overflow-hidden`}>
                  {/* Continuous Background Art across BOTH blocks if both checkboxes are enabled */}
                  {artBg.isBoth && renderCardArtBackground(
                    card,
                    card.descriptionArtOpacity ?? 100,
                    card.descriptionArtBrightness ?? 100
                  )}

                  {/* Optional Custom Stats Table */}
                  {showStats && (
                    <div
                      className="grid grid-cols-2 border-b border-stone-950 shrink-0 divide-x divide-stone-200 relative z-1 overflow-hidden"
                      style={{
                        backgroundColor: (artBg.isBoth || artBg.isStatsOnly)
                          ? 'transparent'
                          : (card.customStatsBgColor || '#f5f5f4'),
                      }}
                    >
                      {/* Individual background if only stats is checked */}
                      {artBg.isStatsOnly && renderCardArtBackground(
                        card,
                        card.statsArtOpacity ?? 100,
                        card.statsArtBrightness ?? 75
                      )}

                      {/* Darkening overlay when both are checked ("просто на блоке характеристик будет чуть темнее") */}
                      {artBg.isBoth && (
                        <div
                          className="absolute inset-0 pointer-events-none z-0"
                          style={{
                            backgroundColor: `rgba(0, 0, 0, ${Math.max(0.15, Math.min(0.75, 1 - (card.statsArtBrightness ?? 75) / 125))})`,
                            opacity: (card.statsArtOpacity ?? 100) / 100,
                            backdropFilter: `brightness(${(card.statsArtBrightness ?? 75) / 100})`,
                            WebkitPrintColorAdjust: 'exact',
                            printColorAdjust: 'exact',
                          }}
                        />
                      )}

                      {card.stats.map((stat) => (
                        <div key={stat.id} className="flex flex-col justify-center px-1.5 py-0.5 leading-none min-w-0 relative z-1">
                          <span
                            className="text-[7px] uppercase font-bold tracking-wider leading-none px-0.5 h-[12px] break-words whitespace-normal inline-flex items-center"
                            style={{
                              color: card.customStatsTextColor || (artBg.isBoth || artBg.isStatsOnly ? '#f5f5f4' : '#78716c'),
                              textShadow: (artBg.isBoth || artBg.isStatsOnly) ? '0 1px 2px rgba(0,0,0,0.8)' : undefined,
                              opacity: card.customStatsTextColor ? 0.8 : 1
                            }}
                            dangerouslySetInnerHTML={{ __html: formatInlineText(stat.label || 'Параметр') }}
                          />
                          <span
                            className={`font-mono font-bold tracking-tight leading-none px-0.5 h-[15px] break-words whitespace-normal inline-flex items-center ${getStatValueFontSize(stat.value || '—')}`}
                            style={{
                              color: card.customStatsTextColor || (artBg.isBoth || artBg.isStatsOnly ? '#ffffff' : '#1c1917'),
                              textShadow: (artBg.isBoth || artBg.isStatsOnly) ? '0 1px 2px rgba(0,0,0,0.8)' : undefined
                            }}
                            dangerouslySetInnerHTML={{ __html: formatInlineText(stat.value || '—') }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Rich Description Block */}
                  {showDesc && (
                    <div
                      className="flex-1 p-2.5 overflow-hidden flex flex-col justify-between relative z-1"
                      style={{
                        backgroundColor: (artBg.isBoth || artBg.isDescOnly)
                          ? 'transparent'
                          : (card.customContentBgColor || 'rgba(250, 250, 249, 0.5)'),
                      }}
                    >
                      {/* Individual background if only description is checked */}
                      {artBg.isDescOnly && renderCardArtBackground(
                        card,
                        card.descriptionArtOpacity ?? 100,
                        card.descriptionArtBrightness ?? 100
                      )}

                      <div
                        className={`leading-relaxed ${getContentAlignClass(card.contentAlign)} ${card.enableTextOverflow ? 'overflow-hidden' : 'overflow-y-auto'} pr-0.5 flex-1 min-h-0 break-words font-body relative z-1 ${getContentFontSize(card.content || '')}`}
                        style={{
                          color: card.customContentColor || '#1c1917',
                          fontSize: card.fontSize !== undefined ? `${card.fontSize}px` : '9px',
                          textAlign: card.contentAlign || 'justify'
                        }}
                        dangerouslySetInnerHTML={{
                          __html: pageContent || '<i>Описание отсутствует...</i>',
                        }}
                      />

                      {/* Dynamic Footer Section */}
                      <div className="relative z-1">
                        {renderCardFooter(card)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ))}
        {/* Card Back for PNG Capture */}
        {cardBackEnabled && (selectedCard || cards[0]) && (
          <div
            id="export-cardback"
            className="bg-stone-900 border-2 border-stone-950 flex flex-col overflow-hidden relative select-none card-print-wrapper"
            style={{
              width: `${Math.round((((selectedCard || cards[0])?.width || 63) * 96) / 25.4)}px`,
              height: `${Math.round((((selectedCard || cards[0])?.height || 88) * 96) / 25.4)}px`,
              boxSizing: 'border-box',
              borderRadius: (selectedCard || cards[0])?.borderRadius !== undefined ? `${(selectedCard || cards[0])?.borderRadius}px` : '3px',
            }}
          >
            {renderCardBackContent(selectedCard || cards[0], 0, true)}
          </div>
        )}
        {/* Individual Card Backs for PNG Capture */}
        {cardBackEnabled && cards.map((card, cardIdx) => (
          <div
            key={`export-cardback-key-${cardIdx}`}
            id={`export-cardback-${cardIdx}`}
            className="bg-stone-900 border-2 border-stone-950 flex flex-col overflow-hidden relative select-none card-print-wrapper"
            style={{
              width: `${Math.round(((card.width || 63) * 96) / 25.4)}px`,
              height: `${Math.round(((card.height || 88) * 96) / 25.4)}px`,
              boxSizing: 'border-box',
              borderRadius: card.borderRadius !== undefined ? `${card.borderRadius}px` : '3px',
            }}
          >
            {renderCardBackContent(card)}
          </div>
        ))}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden animate-none"
      />
      <input
        type="file"
        ref={bgImageInputRef}
        onChange={handleBgImageChange}
        accept="image/*"
        multiple
        className="hidden animate-none"
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-stone-900 text-stone-100 rounded-lg shadow-xl border border-stone-850 text-xs font-mono font-semibold select-none"
          >
            {toast.type === 'success' && <Icons.CheckCircle2 className="text-emerald-500 shrink-0" size={16} />}
            {toast.type === 'error' && <Icons.AlertOctagon className="text-red-500 shrink-0" size={16} />}
            {toast.type === 'info' && <Icons.Info className="text-stone-400 shrink-0" size={16} />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Google Drive Auth Modal */}
      <GoogleDriveAuthModal
        isOpen={isDriveAuthModalOpen}
        onClose={() => setIsDriveAuthModalOpen(false)}
        onSuccess={handleDriveAuthSuccess}
        language={appSettings.language}
      />

      {/* Google Drive Decks Modal */}
      {driveAccessToken && driveUserProfile && (
        <GoogleDriveDecksModal
          isOpen={isDriveDecksModalOpen}
          onClose={() => setIsDriveDecksModalOpen(false)}
          accessToken={driveAccessToken}
          user={driveUserProfile}
          onSignOut={handleDriveSignOut}
          onReAuth={handleDriveAuthSuccess}
          onConfigureAuth={() => {
            setIsDriveDecksModalOpen(false);
            setIsDriveAuthModalOpen(true);
          }}
          currentCards={cards}
          currentCardTypes={cardTypes}
          currentRarities={rarities}
          currentCardBackEnabled={cardBackEnabled}
          currentCardBackUrl={cardBackUrl}
          currentCardBackScale={cardBackScale}
          currentCardBackPositionX={cardBackPositionX}
          currentCardBackPositionY={cardBackPositionY}
          currentCardBackRotation={cardBackRotation}
          currentDeckDriveId={currentDeckDriveId}
          currentDeckTitle={currentDeckTitle}
          onLoadDeckToEditor={handleLoadDeckToEditor}
          showToast={showToast}
          language={appSettings.language}
        />
      )}

      {/* App Settings Modal */}
      <AppSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={appSettings}
        onUpdateSettings={updateAppSettings}
        onResetData={handleReset}
      />

      {/* Upload Custom Icon Modal */}
      <UploadCustomIconModal
        isOpen={uploadCustomIconModalOpen}
        onClose={() => setUploadCustomIconModalOpen(false)}
        onUploadIcons={(newIcons) => {
          const updated = [...userCustomIcons, ...newIcons];
          saveUserCustomIcons(updated);
          setIconCategoryTab('custom');
          showToast(
            appSettings.language === 'en'
              ? `Added ${newIcons.length} custom icon(s)!`
              : `Добавлено пользовательских иконок: ${newIcons.length}!`
          );
          if (newIcons.length === 1 && selectedCard) {
            handleUpdateCardField('customIcon', newIcons[0].dataUrl);
          }
        }}
        language={appSettings.language}
        onError={(msg) => requestAlert('custom_error', undefined, msg)}
      />

      {/* Delete Custom Icon Confirmation Modal */}
      <DeleteCustomIconConfirmModal
        isOpen={!!deleteCustomIconTarget}
        onClose={() => setDeleteCustomIconTarget(null)}
        icon={deleteCustomIconTarget}
        onConfirm={() => {
          if (!deleteCustomIconTarget) return;
          const targetId = deleteCustomIconTarget.id;
          const targetUrl = deleteCustomIconTarget.dataUrl;
          const updated = userCustomIcons.filter(icon => icon.id !== targetId);
          saveUserCustomIcons(updated);
          if (selectedCard && (selectedCard.customIcon === targetUrl || selectedCard.customIcon === targetId)) {
            handleUpdateCardField('customIcon', undefined);
          }
          showToast(
            appSettings.language === 'en'
              ? 'Icon removed from custom library'
              : 'Иконка удалена из библиотеки'
          );
        }}
        language={appSettings.language}
      />
    </div>
  );
}
