import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Offcanvas, Modal, Button, Form, Table, Toast, ToastContainer } from 'react-bootstrap';
import { MdAdd, MdCategory, MdSearch, MdViewModule, MdViewList, MdEdit, MdDelete, MdShoppingBag } from 'react-icons/md';

import '../css/Products.css';
import '../css/Loading.css';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [viewMode, setViewMode] = useState(localStorage.getItem('productView') || 'card');

    const [showProductDrawer, setShowProductDrawer] = useState(false);
    const [showCategoryDrawer, setShowCategoryDrawer] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [editProduct, setEditProduct] = useState(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', bg: 'success' });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    // Save view preference to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('productView', viewMode);
    }, [viewMode]);

    const fetchProducts = async () => {
        setLoading(true); // Start loading
        const q = query(collection(db, "products"), orderBy("name"));
        const snapshot = await getDocs(q);
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false); // End loading
    };

    const fetchCategories = async () => {
        const q = query(collection(db, "product_categories"), orderBy("name"));
        const snapshot = await getDocs(q);
        setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const unitType = formData.get('unitType');
        const rawValue = formData.get('unitValue');

        const productData = {
            name: formData.get('name'),
            unitType: unitType,
            unitValue: unitType === 'weight' ? parseFloat(rawValue) : parseInt(rawValue),
            category: formData.get('category'),
            price: parseFloat(formData.get('price'))
        };

        setLoading(true);

        try {
            if (editProduct) {
                await updateDoc(doc(db, "products", editProduct.id), productData);
                showNotification("Product updated successfully!");
            } else {
                await addDoc(collection(db, "products"), productData);
                showNotification("Product added successfully!");
            }
            await fetchProducts();
            setShowProductDrawer(false);
            setEditProduct(null);
        } catch (err) {
            showNotification("Error saving product", "danger");
        }
    };

    const handleDeleteProduct = async () => {
        if (!itemToDelete) return;
        await deleteDoc(doc(db, "products", itemToDelete.id));
        setShowDeleteModal(false);
        fetchProducts();
        showNotification("Product deleted");
    };

    const showNotification = (message, bg = 'success') => {
        setToast({ show: true, message, bg });
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (selectedCategory === '' || p.category === selectedCategory)
    );

    return (
        <div className="container-fluid py-4">
            {loading && (
                <div className="loading-overlay">
                    <div className="custom-spinner"></div>
                    <div className="loading-text">SYNCING INVENTORY...</div>
                </div>
            )}
            {/* Action Bar */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex gap-2">
                    <Button variant="darkblue" className='btn btn-sm' onClick={() => { setEditProduct(null); setShowProductDrawer(true); }}>
                        <MdAdd /> Add Product
                    </Button>
                    <Button variant="outline-darkblue" className='btn btn-sm' onClick={() => setShowCategoryDrawer(true)}>
                        <MdCategory /> Categories
                    </Button>
                </div>
                <div className="d-flex gap-2 align-items-center w-50 justify-content-end">
                    <div className="input-group input-group-sm w-50">
                        <span className="input-group-text bg-transparent border-end-0"><MdSearch /></span>
                        <Form.Control
                            type="text"
                            placeholder="Search..."
                            className="border-start-0 shadow-none"
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Form.Select
                        className="form-select-sm w-25 shadow-none"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                    </Form.Select>
                    <div className="btn-group btn-group-sm">
                        <Button
                            variant={viewMode === 'card' ? 'darkblue' : 'outline-darkblue'}
                            onClick={() => setViewMode('card')}
                            className='btn btn-sm'
                        >
                            <MdViewModule />
                        </Button>
                        <Button
                            variant={viewMode === 'table' ? 'darkblue' : 'outline-darkblue'}
                            onClick={() => setViewMode('table')}
                            className='btn btn-sm'
                        >
                            <MdViewList />
                        </Button>
                    </div>
                </div>
            </div>

            {/* CONDITIONAL RENDERING: CARD VS TABLE */}
            {viewMode === 'card' ? (
                <div className="row g-4">
                    {filteredProducts.map(p => (
                        <div key={p.id} className="col-md-3">
                            <div className="card product-card h-100 border-0 shadow-sm">
                                <div className="card-body p-4">
                                    <span className="category-tag">{p.category}</span>
                                    <h5 className="product-name mb-2">{p.name}</h5>
                                    <div className="d-flex align-items-center text-muted small">
                                        <MdShoppingBag className="me-1" />
                                        <span>
                                            {p.unitValue || p.weight} {p.unitType === 'piece' ? 'pcs' : 'gms'}
                                        </span>
                                    </div>
                                    <div className="price-section">
                                        <span className="price-label">Current Price</span>
                                        <span className="price-amount">₹ {p.price.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="product-actions">
                                    <Button className="btn-edit-action py-2" onClick={() => { setEditProduct(p); setShowProductDrawer(true); }}>
                                        <MdEdit className="me-2" /> Edit
                                    </Button>
                                    <Button className="btn-delete-action" onClick={() => { setItemToDelete(p); setShowDeleteModal(true); }}>
                                        <MdDelete size={20} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card border-0 shadow-sm overflow-hidden">
                    <Table hover responsive className="mb-0 align-middle product-table">
                        <thead className="bg-light text-muted small uppercase">
                            <tr>
                                <th className="ps-4">Product Name</th>
                                <th>Weight / Pieces</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th className="text-center pe-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map(p => (
                                <tr key={p.id}>
                                    <td className="ps-4 fw-bold text-dark">{p.name}</td>
                                    <td>{p.unitValue || p.weight} {p.unitType === 'piece' ? 'pcs' : 'gms'}</td>
                                    <td><span className="badge-category-table">{p.category}</span></td>
                                    <td className="fw-bold">₹ {p.price.toFixed(2)}</td>
                                    <td className="text-center pe-4">
                                        <Button variant="link" className="text-dark p-1 me-2" onClick={() => { setEditProduct(p); setShowProductDrawer(true); }}>
                                            <MdEdit size={18} />
                                        </Button>
                                        <Button variant="link" className="text-danger p-1" onClick={() => { setItemToDelete(p); setShowDeleteModal(true); }}>
                                            <MdDelete size={18} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            )}

            {/* DRAWERS AND MODALS REMAIN THE SAME */}
            <Offcanvas show={showProductDrawer} onHide={() => setShowProductDrawer(false)} placement="end" className="drawer-modern">
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title className="fw-bold">{editProduct ? 'Edit Product' : 'Add New Product'}</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="p-4">
                    <Form onSubmit={handleSaveProduct}>
                        <Form.Group className="mb-4">
                            <Form.Label className="small fw-bold text-muted">PRODUCT NAME</Form.Label>
                            <Form.Control name="name" defaultValue={editProduct?.name} required placeholder="Enter name" />
                        </Form.Group>
                        {/* Inside your Product Drawer Form */}
                        <Form.Group className="mb-4">
                            <Form.Label className="small fw-bold text-muted">PRICING UNIT</Form.Label>
                            <div className="d-flex gap-3 mt-1">
                                <Form.Check
                                    type="radio"
                                    label="Weight (gms)"
                                    name="unitType"
                                    value="weight"
                                    id="unitWeight"
                                    defaultChecked={!editProduct || editProduct?.unitType === 'weight'}
                                />
                                <Form.Check
                                    type="radio"
                                    label="Pieces (qty)"
                                    name="unitType"
                                    value="piece"
                                    id="unitPiece"
                                    defaultChecked={editProduct?.unitType === 'piece'}
                                />
                            </div>
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="small fw-bold text-muted">VALUE</Form.Label>
                            <Form.Control
                                name="unitValue"
                                type="number"
                                defaultValue={editProduct?.unitValue || editProduct?.weight} // Fallback for old data
                                required
                                placeholder="Enter weight or quantity"
                            />
                        </Form.Group>
                        <Form.Group className="mb-4">
                            <Form.Label className="small fw-bold text-muted">CATEGORY</Form.Label>
                            <Form.Select name="category" defaultValue={editProduct?.category} required>
                                <option value="">Select Category</option>
                                {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-5">
                            <Form.Label className="small fw-bold text-muted">PRICE (₹)</Form.Label>
                            <Form.Control name="price" type="number" step="0.01" defaultValue={editProduct?.price} required placeholder="0.00" />
                        </Form.Group>
                        <Button variant="darkblue" type="submit" className="w-100 py-3">
                            {editProduct ? 'Update Product' : 'Create Product'}
                        </Button>
                    </Form>
                </Offcanvas.Body>
            </Offcanvas>

            <Offcanvas show={showCategoryDrawer} onHide={() => setShowCategoryDrawer(false)} placement="end" className="drawer-modern">
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title className="fw-bold">Manage Categories</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    <Form onSubmit={async (e) => {
                        e.preventDefault();
                        if (!newCategoryName.trim()) return;
                        await addDoc(collection(db, "product_categories"), { name: newCategoryName.trim() });
                        setNewCategoryName('');
                        fetchCategories();
                    }} className="mb-4">
                        <div className="input-group shadow-sm">
                            <Form.Control placeholder="New category..." value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
                            <Button variant="darkblue" type="submit">Add</Button>
                        </div>
                    </Form>
                    <div className="category-scroll-area">
                        <Table hover borderless className="align-middle">
                            <tbody>
                                {categories.map((cat, idx) => (
                                    <tr key={cat.id} className="border-bottom">
                                        <td className="text-muted small w-10">{idx + 1}.</td>
                                        <td className="fw-medium">{cat.name}</td>
                                        <td className="text-end">
                                            <Button variant="link" className="text-danger p-0" onClick={async () => {
                                                if (window.confirm("Remove category?")) {
                                                    await deleteDoc(doc(db, "product_categories", cat.id));
                                                    fetchCategories();
                                                }
                                            }}><MdDelete size={18} /></Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Offcanvas.Body>
            </Offcanvas>

            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered size="sm" className="delete-modal">
                <Modal.Body className="text-center p-4">
                    <div className="text-danger mb-3"><MdDelete size={48} /></div>
                    <h5 className="fw-bold">Delete Product?</h5>
                    <p className="text-muted small">Are you sure you want to delete <b>{itemToDelete?.name}</b>?</p>
                    <div className="d-flex gap-2 mt-4">
                        <Button variant="light" className="w-100" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                        <Button variant="danger" className="w-100" onClick={handleDeleteProduct}>Delete</Button>
                    </div>
                </Modal.Body>
            </Modal>

            <ToastContainer position="top-end" className="p-3">
                <Toast show={toast.show} bg={toast.bg} onClose={() => setToast({ ...toast, show: false })} delay={3000} autohide>
                    <Toast.Body className="text-white">{toast.message}</Toast.Body>
                </Toast>
            </ToastContainer>
        </div>
    );
};

export default Products;