// body-map.js — Holographic Human v6 — Bloom + Fresnel Shader
import * as THREE from 'three';
import { OrbitControls }    from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader }       from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer }   from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }       from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass }  from 'three/addons/postprocessing/UnrealBloomPass.js';

// ================================================================
// GRUPOS MUSCULARES
// ================================================================
const MUSCLES = [
  { id: 'cervical',    name: 'Cervical',        pos: [ 0.00,  1.62,  0.05], yt: null },
  { id: 'peitoral',    name: 'Peitoral',        pos: [ 0.00,  1.37,  0.12], yt: null },
  { id: 'abdomen',     name: 'Abdômen',         pos: [ 0.00,  1.08,  0.10], yt: null },
  { id: 'deltoides',   name: 'Deltóide',        pos: [ 0.30,  1.50,  0.03], yt: null },
  { id: 'biceps',      name: 'Bíceps',          pos: [ 0.42,  1.20,  0.07], yt: null },
  { id: 'quadriceps',  name: 'Quadríceps',      pos: [ 0.14,  0.55,  0.08], yt: null },
  { id: 'tibial',      name: 'Tibial Anterior', pos: [ 0.14,  0.14,  0.08], yt: null },
  { id: 'trapezio',    name: 'Trapézio',        pos: [ 0.00,  1.51, -0.12], yt: null },
  { id: 'dorsais',     name: 'Dorsais',         pos: [ 0.21,  1.20, -0.12], yt: null },
  { id: 'triceps',     name: 'Tríceps',         pos: [ 0.42,  1.20, -0.07], yt: null },
  { id: 'lombar',      name: 'Lombar',          pos: [ 0.00,  0.92, -0.10], yt: null },
  { id: 'gluteos',     name: 'Glúteos',         pos: [ 0.13,  0.70, -0.14], yt: null },
  { id: 'isquiotib',   name: 'Isquiotibiais',   pos: [ 0.14,  0.52, -0.09], yt: null },
  { id: 'panturrilha', name: 'Panturrilha',     pos: [ 0.14,  0.14, -0.10], yt: null },
];

// ================================================================
// CENA
// ================================================================
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
scene.background = new THREE.Color(0x000510);

const camera = new THREE.PerspectiveCamera(44, cW() / cH(), 0.1, 50);
camera.position.set(0, 0.9, 5.8);

// ================================================================
// BLOOM (UnrealBloomPass — efeito cinematográfico)
// ================================================================
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(cW(), cH()),
  0.85,  // strength  — reduzido (era 2.2)
  0.30,  // radius    — raio do bloom
  0.25   // threshold — mais seletivo (era 0.10)
);
composer.addPass(bloom);

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
controls.autoRotateSpeed = 1.2;
controls.update();
controls.addEventListener('start', () => { controls.autoRotate = false; });
controls.addEventListener('end',   () => { setTimeout(() => controls.autoRotate = true, 3000); });

// ================================================================
// LUZES
// ================================================================
scene.add(new THREE.AmbientLight(0x001a44, 1.5));
const pl = (c,i,x,y,z,d=22) => { const l=new THREE.PointLight(c,i,d); l.position.set(x,y,z); scene.add(l); return l; };
const lights = [
  pl(0x0077ff, 5.0,  0, 2.2,  8),
  pl(0x0055aa, 3.5,  0, 2.2, -8),
  pl(0x00bbff, 3.0, -6, 1.0,  0),
  pl(0x00bbff, 3.0,  6, 1.0,  0),
  pl(0x0044cc, 2.5,  0, 5.0,  0),
  pl(0x002277, 2.0,  0,-1.5,  0),
];

