import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, InputGroup, Form, Badge, Spinner } from 'react-bootstrap';
import {
    MdSearch, MdVisibility, MdPrint,
    MdFilterList, MdClear, MdDeleteOutline
} from 'react-icons/md';
import { FaWhatsapp } from "react-icons/fa";
import { db } from '../firebaseConfig';
import { collection, query, orderBy, getDocs, limit, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { generateInvoice } from '../utils/generateInvoice';

const BillLogs = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [companyInfo, setCompanyInfo] = useState(null);
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

    const handlePrint = (bill) => {
        if (bill?.customerName?.toLowerCase() === "walking customer") return;

        const invoiceData = {
            nextBillNumber: bill.billNumber,
            billingData: {
                ...bill,
                contactNumber: bill.customerNumber,
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

    const openWhatsApp = async (bill) => {
        try {
            const msgRef = doc(db, "settings", "billWhatsappMessage");
            const msgSnap = await getDoc(msgRef);

            let messageTemplate = msgSnap.exists()
                ? msgSnap.data().template
                : `Hello {name},\n\nTotal: ₹{total}\n\nInvoice: {link}`;

            const baseUrl = window.location.origin;
            const shareLink = `${baseUrl}/view/invoice/${bill.id}`;

            const finalMessage = messageTemplate
                .replace(/{name}/g, bill.customerName || 'Customer')
                .replace(/{total}/g, bill.finalTotal.toFixed(2))
                .replace(/{link}/g, shareLink);

            if (bill.customerNumber) {
                const number = bill.customerNumber.replace(/\D/g, '');
                window.open(`https://wa.me/91${number}?text=${encodeURIComponent(finalMessage)}`, '_blank');
            }
        } catch (error) {
            console.error("WhatsApp error:", error);
        }
    };

    const handleDelete = async (billId, billNumber) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete Bill #${billNumber}? This action cannot be undone.`);

        if (confirmDelete) {
            try {
                // Delete from Firestore
                await deleteDoc(doc(db, "bills", billId));

                // Update local state to remove the bill from the list
                setBills(prevBills => prevBills.filter(bill => bill.id !== billId));

                alert(`Bill #${billNumber} deleted successfully.`);
            } catch (error) {
                console.error("Error deleting bill:", error);
                alert("Failed to delete the bill. Please try again.");
            }
        }
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
                        <InputGroup>
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
                            className="shadow-sm py-2 shadow-none"
                            value={paymentFilter}
                            onChange={(e) => setPaymentFilter(e.target.value)}
                        >
                            <option value="">All Methods</option>
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                        </Form.Select>
                    </Form.Group>
                </Col>

                {/* Date Range - Grouped Together */}
                <Col lg={4} md={8}>
                    <Form.Group>
                        <Form.Label className="small fw-bold text-muted text-uppercase">Date Range</Form.Label>
                        <InputGroup>
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
                    <div className="bg-light px-3 py-2 d-flex justify-content-center align-items-center rounded-pill text-muted small fw-bold border">
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
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                className="me-2"
                                                onClick={() => window.open(`/view/invoice/${bill.id}`, '_blank')}
                                            >
                                                <MdVisibility />
                                            </Button>

                                            {/* WhatsApp Button */}
                                            <Button
                                                variant="outline-success"
                                                size="sm"
                                                className="me-2"
                                                onClick={() => openWhatsApp(bill)}
                                                disabled={!bill.customerNumber || bill.customerName?.toLowerCase() === "walking customer"}
                                            >
                                                <FaWhatsapp />
                                            </Button>

                                            <Button
                                                variant="outline-dark"
                                                size="sm"
                                                className="me-2"
                                                onClick={() => handlePrint(bill)}
                                                disabled={bill.customerName?.toLowerCase() === "walking customer"}
                                            >
                                                <MdPrint />
                                            </Button>

                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleDelete(bill.id, bill.billNumber)}
                                                title="Delete Bill"
                                            >
                                                <MdDeleteOutline />
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
        </Container>
    );
};

export default BillLogs;