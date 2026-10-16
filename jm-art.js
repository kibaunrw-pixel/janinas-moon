"use strict";
/* Janinas Moon – Pixel-Art-Erzeugung. Alles wird zur Laufzeit in kleine Canvas gezeichnet (1 Pixel = 1 Spielpixel). */
(function(){
const A = (window.JM = window.JM || {}).ART = {};

/* ---------- Grundwerkzeuge ---------- */
function cnv(w,h){ const c=document.createElement("canvas"); c.width=w; c.height=h; return c; }
function hex(h){ h=h.replace("#",""); if(h.length===3) h=h.split("").map(c=>c+c).join(""); const n=parseInt(h,16); return [n>>16&255,n>>8&255,n&255]; }
function toHex(r,g,b){ return "#"+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0")).join(""); }
function shade(h,a){ const [r,g,b]=hex(h); return a>=0?toHex(r+(255-r)*a,g+(255-g)*a,b+(255-b)*a):toHex(r*(1+a),g*(1+a),b*(1+a)); }
function mix(h1,h2,t){ const a=hex(h1),b=hex(h2); return toHex(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t); }
A.shade=shade; A.mix=mix; A.cnv=cnv; A.hex=hex;
function G(c){
  const x=c.getContext("2d");
  const g={ctx:x,
    r(px,py,w,h,col){ if(w<=0||h<=0) return; x.fillStyle=col; x.fillRect(Math.round(px),Math.round(py),Math.round(w),Math.round(h)); },
    p(px,py,col){ x.fillStyle=col; x.fillRect(Math.round(px),Math.round(py),1,1); },
    disc(cx,cy,rad,col){ x.fillStyle=col; for(let y=Math.floor(cy-rad);y<=Math.ceil(cy+rad);y++) for(let xx=Math.floor(cx-rad);xx<=Math.ceil(cx+rad);xx++){ const dx=xx+.5-cx, dy=y+.5-cy; if(dx*dx+dy*dy<=rad*rad) x.fillRect(xx,y,1,1);} },
    ell(cx,cy,rx,ry,col){ x.fillStyle=col; for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++) for(let xx=Math.floor(cx-rx);xx<=Math.ceil(cx+rx);xx++){ const dx=(xx+.5-cx)/rx, dy=(y+.5-cy)/ry; if(dx*dx+dy*dy<=1) x.fillRect(xx,y,1,1);} },
    line(x0,y0,x1,y1,col,w){ w=w||1; const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))||1; for(let i=0;i<=n;i++){ g.r(x0+(x1-x0)*i/n,y0+(y1-y0)*i/n,w,w,col);} }
  };
  return g;
}
A.G=G;
function outline(c,col){
  const x=c.getContext("2d"), w=c.width, h=c.height, d=x.getImageData(0,0,w,h), a=d.data, [r,g,b]=hex(col);
  const mark=new Uint8Array(w*h);
  for(let y=0;y<h;y++) for(let i=0;i<w;i++){
    if(a[(y*w+i)*4+3]>0) continue;
    if((i>0&&a[(y*w+i-1)*4+3]>40)||(i<w-1&&a[(y*w+i+1)*4+3]>40)||(y>0&&a[((y-1)*w+i)*4+3]>40)||(y<h-1&&a[((y+1)*w+i)*4+3]>40)) mark[y*w+i]=1;
  }
  for(let k=0;k<w*h;k++) if(mark[k]){ a[k*4]=r; a[k*4+1]=g; a[k*4+2]=b; a[k*4+3]=255; }
  x.putImageData(d,0,0); return c;
}
A.outline=outline;
function flipC(c){ const f=cnv(c.width,c.height), x=f.getContext("2d"); x.translate(c.width,0); x.scale(-1,1); x.drawImage(c,0,0); return f; }
A.flip=flipC;
function hsh(x,y,n){ return (((x*73856093)^(y*19349663)^((n||0)*83492791))>>>0)%1000; }
A.hsh=hsh;

/* ---------- Mini-Pixelschrift (3x5) für Schilder ---------- */
const FONT={A:"010101111101101",B:"110101110101110",C:"011100100100011",D:"110101101101110",E:"111100110100111",F:"111100110100100",G:"011100101101011",H:"101101111101101",I:"111010010010111",J:"001001001101010",K:"101101110101101",L:"100100100100111",M:"101111111101101",N:"110101101101101",O:"010101101101010",P:"110101110100100",Q:"010101101110011",R:"110101110101101",S:"011100010001110",T:"111010010010010",U:"101101101101111",V:"101101101101010",W:"101101111111101",X:"101101010101101",Y:"101101010010010",Z:"111001010100111"," ":"000000000000000"};
function text(g,str,x,y,col){ for(const ch of str){ const f=FONT[ch]||FONT[" "]; for(let i=0;i<15;i++) if(f[i]==="1") g.p(x+i%3,y+Math.floor(i/3),col); x+=4; } }
A.text=text;
A.textW=s=>s.length*4-1;

/* ---------- Farbpaletten ---------- */
A.PAL=[
  {g:"#6dbb4c",gd:"#529c3b",gl:"#8fd263",gx:"#f2a7c2",leaf:"#5aa646",leafL:"#80c75e",leafD:"#3d8434",acc:"#f6b3c9"},
  {g:"#58aa43",gd:"#3f8b34",gl:"#78c45a",gx:"#f6d55c",leaf:"#3f9a3a",leafL:"#5eb64d",leafD:"#2a742b",acc:"#e8434f"},
  {g:"#a9a64c",gd:"#8a873a",gl:"#c4bd60",gx:"#e88a2c",leaf:"#d9822b",leafL:"#f0aa44",leafD:"#a8521f",acc:"#c23a2a"},
  {g:"#e9eff4",gd:"#c9d6e2",gl:"#ffffff",gx:"#b9c8d6",leaf:"#e9eff4",leafL:"#ffffff",leafD:"#b9c8d6",acc:"#ffffff"}
];
const OUT="#2b1e2a";

/* ---------- Figuren ---------- */
// Blickrichtung: 0 unten, 1 oben, 2 seitlich (rechts). Frames 0..3: stehen, Schritt links, stehen, Schritt rechts.
function drawChar(g,L,dir,f){
  const o=1, R=(x,y,w,h,c)=>g.r(x+o,y+o,w,h,c);
  const skin=L.skin, skinD=shade(skin,-.14), hair=L.hair, hairL=shade(hair,.22), hairD=shade(hair,-.25);
  const top=L.top, topD=shade(top,-.18), topL=shade(top,.18), bot=L.bot, botD=shade(bot,-.2), shoe=L.shoes||"#5a3a24";
  const eye=L.eye||"#2a1d24", blush=L.blush||"#f0a3a3", mouth="#b4655a";
  const step=f===1?1:f===3?2:0, oy=step?-1:0;
  const legC=L.dress?skinD:bot;
  // Beine und Schuhe
  if(dir!==2){
    const lL=step===1?1:0, lR=step===2?1:0;
    R(5,18+oy,2,3-lL-oy,legC); R(9,18+oy,2,3-lR-oy,legC);
    R(5,21-lL,2,2,shoe); R(9,21-lR,2,2,shoe);
    if(dir===0){ R(5,21-lL,2,1,shade(shoe,.2)); R(9,21-lR,2,1,shade(shoe,.2)); }
  } else {
    if(step===0){ R(6,18+oy,4,3,legC); R(6,21,5,2,shoe); R(9,21,2,1,shade(shoe,.2)); }
    else if(step===1){ R(8,18+oy,2,2,legC); R(8,20,3,2,shoe); R(5,18+oy,2,3-oy,shade(legC,-.1)); R(4,21,3,2,shade(shoe,-.15)); }
    else { R(8,18+oy,2,3-oy,legC); R(8,21,3,2,shoe); R(5,18+oy,2,2,shade(legC,-.1)); R(4,20,3,2,shade(shoe,-.15)); }
  }
  const Y=oy;
  // Rumpf
  if(dir!==2){
    if(L.dress){ R(3,15+Y,10,5,bot); R(3,19+Y,10,1,botD); R(12,15+Y,1,5,botD); }
    if(L.coat){ R(4,12+Y,8,8,top); R(11,12+Y,1,8,topD); R(4,19+Y,8,1,topD); if(dir===0){ R(7,13+Y,1,6,topD); R(6,14+Y,1,1,"#f6e6a0"); R(6,17+Y,1,1,"#f6e6a0"); } }
    else { R(4,12+Y,8,6,top); R(11,12+Y,1,6,topD); R(4,17+Y,8,1,topD); R(5,12+Y,6,1,topL); }
    if(L.overall){ R(5,15+Y,6,3,bot); R(10,15+Y,1,3,botD); R(5,12+Y,1,3,bot); R(10,12+Y,1,3,bot); if(dir===0) R(7,15+Y,2,1,shade(bot,.25)); }
    if(L.apron&&dir===0){ R(5,13+Y,6,6,L.apron); R(5,13+Y,6,1,shade(L.apron,.2)); R(10,13+Y,1,6,shade(L.apron,-.15)); }
    if(L.apron&&dir===1){ R(4,15+Y,8,1,L.apron); R(7,15+Y,2,2,L.apron); }
    if(L.scarf&&dir===0){ R(5,12+Y,6,1,L.scarf); R(7,13+Y,2,2,L.scarf); }
    // Arme
    const aL=step===1?1:0, aR=step===2?1:0;
    R(3,12+Y+aL,1,5,top); R(12,12+Y+aR,1,5,topD);
    R(3,17+Y+aL,1,1,skin); R(12,17+Y+aR,1,1,skinD);
  } else {
    if(L.dress){ R(4,15+Y,8,5,bot); R(4,19+Y,8,1,botD); }
    if(L.coat){ R(5,12+Y,6,8,top); R(5,12+Y,1,8,topD); R(5,19+Y,6,1,topD); }
    else { R(5,12+Y,6,6,top); R(5,12+Y,1,6,topD); R(5,17+Y,6,1,topD); R(6,12+Y,5,1,topL); }
    if(L.overall){ R(6,15+Y,5,3,bot); R(9,12+Y,1,3,bot); }
    if(L.apron) R(10,13+Y,2,6,L.apron);
    if(L.scarf) R(9,12+Y,3,2,L.scarf);
    const ax=step===1?1:step===2?-1:0;
    R(7+ax,12+Y,2,5,topD); R(7+ax,17+Y,2,1,skin);
  }
  // Kopf
  R(7,11+Y,2,1,skinD);
  if(dir===2){ R(5,2+Y,7,9,skin); R(4,3+Y,9,7,skin); R(12,6+Y,1,2,skin); R(5,10+Y,6,1,skinD); }
  else { R(4,2+Y,8,9,skin); R(3,3+Y,10,7,skin); R(4,10+Y,8,1,skinD); }
  // Gesicht
  if(dir===0){
    if(L._blink){ R(5,7+Y,1,1,eye); R(10,7+Y,1,1,eye); R(4,7+Y,1,1,skinD); R(11,7+Y,1,1,skinD); } else { R(5,6+Y,1,2,eye); R(10,6+Y,1,2,eye); R(5,6+Y,1,1,shade(eye,.35)); R(10,6+Y,1,1,shade(eye,.35)); }
    if(!L.beard){ R(4,8+Y,1,1,blush); R(11,8+Y,1,1,blush); R(7,9+Y,2,1,mouth); }
  } else if(dir===2){
    R(10,6+Y,1,2,eye); if(!L.beard){ R(10,8+Y,1,1,blush); R(11,9+Y,1,1,mouth); }
  }
  // Haare
  const st=L.style;
  if(dir===0){
    R(4,1+Y,8,1,hair); R(3,2+Y,10,3,hair); R(5,2+Y,4,1,hairL);
    if(st==="long"){ R(3,5+Y,2,1,hair); R(11,5+Y,2,1,hair); R(6,5+Y,1,1,hair); R(2,3+Y,2,11,hair); R(12,3+Y,2,11,hair); R(3,4+Y,1,9,hairD); R(12,4+Y,1,9,hairD); R(2,13+Y,1,1,hairD); R(13,13+Y,1,1,hairD); }
    if(st==="bob"){ R(3,5+Y,10,1,hair); R(2,3+Y,2,7,hair); R(12,3+Y,2,7,hair); R(3,9+Y,1,1,hairD); R(12,9+Y,1,1,hairD); }
    if(st==="bun"){ R(6,0+Y,4,2,hair); R(7,0+Y,2,1,hairL); R(3,5+Y,1,2,hair); R(12,5+Y,1,2,hair); }
    if(st==="short"){ R(3,5+Y,1,2,hair); R(12,5+Y,1,2,hair); R(4,5+Y,2,1,hair); }
    if(st==="braid"){ R(3,5+Y,3,1,hair); R(2,3+Y,2,6,hair); R(12,3+Y,2,9,hair); R(12,12+Y,2,2,hairD); R(12,14+Y,2,2,hair); R(12,16+Y,2,1,L.tie||"#c94a3a"); }
    if(L.beard){ R(4,8+Y,8,3,hair); R(5,11+Y,6,1,hair); R(6,8+Y,4,1,hairD); R(7,10+Y,2,1,hairL); }
    if(L.glasses){ R(4,5+Y,3,1,L.glasses); R(9,5+Y,3,1,L.glasses); R(7,5+Y,2,1,L.glasses); }
    if(L.clip){ R(11,3+Y,2,2,L.clip); R(11,3+Y,1,1,"#ffffff"); }
  } else if(dir===1){
    R(4,1+Y,8,1,hair); R(3,2+Y,10,8,hair); R(4,10+Y,8,1,hairD); R(5,2+Y,5,1,hairL);
    if(st==="long"){ R(2,3+Y,2,11,hair); R(12,3+Y,2,11,hair); R(4,10+Y,8,4,hair); R(4,13+Y,8,1,hairD); }
    if(st==="bob") R(3,9+Y,10,2,hair);
    if(st==="bun"){ R(6,0+Y,4,2,hair); }
    if(st==="braid"){ R(7,10+Y,2,7,hair); R(7,12+Y,2,1,hairD); R(7,15+Y,2,1,hairD); R(7,17+Y,2,1,L.tie||"#c94a3a"); }
    if(L.clip){ R(4,3+Y,2,2,L.clip); }
  } else {
    R(5,1+Y,7,2,hair); R(3,2+Y,6,4,hair); R(10,3+Y,2,2,hair); R(6,1+Y,4,1,hairL);
    if(st==="long"){ R(2,3+Y,4,11,hair); R(2,4+Y,1,9,hairD); R(5,13+Y,1,1,hairD); }
    if(st==="bob"){ R(3,3+Y,4,7,hair); R(3,9+Y,4,1,hairD); }
    if(st==="bun"){ R(2,1+Y,3,3,hair); }
    if(st==="short"){ R(3,3+Y,4,4,hair); }
    if(st==="braid"){ R(3,3+Y,3,6,hair); R(3,9+Y,2,7,hair); R(3,11+Y,2,1,hairD); R(3,14+Y,2,1,hairD); R(3,16+Y,2,1,L.tie||"#c94a3a"); }
    if(L.beard){ R(8,7+Y,5,4,hair); R(10,7+Y,3,1,hairD); }
    if(L.glasses){ R(9,5+Y,3,1,L.glasses); R(6,6+Y,3,1,L.glasses); }
    if(L.clip){ R(6,2+Y,2,2,L.clip); }
  }
  // Hüte
  if(L.hat==="chef"){ if(dir===2){ R(5,-1+Y+1,7,3,"#ffffff"); R(5,2+Y,7,1,"#dcdce4"); } else { R(4,0+Y,8,3,"#ffffff"); R(3,0+Y,10,2,"#ffffff"); R(4,3+Y,8,1,"#dcdce4"); } }
  if(L.hat==="cap"){ const hc=L.hatC, hd=shade(hc,-.25); if(dir===0){ R(3,1+Y,10,3,hc); R(4,0+Y,8,1,hc); R(3,4+Y,10,1,hd); } else if(dir===1){ R(3,1+Y,10,4,hc); R(4,0+Y,8,1,hc); } else { R(4,1+Y,8,3,hc); R(5,0+Y,6,1,hc); R(10,3+Y,4,1,hd); } }
}
// Randlicht: linke Kante heller, rechte Kante dunkler – Figuren wirken runder
function rim(c){ const x=c.getContext("2d"), w=c.width, h=c.height, d=x.getImageData(0,0,w,h), a=d.data, src=new Uint8ClampedArray(a);
  const op=(i,y)=>i>=0&&i<w&&y>=0&&y<h&&src[(y*w+i)*4+3]>40;
  for(let y=0;y<h;y++) for(let i=0;i<w;i++){ const k=(y*w+i)*4; if(src[k+3]<=40) continue;
    let f=0; if(!op(i-1,y)) f=.22; else if(!op(i+1,y)) f=-.2; else if(!op(i,y+1)) f=-.12;
    if(f>0){ a[k]+= (255-a[k])*f; a[k+1]+=(255-a[k+1])*f; a[k+2]+=(255-a[k+2])*f; } else if(f<0){ a[k]*=1+f; a[k+1]*=1+f; a[k+2]*=1+f; } }
  x.putImageData(d,0,0); }
