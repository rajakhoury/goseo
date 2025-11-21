import React from 'react';
import { useSettings } from '../../contexts/settingsCore';
import Select from '../common/Select';
import { BiReset } from 'react-icons/bi';
import Button from '../common/Button';
import type { ThemeOption } from './types';

const GlobalSettings: React.FC = () => {
  const { settings, updateGlobalSettings, resetSettings } = useSettings();

  const themeOptions: ThemeOption[] = [
    { id: 'light', name: 'Light', value: 'light' },
    { id: 'dark', name: 'Dark', value: 'dark' },
    { id: 'system', name: 'System', value: 'system' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Global Settings</h3>
        <Button
          variant="ghost"
          size="sm"
          icon={<BiReset className="h-4 w-4" />}
          onClick={resetSettings}
        >
          Reset All Settings
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Theme
          </label>
          <Select<ThemeOption>
            options={themeOptions}
            value={themeOptions.find((opt) => opt.value === settings.global.theme)!}
            onChange={(option) => updateGlobalSettings({ theme: option.value })}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
};

export default GlobalSettings;
