// src/layouts/AdminLayout.tsx (最终版，已修正顶栏覆盖问题)

import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Sun, Moon, Monitor, Menu } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

// AdminSidebar 组件无需改动，保持原样"
const AdminSidebar: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate(); // 添加导航功能

  const [theme, setTheme] = useState(
    () => localStorage.getItem("daisyui-theme") || "system"
  );
  const [isSystemDark, setIsSystemDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const effectiveTheme =
    theme === "system" ? (isSystemDark ? "dark" : "light") : theme;

  useEffect(() => {
    localStorage.setItem("daisyui-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", effectiveTheme);
  }, [effectiveTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => setIsSystemDark(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const themes = [
    { name: "亮色", value: "light", icon: <Sun size={16} /> },
    { name: "暗色", value: "dark", icon: <Moon size={16} /> },
    { name: "跟随系统", value: "system", icon: <Monitor size={16} /> },
  ];

  return (
    <aside className="w-48 bg-base-200 flex flex-col h-full overflow-y-auto">
      <div className="p-4 shrink-0">
        <h1
          className="text-2xl font-bold text-primary cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate("/")}
        >
          要素式诉辩状
        </h1>
        <h2 className="text-lg font-semibold">管理后台</h2>
      </div>
      <ul className="menu p-4 flex-grow">
        <li>
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              isActive
                ? "btn btn-active justify-start text-base"
                : "btn btn-ghost justify-start text-base"
            }
          >
            仪表盘
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/admin/pending-cases"
            className={({ isActive }) =>
              isActive
                ? "btn btn-active justify-start text-base"
                : "btn btn-ghost justify-start text-base"
            }
          >
            待立案审查
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/admin/all-cases"
            className={({ isActive }) =>
              isActive
                ? "btn btn-active justify-start text-base"
                : "btn btn-ghost justify-start text-base"
            }
          >
            全部案件管理
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/admin/ai-models"
            className={({ isActive }) =>
              isActive
                ? "btn btn-active justify-start text-base"
                : "btn btn-ghost justify-start text-base"
            }
          >
            AI模型管理
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/admin/rag-models"
            className={({ isActive }) =>
              isActive
                ? "btn btn-active justify-start text-base"
                : "btn btn-ghost justify-start text-base"
            }
          >
            RAG模型管理
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/admin/vector-stores"
            className={({ isActive }) =>
              isActive
                ? "btn btn-active justify-start text-base"
                : "btn btn-ghost justify-start text-base"
            }
          >
            向量知识库
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/admin/ai-usage-stats"
            className={({ isActive }) =>
              isActive
                ? "btn btn-active justify-start text-base"
                : "btn btn-ghost justify-start text-base"
            }
          >
            AI使用统计
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/admin/feature-settings"
            className={({ isActive }) =>
              isActive
                ? "btn btn-active justify-start text-base"
                : "btn btn-ghost justify-start text-base"
            }
          >
            功能设置
          </NavLink>
        </li>
      </ul>
      <div className="p-4 border-t border-base-300 space-y-2">
        <div className="dropdown dropdown-top w-full">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost w-full justify-start"
          >
            {effectiveTheme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
            <span>切换主题</span>
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-full"
          >
            {themes.map((t) => (
              <li key={t.value}>
                <a
                  onClick={() => setTheme(t.value)}
                  className={`flex items-center gap-2 ${
                    theme === t.value ? "bg-primary text-primary-content" : ""
                  }`}
                >
                  {t.icon} {t.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={logout}
          className="btn btn-ghost w-full justify-start gap-2"
        >
          <LogOut size={16} /> 退出登录
        </button>
      </div>
    </aside>
  );
};

// [重大结构调整] 将 Navbar 移至 Drawer 外部
export const AdminLayout: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const drawerCheckbox = document.getElementById(
      "my-drawer"
    ) as HTMLInputElement;
    if (drawerCheckbox && drawerCheckbox.checked) {
      drawerCheckbox.checked = false;
    }
  }, [location]);

  return (
    <div className="flex flex-col h-screen bg-base-100">
      {/* 移动端专属的导航栏，现在是 Drawer 的兄弟元素 */}
      <div className="w-full navbar bg-base-200 lg:hidden">
        <div className="flex-none">
          <label
            htmlFor="my-drawer"
            aria-label="open sidebar"
            className="btn btn-square btn-ghost"
          >
            <Menu size={20} />
          </label>
        </div>
        <div className="flex-1 px-2 mx-2 font-bold">要素式诉辩状</div>
      </div>

      {/* Drawer 组件现在会占据剩余的垂直空间 */}
      <div className="flex-1 drawer lg:drawer-open">
        <input id="my-drawer" type="checkbox" className="drawer-toggle" />

        {/* 主内容区域，增加 overflow-y-auto 使其可以独立滚动 */}
        <div className="drawer-content flex flex-col overflow-y-auto">
          <main className="flex-1 p-4 sm:p-8">
            <Outlet />
          </main>
        </div>

        <div className="drawer-side">
          <label
            htmlFor="my-drawer"
            aria-label="close sidebar"
            className="drawer-overlay"
          ></label>
          <AdminSidebar />
        </div>
      </div>
    </div>
  );
};
