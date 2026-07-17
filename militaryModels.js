// militaryModels.js  (v2 — versões detalhadas)
// Unidades militares low-poly em Three.js, prontas pro globe.gl.
// Cada fábrica retorna um THREE.Group com o "nariz"/proa apontando pra +Z.
// Requer THREE no escopo (globe.gl já usa Three.js internamente).
//
//   import { makeUnit } from './militaryModels.js';
//   const jato = makeUnit('jet', { color: 0x707a86 });
//
// Tipos: jet, submarine, drone, missile, tank, nuke, warship, carrier

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color, flatShading: true, metalness: 0.3, roughness: 0.6, ...opts,
  });
}

// ---------- CAÇA ----------
export function makeJet({ color = 0x707a86 } = {}) {
  const g = new THREE.Group();
  const body = mat(color); const dark = mat(0x3b4149);
  const glass = mat(0x18324f, { metalness: 0.7, roughness: 0.15 });
  const fus = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 2.2, 16), body); fus.rotation.x = Math.PI / 2; g.add(fus);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.1, 16), body); nose.rotation.x = Math.PI / 2; nose.position.z = 1.6; g.add(nose);
  const tc = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.16, 0.4, 16), dark); tc.rotation.x = Math.PI / 2; tc.position.z = -1.2; g.add(tc);
  [-0.2, 0.2].forEach(x => { const ik = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.7), dark); ik.position.set(x, -0.05, 0.35); g.add(ik); });
  const wg = new THREE.BoxGeometry(1.6, 0.05, 0.85);
  const wl = new THREE.Mesh(wg, body); wl.position.set(-0.78, 0, -0.15); wl.rotation.y = -0.6; g.add(wl);
  const wr = wl.clone(); wr.position.x = 0.78; wr.rotation.y = 0.6; g.add(wr);
  [-0.28, 0.28].forEach(x => { const le = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.9), body); le.position.set(x, 0, 0.55); le.rotation.y = x < 0 ? -0.5 : 0.5; g.add(le); });
  [-0.22, 0.22].forEach(x => { const fin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.5), body); fin.position.set(x, 0.28, -0.95); fin.rotation.z = x < 0 ? 0.25 : -0.25; g.add(fin); });
  const tp = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.04, 0.35), body); tp.position.z = -1.05; g.add(tp);
  const can = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 12, 0, Math.PI * 2, 0, Math.PI / 2), glass); can.scale.set(1, 1, 2.2); can.position.set(0, 0.16, 0.55); g.add(can);
  [-0.1, 0.1].forEach(x => {
    const noz = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.25, 12), dark); noz.rotation.x = Math.PI / 2; noz.position.set(x, 0, -1.35); g.add(noz);
    const gl = new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), new THREE.MeshBasicMaterial({ color: 0xff8844 })); gl.position.set(x, 0, -1.47); gl.rotation.y = Math.PI; g.add(gl);
  });
  [-0.9, 0.9].forEach(x => {
    const ms = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), mat(0xe5e7eb)); ms.rotation.x = Math.PI / 2; ms.position.set(x, -0.08, 0.1); g.add(ms);
    const mc = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 8), mat(0xdc2626)); mc.rotation.x = Math.PI / 2; mc.position.set(x, -0.08, 0.4); g.add(mc);
  });
  return g;
}

// ---------- SUBMARINO ----------
export function makeSubmarine({ color = 0x2b3440 } = {}) {
  const g = new THREE.Group();
  const hull = mat(color); const dark = mat(0x1a2028); const acc = mat(0x111827);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 18, 14), hull); body.scale.set(1, 1, 3.1); g.add(body);
  const sail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.55, 0.9), hull); sail.position.set(0, 0.45, 0.2); g.add(sail);
  const st = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.6), dark); st.position.set(0, 0.75, 0.2); g.add(st);
  [-0.35, 0.35].forEach(x => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.22), dark); p.position.set(x, 0.5, 0.2); g.add(p); });
  [0.06, -0.06].forEach((z, i) => { const pe = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.35 + i * 0.12, 8), acc); pe.position.set(0, 0.92, 0.2 + z); g.add(pe); });
  const fH = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.35), hull); fH.position.z = -1.4; g.add(fH);
  const fV = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.1, 0.35), hull); fV.position.z = -1.4; g.add(fV);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8), acc); shaft.rotation.x = Math.PI / 2; shaft.position.z = -1.62; g.add(shaft);
  const prop = new THREE.Group(); prop.name = 'prop';
  for (let i = 0; i < 5; i++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.28, 0.1), mat(0x9ca3af)); bl.position.y = 0.12; const h = new THREE.Group(); h.add(bl); h.rotation.z = i * (Math.PI * 2 / 5); prop.add(h); }
  prop.position.z = -1.78; prop.rotation.x = Math.PI / 2; g.add(prop);
  return g;
}

