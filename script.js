/**
 * BQ Pantry - Production-Grade E-Commerce Application
 * High-performance vanilla JavaScript with zero framework dependencies
 * Optimized for 60fps animations and smooth UX
 */

'use strict';

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    PRODUCTS: [
        { id: 1, name: 'Moon and Star', size: 'Big', price: 7000, category: 'big', image: 'product-1.jpg' },
        { id: 2, name: 'Cornflakes', size: 'Small', price: 1000, category: 'small', image: 'product-2.jpg' },
        { id: 3, name: 'Moon and Star', size: 'Small', price: 1000, category: 'small', image: 'product-3.jpg' },
        { id: 4, name: 'Golden Morn', size: 'Small', price: 1000, category: 'small', image: 'product-4.jpg' },
        { id: 5, name: 'Fresh Milk', size: 'Small', price: 1500, category: 'small', image: 'product-5.jpg' },
        { id: 6, name: 'Custard', size: 'Small', price: 1000, category: 'small', image: 'product-6.jpg' },
        { id: 7, name: 'Moon and Star', size: 'Medium', price: 5000, category: 'medium', image: 'product-7.jpg' },
        { id: 8, name: 'Milo', size: 'Small', price: 2000, category: 'small', image: 'product-8.jpg' },
        { id: 9, name: 'Rolled Oats', size: 'Medium', price: 5000, category: 'medium', image: 'product-9.jpg' },
        { id: 10, name: 'Coco Pops', size: 'Medium', price: 5000, category: 'medium', image: 'product-10.jpg' },
        { id: 11, name: 'Oats', size: 'Medium', price: 5000, category: 'medium', image: 'product-11.jpg' },
        { id: 12, name: 'Fresh Milk', size: 'Big', price: 5000, category: 'big', image: 'product-12.jpg' },
        { id: 13, name: 'Coco Pops', size: 'Small', price: 3000, category: 'small', image: 'product-13.jpg' }
    ],
    STORAGE_KEY: 'bq_pantry_cart',
    WHATSAPP_NUMBER: '2348020536581',
    EMAIL: 'beautyquintessentpantry@gmail.com'
};

// ============================================
// DOM ELEMENT CACHE
// ============================================
const DOM = {
    productsGrid: null,
    filterButtons: null,
    cartBtn: null,
    cartModal: null,
    cartOverlay: null,
    cartItems: null,
    cartFooter: null,
    cartCount: null,
    modalClose: null,

    init() {
        this.productsGrid = document.querySelector('.products-grid');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.cartBtn = document.querySelector('.cart-btn');
        this.cartModal = document.getElementById('cartModal');
        this.cartOverlay = document.getElementById('cartOverlay');
        this.cartItems = document.querySelector('.cart-items');
        this.cartFooter = document.getElementById('cartFooter');
        this.cartCount = document.querySelector('.cart-count');
        this.modalClose = document.querySelector('.modal-close');
    }
};

// ============================================
// STATE MANAGEMENT
// ============================================
const STATE = {
    cart: [],
    currentFilter: 'all',

    loadCart() {
        try {
            const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
            this.cart = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load cart:', error);
            this.cart = [];
        }
    },

    saveCart() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this.cart));
        } catch (error) {
            console.error('Failed to save cart:', error);
            if (error.name === 'QuotaExceededError') {
                alert('Storage quota exceeded. Please clear your cart.');
            }
        }
    },

    addToCart(productId, quantity) {
        const product = CONFIG.PRODUCTS.find(p => p.id === productId);
        if (!product || quantity <= 0) return;

        const existingItem = this.cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity = quantity;
        } else {
            this.cart.push({ ...product, quantity });
        }

        this.saveCart();
    },

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
    },

    getCartTotal() {
        return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },

    getCartCount() {
        return this.cart.reduce((sum, item) => sum + item.quantity, 0);
    }
};

