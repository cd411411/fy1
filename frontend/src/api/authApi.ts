// src/api/authApi.ts

// 导入配置好的API客户端实例
import apiClient from './axiosConfig';

// ==================== 类型定义 ====================

/**
 * 登录响应接口
 */
interface LoginResponse {
    /**
     * 访问令牌
     */
    access_token: string;
    
    /**
     * 令牌类型
     */
    token_type: string;
}

// ==================== 认证接口 ====================

/**
 * 用户登录
 * @param username 用户名
 * @param password 密码
 * @returns JWT访问令牌
 */
export const login = async (username: string, password: string): Promise<string> => {
    // 构建表单数据
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    // 发送登录请求
    const response = await apiClient.post<LoginResponse>(`/api/admin/token`, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    // 返回访问令牌
    return response.data.access_token;
};