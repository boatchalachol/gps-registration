const SUPABASE_URL  = "https://zqsdmsgnqyyxqozuyapr.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpxc2Rtc2ducXl5eHFvenV5YXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2OTMwMTgsImV4cCI6MjA5NjI2OTAxOH0.p8Z3ygD3gv2xzPcakXok2LoYIfs5Ed70aSPDHOPz7ck";
const CONFIG_READY = !SUPABASE_URL.includes("YOUR_") && !SUPABASE_ANON.includes("YOUR_");
let db = null;
function initSupabase(){
  if(!CONFIG_READY)return false;
  const { createClient } = supabase;
  db = createClient(SUPABASE_URL, SUPABASE_ANON, {
    realtime: {
      params: { eventsPerSecond: 10 }
    }
  });
  return true;
}

// ══ SHARED STATE ═══════════════════════════════════════════
let currentUser = null;
let selectedCp = null;
let allCps = [];
let sysSettings = { LocationEnabled:false, RadiusLockEnabled:false, QREnabled:true };
let userLat=null, userLng=null, userAcc=null;
let gpsReady=false, qrToken=null, gpsWatchId=null;
let scannerStream=null, scannerRunning=false, scannerAnimFrame=null;
let currentTab='camera', cameraAvailable=null;
let adminCheckpoints=[], adminEmployees=[], adminQRTokens=[];
let qrTimers={};
let featureFlags={qrEnabled:true,locationEnabled:false,radiusEnabled:false,wheelOnTime:'09:00'};
let mregSelEmp=null, mregSelCp=null;
// Wheel
let wheelParticipants=[], wheelFilterCp='all', wheelMode='all', wheelSpinning=false, wheelAngle=0;
let wheelWinners=[], confettiAnimId=null, excludeWinners=false;
let wheelAnimFrame=null;
// Login brute-force protection
let loginAttempts=0, loginLockUntil=0, lockoutTimerId=null, lockoutCount=0, lockCountdownTimer=null;
// Dashboard auto-refresh
let dashRefreshTimer=null;
let voteRealtimeChannel=null;
let userVoteRealtimeChannel=null;
let _votePollingTimer=null;
let _voteLastActiveIds="";

const WHEEL_COLORS=[
  '#19d490','#f5a623','#4a9cf0','#9b6dff','#f25555',
  '#0fb876','#e07820','#2979e8','#7c4dff','#c0392b',
  '#00b8a9','#f6a75a','#5b8dee','#b57bee','#e74c3c',
  '#1abc9c','#f39c12','#3498db','#9b59b6','#e67e22'
];
const WINNER_EMOJIS=['🎉','🏆','⭐','🎊','🌟','🥳','🎁','🎰','💫','🎯'];

