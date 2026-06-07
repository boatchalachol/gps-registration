// BUG-02: timer ref so resetEmpFlow/doLogout can cancel the vote redirect
let voteRedirectTimer = null;

function updateLockoutBar(){
  const bar=document.getElementById('lockoutBar');
  if(!bar)return;
  if(Date.now()<loginLockUntil){
    const ms=loginLockUntil-Date.now();
    const sec=Math.ceil(ms/1000);
    const timeStr=sec<60?`${sec} วินาที`:sec<3600?`${Math.ceil(sec/60)} นาที`:`${Math.ceil(sec/3600)} ชั่วโมง`;
    bar.style.display='block';bar.textContent=`⚠️ ล็อกอินผิดบ่อยเกินไป กรุณารอ ${timeStr}`;
  } else {
    bar.style.display='none';
    if(lockCountdownTimer){clearInterval(lockCountdownTimer);lockCountdownTimer=null;}
  }
}
function checkLoginLockout(){
  if(Date.now()<loginLockUntil){updateLockoutBar();return false;}
  const bar=document.getElementById('lockoutBar');
  if(bar)bar.style.display='none';
  return true;
}
// ── SESSION HELPERS ─────────────────────────────────────────────────
async function _routeUser(){
  // BUG-FIX: wrap ด้วย try/catch เพื่อป้องกัน loading ค้างถ้า Supabase error
  try{
    if(currentUser.role==='admin'){
      await initAdmin();setupAdminHeader();showView('admin');
    } else if(currentUser.role==='superuser'){
      await initVoteView();setupVoteHeader();showView('vote');
    } else if(currentUser.role==='user'){
      const alreadyReg=await sbCheckUserRegisteredToday(currentUser.id);
      if(alreadyReg){
        await initVoteView();setupVoteHeader();showView('vote');
      } else {
        await initEmployee();setupUserHeader();showView('emp');
      }
    } else {
      await initEmployee();setupUserHeader();showView('emp');
    }
    // FIX #1: hideLoading ทุก success path (ก่อนหน้านี้ไม่เคย call ทำให้ spinner ค้าง)
    hideLoading();
  }catch(e){
    hideLoading();
    showAlert('loginAlert','โหลดข้อมูลไม่สำเร็จ: '+e.message,'error');
  }
}

async function _restoreSession(){
  try {
    const raw=localStorage.getItem('_session');
    if(!raw) return false;
    const saved=JSON.parse(raw);
    if(!saved||!saved.id||!saved.role) return false;
    // Re-verify กับ Supabase ว่า employee ยังอยู่และยัง active
    // FIX #2: Timeout 8 วินาที ป้องกัน spinner ค้างเมื่อ Supabase ไม่ตอบสนอง
    const timeoutPromise=new Promise((_,rej)=>setTimeout(()=>rej(new Error('Session restore timeout')),8000));
    const res=await Promise.race([sbGetEmployeeById(saved.id),timeoutPromise]);
    if(!res||!res.is_active) { localStorage.removeItem('_session'); return false; }
    currentUser=res;
    localStorage.setItem('_session', JSON.stringify(currentUser)); // refresh
    await _routeUser();
    return true;
  } catch(e){ localStorage.removeItem('_session'); return false; }
}

