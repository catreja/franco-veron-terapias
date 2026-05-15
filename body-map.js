// body-map.js — Corpo Humano 3D Holográfico v2
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ================================================================
// GRUPOS MUSCULARES
// ================================================================
const MUSCLES = [
  { id: 'cervical',    name: 'Cervical',        pos: [ 0.00,  1.67,  0.09], yt: null },
  { id: 'peitoral',    name: 'Peitoral',        pos: [ 0.00,  1.40,  0.24], yt: null },
  { id: 'abdomen',     name: 'Abdômen',         pos: [ 0.00,  1.06,  0.22], yt: null },
  { id: 'deltoides',   name: 'Deltóide',        pos: [ 0.31,  1.54,  0.07], yt: null },
  { id: 'biceps',      name: 'Bíceps',          pos: [ 0.40,  1.24,  0.12], yt: null },
  { id: 'quadriceps',  name: 'Quadríceps',      pos: [ 0.14,  0.57,  0.14], yt: null },
  { id: 'tibial',      name: 'Tibial Anterior', pos: [ 0.14,  0.09,  0.13], yt: null },
  { id: 'trapezio',    name: 'Trapézio',        pos: [ 0.00,  1.55, -0.22], yt: null },
  { id: 'dorsais',     name: 'Dorsais',         pos: [ 0.20,  1.22, -0.22], yt: null },
  { id: 'triceps',     name: 'Tríceps',         pos: [ 0.41,  1.24, -0.12], yt: null },
  { id: 'lombar',      name: 'Lombar',          pos: [ 0.00,  0.95, -0.22], yt: null },
  { id: 'gluteos',     name: 'Glúteos',         pos: [ 0.13,  0.70, -0.20], yt: null },
  { id: 'isquiotib',   name: 'Isquiotibiais',   pos: [ 0.14,  0.54, -0.15], yt: null },
  { id: 'panturrilha', name: 'Panturrilha',     pos: [ 0.14,  0.09, -0.14], yt: null },
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
renderer.shadowMap.enabled = false;

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(44, cW() / cH(), 0.1, 50);
camera.position.set(0, 0.3, 4.4);

// ================================================================
// ORBIT CONTROLS
// ================================================================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom    = false;
controls.enablePan     = false;
controls.target.set(0, 0.3, 0);
controls.rotateSpeed   = 0.75;
controls.dampingFactor = 0.10;
controls.enableDamping = true;
controls.autoRotate      = true;
controls.autoRotateSpeed = 1.6;
controls.update();

controls.addEventListener('start', () => { controls.autoRotate = false; });
controls.addEventListener('end',   () => { setTimeout(() => controls.autoRotate = true, 3000); });

// ================================================================
// LUZES
// ================================================================
scene.add(new THREE.AmbientLight(0x001a44, 1.8));
const pl = (c,i,x,y,z,d=16) => { const l=new THREE.PointLight(c,i,d); l.position.set(x,y,z); scene.add(l); return l; };
pl(0x0099ff, 4.0,  0,  1.6,  6);
pl(0x0055cc, 2.5,  0,  1.6, -6);
pl(0x00ccff, 2.0, -5,  1,    0);
pl(0x00ccff, 2.0,  5,  1,    0);
pl(0x003388, 1.2,  0, -2,    3);
pl(0x0077ff, 1.5,  0,  3.5,  0);

// ================================================================
// MATERIAIS
// ================================================================
const solidMat = new THREE.MeshPhongMaterial({
  color: 0x002e6e, emissive: 0x0050b0, emissiveIntensity: 0.6,
  transparent: true, opacity: 0.88, shininess: 120,
});
const wireMat = new THREE.MeshBasicMaterial({
  color: 0x22aaff, wireframe: true, transparent: true, opacity: 0.18,
});

// ================================================================
// HELPERS DE GEOMETRIA
// ================================================================
const bodyGroup = new THREE.Group();
bodyGroup.position.y = -0.72;
scene.add(bodyGroup);

function addPart(geo, x, y, z, rx=0, ry=0, rz=0) {
  const s = new THREE.Mesh(geo, solidMat);
  const w = new THREE.Mesh(geo, wireMat);
  [s, w].forEach(m => { m.position.set(x,y,z); m.rotation.set(rx,ry,rz); });
  bodyGroup.add(s, w);
  return s;
}

function cyl(rt, rb, h, seg=22) { return new THREE.CylinderGeometry(rt,rb,h,seg); }
function sph(r, ws=32, hs=24)   { return new THREE.SphereGeometry(r,ws,hs); }
function ell(rx,ry,rz) {
  const g = new THREE.SphereGeometry(1,32,24);
  g.scale(rx,ry,rz); return g;
}

// ================================================================
// CORPO — ANATOMIA DETALHADA
// ================================================================

// CABEÇA (levemente ovalada)
addPart(ell(0.148, 0.182, 0.152), 0, 1.81, 0);

// PESCOÇO muscular
addPart(cyl(0.076, 0.088, 0.22, 18), 0, 1.650, 0);

// TRAPÉZIO / OMBROS (base larga)
addPart(ell(0.28, 0.07, 0.16), 0, 1.540, -0.04);

// CLAVÍCULA / PEITO SUPERIOR
addPart(cyl(0.26, 0.255, 0.14, 22), 0, 1.520, 0);

// PEITORAIS — dois lobos musculares proeminentes
addPart(ell(0.155, 0.098, 0.125), -0.115, 1.430, 0.130);
addPart(ell(0.155, 0.098, 0.125),  0.115, 1.430, 0.130);

// TRONCO — 4 segmentos para forma orgânica
addPart(cyl(0.245, 0.235, 0.22, 22), 0, 1.380, 0);  // peito baixo
addPart(cyl(0.228, 0.210, 0.22, 22), 0, 1.160, 0);  // solar plexo
addPart(cyl(0.205, 0.192, 0.20, 22), 0, 0.960, 0);  // cintura
addPart(cyl(0.212, 0.220, 0.22, 22), 0, 0.760, 0);  // pelve

// SERRÁTIL / OBLÍQUOS (lados do torso)
addPart(ell(0.06, 0.14, 0.07), -0.22, 1.25, 0.05);
addPart(ell(0.06, 0.14, 0.07),  0.22, 1.25, 0.05);

// DORSAIS / LATÍSSIMO (alargam as costas)
addPart(ell(0.14, 0.20, 0.09), -0.27, 1.24, -0.07);
addPart(ell(0.14, 0.20, 0.09),  0.27, 1.24, -0.07);

// GLÚTEOS (traseiro)
addPart(ell(0.145, 0.118, 0.105), -0.118, 0.700, -0.120);
addPart(ell(0.145, 0.118, 0.105),  0.118, 0.700, -0.120);

// DELTOIDES — ombros arredondados
addPart(ell(0.135, 0.125, 0.122), -0.295, 1.550, 0);
addPart(ell(0.135, 0.125, 0.122),  0.295, 1.550, 0);

// BRAÇO SUPERIOR — tubo com bíceps e tríceps
addPart(cyl(0.082, 0.070, 0.44, 18), -0.375, 1.235, 0, 0,0,  0.24);
addPart(cyl(0.082, 0.070, 0.44, 18),  0.375, 1.235, 0, 0,0, -0.24);
// Bíceps
addPart(ell(0.078, 0.068, 0.078), -0.408, 1.28, 0.085, 0,0,  0.24);
addPart(ell(0.078, 0.068, 0.078),  0.408, 1.28, 0.085, 0,0, -0.24);
// Tríceps (traseiro)
addPart(ell(0.072, 0.090, 0.068), -0.400, 1.20, -0.085, 0,0,  0.22);
addPart(ell(0.072, 0.090, 0.068),  0.400, 1.20, -0.085, 0,0, -0.22);

// ANTEBRAÇO
addPart(cyl(0.065, 0.048, 0.42, 16), -0.455, 0.855, 0, 0,0,  0.13);
addPart(cyl(0.065, 0.048, 0.42, 16),  0.455, 0.855, 0, 0,0, -0.13);

// MÃOS
addPart(ell(0.058, 0.050, 0.042), -0.515, 0.635, 0);
addPart(ell(0.058, 0.050, 0.042),  0.515, 0.635, 0);

// COXA SUPERIOR — com quadríceps
addPart(cyl(0.122, 0.108, 0.57, 22), -0.130, 0.572, 0);
addPart(cyl(0.122, 0.108, 0.57, 22),  0.130, 0.572, 0);
// Quadríceps (frente da coxa)
addPart(ell(0.100, 0.162, 0.088), -0.130, 0.575, 0.096);
addPart(ell(0.100, 0.162, 0.088),  0.130, 0.575, 0.096);
// Isquiotibiais (traseiro)
addPart(ell(0.090, 0.145, 0.075), -0.130, 0.560, -0.096);
addPart(ell(0.090, 0.145, 0.075),  0.130, 0.560, -0.096);

// JOELHOS
addPart(ell(0.100, 0.092, 0.095), -0.130, 0.268, 0.038);
addPart(ell(0.100, 0.092, 0.095),  0.130, 0.268, 0.038);

// PERNA INFERIOR
addPart(cyl(0.095, 0.065, 0.50, 20), -0.130, 0.002, 0);
addPart(cyl(0.095, 0.065, 0.50, 20),  0.130, 0.002, 0);
// Panturrilha (gastrocnêmio)
addPart(ell(0.080, 0.135, 0.072), -0.130, 0.11, -0.080);
addPart(ell(0.080, 0.135, 0.072),  0.130, 0.11, -0.080);

// TORNOZELOS
addPart(sph(0.066, 14, 12), -0.130, -0.270, 0);
addPart(sph(0.066, 14, 12),  0.130, -0.270, 0);

// PÉS
addPart(ell(0.062, 0.032, 0.130), -0.130, -0.308, 0.068);
addPart(ell(0.062, 0.032, 0.130),  0.130, -0.308, 0.068);

// ================================================================
// ANÉIS HOLOGRÁFICOS NO CHÃO
// ================================================================
const floorY = -0.72 - 0.340;
const mkRing = (ri, ro) => {
  const m    = new THREE.MeshBasicMaterial({ color:0x0088ff, transparent:true, opacity:0.30, side:THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.RingGeometry(ri,ro,64), m);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y  = floorY;
  scene.add(ring);
  return ring;
};
const rings = [mkRing(0.28,0.34), mkRing(0.14,0.18), mkRing(0.44,0.49)];

// ================================================================
// SCAN LINE (varredura holográfica)
// ================================================================
const scanMat = new THREE.MeshBasicMaterial({
  color: 0x00ccff, transparent: true, opacity: 0.35,
  side: THREE.DoubleSide, depthWrite: false,
});
const scanLine = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.012), scanMat);
scene.add(scanLine);

