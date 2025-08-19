// src/hooks/useFeatureFlags.ts (新文件)

import { useContext } from 'react';
import { FeatureFlagContext } from '../contexts/FeatureFlagContext'; // 确保路径正确

export const useFeatureFlags = () => {
    const context = useContext(FeatureFlagContext);
    
    if (context === undefined) {
        throw new Error("useFeatureFlags must be used within a FeatureFlagProvider");
    }
    
    return context;
};