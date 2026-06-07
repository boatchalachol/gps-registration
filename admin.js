// ══ ADMIN HEADER ════════════════════════════════════════════
function setupAdminHeader(){
  document.getElementById('mainHeader').style.display='flex';
  document.getElementById('headerLogo').className='h-logo admin-logo';
  document.getElementById('headerLogo').innerHTML='<img src="img/logo.png" alt="logo" style="width:32px;height:32px;object-fit:contain;border-radius:6px">';
  document.getElementById('headerTitle').textContent='CHALACHOL ADMIN';
  document.getElementById('headerSub').textContent='Admin: '+(currentUser.name||'');
  document.getElementById('headerRight').innerHTML=`<div class="h-tabs">
    <button class="htab active" data-page="qr"><i class="ti ti-qrcode"></i><span> QR</span></button>
    <button class="htab" data-page="manualreg"><i class="ti ti-clipboard-check"></i><span> ลงทะเบียนแทน</span></button>
    <button class="htab" data-page="wheel"><i class="ti ti-wheel"></i><span> สุ่มรางวัล</span></button>
    <button class="htab" data-page="dashboard"><i class="ti ti-chart-bar"></i><span> Dashboard</span></button>
    <button class="htab" data-page="voting"><i class="ti ti-trophy"></i><span> โหวต</span></button>
    <button class="htab" data-page="settings"><i class="ti ti-settings"></i><span> ตั้งค่า</span></button>
    <button class="htab" data-page="employees"><i class="ti ti-users"></i><span> พนักงาน</span></button>
    <button class="htab htab-danger" id="btnAdminLogout" title="ออกจากระบบ" aria-label="ออกจากระบบ"><i class="ti ti-logout"></i></button>
  </div>`;
  document.getElementById('headerRight').addEventListener('click',e=>{
    const btn=e.target.closest('[data-page]');
    if(btn)showAdminPage(btn.dataset.page,btn);
    const logoutBtn=e.target.closest('#btnAdminLogout');
    if(logoutBtn)doLogout();
  });
}
function showAdminPage(name,btnEl){
  if(wheelAnimFrame){cancelAnimationFrame(wheelAnimFrame);wheelAnimFrame=null;}
  if(dashRefreshTimer){clearInterval(dashRefreshTimer);dashRefreshTimer=null;}
  // unsubscribe realtime เมื่อออกจากหน้า voting
  if(name!=='voting'&&voteRealtimeChannel){try{db&&db.removeChannel(voteRealtimeChannel);}catch(_){}voteRealtimeChannel=null;}
  document.querySelectorAll('.apage').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.htab').forEach(t=>t.classList.remove('active'));
  const page=document.getElementById('apage-'+name);if(page)page.classList.add('active');
  if(btnEl instanceof Element)btnEl.classList.add('active');
  if(name==='dashboard'){loadDashboard();dashRefreshTimer=setInterval(loadDashboard,60000);}
  if(name==='employees')loadEmployees().then(renderEmployeeTable);
  if(name==='settings'){loadCheckpoints().then(()=>{renderCpSettings();});loadSettingsAdmin();syncSettingsUI();_renderVoiceSelect();}
  if(name==='qr')refreshQRPage();
  if(name==='manualreg')initMRegPage();
  if(name==='wheel')initWheelPage();
  if(name==='voting')initVotingPage();
}

// ══ ADMIN INIT ══════════════════════════════════════════════
async function initAdmin(){
  await Promise.all([loadCheckpoints(),loadEmployees(),loadSettingsAdmin(),loadQRTokens()]);
  syncSettingsUI();renderQRGrid();renderEmployeeTable();renderCpSettings();
  // G-7 FIX: start dashboard with timer — initAdmin goes directly to dashboard tab,
  // so we replicate the same logic as showAdminPage('dashboard') to start auto-refresh
  loadDashboard();
  if(dashRefreshTimer){clearInterval(dashRefreshTimer);dashRefreshTimer=null;}
  dashRefreshTimer=setInterval(loadDashboard,60000);
}
async function loadCheckpoints(){try{adminCheckpoints=await sbGetCheckpoints(false);}catch(e){adminCheckpoints=[];}}
async function loadEmployees(){try{adminEmployees=await sbGetEmployees();}catch(e){adminEmployees=[];}}
async function loadSettingsAdmin(){
  try{
    const s=await sbGetSettings();
    const t=v=>v===true||v==='true';
    featureFlags.qrEnabled=s.QREnabled!=='false';
    featureFlags.locationEnabled=t(s.LocationEnabled);
    featureFlags.radiusEnabled=t(s.RadiusLockEnabled);
    featureFlags.wheelOnTime=s['WheelOnTime']||'09:00';
    const togQR=document.getElementById('togQR');
    const togLoc=document.getElementById('togLocation');
    const togRad=document.getElementById('togRadius');
    if(togQR)togQR.checked=featureFlags.qrEnabled;
    if(togLoc)togLoc.checked=featureFlags.locationEnabled;
    if(togRad)togRad.checked=featureFlags.radiusEnabled;
    // โหลดค่าคะแนนโหวต
    const userScoreEl=document.getElementById('voteScoreUserInput');
    const superScoreEl=document.getElementById('voteScoreSuperInput');
    if(userScoreEl)userScoreEl.value=s['VoteScoreUser']||'10';
    if(superScoreEl)superScoreEl.value=s['VoteScoreSuper']||'100';
    // โหลดเวลากรองตรงเวลา wheel
    const wheelOnTimeEl=document.getElementById('wheelOnTimeInput');
    if(wheelOnTimeEl)wheelOnTimeEl.value=s['WheelOnTime']||'09:00';
    // โหลดเสียงที่เลือกไว้
    _selectedVoiceURI = s['WheelVoiceURI'] || '';
    _renderVoiceSelect();
  }catch(e){console.error('loadSettingsAdmin error:',e);}
}
async function loadQRTokens(){try{adminQRTokens=await sbGetQRTokens(true);}catch(e){adminQRTokens=[];}}

