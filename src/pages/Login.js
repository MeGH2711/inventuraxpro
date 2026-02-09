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
import { MdRocketLaunch } from 'react-icons/md';

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

                /* Right Side: Action */
                .login-right-panel {
                    flex: 1;
                    background: rgba(255, 255, 255, 0.02);
                    padding: 60px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                }

                .google-auth-btn {
                    background: #fff;
                    color: #000;
                    border: none;
                    width: 100%;
                    padding: 18px;
                    border-radius: 16px;
                    font-weight: 600;
                    font-size: 1.1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 15px;
                    transition: all 0.3s ease;
                    cursor: pointer;
                }

                .google-auth-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 15px 30px rgba(255,255,255,0.1);
                    background: #f8f9fa;
                }

                .security-badge-v2 {
                    background: rgba(255,255,255,0.03);
                    border-radius: 20px;
                    padding: 20px;
                    margin-top: 40px;
                    border: 1px dashed rgba(255,255,255,0.1);
                    width: 100%;
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

                {/* Interaction Panel */}
                <div className="login-right-panel">
                    <div className="mb-4">
                        <h3 className="text-white fw-bold mb-2">Gatekeeper</h3>
                        <p className="text-white-50">Identity verification required to access the console.</p>
                    </div>

                    <button className="google-auth-btn" onClick={handleGoogleLogin}>
                        <FcGoogle size={28} />
                        <span>Sign in with Google</span>
                    </button>

                    <div className="mt-auto pt-4 text-white-50" style={{ fontSize: '0.7rem', letterSpacing: '2px' }}>
                        &copy; 2026 INVENTURAX
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