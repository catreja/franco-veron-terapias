// body-map.js — v9: GLB real + destaque muscular por elipsoide no shader
import * as THREE from 'three';
import { OrbitControls }   from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader }      from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/* ════════════════════════════════════════════════════════════════
   GRUPOS MUSCULARES
   pos : centro do hotspot no espaço LOCAL do bodyGroup
   hl  : meios-eixos do elipsoide de destaque  [rx, ry, rz]
   (bilateral: mirror em -x é aplicado automaticamente)
   yt  : id do vídeo YouTube (null = em breve)
   ════════════════════════════════════════════════════════════════ */
const MUSCLES = [
  { id:'cervical',    name:'Cervical',        pos:[ 0.00, 1.62,  0.04], hl:[0.08,0.12,0.08], yt:null },
  { id:'trapezio',    name:'Trapézio',        pos:[ 0.00, 1.56, -0.05], hl:[0.34,0.09,0.14], yt:null },
  { id:'peitoral',    name:'Peitoral',        pos:[ 0.00, 1.40,  0.14], hl:[0.30,0.16,0.18], yt:null },
  { id:'abdomen',     name:'Abdômen',         pos:[ 0.00, 1.10,  0.14], hl:[0.22,0.24,0.13], yt:null },
  { id:'deltoides',   name:'Deltóide',        pos:[ 0.30, 1.58,  0.00], hl:[0.18,0.16,0.16], yt:null },
  { id:'biceps',      name:'Bíceps',          pos:[ 0.48, 1.36,  0.00], hl:[0.12,0.22,0.12], yt:null },
  { id:'triceps',     name:'Tríceps',         pos:[ 0.48, 1.30,  0.00], hl:[0.12,0.22,0.12], yt:null },
  { id:'dorsais',     name:'Dorsais',         pos:[ 0.28, 1.26, -0.10], hl:[0.24,0.28,0.12], yt:null },
  { id:'lombar',      name:'Lombar',          pos:[ 0.00, 0.90, -0.14], hl:[0.22,0.11,0.11], yt:null },
  { id:'gluteos',     name:'Glúteos',         pos:[ 0.14, 0.72, -0.14], hl:[0.20,0.16,0.15], yt:null },
  { id:'quadriceps',  name:'Quadríceps',      pos:[ 0.14, 0.58,  0.14], hl:[0.16,0.28,0.15], yt:null },
  { id:'isquiotib',   name:'Isquiotibiais',   pos:[ 0.14, 0.52, -0.12], hl:[0.14,0.26,0.12], yt:null },
  { id:'panturrilha', name:'Panturrilha',     pos:[ 0.14, 0.18, -0.10], hl:[0.10,0.20,0.10], yt:null },
  { id:'tibial',      name:'Tibial Anterior', pos:[ 0.14, 0.18,  0.08], hl:[0.08,0.20,0.08], yt:null },
];

/* ════════════════════════════════════════════════════════════════
   CENA
   ════════════════════════════════════════════════════════════════ */
const container = document.getElementById('bodyMapContainer');
const canvas    = document.getElementById('bodyCanvas');
const cW = () => container.clientWidth;
const cH = () => Math.min(cW() * 1.22, 680);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(cW(), cH());
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping      = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000308);

const camera = new THREE.PerspectiveCamera(44, cW() / cH(), 0.1, 50);
camera.position.set(0, 0.9, 5.8);

/* ════════════════════════════════════════════════════════════════
   BLOOM
   ════════════════════════════════════════════════════════════════ */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(cW(), cH()), 0.95, 0.45, 0.20);
composer.addPass(bloom);

/* ════════════════════════════════════════════════════════════════
   ORBIT CONTROLS
   ════════════════════════════════════════════════════════════════ */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom    = false;
controls.enablePan     = false;
controls.target.set(0, 0.9, 0);
controls.rotateSpeed   = 0.75;
controls.dampingFactor = 0.10;
controls.enableDamping = true;
controls.autoRotate      = true;
controls.autoRotateSpeed = 1.2;
controls.update();
controls.addEventListener('start', () => { controls.autoRotate = false; });
controls.addEventListener('end',   () => { setTimeout(() => controls.autoRotate = true, 3000); });

/* ════════════════════════════════════════════════════════════════
   LUZES
   ════════════════════════════════════════════════════════════════ */
