import React, { useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { uploadAndOcrFill } from '../api/partyApi';

// 为了代码整洁，我们可以将复选框的选项定义为常量
const entityTypes = [
  "有限责任公司", "股份有限公司", "上市公司", "其他企业法人", "事业单位",
  "社会团体", "基金会", "社会服务机构", "机关法人", "农村集体经济组织法人",
  "城镇农村的合作经济组织法人", "基层群众性自治组织法人", "个人独资企业",
  "合伙企业", "不具有法人资格的专业服务机构"
];

const ownershipTypes = ["国有", "民营", "其他"];

export const PartyLegalEntityForm: React.FC<{ path: string }> = ({ path }) => {
  const { register, control, setValue } = useFormContext();

  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsOcrLoading(true);
    try {
      // 调用API，指定证件类型为营业执照
      const extractedData = await uploadAndOcrFill(file, 'legal_entity_license');

      if (extractedData) {
        Object.keys(extractedData).forEach(key => {
          const fieldName = `${path}.${key}`;
          const value = extractedData[key];
          // 特殊处理：如果AI返回了类型，我们可以尝试填充单选按钮
          if (key === 'entityType' && typeof value === 'string') {
            setValue(fieldName, value, { shouldValidate: true, shouldDirty: true });
          } else {
            setValue(fieldName, value, { shouldValidate: true, shouldDirty: true });
          }
        });
      }
    } catch (error) {
      // ...
    } finally {
      setIsOcrLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const ownershipSelection = useWatch({
    control,
    name: `${path}.ownership.mainType`, // 监听主类型的单选按钮
  });

  return (
    <div className="p-4 border border-base-300 rounded-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg mb-4 border-b border-accent/20 pb-2">法人/非法人组织信息</h3>
        <div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" placeholder='上传图片' />
          <button type="button" onClick={handleUploadClick} className="btn btn-sm btn-outline btn-accent" disabled={isOcrLoading}>
            {isOcrLoading ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            )}
            上传营业执照识别
          </button>
        </div>
      </div>
      {/* 使用一个6列的网格系统来精确控制布局 */}
      <div className="grid grid-cols-6 gap-x-6 gap-y-4">

        <div className="form-control col-span-6">
          <label className="label py-1"><span className="label-text">名称</span></label>
          <input type="text" {...register(`${path}.entityName`)} className="input input-bordered w-full" />
        </div>

        <div className="form-control col-span-6">
          <label className="label py-1"><span className="label-text">住所地 (主要办事机构所在地)</span></label>
          <input type="text" {...register(`${path}.entityAddress`)} className="input input-bordered w-full" />
        </div>

        <div className="form-control col-span-6">
          <label className="label py-1"><span className="label-text">注册地 / 登记地</span></label>
          <input type="text" {...register(`${path}.registeredAddress`)} className="input input-bordered w-full" />
        </div>

        <div className="form-control col-span-6 md:col-span-2">
          <label className="label py-1"><span className="label-text">法定代表人 / 负责人</span></label>
          <input type="text" {...register(`${path}.legalRepName`)} className="input input-bordered w-full" />
        </div>
        <div className="form-control col-span-6 md:col-span-2">
          <label className="label py-1"><span className="label-text">职务</span></label>
          <input type="text" {...register(`${path}.legalRepTitle`)} className="input input-bordered w-full" />
        </div>
        <div className="form-control col-span-6 md:col-span-2">
          <label className="label py-1"><span className="label-text">联系电话</span></label>
          <input type="tel" {...register(`${path}.entityPhone`)} className="input input-bordered w-full" />
        </div>

        <div className="form-control col-span-6">
          <label className="label py-1"><span className="label-text">统一社会信用代码</span></label>
          <input type="text" {...register(`${path}.entityId`)} className="input input-bordered w-full" />
        </div>

        {/* --- 类型 (单选) --- */}
        <div className="form-control col-span-6">
          <label className="label py-1"><span className="label-text">类型</span></label>
          <div className="p-4 border rounded-md bg-base-100 flex flex-row flex-wrap gap-x-6 gap-y-3">
            {entityTypes.map(type => (
              <label key={type} className="label cursor-pointer justify-start gap-2  p-0">
                {/* 
                  所有单选按钮共享同一个 register 名称: `entityType`
                  这样 react-hook-form 就会将它们视为一组，一次只能选一个。
                  选中的值就是 `value` 属性指定的值。
                */}
                <input
                  type="radio"
                  value={type}
                  {...register(`${path}.entityType`)}
                  className="radio radio-sm"
                />
                <span className="label-text text-sm">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* --- 所有制性质 (条件单选) --- */}
        <div className="form-control col-span-6">
          <label className="label py-1"><span className="label-text">所有制性质</span></label>
          <div className="p-4 border rounded-md bg-base-100 flex flex-wrap items-center gap-x-6 gap-y-2">

            {/* 主类型单选组 */}
            {ownershipTypes.map(type => (
              <label key={type} className="label cursor-pointer justify-start gap-2">
                <input
                  type="radio"
                  value={type}
                  {...register(`${path}.ownership.mainType`)}
                  className="radio radio-sm"
                />
                <span className="label-text text-sm">{type}</span>
              </label>
            ))}

            {/* 当 "国有" 被选中时，才渲染这个嵌套的单选组 */}
            {ownershipSelection === '国有' && (
              <div className="flex items-center gap-2 pl-4 border-l-2 ml-4">
                <span className="text-sm">(</span>
                <label className="label cursor-pointer justify-start gap-2">
                  <input
                    type="radio"
                    value="控股"
                    {...register(`${path}.ownership.stateOwnedSubType`)}
                    className="radio radio-xs"
                  />
                  <span className="label-text text-xs">控股</span>
                </label>
                <label className="label cursor-pointer justify-start gap-2">
                  <input
                    type="radio"
                    value="参股"
                    {...register(`${path}.ownership.stateOwnedSubType`)}
                    className="radio radio-xs"
                  />
                  <span className="label-text text-xs">参股</span>
                </label>
                <span className="text-sm">)</span>
              </div>
            )}

            {/* 当 "其他" 被选中时，才渲染这个输入框 */}
            {ownershipSelection === '其他' && (
              <div className="flex items-center gap-2 pl-4 ml-4">
                <input
                  type="text"
                  {...register(`${path}.ownership.otherDetails`)}
                  className="input input-bordered input-xs w-48"
                  placeholder="请说明具体性质"
                />
              </div>
            )}

          </div>
        </div>
      </div>
    </div>

  );
};