async function doLogin(){
  // WARN-02: restore lockout state from localStorage so refresh doesn't bypass it
  if(!loginLockUntil){
    const stored=localStorage.getItem('_ll');
    if(stored){
      const parsed=JSON.parse(stored);
      if(Date.now()<parsed.lockUntil){
        loginLockUntil=parsed.lockUntil;
        lockoutCount=parsed.count||0;
        loginAttempts=0;
        if(lockCountdownTimer)clearInterval(lockCountdownTimer);
        lockCountdownTimer=setInterval(updateLockoutBar,1000);
        updateLockoutBar();
      }else{
        localStorage.removeItem('_ll');
      }
    }
  }
  if(!CONFIG_READY){showAlert('loginAlert','⚠️ กรุณาตั้งค่า SUPABASE_URL และ SUPABASE_ANON ก่อนใช้งาน','error');return;}
  if(!checkLoginLockout())return;
  const empId=sanitize(document.getElementById('loginEmpId').value);
  const pin=document.getElementById('loginPin').value.trim();
  if(!empId||!pin){showAlert('loginAlert','กรุณากรอกข้อมูลให้ครบ','warn');return;}
  if(!/^\d{4,8}$/.test(pin)){showAlert('loginAlert','PIN ต้องเป็นตัวเลข 4-8 หลัก','warn');return;}
  setBtn('btnLogin',true,'<i class="ti ti-loader-2 pulsing"></i> กำลังตรวจสอบ...');
  showLoading('กำลังตรวจสอบข้อมูล...');
  try{
    const res=await sbLogin(empId,pin);
    if(!res.ok){
      loginAttempts++;
      if(loginAttempts>=5){
        // SEC-C: exponential backoff — 30s, 2min, 10min, 1hr+
        // lockoutCount persists across lockouts to escalate correctly
        const delays=[30000,120000,600000,3600000];
        const lockMs=delays[Math.min(lockoutCount,delays.length-1)];
        lockoutCount++;
        loginLockUntil=Date.now()+lockMs;loginAttempts=0;
        localStorage.setItem('_ll',JSON.stringify({lockUntil:loginLockUntil,count:lockoutCount}));
        if(lockoutTimerId)clearTimeout(lockoutTimerId);
        lockoutTimerId=setTimeout(()=>{
          loginLockUntil=0;lockoutTimerId=null;
          if(lockCountdownTimer){clearInterval(lockCountdownTimer);lockCountdownTimer=null;}
          const b=document.getElementById('lockoutBar');
          if(b)b.style.display='none';
        },lockMs);
        if(lockCountdownTimer)clearInterval(lockCountdownTimer);
        lockCountdownTimer=setInterval(updateLockoutBar,1000);
        updateLockoutBar();
        // BUG-FIX: ถ้า lock แล้ว ไม่ต้องแสดง "เหลือ N ครั้ง"
        showAlert('loginAlert',res.msg,'error');
        return;
      }
      const remaining=Math.max(0,5-loginAttempts);
      showAlert('loginAlert',res.msg+(remaining<5?` (เหลือ ${remaining} ครั้ง)`:''),'error');
      return;
    }
    loginAttempts=0;loginLockUntil=0;lockoutCount=0;localStorage.removeItem('_ll');
    if(lockoutTimerId){clearTimeout(lockoutTimerId);lockoutTimerId=null;}
    if(lockCountdownTimer){clearInterval(lockCountdownTimer);lockCountdownTimer=null;}
    currentUser=res.emp;
    // SEC: บันทึก session ไว้ใน localStorage เพื่อ auto-restore เมื่อรีเฟรช
    localStorage.setItem('_session', JSON.stringify(currentUser));
    await _routeUser();
  }catch(err){showAlert('loginAlert','เชื่อมต่อ Supabase ไม่ได้: '+err.message,'error');}
  finally{hideLoading();setBtn('btnLogin',false,'<i class="ti ti-login"></i> <span>เข้าสู่ระบบ</span>');}
}
function doLogout(){
  stopScanner();stopGPSWatch();clearAllTimers();stopConfetti();
  if(dashRefreshTimer){clearInterval(dashRefreshTimer);dashRefreshTimer=null;}
  if(wheelAnimFrame){cancelAnimationFrame(wheelAnimFrame);wheelAnimFrame=null;}
  if(lockoutTimerId){clearTimeout(lockoutTimerId);lockoutTimerId=null;}
  if(voteRedirectTimer){clearTimeout(voteRedirectTimer);voteRedirectTimer=null;}
  localStorage.removeItem('_ll');
  localStorage.removeItem('_session'); // ล้าง session เมื่อ logout
  currentUser=null;selectedCp=null;allCps=[];qrToken=null;gpsReady=false;
  userLat=null;userLng=null;userAcc=null;cameraAvailable=null;adminQRTokens=[];
  mregSelEmp=null;mregSelCp=null;wheelParticipants=[];wheelWinners=[];
  excludeWinners=false;loginAttempts=0;loginLockUntil=0;lockoutCount=0;
  if(lockCountdownTimer){clearInterval(lockCountdownTimer);lockCountdownTimer=null;}
  if(typeof dashSearchResults!=='undefined')dashSearchResults=[];
  if(typeof dashClearSearch==='function')dashClearSearch();
  currentTab='camera';
  if(typeof resetVoteState==='function')resetVoteState();
  document.getElementById('mainHeader').style.display='none';
  document.getElementById('headerRight').innerHTML='';
  document.getElementById('loginEmpId').value='';
  document.getElementById('loginPin').value='';
  const lb=document.getElementById('lockoutBar');if(lb)lb.style.display='none';
  showAlert('loginAlert','','');showEmpStep('estep-checkpoint');showView('login');
}
function setupUserHeader(){
  document.getElementById('mainHeader').style.display='flex';
  document.getElementById('headerLogo').className='h-logo user-logo';
  document.getElementById('headerLogo').innerHTML='<img src="img/logo.png" alt="logo" style="width:32px;height:32px;object-fit:contain;border-radius:6px">';
  document.getElementById('headerTitle').textContent='ลงทะเบียนเข้างาน';
  document.getElementById('headerSub').textContent=currentUser.name||'';
  document.getElementById('headerRight').innerHTML=`<button class="btn btn-outline btn-sm" id="btnHeaderLogout"><i class="ti ti-logout"></i> ออก</button>`;
  document.getElementById('btnHeaderLogout').addEventListener('click',doLogout);
}