// ================================================================
// SHADERS HOLOGRÁFICOS
// ================================================================
const VERT = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vNormal   = normalize(normalMatrix * normal);
    vUv       = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  uniform float  uTime;
  uniform vec3   uBase;
  uniform vec3   uRim;
  uniform vec3   uEnergy;
  uniform float  uOpacity;

  float pulse(float v, float sharpness) {
    return pow(max(sin(v) * 0.5 + 0.5, 0.0), sharpness);
  }

  void main() {
    // — Fresnel rim glow —
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.5);

    // — Scan lines horizontais —
    float scanH = pulse(vWorldPos.y * 18.0 + uTime * 2.0, 8.0);

    // — Linhas de energia diagonais —
    float lineA  = pulse(vWorldPos.y * 9.0  + vWorldPos.x * 3.0 + uTime * 1.4, 12.0);
    float lineB  = pulse(vWorldPos.y * 6.0  - vWorldPos.z * 4.0 + uTime * 0.9,  9.0);

    // — Nós de energia (pontos brilhantes) —
    float node   = pulse(vWorldPos.y * 22.0 + uTime * 3.0, 18.0)
                 * pulse(vWorldPos.x * 14.0 - uTime * 1.5, 18.0);

    float pattern = scanH * 0.35 + lineA * 0.25 + lineB * 0.25 + node * 0.5;

    // — Cor final —
    vec3 col = uBase
             + uRim    * fresnel   * 1.6
             + uEnergy * pattern   * 0.7;

    // — Alpha: borda brilhante + padrão —
    float alpha = uOpacity
                + fresnel * 0.5
                + pattern * 0.3;

    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

// Uniform de tempo compartilhado (animação sincronizada)
const uTime = { value: 0 };

// Cores normais e destacadas
const C_BASE   = new THREE.Color(0x001e55);
const C_RIM    = new THREE.Color(0x0066cc);
const C_ENERGY = new THREE.Color(0x00aadd);
const C_BASE_H = new THREE.Color(0x003a66);   // highlight base
const C_RIM_H  = new THREE.Color(0x00ffff);   // highlight rim
const C_ENERGY_H = new THREE.Color(0x00ffff); // highlight energy

// Cada mesh tem seus próprios uniforms de cor
function makeHoloMat() {
  return new THREE.ShaderMaterial({
    vertexShader:   VERT,
    fragmentShader: FRAG,
    uniforms: {
      uTime:    uTime,
      uBase:    { value: C_BASE.clone() },
      uRim:     { value: C_RIM.clone() },
      uEnergy:  { value: C_ENERGY.clone() },
      uOpacity: { value: 0.38 },
    },
    transparent: true,
    depthWrite:  false,
    side:        THREE.FrontSide,
  });
}

// Mapa: muscleId → lista de materiais desse grupo
const muscleMats = {};

function applyHighlight(id, on) {
  (muscleMats[id] || []).forEach(mat => {
    mat.uniforms.uBase.value.copy(on ? C_BASE_H   : C_BASE);
    mat.uniforms.uRim.value.copy( on ? C_RIM_H    : C_RIM);
    mat.uniforms.uEnergy.value.copy(on ? C_ENERGY_H : C_ENERGY);
    mat.uniforms.uOpacity.value = on ? 0.88 : 0.38;
  });
}

const edgeMat = new THREE.LineBasicMaterial({
  color: 0x00ccff, transparent: true, opacity: 0.75,
});

// ================================================================
// GRUPO DO CORPO
// ================================================================
const bodyGroup = new THREE.Group();
bodyGroup.position.y = -0.72;
scene.add(bodyGroup);

// ================================================================
// LOADING OVERLAY
// ================================================================
container.style.position = 'relative';
const loadDiv = document.createElement('div');
Object.assign(loadDiv.style, {
  position:'absolute', inset:'0', display:'flex',
  alignItems:'center', justifyContent:'center',
  color:'#44ccff', fontFamily:'monospace', fontSize:'13px',
  letterSpacing:'2px', pointerEvents:'none',
  background:'#000510',
});
loadDiv.innerHTML = '<span>⟳ INICIALIZANDO SCAN...</span>';
container.appendChild(loadDiv);

// ================================================================
// APLICA MATERIAL HOLOGRÁFICO NO MODELO
// ================================================================
function applyHolo(model) {
  const box = new THREE.Box3().setFromObject(model);
  const sz  = box.getSize(new THREE.Vector3());
  const ct  = box.getCenter(new THREE.Vector3());
  const scl = 1.55 / sz.y;
  model.scale.setScalar(scl);
  model.position.set(-ct.x * scl, -box.min.y * scl, -ct.z * scl);

  model.traverse(child => {
    if (!child.isMesh) return;
    child.castShadow = child.receiveShadow = false;
    child.material   = makeHoloMat();

    // Wireframe de arestas limpas
    const edge = new THREE.EdgesGeometry(child.geometry, 20);
    const lines = new THREE.LineSegments(edge, edgeMat.clone());
    child.add(lines);
  });

  bodyGroup.add(model);
  loadDiv.remove();
}

