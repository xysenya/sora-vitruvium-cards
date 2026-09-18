import { TypeDefinition, Card, RarityDefinition, ColorPreset, PresetColors } from './types';

export const COLOR_ELEMENT_DEFINITIONS: { key: keyof PresetColors; label: string; shortLabel: string; defaultFallback: string }[] = [
  { key: 'customColor', label: 'Фон заголовка', shortLabel: 'Фон заголовок', defaultFallback: '#292524' },
  { key: 'customTitleColor', label: 'Текст заголовка', shortLabel: 'Текст заголовок', defaultFallback: '#ffffff' },
  { key: 'customSubColor', label: 'Фон подзаголовка', shortLabel: 'Фон подзаголовок', defaultFallback: '#44403c' },
  { key: 'customSubtitleColor', label: 'Текст подзаголовка', shortLabel: 'Текст подзаголовок', defaultFallback: '#ffffff' },
  { key: 'customStatsBgColor', label: 'Фон характеристик', shortLabel: 'Фон статы', defaultFallback: '#f5f5f4' },
  { key: 'customStatsTextColor', label: 'Текст характеристик', shortLabel: 'Текст статы', defaultFallback: '#1c1917' },
  { key: 'customContentBgColor', label: 'Фон описания', shortLabel: 'Фон описание', defaultFallback: '#fafaf9' },
  { key: 'customContentColor', label: 'Текст описания', shortLabel: 'Текст описание', defaultFallback: '#1c1917' },
];

export const DEFAULT_COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'vitruvius',
    name: 'Витрувий (Классика)',
    colors: {
      customColor: '#000000',
      customTitleColor: '#e6e6e6',
      customSubColor: '#2a2a2a',
      customSubtitleColor: '#cacaca',
      customStatsBgColor: '#f3e2cc',
      customStatsTextColor: '#000000',
      customContentBgColor: '#fef1e0',
      customContentColor: '#000000',
    },
  },
  {
    id: 'dark-parchment',
    name: 'Тёмный пергамент',
    colors: {
      customColor: '#1c1917',
      customTitleColor: '#fbbf24',
      customSubColor: '#292524',
      customSubtitleColor: '#e7e5e4',
      customStatsBgColor: '#44403c',
      customStatsTextColor: '#f5f5f4',
      customContentBgColor: '#292524',
      customContentColor: '#e7e5e4',
    },
  },
  {
    id: 'emerald-archive',
    name: 'Изумрудный архив',
    colors: {
      customColor: '#064e3b',
      customTitleColor: '#ecfdf5',
      customSubColor: '#065f46',
      customSubtitleColor: '#a7f3d0',
      customStatsBgColor: '#d1fae5',
      customStatsTextColor: '#064e3b',
      customContentBgColor: '#f0fdf4',
      customContentColor: '#064e3b',
    },
  },
  {
    id: 'crimson-tome',
    name: 'Багровый гримуар',
    colors: {
      customColor: '#7f1d1d',
      customTitleColor: '#fef2f2',
      customSubColor: '#991b1b',
      customSubtitleColor: '#fecaca',
      customStatsBgColor: '#fee2e2',
      customStatsTextColor: '#7f1d1d',
      customContentBgColor: '#fff1f2',
      customContentColor: '#4c0519',
    },
  },
  {
    id: 'royal-sapphire',
    name: 'Королевский сапфир',
    colors: {
      customColor: '#0f172a',
      customTitleColor: '#38bdf8',
      customSubColor: '#1e293b',
      customSubtitleColor: '#bae6fd',
      customStatsBgColor: '#e0f2fe',
      customStatsTextColor: '#0c4a6e',
      customContentBgColor: '#f0f9ff',
      customContentColor: '#082f49',
    },
  },
];

export const DEFAULT_RARITIES: RarityDefinition[] = [
  { id: 'common', name: 'Обычный', stylePreset: 'common' },
  { id: 'uncommon', name: 'Необычный', stylePreset: 'uncommon' },
  { id: 'rare', name: 'Редкий', stylePreset: 'rare' },
  { id: 'epic', name: 'Эпический', stylePreset: 'epic' },
  { id: 'legendary', name: 'Легендарный', stylePreset: 'legendary' },
];

