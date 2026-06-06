'use strict';

// ============================================
// SUPABASE CONFIG — replace these two lines
// ============================================
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

// ============================================
// FALLBACK PRODUCTS (used when Supabase is off)
// ============================================
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

// ============================================
// CONFIG
// ============================================
const CONFIG = {
    WHATSAPP_NUMBER: '2348020536581',  // ← your WhatsApp number here
    STORAGE_KEY: 'bq_pantry_cart_v2'
};

// ============================================
// STATE
// ============================================
const STATE = {
    products: [],
    cart: [],
    currentFilter: 'all',

    loadCart() {
        try {
            const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
            this.cart = raw ? JSON.parse(raw) : [];
        } catch { this.cart = []; }
    },

    saveCart() {
        try { localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this.cart)); } catch {}
    },

    addToCart(productId, qty = 1) {
        const existing = this.cart.find(i => String(i.id) === String(productId));
        if (existing) {
            existing.qty = qty;
        } else {
            const product = this.products.find(p => String(p.id) === String(productId));
            if (!product) return;
            this.cart.push({ id: productId, name: product.name, size: product.size, price: product.price, image: product.image || '', qty });
        }
        this.saveCart();
    },

    removeFromCart(productId) {
        this.cart = this.cart.filter(i => String(i.id) !== String(productId));
        this.saveCart();
    },

    getCartTotal() { return this.cart.reduce((sum, i) => sum + i.price * i.qty, 0); },
    getCartCount() { return this.cart.reduce((sum, i) => sum + i.qty, 0); }
};

