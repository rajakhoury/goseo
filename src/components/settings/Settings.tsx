import React from 'react';
import { TabGroup, TabList, TabPanels, TabPanel, Tab } from '@headlessui/react';
import { BiCog, BiText, BiX } from 'react-icons/bi';
import GlobalSettings from './GlobalSettings';
import WordAnalysisSettings from './WordAnalysisSettings';

interface SettingsProps {
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <BiX className="text-xl text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      <TabGroup>
        <TabList className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 flex space-x-4">
            <Tab
              className={({ selected }) =>
                `py-3 px-4 text-sm font-medium border-b-2 focus:outline-none transition-colors duration-300 ease-out ${
                  selected
                    ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-brand-600 hover:border-brand-500 dark:hover:text-brand-400 dark:hover:border-brand-400'
                }`
              }
            >
              <div className="flex items-center gap-2">
                <BiCog />
                <span>General</span>
              </div>
            </Tab>
            <Tab
              className={({ selected }) =>
                `py-3 px-4 text-sm font-medium border-b-2 focus:outline-none transition-colors duration-300 ease-out ${
                  selected
                    ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-brand-600 hover:border-brand-500 dark:hover:text-brand-400 dark:hover:border-brand-400'
                }`
              }
            >
              <div className="flex items-center gap-2">
                <BiText />
                <span>Keywords</span>
              </div>
            </Tab>
          </div>
        </TabList>
        <TabPanels className="flex-1 overflow-y-auto">
          <TabPanel className="p-4">
            <GlobalSettings />
          </TabPanel>
          <TabPanel className="p-4">
            <WordAnalysisSettings />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
};

export default Settings;
