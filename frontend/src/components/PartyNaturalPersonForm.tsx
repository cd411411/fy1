import React, { useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { uploadAndOcrFill } from "../api/partyApi";

// 定义特殊类型配置接口
interface SpecialFieldConfig {
  type: "identity"; // 可以扩展更多类型
  position: "beforeName" | "afterName" | "beforeId" | "afterId"; // 可以扩展更多位置
  props?: Record<string, any>;
}

// 特殊类型配置映射
const SPECIAL_TYPE_CONFIG: Record<string, SpecialFieldConfig[]> = {
  不予执行申请书: [
    {
      type: "identity",
      position: "beforeName",
      props: {
        fieldName: "identityType",
        options: [
          { label: "被执行人", value: "被执行人" },
          { label: "案外人", value: "案外人" },
          { label: "其他", value: "其他" },
        ],
      },
    },
  ],
  执行监督申请书: [
    {
      type: "identity",
      position: "beforeName",
      props: {
        fieldName: "identityType",
        options: [
          { label: "申请执行人", value: "申请执行人" },
          { label: "被执行人", value: "被执行人" },
          { label: "利害关系人", value: "利害关系人" },
          { label: "案外人", value: "案外人" },
          { label: "其他", value: "其他" },
        ],
      },
    },
  ],
  执行异议申请书: [
    {
      type: "identity",
      position: "beforeName",
      props: {
        fieldName: "identityType",
        options: [
          { label: "申请执行人", value: "申请执行人" },
          { label: "被执行人", value: "被执行人" },
          { label: "利害关系人", value: "利害关系人" },
          { label: "案外人", value: "案外人" },
          { label: "其他", value: "其他" },
        ],
      },
    },
  ],
  执行复议申请书: [
    {
      type: "identity",
      position: "beforeName",
      props: {
        fieldName: "identityType",
        options: [
          { label: "申请执行人", value: "申请执行人" },
          { label: "被执行人", value: "被执行人" },
          { label: "利害关系人", value: "利害关系人" },
          { label: "案外人", value: "案外人" },
          { label: "其他", value: "其他" },
        ],
      },
    },
  ],
  执行担保申请书: [
    { 
      type: "identity",
      position: "beforeName",
      props: {
        fieldName: "identityType",
        options: [
          { label: "被执行人", value: "被执行人" },
          { label: "利害关系人", value: "利害关系人" },
          { label: "案外人", value: "案外人" },
          { label: "其他", value: "其他" },
        ],
      },
    },
  ]
};

export const PartyNaturalPersonForm: React.FC<{
  path: string;
  specialType: string | undefined;
}> = ({ path, specialType }) => {
  const { register, setValue, control } = useFormContext();
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 监听身份类型字段，用于控制"其他"输入框的启用状态
  const identityType = useWatch({
    control,
    name: `${path}.identityType`,
    defaultValue: "",
  });

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsOcrLoading(true);
    try {
      // 调用API，指定证件类型为身份证
      const extractedData = await uploadAndOcrFill(
        file,
        "natural_person_id_card"
      );

      // 批量填充表单
      // 后端返回的JSON的键名需要与这里的字段名匹配
      if (extractedData) {
        Object.keys(extractedData).forEach((key) => {
          const fieldName = `${path}.${key}`; // e.g., "plaintiffs_natural.0.name"
          const value = extractedData[key];
          setValue(fieldName, value, {
            shouldValidate: true,
            shouldDirty: true,
          });
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

  // 渲染身份类型字段
  const renderIdentityField = (config: SpecialFieldConfig) => {
    if (config.type !== "identity") return null;

    return (
      <div className="form-control col-span-6">
        <label className="label py-1">
          <span className="label-text">身份</span>
        </label>
        <div className="flex flex-wrap gap-4">
          {config.props?.options.map((option) => (
            <label key={option.value} className="flex items-center gap-1">
              <input
                type="radio"
                {...register(`${path}.${config.props?.fieldName}`)}
                value={option.value}
                className="radio radio-sm"
              />
              {option.label}
            </label>
          ))}
          {config.props?.options.some((opt) => opt.value === "其他") && (
            <div className="flex items-center gap-1">
              <input
                type="text"
                {...register(`${path}.${config.props?.fieldName}Other`)}
                placeholder="请说明"
                className="input input-bordered input-sm w-32"
                disabled={identityType !== "其他"}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  // 获取指定位置的特殊字段
  const getSpecialFields = (position: string) => {
    if (!specialType) return [];

    const configs = SPECIAL_TYPE_CONFIG[specialType] || [];
    return configs
      .filter((config) => config.position === position)
      .map((config, index) => {
        switch (config.type) {
          case "identity":
            return (
              <React.Fragment key={index}>
                {renderIdentityField(config)}
              </React.Fragment>
            );
          default:
            return null;
        }
      });
  };

  return (
    <div className="p-4 border border-base-300 rounded-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg mb-4 border-b border-secondary/20 pb-2">
          自然人信息
        </h3>
        <div>
          {/* 隐藏的文件输入框 */}
          <input
            type="file"
            placeholder="上传证件图片"
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            )}
            上传证件识别
          </button>
        </div>
      </div>
      {/* 使用6列网格布局，并设置水平和垂直间距 */}
      <div className="grid grid-cols-6 gap-x-6 gap-y-4">
        {/* 特殊字段 - 姓名前 */}
        {getSpecialFields("beforeName")}

        {/* 一行三个：姓名、性别、出生日期 */}
        <div className="form-control col-span-6 sm:col-span-3 md:col-span-2">
          <label className="label py-1">
            <span className="label-text">姓名</span>
          </label>
          <input
            type="text"
            {...register(`${path}.name`)}
            className="input input-bordered w-full"
          />
        </div>
        <div className="form-control col-span-6 sm:col-span-3 md:col-span-2">
          <label className="label py-1">
            <span className="label-text">性别</span>
          </label>
          <select
            {...register(`${path}.gender`)}
            className="select select-bordered w-full"
          >
            <option value=""></option>
            <option value="男">男</option>
            <option value="女">女</option>
          </select>
        </div>
        <div className="form-control col-span-6 sm:col-span-3 md:col-span-2">
          <label className="label py-1">
            <span className="label-text">出生日期</span>
          </label>
          <input
            type="date"
            {...register(`${path}.birthDate`)}
            className="input input-bordered w-full"
          />
        </div>

        {/* 特殊字段 - 姓名后 */}
        {getSpecialFields("afterName")}

        {/* 一行三个：民族、工作单位 */}
        <div className="form-control col-span-6 sm:col-span-3 md:col-span-2">
          <label className="label py-1">
            <span className="label-text">民族</span>
          </label>
          <input
            type="text"
            {...register(`${path}.nation`)}
            className="input input-bordered w-full"
          />
        </div>
        <div className="form-control col-span-6 md:col-span-4">
          <label className="label py-1">
            <span className="label-text">工作单位</span>
          </label>
          <input
            type="text"
            {...register(`${path}.workUnit`)}
            className="input input-bordered w-full"
          />
        </div>

        {/* 一行两个：职务、联系电话 */}
        <div className="form-control col-span-6 md:col-span-3">
          <label className="label py-1">
            <span className="label-text">职务</span>
          </label>
          <input
            type="text"
            {...register(`${path}.title`)}
            className="input input-bordered w-full"
          />
        </div>
        <div className="form-control col-span-6 md:col-span-3">
          <label className="label py-1">
            <span className="label-text">联系电话</span>
          </label>
          <input
            type="tel"
            {...register(`${path}.phone`)}
            className="input input-bordered w-full"
          />
        </div>

        {/* 独占一行的长字段 */}
        <div className="form-control col-span-6">
          <label className="label py-1">
            <span className="label-text">住所地 (户籍所在地)</span>
          </label>
          <input
            type="text"
            {...register(`${path}.address`)}
            className="input input-bordered w-full"
          />
        </div>
        <div className="form-control col-span-6">
          <label className="label py-1">
            <span className="label-text">经常居住地</span>
          </label>
          <input
            type="text"
            {...register(`${path}.currentAddress`)}
            className="input input-bordered w-full"
          />
        </div>

        {/* 特殊字段 - 证件前 */}
        {getSpecialFields("beforeId")}

        {/* 一行两个：证件类型、证件号码 */}
        <div className="form-control col-span-6 md:col-span-3">
          <label className="label py-1">
            <span className="label-text">证件类型</span>
          </label>
          <select
            {...register(`${path}.idType`)}
            className="select select-bordered w-full"
          >
            <option value=""></option>
            <option value="身份证">身份证</option>
            <option value="护照">护照</option>
          </select>
        </div>
        <div className="form-control col-span-6 md:col-span-3">
          <label className="label py-1">
            <span className="label-text">证件号码</span>
          </label>
          <input
            type="text"
            {...register(`${path}.idNumber`)}
            className="input input-bordered w-full"
          />
        </div>

        {/* 特殊字段 - 证件后 */}
        {getSpecialFields("afterId")}
      </div>
    </div>
  );
};
