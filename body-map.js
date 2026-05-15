// body-map.js — Corpo Humano 3D Holográfico v4 (geometria fundida)
import * as THREE from 'three';
import { OrbitControls }   from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ================================================================
// GRUPOS MUSCULARES
// ================================================================
const MUSCLES = [
  { id: 'cervical',    name: 'Cervical',        pos: [ 0.00,  1.67,  0.09], yt: null },
  { id: 'peitoral',    name: 'Peitoral',        pos: [ 0.00,  1.40,  0.22], yt: null },
  { id: 'abdomen',     name: 'Abdômen',         pos: [ 0.00,  1.08,  0.20], yt: null },
  { id: 'deltoides',   name: 'Deltóide',        pos: [ 0.31,  1.55,  0.04], yt: null },
  { id: 'biceps',      name: 'Bíceps',          pos: [ 0.42,  1.26,  0.09], yt: null },
  { id: 'quadriceps',  name: 'Quadríceps',      pos: [ 0.14,  0.58,  0.12], yt: null },
  { id: 'tibial',      name: 'Tibial Anterior', pos: [ 0.14,  0.12,  0.11], yt: null },
  { id: 'trapezio',    name: 'Trapézio',        pos: [ 0.00,  1.53, -0.18], yt: null },
  { id: 'dorsais',     name: 'Dorsais',         pos: [ 0.22,  1.22, -0.18], yt: null },
  { id: 'triceps',     name: 'Tríceps',         pos: [ 0.42,  1.22, -0.09], yt: null },
  { id: 'lombar',      name: 'Lombar',          pos: [ 0.00,  0.94, -0.18], yt: null },
  { id: 'gluteos',     name: 'Glúteos',         pos: [ 0.13,  0.72, -0.18], yt: null },
  { id: 'isquiotib',   name: 'Isquiotibiais',   pos: [ 0.14,  0.55, -0.12], yt: null },
  { id: 'panturrilha', name: 'Panturrilha',     pos: [ 0.14,  0.12, -0.12], yt: null },
];

// ================================================================
// CENA
// ================================================================
const container = document.getElementById('bodyMapContainer');
const canvas    = document.getElementById('bodyCanvas');
const cW = () => container.clientWidth;
const cH = () => Math.min(cW() * 1.22, 680);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(cW(), cH());

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(44, cW() / cH(), 0.1, 50);
camera.position.set(0, 0.35, 4.2);

// ================================================================
// ORBIT CONTROLS
// ================================================================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom    = false;
controls.enablePan     = false;
controls.target.set(0, 0.35, 0);
controls.rotateSpeed   = 0.75;
controls.dampingFactor = 0.10;
controls.enableDamping = true;
controls.autoRotate      = true;
controls.autoRotateSpeed = 1.4;
controls.update();
controls.addEventListener('start', () => { controls.autoRotate = false; });
controls.addEventListener('end',   () => { setTimeout(() => controls.autoRotate = true, 3000); });

// ================================================================
// LUZES
// ================================================================
scene.add(new THREE.AmbientLight(0x001a44, 2.0));
const pl = (c,i,x,y,z,d=20) => { const l=new THREE.PointLight(c,i,d); l.position.set(x,y,z); scene.add(l); };
pl(0x0099ff, 5.0,  0, 1.8,  6);
pl(0x0055cc, 3.0,  0, 1.8, -6);
pl(0x00ccff, 2.5, -5, 1.0,  0);
pl(0x00ccff, 2.5,  5, 1.0,  0);
pl(0x0077ff, 2.0,  0, 3.8,  0);

// ================================================================
// MATERIAIS HOLOGRÁFICOS
// ================================================================
const holoSolid = new THREE.MeshPhongMaterial({
  color: 0x001e5c, emissive: 0x0044bb, emissiveIntensity: 1.0,
  transparent: true, opacity: 0.72, shininess: 220,
  side: THREE.FrontSide,
});
const edgeMat = new THREE.LineBasicMaterial({
  color: 0x22ccff, transparent: true, opacity: 0.55,
});

// ================================================================
// GRUPO DO CORPO
// ================================================================
const bodyGroup = new THREE.Group();
bodyGroup.position.y = -0.72;
scene.add(bodyGroup);

// ================================================================
// CONSTRUTORES DE GEOMETRIA
// ================================================================
const geos = [];

function ell(rx, ry, rz) {
  const g = new THREE.SphereGeometry(1, 28, 20);
  g.scale(rx, ry, rz);
  return g;
}
function cyl(rt, rb, h, seg=20) {
  return new THREE.CylinderGeometry(rt, rb, h, seg);
}
function place(geo, x, y, z, rx=0, ry=0, rz=0) {
  geo.applyMatrix4(new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    new THREE.Vector3(1, 1, 1)
  ));
  geos.push(geo);
}

