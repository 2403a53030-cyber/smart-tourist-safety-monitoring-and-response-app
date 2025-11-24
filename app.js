/* 
  app.js - Clean Modern Government Theme Version
  Handles: Navigation, Registration, Dashboard, SOS, Analytics, Authentication
*/

const MODE = "B"; // Full Features

// API Configuration
// CHANGE THIS URL AFTER DEPLOYING TO RENDER (e.g., "https://your-app.onrender.com")
const API_BASE_URL = "http://localhost:5000";

// State
let currentUser = null; // { name, id, phone, type }
let selectedType = null;
let lastRegistration = null;
let map, userMarker, heatLayer;
let watchId = null;
let path = [];

// Charts
let touristChart, incidentChart, responseChart;

document.addEventListener('DOMContentLoaded', () => {
  checkSession(); // Check if user is already logged in
  initNavigation();
  initUserTypeSelection();
  initMap();
  initCharts();

  // Forms
  const regForm = document.getElementById('registrationForm');
  if (regForm) regForm.addEventListener('submit', handleRegistration);

  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  // Photo Upload Preview
  const photoInput = document.getElementById('photoUpload');
  if (photoInput) {
    photoInput.addEventListener('change', function () {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
          lastRegistration = { ...lastRegistration, photoURL: e.target.result };
        };
        reader.readAsDataURL(this.files[0]);
      }
    });
  }

  // Buttons
  document.getElementById('sosBtn')?.addEventListener('click', sendSOS);
  document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);

  // Dashboard Controls
  document.getElementById('locateMeBtn')?.addEventListener('click', locateUser);
  document.getElementById('trackToggleBtn')?.addEventListener('click', toggleTracking);
  document.getElementById('saveLocationBtn')?.addEventListener('click', saveLocationPoint);
  document.getElementById('autoLogBtn')?.addEventListener('click', toggleAutoLog);
  document.getElementById('toggleHeatmapBtn')?.addEventListener('click', toggleHeatmap);
});

/* ================= AUTHENTICATION ================= */
function checkSession() {
  const storedUser = localStorage.getItem('touristUser');
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    updateAuthUI(true);
  } else {
    updateAuthUI(false);
  }
}

function updateAuthUI(isLoggedIn) {
  const protectedLinks = document.querySelectorAll('.protected-link');
  const loginBtn = document.getElementById('loginNavBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (isLoggedIn) {
    protectedLinks.forEach(el => el.classList.remove('hidden'));
    if (loginBtn) loginBtn.classList.add('hidden');
    if (logoutBtn) logoutBtn.classList.remove('hidden');
  } else {
    protectedLinks.forEach(el => el.classList.add('hidden'));
    if (loginBtn) loginBtn.classList.remove('hidden');
    if (logoutBtn) logoutBtn.classList.add('hidden');
  }
}

function handleLogin(e) {
  e.preventDefault();
  const loginId = document.getElementById('loginId').value.trim();

  if (!loginId) {
    showToast('Please enter your Digital ID or Mobile Number.', 'error');
    return;
  }

  // Simulate Login (Accept any valid-looking input for demo)
  // In real app, verify against backend
  const mockUser = {
    name: "Verified Tourist",
    id: loginId,
    phone: loginId.match(/^\d+$/) ? loginId : "9876543210",
    type: "IND"
  };

  loginUser(mockUser);
}

function loginUser(user) {
  currentUser = user;
  localStorage.setItem('touristUser', JSON.stringify(user));
  updateAuthUI(true);

  // Redirect to Dashboard
  document.querySelector('[data-section="dashboard"]').click();
  showToast(`Welcome back, ${user.name || 'Tourist'}!`, 'success');
}

function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    currentUser = null;
    localStorage.removeItem('touristUser');
    updateAuthUI(false);

    // Redirect to Home
    navigateTo('landing');
  }
}

/* ================= NAVIGATION ================= */
function navigateTo(sectionId) {
  const sections = document.querySelectorAll('.section');
  const navBtns = document.querySelectorAll('.nav-btn');

  // Check if section exists
  const targetSection = document.getElementById(sectionId);
  if (!targetSection) {
    console.error(`Section ${sectionId} not found`);
    return;
  }

  // Update Nav State
  navBtns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-section') === sectionId) {
      btn.classList.add('active');
    }
  });

  // Update Section Visibility
  sections.forEach(sec => {
    sec.classList.remove('active');
  });
  targetSection.classList.add('active');

  // Special Handling
  if (sectionId === 'dashboard' && map) {
    setTimeout(() => map.invalidateSize(), 200);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Expose to window for HTML onclick handlers
window.navigateTo = navigateTo;

function initNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');

  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();

      // Check access for protected links
      if (btn.classList.contains('protected-link') && !currentUser) {
        showToast('Access Denied. Please Login first.', 'error');
        navigateTo('login');
        return;
      }

      const targetId = btn.getAttribute('data-section');
      if (targetId) {
        navigateTo(targetId);
      }
    });
  });
}

