const COLORS = ["#c8102e","#157347","#d99100","#a50d27","#1f8f5b","#e07b00"];
const SNOW = ["#8ec5ff","#b5d8ff","#ffd36e","#cfe8ff"];
const EMOJI = ["🎁","🎄","⛄","🦌","⭐","🍪","🔔"];
const LIVE = !!CONFIG.API_URL;
const $ = id => document.getElementById(id);
let letters = [];

function el(tag, cls, text){ const e = document.createElement(tag); if(cls) e.className = cls; if(text !== undefined) e.textContent = text; return e; }
function toast(m){ const t = $("toast"); t.textContent = m; t.classList.add("on"); setTimeout(() => t.classList.remove("on"), 2400); }
function letterText(l){
  return "🎅 Dear Santa,\n\nI wish for: " + l.wish + "\n\nAbout me: " + l.about +
    (l.likes ? "\nFavourite things: " + l.likes : "") + (l.avoid ? "\nPlease avoid: " + l.avoid : "") + "\n\nLove, " + l.name + " 🎄";
}

function render(){
  const q = $("q").value.trim().toLowerCase();
  const shown = letters.filter(l => !q || [l.name, l.about, l.wish, l.likes].join(" ").toLowerCase().includes(q));
  $("count").textContent = letters.length;
  const list = $("list"); list.textContent = "";
  if(!shown.length){ list.appendChild(el("div", "empty", letters.length ? "No matching letters 🔍" : "No letters yet. Be the first to write to Santa! ✨")); return; }
  shown.slice().reverse().forEach((l, i) => {
    const c = el("article", "card"); c.style.setProperty("--c", COLORS[i % COLORS.length]);
    c.appendChild(el("span", "emo", EMOJI[i % EMOJI.length]));
    c.appendChild(el("h3", "", l.name));
    c.appendChild(el("p", "sal", "Dear Santa, I wish for…"));
    c.appendChild(el("p", "wish", l.wish));
    [["About", l.about], ["Likes", l.likes], ["Avoid", l.avoid]].forEach(([k, v]) => {
      if(!v) return; const p = el("p", "tag"); p.appendChild(el("b", "", k + ": ")); p.appendChild(document.createTextNode(v)); c.appendChild(p);
    });
    const row = el("div", "row");
    const cp = el("button", "mini", "📋 Copy"); cp.onclick = () => navigator.clipboard.writeText(letterText(l)).then(() => toast("Letter copied!"));
    row.append(cp); c.appendChild(row); list.appendChild(c);
  });
}

async function load(){
  if(LIVE){
    try {
      const r = await fetch(CONFIG.API_URL); const d = await r.json();
      if(d.ok){ letters = d.wishes; $("status").textContent = "🟢 Live · updates every " + CONFIG.REFRESH_SECONDS + " seconds"; }
    } catch(e){ $("status").textContent = "⚠️ Could not reach the server. Retrying…"; }
  } else {
    letters = [];
    $("status").textContent = "🧪 Add your API_URL in config.js so everyone can see each other’s wishes.";
  }
  render();
}

$("q").addEventListener("input", render);
$("event").textContent = CONFIG.EVENT_NAME;
if(CONFIG.FORM_URL) $("formlink").href = CONFIG.FORM_URL; else $("formlink").onclick = e => { e.preventDefault(); toast("Add FORM_URL in config.js"); };

if(!matchMedia("(prefers-reduced-motion: reduce)").matches){
  for(let i = 0; i < 22; i++){
    const f = el("div", "flake", "❄"); f.style.left = Math.random() * 100 + "vw"; f.style.fontSize = (12 + Math.random() * 16) + "px";
    f.style.color = SNOW[i % SNOW.length]; f.style.animationDuration = (9 + Math.random() * 10) + "s"; f.style.animationDelay = (-Math.random() * 15) + "s";
    document.body.appendChild(f);
  }
}

load();
if(LIVE) setInterval(load, CONFIG.REFRESH_SECONDS * 1000);