// ================================================================
// ANATOMIA — CORPO COMPLETO (fundido em uma malha)
// ================================================================

// CABEÇA
place(ell(0.150, 0.188, 0.155),  0,      1.810,  0);
// PESCOÇO
place(cyl(0.078, 0.094, 0.230, 16), 0,   1.658,  0);
// TRAPÉZIO / BASE DOS OMBROS
place(ell(0.310, 0.078, 0.178),  0,      1.548, -0.028);
// CLAVÍCULA / PEITO SUPERIOR
place(cyl(0.272, 0.268, 0.155, 24), 0,   1.525,  0);

// PEITORAIS
place(ell(0.162, 0.108, 0.138), -0.118,  1.432,  0.130);
place(ell(0.162, 0.108, 0.138),  0.118,  1.432,  0.130);

// TRONCO (4 segmentos para curva orgânica)
place(cyl(0.255, 0.245, 0.245, 24), 0,   1.392,  0);
place(cyl(0.238, 0.220, 0.235, 24), 0,   1.158,  0);
place(cyl(0.215, 0.200, 0.218, 24), 0,   0.958,  0);
place(cyl(0.220, 0.232, 0.235, 24), 0,   0.750,  0);

// SERRÁTIL / OBLÍQUOS
place(ell(0.068, 0.150, 0.078), -0.232,  1.250,  0.050);
place(ell(0.068, 0.150, 0.078),  0.232,  1.250,  0.050);

// DORSAIS / LATÍSSIMO (costas largas)
place(ell(0.152, 0.215, 0.098), -0.282,  1.248, -0.068);
place(ell(0.152, 0.215, 0.098),  0.282,  1.248, -0.068);

// GLÚTEOS
place(ell(0.155, 0.128, 0.115), -0.124,  0.705, -0.120);
place(ell(0.155, 0.128, 0.115),  0.124,  0.705, -0.120);

// DELTÓIDES
place(ell(0.145, 0.135, 0.130), -0.308,  1.555,  0);
place(ell(0.145, 0.135, 0.130),  0.308,  1.555,  0);

// BRAÇO SUPERIOR (tubo)
place(cyl(0.088, 0.074, 0.455, 16), -0.382, 1.238, 0, 0, 0,  0.25);
place(cyl(0.088, 0.074, 0.455, 16),  0.382, 1.238, 0, 0, 0, -0.25);
// BÍCEPS
place(ell(0.084, 0.075, 0.084), -0.418,  1.295,  0.092, 0, 0,  0.25);
place(ell(0.084, 0.075, 0.084),  0.418,  1.295,  0.092, 0, 0, -0.25);
// TRÍCEPS
place(ell(0.078, 0.098, 0.074), -0.410,  1.212, -0.092, 0, 0,  0.23);
place(ell(0.078, 0.098, 0.074),  0.410,  1.212, -0.092, 0, 0, -0.23);

// ANTEBRAÇO
place(cyl(0.070, 0.052, 0.438, 14), -0.465, 0.860, 0, 0, 0,  0.14);
place(cyl(0.070, 0.052, 0.438, 14),  0.465, 0.860, 0, 0, 0, -0.14);
// MÃOS
place(ell(0.062, 0.054, 0.046), -0.524,  0.638,  0);
place(ell(0.062, 0.054, 0.046),  0.524,  0.638,  0);

// COXA SUPERIOR (tubo)
place(cyl(0.130, 0.115, 0.585, 20), -0.134,  0.578,  0);
place(cyl(0.130, 0.115, 0.585, 20),  0.134,  0.578,  0);
// QUADRÍCEPS (frente da coxa)
place(ell(0.110, 0.175, 0.098), -0.134,  0.580,  0.102);
place(ell(0.110, 0.175, 0.098),  0.134,  0.580,  0.102);
// ISQUIOTIBIAIS (traseiro da coxa)
place(ell(0.098, 0.158, 0.084), -0.134,  0.565, -0.102);
place(ell(0.098, 0.158, 0.084),  0.134,  0.565, -0.102);

// JOELHOS
place(ell(0.108, 0.100, 0.102), -0.134,  0.278,  0.040);
place(ell(0.108, 0.100, 0.102),  0.134,  0.278,  0.040);

// PERNA INFERIOR
place(cyl(0.100, 0.070, 0.518, 18), -0.134,  0.008,  0);
place(cyl(0.100, 0.070, 0.518, 18),  0.134,  0.008,  0);
// PANTURRILHA
place(ell(0.088, 0.146, 0.082), -0.134,  0.118, -0.088);
place(ell(0.088, 0.146, 0.082),  0.134,  0.118, -0.088);

// TORNOZELOS
place(ell(0.070, 0.060, 0.070), -0.134, -0.275,  0);
place(ell(0.070, 0.060, 0.070),  0.134, -0.275,  0);
// PÉS
place(ell(0.067, 0.036, 0.142), -0.134, -0.314,  0.075);
place(ell(0.067, 0.036, 0.142),  0.134, -0.314,  0.075);

