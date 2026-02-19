#!/usr/bin/env node
/* Generate a tiny public-domain microgame:
   - writes GAME.md under purple-time-machine/games/YYYY-MM-DD/<slug>/
   - writes playable HTML under purple-time-machine/frontend/public/games/<slug>/index.html
   - updates purple-time-machine/catalog.json and copies into frontend/public/catalog.json

   Usage: node gen_microgame.js --count 1
*/

const fs = require('fs')
const path = require('path')

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`)
  if (i === -1) return def
  return process.argv[i + 1] ?? true
}

const COUNT = Number(arg('count', '1'))

const ROOT = '/home/lejandro/.openclaw/workspace/purple-time-machine'
const CATALOG_PATH = path.join(ROOT, 'catalog.json')
const FRONTEND_PUBLIC = path.join(ROOT, 'frontend/public')
const GAMES_DIR = path.join(ROOT, 'games')

function todayNY() {
  // good enough (server is already NY timezone)
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true })
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2))
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function htmlTemplate({ title, hint, initJs }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      html,body{margin:0;height:100%;background:#05060a;color:#eaeaea;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial}
      #wrap{height:100%;display:grid;place-items:center}
      canvas{background:linear-gradient(180deg,#0b1020,#070812);border:1px solid rgba(255,255,255,.12);border-radius:14px;touch-action:manipulation}
      #hud{position:fixed;top:10px;left:10px;right:10px;display:flex;justify-content:space-between;gap:10px;font-size:12px;opacity:.9}
      .pill{padding:8px 10px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(255,255,255,.06);backdrop-filter:blur(8px)}
      #hint{position:fixed;bottom:12px;left:0;right:0;text-align:center;font-size:12px;opacity:.7}
    </style>
  </head>
  <body>
    <div id="hud">
      <div class="pill" id="score">0</div>
      <div class="pill" id="best">best 0</div>
    </div>
    <div id="wrap"><canvas id="c" width="360" height="520"></canvas></div>
    <div id="hint">${hint}</div>
    <script>
      const canvas = document.getElementById('c');
      const ctx = canvas.getContext('2d');
      const scoreEl = document.getElementById('score');
      const bestEl = document.getElementById('best');
      const W = canvas.width, H = canvas.height;
      ${initJs}
    </script>
  </body>
</html>`
}

// ---- tiny initJs factories (keep defs compact) ----
function jsSwat({ bestKey, shape = 'bat' }) {
  return `
let items=[], misses=0, score=0, alive=true;
let best=Number(localStorage.getItem('${bestKey}')||0);
function reset(){ items=[]; misses=0; score=0; alive=true; spawn(); spawn(); }
function spawn(){
  items.push({x:Math.random()*(W-80)+40, y:H+30, vy:-(150+Math.random()*190), r:16+Math.random()*8});
}
function hit(px,py){
  if(!alive){ reset(); return; }
  for(let i=items.length-1;i>=0;i--){
    const b=items[i];
    const dx=px-b.x, dy=py-b.y;
    if(dx*dx+dy*dy < (b.r+16)*(b.r+16)){
      items.splice(i,1);
      score++;
      spawn();
      return;
    }
  }
}
window.addEventListener('pointerdown', (e)=>{
  const r=canvas.getBoundingClientRect();
  hit((e.clientX-r.left)*(W/r.width),(e.clientY-r.top)*(H/r.height));
}, {passive:true});
let last=performance.now();
function loop(t){
  const dt=Math.min(0.033,(t-last)/1000); last=t;
  if(alive){
    for(const b of items){ b.y += b.vy*dt; }
    for(let i=items.length-1;i>=0;i--){
      if(items[i].y < -40){ items.splice(i,1); misses++; spawn(); }
    }
    if(misses>=3){ alive=false; best=Math.max(best,score); localStorage.setItem('${bestKey}', String(best)); }
  }
  ctx.clearRect(0,0,W,H);
  for(const b of items){
    const core = shape==='orb' ? 'rgba(255,240,160,.9)' : 'rgba(220,220,230,.92)';
    ctx.fillStyle=core;
    ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.35)'; ctx.lineWidth=4; ctx.stroke();
    if(shape==='bat'){
      ctx.strokeStyle='rgba(255,255,255,.22)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(b.x-b.r-16,b.y); ctx.lineTo(b.x-b.r+6,b.y-10); ctx.lineTo(b.x-b.r+6,b.y+10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(b.x+b.r+16,b.y); ctx.lineTo(b.x+b.r-6,b.y-10); ctx.lineTo(b.x+b.r-6,b.y+10); ctx.stroke();
    }
  }
  scoreEl.textContent=String(score);
  bestEl.textContent='best '+best+' • misses '+misses;
  if(!alive){
    ctx.fillStyle='rgba(0,0,0,.55)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#fff'; ctx.textAlign='center';
    ctx.font='800 22px system-ui'; ctx.fillText('THREE MISSES.', W/2, H*0.42);
    ctx.font='600 14px system-ui'; ctx.fillText('Tap to try again', W/2, H*0.48);
  }
  requestAnimationFrame(loop);
}
reset(); requestAnimationFrame(loop);
`
}

function jsRhythm({ bestKey }) {
  return `
let score=0, misses=0, alive=true;
let best=Number(localStorage.getItem('${bestKey}')||0);
let t0=performance.now();
let phase=0;
let lastTap=0;
function reset(){ score=0; misses=0; alive=true; t0=performance.now(); lastTap=0; }
function isBright(p){ const d=Math.abs(p-0.5); return d < 0.12; }
function tap(){
  if(!alive){ reset(); return; }
  const now=performance.now();
  if(now-lastTap < 120) return;
  lastTap=now;
  const ok=isBright(phase);
  if(ok) score++; else misses++;
  if(misses>=3){ alive=false; best=Math.max(best,score); localStorage.setItem('${bestKey}', String(best)); }
}
window.addEventListener('pointerdown', tap, {passive:true});
function loop(t){
  const beatMs = 950 - Math.min(520, score*11);
  phase = ((t - t0) % beatMs) / beatMs;
  ctx.clearRect(0,0,W,H);
  // subtle waves
  ctx.fillStyle='rgba(40,80,150,.10)';
  for(let y=0;y<H;y+=18){ ctx.fillRect(0, y + Math.sin((y/40)+(t/900))*3, W, 1); }
  const cx=W/2, cy=H*0.52, R=120;
  const bright=isBright(phase);
  ctx.lineWidth=10;
  ctx.strokeStyle = bright ? 'rgba(255,240,160,.95)' : 'rgba(180,180,210,.25)';
  ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.stroke();
  const a = phase*Math.PI*2;
  ctx.fillStyle='rgba(255,255,255,.65)';
  ctx.beginPath(); ctx.arc(cx + Math.cos(a)*R, cy + Math.sin(a)*R, 8, 0, Math.PI*2); ctx.fill();
  scoreEl.textContent=String(score);
  bestEl.textContent='best '+best+' • off-beat '+misses;
  if(!alive){
    ctx.fillStyle='rgba(0,0,0,.55)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#fff'; ctx.textAlign='center';
    ctx.font='800 22px system-ui'; ctx.fillText('THREE MISSES.', W/2, H*0.42);
    ctx.font='600 14px system-ui'; ctx.fillText('Tap to try again', W/2, H*0.48);
  }
  requestAnimationFrame(loop);
}
reset(); requestAnimationFrame(loop);
`
}

