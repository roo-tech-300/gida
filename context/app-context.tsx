import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';

interface AppConfigContextType {
  isDarkMode: boolean;
}

const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined);

export function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const isDarkMode = systemColorScheme === 'dark';

  return (
    <AppConfigContext.Provider value={{ isDarkMode }}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  const context = useContext(AppConfigContext);
  if (!context) throw new Error('useAppConfig must be used within an AppConfigProvider');
  return context;
}
