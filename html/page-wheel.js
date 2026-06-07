// html/page-wheel.js — Admin: Lucky Wheel page
export const pageWheelHTML = /* html */`

<!-- ── Lucky Wheel Page ──────────────────────────────────── -->
<div class="apage" id="apage-wheel">
  <div class="card">
    <div class="card-title">
      <i class="ti ti-wheel" style="color:var(--amber)"></i> กงล้อสุ่มรางวัล
    </div>
    <div class="card-sub">ดึงรายชื่อผู้ลงทะเบียนวันนี้มาสุ่ม — animation หมุนสนุก 🎰</div>
    <div id="wheelAlert"></div>

    <!-- CP Filter row -->
    <div class="wheel-filter-row">
      <span style="font-size:12px;color:var(--text3);font-weight:500">โหมด:</span>
      <button class="wheel-filter-btn wf-active" id="wfAll" data-cp-filter="all">
        <i class="ti ti-users" style="font-size:11px"></i> ทั้งหมด
      </button>
      <div id="wfCpBtns" style="display:contents"></div>
      <button class="wheel-filter-btn" id="wfOnTime">
        <i class="ti ti-clock" style="font-size:11px"></i> ตรงเวลา
      </button>
      <div class="wheel-filter-actions">
        <button class="btn btn-outline btn-sm" id="btnWheelRefresh">
          <i class="ti ti-refresh"></i> รีเฟรช
        </button>
        <button class="btn btn-outline btn-sm" id="btnWheelMute" title="เปิด/ปิดเสียงประกาศ" style="min-width:38px;padding:6px 10px">
          <i class="ti ti-volume" id="wheelMuteIcon"></i>
        </button>
      </div>
    </div>

    <!-- Options -->
    <div class="wheel-options">
      <span class="wheel-opt-label">ตัวเลือก:</span>
      <button class="wheel-exclude-toggle" id="btnExcludeWinners">
        <i class="ti ti-user-off" style="font-size:12px"></i> ตัดผู้โชคดีออก
      </button>
    </div>

    <!-- Wheel canvas -->
    <div class="wheel-wrap">
      <div class="wheel-container">
        <canvas id="wheelCanvas" class="wheel-canvas" aria-label="กงล้อสุ่มรางวัล"></canvas>
        <div class="wheel-pointer" aria-hidden="true">▼</div>
        <button class="wheel-center-btn" id="btnSpin" disabled aria-label="หมุนกงล้อ">
          หมุน!
        </button>
      </div>
      <div class="wheel-count" id="wheelCount">กำลังโหลด...</div>
    </div>

    <div class="divider"></div>

    <!-- Winner list -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px">
      <div class="card-title" style="font-size:14px;margin-bottom:0">
        <i class="ti ti-trophy" style="color:var(--amber)"></i> ผู้โชคดี
        <span class="badge b-amber" id="winnerCountBadge" style="margin-left:4px">0</span>
      </div>
      <button class="btn btn-outline btn-sm" id="btnClearWinners">
        <i class="ti ti-trash"></i> ล้างรายการ
      </button>
    </div>
    <div id="winnerList">
      <div style="color:var(--text3);font-size:13px;text-align:center;padding:20px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--r)">
        <i class="ti ti-trophy" style="font-size:24px;display:block;margin-bottom:6px;opacity:.3"></i>
        ยังไม่มีผู้โชคดี — กดปุ่ม <strong>หมุน!</strong> เพื่อสุ่ม
      </div>
    </div>
  </div>
</div>
`;
