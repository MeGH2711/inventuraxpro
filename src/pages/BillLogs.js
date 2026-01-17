import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, InputGroup, Form, Badge, Spinner, Modal } from 'react-bootstrap';
import {
    MdSearch, MdFileDownload,
    MdVisibility, MdPrint, MdReceipt, MdPerson, MdLocalShipping, MdMessage, MdFilterList, MdClear
} from 'react-icons/md';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { generateInvoice } from '../utils/generateInvoice';

const BillLogs = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [companyInfo, setCompanyInfo] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [paymentFilter, setPaymentFilter] = useState('');

    // Date Range States
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [absMinDate, setAbsMinDate] = useState('');
    const [absMaxDate, setAbsMaxDate] = useState('');

    useEffect(() => {
        const fetchBills = async () => {
            try {
                // Fetch Company Settings
                const companyRef = doc(db, "settings", "company");
                const companySnap = await getDoc(companyRef);
                if (companySnap.exists()) {
                    setCompanyInfo(companySnap.data());
                }

                // Fetch Bills
                const billsQuery = query(collection(db, "bills"), orderBy("createdAt", "desc"), limit(500));
                const snapshot = await getDocs(billsQuery);
                const fetchedBills = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setBills(fetchedBills);

                // Set Default Min/Max Dates based on fetched data
                if (fetchedBills.length > 0) {
                    const dates = fetchedBills.map(b => b.billingDate).filter(d => d).sort();
                    const minDate = dates[0];
                    const maxDate = dates[dates.length - 1];

                    setStartDate(minDate);
                    setEndDate(maxDate);
                    setAbsMinDate(minDate);
                    setAbsMaxDate(maxDate);
                }
            } catch (error) {
                console.error("Error fetching bill logs:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBills();
    }, []);

    // Formatting Helpers
    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return "N/A";
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const formattedHours = h % 12 || 12;
        return `${formattedHours}:${minutes} ${ampm}`;
    };

    const openWhatsApp = (bill) => {
        if (bill?.customerName?.toLowerCase() === "walking customer") return;

        if (bill?.customerNumber) {
            const number = bill.customerNumber.replace(/\D/g, '');
            const message = `Hello ${bill.customerName || 'Customer'}, thank you for your purchase at ${companyInfo?.brandName || "De Baker's & More"}! Your bill total is ₹${bill.finalTotal.toFixed(2)}.`;
            window.open(`https://wa.me/91${number}?text=${encodeURIComponent(message)}`, '_blank');
        }
    };

    const handlePrint = (bill) => {
        if (bill?.customerName?.toLowerCase() === "walking customer") return;

        const invoiceData = {
            nextBillNumber: bill.billNumber,
            billingData: {
                ...bill,
                customerNumber: bill.customerNumber,
                deliveryMode: bill.modeOfDelivery,
                paymentMode: bill.modeOfPayment
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
        };
        generateInvoice(invoiceData, companyInfo);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStartDate(absMinDate);
        setEndDate(absMaxDate);
        setPaymentFilter('');
    };

    const filteredBills = bills.filter(bill => {
        const matchesSearch =
            bill.billNumber?.toString().includes(searchTerm) ||
            bill.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bill.customerNumber?.includes(searchTerm);

        const matchesPayment = paymentFilter === '' || bill.modeOfPayment === paymentFilter;

        const billDate = bill.billingDate;
        let matchesDate = true;

        if (startDate && endDate) {
            matchesDate = billDate >= startDate && billDate <= endDate;
        } else if (startDate) {
            matchesDate = billDate >= startDate;
        } else if (endDate) {
            matchesDate = billDate <= endDate;
        }

        return matchesSearch && matchesDate && matchesPayment; // Added matchesPayment
    });

    return (
        <Container fluid className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="pageHeader mb-1">Bill Logs</h2>
                    <p className="text-muted small mb-0">View and manage previous customer transactions.</p>
                </div>
                {(searchTerm !== '' || startDate !== absMinDate || endDate !== absMaxDate || paymentFilter !== '') && (
                    <Button variant="outline-danger" size="sm" onClick={clearFilters} className="d-flex align-items-center gap-2 shadow-sm">
                        <MdClear /> Reset Filters
                    </Button>
                )}
            </div>

            {/* Filter Toolbar */}
            <Row className="g-3 mb-4 align-items-end">
                {/* Primary Search - Occupies more space for visibility */}
                <Col lg={4} md={12}>
                    <Form.Group>
                        <Form.Label className="small fw-bold text-muted text-uppercase">Search Records</Form.Label>
                        <InputGroup className="shadow-sm border-0">
                            <InputGroup.Text className="bg-white border-end-0 text-muted">
                                <MdSearch size={20} />
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Search No, Name, or Phone..."
                                className="border-start-0 shadow-none py-2"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                    </Form.Group>
                </Col>

                {/* Payment Method Dropdown */}
                <Col lg={2} md={4}>
                    <Form.Group>
                        <Form.Label className="small fw-bold text-muted text-uppercase">Payment</Form.Label>
                        <Form.Select
                            className="shadow-sm border-0 py-2 shadow-none"
                            value={paymentFilter}
                            onChange={(e) => setPaymentFilter(e.target.value)}
                        >
                            <option value="">All Methods</option>
                            <option value="Cash">Cash</option>
                            <option value="Online">Online</option>
                            <option value="UPI">UPI</option>
                            <option value="Card">Card</option>
                        </Form.Select>
                    </Form.Group>
                </Col>

                {/* Date Range - Grouped Together */}
                <Col lg={4} md={8}>
                    <Form.Group>
                        <Form.Label className="small fw-bold text-muted text-uppercase">Date Range</Form.Label>
                        <InputGroup className="shadow-sm border-0">
                            <Form.Control
                                type="date"
                                className="shadow-none border-end-0 py-2"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <InputGroup.Text className="bg-white border-start-0 border-end-0 text-muted px-2">
                                to
                            </InputGroup.Text>
                            <Form.Control
                                type="date"
                                className="shadow-none border-start-0 py-2"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </InputGroup>
                    </Form.Group>
                </Col>

                {/* Result Counter */}
                <Col lg={2} md={12} className="text-lg-end text-center pb-2">
                    <div className="bg-light d-inline-block px-3 py-2 rounded-pill text-muted small fw-bold border">
                        <MdFilterList className="me-1" /> {filteredBills.length} Results Found
                    </div>
                </Col>
            </Row>

            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                <Card.Body className="p-0">
                    <Table responsive hover className="mb-0 align-middle">
                        <thead className="bg-light text-uppercase small" style={{ letterSpacing: '0.5px' }}>
                            <tr>
                                <th className="ps-4">Bill No</th>
                                <th>Date & Time</th>
                                <th>Customer</th>
                                <th>Payment</th>
                                <th>Amount</th>
                                <th className="text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-5"><Spinner animation="border" variant="primary" /></td></tr>
                            ) : filteredBills.length > 0 ? (
                                filteredBills.map((bill) => (
                                    <tr key={bill.id}>
                                        <td className="ps-4 fw-bold text-primary">#{bill.billNumber}</td>
                                        <td>
                                            <div className="small fw-bold">{formatDate(bill.billingDate)}</div>
                                            <div className="text-muted extra-small" style={{ fontSize: '0.75rem' }}>{formatTime(bill.billingTime)}</div>
                                        </td>
                                        <td>
                                            <div className="fw-bold text-dark">{bill.customerName}</div>
                                            <div className="text-muted small">{bill.customerNumber}</div>
                                        </td>
                                        <td><Badge bg={bill.modeOfPayment === 'Cash' ? 'success' : 'info'} pill>{bill.modeOfPayment}</Badge></td>
                                        <td className="fw-bold text-dark">₹{bill.finalTotal?.toFixed(2)}</td>
                                        <td className="text-center">
                                            <Button variant="outline-primary" size="sm" className="me-2" onClick={() => { setSelectedBill(bill); setShowViewModal(true); }}><MdVisibility /></Button>
                                            <Button
                                                variant="outline-dark"
                                                size="sm"
                                                onClick={() => handlePrint(bill)}
                                                disabled={bill.customerName?.toLowerCase() === "walking customer"}
                                            >
                                                <MdPrint />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="text-center py-5 text-muted">No records found matching your filters.</td></tr>
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* Redesigned Bill Details Modal */}
            <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="fullscreen" centered>
                <Modal.Header closeButton className="bg-light border-bottom-0 pt-4 px-4">
                    <Modal.Title className="d-flex align-items-center">
                        <div className="bg-darkblue text-white rounded-3 p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                            <MdReceipt size={24} />
                        </div>
                        <div>
                            <div className="fw-bold h5 mb-0 text-darkblue">Invoice #{selectedBill?.billNumber}</div>
                            <div className="small text-muted fw-normal">{formatDate(selectedBill?.billingDate)} at {formatTime(selectedBill?.billingTime)}</div>
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4 py-4">
                    {selectedBill && (
                        <>
                            {/* Metadata Sections */}
                            <Row className="mb-4 g-3">
                                <Col md={7}>
                                    <div className="p-3 rounded-4 bg-light border-0 h-100">
                                        <div className="text-uppercase small fw-bold text-muted mb-2 tracking-wider" style={{ letterSpacing: '1px' }}>
                                            <MdPerson className="me-1" /> Customer Details
                                        </div>
                                        <h6 className="fw-bold mb-1">{selectedBill.customerName}</h6>
                                        <div className="text-dark small mb-1">{selectedBill.customerNumber}</div>
                                        <div className="text-muted small italic">{selectedBill.customerAddress || "No address provided"}</div>
                                    </div>
                                </Col>
                                <Col md={5}>
                                    <div className="p-3 rounded-4 bg-light border-0 h-100">
                                        <div className="text-uppercase small fw-bold text-muted mb-2 tracking-wider" style={{ letterSpacing: '1px' }}>
                                            <MdLocalShipping className="me-1" /> Logistics & Payment
                                        </div>
                                        <div className="d-flex justify-content-between mb-1 small">
                                            <span className="text-muted">Payment:</span>
                                            <span className="fw-bold text-primary">{selectedBill.modeOfPayment}</span>
                                        </div>
                                        <div className="d-flex justify-content-between small">
                                            <span className="text-muted">Delivery:</span>
                                            <span className="fw-bold">{selectedBill.modeOfDelivery}</span>
                                        </div>
                                    </div>
                                </Col>
                            </Row>

                            {/* Itemized Detail Table */}
                            <div className="table-responsive">
                                <Table borderless className="align-middle">
                                    <thead className="text-muted small text-uppercase" style={{ borderBottom: '2px solid #f8f9fa' }}>
                                        <tr>
                                            <th className="py-3 ps-0">Item Description</th>
                                            <th className="py-3 text-center">Qty</th>
                                            <th className="py-3 text-end">Unit Price</th>
                                            <th className="py-3 text-end">Discount</th>
                                            <th className="py-3 text-end pe-0">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedBill.products.map((item, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #f8f9fa' }}>
                                                <td className="py-3 ps-0 fw-bold">{item.name}</td>
                                                <td className="py-3 text-center">{item.quantity}</td>
                                                <td className="py-3 text-end">₹{item.unitPrice.toFixed(2)}</td>
                                                <td className="py-3 text-end text-muted small">{item.discount}%</td>
                                                <td className="py-3 text-end pe-0 fw-bold">₹{item.discountedTotal.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>

                            {/* Financial Summary */}
                            <Row className="mt-3 justify-content-end">
                                <Col md={5}>
                                    <div className="d-flex justify-content-between mb-2 small">
                                        <span className="text-muted">Subtotal:</span>
                                        <span className="fw-bold">₹{selectedBill.overallTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2 text-success small">
                                        <span>Savings ({selectedBill.overallDiscount}%):</span>
                                        <span className="fw-bold">-₹{(selectedBill.overallTotal - selectedBill.finalTotal).toFixed(2)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between border-top pt-3 mt-2">
                                        <span className="fw-bold fs-5">Grand Total:</span>
                                        <span className="fw-bold fs-5 text-darkblue">₹{selectedBill.finalTotal.toFixed(2)}</span>
                                    </div>
                                </Col>
                            </Row>

                            {/* Restriction Notice for Walking Customers */}
                            {selectedBill.customerName?.toLowerCase() === "walking customer" && (
                                <div className="mt-3 p-2 bg-warning bg-opacity-10 border border-warning rounded-3 text-center small text-warning fw-bold">
                                    Invoice Actions Disabled for Walking Customers
                                </div>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer className="bg-light border-top-0 p-4">
                    <Button variant="white" className="border px-4 py-2 me-auto" onClick={() => setShowViewModal(false)}>Close</Button>
                    <div className="d-flex gap-2">
                        {/* Only show actions if NOT a Walking Customer */}
                        {selectedBill?.customerName?.toLowerCase() !== "walking customer" && (
                            <>
                                {selectedBill?.customerNumber && (
                                    <Button variant="success" className="px-4 py-2 shadow-sm" onClick={() => openWhatsApp(selectedBill)}>
                                        <MdMessage className="me-2" /> WhatsApp
                                    </Button>
                                )}
                                <Button variant="darkblue" className="px-4 py-2 shadow-sm" onClick={() => handlePrint(selectedBill)}>
                                    <MdFileDownload className="me-2" /> Download Invoice
                                </Button>
                            </>
                        )}
                    </div>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default BillLogs;