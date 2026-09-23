export type CardType = string;

export interface CardStat {
  id: string;
  label: string; // e.g. "Урон", "Дистанция", "Мана", "Длительность"
  value: string; // e.g. "2d6 + 4", "15 метров", "3 единицы", "1 раунд"
}

export type CardRarity = 'none' | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Card {
  id: string;
  typeId: CardType;
  title: string;
  subtitle: string;
  content: string; // HTML or Markdown formatted text for description
  stats: CardStat[];
  customColor?: string; // Header background
  customTitleColor?: string; // Header text color
  customSubColor?: string; // Subtitle background
  customSubtitleColor?: string; // Subtitle text color
  customStatsBgColor?: string; // Stats background
  customStatsTextColor?: string; // Stats text color
  customContentBgColor?: string; // Description/content background
  customContentColor?: string; // Description/content text color
  customIcon?: string; // Overrides the default icon for the CardType
  rarity?: CardRarity;
  artUrl?: string; // Optional image link for card illustration
  fullIllustration?: boolean; // When true, illustration stretches across the whole card
  artAsDescriptionBg?: boolean; // Use illustration as description background
  artAsStatsBg?: boolean; // Use illustration as stats background
  descriptionArtOpacity?: number; // Opacity percentage for description art background (0-100, default 100)
  descriptionArtBrightness?: number; // Brightness percentage for description art background (10-200, default 100)
  statsArtOpacity?: number; // Opacity percentage for stats art background (0-100, default 100)
  statsArtBrightness?: number; // Brightness percentage for stats art background (10-200, default 75)
  illustrationHeight?: number; // Height of the illustration block in px (default 112)
  illustrationScale?: number; // Zoom percentage
  illustrationPositionX?: number; // X offset percentage
  illustrationPositionY?: number; // Y offset percentage
  illustrationRotation?: number; // Rotation in degrees
  footerText?: string; // Custom footer text (defaults to "SORA • CARDS")
  customFooterTextColor?: string; // Custom color for footer text
  hideFooter?: boolean; // Completely hide the footer element
  footerTextLeft?: string; // Left footer text
  footerTextMiddle?: string; // Middle footer text
  footerTextRight?: string; // Right footer text
  hideFooterLeft?: boolean; // Hide Left footer text
  hideFooterMiddle?: boolean; // Hide Middle footer text
  hideFooterRight?: boolean; // Hide Right footer text
  customFooterLeftColor?: string; // Custom color for left footer text
  customFooterMiddleColor?: string; // Custom color for middle footer text
  customFooterRightColor?: string; // Custom color for right footer text
  hideSubtitle?: boolean; // Toggle subtitle visibility on the card
  hideTitle?: boolean; // Toggle title visibility on the card
  cardNumber?: string; // Custom card number (defaults to ID slice)
  customCardNumberColor?: string; // Custom color for card number/code
  autoScaleTitle?: boolean; // Auto scale down and wrap title if it's too long
  hideFromPrint?: boolean; // Hide card from print layout
  enableTextOverflow?: boolean; // Enable text wrapping/overflow to the next card
  showIcon?: boolean; // Conditionally show/hide the header icon
  matchGlowColor?: boolean; // If true, badge color matches glow color. If false, badge color uses customRarityBadgeColor
  customRarityBadgeColor?: string; // Custom badge background color
  borderRadius?: number; // Corner radius in px
  width?: number; // Width in mm (default 63)
  height?: number; // Height in mm (default 88)
  fontSize?: number; // Font size of description block in px
  contentAlign?: 'left' | 'center' | 'right' | 'justify'; // Text alignment of description block
  shirtMode?: 'none' | 'image' | 'continuation'; // Individual shirt mode
  shirtUrl?: string; // Individual shirt image URL
  shirtScale?: number; // Individual shirt zoom percentage
  shirtPositionX?: number; // Individual shirt X offset in px
  shirtPositionY?: number; // Individual shirt Y offset in px
  shirtRotation?: number; // Individual shirt rotation in degrees
}

export interface TypeDefinition {
  id: CardType;
  name: string;
  icon: string; // Lucide icon name
  color: string; // Hex color for header/accents
  subColor: string; // Hex color for subtitle/accents
}

export interface RarityDefinition {
  id: string; // e.g. 'common', 'uncommon', etc.
  name: string; // e.g. 'Обычный', 'Необычный'
  stylePreset: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'custom';
  customColor?: string; // Custom glow color for 'custom' style preset
  matchGlowColor?: boolean; // If true, badge color matches glow color
  customBadgeColor?: string; // Custom background color for the badge
}

export interface PresetColors {
  customColor?: string;
  customTitleColor?: string;
  customSubColor?: string;
  customSubtitleColor?: string;
  customStatsBgColor?: string;
  customStatsTextColor?: string;
  customContentBgColor?: string;
  customContentColor?: string;
  customFooterTextColor?: string;
}

export interface ColorPreset {
  id: string;
  name: string;
  colors: PresetColors;
}

export interface UserCustomIcon {
  id: string;
  name: string;
  dataUrl: string;
  type?: string;
  createdAt?: number;
  svgContent?: string; // Stored raw SVG markup for vector scaling and dynamic colorization
}
