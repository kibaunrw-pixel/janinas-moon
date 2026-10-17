"use strict";
/* Janinas Moon – 3D-Darstellung (Three.js). Die Spiellogik bleibt in jm-game.js, hier wird nur gezeichnet.
   Welt: 1 Einheit = 1 Kachel. Kachel (x,y) liegt auf dem Boden bei [x..x+1] × [y..y+1], y nach oben ist die Höhe. */
(function(){
const THREE=window.THREE, JM=window.JM, T=JM.T;
const R3=JM.R3={ok:false,on:true};
let E=null;
const V3=THREE.Vector3, C3=THREE.Color;
const rnd=Math.random, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hsh=(x,y,n)=>(((x*73856093)^(y*19349663)^((n||0)*83492791))>>>0)%1000;
const h01=(x,y,n)=>hsh(x,y,n)/1000;
function shade(hex,a){ const c=new C3(hex); if(a>=0) c.lerp(new C3("#ffffff"),a); else c.multiplyScalar(1+a); return c; }
function cssShade(hex,a){ return "#"+shade(hex,a).getHexString(); }

/* ---------- Renderer, Szene, Licht ---------- */
let renderer, scene, camera, sun, hemi, amb, glCanvas, toonGrad;
const PL=[]; // feste Zahl an Punktlichtern (Fenster, Laternen), damit keine Shader neu gebaut werden
let lantern, FOG=null;
function init(){
  glCanvas=document.createElement("canvas"); glCanvas.id="gl";
  glCanvas.style.cssText="position:fixed;inset:0;width:100%;height:100%;display:block;z-index:0";
  const game=document.getElementById("game"); game.parentNode.insertBefore(glCanvas,game);
  renderer=new THREE.WebGLRenderer({canvas:glCanvas,antialias:true,powerPreference:"high-performance"});
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  scene=new THREE.Scene();
  camera=new THREE.PerspectiveCamera(34,1,0.5,260);
  hemi=new THREE.HemisphereLight("#d8ecff","#6a8a4a",1.1); scene.add(hemi);
  amb=new THREE.AmbientLight("#ffffff",0.25); scene.add(amb);
  sun=new THREE.DirectionalLight("#fff4e0",2.4); sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048); const sc=sun.shadow.camera; sc.left=-30; sc.right=30; sc.top=30; sc.bottom=-30; sc.far=120; sc.near=1; sc.far=80;
  sun.shadow.bias=-0.0008; sun.shadow.normalBias=0.03; sun.shadow.radius=3;
  scene.add(sun); scene.add(sun.target);
  for(let i=0;i<8;i++){ const l=new THREE.PointLight("#ffc070",0,6,1.6); scene.add(l); PL.push(l); }
  lantern=new THREE.PointLight("#ffd9a0",0,9,1.4); scene.add(lantern);
  const d=new Uint8Array([95,170,235,255]); toonGrad=new THREE.DataTexture(d,4,1,THREE.RedFormat); toonGrad.minFilter=toonGrad.magFilter=THREE.NearestFilter; toonGrad.needsUpdate=true;
  addEventListener("resize",size); size();
  R3.ok=true;
}
function size(){ const dpr=Math.min(window.devicePixelRatio||1,2); renderer.setPixelRatio(dpr); renderer.setSize(innerWidth,innerHeight,false); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); }

/* ---------- Materialien ---------- */
const MATS={};
function toon(color,o){ const k="t"+color+(o?JSON.stringify(o):""); return MATS[k]||(MATS[k]=new THREE.MeshToonMaterial(Object.assign({color,gradientMap:toonGrad},o||{}))); }
const VC=()=>MATS.vc||(MATS.vc=new THREE.MeshToonMaterial({vertexColors:true,gradientMap:toonGrad}));
const VCE=()=>MATS.vce||(MATS.vce=new THREE.MeshToonMaterial({vertexColors:true,gradientMap:toonGrad,emissive:"#ffb050",emissiveIntensity:0}));

/* ---------- Grundformen (ohne Index, zum Zusammenfügen) ---------- */
const GEO={
  box:new THREE.BoxGeometry(1,1,1).toNonIndexed(),
  sph:new THREE.IcosahedronGeometry(1,2).toNonIndexed(),
  sphLo:new THREE.IcosahedronGeometry(1,1).toNonIndexed(),
  cyl:new THREE.CylinderGeometry(1,1,1,10).toNonIndexed(),
  cyl6:new THREE.CylinderGeometry(1,1,1,6).toNonIndexed(),
  cone:new THREE.ConeGeometry(1,1,10).toNonIndexed(),
  cone8:new THREE.ConeGeometry(1,1,8).toNonIndexed(),
  tri:(function(){ const g=new THREE.BufferGeometry(); g.setAttribute("position",new THREE.Float32BufferAttribute([-.5,0,0, .5,0,0, 0,1,0],3)); g.computeVertexNormals(); return g; })(),
  disc:new THREE.CylinderGeometry(1,1,1,14).toNonIndexed(),
  tor:new THREE.TorusGeometry(1,.25,6,12).toNonIndexed()
};
const _m=new THREE.Matrix4(), _q=new THREE.Quaternion(), _e=new THREE.Euler(), _p=new V3(), _s=new V3();
function M4(x,y,z,sx,sy,sz,rx,ry,rz){ _e.set(rx||0,ry||0,rz||0); _q.setFromEuler(_e); _p.set(x,y,z); _s.set(sx,sy==null?sx:sy,sz==null?sx:sz); return new THREE.Matrix4().compose(_p,_q,_s); }
class Merge{
  constructor(){ this.pos=[]; this.nor=[]; this.col=[]; }
  add(geo,m,color){
    const p=geo.attributes.position, n=geo.attributes.normal, c=color instanceof C3?color:new C3(color), v=new V3(), nm=new THREE.Matrix3().getNormalMatrix(m);
    for(let i=0;i<p.count;i++){ v.fromBufferAttribute(p,i).applyMatrix4(m); this.pos.push(v.x,v.y,v.z); v.fromBufferAttribute(n,i).applyMatrix3(nm).normalize(); this.nor.push(v.x,v.y,v.z); this.col.push(c.r,c.g,c.b); }
  }
  // Kurzformen
  box(x,y,z,w,h,d,c,ry){ this.add(GEO.box,M4(x,y,z,w,h,d,0,ry||0,0),c); }
  sph(x,y,z,rx,ry,rz,c,lo){ this.add(lo?GEO.sphLo:GEO.sph,M4(x,y,z,rx,ry,rz),c); }
  cyl(x,y,z,r,h,c,rx,rz,six){ this.add(six?GEO.cyl6:GEO.cyl,M4(x,y,z,r,h,r,rx||0,0,rz||0),c); }
  cone(x,y,z,r,h,c,rx,rz){ this.add(GEO.cone,M4(x,y,z,r,h,r,rx||0,0,rz||0),c); }
  mesh(mat,shadow){
    const g=new THREE.BufferGeometry();
    g.setAttribute("position",new THREE.Float32BufferAttribute(this.pos,3));
    g.setAttribute("normal",new THREE.Float32BufferAttribute(this.nor,3));
    g.setAttribute("color",new THREE.Float32BufferAttribute(this.col,3));
    const me=new THREE.Mesh(g,mat||VC()); me.castShadow=shadow!==false; me.receiveShadow=true; return me;
  }
}

/* ---------- Farben je Jahreszeit ---------- */
const PAL3=[
  {g:"#86c94e",gd:"#5fa53a",gl:"#a6dc6a",wald:"#5c9a3c",leaf:"#5fb04a",leafD:"#3f8a3a",leafL:"#8fd060",acc:"#f6b3c9",blos:true},
  {g:"#6fbd45",gd:"#4f9a35",gl:"#90d25c",wald:"#4c8c34",leaf:"#3f9a3a",leafD:"#2a742b",leafL:"#68bf50",acc:"#e8434f"},
  {g:"#b9b04c",gd:"#958c38",gl:"#d3c868",wald:"#8a8a3a",leaf:"#e0862c",leafD:"#b0561f",leafL:"#f2b04a",acc:"#c23a2a"},
  {g:"#eef3f6",gd:"#cfdbe6",gl:"#ffffff",wald:"#dfe8ee",leaf:"#e9eff4",leafD:"#b9c8d6",leafL:"#ffffff",acc:"#ffffff",snow:true}
];

/* ---------- Boden als gemalte Textur ---------- */
const TPX=32;
function grassLike(t){ return t===T.GRAS||t===T.TUFF||t===T.BLUME||t===T.BAUM||t===T.ZAUN||t===T.BLOCK||t===T.WALD; }
function baseColor(M,t,se,x,y){
  const P=PAL3[se];
  if(M.inside){ if(t===T.TEPPICH) return M.pal.rug; if(t===T.WAND) return cssShade(M.pal.trim,-.35); return M.pal.floor; }
  if(M.cave){ if(t===T.FELS) return "#3a3230"; if(t===T.WASSER)return '#569fce'; return M.tint||"#7a6a5a"; }
  switch(t){
    case T.WEG: return se===3?"#dcd8d0":"#dcb57e";
    case T.PLATZ: return se===3?"#d6d4d0":"#bdb4a4";
    case T.SAND: return se===3?"#eae8e2":"#efd6a0";
    case T.FELD: case T.GLAS: return se===3?"#e4e6e6":"#a08a52";
    case T.WASSER: return "#2c6a92";
    case T.STEG: return "#2c6a92";
    case T.WALD: return P.wald;
    case T.BAUM: return M.id==="forest"?P.wald:P.g;
    default: return P.g;
  }
}
function paintGround(M,se){
  const W=M.w, H=M.h, P=PAL3[se];
  // 1) weiche Grundflächen: klein malen, verwischen, groß ziehen
  const lo=document.createElement("canvas"); lo.width=W*8; lo.height=H*8; const lx=lo.getContext("2d");
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ lx.fillStyle=baseColor(M,M.t[y][x],se,x,y); lx.fillRect(x*8,y*8,8,8); }
  const c=document.createElement("canvas"); c.width=W*TPX; c.height=H*TPX; const g=c.getContext("2d");
  g.imageSmoothingEnabled=true; g.filter=M.inside?"none":"blur(9px)"; g.drawImage(lo,0,0,c.width,c.height); g.filter="none";
  if(M.inside){ g.imageSmoothingEnabled=false; g.drawImage(lo,0,0,c.width,c.height); }
  const R=(x,y,w,h,col)=>{ g.fillStyle=col; g.fillRect(x,y,w,h); };
  // 2) Einzelheiten je Kachel
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const t=M.t[y][x], X=x*TPX, Y=y*TPX;
    if(M.inside){
      if(t===T.BODEN||t===T.BLOCK){ for(let j=0;j<4;j++){ R(X,Y+j*8+7,TPX,1,M.pal.floor2); const off=((y*4+j)%2)?10:22; R(X+off,Y+j*8,1,8,M.pal.floor2); } R(X+(x*7)%26+3,Y+(y*5)%26+3,2,1,cssShade(M.pal.floor,.15)); }
      if(t===T.TEPPICH){ const rt=(xx,yy)=>M.t[yy]&&M.t[yy][xx]===T.TEPPICH; if(!rt(x,y-1)) R(X,Y+3,TPX,3,M.pal.rug2); if(!rt(x,y+1)) R(X,Y+TPX-6,TPX,3,M.pal.rug2); if(!rt(x-1,y)) R(X+3,Y,3,TPX,M.pal.rug2); if(!rt(x+1,y)) R(X+TPX-6,Y,3,TPX,M.pal.rug2); }
      continue;
    }
    if(M.cave){ for(let i=0;i<10;i++){ const hh=hsh(x,y,i+5); R(X+hh%30,Y+(hh>>5)%30,2+(i%3),2,i%2?"#8a7a68":"#665848"); } continue; }
    if(grassLike(t)||t===T.FELD||t===T.GLAS){
      const n=t===T.WALD?30:42;
      for(let i=0;i<n;i++){ const hh=hsh(x,y,i+11), px=X+hh%TPX, py=Y+(hh>>5)%TPX, l=3+hh%5;
        g.strokeStyle=i%3===0?P.gl:(i%3===1?P.gd:cssShade(P.g,-.06)); g.globalAlpha=.55; g.lineWidth=1.3; g.beginPath(); g.moveTo(px,py); g.lineTo(px+((hh>>3)%3-1),py-l); g.stroke(); }
      g.globalAlpha=1;
      if(t===T.BLUME&&se!==3){ for(let i=0;i<4;i++){ const hh=hsh(x,y,i+50), px=X+4+hh%24, py=Y+4+(hh>>5)%24, col=["#ffffff","#f6d55c","#f6a8c8","#c8a8f0"][(hh>>2)%4]; for(let k=0;k<5;k++){ const a=k/5*Math.PI*2; R(px+Math.cos(a)*2-1,py+Math.sin(a)*2-1,2,2,col); } R(px-1,py-1,2,2,"#f0b030"); } }
      if((t===T.FELD||t===T.GLAS)&&se!==3){ for(let i=0;i<10;i++){ const hh=hsh(x,y,i+70); R(X+hh%30,Y+(hh>>5)%30,3,2,"#8a6a3a"); } }
    }
    if(t===T.WEG){ for(let i=0;i<9;i++){ const hh=hsh(x,y,i+60), px=X+hh%28, py=Y+(hh>>5)%28, s=2+hh%3; g.fillStyle=se===3?"#c8c3ba":(i%3?"#c49a62":"#ead0a0"); g.beginPath(); g.ellipse(px+2,py+2,s,s*.7,0,0,7); g.fill(); } }
    if(t===T.PLATZ){ for(let j=0;j<4;j++){ const off=(j+y)%2?8:0; for(let i=-1;i<3;i++){ const sx=X+i*16+off, sy=Y+j*8; g.fillStyle=se===3?"#e8e6e2":"#cfc7b8"; g.beginPath(); g.roundRect(sx+1,sy+1,14,6,2.5); g.fill(); g.fillStyle="rgba(255,255,255,.18)"; g.fillRect(sx+3,sy+2,9,1); } } }
    if(t===T.SAND){ for(let i=0;i<8;i++){ const hh=hsh(x,y,i+80); R(X+hh%30,Y+(hh>>5)%30,2,2,se===3?"#d8d8d4":"#dcc088"); } }
  }
  // Ufer: helle Schaumkante um das Wasser
  if(!M.inside&&!M.cave){
    const wt=(xx,yy)=>xx>=0&&yy>=0&&xx<W&&yy<H&&(M.t[yy][xx]===T.WASSER||M.t[yy][xx]===T.STEG);
    g.strokeStyle=se===3?"#ffffff":"#e8dcb0"; g.lineWidth=4; g.globalAlpha=.75;
    for(let y=0;y<H;y++) for(let x=0;x<W;x++){ if(!wt(x,y)) continue; const X=x*TPX, Y=y*TPX;
      if(!wt(x,y-1)){ g.beginPath(); g.moveTo(X,Y+1); g.lineTo(X+TPX,Y+1); g.stroke(); }
      if(!wt(x,y+1)){ g.beginPath(); g.moveTo(X,Y+TPX-1); g.lineTo(X+TPX,Y+TPX-1); g.stroke(); }
      if(!wt(x-1,y)){ g.beginPath(); g.moveTo(X+1,Y); g.lineTo(X+1,Y+TPX); g.stroke(); }
      if(!wt(x+1,y)){ g.beginPath(); g.moveTo(X+TPX-1,Y); g.lineTo(X+TPX-1,Y+TPX); g.stroke(); } }
    g.globalAlpha=1;
  }
  return c;
}
function waterMask(M){
  const c=document.createElement("canvas"); c.width=M.w*8; c.height=M.h*8; const g=c.getContext("2d"); g.fillStyle="#000"; g.fillRect(0,0,c.width,c.height); g.fillStyle="#fff";
  for(let y=0;y<M.h;y++) for(let x=0;x<M.w;x++) if(M.t[y][x]===T.WASSER||M.t[y][x]===T.STEG) g.fillRect(x*8,y*8,8,8);
  const o=document.createElement("canvas"); o.width=c.width*2; o.height=c.height*2; const og=o.getContext("2d"); og.filter="blur(2px)"; og.drawImage(c,0,0,o.width,o.height); return o;
}
let rippleTex=null;
function ripple(){ if(rippleTex) return rippleTex; const c=document.createElement("canvas"); c.width=c.height=128; const g=c.getContext("2d");
  g.fillStyle="#ffffff"; g.fillRect(0,0,128,128); g.strokeStyle="rgba(170,215,245,.9)"; g.lineWidth=3;
  for(let i=0;i<14;i++){ const x=(i*47)%128, y=(i*29)%128, l=14+(i*7)%18; g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+l/2,y-3,x+l,y); g.stroke(); }
  rippleTex=new THREE.CanvasTexture(c); rippleTex.wrapS=rippleTex.wrapT=THREE.RepeatWrapping; rippleTex.colorSpace=THREE.SRGBColorSpace; return rippleTex; }

/* ---------- Bäume (instanziert) ---------- */
function treeSet(list,se){
  const P=PAL3[se], grp=new THREE.Group();
  const trunks=[], blobs=[], cones=[], dots=[];
  for(const t of list){
    const x=t.x+.5, z=t.y+.55, v=h01(t.x,t.y,3), s=.9+v*.25;
    if(t.kind==="pine"){
      trunks.push([x,.3*s,z,.11*s,.6*s,"#6b4423"]);
      const cc=se===3?"#2f5a3c":(se===2?"#3f6a3a":"#2f7a42");
      for(let i=0;i<3;i++){ const r=(.62-i*.15)*s, h=(.85-i*.12)*s; cones.push([x,(.75+i*.42)*s,z,r,h,shade(cc,i*.08+(v-.5)*.1)]); if(se===3) cones.push([x,(.82+i*.42)*s,z,r*.82,h*.7,new C3("#ffffff")]); }
    } else {
      trunks.push([x,.45*s,z,.13*s,.9*s,"#7a4e2a"]);
      if(se===3){ trunks.push([x-.2*s,1.0*s,z,.05*s,.6*s,"#7a4e2a",0,.6]); trunks.push([x+.22*s,1.05*s,z,.05*s,.6*s,"#7a4e2a",0,-.55]); trunks.push([x,1.15*s,z,.05*s,.6*s,"#7a4e2a"]); blobs.push([x,1.38*s,z,.18*s,.08*s,.18*s,new C3("#ffffff")]); continue; }
      const base=new C3(P.leaf).offsetHSL((v-.5)*.03,0,(v-.5)*.06);
      const B=[[0,1.35,0,.62],[-.38,1.15,.08,.42],[.4,1.18,-.05,.44],[.05,1.0,.32,.42],[-.12,1.62,-.1,.4],[.22,1.55,.12,.36]];
      for(const [dx,dy,dz,r] of B){ const lift=dy>1.3?.06:-.04; blobs.push([x+dx*s,dy*s,z+dz*s,r*s,r*s*.92,r*s,base.clone().offsetHSL(0,0,lift)]); }
      const fruit=t.kind==="fruit";
      if(P.blos||fruit&&se===1) for(let i=0;i<9;i++){ const a=i*2.4+v*6, rr=.5*s, hy=(1.1+((i*37)%10)/22)*s; dots.push([x+Math.cos(a)*rr,hy,z+Math.sin(a)*rr*.8+.18,(fruit&&se===1)?.07:.05,new C3((fruit&&se===1)?"#e8434f":P.acc)]); }
    }
  }
  const inst=(geo,arr,fn)=>{ if(!arr.length) return; const m=new THREE.InstancedMesh(geo,toon("#ffffff"),arr.length); arr.forEach((a,i)=>{ const [mx,col]=fn(a); m.setMatrixAt(i,mx); m.setColorAt(i,col instanceof C3?col:new C3(col)); }); m.castShadow=true; m.receiveShadow=true; m.instanceMatrix.needsUpdate=true; grp.add(m); };
  inst(new THREE.CylinderGeometry(.8,1,1,8),trunks,a=>[M4(a[0],a[1],a[2],a[3],a[4],a[3],0,0,a[7]||0),a[5]]);
  inst(new THREE.IcosahedronGeometry(1,2),blobs,a=>[M4(a[0],a[1],a[2],a[3],a[4],a[5]),a[6]]);
  inst(new THREE.ConeGeometry(1,1,9),cones,a=>[M4(a[0],a[1],a[2],a[3],a[4],a[3]),a[5]]);
  inst(new THREE.IcosahedronGeometry(1,1),dots,a=>[M4(a[0],a[1],a[2],a[3],a[3],a[3]),a[4]]);
  return grp;
}

