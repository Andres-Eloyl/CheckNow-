"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * AI Context: ConfigState defines the global UI and feature flags for the application.
 * This state is usually initialized once and controls styling (colors) and feature toggles (tips).
 */
interface ConfigState {
  /** Enables or disables the tip selector in the checkout flow. */
  tipsEnabled: boolean;
  /** Available tip percentages (e.g., [5, 10, 15] for 5%, 10%, 15%). */
  tipPercentages: number[];
  /** Primary brand color applied as a CSS variable globally. */
  primaryColor: string;
  /** Name of the restaurant displayed in headers and receipts. */
  restaurantName: string;
}

/**
 * AI Context: Type definition for the Context value.
 * `updateConfig` allows partial updates to merging new values with the existing config.
 */
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

/**
 * Global provider for application configuration.
 * AI Context: It injects a `<style>` tag to dynamically set global CSS variables (e.g., `--color-primary`)
 * which Tailwind CSS uses to theme the application on-the-fly.
 */
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

/**
 * Custom hook to consume the ConfigContext.
 * @throws {Error} If called outside of a ConfigProvider.
 */
export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
