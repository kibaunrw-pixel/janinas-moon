"use strict";
/* Janinas Moon – Spiel-Engine */
(function(){
const JM=window.JM, A=JM.ART, T=JM.T, ITEMS=JM.ITEMS, CROPS=JM.CROPS, NPCS=JM.NPCS;
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rnd=Math.random, pick=a=>a[Math.floor(rnd()*a.length)];
const key=(x,y)=>x+","+y;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* ================= Canvas ================= */
const cv=$("game"), ctx=cv.getContext("2d");
const buf=A.cnv(8,8), bx=buf.getContext("2d");
const lit=A.cnv(8,8), lx=lit.getContext("2d");
let DPR=1,SC=4,VW=0,VH=0,LW=0,LH=0,ZOOM=1;
function resize(){
  DPR=Math.min(window.devicePixelRatio||1,3);
  VW=Math.round(innerWidth*DPR); VH=Math.round(innerHeight*DPR);
  cv.width=VW; cv.height=VH;
  SC=Math.max(2,Math.round(Math.min(VW,VH*0.62)/(16*11.5)*ZOOM));
  LW=Math.ceil(VW/SC); LH=Math.ceil(VH/SC);
  buf.width=LW; buf.height=LH; lit.width=LW; lit.height=LH;
  ctx.imageSmoothingEnabled=false; bx.imageSmoothingEnabled=false;
}
addEventListener("resize",resize); resize();

/* ================= Sprites ================= */
const SPR={icons:{},crops:{},trees:{},bld:{},prop:{},bush:{}};
const lazy=(st,k,fn)=>st[k]||(st[k]=fn());
const icon=k=>lazy(SPR.icons,k,()=>A.icon(k));
function initSprites(){
  SPR.player=A.char(JM.lookFrom(null));
  SPR.npc={}; for(const id in NPCS) SPR.npc[id]=A.char(NPCS[id].look);
  SPR.hen=[A.chicken("#f7f5ee"),A.chicken("#c9884a")];
  SPR.cow=[A.cow(false),A.cow(true)];
  const sh=A.cnv(14,5), g=A.G(sh); g.ell(7,2.5,7,2.5,"rgba(0,0,0,.22)"); SPR.shadow=sh;
  const sb=A.cnv(24,6), g2=A.G(sb); g2.ell(12,3,12,3,"rgba(0,0,0,.2)"); SPR.shadowB=sb;
}
function reneLookObj(){ const L=Object.assign({},JM.RENE_LOOK), o=S&&S.reneLook||{}; if(o.hair) L.hair=o.hair; if(o.top) L.top=o.top; if(o.beard) L.beard=o.beard==="1"; return L; }
function lookSprites(){ SPR.player=A.char(JM.lookFrom(S.look)); SPR.rene=A.char(reneLookObj()); }
function dogSprites(){ lookSprites(); SPR.dogs=S.dogs.map((d,i)=>A.poodle(JM.FELL[d.fell]||JM.FELL.weiss,i?"#3f6ad8":"#d9473a")); }
function iconCanvas(k,cls){ const src=k.getContext?k:icon(k); const c=A.cnv(src.width,src.height); c.getContext("2d").drawImage(src,0,0); if(cls) c.className=cls; return c; }
function shopIcon(k){ if(k==="tier_huhn") return SPR.hen[0].r[0]; if(k==="tier_kuh") return SPR.cow[0].r[0]; if(k==="kanne2") return icon("kanne"); if(k==="gewaechshaus") return icon("sprinkler"); return icon(k); }
function itemName(k){ return k==="tier_huhn"?"Huhn":k==="tier_kuh"?"Kuh":k==="kanne2"?"Große Gießkanne":k==="rute2"?"Goldene Angel":k==="gewaechshaus"?"Gewächshaus reparieren":(ITEMS[k]?ITEMS[k].n:k); }

/* ================= Zustand ================= */
let S=null, MAPS=JM.buildMaps(), M=MAPS.farm, demo=true, running=false;
const season=()=>Math.floor((S.day-1)/JM.DPS)%4;
const dayIn=()=>((S.day-1)%JM.DPS)+1;
const year=()=>Math.floor((S.day-1)/(JM.DPS*4))+1;
const weekday=()=>(S.day-1)%7;
const dogName=i=>S.dogs[i].name||("Pudel "+(i+1));
const fmtD=t=>t.replace(/\{d0\}/g,dogName(0)).replace(/\{d1\}/g,dogName(1)).replace(/\{name\}/g,S.name).replace(/\{von\}/g,JM.CONFIG.von);
function newState(name,dogs){
  const s={v:2,t:Date.now(),name,dogs,day:1,min:360,money:500,energy:100,maxE:100,
    map:"farm",px:5,py:8,inv:{zwiebel_s:12,futter:6},hold:"auto",can:{w:20,max:20},rod:0,
    field:{},forage:{},bush:{},eggs:[],
    hens:[{n:"Henni",c:0,h:0,pet:0},{n:"Gacki",c:1,h:0,pet:0}],cows:[],trough:{h:2,c:0},
    dogH:[0,0],dogPet:[0,0],npc:{},quest:{id:null,p:0,seen:[]},qDone:[],board:null,
    bundles:{},bundleDone:{},recipes:["pakchoi_g","suppe"],mail:[],mailQ:[],
    ship:{},shipLog:{},fishLog:{},cookLog:{},stats:{earned:0,harvest:0,shipped:0},
    flags:{},weather:"sun",tomorrow:"sun",bought:{},sound:true,music:true,follow:false,rene:{met:false,bf:0,cud:0,cudToday:0,cuddles:0,wk:-1},reneLook:{},mess:[]};
  for(const id in NPCS) s.npc[id]={p:0,met:false,talk:0,gift:0,r3:false};
  // Unkraut, Steine, Äste auf dem Feld
  let n=0;
  for(let y=10;y<=19;y++) for(let x=3;x<=11;x++){ const h=A.hsh(x,y,77); if(h<90){ s.field[key(x,y)]={t:false,w:false,c:null,o:"weed"}; n++; } else if(h<125) s.field[key(x,y)]={t:false,w:false,c:null,o:"stone"}; else if(h<150) s.field[key(x,y)]={t:false,w:false,c:null,o:"branch"}; }
  s.flags.debris0=Object.values(s.field).filter(f=>f.o).length;
  s.mailQ.push({from:"rosa",t:"Willkommen!",b:"Liebe neue Nachbarin,\n\nwie schön, dass der Mondhof wieder bewohnt ist! Das Dorf liegt östlich von deinem Hof, einfach dem Weg folgen. Mei vom Markt freut sich schon auf dich.\n\nHerzlich,\nRosa, Bürgermeisterin"});
  return s;
}
const OLD_ORDER=["brief","pudel","raeumen","hacken","saeen","giessen","schlafen","eier","dorf","nachbarn","ernte","versand","angeln","lin","lieblingsessen","wald","gabe","tier","freunde","mondfest","frei"];
function migrate(s){
  if(s.quest&&s.quest.i!==undefined&&!s.quest.id){ const done=OLD_ORDER.slice(0,s.quest.i); s.qDone=Array.from(new Set((s.qDone||[]).concat(done))); s.quest={id:OLD_ORDER[s.quest.i]||null,p:s.quest.p||0,seen:s.quest.seen||[]}; }
  const d=newState(s.name||"Janina",s.dogs||[{name:"",fell:"weiss"},{name:"",fell:"apricot"}]);
  for(const k in d) if(s[k]===undefined) s[k]=d[k];
  for(const id in NPCS) if(!s.npc[id]) s.npc[id]={p:0,met:false,talk:0,gift:0,r3:false};
  return s;
}

/* ================= Speichern ================= */
const SAVE_KEY="janinas-moon-v2";
let dbRef=null,lastDb=0,saveT=0;
function lsLoad(){ try{ const r=localStorage.getItem(SAVE_KEY); return r?JSON.parse(r):null; }catch(e){ return null; } }
function save(force){
  if(!S||demo) return;
  S.t=Date.now(); S.px=Math.round(P.x); S.py=Math.round(P.y); S.map=M.id;
  const json=JSON.stringify(S);
  try{ localStorage.setItem(SAVE_KEY,json); }catch(e){}
  if(dbRef&&(force||Date.now()-lastDb>60000)){ lastDb=Date.now(); dbRef.set({json,t:S.t}).catch(()=>{}); }
}
function saveSoon(){ clearTimeout(saveT); saveT=setTimeout(()=>save(),1500); }
async function cloudLoad(){
  try{
    if(!window.claude||!window.claude.use) return null;
    const [db,user]=await Promise.all([window.claude.use("db"),window.claude.use("user")]);
    if(!db||!user) return null;
    const id=await user.id(); if(!id) return null;
    dbRef=db.collection("data/users/"+id).doc("spielstand");
    const snap=await dbRef.get(); if(!snap.exists) return null;
    const d=snap.data(); return d&&d.json?JSON.parse(d.json):null;
  }catch(e){ return null; }
}

/* ================= Karten ================= */
const walkT=(x,y)=>x>=0&&y>=0&&x<M.w&&y<M.h&&JM.WALK.has(M.t[y][x]);
function objAt(x,y){ return M.obj.find(o=>x>=o.x&&x<o.x+(o.w||1)&&y>=o.y&&y<o.y+(o.h||1)); }
const isField=(x,y)=>M.id==="farm"&&(M.t[y]&&(M.t[y][x]===T.FELD||M.t[y][x]===T.GLAS));
const isGlass=(x,y)=>M.id==="farm"&&M.t[y]&&M.t[y][x]===T.GLAS;
const isWater=(x,y)=>x>=0&&y>=0&&x<M.w&&y<M.h&&M.t[y][x]===T.WASSER;
const fieldAt=(x,y)=>S.field[key(x,y)];

let GROUND=null, groundKey="";
const grassLike=t=>t===T.GRAS||t===T.TUFF||t===T.BLUME||t===T.BAUM||t===T.BLOCK||t===T.WALD||t===T.ZAUN;
function buildGround(){
  const se=season(); GROUND=A.cnv(M.w*16,M.h*16); const g=A.G(GROUND);
  for(let y=0;y<M.h;y++) for(let x=0;x<M.w;x++) drawTile(g,x,y,se);
  groundKey=M.id+":"+se+":"+(S.flags.glas?1:0);
  WMASK=A.cnv(M.w*16,M.h*16); const wg=WMASK.getContext("2d"); wg.fillStyle="#fff";
  for(let y=0;y<M.h;y++) for(let x=0;x<M.w;x++) if(M.t[y][x]===T.WASSER){ const top=y>0&&M.t[y-1][x]!==T.WASSER&&M.t[y-1][x]!==T.STEG?2:0; wg.fillRect(x*16,y*16+top,16,16-top); }
}
/* ---------- Sonnenschatten und Spiegelungen ---------- */
let WMASK=null, SHC=null, REF=null; const SIL=new WeakMap();
// Sonnenstand: morgens fallen Schatten nach links, mittags kurz, abends lang nach rechts
function sunNow(){ if(M.cave||M.inside) return null; const m=S.min; if(m<370||m>1190) return null;
  const s=clamp((m-780)/410,-1,1); let a=Math.min(1,(m-370)/50,(1190-m)/60)*.3; if(S.weather!=="sun") a*=.3; return {k:s*1.05,sy:.3+.32*Math.abs(s),a}; }
function silh(spr){ let s=SIL.get(spr); if(!s){ s=A.cnv(spr.width,spr.height); const x=s.getContext("2d"); x.drawImage(spr,0,0); x.globalCompositeOperation="source-in"; x.fillStyle="#141c34"; x.fillRect(0,0,s.width,s.height); SIL.set(spr,s); } return s; }
function layer(c){ if(!c||c.width!==LW||c.height!==LH) c=A.cnv(LW,LH); const x=c.getContext("2d"); x.setTransform(1,0,0,1,0,0); x.globalCompositeOperation="source-over"; x.clearRect(0,0,LW,LH); x.imageSmoothingEnabled=false; return c; }
function drawCast(CAST){
  const sun=sunNow(); if(!sun||!CAST.length) return;
  SHC=layer(SHC); const x=SHC.getContext("2d");
  for(const [spr,dx,dy] of CAST){ const H=spr.height-1; x.setTransform(1,0,-sun.k,-sun.sy,Math.round(dx+sun.k*H),Math.round(dy+H+sun.sy*H)); x.drawImage(silh(spr),0,0); }
  x.setTransform(1,0,0,1,0,0); bx.globalAlpha=sun.a; bx.drawImage(SHC,0,0); bx.globalAlpha=1;
}
function drawReflect(CAST,CX,CY){
  if(!WMASK||M.cave||M.inside||!CAST.length) return;
  REF=layer(REF); const x=REF.getContext("2d");
  for(const [spr,dx,dy] of CAST){ const H=spr.height-1; x.setTransform(1,0,0,-1,0,Math.round(2*(dy+H))); x.drawImage(spr,dx,dy); }
  x.setTransform(1,0,0,1,0,0); x.globalCompositeOperation="destination-in"; x.drawImage(WMASK,-CX,-CY); x.globalCompositeOperation="source-over";
  const night=S.min>=1110||S.min<390; bx.globalAlpha=night?.18:.3;
  for(let y=0;y<LH;y+=2){ const off=Math.round(Math.sin(gameT*2+(y+CY)*.35)*.8); bx.drawImage(REF,0,y,LW,2,off,y,LW,2); }
  bx.globalAlpha=1;
}
function drawGrass(g,X,Y,x,y,P,forest){
  const base=forest?A.shade(P.g,-.1):P.g, d=forest?A.shade(P.gd,-.1):P.gd, l=forest?A.shade(P.gl,-.08):P.gl, dd=A.shade(d,-.12);
  // feinkörnige Farbwolken mit weichem Übergang (Dithering), damit sich keine Kacheln wiederholen
  const cx=g.ctx, img=cx.createImageData(16,16), D=img.data, cB=A.hex(base), cD=A.hex(d), cL=A.hex(l), soft=P.soft||1;
  for(let py=0;py<16;py++) for(let px=0;px<16;px++){ const wx=X+px, wy=Y+py; const v=(Math.sin(wx*.09+wy*.05)+Math.sin(wx*.04-wy*.11)+Math.sin((wx+wy)*.13)*.5)*soft+(((wx*7+wy*13)%5)/5-.4)*.9;
    const c=v>1.15?cL:v<-1.15?cD:cB, k=(py*16+px)*4; D[k]=c[0]; D[k+1]=c[1]; D[k+2]=c[2]; D[k+3]=255; }
  cx.putImageData(img,X,Y);
  // Grashalme: unten dunkel, oben hell
  for(let i=0;i<22;i++){ const h=A.hsh(x,y,i+200); const bx0=X+h%16, by0=Y+(h>>4)%15; const tall=(h>>8)%3===0;
    g.p(bx0,by0+1,i%4?d:dd); g.p(bx0,by0,i%3?base:l); if(tall) g.p(bx0,by0-1>=Y?by0-1:by0,l); }
}
function drawTile(g,x,y,se){
  const t=M.t[y][x], P=A.PAL[se], X=x*16, Y=y*16, h=A.hsh;
  if(M.inside){ const Q=M.pal;
    const floorAt=(xx,yy)=>xx>=0&&yy>=0&&xx<M.w&&yy<M.h&&(M.t[yy][xx]===T.BODEN||M.t[yy][xx]===T.TEPPICH||M.t[yy][xx]===T.BLOCK);
    if(t===T.BODEN||t===T.BLOCK){ g.r(X,Y,16,16,Q.floor); for(let j=0;j<16;j+=4){ g.r(X,Y+j+3,16,1,Q.floor2); const off=((y*4+j)/4)%2?5:11; g.r(X+off,Y+j,1,3,Q.floor2); } g.p(X+(x*5)%13+1,Y+(y*7)%13+1,A.shade(Q.floor,.12));
      if(y===M.h-1){ g.r(X+2,Y+4,12,9,"#7a5a3a"); g.r(X+3,Y+5,10,7,"#a8743f"); } wallAO(g,X,Y,x,y); return; }
    if(t===T.TEPPICH){ g.r(X,Y,16,16,Q.rug); const up=M.t[y-1]&&M.t[y-1][x]===T.TEPPICH, dn=M.t[y+1]&&M.t[y+1][x]===T.TEPPICH, lf=M.t[y][x-1]===T.TEPPICH, rt=M.t[y][x+1]===T.TEPPICH;
      if(!up) g.r(X,Y+1,16,2,Q.rug2); if(!dn) g.r(X,Y+13,16,2,Q.rug2); if(!lf) g.r(X+1,Y,2,16,Q.rug2); if(!rt) g.r(X+13,Y,2,16,Q.rug2); for(let i=0;i<3;i++){ const hh=A.hsh(x,y,i+400); g.p(X+3+hh%10,Y+3+(hh>>4)%10,A.shade(Q.rug,.15)); } wallAO(g,X,Y,x,y); return; }
    if(t===T.WAND){
      if(y<=2&&x>0&&x<M.w-1){ if(y===0){ g.r(X,Y,16,16,A.shade(Q.trim,-.35)); g.r(X,Y+12,16,4,Q.trim); g.r(X,Y+12,16,1,A.shade(Q.trim,.2)); }
        else { g.r(X,Y,16,16,Q.wall); for(let i=0;i<16;i+=4) g.r(X+i,Y,1,16,Q.wall2); if(y===2){ g.r(X,Y+12,16,4,Q.trim); g.r(X,Y+12,16,1,A.shade(Q.trim,.25)); g.r(X,Y+15,16,1,A.shade(Q.trim,-.3)); } }
        const win=(M.windows||[]).some(([wx,wy])=>wx===x); if(win&&y===1){ g.r(X+1,Y+3,14,13,Q.trim); g.r(X+2,Y+4,12,12,"#8fc3e4"); g.r(X+3,Y+5,3,1,"#d8eefa"); g.r(X+7,Y+4,1,12,Q.trim); } if(win&&y===2){ g.r(X+1,Y,14,6,Q.trim); g.r(X+2,Y,12,4,"#7ab0d6"); g.r(X,Y+6,16,2,A.shade(Q.trim,.15)); }
        return; }
      g.r(X,Y,16,16,A.shade(Q.trim,-.45)); if(floorAt(x+1,y)) g.r(X+13,Y,3,16,Q.trim); if(floorAt(x-1,y)) g.r(X,Y,3,16,Q.trim); if(floorAt(x,y-1)) g.r(X,Y,16,3,Q.trim); return; }
  }
  if(M.cave&&(t===T.BLOCK||t===T.GRAS)){ g.r(X,Y,16,16,"#7a6a5a"); return; }
  if(grassLike(t)){
    drawGrass(g,X,Y,x,y,P,t===T.WALD||M.id==="forest");
    if(t===T.TUFF){ for(let i=0;i<2;i++){ const hh=h(x,y,i+30); const tx=X+2+hh%11, ty=Y+3+(hh>>4)%10; g.p(tx,ty,P.gd); g.p(tx+2,ty,P.gd); g.p(tx+1,ty+1,P.gd); g.p(tx+1,ty-1,P.gl); } }
    if(t===T.BLUME){ const cols=se===3?["#ffffff","#dfe8f0"]:se===2?["#e88a2c","#f6d55c","#c23a2a"]:["#f28fb0","#f6d55c","#ffffff","#c49bf2"]; for(let i=0;i<3;i++){ const hh=h(x,y,i+20), fx=X+2+hh%12, fy=Y+2+(hh>>5)%11, c=cols[(hh>>2)%cols.length]; if(se<3) g.r(fx,fy+2,1,2,P.gd); g.p(fx-1,fy,c); g.p(fx+1,fy,c); g.p(fx,fy-1,c); g.p(fx,fy+1,c); g.p(fx,fy,se<3?"#f6d55c":c); } }
    if(t===T.ZAUN){
      const fz=(xx,yy)=>xx>=0&&yy>=0&&xx<M.w&&yy<M.h&&M.t[yy][xx]===T.ZAUN;
      const wood="#a8743f", dark="#6b4423", lt="#c58d52";
      if(fz(x-1,y)){ g.r(X,Y+5,8,2,wood); g.r(X,Y+10,8,2,wood); g.r(X,Y+7,8,1,dark); g.r(X,Y+12,8,1,dark); }
      if(fz(x+1,y)){ g.r(X+8,Y+5,8,2,wood); g.r(X+8,Y+10,8,2,wood); g.r(X+8,Y+7,8,1,dark); g.r(X+8,Y+12,8,1,dark); }
      if(fz(x,y-1)) g.r(X+7,Y,2,6,wood);
      if(fz(x,y+1)) g.r(X+7,Y+10,2,6,wood);
      g.r(X+5,Y+2,5,12,dark); g.r(X+6,Y+2,3,11,wood); g.r(X+6,Y+2,3,1,lt); if(se===3) g.r(X+5,Y+1,5,2,"#ffffff");
    }
    return;
  }
  if(t===T.WEG||t===T.PLATZ||t===T.SAND){
    const winter=se===3;
    if(t===T.WEG){ const b=winter?"#d8d4cc":"#cfae78", bd=winter?"#c8c3ba":"#c09f6a", bl=winter?"#e4e1da":"#d9bc88";
      g.r(X,Y,16,16,b);
      for(let j=0;j<16;j++) for(let i=0;i<16;i++){ const hh=h(x*16+i,y*16+j,61)%23; if(hh===0) g.p(X+i,Y+j,bd); else if(hh===1) g.p(X+i,Y+j,bl); }
      for(let i=0;i<4;i++){ const hh=h(x,y,i+60); const px=X+1+hh%12, py=Y+1+(hh>>4)%12, sz=1+(i%2);
        g.r(px,py+1,sz+1,1,winter?"#b0aaa0":"#9c7a4c"); g.r(px,py,sz+1,1,winter?"#bdb8ae":"#a8885a"); g.r(px,py,sz,1,winter?"#efede8":"#ead2a2"); }
      const hh=h(x,y,66); if(hh%3===0){ g.r(X+3+hh%9,Y+5+(hh>>3)%7,4,1,bd); } }
    if(t===T.PLATZ){ g.r(X,Y,16,16,"#8f887e"); for(let j=0;j<4;j++){ const off=(j+y)%2?4:0; for(let i=-1;i<3;i++){ const sx=X+i*8+off, sy=Y+j*4; g.r(sx+1,sy+1,6,3,"#b3ab9f"); g.r(sx+1,sy+1,6,1,"#c6bfb3"); } } if(winter) for(let i=0;i<4;i++){ const hh=h(x,y,i+70); g.r(X+hh%14,Y+(hh>>4)%14,2,1,"#ffffff"); } }
    if(t===T.SAND){ g.r(X,Y,16,16,winter?"#e6e6e2":"#e3cf98"); for(let i=0;i<6;i++){ const hh=h(x,y,i+80); g.p(X+hh%16,Y+(hh>>4)%16,winter?"#d0d0cc":"#cdb67e"); } }
    // weiche Ränder zu Gras
    const gl=(xx,yy)=>xx>=0&&yy>=0&&xx<M.w&&yy<M.h&&grassLike(M.t[yy][xx]);
    const gc=M.id==="forest"?A.shade(P.g,-.1):P.g;
    if(gl(x,y-1)) for(let i=0;i<16;i++) g.r(X+i,Y,1,1+((i*7+x)%3===0?1:0),gc);
    if(gl(x,y+1)) for(let i=0;i<16;i++) g.r(X+i,Y+15-((i*5+y)%3===0?1:0),1,2,gc);
    if(gl(x-1,y)) for(let i=0;i<16;i++) g.r(X,Y+i,1+((i*3+y)%3===0?1:0),1,gc);
    if(gl(x+1,y)) for(let i=0;i<16;i++) g.r(X+15-((i*7+x)%3===0?1:0),Y+i,2,1,gc);
    return;
  }
  if(t===T.FELD||t===T.GLAS){ drawSoil(g,x,y,se); return; }
  if(t===T.WASSER){ g.r(X,Y,16,16,"#3f86c8"); return; }
  if(t===T.FELS){ g.r(X,Y,16,16,"#3a3230"); for(let i=0;i<6;i++){ const hh=h(x,y,i+110); g.r(X+hh%13,Y+(hh>>4)%13,3,2,i%2?"#4a403c":"#2c2624"); } const fl=(xx,yy)=>xx>=0&&yy>=0&&xx<M.w&&yy<M.h&&M.t[yy][xx]===T.HBODEN; if(fl(x,y+1)){ g.r(X,Y+12,16,4,"#5a4e48"); g.r(X,Y+12,16,1,"#6e605a"); } return; }
  if(t===T.HBODEN){ g.r(X,Y,16,16,"#7a6a5a"); for(let i=0;i<7;i++){ const hh=h(x,y,i+120); g.p(X+hh%16,Y+(hh>>4)%16,i%2?"#8a7a68":"#665848"); } return; }
  if(t===T.STEG){ g.r(X,Y,16,16,"#3f86c8"); g.r(X+1,Y,14,16,"#a8743f"); for(let j=0;j<16;j+=4){ g.r(X+1,Y+j,14,1,"#8a5a33"); g.r(X+1,Y+j+1,14,1,"#c08a52"); } g.r(X,Y,2,16,"#6b4423"); g.r(X+14,Y,2,16,"#6b4423"); }
}
// Umgebungsschatten: Boden wird an Wänden dunkler
function wallAO(g,X,Y,x,y){
  const wl=(xx,yy)=>yy>=0&&xx>=0&&xx<M.w&&yy<M.h&&M.t[yy][xx]===T.WAND;
  if(wl(x,y-1)){ g.r(X,Y,16,2,"rgba(30,15,5,.30)"); g.r(X,Y+2,16,2,"rgba(30,15,5,.16)"); g.r(X,Y+4,16,2,"rgba(30,15,5,.07)"); }
  if(wl(x-1,y)){ g.r(X,Y,2,16,"rgba(30,15,5,.22)"); g.r(X+2,Y,2,16,"rgba(30,15,5,.09)"); }
  if(wl(x+1,y)){ g.r(X+14,Y,2,16,"rgba(30,15,5,.22)"); g.r(X+12,Y,2,16,"rgba(30,15,5,.09)"); }
}
function drawSoil(g,x,y,se){
  const X=x*16,Y=y*16, f=fieldAt(x,y), P=A.PAL[se], glass=isGlass(x,y);
  if(glass&&!S.flags.glas){ g.r(X,Y,16,16,"#7a6a4a"); for(let i=0;i<5;i++){ const hh=A.hsh(x,y,i+90); g.r(X+hh%14,Y+(hh>>4)%14,2,1,i%2?"#a9c8d8":P.gd); } return; }
  if(!f||!f.t){
    if(glass){ g.r(X,Y,16,16,"#8a6a48"); for(let i=0;i<5;i++){ const hh=A.hsh(x,y,i+50); g.p(X+hh%16,Y+(hh>>4)%16,"#7a5a3a"); } }
    else { const P2=se===3?P:{g:A.mix(P.g,"#8a6a3a",.42),gd:A.mix(A.mix(P.g,"#8a6a3a",.42),"#5e4426",.25),gl:A.mix(A.mix(P.g,"#8a6a3a",.42),"#c8b07a",.2),soft:.55}; drawGrass(g,X,Y,x,y,P2,false); for(let i=0;i<4;i++){ const hh=A.hsh(x,y,i+40); g.r(X+hh%15,Y+(hh>>4)%15,2,1,se===3?"#ffffff":"#6e5230"); } }
    return;
  }
  const base=f.w?"#4f3420":"#7a5232", fur=f.w?"#3a2616":"#5e3e22", hi=f.w?"#5f4029":"#8f6340";
  g.r(X,Y,16,16,base);
  for(let j=2;j<16;j+=4){ g.r(X+1,Y+j,14,1,fur); g.r(X+1,Y+j-1,14,1,hi); }
  const tl=(xx,yy)=>{ const ff=fieldAt(xx,yy); return ff&&ff.t; };
  if(!tl(x,y-1)) g.r(X,Y,16,1,A.shade(base,-.25));
  if(!tl(x-1,y)) g.r(X,Y,1,16,A.shade(base,-.2));
  if(!tl(x+1,y)) g.r(X+15,Y,1,16,A.shade(base,-.2));
  if(!tl(x,y+1)) g.r(X,Y+15,16,1,A.shade(base,.15));
  if(f.w){ g.p(X+4,Y+5,"#6e5038"); g.p(X+11,Y+9,"#6e5038"); }
  if(f.d){ for(let i=0;i<5;i++){ const hh=A.hsh(x,y,i+140); g.p(X+1+hh%14,Y+1+(hh>>4)%14,"#cfe8a8"); } }
  if(se===3&&!glass) for(let i=0;i<5;i++){ const hh=A.hsh(x,y,i+99); g.r(X+hh%15,Y+(hh>>4)%15,2,1,"#ffffff"); }
}
function redrawField(x,y){ if(M.id!=="farm"||!GROUND) return; const g=A.G(GROUND); drawTile(g,x,y,season()); for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ if(isField(x+dx,y+dy)) drawTile(g,x+dx,y+dy,season()); } }

/* ================= Akteure ================= */
const P={x:5,y:8,dir:0,flip:false,frame:0,ft:0,path:[],act:null,queue:[],busy:0,tool:null,moving:false,bob:0};
let TRAIL=[],DOGS=[],HENS=[],COWS=[],NPCA={},FX=[],AMB=[],FLT=[],aim=null;
function spawnAnimals(){
  TRAIL=[];
  const mkDog=(i,x,y)=>({i,x,y,face:1,tx:x,ty:y,timer:rnd()*2,frame:0,ft:0,moving:false,trick:0,idle:0});
  if(S.follow) DOGS=S.dogs.map((d,i)=>mkDog(i,P.x,P.y));
  else if(M.id==="farm") DOGS=S.dogs.map((d,i)=>mkDog(i,3+i*2,9));
  else DOGS=[];
  HENS=[]; COWS=[];
  if(M.id==="farm"){
    const c=M.coop, p=M.pasture;
    S.hens.forEach((h,i)=>HENS.push({i,x:c.x0+rnd()*(c.x1-c.x0),y:c.y0+1+rnd()*(c.y1-c.y0-1),tx:0,ty:0,timer:rnd()*2,face:rnd()<.5?1:-1,frame:0,ft:0,moving:false,peck:0}));
    S.cows.forEach((h,i)=>COWS.push({i,x:p.x0+rnd()*(p.x1-p.x0),y:p.y0+1+rnd()*(p.y1-p.y0-1),tx:0,ty:0,timer:rnd()*3,face:rnd()<.5?1:-1,frame:0,ft:0,moving:false}));
  }
  if(M.id==="village"){
    const p=M.pen; [0,1].forEach(i=>HENS.push({i:-1-i,deco:true,x:p.x0+i*1.5,y:p.y0+1,tx:0,ty:0,timer:rnd()*2,face:1,frame:0,ft:0,moving:false,peck:0}));
  }
}
function setMap(id,x,y){
  camSnap=true; CRIT=[];
  M=MAPS[id]; P.x=x; P.y=y; P.path=[]; P.act=null; P.queue=[]; aim=null;
  buildGround(); spawnAnimals(); npcPlaceAll(true); FX=[]; FLT=[];
}

/* ================= Wegsuche ================= */
function blocked(x,y){ return !walkT(x,y); }
function bfs(sx,sy,goal,maxN){
  sx=Math.round(sx); sy=Math.round(sy);
  if(goal(sx,sy)) return [];
  const prev=new Map(), q=[[sx,sy]]; prev.set(key(sx,sy),null); let n=0;
  while(q.length){
    const [x,y]=q.shift(); if(++n>(maxN||4000)) break;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx, ny=y+dy, k=key(nx,ny);
      if(prev.has(k)) continue;
      if(goal(nx,ny)&&(walkT(nx,ny)||true)){ if(walkT(nx,ny)){ const path=[[nx,ny]]; let c=[x,y]; while(c&&!(c[0]===sx&&c[1]===sy)){ path.unshift(c); c=prev.get(key(c[0],c[1])); } return path; } }
      if(blocked(nx,ny)) continue;
      prev.set(k,[x,y]); q.push([nx,ny]);
    }
  }
  return null;
}
const adjGoal=(tx,ty,self)=>(x,y)=>(Math.abs(x-tx)+Math.abs(y-ty)===1)||(self&&x===tx&&y===ty);
function goTo(goal,act,aimT){
  const path=bfs(P.x,P.y,goal);
  if(path===null){ note("Da komme ich nicht hin."); return false; }
  P.path=path; P.act=act||null; aim=aimT||null;
  if(!path.length) finishMove();
  return true;
}
function finishMove(){
  const ex=M.exits.find(e=>e.x===Math.round(P.x)&&e.y===Math.round(P.y));
  if(ex&&!P.act){ travel(ex); return; }
  const a=P.act; P.act=null; aim=null; if(a) a();
}
function faceTo(tx,ty){ const dx=tx-Math.round(P.x), dy=ty-Math.round(P.y); if(Math.abs(dx)>Math.abs(dy)){ P.dir=2; P.flip=dx<0; } else if(dy){ P.dir=dy<0?1:0; } }
function travel(ex){
  fadeQuick(()=>{ setMap(ex.to,ex.tx,ex.ty); const msg={village:"Das Dorf",forest:"Der Mondwald",farm:"Dein Hof",hoehle:"Die Mondhöhle",haus:"Zuhause"}[ex.to]||(JM.SHOPS[ex.to.slice(2)]?JM.SHOPS[ex.to.slice(2)].n:""); banner(msg); if(ex.to==="hoehle"&&!S.flags.caveSeen){ S.flags.caveSeen=true; setTimeout(()=>note("Tippe auf Felsen, um sie abzubauen. Darin stecken Kupfer und Edelsteine."),900); } if(ex.to==="forest"&&!S.flags.forestSeen){ S.flags.forestSeen=true; } if(ex.to==="village"&&!S.flags.villageSeen){ S.flags.villageSeen=true; note("Tippe Leute an, um mit ihnen zu reden. Türen öffnen Läden."); } updateQuestUI(); saveSoon(); });
}

