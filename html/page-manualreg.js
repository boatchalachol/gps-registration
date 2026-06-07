// html/page-manualreg.js — Admin: Manual registration page
export const pageManualregHTML = /* html */`

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
