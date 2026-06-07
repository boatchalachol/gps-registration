// js/app.js — Entry point (all HTML inlined, no ES module imports needed)

// ── HTML Partials (inlined) ───────────────────────────────
const overlaysHTML = `

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
    <div class="h-logo" id="headerLogo"><img src="img/logo.png" alt="logo" style="width:32px;height:32px;object-fit:contain;border-radius:6px"></div>
    <div>
      <div class="h-title" id="headerTitle">CHALACHOL  GROUP</div>
      <div class="h-sub" id="headerSub">—</div>
    </div>
  </div>
  <div id="headerRight"></div>
</header>
`;
const loginHTML = `

<!-- ══ LOGIN VIEW ══════════════════════════════════════════ -->
<div class="view active" id="view-login">
  <div class="login-wrap">
    <div class="login-logo"><img src="img/logo.png" alt="CHALACHOL" style="width:120px;height:120px;object-fit:contain;border-radius:16px"></div>
    <div class="login-title">CHALACHOL  GROUP</div>
    <div class="login-sub">ลงทะเบียนเข้างาน · CHALACHOL Bangkok</div>
    <div class="card">
      <div id="loginAlert"></div>
      <div class="lockout-bar" id="lockoutBar"></div>
      <div class="field">
        <label for="loginEmpId">รหัสพนักงาน</label>
        <input type="text" id="loginEmpId" placeholder="เช่น 1234" maxlength="10"
               autocomplete="off" inputmode="numeric" autocapitalize="none" autocorrect="off"
               aria-label="รหัสพนักงาน">
      </div>
      <div class="field">
        <label for="loginPin">รหัสผ่าน (PIN)</label>
        <input type="password" id="loginPin" placeholder="••••" maxlength="8" inputmode="numeric"
               aria-label="PIN" autocomplete="current-password">
      </div>
      <button class="btn" id="btnLogin" aria-label="เข้าสู่ระบบ">
        <i class="ti ti-login"></i> <span>เข้าสู่ระบบ</span>
      </button>
    </div>
  </div>
</div>
`;
const employeeHTML = `

<!-- ══ EMPLOYEE VIEW ════════════════════════════════════════ -->
<div class="view" id="view-emp">
<div class="emp-main">

  <!-- ── Step 1: เลือก Checkpoint ────────────────────────── -->
  <div class="step active" id="estep-checkpoint">
    <div class="steps-bar">
      <div class="sdot active"></div>
      <div class="sdot"></div>
      <div class="sdot"></div>
    </div>
    <div class="emp-strip">
      <div class="emp-av"><i class="ti ti-user"></i></div>
      <div>
        <div class="emp-name" id="empNameDisplay">—</div>
        <div class="emp-meta" id="empMetaDisplay">—</div>
      </div>
    </div>
    <div class="card">
      <div class="card-title"><i class="ti ti-map-pin" style="color:var(--teal)"></i> เลือกจุดลงทะเบียน</div>
      <div class="card-sub">เลือก Checkpoint ที่ต้องการลงทะเบียนเข้างาน</div>
      <div id="cpAlert"></div>
      <div class="cp-list" id="cpList">
        <div style="color:var(--text3);font-size:13px;padding:8px;display:flex;align-items:center;gap:8px">
          <div class="spinner" style="width:18px;height:18px;border-width:2px;flex-shrink:0"></div> กำลังโหลด...
        </div>
      </div>
      <button class="btn" id="btnSelectCp" disabled aria-label="ไปขั้นตอนถัดไป">
        <i class="ti ti-arrow-right"></i> ถัดไป
      </button>
    </div>
  </div>

  <!-- ── Step 2: QR + GPS ─────────────────────────────────── -->
  <div class="step" id="estep-qr">
    <div class="steps-bar">
      <div class="sdot done"></div>
      <div class="sdot active"></div>
      <div class="sdot"></div>
    </div>
    <div class="card">
      <div class="card-title" id="qrStepTitle"><i class="ti ti-qrcode"></i> สแกน QR Code</div>
      <div class="card-sub" id="qrStepSub">สแกน QR ที่จุดลงทะเบียน</div>
      <div id="qrAlert"></div>

      <!-- QR Scan Block -->
      <div id="qrScanBlock">
        <!-- Scan mode tabs -->
        <div class="scan-tabs" id="scanTabs">
          <button class="scan-tab active" id="tabCamera" aria-label="ใช้กล้องสด">
            <i class="ti ti-camera"></i> กล้องสด
          </button>
          <button class="scan-tab" id="tabPhoto" aria-label="ถ่ายภาพ QR">
            <i class="ti ti-photo-scan"></i> ถ่ายภาพ
          </button>
          <button class="scan-tab" id="tabManual" aria-label="กรอก Token ด้วยมือ">
            <i class="ti ti-keyboard"></i> Token
          </button>
        </div>

        <!-- Camera Panel -->
        <div id="cameraPanel">
          <div class="qr-scanner-box" id="qrScannerBox">
            <video id="qrVideo" playsinline autoplay muted aria-label="กล้อง QR Scanner"></video>
            <canvas id="qrCanvas"></canvas>
            <div class="qr-overlay">
              <div style="position:relative">
                <div class="qr-finder"></div>
                <div class="qr-finder-b" style="position:absolute;inset:0"></div>
                <div class="qr-scanline"></div>
              </div>
            </div>
          </div>
          <div class="qr-scanner-status" id="scannerStatus">
            <div class="spinner" style="width:14px;height:14px;border-width:2px;flex-shrink:0"></div>
            กำลังเปิดกล้อง...
          </div>
        </div>

        <!-- Photo Panel -->
        <div id="photoPanel" style="display:none">
          <div class="photo-capture-panel">
            <input type="file" id="photoFileInput" accept="image/*" capture="environment"
                   aria-label="เลือกภาพ QR Code">
            <img id="photoPreview" class="photo-preview" alt="ตัวอย่างภาพ QR">
            <div class="photo-btn-wrap">
              <button class="btn-photo" id="btnOpenCamera" aria-label="เปิดกล้องถ่าย QR Code">
                <i class="ti ti-camera" style="font-size:20px"></i> เปิดกล้องถ่าย QR Code
              </button>
              <div class="photo-hint">
                กดปุ่มด้านบนเพื่อเปิดกล้อง → ถ่ายภาพ QR Code → ระบบจะอ่านอัตโนมัติ
              </div>
            </div>
            <div id="photoDecodeStatus"></div>
          </div>
        </div>

        <!-- Manual Token Panel -->
        <div id="manualPanel" style="display:none">
          <div class="manual-wrap">
            <div class="manual-hint">กรอก QR Token ที่แสดงบนหน้าจอ Admin</div>
            <input type="text" id="manualToken" class="manual-input"
                   placeholder="เช่น CP001-X4KR7MN2"
                   autocapitalize="characters" autocorrect="off" spellcheck="false"
                   aria-label="QR Token" maxlength="30">
            <button class="btn" id="btnApplyManualToken">
              <i class="ti ti-check"></i> ยืนยัน Token
            </button>
          </div>
        </div>

        <!-- Token Confirmed Strip -->
        <div class="qr-token-strip" id="qrTokenStrip" style="display:none">
          <i class="ti ti-circle-check" style="color:var(--teal);font-size:20px;flex-shrink:0"></i>
          <div class="qr-tok-val" id="qrTokenVal">—</div>
          <button class="qr-tok-clear" id="btnResetScan" title="ยกเลิก" aria-label="ยกเลิก Token">
            <i class="ti ti-x"></i>
          </button>
        </div>
      </div><!-- /qrScanBlock -->

      <div class="divider"></div>

      <!-- GPS Block -->
      <div id="gpsBlock">
        <div class="gps-box">
          <div class="gps-row">
            <span class="gps-lbl"><i class="ti ti-satellite" style="font-size:12px"></i> สถานะ GPS</span>
            <span class="badge b-amber" id="gpsBadge">รอ</span>
          </div>
          <div class="gps-detail" id="gpsDetail" style="display:none">
            <div class="gps-row">
              <span class="gps-lbl">Latitude</span>
              <span class="gps-val" id="gpsLat">—</span>
            </div>
            <div class="gps-row">
              <span class="gps-lbl">Longitude</span>
              <span class="gps-val" id="gpsLng">—</span>
            </div>
            <div class="gps-row">
              <span class="gps-lbl">ระยะจาก Checkpoint</span>
              <span class="gps-val" id="gpsDist">—</span>
            </div>
            <div class="gps-acc" id="gpsAcc"></div>
          </div>
        </div>
        <button class="btn btn-outline mt8" id="btnGps" aria-label="ขอพิกัด GPS">
          <i class="ti ti-antenna"></i> ขอ GPS Location
        </button>
        <div class="mt8"></div>
      </div><!-- /gpsBlock -->

      <button class="btn" id="btnConfirmReg" disabled aria-label="ยืนยันลงทะเบียน">
        <i class="ti ti-check"></i> ยืนยันลงทะเบียน
      </button>
      <button class="btn btn-outline mt8" id="btnBackToCheckpoint">
        <i class="ti ti-arrow-left"></i> กลับ
      </button>
    </div>
  </div><!-- /estep-qr -->

  <!-- ── Step 3: Success ──────────────────────────────────── -->
  <div class="step" id="estep-success">
    <div class="steps-bar">
      <div class="sdot done"></div>
      <div class="sdot done"></div>
      <div class="sdot done"></div>
    </div>
    <div class="card">
      <div class="success-ico"><i class="ti ti-check"></i></div>
      <div class="success-title">ลงทะเบียนสำเร็จ!</div>
      <div class="success-sub" id="successSub">บันทึกข้อมูลเรียบร้อยแล้ว</div>
      <div class="info-grid" id="successGrid"></div>
      <!-- แสดงเฉพาะ user ที่ลงทะเบียนเสร็จแล้วต้องไปโหวต -->
      <div id="voteRedirectBar" style="display:none">
        <div class="vote-redir-title">
          <i class="ti ti-trophy"></i> ลงทะเบียนสำเร็จ! กำลังไปหน้าโหวต...
        </div>
        <div style="height:5px;background:var(--bg3);border-radius:4px;overflow:hidden">
          <div id="voteCountdownBar" style="height:100%;width:100%;background:var(--teal);border-radius:4px;transition:width 1.8s linear"></div>
        </div>
        <div style="font-size:12px;color:var(--text3);margin-top:8px;text-align:center">จะเด้งไปอัตโนมัติใน 2 วินาที...</div>
      </div>
      <button class="btn btn-outline" id="btnResetEmpFlow" style="margin-top:16px">
        <i class="ti ti-refresh"></i> ลงทะเบียนอีกครั้ง
      </button>
    </div>
  </div>

</div>
</div>
`;
const pageQrHTML = `

<!-- ── QR Page ──────────────────────────────────────────── -->
<div class="apage active" id="apage-qr">
  <div class="card">
    <div class="card-title">
      <i class="ti ti-qrcode" style="color:var(--amber)"></i> QR Code ลงทะเบียน
    </div>
    <div class="card-sub">สร้าง QR สำหรับแต่ละ Checkpoint — กำหนดวันหมดอายุได้เอง</div>
    <div class="feature-status-bar" id="qrPageStatusBar"></div>
    <div id="qrAdminAlert"></div>

    <!-- QR Token Section (shown when QR enabled) -->
    <div id="qrTokenSection">
      <div class="expiry-banner">
        <div class="expiry-row">
          <div class="expiry-label">
            <i class="ti ti-calendar-time"></i> วันหมดอายุ QR
          </div>
          <input type="datetime-local" id="qrExpiryInput" class="expiry-input"
                 aria-label="วันหมดอายุ QR">
        </div>
        <div class="preset-btns">
          <button class="preset-btn" data-days="0">ไม่หมดอายุ</button>
          <button class="preset-btn" data-days="0.041666">1 ชั่วโมง</button>
          <button class="preset-btn" data-days="0.333333">8 ชั่วโมง</button>
          <button class="preset-btn" data-days="1">1 วัน</button>
          <button class="preset-btn" data-days="7">7 วัน</button>
          <button class="preset-btn" data-days="30">30 วัน</button>
        </div>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px">
        <p class="section-head" style="margin:0">QR Code ทุก Checkpoint</p>
        <div style="display:flex;gap:8px">
          <button class="btn btn-outline btn-sm" id="btnGenerateAllQR">
            <i class="ti ti-refresh"></i> สร้างใหม่ทั้งหมด
          </button>
          <button class="btn btn-sm btn-amber" onclick="window.print()" aria-label="พิมพ์ QR">
            <i class="ti ti-printer"></i> พิมพ์
          </button>
        </div>
      </div>

      <div class="qr-grid" id="qrGrid">
        <div style="color:var(--text3);font-size:13px;padding:12px;display:flex;align-items:center;gap:8px">
          <div class="spinner" style="width:18px;height:18px;border-width:2px;flex-shrink:0"></div>
          กำลังโหลด QR...
        </div>
      </div>
    </div>

    <!-- QR Token Off Banner (shown when QR disabled) -->
    <div id="qrTokenOff" style="display:none">
      <div class="token-off-banner">
        <i class="ti ti-qrcode-off" style="font-size:36px;margin-bottom:12px;display:block"></i>
        <p style="font-size:14px;line-height:1.6">
          <strong>QR Token ปิดอยู่</strong><br>
          เปิดได้ที่ <strong>ตั้งค่า → QR Token</strong>
        </p>
      </div>
    </div>
  </div>
</div>
`;
const pageManualregHTML = `

<!-- ── Manual Registration Page ─────────────────────────── -->
<div class="apage" id="apage-manualreg">
  <div class="card">
    <div class="card-title">
      <i class="ti ti-clipboard-check" style="color:var(--purple)"></i> ลงทะเบียนแทนพนักงาน
    </div>
    <div class="card-sub">
      Admin ลงทะเบียนแทนได้ — บายพาส QR และ GPS อัตโนมัติ พร้อมบันทึกหมายเหตุ
    </div>
    <div id="mregAlert"></div>

    <!-- Step progress bar -->
    <div class="mreg-steps-bar">
      <div class="mreg-sdot active" id="msdot1"></div>
      <div class="mreg-sdot" id="msdot2"></div>
      <div class="mreg-sdot" id="msdot3"></div>
    </div>

    <!-- Step 1: เลือกพนักงาน -->
    <div class="mreg-step active" id="mstep1">
      <div class="section-head" style="margin-top:0">
        <i class="ti ti-user-search"></i> ขั้นตอนที่ 1 — เลือกพนักงาน
      </div>
      <div class="mreg-search-box">
        <i class="ti ti-search mreg-search-ico" aria-hidden="true"></i>
        <input type="text" id="mregSearch"
               placeholder="ค้นหาชื่อ / รหัสพนักงาน / แผนก..."
               autocomplete="off" autocorrect="off" autocapitalize="off"
               aria-label="ค้นหาพนักงาน">
      </div>
      <div class="mreg-emp-list" id="mregEmpList"></div>
      <button class="btn btn-purple" id="btnMregStep2" disabled
              aria-label="ไปขั้นตอนเลือก Checkpoint">
        <i class="ti ti-arrow-right"></i> ถัดไป — เลือก Checkpoint
      </button>
    </div>

    <!-- Step 2: เลือก Checkpoint + หมายเหตุ -->
    <div class="mreg-step" id="mstep2">
      <div class="section-head" style="margin-top:0">
        <i class="ti ti-map-pin"></i> ขั้นตอนที่ 2 — เลือก Checkpoint
      </div>

      <!-- Selected employee summary -->
      <div class="mreg-summary">
        <div class="mreg-summary-row">
          <div class="mreg-summary-lbl">พนักงาน</div>
          <div class="mreg-summary-val" id="mregSelEmpName">—</div>
        </div>
        <div class="mreg-summary-row">
          <div class="mreg-summary-lbl">รหัส</div>
          <div class="mreg-summary-val" id="mregSelEmpId"
               style="font-family:var(--mono);font-size:12px">—</div>
        </div>
        <div class="mreg-summary-row">
          <div class="mreg-summary-lbl">แผนก</div>
          <div class="mreg-summary-val" id="mregSelEmpBranch"
               style="font-size:12px;color:var(--text2)">—</div>
        </div>
      </div>

      <div class="section-head"><i class="ti ti-map-pin"></i> เลือก Checkpoint</div>
      <div class="mreg-cp-grid" id="mregCpList"></div>

      <!-- Note textarea -->
      <div class="field" style="margin-bottom:14px">
        <label for="mregNote">หมายเหตุ (ไม่บังคับ)</label>
        <textarea id="mregNote"
                  placeholder="เหตุผลที่ลงทะเบียนแทน เช่น ลืมสแกน..."
                  maxlength="500"></textarea>
        <div style="font-size:10px;color:var(--text3);margin-top:4px;text-align:right">
          <span id="mregNoteCount">0</span>/500 ตัวอักษร
        </div>
      </div>

      <div style="display:flex;gap:10px">
        <button class="btn btn-outline" id="btnMregBack">
          <i class="ti ti-arrow-left"></i> กลับ
        </button>
        <button class="btn btn-purple" id="btnMregConfirm" disabled
                aria-label="ยืนยันลงทะเบียนแทน">
          <i class="ti ti-clipboard-check"></i> ยืนยันลงทะเบียน
        </button>
      </div>
    </div>

    <!-- Step 3: Success -->
    <div class="mreg-step" id="mstep3">
      <div class="mreg-success-ico"><i class="ti ti-clipboard-check"></i></div>
      <div class="success-title" style="margin-bottom:4px">ลงทะเบียนแทนสำเร็จ!</div>
      <div class="success-sub" id="mregSuccessSub">—</div>
      <div class="info-grid" id="mregSuccessGrid" style="margin-top:14px"></div>
      <div style="display:flex;gap:10px;margin-top:4px;flex-wrap:wrap">
        <button class="btn btn-outline" id="btnMregReset">
          <i class="ti ti-refresh"></i> ลงทะเบียนรายถัดไป
        </button>
        <button class="btn btn-purple btn-sm" id="btnMregGoDash">
          <i class="ti ti-chart-bar"></i> ดู Dashboard
        </button>
      </div>
    </div>
  </div>
</div>
`;
const pageWheelHTML = `

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
      <button class="btn btn-outline btn-sm" id="btnWheelRefresh">
        <i class="ti ti-refresh"></i> รีเฟรช
      </button>
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
const pageDashboardHTML = `

