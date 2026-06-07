// html/page-voting.js — Admin: Voting/Contest management page
export const pageVotingHTML = /* html */`
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