// ══ EMPLOYEE FLOW ═══════════════════════════════════════════
async function initEmployee(){
  document.getElementById('empNameDisplay').textContent=currentUser.name;
  document.getElementById('empMetaDisplay').textContent=[currentUser.branch,currentUser.position].filter(Boolean).join(' · ');
  const[cps,settings]=await Promise.all([sbGetCheckpoints(true),sbGetSettings()]);
  allCps=cps;applyEmpSettings(settings);renderCheckpoints();showEmpStep('estep-checkpoint');
}
function applyEmpSettings(s){
  const t=v=>v===true||v==='true'||v==='TRUE';
  sysSettings.LocationEnabled=t(s.LocationEnabled);
  sysSettings.RadiusLockEnabled=t(s.RadiusLockEnabled);
  sysSettings.QREnabled=s.QREnabled!==undefined?s.QREnabled!=='false':true;
}
function renderCheckpoints(){
  const list=document.getElementById('cpList');
  if(!allCps.length){
    list.innerHTML='<div style="color:var(--text3);font-size:13px;padding:12px;text-align:center">ไม่มีจุดลงทะเบียนที่เปิดใช้งาน</div>';
    showAlert('cpAlert','ไม่พบ Checkpoint ที่เปิดใช้งาน — ติดต่อ Admin','warn');return;
  }
  list.innerHTML='';
  allCps.forEach(cp=>{
    const div=document.createElement('div');
    div.className='cp-item';
    div.id='cp-'+cp.id;
    div.setAttribute('role','button');
    div.setAttribute('tabindex','0');
    div.setAttribute('aria-label','เลือก '+cp.name);
    div.innerHTML=`<div class="cp-ico"><i class="ti ti-map-pin"></i></div>
      <div style="flex:1;min-width:0">
        <div class="cp-name">${escHtml(cp.name)}</div>
        <div class="cp-meta">${escHtml(cp.id)} · รัศมี ${escHtml(String(cp.max_radius||500))} ม.</div>
      </div>`;
    div.addEventListener('click',()=>selectCp(cp.id));
    div.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')selectCp(cp.id);});
    list.appendChild(div);
  });
}
function selectCp(id){
  document.querySelectorAll('.cp-item').forEach(el=>el.classList.remove('sel'));
  const el=document.getElementById('cp-'+id);if(el)el.classList.add('sel');
  selectedCp=allCps.find(c=>c.id===id)||null;
  document.getElementById('btnSelectCp').disabled=!selectedCp;
}
function doSelectCheckpoint(){
  if(!selectedCp)return;
  stopGPSWatch();gpsReady=false;userLat=null;userLng=null;userAcc=null;
  resetQRState();
  qrToken=null;
  setConfirmBtn(false);showAlert('qrAlert','','');
  const needQR=sysSettings.QREnabled, needGPS=sysSettings.LocationEnabled;
  document.getElementById('qrStepTitle').innerHTML=needQR?'<i class="ti ti-qrcode"></i> สแกน QR Code':(needGPS?'<i class="ti ti-satellite"></i> ยืนยัน GPS':'<i class="ti ti-check"></i> ยืนยัน');
  document.getElementById('qrStepSub').textContent=`จุด: ${selectedCp.name} (${selectedCp.id})`;
  document.getElementById('qrScanBlock').style.display=needQR?'':'none';
  document.getElementById('gpsBlock').style.display=needGPS?'':'none';
  resetGPSUI();
  if(!needQR&&!needGPS){qrToken='BYPASS';gpsReady=true;setConfirmBtn(true);}
  showEmpStep('estep-qr');
  if(needQR){
    const inIframe=window.self!==window.top;
    if(isWebView()||inIframe){
      document.getElementById('tabCamera').style.display='none';
      switchScanTab('photo');
    }else{
      document.getElementById('tabCamera').style.display='';
      switchScanTab('camera');
      setTimeout(()=>startScanner(),300);
    }
  }
}
function goBackToCheckpoint(){stopScanner();stopGPSWatch();resetQRState();gpsReady=false;showEmpStep('estep-checkpoint');}

