// AI Farmer Dashboard - Neumorphic Theme
// Matches new UI theme, preserved functionality

const CONFIG = {
  // Change this to your production URL when deploying
  API_BASE_URL: (window.location.port === '5000' || window.location.port === '') ? '' : `http://${window.location.hostname}:5000`
};

// Section switching
function showSection(id, element) {
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });
  document.getElementById(id).classList.add('active');
  
  // Update sidebar
  if (element) {
    document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
    element.classList.add('active');
  }

  // Auto-close sidebar on mobile after selection
  if (window.innerWidth <= 768) {
    document.querySelector('.sidebar').classList.remove('active');
  }
}

function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('active');
}

// === AI FEATURES ===
function yardFeature(num) {
  const resultDiv = document.getElementById('yardLabResult');
  const titleDiv = document.getElementById('yardLabTitle');
  const contentDiv = document.getElementById('yardLabContent');
  resultDiv.style.display = 'block';

  const features = {
    1: { t: '📐 Basic Area', h: `
        <div class="input-group"><input type="number" id="labL" placeholder=" "><label>Length (ft)</label></div>
        <div class="input-group"><input type="number" id="labW" placeholder=" "><label>Width (ft)</label></div>
        <button class="btn-primary" style="width:100%" onclick="runLabCalc(1)">Calculate Area</button>` },
    2: { t: '🔄 Unit Conversion', h: `
        <div class="input-group"><input type="number" id="labVal" placeholder=" "><label>Square Yards (yd²)</label></div>
        <button class="btn-primary" style="width:100%" onclick="runLabCalc(2)">Convert Units</button>` },
    3: { t: '🔷 Shape Support', h: `
        <select id="labShape" style="width:100%; margin-bottom:1rem; background:var(--bg-primary); color:white; border:1px solid var(--surface-hover); padding:0.8rem; border-radius:8px;" onchange="toggleLabShape()">
          <option value="rect">Rectangle</option>
          <option value="circle">Circle</option>
          <option value="tri">Triangle</option>
        </select>
        <div class="input-group"><input type="number" id="labD1" placeholder=" "><label id="labL1">Length (yds)</label></div>
        <div class="input-group" id="labG2"><input type="number" id="labD2" placeholder=" "><label id="labL2">Width (yds)</label></div>
        <button class="btn-primary" style="width:100%" onclick="runLabCalc(3)">Calculate Shape</button>` },
    4: { t: '🌱 Seed Estimation', h: `
        <div class="input-group"><input type="number" id="labArea" placeholder=" "><label>Area (Acres)</label></div>
        <select id="labSeedCrop" style="width:100%; margin-bottom:1rem; background:var(--bg-primary); color:white; border:1px solid var(--surface-hover); padding:0.8rem; border-radius:8px;">
          <option value="wheat">Wheat 🌾</option>
          <option value="rice">Rice 🍚</option>
          <option value="maize">Maize 🌽</option>
          <option value="cotton">Cotton ☁️</option>
        </select>
        <button class="btn-primary" style="width:100%" onclick="runLabCalc(4)">Estimate Seeds</button>` },
    5: { t: '💧 Water Requirement', h: `
        <div class="input-group"><input type="number" id="labArea" placeholder=" "><label>Area (Acres)</label></div>
        <select id="labWaterCrop" style="width:100%; margin-bottom:1rem; background:var(--bg-primary); color:white; border:1px solid var(--surface-hover); padding:0.8rem; border-radius:8px;">
          <option value="wheat">Wheat 🌾</option>
          <option value="rice">Rice 🍚</option>
          <option value="maize">Maize 🌽</option>
          <option value="cotton">Cotton ☁️</option>
        </select>
        <button class="btn-primary" style="width:100%" onclick="runLabCalc(5)">Estimate Water</button>` },
    6: { t: '🧪 Fertilizer Calc', h: `
        <div class="input-group"><input type="number" id="labArea" placeholder=" "><label>Area (Acres)</label></div>
        <select id="labFertCrop" style="width:100%; margin-bottom:1rem; background:var(--bg-primary); color:white; border:1px solid var(--surface-hover); padding:0.8rem; border-radius:8px;">
          <option value="wheat">Wheat 🌾</option>
          <option value="rice">Rice 🍚</option>
          <option value="maize">Maize 🌽</option>
          <option value="cotton">Cotton ☁️</option>
        </select>
        <button class="btn-primary" style="width:100%" onclick="runLabCalc(6)">Estimate NPK</button>` },
    7: { t: '📂 History Log', h: `<div id="labHistoryList" style="max-height:200px; overflow-y:auto;"></div>` }
  };

  const f = features[num];
  titleDiv.innerText = f.t;
  contentDiv.innerHTML = f.h + '<div id="labResDisplay" style="margin-top:1.5rem; padding:1rem; border-radius:8px; background:var(--bg-primary); display:none; border-left:4px solid var(--farm-emerald);"></div>';
  
  if (num === 3) toggleLabShape();
  if (num === 7) loadLabHistory();
  
  resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function toggleLabShape() {
  const shape = document.getElementById('labShape').value;
  const l1 = document.getElementById('labL1');
  const g2 = document.getElementById('labG2');
  if (shape === 'circle') { l1.innerText = 'Radius (yds)'; g2.style.display = 'none'; }
  else { l1.innerText = shape === 'tri' ? 'Base (yds)' : 'Length (yds)'; g2.style.display = 'block'; document.getElementById('labL2').innerText = shape === 'tri' ? 'Height (yds)' : 'Width (yds)'; }
}

function runLabCalc(type) {
  const display = document.getElementById('labResDisplay');
  display.style.display = 'block';
  let res = "";

  if (type === 1) {
    const l = parseFloat(document.getElementById('labL').value) || 0;
    const w = parseFloat(document.getElementById('labW').value) || 0;
    res = `Total Area: ${l * w} sq ft (${((l * w) / 43560).toFixed(4)} Acres)`;
  } else if (type === 2) {
    const val = parseFloat(document.getElementById('labVal').value) || 0;
    const baseSqm = val * 0.836127; // Input assumed as Square Yards (1 yd² = 0.836127 m²)
    res = `<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <span>🚜 ${(baseSqm / 4046.86).toFixed(4)} Acres</span>
            <span>🗺️ ${(baseSqm / 10000).toFixed(4)} Hectares</span>
            <span>🧱 ${(baseSqm / 0.836127).toFixed(2)} Sq Yds</span>
            <span>📏 ${(baseSqm / 0.092903).toFixed(2)} Sq Ft</span>
            <span>🌍 ${baseSqm.toFixed(2)} Sq Mtrs</span>
           </div>`;
  } else if (type === 3) {
    const s = document.getElementById('labShape').value;
    const d1 = parseFloat(document.getElementById('labD1').value) || 0;
    const d2 = parseFloat(document.getElementById('labD2').value) || 0;
    let a = s === 'rect' ? d1 * d2 : s === 'circle' ? Math.PI * d1 * d1 : 0.5 * d1 * d2;
    res = `Shape Area: ${a.toFixed(2)} sq yds (${(a / 4840).toFixed(4)} Acres)`;
  } else if (type === 4 || type === 5 || type === 6) {
    const area = parseFloat(document.getElementById('labArea').value) || 0;
    if (type === 4) {
      const crop = document.getElementById('labSeedCrop').value;
      const rates = { wheat: {n: 'Wheat', r: 40, i: '🌾'}, rice: {n: 'Rice', r: 15, i: '🍚'}, maize: {n: 'Maize', r: 10, i: '🌽'}, cotton: {n: 'Cotton', r: 4, i: '☁️'} };
      const sel = rates[crop];
      res = `${sel.i} ${sel.n}: ${(area * sel.r).toFixed(1)} kg recommended for ${area} acres.`;
    }
    else if (type === 5) {
      const crop = document.getElementById('labWaterCrop').value;
      const rates = { wheat: {n: 'Wheat', r: 20000, i: '🌾'}, rice: {n: 'Rice', r: 45000, i: '🍚'}, maize: {n: 'Maize', r: 25000, i: '🌽'}, cotton: {n: 'Cotton', r: 30000, i: '☁️'} };
      const sel = rates[crop];
      res = `${sel.i} ${sel.n}: ${(area * sel.r).toLocaleString()} Liters needed per cycle for ${area} acres.`;
    }
    else if (type === 6) {
      const crop = document.getElementById('labFertCrop').value;
      const rates = { 
        wheat: {n: 'Wheat', r: [120, 60, 40], i: '🌾'}, 
        rice: {n: 'Rice', r: [100, 60, 40], i: '🍚'}, 
        maize: {n: 'Maize', r: [150, 75, 50], i: '🌽'}, 
        cotton: {n: 'Cotton', r: [80, 40, 40], i: '☁️'} 
      };
      const sel = rates[crop];
      const npk = sel.r.map(v => (v * area).toFixed(1));
      res = `${sel.i} ${sel.n}: Recommended NPK Mix is ${npk[0]}kg - ${npk[1]}kg - ${npk[2]}kg for ${area} acres.`;
    }
  }

  display.innerHTML = `<strong>Result:</strong><p style="margin-top:0.5rem;">${res}</p>`;
  saveLabHistory(res);
  showToast("Calculation successful!");
}

function analyzeSoil() {
  document.getElementById('soilResult').innerHTML = `
    <div style="color: var(--farm-emerald); font-weight: 600;">
      ✅ Soil Analysis Complete
    </div>
    <p>pH: 6.8 | NPK: Excellent | Organic: 2.1%</p>
    <p>Recommendation: Ready for planting</p>
  `;
}

function recommendCrop() {
  document.getElementById('cropResult').innerHTML = `
    <div style="color: var(--farm-gold); font-weight: 600;">
      🌾 Top Recommendations:
    </div>
    <ul style="margin-top: 1rem;">
      <li>✅ Wheat (95% match)</li>
      <li>✅ Rice (88% match)</li>
      <li>🌟 Maize (82% match)</li>
    </ul>
  `;
}

async function loadProfile() {
  const email = localStorage.getItem('authUser');
  if (!email || email === 'guest') return;

  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/get-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (res.ok) {
      const result = await res.json();
      const u = result.user;
      if (u) {
        document.getElementById('profUsername').value = u.Username || "";
        document.getElementById('profGmail').value = u.Gmail || "";
        document.getElementById('profGender').value = u.Gender || "Male";
        document.getElementById('profAge').value = u.Age || "";
        document.getElementById('profEducation').value = u.Education || "";
        document.getElementById('profPhone').value = u.Contect_No || "";
        document.getElementById('profFarmArea').value = u.Farm_Area || "";
        document.getElementById('profExperience').value = u.Experience || "";
        document.getElementById('profFarmingGoal').value = u.Farming_Goal || "";
        document.getElementById('profCurrentCrops').value = u.Current_Crops || "";

        // Render historical data rows from JSON string
        const container = document.getElementById('profHistoryContainer');
        container.innerHTML = '';
        try {
          const history = JSON.parse(u.Previous_Data || '[]');
          if (Array.isArray(history)) {
            history.forEach(item => addProfHistoryRow(item.year, item.crop, item.area));
          }
        } catch (e) {
          console.warn("Could not parse history data", e);
        }
      }
    } else {
      console.error("Profile not found on server");
    }
  } catch (err) {
    console.error("Profile load failed", err);
  }
}

