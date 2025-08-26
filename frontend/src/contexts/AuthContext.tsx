// src/contexts/AuthContext.tsx (最终修复版)

import React, { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/authApi';
import { configureAxiosAuth } from '../api/axiosConfig';
import eventBus from '../utils/events';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 关键: useAuth hook 在这里定义并导出，作为唯一的来源
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

// 这个组件包含了所有核心逻辑
const AuthProviderContent: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    const handleLogout = useCallback(() => {
        console.log("AuthProvider: Logging out...");
        localStorage.removeItem('adminToken');
        configureAxiosAuth(null);
        setIsAuthenticated(false);
        navigate('/admin/login', { replace: true });
    }, [navigate]);

    const handleLogin = async (username: string, password: string) => {
    const token = await login(username, password);
    localStorage.setItem('adminToken', token); // 存储JWT
    configureAxiosAuth(token);
    setIsAuthenticated(true);
};
    
    useEffect(() => {
    const token = localStorage.getItem('adminToken'); // 读取JWT
    if (token) {
        configureAxiosAuth(token);
        setIsAuthenticated(true);
    }
        
        setIsLoading(false);
        
        eventBus.on('auth:logout', handleLogout);
        return () => {
            eventBus.off('auth:logout', handleLogout);
        };
    }, [handleLogout]);
    
    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, login: handleLogin, logout: handleLogout }}>
            {!isLoading && children} 
        </AuthContext.Provider>
    );
}

// 导出的 AuthProvider，它只负责确保 navigate 能正常工作
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    return <AuthProviderContent>{children}</AuthProviderContent>;
};