<!-- ── Dashboard Page ───────────────────────────────────── -->
<div class="apage" id="apage-dashboard">
  <div class="card">
    <div class="card-title">
      <i class="ti ti-chart-bar" style="color:var(--teal)"></i> Dashboard
    </div>
    <div class="card-sub">ภาพรวมการลงทะเบียนวันนี้และสะสม</div>
    <div class="feature-status-bar" id="dashStatusBar"></div>
    <div id="dashAlert"></div>

    <!-- Stats grid -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">ทั้งหมด (สะสม)</div>
        <div class="stat-num" id="statTotal">—</div>
        <div class="stat-sub">รายการทั้งหมด</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">วันนี้</div>
        <div class="stat-num" style="color:var(--teal)" id="statToday">—</div>
        <div class="stat-sub" id="statTodayDate">—</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Checkpoint เปิด</div>
        <div class="stat-num" id="statCp">—</div>
        <div class="stat-sub">จุดลงทะเบียน</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">พนักงาน Active</div>
        <div class="stat-num" id="statEmp">—</div>
        <div class="stat-sub">บัญชีที่เปิดใช้</div>
      </div>
    </div>

    <!-- Export row -->
    <div class="export-row">
      <button class="btn btn-outline btn-sm" id="btnDashRefresh">
        <i class="ti ti-refresh"></i> รีเฟรช
      </button>
      <button class="btn btn-outline btn-sm" id="btnExportCSV">
        <i class="ti ti-file-spreadsheet"></i> Export CSV วันนี้
      </button>
    </div>

    <!-- Search registrations section -->
    <div class="card-title" style="font-size:15px;margin:18px 0 12px">
      <i class="ti ti-search" style="color:var(--teal)"></i> ค้นหาพนักงานที่ลงทะเบียน
    </div>
    <div id="dashSearchBox" style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-bottom:10px">
      <input type="text" id="dashSearchName" placeholder="ค้นหาชื่อ / รหัสพนักงาน" maxlength="80"
        style="background:var(--bg3,#161b27);border:1px solid var(--border2,#2a3245);border-radius:8px;color:var(--text,#e2e8f0);padding:8px 12px;font-size:13px;font-family:var(--font);outline:none;transition:border .2s">
      <select id="dashSearchCp"
        style="background:var(--bg3,#161b27);border:1px solid var(--border2,#2a3245);border-radius:8px;color:var(--text2,#94a3b8);padding:8px 12px;font-size:13px;font-family:var(--font);outline:none">
        <option value="">— ทุก Checkpoint —</option>
      </select>
      <button class="btn btn-outline btn-sm" id="btnDashClearSearch" title="ล้างการค้นหา">
        <i class="ti ti-x"></i>
      </button>
    </div>
    <div id="dashSearchAlert"></div>
    <div class="table-wrap" id="dashSearchTableWrap" style="display:none;margin-bottom:20px">
      <div style="font-size:12px;color:var(--text3);margin-bottom:6px" id="dashSearchCount"></div>
      <table>
        <thead>
          <tr>
            <th>ชื่อพนักงาน</th>
            <th>Checkpoint</th>
            <th>เวลา</th>
            <th>ประเภท</th>
            <th id="thDistSearch" style="display:none">ระยะ (ม.)</th>
            <th style="width:60px">ลบ</th>
          </tr>
        </thead>
        <tbody id="dashSearchTable"></tbody>
      </table>
    </div>

    <!-- Recent registrations table -->
    <div class="card-title" style="font-size:15px;margin-bottom:14px">
      <i class="ti ti-list" style="color:var(--teal)"></i> รายการล่าสุด (10 รายการ)
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ชื่อพนักงาน</th>
            <th>Checkpoint</th>
            <th>เวลา</th>
            <th>ประเภท</th>
            <th id="thDist" style="display:none">ระยะ (ม.)</th>
            <th style="width:60px">ลบ</th>
          </tr>
        </thead>
        <tbody id="recentTable">
          <tr>
            <td colspan="6" style="text-align:center;color:var(--text3);padding:20px">
              ยังไม่มีข้อมูล
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
`;
const pageSettingsHTML = `

