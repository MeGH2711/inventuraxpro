import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Table, Button, Spinner, Badge } from 'react-bootstrap';
import {
    MdLocalShipping, MdFileDownload, MdArrowBack, MdPayment, MdEvent, MdAccessTime
} from 'react-icons/md';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { generateInvoice } from '../utils/generateInvoice';
import { FaWhatsapp } from 'react-icons/fa';

const BillPreview = () => {
    const { id } = useParams();
    const [bill, setBill] = useState(null);
    const [companyInfo, setCompanyInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const companyRef = doc(db, "settings", "company");
                const companySnap = await getDoc(companyRef);
                if (companySnap.exists()) setCompanyInfo(companySnap.data());

                const billRef = doc(db, "bills", id);
                const billSnap = await getDoc(billRef);
                if (billSnap.exists()) {
                    setBill({ id: billSnap.id, ...billSnap.data() });
                }
            } catch (error) {
                console.error("Error fetching bill details:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return "N/A";
        // Ensures the date is parsed correctly regardless of local timezone
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }); // Result: "25 Oct 2024"
    };

    const formatDisplayTime = (timeStr) => {
        if (!timeStr) return "N/A";
        const [hours, minutes] = timeStr.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }); // Result: "02:30 PM"
    };

    const handlePrint = () => {
        const invoiceData = {
            nextBillNumber: bill.billNumber,
            billingData: { ...bill, contactNumber: bill.customerNumber, deliveryMode: bill.modeOfDelivery, paymentMode: bill.modeOfPayment },
            cart: bill.products.map(p => ({ name: p.name, qty: p.quantity, price: p.unitPrice, discount: p.discount, discountedTotal: p.discountedTotal })),
            subTotal: bill.overallTotal,
            overallDiscount: bill.overallDiscount,
            finalCalculatedTotal: bill.finalTotal
        };
        generateInvoice(invoiceData, companyInfo);
    };

    const openWhatsApp = () => {
        if (bill?.customerNumber) {
            const number = bill.customerNumber.replace(/\D/g, '');
            const message = `Hello ${bill.customerName}, your invoice #${bill.billNumber} from ${companyInfo?.brandName || "our store"} is ready. Total: ₹${bill.finalTotal.toFixed(2)}.`;
            window.open(`https://wa.me/91${number}?text=${encodeURIComponent(message)}`, '_blank');
        }
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
            <Spinner animation="grow" variant="primary" />
        </div>
    );

    if (!bill) return <Container className="py-5 text-center"><h4>Bill not found</h4></Container>;

    return (
        <div className="min-vh-100">
            <Container>
                {/* Top Navigation */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <Button variant="link" className="text-decoration-none text-dark p-0" onClick={() => window.close()}>
                        <MdArrowBack className="me-2" /> Back to Logs
                    </Button>
                    <div className="d-flex gap-2">
                        <Button variant="outline-success" className="rounded-pill px-4 d-flex justify-content-center align-items-center" onClick={openWhatsApp}>
                            <FaWhatsapp className="me-2" /> Send WhatsApp
                        </Button>
                        <Button variant="primary" className="rounded-pill px-4 shadow-sm d-flex justify-content-center align-items-center" onClick={handlePrint}>
                            <MdFileDownload className="me-2" /> Download PDF
                        </Button>
                    </div>
                </div>

                <Row className="g-4">
                    {/* Left Column: Invoice Details */}
                    <Col lg={8}>
                        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                            <div className="bg-darkblue p-4 text-white d-flex justify-content-between align-items-center">
                                <div>
                                    <p className="text-uppercase small mb-1 opacity-75 fw-bold">Invoice Number</p>
                                    <h3 className="mb-0">#{bill.billNumber}</h3>
                                </div>
                                <div className="text-end">
                                    <Badge bg="light" text="dark" className="px-3 py-2 rounded-pill">
                                        {bill.modeOfPayment.toUpperCase()}
                                    </Badge>
                                </div>
                            </div>

                            <Card.Body className="p-4 p-md-5">
                                <Row className="mb-5">
                                    <Col md={6} className="mb-4 mb-md-0">
                                        <h6 className="text-muted text-uppercase small fw-bold mb-3">Billed To</h6>
                                        <h5 className="fw-bold mb-1">{bill.customerName}</h5>
                                        <p className="mb-1 text-secondary">{bill.customerNumber}</p>
                                        <p className="small text-muted mb-0" style={{ maxWidth: '250px' }}>
                                            {bill.customerAddress || "No physical address provided."}
                                        </p>
                                    </Col>
                                    <Col md={6} className="text-md-end">
                                        <h6 className="text-muted text-uppercase small fw-bold mb-3">Transaction Info</h6>
                                        <div className="mb-1">
                                            <MdEvent className="me-2 text-primary" />
                                            {formatDisplayDate(bill.billingDate)}
                                        </div>
                                        <div className="mb-1">
                                            <MdAccessTime className="me-2 text-primary" />
                                            {formatDisplayTime(bill.billingTime)}
                                        </div>
                                        <div><MdLocalShipping className="me-2 text-primary" /> {bill.modeOfDelivery}</div>
                                    </Col>
                                </Row>

                                <div className="table-responsive">
                                    <Table hover borderless className="align-middle mb-0">
                                        <thead>
                                            <tr className="border-bottom text-uppercase small text-muted">
                                                <th className="py-3 px-0">Item Description</th>
                                                <th className="py-3 text-center">Qty</th>
                                                <th className="py-3 text-end">Rate</th>
                                                <th className="py-3 text-end pe-0">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bill.products.map((item, idx) => (
                                                <tr key={idx} className="border-bottom">
                                                    <td className="py-2 px-0">
                                                        <span className="fw-bold text-dark d-block">{item.name}</span>
                                                        <span className="extra-small text-muted">Disc: {item.discount}%</span>
                                                    </td>
                                                    <td className="py-2 text-center fw-semibold text-secondary">{item.quantity}</td>
                                                    <td className="py-2 text-end text-secondary">₹{item.unitPrice.toFixed(2)}</td>
                                                    <td className="py-2 text-end pe-0 fw-bold text-dark">₹{item.discountedTotal.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Right Column: Financial Summary */}
                    <Col lg={4}>
                        <Card className="border-0 shadow-sm rounded-4 sticky-top" style={{ top: '2rem' }}>
                            <Card.Body className="p-4">
                                <h5 className="fw-bold mb-4">Payment Summary</h5>

                                <div className="d-flex justify-content-between mb-3 text-secondary">
                                    <span>Subtotal</span>
                                    <span>₹{bill.overallTotal.toFixed(2)}</span>
                                </div>

                                <div className="d-flex justify-content-between mb-3 text-success">
                                    <span>Discount ({bill.overallDiscount}%)</span>
                                    <span>-₹{(bill.overallTotal - bill.finalTotal).toFixed(2)}</span>
                                </div>

                                <hr className="my-4" />

                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <span className="h5 fw-bold mb-0">Grand Total</span>
                                    <span className="h3 fw-bold text-primary mb-0">₹{bill.finalTotal.toFixed(2)}</span>
                                </div>

                                <div className="bg-light p-3 rounded-3 mb-0">
                                    <div className="d-flex align-items-center gap-2 small text-muted">
                                        <MdPayment />
                                        <span>Payment via <strong>{bill.modeOfPayment}</strong></span>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default BillPreview;