// React
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Bootstrap
import {
    Container, Row, Col, Card, Button, Form, Modal,
    Spinner
} from 'react-bootstrap';

// Icons
import {
    MdBusiness, MdArrowForward, MdSecurity, MdFormatBold,
    MdFormatItalic, MdCode, MdDarkMode, MdLightMode
} from 'react-icons/md';
import { FaWhatsapp } from "react-icons/fa";

// Contexts
import { useTheme } from '../context/ThemeContext';

// Firebase
import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const Settings = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();

    // State management
    const [showMsgModal, setShowMsgModal] = useState(false);
    const [customMessage, setCustomMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const textAreaRef = useRef(null);

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
            path: "/setting/security"
        }
    ];

    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                const docRef = doc(db, "settings", "billWhatsappMessage");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setCustomMessage(docSnap.data().template || "");
                }
            } catch (error) {
                console.error("Error fetching template:", error);
            }
        };
        fetchTemplate();
    }, []);

    const saveTemplate = async () => {
        setIsSaving(true);
        try {
            const docRef = doc(db, "settings", "billWhatsappMessage");
            await setDoc(docRef, {
                template: customMessage,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            setShowMsgModal(false);
        } catch (error) {
            console.error("Error saving template:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const applyStyle = (prefix, suffix = prefix) => {
        const el = textAreaRef.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const text = el.value;
        const selected = text.substring(start, end);

        let newText;
        if (prefix === '> ' || prefix === '* ') {
            newText = text.substring(0, start) + prefix + selected + text.substring(end);
        } else {
            newText = text.substring(0, start) + prefix + selected + suffix + text.substring(end);
        }

        setCustomMessage(newText);
        el.focus();
    };

    const renderWhatsAppPreview = (text) => {
        if (!text) return <span className="text-muted">Type your message...</span>;

        let formatted = text
            .replace(/{name}/g, 'John Doe')
            .replace(/{total}/g, '1,250.00')
            .replace(/{link}/g, 'https://inventurax.vercel.app/view/invoice/abc123');

        return formatted.split('\n').map((line, i) => {
            let processedLine = line
                .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
                .replace(/_(.*?)_/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code style="background:#d1d1d1; padding:0 2px;">$1</code>');

            // Check for Quote styling
            if (processedLine.startsWith('&gt; ') || processedLine.startsWith('> ')) {
                const quoteContent = processedLine.replace(/^(&gt;|>)\s/, '');
                return (
                    <div key={i} style={{
                        borderLeft: '3px solid #30b489',
                        paddingLeft: '10px',
                        color: '#555',
                        margin: '5px 0',
                        fontStyle: 'italic'
                    }}>
                        {quoteContent || <>&nbsp;</>}
                    </div>
                );
            }

            return <div key={i} dangerouslySetInnerHTML={{ __html: processedLine || '&nbsp;' }} />;
        });
    };

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
                                        <div className="p-3 bg-light rounded-circle">{group.icon}</div>
                                        <div>
                                            <h5 className="fw-bold mb-1">{group.title}</h5>
                                            <p className="text-muted small mb-0">{group.description}</p>
                                        </div>
                                    </div>
                                    <Button variant="darkblue" onClick={() => navigate(group.path)}>
                                        {group.actionLabel} <MdArrowForward />
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    ))}

                    <Card className="border-0 shadow-sm rounded-4 mb-3 overflow-hidden">
                        <Card.Body className="p-4">
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="p-3 bg-light rounded-circle text-success"><FaWhatsapp size={24} /></div>
                                    <div>
                                        <h5 className="fw-bold mb-1">WhatsApp Billing Template</h5>
                                        <p className="text-muted small mb-0">Customize the automated message sent with digital invoices.</p>
                                    </div>
                                </div>
                                <Button variant="darkblue" onClick={() => setShowMsgModal(true)}>
                                    Configure Message <MdArrowForward />
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>

                    <Card className="border-0 shadow-sm rounded-4 mb-3 overflow-hidden d-none">
                        <Card.Body className="p-4">
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="p-3 bg-light rounded-circle text-warning">
                                        {isDarkMode ? <MdDarkMode size={24} /> : <MdLightMode size={24} />}
                                    </div>
                                    <div>
                                        <h5 className="fw-bold mb-1">Appearance</h5>
                                        <p className="text-muted small mb-0">Switch between light and dark mode.</p>
                                    </div>
                                </div>
                                <Form.Check type="switch" id="theme-switch" checked={isDarkMode} onChange={toggleTheme} style={{ transform: 'scale(1.5)' }} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* WhatsApp Template Modal */}
            <Modal show={showMsgModal} onHide={() => setShowMsgModal(false)} size="lg" centered className="rounded-4">
                <Modal.Header closeButton className="border-0 pt-4 px-4">
                    <Modal.Title className="fw-bold">Billing Message Editor</Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4 pb-4">
                    <Row>
                        <Col md={7}>
                            <p className="text-muted small mb-3">Personalize your billing message using dynamic tags.</p>
                            <div className="d-flex flex-wrap gap-1 mb-2 bg-light p-2 rounded-3 border">
                                <Button variant="white" size="sm" className="border" onClick={() => applyStyle('*')}><MdFormatBold /></Button>
                                <Button variant="white" size="sm" className="border" onClick={() => applyStyle('_')}><MdFormatItalic /></Button>
                                <Button variant="white" size="sm" className="border" onClick={() => applyStyle('`')}><MdCode /></Button>
                                {/* New Quote Button */}
                                <Button variant="white" size="sm" className="border" title="Quote" onClick={() => applyStyle('> ', '')}>
                                    <span>Quote</span>
                                </Button>
                                <div className="vr mx-1"></div>
                                <Button variant="outline-primary" size="sm" onClick={() => applyStyle('{name}', '')}>+ Name</Button>
                                <Button variant="outline-primary" size="sm" onClick={() => applyStyle('{total}', '')}>+ Total</Button>
                                <Button variant="outline-primary" size="sm" onClick={() => applyStyle('{link}', '')}>+ Link</Button>
                            </div>
                            <Form.Control
                                ref={textAreaRef}
                                as="textarea"
                                rows={10}
                                className="rounded-3 border-2 shadow-sm"
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                placeholder="Enter message template..."
                            />
                        </Col>
                        <Col md={5}>
                            <h6 className="smallest fw-bold text-uppercase mb-3 text-primary mt-3 mt-md-0">Live Preview</h6>
                            <div
                                className="p-3 rounded-4"
                                style={{
                                    backgroundColor: '#e5ddd5',
                                    backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`,
                                    minHeight: '250px'
                                }}
                            >
                                <div
                                    className="bg-white p-3 rounded-3 shadow-sm"
                                    style={{
                                        maxWidth: '100%',
                                        borderRadius: '0 15px 15px 15px',
                                        fontSize: '0.85rem',
                                        overflowWrap: 'break-word',
                                        wordBreak: 'break-word'
                                    }}
                                >
                                    <div style={{ whiteSpace: 'pre-wrap' }}>{renderWhatsAppPreview(customMessage)}</div>
                                    <div className="text-end text-muted mt-1" style={{ fontSize: '0.65rem' }}>
                                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer className="border-0 px-4 pb-4">
                    <Button variant="light" onClick={() => setShowMsgModal(false)} className="px-4">Cancel</Button>
                    <Button variant="primary" onClick={saveTemplate} disabled={isSaving} className="px-4 fw-bold">
                        {isSaving ? <Spinner animation="border" size="sm" /> : 'Save Template'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default Settings;