"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ConfigState {
  tipsEnabled: boolean;
  tipPercentages: number[];
  primaryColor: string;
  restaurantName: string;
}

interface ConfigContextType {
  config: ConfigState;
  updateConfig: (newConfig: Partial<ConfigState>) => void;
}

const defaultConfig: ConfigState = {
  tipsEnabled: true,
  tipPercentages: [5, 10, 15],
  primaryColor: '#f47b25',
  restaurantName: 'CheckNow',
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ConfigState>(defaultConfig);

  const updateConfig = (newConfig: Partial<ConfigState>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  return (
    <ConfigContext.Provider value={{ config, updateConfig }}>
      <style>{`:root { --color-primary: ${config.primaryColor}; }`}</style>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
