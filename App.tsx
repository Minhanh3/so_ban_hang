
import React from 'react';
// @fix: Corrected HashRouter, Routes, and Route imports from react-router-dom
import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from './components/Layout';
import TodoPage from './pages/TodoPage';
import StubPage from './pages/StubPage';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import DebtsPage from './pages/DebtsPage';
import FinancePage from './pages/FinancePage';
import ImportPage from './pages/ImportPage';
import SettingsPage from './pages/SettingsPage';
import AIAssistant from './components/AIAssistant';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<TodoPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/debts" element={<DebtsPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/pos" element={<OrdersPage />} /> {/* POS currently mapped to Orders for simplicity */}
        </Routes>
      </Layout>
      <AIAssistant />
    </HashRouter>
  );
};

export default App;
