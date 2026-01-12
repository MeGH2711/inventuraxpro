import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

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
    MdChevronRight
} from 'react-icons/md';

// Logo and Icon
import inventuraxLogoWhite from '../assets/images/inventuraxLogoWhite.png' 
import inventuraxIconWhite from '../assets/images/inventuraxIconWhite.png' 

const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(
        localStorage.getItem('sidebarCollapsed') === 'true'
    );

    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', isCollapsed);
    }, [isCollapsed]);

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    const navLinks = [
        { path: '/dashboard', icon: <MdDashboard />, text: 'Dashboard' },
        { path: '/companydetails', icon: <MdBusiness />, text: 'Company Details' },
        { path: '/products', icon: <MdShoppingBag />, text: 'Product Listing' },
        { path: '/billing', icon: <MdReceiptLong />, text: 'Billing' },
        { path: '/bill-logs', icon: <MdHistoryEdu />, text: 'Bill Logs' },
        { path: '/analytics', icon: <MdInsights />, text: 'Analytics' },
        { path: '/customers', icon: <MdPeople />, text: 'Customers' },
        { path: '/transactions', icon: <MdAccountBalanceWallet />, text: 'Transactions' },
    ];

    return (
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

            <div className="p-3 sidebar-toggle-wrapper">
                <button className="toggle-btn w-100 d-flex justify-content-center align-items-center" onClick={toggleSidebar}>
                    {isCollapsed ? <MdChevronRight size={24} /> : <MdChevronLeft size={24} />}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;