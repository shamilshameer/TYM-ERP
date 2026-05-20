import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Sales from './pages/Sales';
import SalesHistory from './pages/SalesHistory';
import ErrorBoundary from './components/ErrorBoundary';
import { syncService } from './services/syncService';

export const App: React.FC = () => {
  // Start the offline outbox sync engine on app initialization
  useEffect(() => {
    syncService.start();
    return () => {
      syncService.stop();
    };
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/history" element={<SalesHistory />} />
          </Routes>
        </Layout>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