A.char=function(L){
  const out={down:[],up:[],side:[],sideL:[],portrait:null};
  for(let d=0;d<3;d++) for(let f=0;f<4;f++){
    const c=cnv(18,26); drawChar(G(c),L,d,f); rim(c); outline(c,OUT);
    if(d===0) out.down.push(c); else if(d===1) out.up.push(c); else { out.side.push(c); out.sideL.push(flipC(c)); }
  }
  const p=cnv(18,15); p.getContext("2d").drawImage(out.down[0],0,0,18,15,0,0,18,15); out.portrait=p;
  { const c=cnv(18,26); drawChar(G(c),Object.assign({},L,{_blink:true}),0,0); rim(c); outline(c,OUT); out.blink=c; }
  return out;
};

/* ---------- Tiere ---------- */
A.poodle=function(F,collar){
  const frames=[];
  const [cr,cg,cb]=hex(F.c);
  for(let f=0;f<4;f++){
    const c=cnv(23,19), g=G(c), o=1;
    const D=(x,y,r,col)=>g.disc(x+o,y+o,r,col), R=(x,y,w,h,col)=>g.r(x+o,y+o,w,h,col);
    const sit=f===3, l1=f===1?1:0, l2=f===2?1:0;
    if(!sit){
      [[5,l1],[7,l2],[13,l2],[15,l1]].forEach(([x,l])=>{ R(x,10,2,5-l,F.s); D(x+1,15.3-l,1.7,F.c); });
      R(6,6,8,5,F.c); D(5.5,8.2,3.2,F.c); D(13,7.8,3.3,F.c);
      R(3,4,1,3,F.s); D(3,3,2.2,F.c);
    } else {
      R(13,10,2,4,F.s); D(14,14.3,1.7,F.c); D(7,10.5,3.8,F.c); D(9,13.5,2,F.c); D(12,8,3.2,F.c); R(3,9,1,3,F.s); D(3,8,2.1,F.c);
    }
    D(15.5,4.6,3.1,F.c); D(15.2,1.9,2.3,F.c);
    R(17,5,3,2,shade(F.c,.1)); R(19,5,1,1,"#2a1e22");
    R(13,5,2,4,F.s); D(14,8.4,1.6,F.s);
    R(16,4,1,1,F.e);
    R(13,8,3,1,collar);
    // Locken-Struktur
    const x=c.getContext("2d"), d=x.getImageData(0,0,c.width,c.height), a=d.data, [lr,lg,lb]=hex(shade(F.c,.18)), [sr,sg,sb]=hex(shade(F.c,-.12));
    for(let y=0;y<c.height;y++) for(let i=0;i<c.width;i++){ const k=(y*c.width+i)*4; if(a[k+3]&&a[k]===cr&&a[k+1]===cg&&a[k+2]===cb){ if((i*7+y*3)%5===0){a[k]=lr;a[k+1]=lg;a[k+2]=lb;} else if((i*3+y*5)%7===0){a[k]=sr;a[k+1]=sg;a[k+2]=sb;} } }
    x.putImageData(d,0,0);
    outline(c,F.out||OUT);
    frames.push(c);
  }
  return {r:frames,l:frames.map(flipC)};
};
A.chicken=function(col){
  const frames=[]; const body=col||"#f7f5ee", bd=shade(body,-.12);
  for(let f=0;f<3;f++){
    const c=cnv(16,15), g=G(c), o=1, R=(x,y,w,h,cc)=>g.r(x+o,y+o,w,h,cc), E=(x,y,rx,ry,cc)=>g.ell(x+o,y+o,rx,ry,cc);
    const peck=f===2;
    R(5,10,1,2+(f===1?0:1),"#e8a43a"); R(8,10,1,2+(f===1?1:0),"#e8a43a");
    E(6.5,7.5,4.6,3.4,body); E(2.5,5,2,2.4,bd); R(4,8,5,2,bd);
    const hx=peck?11:10, hy=peck?6:3;
    E(hx+.5,hy+1.5,2.3,2.3,body); R(hx,hy-1,2,1,"#d94a3a"); R(hx+1,hy-2,1,1,"#d94a3a"); R(hx+2,hy+1,2,1,"#e8a43a"); R(hx+1,hy+1,1,1,"#222"); R(hx+2,hy+3,1,1,"#d94a3a");
    outline(c,"#3a2a2a"); frames.push(c);
  }
  return {r:frames,l:frames.map(flipC)};
};
A.cow=function(brown){
  const frames=[]; const W="#f4f1ea", S=brown?"#8a5a33":"#2f2f35";
  for(let f=0;f<3;f++){
    const c=cnv(30,23), g=G(c), o=1, R=(x,y,w,h,cc)=>g.r(x+o,y+o,w,h,cc);
    const a=f===1?1:0, b=f===2?1:0;
    [[6,a],[9,b],[18,b],[21,a]].forEach(([x,l])=>{ R(x,14,2,5-l,W); R(x,19-l,2,1,"#5a4a40"); });
    R(5,6,19,9,W); R(6,5,17,1,W); R(5,14,19,1,shade(W,-.1));
    R(8,7,5,4,S); R(15,6,4,3,S); R(18,10,3,3,S); R(6,11,3,2,S);
    R(12,15,4,2,"#f0a8b0");
    R(3,6,1,6,shade(W,-.1)); R(2,11,2,2,S);
    R(22,2,6,8,W); R(26,6,3,4,"#f0a8b0"); R(27,7,1,1,"#a05a60"); R(24,4,1,1,"#222"); R(21,3,2,2,S); R(23,1,1,1,"#e9dfc8"); R(26,1,1,1,"#e9dfc8");
    outline(c,"#3a2a2a"); frames.push(c);
  }
  return {r:frames,l:frames.map(flipC)};
};

/* ---------- Bäume, Büsche ---------- */
A.tree=function(se,kind,v){
  const c=cnv(34,46), g=G(c), P=A.PAL[se], o=1;
  const R=(x,y,w,h,cc)=>g.r(x+o,y+o,w,h,cc), D=(x,y,r,cc)=>g.disc(x+o,y+o,r,cc);
  const bark="#6b4423", barkL="#8a5a33", barkD="#4f311a";
  if(kind==="pine"){
    R(14,34,5,9,bark); R(14,34,2,9,barkL); R(12,42,9,1,barkD);
    const pc=se===3?"#2f5a3c":"#2f6b3a", pl=se===3?"#3e7a4c":"#3f8a4a", pd="#22502c";
    for(let i=0;i<4;i++){ const y0=4+i*8, half=5+i*3; for(let y=0;y<11;y++){ const w=Math.round(half*(y+2)/12); R(16-w,y0+y,w*2+1,1,y<3?pl:(y>8?pd:pc)); }
      if(se===3){ R(16-half*0.5,y0+2,half,1,"#ffffff"); R(16-half*0.7,y0+3,half*1.4,1,"#eef4f8"); }
    }
    if(se===3) R(15,2,3,2,"#ffffff");
  } else {
    R(13,26,7,16,bark); R(13,26,2,16,barkL); R(18,26,2,16,barkD); R(11,41,11,2,barkD); R(12,40,3,1,bark); R(18,40,3,1,bark);
    if(se===3){
      g.line(16+o,30+o,7+o,13+o,bark,2); g.line(17+o,28+o,26+o,10+o,bark,2); g.line(16+o,27+o,16+o,6+o,bark,2); g.line(11+o,20+o,5+o,18+o,bark,1); g.line(22+o,18+o,29+o,17+o,bark,1);
      R(7,12,3,1,"#ffffff"); R(25,9,3,1,"#ffffff"); R(15,5,3,1,"#ffffff"); R(5,17,2,1,"#ffffff"); R(28,16,2,1,"#ffffff");
    } else {
      const L=P.leaf, LL=P.leafL, LD=P.leafD;
      const blobs=[[16,15,11],[8,20,7.5],[25,20,7.5],[16,23,9],[10,11,6.5],[23,11,6.5],[16,7,6]];
      blobs.forEach(([x,y,r])=>D(x+1,y+1.5,r,LD));
      blobs.forEach(([x,y,r])=>D(x,y,r,L));
      [[12,9,4],[20,8,3.5],[8,17,3.5],[16,14,4],[24,16,3]].forEach(([x,y,r])=>D(x-1,y-1,r,LL));
      // Blätterbüschel: Struktur mit Licht oben und Schatten unten
      { const cx2=c.getContext("2d"), dat=cx2.getImageData(0,0,c.width,c.height).data, a=(px,py)=>dat[(py*c.width+px)*4+3]>0;
        for(let i=0;i<90;i++){ const h=hsh(i,(v||0)+7,se+3), px=2+h%30, py=2+(h>>5)%26; if(!a(px,py)||!a(px+2,py+2)||!a(px-1,py)) continue;
          const top=py<14; R(px,py,2,1,top?LL:L); R(px+1,py+1,2,1,top?L:LD); if(!top) R(px,py+2,1,1,A.shade(LD,-.15)); } }
      for(let i=0;i<14;i++){ const h=hsh(i,v||0,se); R(4+h%26,4+(h>>5)%22,1,1,i%2?LD:LL); }
      if(se===0||(kind==="fruit"&&se===1)){ for(let i=0;i<9;i++){ const h=hsh(i,v||1,7); R(5+h%24,5+(h>>5)%20,2,2,se===0?P.acc:"#e8434f"); } }
      if(se===2){ for(let i=0;i<6;i++){ const h=hsh(i,v||2,9); R(6+h%22,6+(h>>5)%18,1,1,P.acc); } }
    }
  }
  if(kind==="pine") sphereLight(c,17,22,17); else if(se!==3) sphereLight(c,17,16,16);
  outline(c,"#23291f"); return c;
};
A.bush=function(se,berries){
  const c=cnv(20,18), g=G(c), P=A.PAL[se], o=1, D=(x,y,r,cc)=>g.disc(x+o,y+o,r,cc);
  const L=se===3?"#dfe7ee":P.leaf, LD=se===3?"#b9c8d6":P.leafD, LL=se===3?"#ffffff":P.leafL;
  [[6,10,5],[12,10,5],[9,7,5],[9,11,5.5]].forEach(([x,y,r])=>D(x+.5,y+1,r,LD));
  [[6,10,5],[12,10,5],[9,7,5],[9,11,5.5]].forEach(([x,y,r])=>D(x,y,r,L));
  D(7,6,2.5,LL); D(12,8,2,LL);
  if(berries) [[5,9],[9,6],[13,10],[8,12],[11,13],[6,13]].forEach(([x,y])=>{ g.r(x+o,y+o,2,2,"#c42a4a"); g.p(x+o,y+o,"#f27a8a"); });
  sphereLight(c,10,9,9); outline(c,"#23291f"); return c;
};

