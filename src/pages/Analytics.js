import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Spinner, Button, InputGroup } from 'react-bootstrap';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Sector, Legend
} from 'recharts';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { MdTimeline, MdTrendingUp, MdEvent, MdFunctions, MdClear, MdDateRange, MdAnalytics, MdPieChart, MdLayers } from 'react-icons/md';
import { BiSolidCategory } from "react-icons/bi";

// --- Custom Active Shape for the Pie Chart ---
const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;

    return (
        <g>
            {/* Center Text Labels */}
            <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill="#333" style={{ fontSize: '16px', fontWeight: 'bold' }}>
                {payload.name}
            </text>
            <text x={cx} y={cy + 15} dy={8} textAnchor="middle" fill="#6c757d" style={{ fontSize: '14px' }}>
                {`${value} Products`}
            </text>

            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 10}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 12}
                outerRadius={outerRadius + 15}
                fill={fill}
            />
        </g>
    );
};

const Analytics = () => {
    const [loading, setLoading] = useState(true);
    const [rawBills, setRawBills] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [timeFrame, setTimeFrame] = useState('daily');
    const [lastUpdatedRevenue, setLastUpdatedRevenue] = useState('');
    const [lastUpdatedInventory, setLastUpdatedInventory] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [absMinDate, setAbsMinDate] = useState('');
    const [absMaxDate, setAbsMaxDate] = useState('');

    const COLORS = ['#0d6efd', '#198754', '#ffc107', '#fd7e14', '#dc3545', '#6610f2', '#6f42c1'];

    const formatDateLabel = (dateObj) => {
        return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatTimestamp = () => {
        const now = new Date();
        const date = now.toLocaleDateString('en-GB'); // dd/mm/yyyy
        const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }); // AM/PM
        return `${date} at ${time}`;
    };

    const onPieEnter = (_, index) => {
        setActiveIndex(index);
    };

    const processCategoryData = (products) => {
        const counts = {};
        products.forEach(p => {
            if (p.category) {
                counts[p.category] = (counts[p.category] || 0) + 1;
            }
        });
        const formatted = Object.keys(counts).map(key => ({
            name: key,
            value: counts[key]
        }));
        setCategoryData(formatted);
    };

    const processChartData = useCallback((bills, range, start, end) => {
        const aggregation = {};
        const filtered = bills.filter(bill => {
            const billDate = bill.billingDate;
            let matchesDate = true;
            if (start && end) matchesDate = billDate >= start && billDate <= end;
            else if (start) matchesDate = billDate >= start;
            else if (end) matchesDate = billDate <= end;
            return matchesDate;
        });

        filtered.forEach(bill => {
            const date = new Date(bill.billingDate);
            let label;
            if (range === 'daily') label = formatDateLabel(date);
            else if (range === 'weekly') {
                const first = date.getDate() - date.getDay();
                const sunday = new Date(new Date(date).setDate(first));
                label = `Week of ${formatDateLabel(sunday)}`;
            } else if (range === 'monthly') label = date.toLocaleString('default', { month: 'short', year: 'numeric' });
            else if (range === 'yearly') label = date.getFullYear().toString();

            aggregation[label] = (aggregation[label] || 0) + (bill.finalTotal || 0);
        });

        setChartData(Object.keys(aggregation).map(key => ({
            name: key,
            sales: parseFloat(aggregation[key].toFixed(2))
        })));
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Revenue Data
                const billsQuery = query(collection(db, "bills"), orderBy("billingDate", "asc"));
                const billSnapshot = await getDocs(billsQuery);
                const fetchedBills = billSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setRawBills(fetchedBills);
                setLastUpdatedRevenue(formatTimestamp());

                // Fetch Inventory Data
                const productSnapshot = await getDocs(collection(db, "products"));
                const fetchedProducts = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                processCategoryData(fetchedProducts);
                setLastUpdatedInventory(formatTimestamp());

                if (fetchedBills.length > 0) {
                    const min = fetchedBills[0].billingDate;
                    const max = fetchedBills[fetchedBills.length - 1].billingDate;
                    setStartDate(min); setEndDate(max); setAbsMinDate(min); setAbsMaxDate(max);
                    processChartData(fetchedBills, 'daily', min, max);
                }
            } catch (error) {
                console.error("Error fetching analytics:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [processChartData]);

    const handleFilterUpdate = (newTimeFrame, start, end) => {
        processChartData(rawBills, newTimeFrame, start, end);
    };

    const resetFilters = () => {
        setStartDate(absMinDate); setEndDate(absMaxDate); setTimeFrame('daily');
        processChartData(rawBills, 'daily', absMinDate, absMaxDate);
    };

    const totalRevenue = chartData.reduce((acc, curr) => acc + curr.sales, 0);
    const avgSales = totalRevenue / (chartData.length || 1);
    const peakSales = chartData.length > 0 ? Math.max(...chartData.map(d => d.sales)) : 0;

    const totalProducts = categoryData.reduce((acc, curr) => acc + curr.value, 0);
    const topCategory = categoryData.length > 0
        ? [...categoryData].sort((a, b) => b.value - a.value)[0]
        : { name: 'N/A', value: 0 };

    const renderCustomLegend = (props) => {
        const { payload } = props;
        return (
            <div className="ms-4" style={{ width: '320px' }}>
                <Row className="g-2">
                    {payload.map((entry, index) => (
                        <Col xs={6} key={`item-${index}`}>
                            <div className="d-flex align-items-center mb-1">
                                <span
                                    className="badge rounded-pill shadow-sm d-flex align-items-center justify-content-between w-100"
                                    style={{
                                        backgroundColor: entry.color,
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        padding: '5px 8px',
                                        color: '#fff'
                                    }}
                                    title={`${entry.value}: ${entry.payload.value}`}
                                >
                                    {/* Category Name */}
                                    <span className='ms-2' style={{
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        marginRight: '5px'
                                    }}>
                                        {entry.value}
                                    </span>

                                    {/* Product Count Badge */}
                                    <span
                                        className="bg-white text-dark rounded-circle d-flex align-items-center justify-content-center fw-bold"
                                        style={{
                                            minWidth: '20px',
                                            height: '20px',
                                            fontSize: '9px',
                                            padding: '2px'
                                        }}
                                    >
                                        {entry.payload.value}
                                    </span>
                                </span>
                            </div>
                        </Col>
                    ))}
                </Row>
            </div>
        );
    };

    return (
        <Container fluid className="py-4">
            <div className="mb-4">
                <h2 className="pageHeader mb-1">Business Dashboard</h2>
                <p className="text-muted small">Comprehensive analysis of revenue and inventory.</p>
            </div>

            {/* SECTION 1: REVENUE REPORT CARD */}
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-5">
                <Card.Header className="bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                        <MdAnalytics className="text-primary" size={24} />
                        <h5 className="mb-0 fw-bold">Revenue Report</h5>
                    </div>
                    {(startDate !== absMinDate || endDate !== absMaxDate || timeFrame !== 'daily') && (
                        <Button variant="link" size="sm" onClick={resetFilters} className="text-danger text-decoration-none p-0">
                            <MdClear /> Reset View
                        </Button>
                    )}
                </Card.Header>

                <Card.Body className="p-4 bg-light bg-opacity-10">
                    <Row className="g-3 mb-4">
                        <Col lg={5}>
                            <Form.Group>
                                <Form.Label className="small fw-bold text-muted">ANALYSIS PERIOD</Form.Label>
                                <InputGroup size="sm">
                                    <InputGroup.Text className="bg-white"><MdDateRange /></InputGroup.Text>
                                    <Form.Control type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); handleFilterUpdate(timeFrame, e.target.value, endDate); }} />
                                    <InputGroup.Text>to</InputGroup.Text>
                                    <Form.Control type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); handleFilterUpdate(timeFrame, startDate, e.target.value); }} />
                                </InputGroup>
                            </Form.Group>
                        </Col>
                        <Col lg={3}>
                            <Form.Group>
                                <Form.Label className="small fw-bold text-muted">GROUPING</Form.Label>
                                <Form.Select size="sm" value={timeFrame} onChange={(e) => { setTimeFrame(e.target.value); handleFilterUpdate(e.target.value, startDate, endDate); }}>
                                    <option value="daily">Daily View</option>
                                    <option value="weekly">Weekly View</option>
                                    <option value="monthly">Monthly View</option>
                                    <option value="yearly">Yearly View</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="g-3 mb-4">
                        <Col md={4}><SalesStat title="Total Revenue" value={totalRevenue} icon={<MdFunctions />} color="primary" /></Col>
                        <Col md={4}><SalesStat title="Avg Sales/Period" value={avgSales} icon={<MdTrendingUp />} color="success" /></Col>
                        <Col md={4}><SalesStat title="Peak Performance" value={peakSales} icon={<MdEvent />} color="warning" /></Col>
                    </Row>

                    <Card className="border-0 shadow-sm rounded-3 p-3">
                        <div className="d-flex align-items-center mb-3">
                            <MdTimeline className="text-primary me-2" size={20} />
                            <span className="fw-bold small text-uppercase text-muted">Revenue Flow</span>
                        </div>
                        {loading ? <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div> : (
                            <div style={{ width: '100%', height: 350 }}>
                                <ResponsiveContainer>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#bababa" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6c757d' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: '#6c757d' }} tickFormatter={(v) => `₹${v.toLocaleString()}`} axisLine={false} tickLine={false} />
                                        <RechartsTooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        <Line type="linear" dataKey="sales" stroke="#0d6efd" strokeWidth={3} dot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </Card>
                </Card.Body>
                <Card.Footer className="bg-white py-2 px-4 border-top">
                    <small className="text-muted float-end fst-italic">Last Updated: {lastUpdatedRevenue}</small>
                </Card.Footer>
            </Card>

            {/* SECTION 2: INVENTORY DISTRIBUTION CARD */}
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                <Card.Header className="bg-white border-bottom py-3 px-4">
                    <div className="d-flex align-items-center gap-2">
                        <MdPieChart className="text-success" size={24} />
                        <h5 className="mb-0 fw-bold">Inventory Distribution</h5>
                    </div>
                </Card.Header>

                <Card.Body className="p-4 bg-light bg-opacity-10">
                    <Row className="g-4">
                        <Col md={4} lg={3}>
                            <div className="d-flex flex-column gap-3 h-100">
                                <InventoryStat title="Total Items" value={totalProducts} subtitle="In catalog" icon={<MdLayers />} color="danger" />
                                <InventoryStat title="Categories" value={categoryData.length} subtitle="Product groups" icon={<BiSolidCategory />} color="success" />
                                <InventoryStat title="Top Category" value={topCategory.name} subtitle={`${topCategory.value} Items`} icon={<MdTrendingUp />} color="primary" isNumeric={false} />
                            </div>
                        </Col>

                        <Col md={8} lg={9}>
                            <Card className="border-0 shadow-sm rounded-3 p-3 h-100">
                                <div className="d-flex align-items-center mb-2">
                                    <MdPieChart className="text-primary me-2" size={20} />
                                    <span className="fw-bold small text-uppercase text-muted">Category Spread</span>
                                </div>
                                {loading ? <div className="text-center py-5"><Spinner animation="border" variant="success" /></div> : (
                                    <div style={{ width: '100%', height: 420 }}>
                                        <ResponsiveContainer>
                                            <PieChart margin={{ right: 80 }}>
                                                <Pie
                                                    activeIndex={activeIndex}
                                                    activeShape={renderActiveShape}
                                                    data={categoryData}
                                                    innerRadius={80}
                                                    outerRadius={130}
                                                    paddingAngle={8}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    onMouseEnter={onPieEnter}
                                                >
                                                    {categoryData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Legend
                                                    verticalAlign="middle"
                                                    align="right"
                                                    layout="vertical"
                                                    content={renderCustomLegend}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </Card>
                        </Col>
                    </Row>
                </Card.Body>
                <Card.Footer className="bg-white py-2 px-4 border-top">
                    <small className="text-muted float-end fst-italic">Last Updated: {lastUpdatedInventory}</small>
                </Card.Footer>
            </Card>
        </Container>
    );
};

// Main Stat Card Component
const SalesStat = ({ title, value, icon, color }) => (
    <Card className="border-0 shadow-sm rounded-3 p-3 bg-white h-100">
        <div className="d-flex align-items-center justify-content-between">
            <div>
                <div className="small text-muted text-uppercase fw-bold mb-1" style={{ fontSize: '0.75rem' }}>{title}</div>
                <h4 className="fw-bold text-dark mb-0">₹{value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h4>
            </div>
            <div className={`bg-${color} fs-3 bg-opacity-10 p-2 rounded-circle d-flex justify-content-center align-items-center text-${color}`}>{icon}</div>
        </div>
    </Card>
);

// Vertical Stat Card Component (Inventory)
const InventoryStat = ({ title, value, subtitle, icon, color, isNumeric = true }) => (
    <Card className="border-0 shadow-sm rounded-3 p-3 bg-white hover-lift transition-all overflow-hidden">
        <div className="d-flex align-items-center">
            <div className={`rounded-3 d-flex align-items-center justify-content-center bg-${color} bg-opacity-10 text-${color} flex-shrink-0`} style={{ width: '52px', height: '52px', fontSize: '1.4rem' }}>
                {icon}
            </div>
            <div className="ms-3 flex-grow-1">
                <div className="text-secondary text-uppercase fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.04em' }}>{title}</div>
                <h4 className="fw-bold mb-3 me-2" style={{ color: '#1a1d23', lineHeight: '1.2' }}>{isNumeric ? value.toLocaleString() : value}</h4>
                <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '-2px' }}>{subtitle}</div>
            </div>
        </div>
    </Card>
);

export default Analytics;