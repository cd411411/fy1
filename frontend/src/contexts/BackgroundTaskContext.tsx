import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';

interface Task {
    id: string;
    title: string;
    status: 'running' | 'completed' | 'error';
    result?: any; // AI返回的结果
    error?: string;
}

interface BackgroundTaskContextType {
    tasks: Task[];
    addTask: (id: string, title: string) => void;
    updateTask: (id: string, status: 'completed' | 'error', data?: any) => void;
    removeTask: (id: string) => void;
}

const BackgroundTaskContext = createContext<BackgroundTaskContextType | undefined>(undefined);

export const useBackgroundTasks = () => {
    const context = useContext(BackgroundTaskContext);
    if (!context) {
        throw new Error('useBackgroundTasks must be used within a BackgroundTaskProvider');
    }
    return context;
};

export const BackgroundTaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [tasks, setTasks] = useState<Task[]>([]);

    const addTask = (id: string, title: string) => {
        setTasks(prev => [...prev, { id, title, status: 'running' }]);
        toast.loading(`任务 "${title}" 已开始...`, { id });
    };

    const updateTask = (id: string, status: 'completed' | 'error', data?: any) => {
        setTasks(prev => prev.map(task =>
            task.id === id ? { ...task, status, result: data?.result, error: data?.error } : task
        ));
        if (status === 'completed') {
            toast.success(`任务 "${tasks.find(t => t.id === id)?.title}" 已完成！`, { id });
        } else {
            toast.error(`任务 "${tasks.find(t => t.id === id)?.title}" 失败。`, { id });
        }
    };

    const removeTask = (id: string) => {
        setTasks(prev => prev.filter(task => task.id !== id));
    };

    return (
        <BackgroundTaskContext.Provider value={{ tasks, addTask, updateTask, removeTask }}>
            {children}
        </BackgroundTaskContext.Provider>
    );
};