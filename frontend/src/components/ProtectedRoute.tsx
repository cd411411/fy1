// src/components/ProtectedRoute.tsx (已增加加载状态处理)

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from "../contexts/AuthContext";
import { useConfig } from '../hooks/useConfig';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // 同时获取 isLoading 状态
    const { isAuthenticated, isLoading } = useAuth();
    const { appMode } = useConfig();
    const location = useLocation();

    console.log('%c[ProtectedRoute] Checking auth...', 'color: purple; font-weight: bold;', {
        isLoading,
        isAuthenticated,
        appMode,
        pathname: location.pathname
    });

    // 1. 如果正在进行认证检查，则显示加载状态
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    // 2. 认证检查结束后，再进行逻辑判断
    if (appMode === 'open' || isAuthenticated) {
        return <>{children}</>;
    }

    return <Navigate to="/admin/login" state={{ from: location }} replace />;
};