/* ================= Eingabe ================= */
let ptr=null;
function toWorld(cx,cy){ if(use3D()){ const r=JM.R3.pick(cx,cy); if(r) return r; } return {wx:(cx*DPR/SC+cam.x)/16, wy:(cy*DPR/SC+cam.y)/16}; }
// Zoomen mit zwei Fingern (und Mausrad am Rechner)
const PINCH={pts:new Map(),d0:0,z0:1,on:false};
const ZMIN=.45, ZMAX=1.6;
let zoomSaveT=0;
function setZoom(z){ z=clamp(z,ZMIN,ZMAX); if(Math.abs(z-ZOOM)<.002) return; S.zoom=ZOOM=Math.round(z*100)/100; if(!use3D()) resize(); clearTimeout(zoomSaveT); zoomSaveT=setTimeout(saveSoon,600); }
function pinchDist(){ const a=[...PINCH.pts.values()]; return Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]); }
cv.addEventListener("pointerdown",e=>{ PINCH.pts.set(e.pointerId,[e.clientX,e.clientY]); if(PINCH.pts.size===2&&running&&!demo){ PINCH.on=true; PINCH.d0=pinchDist(); PINCH.z0=ZOOM; ptr=null; P.queue=[]; if(!P.busy&&!P.tool){ P.path=[]; P.act=null; aim=null; } } },true);
addEventListener("pointermove",e=>{ if(!PINCH.pts.has(e.pointerId)) return; PINCH.pts.set(e.pointerId,[e.clientX,e.clientY]); if(PINCH.on&&PINCH.pts.size>=2&&PINCH.d0>0) setZoom(PINCH.z0*pinchDist()/PINCH.d0); });
const pinchEnd=e=>{ PINCH.pts.delete(e.pointerId); if(PINCH.pts.size<2) PINCH.on=false; };
addEventListener("pointerup",pinchEnd); addEventListener("pointercancel",pinchEnd);
// Safari auf dem iPhone meldet Zwei-Finger-Gesten als eigene Ereignisse
let gz0=1;
document.addEventListener("gesturestart",e=>{ e.preventDefault(); gz0=ZOOM; PINCH.on=true; ptr=null; },{passive:false});
document.addEventListener("gesturechange",e=>{ e.preventDefault(); if(running&&!demo) setZoom(gz0*e.scale); },{passive:false});
document.addEventListener("gestureend",e=>{ e.preventDefault(); PINCH.on=PINCH.pts.size>=2; },{passive:false});
// Zoom-Knöpfe
$("zFoto").addEventListener("click",e=>{ e.stopPropagation(); photo(); });
$("zIn").addEventListener("click",e=>{ e.stopPropagation(); setZoom(ZOOM*1.25); });
$("zOut").addEventListener("click",e=>{ e.stopPropagation(); setZoom(ZOOM/1.25); });
cv.addEventListener("wheel",e=>{ if(!running||demo) return; e.preventDefault(); setZoom(ZOOM*Math.exp(-e.deltaY*.0015)); },{passive:false});
cv.addEventListener("pointerdown",e=>{
  audioInit();
  if(!running||demo||PINCH.on) return;
  if(!paused()&&starHit(e.clientX,e.clientY)) return;
  if(FISH.phase==="wait"||FISH.phase==="bite"){ fishTap(); return; }
  if(paused()) return;
  const {wx,wy}=toWorld(e.clientX,e.clientY), tx=Math.floor(wx), ty=Math.floor(wy);
  ptr={id:e.pointerId,mode:"tap",last:key(tx,ty),t:performance.now()};
  if(isField(tx,ty)&&!hitActor(wx,wy)&&!S.eggs.some(g=>g.x===tx&&g.y===ty)){
    if(P.queue.length===0&&!P.act){ P.path=[]; }
    ptr.mode="swipe"; P.queue=[[tx,ty]]; P.act=null; aim={x:tx,y:ty};
    return;
  }
  tapAt(wx,wy,tx,ty);
  ptr.mode="walk";
});
cv.addEventListener("pointermove",e=>{
  if(PINCH.on||!ptr||ptr.id!==e.pointerId||paused()) return;
  const {wx,wy}=toWorld(e.clientX,e.clientY), tx=Math.floor(wx), ty=Math.floor(wy), k=key(tx,ty);
  if(k===ptr.last) return; ptr.last=k;
  if(ptr.mode==="swipe"){ if(isField(tx,ty)&&!P.queue.some(q=>q[0]===tx&&q[1]===ty)) P.queue.push([tx,ty]); }
  else if(ptr.mode==="walk"&&performance.now()-ptr.t>180&&walkT(tx,ty)&&!P.act){ goTo((x,y)=>x===tx&&y===ty); }
});
addEventListener("pointerup",e=>{ if(ptr&&ptr.id===e.pointerId) ptr=null; });
addEventListener("pointercancel",()=>{ ptr=null; });
function hitActor(wx,wy){
  const hit=(a,h)=>Math.abs(wx-(a.x+.5))<.75&&wy>a.y-(h||1)+.3&&wy<a.y+1.2;
  if(RA.vis&&hit(RA,1.4)) return {k:"rene"};
  if(M.owner&&npcPlace(M.owner)==="in"){ const [nx,ny]=M.npcAt; if(Math.abs(wx-(nx+.5))<.9&&wy>ny-1&&wy<ny+1.4) return {k:"shopnpc",id:M.owner}; }
  for(const id in NPCA){ const n=NPCA[id]; if(n.vis&&hit(n,1.4)) return {k:"npc",id}; }
  for(const d of DOGS) if(hit(d,.8)) return {k:"dog",d};
  for(const h of HENS) if(hit(h,.6)) return {k:"hen",h};
  for(const c of COWS) if(Math.abs(wx-(c.x+.5))<1.1&&wy>c.y-.6&&wy<c.y+1.2) return {k:"cow",c};
  return null;
}
function tapAt(wx,wy,tx,ty){
  P.queue=[];
  const ms=S.mess.find(m=>m.map===M.id&&m.x===tx&&m.y===ty);
  if(ms){ goTo(adjGoal(tx,ty,true),()=>tidy(ms),{x:tx,y:ty}); return; }
  const egg0=M.id==="farm"&&S.eggs.find(g=>g.x===tx&&g.y===ty);
  if(egg0){ goTo(adjGoal(tx,ty,true),()=>pickEgg(egg0),{x:tx,y:ty}); return; }
  const h=hitActor(wx,wy);
  if(h){
    if(h.k==="rene"){ goTo(adjGoal(Math.round(RA.x),Math.round(RA.y)),()=>{ faceTo(Math.round(RA.x),Math.round(RA.y)); reneTalk(); }); return; }
    if(h.k==="shopnpc"){ if(!S.npc[h.id].met) npcInteract(h.id); else openShop(M.shop); return; }
    if(h.k==="npc"){ const n=NPCA[h.id]; goTo(adjGoal(Math.round(n.x),Math.round(n.y)),()=>{ faceTo(Math.round(n.x),Math.round(n.y)); npcInteract(h.id); }); return; }
    if(h.k==="dog"){ const d=h.d; goTo(adjGoal(Math.round(d.x),Math.round(d.y),true),()=>dogMenu(d)); return; }
    if(h.k==="hen"){ const a=h.h; goTo(adjGoal(Math.round(a.x),Math.round(a.y),true),()=>{ faceTo(Math.round(a.x),Math.round(a.y)); petHen(a); }); return; }
    if(h.k==="cow"){ const a=h.c; goTo(adjGoal(Math.round(a.x),Math.round(a.y)),()=>{ faceTo(Math.round(a.x),Math.round(a.y)); cowAct(a); }); return; }
  }
  if(tx<0||ty<0||tx>=M.w||ty>=M.h) return;
  const fo=(S.forage[M.id]||[]).find(f=>f.x===tx&&f.y===ty);
  if(fo){ goTo(adjGoal(tx,ty,true),()=>pickForage(fo),{x:tx,y:ty}); return; }
  const egg=M.id==="farm"&&S.eggs.find(g=>g.x===tx&&g.y===ty);
  if(egg){ goTo(adjGoal(tx,ty,true),()=>pickEgg(egg),{x:tx,y:ty}); return; }
  const rk=M.cave&&(S.rocks||[]).find(r=>r.x===tx&&r.y===ty);
  if(rk){ goTo(adjGoal(tx,ty),()=>{ faceTo(tx,ty); mineRock(rk); },{x:tx,y:ty}); return; }
  const o=objAt(tx,ty);
  if(o){
    if(o.door) goTo((x,y)=>x===o.door[0]&&y===o.door[1],()=>{ P.dir=1; objAct(o); },{x:o.door[0],y:o.door[1]-1});
    else goTo((x,y)=>x>=o.x-1&&x<=o.x+(o.w||1)&&y>=o.y-1&&y<=o.y+(o.h||1)&&!(x>=o.x&&x<o.x+(o.w||1)&&y>=o.y&&y<o.y+(o.h||1)),()=>{ faceTo(o.x,o.y); objAct(o); },{x:o.x,y:o.y});
    return;
  }
  if(isWater(tx,ty)){
    const near=(x,y)=>{ for(const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0]]) if(isWater(x+dx,y+dy)&&Math.abs(x+dx-tx)+Math.abs(y+dy-ty)<=5) return [x+dx,y+dy]; return null; };
    goTo((x,y)=>walkT(x,y)&&!!near(x,y),()=>{ const w=near(Math.round(P.x),Math.round(P.y))||[tx,ty]; faceTo(w[0],w[1]); waterAct(w[0],w[1]); },{x:tx,y:ty}); return; }
  const t=M.t[ty][tx];
  if(t===T.BAUM){ goTo(adjGoal(tx,ty),()=>{ faceTo(tx,ty); treeAct(tx,ty); },{x:tx,y:ty}); return; }
  if(walkT(tx,ty)) goTo((x,y)=>x===tx&&y===ty);
}

/* ================= Feldarbeit ================= */
function cost(n){ if(S.energy<n){ note("Du bist zu erschöpft. Iss etwas oder geh schlafen."); P.queue=[]; return false; } S.energy=Math.max(0,S.energy-n); if(S.energy<25&&!S.flags.tipE){ S.flags.tipE=true; note("Tipp: Tippe unten ein Essen zweimal an, um es zu essen."); } return true; }
function fieldPlan(x,y){
  const f=fieldAt(x,y)||{t:false,w:false,c:null,o:null};
  if(isGlass(x,y)&&!S.flags.glas) return {msg:"Das alte Gewächshaus ist kaputt. Vielleicht weiß Rosa, wie man es reparieren kann."};
  const hold=S.hold, it=ITEMS[hold];
  if(f.o==="spr"&&hold==="auto") return {k:"pickspr"};
  if(f.o&&f.o!=="spr") return {k:"clear",c:f.o==="stone"?2:1};
  if(hold==="sprinkler"&&!f.c&&!f.o) return {k:"placespr"};
  if(hold==="duenger"&&f.t&&!f.d) return {k:"fert"};
  if(hold==="duenger"&&!f.t) return {msg:"Grab das Beet zuerst um, dann streust du den Dünger."};
  if(it&&it.cat==="seed"&&!f.c&&!f.o){
    const cr=CROPS[it.crop];
    if(!isGlass(x,y)&&!cr.se.includes(season())) return {msg:it.n.replace("-Samen","")+" wächst nicht im "+JM.SEASONS[season()]+"."};
    return {k:"plant",c:f.t?0:2};
  }
  if(f.c){
    const cr=CROPS[f.c.k];
    if(f.c.a>=cr.days) return {k:"harvest"};
    if(!f.w) return {k:"water",c:1};
    const r=cr.days-f.c.a; return {msg:ITEMS[f.c.k].n+": noch "+r+(r===1?" Tag":" Tage")+"."};
  }
  if(!f.t) return {k:"till",c:2};
  if(!f.w) return {k:"water",c:1};
  return {msg:"Wähle unten Samen aus, um hier etwas zu pflanzen."};
}
function doField(x,y){
  const pl=fieldPlan(x,y);
  if(pl.msg){ note(pl.msg); return; }
  if(pl.c&&!cost(pl.c)) return;
  const k=key(x,y); const f=S.field[k]||(S.field[k]={t:false,w:false,c:null,o:null});
  faceTo(x,y); P.busy=.22;
  switch(pl.k){
    case "clear": { const o=f.o; f.o=null; P.tool=o==="stone"?"hacke":"auto"; sfx(o==="stone"?"stone":"pick"); burst(x,y,o==="stone"?"#a9a39b":"#5a9a3a",8); emit("clear"); break; }
    case "till": f.t=true; P.tool="hacke"; sfx("dig"); burst(x,y,"#7a5232",6); emit("till"); break;
    case "water":
      if(S.can.w<=0){ note("Die Gießkanne ist leer. Tippe auf Wasser, um sie zu füllen."); P.queue=[]; S.energy+=1; return; }
      f.w=true; S.can.w--; P.tool="kanne"; sfx("water"); burst(x,y,"#6aa8dd",8,true); emit("water"); break;
    case "plant": {
      const it=ITEMS[S.hold]; if(!S.inv[S.hold]){ note("Keine "+it.n+" mehr."); return; }
      const wasT=f.t; f.t=true; f.c={k:it.crop,a:0}; take(S.hold,1); P.tool="seed"; sfx("plant"); burst(x,y,"#e8d29a",4); if(!wasT) emit("till"); emit("plant"); break; }
    case "harvest": {
      const cr=CROPS[f.c.k], ck=f.c.k, giant=!!f.c.g; give(ck,giant?5:1); S.stats.harvest+=giant?5:1;
      if(giant){ S.stats.giant=(S.stats.giant||0)+1; sfx("fanfare"); for(let i=0;i<3;i++) burst(x,y,["#f6d55c","#ffffff","#f28fb0"][i],14); banner("Riesen-"+ITEMS[ck].n+"!"); note("So groß! Das zählt wie fünf Stück."); }
      if(cr.re){ f.c.a=cr.days-cr.re; delete f.c.g; } else { f.c=null; f.d=false; }
      P.tool="auto"; sfx("pick"); floatItem(x,y,ck); emit("harvest"); break; }
    case "placespr": if(!S.inv.sprinkler) return; take("sprinkler",1); f.o="spr"; sfx("plant"); break;
    case "pickspr": f.o=null; give("sprinkler",1); sfx("pick"); break;
    case "fert": if(!S.inv.duenger) return; take("duenger",1); f.d=true; sfx("plant"); burst(x,y,"#cfe8a8",6); break;
  }
  redrawField(x,y); hudSoon(); hotbarSoon(); saveSoon();
}
function mineRock(r){
  if(!cost(2)) return;
  r.hp--; P.tool="hacke"; P.busy=.25; sfx("stone"); burst(r.x,r.y,"#8a8079",8);
  if(r.hp>0) return;
  S.rocks=S.rocks.filter(x=>x!==r);
  const k=r.k==="stein"?"stein":r.k; const n=r.k==="kupfer"?1+(rnd()<.5?1:0):1;
  give(k,n); floatItem(r.x,r.y,k); emit("mine");
  if(r.k==="mondquarz"){ S.stats.quarz=(S.stats.quarz||0)+1; } if(r.k==="mondquarz") note("Ein Mondquarz! Er schimmert wie der Mond.");
  saveSoon();
}
function spawnRocks(){
  const m=MAPS.hoehle, cand=[], seen=new Set([key(...m.spawn)]), q=[m.spawn];
  while(q.length){ const [x,y]=q.shift(); for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+dx, ny=y+dy, k=key(nx,ny); if(seen.has(k)||nx<0||ny<0||nx>=m.w||ny>=m.h||m.t[ny][nx]!==T.HBODEN) continue; seen.add(k); q.push([nx,ny]); if(ny<13) cand.push([nx,ny]); } }
  S.rocks=[];
  for(let i=0;i<26&&cand.length;i++){ const [x,y]=cand.splice(Math.floor(rnd()*cand.length),1)[0]; const r=rnd(); const k=r<.05?"mondquarz":r<.15?"amethyst":r<.42?"kupfer":"stein"; S.rocks.push({x,y,k,hp:k==="stein"?1:2}); }
}
function waterAct(x,y){
  if(S.hold==="rute"&&S.rod){ startFishing(x,y); return; }
  if(S.can.w<S.can.max){ S.can.w=S.can.max; sfx("water"); burst(x,y,"#9ad0f0",10,true); note("Gießkanne aufgefüllt ("+S.can.max+")."); hudSoon(); return; }
  if(S.rod) note("Wähle unten die Angel, um hier zu angeln."); else note("Die Gießkanne ist schon voll.");
}
function treeAct(x,y){
  if(season()===2&&rnd()<.3&&!S.flags["shake"+S.day+M.id+x+y]){ S.flags["shake"+S.day+M.id+x+y]=1; give("kastanie",1); floatItem(x,y,"kastanie"); sfx("pick"); return; }
  note(pick(["Ein schöner alter Baum.","Die Blätter rauschen leise.","Ein Vogel zwitschert irgendwo."]));
}

/* ================= Inventar ================= */
function give(k,n){ S.inv[k]=(S.inv[k]||0)+n; hotbarSoon(); }
function take(k,n){ S.inv[k]=(S.inv[k]||0)-n; if(S.inv[k]<=0){ delete S.inv[k]; if(S.hold===k) S.hold="auto"; } hotbarSoon(); }
function has(k,n){ if(k==="fisch") return JM.FISHKEYS.reduce((s,f)=>s+(S.inv[f]||0),0)>=n; return (S.inv[k]||0)>=n; }
function takeAny(k,n){ if(k!=="fisch") return take(k,n); for(const f of JM.FISHKEYS){ while(n>0&&S.inv[f]){ take(f,1); n--; } } }
function eat(k){
  const it=ITEMS[k]; if(!it||!it.eat||!S.inv[k]) return;
  take(k,1); const before=S.energy; S.energy=Math.min(S.maxE,S.energy+it.eat);
  sfx("eat"); hearts(P.x,P.y-.5,"#f6d55c");
  if(k==="nudeln"){ S.energy=S.maxE; S.flags.favEaten=(S.flags.favEaten||0)+1; DOGS.forEach(d=>{ d.x=P.x+(d.i?1:-1)*.8; d.y=P.y+.3; d.trick=1.2; hearts(d.x,d.y); });
    dialog([{who:"player",text:"Mmmh! Nudeln mit knusprigem Tempura-Chicken. Genau wie es sein muss."},{who:"dog0",text:fmtD("{d0} und {d1} schauen dich mit großen Augen an.")}]); }
  else note(it.n+" gegessen. Energie +"+Math.round(S.energy-before)+".");
  hudSoon(); saveSoon();
}

/* ================= Tiere ================= */
function dogMenu(d){
  faceTo(Math.round(d.x),Math.round(d.y)); d.face=P.x<d.x?-1:1;
  const n=dogName(d.i), other=dogName(1-d.i);
  dialog([{who:"dog"+d.i,text:n+" schaut dich mit großen Augen an.",choices:[
    {t:"Streicheln",fn:()=>petDog(d)},
    S.follow?{t:"Am Haus bleiben lassen",fn:()=>{ S.follow=false; note(n+" und "+other+" bleiben am Haus und spielen dort."); if(M.id!=="farm") DOGS=[]; else DOGS.forEach(x=>x.timer=0); saveSoon(); }}
            :{t:"Mitkommen lassen",fn:()=>{ S.follow=true; TRAIL=[]; note(n+" und "+other+" kommen mit!"); sfx("bark"); saveSoon(); }}
  ]}]);
}
function petDog(d){
  faceTo(Math.round(d.x),Math.round(d.y)); d.face=P.x<d.x?-1:1; hearts(d.x,d.y-.3); sfx("bark");
  emit("petdog",d.i);
  if(S.dogPet[d.i]!==S.day){ S.dogPet[d.i]=S.day; S.dogH[d.i]=Math.min(10,S.dogH[d.i]+1); S.energy=Math.min(S.maxE,S.energy+5); note(dogName(d.i)+" freut sich riesig. Energie +5."); }
  else if(S.dogH[d.i]>=3){ d.trick=1; note(pick([dogName(d.i)+" macht Männchen!",dogName(d.i)+" dreht sich im Kreis.",dogName(d.i)+" gibt dir Pfötchen."])); }
  else note(dogName(d.i)+" wedelt mit dem Schwanz.");
  hudSoon(); saveSoon();
}
function petHen(a){
  if(a.deco){ hearts(a.x,a.y-.2,"#f6d55c"); note("Paulas Hühner gackern freundlich."); return; }
  const h=S.hens[a.i]; hearts(a.x,a.y-.2); sfx("cluck"); a.peck=.6;
  if(h.pet!==S.day){ h.pet=S.day; h.h=Math.min(10,h.h+1); note(h.n+" gackert zufrieden."); } else note(h.n+": Gack!");
  saveSoon();
}
function cowAct(a){
  const c=S.cows[a.i]; hearts(a.x+.5,a.y-.6); sfx("moo");
  if(c.milk){ c.milk=false; give("milch",1); floatItem(a.x,a.y,"milch"); emit("collect","milch"); }
  if(c.pet!==S.day){ c.pet=S.day; c.h=Math.min(10,c.h+1); if(!c.milk) note(c.n+" muht zufrieden."); }
  saveSoon();
}
function pickEgg(egg){
  S.eggs=S.eggs.filter(g=>g!==egg); S.stats.eggs=(S.stats.eggs||0)+1; const k=egg.g?"goldei":"ei"; give(k,1); floatItem(egg.x,egg.y,k); sfx("pick"); emit("egg"); saveSoon();
}
function trough(kind){
  const animals=kind==="h"?S.hens.length:S.cows.length, cur=S.trough[kind];
  if(!animals){ note(kind==="h"?"Hier sind keine Hühner.":"Der Stall ist noch leer. Paula im Dorf verkauft Kühe."); return; }
  const need=animals-cur;
  if(need<=0){ note("Der Futtertrog ist voll."); return; }
  const n=Math.min(need,S.inv.futter||0);
  if(!n){ note("Kein Futter mehr. Paula im Dorf verkauft Tierfutter."); return; }
  take("futter",n); S.trough[kind]+=n; sfx("plant"); note("Futtertrog aufgefüllt ("+S.trough[kind]+"/"+animals+")."); saveSoon();
}
function pickForage(fo){
  S.forage[M.id]=(S.forage[M.id]||[]).filter(f=>f!==fo); give(fo.k,1); floatItem(fo.x,fo.y,fo.k); sfx("pick"); emit("forage"); saveSoon();
}
function bushAct(o){
  const k=M.id+":"+o.x+","+o.y;
  if(season()===1&&(S.bush[k]||0)<=S.day){ S.bush[k]=S.day+3; const n=1+(rnd()<.5?1:0); give("beeren",n); floatItem(o.x,o.y,"beeren"); sfx("pick"); return; }
  note(season()===1?"Die Beeren sind noch nicht wieder reif.":"Ein Beerenstrauch. Im Sommer trägt er Früchte.");
}

