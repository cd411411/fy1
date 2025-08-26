// src/api/axiosConfig.ts
import axios from 'axios';
import eventBus from '../utils/events';
import toast from 'react-hot-toast';

// ==================== Axios实例配置 ====================
/**
 * Axios实例，用于API请求
 */
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '',
    headers: {
        'Content-Type': 'application/json',
    }
});

export default apiClient;

// ==================== 认证配置函数 ====================
/**
 * 配置Axios认证头
 * @param token JWT令牌
 */
export const configureAxiosAuth = (token: string | null) => {
    if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete apiClient.defaults.headers.common['Authorization'];
    }
};

// ==================== 响应拦截器 ====================
/**
 * Axios响应拦截器
 * 处理401未授权错误，自动登出并提示用户
 */
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            if (window.location.pathname !== '/admin/login') {
                eventBus.dispatch('auth:logout');
                toast.error("您的登录已过期或凭据无效，请重新登录。");
            }
        }
        return Promise.reject(error);
    }
);