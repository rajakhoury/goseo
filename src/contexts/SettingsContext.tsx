import React, { useCallback, useEffect } from 'react';
import type { Settings, GlobalSettings } from '../components/settings/types';
import { defaultSettings, SettingsSchema } from '../components/settings/types';
import { initializeTheme, applyTheme } from '../utils/theme';
import { logger } from '../utils/logger';
import { SettingsContext } from './settingsCore';

const validateAndMergeSettings = (stored: unknown): Settings => {
  try {
    const validated = SettingsSchema.parse(stored);
    return validated;
  } catch {
    const s = stored as Partial<Settings> | undefined;
    const mergedSettings = {
      global: {
        ...defaultSettings.global,
        ...(s?.global || {}),
      },
      components: {
        wordAnalysis: {
          ...defaultSettings.components.wordAnalysis,
          ...(s?.components?.wordAnalysis || {}),
        },
      },
    };

    try {
      return SettingsSchema.parse(mergedSettings);
    } catch {
      logger.log('Settings', 'Invalid settings detected, falling back to defaults', 'warn');
      return defaultSettings;
    }
  }
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = React.useState<Settings>(defaultSettings);
  const themeCleanupRef = React.useRef<(() => void) | null>(null);

  useEffect(() => {
    chrome.storage.sync.get(['settings'], (result) => {
      if (result.settings) {
        const validatedSettings = validateAndMergeSettings(result.settings);
        setSettings(validatedSettings);
        // Save validated settings back to storage
        chrome.storage.sync.set({ settings: validatedSettings });
      } else {
        setSettings(defaultSettings);
        chrome.storage.sync.set({ settings: defaultSettings });
      }
    });
  }, []);

  useEffect(() => {
    if (settings.global.theme === 'system') {
      themeCleanupRef.current?.();
      themeCleanupRef.current = initializeTheme('system');
    } else {
      themeCleanupRef.current?.();
      themeCleanupRef.current = null;
      applyTheme(settings.global.theme);
    }

    return () => {
      themeCleanupRef.current?.();
      themeCleanupRef.current = null;
    };
  }, [settings.global.theme]);

  const updateGlobalSettings = useCallback(async (newSettings: Partial<GlobalSettings>) => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        global: {
          ...prev.global,
          ...newSettings,
        },
      };

      try {
        const validated = SettingsSchema.parse(updated);
        chrome.storage.sync.set({ settings: validated });
        return validated;
      } catch (error) {
        logger.log(
          'Settings',
          'Invalid global settings update: ' +
            (error instanceof Error ? error.message : String(error)),
          'error'
        );
        return prev;
      }
    });
  }, []);

  const updateComponentSettings = useCallback(
    async <T extends keyof Settings['components']>(
      component: T,
      newSettings: Partial<Settings['components'][T]>
    ) => {
      setSettings((prev) => {
        const updated = {
          ...prev,
          components: {
            ...prev.components,
            [component]: {
              ...prev.components[component],
              ...newSettings,
            },
          },
        };

        try {
          const validated = SettingsSchema.parse(updated);
          chrome.storage.sync.set({ settings: validated });
          return validated;
        } catch (error) {
          logger.log(
            'Settings',
            `Invalid ${component} settings update: ${error instanceof Error ? error.message : String(error)}`,
            'error'
          );
          return prev;
        }
      });
    },
    []
  );

  const resetSettings = useCallback(async () => {
    setSettings(defaultSettings);
    await chrome.storage.sync.set({ settings: defaultSettings });
  }, []);

  const resetComponentSettings = useCallback(async (component: keyof Settings['components']) => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        components: {
          ...prev.components,
          [component]: defaultSettings.components[component],
        },
      };
      chrome.storage.sync.set({ settings: updated });
      return updated;
    });
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateGlobalSettings,
        updateComponentSettings,
        resetSettings,
        resetComponentSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
