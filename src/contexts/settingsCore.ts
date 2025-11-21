import { createContext, useContext } from 'react';
import type { Settings, GlobalSettings } from '../components/settings/types';

interface SettingsContextType {
  settings: Settings;
  updateGlobalSettings: (settings: Partial<GlobalSettings>) => Promise<void>;
  updateComponentSettings: <T extends keyof Settings['components']>(
    component: T,
    settings: Partial<Settings['components'][T]>
  ) => Promise<void>;
  resetSettings: () => Promise<void>;
  resetComponentSettings: (component: keyof Settings['components']) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export type { SettingsContextType };
export { SettingsContext, useSettings };