// ══ QR ADMIN ════════════════════════════════════════════════
function setExpiryPreset(days,e){
  const el=document.getElementById('qrExpiryInput');if(!el)return;
  document.querySelectorAll('.preset-btn').forEach(b=>b.classList.remove('active-preset'));
  if(e&&e.target)e.target.classList.add('active-preset');
  if(days===0){el.value='';return;}
  const d=new Date(Date.now()+days*86400000);
  el.value=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')
    +'T'+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
}
async function generateAllQR(){
  const expiryLocal=document.getElementById('qrExpiryInput')?.value||'';
  const expiryISO=expiryLocal?localDtToISO(expiryLocal):null;
  showLoading('กำลังสร้าง QR Code ทั้งหมด...');
  try{
    const d=await sbGenerateQR(null,expiryISO,true);
    if(!d.ok)throw new Error('สร้างไม่สำเร็จ');
    await loadQRTokens();renderQRGrid();
    showAlert('qrAdminAlert',`✅ สร้าง QR ใหม่ ${d.created.length} จุดสำเร็จ`,'success');
    setTimeout(()=>showAlert('qrAdminAlert','',''),4000);
  }catch(e){showAlert('qrAdminAlert','สร้างไม่ได้: '+e.message,'error');}
  finally{hideLoading();}
}
async function regenerateOne(cpId){
  const expiryLocal=document.getElementById('qrExpiryInput')?.value||'';
  const expiryISO=expiryLocal?localDtToISO(expiryLocal):null;
  showLoading('กำลังสร้าง QR ใหม่...');
  try{
    await sbGenerateQR(cpId,expiryISO,true);await loadQRTokens();renderQRGrid();
    showAlert('qrAdminAlert','✅ สร้าง QR ใหม่สำเร็จ','success');
    setTimeout(()=>showAlert('qrAdminAlert','',''),3000);
  }catch(e){showAlert('qrAdminAlert','สร้างไม่ได้: '+e.message,'error');}
  finally{hideLoading();}
}
async function refreshQRPage(){await loadQRTokens();renderQRGrid();}
function renderQRGrid(){
  clearAllTimers();
  const grid=document.getElementById('qrGrid');if(!grid)return;

  // กรองเฉพาะ QR ที่ยังไม่หมดอายุ (expires_at เป็น null หรือยังไม่ถึงเวลา)
  const now=new Date();
  const activeTokens=adminQRTokens.filter(t=>!t.expires_at||new Date(t.expires_at)>now);

  if(!activeTokens.length){
    grid.innerHTML=`<div style="color:var(--text3);font-size:13px;padding:24px;text-align:center;grid-column:1/-1">
      <i class="ti ti-qrcode-off" style="font-size:32px;display:block;margin-bottom:10px;opacity:.4"></i>
      ไม่มี QR Token ที่ยังใช้งานได้<br>กดปุ่ม <strong>สร้างใหม่ทั้งหมด</strong> เพื่อสร้าง
    </div>`;return;
  }
  grid.innerHTML='';
  activeTokens.forEach(t=>{
    const card=document.createElement('div');
    card.className='qr-card';card.id=`qrcard-${t.cp_id}`;
    let expHtml='';
    if(!t.expires_at){
      expHtml='<div class="qr-expires no-exp"><i class="ti ti-infinity" style="font-size:11px"></i> ไม่หมดอายุ</div>';
    }else{
      expHtml=`<div class="qr-expires has-exp" id="qrexp-${escHtml(t.cp_id)}">
        ⏱ <span id="qrtimer-${escHtml(t.cp_id)}">...</span>
      </div>`;
    }
    card.innerHTML=`
      <div class="qr-card-name">${escHtml(t.cp_name)}</div>
      <div class="qr-card-id">${escHtml(t.cp_id)}</div>
      <div class="qr-canvas-wrap" id="qrwrap-${escHtml(t.cp_id)}"></div>
      ${expHtml}
      <div class="qr-token-label">${escHtml(t.token)}</div>
      <div class="qr-actions">
        <button class="btn btn-outline" data-regen-cp="${escHtml(t.cp_id)}"><i class="ti ti-refresh"></i> รีเจน</button>
        <button class="btn btn-amber" data-dl-cp="${escHtml(t.cp_id)}" data-dl-name="${escHtml(t.cp_name)}"><i class="ti ti-download"></i> บันทึก</button>
      </div>`;
    grid.appendChild(card);
    card.addEventListener('click',ev=>{
      const regenBtn=ev.target.closest('[data-regen-cp]');
      if(regenBtn){regenerateOne(regenBtn.dataset.regenCp);return;}
      const dlBtn=ev.target.closest('[data-dl-cp]');
      if(dlBtn){downloadQR(dlBtn.dataset.dlCp,dlBtn.dataset.dlName);return;}
    });
    const wrap=document.getElementById(`qrwrap-${t.cp_id}`);
    if(wrap){wrap.innerHTML='';try{new QRCode(wrap,{text:t.token,width:160,height:160,colorDark:'#000',colorLight:'#fff',correctLevel:QRCode.CorrectLevel.H});}catch(_){}}
    if(t.expires_at){const expDate=new Date(t.expires_at);startCountdown(t.cp_id,expDate);}
  });
}
function startCountdown(cpId,expiryDate){
  if(qrTimers[cpId])clearInterval(qrTimers[cpId]);
  const tick=()=>{
    const diff=expiryDate-Date.now();
    const expEl=document.getElementById(`qrexp-${cpId}`);if(!expEl)return;
    if(diff<=0){
      clearInterval(qrTimers[cpId]);delete qrTimers[cpId];
      // ซ่อน card ที่หมดอายุออกจาก grid ทันที
      const card=document.getElementById(`qrcard-${cpId}`);
      if(card){
        card.style.transition='opacity 0.5s';card.style.opacity='0';
        setTimeout(()=>{
          card.remove();
          // ถ้าไม่เหลือ card ให้แสดงข้อความว่าง
          const grid=document.getElementById('qrGrid');
          if(grid&&!grid.querySelector('.qr-card')){
            grid.innerHTML=`<div style="color:var(--text3);font-size:13px;padding:24px;text-align:center;grid-column:1/-1">
              <i class="ti ti-qrcode-off" style="font-size:32px;display:block;margin-bottom:10px;opacity:.4"></i>
              ไม่มี QR Token ที่ยังใช้งานได้<br>กดปุ่ม <strong>สร้างใหม่ทั้งหมด</strong> เพื่อสร้าง
            </div>`;
          }
        },500);
      }
      return;
    }
    const h=Math.floor(diff/3600000),m=Math.floor((diff%3600000)/60000),s=Math.floor((diff%60000)/1000);
    const timerEl=document.getElementById(`qrtimer-${cpId}`);
    if(timerEl)timerEl.textContent=`${h>0?h+'ช. ':''}${m}:${String(s).padStart(2,'0')}`;
  };
  tick();qrTimers[cpId]=setInterval(tick,1000);
}
function downloadQR(cpId,cpName){
  const wrap=document.getElementById(`qrwrap-${cpId}`);if(!wrap)return;
  const canvas=wrap.querySelector('canvas');
  const img=wrap.querySelector('img');
  let src=null;
  if(canvas){try{src=canvas.toDataURL('image/png');}catch(_){}}
  if(!src&&img&&img.src)src=img.src;
  if(!src){showAlert('qrAdminAlert','ไม่สามารถดาวน์โหลด QR ได้','error');return;}
  const a=document.createElement('a');a.href=src;
  a.download=`QR-${(cpName||cpId).replace(/\s+/g,'_')}-${cpId}.png`;
  document.body.appendChild(a);a.click();document.body.removeChild(a);
}

// ══ SETTINGS ════════════════════════════════════════════════
function syncSettingsUI(){
  const qrOn=document.getElementById('togQR')?.checked??true;
  const locOn=document.getElementById('togLocation')?.checked??false;
  featureFlags.qrEnabled=qrOn;featureFlags.locationEnabled=locOn;
  const gs=document.getElementById('gpsSubOptions');
  if(gs){gs.style.opacity=locOn?'1':'0.35';gs.style.pointerEvents=locOn?'':'none';}
  if(!locOn){const r=document.getElementById('togRadius');if(r)r.checked=false;}
  const ts=document.getElementById('qrTokenSection'),to=document.getElementById('qrTokenOff');
  if(ts)ts.style.display=qrOn?'':'none';
  if(to)to.style.display=qrOn?'none':'';
  const pill=(icon,label,on)=>`<div class="fs-pill ${on?'on':'off'}"><div class="fs-dot"></div><i class="ti ${icon}" style="font-size:12px"></i> ${label}: <strong>${on?'เปิด':'ปิด'}</strong></div>`;
  const barHtml=pill('ti-qrcode','QR Token',qrOn)+pill('ti-map-pin','GPS Location',locOn);
  ['qrPageStatusBar','dashStatusBar'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=barHtml;});
  const fp=document.getElementById('flowPreview');
  if(fp){
    const step=(icon,label,active)=>`<div class="flow-step ${active?'active-step':'skip-step'}"><i class="ti ${icon}" style="font-size:12px"></i> ${label}</div>`;
    const arrow=`<span class="flow-arrow"><i class="ti ti-chevron-right"></i></span>`;
    fp.innerHTML=step('ti-login','เข้าสู่ระบบ',true)+arrow+step('ti-map-pin','เลือก CP',true)+arrow
      +step('ti-qrcode','สแกน QR',qrOn)+arrow+step('ti-satellite','GPS',locOn)+arrow
      +step('ti-check','ยืนยัน',true);
  }
  const td=document.getElementById('thDist');if(td)td.style.display=locOn?'':'none';
  // U-1 FIX: sync thDistSearch ด้วย (search table column ต้องซ่อน/แสดงเหมือน thDist)
  const tds=document.getElementById('thDistSearch');if(tds)tds.style.display=locOn?'':'none';
}
function syncCpFromDOM(){
  adminCheckpoints.forEach(cp=>{
    const n=document.getElementById('cpname-'+cp.id);
    const la=document.getElementById('cplat-'+cp.id);
    const lo=document.getElementById('cplng-'+cp.id);
    const r=document.getElementById('cprad-'+cp.id);
    if(n&&n.value.trim())cp.name=n.value.trim();
    if(la&&la.value&&isValidLat(la.value))cp.lat=parseFloat(la.value);
    if(lo&&lo.value&&isValidLng(lo.value))cp.lng=parseFloat(lo.value);
    if(r&&r.value){const rv=parseInt(r.value);if(!isNaN(rv)&&rv>=0)cp.max_radius=rv;}
  });
}
function renderCpSettings(){
  const list=document.getElementById('cpSettingsList');if(!list)return;
  if(!adminCheckpoints.length){list.innerHTML='<div style="color:var(--text3);font-size:13px;padding:12px;text-align:center">ยังไม่มี Checkpoint — กด เพิ่ม</div>';return;}
  list.innerHTML='';
  adminCheckpoints.forEach(cp=>{
    const row=document.createElement('div');row.className='cp-setting-row';
    row.innerHTML=`<div class="cp-setting-header">
        <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0">
          <i class="ti ti-map-pin" style="color:var(--text3);font-size:14px;flex-shrink:0"></i>
          <input type="text" value="${escHtml(cp.name)}" id="cpname-${escHtml(cp.id)}"
            aria-label="ชื่อ Checkpoint"
            style="background:transparent;border:none;border-bottom:1px solid var(--border2);color:var(--text);font-size:14px;font-weight:600;font-family:var(--font);outline:none;padding-bottom:2px;transition:border .2s;flex:1;min-width:0">
          <span style="font-family:var(--mono);font-size:10px;color:var(--text3);flex-shrink:0">${escHtml(cp.id)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
          <span class="badge ${cp.is_active?'b-teal':'b-gray'}">${cp.is_active?'เปิด':'ปิด'}</span>
          <label class="toggle" aria-label="เปิด/ปิด Checkpoint ${escHtml(cp.name)}">
            <input type="checkbox" ${cp.is_active?'checked':''} data-toggle-cp="${escHtml(cp.id)}">
            <div class="toggle-track"></div><div class="toggle-thumb"></div>
          </label>
          <button data-remove-cp="${escHtml(cp.id)}"
            style="background:none;border:none;color:var(--red);cursor:pointer;font-size:18px;padding:2px;line-height:1"
            aria-label="ลบ ${escHtml(cp.name)}">
            <i class="ti ti-trash"></i>
          </button>
        </div>
      </div>
      <div class="cp-setting-fields">
        <div class="cp-field-mini"><label>Latitude</label>
          <input type="number" value="${cp.lat}" id="cplat-${escHtml(cp.id)}" step="0.000001"
            min="-90" max="90" placeholder="เช่น 13.7563" aria-label="Latitude"></div>
        <div class="cp-field-mini"><label>Longitude</label>
          <input type="number" value="${cp.lng}" id="cplng-${escHtml(cp.id)}" step="0.000001"
            min="-180" max="180" placeholder="เช่น 100.5018" aria-label="Longitude"></div>
        <div class="cp-field-mini"><label>รัศมีสูงสุด (เมตร)</label>
          <input type="number" value="${cp.max_radius||300}" id="cprad-${escHtml(cp.id)}"
            min="10" max="10000" placeholder="300" aria-label="รัศมีสูงสุด"></div>
      </div>`;
    row.addEventListener('change',ev=>{
      const tog=ev.target.closest('[data-toggle-cp]');
      if(tog)toggleCpActive(tog.dataset.toggleCp,tog.checked);
    });
    row.addEventListener('click',ev=>{
      const rmBtn=ev.target.closest('[data-remove-cp]');
      if(rmBtn)removeCp(rmBtn.dataset.removeCp);
    });
    const nameIn=row.querySelector(`#cpname-${cp.id}`);
    if(nameIn){
      nameIn.addEventListener('focus',()=>nameIn.style.borderBottomColor='var(--teal)');
      nameIn.addEventListener('blur',()=>nameIn.style.borderBottomColor='var(--border2)');
    }
    list.appendChild(row);
  });
}
function toggleCpActive(cpId,checked){
  syncCpFromDOM();
  const cp=adminCheckpoints.find(c=>c.id===cpId);
  if(cp){cp.is_active=checked;renderCpSettings();}
}
function removeCp(cpId){
  syncCpFromDOM();
  const cp=adminCheckpoints.find(c=>c.id===cpId);
  if(!confirm(`ยืนยันลบ Checkpoint "${cp?.name||cpId}"?\nรายการลงทะเบียนเก่าจะยังคงอยู่`))return;
  adminCheckpoints=adminCheckpoints.filter(c=>c.id!==cpId);
  renderCpSettings();
}
function addCheckpointRow(){
  syncCpFromDOM();
  const newId=genCpId();
  // U-3 FIX: ใช้พิกัดกลางกรุงเทพเป็นค่า default แทน 0,0 ซึ่งผ่าน isValidLat/Lng โดยไม่มี warning
  adminCheckpoints.push({id:newId,name:'Checkpoint ใหม่',lat:13.7563,lng:100.5018,max_radius:300,is_active:true});
  renderCpSettings();
  // U-3 FIX: เลื่อน focus ไปที่ Lat field ด้วยเพื่อให้ Admin สังเกตว่าต้องกรอกพิกัดจริง
  setTimeout(()=>{
    document.getElementById('cpname-'+newId)?.focus();
    // แสดง warning เตือนให้กรอกพิกัดจริง
    showAlert('settingsAlert','⚠️ กรุณาแก้ไขพิกัด Lat/Lng ของ Checkpoint ใหม่ให้ถูกต้องก่อนบันทึก','warn');
  },100);
}
async function saveSettings(){
  syncCpFromDOM();
  for(const cp of adminCheckpoints){
    if(!isValidLat(cp.lat)||!isValidLng(cp.lng)){
      showAlert('settingsAlert',`Checkpoint "${cp.name}" มีค่า Lat/Lng ไม่ถูกต้อง`,'error');return;
    }
  }
  const togQR=document.getElementById('togQR');
  const togLoc=document.getElementById('togLocation');
  const togRad=document.getElementById('togRadius');
  // ค่าคะแนนโหวต
  const voteScoreUserEl=document.getElementById('voteScoreUserInput');
  const voteScoreSuperEl=document.getElementById('voteScoreSuperInput');
  const voteScoreUser=Math.max(1,Math.min(1000,parseInt(voteScoreUserEl?.value||'10')||10));
  const voteScoreSuper=Math.max(1,Math.min(1000,parseInt(voteScoreSuperEl?.value||'100')||100));
  const wheelOnTimeEl=document.getElementById('wheelOnTimeInput');
  const wheelOnTime=wheelOnTimeEl?.value||'09:00';
  // BUG-G FIX: validate HH:MM format before saving
  if(!/^\d{2}:\d{2}$/.test(wheelOnTime)){
    showAlert('settingsAlert','เวลาตัดรอบไม่ถูกต้อง — กรุณาใส่ในรูปแบบ HH:MM เช่น 09:00','error');return;
  }
  const settings={
    QREnabled:togQR?togQR.checked:featureFlags.qrEnabled,
    LocationEnabled:togLoc?togLoc.checked:featureFlags.locationEnabled,
    RadiusLockEnabled:togRad?togRad.checked:featureFlags.radiusEnabled,
    VoteScoreUser:voteScoreUser,
    VoteScoreSuper:voteScoreSuper,
    WheelOnTime:wheelOnTime,
    WheelVoiceURI: (document.getElementById('wheelVoiceSelect')?.value || _selectedVoiceURI || '')
  };
  _selectedVoiceURI = settings.WheelVoiceURI;
  featureFlags.qrEnabled=settings.QREnabled;
  featureFlags.locationEnabled=settings.LocationEnabled;
  featureFlags.radiusEnabled=settings.RadiusLockEnabled;
  featureFlags.wheelOnTime=wheelOnTime;
  showLoading('กำลังบันทึกการตั้งค่า...');
  try{
    await sbSaveSettings(settings);
    await sbSaveCheckpoints(adminCheckpoints);
    hideLoading();
    showAlert('settingsAlert','✅ บันทึกการตั้งค่าทั้งหมดสำเร็จ','success');
    syncSettingsUI();
  }catch(e){hideLoading();showAlert('settingsAlert','บันทึกไม่ได้: '+e.message,'error');}
  setTimeout(()=>showAlert('settingsAlert','',''),4000);
}

