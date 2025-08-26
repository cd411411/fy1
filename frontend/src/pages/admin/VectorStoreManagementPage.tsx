// src/pages/admin/VectorStoreManagementPage.tsx

import React, { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useDropzone } from "react-dropzone";
import {
  fetchAllStructuredCaseCauses,
  fetchDocumentGroups,
  uploadToVectorStore,
  deleteDocumentGroup,
  fetchVectorStores,
  fetchRAGModels,
  rebuildDocumentGroup, // 新增
  getTaskStatus,
} from "../../api/adminApi";
import type {
  DocumentGroup,
  VectorStore,
  StructuredCausesResponse,
  RAGModel,
  RebuildConfigPayload, // 新增
} from "../../api/adminApi";
import { UploadCloud, FileText, Trash2, Eye, RefreshCw } from "lucide-react";
import { ConfirmModal } from "../../components/ConfirmModal";
// import { getTaskStatus } from '../../api/adminApi';

// --- 子组件：上传模态框 (已升级) ---
interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseCause: string;
}

const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  caseCause,
}) => {
  const [strategy, setStrategy] = useState<"chunk" | "qa" | "excel_qa">(
    "chunk"
  );
  const [files, setFiles] = useState<File[]>([]);
  const [groupName, setGroupName] = useState("");
  const [chunkSize, setChunkSize] = useState(512);
  const [overlap, setOverlap] = useState(50);
  const queryClient = useQueryClient();

  const pollTaskStatus = (taskId: string) => {
    const interval = setInterval(async () => {
      try {
        const statusData = await getTaskStatus(taskId);
        if (statusData.status === "SUCCESS") {
          toast.success("后台处理成功！");
          queryClient.invalidateQueries({
            queryKey: ["documentGroups", caseCause],
          });
          clearInterval(interval);
        } else if (statusData.status === "FAILURE") {
          toast.error(
            `后台处理失败: ${statusData.result?.exc_message || "未知错误"}`
          );
          queryClient.invalidateQueries({
            queryKey: ["documentGroups", caseCause],
          });
          clearInterval(interval);
        }
        // 如果是 PENDING 或 STARTED，则继续轮询
      } catch (error) {
        toast.error("查询任务状态失败。");
        clearInterval(interval);
      }
    }, 5000); // 每5秒查询一次
  };

  const uploadMutation = useMutation({
    mutationFn: (vars: { strategy: "chunk" | "qa" | "excel_qa" }) =>
      uploadToVectorStore({
        caseCause,
        strategy: vars.strategy,
        files,
        groupName,
        chunkSize,
        overlap,
      }),
    // (回退) 修改 onSuccess 逻辑
    onSuccess: (data) => {
      toast.success("任务已提交，后台处理中...");
      if (data.task_id) {
        pollTaskStatus(data.task_id);
      }
      handleClose();
    },
    onError: (e: any) =>
      toast.error(`上传请求失败: ${e.response?.data?.detail || e.message}`),
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // 【调试点】在这里添加日志
    console.log("react-dropzone onDrop acceptedFiles:", acceptedFiles);
    // 检查第一个文件是否是 File 对象
    if (acceptedFiles.length > 0) {
      console.log(
        "Is the first item a File object?",
        acceptedFiles[0] instanceof File
      );
    }
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const handleClose = () => {
    setFiles([]);
    setGroupName("");
    setStrategy("chunk");
    onClose();
  };

  const handleUpload = () => {
    if (files.length > 0) {
      uploadMutation.mutate({ strategy });
    }
  };

  if (!isOpen) return null;

  return (
    <dialog open className="modal modal-open modal-bottom sm:modal-middle">
      <div className="modal-box w-11/12 max-w-lg">
        <button
          onClick={handleClose}
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        >
          ✕
        </button>
        <h3 className="font-bold text-lg">为 "{caseCause}" 上传新资料</h3>

        <div className="form-control mt-4">
          <label className="input w-full">
            <span className="label">资料组名称</span>
            <input
              type="text"
              className=""
              placeholder="默认使用文件名"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </label>
        </div>

        <div
          {...getRootProps()}
          className="mt-4 p-6 border-2 border-dashed rounded-lg text-center cursor-pointer hover:border-primary bg-base-200"
        >
          <input {...getInputProps()} />
          <p className="text-gray-500">拖拽文件至此，或点击选择</p>
          <p className="text-xs text-gray-400 mt-1">
            支持 TXT, DOCX, PDF, 图片, Excel
          </p>
        </div>
        {files.length > 0 && (
          <div className="mt-2 text-xs text-slate-500">
            已选择 {files.length} 个文件: {files.map((f) => f.name).join(", ")}
          </div>
        )}

        <div className="form-control mt-4 ">
          <label className="select w-full">
            <span className="label">处理策略</span>
            <select
              className="select select-bordered"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as any)}
            >
              <option value="chunk">自动分块 (适用于长文档)</option>
              <option value="qa">AI生成Q&A对 (适用于知识性文档)</option>
              <option value="excel_qa">从Excel导入Q&A对</option>
            </select>
          </label>
        </div>

        {strategy === "chunk" && (
          <div className="grid grid-cols-2 gap-4 mt-2 p-4 bg-base-200 rounded-lg">
            <div className="form-control">
              <label className="label">
                <span className="label-text">块大小 (Chunk)</span>
              </label>
              <input
                type="number"
                value={chunkSize}
                onChange={(e) => setChunkSize(parseInt(e.target.value))}
                className="input input-bordered"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">重叠大小 (Overlap)</span>
              </label>
              <input
                type="number"
                value={overlap}
                onChange={(e) => setOverlap(parseInt(e.target.value))}
                className="input input-bordered"
              />
            </div>
          </div>
        )}

        <div className="modal-action mt-6">
          <button className="btn btn-ghost" onClick={handleClose}>
            取消
          </button>
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={files.length === 0 || uploadMutation.isPending}
          >
            {uploadMutation.isPending && (
              <span className="loading loading-spinner"></span>
            )}
            开始处理
          </button>
        </div>
      </div>
    </dialog>
  );
};