// ---------- DRONE (UAV militar, estilo Reaper) ----------
export function makeDrone({ color = 0x6b7280, accent = 0x10b981 } = {}) {
  const g = new THREE.Group();
  const body = mat(color); const dark = mat(0x3b4149); const acc = mat(accent);
  const fus = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 1.8, 14), body); fus.rotation.x = Math.PI / 2; g.add(fus);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), body); nose.scale.set(1, 1, 1.4); nose.position.z = 0.95; g.add(nose);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), dark); ball.position.set(0, -0.13, 0.8); g.add(ball);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.05, 10), acc); lens.position.set(0, -0.2, 0.86); lens.rotation.x = -1.0; g.add(lens);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.05, 0.32), body); wing.position.set(0, 0.05, 0.1); g.add(wing);
  [-1.0, -0.6, 0.6, 1.0].forEach(x => { const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), dark); pod.rotation.x = Math.PI / 2; pod.position.set(x, -0.05, 0.15); g.add(pod); });
  [-1, 1].forEach(s => { const t = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.3), body); t.position.set(s * 0.18, 0.15, -0.85); t.rotation.z = s * 0.5; g.add(t); });
  const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.05), dark); p1.position.z = -0.98; p1.name = 'prop'; g.add(p1);
  const p2 = p1.clone(); p2.rotation.z = Math.PI / 2; p2.name = 'prop'; g.add(p2);
  return g;
}

// ---------- MÍSSIL ----------
export function makeMissile({ color = 0xdfe3e8, ring = 0xdc2626, exhaust = 0xff9944 } = {}) {
  const g = new THREE.Group();
  const body = mat(color); const dark = mat(0x3b4149); const rmat = mat(ring);
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.0, 16), body); b.rotation.x = Math.PI / 2; g.add(b);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.55, 16), body); nose.rotation.x = Math.PI / 2; nose.position.z = 1.27; g.add(nose);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), dark); tip.position.z = 1.55; g.add(tip);
  [0.4, -0.2].forEach(z => { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.06, 16), rmat); r.rotation.x = Math.PI / 2; r.position.z = z; g.add(r); });
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; const f = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.26, 0.26), dark); f.position.set(Math.cos(a) * 0.16, Math.sin(a) * 0.16, 0.5); f.rotation.z = a; g.add(f); }
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; const f = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.36, 0.35), dark); f.position.set(Math.cos(a) * 0.16, Math.sin(a) * 0.16, -0.85); f.rotation.z = a; g.add(f); }
  const ex = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.5, 16), new THREE.MeshBasicMaterial({ color: exhaust })); ex.rotation.x = -Math.PI / 2; ex.position.z = -1.2; g.add(ex);
  return g;
}

// ---------- TANQUE DE GUERRA ----------
export function makeTank({ color = 0x4b5320 } = {}) {
  const g = new THREE.Group();
  const body = mat(color); const dark = mat(0x2f3416); const metal = mat(0x9ca3af);
  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.35, 2.2), body); hull.position.y = 0.2; g.add(hull);
  const gl = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.3, 0.5), body); gl.position.set(0, 0.25, 1.05); gl.rotation.x = -0.5; g.add(gl);
  [-0.7, 0.7].forEach(x => {
    const tr = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.42, 2.4), dark); tr.position.set(x, 0.05, 0); g.add(tr);
    for (let i = -2; i <= 2; i++) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.3, 12), mat(0x1f2937)); w.rotation.z = Math.PI / 2; w.position.set(x, -0.05, i * 0.45); g.add(w); }
  });
  [-0.72, 0.72].forEach(x => { const sk = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 2.2), dark); sk.position.set(x, 0.18, 0); g.add(sk); });
  const tur = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.35, 8), body); tur.position.y = 0.58; tur.rotation.y = Math.PI / 8; g.add(tur);
  const mant = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.28, 0.3), body); mant.position.set(0, 0.58, 0.5); g.add(mant);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.5, 12), metal); bar.rotation.x = Math.PI / 2; bar.position.set(0, 0.6, 1.15); g.add(bar);
  const brake = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.25, 12), dark); brake.rotation.x = Math.PI / 2; brake.position.set(0, 0.6, 1.85); g.add(brake);
  const mg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), dark); mg.rotation.x = Math.PI / 2; mg.position.set(0.25, 0.82, 0.2); g.add(mg);
  const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.06, 10), dark); hatch.position.set(-0.1, 0.78, -0.1); g.add(hatch);
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.6, 6), metal); ant.position.set(-0.4, 0.9, -0.6); g.add(ant);
  return g;
}