function jsLaneSwitch({ bestKey }) {
  return `
let lane=0; // 0 left, 1 right
let score=0;
let alive=true;
let best=Number(localStorage.getItem('${bestKey}')||0);
let hazards=[];
let last=performance.now();
let lastTap=0;
function reset(){ lane=0; score=0; alive=true; hazards=[]; spawn(); spawn(); last=performance.now(); }
function spawn(){
  hazards.push({lane: Math.random()<0.5?0:1, y:-40, vy: 210+Math.random()*160, r: 16+Math.random()*8});
}
function tap(){
  if(!alive){ reset(); return; }
  const now=performance.now();
  if(now-lastTap < 90) return;
  lastTap=now;
  lane = 1-lane;
}
window.addEventListener('pointerdown', tap, {passive:true});
function loop(t){
  const dt=Math.min(0.05,(t-last)/1000); last=t;
  ctx.clearRect(0,0,W,H);
  const xL=W*0.35, xR=W*0.65;
  const px = lane===0?xL:xR;

  if(alive){
    score += dt*10;
    // ramp
    const ramp = Math.min(1.6, 1 + score*0.01);
    for(const h of hazards){ h.y += h.vy*dt*ramp; }
    // collisions
    for(const h of hazards){
      const hx = h.lane===0?xL:xR;
      if(Math.abs(h.y-(H*0.78)) < 18+h.r && Math.abs(hx-px) < 1){
        alive=false;
        best=Math.max(best, Math.floor(score));
        localStorage.setItem('${bestKey}', String(best));
      }
    }
    for(let i=hazards.length-1;i>=0;i--){
      if(hazards[i].y>H+60){ hazards.splice(i,1); spawn(); }
    }
  }

  // lanes
  ctx.strokeStyle='rgba(255,255,255,.12)'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(xL, 80); ctx.lineTo(xL, H-80); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(xR, 80); ctx.lineTo(xR, H-80); ctx.stroke();

  // player
  ctx.fillStyle='rgba(120,255,160,.9)';
  ctx.beginPath(); ctx.arc(px, H*0.78, 16, 0, Math.PI*2); ctx.fill();

  // hazards
  for(const h of hazards){
    const hx = h.lane===0?xL:xR;
    ctx.fillStyle='rgba(255,120,120,.9)';
    ctx.beginPath(); ctx.arc(hx, h.y, h.r, 0, Math.PI*2); ctx.fill();
  }

  scoreEl.textContent=String(Math.floor(score));
  bestEl.textContent='best '+best+' • tap to switch lanes';

  if(!alive){
    ctx.fillStyle='rgba(0,0,0,.55)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#fff'; ctx.textAlign='center';
    ctx.font='800 22px system-ui'; ctx.fillText('HIT.', W/2, H*0.42);
    ctx.font='600 14px system-ui'; ctx.fillText('Tap to try again', W/2, H*0.48);
  }
  requestAnimationFrame(loop);
}
reset(); requestAnimationFrame(loop);
`
}

function jsMeter({ bestKey, label = 'KEEP IT STEADY' }) {
  return `
let v=0.55;
let score=0;
let alive=true;
let best=Number(localStorage.getItem('${bestKey}')||0);
let open=0; // 0..1
let last=performance.now();
function reset(){ v=0.55; score=0; alive=true; open=0; last=performance.now(); }
function tap(){ if(!alive){ reset(); return; } open = Math.min(1, open + 0.55); }
window.addEventListener('pointerdown', tap, {passive:true});
function loop(t){
  const dt=Math.min(0.05,(t-last)/1000); last=t;
  if(alive){
    open = Math.max(0, open - 1.4*dt);
    v += (open>0 ? 0.48 : -0.34) * dt;
    v = Math.max(0, Math.min(1, v));
    const inBand = (v>0.44 && v<0.66);
    if(inBand) score += dt*12;
    if(v<=0.02 || v>=0.98){
      alive=false;
      best=Math.max(best, Math.floor(score));
      localStorage.setItem('${bestKey}', String(best));
    }
  }

  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='rgba(255,255,255,.06)';
  ctx.fillRect(60, 120, W-120, H-240);
  ctx.strokeStyle='rgba(255,255,255,.16)'; ctx.lineWidth=3;
  ctx.strokeRect(60, 120, W-120, H-240);

  // band
  const by=120, bh=H-240;
  const y1 = by + bh*(1-0.66);
  const y2 = by + bh*(1-0.44);
  ctx.fillStyle='rgba(120,255,160,.14)';
  ctx.fillRect(60, y1, W-120, y2-y1);

  // meter fill
  const fillH = bh*v;
  ctx.fillStyle='rgba(120,170,255,.55)';
  ctx.fillRect(60, by+bh-fillH, W-120, fillH);

  // label
  ctx.fillStyle='rgba(255,255,255,.65)'; ctx.textAlign='center';
  ctx.font='700 12px system-ui';
  ctx.fillText('${label}', W/2, 100);

  scoreEl.textContent=String(Math.floor(score));
  bestEl.textContent='best '+best;

  if(!alive){
    ctx.fillStyle='rgba(0,0,0,.55)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#fff'; ctx.textAlign='center';
    ctx.font='800 22px system-ui'; ctx.fillText('BROKE THE BAND.', W/2, H*0.42);
    ctx.font='600 14px system-ui'; ctx.fillText('Tap to try again', W/2, H*0.48);
  }

  requestAnimationFrame(loop);
}
reset(); requestAnimationFrame(loop);
`
}