<!-- ── Settings Page ────────────────────────────────────── -->
<div class="apage" id="apage-settings">
  <div class="card">
    <div class="card-title">
      <i class="ti ti-settings" style="color:var(--amber)"></i> ตั้งค่าระบบ
    </div>
    <div class="card-sub">เปิด/ปิด QR Token และ GPS Location — แก้ไข Checkpoints</div>

    <!-- Registration flow preview -->
    <div class="flow-map">
      <div style="font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;display:flex;align-items:center;gap:6px">
        <i class="ti ti-route"></i> ขั้นตอนการลงทะเบียน (ปัจจุบัน)
      </div>
      <div class="flow-steps" id="flowPreview"></div>
    </div>

    <div id="settingsAlert"></div>

    <!-- QR Token toggle -->
    <p class="section-head"><i class="ti ti-qrcode"></i> QR Token</p>
    <div class="toggle-row">
      <div class="toggle-info">
        <div class="toggle-label">
          <i class="ti ti-qrcode" style="color:var(--amber)"></i> เปิดใช้งาน QR Token
        </div>
        <div class="toggle-sub">พนักงานต้องสแกน QR ที่จุดลงทะเบียน</div>
      </div>
      <label class="toggle">
        <input type="checkbox" id="togQR" checked aria-label="เปิด/ปิด QR Token">
        <div class="toggle-track"></div><div class="toggle-thumb"></div>
      </label>
    </div>

    <!-- GPS Location toggle -->
    <p class="section-head"><i class="ti ti-satellite"></i> GPS Location</p>
    <div class="toggle-row">
      <div class="toggle-info">
        <div class="toggle-label">
          <i class="ti ti-map-pin" style="color:var(--teal)"></i> เปิดใช้งาน GPS Location
        </div>
        <div class="toggle-sub">ระบบจะขอพิกัดจากมือถือพนักงาน</div>
      </div>
      <label class="toggle">
        <input type="checkbox" id="togLocation" aria-label="เปิด/ปิด GPS Location">
        <div class="toggle-track"></div><div class="toggle-thumb"></div>
      </label>
    </div>

    <!-- Radius Lock sub-option -->
    <div id="gpsSubOptions"
         style="padding-left:16px;border-left:2px solid var(--teal-bd);margin-bottom:16px">
      <div class="toggle-row" style="background:transparent;border-color:transparent;padding-left:0">
        <div class="toggle-info">
          <div class="toggle-label" style="font-size:13px">
            <i class="ti ti-current-location" style="color:var(--amber)"></i>
            บังคับรัศมี (Radius Lock)
          </div>
          <div class="toggle-sub">ปฏิเสธถ้าอยู่ไกลเกิน MaxRadius ที่กำหนด</div>
        </div>
        <label class="toggle">
          <input type="checkbox" id="togRadius" aria-label="เปิด/ปิด Radius Lock">
          <div class="toggle-track"></div><div class="toggle-thumb"></div>
        </label>
      </div>
    </div>

    <!-- Checkpoints list -->
    <p class="section-head"><i class="ti ti-map-pin"></i> Checkpoints</p>
    <div id="cpSettingsList"></div>
    <button class="btn btn-outline mt8" id="btnAddCheckpoint" style="margin-bottom:10px">
      <i class="ti ti-plus"></i> เพิ่ม Checkpoint ใหม่
    </button>

    <div class="divider"></div>

    <!-- ── Vote Score Settings ─────────────────────────── -->
    <p class="section-head"><i class="ti ti-trophy"></i> ตั้งค่าคะแนนโหวต</p>
    <div style="background:var(--bg3);border:1px solid var(--border2);border-radius:var(--r2);padding:16px;margin-bottom:16px">
      <div style="font-size:13px;color:var(--text2);margin-bottom:14px">กำหนดคะแนนสูงสุดที่แต่ละ Role ให้ได้ต่อการโหวต 1 ครั้ง</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <label for="voteScoreUserInput" style="font-size:12px;font-weight:600;color:var(--teal);display:flex;align-items:center;gap:6px;margin-bottom:6px">
            <i class="ti ti-user"></i> User — คะแนนสูงสุด
          </label>
          <div style="display:flex;align-items:center;gap:8px">
            <input type="number" id="voteScoreUserInput" min="1" max="100" value="10" step="1"
              style="flex:1;padding:8px 10px;background:var(--bg2);border:1.5px solid var(--border2);border-radius:8px;color:var(--text1);font-size:15px;font-weight:700;font-family:var(--mono);width:100%"
              aria-label="คะแนนสูงสุด User">
            <span style="font-size:12px;color:var(--text3);white-space:nowrap">คะแนน</span>
          </div>
          <div style="font-size:11px;color:var(--text3);margin-top:4px">ช่วงโหวต: 1 – ค่านี้ (ทีละ 1)</div>
        </div>
        <div>
          <label for="voteScoreSuperInput" style="font-size:12px;font-weight:600;color:var(--purple,#9b6dff);display:flex;align-items:center;gap:6px;margin-bottom:6px">
            <i class="ti ti-star"></i> Super User — คะแนนสูงสุด
          </label>
          <div style="display:flex;align-items:center;gap:8px">
            <input type="number" id="voteScoreSuperInput" min="1" max="1000" value="100" step="1"
              style="flex:1;padding:8px 10px;background:var(--bg2);border:1.5px solid var(--border2);border-radius:8px;color:var(--text1);font-size:15px;font-weight:700;font-family:var(--mono);width:100%"
              aria-label="คะแนนสูงสุด Super User">
            <span style="font-size:12px;color:var(--text3);white-space:nowrap">คะแนน</span>
          </div>
          <div style="font-size:11px;color:var(--text3);margin-top:4px">ช่วงโหวต: 1 – ค่านี้ (ทีละ 1)</div>
        </div>
      </div>
      <div style="margin-top:12px;padding:10px 12px;background:var(--amber-bg);border:1px solid var(--amber-bd);border-radius:8px;font-size:12px;color:var(--amber)">
        <i class="ti ti-info-circle"></i>
        ตัวอย่าง: Super User = <strong>5</strong> → ปุ่มโหวต 1, 2, 3, 4, 5 &nbsp;|&nbsp; Super User = <strong>50</strong> → ปุ่มโหวต 1–50
      </div>
    </div>

    <div class="divider"></div>

    <!-- ── Wheel On-Time Cutoff ──────────────────────────── -->
    <p class="section-head"><i class="ti ti-clock"></i> ตั้งค่ากงล้อสุ่มรางวัล</p>
    <div style="background:var(--bg3);border:1px solid var(--border2);border-radius:var(--r2);padding:16px;margin-bottom:16px">
      <label for="wheelOnTimeInput" style="font-size:12px;font-weight:600;color:var(--text2);display:flex;align-items:center;gap:6px;margin-bottom:8px">
        <i class="ti ti-clock"></i> เวลาตัดรอบ "ตรงเวลา" (HH:MM)
      </label>
      <input type="time" id="wheelOnTimeInput" value="09:00"
        style="padding:8px 10px;background:var(--bg2);border:1.5px solid var(--border2);border-radius:8px;color:var(--text1);font-size:14px;font-family:var(--mono);width:160px"
        aria-label="เวลาตัดรอบตรงเวลา">
      <div style="font-size:11px;color:var(--text3);margin-top:6px">พนักงานที่ลงทะเบียนก่อนเวลานี้จะถือว่า "ตรงเวลา" สำหรับโหมดกรองในกงล้อ</div>
    </div>

    <div class="divider"></div>

    <!-- Wheel TTS Voice Settings -->
    <p class="section-head"><i class="ti ti-volume"></i> ตั้งค่าเสียงประกาศรางวัล</p>
    <div style="background:var(--bg3);border:1px solid var(--border2);border-radius:var(--r2);padding:16px;margin-bottom:16px">
      <div style="font-size:13px;color:var(--text2);margin-bottom:12px">เลือกเสียงที่ใช้ประกาศผู้โชคดีเมื่อหมุนกงล้อ — รายการเสียงขึ้นกับระบบปฏิบัติการและเบราว์เซอร์</div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <select id="wheelVoiceSelect"
          style="flex:1;min-width:200px;padding:9px 12px;background:var(--bg2);border:1.5px solid var(--border2);border-radius:8px;color:var(--text1);font-size:13px;font-family:var(--font);outline:none;cursor:pointer"
          aria-label="เลือกเสียงประกาศ">
          <option value="">🔊 อัตโนมัติ (แนะนำ)</option>
        </select>
        <button class="btn btn-outline btn-sm" onclick="previewWheelVoice()" title="ทดสอบเสียง" style="flex-shrink:0">
          <i class="ti ti-player-play"></i> ทดสอบเสียง
        </button>
      </div>
      <div style="margin-top:10px;padding:10px 12px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;font-size:12px;color:var(--text3)">
        <i class="ti ti-info-circle"></i>
        <strong style="color:var(--text2)">เคล็ดลับ:</strong>
        Windows: Microsoft Zira / David · macOS/iOS: Siriluck (ไทย) · Android: Google ภาษาไทย
        — ถ้าไม่เห็นเสียงไทย ให้ติดตั้ง TTS Pack ภาษาไทยในระบบก่อน
      </div>
    </div>

    <div class="divider"></div>
    <button class="btn btn-amber" id="btnSaveSettings">
      <i class="ti ti-device-floppy"></i> บันทึกการตั้งค่าทั้งหมด
    </button>
  </div>