// ---------- MÍSSIL NUCLEAR (ICBM) ----------
export function makeNuke({ color = 0x5a6b34, warn = 0xf5c518, warhead = 0xb91c1c } = {}) {
  const g = new THREE.Group();
  const body = mat(color); const dark = mat(0x2f3416); const wmat = mat(warhead); const wr = mat(warn);
  const s1 = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 1.4, 18), body); s1.rotation.x = Math.PI / 2; s1.position.z = -0.7; g.add(s1);
  const inter = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.2, 18), dark); inter.rotation.x = Math.PI / 2; inter.position.z = 0.1; g.add(inter);
  const s2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.9, 18), body); s2.rotation.x = Math.PI / 2; s2.position.z = 0.65; g.add(s2);
  [-0.3, 0.35].forEach(z => { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.265, 0.225, 0.12, 18), wr); r.rotation.x = Math.PI / 2; r.position.z = z; g.add(r); });
  const wh = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.7, 18), wmat); wh.rotation.x = Math.PI / 2; wh.position.z = 1.45; g.add(wh);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), dark); cap.position.z = 1.82; g.add(cap);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; const f = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.6), dark); f.position.set(Math.cos(a) * 0.35, Math.sin(a) * 0.35, -1.25); f.rotation.z = a; g.add(f); }
  const noz = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.2, 0.25, 18), dark); noz.rotation.x = Math.PI / 2; noz.position.z = -1.5; g.add(noz);
  const fl = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.8, 18), new THREE.MeshBasicMaterial({ color: 0xff7733 })); fl.rotation.x = -Math.PI / 2; fl.position.z = -1.9; g.add(fl);
  const fl2 = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 14), new THREE.MeshBasicMaterial({ color: 0xffd27a })); fl2.rotation.x = -Math.PI / 2; fl2.position.z = -1.8; g.add(fl2);
  return g;
}

// ---------- NAVIO DE GUERRA (destróier stealth) ----------
export function makeWarship({ color = 0x545f6b } = {}) {
  const g = new THREE.Group();
  const hullc = mat(color); const deck = mat(0x39414c); const metal = mat(0x9ca3af); const dark = mat(0x252b33);
  const hull = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 3.6), hullc); g.add(hull);
  const bow = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.2, 4), hullc); bow.rotation.x = Math.PI / 2; bow.rotation.z = Math.PI / 4; bow.position.z = 2.2; bow.scale.set(1, 0.55, 1); g.add(bow);
  const d = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.06, 3.5), deck); d.position.y = 0.27; g.add(d);
  const turr = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.16, 8), hullc); turr.position.set(0, 0.38, 1.35); g.add(turr);
  const gun = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8), metal); gun.rotation.x = Math.PI / 2; gun.position.set(0, 0.42, 1.7); g.add(gun);
  for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.08), dark); c.position.set(-0.12 + b * 0.24, 0.32, 0.9 - a * 0.16); g.add(c); }
  const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 1.2), hullc); s1.position.set(0, 0.5, 0.0); g.add(s1);
  const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.7), hullc); s2.position.set(0, 0.82, 0.05); g.add(s2);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 0.5, 6), hullc); mast.position.set(0, 1.15, 0.05); g.add(mast);
  [0.28, -0.28].forEach(x => { const rp = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.2, 0.2), mat(0x2b3440)); rp.position.set(x, 0.6, 0.55); g.add(rp); });
  const radar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.05), metal); radar.position.set(0, 1.35, 0.05); g.add(radar);
  const funnel = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.4), deck); funnel.position.set(0, 0.72, -0.75); g.add(funnel);
  const heli = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.02, 0.7), dark); heli.position.set(0, 0.31, -1.45); g.add(heli);
  const hc = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.02, 6, 16), metal); hc.rotation.x = Math.PI / 2; hc.position.set(0, 0.33, -1.45); g.add(hc);
  const ciws = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), mat(0xffffff)); ciws.position.set(0, 0.5, -1.0); g.add(ciws);
  return g;
}

