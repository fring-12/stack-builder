// @ts-nocheck
/*
 * Imperative canvas/board logic — a faithful port of the original single-file
 * game. Intentionally NOT typed yet (Path B "lightly wrapped"): it manipulates
 * the DOM directly by id and is driven entirely from initGame() after mount.
 * The *engine* and *content* it calls are fully typed and tested — this file is
 * the thin UI shell we'll incrementally React-ify / type later.
 */
import { COMPONENTS, PALETTE } from '@/content/components';
import { PROJECTS } from '@/content/projects';
import { SCENARIOS } from '@/content/caching/scenarios';
import { buildGraph } from '@/lib/engine/graph';

/* ---------- state ---------- */
let placed = []; // {uid, type, x, y, el, fixed}
let edges = []; // {a, b, live?}
let uidSeq = 1;
let currentProject = null;
let simIndex = 0;

let canvas, wires, canvasWrap;
const $ = (s) => document.querySelector(s);

/* =========================================================
   PROJECT SCREEN
   ========================================================= */
function renderProjects() {
  const list = $('#projectList');
  list.innerHTML = '';
  PROJECTS.forEach((p) => {
    const c = document.createElement('div');
    c.className = 'project-card';
    c.innerHTML = `<div class="pc-emoji">${p.emoji}</div>
      <h3>${p.name}</h3><p>${p.desc}</p>
      <div class="pc-diff">◆ ${p.diff}</div>`;
    c.onclick = () => startProject(p);
    list.appendChild(c);
  });
}
function startProject(p) {
  currentProject = p;
  $('#projName').textContent = `${p.emoji} ${p.name}`;
  $('#projGoal').textContent = p.goal;
  $('#projectScreen').classList.add('hidden');
  $('#gameScreen').classList.remove('hidden');
  resetBoard();
}

/* =========================================================
   PALETTE
   ========================================================= */
function renderPalette() {
  const list = $('#paletteList');
  list.innerHTML = '';
  PALETTE.forEach((type) => {
    const c = COMPONENTS[type];
    const el = document.createElement('div');
    el.className = 'pal-brick';
    el.innerHTML = `<div class="pal-swatch" style="background:linear-gradient(180deg,${c.top},${c.mid})">${c.emoji}</div>
      <div><div class="pal-name">${c.name}</div><div class="pal-sub">${c.sub}</div></div>`;
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const r = canvasWrap.getBoundingClientRect();
      spawnBrick(type, e.clientX - r.left - 56, e.clientY - r.top - 24, true, e);
    });
    list.appendChild(el);
  });
}

/* =========================================================
   BOARD / BRICKS
   ========================================================= */
function resetBoard() {
  placed = [];
  edges = [];
  canvas.innerHTML = '';
  wires.innerHTML = '';
  // auto place Users brick (fixed) on left
  spawnBrick('users', 60, 180, false);
  placed[0].fixed = true;
  placed[0].el.classList.add('fixed');
  updateEmptyHint();
  drawWires();
}

function spawnBrick(type, x, y, animate, origEvent) {
  const c = COMPONENTS[type];
  const uid = uidSeq++;
  const el = document.createElement('div');
  el.className = 'brick';
  el.style.setProperty('--bk-top', c.top);
  el.style.setProperty('--bk-mid', c.mid);
  el.style.setProperty('--bk-dark', c.dark);
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.innerHTML = `
    <div class="studs"><div class="stud"></div><div class="stud"></div><div class="stud"></div></div>
    <div class="brick-body">
      <div class="brick-emoji">${c.emoji}</div>
      <div class="brick-label">${c.name}</div>
    </div>
    <div class="nub" title="drag to connect"></div>
    <div class="del" title="delete">✕</div>`;
  canvas.appendChild(el);
  const rec = { uid, type, x, y, el, fixed: false };
  placed.push(rec);
  attachBrickHandlers(rec, origEvent);
  if (animate) {
    el.style.transform = 'scale(.4)';
    requestAnimationFrame(() => {
      el.style.transition = 'transform .18s';
      el.style.transform = 'scale(1)';
      setTimeout(() => (el.style.transition = ''), 200);
    });
  }
  updateEmptyHint();
  return rec;
}

