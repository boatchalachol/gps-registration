// ══════════════════════════════════════════════════════════════
// migrate-pin-hash.js — Run ONCE from browser console (as admin)
// Hashes all existing plaintext PINs in the employees table to SHA-256.
// Usage: paste into browser console while logged in as admin, then run:
//   await migratePinHash()
// ══════════════════════════════════════════════════════════════

async function migratePinHash() {
  if (!currentUser || currentUser.role !== 'admin') {
    console.error('Must be logged in as admin');
    return;
  }
  const { data: emps, error } = await db.from('employees').select('id,pin');
  if (error) { console.error('Fetch failed:', error); return; }

  let ok = 0, skip = 0, fail = 0;
  for (const emp of emps) {
    const pin = emp.pin || '';
    // Already hashed: SHA-256 hex is exactly 64 lowercase hex chars
    if (/^[0-9a-f]{64}$/.test(pin)) { skip++; continue; }
    try {
      const hashed = await hashPin(pin);
      const { error: updErr } = await db.from('employees').update({ pin: hashed }).eq('id', emp.id);
      if (updErr) { console.error(`Failed ${emp.id}:`, updErr); fail++; }
      else ok++;
    } catch (e) { console.error(`Error ${emp.id}:`, e); fail++; }
  }
  console.log(`Migration complete — hashed: ${ok}, already hashed: ${skip}, failed: ${fail}`);
}