// ---------- PORTA-AVIÕES ----------
export function makeCarrier({ color = 0x455060 } = {}) {
  const g = new THREE.Group();
  const hullc = mat(color); const deck = mat(0x2a313b); const line = mat(0xd8dde3); const yellow = mat(0xe8b923); const dark = mat(0x1c2129);
  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 4.8), hullc); g.add(hull);
  const bow = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.0, 4), hullc); bow.rotation.x = Math.PI / 2; bow.rotation.z = Math.PI / 4; bow.position.z = 2.6; bow.scale.set(1, 0.6, 1); g.add(bow);
  const flight = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.14, 5.0), deck); flight.position.y = 0.36; g.add(flight);
  const ang = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 3.0), deck); ang.position.set(-0.55, 0.44, 0.3); ang.rotation.y = 0.16; g.add(ang);
  const cl = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 4.2), line); cl.position.set(0.15, 0.44, 0); g.add(cl);
  const al = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 2.6), yellow); al.position.set(-0.55, 0.48, 0.3); al.rotation.y = 0.16; g.add(al);
  [-1.0, 1.0].forEach(x => { const edge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 5.0), hullc); edge.position.set(x, 0.4, 0); g.add(edge); });
  const island = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 1.3), hullc); island.position.set(0.78, 0.7, -0.7); g.add(island);
  const isl2 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.3, 0.7), hullc); isl2.position.set(0.78, 1.05, -0.7); g.add(isl2);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6), line); mast.position.set(0.78, 1.4, -0.7); g.add(mast);
  const radar = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.04), mat(0x9ca3af)); radar.position.set(0.78, 1.0, -0.55); radar.rotation.y = 0.3; g.add(radar);
  [-0.9, 0.9].forEach(x => { const el = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.5), dark); el.position.set(x, 0.44, -1.6); g.add(el); });
  function miniJet() {
    const j = new THREE.Group(); const jb = mat(0x6b7280);
    const f = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.55, 8), jb); f.rotation.x = Math.PI / 2; j.add(f);
    const n = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 8), jb); n.rotation.x = Math.PI / 2; n.position.z = 0.36; j.add(n);
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.18), jb); j.add(w);
    const tf = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.14, 0.14), jb); tf.position.set(0, 0.08, -0.24); j.add(tf);
    return j;
  }
  [[-0.4, 1.6, 0.5], [0.35, 1.2, -0.4], [-0.6, 0.2, 2.4], [0.5, -0.6, -0.2], [-0.3, -1.3, 0.7]].forEach(([x, z, rot]) => { const j = miniJet(); j.position.set(x, 0.48, z); j.rotation.y = rot; j.scale.setScalar(0.8); g.add(j); });
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.7), deck); ramp.position.set(0.1, 0.5, 2.2); ramp.rotation.x = -0.35; g.add(ramp);
  return g;
}

// ---------- Fábrica única por tipo ----------
export function makeUnit(type, opts = {}) {
  switch (type) {
    case 'jet': return makeJet(opts);
    case 'submarine': return makeSubmarine(opts);
    case 'drone': return makeDrone(opts);
    case 'missile': return makeMissile(opts);
    case 'tank': return makeTank(opts);
    case 'nuke': return makeNuke(opts);
    case 'warship': return makeWarship(opts);
    case 'carrier': return makeCarrier(opts);
    default: throw new Error('Tipo desconhecido: ' + type);
  }
}

// Escala sugerida por tipo (poder de fogo lê no tamanho):
export const UNIT_SCALE = {
  tank: 0.6, missile: 0.7, drone: 0.8, jet: 0.85,
  submarine: 0.9, nuke: 0.9, warship: 1.0, carrier: 1.5,
};

