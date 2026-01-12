import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Toast, ToastContainer, Button } from 'react-bootstrap';
import { FcGoogle } from 'react-icons/fc';

// Logo
import inventuraxLogo from '../assets/images/inventuraxLogo.png'

// Import the dedicated Login CSS
import '../css/Login.css';

const Login = () => {
    const { loginWithGoogle, logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // State for handling error toasts
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("Invalid username or password."); // Default

    useEffect(() => {
        // Check if error parameter is present, mimicking original index.html logic
        const params = new URLSearchParams(location.search);
        if (params.get('error') === '1') {
            setShowError(true);
        }

        // Redirect to dashboard if user session is already active
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate, location]);

    const handleGoogleLogin = async () => {
        try {
            const result = await loginWithGoogle();
            const email = result.user.email;

            // 1. Reference the document in 'authorized_users' using the email as ID
            const userRef = doc(db, "authorized_users", email);

            // 2. Verify if the email exists in your whitelist
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                // SUCCESS: The user is authorized
                navigate('/dashboard');
            } else {
                // FAILURE: Signed in but not on the whitelist
                await logout(); // Terminate session immediately
                setErrorMessage("Access Denied: This account is not authorized to access Inventurax.");
                setShowError(true);
            }
        } catch (error) {
            console.error("Authentication error:", error);
            setErrorMessage("Authentication failed. Please try again.");
            setShowError(true);
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-card shadow-lg">
                <div className="brand-section text-center mb-4">
                    {/* Logo asset from original project */}
                    <img src={inventuraxLogo} alt="Inventurax Logo" className="login-logo" />
                    <h2 className="login-header mt-3">Welcome Back</h2>
                    <p className="login-subtitle">Inventory Management System</p>
                </div>

                <div className="auth-section">
                    <p className="text-center text-muted mb-4 small">
                        Please sign in with your authorized company Google account to continue.
                    </p>

                    <Button
                        className="google-auth-btn w-100 py-3 mb-3"
                        onClick={handleGoogleLogin}
                    >
                        <FcGoogle size={24} />
                        <span>Sign in with Google</span>
                    </Button>
                </div>

                <footer className="login-footer-text">
                    &copy; 2025 Inventurax. All rights reserved.
                </footer>
            </div>

            {/* Replaces the static errorToast from combined.html */}
            <ToastContainer position="top-center" className="mt-4">
                <Toast
                    onClose={() => setShowError(false)}
                    show={showError}
                    delay={5000}
                    autohide
                    bg="danger"
                    className="text-white border-0 shadow"
                >
                    <div className="d-flex">
                        <Toast.Body>
                            <i className="bi bi-exclamation-triangle-fill me-2"></i>
                            {errorMessage}
                        </Toast.Body>
                        <Button
                            variant="link"
                            className="btn-close btn-close-white me-2 m-auto"
                            onClick={() => setShowError(false)}
                        />
                    </div>
                </Toast>
            </ToastContainer>
        </div>
    );
};

export default Login;