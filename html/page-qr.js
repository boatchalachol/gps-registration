// html/page-qr.js — Admin: QR Code management page
export const pageQrHTML = /* html */`

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
