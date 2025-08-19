// src/contexts/FeatureFlagContext.tsx (已修改)

import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import apiClient from '../api/axiosConfig';

export interface FeatureFlag {
    key: string;
    name: string;
    description: string;
    is_enabled: boolean;
}

type FeatureFlagsState = {
    flags: Record<string, boolean>;
    flagsWithDetails: FeatureFlag[];
    isLoading: boolean;
    refetch: () => void;
}

// (修改) 不再导出 useFeatureFlags hook
export const FeatureFlagContext = createContext<FeatureFlagsState | undefined>(undefined);

export const FeatureFlagProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [flags, setFlags] = useState<Record<string, boolean>>({});
    const [flagsWithDetails, setFlagsWithDetails] = useState<FeatureFlag[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchFlags = async () => {
        try {
            const { data } = await apiClient.get<FeatureFlag[]>('/api/admin/feature-flags');
            const flagMap = data.reduce((acc, flag) => {
                acc[flag.key] = flag.is_enabled;
                return acc;
            }, {} as Record<string, boolean>);
            setFlags(flagMap);
            setFlagsWithDetails(data);
        } catch (error) {
            console.error("Critical Error: Failed to fetch feature flags.", error);
            setFlags({});
            setFlagsWithDetails([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFlags();
    }, []);

    return (
        <FeatureFlagContext.Provider value={{ flags, flagsWithDetails, isLoading, refetch: fetchFlags }}>
            {children}
        </FeatureFlagContext.Provider>
    );
};