import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import {
    MdTrendingUp, MdPeople, MdReceipt, MdInventory,
    MdOutlineLocalShipping, MdAccountBalanceWallet, MdArrowForward
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();

    // Stats Configuration
    const stats = [
        { title: "Today's Sales", value: "₹ 0.00", icon: <MdAccountBalanceWallet />, color: "gradient-card" },
        { title: "Active Orders", value: "0", icon: <MdOutlineLocalShipping />, color: "gradient-card" },
        { title: "Total Products", value: "0", icon: <MdInventory />, color: "gradient-card" },
        { title: "New Customers", value: "0", icon: <MdPeople />, color: "gradient-card" },
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
                                    <h3 className="fw-bold mb-0">{item.value}</h3>
                                </div>
                                <div className="fs-1 opacity-25">{item.icon}</div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row className="g-4">
                {/* Recent Activity / Coming Soon Placeholder */}
                <Col lg={8}>
                    <Card className="border-0 shadow-sm rounded-4 h-100">
                        <Card.Header className="bg-transparent border-0 pt-4 px-4 d-flex justify-content-between">
                            <h5 className="fw-bold mb-0">Recent Transactions</h5>
                            <Button variant="link" className="p-0 text-decoration-none small" onClick={() => navigate('/billlogs')}>
                                View All <MdArrowForward />
                            </Button>
                        </Card.Header>
                        <Card.Body className="p-4 d-flex flex-column align-items-center justify-content-center text-center">
                            <div className="py-5">
                                <MdTrendingUp size={60} className="text-muted opacity-25 mb-3" />
                                <h6 className="text-muted">No transactions found for today.</h6>
                                <p className="small text-muted px-5">When you start billing, your live sales data and transaction history will appear here.</p>
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
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Low Stock Alert Placeholder */}
                    <Card className="border-0 shadow-sm rounded-4 bg-light border-start border-4 border-lightgreen">
                        <Card.Body className="p-4">
                            <div className="d-flex align-items-center gap-3">
                                <div className="text-success"><MdInventory size={30} /></div>
                                <div>
                                    <h6 className="fw-bold mb-1">Inventory Status</h6>
                                    <p className="small text-muted mb-0">All products are currently in stock.</p>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Dashboard;