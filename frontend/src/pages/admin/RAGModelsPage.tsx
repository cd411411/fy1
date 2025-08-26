// src/pages/admin/RAGModelsPage.tsx

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch, type SubmitHandler } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
    fetchRAGModels,
    createRAGModel,
    deleteRAGModel,
    setActiveRAGModel,
    deactivateRAGModel,
    updateRAGModel
} from '../../api/adminApi';
import type { RAGModel, RAGModelCreatePayload, RAGModelUpdatePayload } from '../../api/adminApi';
import { Trash2, Edit, Search, ListFilter, PlusCircle } from 'lucide-react';
import { ConfirmModal } from '../../components/ConfirmModal';

// --- (新增) 编辑/新增模态框子组件 ---
interface ModelFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    model?: RAGModel; // 如果是编辑模式，传入模型数据
}

const ModelFormModal: React.FC<ModelFormModalProps> = ({ isOpen, onClose, model }) => {
    const queryClient = useQueryClient();
    const isEditMode = !!model;

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<RAGModelCreatePayload>({
        defaultValues: {
            model_type: 'embedding',
            similarity_top_k: 20,
            rerank_top_k: 5,
        }
    });

    const modelType = useWatch({ control, name: "model_type" });

    useEffect(() => {
        if (model) {
            reset(model);
        } else {
            // 为新增模式设置清晰的默认值
            reset({
                name: '',
                api_endpoint: '',
                api_key: '',
                model_type: 'embedding',
                similarity_top_k: 20,
                rerank_top_k: 5,
                output_dim: undefined
            });
        }
    }, [model, isOpen, reset]);

    const mutationOptions = (message: string) => ({
        onSuccess: () => {
            toast.success(message);
            queryClient.invalidateQueries({ queryKey: ['ragModels'] });
            onClose();
        },
        onError: (error: any) => { toast.error(`操作失败: ${error.response?.data?.detail || error.message}`); },
    });

    const createMutation = useMutation({ mutationFn: createRAGModel, ...mutationOptions("模型添加成功！") });
    const updateMutation = useMutation({
        mutationFn: (payload: RAGModelUpdatePayload) => updateRAGModel(model!.id, payload),
        ...mutationOptions("模型更新成功！")
    });

    const onSubmit: SubmitHandler<RAGModelCreatePayload> = (data) => {
        const payload: RAGModelUpdatePayload = {
            ...data,
            output_dim: data.model_type === 'embedding' ? (data.output_dim ? parseInt(data.output_dim.toString(), 10) : undefined) : undefined,
            similarity_top_k: data.model_type === 'embedding' ? (data.similarity_top_k ? parseInt(data.similarity_top_k.toString(), 10) : 20) : undefined,
            rerank_top_k: data.model_type === 'rerank' ? (data.rerank_top_k ? parseInt(data.rerank_top_k.toString(), 10) : 5) : undefined,
        };
        if (isEditMode) {
            updateMutation.mutate(payload);
        } else {
            createMutation.mutate(payload as RAGModelCreatePayload);
        }
    };

    if (!isOpen) return null;

    return (
        <dialog open className="modal modal-open modal-bottom sm:modal-middle">
            <div className="modal-box w-11/12 max-w-2xl">
                <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                <h3 className="font-bold text-lg">{isEditMode ? `编辑模型: ${model.name}` : '添加新模型'}</h3>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
                    <div className="form-control">
                        <label className="input"><span className="label">模型名称</span>
                            <input type="text" {...register("name", { required: "模型名称不能为空" })} className={`${errors.name ? 'input-error' : ''}`} placeholder="例如：bge-large-zh-v1.5" />
                            {errors.name && <label className="label"><span className="label-text-alt text-error">{errors.name.message}</span></label>}
                        </label>
                    </div>

                    <div className="form-control">
                        <label className="input"><span className="label">API 端点</span>
                            <input type="url" {...register("api_endpoint", { required: "API 端点不能为空" })} className={`${errors.api_endpoint ? 'input-error' : ''}`} placeholder="例如：https://api.openai.com/v1/embeddings" />
                            {errors.api_endpoint && <label className="label"><span className="label-text-alt text-error">{errors.api_endpoint.message}</span></label>}
                        </label>
                    </div>

                    <div className="form-control">
                        <label className="input"><span className="label">API Key</span>
                            <input type="password" {...register("api_key")} className="" placeholder={isEditMode ? "如需修改请输入新值" : "sk-..."} />
                        </label>
                    </div>

                    <div className="divider">模型参数</div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-control">
                            <label className="label"><span className="label-text">模型类型</span></label>
                            <select {...register("model_type")} className="select select-bordered w-full" disabled={isEditMode}>
                                <option value="embedding">嵌入模型 (Embedding)</option>
                                <option value="rerank">重排序模型 (Rerank)</option>
                            </select>
                        </div>

                        <div className="form-control">
                            {modelType === 'embedding' ? <>
                                <label className="label"><span className="label-text">相似度检索数量 (Top-K)</span></label>
                                <input type="number" {...register("similarity_top_k", { valueAsNumber: true })} className="input input-bordered" placeholder="例如: 20" />
                            </> : <>
                                <label className="label"><span className="label-text">重排序返回数量 (Top-K)</span></label>
                                <input type="number" {...register("rerank_top_k", { valueAsNumber: true })} className="input input-bordered" placeholder="例如: 5" />
                            </>}
                        </div>
                    </div>

                    {modelType === 'embedding' && (
                        <div className="form-control">
                            <label className="input"><span className="label">输出维度 (Output Dim)</span>
                                <input type="number" {...register("output_dim", { required: "嵌入模型的维度必须指定", valueAsNumber: true })} className={`${errors.output_dim ? 'input-error' : ''}`} placeholder="例如: 1024" />
                            </label>
                        </div>
                    )}

                    <div className="modal-action mt-6">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>取消</button>
                        <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                            {createMutation.isPending || updateMutation.isPending ? <span className="loading loading-spinner"></span> : (isEditMode ? '保存更改' : '添加模型')}
                        </button>
                    </div>
                </form>
            </div>
        </dialog>
    );
};


