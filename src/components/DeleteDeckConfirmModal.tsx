import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { deleteDeckFromDrive } from '../googleDrive';
import { AppLanguage, UI_TRANSLATIONS } from '../i18n';

interface DeleteDeckConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckFile: { id: string; name: string; deckData: { title: string } } | null;
  accessToken: string;
  onDeleted: (fileId: string) => void;
  language?: AppLanguage;
}

const HUMOROUS_MESSAGES_RU = [
  'Вы уверены, что хотите обрушить заклинание «Огненный Шар» 9-го круга на эту колоду? Даже Исполнение Желаний не сможет вернуть сгоревшие фолианты!',
  'Бросить эту колоду прямо в жерло Астрального Плана? Все карты растворятся в эфире и навсегда исчезнут с вашего Google Диска!',
  'Применить на колоду Дезинтеграцию? Все артефакты превратятся в серую пыль без возможности Воскрешения!',
  'Скормить эти карты голодному Сундуку-Мимику? Он проглотит их целиком, и даже мастера Архива Гильдии не смогут спасти ваш гримуар!',
  'Сбросить колоду в самую глубину Девяти Преисподних? Дьяволы и демоны разорвут свитки на мелкие клочки!',
  'Применить Священное Изгнание к этой колоде? Каждая карта будет изгнана в небытие, а верховный архимаг лишится дара речи!',
  'Сбросить колоду в Кипящую Лаву подземных чертогов? Дварфы-кузнецы подтверждают: от карт не останется даже пепла!',
  'Кастовать «Слово силы: Смерть» на этот фолиант? Магический резонанс сотрет карты из всех древних фолиантов!',
  'Передать этот гримуар древнему Красному Дракону? Его огненное дыхание превратит вашу колоду в кучку обугленных углей!',
  'Применить заклинание «Стирание Памяти» ко всей колоде? Ни один бард Мультивселенной больше не споет песнь об этих артефактах!',
  'Запечатать карты внутри Сферы Аннигиляции? Физические законы магии сотрут их из всех времен и измерений!',
  'Отдать эту колоду Огру-людоеду на перекус? Он решит, что это хрустящие лепешки, и с аппетитом проглотит все до единой!',
  'Заточить гримуар в Бездну под проклятием Древних Богов? Ни один самый отважный Паладин не решится спуститься за ними!',
  'Выбросить свитки в водоворот Стихийного Плана Хаоса? Карты мгновенно распадутся на чистую магическую пыль!',
  'Проклясть колоду заклятием Увядания Нежити? Древний Лич унесет сундук с картами в свои темные катакомбы!',
  'Заключить сделку с Демоном Перекрестка и заложить эту колоду? Души этих карт отправятся прямиком на Нижние Планы!',
  'Применить легендарное Мертвенное Касание к гримуару? Нечестивое заклинание обуглит пергамент и развеет его по ветру!',
  'Отправить свитки в Кузню Погибели и расплавить их в жидком астрале? Совет Магов Безмолвия будет в полном шоке!',
  'Активировать дварфийскую ловушку с падающим монолитом прямо над этой колодой? Карты раздавит в тончайшую пыль!',
];

