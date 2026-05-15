// body-map.js — Corpo Humano 3D Holográfico v5
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader }    from 'three/addons/loaders/GLTFLoader.js';

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
scene.add(new THREE.AmbientLight(0x001a44, 2.5));
const addLight = (c,i,x,y,z,d=20) => {
  const l = new THREE.PointLight(c,i,d);
  l.position.set(x,y,z); scene.add(l);
};
addLight(0x0099ff, 6.0,  0, 2.2,  7);
addLight(0x0055cc, 4.0,  0, 2.2, -7);
addLight(0x00ddff, 3.0, -6, 1.0,  0);
addLight(0x00ddff, 3.0,  6, 1.0,  0);
addLight(0x0077ff, 2.5,  0, 4.5,  0);
addLight(0x002299, 2.0,  0,-1.0,  0);

// ================================================================
// MATERIAIS HOLOGRÁFICOS
// ================================================================
const holoMat = new THREE.MeshPhongMaterial({
  color:             0x001840,
  emissive:          0x0055cc,
  emissiveIntensity: 1.2,
  transparent:       true,
  opacity:           0.55,
  shininess:         300,
  side:              THREE.FrontSide,
  depthWrite:        false,
});
const edgeMat = new THREE.LineBasicMaterial({
  color:       0x11ddff,
  transparent: true,
  opacity:     0.70,
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
});
loadDiv.innerHTML = '<span>⟳ CARREGANDO MODELO...</span>';
container.appendChild(loadDiv);

// ================================================================
// APLICA MATERIAL HOLOGRÁFICO NO MODELO
// ================================================================
function applyHolo(model) {
  const box = new THREE.Box3().setFromObject(model);
  const sz  = box.getSize(new THREE.Vector3());
  const scl = 1.82 / sz.y;
  model.scale.setScalar(scl);
  model.position.set(
    -box.getCenter(new THREE.Vector3()).x * scl,
    -box.min.y * scl,
    -box.getCenter(new THREE.Vector3()).z * scl
  );

  model.traverse(child => {
    if (!child.isMesh) return;
    child.castShadow = child.receiveShadow = false;

    // Sólido holográfico
    child.material = holoMat.clone();

    // Wireframe de arestas limpas
    const edge = new THREE.EdgesGeometry(child.geometry, 18);
    child.add(new THREE.LineSegments(edge, edgeMat.clone()));
  });

  bodyGroup.add(model);
  loadDiv.remove();
}

// ================================================================
// CARREGA MODELO — tenta 3 URLs em sequência
// ================================================================
const loader = new GLTFLoader();
const MODEL_URLS = [
  '/models/body.glb',
  'https://raw.githubusercontent.com/mrdoob/three.js/r160/examples/models/gltf/Soldier.glb',
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CesiumMan/glTF-Binary/CesiumMan.glb',
];

function tryLoad(idx) {
  if (idx >= MODEL_URLS.length) {
    console.warn('Todos modelos falharam — usando corpo procedural');
    buildProcedural();
    loadDiv.remove();
    return;
  }
  loader.load(
    MODEL_URLS[idx],
    gltf => applyHolo(gltf.scene),
    undefined,
    ()   => tryLoad(idx + 1)
  );
}
tryLoad(0);

// ================================================================
// CORPO PROCEDURAL (fallback — se nenhum modelo carregar)
// ================================================================
function buildProcedural() {
  const mat  = holoMat.clone();
  const eMat = edgeMat.clone();

  function ell(rx,ry,rz){ const g=new THREE.SphereGeometry(1,22,16); g.scale(rx,ry,rz); return g; }
  function cyl(rt,rb,h,s=18){ return new THREE.CylinderGeometry(rt,rb,h,s); }
  function part(geo,x,y,z,rx=0,ry=0,rz=0){
    const m4=new THREE.Matrix4().compose(
      new THREE.Vector3(x,y,z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),
      new THREE.Vector3(1,1,1));
    geo.applyMatrix4(m4);
    const mesh=new THREE.Mesh(geo,mat.clone());
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo,20),eMat.clone()));
    bodyGroup.add(mesh);
  }
  part(ell(0.150,0.188,0.155),0,1.810,0);
  part(cyl(0.078,0.094,0.230,14),0,1.658,0);
  part(ell(0.310,0.078,0.178),0,1.548,-0.028);
  part(cyl(0.272,0.268,0.155,22),0,1.525,0);
  [-1,1].forEach(s=>{
    part(ell(0.162,0.108,0.138),s*0.118,1.432,0.130);
    part(ell(0.150,0.215,0.098),s*0.278,1.245,-0.068);
    part(ell(0.155,0.128,0.115),s*0.124,0.705,-0.118);
    part(ell(0.145,0.135,0.130),s*0.308,1.555,0);
    part(cyl(0.088,0.074,0.455,14),s*0.382,1.238,0,0,0,s*0.25);
    part(ell(0.084,0.075,0.084),s*0.418,1.295,0.092,0,0,s*0.25);
    part(ell(0.078,0.098,0.074),s*0.410,1.212,-0.092,0,0,s*0.23);
    part(cyl(0.070,0.052,0.438,12),s*0.465,0.860,0,0,0,s*0.14);
    part(ell(0.062,0.054,0.046),s*0.524,0.638,0);
    part(cyl(0.130,0.115,0.585,18),s*0.134,0.578,0);
    part(ell(0.110,0.175,0.098),s*0.134,0.580,0.102);
    part(ell(0.098,0.158,0.084),s*0.134,0.565,-0.102);
    part(ell(0.108,0.100,0.102),s*0.134,0.278,0.040);
    part(cyl(0.100,0.070,0.518,16),s*0.134,0.008,0);
    part(ell(0.088,0.146,0.082),s*0.134,0.118,-0.088);
    part(ell(0.070,0.060,0.070),s*0.134,-0.275,0);
    part(ell(0.067,0.036,0.142),s*0.134,-0.314,0.075);
  });
  part(cyl(0.255,0.245,0.245,22),0,1.392,0);
  part(cyl(0.238,0.220,0.235,22),0,1.158,0);
  part(cyl(0.215,0.200,0.218,22),0,0.958,0);
  part(cyl(0.220,0.232,0.235,22),0,0.750,0);
}