// ================================================================
// PARTÍCULAS
// ================================================================
const pCount = 280;
const pPos   = new Float32Array(pCount * 3);
const pSpeed = new Float32Array(pCount);
for (let i = 0; i < pCount; i++) {
  const theta = Math.random() * Math.PI * 2;
  const phi   = Math.acos(2 * Math.random() - 1);
  const r     = 0.85 + Math.random() * 0.75;
  pPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
  pPos[i*3+1] = r * Math.cos(phi) * 0.85 + 0.35;
  pPos[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
  pSpeed[i]   = 0.3 + Math.random() * 0.7;
}
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const pMat = new THREE.PointsMaterial({
  color: 0x0099ff, size: 0.018, transparent: true, opacity: 0.55,
  blending: THREE.AdditiveBlending, depthWrite: false,
});
const particles = new THREE.Points(pGeo, pMat);
scene.add(particles);

// ================================================================
// GLOW TEXTURE
// ================================================================
function makeGlowTex(hex) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const ctx = c.getContext('2d'), r = 64;
  const g = ctx.createRadialGradient(r,r,0,r,r,r);
  g.addColorStop(0.0, hex+'ff'); g.addColorStop(0.35, hex+'aa'); g.addColorStop(1.0, hex+'00');
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
    new THREE.SphereGeometry(0.092, 8, 8),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hit.position.set(x, y, z);
  hit.userData.muscle = m;
  bodyGroup.add(hit);
  hotspotMeshes.push(hit);

  const dotMat = new THREE.MeshBasicMaterial({ color: 0xc5a059 });
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), dotMat);
  dot.position.set(x, y, z);
  bodyGroup.add(dot);
  m.dotMat = dotMat;

  const glowMat = new THREE.SpriteMaterial({
    map: glowGold, transparent: true,
    blending: THREE.AdditiveBlending, opacity: 0.6, depthWrite: false,
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.setScalar(0.13);
  glow.position.set(x, y, z);
  bodyGroup.add(glow);
  m.glow = glow; m.glowMat = glowMat; m._i = i;
});

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
    hoveredMuscle.glow.scale.setScalar(0.13);
    hoveredMuscle.dotMat.color.set(0xc5a059);
  }
  hoveredMuscle = m;
  if (m) {
    m.glowMat.map = glowBlue;
    m.glow.scale.setScalar(0.36);
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
  const extra = m.yt ? '<br><small style="color:#7ad">▶ Clique para ver dica</small>' : '<br><small style="color:#666">Vídeo em breve 🔜</small>';
  tooltip.innerHTML = `<strong>${m.name}</strong>${extra}`;
  tooltip.style.opacity = '1';
  tooltip.style.left = Math.min(cx - rect.left + 18, rect.width - 195) + 'px';
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
canvas.addEventListener('click', () => { if (hoveredMuscle?.yt) openModal(hoveredMuscle.yt, hoveredMuscle.name); });

// Touch
let ts = { x:0, y:0, t:0 };
canvas.addEventListener('touchstart', e => { const t=e.touches[0]; ts={x:t.clientX,y:t.clientY,t:Date.now()}; }, {passive:true});
canvas.addEventListener('touchend', e => {
  const t=e.changedTouches[0], dx=Math.abs(t.clientX-ts.x), dy=Math.abs(t.clientY-ts.y), dt=Date.now()-ts.t;
  if (dx<10&&dy<10&&dt<300) {
    const r=canvas.getBoundingClientRect();
    const hits=castRay((t.clientX-r.left)/r.width*2-1, -((t.clientY-r.top)/r.height)*2+1);
    if (hits.length) {
      const m=hits[0].object.userData.muscle;
      setHovered(m); showTip(m,t.clientX,t.clientY);
      if (m.yt) setTimeout(()=>openModal(m.yt,m.name),200);
      setTimeout(()=>{setHovered(null);tooltip.style.opacity='0';},3200);
    }
  }
},{passive:true});

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
document.getElementById('ytModal').addEventListener('click', e => { if(e.target===document.getElementById('ytModal')) closeModal(); });

// ================================================================
// LOOP DE ANIMAÇÃO
// ================================================================
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // Pulso dos hotspots
  MUSCLES.forEach(m => {
    if (!m.glowMat) return;
    const h = m === hoveredMuscle;
    m.glowMat.opacity = h
      ? 0.88 + 0.12 * Math.sin(t * 7)
      : 0.35 + 0.30 * Math.sin(t * 2.6 + m._i * 0.9);
    if (h) m.glow.scale.setScalar(0.30 + 0.07 * Math.sin(t * 6));
  });

  // Scan line (sobe e desce)
  const scanMin  = floorY + 0.05;
  const scanMax  = floorY + 2.60;
  const scanFrac = (t * 0.45) % 1.0;
  scanLine.position.y = scanMin + (scanMax - scanMin) * scanFrac;
  scanMat.opacity = 0.18 + 0.28 * Math.sin(scanFrac * Math.PI);

  // Anéis
  rings.forEach((r, i) => { r.material.opacity = 0.15 + 0.15 * Math.sin(t * 1.6 + i * 1.2); });

  // Partículas
  particles.rotation.y += 0.0018;
  pMat.opacity = 0.45 + 0.10 * Math.sin(t * 0.8);

  controls.update();
  renderer.render(scene, camera);
}
animate();

// ================================================================
// RESPONSIVO
// ================================================================
new ResizeObserver(() => {
  const w=cW(), h=cH();
  camera.aspect = w/h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}).observe(container);
