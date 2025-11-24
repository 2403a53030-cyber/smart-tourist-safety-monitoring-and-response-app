/*************************************************
 * MODE SWITCH: "A" (basic) | "B" (full) | "C" (minimal registration + PDF)
 *************************************************/
const MODE = "B"; // <-- change this to "A", "B", or "C"

/* Feature flags derived from MODE */
const FEATURES = {
  MAP: MODE === "B",
  HEATMAP: MODE === "B",
  TRAVEL_LOG: MODE === "B",
  SOS: MODE !== "A", // enable in B and C
  ANALYTICS: MODE !== "C", // analytics hidden in minimal C
};

/* ---------- GLOBALS ---------- */
let selectedType = null; // 'IND' | 'FOR'
let lastRegistration = { name: null, phone: null, id: null };
let photoURL = null;

/* 🔥 NEW: charts made global for live updates */
let touristChart, incidentChart, responseChart;

/* ---------- UTIL ---------- */
function formatAadhaar(input){
  const v = input.value.replace(/\D/g,'').slice(0,12);
  input.value = v.replace(/(\d{4})(?=\d)/g,'$1-');
}
function validatePassport(input){
  const regex=/^[A-PR-WY][1-9]\d{6}$/i;
  const err=document.getElementById('passportError');
  if(err){
    if(input.value && !regex.test(input.value)){ err.textContent='Invalid Passport (e.g., A1234567)'; err.style.display='block'; }
    else err.style.display='none';
  }
}

/* ---------- NAV ---------- */
document.querySelectorAll('.nav-item').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const target=btn.getAttribute('data-section');
    document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
    document.getElementById(target)?.classList.add('active');
    window.scrollTo({top:0,behavior:'smooth'});
  });
});

/* ---------- USER TYPE ---------- */
document.querySelectorAll('.user-type-card').forEach(btn=>{
  btn.onclick=()=>{
    selectedType = (btn.dataset.type==='indian-tourist') ? 'IND' : 'FOR';
    document.getElementById('indianTouristFields').classList.toggle('hidden', selectedType!=='IND');
    document.getElementById('foreignTouristFields').classList.toggle('hidden', selectedType!=='FOR');
    document.querySelector('[data-section="registration"]').click();
  };
});

/* ---------- PHOTO UPLOAD ---------- */
document.getElementById('photoUpload').addEventListener('change', function(){
  const file=this.files?.[0]; if(!file) return;
  const r=new FileReader();
  r.onload = (e)=>{
    photoURL = e.target.result;
    const img=document.getElementById('idPhotoPreview');
    img.src=photoURL; img.classList.remove('hidden');
  };
  r.readAsDataURL(file);
});

/* ---------- REGISTRATION ---------- */
document.getElementById('aadhaar').addEventListener('input', (e)=>formatAadhaar(e.target));
document.getElementById('passport').addEventListener('input', (e)=>validatePassport(e.target));
document.getElementById('phone').addEventListener('input', (e)=>{e.target.value=e.target.value.replace(/\D/g,'').slice(0,10);});

document.getElementById('registrationForm').addEventListener('submit', function(e){
  e.preventDefault();
  if(!selectedType){ alert('Please select user type first.'); return; }

  const name = selectedType==='IND'
    ? (document.getElementById('indianName').value || '')
    : (document.getElementById('foreignName').value || '');
  const phone = (document.getElementById('phone').value || '').replace(/\D/g,'').slice(0,10);
  const part1 = name.substring(0,3).toUpperCase();
  const part2 = phone.slice(-4);
  const part3 = Math.floor(100 + Math.random()*900);
  const digitalId = `${selectedType}-${part1}-${part2}-${part3}`;
  lastRegistration = { name, phone, id:digitalId };

  const details=document.getElementById('generatedIdDetails');
  const result=document.getElementById('digitalIdResult');
  details.innerHTML = `
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
    <p><strong>Digital ID:</strong> <span style="color:#ffef9c;font-weight:800">${escapeHtml(digitalId)}</span></p>
    <div id="generatedQR"></div>
    <button id="downloadA4PDF" class="btn btn--primary" style="margin-top:12px">📄 Download A4 ID Card</button>
  `;
  result.classList.remove('hidden');
  result.scrollIntoView({behavior:'smooth'});

  // QR
  const qrWrap=document.getElementById('generatedQR');
  qrWrap.innerHTML='';
  new QRCode(qrWrap, { text:digitalId, width:120, height:120 });

  // Bind Download
  document.getElementById('downloadA4PDF').onclick=downloadA4Pdf;

  /* 🔥 NEW: LIVE UPDATE - Tourist Distribution chart */
  if (touristChart) {
    if (selectedType === 'IND') {
      touristChart.data.datasets[0].data[0] += 1; // Domestic
    } else {
      touristChart.data.datasets[0].data[1] += 1; // Foreign
    }
    touristChart.update();
  }
});

