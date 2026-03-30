// AI Farmer Farm Details Wizard - FULLY FIXED: Validation, Navigation, DB Save

const CONFIG = {
  API_BASE_URL: (window.location.port === '5000' || window.location.port === '') ? '' : `http://${window.location.hostname}:5000`
};

const SELECTORS = {
  wizard: '#farmWizard',
  steps: '.wizard-step',
  progressSteps: '.progress-step',
  prevBtn: '#prevBtn',
  nextBtn: '#nextBtn',
  addAreaRowBtn: '#addAreaRow',
  areaHistoryContainer: '#areaHistoryContainer',
  backBtn: '#backBtn',
  cropsContainer: '#cropsContainer',
  cropsSearch: '#cropsSearch'
};

let state = {
  currentStep: 1,
  farmData: {},
  crops: []
};

function clearValidationErrors() {
  document.querySelectorAll('.input-group.error, .area-row.error, input[style*="borderColor"], select[style*="borderColor"]').forEach(el => {
    el.classList.remove('error');
    el.style.borderColor = '';
  });
}

function showStep(step) {
  document.querySelectorAll('.wizard-step').forEach((s, i) => s.classList.toggle('active', i + 1 === step));
  document.querySelectorAll('.progress-step').forEach((ps, i) => ps.classList.toggle('active', i + 1 <= step));
  document.getElementById('prevBtn').style.display = step > 1 ? 'block' : 'none';
  document.getElementById('nextBtn').textContent = step === 3 ? 'Complete & Save' : 'Next →';
  state.currentStep = step;
  if (step === 3) updateAreaRows();
}

function getDashboardPath() {
  return window.location.pathname.includes('frountend/pages') ? 'dashboard.html' : 'frountend/pages/dashboard.html';
}

function validateStep(step) {
  clearValidationErrors();
  
  switch (step) {
    case 1:
      // Simplified to match requested Step 1 fields
      const required1 = ['farmerGender', 'farmerAge', 'farmerEducation', 'farmerPhone', 'farmerExperience'];
      let valid1 = true;
      const missing1 = [];
      required1.forEach(id => {
        const el = document.getElementById(id);
        const val = el ? el.value.trim() : "";
        if (!val) {
          // Format ID for a cleaner toast message (e.g., farmerVillage -> Village)
          const label = id.replace('farmer', '').replace(/([A-Z])/g, ' $1').trim();
          missing1.push(label);
          valid1 = false;
        }
        markInvalid(id, !!val);
      });
      if (!valid1) showToast(`Fill: ${missing1.join(', ')}`, 'error');
      return valid1;
    
    case 2:
      const sizeVal = parseFloat(document.getElementById('farmSize')?.value || 0);
      const goalVal = document.getElementById('farmGoal')?.value.trim() || '';
      const checkedCrops = document.querySelectorAll('#cropsContainer input[type="checkbox"]:checked');
      markInvalid('farmSize', sizeVal > 0);
      markInvalid('farmGoal', !!goalVal);
      if (checkedCrops.length === 0) showToast('Select 1+ crop', 'error');
      return sizeVal > 0 && !!goalVal && checkedCrops.length > 0;
    
    case 3:
      const rows = document.querySelectorAll('.area-row');
      if (rows.length === 0) {
        showToast('Add at least 1 year data', 'error');
        return false;
      }
      let valid3 = true;
      rows.forEach(row => {
        const selects = row.querySelectorAll('select');
        const area = parseFloat(row.querySelector('input').value);
        const rowValid = selects[0].value && selects[1].value && area > 0;
        row.classList.toggle('error', !rowValid);
        valid3 &= rowValid;
      });
      return valid3;
    
    default:
      return false;
  }
}

function markInvalid(id, isValid) {
  const el = document.getElementById(id);
  if (el) {
    el.closest('.input-group')?.classList.toggle('error', !isValid);
    el.style.borderColor = isValid ? '' : '#ef4444';
  }
}