/* ---------- Gebäude ---------- */
const BSTYLE={
  house:{wall:"#ecc999",roof:"#c8553d",trim:"#7a4a2a",door:"#8a5a33",chim:true,plank:true,flowers:true},
  coop:{wall:"#eedcb0",roof:"#b8743f",trim:"#7a4a2a",door:"#9a6a3a",plank:true},
  barn:{wall:"#c0463c",roof:"#6b4a3a",trim:"#f4f1ea",door:"#8a2f28",plank:true,xdoor:true},
  markt:{wall:"#f4ecd8",roof:"#4f9a4a",trim:"#3f7a4a",door:"#6b4423",awning:["#4f9a4a","#f4f1ea"],flowers:true},
  nudelhaus:{wall:"#f2dcc4",roof:"#b8302a",trim:"#8a1f1c",door:"#8a1f1c",lanterns:true,curl:true},
  rathaus:{wall:"#e8e2d4",roof:"#3f5a8a",trim:"#2f456a",door:"#6b4423",clock:true,stone:true},
  tierhof:{wall:"#e8d49e",roof:"#7a4a2a",trim:"#6b4423",door:"#8a5a33",plank:true},
  huette:{wall:"#a9bdc9",roof:"#4a5a66",trim:"#3a4652",door:"#5a4a3a",plank:true,chim:true},
  // Etappe 5: Lindenstadt wächst
  baeckerei:{wall:"#f1e2c4",roof:"#b5523b",trim:"#8a3a2c",door:"#8a5a33",chim:true,awning:["#d9473a","#f4f1ea"],plank:true},
  blumenladen:{wall:"#f3d3dc",roof:"#6f8f5a",trim:"#557446",door:"#6f8f5a",flowers:true},
  villa:{wall:"#f4f1ea",roof:"#4a5a6e",trim:"#8a8070",door:"#3f4f6f",stone:true,flowers:true,tall:.9},
  hotel:{wall:"#e8d9b8",roof:"#3f5a8a",trim:"#2f456a",door:"#6b4423",stone:true,flowers:true,tall:1.35,nowin:true}
};
const SMOKERS=[];
/* Etappe 5: Zusatzdetails der neuen Stadtgebäude (Brezelschild, Brotkorb, Blumeneimer, Säulen, Balkon, Fernrohr, Hotel-Etagen) */
const EXTRA5={baeckerei:1,blumenladen:1,villa:1,hotel:1};
function extras5(mg,mgE,o,se){ if(!EXTRA5[o.k]) return; const w=o.w,d=o.h,x0=o.x,cx=x0+w/2,front=o.y+d-.02,st=BSTYLE[o.k],wallH=1.6+(st.tall||0),snow=se===3,FLC=["#f28fb0","#f6d55c","#ffffff","#c49bf2","#e8483a"];
  if(o.k==="baeckerei"){ mg.box(x0+3.6,1.55,front+.35,.05,.6,.05,"#3a2a20"); mg.box(x0+3.85,1.82,front+.35,.55,.05,.05,"#3a2a20"); for(let i=0;i<28;i++){ const t=i/28*Math.PI*2, hx=Math.pow(Math.sin(t),3)*.2, hy=(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))*.012; mg.sph(x0+4.05+hx,1.5+hy,front+.35,.045,.045,.045,"#b8783a"); }
    for(let i=0;i<7;i++){ const f=i/6; for(const sg of [-1,1]) mg.sph(x0+4.05+sg*(.13-f*.26),1.36+f*.2,front+.37,.04,.04,.04,"#c98a4a"); }
    mg.cyl(x0+4.4,.2,front+.45,.28,.22,"#b07a3e"); for(let i=0;i<4;i++) mg.sph(x0+4.25+i*.1,.36,front+.45,.08,.05,.06,"#e8b86a");
    mg.box(x0+.9,.42,front+.45,1.2,.06,.35,"#a8743f"); for(const dx of [.4,1.4]) mg.box(x0+dx,.2,front+.45,.06,.4,.3,"#7a4e2a"); }
  if(o.k==="blumenladen"&&!snow){ for(const [dx,k] of [[.35,0],[.8,2],[w-.8,4],[w-.35,1]]){ mg.cyl(x0+dx,.2,front+.4,.17,.4,"#7a8a9a"); for(let i=0;i<5;i++) mgE.sph(x0+dx+Math.cos(i*1.3)*.1,.5+(i%2)*.06,front+.4+Math.sin(i*1.3)*.08,.07,.07,.07,FLC[(k+i)%5],true); }
    mg.box(cx,1.75,front+.08,1.2,.35,.05,"#557446"); mgE.sph(cx,1.75,front+.12,.1,.1,.03,"#f6d55c"); }
  if(o.k==="villa"){ for(const dx of [-.95,.95]) mg.cyl(cx+dx,.24+1.1,front+.35,.09,2.2,"#e8e2d4"); mg.box(cx,2.4,front+.38,2.3,.1,.5,"#d0c8b8");
    for(let i=0;i<9;i++) mg.box(cx-1.1+i*.275,2.6,front+.6,.04,.35,.04,"#8a8070"); mg.box(cx,2.78,front+.6,2.3,.04,.04,"#8a8070");
    const ty=.24+wallH+1.6; mg.cyl(x0+w-1.1,ty,o.y+d/2,.25,.5,"#e2ddd2"); mg.add(GEO.cyl,M4(x0+w-.9,ty+.4,o.y+d/2,.07,.7,.07,0,0,-.9),"#c9a46a");
    for(let i=0;i<4;i++){ const wx=x0+.8+i*(w-1.6)/3; mg.box(wx,1.95,front+.03,.5,.5,.05,"#f4f1ea"); mgE.box(wx,1.95,front+.05,.4,.4,.03,"#9fd0ee"); }
    if(!snow) for(const dx of [.5,w-.5]) mg.sph(x0+dx,.3,front+.5,.4,.35,.3,"#4f8a3a"); }
  if(o.k==="hotel"){ for(let row=0;row<3;row++) for(let i=0;i<4;i++){ if(row===0&&(i===1||i===2)) continue; const wx=x0+.7+i*(w-1.4)/3, wy=1.5+row*.62; mg.box(wx,wy,front+.03,.5,.48,.05,"#f4f1ea"); mgE.box(wx,wy,front+.05,.4,.38,.03,"#9fd0ee"); if(!snow){ mg.box(wx,wy-.32,front+.1,.5,.1,.12,"#8a5a33"); for(let k=0;k<3;k++) mg.sph(wx-.15+k*.15,wy-.25,front+.12,.06,.06,.06,FLC[(i+k+row)%5],true); } }
    // Schriftzug vor der Traufe (nicht unter dem Dachüberstand), auf zwei Messingstützen
    mg.box(cx,.24+wallH+.22,front+.45,2.2,.5,.06,"#2f456a"); for(const dx of [-.9,.9]) mg.box(cx+dx,.24+wallH-.05,front+.42,.05,.3,.05,"#c9a46a"); { const F5={H:["101","101","111","101","101"],O:["111","101","101","101","111"],T:["111","010","010","010","010"],E:["111","100","110","100","111"],L:["100","100","100","100","111"]}, px=.075, sx=cx-(5*4-1)*px/2+px/2, sy=.24+wallH+.22+2*px;
      [..."HOTEL"].forEach((ch,li)=>F5[ch].forEach((row,j)=>{ for(let q=0;q<3;q++) if(row[q]==="1") mgE.box(sx+(li*4+q)*px,sy-j*px,front+.49,px*.92,px*.92,.02,"#f6d55c"); })); }
    mg.box(cx,1.3,front+.45,1.4,.08,.7,"#2f456a"); for(const dx of [-.65,.65]) mg.box(cx+dx,.65,front+.75,.05,1.3,.05,"#c9a46a"); mg.box(cx,.03,front+.6,.7,.02,1.1,"#b8302a");
    // Fahnenmasten vor dem Eingang statt auf dem First: so bleiben die Fahnen auch im Querformat im Bild
    for(const dx of [-2.1,2.1]){ mg.cyl(cx+dx,.06,front+.55,.12,.12,"#9a948a"); mg.box(cx+dx,1.3,front+.55,.05,2.5,.05,"#3a3a44"); mg.sph(cx+dx,2.58,front+.55,.05,.05,.05,"#c9a46a"); mg.box(cx+dx+(dx<0?.26:-.26),2.3,front+.55,.48,.3,.02,dx<0?"#d9473a":"#f6d55c"); } }
}
function building(mg,mgE,o,se){
  const st=BSTYLE[o.k], w=o.w, d=o.h, x0=o.x, z0=o.y, cx=x0+w/2, front=z0+d-.02;
  const wallH=1.35+(d>3?.25:0)+(o.k==="rathaus"?.35:0)+(st.tall||0), depth=d-.35, zc=front-depth/2;
  const snow=se===3;
  // Sockel
  mg.box(cx,.12,zc,w-.05,.24,depth+.1,st.stone?"#b8b0a2":"#9a948a");
  // Wände (mit Brettern)
  mg.box(cx,.24+wallH/2,zc,w-.2,wallH,depth,st.wall);
  if(st.plank) for(let i=1;i<6;i++) mg.box(cx,.24+i*wallH/6,front+.005,w-.2,.025,.01,cssShade(st.wall,-.12));
  if(st.stone) for(let i=1;i<5;i++) mg.box(cx,.24+i*wallH/5,front+.005,w-.2,.02,.01,cssShade(st.wall,-.1));
  // Ecken
  for(const sx of [x0+.1,x0+w-.1]) mg.box(sx,.24+wallH/2,front-.02,.14,wallH+.02,.06,st.trim);
  mg.box(cx,.24+wallH,front-.01,w-.1,.1,.06,st.trim);
  // Dach (Satteldach entlang x)
  const ov=.28, rh=Math.min(1.5,depth*.5+.25), half=depth/2+ov, ang=Math.atan2(rh,half), slope=Math.hypot(rh,half), top=.24+wallH;
  const rc=snow?"#f4f8fb":st.roof;
  for(const sgn of [1,-1]){
    const zz=zc+sgn*half/2, yy=top+rh/2;
    mg.add(GEO.box,M4(cx,yy,zz,w+.5,.12,slope,sgn*ang,0,0),rc);
    if(!snow) for(let i=1;i<6;i++){ const f=i/6, zl=zc+sgn*half*(1-f), yl=top+rh*f+.07; mg.add(GEO.box,M4(cx,yl,zl,w+.52,.025,.05,sgn*ang,0,0),cssShade(rc,-.18)); }
  }
  mg.add(GEO.box,M4(cx,top+rh+.04,zc,w+.55,.1,.14),snow?"#ffffff":cssShade(rc,-.25));
  // Giebel vorne und hinten
  for(const sx of [-1,1]) mg.add(GEO.tri,M4(cx+sx*(w-.2)/2,top,zc,depth,rh,1,0,sx*Math.PI/2,0),st.wall);
  if(st.curl&&!snow) for(const sx of [-1,1]) mg.add(GEO.box,M4(cx+sx*(w/2+.22),top+.05,zc+half*.9,.3,.1,.3,0,0,sx*.5),st.roof);
  // Tür
  const dx=(o.door?o.door[0]:Math.floor(cx))+.5;
  mg.box(dx,.24+.5,front+.03,.62,1.0,.06,st.trim);
  mg.box(dx,.24+.48,front+.05,.52,.94,.04,st.door);
  if(st.xdoor){ mg.add(GEO.box,M4(dx,.72,front+.08,.06,1.1,.03,0,0,.5),st.trim); mg.add(GEO.box,M4(dx,.72,front+.08,.06,1.1,.03,0,0,-.5),st.trim); }
  mg.sph(dx+.17,.72,front+.08,.035,.035,.035,"#f3c34a");
  mg.box(dx,.06,front+.25,.8,.12,.4,"#a8a296");
  // Fenster
  const wins=[]; if(!st.nowin){ for(let i=0;i<w;i++){ const wx=x0+i+.5; if(Math.abs(wx-dx)>.8&&i>0&&i<w-1) wins.push(wx); }
  if(!wins.length&&w>=3) wins.push(x0+.6); } // Hotel: eigene Etagenfenster in extras5
  const wy=.24+wallH*.58;
  for(const wx of wins.slice(0,3)){
    mg.box(wx,wy,front+.03,.62,.56,.05,"#f4f1ea");
    mgE.box(wx,wy,front+.05,.5,.44,.03,"#9fd0ee");
    mg.box(wx,wy,front+.07,.04,.46,.02,"#f4f1ea"); mg.box(wx,wy,front+.07,.5,.04,.02,"#f4f1ea");
    if(st.flowers&&!snow){ mg.box(wx,wy-.34,front+.1,.6,.12,.14,"#8a5a33"); for(let k=0;k<4;k++) mg.sph(wx-.22+k*.15,wy-.25,front+.12,.07,.07,.07,["#f6a8c8","#f6d55c","#ffffff","#e8483a"][k],true); }
  }
  if(st.chim){ const chx=x0+w*.75; mg.box(chx,top+rh*.75,zc-depth*.12,.32,rh*.9,.32,"#9a5a4a"); mg.box(chx,top+rh*1.2+.02,zc-depth*.12,.38,.08,.38,"#7a4a3a"); SMOKERS.push([chx,top+rh*1.3,zc-depth*.12]); }
  if(st.awning&&!snow){ for(let i=0;i<w*3;i++){ const ax=x0+.1+(i+.5)*(w-.2)/(w*3); mg.add(GEO.box,M4(ax,.24+wallH*.92,front+.32,(w-.2)/(w*3)+.005,.05,.7,.55,0,0),st.awning[i%2]); } }
  if(st.lanterns) for(const lx of [x0+.35,x0+w-.35]){ mgE.sph(lx,.24+wallH*.85,front+.2,.14,.17,.14,"#e8483a"); mg.box(lx,.24+wallH*.85+.2,front+.2,.04,.1,.04,"#3a2a2a"); }
  if(st.clock){ mg.cyl(cx,top+rh*.42,zc+depth/2+.05,.3,.06,"#f4f1ea",Math.PI/2); mg.box(cx,top+rh*.48,zc+depth/2+.09,.03,.18,.02,"#2b1e2a"); mg.box(cx+.06,top+rh*.42,zc+depth/2+.09,.14,.03,.02,"#2b1e2a"); for(const sx of [x0+.6,x0+w-.6]) mg.cyl(sx,.24+wallH/2,front+.25,.09,wallH,"#f4f1ea"); mg.box(cx,.24+wallH+.04,front+.3,w-.6,.1,.4,st.trim); }
  // Lichtquellen für die Nacht
  return wins.slice(0,3).map(wx=>[wx,wy,front+.5]);
}

/* ---------- Requisiten ---------- */
// Beschriftete Schilder (Ortsschild, Bahnhofsname) als kleine Textur in Spielpalette; hängt an der aktuellen Welt.
function signPlane(txt,w,h,x,y,z){ const c=document.createElement("canvas"); c.width=512; c.height=Math.max(32,Math.round(512*h/w)); const g=c.getContext("2d");
  g.fillStyle="#f4f1ea"; g.fillRect(0,0,c.width,c.height); g.strokeStyle="#2f4d5c"; g.lineWidth=Math.round(c.height*.12); g.strokeRect(0,0,c.width,c.height);
  g.fillStyle="#2f4d5c"; g.font="bold "+Math.round(c.height*.58)+"px sans-serif"; g.textAlign="center"; g.textBaseline="middle"; g.fillText(txt,c.width/2,c.height/2+2);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshLambertMaterial({map:t})); m.position.set(x,y,z); world.add(m); return m; }
