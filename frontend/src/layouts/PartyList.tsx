import React from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { PartyNaturalPersonForm } from '../components/PartyNaturalPersonForm';
import { PartyLegalEntityForm } from '../components/PartyLegalEntityForm';

// 定义 Props 类型
export interface PartyListProps {
  path: string;
  title: string;
  partyType: 'natural' | 'legal';
}

export const PartyList: React.FC<PartyListProps> = ({ path, title, partyType }) => {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: path });

  // 根据 partyType 决定要渲染哪个基础组件
  const PartyFormComponent = partyType === 'natural' ? PartyNaturalPersonForm : PartyLegalEntityForm;


  return (
    // 使用一个 div 包裹，因为外层的 FormSectionCard 会提供卡片样式
    <div className="pl-4 border-l-4 ">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-xl ">{title}</h3>
        <button 
          type="button" 
          onClick={() => append({})} 
          className="btn btn-sm btn-outline"
        >
          增加一名{title}
        </button>
      </div>
      <div className="space-y-4">
        {fields.map((item, index) => (
          <div key={item.id} className="relative">
              <button 
                type="button" 
                onClick={() => remove(index)} 
                className="btn btn-xs btn-circle btn-ghost absolute top-0 right-0 z-10"
              >
                ✕
              </button>
            <PartyFormComponent path={`${path}.${index}`} />
          </div>
        ))}
      </div>
    </div>
  );
};