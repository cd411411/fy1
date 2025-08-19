// src/App.tsx (已重构为正确的路由结构)

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./App.css";

// Providers
import { BackgroundTaskProvider } from "./contexts/BackgroundTaskContext";
import { ConfigProvider } from "./contexts/ConfigContext";
import { AuthProvider } from './contexts/AuthContext';
import { FeatureFlagProvider } from './contexts/FeatureFlagContext';

// Layouts
import { MainLayout } from "./layouts/MainLayout";
import { AdminLayout } from './layouts/AdminLayout';

// Components
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages - User Facing
import { Home } from "./pages/Home";
import { DocumentTypeSelection } from "./pages/DocumentTypeSelection";
import { TemplateSelection } from "./pages/TemplateSelection";
import { FormContainer } from "./pages/FormContainer";

// Pages - Admin
import { LoginPage } from './pages/admin/LoginPage';
import { DashboardPage } from './pages/admin/DashboardPage';
import { PendingCasesPage } from './pages/admin/PendingCasesPage';
import { AllCasesPage } from './pages/admin/AllCasesPage';
import { AdminCaseDetailPage } from './pages/admin/AdminCaseDetailPage';
import { AIModelsPage } from './pages/admin/AIModelsPage';
import { FilingReviewPage } from './pages/admin/FilingReviewPage';
import { CaseJudgementPage } from './pages/admin/CaseJudgementPage';
import { FeatureSettingsPage } from "./pages/admin/FeatureSettingsPage";

function App() {
  return (
    <BrowserRouter>
      <ConfigProvider>
        <AuthProvider>
          
          <Toaster position="top-center" reverseOrder={false} />
          <FeatureFlagProvider>
          <BackgroundTaskProvider>
            {/* === START: 核心修改 - 单一的 Routes 组件 === */}
            <Routes>
              {/* --- 用户端路由 --- */}
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Home />} />
                <Route path="select-type/:docType" element={<DocumentTypeSelection />} />
                <Route path="select-template/:docType/:category" element={<TemplateSelection />} />
                <Route path=":docType/:formName" element={<FormContainer />} />
              </Route>

              {/* --- 管理后台路由 --- */}
              <Route path="/admin/login" element={<LoginPage />} />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                {/* 嵌套路由使用相对路径，且会自动渲染在 AdminLayout 的 <Outlet> 中 */}
                <Route index element={<Navigate to="dashboard" replace />} /> {/* /admin 默认跳转到 dashboard */}
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="pending-cases" element={<PendingCasesPage />} />
                <Route path="all-cases" element={<AllCasesPage />} />
                <Route path="cases/:caseNumber" element={<AdminCaseDetailPage />} />
                <Route path="ai-models" element={<AIModelsPage />} />
                <Route path="filing-review/:caseNumber" element={<FilingReviewPage />} />
                <Route path="judgement/:caseNumber" element={<CaseJudgementPage />} />
                <Route path="feature-settings" element={<FeatureSettingsPage />} />
              </Route>

              <Route path="*" element={<div>404 - 页面未找到</div>} />

            </Routes>
          </BackgroundTaskProvider>
          </FeatureFlagProvider>
        </AuthProvider>
      </ConfigProvider>
    </BrowserRouter>
  );
}

export default App;