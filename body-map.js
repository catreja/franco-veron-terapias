// body-map.js — Corpo Humano 3D Holográfico
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ================================================================
// GRUPOS MUSCULARES — frontais (z+) e dorsais (z-)
// ================================================================
const MUSCLES = [
  // FRONTAIS
  { id: 'cervical',     name: 'Cervical',         pos: [ 0.00,  1.67,  0.09], yt: null },
  { id: 'peitoral',     name: 'Peitoral',          pos: [ 0.00,  1.36,  0.23], yt: null },
  { id: 'abdomen',      name: 'Abdômen',           pos: [ 0.00,  1.04,  0.22], yt: null },
  { id: 'deltoides',    name: 'Deltóide',          pos: [ 0.30,  1.53,  0.07], yt: null },
  { id: 'biceps',       name: 'Bíceps',            pos: [ 0.44,  1.22,  0.10], yt: null },
  { id: 'quadriceps',   name: 'Quadríceps',        pos: [ 0.14,  0.57,  0.13], yt: null },
  { id: 'tibial',       name: 'Tibial Anterior',   pos: [ 0.14,  0.09,  0.12], yt: null },
  // DORSAIS
  { id: 'trapezio',     name: 'Trapézio',          pos: [ 0.00,  1.54, -0.22], yt: null },
  { id: 'dorsais',      name: 'Dorsais',           pos: [ 0.18,  1.19, -0.22], yt: null },
  { id: 'triceps',      name: 'Tríceps',           pos: [ 0.44,  1.22, -0.10], yt: null },
  { id: 'lombar',       name: 'Lombar',            pos: [ 0.00,  0.96, -0.22], yt: null },
  { id: 'gluteos',      name: 'Glúteos',           pos: [ 0.00,  0.78, -0.21], yt: null },
  { id: 'isquiotib',    name: 'Isquiotibiais',     pos: [ 0.14,  0.55, -0.14], yt: null },
  { id: 'panturrilha',  name: 'Panturrilha',       pos: [ 0.14,  0.08, -0.13], yt: null },
];

// ================================================================
// CENA
// ================================================================
const container = document.getElementById('bodyMapContainer');
const canvas    = document.getElementById('bodyCanvas');

const cW = () => container.clientWidth;
const cH = () => Math.min(cW() * 1.2, 660);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(cW(), cH());

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(46, cW() / cH(), 0.1, 50);
camera.position.set(0, 0.3, 4.2);

// ================================================================
// ORBIT CONTROLS — mouse drag + touch
// ================================================================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom    = false;
controls.enablePan     = false;
controls.target.set(0, 0.3, 0);
controls.rotateSpeed   = 0.75;
controls.dampingFactor = 0.10;
controls.enableDamping = true;
controls.autoRotate      = true;
controls.autoRotateSpeed = 1.8;
controls.update();

// ================================================================
// LUZES
// ================================================================
scene.add(new THREE.AmbientLight(0x001a44, 1.6));

function addLight(c, i, x, y, z, d = 14) {
  const l = new THREE.PointLight(c, i, d);
  l.position.set(x, y, z);
  scene.add(l);
  return l;
}
addLight(0x0088ff, 3.5,  0,  1.5,  6);   // frontal azul
addLight(0x0044cc, 2.2,  0,  1.5, -6);   // traseira azul
addLight(0x00ccff, 1.8, -5,  1,    0);   // rim esquerdo
addLight(0x00ccff, 1.8,  5,  1,    0);   // rim direito
addLight(0x004488, 1.2,  0, -2,    3);   // baixo

// ================================================================
// MATERIAIS
// ================================================================
const solidMat = new THREE.MeshPhongMaterial({
  color:             0x003a7a,
  emissive:          0x004fa8,
  emissiveIntensity: 0.55,
  transparent: true,
  opacity:     0.83,
  shininess:   100,
});

const wireMat = new THREE.MeshBasicMaterial({
  color:       0x1a9fff,
  wireframe:   true,
  transparent: true,
  opacity:     0.14,
});

// ================================================================
// CORPO HUMANO
// ================================================================
const bodyGroup = new THREE.Group();
bodyGroup.position.y = -0.72;
scene.add(bodyGroup);

function addPart(geo, x, y, z, rx = 0, ry = 0, rz = 0) {
  const s = new THREE.Mesh(geo, solidMat);
  const w = new THREE.Mesh(geo, wireMat);
  [s, w].forEach(m => { m.position.set(x, y, z); m.rotation.set(rx, ry, rz); });
  bodyGroup.add(s, w);
}

const S  = (r, ws = 24, hs = 16) => new THREE.SphereGeometry(r, ws, hs);
const C  = (rt, rb, h, s = 18)   => new THREE.CylinderGeometry(rt, rb, h, s);
const B  = (w, h, d)              => new THREE.BoxGeometry(w, h, d, 2, 2, 2);

