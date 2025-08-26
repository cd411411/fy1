// src/components/claim/FormField.tsx
// 通用表单字段组件，支持多种输入类型
// 用于起诉状和答辩状表单中，根据type属性渲染不同类型的输入控件

import { useFormContext, Controller } from "react-hook-form";
import { OptimizableTextarea } from "../OptimizableTextarea";

interface FormFieldProps {
  path: string;
  label?: string;
  type?:
  | "text"
  | "email"
  | "password"
  | "number"
  | "tel"
  | "url"
  | "search"
  | "textarea"
  | "select"
  | "checkbox"
  | "checkboxGroup"
  | "date"
  | "radio"
  | "radio_detail"
  | "money"
  | "optimizable-textarea";
  placeholder?: string;
  className?: string;
  options?: Array<{ value: string; label: string }>; // 用于 select, radio, 和 checkboxGroup
  rows?: number; // 用于 textarea
  optimizationContext?: string;
  frontLabel?: string;
  endLabel?: string;
  triggerValue?: string; // 触发显示详情的 radio value，默认为 "yes"
  detailsLabel?: string; // 详情输入框的标签
}

/**
 * 通用表单字段组件
 * 
 * 支持的字段类型：
 * - text: 普通文本输入框
 * - email: 邮箱输入框
 * - password: 密码输入框
 * - number: 数字输入框
 * - tel: 电话号码输入框
 * - url: URL输入框
 * - search: 搜索框
 * - textarea: 多行文本框
 * - select: 下拉选择框
 * - checkbox: 复选框
 * - checkboxGroup: 复选框组
 * - date: 日期选择器
 * - radio: 单选按钮组
 * - radio_detail: 带详情的单选按钮组（当选择特定值时显示详情输入框）
 * - money: 金额输入框（带单位）
 * - optimizable-textarea: 可优化的文本区域（带AI优化功能）
 * 
 * @param path - 表单字段在表单数据中的路径，用于react-hook-form注册
 * @param label - 字段标签
 * @param type - 字段类型，默认为text
 * @param placeholder - 占位符文本
 * @param className - 自定义CSS类名
 * @param options - 选项列表，用于select、radio和checkboxGroup类型
 * @param rows - 文本区域的行数
 * @param optimizationContext - AI优化上下文
 * @param frontLabel - 前置标签
 * @param endLabel - 后置标签
 * @param triggerValue - 触发详情显示的radio值，默认为"yes"
 * @param detailsLabel - 详情输入框标签
 */