function addProfHistoryRow(year = '', crop = '', area = '') {
  const container = document.getElementById('profHistoryContainer');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'prof-history-row';
  row.style.cssText = 'display: flex; gap: 0.5rem; margin-bottom: 0.75rem; align-items: center;';
  row.innerHTML = `
    <select class="hist-year" style="flex: 1; padding: 0.8rem 0.6rem; border-radius: 8px; background: var(--bg-primary); border: 1px solid var(--surface-hover); color: white; font-size: 0.85rem;">
      <option value="">Year</option>
      ${[2024, 2023, 2022, 2021, 2020].map(y => `<option value="${y}" ${y == year ? 'selected' : ''}>${y}</option>`).join('')}
    </select>
    <input class="hist-crop" value="${crop}" placeholder="Crop" style="flex: 1.5; padding: 0.8rem 0.6rem; border-radius: 8px; background: var(--bg-primary); border: 1px solid var(--surface-hover); color: white; font-size: 0.85rem;">
    <input class="hist-area" type="number" value="${area}" placeholder="Acres" style="flex: 1; padding: 0.8rem 0.6rem; border-radius: 8px; background: var(--bg-primary); border: 1px solid var(--surface-hover); color: white; font-size: 0.85rem;">
    <button type="button" onclick="this.parentElement.remove()" style="background: transparent; color: #ef4444; padding: 0.5rem; font-size: 1.2rem; box-shadow: none; width: auto; border: none; cursor: pointer;">&times;</button>
  `;
  container.appendChild(row);
}

