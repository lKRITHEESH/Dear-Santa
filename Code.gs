// Secret Santa backend: stores letters in a "Wishes" tab of your Google Sheet.
// Letters can only be added by your Power Automate flow, which knows the SECRET below.
const SECRET = "CHANGE-ME-TO-A-LONG-RANDOM-TEXT";
const SHEET_NAME = "Wishes";
const HEADERS = ["timestamp", "name", "about", "wish", "likes", "avoid", "hidden", "email"];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) { sh = ss.insertSheet(SHEET_NAME); sh.appendRow(HEADERS); }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Everyone's letters (emails are never sent; rows with hidden = YES are skipped). Cached for 45 seconds for speed.
function doGet() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get("wishes");
  if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);
  const rows = sheet_().getDataRange().getValues().slice(1);
  const wishes = rows
    .filter(r => (r[1] || r[7]) && r[3] && String(r[6]).toUpperCase() !== "YES")
    .map(r => ({ name: r[1] || nameFromEmail_(String(r[7])), about: r[2], wish: r[3], likes: r[4], avoid: r[5] }));
  const out = JSON.stringify({ ok: true, wishes: wishes });
  try { cache.put("wishes", out, 45); } catch (e) {}
  return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
}

function nameFromEmail_(email) {
  return email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// A letter from Power Automate. Same email again = update that person's letter.
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const d = JSON.parse(e.postData.contents);
    if (d.secret !== SECRET) return json_({ ok: false, error: "unauthorized" });
    const clean = (v, n) => {
      const s = String(v || "").trim().slice(0, n);
      return /^[=+\-@]/.test(s) ? "'" + s : s; // stops spreadsheet formula injection
    };
    const email = clean(d.email, 100).toLowerCase();
    const name = clean(d.name, 40) || nameFromEmail_(email);
    const wish = clean(d.wish, 600);
    if (!email || !wish) return json_({ ok: false, error: "missing fields" });
    CacheService.getScriptCache().remove("wishes");
    const sh = sheet_();
    const row = [new Date(), name, clean(d.about, 400), wish, clean(d.likes, 200), clean(d.avoid, 200)];
    const data = sh.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][7]).toLowerCase() === email) {
        sh.getRange(i + 1, 1, 1, 6).setValues([row]);
        return json_({ ok: true, updated: true });
      }
    }
    sh.appendRow(row.concat(["", email]));
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