const GAME_DEFS = [
  {
    title: 'Dracula: Bat Swat',
    row: 'classic-horror',
    source: 'Bram Stoker — Dracula (1897, public domain)',
    oneLiner: 'Tap to swat bats. Miss 3 and the night wins.',
    input: 'tap',
    hint: 'Tap / click to SWAT. Miss 3 bats and you lose.',
    build: () => {
      return {
        initJs: `
let bats=[], misses=0, score=0, alive=true;
let best=Number(localStorage.getItem('dracula_bat_best')||0);
function reset(){ bats=[]; misses=0; score=0; alive=true; spawn(); spawn(); }
function spawn(){
  bats.push({x:Math.random()*(W-80)+40, y:H+30, vy:-(140+Math.random()*160), r:18+Math.random()*6});
}
function swat(px,py){
  if(!alive){ reset(); return; }
  for(let i=bats.length-1;i>=0;i--){
    const b=bats[i];
    const dx=px-b.x, dy=py-b.y;
    if(dx*dx+dy*dy < (b.r+18)*(b.r+18)){
      bats.splice(i,1);
      score++;
      spawn();
      return;
    }
  }
}
window.addEventListener('pointerdown', (e)=>{
  const r=canvas.getBoundingClientRect();
  swat((e.clientX-r.left)*(W/r.width),(e.clientY-r.top)*(H/r.height));
}, {passive:true});
let last=performance.now();
function loop(t){
  const dt=Math.min(0.033,(t-last)/1000); last=t;
  if(alive){
    for(const b of bats){ b.y += b.vy*dt; }
    for(let i=bats.length-1;i>=0;i--){
      if(bats[i].y < -30){ bats.splice(i,1); misses++; spawn(); }
    }
    if(misses>=3){ alive=false; best=Math.max(best,score); localStorage.setItem('dracula_bat_best', String(best)); }
  }
  ctx.clearRect(0,0,W,H);
  // bats
  for(const b of bats){
    ctx.fillStyle='rgba(220,220,230,.95)';
    ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.35)'; ctx.lineWidth=4; ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.25)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(b.x-b.r-16,b.y); ctx.lineTo(b.x-b.r+6,b.y-10); ctx.lineTo(b.x-b.r+6,b.y+10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(b.x+b.r+16,b.y); ctx.lineTo(b.x+b.r-6,b.y-10); ctx.lineTo(b.x+b.r-6,b.y+10); ctx.stroke();
  }
  scoreEl.textContent=String(score);
  bestEl.textContent='best '+best+' • misses '+misses;
  if(!alive){
    ctx.fillStyle='rgba(0,0,0,.55)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#fff'; ctx.textAlign='center';
    ctx.font='800 22px system-ui'; ctx.fillText('THE NIGHT WINS.', W/2, H*0.42);
    ctx.font='600 14px system-ui'; ctx.fillText('Tap to try again', W/2, H*0.48);
  }
  requestAnimationFrame(loop);
}
reset(); requestAnimationFrame(loop);
`,
        bestKey: 'dracula_bat_best',
      }
    },
  },
  {
    title: 'Archimedes: Circle Drop',
    row: 'weird-experiments',
    source: 'Archimedes (ancient mathematics; public domain)',
    oneLiner: 'Tap to drop a dot. Land inside the circle for points.',
    input: 'tap',
    hint: 'Tap / click to DROP. Inside the circle = score. Outside = miss.',
    build: () => {
      return {
        initJs: `
let score=0, misses=0, alive=true;
let best=Number(localStorage.getItem('archimedes_best')||0);
const cx=W/2, cy=H/2, R=140;
let dot=null;
function reset(){ score=0; misses=0; alive=true; dot=null; }
function drop(px){
  if(!alive){ reset(); return; }
  const x=px;
  const inside = (x-cx)*(x-cx) <= R*R;
  dot={x, inside};
  if(inside) score++; else misses++;
  if(misses>=3){ alive=false; best=Math.max(best,score); localStorage.setItem('archimedes_best', String(best)); }
}
window.addEventListener('pointerdown', (e)=>{
  const r=canvas.getBoundingClientRect();
  drop((e.clientX-r.left)*(W/r.width));
}, {passive:true});
function loop(){
  ctx.clearRect(0,0,W,H);
  // circle
  ctx.strokeStyle='rgba(170,170,255,.55)'; ctx.lineWidth=6;
  ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.stroke();
  // dot
  if(dot){
    ctx.fillStyle=dot.inside ? 'rgba(120,255,160,.95)' : 'rgba(255,120,120,.95)';
    ctx.beginPath(); ctx.arc(dot.x, cy, 10, 0, Math.PI*2); ctx.fill();
  }
  scoreEl.textContent=String(score);
  bestEl.textContent='best '+best+' • misses '+misses;
  if(!alive){
    ctx.fillStyle='rgba(0,0,0,.55)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#fff'; ctx.textAlign='center';
    ctx.font='800 22px system-ui'; ctx.fillText('THREE MISSES.', W/2, H*0.42);
    ctx.font='600 14px system-ui'; ctx.fillText('Tap to try again', W/2, H*0.48);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
`,
        bestKey: 'archimedes_best',
      }
    },
  },
  {
    title: 'Pharaoh: Flood Gate',
    row: 'history-challenges',
    source: 'Ancient Egypt / Nile flooding (historical; public domain)',
    oneLiner: 'Hold to open the gate. Don’t overfill the field.',
    input: 'press-hold',
    hint: 'Press & hold to OPEN the gate. Fill to the line — don’t overflow.',
    build: () => {
      return {
        initJs: `
let fill=0, score=0, alive=true;
let best=Number(localStorage.getItem('pharaoh_best')||0);
let holding=false;
const target=0.72;
function reset(){ fill=0.1; score=0; alive=true; }
window.addEventListener('pointerdown', ()=>{ holding=true; }, {passive:true});
window.addEventListener('pointerup', ()=>{ holding=false; }, {passive:true});
window.addEventListener('pointercancel', ()=>{ holding=false; }, {passive:true});
let last=performance.now();
function loop(t){
  const dt=Math.min(0.033,(t-last)/1000); last=t;
  if(alive){
    fill += (holding ? 0.55 : -0.35) * dt; // one mechanic: hold changes fill rate
    fill = Math.max(0, fill);
    if(fill >= target && fill <= target+0.02){ score += dt*3; }
    if(fill > 0.92){ alive=false; best=Math.max(best, Math.floor(score*10)); localStorage.setItem('pharaoh_best', String(best)); }
  }
  ctx.clearRect(0,0,W,H);
  // field box
  const bx=70, by=90, bw=W-140, bh=H-200;
  ctx.strokeStyle='rgba(255,255,255,.18)'; ctx.lineWidth=3;
  ctx.strokeRect(bx,by,bw,bh);
  // target line
  const ty = by + bh*(1-target);
  ctx.strokeStyle='rgba(120,255,160,.65)'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(bx,ty); ctx.lineTo(bx+bw,ty); ctx.stroke();
  // water
  const wh = bh*fill;
  ctx.fillStyle='rgba(120,170,255,.55)';
  ctx.fillRect(bx, by+bh-wh, bw, wh);
  scoreEl.textContent=String(Math.floor(score*10));
  bestEl.textContent='best '+best;
  if(!alive){
    ctx.fillStyle='rgba(0,0,0,.55)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#fff'; ctx.textAlign='center';
    ctx.font='800 22px system-ui'; ctx.fillText('OVERFLOW.', W/2, H*0.42);
    ctx.font='600 14px system-ui'; ctx.fillText('Tap to try again', W/2, H*0.48);
  }
  requestAnimationFrame(loop);
}
reset(); requestAnimationFrame(loop);
` ,
        bestKey: 'pharaoh_best',
      }
    },
  },
  {
    title: 'Odyssey: Siren Signal',
    row: 'mythology',
    source: 'Homer — Odyssey (ancient epic; public domain)',
    oneLiner: 'Tap the safe beat. Tap off-beat 3 times and the sirens win.',
    input: 'tap',
    hint: 'Tap ONLY when the ring is bright. 3 off-beat taps = lose.',
    build: () => {
      return {
        initJs: `
let score=0, misses=0, alive=true;
let best=Number(localStorage.getItem('odyssey_siren_best')||0);
let t0=performance.now();
let phase=0; // 0..1
let lastTap=0;

function reset(){ score=0; misses=0; alive=true; t0=performance.now(); lastTap=0; }

function isBright(p){
  // bright window centered at 0.5
  const d=Math.abs(p-0.5);
  return d < 0.12;
}

function tap(){
  if(!alive){ reset(); return; }
  const now=performance.now();
  if(now-lastTap < 120) return; // debouncer
  lastTap=now;
  const ok=isBright(phase);
  if(ok) score++; else misses++;
  if(misses>=3){ alive=false; best=Math.max(best,score); localStorage.setItem('odyssey_siren_best', String(best)); }
}

window.addEventListener('pointerdown', tap, {passive:true});

function loop(t){
  const beatMs = 900 - Math.min(500, score*12); // speeds up slowly
  phase = ((t - t0) % beatMs) / beatMs;

  ctx.clearRect(0,0,W,H);

  // ocean backdrop
  ctx.fillStyle='rgba(40,80,150,.10)';
  for(let y=0;y<H;y+=18){
    ctx.fillRect(0, y + Math.sin((y/40)+(t/900))*3, W, 1);
  }

  // ring
  const cx=W/2, cy=H*0.52;
  const R=120;
  const bright=isBright(phase);
  ctx.lineWidth=10;
  ctx.strokeStyle = bright ? 'rgba(255,240,160,.95)' : 'rgba(180,180,210,.25)';
  ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.stroke();

  // pulse marker
  const a = phase*Math.PI*2;
  ctx.fillStyle = 'rgba(255,255,255,.65)';
  ctx.beginPath(); ctx.arc(cx + Math.cos(a)*R, cy + Math.sin(a)*R, 8, 0, Math.PI*2); ctx.fill();

  scoreEl.textContent=String(score);
  bestEl.textContent='best '+best+' • off-beat '+misses;

  if(!alive){
    ctx.fillStyle='rgba(0,0,0,.55)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#fff'; ctx.textAlign='center';
    ctx.font='800 22px system-ui'; ctx.fillText('SIRENS WIN.', W/2, H*0.42);
    ctx.font='600 14px system-ui'; ctx.fillText('Tap to try again', W/2, H*0.48);
  }

  requestAnimationFrame(loop);
}
reset(); requestAnimationFrame(loop);
`,
        bestKey: 'odyssey_siren_best',
      }
    },
  },
  {
    title: 'Monastery: Candle Keeper',
    row: 'idle-worlds',
    source: 'Medieval monastic life (historical; public domain)',
    oneLiner: 'Tap to add wax. Keep the candle lit; waste 3 taps and you lose.',
    input: 'tap',
    hint: 'Tap to add wax when the flame is LOW. 3 wasteful taps or flame-out = lose.',
    build: () => {
      return {
        initJs: `
let fuel=0.65;
let waste=0;
let alive=true;
let score=0;
let last=performance.now();
let lastTap=0;
let best=Number(localStorage.getItem('monastery_candle_best')||0);

function reset(){ fuel=0.65; waste=0; alive=true; score=0; last=performance.now(); }

function tap(){
  if(!alive){ reset(); return; }
  const now=performance.now();
  if(now-lastTap < 90) return;
  lastTap=now;
  if(fuel > 0.85){ waste++; }
  fuel = Math.min(1, fuel + 0.24);
  if(waste>=3){ alive=false; best=Math.max(best,Math.floor(score)); localStorage.setItem('monastery_candle_best', String(best)); }
}
window.addEventListener('pointerdown', tap, {passive:true});

function loop(t){
  const dt=Math.min(0.05,(t-last)/1000); last=t;
  if(alive){
    // burn rate ramps slightly with time survived
    const burn = 0.08 + Math.min(0.18, score*0.0015);
    fuel -= burn*dt;
    score += dt*10; // ~10 pts per second
    if(fuel <= 0){
      fuel = 0;
      alive=false;
      best=Math.max(best,Math.floor(score));
      localStorage.setItem('monastery_candle_best', String(best));
    }
  }

  ctx.clearRect(0,0,W,H);

  // soft vignette
  const g=ctx.createRadialGradient(W/2,H/2,40,W/2,H/2,320);
  g.addColorStop(0,'rgba(255,220,160,.10)');
  g.addColorStop(1,'rgba(0,0,0,.65)');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

  const cx=W/2;
  const baseY=H*0.80;

  // candle body
  const cw=80, ch=220;
  ctx.fillStyle='rgba(235,235,245,.85)';
  ctx.fillRect(cx-cw/2, baseY-ch, cw, ch);
  ctx.strokeStyle='rgba(0,0,0,.25)'; ctx.lineWidth=4;
  ctx.strokeRect(cx-cw/2, baseY-ch, cw, ch);

  // wax level window
  const levelH = ch * fuel;
  ctx.fillStyle='rgba(120,170,255,.20)';
  ctx.fillRect(cx-cw/2, baseY-levelH, cw, levelH);

  // flame
  const flameH = 28 + fuel*46;
  const flick = Math.sin(t/90)*3 + Math.cos(t/140)*2;
  const hot = Math.max(0, Math.min(1, (fuel-0.15)/0.85));
  ctx.fillStyle = alive ? ('rgba('+(220+35*hot)+','+(170+60*hot)+',80,.95)') : 'rgba(180,180,200,.25)';
  ctx.beginPath();
  ctx.ellipse(cx, baseY-ch-20, 18+flick, flameH/2, 0, 0, Math.PI*2);
  ctx.fill();

  // wick
  ctx.strokeStyle='rgba(0,0,0,.55)'; ctx.lineWidth=4;
  ctx.beginPath(); ctx.moveTo(cx, baseY-ch-6); ctx.lineTo(cx, baseY-ch+8); ctx.stroke();

  scoreEl.textContent=String(Math.floor(score));
  bestEl.textContent='best '+best+' • waste '+waste;

  // guidance bar
  ctx.fillStyle = fuel < 0.35 ? 'rgba(120,255,160,.35)' : 'rgba(255,255,255,.10)';
  ctx.fillRect(50, 60, (W-100)*fuel, 10);
  ctx.strokeStyle='rgba(255,255,255,.18)'; ctx.lineWidth=2;
  ctx.strokeRect(50, 60, W-100, 10);

  if(!alive){
    ctx.fillStyle='rgba(0,0,0,.55)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#fff'; ctx.textAlign='center';
    ctx.font='800 22px system-ui';
    ctx.fillText(fuel<=0 ? 'FLAME OUT.' : 'TOO MUCH WAX.', W/2, H*0.42);
    ctx.font='600 14px system-ui';
    ctx.fillText('Tap to try again', W/2, H*0.48);
  }

  requestAnimationFrame(loop);
}
reset(); requestAnimationFrame(loop);
`,
        bestKey: 'monastery_candle_best',
      }
    },
  },  // ---- extra defs (batch add) ----
  {
    title: 'Frankenstein: Spark Catch',
    row: 'classic-horror',
    source: 'Mary Shelley — Frankenstein (1818, public domain)',
    oneLiner: 'Tap to catch sparks. Miss 3 and the monster wakes.',
    input: 'tap',
    hint: 'Tap / click the sparks. Miss 3 and you lose.',
    build: () => ({ initJs: jsSwat({ bestKey: 'frankenstein_spark_best', shape: 'orb' }), bestKey: 'frankenstein_spark_best' }),
  },
  {
    title: 'Jekyll: Serum Swap',
    row: 'classic-horror',
    source: 'R. L. Stevenson — Jekyll & Hyde (1886, public domain)',
    oneLiner: 'Tap on-beat to stay yourself. Miss 3 and Hyde takes over.',
    input: 'tap',
    hint: 'Tap ONLY when the ring is bright. 3 off-beat taps = Hyde.',
    build: () => ({ initJs: jsRhythm({ bestKey: 'jekyll_serum_best' }), bestKey: 'jekyll_serum_best' }),
  },
  {
    title: 'Hyde: Alley Switch',
    row: 'classic-horror',
    source: 'R. L. Stevenson — Jekyll & Hyde (1886, public domain)',
    oneLiner: 'Tap to switch alleys. Get hit once and it’s over.',
    input: 'tap',
    hint: 'Tap to SWITCH lanes. Don’t get hit.',
    build: () => ({ initJs: jsLaneSwitch({ bestKey: 'hyde_alley_best' }), bestKey: 'hyde_alley_best' }),
  },
  {
    title: 'Poe: Raven Swat',
    row: 'classic-horror',
    source: 'Edgar Allan Poe — The Raven (1845, public domain)',
    oneLiner: 'Tap to swat shadows. Miss 3 and the refrain returns.',
    input: 'tap',
    hint: 'Tap / click the shadows. Miss 3 and you lose.',
    build: () => ({ initJs: jsSwat({ bestKey: 'poe_raven_best', shape: 'bat' }), bestKey: 'poe_raven_best' }),
  },
  {
    title: 'Usher: Crack Meter',
    row: 'classic-horror',
    source: 'Edgar Allan Poe — The Fall of the House of Usher (1839, public domain)',
    oneLiner: 'Tap to steady the house. Let the meter hit an edge and it collapses.',
    input: 'tap',
    hint: 'Tap to keep the level in the green band. Touch an edge = lose.',
    build: () => ({ initJs: jsMeter({ bestKey: 'usher_crack_best', label: 'STEADY THE HOUSE' }), bestKey: 'usher_crack_best' }),
  },
  {
    title: 'Carmilla: Moon Tap',
    row: 'classic-horror',
    source: 'Sheridan Le Fanu — Carmilla (1872, public domain)',
    oneLiner: 'Tap the safe beat. Miss 3 and the visitor stays.',
    input: 'tap',
    hint: 'Tap ONLY on the bright ring. 3 mistakes = lose.',
    build: () => ({ initJs: jsRhythm({ bestKey: 'carmilla_moon_best' }), bestKey: 'carmilla_moon_best' }),
  },
  {
    title: 'Moreau: Beast Dodge',
    row: 'classic-horror',
    source: 'H. G. Wells — The Island of Doctor Moreau (1896, public domain)',
    oneLiner: 'Tap to switch paths. One hit and the law breaks.',
    input: 'tap',
    hint: 'Tap to SWITCH lanes. Avoid the beasts.',
    build: () => ({ initJs: jsLaneSwitch({ bestKey: 'moreau_dodge_best' }), bestKey: 'moreau_dodge_best' }),
  },
  {
    title: 'Dracula: Stake Rhythm',
    row: 'classic-horror',
    source: 'Bram Stoker — Dracula (1897, public domain)',
    oneLiner: 'Tap on-beat to strike. Miss 3 and dawn never comes.',
    input: 'tap',
    hint: 'Tap ONLY when the ring is bright. 3 misses = lose.',
    build: () => ({ initJs: jsRhythm({ bestKey: 'dracula_stake_best' }), bestKey: 'dracula_stake_best' }),
  },
  {
    title: 'Mummy: Curse Switch',
    row: 'classic-horror',
    source: 'Ancient Egypt mummy folklore (public domain)',
    oneLiner: 'Tap to switch lanes. One hit and the curse sticks.',
    input: 'tap',
    hint: 'Tap to SWITCH lanes. Don’t get hit.',
    build: () => ({ initJs: jsLaneSwitch({ bestKey: 'mummy_curse_best' }), bestKey: 'mummy_curse_best' }),
  },
  {
    title: 'Invisible Man: Footstep Swat',
    row: 'classic-horror',
    source: 'H. G. Wells — The Invisible Man (1897, public domain)',
    oneLiner: 'Tap to catch the footsteps. Miss 3 and he disappears.',
    input: 'tap',
    hint: 'Tap / click the orbs. Miss 3 and you lose.',
    build: () => ({ initJs: jsSwat({ bestKey: 'invisible_footstep_best', shape: 'orb' }), bestKey: 'invisible_footstep_best' }),
  },

  {
    title: 'Orpheus: Beat Back',
    row: 'mythology',
    source: 'Greek myth of Orpheus (public domain)',
    oneLiner: 'Tap the safe beat. Miss 3 and you look back.',
    input: 'tap',
    hint: 'Tap ONLY when bright. 3 off-beat taps = lose.',
    build: () => ({ initJs: jsRhythm({ bestKey: 'orpheus_beat_best' }), bestKey: 'orpheus_beat_best' }),
  },
  {
    title: 'Medusa: Gaze Meter',
    row: 'mythology',
    source: 'Greek myth of Medusa (public domain)',
    oneLiner: 'Tap to steady your gaze. Hit an edge and you turn to stone.',
    input: 'tap',
    hint: 'Tap to keep the level in the green band. Edge = stone.',
    build: () => ({ initJs: jsMeter({ bestKey: 'medusa_gaze_best', label: 'DON\'T BLINK' }), bestKey: 'medusa_gaze_best' }),
  },
  {
    title: 'Icarus: Heat Meter',
    row: 'mythology',
    source: 'Greek myth of Icarus (public domain)',
    oneLiner: 'Tap to adjust your climb. Too high or too low and you fall.',
    input: 'tap',
    hint: 'Tap to keep the level in the green band. Touch an edge = fall.',
    build: () => ({ initJs: jsMeter({ bestKey: 'icarus_heat_best', label: 'FLY THE MIDDLE' }), bestKey: 'icarus_heat_best' }),
  },
  {
    title: 'Hercules: Hydra Swat',
    row: 'mythology',
    source: 'Greek myth of Heracles (public domain)',
    oneLiner: 'Tap to cut heads. Miss 3 and the hydra wins.',
    input: 'tap',
    hint: 'Tap / click the targets. Miss 3 and you lose.',
    build: () => ({ initJs: jsSwat({ bestKey: 'hydra_swat_best', shape: 'bat' }), bestKey: 'hydra_swat_best' }),
  },
  {
    title: 'Artemis: Moon Rhythm',
    row: 'mythology',
    source: 'Greek mythology (public domain)',
    oneLiner: 'Tap the safe beat. Miss 3 and the hunt ends.',
    input: 'tap',
    hint: 'Tap ONLY when bright. 3 mistakes = lose.',
    build: () => ({ initJs: jsRhythm({ bestKey: 'artemis_moon_best' }), bestKey: 'artemis_moon_best' }),
  },
  {
    title: 'Hermes: Courier Lanes',
    row: 'mythology',
    source: 'Greek mythology (public domain)',
    oneLiner: 'Tap to switch lanes. Deliver as long as you can without a hit.',
    input: 'tap',
    hint: 'Tap to SWITCH lanes. Don’t get hit.',
    build: () => ({ initJs: jsLaneSwitch({ bestKey: 'hermes_lane_best' }), bestKey: 'hermes_lane_best' }),
  },
  {
    title: 'Sirens: Second Chorus',
    row: 'mythology',
    source: 'Greek mythology / Odyssey sirens (public domain)',
    oneLiner: 'Tap the safe beat. Miss 3 and you steer into rocks.',
    input: 'tap',
    hint: 'Tap ONLY when bright. 3 off-beat taps = lose.',
    build: () => ({ initJs: jsRhythm({ bestKey: 'sirens_chorus_best' }), bestKey: 'sirens_chorus_best' }),
  },
  {
    title: 'Minotaur: Labyrinth Switch',
    row: 'mythology',
    source: 'Greek myth of the Minotaur (public domain)',
    oneLiner: 'Tap to switch turns. One hit and you’re trapped.',
    input: 'tap',
    hint: 'Tap to SWITCH lanes. Don’t get hit.',
    build: () => ({ initJs: jsLaneSwitch({ bestKey: 'minotaur_labyrinth_best' }), bestKey: 'minotaur_labyrinth_best' }),
  },
  {
    title: 'Zeus: Thunder Swat',
    row: 'mythology',
    source: 'Greek mythology (public domain)',
    oneLiner: 'Tap to strike the bolts. Miss 3 and the storm breaks you.',
    input: 'tap',
    hint: 'Tap / click the orbs. Miss 3 and you lose.',
    build: () => ({ initJs: jsSwat({ bestKey: 'zeus_thunder_best', shape: 'orb' }), bestKey: 'zeus_thunder_best' }),
  },
  {
    title: 'Hades: Gate Balance',
    row: 'mythology',
    source: 'Greek mythology (public domain)',
    oneLiner: 'Tap to hold the gate steady. Touch an edge and it snaps shut.',
    input: 'tap',
    hint: 'Tap to keep the level in the green band. Edge = lose.',
    build: () => ({ initJs: jsMeter({ bestKey: 'hades_gate_best', label: 'HOLD THE GATE' }), bestKey: 'hades_gate_best' }),
  },

  {
    title: 'Roman: Shield Wall',
    row: 'history-challenges',
    source: 'Roman military history (public domain)',
    oneLiner: 'Tap to keep formation steady. Touch an edge and it breaks.',
    input: 'tap',
    hint: 'Tap to keep the level in the band. Edge = formation breaks.',
    build: () => ({ initJs: jsMeter({ bestKey: 'roman_shield_best', label: 'HOLD THE LINE' }), bestKey: 'roman_shield_best' }),
  },
  {
    title: 'Viking: Raid Rhythm',
    row: 'history-challenges',
    source: 'Viking Age history (public domain)',
    oneLiner: 'Tap the safe beat. Miss 3 and the oars miss.',
    input: 'tap',
    hint: 'Tap ONLY when bright. 3 mistakes = lose.',
    build: () => ({ initJs: jsRhythm({ bestKey: 'viking_raid_best' }), bestKey: 'viking_raid_best' }),
  },
  {
    title: 'Gutenberg: Press Balance',
    row: 'history-challenges',
    source: 'Johannes Gutenberg / printing press (public domain)',
    oneLiner: 'Tap to keep pressure steady. Too high or low ruins the page.',
    input: 'tap',
    hint: 'Tap to keep the level in the green band. Edge = ruined.',
    build: () => ({ initJs: jsMeter({ bestKey: 'gutenberg_press_best', label: 'PRESSURE' }), bestKey: 'gutenberg_press_best' }),
  },
  {
    title: 'Samurai: Kata Beat',
    row: 'history-challenges',
    source: 'Samurai history (public domain)',
    oneLiner: 'Tap the safe beat. Miss 3 and your stance breaks.',
    input: 'tap',
    hint: 'Tap ONLY when bright. 3 off-beat taps = lose.',
    build: () => ({ initJs: jsRhythm({ bestKey: 'samurai_kata_best' }), bestKey: 'samurai_kata_best' }),
  },
  {
    title: 'Plague Doctor: Mask Meter',
    row: 'history-challenges',
    source: 'Medieval plague era history (public domain)',
    oneLiner: 'Tap to keep the filter steady. Touch an edge and you’re exposed.',
    input: 'tap',
    hint: 'Tap to keep the level in the band. Edge = exposed.',
    build: () => ({ initJs: jsMeter({ bestKey: 'plague_mask_best', label: 'FILTER' }), bestKey: 'plague_mask_best' }),
  },
  {
    title: 'Morse: Signal Beat',
    row: 'history-challenges',
    source: 'Samuel Morse / telegraph (public domain)',
    oneLiner: 'Tap the safe beat. Miss 3 and the message garbles.',
    input: 'tap',
    hint: 'Tap ONLY when bright. 3 mistakes = lose.',
    build: () => ({ initJs: jsRhythm({ bestKey: 'morse_signal_best' }), bestKey: 'morse_signal_best' }),
  },
  {
    title: 'Babbage: Gear Switch',
    row: 'history-challenges',
    source: 'Charles Babbage / early computing (public domain)',
    oneLiner: 'Tap to switch lanes. One hit and the machine jams.',
    input: 'tap',
    hint: 'Tap to SWITCH lanes. Don’t get hit.',
    build: () => ({ initJs: jsLaneSwitch({ bestKey: 'babbage_gear_best' }), bestKey: 'babbage_gear_best' }),
  },
  {
    title: 'Wright Bros: Lift Balance',
    row: 'history-challenges',
    source: 'Early aviation history (public domain)',
    oneLiner: 'Tap to hold lift steady. Too high or low and you stall.',
    input: 'tap',
    hint: 'Tap to keep the level in the band. Edge = stall.',
    build: () => ({ initJs: jsMeter({ bestKey: 'wright_lift_best', label: 'LIFT' }), bestKey: 'wright_lift_best' }),
  },
  {
    title: 'Titanic: Pump Balance',
    row: 'history-challenges',
    source: 'RMS Titanic (1912, historical; public domain facts)',
    oneLiner: 'Tap to keep the pump steady. Hit an edge and the water wins.',
    input: 'tap',
    hint: 'Tap to keep the level in the band. Edge = flood.',
    build: () => ({ initJs: jsMeter({ bestKey: 'titanic_pump_best', label: 'PUMP' }), bestKey: 'titanic_pump_best' }),
  },
  {
    title: 'Apollo: Guidance Lanes',
    row: 'history-challenges',
    source: 'Apollo program history (public domain facts)',
    oneLiner: 'Tap to switch lanes. One hit and you drift off-course.',
    input: 'tap',
    hint: 'Tap to SWITCH lanes. Don’t get hit.',
    build: () => ({ initJs: jsLaneSwitch({ bestKey: 'apollo_guidance_best' }), bestKey: 'apollo_guidance_best' }),
  },

  {
    title: 'Lighthouse: Lantern Keeper',
    row: 'idle-worlds',
    source: 'Maritime lighthouse life (historical; public domain)',
    oneLiner: 'Tap to keep the lantern steady. Touch an edge and the light dies.',
    input: 'tap',
    hint: 'Tap to keep the level in the green band. Edge = flame out.',
    build: () => ({ initJs: jsMeter({ bestKey: 'lighthouse_lantern_best', label: 'KEEP THE LIGHT' }), bestKey: 'lighthouse_lantern_best' }),
  },
  {
    title: 'Orchard: Water Gate',
    row: 'idle-worlds',
    source: 'Traditional irrigation (historical; public domain)',
    oneLiner: 'Tap to steady the flow. Too high or low and the crop suffers.',
    input: 'tap',
    hint: 'Tap to keep the level in the band. Edge = lose.',
    build: () => ({ initJs: jsMeter({ bestKey: 'orchard_water_best', label: 'FLOW' }), bestKey: 'orchard_water_best' }),
  },
  {
    title: 'Blacksmith: Bellows Beat',
    row: 'idle-worlds',
    source: 'Traditional blacksmithing (historical; public domain)',
    oneLiner: 'Tap the safe beat. Miss 3 and the metal cools.',
    input: 'tap',
    hint: 'Tap ONLY when bright. 3 mistakes = lose.',
    build: () => ({ initJs: jsRhythm({ bestKey: 'blacksmith_bellows_best' }), bestKey: 'blacksmith_bellows_best' }),
  },
  {
    title: 'Tavern: Mug Slide',
    row: 'idle-worlds',
    source: 'Medieval tavern life (historical; public domain)',
    oneLiner: 'Tap to switch lanes. One spill and you’re out.',
    input: 'tap',
    hint: 'Tap to SWITCH lanes. Don’t get hit.',
    build: () => ({ initJs: jsLaneSwitch({ bestKey: 'tavern_mug_best' }), bestKey: 'tavern_mug_best' }),
  },
  {
    title: 'Garden: Snail Swat',
    row: 'idle-worlds',
    source: 'Garden pests (public domain)',
    oneLiner: 'Tap to swat pests. Miss 3 and the garden is lost.',
    input: 'tap',
    hint: 'Tap / click the targets. Miss 3 and you lose.',
    build: () => ({ initJs: jsSwat({ bestKey: 'garden_snail_best', shape: 'orb' }), bestKey: 'garden_snail_best' }),
  },
  {
    title: 'Clocktower: Pendulum Beat',
    row: 'idle-worlds',
    source: 'Mechanical clocks (public domain)',
    oneLiner: 'Tap the safe beat. Miss 3 and the clock stops.',
    input: 'tap',
    hint: 'Tap ONLY when bright. 3 off-beat taps = lose.',
    build: () => ({ initJs: jsRhythm({ bestKey: 'clocktower_pendulum_best' }), bestKey: 'clocktower_pendulum_best' }),
  },
  {
    title: 'Library: Quiet Balance',
    row: 'idle-worlds',
    source: 'Monastic library life (historical; public domain)',
    oneLiner: 'Tap to keep the quiet steady. Touch an edge and you’re shushed out.',
    input: 'tap',
    hint: 'Tap to keep the level in the band. Edge = lose.',
    build: () => ({ initJs: jsMeter({ bestKey: 'library_quiet_best', label: 'QUIET' }), bestKey: 'library_quiet_best' }),
  },
  {
    title: 'Harbor: Rope Switch',
    row: 'idle-worlds',
    source: 'Dock work (historical; public domain)',
    oneLiner: 'Tap to switch lanes. One snag and the crate drops.',
    input: 'tap',
    hint: 'Tap to SWITCH lanes. Don’t get hit.',
    build: () => ({ initJs: jsLaneSwitch({ bestKey: 'harbor_rope_best' }), bestKey: 'harbor_rope_best' }),
  },
  {
    title: 'Bakery: Oven Balance',
    row: 'idle-worlds',
    source: 'Traditional baking (historical; public domain)',
    oneLiner: 'Tap to keep the heat steady. Too high or low and it burns.',
    input: 'tap',
    hint: 'Tap to keep the level in the green band. Edge = burn.',
    build: () => ({ initJs: jsMeter({ bestKey: 'bakery_oven_best', label: 'HEAT' }), bestKey: 'bakery_oven_best' }),
  },
  {
    title: 'Farm: Crow Swat',
    row: 'idle-worlds',
    source: 'Farm life (public domain)',
    oneLiner: 'Tap to swat the crows. Miss 3 and the field is raided.',
    input: 'tap',
    hint: 'Tap / click the targets. Miss 3 and you lose.',
    build: () => ({ initJs: jsSwat({ bestKey: 'farm_crow_best', shape: 'bat' }), bestKey: 'farm_crow_best' }),
  },

  {
    title: 'Newton: Apple Swat',
    row: 'weird-experiments',
    source: 'Newtonian physics lore (public domain)',
    oneLiner: 'Tap to catch the falling idea. Miss 3 and it’s gone.',
    input: 'tap',
    hint: 'Tap / click the orbs. Miss 3 and you lose.',
    build: () => ({ initJs: jsSwat({ bestKey: 'newton_apple_best', shape: 'orb' }), bestKey: 'newton_apple_best' }),
  },
  {
    title: 'Kepler: Orbit Beat',
    row: 'weird-experiments',
    source: 'Johannes Kepler (public domain)',
    oneLiner: 'Tap the safe beat. Miss 3 and the orbit wobbles out.',
    input: 'tap',
    hint: 'Tap ONLY when bright. 3 mistakes = lose.',
    build: () => ({ initJs: jsRhythm({ bestKey: 'kepler_orbit_best' }), bestKey: 'kepler_orbit_best' }),
  },
  {
    title: 'Tesla: Coil Balance',
    row: 'weird-experiments',
    source: 'Nikola Tesla / early electricity (public domain)',
    oneLiner: 'Tap to keep the coil stable. Touch an edge and it arcs out.',
    input: 'tap',
    hint: 'Tap to keep the level in the band. Edge = arc out.',
    build: () => ({ initJs: jsMeter({ bestKey: 'tesla_coil_best', label: 'STABILIZE' }), bestKey: 'tesla_coil_best' }),
  },
  {
    title: 'Euclid: Line Switch',
    row: 'weird-experiments',
    source: 'Euclid (ancient geometry; public domain)',
    oneLiner: 'Tap to switch lines. One hit and the proof collapses.',
    input: 'tap',
    hint: 'Tap to SWITCH lanes. Don’t get hit.',
    build: () => ({ initJs: jsLaneSwitch({ bestKey: 'euclid_line_best' }), bestKey: 'euclid_line_best' }),
  },
  {
    title: 'Pascal: Pressure Meter',
    row: 'weird-experiments',
    source: 'Blaise Pascal (public domain)',
    oneLiner: 'Tap to keep pressure steady. Touch an edge and it bursts.',
    input: 'tap',
    hint: 'Tap to keep the level in the band. Edge = burst.',
    build: () => ({ initJs: jsMeter({ bestKey: 'pascal_pressure_best', label: 'PRESSURE' }), bestKey: 'pascal_pressure_best' }),
  },
  {
    title: 'Faraday: Field Lanes',
    row: 'weird-experiments',
    source: 'Michael Faraday (public domain)',
    oneLiner: 'Tap to switch lanes. One hit and the field collapses.',
    input: 'tap',
    hint: 'Tap to SWITCH lanes. Don’t get hit.',
    build: () => ({ initJs: jsLaneSwitch({ bestKey: 'faraday_field_best' }), bestKey: 'faraday_field_best' }),
  },
  {
    title: 'Galileo: Pendulum Beat',
    row: 'weird-experiments',
    source: 'Galileo Galilei (public domain)',
    oneLiner: 'Tap the safe beat. Miss 3 and the swing goes wild.',
    input: 'tap',
    hint: 'Tap ONLY when bright. 3 mistakes = lose.',
    build: () => ({ initJs: jsRhythm({ bestKey: 'galileo_pendulum_best' }), bestKey: 'galileo_pendulum_best' }),
  },
  {
    title: 'Curie: Glow Balance',
    row: 'weird-experiments',
    source: 'Marie Curie / early radioactivity (public domain facts)',
    oneLiner: 'Tap to keep the glow steady. Touch an edge and it spikes.',
    input: 'tap',
    hint: 'Tap to keep the level in the band. Edge = spike.',
    build: () => ({ initJs: jsMeter({ bestKey: 'curie_glow_best', label: 'CONTAIN' }), bestKey: 'curie_glow_best' }),
  },
  {
    title: 'Fibonacci: Spiral Swat',
    row: 'weird-experiments',
    source: 'Fibonacci sequence (public domain)',
    oneLiner: 'Tap to catch the spirals. Miss 3 and the pattern breaks.',
    input: 'tap',
    hint: 'Tap / click the orbs. Miss 3 and you lose.',
    build: () => ({ initJs: jsSwat({ bestKey: 'fibonacci_spiral_best', shape: 'orb' }), bestKey: 'fibonacci_spiral_best' }),
  },
  {
    title: 'Turing: Bit Switch',
    row: 'weird-experiments',
    source: 'Early computing concepts (public domain basics)',
    oneLiner: 'Tap to switch lanes. One hit and the tape tears.',
    input: 'tap',
    hint: 'Tap to SWITCH lanes. Don’t get hit.',
    build: () => ({ initJs: jsLaneSwitch({ bestKey: 'turing_bit_best' }), bestKey: 'turing_bit_best' }),
  },
]