async function saveProfile() {
  // Collect history data from dynamic rows
  const historyRows = document.querySelectorAll('.prof-history-row');
  const historyData = Array.from(historyRows).map(row => ({
    year: row.querySelector('.hist-year').value,
    crop: row.querySelector('.hist-crop').value,
    area: parseFloat(row.querySelector('.hist-area').value) || 0
  })).filter(item => item.year && item.crop && item.area > 0); 

  const payload = {
    Username: document.getElementById('profUsername').value,
    Gmail: document.getElementById('profGmail').value,
    Gender: document.getElementById('profGender').value,
    Age: parseInt(document.getElementById('profAge').value) || 0,
    Education: document.getElementById('profEducation').value,
    Contect_No: document.getElementById('profPhone').value,
    Farm_Area: parseFloat(document.getElementById('profFarmArea').value) || 0,
    Experience: parseInt(document.getElementById('profExperience').value) || 0,
    Farming_Goal: document.getElementById('profFarmingGoal').value,
    Current_Crops: document.getElementById('profCurrentCrops').value,
    Previous_Data: JSON.stringify(historyData)
  };

  const res = await fetch(`${CONFIG.API_BASE_URL}/save-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (res.ok) showToast('✅ Profile Updated!');
  else showToast('❌ Save failed', 'error');
}

async function requestOTP() {
  // Identifier can be the email in the profile or the username
  const identifier = document.getElementById('profGmail').value;

  const res = await fetch(`${CONFIG.API_BASE_URL}/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier })
  });
  const result = await res.json();

  if (res.ok) {
    showToast('📩 OTP sent to email');
    document.getElementById('otpBtn').style.display = 'none';
    document.getElementById('otpDisplay').style.display = 'block';
    document.getElementById('verifyOtpBtn').style.display = 'block';
    // Store the confirmed email if it was found via username
    localStorage.setItem('resetEmail', result.email);
  } else {
    showToast(result.message, 'error');
  }
}

