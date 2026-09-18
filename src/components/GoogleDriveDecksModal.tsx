import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { 
  DriveDeckFile, 
  DriveUserProfile, 
  listDeckFiles, 
  saveDeckToDrive, 
  requestDriveAuth,
  fetchUserProfile,
  DeckData 
} from '../googleDrive';
import { EditDeckCoverModal } from './EditDeckCoverModal';
import { DeleteDeckConfirmModal } from './DeleteDeckConfirmModal';
import { SaveDeckModal } from './SaveDeckModal';
import { Card, TypeDefinition, RarityDefinition } from '../types';
import { CARD_TYPES, STARTER_CARDS, DEFAULT_RARITIES } from '../data';
import { AppLanguage, UI_TRANSLATIONS } from '../i18n';

interface GoogleDriveDecksModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string;
  user: DriveUserProfile;
  onSignOut: () => void;
  onReAuth?: (newToken: string, newUser: DriveUserProfile, expiresIn?: number) => void;
  onConfigureAuth?: () => void;
  // Current active cards & settings in editor
  currentCards: Card[];
  currentCardTypes: TypeDefinition[];
  currentRarities: RarityDefinition[];
  currentCardBackEnabled: boolean;
  currentCardBackUrl: string;
  currentCardBackScale: number;
  currentCardBackPositionX: number;
  currentCardBackPositionY: number;
  currentCardBackRotation: number;
  currentDeckDriveId?: string | null;
  currentDeckTitle?: string | null;
  // Callback when loading a deck into the editor
  onLoadDeckToEditor: (deckData: DeckData, driveFileId: string, openInViewMode?: boolean) => void;
  // Toast notifications
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  language?: AppLanguage;
}

