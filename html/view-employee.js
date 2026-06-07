// html/view-employee.js — Employee view: Checkpoint → QR/GPS → Success
export const employeeHTML = /* html */`

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
      <button class="btn btn-outline" id="btnResetEmpFlow">
        <i class="ti ti-refresh"></i> ลงทะเบียนอีกครั้ง
      </button>
    </div>
  </div>

</div>
</div>
`;

