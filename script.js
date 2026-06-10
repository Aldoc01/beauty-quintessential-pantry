'use strict';

const SUPABASE_URL = 'https://pwfnpnnoenoqlhlvfghp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_r_hwNGcjT1NgtLQ7o1CgsQ_OMVOmth1';

let db = null;
const supabaseReady = SUPABASE_URL !== 'YOUR_SUPABASE_URL';

if (supabaseReady) {
    try {
        const { createClient } = supabase;
        db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
        console.warn('Supabase init failed. Running offline.', e);
    }
}

const FALLBACK_PRODUCTS = [
    { id: 1,  name: 'Moon and Star', size: 'Big',    price: 7000, category: 'big',    image: 'product-1.jpg',  description: 'Classic cereal blend, big family size' },
    { id: 2,  name: 'Cornflakes',    size: 'Small',  price: 1000, category: 'small',  image: 'product-2.jpg',  description: 'Crispy cornflakes, lightly toasted' },
    { id: 3,  name: 'Moon and Star', size: 'Small',  price: 1000, category: 'small',  image: 'product-3.jpg',  description: 'Classic cereal blend, small size' },
    { id: 4,  name: 'Golden Morn',   size: 'Small',  price: 1000, category: 'small',  image: 'product-4.jpg',  description: 'Wholesome golden morn cereal' },
    { id: 5,  name: 'Fresh Milk',    size: 'Small',  price: 1500, category: 'small',  image: 'product-5.jpg',  description: 'Premium fresh milk, chilled' },
    { id: 6,  name: 'Custard',       size: 'Small',  price: 1000, category: 'small',  image: 'product-6.jpg',  description: 'Smooth vanilla custard powder' },
    { id: 7,  name: 'Moon and Star', size: 'Medium', price: 5000, category: 'medium', image: 'product-7.jpg',  description: 'Classic cereal blend, medium size' },
    { id: 8,  name: 'Milo',          size: 'Small',  price: 2000, category: 'small',  image: 'product-8.jpg',  description: 'Rich malt chocolate drink' },
    { id: 9,  name: 'Rolled Oats',   size: 'Medium', price: 5000, category: 'medium', image: 'product-9.jpg',  description: 'Whole grain rolled oats, nutritious' },
    { id: 10, name: 'Coco Pops',     size: 'Medium', price: 5000, category: 'medium', image: 'product-10.jpg', description: 'Chocolatey pops for the whole family' },
    { id: 11, name: 'Oats',          size: 'Medium', price: 5000, category: 'medium', image: 'product-11.jpg', description: 'Hearty rolled oats, great for porridge' },
    { id: 12, name: 'Fresh Milk',    size: 'Big',    price: 5000, category: 'big',    image: 'product-12.jpg', description: 'Premium fresh milk, big pack' },
    { id: 13, name: 'Coco Pops',     size: 'Small',  price: 3000, category: 'small',  image: 'product-13.jpg', description: 'Chocolatey pops, small size' }
];

const CONFIG = {
    WHATSAPP_NUMBER: '2348020536581',
    STORAGE_KEY: 'bq_pantry_cart_v2'
};

const STATE = {
    products: [], cart: [], currentFilter: 'all',
    loadCart() {
        try { const raw = localStorage.getItem(CONFIG.STORAGE_KEY); this.cart = raw ? JSON.parse(raw) : []; } catch { this.cart = []; }
    },
    saveCart() { try { localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this.cart)); } catch {} },
    addToCart(productId, qty = 1) {
        const existing = this.cart.find(i => String(i.id) === String(productId));
        if (existing) { existing.qty = qty; }
        else {
            const product = this.products.find(p => String(p.id) === String(productId));
            if (!product) return;
            this.cart.push({ id: productId, name: product.name, size: product.size, price: product.price, image: product.image || '', qty });
        }
        this.saveCart();
    },
    removeFromCart(productId) { this.cart = this.cart.filter(i => String(i.id) !== String(productId)); this.saveCart(); },
    getCartTotal() { return this.cart.reduce((sum, i) => sum + i.price * i.qty, 0); },
    getCartCount() { return this.cart.reduce((sum, i) => sum + i.qty, 0); }
};

