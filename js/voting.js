// js/voting.js — Voting system logic (admin + user + superuser)

// ══ ADMIN: CONTEST MANAGEMENT ═══════════════════════════════

async function sbCreateContest(name, desc) {
  const { data, error } = await db.from('contests').insert({
    name: sanitize(name),
    description: sanitize(desc || ''),
    is_active: true,
    created_at: new Date().toISOString()
  }).select().maybeSingle();
  if (error) throw error;
  return data;
}

async function sbGetContests(activeOnly = false) {
  let q = db.from('contests').select('*').order('created_at', { ascending: false });
  if (activeOnly) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

async function sbGetContestScores(contestId) {
  const { data, error } = await db
    .from('votes')
    .select('voter_id, voter_name, voter_role, score, created_at')
    .eq('contest_id', contestId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function sbToggleContest(contestId, isActive) {
  const { error } = await db.from('contests').update({ is_active: isActive }).eq('id', contestId);
  if (error) throw error;
}

async function sbDeleteContest(contestId) {
  // Delete votes first
  await db.from('votes').delete().eq('contest_id', contestId);
  const { error } = await db.from('contests').delete().eq('id', contestId);
  if (error) throw error;
}

// ══ USER/SUPERUSER: VOTING ═══════════════════════════════════

async function sbGetActiveContests() {
  const { data, error } = await db
    .from('contests')
    .select('id, name, description')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function sbSubmitVote(contestId, score) {
  // SEC-03: Validate score range by re-fetching settings (prevents client-side bypass)
  const voteSettings = await sbGetSettings();
  const isSuper = currentUser.role === 'superuser';
  const maxAllowed = parseInt(isSuper ? (voteSettings['VoteScoreSuper'] || '100') : (voteSettings['VoteScoreUser'] || '10'));
  const scoreNum = parseInt(score);
  if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > maxAllowed) {
    throw new Error(`คะแนนไม่ถูกต้อง (ต้องอยู่ระหว่าง 1 – ${maxAllowed})`);
  }

  // Check if already voted (WARN-01: race condition mitigated by DB UNIQUE constraint)
  const { data: existing } = await db
    .from('votes')
    .select('id')
    .eq('contest_id', contestId)
    .eq('voter_id', currentUser.id)
    .maybeSingle();
  if (existing) throw new Error('คุณได้โหวตงานนี้ไปแล้ว');

  const { error } = await db.from('votes').insert({
    contest_id: contestId,
    voter_id: currentUser.id,
    voter_name: currentUser.name,
    voter_role: currentUser.role,
    score: scoreNum,
    created_at: new Date().toISOString()
  });
  // Handle DB UNIQUE constraint violation (race condition fallback)
  if (error) {
    if (error.code === '23505') throw new Error('คุณได้โหวตงานนี้ไปแล้ว');
    throw error;
  }
}

async function sbGetMyVotedContests() {
  if (!currentUser) return [];
  const { data, error } = await db
    .from('votes')
    .select('contest_id')
    .eq('voter_id', currentUser.id);
  if (error) return [];
  return (data || []).map(v => v.contest_id);
}

// ══ ADMIN VOTING PAGE ════════════════════════════════════════

async function initVotingPage() {
  await loadContestList();
  // Realtime: subscribe votes table — reload ทันทีเมื่อมี vote ใหม่
  if(voteRealtimeChannel){try{db&&db.removeChannel(voteRealtimeChannel);}catch(_){}}
  voteRealtimeChannel=db.channel('votes-admin')
    .on('postgres_changes',{event:'*',schema:'public',table:'votes'},()=>{
      loadContestList();
    })
    .subscribe();
}

async function sbGetAllVotes() {
  const { data, error } = await db
    .from('votes')
    .select('contest_id, voter_id, voter_name, voter_role, score, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function loadContestList() {
  const wrap = document.getElementById('contestListWrap');
  if (!wrap) return;
  try {
    const [contests, allVotes, voteSettings] = await Promise.all([sbGetContests(false), sbGetAllVotes(), sbGetSettings()]);
    const _userMax = parseInt(voteSettings['VoteScoreUser'] || '10');
    const _superMax = parseInt(voteSettings['VoteScoreSuper'] || '100');
    const votesByContest = {};
    allVotes.forEach(v => {
      if (!votesByContest[v.contest_id]) votesByContest[v.contest_id] = [];
      votesByContest[v.contest_id].push(v);
    });
    if (!contests.length) {
      wrap.innerHTML = `<div style="color:var(--text3);font-size:13px;text-align:center;padding:24px">
        <i class="ti ti-trophy-off" style="font-size:28px;display:block;margin-bottom:8px;opacity:.4"></i>
        ยังไม่มีงานประกวด กรุณาสร้างใหม่ด้านบน
      </div>`;
      return;
    }
    wrap.innerHTML = '';
    for (const c of contests) {
      const votes = votesByContest[c.id] || [];
      const userVotes = votes.filter(v => v.voter_role === 'user');
      const superVotes = votes.filter(v => v.voter_role === 'superuser');
      const userTotal = userVotes.reduce((s, v) => s + v.score, 0);
      const superTotal = superVotes.reduce((s, v) => s + v.score, 0);
      const grandTotal = userTotal + superTotal;

      const card = document.createElement('div');
      card.style.cssText = 'background:var(--bg3);border:1px solid var(--border2);border-radius:var(--r2);padding:16px;margin-bottom:12px';
      card.innerHTML = `
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px">
          <div style="flex:1;min-width:0">
            <div style="font-size:15px;font-weight:700;margin-bottom:3px">${escHtml(c.name)}</div>
            ${c.description ? `<div style="font-size:12px;color:var(--text3)">${escHtml(c.description)}</div>` : ''}
          </div>
          <span style="flex-shrink:0;font-size:11px;font-weight:600;padding:3px 8px;border-radius:6px;
            ${c.is_active ? 'background:var(--teal-bg);color:var(--teal);border:1px solid var(--teal-bd)' : 'background:var(--bg2);color:var(--text3);border:1px solid var(--border)'}">
            ${c.is_active ? '● เปิด' : '○ ปิด'}
          </span>
        </div>

        <!-- Score summary -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">
          <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:11px;color:var(--text3);margin-bottom:4px">User (1-${_userMax})</div>
            <div style="font-size:20px;font-weight:700;color:var(--teal)">${userTotal}</div>
            <div style="font-size:10px;color:var(--text3)">${userVotes.length} โหวต</div>
          </div>
          <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:11px;color:var(--text3);margin-bottom:4px">Super (10-${_superMax})</div>
            <div style="font-size:20px;font-weight:700;color:var(--purple)">${superTotal}</div>
            <div style="font-size:10px;color:var(--text3)">${superVotes.length} โหวต</div>
          </div>
          <div style="background:var(--amber-bg);border:1px solid var(--amber-bd);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:11px;color:var(--amber);margin-bottom:4px">รวมทั้งหมด</div>
            <div style="font-size:20px;font-weight:700;color:var(--amber)">${grandTotal}</div>
            <div style="font-size:10px;color:var(--text3)">${votes.length} คน</div>
          </div>
        </div>

        <!-- Voter detail toggle -->
        <details style="margin-bottom:10px">
          <summary style="font-size:12px;color:var(--text2);cursor:pointer;padding:6px 0">
            <i class="ti ti-users" style="font-size:11px"></i> ดูรายละเอียดผู้โหวต (${votes.length} คน)
          </summary>
          <div style="margin-top:8px;max-height:200px;overflow-y:auto">
            ${votes.length === 0 ? '<div style="color:var(--text3);font-size:12px;text-align:center;padding:10px">ยังไม่มีผู้โหวต</div>' :
              votes.map(v => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;border-radius:6px;background:var(--bg2);margin-bottom:4px">
                  <div>
                    <span style="font-size:12px;font-weight:600">${escHtml(v.voter_name)}</span>
                    <span style="font-size:10px;padding:2px 6px;border-radius:4px;margin-left:6px;
                      ${v.voter_role === 'superuser' ? 'background:var(--purple-bg,rgba(155,109,255,.12));color:var(--purple,#9b6dff)' : 'background:var(--teal-bg);color:var(--teal)'}">
                      ${v.voter_role === 'superuser' ? '⭐ Super' : '👤 User'}
                    </span>
                  </div>
                  <div style="font-size:16px;font-weight:700;color:var(--amber)">${v.score}</div>
                </div>
              `).join('')
            }
          </div>
        </details>

        <!-- Actions -->
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-outline btn-sm" data-toggle-contest="${escHtml(c.id)}" data-active="${c.is_active}">
            <i class="ti ti-${c.is_active ? 'toggle-right' : 'toggle-left'}"></i>
            ${c.is_active ? 'ปิดการโหวต' : 'เปิดการโหวต'}
          </button>
          <button class="btn btn-danger btn-sm" data-delete-contest="${escHtml(c.id)}" data-name="${escHtml(c.name)}">
            <i class="ti ti-trash"></i> ลบ
          </button>
        </div>
      `;
      wrap.appendChild(card);
    }
    // Wire buttons
    wrap.querySelectorAll('[data-toggle-contest]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.toggleContest;
        const nowActive = btn.dataset.active === 'true';
        try {
          await sbToggleContest(id, !nowActive);
          await loadContestList();
        } catch(e) { alert('เกิดข้อผิดพลาด: ' + e.message); }
      });
    });
    wrap.querySelectorAll('[data-delete-contest]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm(`ลบงานประกวด "${btn.dataset.name}" และคะแนนทั้งหมด?`)) return;
        try {
          await sbDeleteContest(btn.dataset.deleteContest);
          await loadContestList();
        } catch(e) { alert('เกิดข้อผิดพลาด: ' + e.message); }
      });
    });
  } catch(e) {
    wrap.innerHTML = `<div style="color:var(--red);font-size:13px;text-align:center;padding:16px">เกิดข้อผิดพลาด: ${escHtml(e.message)}</div>`;
  }
}

async function doCreateContest() {
  const name = document.getElementById('contestNameInput')?.value?.trim();
  const desc = document.getElementById('contestDescInput')?.value?.trim();
  if (!name) { showAlert('contestCreateAlert', 'กรุณากรอกชื่องานประกวด', 'warn'); return; }
  const btn = document.getElementById('btnCreateContest');
  btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader-2 pulsing"></i> กำลังสร้าง...';
  try {
    await sbCreateContest(name, desc);
    document.getElementById('contestNameInput').value = '';
    document.getElementById('contestDescInput').value = '';
    showAlert('contestCreateAlert', `✅ สร้างงานประกวด "${name}" สำเร็จ`, 'success');
    setTimeout(() => showAlert('contestCreateAlert', '', ''), 3000);
    await loadContestList();
  } catch(e) {
    showAlert('contestCreateAlert', 'สร้างไม่ได้: ' + e.message, 'error');
  } finally {
    btn.disabled = false; btn.innerHTML = '<i class="ti ti-plus"></i> สร้างงานประกวด';
  }
}

// ══ USER/SUPERUSER VOTE VIEW ══════════════════════════════════

let voteSelectedContest = null;
let voteSelectedScore = null;
let voteMyDoneIds = [];

function showVoteStep(id) {
  document.querySelectorAll('.vstep').forEach(s => s.style.display = 'none');
  const el = document.getElementById(id);
  if (el) { el.style.display = 'block'; el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
}

async function initVoteView() {
  const nameEl = document.getElementById('voteUserNameDisplay');
  if (nameEl) nameEl.textContent = currentUser.name + (currentUser.branch ? ' · ' + currentUser.branch : '');
  voteMyDoneIds = await sbGetMyVotedContests();
  await renderVoteContestList();
  showVoteStep('vstep-select');

  // Dual approach: Realtime subscription + Polling fallback
  // 1) Realtime (ถ้า Supabase Realtime/Replication เปิดอยู่)
  if (userVoteRealtimeChannel) { try{ db&&db.removeChannel(userVoteRealtimeChannel); }catch(_){} }
  userVoteRealtimeChannel = db.channel('contests-user-' + currentUser.id)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'contests' }, async () => {
      const selectStep = document.getElementById('vstep-select');
      if (selectStep && selectStep.style.display !== 'none') {
        await renderVoteContestList();
      }
    })
    .subscribe();

  // 2) Polling fallback — poll ทุก 3 วินาที เปรียบเทียบ active contests
  // Seed ค่าเริ่มต้นก่อน เพื่อไม่ให้ poll ครั้งแรก re-render ซ้ำ
  try {
    const _initContests = await sbGetActiveContests();
    _voteLastActiveIds = _initContests.map(c => c.id).sort().join(',');
  } catch(e) {}
  _startVotePolling();
}

function _startVotePolling() {
  _stopVotePolling();
  _votePollingTimer = setInterval(async () => {
    const selectStep = document.getElementById('vstep-select');
    if (!selectStep || selectStep.style.display === 'none') return;
    try {
      const contests = await sbGetActiveContests();
      const newIds = contests.map(c => c.id).sort().join(',');
      if (newIds !== _voteLastActiveIds) {
        _voteLastActiveIds = newIds;
        await renderVoteContestList();
      }
    } catch(e) { /* silent fail */ }
  }, 2000);
}

function _stopVotePolling() {
  if (_votePollingTimer) { clearInterval(_votePollingTimer); _votePollingTimer = null; }
  _voteLastActiveIds = '';
}

async function renderVoteContestList() {
  const wrap = document.getElementById('voteContestList');
  if (!wrap) return;
  try {
    const contests = await sbGetActiveContests();
    if (!contests.length) {
      wrap.innerHTML = `<div style="color:var(--text3);font-size:13px;text-align:center;padding:20px">
        <i class="ti ti-trophy-off" style="font-size:24px;display:block;margin-bottom:8px;opacity:.4"></i>
        ยังไม่มีงานประกวดที่เปิดรับโหวต
      </div>`;
      return;
    }
    wrap.innerHTML = '';
    contests.forEach(c => {
      const voted = voteMyDoneIds.includes(c.id);
      const item = document.createElement('div');
      item.style.cssText = `
        background:var(--bg3);border:1.5px solid ${voted ? 'var(--teal-bd)' : 'var(--border)'};
        border-radius:var(--r2);padding:14px 16px;margin-bottom:8px;cursor:${voted ? 'default' : 'pointer'};
        display:flex;align-items:center;gap:12px;transition:border-color .18s,background .18s;
        ${voted ? 'opacity:.7' : ''}
      `;
      item.innerHTML = `
        <div style="width:40px;height:40px;flex-shrink:0;border-radius:10px;
          background:${voted ? 'var(--teal-bg)' : 'var(--amber-bg)'};
          border:1px solid ${voted ? 'var(--teal-bd)' : 'var(--amber-bd)'};
          display:flex;align-items:center;justify-content:center;font-size:20px">
          ${voted ? '✅' : '🗳️'}
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:700;margin-bottom:2px">${escHtml(c.name)}</div>
          ${c.description ? `<div style="font-size:12px;color:var(--text3)">${escHtml(c.description)}</div>` : ''}
          ${voted ? '<div style="font-size:11px;color:var(--teal);margin-top:3px">✓ โหวตแล้ว</div>' : ''}
        </div>
        ${!voted ? '<i class="ti ti-chevron-right" style="color:var(--text3);font-size:16px;flex-shrink:0"></i>' : ''}
      `;
      if (!voted) {
        item.addEventListener('click', async () => { await openVoteScore(c); });
      }
      wrap.appendChild(item);
    });
  } catch(e) {
    wrap.innerHTML = `<div style="color:var(--red);font-size:13px;text-align:center;padding:16px">เกิดข้อผิดพลาด: ${escHtml(e.message)}</div>`;
  }
}

async function openVoteScore(contest) {
  voteSelectedContest = contest;
  voteSelectedScore = null;
  document.getElementById('voteContestTitle').textContent = contest.name;
  document.getElementById('voteContestDesc').textContent = contest.description || '';

  const isSuper = currentUser.role === 'superuser';
  // ดึง vote weight จาก settings (Admin ตั้งค่าได้)
  const voteSettings = await sbGetSettings();
  const userVoteScore  = parseInt(voteSettings['VoteScoreUser']  || '10');
  const superVoteScore = parseInt(voteSettings['VoteScoreSuper'] || '100');
  const max = isSuper ? superVoteScore : userVoteScore;
  // สร้าง 10 ระดับคะแนน: step=max/10 เสมอ → 10,20,...,100 (ถ้า max=100)
  const levels = 10;
  const step = Math.ceil(max / levels);
  const scoreValues = [];
  for (let i = 1; i <= levels; i++) {
    const v = Math.min(i * step, max);
    if (!scoreValues.includes(v)) scoreValues.push(v);
  }

  const label = document.getElementById('voteRangeLabel');
  if (label) label.innerHTML = isSuper
    ? `<i class="ti ti-star" style="color:var(--amber)"></i> <strong>Super User</strong>: ให้คะแนนได้ <strong>1 – ${max}</strong> คะแนน (${scoreValues.length} ระดับ)`
    : `<i class="ti ti-user" style="color:var(--teal)"></i> <strong>User</strong>: ให้คะแนนได้ <strong>1 – ${max}</strong> คะแนน (${scoreValues.length} ระดับ)`;

  const scoreDisp = document.getElementById('voteScoreDisplay');
  if (scoreDisp) scoreDisp.textContent = '-';
  const submitBtn = document.getElementById('btnSubmitVote');
  if (submitBtn) submitBtn.disabled = true;

  // Build score buttons (10 ระดับ สร้างไว้แล้วด้านบน)
  const btnsWrap = document.getElementById('voteScoreBtns');
  btnsWrap.innerHTML = '';
  btnsWrap.style.gridTemplateColumns = 'repeat(5, 1fr)';

  for (const v of scoreValues) {
    const b = document.createElement('button');
    b.className = 'score-btn';
    b.textContent = v;
    b.dataset.score = v;
    b.style.cssText = `
      padding:${isSuper ? '12px 4px' : '14px 4px'};background:var(--bg3);border:2px solid var(--border2);
      border-radius:10px;font-size:${isSuper ? '15px' : '18px'};font-weight:700;
      color:var(--text2);cursor:pointer;transition:all .15s;font-family:var(--font);
      min-height:52px;display:flex;align-items:center;justify-content:center
    `;
    b.addEventListener('click', () => {
      document.querySelectorAll('.score-btn').forEach(x => {
        x.style.background = 'var(--bg3)';
        x.style.borderColor = 'var(--border2)';
        x.style.color = 'var(--text2)';
        x.style.transform = 'scale(1)';
      });
      b.style.background = 'var(--amber-bg)';
      b.style.borderColor = 'var(--amber-bd)';
      b.style.color = 'var(--amber)';
      b.style.transform = 'scale(1.08)';
      voteSelectedScore = parseInt(v);
      if (scoreDisp) scoreDisp.textContent = v;
      if (submitBtn) submitBtn.disabled = false;
    });
    btnsWrap.appendChild(b);
  }

  showAlert('voteAlert', '', '');
  showVoteStep('vstep-score');
}

async function doSubmitVote() {
  if (!voteSelectedContest || voteSelectedScore === null) return;
  const btn = document.getElementById('btnSubmitVote');
  btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader-2 pulsing"></i> กำลังบันทึก...';
  try {
    await sbSubmitVote(voteSelectedContest.id, voteSelectedScore);
    document.getElementById('voteDoneContest').textContent = voteSelectedContest.name;
    document.getElementById('voteDoneScore').textContent = voteSelectedScore + ' คะแนน';
    document.getElementById('voteDoneInfo').textContent =
      currentUser.role === 'superuser' ? '⭐ Super User Score' : '👤 User Score';
    voteMyDoneIds.push(voteSelectedContest.id);
    showVoteStep('vstep-done');
  } catch(e) {
    showAlert('voteAlert', e.message, 'error');
    btn.disabled = false; btn.innerHTML = '<i class="ti ti-send"></i> ยืนยันคะแนน';
  }
}

function setupVoteHeader() {
  document.getElementById('mainHeader').style.display = 'flex';
  const isSuper = currentUser.role === 'superuser';
  const logoEl = document.getElementById('headerLogo');
  logoEl.className = isSuper ? 'h-logo vote-logo-super' : 'h-logo vote-logo-user';
  logoEl.style.cssText = '';
  logoEl.innerHTML = '<img src="img/logo.png" alt="logo" style="width:32px;height:32px;object-fit:contain;border-radius:6px">';
  const titleText = isSuper ? 'Super Voter' : 'โหวตให้คะแนน';
  document.getElementById('headerTitle').innerHTML =
    titleText + (isSuper ? ' <span class="super-badge"><i class="ti ti-bolt" style="font-size:10px"></i> SUPER</span>' : '');
  document.getElementById('headerSub').textContent = currentUser.name || '';
  document.getElementById('headerRight').innerHTML =
    `<button class="btn btn-outline btn-sm" id="btnVoteLogout"><i class="ti ti-logout"></i> <span>ออก</span></button>`;
  document.getElementById('btnVoteLogout')?.addEventListener('click', doLogout);
}

// Call this from doLogout() to reset vote state
function resetVoteState() {
  voteSelectedContest = null;
  voteSelectedScore = null;
  voteMyDoneIds = [];
  // Cleanup realtime channel + polling เมื่อ logout
  // FIX #3: guard db null เพื่อป้องกัน crash ถ้า logout ก่อน db init
  if (userVoteRealtimeChannel) { try{ db&&db.removeChannel(userVoteRealtimeChannel); }catch(_){} userVoteRealtimeChannel = null; }
  _stopVotePolling();
}