// — Cabeça e pescoço
addPart(S(0.158, 32, 24),         0,     1.80,  0);
addPart(C(0.063, 0.074, 0.18),    0,     1.645, 0);

// — Tronco (3 segmentos)
addPart(C(0.235, 0.23, 0.30),     0,     1.455, 0);   // peito
addPart(C(0.22,  0.205,0.28),     0,     1.175, 0);   // torso médio
addPart(C(0.20,  0.185,0.22),     0,     0.905, 0);   // cintura
addPart(C(0.205, 0.180,0.20),     0,     0.718, 0);   // pelve

// — Peitoral (bulges frontais)
addPart(S(0.10, 16, 12),         -0.11,  1.43, 0.15);
addPart(S(0.10, 16, 12),          0.11,  1.43, 0.15);

// — Ombros
addPart(S(0.108, 16, 12),        -0.286, 1.546, 0);
addPart(S(0.108, 16, 12),         0.286, 1.546, 0);

// — Braço superior (E/D)
addPart(C(0.070, 0.062, 0.44),   -0.375, 1.235, 0, 0, 0,  0.24);
addPart(C(0.070, 0.062, 0.44),    0.375, 1.235, 0, 0, 0, -0.24);

// — Antebraço (E/D)
addPart(C(0.056, 0.044, 0.40),   -0.455, 0.855, 0, 0, 0,  0.13);
addPart(C(0.056, 0.044, 0.40),    0.455, 0.855, 0, 0, 0, -0.13);

// — Mãos
addPart(S(0.054),                -0.512, 0.640, 0);
addPart(S(0.054),                 0.512, 0.640, 0);

// — Coxa (E/D)
addPart(C(0.108, 0.096, 0.57),   -0.128, 0.572, 0);
addPart(C(0.108, 0.096, 0.57),    0.128, 0.572, 0);

// — Joelhos
addPart(S(0.094, 16, 12),        -0.128, 0.268, 0.04);
addPart(S(0.094, 16, 12),         0.128, 0.268, 0.04);

// — Perna inferior / panturrilha (E/D)
addPart(C(0.088, 0.064, 0.50),   -0.128, 0.002, 0);
addPart(C(0.088, 0.064, 0.50),    0.128, 0.002, 0);

// — Tornozelos
addPart(S(0.062, 12, 10),        -0.128, -0.268, 0);
addPart(S(0.062, 12, 10),         0.128, -0.268, 0);

// — Pés
addPart(B(0.12, 0.06, 0.24),    -0.128, -0.306, 0.06);
addPart(B(0.12, 0.06, 0.24),     0.128, -0.306, 0.06);

// ================================================================
// ANÉIS NO CHÃO (efeito holográfico)
// ================================================================
const floorY = -0.72 - 0.336;
const mkRing = (ri, ro) => {
  const m = new THREE.MeshBasicMaterial({
    color: 0x0077ff, transparent: true, opacity: 0.32, side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(ri, ro, 64), m);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y  = floorY;
  scene.add(ring);
  return ring;
};
const rings = [mkRing(0.30, 0.36), mkRing(0.16, 0.20), mkRing(0.46, 0.50)];

// ================================================================
// GLOW TEXTURE (canvas radial gradient)
// ================================================================
function makeGlowTex(hex) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const r = c.width / 2;
  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0.0,  hex + 'ff');
  g.addColorStop(0.35, hex + 'aa');
  g.addColorStop(1.0,  hex + '00');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);
  return new THREE.CanvasTexture(c);
}
const glowTexGold = makeGlowTex('#c5a059');
const glowTexBlue = makeGlowTex('#00ccff');

// ================================================================
// HOTSPOTS MUSCULARES
// ================================================================
const hotspotMeshes = [];

MUSCLES.forEach((m, i) => {
  const [x, y, z] = m.pos;

  // Esfera invisível para raycasting
  const hitMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.092, 8, 8),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitMesh.position.set(x, y, z);
  hitMesh.userData.muscle = m;
  bodyGroup.add(hitMesh);
  hotspotMeshes.push(hitMesh);

  // Ponto dourado visível
  const dotMat = new THREE.MeshBasicMaterial({ color: 0xc5a059 });
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), dotMat);
  dot.position.set(x, y, z);
  bodyGroup.add(dot);
  m.dot    = dot;
  m.dotMat = dotMat;

  // Sprite de glow
  const glowMat = new THREE.SpriteMaterial({
    map: glowTexGold,
    transparent: true,
    blending: THREE.AdditiveBlending,
    opacity: 0.65,
    depthWrite: false,
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.setScalar(0.13);
  glow.position.set(x, y, z);
  bodyGroup.add(glow);
  m.glow    = glow;
  m.glowMat = glowMat;
  m._idx    = i;
});

// ================================================================
// HOVER / INTERAÇÃO
// ================================================================
const raycaster = new THREE.Raycaster();
const mouse     = new THREE.Vector2();
const tooltip   = document.getElementById('muscleTooltip');
let hoveredMuscle = null;