/* ---------- DOWNLOAD A4 ID (Black + Neon + Photo + QR) ---------- */
function downloadA4Pdf(){
  if(!lastRegistration.id){ alert('Generate ID first.'); return; }
  const { jsPDF } = window.jspdf || {};
  if(!jsPDF){ alert('PDF library not loaded'); return; }

  const { name, phone, id } = lastRegistration;
  const pdf=new jsPDF('p','mm','a4');

  // Title
  pdf.setFont('helvetica','bold'); pdf.setFontSize(18);
  pdf.text('Government of India - Tourist Digital ID Card', 20, 18);

  // Black card
  pdf.setFillColor(0,0,0); pdf.rect(15,25,180,85,'F');
  pdf.setDrawColor(247,217,76); pdf.setLineWidth(1.4); pdf.rect(15,25,180,85);

  // Text
  pdf.setFont('helvetica','normal'); pdf.setFontSize(14); pdf.setTextColor(255,255,255);
  pdf.text(`Name: ${name}`, 55, 45);
  pdf.text(`Phone: ${phone}`, 55, 53);
  pdf.text(`Digital ID: ${id}`, 55, 61);

  // Photo
  if(photoURL){
    const fmt = photoURL.startsWith('data:image/png') ? 'PNG' : 'JPEG';
    try { pdf.addImage(photoURL, fmt, 20, 33, 30, 30); }
    catch {
      const img=new Image(); img.crossOrigin='anonymous';
      img.onload=()=>{
        const c=document.createElement('canvas'); c.width=img.width; c.height=img.height;
        c.getContext('2d').drawImage(img,0,0);
        pdf.addImage(c.toDataURL('image/jpeg',0.92),'JPEG',20,33,30,30);
        // QR add after conversion too
        const qr = getQrData();
        if(qr) pdf.addImage(qr,'PNG',150,33,40,40);
        pdf.setFontSize(10); pdf.setTextColor(247,217,76);
        pdf.text('Ministry of Tourism, Government of India', 20, 115);
        pdf.save(`${id}_A4_ID.pdf`);
      };
      img.src=photoURL;
      return;
    }
  }

  // QR
  const qr = getQrData();
  if(qr) pdf.addImage(qr, 'PNG', 150, 33, 40, 40);

  // Footer
  pdf.setFontSize(10); pdf.setTextColor(247,217,76);
  pdf.text('Ministry of Tourism, Government of India', 20, 115);

  pdf.save(`${id}_A4_ID.pdf`);
}
function getQrData(){
  const canvas = document.querySelector('#generatedQR canvas');
  return canvas ? canvas.toDataURL() : null;
}

/* ---------- MODE VISIBILITY ---------- */
document.addEventListener('DOMContentLoaded', ()=>{
  // Show/hide sections by MODE
  if(MODE==='A'){ // Basic UI only
    document.getElementById('dashboard').style.display='block';
    document.getElementById('analytics').style.display='block';
  }
  if(MODE==='B'){
    document.getElementById('bControls').style.display='flex';
    document.getElementById('liveMap').style.display='block';
    document.getElementById('travelTitle').style.display='block';
    initMapAndFeatures();
  }
  if(MODE==='C'){ // Minimal: hide dashboard & analytics
    document.getElementById('dashboard').style.display='none';
    document.getElementById('analytics').style.display='none';
  }

  initCharts(); // harmless if canvas missing
});