/* ---------- Gebäude ---------- */
function planksH(g,x,y,w,h,c){ g.r(x,y,w,h,c); for(let j=y+3;j<y+h;j+=4) g.r(x,j,w,1,shade(c,-.18)); for(let j=y;j<y+h;j+=4) g.r(x,j,w,1,shade(c,.1)); for(let j=y;j<y+h;j+=4){ const off=(j/4)%2?7:15; for(let i=x+off;i<x+w;i+=16) g.r(i,j,1,3,shade(c,-.18)); } }
function planksV(g,x,y,w,h,c){ g.r(x,y,w,h,c); for(let i=x+3;i<x+w;i+=4) g.r(i,y,1,h,shade(c,-.2)); for(let i=x;i<x+w;i+=4) g.r(i,y,1,h,shade(c,.08)); }
function shingles(g,x0,y0,rows,wFn,c0){ for(let r=0;r<rows;r++){ const c=shade(c0,.1-.22*r/Math.max(1,rows-1)), d=shade(c,-.2), l=shade(c,.15); const [x,w]=wFn(r); const y=y0+r; g.r(x,y,w,1,(r%4===3)?d:c); if(r%4===0) g.r(x,y,w,1,l); if(r%4===1){ for(let i=x+((r/4|0)%2?2:6);i<x+w;i+=8) g.r(i,y,1,3,d);} } }
function windowF(g,x,y,w,h,night,frame){ frame=frame||"#f0e3c8"; g.r(x-1,y-1,w+2,h+2,frame); g.r(x,y,w,h,night?"#ffd77a":"#8fc3e4"); if(!night){ g.r(x+1,y+1,2,1,"#d8eefa"); g.r(x+1,y+2,1,1,"#d8eefa"); g.r(x,y+h-2,w,2,"#7ab0d6"); } else { g.r(x,y,w,1,"#ffe9a8"); } g.r(x+(w>>1),y,1,h,frame); g.r(x,y+(h>>1),w,1,frame); }
function snowRoof(g,x0,y0,rows,wFn){ for(let r=0;r<rows;r++){ const [x,w]=wFn(r); g.r(x,y0+r,w,1,r<rows-2?"#ffffff":"#e3ecf3"); } }
function stones(g,x,y,w,h){ g.r(x,y,w,h,"#9d958a"); for(let j=y;j<y+h;j+=4){ const off=((j-y)/4)%2?3:0; for(let i=x+off;i<x+w;i+=7){ g.r(i,j,6,3,"#b3ab9f"); g.r(i,j,6,1,"#c6bfb3"); } } }
function lantern(g,x,y){ g.r(x+1,y-2,1,2,"#3a2a2a"); g.r(x,y,3,4,"#d9382f"); g.r(x-1,y+1,5,2,"#e8483a"); g.r(x+1,y+1,1,2,"#ffd77a"); g.r(x,y+4,3,1,"#f3c34a"); g.r(x+1,y+5,1,2,"#f3c34a"); }

// Kugel-Licht: oben links hell, unten rechts dunkel – Kronen und Büsche wirken rund
function sphereLight(c,cx,cy,r){ const x=c.getContext("2d"); x.save(); x.globalCompositeOperation="source-atop";
  const gr=x.createRadialGradient(cx-r*.35,cy-r*.4,0,cx,cy,r*1.25); gr.addColorStop(0,"rgba(255,250,215,.26)"); gr.addColorStop(.38,"rgba(255,250,215,0)"); gr.addColorStop(.7,"rgba(15,25,45,.08)"); gr.addColorStop(1,"rgba(15,25,45,.36)");
  x.fillStyle=gr; x.fillRect(0,0,c.width,c.height); x.restore(); }
A.sphereLight=sphereLight;
// Licht von links oben: linke Hälfte heller, rechte und untere Kante dunkler
function lightPass(c){ const x=c.getContext("2d"), w=c.width, h=c.height; x.save(); x.globalCompositeOperation="source-atop";
  let gr=x.createLinearGradient(0,0,w,0); gr.addColorStop(0,"rgba(255,240,200,.18)"); gr.addColorStop(.45,"rgba(255,240,200,0)"); gr.addColorStop(.7,"rgba(20,10,40,0)"); gr.addColorStop(1,"rgba(20,10,40,.28)"); x.fillStyle=gr; x.fillRect(0,0,w,h);
  gr=x.createLinearGradient(0,0,0,h); gr.addColorStop(0,"rgba(255,250,230,.08)"); gr.addColorStop(.3,"rgba(0,0,0,0)"); gr.addColorStop(.85,"rgba(20,10,40,0)"); gr.addColorStop(1,"rgba(20,10,40,.18)"); x.fillStyle=gr; x.fillRect(0,0,w,h); x.restore(); }