/* ============================================================
   INTEGRAÇÃO COM globe.gl
   ------------------------------------------------------------
   import Globe from 'globe.gl';
   import { makeUnit, UNIT_SCALE } from './militaryModels.js';

   const unidades = [
     { type:'carrier',   lat:-3,   lng:-40, alt:0,    color:0x455060 },
     { type:'jet',       lat:-15,  lng:-47, alt:0.14, color:0xdc2626 },
     { type:'tank',      lat:-23,  lng:-46, alt:0,    color:0x4b5320 },
     { type:'submarine', lat:-10,  lng:-35, alt:-0.01 },
   ];

   const world = Globe()
     .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
     .objectsData(unidades)
     .objectLat('lat').objectLng('lng').objectAltitude('alt')
     .objectFacesSurface(false)
     .objectThreeObject(d => {
       const m = makeUnit(d.type, { color: d.color });
       m.scale.setScalar(UNIT_SCALE[d.type] || 1);
       return m;
     })
     (document.getElementById('globe'));

   // Luz: se os modelos aparecerem pretos, adicione ao world.scene():
   //   scene.add(new THREE.AmbientLight(0xffffff,0.6));
   //   const d=new THREE.DirectionalLight(0xffffff,0.9); d.position.set(1,1,1); scene.add(d);

   // Apontar na direção do movimento: gire o objeto no eixo Y (modelo aponta +Z).
   // Animar partes: procure por child.name === 'prop' e gire (submarino/drone).
   ============================================================ */

