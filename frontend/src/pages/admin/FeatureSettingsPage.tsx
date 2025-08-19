// src/pages/admin/FeatureSettingsPage.tsx (新文件)
import React from 'react';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../../api/axiosConfig';
import toast from 'react-hot-toast';

const updateFeatureFlag = async ({ key, is_enabled }: { key: string, is_enabled: boolean }) => {
    await apiClient.patch(`/api/admin/feature-flags/${key}`, { is_enabled });
};

export const FeatureSettingsPage: React.FC = () => {
    const { flagsWithDetails, isLoading, refetch } = useFeatureFlags();
    
    const mutation = useMutation({
        mutationFn: updateFeatureFlag,
        onSuccess: () => {
            toast.success("设置已更新！");
            refetch(); // 重新获取最新状态
        },
        onError: () => toast.error("更新失败。")
    });

    if (isLoading) return <div className="text-center"><span className="loading loading-spinner"></span></div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">功能设置</h1>
            <p className="text-base-content/70">在这里控制各项AI辅助功能的开启或关闭。关闭后，将不会再调用相关AI服务，以节省Token。</p>
            
            <div className="space-y-4">
                {flagsWithDetails.map(flag => (
                    <div key={flag.key} className="card bg-base-100 shadow border">
                        <div className="card-body flex-row items-center justify-between">
                            <div>
                                <h2 className="card-title">{flag.name}</h2>
                                <p className="text-sm text-base-content/70">{flag.description}</p>
                            </div>
                            <input 
                                type="checkbox" 
                                className="toggle toggle-primary toggle-lg" 
                                checked={flag.is_enabled}
                                onChange={(e) => mutation.mutate({ key: flag.key, is_enabled: e.target.checked })}
                                disabled={mutation.isPending}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};