const DOM = {
    productsGrid: null, filterButtons: null, cartBtn: null, cartModal: null,
    cartOverlay: null, cartItems: null, cartFooter: null, cartCount: null, cartModalClose: null,
    init() {
        this.productsGrid   = document.getElementById('productsGrid');
        this.filterButtons  = document.querySelectorAll('.filter-btn');
        this.cartBtn        = document.getElementById('cartBtn');
        this.cartModal      = document.getElementById('cartModal');
        this.cartOverlay    = document.getElementById('cartOverlay');
        this.cartItems      = document.getElementById('cartItems');
        this.cartFooter     = document.getElementById('cartFooter');
        this.cartCount      = document.getElementById('cartCount');
        this.cartModalClose = document.getElementById('cartModalClose');
    }
};

async function loadProducts() {
    if (db) {
        try {
            const { data, error } = await db.from('products').select('*').order('name', { ascending: true });
            if (!error && data && data.length > 0) { STATE.products = data; return; }
        } catch (e) { console.warn('Supabase fetch failed, using fallback.', e); }
    }
    STATE.products = FALLBACK_PRODUCTS;
}

const ProductRenderer = {
    render(filter) {
        STATE.currentFilter = filter;
        const list = filter === 'all' ? STATE.products : STATE.products.filter(p => p.category === filter || p.size?.toLowerCase() === filter);
        if (!list.length) { DOM.productsGrid.innerHTML = '<p style="text-align:center;padding:60px;color:var(--brown-light);grid-column:1/-1">No products found.</p>'; return; }
        DOM.productsGrid.innerHTML = list.map((p, i) => this.cardHTML(p, i)).join('');
        this.updateAddButtons();
    },
    cardHTML(p, index) {
        const inCart = STATE.cart.find(i => String(i.id) === String(p.id));
        const qty = inCart ? inCart.qty : 1;
        const delay = Math.min(index * 40, 400);
        const imgSrc = p.image || `https://placehold.co/400x250/EDE5D7/5C3D2E?text=${encodeURIComponent(p.name)}`;
        return `
            <div class="product-card" style="animation-delay:${delay}ms">
                <div class="product-img-wrap">
                    <img src="${imgSrc}" alt="${p.name} — ${p.size}" class="product-image" data-product-id="${p.id}" loading="lazy"
                         onerror="this.src='https://placehold.co/400x250/EDE5D7/5C3D2E?text=${encodeURIComponent(p.name)}'">
                    <span class="product-badge">${p.size}</span>
                </div>
                <div class="product-info">
                    <div class="product-name">${p.name}</div>
                    <div class="product-size">${p.size} size</div>
                    <div class="product-description">${p.description || ''}</div>
                    <div class="product-price">&#8358;${Number(p.price).toLocaleString()}</div>
                    <div class="product-controls">
                        <div class="qty-control">
                            <button class="qty-btn" data-action="decrease-qty" data-product-id="${p.id}">&#8722;</button>
                            <input type="number" class="qty-input" value="${qty}" min="1" max="99" data-qty-input="${p.id}">
                            <button class="qty-btn" data-action="increase-qty" data-product-id="${p.id}">+</button>
                        </div>
                        <button class="add-to-cart-btn ${inCart ? 'in-cart' : ''}" data-action="add-to-cart" data-product-id="${p.id}">
                            ${inCart ? '&#10003; Added' : 'Add to Cart'}
                        </button>
                    </div>
                </div>
            </div>`;
    },
    updateAddButtons() {
        document.querySelectorAll('[data-action="add-to-cart"]').forEach(btn => {
            const id = btn.getAttribute('data-product-id');
            const inCart = STATE.cart.find(i => String(i.id) === String(id));
            btn.textContent = inCart ? '✓ Added' : 'Add to Cart';
            btn.classList.toggle('in-cart', !!inCart);
        });
    }
};