// ══ MANUAL REG ══════════════════════════════════════════════
let mregRegisteredToday=new Set();
async function initMRegPage(){
  mregSelEmp=null;mregSelCp=null;mregRegisteredToday=new Set();
  showAlert('mregAlert','','');
  document.querySelectorAll('.mreg-step').forEach(s=>s.classList.remove('active'));
  document.getElementById('mstep1').classList.add('active');
  updateMRegStepBar(1);
  const s=document.getElementById('mregSearch');if(s){s.value='';s.focus();}
  // โหลดรายชื่อที่ลงทะเบียนวันนี้แล้ว เพื่อซ่อนออกจากรายการ
  try{
    const regs=await sbGetTodayRegistrations('all',null);
    regs.forEach(r=>mregRegisteredToday.add(r.emp_id));
  }catch(e){console.warn('โหลดรายการลงทะเบียนไม่ได้:',e);}
  renderMRegEmpList('');
}
function updateMRegStepBar(step){
  for(let i=1;i<=3;i++){
    const d=document.getElementById('msdot'+i);if(!d)continue;
    if(i<step)d.className='mreg-sdot done';
    else if(i===step)d.className='mreg-sdot active';
    else d.className='mreg-sdot';
  }
}
function filterMRegEmployees(){
  const q=(document.getElementById('mregSearch')?.value||'').toLowerCase();
  renderMRegEmpList(q);
}
function renderMRegEmpList(query){
  const list=document.getElementById('mregEmpList');if(!list)return;
  if(adminEmployees===null||adminEmployees===undefined){
    list.innerHTML='<div class="mreg-no-results"><div class="spinner" style="width:18px;height:18px;border-width:2px;margin:0 auto 6px"></div>กำลังโหลด...</div>';
    setBtn('btnMregStep2',true);return;
  }
  const filtered=adminEmployees.filter(e=>
    e.is_active&&
    !mregRegisteredToday.has(e.id)&&
    (!query||
      e.name.toLowerCase().includes(query)||
      e.id.toLowerCase().includes(query)||
      (e.branch||'').toLowerCase().includes(query)||
      (e.position||'').toLowerCase().includes(query)
    )
  );
  if(!filtered.length){
    list.innerHTML=`<div class="mreg-no-results">
      <i class="ti ti-users-off" style="font-size:22px;display:block;margin-bottom:6px;opacity:.4"></i>
      ${!adminEmployees.length?'ยังไม่มีข้อมูลพนักงาน':mregRegisteredToday.size===adminEmployees.filter(e=>e.is_active).length?'พนักงาน Active ทุกคนลงทะเบียนแล้ววันนี้':'ไม่พบพนักงานที่ค้นหา'}
    </div>`;
    setBtn('btnMregStep2',true);return;
  }
  list.innerHTML='';
  filtered.forEach(e=>{
    const item=document.createElement('div');
    item.className='mreg-emp-item'+(mregSelEmp?.id===e.id?' sel':'');
    item.setAttribute('role','button');
    item.setAttribute('tabindex','0');
    item.innerHTML=`<div class="mreg-emp-av"><i class="ti ti-user"></i></div>
      <div style="flex:1;min-width:0">
        <div class="mreg-emp-name">${escHtml(e.name)}</div>
        <div class="mreg-emp-meta">${escHtml(e.id)}${e.branch?' · '+escHtml(e.branch):''}${e.position?' · '+escHtml(e.position):''}</div>
      </div>
      ${mregSelEmp?.id===e.id?'<i class="ti ti-circle-check" style="color:var(--teal);font-size:18px;flex-shrink:0"></i>':''}`;
    item.addEventListener('click',()=>selectMRegEmp(e.id));
    item.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' ')selectMRegEmp(e.id);});
    list.appendChild(item);
  });
  setBtn('btnMregStep2',!mregSelEmp);
}
function selectMRegEmp(empId){
  mregSelEmp=adminEmployees.find(e=>e.id===empId)||null;
  filterMRegEmployees();
  setBtn('btnMregStep2',!mregSelEmp);
}
function mregGoStep1(){
  mregSelCp=null;
  document.querySelectorAll('.mreg-step').forEach(s=>s.classList.remove('active'));
  document.getElementById('mstep1').classList.add('active');
  updateMRegStepBar(1);showAlert('mregAlert','','');
}
function mregGoStep2(){
  if(!mregSelEmp){showAlert('mregAlert','กรุณาเลือกพนักงานก่อน','warn');return;}
  document.querySelectorAll('.mreg-step').forEach(s=>s.classList.remove('active'));
  document.getElementById('mstep2').classList.add('active');
  updateMRegStepBar(2);
  document.getElementById('mregSelEmpName').textContent=mregSelEmp.name;
  document.getElementById('mregSelEmpId').textContent=mregSelEmp.id;
  document.getElementById('mregSelEmpBranch').textContent=[mregSelEmp.branch,mregSelEmp.position].filter(Boolean).join(' · ')||'—';
  renderMRegCpList();
  setBtn('btnMregConfirm',true);
  const n=document.getElementById('mregNote');if(n)n.value='';
  const nc=document.getElementById('mregNoteCount');if(nc)nc.textContent='0';
  showAlert('mregAlert','','');
}
function renderMRegCpList(){
  const list=document.getElementById('mregCpList');if(!list)return;
  const cps=adminCheckpoints.filter(c=>c.is_active!==false);
  if(!cps.length){
    list.innerHTML='<div class="mreg-no-results">ไม่มี Checkpoint ที่เปิดใช้งาน</div>';return;
  }
  list.innerHTML='';
  cps.forEach(cp=>{
    const item=document.createElement('div');
    item.className='mreg-cp-item'+(mregSelCp?.id===cp.id?' sel':'');
    item.setAttribute('role','button');item.setAttribute('tabindex','0');
    item.innerHTML=`<div class="mreg-cp-ico"><i class="ti ti-map-pin"></i></div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:600;margin-bottom:2px">${escHtml(cp.name)}</div>
        <div style="font-size:11px;color:var(--text3);font-family:var(--mono)">${escHtml(cp.id)} · รัศมี ${escHtml(String(cp.max_radius||300))} ม.</div>
      </div>
      ${mregSelCp?.id===cp.id?'<i class="ti ti-circle-check" style="color:var(--purple);font-size:18px;flex-shrink:0"></i>':''}`;
    item.addEventListener('click',()=>selectMRegCp(cp.id));
    item.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')selectMRegCp(cp.id);});
    list.appendChild(item);
  });
}
function selectMRegCp(cpId){
  mregSelCp=adminCheckpoints.find(c=>c.id===cpId)||null;
  renderMRegCpList();
  setBtn('btnMregConfirm',!mregSelCp);
}
async function mregDoRegister(){
  if(!mregSelEmp){showAlert('mregAlert','กรุณาเลือกพนักงาน','warn');return;}
  if(!mregSelCp){showAlert('mregAlert','กรุณาเลือก Checkpoint','warn');return;}
  const note=(document.getElementById('mregNote')?.value||'').trim().slice(0,500);
  setBtn('btnMregConfirm',true);
  showLoading('กำลังลงทะเบียนแทน...');
  try{
    const res=await sbRegister({
      empId:mregSelEmp.id,empName:mregSelEmp.name,
      branch:mregSelEmp.branch||'',position:mregSelEmp.position||'',
      cpId:mregSelCp.id,cpName:mregSelCp.name,
      userLat:null,userLng:null,accuracy:null,distanceM:0,
      qrToken:null,isManual:true,adminId:currentUser.id,note,
      // G-3 FIX: pass featureFlags as cachedSettings to skip redundant sbGetSettings() call
      // isManual=true skips QR/GPS checks anyway, but settings are still read in sbRegister
      cachedSettings:{
        QREnabled:featureFlags.qrEnabled,
        LocationEnabled:featureFlags.locationEnabled,
        RadiusLockEnabled:featureFlags.radiusEnabled
      }
    });
    if(!res.ok){showAlert('mregAlert',res.msg,'error');return;}
    const ts=new Date(res.ts);
    document.getElementById('mregSuccessSub').textContent=`${mregSelEmp.name} → ${mregSelCp.name}`;
    const noteHtml=note?`<div class="info-cell ic-span"><div class="ic-lbl">หมายเหตุ</div><div class="ic-val" style="font-size:12px;font-weight:400;color:var(--text2)">${escHtml(note)}</div></div>`:'';
    document.getElementById('mregSuccessGrid').innerHTML=`
      <div class="info-cell"><div class="ic-lbl">พนักงาน</div><div class="ic-val">${escHtml(mregSelEmp.name)}</div></div>
      <div class="info-cell"><div class="ic-lbl">รหัส</div><div class="ic-val" style="font-family:var(--mono)">${escHtml(mregSelEmp.id)}</div></div>
      <div class="info-cell"><div class="ic-lbl">Checkpoint</div><div class="ic-val">${escHtml(mregSelCp.name)}</div></div>
      <div class="info-cell"><div class="ic-lbl">เวลา</div><div class="ic-val teal">${ts.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Bangkok'})}</div></div>
      <div class="info-cell"><div class="ic-lbl">Admin</div><div class="ic-val" style="font-family:var(--mono);font-size:12px">${escHtml(currentUser.id)}</div></div>
      <div class="info-cell"><div class="ic-lbl">Reg ID</div><div class="ic-val" style="font-family:var(--mono);font-size:11px">${escHtml(res.regId)}</div></div>
      ${noteHtml}`;
    mregRegisteredToday.add(mregSelEmp.id);
    // L-1 FIX: refresh mregRegisteredToday จาก DB เพื่อ sync กรณีคนอื่น register ในระหว่างที่หน้าค้างอยู่
    try{
      const freshRegs=await sbGetTodayRegistrations('all',null);
      mregRegisteredToday=new Set(freshRegs.map(r=>r.emp_id));
    }catch(_){}
    document.querySelectorAll('.mreg-step').forEach(s=>s.classList.remove('active'));
    document.getElementById('mstep3').classList.add('active');
    updateMRegStepBar(3);
  }catch(err){showAlert('mregAlert','เกิดข้อผิดพลาด: '+err.message,'error');}
  finally{hideLoading();setBtn('btnMregConfirm',!mregSelCp);}
}
function mregReset(){
  mregSelEmp=null;mregSelCp=null;
  document.querySelectorAll('.mreg-step').forEach(s=>s.classList.remove('active'));
  document.getElementById('mstep1').classList.add('active');
  updateMRegStepBar(1);
  const s=document.getElementById('mregSearch');if(s){s.value='';s.focus();}
  renderMRegEmpList('');showAlert('mregAlert','','');
}