export const GoogleDriveDecksModal: React.FC<GoogleDriveDecksModalProps> = ({
  isOpen,
  onClose,
  accessToken,
  user,
  onSignOut,
  onReAuth,
  onConfigureAuth,
  currentCards,
  currentCardTypes,
  currentRarities,
  currentCardBackEnabled,
  currentCardBackUrl,
  currentCardBackScale,
  currentCardBackPositionX,
  currentCardBackPositionY,
  currentCardBackRotation,
  currentDeckDriveId,
  currentDeckTitle,
  onLoadDeckToEditor,
  showToast,
  language = 'ru',
}) => {
  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.ru;
  const [deckFiles, setDeckFiles] = useState<DriveDeckFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSavingCurrent, setIsSavingCurrent] = useState(false);

  // Sub-modal states
  const [editingCoverFile, setEditingCoverFile] = useState<DriveDeckFile | null>(null);
  const [deletingFile, setDeletingFile] = useState<DriveDeckFile | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const handleReAuth = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { accessToken: newToken, expiresIn } = await requestDriveAuth();
      const userProfile = await fetchUserProfile(newToken);
      if (onReAuth) {
        onReAuth(newToken, userProfile, expiresIn);
      }
      showToast(language === 'en' ? `Google session renewed! Welcome, ${userProfile.name}!` : `Сессия Google обновлена! Добро пожаловать, ${userProfile.name}!`, 'success');
      const files = await listDeckFiles(newToken);
      setDeckFiles(files);
    } catch (err: any) {
      console.warn('Re-auth warning:', err);
      setErrorMsg('AUTH_EXPIRED');
      showToast(err.message || (language === 'en' ? 'Failed to refresh Google authorization' : 'Не удалось обновить авторизацию Google'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDecks = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const files = await listDeckFiles(accessToken);
      setDeckFiles(files);
    } catch (err: any) {
      if (err.message === 'AUTH_EXPIRED') {
        console.warn('Google Drive session expired while listing decks.');
        setErrorMsg('AUTH_EXPIRED');
      } else {
        console.error('Failed to list decks:', err);
        setErrorMsg(err.message || (language === 'en' ? 'Failed to load decks from Google Drive' : 'Ошибка загрузки колод с Google Диска'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDecks();
    }
  }, [isOpen, accessToken]);

  if (!isOpen) return null;

  // Filter decks by title
  const filteredDecks = deckFiles.filter(df => 
    (df.deckData.title || df.name).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Open Save Modal
  const handleOpenSaveModal = () => {
    if (!currentCards || currentCards.length === 0) {
      showToast(language === 'en' ? 'No cards in current editor to save!' : 'В текущем редакторе нет карт для сохранения!', 'error');
      return;
    }
    setIsSaveModalOpen(true);
  };

  // Perform saving from SaveDeckModal
  const handleConfirmSaveDeck = async (deckTitle: string) => {
    setIsSavingCurrent(true);
    try {
      const deckData: DeckData = {
        title: deckTitle,
        cards: currentCards,
        cardTypes: currentCardTypes,
        rarities: currentRarities,
        cardBackEnabled: currentCardBackEnabled,
        cardBackUrl: currentCardBackUrl,
        cardBackScale: currentCardBackScale,
        cardBackPositionX: currentCardBackPositionX,
        cardBackPositionY: currentCardBackPositionY,
        cardBackRotation: currentCardBackRotation,
      };

      const result = await saveDeckToDrive(accessToken, deckData, currentDeckDriveId || undefined);
      showToast(language === 'en' ? `Deck "${deckTitle}" saved successfully to Google Drive!` : `Колода «${deckTitle}» успешно сохранена на Google Диск!`, 'success');
      setIsSaveModalOpen(false);
      onLoadDeckToEditor(deckData, result.fileId, false);
      await fetchDecks(); // Refresh list
    } catch (err: any) {
      if (err.message === 'AUTH_EXPIRED') {
        console.warn('Google Drive session expired while saving current deck.');
        showToast(language === 'en' ? 'Google session expired. Please sign in again.' : 'Сессия Google истекла. Пожалуйста, войдите в аккаунт снова.', 'error');
        onSignOut();
      } else {
        console.error('Failed to save current deck:', err);
        showToast(language === 'en' ? 'Error saving deck to Google Drive' : 'Ошибка сохранения колоды на Google Диск', 'error');
      }
    } finally {
      setIsSavingCurrent(false);
    }
  };

  // Perform creation of new deck
  const handleConfirmCreateDeck = async (deckTitle: string) => {
    setIsCreatingNew(true);
    try {
      const newDeckData: DeckData = {
        title: deckTitle,
        cards: STARTER_CARDS,
        cardTypes: CARD_TYPES,
        rarities: DEFAULT_RARITIES,
        cardBackEnabled: false,
        cardBackUrl: '',
        cardBackScale: 100,
        cardBackPositionX: 0,
        cardBackPositionY: 0,
        cardBackRotation: 0,
      };

      const result = await saveDeckToDrive(accessToken, newDeckData);
      showToast(language === 'en' ? `New deck "${deckTitle}" created and loaded into editor!` : `Новая колода «${deckTitle}» успешно создана и загружена в редактор!`, 'success');
      setIsCreateModalOpen(false);
      onLoadDeckToEditor(newDeckData, result.fileId, false);
      onClose();
    } catch (err: any) {
      if (err.message === 'AUTH_EXPIRED') {
        console.warn('Google Drive session expired while creating new deck.');
        showToast(language === 'en' ? 'Google session expired. Please sign in again.' : 'Сессия Google истекла. Пожалуйста, войдите в аккаунт снова.', 'error');
        onSignOut();
      } else {
        console.error('Failed to create new deck:', err);
        showToast(language === 'en' ? 'Error creating new deck on Google Drive' : 'Ошибка создания новой колоды на Google Диске', 'error');
      }
    } finally {
      setIsCreatingNew(false);
    }
  };

  // Helper to resolve cover image for a deck card
  const getDeckCoverUrl = (deck: DeckData): { url: string; scale: number; posX: number; posY: number; rot: number } => {
    const cover = deck.cover;
    const scale = cover?.scale !== undefined ? cover.scale : 100;
    const posX = cover?.positionX !== undefined ? cover.positionX : 0;
    const posY = cover?.positionY !== undefined ? cover.positionY : 0;
    const rot = cover?.rotation !== undefined ? cover.rotation : 0;

    if (cover?.type === 'custom' && cover.url) {
      return { url: cover.url, scale, posX, posY, rot };
    }

    const firstCard = deck.cards?.[0];

    if (cover?.type === 'illustration' && firstCard?.artUrl) {
      return { url: firstCard.artUrl, scale, posX, posY, rot };
    }

    // Default or 'shirt': 1st card shirt or global shirt or 1st card art
    const shirtUrl = firstCard?.shirtUrl || deck.cardBackUrl;
    if (shirtUrl) {
      return { url: shirtUrl, scale, posX, posY, rot };
    }

    if (firstCard?.artUrl) {
      return { url: firstCard.artUrl, scale, posX, posY, rot };
    }

    return {
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=max&q=80',
      scale,
      posX,
      posY,
      rot,
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-stone-900 border border-stone-800 rounded-2xl max-w-5xl w-full p-6 shadow-2xl relative text-stone-100 flex flex-col gap-5 max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header decoration */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-emerald-500 to-amber-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-100 rounded-full hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <Icons.X size={20} />
        </button>

        {/* Top Bar: Title & User Profile Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 pr-10 border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
              <Icons.FolderHeart size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold font-serif text-stone-100">
                {t.driveDecksTitle}
              </h3>
              <p className="text-xs text-stone-400">
                {t.driveDecksSub} • {t.driveDecksCardsCount(deckFiles.length)}
              </p>
            </div>
          </div>

          {/* User Profile Info & Sign Out */}
          <div className="flex items-center gap-3 bg-stone-950/60 p-1.5 px-3 rounded-xl border border-stone-800/80 shrink-0">
            {user.picture ? (
              <img src={user.picture} alt={user.name} className="w-7 h-7 rounded-full border border-stone-700" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-emerald-800 flex items-center justify-center text-xs font-bold text-stone-100">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-left hidden md:block">
              <div className="text-xs font-semibold text-stone-200 truncate max-w-[120px]">{user.name}</div>
              <div className="text-[10px] text-stone-500 truncate max-w-[120px]">{user.email}</div>
            </div>
            <button
              onClick={onSignOut}
              title={t.driveDecksSignOutBtn}
              className="p-1.5 text-stone-400 hover:text-red-400 rounded-lg hover:bg-stone-800 transition-colors ml-1 cursor-pointer"
            >
              <Icons.LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Toolbar: Search, Refresh, Save Current Deck */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Icons.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.driveDecksSearchPlaceholder}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={fetchDecks}
              disabled={isLoading}
              title={language === 'en' ? 'Refresh list from Google Drive' : 'Обновить список с Google Диска'}
              className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl transition-colors cursor-pointer border border-stone-700 disabled:opacity-50"
            >
              <Icons.RefreshCw size={16} className={isLoading ? 'animate-spin text-amber-400' : ''} />
            </button>

            <button
              onClick={handleOpenSaveModal}
              disabled={isSavingCurrent}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition-colors flex items-center gap-2 shadow cursor-pointer disabled:opacity-50"
            >
              {isSavingCurrent ? (
                <>
                  <Icons.Loader2 size={16} className="animate-spin" />
                  <span>{t.driveSaveDeckSaving}</span>
                </>
              ) : (
                <>
                  <Icons.Plus size={16} />
                  <span>{t.driveDecksSaveCurrentBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Area: Grid of Decks */}
        <div className="flex-1 overflow-y-auto pr-1 min-h-[340px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-stone-500 py-16 gap-3">
              <Icons.Loader2 size={36} className="animate-spin text-amber-500" />
              <span className="text-xs font-medium">{t.driveDecksLoading}</span>
            </div>
          ) : errorMsg ? (
            <div className="flex flex-col items-center justify-center h-full text-red-400 py-12 gap-3 px-4">
              <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-800/80 flex items-center justify-center text-red-400">
                <Icons.AlertCircle size={26} />
              </div>
              <span className="text-xs text-center max-w-lg text-stone-300 leading-relaxed">
                {errorMsg === 'AUTH_EXPIRED'
                  ? (language === 'en' ? 'Your Google session has expired (401). Please sign in again.' : 'Срок действия вашей сессии авторизации Google истек (401). Пожалуйста, выберите «Войти заново».')
                  : errorMsg.includes('deleted') || errorMsg.includes('146004089024') || errorMsg.includes('PERMISSION_DENIED')
                  ? (language === 'en' ? 'Previous Google Cloud project was deleted. Please configure your Google OAuth Client ID in settings.' : 'Предыдущий проект Google Cloud (#146004089024) был удален Google. Пожалуйста, укажите ваш Google OAuth Client ID в настройках.')
                  : errorMsg}
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                {onConfigureAuth && (
                  <button
                    onClick={onConfigureAuth}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg text-xs transition-colors cursor-pointer shadow flex items-center gap-1.5"
                  >
                    <Icons.KeyRound size={14} />
                    <span>{language === 'en' ? 'Configure Client ID' : 'Настроить Client ID'}</span>
                  </button>
                )}
                {errorMsg === 'AUTH_EXPIRED' ? (
                  <button
                    onClick={handleReAuth}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-stone-100 font-semibold rounded-lg text-xs transition-colors cursor-pointer shadow flex items-center gap-1.5"
                  >
                    <Icons.LogIn size={14} />
                    <span>{language === 'en' ? 'Sign in again' : 'Войти заново через Google'}</span>
                  </button>
                ) : (
                  <button
                    onClick={fetchDecks}
                    className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    {language === 'en' ? 'Try Again' : 'Попробовать снова'}
                  </button>
                )}
                <button
                  onClick={onSignOut}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  {t.driveDecksSignOutBtn}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-4">
              {/* Card button: Create New Deck */}
              <div
                onClick={() => setIsCreateModalOpen(true)}
                className="group relative bg-stone-950/80 hover:bg-stone-900/90 rounded-2xl border-2 border-dashed border-stone-800 hover:border-amber-500/80 shadow-lg hover:shadow-amber-950/30 transition-all duration-300 flex flex-col items-center justify-center p-6 text-center cursor-pointer aspect-[3/4]"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 group-hover:bg-amber-500 group-hover:text-stone-950 group-hover:scale-110 flex items-center justify-center transition-all duration-300 mb-4 shadow-inner">
                  <Icons.Plus size={30} />
                </div>
                <h4 className="font-serif font-bold text-base text-stone-200 group-hover:text-amber-400 transition-colors">
                  {language === 'en' ? 'Create New Deck' : 'Создать новую колоду'}
                </h4>
                <p className="text-xs text-stone-500 group-hover:text-stone-400 mt-2 max-w-[180px] leading-relaxed">
                  {language === 'en' ? 'Open a clean deck with starter cards' : 'Открыть чистую колоду со стандартным набором карт'}
                </p>
              </div>

              {filteredDecks.map((deckFile) => {
                const coverInfo = getDeckCoverUrl(deckFile.deckData);
                const cardCount = deckFile.deckData.cards?.length || 0;
                const formattedDate = new Date(deckFile.modifiedTime || deckFile.createdTime).toLocaleDateString(language === 'en' ? 'en-US' : 'ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <div
                    key={deckFile.id}
                    onClick={() => {
                      onLoadDeckToEditor(deckFile.deckData, deckFile.id, false);
                      showToast(t.driveDecksLoadedSuccess(deckFile.deckData.title || deckFile.name), 'success');
                      onClose();
                    }}
                    className="group relative bg-stone-950 rounded-2xl border border-stone-800 hover:border-amber-500/60 shadow-lg hover:shadow-amber-950/40 hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
                  >
                    {/* Deck Cover Card Container */}
                    <div className="relative w-full aspect-[3/4] bg-stone-900 overflow-hidden">
                      {/* Background Image with transform */}
                      <img
                        src={coverInfo.url}
                        alt={deckFile.deckData.title}
                        className="absolute max-w-none max-h-none pointer-events-none"
                        style={{
                          left: '50%',
                          top: '50%',
                          width: 'auto',
                          height: 'auto',
                          minWidth: '100%',
                          minHeight: '100%',
                          transform: `translate(-50%, -50%) translate(${coverInfo.posX}%, ${coverInfo.posY}%) scale(${coverInfo.scale / 100}) rotate(${coverInfo.rot}deg)`,
                          transformOrigin: 'center center',
                        }}
                        referrerPolicy="no-referrer"
                      />
                      {/* Subtle Dark Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/30 to-stone-950/50 pointer-events-none" />

                      {/* Top Bar inside card preview */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-center z-10 pointer-events-none">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-stone-950/80 text-amber-400 border border-amber-500/30 backdrop-blur-sm">
                          {t.driveDecksCardsCount(cardCount)}
                        </span>
                        <span className="text-[9px] font-mono text-stone-400 bg-stone-950/80 px-2 py-0.5 rounded border border-stone-800 backdrop-blur-sm">
                          {formattedDate}
                        </span>
                      </div>

                      {/* HOVER OVERLAY: 4 ACTION ICON BUTTONS (TOP RIGHT OF CARD) */}
                      <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200 bg-stone-950/90 p-1.5 rounded-xl border border-amber-500/40 shadow-xl backdrop-blur-md">
                        
                        {/* 1. Edit Cover */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCoverFile(deckFile);
                          }}
                          title={t.driveDecksEditCoverBtn}
                          className="p-1.5 text-stone-300 hover:text-amber-400 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Icons.Palette size={16} />
                        </button>

                        {/* 2. Edit Deck in Editor */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onLoadDeckToEditor(deckFile.deckData, deckFile.id, false);
                            showToast(t.driveDecksLoadedSuccess(deckFile.deckData.title || deckFile.name), 'success');
                            onClose();
                          }}
                          title={language === 'en' ? 'Edit deck' : 'Редактирование колоды'}
                          className="p-1.5 text-stone-300 hover:text-emerald-400 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Icons.Edit3 size={16} />
                        </button>

                        {/* 3. View Deck in View Mode */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onLoadDeckToEditor(deckFile.deckData, deckFile.id, true);
                            showToast(language === 'en' ? `Deck "${deckFile.deckData.title || deckFile.name}" opened in view mode!` : `Колода «${deckFile.deckData.title || deckFile.name}» открыта в режиме просмотра!`, 'success');
                            onClose();
                          }}
                          title={language === 'en' ? 'View deck' : 'Просмотр колоды'}
                          className="p-1.5 text-stone-300 hover:text-blue-400 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Icons.Eye size={16} />
                        </button>

                        {/* 4. Delete Deck */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingFile(deckFile);
                          }}
                          title={t.driveDecksDeleteBtn}
                          className="p-1.5 text-stone-300 hover:text-red-400 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Icons.Trash2 size={16} />
                        </button>
                      </div>

                      {/* Card Title & Info at bottom of preview */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                        <h4 className="text-sm font-bold font-serif text-stone-100 group-hover:text-amber-300 transition-colors line-clamp-1">
                          {deckFile.deckData.title || deckFile.name}
                        </h4>
                        {deckFile.deckData.description && (
                          <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">
                            {deckFile.deckData.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Deck Cover Sub-Modal */}
      {editingCoverFile && (
        <EditDeckCoverModal
          isOpen={!!editingCoverFile}
          onClose={() => setEditingCoverFile(null)}
          deckFile={editingCoverFile}
          accessToken={accessToken}
          language={language}
          onCoverUpdated={(updatedDeckData) => {
            setDeckFiles(prev => prev.map(f => f.id === editingCoverFile.id ? { ...f, deckData: updatedDeckData } : f));
            showToast(t.driveDecksCoverUpdated, 'success');
          }}
        />
      )}

      {/* Delete Confirmation Sub-Modal */}
      {deletingFile && (
        <DeleteDeckConfirmModal
          isOpen={!!deletingFile}
          onClose={() => setDeletingFile(null)}
          deckFile={deletingFile}
          accessToken={accessToken}
          language={language}
          onDeleted={(deletedId) => {
            setDeckFiles(prev => prev.filter(f => f.id !== deletedId));
            showToast(t.driveDecksDeleteSuccess, 'success');
          }}
        />
      )}

      {/* Save Deck Sub-Modal */}
      <SaveDeckModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleConfirmSaveDeck}
        language={language}
        defaultTitle={
          currentDeckTitle ||
          (currentCards && currentCards[0]?.title
            ? (language === 'en' ? `Deck: ${currentCards[0].title}` : `Колода: ${currentCards[0].title}`)
            : (language === 'en' ? 'My Card Deck' : 'Моя колода карт'))
        }
        headerTitle={t.driveSaveDeckTitle}
        subtitle={language === 'en' ? 'Saving cards into your Google Drive registry' : 'Сохранение карт в реестре вашего Google Диска'}
        buttonText={t.driveSaveDeckSaveBtn}
        isSaving={isSavingCurrent}
      />

      {/* Create New Deck Sub-Modal */}
      <SaveDeckModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleConfirmCreateDeck}
        language={language}
        defaultTitle={language === 'en' ? 'New Card Deck' : 'Новая колода карт'}
        headerTitle={language === 'en' ? 'Create New Deck' : 'Создание новой колоды'}
        subtitle={language === 'en' ? 'Create deck with starter cards and save to Google Drive' : 'Создание колоды со стандартными картами и сохранение на Google Диск'}
        buttonText={language === 'en' ? 'Create & Open in Editor' : 'Создать и открыть в редакторе'}
        isSaving={isCreatingNew}
      />
    </div>
  );
};

