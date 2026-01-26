import React, { useState, useEffect } from 'react';

// Firebase
import { db } from '../firebaseConfig';
import {
    doc, getDoc, setDoc,
    collection, getDocs, query, orderBy, limit, where
} from 'firebase/firestore';

// Bootstrap
import {
    Container, Row, Col, Card, Table, Form, InputGroup,
    Button, Spinner, Modal, Badge, Dropdown, Offcanvas
} from 'react-bootstrap';

// Icons
import {
    MdSearch, MdReceipt, MdEvent, MdVisibility, MdPhone, MdHome, MdStar,
    MdSort, MdMessage
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

    const [historyView, setHistoryView] = useState('cards');

    const [showMsgSettings, setShowMsgSettings] = useState(false);
    const [customMessage, setCustomMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchWhatsAppSettings = async () => {
            try {
                const docRef = doc(db, "settings", "whatsappMessage");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setCustomMessage(docSnap.data().template || "");
                }
            } catch (error) {
                console.error("Error fetching message template:", error);
            }
        };
        fetchWhatsAppSettings();
    }, []);

    const saveMessageTemplate = async () => {
        setIsSaving(true);
        try {
            const docRef = doc(db, "settings", "whatsappMessage");
            await setDoc(docRef, {
                template: customMessage,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            setShowMsgSettings(false);
        } catch (error) {
            console.error("Error saving message template:", error);
            alert("Failed to save message.");
        } finally {
            setIsSaving(false);
        }
    };

    const textAreaRef = React.useRef(null);

    const applyStyle = (prefix, suffix = prefix) => {
        const el = textAreaRef.current;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const text = el.value;
        const selected = text.substring(start, end);

        const newText = text.substring(0, start) + prefix + selected + suffix + text.substring(end);
        setCustomMessage(newText);

        el.focus();
    };

    const renderWhatsAppPreview = (text) => {
        if (!text) return "Compose your message...";

        // Personalize name
        let formatted = text.replace(/{name}/g, 'John Doe');

        // Order of operations matters to prevent overlap
        return formatted
            .split('\n').map((line, i) => {
                let processedLine = line
                    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
                    .replace(/_(.*?)_/g, '<em>$1</em>')
                    .replace(/~(.*?)~/g, '<del>$1</del>')
                    .replace(/```(.*?)```/g, '<code style="background:#d1d1d1; padding:0 4px; border-radius:3px; font-family:monospace">$1</code>')
                    .replace(/`(.*?)`/g, '<code style="background:#d1d1d1; padding:0 4px; border-radius:3px; font-family:monospace">$1</code>')
                    .replace(/^> (.*)$/g, '<span style="border-left: 3px solid #30b489; padding-left: 10px; color: #555; display: block;">$1</span>')
                    .replace(/^\* (.*)$/g, '• $1');

                return <div key={i} dangerouslySetInnerHTML={{ __html: processedLine || '&nbsp;' }} />;
            });
    };

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

    const openWhatsApp = (phone, name) => {
        const personalizedMsg = customMessage.replace(/{name}/g, name);
        const encodedMsg = encodeURIComponent(personalizedMsg);

        window.open(`https://wa.me/91${phone.replace(/\D/g, '')}?text=${encodedMsg}`, '_blank');
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
                    <Button
                        variant="darkblue"
                        className="rounded-pill px-3 d-flex align-items-center"
                        onClick={() => setShowMsgSettings(true)}
                    >
                        <MdMessage className="mx-2" /> Message Settings
                    </Button>
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
                <Card.Header className="bg-white border-bottom py-3 px-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                    {/* Search & Sort Group */}
                    <div className="d-flex gap-2 w-100" style={{ maxWidth: '500px' }}>

                        {/* Simplified Search Bar */}
                        <InputGroup className="bg-light border rounded-3 flex-grow-1 overflow-hidden">
                            <InputGroup.Text className="bg-transparent border-0 pe-1">
                                <MdSearch size={18} className="text-muted" />
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Search name or mobile..."
                                className="bg-transparent border-0 shadow-none py-2"
                                style={{ fontSize: '0.85rem' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <Button
                                    variant="link"
                                    className="text-muted text-decoration-none border-0 pe-2"
                                    onClick={() => setSearchTerm('')}
                                >
                                    <small style={{ fontSize: '0.7rem', fontWeight: '700' }}>CLEAR</small>
                                </Button>
                            )}
                        </InputGroup>

                        {/* Simplified Sort Dropdown */}
                        <Dropdown onSelect={(e) => setSortBy(e)}>
                            <Dropdown.Toggle
                                variant="white"
                                className="border rounded-3 d-flex align-items-center smallest fw-bold text-uppercase px-3 py-2 shadow-none"
                            >
                                <MdSort size={18} className="me-2 text-muted" />
                                <span className="text-dark">
                                    {sortBy === 'spent' && 'Revenue'}
                                    {sortBy === 'visits' && 'Visits'}
                                    {sortBy === 'recent' && 'Recent'}
                                    {sortBy === 'alpha' && 'A-Z'}
                                </span>
                            </Dropdown.Toggle>

                            <Dropdown.Menu className="border shadow-sm rounded-3 mt-1">
                                <Dropdown.Item eventKey="spent" className="smallest py-2">HIGHEST SPENDING</Dropdown.Item>
                                <Dropdown.Item eventKey="visits" className="smallest py-2">MOST VISITS</Dropdown.Item>
                                <Dropdown.Item eventKey="recent" className="smallest py-2">RECENTLY SEEN</Dropdown.Item>
                                <Dropdown.Item eventKey="alpha" className="smallest py-2">NAME (A-Z)</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>

                    {/* Simple Record Count */}
                    <div className="d-none d-md-block">
                        <span className="text-muted smallest fw-bold text-uppercase tracking-wider">
                            {processedCustomers.length} Customers Found
                        </span>
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
                                {processedCustomers.length > 0 ? (
                                    processedCustomers.map((customer, index) => (
                                        <tr key={index} style={{ cursor: 'pointer' }}>
                                            {/* ... existing <td> content ... */}
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
                                                <Button
                                                    variant="outline-success"
                                                    size="sm"
                                                    className="me-2 rounded-3 px-3 py-2"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openWhatsApp(customer.phone, customer.name);
                                                    }}
                                                >
                                                    <FaWhatsapp />
                                                </Button>
                                                <Button variant="dark" size="sm" className="rounded-3 px-3 py-2" onClick={() => fetchCustomerHistory(customer)}>
                                                    Profile
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center py-5 text-muted">
                                            <div className="d-flex flex-column align-items-center">
                                                <MdSearch size={40} className="mb-2 opacity-25" />
                                                <p className="mb-0 fw-semibold">No customers found</p>
                                                <small>Try adjusting your search or filters</small>
                                            </div>
                                        </td>
                                    </tr>
                                )}
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
                                <div className="p-4 flex-grow-1 overflow-y-auto">

                                    {/* CONSOLIDATED PROFILE SECTION */}
                                    <Card className="border-0 bg-light rounded-4 p-4 mb-4 text-center">
                                        {/* Avatar */}
                                        <div className="position-relative d-inline-block mb-3">
                                            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center shadow-sm mx-auto font-montserrat"
                                                style={{ width: '80px', height: '80px', fontSize: '2rem', fontWeight: '800', border: '4px solid white' }}>
                                                {selectedCustomer.name.charAt(0)}
                                            </div>
                                        </div>

                                        {/* Name */}
                                        <h4 className="fw-bold text-dark mb-3">{selectedCustomer.name}</h4>

                                        <hr className="opacity-10 mb-3" />

                                        {/* Mobile */}
                                        <div className="d-flex align-items-center mb-3 text-start">
                                            <div className="bg-white p-2 rounded-3 shadow-sm me-3 text-primary"><MdPhone size={18} /></div>
                                            <div>
                                                <div className="text-muted smallest fw-bold text-uppercase">Mobile</div>
                                                <div className="text-dark fw-bold small">{selectedCustomer.phone}</div>
                                            </div>
                                        </div>

                                        {/* Address */}
                                        <div className="d-flex align-items-start text-start">
                                            <div className="bg-white p-2 rounded-3 shadow-sm me-3 text-primary"><MdHome size={18} /></div>
                                            <div>
                                                <div className="text-muted smallest fw-bold text-uppercase">Address</div>
                                                <div className="text-dark smallest lh-sm fw-semibold">{selectedCustomer.address}</div>
                                            </div>
                                        </div>
                                    </Card>

                                    {/* INSIGHTS SECTION */}
                                    <div className="mb-4">
                                        <h6 className="fw-bold text-uppercase smallest text-muted mb-3">Insights</h6>
                                        <div className="bg-dark text-white p-3 rounded-4 shadow-sm mb-3 text-center">
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

                                    {/* FAVORITE ITEMS SECTION */}
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
                                    <Button variant="success" className="w-100 py-3 rounded-4 fw-bold shadow-sm mb-2 mt-3 d-flex justify-content-center align-items-center" onClick={() => openWhatsApp(selectedCustomer.phone, selectedCustomer.name)}>
                                        <FaWhatsapp className="me-2 fs-5" /> Send WhatsApp
                                    </Button>
                                    <Button variant="danger" className="w-100 py-2 rounded-4 fw-bold smallest border-0" onClick={() => setShowProfile(false)}>
                                        Close Profile
                                    </Button>
                                </div>
                            </Col>

                            {/* RIGHT CONTENT: HISTORY */}
                            <Col md={8} lg={9} className="h-100 overflow-auto bg-light">
                                <div className="p-4 p-lg-5">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h3 className="fw-bold mb-0 d-flex align-items-center">
                                            <MdReceipt className="me-2 text-primary" /> Order History
                                        </h3>

                                        {/* View Toggle Buttons */}
                                        <div className="bg-white p-1 rounded-pill shadow-sm border">
                                            <Button
                                                variant={historyView === 'cards' ? 'primary' : 'light'}
                                                size="sm"
                                                className="rounded-pill px-3 border-0"
                                                onClick={() => setHistoryView('cards')}
                                            >
                                                Cards
                                            </Button>
                                            <Button
                                                variant={historyView === 'table' ? 'primary' : 'light'}
                                                size="sm"
                                                className="rounded-pill px-3 border-0"
                                                onClick={() => setHistoryView('table')}
                                            >
                                                Table
                                            </Button>
                                        </div>
                                    </div>

                                    {historyLoading ? (
                                        <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                                    ) : (
                                        <>
                                            {historyView === 'cards' ? (
                                                /* CARD VIEW */
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
                                                                        onClick={() => window.open(`/view/invoice/${bill.id}`, '_blank')}
                                                                    >
                                                                        <MdVisibility className="me-2" /> View Detailed Invoice
                                                                    </Button>
                                                                </Card.Body>
                                                            </Card>
                                                        </Col>
                                                    ))}
                                                </Row>
                                            ) : (
                                                /* TABLE VIEW */
                                                <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                                                    <Table responsive hover className="mb-0 align-middle">
                                                        <thead className="bg-white text-muted smallest text-uppercase fw-bold border-bottom">
                                                            <tr>
                                                                <th className="ps-4 py-3">Bill #</th>
                                                                <th>Date</th>
                                                                <th>Payment</th>
                                                                <th>Delivery</th>
                                                                <th>Amount</th>
                                                                <th className="text-end pe-4">Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {customerHistory.map(bill => (
                                                                <tr key={bill.id}>
                                                                    <td className="ps-4 fw-bold">#{bill.billNumber}</td>
                                                                    <td className="small">{formatDisplayDate(bill.billingDate)}</td>
                                                                    <td><Badge bg="light" text="dark" className="border">{bill.modeOfPayment}</Badge></td>
                                                                    <td><Badge bg="light" text="dark" className="border">{bill.modeOfDelivery}</Badge></td>
                                                                    <td className="fw-bold text-primary">₹{bill.finalTotal?.toFixed(2)}</td>
                                                                    <td className="text-end pe-4">
                                                                        <Button
                                                                            variant="link"
                                                                            className="p-0 text-dark"
                                                                            onClick={() => window.open(`/view/invoice/${bill.id}`, '_blank')}
                                                                        >
                                                                            <MdVisibility size={20} />
                                                                        </Button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                </Card>
                                            )}

                                            {customerHistory.length === 0 && (
                                                <div className="text-center py-5 bg-white rounded-4 shadow-sm">
                                                    <p className="text-muted mb-0">No order history found for this customer.</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </Col>
                        </Row>
                    )}
                </Modal.Body>
            </Modal>
            <Offcanvas show={showMsgSettings} onHide={() => setShowMsgSettings(false)} placement="end" className="rounded-start-4">
                <Offcanvas.Header closeButton className="border-bottom">
                    <Offcanvas.Title className="fw-bold">Campaign Editor</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    {/* STYLING TOOLBAR */}
                    <div className="d-flex flex-wrap gap-1 mb-2 bg-light p-2 rounded-3 border">
                        <Button variant="white" size="sm" className="border shadow-sm" onClick={() => applyStyle('*')}><b>B</b></Button>
                        <Button variant="white" size="sm" className="border shadow-sm" onClick={() => applyStyle('_')}><i>I</i></Button>
                        <Button variant="white" size="sm" className="border shadow-sm" onClick={() => applyStyle('~')}><del>S</del></Button>
                        <Button variant="white" size="sm" className="border shadow-sm" onClick={() => applyStyle('```')}>Code</Button>
                        <Button variant="white" size="sm" className="border shadow-sm" onClick={() => applyStyle('* ', '')}>List</Button>
                        <Button variant="white" size="sm" className="border shadow-sm" onClick={() => applyStyle('> ', '')}>Quote</Button>
                        <Button variant="outline-primary" size="sm" className="ms-auto" onClick={() => applyStyle('{name}', '')}>+ Name</Button>
                    </div>

                    <Form.Control
                        ref={textAreaRef}
                        as="textarea"
                        rows={10}
                        className="rounded-3 border-2 shadow-sm mb-3"
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                    />

                    <div className="mb-4">
                        <h6 className="smallest fw-bold text-uppercase mb-3 text-primary">WhatsApp Preview</h6>

                        {/* WhatsApp Background Simulation */}
                        <div
                            className="p-3 rounded-4 shadow-inner"
                            style={{
                                backgroundColor: '#e5ddd5',
                                backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`,
                                minHeight: '200px'
                            }}
                        >
                            {/* Chat Bubble */}

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
                                {/* The actual formatted text */}
                                <div style={{ whiteSpace: 'pre-wrap' }}>
                                    {renderWhatsAppPreview(customMessage)}
                                </div>

                                {/* Timestamp Mockup */}
                                <div className="text-end text-primary mt-1" style={{ fontSize: '0.65rem' }}>
                                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button variant="primary" className="w-100 py-3 rounded-4 fw-bold" onClick={saveMessageTemplate} disabled={isSaving}>
                        {isSaving ? <Spinner animation="border" size="sm" /> : 'Save Template'}
                    </Button>
                </Offcanvas.Body>
            </Offcanvas>
        </Container>
    );
};

export default Customers;