// ══ LUCKY WHEEL ══════════════════════════════════════════════
async function initWheelPage(){
  showAlert('wheelAlert','','');excludeWinners=false;
  const btn=document.getElementById('btnExcludeWinners');
  if(btn)btn.classList.remove('active');
  // reset mode to 'all' every time page is opened
  wheelMode='all';wheelFilterCp='all';
  document.querySelectorAll('.wheel-filter-btn').forEach(b=>b.classList.remove('wf-active'));
  const wfAll=document.getElementById('wfAll');
  if(wfAll)wfAll.classList.add('wf-active');
  const cpBtns=document.getElementById('wfCpBtns');
  if(cpBtns){
    cpBtns.innerHTML='';
    adminCheckpoints.filter(c=>c.is_active!==false).forEach(cp=>{
      const b=document.createElement('button');
      b.className='wheel-filter-btn';
      b.id='wf-'+cp.id;
      b.dataset.cpFilter=cp.id;
      b.textContent=cp.name;
      b.addEventListener('click',()=>setWheelFilter('cp',cp.id,b));
      cpBtns.appendChild(b);
    });
  }
  // โหลดผู้โชคดีวันนี้จาก Supabase
  try{
    const saved=await sbGetTodayWinners();
    wheelWinners=saved.map(w=>({
      ...w,
      _wonAt:new Date(w.won_at).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Bangkok'})
    }));
    renderWinnerList();
  }catch(e){console.warn('โหลดผู้โชคดีไม่สำเร็จ:',e);}
  await loadWheelData();
}
async function loadWheelData(){
  try{
    let all=[];
    let modeLabel='';
    if(wheelMode==='all'){
      // ทั้งหมด: ทุกคนที่ลงทะเบียนวันนี้ dedup by emp_id
      all=await sbGetTodayRegistrations('all',null);
      modeLabel='';
    }else if(wheelMode==='cp'){
      // CP เฉพาะ: ทุกคนที่ลงทะเบียน CP นั้นวันนี้ (ไม่กรองเวลา)
      all=await sbGetTodayRegistrations(wheelFilterCp,null);
      modeLabel='';
    }else if(wheelMode==='ontime'){
      // ตรงเวลา: ทุกคนที่ลงทะเบียนก่อนเวลาที่กำหนด (ทุก CP, dedup)
      all=await sbGetTodayRegistrations('all',featureFlags.wheelOnTime);
      modeLabel=` ⏰ ก่อน ${featureFlags.wheelOnTime} น.`;
    }
    wheelParticipants=excludeWinners?all.filter(p=>!wheelWinners.find(w=>w.emp_id===p.emp_id)):all;
    const total=all.length;
    const excluded=total-wheelParticipants.length;
    document.getElementById('wheelCount').textContent=
      `ผู้เข้าร่วม ${wheelParticipants.length} คน${modeLabel}${excluded?' (ตัดออก '+excluded+' คน)':''}`;
    drawWheel();
    setBtn('btnSpin',wheelParticipants.length<1);
    if(wheelParticipants.length===0&&total>0){
      showAlert('wheelAlert','ผู้เข้าร่วมทั้งหมดได้รับรางวัลแล้ว! กด "ล้างรายการ" เพื่อเริ่มใหม่','info');
    }else{
      showAlert('wheelAlert','','');
    }
  }catch(e){showAlert('wheelAlert','โหลดข้อมูลไม่ได้: '+e.message,'error');}
}
function setWheelFilter(mode,cpId,el){
  wheelMode=mode;
  wheelFilterCp=cpId||'all';
  document.querySelectorAll('.wheel-filter-btn').forEach(b=>b.classList.remove('wf-active'));
  if(el)el.classList.add('wf-active');
  wheelAngle=0;
  loadWheelData();
}
function getWheelSize(){
  const container=document.getElementById('wheelCanvas')?.parentElement;
  if(!container)return 320;
  return Math.min(container.clientWidth||320,340);
}
function drawWheel(){
  const canvas=document.getElementById('wheelCanvas');if(!canvas)return;
  const size=getWheelSize();
  canvas.width=size;canvas.height=size;
  const ctx=canvas.getContext('2d');
  const cx=size/2,cy=size/2,r=size/2-4;
  const n=wheelParticipants.length;
  ctx.clearRect(0,0,size,size);
  if(n===0){
    ctx.save();
    ctx.fillStyle='#1c2335';ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.06)';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='#4e576e';ctx.font=`${Math.max(12,size*0.042)}px 'Noto Sans Thai',sans-serif`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('ยังไม่มีผู้เข้าร่วม',cx,cy);
    ctx.restore();return;
  }
  const arc=Math.PI*2/n;
  for(let i=0;i<n;i++){
    const startAngle=wheelAngle+arc*i-Math.PI/2;
    const endAngle=startAngle+arc;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,startAngle,endAngle);ctx.closePath();
    ctx.fillStyle=WHEEL_COLORS[i%WHEEL_COLORS.length];ctx.fill();
    ctx.strokeStyle='rgba(10,13,20,0.55)';ctx.lineWidth=1.5;ctx.stroke();
    ctx.save();
    const midAngle=startAngle+arc/2;
    const labelR=r*(n>6?0.70:0.65);
    const lx=cx+Math.cos(midAngle)*labelR;
    const ly=cy+Math.sin(midAngle)*labelR;
    ctx.translate(lx,ly);ctx.rotate(midAngle+Math.PI/2);
    const name=wheelParticipants[i].emp_name||'';
    const maxLen=n>8?5:n>4?7:9;
    const shortName=name.length>maxLen?name.slice(0,maxLen-1)+'…':name;
    const fs=Math.max(10,Math.min(15,r*0.085,r*1.8/n));
    ctx.font=`700 ${fs}px 'Noto Sans Thai',sans-serif`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillText(shortName,1,1);
    ctx.fillStyle='#fff';ctx.fillText(shortName,0,0);
    ctx.restore();
  }
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);
  ctx.strokeStyle='rgba(255,255,255,.08)';ctx.lineWidth=3;ctx.stroke();
  ctx.beginPath();ctx.arc(cx,cy,r*0.20,0,Math.PI*2);
  ctx.fillStyle='#0a0d14';ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.1)';ctx.lineWidth=2;ctx.stroke();
}
function spinWheel(){
  if(wheelSpinning||wheelParticipants.length<1)return;
  wheelSpinning=true;setBtn('btnSpin',true);
  showAlert('wheelAlert','','');
  const n=wheelParticipants.length;
  const winnerIdx=Math.floor(Math.random()*n);
  const arcPerSlice=Math.PI*2/n;
  const extraSpins=6+Math.floor(Math.random()*6);
  const sliceCenter=winnerIdx*arcPerSlice+arcPerSlice/2;
  const currentNorm=((wheelAngle%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
  const targetNorm=((Math.PI*2)-sliceCenter+Math.PI*2)%(Math.PI*2);
  let delta=(targetNorm-currentNorm+Math.PI*4)%(Math.PI*2);
  if(delta<0.1)delta+=Math.PI*2;
  const totalRotation=Math.PI*2*extraSpins+delta;
  const duration=5000+Math.random()*1500;
  const startAngle=wheelAngle,startTime=performance.now();
  function easeOut(t){return 1-Math.pow(1-t,4);}
  function animate(now){
    const t=Math.min((now-startTime)/duration,1);
    wheelAngle=startAngle+totalRotation*easeOut(t);
    drawWheel();
    if(t<1){wheelAnimFrame=requestAnimationFrame(animate);}
    else{
      wheelAnimFrame=null;
      wheelSpinning=false;
      setBtn('btnSpin',false);
      setTimeout(()=>showWheelResult(wheelParticipants[winnerIdx]),250);
    }
  }
  wheelAnimFrame=requestAnimationFrame(animate);
}
// ── WHEEL TTS ANNOUNCEMENT ────────────────────────────────────────────
// Priority: ElevenLabs TTS (AI voice) → Web Speech API (OS fallback)

// ── ElevenLabs TTS ─────────────────────────────────────────────
// SEC-03 FIX: API key is XOR-scrambled before storage so it is not stored
// as plain text. Full server-side storage is the proper solution, but this
// prevents trivial clipboard-copy or extension reads of the raw key.
function _elScramble(str) {
  const seed = '_el_sec_v1';
  return Array.from(str).map((c, i) =>
    String.fromCharCode(c.charCodeAt(0) ^ seed.charCodeAt(i % seed.length))
  ).join('');
}
function _elEncode(key) { return btoa(_elScramble(key)); }
function _elDecode(stored) { try { return _elScramble(atob(stored)); } catch(_) { return ''; } }

function saveElevenLabsKey(){
  const inp = document.getElementById('elevenlabsKeyInput');
  const key = (inp?.value||'').trim();
  const statusEl = document.getElementById('elevenlabsKeyStatus');
  if(!key){ if(statusEl) statusEl.innerHTML='<span style="color:var(--red)">⚠️ กรุณากรอก API Key</span>'; return; }
  // SEC-03: store scrambled, not plaintext
  localStorage.setItem('_el_key', _elEncode(key));
  const voiceSel = document.getElementById('elevenlabsVoiceSelect');
  const voice = voiceSel?.value || 'JBFqnCBsd6RMkjVDRZzb';
  localStorage.setItem('_el_voice', voice);
  if(inp) inp.value='';
  if(statusEl) statusEl.innerHTML='<span style="color:var(--teal)">✅ บันทึก Key แล้ว — พร้อมใช้งาน</span>';
}

function _loadElevenLabsSettings(){
  const rawStored = localStorage.getItem('_el_key')||'';
  // BUG-E FIX: ElevenLabs keys start with "sk_". If rawStored starts with "sk_" it's
  // an old unscrambled key — re-save it scrambled then use it. Otherwise decode normally.
  let key = '';
  if(rawStored === ''){
    key = '';
  } else if(rawStored.startsWith('sk_')){
    // Migrate plaintext key → scrambled
    localStorage.setItem('_el_key', _elEncode(rawStored));
    key = rawStored;
  } else {
    key = _elDecode(rawStored);
  }
  const voice = localStorage.getItem('_el_voice')||'JBFqnCBsd6RMkjVDRZzb';
  const customVoice = localStorage.getItem('_el_custom_voice')||'';
  const statusEl = document.getElementById('elevenlabsKeyStatus');
  const voiceSel = document.getElementById('elevenlabsVoiceSelect');
  const customWrap = document.getElementById('elevenlabsCustomVoiceWrap');
  const customInp = document.getElementById('elevenlabsCustomVoiceInput');
  if(voiceSel){
    voiceSel.value = voice;
    if(voiceSel.value !== voice) voiceSel.value = 'custom';
    voiceSel.onchange = function(){
      if(customWrap) customWrap.style.display = this.value === 'custom' ? 'block' : 'none';
      localStorage.setItem('_el_voice', this.value);
    };
    if(customWrap) customWrap.style.display = voice === 'custom' ? 'block' : 'none';
  }
  if(customInp && customVoice) customInp.value = customVoice;
  if(statusEl){
    statusEl.innerHTML = key
      ? '<span style="color:var(--teal)">✅ มี API Key บันทึกไว้แล้ว</span>'
      : '<span style="color:var(--text3)">ยังไม่มี API Key — จะใช้เสียงระบบแทน</span>';
  }
}

async function _speakElevenLabs(text){
  const rawStored = localStorage.getItem('_el_key')||'';
  const key = rawStored ? _elDecode(rawStored) : '';
  if(!key) return false;
  let voiceId = localStorage.getItem('_el_voice')||'JBFqnCBsd6RMkjVDRZzb';
  if(voiceId === 'custom') voiceId = localStorage.getItem('_el_custom_voice')||'JBFqnCBsd6RMkjVDRZzb';
  try{
    const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,{
      method:'POST',
      headers:{'xi-api-key': key, 'Content-Type':'application/json'},
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: 0.88 }
      })
    });
    if(!resp.ok){ console.warn('ElevenLabs TTS error:', resp.status); return false; }
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = ()=>URL.revokeObjectURL(url);
    await audio.play();
    return true;
  }catch(e){ console.warn('ElevenLabs TTS failed:', e); return false; }
}