</div>
`;
const pageEmployeesHTML = `

<!-- ── Employees Page ───────────────────────────────────── -->
<div class="apage" id="apage-employees">

  <!-- Employee table card -->
  <div class="card">
    <div class="card-title">
      <i class="ti ti-users" style="color:var(--blue)"></i> จัดการพนักงาน
    </div>
    <div class="card-sub">เพิ่ม แก้ไข ลบ หรือปิดใช้งานบัญชีพนักงาน</div>
    <div id="empAlert"></div>
    <div style="display:flex;justify-content:flex-end;margin-bottom:12px">
      <button class="btn btn-sm" id="btnShowAddEmp">
        <i class="ti ti-user-plus"></i> เพิ่มพนักงาน
      </button>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>รหัส</th>
            <th>ชื่อ</th>
            <th>แผนก</th>
            <th>Role</th>
            <th>สถานะ</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody id="empTableBody">
          <tr>
            <td colspan="6" style="text-align:center;color:var(--text3);padding:20px">
              กำลังโหลด...
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Add employee form card (hidden by default) -->
  <div class="card" id="addEmpForm" style="display:none">
    <div class="card-title">
      <i class="ti ti-user-plus" style="color:var(--teal)"></i> เพิ่มพนักงานใหม่
    </div>
    <div id="addEmpAlert"></div>
    <div class="grid2" style="gap:12px">
      <div class="field">
        <label for="newEmpId">รหัสพนักงาน *</label>
        <input type="text" id="newEmpId" placeholder="เช่น 5220"
               inputmode="numeric" maxlength="10">
      </div>
      <div class="field">
        <label for="newEmpName">ชื่อ-นามสกุล *</label>
        <input type="text" id="newEmpName" placeholder="ชื่อเต็ม" maxlength="100">
      </div>
      <div class="field">
        <label for="newEmpBranch">แผนก</label>
        <input type="text" id="newEmpBranch" placeholder="เช่น ไอที, บัญชี" maxlength="60">
      </div>
      <div class="field">
        <label for="newEmpPosition">ตำแหน่ง</label>
        <input type="text" id="newEmpPosition" placeholder="เช่น สำนักงานใหญ่" maxlength="60">
      </div>
      <div class="field">
        <label for="newEmpPin">PIN (4-8 ตัวเลข) *</label>
        <input type="password" id="newEmpPin" placeholder="••••"
               maxlength="8" inputmode="numeric">
      </div>
      <div class="field">
        <label for="newEmpRole">Role</label>
        <select id="newEmpRole">
          <option value="user">user — พนักงานทั่วไป</option>
          <option value="superuser">superuser — ผู้โหวตพิเศษ</option>
          <option value="admin">admin — ผู้ดูแลระบบ</option>
          <option value="employee">employee — ลงทะเบียนเข้างาน</option>
        </select>
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-top:4px">
      <button class="btn" id="btnSaveNewEmployee">
        <i class="ti ti-check"></i> บันทึก
      </button>
      <button class="btn btn-outline" id="btnCancelAddEmp">
        <i class="ti ti-x"></i> ยกเลิก
      </button>
    </div>
  </div>

