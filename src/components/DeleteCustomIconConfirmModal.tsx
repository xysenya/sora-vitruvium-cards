import React from 'react';
import * as Icons from 'lucide-react';
import { AppLanguage, UI_TRANSLATIONS } from '../i18n';
import { UserCustomIcon } from '../types';

interface DeleteCustomIconConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  icon: UserCustomIcon | null;
  onConfirm: () => void;
  language: AppLanguage;
}

export const DeleteCustomIconConfirmModal: React.FC<DeleteCustomIconConfirmModalProps> = ({
  isOpen,
  onClose,
  icon,
  onConfirm,
  language
}) => {
  const t = UI_TRANSLATIONS[language];

  if (!isOpen || !icon) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 no-print animate-in fade-in duration-150">
      <div 
        className="fixed inset-0 bg-stone-900/60 dark:bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div 
        className="bg-white dark:bg-stone-900 w-full max-w-sm rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0 shadow-sm relative">
            <img 
              src={icon.dataUrl} 
              alt={icon.name} 
              className="w-8 h-8 object-contain"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow">
              <Icons.Trash2 size={11} />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <h4 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
              {t.deleteCustomIconConfirmTitle}
            </h4>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              {t.deleteCustomIconConfirmText(icon.name)}
            </p>
          </div>
        </div>

        <div className="p-3.5 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-2 bg-stone-50/80 dark:bg-stone-850/80">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-bold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-750 rounded-lg transition-colors cursor-pointer"
          >
            {t.cancelBtn}
          </button>
          
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-98"
          >
            <Icons.Trash2 size={13} />
            <span>{t.deleteCardBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
