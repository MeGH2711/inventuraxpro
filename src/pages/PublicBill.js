import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { Container, Card, Row, Col, Badge, Spinner, Button } from 'react-bootstrap';
import { MdDownload, MdLocationOn, MdPhone, MdCheckCircle } from 'react-icons/md';
import { generateInvoice } from '../utils/generateInvoice';

const PublicBill = () => {
    const { id } = useParams();
    const [bill, setBill] = useState(null);
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Bill
                const billRef = doc(db, "bills", id);
                const billSnap = await getDoc(billRef);

                // Fetch Company Info for branding
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
        <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
            <Spinner animation="grow" variant="primary" />
        </div>
    );

    if (!bill) return (
        <Container className="text-center mt-5">
            <h3 className="text-muted">Invoice Link Expired or Invalid</h3>
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
        <div className="bg-light min-vh-100 py-4 py-md-5">
            <Container style={{ maxWidth: '900px' }}>
                {/* Header Actions */}
                <div className="d-flex justify-content-between align-items-center mb-4 px-2">
                    <h4 className="mb-0 fw-bold text-dark">Invoice Summary</h4>
                    <Button variant="dark" className="rounded-pill px-4 shadow-sm d-flex align-items-center" onClick={handleDownload}>
                        <MdDownload className="me-2" /> <span className="d-none d-sm-inline">Download PDF</span>
                    </Button>
                </div>

                <Card className="border-0 shadow-lg rounded-4 overflow-hidden">
                    {/* Top Branding Banner */}
                    <div style={{ height: '8px', background: 'linear-gradient(90deg, #8B0000 0%, #B8860B 100%)' }}></div>

                    <Card.Body className="p-4 p-md-5">
                        {/* Company Header */}
                        <Row className="mb-5 align-items-start">
                            <Col xs={12} md={6} className="mb-4 mb-md-0">
                                <h2 className="fw-bold text-primary mb-1">{company?.brandName || "De Baker's & More"}</h2>
                                <p className="text-muted small mb-3">{company?.companyName || "Vekaria Foods"}</p>
                                <div className="d-flex align-items-center text-muted small mb-1">
                                    <MdLocationOn className="me-2 text-warning" />
                                    {company?.address1}, {company?.address2}
                                </div>
                                <div className="d-flex align-items-center text-muted small">
                                    <MdPhone className="me-2 text-warning" />
                                    {company?.phone}
                                </div>
                            </Col>
                            <Col xs={12} md={6} className="text-md-end">
                                <Badge bg="success" className="px-3 py-2 rounded-pill mb-3">
                                    <MdCheckCircle className="me-1" /> PAYMENT SUCCESSFUL
                                </Badge>
                                <h5 className="text-muted mb-0">Invoice No</h5>
                                <h3 className="fw-bold">#{bill.billNumber}</h3>
                                <p className="text-muted small">{bill.billingDate} | {bill.billingTime}</p>
                            </Col>
                        </Row>

                        <hr className="my-4 opacity-50" />

                        {/* Customer Info */}
                        <Row className="mb-5">
                            <Col>
                                <h6 className="text-uppercase text-muted fw-bold small mb-3" style={{ letterSpacing: '1px' }}>Billed To</h6>
                                <h5 className="fw-bold mb-1">{bill.customerName}</h5>
                                <p className="text-muted mb-0">{bill.customerNumber}</p>
                                <p className="text-muted small">{bill.customerAddress}</p>
                            </Col>
                        </Row>

                        {/* Invoice Table - Responsive Desktop */}
                        <div className="d-none d-md-block">
                            <table className="table table-borderless align-middle">
                                <thead className="bg-light rounded-3">
                                    <tr className="text-muted small text-uppercase">
                                        <th className="py-3 ps-4">Item Description</th>
                                        <th className="py-3 text-center">Qty</th>
                                        <th className="py-3 text-end pe-4">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bill.products.map((p, i) => (
                                        <tr key={i} className="border-bottom">
                                            <td className="py-4 ps-4">
                                                <div className="fw-bold">{p.name}</div>
                                                <div className="text-muted x-small">Rate: ₹{p.unitPrice.toFixed(2)}</div>
                                            </td>
                                            <td className="py-4 text-center">{p.quantity}</td>
                                            <td className="py-4 text-end pe-4 fw-bold">₹{p.discountedTotal.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Item List (Shows only on small screens) */}
                        <div className="d-md-none">
                            <h6 className="text-uppercase text-muted fw-bold small mb-3">Order Items</h6>
                            {bill.products.map((p, i) => (
                                <div key={i} className="bg-light p-3 rounded-3 mb-3 border-start border-4 border-warning">
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="fw-bold">{p.name}</span>
                                        <span className="fw-bold">₹{p.discountedTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="text-muted small">Qty: {p.quantity} × ₹{p.unitPrice}</div>
                                </div>
                            ))}
                        </div>

                        {/* Summary Section */}
                        <Row className="mt-5 justify-content-end">
                            <Col xs={12} md={5}>
                                <div className="bg-light p-4 rounded-4">
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted">Sub-total:</span>
                                        <span>₹{bill.overallTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-3 text-success">
                                        <span>Discount ({bill.overallDiscount}%):</span>
                                        <span>- ₹{(bill.overallTotal - bill.finalTotal).toFixed(2)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                                        <span className="fw-bold fs-5">Grand Total:</span>
                                        <span className="fw-bold fs-4 text-primary">₹{bill.finalTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                            </Col>
                        </Row>

                        <div className="mt-5 text-center text-muted">
                            <p className="small mb-0">Thank you for your business!</p>
                            <p className="extra-small">This is a digitally generated invoice.</p>
                        </div>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default PublicBill;