function prop(mg,mgE,o,se,st){
  const x=o.x+(o.w||1)/2, z=o.y+(o.h||1)/2, k=o.k, snow=se===3;
  const wood="#a8743f", woodD="#7a4e2a", woodL="#c8945a";
  switch(k){
    case 'erinnerungsrahmen':mg.box(x,1.05,z,.95,.9,.1,'#bf9564');mg.box(x,1.05,z+.07,.78,.72,.03,'#768bab');mg.sph(x-.12,1.14,z+.10,.16,.14,.03,'#e99caf');mg.sph(x+.12,1.14,z+.10,.16,.14,.03,'#e99caf');mg.add(GEO.box,M4(x,.98,z+.10,.27,.27,.04,0,0,.78),'#e99caf');return;
    case 'meerregal':mg.box(x,.85,z,.9,1.7,.4,'#8a5a33');for(const y of [.3,.85,1.4]){mg.box(x,y,z+.05,.95,.06,.45,'#c29a6d');for(let i=0;i<3;i++){mg.box(x-.3+i*.3,y+.22,z+.25,.24,.32,.025,'#efe5c2');mg.box(x-.3+i*.3,y+.22,z+.27,.18,.18,.01,['#75adcb','#8fb5a5','#879ac1'][i]);}}return;
    case 'dorfglas_alt':case 'dorfglas_bau1':case 'dorfglas_bau2':case 'dorfglas_bau3':case 'dorfglas':{
      const old=k==='dorfglas_alt',build=k.includes('_bau'),phase=Number(k.slice(-1))||3,frame=old?'#657e64':'#538977',glass=old?'#91a193':'#b9ded7';
      mg.box(x,.16,z,6,.32,4,'#9a9d8c');
      if(!build||phase>1){mg.box(x,1.25,z-1.88,5.8,2.15,.06,glass);for(const dx of [-2.88,2.88])mg.box(x+dx,1.25,z,.06,2.15,3.75,glass);mg.box(x-1.75,1.25,z+1.88,2.2,2.15,.06,glass);mg.box(x+1.75,1.25,z+1.88,2.2,2.15,.06,glass);}
      for(const dx of [-2.9,-1.74,-.58,.58,1.74,2.9])for(const dz of [-1.9,1.9])mg.box(x+dx,1.25,z+dz,.065,2.25,.065,frame);
      for(const y of [.35,1.25,2.35]){mg.box(x,y,z-1.9,5.9,.065,.065,frame);mg.box(x,y,z+1.9,5.9,.065,.065,frame);for(const dx of [-2.9,2.9])mg.box(x+dx,y,z,.065,.065,3.8,frame);}
      for(const side of [-1,1]){if(!build||phase>=3)mg.add(GEO.box,M4(x,2.8,z+side*.95,6.1,.07,2.3,side*.51,0,0),old?'#809b88':snow?'#dcebe5':'#bededb');mg.add(GEO.box,M4(x,2.8,z+side*.95,6.2,.06,.07,side*.51,0,0),frame);}mg.box(x,3.4,z,6.2,.08,.08,frame);
      mg.box(x,.95,z+1.94,1.12,1.7,.06,frame);mg.box(x,1.3,z+1.99,.86,.85,.04,'#d4ebe0');mg.sph(x+.38,.75,z+2.04,.05,.05,.04,'#eed48b');
      if(old){for(const dx of [-1.8,1.5])mg.add(GEO.box,M4(x+dx,1.25,z+1.96,1.3,.15,.07,0,0,.4),'#917451');for(const dx of [-2.4,2.4])mg.sph(x+dx,.4,z+1.9,.35,.25,.3,'#628452');}
      else if(build){for(const y of [.8,1.8])mg.box(x,y,z+2.1,6.4,.1,.1,'#b48c61');for(const dx of [-3.1,3.1])mg.box(x+dx,1.2,z+2.1,.1,2.5,.1,'#a58056');}
      else {mg.box(x,2.04,z+2.01,2.4,.3,.06,'#f0e5c1');for(const dx of [-2,2]){mg.box(x+dx,.4,z+2.15,.75,.28,.5,'#b37e58');for(const d of [-.2,0,.2]){mg.cyl(x+dx+d,.7,z+2.15,.025,.4,'#4f8c55');mg.sph(x+dx+d,.92,z+2.15,.12,.09,.12,'#e9b474');}}}return;}
    case 'dorfbeet_leer':case 'dorfbeet_jung':case 'dorfbeet_gross':case 'dorfbeet_reif':{mg.box(x,.3,z,.95,.5,.75,'#a77a52');mg.box(x,.57,z,1.05,.1,.85,'#bf9365');mg.box(x,.63,z,.85,.03,.65,'#604b38');if(k!=='dorfbeet_leer'){const h=k==='dorfbeet_jung'?.22:.6;for(const dx of [-.28,0,.28]){mg.cyl(x+dx,.65+h/2,z,.025,h,'#478052');mg.sph(x+dx-.07,.68+h*.5,z,.14,.06,.09,'#70a65f');mg.sph(x+dx+.07,.72+h*.7,z,.13,.06,.09,'#65a75b');if(k==='dorfbeet_reif')mg.sph(x+dx,.66+h,z,.12,.1,.12,'#e9b958');}}return;}
    case 'mondtor_zu':case 'mondtor_offen':{const open=k==='mondtor_offen';mg.sph(x,.15,z-.1,.9,.4,.75,'#435440');mg.box(x,1,z,.1,2,1.45,'#7a7480');mgE.box(x,1,z+.52,.72,1.35,.03,open?'#9fc8ff':'#544c62');mgE.sph(x,1.55,z+.55,.22,.3,.03,open?'#ffffff':'#817694');return;}
    case 'mondpilze':for(const [dx,dz,r] of [[-.3,0,.18],[.1,-.12,.24],[.35,.12,.14]]){mg.cyl(x+dx,.13,z+dz,.035,.26,'#dbe8e0');mgE.sph(x+dx,.3,z+dz,r,.08,r,'#9fdcff',true);}return;
    // Etappe 5: Park, Tafeln, Wettbewerb, Trophäen
    // Etappe 5: schmiedeeiserner Zaun mit Tor vor der Villa am Lindenhang
    case 'villazaun':{const w=o.w||5,zz=o.y+.55,IRON='#2f2f3a',GOLD='#d8b04a';
     for(const px of [o.x+.12,o.x+w-.12,x-.62,x+.62]){mg.box(px,.45,zz,.2,.9,.2,'#d8d0c0');mg.box(px,.93,zz,.26,.06,.26,'#c8c0b0');mgE.sph(px,1.02,zz,.07,.07,.07,GOLD,true);}
     for(const [a,b] of [[o.x+.22,x-.72],[x+.72,o.x+w-.22]]){mg.box((a+b)/2,.12,zz,b-a,.05,.04,IRON);mg.box((a+b)/2,.62,zz,b-a,.05,.04,IRON);const n=Math.round((b-a)/.16);for(let i=0;i<=n;i++){const bx=a+i*(b-a)/n;mg.box(bx,.37,zz,.03,.55,.03,IRON);mg.sph(bx,.67,zz,.025,.04,.025,GOLD);}}
     for(let i=0;i<9;i++){const bx=x-.5+i*.125,h=.62+Math.sin(i/8*Math.PI)*.18;mg.box(bx,.06+h/2,zz,.03,h,.03,IRON);}mg.box(x,.12,zz,1.04,.05,.04,IRON);
     for(let i=0;i<9;i++){const a=i/8*Math.PI;mg.sph(x-Math.cos(a)*.5,.68+Math.sin(a)*.18,zz,.03,.03,.03,IRON);}mgE.sph(x,.9,zz,.05,.05,.05,GOLD,true);
     if(!snow)for(const hx of [o.x+.8,o.x+w-.8])mg.sph(hx,.25,zz-.3,.45,.28,.22,'#4f8a3a');return;}
    case 'parkpavillon':{mg.cyl(x,.08,z,1,.16,'#d8cfbc');for(let i=0;i<6;i++){const a=i*Math.PI/3;mg.cyl(x+Math.cos(a)*.8,1.05,z+Math.sin(a)*.8,.06,1.9,'#f4f1ea');}
     mg.add(GEO.cone,M4(x,2.35,z,1.15,.8,1.15),snow?'#f4f8fb':'#557446');mg.sph(x,2.8,z,.09,.09,.09,'#f6d55c');for(let i=0;i<6;i++){const a=i*Math.PI/3+.5;mgE.sph(x+Math.cos(a)*.95,1.95,z+Math.sin(a)*.95,.06,.06,.06,['#f28fb0','#f6d55c','#ffffff'][i%3],true);}
     mg.box(x,.45,z,.9,.06,.35,woodL);return;}
    case 'blumenbeet':{const w=o.w||2;mg.box(x,.12,z,w-.1,.24,.8,woodD);mg.box(x,.22,z,w-.2,.06,.7,'#5a3a24');if(!snow)for(let i=0;i<12;i++){const fx=x-(w-.4)/2+(i%6)*(w-.4)/5,fz=z-.2+Math.floor(i/6)*.4;mg.cyl(fx,.35,fz,.015,.25,'#4f8a3a');mgE.sph(fx,.5,fz,.07,.06,.07,['#f28fb0','#f6d55c','#ffffff','#c49bf2','#e8483a','#f28f5c'][i%6],true);}return;}
    case 'stadtplan':case 'auftragstafel':{for(const dx of [-.32,.32])mg.box(x+dx,.6,z,.07,1.2,.07,woodD);mg.box(x,1.15,z+.02,.85,.62,.06,woodD);
     if(k==='stadtplan'){mg.box(x,1.15,z+.06,.75,.52,.02,'#e8f0f8');for(const [dx,dy,c] of [[-.2,.12,'#d9473a'],[.18,.12,'#6f8f5a'],[-.2,-.12,'#3f5a8a'],[.18,-.12,'#f6d55c']])mg.box(x+dx,1.15+dy,z+.075,.22,.16,.01,c);}
     else{mg.box(x,1.15,z+.06,.75,.52,.02,'#c89a6a');for(const [dx,dy,c] of [[-.2,.1,'#f4ead8'],[.15,.12,'#fff4c8'],[-.05,-.12,'#e8f0f8']]){mg.box(x+dx,1.15+dy,z+.075,.24,.22,.01,c);mg.sph(x+dx,1.15+dy+.1,z+.085,.025,.025,.02,'#d9473a');}}
     mg.box(x,1.5,z,.95,.08,.14,'#5a3a24');return;}
    case 'bauschild':mg.box(x,.5,z,.07,1,.07,woodD);mg.box(x,.95,z+.04,.7,.42,.04,'#f6d55c');for(let i=0;i<4;i++)mg.add(GEO.box,M4(x-.24+i*.16,.95,z+.065,.05,.44,.01,0,0,.6),'#2b1e2a');mg.box(x,.95,z+.07,.4,.22,.01,'#f4f1ea');return;
    case 'wettbewerbstand':{const w=o.w||2;mg.box(x,.42,z,w-.1,.08,.8,'#f4f1ea');mg.box(x,.22,z+.38,w-.1,.4,.02,'#e8dcc0');for(let i=0;i<8;i++)mg.box(x-(w-.2)/2+i*(w-.2)/7,.22,z+.395,.1,.4,.01,'#d9473a');
     for(const dx of [-w/2+.1,w/2-.1])mg.box(x+dx,.95,z-.3,.06,1.9,.06,woodD);for(let i=0;i<9;i++)mg.box(x-(w-.3)/2+i*(w-.3)/8,1.8,z-.3,(w-.3)/9,.18,.03,i%2?'#f6d55c':'#d9473a');
     mg.cyl(x-.55,.55,z,.25,.18,'#b07a3e');mg.sph(x-.62,.7,z,.13,.12,.13,'#e8842a');mg.sph(x-.45,.68,z+.05,.1,.1,.1,'#e8483a');mg.cyl(x+.55,.55,z,.25,.18,'#b07a3e');mg.sph(x+.5,.7,z,.12,.1,.12,'#f3c34a');mg.sph(x+.65,.7,z,.1,.1,.1,'#a8e07a');
     mg.cyl(x,.52,z,.07,.12,'#c9a46a');mg.cyl(x,.7,z,.14,.22,'#f6d55c');mgE.sph(x,.84,z,.13,.03,.13,'#fff4c8');return;}
    case 'trophaeen':{mg.box(x,.9,z-.15,.85,1.8,.4,woodD);for(const y of [.55,1.05,1.55])mg.box(x,y,z-.02,.8,.05,.32,woodL);
     for(const [dx,y] of [[-.22,.6],[.2,.6],[0,1.1],[-.22,1.6],[.2,1.6]]){mg.cyl(x+dx,y+.05,z+.02,.05,.06,'#c9a46a');mg.cyl(x+dx,y+.16,z+.02,.09,.16,'#f6d55c');mgE.sph(x+dx,y+.25,z+.02,.08,.02,.08,'#fff4c8');}return;}
    case 'mondblumen':mg.sph(x,.05,z,.45,.08,.4,'#3f5a46');for(const [dx,dz,h] of [[-.28,.1,.45],[.05,-.12,.62],[.3,.12,.5],[.12,.25,.34]]){mg.cyl(x+dx,h/2,z+dz,.018,h,'#4f8a62');mgE.sph(x+dx,h+.04,z+dz,.09,.07,.09,'#a8d4ff',true);}return;
    case 'mondsamen_fund':for(let i=0;i<7;i++){const a=i*.9;mg.sph(x+Math.cos(a)*.28,.18,z+Math.sin(a)*.2,.16,.08,.12,'#629f78');}mgE.sph(x,.32,z,.14,.14,.14,'#d9efff',true);return;
    case 'mondsteinring':for(let i=0;i<9;i++){const a=i*.7;mg.sph(x+Math.cos(a)*.55,.08,z+Math.sin(a)*.35,.16,.1,.13,'#8f8a98');}mgE.sph(x,.16,z,.1,.12,.1,'#cfe6ff',true);return;
    case 'regenhaendler':{// Nerio mit Schirm und Handwagen (Kasten, Räder, gestreiftes Planendach, Laterne, Gläser mit Mondtau)
     const cx=x+.62,cz=z-.18;mg.box(cx,.58,cz,.85,.42,.5,'#8a5a33');mg.box(cx,.8,cz,.9,.05,.55,'#c8945a');
     for(const dx of [-.28,.28])mg.cyl(cx+dx,.22,cz+.27,.2,.05,'#4a3428',Math.PI/2);for(const dx of [-.28,.28])mg.cyl(cx+dx,.22,cz+.3,.07,.03,'#c8945a',Math.PI/2);
     for(const dx of [-.4,.4])for(const dz of [-.22,.22])mg.box(cx+dx,1.02,cz+dz,.04,.45,.04,woodD);
     for(let i=0;i<5;i++)mg.box(cx-.4+i*.2,1.26,cz,.2,.05,.62,i%2?'#f4ead8':'#3f6a8a');
     mgE.box(cx+.47,1.02,cz+.26,.1,.14,.1,'#ffd88a');mgE.box(cx-.18,.64,cz+.26,.22,.16,.02,'#cfe6ff');mgE.box(cx+.14,.64,cz+.26,.16,.16,.02,'#b8a4e0');
     mg.box(x-.12,.75,z+.12,.5,1.2,.38,'#40556f');mg.sph(x-.12,1.55,z+.12,.22,.26,.2,'#d2a47e');mg.cyl(x-.12,1.78,z+.12,.36,.05,'#27394f');mg.cyl(x-.12,1.92,z+.12,.2,.26,'#334c66');
     mg.box(x+.14,1.35,z+.12,.03,1.1,.03,'#3a2a20');mg.cone(x+.14,2.02,z+.12,.62,.3,'#5a7fa0');return;}
    case 'bau1':case 'bau2':case 'bau3':{const phase=+k.slice(3),w=o.w||5,d=o.h||4;mg.box(x,.12,z,w,.24,d,'#ada391');if(phase>=2){for(const dx of [-w/2+.2,0,w/2-.2])for(const dz of [-d/2+.2,d/2-.2])mg.box(x+dx,1.1,z+dz,.12,2,.12,woodD);for(const dz of [-d/2+.2,d/2-.2]){mg.box(x,2.05,z+dz,w,.12,.12,wood);mg.box(x,1,z+dz,w,.12,.12,wood);}}if(phase===3){mg.box(x,1.1,z,w-.3,1.8,d-.3,'#dcc3a0');for(const side of [-1,1])mg.add(GEO.box,M4(x+side*w/4,2.4,z,w*.6,.12,d+.3,0,0,side*.5),'#b85b48');mg.box(x,.75,z+d/2,.65,1.4,.05,woodD);}return;}
    case 'ruine':{const w=o.w||5,d=o.h||4;mg.box(x,1,z,w-.4,2,d-.6,'#9c8f7c');mg.box(x,2.25,z,w-.1,.5,d-.2,'#6e5a4e');mg.box(x,2.65,z,w-1.2,.35,d-1.2,'#5a4a40');
     mg.box(x,.75,z+d/2-.28,.7,1.5,.06,'#4a3a30');mg.box(x,1.75,z+d/2-.27,.36,.26,.04,'#e8dcc0');
     for(const dx of [-1.4,1.4]){mg.box(x+dx,1.15,z+d/2-.28,.7,.7,.05,'#3a3430');mg.box(x+dx,1.15,z+d/2-.24,.8,.1,.04,'#a07a50');mg.box(x+dx,1.3,z+d/2-.24,.8,.1,.04,'#a07a50');}
     mg.sph(x-w/2+.4,.15,z+d/2-.1,.35,.2,.3,'#5a7a3a');mg.sph(x+w/2-.5,.15,z+d/2-.1,.3,.25,.3,'#6f8f45');return;}
    case 'brunnen_alt':case 'brunnen_neu':{const neu=k==='brunnen_neu';mg.cyl(x,.28,z,.45,.56,neu?'#b3ab9f':'#8f8a80');(neu?mgE:mg).cyl(x,.57,z,.36,.03,neu?(snow?'#e8f0f6':'#5fb4e8'):'#2b2420');
     if(neu){for(const dx of [-.4,.4])mg.box(x+dx,.9,z,.08,1.1,.08,woodD);mg.box(x,1.48,z,1.1,.08,.7,'#b8302a');mg.box(x,1.1,z,.05,.5,.05,'#d9c9a0');mg.cyl(x,.85,z,.1,.14,wood);}
     else{mg.box(x-.4,.75,z,.08,.9,.08,woodD);mg.box(x+.1,.62,z+.2,.8,.06,.08,woodD);}return;}
    case 'erdhuegel':mg.sph(x,.04,z,.42,.2,.42,'#7a5a3a');mg.sph(x+.1,.12,z-.05,.18,.1,.18,'#94704a');return;
    // Briefkasten-Ereignisse W61–W65
    case 'zettel':mg.box(x,.45,z,.07,.9,.07,woodD);mg.box(x,.85,z+.05,.42,.36,.03,'#f4ead8');mg.box(x,1.02,z+.07,.06,.06,.02,'#d9473a');return;
    // Etappe 2 Romantik und Dorf
    case 'picknick':{mg.box(x,.03,z,1.8,.04,.9,'#f4ead8');for(let i=0;i<6;i++)for(let j=0;j<3;j++)if((i+j)%2)mg.box(x-.75+i*.3,.055,z-.3+j*.3,.3,.012,.3,'#d9473a');
     mg.box(x+.45,.2,z-.12,.42,.3,.3,'#b07a3e');mg.box(x+.45,.36,z-.12,.44,.03,.32,'#e8476a');for(const dx of [-.18,.18])mg.box(x+.45+dx,.46,z-.12,.03,.2,.03,'#8a5a2a');mg.box(x+.45,.56,z-.12,.39,.03,.03,'#8a5a2a');
     mg.cyl(x-.4,.07,z+.12,.2,.02,'#ffffff');[[-.46,.08],[-.36,.16],[-.33,.06]].forEach(([dx,dz])=>mg.sph(x+dx,.11,z+dz,.05,.05,.05,'#e0304a'));mg.cyl(x-.02,.2,z-.22,.07,.34,'#3f6a8a');return;}
    case 'bistro':{mg.cyl(x,.37,z,.06,.72,'#3a3a44');mg.cyl(x,.03,z,.25,.04,'#3a3a44');mg.cyl(x,.75,z,.45,.04,'#f4ead8');for(const a of [0,1,2,3])mg.box(x+Math.cos(a*1.57)*.36,.775,z+Math.sin(a*1.57)*.36,.12,.01,.12,'#d9473a');
     mg.cyl(x,.86,z,.04,.18,'#f4ead8');mg.sph(x,.98,z,.035,.06,.035,'#ffd34a');for(const dx of [-.22,.22])mg.cyl(x+dx,.83,z+.1,.04,.12,'#cfe6ff');
     for(const dx of [-.78,.78]){mg.box(x+dx,.44,z,.4,.05,.4,'#a8743f');for(const lx of [-.16,.16])for(const lz of [-.16,.16])mg.box(x+dx+lx,.21,z+lz,.04,.42,.04,'#6b4423');mg.box(x+dx+(dx<0?-.18:.18),.72,z,.05,.52,.4,'#7a4e2a');}return;}
    case 'geburtstagstisch':{mg.box(x,.62,z,1.8,.08,.8,woodL);for(const sx of [-1,1])for(const sz of [-1,1])mg.box(x+sx*.78,.3,z+sz*.33,.07,.6,.07,woodD);mg.box(x,.67,z,1.7,.01,.75,'#f4ead8');
     mg.cyl(x-.15,.79,z,.26,.22,'#f6e0c8');mg.cyl(x-.15,.91,z,.27,.03,'#ffffff');[[-.3,0],[0,.05],[-.15,-.18]].forEach(([dx,dz])=>mg.sph(x-.15+dx*.7,.94,z+dz,.04,.04,.04,'#e0304a'));
     for(const dx of [-.24,-.15,-.06]){mg.box(x+dx,.99,z+.08,.025,.12,.025,'#8fc0ea');mg.sph(x+dx,1.07,z+.08,.02,.035,.02,'#ffd34a');}
     mg.box(x+.55,.78,z,.24,.24,.24,'#8a5aa8');mg.box(x+.55,.78,z,.25,.25,.05,'#f6d55c');mg.box(x+.55,.78,z,.05,.25,.25,'#f6d55c');return;}
    case 'herzbank':{const w=o.w||2;mg.box(x,.4,z,w-.3,.08,.45,wood);mg.box(x,.68,z-.2,w-.3,.3,.06,woodD);for(const dx of [-(w-.5)/2,(w-.5)/2])mg.box(x+dx,.2,z,.08,.4,.4,'#3a3a44');
     mg.sph(x-.06,.74,z-.165,.07,.07,.02,'#d9304a');mg.sph(x+.06,.74,z-.165,.07,.07,.02,'#d9304a');mg.sph(x,.67,z-.165,.06,.06,.02,'#d9304a');return;}
    case 'tisch_jt':{prop(mg,mgE,Object.assign({},o,{k:'table'}),se,st);for(const dx of [-1.05,1.05]){mg.box(x+dx,.44,z+.12,.48,.08,.48,'#a8743f');for(const lx of [-.18,.18])for(const lz of [-.18,.18])mg.box(x+dx+lx,.21,z+.12+lz,.05,.42,.05,'#6b4423');mg.box(x+dx+(dx<0?-.23:.23),.73,z+.12,.06,.55,.48,'#7a4e2a');}for(const dx of [-.5,.5]){mg.cyl(x+dx,.77,z-.05,.045,.22,'#f4ead8');mg.sph(x+dx,.92,z-.05,.035,.06,.035,'#ffd34a');}
     mg.cyl(x-.15,.75,z+.22,.05,.18,'#cfe6ff');mg.box(x-.15,.88,z+.22,.015,.16,.015,'#3f7a3a');mg.sph(x-.15,.98,z+.22,.055,.055,.055,'#d9304a');return;}
    case 'koffer':mg.box(x,.22,z,.62,.42,.26,'#8a4a2e');for(const dx of [-.2,.2])mg.box(x+dx,.22,z+.135,.04,.42,.01,'#c9a46a');mg.box(x,.47,z,.2,.06,.05,'#3a2a20');return;
    case 'waldtuer':case 'waldtuer_offen':{const open=k==='waldtuer_offen',w=o.w||2;mg.sph(x,.1,z-.2,w*.75,1.2,1,'#5d7a3a');mg.box(x,.8,z+.25,1.3,1.6,.3,'#7d776e');mg.box(x,1.68,z+.25,1.45,.18,.36,'#97918a');
     mg.box(x,.7,z+.41,.8,1.35,.04,open?'#1e1a18':'#5a4a3a');if(!open){mg.box(x+.25,.7,z+.44,.06,.06,.03,'#c9a46a');}mgE.sph(x,1.55,z+.43,.08,.08,.03,'#cfe6ff');return;}
    case 'truhe':case 'truhe_offen':{const open=k==='truhe_offen';mg.box(x,.22,z,.8,.42,.5,wood);for(const dx of [-.3,.3])mg.box(x+dx,.22,z+.255,.06,.44,.01,'#c9a46a');
     if(open)mg.box(x,.62,z-.25,.8,.4,.06,woodD);else{mg.box(x,.5,z,.82,.16,.52,woodL);mg.box(x,.38,z+.27,.1,.12,.02,'#f6d55c');}return;}
    case 'steintafel':mg.box(x,.6,z,.7,1.2,.18,'#8f8a80');mgE.sph(x,.95,z+.1,.12,.12,.03,'#cfe6ff');return;
    /* Dorfbahnhof (Etappe 1b): Schotterbett mit Schwellen und zwei Schienen, die über den Kartenrand hinauslaufen;
       erhöhter Bahnsteig mit heller Sicherheitskante; Zug (Lok + Wagen) mit Rädern auf den Schienen. */
    case 'gleis':{const L=(o.w||16)+60;mg.box(x,.06,z,L,.12,1.9,snow?'#d8d6d0':'#8e877c');for(let xx=x-L/2+.25;xx<x+L/2;xx+=.5)mg.box(xx,.135,z,.16,.05,1.45,'#6b4a33');
     for(const dz of [-.45,.45]){mg.box(x,.19,z+dz,L,.07,.07,'#9aa3ad');mg.box(x,.226,z+dz,L,.012,.05,'#d4dae0');}
     // erhöhter Bahnsteig (zwei Zeilen) mit dunkler Kante zum Gleis und heller Sicherheitslinie
     const w=o.w||16,pz=o.y+(o.h||2);mg.box(x,.04,pz+1,w,.08,2,snow?'#e8e6e2':'#cfc7b8');mg.box(x,.04,pz+.005,w,.08,.01,'#8f887c');mg.box(x,.085,pz+.3,w,.01,.14,'#f8f6ef');return;}
    case 'zug':{const tz=o.y;
     const lx=o.x+1.2;mg.box(lx+.2,.62,tz,2.1,.45,1.05,'#2f4d5c');mg.cyl(lx+.55,.98,tz,.36,1.3,'#2f4d5c',0,Math.PI/2);mg.box(lx-.45,1.12,tz,.85,.95,1.12,'#2f4d5c');mg.box(lx-.45,1.64,tz,1.05,.09,1.26,'#b14f42');
     mgE.box(lx-.45,1.2,tz+.57,.5,.32,.02,'#b5dbe6');mg.cyl(lx+.95,1.45,tz,.1,.45,'#333b40');mg.box(lx+1.3,.55,tz,.1,.2,.8,'#555a60');
     const cx=o.x+4.2;mg.box(cx,1,tz,3.3,.95,1.18,'#3e6578');mg.box(cx,1.53,tz,3.45,.12,1.3,'#b14f42');mg.box(cx,.6,tz+.595,3.3,.08,.01,'#d4bd84');mg.box(cx,.6,tz-.595,3.3,.08,.01,'#d4bd84');
     for(const dx of [-1.15,-.4,.35,1.1])for(const side of [1,-1])mgE.box(cx+dx,1.1,tz+side*.6,.5,.36,.02,'#b5dbe6');mg.box(cx+1.45,.95,tz+.6,.3,.75,.02,'#2c4a59');mg.box(o.x+2.55,.62,tz,.25,.2,.5,'#555a60');
     for(const wx of [lx-.6,lx+.3,lx+1,cx-1.2,cx-.6,cx+.6,cx+1.2])for(const dz of [-.45,.45])mg.cyl(wx,.3,tz+dz,.17,.07,'#32343d',Math.PI/2,0);return;}
    case 'bahnhofhaus_dorf':case 'bahnhofhaus_stadt':{const w=o.w||4,d=o.h||4,zf=z+(d-.4)/2;mg.box(x,.9,z,w-.3,1.8,d-.4,snow?'#ebe3d2':'#efe3c8');mg.box(x,.06,z,w-.1,.12,d-.2,'#8f887c');
     for(let i=0;i<5;i++)mg.box(x,1.9+i*.2,z,w+.2-i*.7,.2,d+.2-i*.75,i%2?'#a8443a':'#8f3a31');if(snow)mg.box(x,2.92,z,w-3,.06,d-2.6,'#ffffff');
     mg.box(x,.55,zf+.01,.55,1.1,.04,'#5a3f2c');for(const dx of [-w/2+.75,w/2-.75]){mgE.box(x+dx,.95,zf+.01,.6,.55,.03,'#b5dbe6');mg.box(x+dx,.66,zf+.04,.7,.06,.08,'#8a5a33');}
     const ty=3.2,tf=z+.33;mg.box(x,ty-.15,z,.62,.75,.62,snow?'#ebe3d2':'#efe3c8');mg.cone(x,ty+.42,z,.48,.45,'#8f3a31');mg.cyl(x,ty,tf+.005,.24,.04,'#3a3a44',Math.PI/2,0);mgE.cyl(x,ty,tf+.025,.2,.03,'#ffffff',Math.PI/2,0);mg.box(x,ty+.06,tf+.05,.025,.13,.01,'#2b2b33');mg.box(x+.05,ty,tf+.05,.1,.025,.01,'#2b2b33');
     signPlane(k==='bahnhofhaus_dorf'?'Dorfbahnhof':'Lindenstadt',Math.min(2.4,w-.6),.32,x,1.25,zf+.03);for(const dx of [-w/2+.35,w/2-.35])mg.box(x+dx,.25,zf+.25,.35,.5,.35,'#8f6a4a');return;}
    case 'ortsschild_dorf':case 'ortsschild_stadt':{for(const dx of [-.7,.7])mg.box(x+dx,.55,z,.07,1.1,.07,'#3a3a44');mg.box(x,1.02,z,1.6,.42,.06,'#2f4d5c');signPlane(k==='ortsschild_dorf'?'Dorfbahnhof':'Lindenstadt',1.5,.34,x,1.02,z+.035);return;}
    case 'fahrplan':mg.box(x,.55,z,.08,1.1,.08,'#3a3a44');mg.box(x,1.08,z,.62,.72,.05,'#f3c34a');mg.box(x,1.08,z+.03,.54,.64,.01,'#fffaf0');mg.box(x,1.32,z+.04,.44,.08,.01,'#2f4d5c');for(let i=0;i<4;i++){mg.box(x-.12,1.18-i*.1,z+.04,.18,.03,.01,'#5a5a64');mg.box(x+.13,1.18-i*.1,z+.04,.16,.03,.01,'#b14f42');}return;
    case 'bank':{const w=o.w||2;mg.box(x,.4,z,w-.3,.08,.45,wood);mg.box(x,.68,z-.2,w-.3,.3,.06,woodD);for(const dx of [-(w-.5)/2,(w-.5)/2])mg.box(x+dx,.2,z,.08,.4,.4,'#3a3a44');return;}
    case 'blumenkuebel':mg.cyl(x,.25,z,.28,.5,'#8f6a4a');mg.sph(x,.58,z,.3,.18,.3,snow?'#e8eef2':'#5a8a3a');if(!snow)[[-.12,'#e0476a'],[.1,'#f6d55c'],[0,'#ffffff']].forEach(([dx,cl],i)=>mg.sph(x+dx,.72,z+(i-1)*.08,.07,.07,.07,cl));return;
    case 'gepaeck':mg.box(x,.3,z,.75,.06,.5,'#5a5a64');for(const dx of [-.3,.3])mg.cyl(x+dx,.12,z+.27,.1,.04,'#32343d',Math.PI/2,0);mg.box(x-.12,.52,z,.4,.4,.3,'#8a4a2e');mg.box(x+.2,.48,z+.02,.3,.3,.25,'#3f6a8a');return;
    case "mailbox": mg.box(x,.35,z+.1,.08,.7,.08,woodD); mg.box(x,.75,z+.1,.32,.24,.44,"#3f6ad8"); mg.cyl(x,.87,z+.1,.16,.44,"#3f6ad8",Math.PI/2); if(st.unread){ mg.box(x+.2,.95,z+.15,.03,.3,.03,"#c42a2a"); mg.box(x+.2,1.05,z+.22,.03,.1,.14,"#e8483a"); } return;
    case "box": mg.box(x,.28,z,.82,.5,.62,wood); for(let i=0;i<3;i++) mg.box(x,.12+i*.16,z+.315,.84,.03,.01,woodD); mg.box(x,.56,z,.9,.08,.7,woodL); return;
    case "doghouse": mg.box(x,.32,z,.75,.6,.7,"#e8d49e"); mg.add(GEO.box,M4(x-.2,.75,z,.5,.08,.82,0,0,.75),snow?"#ffffff":"#c8553d"); mg.add(GEO.box,M4(x+.2,.75,z,.5,.08,.82,0,0,-.75),snow?"#ffffff":"#c8553d"); mg.box(x,.27,z+.355,.32,.38,.02,"#3a2a2a"); return;
    case "trough": { mg.box(x,.18,z,.9,.3,.5,wood); const full=o.act==="trough_h"?st.troughH:st.troughC; if(full) mg.box(x,.31,z,.8,.04,.4,o.act==="trough_h"?"#e8c95a":"#c8b060"); return; }
    case "bush": { const P=PAL3[se], c=snow?"#e4ecf2":P.leaf; [[0,.3,0,.38],[-.22,.24,.08,.28],[.24,.25,.05,.3],[0,.42,-.05,.28]].forEach(([dx,dy,dz,r],i)=>mg.sph(x+dx,dy,z+dz,r,r*.9,r,shade(c,i===3?.08:(i?-.04:0)))); if(st.berries) for(let i=0;i<7;i++){ const a=i*.9; mg.sph(x+Math.cos(a)*.3,.3+(i%3)*.1,z+Math.sin(a)*.15+.25,.055,.055,.055,"#c42a4a",true); } return; }
    case "board": mg.box(x-.35,.5,z,.08,1,.08,woodD); mg.box(x+.35,.5,z,.08,1,.08,woodD); mg.box(x,.75,z+.02,.86,.56,.06,wood); mg.box(x,1.06,z+.02,.95,.08,.14,"#8a5a33"); [[-.2,.82,"#f4f1ea"],[.15,.7,"#f6d55c"],[-.05,.6,"#f4f1ea"],[.25,.86,"#bfe3ff"]].forEach(([dx,dy,c])=>mg.box(x+dx,dy,z+.06,.2,.16,.01,c)); return;
    case "lamp": mg.cyl(x,.7,z,.05,1.4,"#2b2b33"); mg.box(x,.08,z,.22,.16,.22,"#2b2b33"); mgE.box(x,1.45,z,.2,.26,.2,"#ffe0a0"); mg.add(GEO.cone,M4(x,1.66,z,.18,.14,.18),"#2b2b33"); return;
    case "fountain": { const cx=o.x+1, cz=o.y+1; mg.cyl(cx,.2,cz,.95,.4,"#c8c0b2"); mg.cyl(cx,.38,cz,.82,.06,snow?"#e8f0f6":"#5fb4e8"); mg.cyl(cx,.7,cz,.12,.8,"#c8c0b2"); mg.cyl(cx,1.05,cz,.36,.1,"#c8c0b2"); mg.cyl(cx,1.12,cz,.3,.04,snow?"#e8f0f6":"#7cc4ee"); mg.sph(cx,1.25,cz,.1,.14,.1,"#c8c0b2"); return; }
    case "stall": { mg.box(x,.45,z,.9,.08,1.6,wood); mg.box(x-.38,.22,z-.7,.08,.44,.08,woodD); mg.box(x+.38,.22,z+.7,.08,.44,.08,woodD); mg.box(x-.38,.22,z+.7,.08,.44,.08,woodD); mg.box(x+.38,.22,z-.7,.08,.44,.08,woodD);
      mg.box(x-.4,.95,z,.06,1.0,.06,woodD); for(let i=0;i<6;i++) mg.add(GEO.box,M4(x-.05,1.42,z-.75+i*.3,.95,.05,.3,0,0,.25),i%2?"#f4f1ea":"#e8483a");
      if(st.market||o.entdecken) for(let i=0;i<5;i++) mg.sph(x+(i%2?.15:-.15),.55,z-.6+i*.3,.1,.08,.1,["#e8483a","#f6d55c","#8fd263","#f28fb0","#e8842a"][i],true); return; }
    case "sprinkler": mg.cyl(x,.12,z,.08,.24,"#8a8a96"); mg.sph(x,.26,z,.07,.05,.07,"#3f6ad8"); return;
    case "cave": { const cx=o.x+1, cz=o.y+1.2; mg.sph(cx,.2,cz-.2,1.25,1.25,.95,"#6e625a"); mg.sph(cx-.7,.1,cz,.55,.6,.5,"#5e534c"); mg.sph(cx+.75,.1,cz,.6,.55,.5,"#7a6e64"); mg.sph(cx,.35,cz+.55,.48,.62,.25,"#1a1414"); if(snow) mg.sph(cx,1.15,cz-.3,.9,.3,.6,"#ffffff"); return; }
    case "stairs": for(let i=0;i<7;i++){const h=(7-i)*.16;mg.box(x,h/2,z-.85+i*.27,.86,h,.28,wood);mg.box(x,h+.02,z-.85+i*.27,.9,.04,.28,woodL);} for(const sx of [-.47,.47]){mg.box(x+sx,.8,z,.05,1.6,1.8,woodD);} return;
    case "leiter": for(const sx of [-.22,.22]) mg.box(x+sx,.8,z,.06,1.6,.06,woodL); for(let i=0;i<5;i++) mg.box(x,.2+i*.3,z,.44,.05,.05,wood); return;
    case "stove": mg.box(x,.42,z,.86,.84,.8,"#4a4a52"); mg.box(x,.86,z,.9,.06,.84,"#2b2b33"); mg.box(x,.38,z+.41,.6,.4,.02,"#2b2b33"); for(const sx of [-.2,.2]) mg.cyl(x+sx,.9,z,.14,.02,st.cooking?"#e8483a":"#1a1a20"); if(st.cooking){ mg.cyl(x-.2,1.0,z,.16,.18,"#b0b0bc"); } return;
    case "counter": mg.box(x,.42,z,.92,.84,.8,"#c8945a"); mg.box(x,.86,z,.96,.06,.84,"#f0ece4"); mg.box(x,.45,z+.41,.36,.5,.02,"#a8743f"); mg.sph(x+.15,.97,z,.1,.06,.1,"#f4f1ea"); return;
    case "fridge": mg.box(x,.85,z,.84,1.7,.76,"#f0f2f4"); mg.box(x,1.1,z+.39,.8,.02,.02,"#c8ccd2"); mg.box(x+.3,.75,z+.4,.04,.3,.03,"#a8acb4"); mg.box(x+.3,1.35,z+.4,.04,.2,.03,"#a8acb4"); return;
    case "table": { const w=(o.w||1); mg.box(x,.62,z,w*.9,.08,.8,woodL); for(const sx of [-1,1]) for(const sz of [-1,1]) mg.box(x+sx*(w*.42),.3,z+sz*.33,.07,.6,.07,woodD); mg.cyl(x,.72,z,.14,.1,"#f4f1ea"); mg.sph(x+.3,.73,z-.05,.08,.06,.08,"#e8483a"); return; }
    case "tv": mg.box(x,.25,z,.9,.5,.6,woodD); mg.box(x,.85,z-.05,.84,.6,.1,"#1a1a20"); mgE.box(x,.85,z+.01,.74,.5,.02,st.tv?"#8fd0ff":"#2a3040"); return;
    case "plant": mg.cyl(x,.2,z,.2,.4,"#c8644a"); [[0,.62,0,.26],[-.15,.55,.1,.18],[.15,.55,.08,.18],[0,.8,0,.18]].forEach(([dx,dy,dz,r])=>mg.sph(x+dx,dy,z+dz,r,r,r,"#4f9a4a")); return;
    case "bed": { const cx=o.x+1, cz=o.y+1; mg.box(cx,.25,cz,1.8,.4,1.85,woodD); mg.box(cx,.5,cz+.15,1.7,.16,1.5,"#f4f1ea"); mg.box(cx,.6,cz+.3,1.72,.12,1.2,"#c8445a"); mg.box(cx,.62,cz-.6,1.5,.16,.38,"#ffffff"); mg.box(cx,.75,cz-.92,1.85,.95,.12,woodD); return; }
    case "wardrobe": mg.box(x,.95,z,.9,1.9,.7,"#8a5a33"); mg.box(x,.95,z+.36,.02,1.8,.02,"#5a3a22"); mg.sph(x-.08,1.0,z+.37,.04,.04,.04,"#f3c34a",true); mg.sph(x+.08,1.0,z+.37,.04,.04,.04,"#f3c34a",true); return;
    case "workbench": mg.box(x,.6,z,1.85,.1,.8,woodL); for(const sx of [-.85,.85]) mg.box(x+sx,.3,z,.1,.6,.7,woodD); mg.box(x-.4,.72,z,.3,.14,.2,"#8a8a96"); mg.box(x+.4,.7,z-.1,.4,.08,.08,"#c94a3a"); return;
    case "shelf": mg.box(x,.95,z-.1,.9,1.9,.5,"#8a5a33"); for(let i=0;i<4;i++){ mg.box(x,.3+i*.45,z+.02,.84,.04,.46,"#a8743f"); for(let j=0;j<3;j++) mg.box(x-.28+j*.28,.42+i*.45,z+.05,.18,.2,.18,["#e8483a","#f6d55c","#8fd263","#7ac8f0","#f28fb0"][(i+j)%5]); } return;
    case "hay": mg.box(x,.3,z,.85,.55,.7,"#e8c95a"); for(let i=0;i<3;i++) mg.box(x,.12+i*.2,z+.36,.86,.03,.01,"#c9a43c"); return;
    case "crates": mg.box(x,.25,z,.8,.5,.7,wood); mg.box(x+.1,.65,z-.05,.55,.3,.5,woodL); mg.sph(x+.1,.85,z-.05,.12,.08,.12,"#e8483a",true); return;
    case "barrel": mg.cyl(x,.4,z,.32,.8,"#8a5a33"); for(const yy of [.15,.65]) mg.cyl(x,yy,z,.335,.05,"#4a4a52"); return;
    /* ---------- Etappe 3: Café, Tiere, Teich ---------- */
    case 'teehaus_alt':case 'teehaus_bau':case 'cafe':{const cafe=k==='cafe',w=o.w||5,d=o.h||3,front=o.y+d,wall=cafe?'#f3e2c8':'#b9ab94',roof=cafe?'#6f8f5a':'#6e625a';
      mg.box(x,.9,z-.1,w-.3,1.8,d-.4,wall);mg.box(x,.06,z,w-.1,.12,d-.1,'#8f887c');
      mg.add(GEO.box,M4(x,2.15,z-.55,w+.1,.12,d*.62,.62,0,0),snow?'#ffffff':roof);mg.add(GEO.box,M4(x,2.15,z+.35,w+.1,.12,d*.62,-.62,0,0),snow?'#ffffff':roof);
      mg.box(x+1.4,2.4,z-.3,.35,.8,.35,cafe?'#9a5a3a':'#6a5a50');
      const zf=front-.18;mg.box(x,.62,zf+.02,.8,1.24,.06,cafe?'#8a5a33':'#4a3a30');
      for(const dx of [-1.5,1.5]){mg.box(x+dx,1.0,zf+.01,.9,.75,.04,cafe?'#f0e3c8':'#3a3430');(cafe?mgE:mg).box(x+dx,1.0,zf+.04,.78,.64,.02,cafe?'#a8d8f4':'#2b2420');
        if(cafe){mg.box(x+dx,.58,zf+.15,1,.16,.22,'#8a5a33');for(let i=0;i<4;i++)mg.sph(x+dx-.36+i*.24,.72,zf+.16,.08,.08,.08,['#e0476a','#f6d55c','#ffffff','#b49ae0'][i],true);}
        else{mg.add(GEO.box,M4(x+dx,1.0,zf+.07,.9,.08,.03,0,0,.6),'#a07a50');mg.add(GEO.box,M4(x+dx,1.0,zf+.08,.9,.08,.03,0,0,-.6),'#a07a50');}}
      if(cafe){for(let i=0;i<10;i++){const xx=x-w/2+.25+i*(w-.5)/9;mg.add(GEO.box,M4(xx,1.62,zf+.3,(w-.3)/10,.05,.7,-.45,0,0),i%2?'#f4ead8':'#d9473a');}
        signPlane('Café Mondlicht',2.4,.42,x,1.95,zf+.06);}
      else if(k==='teehaus_bau'){for(const dx of [-w/2+.2,0,w/2-.2])mg.box(x+dx,1.1,zf+.25,.1,2.2,.1,'#96613a');mg.box(x,1.6,zf+.26,w,.08,.08,'#bf925b');mg.box(x+1.6,.2,zf+.6,.8,.4,.5,'#a8743f');}
      return;}
    case 'kundenstopper':mg.add(GEO.box,M4(x,.42,z,.5,.8,.04,.22,0,0),'#2f4a3a');mg.add(GEO.box,M4(x,.42,z-.18,.5,.8,.04,-.22,0,0),'#2f4a3a');mg.box(x,.55,z+.1,.36,.04,.01,'#f4f1ea');mg.box(x,.45,z+.12,.3,.03,.01,'#f6d55c');return;
    case 'cafe_theke':{const w=o.w||3;mg.box(x,.48,z,w-.1,.96,.8,'#8a5a33');mg.box(x,.98,z,w,.06,.9,'#e9dfc8');for(let i=0;i<w;i++)mg.box(o.x+i+.5,.5,z+.41,.8,.7,.02,'#a8743f');
      mg.box(x-.9,1.25,z-.1,.45,.5,.4,'#5a5a64');mg.box(x-.9,1.52,z-.1,.5,.06,.44,'#7a7a84');mg.cyl(x-.9,1.06,z+.12,.06,.1,'#f4f1ea');mg.box(x-.75,1.35,z+.11,.06,.06,.02,'#e8483a');
      mg.cyl(x+.1,1.08,z,.16,.14,'#f6d55c');mg.cyl(x+.1,1.17,z,.1,.04,'#e8b84a');mg.cyl(x+.7,1.07,z,.07,.1,'#f4f1ea');mg.cyl(x+.9,1.07,z+.1,.07,.1,'#f4f1ea');return;}
    case 'vitrine':{const w=o.w||2;mg.box(x,.4,z,w-.1,.8,.8,'#7a4a2e');for(const sx of [-1,1])for(const sz of [-1,1])mg.box(x+sx*(w/2-.1),1.07,z+sz*.37,.05,.5,.05,'#7a4a2e');for(const sz of [-1,1])mg.box(x,1.33,z+sz*.38,w-.1,.05,.05,'#7a4a2e');for(const sx of [-1,1])mg.box(x+sx*(w/2-.05),1.33,z,.05,.05,.8,'#7a4a2e');
      const glas=new THREE.Mesh(new THREE.BoxGeometry(w-.2,.01,.7),new THREE.MeshPhongMaterial({color:'#d8eef8',transparent:true,opacity:.16,depthWrite:false,shininess:100}));glas.position.set(x,1.36,z);world.add(glas);
      mg.box(x,1.07,z-.38,w-.2,.48,.02,'#e9f4fa');mg.box(x,.82,z,w-.15,.04,.75,'#f4f1ea');
      const v=E.S.cafe?Object.keys(E.S.cafe.vit):[];v.slice(0,6).forEach((kk,i)=>{const col={mondkuchen:'#f3d77a',shake:'#f6b3c9',erdbeere:'#d9283a',suppe:'#c94a3a',kuerbissuppe:'#e8842a',nudeln:'#f0d38a',tee:'#a8c84a',rolle:'#e8b86a',ei:'#fbf6e9',milch:'#f4f1ea'}[kk]||'#e8b84a';
        const px=x-w/2+.35+(i%3)*.6,py=i<3?.9:1.12,pz=z+(i<3?.1:-.1);mg.cyl(px,py-.02,pz,.2,.02,'#ffffff');mg.cyl(px,py+.05,pz,.15,.1,col);
        if(kk==='mondkuchen'){mg.cyl(px,py+.05,pz,.152,.025,'#d9473a');mg.cyl(px,py+.11,pz,.15,.025,'#fff0cf');mg.sph(px,py+.15,pz,.05,.04,.05,'#e0476a');}
        if(kk==='erdbeere')for(const dx of [-.07,.06]){mg.sph(px+dx,py+.12,pz,.06,.08,.06,'#d9283a');mg.box(px+dx,py+.2,pz,.08,.015,.04,'#4f9a4a');}});return;}
    case 'tafel':{const w=o.w||2,c=document.createElement('canvas');c.width=256;c.height=192;const g=c.getContext('2d');g.fillStyle='#2f4a3a';g.fillRect(0,0,256,192);g.strokeStyle='#7a4a2e';g.lineWidth=14;g.strokeRect(0,0,256,192);
      g.fillStyle='#f4f1ea';g.font='bold 30px sans-serif';g.textAlign='center';g.fillText('Heute',128,42);g.font='22px sans-serif';const v=E.S.cafe?Object.keys(E.S.cafe.vit):[];
      (v.length?v.slice(0,4).map(kk=>JM.ITEMS[kk].n):['Bald wieder','frisch für euch']).forEach((t,i)=>{let px=22;while(px>12&&g.measureText(t).width>220){g.font=--px+'px sans-serif';}g.fillText(t,128,82+i*28);g.font='22px sans-serif';});g.fillStyle='#f6d55c';g.beginPath();g.arc(222,30,9,0,6.3);g.fill();
      const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(1.3,.98),new THREE.MeshLambertMaterial({map:t}));m.position.set(x,1.05,z+.08);m.rotation.x=-.12;world.add(m);
      mg.add(GEO.box,M4(x-.5,.6,z,.06,1.3,.06,.12,0,0),'#7a4a2e');mg.add(GEO.box,M4(x+.5,.6,z,.06,1.3,.06,.12,0,0),'#7a4a2e');mg.box(x,.52,z+.06,1.36,.05,.08,'#7a4a2e');return;}
    case 'cafepflanze':mg.cyl(x,.22,z,.22,.44,'#c9683a');mg.cyl(x,.45,z,.24,.04,'#e8843a');[[0,.75,0,.3],[-.18,.62,.1,.22],[.18,.64,.06,.22],[0,.98,0,.2],[.1,.85,-.12,.18]].forEach(([dx,dy,dz,r])=>mg.sph(x+dx,dy,z+dz,r,r,r,'#4f9a4a'));return;
    case 'cafetisch':mg.cyl(x,.36,z,.06,.7,'#6b4423');mg.cyl(x,.03,z,.26,.05,'#6b4423');mg.cyl(x,.72,z,.46,.05,'#c8945a');mg.cyl(x,.755,z,.44,.012,'#f4ead8');
      mg.cyl(x,.82,z,.05,.12,'#cfe6ff');mg.sph(x,.92,z,.06,.06,.06,'#e0476a',true);mg.cyl(x+.2,.79,z-.1,.05,.06,'#f4f1ea');
      for(const dx of [-.24,.24]){mg.cyl(x+dx,.77,z+.12,.1,.012,'#ffffff');mg.cyl(x+dx,.82,z+.12,.065,.09,'#f4ead8');mg.cyl(x+dx,.868,z+.12,.045,.006,'#6b4423');}
      for(const dx of [-.3,0,.3])mg.box(x+dx,.764,z,.025,.006,.65,'#d9707a');
      mg.cyl(x,2.0,z,.01,.6,'#3a3a44');mg.add(GEO.cone,M4(x,1.66,z,.24,.2,.24),'#5f8f6a');mgE.sph(x,1.56,z,.08,.06,.08,'#ffe0a0');return;
    case 'stuhl':{const f=o.face==='l'?-1:1;mg.box(x,.4,z,.4,.06,.4,'#a8743f');mg.box(x-f*.18,.7,z,.05,.6,.4,'#7a4a2e');mg.box(x,.43,z,.34,.02,.34,'#d9473a');for(const sx of [-.16,.16])for(const sz of [-.16,.16])mg.box(x+sx,.2,z+sz,.04,.4,.04,'#6b4423');return;}
    case 'grabstelle':mg.sph(x,.03,z,.42,.12,.38,'#6e4e30');mg.sph(x+.12,.08,z-.06,.16,.08,.14,'#8a6440');mgE.sph(x+.2,.35+Math.sin(x)*.02,z,.04,.04,.04,'#fff6c0');mgE.sph(x-.18,.28,z+.1,.03,.03,.03,'#fff6c0');return;
    case 'leckstein':mg.box(x,.2,z,.08,.4,.08,'#6b4423');mg.sph(x,.48,z,.26,.18,.22,'#ece6ee');return;
    case 'teichschild':mg.box(x,.45,z,.08,.9,.08,woodD);mg.box(x,.85,z+.03,.6,.4,.05,'#e8d8b0');mg.sph(x,.85,z+.07,.14,.06,.02,'#4f8fcf');mg.sph(x+.12,.92,z+.07,.05,.05,.02,'#f3c34a');return;
    case 'teich_bau':mg.sph(x,.1,z,.42,.25,.4,'#8a6a46');mg.add(GEO.box,M4(x+.25,.5,z,.05,.9,.05,0,0,.4),'#8a5a33');mg.box(x+.42,.12,z,.18,.2,.04,'#9aa3ad');return;
    case 'entenhaus':mg.box(x,.3,z,.7,.55,.6,'#c98f5a');mg.add(GEO.box,M4(x-.2,.7,z,.48,.06,.72,0,0,.75),snow?'#ffffff':'#4f7aa0');mg.add(GEO.box,M4(x+.2,.7,z,.48,.06,.72,0,0,-.75),snow?'#ffffff':'#4f7aa0');mg.cyl(x,.25,z+.31,.14,.02,'#3a2218',Math.PI/2);mg.box(x,.03,z+.42,.5,.04,.2,'#e8c95a');return;
    case 'futterstelle':{mg.box(x,.18,z,.9,.3,.5,wood);const t=E.S.tiere&&E.S.tiere.futterE;if(t&&t.day===E.S.day&&t.n>0)mg.box(x,.31,z,.8,.04,.4,'#e8c95a');mg.cyl(x-.3,.42,z-.1,.1,.18,'#4f8fcf');return;}
    case 'korb_wald':mg.cyl(x,.15,z,.32,.3,'#b07a3e');mg.cyl(x,.3,z,.28,.02,'#f4ead8');mg.sph(x+.05,.38,z,.11,.1,.1,'#e08a3a');for(const sx of [-1,1])mg.cone(x+.05+sx*.06,.48,z,.03,.06,'#e08a3a');return;
    case 'pflegekorb':mg.cyl(x,.15,z,.36,.3,'#b07a3e');mg.cyl(x,.3,z,.32,.03,'#d9707a');mg.sph(x-.05,.35,z,.16,.08,.12,'#e08a3a');mg.sph(x+.12,.4,z+.05,.1,.09,.09,'#e08a3a');for(const sx of [-1,1])mg.cone(x+.12+sx*.05,.5,z+.05,.03,.06,'#e08a3a');return;
    default:
      if(k.indexOf("counter_")===0){ const w=o.w||1; mg.box(x,.48,z,w-.1,.95,.85,"#a8743f"); mg.box(x,.97,z,w,.07,.95,"#c8945a"); for(let i=0;i<w;i++) mg.box(o.x+i+.5,.5,z+.43,.8,.7,.02,"#8a5a33"); return; }
  }
}
function mondbaum(mg,mgE,o,se,glow){
  const cx=o.x+1, cz=o.y+1.4;
  mg.cyl(cx,.9,cz,.32,1.8,"#6a5a8a"); mg.cyl(cx,.12,cz,.55,.24,"#5a4a7a");
  for(const [dx,dz,r] of [[-.6,.1,.5],[.6,0,.45],[0,.5,.4]]) mg.cyl(cx+dx*.6,.15,cz+dz*.6,.12,.3,"#5a4a7a",0,dx);
  const leaf=se===3?"#cfd8f6":"#8fa8f0";
  [[0,2.5,0,1.15],[-.9,2.1,.2,.8],[.95,2.15,0,.82],[0,2.0,.7,.75],[-.35,3.0,-.2,.75],[.45,2.9,.2,.7]].forEach(([dx,dy,dz,r],i)=>mg.sph(cx+dx,dy,cz+dz,r,r*.9,r,shade(leaf,i%2?-.08:.06)));
  for(let i=0;i<5;i++){ const a=i*1.26; mgE.sph(cx+Math.cos(a)*1.05,2.1+(i%2)*.5,cz+Math.sin(a)*.6+.55,.12,.12,.12,i<glow?"#ffe9a0":"#7a84b8",true); }
}

