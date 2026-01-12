import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Form, Button, Card, Row, Col, Toast, ToastContainer } from 'react-bootstrap';
import { MdSave, MdBusiness, MdContactPhone, MdShare } from 'react-icons/md';

// Import CSS for the loading animation
import '../css/Loading.css';

const CompanyDetails = () => {
    // State to hold every requested field
    const [formData, setFormData] = useState({
        companyName: '',
        brandName: '',
        address1: '',
        address2: '',
        address3: '',
        phone: '',
        fssai: '',
        upiNumber: '',
        upiId: '',
        youtubeName: '',
        youtubeLink: '',
        instagramName: '',
        instagramLink: ''
    });

    const [originalData, setOriginalData] = useState({});
    const [isDirty, setIsDirty] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', bg: 'success' });

    // Fetch details on mount from Firestore settings collection
    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const docRef = doc(db, "settings", "company");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData(data);
                    setOriginalData(data);
                }
            } catch (error) {
                console.error("Error fetching company details:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, []);

    // Monitor changes to manage the Save button state
    const handleChange = (e) => {
        const { name, value } = e.target;
        const updated = { ...formData, [name]: value };
        setFormData(updated);

        // Dirty check: Compare current state with original data
        const hasChanged = Object.keys(updated).some(key => updated[key] !== originalData[key]);
        setIsDirty(hasChanged);
    };

    const handleSave = useCallback(async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            const docRef = doc(db, "settings", "company");
            await setDoc(docRef, formData);
            setOriginalData(formData);
            setIsDirty(false);
            showToast("Company details updated successfully!");
        } catch (error) {
            showToast("Error updating details", "danger");
        } finally {
            setLoading(false);
        }
    }, [formData]);

    // Keyboard Shortcut: Ctrl + S logic from original app
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                if (isDirty) handleSave();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isDirty, handleSave]);

    const showToast = (message, bg = 'success') => {
        setToast({ show: true, message, bg });
    };

    return (
        <div className="container-fluid py-4">
            {/* Loading Overlay */}
            {loading && (
                <div className="loading-overlay">
                    <div className="custom-spinner"></div>
                    <div className="loading-text">UPDATING BUSINESS PROFILE...</div>
                </div>
            )}

            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h2 className="pageHeader mb-1">Company Settings</h2>
                    <p className="text-muted small mb-0">
                        These details will be automatically used in bill generation and branding.
                    </p>
                </div>
                <Button
                    variant="darkblue"
                    disabled={!isDirty}
                    onClick={handleSave}
                    className="d-flex align-items-center gap-2 shadow-sm"
                >
                    <MdSave /> Save Changes
                </Button>
            </div>

            <Form onSubmit={handleSave}>
                {/* 1. Identity & Compliance */}
                <Card className="border-0 shadow-sm rounded-4 mb-4">
                    <Card.Header className="bg-transparent border-0 pt-4 px-4">
                        <div className="fw-bold text-muted small"><MdBusiness className="me-2" /> IDENTITY & COMPLIANCE</div>
                    </Card.Header>
                    <Card.Body className="px-4 pb-4">
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Label className="small fw-bold">COMPANY NAME</Form.Label>
                                <Form.Control name="companyName" value={formData.companyName} onChange={handleChange} required />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="small fw-bold">BRAND NAME</Form.Label>
                                <Form.Control name="brandName" value={formData.brandName} onChange={handleChange} />
                            </Col>
                            <Col md={12}>
                                <Form.Label className="small fw-bold">FSSAI NUMBER</Form.Label>
                                <Form.Control name="fssai" value={formData.fssai} onChange={handleChange} />
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* 2. Contact & Address */}
                <Card className="border-0 shadow-sm rounded-4 mb-4">
                    <Card.Header className="bg-transparent border-0 pt-4 px-4">
                        <div className="fw-bold text-muted small"><MdContactPhone className="me-2" /> CONTACT & ADDRESS</div>
                    </Card.Header>
                    <Card.Body className="px-4 pb-4">
                        <Row className="g-3">
                            <Col md={4}><Form.Label className="small fw-bold">ADDRESS LINE 1</Form.Label><Form.Control name="address1" value={formData.address1} onChange={handleChange} required /></Col>
                            <Col md={4}><Form.Label className="small fw-bold">ADDRESS LINE 2</Form.Label><Form.Control name="address2" value={formData.address2} onChange={handleChange} /></Col>
                            <Col md={4}><Form.Label className="small fw-bold">ADDRESS LINE 3</Form.Label><Form.Control name="address3" value={formData.address3} onChange={handleChange} /></Col>
                            <Col md={4}><Form.Label className="small fw-bold">PHONE NUMBER</Form.Label><Form.Control name="phone" value={formData.phone} onChange={handleChange} required /></Col>
                            <Col md={4}><Form.Label className="small fw-bold">UPI NUMBER</Form.Label><Form.Control name="upiNumber" value={formData.upiNumber} onChange={handleChange} /></Col>
                            <Col md={4}><Form.Label className="small fw-bold">UPI ID</Form.Label><Form.Control name="upiId" value={formData.upiId} onChange={handleChange} /></Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* 3. Social Media Presence */}
                <Card className="border-0 shadow-sm rounded-4 mb-4">
                    <Card.Header className="bg-transparent border-0 pt-4 px-4">
                        <div className="fw-bold text-muted small"><MdShare className="me-2" /> SOCIAL MEDIA</div>
                    </Card.Header>
                    <Card.Body className="px-4 pb-4">
                        <Row className="g-3">
                            <Col md={6}><Form.Label className="small fw-bold">YOUTUBE PROFILE NAME</Form.Label><Form.Control name="youtubeName" value={formData.youtubeName} onChange={handleChange} /></Col>
                            <Col md={6}><Form.Label className="small fw-bold">YOUTUBE CHANNEL LINK</Form.Label><Form.Control name="youtubeLink" value={formData.youtubeLink} onChange={handleChange} /></Col>
                            <Col md={6}><Form.Label className="small fw-bold">INSTAGRAM PROFILE NAME</Form.Label><Form.Control name="instagramName" value={formData.instagramName} onChange={handleChange} /></Col>
                            <Col md={6}><Form.Label className="small fw-bold">INSTAGRAM PROFILE LINK</Form.Label><Form.Control name="instagramLink" value={formData.instagramLink} onChange={handleChange} /></Col>
                        </Row>
                    </Card.Body>
                </Card>
            </Form>

            <ToastContainer position="top-end" className="p-3">
                <Toast show={toast.show} bg={toast.bg} onClose={() => setToast({ ...toast, show: false })} delay={3000} autohide>
                    <Toast.Body className="text-white">{toast.message}</Toast.Body>
                </Toast>
            </ToastContainer>
        </div>
    );
};

export default CompanyDetails;