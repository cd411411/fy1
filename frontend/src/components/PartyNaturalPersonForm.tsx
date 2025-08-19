import React, { useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { uploadAndOcrFill } from '../api/partyApi';

export const PartyNaturalPersonForm: React.FC<{ path: string }> = ({ path }) => {
  const { register, setValue } = useFormContext();
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsOcrLoading(true);
    try {
      // 调用API，指定证件类型为身份证
      const extractedData = await uploadAndOcrFill(file, 'natural_person_id_card');

      // 批量填充表单
      // 后端返回的JSON的键名需要与这里的字段名匹配
      if (extractedData) {
        Object.keys(extractedData).forEach(key => {
          const fieldName = `${path}.${key}`; // e.g., "plaintiffs_natural.0.name"
          const value = extractedData[key];
          setValue(fieldName, value, { shouldValidate: true, shouldDirty: true });
        });
      }
    } catch (error) {
      // 错误已在API函数中通过toast处理
    } finally {
      setIsOcrLoading(false);
      // 重置文件输入框，以便用户可以上传同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-4 border border-base-300 rounded-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg mb-4 border-b border-secondary/20 pb-2">自然人信息</h3>
        <div>
          {/* 隐藏的文件输入框 */}
          <input
            type="file"
            placeholder='上传证件图片'
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
          />
          {/* 上传按钮 */}
          <button
            type="button"
            onClick={handleUploadClick}
            className="btn btn-sm btn-outline btn-secondary"
            disabled={isOcrLoading}
          >
            {isOcrLoading ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            )}
            上传证件识别
          </button>
        </div>
      </div>
      {/* 使用6列网格布局，并设置水平和垂直间距 */}
      <div className="grid grid-cols-6 gap-x-6 gap-y-4">

        {/* 一行三个：姓名、性别、出生日期 */}
        <div className="form-control col-span-6 sm:col-span-3 md:col-span-2">
          <label className="label py-1"><span className="label-text">姓名</span></label>
          <input type="text" {...register(`${path}.name`)} className="input input-bordered w-full" />
        </div>
        <div className="form-control col-span-6 sm:col-span-3 md:col-span-2">
          <label className="label py-1"><span className="label-text">性别</span></label>
          <select {...register(`${path}.gender`)} className="select select-bordered w-full">
            <option value=""></option><option value="男">男</option><option value="女">女</option>
          </select>
        </div>
        <div className="form-control col-span-6 sm:col-span-3 md:col-span-2">
          <label className="label py-1"><span className="label-text">出生日期</span></label>
          <input type="date" {...register(`${path}.birthDate`)} className="input input-bordered w-full" />
        </div>

        {/* 一行三个：民族、工作单位 */}
        <div className="form-control col-span-6 sm:col-span-3 md:col-span-2">
          <label className="label py-1"><span className="label-text">民族</span></label>
          <input type="text" {...register(`${path}.nation`)} className="input input-bordered w-full" />
        </div>
        <div className="form-control col-span-6 md:col-span-4">
          <label className="label py-1"><span className="label-text">工作单位</span></label>
          <input type="text" {...register(`${path}.workUnit`)} className="input input-bordered w-full" />
        </div>

        {/* 一行两个：职务、联系电话 */}
        <div className="form-control col-span-6 md:col-span-3">
          <label className="label py-1"><span className="label-text">职务</span></label>
          <input type="text" {...register(`${path}.title`)} className="input input-bordered w-full" />
        </div>
        <div className="form-control col-span-6 md:col-span-3">
          <label className="label py-1"><span className="label-text">联系电话</span></label>
          <input type="tel" {...register(`${path}.phone`)} className="input input-bordered w-full" />
        </div>

        {/* 独占一行的长字段 */}
        <div className="form-control col-span-6">
          <label className="label py-1"><span className="label-text">住所地 (户籍所在地)</span></label>
          <input type="text" {...register(`${path}.address`)} className="input input-bordered w-full" />
        </div>
        <div className="form-control col-span-6">
          <label className="label py-1"><span className="label-text">经常居住地</span></label>
          <input type="text" {...register(`${path}.currentAddress`)} className="input input-bordered w-full" />
        </div>

        {/* 一行两个：证件类型、证件号码 */}
        <div className="form-control col-span-6 md:col-span-3">
          <label className="label py-1"><span className="label-text">证件类型</span></label>
          <select {...register(`${path}.idType`)} className="select select-bordered w-full">
            <option value=""></option><option value="身份证">身份证</option><option value="护照">护照</option>
          </select>
        </div>
        <div className="form-control col-span-6 md:col-span-3">
          <label className="label py-1"><span className="label-text">证件号码</span></label>
          <input type="text" {...register(`${path}.idNumber`)} className="input input-bordered w-full" />
        </div>
      </div>
    </div>
  );
};