</div>
`;
const pageVotingHTML = `
<div class="apage" id="apage-voting">
  <div class="admin-main" style="max-width:940px;width:100%;padding:20px 16px">

    <!-- Create Contest Card -->
    <div class="card">
      <div class="card-title"><i class="ti ti-trophy" style="color:var(--amber)"></i> จัดการงานประกวด</div>
      <div class="card-sub">สร้างและจัดการรายการประกวด ดูผลคะแนนรวม</div>

      <div id="contestCreateForm" style="margin-bottom:16px">
        <div class="field" style="margin-bottom:10px">
          <label>ชื่องานประกวด</label>
          <input type="text" id="contestNameInput" placeholder="เช่น การประกวดร้องเพลง รอบที่ 1" maxlength="100">
        </div>
        <div class="field" style="margin-bottom:10px">
          <label>คำอธิบาย (ไม่บังคับ)</label>
          <input type="text" id="contestDescInput" placeholder="รายละเอียดเพิ่มเติม..." maxlength="200">
        </div>
        <button class="btn btn-amber" id="btnCreateContest" style="width:auto;padding:11px 22px">
          <i class="ti ti-plus"></i> สร้างงานประกวด
        </button>
      </div>
      <div id="contestCreateAlert"></div>
    </div>

    <!-- Contest List + Results Card -->
    <div class="card">
      <div class="card-title" style="justify-content:space-between">
        <span><i class="ti ti-list-check" style="color:var(--teal)"></i> รายการประกวด</span>
        <button class="btn btn-outline btn-sm" id="btnRefreshContests"><i class="ti ti-refresh"></i> รีเฟรช</button>
      </div>
      <div id="contestListWrap">
        <div style="color:var(--text3);font-size:13px;text-align:center;padding:24px">
          <i class="ti ti-loader-2 pulsing" style="font-size:24px;display:block;margin-bottom:8px"></i>
          กำลังโหลด...
        </div>
      </div>
    </div>

  </div>