const CartManager = {
    updateUI() {
        DOM.cartCount.textContent = STATE.getCartCount();
        if (!STATE.cart.length) {
            DOM.cartItems.innerHTML = '<p class="empty-message">Your cart is empty 🥣</p>';
            DOM.cartFooter.innerHTML = ''; return;
        }
        DOM.cartItems.innerHTML = STATE.cart.map(item => `
            <div class="cart-item">
                <img src="${item.image || ''}" alt="${item.name}" class="cart-item-img" onerror="this.src='https://placehold.co/54x54/EDE5D7/5C3D2E?text=BQ'">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-meta">${item.size} · Qty: ${item.qty}</div>
                </div>
                <div class="cart-item-price">&#8358;${(item.price * item.qty).toLocaleString()}</div>
                <button class="cart-remove-btn" data-action="remove-from-cart" data-product-id="${item.id}">&#215;</button>
            </div>`).join('');
        DOM.cartFooter.innerHTML = `
            <div class="cart-total-row">
                <span class="cart-total-label">Total</span>
                <span class="cart-total-amount">&#8358;${STATE.getCartTotal().toLocaleString()}</span>
            </div>
            <button class="checkout-wa-btn" data-action="checkout-whatsapp">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-9.746 9.798c0 2.734.748 5.41 2.164 7.723L3.513 21.3l8.332-2.189a9.9 9.9 0 004.773 1.215h.004c5.396 0 9.747-4.363 9.747-9.798a9.872 9.872 0 00-9.747-9.798"/></svg>
                Enquire on WhatsApp
            </button>`;
    }
};

const CartModal = {
    open() { DOM.cartModal.classList.add('active'); DOM.cartOverlay.classList.add('active'); document.body.style.overflow = 'hidden'; DOM.cartModalClose.focus(); },
    close() { DOM.cartModal.classList.remove('active'); DOM.cartOverlay.classList.remove('active'); document.body.style.overflow = ''; DOM.cartBtn.focus(); },
    toggle() { DOM.cartModal.classList.contains('active') ? this.close() : this.open(); }
};

