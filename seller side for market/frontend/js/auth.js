// AgroMarket — Seller Authentication Logic
// Table: "seller" | Columns: "Shop name", username, email, "phone number", password, location

document.addEventListener('DOMContentLoaded', () => {
  initAuthTabs();
  initLoginForm();
  initSignupForm();
  initPasswordToggles();
  initPasswordStrength();
});

// === TAB SWITCHING ===
function initAuthTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const forms = document.querySelectorAll('.auth-form');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove('active'));
      forms.forEach(f => f.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById(target).classList.add('active');

      // Clear errors when switching
      document.querySelectorAll('.form-error').forEach(e => {
        e.classList.remove('show');
      });
    });
  });
}

// === LOGIN FORM ===
function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.btn-submit');
    const errorEl = document.getElementById('loginError');

    const email = form.querySelector('#loginEmail').value.trim();
    const password = form.querySelector('#loginPassword').value;

    // Validate
    if (!email || !password) {
      showFormError(errorEl, 'Please fill in all fields.');
      return;
    }

    if (!isValidEmail(email)) {
      showFormError(errorEl, 'Please enter a valid email address.');
      return;
    }

    // Submit
    setLoading(btn, true);
    hideFormError(errorEl);

    try {
      // Query the seller table for matching email
      const { data, error } = await supabase
        .from('seller')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !data) {
        showFormError(errorEl, 'No account found with this email.');
        setLoading(btn, false);
        return;
      }

      // Check password (plain text comparison — matching your table structure)
      if (data.password !== password) {
        showFormError(errorEl, 'Invalid password. Please try again.');
        setLoading(btn, false);
        return;
      }

      // Success — save session
      const sellerData = {
        seller_id: data.seller_id,
        shop_name: data.Shop_name, // Updated to match new schema
        username: data.username,
        email: data.email,
        phone: data.phone, // Updated to match new schema
        location: data.location
      };

      setSellerSession(sellerData);
      showToast(`Welcome back, ${sellerData.username}!`, 'success');

      setTimeout(() => {
        window.location.href = 'seller-dashboard.html';
      }, 1200);

    } catch (err) {
      console.error('Login error:', err);
      showFormError(errorEl, 'Something went wrong. Please try again.');
    } finally {
      setLoading(btn, false);
    }
  });
}

// === SIGNUP FORM ===
function initSignupForm() {
  const form = document.getElementById('signupForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.btn-submit');
    const errorEl = document.getElementById('signupError');

    const shopName = form.querySelector('#shopName').value.trim();
    const username = form.querySelector('#username').value.trim();
    const email = form.querySelector('#signupEmail').value.trim();
    const phone = form.querySelector('#phone').value.trim();
    const location = form.querySelector('#location').value.trim();
    const password = form.querySelector('#signupPassword').value;
    const confirmPassword = form.querySelector('#confirmPassword').value;

    // Validate
    if (!shopName || !username || !email || !phone || !location || !password) {
      showFormError(errorEl, 'Please fill in all required fields.');
      return;
    }

    if (!isValidEmail(email)) {
      showFormError(errorEl, 'Please enter a valid email address.');
      return;
    }

    if (!isValidPhone(phone)) {
      showFormError(errorEl, 'Please enter a valid 10-digit phone number.');
      return;
    }

    if (password.length < 6) {
      showFormError(errorEl, 'Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      showFormError(errorEl, 'Passwords do not match.');
      return;
    }

    // Submit
    setLoading(btn, true);
    hideFormError(errorEl);

    try {
      // Check if email already exists
      const { data: existing } = await supabase
        .from('seller')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (existing) {
        showFormError(errorEl, 'This email is already registered. Please login instead.');
        setLoading(btn, false);
        return;
      }

      // Insert new seller into the "seller" table
      const { data, error } = await supabase
        .from('seller')
        .insert({
          "Shop_name": shopName, // Updated to match new schema (case-sensitive)
          username: username,
          email: email,
          phone: phone, // Updated to match new schema
          password: password,
          location: location
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Auto-login after signup with generated auto-incrementing ID (1 to n)
      const sellerData = {
        seller_id: data.seller_id,
        shop_name: data.Shop_name,
        username: data.username,
        email: data.email,
        phone: data.phone,
        location: data.location
      };

      setSellerSession(sellerData);
      showToast('Account created successfully! Redirecting...', 'success');

      setTimeout(() => {
        window.location.href = 'seller-dashboard.html';
      }, 1500);

    } catch (err) {
      console.error('Signup error:', err);
      let message = 'Signup failed. Please try again.';

      if (err.message && err.message.includes('duplicate')) {
        message = 'This email is already registered.';
      } else if (err.message) {
        message = err.message;
      }

      showFormError(errorEl, message);
    } finally {
      setLoading(btn, false);
    }
  });
}

// === PASSWORD VISIBILITY TOGGLES ===
function initPasswordToggles() {
  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const input = btn.previousElementSibling;
      const icon = btn.querySelector('i');

      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
      } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
      }
    });
  });
}

// === PASSWORD STRENGTH METER ===
function initPasswordStrength() {
  const passwordInput = document.getElementById('signupPassword');
  if (!passwordInput) return;

  passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    const bars = document.querySelectorAll('.strength-bar');
    const textEl = document.querySelector('.strength-text');

    const strength = calculateStrength(password);

    bars.forEach((bar, i) => {
      bar.className = 'strength-bar';
      if (i < strength.level) {
        bar.classList.add(strength.class);
      }
    });

    if (textEl) {
      textEl.textContent = password.length > 0 ? strength.text : '';
      textEl.className = `strength-text ${strength.class}`;
    }
  });
}

function calculateStrength(password) {
  if (password.length === 0) return { level: 0, class: '', text: '' };

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { level: 1, class: 'weak', text: 'Weak password' };
  if (score <= 3) return { level: 2, class: 'medium', text: 'Medium strength' };
  return { level: 3, class: 'strong', text: 'Strong password' };
}

// === HELPER FUNCTIONS ===
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone.replace(/[\s-]/g, ''));
}

function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.classList.toggle('loading', loading);
}

function showFormError(el, message) {
  if (!el) return;
  el.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
  el.classList.add('show');
}

function hideFormError(el) {
  if (!el) return;
  el.classList.remove('show');
}
