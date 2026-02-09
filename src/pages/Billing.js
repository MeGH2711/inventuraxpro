// React
import { useState, useEffect, useRef } from 'react';

// Firebase
import { db } from '../firebaseConfig';
import {
    collection, getDocs, query, orderBy,
    addDoc, serverTimestamp, getCountFromServer, doc, getDoc, limit
} from 'firebase/firestore';

// Bootstrap
import { Form, Button, Card, Row, Col, Table, ListGroup, Toast, ToastContainer, Modal } from 'react-bootstrap';

// Icons
import {
    MdDelete, MdReceipt, MdPerson, MdLocalShipping, MdSearch,
    MdChevronRight, MdChevronLeft, MdFileDownload, MdSave, MdMessage
} from 'react-icons/md';

// Theme
import { useTheme } from '../context/ThemeContext';

// Import the external designer PDF utility
import { generateInvoice } from '../utils/generateInvoice';

const Billing = () => {
    const { isDarkMode } = useTheme();
    // Core Logic States
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [overallDiscount, setOverallDiscount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [nextBillNumber, setNextBillNumber] = useState('...');

    // Customer Suggestion States
    const [allCustomers, setAllCustomers] = useState([]);
    const [customerSuggestions, setCustomerSuggestions] = useState([]);
    const [showCustomerSuggestions, setShowCustomerSuggestions] = useState({ name: false, phone: false });

    // Local state for the editable Grand Total to prevent cursor jumping
    const [manualTotal, setManualTotal] = useState("");

    // Company & Modal States
    const [companyInfo, setCompanyInfo] = useState(null);
    const [showPostSaveModal, setShowPostSaveModal] = useState(false);
    const [lastSavedBill, setLastSavedBill] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', bg: 'success' });

    // Refs for outside clicks
    const suggestionRef = useRef(null);
    const customerNameRef = useRef(null);
    const customerPhoneRef = useRef(null);
    const [isTotalExpanded, setIsTotalExpanded] = useState(true);

    const [billingData, setBillingData] = useState({
        customerName: '',
        contactNumber: '',
        customerAddress: '',
        billingDate: new Date().toISOString().split('T')[0],
        billingTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        deliveryMode: 'In-house',
        paymentMode: 'UPI'
    });

    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch Company Settings
                const companyRef = doc(db, "settings", "company");
                const companySnap = await getDoc(companyRef);
                if (companySnap.exists()) {
                    setCompanyInfo(companySnap.data());
                }

                // Fetch Products
                const q = query(collection(db, "products"), orderBy("name"));
                const snapshot = await getDocs(q);
                setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                // Fetch Unique Customers from Past Bills
                const billsQuery = query(collection(db, "bills"), orderBy("createdAt", "desc"), limit(500));
                const billsSnap = await getDocs(billsQuery);
                const uniqueCustomers = [];
                const seenNumbers = new Set();

                billsSnap.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.customerNumber && !seenNumbers.has(data.customerNumber)) {
                        seenNumbers.add(data.customerNumber);
                        uniqueCustomers.push({
                            name: data.customerName,
                            phone: data.customerNumber,
                            address: data.customerAddress
                        });
                    }
                });
                setAllCustomers(uniqueCustomers);

                // Get Next Bill Number
                const coll = collection(db, "bills");
                const snapshotCount = await getCountFromServer(coll);
                setNextBillNumber(snapshotCount.data().count + 1);
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };
        fetchInitialData();

        const handleClickOutside = (event) => {
            if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
            if (customerNameRef.current && !customerNameRef.current.contains(event.target)) {
                setShowCustomerSuggestions(prev => ({ ...prev, name: false }));
            }
            if (customerPhoneRef.current && !customerPhoneRef.current.contains(event.target)) {
                setShowCustomerSuggestions(prev => ({ ...prev, phone: false }));
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Derived Calculations
    const subTotal = cart.reduce((acc, item) => acc + item.discountedTotal, 0);
    const finalCalculatedTotal = subTotal - (subTotal * (overallDiscount / 100));

    const isCustomerDataComplete =
        billingData.customerName.trim() !== "" &&
        billingData.contactNumber.trim() !== "" &&
        billingData.customerAddress.trim() !== "" &&
        billingData.billingDate !== "" &&
        billingData.billingTime !== "";

    useEffect(() => {
        setManualTotal(finalCalculatedTotal.toFixed(2));
    }, [finalCalculatedTotal]);

    // Product Search Logic
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        setActiveSuggestionIndex(-1); // Reset index on new search
        if (value.length > 0) {
            const filtered = products.filter(p => p.name.toLowerCase().includes(value.toLowerCase()));
            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleKeyDown = (e) => {
        // If suggestions aren't showing, do nothing
        if (!showSuggestions || suggestions.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveSuggestionIndex(prev =>
                prev < suggestions.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
                selectProduct(suggestions[activeSuggestionIndex]);
                setActiveSuggestionIndex(-1);
            }
        } else if (e.key === "Escape") {
            setShowSuggestions(false);
        }
    };

    // Customer Search Logic
    const handleCustomerSearch = (field, value) => {
        // New restriction logic for phone number
        if (field === 'contactNumber') {
            // Remove any non-numeric characters
            const cleanedValue = value.replace(/\D/g, '');
            // Limit to 10 characters
            if (cleanedValue.length > 10) return;

            setBillingData({ ...billingData, [field]: cleanedValue });

            // Trigger suggestions only if we have a few digits
            if (cleanedValue.length > 1) {
                const filtered = allCustomers.filter(c => c.phone?.includes(cleanedValue));
                const uniqueFiltered = Array.from(new Map(filtered.map(item => [item.phone, item])).values());
                setCustomerSuggestions(uniqueFiltered);
                setShowCustomerSuggestions({ name: false, phone: true });
            } else {
                setShowCustomerSuggestions({ name: false, phone: false });
            }
        } else {
            // Original logic for name field
            setBillingData({ ...billingData, [field]: value });
            if (value.length > 1) {
                const filtered = allCustomers.filter(c => c.name?.toLowerCase().includes(value.toLowerCase()));
                const uniqueFiltered = Array.from(new Map(filtered.map(item => [item.phone, item])).values());
                setCustomerSuggestions(uniqueFiltered);
                setShowCustomerSuggestions({ name: true, phone: false });
            } else {
                setShowCustomerSuggestions({ name: false, phone: false });
            }
        }
    };

    const selectCustomer = (customer) => {
        setBillingData({
            ...billingData,
            customerName: customer.name,
            contactNumber: customer.phone,
            customerAddress: customer.address || ''
        });
        setShowCustomerSuggestions({ name: false, phone: false });
    };

    const selectProduct = (product) => {
        const existingItemIndex = cart.findIndex(item => item.id === product.id);
        if (existingItemIndex > -1) {
            const updatedCart = [...cart];
            const item = updatedCart[existingItemIndex];
            item.qty += 1;
            item.total = item.qty * item.price;
            item.discountedTotal = item.total - (item.total * (item.discount / 100));
            setCart(updatedCart);
        } else {
            setCart([...cart, { ...product, qty: 1, total: product.price, discount: 0, discountedTotal: product.price, tempId: Date.now() }]);
        }
        setSearchTerm('');
        setShowSuggestions(false);
    };

    const updateItemProperty = (index, field, value) => {
        const updatedCart = [...cart];
        const item = updatedCart[index];
        item[field] = parseFloat(value) || 0;
        item.total = item.qty * item.price;
        item.discountedTotal = item.total - (item.total * (item.discount / 100));
        setCart(updatedCart);
    };

    const handleManualTotalChange = (inputValue) => {
        setManualTotal(inputValue);
        const value = parseFloat(inputValue);
        if (!isNaN(value) && subTotal > 0) {
            const newDiscountPercent = ((subTotal - value) / subTotal) * 100;
            setOverallDiscount(parseFloat(newDiscountPercent.toFixed(2)));
        }
    };

    const downloadInvoicePDF = (billNum, bData, currentCart, sTotal, oDisc, fTotal) => {
        generateInvoice({
            nextBillNumber: billNum,
            billingData: bData,
            cart: currentCart,
            subTotal: sTotal,
            overallDiscount: oDisc,
            finalCalculatedTotal: fTotal
        }, companyInfo);
    };

    const handleOpenReviewModal = () => {
        if (cart.length === 0) {
            setToast({ show: true, message: 'Please add products to the bill.', bg: 'danger' });
            return;
        }
        setLastSavedBill({
            billingData: { ...billingData },
            cart: [...cart],
            subTotal,
            overallDiscount,
            finalCalculatedTotal
        });
        setShowPostSaveModal(true);
    };

    const saveBillToFirestore = async () => {
        setLoading(true);
        try {
            const coll = collection(db, "bills");
            const snapshotCount = await getCountFromServer(coll);
            const billNumber = snapshotCount.data().count + 1;

            const billSchema = {
                billNumber: billNumber,
                customerName: billingData.customerName || "Walking Customer",
                customerNumber: billingData.contactNumber,
                customerAddress: billingData.customerAddress,
                billingDate: billingData.billingDate,
                billingTime: billingData.billingTime,
                modeOfDelivery: billingData.deliveryMode,
                modeOfPayment: billingData.paymentMode,
                products: cart.map(item => ({
                    name: item.name,
                    quantity: item.qty,
                    unitPrice: item.price,
                    discount: item.discount,
                    discountedTotal: item.discountedTotal
                })),
                overallTotal: subTotal,
                overallDiscount: overallDiscount,
                finalTotal: finalCalculatedTotal,
                createdAt: serverTimestamp(),
            };

            // Save to Firestore and get the reference
            const docRef = await addDoc(collection(db, "bills"), billSchema);
            const billId = docRef.id; // This is the unique Document ID

            setNextBillNumber(billNumber + 1);

            // Update local customer list
            setAllCustomers(prev => {
                const exists = prev.some(c => c.phone === billingData.contactNumber);
                if (!exists && billingData.contactNumber) {
                    return [{
                        name: billingData.customerName,
                        phone: billingData.contactNumber,
                        address: billingData.customerAddress
                    }, ...prev];
                }
                return prev;
            });

            // Clear local state
            setCart([]);
            setOverallDiscount(0);

            setBillingData({
                customerName: '',
                contactNumber: '',
                customerAddress: '',
                billingDate: new Date().toISOString().split('T')[0],
                billingTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                deliveryMode: 'In-house',
                paymentMode: 'UPI'
            });

            setManualTotal("");

            return { billNumber, billId };
        } catch (error) {
            console.error("Error saving bill:", error);
            setToast({ show: true, message: 'Error saving transaction.', bg: 'danger' });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const openWhatsApp = async (billId) => {
        try {
            // 1. Fetch the custom template from Firestore
            const msgRef = doc(db, "settings", "billWhatsappMessage");
            const msgSnap = await getDoc(msgRef);

            let messageTemplate = "";
            if (msgSnap.exists()) {
                messageTemplate = msgSnap.data().template;
            }

            // 2. Fallback if no template exists yet
            if (!messageTemplate) {
                messageTemplate = `Hello {name},\n\nThank you for choosing De Baker's & More!\n\nTotal Amount: ₹{total}\n\nView Invoice: {link}`;
            }

            // 3. Prepare real data
            const baseUrl = window.location.origin;
            const shareLink = `${baseUrl}/view/invoice/${billId}`;
            const customerName = lastSavedBill?.billingData?.customerName || 'Customer';
            const totalAmount = lastSavedBill?.finalCalculatedTotal.toFixed(2);

            // 4. Replace placeholders
            const finalMessage = messageTemplate
                .replace(/{name}/g, customerName)
                .replace(/{total}/g, totalAmount)
                .replace(/{link}/g, shareLink);

            // 5. Open WhatsApp
            if (lastSavedBill?.billingData?.contactNumber) {
                const number = lastSavedBill.billingData.contactNumber.replace(/\D/g, '');
                window.open(`https://wa.me/91${number}?text=${encodeURIComponent(finalMessage)}`, '_blank');
            }
        } catch (error) {
            console.error("Error sending WhatsApp:", error);
            setToast({ show: true, message: 'Failed to load WhatsApp template.', bg: 'danger' });
        }
    };

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="pageHeader mb-1">Create New Bill</h2>
                    <p className="text-muted small mb-0">Generate and print customer invoices.</p>
                </div>
                <div className="d-flex align-items-center gap-3">
                    <div className={`px-3 py-2 rounded-3 border d-flex align-items-center shadow-sm ${isDarkMode ? 'bg-dark border-secondary' : 'bg-light'}`}>
                        <span className={`small fw-bold text-uppercase me-2 ${isDarkMode ? 'text-light' : 'text-muted'}`}>
                            Bill No:
                        </span>
                        <span className={`fw-bold ${isDarkMode ? 'text-white' : 'text-dark'}`}>
                            {nextBillNumber}
                        </span>
                    </div>
                    <Button variant="dark" className="px-4 py-2 shadow-sm" onClick={handleOpenReviewModal}>
                        <MdReceipt className="me-2" /> Complete Transaction
                    </Button>
                </div>
            </div>

            <Row>
                <Col lg={4}>
                    <Card className="border-0 shadow-sm rounded-4 mb-4">
                        <Card.Body className="p-4">
                            <div className="fw-bold text-muted small mb-3"><MdPerson className="me-2" /> CUSTOMER DETAILS</div>

                            <Form.Group className="mb-3 position-relative" ref={customerNameRef}>
                                <Form.Label className="small fw-bold text-muted">NAME</Form.Label>
                                <Form.Control
                                    type="text"
                                    autoComplete="off"
                                    value={billingData.customerName}
                                    onChange={(e) => handleCustomerSearch('customerName', e.target.value)}
                                />
                                {showCustomerSuggestions.name && customerSuggestions.length > 0 && (
                                    <ListGroup className="position-absolute w-100 shadow-lg" style={{ zIndex: 1060 }}>
                                        {customerSuggestions.map((c, i) => (
                                            <ListGroup.Item key={i} action onClick={() => selectCustomer(c)}>
                                                <div className="fw-bold">{c.name}</div>
                                                <small className="text-muted">{c.phone}</small>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                )}
                            </Form.Group>

                            <Form.Group className="mb-3 position-relative" ref={customerPhoneRef}>
                                <Form.Label className="small fw-bold text-muted">CONTACT NUMBER</Form.Label>
                                <Form.Control
                                    type="tel"
                                    autoComplete="off"
                                    value={billingData.contactNumber}
                                    maxLength={10} // Prevents typing more than 10 digits
                                    onChange={(e) => handleCustomerSearch('contactNumber', e.target.value)}
                                />
                                {showCustomerSuggestions.phone && customerSuggestions.length > 0 && (
                                    <ListGroup className="position-absolute w-100 shadow-lg" style={{ zIndex: 1060 }}>
                                        {customerSuggestions.map((c, i) => (
                                            <ListGroup.Item key={i} action onClick={() => selectCustomer(c)}>
                                                <div className="fw-bold">{c.phone}</div>
                                                <small className="text-muted">{c.name}</small>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                )}
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">ADDRESS</Form.Label>
                                <Form.Control type="text" value={billingData.customerAddress} onChange={(e) => setBillingData({ ...billingData, customerAddress: e.target.value })} />
                            </Form.Group>
                            <Row>
                                <Col md={6}><Form.Group className="mb-3"><Form.Label className="small fw-bold text-muted">DATE</Form.Label><Form.Control type="date" value={billingData.billingDate} onChange={(e) => setBillingData({ ...billingData, billingDate: e.target.value })} /></Form.Group></Col>
                                <Col md={6}><Form.Group className="mb-3"><Form.Label className="small fw-bold text-muted">TIME</Form.Label><Form.Control type="time" value={billingData.billingTime} onChange={(e) => setBillingData({ ...billingData, billingTime: e.target.value })} /></Form.Group></Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    <Card className="border-0 shadow-sm rounded-4">
                        <Card.Body className="p-4">
                            <div className="fw-bold text-muted small mb-3"><MdLocalShipping className="me-2" /> LOGISTICS & PAYMENT</div>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">DELIVERY MODE</Form.Label>
                                <Form.Select value={billingData.deliveryMode} onChange={(e) => setBillingData({ ...billingData, deliveryMode: e.target.value })}>
                                    <option>In-house</option>
                                    <option>Home Delivery</option>
                                </Form.Select>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label className="small fw-bold text-muted">PAYMENT MODE</Form.Label>
                                <Form.Select value={billingData.paymentMode} onChange={(e) => setBillingData({ ...billingData, paymentMode: e.target.value })}>
                                    <option>UPI</option>
                                    <option>Cash</option>
                                </Form.Select>
                            </Form.Group>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={8}>
                    <Card className={`shadow-sm rounded-4 mb-4 overflow-hidden ${isDarkMode ? 'border-1 border-light' : 'border-0'}`}>
                        <Card.Header className={`border-0 pt-4 px-4 position-relative ${isDarkMode ? 'bg-dark' : 'bg-white'}`}>
                            <div className="input-group" ref={suggestionRef}>
                                <span className={`input-group-text border-0 ${isDarkMode ? 'bg-dark text-light' : 'bg-light'}`}>
                                    <MdSearch />
                                </span>
                                <Form.Control
                                    placeholder="Type product name to add..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    onKeyDown={handleKeyDown}
                                    className={`border-0 shadow-none py-2 ${isDarkMode ? 'bg-dark text-light' : 'bg-light'}`}
                                    autoComplete="off"
                                />
                                {showSuggestions && (
                                    <ListGroup className="position-absolute w-100 shadow-lg billing-suggestion-list" style={{ top: '100%', left: 0, zIndex: 1060 }}>
                                        {suggestions.map((p, index) => (
                                            <ListGroup.Item
                                                key={p.id}
                                                action
                                                onClick={() => selectProduct(p)}
                                                className={`d-flex justify-content-between align-items-center ${activeSuggestionIndex === index ? 'active bg-primary text-white' : ''}`}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div>
                                                    <span className={activeSuggestionIndex === index ? 'text-white' : 'fw-bold'}>{p.name}</span>
                                                    <span className={`small ms-2 ${activeSuggestionIndex === index ? 'text-white-50' : 'text-muted'}`}>
                                                        [{p.unitValue} {p.unitType === 'piece' ? 'pcs' : 'gms'}]
                                                    </span>
                                                </div>
                                                <span className={`badge rounded-pill ${activeSuggestionIndex === index ? 'bg-white text-primary' : 'bg-darkblue'}`}>
                                                    ₹{p.price}
                                                </span>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                )}
                            </div>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {/* Added 'border-bottom-0' to the Table to remove the outer bottom stroke */}
                            <Table
                                responsive
                                hover
                                className={`mb-0 align-middle text-center billing-table border-bottom-0 ${isDarkMode ? 'table-dark' : ''}`}
                                style={{ borderCollapse: 'collapse' }}
                            >
                                <thead className={`${isDarkMode ? 'bg-dark text-light' : 'bg-light text-muted'} small uppercase`}>
                                    <tr className='border-secondary'>
                                        <th className="border-start-0">Product Name</th>
                                        <th>Qty</th>
                                        <th>Price</th>
                                        <th>Total</th>
                                        <th style={{ width: '100px' }}>Disc %</th>
                                        <th>Final</th>
                                        <th className="text-center border-end-0">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cart.map((item, index) => (
                                        <tr className='border-secondary' key={item.tempId}>
                                            <td className="ps-4 text-start fw-bold border-start-0">{item.name}</td>
                                            <td className="border-start border-end">
                                                <Form.Control size="sm" type="number" value={item.qty} onChange={(e) => updateItemProperty(index, 'qty', e.target.value)} className="text-center" />
                                            </td>
                                            <td className="border-start border-end">{item.price.toFixed(2)}</td>
                                            <td className="border-start border-end">{item.total.toFixed(2)}</td>
                                            <td className="border-start border-end">
                                                <Form.Control size="sm" type="number" value={item.discount} onChange={(e) => updateItemProperty(index, 'discount', e.target.value)} className="text-center" />
                                            </td>
                                            <td className="fw-bold border-start border-end">{item.discountedTotal.toFixed(2)}</td>
                                            <td className="text-center border-end-0">
                                                <Button variant="link" className="text-danger p-0" onClick={() => setCart(cart.filter(c => c.tempId !== item.tempId))}>
                                                    <MdDelete size={18} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {cart.length === 0 && (
                                        <tr className='border-secondary'>
                                            <td colSpan="7" className="text-center py-5 text-muted border-0">Cart is empty. Search products above.</td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot className="fw-bold bg-light border-secondary">
                                    <tr className="border-top">
                                        <td colSpan="5" className="text-end py-2 border-start-0">Subtotal</td>
                                        <td className="py-2 border-start border-end">{subTotal.toFixed(2)}</td>
                                        <td className="border-end-0"></td>
                                    </tr>
                                    <tr className="border-secondary">
                                        <td colSpan="5" className="text-end py-2 border-start-0">Overall Discount (%)</td>
                                        <td className="border-start border-end">
                                            <Form.Control
                                                size="sm"
                                                type="number"
                                                className="text-center"
                                                value={overallDiscount}
                                                onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)}
                                            />
                                        </td>
                                        <td className="border-end-0"></td>
                                    </tr>
                                    {/* Added 'border-bottom-0' to the final row and its cells */}
                                    <tr className="border-bottom-0 border-secondary">
                                        <td colSpan="5" className="text-end py-2 text-primary fs-5 border-start-0 border-bottom-0">Grand Total</td>
                                        <td className="py-2 border-start border-end border-bottom-0">
                                            <Form.Control
                                                size="sm"
                                                type="number"
                                                className="text-center fw-bold text-primary fs-5"
                                                value={manualTotal}
                                                onChange={(e) => handleManualTotalChange(e.target.value)}
                                                style={{ border: '1px solid #0d6efd', background: '#f0f7ff' }}
                                            />
                                        </td>
                                        <td className="border-end-0 border-bottom-0"></td>
                                    </tr>
                                </tfoot>
                            </Table>
                        </Card.Body>
                    </Card>

                    <div
                        id="finalTotalFixedBox"
                        className="p-3 shadow-lg d-flex align-items-center gap-3 text-white transition-all"
                        style={{
                            transform: isTotalExpanded ? 'translateX(0)' : 'translateX(calc(100% - 50px))',
                            transition: 'transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
                            cursor: 'default'
                        }}
                    >
                        <Button variant="link" className="text-white p-0" onClick={() => setIsTotalExpanded(!isTotalExpanded)}>
                            {isTotalExpanded ? <MdChevronRight size={30} /> : <MdChevronLeft size={30} />}
                        </Button>
                        <div className="d-flex align-items-center gap-4">
                            <div className="text-end">
                                <div className="small opacity-75">ITEMS: {cart.length}</div>
                                <div className="small opacity-75">TOTAL QTY: {cart.reduce((a, b) => a + b.qty, 0)}</div>
                            </div>
                            <div style={{ width: '2px', height: '40px', background: 'rgba(255,255,255,0.2)' }}></div>
                            <div>
                                <span className="small d-block opacity-75">GRAND TOTAL</span>
                                <span className="fs-3 fw-bold">₹{finalCalculatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>

            <Modal show={showPostSaveModal} onHide={() => !loading && setShowPostSaveModal(false)} centered backdrop="static">
                <Modal.Header closeButton={!loading} className="border-0 pt-4 px-4">
                    <Modal.Title className="fw-bold">Confirm Transaction</Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4 pb-4 text-center">
                    <div className="mb-4">
                        <div className="text-success display-4 mb-2">₹{lastSavedBill?.finalCalculatedTotal.toFixed(2)}</div>
                        <p className="text-muted">Review items and details before saving.</p>
                        {!isCustomerDataComplete && (
                            <p className="text-danger small mt-2">Note: Customer details are missing. Invoice download is disabled.</p>
                        )}
                    </div>
                    <div className="d-grid gap-3">
                        {isCustomerDataComplete && (
                            <Button
                                variant="darkblue" size="lg" className="py-3 shadow-sm"
                                disabled={loading}
                                onClick={async () => {
                                    try {
                                        // 1. Destructure BOTH billNumber and billId from the save function
                                        const { billNumber } = await saveBillToFirestore();

                                        // 2. Use billNumber (the number) for the PDF generation
                                        downloadInvoicePDF(
                                            billNumber,
                                            lastSavedBill.billingData,
                                            lastSavedBill.cart,
                                            lastSavedBill.subTotal,
                                            lastSavedBill.overallDiscount,
                                            lastSavedBill.finalCalculatedTotal
                                        );

                                        setShowPostSaveModal(false);

                                        // 3. Use billNumber (the number) for the Toast message
                                        setToast({
                                            show: true,
                                            message: `Bill #${billNumber} saved and downloading...`,
                                            bg: 'success'
                                        });
                                    } catch (error) {
                                        console.error("Save & Print failed", error);
                                    }
                                }}
                            >
                                <MdFileDownload className="me-2" /> {loading ? 'Saving...' : 'Save & Print Invoice'}
                            </Button>
                        )}

                        <div className="row g-2">
                            <div className={isCustomerDataComplete ? "col-6" : "col-12"}>
                                <Button
                                    variant="outline-dark"
                                    className="w-100 py-2"
                                    disabled={loading}
                                    onClick={async () => {
                                        const { billNumber } = await saveBillToFirestore();
                                        setShowPostSaveModal(false);
                                        setToast({ show: true, message: `Bill #${billNumber} saved successfully!`, bg: 'success' });
                                    }}
                                >
                                    <MdSave className="me-2" /> {loading ? 'Saving...' : 'Save & Close'}
                                </Button>
                            </div>
                            {isCustomerDataComplete && (
                                <div className="col-6">
                                    <Button
                                        variant="success"
                                        className="w-100 py-2"
                                        disabled={loading}
                                        onClick={async () => {
                                            try {
                                                // 1. Save the bill first and get the ID
                                                const result = await saveBillToFirestore();

                                                // 2. Pass the new billId to the WhatsApp function
                                                openWhatsApp(result.billId);

                                                setShowPostSaveModal(false);
                                                setToast({ show: true, message: `Bill #${result.billNumber} saved and shared!`, bg: 'success' });
                                            } catch (e) {
                                                console.error("WhatsApp flow failed", e);
                                            }
                                        }}
                                    >
                                        <MdMessage className="me-2" /> {loading ? 'Saving...' : 'Save & WhatsApp'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </Modal.Body>
            </Modal>

            <ToastContainer position="top-end" className="p-3">
                <Toast show={toast.show} bg={toast.bg} onClose={() => setToast({ ...toast, show: false })} delay={3000} autohide>
                    <Toast.Body className="text-white">{toast.message}</Toast.Body>
                </Toast>
            </ToastContainer>
        </div>
    );
};

export default Billing;