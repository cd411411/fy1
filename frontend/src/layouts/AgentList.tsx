import React, { useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { FormSectionCard } from './FormSectionCard';
import { AgentForm } from '../components/AgentForm';
import { AgentSelectionModal } from '../components/AgentSelectionModal';
import type { AgentProfile } from '../interfaces/document.types';

export const AgentList: React.FC<{ path: string }> = ({ path }) => {
  const { control, setValue } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: path });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  const canAddAgent = fields.length < 2;

  const openSelectionModal = (index: number) => {
    setCurrentIndex(index);
    setIsModalOpen(true);
  };
  
  const handleSelectAgent = (profile: AgentProfile) => {
    if (currentIndex !== null) {
        const fieldPath = `${path}.${currentIndex}`;
        setValue(`${fieldPath}.agentName`, profile.agentName);
        setValue(`${fieldPath}.agentUnit`, profile.agentUnit);
        setValue(`${fieldPath}.agentTitle`, profile.agentTitle);
        setValue(`${fieldPath}.agentPhone`, profile.agentPhone);
        setValue(`${fieldPath}.agentAuthority`, profile.agentAuthorityType);
    }
    setIsModalOpen(false);
    setCurrentIndex(null);
  };

  return (
    <FormSectionCard title="委托诉讼代理人">
      <button type="button" onClick={() => append({})} className="btn btn-sm btn-outline mb-4" disabled={!canAddAgent}>
        增加新代理人 (最多2名)
      </button>
      {!canAddAgent && <p className="text-sm text-warning -mt-2 mb-4">代理人数量已达上限。</p>}
      
      <div className="space-y-4">
        {fields.map((item, index) => (
          // 使用 p-4 让卡片有内边距
          <div key={item.id} className="p-4 rounded-lg border">
            {/* 
    
              使用 Flexbox 来布局卡片的头部，确保标题和按钮不重叠
            */}
            <div className="flex justify-between items-center mb-4">
              {/* 标题部分 */}
              <h3 className="font-semibold text-lg">
                委托诉讼代理人信息 #{index + 1}
              </h3>
              {/* 操作按钮组 */}
              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => openSelectionModal(index)} 
                  className="btn btn-xs btn-primary btn-soft "
                >
                  从库中选择
                </button>
                <button 
                  type="button" 
                  onClick={() => remove(index)} 
                  className="btn btn-xs btn-circle btn-ghost"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 表单内容部分保持不变 */}
            <AgentForm path={`${path}.${index}`} />
          </div>
        ))}
      </div>
      
      <AgentSelectionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectAgent}
      />
    </FormSectionCard>
  );
};