/* ---------- MAP & FEATURES (B only) ---------- */
let map=null, userMarker=null, accuracyCircle=null, watchId=null, heatmapLayer=null;
let travelLog=[], routeLine=null, autoLogTimer=null;

function initMapAndFeatures(){
  if(!FEATURES.MAP) return;
  map = L.map('liveMap').setView([20.5937,78.9629],5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap'}).addTo(map);

  document.getElementById('locateMeBtn').onclick=locateMeOnce;
  document.getElementById('trackToggleBtn').onclick=function(){
    if(!watchId){ startTracking(); this.textContent='Stop Live Tracking'; this.classList.add('btn--primary'); }
    else { stopTracking(); this.textContent='Start Live Tracking'; this.classList.remove('btn--primary'); }
  };

  if(FEATURES.TRAVEL_LOG){
    document.getElementById('saveLocationBtn').onclick = ()=>navigator.geolocation.getCurrentPosition(p=>addTravelPoint(p.coords.latitude,p.coords.longitude));
    document.getElementById('autoLogBtn').onclick = function(){
      if(autoLogTimer){ clearInterval(autoLogTimer); autoLogTimer=null; this.textContent='Start Auto Travel Log'; }
      else { autoLogTimer=setInterval(()=>navigator.geolocation.getCurrentPosition(p=>addTravelPoint(p.coords.latitude,p.coords.longitude)), 120000); this.textContent='Stop Auto Travel Log'; }
    };
  }

  if(FEATURES.HEATMAP){
    document.getElementById('toggleHeatmapBtn').onclick = function(){
      if(heatmapLayer){ heatmapLayer.remove(); heatmapLayer=null; this.textContent='Show Crime Heatmap'; }
      else{
        const crimeZones = [[17.9689,79.5941,0.9],[17.9807,79.6006,0.7],[17.9756,79.5300,0.6]];
        heatmapLayer = L.heatLayer(crimeZones,{radius:35,blur:22,maxZoom:12}).addTo(map);
        this.textContent='Hide Crime Heatmap';
      }
    };
  }
}
function locateMeOnce(){
  if(!navigator.geolocation) return alert('Geolocation not supported');
  const s=document.getElementById('gpsStatus'); if(s) s.textContent='Getting location…';
  navigator.geolocation.getCurrentPosition(
    p=>{ setUserPosition(p.coords.latitude,p.coords.longitude,p.coords.accuracy); if(s) s.textContent=`Location OK (±${Math.round(p.coords.accuracy)}m)`; },
    err=>{ if(s) s.textContent=`GPS error: ${err.message}`; },
    {enableHighAccuracy:true, maximumAge:10000, timeout:20000}
  );
}
function setUserPosition(lat,lon,acc){
  const ll=[lat,lon];
  if(!userMarker){ userMarker=L.marker(ll).addTo(map).bindPopup('You are here'); } else userMarker.setLatLng(ll);
  if(!accuracyCircle){ accuracyCircle=L.circle(ll,{radius:acc||30}).addTo(map); } else accuracyCircle.setLatLng(ll).setRadius(acc||30);
  map.setView(ll, Math.max(map.getZoom(), 15));
}
function startTracking(){
  watchId = navigator.geolocation.watchPosition(
    p=>{ setUserPosition(p.coords.latitude,p.coords.longitude,p.coords.accuracy); const s=document.getElementById('gpsStatus'); if(s) s.textContent=`Tracking (±${Math.round(p.coords.accuracy)}m)`; },
    err=>{ const s=document.getElementById('gpsStatus'); if(s) s.textContent=`GPS error: ${err.message}`; },
    {enableHighAccuracy:true, maximumAge:5000, timeout:20000}
  );
}
function stopTracking(){ if(watchId!==null){ navigator.geolocation.clearWatch(watchId); watchId=null; const s=document.getElementById('gpsStatus'); if(s) s.textContent='Tracking stopped'; } }

function addTravelPoint(lat,lon){
  travelLog.push([lat,lon]);
  const list=document.getElementById('travelList');
  list.innerHTML = travelLog.map((p,i)=>`<li>Point ${i+1}: ${p[0].toFixed(5)}, ${p[1].toFixed(5)}</li>`).join('');
  if(routeLine) routeLine.remove();
  if(travelLog.length>1){ routeLine=L.polyline(travelLog,{color:'#c9a227',weight:4}).addTo(map); }
}

/* ---------- SOS ---------- */
document.getElementById('sosBtn').onclick = sendSOS;
function sendSOS(){
  const statusEl=document.getElementById('sosStatus');
  const contact=(document.getElementById('sosContact').value||'').trim();
  if(!contact){ if(statusEl) statusEl.textContent='Set SOS contact number first.'; return; }

  const msg = (lat,lon)=>`🚨 EMERGENCY SOS ALERT 🚨
Tourist Needs Immediate Help!
Name: ${lastRegistration.name || 'Unknown'}
ID: ${lastRegistration.id || 'N/A'}
Phone: ${lastRegistration.phone || 'N/A'}

📍 Location:
${lat.toFixed(5)}, ${lon.toFixed(5)}
https://maps.google.com/?q=${lat},${lon}`;

  const fallback=(m)=>{ window.location.href=`sms:${contact}?body=${encodeURIComponent(m)}`; setTimeout(()=>window.open(`https://wa.me/${contact}?text=${encodeURIComponent(m)}`,'_blank'),800); };

  if(!navigator.geolocation){ fallback(msg(0,0)); if(statusEl) statusEl.textContent='SOS opened in SMS & WhatsApp (no GPS)'; return; }
  navigator.geolocation.getCurrentPosition(
    p=>{ 
      fallback(msg(p.coords.latitude,p.coords.longitude)); 
      if (statusEl) statusEl.textContent='SOS opened in SMS & WhatsApp.'; 
      /* 🔥 NEW: LIVE UPDATE - Incident trend adds one to latest month */
      if (incidentChart) { incidentChart.data.datasets[0].data[incidentChart.data.datasets[0].data.length-1] += 1; incidentChart.update(); }
    },
    err=>{ if(statusEl) statusEl.textContent=`GPS error: ${err.message}`; },
    {enableHighAccuracy:true, timeout:20000}
  );
}

/* ---------- CHARTS (now live-updatable) ---------- */
function initCharts(){
  try{
    const tc=document.getElementById('touristChart');
    if(tc) touristChart = new Chart(tc,{
      type:'doughnut',
      data:{ labels:['Domestic','Foreign'], datasets:[{ data:[78,22], backgroundColor:['#1FB8CD','#FFC185'] }] },
      options:{ plugins:{ legend:{ position:'bottom' } }, responsive:true, maintainAspectRatio:false }
    });

    const ic=document.getElementById('incidentChart');
    if(ic) incidentChart = new Chart(ic,{
      type:'line',
      data:{ labels:['Jan','Feb','Mar','Apr','May','Jun'], datasets:[{ label:'Incidents', data:[12,9,14,8,16,10], tension:.3, borderColor:'#B4413C', fill:false }] },
      options:{ plugins:{ legend:{ display:false } }, responsive:true, maintainAspectRatio:false }
    });

    const rc=document.getElementById('responseChart');
    if(rc) responseChart = new Chart(rc,{
      type:'bar',
      data:{ labels:['Q1','Q2','Q3','Q4'], datasets:[{ label:'Avg mins', data:[4.2,3.9,3.8,3.6], backgroundColor:'#FFC185' }] },
      options:{ plugins:{ legend:{ display:false } }, responsive:true, maintainAspectRatio:false }
    });
  }catch(e){}
}

/* ---------- Helpers ---------- */
function escapeHtml(s){ return String(s).replace(/[&<>"']/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
