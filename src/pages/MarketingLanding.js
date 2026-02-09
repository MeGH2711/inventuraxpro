import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Navbar, Badge } from 'react-bootstrap';
import { motion } from 'framer-motion';
import {
    MdAutoGraph, MdShield, MdReceipt,
    MdInventory, MdPeople, MdCheckCircle
} from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';
import inventuraxLogoWhite from '../assets/images/inventuraxLogoWhite.png';

const MarketingLanding = () => {
    const navigate = useNavigate();
    // Animation Variants
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.2 }
        }
    };

    const item = {
        hidden: { opacity: 0, scale: 0.9, filter: "blur(10px)" },
        show: { opacity: 1, scale: 1, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
    };

    return (
        <div style={{ backgroundColor: '#030303', color: '#fff', minHeight: '100vh', fontFamily: "'Outfit', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;700&family=Space+Mono&display=swap');
                
                .bg-glow {
                    position: fixed;
                    width: 60vw;
                    height: 60vw;
                    background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.05) 50%, transparent 70%);
                    top: -20%;
                    right: -10%;
                    z-index: 0;
                    pointer-events: none;
                }

                .prism-glass {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(25px) saturate(150%);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 40px;
                    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .prism-glass:hover {
                    background: rgba(255, 255, 255, 0.07);
                    border-color: rgba(255, 255, 255, 0.2);
                    transform: translateY(-10px);
                    box-shadow: 0 40px 80px -20px rgba(0,0,0,0.5);
                }

                .gradient-btn {
                    background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
                    border: none;
                    border-radius: 20px;
                    padding: 14px 35px;
                    font-weight: 700;
                    box-shadow: 0 10px 30px rgba(99, 102, 241, 0.3);
                    transition: 0.4s;
                }

                .gradient-btn:hover {
                    transform: scale(1.05);
                    box-shadow: 0 15px 40px rgba(168, 85, 247, 0.5);
                }

                .mono-text {
                    font-family: 'Space Mono', monospace;
                    font-size: 0.8rem;
                    letter-spacing: 2px;
                    color: #a855f7;
                }
            `}</style>

            <div className="bg-glow" />

            {/* Navbar */}
            <Navbar expand="lg" variant="dark" className="py-4 px-lg-5">
                <Container fluid>
                    <Navbar.Brand href="#">
                        <img src={inventuraxLogoWhite} alt="InventuraX" width="160" />
                    </Navbar.Brand>
                    <div className="d-flex align-items-center gap-3">
                        <Button
                            className="gradient-btn ms-lg-4"
                            onClick={() => navigate('/login')}
                        >
                            Login
                        </Button>
                    </div>
                </Container>
            </Navbar>

            {/* Hero Section */}
            <section className="py-5 position-relative" style={{ zIndex: 1 }}>
                <Container className="text-center py-lg-5">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
                        <h1 className="display-2 fw-bold mb-4" style={{ letterSpacing: '-2px' }}>
                            Modernize Your <span style={{ color: '#a855f7' }}>Retail Ops</span> <br /> From One Command Center.
                        </h1>
                        <p className="lead opacity-50 mb-5 mx-auto" style={{ maxWidth: '700px' }}>
                            InventuraX combines real-time billing, intelligent inventory tracking,
                            and customer relationship tools into a single, high-performance dashboard.
                        </p>
                    </motion.div>
                </Container>

                {/* Main Feature Grid */}
                <Container>
                    <motion.div variants={container} initial="hidden" animate="show">
                        <Row className="g-4">
                            <Col lg={4}>
                                <motion.div variants={item} className="prism-glass p-5 h-100">
                                    <div className="mb-4 p-3 d-inline-block rounded-4" style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
                                        <MdReceipt size={32} color="#6366f1" />
                                    </div>
                                    <h3>Smart Billing</h3>
                                    <p className="opacity-50">Generate professional invoices in seconds with multi-mode payment support and automated tax calculations.</p>
                                </motion.div>
                            </Col>
                            <Col lg={4}>
                                <motion.div variants={item} className="prism-glass p-5 h-100">
                                    <div className="mb-4 p-3 d-inline-block rounded-4" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                                        <FaWhatsapp size={32} color="#22c55e" />
                                    </div>
                                    <h3>WhatsApp Connect</h3>
                                    <p className="opacity-50">Send digital invoices and promotional campaigns directly to customers via customized WhatsApp templates.</p>
                                </motion.div>
                            </Col>
                            <Col lg={4}>
                                <motion.div variants={item} className="prism-glass p-5 h-100">
                                    <div className="mb-4 p-3 d-inline-block rounded-4" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                                        <MdInventory size={32} color="#ef4444" />
                                    </div>
                                    <h3>Inventory Core</h3>
                                    <td className="opacity-50">Track weight-based or unit-based products with categorized insights and low-stock management.</td>
                                </motion.div>
                            </Col>
                        </Row>
                        <Row className="g-4 mt-2">
                            <Col lg={4}>
                                <motion.div variants={item} className="prism-glass p-5 h-100">
                                    <div className="mb-4 p-3 d-inline-block rounded-4" style={{ background: 'rgba(253, 186, 116, 0.1)' }}>
                                        <MdAutoGraph size={32} color="#fb923c" />
                                    </div>
                                    <h3>Deep Analytics</h3>
                                    <p className="opacity-50">Analyze revenue flow, weekday performance, and market basket pairings to optimize your product mix.</p>
                                </motion.div>
                            </Col>
                            <Col lg={4}>
                                <motion.div variants={item} className="prism-glass p-5 h-100">
                                    <div className="mb-4 p-3 d-inline-block rounded-4" style={{ background: 'rgba(168, 85, 247, 0.1)' }}>
                                        <MdPeople size={32} color="#a855f7" />
                                    </div>
                                    <h3>Customer CRM</h3>
                                    <p className="opacity-50">Identify VIP spenders, track visit frequency, and manage detailed order histories for every client.</p>
                                </motion.div>
                            </Col>
                            <Col lg={4}>
                                <motion.div variants={item} className="prism-glass p-5 h-100">
                                    <div className="mb-4 p-3 d-inline-block rounded-4" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                                        <MdShield size={32} color="#3b82f6" />
                                    </div>
                                    <h3>Secure Access</h3>
                                    <p className="opacity-50">Advanced Google-authenticated security protocols with multi-level admin permissions and master controls.</p>
                                </motion.div>
                            </Col>
                        </Row>
                    </motion.div>
                </Container>
            </section>

            {/* NEW SECTION: System Performance Metrics */}
            <section className="py-5 position-relative">
                <Container>
                    <Row className="text-center mb-5">
                        <Col>
                            <h2 className="display-6 fw-bold">Built for <span style={{ color: '#6366f1' }}>Velocity</span></h2>
                            <p className="opacity-50">Enterprise-grade infrastructure ensuring zero bottlenecks during peak hours.</p>
                        </Col>
                    </Row>
                    <Row className="g-4">
                        {[
                            { label: "Sync Latency", value: "0.02s", desc: "Real-time synchronization." },
                            { label: "Uptime", value: "100%", desc: "Cloud-native architecture with failover support." },
                            { label: "Security", value: "AES-256", desc: "Encrypted data handling for all customer records." },
                            { label: "Concurrency", value: "500+", desc: "Handles hundreds of simultaneous billings." }
                        ].map((stat, idx) => (
                            <Col md={3} key={idx}>
                                <motion.div
                                    whileHover={{ y: -5 }}
                                    className="prism-glass p-4 text-center border-0"
                                    style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%)' }}
                                >
                                    <h3 className="text-primary fw-bold mb-1">{stat.value}</h3>
                                    <div className="mono-text mb-2" style={{ fontSize: '0.7rem' }}>{stat.label}</div>
                                    <p className="smallest opacity-50 mb-0">{stat.desc}</p>
                                </motion.div>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>

            {/* NEW SECTION: Public Invoice Experience */}
            <section className="py-5 overflow-hidden">
                <Container>
                    <Row className="align-items-center g-5">
                        <Col lg={5}>
                            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                                <Badge bg="primary" className="mb-3">CUSTOMER-CENTRIC</Badge>
                                <h2 className="display-5 fw-bold mb-4">Transparent <br />Public Invoicing</h2>
                                <p className="lead opacity-50 mb-4">
                                    Every transaction generates a clean, web-accessible public invoice. Customers can view,
                                    download PDF receipts, and connect with your social media directly from their mobile devices.
                                </p>
                                <ul className="list-unstyled opacity-75">
                                    <li className="mb-3 d-flex align-items-center"><MdCheckCircle className="text-success me-3" size={24} /> PDF Generation on the fly</li>
                                    <li className="mb-3 d-flex align-items-center"><MdCheckCircle className="text-success me-3" size={24} /> One-click Social Media integration</li>
                                    <li className="mb-3 d-flex align-items-center"><MdCheckCircle className="text-success me-3" size={24} /> Mobile-optimized responsive layout</li>
                                </ul>
                            </motion.div>
                        </Col>

                        <Col lg={7}>
                            <div className="position-relative d-flex justify-content-center align-items-center">
                                {/* Background Decorative Glow */}
                                <div className="position-absolute translate-middle top-50 start-50" style={{
                                    width: '400px', height: '400px',
                                    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)',
                                    zIndex: 0
                                }} />

                                {/* Abstract Invoice UI */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                    className="prism-glass p-4 position-relative"
                                    style={{ width: '100%', maxWidth: '400px', zIndex: 1 }}
                                >
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <MdReceipt size={30} className="text-primary" />
                                        <div className="text-end">
                                            <div className="smallest fw-bold opacity-50">INVOICE #8821</div>
                                            <div className="small fw-bold text-success">PAID</div>
                                        </div>
                                    </div>

                                    {/* Mock Table Lines */}
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="d-flex justify-content-between py-2 border-bottom border-secondary border-opacity-25">
                                            <div style={{ height: '8px', width: i === 1 ? '40%' : '30%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                                            <div style={{ height: '8px', width: '20%', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '4px' }} />
                                        </div>
                                    ))}

                                    <div className="mt-4 pt-2 d-flex justify-content-between align-items-end">
                                        <div>
                                            <div className="smallest opacity-50 mb-1">TOTAL AMOUNT</div>
                                            <div className="h4 fw-bold mb-0">₹1,250.00</div>
                                        </div>
                                        <Button size="sm" variant="outline-primary" className="rounded-pill px-3">Download</Button>
                                    </div>
                                </motion.div>

                                {/* WhatsApp Overlay Message */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="prism-glass p-3 position-absolute shadow-lg"
                                    style={{
                                        bottom: '-20px',
                                        right: '10%',
                                        width: '220px',
                                        borderLeft: '4px solid #22c55e',
                                        zIndex: 2
                                    }}
                                >
                                    <div className="d-flex align-items-center gap-2">
                                        <FaWhatsapp color="#22c55e" size={20} />
                                        <div className="fw-bold small">Digital Delivery</div>
                                    </div>
                                    <div className="smallest opacity-50 mt-1">Invoice sent successfully via WhatsApp</div>
                                </motion.div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Interactive Section */}
            <section className="py-5 mt-5">
                <Container>
                    <div className="prism-glass p-2">
                        <Row className="align-items-center g-0">
                            <Col lg={6} className="p-5">
                                <h2 className="display-5 fw-bold mb-4">Data-Driven Growth</h2>
                                <p className="opacity-50 mb-5">
                                    Our analytics engine visualizes your business health in real-time.
                                    Monitor fulfillment spreads and payment distributions to make informed scaling decisions.
                                </p>
                                <div className="d-flex gap-4">
                                    <div>
                                        <h4 className="mb-0 text-primary">Live</h4>
                                        <span className="mono-text small">SYNCING</span>
                                    </div>
                                    <div className="vr opacity-25" />
                                    <div>
                                        <h4 className="mb-0 text-success">Cloud</h4>
                                        <span className="mono-text small">DATABASE</span>
                                    </div>
                                </div>
                            </Col>
                            <Col lg={6}>
                                <div className="p-4">
                                    <img
                                        src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80"
                                        alt="Analytics Dashboard"
                                        className="img-fluid rounded-5 shadow-lg"
                                        style={{ filter: 'grayscale(100%) contrast(1.2) brightness(0.8)' }}
                                    />
                                </div>
                            </Col>
                        </Row>
                    </div>
                </Container>
            </section>

            {/* Footer */}
            <footer className="py-5 text-center">
                <Container>
                    <div className="mono-text mb-3">VERSION 1.0.2 STABLE</div>
                    <div className="opacity-25 small">
                        Developed by Megh Patel<br />
                        InventuraX System Architecture &copy; 2026
                    </div>
                </Container>
            </footer>
        </div>
    );
};

export default MarketingLanding;