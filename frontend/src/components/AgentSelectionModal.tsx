import React, { useState, useEffect } from 'react';
import { getAgentProfiles, deleteAgentProfile } from '../utils/storage';
import type { AgentProfile } from '../interfaces/document.types';
import eventBus from '../utils/events';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (profile: AgentProfile) => void;
}

export const AgentSelectionModal: React.FC<Props> = ({ isOpen, onClose, onSelect }) => {
  const [profiles, setProfiles] = useState<AgentProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const refresh = () => setProfiles(getAgentProfiles());

  useEffect(() => {
    eventBus.on('profiles-updated', refresh);
    return () => {
      eventBus.off('profiles-updated', refresh);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      refresh();
    }
  }, [isOpen]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("确定要从常用列表中删除这位代理人吗？")) {
        deleteAgentProfile(id);
        toast.success("常用代理人已删除。");
        eventBus.dispatch('profiles-updated');
    }
  }

  const filteredProfiles = profiles.filter(p => 
    p.agentName?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <dialog id="agent_selection_modal" className={`modal ${isOpen ? "modal-open" : ""}`}>
      <div className="modal-box w-11/12 max-w-2xl max-h-[70vh]  shadow-2xl rounded-2xl flex flex-col">
        
        {/* 固定头部 */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="font-bold text-xl ">选择代理人</h3>
              <p className="text-sm ">从常用列表中快速选择</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn btn-sm btn-circle btn-ghost hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>
        
        {/* 搜索栏 */}
        <div className="py-4 flex-shrink-0">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text"
              placeholder="搜索代理人姓名..."
              className="input input-bordered w-full pl-10   focus:ring-2 focus:ring-primary/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* 滚动内容区域 */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 min-h-0 max-h-[50vh]">
          {filteredProfiles.length > 0 ? filteredProfiles.map((profile, index) => (
            <div 
              key={profile.id} 
              className="group p-3 border border-gray-200 rounded-xl flex justify-between items-center cursor-pointer hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10 hover:border-primary/30 hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
              onClick={() => onSelect(profile)}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0 ml-2">
                {/* 头像 */}
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/30 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <span className="text-primary font-semibold text-lg">
                    {profile.agentName?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-semibold  truncate">{profile.agentName}</p>
                  <p className="text-sm  truncate">{profile.agentUnit || '单位未填写'}</p>
                  <p className="text-xs ">#{index + 1}</p>
                </div>
              </div>
              
              <div className="flex gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  type="button" 
                  className="btn btn-sm btn-primary hover:scale-105 transition-transform" 
                  onClick={(e) => {e.stopPropagation(); onSelect(profile);}}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  选择
                </button>
                <button 
                  type="button" 
                  className="btn btn-sm btn-outline btn-error hover:scale-105 transition-transform" 
                  onClick={(e) => handleDelete(e, profile.id)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          )) : (
            <div className="text-center text-gray-500 py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              {searchTerm ? (
                <div>
                  <p className="text-lg font-medium">未找到匹配的代理人</p>
                  <p className="text-sm mt-1">尝试使用其他关键词搜索</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium">常用列表为空</p>
                  <p className="text-sm mt-1">填写代理人信息后，点击"存为常用"进行添加</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 固定底部 */}
        {filteredProfiles.length > 0 && (
          <div className="pt-4 border-t border-gray-200 flex-shrink-0">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>共 {filteredProfiles.length} 位代理人</span>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm" 
                onClick={onClose}
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </div>
      
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};