/* ---------- Pflanzen auf dem Feld ---------- */
const CROPC={zwiebel:"#f4f1ea",pakchoi:"#a8e07a",erdbeere:"#e8434f",weizen:"#e8c95a",tomate:"#e8483a",chili:"#d9302a",mais:"#f3c34a",kuerbis:"#e8842a",suesskartoffel:"#a8487a"};
function crop(mg,x,z,k,st,v){
  const G="#4fa040", GL="#7cc45a", GD="#3a7a32";
  const leaf=(a,len,y,c,tilt)=>mg.add(GEO.sph,M4(x+Math.cos(a)*len*.6,y,z+Math.sin(a)*len*.6,len*.55,.03,len*.22,0,-a,tilt||.35),c);
  if(st===0){ mg.sph(x,.06,z,.16,.05,.16,"#5a3a22",true); for(let i=0;i<3;i++) mg.sph(x-.08+i*.08,.1,z+(i%2)*.05,.025,.02,.025,"#e8d8a8",true); return; }
  if(st===1){ mg.cyl(x,.1,z,.015,.16,G); leaf(0,.18,.18,GL); leaf(Math.PI,.18,.18,GL); return; }
  if(st===2){ mg.cyl(x,.15,z,.02,.26,G); for(let i=0;i<4;i++) leaf(i*1.57+v,.26,.22+i*.02,i%2?G:GL); return; }
  const ripe=st===4;
  switch(k){
    case "blume": for(let i=0;i<5;i++){ const a=i*1.26+v, r=.16; mg.cyl(x+Math.cos(a)*r,.2+(i%2)*.05,z+Math.sin(a)*r,.015,.4+(i%2)*.1,"#4f8a3a"); if(ripe) mg.sph(x+Math.cos(a)*r,.44+(i%2)*.1,z+Math.sin(a)*r,.08,.06,.08,["#f28fb0","#f6d55c","#c49bf2","#f28f5c","#ffffff"][i],true); else mg.sph(x+Math.cos(a)*r,.42+(i%2)*.1,z+Math.sin(a)*r,.04,.04,.04,"#8fbf6a"); } return;
    case "mondblume":mg.cyl(x,.38,z,.025,.76,"#4f8a62");for(let i=0;i<6;i++){const a=i*1.047+v;leaf(a,ripe?.42:.3,.62,i%2?"#9fc8ff":"#7ca8cb",.15);}if(st>=3)mg.sph(x,.72,z,ripe?.16:.11,.08,ripe?.16:.11,ripe?"#ffffff":"#cbd7ee",true);return;
    case "zwiebel": for(let i=0;i<6;i++){ const a=i*1.05+v; mg.add(GEO.cyl,M4(x+Math.cos(a)*.06,.25,z+Math.sin(a)*.06,.025,.45,.025,Math.sin(a)*.2,0,Math.cos(a)*.2),i%2?G:GL); } if(ripe) mg.sph(x,.08,z,.12,.1,.12,"#f4f1ea"); return;
    case "pakchoi": for(let i=0;i<7;i++){ const a=i*.9+v; mg.add(GEO.sph,M4(x+Math.cos(a)*.1,.22,z+Math.sin(a)*.1,.1,ripe?.26:.18,.05,Math.sin(a)*.4,-a,Math.cos(a)*.4),i%2?"#9ad070":"#7cc45a"); } mg.cyl(x,.1,z,.08,.18,"#f0f4e8"); return;
    case "erdbeere": for(let i=0;i<5;i++) leaf(i*1.25+v,.3,.16,i%2?G:GL); if(ripe) for(let i=0;i<5;i++){ const a=i*1.25+v+.6; mg.add(GEO.cone,M4(x+Math.cos(a)*.18,.1,z+Math.sin(a)*.18,.06,.1,.06,Math.PI,0,0),"#e8434f"); } return;
    case "weizen": for(let i=0;i<9;i++){ const ox=((i%3)-1)*.18, oz=(Math.floor(i/3)-1)*.18; const c=ripe?"#e8c95a":"#9ac05a"; mg.cyl(x+ox,.28,z+oz,.015,.56,c); mg.sph(x+ox,.6,z+oz,.04,.09,.04,ripe?"#f0d070":"#b0d070",true); } return;
    case "tomate": case "chili": mg.cyl(x,.35,z-.12,.02,.7,"#a8743f"); [[0,.38,0,.22],[-.12,.28,.06,.16],[.12,.3,.04,.17]].forEach(([dx,dy,dz,r])=>mg.sph(x+dx,dy,z+dz,r,r,r,G)); if(ripe) for(let i=0;i<5;i++){ const a=i*1.25+v; if(k==="tomate") mg.sph(x+Math.cos(a)*.2,.25+(i%3)*.09,z+Math.sin(a)*.12+.08,.075,.07,.075,"#e8483a",true); else mg.add(GEO.cone,M4(x+Math.cos(a)*.2,.28+(i%3)*.08,z+Math.sin(a)*.12+.1,.035,.16,.035,Math.PI,0,.3),"#d9302a"); } return;
    case "mais": mg.cyl(x,.5,z,.04,1.0,G); for(let i=0;i<5;i++) leaf(i*1.3+v,.4,.3+i*.14,i%2?G:GL,.6); if(ripe) mg.add(GEO.sph,M4(x+.08,.55,z+.06,.07,.18,.07,0,0,-.3),"#f3c34a"); return;
    case "kuerbis": for(let i=0;i<4;i++) leaf(i*1.57+v,.35,.12,i%2?G:GL); if(ripe){ mg.sph(x,.2,z+.05,.3,.22,.28,"#e8842a"); mg.cyl(x,.45,z+.05,.03,.1,"#5a4a2a"); } else mg.sph(x,.1,z+.05,.12,.1,.12,"#8ac050"); return;
    case "suesskartoffel": for(let i=0;i<6;i++) leaf(i*1.05+v,.3,.15,i%2?"#5a8a3a":"#7a6a9a"); if(ripe) mg.sph(x+.1,.06,z+.12,.14,.08,.1,"#a8487a"); return;
  }
}

