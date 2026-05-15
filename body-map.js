// body-map.js — Corpo Humano 3D Holográfico v3 (GLTF real)
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader }    from 'three/addons/loaders/GLTFLoader.js';

// ================================================================
// GRUPOS MUSCULARES (posições ajustadas ao modelo Soldier)
// ================================================================
const MUSCLES = [
  { id: 'cervical',    name: 'Cervical',        pos: [ 0.00,  1.62,  0.06], yt: null },
  { id: 'peitoral',    name: 'Peitoral',        pos: [ 0.00,  1.38,  0.14], yt: null },
  { id: 'abdomen',     name: 'Abdômen',         pos: [ 0.00,  1.10,  0.12], yt: null },
  { id: 'deltoides',   name: 'Deltóide',        pos: [ 0.30,  1.50,  0.04], yt: null },
  { id: 'biceps',      name: 'Bíceps',          pos: [ 0.42,  1.22,  0.08], yt: null },
  { id: 'quadriceps',  name: 'Quadríceps',      pos: [ 0.16,  0.55,  0.10], yt: null },
  { id: 'tibial',      name: 'Tibial Anterior', pos: [ 0.16,  0.16,  0.10], yt: null },
  { id: 'trapezio',    name: 'Trapézio',        pos: [ 0.00,  1.52, -0.14], yt: null },
  { id: 'dorsais',     name: 'Dorsais',         pos: [ 0.22,  1.20, -0.14], yt: null },
  { id: 'triceps',     name: 'Tríceps',         pos: [ 0.42,  1.22, -0.08], yt: null },
  { id: 'lombar',      name: 'Lombar',          pos: [ 0.00,  0.92, -0.12], yt: null },
  { id: 'gluteos',     name: 'Glúteos',         pos: [ 0.14,  0.72, -0.16], yt: null },
  { id: 'isquiotib',   name: 'Isquiotibiais',   pos: [ 0.16,  0.52, -0.10], yt: null },
  { id: 'panturrilha', name: 'Panturrilha',     pos: [ 0.16,  0.16, -0.12], yt: null },
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
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(44, cW() / cH(), 0.1, 50);
camera.position.set(0, 0.9, 3.8);

// ================================================================
// ORBIT CONTROLS
// ================================================================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom    = false;
controls.enablePan     = false;
controls.target.set(0, 0.9, 0);
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
const pl = (c,i,x,y,z,d=20) => { const l=new THREE.PointLight(c,i,d); l.position.set(x,y,z); scene.add(l); return l; };
pl(0x0099ff, 5.0,  0, 2.0,  6);
pl(0x0055cc, 3.0,  0, 2.0, -6);
pl(0x00ccff, 2.5, -5, 1.2,  0);
pl(0x00ccff, 2.5,  5, 1.2,  0);
pl(0x003388, 1.5,  0,-1.0,  3);
pl(0x0077ff, 2.0,  0, 4.0,  0);

// ================================================================
// MATERIAIS HOLOGRÁFICOS
// ================================================================
const holoSolid = new THREE.MeshPhongMaterial({
  color:             0x003080,
  emissive:          0x0055cc,
  emissiveIntensity: 0.8,
  transparent:       true,
  opacity:           0.70,
  shininess:         180,
  side:              THREE.FrontSide,
});
const holoWire = new THREE.MeshBasicMaterial({
  color:       0x33aaff,
  wireframe:   true,
  transparent: true,
  opacity:     0.22,
});

// ================================================================
// GLOW TEXTURE HELPER
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
// LOADING OVERLAY
// ================================================================
const loadDiv = document.createElement('div');
Object.assign(loadDiv.style, {
  position:'absolute', inset:'0', display:'flex',
  alignItems:'center', justifyContent:'center',
  color:'#4af', fontFamily:'monospace', fontSize:'14px',
  letterSpacing:'2px', pointerEvents:'none',
  background: 'radial-gradient(ellipse at center, #001a44 0%, #000510 100%)',
});
loadDiv.innerHTML = '<span>⟳ CARREGANDO MODELO...</span>';
container.style.position = 'relative';
container.appendChild(loadDiv);

// ================================================================
// HOTSPOT MESHES (invisíveis, para raycasting)
// ================================================================
const hotspotMeshes = [];
const bodyGroup     = new THREE.Group();
bodyGroup.position.y = -0.72;
scene.add(bodyGroup);

MUSCLES.forEach((m, i) => {
  const [x, y, z] = m.pos;

  // Esfera invisível para raycast
  const hit = new THREE.Mesh(
    new THREE.SphereGeometry(0.10, 8, 8),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hit.position.set(x, y, z);
  hit.userData.muscle = m;
  bodyGroup.add(hit);
  hotspotMeshes.push(hit);

  // Ponto dourado
  const dotMat = new THREE.MeshBasicMaterial({ color: 0xc5a059 });
  const dot    = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), dotMat);
  dot.position.set(x, y, z);
  bodyGroup.add(dot);
  m.dotMat = dotMat;

  // Sprite glow
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
const mkRing = (ri, ro, op=0.30) => {
  const m    = new THREE.MeshBasicMaterial({ color:0x0088ff, transparent:true, opacity:op, side:THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.RingGeometry(ri, ro, 72), m);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y  = FLOOR_Y;
  scene.add(ring);
  return ring;
};
const rings = [mkRing(0.25,0.30), mkRing(0.40,0.44), mkRing(0.56,0.60,0.18)];

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
const pCount = 320;
const pPos   = new Float32Array(pCount * 3);
const pSpeed = new Float32Array(pCount);
for (let i = 0; i < pCount; i++) {
  const theta  = Math.random() * Math.PI * 2;
  const phi    = Math.acos(2 * Math.random() - 1);
  const r      = 1.0 + Math.random() * 0.8;
  pPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
  pPos[i*3+1] = r * Math.cos(phi) * 0.9 + 0.9;
  pPos[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
  pSpeed[i]   = 0.3 + Math.random() * 0.7;
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
// CARREGA MODELO GLB
// ================================================================
const loader = new GLTFLoader();
loader.load(
  'models/body.glb',
  (gltf) => {
    const model = gltf.scene;

    // Calcula bounding box para normalizar escala e posição
    const box = new THREE.Box3().setFromObject(model);
    const sz  = box.getSize(new THREE.Vector3());
    const ct  = box.getCenter(new THREE.Vector3());
    const scl = 1.80 / sz.y;          // escala para ~1.80 units de altura

    model.scale.setScalar(scl);
    model.position.set(-ct.x * scl, -box.min.y * scl, -ct.z * scl);

    // Aplica material holográfico em cada mesh
    model.traverse(child => {
      if (!child.isMesh) return;
      child.castShadow    = false;
      child.receiveShadow = false;

      // Sólido holográfico
      child.material = holoSolid.clone();

      // Wireframe overlay
      const wf = new THREE.Mesh(child.geometry, holoWire.clone());
      wf.renderOrder = 1;
      child.add(wf);
    });

    bodyGroup.add(model);

    // Remove overlay de loading
    loadDiv.remove();
  },
  (xhr) => {
    const pct = Math.round(xhr.loaded / xhr.total * 100);
    loadDiv.querySelector('span').textContent = `⟳ CARREGANDO... ${pct}%`;
  },
  (err) => {
    console.error('Erro ao carregar modelo:', err);
    loadDiv.querySelector('span').textContent = '⚠ Erro ao carregar modelo';
  }
);

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
    m.glow.scale.setScalar(0.38);
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

// Touch
let ts = { x:0, y:0, t:0 };
canvas.addEventListener('touchstart', e => {
  const t = e.touches[0]; ts = { x:t.clientX, y:t.clientY, t:Date.now() };
}, { passive:true });
canvas.addEventListener('touchend', e => {
  const t  = e.changedTouches[0];
  const dx = Math.abs(t.clientX - ts.x);
  const dy = Math.abs(t.clientY - ts.y);
  const dt = Date.now() - ts.t;
  if (dx < 10 && dy < 10 && dt < 300) {
    const r    = canvas.getBoundingClientRect();
    const hits = castRay(
      (t.clientX - r.left) / r.width  * 2 - 1,
      -((t.clientY - r.top) / r.height) * 2 + 1
    );
    if (hits.length) {
      const m = hits[0].object.userData.muscle;
      setHovered(m); showTip(m, t.clientX, t.clientY);
      if (m.yt) setTimeout(() => openModal(m.yt, m.name), 200);
      setTimeout(() => { setHovered(null); tooltip.style.opacity = '0'; }, 3200);
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

  // Pulso dos hotspots
  MUSCLES.forEach(m => {
    if (!m.glowMat) return;
    const h = m === hoveredMuscle;
    m.glowMat.opacity = h
      ? 0.85 + 0.15 * Math.sin(t * 7)
      : 0.30 + 0.28 * Math.sin(t * 2.4 + m._i * 0.9);
    if (h) m.glow.scale.setScalar(0.30 + 0.09 * Math.sin(t * 6));
  });

  // Scan line
  const scanMin  = FLOOR_Y + 0.05;
  const scanMax  = FLOOR_Y + 2.85;
  const scanFrac = (t * 0.42) % 1.0;
  scanLine.position.y = scanMin + (scanMax - scanMin) * scanFrac;
  scanMat.opacity     = 0.15 + 0.30 * Math.sin(scanFrac * Math.PI);

  // Anéis
  rings.forEach((r, i) => {
    r.material.opacity = 0.12 + 0.14 * Math.sin(t * 1.5 + i * 1.2);
  });

  // Partículas giram lentamente
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
