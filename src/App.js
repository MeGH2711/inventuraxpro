import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import PrivateRoute from "./components/PrivateRoute";

// Pages
import Login from "./pages/Login";
import PublicBill from "./pages/PublicBill";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Setting from "./pages/Settings";
import CompanyDetails from "./pages/CompanyDetails";
import AccountSecurity from "./pages/AccountSecurity";
import Billing from "./pages/Billing";
import BillLogs from "./pages/BillLogs";
import Analytics from "./pages/Analytics";
import Customers from "./pages/Customers";
import MarketingLanding from "./pages/MarketingLanding";

import './css/style.css';

const Layout = ({ children }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Check if current page is the marketing page
  const isMarketingPage = currentPath === '/';

  useEffect(() => {
    const titleMap = {
      '/login': 'Login | Inventurax',
      '/dashboard': 'Dashboard | Inventurax',
      '/products': 'Products | Inventurax',
      '/setting': 'Settings | Inventurax',
      '/setting/company': 'Company Details | Inventurax',
      '/setting/security': 'Security | Inventurax',
      '/billing': 'Billing | Inventurax',
      '/billlogs': 'Bill Logs | Inventurax',
      '/analytics': 'Analytics | Inventurax',
      '/customers': 'Customers | Inventurax',
      '/marketing': 'Marketing | Inventurax',
    };

    if (currentPath.startsWith('/view/invoice/')) {
      document.title = 'Preview Bill | Inventurax';
    } else {
      document.title = titleMap[currentPath] || 'Inventurax';
    }
  }, [location, currentPath]);

  // If it's the marketing page, return children without Sidebar or Admin Footer
  if (isMarketingPage) {
    return <>{children}</>;
  }

  return (
    <div className="d-flex">
      <Sidebar />
      <div id="mainPageContent" className="flex-grow-1">
        <div className="flex-grow-1">
          {children}
        </div>

        <footer className="main-footer">
          <div className="footer-content">
            <div className="copyright">
              © {new Date().getFullYear()} <span className="fw-bold">Inventurax</span>. All rights reserved.
            </div>
            <div className="credits">
              Designed & Developed by{' '}
              <a
                href="https://meghportfolio.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="developer-credit"
              >
                Megh Patel
              </a>
            </div>
            <div className="footer-version">
              v1.0.2
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/view/invoice/:id" element={<PublicBill />} />
            <Route path="/" element={<MarketingLanding />} />
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <Layout>
                    <Routes>
                      <Route path="/login" element={<Navigate to="/dashboard" />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/billing" element={<Billing />} />
                      <Route path="/billlogs" element={<BillLogs />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/customers" element={<Customers />} />
                      <Route path="/setting" element={<Setting />} />
                      <Route path="/setting/company" element={<CompanyDetails />} />
                      <Route path="/setting/security" element={<AccountSecurity />} />
                    </Routes>
                  </Layout>
                </PrivateRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;