/* ================= Objekte ================= */
function objAct(o){
  const a=o.act;
  if(a==="house") return travel({to:"haus",tx:7,ty:9});
  if(a==="stove") return renePlan().mode==="cook"&&RA.vis?reneTalk():openCook();
  if(a==="table") return M.id==="haus"?showLetter():note("Ein gemütlicher Tisch.");
  if(a==="tv") return openTV();
  if(a==="bed") return openSleep();
  if(a==="wardrobe") return openWardrobe();
  if(a==="craft") return openCraft();
  if(a==="fridge") return note(pick(["Im Kühlschrank: Milch, Butter und ein Zettel: Nicht naschen! Gruß, "+JM.CONFIG.von+".","Kalt da drin. Und leer, bis auf "+JM.CONFIG.von+"s Joghurt."]));
  if(a==="counter") return M.shop?openShop(M.shop):note("Die Arbeitsplatte. "+JM.CONFIG.von+" hat Krümel hinterlassen.");
  if(a==="plant") return note("Eine Zimmerpflanze. Sie sieht durstig aus.");
  if(a==="shelf") return note("Ein Regal voller Kram.");
  if(a==="deco") return note(pick(["Gemütlich hier.","Hier riecht es gut."]));
  if(a==="ship") return openBag("ship");
  if(a==="mail") return openMail();
  if(a==="trough_h") return trough("h");
  if(a==="trough_c") return trough("c");
  if(a==="coop") return note("Der Hühnerstall. "+S.hens.map(h=>h.n).join(", ")+" wohnen hier.");
  if(a==="barn") return note(S.cows.length?"Der Stall. "+S.cows.map(c=>c.n).join(", ")+" wohnt hier.":"Ein leerer Kuhstall. Paula im Dorf verkauft Kühe.");
  if(a==="doghouse") return note("Die Hütte von "+dogName(0)+" und "+dogName(1)+". Zwei Näpfe, eine Decke, alles da.");
  if(a==="bush") return bushAct(o);
  if(a==="board") return openBoard();
  if(a==="stall") return openStall();
  if(a==="fountain") return note(pick(["Das Wasser glitzert in der Sonne.","Jemand hat eine Münze in den Brunnen geworfen.","Ein ruhiger Ort zum Durchatmen."]));
  if(a==="lamp") return note("Eine alte Straßenlaterne.");
  if(a==="mondbaum") return mondbaum();
  if(a==="cave_in") return travel({to:"hoehle",tx:10,ty:14});
  if(a==="cave_out") return travel({to:"forest",tx:24,ty:5});
  if(a.startsWith("shop:")){ const id=a.slice(5); if(npcPlace(JM.SHOPS[id].npc)==="in") return travel({to:"i_"+id,tx:6,ty:7}); return openShop(id); }
}

/* ================= Zeit ================= */
function paused(){ return !running||demo||UI.panel||UI.dialog||UI.fade||FISH.phase==="reel"; }
function festToday(){ return JM.FESTS.find(f=>f.s===season()&&f.d===dayIn()); }
function festActive(){ const f=festToday(); return f&&S.min>=f.from-60&&S.min<f.to?f:null; }
function rollWeather(day){
  const se=Math.floor((day-1)/JM.DPS)%4, di=((day-1)%JM.DPS)+1;
  if(day<=3||JM.FESTS.some(f=>f.s===se&&f.d===di)) return "sun";
  if(se===3) return rnd()<.35?"snow":"sun";
  return rnd()<(se===0?.22:se===1?.15:.2)?"rain":"sun";
}
function endDay(passedOut){
  if(UI.fade) return;
  closeAll(); FISH.phase=null;
  let earned=0; for(const k in S.ship){ earned+=(ITEMS[k].sell||0)*S.ship[k]; S.shipLog[k]=(S.shipLog[k]||0)+S.ship[k]; S.stats.shipped+=S.ship[k]; } S.ship={};
  S.money+=earned; S.stats.earned+=earned;
  const oldSe=season();
  // Pflanzen
  for(const k in S.field){ const f=S.field[k]; const [x,y]=k.split(",").map(Number); const glass=MAPS.farm.t[y][x]===T.GLAS;
    if(f.c&&f.w&&(glass||oldSe!==3)){ f.c.a++; if(f.d&&rnd()<.5) f.c.a++; } f.w=false;
    if(f.c&&f.c.a>=CROPS[f.c.k].days&&f.c.g==null) f.c.g=rnd()<(f.d?.08:.05); }
  // Tiere
  const eggSpots=[]; const c=MAPS.farm.coop; for(let y=c.y0+1;y<=c.y1;y++) for(let x=c.x0;x<=c.x1;x++) if(MAPS.farm.t[y][x]===T.GRAS||MAPS.farm.t[y][x]===T.TUFF||MAPS.farm.t[y][x]===T.BLUME) eggSpots.push([x,y]);
  S.hens.forEach(h=>{ if(S.trough.h>0){ S.trough.h--; const free=eggSpots.filter(([x,y])=>!S.eggs.some(g=>g.x===x&&g.y===y)); if(free.length&&S.eggs.length<10){ const [x,y]=pick(free); S.eggs.push({x,y,g:h.h>=7&&rnd()<.25}); } } });
  S.cows.forEach(cw=>{ if(S.trough.c>0){ S.trough.c--; cw.milk=true; } });
  S.day++; S.min=360;
  const se=season(); const notes=[];
  if(se!==oldSe){
    notes.push(JM.SEASONS[se]+" beginnt!");
    let died=0; for(const k in S.field){ const f=S.field[k]; const [x,y]=k.split(",").map(Number); if(f.c&&MAPS.farm.t[y][x]!==T.GLAS&&!CROPS[f.c.k].se.includes(se)){ f.c=null; died++; } }
    if(died) notes.push(died+" Pflanzen haben den Wechsel nicht überstanden.");
  }
  S.weather=S.tomorrow; S.tomorrow=rollWeather(S.day+1);
  if(S.weather==="rain"){ for(const k in S.field){ const [x,y]=k.split(",").map(Number); if(S.field[k].t&&MAPS.farm.t[y][x]!==T.GLAS) S.field[k].w=true; } notes.push("Es regnet. Die Beete draußen sind schon gegossen."); }
  for(const k in S.field){ if(S.field[k].o==="spr"){ const [x,y]=k.split(",").map(Number); for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ const f=S.field[key(x+dx,y+dy)]; if(f&&f.t) f.w=true; } } }
  // Pudel-Geschenke
  S.dogs.forEach((d,i)=>{ if(S.dogH[i]>=3&&rnd()<.35){ const k=pick(JM.FORAGE[se]); give(k,1); notes.push(dogName(i)+" hat dir "+(ITEMS[k].n)+" mitgebracht!"); } });
  // Sammelsachen
  S.forage={}; spawnForage("farm",2); spawnForage("forest",7); spawnForage("village",1);
  // Anschlagtafel und Tagesziele
  makeBoard(); spawnRocks(); makeDaily();
  if(S.day===5) S.mailQ.push({from:"paula",t:"Ein Tipp von Paula",b:"Hey!\n\nGanz hinten im Wald, oben rechts, gibt es eine alte Höhle. Da drin findest du Kupfer und manchmal sogar Edelsteine. Aus Kupfer und Stein kannst du an deiner Werkbank Sprinkler bauen. Spart dir das Gießen!\n\nPaula"});
  // Post
  const fest=JM.FESTS.find(f=>f.s===se&&f.d===dayIn()+1);
  if(fest) S.mailQ.push({from:"rosa",t:fest.n+" morgen!",b:"Liebe "+S.name+",\n\nmorgen ist "+fest.n+"! "+fest.desc+" Es beginnt um "+Math.floor(fest.from/60)+" Uhr auf dem Dorfplatz. Sprich einfach mit mir, wenn du da bist.\n\nRosa"});
  S.mail.push(...S.mailQ); S.mailQ=[];
  for(const id in NPCS){ const b=NPCS[id].bday; if(b[0]===se&&b[1]===dayIn()) notes.push("Heute hat "+NPCS[id].n+" Geburtstag."); }
  S.energy=passedOut?Math.round(S.maxE*.5):S.maxE;
  S.can.w=S.can.max; S.market=null; S.rene.cudToday=0; spawnMess();
  setMap("haus",10,5); P.dir=0;
  emit("sleep");
  save(true);
  const fd=$("fade");
  $("fadeT").textContent=JM.SEASONS[se]+" · Tag "+dayIn();
  const lines=[];
  if(passedOut) lines.push(fmtD("Du bist vor Erschöpfung eingeschlafen. {d0} und {d1} haben dich nach Hause gebracht."));
  if(earned) lines.push("Aus der Versandkiste: "+earned+" G");
  lines.push(...notes);
  if(!lines.length) lines.push("Guten Morgen, "+S.name+".");
  $("fadeP").innerHTML=lines.map(esc).join("<br>");
  UI.fade=true; fd.classList.add("show"); sfx("sleep");
  setTimeout(()=>{ fd.classList.remove("show"); setTimeout(()=>{ UI.fade=false; hud(); hotbar(); updateQuestUI(); if(S.mail.some(m=>!m.read)) note("Du hast Post im Briefkasten."); },500); },3200);
}
function spawnForage(mapId,n){
  const m=MAPS[mapId], list=S.forage[mapId]=[], se=season();
  const cand=[]; const seen=new Set(); const q=[m.spawn]; seen.add(key(...m.spawn));
  while(q.length){ const [x,y]=q.shift(); for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+dx, ny=y+dy, k=key(nx,ny); if(seen.has(k)||nx<0||ny<0||nx>=m.w||ny>=m.h) continue; const t=m.t[ny][nx]; if(!JM.WALK.has(t)) continue; seen.add(k); q.push([nx,ny]); if((t===T.TUFF||t===T.GRAS||t===T.WALD||t===T.BLUME)) cand.push([nx,ny]); } }
  for(let i=0;i<n&&cand.length;i++){ const j=Math.floor(rnd()*cand.length); const [x,y]=cand.splice(j,1)[0]; list.push({x,y,k:pick(JM.FORAGE[se])}); }
}
function srcHint(k){
  const it=ITEMS[k];
  if(it.cat==="crop") return "Samen gibt es bei Mei im Markt, dann pflanzen und gießen.";
  if(it.cat==="fish") return k==="karpfen"?"Angeln, am Teich auf deinem Hof oder im Waldfluss.":k==="forelle"?"Angeln, im Dorffluss oder im Waldfluss.":k==="barsch"?"Angeln, am Hofteich, im Dorffluss oder im Waldsee.":"Angeln.";
  if(it.cat==="forage") return "Liegt draußen herum, vor allem im Wald südlich vom Hof.";
  if(k==="ei") return "Deine Hühner legen jeden Morgen Eier, wenn der Futtertrog voll ist.";
  if(k==="milch") return "Von einer Kuh, die gefüttert wurde.";
  return "";
}
function makeDaily(){
  const can={mess:S.mess.length>0,cave:!!S.flags.caveSeen,crops:Object.values(S.field).some(f=>f.c), ripe:Object.values(S.field).some(f=>f.c&&f.c.a>=CROPS[f.c.k].days-1), met:JM.NPC_ORDER.some(id=>S.npc[id].met), rod:!!S.rod, eggs:S.hens.length>0, cook:Object.keys(S.inv).length>0, board:!!S.board&&!S.board.done};
  const pool=JM.DAILY.filter(d=>!d.need||can[d.need]);
  const goals=[]; while(goals.length<3&&pool.length){ const d=pool.splice(Math.floor(rnd()*pool.length),1)[0]; goals.push({k:d.k,p:0,seen:[]}); }
  S.daily={day:S.day,goals};
}
function dailyEmit(ev,arg){
  if(!S.daily||S.daily.day!==S.day) return;
  let changed=false;
  for(const g of S.daily.goals){ const D=JM.DAILY.find(d=>d.k===g.k); if(!D||g.p>=D.n) continue; if(D.ev!==ev&&!(D.ev==="cook"&&ev.startsWith("cook_"))) continue;
    if(D.uniq){ const k=String(arg); if(g.seen.includes(k)) continue; g.seen.push(k); }
    g.p++; changed=true; if(g.p>=D.n){ S.money+=D.g; sfx("quest"); setTimeout(()=>note("Tagesziel geschafft: "+fmtD(D.t)+". +"+D.g+" G"),250); if(S.daily.goals.every(x=>x.p>=JM.DAILY.find(d=>d.k===x.k).n)){ S.money+=100; setTimeout(()=>banner("Alle Tagesziele! +100 G"),900); } hud(); } }
  if(changed) updateQuestUI();
}
function makeBoard(){
  const se=season(), met=JM.NPC_ORDER.filter(id=>S.npc[id].met);
  if(!met.length){ S.board=null; return; }
  const pool=Object.keys(CROPS).filter(k=>CROPS[k].se.includes(se)).concat(S.hens.length?["ei"]:[],JM.FORAGE[se],S.rod?["karpfen","barsch","forelle"]:[]);
  const k=pick(pool), n=ITEMS[k].cat==="fish"?1:1+Math.floor(rnd()*3), who=pick(met);
  S.board={who,k,n,rew:Math.round((ITEMS[k].sell||40)*n*2+60),done:false,day:S.day};
}

/* ================= Bewohner ================= */
function npcPlace(id){
  const N=NPCS[id], st=S.npc[id];
  const f=festActive();
  if(f){ const spots={mei:[13,12],lin:[18,12],rosa:[15,13],paula:[13,9],henk:[18,9]}; return spots[id]; }
  if(festToday()&&S.min<(festToday().from-60)) return "off";
  const sched=(N.free&&N.free.includes(weekday())&&N.freeSched)?N.freeSched:N.sched;
  let place="off";
  for(const [t,p] of sched) if(S.min>=t) place=p;
  if(S.min<sched[0][0]) place="off";
  if(place!=="off"&&place!=="in"&&S.weather==="rain"&&id!=="henk") place="in";
  return place;
}
function homeDoor(id){ const o=MAPS.village.obj.find(o=>o.act==="shop:"+NPCS[id].home); return o?o.door:[15,13]; }
function npcPlaceAll(snap){
  for(const id in NPCS){
    let a=NPCA[id]; if(!a) a=NPCA[id]={id,x:0,y:0,vis:false,dir:0,flip:false,frame:0,ft:0,path:[],goal:null,state:"off",moving:false};
    const pl=npcPlace(id); a.state=Array.isArray(pl)?"out":pl;
    if(M.id!=="village"){ a.vis=false; continue; }
    if(Array.isArray(pl)){
      if(snap||!a.vis){ if(snap){ a.x=pl[0]; a.y=pl[1]; } else { const d=homeDoor(id); a.x=d[0]; a.y=d[1]; } a.vis=true; }
      a.goal=pl;
    } else {
      if(snap) a.vis=false; else if(a.vis) a.goal=homeDoor(id);
    }
  }
}
let lastNpcMin=-1;
function npcUpdate(dt){
  if(M.id!=="village") return;
  const m10=Math.floor(S.min/10);
  if(m10!==lastNpcMin){ lastNpcMin=m10; npcPlaceAll(false); }
  for(const id in NPCA){
    const a=NPCA[id]; if(!a.vis) continue;
    a.moving=false;
    if(a.goal&&(Math.round(a.x)!==a.goal[0]||Math.round(a.y)!==a.goal[1])&&!a.path.length){
      const g=a.goal; const sx=Math.round(a.x), sy=Math.round(a.y);
      const p=bfs(sx,sy,(x,y)=>x===g[0]&&y===g[1],3000); a.path=p||[]; if(!p){ a.x=g[0]; a.y=g[1]; }
    }
    if(a.path.length){
      const [nx,ny]=a.path[0], dx=nx-a.x, dy=ny-a.y, d=Math.hypot(dx,dy), sp=2.2*dt;
      if(Math.abs(dx)>Math.abs(dy)){ a.dir=2; a.flip=dx<0; } else if(Math.abs(dy)>.01) a.dir=dy<0?1:0;
      if(d<=sp){ a.x=nx; a.y=ny; a.path.shift(); } else { a.x+=dx/d*sp; a.y+=dy/d*sp; }
      a.moving=true; a.ft+=dt; if(a.ft>.15){ a.ft=0; a.frame=(a.frame+1)%4; }
    } else {
      a.frame=0;
      if(a.state!=="out"){ const d=homeDoor(id); if(Math.round(a.x)===d[0]&&Math.round(a.y)===d[1]) a.vis=false; }
      else if(rnd()<dt*.15){ a.dir=pick([0,0,2,2,1]); a.flip=rnd()<.5; }
    }
  }
}
const hearts10=id=>Math.min(10,Math.floor(S.npc[id].p/100));
function addPts(id,n){
  const st=S.npc[id], before=hearts10(id); st.p=clamp(st.p+n,0,1000); const after=hearts10(id);
  if(after>before&&after>=3){ emit("hearts3"); if(!st.r3){ st.r3=true; const r=NPCS[id].recipe; if(r!=="nudeln"&&!S.recipes.includes(r)) S.mailQ.push({from:id,t:"Ein Rezept für dich",b:NPCS[id].n+" hat dir ein Rezept geschrieben:\n\n"+ITEMS[r].n+"\n\nKoch es mal in deiner Küche. Ich hoffe, es schmeckt dir!\n\n"+NPCS[id].n,recipe:r}); } }
}
function npcInteract(id){
  const N=NPCS[id], st=S.npc[id], a=NPCA[id];
  if(a){ a.dir=Math.round(P.y)<Math.round(a.y)?1:Math.round(P.y)>Math.round(a.y)?0:2; a.flip=P.x<a.x; }
  const f=festActive();
  if(f&&id==="rosa"&&!S.flags["fest_"+f.id+year()]){ runFest(f); return; }
  if(!st.met){
    st.met=true; addPts(id,20); st.talk=S.day;
    const seq=[{who:id,text:N.intro}];
    if(id==="henk"&&!S.rod){ seq.push({who:null,text:"Du hast eine Angel bekommen! Wähle sie unten aus und tippe auf Wasser.",fn:()=>{ S.rod=1; hotbar(); sfx("fanfare"); }}); }
    dialog(seq,()=>{ emit("meet",id); emit("talk_"+id); emit("talk",id); });
    return;
  }
  const hold=S.hold, it=ITEMS[hold];
  const giftable=it&&hold!=="sprinkler"&&hold!=="futter"&&it.cat!=="seed";
  if(giftable&&st.gift===S.day) note("Du hast "+N.n+" heute schon etwas geschenkt. Morgen freut sich "+N.n+" wieder.");
  if(giftable&&st.gift!==S.day){
    dialog([{who:id,text:pick(["Oh, was hast du da?","Ja?","Na, was gibt's?"]),choices:[{t:"Schenken: "+it.n,fn:()=>giveGift(id,hold)},{t:"Nur reden",fn:()=>talk(id)}]}]);
    return;
  }
  talk(id);
}
function talk(id){
  if(hearts10(id)>=5&&!S.flags["h5_"+id]&&JM.HEART[id]){ const H=JM.HEART[id]; S.flags["h5_"+id]=true; const seq=H.lines.map(t=>({who:id,text:fmtD(t)})); seq.push({who:null,text:"Ein besonderer Moment mit "+NPCS[id].n+". Du bekommst: "+Object.entries(H.items).map(([k,n])=>n+"× "+ITEMS[k].n).join(", ")+".",fn:()=>{ for(const k in H.items) give(k,H.items[k]); addPts(id,50); sfx("fanfare"); }}); dialog(seq,()=>{ emit("talk_"+id); emit("talk",id); }); saveSoon(); return; }
  const N=NPCS[id], st=S.npc[id], tier=hearts10(id)>=6?2:hearts10(id)>=3?1:0, b=N.bday;
  let line;
  if(b[0]===season()&&b[1]===dayIn()) line="Heute ist mein Geburtstag! Schön, dass du vorbeischaust.";
  else if(S.weather==="rain"&&rnd()<.5) line=N.rain;
  else line=pick(N.lines[tier].concat(tier?N.lines[tier-1]:[]));
  if(st.talk!==S.day){ st.talk=S.day; addPts(id,20); }
  dialog([{who:id,text:fmtD(line)}],()=>{ emit("talk_"+id); emit("talk",id); });
  saveSoon();
}
function giveGift(id,k){
  const N=NPCS[id], st=S.npc[id];
  if(!S.inv[k]) return;
  take(k,1); st.gift=S.day;
  const b=N.bday, bday=b[0]===season()&&b[1]===dayIn();
  let lv="neutral", pts=20;
  if(N.love.includes(k)||k==="nudeln"){ lv="love"; pts=80; } else if(N.like.includes(k)){ lv="like"; pts=45; } else if(N.hate.includes(k)){ lv="hate"; pts=-25; }
  if(bday) pts*=3;
  if(st.talk!==S.day){ st.talk=S.day; pts+=20; }
  addPts(id,pts); sfx(lv==="hate"?"bad":"gift");
  const a=NPCA[id]; if(a&&lv!=="hate") hearts(a.x,a.y-1.2);
  let txt=N.gift[lv]; if(bday&&lv!=="hate") txt="Ein Geburtstagsgeschenk? Du bist ein Schatz! "+txt;
  dialog([{who:id,text:txt}],()=>{ emit("gift_"+id+"_"+k); emit("gift"); });
  saveSoon();
}

/* ================= Feste ================= */
function runFest(f){
  S.flags["fest_"+f.id+year()]=true;
  const allPts=n=>JM.NPC_ORDER.forEach(id=>{ if(S.npc[id].met) addPts(id,n); });
  if(f.id==="blumen"){
    FESTFX.petals=8;
    dialog([{who:"rosa",text:"Willkommen zum Blumenfest! Der Frühling ist da, und wir feiern ihn wie jedes Jahr mit einem Tanz um den Brunnen."},
      {who:"mei",text:"Ich hab dir einen Blumenkranz geflochten. Steht dir super!"},
      {who:null,text:fmtD("Du tanzt mit {d0} und {d1} um den Brunnen. Alle klatschen im Takt.")},
      {who:"lin",text:"Nicht schlecht. Du hast Rhythmus."},
      {who:"rosa",text:"Als Dank für die gute Laune: Erdbeer-Samen für deinen Hof!",fn:()=>{ give("erdbeere_s",6); allPts(60); sfx("fanfare"); }}]);
  } else if(f.id==="feuerwerk"){
    FESTFX.fire=14;
    dialog([{who:"rosa",text:"Guten Abend, alle zusammen! Gleich geht es los. Schaut nach oben!"},
      {who:null,text:"Bunte Lichter platzen über dem Dorf und spiegeln sich im Fluss."},
      {who:"henk",text:"Hm. Schön. Fast so schön wie ein Sonnenaufgang am Wasser."},
      {who:"paula",text:"Meine Kühe finden das bestimmt furchtbar. Aber ich liebe es!",fn:()=>{ allPts(50); give("mais_s",4); }}]);
  } else if(f.id==="sterne"){
    FESTFX.stars=12;
    const who=pick(JM.NPC_ORDER.filter(id=>S.npc[id].met).concat(["rosa"]));
    dialog([{who:"rosa",text:"Willkommen zur Sternennacht. Heute beschenken wir uns gegenseitig. Ich habe ausgelost, wer wen beschenkt."},
      {who:who,text:"Ich hab dich gezogen! Hier, das ist für dich. Frohe Sternennacht!",fn:()=>{ give("mondstein",1); allPts(50); sfx("fanfare"); }},
      {who:null,text:"Du bekommst einen Mondstein. Er schimmert ganz leicht."}]);
  } else if(f.id==="mond"){
    FESTFX.lanterns=30; FESTFX.moon=30;
    const seq=[
      {who:"rosa",text:"Liebe Leute, heute ist Vollmond, und wir feiern das Mondfest. Jedes Jahr lassen wir Laternen aufsteigen, für alles, wofür wir dankbar sind."},
      {who:"rosa",text:"Dieses Jahr bin ich besonders dankbar, dass auf dem Mondhof wieder Licht brennt. "+S.name+", das ist deine erste Laterne."},
      {who:"mei",text:"Ich wünsche mir, dass du für immer bleibst!"},
      {who:"lin",text:"Für mich: dass du weiter so gut kochst. Und vielleicht ab und zu bei mir isst."},
      {who:"paula",text:"Ich bin dankbar für jede Kuh, jedes Huhn und jeden Menschen mit einem großen Herzen. Also auch für dich."},
      {who:"henk",text:"...Danke, dass du da bist. Mehr sag ich nicht."},
      {who:null,text:fmtD("Die Laternen steigen langsam in den Himmel. {d0} und {d1} sitzen eng neben dir und schauen nach oben.")},
      {who:"rene",text:fmtD("{name}, weißt du was? Du hast es geschafft. Aus einem verwilderten Hof ist ein Zuhause geworden. {d0} und {d1} sind stolz auf dich, und ich bin es auch.\n\nSchau mal nach oben. Der Mond scheint heute nur für dich. Und ich bin froh, dass ich neben dir stehe.")},
      {who:null,text:"Du bekommst das Mondamulett. Deine maximale Energie steigt um 30.",fn:()=>{ give("amulett",1); S.maxE+=30; S.energy=S.maxE; S.flags.finale=true; allPts(100); sfx("fanfare"); }}
    ];
    dialog(seq,()=>{ emit("fest_mond"); banner("Kapitel 1 geschafft"); });
  }
}
const FESTFX={petals:0,fire:0,lanterns:0,moon:0,stars:0};

/* ================= Mondbaum ================= */
function mondbaum(){
  if(!S.flags.mondbaum){
    S.flags.mondbaum=true;
    dialog([{who:null,text:"Ein uralter Baum. Seine Blätter schimmern silbern wie Mondlicht."},{who:null,text:"In der Rinde sind fünf kleine Mulden. Es fühlt sich an, als würde der Baum auf etwas warten."},{who:null,text:"Vielleicht freut er sich über Gaben von deinem Hof."}],()=>{ emit("mondbaum"); openBundles(); });
    return;
  }
  openBundles();
}
function bundleDeliver(bid,k){
  const B=JM.BUNDLES.find(b=>b.id===bid), got=S.bundles[bid]||(S.bundles[bid]={});
  const need=B.need[k]-(got[k]||0); const n=Math.min(need,S.inv[k]||0); if(n<=0) return;
  take(k,n); got[k]=(got[k]||0)+n; sfx("pick");
  if(Object.keys(B.need).every(i=>(got[i]||0)>=B.need[i])&&!S.bundleDone[bid]){
    S.bundleDone[bid]=true; sfx("fanfare"); bundleReward(bid); emit("bundle"); burst(13.5,18,"#f6e6a0",24,true);
    if(JM.BUNDLES.every(b=>S.bundleDone[b.id])){ give("mondstein",1); S.mailQ.push({from:"rosa",t:"Der Mondbaum leuchtet!",b:"Liebe "+S.name+",\n\ngestern Nacht hat der ganze Wald geleuchtet. Alle im Dorf haben es gesehen. Was auch immer du getan hast: Danke!\n\nRosa"}); }
  }
  saveSoon(); openBundles();
}
function bundleReward(bid){
  const msg={fr:"Der Baum schenkt dir 3 Sprinkler. Mei verkauft ab jetzt auch welche.",ho:"Du fühlst dich stärker. Maximale Energie +30.",fl:"Zwischen den Wurzeln liegt eine goldene Angel!",so:"Zwischen den Wurzeln steht eine große Gießkanne.",he:"Ein warmes Leuchten zieht Richtung Hof. Das Gewächshaus ist repariert!"}[bid];
  if(bid==="fr"){ give("sprinkler",3); S.flags.bundle_fr=true; }
  if(bid==="ho"){ S.maxE+=30; S.energy+=30; }
  if(bid==="fl"){ S.rod=2; S.bought.rute2=true; }
  if(bid==="so"){ S.can.max=40; S.can.w=40; S.bought.kanne2=true; }
  if(bid==="he"){ S.flags.glas=true; groundKey=""; }
  setTimeout(()=>note(msg),300);
}

