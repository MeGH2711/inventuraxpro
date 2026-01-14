import React from 'react';
import { Container, Row, Col, Card, ProgressBar } from 'react-bootstrap';
import { MdTimeline, MdInsights, MdPieChart, MdTrendingUp, MdPrecisionManufacturing } from 'react-icons/md';

const Analytics = () => {
    return (
        <Container fluid className="py-4">
            {/* Header section using global pageHeader class */}
            <div className="mb-4">
                <h2 className="pageHeader mb-1">Advanced Analytics</h2>
                <p className="text-muted small mb-0">Deep dive into your business performance metrics.</p>
            </div>

            <Row className="justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <Col lg={8} className="text-center">
                    {/* Visual Icon Stack */}
                    <div className="position-relative mb-5">
                        <div className="display-1 text-primary opacity-10 position-absolute top-50 start-50 translate-middle">
                            <MdTimeline size={200} />
                        </div>
                        <MdInsights size={80} style={{ color: 'var(--mainThemeColor)' }} className="position-relative" />
                    </div>

                    <h3 className="fw-bold mb-3" style={{ color: 'var(--mainThemeColor)', fontFamily: 'Montserrat' }}>
                        Intelligence Dashboard is Under Construction
                    </h3>
                    <p className="text-muted mx-auto mb-4" style={{ maxWidth: '600px' }}>
                        We are engineering a comprehensive suite of data visualization tools.
                        Soon, you'll be able to forecast demand, analyze customer behavior, and
                        optimize your inventory turnover with AI-driven insights.
                    </p>

                    {/* Progress indicator using theme colors */}
                    <div className="mx-auto mb-5" style={{ maxWidth: '400px' }}>
                        <div className="d-flex justify-content-between mb-2 small fw-bold text-muted">
                            <span>DEVELOPMENT PROGRESS</span>
                            <span>75%</span>
                        </div>
                        <ProgressBar
                            now={75}
                            style={{ height: '8px', borderRadius: '4px', backgroundColor: 'rgba(10, 47, 79, 0.1)' }}
                        />
                    </div>

                    {/* Feature Preview Grid */}
                    <Row className="g-3">
                        <Col md={4}>
                            <Card className="border-0 shadow-sm py-3 rounded-4 bg-white">
                                <MdPieChart className="mx-auto mb-2 text-warning" size={30} />
                                <div className="small fw-bold">Category Distribution</div>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="border-0 shadow-sm py-3 rounded-4 bg-white">
                                <MdTrendingUp className="mx-auto mb-2 text-success" size={30} />
                                <div className="small fw-bold">Sales Forecasting</div>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="border-0 shadow-sm py-3 rounded-4 bg-white">
                                <MdPrecisionManufacturing className="mx-auto mb-2 text-info" size={30} />
                                <div className="small fw-bold">Profitability Heatmaps</div>
                            </Card>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </Container>
    );
};

export default Analytics;