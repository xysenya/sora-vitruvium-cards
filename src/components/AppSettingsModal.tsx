import React, { useRef } from 'react';
import * as Icons from 'lucide-react';
import { AppSettings, AppLanguage, AppTheme, UI_TRANSLATIONS } from '../i18n';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onResetData: () => void;
}

const BG_COLOR_PRESETS = [
  { name: 'Каменный (По умолчанию)', value: '#f5f5f4' },
  { name: 'Теплый пергамент', value: '#fbf7ee' },
  { name: 'Античный свиток', value: '#ece6d8' },
  { name: 'Тёмный сланец', value: '#1c1917' },
  { name: 'Глубокая ночь', value: '#0f172a' },
  { name: 'Хвойный лес', value: '#06281e' },
  { name: 'Таинственный аметист', value: '#24122e' },
];

export const AppSettingsModal: React.FC<AppSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = UI_TRANSLATIONS[settings.language] || UI_TRANSLATIONS.ru;
  const isDark = settings.theme === 'dark';

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onUpdateSettings({ pageBgImage: result });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleClearImage = () => {
    onUpdateSettings({ pageBgImage: '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print select-none">
      <div 
        className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      <div className={`w-full max-w-xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col relative z-10 max-h-[90vh] transition-colors ${
        isDark ? 'bg-stone-900 border-stone-750 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b flex justify-between items-center ${
          isDark ? 'bg-stone-950 border-stone-800' : 'bg-stone-50 border-stone-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Icons.Settings size={18} className="animate-spin-slow" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base tracking-wide leading-none">
                {t.appSettingsTitle}
              </h3>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                {t.appSettingsDesc}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-stone-400 hover:text-stone-100 hover:bg-stone-800' : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Icons.X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className={`p-5 flex-1 overflow-y-auto space-y-6 ${isDark ? 'bg-stone-900/50' : 'bg-stone-50/50'}`}>
          
          {/* 1. Language Selection */}
          <div className={`p-4 rounded-xl border shadow-sm space-y-3 ${
            isDark ? 'bg-stone-850/80 border-stone-750' : 'bg-white border-stone-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icons.Globe size={16} className="text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {t.languageSection}
                </span>
              </div>
              <span className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                {settings.language === 'ru' ? 'Русский' : 'English'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onUpdateSettings({ language: 'ru' })}
                className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                  settings.language === 'ru'
                    ? 'border-amber-500 bg-amber-500/10 shadow-sm ring-2 ring-amber-500/20'
                    : isDark
                    ? 'border-stone-750 bg-stone-800 hover:border-stone-600'
                    : 'border-stone-200 bg-stone-50 hover:border-stone-300'
                }`}
              >
                <span className="text-2xl">🇷🇺</span>
                <div className="text-left flex-1 min-w-0">
                  <div className="text-xs font-bold tracking-tight">Русский</div>
                  <div className={`text-[10px] truncate ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>По умолчанию</div>
                </div>
                {settings.language === 'ru' && (
                  <Icons.Check size={16} className="text-amber-500 shrink-0 font-bold" />
                )}
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ language: 'en' })}
                className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                  settings.language === 'en'
                    ? 'border-amber-500 bg-amber-500/10 shadow-sm ring-2 ring-amber-500/20'
                    : isDark
                    ? 'border-stone-750 bg-stone-800 hover:border-stone-600'
                    : 'border-stone-200 bg-stone-50 hover:border-stone-300'
                }`}
              >
                <span className="text-2xl">🇬🇧</span>
                <div className="text-left flex-1 min-w-0">
                  <div className="text-xs font-bold tracking-tight">English</div>
                  <div className={`text-[10px] truncate ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>International</div>
                </div>
                {settings.language === 'en' && (
                  <Icons.Check size={16} className="text-amber-500 shrink-0 font-bold" />
                )}
              </button>
            </div>
          </div>

          {/* 2. Theme Selection */}
          <div className={`p-4 rounded-xl border shadow-sm space-y-3 ${
            isDark ? 'bg-stone-850/80 border-stone-750' : 'bg-white border-stone-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icons.SunMedium size={16} className="text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {t.themeSection}
                </span>
              </div>
              <span className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                {settings.theme === 'light' ? t.themeLight : t.themeDark}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'light', pageBgColor: '#f5f5f4' })}
                className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                  settings.theme === 'light'
                    ? 'border-amber-500 bg-amber-500/10 shadow-sm ring-2 ring-amber-500/20'
                    : isDark
                    ? 'border-stone-750 bg-stone-800 hover:border-stone-600'
                    : 'border-stone-200 bg-stone-50 hover:border-stone-300'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
                  <Icons.Sun size={18} />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="text-xs font-bold tracking-tight">{t.themeLight}</div>
                  <div className={`text-[10px] truncate ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    {settings.language === 'ru' ? 'Классическая' : 'Classic Parchment'}
                  </div>
                </div>
                {settings.theme === 'light' && (
                  <Icons.Check size={16} className="text-amber-500 shrink-0 font-bold" />
                )}
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'dark', pageBgColor: '#1c1917' })}
                className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                  settings.theme === 'dark'
                    ? 'border-amber-500 bg-amber-500/10 shadow-sm ring-2 ring-amber-500/20'
                    : isDark
                    ? 'border-stone-750 bg-stone-800 hover:border-stone-600'
                    : 'border-stone-200 bg-stone-50 hover:border-stone-300'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center text-amber-400 shrink-0">
                  <Icons.Moon size={18} />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="text-xs font-bold tracking-tight">{t.themeDark}</div>
                  <div className={`text-[10px] truncate ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    {settings.language === 'ru' ? 'Тёмный зал' : 'Deep Slate'}
                  </div>
                </div>
                {settings.theme === 'dark' && (
                  <Icons.Check size={16} className="text-amber-500 shrink-0 font-bold" />
                )}
              </button>
            </div>
          </div>

          {/* 3. Page Background Customization */}
          <div className={`p-4 rounded-xl border shadow-sm space-y-4 ${
            isDark ? 'bg-stone-850/80 border-stone-750' : 'bg-white border-stone-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icons.Palette size={16} className="text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {t.backgroundSection}
                </span>
              </div>
            </div>

            {/* Background Color Picker */}
            <div className="space-y-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                isDark ? 'text-stone-400' : 'text-stone-500'
              }`}>
                {t.backgroundColorLabel}
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {BG_COLOR_PRESETS.map((preset) => {
                  const isSelected = (settings.pageBgColor || '#f5f5f4').toLowerCase() === preset.value.toLowerCase();
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => onUpdateSettings({ pageBgColor: preset.value })}
                      className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center shrink-0 cursor-pointer hover:scale-110 active:scale-95 ${
                        isSelected
                          ? 'border-amber-500 scale-105 shadow-md ring-2 ring-amber-500/30'
                          : isDark ? 'border-stone-700' : 'border-stone-200'
                      }`}
                      style={{ backgroundColor: preset.value }}
                      title={preset.name}
                    >
                      {isSelected && (
                        <Icons.Check 
                          size={13} 
                          className={['#f5f5f4', '#fbf7ee', '#ece6d8'].includes(preset.value) ? 'text-stone-900 font-bold' : 'text-white font-bold'} 
                        />
                      )}
                    </button>
                  );
                })}

                {/* Custom Color Input */}
                <div className={`flex items-center gap-1.5 border rounded-full px-2 py-0.5 shrink-0 ${
                  isDark ? 'bg-stone-800 border-stone-700' : 'bg-stone-100 border-stone-200'
                }`}>
                  <div className="relative flex items-center shrink-0 w-5 h-5">
                    <input
                      type="color"
                      value={settings.pageBgColor || '#f5f5f4'}
                      onChange={(e) => onUpdateSettings({ pageBgColor: e.target.value })}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      title={settings.language === 'ru' ? "Выбрать свой цвет" : "Pick custom color"}
                    />
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center pointer-events-none ${
                      isDark ? 'border-stone-600 bg-stone-700' : 'border-stone-300 bg-white'
                    }`}>
                      <Icons.Pipette size={11} className={isDark ? 'text-stone-300' : 'text-stone-600'} />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={(settings.pageBgColor || '#f5f5f4').toUpperCase()}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val && !val.startsWith('#') && /^[0-9a-fA-F]{1,6}$/.test(val)) {
                        val = '#' + val;
                      }
                      if (/^#[0-9a-fA-F]{0,6}$/.test(val)) {
                        onUpdateSettings({ pageBgColor: val });
                      }
                    }}
                    className={`text-[10px] font-mono font-bold bg-transparent w-[58px] focus:outline-none uppercase border-none p-0 ${
                      isDark ? 'text-stone-200' : 'text-stone-700'
                    }`}
                  />
                </div>

                {/* Reset Color */}
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ pageBgColor: settings.theme === 'dark' ? '#1c1917' : '#f5f5f4' })}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-750'
                      : 'bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200'
                  }`}
                  title={settings.language === 'ru' ? "Сбросить на цвет темы" : "Reset to theme color"}
                >
                  <Icons.RotateCcw size={11} className="inline mr-1" />
                  <span>{settings.language === 'ru' ? 'Сброс цвета' : 'Reset Color'}</span>
                </button>
              </div>
            </div>

            {/* Background Image Upload */}
            <div className="space-y-2 pt-2 border-t border-stone-200/50 dark:border-stone-800">
              <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                isDark ? 'text-stone-400' : 'text-stone-500'
              }`}>
                {t.backgroundImageLabel}
              </span>

              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold shadow-sm transition-all cursor-pointer ${
                    isDark
                      ? 'bg-stone-800 hover:bg-stone-750 border-stone-700 text-amber-400'
                      : 'bg-white hover:bg-stone-50 border-stone-300 text-amber-700'
                  }`}
                >
                  <Icons.Image size={15} />
                  <span>{t.uploadBgImageBtn}</span>
                </button>

                {settings.pageBgImage && (
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 text-xs font-bold transition-all cursor-pointer"
                    title={t.clearBgImageBtn}
                  >
                    <Icons.Trash2 size={14} />
                    <span>{t.clearBgImageBtn}</span>
                  </button>
                )}
              </div>

              {/* Background Image Preview & Layout Options */}
              {settings.pageBgImage && (
                <div className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center gap-3 ${
                  isDark ? 'bg-stone-900 border-stone-750' : 'bg-stone-100 border-stone-200'
                }`}>
                  <div className="w-16 h-12 rounded-lg border overflow-hidden shrink-0 relative bg-black/20">
                    <img 
                      src={settings.pageBgImage} 
                      alt="Custom background" 
                      className="w-full h-full object-cover" 
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 flex-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider mr-1 ${
                      isDark ? 'text-stone-400' : 'text-stone-500'
                    }`}>
                      {settings.language === 'ru' ? 'Режим:' : 'Mode:'}
                    </span>
                    {(['cover', 'repeat', 'center'] as const).map((fitMode) => {
                      const isFitActive = (settings.pageBgFit || 'cover') === fitMode;
                      const fitLabel = fitMode === 'cover' 
                        ? t.bgFitCover 
                        : fitMode === 'repeat' 
                        ? t.bgFitRepeat 
                        : t.bgFitCenter;
                      return (
                        <button
                          key={fitMode}
                          type="button"
                          onClick={() => onUpdateSettings({ pageBgFit: fitMode })}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                            isFitActive
                              ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-sm'
                              : isDark
                              ? 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-750'
                              : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          {fitLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Danger Zone: Reset All Data */}
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-red-500">
              <Icons.AlertTriangle size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">
                {t.resetDataSection}
              </span>
            </div>

            <p className={`text-xs leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
              {t.resetDataSectionDesc}
            </p>

            <button
              type="button"
              onClick={() => {
                onClose();
                onResetData();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600/90 hover:bg-red-600 text-white font-bold text-xs shadow-md active:scale-98 transition-all cursor-pointer border border-red-500/50"
            >
              <Icons.RotateCcw size={15} />
              <span>{t.resetDataBtn}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex justify-end ${
          isDark ? 'bg-stone-950 border-stone-800' : 'bg-stone-50 border-stone-200'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
          >
            {t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