// ================================================================
// GLOW TEXTURES
// ================================================================
function makeGlowTex(hex) {
  const c=document.createElement('canvas'); c.width=c.height=128;
  const ctx=c.getContext('2d'),r=64;
  const g=ctx.createRadialGradient(r,r,0,r,r,r);
  g.addColorStop(0,hex+'ff'); g.addColorStop(0.4,hex+'99'); g.addColorStop(1,hex+'00');
  ctx.fillStyle=g; ctx.fillRect(0,0,128,128);
  return new THREE.CanvasTexture(c);
}
const glowGold = makeGlowTex('#c5a059');
const glowBlue = makeGlowTex('#00eeff');

// ================================================================
// HOTSPOTS MUSCULARES
// ================================================================
const hotspotMeshes = [];
MUSCLES.forEach((m,i) => {
  const [x,y,z] = m.pos;
  const hit = new THREE.Mesh(
    new THREE.SphereGeometry(0.10,8,8),
    new THREE.MeshBasicMaterial({visible:false})
  );
  hit.position.set(x,y,z); hit.userData.muscle=m;
  bodyGroup.add(hit); hotspotMeshes.push(hit);

  const dotMat = new THREE.MeshBasicMaterial({color:0xc5a059});
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.015,8,8),dotMat);
  dot.position.set(x,y,z); bodyGroup.add(dot);
  m.dotMat = dotMat;

  const glowMat = new THREE.SpriteMaterial({
    map:glowGold, transparent:true,
    blending:THREE.AdditiveBlending, opacity:0.55, depthWrite:false,
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.setScalar(0.14); glow.position.set(x,y,z);
  bodyGroup.add(glow);
  m.glow=glow; m.glowMat=glowMat; m._i=i;
});

// ================================================================
// ANÉIS + SCAN LINE + PARTÍCULAS
// ================================================================
const FLOOR_Y = -0.72 - 0.010;
const mkRing = (ri,ro,op=0.28) => {
  const m=new THREE.MeshBasicMaterial({color:0x0088ff,transparent:true,opacity:op,side:THREE.DoubleSide});
  const r=new THREE.Mesh(new THREE.RingGeometry(ri,ro,72),m);
  r.rotation.x=-Math.PI/2; r.position.y=FLOOR_Y; scene.add(r); return r;
};
const rings = [mkRing(0.24,0.29),mkRing(0.38,0.43),mkRing(0.54,0.58,0.15)];

const scanMat=new THREE.MeshBasicMaterial({color:0x00ccff,transparent:true,opacity:0.35,side:THREE.DoubleSide,depthWrite:false});
const scanLine=new THREE.Mesh(new THREE.PlaneGeometry(1.6,0.014),scanMat);
scene.add(scanLine);

const pCount=300, pPos=new Float32Array(pCount*3);
for(let i=0;i<pCount;i++){
  const th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1), r=0.9+Math.random()*0.85;
  pPos[i*3]=r*Math.sin(ph)*Math.cos(th); pPos[i*3+1]=r*Math.cos(ph)*0.88+0.9; pPos[i*3+2]=r*Math.sin(ph)*Math.sin(th);
}
const pGeo=new THREE.BufferGeometry();
pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));
const pMat=new THREE.PointsMaterial({color:0x0099ff,size:0.018,transparent:true,opacity:0.55,blending:THREE.AdditiveBlending,depthWrite:false});
scene.add(new THREE.Points(pGeo,pMat));