</div>
`;
const pageVoteUserHTML = `
<div class="view" id="view-vote">
  <div class="emp-main" style="max-width:520px">

    <!-- Step 1: Select Contest -->
    <div class="vstep" id="vstep-select">
      <div class="card" style="text-align:center;padding:28px 20px 20px">
        <div style="width:60px;height:60px;border-radius:18px;background:var(--amber-bg);border:2px solid var(--amber-bd);display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 14px">🗳️</div>
        <div style="font-size:18px;font-weight:700;margin-bottom:4px">โหวตให้คะแนน</div>
        <div style="font-size:13px;color:var(--text2);margin-bottom:20px" id="voteUserNameDisplay"></div>
      </div>

      <div class="card">
        <div class="card-title"><i class="ti ti-trophy" style="color:var(--amber)"></i> เลือกงานประกวด</div>
        <div class="card-sub">เลือกงานที่ต้องการให้คะแนน</div>
        <div id="voteContestList">
          <div style="color:var(--text3);font-size:13px;text-align:center;padding:20px">
            <i class="ti ti-loader-2 pulsing" style="font-size:22px;display:block;margin-bottom:8px"></i>
            กำลังโหลด...
          </div>
        </div>
      </div>
    </div>

    <!-- Step 2: Score Input -->
    <div class="vstep" id="vstep-score" style="display:none">
      <div class="card">
        <button class="btn btn-outline btn-sm" id="btnVoteBack" style="width:auto;margin-bottom:16px">
          <i class="ti ti-arrow-left"></i> กลับ
        </button>
        <div class="card-title"><i class="ti ti-star" style="color:var(--amber)"></i> <span id="voteContestTitle"></span></div>
        <div class="card-sub" id="voteContestDesc"></div>

        <!-- Score range label -->
        <div id="voteRangeLabel" style="font-size:12px;color:var(--text3);margin-bottom:12px;padding:8px 12px;background:var(--bg3);border-radius:8px;border:1px solid var(--border)"></div>

        <!-- Score input -->
        <div style="margin:20px 0">
          <div style="text-align:center;margin-bottom:16px">
            <div style="font-size:52px;font-weight:800;color:var(--amber);line-height:1" id="voteScoreDisplay">-</div>
            <div style="font-size:12px;color:var(--text3);margin-top:4px">คะแนน</div>
          </div>

          <!-- Score buttons grid -->
          <div id="voteScoreBtns" style="display:grid;gap:8px"></div>
        </div>

        <div id="voteAlert" style="margin-bottom:10px"></div>
        <button class="btn" id="btnSubmitVote" disabled>
          <i class="ti ti-send"></i> ยืนยันคะแนน
        </button>
      </div>
    </div>

    <!-- Step 3: Done -->
    <div class="vstep" id="vstep-done" style="display:none">
      <div class="card" style="text-align:center;padding:36px 20px">
        <div style="font-size:64px;margin-bottom:12px">✅</div>
        <div style="font-size:20px;font-weight:700;margin-bottom:8px;color:var(--teal)">บันทึกคะแนนแล้ว!</div>
        <div style="font-size:14px;color:var(--text2);margin-bottom:6px" id="voteDoneContest"></div>
        <div style="font-size:32px;font-weight:800;color:var(--amber);margin:16px 0" id="voteDoneScore"></div>
        <div style="font-size:13px;color:var(--text3);margin-bottom:24px" id="voteDoneInfo"></div>
        <button class="btn btn-outline" id="btnVoteAnother">
          <i class="ti ti-arrow-back"></i> โหวตงานอื่น
        </button>
      </div>
    </div>

  </div>