/* ================= Angeln ================= */
const FISH={phase:null,t:0,k:null,zone:0,zv:0,fy:0,fv:0,ft:0,prog:0,hold:false,x:0,y:0};
function startFishing(x,y){
  if(!cost(3)) return;
  FISH.phase="wait"; FISH.t=1.6+rnd()*3.5; FISH.x=x; FISH.y=y; P.tool="rute"; P.busy=.4; sfx("cast");
  FISH.k=pickFish(JM.waterKind(M.id,x,y));
}
function pickFish(kind){
  const night=S.min>=1140||S.min<360;
  let opts=Object.keys(JM.FISH).filter(k=>JM.FISH[k].at.includes(kind)&&(!JM.FISH[k].night||night));
  for(const k of opts){ const r=JM.FISH[k].rare; if(r&&rnd()<r*(k==="koi"&&FESTFX.moon?3:1)) return k; }
  opts=opts.filter(k=>!JM.FISH[k].rare); return pick(opts.length?opts:["karpfen"]);
}
function fishTap(){
  if(FISH.phase==="wait"){ note("Geduld... warte, bis das Ausrufezeichen erscheint."); return; }
  if(FISH.phase==="bite"){ FISH.phase="reel"; FISH.prog=.45; FISH.zone=.2; FISH.zv=0; FISH.fy=.35; FISH.fv=0; FISH.ft=.8; FISH.tgt=.35; FISH.hold=false; $("fishui").hidden=false; sfx("bite"); }
}
const fishEl=$("fishui"), fcv=$("fishcv"), fcx=fcv.getContext("2d");
fishEl.addEventListener("pointerdown",e=>{ e.preventDefault(); FISH.hold=true; });
addEventListener("pointerup",()=>{ FISH.hold=false; });
function fishUpdate(dt){
  if(FISH.phase==="wait"){ FISH.t-=dt; if(FISH.t<=0){ FISH.phase="bite"; FISH.t=1.6; sfx("alert"); note("Es zieht! Jetzt tippen!"); try{ navigator.vibrate&&navigator.vibrate(120); }catch(e){} } }
  else if(FISH.phase==="bite"){ FISH.t-=dt; if(FISH.t<=0){ FISH.phase=null; note("Zu langsam, der Fisch ist weg. Wirf einfach nochmal aus."); } }
  else if(FISH.phase==="reel"){
    const F=JM.FISH[FISH.k], dif=F.dif*(S.rod===2?.75:1), zs=S.rod===2?.4:.32;
    FISH.zv+=(FISH.hold?2.2:-1.5)*dt; FISH.zv=clamp(FISH.zv,-1,1); FISH.zone+=FISH.zv*dt;
    if(FISH.zone<0){ FISH.zone=0; FISH.zv=Math.abs(FISH.zv)*.3; } if(FISH.zone>1-zs){ FISH.zone=1-zs; FISH.zv=0; }
    FISH.ft-=dt; if(FISH.ft<=0){ FISH.ft=.45+rnd()*(1.6-dif*1.3); FISH.tgt=clamp(FISH.fy+(rnd()-.5)*(.5+dif*1.3),0,1); }
    FISH.fv+=(FISH.tgt-FISH.fy)*dt*(2+dif*9); FISH.fv*=Math.pow(.2,dt); FISH.fy=clamp(FISH.fy+FISH.fv*dt,0,1);
    const inside=FISH.fy>=FISH.zone&&FISH.fy<=FISH.zone+zs;
    FISH.prog+=(inside?.32:-.12-dif*.26)*dt;
    if(FISH.prog>=1){ FISH.phase=null; fishEl.hidden=true; catchFish(); }
    else if(FISH.prog<=0){ FISH.phase=null; fishEl.hidden=true; note("Ach, er ist entwischt. Nächstes Mal!"); sfx("bad"); }
    drawFishUI(zs,inside);
  }
}
function catchFish(){
  const k=FISH.k; give(k,1); S.fishLog[k]=(S.fishLog[k]||0)+1; sfx("fanfare"); floatItem(FISH.x,FISH.y,k);
  note((k==="koi"?"Unglaublich! ":"")+ITEMS[k].n+" gefangen!"); emit("fish",k); saveSoon();
}
function drawFishUI(zs,inside){
  const w=fcv.width, h=fcv.height, c=fcx; c.clearRect(0,0,w,h);
  c.fillStyle="#2a3a5a"; c.fillRect(8,4,36,h-8); c.fillStyle="#3f5a8a"; c.fillRect(12,8,28,h-16);
  const H=h-16, zy=8+H*(1-FISH.zone-zs);
  c.fillStyle=inside?"#7ed05a":"#5aa63a"; c.fillRect(12,zy,28,H*zs);
  c.fillStyle="rgba(255,255,255,.35)"; c.fillRect(12,zy,28,3);
  const fy=8+H*(1-FISH.fy)-8; c.drawImage(icon(FISH.k),10,fy,32,32);
  c.fillStyle="#2a3a5a"; c.fillRect(50,4,12,h-8); c.fillStyle=FISH.prog>.6?"#7ed05a":FISH.prog>.3?"#f3c34a":"#e8583a"; const ph=(h-12)*clamp(FISH.prog,0,1); c.fillRect(52,h-6-ph,8,ph);
}

/* ================= Aufgaben ================= */
const curQ=()=>JM.QUESTS.find(q=>!S.qDone.includes(q.id));
function achDone(id){
  const fl=S.fishLog;
  switch(id){
    case "ernte1": return S.stats.harvest>=1; case "ernte100": return S.stats.harvest>=100;
    case "fisch5": return Object.keys(fl).length>=5; case "koi": return !!fl.koi;
    case "lieb": return !!S.cookLog.nudeln; case "koch": return JM.RECIPES.every(r=>S.cookLog[r.k]);
    case "pudel": return S.dogH[0]>=10&&S.dogH[1]>=10; case "dorf": return JM.NPC_ORDER.every(n=>hearts10(n)>=5);
    case "baum": return JM.BUNDLES.every(b=>S.bundleDone[b.id]); case "quarz": return (S.stats.quarz||0)>0||!!S.shipLog.mondquarz||!!S.inv.mondquarz;
    case "reich": return S.stats.earned>=10000;
    case "ordnung": return (S.stats.tidy||0)>=25; case "kuscheln": return (S.rene.cuddles||0)>=10; case "jahr": return S.day>JM.DPS*3;
  }
  return false;
}
function checkAch(){ S.ach=S.ach||[]; for(const a of JM.ACH){ if(!S.ach.includes(a.id)&&achDone(a.id)){ S.ach.push(a.id); sfx("fanfare"); banner("Erfolg: "+fmtD(a.t)); saveSoon(); break; } } }
function recheckQuest(){ if(!demo) checkAch(); const q=curQ(); if(!q||q.ev==="never") return; const a=questAlready(q); if(a>S.quest.p){ S.quest.p=Math.min(q.n,a); if(S.quest.p>=q.n) completeQuest(); else updateQuestUI(); } }
function emit(ev,arg){
  if(!S||demo) return;
  if(ev.startsWith("cook_")) S.cookLog[ev.slice(5)]=(S.cookLog[ev.slice(5)]||0)+1;
  dailyEmit(ev,arg);
  const q=curQ(); if(!q) return;
  if(q.ev!==ev) return;
  if(q.uniq){ const k=String(arg); if(S.quest.seen.includes(k)) return; S.quest.seen.push(k); }
  S.quest.p++;
  if(S.quest.p>=q.n) completeQuest(); else updateQuestUI();
}
function questKeep(){
  const q=curQ(), k={}; if(!q) return k;
  if(q.id==="lin") k.pakchoi=1;
  if(q.id==="lieblingsessen") Object.assign(k,JM.RECIPES[0].need);
  if(q.id==="gabe") JM.BUNDLES.forEach(B=>{ if(S.bundleDone[B.id]) return; const got=S.bundles[B.id]||{}; for(const i in B.need) k[i]=Math.max(k[i]||0,B.need[i]-(got[i]||0)); });
  if(S.board&&!S.board.done) k[S.board.k]=Math.max(k[S.board.k]||0,S.board.n);
  return k;
}
function questAlready(q){
  const F=()=>Object.values(S.field);
  switch(q.id){
    case "brief": return S.flags.letter?1:0;
    case "rene": return S.rene.met?1:0;
    case "aufraeumen": return S.stats.tidy||0;
    case "pudel": { const m=[0,1].filter(i=>S.dogPet[i]===S.day).map(String); S.quest.seen=m; return m.length; }
    case "raeumen": { const left=Object.values(S.field).filter(f=>f.o&&f.o!=="spr").length; if(left<q.n) return q.n; return Math.max(0,(S.flags.debris0||left)-left); }
    case "eier": return S.stats.eggs||0;
    case "hacken": return F().filter(f=>f.t).length;
    case "saeen": return F().filter(f=>f.c).length;
    case "giessen": return F().filter(f=>f.w).length;
    case "dorf": return S.npc.mei.met?1:0;
    case "nachbarn": { const m=["lin","rosa","paula","henk"].filter(id=>S.npc[id].met); S.quest.seen=m; return m.length; }
    case "ernte": return S.stats.harvest||0;
    case "versand": return Object.keys(S.ship).length||S.stats.shipped?1:0;
    case "angeln": return Object.keys(S.fishLog).length?1:0;
    case "lin": return S.recipes.includes("nudeln")?1:0;
    case "lieblingsessen": return S.cookLog.nudeln?1:0;
    case "wald": return S.flags.mondbaum?1:0;
    case "gabe": return Object.keys(S.bundleDone).length?1:0;
    case "tier": return (S.hens.length>2||S.cows.length)?1:0;
    case "freunde": return JM.NPC_ORDER.some(id=>hearts10(id)>=3)?1:0;
    case "mondfest": return S.flags.finale?1:0;
  }
  return 0;
}
function completeQuest(){
  const q=curQ(); const r=q.reward||{};
  if(r.g) S.money+=r.g; if(r.items) for(const k in r.items) give(k,r.items[k]);
  if(q.id==="lin"&&!S.recipes.includes("nudeln")){
    S.recipes.push("nudeln");
    setTimeout(()=>dialog([{who:"lin",text:"Pak Choi von deinem eigenen Feld. Weißt du was? Dafür verrate ich dir das Rezept meines Großvaters."},{who:"lin",text:"Chinesische Nudeln mit Tempura-Chicken. Zwei Hände voll Weizen für die Nudeln, Pak Choi, Frühlingszwiebel, ein frisches Ei für den Teig und Hähnchenbrust. Den Rest macht die Liebe."},{who:null,text:"Du hast das Rezept „Chinesische Nudeln mit Tempura-Chicken“ gelernt!",fn:()=>sfx("fanfare")}]),200);
  }
  if(q.id==="lieblingsessen") S.mailQ.push({from:"von",t:"Für dich",b:fmtD("Liebe {name},\n\nich hab gehört, du hast dein Lieblingsessen gekocht. Ich hoffe, es hat so gut geschmeckt wie bei uns zu Hause.\n\nIn Liebe,\n{von}")});
  if(q.id==="freunde"){ S.money+=500; }
  S.qDone.push(q.id); sfx("quest");
  banner("Erledigt: "+fmtD(q.t)); if(r.text) setTimeout(()=>note(r.text),900);
  S.quest={id:null,p:0,seen:[]};
  activateQuest();
  saveSoon();
}
function activateQuest(){
  const q=curQ(); if(!q) return;
  if(S.quest.id!==q.id){ S.quest={id:q.id,p:0,seen:[]}; }
  S.quest.p=Math.min(q.n,questAlready(q)||0);
  if(q.hold&&(q.hold==="auto"||S.inv[q.hold]||(q.hold==="rute"&&S.rod))){ S.hold=q.hold; hotbar(); }
  if(S.quest.p>=q.n&&q.ev!=="never"){ setTimeout(completeQuest,600); return; }
  updateQuestUI();
}
function questTarget(){
  const q=curQ(); if(!q||!q.tg) return null;
  const tg=q.tg, F=MAPS.farm, nearest=(fn)=>{ let best=null,bd=1e9; for(let y=0;y<F.h;y++) for(let x=0;x<F.w;x++){ if(F.t[y][x]!==T.FELD) continue; if(fn(fieldAt(x,y)||{})){ const d=Math.abs(x-P.x)+Math.abs(y-P.y); if(d<bd){bd=d;best={map:"farm",x,y};} } } return best; };
  if(tg==="house"){ const q=curQ(); return q.id==="schlafen"?{map:"haus",x:11,y:3}:q.id==="lieblingsessen"?{map:"haus",x:2,y:3}:q.id==="brief"?{map:"haus",x:5,y:5}:{map:"haus",x:7,y:6}; }
  if(tg==="rene"){ const pl=renePlan(); if(!pl.map) return null; return RA.vis?{map:M.id,x:RA.x,y:RA.y-1,live:true}:{map:pl.map,x:pl.pos[0],y:pl.pos[1]-1}; }
  if(tg==="mess"){ const m=S.mess.find(m=>m.map===M.id)||S.mess[0]; return m?{map:m.map,x:m.x,y:m.y}:null; }
  if(tg==="dogs"){ const d=DOGS.find(d=>!S.quest.seen.includes(String(d.i))); return d?{map:M.id,x:d.x,y:d.y-.6,live:true}:{map:"farm",x:3,y:8}; }
  if(tg==="debris") return nearest(f=>f.o&&f.o!=="spr");
  if(tg==="field") return nearest(f=>!f.t&&!f.o);
  if(tg==="tilled") return nearest(f=>f.t&&!f.c&&!f.o);
  if(tg==="dry") return nearest(f=>(f.t||f.c)&&!f.w);
  if(tg==="ripe") return nearest(f=>f.c&&f.c.a>=CROPS[f.c.k].days)||nearest(f=>f.c&&!f.w);
  if(tg==="eggs"){ const e=S.eggs[0]; return e?{map:"farm",x:e.x,y:e.y}:{map:"farm",x:17,y:7}; }
  if(tg==="box") return {map:"farm",x:9,y:7};
  if(tg==="water") return M.id==="farm"?{map:"farm",x:18,y:19}:M.id==="village"?{map:"village",x:9,y:24}:{map:"forest",x:14,y:11};
  if(tg==="mondbaum") return {map:"forest",x:13,y:18};
  if(tg==="fest") return festToday()?{map:"village",x:15,y:13}:null;
  if(tg.startsWith("npc:")){
    let id=tg.slice(4);
    if(id==="unmet") id=["lin","rosa","paula","henk"].find(i=>!S.npc[i].met);
    if(!id) return null;
    const pl=npcPlace(id);
    if(Array.isArray(pl)){ const a=NPCA[id]; return (M.id==="village"&&a&&a.vis)?{map:"village",x:a.x,y:a.y-1,live:true}:{map:"village",x:pl[0],y:pl[1]-1}; }
    if(pl==="in") return {map:"i_"+NPCS[id].home,x:6,y:2};
    return null;
  }
  return null;
}
function routeTarget(t){
  if(!t) return null; if(t.map===M.id) return t;
  if(M.inside){ const ex=M.exits[0]; return {map:M.id,x:ex.x,y:ex.y,exit:true}; }
  if(t.map==="haus"){ if(M.id==="farm") return {map:"farm",x:5,y:6,exit:true}; t={map:"farm",x:5,y:6}; }
  else if(t.map.startsWith("i_")){ const o=MAPS.village.obj.find(o=>o.act==="shop:"+t.map.slice(2)); if(M.id==="village") return {map:"village",x:o.door[0],y:o.door[1]-1,exit:true}; t={map:"village",x:o.door[0],y:o.door[1]}; }
  if(t.map===M.id) return t;
  const via={farm:{village:[27,15],forest:[13,31],hoehle:[13,31]},village:{farm:[0,9],forest:[0,9],hoehle:[0,9]},forest:{farm:[13,0],village:[13,0],hoehle:[24,4]},hoehle:{farm:[10,16],village:[10,16],forest:[10,16]}}[M.id][t.map];
  return {map:M.id,x:via[0],y:via[1],exit:true};
}

/* ================= Effekte ================= */
/* Sternschnuppen: abends draußen, antippen und etwas wünschen */
const STAR={a:null,cool:20,hint:-1};
const WISHES=["Ich wünsch mir, dass {d0} und {d1} immer gesund bleiben.","Ich wünsch mir noch ganz viele Abende wie diesen. Mit {von}.","Ich wünsch mir die größte Ernte, die das Dorf je gesehen hat.","Ich wünsch mir, dass {von} endlich seine zweite Socke findet.","Ich wünsch mir, dass es morgen chinesische Nudeln mit Tempura-Chicken gibt.","Ich wünsch mir einen Hof voller Lachen."];
function starTick(dt){
  if(STAR.a){ STAR.a.t+=dt; if(STAR.a.t>STAR.a.d) STAR.a=null; return; }
  const night=S.min>=1170||S.min<300; if(demo||!night||M.inside||M.cave||S.weather!=="sun"||paused()) return;
  STAR.cool-=dt; if(STAR.cool>0) return; STAR.cool=25+rnd()*35;
  const ltr=rnd()<.5; STAR.a={x0:ltr?.1+rnd()*.3:.6+rnd()*.3,y0:.18+rnd()*.25,vx:(ltr?1:-1)*(.22+rnd()*.1),vy:.07+rnd()*.05,t:0,d:2.6};
  if(STAR.hint!==S.day){ STAR.hint=S.day; note("Eine Sternschnuppe! Schnell antippen und etwas wünschen."); }
}
function starPos(){ const a=STAR.a; return [(a.x0+a.vx*a.t)*innerWidth,(a.y0+a.vy*a.t)*innerHeight]; }
function drawStar(){
  const a=STAR.a; if(!a) return; const [x,y]=starPos(), k=DPR, f=Math.min(1,a.t*3,(a.d-a.t)*2);
  ctx.save(); ctx.globalAlpha=f; const tx=x-a.vx*innerWidth*.6, ty=y-a.vy*innerHeight*.6;
  const g=ctx.createLinearGradient(tx*k,ty*k,x*k,y*k); g.addColorStop(0,"rgba(255,240,200,0)"); g.addColorStop(1,"rgba(255,248,220,.95)");
  ctx.strokeStyle=g; ctx.lineWidth=4.5*k; ctx.lineCap="round"; ctx.beginPath(); ctx.moveTo(tx*k,ty*k); ctx.lineTo(x*k,y*k); ctx.stroke();
  const r=ctx.createRadialGradient(x*k,y*k,0,x*k,y*k,20*k); r.addColorStop(0,"rgba(255,255,240,1)"); r.addColorStop(1,"rgba(255,230,160,0)"); ctx.fillStyle=r; ctx.fillRect(x*k-20*k,y*k-20*k,40*k,40*k);
  ctx.restore();
}
function starHit(cx,cy){
  if(!STAR.a) return false; const [x,y]=starPos(); if(Math.hypot(cx-x,cy-y)>70) return false;
  STAR.a=null; S.stats.wishes=(S.stats.wishes||0)+1; sfx("fanfare");
  const gifts=[()=>{ const n=150+Math.floor(rnd()*200); S.money+=n; return n+" G liegen plötzlich in deiner Tasche."; },()=>{ give("erdbeere_s",3); return "Drei Erdbeer-Samen funkeln in deiner Hand."; },()=>{ S.energy=S.maxE; return "Du fühlst dich wach und voller Kraft."; },()=>{ give("mondquarz",1); return "Ein Mondquarz fällt vor dir ins Gras."; },()=>{ S.dogH=S.dogH.map(h=>Math.min(10,h+1)); return fmtD("{d0} und {d1} kuscheln sich glücklich an dich."); }];
  const txt=pick(gifts)(); hud(); saveSoon();
  dialog([{who:"player",text:fmtD(pick(WISHES))},{who:null,text:txt}]);
  return true;
}
/* Fotomodus: Spielbild ohne Menüs, mit Rahmen und Datum */
let PHOTO=false;
function photo(){
  if(!running||demo||paused()) return;
  PHOTO=true; render();
  const W=VW, H=VH, pad=Math.round(W*.045), foot=Math.round(W*.16);
  const c=A.cnv(W+pad*2,H+pad+foot), x=c.getContext("2d");
  x.fillStyle="#fbf3e2"; x.fillRect(0,0,c.width,c.height);
  const gl=document.getElementById("gl"); if(use3D()&&gl) x.drawImage(gl,pad,pad,W,H); x.drawImage(cv,pad,pad,W,H);
  PHOTO=false;
  x.strokeStyle="#5a3a22"; x.lineWidth=Math.max(2,W*.004); x.strokeRect(pad,pad,W,H);
  x.fillStyle="#3a2418"; x.textAlign="center";
  x.font=`900 ${Math.round(W*.055)}px Saira, system-ui, sans-serif`; x.fillText("JANINAS MOON",c.width/2,H+pad+foot*.48);
  x.font=`600 ${Math.round(W*.034)}px Barlow, system-ui, sans-serif`; x.fillText(dayIn()+". "+JM.SEASONS[season()]+" · Jahr "+year()+" · "+fmtD("mit {d0} und {d1}"),c.width/2,H+pad+foot*.8);
  const fl=$("flash"); fl.style.transition="none"; fl.style.opacity="1"; requestAnimationFrame(()=>{ fl.style.transition="opacity .6s"; fl.style.opacity="0"; });
  sfx("blip"); S.stats.photos=(S.stats.photos||0)+1; saveSoon();
  const name="janinas-moon-"+S.day+"-"+Math.round(S.min)+".png";
  c.toBlob(async b=>{ if(!b){ note("Das Foto hat nicht geklappt."); return; }
    const file=new File([b],name,{type:"image/png"});
    try{ if(navigator.canShare&&navigator.canShare({files:[file]})){ await navigator.share({files:[file],title:"Janinas Moon"}); note("Foto geteilt."); return; } }catch(err){ if(err&&err.name==="AbortError"){ note("Foto nicht gespeichert."); return; } }
    const u=URL.createObjectURL(b), a=document.createElement("a"); a.href=u; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u),4000); note("Foto gespeichert.");
  },"image/png");
}
function burst(x,y,c,n,drop){ for(let i=0;i<n;i++) FX.push({x:x*16+8,y:y*16+10,vx:(rnd()-.5)*50,vy:-rnd()*50-15,l:.5+rnd()*.3,c,g:drop?160:120,s:1+(rnd()<.3?1:0)}); }
function hearts(x,y,c){ for(let i=0;i<3;i++) FX.push({heart:true,x:x*16+4+i*5,y:y*16-4-i*3,vx:(rnd()-.5)*6,vy:-14-rnd()*6,l:1.2,c:c||"#e8476a",g:0}); }
function floatItem(x,y,k){ FLT.push({x:x*16+8,y:y*16,k,l:1.3}); }

/* ================= Ton & Musik ================= */
let AC=null, master=null, musicGain=null;
function audioInit(){
  if(AC) return;
  try{ AC=new (window.AudioContext||window.webkitAudioContext)(); master=AC.createGain(); master.gain.value=2; master.connect(AC.destination); musicGain=AC.createGain(); musicGain.gain.value=S&&S.music?.05:0; musicGain.connect(master); startMusic(); }catch(e){ AC=null; }
}
function tone(f,t0,dur,type,vol,dest){ const o=AC.createOscillator(), g=AC.createGain(); o.type=type||"triangle"; o.frequency.value=f; g.gain.setValueAtTime(.0001,t0); g.gain.exponentialRampToValueAtTime(vol||.08,t0+.015); g.gain.exponentialRampToValueAtTime(.0001,t0+dur); o.connect(g).connect(dest||master); o.start(t0); o.stop(t0+dur+.02); }
function sfx(k){
  if(!AC||!S||!S.sound) return; const t=AC.currentTime;
  const seq={dig:[[140,"square",.06],[95,"square",.05]],stone:[[220,"square",.05],[160,"square",.05]],water:[[600,"sine",.05],[760,"sine",.05],[900,"sine",.04]],plant:[[520,"triangle"],[700,"triangle"]],pick:[[660,"triangle"],[990,"triangle"]],
    bark:[[520,"square",.04],[420,"square",.04]],cluck:[[880,"square",.03],[700,"square",.03]],moo:[[150,"sawtooth",.04],[130,"sawtooth",.04]],eat:[[400],[500],[650]],gift:[[523],[659],[784]],bad:[[300,"square",.05],[220,"square",.05]],
    buy:[[523],[784]],sleep:[[392],[330],[262]],fanfare:[[523],[659],[784],[1046]],quest:[[659],[784],[988],[1318]],cast:[[300,"sine"],[200,"sine"]],alert:[[1200,"square",.06],[1400,"square",.06]],bite:[[400,"square",.05]],blip:[[880,"triangle",.04]]}[k]||[[440]];
  seq.forEach((s,i)=>tone(s[0],t+i*.07,.16,s[1]||"triangle",s[2]||.08));
}
const SCALES=[[0,2,4,7,9],[0,2,4,7,9],[0,3,5,7,10],[0,2,3,7,8]];
const ROOTS=[[60,57,53,55],[62,59,55,57],[57,53,55,52],[57,52,53,55]];
let musicT=0, step=0;
function startMusic(){
  musicT=AC.currentTime+.2;
  setInterval(()=>{
    if(!AC||!S) return;
    musicGain.gain.value=S.music&&!demo?.05:(demo?.035:0);
    while(musicT<AC.currentTime+.4){
      const se=S?season():0, night=S&&(S.min>=1200||S.min<360), beat=night?.5:.36;
      const bar=Math.floor(step/8)%4, root=ROOTS[se][bar], sc=SCALES[se];
      const midi=n=>440*Math.pow(2,(n-69)/12);
      if(step%8===0) tone(midi(root-12),musicT,beat*7,"sine",.5,musicGain);
      if(step%2===0) tone(midi(root+[0,4,7,12][(step/2)%4]+(se===2||se===3?([0,3,7,12][(step/2)%4]-[0,4,7,12][(step/2)%4]):0)),musicT,beat*1.6,"triangle",.22,musicGain);
      if(!night&&A.hsh(step,se,5)%3===0) tone(midi(root+12+sc[A.hsh(step,bar,9)%5]),musicT,beat*1.8,"sine",.28,musicGain);
      if(night&&A.hsh(step,se,6)%5===0) tone(midi(root+24+sc[A.hsh(step,bar,8)%5]),musicT,beat*3,"sine",.16,musicGain);
      musicT+=beat; step++;
    }
  },150);
}

/* ================= Benutzeroberfläche ================= */
const UI={panel:false,dialog:false,fade:false};
let noteT=0;
function note(m){ const t=$("note"); t.textContent=m; t.classList.add("show"); clearTimeout(noteT); noteT=setTimeout(()=>t.classList.remove("show"),3200); }
function banner(m){ const b=$("banner"); b.textContent=m; b.classList.remove("show"); void b.offsetWidth; b.classList.add("show"); }
function fadeQuick(fn){ const f=$("quick"); f.classList.add("show"); UI.fade=true; setTimeout(()=>{ fn(); f.classList.remove("show"); setTimeout(()=>{ UI.fade=false; },250); },260); }
let hudQ=false; function hudSoon(){ if(!hudQ){ hudQ=true; requestAnimationFrame(()=>{ hudQ=false; hud(); }); } }
let hbQ=false; function hotbarSoon(){ if(!hbQ){ hbQ=true; requestAnimationFrame(()=>{ hbQ=false; hotbar(); }); } }
function hud(){
  if(!S) return;
  $("date").textContent=JM.WEEK[weekday()]+" · "+dayIn()+". "+JM.SEASONS[season()];
  const m=Math.floor(S.min/10)*10; $("time").textContent=String(Math.floor(m/60)%24).padStart(2,"0")+":"+String(m%60).padStart(2,"0");
  $("gold").textContent=S.money.toLocaleString("de-DE")+" G";
  const e=S.energy/S.maxE; $("efill").style.width=(e*100)+"%"; $("efill").style.background=e<.25?"#d9583f":e<.5?"#e8b83a":"#6fbf4a";
  $("enum").textContent=Math.round(S.energy)+"/"+S.maxE;
  drawWx();
}
function drawWx(){
  const c=$("wx"), g=A.G(c); g.ctx.clearRect(0,0,16,16);
  const night=S.min>=1140||S.min<330;
  if(S.weather==="rain"){ g.ell(8,6,6,3.5,"#9aa8b8"); g.ell(6,5,3,2.5,"#b8c4d0"); for(let i=0;i<3;i++) g.r(4+i*4,11,1,3,"#4f8fcf"); }
  else if(S.weather==="snow"){ g.ell(8,6,6,3.5,"#c9d6e2"); for(let i=0;i<3;i++) g.r(4+i*4,11,2,2,"#ffffff"); }
  else if(night){ g.disc(8,8,6,"#f3d77a"); g.disc(11,6,5,"rgba(0,0,0,0)"); g.ctx.globalCompositeOperation="destination-out"; g.disc(11,6,5,"#000"); g.ctx.globalCompositeOperation="source-over"; }
  else { g.disc(8,8,4.5,"#f6b93b"); for(let i=0;i<8;i++){ const a=i*Math.PI/4; g.r(8+Math.cos(a)*6.5-.5,8+Math.sin(a)*6.5-.5,1,1,"#f6b93b"); } }
}
function updateQuestUI(){
  if(!S) return;
  const q=curQ(); const el=$("quest");
  if(!q){ el.hidden=true; return; } el.hidden=false;
  $("qTitle").textContent=fmtD(q.t);
  let sub=q.n>1?S.quest.p+"/"+q.n:"";
  if(q.tg==="rene"&&!renePlan().map) sub=fmtD("{von} ist bei der Arbeit, ab 16:30 Uhr zu Hause");
  if(q.id==="mondfest"){ const Y=JM.DPS*4, left=((2*JM.DPS+13)-((S.day-1)%Y)+Y)%Y; if(left>0) sub="noch "+left+(left===1?" Tag":" Tage"); else if(left===0) sub="heute ab 18 Uhr"; }
  const t=questTarget(); if(t&&t.map!==M.id) sub=(sub?sub+" · ":"")+({farm:"auf dem Hof",village:"im Dorf",forest:"im Wald",haus:"im Haus",hoehle:"in der Höhle"}[t.map]||(t.map.indexOf("i_")===0?"im Laden":"in der Nähe"));
  if(S.daily&&S.daily.day===S.day&&S.daily.goals.length){ const d=S.daily.goals.filter(g=>g.p>=JM.DAILY.find(x=>x.k===g.k).n).length; sub=(sub?sub+" · ":"")+"Tagesziele "+d+"/"+S.daily.goals.length; }
  $("qProg").textContent=sub;
}
/* Werkzeugleiste */
const CAT_ORDER=["seed","crop","animal","fish","forage","dish","ingredient","place","misc"];
function hotbarKeys(){
  const keys=["auto"]; if(S.rod) keys.push("rute");
  const inv=Object.keys(S.inv).filter(k=>S.inv[k]>0&&ITEMS[k]&&k!=="amulett");
  inv.sort((a,b)=>CAT_ORDER.indexOf(ITEMS[a].cat)-CAT_ORDER.indexOf(ITEMS[b].cat)||a.localeCompare(b));
  return keys.concat(inv);
}
function hotbar(){
  if(!S) return;
  const hb=$("hotbar"); const keys=hotbarKeys();
  if(!keys.includes(S.hold)) S.hold="auto";
  hb.innerHTML="";
  for(const k of keys){
    const b=document.createElement("button"); b.className="slot"+(S.hold===k?" on":""); b.dataset.k=k;
    const ic=k==="auto"?"hand":k==="rute"?(S.rod===2?"rute2":"rute"):k;
    b.appendChild(iconCanvas(ic));
    if(k==="auto"){ const s=document.createElement("span"); s.className="cnt"; s.textContent=S.can.w; b.appendChild(s); }
    else if(k!=="rute"){ const s=document.createElement("span"); s.className="cnt"; s.textContent=S.inv[k]; b.appendChild(s); }
    b.setAttribute("aria-label",k==="auto"?"Hand":k==="rute"?"Angel":ITEMS[k].n);
    hb.appendChild(b);
  }
  const on=hb.querySelector(".on"); if(on) on.scrollIntoView({block:"nearest",inline:"nearest"});
  holdLabel();
}
function holdLabel(){
  const k=S.hold, l=$("holdlbl");
  if(k==="auto") l.textContent="Hand · gießt, gräbt, erntet · Kanne "+S.can.w+"/"+S.can.max;
  else if(k==="rute") l.textContent="Angel · tippe auf Wasser";
  else { const it=ITEMS[k]; let s=it.n; if(it.cat==="seed") s+=" · tippe auf Beete"; else if(k==="sprinkler") s+=" · tippe auf ein Feld"; else { if(it.eat) s+=" · nochmal tippen = essen"; if(it.cat!=="misc") s+=" · Person antippen = schenken"; } l.textContent=s; }
}
$("hotbar").addEventListener("click",e=>{
  const b=e.target.closest(".slot"); if(!b||paused()) return; audioInit();
  const k=b.dataset.k;
  if(S.hold===k&&ITEMS[k]&&ITEMS[k].eat){ eat(k); return; }
  S.hold=k; sfx("blip"); hotbar();
});
$("bBag").addEventListener("click",()=>{ if(paused()) return; audioInit(); openBag("bag"); });
$("bMenu").addEventListener("click",()=>{ if(paused()) return; audioInit(); openBook("quest"); });
$("quest").addEventListener("click",()=>{ if(paused()) return; openBook("quest"); });