A.building=function(kind,se,night){
  let c,g,lights=[];
  const win=se===3;
  if(kind==="house"){
    c=cnv(84,116); g=G(c);
    stones(g,4,102,76,12);
    planksH(g,6,58,72,46,"#c98f5a");
    g.r(6,58,72,2,"#8a5a33");
    const roof=r=>{ const w=Math.round(48+r*36/52); return [42-w/2,w]; };
    g.r(58,2,10,22,"#8c6a5a"); g.r(58,2,10,2,"#a8887a"); g.r(66,4,2,20,"#6e5244");
    shingles(g,0,8,52,roof,"#b5523b");
    g.r(18,6,48,3,"#8a3a2c");
    if(win) snowRoof(g,0,8,6,roof);
    g.r(0,58,84,3,"#7a3a2c");
    windowF(g,14,70,14,14,night); windowF(g,56,70,14,14,night);
    [[13,86],[55,86]].forEach(([x,y])=>{ g.r(x,y,16,4,"#8a5a33"); g.r(x,y,16,1,"#a8743f"); if(se<3){ for(let i=0;i<5;i++){ const cc=["#f28fb0","#f6d55c","#ffffff","#c49bf2","#f28f5c"][(i+se)%5]; g.r(x+1+i*3,y-2,2,2,cc); g.r(x+2+i*3,y-1,1,1,"#4f9e3a"); } } });
    g.r(34,74,16,30,"#5a3420"); g.r(36,76,12,28,"#8f5a35"); g.r(36,76,12,1,"#a86d43"); g.r(41,76,1,28,"#7a4a2a"); g.r(45,90,2,2,"#f3d77a");
    g.r(38,79,8,5,night?"#ffd77a":"#8fc3e4");
    stones(g,30,104,24,6);
    g.r(52,74,3,6,"#3a2a2a"); g.r(51,73,5,2,"#3a2a2a"); g.r(52,75,3,3,night?"#ffe08a":"#e8d29a");
    lights=[[21,77,30],[63,77,30],[53,76,22],[42,82,18]];
    lightPass(c); outline(c,OUT); return {c,ox:2,lights};
  }
  if(kind==="coop"){
    c=cnv(52,68); g=G(c);
    planksV(g,4,26,44,38,"#c9583f"); g.r(4,26,44,2,"#f4ead8"); g.r(4,26,2,38,"#f4ead8"); g.r(46,26,2,38,"#f4ead8");
    const roof=r=>{ const w=Math.round(14+r*38/22); return [26-w/2,w]; };
    shingles(g,0,4,24,roof,"#6b3a2c"); if(win) snowRoof(g,0,4,5,roof);
    g.r(19,44,14,20,"#3a2218"); g.r(21,46,10,18,"#4a2a1c"); g.r(17,62,18,3,"#a8743f");
    g.disc(26,34,4,"#f4ead8"); g.disc(26,34,3,night?"#ffd77a":"#8fc3e4");
    lights=[[26,34,16]];
    lightPass(c); outline(c,OUT); return {c,ox:2,lights};
  }
  if(kind==="barn"){
    c=cnv(68,90); g=G(c);
    planksV(g,4,32,60,54,"#b8442f"); g.r(4,32,60,2,"#f4ead8"); g.r(4,32,2,54,"#f4ead8"); g.r(62,32,2,54,"#f4ead8");
    const roof=r=>{ const w=r<10?Math.round(30+r*3):Math.round(60+(r-10)*0.6); return [34-w/2,w]; };
    shingles(g,0,4,30,roof,"#5a3326"); if(win) snowRoof(g,0,4,7,roof);
    g.r(22,10,24,14,"#f4ead8"); g.r(24,12,20,10,"#3a2218"); g.r(33,12,2,10,"#f4ead8");
    g.r(16,52,36,34,"#f4ead8"); g.r(18,54,32,32,"#8a3a2c"); g.line(18,54,49,85,"#f4ead8",2); g.line(49,54,18,85,"#f4ead8",2); g.r(33,54,2,32,"#f4ead8");
    lights=[];
    lightPass(c); outline(c,OUT); return {c,ox:2,lights};
  }
  if(kind==="markt"){
    c=cnv(84,84); g=G(c);
    g.r(6,24,72,56,"#efe3c8"); for(let j=26;j<80;j+=6) g.r(6,j,72,1,"#e3d4b2");
    g.r(4,6,76,20,"#3f7a4a"); shingles(g,4,6,18,()=>[4,76],"#3f7a4a"); if(win) snowRoof(g,4,6,4,()=>[4,76]);
    g.r(4,24,76,3,"#2f5a38");
    g.r(14,8,56,12,"#f4ead8"); g.r(15,9,54,10,"#7a4a2a"); A.text(g,"MARKT",42-A.textW("MARKT")/2,12,"#f6d55c");
    for(let i=0;i<10;i++) g.r(4+i*8,30,8,8,i%2?"#f4ead8":"#d9473a"); for(let i=0;i<10;i++) g.r(5+i*8,38,6,2,i%2?"#f4ead8":"#d9473a");
    windowF(g,10,46,26,18,night,"#7a4a2a");
    g.r(46,44,18,36,"#5a3420"); g.r(48,46,14,34,"#8f5a35"); g.r(50,50,10,10,night?"#ffd77a":"#8fc3e4"); g.r(59,64,2,2,"#f3d77a");
    // Kisten
    [[8,68,"#4fb04a"],[22,68,"#e8434f"],[66,68,"#f0a83a"]].forEach(([x,y,col])=>{ g.r(x,y,13,10,"#a8743f"); g.r(x,y,13,1,"#c58d52"); g.r(x,y+5,13,1,"#8a5a33"); for(let i=0;i<4;i++) g.disc(x+2+i*3,y-1,2,col); });
    lights=[[23,55,28],[55,55,22]];
    lightPass(c); outline(c,OUT); return {c,ox:2,lights};
  }
  if(kind==="nudelhaus"){
    c=cnv(92,104); g=G(c);
    g.r(10,44,72,56,"#efe3c8"); g.r(10,44,72,3,"#d8c8a4");
    [[10,44],[76,44],[34,44],[52,44]].forEach(([x])=>{ g.r(x,44,6,56,"#b8302a"); g.r(x,44,2,56,"#d9473a"); });
    const roof=r=>{ const t=r/30; const w=Math.round(64+28*Math.pow(t,1.6)); return [46-w/2,w]; };
    shingles(g,0,10,32,roof,"#3b5560"); for(let r=0;r<32;r+=4){ const [x,w]=roof(r); g.r(x,10+r,w,1,"#4f707c"); }
    g.r(0,40,6,3,"#3b5560"); g.r(86,40,6,3,"#3b5560"); g.r(0,38,3,3,"#4f707c"); g.r(89,38,3,3,"#4f707c");
    if(win) snowRoof(g,0,10,6,roof);
    g.r(14,6,64,5,"#2c4048");
    g.r(28,48,36,11,"#b8302a"); g.r(29,49,34,9,"#8a1f1c"); A.text(g,"NUDELN",46-A.textW("NUDELN")/2,51,"#f3c34a");
    [[17,64],[60,64]].forEach(([x,y])=>{ g.r(x,y,14,14,"#5a3420"); g.r(x+1,y+1,12,12,night?"#ffd77a":"#e8c9a0"); for(let i=0;i<4;i++){ g.r(x+1,y+3+i*3,12,1,"#5a3420"); g.r(x+3+i*3,y+1,1,12,"#5a3420"); } });
    g.r(40,66,12,34,"#5a3420"); g.r(41,67,10,33,"#3a2218"); g.r(41,67,10,4,"#b8302a");
    lantern(g,22,42); lantern(g,68,42); lantern(g,46,60);
    lights=[[24,48,26],[70,48,26],[47,64,20],[24,71,22],[67,71,22]];
    lightPass(c); outline(c,OUT); return {c,ox:6,lights};
  }
  if(kind==="rathaus"){
    c=cnv(100,112); g=G(c);
    stones(g,6,52,88,56); g.r(6,52,88,2,"#c6bfb3");
    shingles(g,2,34,20,r=>[2+r*0,96],"#3f5a8a"); if(win) snowRoof(g,2,34,4,()=>[2,96]);
    g.r(36,4,28,40,"#e9dfc8"); g.r(36,4,28,2,"#c6bfb3");
    const tr=r=>{ const w=Math.round(8+r*24/12); return [50-w/2,w]; }; shingles(g,0,0,12,tr,"#3f5a8a");
    g.disc(50,24,8,"#5a4a3a"); g.disc(50,24,7,"#f4f1ea"); g.r(50,18,1,7,"#2a1e22"); g.r(50,24,5,1,"#2a1e22");
    g.r(30,58,40,10,"#7a4a2a"); A.text(g,"RATHAUS",50-A.textW("RATHAUS")/2,61,"#f6d55c");
    windowF(g,12,60,12,16,night,"#e9dfc8"); windowF(g,76,60,12,16,night,"#e9dfc8"); windowF(g,12,84,12,14,night,"#e9dfc8"); windowF(g,76,84,12,14,night,"#e9dfc8");
    g.r(32,74,20,34,"#e9dfc8"); g.r(34,76,16,32,"#5a3420"); g.r(41,76,2,32,"#3a2218"); g.r(38,92,2,2,"#f3d77a"); g.r(44,92,2,2,"#f3d77a");
    g.r(80,0,1,18,"#5a4a3a"); g.r(81,1,10,6,"#d9473a"); g.r(81,4,10,1,"#f6d55c");
    lights=[[18,68,24],[82,68,24],[18,91,22],[82,91,22],[50,24,14]];
    lightPass(c); outline(c,OUT); return {c,ox:2,lights};
  }
  if(kind==="tierhof"){
    c=cnv(84,90); g=G(c);
    planksV(g,6,34,72,52,"#8a6a3a"); g.r(6,34,72,2,"#f4ead8");
    const roof=r=>{ const w=Math.round(30+r*54/28); return [42-w/2,w]; };
    shingles(g,0,4,30,roof,"#3f6a3a"); if(win) snowRoof(g,0,4,6,roof);
    g.r(20,40,44,10,"#5a3420"); A.text(g,"TIERHOF",42-A.textW("TIERHOF")/2,43,"#f6d55c");
    g.r(30,58,24,28,"#f4ead8"); g.r(32,60,20,26,"#5a3420"); g.r(41,60,2,26,"#3a2218"); g.r(38,72,2,2,"#f3d77a"); g.r(44,72,2,2,"#f3d77a");
    windowF(g,12,56,12,12,night,"#f4ead8"); windowF(g,60,56,12,12,night,"#f4ead8");
    [[4,76],[68,78]].forEach(([x,y])=>{ g.r(x,y,14,9,"#e8c95a"); g.r(x,y,14,1,"#f3dc7a"); g.r(x,y+3,14,1,"#c9a43c"); g.r(x,y+6,14,1,"#c9a43c"); });
    lights=[[18,62,22],[66,62,22]];
    lightPass(c); outline(c,OUT); return {c,ox:2,lights};
  }
  if(kind==="huette"){
    c=cnv(68,80); g=G(c);
    planksH(g,4,30,60,46,"#6f8a9a"); g.r(4,30,60,2,"#56707e");
    const roof=r=>[2+r*0,64]; shingles(g,2,8,22,roof,"#5a4a3a"); g.r(2,8,64,2,"#3a2e24"); if(win) snowRoof(g,2,8,4,roof);
    g.disc(18,48,6,"#5a4a3a"); g.disc(18,48,5,night?"#ffd77a":"#8fc3e4"); g.r(18,43,1,10,"#5a4a3a");
    g.r(32,44,14,32,"#4a3a2e"); g.r(34,46,10,30,"#6b5440"); g.r(42,60,2,2,"#f3d77a");
    for(let i=0;i<5;i++){ g.line(50+i*3,36,50+i*3,56,"#c9b98a",1); } for(let j=0;j<5;j++) g.r(49,38+j*4,14,1,"#c9b98a");
    g.disc(56,64,3,"#e8483a"); g.r(54,64,5,1,"#ffffff");
    lights=[[18,48,22]];
    lightPass(c); outline(c,OUT); return {c,ox:2,lights};
  }
  return null;
};
A.prop=function(kind,se,extra){
  let c,g;
  if(/^bau[123]$/.test(kind)){const phase=+kind.slice(3);c=cnv(82,96);g=G(c);g.r(2,69,78,25,'#a49a88');g.r(5,72,72,19,'#c5bba6');for(let i=0;i<5;i++)g.r(5+i*15,72,2,19,'#8b8274');if(phase>=2){for(const x of [5,37,74])g.r(x,30,4,58,'#96613a');g.r(5,30,73,4,'#bf925b');g.r(5,58,73,4,'#bf925b');g.line(7,32,75,85,'#96613a',3);g.line(75,32,7,85,'#96613a',3);}if(phase===3){g.r(7,35,68,38,'#dec5a1');g.r(32,51,17,35,'#77503a');g.r(12,44,12,13,'#a3cee0');g.r(58,44,12,13,'#a3cee0');for(let y=0;y<26;y++)g.r(41-y*1.5,4+y,Math.max(2,y*3),1,y%4?'#b85843':'#d17c57');}g.r(3,87,24,6,'#9c663e');}
  // Briefkasten-Missionen: verlassenes Haus Nr. 7, alter Brunnen (kaputt/repariert), Schatzhügel
  if(kind==='ruine'){c=cnv(82,96);g=G(c);g.r(2,84,78,10,'#8a8070');g.r(6,40,70,48,'#9c8f7c');g.r(6,40,70,3,'#b3a690');for(let i=0;i<6;i++)g.r(8+i*12,46+(i%2)*9,6,2,'#867a68');
   for(let y=0;y<32;y++)g.r(41-y*1.3,8+y,Math.max(2,y*2.6),1,y%3?'#6e5a4e':'#5a4a40');g.r(26,24,9,6,'#2b2420');g.r(50,30,7,5,'#2b2420');
   for(const wx of [12,56]){g.r(wx,54,14,14,'#3a3430');g.line(wx,56,wx+13,66,'#a07a50',2);g.line(wx,66,wx+13,56,'#a07a50',2);}
   g.r(34,62,14,26,'#4a3a30');g.r(36,64,10,22,'#5a463a');g.r(38,55,7,6,'#e8dcc0');g.r(39,56,5,1,'#2b1e2a');g.r(42,57,1,3,'#2b1e2a');
   g.r(4,82,7,4,'#5a7a3a');g.r(70,80,6,6,'#5a7a3a');g.r(64,83,4,3,'#6f8f45');}
  if(kind==='brunnen_alt'||kind==='brunnen_neu'){const neu=kind==='brunnen_neu';c=cnv(20,28);g=G(c);g.ell(10,22,9,5,neu?'#a8a196':'#8f8a80');g.ell(10,21,7,3,neu?(se===3?'#cfe3f0':'#4f8fcf'):'#3a3430');
   if(neu){g.r(1,5,2,16,'#8a5a33');g.r(17,5,2,16,'#8a5a33');g.r(0,2,20,4,'#b8302a');g.r(0,2,20,1,'#d9473a');g.r(9,6,1,9,'#d9c9a0');g.r(7,14,5,4,'#8a5a33');}
   else{g.r(2,8,2,13,'#7a5a3a');g.line(4,10,15,15,'#7a5a3a',2);g.line(6,22,9,25,'#5a5048',1);g.r(14,23,3,2,'#6a6458');}}
  if(kind==='erdhuegel'){c=cnv(16,10);g=G(c);g.ell(8,7,7,3,'#7a5a3a');g.ell(8,6,5,2,'#94704a');g.p(5,6,'#5a4030');g.p(10,5,'#5a4030');g.p(8,7,'#5a4030');}
  // Briefkasten-Ereignisse W61–W65: Zettel an der Tür, Koffer am Bahnsteig, Waldtür im Hang, Truhe, Steintafel
  if(kind==='zettel'){c=cnv(12,22);g=G(c);g.r(5,8,2,14,'#6b4423');g.r(1,2,10,9,'#f4ead8');g.r(1,2,10,1,'#fffaf0');g.r(3,4,6,1,'#7a6a5a');g.r(3,6,5,1,'#7a6a5a');g.r(3,8,6,1,'#7a6a5a');g.r(5,1,2,2,'#d9473a');}
  // Etappe 2 Romantik und Dorf: Picknickdecke mit Korb, Bistrotisch, Geburtstagstisch, Herzbank, Kerzentisch zum Jahrestag
  if(kind==='picknick'){c=cnv(32,13);g=G(c);g.r(0,4,32,9,'#f4ead8');for(let i=0;i<8;i++)for(let j=0;j<3;j++)if((i+j)%2)g.r(i*4,4+j*3,4,3,'#d9473a');g.r(0,12,32,1,'#c9b89a');
   g.ell(7,9,4,2,'#ffffff');g.disc(6,8,1.3,'#e0304a');g.disc(8.5,9,1.3,'#e0304a');g.p(6,7,'#4f8a3a');g.r(13,3,3,7,'#3f6a8a');g.r(13,3,3,1,'#5a86a8');
   g.r(20,4,9,6,'#b07a3e');g.r(20,6,9,1,'#8a5a2a');g.r(20,8,9,1,'#8a5a2a');g.line(21,4,24,0,'#8a5a2a',1);g.line(24,0,28,4,'#8a5a2a',1);g.r(21,4,7,1,'#e8476a');}
  if(kind==='bistro'){c=cnv(32,26);g=G(c);for(const L of [1,24]){const back=L<16?L:L+5;g.r(back,6,2,19,'#7a4e2a');g.r(L,15,7,2,'#a8743f');g.r(L+(L<16?5:0),17,1,8,'#6b4423');g.r(L+(L<16?1:6),17,1,8,'#6b4423');}
   g.r(15,15,2,10,'#3a3a44');g.r(12,24,8,1,'#3a3a44');g.ell(16,13,8,3,'#f4ead8');for(const dx of [-6,-2,2,6])g.r(16+dx-1,14,2,2,'#d9473a');
   g.r(15,6,2,6,'#f4ead8');g.r(15,3,2,3,'#ffd34a');g.p(15,2,'#fff3b0');g.r(10,8,2,4,'#cfe6ff');g.r(20,8,2,4,'#cfe6ff');g.r(10,8,2,1,'#b0365a');g.r(20,8,2,1,'#b0365a');}
  if(kind==='geburtstagstisch'){c=cnv(32,30);g=G(c);g.r(1,14,30,8,'#a8743f');g.r(1,14,30,2,'#c58d52');g.r(3,22,3,8,'#6b4423');g.r(26,22,3,8,'#6b4423');g.r(3,15,26,5,'#f4ead8');
   g.r(9,6,13,9,'#f6e0c8');g.r(9,6,13,2,'#ffffff');g.r(9,11,13,1,'#e8a0b0');for(const x of [11,15,19])g.disc(x+.5,6,1.2,'#e0304a');for(const x of [12,15,18]){g.r(x,1,1,4,'#8fc0ea');g.p(x,0,'#ffd34a');}
   g.r(24,8,6,6,'#8a5aa8');g.r(26,8,2,6,'#f6d55c');g.r(24,10,6,1,'#f6d55c');g.r(25,6,1,2,'#f6d55c');g.r(28,6,1,2,'#f6d55c');}
  if(kind==='herzbank'){c=cnv(32,16);g=G(c);g.r(2,3,28,4,'#a8743f');g.r(2,3,28,1,'#c58d52');g.r(2,8,28,3,'#8a5a33');g.r(4,11,2,5,'#3a3a44');g.r(26,11,2,5,'#3a3a44');
   g.r(14,4,2,1,'#c9304a');g.r(17,4,2,1,'#c9304a');g.r(14,5,5,1,'#c9304a');g.r(15,6,3,1,'#c9304a');g.p(16,7,'#c9304a');g.r(4,13,1,3,'#5a8a3a');g.p(4,12,'#f6d55c');g.r(28,13,1,3,'#5a8a3a');g.p(28,12,'#e8476a');}
  if(kind==='tisch_jt'){const b=A.prop('table',se);c=cnv(b.width,b.height+8);g=G(c);c.getContext('2d').drawImage(b,0,8);
   for(const x of [7,25]){g.r(x,7,2,8,'#f4ead8');g.r(x,4,2,3,'#ffd34a');g.p(x,3,'#fff3b0');}g.r(15,9,4,6,'#cfe6ff');g.r(16,4,1,6,'#3f7a3a');g.disc(16.5,4,2.2,'#d9304a');g.p(16,3,'#f08aa0');return c;}
  if(kind==='koffer'){c=cnv(16,14);g=G(c);g.r(1,4,14,9,'#8a4a2e');g.r(1,4,14,2,'#a85f3a');g.r(6,1,4,1,'#3a2a20');g.r(5,1,1,4,'#3a2a20');g.r(10,1,1,4,'#3a2a20');g.r(4,4,1,9,'#c9a46a');g.r(11,4,1,9,'#c9a46a');g.r(7,8,3,3,'#f4ead8');}
  if(kind==='waldtuer'||kind==='waldtuer_offen'){const open=kind==='waldtuer_offen';c=cnv(34,30);g=G(c);g.ell(17,22,17,10,'#5d7a3a');g.ell(17,18,15,12,'#6f8f45');
   g.r(8,8,18,21,'#7d776e');g.r(8,8,18,2,'#97918a');g.ell(17,9,9,5,'#7d776e');g.r(11,11,12,18,open?'#1e1a18':'#5a4a3a');g.ell(17,11,6,3,open?'#1e1a18':'#5a4a3a');
   if(!open){g.r(13,13,1,15,'#4a3a30');g.r(20,13,1,15,'#4a3a30');g.disc(20,21,1,'#c9a46a');}else{g.r(12,24,10,2,'#3a3430');g.r(13,20,8,2,'#2b2622');}
   g.r(6,5,4,3,'#4f7a32');g.r(24,6,4,3,'#4f7a32');g.p(15,6,'#cfe6ff');}
  if(kind==='truhe'||kind==='truhe_offen'){const open=kind==='truhe_offen';c=cnv(18,16);g=G(c);g.r(1,7,16,8,'#8a5a33');g.r(1,7,16,1,'#a8743f');g.r(1,10,16,1,'#6b4423');g.r(3,7,1,8,'#c9a46a');g.r(14,7,1,8,'#c9a46a');
   if(open){g.r(1,1,16,4,'#6b4423');g.r(2,5,14,2,'#2b1e18');}else{g.r(1,3,16,5,'#a8743f');g.r(1,3,16,1,'#c58d52');g.r(8,6,2,3,'#f6d55c');}}
  if(kind==='steintafel'){c=cnv(16,22);g=G(c);g.r(2,3,12,18,'#8f8a80');g.r(2,3,12,2,'#a9a39b');g.ell(8,3,6,2,'#8f8a80');g.disc(8,8,3,'#cfe6ff');g.disc(9,7,3,'#8f8a80');for(let i=0;i<3;i++)g.r(4,13+i*2,8,1,'#6a655e');}
  /* Dorfbahnhof (Etappe 1b): Gleise auf Schotter (laufen 40 Kacheln über den Kartenrand hinaus), Bahnsteigkante,
     Zug aus Lok und Wagen auf den Schienen, Bahnhofsgebäude mit Uhr und Ortsschild, Bank, Kübel, Gepäck, Fahrplantafel. */
  if(kind==='gleis'){c=cnv(96*16,44);g=G(c);g.r(0,2,c.width,28,'#8e877c');for(let i=0;i<c.width;i+=3)g.p(i,4+((i*7)%23),i%2?'#a39c90':'#77716a');
   for(let x=2;x<c.width;x+=8){g.r(x,5,5,22,'#6b4a33');g.r(x,5,5,1,'#82603f');}for(const y of [8,21]){g.r(0,y,c.width,3,'#7d8690');g.r(0,y,c.width,1,'#c9d0d8');}
   // Bahnsteigkante (erhöht, helle Sicherheitslinie) unter dem Gleis: liegt auf der begehbaren Bahnsteigzeile
   const k0=(c.width>>1)-128;g.r(k0,30,256,4,'#8f887c');g.r(k0,34,256,10,se===3?'#e8e6e2':'#cfc7b8');g.r(k0,36,256,2,'#f8f6ef');for(let x=k0;x<k0+256;x+=16)g.r(x,38,1,6,'#b8b0a2');return c;}
  if(kind==='zug'){c=cnv(96,44);g=G(c);
   // Lok (links): Führerhaus, Kessel, Schornstein, Puffer; Wagen (rechts): Fenster, Tür, Dach. Räder sitzen auf der vorderen Schiene (Sprite-Zeile 36).
   g.r(2,14,30,18,'#2f4d5c');g.r(2,14,30,2,'#4a7486');g.r(4,8,14,8,'#2f4d5c');g.r(3,6,16,3,'#b14f42');g.r(6,10,9,5,'#b5dbe6');g.r(22,6,5,9,'#333b40');g.r(21,5,7,2,'#4a4f55');g.r(0,26,3,4,'#32343d');
   g.r(36,8,58,24,'#3e6578');g.r(36,8,58,2,'#5a8aa0');g.r(35,4,60,5,'#b14f42');g.r(35,4,60,1,'#d0685a');for(let i=0;i<4;i++)g.r(39+i*13,13,9,8,'#b5dbe6');for(let i=0;i<4;i++)g.r(39+i*13,13,9,2,'#e6f5fa');
   g.r(88,13,4,17,'#2c4a59');g.r(36,26,58,3,'#d4bd84');g.r(32,26,4,3,'#555a60');
   for(const x of [8,24,44,58,74,88]){g.disc(x,33,4,'#32343d');g.disc(x,33,1.5,'#aaaaa2');}g.r(4,32,26,1,'#7a7f86');}
  if(kind==='bahnhofhaus_dorf'||kind==='bahnhofhaus_stadt'){const dorf=kind==='bahnhofhaus_dorf',W=dorf?64:64,H=dorf?72:60;c=cnv(W+4,H+8);g=G(c);const base=H+6,wallTop=base-(dorf?40:34),wall=se===3?'#ebe3d2':'#efe3c8';
   g.r(2,wallTop,W,base-wallTop,wall);g.r(2,wallTop,W,2,'#ffffff');for(let y=wallTop+6;y<base;y+=6)g.r(2,y,W,1,'#e0d2b0');
   // Dach mit Überstand und Ziegelreihen
   for(let i=0;i<14;i++)g.r(i,wallTop-2-i*1.6,W+4-i*2,2,i%2?'#a8443a':'#8f3a31');g.r(0,wallTop-2,W+4,3,'#6e2c26');if(se===3)g.r(8,wallTop-24,W-12,3,'#ffffff');
   // Uhr im Giebel, Ortsschild über der Tür, Tür und Fenster
   const cx=2+W/2;g.disc(cx,wallTop-10,6.5,'#3a3a44');g.disc(cx,wallTop-10,5.5,'#ffffff');g.r(cx,wallTop-14,1,4,'#2b2b33');g.r(cx,wallTop-10,3,1,'#2b2b33');
   g.r(cx-26,wallTop+4,52,10,'#2f4d5c');g.r(cx-25,wallTop+5,50,8,'#f4f1ea');const x=g.ctx;x.fillStyle='#2f4d5c';x.font='bold 7px monospace';x.textAlign='center';x.textBaseline='middle';x.fillText(dorf?'Dorfbahnhof':'Lindenstadt',cx,wallTop+9.5);
   g.r(cx-6,base-18,12,18,'#5a3f2c');g.r(cx-5,base-17,10,16,'#7a5638');g.p(cx+3,base-9,'#f6d55c');for(const wx of [8,W-12])g.r(wx,base-20,10,10,'#b5dbe6');for(const wx of [8,W-12])g.r(wx,base-20,10,2,'#e6f5fa');
   g.r(0,base,W+4,3,'#8f887c');}
  if(kind==='ortsschild_dorf'||kind==='ortsschild_stadt'){c=cnv(50,24);g=G(c);g.r(6,10,2,14,'#3a3a44');g.r(42,10,2,14,'#3a3a44');g.r(1,1,48,11,'#2f4d5c');g.r(2,2,46,9,'#f4f1ea');const x=g.ctx;x.fillStyle='#2f4d5c';x.font='bold 6px monospace';x.textAlign='center';x.textBaseline='middle';x.fillText(kind==='ortsschild_dorf'?'Dorfbahnhof':'Lindenstadt',25,7);}
  if(kind==='fahrplan'){c=cnv(16,28);g=G(c);g.r(7,14,2,14,'#3a3a44');g.r(1,1,14,15,'#f3c34a');g.r(2,2,12,13,'#fffaf0');g.r(3,3,10,2,'#2f4d5c');for(let i=0;i<4;i++){g.r(3,7+i*2,4,1,'#5a5a64');g.r(9,7+i*2,4,1,'#b14f42');}}
  if(kind==='bank'){c=cnv(32,16);g=G(c);g.r(2,4,28,3,'#a8743f');g.r(2,4,28,1,'#c58d52');g.r(2,8,28,3,'#8a5a33');g.r(4,11,2,5,'#3a3a44');g.r(26,11,2,5,'#3a3a44');}
  if(kind==='blumenkuebel'){c=cnv(14,16);g=G(c);g.r(2,8,10,8,'#8f6a4a');g.r(2,8,10,2,'#a8805a');g.ell(7,7,6,4,se===3?'#e8eef2':'#5a8a3a');if(se!==3){g.disc(4,5,1.6,'#e0476a');g.disc(9,4,1.6,'#f6d55c');g.disc(7,7,1.4,'#ffffff');}}
  if(kind==='gepaeck'){c=cnv(16,18);g=G(c);g.r(1,12,14,3,'#5a5a64');g.disc(3,16,2,'#32343d');g.disc(13,16,2,'#32343d');g.r(2,4,8,8,'#8a4a2e');g.r(2,4,8,1,'#a85f3a');g.r(9,7,6,5,'#3f6a8a');g.r(4,2,4,2,'#3a2a20');}
  if(kind==="box"){ c=cnv(18,20); g=G(c); g.r(1,6,16,13,"#a8743f"); g.r(1,6,16,2,"#c58d52"); g.r(1,11,16,1,"#8a5a33"); g.r(1,15,16,1,"#8a5a33"); g.r(2,7,1,12,"#8a5a33"); g.r(15,7,1,12,"#8a5a33"); g.r(0,3,18,4,"#7a4f2b"); g.r(0,3,18,1,"#9a6a3c"); g.r(7,4,4,2,"#f3d77a"); if(se===3) g.r(0,2,18,2,"#ffffff"); }
  if(kind==="mailbox"){ c=cnv(14,24); g=G(c); g.r(6,10,2,13,"#6b4423"); g.r(1,3,12,8,"#3f5a8a"); g.r(1,3,12,2,"#5a7ab0"); g.r(2,6,10,1,"#2c4066"); if(extra){ g.r(11,0,2,6,"#d9473a"); g.r(12,0,2,2,"#d9473a"); } if(se===3) g.r(1,2,12,1,"#ffffff"); }
  if(kind==="board"){ c=cnv(20,30); g=G(c); g.r(2,8,2,21,"#6b4423"); g.r(16,8,2,21,"#6b4423"); g.r(0,4,20,16,"#8a5a33"); g.r(1,5,18,14,"#a8743f"); g.r(3,7,6,7,"#f4ead8"); g.r(10,6,7,6,"#f6e6a0"); g.r(11,13,6,5,"#f4ead8"); g.r(4,9,4,1,"#9a8a7a"); g.r(4,11,3,1,"#9a8a7a"); g.r(11,8,5,1,"#9a8a7a"); g.r(5,7,1,1,"#d9473a"); g.r(13,6,1,1,"#3f5a8a"); g.r(0,2,20,3,"#6b4423"); if(se===3) g.r(0,1,20,2,"#ffffff"); }
  if(kind==="doghouse"){ c=cnv(24,24); g=G(c); planksV(g,3,9,18,13,"#c98f5a"); g.r(9,13,6,9,"#3a2218"); for(let r=0;r<9;r++){ const w=4+r*2.6; g.r(12-w/2,1+r,w,1,r%3===0?"#e8735a":"#d9573f"); } if(se===3) g.r(6,1,12,3,"#ffffff"); g.r(2,20,5,3,"#c94a3a"); g.r(17,20,5,3,"#3f5a8a"); g.r(3,20,3,1,"#c98f5a"); }
  if(kind==="trough"){ c=cnv(18,12); g=G(c); g.r(1,3,16,8,"#8a5a33"); g.r(2,4,14,4,"#5a3a24"); if(extra) { g.r(2,3,14,3,"#e8c95a"); g.r(3,2,4,1,"#f3dc7a"); g.r(10,2,3,1,"#f3dc7a"); } g.r(1,10,2,2,"#6b4423"); g.r(15,10,2,2,"#6b4423"); }
  if(kind==="lamp"){ c=cnv(10,30); g=G(c); g.r(4,8,2,21,"#3a3a44"); g.r(2,28,6,2,"#3a3a44"); g.r(2,2,6,7,"#3a3a44"); g.r(3,3,4,5,extra?"#ffe08a":"#f0e3c0"); g.r(1,1,8,2,"#2a2a33"); }
  if(kind==="fountain"){ c=cnv(36,40); g=G(c); g.ell(18,28,16,9,"#9d958a"); g.ell(18,27,15,8,"#b3ab9f"); g.ell(18,27,12,6,se===3?"#cfe3f0":"#4f8fcf"); g.ell(18,26,9,4,se===3?"#e3eef6":"#6aa8dd"); g.r(16,8,4,18,"#b3ab9f"); g.r(16,8,1,18,"#c6bfb3"); g.ell(18,9,6,3,"#9d958a"); g.ell(18,8,5,2,se===3?"#cfe3f0":"#6aa8dd"); }
  if(kind==="rock"){ c=cnv(18,16); g=G(c); const ore={stein:null,kupfer:"#e08a3a",eisen:'#b2bac3',silber:'#eef4ff',amethyst:"#a86ad8",mondquarz:"#cfe6ff"}[extra||"stein"];
    g.ell(9,10,7.5,5.5,"#6e655e"); g.ell(8,9,6.5,4.6,"#8a8079"); g.r(5,6,4,1,"#a69c94"); g.r(10,12,4,1,"#5a524c");
    if(ore){ [[5,8],[10,7],[12,10],[7,11]].forEach(([x,y])=>{ g.r(x,y,2,2,ore); g.p(x,y,"#ffffff"); }); } }
  if(kind==="cave"){ c=cnv(34,34); g=G(c); g.ell(17,20,17,14,"#5a524c"); g.ell(17,19,15,12,"#6e655e"); g.ell(17,24,9,10,"#1a1418"); g.r(8,26,18,8,"#1a1418"); g.r(6,8,4,2,"#8a8079"); g.r(24,10,5,2,"#8a8079"); if(se===3) g.r(6,6,22,3,"#ffffff"); g.r(15,16,1,1,"#cfe6ff"); g.r(20,14,1,1,"#a86ad8"); }
  if(kind==="stairs"){ c=cnv(18,42); g=G(c); for(let i=0;i<7;i++){const y=4+i*5;g.r(2,y,14,7,"#8a5a33");g.r(2,y,14,2,"#d1aa72");}g.r(0,1,2,38,"#6b4423");g.r(16,1,2,38,"#6b4423");g.r(0,1,18,2,"#e0c795"); }
  if(kind==="leiter"){ c=cnv(16,22); g=G(c); g.r(3,0,2,22,"#8a5a33"); g.r(11,0,2,22,"#8a5a33"); for(let i=2;i<22;i+=4) g.r(3,i,10,2,"#a8743f"); }
  if(kind==="stove"){ c=cnv(18,26); g=G(c); g.r(1,8,16,17,"#5a5a64"); g.r(1,8,16,3,"#7a7a84"); g.r(3,13,12,8,"#3a3a44"); g.r(4,14,10,6,extra?"#f39a3a":"#2a2a30"); g.r(2,6,6,2,"#2a2a30"); g.r(10,6,6,2,"#2a2a30"); g.r(3,2,4,4,"#c94a3a"); g.r(3,2,4,1,"#e8735a"); g.r(11,1,4,5,"#9aa3ad"); g.r(11,1,4,1,"#c9d0d8"); g.r(15,3,2,1,"#5a5a64"); }
  if(kind==="counter"){ c=cnv(18,26); g=G(c); g.r(1,8,16,17,"#a8743f"); g.r(1,8,16,3,"#e9dfc8"); g.r(3,13,5,10,"#8a5a33"); g.r(10,13,5,10,"#8a5a33"); g.r(7,17,1,2,"#f3d77a"); g.r(10,17,1,2,"#f3d77a"); g.r(3,5,4,3,"#f4f1ea"); g.r(9,4,6,4,"#4fb04a"); g.r(10,3,4,1,"#e8433a"); }
  if(kind==="fridge"){ c=cnv(18,30); g=G(c); g.r(2,2,14,27,"#e9eef2"); g.r(2,2,14,2,"#ffffff"); g.r(2,12,14,1,"#b8c4d0"); g.r(13,5,2,5,"#9aa3ad"); g.r(13,15,2,7,"#9aa3ad"); g.r(4,16,4,4,"#f6d55c"); g.r(9,17,3,3,"#f28fb0"); }
  if(kind==="table"){ c=cnv(34,24); g=G(c); g.r(1,6,32,10,"#a8743f"); g.r(1,6,32,2,"#c58d52"); g.r(3,16,3,7,"#6b4423"); g.r(28,16,3,7,"#6b4423"); g.r(4,7,26,7,"#f4ead8"); g.r(5,8,24,1,"#e0d4b8"); g.r(9,9,4,3,"#ffffff"); g.r(20,8,5,4,"#e8b84a"); g.r(15,4,4,3,"#c94a3a"); g.r(16,2,2,2,"#5aa646"); }
  if(kind==="tv"){ c=cnv(18,24); g=G(c); g.r(1,14,16,9,"#8a5a33"); g.r(1,14,16,2,"#a8743f"); g.r(2,3,14,11,"#3a3a44"); g.r(3,4,12,8,extra?"#8fc3e4":"#2a3a4a"); g.r(4,5,3,1,"#c8e4f4"); g.r(6,1,1,2,"#3a3a44"); g.r(11,1,1,2,"#3a3a44"); }
  if(kind==="plant"){ c=cnv(16,24); g=G(c); g.r(4,15,8,8,"#c9683a"); g.r(4,15,8,2,"#e8843a"); g.disc(8,9,5,"#3f8a34"); g.disc(5,7,3,"#5aa646"); g.disc(11,8,3,"#5aa646"); g.disc(8,4,3,"#4f9e3a"); }
  if(kind==="bed"){ c=cnv(34,38); g=G(c); g.r(1,1,32,7,"#8a5a33"); g.r(1,1,32,2,"#a8743f"); g.r(2,8,30,28,"#f4ead8"); g.r(4,9,11,7,"#ffffff"); g.r(19,9,11,7,"#ffffff"); g.r(2,17,30,19,"#d9707a"); g.r(2,17,30,2,"#e8949c"); for(let i=0;i<4;i++) g.r(4+i*7,22,4,4,"#f6d55c"); g.r(1,34,32,3,"#6b4423"); }
  if(kind==="wardrobe"){ c=cnv(18,34); g=G(c); g.r(1,1,16,32,"#8a5a33"); g.r(1,1,16,2,"#a8743f"); g.r(2,4,6,27,"#a8743f"); g.r(10,4,6,27,"#a8743f"); g.r(7,15,1,3,"#f3d77a"); g.r(10,15,1,3,"#f3d77a"); }
  if(kind==="workbench"){ c=cnv(34,24); g=G(c); g.r(1,8,32,4,"#a8743f"); g.r(1,8,32,1,"#c58d52"); g.r(3,12,3,11,"#6b4423"); g.r(28,12,3,11,"#6b4423"); g.r(6,16,22,2,"#8a5a33"); g.r(5,4,8,4,"#9aa3ad"); g.r(16,5,10,2,"#8a5a33"); g.r(24,3,3,3,"#e08a3a"); }
  if(kind==="shelf"){ c=cnv(18,30); g=G(c); g.r(1,1,16,28,"#8a5a33"); for(let j=0;j<3;j++){ g.r(2,3+j*9,14,7,"#5a3a24"); for(let i=0;i<3;i++) g.r(3+i*5,5+j*9,3,5,["#4fb04a","#e8433a","#f3d04a","#4f8fcf","#f4ead8"][(i+j)%5]); } }
  if(kind==="hay"){ c=cnv(18,16); g=G(c); g.r(1,3,16,12,"#e8c95a"); g.r(1,3,16,2,"#f3dc7a"); g.r(1,8,16,1,"#c9a43c"); g.r(1,12,16,1,"#c9a43c"); }
  if(kind==="crates"){ c=cnv(18,18); g=G(c); g.r(1,6,16,11,"#a8743f"); g.r(1,6,16,1,"#c58d52"); g.r(1,11,16,1,"#8a5a33"); for(let i=0;i<4;i++) g.disc(4+i*3.5,5,2,["#e8433a","#f0a83a","#4fb04a","#f3d04a"][i]); }
  if(kind==="barrel"){ c=cnv(16,20); g=G(c); g.ell(8,11,6,8,"#8a5a33"); g.r(2,6,12,1,"#5a5a64"); g.r(2,15,12,1,"#5a5a64"); g.r(4,3,8,2,"#6b4423"); }
  if(kind&&kind.startsWith("counter_")){ const t=kind.slice(8); const col={markt:"#3f7a4a",nudelhaus:"#8a1f1c",rathaus:"#3f5a8a",tierhof:"#6b4423",huette:"#4a5a66"}[t]||"#8a5a33";
    c=cnv(98,26); g=G(c); g.r(1,6,96,18,"#a8743f"); g.r(1,6,96,4,shade(col,.1)); g.r(1,9,96,1,shade(col,-.2)); for(let i=0;i<6;i++) g.r(4+i*16,12,10,10,"#8a5a33");
    if(t==="markt"){ g.disc(20,4,3,"#e8433a"); g.disc(26,4,3,"#4fb04a"); g.r(70,1,12,6,"#f4ead8"); }
    if(t==="nudelhaus"){ g.ell(24,5,6,3,"#f4f1ea"); g.ell(24,4,5,2,"#f0d38a"); g.r(60,1,2,6,"#8a5a33"); g.r(64,1,2,6,"#8a5a33"); g.ell(70,5,6,3,"#2f5a8a"); }
    if(t==="rathaus"){ g.r(20,2,14,5,"#f4ead8"); g.r(22,3,10,1,"#9a8a7a"); g.r(70,0,3,7,"#c94a3a"); }
    if(t==="tierhof"){ g.r(18,1,10,6,"#c9b98a"); g.r(60,2,6,5,"#fbf6e9"); g.r(68,1,8,6,"#f4f1ea"); }
    if(t==="huette"){ g.r(16,2,20,3,"#c9b98a"); g.ell(70,4,7,3,"#7a9a4a"); } }
  if(kind==="stall"){ c=cnv(22,40); g=G(c); const open=!!extra;
    g.r(2,10,2,28,"#6b4423"); g.r(18,10,2,28,"#6b4423");
    if(open){ for(let i=0;i<5;i++) g.r(i*4+1,4,4,8,i%2?"#fff6dc":"#e0476a"); g.r(1,12,20,2,"#a8302a"); for(let i=0;i<5;i++) g.r(i*4+1,14,3,2,i%2?"#fff6dc":"#e0476a"); }
    else { g.r(1,6,20,6,"#9a8a7a"); g.r(1,6,20,1,"#b8a898"); }
    g.r(0,24,22,14,"#a8743f"); g.r(0,24,22,2,"#c58d52"); g.r(0,30,22,1,"#8a5a33");
    if(open){ g.disc(6,22,3,"#4fb04a"); g.disc(12,22,3,"#e8433a"); g.disc(17,22,2.6,"#f3d04a"); g.r(5,32,12,4,"#f4ead8"); g.r(6,33,4,1,"#3a2a2a"); g.r(11,33,5,1,"#3a2a2a"); }
    else { g.r(2,20,18,5,"#c9b98a"); g.r(2,20,18,1,"#d8c99a"); }
    if(se===3) g.r(1,3,20,2,"#ffffff"); }
  if(kind==="sprinkler"){ c=cnv(14,14); g=G(c); g.r(5,6,4,6,"#9aa3ad"); g.r(3,10,8,3,"#7d8690"); g.r(4,4,6,3,"#c9d0d8"); g.r(6,2,2,2,"#4f8fcf"); }
  if(kind==="stone"){ c=cnv(16,14); g=G(c); g.ell(8,8,6,4.5,"#8f8a84"); g.ell(7,7,5,3.5,"#a9a39b"); g.r(5,5,3,1,"#c3bdb4"); g.r(9,10,3,1,"#77726c"); }
  if(kind==="weed"){ c=cnv(14,14); g=G(c); const L=A.PAL[se].leafD; [[3,4],[6,2],[9,3],[11,5],[5,6]].forEach(([x,y])=>g.line(7,12,x,y,L,1)); g.r(5,10,5,3,L); g.r(4,4,1,1,"#a8c84a"); g.r(10,4,1,1,"#a8c84a"); }
  if(kind==="branch"){ c=cnv(16,10); g=G(c); g.line(1,7,14,3,"#6b4423",2); g.line(6,5,9,1,"#6b4423",1); g.r(2,7,2,1,"#8a5a33"); }
  if(kind==="egg"){ c=cnv(10,10); g=G(c); g.ell(5,5.5,3,3.8,extra?"#f3c34a":"#fbf6e9"); g.r(6,4,1,3,extra?"#d9a52a":"#e2d9c3"); g.r(3,3,1,1,"#ffffff"); }
  if(kind==="mondbaum"){
    c=cnv(72,92); g=G(c);
    const bark="#5a4a5a", barkL="#7a6a80", barkD="#3a2e3e";
    g.r(28,48,16,38,bark); g.r(28,48,4,38,barkL); g.r(40,48,4,38,barkD); g.line(30,84,18,90,bark,3); g.line(42,84,56,90,bark,3); g.line(36,84,36,91,bark,3);
    g.line(32,56,22,66,bark,2); g.r(33,62,6,6,barkD); g.disc(36,65,2,"#2a2030");
    const L=se===3?"#c9d6e6":"#6a8fb8", LL=se===3?"#ffffff":"#9ab8d8", LD=se===3?"#a9b8cc":"#4a6a96";
    [[36,28,22],[18,36,13],[54,36,13],[26,18,12],[46,18,12],[36,10,10]].forEach(([x,y,r])=>g.disc(x+1,y+2,r,LD));
    [[36,28,22],[18,36,13],[54,36,13],[26,18,12],[46,18,12],[36,10,10]].forEach(([x,y,r])=>g.disc(x,y,r,L));
    [[28,16,6],[44,22,5],[20,32,5],[36,30,7]].forEach(([x,y,r])=>g.disc(x,y,r,LL));
    const glow=extra||0;
    [[20,26],[50,24],[32,40],[44,44],[14,40],[58,40],[36,12],[26,30]].forEach(([x,y],i)=>{ if(i<3+glow){ g.disc(x,y,2.3,"#f6e6a0"); g.disc(x+1,y-1,2,L); g.p(x-1,y,"#ffffff"); } });
  }
  if(!c) return null;
  outline(c,kind==="mondbaum"?"#1f1a2a":OUT); return c;
};