// ── Web Speech fallback ─────────────────────────────────────
let _ttsVoices = [];
let _selectedVoiceURI = ''; // '' = auto

function _loadVoices(){
  const voices = window.speechSynthesis?.getVoices() || [];
  if(voices.length) _ttsVoices = voices;
  _renderVoiceSelect();
}
if(window.speechSynthesis){
  _loadVoices();
  window.speechSynthesis.onvoiceschanged = _loadVoices;
  setTimeout(_loadVoices, 500);
  setTimeout(_loadVoices, 1500);
}

function _renderVoiceSelect(){
  const sel = document.getElementById('wheelVoiceSelect');
  if(!sel) return;
  const prev = sel.value;
  sel.innerHTML = '<option value="">🔊 อัตโนมัติ</option>';
  const th = _ttsVoices.filter(v => v.lang.startsWith('th'));
  const others = _ttsVoices.filter(v => !v.lang.startsWith('th'));
  if(th.length){
    const g = document.createElement('optgroup'); g.label = '🇹🇭 ภาษาไทย';
    th.forEach(v => { const o=document.createElement('option'); o.value=v.voiceURI; o.textContent=`${v.name} (${v.lang})`; g.appendChild(o); });
    sel.appendChild(g);
  }
  if(others.length){
    const g = document.createElement('optgroup'); g.label = '🌐 ภาษาอื่น';
    others.forEach(v => { const o=document.createElement('option'); o.value=v.voiceURI; o.textContent=`${v.name} (${v.lang})`; g.appendChild(o); });
    sel.appendChild(g);
  }
  const restoreVal = _selectedVoiceURI || prev;
  if(restoreVal && [...sel.options].some(o=>o.value===restoreVal)) sel.value = restoreVal;
  else sel.value = '';
  // โหลด ElevenLabs settings เมื่อ settings page เปิด
  _loadElevenLabsSettings();
}