// ================================================================
// USA CORPO PROCEDURAL MUSCULOSO DIRETO
// ================================================================
function tryLoad(idx) {
  if (idx >= 0) {
    buildProcedural();
    loadDiv.remove();
    return;
  }
  loader.load(MODEL_URLS[idx], gltf => applyHolo(gltf.scene), undefined, () => tryLoad(idx + 1));
}
tryLoad(0);

// ================================================================
// CORPO PROCEDURAL (fallback com mesmo shader)
// ================================================================
function buildProcedural() {
  const ell = (rx,ry,rz) => { const g=new THREE.SphereGeometry(1,28,20); g.scale(rx,ry,rz); return g; };
  const cyl = (rt,rb,h,s=20) => new THREE.CylinderGeometry(rt,rb,h,s);
  const add = (geo,x,y,z,rx=0,ry=0,rz=0,mid=null) => {
    const m4=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new THREE.Vector3(1,1,1));
    geo.applyMatrix4(m4);
    const mat=makeHoloMat();
    const mesh=new THREE.Mesh(geo,mat);
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo,18),edgeMat.clone()));
    bodyGroup.add(mesh);
    if(mid){ if(!muscleMats[mid]) muscleMats[mid]=[]; muscleMats[mid].push(mat); }
  };
  // CABEÇA
  add(ell(0.148,0.185,0.152), 0, 1.810, 0);
  // PESCOÇO
  add(cyl(0.095,0.115,0.215,16), 0, 1.652, 0, 0,0,0, 'cervical');
  // TRAPÉZIO
  add(ell(0.400,0.100,0.220), 0, 1.545,-0.030, 0,0,0, 'trapezio');
  // PEITO SUPERIOR
  add(cyl(0.320,0.315,0.165,24), 0, 1.518, 0, 0,0,0, 'peitoral');
  // PEITORAIS
  add(ell(0.240,0.158,0.210),-0.158,1.412,0.172, 0,0,0, 'peitoral');
  add(ell(0.240,0.158,0.210), 0.158,1.412,0.172, 0,0,0, 'peitoral');
  // TRONCO
  add(cyl(0.308,0.298,0.255,24), 0, 1.382, 0);
  add(cyl(0.285,0.258,0.245,24), 0, 1.138, 0);
  add(cyl(0.242,0.220,0.228,24), 0, 0.938, 0);
  add(cyl(0.252,0.272,0.245,24), 0, 0.732, 0);
  // ABDÔMEN — 6 blocos
  [-1,1].forEach(s=>{
    add(ell(0.088,0.062,0.078),s*0.068,1.225,0.210, 0,0,0,'abdomen');
    add(ell(0.088,0.062,0.078),s*0.068,1.090,0.208, 0,0,0,'abdomen');
    add(ell(0.082,0.058,0.072),s*0.068,0.958,0.202, 0,0,0,'abdomen');
  });
  // OBLÍQUOS
  add(ell(0.092,0.188,0.100),-0.278,1.235,0.062, 0,0,0,'abdomen');
  add(ell(0.092,0.188,0.100), 0.278,1.235,0.062, 0,0,0,'abdomen');
  // DORSAIS
  add(ell(0.210,0.268,0.125),-0.345,1.235,-0.078, 0,0,0,'dorsais');
  add(ell(0.210,0.268,0.125), 0.345,1.235,-0.078, 0,0,0,'dorsais');
  // GLÚTEOS
  add(ell(0.195,0.162,0.150),-0.145,0.702,-0.138, 0,0,0,'gluteos');
  add(ell(0.195,0.162,0.150), 0.145,0.702,-0.138, 0,0,0,'gluteos');
  // DELTÓIDES
  add(ell(0.195,0.182,0.182),-0.368,1.555,0, 0,0,0,'deltoides');
  add(ell(0.195,0.182,0.182), 0.368,1.555,0, 0,0,0,'deltoides');
  // BRAÇO SUPERIOR
  add(cyl(0.115,0.095,0.462,16),-0.448,1.232,0, 0,0, 0.26,'biceps');
  add(cyl(0.115,0.095,0.462,16), 0.448,1.232,0, 0,0,-0.26,'biceps');
  // BÍCEPS
  add(ell(0.128,0.115,0.128),-0.492,1.305,0.132, 0,0, 0.26,'biceps');
  add(ell(0.128,0.115,0.128), 0.492,1.305,0.132, 0,0,-0.26,'biceps');
  // TRÍCEPS
  add(ell(0.115,0.138,0.108),-0.482,1.208,-0.128, 0,0, 0.24,'triceps');
  add(ell(0.115,0.138,0.108), 0.482,1.208,-0.128, 0,0,-0.24,'triceps');
  // ANTEBRAÇO
  add(cyl(0.095,0.065,0.442,14),-0.528,0.850,0, 0,0, 0.15,'tibial');
  add(cyl(0.095,0.065,0.442,14), 0.528,0.850,0, 0,0,-0.15,'tibial');
  // MÃOS
  add(ell(0.068,0.058,0.050),-0.588,0.628,0);
  add(ell(0.068,0.058,0.050), 0.588,0.628,0);
  // COXA
  add(cyl(0.175,0.150,0.595,22),-0.162,0.568,0, 0,0,0,'quadriceps');
  add(cyl(0.175,0.150,0.595,22), 0.162,0.568,0, 0,0,0,'quadriceps');
  // QUADRÍCEPS
  add(ell(0.158,0.228,0.138),-0.162,0.575,0.142, 0,0,0,'quadriceps');
  add(ell(0.158,0.228,0.138), 0.162,0.575,0.142, 0,0,0,'quadriceps');
  add(ell(0.108,0.182,0.085),-0.238,0.552,0.112, 0,0,0,'quadriceps');
  add(ell(0.108,0.182,0.085), 0.238,0.552,0.112, 0,0,0,'quadriceps');
  // ISQUIOTIBIAIS
  add(ell(0.138,0.205,0.118),-0.162,0.558,-0.138, 0,0,0,'isquiotib');
  add(ell(0.138,0.205,0.118), 0.162,0.558,-0.138, 0,0,0,'isquiotib');
  // JOELHOS
  add(ell(0.128,0.112,0.122),-0.162,0.268,0.048);
  add(ell(0.128,0.112,0.122), 0.162,0.268,0.048);
  // PERNA INFERIOR
  add(cyl(0.122,0.082,0.525,18),-0.162,0.002,0, 0,0,0,'tibial');
  add(cyl(0.122,0.082,0.525,18), 0.162,0.002,0, 0,0,0,'tibial');
  // PANTURRILHA
  add(ell(0.125,0.195,0.118),-0.162,0.132,-0.115, 0,0,0,'panturrilha');
  add(ell(0.125,0.195,0.118), 0.162,0.132,-0.115, 0,0,0,'panturrilha');
  // TORNOZELOS
  add(ell(0.080,0.068,0.080),-0.162,-0.282,0);
  add(ell(0.080,0.068,0.080), 0.162,-0.282,0);
  // PÉS
  add(ell(0.072,0.040,0.152),-0.162,-0.322,0.082);
  add(ell(0.072,0.040,0.152), 0.162,-0.322,0.082);
  // LOMBAR (costas baixas)
  add(ell(0.155,0.080,0.110), 0, 0.880,-0.175, 0,0,0,'lombar');
}

