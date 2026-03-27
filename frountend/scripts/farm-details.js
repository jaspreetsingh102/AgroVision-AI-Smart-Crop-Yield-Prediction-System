// AI Farmer Farm Details - Neumorphic Wizard (Workflow 100% Preserved)
// 3-step validation + crops selector + dynamic area rows + localStorage

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

// === WIZARD CORE ===
function showStep(step) {
  document.querySelectorAll(SELECTORS.steps).forEach((s, i) => s.classList.toggle('active', i + 1 === step));
  document.querySelectorAll(SELECTORS.progressSteps).forEach((ps, i) => ps.classList.toggle('active', i + 1 <= step));
  document.getElementById('prevBtn').style.display = step > 1 ? 'block' : 'none';
  document.getElementById('nextBtn').textContent = step === 3 ? 'Complete Setup' : 'Next';
  
  state.currentStep = step;
  if (step === 3) updateAreaRows();
}

function validateStep(step) {
  const validators = {
    1: () => ['farmerGender', 'farmerVillage', 'farmerAge', 'farmerEducation', 'farmerPhone', 'farmerExperience', 'farmerFamily']
      .every(id => document.getElementById(id)?.value.trim() !== ""),

    2: () => {
      const sizeVal = document.getElementById('farmSize').value;
      const goalVal = document.getElementById('farmGoal').value;
      const checked = document.querySelectorAll('#cropsContainer input[type="checkbox"]:checked');
      return sizeVal > 0 && goalVal !== "" && checked.length > 0;
    },
    
    3: () => {
      const rows = document.querySelectorAll('.area-row');
      return rows.length >= 2 && Array.from(rows).every(row => {
        const yearSelect = row.querySelector('select');
        const cropSelect = row.querySelectorAll('select')[1];
        const areaInput = row.querySelector('input');
        return yearSelect.value && cropSelect.value && parseFloat(areaInput.value) > 0;
      });
    }
  };
  
  return validators[step]?.() || false;
}

function collectStepData(step) {
  const collectors = {
    1: () => ({
      gender: document.getElementById('farmerGender').value,
      village: document.getElementById('farmerVillage').value,
      age: document.getElementById('farmerAge').value,
      education: document.getElementById('farmerEducation').value,
      phone: document.getElementById('farmerPhone').value,
      experience: document.getElementById('farmerExperience').value,
      familyMembers: document.getElementById('farmerFamily').value
    }),

    2: () => ({
      farmSize: document.getElementById('farmSize').value,
      goal: document.getElementById('farmGoal').value,
      currentCrops: Array.from(document.querySelectorAll('#cropsContainer input[type="checkbox"]:checked'))
        .map(cb => cb.value)
    }),
    
    3: () => {
      const history = [];
      document.querySelectorAll('.area-row').forEach(row => {
        const selects = row.querySelectorAll('select');
        const areaInput = row.querySelector('input');
        history.push({
          year: selects[0].value,
          crop: selects[1].value,
          area: parseFloat(areaInput.value)
        });
      });
      return { farmPastHistory: history };
    }
  };
  
  Object.assign(state.farmData, collectors[step]());
  localStorage.setItem('farmDetails', JSON.stringify(state.farmData));
}

// === CROPS LOADER ===
async function loadCrops() {
  try {
    const res = await fetch('../../data/crops.json');
    state.crops = await res.json();
    
    const container = document.getElementById('cropsContainer');
    container.innerHTML = state.crops.map(crop => `
      <label>
        <input type="checkbox" value="${crop.name_en}">
        <i class="fas fa-seedling"></i>
        <span>${crop.name_en}</span>
      </label>
    `).join('');
    
    // Search
    document.getElementById('cropsSearch').oninput = (e) => {
      const term = e.target.value.toLowerCase();
      container.querySelectorAll('label').forEach(label => {
        const text = label.textContent.toLowerCase();
        label.style.display = text.includes(term) ? 'flex' : 'none';
      });
    };
    
    // Hover effects
    container.querySelectorAll('label').forEach(label => {
      label.style.cursor = 'pointer';
      label.onchange = () => label.classList.toggle('selected', label.querySelector('input').checked);
    });
    
  } catch (e) {
    document.getElementById('cropsContainer').innerHTML = '<p>No crops data available</p>';
  }
}

// === AREA ROWS ===
function addAreaRow() {
  const row = document.createElement('div');
  row.className = 'area-row';
  row.innerHTML = `
    <select>
      <option value="">Year</option>
      <option value="2024">2024</option><option value="2023">2023</option>
      <option value="2022">2022</option><option value="2021">2021</option>
    </select>
    <select>
      <option value="">Crop</option>
      <option value="Rice">Rice</option><option value="Wheat">Wheat</option>
      <option value="Maize">Maize</option>
    </select>
    <input type="number" min="0.1" step="0.1" placeholder="Acres">
    <button type="button" class="remove-row" onclick="this.parentElement.remove()">
      <i class="fas fa-trash"></i>
    </button>
  `;
  document.getElementById('areaHistoryContainer').appendChild(row);
}

function updateAreaRows() {
  const container = document.getElementById('areaHistoryContainer');
  while (container.children.length < 2) addAreaRow();
}

// === EVENT HANDLERS ===
document.addEventListener('DOMContentLoaded', async () => {
  await loadCrops();
  updateAreaRows();
  
  // Navigation
  document.querySelector(SELECTORS.prevBtn).onclick = () => {
    if (validateStep(state.currentStep)) showStep(state.currentStep - 1);
  };
  
  document.querySelector(SELECTORS.nextBtn).onclick = () => {
    if (validateStep(state.currentStep)) {
      collectStepData(state.currentStep);
      if (state.currentStep < 3) {
        showStep(state.currentStep + 1);
      } else {
        // Complete
        showToast('Farm setup complete!');
        setTimeout(() => {
          const hasLocation = localStorage.getItem('farmLocation');
          window.location.href = hasLocation ? 'dashboard.html' : 'location.html';
        }, 1500);
      }
    }
  };
  
  document.querySelector(SELECTORS.addAreaRowBtn).onclick = addAreaRow;
  document.querySelector(SELECTORS.backBtn).onclick = () => history.back();
});

// Toast utility
function showToast(msg) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; 
    top: 2rem; 
    left: 50%; 
    transform: translateX(-50%);
    background: var(--farm-emerald); 
    color: white; 
    padding: 1rem 2rem;
    border-radius: var(--radius-lg); 
    z-index: 1000; 
    font-weight: 500;
    box-shadow: var(--shadow-lg);
    transition: all 0.3s ease;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