/* Dialoge */
let DQ=[], dDone=null, typing=null;
function dialog(list,done){ DQ=list.slice(); dDone=done||null; UI.dialog=true; $("dlg").hidden=false; nextLine(); }
function nextLine(){
  const L=DQ.shift();
  if(!L){ $("dlg").hidden=true; UI.dialog=false; const d=dDone; dDone=null; if(d) d(); return; }
  if(L.fn) L.fn();
  const who=L.who, name=$("dlgN"), pc=$("dlgP"), box=$("dlg");
  box.classList.toggle("letter",who==="von");
  const pg=pc.getContext("2d"); pg.clearRect(0,0,pc.width,pc.height); pc.hidden=false;
  if(who&&NPCS[who]){ name.textContent=NPCS[who].n; pc.width=18; pc.height=15; pc.getContext("2d").drawImage(SPR.npc[who].portrait,0,0); }
  else if(who==="player"){ name.textContent=S.name; pc.width=18; pc.height=15; pc.getContext("2d").drawImage(SPR.player.portrait,0,0); }
  else if(who==="dog0"||who==="dog1"){ const i=+who.slice(3); name.textContent=dogName(i); pc.width=23; pc.height=19; pc.getContext("2d").drawImage(SPR.dogs[i].r[0],0,0); }
  else if(who==="rene"){ name.textContent=JM.CONFIG.von; pc.width=18; pc.height=15; pc.getContext("2d").drawImage(SPR.rene.portrait,0,0); }
  else if(who==="von"){ name.textContent="Ein Brief von "+JM.CONFIG.von; pc.hidden=true; }
  else { name.textContent=""; pc.hidden=true; }
  const txt=$("dlgT"), ch=$("dlgC"); ch.innerHTML=""; txt.textContent="";
  const full=L.text; let i=0;
  clearInterval(typing);
  const finish=()=>{ clearInterval(typing); typing=null; txt.textContent=full; if(L.choices){ L.choices.forEach(c=>{ const b=document.createElement("button"); b.className="btn"; b.textContent=c.t; b.onclick=ev=>{ ev.stopPropagation(); DQ=[]; const d=dDone; dDone=null; $("dlg").hidden=true; UI.dialog=false; c.fn(); }; ch.appendChild(b); }); } };
  typing=setInterval(()=>{ i+=2; txt.textContent=full.slice(0,i); if(i>=full.length) finish(); },22);
  box.onclick=()=>{ if(typing){ finish(); return; } if(L.choices) return; sfx("blip"); nextLine(); };
}

/* Panels */
const veil=$("veil"), panel=$("panel");
let PH={};
function openPanel(html,handlers){ UI.panel=true; panel.innerHTML=html; PH=handlers||{}; veil.hidden=false; panel.scrollTop=0; panel.querySelectorAll("canvas[data-ic]").forEach(c=>{ const src=shopIcon(c.dataset.ic); c.width=src.width; c.height=src.height; c.getContext("2d").drawImage(src,0,0); }); panel.querySelectorAll("canvas[data-pt]").forEach(c=>{ const id=c.dataset.pt; const src=id==="dog0"?SPR.dogs[0].r[0]:id==="dog1"?SPR.dogs[1].r[0]:id==="rene"?SPR.rene.portrait:SPR.npc[id].portrait; c.width=src.width; c.height=src.height; c.getContext("2d").drawImage(src,0,0); }); }
function closePanel(){ veil.hidden=true; UI.panel=false; hud(); hotbar(); updateQuestUI(); }
function closeAll(){ closePanel(); $("dlg").hidden=true; UI.dialog=false; DQ=[]; }
veil.addEventListener("pointerdown",e=>{ if(e.target===veil) closePanel(); });
panel.addEventListener("click",e=>{ const b=e.target.closest("[data-a]"); if(!b) return; const a=b.dataset.a; sfx("blip"); if(a==="close") return closePanel(); if(PH[a]) PH[a](b.dataset.k,b); });
const ic=(k,cls)=>`<canvas class="${cls||"ic"}" data-ic="${k}"></canvas>`;
const closeBtn=`<button class="btn alt wide" data-a="close">Schließen</button>`;
const heartRow=(n,max)=>`<span class="hearts">${"♥".repeat(n)}<i>${"♥".repeat((max||10)-n)}</i></span>`;

function openHouse(){
  const unread=S.mail.filter(m=>!m.read).length;
  openPanel(`<h2>Zuhause</h2><p class="sub">${JM.WEEKL[weekday()]}, ${dayIn()}. ${JM.SEASONS[season()]} · Jahr ${year()}</p>
  <div class="grid2">
    <button class="tile" data-a="sleep"><b>Schlafen</b><small>Tag beenden und speichern</small></button>
    <button class="tile" data-a="cook"><b>Küche</b><small>${S.recipes.length} Rezepte</small></button>
    <button class="tile" data-a="tv"><b>Fernsehen</b><small>Wetter, Kochshow, Tipps</small></button>
    <button class="tile" data-a="letter"><b>Brief auf dem Tisch</b><small>von ${esc(JM.CONFIG.von)}</small></button>
    <button class="tile" data-a="wardrobe"><b>Kleiderschrank</b><small>Frisur, Haare, Kleidung</small></button>
    <button class="tile" data-a="mailx"><b>Briefkasten</b><small>${S.mail.length} Briefe</small></button>
    <button class="tile" data-a="craft"><b>Werkbank</b><small>Sprinkler und Dünger bauen</small></button>
  </div>${unread?`<p class="hint">Im Briefkasten liegt Post für dich.</p>`:""}${closeBtn}`,
  {sleep:()=>{ openPanel(`<h2>Schlafen gehen?</h2><p>Der Tag endet und das Spiel wird gespeichert. Gegossene Pflanzen wachsen über Nacht.</p><div class="row2"><button class="btn wide" data-a="yes">Gute Nacht</button><button class="btn alt wide" data-a="no">Noch nicht</button></div>`,{yes:()=>endDay(false),no:openHouse}); },
   cook:openCook, tv:openTV, letter:()=>{ closePanel(); showLetter(); }, wardrobe:openWardrobe, mailx:openMail, craft:openCraft});
}
function showLetter(){
  dialog([{who:"von",text:fmtD("Liebe {name},\n\ndieser kleine Hof gehört jetzt uns. Pflanz, was dir schmeckt, kümmer dich um die Hühner und lass dir Zeit. {d0} und {d1} sind auch da und weichen dir nicht von der Seite.\n\nIm Dorf wohnen liebe Leute. Lin vom Nudelhaus kennt ein Rezept, das dir gefallen wird.\n\nUnd im Herbst, wenn der Mond am größten ist, feiert das ganze Dorf. Ich glaube, das wird schön.\n\nIn Liebe,\n{von}")}],()=>{ if(!S.flags.letter){ S.flags.letter=true; emit("letter"); } });
}
function openCook(){
  const rows=JM.RECIPES.map(r=>{
    const known=S.recipes.includes(r.k);
    if(!known) return `<div class="row dim"><canvas class="ic sil" data-ic="${r.k}"></canvas><div class="tx"><b>???</b><small>Lernst du von: ${esc(r.from||"?")}</small></div></div>`;
    const ok=Object.entries(r.need).every(([k,n])=>has(k,n));
    const need=Object.entries(r.need).map(([k,n])=>{ const h=k==="fisch"?JM.FISHKEYS.reduce((s,f)=>s+(S.inv[f]||0),0):(S.inv[k]||0); return `<span class="${h>=n?"ok":"no"}">${n}× ${k==="fisch"?"Fisch":ITEMS[k].n}</span>`; }).join(" ");
    return `<div class="row ${r.fav?"fav":""}">${ic(r.k)}<div class="tx"><b>${r.fav?"★ ":""}${ITEMS[r.k].n}</b><small>${need}</small><small>${ITEMS[r.k].eat>=999?"Volle Energie":"+"+ITEMS[r.k].eat+" Energie"} · Wert ${ITEMS[r.k].sell} G</small></div><button class="btn" data-a="cook" data-k="${r.k}" ${ok?"":"disabled"}>Kochen</button></div>`;
  }).join("");
  openPanel(`<h2>Küche</h2><p class="sub">Was möchtest du kochen?</p>${rows}<div class="row2"><button class="btn alt wide" data-a="back">Zurück</button>${closeBtn}</div>`,
    {back:closePanel,cook:k=>{ const r=JM.RECIPES.find(x=>x.k===k); if(!Object.entries(r.need).every(([i,n])=>has(i,n))) return; for(const [i,n] of Object.entries(r.need)) takeAny(i,n); give(k,1); sfx("cook"); emit("cook_"+k); if(r.fav&&!S.flags.favCooked){ S.flags.favCooked=true; setTimeout(()=>note("Es duftet nach Tempura. Dein Lieblingsessen ist fertig! Tippe es unten zweimal an, um es zu essen."),100); } else note(ITEMS[k].n+" ist fertig."); saveSoon(); openCook(); }});
}
function openTV(){
  openPanel(`<h2>Fernsehen</h2><div class="stack">
    <button class="tile" data-a="wx"><b>Wetterbericht</b><small>Wie wird es morgen?</small></button>
    <button class="tile" data-a="show"><b>Kochshow</b><small>Jeden Sonntag ein neues Rezept</small></button>
    <button class="tile" data-a="tip"><b>Landfunk</b><small>Tipps für deinen Hof</small></button></div>
    <div class="row2"><button class="btn alt wide" data-a="back">Zurück</button>${closeBtn}</div>`,
  {back:closePanel,
   wx:()=>{ const w=S.tomorrow, f=JM.FESTS.find(x=>x.s===season()&&x.d===dayIn()+1); closePanel(); dialog([{who:null,text:"Der Wetterbericht für morgen: "+(w==="rain"?"Regen. Gut für die Felder, du musst nicht gießen.":w==="snow"?"Schnee. Zieh dich warm an!":"Sonnig und freundlich.")+(f?" Und morgen ist "+f.n+"!":"")}]); },
   show:()=>{ closePanel(); if(weekday()===6&&!S.recipes.includes("tomatenei")){ S.recipes.push("tomatenei"); dialog([{who:null,text:"„Heute in der Kochshow: Tomaten-Ei-Pfanne! Zwei Tomaten, ein Ei, fertig ist ein Klassiker.“"},{who:null,text:"Du hast das Rezept „Tomaten-Ei-Pfanne“ gelernt!",fn:()=>sfx("fanfare")}]); } else dialog([{who:null,text:weekday()===6?"Eine Wiederholung der Kochshow. Das Rezept kennst du schon.":"Die Kochshow läuft nur sonntags."}]); },
   tip:()=>{ closePanel(); dialog([{who:null,text:"Landfunk: "+JM.TIPS[(S.day*7)%JM.TIPS.length]}]); }});
}
function openBag(mode){
  const keys=Object.keys(S.inv).filter(k=>S.inv[k]>0);
  let sel=null;
  const render=()=>{
    const cells=keys.filter(k=>S.inv[k]>0).map(k=>`<button class="cell ${sel===k?"sel":""}" data-a="sel" data-k="${k}">${ic(k)}<span>${S.inv[k]}</span></button>`).join("");
    let det="";
    if(sel&&S.inv[sel]){
      const it=ITEMS[sel]; const btns=[];
      if(mode==="ship"&&JM.SHIPPABLE(sel)){ btns.push(`<button class="btn" data-a="ship1" data-k="${sel}">1 einlegen</button>`); btns.push(`<button class="btn" data-a="shipall1" data-k="${sel}">Alle ${S.inv[sel]} einlegen</button>`); }
      if(mode==="bag"&&it.eat) btns.push(`<button class="btn" data-a="eat" data-k="${sel}">Essen (${it.eat>=999?"volle":"+"+it.eat} Energie)</button>`);
      if(mode==="bag") btns.push(`<button class="btn alt" data-a="hold" data-k="${sel}">In die Hand nehmen</button>`);
      det=`<div class="row">${ic(sel)}<div class="tx"><b>${esc(it.n)}</b><small>${it.sell?"Wert "+it.sell+" G":it.cat==="seed"?"Wächst im "+CROPS[it.crop].se.map(s=>JM.SEASONS[s]).join(", ")+" · "+CROPS[it.crop].days+" Tage":""}</small></div></div><div class="btns">${btns.join("")}</div>`;
    }
    let head="";
    if(mode==="ship"){ let v=0; for(const k in S.ship) v+=(ITEMS[k].sell||0)*S.ship[k]; head=`<p class="sub">In der Kiste: <b>${v} G</b>. Ausgezahlt wird am nächsten Morgen.</p><button class="btn wide" data-a="shipall">Alle Ernte, Eier, Fische und Funde einlegen</button>`; }
    else head=`<p class="sub">${S.money.toLocaleString("de-DE")} G · Gießkanne ${S.can.w}/${S.can.max}${S.rod?" · "+(S.rod===2?"Goldene Angel":"Angel"):""}</p>`;
    openPanel(`<h2>${mode==="ship"?"Versandkiste":"Rucksack"}</h2>${head}${keys.length?`<div class="grid">${cells}</div>`:`<p>Noch leer.</p>`}${det}${closeBtn}`,
    {sel:k=>{ sel=k; render(); }, eat:k=>{ eat(k); render(); }, hold:k=>{ S.hold=k; closePanel(); },
     ship1:k=>{ take(k,1); S.ship[k]=(S.ship[k]||0)+1; sfx("pick"); emit("ship"); if(!S.inv[k]) sel=null; render(); saveSoon(); },
     shipall1:k=>{ const n=S.inv[k]; take(k,n); S.ship[k]=(S.ship[k]||0)+n; sfx("pick"); emit("ship"); sel=null; render(); saveSoon(); },
     shipall:()=>{ let n=0; const keep=questKeep(), kept=[]; for(const k of Object.keys(S.inv)){ const c=ITEMS[k].cat; if(JM.SHIPPABLE(k)&&c!=="dish"){ const m=Math.max(0,S.inv[k]-(keep[k]||0)); if(keep[k]&&S.inv[k]>0) kept.push(ITEMS[k].n); if(!m) continue; n+=m; S.ship[k]=(S.ship[k]||0)+m; take(k,m); } } if(n){ sfx("pick"); emit("ship"); note(n+" Sachen eingelegt."+(kept.length?" Behalten für deine Aufgabe: "+kept.join(", ")+".":"")); } else note(kept.length?"Alles Übrige brauchst du für deine Aufgabe.":"Nichts zum Einlegen. Gerichte legst du einzeln ein."); sel=null; render(); saveSoon(); }});
  };
  render();
}
function openShop(id){
  const SH=JM.SHOPS[id], nid=SH.npc, N=NPCS[nid], st=npcPlace(nid);
  if(st!=="in"){
    const sch=N.sched; const i=sch.findIndex(s=>s[1]==="in"); const from=sch[i][0], to=sch[i+1]?sch[i+1][0]:1260;
    const fd=(N.free||[]).map(d=>JM.WEEKL[d]);
    note(SH.n+" ist gerade zu. Geöffnet "+Math.floor(from/60)+"–"+Math.floor(to/60)+" Uhr"+(fd.length?", außer "+fd.join(" und "):"")+(S.weather==="rain"?"":"")+".");
    if(Array.isArray(st)&&M.id==="village") note(SH.n+" ist gerade zu. "+N.n+" ist draußen unterwegs.");
    return;
  }
  if(!S.npc[nid].met){ npcInteract(nid); return; }
  const se=season();
  const rows=SH.stock.filter(s=>(!s.need||S.flags[s.need])&&(!s.winter||se===3)).map(s=>{
    const it=ITEMS[s.k], crop=it&&it.cat==="seed"?CROPS[it.crop]:null;
    const off=crop&&!crop.se.includes(se);
    const done=s.once&&S.bought[s.k];
    const full=(s.k==="tier_huhn"&&S.hens.length>=6)||(s.k==="tier_kuh"&&S.cows.length>=2);
    const desc=done?"Schon gekauft":full?"Kein Platz mehr":off?"Gibt es erst im "+crop.se.map(x=>JM.SEASONS[x]).join("/"):(s.d||(crop?crop.days+" Tage bis zur Ernte"+(crop.re?", danach alle "+crop.re+" Tage":"")+" · Ernte "+ITEMS[it.crop].sell+" G":""));
    const can=!done&&!full&&!off&&S.money>=s.p;
    const multi=crop||s.winter||s.k==="futter"||s.k==="huhn"||s.k==="tee"||s.k==="rolle";
    return `<div class="row ${off||done?"dim":""}">${ic(s.k)}<div class="tx"><b>${esc(itemName(s.k))}</b><small>${esc(desc)}</small></div><div class="price">${s.p} G</div><div class="btns v"><button class="btn" data-a="buy" data-k="${s.k}" data-n="1" ${can?"":"disabled"}>${multi?"1×":"Kaufen"}</button>${multi?`<button class="btn" data-a="buy" data-k="${s.k}" data-n="5" ${!off&&S.money>=s.p*5?"":"disabled"}>5×</button>`:""}</div></div>`;
  }).join("");
  const giftable=ITEMS[S.hold]&&ITEMS[S.hold].cat!=="seed"&&S.hold!=="futter"&&S.hold!=="sprinkler";
  openPanel(`<div class="shophead"><canvas class="pt" data-pt="${nid}"></canvas><div><h2>${esc(SH.n)}</h2><p class="sub">${esc(N.n)} · ${heartRow(hearts10(nid))}</p></div></div>
    <div class="row2"><button class="btn alt wide" data-a="talk">Reden</button><button class="btn alt wide" data-a="gift" ${giftable&&S.npc[nid].gift!==S.day?"":"disabled"}>${giftable?"Schenken: "+esc(ITEMS[S.hold].n):"Geschenk: erst unten wählen"}</button></div>
    <p class="sub">Du hast ${S.money.toLocaleString("de-DE")} G</p>${rows}${closeBtn}`,
  {talk:()=>{ closePanel(); talk(nid); }, gift:()=>{ closePanel(); giveGift(nid,S.hold); },
   buy:(k,b)=>{ const n=+b.dataset.n, s=SH.stock.find(x=>x.k===k), c=s.p*n; if(S.money<c) return; S.money-=c; sfx("buy");
     if(k==="kanne2"){ S.bought[k]=true; S.can.max=40; S.can.w=40; note("Die große Gießkanne gehört jetzt dir."); }
     else if(k==="rute2"){ S.bought[k]=true; S.rod=2; note("Die goldene Angel gehört jetzt dir."); }
     else if(k==="gewaechshaus"){ S.bought[k]=true; S.flags.glas=true; groundKey=""; note("Das Gewächshaus auf deinem Hof wird repariert. Dort wächst jetzt alles, das ganze Jahr."); }
     else if(k==="tier_huhn"){ const names=["Pünktchen","Erna","Flocke","Berta","Krümel","Lotti"]; const nm=names.find(x=>!S.hens.some(h=>h.n===x))||"Huhn"; S.hens.push({n:nm,c:S.hens.length%2,h:0,pet:0}); note(nm+" zieht in deinen Hühnerstall ein!"); emit("buyanimal"); }
     else if(k==="tier_kuh"){ const nm=["Lotte","Milka"].find(x=>!S.cows.some(c=>c.n===x))||"Kuh"; S.cows.push({n:nm,c:S.cows.length%2,h:0,pet:0,milk:false}); note(nm+" zieht in deinen Stall ein! Füll den Futtertrog auf der Weide."); emit("buyanimal"); }
     else { give(k,n); note(n+"× "+ITEMS[k].n+" gekauft."); }
     hud(); saveSoon(); openShop(id); }});
}
function openMail(){
  const list=S.mail.slice().reverse();
  openPanel(`<h2>Briefkasten</h2>${list.length?list.map((m,i)=>`<button class="row mail ${m.read?"":"new"}" data-a="read" data-k="${S.mail.length-1-i}"><div class="tx"><b>${esc(m.t)}</b><small>von ${esc(m.from==="von"?JM.CONFIG.von:NPCS[m.from]?NPCS[m.from].n:m.from)}</small></div></button>`).join(""):"<p>Keine Post.</p>"}${closeBtn}`,
  {read:k=>{ const m=S.mail[+k]; m.read=true; if(m.recipe&&!S.recipes.includes(m.recipe)){ S.recipes.push(m.recipe); setTimeout(()=>note("Neues Rezept gelernt: "+ITEMS[m.recipe].n),400); } closePanel(); dialog([{who:m.from==="von"?"von":null,text:m.b}],openMail); saveSoon(); }});
}
function openCraft(){
  const rows=JM.CRAFT.map(r=>{ const ok=Object.entries(r.need).every(([k,n])=>has(k,n)); const need=Object.entries(r.need).map(([k,n])=>`<span class="${(S.inv[k]||0)>=n?"ok":"no"}">${n}× ${ITEMS[k].n} (${S.inv[k]||0})</span>`).join(" ");
    return `<div class="row">${ic(r.k)}<div class="tx"><b>${r.n>1?r.n+"× ":""}${esc(ITEMS[r.k].n)}</b><small>${esc(r.d)}</small><small>${need}</small></div><button class="btn" data-a="make" data-k="${r.k}" ${ok?"":"disabled"}>Bauen</button></div>`; }).join("");
  openPanel(`<h2>Werkbank</h2><p class="sub">Kupfer und Steine findest du in der Mondhöhle hinten im Wald.</p>${rows}<div class="row2"><button class="btn alt wide" data-a="back">Zurück</button>${closeBtn}</div>`,
  {back:closePanel,make:k=>{ const r=JM.CRAFT.find(x=>x.k===k); if(!Object.entries(r.need).every(([i,n])=>has(i,n))) return; for(const [i,n] of Object.entries(r.need)) take(i,n); give(k,r.n); sfx("fanfare"); emit("craft"); note(r.n+"× "+ITEMS[k].n+" gebaut."); saveSoon(); openCraft(); }});
}
function openWardrobe(){
  const W=JM.WARDROBE, cur=Object.assign({hair:JM.PLAYER_LOOK.hair,style:JM.PLAYER_LOOK.style,top:JM.PLAYER_LOOK.top,outfit:"ov:"+JM.PLAYER_LOOK.bot,skin:JM.PLAYER_LOOK.skin},S.look||{});
  const grp=(k,label,colors)=>`<h3>${label}</h3><div class="chips">${W[k].map(([n,v])=>`<button class="chip ${cur[k]===v?"ok":""}" data-a="set" data-k="${k}|${v}">${colors?`<i class="sw" style="background:${v.split(":").pop()}"></i>`:""}<span>${esc(n)}</span></button>`).join("")}</div>`;
  openPanel(`<h2>Kleiderschrank</h2><div class="shophead"><canvas class="pt big" id="wpv"></canvas><p class="sub">Ändere dein Aussehen, so oft du willst.</p></div>
    <h3>${esc(JM.CONFIG.von)}</h3><div class="chips">${JM.RENE_WARDROBE.hair.map(([n,v])=>`<button class="chip ${(S.reneLook.hair||JM.RENE_LOOK.hair)===v?"ok":""}" data-a="rset" data-k="hair|${v}"><i class="sw" style="background:${v}"></i><span>Haare ${esc(n)}</span></button>`).join("")}</div>
    <div class="chips">${JM.RENE_WARDROBE.top.map(([n,v])=>`<button class="chip ${(S.reneLook.top||JM.RENE_LOOK.top)===v?"ok":""}" data-a="rset" data-k="top|${v}"><i class="sw" style="background:${v}"></i><span>${esc(n)}</span></button>`).join("")}${JM.RENE_WARDROBE.beard.map(([n,v])=>`<button class="chip ${(S.reneLook.beard||"1")===v?"ok":""}" data-a="rset" data-k="beard|${v}"><span>${esc(n)}</span></button>`).join("")}</div>
    <h3>Du</h3>
    ${grp("hair","Haarfarbe",true)}${grp("style","Frisur",false)}${grp("top","Oberteil",true)}${grp("outfit","Kleidung",true)}${grp("skin","Hautton",true)}
    <div class="row2"><button class="btn alt wide" data-a="back">Zurück</button>${closeBtn}</div>`,
  {back:closePanel,rset:k=>{ const [a,v]=k.split("|"); S.reneLook=Object.assign({},S.reneLook||{},{[a]:v}); lookSprites(); sfx("blip"); saveSoon(); openWardrobe(); },set:k=>{ const [a,v]=k.split("|"); S.look=Object.assign({},S.look||{}, {[a]:v}); lookSprites(); sfx("blip"); saveSoon(); openWardrobe(); }});
  const c=$("wpv"), src=SPR.player.down[0]; c.width=src.width; c.height=src.height; c.getContext("2d").drawImage(src,0,0);
}
function marketDay(){ return weekday()===5&&S.min>=540&&S.min<900&&!festToday(); }
function openStall(){
  if(!marketDay()){ note("Dein Marktstand. Samstags von 9 bis 15 Uhr ist Markttag, dann kannst du hier teurer verkaufen."); return; }
  const mk=S.market||(S.market={day:S.day,buzz:0,sold:0,earned:0});
  const bonus=()=>1.2+Math.min(.5,mk.buzz*.05);
  const keys=Object.keys(S.inv).filter(k=>S.inv[k]>0&&JM.SHIPPABLE(k));
  const rows=keys.map(k=>`<div class="row">${ic(k)}<div class="tx"><b>${esc(ITEMS[k].n)}</b><small>${S.inv[k]} Stück · ${Math.round(ITEMS[k].sell*bonus())} G pro Stück</small></div><button class="btn" data-a="sell" data-k="${k}">Verkaufen</button></div>`).join("");
  openPanel(`<h2>Markttag</h2><p class="sub">Andrang: ${"★".repeat(Math.min(10,mk.buzz))}${"☆".repeat(Math.max(0,10-mk.buzz))} · Preis +${Math.round((bonus()-1)*100)} %</p>
    <p class="sub">Heute verkauft: ${mk.sold} · ${mk.earned.toLocaleString("de-DE")} G</p>${rows||"<p>Du hast nichts zum Verkaufen dabei.</p>"}${closeBtn}`,
  {sell:k=>{ if(!S.inv[k]) return; const g=Math.round(ITEMS[k].sell*bonus()); take(k,1); S.money+=g; S.stats.earned+=g; S.shipLog[k]=(S.shipLog[k]||0)+1; mk.sold++; mk.earned+=g; emit("ship"); if(mk.sold%2===0) mk.buzz++; sfx("buy");
    if(rnd()<.25){ const who=pick(JM.NPC_ORDER.filter(id=>S.npc[id].met)); if(who){ addPts(who,15); note(NPCS[who].n+" kauft bei dir ein und freut sich."); } }
    hud(); saveSoon(); openStall(); }});
}
function openBoard(){
  const B=S.board;
  if(!B){ note("Die Anschlagtafel ist leer. Lerne zuerst die Leute im Dorf kennen."); return; }
  const N=NPCS[B.who];
  openPanel(`<h2>Anschlagtafel</h2><p class="sub">Ein Wunsch für heute</p>
    <div class="row">${ic(B.k)}<div class="tx"><b>${esc(N.n)} sucht ${B.n}× ${esc(ITEMS[B.k].n)}</b><small>So bekommst du es: ${esc(srcHint(B.k))}</small><small>Belohnung: ${B.rew} G und Freundschaft · Du hast: ${S.inv[B.k]||0}</small></div></div>
    ${B.done?`<p class="hint">Erledigt! Danke dir.</p>`:`<button class="btn wide" data-a="give" ${has(B.k,B.n)?"":"disabled"}>Abgeben</button>`}${closeBtn}`,
  {give:()=>{ if(!has(B.k,B.n)) return; take(B.k,B.n); B.done=true; S.money+=B.rew; emit("board"); addPts(B.who,60); sfx("fanfare"); note(N.n+" bedankt sich. +"+B.rew+" G"); saveSoon(); openBoard(); }});
}
function openBundles(){
  const rows=JM.BUNDLES.map(B=>{
    const got=S.bundles[B.id]||{}, done=S.bundleDone[B.id];
    const items=Object.entries(B.need).map(([k,n])=>{ const g=got[k]||0, ok=g>=n; return `<button class="chip ${ok?"ok":""}" data-a="give" data-k="${B.id}:${k}" ${ok||!S.inv[k]?"disabled":""}>${ic(k,"ic s")}<span>${g}/${n}</span></button>`; }).join("");
    return `<div class="bundle ${done?"done":""}"><b>${B.n}</b>${done?`<small>Erfüllt · ${esc(B.rew)}</small>`:`<small>Belohnung: ${esc(B.rew)}</small><div class="chips">${items}</div>`}</div>`;
  }).join("");
  openPanel(`<h2>Der Mondbaum</h2><p class="sub">Tippe auf eine Zutat, um sie abzulegen.</p>${rows}${closeBtn}`,{give:k=>{ const [b,i]=k.split(":"); bundleDeliver(b,i); }});
}
function openBook(tab){
  const tabs=[["quest","Aufgaben"],["map","Karte"],["cal","Kalender"],["friends","Freunde"],["coll","Sammlung"],["ach","Erfolge"],["opt","Optionen"]];
  let body="";
  if(tab==="quest"){
    const q=curQ();
    body=q?`<div class="qcard"><small>Aktuelle Aufgabe</small><b>${esc(fmtD(q.t))}</b><p>${esc(fmtD(q.d))}</p>${q.n>1?`<div class="pbar"><i style="width:${S.quest.p/q.n*100}%"></i></div><small>${S.quest.p} von ${q.n}</small>`:""}</div>`:"";
    if(S.daily&&S.daily.day===S.day) body+=`<h3>Tagesziele</h3>`+S.daily.goals.map(g=>{ const D=JM.DAILY.find(d=>d.k===g.k), ok=g.p>=D.n; return `<div class="row"><div class="tx"><b>${ok?"✓ ":""}${esc(fmtD(D.t))}</b><small>${Math.min(g.p,D.n)} von ${D.n} · Belohnung ${D.g} G</small></div></div>`; }).join("")+`<p class="sub">Alle drei geschafft: +100 G extra. Jeden Morgen gibt es neue.</p>`;
    if(S.board&&!S.board.done) body+=`<div class="row">${ic(S.board.k)}<div class="tx"><b>Anschlagtafel: ${esc(NPCS[S.board.who].n)}</b><small>sucht ${S.board.n}× ${esc(ITEMS[S.board.k].n)} · ${S.board.rew} G</small></div></div>`;
    body+=`<h3>Geschafft</h3>`+(S.qDone.length?S.qDone.slice().reverse().map(id=>`<div class="done">✓ ${esc(fmtD((JM.QUESTS.find(q=>q.id===id)||{t:id}).t))}</div>`).join(""):"<p class='sub'>Noch nichts. Leg los!</p>");
  }
  if(tab==="map"){
    const places=[["farm","Dein Hof","Haus, Felder, Tiere",5,8],["village","Das Dorf","Läden, Bewohner, Dorfplatz",14,13],["forest","Der Mondwald","Mondbaum, Fluss, See, Fundstücke",13,15]].concat(S.flags.caveSeen?[["hoehle","Die Mondhöhle","Kupfer und Edelsteine",10,14]]:[]);
    body=`<p class="sub">Mit der Kutsche bist du schnell überall. Die Fahrt dauert 30 Minuten.</p>`+places.map(([id,n,d])=>`<button class="tile" data-a="go" data-k="${id}" ${M.id===id?"disabled":""} style="width:100%;margin-bottom:8px"><b>${n}${M.id===id?" · du bist hier":""}</b><small>${d}</small></button>`).join("")+(S.flags.caveSeen?"":`<p class="sub">Eine Höhle soll es hinten im Wald geben. Erst wenn du sie gefunden hast, fährt die Kutsche dorthin.</p>`);
    PH_GO=places;
  }
  if(tab==="ach"){ const got=S.ach||[]; body=`<p class="sub">${got.length} von ${JM.ACH.length} Erfolgen</p>`+JM.ACH.map(a=>`<div class="row ${got.includes(a.id)?"":"dim"}"><div class="tx"><b>${got.includes(a.id)?"★ ":"☆ "}${esc(fmtD(a.t))}</b><small>${esc(fmtD(a.d))}</small></div></div>`).join(""); }
  if(tab==="cal"){
    const se=season(); let cells="";
    for(let d=1;d<=JM.DPS;d++){
      const f=JM.FESTS.find(x=>x.s===se&&x.d===d); const b=JM.NPC_ORDER.find(id=>NPCS[id].bday[0]===se&&NPCS[id].bday[1]===d);
      const wd=JM.WEEK[(d-1+(S.day-dayIn()))%7];
      cells+=`<div class="day ${d===dayIn()?"today":""} ${d<dayIn()?"past":""}"><span>${d}</span><small>${wd}</small>${wd==="Sa"&&!f?`<em class="mk">Markt</em>`:""}${f?`<em class="fest">${esc(f.n)}</em>`:""}${b?`<em class="bd">${esc(NPCS[b].n)}</em>`:""}</div>`;
    }
    body=`<h3>${JM.SEASONS[se]} · Jahr ${year()}</h3><div class="cal">${cells}</div><p class="sub">Feste beginnen auf dem Dorfplatz. An Geburtstagen zählen Geschenke dreifach.</p>`;
  }
  if(tab==="friends"){
    body=`<div class="row"><canvas class="pt" data-pt="dog0"></canvas><div class="tx"><b>${esc(dogName(0))}</b>${heartRow(S.dogH[0])}<small>${S.dogPet[0]===S.day?"Heute gestreichelt":"Noch nicht gestreichelt"}</small></div></div>
      <div class="row"><canvas class="pt" data-pt="dog1"></canvas><div class="tx"><b>${esc(dogName(1))}</b>${heartRow(S.dogH[1])}<small>${S.dogPet[1]===S.day?"Heute gestreichelt":"Noch nicht gestreichelt"}</small></div></div>`;
    body+=`<div class="row"><canvas class="pt" data-pt="rene"></canvas><div class="tx"><b>${esc(JM.CONFIG.von)} <small>· dein Mann</small></b>${heartRow(10)}<small>${S.rene.cuddles||0} mal gekuschelt · ${S.stats.tidy||0} Sachen weggeräumt</small></div></div>`;
    body+=JM.NPC_ORDER.map(id=>{ const N=NPCS[id], st=S.npc[id]; if(!st.met) return `<div class="row dim"><div class="tx"><b>???</b><small>Noch nicht kennengelernt</small></div></div>`;
      return `<div class="row"><canvas class="pt" data-pt="${id}"></canvas><div class="tx"><b>${esc(N.n)} <small>· ${esc(N.role)}</small></b>${heartRow(hearts10(id))}<small>${st.talk===S.day?"Heute geredet":"Noch nicht geredet"} · ${st.gift===S.day?"Geschenk ✓":"Kein Geschenk"} · Geburtstag ${N.bday[1]}. ${JM.SEASONS[N.bday[0]]}</small>${hearts10(id)>=2?`<small>Liebt: ${N.love.map(k=>esc(ITEMS[k].n)).join(", ")}</small>`:""}</div></div>`; }).join("");
    body+=`<h3>Tiere</h3>`+S.hens.map(h=>`<div class="row"><div class="tx"><b>${esc(h.n)} <small>· Huhn</small></b>${heartRow(h.h)}</div></div>`).join("")+S.cows.map(c=>`<div class="row"><div class="tx"><b>${esc(c.n)} <small>· Kuh</small></b>${heartRow(c.h)}</div></div>`).join("");
  }
  if(tab==="coll"){
    const all=Object.keys(ITEMS).filter(k=>JM.SHIPPABLE(k)&&ITEMS[k].cat!=="dish");
    const got=all.filter(k=>S.shipLog[k]||S.fishLog[k]);
    body=`<p class="sub">${got.length} von ${all.length} Dingen verkauft oder gefangen</p><div class="grid">${all.map(k=>`<div class="cell ${S.shipLog[k]||S.fishLog[k]?"":"sil"}">${ic(k)}<span>${S.shipLog[k]||S.fishLog[k]||""}</span></div>`).join("")}</div>
      <h3>Gekocht</h3><p class="sub">${JM.RECIPES.filter(r=>S.cookLog[r.k]).map(r=>esc(ITEMS[r.k].n)).join(", ")||"Noch nichts"}</p>
      <h3>Mondbaum</h3><p class="sub">${Object.keys(S.bundleDone).length} von ${JM.BUNDLES.length} Gaben erfüllt</p>
      <p class="sub">Verdient insgesamt: ${S.stats.earned.toLocaleString("de-DE")} G</p>`;
  }
  if(tab==="opt"){
    body=`<div class="row"><div class="tx"><b>Geräusche</b></div><button class="btn alt" data-a="snd">${S.sound?"An":"Aus"}</button></div>
      <div class="row"><div class="tx"><b>Musik</b></div><button class="btn alt" data-a="mus">${S.music?"An":"Aus"}</button></div>
      <div class="row"><div class="tx"><b>Grafik</b><span>3D wie Home Sweet Home oder klassische Pixel-Grafik</span></div><button class="btn alt" data-a="gfx">${S.gfx==="2d"?"Pixel":"3D"}</button></div>
      <div class="row"><div class="tx"><b>Version</b><small>${window.JMVER||"Vorschau"}</small></div></div>
      <div class="row"><div class="tx"><b>Ansicht</b><small>Oder mit zwei Fingern oder den Knöpfen + und − zoomen</small></div><div class="btns">${[["Nah",1.25],["Normal",1],["Weit",.75],["Übersicht",.5]].map(([n,z])=>`<button class="btn ${(S.zoom||1)===z?"":"alt"}" data-a="zoom" data-k="${z}">${n}</button>`).join("")}</div></div>
      <div class="row" id="photoRow" hidden><div class="tx"><b>Foto vom Hof</b><small>Speichert ein Bild von diesem Moment</small></div><button class="btn alt" data-a="photo">Foto</button></div>
      <div class="row"><div class="tx"><b>Gespeichert</b><small>Automatisch, und immer beim Schlafen</small></div></div>
      <div class="row"><div class="tx"><b>Neuer Hof</b><small>Beginnt von vorn. Der jetzige Hof geht verloren.</small></div><button class="btn danger" data-a="reset">Neu</button></div>
      <p class="sub center">Janinas Moon · Für ${esc(S.name)}, von ${esc(JM.CONFIG.von)}</p>`;
  }
  const nav=tabs.map(([k,l])=>`<button class="tab ${k===tab?"on":""}" data-a="tab" data-k="${k}">${l}</button>`).join("");
  openPanel(`<h2>Tagebuch</h2><div class="tabs">${nav}</div>${body}${closeBtn}`,
  {tab:k=>openBook(k), zoom:k=>{ S.zoom=+k; ZOOM=S.zoom; resize(); saveSoon(); openBook("opt"); }, go:k=>{ const pl=PH_GO.find(p=>p[0]===k); closePanel(); S.min=Math.min(1430,S.min+30); fadeQuick(()=>{ setMap(k,pl[3],pl[4]); banner(pl[1]); updateQuestUI(); saveSoon(); }); }, snd:()=>{ S.sound=!S.sound; saveSoon(); openBook("opt"); }, mus:()=>{ S.music=!S.music; saveSoon(); openBook("opt"); }, gfx:()=>{ S.gfx=S.gfx==="2d"?"3d":"2d"; camSnap=true; saveSoon(); openBook("opt"); },
   photo:takePhoto,
   reset:(k,b)=>{ if(b.dataset.armed){ try{ localStorage.removeItem(SAVE_KEY); }catch(e){} if(dbRef) dbRef.set({json:"",t:0}).catch(()=>{}); location.reload(); return; } b.dataset.armed="1"; b.textContent="Sicher? Nochmal tippen"; }});
  if(tab==="opt") downloadsReady.then(d=>{ const r=$("photoRow"); if(d&&r) r.hidden=false; });
}
let downloadsReady=Promise.resolve(null), PH_GO=[];
async function takePhoto(){
  const d=await downloadsReady; if(!d) return;
  const W=buf.width*4, H=buf.height*4, c=A.cnv(W,H+120), x=c.getContext("2d"); x.imageSmoothingEnabled=false;
  x.fillStyle="#f6ecd4"; x.fillRect(0,0,W,H+120); x.drawImage(buf,0,0,W,H);
  x.fillStyle="#3b2a1f"; x.font="700 44px 'Pixelify Sans', monospace"; x.textAlign="center"; x.fillText("Janinas Moon",W/2,H+58); x.font="28px 'Nunito', sans-serif"; x.fillText(dayIn()+". "+JM.SEASONS[season()]+", Jahr "+year(),W/2,H+98);
  c.toBlob(async b=>{ try{ await d.save({filename:"janinas-moon-"+JM.SEASONS[season()].toLowerCase()+"-"+dayIn()+".png",data:b}); note("Foto gespeichert."); }catch(e){ if(e&&e.code!=="declined") note("Das Foto konnte nicht gespeichert werden."); } },"image/png");
}