function collectStepData(step) {
  const data = {
    1: () => ({
      gender: document.getElementById('farmerGender')?.value || "",
      age: parseInt(document.getElementById('farmerAge')?.value || 0),
      education: document.getElementById('farmerEducation')?.value || "",
      phone: document.getElementById('farmerPhone')?.value || "",
      experience: parseInt(document.getElementById('farmerExperience')?.value || 0),
    }),
    2: () => ({
      farm_size: parseFloat(document.getElementById('farmSize')?.value || 0),
      goal: document.getElementById('farmGoal')?.value || "",
      crops: Array.from(document.querySelectorAll('#cropsContainer input[type="checkbox"]:checked')).map(cb => cb.value)
    }),
    3: () => ({
      history: JSON.stringify(Array.from(document.querySelectorAll('.area-row')).map(row => {
        const selects = row.querySelectorAll('select');
        const input = row.querySelector('input');
        return {year: selects[0].value, crop: selects[1].value, area: parseFloat(input.value)};
      }))
    })
  }[step]();
  Object.assign(state.farmData, data);
  localStorage.setItem('farmDetails', JSON.stringify(state.farmData));
}

async function finalizeSetup() {
  // Retrieve initial signup data (Name, Email, Password)
  const pending = JSON.parse(localStorage.getItem('pendingSignup') || '{}');
  
  if (!pending.email || !pending.password) {
    return showToast('Signup session expired. Please start again.', 'error');
  }

  // Merge Signup data with Wizard data
  const payload = { ...pending, ...state.farmData };
  
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/signup`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    
    if (res.ok) {
      localStorage.setItem('authUser', pending.email);
      localStorage.setItem('userName', pending.name);
      localStorage.setItem('farmSetupComplete', 'true');
      localStorage.removeItem('pendingSignup'); // Clear temporary data
      showToast('✅ Saved to database!');
      setTimeout(() => window.location.href = getDashboardPath(), 1200);
    } else {
      showToast(result.message, 'error');
    }
  } catch (e) {
    showToast('Backend down? cd backend && python app.py', 'error');
  }
}

async function loadCrops() {
  const container = document.getElementById('cropsContainer');
  const crops = ['Wheat', 'Rice', 'Maize', 'Cotton', 'Sugarcane', 'Soybean', 'Mustard', 'Barley', 'Tomato', 'Potato', 'Onion', 'Chili'];
  container.innerHTML = crops.map(name => `
    <label class="crop-label">
      <input type="checkbox" value="${name}">
      <i class="fas fa-seedling"></i> ${name}
    </label>
  `).join('');
  
  // Search
  document.getElementById('cropsSearch').addEventListener('input', e => {
    const term = e.target.value.toLowerCase();
    container.querySelectorAll('.crop-label').forEach(label => {
      label.style.display = label.textContent.toLowerCase().includes(term) ? '' : 'none';
    });
  });
}

function addAreaRow() {
  const container = document.getElementById('areaHistoryContainer');
  const row = document.createElement('div');
  row.className = 'area-row';
  row.innerHTML = `
    <select>
      <option value="">Year</option>
      <option>2024</option><option>2023</option><option>2022</option><option>2021</option>
    </select>
    <select>
      <option value="">Crop</option>
      <option>Rice</option><option>Wheat</option><option>Maize</option>
    </select>
    <input type="number" min="0.1" step="0.1" placeholder="Acres">
    <button type="button" onclick="this.parentNode.remove()">×</button>
  `;
  container.appendChild(row);
}

function updateAreaRows() {
  while (document.querySelectorAll('.area-row').length < 2) addAreaRow();
}

function showToast(msg, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed; top: 20px; right: 20px; padding: 12px 20px; border-radius: 8px; color: white; font-weight: 500; z-index: 9999;
    background: ${type === 'error' ? '#ef4444' : '#10b981'};
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
  loadCrops();
  updateAreaRows();
  showStep(1);
  
  // FIXED: Event bindings
  document.getElementById('prevBtn').onclick = () => state.currentStep > 1 && showStep(state.currentStep - 1);
  document.getElementById('nextBtn').onclick = () => {
    if (validateStep(state.currentStep)) {
      collectStepData(state.currentStep);
      if (state.currentStep < 3) {
        showStep(state.currentStep + 1);
      } else {
        finalizeSetup();
      }
    }
  };
  document.getElementById('addAreaRow').onclick = addAreaRow;
  document.getElementById('backBtn').onclick = () => history.back();
  
  // Crop checkboxes
  document.getElementById('cropsContainer').addEventListener('change', e => {
    if (e.target.type === 'checkbox') e.target.closest('label')?.classList.toggle('selected', e.target.checked);
  });
});
