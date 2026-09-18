import React, { useState, useRef } from 'react';
import * as Icons from 'lucide-react';
import { DeckData, DeckCoverConfig, saveDeckToDrive } from '../googleDrive';
import { AppLanguage, UI_TRANSLATIONS } from '../i18n';

interface EditDeckCoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckFile: { id: string; name: string; deckData: DeckData };
  accessToken: string;
  onCoverUpdated: (updatedDeck: DeckData) => void;
  language?: AppLanguage;
}

export const EditDeckCoverModal: React.FC<EditDeckCoverModalProps> = ({
  isOpen,
  onClose,
  deckFile,
  accessToken,
  onCoverUpdated,
  language = 'ru',
}) => {
  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.ru;
  const currentCover: DeckCoverConfig = deckFile.deckData.cover || {
    type: 'shirt',
    scale: 100,
    positionX: 0,
    positionY: 0,
    rotation: 0,
  };

  const [coverType, setCoverType] = useState<'shirt' | 'illustration' | 'custom'>(currentCover.type || 'shirt');
  const [customUrl, setCustomUrl] = useState<string>(currentCover.url || '');
  const [scale, setScale] = useState<number>(currentCover.scale !== undefined ? currentCover.scale : 100);
  const [posX, setPosX] = useState<number>(currentCover.positionX !== undefined ? currentCover.positionX : 0);
  const [posY, setPosY] = useState<number>(currentCover.positionY !== undefined ? currentCover.positionY : 0);
  const [rotation, setRotation] = useState<number>(currentCover.rotation !== undefined ? currentCover.rotation : 0);
  
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const firstCard = deckFile.deckData.cards?.[0];
  
  // Resolve image URL based on type
  let effectiveImageUrl = '';
  if (coverType === 'custom') {
    effectiveImageUrl = customUrl;
  } else if (coverType === 'illustration') {
    effectiveImageUrl = firstCard?.artUrl || '';
  } else {
    // shirt
    effectiveImageUrl = firstCard?.shirtUrl || deckFile.deckData.cardBackUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=max&q=80';
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCustomUrl(event.target.result as string);
        setCoverType('custom');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const newCoverConfig: DeckCoverConfig = {
        type: coverType,
        url: coverType === 'custom' ? customUrl : undefined,
        scale,
        positionX: posX,
        positionY: posY,
        rotation,
      };

      const updatedDeckData: DeckData = {
        ...deckFile.deckData,
        cover: newCoverConfig,
      };

      await saveDeckToDrive(accessToken, updatedDeckData, deckFile.id);
      onCoverUpdated(updatedDeckData);
      onClose();
    } catch (err: any) {
      console.warn('Failed to update cover:', err);
      setErrorMsg(err?.message || (language === 'en' ? 'Failed to save cover to Google Drive.' : 'Ошибка при сохранении обложки на Google Диск.'));
    } finally {
      setIsSaving(false);
    }
  };

  const cardCount = deckFile.deckData.cards?.length || 0;
  const formattedDate = new Date(deckFile.deckData.updatedAt || deckFile.deckData.createdAt || Date.now()).toLocaleDateString(language === 'en' ? 'en-US' : 'ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-stone-900 border border-stone-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative text-stone-100 flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-100 rounded-full hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <Icons.X size={20} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Icons.Palette size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold font-serif text-stone-100">
              {t.driveEditCoverTitle}
            </h3>
            <p className="text-xs text-stone-400 truncate max-w-md">
              {language === 'en' ? 'Deck:' : 'Колода:'} <span className="text-amber-400 font-semibold">{deckFile.deckData.title}</span>
            </p>
          </div>
        </div>

        {/* Content Layout: Left = Live Preview, Right = Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* Live Preview Column */}
          <div className="flex flex-col items-center justify-center bg-stone-950/80 p-5 rounded-2xl border border-stone-800/80 relative">
            <div className="flex items-center justify-between w-full mb-3 px-1">
              <span className="text-[11px] font-semibold tracking-wider text-stone-400 uppercase">
                {language === 'en' ? 'Cover Preview' : 'Предпросмотр обложки'}
              </span>
              <span className="text-[10px] text-amber-400/80 font-mono">
                1:1 ({language === 'en' ? 'Deck List View' : 'Вид в списке'})
              </span>
            </div>

            {/* Deck Card Shape - Exactly matches GoogleDriveDecksModal dimensions (215px width with aspect-[3/4]) */}
            <div className="w-[215px] aspect-[3/4] rounded-2xl border border-stone-800 shadow-2xl relative bg-stone-900 overflow-hidden flex flex-col justify-between group">
              
              {/* Background Art Container */}
              <div className="absolute inset-0 overflow-hidden bg-stone-950">
                {effectiveImageUrl ? (
                  <img
                    src={effectiveImageUrl}
                    alt="Cover Preview"
                    className="absolute max-w-none max-h-none transition-transform duration-75"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: 'auto',
                      height: 'auto',
                      minWidth: '100%',
                      minHeight: '100%',
                      transform: `translate(-50%, -50%) translate(${posX}%, ${posY}%) scale(${scale / 100}) rotate(${rotation}deg)`,
                      transformOrigin: 'center center',
                    }}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-stone-600 p-4 text-center">
                    <Icons.ImageOff size={36} />
                    <span className="text-xs mt-2">{language === 'en' ? 'No image' : 'Нет изображения'}</span>
                  </div>
                )}
                {/* Subtle vignette gradient overlay matching list view */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/30 to-stone-950/50 pointer-events-none" />
              </div>

              {/* Top Bar inside card preview matching list view */}
              <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-center z-10 pointer-events-none">
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-stone-950/80 text-amber-400 border border-amber-500/30 backdrop-blur-sm shadow">
                  {t.driveDecksCardsCount(cardCount)}
                </span>
                <span className="text-[9px] font-mono text-stone-400 bg-stone-950/80 px-2 py-0.5 rounded border border-stone-800 backdrop-blur-sm shadow">
                  {formattedDate}
                </span>
              </div>

              {/* Bottom Title & Description matching list view */}
              <div className="absolute bottom-0 left-0 right-0 p-3 z-10 pointer-events-none">
                <h4 className="text-sm font-bold font-serif text-stone-100 drop-shadow line-clamp-1">
                  {deckFile.deckData.title || deckFile.name}
                </h4>
                {deckFile.deckData.description && (
                  <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5 drop-shadow-sm">
                    {deckFile.deckData.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Controls Column */}
          <div className="flex flex-col gap-4 text-xs text-stone-300">
            
            {/* Source Selection */}
            <div>
              <label className="block text-stone-400 font-semibold mb-1.5">{t.driveSaveDeckCoverTab}:</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-950 rounded-lg border border-stone-800">
                <button
                  type="button"
                  onClick={() => setCoverType('shirt')}
                  className={`py-1.5 px-2 rounded text-[11px] font-medium transition-colors cursor-pointer text-center ${
                    coverType === 'shirt'
                      ? 'bg-amber-600 text-stone-950 font-bold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {t.driveSaveDeckCoverShirt}
                </button>
                <button
                  type="button"
                  onClick={() => setCoverType('illustration')}
                  className={`py-1.5 px-2 rounded text-[11px] font-medium transition-colors cursor-pointer text-center ${
                    coverType === 'illustration'
                      ? 'bg-amber-600 text-stone-950 font-bold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {t.driveSaveDeckCoverIllustration}
                </button>
                <button
                  type="button"
                  onClick={() => setCoverType('custom')}
                  className={`py-1.5 px-2 rounded text-[11px] font-medium transition-colors cursor-pointer text-center ${
                    coverType === 'custom'
                      ? 'bg-amber-600 text-stone-950 font-bold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {t.driveSaveDeckCoverCustom}
                </button>
              </div>
            </div>

            {/* Custom URL or File Upload if Custom selected */}
            {coverType === 'custom' && (
              <div className="space-y-2 bg-stone-950/60 p-3 rounded-lg border border-stone-800 animate-fade-in">
                <label className="block text-stone-400 text-[11px] font-semibold">{language === 'en' ? 'Image link or file:' : 'Ссылка на изображение или файл:'}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://example.com/cover.png"
                    className="flex-1 bg-stone-900 border border-stone-700 rounded px-2.5 py-1.5 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded border border-stone-700 flex items-center gap-1 shrink-0 cursor-pointer"
                    title={language === 'en' ? 'Upload local file' : 'Загрузить локальный файл'}
                  >
                    <Icons.Upload size={14} />
                    <span>{t.driveSaveDeckUploadCover}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {/* Scale Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-stone-400">
                <span>{t.driveEditCoverScale}</span>
                <span className="font-mono text-amber-400">{scale}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={300}
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Position X Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-stone-400">
                <span>{t.driveEditCoverPosX}</span>
                <span className="font-mono text-amber-400">{posX}%</span>
              </div>
              <input
                type="range"
                min={-150}
                max={150}
                value={posX}
                onChange={(e) => setPosX(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Position Y Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-stone-400">
                <span>{t.driveEditCoverPosY}</span>
                <span className="font-mono text-amber-400">{posY}%</span>
              </div>
              <input
                type="range"
                min={-150}
                max={150}
                value={posY}
                onChange={(e) => setPosY(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Rotation Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-stone-400">
                <span>{t.driveEditCoverRotation}</span>
                <span className="font-mono text-amber-400">{rotation}°</span>
              </div>
              <input
                type="range"
                min={0}
                max={360}
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Reset transform button */}
            <button
              type="button"
              onClick={() => {
                setScale(100);
                setPosX(0);
                setPosY(0);
                setRotation(0);
              }}
              className="text-[11px] text-stone-500 hover:text-amber-400 self-start flex items-center gap-1 pt-1 cursor-pointer"
            >
              <Icons.RotateCcw size={12} />
              <span>{t.driveEditCoverReset}</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <Icons.AlertCircle size={16} className="shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex justify-end items-center gap-3 pt-3 border-t border-stone-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            {t.btnCancel}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Icons.Loader2 size={16} className="animate-spin" />
                <span>{t.driveSaveDeckSaving}</span>
              </>
            ) : (
              <>
                <Icons.Check size={16} />
                <span>{t.driveEditCoverSaveBtn}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