// ── QR Scanner ──────────────────────────────────────────────
function switchScanTab(tab){
  currentTab=tab;
  ['camera','photo','manual'].forEach(t=>{
    const tabBtn=document.getElementById('tab'+t.charAt(0).toUpperCase()+t.slice(1));
    const panel=document.getElementById(t+'Panel');
    if(tabBtn)tabBtn.classList.toggle('active',t===tab);
    if(panel)panel.style.display=t===tab?'':'none';
  });
  if(tab==='camera')startScanner();
  else{stopScanner();if(tab==='manual')setTimeout(()=>document.getElementById('manualToken')?.focus(),150);}
}
async function startScanner(){
  if(scannerRunning)return;
  const video=document.getElementById('qrVideo'),status=document.getElementById('scannerStatus');
  document.getElementById('qrTokenStrip').style.display='none';
  document.getElementById('qrScannerBox').style.display='block';
  if(status)status.innerHTML='<div class="spinner" style="width:14px;height:14px;border-width:2px;flex-shrink:0"></div> กำลังเปิดกล้อง...';
  if(!navigator.mediaDevices?.getUserMedia){onCameraFailed('เบราว์เซอร์ไม่รองรับกล้องสด');return;}
  let stream=null,lastErr=null;
  for(const c of[{video:{facingMode:{ideal:'environment'}}},{video:{facingMode:'environment'}},{video:true}]){
    try{stream=await navigator.mediaDevices.getUserMedia(c);break;}
    catch(err){lastErr=err;if(err.name==='NotAllowedError'||err.name==='PermissionDeniedError')break;}
  }
  if(!stream){cameraAvailable=false;onCameraFailed(lastErr?.name==='NotAllowedError'?'ถูกปฏิเสธการเข้าถึงกล้อง':'ไม่สามารถเปิดกล้องสดได้');return;}
  cameraAvailable=true;scannerStream=stream;video.srcObject=stream;
  try{
    await new Promise((res,rej)=>{video.onloadedmetadata=res;video.onerror=rej;setTimeout(rej,8000);});
    await video.play();
  }catch(e){stopScanner();onCameraFailed('เปิดกล้องไม่สำเร็จ');return;}
  scannerRunning=true;
  if(status)status.innerHTML='<i class="ti ti-scan" style="color:var(--teal)"></i> กำลังสแกน — จ่อ QR Code ในกรอบ';
  scanFrame();
}
function onCameraFailed(msg){
  stopScanner();cameraAvailable=false;switchScanTab('photo');
  showAlertRaw('qrAlert',escHtml(msg)+' — กรุณาใช้แท็บ <strong>ถ่ายภาพ</strong> หรือ <strong>Token</strong>','warn');
}
function scanFrame(){
  if(!scannerRunning)return;
  const video=document.getElementById('qrVideo'),canvas=document.getElementById('qrCanvas');
  if(!video||!canvas||video.readyState<2){scannerAnimFrame=requestAnimationFrame(scanFrame);return;}
  const w=video.videoWidth,h=video.videoHeight;
  if(!w||!h||w<10||h<10){scannerAnimFrame=requestAnimationFrame(scanFrame);return;}
  canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  try{
    ctx.drawImage(video,0,0,w,h);
    const imageData=ctx.getImageData(0,0,w,h);
    const code=jsQR(imageData.data,w,h,{inversionAttempts:'dontInvert'});
    if(code?.data){stopScanner();applyQRToken(code.data.trim());return;}
  }catch(e){}
  scannerAnimFrame=requestAnimationFrame(scanFrame);
}
function stopScanner(){
  scannerRunning=false;
  if(scannerAnimFrame){cancelAnimationFrame(scannerAnimFrame);scannerAnimFrame=null;}
  if(scannerStream){scannerStream.getTracks().forEach(t=>t.stop());scannerStream=null;}
  const video=document.getElementById('qrVideo');if(video)video.srcObject=null;
}
function onPhotoSelected(event){
  const file=event.target.files?.[0];if(!file)return;
  if(file.size>20*1024*1024){
    document.getElementById('photoDecodeStatus').innerHTML='<div class="alert a-error"><span class="aico"><i class="ti ti-alert-circle"></i></span><div>ไฟล์ใหญ่เกินไป (สูงสุด 20 MB)</div></div>';
    event.target.value='';return;
  }
  const statusEl=document.getElementById('photoDecodeStatus'),preview=document.getElementById('photoPreview');
  statusEl.innerHTML='<div style="display:flex;align-items:center;justify-content:center;gap:8px;color:var(--text2);font-size:13px;padding:8px"><div class="spinner" style="width:16px;height:16px;border-width:2px"></div>กำลังอ่าน QR...</div>';
  const reader=new FileReader();
  reader.onload=function(e){
    const img=new Image();
    img.onerror=()=>{statusEl.innerHTML='<div class="alert a-error"><span class="aico"><i class="ti ti-alert-circle"></i></span><div>โหลดรูปไม่ได้</div></div>';event.target.value='';};
    img.onload=async function(){
      preview.src=e.target.result;preview.style.display='block';
      try{
        let code=null;
        const attempts=buildAttempts(img);
        for(const attempt of attempts){
          if(code)break;
          for(const inv of['dontInvert','onlyInvert','attemptBoth']){
            try{code=jsQR(attempt.data,attempt.w,attempt.h,{inversionAttempts:inv});}catch(_){}
            if(code)break;
          }
        }
        if(code?.data){statusEl.innerHTML='';applyQRToken(code.data.trim());return;}
        statusEl.innerHTML='<div class="alert a-error"><span class="aico"><i class="ti ti-alert-circle"></i></span><div>อ่าน QR ไม่สำเร็จ — ลองถ่ายใหม่ให้ชัดขึ้น หรือใช้แท็บ <strong>Token</strong></div></div>';
        event.target.value='';
      }catch(err){
        statusEl.innerHTML=`<div class="alert a-error"><span class="aico"><i class="ti ti-alert-circle"></i></span><div>Error: ${escHtml(err.message)}</div></div>`;
        event.target.value='';
      }
    };
    img.decoding='async';img.src=e.target.result;
  };
  reader.readAsDataURL(file);
}
function buildAttempts(img){
  const results=[];
  for(const maxDim of[2048,1536,1024,768,512]){
    const scale=Math.min(1,maxDim/Math.max(img.width||1,img.height||1));
    const w=Math.round((img.width||1)*scale),h=Math.round((img.height||1)*scale);
    if(w<20||h<20)continue;
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,w,h);
    const px=ctx.getImageData(0,0,w,h).data;
    results.push({data:new Uint8ClampedArray(px),w,h});
    const hc=new Uint8ClampedArray(px.length);
    for(let i=0;i<px.length;i+=4){const v=px[i]*.299+px[i+1]*.587+px[i+2]*.114<128?0:255;hc[i]=hc[i+1]=hc[i+2]=v;hc[i+3]=255;}
    results.push({data:hc,w,h});
    canvas.width=1;canvas.height=1;
  }
  return results;
}
function applyQRToken(token){
  if(!token)return;
  const parts=token.split('-');
  if(parts.length<2){showAlert('qrAlert','QR Token รูปแบบไม่ถูกต้อง (ต้องมี -)','error');return;}
  if(selectedCp&&parts[0]!==selectedCp.id){
    showAlert('qrAlert',`QR นี้เป็นของ ${parts[0]} ไม่ใช่ ${selectedCp.id} — กรุณาสแกน QR ที่ถูกจุด`,'error');return;
  }
  qrToken=token;
  document.getElementById('scanTabs').style.display='none';
  ['cameraPanel','photoPanel','manualPanel'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});
  const status=document.getElementById('scannerStatus');if(status)status.innerHTML='';
  document.getElementById('qrTokenStrip').style.display='flex';
  document.getElementById('qrTokenVal').textContent=token;
  const gpsMsg=sysSettings.LocationEnabled?' — กรุณากด <strong>ขอ GPS Location</strong>':' — กดปุ่มยืนยันได้เลย';
  showAlertRaw('qrAlert','✅ ยืนยัน QR Token สำเร็จ'+gpsMsg,'success');
  checkReadyToSubmit();
}
function applyManualToken(){
  const v=(document.getElementById('manualToken')?.value||'').trim().toUpperCase().slice(0,30);
  if(!v){showAlert('qrAlert','กรุณากรอก Token','warn');return;}
  applyQRToken(v);
}
function resetScan(){
  stopScanner();qrToken=null;
  document.getElementById('qrTokenStrip').style.display='none';
  document.getElementById('scanTabs').style.display='';
  const mt=document.getElementById('manualToken');if(mt)mt.value='';
  const pp=document.getElementById('photoPreview');if(pp)pp.style.display='none';
  const ph=document.getElementById('photoFileInput');if(ph)ph.value='';
  const ds=document.getElementById('photoDecodeStatus');if(ds)ds.innerHTML='';
  showAlert('qrAlert','','');checkReadyToSubmit();
  if(isWebView()||window.self!==window.top)switchScanTab('photo');else switchScanTab('camera');
}
function resetQRState(){
  stopScanner();qrToken=null;
  const ts=document.getElementById('qrTokenStrip');if(ts)ts.style.display='none';
  const tabs=document.getElementById('scanTabs');if(tabs)tabs.style.display='';
  const pp=document.getElementById('photoPreview');if(pp)pp.style.display='none';
  const ph=document.getElementById('photoFileInput');if(ph)ph.value='';
  const ds=document.getElementById('photoDecodeStatus');if(ds)ds.innerHTML='';
  const mt=document.getElementById('manualToken');if(mt)mt.value='';
  const status=document.getElementById('scannerStatus');if(status)status.innerHTML='';
}
function isWebView(){
  const ua=navigator.userAgent||'';
  return /FBAN|FBAV|FB_IAB|Line\/|Instagram|Twitter|MicroMessenger/.test(ua)
    ||((/iPhone|iPad|iPod/.test(ua))&&!/Safari/.test(ua))
    ||(/Android/.test(ua)&&/wv/.test(ua));
}

