import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Spinner } from 'react-bootstrap';
import {
    MdTrendingUp, MdPeople, MdReceipt, MdInventory,
    MdAccountBalanceWallet, MdArrowForward, MdLoop, MdInsights
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

// Firebase imports
import { db } from '../firebaseConfig';
import { collection, getDocs, getCountFromServer, query, orderBy, limit } from 'firebase/firestore';

const Dashboard = () => {
    const navigate = useNavigate();

    // State for live metrics
    const [totalProducts, setTotalProducts] = useState(0);
    const [uniqueCustomerCount, setUniqueCustomerCount] = useState(0);
    const [todaySales, setTodaySales] = useState(0);
    const [repeatRate, setRepeatRate] = useState(0);
    const [recentBills, setRecentBills] = useState([]);
    const [loading, setLoading] = useState(true);

    // Helper to format date string (YYYY-MM-DD) to "16 Jan 2026"
    const formatDate = (dateString) => {
        if (!dateString) return "...";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Total Products Count
                const productColl = collection(db, "products");
                const productSnapshot = await getCountFromServer(productColl);
                setTotalProducts(productSnapshot.data().count);

                // 2. Fetch Recent Bills
                const billsColl = collection(db, "bills");
                const recentQuery = query(billsColl, orderBy("createdAt", "desc"), limit(5));
                const recentSnapshot = await getDocs(recentQuery);
                const fetchedBills = recentSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setRecentBills(fetchedBills);

                // 3. Fetch All Bills for Stats Calculation
                const todayStr = new Date().toISOString().split('T')[0];
                const allBillsSnapshot = await getDocs(billsColl);

                let salesAccumulator = 0;
                const customerFrequency = {};

                allBillsSnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    const phone = data.customerNumber;

                    if (phone) {
                        customerFrequency[phone] = (customerFrequency[phone] || 0) + 1;
                    }

                    if (data.billingDate === todayStr) {
                        salesAccumulator += (data.finalTotal || 0);
                    }
                });

                const totalUnique = Object.keys(customerFrequency).length;
                const repeatCustomers = Object.values(customerFrequency).filter(count => count > 1).length;
                const rate = totalUnique > 0 ? (repeatCustomers / totalUnique) * 100 : 0;

                setUniqueCustomerCount(totalUnique);
                setRepeatRate(rate.toFixed(1));
                setTodaySales(salesAccumulator);

            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const stats = [
        {
            title: "Today's Sales",
            value: `₹ ${todaySales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
            icon: <MdAccountBalanceWallet />,
            color: "gradient-card"
        },
        {
            title: "Customer Repeat Rate",
            value: `${repeatRate}%`,
            icon: <MdLoop />,
            color: "gradient-card"
        },
        {
            title: "Total Products",
            value: totalProducts.toString(),
            icon: <MdInventory />,
            color: "gradient-card"
        },
        {
            title: "Total Customers",
            value: uniqueCustomerCount.toString(),
            icon: <MdPeople />,
            color: "gradient-card"
        },
    ];

    return (
        <Container fluid className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="pageHeader mb-1">Business Dashboard</h2>
                    <p className="text-muted small mb-0">Welcome back! Here is what's happening today.</p>
                </div>
                <Button variant="darkblue" onClick={() => navigate('/billing')}>
                    <MdReceipt className="me-2" /> New Invoice
                </Button>
            </div>

            <Row className="g-4 mb-5">
                {stats.map((item, idx) => (
                    <Col key={idx} md={6} lg={3}>
                        <Card className={`border-0 shadow-sm rounded-4 ${item.color} h-100 p-2 text-light`}>
                            <Card.Body className="d-flex align-items-center justify-content-between">
                                <div>
                                    <div className="small opacity-75 mb-1 text-uppercase fw-bold">{item.title}</div>
                                    <h3 className="fw-bold mb-0">{loading ? <Spinner animation="border" size="sm" /> : item.value}</h3>
                                </div>
                                <div className="fs-1 opacity-25">{item.icon}</div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row className="g-4">
                <Col lg={8}>
                    <Card className="border-0 shadow-sm rounded-4 h-100">
                        <Card.Header className="bg-transparent border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                            <h5 className="fw-bold mb-0">Recent Transactions</h5>
                            <Button variant="link" className="p-0 text-decoration-none small fw-bold" onClick={() => navigate('/billlogs')}>
                                View All <MdArrowForward />
                            </Button>
                        </Card.Header>
                        <Card.Body className="px-0">
                            {loading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="primary" />
                                    <p className="text-muted mt-2">Loading transactions...</p>
                                </div>
                            ) : recentBills.length > 0 ? (
                                <Table responsive hover className="align-middle mb-0">
                                    <thead className="bg-light">
                                        <tr className="small text-uppercase text-muted">
                                            <th className="ps-4">Bill No</th>
                                            <th>Customer</th>
                                            <th>Date</th>
                                            <th>Amount</th>
                                            <th>Mode</th>
                                            <th className="text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentBills.map((bill) => (
                                            <tr key={bill.id}>
                                                <td className="ps-4 fw-bold text-primary">#{bill.billNumber}</td>
                                                <td>
                                                    <div className="fw-bold">{bill.customerName}</div>
                                                    <div className="small text-muted">{bill.customerNumber}</div>
                                                </td>
                                                <td className="small">{formatDate(bill.billingDate)}</td>
                                                <td className="fw-bold">₹{bill.finalTotal?.toLocaleString('en-IN')}</td>
                                                <td>
                                                    <Badge bg="light" className="text-dark border">
                                                        {bill.modeOfPayment}
                                                    </Badge>
                                                </td>
                                                <td className="text-center">
                                                    <Button
                                                        variant="link"
                                                        className="p-0 text-darkblue"
                                                        onClick={() => navigate(`/billlogs`)}
                                                    >
                                                        <MdReceipt size={20} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            ) : (
                                <div className="text-center py-5">
                                    <MdTrendingUp size={60} className="text-muted opacity-25 mb-3" />
                                    <h6 className="text-muted">No transactions yet</h6>
                                    <p className="small text-muted">Create your first bill to see activity here.</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={4}>
                    <Card className="border-0 shadow-sm rounded-4 mb-4">
                        <Card.Header className="bg-transparent border-0 pt-4 px-4">
                            <h5 className="fw-bold mb-0">Quick Actions</h5>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <div className="d-grid gap-3">
                                <Button variant="outline-darkblue" className="text-start py-3 d-flex align-items-center" onClick={() => navigate('/products')}>
                                    <MdInventory className="me-3" size={20} /> Manage Inventory
                                </Button>
                                <Button variant="outline-darkblue" className="text-start py-3 d-flex align-items-center" onClick={() => navigate('/companydetails')}>
                                    <MdTrendingUp className="me-3" size={20} /> Company Settings
                                </Button>
                                <Button variant="outline-darkblue" className="text-start py-3 d-flex align-items-center" onClick={() => navigate('/analytics')}>
                                    <MdInsights className="me-3" size={20} /> Analytics
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Dashboard;