async function handleVerifyOTP() {
  const profileEmail = document.getElementById('profGmail').value;
  const email = localStorage.getItem('resetEmail') || profileEmail;
  const otp = document.getElementById('otpInput').value;

  if (!otp) return showToast('Please enter OTP', 'error');

  const res = await fetch(`${CONFIG.API_BASE_URL}/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  });

  if (res.ok) {
    showToast('✅ OTP Verified');
    document.getElementById('otpInputGroup').style.display = 'none';
    document.getElementById('passwordChangeFields').style.display = 'block';
  } else {
    showToast('❌ Invalid OTP', 'error');
  }
}

async function verifyAndChangePassword() {
  const email = localStorage.getItem('resetEmail') || document.getElementById('profGmail').value;
  const otp = document.getElementById('otpInput').value;
  const password = document.getElementById('newPassword').value;
  const confirm = document.getElementById('confirmPassword').value;

  if (!otp) return showToast('Please enter OTP', 'error');
  if (!password || password.length < 6) return showToast('Password must be 6+ chars', 'error');
  if (password !== confirm) return showToast('Passwords do not match', 'error');

  const res = await fetch(`${CONFIG.API_BASE_URL}/verify-and-change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, password })
  });

  if (res.ok) {
    showToast('🔑 Password Updated!');
    document.getElementById('passwordChangeFields').style.display = 'none';
    document.getElementById('otpInputGroup').style.display = 'block';
    document.getElementById('otpDisplay').style.display = 'none';
    document.getElementById('otpBtn').style.display = 'flex';
    document.getElementById('verifyOtpBtn').style.display = 'none';
    document.getElementById('otpInput').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    localStorage.removeItem('resetEmail');
  } else {
    showToast('❌ Invalid OTP', 'error');
  }
}