const FormField = ({
  path,
  label = "",
  type = "text",
  placeholder = "",
  className = "",
  options = [],
  rows = 3,
  optimizationContext,
  frontLabel = "",
  endLabel = "",
  triggerValue = "yes", // 默认触发值为 "yes"
  detailsLabel = "具体内容", // 默认详情标签
}: FormFieldProps) => {
  const { register, control,watch } = useFormContext();

  const renderInput = () => {
    switch (type) {
      case "radio_detail": {
        const radioPath = `${path}.choice`;
        const detailsPath = `${path}.details`;
        const selectedChoice = watch(radioPath);

        return (
          <div className="flex flex-col gap-y-2">
            {/* Radio buttons part */}
            <div className="flex flex-wrap items-center">
              {options.map((option) => (
                <label
                  key={option.value}
                  className="label cursor-pointer justify-start gap-2 mr-2 mt-1"
                >
                  <input
                    type="radio"
                    className="radio radio-sm"
                    value={option.value}
                    {...register(radioPath)}
                  />
                  <span className="label-text font-medium">{option.label}</span>
                </label>
              ))}
            </div>
            {/* Conditional OptimizableTextarea part */}
            {selectedChoice === triggerValue && (
              <div className="mt-2">
                <OptimizableTextarea
                  path={detailsPath}
                  label={detailsLabel}
                  placeholder={placeholder || `请填写${detailsLabel}...`}
                  rows={rows}
                  optimizationContext={optimizationContext}
                />
              </div>
            )}
          </div>
        );
      }

      case "checkboxGroup":
        return (
          <Controller
            name={path}
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <div className="flex flex-wrap items-center">
                {options.map((option) => {
                  const currentValues = field.value || [];
                  const isChecked = currentValues.includes(option.value);

                  const handleOnChange = () => {
                    const newValueArray: string[] = isChecked
                      ? (currentValues as string[]).filter((val: string) => val !== option.value)
                      : [...(currentValues as string[]), option.value];
                    field.onChange(newValueArray);
                  };

                  return (
                    <label
                      key={option.value}
                      className="label cursor-pointer justify-start gap-2 mr-2 mt-1"
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={isChecked}
                        onChange={handleOnChange}
                      />
                      <span className="label-text font-medium">
                        {option.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          />
        );

      case "textarea":
        return (
          <>
            {label ? <span className="label">{label}</span> : ""}
            <textarea
              className="textarea textarea-bordered w-full"
              placeholder={placeholder}
              rows={rows}
              {...register(path)}
            />
          </>
        );

      case "optimizable-textarea": {
        return (
          <OptimizableTextarea
            path={path}
            label={label}
            placeholder={placeholder}
            rows={rows}
            optimizationContext={optimizationContext}
          />
        );
      }

      case "select":
        return (
          <select className="select select-bordered w-full" {...register(path)}>
            <option value="" disabled>
              {placeholder || "请选择..."}
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "checkbox":
        return (
          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-2">
              <input type="checkbox" className="checkbox" {...register(path)} />
              <span className="label-text font-medium">{label}</span>
            </label>
          </div>
        );

      case "radio":
        return (
          <div className="flex flex-wrap items-center">
            {options.map((option) => (
              <label
                key={option.value}
                className="label cursor-pointer justify-start gap-2 mr-2 mt-1"
              >
                <input
                  type="radio"
                  className="radio radio-sm"
                  value={option.value}
                  {...register(path)}
                />
                <span className="label-text font-medium">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case "money":
        return (
          <label className="input  w-full">
            {frontLabel ? <span className="label">{frontLabel}</span> : ""}
            <input
              type="number"
              placeholder={placeholder}
              {...register(path)}
            />
            {endLabel ? <span className="label">{endLabel}</span> : <span className="label">元</span>}
          </label>
        );

      case "date":
        return (
          <label className="input  w-full">
            {frontLabel ? <span className="label">{frontLabel}</span> : ""}
            <input type={type} placeholder={placeholder} {...register(path)} />
            {endLabel ? <span className="label">{endLabel}</span> : ""}
          </label>
        );

      case "text":
        return (
          <label className="input  w-full">
            {frontLabel ? <span className="label">{frontLabel}</span> : ""}
            <input type={type} placeholder={placeholder} {...register(path)} />
            {endLabel ? <span className="label">{endLabel}</span> : ""}
          </label>
        );

      case "number":
        return (
          <label className="input  w-full">
            {frontLabel ? <span className="label">{frontLabel}</span> : ""}
            <input
              type="number"
              placeholder={placeholder}
              {...register(path)}
            />
            {endLabel ? <span className="label">{endLabel}</span> : ""}
          </label>
        );

      default:
        return (
          <input
            type={type}
            className="input input-bordered w-full"
            placeholder={placeholder}
            {...register(path)}
          />
        );
    }
  };

  // checkbox, radio 和 checkboxGroup 有特殊的布局，不需要额外的 label
  if (type === "checkbox" || type === "radio" || type === "checkboxGroup" || type === "radio_detail") {
    return (
      <div className={`form-control w-full ${className}`}>
        {(type === "radio" || type === "checkboxGroup") && label && (
          <div className="label">
            <span className="label-text font-medium">{label}</span>
          </div>
        )}
        {renderInput()}
      </div>
    );
  }

  return (
    <div className={`form-control w-full ${className}`}>{renderInput()}</div>
  );
};

export default FormField;