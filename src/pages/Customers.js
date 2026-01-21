import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { Container, Row, Col, Card, Table, Form, InputGroup, Button, Spinner, Modal, Badge, Dropdown } from 'react-bootstrap';
import {
    MdSearch, MdReceipt,
    MdEvent, MdVisibility, MdPhone,
    MdHome, MdStar, MdSort
} from 'react-icons/md';

import { FaWhatsapp } from "react-icons/fa";

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('spent');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalRevenue: 0, totalCustomers: 0 });

    const [showProfile, setShowProfile] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerHistory, setCustomerHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return "N/A";
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    useEffect(() => {
        const fetchCustomers = async () => {
            setLoading(true);
            try {
                const q = query(collection(db, "bills"), orderBy("createdAt", "desc"), limit(1000));
                const snapshot = await getDocs(q);
                const customerMap = new Map();
                let revenue = 0;

                snapshot.docs.forEach(doc => {
                    const data = doc.data();
                    const phone = data.customerNumber;
                    const total = data.finalTotal || 0;
                    revenue += total;

                    if (phone && !customerMap.has(phone)) {
                        customerMap.set(phone, {
                            name: data.customerName || "Walking Customer",
                            phone: phone,
                            address: data.customerAddress || "N/A",
                            lastVisit: formatDisplayDate(data.billingDate),
                            lastVisitRaw: data.billingDate, // Kept for sorting
                            totalBills: 1,
                            totalSpent: total
                        });
                    } else if (phone) {
                        const existing = customerMap.get(phone);
                        existing.totalBills += 1;
                        existing.totalSpent += total;
                        // Update last visit if this bill is newer
                        if (new Date(data.billingDate) > new Date(existing.lastVisitRaw)) {
                            existing.lastVisitRaw = data.billingDate;
                            existing.lastVisit = formatDisplayDate(data.billingDate);
                        }
                    }
                });

                setCustomers(Array.from(customerMap.values()));
                setStats({ totalRevenue: revenue, totalCustomers: customerMap.size });
            } catch (error) {
                console.error("Error fetching customers:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomers();
    }, []);

    const fetchCustomerHistory = async (customer) => {
        setSelectedCustomer(customer);
        setShowProfile(true);
        setHistoryLoading(true);
        try {
            const q = query(collection(db, "bills"), where("customerNumber", "==", customer.phone));
            const snapshot = await getDocs(q);
            const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
            setCustomerHistory(history);
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const openWhatsApp = (phone) => {
        window.open(`https://wa.me/91${phone.replace(/\D/g, '')}`, '_blank');
    };

    const processedCustomers = customers
        .filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm)
        )
        .sort((a, b) => {
            if (sortBy === 'spent') return b.totalSpent - a.totalSpent;
            if (sortBy === 'visits') return b.totalBills - a.totalBills;
            if (sortBy === 'recent') return new Date(b.lastVisitRaw) - new Date(a.lastVisitRaw);
            if (sortBy === 'alpha') return a.name.localeCompare(b.name);
            return 0;
        });

    const getTopItems = (history) => {
        const itemCounts = {};

        history.forEach(bill => {
            if (bill.products && Array.isArray(bill.products)) {
                bill.products.forEach(item => {
                    const name = item.name;
                    itemCounts[name] = (itemCounts[name] || 0) + (item.quantity || 1);
                });
            }
        });

        return Object.entries(itemCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);
    };

    return (
        <Container fluid className="py-4">
            {/* Header & Mini Stats Section */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                <div>
                    <h2 className="fw-bold text-dark mb-1 font-montserrat">Customer Insights</h2>
                    <p className="text-muted small mb-0">Manage relationships and track lifetime value for De Baker's & More.</p>
                </div>
                <div className="d-flex gap-3">
                    <div className="bg-white px-3 py-2 rounded-3 shadow-sm border-start border-4 border-primary">
                        <div className="smallest text-muted text-uppercase fw-bold">Total Sales</div>
                        <div className="fw-bold">₹{stats.totalRevenue.toLocaleString()}</div>
                    </div>
                    <div className="bg-white px-3 py-2 rounded-3 shadow-sm border-start border-4 border-success">
                        <div className="smallest text-muted text-uppercase fw-bold">Customers</div>
                        <div className="fw-bold">{stats.totalCustomers}</div>
                    </div>
                </div>
            </div>

            {/* Main Table Card */}
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                <Card.Header className="bg-white border-0 py-3 px-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                    <div className="d-flex gap-2 w-100" style={{ maxWidth: '500px' }}>
                        {/* Redesigned Search Bar */}
                        <InputGroup
                            style={{ transition: 'all 0.3s ease' }}
                            className="bg-white border rounded-pill px-2 shadow-sm flex-grow-1"
                        >
                            <InputGroup.Text className="bg-transparent border-0 pe-1">
                                <MdSearch size={18} className="text-primary" />
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Search..."
                                className="bg-transparent border-0 shadow-none py-1"
                                style={{ fontSize: '0.85rem' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <Button
                                    variant="link"
                                    className="text-muted p-0 pe-2 border-0 text-decoration-none d-flex align-items-center"
                                    onClick={() => setSearchTerm('')}
                                >
                                    <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>CLEAR</span>
                                </Button>
                            )}
                        </InputGroup>

                        {/* Sort Dropdown */}
                        <Dropdown onSelect={(e) => setSortBy(e)}>
                            <Dropdown.Toggle variant="light" className="rounded-pill border shadow-sm d-flex align-items-center smallest fw-bold text-uppercase px-3 py-2">
                                <MdSort size={18} className="me-2 text-primary" />
                                {sortBy === 'spent' && 'Highest Spent'}
                                {sortBy === 'visits' && 'Most Visits'}
                                {sortBy === 'recent' && 'Recently Seen'}
                                {sortBy === 'alpha' && 'Name (A-Z)'}
                            </Dropdown.Toggle>

                            <Dropdown.Menu className="border-0 shadow rounded-3">
                                <Dropdown.Item eventKey="spent" className="smallest py-2">HIGHEST SPENDING</Dropdown.Item>
                                <Dropdown.Item eventKey="visits" className="smallest py-2">MOST VISITS</Dropdown.Item>
                                <Dropdown.Item eventKey="recent" className="smallest py-2">RECENTLY SEEN</Dropdown.Item>
                                <Dropdown.Item eventKey="alpha" className="smallest py-2">NAME (A-Z)</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>

                    <div className="d-none d-md-block">
                        <Badge bg="primary-subtle" text="primary" className="rounded-pill px-3 py-2">
                            Showing {processedCustomers.length} Records
                        </Badge>
                    </div>
                </Card.Header>

                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                    ) : (
                        <Table responsive hover className="mb-0 align-middle custom-table">
                            <thead className="bg-light text-muted smallest text-uppercase fw-bold border-bottom">
                                <tr>
                                    <th className="ps-4 py-3">Customer Profile</th>
                                    <th>Address</th> {/* New Column Header */}
                                    <th>Status</th>
                                    <th>Total Spent</th>
                                    <th>Visits</th>
                                    <th>Last Seen</th>
                                    <th className="text-end pe-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {processedCustomers.map((customer, index) => (
                                    <tr key={index} style={{ cursor: 'pointer' }}>
                                        <td className="ps-4 py-3">
                                            <div className="d-flex align-items-center">
                                                <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold me-3"
                                                    style={{ width: '40px', height: '40px', fontSize: '0.9rem' }}>
                                                    {customer.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="fw-bold text-dark">{customer.name}</div>
                                                    <div className="text-muted smallest">{customer.phone}</div>
                                                </div>
                                            </div>
                                        </td>
                                        {/* New Address Cell */}
                                        <td className="text-muted smallest" style={{ maxWidth: '200px' }}>
                                            <div className="text-truncate"><MdHome size={14} className="me-1" /> {customer.address}</div>
                                        </td>
                                        <td>
                                            {customer.totalSpent > 5000 ? (
                                                <Badge bg="warning-subtle" text="warning" className="rounded-pill border border-warning px-2 py-1">
                                                    <MdStar size={12} className="me-1" /> VIP
                                                </Badge>
                                            ) : (
                                                <Badge bg="light" text="muted" className="rounded-pill border px-2 py-1">Regular</Badge>
                                            )}
                                        </td>
                                        <td className="fw-bold text-dark">
                                            ₹{customer.totalSpent.toFixed(2)}
                                        </td>
                                        <td>
                                            <span className="badge rounded-pill bg-light text-dark border px-2 py-1">{customer.totalBills} Bills</span>
                                        </td>
                                        <td className="text-muted small">
                                            {customer.lastVisit}
                                        </td>
                                        <td className="text-end pe-4">
                                            <Button variant="outline-success" size="sm" className="me-2 rounded-3 px-3 py-2" onClick={(e) => { e.stopPropagation(); openWhatsApp(customer.phone, customer.name); }}>
                                                <FaWhatsapp />
                                            </Button>
                                            <Button variant="dark" size="sm" className="rounded-3 px-3 py-2" onClick={() => fetchCustomerHistory(customer)}>
                                                Profile
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {/* Sidebar Modal Logic stays same as your file... */}
            <Modal show={showProfile} onHide={() => setShowProfile(false)} fullscreen centered>
                <Modal.Body className="p-0 bg-light">
                    {selectedCustomer && (
                        <Row className="g-0 h-100">
                            {/* LEFT SIDEBAR */}
                            <Col md={4} lg={3} className="bg-white border-end h-100 shadow-sm z-1 d-flex flex-column" style={{ height: '100vh' }}>
                                <div className="p-4 pb-0 text-center">
                                    <div className="position-relative d-inline-block mb-3">
                                        <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center shadow-sm mx-auto font-montserrat"
                                            style={{ width: '80px', height: '80px', fontSize: '2rem', fontWeight: '800', border: '4px solid #f8f9fa' }}>
                                            {selectedCustomer.name.charAt(0)}
                                        </div>
                                    </div>
                                    <h4 className="fw-bold text-dark mb-1">{selectedCustomer.name}</h4>
                                    <hr className="mt-2 mb-0" />
                                </div>

                                <div className="p-4 flex-grow-1 overflow-y-auto">
                                    <div className="mb-4">
                                        <Card className="border-0 bg-light rounded-4 p-3">
                                            <div className="d-flex align-items-center mb-3">
                                                <div className="bg-white p-2 rounded-3 shadow-sm me-3 text-primary"><MdPhone size={18} /></div>
                                                <div>
                                                    <div className="text-muted smallest fw-bold text-uppercase">Mobile</div>
                                                    <div className="text-dark fw-bold small">{selectedCustomer.phone}</div>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-start">
                                                <div className="bg-white p-2 rounded-3 shadow-sm me-3 text-primary"><MdHome size={18} /></div>
                                                <div>
                                                    <div className="text-muted smallest fw-bold text-uppercase">Address</div>
                                                    <div className="text-dark smallest lh-sm fw-semibold">{selectedCustomer.address}</div>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>

                                    <div className="mb-4">
                                        <h6 className="fw-bold text-uppercase smallest text-muted mb-3">Insights</h6>
                                        <div className="bg-dark text-white p-3 rounded-4 shadow-sm mb-3">
                                            <div className="smallest text-white-50 text-uppercase fw-bold mb-1">Lifetime Value</div>
                                            <div className="h4 fw-bold mb-0">₹{selectedCustomer.totalSpent.toFixed(2)}</div>
                                        </div>
                                        <Row className="g-2 text-center">
                                            <Col xs={6}>
                                                <div className="p-2 border rounded-3 bg-white h-100">
                                                    <div className="smallest text-muted text-uppercase mb-1">Avg Ticket</div>
                                                    <div className="fw-bold text-dark smallest">₹{(selectedCustomer.totalSpent / selectedCustomer.totalBills).toFixed(0)}</div>
                                                </div>
                                            </Col>
                                            <Col xs={6}>
                                                <div className="p-2 border rounded-3 bg-white h-100">
                                                    <div className="smallest text-muted text-uppercase mb-1">Visits</div>
                                                    <div className="fw-bold text-dark smallest">{selectedCustomer.totalBills}</div>
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>

                                    <div className="mb-4">
                                        <h6 className="fw-bold text-uppercase smallest text-muted mb-3">Favorite Items</h6>
                                        <div className="bg-white border rounded-4 overflow-hidden">
                                            {getTopItems(customerHistory).length > 0 ? (
                                                getTopItems(customerHistory).map(([itemName, count], idx) => (
                                                    <div key={idx} className={`p-3 d-flex justify-content-between align-items-center ${idx !== 2 ? 'border-bottom' : ''}`}>
                                                        <div className="d-flex align-items-center">
                                                            <Badge bg="primary-subtle" text="primary" className="me-2 rounded-circle">
                                                                {idx + 1}
                                                            </Badge>
                                                            <span className="smallest fw-bold text-dark text-truncate" style={{ maxWidth: '120px' }}>
                                                                {itemName}
                                                            </span>
                                                        </div>
                                                        <Badge bg="light" text="dark" className="border">
                                                            {count}x
                                                        </Badge>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-3 text-center text-muted smallest">No item data available</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 pt-0 border-top bg-white mt-auto">
                                    <Button variant="success" className="w-100 py-3 rounded-4 fw-bold shadow-sm mb-2 mt-3" onClick={() => openWhatsApp(selectedCustomer.phone, selectedCustomer.name)}>
                                        <FaWhatsapp className="me-2" /> Send WhatsApp
                                    </Button>
                                    <Button variant="outline-danger" className="w-100 py-2 rounded-4 fw-bold smallest border-0" onClick={() => setShowProfile(false)}>
                                        Close Profile
                                    </Button>
                                </div>
                            </Col>

                            {/* RIGHT CONTENT: HISTORY */}
                            <Col md={8} lg={9} className="h-100 overflow-auto bg-light">
                                <div className="p-4 p-lg-5">
                                    <h3 className="fw-bold mb-4 d-flex align-items-center">
                                        <MdReceipt className="me-2 text-primary" /> Order History
                                    </h3>

                                    {historyLoading ? (
                                        <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                                    ) : (
                                        <Row className="g-4">
                                            {customerHistory.map(bill => (
                                                <Col xl={6} key={bill.id}>
                                                    <Card className="border-0 shadow-sm rounded-4 h-100">
                                                        <Card.Body className="p-4">
                                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                                <div>
                                                                    <div className="badge bg-dark mb-2 px-3">Bill #{bill.billNumber}</div>
                                                                    <div className="small text-muted d-flex align-items-center">
                                                                        <MdEvent className="me-1" /> {formatDisplayDate(bill.billingDate)}
                                                                    </div>
                                                                </div>
                                                                <div className="text-end">
                                                                    <div className="small text-muted fw-bold">TOTAL</div>
                                                                    <div className="h4 fw-bold text-primary mb-0">₹{bill.finalTotal?.toFixed(2)}</div>
                                                                </div>
                                                            </div>
                                                            <div className="d-flex gap-2 mb-3">
                                                                <Badge bg="white" text="dark" className="border px-3 py-2">{bill.modeOfPayment}</Badge>
                                                                <Badge bg="white" text="dark" className="border px-3 py-2">{bill.modeOfDelivery}</Badge>
                                                            </div>
                                                            <Button
                                                                variant="outline-dark"
                                                                className="w-100 rounded-pill fw-bold"
                                                                onClick={() => window.open(`/billpreview/${bill.id}`, '_blank')}
                                                            >
                                                                <MdVisibility className="me-2" /> View Detailed Invoice
                                                            </Button>
                                                        </Card.Body>
                                                    </Card>
                                                </Col>
                                            ))}
                                        </Row>
                                    )}
                                </div>
                            </Col>
                        </Row>
                    )}
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default Customers;