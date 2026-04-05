// AgroMarket — Supabase Configuration
// Using same Supabase project as AgroVision

const SUPABASE_URL = 'https://wqvluvtptzhwhwfjdffx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indxdmx1dnRwdHpod2h3ZmpkZmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NzgxOTIsImV4cCI6MjA5MDE1NDE5Mn0.GlsKjl1apWyIAja4rBc-7yQ9BMTNouO5wkY-Py_pFZ4'; // WARNING: This looks like a management key, not an Anon Key.
// Initialize Supabase client
// We use window.supabase to access the library and assign the instance back to a global variable
if (window.supabase && typeof window.supabase.createClient === 'function') {
  window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.error("Supabase library not loaded correctly.");
}

// === SELLER SESSION (localStorage-based) ===
function getSellerSession() {
  const data = localStorage.getItem('agromarket_seller');
  return data ? JSON.parse(data) : null;
}

function setSellerSession(seller) {
  localStorage.setItem('agromarket_seller', JSON.stringify(seller));
}

function clearSellerSession() {
  localStorage.removeItem('agromarket_seller');
}

function isSellerLoggedIn() {
  return getSellerSession() !== null;
}

function requireSellerLogin() {
  if (!isSellerLoggedIn()) {
    window.location.href = 'seller-login.html';
    return false;
  }
  return true;
}

function sellerLogout() {
  clearSellerSession();
  showToast('Logged out successfully', 'success');
  setTimeout(() => window.location.href = 'seller-login.html', 1000);
}

// === LOGOUT CONFIRMATION MODAL ===
function showLogoutConfirm() {
  // Remove existing modal if any
  const existing = document.getElementById('logoutModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'logoutModal';
  modal.innerHTML = `
    <div class="logout-overlay" onclick="dismissLogoutModal()">
      <div class="logout-dialog" onclick="event.stopPropagation()">
        <div class="logout-icon">⚠️</div>
        <h3>Confirm Logout</h3>
        <p>Are you sure you want to logout? You will need to sign in again to access your dashboard.</p>
        <div class="logout-actions">
          <button class="logout-cancel-btn" onclick="dismissLogoutModal()">Cancel</button>
          <button class="logout-confirm-btn" onclick="confirmLogout()">Yes, Logout</button>
        </div>
      </div>
    </div>
  `;

  // Inject scoped styles
  const style = document.createElement('style');
  style.id = 'logoutModalStyles';
  style.textContent = `
    .logout-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      animation: logoutFadeIn 0.2s ease;
    }
    .logout-dialog {
      background: linear-gradient(145deg, #1e293b, #0f172a);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 32px;
      max-width: 400px;
      width: 90%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      animation: logoutSlideUp 0.25s ease;
    }
    .logout-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }
    .logout-dialog h3 {
      color: #f59e0b;
      font-size: 20px;
      margin-bottom: 10px;
    }
    .logout-dialog p {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .logout-actions {
      display: flex;
      gap: 12px;
    }
    .logout-cancel-btn, .logout-confirm-btn {
      flex: 1;
      padding: 12px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }
    .logout-cancel-btn {
      background: #1e293b;
      color: #cbd5e1;
      border: 1px solid #334155;
    }
    .logout-cancel-btn:hover {
      background: #334155;
    }
    .logout-confirm-btn {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
    }
    .logout-confirm-btn:hover {
      background: linear-gradient(135deg, #dc2626, #b91c1c);
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
    }
    @keyframes logoutFadeIn {
      from { opacity: 0; } to { opacity: 1; }
    }
    @keyframes logoutSlideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(modal);
}

function dismissLogoutModal() {
  const modal = document.getElementById('logoutModal');
  const styles = document.getElementById('logoutModalStyles');
  if (modal) modal.remove();
  if (styles) styles.remove();
}

function confirmLogout() {
  dismissLogoutModal();
  sellerLogout();
}

// === TOAST NOTIFICATION ===
function showToast(message, type = 'info') {
  // Remove any existing toast
  document.querySelectorAll('.toast').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
    ${message}
  `;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// === URL HELPERS ===
function getUrlParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// === PRICE FORMATTER ===
function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

// === NAVBAR SCROLL EFFECT ===
document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    });
  }

  // Mobile menu toggle
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      toggle.classList.toggle('active');
    });
  }

  // Update cart badge
  updateCartBadge();
});

// === CART HELPERS (localStorage) ===
function getCart() {
  return JSON.parse(localStorage.getItem('agromarket_cart') || '[]');
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  localStorage.setItem('agromarket_cart', JSON.stringify(cart));
  updateCartBadge();
  showToast('Added to cart!', 'success');
}

function removeFromCart(productId) {
  const cart = getCart().filter(item => item.id !== productId);
  localStorage.setItem('agromarket_cart', JSON.stringify(cart));
  updateCartBadge();
}

function updateCartQuantity(productId, quantity) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (item) {
    item.quantity = Math.max(1, quantity);
    localStorage.setItem('agromarket_cart', JSON.stringify(cart));
    updateCartBadge();
  }
}

function clearCart() {
  localStorage.removeItem('agromarket_cart');
  updateCartBadge();
}

function getCartTotal() {
  return getCart().reduce((sum, item) => {
    const price = item.discount_price || item.price;
    return sum + (price * item.quantity);
  }, 0);
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

function updateCartBadge() {
  const badges = document.querySelectorAll('.cart-count');
  const count = getCartCount();
  badges.forEach(badge => {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  });
}

// === IMAGE UPLOAD HELPER ===
async function uploadImage(file, bucket = 'product-images') {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return publicUrl;
}

// === DEBOUNCE HELPER ===
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
