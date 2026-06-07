// html/page-dashboard.js — Admin: Dashboard page
export const pageDashboardHTML = /* html */`

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
