import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebaseConfig';
import {
    collection, getDocs, query, orderBy,
    addDoc, doc, runTransaction, serverTimestamp, getDoc
} from 'firebase/firestore';
import { Form, Button, Card, Row, Col, Table, ListGroup, Toast, ToastContainer } from 'react-bootstrap';
import { MdDelete, MdReceipt, MdPerson, MdLocalShipping, MdSearch, MdChevronRight, MdChevronLeft } from 'react-icons/md';

const Billing = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [overallDiscount, setOverallDiscount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [nextBillNumber, setNextBillNumber] = useState('...'); // State for the Bill ID display
    const [toast, setToast] = useState({ show: false, message: '', bg: 'success' });
    const suggestionRef = useRef(null);

    const [isTotalExpanded, setIsTotalExpanded] = useState(true);

    const [billingData, setBillingData] = useState({
        customerName: '',
        contactNumber: '',
        customerAddress: '',
        billingDate: new Date().toISOString().split('T')[0],
        billingTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        deliveryMode: 'Store Pickup',
        paymentMode: 'UPI'
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            // Fetch Products
            const q = query(collection(db, "products"), orderBy("name"));
            const snapshot = await getDocs(q);
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            // Fetch Current Bill Number for display
            const counterRef = doc(db, "settings", "billCounter");
            const counterSnap = await getDoc(counterRef);
            if (counterSnap.exists()) {
                setNextBillNumber(counterSnap.data().lastBillNumber + 1);
            } else {
                setNextBillNumber(1);
            }
        };
        fetchInitialData();

        const handleClickOutside = (event) => {
            if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (value.length > 0) {
            const filtered = products.filter(p => p.name.toLowerCase().includes(value.toLowerCase()));
            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
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

    const subTotal = cart.reduce((acc, item) => acc + item.discountedTotal, 0);
    const finalCalculatedTotal = subTotal - (subTotal * (overallDiscount / 100));

    const handleCompleteTransaction = async () => {
        if (cart.length === 0) {
            setToast({ show: true, message: 'Please add products to the bill.', bg: 'danger' });
            return;
        }

        setLoading(true);
        try {
            const billNumber = await runTransaction(db, async (transaction) => {
                const counterRef = doc(db, "settings", "billCounter");
                const counterSnap = await transaction.get(counterRef);

                let nextNumber = 1;
                if (counterSnap.exists()) {
                    nextNumber = counterSnap.data().lastBillNumber + 1;
                }

                transaction.set(counterRef, { lastBillNumber: nextNumber }, { merge: true });
                return nextNumber;
            });

            const billSchema = {
                billNumber: billNumber,
                customerName: billingData.customerName,
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
                    originalTotal: item.total,
                    discount: item.discount,
                    discountedTotal: item.discountedTotal
                })),
                overallTotal: subTotal,
                overallDiscount: overallDiscount,
                finalTotal: finalCalculatedTotal,
                createdAt: serverTimestamp(),
                __v: 0
            };

            await addDoc(collection(db, "bills"), billSchema);
            setToast({ show: true, message: `Bill #${billNumber} saved successfully!`, bg: 'success' });

            setCart([]);
            setOverallDiscount(0);
            setNextBillNumber(billNumber + 1); // Update for next transaction
            setBillingData({
                ...billingData,
                customerName: '',
                contactNumber: '',
                customerAddress: '',
                billingDate: new Date().toISOString().split('T')[0],
                billingTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
            });
        } catch (error) {
            console.error("Error saving bill:", error);
            setToast({ show: true, message: 'Error saving transaction.', bg: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="pageHeader mb-1">Create New Bill</h2>
                    <p className="text-muted small mb-0">Generate and print customer invoices.</p>
                </div>

                {/* Header Actions: Bill Number Text & Action Button */}
                <div className="d-flex align-items-center gap-3">
                    <div className="bg-light px-3 py-2 rounded-3 border d-flex align-items-center shadow-sm">
                        <span className="small fw-bold text-muted text-uppercase me-2">Bill No:</span>
                        <span className="fw-bold text-dark">{nextBillNumber}</span>
                    </div>
                    <Button
                        variant="darkblue"
                        className="px-4 py-2 shadow-sm"
                        onClick={handleCompleteTransaction}
                        disabled={loading}
                    >
                        <MdReceipt className="me-2" /> {loading ? 'Saving...' : 'Complete Transaction'}
                    </Button>
                </div>
            </div>

            <Row>
                <Col lg={4}>
                    <Card className="border-0 shadow-sm rounded-4 mb-4">
                        <Card.Body className="p-4">
                            <div className="fw-bold text-muted small mb-3">
                                <MdPerson className="me-2" /> CUSTOMER DETAILS
                            </div>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">NAME</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={billingData.customerName}
                                    onChange={(e) => setBillingData({ ...billingData, customerName: e.target.value })}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">CONTACT NUMBER</Form.Label>
                                <Form.Control
                                    type="tel"
                                    value={billingData.contactNumber}
                                    onChange={(e) => setBillingData({ ...billingData, contactNumber: e.target.value })}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">ADDRESS</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={billingData.customerAddress}
                                    onChange={(e) => setBillingData({ ...billingData, customerAddress: e.target.value })}
                                />
                            </Form.Group>
                            <Row>
                                <Col md={6}><Form.Group className="mb-3"><Form.Label className="small fw-bold text-muted">DATE</Form.Label><Form.Control type="date" value={billingData.billingDate} readOnly /></Form.Group></Col>
                                <Col md={6}><Form.Group className="mb-3"><Form.Label className="small fw-bold text-muted">TIME</Form.Label><Form.Control type="time" value={billingData.billingTime} readOnly /></Form.Group></Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    <Card className="border-0 shadow-sm rounded-4">
                        <Card.Body className="p-4">
                            <div className="fw-bold text-muted small mb-3"><MdLocalShipping className="me-2" /> LOGISTICS & PAYMENT</div>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">DELIVERY MODE</Form.Label>
                                <Form.Select value={billingData.deliveryMode} onChange={(e) => setBillingData({ ...billingData, deliveryMode: e.target.value })}>
                                    <option>Store Pickup</option>
                                    <option>Home Delivery</option>
                                    <option>In-house</option>
                                </Form.Select>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label className="small fw-bold text-muted">PAYMENT MODE</Form.Label>
                                <Form.Select value={billingData.paymentMode} onChange={(e) => setBillingData({ ...billingData, paymentMode: e.target.value })}>
                                    <option>UPI</option>
                                    <option>Cash</option>
                                    <option>Card</option>
                                </Form.Select>
                            </Form.Group>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={8}>
                    <Card className="border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
                        <Card.Header className="bg-white border-0 pt-4 px-4 position-relative">
                            <div className="input-group" ref={suggestionRef}>
                                <span className="input-group-text bg-light border-0"><MdSearch /></span>
                                <Form.Control placeholder="Type product name to add..." value={searchTerm} onChange={handleSearch} className="bg-light border-0 shadow-none py-2" />
                                {showSuggestions && (
                                    <ListGroup className="position-absolute w-100 shadow-lg" style={{ top: '100%', left: 0, zIndex: 1060 }}>
                                        {suggestions.map(p => (
                                            <ListGroup.Item key={p.id} action onClick={() => selectProduct(p)} className="d-flex justify-content-between align-items-center">
                                                <div><span className="fw-bold">{p.name}</span><span className="text-muted small ms-2">[{p.unitValue} {p.unitType === 'piece' ? 'pcs' : 'gms'}]</span></div>
                                                <span className="badge bg-primary rounded-pill">₹{p.price}</span>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                )}
                            </div>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table responsive bordered hover className="mb-0 product-table align-middle text-center">
                                <thead className="bg-light"><tr className="small text-uppercase"><th>Product Name</th><th style={{ width: '100px' }}>Quantity</th><th>Price (per unit)</th><th>Total</th><th style={{ width: '100px' }}>Discount (%)</th><th style={{ width: '160px' }}>Discounted Total</th><th className="text-center">Action</th></tr></thead>
                                <tbody>
                                    {cart.map((item, index) => (
                                        <tr key={item.tempId}>
                                            <td className="ps-4 text-start"><div className="fw-bold">{item.name}</div></td>
                                            <td><Form.Control size="sm" type="number" value={item.qty} onChange={(e) => updateItemProperty(index, 'qty', e.target.value)} className="shadow-none text-center fw-bold" /></td>
                                            <td>{item.price.toFixed(2)}</td>
                                            <td>{item.total.toFixed(2)}</td>
                                            <td><Form.Control size="sm" type="number" value={item.discount} onChange={(e) => updateItemProperty(index, 'discount', e.target.value)} className="shadow-none text-center" /></td>
                                            <td className="p-1"><Form.Control size="sm" readOnly value={item.discountedTotal.toFixed(2)} className="bg-white text-center border-0 fw-bold" /></td>
                                            <td className="text-center"><Button variant="link" className="text-danger p-0" onClick={() => setCart(cart.filter(c => c.tempId !== item.tempId))}><MdDelete size={18} /></Button></td>
                                        </tr>
                                    ))}
                                    {cart.length === 0 && (
                                        <tr><td colSpan="7" className="text-center py-5 text-muted">Start adding products to create a bill.</td></tr>
                                    )}
                                </tbody>
                                <tfoot className="fw-bold bg-light">
                                    <tr><td colSpan="5" className="text-end py-2">Total</td><td className="py-2 text-center">{subTotal.toFixed(2)}</td><td></td></tr>
                                    <tr><td colSpan="5" className="text-end py-2">Overall Discount (%)</td><td className="p-1"><Form.Control size="sm" type="number" className="text-center shadow-none fw-bold" value={overallDiscount} onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)} /></td><td></td></tr>
                                    <tr><td colSpan="5" className="text-end py-2">Final Total (After Discount)</td><td className="p-1"><Form.Control size="sm" readOnly className="text-center shadow-none fw-bold bg-white" value={finalCalculatedTotal.toFixed(2)} /></td><td></td></tr>
                                </tfoot>
                            </Table>
                        </Card.Body>
                    </Card>

                    <div
                        id="finalTotalFixedBox"
                        className={`p-3 shadow-lg d-flex align-items-center gap-3 text-white transition-all`}
                        style={{
                            transform: isTotalExpanded ? 'translateX(0)' : 'translateX(calc(100% - 50px))',
                            transition: 'transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
                            cursor: 'default'
                        }}
                    >
                        {/* Toggle Button on the Left */}
                        <Button
                            variant="link"
                            className="text-white p-0 border-0 shadow-none"
                            onClick={() => setIsTotalExpanded(!isTotalExpanded)}
                        >
                            {isTotalExpanded ? <MdChevronRight size={30} /> : <MdChevronLeft size={30} />}
                        </Button>

                        {/* Content Group - wrapped to handle visibility if needed, or kept for layout */}
                        <div className="d-flex align-items-center gap-4">
                            <div className="text-end">
                                <div className="small opacity-75">ITEMS: {cart.length}</div>
                                <div className="small opacity-75">TOTAL QTY: {cart.reduce((a, b) => a + b.qty, 0)}</div>
                            </div>
                            <div style={{ width: '2px', height: '40px', background: 'rgba(255,255,255,0.2)' }}></div>
                            <div>
                                <span className="small d-block opacity-75">GRAND TOTAL</span>
                                <span className="fs-3 fw-bold">₹ {finalCalculatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>

            <ToastContainer position="top-end" className="p-3">
                <Toast show={toast.show} bg={toast.bg} onClose={() => setToast({ ...toast, show: false })} delay={3000} autohide>
                    <Toast.Body className="text-white">{toast.message}</Toast.Body>
                </Toast>
            </ToastContainer>
        </div>
    );
};

export default Billing;