// ── GPS ─────────────────────────────────────────────────────
async function requestGPS(){
  if(!navigator.geolocation){onGPSError('เบราว์เซอร์ไม่รองรับ GPS');return;}
  const btn=document.getElementById('btnGps');
  btn.disabled=true;btn.innerHTML='<i class="ti ti-loader-2 pulsing"></i> กำลังหาพิกัด...';
  stopGPSWatch();
  let settled=false;
  let manualTimeoutId=null;
  gpsWatchId=navigator.geolocation.watchPosition(
    pos=>{
      if(settled)return;
      if(pos.coords.accuracy>80)return;
      settled=true;
      if(manualTimeoutId){clearTimeout(manualTimeoutId);manualTimeoutId=null;}
      stopGPSWatch();
      onGPSSuccess(pos.coords.latitude,pos.coords.longitude,pos.coords.accuracy);
      btn.disabled=false;btn.innerHTML='<i class="ti ti-antenna"></i> ขอ GPS อีกครั้ง';
    },
    err=>{
      if(settled)return;settled=true;
      if(manualTimeoutId){clearTimeout(manualTimeoutId);manualTimeoutId=null;}
      stopGPSWatch();
      const msgs=['','กรุณาอนุญาต Location ในเบราว์เซอร์','ไม่สามารถหาพิกัดได้','หมดเวลา GPS'];
      onGPSError(msgs[err.code]||'เกิดข้อผิดพลาด GPS');
      btn.disabled=false;btn.innerHTML='<i class="ti ti-antenna"></i> ลองอีกครั้ง';
    },
    {enableHighAccuracy:true,timeout:19500,maximumAge:0}
  );
  manualTimeoutId=setTimeout(()=>{
    if(!settled){
      settled=true;stopGPSWatch();
      onGPSError('หมดเวลา — ลองกด ลองอีกครั้ง');
      btn.disabled=false;btn.innerHTML='<i class="ti ti-antenna"></i> ลองอีกครั้ง';
    }
  },20000);
}
function stopGPSWatch(){
  if(gpsWatchId!==null){
    navigator.geolocation.clearWatch(gpsWatchId);
    gpsWatchId=null;
  }
}
function onGPSSuccess(lat,lng,acc){
  if(!selectedCp){stopGPSWatch();return;}
  userLat=lat;userLng=lng;userAcc=acc;
  const dist=haversine(lat,lng,selectedCp.lat,selectedCp.lng);
  const maxR=selectedCp.max_radius||500,inZone=dist<=maxR;
  const badge=document.getElementById('gpsBadge');
  badge.className=`badge ${inZone?'b-teal':'b-red'}`;
  badge.textContent=inZone?'✓ ได้รับพิกัด':`ไกลเกิน ${Math.round(dist)} ม.`;
  document.getElementById('gpsDetail').style.display='block';
  document.getElementById('gpsLat').textContent=lat.toFixed(6);
  document.getElementById('gpsLng').textContent=lng.toFixed(6);
  document.getElementById('gpsDist').innerHTML=`<span style="color:${inZone?'var(--teal)':'var(--red)'}">${Math.round(dist)} ม.</span>`;
  document.getElementById('gpsAcc').textContent=`ความแม่นยำ: ±${Math.round(acc)} ม.`;
  if(sysSettings.LocationEnabled&&sysSettings.RadiusLockEnabled&&!inZone){
    showAlert('qrAlert',`📍 คุณอยู่ห่าง ${Math.round(dist)} ม. (สูงสุด ${maxR} ม.) — ไม่สามารถลงทะเบียนได้`,'error');
    gpsReady=false;
  }else{
    gpsReady=true;
    if(!qrToken&&sysSettings.QREnabled)showAlertRaw('qrAlert','GPS พร้อม ✓ — กรุณายืนยัน QR Token ก่อน','info');
    else showAlert('qrAlert','GPS พร้อม ✓','success');
  }
  checkReadyToSubmit();
}
function onGPSError(msg){
  document.getElementById('gpsBadge').className='badge b-red';
  document.getElementById('gpsBadge').textContent='ปฏิเสธ';
  showAlert('qrAlert',msg||'กรุณาอนุญาต Location ในการตั้งค่าเบราว์เซอร์','error');
}
function resetGPSUI(){
  const b=document.getElementById('gpsBadge');if(b){b.className='badge b-amber';b.textContent='รอ';}
  const d=document.getElementById('gpsDetail');if(d)d.style.display='none';
  userLat=null;userLng=null;userAcc=null;gpsReady=false;
}
function checkReadyToSubmit(){
  const qrOk=!sysSettings.QREnabled||!!qrToken;
  const gpsOk=!sysSettings.LocationEnabled||gpsReady;
  setConfirmBtn(qrOk&&gpsOk);
}