/* ---------- Figuren ---------- */
function part(geo,color,x,y,z,sx,sy,sz,parent,o){ const m=new THREE.Mesh(geo,toon(color,o)); m.position.set(x,y,z); m.scale.set(sx,sy==null?sx:sy,sz==null?sx:sz); m.castShadow=true; parent.add(m); return m; }
const CG={ sph:new THREE.IcosahedronGeometry(1,3), cyl:new THREE.CylinderGeometry(1,1,1,12), cap:new THREE.CapsuleGeometry(1,1,4,10), cone:new THREE.ConeGeometry(1,1,14),
  hairCap:new THREE.SphereGeometry(1,20,14,0,Math.PI*2,0,Math.PI*.56), hairBob:new THREE.SphereGeometry(1,20,14,0,Math.PI*2,0,Math.PI*.7), box:new THREE.BoxGeometry(1,1,1), legG:new THREE.CylinderGeometry(1,1,1,10).translate(0,-.5,0), armG:new THREE.CapsuleGeometry(.5,1,4,8).translate(0,-1,0) };
function makeChar(L){
  const root=new THREE.Group(), body=new THREE.Group(); root.add(body);
  const skin=L.skin, hair=L.hair, top=L.top, bot=L.bot||"#3b4a6b";
  const legs=[], arms=[];
  for(const sx of [-1,1]){
    const lg=new THREE.Group(); lg.position.set(sx*.075,.3,0); body.add(lg);
    part(CG.legG,L.dress?skin:bot,0,0,0,.06,.26,.06,lg); part(CG.sph,L.shoes||"#4a3a2a",0,-.27,.03,.075,.05,.1,lg); legs.push(lg);
  }
  // Rumpf
  if(L.dress){ part(CG.cone,bot,0,.38,0,.21,.36,.19,body); }
  else { part(CG.cyl,bot,0,.33,0,.15,.12,.13,body); }
  const torso=part(CG.cap,top,0,.48,0,.13,.12,.11,body);
  if(L.overall&&!L.dress){ part(CG.cyl,bot,0,.45,.015,.14,.16,.12,body); part(CG.box,bot,0,.55,.1,.16,.12,.02,body); for(const sx of [-1,1]) part(CG.box,bot,sx*.07,.6,.095,.03,.14,.02,body); }
  if(L.apron) part(CG.box,L.apron,0,.42,.13,.2,.26,.02,body);
  if(L.coat) part(CG.cyl,top,0,.36,0,.165,.24,.14,body);
  if(L.scarf) part(CG.tor||CG.cyl,L.scarf,0,.6,0,.12,.04,.11,body);
  if(L.tie) part(CG.box,L.tie,0,.52,.12,.04,.14,.02,body);
  for(const sx of [-1,1]){
    const ag=new THREE.Group(); ag.position.set(sx*.17,.6,0); body.add(ag);
    part(CG.armG,top,0,0,0,.09,.12,.09,ag); part(CG.sph,skin,0,-.26,0,.05,.05,.05,ag); ag.rotation.z=sx*.12; arms.push(ag);
  }
  // Kopf
  const head=new THREE.Group(); head.position.set(0,.88,0); body.add(head);
  part(CG.sph,skin,0,0,0,.25,.24,.23,head);
  part(CG.sph,skin,0,-.02,.02,.24,.21,.23,head);
  // Augen
  const eyes=[];
  for(const sx of [-1,1]){ const e=new THREE.Group(); e.position.set(sx*.088,-.03,.232); head.add(e); part(CG.sph,"#2b1e2a",0,0,0,.048,.068,.03,e); part(CG.sph,"#ffffff",.016*sx,.024,.022,.016,.02,.01,e); part(CG.sph,"#6a4a8a",0,-.03,.012,.03,.025,.02,e); eyes.push(e);
    part(CG.sph,"#f4a0a0",sx*.155,-.1,.19,.045,.028,.02,head,{transparent:true,opacity:.65}); }
  part(CG.sph,"#c87a6a",0,-.12,.228,.02,.009,.008,head);
  head.rotation.x=-.22;
  // Haare
  const hc=part(CG[L.style==="bob"?"hairBob":"hairCap"],hair,0,.005,-.015,.265,.265,.255,head); hc.rotation.x=-.32;
  for(let i=0;i<5;i++){ const b=part(CG.sph,hair,-.16+i*.08,.12-Math.abs(i-2)*.012,.17,.06,.07,.05,head); b.rotation.x=.4; }
  if(L.style==="long"){ part(CG.cap,hair,0,-.18,-.12,.21,.14,.08,head); for(const sx of [-1,1]) part(CG.cap,hair,sx*.2,-.12,-.02,.06,.1,.06,head); }
  if(L.style==="braid"){ part(CG.cap,hair,.1,-.2,-.14,.06,.16,.06,head); part(CG.sph,L.tie||"#f6d55c",.1,-.42,-.15,.04,.04,.04,head); }
  if(L.style==="bun"){ part(CG.sph,hair,0,.18,-.16,.11,.11,.11,head); }
  if(L.style==="bob"){ part(CG.cyl,hair,0,-.06,-.02,.27,.16,.25,head); }
  if(L.clip) part(CG.sph,L.clip,.17,.13,.12,.035,.035,.035,head);
  if(L.beard){ part(CG.sph,hair,0,-.13,.1,.18,.1,.12,head); part(CG.sph,skin,0,-.1,.2,.06,.025,.02,head); }
  if(L.glasses){ for(const sx of [-1,1]) part(CG.box,L.glasses,sx*.085,-.02,.225,.09,.07,.01,head,{transparent:true,opacity:.55}); }
  if(L.hat==="chef"){ part(CG.cyl,"#ffffff",0,.25,-.02,.2,.16,.2,head); part(CG.sph,"#ffffff",0,.36,-.02,.24,.12,.24,head); }
  if(L.hat==="cap"){ part(CG.hairCap,L.hatC,0,.04,-.02,.27,.27,.27,head).rotation.x=-.1; part(CG.cyl,L.hatC,0,.07,.2,.2,.02,.13,head); }
  const sitLegs=new THREE.Group();body.add(sitLegs);sitLegs.visible=false;
  for(const sx of [-1,1]){const col=L.dress?skin:bot;part(CG.box,col,sx*.075,.3,.12,.12,.1,.28,sitLegs);part(CG.legG,col,sx*.075,.3,.24,.06,.34,.06,sitLegs);part(CG.sph,L.shoes||"#4a3a2a",sx*.075,-.04,.27,.075,.05,.1,sitLegs);}
  root.userData={legs,sitLegs,arms,body,head,eyes,ph:rnd()*6,blinkT:rnd()*4};
  root.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
  return root;
}
function makePoodle(fell,collar){
  const F=JM.FELL[fell]||JM.FELL.weiss, c=F.c, s=F.s;
  const root=new THREE.Group(), body=new THREE.Group(); root.add(body);
  const fluff=(x,y,z,r,col)=>part(CG.sph,col||c,x,y,z,r,r,r,body);
  part(CG.sph,c,0,.3,0,.15,.13,.22,body);           // Rumpf
  fluff(0,.36,.14,.15); fluff(0,.33,-.16,.12,s);   // Brust, Hinterteil
  const legs=[];
  for(const [lx,lz] of [[-.08,.12],[.08,.12],[-.08,-.13],[.08,-.13]]){ const lg=new THREE.Group(); lg.position.set(lx,.27,lz); body.add(lg); part(CG.legG,c,0,0,0,.03,.2,.03,lg); part(CG.sph,c,0,-.21,.01,.055,.05,.06,lg); legs.push(lg); }
  const head=new THREE.Group(); head.position.set(0,.52,.2); body.add(head);
  part(CG.sph,c,0,0,0,.11,.11,.11,head);
  part(CG.sph,c,0,-.02,.1,.06,.05,.08,head);
  part(CG.sph,"#2b1e2a",0,-.0,.18,.025,.02,.02,head);
  for(const sx of [-1,1]){ part(CG.sph,F.e||"#1a1a1a",sx*.05,.03,.09,.018,.022,.01,head); part(CG.sph,s,sx*.11,-.05,0,.055,.09,.05,head); }
  part(CG.sph,c,0,.11,-.01,.09,.08,.09,head);       // Haarknoten
  part(CG.cyl,collar,0,-.1,0,.075,.025,.075,head);
  const tail=new THREE.Group(); tail.position.set(0,.38,-.22); body.add(tail); part(CG.cyl,c,0,.06,0,.015,.12,.015,tail); part(CG.sph,c,0,.15,0,.06,.06,.06,tail); tail.rotation.x=-.5;
  root.userData={legs,body,head,tail,ph:rnd()*6};
  root.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
  root.scale.setScalar(1.15);
  return root;
}
function makeHen(col){
  const root=new THREE.Group(), body=new THREE.Group(); root.add(body);
  part(CG.sph,col,0,.2,0,.13,.12,.16,body); part(CG.sph,col,0,.24,-.13,.08,.1,.06,body);
  const head=new THREE.Group(); head.position.set(0,.36,.11); body.add(head);
  part(CG.sph,col,0,0,0,.075,.075,.075,head); part(CG.cone,"#f3b23a",0,-.01,.09,.025,.05,.025,head).rotation.x=Math.PI/2; part(CG.sph,"#e8483a",0,.07,0,.025,.035,.04,head); part(CG.sph,"#e8483a",0,-.05,.06,.02,.03,.015,head);
  for(const sx of [-1,1]) part(CG.sph,"#2b1e2a",sx*.05,.02,.05,.012,.014,.01,head);
  const legs=[]; for(const sx of [-1,1]){ const lg=new THREE.Group(); lg.position.set(sx*.05,.1,0); body.add(lg); part(CG.legG,"#f3b23a",0,0,0,.012,.1,.012,lg); legs.push(lg); }
  root.userData={legs,body,head,ph:rnd()*6}; root.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); return root;
}
function makePet(kind,look){
  const root=new THREE.Group(), body=new THREE.Group(); root.add(body); const legs=[]; let head,tail=null,jaw=null,carry=null,wake=null;
  const leg=(x,z,h,r,col,y)=>{ const lg=new THREE.Group(); lg.position.set(x,y,z); body.add(lg); part(CG.legG,col,0,0,0,r,h,r,lg); legs.push(lg); };
  if(kind==="katze"||kind==="kaetzchen"){ const c=kind==="kaetzchen"?"#e08a3a":"#8f8f99", d=kind==="kaetzchen"?"#c86a2a":"#6e6e78";
    part(CG.sph,c,0,.2,0,.12,.1,.2,body); part(CG.sph,d,0,.27,-.02,.07,.03,.14,body);
    for(const [lx,lz] of [[-.06,.12],[.06,.12],[-.06,-.12],[.06,-.12]]) leg(lx,lz,.14,.025,c,.16);
    head=new THREE.Group(); head.position.set(0,.33,.18); body.add(head); part(CG.sph,c,0,0,0,.1,.09,.09,head); part(CG.sph,"#f4f1ea",0,-.03,.07,.05,.03,.03,head);
    for(const sx of [-1,1]){ part(CG.cone,c,sx*.055,.09,0,.035,.07,.03,head); part(CG.sph,"#9ad86a",sx*.04,.015,.08,.018,.022,.01,head); part(CG.sph,"#1a1a1a",sx*.04,.015,.088,.008,.016,.006,head); }
    part(CG.sph,"#f0a8b0",0,-.015,.09,.012,.01,.01,head);
    tail=new THREE.Group(); tail.position.set(0,.24,-.19); body.add(tail); part(CG.cyl,c,0,.1,0,.02,.22,.02,tail).rotation.x=-.4;
    if(kind==="kaetzchen") root.scale.setScalar(.72); }
  else if(kind==="ziege"){ const W="#f2eee6", S2="#d4cdc0";
    part(CG.sph,W,0,.42,0,.18,.16,.28,body);
    for(const [lx,lz] of [[-.09,.17],[.09,.17],[-.09,-.17],[.09,-.17]]){ leg(lx,lz,.3,.03,S2,.32); part(CG.cyl,"#5a4a40",0,-.3,0,.035,.03,.035,legs[legs.length-1]); }
    head=new THREE.Group(); head.position.set(0,.6,.3); body.add(head); part(CG.sph,W,0,0,0,.1,.1,.13,head); part(CG.sph,S2,0,-.03,.12,.06,.05,.05,head);
    for(const sx of [-1,1]){ part(CG.cone,"#b8a888",sx*.05,.12,-.03,.022,.13,.022,head).rotation.x=-.5; part(CG.sph,W,sx*.11,.02,-.02,.05,.02,.03,head); part(CG.sph,"#3a2a2a",sx*.055,.03,.09,.014,.016,.01,head); }
    jaw=new THREE.Group(); jaw.position.set(0,-.07,.09); head.add(jaw); part(CG.sph,S2,0,0,.02,.045,.025,.05,jaw); part(CG.cone,"#e8e2d8",0,-.06,.02,.025,.08,.025,jaw).rotation.x=Math.PI;
    carry=part(CG.sph,"#5fb64c",0,-.04,.16,.05,.03,.06,head); carry.visible=false;
    tail=new THREE.Group(); tail.position.set(0,.5,-.27); body.add(tail); part(CG.cone,W,0,.04,0,.03,.08,.03,tail); }
  else { const P={wild:["#8a6a46","#3f7a4a"],weiss:["#f6f4ee","#f6f4ee"],gold:["#f3d04a","#f6e07a"]}[look]||["#8a6a46","#3f7a4a"];
    part(CG.sph,P[0],0,.13,0,.12,.08,.17,body); part(CG.sph,P[0],0,.17,-.15,.05,.04,.06,body);
    for(const sx of [-1,1]) leg(sx*.04,.02,.08,.012,"#f3a83a",.08);
    head=new THREE.Group(); head.position.set(0,.27,.12); body.add(head); part(CG.sph,P[1],0,0,0,.07,.07,.07,head); part(CG.box,"#f3a83a",0,-.015,.08,.06,.02,.06,head);
    for(const sx of [-1,1]) part(CG.sph,"#1a1a1a",sx*.045,.02,.04,.012,.014,.01,head);
    wake=new THREE.Mesh(new THREE.RingGeometry(.17,.24,16),new THREE.MeshBasicMaterial({color:"#e8f6ff",transparent:true,opacity:.55,depthWrite:false})); wake.rotation.x=-Math.PI/2; wake.position.y=.075; root.add(wake); wake.visible=false;
    if(kind==="kueken") root.scale.setScalar(.6); }
  root.userData={legs,body,head,tail,jaw,carry,wake,ph:rnd()*6}; root.traverse(o=>{ if(o.isMesh&&o!==wake) o.castShadow=true; }); return root;
}
function makeCow(brown){
  const root=new THREE.Group(), body=new THREE.Group(); root.add(body);
  const base=brown?"#a8703f":"#f4f1ea", spot=brown?"#f4f1ea":"#2b2b33";
  part(CG.cap,base,0,.52,0,.22,.3,.2,body).rotation.x=Math.PI/2;
  part(CG.sph,spot,.18,.6,.05,.08,.1,.14,body); part(CG.sph,spot,-.19,.5,-.15,.06,.09,.1,body);
  const head=new THREE.Group(); head.position.set(0,.68,.42); body.add(head);
  part(CG.sph,base,0,0,0,.17,.16,.16,head); part(CG.sph,"#f2b8b0",0,-.07,.13,.12,.08,.07,head);
  for(const sx of [-1,1]){ part(CG.sph,"#2b1e2a",sx*.08,.04,.13,.02,.026,.01,head); part(CG.cone,"#f0e6d0",sx*.1,.15,0,.025,.09,.025,head).rotation.z=-sx*.5; part(CG.sph,base,sx*.17,.05,-.02,.07,.03,.04,head); }
  const legs=[]; for(const [lx,lz] of [[-.12,.2],[.12,.2],[-.12,-.2],[.12,-.2]]){ const lg=new THREE.Group(); lg.position.set(lx,.32,lz); body.add(lg); part(CG.legG,base,0,0,0,.05,.32,.05,lg); part(CG.cyl,"#4a3a2a",0,-.3,0,.055,.04,.055,lg); legs.push(lg); }
  root.userData={legs,body,head,ph:rnd()*6}; root.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); root.scale.setScalar(1.25); return root;
}