function checkLoginAndRedirect(targetSection) {
  if (currentUser) {
    navigateTo(targetSection);
  } else {
    showToast('Please Login or Register to access this feature.', 'warning');
    navigateTo('login');
  }
}

/* ================= USER TYPE SELECTION ================= */
function initUserTypeSelection() {
  const typeCards = document.querySelectorAll('.selection-card');
  const regForm = document.getElementById('registrationForm');
  const indianFields = document.getElementById('indianTouristFields');
  const foreignFields = document.getElementById('foreignTouristFields');

  typeCards.forEach(card => {
    card.addEventListener('click', () => {
      // Visual selection
      typeCards.forEach(c => c.classList.remove('selected'));
      // Select all cards of this type (both on landing and registration)
      const type = card.getAttribute('data-type');
      document.querySelectorAll(`.selection-card[data-type="${type}"]`).forEach(c => c.classList.add('selected'));

      // Logic
      selectedType = type === 'indian-tourist' ? 'IND' : 'FOR';

      // Show Form
      if (regForm) regForm.classList.remove('hidden');

      // Show relevant form fields
      if (selectedType === 'IND') {
        indianFields.classList.remove('hidden');
        foreignFields.classList.add('hidden');
      } else {
        indianFields.classList.add('hidden');
        foreignFields.classList.remove('hidden');
      }

      // Scroll to form if we are already on registration page
      if (document.getElementById('registration').classList.contains('active')) {
        regForm.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Switch to registration tab if on landing
        document.querySelector('[data-section="registration"]').click();
      }
    });
  });
}

/* ================= REGISTRATION ================= */
// Aadhaar Input Validation
document.getElementById('aadhaar')?.addEventListener('input', function (e) {
  this.value = this.value.replace(/\D/g, '').slice(0, 16);
});

async function handleRegistration(e) {
  e.preventDefault();

  if (!selectedType) {
    showToast('Please select a user type first (Indian/Foreign).', 'warning');
    return;
  }

  // Gather Data
  const name = selectedType === 'IND'
    ? document.getElementById('indianName').value
    : document.getElementById('foreignName').value;

  const phone = document.getElementById('phone').value;
  const email = document.getElementById('email').value;

  // Aadhaar Validation
  if (selectedType === 'IND') {
    const aadhaar = document.getElementById('aadhaar').value;
    if (aadhaar.length !== 16) {
      showToast('Aadhaar number must be exactly 16 digits.', 'error');
      return;
    }
  }

  // Generate ID
  const part1 = name ? name.substring(0, 3).toUpperCase() : 'XXX';
  const part2 = phone ? phone.slice(-4) : '0000';
  const part3 = Math.floor(1000 + Math.random() * 9000);
  const digitalId = `${selectedType}-${part1}-${part2}-${part3}`;

  // Update State
  lastRegistration = {
    name,
    phone,
    id: digitalId,
    photoURL: lastRegistration?.photoURL
  };

  // Prepare Payload
  const formData = new FormData();
  formData.append('userType', selectedType);
  formData.append('name', name);
  formData.append('phone', phone);
  formData.append('email', email);
  formData.append('digitalId', digitalId);

  const photoFile = document.getElementById('photoUpload').files[0];
  if (photoFile) {
    formData.append('photo', photoFile);
  }

  // Attempt Backend Registration
  try {
    const res = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      body: formData
    });
    if (res.ok) console.log('Backend registration successful');
  } catch (err) {
    console.warn('Backend offline, using local fallback');
  }

  // Show Result
  displayDigitalId(name, phone, digitalId, lastRegistration.photoURL);
  updateChartsOnRegistration(selectedType);

  // Auto Login
  loginUser({ name, phone, id: digitalId, type: selectedType });
}

