import React from 'react';
import { Container, Card, Table, Button, Badge } from 'react-bootstrap';
import {
    MdCompareArrows, MdSearch, MdFilterList,
    MdFileDownload, MdSwapHoriz, MdArrowUpward, MdArrowDownward
} from 'react-icons/md';

const Transactions = () => {
    return (
        <Container fluid className="py-4">
            {/* Header consistent with style.css and your other pages */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="pageHeader mb-1">Financial Transactions</h2>
                    <p className="text-muted small mb-0">Monitor all cash inflows and outflows across your business.</p>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="outline-darkblue" className="btn btn-sm" disabled>
                        <MdFileDownload className="me-2" /> Ledger Export
                    </Button>
                </div>
            </div>

            {/* Mock Filters to match your UI pattern */}
            <div className="d-flex gap-3 mb-4">
                <div className="input-group w-25 shadow-sm">
                    <span className="input-group-text bg-white border-end-0"><MdSearch /></span>
                    <input type="text" className="form-control border-start-0 shadow-none" placeholder="Search transactions..." disabled />
                </div>
                <Button variant="light" className="border shadow-sm d-flex align-items-center gap-2" disabled>
                    <MdFilterList /> Date Range
                </Button>
            </div>

            {/* Table Container following Products.js styling */}
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                <Card.Body className="p-0">
                    <Table responsive hover className="mb-0 align-middle">
                        <thead className="bg-light text-uppercase small" style={{ letterSpacing: '0.5px' }}>
                            <tr>
                                <th className="ps-4">Type</th>
                                <th>Ref ID</th>
                                <th>Account/Entity</th>
                                <th>Category</th>
                                <th>Amount</th>
                                <th className="text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan="6" className="text-center py-5">
                                    <div className="py-5">
                                        <div
                                            className="mb-4 d-inline-flex align-items-center justify-content-center rounded-circle"
                                            style={{
                                                width: '90px',
                                                height: '90px',
                                                backgroundColor: 'rgba(10, 47, 79, 0.05)',
                                                color: 'var(--mainThemeColor)'
                                            }}
                                        >
                                            <MdSwapHoriz size={50} />
                                        </div>
                                        <h4 className="fw-bold" style={{ color: 'var(--mainThemeColor)', fontFamily: 'Montserrat' }}>
                                            Transaction Ledger Coming Soon
                                        </h4>
                                        <p className="text-muted mx-auto" style={{ maxWidth: '500px' }}>
                                            We are building a unified ledger system that will automatically sync
                                            with your billing and procurement to provide a real-time view of your cash flow.
                                        </p>

                                        {/* Upcoming Features Preview */}
                                        <div className="d-flex justify-content-center gap-4 mt-4">
                                            <div className="text-start">
                                                <div className="d-flex align-items-center gap-2 mb-2">
                                                    <MdArrowUpward className="text-success" />
                                                    <span className="small fw-bold">Income Tracking</span>
                                                </div>
                                                <div className="d-flex align-items-center gap-2">
                                                    <MdArrowDownward className="text-danger" />
                                                    <span className="small fw-bold">Expense Logging</span>
                                                </div>
                                            </div>
                                            <div style={{ width: '1px', background: '#dee2e6' }}></div>
                                            <div className="text-start">
                                                <div className="d-flex align-items-center gap-2 mb-2">
                                                    <MdCompareArrows className="text-primary" />
                                                    <span className="small fw-bold">Account Transfers</span>
                                                </div>
                                                <Badge bg="light" text="dark" className="border">V 2.0 Feature</Badge>
                                            </div>
                                        </div>
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

export default Transactions;