/* ================= Spielschleife ================= */
let last=performance.now(), gameT=0, saveTick=0, TESTSPEED=1, FDT=.016, camSnap=true, CRIT=[], birdT=4;
const cam={x:0,y:0};
function loop(now){
  const dt=Math.min(.05,(now-last)/1000); last=now; gameT+=dt; FDT=dt;
  if(running){ for(let k=0;k<TESTSPEED;k++){ if(!paused()||(demo&&!UI.panel)) update(dt); else if(FISH.phase==="reel") fishUpdate(dt); } ambient(dt); if(!demo) starTick(dt); render(); }
  requestAnimationFrame(loop);
}
function update(dt){
  if(!demo){
    S.min+=dt/0.6;
    if(S.min>=1440){ endDay(true); return; }
    if(Math.floor(S.min)%10===0) hudSoon();
    saveTick+=dt; if(saveTick>30){ saveTick=0; save(); }
    if(groundKey!==M.id+":"+season()+":"+(S.flags.glas?1:0)) buildGround();
  } else { S.min=1290; }
  // Spielerin
  P.moving=false; if(P.busy>0) P.busy-=dt;
  if(P.path.length&&P.busy<=0){
    const [nx,ny]=P.path[0], dx=nx-P.x, dy=ny-P.y, d=Math.hypot(dx,dy), sp=4.6*dt;
    if(Math.abs(dx)>Math.abs(dy)){ P.dir=2; P.flip=dx<0; } else if(Math.abs(dy)>.01) P.dir=dy<0?1:0;
    if(d<=sp){ P.x=nx; P.y=ny; P.path.shift(); if(!P.path.length) finishMove(); } else { P.x+=dx/d*sp; P.y+=dy/d*sp; }
    P.moving=true;
  } else if(!P.path.length&&!P.act&&P.busy<=0&&P.queue.length){
    const [qx,qy]=P.queue.shift();
    const pl=fieldPlan(qx,qy);
    if(!pl.msg){ const here=Math.round(P.x)===qx&&Math.round(P.y)===qy; if(here) doField(qx,qy); else goTo(adjGoal(qx,qy,true),()=>doField(qx,qy),{x:qx,y:qy}); }
    else if(!P.queue.length) note(pl.msg);
  }
  if(P.moving){ P.ft+=dt; if(P.ft>.12){ P.ft=0; P.frame=(P.frame+1)%4; const tt=M.t[Math.round(P.y)]&&M.t[Math.round(P.y)][Math.round(P.x)]; if((P.frame===1||P.frame===3)&&(tt===T.WEG||tt===T.SAND||tt===T.HBODEN)) for(let i=0;i<2;i++) FX.push({x:P.x*16+8+(rnd()-.5)*6,y:P.y*16+15,vx:(rnd()-.5)*12,vy:-6-rnd()*6,l:.35,c:tt===T.HBODEN?"#9a8a78":"#e2cf9e",g:20,s:1}); } } else P.frame=0;
  ambientLife(dt);
  if(P.busy<=0) P.tool=null;
  // Pudel
  const night=S.min>=1260;
  const lt=TRAIL[TRAIL.length-1];
  if(!lt||Math.hypot(lt.x-P.x,lt.y-P.y)>=.25){ TRAIL.push({x:P.x,y:P.y}); if(TRAIL.length>40) TRAIL.shift(); }
  for(const d of DOGS){
    if(d.trick>0) d.trick-=dt;
    if(S.follow){
      const back=(d.i+1)*4+1, tp=TRAIL.length>back?TRAIL[TRAIL.length-1-back]:{x:P.x+(d.i?.8:-.8),y:P.y+.4};
      const dx=tp.x-d.x, dy=tp.y-d.y, dist=Math.hypot(dx,dy);
      if(Math.hypot(P.x-d.x,P.y-d.y)>9){ d.x=tp.x; d.y=tp.y; }
      if(dist>.08){ const sp=Math.min(dist,Math.max(1.2,dist*3.2)*dt); d.x+=dx/dist*sp; d.y+=dy/dist*sp; if(Math.abs(dx)>.04) d.face=dx<0?-1:1; d.moving=true; d.idle=0; d.ft+=dt; if(d.ft>.12){ d.ft=0; d.frame=(d.frame+1)%4; } }
      else { d.moving=false; d.idle+=dt; d.frame=0; }
    } else {
      d.timer-=dt;
      const sleepy=night||S.weather==="rain";
      if(d.timer<=0){ d.timer=2+rnd()*4; if(sleepy){ d.tx=2.3+d.i*1.4; d.ty=9; } else { for(let k=0;k<8;k++){ const tx=2+Math.floor(rnd()*9), ty=7+Math.floor(rnd()*3); if(walkT(tx,ty)){ d.tx=tx; d.ty=ty; break; } } } }
      moveA(d,d.tx,d.ty,1.3,dt,.14);
      d.idle=d.moving?0:d.idle+dt;
    }
  }
  for(const h of HENS){ h.timer-=dt; if(h.peck>0) h.peck-=dt;
    const box=h.deco?M.pen:M.coop; if(!box) continue;
    if(h.timer<=0){ h.timer=1+rnd()*3; if(rnd()<.35){ h.peck=.8; h.tx=h.x; h.ty=h.y; } else { h.tx=box.x0+rnd()*(box.x1-box.x0); h.ty=(h.deco?box.y0:box.y0+1)+rnd()*(box.y1-box.y0-(h.deco?0:1)); } }
    moveA(h,h.tx,h.ty,.9,dt,.15); }
  for(const c of COWS){ c.timer-=dt; const box=M.pasture; if(c.timer<=0){ c.timer=2+rnd()*4; c.tx=box.x0+rnd()*(box.x1-box.x0); c.ty=box.y0+1+rnd()*(box.y1-box.y0-1); } moveA(c,c.tx,c.ty,.6,dt,.25); }
  npcUpdate(dt); reneUpdate(dt);
  fishUpdate(dt);
  for(const p of FX){ p.l-=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=p.g*dt; } FX=FX.filter(p=>p.l>0);
  for(const f of FLT){ f.l-=dt; f.y-=18*dt; } FLT=FLT.filter(f=>f.l>0);
  for(const k in FESTFX) if(FESTFX[k]>0) FESTFX[k]-=dt*(UI.dialog?0:1);
  if(Math.floor(gameT*2)!==Math.floor((gameT-dt)*2)){ recheckQuest(); updateQuestUI(); }
}
const RA={x:2,y:4,dir:0,flip:false,frame:0,ft:0,path:[],vis:false,map:null,moving:false,cuddle:false,timer:0,goal:null};
function renePlan(){
  if(!S) return {map:null};
  const f=festActive(); if(f&&f.id==="mond") return {map:"village",pos:[16,14],mode:"fest"};
  const we=weekday()>=5, m=S.min;
  const sch=we?[[420,"haus",[2,4],"cook"],[600,"farm",[8,9],"wander"],[780,"haus",[6,6],"sit"],[840,"farm",[10,8],"wander"],[1140,"haus",[2,4],"cook"],[1260,"haus",[6,6],"sit"],[1380,null]]
              :[[360,"haus",[2,4],"cook"],[540,null,null,"work"],[990,"farm",[8,9],"wander"],[1140,"haus",[6,6],"sit"],[1320,"haus",[10,4],"bed"],[1410,null]];
  let cur=[0,null];
  for(const e of sch) if(m>=e[0]) cur=e;
  if(cur[1]==="farm"&&S.weather!=="sun") cur=[cur[0],"haus",[6,6],"sit"];
  return {map:cur[1],pos:cur[2],mode:cur[3]||"off"};
}
function reneUpdate(dt){
  const pl=renePlan();
  if(pl.map!==M.id){ RA.vis=false; RA.cuddle=false; return; }
  if(!RA.vis||RA.map!==M.id||RA.mode!==pl.mode&&!RA.path.length&&Math.hypot(RA.x-pl.pos[0],RA.y-pl.pos[1])>6){ RA.x=pl.pos[0]; RA.y=pl.pos[1]; RA.path=[]; }
  RA.vis=true; RA.map=M.id; RA.mode=pl.mode;
  // Kuscheln
  if(!RA.cuddle&&S.rene.met&&S.rene.cudToday<2&&!paused()&&P.queue.length===0&&rnd()<dt/75) { RA.cuddle=true; RA.path=[]; }
  let goal=pl.pos;
  if(RA.cuddle){ goal=null; const px=Math.round(P.x), py=Math.round(P.y); if(Math.abs(Math.round(RA.x)-px)+Math.abs(Math.round(RA.y)-py)<=1&&!RA.path.length){ RA.cuddle=false; reneCuddle(); }
    else if(!RA.path.length){ const p=bfs(RA.x,RA.y,adjGoal(px,py),2000); RA.path=p||[]; if(!p) RA.cuddle=false; } }
  else if(pl.mode==="wander"){ RA.timer-=dt; if(RA.timer<=0&&!RA.path.length){ RA.timer=3+rnd()*4; for(let k=0;k<8;k++){ const tx=pl.pos[0]+Math.floor(rnd()*7)-3, ty=pl.pos[1]+Math.floor(rnd()*5)-2; if(walkT(tx,ty)){ const p=bfs(RA.x,RA.y,(x,y)=>x===tx&&y===ty,800); if(p){ RA.path=p; break; } } } } }
  else if(!RA.path.length&&(Math.round(RA.x)!==goal[0]||Math.round(RA.y)!==goal[1])){ const p=bfs(RA.x,RA.y,(x,y)=>x===goal[0]&&y===goal[1],1500); RA.path=p||[]; if(!p){ RA.x=goal[0]; RA.y=goal[1]; } }
  RA.moving=false;
  if(RA.path.length){ const [nx,ny]=RA.path[0], dx=nx-RA.x, dy=ny-RA.y, d=Math.hypot(dx,dy), sp=(RA.cuddle?3.4:2.3)*dt;
    if(Math.abs(dx)>Math.abs(dy)){ RA.dir=2; RA.flip=dx<0; } else if(Math.abs(dy)>.01) RA.dir=dy<0?1:0;
    if(d<=sp){ RA.x=nx; RA.y=ny; RA.path.shift(); } else { RA.x+=dx/d*sp; RA.y+=dy/d*sp; }
    RA.moving=true; RA.ft+=dt; if(RA.ft>.14){ RA.ft=0; RA.frame=(RA.frame+1)%4; } }
  else { RA.frame=0; if(pl.mode==="cook"){ RA.dir=1; } else if(pl.mode==="sit"||pl.mode==="bed") RA.dir=0; }
}
function reneCuddle(){
  RA.dir=Math.round(P.y)<Math.round(RA.y)?1:Math.round(P.y)>Math.round(RA.y)?0:2; RA.flip=P.x<RA.x; faceTo(Math.round(RA.x),Math.round(RA.y));
  dialog([{who:"rene",text:pick(JM.RENE.cuddle)},{who:null,text:fmtD("Ihr kuschelt eine Weile. {d0} und {d1} drängeln sich dazwischen."),fn:()=>{ hearts(P.x,P.y-.6); hearts(RA.x,RA.y-.6); sfx("gift"); S.energy=Math.min(S.maxE,S.energy+15); S.rene.cuddles=(S.rene.cuddles||0)+1; S.rene.cudToday++; hud(); }}],()=>{ emit("cuddle"); note("Energie +15"); saveSoon(); });
}
function reneTalk(){
  const pl=renePlan(); RA.dir=Math.round(P.y)<Math.round(RA.y)?1:Math.round(P.y)>Math.round(RA.y)?0:2; RA.flip=P.x<RA.x;
  if(!S.rene.met){ S.rene.met=true; S.rene.bf=S.day; S.energy=Math.min(S.maxE,S.energy+20);
    dialog([{who:"rene",text:fmtD("Guten Morgen, {name}! Na, wie gefällt dir unser Hof? Ich hab Rührei gemacht, iss erst mal was.")},{who:"rene",text:"Ich muss gleich los zur Arbeit. Und falls du irgendwo eine Socke findest... die gehört mir. Vermutlich."},{who:null,text:"Energie +20"}],()=>{ emit("talk_rene"); emit("talk","rene"); hud(); saveSoon(); }); return; }
  if(pl.mode==="cook"&&S.rene.bf!==S.day){ S.rene.bf=S.day; S.energy=Math.min(S.maxE,S.energy+20); const wk=Math.floor((S.day-1)/7);
    if(weekday()>=5&&S.rene.wk!==wk){ S.rene.wk=wk; give("nudeln",1); dialog([{who:"rene",text:"Wochenende! Heute hab ich gekocht: deine Nudeln mit Tempura-Chicken. Eine Portion ist für später."},{who:null,text:"Du bekommst Chinesische Nudeln mit Tempura-Chicken. Energie +20"}],()=>{ hud(); saveSoon(); }); return; }
    dialog([{who:"rene",text:pick(JM.RENE.breakfast)},{who:null,text:"Energie +20"}],()=>{ hud(); emit("talk","rene"); saveSoon(); }); return; }
  dialog([{who:"rene",text:fmtD(pick(weekday()>=5?JM.RENE.lines.concat(JM.RENE.weekend):JM.RENE.lines))}],()=>{ emit("talk","rene"); });
}
function spawnMess(){
  const n=weekday()>=5?3:2, out=[];
  const pickTile=(m,ok)=>{ for(let k=0;k<40;k++){ const x=Math.floor(rnd()*m.w), y=Math.floor(rnd()*m.h); if(ok(x,y)&&!out.some(o=>o.map===m.id&&o.x===x&&o.y===y)) return [x,y]; } return null; };
  for(let i=0;i<n;i++){ const inHouse=rnd()<.5, m=inHouse?MAPS.haus:MAPS.farm;
    const t=inHouse?pickTile(m,(x,y)=>y>=5&&(m.t[y][x]===T.BODEN||m.t[y][x]===T.TEPPICH)&&y<m.h-1):pickTile(m,(x,y)=>x>=2&&x<=12&&y>=6&&y<=9&&(m.t[y][x]===T.GRAS||m.t[y][x]===T.TUFF||m.t[y][x]===T.WEG));
    if(t) out.push({map:m.id,x:t[0],y:t[1],k:pick(JM.MESS)}); }
  S.mess=out;
}
function tidy(m){
  S.mess=S.mess.filter(x=>x!==m); S.stats.tidy=(S.stats.tidy||0)+1; sfx("pick"); burst(m.x,m.y,"#f4f1ea",5);
  note(pick(JM.RENE.tidy[m.k])+" Weggeräumt."); emit("tidy"); saveSoon();
}
function blinkNow(seed){ return ((gameT+seed*.77)%3.4)<.13; }
function openSleep(){ openPanel(`<h2>Schlafen gehen?</h2><p>Der Tag endet und das Spiel wird gespeichert. Gegossene Pflanzen wachsen über Nacht.</p><div class="row2"><button class="btn wide" data-a="yes">Gute Nacht</button><button class="btn alt wide" data-a="no">Noch nicht</button></div>`,{yes:()=>endDay(false),no:closePanel}); }
function ambientLife(dt){
  const se=season(), day=S.min>=420&&S.min<1140;
  if(M.id==="farm"&&rnd()<dt*2.5){ const w=S.weather==="rain"?14:7; FX.push({smoke:true,x:3*16-2+63+(rnd()-.5)*3,y:-2,vx:w+rnd()*4,vy:-9-rnd()*3,l:2.6,r:1.2,g:0}); }
  for(const p of FX) if(p.smoke) p.r=Math.min(4,p.r+dt*1.1);
  const want=!M.cave&&!M.inside&&day&&S.weather==="sun"&&(se===0||se===1)?4:0;
  if(CRIT.filter(c=>!c.bird).length<want&&rnd()<dt){ const cols=["#f6d55c","#ffffff","#f28fb0","#9ad0f0"]; CRIT.push({x:cam.x+rnd()*LW,y:cam.y+rnd()*LH,tx:0,ty:0,t:0,p:rnd()*10,c:pick(cols)}); }
  birdT-=dt; if(!M.cave&&!M.inside&&day&&birdT<=0){ birdT=10+rnd()*20; const y=cam.y+20+rnd()*(LH-40); for(let i=0;i<3+Math.floor(rnd()*3);i++) CRIT.push({bird:true,x:cam.x+LW+20+i*9,y:y+(i%2)*6+i*2,p:i,vx:-55}); }
  for(const c of CRIT){
    if(c.bird){ c.x+=c.vx*dt; continue; }
    c.t-=dt; if(c.t<=0){ c.t=1+rnd()*2; c.tx=c.x+(rnd()-.5)*60; c.ty=c.y+(rnd()-.5)*40; }
    c.x+=(c.tx-c.x)*dt*.8; c.y+=(c.ty-c.y)*dt*.8+Math.sin(gameT*6+c.p)*.3;
  }
  CRIT=CRIT.filter(c=>c.bird?c.x>cam.x-40:(want>0&&c.x>cam.x-60&&c.x<cam.x+LW+60&&c.y>cam.y-60&&c.y<cam.y+LH+60));
}
function moveA(a,tx,ty,sp,dt,fr){
  const dx=tx-a.x, dy=ty-a.y, d=Math.hypot(dx,dy); a.moving=false;
  if(d<.06){ a.frame=0; return; }
  const st=Math.min(d,sp*dt), nx=a.x+dx/d*st, ny=a.y+dy/d*st;
  const ok=(x,y)=>walkT(Math.round(x),Math.round(y));
  if(ok(nx,ny)){ a.x=nx; a.y=ny; } else if(ok(nx,a.y)) a.x=nx; else if(ok(a.x,ny)) a.y=ny; else { a.timer=0; return; }
  if(Math.abs(dx)>.03) a.face=dx<0?-1:1;
  a.moving=true; a.ft+=dt; if(a.ft>fr){ a.ft=0; a.frame=(a.frame+1)%4; }
}
function ambient(dt){
  const se=season(), night=S.min>=1170||S.min<360;
  const want=S.weather==="rain"?90:S.weather==="snow"?60:(se===0?16:se===2?18:se===1&&night?18:se===3?20:6);
  while(AMB.length<want) AMB.push({x:rnd()*LW,y:rnd()*LH,v:.5+rnd(),p:rnd()*6});
  if(AMB.length>want) AMB.length=want;
  for(const a of AMB){
    if(S.weather==="rain"){ a.y+=260*a.v*dt; a.x-=40*dt; }
    else if(S.weather==="snow"||se===3){ a.y+=14*a.v*dt; a.x+=Math.sin(gameT+a.p)*8*dt; }
    else if(se===1&&night){ a.x+=Math.sin(gameT*.7+a.p)*10*dt; a.y+=Math.cos(gameT*.5+a.p)*8*dt; }
    else { a.y+=12*a.v*dt; a.x+=(Math.sin(gameT+a.p)*10+6)*dt; }
    if(a.y>LH+4){ a.y=-4; a.x=rnd()*LW; } if(a.x>LW+4) a.x=-4; if(a.x<-4) a.x=LW+4; if(a.y<-6) a.y=LH;
  }
}