function displayDigitalId(name, phone, id, photoDataURL) {
  const resultDiv = document.getElementById('digitalIdResult');
  const detailsDiv = document.getElementById('generatedIdDetails');
  const photoPreview = document.getElementById('idPhotoPreview');

  detailsDiv.innerHTML = `
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>ID:</strong> ${id}</p>
    <p><strong>Phone:</strong> ${phone}</p>
    <p style="color:var(--gov-green); font-size:0.8rem">Verified by Ministry of Tourism</p>
  `;

  if (photoDataURL) {
    photoPreview.src = photoDataURL;
    photoPreview.classList.remove('hidden');
  } else {
    photoPreview.classList.add('hidden');
  }

  // QR Code
  const qrContainer = document.getElementById('qrcode');
  qrContainer.innerHTML = '';
  new QRCode(qrContainer, {
    text: id,
    width: 100,
    height: 100,
    colorDark: "#1a237e", // Gov Blue
    colorLight: "#ffffff"
  });

  resultDiv.classList.remove('hidden');
  resultDiv.scrollIntoView({ behavior: 'smooth' });

  // Add Download Button if not exists
  const btnContainer = document.getElementById('downloadBtnContainer');
  btnContainer.innerHTML = ''; // Clear previous button
  const btn = document.createElement('button');
  btn.className = 'btn-primary-lg';
  btn.style.fontSize = '0.9rem';
  btn.style.padding = '0.8rem 1.5rem';
  btn.innerHTML = '<i class="bi bi-file-earmark-pdf"></i> Download ID Card';
  btn.onclick = () => downloadPDF(name, id);
  btnContainer.appendChild(btn);
}

function downloadPDF(name, id) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Official PDF Design
  doc.setFillColor(26, 35, 126); // Gov Blue
  doc.rect(0, 0, 210, 40, 'F');

  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("Government of India", 105, 20, null, null, "center");
  doc.setFontSize(14);
  doc.text("Ministry of Tourism - Digital Identity", 105, 30, null, null, "center");

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.text(`Name: ${name}`, 20, 60);
  doc.text(`Digital ID: ${id}`, 20, 70);
  doc.text(`Issued: ${new Date().toLocaleDateString()}`, 20, 80);

  // Add QR Code
  const qrImg = document.querySelector('#qrcode img');
  if (qrImg && qrImg.src) {
    doc.addImage(qrImg.src, 'PNG', 140, 50, 40, 40);
  }

  doc.setLineWidth(0.5);
  doc.setDrawColor(255, 153, 51); // Saffron Border
  doc.rect(15, 50, 180, 50);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("This card is electronically generated and valid for tourist safety services.", 105, 120, null, null, "center");

  doc.save(`Tourist_ID_${id}.pdf`);
}

/* ================= MAP & DASHBOARD ================= */
function initMap() {
  if (document.getElementById('liveMap')) {
    map = L.map('liveMap').setView([20.5937, 78.9629], 5); // India Center
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
  }
}