</div>
`;

// js/app.js — Entry point

// ── 1. Build full HTML and inject into #app ────────────────
const adminViewHTML = /* html */`
<div class="view" id="view-admin">
  <div class="admin-main">
    ${pageQrHTML}
    ${pageManualregHTML}
    ${pageWheelHTML}
    ${pageDashboardHTML}
    ${pageVotingHTML}
    ${pageSettingsHTML}
    ${pageEmployeesHTML}
  </div>
</div>
`;

document.getElementById('app').innerHTML =
  overlaysHTML +
  loginHTML    +
  employeeHTML +
  pageVoteUserHTML +
  adminViewHTML;

// ── 2. Guard: check Supabase config ───────────────────────
if (!CONFIG_READY) {
  document.getElementById('view-login').innerHTML = `
    <div style="padding:40px 20px;max-width:460px;width:100%">
      <div style="background:var(--red-bg);border:2px solid var(--red-bd);
                  border-radius:var(--r2);padding:24px;text-align:center">
        <i class="ti ti-alert-triangle"
           style="font-size:36px;color:var(--red);display:block;margin-bottom:12px"></i>
        <h2 style="color:var(--red);margin-bottom:10px;font-size:16px">
          ยังไม่ได้ตั้งค่า Supabase
        </h2>
        <p style="font-size:13px;color:var(--text2);line-height:1.7">
          กรุณาแก้ไขค่าใน
          <code style="background:var(--bg3);padding:2px 6px;border-radius:4px;
                       font-family:var(--mono);font-size:12px;color:var(--amber)">
            js/utils.js
          </code>:<br><br>
          <code style="background:var(--bg3);padding:2px 6px;border-radius:4px;
                       font-family:var(--mono);font-size:12px;color:var(--amber)">
            SUPABASE_URL
          </code> — URL ของ Project<br>
          <code style="background:var(--bg3);padding:2px 6px;border-radius:4px;
                       font-family:var(--mono);font-size:12px;color:var(--amber)">
            SUPABASE_ANON
          </code> — anon/public key
        </p>
      </div>
    </div>`;
} else {
  // ── 3. Boot: init Supabase, wire listeners, then try restore session ──
  initSupabase();
  wireEventListeners();
  // Auto-restore session — ถ้ายังไม่ได้ logout จะข้ามหน้า login ทันที
  showLoading();
  _restoreSession().then(restored => {
    if(!restored) hideLoading();
  }).catch(() => hideLoading());
}

// ── 4. Event listeners ────────────────────────────────────
function wireEventListeners() {

  // Login
  document.getElementById('loginPin')
    ?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doLogin(); } });
  document.getElementById('btnLogin')
    ?.addEventListener('click', doLogin);

  // Employee flow
  document.getElementById('btnSelectCp')
    ?.addEventListener('click', doSelectCheckpoint);
  document.getElementById('btnBackToCheckpoint')
    ?.addEventListener('click', goBackToCheckpoint);
  document.getElementById('btnConfirmReg')
    ?.addEventListener('click', doRegister);
  document.getElementById('btnResetEmpFlow')
    ?.addEventListener('click', resetEmpFlow);
  document.getElementById('btnGps')
    ?.addEventListener('click', requestGPS);

  // QR scan tabs
  document.getElementById('tabCamera')
    ?.addEventListener('click', () => switchScanTab('camera'));
  document.getElementById('tabPhoto')
    ?.addEventListener('click', () => switchScanTab('photo'));
  document.getElementById('tabManual')
    ?.addEventListener('click', () => switchScanTab('manual'));

  // Photo capture
  document.getElementById('btnOpenCamera')
    ?.addEventListener('click', () => document.getElementById('photoFileInput').click());
  document.getElementById('photoFileInput')
    ?.addEventListener('change', onPhotoSelected);

  // Manual token
  document.getElementById('btnApplyManualToken')
    ?.addEventListener('click', applyManualToken);
  document.getElementById('manualToken')
    ?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); applyManualToken(); } });
  document.getElementById('btnResetScan')
    ?.addEventListener('click', resetScan);

  // Admin: QR page
  document.getElementById('btnGenerateAllQR')
    ?.addEventListener('click', generateAllQR);
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', e => setExpiryPreset(parseFloat(btn.dataset.days || '0'), e));
  });

  // Admin: Settings page
  document.getElementById('btnAddCheckpoint')
    ?.addEventListener('click', addCheckpointRow);
  document.getElementById('btnSaveSettings')
    ?.addEventListener('click', saveSettings);
  document.getElementById('togQR')
    ?.addEventListener('change', syncSettingsUI);
  document.getElementById('togLocation')
    ?.addEventListener('change', syncSettingsUI);

  // Admin: Dashboard page
  document.getElementById('btnDashRefresh')
    ?.addEventListener('click', loadDashboard);
  document.getElementById('btnExportCSV')
    ?.addEventListener('click', exportCSV);
  const dashSearchInput = document.getElementById('dashSearchName');
  if(dashSearchInput){
    dashSearchInput.addEventListener('input', () => dashSearchRegs());
    dashSearchInput.addEventListener('focus', () => dashSearchInput.style.borderColor='var(--teal)');
    dashSearchInput.addEventListener('blur',  () => dashSearchInput.style.borderColor='var(--border2)');
  }
  document.getElementById('dashSearchCp')
    ?.addEventListener('change', () => dashSearchRegs());
  document.getElementById('btnDashClearSearch')
    ?.addEventListener('click', dashClearSearch);

  // Admin: Employees page
  document.getElementById('btnShowAddEmp')
    ?.addEventListener('click', showAddEmpForm);
  document.getElementById('btnSaveNewEmployee')
    ?.addEventListener('click', saveNewEmployee);
  document.getElementById('btnCancelAddEmp')
    ?.addEventListener('click', () => document.getElementById('addEmpForm').style.display = 'none');

  // Admin: Manual reg page
  document.getElementById('mregSearch')
    ?.addEventListener('input', filterMRegEmployees);
  document.getElementById('btnMregStep2')
    ?.addEventListener('click', mregGoStep2);
  document.getElementById('btnMregBack')
    ?.addEventListener('click', mregGoStep1);
  document.getElementById('btnMregConfirm')
    ?.addEventListener('click', mregDoRegister);
  document.getElementById('btnMregReset')
    ?.addEventListener('click', mregReset);
  document.getElementById('btnMregGoDash')
    ?.addEventListener('click', () => showAdminPage('dashboard', null));
  document.getElementById('mregNote')
    ?.addEventListener('input', () => {
      const nc = document.getElementById('mregNoteCount');
      if (nc) nc.textContent = document.getElementById('mregNote').value.length;
    });

  // Admin: Wheel page
  document.getElementById('btnSpin')
    ?.addEventListener('click', spinWheel);
  document.getElementById('btnExcludeWinners')
    ?.addEventListener('click', () => {
      excludeWinners = !excludeWinners;
      document.getElementById('btnExcludeWinners').classList.toggle('active', excludeWinners);
      wheelAngle = 0;
      loadWheelData();
    });
  document.getElementById('btnWheelRefresh')
    ?.addEventListener('click', loadWheelData);
  document.getElementById('btnClearWinners')
    ?.addEventListener('click', clearWinners);
  document.getElementById('btnWheelMute')
    ?.addEventListener('click', () => {
      _wheelMuted = !_wheelMuted;
      if(_wheelMuted && window.speechSynthesis) window.speechSynthesis.cancel();
      const icon = document.getElementById('wheelMuteIcon');
      if(icon) icon.className = _wheelMuted ? 'ti ti-volume-off' : 'ti ti-volume';
      const btn = document.getElementById('btnWheelMute');
      if(btn) btn.style.color = _wheelMuted ? 'var(--red)' : '';
    });
  document.getElementById('wfAll')
    ?.addEventListener('click', () => setWheelFilter('all', 'all', document.getElementById('wfAll')));
  document.getElementById('wfOnTime')
    ?.addEventListener('click', () => setWheelFilter('ontime', 'all', document.getElementById('wfOnTime')));

  // Wheel result modal
  document.getElementById('btnCloseWheelResult')
    ?.addEventListener('click', closeWheelResult);
  document.getElementById('btnSpinAgain')
    ?.addEventListener('click', spinAgain);

  // Admin: Voting page
  document.getElementById('btnCreateContest')
    ?.addEventListener('click', doCreateContest);
  document.getElementById('btnRefreshContests')
    ?.addEventListener('click', loadContestList);

  // Vote view (user/superuser)
  document.getElementById('btnVoteBack')
    ?.addEventListener('click', () => showVoteStep('vstep-select'));
  document.getElementById('btnSubmitVote')
    ?.addEventListener('click', doSubmitVote);
  document.getElementById('btnVoteAnother')
    ?.addEventListener('click', async () => {
      voteSelectedContest = null;
      voteSelectedScore = null;
      await renderVoteContestList();
      showVoteStep('vstep-select');
    });

  // Resize: confetti canvas + wheel redraw
  window.addEventListener('resize', () => {
    const c = document.getElementById('confettiCanvas');
    if (c && c.style.display !== 'none') {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
    }
    if (document.getElementById('apage-wheel')?.classList.contains('active')) drawWheel();
  });
}