/* ================= Zeichnen ================= */
let padCache={t:0,b:0,at:0}, VIG=null;
function pads(){ if(performance.now()-padCache.at>1000){ const h=$("hud").getBoundingClientRect(), b=$("bottom").getBoundingClientRect(); padCache={t:Math.max(0,h.bottom)*DPR/SC*.85,b:Math.max(0,innerHeight-b.top)*DPR/SC*.85,at:performance.now()}; } return padCache; }
const padTop=()=>pads().t, padBot=()=>pads().b;
function darkness(){
  const m=S.min; let a=0;
  if(m<420) a=.5*(420-m)/60; else if(m>1050) a=Math.min(.66,(m-1050)/170*.66);
  if(M.cave) return .55;
  if(M.inside) return (m>=1140||m<390)?.32:0;
  if(S.weather==="rain") a=Math.max(a,.18)+.06; if(S.weather==="snow") a+=.03;
  return clamp(a,0,.72);
}
/* ---------- 3D-Darstellung (jm-3d.js) ---------- */
const want3D=()=>!(S&&S.gfx==="2d");
function use3D(){
  const R=JM.R3; if(!R||!R.attach||!want3D()) return false;
  if(!R.ok){ try{ R.attach(JM.ENG); }catch(e){ console.error(e); R.attach=null; return false; } }
  return R.ok;
}
let snap3=false;
function render3(){
  const se=season(), night=S.min>=1110||S.min<390;
  const padT=demo?0:padTop(), padB=demo?0:padBot();
  const cx=P.x*16+8-LW/2, cy=P.y*16+4-(LH+padT-padB)/2; snap3=camSnap; camSnap=false; cam.x=cx; cam.y=cy;
  JM.R3.show(true);
  JM.R3.frame(FDT,{t:padT*SC/DPR/.85,b:padB*SC/DPR/.85});
  ctx.clearRect(0,0,VW,VH);
  const pr=(wx,wy,h)=>JM.R3.proj(wx,wy,h), p2=(x,y,h)=>pr(x/16,y/16+(h==null?.8:h),h==null?.8:h);
  const px=Math.max(2,SC*.9);
  const badge=(x,y,ch)=>{ const b=Math.sin(gameT*5)*3*DPR, s=11*DPR; ctx.save(); ctx.translate(x,y+b); ctx.fillStyle="#2b1e2a"; ctx.beginPath(); ctx.roundRect(-s-2*DPR,-s-2*DPR,2*s+4*DPR,2*s+4*DPR,6*DPR); ctx.fill(); ctx.fillStyle=ch==="*"?"#f6b3c9":"#f6d55c"; ctx.beginPath(); ctx.roundRect(-s,-s,2*s,2*s,5*DPR); ctx.fill(); ctx.fillStyle="#2b1e2a"; ctx.font=`900 ${15*DPR}px Saira, system-ui, sans-serif`; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText(ch==="*"?"♥":ch,0,1*DPR); ctx.restore(); };
  const heart=(x,y,c,sc)=>{ ctx.save(); ctx.translate(x,y); ctx.scale(sc,sc); ctx.fillStyle=c; ctx.fillRect(1,0,2,1); ctx.fillRect(4,0,2,1); ctx.fillRect(0,1,7,2); ctx.fillRect(1,3,5,1); ctx.fillRect(2,4,3,1); ctx.fillRect(3,5,1,1); ctx.restore(); };
  // Hinweise über Figuren
  if(!demo&&!PHOTO){
    for(const id in NPCA){ const a=NPCA[id]; if(!a.vis) continue; const st=S.npc[id]; const qn=curQ()&&curQ().tg&&(curQ().tg==="npc:"+id||(curQ().tg==="npc:unmet"&&!st.met)); const [x,y]=pr(a.x+.5,a.y+.62,1.55);
      if(!st.met||qn) badge(x,y,qn?"!":"?"); else if(NPCS[id].bday[0]===season()&&NPCS[id].bday[1]===dayIn()) badge(x,y,"*"); }
    if(M.owner&&npcPlace(M.owner)==="in"&&!S.npc[M.owner].met){ const [x,y]=pr(M.npcAt[0]+.5,M.npcAt[1]+.62,1.55); badge(x,y,"?"); }
    if(RA.vis){ const [x,y]=pr(RA.x+.5,RA.y+.62,1.55); if(curQ()&&curQ().tg==="rene") badge(x,y,"!"); else if(RA.cuddle) heart(x-3.5*px,y-3*px,"#e8476a",px); }
    for(const c of COWS) if(S.cows[c.i].milk){ const [x,y]=pr(c.x+.5,c.y+.6,1.6); ctx.imageSmoothingEnabled=false; ctx.drawImage(icon("milch"),x-8*px/1.2,y-8*px/1.2+Math.sin(gameT*3)*2*DPR,16*px/1.2,16*px/1.2); }
  }
  // Angelschnur
  if(FISH.phase==="wait"||FISH.phase==="bite"){ const [hx,hy]=pr(P.x+.5+(P.flip?-.3:.3),P.y+.62,.95), [bx2,by2]=pr(FISH.x+.5,FISH.y+.5,.06+Math.sin(gameT*4)*.02);
    ctx.strokeStyle="rgba(255,255,255,.75)"; ctx.lineWidth=1.5*DPR; ctx.beginPath(); ctx.moveTo(hx,hy); ctx.quadraticCurveTo((hx+bx2)/2,Math.min(hy,by2)-30*DPR,bx2,by2); ctx.stroke();
    ctx.fillStyle="#e8483a"; ctx.beginPath(); ctx.arc(bx2,by2-2*DPR,4*DPR,Math.PI,0); ctx.fill(); ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(bx2,by2-2*DPR,4*DPR,0,Math.PI); ctx.fill();
    if(FISH.phase==="bite"){ const [x,y]=pr(P.x+.5,P.y+.62,1.6); badge(x,y,"!"); } }
  // Partikel und schwebende Gegenstände
  for(const p of FX){ if(p.smoke) continue; const [x,y]=p2(p.x,p.y); if(p.heart){ ctx.globalAlpha=Math.min(1,p.l); heart(x,y,p.c,px*.8); ctx.globalAlpha=1; } else { ctx.fillStyle=p.c; ctx.fillRect(x,y,p.s*px*.7,p.s*px*.7); } }
  ctx.imageSmoothingEnabled=false;
  for(const f of FLT){ const [x,y]=p2(f.x,f.y-4,1.1); ctx.globalAlpha=Math.min(1,f.l*1.5); ctx.drawImage(icon(f.k),x-8*px,y-8*px,16*px,16*px); ctx.globalAlpha=1; }
  // Wetter
  bx.clearRect(0,0,LW,LH);
  if(!M.cave&&!M.inside&&S.weather==='sun'&&!(se===1&&night)) drawAmbient(se,night);
  if(FESTFX.fire>0&&night) drawFireworks();
  if(FESTFX.lanterns>0) drawLanterns();
  ctx.drawImage(buf,0,0,LW*SC,LH*SC);
  if(!VIG||VIG.width!==VW||VIG.height!==VH){ VIG=A.cnv(VW,VH); const vx=VIG.getContext("2d"), g=vx.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*.35,VW/2,VH/2,Math.max(VW,VH)*.75); g.addColorStop(0,"rgba(10,12,30,0)"); g.addColorStop(1,"rgba(10,12,30,.32)"); vx.fillStyle=g; vx.fillRect(0,0,VW,VH); }
  ctx.drawImage(VIG,0,0);
  if(FESTFX.moon>0) drawMoon();
  if(!demo&&!paused()&&!PHOTO) drawArrow3(pr);
  if(!PHOTO) drawStar();
}
function drawArrow3(pr){
  const t=routeTarget(questTarget()); if(!t) return;
  const [sx,sy]=pr(t.x+.5,t.y+.5,1.1);
  const pad=60*DPR, top=150*DPR, bot=VH-150*DPR;
  const on=sx>pad&&sx<VW-pad&&sy>top&&sy<bot;
  const bob=Math.sin(gameT*5)*6*DPR;
  ctx.save();
  if(on){
    if(Math.hypot(P.x-t.x,P.y-t.y)<1.6&&!t.exit){ ctx.restore(); return; }
    const s=10*DPR; ctx.translate(sx,sy-18*DPR+bob); ctx.fillStyle="#f6d55c"; ctx.strokeStyle="#2b1e2a"; ctx.lineWidth=3*DPR;
    ctx.beginPath(); ctx.moveTo(-s,-s*1.2); ctx.lineTo(s,-s*1.2); ctx.lineTo(0,s*.4); ctx.closePath(); ctx.stroke(); ctx.fill();
  } else {
    const [px,py]=pr(P.x+.5,P.y+.6,.5), ang=Math.atan2(sy-py,sx-px);
    const cx=VW/2, cy=(top+bot)/2, rx=VW/2-pad, ry=(bot-top)/2;
    const k=Math.min(Math.abs(rx/Math.cos(ang)),Math.abs(ry/Math.sin(ang)));
    const s=12*DPR; ctx.translate(cx+Math.cos(ang)*k*.92,cy+Math.sin(ang)*k*.92); ctx.rotate(ang); ctx.fillStyle="#f6d55c"; ctx.strokeStyle="#2b1e2a"; ctx.lineWidth=3*DPR;
    ctx.beginPath(); ctx.moveTo(s*1.3+bob*.5,0); ctx.lineTo(-s*.6,-s); ctx.lineTo(-s*.2,0); ctx.lineTo(-s*.6,s); ctx.closePath(); ctx.stroke(); ctx.fill();
  }
  ctx.restore();
}
function render(){
  if(use3D()){ render3(); return; }
  if(JM.R3&&JM.R3.ok) JM.R3.show(false);
  const se=season(), night=S.min>=1110||S.min<390, dk=darkness();
  const mw=M.w*16, mh=M.h*16;
  const padT=demo?0:padTop(), padB=demo?0:padBot();
  let cx=P.x*16+8-LW/2, cy=P.y*16+4-(LH+padT-padB)/2;
  const tcx=mw>LW?clamp(cx,0,mw-LW):(mw-LW)/2, tcy=mh+padT+padB>LH?clamp(cy,-padT,mh-LH+padB):(mh-LH)/2;
  if(camSnap||Math.abs(tcx-cam.x)>LW||Math.abs(tcy-cam.y)>LH){ cam.x=tcx; cam.y=tcy; camSnap=false; }
  else { const k=Math.min(1,FDT*6); cam.x+=(tcx-cam.x)*k; cam.y+=(tcy-cam.y)*k; }
  const CX=Math.round(cam.x), CY=Math.round(cam.y);
  const wind=S.weather==="rain"?1.8:S.weather==="snow"?1.2:1;
  bx.fillStyle=M.cave?"#2c2624":M.inside?"#241a14":A.shade(A.PAL[se].g,-.35); bx.fillRect(0,0,LW,LH);
  if(GROUND) bx.drawImage(GROUND,-CX,-CY);
  const x0=Math.max(0,Math.floor(CX/16)-1), y0=Math.max(0,Math.floor(CY/16)-1), x1=Math.min(M.w-1,Math.ceil((CX+LW)/16)+1), y1=Math.min(M.h-1,Math.ceil((CY+LH)/16)+2);
  // Wasser
  let waterVis=false; const CAST=[], cast=(spr,dx,dy)=>CAST.push([spr,dx,dy]);
  for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(M.t[y][x]===T.WASSER){ waterVis=true; drawWater(x*16-CX,y*16-CY,x,y,se); }
  // Grashalme im Wind
  if(!M.cave){ const P2=A.PAL[se]; for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){ if(M.t[y][x]!==T.TUFF) continue; for(let i=0;i<3;i++){ const h=A.hsh(x,y,i+300), bx0=x*16+2+h%12-CX, by0=y*16+5+(h>>4)%9-CY; const lean=Math.round(Math.sin(gameT*2.2*wind+x*.9+y*.6+i)*wind); bx.fillStyle=P2.gd; bx.fillRect(bx0,by0+2,1,2); bx.fillStyle=P2.leaf; bx.fillRect(bx0+(lean>0?1:0),by0+1,1,1); bx.fillStyle=P2.gl; bx.fillRect(bx0+lean,by0,1,1); } } }
  // Liste
  const L=[];
  for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
    if(M.id==="farm"&&isField(x,y)){ const f=fieldAt(x,y); if(f){ if(f.c){ const cr=CROPS[f.c.k]; const st=f.c.a===0?0:f.c.a>=cr.days?4:f.c.a/cr.days<.34?1:f.c.a/cr.days<.67?2:3; const spr=lazy(SPR.crops,f.c.k+st,()=>A.crop(f.c.k,st)); if(f.c.g&&st===4){ L.push({y:y+.3,d:()=>bx.drawImage(spr,x*16-9-CX,y*16+16-44-CY,spr.width*1.8,spr.height*1.8)}); } else L.push({y:y+.1,d:()=>{ bx.drawImage(spr,x*16-1-CX+(st>=3?Math.round(Math.sin(gameT*1.8*wind+x+y*.7)*.6*wind):0),y*16+16-25-CY); if(st===4&&Math.floor(gameT*2+x)%6===0) bx.fillStyle="#fff",bx.fillRect(x*16+12-CX,y*16+2-CY,1,1); }}); }
      if(f.o){ const spr=lazy(SPR.prop,f.o+se,()=>A.prop(f.o==="spr"?"sprinkler":f.o,se)); L.push({y:y+.05,d:()=>bx.drawImage(spr,x*16+8-(spr.width>>1)-CX,y*16+15-spr.height-CY)}); } } }
  }
  for(const t of M.trees){ if(t.x<x0-1||t.x>x1+1||t.y<y0||t.y>y1+2) continue; const spr=lazy(SPR.trees,se+t.kind+t.v,()=>A.tree(se,t.kind==="fruit"?"fruit":t.kind,t.v)); cast(spr,t.x*16+8-17-CX,t.y*16+16-45-CY); L.push({y:t.y+.5,d:()=>{ const behind=P.y<t.y&&P.y>t.y-2.6&&Math.abs(P.x-t.x)<1.4; if(behind) bx.globalAlpha=.55; const dx=t.x*16+8-17-CX, dy=t.y*16+16-45-CY, off=Math.round(Math.sin(gameT*1.2*wind+t.x*.8+t.y*.4)*.7*wind); bx.drawImage(spr,0,0,34,28,dx+off,dy,34,28); bx.drawImage(spr,0,28,34,18,dx,dy+28,34,18); bx.globalAlpha=1; }}); }
  const unread=S.mail.some(m=>!m.read);
  for(const o of M.obj){
    if(o.x+(o.w||1)<x0-3||o.x>x1+3||o.y>y1+2||o.y+(o.h||1)<y0-1) continue;
    const by=o.y+(o.h||1)-1+.6;
    if(o.k==="bush"){ const ber=season()===1&&(S.bush[M.id+":"+o.x+","+o.y]||0)<=S.day; const spr=lazy(SPR.bush,se+(ber?"b":""),()=>A.bush(se,ber)); cast(spr,o.x*16-2-CX,o.y*16-2-CY); L.push({y:by,d:()=>bx.drawImage(spr,o.x*16-2-CX,o.y*16-2-CY)}); continue; }
    let spr;
    if(["house","coop","barn","markt","nudelhaus","rathaus","tierhof","huette"].includes(o.k)){ const B=lazy(SPR.bld,o.k+se+(night?"n":""),()=>A.building(o.k,se,night)); spr=B.c; cast(spr,o.x*16-B.ox-CX,(o.y+(o.h||1))*16-spr.height+2-CY); L.push({y:by,d:()=>bx.drawImage(spr,o.x*16-B.ox-CX,(o.y+(o.h||1))*16-spr.height+2-CY)}); continue; }
    if(o.k==="mondbaum"){ const glow=Object.keys(S.bundleDone).length; spr=lazy(SPR.prop,"mb"+se+glow,()=>A.prop("mondbaum",se,glow)); cast(spr,o.x*16+16-36-CX,(o.y+2)*16-spr.height+4-CY); L.push({y:by,d:()=>bx.drawImage(spr,o.x*16+16-36-CX,(o.y+2)*16-spr.height+4-CY)}); continue; }
    const extra=o.k==="stove"?(renePlan().mode==="cook"&&RA.vis):o.k==="tv"?(S.min>=1080&&S.min<1380):o.k==="stall"?marketDay():o.k==="mailbox"?unread:o.k==="trough"?(o.act==="trough_h"?S.trough.h>0:S.trough.c>0):o.k==="lamp"?night:false;
    spr=lazy(SPR.prop,o.k+se+(extra?1:0),()=>A.prop(o.k,se,extra));
    if(o.k==="fountain"){ cast(spr,o.x*16-2-CX,(o.y+2)*16-spr.height+3-CY); L.push({y:by,d:()=>{ bx.drawImage(spr,o.x*16-2-CX,(o.y+2)*16-spr.height+3-CY); const t=gameT*6; for(let i=0;i<4;i++){ const a=(t+i*1.6)%6; bx.fillStyle=se===3?"#ffffff":"#bfe3ff"; bx.fillRect(o.x*16+14+Math.round(Math.sin(i*2.1)*a*1.4)-CX,o.y*16-6+Math.round(a*a*.5)-CY,1,1); } }}); continue; }
    if(spr.height>=14) cast(spr,o.x*16+(o.w||1)*8-(spr.width>>1)-CX,(o.y+(o.h||1))*16-spr.height+1-CY);
    L.push({y:by,d:()=>bx.drawImage(spr,o.x*16+(o.w||1)*8-(spr.width>>1)-CX,(o.y+(o.h||1))*16-spr.height+1-CY)});
  }
  if(M.cave) for(const r of (S.rocks||[])){ if(r.x<x0||r.x>x1||r.y<y0||r.y>y1) continue; const spr=lazy(SPR.prop,"rock"+r.k,()=>A.prop("rock",0,r.k)); L.push({y:r.y+.3,d:()=>bx.drawImage(spr,r.x*16-1-CX,r.y*16+1-CY)}); }
  if(M.id==="farm"){
    L.push({y:23.4,d:()=>drawGlassHouse(CX,CY)});
    for(const g of S.eggs){ const spr=lazy(SPR.prop,"egg"+(g.g?1:0),()=>A.prop("egg",0,g.g)); L.push({y:g.y,d:()=>bx.drawImage(spr,g.x*16+3-CX,g.y*16+5-CY)}); }
  }
  for(const f of (S.forage[M.id]||[])){ L.push({y:f.y,d:()=>{ const b=Math.round(Math.sin(gameT*3+f.x)*1); bx.drawImage(icon(f.k),f.x*16-CX,f.y*16-2+b-CY); }}); }
  // Figuren
  const fpos=a=>[Math.round(a.x*16+8-CX),Math.round(a.y*16+14-CY)];
  L.push({y:P.y+.5,d:()=>{ const [fx,fy]=fpos(P); bx.drawImage(SPR.shadow,fx-7,fy-2); const set=P.dir===0?SPR.player.down:P.dir===1?SPR.player.up:(P.flip?SPR.player.sideL:SPR.player.side); bx.drawImage(P.dir===0&&!P.moving&&!P.tool&&blinkNow(0)?SPR.player.blink:set[P.frame],fx-9,fy-25); if(P.tool) drawTool(fx,fy); }});
  for(const d of DOGS){ L.push({y:d.y+.45,d:()=>{ const [fx,fy]=fpos(d); const jump=d.trick>0?Math.round(Math.abs(Math.sin(d.trick*9))*5):0; bx.drawImage(SPR.shadow,fx-7,fy-2); const set=d.face<0?SPR.dogs[d.i].l:SPR.dogs[d.i].r; const fr=d.trick>0?3:(d.moving?1+(d.frame%2):(S.min>=1260||d.idle>3?3:0)); bx.drawImage(set[fr],fx-11,fy-17-jump); }}); }
  for(const h of HENS){ const spr=SPR.hen[h.deco?(h.i===-1?0:1):S.hens[h.i].c]; L.push({y:h.y+.4,d:()=>{ const [fx,fy]=fpos(h); bx.drawImage(SPR.shadow,fx-6,fy-2); const set=h.face<0?spr.l:spr.r; bx.drawImage(set[h.peck>0?2:(h.moving?h.frame%2:0)],fx-8,fy-13); }}); }
  for(const c of COWS){ const spr=SPR.cow[S.cows[c.i].c]; L.push({y:c.y+.4,d:()=>{ const [fx,fy]=fpos(c); bx.drawImage(SPR.shadowB,fx-12,fy-3); const set=c.face<0?spr.l:spr.r; bx.drawImage(set[c.moving?1+(c.frame%2):0],fx-15,fy-21); if(S.cows[c.i].milk){ bx.drawImage(icon("milch"),fx-4,fy-36+Math.round(Math.sin(gameT*3))); } }}); }
  if(M.owner&&npcPlace(M.owner)==="in"){ const id=M.owner, [nx,ny]=M.npcAt; L.push({y:ny+.5,d:()=>{ const fx=nx*16+8-CX, fy=ny*16+14-CY; const sp=SPR.npc[id]; bx.drawImage(blinkNow(3)?sp.blink:sp.down[0],fx-9,fy-25); if(!S.npc[id].met) drawBadge(fx,fy-31,"?"); }}); }
  if(RA.vis){ L.push({y:RA.y+.5,d:()=>{ const [fx,fy]=fpos(RA); bx.drawImage(SPR.shadow,fx-7,fy-2); const sp=SPR.rene; const set=RA.dir===0?sp.down:RA.dir===1?sp.up:(RA.flip?sp.sideL:sp.side); bx.drawImage(RA.dir===0&&!RA.moving&&blinkNow(7)?sp.blink:set[RA.moving?RA.frame:0],fx-9,fy-25);
    if(curQ()&&curQ().tg==="rene") drawBadge(fx,fy-31,"!"); else if(RA.cuddle) { bx.globalAlpha=.9; drawHeart(fx-3,fy-33,"#e8476a"); bx.globalAlpha=1; } if(renePlan().mode==="cook"&&Math.floor(gameT*2)%2) { bx.fillStyle="rgba(240,240,245,.6)"; bx.fillRect(2*16+6-CX,3*16-4-CY-Math.floor(gameT*8)%6,2,2); } }}); }
  for(const m of S.mess) if(m.map===M.id){ L.push({y:m.y,d:()=>{ bx.drawImage(icon(m.k),m.x*16-CX,m.y*16-1-CY); if(Math.floor(gameT*1.5+m.x)%4===0){ bx.fillStyle="#fff"; bx.fillRect(m.x*16+12-CX,m.y*16-CY,1,1); } }}); }
  for(const id in NPCA){ const a=NPCA[id]; if(!a.vis) continue; L.push({y:a.y+.5,d:()=>{ const [fx,fy]=fpos(a); bx.drawImage(SPR.shadow,fx-7,fy-2); const sp=SPR.npc[id]; const set=a.dir===0?sp.down:a.dir===1?sp.up:(a.flip?sp.sideL:sp.side); bx.drawImage(a.dir===0&&!a.moving&&blinkNow(id.length)?sp.blink:set[a.frame],fx-9,fy-25);
    const st=S.npc[id]; const q=questTarget(); const qn=curQ()&&curQ().tg&&(curQ().tg==="npc:"+id||(curQ().tg==="npc:unmet"&&!st.met));
    if(!st.met||qn){ drawBadge(fx,fy-31,qn?"!":"?"); } else if(NPCS[id].bday[0]===season()&&NPCS[id].bday[1]===dayIn()) drawBadge(fx,fy-31,"*"); }}); }
  // Waldrand außerhalb der Karte
  const edge=(x,y,k)=>{ const spr=lazy(SPR.trees,se+k+(x&3),()=>A.tree(se,k,x&3)); cast(spr,x*16+8-17-CX,y*16+16-45-CY); L.push({y:y+.5,d:()=>bx.drawImage(spr,x*16+8-17-CX,y*16+16-45-CY)}); };
  if(!M.cave&&!M.inside) for(let y=Math.floor(CY/16)-1;y<0;y++) for(let x=x0-1;x<=x1+1;x++) edge(x,y,(x+y)%3?"pine":"oak");
  if(!M.cave&&!M.inside) for(let y=M.h;y<=Math.ceil((CY+LH)/16)+2;y++) for(let x=x0-1;x<=x1+1;x++) edge(x,y,(x+y)%3?"pine":"oak");
  // Figuren werfen auch Schatten
  { const fp=a=>[Math.round(a.x*16+8-CX),Math.round(a.y*16+14-CY)], cs=(sp,a)=>{ const set=a.dir===0?sp.down:a.dir===1?sp.up:(a.flip?sp.sideL:sp.side); const [fx,fy]=fp(a); cast(set[(a.frame||0)%set.length],fx-9,fy-25); };
    cs(SPR.player,P); if(RA.vis) cs(SPR.rene,RA); for(const id in NPCA) if(NPCA[id].vis) cs(SPR.npc[id],NPCA[id]);
    for(const d of DOGS){ const [fx,fy]=fp(d); cast((d.face<0?SPR.dogs[d.i].l:SPR.dogs[d.i].r)[0],fx-11,fy-17); }
    for(const c of COWS){ const [fx,fy]=fp(c); cast((c.face<0?SPR.cow[S.cows[c.i].c].l:SPR.cow[S.cows[c.i].c].r)[0],fx-15,fy-21); } }
  // Kontaktschatten am Boden
  bx.fillStyle="rgba(20,30,15,.22)";
  for(const t of M.trees){ if(t.x<x0-1||t.x>x1+1||t.y<y0||t.y>y1+2) continue; bx.beginPath(); bx.ellipse(t.x*16+10-CX,t.y*16+14-CY,13,5,0,0,Math.PI*2); bx.fill(); }
  for(const o of M.obj){ if(!["house","coop","barn","markt","nudelhaus","rathaus","tierhof","huette","mondbaum","fountain"].includes(o.k)) continue; if(o.x+(o.w||1)<x0-3||o.x>x1+3||o.y>y1+2||o.y+(o.h||1)<y0-1) continue; const w=(o.w||1)*16, by=(o.y+(o.h||1))*16; bx.beginPath(); bx.ellipse(o.x*16+w/2+4-CX,by-2-CY,w/2+6,7,0,0,Math.PI*2); bx.fill(); }
  if(M.inside){ bx.fillStyle="rgba(30,15,5,.22)"; for(const o of M.obj){ if(o.y<=2) continue; const w=(o.w||1)*16, by=(o.y+(o.h||1))*16; bx.beginPath(); bx.ellipse(o.x*16+w/2-CX,by-3-CY,w/2,4,0,0,Math.PI*2); bx.fill(); } }
  if(waterVis) drawReflect(CAST,CX,CY);
  drawCast(CAST);
  L.sort((a,b)=>a.y-b.y); for(const o of L) o.d();
  // Angelschnur
  if(FISH.phase==="wait"||FISH.phase==="bite"){ const bob=Math.round(Math.sin(gameT*4)); const bxp=FISH.x*16+8-CX, byp=FISH.y*16+8-CY+bob; bx.fillStyle="rgba(255,255,255,.6)"; const [px,py]=[Math.round(P.x*16+8-CX),Math.round(P.y*16-6-CY)]; for(let i=0;i<=10;i++) bx.fillRect(Math.round(px+(bxp-px)*i/10),Math.round(py+(byp-py)*i/10+Math.sin(i/10*Math.PI)*-4),1,1); bx.fillStyle="#e8483a"; bx.fillRect(bxp-1,byp-1,3,2); bx.fillStyle="#fff"; bx.fillRect(bxp-1,byp+1,3,1); if(FISH.phase==="bite"){ drawBadge(px,py-22,"!"); } }
  // Partikel
  for(const p of FX){ if(p.smoke){ const a=Math.max(0,Math.min(.55,p.l*.3)); bx.fillStyle=`rgba(225,225,232,${a})`; const r=Math.round(p.r); bx.fillRect(Math.round(p.x-CX)-r,Math.round(p.y-CY)-r+1,r*2,r*2-2); bx.fillRect(Math.round(p.x-CX)-r+1,Math.round(p.y-CY)-r,r*2-2,r*2); continue; } if(p.heart){ bx.globalAlpha=Math.min(1,p.l); drawHeart(Math.round(p.x-CX),Math.round(p.y-CY),p.c); bx.globalAlpha=1; } else { bx.fillStyle=p.c; bx.fillRect(Math.round(p.x-CX),Math.round(p.y-CY),p.s,p.s); } }
  for(const c of CRIT){ const X=Math.round(c.x-CX), Y=Math.round(c.y-CY); if(c.bird){ bx.fillStyle="rgba(20,30,20,.18)"; const f=Math.floor(gameT*6+c.p)%2; bx.fillRect(X-3,Y+(f?-1:0),3,1); bx.fillRect(X+1,Y+(f?-1:0),3,1); bx.fillRect(X,Y,1,1); continue; } const f=Math.floor(gameT*10+c.p)%2; bx.fillStyle=c.c; if(f){ bx.fillRect(X-2,Y-1,2,2); bx.fillRect(X+1,Y-1,2,2); } else { bx.fillRect(X-1,Y-1,1,2); bx.fillRect(X+1,Y-1,1,2); } bx.fillStyle="#3a2a2a"; bx.fillRect(X,Y-1,1,2); }
  for(const f of FLT){ bx.globalAlpha=Math.min(1,f.l*1.5); bx.drawImage(icon(f.k),Math.round(f.x-8-CX),Math.round(f.y-12-CY)); bx.globalAlpha=1; }
  // Fest
  const fest=festActive(); if(fest&&M.id==="village") drawFestDecor(fest,CX,CY,night);
  // Wetter und Stimmung
  if(!M.cave&&!M.inside) drawAmbient(se,night);
  // Licht
  if(dk>0){
    lx.globalCompositeOperation="source-over"; lx.clearRect(0,0,LW,LH); lx.fillStyle=`rgba(18,22,62,${dk})`; lx.fillRect(0,0,LW,LH);
    lx.globalCompositeOperation="destination-out";
    const lights=[]; lights.push([P.x*16+8,P.y*16+4,M.cave?64:38]);
    if(M.inside){ lights.push([M.w*8,M.h*8,90]); lights.push([M.w*8,M.h*8,90]); }
    if(M.cave) for(const r of (S.rocks||[])) if(r.k==='mondquarz'||r.k==='amethyst') lights.push([r.x*16+8,r.y*16+8,18]);
    if(night){ for(const o of M.obj){ if(["house","coop","barn","markt","nudelhaus","rathaus","tierhof","huette"].includes(o.k)){ const B=lazy(SPR.bld,o.k+se+"n",()=>A.building(o.k,se,true)); const bx0=o.x*16-B.ox, by0=(o.y+(o.h||1))*16-B.c.height+2; B.lights.forEach(l=>lights.push([bx0+l[0],by0+l[1],l[2]])); } if(o.k==="lamp") lights.push([o.x*16+8,o.y*16-8,40]); if(o.k==="mondbaum") lights.push([o.x*16+16,o.y*16-20,50+Object.keys(S.bundleDone).length*12]); }
      if(fest&&M.id==="village") for(let i=0;i<8;i++) lights.push([12*16+i*16+8,7*16+4,22]); }
    for(const [lxp,lyp,r] of lights){ const x=lxp-CX, y=lyp-CY; if(x<-r||y<-r||x>LW+r||y>LH+r) continue; const g=lx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,"rgba(0,0,0,1)"); g.addColorStop(.5,"rgba(0,0,0,.6)"); g.addColorStop(1,"rgba(0,0,0,0)"); lx.fillStyle=g; lx.fillRect(x-r,y-r,r*2,r*2); }
    bx.drawImage(lit,0,0);
    if(night){ bx.globalCompositeOperation="lighter"; for(const [lxp,lyp,r] of lights.slice(1)){ const x=lxp-CX, y=lyp-CY; if(x<-r||y<-r||x>LW+r||y>LH+r) continue; const g=bx.createRadialGradient(x,y,0,x,y,r*.7); g.addColorStop(0,"rgba(255,190,90,.22)"); g.addColorStop(1,"rgba(255,190,90,0)"); bx.fillStyle=g; bx.fillRect(x-r,y-r,r*2,r*2); } bx.globalCompositeOperation="source-over"; }
  }
  if(!M.cave&&!M.inside){
    if(S.min>960&&S.min<1170){ const a=Math.sin((S.min-960)/210*Math.PI); const gr=bx.createLinearGradient(0,0,0,LH); gr.addColorStop(0,`rgba(255,110,150,${.45*a})`); gr.addColorStop(1,`rgba(255,160,60,${.35*a})`); bx.globalCompositeOperation="soft-light"; bx.fillStyle=gr; bx.fillRect(0,0,LW,LH); bx.globalCompositeOperation="source-over"; bx.fillStyle=`rgba(255,130,70,${.10*a})`; bx.fillRect(0,0,LW,LH); }
    if(S.min<480){ const a=Math.min(1,(480-S.min)/120); bx.globalCompositeOperation="soft-light"; bx.fillStyle=`rgba(255,195,110,${.45*a})`; bx.fillRect(0,0,LW,LH); bx.globalCompositeOperation="source-over"; bx.fillStyle=`rgba(255,200,140,${.07*a})`; bx.fillRect(0,0,LW,LH); }
    if(S.min>=600&&S.min<=900&&S.weather==="sun"){ bx.globalCompositeOperation="soft-light"; bx.fillStyle="rgba(255,250,220,.10)"; bx.fillRect(0,0,LW,LH); bx.globalCompositeOperation="source-over"; }
  }
  if(FESTFX.fire>0&&night) drawFireworks();
  if(FESTFX.lanterns>0) drawLanterns();
  // Hochskalieren
  ctx.drawImage(buf,0,0,LW*SC,LH*SC);
  if(!VIG||VIG.width!==VW||VIG.height!==VH){ VIG=A.cnv(VW,VH); const vx=VIG.getContext("2d"), g=vx.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*.35,VW/2,VH/2,Math.max(VW,VH)*.75); g.addColorStop(0,"rgba(10,12,30,0)"); g.addColorStop(1,"rgba(10,12,30,.32)"); vx.fillStyle=g; vx.fillRect(0,0,VW,VH); }
  ctx.drawImage(VIG,0,0);
  if(FESTFX.moon>0) drawMoon();
  // Zielpfeil
  if(!demo&&!paused()&&!PHOTO) drawArrow(CX,CY);
  if(!PHOTO) drawStar();
}
function drawWater(X,Y,x,y,se){
  const t=gameT, w=(xx,yy)=>xx<0||yy<0||xx>=M.w||yy>=M.h||M.t[yy][xx]===T.WASSER||M.t[yy][xx]===T.STEG;
  const deep=w(x-1,y)&&w(x+1,y)&&w(x,y-1)&&w(x,y+1)&&w(x-1,y-1)&&w(x+1,y+1);
  bx.fillStyle=se===3?"#6f9fca":deep?"#3a7bc0":"#4590d0"; bx.fillRect(X,Y,16,16);
  bx.fillStyle=se===3?"#9cc0de":"#6aaee6";
  const o=Math.floor(t*4+x*3+y*5)%20; if(o<12){ bx.fillRect(X+o,Y+4,4,1); } const o2=Math.floor(t*3+x*5+y*2+7)%20; if(o2<12) bx.fillRect(X+o2,Y+11,3,1);
  if(A.hsh(x,y,Math.floor(t*2))%9===0){ bx.fillStyle="#d8eefc"; bx.fillRect(X+A.hsh(x,y,3)%14,Y+A.hsh(x,y,4)%14,1,1); }
  if(se!==3&&deep&&A.hsh(x,y,17)%4===0){ const hh=A.hsh(x,y,18), cx=X+6+hh%4, cy=Y+6+(hh>>3)%4+Math.round(Math.sin(t*1.3+x)*.6);
    const rows=[[-2,2],[-3,3],[-4,4],[-4,4],[-3,3],[-2,2]];
    bx.fillStyle="rgba(20,50,90,.35)"; bx.fillRect(cx-3,cy+4,7,1);
    rows.forEach(([a,b],i)=>{ bx.fillStyle=i<2?"#5fae4a":i<4?"#4a9a40":"#2f7a32"; bx.fillRect(cx+a,cy-3+i,b-a,1); });
    bx.fillStyle="#86cc62"; bx.fillRect(cx-2,cy-3,2,1); bx.fillRect(cx-3,cy-2,1,1);
    bx.fillStyle="#3a7bc0"; bx.fillRect(cx,cy-3,2,1); bx.fillRect(cx,cy-2,1,1); bx.fillRect(cx+1,cy-2,1,1); bx.fillRect(cx,cy-1,1,1);
    if(hh%2===0){ bx.fillStyle="#e07a9c"; bx.fillRect(cx-3,cy,3,2); bx.fillStyle="#f8c4d6"; bx.fillRect(cx-3,cy-1,1,1); bx.fillRect(cx-1,cy-1,1,1); bx.fillRect(cx-2,cy,1,1); bx.fillStyle="#ffe27a"; bx.fillRect(cx-2,cy+1,1,1); } }
  const foam=Math.floor(t*3+x+y)%2;
  if(!w(x,y-1)){ bx.fillStyle="#2c5a8a"; bx.fillRect(X,Y,16,2); bx.fillStyle="#cfe9fb"; for(let i=foam;i<16;i+=2) bx.fillRect(X+i,Y+2,1,1); }
  if(!w(x,y+1)){ bx.fillStyle="#cfe9fb"; for(let i=foam;i<16;i+=2) bx.fillRect(X+i,Y+14,1,1); bx.fillStyle="#7ab8e8"; bx.fillRect(X,Y+15,16,1); }
  if(!w(x-1,y)){ bx.fillStyle="#2c5a8a"; bx.fillRect(X,Y,1,16); bx.fillStyle="#cfe9fb"; for(let i=foam;i<16;i+=2) bx.fillRect(X+1,Y+i,1,1); }
  if(!w(x+1,y)){ bx.fillStyle="#2c5a8a"; bx.fillRect(X+15,Y,1,16); bx.fillStyle="#cfe9fb"; for(let i=foam;i<16;i+=2) bx.fillRect(X+14,Y+i,1,1); }
}
function drawGlassHouse(CX,CY){
  const x0=16*16-CX, y0=24*16-CY, w=6*16;
  const ok=S.flags.glas, frame=ok?"#f4f1ea":"#8a8a8a";
  bx.fillStyle=ok?"rgba(190,230,250,.45)":"rgba(120,130,140,.35)"; bx.fillRect(x0,y0-22,w,20);
  bx.fillStyle=frame; bx.fillRect(x0-2,y0-24,w+4,2); bx.fillRect(x0-2,y0-3,w+4,2);
  for(let i=0;i<=6;i++) bx.fillRect(x0-1+i*16,y0-24,2,22);
  if(ok){ bx.fillStyle="rgba(255,255,255,.6)"; for(let i=0;i<6;i++) bx.fillRect(x0+4+i*16,y0-20,1,8); }
  else { bx.fillStyle="#3a3a3a"; bx.fillRect(x0+20,y0-18,6,9); bx.fillRect(x0+54,y0-14,8,7); bx.fillStyle="#5a9a3a"; bx.fillRect(x0+70,y0-8,3,6); }
  bx.fillStyle="#2b1e2a"; bx.fillRect(x0-2,y0-25,w+4,1);
  bx.fillStyle=frame; bx.fillRect(x0-3,y0-24,2,3*16+24); bx.fillRect(x0+w+1,y0-24,2,3*16+24);
}
function drawTool(fx,fy){
  const k=P.tool==="seed"?S.hold:P.tool==="hacke"?"hacke":P.tool==="kanne"?"kanne":P.tool==="rute"?(S.rod===2?"rute2":"rute"):null; if(!k) return;
  const off=P.dir===2?(P.flip?-12:6):P.dir===1?-3:-3, oy=P.dir===1?-24:-14;
  bx.drawImage(icon(k),fx+off,fy+oy+Math.round(P.busy*10));
}
function drawBadge(x,y,ch){
  const b=Math.round(Math.sin(gameT*5)*1.5);
  bx.fillStyle="#2b1e2a"; bx.fillRect(x-4,y-5+b,9,10); bx.fillStyle=ch==="*"?"#f6b3c9":"#f6d55c"; bx.fillRect(x-3,y-4+b,7,8);
  bx.fillStyle="#2b1e2a"; if(ch==="!"){ bx.fillRect(x,y-3+b,1,4); bx.fillRect(x,y+2+b,1,1); } else if(ch==="?"){ bx.fillRect(x-1,y-3+b,3,1); bx.fillRect(x+1,y-2+b,1,2); bx.fillRect(x,y-1+b,1,1); bx.fillRect(x,y+2+b,1,1); } else { bx.fillRect(x-1,y-1+b,3,3); }
}
function drawHeart(x,y,c){ bx.fillStyle=c; bx.fillRect(x+1,y,2,1); bx.fillRect(x+4,y,2,1); bx.fillRect(x,y+1,7,2); bx.fillRect(x+1,y+3,5,1); bx.fillRect(x+2,y+4,3,1); bx.fillRect(x+3,y+5,1,1); }
function drawAmbient(se,night){
  for(const a of AMB){
    const x=Math.round(a.x), y=Math.round(a.y);
    if(S.weather==="rain"){ bx.fillStyle="rgba(190,215,245,.55)"; bx.fillRect(x,y,1,4); }
    else if(S.weather==="snow"||se===3){ bx.fillStyle="rgba(255,255,255,.9)"; bx.fillRect(x,y,a.v>1?2:1,a.v>1?2:1); }
    else if(se===1&&night){ const on=Math.sin(gameT*3+a.p)>0; if(on){ bx.fillStyle="#f6f08a"; bx.fillRect(x,y,1,1); bx.fillStyle="rgba(246,240,138,.3)"; bx.fillRect(x-1,y-1,3,3); } }
    else if(se===0){ bx.fillStyle=a.p>3?"#f6b3c9":"#ffffff"; bx.fillRect(x,y,2,1); }
    else if(se===2){ bx.fillStyle=a.p>3?"#e8842a":"#c94a2a"; bx.fillRect(x,y,2,2); }
    else if(se===1&&a.p<2){ bx.fillStyle="rgba(255,255,220,.7)"; bx.fillRect(x,y,1,1); }
  }
  if(S.weather==="rain"){ bx.fillStyle="rgba(40,60,100,.12)"; bx.fillRect(0,0,LW,LH); }
}
function drawFestDecor(f,CX,CY,night){
  const cols=f.id==="mond"?["#f3c34a","#e8483a"]:f.id==="sterne"?["#cfe3ff","#f6f08a"]:["#f28fb0","#f6d55c","#7ac8f0","#a8e07a"];
  for(const yy of [7,14]){ for(let i=0;i<=7*16;i+=4){ const x=12*16+8+i-CX, y=yy*16-10+Math.round(Math.sin(i/112*Math.PI)*6)-CY; bx.fillStyle="#3a2a2a"; bx.fillRect(x,y,4,1); if(i%8===0){ bx.fillStyle=cols[(i/8)%cols.length]; bx.fillRect(x,y+1,2,f.id==="mond"?3:2); } } }
  if(f.id==="blumen") for(let i=0;i<10;i++){ const a=i/10*Math.PI*2; bx.fillStyle=cols[i%4]; bx.fillRect(Math.round(16*16-CX+Math.cos(a)*24),Math.round(11*16-CY+Math.sin(a)*16),2,2); }
}
function drawFireworks(){
  if(rnd()<.06) FX.push(...Array.from({length:24},(_,i)=>{ const a=i/24*Math.PI*2, cx=cam.x+20+rnd()*(LW-40), cy=cam.y+10+rnd()*LH*.4, c=pick(["#f6d55c","#e8483a","#7ac8f0","#f28fb0","#a8e07a"]); return {x:cx,y:cy,vx:Math.cos(a)*40,vy:Math.sin(a)*40,l:1,c,g:20,s:1}; }));
}
function drawLanterns(){
  for(let i=0;i<14;i++){ const p=((gameT*.08+i*.137)%1), x=Math.round((i*53)%LW+Math.sin(gameT+i)*6), y=Math.round(LH*(1-p)); bx.fillStyle="rgba(255,190,90,.25)"; bx.fillRect(x-2,y-2,7,9); bx.fillStyle="#f3a83a"; bx.fillRect(x,y,3,5); bx.fillStyle="#ffe08a"; bx.fillRect(x+1,y+1,1,3); }
}
function drawMoon(){
  const r=Math.min(VW,VH)*.16, x=VW*.72, y=VH*.2, a=Math.min(1,FESTFX.moon/3);
  ctx.save(); ctx.globalAlpha=a; const g=ctx.createRadialGradient(x,y,r*.6,x,y,r*2.6); g.addColorStop(0,"rgba(255,235,170,.45)"); g.addColorStop(1,"rgba(255,235,170,0)"); ctx.fillStyle=g; ctx.fillRect(x-r*3,y-r*3,r*6,r*6);
  ctx.fillStyle="#fff1c4"; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); ctx.fillStyle="rgba(220,200,150,.5)"; [[-.3,-.2,.18],[.25,.15,.12],[-.05,.35,.1]].forEach(([dx,dy,rr])=>{ ctx.beginPath(); ctx.arc(x+dx*r,y+dy*r,rr*r,0,Math.PI*2); ctx.fill(); }); ctx.restore();
}
function drawArrow(CX,CY){
  const t=routeTarget(questTarget()); if(!t) return;
  const sx=((t.x*16+8)-CX)*SC, sy=((t.y*16)-CY)*SC;
  const pad=60*DPR, top=150*DPR, bot=VH-150*DPR;
  const on=sx>pad&&sx<VW-pad&&sy>top&&sy<bot;
  const bob=Math.sin(gameT*5)*6*DPR;
  ctx.save();
  if(on){
    if(Math.hypot(P.x-t.x,P.y-t.y)<1.6&&!t.exit){ ctx.restore(); return; }
    const x=sx, y=sy-18*DPR+bob, s=10*DPR;
    ctx.translate(x,y); ctx.fillStyle="#f6d55c"; ctx.strokeStyle="#2b1e2a"; ctx.lineWidth=3*DPR;
    ctx.beginPath(); ctx.moveTo(-s,-s*1.2); ctx.lineTo(s,-s*1.2); ctx.lineTo(0,s*.4); ctx.closePath(); ctx.stroke(); ctx.fill();
  } else {
    const px=(P.x*16+8-CX)*SC, py=(P.y*16-CY)*SC, ang=Math.atan2(sy-py,sx-px);
    const cx=VW/2, cy=(top+bot)/2, rx=VW/2-pad, ry=(bot-top)/2;
    const k=Math.min(Math.abs(rx/Math.cos(ang)),Math.abs(ry/Math.sin(ang)));
    const x=cx+Math.cos(ang)*k*.92, y=cy+Math.sin(ang)*k*.92, s=12*DPR;
    ctx.translate(x,y); ctx.rotate(ang); ctx.fillStyle="#f6d55c"; ctx.strokeStyle="#2b1e2a"; ctx.lineWidth=3*DPR;
    ctx.beginPath(); ctx.moveTo(s*1.3+bob*.5,0); ctx.lineTo(-s*.6,-s); ctx.lineTo(-s*.2,0); ctx.lineTo(-s*.6,s); ctx.closePath(); ctx.stroke(); ctx.fill();
  }
  ctx.restore();
}