function attachBrickHandlers(rec, origEvent) {
  const el = rec.el;
  const body = el; // whole brick draggable except nub/del
  // delete
  el.querySelector('.del').addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    deleteBrick(rec);
  });
  // connection nub
  el.querySelector('.nub').addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    e.preventDefault();
    startWire(rec, e);
  });
  // drag body
  body.addEventListener('pointerdown', (e) => {
    if (e.target.classList.contains('nub') || e.target.classList.contains('del')) return;
    if (rec.fixed) return;
    startDrag(rec, e);
  });
  // if spawned by a drag from palette, begin dragging immediately
  if (origEvent) {
    startDrag(rec, origEvent, true);
  }
}

/* ---- dragging a brick ---- */
let drag = null;
function startDrag(rec, e, fromPalette) {
  const r = canvasWrap.getBoundingClientRect();
  drag = {
    rec,
    offX: fromPalette ? 56 : e.clientX - r.left - rec.x,
    offY: fromPalette ? 24 : e.clientY - r.top - rec.y,
  };
  rec.el.classList.add('dragging');
  window.addEventListener('pointermove', onDragMove);
  window.addEventListener('pointerup', onDragUp);
}
function onDragMove(e) {
  if (!drag) return;
  const r = canvasWrap.getBoundingClientRect();
  let x = e.clientX - r.left - drag.offX;
  let y = e.clientY - r.top - drag.offY;
  x = Math.max(0, Math.min(x, r.width - 112));
  y = Math.max(0, Math.min(y, r.height - 96));
  drag.rec.x = x;
  drag.rec.y = y;
  drag.rec.el.style.left = x + 'px';
  drag.rec.el.style.top = y + 'px';
  drawWires();
}
function onDragUp() {
  if (drag) drag.rec.el.classList.remove('dragging');
  drag = null;
  window.removeEventListener('pointermove', onDragMove);
  window.removeEventListener('pointerup', onDragUp);
}

function deleteBrick(rec) {
  if (rec.fixed) return;
  edges = edges.filter((e) => e.a !== rec.uid && e.b !== rec.uid);
  placed = placed.filter((p) => p !== rec);
  rec.el.remove();
  drawWires();
  updateEmptyHint();
}

/* ---- drawing wires between bricks ---- */
let wireDraw = null;
function startWire(rec, e) {
  wireDraw = { from: rec };
  window.addEventListener('pointermove', onWireMove);
  window.addEventListener('pointerup', onWireUp);
}
function brickCenter(rec) {
  return { x: rec.x + 56, y: rec.y + 54 };
}
function onWireMove(e) {
  if (!wireDraw) return;
  const r = canvasWrap.getBoundingClientRect();
  drawWires({ x: e.clientX - r.left, y: e.clientY - r.top });
}
function onWireUp(e) {
  if (!wireDraw) {
    return;
  }
  const r = canvasWrap.getBoundingClientRect();
  const mx = e.clientX - r.left,
    my = e.clientY - r.top;
  // find a brick under the cursor (other than source)
  let target = null;
  for (const p of placed) {
    if (p === wireDraw.from) continue;
    if (mx >= p.x && mx <= p.x + 112 && my >= p.y && my <= p.y + 110) {
      target = p;
      break;
    }
  }
  if (target) {
    addEdge(wireDraw.from.uid, target.uid);
  }
  wireDraw = null;
  window.removeEventListener('pointermove', onWireMove);
  window.removeEventListener('pointerup', onWireUp);
  drawWires();
}
function addEdge(a, b) {
  if (a === b) return;
  if (edges.some((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a))) {
    toast('Already connected');
    return;
  }
  edges.push({ a, b });
  toast('Connected 🔗');
}

function recByUid(uid) {
  return placed.find((p) => p.uid === uid);
}

function drawWires(tempTo) {
  let svg = '';
  edges.forEach((e) => {
    const A = recByUid(e.a),
      B = recByUid(e.b);
    if (!A || !B) return;
    const a = brickCenter(A),
      b = brickCenter(B);
    const mx = (a.x + b.x) / 2;
    svg += `<path class="wire ${e.live ? 'live' : ''}" d="M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}"/>`;
    if (e.live) {
      svg += `<circle class="flow" r="5"><animateMotion dur="1s" repeatCount="indefinite"
        path="M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}"/></circle>`;
    }
  });
  if (wireDraw && tempTo) {
    const a = brickCenter(wireDraw.from);
    svg += `<path class="wire live" stroke-dasharray="7 6" d="M${a.x},${a.y} L${tempTo.x},${tempTo.y}"/>`;
  }
  wires.innerHTML = svg;
}
function updateEmptyHint() {
  $('#emptyHint').style.display = placed.length <= 1 ? 'block' : 'none';
}

