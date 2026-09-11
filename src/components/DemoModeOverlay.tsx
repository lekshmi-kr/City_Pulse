import React from 'react';
import type { DemoStep } from '@/hooks/useGuidedDemo';
import { useLanguage } from '@/context/LanguageContext';
import { Play, Square, Sparkles } from 'lucide-react';

interface DemoModeOverlayProps {
  isActive: boolean;
  currentStep: DemoStep;
  onStop: () => void;
}

export default function DemoModeOverlay({ isActive, currentStep, onStop }: DemoModeOverlayProps) {
  const { language } = useLanguage();
  if (!isActive) return null;

  const caption = language === 'ml' ? currentStep.captionMl : currentStep.captionEn;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 w-full max-w-2xl px-4 animate-bounce-short">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-sky-500/50 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-md ring-2 ring-sky-500/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 ring-1 ring-sky-400">
            <Sparkles className="h-5 w-5 text-sky-400 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                Guided Competition Demo Mode
              </span>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
              </span>
            </div>
            <p className="mt-0.5 text-xs font-medium leading-snug text-slate-200">{caption}</p>
          </div>
        </div>

        <button
          onClick={onStop}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/30 transition-all"
        >
          <Square className="h-3.5 w-3.5 fill-current" />
          Exit Demo
        </button>
      </div>
    </div>
  );
}
