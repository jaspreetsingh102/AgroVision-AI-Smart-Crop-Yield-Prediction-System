// AI Farmer Location - Neumorphic (Workflow Preserved)
// Geolocation API + India states + manual input + localStorage

const countrySelect = document.getElementById('country');
const stateSelect = document.getElementById('state');
const districtInput = document.getElementById('district');
const locationForm = document.getElementById('locationForm');
const locationResult = document.getElementById('locationResult');
const detectedLocation = document.getElementById('detectedLocation');
const autoLocateBtn = document.getElementById('autoLocateBtn');

// India state/district data
const indiaStates = {
  'Punjab': ['Ludhiana', 'Amritsar', 'Patiala', 'Bathinda'],
  'Maharashtra': ['Pune', 'Mumbai', 'Nagpur', 'Nashik', 'Aurangabad'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Meerut'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Hubli', 'Mangaluru'],
  // Add more as needed
};

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
  setupStates();
  setupForm();
  setupAutoDetect();
  checkExistingLocation();
});

// === STATES POPULATION ===
function setupStates() {
  countrySelect.onchange = (e) => {
    const country = e.target.value;
    stateSelect.innerHTML = '<option value="">Select State</option>';
    stateSelect.disabled = !country || country !== 'India';
    
    if (country === 'India') {
      Object.keys(indiaStates).forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        stateSelect.appendChild(option);
      });
    }
  };
  
  stateSelect.onchange = () => {
    // Districts could be populated similarly if needed
  };
}

// === AUTO LOCATION ===
function setupAutoDetect() {
  autoLocateBtn.onclick = async () => {
    if (!navigator.geolocation) {
      return showToast('Geolocation not supported', 'error');
    }
    
    autoLocateBtn.disabled = true;
    autoLocateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Detecting...';
    
    navigator.geolocation.getCurrentPosition(
      handleLocationSuccess,
      handleLocationError,
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };
}

async function handleLocationSuccess(position) {
  const { latitude, longitude } = position.coords;
  
  try {
    // Free reverse geocoding (Nominatim)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
    );
    const data = await res.json();
    
    const location = {
      country: data.address?.country || 'Unknown',
      state: data.address?.state || data.address?.['state_district'],
      district: data.address?.['city'] || data.address?.['town'] || data.address?.['county']
    };
    
    showLocationResult(location);
  } catch {
    showLocationResult({ lat: latitude, lon: longitude, approx: true });
  } finally {
    resetAutoButton();
  }
}

function handleLocationError(error) {
  let msg = 'Location access denied';
  if (error.code === 3) msg = 'Location timeout - taking longer than expected';
  showToast(msg, 'error');
  resetAutoButton();
}

function resetAutoButton() {
  autoLocateBtn.disabled = false;
  autoLocateBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Retry Auto Detect';
}

function showLocationResult(location) {
  locationForm.style.display = 'none';
  locationResult.style.display = 'block';
  
  let displayText = location.approx 
    ? `Approximate: ${location.lat?.toFixed(4)}, ${location.lon?.toFixed(4)}`
    : `${location.state}, ${location.district}, ${location.country}`;
    
  detectedLocation.textContent = displayText;
  
  // Pre-fill form
  countrySelect.value = location.country || '';
  stateSelect.value = location.state || '';
  districtInput.value = location.district || '';
}

document.getElementById('confirmLocation').onclick = saveLocation;

// === FORM SAVE ===
function setupForm() {
  locationForm.onsubmit = (e) => {
    e.preventDefault();
    saveLocation();
  };
}

function saveLocation() {
  const location = {
    country: countrySelect.value,
    state: stateSelect.value,
    district: districtInput.value
  };
  
  if (!location.country || !location.state || !location.district) {
    return showToast('Please complete all fields', 'error');
  }
  
  localStorage.setItem('farmLocation', JSON.stringify(location));
  showToast('Location saved! Redirecting...', 'success');
  
  setTimeout(() => {
    window.location.href = 'dashboard.html'; // or next page
  }, 1500);
}

// === CHECK EXISTING ===
function checkExistingLocation() {
  const saved = localStorage.getItem('farmLocation');
  if (saved) {
    const location = JSON.parse(saved);
    showToast('Location already set', 'info');
    setTimeout(() => window.location.href = 'dashboard.html', 1500);
  }
}

// === TOAST NOTIFICATIONS ===
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6'
  };
  
  toast.style.cssText = `
    position: fixed; top: 1.5rem; right: 1.5rem; z-index: 1000;
    background: ${colors[type]}; color: white; padding: 1rem 1.5rem;
    border-radius: var(--radius-lg); font-weight: 500; box-shadow: var(--shadow-lg);
    transform: translateX(400px); opacity: 0;
  `;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';
  }, 100);
  
  setTimeout(() => {
    toast.style.transform = 'translateX(400px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

