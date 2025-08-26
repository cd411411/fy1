import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { Lock, User, ArrowRight } from "lucide-react";
import type { LoginFormData } from "../../interfaces/base.types";

export const LoginPage: React.FC = () => {
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<LoginFormData>();
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/admin/dashboard";

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      toast("您已登录，自动跳转到仪表盘。", { icon: "👋" });
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, from]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.username, data.password);
      toast.success("登录成功！");
      navigate(from, { replace: true });
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || "登录失败，请检查用户名和密码");
      } else {
        toast.error("登录失败，请检查用户名和密码");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-white"></span>
          <p className="mt-4 text-white/80 font-medium">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* 左侧表单区域 */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-base-100">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="bg-gradient-to-r from-primary to-accent w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-base-content mb-2">管理系统</h1>
            <p className="text-base-content/60 text-sm">请登录您的账户</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="form-control">
              <label className="label pb-2">
                <span className="label-text text-sm font-medium">用户名</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-base-content/40 " />
                </div>
                <input
                  type="text"
                  placeholder="输入用户名"
                  className={`input input-bordered w-full pl-11 h-12 bg-base-100 border-base-300 focus:border-primary transition-colors ${
                    errors.username ? 'border-error focus:border-error' : ''
                  }`}
                  {...register("username", { required: "请输入用户名" })}
                />
              </div>
              {errors.username && (
                <span className="text-error text-xs mt-1 ml-1">{errors.username.message as string}</span>
              )}
            </div>

            <div className="form-control">
              <label className="label pb-2">
                <span className="label-text text-sm font-medium">密码</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-base-content/40" />
                </div>
                <input
                  type="password"
                  placeholder="输入密码"
                  className={`input input-bordered w-full pl-11 h-12 bg-base-100 border-base-300 focus:border-primary transition-colors ${
                    errors.password ? 'border-error focus:border-error' : ''
                  }`}
                  {...register("password", { 
                    required: "请输入密码",
                    minLength: {
                      value: 6,
                      message: "密码至少需要6个字符"
                    }
                  })}
                />
              </div>
              {errors.password && (
                <span className="text-error text-xs mt-1 ml-1">{errors.password.message as string}</span>
              )}
            </div>

            <button 
              className="btn btn-primary w-full h-12 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200" 
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  <span>登录中...</span>
                </>
              ) : (
                <>
                  <span>登录</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* 右侧展示区域 */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 items-center justify-center relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-primary rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-accent rounded-full blur-xl"></div>
        </div>
        
        <div className="text-center text-white z-10">
          <div className="mb-8">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              欢迎回来
            </h2>
            <p className="text-white/70 text-lg max-w-md mx-auto leading-relaxed">
              要素式诉辨状生成平台管理后台
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
};