// ================================================================
// FUNDIR TUDO EM UMA ÚNICA MESH
// ================================================================
const merged   = mergeGeometries(geos, false);

// Malha sólida holográfica
bodyGroup.add(new THREE.Mesh(merged, holoSolid));

// Wireframe de arestas limpas (EdgesGeometry = apenas contornos visíveis)
const edges = new THREE.EdgesGeometry(merged, 22);
bodyGroup.add(new THREE.LineSegments(edges, edgeMat));

// ================================================================
// GLOW TEXTURE
// ================================================================
function makeGlowTex(hex) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const ctx = c.getContext('2d'), r = 64;
  const g = ctx.createRadialGradient(r,r,0,r,r,r);
  g.addColorStop(0.0, hex+'ff');
  g.addColorStop(0.4, hex+'99');
  g.addColorStop(1.0, hex+'00');
  ctx.fillStyle = g; ctx.fillRect(0,0,128,128);
  return new THREE.CanvasTexture(c);
}
const glowGold = makeGlowTex('#c5a059');
const glowBlue = makeGlowTex('#00eeff');

// ================================================================
// HOTSPOTS MUSCULARES
// ================================================================
const hotspotMeshes = [];

MUSCLES.forEach((m, i) => {
  const [x, y, z] = m.pos;

  const hit = new THREE.Mesh(
    new THREE.SphereGeometry(0.096, 8, 8),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hit.position.set(x, y, z);
  hit.userData.muscle = m;
  bodyGroup.add(hit);
  hotspotMeshes.push(hit);

  const dotMat = new THREE.MeshBasicMaterial({ color: 0xc5a059 });
  const dot    = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), dotMat);
  dot.position.set(x, y, z);
  bodyGroup.add(dot);
  m.dotMat = dotMat;

  const glowMat = new THREE.SpriteMaterial({
    map: glowGold, transparent: true,
    blending: THREE.AdditiveBlending, opacity: 0.55, depthWrite: false,
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.setScalar(0.14);
  glow.position.set(x, y, z);
  bodyGroup.add(glow);
  m.glow = glow; m.glowMat = glowMat; m._i = i;
});

// ================================================================
// ANÉIS HOLOGRÁFICOS NO CHÃO
// ================================================================
const FLOOR_Y = -0.72 - 0.010;
const mkRing = (ri, ro, op=0.28) => {
  const mat  = new THREE.MeshBasicMaterial({ color:0x0088ff, transparent:true, opacity:op, side:THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.RingGeometry(ri, ro, 72), mat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y  = FLOOR_Y;
  scene.add(ring);
  return ring;
};
const rings = [mkRing(0.24,0.29), mkRing(0.38,0.43), mkRing(0.54,0.58,0.15)];

// ================================================================
// SCAN LINE
// ================================================================
const scanMat  = new THREE.MeshBasicMaterial({
  color:0x00ccff, transparent:true, opacity:0.35,
  side:THREE.DoubleSide, depthWrite:false,
});
const scanLine = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.014), scanMat);
scene.add(scanLine);

// ================================================================
// PARTÍCULAS
// ================================================================
const pCount = 300;
const pPos   = new Float32Array(pCount * 3);
for (let i = 0; i < pCount; i++) {
  const theta  = Math.random() * Math.PI * 2;
  const phi    = Math.acos(2 * Math.random() - 1);
  const r      = 0.9 + Math.random() * 0.85;
  pPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
  pPos[i*3+1] = r * Math.cos(phi) * 0.88 + 0.38;
  pPos[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
}
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const pMat = new THREE.PointsMaterial({
  color:0x0099ff, size:0.018, transparent:true, opacity:0.55,
  blending:THREE.AdditiveBlending, depthWrite:false,
});
const particles = new THREE.Points(pGeo, pMat);
scene.add(particles);

// ================================================================
// RAYCASTING + TOOLTIP
// ================================================================
const raycaster = new THREE.Raycaster();
const mouse     = new THREE.Vector2();
const tooltip   = document.getElementById('muscleTooltip');
let hoveredMuscle = null;

function setHovered(m) {
  if (m === hoveredMuscle) return;
  if (hoveredMuscle) {
    hoveredMuscle.glowMat.map = glowGold;
    hoveredMuscle.glow.scale.setScalar(0.14);
    hoveredMuscle.dotMat.color.set(0xc5a059);
  }
  hoveredMuscle = m;
  if (m) {
    m.glowMat.map = glowBlue;
    m.glow.scale.setScalar(0.40);
    m.dotMat.color.set(0x00eeff);
  }
}

function castRay(nx, ny) {
  mouse.set(nx, ny);
  raycaster.setFromCamera(mouse, camera);
  return raycaster.intersectObjects(hotspotMeshes);
}

function showTip(m, cx, cy) {
  const rect  = canvas.getBoundingClientRect();
  const extra = m.yt
    ? '<br><small style="color:#7ad">▶ Clique para ver dica</small>'
    : '<br><small style="color:#666">Vídeo em breve 🔜</small>';
  tooltip.innerHTML = `<strong>${m.name}</strong>${extra}`;
  tooltip.style.opacity = '1';
  tooltip.style.left = Math.min(cx - rect.left + 18, rect.width - 200) + 'px';
  tooltip.style.top  = Math.max(cy - rect.top  - 58, 8) + 'px';
}

canvas.addEventListener('mousemove', e => {
  const r  = canvas.getBoundingClientRect();
  const nx =  (e.clientX - r.left) / r.width  * 2 - 1;
  const ny = -(e.clientY - r.top)  / r.height * 2 + 1;
  const hits = castRay(nx, ny);
  if (hits.length) {
    setHovered(hits[0].object.userData.muscle);
    showTip(hoveredMuscle, e.clientX, e.clientY);
    canvas.style.cursor = 'pointer';
  } else {
    setHovered(null); tooltip.style.opacity = '0'; canvas.style.cursor = 'grab';
  }
});
canvas.addEventListener('mouseleave', () => { setHovered(null); tooltip.style.opacity = '0'; });
canvas.addEventListener('click', () => {
  if (hoveredMuscle?.yt) openModal(hoveredMuscle.yt, hoveredMuscle.name);
});

let ts = { x:0, y:0, t:0 };
canvas.addEventListener('touchstart', e => {
  const t = e.touches[0]; ts = { x:t.clientX, y:t.clientY, t:Date.now() };
}, { passive:true });
canvas.addEventListener('touchend', e => {
  const t  = e.changedTouches[0];
  if (Math.abs(t.clientX-ts.x)<10 && Math.abs(t.clientY-ts.y)<10 && Date.now()-ts.t<300) {
    const r    = canvas.getBoundingClientRect();
    const hits = castRay(
      (t.clientX-r.left)/r.width*2-1,
      -((t.clientY-r.top)/r.height)*2+1
    );
    if (hits.length) {
      const m = hits[0].object.userData.muscle;
      setHovered(m); showTip(m, t.clientX, t.clientY);
      if (m.yt) setTimeout(() => openModal(m.yt, m.name), 200);
      setTimeout(() => { setHovered(null); tooltip.style.opacity='0'; }, 3200);
    }
  }
}, { passive:true });

// ================================================================
// MODAL YOUTUBE
// ================================================================
function openModal(ytId, name) {
  document.getElementById('ytTitle').textContent = name;
  document.getElementById('ytFrame').src = `https://www.youtube.com/embed/${ytId}?autoplay=1`;
  document.getElementById('ytModal').classList.add('open');
}
function closeModal() {
  document.getElementById('ytModal').classList.remove('open');
  document.getElementById('ytFrame').src = '';
}
document.getElementById('ytClose').addEventListener('click', closeModal);
document.getElementById('ytModal').addEventListener('click', e => {
  if (e.target === document.getElementById('ytModal')) closeModal();
});

// ================================================================
// LOOP DE ANIMAÇÃO
// ================================================================
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // Pulso emissivo do corpo
  holoSolid.emissiveIntensity = 0.85 + 0.18 * Math.sin(t * 1.2);

  // Pulso dos hotspots
  MUSCLES.forEach(m => {
    if (!m.glowMat) return;
    const h = m === hoveredMuscle;
    m.glowMat.opacity = h
      ? 0.85 + 0.15 * Math.sin(t * 7)
      : 0.28 + 0.28 * Math.sin(t * 2.4 + m._i * 0.9);
    if (h) m.glow.scale.setScalar(0.32 + 0.09 * Math.sin(t * 6));
  });

  // Scan line
  const scanMin  = FLOOR_Y + 0.05;
  const scanMax  = FLOOR_Y + 2.80;
  const scanFrac = (t * 0.40) % 1.0;
  scanLine.position.y = scanMin + (scanMax - scanMin) * scanFrac;
  scanMat.opacity     = 0.12 + 0.32 * Math.sin(scanFrac * Math.PI);

  // Anéis
  rings.forEach((r, i) => {
    r.material.opacity = 0.10 + 0.16 * Math.sin(t * 1.5 + i * 1.2);
  });

  // Partículas
  particles.rotation.y += 0.0015;
  pMat.opacity = 0.42 + 0.12 * Math.sin(t * 0.8);

  controls.update();
  renderer.render(scene, camera);
}
animate();

// ================================================================
// RESPONSIVO
// ================================================================
new ResizeObserver(() => {
  const w = cW(), h = cH();
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}).observe(container);