function normalizeInput(input) {
  // Catalog allowed values are limited; map hold to tap for now.
  if (input === 'press-hold') return 'tap'
  return input
}

function makeSpec(def, slug, playableUrl) {
  return `TITLE: ${def.title}
PUBLIC DOMAIN SOURCE: ${def.source}
CORE PLAYER ACTION: ${def.oneLiner.split('.')[0].replace(/^Tap to /,'Tap/click to ')}.
GAME LOOP: ${def.oneLiner} Score increases while you succeed; fail condition resets instantly.
WHY THIS IS FUN: Immediate feedback + micro mastery. Short runs, fast restarts.
MVP MECHANICS: One input; one fail condition; score + best; simple procedural variation (spawn/target).
VISUAL SIMPLICITY PLAN: Minimal shapes on Canvas (circles/lines/rectangles) + 2-pill HUD.
TECH BUILD PLAN: Single HTML file with Canvas 2D + pointer events. Hosted under ${playableUrl}.
RETENTION DRIVER: Best-score chasing + very short loop.
FUTURE MUTATIONS: Difficulty ramp, alternate palettes, tiny rule twists per run.
`
}

function updateCatalog(game) {
  const catalog = readJson(CATALOG_PATH)
  const row = catalog.rows.find((r) => r.id === game.row)
  if (!row) throw new Error(`Row not found: ${game.row}`)
  row.games = row.games.filter((g) => g.slug !== game.slug)
  row.games.unshift(game)
  writeJson(CATALOG_PATH, catalog)
  ensureDir(FRONTEND_PUBLIC)
  fs.copyFileSync(CATALOG_PATH, path.join(FRONTEND_PUBLIC, 'catalog.json'))
}

