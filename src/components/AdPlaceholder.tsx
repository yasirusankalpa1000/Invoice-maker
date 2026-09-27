import React, { useEffect } from 'react';
import { translations, Language } from '../utils/i18n';
import { getMonetizationConfig } from '../utils/monetizationConfig';

interface AdPlaceholderProps {
  format?: 'horizontal' | 'rectangle';
  lang: Language;
}

export const AdPlaceholder: React.FC<AdPlaceholderProps> = ({ format = 'horizontal', lang }) => {
  const t = translations[lang];
  const config = getMonetizationConfig();

  // If ads are disabled in owner settings, do not render
  if (!config.adsEnabled) return null;

  return (
    <div className="no-print my-4 w-full">
      <div
        className={`mx-auto flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800/80 bg-slate-900/50 p-4 text-center transition-colors hover:border-slate-700 ${
          format === 'horizontal' ? 'min-h-[90px] max-w-4xl' : 'min-h-[250px] max-w-sm'
        }`}
      >
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
          {t.bannerAdText || 'Sponsored Advertisement'}
        </span>
        <p className="mt-1 text-[11px] text-slate-500">
          Clean Family-Friendly Ad Space (Google AdSense Ready)
        </p>
        <span className="mt-1 text-[9px] text-slate-600 font-mono">
          ID: {config.adsenseClientId}
        </span>
      </div>
    </div>
  );
};
