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
    MdInfoOutline
} from 'react-icons/md';
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
            billingData: { ...bill, contactNumber: bill.customerNumber },
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

    return (
        <div className="min-vh-100" style={{ backgroundColor: '#F8F9FA', paddingBottom: '80px' }}>
            {/* Desktop Navbar */}
            <nav className="navbar navbar-light bg-white border-bottom sticky-top py-3 d-none d-md-block">
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
                        <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                            <Card.Header className="bg-white py-3 border-light">
                                <h6 className="mb-0 fw-bold text-muted small text-uppercase tracking-wider">Line Items</h6>
                            </Card.Header>

                            {/* Desktop View Table */}
                            <div className="d-none d-md-block">
                                <Table responsive hover className="mb-0 align-middle">
                                    <thead className="bg-light small text-uppercase text-muted">
                                        <tr>
                                            <th className="ps-4">Product Name</th>
                                            <th className="text-center">Qty</th>
                                            <th className="text-end">Price</th>
                                            <th className="text-end">Total</th>
                                            <th className="text-center">Disc%</th>
                                            <th className="text-end pe-4">Final</th>
                                        </tr>
                                    </thead>
                                    <tbody className="border-top-0">
                                        {bill.products.map((p, i) => (
                                            <tr key={i}>
                                                <td className="ps-4 fw-bold text-dark">{p.name}</td>
                                                <td className="text-center">{p.quantity}</td>
                                                <td className="text-end text-muted">₹{p.unitPrice.toFixed(2)}</td>
                                                <td className="text-end text-muted">₹{(p.quantity * p.unitPrice).toFixed(2)}</td>
                                                <td className="text-center"><Badge bg="light" text="dark" className="border">{p.discount}%</Badge></td>
                                                <td className="text-end fw-bold pe-4">₹{p.discountedTotal.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>

                            {/* Mobile View List (Stacks nicely on phones) */}
                            <div className="d-md-none p-3">
                                {bill.products.map((p, i) => (
                                    <div key={i} className={`py-3 ${i !== bill.products.length - 1 ? 'border-bottom border-light' : ''}`}>
                                        <div className="fw-bold text-dark mb-1">{p.name}</div>
                                        <div className="d-flex justify-content-between small text-muted mb-2">
                                            <span>{p.quantity} units × ₹{p.unitPrice.toFixed(2)}</span>
                                            <span className="text-decoration-line-through">₹{(p.quantity * p.unitPrice).toFixed(2)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <Badge bg="light" text="info" className="border">Discount: {p.discount}%</Badge>
                                            <span className="fw-bold text-dark">₹{p.discountedTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Customer & Payment Info */}
                        <Row className="g-3">
                            <Col md={6}>
                                <Card className="border-0 shadow-sm rounded-4 h-100">
                                    <Card.Body>
                                        <div className="small text-uppercase fw-bold text-muted mb-3">Customer Info</div>
                                        <h6 className="fw-bold mb-1">{bill.customerName}</h6>
                                        <div className="text-muted small">{bill.customerNumber}</div>
                                        <div className="text-muted small text-truncate mt-1">{bill.customerAddress}</div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6}>
                                <Card className="border-0 shadow-sm rounded-4 h-100">
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
                                        <div className="d-flex justify-content-between small">
                                            <span className="text-muted">Date:</span>
                                            <span className="fw-bold">{bill.billingDate}</span>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Col>

                    {/* Right Sidebar: Totals */}
                    <Col lg={4} className="mt-4 mt-lg-0">
                        <div className="sticky-top" style={{ top: '100px' }}>
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

                                    <div className="p-3 rounded-3 bg-white bg-opacity-10 mb-3">
                                        <div className="d-flex justify-content-between align-items-end">
                                            <span className="small opacity-75">Amount Paid</span>
                                            <span className="h2 fw-bold mb-0 text-warning">₹{bill.finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>

                                    <div className="text-center mt-4">
                                        <div className="small opacity-50 mb-1">Issued by {company?.brandName}</div>
                                        <div className="small opacity-50"><MdCalendarToday size={12} className="me-1" /> {bill.billingDate} • {bill.billingTime}</div>
                                    </div>
                                </Card.Body>
                            </Card>

                            {/* Merchant Support Card */}
                            <Card className="border-0 shadow-sm rounded-4 mt-3 bg-white text-center p-3">
                                <div className="text-muted small">
                                    <MdInfoOutline className="me-1" /> Need help with this order? <br />
                                    <strong>Contact: {company?.phone}</strong>
                                </div>
                            </Card>
                        </div>
                    </Col>
                </Row>
            </Container>

            {/* Mobile Sticky Footer */}
            <div className="d-md-none fixed-bottom bg-white border-top p-3 shadow-lg">
                <Button variant="dark" className="w-100 py-3 rounded-pill fw-bold shadow" onClick={handleDownload}>
                    <MdDownload className="me-2" /> Download PDF Receipt
                </Button>
            </div>
        </div>
    );
};

export default PublicBill;