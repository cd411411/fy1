import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

// Header 组件保持不变
const Header: React.FC = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme =
      (localStorage.getItem("theme") as "light" | "dark") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <header className="navbar bg-base-100 shadow-lg border-b border-base-300 fixed top-0 left-0 right-0 z-50 backdrop-blur-sm bg-opacity-90">
      <div className="navbar-start">
        <Link
          to="/"
          className="btn btn-ghost text-xl font-bold hover:bg-primary hover:text-primary-content transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 15l2-5 2 5"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 10v5" />
          </svg>
          要素式诉辩状智能生成平台
        </Link>
      </div>

      <div className="navbar-end">
        <button
          onClick={toggleTheme}
          className="btn btn-ghost btn-circle mr-2 hover:bg-primary hover:text-primary-content transition-colors"
          aria-label="切换主题"
        >
          {theme === "light" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
};

// 修改 Footer 组件，添加模态框功能
const Footer: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <footer className="bg-base-200 text-base-content flex-shrink-0 py-1 px-4">
        <div className="flex items-center justify-center gap-1">
          <p className="text-xs">
            版权所有 © {new Date().getFullYear()} -{" "}
            <button 
              onClick={openModal}
              className="link link-primary no-underline hover:underline"
            >
              李伯阳律师
            </button>{" "}
            - 北京市隆安（广州）律师事务所
          </p>
        </div>
      </footer>

      {/* 作者和工具介绍模态框 */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">关于作者和工具</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-md mb-2">李伯阳律师</h4>
                <p className="text-sm">
                  北京市隆安（广州）律师事务所执业律师，专注于互联网、民商事诉讼、企业法律顾问等领域与业务，
                  具有丰富的法律实务经验，致力于通过技术创新提升法律服务效率和质量。
                </p>
              </div>
              
              <div>
                <h4 className="font-bold text-md mb-2">要素式诉辩状智能生成平台</h4>
                <p className="text-sm">
                  本平台是一个智能化法律文书生成工具，旨在帮助法律工作者快速、准确地生成各类诉辩状文书。
                  通过要素提取、逻辑分析和智能填充等技术，大幅提高文书撰写效率，
                  减少重复性工作，让法律工作者能够更专注于案件核心问题的分析和处理。
                </p>
              </div>
              
              <div>
                <h4 className="font-bold text-md mb-2">平台特点</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>基于案件要素的智能问答系统</li>
                  <li>自动化生成符合法律规范的文书</li>
                  <li>支持AI辅助分析和建议</li>
                  <li>模板化设计，易于扩展和维护</li>
                  <li>界面友好，操作简便</li>
                </ul>
              </div>
              <div className="pt-4">
                <h4 className="font-bold text-md mb-2">疑问或建议？</h4>
                <p className="text-sm mb-2">如您在使用本工具时有任何疑问或建议，请及时联系我。</p>
                <div className="flex items-center mb-1">
                  <span className="text-sm font-medium mr-2">邮箱:</span>
                  <a 
                    href="mailto:liboyang@lslby.com" 
                    className="text-sm link link-primary no-underline hover:underline"
                  >
                    liboyang@lslby.com
                  </a>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium mr-2">微信:</span>
                  <span className="text-sm">legal-lby</span>
                </div>
              </div>
            </div>

            <div className="modal-action">
              <button onClick={closeModal} className="btn btn-primary">
                关闭
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={closeModal}></div>
        </div>
      )}
    </>
  );
};

/**
 * 判断当前路径是否是需要整页滚动的模板选择页面
 * 匹配 /select-template/param1/param2 格式的路径
 * @param pathname - window.location.pathname
 * @returns boolean
 */
const isSelectTemplatePage = (pathname: string): boolean => {
  const regex = /^\/select-template\/[^/]+\/[^/]+$/;
  return regex.test(pathname);
};

export const MainLayout: React.FC = () => {
  const location = useLocation();
  // 根据当前路径判断是否允许整页滚动
  const allowPageScroll = isSelectTemplatePage(location.pathname);

  if (allowPageScroll) {
    // 【允许整页滚动】的布局, 适用于 /select-template/xxx/yyy 页面
    // min-h-screen 保证内容不足一屏时，Footer也能置底
    // flex-1 让 main 区域自动伸展，将 Footer 推向底部
    // 当内容超出一屏时，整个页面会产生滚动条
    return (
      <div className="min-h-screen flex flex-col bg-base-100">
        <Header />
        {/* pt-16 是为了给 fixed 的 Header 留出空间 (4rem = 16 * 0.25rem), 可根据 Header 高度微调 */}
        <main className="flex-1 pt-20 pb-4">
          <Outlet />
        </main>
        <Footer />
      </div>
    );
  } else {
    // 【固定布局，内容区滚动】的布局, 适用于所有其他页面
    // h-screen 和 overflow-hidden 锁定父容器高度为屏幕高度，并防止它自己滚动
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-base-100">
        <Header />
        {/* flex-1 让 main 区域填满剩余空间 */}
        {/* overflow-y-auto 当内容超出 main 区域高度时，为其自身添加垂直滚动条 */}
        <main className="flex-1 overflow-y-auto pt-20 pb-4">
          <Outlet />
        </main>
        {/* 在这种布局下，Footer 也是固定在底部的 */}
        <Footer />
      </div>
    );
  }
};