// --- 主页面组件 ---
export const RAGModelsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [deletingModel, setDeletingModel] = useState<RAGModel | null>(null);
    const [editingModel, setEditingModel] = useState<RAGModel | undefined>(undefined);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: models = [], isLoading } = useQuery<RAGModel[]>({ queryKey: ['ragModels'], queryFn: fetchRAGModels });

    const mutationOptions = (message: string) => ({
        onSuccess: () => { toast.success(message); queryClient.invalidateQueries({ queryKey: ['ragModels'] }); },
        onError: (error: any) => { toast.error(`操作失败: ${error.response?.data?.detail || error.message}`); },
    });

    const deleteMutation = useMutation({ mutationFn: deleteRAGModel, ...mutationOptions("模型删除成功！"), onSettled: () => setDeletingModel(null) });
    const activateMutation = useMutation({ mutationFn: setActiveRAGModel, ...mutationOptions("模型已激活！") });
    const deactivateMutation = useMutation({ mutationFn: deactivateRAGModel, ...mutationOptions("模型已取消激活！") });

    const handleToggleActive = (model: RAGModel) => {
        if (model.is_active) {
            deactivateMutation.mutate(model.id);
        } else {
            activateMutation.mutate(model.id);
        }
    };

    const openAddModelModal = () => {
        setEditingModel(undefined);
        setIsModalOpen(true);
    };

    const openEditModelModal = (model: RAGModel) => {
        setEditingModel(model);
        setIsModalOpen(true);
    };

    const activeEmbedding = models.find(m => m.model_type === 'embedding' && m.is_active);
    const activeRerank = models.find(m => m.model_type === 'rerank' && m.is_active);

    const embeddingModels = models.filter(m => m.model_type === 'embedding');
    const rerankModels = models.filter(m => m.model_type === 'rerank');

    const renderModelTable = (title: string, data: RAGModel[]) => (
        <div className="card bg-base-100 shadow-xl border">
            <div className="card-body">
                <h2 className="card-title">{title}</h2>
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>模型名称</th>
                                <th>参数</th>
                                <th className="text-center">状态</th>
                                <th className="text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 && (
                                <tr><td colSpan={4} className="text-center text-gray-500 py-4">暂无模型，请添加。</td></tr>
                            )}
                            {data.map(model => (
                                <tr key={model.id} className="hover">
                                    <td className="font-bold align-middle">{model.name}</td>
                                    <td className="align-middle">
                                        {model.model_type === 'embedding' ? `召回 Top-K: ${model.similarity_top_k || 'N/A'}` : `返回 Top-K: ${model.rerank_top_k || 'N/A'}`}
                                        {model.model_type === 'embedding' && <div className="text-xs opacity-60">输出维度: {model.output_dim || 'N/A'}</div>}
                                    </td>
                                    <td className="text-center align-middle">
                                        <input
                                            type="checkbox"
                                            className="toggle toggle-success"
                                            title={model.is_active ? "点击取消激活" : "点击激活"}
                                            checked={model.is_active}
                                            onChange={() => handleToggleActive(model)}
                                            disabled={activateMutation.isPending || deactivateMutation.isPending}
                                        />
                                    </td>
                                    <td className="text-right align-middle">
                                        <div className="tooltip" data-tip="编辑">
                                            <button className="btn btn-ghost btn-sm btn-circle" onClick={() => openEditModelModal(model)}><Edit size={16} /></button>
                                        </div>
                                        <div className="tooltip" data-tip="删除">
                                            <button className="btn btn-ghost btn-sm btn-circle text-error" onClick={() => setDeletingModel(model)}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    if (isLoading) return <div className="text-center"><span className="loading loading-spinner"></span></div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">RAG模型与全局检索配置</h1>
                <button className="btn btn-primary" onClick={openAddModelModal}><PlusCircle size={18} className="mr-1" /> 添加新模型</button>
            </div>

            <div className="stats shadow w-full stats-vertical lg:stats-horizontal">
                <div className="stat">
                    <div className="stat-figure text-secondary"><Search /></div>
                    <div className="stat-title">向量检索配置</div>
                    <div className="stat-value text-secondary">{activeEmbedding?.name || '未激活'}</div>
                    <div className="stat-desc">{activeEmbedding ? `初步召回 Top ${activeEmbedding.similarity_top_k || 'N/A'} 个结果` : '嵌入模型未激活'}</div>
                </div>
                <div className="stat">
                    <div className="stat-figure text-accent"><ListFilter /></div>
                    <div className="stat-title">重排序配置</div>
                    <div className="stat-value text-accent">{activeRerank?.name || '已禁用'}</div>
                    <div className="stat-desc">{activeRerank ? `最终返回 Top ${activeRerank.rerank_top_k || 'N/A'} 个结果` : 'Rerank模型未激活'}</div>
                </div>
            </div>

            {renderModelTable("嵌入模型 (Embedding)", embeddingModels)}
            {renderModelTable("重排序模型 (Rerank)", rerankModels)}

            <ModelFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                model={editingModel}
            />

            <ConfirmModal
                isOpen={!!deletingModel}
                onClose={() => setDeletingModel(null)}
                onConfirm={() => { if (deletingModel) deleteMutation.mutate(deletingModel.id); }}
                title="确认删除模型"
                isConfirming={deleteMutation.isPending}
            >
                <p>您确定要删除模型 <strong className="font-mono">{deletingModel?.name}</strong> 吗？此操作不可撤销。</p>
            </ConfirmModal>
        </div>
    );
};