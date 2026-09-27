import React, { useState } from 'react';
import { Smartphone, Download, Share2, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Language } from '../utils/i18n';

interface PWAInstallBannerProps {
  lang: Language;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ lang }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) return null;
  if (!isInstallable && !isIOS) return null;

  return (
    <>
      <div className="no-print mb-4 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 p-3 sm:p-3.5 backdrop-blur-md flex items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-white">
                {lang === 'si' ? 'දුරකථනයට App එකක් ලෙස Install කරගන්න' : 'Install QuickInvoice as Mobile App'}
              </span>
              <span className="rounded bg-emerald-500/10 px-1 py-0.2 text-[9px] font-bold text-emerald-400 border border-emerald-500/20">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {lang === 'si'
                ? 'Play Store අවශ්‍ය නැත. Offline ක්‍රියා කරයි, වේගවත් සහ 100% නොමිලේ.'
                : 'Zero app store download. Works offline with 1-tap home screen access.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isInstallable && (
            <button
              onClick={install}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-md transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>{lang === 'si' ? 'Install කරන්න' : 'Install App'}</span>
            </button>
          )}

          {isIOS && (
            <button
              onClick={() => setShowIOSModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-white border border-slate-700 transition-all cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5 text-teal-400" />
              <span>{lang === 'si' ? 'iPhone Install' : 'Install on iOS'}</span>
            </button>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* iOS Safari Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Share2 className="h-4 w-4 text-emerald-400" />
              <span>{lang === 'si' ? 'iPhone / iPad හි Install කරගන්නේ කෙසේද?' : 'Install on iPhone / iPad'}</span>
            </h3>
            <div className="mt-3 space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-emerald-400 shrink-0 mt-0.5">1</span>
                <p>Safari browser එකේ පහළ ඇති <strong>Share</strong> බොත්තම (Square with arrow) ඔබන්න.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-emerald-400 shrink-0 mt-0.5">2</span>
                <p>පහළට Scroll කර <strong>"Add to Home Screen"</strong> තෝරන්න.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-emerald-400 shrink-0 mt-0.5">3</span>
                <p>දැන් ඔබගේ Phone එකේ සාමාන්‍ය App එකක් මෙන් Screen එකෙන් විවෘත කළ හැක!</p>
              </div>
            </div>
            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-4 w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2 text-xs font-bold text-white transition-all"
            >
              {lang === 'si' ? 'තේරුණා (Close)' : 'Got it!'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
