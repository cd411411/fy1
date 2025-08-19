// src/api/axiosConfig.ts (最终正确版 - for Basic Auth)

import axios from 'axios';
import eventBus from '../utils/events';
import toast from 'react-hot-toast';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '',
    headers: {
        'Content-Type': 'application/json',
    }
});

export default apiClient;

// 请求头配置函数
export const configureAxiosAuth = (token: string | null) => {
    if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete apiClient.defaults.headers.common['Authorization'];
    }
};

// 响应拦截器
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