const Checkout = {
    whatsapp() {
        if (!STATE.cart.length) return;
        const lines = STATE.cart.map(i => `• ${i.name} (${i.size}) × ${i.qty} = ₦${(i.price * i.qty).toLocaleString()}`).join('\n');
        const msg = `Hello BQ Pantry! 👋\nI'd like to order the following:\n\n${lines}\n\n*Total: ₦${STATE.getCartTotal().toLocaleString()}*\n\nPlease let me know about availability and delivery. Thank you!`;
        window.open(`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    }
};

const Lightbox = {
    images: [], currentIndex: 0,
    el: null, imgEl: null, titleEl: null, sizeEl: null, priceEl: null, counterEl: null,
    init() {
        this.el = document.getElementById('imageLightbox');
        this.imgEl = document.getElementById('lightboxImage');
        this.titleEl = document.getElementById('lightboxTitle');
        this.sizeEl = document.getElementById('lightboxSize');
        this.priceEl = document.getElementById('lightboxPrice');
        this.counterEl = document.getElementById('lightboxCounter');
        document.getElementById('lightboxClose').addEventListener('click', () => this.close());
        document.getElementById('lightboxOverlay').addEventListener('click', () => this.close());
        document.getElementById('lightboxPrev').addEventListener('click', () => this.previous());
        document.getElementById('lightboxNext').addEventListener('click', () => this.next());
        document.addEventListener('keydown', e => {
            if (!this.el.classList.contains('active')) return;
            if (e.key === 'Escape') this.close();
            if (e.key === 'ArrowLeft') this.previous();
            if (e.key === 'ArrowRight') this.next();
        });
    },
    open(productId) {
        this.images = STATE.products;
        this.currentIndex = this.images.findIndex(p => String(p.id) === String(productId));
        if (this.currentIndex === -1) this.currentIndex = 0;
        this.el.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.update();
    },
    close() { this.el.classList.remove('active'); document.body.style.overflow = ''; },
    previous() { this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length; this.update(); },
    next() { this.currentIndex = (this.currentIndex + 1) % this.images.length; this.update(); },
    update() {
        const p = this.images[this.currentIndex];
        this.imgEl.src = p.image || `https://placehold.co/600x400/EDE5D7/5C3D2E?text=${encodeURIComponent(p.name)}`;
        this.imgEl.alt = `${p.name} — ${p.size}`;
        this.titleEl.textContent = p.name;
        this.sizeEl.textContent = `${p.size} size`;
        this.priceEl.textContent = `₦${Number(p.price).toLocaleString()}`;
        this.counterEl.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
    }
};

const Admin = {
    isLoggedIn: false, loginModal: null,
    init() {
        this.loginModal = document.getElementById('adminLoginModal');
        document.getElementById('adminTrigger').addEventListener('click', () => this.showLoginModal());
        document.getElementById('adminLoginClose').addEventListener('click', () => this.hideLoginModal());
        document.getElementById('adminLoginOverlay').addEventListener('click', () => this.hideLoginModal());
        document.getElementById('adminLoginBtn').addEventListener('click', () => this.login());
        document.getElementById('adminLogoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('adminPassword').addEventListener('keydown', e => { if (e.key === 'Enter') this.login(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && this.loginModal.classList.contains('active')) this.hideLoginModal(); });
        if (db) { db.auth.getSession().then(({ data }) => { if (data.session) { this.isLoggedIn = true; document.getElementById('adminUserInfo').textContent = data.session.user.email; } }); }
    },
    showLoginModal() { this.loginModal.classList.add('active'); document.getElementById('adminLoginError').classList.remove('visible'); document.getElementById('adminEmail').focus(); },
    hideLoginModal() { this.loginModal.classList.remove('active'); },
    async login() {
        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value;
        const errEl = document.getElementById('adminLoginError');
        const btn = document.getElementById('adminLoginBtn');
        const btnText = document.getElementById('adminLoginBtnText');
        errEl.classList.remove('visible');
        if (!email || !password) { errEl.textContent = 'Please enter email and password.'; errEl.classList.add('visible'); return; }
        btn.disabled = true; btnText.textContent = 'Signing in…';
        try {
            const { data, error } = await db.auth.signInWithPassword({ email, password });
            if (error) throw error;
            this.isLoggedIn = true;
            this.hideLoginModal();
            document.getElementById('adminUserInfo').textContent = data.user.email;
            document.getElementById('adminEmail').value = '';
            document.getElementById('adminPassword').value = '';
            AdminPanel.showPanel();
        } catch (e) {
            errEl.textContent = 'Sign in failed: ' + (e.message || 'Invalid credentials.');
            errEl.classList.add('visible');
        } finally { btn.disabled = false; btnText.textContent = 'Sign In'; }
    },
    async logout() {
        if (db) { try { await db.auth.signOut(); } catch {} }
        this.isLoggedIn = false;
        AdminPanel.hidePanel();
    }
};

const AdminPanel = {
    currentSection: 'products', editingId: null,
    showPanel() { document.getElementById('adminPanel').classList.add('active'); document.body.style.overflow = 'hidden'; this.loadProducts(); },
    hidePanel() { document.getElementById('adminPanel').classList.remove('active'); document.body.style.overflow = ''; },
    switchSection(section) {
        document.querySelectorAll('.admin-section').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.admin-nav-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`adminSection${section.charAt(0).toUpperCase() + section.slice(1)}`).classList.add('active');
        document.querySelector(`[data-section="${section}"]`).classList.add('active');
        document.getElementById('adminPageTitle').textContent = section === 'products' ? 'Products' : 'Add New Product';
    },
    async loadProducts() {
        const list = document.getElementById('adminProductList');
        list.innerHTML = '<div class="admin-loading"><div class="loading-spinner dark"></div><p>Loading…</p></div>';
        let products = [];
        try { const { data, error } = await db.from('products').select('*').order('name', { ascending: true }); if (!error && data) products = data; } catch (e) { console.error(e); }
        if (!products.length) { list.innerHTML = '<p style="color:rgba(255,255,255,0.4);padding:40px;text-align:center">No products yet. Add your first product!</p>'; return; }
        list.innerHTML = products.map(p => `
            <div class="admin-product-item">
                <img src="${p.image || ''}" alt="${p.name}" class="admin-prod-img" onerror="this.src='https://placehold.co/52x52/2a2a38/888?text=BQ'">
                <div class="admin-prod-info">
                    <div class="admin-prod-name">${p.name}</div>
                    <div class="admin-prod-meta">${p.size} · ${p.category || p.size?.toLowerCase()}</div>
                </div>
                <span class="admin-prod-price">&#8358;${Number(p.price).toLocaleString()}</span>
                <div class="admin-prod-actions">
                    <button class="admin-btn admin-btn-edit" onclick="AdminPanel.openEdit('${p.id}')">Edit</button>
                    <button class="admin-btn admin-btn-delete" onclick="AdminPanel.deleteProduct('${p.id}')">Delete</button>
                </div>
            </div>`).join('');
    },
    openEdit(id) {
        const product = STATE.products.find(p => String(p.id) === String(id));
        if (!product) { this._fetchAndOpenEdit(id); return; }
        this._populateEditForm(id, product);
    },
    async _fetchAndOpenEdit(id) {
        try { const { data } = await db.from('products').select('*').eq('id', id).single(); if (data) this._populateEditForm(id, data); } catch (e) { console.error(e); }
    },
    _populateEditForm(id, product) {
        document.getElementById('editProductId').value = id;
        document.getElementById('editName').value = product.name || '';
        document.getElementById('editSize').value = product.size || 'Small';
        document.getElementById('editPrice').value = product.price || '';
        document.getElementById('editImage').value = product.image || '';
        document.getElementById('editDescription').value = product.description || '';
        document.getElementById('editProductError').classList.remove('visible');
        document.getElementById('editProductModal').classList.add('active');
        document.getElementById('editName').focus();
    },
    closeEditModal() { document.getElementById('editProductModal').classList.remove('active'); this.editingId = null; },
    async saveEdit() {
        const id = document.getElementById('editProductId').value;
        const name = document.getElementById('editName').value.trim();
        const size = document.getElementById('editSize').value;
        const price = parseInt(document.getElementById('editPrice').value);
        const image = document.getElementById('editImage').value.trim();
        const desc = document.getElementById('editDescription').value.trim();
        const errEl = document.getElementById('editProductError');
        const saveBtn = document.getElementById('editSaveBtn');
        if (!name || !size || !price || price <= 0) { errEl.textContent = 'Name, size and a valid price are required.'; errEl.classList.add('visible'); return; }
        saveBtn.disabled = true; saveBtn.textContent = 'Saving…';
        try {
            const { error } = await db.from('products').update({ name, size, price, category: size.toLowerCase(), image, description: desc }).eq('id', id);
            if (error) throw error;
            this.closeEditModal();
            await this.loadProducts();
            await loadProducts();
            ProductRenderer.render(STATE.currentFilter);
        } catch (e) { errEl.textContent = 'Error: ' + (e.message || 'Unknown error'); errEl.classList.add('visible'); }
        finally { saveBtn.disabled = false; saveBtn.textContent = 'Save Changes'; }
    },
    async deleteProduct(id) {
        if (!confirm('Delete this product? This cannot be undone.')) return;
        try {
            const { error } = await db.from('products').delete().eq('id', id);
            if (error) throw error;
            await this.loadProducts(); await loadProducts(); ProductRenderer.render(STATE.currentFilter);
        } catch (e) { alert('Error: ' + (e.message || 'Unknown error')); }
    },
    async addProduct() {
        const name = document.getElementById('addName').value.trim();
        const size = document.getElementById('addSize').value;
        const price = parseInt(document.getElementById('addPrice').value);
        const image = document.getElementById('addImage').value.trim();
        const desc = document.getElementById('addDescription').value.trim();
        const errEl = document.getElementById('addProductError');
        const sucEl = document.getElementById('addProductSuccess');
        const btn = document.getElementById('addProductBtn');
        errEl.classList.remove('visible'); sucEl.classList.remove('visible');
        if (!name || !size || !price || price <= 0) { errEl.textContent = 'Please fill in name, size and a valid price.'; errEl.classList.add('visible'); return; }
        btn.disabled = true; btn.textContent = 'Adding…';
        try {
            const { error } = await db.from('products').insert([{ name, size, price, category: size.toLowerCase(), image, description: desc }]);
            if (error) throw error;
            ['addName','addPrice','addImage','addDescription'].forEach(id => { document.getElementById(id).value = ''; });
            document.getElementById('addSize').value = '';
            sucEl.textContent = `"${name}" added successfully!`; sucEl.classList.add('visible');
            setTimeout(() => sucEl.classList.remove('visible'), 4000);
            await loadProducts(); ProductRenderer.render(STATE.currentFilter);
        } catch (e) { errEl.textContent = 'Error: ' + (e.message || 'Unknown error'); errEl.classList.add('visible'); }
        finally { btn.disabled = false; btn.textContent = 'Add Product'; }
    }
};

function handleProductGridClick(e) {
    if (e.target.classList.contains('product-image')) { Lightbox.open(e.target.getAttribute('data-product-id')); return; }
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const pid = btn.getAttribute('data-product-id');
    if (action === 'increase-qty') { const inp = document.querySelector(`[data-qty-input="${pid}"]`); if (inp) inp.value = parseInt(inp.value) + 1; }
    if (action === 'decrease-qty') { const inp = document.querySelector(`[data-qty-input="${pid}"]`); if (inp) inp.value = Math.max(1, parseInt(inp.value) - 1); }
    if (action === 'add-to-cart') {
        const inp = document.querySelector(`[data-qty-input="${pid}"]`);
        const qty = inp ? parseInt(inp.value) : 1;
        if (qty > 0) STATE.addToCart(pid, qty);
        CartManager.updateUI(); ProductRenderer.updateAddButtons();
        btn.textContent = '✓ Added'; btn.classList.add('in-cart');
    }
}

function handleCartClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const pid = btn.getAttribute('data-product-id');
    if (action === 'remove-from-cart') { STATE.removeFromCart(pid); CartManager.updateUI(); ProductRenderer.render(STATE.currentFilter); }
    if (action === 'checkout-whatsapp') { Checkout.whatsapp(); }
}

