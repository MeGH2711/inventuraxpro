import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Setting from "./pages/Settings";
import CompanyDetails from "./pages/CompanyDetails";
import AccountSecurity from "./pages/AccountSecurity";
import Billing from "./pages/Billing";
import BillLogs from "./pages/BillLogs";
import BillPreview from "./pages/BillPreview";
import Analytics from "./pages/Analytics";
import Customers from "./pages/Customers";

import './css/style.css';

// 1. Updated Layout component to handle dynamic titles
const Layout = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    // Define your route-to-title mapping
    const titleMap = {
      '/dashboard': 'Dashboard | Inventurax',
      '/products': 'Products | Inventurax',
      '/setting': 'Settings | Inventurax',
      '/setting/company': 'Company Details | Inventurax',
      '/setting/security': 'Security | Inventurax',
      '/billing': 'Billing | Inventurax',
      '/billlogs': 'Bill Logs | Inventurax',
      '/analytics': 'Analytics | Inventurax',
      '/customers': 'Customers | Inventurax',
    };

    // Handle dynamic routes (like IDs) or static mapping
    const currentPath = location.pathname;

    if (currentPath.startsWith('/billpreview/')) {
      document.title = 'Preview Bill | Inventurax';
    } else {
      document.title = titleMap[currentPath] || 'My App';
    }
  }, [location]); // Re-runs every time the URL changes

  return (
    <div className="d-flex">
      <Sidebar />
      <div id="mainPageContent" className="flex-grow-1">
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />

          {/* 2. Wrap all protected routes in a way that Sidebar stays put */}
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <Layout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/products" element={<Products />} />

                    <Route path="/setting" element={<Setting />} />
                    <Route path="/setting/company" element={<CompanyDetails />} />
                    <Route path="/setting/security" element={<AccountSecurity />} />

                    <Route path="/billing" element={<Billing />} />
                    <Route path="/billlogs" element={<BillLogs />} />
                    <Route path="/billpreview/:id" element={<BillPreview />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/customers" element={<Customers />} />

                    <Route path="/" element={<Navigate to="/dashboard" />} />
                  </Routes>
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;