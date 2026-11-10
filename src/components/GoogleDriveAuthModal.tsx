import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { requestDriveAuth, fetchUserProfile, DriveUserProfile } from '../googleDrive';
import { AppLanguage, UI_TRANSLATIONS } from '../i18n';

interface GoogleDriveAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (accessToken: string, user: DriveUserProfile, expiresIn?: number) => void;
  language?: AppLanguage;
}

export const GoogleDriveAuthModal: React.FC<GoogleDriveAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  language = 'ru',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.ru;

  if (!isOpen) return null;

  const handleAuth = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const authResult = await requestDriveAuth();
      let userProfile = authResult.userProfile;
      if (!userProfile) {
        userProfile = await fetchUserProfile(authResult.accessToken);
      }
      onSuccess(authResult.accessToken, userProfile, authResult.expiresIn);
      onClose();
    } catch (err: any) {
      console.warn('Drive Auth error:', err);
      const msg = err.message || '';
      if (msg.includes('popup-closed') || msg.includes('закрыто')) {
        setErrorMsg(language === 'en' ? 'Sign-in window was closed.' : 'Окно входа было закрыто.');
      } else {
        setErrorMsg(msg || (language === 'en' ? 'Google authorization failed.' : 'Ошибка авторизации через Google.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-stone-900 border border-stone-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-stone-100 flex flex-col gap-5 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-emerald-500 to-amber-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-100 rounded-full hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <Icons.X size={20} />
        </button>

        {/* Modal Header Icon & Title */}
        <div className="flex items-center gap-3.5 pt-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
            <Icons.HardDrive size={26} />
          </div>
          <div>
            <h3 className="text-xl font-bold font-serif text-stone-100">
              {t.driveAuthTitle}
            </h3>
            <p className="text-xs text-stone-400">
              {t.driveAuthDesc}
            </p>
          </div>
        </div>

        {/* Information Body */}
        <div className="space-y-3 text-sm text-stone-300 leading-relaxed bg-stone-950/50 p-4 rounded-xl border border-stone-800/80">
          <p className="flex items-start gap-2.5">
            <Icons.CloudCheck className="text-emerald-400 shrink-0 mt-0.5" size={18} />
            <span>
              {t.driveAuthPoint1}
            </span>
          </p>
          
          <p className="flex items-start gap-2.5">
            <Icons.Smartphone className="text-amber-400 shrink-0 mt-0.5" size={18} />
            <span>
              {t.driveAuthPoint2}
            </span>
          </p>

          <div className="pt-2 border-t border-stone-800/80 flex items-start gap-2.5 text-xs text-stone-400">
            <Icons.ShieldCheck className="text-blue-400 shrink-0 mt-0.5" size={16} />
            <span>
              {t.driveAuthPoint3}
            </span>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 bg-red-950/80 border border-red-800/80 rounded-xl text-red-200 text-xs flex flex-col gap-1.5">
            <div className="flex items-center gap-2 font-medium">
              <Icons.AlertCircle size={16} className="shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
            {(errorMsg.toLowerCase().includes('заблокировано') || errorMsg.toLowerCase().includes('blocked') || errorMsg.toLowerCase().includes('popup')) && (
              <p className="text-[11px] text-amber-300/90 pl-6">
                {language === 'en'
                  ? 'Tip: Check the address bar (shield icon or pop-up icon) and set "Allow Pop-ups" for this site.'
                  : 'Подсказка: Проверьте адресную строку браузера (значок щита или иконку всплывающего окна справа) и разрешите Pop-up для этого сайта.'}
              </p>
            )}
          </div>
        )}

        {/* Auth Action Button */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={handleAuth}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-stone-950 font-bold text-sm shadow-lg shadow-emerald-950/40 hover:shadow-emerald-900/60 transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Icons.Loader2 size={18} className="animate-spin text-stone-950" />
                <span>{t.driveConnecting}</span>
              </>
            ) : (
              <>
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center p-0.5 shadow-sm shrink-0">
                  <svg viewBox="0 0 24 24" className="w-full h-full">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                </div>
                <span>{t.driveAuthBtn}</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-xs text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
          >
            {t.btnCancel}
          </button>
        </div>
      </div>
    </div>
  );
};


