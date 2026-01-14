import React from 'react';
import { Container, Row, Col, Card, Table, Button, InputGroup, Form } from 'react-bootstrap';
import { MdReceipt, MdSearch, MdFilterList, MdFileDownload, MdHistory, MdPayment, MdCalendarToday } from 'react-icons/md';

const BillLogs = () => {
    return (
        <Container fluid className="py-4">
            {/* Header section consistent with style.css and Billing.js */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="pageHeader mb-1">Bill Logs</h2>
                    <p className="text-muted small mb-0">View and manage previous customer transactions.</p>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="outline-darkblue" className="btn btn-sm" disabled>
                        <MdFileDownload className="me-2" /> Export CSV
                    </Button>
                </div>
            </div>

            {/* Action Bar matching the Products.js layout */}
            <div className="d-flex gap-2 align-items-center mb-4">
                <InputGroup className="w-25 shadow-sm">
                    <InputGroup.Text className="bg-white border-end-0"><MdSearch /></InputGroup.Text>
                    <Form.Control
                        placeholder="Search by Bill No or Name..."
                        className="border-start-0 shadow-none"
                        disabled
                    />
                </InputGroup>
                <Button variant="light" className="border shadow-sm d-flex align-items-center gap-2" disabled>
                    <MdFilterList /> Filter
                </Button>
            </div>

            {/* Main Content Area */}
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                <Card.Body className="p-0">
                    {/* Placeholder Table Structure */}
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
                            {/* Empty state visual placeholder */}
                            <tr>
                                <td colSpan="6" className="text-center py-5">
                                    <div className="py-5">
                                        <div
                                            className="mb-4 d-inline-flex align-items-center justify-content-center rounded-circle"
                                            style={{
                                                width: '80px',
                                                height: '80px',
                                                backgroundColor: 'rgba(10, 47, 79, 0.05)',
                                                color: 'var(--mainThemeColor)'
                                            }}
                                        >
                                            <MdHistory size={40} />
                                        </div>
                                        <h4 className="fw-bold" style={{ color: 'var(--mainThemeColor)', fontFamily: 'Montserrat' }}>
                                            Transaction History Coming Soon
                                        </h4>
                                        <p className="text-muted mx-auto" style={{ maxWidth: '450px' }}>
                                            We are building a robust archival system to help you retrieve, reprint,
                                            and analyze past bills with lightning-fast search and filtering.
                                        </p>

                                        <Row className="g-3 justify-content-center mt-4">
                                            <Col xs="auto">
                                                <div className="d-flex align-items-center gap-2 px-3 py-2 bg-light rounded-pill small">
                                                    <MdCalendarToday className="text-primary" /> Date Range Filters
                                                </div>
                                            </Col>
                                            <Col xs="auto">
                                                <div className="d-flex align-items-center gap-2 px-3 py-2 bg-light rounded-pill small">
                                                    <MdPayment className="text-success" /> Payment Tracking
                                                </div>
                                            </Col>
                                            <Col xs="auto">
                                                <MdReceipt className="text-warning" /> One-Click Reprints
                                            </Col>
                                        </Row>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default BillLogs;