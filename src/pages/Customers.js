import React from 'react';
import { Container, Row, Col, Card, Button, InputGroup, Form } from 'react-bootstrap';
import { MdPeople, MdPersonAdd, MdSearch, MdHistory, MdCardMembership, MdStar } from 'react-icons/md';

const Customers = () => {
    return (
        <Container fluid className="py-4">
            {/* Header section consistent with style.css and Products.js */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="pageHeader mb-1">Customer Directory</h2>
                    <p className="text-muted small mb-0">Manage customer profiles and loyalty points.</p>
                </div>
            </div>

            <Row className="justify-content-center text-center py-5">
                <Col lg={6}>
                    <div
                        className="mb-4 d-inline-flex align-items-center justify-content-center rounded-circle"
                        style={{
                            width: '120px',
                            height: '120px',
                            backgroundColor: 'rgba(10, 47, 79, 0.05)',
                            color: 'var(--mainThemeColor)'
                        }}
                    >
                        <MdPeople size={60} />
                    </div>

                    <h3 className="fw-bold" style={{ color: 'var(--mainThemeColor)', fontFamily: 'Montserrat' }}>
                        Customer Management is Coming Soon
                    </h3>
                    <p className="text-muted mb-4">
                        We are building a centralized hub to help you track customer purchase history,
                        manage credit balances, and launch loyalty programs to keep your shoppers coming back.
                    </p>

                    <Row className="g-3 mt-2">
                        <Col md={4}>
                            <Card className="border-0 shadow-sm p-3 rounded-4 h-100">
                                <MdHistory className="mx-auto mb-2 text-primary" size={24} />
                                <div className="fw-bold small">Purchase Logs</div>
                                <div className="text-muted smallest" style={{ fontSize: '0.7rem' }}>Track every bill</div>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="border-0 shadow-sm p-3 rounded-4 h-100">
                                <MdCardMembership className="mx-auto mb-2 text-success" size={24} />
                                <div className="fw-bold small">Membership</div>
                                <div className="text-muted smallest" style={{ fontSize: '0.7rem' }}>Tier-based rewards</div>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="border-0 shadow-sm p-3 rounded-4 h-100">
                                <MdStar className="mx-auto mb-2 text-warning" size={24} />
                                <div className="fw-bold small">Top Spenders</div>
                                <div className="text-muted smallest" style={{ fontSize: '0.7rem' }}>Identify VIPs</div>
                            </Card>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </Container>
    );
};

export default Customers;