import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import {
    MdTrendingUp, MdPeople, MdReceipt, MdInventory,
    MdAccountBalanceWallet, MdArrowForward, MdLoop, MdInsights
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

// Firebase imports for data fetching
import { db } from '../firebaseConfig';
import { collection, getDocs, getCountFromServer } from 'firebase/firestore';

const Dashboard = () => {
    const navigate = useNavigate();

    // State for live metrics
    const [totalProducts, setTotalProducts] = useState(0);
    const [uniqueCustomerCount, setUniqueCustomerCount] = useState(0);
    const [todaySales, setTodaySales] = useState(0);
    const [repeatRate, setRepeatRate] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardStats = async () => {
            setLoading(true);
            try {
                // 1. Fetch Total Products Count (Using the efficient getCountFromServer)
                const productColl = collection(db, "products");
                const productSnapshot = await getCountFromServer(productColl);
                setTotalProducts(productSnapshot.data().count);

                // 2. Fetch Bills for Sales and Customer Analysis
                const todayStr = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
                const billsColl = collection(db, "bills");
                const billsSnapshot = await getDocs(billsColl);

                let salesAccumulator = 0;
                const customerFrequency = {}; // Track occurrences of each phone number

                billsSnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    const phone = data.customerNumber;

                    // Track frequency of visits per customer
                    if (phone) {
                        customerFrequency[phone] = (customerFrequency[phone] || 0) + 1;
                    }

                    // Calculate Today's Sales based on billingDate string
                    if (data.billingDate === todayStr) {
                        salesAccumulator += (data.finalTotal || 0);
                    }
                });

                // 3. Calculate Repeat Rate & Unique Count
                const totalUnique = Object.keys(customerFrequency).length;
                const repeatCustomers = Object.values(customerFrequency).filter(count => count > 1).length;

                // Calculate percentage: (Repeat / Total) * 100
                const rate = totalUnique > 0 ? (repeatCustomers / totalUnique) * 100 : 0;

                setUniqueCustomerCount(totalUnique);
                setRepeatRate(rate.toFixed(1)); // Store as 1 decimal place
                setTodaySales(salesAccumulator);

            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardStats();
    }, []);

    // Updated Stats Configuration
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
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="pageHeader mb-1">Business Dashboard</h2>
                    <p className="text-muted small mb-0">Welcome back! Here is what's happening today.</p>
                </div>
                <Button variant="darkblue" onClick={() => navigate('/billing')}>
                    <MdReceipt className="me-2" /> New Invoice
                </Button>
            </div>

            {/* Quick Stats Grid */}
            <Row className="g-4 mb-5">
                {stats.map((item, idx) => (
                    <Col key={idx} md={6} lg={3}>
                        <Card className={`border-0 shadow-sm rounded-4 ${item.color} h-100 p-2 text-light`}>
                            <Card.Body className="d-flex align-items-center justify-content-between">
                                <div>
                                    <div className="small opacity-75 mb-1 text-uppercase fw-bold">{item.title}</div>
                                    <h3 className="fw-bold mb-0">{loading ? "..." : item.value}</h3>
                                </div>
                                <div className="fs-1 opacity-25">{item.icon}</div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row className="g-4">
                {/* Recent Activity Table Placeholder */}
                <Col lg={8}>
                    <Card className="border-0 shadow-sm rounded-4 h-100">
                        <Card.Header className="bg-transparent border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                            <h5 className="fw-bold mb-0">Recent Transactions</h5>
                            <Button variant="link" className="p-0 text-decoration-none small" onClick={() => navigate('/billlogs')}>
                                View All <MdArrowForward />
                            </Button>
                        </Card.Header>
                        <Card.Body className="p-4 d-flex flex-column align-items-center justify-content-center text-center">
                            <div className="py-5">
                                <MdTrendingUp size={60} className="text-muted opacity-25 mb-3" />
                                <h6 className="text-muted">Live insights coming soon</h6>
                                <p className="small text-muted px-5">Your sales trends and transaction history will appear here in real-time.</p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Quick Actions / Shortcuts */}
                <Col lg={4}>
                    <Card className="border-0 shadow-sm rounded-4 mb-4">
                        <Card.Header className="bg-transparent border-0 pt-4 px-4">
                            <h5 className="fw-bold mb-0">Quick Actions</h5>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <div className="d-grid gap-3">
                                <Button variant="outline-darkblue" className="text-start py-3" onClick={() => navigate('/products')}>
                                    <MdInventory className="me-2" /> Manage Inventory
                                </Button>
                                <Button variant="outline-darkblue" className="text-start py-3" onClick={() => navigate('/companydetails')}>
                                    <MdTrendingUp className="me-2" /> Company Settings
                                </Button>
                                <Button variant="outline-darkblue" className="text-start py-3" onClick={() => navigate('/analytics')}>
                                    <MdInsights className="me-2" /> Analytics
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