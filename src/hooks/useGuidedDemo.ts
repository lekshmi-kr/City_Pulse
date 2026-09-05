import { useState, useEffect, useCallback } from 'react';

export interface DemoStep {
  scenarioId: string;
  durationMs: number;
  captionEn: string;
  captionMl: string;
}

export const DEMO_STEPS: DemoStep[] = [
  {
    scenarioId: 'normal',
    durationMs: 15000,
    captionEn: 'Step 1/3: Normal Baseline Conditions. Clear sky, low flood risk across all city sectors.',
    captionMl: 'ഘട്ടം 1/3: സാധാരണ സിറ്റി സ്ഥിതി. കാലാവസ്ഥ തെളിഞ്ഞതും കുറഞ്ഞ ഫ്ലഡ് റിസ്ക്കും.',
  },
  {
    scenarioId: 'monsoon',
    durationMs: 15000,
    captionEn: 'Step 2/3: Heavy Monsoon Rain. Extreme 65mm/hr rain; Killi River & Thampanoor flood risk escalates to HIGH.',
    captionMl: 'ഘട്ടം 2/3: ശക്തമായ മഴ. തമ്പാനൂർ, കില്ലിയാർ മേഖലകളിൽ ഫ്ലഡ് റിസ്ക് HIGH ആയി ഉയർന്നു.',
  },
  {
    scenarioId: 'rush',
    durationMs: 15000,
    captionEn: 'Step 3/3: Evening Rush Hour. Heavy MG Road commuter congestion; traffic risk HIGH.',
    captionMl: 'ഘട്ടം 3/3: വൈകുന്നേരത്തെ ഗതാഗത തിരക്ക്. എം.ജി റോഡിൽ ഗതാഗത സ്തംഭനം.',
  },
];

export function useGuidedDemo(onSelectScenario: (scenarioId: string) => void) {
  const [isDemoActive, setIsDemoActive] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  const startDemo = useCallback(() => {
    setIsDemoActive(true);
    setCurrentStepIndex(0);
    onSelectScenario(DEMO_STEPS[0].scenarioId);
  }, [onSelectScenario]);

  const stopDemo = useCallback(() => {
    setIsDemoActive(false);
  }, []);

  useEffect(() => {
    if (!isDemoActive) return;

    const step = DEMO_STEPS[currentStepIndex];
    const timer = setTimeout(() => {
      const nextIndex = (currentStepIndex + 1) % DEMO_STEPS.length;
      setCurrentStepIndex(nextIndex);
      onSelectScenario(DEMO_STEPS[nextIndex].scenarioId);
    }, step.durationMs);

    return () => clearTimeout(timer);
  }, [isDemoActive, currentStepIndex, onSelectScenario]);

  return {
    isDemoActive,
    currentStepIndex,
    currentStep: DEMO_STEPS[currentStepIndex],
    startDemo,
    stopDemo,
  };
}
