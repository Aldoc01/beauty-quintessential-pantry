// Products Data
const PRODUCTS = [
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
];

let cart = [];
let activeFilter = 'all';

// Load cart from storage
function loadCart() {
    try {
        const saved = localStorage.getItem('bq_cart');
        if (saved) cart = JSON.parse(saved);
    } catch (e) {
        console.log('Cart load error:', e);
    }
}

// Save cart to storage
function saveCart() {
    localStorage.setItem('bq_cart', JSON.stringify(cart));
}

// Render products
function renderProducts(filter = 'all') {
    activeFilter = filter;
    const grid = document.getElementById('productsGrid');
    const filtered = filter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.category === filter);

    grid.innerHTML = filtered.map(product => {
        const cartItem = cart.find(item => item.id === product.id);
        const qty = cartItem ? cartItem.quantity : 0;

        return `
            <div class="product-card">
                <img src="${product.image}" alt="${product.name}" class="product-img" onclick="openLightbox(${product.id})">
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-size">${product.size}</p>
                    <p class="product-price">₦${product.price.toLocaleString()}</p>
                    <div class="product-actions">
                        <div class="qty-box">
                            <button onclick="decreaseQty(${product.id})">−</button>
                            <input type="number" id="qty-${product.id}" value="${qty}" readonly>
                            <button onclick="increaseQty(${product.id})">+</button>
                        </div>
                        <button class="add-btn" onclick="addToCart(${product.id})">${qty > 0 ? 'UPDATE' : 'ADD'}</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Quantity functions
function increaseQty(id) {
    const input = document.getElementById(`qty-${id}`);
    input.value = parseInt(input.value) + 1;
}

function decreaseQty(id) {
    const input = document.getElementById(`qty-${id}`);
    if (parseInt(input.value) > 0) input.value = parseInt(input.value) - 1;
}

// Add to cart
function addToCart(id) {
    const input = document.getElementById(`qty-${id}`);
    const qty = parseInt(input.value);
    const product = PRODUCTS.find(p => p.id === id);

    if (qty <= 0) {
        cart = cart.filter(item => item.id !== id);
    } else {
        const existing = cart.find(item => item.id === id);
        if (existing) {
            existing.quantity = qty;
        } else {
            cart.push({ ...product, quantity: qty });
        }
    }

    saveCart();
    updateCartDisplay();
    renderProducts(activeFilter);
}

// Remove from cart
function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartDisplay();
    renderProducts(activeFilter);
}

// Update cart display
function updateCartDisplay() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartBadge').textContent = count;

    const itemsContainer = document.getElementById('cartItems');
    const footerContainer = document.getElementById('cartFooter');

    if (cart.length === 0) {
        itemsContainer.innerHTML = '<p class="empty">Your cart is empty</p>';
        footerContainer.innerHTML = '';
        return;
    }

    itemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div>
                <h4>${item.name}</h4>
                <p>x${item.quantity}</p>
            </div>
            <div style="font-weight: 900; color: #C96C4A;">₦${(item.price * item.quantity).toLocaleString()}</div>
            <button class="remove-btn" onclick="removeFromCart(${item.id})">🗑</button>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    footerContainer.innerHTML = `
        <div class="cart-summary">
            <div class="summary-row">
                <span>Subtotal:</span>
                <span>₦${total.toLocaleString()}</span>
            </div>
            <div class="summary-total">
                <span>Total:</span>
                <span>₦${total.toLocaleString()}</span>
            </div>
        </div>
        <div class="checkout-btns">
            <button class="checkout-btn whatsapp-btn" onclick="checkoutWhatsApp()">💬 WhatsApp</button>
            <button class="checkout-btn email-btn" onclick="checkoutEmail()">✉ Email</button>
        </div>
    `;
}

// Checkout via WhatsApp
function checkoutWhatsApp() {
    if (cart.length === 0) return;
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let msg = '*BQ PANTRY ORDER*\n\n';
    cart.forEach(item => {
        msg += `• ${item.name} x${item.quantity} = ₦${(item.price * item.quantity).toLocaleString()}\n`;
    });
    msg += `\n*Total: ₦${total.toLocaleString()}*`;
    
    window.open(`https://wa.me/2348020536581?text=${encodeURIComponent(msg)}`, '_blank');
}

// Checkout via Email
function checkoutEmail() {
    if (cart.length === 0) return;
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let items = '';
    cart.forEach(item => {
        items += `${item.name} x${item.quantity} = ₦${(item.price * item.quantity).toLocaleString()}\n`;
    });
    
    const body = encodeURIComponent(`Order:\n\n${items}\nTotal: ₦${total.toLocaleString()}`);
    window.location.href = `mailto:beautyquintessentpantry@gmail.com?subject=New Order&body=${body}`;
}

// Filter products
function filterProducts(category) {
    document.querySelectorAll('.filter').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderProducts(category);
}

// Cart modal
function openCart() {
    document.getElementById('cartModal').classList.add('show');
}

function closeCart() {
    document.getElementById('cartModal').classList.remove('show');
}

// Lightbox
function openLightbox(id) {
    const product = PRODUCTS.find(p => p.id === id);
    if (!product) return;
    
    document.getElementById('lightboxImg').src = product.image;
    document.getElementById('lightboxTitle').textContent = product.name;
    document.getElementById('lightboxPrice').textContent = `₦${product.price.toLocaleString()} - ${product.size}`;
    document.getElementById('lightbox').classList.add('show');
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('show');
}

// Heart Animation
class HeartAnimation {
    constructor() {
        this.canvas = document.getElementById('heroCanvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.width = 0;
        this.height = 0;
        this.mouse = { x: -1000, y: -1000, radius: 200 };
        this.isInteracting = false;
        
        this.init();
    }
    
    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.canvas.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            this.isInteracting = true;
        });
        this.animate();
    }
    
    resize() {
        this.width = this.canvas.offsetWidth;
        this.height = this.canvas.offsetHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        this.particles = [];
        const count = 1500;
        const scale = Math.min(this.width, this.height) / 450;
        
        for (let i = 0; i < count; i++) {
            const t = Math.random() * Math.PI * 2;
            const r = Math.random();
            let ax = 160 * Math.pow(Math.sin(t), 3);
            let ay = -(130 * Math.cos(t) - 50 * Math.cos(2 * t) - 20 * Math.cos(3 * t) - 10 * Math.cos(4 * t));
            
            let shade = r;
            if (t > 1.2 && t < 2.2) {
                ay -= 120 * r;
                ax -= 30 * r;
                shade = 0.3;
            }
            
            this.particles.push({
                x: this.width / 2 + ax * scale,
                y: this.height / 2 + ay * scale,
                ax: ax * scale,
                ay: ay * scale,
                vx: 0,
                vy: 0,
                shade: shade,
                size: Math.random() * 1.5 + 0.5
            });
        }
    }
    
    animate = () => {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.particles.forEach(p => {
            let tx = this.isInteracting ? this.width / 2 : p.ax;
            let ty = this.isInteracting ? this.height / 2 : p.ay;
            
            p.vx += (tx - p.x) * 0.04;
            p.vy += (ty - p.y) * 0.04;
            p.vx *= 0.92;
            p.vy *= 0.92;
            p.x += p.vx;
            p.y += p.vy;
            
            const r = 120 + p.shade * 80;
            const g = 20 + p.shade * 30;
            const b = 30 + p.shade * 40;
            this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        requestAnimationFrame(this.animate);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    new HeartAnimation();
    loadCart();
    renderProducts();
    updateCartDisplay();
    
    // Close modals when clicking outside
    document.getElementById('cartModal').addEventListener('click', (e) => {
        if (e.target.id === 'cartModal') closeCart();
    });
    
    document.getElementById('lightbox').addEventListener('click', (e) => {
        if (e.target.id === 'lightbox') closeLightbox();
    });
});
