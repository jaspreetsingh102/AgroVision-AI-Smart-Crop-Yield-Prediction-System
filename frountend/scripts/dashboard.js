// AI Farmer Dashboard - Neumorphic Theme
// Matches new UI theme, preserved functionality

// Section switching
function showSection(id) {
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });
  document.getElementById(id).classList.add('active');
  
  // Update sidebar
  document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
  event.target.classList.add('active');
}

// === AI FEATURES ===
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

function predictMarket() {
  document.getElementById('marketResult').innerHTML = `
    <div style="color: var(--farm-emerald); font-weight: 600;">
      📈 7-Day Forecast:
    </div>
    <p>Wheat: +12% | Rice: +8% | Maize: Stable</p>
    <p>Best time to sell: Day 4</p>
  `;
}

function saveProfile() {
  const landSize = document.getElementById('landSize').value;
  showToast('Profile saved!');
}

function showFeatures() {
  showSection('features');
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

// === INIT ===
document.addEventListener('DOMContentLoaded', async () => {
  // Live GPS Weather
  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
    
    const { latitude, longitude } = position.coords;
    const weather = await fetchWeather(latitude, longitude);
    
    const weatherEl = document.getElementById('liveWeather');
    weatherEl.innerHTML = `
      <i class="fas fa-sun"></i> 
      <span>${weather.temp}°C ${weather.condition} <small>(${latitude.toFixed(2)}, ${longitude.toFixed(2)})</small></span>
    `;
    
    document.getElementById('weather').textContent = `${weather.temp}°C ${weather.condition}`;
  } catch (e) {
    document.getElementById('liveWeather').innerHTML = '<i class="fas fa-location-arrow"></i> Enable location';
  }
  
  // Dashboard demo
  setTimeout(() => {
    document.getElementById('soilHealth').textContent = 'A+';
    document.getElementById('topCrop').textContent = 'Wheat';
    document.getElementById('yieldPred').textContent = '+18%';
  }, 800);
});

async function fetchWeather(lat, lon) {
  // Mock OpenWeatherMap (replace with real API key)
  const mockData = {
    temp: Math.round(25 + Math.random() * 10),
    condition: ['Sunny ☀️', 'Cloudy ☁️', 'Rainy 🌧️', 'Clear ⭐'][Math.floor(Math.random() * 4)]
  };
  return mockData;
  
  // Real API (add your key)
  // const apiKey = 'YOUR_OPENWEATHER_KEY';
  // const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
  // return await res.json();
}

// === AI CHAT ===
function toggleAI() {
  const chat = document.getElementById('aiChat');
  chat.style.display = chat.style.display === 'flex' ? 'none' : 'flex';
}

function sendMessage() {
  const input = document.getElementById('chatInput');
  const box = document.getElementById('chatBox');
  const message = input.value.trim();
  
  if (!message) return;
  
  // User message
  box.innerHTML += `<div style="text-align: right; margin: 0.5rem 0; color: var(--text-primary);">
    You: ${message}
  </div>`;
  
  // AI response
  setTimeout(() => {
    const responses = [
      "Try wheat this season 🌾",
      "Soil pH perfect for rice",
      "Market prices rising next week 📈",
      "Check irrigation schedule",
      "Enable notifications for alerts"
    ];
    const reply = responses[Math.floor(Math.random() * responses.length)];
    box.innerHTML += `<div style="background: var(--surface-hover); padding: 1rem; border-radius: var(--radius-lg); margin: 0.5rem 0;">
      🤖 AI: ${reply}
    </div>`;
    box.scrollTop = box.scrollHeight;
  }, 800);
  
  input.value = '';
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