/* ---------- Szene je Karte ---------- */
let world=null, wkey="", dyn=null, dkey="", dynT=0, actors=null, water=null, groundTex=null, pick=[], lightsSrc=[], ITEMSPR={}, smokeP=[];
function clear(g){ if(!g) return; scene.remove(g); g.traverse(o=>{ if(o.geometry&&!Object.values(GEO).includes(o.geometry)&&!Object.values(CG).includes(o.geometry)) o.geometry.dispose(); if(o.material&&o.material.map&&o.material.map!==rippleTex&&!o.material.map.userData.keep) o.material.map.dispose(); }); }
function buildWorld(){
  const M=E.M, S=E.S, se=E.season();
  clear(world); world=new THREE.Group(); scene.add(world); pick=[]; lightsSrc=[]; SMOKERS.length=0; smokeP=[];
  // Boden
  const gc=paintGround(M,se); groundTex=new THREE.CanvasTexture(gc); groundTex.colorSpace=THREE.SRGBColorSpace; groundTex.anisotropy=renderer.capabilities.getMaxAnisotropy();
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(M.w,M.h),new THREE.MeshLambertMaterial({map:groundTex}));
  ground.rotation.x=-Math.PI/2; ground.position.set(M.w/2,0,M.h/2); ground.receiveShadow=true; world.add(ground);
  // Umgebung außerhalb der Karte
  const outC=M.inside?"#1e1610":M.cave?"#1c1614":PAL3[se].wald;
  const far=new THREE.Mesh(new THREE.PlaneGeometry(M.w+60,M.h+60),new THREE.MeshLambertMaterial({color:outC})); far.rotation.x=-Math.PI/2; far.position.set(M.w/2,-.02,M.h/2); far.receiveShadow=true; world.add(far);
  scene.background=new C3(M.inside?"#1e1610":M.cave?"#120e0c":"#bfe4f6");
  const mg=new Merge(), mgE=new Merge();
  // Wasser
  water=null;
  if(!M.inside&&M.t.some(r=>r.includes(T.WASSER))){
    const wm=new THREE.CanvasTexture(waterMask(M)); const rt=ripple().clone(); rt.needsUpdate=true; rt.repeat.set(M.w/2.5,M.h/2.5); rt.userData.keep=false;
    const mat=new THREE.MeshPhongMaterial({color:se===3?"#a8cce4":"#58aee6",map:rt,alphaMap:wm,transparent:true,opacity:.86,shininess:120,specular:"#ffffff",depthWrite:false});
    water=new THREE.Mesh(new THREE.PlaneGeometry(M.w,M.h),mat); water.rotation.x=-Math.PI/2; water.position.set(M.w/2,.035,M.h/2); water.receiveShadow=true; world.add(water);
    // Seerosen
    if(se!==3) for(let y=0;y<M.h;y++) for(let x=0;x<M.w;x++){ if(M.t[y][x]!==T.WASSER||hsh(x,y,17)%5) continue; const nb=[[1,0],[-1,0],[0,1],[0,-1]].every(([a,b])=>M.t[y+b]&&M.t[y+b][x+a]===T.WASSER); if(!nb) continue;
      const lx=x+.3+h01(x,y,4)*.4, lz=y+.3+h01(x,y,5)*.4; mg.add(new THREE.CylinderGeometry(1,1,1,14,1,false,.3,5.7).toNonIndexed(),M4(lx,.05,lz,.22,.02,.22,0,h01(x,y,6)*6,0),"#4f9e42"); if(hsh(x,y,7)%2){ mg.sph(lx,.09,lz,.07,.05,.07,"#f6a8c8",true); mg.sph(lx,.12,lz,.03,.03,.03,"#ffe27a",true); } }
  }
  // Steg, Zaun, Felsen
  const isT=(x,y,v)=>x>=0&&y>=0&&x<M.w&&y<M.h&&M.t[y][x]===v;
  for(let y=0;y<M.h;y++) for(let x=0;x<M.w;x++){
    const t=M.t[y][x];
    if(t===T.STEG){ for(let i=0;i<4;i++) mg.box(x+.5,.12,y+.125+i*.25,.96,.06,.22,i%2?"#b8844a":"#a8743f"); for(const sx of [.05,.95]) mg.box(x+sx,.06,y+.5,.08,.2,1,"#6b4423"); }
    if(t===T.ZAUN){ const wd="#d0a46a", sn=se===3; mg.box(x+.5,.32,y+.5,.12,.64,.12,wd); mg.box(x+.5,.66,y+.5,.15,.04,.15,sn?"#ffffff":cssShade(wd,.15));
      if(isT(x+1,y,T.ZAUN)) for(const yy of [.25,.48]) mg.box(x+1,yy,y+.5,1,.07,.05,wd);
      if(isT(x,y+1,T.ZAUN)) for(const yy of [.25,.48]) mg.box(x+.5,yy,y+1,.05,.07,1,wd); }
    if(t===T.FELS&&M.cave){ const hh=h01(x,y,9); mg.add(GEO.sphLo,M4(x+.5,.5+hh*.3,y+.5,.72,.95+hh*.5,.72,hh,hh*5,0),shade("#5a4e48",(hh-.5)*.3)); mg.add(GEO.sphLo,M4(x+.3+hh*.4,.25,y+.75,.35,.3,.3,0,hh*3,0),shade("#6a5e56",(hh-.5)*.2)); }
    if(t===T.WAND&&M.inside) wallTile(mg,mgE,M,x,y);
    if(t===T.TUFF&&!M.inside&&!M.cave){ const P=PAL3[se]; for(let i=0;i<3;i++){ const hh=hsh(x,y,i+300), gx=x+.15+(hh%70)/100, gz=y+.15+((hh>>4)%70)/100; for(let k=0;k<4;k++) mg.add(GEO.cone8,M4(gx+(k-1.5)*.04,.1,gz,.035,.22+(k%2)*.08,.035,(k-1.5)*.15,0,(k-1.5)*.25),k%2?P.gd:P.gl); } }
  }
  if(M.id==='i_cafe'){ // Kleine Wandbilder, ohne neue Weltobjekte oder Kollisionen.
    for(const x of [1.8,7.8,12]){mg.box(x,1.45,3.045,.65,.65,.05,'#7a4a2e');mg.box(x,1.45,3.08,.53,.53,.02,'#f4ead8');
      mg.sph(x,1.5,3.1,.16,.16,.012,'#f6d55c');mg.sph(x+.07,1.56,3.12,.13,.13,.012,'#f4ead8');mg.box(x,1.27,3.1,.3,.025,.015,'#5f8f6a');}}
  // Bäume, auch außerhalb des Randes
  if(!M.inside&&!M.cave){
    const list=M.trees.slice();
    for(let y=-15;y<M.h+7;y++) for(let x=-11;x<M.w+11;x++){ if(x>=0&&y>=0&&x<M.w&&y<M.h) continue; if(hsh(x,y,21)%10<7) list.push({x,y,kind:hsh(x,y,22)%3?"pine":"oak"}); }
    world.add(treeSet(list,se));
  }
  // Objekte
  const st=dynState();
  for(const o of M.obj){
    if(BSTYLE[o.k]){ const ls=building(mg,mgE,o,se); ls.forEach(l=>lightsSrc.push(l)); extras5(mg,mgE,o,se); addPick(o.x,o.y,o.w,o.h,o.k==="hotel"?4:o.k==="villa"?3.4:2.6,o); if(EXTRA5[o.k]) lightsSrc.push([o.x+o.w/2,1.3,o.y+o.h+.3,true]); continue; }
    if(o.k==="mondbaum"){ mondbaum(mg,mgE,o,se,Object.keys(S.bundleDone).length); addPick(o.x,o.y,2,2,3,o); continue; }
    if(o.k==="bush") continue; // dynamisch (Beeren)
    prop(mg,mgE,o,se,st); addPick(o.x,o.y,o.w||1,o.h||1,o.k==="lamp"?1.7:(o.k.startsWith("bahnhofhaus")||o.k==="cafe"||o.k.startsWith("teehaus"))?2.6:o.k==="parkpavillon"?2.4:o.k==="stadtplan"||o.k==="auftragstafel"||o.k==="wettbewerbstand"?1.6:o.k==="trophaeen"?1.8:o.k==="tafel"||o.k==="vitrine"?1.4:o.k==="zug"?1.7:o.k==="gleis"?.3:o.k==="picknick"?.6:1.1,o);
    if(o.k==="lamp") lightsSrc.push([o.x+.5,1.45,o.y+.5,true]);
    if(o.k==="tisch_jt"||o.k==="bistro"||o.k==="geburtstagstisch") lightsSrc.push([o.x+(o.w||1)/2,1.1,o.y+.5,true,"kerze"]);
  }
  for(const o of M.obj) if(o.k==="cafetisch") lightsSrc.push([o.x+.5,1.5,o.y+.5,true,"lampe"]);
  // Etappe 3: Deko ohne Kachelsperre (Stühle, Pfotenspur, Lichterkette, Kundenstopper, Kübel)
  for(const d of (M.decor||[])){
    if(d.k==="pfote"){ const px=d.x+.35+(d.r%2)*.3, pz=d.y+.5; /* deutlich, aber flach: Ballen und drei Zehen, etwas größer als im 2D-Raster, damit die Spur auch auf dem Weg lesbar ist */ mg.sph(px,.025,pz,.1,.012,.085,"#3a2618"); for(const [a,b] of [[-.1,-.12],[0,-.16],[.1,-.12]]) mg.sph(px+a,.025,pz+b,.037,.012,.037,"#3a2618"); continue; }
    if(d.k==="lichterkette"){ // Vor der Wandfläche (z=3,0), nicht in deren Holz versenkt.
      for(let i=0;i<d.w*2;i++){const lx=d.x+.25+i*.5,ly=2.12-Math.sin((i+.5)/(d.w*2)*Math.PI*3)**2*.18;
        mg.box(lx,ly+.04,d.y+1.14,.5,.025,.025,'#6b4423');mg.box(lx,ly-.04,d.y+1.14,.025,.13,.025,'#6b4423');
        mgE.sph(lx,ly-.14,d.y+1.14,.075,.095,.075,['#ffd77a','#ffb8a0','#ffe9b0','#c6f09a'][i%4]);}continue; }
    if(d.k==="stuhl"){ prop(mg,mgE,{k:"stuhl",x:d.x+(d.face==="l"?-.45:.45),y:d.y,face:d.face},se,st); continue; }
    prop(mg,mgE,{k:d.k,x:d.x,y:d.y},se,st); }
  if(M.id==="farm") glasshouse(mg,se,S.flags.glas);
  const m1=mg.mesh(); world.add(m1);
  if(mgE.pos.length){ const m2=mgE.mesh(VCE()); world.add(m2); }
  wkey=key0();
}
function wallTile(mg,mgE,M,x,y){
  const Q=M.pal, wh=2.3;
  if(y<=2){ if(y===2&&x>0&&x<M.w-1){ mg.box(x+.5,wh/2,y+.92,1,wh,.16,Q.wall); for(let i=0;i<4;i++) mg.box(x+.125+i*.25,wh/2,y+1.005,.02,wh,.01,Q.wall2); mg.box(x+.5,.12,y+1.01,1,.24,.04,Q.trim); mg.box(x+.5,wh-.06,y+1.0,1,.12,.04,Q.trim);
      if((M.windows||[]).some(([wx])=>wx===x)){ mg.box(x+.5,1.35,y+1.01,.8,.8,.03,Q.trim); mgE.box(x+.5,1.35,y+1.03,.68,.68,.02,"#a8d8f4"); mg.box(x+.5,1.35,y+1.05,.04,.7,.01,Q.trim); mg.box(x+.5,.92,y+1.06,.86,.06,.1,Q.trim); } }
    return; }
  if(x===0||x===M.w-1){ if(y<M.h-1) mg.box(x+(x===0?.85:.15),wh/2,y+.5,.3,wh,1,cssShade(Q.wall,-.08)); return; }
  if(y===M.h-1){ mg.box(x+.5,.2,y+.2,1,.4,.25,cssShade(Q.trim,-.1)); return; }
  // Interior partitions need a visible wall too, not a brown floor-shaped blocker.
  mg.box(x+.5,.7,y+.5,.16,1.4,1,Q.wall);mg.box(x+.5,1.42,y+.5,.2,.05,1,Q.trim);
}
function glasshouse(mg,se,ok){
  const x0=16,z0=24,w=6,d=3, fr=ok?"#f4f1ea":"#8a8a8a";
  for(const [x,z] of [[x0,z0],[x0+w,z0],[x0,z0+d],[x0+w,z0+d]]) mg.box(x,.75,z,.1,1.5,.1,fr);
  mg.box(x0+w/2,1.5,z0,w,.08,.08,fr); mg.box(x0+w/2,1.5,z0+d,w,.08,.08,fr); mg.box(x0,1.5,z0+d/2,.08,.08,d,fr); mg.box(x0+w,1.5,z0+d/2,.08,.08,d,fr);
  for(let i=1;i<w;i++) mg.box(x0+i,.75,z0,.06,1.5,.06,fr);
  mg.box(x0+w/2,.15,z0+d,w,.3,.08,fr); mg.box(x0,.15,z0+d/2,.08,.3,d,fr); mg.box(x0+w,.15,z0+d/2,.08,.3,d,fr);
  if(ok) for(let i=0;i<w;i++) mg.box(x0+i+.5,.8,z0+.02,.9,1.3,.02,"#cfeaf6"); else for(const i of [1,4]) mg.box(x0+i+.5,.8,z0+.02,.9,1.3,.02,"#7a8a96");
}
function addPick(x,y,w,h,ht,o){ const m=new THREE.Mesh(GEO.box,MATS.inv||(MATS.inv=new THREE.MeshBasicMaterial({visible:false}))); m.scale.set(w,ht,h); m.position.set(x+w/2,ht/2,y+h/2); m.userData.obj=o; world.add(m); pick.push(m); }
function key0(){ const M=E.M, S=E.S; return M.id+"|"+(M.houseLevel||0)+"|"+M.w+'x'+M.h+'|'+(S.house?.level||0)+'|'+E.season()+"|"+(S.flags.glas?1:0)+"|"+Object.keys(S.bundleDone).length+"|"+E.unread()+"|"+E.marketDay()+"|"+(S.trough.h>0)+(S.trough.c>0)+"|"+E.cooking()+"|"+E.tvOn()+"|"+(M.romSig||"")+"|"+(S.tiere?S.tiere.futterE.day+":"+S.tiere.futterE.n:"")+"|"+(S.cafe?Object.entries(S.cafe.vit).join(";"):""); }
function dynState(){ const S=E.S; return {unread:E.unread(),troughH:S.trough.h>0,troughC:S.trough.c>0,market:E.marketDay(),cooking:E.cooking(),tv:E.tvOn()}; }
function dynKey(){
  const M=E.M, S=E.S; let k=M.id+E.season();
  if(M.id==="farm") for(const f in S.field){ const v=S.field[f]; k+=f+(v.t?1:0)+(v.w?1:0)+(v.d?1:0)+(v.o||"")+(v.c?v.c.k+E.cropStage(v.c)+(v.c.g?"G":""):"")+";"; }
  if(M.id==="farm") k+="e"+S.eggs.map(g=>g.x+","+g.y).join(";");
  k+="f"+(S.forage[M.id]||[]).map(f=>f.k+f.x+","+f.y).join(";");
  k+="m"+S.mess.filter(m=>m.map===M.id).map(m=>m.k+m.x+","+m.y).join(";");
  if(M.cave) k+="r"+(S.rocks||[]).map(r=>r.k+r.x+","+r.y).join(";");
  for(const o of M.obj) if(o.k==="bush") k+=E.bushBer(o)?"b":"n";
  return k;
}
function iconSprite(k){ let t=ITEMSPR[k]; if(!t){ const src=E.icon(k); const c=document.createElement("canvas"); c.width=src.width*4; c.height=src.height*4; const g=c.getContext("2d"); g.imageSmoothingEnabled=false; g.drawImage(src,0,0,c.width,c.height); t=ITEMSPR[k]=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.magFilter=THREE.NearestFilter; t.userData.keep=true; } const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true})); s.scale.set(.6,.6,1); return s; }
function buildDyn(){
  const M=E.M, S=E.S, se=E.season();
  clear(dyn); dyn=new THREE.Group(); scene.add(dyn); dyn.userData.bob=[];
  const mg=new Merge();
  if(M.id==="farm") for(const key in S.field){
    const [x,y]=key.split(",").map(Number); if(!E.isField(x,y)) continue; const f=S.field[key], cx=x+.5, cz=y+.5;
    if(f.t){ const soil=f.w?"#5e3c24":"#8f623a"; mg.box(cx,.04,cz,.94,.08,.94,soil); for(let i=0;i<3;i++) mg.box(cx,.085,y+.2+i*.3,.86,.012,.06,cssShade(soil,-.2)); if(f.d) for(let i=0;i<5;i++){ const hh=hsh(x,y,i+140); mg.sph(x+.15+(hh%70)/100,.09,y+.15+((hh>>4)%70)/100,.03,.015,.03,"#cfe8a8",true); } if(se===3&&!E.isGlass(x,y)) mg.box(cx,.09,cz,.9,.01,.9,"#f4f8fb"); }
    if(f.c){ const st=E.cropStage(f.c);
      if(st===4&&E.giant(f.c)){ const tmp=new Merge(); crop(tmp,cx,cz,f.c.k,4,h01(x,y,8)*6); const k=2.3; for(let i=0;i<tmp.pos.length;i+=3){ mg.pos.push(cx+(tmp.pos[i]-cx)*k,tmp.pos[i+1]*k,cz+(tmp.pos[i+2]-cz)*k); } mg.nor.push(...tmp.nor); mg.col.push(...tmp.col); for(let i=0;i<6;i++){ const a=i*1.05; mg.sph(cx+Math.cos(a)*.6,.5+(i%3)*.25,cz+Math.sin(a)*.4,.04,.04,.04,"#fff6c0",true); } }
      else crop(mg,cx,cz,f.c.k,st,h01(x,y,8)*6); }
    if(f.o==="weed"){ for(let k=0;k<5;k++) mg.add(GEO.cone8,M4(cx+(k-2)*.07,.14,cz+(k%2)*.06,.05,.3,.05,0,0,(k-2)*.3),k%2?"#4f9a3a":"#6fb44a"); }
    if(f.o==="stone"){ mg.add(GEO.sphLo,M4(cx,.14,cz,.3,.22,.26,.3,.5,0),"#9a948c"); mg.add(GEO.sphLo,M4(cx-.06,.24,cz-.04,.15,.08,.12),"#b8b2a8"); }
    if(f.o==="branch"){ mg.cyl(cx,.08,cz,.05,.75,"#7a4e2a",0,1.3); mg.cyl(cx+.12,.08,cz+.1,.03,.3,"#7a4e2a",.9,.4); }
    if(f.o==="spr"){ mg.cyl(cx,.12,cz,.08,.24,"#8a8a96"); mg.sph(cx,.26,cz,.07,.05,.07,"#3f6ad8"); }
  }
  for(const o of M.obj) if(o.k==="bush"){ prop(mg,null,o,se,{berries:E.bushBer(o)}); addPickDyn(o.x,o.y,1,1,.8,o); }
  if(M.id==="farm") for(const g of S.eggs) mg.sph(g.x+.5,.09,g.y+.55,.08,.1,.08,g.g?"#f3c34a":"#f8f4ec");
  if(M.cave) for(const r of (S.rocks||[])){ const c={stein:"#8a8078",kupfer:"#c8783a",eisen:'#b2bac3',silber:'#eef4ff',amethyst:"#a868d8",mondquarz:"#cfe6ff"}[r.k]||"#8a8078"; mg.add(GEO.sphLo,M4(r.x+.5,.25,r.y+.5,.4,.3,.36,.2,h01(r.x,r.y,1)*3,0),"#7a7068"); if(r.k!=="stein") for(let i=0;i<3;i++) mg.add(GEO.cone8,M4(r.x+.35+i*.15,.45,r.y+.5+(i%2)*.1,.06,.25,.06,0,0,(i-1)*.4),c); addPickDyn(r.x,r.y,1,1,.6,null); }
  if(mg.pos.length) dyn.add(mg.mesh());
  const items=[...(S.forage[M.id]||[]).map(f=>[f.k,f.x,f.y]),...S.mess.filter(m=>m.map===M.id).map(m=>[m.k,m.x,m.y])];
  for(const [k,x,y] of items){ const s=iconSprite(k); s.material.depthTest=false;s.renderOrder=20;s.position.set(x+.5,.4,y+.5); s.userData.x=x;s.userData.collectible={x,y}; dyn.add(s); dyn.userData.bob.push(s); const sh=new THREE.Mesh(new THREE.CircleGeometry(.18,12),MATS.sh||(MATS.sh=new THREE.MeshBasicMaterial({color:"#000",transparent:true,opacity:.18,depthWrite:false}))); sh.rotation.x=-Math.PI/2; sh.position.set(x+.5,.012,y+.5); dyn.add(sh); }
  dkey=dynKey();
}
function addPickDyn(x,y,w,h,ht,o){ const m=new THREE.Mesh(GEO.box,MATS.inv||(MATS.inv=new THREE.MeshBasicMaterial({visible:false}))); m.scale.set(w,ht,h); m.position.set(x+w/2,ht/2,y+h/2); m.userData.obj=o; dyn.add(m); }

