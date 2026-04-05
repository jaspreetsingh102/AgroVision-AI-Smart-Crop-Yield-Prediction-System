document.addEventListener('DOMContentLoaded', async () => {
  if (!requireSellerLogin()) return;
  const seller = getSellerSession();
  const sellerId = seller.seller_id || seller.id;

  // Original values to detect changes
  let originalData = {};

  // DOM refs
  const form = document.getElementById('profileForm');
  const passwordForm = document.getElementById('passwordForm');
  const saveBtn = document.getElementById('saveBtn');
  const discardBtn = document.getElementById('discardBtn');
  const profileActions = document.getElementById('profileActions');
  const editBtn = document.getElementById('editProfileBtn');

  let isEditing = false;

  const fields = {
    Shop_name: document.getElementById('fieldShopName'),
    username: document.getElementById('fieldUsername'),
    email: document.getElementById('fieldEmail'),
    phone: document.getElementById('fieldPhone'),
    location: document.getElementById('fieldLocation')
  };

  // ============================
  // LOAD PROFILE FROM BACKEND
  // ============================
  async function loadProfile() {
    try {
      const res = await fetch(`/api/seller/${sellerId}/profile`);
      const result = await res.json();

      if (!res.ok) {
        showToast(result.error || 'Failed to load profile', 'error');
        return;
      }

      const data = result.seller;
      originalData = { ...data };

      // Fill header
      document.getElementById('profileDisplayName').textContent = data.username || 'Seller';
      document.getElementById('profileShopName').textContent = data.Shop_name || '—';
      document.getElementById('profileAvatar').innerHTML = `<span style="font-size:32px;">${(data.username || 'S')[0].toUpperCase()}</span>`;

      if (data.created_at) {
        const joined = new Date(data.created_at).toLocaleDateString('en-IN', {
          month: 'long', year: 'numeric'
        });
        document.getElementById('profileJoinDate').textContent = joined;
      }

      // Fill form fields
      fields.Shop_name.value = data.Shop_name || '';
      fields.username.value = data.username || '';
      fields.email.value = data.email || '';
      fields.phone.value = data.phone || '';
      fields.location.value = data.location || '';

      checkForChanges();

    } catch (err) {
      showToast('Network error loading profile', 'error');
    }
  }

  // ============================
  // CHANGE DETECTION
  // ============================
  function checkForChanges() {
    let hasChanges = false;

    Object.keys(fields).forEach(key => {
      const currentVal = fields[key].value.trim();
      const originalVal = String(originalData[key] || '').trim();

      if (currentVal !== originalVal) {
        fields[key].classList.add('changed');
        hasChanges = true;
      } else {
        fields[key].classList.remove('changed');
      }
    });

    saveBtn.disabled = !hasChanges;
    discardBtn.disabled = !hasChanges;
  }

  // Attach listeners to all fields
  Object.values(fields).forEach(input => {
    input.addEventListener('input', checkForChanges);
  });

  // ============================
  // EDIT MODE TOGGLE
  // ============================
  function enterEditMode() {
    isEditing = true;
    Object.values(fields).forEach(input => input.removeAttribute('readonly'));
    profileActions.style.display = 'flex';
    form.classList.add('editing');
    editBtn.innerHTML = '<i class="fas fa-pen"></i> Editing...';
    editBtn.classList.add('editing');
    fields.Shop_name.focus();
  }

  function exitEditMode() {
    isEditing = false;
    Object.values(fields).forEach(input => {
      input.setAttribute('readonly', true);
      input.classList.remove('changed');
    });
    profileActions.style.display = 'none';
    form.classList.remove('editing');
    editBtn.innerHTML = '<i class="fas fa-pen"></i> Edit Profile';
    editBtn.classList.remove('editing');
  }

  window.toggleEditMode = () => {
    if (isEditing) {
      // Restore original values and exit
      fields.Shop_name.value = originalData.Shop_name || '';
      fields.username.value = originalData.username || '';
      fields.email.value = originalData.email || '';
      fields.phone.value = originalData.phone || '';
      fields.location.value = originalData.location || '';
      exitEditMode();
    } else {
      enterEditMode();
    }
  };

  // ============================
  // DISCARD CHANGES
  // ============================
  discardBtn.addEventListener('click', () => {
    fields.Shop_name.value = originalData.Shop_name || '';
    fields.username.value = originalData.username || '';
    fields.email.value = originalData.email || '';
    fields.phone.value = originalData.phone || '';
    fields.location.value = originalData.location || '';
    exitEditMode();
    showToast('Changes discarded', 'info');
  });

  // ============================
  // SAVE PROFILE
  // ============================
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const updatedData = {};
    Object.keys(fields).forEach(key => {
      const val = fields[key].value.trim();
      if (val !== String(originalData[key] || '').trim()) {
        updatedData[key] = key === 'phone' ? Number(val) : val;
      }
    });

    if (Object.keys(updatedData).length === 0) {
      showToast('No changes to save', 'info');
      return;
    }

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
      const res = await fetch(`/api/seller/${sellerId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      const result = await res.json();

      if (!res.ok) {
        showToast(result.error || 'Update failed', 'error');
        return;
      }

      // Update original data & session with new values
      originalData = { ...originalData, ...updatedData };

      const session = getSellerSession();
      if (updatedData.Shop_name) session.shop_name = updatedData.Shop_name;
      if (updatedData.username) session.username = updatedData.username;
      if (updatedData.email) session.email = updatedData.email;
      if (updatedData.phone) session.phone = updatedData.phone;
      if (updatedData.location) session.location = updatedData.location;
      setSellerSession(session);

      // Update header
      document.getElementById('profileDisplayName').textContent = originalData.username || 'Seller';
      document.getElementById('profileShopName').textContent = originalData.Shop_name || '—';
      document.getElementById('profileAvatar').innerHTML = `<span style="font-size:32px;">${(originalData.username || 'S')[0].toUpperCase()}</span>`;

      checkForChanges();
      exitEditMode();
      showToast('Profile updated successfully!', 'success');

    } catch (err) {
      showToast('Network error — could not save', 'error');
    } finally {
      saveBtn.innerHTML = '<i class="fas fa-check"></i> Save Changes';
    }
  });

  // ============================
  // CHANGE PASSWORD
  // ============================

  // Step 1: Request OTP
  const sendOtpBtn = document.getElementById('sendOtpBtn');
  const verifyOtpBtn = document.getElementById('verifyOtpBtn');
  const step2 = document.getElementById('step2-verify-otp');
  const pwdModal = document.getElementById('newPasswordModal');
  const closePwdModal = document.getElementById('closePasswordModal');
  const newPasswordForm = document.getElementById('newPasswordForm');

  if (sendOtpBtn) {
    sendOtpBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const oldPw = document.getElementById('fieldOldPassword').value;

      if (!oldPw) {
        showToast('Please enter your old password first', 'error');
        return;
      }

      sendOtpBtn.disabled = true;
      sendOtpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

      try {
        const res = await fetch(`/api/seller/${sellerId}/generate-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ old_password: oldPw })
        });
        const result = await res.json();

        if (!res.ok) {
          showToast(result.error || 'Failed to verify password & send OTP', 'error');
        } else {
          const emailDisplay = result.email || 'your email';
          showToast(`OTP sent securely to ${emailDisplay}!`, 'success');

          const otpLabel = document.querySelector('label[for="fieldOtp"]');
          if (otpLabel && result.email) {
            otpLabel.innerHTML = `<i class="fas fa-envelope-open-text"></i> OTP sent to <strong style="color: #10b981;">${result.email}</strong>`;
          }

          // Show Step 2
          step2.style.display = 'grid';
          document.getElementById('fieldOldPassword').disabled = true;
          document.getElementById('fieldOtp').focus();
        }
      } catch (err) {
        showToast('Network error — could not send OTP', 'error');
      } finally {
        sendOtpBtn.disabled = false;
        sendOtpBtn.innerHTML = 'Send OTP';
      }
    });
  }

  // Step 2: Verify OTP
  if (verifyOtpBtn) {
    verifyOtpBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const otp = document.getElementById('fieldOtp').value;

      if (!otp) {
        showToast('Please enter the OTP', 'error');
        return;
      }

      verifyOtpBtn.disabled = true;
      verifyOtpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

      try {
        const res = await fetch(`/api/seller/${sellerId}/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otp: otp })
        });
        const result = await res.json();

        if (!res.ok) {
          showToast(result.error || 'Invalid OTP', 'error');
        } else {
          showToast('OTP Verified!', 'success');
          // Open Modal
          pwdModal.style.display = 'flex';
          document.getElementById('fieldNewPassword').focus();
        }
      } catch (err) {
        showToast('Network error — could not verify OTP', 'error');
      } finally {
        verifyOtpBtn.disabled = false;
        verifyOtpBtn.innerHTML = '<i class="fas fa-check-circle"></i> Verify OTP';
      }
    });
  }

  // Close Modal
  if (closePwdModal) {
    closePwdModal.addEventListener('click', () => {
      pwdModal.style.display = 'none';
    });
  }

  // Step 3: Submit new password with OTP
  if (newPasswordForm) {
    newPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const otp = document.getElementById('fieldOtp').value;
      const newPw = document.getElementById('fieldNewPassword').value;
      const confirmPw = document.getElementById('fieldConfirmPassword').value;

      if (!newPw || !confirmPw) {
        showToast('Please fill out both password fields', 'error');
        return;
      }
      if (newPw.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
      }
      if (newPw !== confirmPw) {
        showToast('Passwords do not match', 'error');
        return;
      }

      const btn = newPasswordForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

      try {
        const res = await fetch(`/api/seller/${sellerId}/password`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otp: otp, password: newPw })
        });
        const result = await res.json();

        if (!res.ok) {
          showToast(result.error || 'Password update failed', 'error');
          return;
        }

        showToast('Password updated successfully! Please login again.', 'success');

        // Reset everything
        newPasswordForm.reset();
        document.getElementById('fieldOldPassword').value = '';
        document.getElementById('fieldOldPassword').disabled = false;
        document.getElementById('fieldOtp').value = '';
        step2.style.display = 'none';
        pwdModal.style.display = 'none';

        setTimeout(() => {
          localStorage.removeItem('sellerSession');
          window.location.href = 'seller-login.html';
        }, 2000);

      } catch (err) {
        showToast('Network error — could not update password', 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-shield-alt"></i> Update Password';
      }
    });
  }

  // ============================
  // TOGGLE PASSWORD VISIBILITY
  // ============================
  window.togglePassword = (fieldId, btn) => {
    const input = document.getElementById(fieldId);
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
      input.type = 'text';
      icon.className = 'fas fa-eye-slash';
    } else {
      input.type = 'password';
      icon.className = 'fas fa-eye';
    }
  };

  // Load profile on page ready
  await loadProfile();
});

window.handleLogout = () => showLogoutConfirm();