function existingSlugs() {
  const catalog = readJson(CATALOG_PATH)
  return new Set(catalog.rows.flatMap((r) => r.games.map((g) => g.slug)))
}

function writeGame(def) {
  const slug = slugify(def.title)
  const playableUrl = `/games/${slug}/index.html`

  const date = todayNY()
  const specDir = path.join(GAMES_DIR, date, slug)
  const pubDir = path.join(FRONTEND_PUBLIC, 'games', slug)
  ensureDir(specDir)
  ensureDir(pubDir)

  const built = def.build()
  const html = htmlTemplate({ title: def.title, hint: def.hint, initJs: built.initJs })
  fs.writeFileSync(path.join(pubDir, 'index.html'), html)
  fs.writeFileSync(path.join(specDir, 'GAME.md'), makeSpec(def, slug, playableUrl))

  updateCatalog({
    slug,
    title: def.title,
    row: def.row,
    oneLiner: def.oneLiner,
    input: normalizeInput(def.input),
    estSession: '30s-5m',
    source: def.source,
    playableUrl,
  })

  return { slug, title: def.title, row: def.row }
}

function main() {
  const used = existingSlugs()
  const candidates = GAME_DEFS.filter((d) => !used.has(slugify(d.title)))
  const created = []

  for (let i = 0; i < COUNT; i++) {
    const def = candidates.shift()
    if (!def) break
    created.push(writeGame(def))
  }

  if (created.length === 0) {
    console.log('No new game defs available (all used). Add more defs to tools/gen_microgame.js')
    return
  }

  for (const g of created) console.log(`+ ${g.title} (${g.row}) [${g.slug}]`)
}

main()