// ================================================================
// GLOW TEXTURES (hotspots)
// ================================================================
function makeGlowTex(hex) {
  const c=document.createElement('canvas'); c.width=c.height=128;
  const ctx=c.getContext('2d'), r=64;
  const g=ctx.createRadialGradient(r,r,0,r,r,r);
  g.addColorStop(0,hex+'ff'); g.addColorStop(.4,hex+'99'); g.addColorStop(1,hex+'00');
  ctx.fillStyle=g; ctx.fillRect(0,0,128,128);
  return new THREE.CanvasTexture(c);
}
const glowGold=makeGlowTex('#c5a059'), glowBlue=makeGlowTex('#00eeff');

// ================================================================
// HOTSPOTS MUSCULARES
// ================================================================
const hotspotMeshes=[];
MUSCLES.forEach((m,i)=>{
  const [x,y,z]=m.pos;
  const hit=new THREE.Mesh(new THREE.SphereGeometry(0.10,8,8),new THREE.MeshBasicMaterial({visible:false}));
  hit.position.set(x,y,z); hit.userData.muscle=m;
  bodyGroup.add(hit); hotspotMeshes.push(hit);
  const dotMat=new THREE.MeshBasicMaterial({color:0xc5a059});
  const dot=new THREE.Mesh(new THREE.SphereGeometry(0.016,8,8),dotMat);
  dot.position.set(x,y,z); bodyGroup.add(dot); m.dotMat=dotMat;
  const gMat=new THREE.SpriteMaterial({map:glowGold,transparent:true,blending:THREE.AdditiveBlending,opacity:.55,depthWrite:false});
  const glow=new THREE.Sprite(gMat); glow.scale.setScalar(.14); glow.position.set(x,y,z);
  bodyGroup.add(glow); m.glow=glow; m.glowMat=gMat; m._i=i;
});