// ================================================================
// RAYCASTING + TOOLTIP
// ================================================================
const raycaster=new THREE.Raycaster(), mouse=new THREE.Vector2();
const tooltip=document.getElementById('muscleTooltip');
let hovered=null;

function setHovered(m){
  if(m===hovered) return;
  if(hovered){ hovered.glowMat.map=glowGold; hovered.glow.scale.setScalar(0.14); hovered.dotMat.color.set(0xc5a059); }
  hovered=m;
  if(m){ m.glowMat.map=glowBlue; m.glow.scale.setScalar(0.40); m.dotMat.color.set(0x00eeff); }
}
function castRay(nx,ny){ mouse.set(nx,ny); raycaster.setFromCamera(mouse,camera); return raycaster.intersectObjects(hotspotMeshes); }
function showTip(m,cx,cy){
  const rect=canvas.getBoundingClientRect();
  const extra=m.yt?'<br><small style="color:#7ad">▶ Clique para ver dica</small>':'<br><small style="color:#666">Vídeo em breve 🔜</small>';
  tooltip.innerHTML=`<strong>${m.name}</strong>${extra}`;
  tooltip.style.opacity='1';
  tooltip.style.left=Math.min(cx-rect.left+18,rect.width-200)+'px';
  tooltip.style.top=Math.max(cy-rect.top-58,8)+'px';
}
canvas.addEventListener('mousemove',e=>{
  const r=canvas.getBoundingClientRect();
  const hits=castRay((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);
  if(hits.length){ setHovered(hits[0].object.userData.muscle); showTip(hovered,e.clientX,e.clientY); canvas.style.cursor='pointer'; }
  else{ setHovered(null); tooltip.style.opacity='0'; canvas.style.cursor='grab'; }
});
canvas.addEventListener('mouseleave',()=>{ setHovered(null); tooltip.style.opacity='0'; });
canvas.addEventListener('click',()=>{ if(hovered?.yt) openModal(hovered.yt,hovered.name); });

let ts={x:0,y:0,t:0};
canvas.addEventListener('touchstart',e=>{ const t=e.touches[0]; ts={x:t.clientX,y:t.clientY,t:Date.now()}; },{passive:true});
canvas.addEventListener('touchend',e=>{
  const t=e.changedTouches[0];
  if(Math.abs(t.clientX-ts.x)<10&&Math.abs(t.clientY-ts.y)<10&&Date.now()-ts.t<300){
    const r=canvas.getBoundingClientRect();
    const hits=castRay((t.clientX-r.left)/r.width*2-1,-((t.clientY-r.top)/r.height)*2+1);
    if(hits.length){ const m=hits[0].object.userData.muscle; setHovered(m); showTip(m,t.clientX,t.clientY); if(m.yt) setTimeout(()=>openModal(m.yt,m.name),200); setTimeout(()=>{setHovered(null);tooltip.style.opacity='0';},3200); }
  }
},{passive:true});

// ================================================================
// MODAL YOUTUBE
// ================================================================
function openModal(ytId,name){
  document.getElementById('ytTitle').textContent=name;
  document.getElementById('ytFrame').src=`https://www.youtube.com/embed/${ytId}?autoplay=1`;
  document.getElementById('ytModal').classList.add('open');
}
function closeModal(){ document.getElementById('ytModal').classList.remove('open'); document.getElementById('ytFrame').src=''; }
document.getElementById('ytClose').addEventListener('click',closeModal);
document.getElementById('ytModal').addEventListener('click',e=>{ if(e.target===document.getElementById('ytModal')) closeModal(); });

// ================================================================
// ANIMAÇÃO
// ================================================================
const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const t=clock.getElapsedTime();
  holoMat.emissiveIntensity=1.0+0.25*Math.sin(t*1.1);
  MUSCLES.forEach(m=>{
    if(!m.glowMat) return;
    const h=m===hovered;
    m.glowMat.opacity=h?0.85+0.15*Math.sin(t*7):0.28+0.28*Math.sin(t*2.4+m._i*0.9);
    if(h) m.glow.scale.setScalar(0.32+0.09*Math.sin(t*6));
  });
  const scanMin=FLOOR_Y+0.05, scanMax=FLOOR_Y+2.80, sf=(t*0.40)%1.0;
  scanLine.position.y=scanMin+(scanMax-scanMin)*sf;
  scanMat.opacity=0.12+0.32*Math.sin(sf*Math.PI);
  rings.forEach((r,i)=>{ r.material.opacity=0.10+0.16*Math.sin(t*1.5+i*1.2); });
  pMat.opacity=0.42+0.12*Math.sin(t*0.8);
  controls.update();
  renderer.render(scene,camera);
}
animate();

// ================================================================
// RESPONSIVO
// ================================================================
new ResizeObserver(()=>{ const w=cW(),h=cH(); camera.aspect=w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h); }).observe(container);