function _pickWebVoice(){
  if(_selectedVoiceURI){
    const found = _ttsVoices.find(v => v.voiceURI === _selectedVoiceURI);
    if(found) return found;
  }
  return _ttsVoices.find(v => v.lang.startsWith('th')) || _ttsVoices[0] || null;
}

function _speakWeb(text){
  if(!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const voice = _pickWebVoice();
  const u = new SpeechSynthesisUtterance(text);
  if(voice) u.voice = voice;
  u.lang = 'th-TH';
  u.rate = 0.88; u.pitch = 1.05; u.volume = 1.0;
  window.speechSynthesis.speak(u);
}

let _wheelMuted = false;

async function announceWinner(winner, round){
  if(_wheelMuted) return;
  const text = `ขอแสดงความยินดี... ผู้โชคดี รอบที่ ${round}... คือ... ${winner.emp_name}`
    + (winner.branch ? `... จาก ${winner.branch}` : '')
    + `... ยินดีด้วยครับ`;
  // ลอง ElevenLabs TTS ก่อน — ถ้าไม่มี key หรือ error ค่อย fallback Web Speech
  const ok = await _speakElevenLabs(text);
  if(!ok) _speakWeb(text);
}

// ทดสอบเสียง
async function previewWheelVoice(){
  // บันทึก voice ที่เลือกก่อน
  const webSel = document.getElementById('wheelVoiceSelect');
  if(webSel) _selectedVoiceURI = webSel.value;
  const elVoiceSel = document.getElementById('elevenlabsVoiceSelect');
  if(elVoiceSel) localStorage.setItem('_el_voice', elVoiceSel.value);

  const text = 'ขอแสดงความยินดี... ผู้โชคดีคือ... คุณสมชาย ใจดี... ยินดีด้วยครับ';
  const ok = await _speakElevenLabs(text);
  if(!ok){
    if(!window.speechSynthesis){ alert('เบราว์เซอร์ไม่รองรับ Text-to-Speech'); return; }
    _speakWeb(text);
  }
}

function showWheelResult(winner){
  document.getElementById('wrEmoji').textContent=WINNER_EMOJIS[wheelWinners.length%WINNER_EMOJIS.length];
  document.getElementById('wrRound').textContent=wheelWinners.length+1;
  document.getElementById('wrName').textContent=winner.emp_name||'—';
  document.getElementById('wrMeta').textContent=winner.emp_id||'—';
  document.getElementById('wrCp').textContent='📍 '+(winner.cp_name||'—');
  document.getElementById('wheelResultModal').classList.add('show');
  const wonAt=new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Bangkok'});
  const round = wheelWinners.length + 1;
  wheelWinners.unshift({...winner,_wonAt:wonAt});
  renderWinnerList();startConfetti();
  announceWinner(winner, round); // 🔊 ประกาศผลด้วยเสียง AI
  sbSaveWinner(winner).catch(e=>console.warn('บันทึกผู้โชคดีไม่สำเร็จ:',e));
  if(excludeWinners)setTimeout(loadWheelData,500);
}
function closeWheelResult(){document.getElementById('wheelResultModal').classList.remove('show');stopConfetti();if(window.speechSynthesis)window.speechSynthesis.cancel();}
async function spinAgain(){
  closeWheelResult();
  if(excludeWinners){
    await loadWheelData();
    if(wheelParticipants.length===0){
      showAlert('wheelAlert','ผู้เข้าร่วมทั้งหมดได้รับรางวัลแล้ว! กด "ล้างรายการ" เพื่อเริ่มใหม่','info');
      return;
    }
  }
  setTimeout(spinWheel,350);
}
function renderWinnerList(){
  const list=document.getElementById('winnerList');if(!list)return;
  const badge=document.getElementById('winnerCountBadge');
  if(badge)badge.textContent=wheelWinners.length;
  if(!wheelWinners.length){
    list.innerHTML=`<div style="color:var(--text3);font-size:13px;text-align:center;padding:20px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--r)">
      <i class="ti ti-trophy" style="font-size:24px;display:block;margin-bottom:6px;opacity:.3"></i>
      ยังไม่มีผู้โชคดี — กดปุ่ม <strong>หมุน!</strong> เพื่อสุ่ม
    </div>`;return;
  }
  list.innerHTML='';
  const wl=document.createElement('div');wl.className='wheel-winner-list';
  wheelWinners.slice(0,10).forEach((w,i)=>{
    const item=document.createElement('div');item.className='wheel-winner-item';
    const rankClass=i===0?'rank-1':i===1?'rank-2':i===2?'rank-3':'rank-n';
    item.innerHTML=`<div class="wheel-winner-rank ${rankClass}">${i+1}</div>
      <div>
        <div class="wheel-winner-name">${escHtml(w.emp_name||'—')}</div>
        <div class="wheel-winner-cp">${escHtml(w.emp_id||'')} · ${escHtml(w.cp_name||'—')}</div>
      </div>
      <div class="wheel-winner-time">${escHtml(w._wonAt||'')}</div>`;
    wl.appendChild(item);
  });
  list.appendChild(wl);
}
function clearWinners(){
  if(!wheelWinners.length)return;
  if(!confirm(`ล้างรายชื่อผู้โชคดี ${wheelWinners.length} คน?`))return;
  sbClearTodayWinners().catch(e=>console.warn('ล้างผู้โชคดีไม่สำเร็จ:',e));
  wheelWinners=[];renderWinnerList();
  if(excludeWinners)loadWheelData();
}
function startConfetti(){
  const canvas=document.getElementById('confettiCanvas');if(!canvas)return;
  // G-8 FIX: size canvas to full window before drawing — was relying only on resize event
  // which meant first confetti burst rendered in a tiny 300×150 default canvas
  canvas.width=window.innerWidth;
  canvas.height=window.innerHeight;
  canvas.style.display='block';
  const ctx=canvas.getContext('2d');
  const pieces=Array.from({length:140},()=>({
    x:Math.random()*canvas.width,y:Math.random()*-canvas.height*0.6,
    vx:(Math.random()-0.5)*5,vy:Math.random()*5+2,
    color:WHEEL_COLORS[Math.floor(Math.random()*WHEEL_COLORS.length)],
    size:Math.random()*10+4,rot:Math.random()*360,spin:Math.random()*8-4,
    shape:Math.random()<0.5?'rect':'circle'
  }));
  let frame=0;
  function drawC(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    pieces.forEach(p=>{
      p.x+=p.vx;p.y+=p.vy;p.rot+=p.spin;p.vy+=0.06;
      if(p.y>canvas.height+30){p.y=-20;p.x=Math.random()*canvas.width;p.vy=Math.random()*4+2;}
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);
      ctx.fillStyle=p.color+'bb';
      if(p.shape==='circle'){ctx.beginPath();ctx.arc(0,0,p.size/2,0,Math.PI*2);ctx.fill();}
      else{ctx.fillRect(-p.size/2,-p.size/4,p.size,p.size/2);}
      ctx.restore();
    });
    frame++;
    if(frame<480)confettiAnimId=requestAnimationFrame(drawC);
    else stopConfetti();
  }
  if(confettiAnimId)cancelAnimationFrame(confettiAnimId);
  confettiAnimId=requestAnimationFrame(drawC);
}
function stopConfetti(){
  if(confettiAnimId){cancelAnimationFrame(confettiAnimId);confettiAnimId=null;}
  const c=document.getElementById('confettiCanvas');if(c)c.style.display='none';
}