// --- (新增) 查看文件列表模态框 ---
const FileListModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  group: DocumentGroup;
}> = ({ isOpen, onClose, group }) => {
  if (!isOpen) return null;
  return (
    <dialog open className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">"{group.name}" 包含的文件</h3>
        <ul className="list-disc pl-5 mt-4 space-y-2">
          {group.source_filenames.map((filename, index) => (
            <li key={index} className="flex items-center gap-2">
              <FileText size={16} className="text-gray-500" />
              <span>{filename}</span>
            </li>
          ))}
        </ul>
        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </dialog>
  );
};

// --- (新增) 重构模态框 ---
const RebuildModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  group: DocumentGroup;
  currentCaseCause: string; // 新增 prop 以便刷新正确的 query
}> = ({ isOpen, onClose, group, currentCaseCause }) => {
  const queryClient = useQueryClient();
  const [strategy, setStrategy] = useState<"chunk" | "qa" | "excel_qa">(
    "chunk"
  );
  const [chunkSize, setChunkSize] = useState(512);
  const [overlap, setOverlap] = useState(50);

  // 轮询任务状态的函数
  const pollTaskStatus = (taskId: string) => {
    const interval = setInterval(async () => {
      try {
        const statusData = await getTaskStatus(taskId);
        if (statusData.status === "SUCCESS") {
          toast.success(`资料组 "${group.name}" 重构成功！`);
          // 使用传入的 currentCaseCause 来刷新正确的 query
          queryClient.invalidateQueries({
            queryKey: ["documentGroups", currentCaseCause],
          });
          clearInterval(interval);
        } else if (statusData.status === "FAILURE") {
          const errorMessage =
            typeof statusData.result === "object" && statusData.result !== null
              ? statusData.result.exc_message
              : "未知错误";
          toast.error(`重构失败: ${errorMessage}`);
          queryClient.invalidateQueries({
            queryKey: ["documentGroups", currentCaseCause],
          });
          clearInterval(interval);
        }
        // 如果是 PENDING 或 STARTED，则继续轮询...
      } catch (error) {
        toast.error("查询任务状态失败。");
        clearInterval(interval);
      }
    }, 3000); // 每3秒查询一次
  };

  const rebuildMutation = useMutation({
    mutationFn: (config: RebuildConfigPayload) =>
      rebuildDocumentGroup(group.id, config),
    // (回退) 修改 onSuccess 逻辑
    onSuccess: (data) => {
      toast.success("重构任务已提交，后台处理中...");
      if (data.task_id) {
        pollTaskStatus(data.task_id);
      }
      onClose();
    },
    onError: (e: any) =>
      toast.error(`提交重构任务失败: ${e.response?.data?.detail || e.message}`),
  });

  const handleRebuild = () => {
    rebuildMutation.mutate({ strategy, chunk_size: chunkSize, overlap });
  };

  if (!isOpen) return null;

  return (
    <dialog open className="modal modal-open modal-bottom sm:modal-middle">
      <div className="modal-box w-11/12 max-w-lg">
        <button
          onClick={onClose}
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        >
          ✕
        </button>
        <h3 className="font-bold text-lg">重构资料组: "{group.name}"</h3>
        <div className="py-4">
          <div role="alert" className="alert alert-warning">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>
              <b>注意:</b>{" "}
              此操作将删除旧的向量数据，并使用新配置和当前激活的Embedding模型重新生成。
            </span>
          </div>

          <div className="form-control mt-4">
            <label className="label">
              <span className="label-text">选择新的处理策略</span>
            </label>
            <select
              className="select select-bordered"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as any)}
            >
              <option value="chunk">自动分块 (适用于长文档)</option>
              <option value="qa">AI生成Q&A对 (适用于知识性文档)</option>
              <option value="excel_qa">
                从Excel导入Q&A对 (仅当源文件是Excel时有效)
              </option>
            </select>
          </div>

          {strategy === "chunk" && (
            <div className="grid grid-cols-2 gap-4 mt-2 p-4 bg-base-200 rounded-lg">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">块大小 (Chunk)</span>
                </label>
                <input
                  type="number"
                  value={chunkSize}
                  onChange={(e) => setChunkSize(parseInt(e.target.value))}
                  className="input input-bordered"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">重叠大小 (Overlap)</span>
                </label>
                <input
                  type="number"
                  value={overlap}
                  onChange={(e) => setOverlap(parseInt(e.target.value))}
                  className="input input-bordered"
                />
              </div>
            </div>
          )}
        </div>
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>
            取消
          </button>
          <button
            className="btn btn-primary"
            onClick={handleRebuild}
            disabled={rebuildMutation.isPending}
          >
            {rebuildMutation.isPending && (
              <span className="loading loading-spinner"></span>
            )}
            确认重构
          </button>
        </div>
      </div>
    </dialog>
  );
};

