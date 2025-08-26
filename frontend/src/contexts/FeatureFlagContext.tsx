// src/contexts/FeatureFlagContext.tsx (最终版)

import React, { createContext, useContext, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // (新增)
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

export const FeatureFlagContext = createContext<FeatureFlagsState | undefined>(undefined);

// fetch 函数可以定义在外部
const fetchFeatureFlags = async (): Promise<FeatureFlag[]> => {
    try {
        const { data } = await apiClient.get<FeatureFlag[]>('/api/admin/feature-flags');
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Critical Error: Failed to fetch feature flags.", error);
        return []; // 失败时返回空数组
    }
};


export const FeatureFlagProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const queryClient = useQueryClient();

    // === START: 核心修改 - 在Context内部使用 useQuery ===
    const { data: flagsWithDetails = [], isLoading, refetch } = useQuery<FeatureFlag[]>({
        queryKey: ['featureFlags'], // 定义唯一的 query key
        queryFn: fetchFeatureFlags,
        staleTime: 5 * 60 * 1000, // 5分钟内数据被认为是新鲜的
    });
    
    // 根据查询结果派生出 flagMap
    const flags = React.useMemo(() => {
        return flagsWithDetails.reduce((acc, flag) => {
            acc[flag.key] = flag.is_enabled;
            return acc;
        }, {} as Record<string, boolean>);
    }, [flagsWithDetails]);
    // === END: 核心修改 ===


    // 手动 refetch 的函数
    const handleRefetch = () => {
        // queryClient.invalidateQueries({ queryKey: ['featureFlags'] });
        refetch();
    };

    return (
        <FeatureFlagContext.Provider value={{ flags, flagsWithDetails, isLoading, refetch: handleRefetch }}>
            {children}
        </FeatureFlagContext.Provider>
    );
};