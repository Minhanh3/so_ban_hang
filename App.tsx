
import React from 'react';
// @fix: Corrected HashRouter, Routes, and Route imports from react-router-dom
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from './components/Layout';
import TodoPage from './pages/TodoPage';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import CustomersPage from './pages/CustomersPage';
import DebtsPage from './pages/DebtsPage';
import FinancePage from './pages/FinancePage';
import ImportPage from './pages/ImportPage';
import SettingsPage from './pages/SettingsPage';
import AIAssistant from './components/AIAssistant';
import AuthPage from './pages/AuthPage';
import { useAuth } from './src/context/AuthContext';

const App: React.FC = () => {
  const { isReady, user } = useAuth();

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-600">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-sm font-bold shadow-sm">
          Đang tải phiên làm việc...
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
        <Route
          path="*"
          element={user ? (
            <>
              <Layout>
                <Routes>
                  <Route path="/" element={<TodoPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/customers" element={<CustomersPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/debts" element={<DebtsPage />} />
                  <Route path="/finance" element={<FinancePage />} />
                  <Route path="/import" element={<ImportPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/pos" element={<OrdersPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
              <AIAssistant />
            </>
          ) : <Navigate to="/auth" replace />}
        />
      </Routes>
    </HashRouter>
  );
};

export default App;