// --- 主页面 ---
export const VectorStoreManagementPage: React.FC = () => {
  const [selectedCause, setSelectedCause] = useState<string>("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState<DocumentGroup | null>(
    null
  );
  const [viewingGroup, setViewingGroup] = useState<DocumentGroup | null>(null); // 新增
  const [rebuildingGroup, setRebuildingGroup] = useState<DocumentGroup | null>(
    null
  ); // 新增
  const queryClient = useQueryClient();

  const { data: structuredCauses, isLoading: isLoadingCauses } =
    useQuery<StructuredCausesResponse>({
      queryKey: ["structuredCaseCauses"],
      queryFn: fetchAllStructuredCaseCauses,
      staleTime: Infinity,
    });

  const { data: vectorStores = [] } = useQuery<VectorStore[]>({
    queryKey: ["vectorStores"],
    queryFn: fetchVectorStores,
  });

  useQuery<RAGModel[]>({
    queryKey: ["ragModels"],
    queryFn: fetchRAGModels,
  });

  useEffect(() => {
    if (!selectedCause && structuredCauses) {
      const firstCategory = Object.keys(structuredCauses)[0];
      if (firstCategory && structuredCauses[firstCategory].length > 0) {
        setSelectedCause(structuredCauses[firstCategory][0].name);
      }
    }
  }, [structuredCauses, selectedCause]);

  const selectedVectorStore = vectorStores.find(
    (store) => store.case_cause === selectedCause
  );

  const { data: docGroups = [], isLoading: isLoadingGroups } = useQuery<
    DocumentGroup[]
  >({
    queryKey: ["documentGroups", selectedCause], // 使用 caseCause 作为 key
    queryFn: () => fetchDocumentGroups(selectedVectorStore!.id),
    enabled: !!selectedVectorStore,
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (groupId: number) => deleteDocumentGroup(groupId),
    onSuccess: () => {
      toast.success("文档组已删除");
      queryClient.invalidateQueries({
        queryKey: ["documentGroups", selectedCause],
      });
    },
    onSettled: () => setDeletingGroup(null),
  });

  return (
    <div className="flex h-full gap-6">
      <div className="w-72 bg-base-200 rounded-box p-4 flex-shrink-0 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-2 p-2">案由知识库</h2>
        {isLoadingCauses ? (
          <div className="text-center">
            <span className="loading loading-spinner"></span>
          </div>
        ) : (
          Object.entries(structuredCauses || {}).map(([category, causes]) => (
            <div
              key={category}
              className="collapse collapse-arrow bg-base-100 mb-2"
            >
              <input
                type="radio"
                name="cause-accordion"
                defaultChecked={category === "民事案由"}
              />
              <div className="collapse-title text-md font-medium">
                {category}
              </div>
              <div className="collapse-content">
                <ul className="menu menu-sm -m-4">
                  {causes.map((cause) => (
                    <li key={cause.id}>
                      <a
                        className={selectedCause === cause.name ? "active" : ""}
                        onClick={() => setSelectedCause(cause.name)}
                      >
                        {cause.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex-1 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">
            {selectedCause || "请选择一个案由"}
          </h1>
          <button
            className="btn btn-primary"
            onClick={() => setIsUploadModalOpen(true)}
            disabled={!selectedCause}
          >
            <UploadCloud size={18} className="mr-1" /> 上传新资料
          </button>
        </div>

        {/* (重构) 资料组列表区域 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">"{selectedCause}" 的已上传资料</h2>
          {isLoadingGroups ? (
            <div className="text-center p-8">
              <span className="loading loading-spinner"></span>
            </div>
          ) : docGroups.length === 0 ? (
            <div className="text-center text-gray-500 py-8 card bg-base-200">
              该案由下暂无知识库文档，请上传新资料。
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {docGroups.map((group) => (
                <div
                  key={group.id}
                  className="card bg-base-100 shadow border hover:shadow-lg transition-shadow"
                >
                  <div className="card-body">
                    <h3 className="card-title text-base">{group.name}</h3>
                    <p className="text-xs text-gray-500">
                      上传于: {new Date(group.created_at).toLocaleString()}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <div className="badge badge-ghost text-xs">
                          {group.embedding_model_name || "N/A"}
                        </div>
                      </div>
                      <div className="card-actions justify-end">
                        <button
                          className="btn btn-xs btn-ghost"
                          onClick={() => setViewingGroup(group)}
                        >
                          <Eye size={14} /> 查看文件
                        </button>
                        <button
                          className="btn btn-xs btn-ghost"
                          onClick={() => setRebuildingGroup(group)}
                        >
                          <RefreshCw size={14} /> 重构
                        </button>
                        <button
                          className="btn btn-xs btn-ghost text-error"
                          onClick={() => setDeletingGroup(group)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        caseCause={selectedCause}
      />

      {viewingGroup && (
        <FileListModal
          isOpen={!!viewingGroup}
          onClose={() => setViewingGroup(null)}
          group={viewingGroup}
        />
      )}
      {rebuildingGroup && (
        <RebuildModal
          isOpen={!!rebuildingGroup}
          onClose={() => setRebuildingGroup(null)}
          group={rebuildingGroup}
          currentCaseCause={selectedCause}
        />
      )}
      <ConfirmModal
        isOpen={!!deletingGroup}
        onClose={() => setDeletingGroup(null)}
        onConfirm={() => {
          if (deletingGroup) deleteGroupMutation.mutate(deletingGroup.id);
        }}
        title="确认删除资料组"
        isConfirming={deleteGroupMutation.isPending}
      >
        <p>
          您确定要删除资料组{" "}
          <strong className="font-mono">{deletingGroup?.name}</strong> 吗？
        </p>
        <p className="text-sm text-error mt-2">
          此操作将删除其包含的所有向量化数据，且不可撤销。
        </p>
      </ConfirmModal>
    </div>
  );
};