/* ---------- Figuren verwalten ---------- */
let AG=null; const ACT=new Map();
function actorsFor(){
  const M=E.M, S=E.S, list=[];
  list.push(["P",E.P,"char",()=>E.playerLook()]);
  if(E.RA.vis) list.push(["rene",E.RA,"char",()=>E.reneLook()]);
  for(const id in E.NPCA){ const a=E.NPCA[id]; if(a.vis) list.push(["npc:"+id,a,"char",()=>JM.NPCS[id].look]); }
  if(M.owner&&E.npcInside()){ const id=M.owner, [nx,ny]=M.npcAt; list.push(["shop:"+id,{x:nx,y:ny,dir:0,frame:0,moving:false},"char",()=>JM.NPCS[id].look]); }
  E.DOGS.forEach(d=>list.push(["dog"+d.i,d,"dog",()=>S.dogs[d.i].fell+"|"+(d.i?"#3f6ad8":"#d9473a")]));
  E.HENS.forEach((h,i)=>list.push(["hen"+i+":"+h.i,h,"hen",()=>h.deco?(h.i===-1?"#f7f5ee":"#c9884a"):(S.hens[h.i].c?"#c9884a":"#f7f5ee")]));
  E.COWS.forEach((c,i)=>list.push(["cow"+i,c,"cow",()=>S.cows[c.i].c?"b":"w"]));
  (E.PETS||[]).forEach(p=>list.push(["pet:"+p.id,p,"pet",()=>p.kind+"|"+p.look]));
  return list;
}
function syncActors(dt){
  if(!AG){ AG=new THREE.Group(); scene.add(AG); }
  const list=actorsFor(), seen=new Set(), t=E.gameT;
  for(const [id,a,kind,lookFn] of list){
    seen.add(id); const look=lookFn(), lk=typeof look==="string"?look:JSON.stringify(look);
    let rec=ACT.get(id);
    if(!rec||rec.lk!==lk){ if(rec) AG.remove(rec.g); const g=kind==="char"?makeChar(look):kind==="dog"?makePoodle(look.split("|")[0],look.split("|")[1]):kind==="hen"?makeHen(look):kind==="pet"?makePet(look.split("|")[0],look.split("|")[1]):makeCow(look==="b"); AG.add(g); rec={g,lk,kind,ry:0,px:a.x,py:a.y,ph:0}; ACT.set(id,rec); g.userData.actorId=id; g.userData.actor=a; }
    const g=rec.g, u=g.userData; u.actor=a;
    const ox=kind==="char"?.5:.5, oz=kind==="char"?.62:.6;
    const sit=kind==="char"&&E.seated(a),side=sit?E.seatSide(a):null;g.position.set(a.x+ox+(sit?(side==="r"?.45:-.45):0),sit?.14:0,a.y+oz);
    // Blickrichtung
    const vx=a.x-rec.px, vz=a.y-rec.py, mv=Math.hypot(vx,vz)>.0005;
    let ry=rec.ry;
    if(kind==="char"){ ry=a.dir===0?0:a.dir===1?Math.PI:(a.flip?-Math.PI/2:Math.PI/2); if(mv) ry=Math.atan2(vx,vz); if(sit)ry=side==="r"?Math.PI/2:-Math.PI/2; if(id.startsWith("shop:")) ry=0; }
    else if(mv) ry=Math.atan2(vx,vz); else if(a.face!=null&&!mv&&rec.kind!=="char"&&!rec.init){ ry=a.face<0?-Math.PI/2:Math.PI/2; rec.init=true; }
    let dr=ry-rec.ry; while(dr>Math.PI) dr-=Math.PI*2; while(dr<-Math.PI) dr+=Math.PI*2; rec.ry+=dr*Math.min(1,dt*12); g.rotation.y=rec.ry;
    rec.px=a.x; rec.py=a.y;
    const moving=a.moving||mv; rec.ph+=dt*(moving?11:0);
    const sw=moving?Math.sin(rec.ph):0;
    if(u.legs){ if(kind==="char"){ u.legs[0].rotation.x=sit?-Math.PI/2:sw*.6; u.legs[1].rotation.x=sit?-Math.PI/2:-sw*.6; } else { u.legs.forEach((l,i)=>l.rotation.x=(i%2?sw:-sw)*(i<2?.6:-.6)); } }
    if(u.sitLegs){u.sitLegs.visible=sit;u.legs.forEach(l=>l.visible=!sit);}
    if(u.arms){ u.arms[0].rotation.x=-sw*.55; u.arms[1].rotation.x=sw*.55; }
    if(u.body) u.body.position.y=moving?Math.abs(Math.sin(rec.ph))*.03:Math.sin(t*2+u.ph)*.006;
    if(kind==="char"){
      u.blinkT-=dt; const bl=u.blinkT<.12; if(u.blinkT<0) u.blinkT=2+rnd()*3; u.eyes.forEach(e=>e.scale.y=bl?.12:1);
      if(id==="P"&&a.tool){ u.arms[1].rotation.x=-1.6+a.busy*4; }
      if(id==="rene"&&a.cuddle){ u.arms[0].rotation.z=-1.2; u.arms[1].rotation.z=1.2; }
    }
    if(kind==="dog"){ const jump=a.trick>0?Math.abs(Math.sin(a.trick*9))*.35:0; g.position.y=jump; const sleep=!moving&&(E.S.min>=1260||a.idle>3); u.body.position.y=sleep?-.12:u.body.position.y; u.legs.forEach(l=>l.visible=!sleep); u.tail.rotation.z=Math.sin(t*(moving?14:6)+u.ph)*.5; u.head.rotation.x=sleep?.3:0; }
    if(kind==="hen"){ u.head.rotation.x=a.peck>0?1.0:0; }
    if(kind==="pet"){ const an=a.anim; if(u.legs) u.legs.forEach(l=>l.visible=an!=="schlaf"&&an!=="schwimm");
      if(an==="schlaf"){ u.body.position.y=-.1; u.body.scale.set(1.15,.75,.85); if(u.head) u.head.rotation.x=.45; if(u.tail) u.tail.rotation.z=1.2; }
      else { u.body.scale.set(1,1,1); if(u.head) u.head.rotation.x=0; if(u.tail) u.tail.rotation.z=Math.sin(t*(moving?10:3)+u.ph)*.4; }
      if(an==="kau"&&u.jaw){ u.head.rotation.x=.18+Math.sin(t*7+u.ph)*.12; u.jaw.rotation.x=Math.abs(Math.sin(t*7+u.ph))*.35; }
      if(an==="schwimm"){ g.position.y=-.06+Math.sin(t*2.6+u.ph)*.02; g.rotation.z=Math.sin(t*1.7+u.ph)*.06; if(u.wake) u.wake.visible=true; } else { g.rotation.z=0; if(u.wake) u.wake.visible=false; }
      if(u.carry){ u.carry.visible=!!a.carry; if(a.carry) u.carry.material=toon({mais:"#f3d04a",tomate:"#e8433a",erdbeere:"#d9283a",kuerbis:"#e8842a",chili:"#d9283a"}[a.carry]||"#5fb64c"); } }
  }
  for(const [id,rec] of ACT) if(!seen.has(id)){ AG.remove(rec.g); ACT.delete(id); }
}
R3.resetActors=function(){ for(const [,rec] of ACT) AG&&AG.remove(rec.g); ACT.clear(); };

