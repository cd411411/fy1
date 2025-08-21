import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { Lock, User } from "lucide-react";
import type { LoginFormData } from "../../interfaces/base.types";

// Admin login page with blue gradient styling
export const LoginPage: React.FC = () => {
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<LoginFormData>();
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/admin/dashboard";
  const fontStyle = {
    fontFamily: '"SimHei", "Microsoft YaHei", "PingFang SC", "SimSun", sans-serif'
  };

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
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300"
        style={fontStyle}
      >
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-blue-700"></span>
          <p className="mt-4 text-blue-700/80 font-medium">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300"
      style={fontStyle}
    >
      <div className="flex items-center gap-4 mb-6">
        <img src="/Court_Insignia.png" alt="法院徽章" className="w-16 h-16" />
        <h1 className="text-2xl font-bold text-blue-900">全国法院办案办公平台</h1>
      </div>
      <div className="w-full max-w-md bg-white/90 backdrop-blur p-8 rounded-xl shadow-xl">
        <div role="tablist" className="tabs tabs-bordered mb-6 justify-center">
          <button role="tab" className="tab tab-active">用户登录</button>
          <button role="tab" className="tab">执行调度登录</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="form-control">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-base-content/40" />
              </div>
              <input
                type="text"
                placeholder="用户名/手机号/身份证号"
                className={`input input-bordered w-full pl-11 h-12 ${errors.username ? 'border-error focus:border-error' : ''}`}
                {...register("username", { required: "请输入用户名" })}
              />
            </div>
            {errors.username && (
              <span className="text-error text-xs mt-1 ml-1">{errors.username.message as string}</span>
            )}
          </div>

          <div className="form-control">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-base-content/40" />
              </div>
              <input
                type="password"
                placeholder="密码"
                className={`input input-bordered w-full pl-11 h-12 ${errors.password ? 'border-error focus:border-error' : ''}`}
                {...register("password", {
                  required: "请输入密码",
                  minLength: {
                    value: 6,
                    message: "密码至少需要6个字符",
                  },
                })}
              />
            </div>
            {errors.password && (
              <span className="text-error text-xs mt-1 ml-1">{errors.password.message as string}</span>
            )}
          </div>

          <div className="flex items-center text-sm text-base-content/70">
            <label className="inline-flex items-center mr-4">
              <input type="checkbox" className="checkbox checkbox-xs mr-2" />
              记住账号
            </label>
            <label className="inline-flex items-center">
              <input type="checkbox" className="checkbox checkbox-xs mr-2" />
              记住密码
            </label>
            <a href="#" className="ml-auto hover:text-blue-600">忘记密码</a>
          </div>

          <button
            className="btn btn-primary w-full h-12 text-white font-medium"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                <span>登录中...</span>
              </>
            ) : (
              <span>登录</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