class HeartAnimation {
    constructor() {
        this.canvas = document.getElementById('heroCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.isInteracting = false;
        this.mouse = { x: -1000, y: -1000, radius: 200 };
        this._timeout = null;
        this._init();
    }
    _init() {
        this._resize();
        window.addEventListener('resize', () => this._resize());
        this.canvas.addEventListener('mousemove', e => this._updateMouse(e));
        this.canvas.addEventListener('touchstart', e => this._updateMouse(e), { passive: true });
        this.canvas.addEventListener('touchmove', e => this._updateMouse(e), { passive: true });
        this._animate();
    }
    _resize() {
        this.w = this.canvas.parentElement.offsetWidth;
        this.h = this.canvas.parentElement.offsetHeight;
        this.canvas.width = this.w;
        this.canvas.height = this.h;
        this._buildParticles();
    }
    _updateMouse(e) {
        const t = e.touches ? e.touches[0] : e;
        this.mouse.x = t.clientX; this.mouse.y = t.clientY;
        this.isInteracting = true;
        clearTimeout(this._timeout);
        this._timeout = setTimeout(() => { this.isInteracting = false; }, 150);
    }
    _buildParticles() {
        this.particles = [];
        const n = 2800;
        const scale = Math.min(this.w, this.h) / 450;
        for (let i = 0; i < n; i++) {
            const t = Math.random() * Math.PI * 2;
            const ax = 160 * Math.pow(Math.sin(t), 3);
            const ay = -(130 * Math.cos(t) - 50 * Math.cos(2 * t) - 20 * Math.cos(3 * t) - 10 * Math.cos(4 * t));
            const shade = Math.random();
            const ht = Math.random() * Math.PI * 2;
            const hx = 16 * Math.pow(Math.sin(ht), 3) * 12 * scale;
            const hy = -(13 * Math.cos(ht) - 5 * Math.cos(2 * ht) - 2 * Math.cos(3 * ht) - Math.cos(4 * ht)) * 12 * scale;
            this.particles.push({
                ax: this.w / 2 + ax * scale, ay: this.h / 2 + ay * scale + 50 * scale,
                hx: this.w / 2 + hx, hy: this.h / 2 + hy,
                x: Math.random() * this.w, y: Math.random() * this.h,
                vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
                size: Math.random() * 1.5 + 0.5, shade, sparkle: Math.random() > 0.95
            });
        }
    }
    _animate = () => {
        this.ctx.fillStyle = 'rgba(0,0,0,0.15)';
        this.ctx.fillRect(0, 0, this.w, this.h);
        const { isInteracting, mouse } = this;
        this.particles.forEach(p => {
            const tx = isInteracting ? p.hx : p.ax;
            const ty = isInteracting ? p.hy : p.ay;
            if (isInteracting) {
                const dx = mouse.x - p.x, dy = mouse.y - p.y;
                const dist = Math.hypot(dx, dy);
                if (dist < mouse.radius && dist > 0) {
                    const f = (mouse.radius - dist) / mouse.radius;
                    p.vx -= (dx / dist) * f * 15; p.vy -= (dy / dist) * f * 15;
                }
            }
            p.vx += (tx - p.x) * 0.04; p.vy += (ty - p.y) * 0.04;
            p.vx *= 0.92; p.vy *= 0.92; p.x += p.vx; p.y += p.vy;
            if (isInteracting) {
                const brightness = p.sparkle ? Math.random() * 50 + 50 : 0;
                this.ctx.fillStyle = `hsla(30, 80%, ${55 + brightness}%, 0.9)`;
                this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.sparkle ? p.size * 2.5 : p.size, 0, Math.PI * 2); this.ctx.fill();
            } else {
                const r = 160 + p.shade * 60, g = 80 + p.shade * 40, b = 40 + p.shade * 30;
                this.ctx.fillStyle = `rgba(${r},${g},${b},0.82)`;
                this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); this.ctx.fill();
            }
        });
        requestAnimationFrame(this._animate);
    }
}

