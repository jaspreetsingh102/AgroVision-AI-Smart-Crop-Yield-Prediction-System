// AI Farmer Login - Redesigned Tabs Auth (Simple & Clean)
// Mock auth + guest + localStorage - full workflow preserved

const mockUsers = {
  'demo@farmer.com': 'demo123',
  'test@farmer.com': 'test123'
};

// Elements
const tabBtns = document.querySelectorAll('.tab-btn');
const authForms = document.querySelectorAll('.auth-form');
const guestBtn = document.getElementById('guestBtn');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

// === TABS ===
tabBtns.forEach(btn => {
  btn.onclick = () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    authForms.forEach(f => f.classList.remove('active'));
    
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab + 'Form').classList.add('active');
  };
});

// === AUTH HANDLERS ===
async function handleAuth(formId, isSignup = false) {
  const form = document.getElementById(formId);
  
  const email = document.getElementById(isSignup ? 'signupEmail' : 'loginEmail').value;
  const password = document.getElementById(isSignup ? 'signupPassword' : 'loginPassword').value;
  
  let payload = { email, password };
  
  if (isSignup) {
    const name = document.getElementById('signupName').value;
    
    if (password.length < 6) return showError('Password must be 6+ characters');
    
    payload.name = name;
  }

  try {
    const endpoint = isSignup ? '/signup' : '/login';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (response.ok) {
      localStorage.setItem('authUser', email);
      localStorage.setItem('authType', 'user');
      if (result.user && result.user.name) localStorage.setItem('userName', result.user.name);
      
      showSuccess(result.message || (isSignup ? 'Account created!' : 'Welcome back!'), () => {
        window.location.href = 'frountend/pages/farm-details.html';
      });
    } else {
      // Fallback to mock for demo credentials if the database doesn't have them yet
      if (!isSignup && mockUsers[email] === password) {
        localStorage.setItem('authUser', email);
        return showSuccess('Welcome back (Demo Mode)!', () => {
          window.location.href = 'frountend/pages/farm-details.html';
        });
      }
      showError(result.message || 'Authentication failed');
    }
  } catch (err) {
    showError('Connection error. Check if backend is running.');
  }
}

// === GUEST ===
guestBtn.onclick = () => {
  localStorage.setItem('authUser', 'guest');
  localStorage.setItem('authType', 'guest');
  showSuccess('Guest mode activated!', () => {
    window.location.href = 'frountend/pages/farm-details.html';
  });
};

// === UTILS ===
function showSuccess(msg, callback) {
  const btn = document.querySelector('.btn-primary');
  const originalHTML = btn.innerHTML;
  
  btn.innerHTML = `<i class="fas fa-check"></i> ${msg}`;
  btn.disabled = true;
  
  setTimeout(() => {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
    callback();
  }, 1800);
}

function showError(msg) {
  const card = document.querySelector('.main-card');
  let error = card.querySelector('.error-msg');
  
  if (error) error.remove();
  
  error = document.createElement('div');
  error.className = 'error-msg';
  error.style.cssText = `
    background: rgba(239, 68, 68, 0.15); 
    border: 1px solid #ef4444;
    border-radius: var(--radius-md);
    padding: 1rem;
    margin: 1rem 0;
    color: #fecaca;
    font-weight: 500;
    text-align: center;
  `;
  error.textContent = msg;
  
  card.querySelector('.auth-form.active').insertBefore(error, card.querySelector('.auth-form.active').firstElementChild);
  setTimeout(() => error.remove(), 5000);
}

// === EVENTS ===
document.addEventListener('DOMContentLoaded', () => {
  loginForm.onsubmit = (e) => { e.preventDefault(); handleAuth('loginForm'); };
  signupForm.onsubmit = (e) => { e.preventDefault(); handleAuth('signupForm', true); };
});