// ============================================
// PRODUCT RENDERING
// ============================================
const ProductRenderer = {
    render(filter = 'all') {
        STATE.currentFilter = filter;
        const filtered = filter === 'all' 
            ? CONFIG.PRODUCTS 
            : CONFIG.PRODUCTS.filter(p => p.category === filter);

        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();

        filtered.forEach(product => {
            const cartItem = STATE.cart.find(item => item.id === product.id);
            const quantity = cartItem ? cartItem.quantity : 0;

            const card = this.createProductCard(product, quantity);
            fragment.appendChild(card);
        });

        DOM.productsGrid.innerHTML = '';
        DOM.productsGrid.appendChild(fragment);
    },

    createProductCard(product, quantity) {
        const card = document.createElement('div');
        card.className = 'product-card';

        card.innerHTML = `
            <img 
                src="${product.image}" 
                alt="${this.escapeHtml(product.name)} - ${product.size} size" 
                class="product-image"
                loading="lazy"
                decoding="async"
            >
            <div class="product-info">
                <h3 class="product-name">${this.escapeHtml(product.name)}</h3>
                <p class="product-size">${product.size}</p>
                <p class="product-price">₦${product.price.toLocaleString()}</p>
                <div class="product-actions">
                    <div class="qty-control">
                        <button 
                            class="qty-btn" 
                            aria-label="Decrease quantity"
                            data-action="decrease-qty"
                            data-product-id="${product.id}"
                        >−</button>
                        <input 
                            type="number" 
                            class="qty-input" 
                            value="${quantity}" 
                            readonly
                            aria-label="Quantity for ${this.escapeHtml(product.name)}"
                            data-qty-input="${product.id}"
                        >
                        <button 
                            class="qty-btn" 
                            aria-label="Increase quantity"
                            data-action="increase-qty"
                            data-product-id="${product.id}"
                        >+</button>
                    </div>
                    <button 
                        class="add-btn" 
                        aria-label="${quantity > 0 ? 'Update' : 'Add'} ${this.escapeHtml(product.name)} to cart"
                        data-action="add-to-cart"
                        data-product-id="${product.id}"
                    >${quantity > 0 ? 'UPDATE' : 'ADD'}</button>
                </div>
            </div>
        `;

        return card;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ============================================
// CART MANAGEMENT
// ============================================
const CartManager = {
    updateUI() {
        this.updateCount();
        this.renderCartItems();
    },

    updateCount() {
        const count = STATE.getCartCount();
        DOM.cartCount.textContent = count;
        DOM.cartCount.setAttribute('aria-label', `${count} items in cart`);
    },

    renderCartItems() {
        if (STATE.cart.length === 0) {
            DOM.cartItems.innerHTML = '<p class="empty-message">Your cart is empty</p>';
            DOM.cartFooter.innerHTML = '';
            return;
        }

        const itemsHtml = STATE.cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${ProductRenderer.escapeHtml(item.name)}</h4>
                    <p>x${item.quantity}</p>
                </div>
                <div class="cart-item-price">₦${(item.price * item.quantity).toLocaleString()}</div>
                <button 
                    class="remove-item" 
                    aria-label="Remove ${ProductRenderer.escapeHtml(item.name)} from cart"
                    data-action="remove-from-cart"
                    data-product-id="${item.id}"
                >🗑</button>
            </div>
        `).join('');

        DOM.cartItems.innerHTML = itemsHtml;
        this.renderCheckout();
    },

    renderCheckout() {
        const total = STATE.getCartTotal();
        const checkoutHtml = `
            <div class="cart-summary">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>₦${total.toLocaleString()}</span>
                </div>
                <div class="summary-row">
                    <span>Delivery:</span>
                    <span>Varies by location</span>
                </div>
                <div class="summary-total">
                    <span>Total:</span>
                    <span>₦${total.toLocaleString()}</span>
                </div>
            </div>
            <div class="checkout-btns">
                <button 
                    class="checkout-btn whatsapp-btn" 
                    data-action="checkout-whatsapp"
                    aria-label="Checkout via WhatsApp"
                >
                    <span>💬</span> Order via WhatsApp
                </button>
                <button 
                    class="checkout-btn email-btn" 
                    data-action="checkout-email"
                    aria-label="Checkout via Email"
                >
                    <span>✉</span> Send Email Order
                </button>
            </div>
        `;
        DOM.cartFooter.innerHTML = checkoutHtml;
    }
};

// ============================================
// CHECKOUT FUNCTIONALITY
// ============================================
const Checkout = {
    whatsapp() {
        if (STATE.cart.length === 0) return;

        const total = STATE.getCartTotal();
        let message = '*BQ PANTRY ORDER*\n\n';
        
        STATE.cart.forEach(item => {
            message += `• ${item.name} (${item.size}) x${item.quantity} = ₦${(item.price * item.quantity).toLocaleString()}\n`;
        });

        message += `\n*Total: ₦${total.toLocaleString()}*\n\nPlease confirm order details and delivery location.`;

        const encoded = encodeURIComponent(message);
        const url = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encoded}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    },

    email() {
        if (STATE.cart.length === 0) return;

        const total = STATE.getCartTotal();
        let items = '';

        STATE.cart.forEach(item => {
            items += `${item.name} (${item.size}) x${item.quantity} = ₦${(item.price * item.quantity).toLocaleString()}\n`;
        });

        const body = encodeURIComponent(
            `New Order from BQ Pantry:\n\n${items}\nTotal: ₦${total.toLocaleString()}\n\nPlease confirm delivery location and arrange payment.`
        );

        window.location.href = `mailto:${CONFIG.EMAIL}?subject=New Order from BQ Pantry&body=${body}`;
    }
};

// ============================================
// MODAL MANAGEMENT
// ============================================
const Modal = {
    open() {
        DOM.cartModal.classList.add('active');
        DOM.cartOverlay.classList.add('active');
        DOM.cartModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        
        // Focus on close button for accessibility
        DOM.modalClose.focus();
    },

    close() {
        DOM.cartModal.classList.remove('active');
        DOM.cartOverlay.classList.remove('active');
        DOM.cartModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        
        // Return focus to cart button
        DOM.cartBtn.focus();
    },

    toggle() {
        if (DOM.cartModal.classList.contains('active')) {
            this.close();
        } else {
            this.open();
        }
    }
};

// ============================================
// EVENT DELEGATION
// ============================================
const EventHandler = {
    handleProductAction(event) {
        const button = event.target.closest('[data-action]');
        if (!button) return;

        const action = button.getAttribute('data-action');
        const productId = parseInt(button.getAttribute('data-product-id'));

        switch (action) {
            case 'increase-qty':
                this.increaseQty(productId);
                break;
            case 'decrease-qty':
                this.decreaseQty(productId);
                break;
            case 'add-to-cart':
                this.addToCart(productId);
                break;
            case 'remove-from-cart':
                STATE.removeFromCart(productId);
                CartManager.updateUI();
                ProductRenderer.render(STATE.currentFilter);
                break;
        }
    },

    handleCartAction(event) {
        const button = event.target.closest('[data-action]');
        if (!button) return;

        const action = button.getAttribute('data-action');

        switch (action) {
            case 'remove-from-cart':
                const productId = parseInt(button.getAttribute('data-product-id'));
                STATE.removeFromCart(productId);
                CartManager.updateUI();
                ProductRenderer.render(STATE.currentFilter);
                break;
            case 'checkout-whatsapp':
                Checkout.whatsapp();
                break;
            case 'checkout-email':
                Checkout.email();
                break;
        }
    },

    handleFilter(event) {
        const button = event.target.closest('.filter-btn');
        if (!button) return;

        // Update active state
        DOM.filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Render products
        const filter = button.getAttribute('data-filter');
        ProductRenderer.render(filter);
    },

    increaseQty(productId) {
        const input = document.querySelector(`[data-qty-input="${productId}"]`);
        if (input) {
            input.value = parseInt(input.value) + 1;
        }
    },

    decreaseQty(productId) {
        const input = document.querySelector(`[data-qty-input="${productId}"]`);
        if (input) {
            const value = Math.max(0, parseInt(input.value) - 1);
            input.value = value;
        }
    },

    addToCart(productId) {
        const input = document.querySelector(`[data-qty-input="${productId}"]`);
        if (!input) return;

        const quantity = parseInt(input.value);
        if (quantity <= 0) {
            STATE.removeFromCart(productId);
        } else {
            STATE.addToCart(productId, quantity);
        }

        CartManager.updateUI();
        ProductRenderer.render(STATE.currentFilter);
    }
};

// ============================================
// INITIALIZATION
// ============================================
function init() {
    // Initialize DOM cache
    DOM.init();

    // Load cart from storage
    STATE.loadCart();

    // Render initial products
    ProductRenderer.render('all');

    // Update cart UI
    CartManager.updateUI();

    // Event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Product grid delegation
    DOM.productsGrid.addEventListener('click', EventHandler.handleProductAction.bind(EventHandler));

    // Filter buttons
    document.querySelector('.filter-group').addEventListener('click', EventHandler.handleFilter.bind(EventHandler));

    // Cart button
    DOM.cartBtn.addEventListener('click', () => Modal.toggle());

    // Modal close button
    DOM.modalClose.addEventListener('click', () => Modal.close());

    // Modal overlay click
    DOM.cartOverlay.addEventListener('click', () => Modal.close());

    // Cart items delegation
    DOM.cartItems.addEventListener('click', EventHandler.handleCartAction.bind(EventHandler));
    DOM.cartFooter.addEventListener('click', EventHandler.handleCartAction.bind(EventHandler));

    // Close modal on Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && DOM.cartModal.classList.contains('active')) {
            Modal.close();
        }
    });

    // Prevent closing modal when clicking inside it
    DOM.cartModal.addEventListener('click', (event) => {
        if (event.target === DOM.cartModal) {
            Modal.close();
        }
    });
}

// ============================================
// START APPLICATION
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Optional: Service Worker for offline support (PWA)
if ('serviceWorker' in navigator) {
    // Uncomment to enable service worker
    // navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration failed'));
}
