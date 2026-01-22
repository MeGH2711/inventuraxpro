import React from 'react';
import { Container, Row, Col, Card, Button, Form } from 'react-bootstrap';
import {
    MdBusiness,
    MdArrowForward,
    MdSecurity, MdDarkMode, MdLightMode
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Settings = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const settingGroups = [
        {
            title: "Business Configuration",
            description: "Manage how your business appears on invoices and reports.",
            icon: <MdBusiness size={24} className="text-primary" />,
            actionLabel: "Edit Profile",
            path: "/setting/company"
        },
        {
            title: "Account Security",
            description: "Manage authorized users and login permissions.",
            icon: <MdSecurity size={24} className="text-danger" />,
            actionLabel: "Manage Access",
            path: "/setting/security",
            disabled: false
        }
    ];

    return (
        <Container fluid className="py-4">
            <div className="mb-4">
                <h2 className="pageHeader mb-1">Settings</h2>
                <p className="text-muted small mb-0">General application and business configuration.</p>
            </div>

            <Row>
                <Col lg={12}>
                    {settingGroups.map((group, index) => (
                        <Card key={index} className="border-0 shadow-sm rounded-4 mb-3 overflow-hidden">
                            <Card.Body className="p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="p-3 bg-light rounded-circle">
                                            {group.icon}
                                        </div>
                                        <div>
                                            <h5 className="fw-bold mb-1">{group.title}</h5>
                                            <p className="text-muted small mb-0">{group.description}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant={group.disabled ? "light" : "darkblue"}
                                        className="d-flex align-items-center gap-2"
                                        onClick={() => !group.disabled && navigate(group.path)}
                                        disabled={group.disabled}
                                    >
                                        {group.actionLabel} <MdArrowForward />
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    ))}
                </Col>
                <Col className='d-none'>
                    <Card className="border-0 shadow-sm rounded-4 mb-3 overflow-hidden">
                        <Card.Body className="p-4">
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="p-3 bg-light rounded-circle text-warning">
                                        {isDarkMode ? <MdDarkMode size={24} /> : <MdLightMode size={24} />}
                                    </div>
                                    <div>
                                        <h5 className="fw-bold mb-1">Appearance</h5>
                                        <p className="text-muted small mb-0">
                                            Switch between {isDarkMode ? "light" : "dark"} mode for your interface.
                                        </p>
                                    </div>
                                </div>
                                <Form.Check
                                    type="switch"
                                    id="theme-switch"
                                    className="custom-switch-lg"
                                    style={{ transform: 'scale(1.5)' }} // Makes the switch more prominent
                                    checked={isDarkMode}
                                    onChange={toggleTheme}
                                />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Settings;