// ── Register ────────────────────────────────────────────────
async function doRegister(){
  if(sysSettings.QREnabled&&!qrToken){showAlert('qrAlert','กรุณายืนยัน QR Token ก่อน','warn');return;}
  if(sysSettings.LocationEnabled&&!gpsReady){showAlert('qrAlert','กรุณาขอ GPS Location ก่อน','warn');return;}
  if(!selectedCp){showAlert('qrAlert','ไม่พบข้อมูล Checkpoint','error');return;}
  setConfirmBtn(false);
  showLoading('กำลังบันทึกข้อมูล...');
  const dist=userLat!==null?Math.round(haversine(userLat,userLng,selectedCp.lat,selectedCp.lng)):0;
  try{
    const res=await sbRegister({
      empId:currentUser.id,empName:currentUser.name,branch:currentUser.branch,position:currentUser.position,
      cpId:selectedCp.id,cpName:selectedCp.name,
      userLat,userLng,accuracy:userAcc,distanceM:dist,qrToken:qrToken||'BYPASS'
    });
    if(!res.ok){showAlert('qrAlert',res.msg,'error');return;}
    const ts=new Date(res.ts);
    document.getElementById('successSub').textContent=`${currentUser.name} · ${selectedCp.name}`;
    document.getElementById('successGrid').innerHTML=`
      <div class="info-cell"><div class="ic-lbl">เวลา</div><div class="ic-val teal">${ts.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Bangkok'})}</div></div>
      <div class="info-cell"><div class="ic-lbl">วันที่</div><div class="ic-val">${ts.toLocaleDateString('th-TH',{year:'numeric',month:'long',day:'numeric',timeZone:'Asia/Bangkok'})}</div></div>
      <div class="info-cell"><div class="ic-lbl">จุดลงทะเบียน</div><div class="ic-val">${escHtml(selectedCp.name)}</div></div>
      <div class="info-cell"><div class="ic-lbl">ระยะห่าง</div><div class="ic-val teal">${res.distanceM} ม.</div></div>
      <div class="info-cell ic-span"><div class="ic-lbl">Registration ID</div><div class="ic-val" style="font-family:var(--mono);font-size:12px">${escHtml(res.regId)}</div></div>`;
    stopScanner();stopGPSWatch();showEmpStep('estep-success');
    // user ที่ลงทะเบียนเสร็จ → เด้งไปหน้าโหวตทันที พร้อม countdown bar
    // (superuser ไม่ผ่านหน้านี้ เพราะเข้าหน้าโหวตโดยตรงตั้งแต่ login)
    if(currentUser.role==='user'){
      const bar=document.getElementById('voteRedirectBar');
      const barFill=document.getElementById('voteCountdownBar');
      if(bar){bar.style.display='block';}
      // animate bar จาก 100% → 0% ใน 2 วินาที
      if(barFill){
        requestAnimationFrame(()=>{
          requestAnimationFrame(()=>{ barFill.style.width='0%'; });
        });
      }
      voteRedirectTimer = setTimeout(async()=>{
        voteRedirectTimer = null;
        await initVoteView();setupVoteHeader();showView('vote');
      },2000);
    }
  }catch(err){
    showAlert('qrAlert','เกิดข้อผิดพลาด: '+err.message,'error');
    // BUG-FIX: enable ปุ่มคืนเฉพาะตอน error เท่านั้น (success ไม่ต้องการ)
    hideLoading();setConfirmBtn(true);
    return;
  }
  hideLoading();
  // success: ไม่ enable ปุ่มคืน เพราะกำลัง redirect ไปหน้าโหวต
}
function resetEmpFlow(){
  if(voteRedirectTimer){clearTimeout(voteRedirectTimer);voteRedirectTimer=null;}
  stopScanner();stopGPSWatch();selectedCp=null;qrToken=null;gpsReady=false;
  userLat=null;userLng=null;userAcc=null;
  currentTab='camera';
  if(typeof resetVoteState==='function')resetVoteState();
  renderCheckpoints();document.getElementById('btnSelectCp').disabled=true;
  showEmpStep('estep-checkpoint');
}

