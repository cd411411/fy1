// src/pages/admin/AIModelsPage.tsx (最终完整版)

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import {
  fetchAIModels,
  createAIModel,
  deleteAIModel,
  setActiveAIModel,
  deactivateAIModel,
  updateAIModel,
} from "../../api/adminApi";
import type {
  AIModel,
  AIModelCreatePayload,
  AIModelUpdatePayload,
} from "../../api/adminApi";
import { CheckCircle, Zap, Eye, Trash2, XCircle, Edit } from "lucide-react";
import { ConfirmModal } from "../../components/ConfirmModal";

const capabilitiesOptions = [
  {
    value: "general",
    label: "常规模型",
    description: "用于文本生成、分析、聊天等。",
  },
  {
    value: "vision",
    label: "多模态模型",
    description: "可识别图片、PDF扫描件。",
  },
  {
    value: "fast",
    label: "快速模型",
    description: "响应速度快，用于实时辅助。",
  },
];

// --- 编辑模态框组件 ---
const EditModelModal: React.FC<{
  model: AIModel | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, data: AIModelUpdatePayload) => void;
  isSaving: boolean;
}> = ({ model, isOpen, onClose, onSave, isSaving }) => {
  const { register, handleSubmit, control, reset } =
    useForm<AIModelUpdatePayload>();

  useEffect(() => {
    if (model) {
      const capabilities =
        typeof model.capabilities === "string"
          ? JSON.parse(model.capabilities || "[]")
          : model.capabilities;

      reset({
        ...model,
        capabilities: Array.isArray(capabilities) ? capabilities : [],
      });
    }
  }, [model, reset]);

  const onSubmit = (data: AIModelUpdatePayload) => {
    const payload = {
      ...data,
      temperature: data.temperature
        ? parseFloat(data.temperature as any)
        : null,
      top_p: data.top_p ? parseFloat(data.top_p as any) : null,
      max_tokens: data.max_tokens ? parseInt(data.max_tokens as any, 10) : null,
    };
    if (model) {
      onSave(model.id, payload);
    }
  };

  if (!isOpen) return null;

  return (
    <dialog open className="modal modal-open">
      <div className="modal-box w-11/12 max-w-2xl">
        <h3 className="font-bold text-lg">编辑 AI 模型: {model?.model_name}</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="form-control">
            <label className="input">
              <span className="label">模型名称</span>

              <input
                type="text"
                {...register("model_name")}
                placeholder="模型名称"
                className="w-full"
              />
            </label>
          </div>
          <div className="form-control ">
            <label className="input">
              <span className="label">Base URL</span>

              <input
                type="url"
                {...register("base_url")}
                placeholder="Base URL"
                className="input w-full"
              />
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-control">
              <label className="input">
                <span className="label">温度</span>

                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  placeholder="例如：0.7"
                  {...register("temperature")}
                />
              </label>
            </div>
            <div className="form-control">
              <label className="input">
                <span className="label">Top P</span>

                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  placeholder="例如：0.9"
                  {...register("top_p")}
                />
              </label>
            </div>
            <div className="form-control">
              <label className="input">
                <span className="label">最大Tokens</span>
              
              <input
                type="number"
                step="1"
                min="1"
                placeholder="例如：4096"
                {...register("max_tokens")}
              />
              </label>
            </div>
          </div>
          <div>
            <label className="label">
              <span className="label">模型能力 (可多选)</span>
            </label>
            <Controller
              name="capabilities"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  {capabilitiesOptions.map((opt) => (
                    <label
                      key={opt.value}
                      className="label cursor-pointer justify-start gap-4 p-3 bg-base-200/50 rounded-lg"
                    >
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={field.value?.includes(opt.value)}
                        onChange={(e) => {
                          const newValues = e.target.checked
                            ? [...(field.value || []), opt.value]
                            : (field.value || []).filter(
                                (v) => v !== opt.value
                              );
                          field.onChange(newValues);
                        }}
                      />
                      <div>
                        <span className="label-text font-semibold">
                          {opt.label}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            />
          </div>
          <textarea
            {...register("description")}
            className="textarea textarea-bordered w-full"
            placeholder="描述 (可选)"
          ></textarea>
          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={isSaving}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
            >
              {isSaving && (
                <span className="loading loading-spinner loading-xs"></span>
              )}{" "}
              保存更改
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};

// --- 主页面组件 ---
export const AIModelsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, control } =
    useForm<AIModelCreatePayload>({
      defaultValues: {
        capabilities: ["general"],
        temperature: 0.7,
        top_p: 1.0,
        max_tokens: 4096,
      },
    });

  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [deletingModel, setDeletingModel] = useState<AIModel | null>(null);

  const { data: models = [], isLoading } = useQuery<AIModel[]>({
    queryKey: ["aiModels"],
    queryFn: fetchAIModels,
  });

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aiModels"] });
    },
    onError: (error: any) => {
      toast.error(`操作失败: ${error.response?.data?.detail || error.message}`);
    },
  };

  const addMutation = useMutation({
    mutationFn: createAIModel,
    ...mutationOptions,
    onSuccess: () => {
      reset();
      mutationOptions.onSuccess();
      toast.success("模型添加成功！");
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteAIModel,
    ...mutationOptions,
    onSuccess: () => {
      setDeletingModel(null);
      mutationOptions.onSuccess();
      toast.success("模型删除成功！");
    },
  });
  const activateMutation = useMutation({
    mutationFn: ({ id, modelType }: { id: number; modelType: string }) =>
      setActiveAIModel(id, modelType),
    ...mutationOptions,
    onSuccess: (_data, vars) => {
      mutationOptions.onSuccess();
      toast.success(
        `模型已激活为 '${
          capabilitiesOptions.find((o) => o.value === vars.modelType)?.label ||
          vars.modelType
        }' 类型！`
      );
    },
  });
  const deactivateMutation = useMutation({
    mutationFn: (modelType: string) => deactivateAIModel(modelType),
    ...mutationOptions,
    onSuccess: (_data, modelType) => {
      mutationOptions.onSuccess();
      toast.success(
        `'${
          capabilitiesOptions.find((o) => o.value === modelType)?.label ||
          modelType
        }' 已取消激活！`
      );
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AIModelUpdatePayload }) =>
      updateAIModel(id, data),
    ...mutationOptions,
    onSuccess: () => {
      mutationOptions.onSuccess();
      setEditingModel(null);
      toast.success("模型更新成功！");
    },
  });

  const onSubmit = (data: AIModelCreatePayload) => {
    const payload: AIModelCreatePayload = {
      ...data,
      temperature: data.temperature
        ? parseFloat(data.temperature as any)
        : undefined,
      top_p: data.top_p ? parseFloat(data.top_p as any) : undefined,
      max_tokens: data.max_tokens
        ? parseInt(data.max_tokens as any, 10)
        : undefined,
    };
    addMutation.mutate(payload);
  };

  const parseCapabilities = (
    caps: string[] | string | undefined | null
  ): string[] => {
    if (Array.isArray(caps)) return caps;
    if (typeof caps === "string") {
      try {
        const parsed = JSON.parse(caps);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  if (isLoading)
    return (
      <div className="text-center">
        <span className="loading loading-spinner"></span>
      </div>
    );

  const safeModels = Array.isArray(models) ? models : [];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">AI模型管理</h1>

      <div className="card bg-base-100 shadow-xl border">
        <div className="card-body">
          <h2 className="card-title">当前模型列表</h2>
          <div className="overflow-y-visible">
            <table className="table">
              <thead>
                <tr>
                  <th>模型名称</th>
                  <th>能力</th>
                  <th>激活状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {safeModels.map((model) => {
                  const modelCaps = parseCapabilities(model.capabilities);
                  const isActive =
                    model.is_active_general ||
                    model.is_active_vision ||
                    model.is_active_fast;
                  return (
                    <tr key={model.id} className="hover">
                      <td className="font-bold align-top break-words ">
                        {model.model_name}
                      </td>
                      <td>
                        <div className="flex gap-1 flex-wrap">
                          {modelCaps.map((cap) => (
                            <span key={cap} className="badge badge-outline">
                              {capabilitiesOptions.find((o) => o.value === cap)
                                ?.label || cap}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-2">
                          {model.is_active_general && (
                            <div className="flex items-center gap-2">
                              <div className="badge badge-success gap-1">
                                <CheckCircle size={12} />
                                常规
                              </div>
                              <button
                                onClick={() =>
                                  deactivateMutation.mutate("general")
                                }
                                className="btn btn-xs btn-ghost btn-circle text-error"
                                title="取消激活"
                              >
                                <XCircle size={14} />
                              </button>
                            </div>
                          )}
                          {model.is_active_vision && (
                            <div className="flex items-center gap-2">
                              <div className="badge badge-info gap-1">
                                <Eye size={12} />
                                多模态
                              </div>
                              <button
                                onClick={() =>
                                  deactivateMutation.mutate("vision")
                                }
                                className="btn btn-xs btn-ghost btn-circle text-error"
                                title="取消激活"
                              >
                                <XCircle size={14} />
                              </button>
                            </div>
                          )}
                          {model.is_active_fast && (
                            <div className="flex items-center gap-2">
                              <div className="badge badge-warning gap-1">
                                <Zap size={12} />
                                快速
                              </div>
                              <button
                                onClick={() =>
                                  deactivateMutation.mutate("fast")
                                }
                                className="btn btn-xs btn-ghost btn-circle text-error"
                                title="取消激活"
                              >
                                <XCircle size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="flex gap-2 items-center">
                        <button
                          onClick={() => setEditingModel(model)}
                          className="btn btn-xs btn-ghost btn-circle text-info"
                          title="编辑"
                        >
                          <Edit size={16} />
                        </button>
                        <div className="dropdown dropdown-right dropdown-center">
                          <div
                            tabIndex={0}
                            role="button"
                            className="btn btn-xs btn-outline btn-success "
                          >
                            激活为...
                          </div>
                          <ul
                            tabIndex={0}
                            className="dropdown-content menu w-52 rounded-box shadow-sm bg-base-100 z-20"
                          >
                            {modelCaps.length > 0 ? (
                              modelCaps.map((type) => (
                                <li key={type}>
                                  <a
                                    onClick={(e) => {
                                      activateMutation.mutate({
                                        id: model.id,
                                        modelType: type,
                                      });
                                      (
                                        e.currentTarget.closest(
                                          "[popover]"
                                        ) as HTMLElement
                                      )?.hidePopover();
                                    }}
                                  >
                                    {capabilitiesOptions.find(
                                      (o) => o.value === type
                                    )?.label || type}
                                  </a>
                                </li>
                              ))
                            ) : (
                              <li>
                                <a className="disabled">无可用能力</a>
                              </li>
                            )}
                          </ul>
                        </div>
                        <button
                          onClick={() => setDeletingModel(model)}
                          className="btn btn-xs btn-ghost btn-circle text-error"
                          title="删除"
                          disabled={deleteMutation.isPending || isActive}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* === START: 添加新模型的完整表单 === */}
      <div className="card bg-base-100 shadow-xl border">
        <div className="card-body">
          <h2 className="card-title">添加新模型</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">模型名称 (Model Name)</span>
              </label>
              <label className="input input-bordered flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 opacity-70"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" /></svg>
                <input
                  type="text"
                  {...register("model_name", { required: true })}
                  placeholder="例如：deepseek-chat"
                  className="grow"
                />
              </label>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">API Key</span>
              </label>
              <label className="input input-bordered flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 opacity-70"><path fillRule="evenodd" d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z" clipRule="evenodd" /></svg>
                <input
                  type="password"
                  {...register("api_key", { required: true })}
                  placeholder="sk-..."
                  className="grow"
                />
              </label>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Base URL</span>
              </label>
              <label className="input input-bordered flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 opacity-70"><path fillRule="evenodd" d="M1.75 2a.75.75 0 0 0-.75.75v10.5a.75.75 0 0 0 .75.75h12.5a.75.75 0 0 0 .75-.75V2.75a.75.75 0 0 0-.75-.75H1.75ZM2.5 3.5V12h11V3.5h-11ZM4 5.25a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5A.75.75 0 0 1 4 5.25Zm.75 2.25a.75.75 0 0 0 0 1.5h3.5a.75.75 0 0 0 0-1.5h-3.5Z" clipRule="evenodd" /></svg>
                <input
                  type="url"
                  {...register("base_url", { required: true })}
                  placeholder="例如：https://api.deepseek.com"
                  className="grow"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Temperature (温度)</span>
                </label>
                <label className="input input-bordered flex items-center gap-2">
                  <span className="font-mono">T</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    {...register("temperature")}
                    className="grow"
                  />
                </label>
                <label className="label">
                  <span className="label-text-alt">值越高越有创意 (0-2)</span>
                </label>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Top P</span>
                </label>
                <label className="input input-bordered flex items-center gap-2">
                  <span className="font-mono">P</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    {...register("top_p")}
                    className="grow"
                  />
                </label>
                <label className="label">
                  <span className="label-text-alt">
                    控制生成文本的多样性 (0-1)
                  </span>
                </label>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Max Tokens</span>
                </label>
                <label className="input input-bordered flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 opacity-70"><path d="M14 7.25a.75.75 0 0 0-1.5 0v1.5a.75.75 0 0 0 1.5 0v-1.5ZM3.25 7a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5A.75.75 0 0 1 3.25 7ZM6 6.25a.75.75 0 0 0 0 1.5h.75v2.5H6a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5H8.25v-3H9a.75.75 0 0 0 0-1.5H6ZM2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 12.5v-9ZM3.5 3a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-9Z" /></svg>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    {...register("max_tokens")}
                    className="grow"
                  />
                </label>
                <label className="label">
                  <span className="label-text-alt">最大生成长度</span>
                </label>
              </div>
            </div>

            <div>
              <label className="label">
                <span className="label-text">模型能力 (可多选)</span>
              </label>
              <Controller
                name="capabilities"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    {capabilitiesOptions.map((opt) => (
                      <label
                        key={opt.value}
                        className="label cursor-pointer justify-start gap-4 p-3 bg-base-200/50 rounded-lg"
                      >
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary"
                          checked={
                            Array.isArray(field.value) &&
                            field.value.includes(opt.value)
                          }
                          onChange={(e) => {
                            const currentValues = Array.isArray(field.value)
                              ? field.value
                              : [];
                            const newValues = e.target.checked
                              ? [...currentValues, opt.value]
                              : currentValues.filter((v) => v !== opt.value);
                            field.onChange(newValues);
                          }}
                        />
                        <div>
                          <span className="label-text font-semibold">
                            {opt.label}
                          </span>
                          <span className="text-xs opacity-70 block">
                            {opt.description}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">描述 (可选)</span>
              </label>
              <textarea
                {...register("description")}
                className="textarea textarea-bordered w-full"
                placeholder="关于此模型的简要描述"
              ></textarea>
            </div>

            <div className="card-actions justify-end">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={addMutation.isPending}
              >
                {addMutation.isPending && (
                  <span className="loading loading-spinner loading-xs"></span>
                )}
                添加模型
              </button>
            </div>
          </form>
        </div>
      </div>
      {/* === END: 添加新模型的完整表单 === */}

      <EditModelModal
        isOpen={!!editingModel}
        onClose={() => setEditingModel(null)}
        model={editingModel}
        onSave={(id, data) => updateMutation.mutate({ id, data })}
        isSaving={updateMutation.isPending}
      />

      <ConfirmModal
        isOpen={!!deletingModel}
        onClose={() => setDeletingModel(null)}
        onConfirm={() => {
          if (deletingModel) {
            deleteMutation.mutate(deletingModel.id);
          }
        }}
        title="确认删除模型"
        confirmText="确认删除"
        confirmButtonClass="btn-error"
        isConfirming={deleteMutation.isPending}
      >
        <p>
          您确定要删除模型{" "}
          <strong className="font-mono">{deletingModel?.model_name}</strong>{" "}
          吗？
        </p>
        <p className="text-sm text-error mt-2">此操作不可撤销。</p>
      </ConfirmModal>
    </div>
  );
};
