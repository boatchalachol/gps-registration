// html/overlays.js — Loading overlay, Wheel result modal, Confetti canvas, Header
export const overlaysHTML = /* html */`

<!-- ── Loading Overlay ──────────────────────────────────── -->
<div class="loading-overlay" id="loadingOverlay" style="display:none">
  <div class="spinner"></div>
  <div class="loading-text" id="loadingText">กำลังดำเนินการ...</div>
</div>

<!-- ── Wheel Result Modal ────────────────────────────────── -->
<div class="wheel-result-modal" id="wheelResultModal">
  <div class="wheel-result-box">
    <span class="wheel-result-emoji" id="wrEmoji">🎉</span>
    <div class="wheel-result-label">🏆 ผู้โชคดีรอบที่ <span id="wrRound">1</span></div>
    <div class="wheel-result-name" id="wrName">—</div>
    <div class="wheel-result-meta" id="wrMeta">—</div>
    <div class="wheel-result-cp" id="wrCp">—</div>
    <div style="display:flex;gap:10px;margin-top:20px">
      <button class="btn btn-outline" id="btnCloseWheelResult"><i class="ti ti-x"></i> ปิด</button>
      <button class="btn" id="btnSpinAgain"><i class="ti ti-refresh"></i> สุ่มอีกครั้ง</button>
    </div>
  </div>
</div>
<canvas class="confetti-canvas" id="confettiCanvas" style="display:none"></canvas>

<!-- ── Header ───────────────────────────────────────────── -->
<header class="header" id="mainHeader" style="display:none">
  <div class="h-brand">
    <div class="h-logo" id="headerLogo"><i class="ti ti-map-pin"></i></div>
    <div>
      <div class="h-title" id="headerTitle">GPS Registration</div>
      <div class="h-sub" id="headerSub">—</div>
    </div>
  </div>
  <div id="headerRight"></div>
</header>
`;