async function init() {
    DOM.init(); Lightbox.init(); Admin.init(); STATE.loadCart();
    await loadProducts();
    ProductRenderer.render('all');
    CartManager.updateUI();
    window.addEventListener('scroll', () => { document.querySelector('.navbar').classList.toggle('scrolled', window.scrollY > 20); }, { passive: true });
    DOM.productsGrid.addEventListener('click', handleProductGridClick);
    document.querySelector('.filter-group').addEventListener('click', e => {
        const btn = e.target.closest('.filter-btn'); if (!btn) return;
        DOM.filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active'); ProductRenderer.render(btn.getAttribute('data-filter'));
    });
    DOM.cartBtn.addEventListener('click', () => CartModal.toggle());
    DOM.cartModalClose.addEventListener('click', () => CartModal.close());
    DOM.cartOverlay.addEventListener('click', () => CartModal.close());
    DOM.cartItems.addEventListener('click', handleCartClick);
    DOM.cartFooter.addEventListener('click', handleCartClick);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') CartModal.close(); });
    document.querySelectorAll('.admin-nav-btn').forEach(btn => { btn.addEventListener('click', () => AdminPanel.switchSection(btn.getAttribute('data-section'))); });
    document.getElementById('addProductBtn').addEventListener('click', () => AdminPanel.addProduct());
    document.getElementById('editModalClose').addEventListener('click', () => AdminPanel.closeEditModal());
    document.getElementById('editModalOverlay').addEventListener('click', () => AdminPanel.closeEditModal());
    document.getElementById('editCancelBtn').addEventListener('click', () => AdminPanel.closeEditModal());
    document.getElementById('editSaveBtn').addEventListener('click', () => AdminPanel.saveEdit());
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { new HeartAnimation(); init(); });
} else {
    new HeartAnimation(); init();
}