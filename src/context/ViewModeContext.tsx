import React, { createContext, useContext, useState, useCallback } from 'react';

export type ViewMode = 'citizen' | 'control_room';

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
}

const ViewModeContext = createContext<ViewModeContextType | null>(null);

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>('control_room');

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === 'citizen' ? 'control_room' : 'citizen'));
  }, []);

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode, toggleViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode(): ViewModeContextType {
  const context = useContext(ViewModeContext);
  if (!context) {
    return {
      viewMode: 'control_room',
      setViewMode: () => {},
      toggleViewMode: () => {},
    };
  }
  return context;
}