// ══ UTILS ══════════════════════════════════════════════════
function showView(n){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+n).classList.add('active');
}
function showEmpStep(id){
  document.querySelectorAll('#view-emp .step').forEach(s=>s.classList.remove('active'));
  const el=document.getElementById(id);
  if(el){el.classList.add('active');el.scrollIntoView({behavior:'smooth',block:'start'});}
}
function showAlert(id,msg,type){
  const el=document.getElementById(id);if(!el)return;
  if(!msg){el.innerHTML='';return;}
  const ico={success:'<i class="ti ti-circle-check"></i>',error:'<i class="ti ti-alert-circle"></i>',warn:'<i class="ti ti-alert-triangle"></i>',info:'<i class="ti ti-info-circle"></i>'};
  const cls={success:'a-success',error:'a-error',warn:'a-warn',info:'a-info'};
  el.innerHTML=`<div class="alert ${cls[type]||'a-info'}" role="alert"><span class="aico">${ico[type]||ico.info}</span><div>${escHtml(msg)}</div></div>`;
}
function showAlertRaw(id,html,type){
  const el=document.getElementById(id);if(!el)return;
  if(!html){el.innerHTML='';return;}
  const ico={success:'<i class="ti ti-circle-check"></i>',error:'<i class="ti ti-alert-circle"></i>',warn:'<i class="ti ti-alert-triangle"></i>',info:'<i class="ti ti-info-circle"></i>'};
  const cls={success:'a-success',error:'a-error',warn:'a-warn',info:'a-info'};
  el.innerHTML=`<div class="alert ${cls[type]||'a-info'}" role="alert"><span class="aico">${ico[type]||ico.info}</span><div>${html}</div></div>`;
}
function showLoading(t){
  document.getElementById('loadingText').textContent=t||'กำลังดำเนินการ...';
  document.getElementById('loadingOverlay').style.display='flex';
}
function hideLoading(){document.getElementById('loadingOverlay').style.display='none';}
function sanitize(s){
  return String(s||'').trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,'')
    .replace(/[<>"'`]/g,'');
}
function escHtml(s){
  return String(s||'')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}
function setBtn(id,dis,html){const el=document.getElementById(id);if(!el)return;el.disabled=dis;if(html!==undefined)el.innerHTML=html;}
function setConfirmBtn(ready){setBtn('btnConfirmReg',!ready);}
function updateClock(){
  const el=document.getElementById('headerSub');
  if(!el||!currentUser||currentUser.role==='admin')return;
  el.textContent=new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
}
setInterval(updateClock,1000);
function makeToken(cpId){
  const c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const arr=new Uint8Array(8);
  crypto.getRandomValues(arr);
  let r="";
  for(let i=0;i<8;i++)r+=c[arr[i]%c.length];
  return cpId+"-"+r;
}
function haversine(lat1,lng1,lat2,lng2){
  const R=6371000,dLat=(lat2-lat1)*Math.PI/180,dLng=(lng2-lng1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function bkkDate(){
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok'}).format(new Date());
}
function bkkDayRange(){
  const today=bkkDate();
  return{
    start:new Date(today+'T00:00:00+07:00').toISOString(),
    end:new Date(today+'T23:59:59.999+07:00').toISOString()
  };
}
function localDtToISO(dtLocalVal){
  if(!dtLocalVal)return null;
  const bkkOffset=7*60;
  const d=new Date(dtLocalVal);
  if(isNaN(d.getTime()))return null;
  const localOffset=d.getTimezoneOffset();
  const diffMs=(bkkOffset+localOffset)*60000;
  return new Date(d.getTime()-diffMs).toISOString();
}
function genCpId(){
  const ts=Date.now().toString(36).toUpperCase().slice(-4);
  const r=Math.floor(Math.random()*900+100);
  return 'CP'+r+ts;
}
function isValidLat(v){const n=parseFloat(v);return !isNaN(n)&&n>=-90&&n<=90;}
function isValidLng(v){const n=parseFloat(v);return !isNaN(n)&&n>=-180&&n<=180;}
function clearAllTimers(){Object.values(qrTimers).forEach(t=>clearInterval(t));qrTimers={};}

// ══ SUPABASE ════════════════════════════════════════════════
// ── PIN Hashing (SEC-01) ────────────────────────────────────
// Hashes PIN with SHA-256 (hex) before sending to DB.
// Migration: run once to update all existing employee PINs in DB.
// For production hardening, move to a Supabase Edge Function using bcrypt.
async function hashPin(pin){
  const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(pin)));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

// SECURITY NOTE: PIN is now SHA-256 hashed before compare/store.
// For production, move this to a Supabase Edge Function that hashes PIN with bcrypt.
async function sbLogin(empId,pin){
  const safeId=String(empId||'').trim().slice(0,50);
  const safePin=String(pin||'').trim().slice(0,8);
  if(!safeId||!safePin)return{ok:false,msg:'กรุณากรอกข้อมูลให้ครบ'};
  const hashedPin=await hashPin(safePin);
  const{data,error}=await db.from('employees').select('id,name,branch,position,role').eq('id',safeId).eq('pin',hashedPin).eq('is_active',true).maybeSingle();
  if(error||!data)return{ok:false,msg:'รหัสพนักงานหรือ PIN ไม่ถูกต้อง'};
  return{ok:true,emp:{id:data.id,name:data.name,branch:data.branch,position:data.position,role:data.role}};
}
async function sbGetCheckpoints(activeOnly=true){
  let q=db.from('checkpoints').select('*').order('id');
  if(activeOnly)q=q.eq('is_active',true);
  const{data,error}=await q;if(error)throw error;return data||[];
}
async function sbGetSettings(){
  const{data,error}=await db.from('settings').select('*');if(error)throw error;
  const map={};(data||[]).forEach(r=>map[r.key]=r.value);return map;
}
async function sbSaveSettings(settingsMap){
  for(const[key,value]of Object.entries(settingsMap)){
    await db.from('settings').upsert({key,value:String(value)},{onConflict:'key'});
  }
}
async function sbGetQRTokens(activeOnly=true){
  const now=new Date().toISOString();let q=db.from('qr_tokens').select('*');
  if(activeOnly)q=q.eq('is_active',true).or(`expires_at.is.null,expires_at.gt.${now}`);
  const{data,error}=await q;if(error)throw error;return data||[];
}
async function sbGenerateQR(cpId,expiresAt,revokeOld){
  if(revokeOld){
    let q=db.from('qr_tokens').update({is_active:false}).eq('is_active',true);
    if(cpId)q=q.eq('cp_id',cpId);
    await q;
  }
  const cps=cpId
    ?[adminCheckpoints.find(c=>c.id===cpId)].filter(Boolean)
    :adminCheckpoints.filter(c=>c.is_active!==false);
  const created=[];
  for(const cp of cps){
    const token=makeToken(cp.id);
    const expiresIso=expiresAt?new Date(expiresAt).toISOString():null;
    const row={token,cp_id:cp.id,cp_name:cp.name,is_active:true,expires_at:expiresIso};
    const{error}=await db.from('qr_tokens').insert(row);
    if(!error)created.push({token,cpId:cp.id,cpName:cp.name});
  }
  return{ok:true,created};
}
async function sbValidateToken(token,cpId){
  if(!token)return{valid:false,msg:'ไม่มี QR Token'};
  const{data,error}=await db.from('qr_tokens').select('*').eq('token',token).maybeSingle();
  if(error||!data)return{valid:false,msg:'QR Token ไม่ถูกต้องหรือไม่มีอยู่ในระบบ'};
  if(!data.is_active)return{valid:false,msg:'QR Token ถูกยกเลิกแล้ว'};
  if(data.cp_id!==cpId)return{valid:false,msg:`QR นี้เป็นของ ${escHtml(data.cp_id)} ไม่ใช่ ${escHtml(cpId)}`};
  if(data.expires_at&&new Date(data.expires_at)<new Date())return{valid:false,msg:'QR Token หมดอายุแล้ว — ติดต่อ Admin เพื่อสร้างใหม่'};
  return{valid:true};
}
// IMPORTANT: This client-side check alone is not sufficient.
// Add a UNIQUE constraint in Supabase: UNIQUE(emp_id, cp_id, DATE(registered_at AT TIME ZONE 'Asia/Bangkok'))
async function sbAlreadyRegisteredToday(empId,cpId){
  const{start,end}=bkkDayRange();
  const{data}=await db.from('registrations').select('id').eq('emp_id',empId).eq('cp_id',cpId).gte('registered_at',start).lte('registered_at',end).limit(1);
  return data&&data.length>0;
}
// ตรวจสอบว่า user ลงทะเบียนวันนี้แล้วหรือยัง (ไม่ขึ้นกับ checkpoint)
async function sbCheckUserRegisteredToday(empId){
  const{start,end}=bkkDayRange();
  const{data}=await db.from('registrations').select('id').eq('emp_id',empId).gte('registered_at',start).lte('registered_at',end).limit(1);
  return data&&data.length>0;
}
async function sbRegister({empId,empName,branch,position,cpId,cpName,userLat:lat,userLng:lng,accuracy,distanceM,qrToken:tok,isManual,adminId,note}){
  empName=sanitize(empName);
  branch=sanitize(branch);
  position=sanitize(position);
  note=note?String(note).trim().slice(0,500):null;
  const settings=await sbGetSettings();
  const qrEnabled=settings['QREnabled']!=='false';
  const locEnabled=settings['LocationEnabled']==='true';
  const radiusLock=settings['RadiusLockEnabled']==='true';
  if(!isManual){
    if(qrEnabled){
      const check=await sbValidateToken(tok,cpId);
      if(!check.valid)return{ok:false,msg:check.msg};
    }
    if(locEnabled&&radiusLock){
      const cps=await sbGetCheckpoints(false);
      const cp=cps.find(c=>c.id===cpId);
      if(cp&&cp.max_radius>0&&distanceM>cp.max_radius)
        return{ok:false,msg:`คุณอยู่ห่าง ${Math.round(distanceM)} ม. (สูงสุด ${cp.max_radius} ม.)`};
    }
  }
  // SEC-B: reject if employee account is disabled
  const{data:empCheck}=await db.from('employees').select('is_active').eq('id',empId).maybeSingle();
  if(!empCheck?.is_active)return{ok:false,msg:'บัญชีพนักงานถูกปิดใช้งาน'};
  if(await sbAlreadyRegisteredToday(empId,cpId))
    return{ok:false,msg:'ลงทะเบียนจุดนี้ไปแล้ววันนี้'};
  const ts=new Date();
  const regId=(isManual?'MREG-':'REG-')+crypto.randomUUID().replace(/-/g,'').slice(0,12).toUpperCase();
  const locEnabled_store=locEnabled&&!isManual;
  const row={
    reg_id:regId,emp_id:empId,emp_name:empName,branch,position,cp_id:cpId,cp_name:cpName,
    lat:locEnabled_store?lat:null,
    lng:locEnabled_store?lng:null,
    distance_m:locEnabled_store?Math.round(distanceM||0):null,
    accuracy:accuracy?Math.round(accuracy):null,
    is_manual:isManual||false,admin_id:adminId||null,note:note||null
  };
  const{error}=await db.from('registrations').insert(row);
  if(error)return{ok:false,msg:'บันทึกไม่สำเร็จ: '+error.message};
  try{
    await db.from('audit_log').insert({
      action:isManual?'manual_register':'register',emp_id:empId,emp_name:empName,
      extra:JSON.stringify(isManual
        ?{cpId,cpName,regId,isManual:true,adminId,note}
        :{cpId,cpName,distanceM:Math.round(distanceM||0),regId,
          ...(tok==='BYPASS'?{bypass_reason:'QR disabled by admin'}:{})})
    });
  }catch(_){}
  return{ok:true,regId,ts:ts.toISOString(),distanceM:Math.round(distanceM||0)};
}
async function sbGetDashboard(){
  const{start,end}=bkkDayRange();
  const safe=async q=>{try{return await q;}catch(e){return{data:null,count:null,error:e};}};
  const[totRes,todayRes,cpRes,empRes,recentRes]=await Promise.all([
    safe(db.from('registrations').select('id',{count:'exact',head:true})),
    safe(db.from('registrations').select('id',{count:'exact',head:true}).gte('registered_at',start).lte('registered_at',end)),
    safe(db.from('checkpoints').select('id',{count:'exact',head:true}).eq('is_active',true)),
    safe(db.from('employees').select('id',{count:'exact',head:true}).eq('is_active',true)),
    safe(db.from('registrations').select('id,emp_name,cp_name,registered_at,distance_m,is_manual').order('registered_at',{ascending:false}).limit(10))
  ]);
  return{
    total:totRes.count||0,today:todayRes.count||0,activeCp:cpRes.count||0,activeEmp:empRes.count||0,
    recent:(recentRes.data||[]).map(r=>({
      regId:r.id,empName:r.emp_name,cpName:r.cp_name,
      ts:r.registered_at?new Date(r.registered_at).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Bangkok'}):'—',
      registeredAt:r.registered_at?new Date(r.registered_at).toLocaleString('th-TH',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Bangkok'}):'—',
      distanceM:r.distance_m,isManual:r.is_manual
    }))
  };
}
async function sbGetTodayRegistrations(cpId, onTimeBefore){
  const{start,end}=bkkDayRange();
  let q=db.from('registrations').select('emp_id,emp_name,cp_id,cp_name,registered_at').gte('registered_at',start).lte('registered_at',end);
  const isFiltered=cpId&&cpId!=='all';
  if(isFiltered)q=q.eq('cp_id',cpId);
  // กรองตรงเวลา: ใช้กับทุกโหมด (all หรือ cp เฉพาะ) ถ้ามี onTimeBefore
  if(onTimeBefore){
    const today=bkkDate();
    const cutoff=new Date(today+'T'+onTimeBefore+':00+07:00').toISOString();
    q=q.lt('registered_at',cutoff);
  }
  const{data,error}=await q;if(error)throw error;
  // LOGIC-04 fix: only dedup by emp_id when showing ALL checkpoints
  // When filtered by specific CP, return all rows (including multi-register same person)
  if(isFiltered)return data||[];
  const seen=new Set(),unique=[];
  (data||[]).forEach(r=>{if(!seen.has(r.emp_id)){seen.add(r.emp_id);unique.push(r);}});
  return unique;
}
async function sbGetTodayRegsForExport(){
  const{start,end}=bkkDayRange();
  const{data}=await db.from('registrations').select('*').gte('registered_at',start).lte('registered_at',end).order('registered_at',{ascending:true});
  return data||[];
}
async function sbGetEmployees(){
  const{data,error}=await db.from('employees').select('id,name,branch,position,is_active,role').order('id');
  if(error)throw error;return data||[];
}
async function sbGetEmployeeById(empId){
  const{data,error}=await db.from('employees').select('id,name,branch,position,is_active,role').eq('id',empId).maybeSingle();
  if(error)throw error;return data||null;
}
async function sbAddEmployee({empId,name,branch,position,pin,role}){
  const{data:existing}=await db.from('employees').select('id').eq('id',empId).maybeSingle();
  if(existing)return{ok:false,msg:'รหัสพนักงานนี้มีอยู่แล้ว'};
  const pinHash=await hashPin(pin);
  const{error}=await db.from('employees').insert({id:empId,name,branch:branch||'',position:position||'',pin:pinHash,is_active:true,role:role||'user'});
  if(error)return{ok:false,msg:error.message};return{ok:true};
}
async function sbToggleEmployee(empId,active){
  try{
    await db.from('audit_log').insert({
      action:active?'enable_employee':'disable_employee',emp_id:currentUser?.id||null,emp_name:currentUser?.name||null,
      extra:JSON.stringify({targetEmpId:empId,active,changedBy:currentUser?.id||null})
    });
  }catch(_){}
  const{error}=await db.from('employees').update({is_active:active}).eq('id',empId);
  if(error)return{ok:false,msg:error.message};return{ok:true};
}
async function sbUpdateEmployee(empId,{name,branch,position,role,pin}){
  const upd={name,branch:branch||'',position:position||'',role:role||'user'};
  if(pin){upd.pin=await hashPin(pin);}
  try{
    await db.from('audit_log').insert({
      action:'update_employee',emp_id:currentUser?.id||null,emp_name:currentUser?.name||null,
      extra:JSON.stringify({targetEmpId:empId,fields:Object.keys(upd),pinChanged:!!pin,changedBy:currentUser?.id||null})
    });
  }catch(_){}
  const{error}=await db.from('employees').update(upd).eq('id',empId);
  if(error)return{ok:false,msg:error.message};return{ok:true};
}
async function sbDeleteEmployee(empId){
  try{
    await db.from('audit_log').insert({
      action:'delete_employee',emp_id:currentUser?.id||null,emp_name:currentUser?.name||null,
      extra:JSON.stringify({targetEmpId:empId,deletedBy:currentUser?.id||null})
    });
  }catch(_){}
  const{error}=await db.from('employees').delete().eq('id',empId);
  if(error)return{ok:false,msg:error.message};return{ok:true};
}
async function sbDeleteRegistrations(empId){
  try{
    await db.from('audit_log').insert({
      action:'delete_all_registrations',emp_id:currentUser?.id||null,emp_name:currentUser?.name||null,
      extra:JSON.stringify({targetEmpId:empId,deletedBy:currentUser?.id||null})
    });
  }catch(_){}
  const{error}=await db.from('registrations').delete().eq('emp_id',empId);
  if(error)return{ok:false,msg:error.message};return{ok:true};
}
async function sbSearchRegistrations({name,cpId}){
  let q=db.from('registrations').select('id,emp_id,emp_name,cp_id,cp_name,registered_at,distance_m,is_manual').order('registered_at',{ascending:false}).limit(200);
  if(name){const n=name.trim();q=q.or(`emp_name.ilike.%${n}%,emp_id.ilike.%${n}%`);}
  if(cpId)q=q.eq('cp_id',cpId);
  const{data,error}=await q;if(error)throw error;return data||[];
}
async function sbDeleteOneRegistration(regId){
  // SEC-D: audit log before destructive action
  try{
    await db.from('audit_log').insert({
      action:'delete_registration',
      emp_id:currentUser?.id||null,
      emp_name:currentUser?.name||null,
      extra:JSON.stringify({regId,deletedBy:currentUser?.id||null})
    });
  }catch(_){}
  const{error}=await db.from('registrations').delete().eq('id',regId);
  if(error)return{ok:false,msg:error.message};return{ok:true};
}
// ── Winners ──────────────────────────────────────────────────
async function sbGetTodayWinners(){
  const{start,end}=bkkDayRange();
  const{data,error}=await db.from('winners').select('*').gte('won_at',start).lte('won_at',end).order('won_at',{ascending:false});
  if(error)throw error;return data||[];
}
async function sbSaveWinner(winner){
  const{error}=await db.from('winners').insert({
    emp_id:winner.emp_id,emp_name:winner.emp_name,
    cp_id:winner.cp_id||null,cp_name:winner.cp_name||null,
    won_at:new Date().toISOString()
  });
  if(error)return{ok:false,msg:error.message};return{ok:true};
}
async function sbClearTodayWinners(){
  const{start,end}=bkkDayRange();
  const{error}=await db.from('winners').delete().gte('won_at',start).lte('won_at',end);
  if(error)return{ok:false,msg:error.message};return{ok:true};
}

async function sbSaveCheckpoints(checkpoints){
  const ids=checkpoints.map(c=>c.id);
  for(const cp of checkpoints){
    await db.from('checkpoints').upsert({id:cp.id,name:cp.name,lat:cp.lat,lng:cp.lng,is_active:cp.is_active!==false,max_radius:cp.max_radius||300},{onConflict:'id'});
  }
  const{data:all}=await db.from('checkpoints').select('id');
  const toDelete=(all||[]).filter(r=>!ids.includes(r.id)).map(r=>r.id);
  if(toDelete.length){
    await db.from('qr_tokens').update({is_active:false}).in('cp_id',toDelete);
    await db.from('checkpoints').delete().in('id',toDelete);
  }
}