function showFeatures() {
  showSection('features');
}

function saveLabHistory(entry) {
  let h = JSON.parse(localStorage.getItem('yardLabHistory') || '[]');
  h.unshift(`${new Date().toLocaleTimeString()}: ${entry}`);
  localStorage.setItem('yardLabHistory', JSON.stringify(h.slice(0, 10)));
}

function loadLabHistory() {
  const list = document.getElementById('labHistoryList');
  let h = JSON.parse(localStorage.getItem('yardLabHistory') || '[]');
  list.innerHTML = h.length 
    ? h.map(item => `<div style="padding:0.75rem; border-bottom:1px solid var(--surface-hover); font-size:0.85rem;">${item}</div>`).join('') 
    : '<p style="color:var(--text-muted); padding:1rem;">No history found.</p>';
}

function showCropGuide(crop) {
  const guideContent = document.getElementById('guideContent');
  const timelineSection = document.getElementById('timelineSection');
  const guideTimeline = document.getElementById('guideTimeline');

  if (!crop) {
    guideContent.innerHTML = `<div class="card"><p>Select a crop above to view detailed preparation and irrigation guides.</p></div>`;
    timelineSection.style.display = 'none';
    return;
  }

  const guides = {
    wheat: {
      name: "Wheat 🌾",
      prep: "Till soil to 15cm depth. Add organic compost. Best sown in Nov-Dec.",
      irrigation: "Requires 4-6 waterings. Critical stages: Crown Root Initiation & Flowering.",
      harvest: "Ready when grains are hard and straw is golden brown (approx 120 days).",
      timeline: [
        { step: "Week 1-2", task: "Soil Preparation & Sowing", desc: "Tilling, adding manure, and sowing seeds at 5cm depth." },
        { step: "Week 3-4", task: "Crown Root Initiation", desc: "First irrigation is critical here (21 days after sowing)." },
        { step: "Week 8-10", task: "Tillering & Jointing", desc: "Apply urea and maintain moisture for stem strength." },
        { step: "Week 14-16", task: "Flowering & Milking", desc: "Ensure water availability; avoid strong winds." },
        { step: "Week 18-20", task: "Maturity & Harvest", desc: "Reduce water; harvest when grain moisture is below 15%." }
      ]
    },
    rice: {
      name: "Rice 🍚",
      prep: "Puddling is essential. Maintain 5cm water level. Transplant 25-day old seedlings.",
      irrigation: "Constant flooding required until 2 weeks before harvest.",
      harvest: "Harvest when 80% of panicles turn straw-colored.",
      timeline: [
        { step: "Day 1-25", task: "Nursery Preparation", desc: "Raise healthy seedlings in a separate nursery bed." },
        { step: "Day 26-30", task: "Transplanting", desc: "Puddle the main field and transplant 2-3 seedlings per hill." },
        { step: "Week 5-8", task: "Tillering Stage", desc: "Maintain water levels and apply first round of fertilizer." },
        { step: "Week 10-12", task: "Panicle Initiation", desc: "Highest water demand; keep fields flooded." },
        { step: "Week 16-18", task: "Ripening & Harvesting", desc: "Drain water 10 days before harvest to harden soil." }
      ]
    },
    maize: {
      name: "Maize 🌽",
      prep: "Well-drained loamy soil. Sowing depth 3-5cm. Space rows at 60cm.",
      irrigation: "Tasseling and silking stages are most critical for water.",
      harvest: "Harvest when husks turn dry and grain moisture is around 20-25%.",
      timeline: [
        { step: "Week 1-2", task: "Sowing", desc: "Place seeds at 3-5cm depth with proper spacing (60x20cm)." },
        { step: "Week 4-6", task: "Knee-High Stage", desc: "Weeding and application of nitrogenous fertilizer." },
        { step: "Week 8-10", task: "Tasseling & Silking", desc: "Most critical water requirement stage." },
        { step: "Week 12-14", task: "Milk & Dough Stage", desc: "Grains fill with starch; monitor for pests." },
        { step: "Week 16-18", task: "Physiological Maturity", desc: "Black layer forms at base of grain; ready for harvest." }
      ]
    },
    tomato: {
      name: "Tomato 🍅",
      prep: "Well-aerated soil. pH 6.0-7.0. Stake plants for better yield.",
      irrigation: "Regular deep watering. Avoid wetting foliage to prevent blight.",
      harvest: "Pick when fruit is fully colored but still firm.",
      timeline: [
        { step: "Week 1-4", task: "Seedling Nursery", desc: "Grow in trays or nursery beds with protection from sun." },
        { step: "Week 5", task: "Transplanting", desc: "Move to main field; install support stakes immediately." },
        { step: "Week 8-10", task: "Vegetative Growth", desc: "Prune side shoots and ensure consistent watering." },
        { step: "Week 12-14", task: "Flowering & Fruit Set", desc: "Apply calcium to prevent blossom end rot." },
        { step: "Week 16+", task: "Continuous Harvest", desc: "Harvest fruits as they ripen to encourage more production." }
      ]
    }
  };

  const g = guides[crop];
  
  guideContent.innerHTML = `
    <div class="card"><div>🌱 Preparation (${g.name})</div><p>${g.prep}</p></div>
    <div class="card"><div>💧 Irrigation</div><p>${g.irrigation}</p></div>
    <div class="card"><div>🚜 Harvest</div><p>${g.harvest}</p></div>
  `;

  // Render Timeline
  timelineSection.style.display = 'block';
  guideTimeline.innerHTML = g.timeline.map(item => `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <h4>${item.step}: ${item.task}</h4>
      <p>${item.desc}</p>
    </div>
  `).join('');
}

