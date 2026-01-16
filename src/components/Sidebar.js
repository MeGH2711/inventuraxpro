import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { OverlayTrigger, Tooltip, Modal, Button } from 'react-bootstrap'; // Added Modal and Button
import { useAuth } from '../context/AuthContext';

// Import New CSS
import '../css/Sidebar.css';

// Import React Icons
import {
    MdDashboard,
    MdBusiness,
    MdShoppingBag,
    MdReceiptLong,
    MdHistoryEdu,
    MdInsights,
    MdPeople,
    MdAccountBalanceWallet,
    MdChevronLeft,
    MdChevronRight,
    MdLogout,
    MdWarning,
    MdOutlineSettingsSuggest
} from 'react-icons/md';

// Logo and Icon
import inventuraxLogoWhite from '../assets/images/inventuraxLogoWhite.png'
import inventuraxIconWhite from '../assets/images/inventuraxIconWhite.png'

const Sidebar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(
        localStorage.getItem('sidebarCollapsed') === 'true'
    );

    // State for Logout Confirmation Modal
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', isCollapsed);
    }, [isCollapsed]);

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    // Function to trigger logout after confirmation
    const handleConfirmLogout = async () => {
        try {
            setShowLogoutModal(false);
            await logout();
            navigate('/');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const navLinks = [
        { path: '/dashboard', icon: <MdDashboard />, text: 'Dashboard' },
        { path: '/products', icon: <MdShoppingBag />, text: 'Product Listing' },
        { path: '/billing', icon: <MdReceiptLong />, text: 'Billing' },
        { path: '/billlogs', icon: <MdHistoryEdu />, text: 'Bill Logs' },
        { path: '/analytics', icon: <MdInsights />, text: 'Analytics' },
        { path: '/customers', icon: <MdPeople />, text: 'Customers' },
        { path: '/transactions', icon: <MdAccountBalanceWallet />, text: 'Transactions' },
        { path: '/setting', icon: <MdOutlineSettingsSuggest />, text: 'Settings' },
    ];

    return (
        <>
            <div id="sidebar-wrapper" className={isCollapsed ? 'collapsed' : ''}>
                <div className="sidebar-heading p-3 d-flex justify-content-center align-items-center">
                    {!isCollapsed ? (
                        <img src={inventuraxLogoWhite} alt="Full Logo" className="img-fluid" style={{ maxHeight: '40px' }} />
                    ) : (
                        <img src={inventuraxIconWhite} alt="Icon Logo" className="img-fluid" style={{ maxHeight: '35px' }} />
                    )}
                </div>

                <div className="sidebar-content mt-2">
                    <div className="list-group list-group-flush">
                        {navLinks.map((link) => (
                            <OverlayTrigger
                                key={link.path}
                                placement="right"
                                overlay={isCollapsed ? <Tooltip>{link.text}</Tooltip> : <span className="d-none" />}
                            >
                                <NavLink
                                    to={link.path}
                                    className={({ isActive }) =>
                                        `list-group-item-sidebar ${isActive ? 'active' : ''}`
                                    }
                                >
                                    <span className="sidebar-icon fs-4">
                                        {link.icon}
                                    </span>
                                    <span className="link-text ms-3">{link.text}</span>
                                </NavLink>
                            </OverlayTrigger>
                        ))}
                    </div>
                </div>

                {/* Logout Button Section */}
                <div className="sidebar-footer">
                    <OverlayTrigger
                        placement="right"
                        overlay={isCollapsed ? <Tooltip>Logout</Tooltip> : <span className="d-none" />}
                    >
                        <button className="logout-btn" onClick={() => setShowLogoutModal(true)}> {/* Changed to show modal */}
                            <span className="sidebar-icon fs-4">
                                <MdLogout />
                            </span>
                            <span className="link-text ms-3">Logout</span>
                        </button>
                    </OverlayTrigger>
                </div>

                <div className="p-3 sidebar-toggle-wrapper">
                    <button className="toggle-btn w-100 d-flex justify-content-center align-items-center" onClick={toggleSidebar}>
                        {isCollapsed ? <MdChevronRight size={24} /> : <MdChevronLeft size={24} />}
                    </button>
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            <Modal
                show={showLogoutModal}
                onHide={() => setShowLogoutModal(false)}
                centered
                size="sm"
                className="logout-modal"
            >
                <Modal.Body className="text-center p-4">
                    <div className="text-warning mb-3">
                        <MdWarning size={48} />
                    </div>
                    <h5 className="fw-bold">Confirm Logout</h5>
                    <p className="text-muted small">Are you sure you want to log out of your account?</p>
                    <div className="d-flex gap-2 mt-4">
                        <Button variant="light" className="w-100" onClick={() => setShowLogoutModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="danger" className="w-100" onClick={handleConfirmLogout}>
                            Logout
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
};

export default Sidebar;