// ══ DASHBOARD ═══════════════════════════════════════════════
async function loadDashboard(){
  showAlert('dashAlert','','');
  try{
    const d=await sbGetDashboard();
    document.getElementById('statTotal').textContent=d.total??'—';
    document.getElementById('statToday').textContent=d.today??'—';
    document.getElementById('statTodayDate').textContent=new Date().toLocaleDateString('th-TH',{weekday:'long',day:'numeric',month:'long'});
    document.getElementById('statCp').textContent=d.activeCp??'—';
    document.getElementById('statEmp').textContent=d.activeEmp??'—';
    // populate search CP dropdown
    const cpSel=document.getElementById('dashSearchCp');
    if(cpSel&&adminCheckpoints.length){
      const prev=cpSel.value;
      cpSel.innerHTML='<option value="">— ทุก Checkpoint —</option>';
      adminCheckpoints.forEach(cp=>{
        const opt=document.createElement('option');opt.value=cp.id;opt.textContent=cp.name;
        if(cp.id===prev)opt.selected=true;
        cpSel.appendChild(opt);
      });
    }
    renderRecentTable(d.recent);
    syncSettingsUI();
  }catch(e){showAlert('dashAlert','โหลดข้อมูลไม่ได้: '+e.message,'error');}
}
function renderRecentTable(rows){
  const tbody=document.getElementById('recentTable');if(!tbody)return;
  const locOn=featureFlags.locationEnabled;
  if(!rows.length){
    tbody.innerHTML=`<tr><td colspan="${locOn?6:5}" style="text-align:center;color:var(--text3);padding:24px">ยังไม่มีรายการลงทะเบียนวันนี้</td></tr>`;return;
  }
  tbody.innerHTML='';
  rows.forEach(r=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td class="name">${escHtml(r.empName||'—')}</td>
      <td>${escHtml(r.cpName||'—')}</td>
      <td style="font-family:var(--mono)">${escHtml(r.ts||'—')}</td>
      <td>${r.isManual
        ?'<span class="badge b-purple"><i class="ti ti-clipboard-check" style="font-size:10px"></i> Admin</span>'
        :'<span class="badge b-teal"><i class="ti ti-user" style="font-size:10px"></i> ปกติ</span>'}</td>
      ${locOn?`<td><span style="color:var(--teal);font-family:var(--mono)">${r.distanceM!=null?escHtml(String(r.distanceM))+'m':'—'}</span></td>`:''}
      <td>${r.regId?`<button data-del-reg="${escHtml(r.regId)}" class="btn btn-outline btn-xs" style="color:var(--red,#f87171);border-color:var(--red,#f87171);padding:3px 7px" title="ลบรายการนี้"><i class="ti ti-trash" style="font-size:12px"></i></button>`:'—'}</td>`;
    if(r.regId){
      tr.querySelector(`[data-del-reg]`).addEventListener('click',ev=>confirmDeleteOneReg(ev.currentTarget.dataset.delReg,r.empName,r.registeredAt||r.ts));
    }
    tbody.appendChild(tr);
  });
}
// ── Search registrations ─────────────────────────────────────
let dashSearchResults=[];
async function dashSearchRegs(){
  const name=(document.getElementById('dashSearchName')?.value||'').trim();
  const cpId=document.getElementById('dashSearchCp')?.value||'';
  if(!name&&!cpId){
    document.getElementById('dashSearchTableWrap').style.display='none';
    document.getElementById('dashSearchCount').textContent='';
    return;
  }
  try{
    dashSearchResults=await sbSearchRegistrations({name,cpId});
    renderSearchTable();
  }catch(e){showAlert('dashSearchAlert','ค้นหาไม่ได้: '+e.message,'error');}
}
function renderSearchTable(){
  const wrap=document.getElementById('dashSearchTableWrap');
  const tbody=document.getElementById('dashSearchTable');
  const countEl=document.getElementById('dashSearchCount');
  const locOn=featureFlags.locationEnabled;
  if(!dashSearchResults.length){
    wrap.style.display='block';
    tbody.innerHTML=`<tr><td colspan="${locOn?6:5}" style="text-align:center;color:var(--text3);padding:20px">ไม่พบรายการที่ค้นหา</td></tr>`;
    countEl.textContent='ไม่พบรายการ';return;
  }
  wrap.style.display='block';
  countEl.textContent=`พบ ${dashSearchResults.length} รายการ`;
  tbody.innerHTML='';
  dashSearchResults.forEach(r=>{
    const ts=r.registered_at?new Date(r.registered_at).toLocaleString('th-TH',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Bangkok'}):'—';
    const tr=document.createElement('tr');
    tr.innerHTML=`<td class="name">${escHtml(r.emp_name||'—')}<div style="font-size:10px;color:var(--text3);font-family:var(--mono)">${escHtml(r.emp_id||'')}</div></td>
      <td>${escHtml(r.cp_name||'—')}</td>
      <td style="font-family:var(--mono);font-size:12px">${escHtml(ts)}</td>
      <td>${r.is_manual
        ?'<span class="badge b-purple"><i class="ti ti-clipboard-check" style="font-size:10px"></i> Admin</span>'
        :'<span class="badge b-teal"><i class="ti ti-user" style="font-size:10px"></i> ปกติ</span>'}</td>
      ${locOn?`<td><span style="color:var(--teal);font-family:var(--mono)">${r.distance_m!=null?r.distance_m+'m':'—'}</span></td>`:''}
      <td><button data-del-reg="${escHtml(r.id)}" class="btn btn-outline btn-xs" style="color:var(--red,#f87171);border-color:var(--red,#f87171);padding:3px 7px" title="ลบรายการนี้"><i class="ti ti-trash" style="font-size:12px"></i></button></td>`;
    tr.querySelector('[data-del-reg]').addEventListener('click',ev=>confirmDeleteOneReg(ev.currentTarget.dataset.delReg,r.emp_name,ts));
    tbody.appendChild(tr);
  });
}
function dashClearSearch(){
  const n=document.getElementById('dashSearchName');if(n)n.value='';
  const c=document.getElementById('dashSearchCp');if(c)c.value='';
  document.getElementById('dashSearchTableWrap').style.display='none';
  document.getElementById('dashSearchCount').textContent='';
  dashSearchResults=[];
}
async function confirmDeleteOneReg(regId,empName,ts){
  if(!confirm(`ลบรายการลงทะเบียนของ "${empName||regId}" เวลา ${ts||''}?\nไม่สามารถกู้คืนได้`))return;
  showLoading('กำลังลบ...');
  try{
    const r=await sbDeleteOneRegistration(regId);
    hideLoading();
    if(!r.ok)throw new Error(r.msg);
    showAlert('dashAlert',`✅ ลบรายการลงทะเบียนสำเร็จ`,'success');
    setTimeout(()=>showAlert('dashAlert','',''),3000);
    await loadDashboard();
    if(dashSearchResults.length){
      dashSearchResults=dashSearchResults.filter(x=>x.id!==regId);
      renderSearchTable();
    }
  }catch(e){hideLoading();showAlert('dashAlert','ลบไม่ได้: '+e.message,'error');}
}
async function exportCSV(){
  showLoading('กำลัง Export...');
  try{
    const rows=await sbGetTodayRegsForExport();
    if(!rows.length){hideLoading();showAlert('dashAlert','ไม่มีข้อมูลวันนี้','warn');return;}
    const headers=['reg_id','emp_id','emp_name','branch','position','cp_id','cp_name','registered_at','lat','lng','distance_m','accuracy','is_manual','admin_id','note'];
    const csv=[headers.join(','),...rows.map(r=>headers.map(h=>{const v=r[h]??'';return`"${String(v).replace(/"/g,'""')}"`;}).join(','))].join('\n');
    const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;
    a.download=`registrations-${bkkDate()}.csv`;
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url),5000);
  }catch(e){showAlert('dashAlert','Export ไม่ได้: '+e.message,'error');}
  finally{hideLoading();}
}

