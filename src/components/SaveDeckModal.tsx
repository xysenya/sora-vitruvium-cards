import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Icons from 'lucide-react';
import { AppLanguage, UI_TRANSLATIONS } from '../i18n';

export const DECK_SAVE_HUMOROUS_MESSAGES_RU = [
  'Вашей колоде необходимо название, чтобы барды могли увековечить её в своих сказаниях!',
  'Даже легендарному мечу нужно имя, а уж великой колоде свитков — тем более!',
  'Совет Лордов Глубоководья отказывается регистрировать безымянные свитки заклинаний!',
  'Каждая карта в этой колоде жаждет гордо носить имя своего великого создателя!',
  'Архимаги Цитадели требуют заглавие для гримуара, прежде чем запечатать его на Google Диске!',
  'Без имени эта колода рискует затеряться в Астральном Плане среди заброшенных руин!',
  'Даже самый скромный гоблин-шаман называет свой тотем! Окрестите же и вы свой шедевр!',
  'Внесите имя в древний реестр, иначе Дракон-Хранитель не пропустит её в подземелье!',
  'Мастер Подземелий прищурил глаз: «У такой мощной колоды просто обязано быть имя!»',
  'Кузнец заклинаний готов выковать имя вашей колоды на золотом окладе гримуара!',
  'Дабы заклятие Забытья не коснулось этих артефактов, нареките колоду собственным титлом!',
  'Страж библиотечных архивов сдвинул кустистые брови: «Как повелишь величать сей фолиант, мастер?»',
  'Летописцы Ордена Магов занесли перья над пергаментом — дайте им имя вашей колоды!',
  'Только нареченные колоды способны пройти сквозь магические врата Хранителей!',
  'Какая легенда начинается со слов «Жила-была безымянная стопка карт»? Дайте ей имя!',
  'Даже опытный Паладин подписывает свой молитвенник! Назовите же вашу колоду!',
  'Не оставляйте карты сиротами — подарите этой колоде звучное и гордое название!',
  'Алхимик готов смешать зелье сохранения, но на флаконе должна быть четкая подпись!',
  'Свитки судьбы не терпят безымянности — нареките колоду перед отправкой в небесный архив!',
  'Даруйте колоде имя, и да вострепещут враги и монстры при одном лишь звуке её названия!',
];

export const DECK_SAVE_HUMOROUS_MESSAGES_EN = [
  'Your deck requires a name so bards can immortalize it in their legendary sagas!',
  'Even a legendary sword has a name, and a magnificent deck of scrolls needs one even more!',
  'The Council of Lords refuses to register nameless spell scrolls!',
  'Every card in this deck longs to proudly bear the name of its great creator!',
  'Archmages of the Citadel demand a grimoire title before sealing it to Google Drive!',
  'Without a name, this deck risks being lost in the Astral Plane among forgotten ruins!',
  'Even the humblest goblin shaman names their totem! Bestow a title upon your masterpiece!',
  'Enter the name into the ancient register, or the Guardian Dragon will block the dungeon gate!',
  'The Dungeon Master squints: "A deck of such immense power must have a worthy name!"',
  'The spellsmith is ready to forge your deck’s title onto the grimoire’s golden cover!',
  'Lest the spell of Oblivion touch these artifacts, bestow a unique title upon this deck!',
  'The archive keeper raises an eyebrow: "How shall we name this great tome, Master?"',
  'Chronickers of the Mage Order have poised their quills — give them the name of your deck!',
  'Only named decks can pass through the magical gates of the Keepers!',
  'What legend ever began with "Once upon a time there was a nameless stack of cards"? Name it!',
  'Even a seasoned Paladin labels their prayer book! Give your deck a proud name!',
  'Do not leave your cards orphaned — grant this deck a resonant and formidable title!',
  'The Alchemist is ready to brew the preservation potion, but the vial requires a label!',
  'Scrolls of destiny abhor anonymity — name the deck before sending it to the celestial archive!',
  'Give your deck a name, and let monsters tremble at the mere sound of its title!',
];

export const DECK_SAVE_HUMOROUS_MESSAGES = DECK_SAVE_HUMOROUS_MESSAGES_RU;

interface SaveDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string) => Promise<void>;
  defaultTitle?: string;
  isSaving?: boolean;
  headerTitle?: string;
  subtitle?: string;
  buttonText?: string;
  language?: AppLanguage;
}

export const SaveDeckModal: React.FC<SaveDeckModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultTitle = 'Моя колода карт',
  isSaving = false,
  headerTitle,
  subtitle,
  buttonText,
  language = 'ru',
}) => {
  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.ru;
  const messages = language === 'en' ? DECK_SAVE_HUMOROUS_MESSAGES_EN : DECK_SAVE_HUMOROUS_MESSAGES_RU;

  const effectiveHeaderTitle = headerTitle || (language === 'en' ? 'Save Deck to Google Drive' : 'Сохранение колоды на Google Диск');
  const effectiveSubtitle = subtitle || (language === 'en' ? 'Saving cards into your Google Drive registry' : 'Сохранение карт в реестре вашего Google Диска');
  const effectiveButtonText = buttonText || (language === 'en' ? 'Save Deck' : 'Сохранить колоду');

  const [title, setTitle] = useState(defaultTitle);
  const [randomMessage, setRandomMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(defaultTitle || (language === 'en' ? 'My Card Deck' : 'Моя колода карт'));
      const idx = Math.floor(Math.random() * messages.length);
      setRandomMessage(messages[idx]);
    }
  }, [isOpen, defaultTitle, language]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || defaultTitle || (language === 'en' ? 'New Deck' : 'Новая колода');
    await onSave(finalTitle);
  };

  const getRandomNewMessage = () => {
    const available = messages.filter(m => m !== randomMessage);
    const idx = Math.floor(Math.random() * available.length);
    setRandomMessage(available[idx] || messages[0]);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-stone-900 border border-stone-700/80 rounded-xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800 bg-stone-950/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Icons.Scroll size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-100">
                  {effectiveHeaderTitle}
                </h3>
                <p className="text-xs text-stone-400">{effectiveSubtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="p-1.5 text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <Icons.X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Humorous RPG Quote Box */}
            <div className="relative p-3.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-200/90 text-xs italic leading-relaxed flex items-start gap-3">
              <Icons.Quote size={18} className="text-amber-400/70 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{randomMessage}</span>
              </div>
              <button
                type="button"
                onClick={getRandomNewMessage}
                title={language === 'en' ? 'Another quote' : 'Другое напутствие'}
                className="p-1 text-amber-400/60 hover:text-amber-300 hover:bg-amber-900/40 rounded transition-colors"
              >
                <Icons.RefreshCw size={13} />
              </button>
            </div>

            {/* Title Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-300">
                {t.driveSaveDeckNameLabel} <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t.driveSaveDeckNamePlaceholder}
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700/80 rounded-lg text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  autoFocus
                />
                {title && (
                  <button
                    type="button"
                    onClick={() => setTitle('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                  >
                    <Icons.XCircle size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-stone-300 bg-stone-800 hover:bg-stone-700 transition-colors cursor-pointer"
              >
                {t.btnCancel}
              </button>
              <button
                type="submit"
                disabled={isSaving || !title.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Icons.Loader2 size={15} className="animate-spin" />
                    <span>{t.driveSaveDeckSaving}</span>
                  </>
                ) : (
                  <>
                    <Icons.BookmarkCheck size={15} />
                    <span>{effectiveButtonText}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

