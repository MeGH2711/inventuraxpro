import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import Analytics from "./pages/Analytics";
import Customers from "./pages/Customers";

import './css/style.css';

// 1. Create a Layout component to keep Sidebar persistent
const Layout = ({ children }) => (
  <div className="d-flex">
    <Sidebar />
    <div id="mainPageContent" className="flex-grow-1">
      {children}
    </div>
  </div>
);

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