scene.add(new THREE.AmbientLight(0x1a3a5c, 3.5));
[
  [0x5588cc, 8.0,  0, 2.2,  8],   // frente — azul médio
  [0x2255aa, 5.0,  0, 2.2, -8],   // costas
  [0x00aadd, 5.0, -6, 1.2,  0],   // lateral esq — toque ciano
  [0x00aadd, 5.0,  6, 1.2,  0],   // lateral dir
  [0x3366bb, 4.0,  0, 5.5,  0],   // topo
  [0x112244, 3.0,  0,-1.8,  0],   // baixo — escuro
  [0x44aaff, 3.5,  0, 1.0,  3.5], // preenchimento frontal
].forEach(([c,i,x,y,z]) => {
  const l = new THREE.PointLight(c, i, 22);
  l.position.set(x, y, z);
  scene.add(l);
});

/* ════════════════════════════════════════════════════════════════
   SHADERS HOLOGRÁFICOS  (destaque via elipsoide no mundo)
   ════════════════════════════════════════════════════════════════ */
const VERT = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main(){
    vec4 wp   = modelMatrix * vec4(position,1.);
    vWorldPos = wp.xyz;
    vNormal   = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.);
  }
`;

const FRAG = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  uniform float uTime;
  uniform vec3  uBase;

  // ── destaque muscular bilateral ──
  uniform vec3  uHlC;
  uniform vec3  uHlC2;
  uniform vec3  uHlS;
  uniform float uHlStr;

  void main(){
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float nDotV  = max(dot(vNormal, viewDir), 0.0);

    // Sombreamento sólido: variação suave por ângulo de visão
    float shade = 0.55 + 0.45 * nDotV;
    vec3  col   = uBase * shade;

    // Leve brilho azul-ciano nas bordas (rim light sutil)
    float rim = pow(1.0 - nDotV, 3.5) * 0.35;
    col += vec3(0.0, 0.45, 0.80) * rim;

    // ── anel vermelho no hover ──
    if(uHlStr > .001){
      vec3 dA = (vWorldPos - uHlC)  / max(uHlS, vec3(.001));
      vec3 dB = (vWorldPos - uHlC2) / max(uHlS, vec3(.001));
      float lA = length(dA);
      float lB = length(dB);

      float ringA = smoothstep(0.55, 1.0, lA) * smoothstep(1.45, 1.0, lA);
      float ringB = smoothstep(0.55, 1.0, lB) * smoothstep(1.45, 1.0, lB);
      float ring  = max(ringA, ringB) * uHlStr;

      float fillA = 1.0 - smoothstep(0.0, 1.0, lA);
      float fillB = 1.0 - smoothstep(0.0, 1.0, lB);
      float fill  = max(fillA, fillB) * uHlStr * 0.18;

      float pulse = 1.0 + 0.4 * sin(uTime * 6.5);
      col = mix(col, vec3(1.0, 0.05, 0.02) * pulse, ring * 0.92);
      col = mix(col, vec3(0.22, 0.02, 0.02), fill);
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ════════════════════════════════════════════════════════════════
   UNIFORMS COMPARTILHADOS  (uma referência → todos os materiais)
   ════════════════════════════════════════════════════════════════ */
const uTime  = { value: 0 };
const uHlC   = { value: new THREE.Vector3(0, 999, 0) };
const uHlC2  = { value: new THREE.Vector3(0, 999, 0) };
const uHlS   = { value: new THREE.Vector3(0.1, 0.1, 0.1) };
const uHlStr = { value: 0.0 };

function makeHoloMat() {
  return new THREE.ShaderMaterial({
    vertexShader:   VERT,
    fragmentShader: FRAG,
    uniforms: {
      uTime, uHlC, uHlC2, uHlS, uHlStr,
      uBase: { value: new THREE.Color(0x0b1e36) },  // azul-cinza escuro sólido
    },
    transparent: false,
    depthWrite:  true,
    side: THREE.FrontSide,
  });
}

const edgeMat = new THREE.LineBasicMaterial({ color: 0x00ddff, transparent: true, opacity: 1.0 });

/* ════════════════════════════════════════════════════════════════
   GRUPO DO CORPO
   ════════════════════════════════════════════════════════════════ */
const bodyGroup = new THREE.Group();
bodyGroup.position.y = -0.72;
scene.add(bodyGroup);

/* ════════════════════════════════════════════════════════════════
   LOADING OVERLAY
   ════════════════════════════════════════════════════════════════ */
container.style.position = 'relative';
const loadDiv = document.createElement('div');
Object.assign(loadDiv.style, {
  position:'absolute', inset:'0', display:'flex',
  alignItems:'center', justifyContent:'center',
  color:'#44ccff', fontFamily:'monospace', fontSize:'13px',
  letterSpacing:'2px', pointerEvents:'none', background:'#000510',
});
loadDiv.innerHTML = '<span>⟳ CARREGANDO SCAN CORPORAL...</span>';
container.appendChild(loadDiv);

/* ════════════════════════════════════════════════════════════════
   APLICA SHADER HOLOGRÁFICO NO MODELO GLB
   ════════════════════════════════════════════════════════════════ */
function applyHolo(model) {
  const box = new THREE.Box3().setFromObject(model);
  const sz  = box.getSize(new THREE.Vector3());
  const ct  = box.getCenter(new THREE.Vector3());

  // Escala uniforme — altura alvo 1.82 unidades
  const scl = 1.82 / sz.y;
  model.scale.setScalar(scl);

  // Recalcula bounding box após escala para centrar corretamente
  model.updateMatrixWorld(true);
  const box2 = new THREE.Box3().setFromObject(model);
  const ct2  = box2.getCenter(new THREE.Vector3());
  // pés em y = 0 no espaço do bodyGroup
  model.position.set(-ct2.x, -box2.min.y, -ct2.z);

  model.traverse(child => {
    if (!child.isMesh) return;
    child.castShadow    = false;
    child.receiveShadow = false;
    child.material = makeHoloMat();

    // wireframe de arestas limpas
    const edges = new THREE.EdgesGeometry(child.geometry, 18);
    child.add(new THREE.LineSegments(edges, edgeMat.clone()));
  });

  bodyGroup.add(model);
  loadDiv.remove();
}

/* ════════════════════════════════════════════════════════════════
   CARREGA GLB  →  fallback procedural se falhar
   ════════════════════════════════════════════════════════════════ */
const loader = new GLTFLoader();
loader.load(
  '/models/body.glb',
  gltf => applyHolo(gltf.scene),
  undefined,
  err => {
    console.warn('[body-map] GLB falhou, usando fallback procedural:', err);
    buildProcedural();
    loadDiv.remove();
  }
);

/* ════════════════════════════════════════════════════════════════
   CORPO PROCEDURAL (fallback de emergência)
   ════════════════════════════════════════════════════════════════ */
function buildProcedural() {
  const ell = (rx,ry,rz) => { const g=new THREE.SphereGeometry(1,28,20); g.scale(rx,ry,rz); return g; };
  const cyl = (rt,rb,h,s=20) => new THREE.CylinderGeometry(rt,rb,h,s);
  const add = (geo,x,y,z,rx=0,ry=0,rz=0) => {
    const m4=new THREE.Matrix4().compose(
      new THREE.Vector3(x,y,z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),
      new THREE.Vector3(1,1,1)
    );
    geo.applyMatrix4(m4);
    const mat=makeHoloMat();
    const mesh=new THREE.Mesh(geo,mat);
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo,18),edgeMat.clone()));
    bodyGroup.add(mesh);
  };
  // Cabeça
  add(ell(0.148,0.185,0.152), 0,1.810,0);
  // Pescoço
  add(cyl(0.095,0.115,0.215,16), 0,1.652,0);
  // Tronco
  add(cyl(0.320,0.315,0.165,24), 0,1.518,0);
  add(cyl(0.308,0.298,0.255,24), 0,1.382,0);
  add(cyl(0.285,0.258,0.245,24), 0,1.138,0);
  add(cyl(0.242,0.220,0.228,24), 0,0.938,0);
  add(cyl(0.252,0.272,0.245,24), 0,0.732,0);
  // Ombros
  add(ell(0.195,0.182,0.182),-0.368,1.555,0);
  add(ell(0.195,0.182,0.182), 0.368,1.555,0);
  // Braço sup
  add(cyl(0.115,0.095,0.462,16),-0.448,1.232,0, 0,0, 0.26);
  add(cyl(0.115,0.095,0.462,16), 0.448,1.232,0, 0,0,-0.26);
  // Antebraço
  add(cyl(0.095,0.065,0.442,14),-0.528,0.850,0, 0,0, 0.15);
  add(cyl(0.095,0.065,0.442,14), 0.528,0.850,0, 0,0,-0.15);
  // Mãos
  add(ell(0.068,0.058,0.050),-0.588,0.628,0);
  add(ell(0.068,0.058,0.050), 0.588,0.628,0);
  // Quadril + pernas
  add(cyl(0.175,0.150,0.595,22),-0.162,0.568,0);
  add(cyl(0.175,0.150,0.595,22), 0.162,0.568,0);
  add(ell(0.128,0.112,0.122),-0.162,0.268,0.048);
  add(ell(0.128,0.112,0.122), 0.162,0.268,0.048);
  add(cyl(0.122,0.082,0.525,18),-0.162,0.002,0);
  add(cyl(0.122,0.082,0.525,18), 0.162,0.002,0);
  add(ell(0.080,0.068,0.080),-0.162,-0.282,0);
  add(ell(0.080,0.068,0.080), 0.162,-0.282,0);
  add(ell(0.072,0.040,0.152),-0.162,-0.322,0.082);
  add(ell(0.072,0.040,0.152), 0.162,-0.322,0.082);
}

/* ════════════════════════════════════════════════════════════════
   DESTAQUE MUSCULAR  (atualiza uniforms compartilhados)
   ════════════════════════════════════════════════════════════════ */
function applyHighlight(muscle, on) {
  if (on) {
    const ox = bodyGroup.position.x;
    const oy = bodyGroup.position.y;
    const oz = bodyGroup.position.z;
    // mundo = bodyGroup offset + local
    uHlC.value.set(  muscle.pos[0]+ox, muscle.pos[1]+oy, muscle.pos[2]+oz );
    uHlC2.value.set(-muscle.pos[0]+ox, muscle.pos[1]+oy, muscle.pos[2]+oz ); // bilateral
    uHlS.value.set(muscle.hl[0], muscle.hl[1], muscle.hl[2]);
    uHlStr.value = 1.0;
  } else {
    uHlStr.value = 0.0;
  }
}

/* ════════════════════════════════════════════════════════════════
   GLOW TEXTURES  (hotspots)
   ════════════════════════════════════════════════════════════════ */
function makeGlowTex(hex) {
  const c=document.createElement('canvas'); c.width=c.height=128;
  const ctx=c.getContext('2d'), r=64;
  const g=ctx.createRadialGradient(r,r,0,r,r,r);
  g.addColorStop(0,hex+'ff'); g.addColorStop(.4,hex+'99'); g.addColorStop(1,hex+'00');
  ctx.fillStyle=g; ctx.fillRect(0,0,128,128);
  return new THREE.CanvasTexture(c);
}
const glowGold = makeGlowTex('#c5a059');
const glowBlue = makeGlowTex('#00eeff');

/* ════════════════════════════════════════════════════════════════
   HOTSPOTS MUSCULARES
   ════════════════════════════════════════════════════════════════ */
const hotspotMeshes = [];
MUSCLES.forEach((m, i) => {
  const [x,y,z] = m.pos;

  // esfera invisível de colisão
  const hit = new THREE.Mesh(
    new THREE.SphereGeometry(0.10, 8, 8),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hit.position.set(x, y, z);
  hit.userData.muscle = m;
  bodyGroup.add(hit);
  hotspotMeshes.push(hit);

  // ponto visual dourado
  const dotMat = new THREE.MeshBasicMaterial({ color: 0xc5a059 });
  const dot    = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), dotMat);
  dot.position.set(x, y, z);
  bodyGroup.add(dot);
  m.dotMat = dotMat;

  // sprite de brilho
  const gMat = new THREE.SpriteMaterial({
    map:      glowGold,
    transparent: true,
    blending: THREE.AdditiveBlending,
    opacity:  0.55,
    depthWrite: false,
  });
  const glow = new THREE.Sprite(gMat);
  glow.scale.setScalar(0.14);
  glow.position.set(x, y, z);
  bodyGroup.add(glow);
  m.glow    = glow;
  m.glowMat = gMat;
  m._i      = i;
});

/* ════════════════════════════════════════════════════════════════
   CONTORNOS MUSCULARES — sempre visíveis, ficam vermelhos no hover
   ════════════════════════════════════════════════════════════════ */
MUSCLES.forEach(m => {
  const [x, y, z]     = m.pos;
  const [rx, ry, rz]  = m.hl;

  const makeOutline = (ox) => {
    const geo   = new THREE.SphereGeometry(1, 7, 5);
    geo.scale(rx, ry, rz);
    const edges = new THREE.EdgesGeometry(geo);
    const mat   = new THREE.LineBasicMaterial({
      color: 0x004466, transparent: true, opacity: 0.35, depthWrite: false
    });
    const ls = new THREE.LineSegments(edges, mat);
    ls.position.set(ox, y, z);
    bodyGroup.add(ls);
    return ls;
  };

  m.outlineA = makeOutline( x);
  m.outlineB = makeOutline(-x); // bilateral mirror
});

/* ════════════════════════════════════════════════════════════════
   PLATAFORMA + SCAN LINE + PARTÍCULAS
   ════════════════════════════════════════════════════════════════ */
const FLOOR_Y = -0.72;

const platMat = new THREE.MeshBasicMaterial({ color:0x00aaff, transparent:true, opacity:0.35 });
const platform = new THREE.Mesh(new THREE.CylinderGeometry(0.52,0.52,0.012,64), platMat);
platform.position.y = FLOOR_Y - 0.006;
scene.add(platform);

[0.32, 0.44, 0.58].forEach((r, i) => {
  const m = new THREE.MeshBasicMaterial({
    color:0x0088ff, transparent:true, opacity:0.28-i*0.06, side:THREE.DoubleSide
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(r, r+0.025, 64), m);
  ring.rotation.x = -Math.PI/2;
  ring.position.y = FLOOR_Y;
  scene.add(ring);
});

const scanMat  = new THREE.MeshBasicMaterial({ color:0x00eeff, transparent:true, opacity:.40, side:THREE.DoubleSide, depthWrite:false });
const scanLine = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.010), scanMat);
scene.add(scanLine);

// Partículas
const pCount = 450;
const pPos   = new Float32Array(pCount * 3);
for (let i = 0; i < pCount; i++) {
  const th = Math.random() * Math.PI * 2;
  const ph = Math.acos(2 * Math.random() - 1);
  const r  = i < 250 ? .3 + Math.random() * .7 : 1.0 + Math.random() * 1.0;
  pPos[i*3]   = r * Math.sin(ph) * Math.cos(th);
  pPos[i*3+1] = r * Math.cos(ph) * .9 + .9;
  pPos[i*3+2] = r * Math.sin(ph) * Math.sin(th);
}
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const pMat = new THREE.PointsMaterial({ color:0x00ccff, size:.016, transparent:true, opacity:.60, blending:THREE.AdditiveBlending, depthWrite:false });
scene.add(new THREE.Points(pGeo, pMat));

/* ════════════════════════════════════════════════════════════════
   RAYCASTING + TOOLTIP
   ════════════════════════════════════════════════════════════════ */
const raycaster = new THREE.Raycaster();
const mouse     = new THREE.Vector2();
const tooltip   = document.getElementById('muscleTooltip');
let hovered     = null;

const setHovered = m => {
  if (m === hovered) return;
  if (hovered) {
    hovered.glowMat.map = glowGold;
    hovered.glow.scale.setScalar(0.14);
    hovered.dotMat.color.set(0xc5a059);
    // reset outline to subtle cyan
    if (hovered.outlineA) { hovered.outlineA.material.color.set(0x004466); hovered.outlineA.material.opacity = 0.35; }
    if (hovered.outlineB) { hovered.outlineB.material.color.set(0x004466); hovered.outlineB.material.opacity = 0.35; }
    applyHighlight(hovered, false);
  }
  hovered = m;
  if (m) {
    m.glowMat.map = glowBlue;
    m.glow.scale.setScalar(0.42);
    m.dotMat.color.set(0xff1100);
    // outline turns bright red
    if (m.outlineA) { m.outlineA.material.color.set(0xff1100); m.outlineA.material.opacity = 0.90; }
    if (m.outlineB) { m.outlineB.material.color.set(0xff1100); m.outlineB.material.opacity = 0.90; }
    applyHighlight(m, true);
  }
};

const castRay = (nx, ny) => {
  mouse.set(nx, ny);
  raycaster.setFromCamera(mouse, camera);
  return raycaster.intersectObjects(hotspotMeshes);
};

const showTip = (m, cx, cy) => {
  const rect  = canvas.getBoundingClientRect();
  const extra = m.yt
    ? '<br><small style="color:#7ad">▶ Clique para ver dica</small>'
    : '<br><small style="color:#566">Vídeo em breve 🔜</small>';
  tooltip.innerHTML = `<strong>${m.name}</strong>${extra}`;
  tooltip.style.opacity = '1';
  tooltip.style.left    = Math.min(cx - rect.left + 18, rect.width - 200) + 'px';
  tooltip.style.top     = Math.max(cy - rect.top  - 58, 8) + 'px';
};

canvas.addEventListener('mousemove', e => {
  const r    = canvas.getBoundingClientRect();
  const hits = castRay((e.clientX-r.left)/r.width*2-1, -((e.clientY-r.top)/r.height)*2+1);
  if (hits.length) {
    setHovered(hits[0].object.userData.muscle);
    showTip(hovered, e.clientX, e.clientY);
    canvas.style.cursor = 'pointer';
  } else {
    setHovered(null);
    tooltip.style.opacity = '0';
    canvas.style.cursor   = 'grab';
  }
});
canvas.addEventListener('mouseleave', () => { setHovered(null); tooltip.style.opacity = '0'; });
canvas.addEventListener('click', () => { if (hovered?.yt) openModal(hovered.yt, hovered.name); });

let ts = { x:0, y:0, t:0 };
canvas.addEventListener('touchstart', e => {
  const t = e.touches[0]; ts = { x:t.clientX, y:t.clientY, t:Date.now() };
}, { passive:true });
canvas.addEventListener('touchend', e => {
  const t = e.changedTouches[0];
  if (Math.abs(t.clientX-ts.x)<10 && Math.abs(t.clientY-ts.y)<10 && Date.now()-ts.t<300) {
    const r    = canvas.getBoundingClientRect();
    const hits = castRay((t.clientX-r.left)/r.width*2-1, -((t.clientY-r.top)/r.height)*2+1);
    if (hits.length) {
      const m = hits[0].object.userData.muscle;
      setHovered(m); showTip(m, t.clientX, t.clientY);
      if (m.yt) setTimeout(() => openModal(m.yt, m.name), 200);
      setTimeout(() => { setHovered(null); tooltip.style.opacity='0'; }, 3200);
    }
  }
}, { passive:true });

/* ════════════════════════════════════════════════════════════════
   MODAL YOUTUBE
   ════════════════════════════════════════════════════════════════ */
const openModal  = (ytId, name) => {
  document.getElementById('ytTitle').textContent = name;
  document.getElementById('ytFrame').src = `https://www.youtube.com/embed/${ytId}?autoplay=1`;
  document.getElementById('ytModal').classList.add('open');
};
const closeModal = () => {
  document.getElementById('ytModal').classList.remove('open');
  document.getElementById('ytFrame').src = '';
};
document.getElementById('ytClose').addEventListener('click', closeModal);
document.getElementById('ytModal').addEventListener('click', e => {
  if (e.target === document.getElementById('ytModal')) closeModal();
});