// ============================================================
// PROPULSOR COM FOGO + PARTÍCULAS (reutilizável)
// ------------------------------------------------------------
// Retorna um THREE.Group que aponta a chama pra -Z (o "atrás" das
// unidades deste módulo). Chame group.userData.update(dt, tempo) a
// cada frame. Ajuste a força com group.userData.setThrust(0..1).
//
//   const th = createThruster({ length: 1.2, radius: 0.2 });
//   th.position.z = -1.2;          // no bico do míssil/foguete
//   missil.add(th);
//   // no loop: th.userData.update(dt, clock.elapsedTime);
// ============================================================
export function createThruster({ length = 1.2, radius = 0.2, smoke = true, count = 120 } = {}) {
  const g = new THREE.Group();
  let thrust = 1;

  // chamas (cones aditivos)
  const cones = [
    { c: 0xff5522, r: radius * 1.3, l: length * 1.05, o: 0.55 },
    { c: 0xff9933, r: radius * 0.9, l: length * 0.8, o: 0.7 },
    { c: 0xffdd66, r: radius * 0.5, l: length * 0.55, o: 0.9 },
  ].map(d => {
    const m = new THREE.Mesh(new THREE.ConeGeometry(d.r, d.l, 18),
      new THREE.MeshBasicMaterial({ color: d.c, transparent: true, opacity: d.o, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.rotation.x = Math.PI / 2;   // aponta pra -Z
    g.add(m); return { m, l: d.l, o: d.o };
  });

  // faíscas
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
  const life = new Float32Array(count), max = new Float32Array(count), vel = [];
  const seed = (i, init) => {
    pos[i * 3] = (Math.random() - 0.5) * radius; pos[i * 3 + 1] = (Math.random() - 0.5) * radius; pos[i * 3 + 2] = -(Math.random() * 0.1);
    vel[i] = { x: (Math.random() - 0.5) * 0.8, y: (Math.random() - 0.5) * 0.8, z: -(1.8 + Math.random() * 1.8) };
    max[i] = 0.35 + Math.random() * 0.4; life[i] = init ? Math.random() * max[i] : max[i];
  };
  for (let i = 0; i < count; i++) seed(i, true);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const fire = new THREE.Points(geo, new THREE.PointsMaterial({ size: radius * 0.8, vertexColors: true, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
  g.add(fire);

  // fumaça (opcional)
  let smokeGeo, sLife, sMax, sVel, sCount = 0;
  if (smoke) {
    sCount = Math.round(count * 0.6);
    const sp = new Float32Array(sCount * 3); sLife = new Float32Array(sCount); sMax = new Float32Array(sCount); sVel = [];
    const sseed = (i, init) => {
      sp[i * 3] = (Math.random() - 0.5) * radius; sp[i * 3 + 1] = (Math.random() - 0.5) * radius; sp[i * 3 + 2] = -length * 0.5;
      sVel[i] = { x: (Math.random() - 0.5) * 0.7, y: (Math.random() - 0.5) * 0.7, z: -(0.8 + Math.random() * 0.9) };
      sMax[i] = 1.0 + Math.random() * 0.8; sLife[i] = init ? Math.random() * sMax[i] : sMax[i];
    };
    for (let i = 0; i < sCount; i++) sseed(i, true);
    smokeGeo = new THREE.BufferGeometry(); smokeGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    const sm = new THREE.Points(smokeGeo, new THREE.PointsMaterial({ size: radius * 1.7, color: 0x777777, transparent: true, opacity: 0.32, depthWrite: false }));
    g.add(sm);
    g.userData._sseed = sseed;
  }

  const cA = new THREE.Color(0xfff2b0), cB = new THREE.Color(0xff8a33), cC = new THREE.Color(0x992200);
  g.userData.setThrust = v => { thrust = Math.max(0, Math.min(1, v)); };
  g.userData.update = (dt, t = 0) => {
    dt = Math.min(dt || 0.016, 0.05);
    const th = Math.max(0.05, thrust);
    cones.forEach((fl, i) => {
      const k = 0.85 + Math.sin(t * 30 + i * 2) * 0.12 + (Math.random() - 0.5) * 0.12;
      fl.m.scale.set(k, k, k * th * (1 + 0.15 * Math.sin(t * 22 + i)));
      fl.m.position.z = -(fl.l * fl.m.scale.z) / 2 + 0.1;
      fl.m.material.opacity = fl.o * th;
    });
    for (let i = 0; i < count; i++) {
      life[i] -= dt * (1.2 / (0.2 + thrust));
      if (life[i] <= 0) { if (Math.random() < thrust) seed(i, false); else { pos[i * 3 + 2] = 999; } continue; }
      pos[i * 3] += vel[i].x * dt * (0.4 + thrust); pos[i * 3 + 1] += vel[i].y * dt * (0.4 + thrust); pos[i * 3 + 2] += vel[i].z * dt * (0.4 + thrust);
      const a = 1 - life[i] / max[i]; const c = a < 0.5 ? cA.clone().lerp(cB, a * 2) : cB.clone().lerp(cC, (a - 0.5) * 2);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
    if (smokeGeo) {
      const sp = smokeGeo.attributes.position.array;
      for (let i = 0; i < sCount; i++) {
        sLife[i] -= dt;
        if (sLife[i] <= 0) { if (Math.random() < thrust * 0.8) g.userData._sseed(i, false); else { sp[i * 3 + 2] = 999; } continue; }
        sp[i * 3] += sVel[i].x * dt; sp[i * 3 + 1] += sVel[i].y * dt; sp[i * 3 + 2] += sVel[i].z * dt * (0.5 + thrust);
      }
      smokeGeo.attributes.position.needsUpdate = true;
    }
  };
  return g;
}

// Explosão rápida (para impactos/abates). Chame update(dt) até done===true.
export function createExplosion({ radius = 0.6, count = 80 } = {}) {
  const g = new THREE.Group();
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 3), vel = [];
  for (let i = 0; i < count; i++) {
    pos[i * 3] = pos[i * 3 + 1] = pos[i * 3 + 2] = 0;
    const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(1 + Math.random() * 2);
    vel.push(dir);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: radius * 0.5, vertexColors: true, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false })));
  const cA = new THREE.Color(0xffffff), cB = new THREE.Color(0xff7a1a), cC = new THREE.Color(0x551100);
  let age = 0; const dur = 0.8;
  g.userData.done = false;
  g.userData.update = dt => {
    age += (dt || 0.016);
    const p = age / dur;
    for (let i = 0; i < count; i++) {
      pos[i * 3] += vel[i].x * dt; pos[i * 3 + 1] += vel[i].y * dt; pos[i * 3 + 2] += vel[i].z * dt;
      const c = p < 0.5 ? cA.clone().lerp(cB, p * 2) : cB.clone().lerp(cC, (p - 0.5) * 2);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
    g.children[0].material.opacity = Math.max(0, 1 - p);
    if (age >= dur) g.userData.done = true;
  };
  return g;
}