// ══ EMPLOYEES ═══════════════════════════════════════════════
function renderEmployeeTable(){
  const tbody=document.getElementById('empTableBody');if(!tbody)return;
  if(!adminEmployees.length){
    tbody.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:24px">ยังไม่มีข้อมูลพนักงาน</td></tr>';return;
  }
  tbody.innerHTML='';
  adminEmployees.forEach(e=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td style="font-family:var(--mono)">${escHtml(e.id)}</td>
      <td class="name">${escHtml(e.name)}</td>
      <td>${escHtml(e.branch||'—')}</td>
      <td><span class="badge ${e.role==='admin'?'b-amber':'b-blue'}">${escHtml(e.role||'user')}</span></td>
      <td><span class="badge ${e.is_active?'b-teal':'b-gray'}">${e.is_active?'Active':'Inactive'}</span></td>
      <td style="display:flex;gap:6px;flex-wrap:wrap">
        <button data-toggle-emp="${escHtml(e.id)}" data-emp-active="${!e.is_active}" class="btn btn-outline btn-xs">
          ${e.is_active?'<i class="ti ti-user-off"></i> ปิด':'<i class="ti ti-user-check"></i> เปิด'}
        </button>
        <button data-edit-emp="${escHtml(e.id)}" class="btn btn-outline btn-xs" style="color:var(--amber);border-color:var(--amber)">
          <i class="ti ti-pencil"></i> แก้ไข
        </button>
        <button data-delete-emp="${escHtml(e.id)}" data-delete-name="${escHtml(e.name)}" class="btn btn-outline btn-xs" style="color:var(--red,#f87171);border-color:var(--red,#f87171)">
          <i class="ti ti-trash"></i> ลบ
        </button>
      </td>`;
    tr.querySelector('[data-toggle-emp]').addEventListener('click',ev=>{
      const btn=ev.currentTarget;toggleEmpActive(btn.dataset.toggleEmp,btn.dataset.empActive==='true');
    });
    tr.querySelector('[data-edit-emp]').addEventListener('click',ev=>{
      openEditEmpModal(ev.currentTarget.dataset.editEmp);
    });
    tr.querySelector('[data-delete-emp]').addEventListener('click',ev=>{
      openDeleteEmpModal(ev.currentTarget.dataset.deleteEmp,ev.currentTarget.dataset.deleteName);
    });
    tbody.appendChild(tr);
  });
}
async function toggleEmpActive(empId,active){
  showLoading('กำลังอัพเดต...');
  try{
    await sbToggleEmployee(empId,active);hideLoading();
    await loadEmployees();renderEmployeeTable();
  }catch(e){hideLoading();showAlert('empAlert','อัพเดตไม่ได้: '+e.message,'error');}
}

// ── Edit Employee Modal ───────────────────────────────────────
function openEditEmpModal(empId){
  const emp=adminEmployees.find(e=>e.id===empId);if(!emp)return;
  // สร้าง modal ถ้ายังไม่มี
  let modal=document.getElementById('editEmpModal');
  if(!modal){
    modal=document.createElement('div');
    modal.id='editEmpModal';
    modal.style.cssText='position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6);padding:16px';
    modal.innerHTML=`<div style="background:var(--surface,#1e2330);border-radius:16px;padding:24px;width:100%;max-width:480px;box-shadow:0 8px 32px rgba(0,0,0,.4)">
      <div style="font-size:16px;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px">
        <i class="ti ti-pencil" style="color:var(--amber)"></i> แก้ไขพนักงาน
        <span id="editEmpIdLabel" style="font-family:var(--mono);font-size:12px;color:var(--text3);margin-left:4px"></span>
      </div>
      <div id="editEmpAlert"></div>
      <div class="grid2" style="gap:12px">
        <div class="field">
          <label>รหัสพนักงาน</label>
          <input type="text" id="editEmpIdDisplay" disabled
            style="opacity:.5;cursor:not-allowed;background:var(--bg2)">
        </div>
        <div class="field"><label>ชื่อ-นามสกุล *</label>
          <input type="text" id="editEmpName" maxlength="100" placeholder="ชื่อเต็ม">
        </div>
        <div class="field"><label>แผนก</label>
          <input type="text" id="editEmpBranch" maxlength="60" placeholder="เช่น ไอที, บัญชี">
        </div>
        <div class="field"><label>ตำแหน่ง</label>
          <input type="text" id="editEmpPosition" maxlength="60" placeholder="เช่น สำนักงานใหญ่">
        </div>
        <div class="field"><label>PIN ใหม่ (เว้นว่าง = ไม่เปลี่ยน)</label>
          <input type="password" id="editEmpPin" placeholder="••••" maxlength="8" inputmode="numeric">
        </div>
        <div class="field"><label>Role</label>
          <select id="editEmpRole">
            <option value="user">user — พนักงานทั่วไป</option>
            <option value="superuser">superuser — ผู้โหวตพิเศษ</option>
            <option value="admin">admin — ผู้ดูแลระบบ</option>
            <option value="employee">employee — ลงทะเบียนเข้างาน</option>
          </select>
        </div>
      </div>
      <div style="display:flex;gap:10px;margin-top:16px">
        <button class="btn" id="btnSaveEditEmp"><i class="ti ti-check"></i> บันทึก</button>
        <button class="btn btn-outline" id="btnCancelEditEmp"><i class="ti ti-x"></i> ยกเลิก</button>
      </div>
    </div>`;
    document.body.appendChild(modal);
    document.getElementById('btnCancelEditEmp').addEventListener('click',()=>modal.remove());
    modal.addEventListener('click',ev=>{if(ev.target===modal)modal.remove();});
    document.getElementById('btnSaveEditEmp').addEventListener('click',saveEditEmployee);
  }
  // เติมข้อมูล
  modal.dataset.empId=empId;
  document.getElementById('editEmpIdLabel').textContent=`(${empId})`;
  document.getElementById('editEmpIdDisplay').value=empId;
  document.getElementById('editEmpName').value=emp.name||'';
  document.getElementById('editEmpBranch').value=emp.branch||'';
  document.getElementById('editEmpPosition').value=emp.position||'';
  document.getElementById('editEmpRole').value=emp.role||'user';
  document.getElementById('editEmpPin').value='';
  document.getElementById('editEmpAlert').innerHTML='';
  modal.style.display='flex';
}
async function saveEditEmployee(){
  const modal=document.getElementById('editEmpModal');if(!modal)return;
  const empId=modal.dataset.empId;
  const name=sanitize(document.getElementById('editEmpName').value.trim());
  const branch=sanitize(document.getElementById('editEmpBranch').value.trim());
  const position=sanitize(document.getElementById('editEmpPosition').value.trim());
  const role=document.getElementById('editEmpRole').value;
  const pin=document.getElementById('editEmpPin').value.trim();
  if(!name){showAlert('editEmpAlert','กรุณากรอกชื่อ','warn');return;}
  if(pin&&!/^\d{4,8}$/.test(pin)){showAlert('editEmpAlert','PIN ต้องเป็นตัวเลข 4-8 หลัก','warn');return;}
  // BUG-C FIX: prevent admin from changing their own role (could lock themselves out)
  if(empId===currentUser.id && role!==currentUser.role){
    showAlert('editEmpAlert','ไม่สามารถเปลี่ยน Role ของตัวเองได้','error');return;
  }
  showLoading('กำลังบันทึก...');
  try{
    const res=await sbUpdateEmployee(empId,{name,branch,position,role,pin:pin||null});
    hideLoading();
    if(!res.ok)throw new Error(res.msg);
    modal.remove();
    showAlert('empAlert',`✅ แก้ไขข้อมูล "${name}" สำเร็จ`,'success');
    await loadEmployees();renderEmployeeTable();
  }catch(e){hideLoading();showAlert('editEmpAlert','บันทึกไม่ได้: '+e.message,'error');}
}

// ── Delete Employee Modal ─────────────────────────────────────
function openDeleteEmpModal(empId,empName){
  let modal=document.getElementById('deleteEmpModal');
  if(modal)modal.remove();
  modal=document.createElement('div');
  modal.id='deleteEmpModal';
  modal.style.cssText='position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6);padding:16px';
  modal.innerHTML=`<div style="background:var(--surface,#1e2330);border-radius:16px;padding:24px;width:100%;max-width:420px;box-shadow:0 8px 32px rgba(0,0,0,.4)">
    <div style="font-size:16px;font-weight:700;margin-bottom:8px;display:flex;align-items:center;gap:8px">
      <i class="ti ti-trash" style="color:#f87171"></i> ลบพนักงาน
    </div>
    <p style="color:var(--text2,#94a3b8);font-size:14px;margin-bottom:16px">
      คุณต้องการลบ <strong style="color:var(--text1,#e2e8f0)">${escHtml(empName)}</strong> (${escHtml(empId)}) ออกจากระบบ?
    </p>
    <div id="deleteEmpAlert"></div>
    <label style="display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:16px;cursor:pointer;user-select:none">
      <input type="checkbox" id="chkDeleteRegs" style="width:16px;height:16px;accent-color:#f87171">
      <span>ลบประวัติลงทะเบียนทั้งหมดของพนักงานคนนี้ด้วย</span>
    </label>
    <div style="display:flex;gap:10px">
      <button class="btn" id="btnConfirmDeleteEmp" style="background:#f87171;border-color:#f87171;color:#fff">
        <i class="ti ti-trash"></i> ยืนยันลบ
      </button>
      <button class="btn btn-outline" id="btnCancelDeleteEmp"><i class="ti ti-x"></i> ยกเลิก</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
  modal.dataset.empId=empId;
  modal.dataset.empName=empName;
  document.getElementById('btnCancelDeleteEmp').addEventListener('click',()=>modal.remove());
  modal.addEventListener('click',ev=>{if(ev.target===modal)modal.remove();});
  document.getElementById('btnConfirmDeleteEmp').addEventListener('click',confirmDeleteEmployee);
}
async function confirmDeleteEmployee(){
  const modal=document.getElementById('deleteEmpModal');if(!modal)return;
  const empId=modal.dataset.empId;
  const empName=modal.dataset.empName;
  // BUG-C FIX: prevent admin from deleting their own account
  if(empId===currentUser.id){
    showAlert('deleteEmpAlert','ไม่สามารถลบบัญชีของตัวเองได้','error');return;
  }
  const deleteRegs=document.getElementById('chkDeleteRegs')?.checked;
  showLoading('กำลังลบ...');
  try{
    if(deleteRegs){
      const r=await sbDeleteRegistrations(empId);
      if(!r.ok)throw new Error('ลบประวัติไม่ได้: '+r.msg);
    }
    const r2=await sbDeleteEmployee(empId);
    hideLoading();
    if(!r2.ok)throw new Error(r2.msg);
    modal.remove();
    showAlert('empAlert',`✅ ลบพนักงาน "${empName}" สำเร็จ${deleteRegs?' พร้อมประวัติลงทะเบียน':''}`,'success');
    await loadEmployees();renderEmployeeTable();
  }catch(e){hideLoading();showAlert('deleteEmpAlert','ลบไม่ได้: '+e.message,'error');}
}

function showAddEmpForm(){
  const f=document.getElementById('addEmpForm');
  f.style.display='block';
  f.scrollIntoView({behavior:'smooth'});
  setTimeout(()=>document.getElementById('newEmpId')?.focus(),300);
}
async function saveNewEmployee(){
  const empId=sanitize(document.getElementById('newEmpId').value.trim());
  const name=sanitize(document.getElementById('newEmpName').value.trim());
  const branch=sanitize(document.getElementById('newEmpBranch').value.trim());
  const position=sanitize(document.getElementById('newEmpPosition').value.trim());
  const pin=document.getElementById('newEmpPin').value.trim();
  const role=document.getElementById('newEmpRole').value;
  if(!empId||!name||!pin){showAlert('addEmpAlert','กรุณากรอกข้อมูลที่จำเป็น (รหัส, ชื่อ, PIN)','warn');return;}
  if(!/^\d{4,8}$/.test(pin)){showAlert('addEmpAlert','PIN ต้องเป็นตัวเลข 4-8 หลักเท่านั้น','warn');return;}
  showLoading('กำลังบันทึก...');
  try{
    const res=await sbAddEmployee({empId,name,branch,position,pin,role});
    hideLoading();
    if(!res.ok)throw new Error(res.msg);
    document.getElementById('addEmpForm').style.display='none';
    ['newEmpId','newEmpName','newEmpBranch','newEmpPosition','newEmpPin'].forEach(id=>{
      const el=document.getElementById(id);if(el)el.value='';
    });
    showAlert('empAlert',`✅ เพิ่มพนักงาน "${name}" สำเร็จ`,'success');
    await loadEmployees();renderEmployeeTable();
  }catch(e){hideLoading();showAlert('addEmpAlert','บันทึกไม่ได้: '+e.message,'error');}
}

// Event bindings are wired in app.js wireEventListeners()

