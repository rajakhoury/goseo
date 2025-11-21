import React, { useState, useEffect } from 'react';
import { TabGroup, TabList, TabPanels, TabPanel, Tab } from '@headlessui/react';
import clsx from 'clsx';
import { BiCog } from 'react-icons/bi';
import Overview from '../components/overview/Overview';
import WordAnalysis from '../components/words/WordAnalysis';
import Settings from '../components/settings/Settings';
import Headings from '../components/headings/Headings';
import Images from '../components/images/Images';
import Links from '../components/links/Links';
import Schema from '../components/schema/Schema';
import Tools from '../components/tools/Tools';
import logo from '../assets/brand/logo.png';

const Popup: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    chrome.storage.local.get({ lastUsedTab: 0 }, (result) => {
      const r = result as { lastUsedTab: number };
      setSelectedTab(r.lastUsedTab);
    });
  }, []);

  const handleTabChange = (index: number) => {
    setSelectedTab(index);
    chrome.storage.local.set({ lastUsedTab: index });
  };

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ tab: string | number }>;
      const detail = ce.detail;
      const tabMap: Record<string, number> = {
        overview: 0,
        keywords: 1,
        headings: 2,
        images: 3,
        links: 4,
        schema: 5,
        tools: 6,
      };
      const target =
        typeof detail?.tab === 'number' ? detail.tab : tabMap[String(detail?.tab).toLowerCase()];
      if (typeof target === 'number') {
        handleTabChange(target);
      }
    };
    window.addEventListener('navigate-tab', handler as EventListener);
    return () => {
      window.removeEventListener('navigate-tab', handler as EventListener);
    };
  }, []);

  return (
    <div className="w-[800px] h-[600px] flex flex-col bg-white dark:bg-gray-900 overflow-x-hidden">
      {showSettings ? (
        <Settings onClose={() => setShowSettings(false)} />
      ) : (
        <TabGroup
          selectedIndex={selectedTab}
          onChange={handleTabChange}
          className="flex flex-col h-full"
        >
          <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center px-4">
              <div className="flex items-center py-2 pr-4 border-r border-gray-200 dark:border-gray-700">
                <div className="h-8 w-8 flex items-center justify-center">
                  <img src={logo} alt="Logo" className="h-full w-full object-contain" />
                </div>
              </div>

              {/* Navigation Tabs */}
              <TabList className="flex flex-1 gap-4 px-4">
                <Tab
                  className={({ selected }) =>
                    clsx(
                      'py-3 px-3 text-sm font-medium border-b-2 focus:outline-none transition-colors duration-300 ease-out',
                      selected
                        ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                        : 'border-transparent text-gray-500 hover:text-brand-600 hover:border-brand-500 dark:text-gray-400 dark:hover:text-brand-400 dark:hover:border-brand-400'
                    )
                  }
                >
                  <div className="flex items-center gap-2">
                    <span>Overview</span>
                  </div>
                </Tab>
                <Tab
                  className={({ selected }) =>
                    clsx(
                      'py-3 px-3 text-sm font-medium border-b-2 focus:outline-none transition-colors duration-300 ease-out',
                      selected
                        ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                        : 'border-transparent text-gray-500 hover:text-brand-600 hover:border-brand-500 dark:text-gray-400 dark:hover:text-brand-400 dark:hover:border-brand-400'
                    )
                  }
                >
                  <div className="flex items-center gap-2">
                    <span>Keywords</span>
                  </div>
                </Tab>
                <Tab
                  className={({ selected }) =>
                    clsx(
                      'py-3 px-3 text-sm font-medium border-b-2 focus:outline-none transition-colors duration-300 ease-out',
                      selected
                        ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                        : 'border-transparent text-gray-500 hover:text-brand-600 hover:border-brand-500 dark:text-gray-400 dark:hover:text-brand-400 dark:hover:border-brand-400'
                    )
                  }
                >
                  <div className="flex items-center gap-2">
                    <span>Headings</span>
                  </div>
                </Tab>
                <Tab
                  className={({ selected }) =>
                    clsx(
                      'py-3 px-3 text-sm font-medium border-b-2 focus:outline-none transition-colors duration-300 ease-out',
                      selected
                        ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                        : 'border-transparent text-gray-500 hover:text-brand-600 hover:border-brand-500 dark:text-gray-400 dark:hover:text-brand-400 dark:hover:border-brand-400'
                    )
                  }
                >
                  <div className="flex items-center gap-2">
                    <span>Images</span>
                  </div>
                </Tab>
                <Tab
                  className={({ selected }) =>
                    clsx(
                      'py-3 px-3 text-sm font-medium border-b-2 focus:outline-none transition-colors duration-300 ease-out',
                      selected
                        ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                        : 'border-transparent text-gray-500 hover:text-brand-600 hover:border-brand-500 dark:text-gray-400 dark:hover:text-brand-400 dark:hover:border-brand-400'
                    )
                  }
                >
                  <div className="flex items-center gap-2">
                    <span>Links</span>
                  </div>
                </Tab>
                <Tab
                  className={({ selected }) =>
                    clsx(
                      'py-3 px-3 text-sm font-medium border-b-2 focus:outline-none transition-colors duration-300 ease-out',
                      selected
                        ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                        : 'border-transparent text-gray-500 hover:text-brand-600 hover:border-brand-500 dark:text-gray-400 dark:hover:text-brand-400 dark:hover:border-brand-400'
                    )
                  }
                >
                  <div className="flex items-center gap-2">
                    <span>Schema</span>
                  </div>
                </Tab>
                <Tab
                  className={({ selected }) =>
                    clsx(
                      'py-3 px-3 text-sm font-medium border-b-2 focus:outline-none',
                      selected
                        ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-400 dark:text-gray-400 dark:hover:text-brand-400 dark:hover:border-brand-400'
                    )
                  }
                >
                  <div className="flex items-center gap-2">
                    <span>Tools</span>
                  </div>
                </Tab>
              </TabList>

              <div className="flex items-center pl-4 border-l border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <BiCog className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            <TabPanels className="h-full flex flex-col">
              <TabPanel className="flex-1 min-h-0">
                <Overview />
              </TabPanel>
              <TabPanel className="flex-1 min-h-0">
                <WordAnalysis />
              </TabPanel>
              <TabPanel className="flex-1 min-h-0">
                <Headings />
              </TabPanel>
              <TabPanel className="flex-1 min-h-0">
                <Images />
              </TabPanel>
              <TabPanel className="flex-1 min-h-0">
                <Links />
              </TabPanel>
              <TabPanel className="flex-1 min-h-0">
                <Schema />
              </TabPanel>
              <TabPanel className="flex-1 min-h-0">
                <Tools />
              </TabPanel>
            </TabPanels>
          </div>
        </TabGroup>
      )}
    </div>
  );
};

export default Popup;
