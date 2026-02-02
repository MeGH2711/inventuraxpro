// React
import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Bootstrap
import { Container, Row, Col, Card, Form, Spinner, Button, InputGroup, Table } from 'react-bootstrap';

// Charts
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Sector, Legend, BarChart, Bar
} from 'recharts';

// Firebase
import { db } from '../firebaseConfig';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

// Icons
import {
    MdTimeline, MdTrendingUp, MdEvent, MdFunctions, MdClear,
    MdDateRange, MdAnalytics, MdPieChart, MdLayers, MdBarChart,
    MdTableRows, MdReceipt
} from 'react-icons/md';
import { BiSolidCategory } from "react-icons/bi";

// Global Constants & Static Helpers
const COLORS = ['#0d6efd', '#198754', '#ffc107', '#fd7e14', '#dc3545', '#6610f2', '#6f42c1'];

const formatDateLabel = (dateObj) => {
    return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTimestamp = () => {
    const now = new Date();
    const date = now.toLocaleDateString('en-GB');
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${date} at ${time}`;
};

const timeFrameLabels = {
    daily: 'Day',
    weekly: 'Week',
    monthly: 'Month',
    yearly: 'Year'
};

const Analytics = () => {
    // --- 1. SHARED STATE ---
    const [loading, setLoading] = useState(true);
    const [rawBills, setRawBills] = useState([]);

    const [products, setProducts] = useState([]);

    // --- 2. REVENUE REPORT STATE & LOGIC ---
    const [chartData, setChartData] = useState([]);
    const [timeFrame, setTimeFrame] = useState('daily');
    const [viewMode, setViewMode] = useState('chart');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [absMinDate, setAbsMinDate] = useState('');
    const [absMaxDate, setAbsMaxDate] = useState('');
    const [lastUpdatedRevenue, setLastUpdatedRevenue] = useState('');

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

    const handleFilterUpdate = (newTimeFrame, start, end) => {
        processChartData(rawBills, newTimeFrame, start, end);
    };

    const resetFilters = () => {
        setStartDate(absMinDate); setEndDate(absMaxDate); setTimeFrame('daily');
        processChartData(rawBills, 'daily', absMinDate, absMaxDate);
    };

    // Revenue Derived Metrics
    const totalRevenue = chartData.reduce((acc, curr) => acc + curr.sales, 0);
    const avgSales = totalRevenue / (chartData.length || 1);
    const peakSales = chartData.length > 0 ? Math.max(...chartData.map(d => d.sales)) : 0;

    // --- 3. INVENTORY DISTRIBUTION STATE & LOGIC ---
    const [categoryData, setCategoryData] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [lastUpdatedInventory, setLastUpdatedInventory] = useState('');
    const [categoryViewMode, setCategoryViewMode] = useState('chart');

    const processCategoryData = useCallback((products) => {
        const counts = {};
        products.forEach(p => {
            if (p.category) counts[p.category] = (counts[p.category] || 0) + 1;
        });
        const formatted = Object.keys(counts).map(key => ({
            name: key,
            value: counts[key]
        }));
        setCategoryData(formatted);
    }, []);

    const onPieEnter = (_, index) => setActiveIndex(index);

    // Inventory Derived Metrics
    const totalProducts = categoryData.reduce((acc, curr) => acc + curr.value, 0);
    const topCategory = categoryData.length > 0
        ? [...categoryData].sort((a, b) => b.value - a.value)[0]
        : { name: 'N/A', value: 0 };

    // --- 4. PRODUCT SALES ANALYTICS STATE & LOGIC ---
    const [productSalesData, setProductSalesData] = useState([]);
    const [productViewMode, setProductViewMode] = useState('chart');
    const [selectedProduct, setSelectedProduct] = useState('');
    const [productTimeFrame, setProductTimeFrame] = useState('daily');
    const [allProductNames, setAllProductNames] = useState([]);
    const [productStartDate, setProductStartDate] = useState('');
    const [productEndDate, setProductEndDate] = useState('');
    const [productMinDate, setProductMinDate] = useState('');
    const [productMaxDate, setProductMaxDate] = useState('');

    const getTopSellingProduct = useCallback((bills) => {
        const productTotals = {};
        bills.forEach(bill => {
            bill.products?.forEach(p => {
                if (!p.name) return;
                productTotals[p.name] = (productTotals[p.name] || 0) + (p.quantity || 0);
            });
        });
        let topProduct = '';
        let maxQty = 0;
        Object.entries(productTotals).forEach(([name, qty]) => {
            if (qty > maxQty) {
                maxQty = qty;
                topProduct = name;
            }
        });
        return topProduct;
    }, []);

    const processProductSalesData = useCallback((bills, productName, range, start, end) => {
        const aggregation = {};
        bills.forEach(bill => {
            const billDate = bill.billingDate;
            let matchesDate = true;
            if (start && end) matchesDate = billDate >= start && billDate <= end;
            else if (start) matchesDate = billDate >= start;
            else if (end) matchesDate = billDate <= end;

            if (!matchesDate) return;

            const date = new Date(billDate);
            let label;
            if (range === 'daily') label = formatDateLabel(date);
            else if (range === 'weekly') {
                const first = date.getDate() - date.getDay();
                const sunday = new Date(new Date(date).setDate(first));
                label = `Week of ${formatDateLabel(sunday)}`;
            } else if (range === 'monthly') label = date.toLocaleString('default', { month: 'short', year: 'numeric' });
            else if (range === 'yearly') label = date.getFullYear().toString();

            bill.products?.forEach(p => {
                if (p.name === productName) {
                    aggregation[label] = (aggregation[label] || 0) + (p.quantity || 0);
                }
            });
        });
        setProductSalesData(Object.keys(aggregation).map(key => ({ name: key, quantity: aggregation[key] })));
    }, []);

    // Pagination state for Top Selling Products chart
    const [topProductsIndex, setTopProductsIndex] = useState(0);
    const pageSize = 10;

    const [topProductsStartDate, setTopProductsStartDate] = useState('');
    const [topProductsEndDate, setTopProductsEndDate] = useState('');

    const [topProductsViewMode, setTopProductsViewMode] = useState('chart');

    const [topProductsCategory, setTopProductsCategory] = useState('All');

    const allTopProducts = useMemo(() => {
        const productMap = {};

        // 1. Populate the map to fix the 'unused-vars' warning 
        // This also speeds up lookup from O(N) to O(1)
        const nameToCategoryMap = {};
        products.forEach(p => {
            nameToCategoryMap[p.name] = p.category;
        });

        // 2. Filter bills by date
        const filteredBills = rawBills.filter(bill => {
            const billDate = bill.billingDate;
            return (!topProductsStartDate || billDate >= topProductsStartDate) &&
                (!topProductsEndDate || billDate <= topProductsEndDate);
        });

        // 3. Aggregate product quantities
        filteredBills.forEach(bill => {
            bill.products?.forEach(p => {
                if (p.name) {
                    // Use the map here instead of .find()
                    const category = nameToCategoryMap[p.name] || 'Uncategorized';
                    const matchesCategory = topProductsCategory === 'All' || category === topProductsCategory;

                    if (matchesCategory) {
                        productMap[p.name] = (productMap[p.name] || 0) + (p.quantity || 0);
                    }
                }
            });
        });

        return Object.entries(productMap)
            .map(([name, quantity]) => ({ name, quantity }))
            .sort((a, b) => b.quantity - a.quantity);
    }, [rawBills, topProductsStartDate, topProductsEndDate, topProductsCategory, products]);

    const visibleTopProducts = allTopProducts.slice(topProductsIndex, topProductsIndex + pageSize);

    const CustomBarTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 shadow-lg rounded-4 border-0" style={{ minWidth: '180px' }}>
                    <p className="text-uppercase fw-bold text-muted mb-0" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>
                        Product Details
                    </p>
                    <div className="d-flex align-items-center justify-content-between mb-1">
                        <div className="gap-2">
                            <div className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: payload[0].fill }}></div>
                            <span className="fw-medium text-dark small">{payload[0].payload.name}</span>
                        </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mt-1">
                        <span className="text-muted small">Units Sold:</span>
                        <span className="fw-bold text-primary fs-5">
                            {payload[0].value.toLocaleString()}
                        </span>
                    </div>
                </div>
            );
        }
        return null;
    };

    const [paymentModeData, setPaymentModeData] = useState([]);
    const [paymentActiveIndex, setPaymentActiveIndex] = useState(0);
    const [paymentViewMode, setPaymentViewMode] = useState('chart');

    const processPaymentData = useCallback((bills) => {
        const counts = {};
        bills.forEach(bill => {
            const mode = bill.modeOfPayment || 'Unknown';
            counts[mode] = (counts[mode] || 0) + 1;
        });

        const formatted = Object.keys(counts).map(key => ({
            name: key,
            value: counts[key]
        }));
        setPaymentModeData(formatted);
    }, []);

    const onPaymentPieEnter = (_, index) => setPaymentActiveIndex(index);

    const totalTransactions = paymentModeData.reduce((acc, curr) => acc + curr.value, 0);
    const topPaymentMode = paymentModeData.length > 0
        ? [...paymentModeData].sort((a, b) => b.value - a.value)[0]
        : { name: 'N/A', value: 0 };

    // Product Derived Metrics
    const totalQtySold = productSalesData.reduce((acc, curr) => acc + curr.quantity, 0);
    const avgQtyPerPeriod = totalQtySold / (productSalesData.length || 1);
    const peakQty = productSalesData.length > 0 ? Math.max(...productSalesData.map(d => d.quantity)) : 0;
    const bestSellerName = getTopSellingProduct(rawBills);

    const resetProductFilters = () => {
        setProductStartDate(productMinDate);
        setProductEndDate(productMaxDate);
        setProductTimeFrame('daily');
    };

    const isProductFilterActive =
        productStartDate !== productMinDate ||
        productEndDate !== productMaxDate ||
        productTimeFrame !== 'daily';

    // --- 5. DATA FETCHING & SYNC ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Bills
                const billsQuery = query(collection(db, "bills"), orderBy("billingDate", "asc"));
                const billSnapshot = await getDocs(billsQuery);
                const fetchedBills = billSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setRawBills(fetchedBills);

                if (fetchedBills.length > 0) {
                    const min = fetchedBills[0].billingDate;
                    const max = fetchedBills[fetchedBills.length - 1].billingDate;

                    // Setup Revenue Filters
                    setStartDate(min); setEndDate(max); setAbsMinDate(min); setAbsMaxDate(max);
                    processChartData(fetchedBills, 'daily', min, max);

                    // Setup Product Filters
                    setProductStartDate(min); setProductEndDate(max);
                    setProductMinDate(min); setProductMaxDate(max);

                    // Extract Metadata
                    const names = new Set();
                    fetchedBills.forEach(b => b.products?.forEach(p => p.name && names.add(p.name)));
                    setAllProductNames([...names]);

                    const top = getTopSellingProduct(fetchedBills);
                    if (top) setSelectedProduct(top);

                    processPaymentData(fetchedBills);

                    setTopProductsStartDate(min);
                    setTopProductsEndDate(max);
                }
                setLastUpdatedRevenue(formatTimestamp());

                const productSnapshot = await getDocs(collection(db, "products"));
                const fetchedProducts = productSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setProducts(fetchedProducts);
                processCategoryData(fetchedProducts);
                setLastUpdatedInventory(formatTimestamp());

            } catch (error) {
                console.error("Error fetching analytics:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [processChartData, processCategoryData, getTopSellingProduct, processPaymentData]);

    useEffect(() => {
        if (selectedProduct) {
            processProductSalesData(rawBills, selectedProduct, productTimeFrame, productStartDate, productEndDate);
        }
    }, [selectedProduct, productTimeFrame, productStartDate, productEndDate, rawBills, processProductSalesData]);

    // --- 5. MARKET BASKET ANALYSIS (Frequently Bought Together) ---
    const crossSellData = useMemo(() => {
        const pairCounts = {};

        rawBills.forEach(bill => {
            const items = bill.products?.map(p => p.name).filter(Boolean) || [];
            if (items.length < 2) return;

            // Create unique pairs (A + B)
            for (let i = 0; i < items.length; i++) {
                for (let j = i + 1; j < items.length; j++) {
                    // Sort names alphabetically so (Bread, Milk) is the same as (Milk, Bread)
                    const pair = [items[i], items[j]].sort();
                    const pairKey = pair.join(' + ');
                    pairCounts[pairKey] = (pairCounts[pairKey] || 0) + 1;
                }
            }
        });

        return Object.entries(pairCounts)
            .map(([pair, count]) => ({ pair, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Top 10 pairings
    }, [rawBills]);

    // --- 6. RENDER HELPERS ---
    const renderActiveShape = (props) => {
        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#f8f9fa' : '#333';
        const subTextColor = isDark ? '#a0aab4' : '#6c757d';

        return (
            <g>
                <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill={textColor} style={{ fontSize: '16px', fontWeight: 'bold' }}>{payload.name}</text>
                <text x={cx} y={cy + 15} dy={8} textAnchor="middle" fill={subTextColor} style={{ fontSize: '14px' }}>{`${value} Products`}</text>
                <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 10} startAngle={startAngle} endAngle={endAngle} fill={fill} />
                <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 12} outerRadius={outerRadius + 15} fill={fill} />
            </g>
        );
    };

    const renderCustomLegend = (props) => {
        const { payload } = props;
        return (
            <div className="ms-4" style={{ width: '320px' }}>
                <Row className="g-2">
                    {payload.map((entry, index) => (
                        <Col xs={6} key={`item-${index}`}>
                            <div className="d-flex align-items-center mb-1">
                                <span className="badge rounded-pill shadow-sm d-flex align-items-center justify-content-between w-100"
                                    style={{ backgroundColor: entry.color, fontSize: '12px', fontWeight: '600', padding: '5px 8px', color: '#fff' }}>
                                    <span className='ms-2' style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '5px' }}>{entry.value}</span>
                                    <span className="bg-white text-dark rounded-circle d-flex align-items-center justify-content-center fw-bold"
                                        style={{ minWidth: '20px', height: '20px', fontSize: '9px', padding: '2px' }}>{entry.payload.value}</span>
                                </span>
                            </div>
                        </Col>
                    ))}
                </Row>
            </div>
        );
    };

    const CustomRevenueTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 shadow-lg rounded-4 border-0" style={{ minWidth: '180px' }}>
                    <p className="text-uppercase fw-bold text-muted mb-2" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>
                        {label}
                    </p>
                    <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center justify-content-center gap-2">
                            <div className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: '#0d6efd' }}></div>
                            <span className="fw-medium text-dark small">Revenue</span>
                        </div>
                        <span className="fw-bold text-primary fs-5">
                            ₹{payload[0].value.toLocaleString('en-IN')}
                        </span>
                    </div>
                    <div className="mt-2 pt-2 border-top border-light">
                        <small className="text-muted" style={{ fontSize: '9px' }}>Net Earnings</small>
                    </div>
                </div>
            );
        }
        return null;
    };

    const CustomProductTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 shadow-lg rounded-4 border-0" style={{ minWidth: '150px' }}>
                    <p className="text-uppercase fw-bold text-muted mb-2" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>
                        {label}
                    </p>
                    <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                            <div className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: '#f59f00' }}></div>
                            <span className="fw-medium text-dark small">Quantity Sold</span>
                        </div>
                        <span className="fw-bold text-dark fs-5">{payload[0].value}</span>
                    </div>
                    <div className="mt-2 pt-2 border-top border-light">
                        <small className="text-muted" style={{ fontSize: '9px' }}>Units move</small>
                    </div>
                </div>
            );
        }
        return null;
    };

    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const axisColor = isDark ? '#a0aab4' : '#6c757d';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : '#bababa';

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
                        <Col md={4}><SalesStat title={`Avg Sales/${timeFrameLabels[timeFrame]}`} value={avgSales} icon={<MdTrendingUp />} color="success" /></Col>
                        <Col md={4}><SalesStat title="Peak Performance" value={peakSales} icon={<MdEvent />} color="warning" /></Col>
                    </Row>
                    <Card className="border-0 shadow-sm rounded-3 p-3">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <div className="d-flex align-items-center"><MdTimeline className="text-primary me-2" size={20} /><span className="fw-bold small text-uppercase text-muted">Revenue Flow</span></div>
                            <div className="btn-group shadow-sm" role="group">
                                <Button variant={viewMode === 'chart' ? 'primary' : 'outline-primary'} size="sm" onClick={() => setViewMode('chart')} className="d-flex align-items-center gap-1"><MdBarChart /> Chart</Button>
                                <Button variant={viewMode === 'table' ? 'primary' : 'outline-primary'} size="sm" onClick={() => setViewMode('table')} className="d-flex align-items-center gap-1"><MdTableRows /> Table</Button>
                            </div>
                        </div>
                        {loading ? <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div> : (
                            viewMode === 'chart' ? (
                                <div style={{ width: '100%', height: '420px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 11, fill: axisColor }} tickFormatter={(v) => `₹${v.toLocaleString()}`} axisLine={false} tickLine={false} />
                                            <RechartsTooltip
                                                content={<CustomRevenueTooltip />}
                                                cursor={{ stroke: '#0d6efd', strokeWidth: 1, strokeDasharray: '4 4' }}
                                            />
                                            <Line type="linear" dataKey="sales" stroke="#0d6efd" strokeWidth={3} dot={{ r: 4 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div style={{ height: 350, overflowY: 'auto' }}>
                                    <Table hover responsive className="align-middle border-light">
                                        <thead className="bg-light sticky-top">
                                            <tr className='text-center'>
                                                <th className="small text-muted border-0">{timeFrameLabels[timeFrame]}</th>
                                                <th className="small text-muted border-0">Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {chartData.map((row, idx) => (
                                                <tr className='text-center' key={idx}>
                                                    <td className="fw-medium">{row.name}</td>
                                                    <td className="fw-bold text-primary">₹{row.sales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )
                        )}
                    </Card>
                </Card.Body>
                <Card.Footer className="bg-white py-2 px-4 border-top">
                    <small className="text-muted float-end fst-italic">Last Updated: {lastUpdatedRevenue}</small>
                </Card.Footer>
            </Card>

            {/* SECTION 2: INVENTORY DISTRIBUTION CARD */}
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-5">
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
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <div className="d-flex align-items-center">
                                        <MdPieChart className="text-primary me-2" size={20} />
                                        <span className="fw-bold small text-uppercase text-muted">Category Spread</span>
                                    </div>
                                    {/* Toggle Buttons */}
                                    <div className="btn-group shadow-sm" role="group">
                                        <Button
                                            variant={categoryViewMode === 'chart' ? 'success' : 'outline-success'}
                                            size="sm"
                                            onClick={() => setCategoryViewMode('chart')}
                                            className="d-flex align-items-center gap-1"
                                        >
                                            <MdPieChart /> Chart
                                        </Button>
                                        <Button
                                            variant={categoryViewMode === 'table' ? 'success' : 'outline-success'}
                                            size="sm"
                                            onClick={() => setCategoryViewMode('table')}
                                            className="d-flex align-items-center gap-1"
                                        >
                                            <MdTableRows /> Table
                                        </Button>
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="text-center py-5"><Spinner animation="border" variant="success" /></div>
                                ) : (
                                    categoryViewMode === 'chart' ? (
                                        /* --- Existing Pie Chart Code --- */
                                        <div style={{ width: '100%', height: '420px' }}>
                                            <ResponsiveContainer width="100%" height="100%">
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
                                                    <Legend verticalAlign="middle" align="right" layout="vertical" content={renderCustomLegend} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        /* --- New Table View --- */
                                        <div style={{ height: 420, overflowY: 'auto' }}>
                                            <Table hover responsive className="align-middle border-light">
                                                <thead className="bg-light sticky-top" style={{ zIndex: 1 }}>
                                                    <tr className="text-center">
                                                        <th className="small text-muted border-0">Category Name</th>
                                                        <th className="small text-muted border-0">Product Count</th>
                                                        <th className="small text-muted border-0">Share (%)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {categoryData.map((row, idx) => {
                                                        const percentage = ((row.value / totalProducts) * 100).toFixed(1);
                                                        return (
                                                            <tr className="text-center" key={idx}>
                                                                <td className="fw-medium text-start ps-4">
                                                                    <span
                                                                        className="d-inline-block rounded-circle me-2"
                                                                        style={{ width: '10px', height: '10px', backgroundColor: COLORS[idx % COLORS.length] }}
                                                                    ></span>
                                                                    {row.name}
                                                                </td>
                                                                <td className="fw-bold">{row.value} Items</td>
                                                                <td>
                                                                    <div className="d-flex align-items-center justify-content-center gap-2">
                                                                        <div className="progress w-50" style={{ height: '6px' }}>
                                                                            <div
                                                                                className="progress-bar"
                                                                                role="progressbar"
                                                                                style={{ width: `${percentage}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                                                                            ></div>
                                                                        </div>
                                                                        <span className="small text-muted">{percentage}%</span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )
                                )}
                            </Card>
                        </Col>
                    </Row>
                </Card.Body>
                <Card.Footer className="bg-white py-2 px-4 border-top">
                    <small className="text-muted float-end fst-italic">Last Updated: {lastUpdatedInventory}</small>
                </Card.Footer>
            </Card>

            {/* SECTION 3: PRODUCT SALES ANALYTICS */}
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-5">
                <Card.Header className="bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                        <MdTrendingUp className="text-warning" size={24} />
                        <h5 className="mb-0 fw-bold">Product Sales Analytics</h5>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        {isProductFilterActive && (
                            <Button variant="link" size="sm" onClick={resetProductFilters} className="text-danger text-decoration-none p-0">
                                <MdClear /> Reset View
                            </Button>
                        )}
                    </div>
                </Card.Header>
                <Card.Body className="p-4 bg-light bg-opacity-10">
                    <Row className="g-3 mb-4">
                        {/* ... stats columns stay the same ... */}
                        <Col md={3}><InventoryStat title="Best Seller" value={bestSellerName || 'N/A'} subtitle="Overall top performer" icon={<MdTrendingUp />} color="success" isNumeric={false} /></Col>
                        <Col md={3}><InventoryStat title="Total Units Sold" value={totalQtySold} subtitle={`For ${selectedProduct || 'selected item'}`} icon={<MdFunctions />} color="warning" /></Col>
                        <Col md={3}><InventoryStat title={`Avg Units / ${productTimeFrame}`} value={avgQtyPerPeriod.toFixed(1)} subtitle={`Sales velocity for ${selectedProduct || 'selected item'}`} icon={<MdTrendingUp />} color="info" /></Col>
                        <Col md={3}><InventoryStat title="Peak Demand" value={peakQty} subtitle={`Max units in ${productTimeFrame} for ${selectedProduct || 'selected item'}`} icon={<MdEvent />} color="danger" /></Col>
                    </Row>

                    <Row className="g-3 mb-4">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="small fw-bold text-muted">SELECT PRODUCT</Form.Label>
                                <Form.Select size="sm" value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
                                    {allProductNames.map((p, i) => (<option key={i} value={p}>{p}</option>))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="small fw-bold text-muted">DATE RANGE</Form.Label>
                                <InputGroup size="sm">
                                    <Form.Control type="date" min={productMinDate} max={productMaxDate} value={productStartDate} onChange={(e) => setProductStartDate(e.target.value)} />
                                    <InputGroup.Text>to</InputGroup.Text>
                                    <Form.Control type="date" min={productMinDate} max={productMaxDate} value={productEndDate} onChange={(e) => setProductEndDate(e.target.value)} />
                                </InputGroup>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="small fw-bold text-muted">GROUP BY</Form.Label>
                                <Form.Select size="sm" value={productTimeFrame} onChange={(e) => setProductTimeFrame(e.target.value)}>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Card className="border-0 shadow-sm rounded-3 p-3">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <div className="d-flex align-items-center">
                                <MdTimeline className="text-warning me-2" size={20} />
                                <span className="fw-bold small text-uppercase text-muted">Quantity Sold Over Time</span>
                            </div>
                            {/* NEW TOGGLE BUTTONS */}
                            <div className="btn-group shadow-sm" role="group">
                                <Button
                                    variant={productViewMode === 'chart' ? 'warning' : 'outline-warning'}
                                    size="sm"
                                    onClick={() => setProductViewMode('chart')}
                                    className="d-flex align-items-center gap-1"
                                >
                                    <MdBarChart /> Chart
                                </Button>
                                <Button
                                    variant={productViewMode === 'table' ? 'warning' : 'outline-warning'}
                                    size="sm"
                                    onClick={() => setProductViewMode('table')}
                                    className="d-flex align-items-center gap-1"
                                >
                                    <MdTableRows /> Table
                                </Button>
                            </div>
                        </div>

                        {selectedProduct ? (
                            productViewMode === 'chart' ? (
                                <div style={{ width: '100%', height: '420px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={productSalesData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <RechartsTooltip
                                                content={<CustomProductTooltip />}
                                                cursor={{ stroke: '#f59f00', strokeWidth: 1, strokeDasharray: '4 4' }}
                                            />
                                            <Line type="linear" dataKey="quantity" stroke="#f59f00" strokeWidth={3} dot={{ r: 4 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div style={{ height: 350, overflowY: 'auto' }}>
                                    <Table hover responsive className="align-middle border-light">
                                        <thead className="bg-light sticky-top">
                                            <tr className='text-center'>
                                                <th className="small text-muted border-0">{timeFrameLabels[productTimeFrame]}</th>
                                                <th className="small text-muted border-0">Quantity Sold</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {productSalesData.map((row, idx) => (
                                                <tr className='text-center' key={idx}>
                                                    <td className="fw-medium">{row.name}</td>
                                                    <td className="fw-bold text-warning">{row.quantity.toLocaleString()} Units</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )
                        ) : <div className="text-center py-5 text-muted">Select a product to view analytics</div>}
                    </Card>
                </Card.Body>
                <Card.Footer className="bg-white py-2 px-4 border-top">
                    <small className="text-muted float-end fst-italic">Last Updated: {lastUpdatedRevenue}</small>
                </Card.Footer>
            </Card>

            {/* SECTION 4: TOP SELLING PRODUCTS BAR CHART */}
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-5">
                <Card.Header className="bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                        <MdBarChart className="text-danger" size={24} />
                        <h5 className="mb-0 fw-bold">Top Selling Products</h5>
                    </div>
                    {/* Reset Button for Top Products */}
                    {(topProductsStartDate !== absMinDate || topProductsEndDate !== absMaxDate) && (
                        <Button
                            variant="link" size="sm" className="text-danger text-decoration-none p-0"
                            onClick={() => { setTopProductsStartDate(absMinDate); setTopProductsEndDate(absMaxDate); }}
                        >
                            <MdClear /> Reset Dates
                        </Button>
                    )}
                </Card.Header>

                <Card.Body className="p-4 bg-light bg-opacity-10">
                    <Row className="g-3 mb-4">
                        <Col md={4}>
                            <InventoryStat
                                title="Top Performer"
                                value={allTopProducts[0]?.name || 'N/A'}
                                subtitle="Highest volume item"
                                icon={<MdTrendingUp />}
                                color="danger"
                                isNumeric={false}
                            />
                        </Col>
                        <Col md={4}>
                            <InventoryStat
                                title="Top Seller Volume"
                                value={allTopProducts[0]?.quantity || 0}
                                subtitle="Units sold by leader"
                                icon={<MdFunctions />}
                                color="primary"
                            />
                        </Col>
                        <Col md={4}>
                            <InventoryStat
                                title="Market Depth"
                                value={allTopProducts.length}
                                subtitle="Total unique items sold"
                                icon={<MdLayers />}
                                color="success"
                            />
                        </Col>
                    </Row>

                    <Row className="g-3 mb-4">
                        {/* Date Range Filter (From previous step) */}
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="small fw-bold text-muted">DATE RANGE</Form.Label>
                                <InputGroup size="sm">
                                    <Form.Control type="date" value={topProductsStartDate} onChange={(e) => setTopProductsStartDate(e.target.value)} />
                                    <InputGroup.Text>to</InputGroup.Text>
                                    <Form.Control type="date" value={topProductsEndDate} onChange={(e) => setTopProductsEndDate(e.target.value)} />
                                </InputGroup>
                            </Form.Group>
                        </Col>

                        {/* NEW: Category Filter */}
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="small fw-bold text-muted">CATEGORY</Form.Label>
                                <Form.Select
                                    size="sm"
                                    value={topProductsCategory}
                                    onChange={(e) => setTopProductsCategory(e.target.value)}
                                >
                                    <option value="All">All Categories</option>
                                    {categoryData.map((cat, i) => (
                                        <option key={i} value={cat.name}>{cat.name}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Card className="border-0 shadow-sm rounded-3 p-3">
                        {/* --- HEADER AREA: Always Visible --- */}
                        <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
                            <div className="d-flex align-items-center">
                                <MdTrendingUp className="text-danger me-2" size={20} />
                                <span className="fw-bold small text-uppercase text-muted">Best Sellers by Quantity</span>
                            </div>

                            <div className="d-flex flex-wrap align-items-center gap-3">
                                {/* 1. View Toggle Buttons */}
                                <div className="btn-group shadow-sm" role="group">
                                    <Button
                                        variant={topProductsViewMode === 'chart' ? 'danger' : 'outline-danger'}
                                        size="sm"
                                        onClick={() => setTopProductsViewMode('chart')}
                                    >
                                        <MdBarChart /> Chart
                                    </Button>
                                    <Button
                                        variant={topProductsViewMode === 'table' ? 'danger' : 'outline-danger'}
                                        size="sm"
                                        onClick={() => setTopProductsViewMode('table')}
                                    >
                                        <MdTableRows /> Table
                                    </Button>
                                </div>

                                {/* 2. Pagination Controls (Moved here to stay visible) */}
                                <div className="d-flex align-items-center gap-2 bg-light p-1 rounded-2 border">
                                    <span className="text-muted fw-medium px-2" style={{ fontSize: '0.75rem' }}>
                                        {topProductsIndex + 1}-{Math.min(topProductsIndex + pageSize, allTopProducts.length)} of {allTopProducts.length}
                                    </span>
                                    <div className="btn-group">
                                        <Button
                                            variant="white"
                                            size="sm"
                                            className="border-0"
                                            disabled={topProductsIndex === 0}
                                            onClick={() => setTopProductsIndex(prev => Math.max(0, prev - pageSize))}
                                        >
                                            ‹
                                        </Button>
                                        <Button
                                            variant="white"
                                            size="sm"
                                            className="border-0 border-start"
                                            disabled={topProductsIndex + pageSize >= allTopProducts.length}
                                            onClick={() => setTopProductsIndex(prev => prev + pageSize)}
                                        >
                                            ›
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- CONTENT AREA: Switches based on state --- */}
                        {loading ? (
                            <div className="text-center py-5"><Spinner animation="border" variant="danger" /></div>
                        ) : (
                            topProductsViewMode === 'chart' ? (
                                <div style={{ width: '100%', height: '420px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={visibleTopProducts} margin={{ top: 10, right: 30, left: 20, bottom: 60 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                            <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" tick={{ fontSize: 11 }} height={80} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                            <RechartsTooltip cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }} content={<CustomBarTooltip />} />
                                            <Bar dataKey="quantity" radius={[4, 4, 0, 0]} barSize={40}>
                                                {visibleTopProducts.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[(topProductsIndex + index) % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div style={{ height: 420, overflowY: 'auto' }}>
                                    <Table hover responsive className="align-middle border-light">
                                        <thead className="bg-light sticky-top">
                                            <tr className="text-center">
                                                <th className="small text-muted border-0">Rank</th>
                                                <th className="small text-muted border-0 text-start ps-4">Product Name</th>
                                                <th className="small text-muted border-0">Units Sold</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {visibleTopProducts.map((row, idx) => (
                                                <tr className="text-center" key={idx}>
                                                    <td>
                                                        <span className={`badge ${idx + topProductsIndex < 3 ? 'bg-danger' : 'bg-secondary'} rounded-circle`} style={{ width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {idx + topProductsIndex + 1}
                                                        </span>
                                                    </td>
                                                    <td className="fw-medium text-start ps-4">{row.name}</td>
                                                    <td className="fw-bold text-danger">{row.quantity.toLocaleString()} Units</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )
                        )}
                    </Card>
                </Card.Body>
                <Card.Footer className="bg-white py-2 px-4 border-top">
                    <small className="text-muted float-end fst-italic">Last Updated: {lastUpdatedRevenue}</small>
                </Card.Footer>
            </Card>

            {/* SECTION 5: PAYMENT MODE DISTRIBUTION */}
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-5">
                <Card.Header className="bg-white border-bottom py-3 px-4">
                    <div className="d-flex align-items-center gap-2">
                        <MdReceipt className="text-info" size={24} />
                        <h5 className="mb-0 fw-bold">Payment Mode Distribution</h5>
                    </div>
                </Card.Header>
                <Card.Body className="p-4 bg-light bg-opacity-10">
                    <Row className="g-4">
                        <Col md={4} lg={3}>
                            <div className="d-flex flex-column gap-3 h-100">
                                <InventoryStat
                                    title="Total Transactions"
                                    value={totalTransactions}
                                    subtitle="Bills processed"
                                    icon={<MdFunctions />}
                                    color="info"
                                />
                                <InventoryStat
                                    title="Primary Mode"
                                    value={topPaymentMode.name}
                                    subtitle={`${topPaymentMode.value} usages`}
                                    icon={<MdTrendingUp />}
                                    color="success"
                                    isNumeric={false}
                                />
                                <InventoryStat
                                    title="Active Channels"
                                    value={paymentModeData.length}
                                    subtitle="Payment methods"
                                    icon={<MdLayers />}
                                    color="primary"
                                />
                            </div>
                        </Col>
                        <Col md={8} lg={9}>
                            <Card className="border-0 shadow-sm rounded-3 p-3 h-100">
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <div className="d-flex align-items-center">
                                        <MdPieChart className="text-info me-2" size={20} />
                                        <span className="fw-bold small text-uppercase text-muted">Payment Mode Distribution</span>
                                    </div>

                                    {/* Toggle Buttons */}
                                    <div className="btn-group shadow-sm" role="group">
                                        <Button
                                            variant={paymentViewMode === 'chart' ? 'info' : 'outline-info'}
                                            size="sm"
                                            onClick={() => setPaymentViewMode('chart')}
                                            className="d-flex align-items-center gap-1"
                                        >
                                            <MdPieChart /> Chart
                                        </Button>
                                        <Button
                                            variant={paymentViewMode === 'table' ? 'info' : 'outline-info'}
                                            size="sm"
                                            onClick={() => setPaymentViewMode('table')}
                                            className="d-flex align-items-center gap-1"
                                        >
                                            <MdTableRows /> Table
                                        </Button>
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="text-center py-5"><Spinner animation="border" variant="info" /></div>
                                ) : (
                                    paymentViewMode === 'chart' ? (
                                        /* --- Existing Pie Chart Code --- */
                                        <div style={{ width: '100%', height: '420px' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart margin={{ right: 80 }}>
                                                    <Pie
                                                        activeIndex={paymentActiveIndex}
                                                        activeShape={renderActiveShape}
                                                        data={paymentModeData}
                                                        innerRadius={80}
                                                        outerRadius={130}
                                                        paddingAngle={8}
                                                        dataKey="value"
                                                        nameKey="name"
                                                        onMouseEnter={onPaymentPieEnter}
                                                    >
                                                        {paymentModeData.map((entry, index) => (
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
                                    ) : (
                                        /* --- New Table View --- */
                                        <div style={{ height: 420, overflowY: 'auto' }} className="mt-3">
                                            <Table hover responsive className="align-middle border-light">
                                                <thead className="bg-light sticky-top">
                                                    <tr className="text-center">
                                                        <th className="small text-muted border-0 text-start ps-4">Method</th>
                                                        <th className="small text-muted border-0">Transactions</th>
                                                        <th className="small text-muted border-0">Usage %</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {paymentModeData.map((row, idx) => {
                                                        const percentage = ((row.value / totalTransactions) * 100).toFixed(1);
                                                        return (
                                                            <tr className="text-center" key={idx}>
                                                                <td className="fw-medium text-start ps-4">
                                                                    <span
                                                                        className="d-inline-block rounded-circle me-2"
                                                                        style={{ width: '10px', height: '10px', backgroundColor: COLORS[idx % COLORS.length] }}
                                                                    ></span>
                                                                    {row.name}
                                                                </td>
                                                                <td className="fw-bold">{row.value} Bills</td>
                                                                <td>
                                                                    <div className="d-flex align-items-center justify-content-center gap-2">
                                                                        <div className="progress w-50" style={{ height: '6px' }}>
                                                                            <div
                                                                                className="progress-bar"
                                                                                role="progressbar"
                                                                                style={{ width: `${percentage}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                                                                            ></div>
                                                                        </div>
                                                                        <span className="small text-muted">{percentage}%</span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )
                                )}
                            </Card>
                        </Col>
                    </Row>
                </Card.Body>
                <Card.Footer className="bg-white py-2 px-4 border-top">
                    <small className="text-muted float-end fst-italic">Last Updated: {lastUpdatedRevenue}</small>
                </Card.Footer>
            </Card>

            {/* SECTION 6: PRODUCT PAIRING (Market Basket Analysis) */}
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-5">
                <Card.Header className="bg-white border-bottom py-3 px-4">
                    <div className="d-flex align-items-center gap-2">
                        <MdFunctions className="text-primary" size={24} />
                        <h5 className="mb-0 fw-bold">Frequently Bought Together</h5>
                    </div>
                </Card.Header>
                <Card.Body className="p-4 bg-light bg-opacity-10">
                    <p className="text-muted small mb-4">
                        Discover which items are most commonly purchased in the same transaction to optimize combos and offers.
                    </p>
                    <Row className="g-3">
                        {crossSellData.length > 0 ? crossSellData.map((item, idx) => (
                            <Col md={6} lg={4} key={idx}>
                                <Card className="border-0 shadow-sm rounded-4 h-100 overflow-hidden bg-white">
                                    <div className="d-flex h-100">
                                        <div className="bg-primary d-flex align-items-center justify-content-center" style={{ width: '45px' }}>
                                            <span className="text-white fw-bold" style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', fontSize: '0.7rem' }}>
                                                #{idx + 1} PAIR
                                            </span>
                                        </div>
                                        <Card.Body className="p-3">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <div className="d-flex flex-column">
                                                    <span className="text-muted text-uppercase fw-bold mb-1" style={{ fontSize: '0.6rem' }}>Highly Correlated</span>
                                                    <div className="fw-bold text-dark d-flex align-items-center gap-2">
                                                        <span className="px-2 py-1 bg-light rounded-2 border" style={{ fontSize: '0.85rem' }}>{item.pair.split(' + ')[0]}</span>
                                                        <span className="text-primary">+</span>
                                                        <span className="px-2 py-1 bg-light rounded-2 border" style={{ fontSize: '0.85rem' }}>{item.pair.split(' + ')[1]}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center gap-2 mt-2">
                                                <div className="progress flex-grow-1" style={{ height: '4px' }}>
                                                    <div
                                                        className="progress-bar bg-primary"
                                                        role="progressbar"
                                                        style={{ width: `${(item.count / crossSellData[0].count) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-primary fw-bold" style={{ fontSize: '0.8rem' }}>{item.count}</span>
                                            </div>
                                        </Card.Body>
                                    </div>
                                </Card>
                            </Col>
                        )) : (
                            <Col className="text-center py-4 text-muted">No frequent pairings found yet.</Col>
                        )}
                    </Row>
                </Card.Body>
                <Card.Footer className="bg-white py-2 px-4 border-top">
                    <small className="text-muted float-end fst-italic">Last Updated: {lastUpdatedRevenue}</small>
                </Card.Footer>
            </Card>
        </Container>
    );
};

// --- Sub-Components ---
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

const InventoryStat = ({ title, value, subtitle, icon, color, isNumeric = true }) => (
    <Card className="border-0 shadow-sm rounded-3 p-3 bg-white hover-lift transition-all overflow-hidden">
        <div className="d-flex align-items-center">
            <div className={`rounded-3 d-flex align-items-center justify-content-center bg-${color} bg-opacity-10 text-${color} flex-shrink-0`} style={{ width: '52px', height: '52px', fontSize: '1.4rem' }}>{icon}</div>
            <div className="ms-3 flex-grow-1">
                <div className="text-secondary text-uppercase fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.04em' }}>{title}</div>
                <h4 className="fw-bold mb-3 me-2" style={{ lineHeight: '1.2' }}>{isNumeric ? value.toLocaleString() : value}</h4>
                <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '-2px' }}>{subtitle}</div>
            </div>
        </div>
    </Card>
);

export default Analytics;