/* =========================================================
   SIMULATION
   ========================================================= */
function highlightReset() {
  placed.forEach((p) => p.el.classList.remove('glow-good', 'glow-bad', 'pulse'));
  edges.forEach((e) => (e.live = false));
}
function runSimulation() {
  simIndex = 0;
  const bar = $('#simBar');
  bar.classList.remove('hidden', 'min');
  $('#simMin').textContent = '–';
  // reset panel to default centered position each run
  bar.style.left = '50%';
  bar.style.top = '60px';
  bar.style.transform = 'translateX(-50%)';
  $('#startBtn').disabled = true;
  toast('Tip: drag or minimise this panel to edit your board while testing 🧱');
  nextWave();
}
function nextWave() {
  highlightReset();
  const g = buildGraph(placed, edges);
  const sc = SCENARIOS[simIndex];
  const res = sc.check(g);

  $('#simWave').textContent = sc.wave;
  $('#simTitle').textContent = sc.title;
  $('#simDesc').textContent = sc.desc;
  $('#simVerdict').textContent = '';
  $('#simHint').textContent = '';
  $('#simActions').innerHTML = '';
  $('#simMeter').style.width = '0';
  $('#simUsers').textContent = '0 users';

  // animate traffic flowing through linked edges
  edges.forEach((e) => {
    const A = recByUid(e.a),
      B = recByUid(e.b);
    if (A && B && g.reachable.has(e.a) && g.reachable.has(e.b)) e.live = true;
  });
  drawWires();
  placed.forEach((p) => {
    if (g.reachable.has(p.uid)) {
      p.el.classList.add('pulse');
    }
  });

  // count-up users
  let t = 0;
  const steps = 22;
  const timer = setInterval(() => {
    t++;
    const frac = t / steps;
    $('#simMeter').style.width = frac * 100 + '%';
    $('#simUsers').textContent = Math.floor(frac * sc.users).toLocaleString() + ' users';
    if (t >= steps) {
      clearInterval(timer);
      revealVerdict(sc, res, g);
    }
  }, 45);
}
function revealVerdict(sc, res, g) {
  edges.forEach((e) => (e.live = false));
  drawWires();
  if (res.pass) {
    // glow the components doing the work
    placed.forEach((p) => {
      if (g.reachable.has(p.uid)) p.el.classList.add('glow-good');
    });
    $('#simVerdict').innerHTML = `<span style="color:var(--good)">✓ Survived ${sc.users.toLocaleString()} users!</span>`;
    const hintEl = $('#simHint');
    hintEl.style.color = 'var(--muted)';
    hintEl.textContent = res.explainPass || '';
    confettiBurst(18);
    if (simIndex >= SCENARIOS.length - 1) {
      setTimeout(winGame, 700);
    } else {
      const b = document.createElement('button');
      b.className = 'btn btn-sm btn-next';
      b.textContent = 'Next Wave →';
      b.onclick = () => {
        simIndex++;
        nextWave();
      };
      $('#simActions').appendChild(b);
    }
  } else {
    // glow bad: the users + anything present, and show what's missing
    const miss = res.need.filter((t) => !g.linked(t));
    placed.forEach((p) => {
      p.el.classList.add(p.type === 'users' ? 'glow-bad' : '');
    });
    $('#simVerdict').innerHTML = `<span style="color:var(--bad)">✗ System overloaded at ${sc.users.toLocaleString()} users</span>`;
    $('#simHint').style.color = 'var(--warn)';
    $('#simHint').textContent = res.hint;
    highlightMissingInPalette(miss);
    const b = document.createElement('button');
    b.className = 'btn btn-sm btn-fix';
    b.textContent = '← Back to Building';
    b.onclick = closeSim;
    $('#simActions').appendChild(b);
    const r = document.createElement('button');
    r.className = 'btn btn-sm btn-next';
    r.textContent = 'Retry Wave';
    r.onclick = () => nextWave();
    $('#simActions').appendChild(r);
  }
}
function highlightMissingInPalette(types) {
  // flash matching palette items
  document.querySelectorAll('.pal-brick').forEach((el, i) => {
    const type = PALETTE[i];
    if (types.includes(type)) {
      el.style.transition = 'box-shadow .2s';
      el.style.boxShadow = '0 0 0 2px var(--warn),0 0 16px var(--warn)';
      setTimeout(() => (el.style.boxShadow = ''), 1600);
    }
  });
}
function closeSim() {
  $('#simBar').classList.add('hidden');
  $('#startBtn').disabled = false;
  highlightReset();
  drawWires();
}
function winGame() {
  $('#simBar').classList.add('hidden');
  $('#winText').textContent = `You scaled ${currentProject.name} from 50 to 1,000,000 users and survived every wave. ${currentProject.goal}`;
  $('#winScreen').classList.remove('hidden');
  confettiBurst(80);
}