function setHovered(m) {
  if (m === hoveredMuscle) return;
  if (hoveredMuscle) {
    hoveredMuscle.glowMat.map = glowTexGold;
    hoveredMuscle.glow.scale.setScalar(0.13);
    hoveredMuscle.dotMat.color.set(0xc5a059);
  }
  hoveredMuscle = m;
  if (m) {
    m.glowMat.map = glowTexBlue;
    m.glow.scale.setScalar(0.34);
    m.dotMat.color.set(0x00eeff);
  }
}

function castRay(nx, ny) {
  mouse.set(nx, ny);
  raycaster.setFromCamera(mouse, camera);
  return raycaster.intersectObjects(hotspotMeshes);
}

function showTooltip(m, cx, cy) {
  const rect   = canvas.getBoundingClientRect();
  const label  = m.yt ? '<br><small style="color:#7ad">Clique para ver dica ▶</small>' : '<br><small style="color:#888">Vídeo em breve 🔜</small>';
  tooltip.innerHTML = `<strong>${m.name}</strong>${label}`;
  tooltip.style.opacity = '1';
  const tx = Math.min(cx - rect.left + 18, rect.width  - 190);
  const ty = Math.max(cy - rect.top  - 55, 8);
  tooltip.style.left = tx + 'px';
  tooltip.style.top  = ty + 'px';
}

// Mouse move
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const nx   =  (e.clientX - rect.left) / rect.width  * 2 - 1;
  const ny   = -(e.clientY - rect.top)  / rect.height * 2 + 1;
  const hits = castRay(nx, ny);
  if (hits.length) {
    const m = hits[0].object.userData.muscle;
    setHovered(m);
    showTooltip(m, e.clientX, e.clientY);
    canvas.style.cursor = 'pointer';
  } else {
    setHovered(null);
    tooltip.style.opacity = '0';
    canvas.style.cursor   = 'grab';
  }
});

canvas.addEventListener('mouseleave', () => {
  setHovered(null);
  tooltip.style.opacity = '0';
});

// Click (desktop)
canvas.addEventListener('click', () => {
  if (hoveredMuscle?.yt) openModal(hoveredMuscle.yt, hoveredMuscle.name);
});

// Touch (mobile)
let touchStart = { x: 0, y: 0, t: 0 };
canvas.addEventListener('touchstart', e => {
  const t = e.touches[0];
  touchStart = { x: t.clientX, y: t.clientY, t: Date.now() };
}, { passive: true });

canvas.addEventListener('touchend', e => {
  const t  = e.changedTouches[0];
  const dx = Math.abs(t.clientX - touchStart.x);
  const dy = Math.abs(t.clientY - touchStart.y);
  const dt = Date.now() - touchStart.t;
  if (dx < 10 && dy < 10 && dt < 300) {   // tap rápido
    const rect = canvas.getBoundingClientRect();
    const nx   =  (t.clientX - rect.left) / rect.width  * 2 - 1;
    const ny   = -(t.clientY - rect.top)  / rect.height * 2 + 1;
    const hits = castRay(nx, ny);
    if (hits.length) {
      const m = hits[0].object.userData.muscle;
      setHovered(m);
      showTooltip(m, t.clientX, t.clientY);
      if (m.yt) setTimeout(() => openModal(m.yt, m.name), 250);
      setTimeout(() => {
        setHovered(null);
        tooltip.style.opacity = '0';
      }, 3000);
    }
  }
}, { passive: true });

// ================================================================
// MODAL YOUTUBE
// ================================================================
function openModal(ytId, name) {
  document.getElementById('ytTitle').textContent = name;
  document.getElementById('ytFrame').src =
    `https://www.youtube.com/embed/${ytId}?autoplay=1`;
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
// AUTO-ROTAÇÃO — para quando o usuário interage, retoma depois
// ================================================================
controls.addEventListener('start', () => { controls.autoRotate = false; });
controls.addEventListener('end',   () => {
    setTimeout(() => { controls.autoRotate = true; }, 3000);
});

// ================================================================
// LOOP DE ANIMAÇÃO
// ================================================================
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // Pulso dos hotspots
  MUSCLES.forEach((m, i) => {
    if (!m.glowMat) return;
    const isHov = m === hoveredMuscle;
    if (isHov) {
      m.glowMat.opacity = 0.90 + 0.10 * Math.sin(t * 7);
      m.glow.scale.setScalar(0.30 + 0.06 * Math.sin(t * 6));
    } else {
      m.glowMat.opacity = 0.38 + 0.27 * Math.sin(t * 2.8 + i * 0.85);
    }
  });

  // Pulso dos anéis
  rings.forEach((r, i) => {
    r.material.opacity = 0.16 + 0.14 * Math.sin(t * 1.6 + i * 1.2);
  });

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