/* ---------- Pflanzen ---------- */
const CROPC={zwiebel:"#4f9e3a",pakchoi:"#3f9a3a",erdbeere:"#3f8a34",weizen:"#8aa83a",tomate:"#3f8a34",chili:"#3f8a34",mais:"#5a9a3a",kuerbis:"#4f8a34",suesskartoffel:"#6a8a3a"};
A.crop=function(k,stage){
  const c=cnv(18,26), g=G(c), o=1, R=(x,y,w,h,col)=>g.r(x+o,y+o,w,h,col), D=(x,y,r,col)=>g.disc(x+o,y+o,r,col);
  const L=CROPC[k], LL=shade(L,.25), LD=shade(L,-.25), B=24;
  if(stage===0){ R(5,B-4,6,2,"#5a3a24"); R(6,B-5,1,1,"#e8d29a"); R(9,B-5,1,1,"#e8d29a"); R(7,B-6,1,1,"#e8d29a"); }
  else if(stage===1){ R(7,B-6,2,4,L); R(5,B-7,2,2,LL); R(9,B-8,2,2,LL); }
  else if(stage===2){ R(7,B-10,2,8,L); D(5,B-8,2.4,L); D(11,B-9,2.4,L); D(8,B-12,2,LL); }
  else if(stage===3||stage===4){
    const ripe=stage===4;
    if(k==="zwiebel"){ [[4,9],[6,6],[8,4],[10,6],[12,8]].forEach(([x,h])=>R(x,B-3-(ripe?h+6:h+2),1,(ripe?h+6:h+2),x%4?L:LL)); R(4,B-3,9,2,ripe?"#f4f1e6":"#dfe9c8"); if(ripe) R(5,B-4,7,1,"#e2ecd0"); }
    else if(k==="pakchoi"){ const s=ripe?1:.7; D(8,B-8*s-2,6*s,LD); D(5,B-7*s-2,3.6*s,L); D(11,B-7*s-2,3.6*s,L); D(8,B-10*s-2,3.8*s,LL); R(6,B-4,5,2,"#eef2dc"); R(7,B-6,1,3,"#dfe6c8"); R(9,B-6,1,3,"#dfe6c8"); }
    else if(k==="weizen"){ const col=ripe?"#e3c25a":"#9ab84a", st=ripe?"#c9a43c":"#7a9a3a"; [3,6,9,12].forEach((x,i)=>{ const h=ripe?15:11; R(x+1,B-h,1,h-1,st); R(x,B-h-3+(i%2),3,5,col); R(x+1,B-h-4+(i%2),1,1,col); }); }
    else if(k==="erdbeere"){ D(8,B-5,6,L); D(5,B-6,3,LL); D(11,B-6,3,LL); if(ripe){ [[4,B-3],[9,B-4],[12,B-2],[7,B-7]].forEach(([x,y])=>{ R(x,y,3,3,"#d9283a"); R(x,y,1,1,"#f27a8a"); R(x+1,y-1,1,1,LD); }); } else { R(6,B-9,2,2,"#ffffff"); R(6,B-9,1,1,"#f6d55c"); } }
    else if(k==="tomate"){ R(8,B-18,1,18,"#a8743f"); D(6,B-11,3.5,L); D(11,B-8,3.5,L); D(8,B-15,3,LL); D(6,B-5,3,L); [[4,B-8],[10,B-12],[11,B-5],[5,B-14]].forEach(([x,y])=>{ D(x+1.5,y+1.5,1.9,ripe?"#e8433a":"#9ac85a"); if(ripe) R(x+1,y+1,1,1,"#f78a7a"); }); }
    else if(k==="chili"){ D(8,B-7,6,L); D(6,B-10,3,LL); D(11,B-9,3,LL); [[4,B-6],[8,B-10],[11,B-4],[12,B-9]].forEach(([x,y])=>{ R(x,y,2,4,ripe?"#d9283a":"#7ab84a"); R(x+1,y+4,1,1,ripe?"#a81a2a":"#5a9a3a"); }); }
    else if(k==="mais"){ R(7,B-22,3,22,"#6a9a3a"); R(8,B-22,1,22,LL); g.line(9+o,B-10+o,14+o,B-16+o,L,2); g.line(7+o,B-12+o,2+o,B-17+o,L,2); g.line(9+o,B-4+o,13+o,B-7+o,LD,2); if(ripe){ R(10,B-16,3,7,"#f3d04a"); R(10,B-16,1,7,"#e8b83a"); R(11,B-17,2,1,"#c9a43c"); R(7,B-24,3,2,"#e3c25a"); } else R(10,B-14,2,4,"#a8c84a"); }
    else if(k==="kuerbis"){ D(4,B-7,3,L); D(13,B-8,3,L); g.line(2+o,B-3+o,15+o,B-4+o,LD,1); if(ripe){ g.ell(8.5+o,B-4.5+o,6.5,4.5,"#e8842a"); R(6,B-8,1,8,"#c9682a"); R(11,B-8,1,8,"#c9682a"); R(4,B-6,2,1,"#f4a84a"); R(8,B-10,2,2,"#6b4423"); } else D(8,B-4,3,"#9ac85a"); }
    else if(k==="suesskartoffel"){ D(5,B-7,3.5,"#7a6a3a"); D(11,B-7,3.5,L); D(8,B-10,3.6,LL); R(4,B-6,1,1,"#a05a8a"); if(ripe){ g.ell(8+o,B-2.5+o,4,2,"#a0466a"); R(6,B-3,2,1,"#c86a8a"); } }
  }
  outline(c,"#2a2a1e"); return c;
};

