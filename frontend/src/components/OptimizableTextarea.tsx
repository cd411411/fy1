// src/components/OptimizableTextarea.tsx (最终完整版)

import React, { useState, useRef, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useTextOptimizer } from "../hooks/useTextOptimizer";
import { useFeatureFlags } from "../hooks/useFeatureFlags";
import { useDebounce } from "../hooks/useDebounce";
import { quickScanText, fetchAutocomplete } from "../api/legalApi";
import { useMutation, useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import toast from "react-hot-toast";
import { AlertTriangle } from "lucide-react";

interface Props {
  path: string;
  label: string;
  placeholder?: string;
  rows?: number;
  optimizationContext?: string;
}

export const OptimizableTextarea: React.FC<Props> = ({
  path,
  label,
  placeholder,
  rows = 3,
  optimizationContext = "",
}) => {
  const { flags, isLoading: isLoadingFlags } = useFeatureFlags();
  const { register, getValues, setValue, watch } = useFormContext();
  const { ref: formRef, ...rest } = register(path);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // --- 原有"AI优化"功能的状态 ---
  const { versions, isOptimizing, getOptimizedVersions, setVersions } =
    useTextOptimizer();
  const [showPreview, setShowPreview] = useState(false);

  // --- 新增 - 实时AI辅助功能的状态 ---
  const [riskWarning, setRiskWarning] = useState<string | null>(null);
  const lastAnalyzedTextRef = useRef<string>("");
  const [suggestion, setSuggestion] = useState<string>("");
  const [isFocused, setIsFocused] = useState(false);
  const currentTextValue = watch(path);
  const debouncedText = useDebounce(currentTextValue, 3000);

  // --- 原有"AI优化"功能的处理函数 ---
  const handleOptimizeClick = () => {
    const currentText = getValues(path);
    if (!currentText || currentText.trim().length < 10) {
      toast.error("请输入至少10个字符后再进行优化。");
      return;
    }
    setShowPreview(true);
    getOptimizedVersions(currentText, optimizationContext);
  };

  const handleApplyVersion = (text: string) => {
    setValue(path, text, { shouldValidate: true, shouldDirty: true });
    setShowPreview(false);
    toast.success("已采纳建议！");
  };

  const handleCancel = () => {
    setShowPreview(false);
    setVersions([]);
  };

  // --- 新增 - AI续写与风险预警的逻辑 ---
  const { data: autocompleteData } = useQuery({
    queryKey: ["autocomplete", path, debouncedText],
    queryFn: () => fetchAutocomplete(debouncedText, optimizationContext),
    // 2. 从 enabled 选项中移除对自身的引用
    enabled:
      !isLoadingFlags &&
      flags.autocomplete &&
      !!debouncedText &&
      isFocused &&
      debouncedText === getValues(path),
    staleTime: Infinity,
    gcTime: 300000,
    retry: false,
  });

  useEffect(() => {
    if (autocompleteData?.suggestion && isFocused) {
      setSuggestion(autocompleteData.suggestion);
    } else {
      setSuggestion("");
    }
  }, [autocompleteData, isFocused]);

  const riskScanMutation = useMutation({
    mutationFn: (text: string) => quickScanText(text, optimizationContext),
    onSuccess: (data) => {
      if (data.has_risk && data.feedback) {
        setRiskWarning(data.feedback);
      } else {
        setRiskWarning(null);
      }
    },
    onError: () => {
      setRiskWarning(null);
    },
  });

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSuggestion("");
    rest.onChange(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    setSuggestion("");
    const text = e.target.value;
    if (
      !isLoadingFlags &&
      flags.risk_analysis &&
      text &&
      text.trim().length > 10 &&
      text !== lastAnalyzedTextRef.current &&
      !riskScanMutation.isPending
    ) {
      lastAnalyzedTextRef.current = text;
      riskScanMutation.mutate(text);
    } else if (!text || text.trim().length <= 10) {
      setRiskWarning(null);
    }
    rest.onBlur(e);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestion && e.key === "Tab") {
      e.preventDefault();
      setValue(path, currentTextValue + suggestion, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setSuggestion("");
    }
  };

  return (
    <div className="form-control w-full relative">
      <div className="flex justify-between items-center">
        <label className="label py-1">
          <span className="label-text">{label}</span>
        </label>
        <button
          type="button"
          onClick={handleOptimizeClick}
          className="btn btn-xs btn-ghost text-accent"
          disabled={isOptimizing || riskScanMutation.isPending}
          title="AI优化文本"
        >
          {isOptimizing ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            "✨ 优化"
          )}
        </button>
      </div>

      <div className="relative w-full">
        <textarea
          {...rest}
          ref={(e) => {
            formRef(e);
            textareaRef.current = e;
          }}
          className="textarea textarea-bordered w-full"
          placeholder={placeholder}
          rows={rows}
          onChange={handleTextChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
        />
        {isFocused && suggestion && flags.autocomplete && (
          <div className="absolute top-0 left-0 p-3 pointer-events-none w-full h-full overflow-hidden">
            <span className="text-base-content/40">
              <span className="opacity-0">{currentTextValue}</span>
              <span>{suggestion}</span>
            </span>
          </div>
        )}
      </div>

      {riskScanMutation.isPending && (
        <div className="text-xs text-info mt-1 flex items-center gap-1">
          <span className="loading loading-spinner loading-xs"></span>
          AI正在分析风险...
        </div>
      )}
      {riskWarning && flags.risk_analysis && (
        <div
          role="alert"
          className="alert alert-warning mt-2 p-2 animate-fade-in"
        >
          <AlertTriangle size={16} />
          <span className="text-xs">{riskWarning}</span>
          <button
            onClick={() => setRiskWarning(null)}
            className="btn btn-xs btn-ghost btn-circle"
          >
            ✕
          </button>
        </div>
      )}

      {showPreview && (
        <div className="mt-4 p-4 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-lg font-bold text-primary">AI 优化建议</p>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={handleCancel}
            >
              关闭
            </button>
          </div>

          {isOptimizing && (
            <div className="text-center p-8">
              <span className="loading loading-lg loading-spinner text-primary"></span>
              <p>正在生成优化版本...</p>
            </div>
          )}

          {!isOptimizing &&
            versions.map((version, index) => (
              <div key={index} className="card border shadow-sm bg-base-100">
                <div className="card-body p-4">
                  <h3 className="card-title text-base">版本 {index + 1}</h3>
                  <div className="p-3 rounded-md my-2 prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {version.version_text}
                    </ReactMarkdown>
                  </div>
                  <p className="text-xs font-semibold mt-2">侧重点/优点:</p>
                  <p className="text-xs text-base-content/80">
                    {version.focus_or_merits}
                  </p>
                  <div className="card-actions justify-end mt-3">
                    <button
                      type="button"
                      className="btn btn-xs btn-primary"
                      onClick={() => handleApplyVersion(version.version_text)}
                    >
                      采纳此版本
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
