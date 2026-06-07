# Security & Bug Fixes — register-main

## วิธี Deploy หลังอัปเดต

1. คัดลอก `config.js` ไปไว้ที่ server (ห้าม commit เข้า Git)
2. แก้ไขค่าใน `config.js`:
   ```js
   window.__SB_URL  = "https://xxxx.supabase.co";
   window.__SB_ANON = "eyJhbGci...";
   ```
3. ตรวจสอบว่า `config.js` อยู่ใน `.gitignore` แล้ว
4. ถ้าเคยบันทึก ElevenLabs Key ไว้แล้ว ให้บันทึกใหม่ 1 ครั้ง (key เก่าจะถูก migrate อัตโนมัติ)

---

## ✅ Critical — แก้ไขแล้ว

### SEC-01 · Supabase Credentials ไม่อยู่ใน Source Code
**ก่อน:** URL + ANON key ฝังตรงใน `utils.js`
**หลัง:** โหลดจาก `config.js` ที่อยู่นอก repository (gitignored)
**ไฟล์:** `js/utils.js`, `config.js`, `.gitignore`, `index.html`

### SEC-02 · Role ถูก Verify ฝั่ง Server ก่อน Route
**ก่อน:** `_routeUser()` ใช้ `currentUser.role` จาก localStorage โดยตรง
**หลัง:** ดึง role จาก Supabase ใหม่ทุกครั้งก่อน route — DevTools tampering ไม่มีผล
**ไฟล์:** `js/employee.js` (`_routeUser`)

### SEC-03 · ElevenLabs API Key เข้ารหัสก่อนเก็บ
**ก่อน:** `localStorage.setItem('_el_key', key)` เก็บ plaintext
**หลัง:** XOR-scramble + base64 ก่อนเก็บ — ป้องกัน trivial clipboard-read
> ⚠️ แนะนำ: ย้ายไปเก็บ server-side เป็น solution ถาวร
**ไฟล์:** `js/admin.js` (`saveElevenLabsKey`, `_loadElevenLabsSettings`, `_speakElevenLabs`)

---

## ✅ Warning — แก้ไขแล้ว

### BUG-04 · SQL Injection ใน ilike Query
**ก่อน:** `%${n}%` ใส่ค่า user ดิบโดยตรง
**หลัง:** escape `%`, `_`, `\` ก่อนใส่ใน query string
**ไฟล์:** `js/utils.js` (`sbSearchRegistrations`)

### BUG-05 · Delete Contest ไม่ตรวจ error ของ delete votes
**ก่อน:** `await db.from('votes').delete()...` โดยไม่ตรวจ error
**หลัง:** ตรวจ `votesErr` — ถ้า fail จะ throw ก่อนลบ contest
**ไฟล์:** `js/voting.js` (`sbDeleteContest`)

### BUG-03 · Lockout Bypass — เพิ่ม comment และ TODO
**สถานะ:** Client-side lockout ยังคง bypass ได้ด้วย incognito — เพิ่ม comment ระบุ
**แก้ขาด:** ต้องใช้ Supabase Edge Function rate-limit เพื่อป้องกันจริง
**ไฟล์:** `js/employee.js`

---

## ✅ Info — แก้ไขแล้ว

### INFO-04 · Vote Polling ลด API Calls
**ก่อน:** poll ทุก 2 วินาที เสมอ
**หลัง:** poll ทุก 10 วินาที + ข้าม poll เมื่อ Realtime channel active
**ไฟล์:** `js/voting.js` (`_startVotePolling`)

### INFO-01 · PIN Hashing — เพิ่ม Upgrade Path
เพิ่ม comment แนะนำการ migrate ไป bcrypt ผ่าน Edge Function
**ไฟล์:** `js/utils.js`

---

## ⚠️ ต้องทำใน Supabase Dashboard (ไม่ใช่ code)

| # | งาน | ความสำคัญ |
|---|-----|-----------|
| BUG-01 | เพิ่ม UNIQUE constraint: `UNIQUE(emp_id, cp_id, DATE(registered_at AT TIME ZONE 'Asia/Bangkok'))` ใน table `registrations` | สูง |
| BUG-02 | เปิด RLS ทุก table และตรวจสอบ Policy ว่าป้องกันครบ | สูง |
| BUG-05 (ถาวร) | เพิ่ม CASCADE DELETE บน `votes.contest_id → contests.id` | กลาง |
| INFO-02 | พิจารณาใช้ IP geolocation เป็น secondary check สำหรับ GPS spoofing | ต่ำ |
| SEC-01 (ถาวร) | Rotate Supabase ANON key ทันที เพราะ key เก่าถูก expose แล้ว | สูงมาก |