// ============================================
// DOM REFS
// ============================================
const DOM = {
    productsGrid: null, filterButtons: null, cartBtn: null, cartModal: null,
    cartOverlay: null, cartItems: null, cartFooter: null, cartCount: null,
    cartModalClose: null,

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

// ============================================
// LOAD PRODUCTS
// ============================================
async function loadProducts() {
    if (db) {
        try {
            const { data, error } = await db.from('products').select('*').order('name', { ascending: true });
            if (!error && data && data.length > 0) {
                STATE.products = data;
                return;
            }
        } catch (e) { console.warn('Supabase fetch failed, using fallback.', e); }
    }
    STATE.products = FALLBACK_PRODUCTS;
}

// ============================================
// PRODUCT RENDERER
// ============================================
const ProductRenderer = {
    render(filter) {
        STATE.currentFilter = filter;
        const list = filter === 'all'
            ? STATE.products
            : STATE.products.filter(p => p.category === filter || p.size?.toLowerCase() === filter);

        if (!list.length) {
            DOM.productsGrid.innerHTML = '<p style="text-align:center;padding:60px;color:var(--brown-light);grid-column:1/-1">No products found.</p>';
            return;
        }

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
                    <img src="${imgSrc}"
                         alt="${p.name} — ${p.size}"
                         class="product-image"
                         data-product-id="${p.id}"
                         loading="lazy"
                         onerror="this.src='https://placehold.co/400x250/EDE5D7/5C3D2E?text=${encodeURIComponent(p.name)}'">
                    <span class="product-badge">${p.size}</span>
                </div>
                <div class="product-info">
                    <div class="product-name">${p.name}</div>
                    <div class="product-size">${p.size} size</div>
                    <div class="product-description">${p.description || ''}</div>
                    <div class="product-price">₦${Number(p.price).toLocaleString()}</div>
                    <div class="product-controls">
                        <div class="qty-control">
                            <button class="qty-btn" data-action="decrease-qty" data-product-id="${p.id}">−</button>
                            <input type="number" class="qty-input" value="${qty}" min="1" max="99" data-qty-input="${p.id}">
                            <button class="qty-btn" data-action="increase-qty" data-product-id="${p.id}">+</button>
                        </div>
                        <button class="add-to-cart-btn ${inCart ? 'in-cart' : ''}" data-action="add-to-cart" data-product-id="${p.id}">
                            ${inCart ? '✓ Added' : 'Add to Cart'}
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

// ============================================
// CART MANAGER
// ============================================
const CartManager = {
    updateUI() {
        DOM.cartCount.textContent = STATE.getCartCount();

        if (!STATE.cart.length) {
            DOM.cartItems.innerHTML = '<p class="empty-message">Your cart is empty 🥣</p>';
            DOM.cartFooter.innerHTML = '';
            return;
        }

        DOM.cartItems.innerHTML = STATE.cart.map(item => `
            <div class="cart-item">
                <img src="${item.image || ''}" alt="${item.name}" class="cart-item-img"
                    onerror="this.src='https://placehold.co/54x54/EDE5D7/5C3D2E?text=BQ'">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-meta">${item.size} · Qty: ${item.qty}</div>
                </div>
                <div class="cart-item-price">₦${(item.price * item.qty).toLocaleString()}</div>
                <button class="cart-remove-btn" data-action="remove-from-cart" data-product-id="${item.id}">×</button>
            </div>`).join('');

        DOM.cartFooter.innerHTML = `
            <div class="cart-total-row">
                <span class="cart-total-label">Total</span>
                <span class="cart-total-amount">₦${STATE.getCartTotal().toLocaleString()}</span>
            </div>
            <button class="checkout-wa-btn" data-action="checkout-whatsapp">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-9.746 9.798c0 2.734.748 5.41 2.164 7.723L3.513 21.3l8.332-2.189a9.9 9.9 0 004.773 1.215h.004c5.396 0 9.747-4.363 9.747-9.798a9.872 9.872 0 00-9.747-9.798"/></svg>
                Enquire on WhatsApp
            </button>`;
    }
};

// ============================================
// CART MODAL
// ============================================
const CartModal = {
    open() {
        DOM.cartModal.classList.add('active');
        DOM.cartOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        DOM.cartModalClose.focus();
    },
    close() {
        DOM.cartModal.classList.remove('active');
        DOM.cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
        DOM.cartBtn.focus();
    },
    toggle() { DOM.cartModal.classList.contains('active') ? this.close() : this.open(); }
};

// ============================================
// CHECKOUT
// ============================================
const Checkout = {
    whatsapp() {
        if (!STATE.cart.length) return;
        const lines = STATE.cart.map(i => `• ${i.name} (${i.size}) × ${i.qty} = ₦${(i.price * i.qty).toLocaleString()}`).join('\n');
        const total = `\n\n*Total: ₦${STATE.getCartTotal().toLocaleString()}*`;
        const msg = `Hello BQ Pantry! 👋\nI'd like to order the following:\n\n${lines}${total}\n\nPlease let me know about availability and delivery. Thank you!`;
        window.open(`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    }
};

// ============================================
// LIGHTBOX
// ============================================
const Lightbox = {
    images: [], currentIndex: 0,
    el: null, imgEl: null, titleEl: null, sizeEl: null, priceEl: null, counterEl: null,

    init() {
        this.el        = document.getElementById('imageLightbox');
        this.imgEl     = document.getElementById('lightboxImage');
        this.titleEl   = document.getElementById('lightboxTitle');
        this.sizeEl    = document.getElementById('lightboxSize');
        this.priceEl   = document.getElementById('lightboxPrice');
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

    close() {
        this.el.classList.remove('active');
        document.body.style.overflow = '';
    },

    previous() { this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length; this.update(); },
    next()     { this.currentIndex = (this.currentIndex + 1) % this.images.length; this.update(); },

    update() {
        const p = this.images[this.currentIndex];
        this.imgEl.src = p.image || `https://placehold.co/600x400/EDE5D7/5C3D2E?text=${encodeURIComponent(p.name)}`;
        this.imgEl.alt = `${p.name} — ${p.size}`;
        this.titleEl.textContent  = p.name;
        this.sizeEl.textContent   = `${p.size} size`;
        this.priceEl.textContent  = `₦${Number(p.price).toLocaleString()}`;
        this.counterEl.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
    }
};

// ============================================
// ADMIN AUTH
// ============================================
const Admin = {
    isLoggedIn: false,
    loginModal: null,

    init() {
        this.loginModal = document.getElementById('adminLoginModal');

        document.getElementById('adminTrigger').addEventListener('click', () => this.showLoginModal());
        document.getElementById('adminLoginClose').addEventListener('click', () => this.hideLoginModal());
        document.getElementById('adminLoginOverlay').addEventListener('click', () => this.hideLoginModal());
        document.getElementById('adminLoginBtn').addEventListener('click', () => this.login());
        document.getElementById('adminLogoutBtn').addEventListener('click', () => this.logout());

        document.getElementById('adminPassword').addEventListener('keydown', e => {
            if (e.key === 'Enter') this.login();
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && this.loginModal.classList.contains('active')) this.hideLoginModal();
        });

        if (db) {
            db.auth.getSession().then(({ data }) => {
                if (data.session) {
                    this.isLoggedIn = true;
                    document.getElementById('adminUserInfo').textContent = data.session.user.email;
                }
            });
        }
    },

    showLoginModal() {
        this.loginModal.classList.add('active');
        document.getElementById('adminLoginError').classList.remove('visible');
        document.getElementById('adminEmail').focus();
    },

    hideLoginModal() {
        this.loginModal.classList.remove('active');
    },

    async login() {
        const email   = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value;
        const errEl   = document.getElementById('adminLoginError');
        const btn     = document.getElementById('adminLoginBtn');
        const btnText = document.getElementById('adminLoginBtnText');

        errEl.classList.remove('visible');

        if (!email || !password) {
            errEl.textContent = 'Please enter email and password.';
            errEl.classList.add('visible');
            return;
        }

        if (!db) {
            errEl.textContent = 'Supabase is not configured. Add your SUPABASE_URL and SUPABASE_ANON_KEY to script.js.';
            errEl.classList.add('visible');
            return;
        }

        btn.disabled = true;
        btnText.textContent = 'Signing in…';

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
        } finally {
            btn.disabled = false;
            btnText.textContent = 'Sign In';
        }
    },

    async logout() {
        if (db) { try { await db.auth.signOut(); } catch {} }
        this.isLoggedIn = false;
        AdminPanel.hidePanel();
    }
};

// ============================================
// ADMIN PANEL CRUD
// ============================================
const AdminPanel = {
    currentSection: 'products',
    editingId: null,

    showPanel() {
        const panel = document.getElementById('adminPanel');
        panel.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.loadProducts();
    },

    hidePanel() {
        document.getElementById('adminPanel').classList.remove('active');
        document.body.style.overflow = '';
    },

    switchSection(section) {
        document.querySelectorAll('.admin-section').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.admin-nav-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`adminSection${section.charAt(0).toUpperCase() + section.slice(1)}`).classList.add('active');
        document.querySelector(`[data-section="${section}"]`).classList.add('active');
        const titles = { products: 'Products', add: 'Add New Product' };
        document.getElementById('adminPageTitle').textContent = titles[section] || section;
    },

    async loadProducts() {
        const list = document.getElementById('adminProductList');
        l