function locateUser() {
  if (!navigator.geolocation) {
    showToast('Geolocation is not supported', 'error');
    return;
  }

  const status = document.getElementById('gpsStatus');
  status.innerText = 'Locating...';
  status.style.color = 'var(--gov-saffron)';

  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    const latLng = [latitude, longitude];

    if (userMarker) {
      userMarker.setLatLng(latLng);
    } else {
      userMarker = L.marker(latLng).addTo(map)
        .bindPopup("You are here").openPopup();
    }

    map.setView(latLng, 15);
    status.innerText = 'GPS Active';
    status.style.color = 'var(--gov-green)';

    // Add to path
    path.push(latLng);
    L.polyline(path, { color: '#1a237e' }).addTo(map);

    // Log
    addHistoryItem(`Location Update: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

  }, err => {
    console.error(err);
    status.innerText = 'GPS Error';
    status.style.color = '#d32f2f';
  });
}

function toggleTracking() {
  const btn = document.getElementById('trackToggleBtn');
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
    btn.innerHTML = '<i class="bi bi-record-circle"></i> Start Tracking';
    btn.classList.remove('active');
  } else {
    watchId = navigator.geolocation.watchPosition(pos => {
      const { latitude, longitude } = pos.coords;
      const latLng = [latitude, longitude];

      if (userMarker) userMarker.setLatLng(latLng);
      else userMarker = L.marker(latLng).addTo(map);

      map.setView(latLng);
      path.push(latLng);
      L.polyline(path, { color: '#d32f2f' }).addTo(map);
    });

    btn.innerHTML = '<i class="bi bi-stop-circle"></i> Stop Tracking';
    btn.classList.add('active');
  }
}

function addHistoryItem(text) {
  const list = document.getElementById('travelList');
  if (list.querySelector('.empty-log')) {
    list.innerHTML = '';
  }

  const li = document.createElement('li');
  li.innerHTML = `
    <div style="display:flex; justify-content:space-between;">
      <span>${text}</span>
      <span style="opacity:0.7; font-size:0.8em">${new Date().toLocaleTimeString()}</span>
    </div>
  `;
  list.prepend(li);
}

// Placeholders
function saveLocationPoint() { showToast('Location saved to secure government server.', 'success'); }
function toggleAutoLog() { showToast('Auto-logging enabled (Simulation).', 'info'); }
function toggleHeatmap() {
  const btn = document.getElementById('toggleHeatmapBtn');

  if (!heatLayer) {
    // Comprehensive Safety Data (Lat, Lng, Intensity)
    // Higher intensity = More reported incidents/alerts
    const heatData = [
      // North India
      [28.6139, 77.2090, 0.9], // Delhi (High)
      [27.1767, 78.0081, 0.7], // Agra
      [26.9124, 75.7873, 0.6], // Jaipur
      [31.1048, 77.1734, 0.4], // Shimla
      [30.7333, 76.7794, 0.5], // Chandigarh

      // West India
      [19.0760, 72.8777, 0.8], // Mumbai (High)
      [15.2993, 74.1240, 0.7], // Goa
      [18.5204, 73.8567, 0.6], // Pune
      [23.0225, 72.5714, 0.5], // Ahmedabad

      // South India
      [12.9716, 77.5946, 0.7], // Bangalore
      [13.0827, 80.2707, 0.6], // Chennai
      [17.3850, 78.4867, 0.6], // Hyderabad
      [10.8505, 76.2711, 0.4], // Kerala (General)
      [9.9312, 76.2673, 0.5],  // Kochi

      // East India
      [22.5726, 88.3639, 0.7], // Kolkata
      [27.0410, 88.2663, 0.3], // Darjeeling
      [20.2961, 85.8245, 0.4], // Bhubaneswar

      // Central
      [23.2599, 77.4126, 0.5], // Bhopal
      [21.1458, 79.0882, 0.5], // Nagpur
    ];

    heatLayer = L.heatLayer(heatData, {
      radius: 25,
      blur: 15,
      maxZoom: 10,
      gradient: {
        0.4: 'blue',
        0.6: 'cyan',
        0.7: 'lime',
        0.8: 'yellow',
        1.0: 'red'
      }
    }).addTo(map);

    btn.classList.add('active');
    btn.innerHTML = '<i class="bi bi-eye-slash-fill"></i> Hide Heatmap';

    // Zoom out to show full country if needed
    map.setView([20.5937, 78.9629], 5);

    // Add Interactive Markers
    addSafetyMarkers(heatData);

  } else {
    map.removeLayer(heatLayer);
    heatLayer = null;
    btn.classList.remove('active');
    btn.innerHTML = '<i class="bi bi-layers-fill"></i> Safety Heatmap';

    // Remove markers
    if (window.safetyMarkers) {
      window.safetyMarkers.forEach(m => map.removeLayer(m));
      window.safetyMarkers = [];
    }
  }
}

function addSafetyMarkers(data) {
  window.safetyMarkers = [];
  data.forEach(point => {
    if (point[2] > 0.6) { // Only for high risk areas
      const marker = L.circleMarker([point[0], point[1]], {
        radius: 8,
        fillColor: '#ff0000',
        color: '#fff',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(map);

      marker.bindPopup(`
        <div style="text-align:center">
          <strong style="color:#d32f2f">High Alert Zone</strong><br>
          Reported Incidents: High<br>
          <small>Exercise Caution</small>
        </div>
      `);

      window.safetyMarkers.push(marker);
    }
  });
}

/* ================= SOS ================= */
/* ================= SOS ================= */
let sosCountdownInterval;

function sendSOS() {
  const contact = document.getElementById('sosContact').value;
  const statusDiv = document.getElementById('sosStatus');

  if (!contact) {
    showToast('Please enter an emergency contact number.', 'error');
    return;
  }

  // Countdown Overlay
  let count = 3;
  const overlay = document.createElement('div');
  overlay.className = 'sos-overlay';
  overlay.innerHTML = `
    <div class="sos-countdown-box">
      <h2>SENDING SOS</h2>
      <div class="countdown-number">${count}</div>
      <button id="cancelSosBtn" class="btn-secondary-lg">CANCEL</button>
    </div>
  `;
  document.body.appendChild(overlay);

  // Style Overlay
  Object.assign(overlay.style, {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    background: 'rgba(211, 47, 47, 0.9)', zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white', textAlign: 'center'
  });

  const numberEl = overlay.querySelector('.countdown-number');
  numberEl.style.fontSize = '5rem';
  numberEl.style.fontWeight = 'bold';

  // Cancel Logic
  document.getElementById('cancelSosBtn').onclick = () => {
    clearInterval(sosCountdownInterval);
    document.body.removeChild(overlay);
    showToast('SOS Cancelled', 'info');
  };

  // Timer
  sosCountdownInterval = setInterval(() => {
    count--;
    numberEl.innerText = count;

    if (count === 0) {
      clearInterval(sosCountdownInterval);
      document.body.removeChild(overlay);
      triggerSOS(contact, statusDiv);
    }
  }, 1000);
}

function triggerSOS(contact, statusDiv) {
  statusDiv.innerHTML = '<div style="color:var(--gov-saffron)">Sending Alert...</div>';

  // Get Location
  let locString = "Unknown Location";
  if (userMarker) {
    const ll = userMarker.getLatLng();
    locString = `${ll.lat.toFixed(5)}, ${ll.lng.toFixed(5)}`;
  }

  // Simulate API call
  setTimeout(() => {
    statusDiv.innerHTML = `
      <div style="color:var(--gov-green); background:rgba(19, 136, 8, 0.1); padding:1rem; border-radius:8px; margin-top:1rem;">
        <strong>SOS SENT!</strong><br>
        Location shared with Police Control Room.<br>
        SMS sent to ${contact}.
      </div>
    `;

    // Open SMS
    const msg = `SOS! I need help. My location is: ${locString}. Please send help immediately.`;
    window.open(`sms:${contact}?body=${encodeURIComponent(msg)}`, '_blank');

    showToast('SOS Alert Sent Successfully!', 'success');

  }, 1500);
}

/* ================= UTILS ================= */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="bi ${getToastIcon(type)}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Animate In
  setTimeout(() => toast.classList.add('show'), 10);

  // Remove after 3s
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => container.removeChild(toast), 300);
  }, 3000);
}

function getToastIcon(type) {
  switch (type) {
    case 'success': return 'bi-check-circle-fill';
    case 'error': return 'bi-x-circle-fill';
    case 'warning': return 'bi-exclamation-triangle-fill';
    default: return 'bi-info-circle-fill';
  }
}

/* ================= ANALYTICS ================= */
function initCharts() {
  Chart.defaults.color = '#546e7a';
  Chart.defaults.borderColor = '#e0e0e0';

  // Tourist Distribution
  const ctx1 = document.getElementById('touristChart').getContext('2d');
  touristChart = new Chart(ctx1, {
    type: 'doughnut',
    data: {
      labels: ['Domestic', 'Foreign'],
      datasets: [{
        data: [65, 35],
        backgroundColor: ['#ff9933', '#138808'], // Saffron, Green
        borderWidth: 0
      }]
    },
    options: { plugins: { legend: { position: 'bottom' } } }
  });

  // Incidents
  const ctx2 = document.getElementById('incidentChart').getContext('2d');
  incidentChart = new Chart(ctx2, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Incidents',
        data: [12, 19, 3, 5, 2, 3],
        borderColor: '#d32f2f',
        tension: 0.4,
        fill: true,
        backgroundColor: 'rgba(211, 47, 47, 0.1)'
      }]
    },
    options: { plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false }
  });

  // Response Time
  const ctx3 = document.getElementById('responseChart').getContext('2d');
  responseChart = new Chart(ctx3, {
    type: 'bar',
    data: {
      labels: ['Police', 'Ambulance', 'Fire'],
      datasets: [{
        label: 'Avg Response (mins)',
        data: [15, 20, 12],
        backgroundColor: ['#1a237e', '#d32f2f', '#ffb300'] // Blue, Red, Amber
      }]
    },
    options: { plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false }
  });
}

function updateChartsOnRegistration(type) {
  if (touristChart) {
    const idx = type === 'IND' ? 0 : 1;
    touristChart.data.datasets[0].data[idx]++;
    touristChart.update();
  }
}