function demoFeature(num) {
  const demos = {
    1: '📸 Camera soil scan: pH 6.8, NPK Excellent',
    2: '🎤 Voice: "Analyze soil" → Instant report generated',
    3: '📍 GPS: Field mapped, soil variation 12%',
    4: '🌦️ Weather: 3 days rain, delay planting 24h',
    5: '🌾 Crops: 1. Wheat 95% 2. Rice 88% 3. Maize 82%',
    6: '📊 Yield: Wheat 2.5 tons/acre predicted',
    7: '⚠️ Risk: Low 12% - Good weather ahead',
    8: '📈 Market: Wheat peak price Day 5 (+18%)',
    9: '💧 Irrigation: 28L/acre today recommended',
    10: '🌿 Fertilizer: NPK 120-60-40 optimal mix',
    11: '🛡️ Pests: Low risk, monitor aphids',
    12: '📱 Voice: "Crop recs" → Top 3 instantly',
    13: '📊 Analytics: Yield +18% vs last season'
  };
  showToast(`Feature ${num}: ${demos[num]}`);
}

// === LOCATION & WEATHER ===
function updateWeatherUI(weather) {
  document.getElementById('weather').textContent = `${weather.temp}°C ${weather.condition}`;
  document.getElementById('rainProb').textContent = `${weather.rain}%`;
  document.getElementById('windSpeed').textContent = `${weather.wind} km/h`;
  document.getElementById('humidity').textContent = `${weather.humidity}%`;
  
  const alertEl = document.getElementById('smartAlerts');
  const alerts = [];
  if (weather.rain > 60) alerts.push("🌧️ High Rain: Check drainage");
  if (weather.wind > 20) alerts.push("💨 Wind: Secure young plants");
  if (weather.humidity > 85) alerts.push("💧 High Humidity: Fungal risk");
  if (weather.temp > 35) alerts.push("🔥 Heat: Increase irrigation");
  
  alertEl.innerHTML = alerts.length > 0 ? alerts.join('<br>') : "✅ Conditions Optimal";
  alertEl.style.fontSize = "0.85rem";
}