export const CARD_TYPES: TypeDefinition[] = [
  {
    id: 'ability',
    name: 'Заклинание / способность',
    icon: 'Flame',
    color: '#7c2d12', // orange-900
    subColor: '#9a3412', // orange-800
  },
  {
    id: 'weapon',
    name: 'Оружие / Инструмент',
    icon: 'Sword',
    color: '#7f1d1d', // red-900
    subColor: '#991b1b', // red-800
  },
  {
    id: 'armor',
    name: 'Доспех / Защита',
    icon: 'Shield',
    color: '#0c4a6e', // sky-900
    subColor: '#075985', // sky-800
  },
  {
    id: 'item',
    name: 'Предмет',
    icon: 'Package',
    color: '#292524', // stone-800
    subColor: '#44403c', // stone-700
  },
  {
    id: 'potion',
    name: 'Зелье / Снадобье',
    icon: 'FlaskConical',
    color: '#9d174d', // pink-800
    subColor: '#be185d', // pink-700
  },
  {
    id: 'effect',
    name: 'Эффект / Состояние',
    icon: 'Zap',
    color: '#581c87', // purple-900
    subColor: '#6b21a8', // purple-800
  },
  {
    id: 'trait',
    name: 'Черта / Особенность',
    icon: 'Scroll',
    color: '#064e3b', // emerald-900
    subColor: '#065f46', // emerald-800
  },
  {
    id: 'loot',
    name: 'Награда / Сокровище',
    icon: 'Gem',
    color: '#115e59', // teal-800
    subColor: '#0f766e', // teal-700
  },
  {
    id: 'enemy',
    name: 'Враг / Персонаж',
    icon: 'Skull',
    color: '#18181b', // zinc-900
    subColor: '#27272a', // zinc-800
  },
  {
    id: 'note',
    name: 'Сюжетная заметка',
    icon: 'BookOpen',
    color: '#1e3a8a', // blue-900
    subColor: '#1e40af', // blue-800
  }
];

export const STARTER_CARDS: Card[] = [
  {
    id: '1',
    typeId: 'ability',
    title: 'Огненный Шар (Fireball)',
    subtitle: 'Заклинание • Школа Разрушения',
    content: 'Вы создаете стремительно расширяющуюся сферу пламени. Каждый противник в радиусе 6 метров должен совершить спасбросок Ловкости. При провале они получают полный урон огнем, при успехе — половину.',
    rarity: 'epic',
    enableTextOverflow: true,
    artUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=max&q=80',
    stats: [
      { id: '1-1', label: 'Расход', value: '30 Маны' },
      { id: '1-2', label: 'Урон', value: '8d6 Огнем' },
      { id: '1-3', label: 'Дистанция', value: '45 метров' },
      { id: '1-4', label: 'Время', value: '1 действие' }
    ]
  },
  {
    id: '2',
    typeId: 'weapon',
    title: 'Двуручный Меч Рыцаря',
    subtitle: 'Тяжелое клинковое оружие',
    content: 'Выкованный из закаленной стали полуторный меч с гравировкой ордена. Требует обеих рук для эффективного замаха. Наносит повышенный урон по одоспешенным целям.',
    rarity: 'common',
    enableTextOverflow: true,
    artUrl: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=800&auto=format&fit=max&q=80',
    stats: [
      { id: '2-1', label: 'Урон', value: '2d6 рубящий' },
      { id: '2-2', label: 'Вес', value: '3 кг' },
      { id: '2-3', label: 'Свойство', value: 'Двуручное' }
    ]
  },
  {
    id: '3',
    typeId: 'weapon',
    title: 'Эльфийский Лук Ветра',
    subtitle: 'Магическое стрелковое оружие',
    content: 'Сверхлегкий лук, благословленный духами воздуха. Выпущенные из него стрелы летят абсолютно бесшумно и игнорируют штрафы от сильного ветра.',
    rarity: 'rare',
    enableTextOverflow: true,
    artUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&auto=format&fit=max&q=80',
    stats: [
      { id: '3-1', label: 'Урон', value: '1d8 + Ловкость' },
      { id: '3-2', label: 'Дальность', value: '45/180 метров' },
      { id: '3-3', label: 'Свойство', value: 'Бесшумное' }
    ]
  },
  {
    id: '4',
    typeId: 'potion',
    title: 'Зелье Лечения',
    subtitle: 'Целебный алхимический состав',
    content: 'Густая мерцающая красная жидкость в круглой колбе. При употреблении мгновенно затягивает неглубокие раны и восстанавливает здоровье.',
    rarity: 'common',
    enableTextOverflow: true,
    artUrl: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=800&auto=format&fit=max&q=80',
    stats: [
      { id: '4-1', label: 'Эффект', value: 'Восст. 2d4 + 2 ОЗ' },
      { id: '4-2', label: 'Время', value: 'Бонусное действие' },
      { id: '4-3', label: 'Вес', value: '0.2 кг' }
    ]
  },
  {
    id: '5',
    typeId: 'trait',
    title: 'Кольцо Защиты',
    subtitle: 'Черта • Волшебный аксессуар',
    content: 'Пока вы носите это изящное золотое кольцо, вокруг вас мерцает слабое защитное поле. Вы получаете бонус к классу брони и ко всем спасброскам.',
    rarity: 'uncommon',
    enableTextOverflow: true,
    artUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&auto=format&fit=max&q=80',
    stats: [
      { id: '5-1', label: 'Защита', value: '+1 к КБ' },
      { id: '5-2', label: 'Спасброски', value: '+1 ко всем' }
    ]
  }
];
