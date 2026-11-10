import React, { useRef, useState } from 'react';
import * as Icons from 'lucide-react';
import { AppLanguage, UI_TRANSLATIONS } from '../i18n';
import { UserCustomIcon } from '../types';

interface UploadCustomIconModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadIcons: (newIcons: UserCustomIcon[]) => void;
  language: AppLanguage;
  onError?: (msg: string) => void;
}

export const UploadCustomIconModal: React.FC<UploadCustomIconModalProps> = ({
  isOpen,
  onClose,
  onUploadIcons,
  language,
  onError
}) => {
  const t = UI_TRANSLATIONS[language];
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const processFile = (file: File): Promise<UserCustomIcon | null> => {
    return new Promise((resolve) => {
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '').trim() || 'Custom Icon';
      const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');

      if (isSvg) {
        const textReader = new FileReader();
        textReader.onload = (te) => {
          const rawSvg = te.target?.result as string;
          if (!rawSvg) {
            resolve(null);
            return;
          }
          const cleanSvg = rawSvg.trim();
          const utf8DataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(cleanSvg)}`;
          resolve({
            id: `user_icon_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            name: fileNameWithoutExt,
            dataUrl: utf8DataUrl,
            svgContent: cleanSvg,
            type: 'image/svg+xml',
            createdAt: Date.now()
          });
        };
        textReader.onerror = () => resolve(null);
        textReader.readAsText(file);
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        const resultStr = e.target?.result as string;
        if (!resultStr) {
          resolve(null);
          return;
        }

        // For raster images, optimize size to max 256x256 to save localStorage quota
        const img = new Image();
        img.onload = () => {
          try {
            const MAX_SIZE = 256;
            let width = img.width;
            let height = img.height;

            if (width > MAX_SIZE || height > MAX_SIZE) {
              if (width > height) {
                height = Math.round((height * MAX_SIZE) / width);
                width = MAX_SIZE;
              } else {
                width = Math.round((width * MAX_SIZE) / height);
                height = MAX_SIZE;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, width, height);
              const optimizedDataUrl = canvas.toDataURL(file.type.includes('png') || file.type.includes('icon') ? 'image/png' : 'image/webp', 0.95);
              resolve({
                id: `user_icon_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
                name: fileNameWithoutExt,
                dataUrl: optimizedDataUrl,
                type: file.type || 'image/png',
                createdAt: Date.now()
              });
              return;
            }
          } catch (err) {
            console.warn('Canvas optimization error, falling back to original', err);
          }

          resolve({
            id: `user_icon_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            name: fileNameWithoutExt,
            dataUrl: resultStr,
            type: file.type,
            createdAt: Date.now()
          });
        };

        img.onerror = () => {
          resolve({
            id: `user_icon_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            name: fileNameWithoutExt,
            dataUrl: resultStr,
            type: file.type,
            createdAt: Date.now()
          });
        };

        img.src = resultStr;
      };

      reader.onerror = () => {
        resolve(null);
      };

      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter(f => 
      f.type.startsWith('image/') || 
      /\.(svg|png|ico|webp|jpg|jpeg|gif)$/i.test(f.name)
    );

    if (files.length === 0) {
      if (onError) {
        onError(language === 'en' ? 'Please select valid image files (PNG, SVG, ICO, WebP, etc.).' : 'Пожалуйста, выберите файлы изображений (PNG, SVG, ICO, WebP и т.д.).');
      }
      return;
    }

    setIsProcessing(true);
    try {
      const promises = files.map(file => processFile(file));
      const results = await Promise.all(promises);
      const validIcons = results.filter((icon): icon is UserCustomIcon => icon !== null);

      if (validIcons.length > 0) {
        onUploadIcons(validIcons);
        onClose();
      }
    } catch (err) {
      console.error('Error uploading icons:', err);
      if (onError) {
        onError(language === 'en' ? 'Error loading image files' : 'Ошибка при загрузке файлов изображений');
      }
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 no-print animate-in fade-in duration-200">
      <div 
        className="fixed inset-0 bg-stone-900/60 dark:bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div 
        className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col relative z-10 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center bg-stone-50/90 dark:bg-stone-850/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 dark:bg-amber-500/25 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
              <Icons.UploadCloud size={22} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100 leading-snug">
                {t.uploadCustomIconModalTitle}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {t.uploadCustomIconModalDesc}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <Icons.X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-4">
          {/* Informational Guidelines Card */}
          <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/25 border border-amber-200/80 dark:border-amber-800/50 flex flex-col gap-2.5 text-stone-700 dark:text-stone-300">
            <div className="flex items-center gap-2 font-bold text-xs text-amber-800 dark:text-amber-300 uppercase tracking-wide">
              <Icons.Info size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{t.uploadCustomIconNoticeTitle}</span>
            </div>
            <ul className="text-xs space-y-1.5 pl-5 list-disc text-stone-700 dark:text-stone-300 leading-relaxed">
              <li>
                <span className="font-semibold text-stone-900 dark:text-stone-100">
                  {language === 'en' ? 'Minimum size: ' : 'Минимальный размер: '}
                </span>
                {t.uploadCustomIconRec1}
              </li>
              <li>
                <span className="font-semibold text-stone-900 dark:text-stone-100">
                  {language === 'en' ? 'Aspect ratio: ' : 'Пропорция: '}
                </span>
                {t.uploadCustomIconRec2}
              </li>
              <li>
                <span className="font-semibold text-stone-900 dark:text-stone-100">
                  {language === 'en' ? 'Transparent background: ' : 'Прозрачный фон: '}
                </span>
                {t.uploadCustomIconRec3}
              </li>
              <li>
                <span className="font-semibold text-stone-900 dark:text-stone-100">
                  {language === 'en' ? 'Formats: ' : 'Форматы: '}
                </span>
                {t.uploadCustomIconRec4}
              </li>
              <li className="text-amber-700 dark:text-amber-400 font-medium">
                <span className="font-semibold">
                  {language === 'en' ? 'SVG icons: ' : 'SVG-иконки: '}
                </span>
                {t.uploadCustomIconRec5}
              </li>
            </ul>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 scale-[1.01]'
                : 'border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-850/40 hover:border-amber-500/70 hover:bg-stone-100/50 dark:hover:bg-stone-800/40'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
              <Icons.FolderPlus size={24} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-200">
                {t.uploadDropHint}
              </span>
              <span className="text-[11px] text-stone-400 dark:text-stone-500">
                {t.uploadDropSub}
              </span>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".png,.svg,.ico,.webp,.jpg,.jpeg,.gif,image/png,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,image/webp,image/jpeg,image/gif,image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-2.5 bg-stone-50/90 dark:bg-stone-850/90">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-750 rounded-lg transition-colors cursor-pointer"
          >
            {t.cancelBtn}
          </button>
          
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Icons.Loader2 size={16} className="animate-spin" />
                <span>{language === 'en' ? 'Processing...' : 'Обработка...'}</span>
              </>
            ) : (
              <>
                <Icons.FolderOpen size={16} />
                <span>{t.uploadSelectFilesBtn}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