// ================================================================
// PLATAFORMA + SCAN LINE + PARTÍCULAS
// ================================================================
const FLOOR_Y=-0.72;
// Plataforma circular brilhante
const platGeo=new THREE.CylinderGeometry(0.52,0.52,0.012,64);
const platMat=new THREE.MeshBasicMaterial({color:0x00aaff,transparent:true,opacity:0.35});
const platform=new THREE.Mesh(platGeo,platMat);
platform.position.y=FLOOR_Y-0.006; scene.add(platform);
[0.32,0.44,0.58].forEach((r,i)=>{
  const m=new THREE.MeshBasicMaterial({color:0x0088ff,transparent:true,opacity:0.28-i*0.06,side:THREE.DoubleSide});
  const ring=new THREE.Mesh(new THREE.RingGeometry(r,r+0.025,64),m);
  ring.rotation.x=-Math.PI/2; ring.position.y=FLOOR_Y; scene.add(ring);
});

const scanMat=new THREE.MeshBasicMaterial({color:0x00eeff,transparent:true,opacity:.40,side:THREE.DoubleSide,depthWrite:false});
const scanLine=new THREE.Mesh(new THREE.PlaneGeometry(1.8,.010),scanMat);
scene.add(scanLine);

// Partículas internas + externas
const pCount=450, pPos=new Float32Array(pCount*3), pAlpha=new Float32Array(pCount);
for(let i=0;i<pCount;i++){
  const th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1);
  const r=i<250 ? .3+Math.random()*.7 : 1.0+Math.random()*1.0;
  pPos[i*3]=r*Math.sin(ph)*Math.cos(th);
  pPos[i*3+1]=r*Math.cos(ph)*.9+.9;
  pPos[i*3+2]=r*Math.sin(ph)*Math.sin(th);
  pAlpha[i]=Math.random();
}
const pGeo=new THREE.BufferGeometry();
pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));
const pMat=new THREE.PointsMaterial({color:0x00ccff,size:.016,transparent:true,opacity:.60,blending:THREE.AdditiveBlending,depthWrite:false});
scene.add(new THREE.Points(pGeo,pMat));

// ================================================================
// RAYCASTING + TOOLTIP
// ================================================================
const raycaster=new THREE.Raycaster(), mouse=new THREE.Vector2();
const tooltip=document.getElementById('muscleTooltip');
let hovered=null;