const HUMOROUS_MESSAGES_EN = [
  'Are you certain you wish to unleash a 9th-level Fireball upon this deck? Not even a Wish spell can restore scorched tomes!',
  'Cast this deck straight into the Astral Plane? All cards will dissolve into the ether and vanish forever from Google Drive!',
  'Cast Disintegration on the deck? All artifacts will turn to grey dust beyond any hope of Resurrection!',
  'Feed these cards to a hungry Mimic chest? It will swallow them whole, and not even Guild Archival Masters can retrieve them!',
  'Hurl the deck into the deepest pit of the Nine Hells? Fiends will tear the scrolls into tiny shreds!',
  'Channel Divine Banishment upon this deck? Every card will be banished into the void, leaving the Grand Archmage speechless!',
  'Drop the deck into the Molten Magma of subterranean halls? Dwarven smiths confirm: not even ashes will remain!',
  'Cast "Power Word: Kill" on this grimoire? The magical resonance will purge these cards from all chronicles!',
  'Offer this grimoire to an ancient Red Dragon? Its fiery breath will reduce your deck to a mound of cinders!',
  'Cast "Modify Memory" on the entire universe? No bard in the Multiverse will ever sing tales of these artifacts!',
  'Seal the cards inside a Sphere of Annihilation? The fundamental laws of magic will erase them across all timelines!',
  'Toss this deck to an Ogre for a light snack? He will think they are crispy flatbreads and devour them happily!',
  'Imprison the grimoire in the Abyss under the curse of Ancient Gods? Not even the boldest Paladin will dare venture after them!',
  'Hurling scrolls into the maelstrom of the Elemental Chaos? Cards will instantly disintegrate into raw mana dust!',
  'Curse the deck with Necrotic Wither? An ancient Lich will spirit away the card chest into his gloomy catacombs!',
  'Strike a deal with a Crossroads Demon to forfeit this deck? The souls of these cards will descend to the Lower Planes!',
  'Unleash legendary Touch of Death onto the grimoire? The profane magic will char the parchment into drifting dust!',
  'Cast the scrolls into the Doom Forge to melt in astral fire? The Silent Council of Wizards will be utterly horrified!',
  'Trigger a dwarven falling monolith trap directly over this deck? The cards will be crushed to finest powder!',
];

export const DeleteDeckConfirmModal: React.FC<DeleteDeckConfirmModalProps> = ({
  isOpen,
  onClose,
  deckFile,
  accessToken,
  onDeleted,
  language = 'ru',
}) => {
  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.ru;
  const messages = language === 'en' ? HUMOROUS_MESSAGES_EN : HUMOROUS_MESSAGES_RU;

  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [randomMessage] = useState(() => {
    return messages[Math.floor(Math.random() * messages.length)];
  });

  if (!isOpen || !deckFile) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      await deleteDeckFromDrive(accessToken, deckFile.id);
      onDeleted(deckFile.id);
      onClose();
    } catch (err: any) {
      console.warn('Failed to delete deck:', err);
      setErrorMsg(err?.message || (language === 'en' ? 'Failed to delete file from Google Drive.' : 'Ошибка при удалении файла с Google Диска.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-stone-900 border border-red-900/60 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-stone-100 flex flex-col gap-5 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top flame glow header line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 animate-pulse" />

        {/* Header Icon & Title */}
        <div className="flex items-center gap-3.5 pt-1">
          <div className="w-12 h-12 rounded-xl bg-red-950/80 border border-red-600/40 flex items-center justify-center text-red-500 shadow-inner shrink-0">
            <Icons.Flame size={26} className="animate-bounce" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-serif text-red-400 uppercase tracking-wider">
              {t.driveDeleteConfirmTitle}
            </h3>
            <p className="text-xs text-stone-400 font-medium truncate max-w-[240px]">
              «{deckFile.deckData.title}»
            </p>
          </div>
        </div>

        {/* Humorous warning text */}
        <div className="bg-stone-950/80 border border-red-950 p-4 rounded-xl text-stone-300 text-xs leading-relaxed space-y-2">
          <p className="italic text-stone-200">
            "{randomMessage}"
          </p>
          <div className="pt-2 border-t border-red-950/80 text-[11px] text-red-400/90 font-semibold flex items-center gap-1.5">
            <Icons.AlertTriangle size={14} className="shrink-0 text-red-500" />
            <span>{t.driveDeleteWarning}</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <Icons.AlertCircle size={16} className="shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end items-center gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            {language === 'en' ? 'Spare the Deck' : 'Пощадить колоду'}
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-stone-100 font-bold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-red-950/50 disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Icons.Loader2 size={16} className="animate-spin" />
                <span>{t.driveDeleting}</span>
              </>
            ) : (
              <>
                <Icons.Trash2 size={16} />
                <span>{t.driveDeleteBtn}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