/* ================= Start ================= */
function startGame(st,isNew){
  S=migrate(st); demo=false; ZOOM=S.zoom||1; resize();
  dogSprites();
  MAPS=JM.buildMaps();
  setMap(S.map||"farm",S.px,S.py);
  if(!walkT(Math.round(P.x),Math.round(P.y))) setMap("farm",5,8);
  $("title").hidden=true; $("hud").hidden=false; $("bottom").hidden=false;
  running=true; hud(); hotbar();
  if(musicGain) musicGain.gain.value=S.music?.05:0;
  if(isNew){
    S.mail.push(...S.mailQ.splice(0)); S.mail.forEach(m=>m.read=false);
    S.board=null; spawnRocks(); spawnMess(); spawnForage("farm",2); spawnForage("forest",7); spawnForage("village",1);
    S.tomorrow=rollWeather(2);
    activateQuest(); save(true);
    setTimeout(()=>dialog([
      {who:null,text:"Der Mondhof. Lange stand er leer, jetzt ist er deiner."},
      {who:null,text:fmtD("{d0} und {d1} rennen schon über die Wiese und schnuppern an allem.")},
      {who:"player",text:fmtD("Aus dem Haus duftet es nach Kaffee. {von} hat mir einen Brief auf den Tisch gelegt. Mal sehen, was drinsteht.")}
    ],()=>showLetter()),500);
  } else { activateQuest(); note("Willkommen zurück, "+S.name+"."); }
  if(!S.daily||S.daily.day!==S.day) makeDaily();
  if(!S.rocks) spawnRocks();
  if(!S.mess) S.mess=[];
  updateQuestUI();
}
function demoState(){ const s=newState("Janina",JM.CONFIG.pudel.map((p,i)=>({name:p.name||["Lilly","Coco"][i],fell:p.fell}))); s.min=1290; return s; }
let saved=null;
function menu(){
  const m=$("menu");
  const fo=sel=>Object.entries(JM.FELL).map(([k,v])=>`<option value="${k}" ${k===sel?"selected":""}>${v.n}</option>`).join("");
  if(saved&&!m.dataset.form){
    const se=Math.floor((saved.day-1)/JM.DPS)%4;
    m.innerHTML=`<button class="btn big" id="cont">Weiterspielen</button><p class="savedinfo">${dayInS(saved)}. ${JM.SEASONS[se]} · ${saved.money.toLocaleString("de-DE")} G</p><button class="btn alt big" id="neu">Neuer Hof</button>`;
    $("cont").onclick=()=>{ audioInit(); startGame(saved,false); };
    $("neu").onclick=()=>{ m.dataset.form="1"; menu(); };
    return;
  }
  m.innerHTML=`<h2>Wer zieht ein?</h2>
    <label for="f-name">Dein Name</label><input id="f-name" maxlength="16" value="${esc(JM.CONFIG.spielerin)}" autocomplete="off">
    <label for="f-d0">Erster Pudel</label><div class="two"><input id="f-d0" maxlength="14" placeholder="Name" value="${esc(JM.CONFIG.pudel[0].name)}" autocomplete="off"><select id="f-f0" aria-label="Fellfarbe erster Pudel">${fo(JM.CONFIG.pudel[0].fell)}</select></div>
    <label for="f-d1">Zweiter Pudel</label><div class="two"><input id="f-d1" maxlength="14" placeholder="Name" value="${esc(JM.CONFIG.pudel[1].name)}" autocomplete="off"><select id="f-f1" aria-label="Fellfarbe zweiter Pudel">${fo(JM.CONFIG.pudel[1].fell)}</select></div>
    ${saved?`<p class="warn" id="warn" hidden>Dein bisheriger Hof wird ersetzt. Nochmal tippen zum Bestätigen.</p>`:""}
    <button class="btn big" id="go">Auf den Hof</button>${saved?`<button class="btn alt big" id="back">Zurück</button>`:""}`;
  let armed=false;
  $("go").onclick=()=>{
    audioInit();
    if(saved&&!armed){ armed=true; $("warn").hidden=false; return; }
    const st=newState($("f-name").value.trim()||"Janina",[{name:$("f-d0").value.trim(),fell:$("f-f0").value},{name:$("f-d1").value.trim(),fell:$("f-f1").value}]);
    startGame(st,true);
  };
  if(saved) $("back").onclick=()=>{ delete m.dataset.form; menu(); };
}
const dayInS=s=>((s.day-1)%JM.DPS)+1;
function boot(data){
  initSprites();
  S=demoState(); dogSprites(); setMap("farm",5,8); running=true; demo=true;
  DOGS.forEach((d,i)=>{ d.x=4+i*2; d.y=8.3; });
  saved=lsLoad(); menu();
  if(data&&data.state){ startGame(data.state,false); return; }
  cloudLoad().then(c=>{ if(c&&(!saved||c.t>saved.t)&&demo){ saved=c; if(!$("menu").dataset.form) menu(); } });
  if(window.claude&&window.claude.use) downloadsReady=window.claude.use("downloads").catch(()=>null);
}
const hot=window.claude&&window.claude.hot;
if(hot&&hot.snapshot) hot.snapshot(()=>({state:demo?null:S}));
if(hot&&hot.ready) hot.ready(boot); else boot(hot&&hot.data||{});
document.addEventListener("visibilitychange",()=>{ if(document.hidden) save(true); });
addEventListener("pagehide",()=>{ if(!demo&&S) save(true); });
requestAnimationFrame(loop);
JM.ENG={get M(){return M;},get S(){return S;},P,RA,get DOGS(){return DOGS;},get HENS(){return HENS;},get COWS(){return COWS;},get NPCA(){return NPCA;},get gameT(){return gameT;},
  season,fieldAt,isField,isGlass,icon,playerLook:()=>JM.lookFrom(S.look),reneLook:reneLookObj,npcInside:()=>!!(M.owner&&npcPlace(M.owner)==="in"),unread:()=>S.mail.some(m=>!m.read),marketDay,
  cooking:()=>renePlan().mode==="cook"&&RA.vis,tvOn:()=>S.min>=1080&&S.min<1380,bushBer:o=>season()===1&&(S.bush[M.id+":"+o.x+","+o.y]||0)<=S.day,
  giant:c=>!!c.g,cropStage:c=>{ const cr=CROPS[c.k]; return c.a===0?0:c.a>=cr.days?4:c.a/cr.days<.34?1:c.a/cr.days<.67?2:3; },zoom:()=>ZOOM,camSnap:()=>snap3};
window.JMDEBUG={star:()=>STAR,RA,renePlan,reneTalk,spawnMess,get qid(){const q=curQ(); return q?q.id:'ende';},set speed(v){TESTSPEED=v;},get scale(){return SC/DPR;},get audio(){return AC?AC.state:null;},get DOGS(){return DOGS;},get HENS(){return HENS;},tap:(tx,ty)=>tapAt(tx+.5,ty+.5,tx,ty),swipe:t=>{P.queue=t.slice();},get idle(){return !P.path.length&&!P.act&&!P.queue.length&&P.busy<=0;},get busy(){return {ui:UI,fish:FISH.phase};},dlgNext:()=>nextLine(),give,openHouse,openBag,openMail,openBundles,openCook,talk,giveGift,cam,FISH,fishTap,get NPCA(){return NPCA;},get S(){return S;},emit,endDay,setMap,startGame,newState,P,fieldPlan,doField,openBook,openShop,npcInteract,runFest:id=>runFest(JM.FESTS.find(f=>f.id===id)),get M(){return M;}};
})();