const setHovered=m=>{
  if(m===hovered) return;
  if(hovered){
    hovered.glowMat.map=glowGold;
    hovered.glow.scale.setScalar(.14);
    hovered.dotMat.color.set(0xc5a059);
    applyHighlight(hovered.id, false);  // apaga o músculo anterior
  }
  hovered=m;
  if(m){
    m.glowMat.map=glowBlue;
    m.glow.scale.setScalar(.42);
    m.dotMat.color.set(0x00eeff);
    applyHighlight(m.id, true);         // ilumina TODO o músculo
  }
};
const castRay=(nx,ny)=>{mouse.set(nx,ny);raycaster.setFromCamera(mouse,camera);return raycaster.intersectObjects(hotspotMeshes);};
const showTip=(m,cx,cy)=>{
  const rect=canvas.getBoundingClientRect();
  const extra=m.yt?'<br><small style="color:#7ad">▶ Clique para ver dica</small>':'<br><small style="color:#566">Vídeo em breve 🔜</small>';
  tooltip.innerHTML=`<strong>${m.name}</strong>${extra}`;
  tooltip.style.opacity='1';
  tooltip.style.left=Math.min(cx-rect.left+18,rect.width-200)+'px';
  tooltip.style.top=Math.max(cy-rect.top-58,8)+'px';
};
canvas.addEventListener('mousemove',e=>{
  const r=canvas.getBoundingClientRect();
  const hits=castRay((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);
  if(hits.length){setHovered(hits[0].object.userData.muscle);showTip(hovered,e.clientX,e.clientY);canvas.style.cursor='pointer';}
  else{setHovered(null);tooltip.style.opacity='0';canvas.style.cursor='grab';}
});
canvas.addEventListener('mouseleave',()=>{setHovered(null);tooltip.style.opacity='0';});
canvas.addEventListener('click',()=>{if(hovered?.yt)openModal(hovered.yt,hovered.name);});
let ts={x:0,y:0,t:0};
canvas.addEventListener('touchstart',e=>{const t=e.touches[0];ts={x:t.clientX,y:t.clientY,t:Date.now()};},{passive:true});
canvas.addEventListener('touchend',e=>{
  const t=e.changedTouches[0];
  if(Math.abs(t.clientX-ts.x)<10&&Math.abs(t.clientY-ts.y)<10&&Date.now()-ts.t<300){
    const r=canvas.getBoundingClientRect();
    const hits=castRay((t.clientX-r.left)/r.width*2-1,-((t.clientY-r.top)/r.height)*2+1);
    if(hits.length){const m=hits[0].object.userData.muscle;setHovered(m);showTip(m,t.clientX,t.clientY);if(m.yt)setTimeout(()=>openModal(m.yt,m.name),200);setTimeout(()=>{setHovered(null);tooltip.style.opacity='0';},3200);}
  }
},{passive:true});

// ================================================================
// MODAL YOUTUBE
// ================================================================
const openModal=(ytId,name)=>{document.getElementById('ytTitle').textContent=name;document.getElementById('ytFrame').src=`https://www.youtube.com/embed/${ytId}?autoplay=1`;document.getElementById('ytModal').classList.add('open');};
const closeModal=()=>{document.getElementById('ytModal').classList.remove('open');document.getElementById('ytFrame').src='';};
document.getElementById('ytClose').addEventListener('click',closeModal);
document.getElementById('ytModal').addEventListener('click',e=>{if(e.target===document.getElementById('ytModal'))closeModal();});

// ================================================================
// ANIMAÇÃO
// ================================================================
const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const t=clock.getElapsedTime();

  // Atualiza shader time
  uTime.value=t;

  // Opacidade do shader pulsa suavemente
  // opacidade global removida (cada mesh tem a sua)

  // Intensidade do bloom pulsa
  bloom.strength=0.75+0.12*Math.sin(t*0.7);

  // Hotspot pulse
  MUSCLES.forEach(m=>{
    if(!m.glowMat) return;
    const h=m===hovered;
    m.glowMat.opacity=h?0.88+0.12*Math.sin(t*7):0.28+0.28*Math.sin(t*2.4+m._i*0.9);
    if(h) m.glow.scale.setScalar(0.32+0.09*Math.sin(t*6));
  });

  // Scan line
  const scanMin=FLOOR_Y+0.05, scanMax=FLOOR_Y+2.85, sf=(t*0.38)%1.0;
  scanLine.position.y=scanMin+(scanMax-scanMin)*sf;
  scanMat.opacity=0.10+0.38*Math.sin(sf*Math.PI);

  // Plataforma pulsa
  platMat.opacity=0.28+0.12*Math.sin(t*1.8);

  // Partículas giram
  pMat.opacity=0.50+0.15*Math.sin(t*0.8);

  controls.update();
  composer.render();   // ← bloom passa aqui
}
animate();

// ================================================================
// RESPONSIVO
// ================================================================
new ResizeObserver(()=>{
  const w=cW(),h=cH();
  camera.aspect=w/h;
  camera.updateProjectionMatrix();
  renderer.setSize(w,h);
  composer.setSize(w,h);
  bloom.setSize(w,h);
}).observe(container);
