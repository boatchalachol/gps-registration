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
    <div class="grid2">
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
          <option value="user">user — โหวตคะแนน 1-10</option>
          <option value="superuser">superuser — โหวตคะแนน 10-100</option>
          <option value="admin">admin — ผู้ดูแลระบบ</option>
          <option value="employee">employee — ลงทะเบียนเข้างาน</option>
        </select>
      </div>
    </div>
    <div style="display:flex;gap:10px">
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