async function initLocation() {
  const weatherEl = document.getElementById('liveWeather');
  try {
    if (weatherEl) weatherEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Locating...</span>';

    const position = await new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error("Not supported"));
      navigator.geolocation.getCurrentPosition(resolve, reject, { 
        enableHighAccuracy: true, 
        timeout: 5000 
      });
    });
    
    const { latitude, longitude } = position.coords;
    const weather = await fetchWeather(latitude, longitude);
    
    if (weatherEl) {
      weatherEl.innerHTML = `
        <i class="fas fa-sun"></i> 
        <span>${weather.temp}°C ${weather.condition} <small>(${latitude.toFixed(2)}, ${longitude.toFixed(2)})</small></span>
      `;
    }
    updateWeatherUI(weather);

  } catch (e) {
    console.warn("GPS failed or blocked. Using default weather data.");
    // Default to a generic location (e.g., New Delhi) so cards aren't stuck on "Loading"
    const fallbackWeather = await fetchWeather(28.61, 77.20);
    updateWeatherUI(fallbackWeather);
    
    if (weatherEl) {
      weatherEl.innerHTML = '<i class="fas fa-map-marker-alt"></i> <span style="cursor:pointer">Location blocked (Tap to retry)</span>';
      weatherEl.onclick = initLocation;
    }
  }
}

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
  initLocation();
  loadProfile();

  // Rehide sidebar when clicking anywhere outside of it
  document.addEventListener('click', (e) => {
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (sidebar.classList.contains('active') && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
      sidebar.classList.remove('active');
    }
  });
});

async function fetchWeather(lat, lon) {
  // Replace 'YOUR_API_KEY' with a free key from https://openweathermap.org/api
  const apiKey = '001046682c45842d77e64f4296ca6f8d'; 
  
  try {
    // Using the 5-day/3-hour forecast API to get "Probability of Precipitation" (pop)
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&cnt=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather service unavailable');
    
    const data = await res.json();
    const current = data.list[0];

    return {
      temp: Math.round(current.main.temp),
      condition: current.weather[0].main,
      rain: Math.round(current.pop * 100), // Probability of precipitation (0 to 1)
      wind: (current.wind.speed * 3.6).toFixed(1), // Convert m/s to km/h
      humidity: current.main.humidity
    };
  } catch (error) {
    // Fallback mock data if API key is missing or invalid
    return {
      temp: 28,
      condition: 'Clear',
      rain: 15,
      wind: 12.5,
      humidity: 65
    };
  }
}

// === UTILS ===
function changeLang(lang) {
  showToast(`Language: ${lang.toUpperCase()}`);
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; top: 2rem; left: 50%; transform: translateX(-50%);
    background: var(--farm-emerald); color: white; padding: 1rem 2rem;
    border-radius: var(--radius-lg); z-index: 1000; font-weight: 500;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('../../sw.js').catch(console.log);
}
