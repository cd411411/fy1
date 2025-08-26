import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import { saveAgentProfile } from '../utils/storage';
import eventBus from '../utils/events'; 

export const AgentForm: React.FC<{ path: string }> = ({ path }) => {

  const { register, getValues, control } = useFormContext();
// 监听代理权限单选按钮的值
  const authorityType = useWatch({
    control,
    name: `${path}.agentAuthorityType` // 监听这个新字段
  });
  const handleSaveToLibrary = () => {
    const agentData = getValues(path);
    if (!agentData.agentName) {
        toast.error("请至少填写代理人姓名后再保存！");
        return;
    }
    saveAgentProfile(agentData);
    toast.success(`代理人 "${agentData.agentName}" 已保存到常用列表！`);
    eventBus.dispatch('profiles-updated');
  }

  return (
    <div className="grid grid-cols-6 gap-x-6 gap-y-4">
      <div className="col-span-6 flex justify-end">
          <button type="button" onClick={handleSaveToLibrary} className="btn btn-xs btn-outline btn-info">存为常用</button>
      </div>
        <div className="form-control col-span-6 md:col-span-3">
          <label className="label py-1"><span className="label-text">姓名</span></label>
          <input type="text" {...register(`${path}.agentName`)} className="input input-bordered w-full" />
        </div>
        <div className="form-control col-span-6 md:col-span-3">
          <label className="label py-1"><span className="label-text">单位</span></label>
          <input type="text" {...register(`${path}.agentUnit`)} className="input input-bordered w-full" />
        </div>
        <div className="form-control col-span-6 md:col-span-3">
          <label className="label py-1"><span className="label-text">职务</span></label>
          <input type="text" {...register(`${path}.agentTitle`)} className="input input-bordered w-full" />
        </div>
        <div className="form-control col-span-6 md:col-span-3">
          <label className="label py-1"><span className="label-text">联系电话</span></label>
          <input type="tel" {...register(`${path}.agentPhone`)} className="input input-bordered w-full" />
        </div>
         <div className="form-control col-span-6">
        <label className="label py-1"><span className="label-text">代理权限</span></label>
        <div className="flex items-center gap-x-6 gap-y-2 flex-wrap">
            <label className="label cursor-pointer justify-start gap-2">
                <input type="radio" value="一般授权" {...register(`${path}.agentAuthorityType`)} className="radio radio-sm"/>
                <span className="label-text">一般授权</span>
            </label>
             <label className="label cursor-pointer justify-start gap-2">
                <input type="radio" value="特别授权" {...register(`${path}.agentAuthorityType`)} className="radio radio-sm"/>
                <span className="label-text">特别授权</span>
            </label>
        </div>
      </div>
      
      {/* 仅在选择了“特别授权”时显示此文本框 */}
      {authorityType === '特别授权' && (
        <div className="form-control col-span-6">
            <label className="label py-1"><span className="label-text">特别授权权限说明</span></label>
            <textarea 
                {...register(`${path}.agentAuthorityDetails`)} 
                className="textarea textarea-bordered w-full" 
                placeholder="例如：代为承认、放弃、变更诉讼请求，进行和解，提起反诉或者上诉等。"
            />
        </div>
      )}
    </div>
  );
};