/* ════════════════════════════════════════════════════════════════
   ANIMAÇÃO
   ════════════════════════════════════════════════════════════════ */
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  uTime.value = t;
  bloom.strength = hovered
    ? 1.30 + 0.20 * Math.sin(t * 4.0)   // pulso suave no hover
    : 0.90 + 0.08 * Math.sin(t * 0.7);

  // Hotspot pulse
  MUSCLES.forEach(m => {
    if (!m.glowMat) return;
    const h = m === hovered;
    m.glowMat.opacity = h
      ? 0.88 + 0.12 * Math.sin(t * 7)
      : 0.28 + 0.28 * Math.sin(t * 2.4 + m._i * 0.9);
    if (h) {
      m.glow.scale.setScalar(0.32 + 0.09 * Math.sin(t * 6));
      // pulse outline opacity
      const op = 0.65 + 0.35 * Math.sin(t * 6.5);
      if (m.outlineA) m.outlineA.material.opacity = op;
      if (m.outlineB) m.outlineB.material.opacity = op;
    }
  });

  // Scan line
  const scanMin = FLOOR_Y + 0.05, scanMax = FLOOR_Y + 2.85;
  const sf = (t * 0.38) % 1.0;
  scanLine.position.y = scanMin + (scanMax - scanMin) * sf;
  scanMat.opacity     = 0.10 + 0.38 * Math.sin(sf * Math.PI);

  platMat.opacity = 0.28 + 0.12 * Math.sin(t * 1.8);
  pMat.opacity    = 0.50 + 0.15 * Math.sin(t * 0.8);

  controls.update();
  composer.render();
}
animate();

/* ════════════════════════════════════════════════════════════════
   RESPONSIVO
   ════════════════════════════════════════════════════════════════ */
new ResizeObserver(() => {
  const w = cW(), h = cH();
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  bloom.setSize(w, h);
}).observe(container);