/* ---------- Symbole ---------- */
const FISHC={forelle:["#8aa8a0","#f08a8a"],karpfen:["#b89a4a","#d8c27a"],barsch:["#7a9a4a","#3a5a2a"],wels:["#5a5048","#3a3430"],goldfisch:["#f0902a","#f6c55a"],koi:["#f4f1ea","#f08a3a"]};
A.icon=function(k){
  const c=cnv(16,16), g=G(c), R=g.r, D=g.disc;
  const seedBag=(col)=>{ R(3,5,10,10,"#d8b87a"); R(3,5,10,1,"#e8cc94"); R(4,3,8,3,"#b08a52"); R(5,2,6,1,"#c09a62"); R(5,8,6,5,"#f4ead8"); R(6,9,4,3,col); R(12,6,1,9,"#b08a52"); };
  const fish=(f)=>{ const [b,s]=FISHC[f]; g.ell(7,8,5.5,3.2,b); R(12,5,3,6,s); R(13,6,2,4,b); R(4,6,5,1,s); R(3,7,1,1,"#222"); R(5,10,4,1,shade(b,-.2)); if(f==="koi"){ R(6,6,2,2,s); R(9,9,2,1,s); } if(f==="wels"){ R(0,8,2,1,s); R(0,10,2,1,s); } if(f==="barsch"){ R(6,6,1,4,s); R(9,6,1,4,s); } };
  const bowl=(col,fill)=>{ R(2,8,12,5,col); R(1,7,14,2,shade(col,-.2)); R(4,13,8,2,shade(col,-.3)); R(3,5,10,3,fill); };
  switch(k){
    case "hand": R(4,6,8,8,"#f2c9a6"); R(4,2,2,6,"#f2c9a6"); R(6,1,2,6,"#f2c9a6"); R(8,2,2,5,"#f2c9a6"); R(10,3,2,5,"#f2c9a6"); R(2,8,2,4,"#f2c9a6"); R(5,13,6,2,"#e89bb0"); R(5,7,1,1,"#e0b090"); break;
    case "rute": g.line(2,14,13,2,"#8a5a33",2); g.line(13,2,14,10,"#e9e6e0",1); R(13,10,2,2,"#d9473a"); R(4,11,3,2,"#5a5a64"); break;
    case "rute2": g.line(2,14,13,2,"#e8b83a",2); g.line(13,2,14,10,"#e9e6e0",1); R(13,10,2,2,"#d9473a"); R(4,11,3,2,"#f3d77a"); break;
    case "kanne": R(3,6,8,8,"#4f8fcf"); R(3,6,8,2,"#6aa8dd"); R(11,7,4,2,"#4f8fcf"); R(14,6,2,2,"#4f8fcf"); R(4,3,6,2,"#3d6fa0"); R(4,3,1,4,"#3d6fa0"); R(9,3,1,4,"#3d6fa0"); break;
    case "hacke": R(7,3,2,12,"#8a5a33"); R(3,2,9,3,"#9aa3ad"); R(3,4,3,3,"#7d8690"); break;
    case "bag": R(3,5,10,10,"#5f8a3c"); R(3,5,10,3,"#78a84a"); R(5,2,6,4,"#4a6e2e"); R(6,3,4,2,"#5f8a3c"); R(7,9,2,3,"#e8c95a"); break;
    case "zwiebel_s": seedBag("#4f9e3a"); break; case "pakchoi_s": seedBag("#2f7a2c"); break; case "erdbeere_s": seedBag("#d9283a"); break;
    case "weizen_s": seedBag("#e3c25a"); break; case "tomate_s": seedBag("#e8433a"); break; case "chili_s": seedBag("#a81a2a"); break;
    case "mais_s": seedBag("#f3d04a"); break; case "kuerbis_s": seedBag("#e8842a"); break; case "suesskartoffel_s": seedBag("#a0466a"); break;
    case "zwiebel": [[4,2],[6,1],[8,2],[10,1]].forEach(([x,y])=>R(x,y,1,10,"#4f9e3a")); R(3,11,10,3,"#f4f1e6"); R(4,10,8,1,"#dfe9c8"); break;
    case "pakchoi": D(8,6,6,"#3f9a3a"); D(8,5,3,"#5fb64c"); R(7,3,2,7,"#2f7a2c"); R(4,10,8,4,"#eef2dc"); R(6,10,1,4,"#d6dcc0"); R(9,10,1,4,"#d6dcc0"); break;
    case "erdbeere": D(8,9,5,"#d9283a"); R(5,5,6,2,"#3f8a34"); R(7,3,2,2,"#3f8a34"); R(6,8,1,1,"#f6d55c"); R(9,10,1,1,"#f6d55c"); R(7,12,1,1,"#f6d55c"); R(10,7,1,1,"#f27a8a"); break;
    case "weizen": R(7,6,2,9,"#c9a43c"); R(5,1,6,6,"#e3c25a"); R(6,0,4,1,"#e3c25a"); R(3,8,4,2,"#c9a43c"); R(6,2,1,4,"#f3dc7a"); break;
    case "tomate": D(8,9,5.5,"#e8433a"); R(6,3,4,2,"#3f8a34"); R(7,2,2,1,"#3f8a34"); R(5,7,2,2,"#f78a7a"); break;
    case "chili": g.line(5,4,11,13,"#d9283a",3); R(4,2,3,2,"#3f8a34"); R(6,6,1,2,"#f27a7a"); break;
    case "mais": R(5,3,6,11,"#f3d04a"); for(let i=0;i<5;i++) R(5,4+i*2,6,1,"#e8b83a"); R(3,8,3,7,"#6a9a3a"); R(10,8,3,7,"#5a8a2a"); break;
    case "kuerbis": g.ell(8,9.5,7,5.5,"#e8842a"); R(5,5,1,9,"#c9682a"); R(10,5,1,9,"#c9682a"); R(7,2,2,3,"#6b4423"); R(3,7,2,1,"#f4a84a"); break;
    case "suesskartoffel": g.ell(8,9,6.5,4,"#a0466a"); R(4,7,3,1,"#c86a8a"); R(12,6,2,2,"#6a8a3a"); break;
    case "ei": g.ell(8,9,4.5,5.5,"#fbf6e9"); R(10,7,1,5,"#e2d9c3"); R(6,5,1,2,"#ffffff"); break;
    case "goldei": g.ell(8,9,4.5,5.5,"#f3c34a"); R(10,7,1,5,"#d9a52a"); R(6,5,1,2,"#fff3c9"); break;
    case "milch": R(4,4,8,11,"#f4f1ea"); R(5,2,6,2,"#9aa3ad"); R(4,8,8,4,"#5a7ab0"); R(6,9,4,2,"#f4f1ea"); R(11,5,1,10,"#d8d4cc"); break;
    case "forelle": case "karpfen": case "barsch": case "wels": case "goldfisch": case "koi": fish(k); break;
    case "baerlauch": [[5,2],[8,1],[11,3]].forEach(([x,y])=>{ g.ell(x+.5,y+5,1.8,5,"#4fb04a"); }); R(7,11,2,4,"#eef2dc"); break;
    case "beeren": [[5,8],[9,6],[10,10],[6,12],[3,10]].forEach(([x,y])=>{ D(x+1.5,y+1.5,2,"#5a3a8a"); R(x+1,y+1,1,1,"#9a7ac8"); }); R(7,3,4,2,"#3f8a34"); break;
    case "pilz": g.ell(8,7,6,4,"#8a4a2a"); R(4,5,3,1,"#a86a4a"); R(6,9,4,6,"#f0e3c8"); R(6,9,4,1,"#d8c8a4"); break;
    case "bambus": R(6,2,4,13,"#c9c86a"); R(6,6,4,1,"#9a9a4a"); R(6,10,4,1,"#9a9a4a"); R(7,2,1,13,"#e3e28a"); R(9,1,3,3,"#6a9a3a"); break;
    case "kastanie": D(8,9,5.5,"#7a3a1a"); R(5,6,6,2,"#a8582a"); R(6,12,4,2,"#e8d29a"); break;
    case "winterwurzel": g.ell(8,10,4,5,"#b89a7a"); R(6,6,4,1,"#9a7a5a"); R(7,2,1,4,"#4f9e3a"); R(9,1,1,5,"#4f9e3a"); break;
    case "huhn": g.ell(8,9,6,4.5,"#f0a0a0"); g.ell(7,8,3,2,"#f6c0c0"); R(12,10,3,2,"#e0d6c8"); break;
    case "futter": R(3,4,10,11,"#c9b98a"); R(3,4,10,2,"#d8c99a"); R(5,8,6,4,"#e8c95a"); R(6,2,4,3,"#a8986a"); break;
    case "tee": R(3,7,9,7,"#f4f1ea"); R(12,8,2,4,"#f4f1ea"); R(4,7,7,2,"#a8c84a"); R(2,14,12,1,"#d8d4cc"); R(6,3,1,3,"#e9e6e0"); R(9,2,1,3,"#e9e6e0"); break;
    case "rolle": R(1,11,14,3,"#f4f1ea"); g.line(3,10,12,6,"#e8b86a",3); g.line(4,12,13,8,"#d9a04a",3); R(5,7,2,1,"#4fb04a"); break;
    case "nudeln": bowl("#2f5a8a","#f0d38a"); R(4,6,8,1,"#e2c070"); R(9,3,4,3,"#d9902a"); R(10,2,2,1,"#f0b04a"); R(4,4,2,2,"#4f9e3a"); R(12,0,1,8,"#8a5a33"); R(14,0,1,8,"#8a5a33"); break;
    case "pakchoi_g": R(1,10,14,3,"#e9e4d8"); R(2,13,12,1,"#cfc8b8"); D(8,8,4.5,"#3f9a3a"); R(5,8,6,2,"#eef2dc"); break;
    case "suppe": bowl("#c94a3a","#f0d38a"); R(5,6,6,1,"#fbf6e9"); R(9,5,2,1,"#4f9e3a"); break;
    case "tomatenei": R(1,10,14,3,"#e9e4d8"); D(6,8,3.5,"#f3d04a"); D(10,8,3.5,"#e8433a"); R(7,6,2,1,"#4f9e3a"); break;
    case "fisch_g": R(1,11,14,3,"#e9e4d8"); g.ell(8,9,5.5,2.5,"#c9843a"); R(12,7,3,4,"#a8642a"); R(5,8,1,2,"#4f9e3a"); break;
    case "shake": R(5,4,6,11,"#f6b3c9"); R(5,4,6,2,"#ffffff"); R(4,3,8,1,"#f4f1ea"); R(9,0,1,4,"#d9473a"); D(7,3,1.5,"#d9283a"); break;
    case "kuerbissuppe": bowl("#f4f1ea","#e8842a"); R(6,6,3,1,"#f4f1ea"); break;
    case "pilzpfanne": R(1,9,12,5,"#3a3a44"); R(13,10,3,2,"#3a3a44"); R(2,8,10,2,"#8a4a2a"); R(4,7,2,1,"#f0e3c8"); R(8,7,2,1,"#f0e3c8"); break;
    case 'holz': R(2,5,12,7,'#a8743f');R(2,5,12,2,'#c8955b');g.ell(3,9,2,4,'#d5b47c');R(6,8,8,1,'#714826');break;
    case 'eisen': case 'silber': g.ell(8,9,6,4.5,'#777f89');[[5,7],[9,8],[7,11]].forEach(([x,y])=>R(x,y,2,2,k==='eisen'?'#b2bac3':'#eef4ff'));break;
    case 'sternenschuppe': case 'kristallforelle': g.ell(7,8,5.5,3.2,k==='sternenschuppe'?'#f2d77c':'#adf0ed');R(12,5,3,6,'#9d86d8');R(3,7,1,1,'#222');R(6,6,2,2,'#fff');R(9,10,2,1,'#83b7db');break;
    case "stein": g.ell(8,9,6,4.5,"#8a8079"); R(5,6,4,1,"#a69c94"); break;
    case "kupfer": g.ell(8,9,6,4.5,"#8a8079"); [[5,7],[9,8],[7,11]].forEach(([x,y])=>{ R(x,y,2,2,"#e08a3a"); g.p(x,y,"#ffd0a0"); }); break;
    case "amethyst": [[5,4,3,9],[8,2,3,11],[11,5,2,8]].forEach(([x,y,w,h])=>{ R(x,y,w,h,"#a86ad8"); R(x,y,1,h,"#d0a8f0"); }); R(4,12,10,2,"#6e655e"); break;
    case "mondquarz": g.ell(8,8,4.5,6,"#cfe6ff"); R(6,4,2,6,"#ffffff"); R(9,8,2,4,"#9ac0e8"); break;
    case "duenger": R(3,4,10,11,"#7a5a3a"); R(3,4,10,2,"#8f6a45"); R(5,8,6,4,"#5fae3c"); R(7,6,2,2,"#f4f1ea"); break;
    case "socke": R(5,1,5,9,"#f4f1ea"); R(5,9,8,4,"#f4f1ea"); R(5,1,5,2,"#E98F1F"); R(10,11,3,2,"#d8d4cc"); R(5,5,5,1,"#E98F1F"); break;
    case "tasse": R(3,5,9,9,"#f4f1ea"); R(12,7,3,4,"#f4f1ea"); R(13,8,1,2,"#7a5a3a"); R(4,6,7,2,"#5a3a24"); R(5,10,5,2,"#E98F1F"); R(6,1,1,3,"#d8d4cc"); R(9,2,1,3,"#d8d4cc"); break;
    case "kappe": g.ell(8,9,6,4,"#E98F1F"); R(2,10,13,2,"#E98F1F"); R(9,11,6,2,"#c9701a"); R(6,7,4,2,"#183060"); break;
    case "kabel": g.line(2,13,6,6,"#3a3a44",1); g.line(6,6,11,9,"#3a3a44",1); g.line(11,9,13,3,"#3a3a44",1); R(1,12,3,3,"#f4f1ea"); R(12,2,3,3,"#9aa3ad"); break;
    case "schrauber": g.line(3,13,9,7,"#9aa3ad",1); R(9,3,4,5,"#E98F1F"); R(10,2,2,1,"#E98F1F"); break;
    case "zeitung": R(2,4,12,9,"#e9e4d8"); R(2,4,12,2,"#9a8a7a"); R(3,7,5,4,"#b8b0a0"); R(9,7,4,1,"#9a8a7a"); R(9,9,4,1,"#9a8a7a"); R(13,5,1,8,"#c8c0b0"); break;
    case "karte": R(1,3,14,11,"#f0e3c0"); R(5,3,1,11,"#d8c8a4"); R(10,3,1,11,"#d8c8a4"); R(3,6,2,2,"#5aa646"); R(7,9,3,2,"#4f8fcf"); R(12,5,2,3,"#d9473a"); break;
    case "sprinkler": R(6,6,4,7,"#9aa3ad"); R(4,12,8,3,"#7d8690"); R(5,4,6,3,"#c9d0d8"); R(7,1,2,3,"#4f8fcf"); R(3,2,1,1,"#6aa8dd"); R(12,2,1,1,"#6aa8dd"); break;
    case "mondstein": g.ell(8,8,5,6,"#cfd8f0"); R(6,4,2,3,"#ffffff"); R(9,9,2,3,"#a9b8e0"); break;
    case "amulett": D(8,10,4.5,"#f3d77a"); D(9,9,3.5,"#1d2148"); g.line(4,1,8,6,"#c9a43c",1); g.line(12,1,8,6,"#c9a43c",1); break;
    case "auto": R(4,6,8,8,"#f2c9a6"); R(4,2,2,6,"#f2c9a6"); R(6,1,2,6,"#f2c9a6"); R(8,2,2,5,"#f2c9a6"); R(10,3,2,5,"#f2c9a6"); R(2,8,2,4,"#f2c9a6"); R(5,13,6,2,"#e89bb0"); break;
    default: D(8,8,5,"#c9a46a");
  }
  outline(c,"#3a2a2a"); return c;
};
})();
