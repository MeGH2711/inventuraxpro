import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { Container, Row, Col, Badge, Spinner, Button, Card, Table } from 'react-bootstrap';
import {
    MdDownload,
    MdReceipt,
    MdCalendarToday,
    MdCheckCircle,
} from 'react-icons/md';
import {
    FaInstagram,
    FaYoutube,
    FaGlobe,
    FaPhoneAlt
} from 'react-icons/fa';
import { generateInvoice } from '../utils/generateInvoice';

const PublicBill = () => {
    const { id } = useParams();
    const [bill, setBill] = useState(null);
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const billRef = doc(db, "bills", id);
                const billSnap = await getDoc(billRef);
                const compRef = doc(db, "settings", "company");
                const compSnap = await getDoc(compRef);

                if (billSnap.exists()) setBill(billSnap.data());
                if (compSnap.exists()) setCompany(compSnap.data());
            } catch (error) {
                console.error("Error fetching invoice:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-white">
            <Spinner animation="border" variant="dark" />
        </div>
    );

    if (!bill) return (
        <Container className="text-center mt-5 py-5">
            <div className="display-1 text-muted opacity-25 mb-4">404</div>
            <h3 className="fw-light">Invoice not found or expired.</h3>
        </Container>
    );

    const handleDownload = () => {
        generateInvoice({
            nextBillNumber: bill.billNumber,
            billingData: {
                ...bill,
                contactNumber: bill.customerNumber,
                paymentMode: bill.modeOfPayment,
                deliveryMode: bill.modeOfDelivery
            },
            cart: bill.products.map(p => ({
                name: p.name,
                qty: p.quantity,
                price: p.unitPrice,
                discount: p.discount,
                discountedTotal: p.discountedTotal
            })),
            subTotal: bill.overallTotal,
            overallDiscount: bill.overallDiscount,
            finalCalculatedTotal: bill.finalTotal
        }, company);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).replace(/ /g, ' ');
    };

    const formatTime = (timeString) => {
        if (!timeString) return "";
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));

        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div
            data-theme="light"
            data-bs-theme="light"
            className="public-bill-container min-vh-100"
            style={{
                backgroundColor: '#F8F9FA',
                color: '#212529',
                paddingBottom: '80px'
            }}
        >
            {/* INTERNAL CSS OVERRIDES:
              This ensures that even if ThemeContext.js sets [data-theme='dark'] on the body,
              the public invoice remains clean and readable in light mode.
            */}
            <style>
                {`
                    body {
                        background-color: #F8F9FA !important;
                        color: #212529 !important;
                    }

                    .public-bill-container .card {
                        background-color: #ffffff !important;
                        color: #212529 !important;
                        border: none !important;
                    }

                    .public-bill-container .text-muted {
                        color: #6c757d !important;
                    }

                    .public-bill-container .table {
                        --bs-table-bg: #ffffff !important;
                        --bs-table-color: #212529 !important;
                    }

                    .public-bill-container .bg-light {
                        background-color: #f8f9fa !important;
                    }
                    
                    /* Ensures the Success badge colors remain visible */
                    .public-bill-container .badge {
                        opacity: 1 !important;
                    }
                `}
            </style>

            {/* Desktop Navbar */}
            <nav className="navbar navbar-light bg-dark text-light border-bottom sticky-top py-3 d-none d-md-block">
                <Container>
                    <div className="d-flex justify-content-between align-items-center w-100">
                        <div className="d-flex align-items-center">
                            <div className="bg-dark text-white rounded-3 p-2 me-3 shadow-sm">
                                <MdReceipt size={24} />
                            </div>
                            <div>
                                <h6 className="mb-0 fw-bold">Invoice #{bill.billNumber}</h6>
                                <small className="text-muted">{company?.brandName || "Merchant"}</small>
                            </div>
                        </div>
                        <Button variant="dark" className="rounded-pill px-4 fw-bold shadow-sm" onClick={handleDownload}>
                            <MdDownload className="me-2" /> Download PDF
                        </Button>
                    </div>
                </Container>
            </nav>

            <Container className="py-4 py-md-5">
                <Row className="justify-content-center">
                    <Col lg={8}>
                        {/* Status Badge */}
                        <div className="text-center text-md-start mb-4">
                            <Badge bg="soft-success" className="text-success px-3 py-2 border border-success border-opacity-25" style={{ backgroundColor: '#e6f4ea' }}>
                                <MdCheckCircle className="me-1" /> Payment Verified
                            </Badge>
                            <h2 className="fw-bold mt-2">Order Summary</h2>
                        </div>

                        {/* Order Detail Table Card */}
                        <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white">
                            <Card.Header className="py-3 border-light">
                                <h6 className="mb-0 fw-bold text-muted small text-uppercase tracking-wider">Items</h6>
                            </Card.Header>

                            {/* Desktop View Table */}
                            <div className="d-none d-md-block">
                                <Table responsive className="mb-0 align-middle">
                                    <thead className="small text-uppercase text-muted">
                                        <tr>
                                            <th className="ps-4 border-0">Product Name</th>
                                            <th className="text-center border-0">Qty</th>
                                            <th className="text-end border-0">Price</th>
                                            <th className="text-end border-0">Total</th>
                                            <th className="text-center border-0">Disc%</th>
                                            <th className="text-end pe-4 border-0">Final</th>
                                        </tr>
                                    </thead>
                                    <tbody className="border-top-0">
                                        {bill.products.map((p, i) => (
                                            <tr key={i} className="bg-white">
                                                <td className="ps-4 fw-bold border-light">{p.name}</td>
                                                <td className="text-center border-light">{p.quantity}</td>
                                                <td className="text-end text-muted border-light">₹{p.unitPrice.toFixed(2)}</td>
                                                <td className="text-end text-muted border-light">₹{(p.quantity * p.unitPrice).toFixed(2)}</td>
                                                <td className="text-center border-light">
                                                    <Badge bg="primary" className="border-0">{p.discount}%</Badge>
                                                </td>
                                                <td className="text-end fw-bold pe-4 border-light">₹{p.discountedTotal.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>

                            {/* Mobile View List */}
                            <div className="d-md-none">
                                {bill.products.map((p, i) => {
                                    const originalPrice = p.quantity * p.unitPrice;
                                    const hasDiscount = p.discount > 0;

                                    return (
                                        <div key={i} className={`p-3 ${i !== bill.products.length - 1 ? 'border-bottom border-light' : ''}`}>
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <div style={{ flex: 1 }}>
                                                    <div className="fw-bold fs-6 mb-0">{p.name}</div>
                                                    <div className="text-muted small">
                                                        {p.quantity} {p.quantity > 1 ? 'units' : 'unit'} × ₹{p.unitPrice.toFixed(2)}
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    <div className="fw-bold" style={{ fontSize: '1.1rem' }}>
                                                        ₹{p.discountedTotal.toFixed(2)}
                                                    </div>
                                                    {hasDiscount && (
                                                        <div className="text-muted small text-decoration-line-through">
                                                            ₹{originalPrice.toFixed(2)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {hasDiscount && (
                                                <div className="d-flex align-items-center mt-1">
                                                    <Badge bg="soft-success" className="text-success border border-success border-opacity-25" style={{ backgroundColor: '#e6f4ea', fontSize: '0.7rem' }}>
                                                        SAVED {p.discount}% (₹{(originalPrice - p.discountedTotal).toFixed(2)})
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        {/* Customer & Payment Info */}
                        <Row className="g-3">
                            <Col md={6}>
                                <Card className="border-0 shadow-sm rounded-4 h-100 bg-white">
                                    <Card.Body>
                                        <div className="small text-uppercase fw-bold text-muted mb-3">Customer Info</div>
                                        <h6 className="fw-bold mb-1">{bill.customerName}</h6>
                                        <div className="text-muted small">{bill.customerNumber}</div>
                                        <div className="text-muted small text-truncate mt-1">{bill.customerAddress}</div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6}>
                                <Card className="border-0 shadow-sm rounded-4 h-100 bg-white">
                                    <Card.Body>
                                        <div className="small text-uppercase fw-bold text-muted mb-3">Payment Info</div>
                                        <div className="d-flex justify-content-between small mb-1">
                                            <span className="text-muted">Payment Mode:</span>
                                            <span className="fw-bold">{bill.modeOfPayment}</span>
                                        </div>
                                        <div className="d-flex justify-content-between small mb-1">
                                            <span className="text-muted">Delivery:</span>
                                            <span className="fw-bold">{bill.modeOfDelivery}</span>
                                        </div>
                                        <div className="d-flex justify-content-between small mb-1">
                                            <span className="text-muted">Time:</span>
                                            <span className="fw-bold">{formatTime(bill.billingTime)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between small">
                                            <span className="text-muted">Date:</span>
                                            <span className="fw-bold">{formatDate(bill.billingDate)}</span>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Col>

                    {/* Right Sidebar: Totals */}
                    <Col lg={4} className="mt-4 mt-lg-0">
                        <div>
                            <Card className="border-0 shadow-lg rounded-4 bg-dark text-white overflow-hidden">
                                <Card.Body className="p-4">
                                    <h5 className="mb-4 opacity-75">Final Settlement</h5>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="opacity-50">Subtotal</span>
                                        <span>₹{bill.overallTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-4 text-info">
                                        <span className="opacity-75">Overall Discount ({bill.overallDiscount}%)</span>
                                        <span>- ₹{(bill.overallTotal - bill.finalTotal).toFixed(2)}</span>
                                    </div>
                                    <div className="p-3 rounded-3 bg-primary bg-opacity-10 mb-3">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="small opacity-75">Amount Paid</span>
                                            <span className="h2 fw-bold mb-0 text-warning">₹{bill.finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                    <div className="text-center mt-4">
                                        <div className="small opacity-50 mb-1">Issued by {company?.brandName}</div>
                                        <div className="small opacity-50 d-flex justify-content-center align-items-center">
                                            <MdCalendarToday size={12} className="me-1" />
                                            {formatDate(bill.billingDate)} • {formatTime(bill.billingTime)}
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>

                            <Card className="border-0 shadow-sm rounded-4 mt-3 bg-white overflow-hidden">
                                <Card.Header className="bg-light border-0 py-3 text-center">
                                    <h6 className="mb-0 fw-bold text-muted small text-uppercase">Connect with Us</h6>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    <div className="text-center mb-4">
                                        <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mb-2" style={{ width: '40px', height: '40px' }}>
                                            <FaPhoneAlt size={18} />
                                        </div>
                                        <div className="small text-muted">Customer Support</div>
                                        <h6 className="fw-bold">{company?.phone}</h6>
                                    </div>

                                    <div className="d-flex justify-content-center gap-3 pt-3 border-top">
                                        {company?.website && (
                                            <a href={company.website} target="_blank" rel="noopener noreferrer"
                                                className="btn rounded-circle d-flex align-items-center justify-content-center border"
                                                style={{ width: '45px', height: '45px', color: '#1c1c1c' }} title="Website">
                                                <FaGlobe size={20} />
                                            </a>
                                        )}
                                        {company?.instagramLink && (
                                            <a href={company.instagramLink} target="_blank" rel="noopener noreferrer"
                                                className="btn rounded-circle d-flex align-items-center justify-content-center border"
                                                style={{ width: '45px', height: '45px', color: '#E1306C' }} title="Instagram">
                                                <FaInstagram size={20} />
                                            </a>
                                        )}
                                        {company?.youtubeLink && (
                                            <a href={company.youtubeLink} target="_blank" rel="noopener noreferrer"
                                                className="btn rounded-circle d-flex align-items-center justify-content-center border"
                                                style={{ width: '45px', height: '45px', color: '#FF0000' }} title="YouTube">
                                                <FaYoutube size={20} />
                                            </a>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </div>
                    </Col>
                </Row>
            </Container>

            {/* Mobile Sticky Footer */}
            <div className="d-md-none fixed-bottom bg-dark border-top p-3 shadow-lg">
                <Button variant="light" className="w-100 py-3 rounded-pill fw-bold shadow" onClick={handleDownload}>
                    <MdDownload className="me-2" /> Download PDF Receipt
                </Button>
            </div>
        </div>
    );
};

export default PublicBill;