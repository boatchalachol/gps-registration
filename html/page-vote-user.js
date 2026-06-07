// html/page-vote-user.js — User/Superuser voting view (shown instead of employee flow)
export const pageVoteUserHTML = /* html */`
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

