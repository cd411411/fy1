import React, { createContext, useState, useEffect} from 'react';
import axios from 'axios';
import type { ReactNode } from 'react';

type AppMode = 'court' | 'open';

interface ConfigContextType {
  appMode: AppMode;
  isLoading: boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appMode, setAppMode] = useState<AppMode>('open'); // 默认开源模式
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
        const response = await axios.get<{ app_mode: AppMode }>(`${API_BASE_URL}/api/config/app-mode`);
        setAppMode(response.data.app_mode);
      } catch (error) {
        console.error("Failed to fetch app mode, defaulting to 'open'.", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><span className="loading loading-spinner loading-lg"></span></div>;
  }

  return (
    <ConfigContext.Provider value={{ appMode, isLoading }}>
      {children}
    </ConfigContext.Provider>
  );
};

export { ConfigContext }; // 导出Context以便其他文件使用