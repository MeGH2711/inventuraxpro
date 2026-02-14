// React
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Firebase
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

// Bootstrap
import { Toast, ToastContainer, Button } from 'react-bootstrap';

// Icons
import { FcGoogle } from 'react-icons/fc';
import { MdRocketLaunch, MdShield } from 'react-icons/md';

// Context
import { useAuth } from '../context/AuthContext';

// Logo
import inventuraxLogo from '../assets/images/inventuraxLogoWhite.png';

const Login = () => {
    const { loginWithGoogle, logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("Invalid username or password.");
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('error') === '1') {
            setShowError(true);
        }
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate, location]);

    const handleGoogleLogin = async () => {
        setIsAuthenticating(true);
        try {
            const result = await loginWithGoogle();
            const email = result.user.email;
            const userRef = doc(db, "authorized_users", email);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                localStorage.setItem("login_timestamp", Date.now().toString());
                navigate('/dashboard');
            } else {
                await logout();
                setErrorMessage("Access Denied: Account not authorized.");
                setShowError(true);
            }
        } catch (error) {
            setErrorMessage("Authentication failed.");
            setShowError(true);
        } finally {
            setIsAuthenticating(false);
        }
    };

    return (
        <div className="login-v2-container">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');

                .login-v2-container {
                    background: #020203;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Inter', sans-serif;
                    padding: 20px;
                    overflow: hidden;
                    position: relative;
                }

                /* Animated Mesh Background */
                .mesh-bg {
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background: 
                        radial-gradient(at 0% 0%, rgba(108, 92, 231, 0.15) 0px, transparent 50%),
                        radial-gradient(at 100% 100%, rgba(0, 210, 255, 0.1) 0px, transparent 50%);
                    z-index: 1;
                }

                .grid-overlay {
                    position: absolute;
                    inset: 0;
                    background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), 
                                      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
                    background-size: 50px 50px;
                    z-index: 2;
                }

                .login-split-card {
                    display: flex;
                    width: 100%;
                    max-width: 1000px;
                    min-height: 600px;
                    background: rgba(15, 15, 20, 0.8);
                    backdrop-filter: blur(25px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 32px;
                    overflow: hidden;
                    z-index: 10;
                    box-shadow: 0 40px 100px rgba(0,0,0,0.5);
                }

                /* Left Side: Brand/Visual */
                .login-left-panel {
                    flex: 1;
                    background: linear-gradient(135deg, #0f0f14 0%, #1a1a2e 100%);
                    padding: 60px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    border-right: 1px solid rgba(255, 255, 255, 0.05);
                }

                .brand-section h2 {
                    color: #fff;
                    font-weight: 800;
                    font-size: 2.5rem;
                    margin-top: 20px;
                }

                .feature-pill {
                    background: rgba(108, 92, 231, 0.1);
                    border: 1px solid rgba(108, 92, 231, 0.3);
                    color: #a29bfe;
                    padding: 6px 16px;
                    border-radius: 100px;
                    font-size: 0.8rem;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }

                /* Right Side Redesign: Action */
                .login-right-panel {
                    flex: 1;
                    background: radial-gradient(circle at center, rgba(108, 92, 231, 0.05) 0%, transparent 70%);
                    padding: 60px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                    position: relative;
                }

                .login-form-container {
                    width: 100%;
                    max-width: 320px;
                }

                .auth-icon-circle {
                    width: 64px;
                    height: 64px;
                    background: rgba(108, 92, 231, 0.1);
                    border: 1px solid rgba(108, 92, 231, 0.2);
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto;
                    transition: transform 0.3s ease;
                }

                .google-auth-btn-v2 {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #fff;
                    width: 100%;
                    padding: 12px;
                    border-radius: 14px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                }

                .google-auth-btn-v2:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: rgba(255, 255, 255, 0.2);
                    transform: translateY(-2px);
                }

                .google-auth-btn-v2:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .google-icon-wrapper {
                    background: #fff;
                    padding: 8px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .btn-text {
                    flex-grow: 1;
                    text-align: left;
                    font-size: 0.95rem;
                    letter-spacing: 0.3px;
                }

                .security-status {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 10px;
                }

                .status-indicator {
                    width: 6px;
                    height: 6px;
                    background: #00ff88;
                    border-radius: 50%;
                    box-shadow: 0 0 10px #00ff88;
                    animation: pulse 2s infinite;
                }

                .status-text {
                    font-size: 0.65rem;
                    color: rgba(255,255,255,0.4);
                    font-weight: 600;
                    letter-spacing: 1px;
                }

                @keyframes pulse {
                    0% { opacity: 0.4; }
                    50% { opacity: 1; }
                    100% { opacity: 0.4; }
                }

                @media (max-width: 850px) {
                    .login-left-panel { display: none; }
                    .login-split-card { max-width: 450px; }
                }
            `}</style>

            <div className="mesh-bg"></div>
            <div className="grid-overlay"></div>

            <div className="login-split-card">
                {/* Visual Panel */}
                <div className="login-left-panel">
                    <div className="brand-section">
                        <img src={inventuraxLogo} alt="Logo" style={{ width: '100px', filter: 'brightness(1.2)' }} />
                        <h2>Precision <br />Inventory <br />Control.</h2>
                    </div>

                    <div className="meta-info">
                        <div className="feature-pill mb-3">
                            <MdRocketLaunch size={16} />
                            <span>System Build v1.0.2</span>
                        </div>
                        <p className="text-white-50 small">
                            Advanced management architecture designed for high-scale retail operations.
                        </p>
                    </div>
                </div>

                {/* Redesigned Interaction Panel */}
                <div className="login-right-panel">
                    <div className="login-form-container">
                        <div className="mb-5">
                            <div className="auth-icon-circle mb-3">
                                <MdShield size={32} color="#a29bfe" />
                            </div>
                            <h3 className="text-white fw-bold mb-2">System Access</h3>
                            <p className="text-white-50 small">
                                Authorized personnel only. <br />
                                Verify your identity to access the console.
                            </p>
                        </div>

                        <button
                            className="google-auth-btn-v2"
                            onClick={handleGoogleLogin}
                            disabled={isAuthenticating}
                        >
                            <div className="google-icon-wrapper">
                                <FcGoogle size={24} />
                            </div>
                            <span className="btn-text">
                                {isAuthenticating ? 'Authenticating...' : 'Continue with Google'}
                            </span>
                        </button>

                        <div className="security-status mt-4">
                            <div className="status-indicator"></div>
                            <span className="status-text">ENCRYPTED END-TO-END</span>
                        </div>
                    </div>

                    <div className="mt-auto pt-4 text-white-25" style={{ fontSize: '0.65rem', letterSpacing: '3px' }}>
                        INVENTURAX CORE // SECURITY PROTOCOL
                    </div>
                </div>
            </div>

            <ToastContainer position="top-center" className="mt-4">
                <Toast
                    onClose={() => setShowError(false)}
                    show={showError}
                    delay={5000}
                    autohide
                    bg="danger"
                    className="text-white border-0 shadow-lg rounded-4"
                >
                    <div className="d-flex p-2">
                        <Toast.Body className="fw-bold">
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