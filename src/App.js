import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";

// Pages

import Login from "./pages/Login";
import Products from "./pages/Products";
import CompanyDetails from "./pages/CompanyDetails";

import './css/style.css';
import './css/lightTheme.css';

const Dashboard = () => <div className="p-4"><h1>Dashboard Page</h1></div>;

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <div className="d-flex">
                  <Sidebar />
                  <div id="mainPageContent" className="flex-grow-1">
                    <Dashboard />
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/products"
            element={
              <PrivateRoute>
                <div className="d-flex">
                  <Sidebar />
                  <div id="mainPageContent" className="flex-grow-1">
                    <Products />
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/companydetails"
            element={
              <PrivateRoute>
                <div className="d-flex">
                  <Sidebar />
                  <div id="mainPageContent" className="flex-grow-1">
                    <CompanyDetails />
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          {/* Add other protected routes here */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;