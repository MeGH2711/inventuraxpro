import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, setDoc, deleteDoc, doc, query } from 'firebase/firestore';
import { Container, Card, Table, Button, Form, InputGroup, Badge, Toast, ToastContainer } from 'react-bootstrap';
import { MdSecurity, MdPersonAdd, MdDelete, MdVerifiedUser, MdOutlineMail } from 'react-icons/md';

const AccountSecurity = () => {
    const [users, setUsers] = useState([]);
    const [newEmail, setNewEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', bg: 'success' });

    // Define the Protected Master Account
    const MASTER_ACCOUNT = "patelmeghmahesh2701@gmail.com";

    useEffect(() => {
        fetchAuthorizedUsers();
    }, []);

    const fetchAuthorizedUsers = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "authorized_users"));
            const snapshot = await getDocs(q);

            // Map the data
            let userList = snapshot.docs.map(doc => ({ email: doc.id, ...doc.data() }));

            // SORTING LOGIC: Keep Master Account at the very top
            userList.sort((a, b) => {
                if (a.email === MASTER_ACCOUNT) return -1;
                if (b.email === MASTER_ACCOUNT) return 1;
                return a.email.localeCompare(b.email); // Sort others alphabetically
            });

            setUsers(userList);
        } catch (error) {
            showNotification("Error fetching users", "danger");
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        const emailToSave = newEmail.trim().toLowerCase();

        if (!emailToSave || !emailToSave.includes('@')) {
            showNotification("Please enter a valid email address.", "warning");
            return;
        }

        try {
            await setDoc(doc(db, "authorized_users", emailToSave), {
                addedAt: new Date().toISOString(),
                role: 'admin'
            });
            setNewEmail('');
            fetchAuthorizedUsers();
            showNotification(`Access granted to ${emailToSave}`);
        } catch (error) {
            showNotification("Failed to add user.", "danger");
        }
    };

    const handleDeleteUser = async (email) => {
        // Prevent deletion of Master Account
        if (email.toLowerCase() === MASTER_ACCOUNT.toLowerCase()) {
            showNotification("Security Protocol: System Owner cannot be deleted.", "danger");
            return;
        }

        if (window.confirm(`Revoke access for ${email}?`)) {
            try {
                await deleteDoc(doc(db, "authorized_users", email));
                fetchAuthorizedUsers();
                showNotification("User access revoked.", "success");
            } catch (error) {
                showNotification("Error removing user.", "danger");
            }
        }
    };

    const showNotification = (message, bg = 'success') => {
        setToast({ show: true, message, bg });
    };

    return (
        <Container fluid className="py-4">
            <div className="mb-4">
                <h2 className="pageHeader mb-1">Account Security</h2>
                <p className="text-muted small mb-0">Manage Google accounts authorized to access the system.</p>
            </div>

            <Card className="border-0 shadow-sm rounded-4 mb-4">
                <Card.Body className="p-4">
                    <Form onSubmit={handleAddUser}>
                        <Form.Label className="fw-bold small text-muted text-uppercase">Authorize New User</Form.Label>
                        <InputGroup className="mb-3">
                            <InputGroup.Text className="bg-white border-end-0">
                                <MdOutlineMail className="text-muted" />
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Enter Google Email Address..."
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                className="border-start-0 shadow-none"
                            />
                            <Button variant="darkblue" type="submit" className="px-4">
                                <MdPersonAdd className="me-2" /> Grant Access
                            </Button>
                        </InputGroup>
                    </Form>
                </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                <Card.Header className="bg-transparent border-0 pt-4 px-4 d-flex align-items-center gap-2">
                    <MdVerifiedUser className="text-success" />
                    <h5 className="fw-bold mb-0">Authorized Team Members</h5>
                </Card.Header>
                <Card.Body className="p-0">
                    <Table responsive hover className="mb-0 align-middle">
                        <thead className="bg-light small text-uppercase">
                            <tr>
                                <th className="ps-4">Email Address</th>
                                <th>Permission Role</th>
                                <th className="text-end pe-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u, index) => (
                                <tr key={index} className={u.email === MASTER_ACCOUNT ? "bg-light-blue" : ""}>
                                    <td className="ps-4 fw-medium text-dark">
                                        {u.email}
                                        {u.email === MASTER_ACCOUNT && (
                                            <Badge bg="primary" className="ms-2 px-2 py-1" style={{ fontSize: '0.65rem' }}>SYSTEM OWNER</Badge>
                                        )}
                                    </td>
                                    <td>
                                        <Badge bg="success-soft" className="text-success border border-success px-3 py-2 rounded-pill">
                                            Admin
                                        </Badge>
                                    </td>
                                    <td className="text-end pe-4">
                                        {u.email !== MASTER_ACCOUNT ? (
                                            <Button variant="link" className="text-danger p-0" onClick={() => handleDeleteUser(u.email)}>
                                                <MdDelete size={20} />
                                            </Button>
                                        ) : (
                                            <MdSecurity size={20} className="text-primary opacity-50" />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            <ToastContainer position="top-end" className="p-3">
                <Toast show={toast.show} bg={toast.bg} onClose={() => setToast({ ...toast, show: false })} delay={3000} autohide>
                    <Toast.Body className="text-white">{toast.message}</Toast.Body>
                </Toast>
            </ToastContainer>
        </Container>
    );
};

export default AccountSecurity;