/* ---------- Kamera ---------- */
const camT=new V3(), camP=new V3(); let camDist=30; let camInit=false, lastMap="";
let cafeFrameKey='',cafeFrameDist=30;
const cafeCorner=new V3();
// Reine Darstellung: den Raum bzw. die Fassade in den freien HUD-Bereich einpassen.
// Der größte zulässige Zoom zeigt weiter alle Möbel; Kacheln und Treffer bleiben unverändert.
function cafeCamera(pads){
  const M=E.M,P=E.P,glasInnen=M.id==='i_dorfglas',glasAussen=M.id==='gemeinschaftsgarten'&&Math.hypot(P.x-18,P.y-9)<4,innen=M.id==='i_cafe'||glasInnen;
  const aussen=(M.id==='village'&&M.obj.some(o=>o.k==='cafe')&&Math.hypot(P.x-6,P.y-14)<3)||glasAussen;
  if(!innen&&!aussen)return false;
  const bounds=glasInnen?[.7,13.3,2.7,11.6,2.5]:glasAussen?[13.3,22.7,3.2,13.7,3.6]:innen?[.7,13.3,2.8,9.5,2.4]:[3.2,10.2,10.4,16.1,3.4],pitch=innen?.98:glasAussen?.9:.75,yaw=innen?0:glasAussen?.3:.7;
  const H=innerHeight,mid=(pads.t+H-pads.b)/2;
  camera.fov=34;camera.setViewOffset(innerWidth,H,0,H/2-mid,innerWidth,H);camera.updateProjectionMatrix();
  camT.set((bounds[0]+bounds[1])/2,innen?.6:.7,(bounds[2]+bounds[3])/2);
  const pose=dist=>{camera.position.set(camT.x+Math.sin(yaw)*Math.cos(pitch)*dist,camT.y+Math.sin(pitch)*dist,camT.z+Math.cos(yaw)*Math.cos(pitch)*dist);camera.lookAt(camT);camera.updateMatrixWorld();};
  const key=[M.id,innerWidth,H,pads.t,pads.b].join('|');
  if(key!==cafeFrameKey){let lo=4,hi=120;
    for(let i=0;i<14;i++){const dist=(lo+hi)/2;pose(dist);let fits=true;
      for(const x of bounds.slice(0,2))for(const z of bounds.slice(2,4))for(const h of [0,bounds[4]]){
        cafeCorner.set(x,h,z).project(camera);const px=(cafeCorner.x*.5+.5)*innerWidth,py=(-cafeCorner.y*.5+.5)*H;
        if(px<18||px>innerWidth-18||py<pads.t+18||py>H-pads.b-18)fits=false;}
      if(fits)hi=dist;else lo=dist;}
    cafeFrameDist=hi;cafeFrameKey=key;}
  camDist=cafeFrameDist;pose(camDist);camP.copy(camera.position);camInit=true;lastMap=M.id;return true;
}
function cameraUpdate(dt,pads){
  if(cafeCamera(pads))return;
  const M=E.M, P=E.P;
  const zoom=R3.zo||E.zoom(), inside=M.inside||M.cave;
  const sv=E.sceneView();let tx=sv?sv.x:P.x+.5, tz=sv?sv.y:P.y+.6;
  const pitch=inside?.92:.8, fovH=inside?9.5:6.6;
  camera.fov=34; const vfov=camera.fov*Math.PI/180, aspect=camera.aspect;
  // Etappe 5: Auf Querformat (Desktop) zeigte die Außenkamera nur ~9 Reihen Tiefe; hohe Stadtgebäude (Bäckerei, Villa, Hotel)
  // ragten selbst bei kleinstem Zoom oben aus dem Bild. Deshalb im Querformat mindestens 4/5 der Grundbreite als Tiefe zeigen.
  const visW0=fovH/zoom, visW=Math.max(visW0,sv?sv.width:0,(!inside&&!sv&&aspect>1.2)?visW0*.8*aspect:0);
  const visH=visW/aspect;
  const dist=(visH/2)/Math.tan(vfov/2); camDist=dist;
  // Rand begrenzen
  const halfW=visW/2;
  if(M.w>visW) tx=clamp(tx,halfW-1,M.w-halfW+1); else tx=M.w/2;
  if(inside) tz=clamp(tz,M.h*.35,M.h*.75); else tz=clamp(tz,3,M.h-2);
  if(!camInit||lastMap!==M.id||E.camSnap()){ camT.set(tx,0,tz); camInit=true; lastMap=M.id; }
  else { const k=Math.min(1,dt*5); camT.x+=(tx-camT.x)*k; camT.z+=(tz-camT.z)*k; }
  camT.y=0;camP.set(camT.x,Math.sin(pitch)*dist,camT.z+Math.cos(pitch)*dist);
  camera.position.copy(camP); camera.lookAt(camT);
  // freier Bereich zwischen HUD oben und Leiste unten mittig halten
  const H=innerHeight, mid=(pads.t+(H-pads.b))/2, off=(H/2-mid);
  camera.setViewOffset(innerWidth,H,0,off,innerWidth,H);
  camera.updateProjectionMatrix();
}

/* ---------- Licht nach Uhrzeit ---------- */
function lightUpdate(){
  const M=E.M, S=E.S, m=S.min, se=E.season();
  const night=M.moonForest||m>=1140||m<375;
  if(M.inside){ sun.intensity=night?.5:1.4; sun.color.set(night?"#c0a0ff":"#fff1dc"); hemi.intensity=night?.55:1.15; hemi.color.set("#fff0dc"); hemi.groundColor.set("#5a4030"); amb.intensity=night?.25:.35; sun.position.set(camT.x-4,12,camT.z+7); }
  else if(M.cave){ sun.intensity=.45; sun.color.set("#9aa8d8"); hemi.intensity=.6; hemi.color.set("#7080b0"); hemi.groundColor.set("#2a2020"); amb.intensity=.12; sun.position.set(camT.x-3,12,camT.z+5); }
  else {
    const s=clamp((m-780)/420,-1.1,1.1), el=Math.max(.15,Math.cos(s*1.2)), day=clamp(Math.min((m-330)/90,(1170-m)/90),0,1);
    const warm=Math.max(0,Math.abs(s)-.45)/.6;
    const col=new C3("#fff6e8").lerp(new C3("#ffb070"),clamp(warm,0,1)*.85);
    const rain=S.weather!=="sun"?.55:1;
    sun.color.copy(night?new C3("#8fa8ff"):col);
    sun.intensity=(night?.35:2.6*day*rain+.25*(1-day));
    sun.position.set(camT.x+s*-10,6+el*12,camT.z+3);
    hemi.color.set(night?"#5a6aa8":(se===3?"#e8f0ff":"#d8ecff")); hemi.groundColor.set(night?"#202840":"#6a8a4a");
    hemi.intensity=night?.4:.75+.55*day; amb.intensity=night?.08:.22;
    scene.background.set(night?"#141a30":S.weather==="rain"?"#9aa8b8":"#bfe4f6");
  }
  sun.target.position.copy(camT); sun.target.updateMatrixWorld();
  // Fenster und Laternen
  const glow=M.inside?0:(night?1:(m>=1080?(m-1080)/60:0));
  if(MATS.vce){ MATS.vce.emissiveIntensity=M.cave?.6:glow*1.4; MATS.vce.emissive.set(M.moonForest?"#8fc8ff":"#ffb050"); }
  const src=lightsSrc.slice().sort((a,b)=>Math.hypot(a[0]-camT.x,a[2]-camT.z)-Math.hypot(b[0]-camT.x,b[2]-camT.z));
  PL.forEach((l,i)=>{ const s=src[i]; if(s&&glow>0){ l.position.set(s[0],s[1],s[2]); l.intensity=glow*(s[3]?4:2.4); } else l.intensity=0; });
  if(M.inside&&night){ PL[0].position.set(M.w/2,2.2,M.h/2+1); PL[0].intensity=4; PL[0].distance=14; } else PL[0].distance=6;
  lantern.intensity=M.cave?3.2:(night&&!M.inside?1.4:0); lantern.position.set(E.P.x+.5,1.3,E.P.y+.9);
  if(M.cave){ PL.forEach((l,i)=>{ const r=(S.rocks||[]).filter(r=>r.k==="mondquarz"||r.k==="amethyst")[i]; if(r){ l.position.set(r.x+.5,.6,r.y+.5); l.intensity=.9; l.color.set(r.k==="amethyst"?"#c890ff":"#a8d8ff"); } else l.intensity=0; }); }
  else PL.forEach(l=>l.color.set("#ffc070"));
  // Kerzenlicht (Etappe 2): drinnen auch tagsüber ein warmer Schein am Tisch
  if(M.inside&&!M.cave){ const k=lightsSrc.find(l=>l[4]==="kerze"); if(k&&PL[1]){ PL[1].position.set(k[0],k[1],k[2]); PL[1].intensity=night?3:1.6; PL[1].color.set("#ffb060"); } }
  // Café (Etappe 3): warme Hängelampen über den Tischen, auch tagsüber
  if(M.inside){ lightsSrc.filter(l=>l[4]==="lampe").forEach((k,i)=>{ const l=PL[i+1]; if(l){ l.position.set(k[0],k[1],k[2]); l.intensity=night?2.6:1.4; l.color.set(M.moonForest?"#9fd0ff":"#ffc27a"); } }); }
  if(M.inside) scene.fog=null; else { if(!FOG) FOG=new THREE.Fog("#ffffff",40,80); FOG.color.set(M.moonForest?'#596b82':scene.background); FOG.near=M.moonForest?camDist+2:camDist+8; FOG.far=M.moonForest?camDist+24:camDist+45; scene.fog=FOG; }
}

/* ---------- Rauch ---------- */
function smoke(dt){
  if(!world) return;
  if(!smokeP.length&&SMOKERS.length){ for(const s of SMOKERS) for(let i=0;i<6;i++){ const m=new THREE.Mesh(CG.sph,new THREE.MeshLambertMaterial({color:"#eeeef2",transparent:true,opacity:.5,depthWrite:false})); m.userData={s,t:i/6}; world.add(m); smokeP.push(m); } }
  for(const m of smokeP){ const u=m.userData; u.t=(u.t+dt*.18)%1; const t=u.t; m.position.set(u.s[0]+Math.sin(t*5+u.s[0])*.15+t*.4,u.s[1]+t*1.6,u.s[2]-t*.2); const r=.12+t*.22; m.scale.setScalar(r); m.material.opacity=.5*(1-t)*(E.S.weather==="rain"?.4:1); }
}

/* ---------- Leben: Schmetterlinge, Glühwürmchen, Regen, Schnee, Pfützen ---------- */
let LIFE=null;
function lifeInit(){
  LIFE={g:new THREE.Group(),bf:[],ff:[],puddles:[]}; scene.add(LIFE.g);
  const wingG=new THREE.PlaneGeometry(.16,.12); wingG.translate(.08,0,0);
  const cols=["#f6d55c","#ffffff","#f28fb0","#9ad0f0","#f2a03a"];
  for(let i=0;i<7;i++){ const b=new THREE.Group(), m=new THREE.MeshBasicMaterial({color:cols[i%5],side:THREE.DoubleSide});
    const l=new THREE.Mesh(wingG,m), r=new THREE.Mesh(wingG,m); r.scale.x=-1; l.rotation.x=r.rotation.x=-Math.PI/2; b.add(l,r); const bd=new THREE.Mesh(CG.sph,new THREE.MeshBasicMaterial({color:"#3a2a2a"})); bd.scale.set(.02,.02,.06); b.add(bd); b.scale.setScalar(1.6);
    b.userData={l,r,ph:rnd()*9,sp:.6+rnd()*.5,t:rnd()*100}; LIFE.g.add(b); LIFE.bf.push(b); }
  const ffm=new THREE.MeshBasicMaterial({color:"#f6f08a",transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
  for(let i=0;i<26;i++){ const f=new THREE.Mesh(CG.sph,ffm.clone()); f.userData={ph:rnd()*9,t:rnd()*100}; LIFE.g.add(f); LIFE.ff.push(f); }
  // Regen als dünne Striche, Schnee als Flocken
  const N=420; LIFE.rain=new THREE.InstancedMesh(new THREE.BoxGeometry(.02,.45,.02),new THREE.MeshBasicMaterial({color:"#e4efff",transparent:true,opacity:.8,depthWrite:false}),N);
  LIFE.snow=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.035,0),new THREE.MeshBasicMaterial({color:"#ffffff"}),N);
  LIFE.drops=[]; for(let i=0;i<N;i++) LIFE.drops.push([rnd()*30-15,rnd()*9,rnd()*30-15,rnd()]);
  LIFE.g.add(LIFE.rain,LIFE.snow);
  LIFE.rings=[]; const rm=new THREE.MeshBasicMaterial({color:"#e8f2ff",transparent:true,opacity:.6,depthWrite:false});
  for(let i=0;i<40;i++){ const r=new THREE.Mesh(new THREE.RingGeometry(.05,.075,14),rm.clone()); r.rotation.x=-Math.PI/2; r.userData={t:rnd()}; LIFE.g.add(r); LIFE.rings.push(r); }
}
function lifePuddles(){
  if(!LIFE) return; LIFE.puddles.forEach(p=>LIFE.g.remove(p)); LIFE.puddles=[];
  const M=E.M; if(M.inside||M.cave) return;
  const pm=new THREE.MeshPhongMaterial({color:"#6f8fae",transparent:true,opacity:0,shininess:140,specular:"#ffffff",depthWrite:false});
  for(let y=0;y<M.h;y++) for(let x=0;x<M.w;x++){ const t=M.t[y][x]; if((t===T.WEG||t===T.PLATZ)&&hsh(x,y,31)%9===0){ const p=new THREE.Mesh(new THREE.CircleGeometry(1,18),pm); p.rotation.x=-Math.PI/2; p.scale.set(.32+h01(x,y,2)*.25,.2+h01(x,y,3)*.15,1); p.position.set(x+.5,.012,y+.5); p.receiveShadow=true; LIFE.g.add(p); LIFE.puddles.push(p); } }
  LIFE.pm=pm; LIFE.pmap=M.id;
}
function lifeUpdate(dt){
  if(!LIFE) lifeInit(); const M=E.M, S=E.S, se=E.season(), t=E.gameT, m=S.min, out=!M.inside&&!M.cave;
  if(LIFE.pmap!==M.id) lifePuddles();
  const night=M.moonForest||m>=1170||m<330, day=!M.moonForest&&m>=420&&m<1080, sun=S.weather==="sun", rain=S.weather==="rain", snow=S.weather==="snow";
  // Schmetterlinge
  const bfOn=out&&day&&sun&&(se===0||se===1);
  LIFE.bf.forEach((b,i)=>{ b.visible=bfOn; if(!bfOn) return; const u=b.userData; u.t+=dt*u.sp;
    if(!u.home||Math.hypot(u.home.x-camT.x,u.home.z-camT.z)>9){ u.home={x:camT.x+(rnd()-.5)*12,z:camT.z+(rnd()-.5)*12}; }
    b.position.set(u.home.x+Math.sin(u.t*.7+u.ph)*2.2,.55+Math.sin(u.t*2.3+u.ph)*.3+.25,u.home.z+Math.cos(u.t*.5+u.ph)*1.6);
    b.rotation.y=Math.atan2(Math.cos(u.t*.7+u.ph)*.7*2.2,-Math.sin(u.t*.5+u.ph)*.5*1.6)+Math.PI;
    const f=Math.sin(t*22+u.ph)*1.1; u.l.rotation.y=f; u.r.rotation.y=-f; });
  // Glühwürmchen
  const ffOn=out&&night&&!rain&&!snow&&(M.moonForest||se===0||se===1);
  LIFE.ff.forEach(f=>{ f.visible=ffOn; if(!ffOn) return; const u=f.userData; u.t+=dt*.4;
    if(!u.home||Math.hypot(u.home.x-camT.x,u.home.z-camT.z)>10){ u.home={x:camT.x+(rnd()-.5)*14,z:camT.z+(rnd()-.5)*14}; }
    f.position.set(u.home.x+Math.sin(u.t+u.ph)*1.2,.4+Math.sin(u.t*1.7+u.ph)*.35+.3,u.home.z+Math.cos(u.t*.8+u.ph)*1.2);
    const glow=Math.max(0,Math.sin(t*2.2+u.ph*3)); f.scale.setScalar(.03+glow*.035); f.material.opacity=.25+glow*.75; });
  // Regen und Schnee um die Kamera
  const mat=new THREE.Matrix4(); LIFE.rain.visible=out&&rain; LIFE.snow.visible=out&&snow;
  if(out&&(rain||snow)){ const inst=rain?LIFE.rain:LIFE.snow, fall=rain?14:1.1;
    LIFE.drops.forEach((d,i)=>{ d[1]-=dt*fall*(.8+d[3]*.4); if(snow){ d[0]+=Math.sin(t+i)*dt*.3; } if(d[1]<0){ d[1]+=9; d[0]=rnd()*30-15; d[2]=rnd()*30-15; }
      mat.makeTranslation(camT.x+d[0],d[1],camT.z+d[2]); if(rain) mat.multiply(new THREE.Matrix4().makeRotationZ(.12)); inst.setMatrixAt(i,mat); });
    inst.instanceMatrix.needsUpdate=true; }
  LIFE.rings.forEach(r=>{ const u=r.userData; r.visible=out&&rain; if(!r.visible) return; u.t+=dt*1.6; if(u.t>1){ u.t=0; r.position.set(camT.x+(rnd()-.5)*16,.02,camT.z+(rnd()-.5)*14); } r.scale.setScalar(1+u.t*3); r.material.opacity=.6*(1-u.t); });
  // Pfützen wachsen bei Regen und trocknen langsam
  if(LIFE.pm){ const goal=out&&rain?.7:0; LIFE.pm.opacity+=(goal-LIFE.pm.opacity)*Math.min(1,dt*(goal?0.8:0.08)); }
}

/* ---------- Öffentliche Schnittstelle ---------- */
R3.attach=function(eng){ E=eng; if(!R3.ok) init(); };
R3.frame=function(dt,pads){
  if(!E) return;
  const k0=key0(); if(k0!==wkey){ buildWorld(); buildDyn(); }
  dynT-=dt; if(dynT<=0){ dynT=.25; if(dynKey()!==dkey) buildDyn(); }
  syncActors(dt); cameraUpdate(dt,pads); lightUpdate(); smoke(dt); lifeUpdate(dt);
  if(water&&water.material.map){ water.material.map.offset.x=(E.gameT*.02)%1; water.material.map.offset.y=(Math.sin(E.gameT*.3)*.02); }
  if(dyn) for(const s of dyn.userData.bob) s.position.y=.42+Math.sin(E.gameT*3+s.userData.x)*.05;
  renderer.render(scene,camera);
};
R3.show=function(v){ if(glCanvas) glCanvas.style.display=v?"block":"none"; };
// Weltpunkt (in Kacheln, Höhe h) → Bildschirm in Gerätepixeln
const _v=new V3();
R3.proj=function(x,z,h){ _v.set(x,h||0,z).project(camera); return [(_v.x*.5+.5)*innerWidth*(window.devicePixelRatio||1),(-_v.y*.5+.5)*innerHeight*(window.devicePixelRatio||1),_v.z<1]; };
const ray=new THREE.Raycaster(), ndc=new THREE.Vector2(), plane=new THREE.Plane(new V3(0,1,0),0);
R3.pick=function(cx,cy){
  ndc.set(cx/innerWidth*2-1,-(cy/innerHeight)*2+1); ray.setFromCamera(ndc,camera);
  // Sichtbare Sammelsprites haben eine eigene Trefferfläche an ihrer tatsächlichen Höhe.
  const found=ray.intersectObjects(dyn?dyn.children.filter(c=>c.userData.collectible):[],false);
  if(found.length){const p=found[0].object.userData.collectible;return {wx:p.x+.5,wy:p.y+.5,collectible:true};}
  // Gegenstand vor Figur (Renés Entscheidung): Es zählt, was der Strahl zuerst trifft. Ein sichtbarer
  // Gegenstand (Briefkasten, Kiste, Möbel) gewinnt also auch, wenn eine Figur daneben oder dahinter steht;
  // eine Figur nur, wenn ihr Modell selbst vorne getroffen wird (z. B. Rosa vor ihrem Marktstand).
  // Früher gewann jede Figur irgendwo auf dem Strahl, und das Spiel prüfte danach zusätzlich die Nähe.
  // Die eigene Spielfigur ist nie Ziel. Der Bodenpunkt wird mitgegeben, damit das Spiel ein Beet
  // unter einer Figur erkennen kann.
  const pt=new V3(), ground=ray.ray.intersectPlane(plane,pt)?{wx:pt.x,wy:pt.z}:null;
  const groups=[...ACT.values()].map(r=>r.g);
  let act=null;
  for(const h of ray.intersectObjects(groups,true)){ let o=h.object; while(o&&!o.userData.actor) o=o.parent; if(o&&o.userData.actor&&o.userData.actorId!=="P"){ act={id:o.userData.actorId,a:o.userData.actor,d:h.distance}; break; } }
  const objs=ray.intersectObjects(pick.concat(dyn?dyn.children.filter(c=>c.material===MATS.inv):[]),false);
  const ob=objs.length?objs[0]:null;
  if(ob&&(!act||ob.distance<act.d)){ const m=ob.object, o=m.userData.obj;
    // Getroffene Stelle innerhalb der Grundfläche: bei breiten Objekten (Gleis unter dem Zug) entscheidet die Kachel unter dem Finger.
    if(o){ const w=o.w||1,h=o.h||1,cl=(v,a,b)=>Math.min(b,Math.max(a,v)); return {wx:cl(ob.point.x,o.x+.05,o.x+w-.05),wy:cl(ob.point.z,o.y+.05,o.y+h-.05),obj:true}; } const p=m.position; return {wx:p.x,wy:p.z,obj:true}; }
  if(act) return {wx:act.a.x+.5,wy:act.a.y+.5,actor:act.id,ground};
  if(ground) return {wx:ground.wx,wy:ground.wy};
  return null;
};
R3.dbg=()=>({sun:sun.intensity,hemi:hemi.intensity,amb:amb.intensity,min:E.S.min,glow:MATS.vce&&MATS.vce.emissiveIntensity});
R3.invalidate=function(){ wkey=""; dkey=""; };
})();