/* =========================================================
   FX
   ========================================================= */
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), msg.length > 40 ? 2600 : 1100);
}
function confettiBurst(n) {
  const colors = ['#6c7bff', '#43e59b', '#ffcf4d', '#ff5c72', '#6fe6e0'];
  for (let i = 0; i < n; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = 2 + Math.random() * 1.8 + 's';
    c.style.animationDelay = Math.random() * 0.3 + 's';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 4200);
  }
}

/* =========================================================
   INIT — called once from the React client component after mount
   ========================================================= */
let started = false;
export function initGame() {
  if (started) return; // guard against React StrictMode double-invoke in dev
  started = true;

  canvas = $('#canvas');
  wires = $('#wires');
  canvasWrap = $('#canvasWrap');

  /* ---- buttons ---- */
  $('#startBtn').onclick = () => {
    if (placed.length <= 1) {
      toast('Build something first! 🧱');
      return;
    }
    runSimulation();
  };
  $('#backBtn').onclick = () => {
    $('#gameScreen').classList.add('hidden');
    $('#projectScreen').classList.remove('hidden');
    $('#winScreen').classList.add('hidden');
    $('#simBar').classList.add('hidden');
    $('#startBtn').disabled = false;
  };
  $('#winAgain').onclick = () => {
    $('#winScreen').classList.add('hidden');
    $('#startBtn').disabled = false;
    resetBoard();
  };
  $('#winProjects').onclick = () => {
    $('#winScreen').classList.add('hidden');
    $('#backBtn').click();
  };

  /* ---- sim panel: minimize / exit / drag (so you can edit mid-run) ---- */
  $('#simMin').onclick = () => {
    const bar = $('#simBar');
    bar.classList.toggle('min');
    $('#simMin').textContent = bar.classList.contains('min') ? '▢' : '–';
  };
  $('#simExit').onclick = closeSim;

  let barDrag = null;
  $('#simHead').addEventListener('pointerdown', (e) => {
    if (e.target.id === 'simMin' || e.target.id === 'simExit') return;
    const bar = $('#simBar');
    const rect = bar.getBoundingClientRect();
    bar.style.transform = 'none';
    bar.style.left = rect.left + 'px';
    bar.style.top = rect.top + 'px';
    barDrag = { dx: e.clientX - rect.left, dy: e.clientY - rect.top, bar };
    $('#simHead').classList.add('drag');
    window.addEventListener('pointermove', onBarDrag);
    window.addEventListener('pointerup', endBarDrag);
  });
  function onBarDrag(e) {
    if (!barDrag) return;
    const maxX = window.innerWidth - 120,
      maxY = window.innerHeight - 60;
    barDrag.bar.style.left = Math.max(0, Math.min(e.clientX - barDrag.dx, maxX)) + 'px';
    barDrag.bar.style.top = Math.max(48, Math.min(e.clientY - barDrag.dy, maxY)) + 'px';
  }
  function endBarDrag() {
    barDrag = null;
    $('#simHead').classList.remove('drag');
    window.removeEventListener('pointermove', onBarDrag);
    window.removeEventListener('pointerup', endBarDrag);
  }

  window.addEventListener('resize', drawWires);

  /* init screens */
  renderProjects();
  renderPalette();
}
