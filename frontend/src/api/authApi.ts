// src/api/authApi.ts

// import axios from 'axios';
// import toast from 'react-hot-toast';
import apiClient from './axiosConfig';

interface LoginResponse {
    access_token: string;
    token_type: string;
}

export const login = async (username: string, password: string): Promise<string> => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    const response = await apiClient.post<LoginResponse>(`/api/admin/token`, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data.access_token; // 返回JWT
};