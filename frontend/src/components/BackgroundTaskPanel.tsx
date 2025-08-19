import React from 'react';
import { useBackgroundTasks } from '../contexts/BackgroundTaskContext';

interface Props {
  onApplyResult: (result: any) => void; // 新增：应用结果的回调
}

export const BackgroundTaskPanel: React.FC<Props> = ({ onApplyResult }) => {
  const { tasks, removeTask } = useBackgroundTasks();

  if (tasks.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 space-y-2">
      {tasks.map(task => (
        <div key={task.id} className="card bg-base-100 shadow-xl border animate-fade-in">
          <div className="card-body p-3">
            <div className="flex justify-between items-center">
                <p className="font-semibold text-sm">{task.title}</p>
                {task.status === 'running' && <span className="loading loading-spinner loading-sm"></span>}
            </div>
            {task.status === 'completed' && (
              <div className="text-xs text-success mt-1">分析完成，可以应用填充。</div>
            )}
            {task.status === 'error' && (
              <div className="text-xs text-error mt-1">{task.error || '发生未知错误'}</div>
            )}
            <div className="card-actions justify-end mt-2">
              {task.status === 'completed' && (
                <button className="btn btn-xs btn-success" onClick={() => { onApplyResult(task.result); removeTask(task.id); }}>应用填充</button>
              )}
               <button className="btn btn-xs btn-ghost" onClick={() => removeTask(task.id)}>关闭</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};