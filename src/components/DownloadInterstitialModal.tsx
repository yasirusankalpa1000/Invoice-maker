import React, { useState, useEffect } from 'react';
import { Download, Sparkles, CheckCircle2, ShieldCheck, X, Zap } from 'lucide-react';
import { Language } from '../utils/i18n';

interface DownloadInterstitialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedDownload: () => Promise<boolean>;
  fileName?: string;
  lang: Language;
}

export const DownloadInterstitialModal: React.FC<DownloadInterstitialModalProps> = ({
  isOpen,
  onClose,
  onProceedDownload,
  fileName = 'invoice.pdf',
  lang,
}) => {
  const [countdown, setCountdown] = useState<number>(3);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasTriggeredDownload, setHasTriggeredDownload] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(3);
      setIsReady(false);
      setIsGenerating(false);
      setHasTriggeredDownload(false);
      return;
    }

    setCountdown(3);
    setIsReady(false);
    setHasTriggeredDownload(false);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsReady(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // When countdown hits 0, auto trigger download
  useEffect(() => {
    if (isReady && !hasTriggeredDownload) {
      setHasTriggeredDownload(true);
      executeDownload();
    }
  }, [isReady, hasTriggeredDownload]);

  const executeDownload = async () => {
    setIsGenerating(true);
    try {
      await onProceedDownload();
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Download className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                {lang === 'si' ? 'PDF බාගත කිරීම සූදානම් කරමින්...' : 'Preparing High-Res PDF...'}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">{fileName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Countdown & Status Progress */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-black text-sm">
                {countdown > 0 ? (
                  countdown
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 animate-in zoom-in" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {countdown > 0
                    ? lang === 'si'
                      ? `තත්පර ${countdown} කින් PDF එක බාගත වේ...`
                      : `Download starting in ${countdown}s...`
                    : lang === 'si'
                    ? 'PDF ගොනුව සාර්ථකව සූදානම් විය!'
                    : 'PDF successfully generated!'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {lang === 'si'
                    ? '100% Client-Side Engine · Watermark රහිත නිදහස් සේවාව'
                    : 'High-res A4 vector format · 100% Free & Zero Watermark'}
                </p>
              </div>
            </div>

            {/* Quick Skip button */}
            <button
              onClick={() => {
                if (!hasTriggeredDownload) {
                  setHasTriggeredDownload(true);
                  executeDownload();
                }
              }}
              disabled={isGenerating}
              className="flex items-center gap-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-3 py-1.5 text-xs font-bold text-slate-950 transition-all cursor-pointer shadow-sm"
            >
              <Zap className="h-3 w-3 fill-slate-950" />
              <span>{lang === 'si' ? 'කෙළින්ම බාගත කරන්න' : 'Download Now'}</span>
            </button>
          </div>

          {/* High-eCPM AdSense Responsive Unit / Sponsored Partner Banner */}
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/70 p-4 text-center space-y-2">
            <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-slate-500">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-400" />
                Sponsored Ad / Google AdSense High-eCPM Slot
              </span>
              <span>728x90 / Responsive</span>
            </div>

            {/* Simulated Live Ad Box */}
            <div className="py-5 px-3 rounded-lg bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-500/30">
                  Ad · Partner
                </span>
                <h4 className="text-xs font-bold text-white mt-1">
                  Send & Receive Money Globally with 0% Hidden Markup
                </h4>
                <p className="text-[11px] text-slate-400">
                  Multi-currency accounts for freelancers & international business. Real mid-market rates.
                </p>
              </div>
              <a
                href="https://wise.com"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-emerald-400 border border-slate-700"
              >
                Learn More →
              </a>
            </div>

            <p className="text-[9px] text-slate-500">
              {lang === 'si'
                ? 'QuickInvoice Pro නොමිලේ පවත්වාගෙන යාමට දැන්වීම් උපකාරී වේ.'
                : 'Ads keep QuickInvoice Pro 100% free with unlimited exports.'}
            </p>
          </div>

          {/* Privacy & Guarantee note */}
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Zero Data Uploaded · Your invoice stays private on this device</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-800/80 px-4 py-3 bg-slate-950/60">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {lang === 'si' ? 'වසන්න (Close)' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
