import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { Container, Card, Table, Spinner, Button } from 'react-bootstrap';
import { MdDownload } from 'react-icons/md';
import { generateInvoice } from '../utils/generateInvoice';

const PublicBill = () => {
    const { id } = useParams();
    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBill = async () => {
            const docRef = doc(db, "bills", id);
            const snap = await getDoc(docRef);
            if (snap.exists()) setBill(snap.data());
            setLoading(false);
        };
        fetchBill();
    }, [id]);

    if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;
    if (!bill) return <div className="text-center mt-5"><h3>Invoice Not Found</h3></div>;

    return (
        <Container className="py-5" style={{ maxWidth: '800px' }}>
            <Card className="shadow-sm border-0 p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="fw-bold">INVOICE</h2>
                    <Button variant="outline-dark" onClick={() => generateInvoice({
                        nextBillNumber: bill.billNumber,
                        billingData: { ...bill, contactNumber: bill.customerNumber },
                        cart: bill.products.map(p => ({ name: p.name, qty: p.quantity, price: p.unitPrice, discount: p.discount, discountedTotal: p.discountedTotal })),
                        subTotal: bill.overallTotal,
                        overallDiscount: bill.overallDiscount,
                        finalCalculatedTotal: bill.finalTotal
                    })}>
                        <MdDownload /> Download PDF
                    </Button>
                </div>
                <hr />
                <div className="row mb-4">
                    <div className="col-6">
                        <p className="text-muted mb-1">Billed To:</p>
                        <h5 className="mb-0">{bill.customerName}</h5>
                        <p className="small">{bill.customerNumber}</p>
                    </div>
                    <div className="col-6 text-end">
                        <p className="text-muted mb-1">Invoice Details:</p>
                        <p className="mb-0"><strong>No:</strong> #{bill.billNumber}</p>
                        <p className="mb-0"><strong>Date:</strong> {bill.billingDate}</p>
                    </div>
                </div>
                <Table responsive>
                    <thead><tr><th>Item</th><th>Qty</th><th>Total</th></tr></thead>
                    <tbody>
                        {bill.products.map((p, i) => (
                            <tr key={i}>
                                <td>{p.name}</td>
                                <td>{p.quantity}</td>
                                <td>₹{p.discountedTotal.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
                <div className="text-end mt-3">
                    <h4>Total: ₹{bill.finalTotal.toFixed(2)}</h4>
                </div>
            </Card>
        </Container>
    );
};

export default PublicBill;