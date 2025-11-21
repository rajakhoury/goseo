import React, { useState } from 'react';
import { useSettings } from '../../contexts/settingsCore';
import Input from '../common/Input';
import Switch from '../common/Switch';
import { BiReset } from 'react-icons/bi';
import Button from '../common/Button';
import { ValidationErrors, defaultWordAnalysisSettings } from './types';

type WordAnalysisSettingsProps = Record<string, never>;

const WordAnalysisSettings: React.FC<WordAnalysisSettingsProps> = () => {
  const { settings, updateComponentSettings } = useSettings();
  const wordSettings = settings.components.wordAnalysis;
  const [errors, setErrors] = useState<ValidationErrors>({});

  const handleDensityRangeUpdate = (
    key: 'underOptimized' | 'optimal.max',
    value: string | number
  ) => {
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.]/g, '')) : value;

    if (isNaN(numValue) || numValue < 0 || numValue > 100) {
      setErrors((prev) => ({
        ...prev,
        densityRanges: {
          ...prev.densityRanges,
          [key]: 'Must be a positive number between 0 and 100',
        },
      }));

      const defaultValue =
        key === 'optimal.max'
          ? defaultWordAnalysisSettings.densityRanges.optimal.max
          : defaultWordAnalysisSettings.densityRanges.underOptimized;

      updateComponentSettings('wordAnalysis', {
        densityRanges: {
          ...wordSettings.densityRanges,
          ...(key === 'optimal.max'
            ? { optimal: { max: defaultValue } }
            : { underOptimized: defaultValue }),
        },
      });
      return;
    }

    const currentRanges = { ...wordSettings.densityRanges };
    const proposedRanges = {
      ...currentRanges,
      ...(key === 'optimal.max' ? { optimal: { max: numValue } } : { underOptimized: numValue }),
    };

    if (proposedRanges.underOptimized >= proposedRanges.optimal.max) {
      setErrors((prev) => ({
        ...prev,
        densityRanges: {
          ...prev.densityRanges,
          [key]: 'Under-optimized must be less than optimal maximum',
        },
      }));
      updateComponentSettings('wordAnalysis', {
        densityRanges: defaultWordAnalysisSettings.densityRanges,
      });
      return;
    }

    setErrors((prev) => ({
      ...prev,
      densityRanges: {
        ...prev.densityRanges,
        [key]: undefined,
      },
    }));

    updateComponentSettings('wordAnalysis', {
      densityRanges: proposedRanges,
    });
  };

  const resetToDefaults = () => {
    updateComponentSettings('wordAnalysis', {
      ...defaultWordAnalysisSettings,
      caseSensitive: defaultWordAnalysisSettings.caseSensitive,
      densityRanges: {
        underOptimized: defaultWordAnalysisSettings.densityRanges.underOptimized,
        optimal: {
          max: defaultWordAnalysisSettings.densityRanges.optimal.max,
        },
      },
    });
    setErrors({});
  };

  return (
    <div className="w-full max-w-full">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700 gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate">
            Word Analysis Settings
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">
            Configure how words and phrases are analyzed
          </p>
        </div>
        <div className="flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            icon={<BiReset className="h-4 w-4" />}
            onClick={resetToDefaults}
          >
            Reset
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Basic Configuration
          </h4>

          <div className="mt-4">
            <Switch
              checked={wordSettings.caseSensitive}
              onChange={(checked) =>
                updateComponentSettings('wordAnalysis', { caseSensitive: checked })
              }
              label={<span className="text-gray-900 dark:text-gray-100">Case Sensitive</span>}
              description="Match exact letter casing when analyzing text"
              labelPosition="left"
              srText="Toggle case sensitivity"
            />
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Density Thresholds
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Under-optimized
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">Below this %</span>
              </label>
              <Input
                type="number"
                value={wordSettings.densityRanges.underOptimized}
                onChange={(e) =>
                  handleDensityRangeUpdate('underOptimized', parseFloat(e.target.value))
                }
                step="0.1"
                min="0"
                max="100"
                className="mt-1"
                error={errors.densityRanges?.underOptimized}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Optimal Max
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">Above this %</span>
              </label>
              <Input
                type="number"
                value={wordSettings.densityRanges.optimal.max}
                onChange={(e) =>
                  handleDensityRangeUpdate('optimal.max', parseFloat(e.target.value))
                }
                step="0.1"
                min="0"
                max="100"
                className="mt-1"
                error={errors.densityRanges?.optimalMax}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordAnalysisSettings;
