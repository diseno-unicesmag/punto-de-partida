/* Exhibidor «Punto de partida»: medidas, geometría, texturas y plegado.
   Lo comparten la presentación (index.html) y el visor del modelo (modelo.html): cualquier cambio aquí se ve en las dos. */
window.buildStand=function(T,scene){
"use strict";
/* ================= utilidades ================= */
const tex=(w,h,draw)=>{const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");draw(x,w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;};
function wrap(x,s,mx,lh,X,Y){const words=s.split(" ");let line="",y=Y;for(const w of words){const t=line?line+" "+w:w;if(x.measureText(t).width>mx&&line){x.fillText(line,X,y);line=w;y+=lh;}else line=t;}if(line)x.fillText(line,X,y);return y;}
const F={brand:'"Bricolage Grotesque","Segoe UI",sans-serif',body:'"Work Sans","Segoe UI",sans-serif',hand:'"Caveat","Segoe Print",cursive'};
let seed=9;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
const ease=k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
/* metros con coma decimal: 1.6 → «1,60», .375 → «0,375» */
const m=v=>v.toFixed(3).replace(/0$/,"").replace(".",",");
const hole=(x,w,yy)=>{x.save();x.globalCompositeOperation="destination-out";x.beginPath();x.arc(w/2,yy,14,0,7);x.fill();x.restore();};
const woodTex=tex(256,1024,(x,w,h)=>{x.fillStyle="#d9bb8b";x.fillRect(0,0,w,h);seed=3;for(let i=0;i<70;i++){x.strokeStyle=`rgba(${120+rnd()*40},${80+rnd()*30},40,${.06+rnd()*.12})`;x.lineWidth=1+rnd()*3;x.beginPath();const x0=rnd()*w;x.moveTo(x0,0);for(let y=0;y<=h;y+=32)x.lineTo(x0+Math.sin(y*.01+i)*6+rnd()*2,y);x.stroke();}});
const M={wood:new T.MeshStandardMaterial({map:woodTex,roughness:.72}),hinge:new T.MeshStandardMaterial({color:0x8d8a83,metalness:.85,roughness:.32}),
  nail:new T.MeshStandardMaterial({color:0x77726b,metalness:.9,roughness:.35}),string:new T.MeshStandardMaterial({color:0xe9e2d3,roughness:.9}),
  rojo:new T.MeshStandardMaterial({color:0xb3261e,roughness:.55,emissive:0x300000}),canto:new T.MeshStandardMaterial({color:0x161514,roughness:.6})};
/* ================= medidas (m) ================= */
/* listón de 4 × 4 cm; travesaños de 0,50 m por dentro; largueros de 1,60 m; vano de hilos de 0,50 × 1,00 m */
const t=.04,IN=.50,W=IN+2*t,H=1.60,MID=.54,LOW=.13;const OX0=t,OX1=W-t,OY0=MID+t/2,OY1=H-t;const OW=OX1-OX0;const ZF=t/2;
const yM=(OY0+OY1)/2;const LT=.009,TY0=LOW+t/2,TAPA=MID-TY0,TAW=W-t;/* tapa: cubre medio listón alrededor *//* altura del hilo rojo: clavo del medio */
/* propalcote: área visible máxima de impresión, centrada en la tapa con el mismo borde a los cuatro lados (3,5 cm) */
const PRW=.47,PRH=.32;
/* acabado: 1 marco negro y MDF blanco, 0 madera natural y MDF negro */
let FIN=1;
const FD=Math.ceil(3*(t+2*LT)*100)/100;/* fondo plegado: tres marcos con sus dos tapas */
const HY=[.62,H-.22];/* altura de las bisagras */
/* puntillas: cada 5 cm en el 1, cada 10 cm y solo en los largueros en el 2, cada 2,5 cm en el 3 (la trama es tupida) */
const STEP=[.05,.10,.025];
const CW=.15,CH=.107;
const SC=[1632,0,1933];/* semillas del reparto: cambiarlas da otra distribución */
/* reparto orgánico: muestreo de mejor candidato con semilla fija; nada se solapa (cuenta el hilito de cada pieza) y queda aire entre piezas */
function scatter(n,w,h,sd){const pad=.015,LM=.045;for(let tr=0;tr<50;tr++){seed=sd+tr*101;const x0=OX0+pad+w/2,x1=OX1-pad-w/2,y0=OY0+pad+h/2,y1=OY1-pad-h/2-LM;const out=[];let worst=1;
  for(let k=0;k<n;k++){let best=null,bd=-1;for(let c=0;c<40;c++){const p={x:x0+rnd()*(x1-x0),y:y0+rnd()*(y1-y0),L:.012+rnd()*.033};
      let d=Math.min(p.x-x0,x1-p.x,p.y-y0,y1-p.y)*2.2+.02;for(const q of out)d=Math.min(d,Math.max(Math.abs(p.x-q.x)-w,Math.abs(p.y-q.y)-h-LM));if(d>bd){bd=d;best=p;}}
    out.push(best);worst=Math.min(worst,bd);}
  if(worst>=.012)return out.sort((a,b)=>b.y-a.y);}
  throw new Error("scatter: sin acomodo");}
function threads(g,segs,r){const geo=new T.CylinderGeometry(r,r,1,5,1,true);const mat=new T.MeshStandardMaterial({roughness:.85});const im=new T.InstancedMesh(geo,mat,segs.length);const up=new T.Vector3(0,1,0),q=new T.Quaternion(),m4=new T.Matrix4();
  segs.forEach((s,i)=>{const a=s[0],b=s[1],d=b.clone().sub(a),L=d.length();q.setFromUnitVectors(up,d.clone().normalize());m4.compose(a.clone().add(b).multiplyScalar(.5),q,new T.Vector3(1,L,1));im.setMatrixAt(i,m4);im.setColorAt(i,new T.Color(s[2]));});
  im.castShadow=true;im.instanceColor.needsUpdate=true;g.add(im);return im;}
/* puntillas con cabeza en el canto interior del marco: el hilo queda en el plano del bastidor y al plegar nada choca.
   Se marcan desde el centro hacia afuera, así siempre hay una en la mitad de cada lado (ahí pasa el hilo rojo); sides: solo en los largueros */
function nails(g,step,sides){const xs=[],ys=[];if(!sides){for(let x=W/2;x<OX1-.012;x+=step)xs.push(x);for(let x=W/2-step;x>OX0+.012;x-=step)xs.push(x);}for(let y=yM;y<OY1-.012;y+=step)ys.push(y);for(let y=yM-step;y>OY0+.012;y-=step)ys.push(y);
  const P={t:xs.map(x=>new T.Vector3(x,OY1,0)),b:xs.map(x=>new T.Vector3(x,OY0,0)),l:ys.map(y=>new T.Vector3(OX0,y,0)),r:ys.map(y=>new T.Vector3(OX1,y,0))};
  const all=[].concat(P.t,P.b,P.l,P.r);const head=new T.InstancedMesh(new T.SphereGeometry(.0042,8,6),M.nail,all.length);const m4=new T.Matrix4();
  all.forEach((p,i)=>{m4.makeTranslation(p.x+(p.x<=OX0?.003:p.x>=OX1?-.003:0),p.y+(p.y>=OY1?-.003:p.y<=OY0?.003:0),p.z);head.setMatrixAt(i,m4);});g.add(head);
  g.userData.nails={step,n:all.length,tb:xs.length,lr:ys.length};
  const near=(arr,k,v)=>arr.reduce((m,p)=>Math.abs(p[k]-v)<Math.abs(m[k]-v)?p:m);return {P,near};}
/* ================= textos ================= */
const FR1=[["Al principio ellos pedían y pagaban, después ya no, ellos ya solo pedían, ya no pagaban, hasta que se acabó la tienda.","01:20"],["Permiso teníamos solamente hasta las 6 de la tarde. Después ya no podíamos andar.","01:45"],["Llegaban a nuestras casas 2, 3 de la mañana para que nos levantemos y ellos poder descansar.","02:28"],["Tenían personas secuestradas y las llevaban a la casa.","03:40"],["De una loma el ejército, de la otra loma guerrilla y nosotros en la mitad.","04:01"],["Nos metíamos debajo la cama, debajo las mesas.","04:14"],["Los dejaban que amanezcan, amarrados a un árbol y sin nada de ropa, y les ponían un letrero arriba: por sapos.","05:15"],["Nos decían que si nosotros decíamos algo (…) que nos mataban, o si no, que nos quitaban los niños pequeños.","05:37"]];
const FR2=[["Decidimos mejor salir de la vereda y venirnos acá a la ciudad.","05:55"],["Uno llega sin saber qué hacer, dónde irse.","06:10"],["Es muy distinta la vida de ciudad a la vida de campo.","06:22"]];
function torn(x,w,h,fill){x.fillStyle=fill;x.fillRect(0,0,w,h);seed=Math.floor(w+h);for(let k=0;k<900;k++){x.fillStyle=fill!=="#f6f4ee"?`rgba(255,255,255,${rnd()*.03})`:`rgba(0,0,0,${rnd()*.03})`;x.fillRect(rnd()*w,rnd()*h,2,2);}}
/* módulo 1 negro (lo oscuro), módulo 2 gris (el limbo) */
const QS={dark:["#0f0e0d","#ffffff","#8f897f"],gray:["#6f6b66","#f5f3ee","#d2ccc2"]};
const quoteTex=(s,ts,k)=>tex(900,640,(x,w,h)=>{const c=QS[k];torn(x,w,h,c[0]);x.fillStyle=c[1];x.font=`500 46px ${F.body}`;wrap(x,"«"+s+"»",w-120,60,60,120);x.font=`500 28px ${F.body}`;x.fillStyle=c[2];x.fillText("Entrevista · "+ts,60,h-58);hole(x,w,48);});
const DEST=[["La vereda",1],["¿?",0],["",2],["¿Dónde?",1],["¿?",2]];
const tagTex=(n)=>tex(300,500,(x,w,h)=>{x.fillStyle="#f6f1e4";x.beginPath();x.moveTo(60,0);x.lineTo(w-60,0);x.lineTo(w,60);x.lineTo(w,h);x.lineTo(0,h);x.lineTo(0,60);x.closePath();x.fill();hole(x,w,55);
  x.font=`600 40px ${F.body}`;x.fillStyle="#3a3631";x.fillText("DESTINO",44,185);const d=DEST[n%DEST.length];x.font=`700 60px ${F.hand}`;x.fillStyle="#4a463f";if(d[0])x.fillText(d[0],48,282);
  x.strokeStyle="#2a2620";x.lineWidth=6;if(d[1]===1){x.beginPath();x.moveTo(40,262);x.lineTo(w-38,248);x.stroke();}if(d[1]===2){seed=n+5;x.beginPath();x.moveTo(44,270);for(let k=0;k<14;k++)x.lineTo(44+rnd()*(w-90),236+rnd()*60);x.stroke();}
  x.strokeStyle="#8d918d";x.lineWidth=4;for(let l=0;l<2;l++){x.beginPath();x.moveTo(42,360+l*70);x.lineTo(w-42,360+l*70);x.stroke();}});
/* tapas de MDF (frente: número, título e historia; atrás: número y símbolo) */
const FI=[{t:"Lo que pasó",n:"01",s:"Vivían en la vereda de una tienda, sus cuyes y sus gallinas. Llegaron hombres armados: toque de queda, amenazas, miedo. La vida se volvió un nudo y, por sus hijos, escaparon.",bg:"#0e0d0c",fg:"#ffffff",mu:"#bdb7ac",ac:"#e5534b"},
 {t:"Lo que no se ve",n:"02",s:"Salieron con lo que tenían. En la ciudad nadie los esperaba: sin casa, sin trabajo, sin saber adónde ir. Es el vacío y la duda que nadie ve.",bg:"#6f6b66",fg:"#ffffff",mu:"#e4dfd6",ac:"#f2efe8"},
 {t:"Lo que volvió a tejer",n:"03",s:"Pero ese no era el final. Con crochet, lana guajira, chaquiras y gobelino empezó otra vez, punto por punto. Hoy teje, vende su trabajo y sostiene a su familia.",bg:"#0e8487",fg:"#ffffff",mu:"#d9f0ef",ac:"#f5e38a"}];
/* la tapa es MDF (blanco o negro según el acabado) con el propalcote de PRW × PRH centrado; el diseño se pinta aparte y se pega en su sitio */
const TW=1280,TH2=Math.round(TW*TAPA/TAW),DW=1280,DH=Math.round(DW*PRH/PRW);const dc=document.createElement("canvas");dc.width=DW;dc.height=DH;const dctx=dc.getContext("2d");
const TAPAS=[];
function paintTapa(o){const x=o.t.image.getContext("2d"),w=TW,h=TH2;x.fillStyle=FIN?"#f4f2ee":"#161514";x.fillRect(0,0,w,h);dctx.clearRect(0,0,DW,DH);o.draw(dctx,DW,DH);
  const pw=w*PRW/TAW,ph=h*PRH/TAPA;x.drawImage(dc,(w-pw)/2,(h-ph)/2,pw,ph);o.t.needsUpdate=true;}
function tapaTex(draw){const o={t:tex(TW,TH2,()=>{}),draw};TAPAS.push(o);paintTapa(o);return o.t;}
const fichaTex=(f,k)=>tapaTex((x,w,h)=>{x.fillStyle=f.bg;x.fillRect(0,0,w,h);x.fillStyle=f.ac;
  x.font=`800 330px ${F.brand}`;x.globalAlpha=.22;x.textAlign="right";x.fillText(f.n,w-50,h-120);x.globalAlpha=1;
  x.font=`600 30px ${F.body}`;["01","02","03"].forEach((n,j)=>{x.fillStyle=j===k?f.ac:f.mu;x.globalAlpha=j===k?1:.45;x.fillText(n,w-70-(2-j)*70,92);});x.globalAlpha=1;x.textAlign="left";
  x.fillStyle=f.ac;x.fillText("PUNTO DE PARTIDA · "+f.n,70,92);x.fillStyle=f.fg;let ts=112;do{x.font=`800 ${ts}px ${F.brand}`;ts-=4;}while(x.measureText(f.t).width>w-200);x.fillText(f.t,64,220);
  x.font=`500 50px ${F.body}`;x.fillStyle=f.fg;wrap(x,f.s,w-430,68,70,320);
});
/* pictogramas: 01 el nudo, 02 caminos sin destino, 03 la trama */
function symbol(x,k,cx,cy,r,col){x.save();x.lineCap=x.lineJoin="round";x.strokeStyle=x.fillStyle=col;const lw=r*.085;
  if(k===0){/* un hilo entra, se enreda en lazos y sale */x.lineWidth=lw;x.beginPath();x.moveTo(cx-r*1.25,cy+r*.35);x.lineTo(cx-r*.55,cy+r*.35);
    x.bezierCurveTo(cx+r*.2,cy+r*.35,cx+r*.5,cy-r*.75,cx-r*.05,cy-r*.8);x.bezierCurveTo(cx-r*.75,cy-r*.85,cx-r*.7,cy+r*.15,cx-r*.05,cy+r*.3);
    x.bezierCurveTo(cx+r*.6,cy+r*.45,cx+r*.85,cy-r*.35,cx+r*.35,cy-r*.45);x.bezierCurveTo(cx-r*.15,cy-r*.55,cx-r*.35,cy+r*.05,cx+r*.05,cy+r*.15);
    x.bezierCurveTo(cx+r*.45,cy+r*.25,cx+r*.6,cy+r*.75,cx+r*.15,cy+r*.8);x.bezierCurveTo(cx-r*.3,cy+r*.85,cx-r*.25,cy+r*.35,cx+r*.55,cy+r*.35);x.lineTo(cx+r*1.25,cy+r*.35);x.stroke();}
  if(k===1){/* un hilo recto con ramas paralelas que terminan en duda */x.lineWidth=lw;x.beginPath();x.moveTo(cx-r*1.25,cy);x.lineTo(cx+r*1.25,cy);x.stroke();
    x.lineWidth=lw*.7;x.font=`800 ${r*.5}px ${F.brand}`;x.textAlign="center";x.textBaseline="middle";
    [[-.85,-.7],[-.25,.7],[.35,-.7]].forEach(([o,d])=>{const ax=cx+o*r,ex=ax+Math.abs(d)*r*.55,ey=cy+d*r;x.beginPath();x.moveTo(ax,cy);x.lineTo(ex,ey);x.stroke();x.beginPath();x.arc(ex,ey,lw*.75,0,7);x.fill();x.fillText("?",ex+r*.28,ey);});}
  if(k===2){/* trama: urdimbre y trama que pasan por encima y por debajo */const n=5,st=r*2/n,PAL=["#ff8fab","#8ecae6","#ffd166","#95d5b2","#cdb4db"];x.lineWidth=st*.55;x.lineCap="butt";
    for(let i=0;i<n;i++){const px=cx-r+st*(i+.5);x.strokeStyle=PAL[i];x.beginPath();x.moveTo(px,cy-r);x.lineTo(px,cy+r);x.stroke();}
    for(let j=0;j<n;j++){const py=cy-r+st*(j+.5);x.strokeStyle=j===2?"#e5534b":col;for(let i=0;i<n;i++){if((i+j)%2&&j!==2)continue;x.beginPath();x.moveTo(cx-r+st*i-(i===0?0:1),py);x.lineTo(cx-r+st*(i+1)+1,py);x.stroke();}}}
  x.restore();}
const backTex=(f,k)=>tapaTex((x,w,h)=>{x.fillStyle=f.bg;x.fillRect(0,0,w,h);symbol(x,k,255,h/2,170,k===0?"#e5534b":f.ac);
  x.fillStyle=f.fg;x.font=`800 560px ${F.brand}`;x.textAlign="right";x.fillText(f.n,w-70,h/2+190);x.font=`600 30px ${F.body}`;x.fillStyle=f.mu;x.fillText("PUNTO DE PARTIDA",w-82,h/2+255);x.textAlign="left";});
const CAP=["Primeras puntadas","Crochet: cobija de cuadros","Detalle del crochet","Mochilas en lana guajira","Detalle de una mochila","Bordado a mano","Gobelino","Detalle del gobelino"];
function photoTex(k){const c=document.createElement("canvas");c.width=520;c.height=680;const x=c.getContext("2d");const paint=im=>{x.clearRect(0,0,520,680);x.fillStyle="#f8f6f0";x.fillRect(0,0,520,680);x.fillStyle="#ddd6c8";x.fillRect(30,70,460,460);if(im)x.drawImage(im,30,70,460,460);
  x.fillStyle="#2a2620";x.font=`700 48px ${F.hand}`;x.fillText(CAP[k],34,598);x.font=`500 22px ${F.body}`;x.fillStyle="#8a8378";x.fillText("0"+(k+1),34,648);hole(x,520,36);};paint(null);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;const im=new Image();im.onload=()=>{paint(im);t.needsUpdate=true;};im.src=(window.IMG||{})["ph"+(k+1)]||"";return t;}
/* ===== todo cuelga de un hilito con su argolla y se mece ===== */
const hung=[];
function hang(g,map,w,h,ax,ay,rot,amp,len){const anchor=new T.Group();anchor.position.set(ax,ay,.004);const piv=new T.Group();anchor.add(piv);const L=len||.022;
  const s=new T.Mesh(new T.CylinderGeometry(.0009,.0009,L,5),M.string);s.position.y=-L/2;piv.add(s);
  const ring=new T.Mesh(new T.TorusGeometry(.0045,.0011,6,14),M.string);ring.position.set(0,-L,.001);piv.add(ring);
  const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map,roughness:.85,side:T.DoubleSide,transparent:true,alphaTest:.5}));m.position.set(0,-L-h/2+.012,.003);m.castShadow=true;piv.add(m);
  piv.userData={base:rot||0,amp:amp||.03,ph:rnd()*6.28,f:.9+rnd()*.5};g.add(anchor);hung.push({anchor,piv,card:m});return anchor;}
/* ================= bastidor ================= */
function frame(i){const g=new T.Group();const bar=(w,h,x,y)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,t),M.wood);m.position.set(x,y,0);m.castShadow=m.receiveShadow=true;g.add(m);};
  bar(t,H,t/2,H/2);bar(t,H,W-t/2,H/2);bar(W-2*t,t,W/2,H-t/2);bar(W-2*t,t,W/2,MID);bar(W-2*t,t,W/2,LOW+t/2);
  /* tapas de MDF de 9 mm atornilladas sobre el marco por las dos caras; encima va el propalcote impreso, centrado */
  const tg=new T.BoxGeometry(TAW,TAPA,LT),tf=new T.Mesh(tg,[M.canto,M.canto,M.canto,M.canto,new T.MeshStandardMaterial({map:fichaTex(FI[i],i),roughness:.7}),M.canto]),tb=new T.Mesh(tg,[M.canto,M.canto,M.canto,M.canto,M.canto,new T.MeshStandardMaterial({map:backTex(FI[i],i),roughness:.7})]);
  tf.position.set(W/2,TY0+TAPA/2,t/2+LT/2);tb.position.set(W/2,TY0+TAPA/2,-t/2-LT/2);[tf,tb].forEach(m=>{m.castShadow=true;g.add(m);});g.userData.tapa=tf;
  const {P,near}=nails(g,STEP[i],i===1);const segs=[];const RED=0xb3261e,RED2=0x7d1a14;
  if(i===0){seed=21;const pk=a=>a[Math.floor(rnd()*a.length)];const pairs=[[P.t,P.b],[P.l,P.r],[P.t,P.r],[P.l,P.b],[P.t,P.l],[P.r,P.b]];
    for(let k=0;k<84;k++){const p=pairs[k%6];segs.push([pk(p[0]),pk(p[1]),rnd()<.4?RED2:RED]);}
    const mr=near(P.r,"y",yM);for(let k=0;k<4;k++)segs.push([pk(k%2?P.t:P.b),mr,RED]);
    /* regadas sin patrón; las frases siguen el orden de la entrevista de arriba abajo */
    const pos=scatter(8,CW,CH,SC[0]);
    g.userData.cards=[];pos.forEach((p,fi)=>{g.userData.cards[fi]=hang(g,quoteTex(FR1[fi][0],FR1[fi][1],"dark"),CW,CH,p.x,p.y+CH/2-.012+p.L,(rnd()-.5)*.16,.03,p.L);});}
  if(i===1){const ml=near(P.l,"y",yM),mr=near(P.r,"y",yM);segs.push([ml,mr,RED]);
    P.l.forEach(a=>{if(Math.abs(a.y-yM)>.001)segs.push([a,near(P.r,"y",a.y),0x9a9e99]);});
    /* caminos rectos y paralelos (misma inclinación), sin cruzarse */
    const sl=2,BR=[[.10,.10],[.20,.40],[.32,.20],[.15,-.20],[.27,-.30]];/* cada camino termina sobre un hilo gris */const tags=[];
    BR.forEach((b,k)=>{const a=new T.Vector3(b[0],yM,0),e=new T.Vector3(b[0]+Math.abs(b[1])/sl,yM+b[1],0);segs.push([a,e,RED]);tags.push(hang(g,tagTex(k),.055,.09,e.x,e.y,(k%2?.08:-.08),.16));});
    g.userData.tags=tags;const c0=OX0+.015+CW/2,c2=OX1-.015-CW/2;g.userData.cards=[hang(g,quoteTex(FR2[0][0],FR2[0][1],"gray"),CW,CH,c0,yM+.40,-.03,.03),hang(g,quoteTex(FR2[1][0],FR2[1][1],"gray"),CW,CH,c2,yM-.10,.03,.03),hang(g,quoteTex(FR2[2][0],FR2[2][1],"gray"),CW,CH,c0,yM-.30,-.03,.03)];}
  if(i===2){const PAL=[0xff006e,0x3a86ff,0xffbe0b,0x06d6a0,0x8338ec,0xfb5607,0x118ab2,0xef476f,0x2ec4b6,0xffd166];
    P.t.slice().sort((a,b)=>a.x-b.x).forEach((a,k)=>segs.push([a,near(P.b,"x",a.x),PAL[Math.floor(k/2)%PAL.length]]));
    P.l.slice().sort((a,b)=>a.y-b.y).forEach((a,k)=>{const isR=Math.abs(a.y-yM)<.001;segs.push([a.clone().setZ(.003),near(P.r,"y",a.y).clone().setZ(.003),isR?RED:PAL[(Math.floor(k/3)+3)%PAL.length]]);});
    /* regadas sin patrón; de arriba abajo conservan el orden de antes (01 arriba) */
    const pos=scatter(8,.11,.144,SC[2]),ord=[0,1,2,3,4,5,7,6];g.userData.photos=[];
    pos.forEach((p,j)=>{const k=ord[j];g.userData.photos[k]=hang(g,photoTex(k),.11,.144,p.x,p.y+.072-.012+p.L,(rnd()-.5)*.12,.025,p.L);});}
  threads(g,segs,i===2?.0013:.0015);
  g.traverse(o=>{if(o.isMesh)o.receiveShadow=true;});return g;}
const frames=[0,1,2].map(frame);
function setFinish(k){FIN=k;M.wood.map=k?null:woodTex;M.wood.color.set(k?0x1d1c1b:0xffffff);M.wood.roughness=k?.5:.72;M.wood.needsUpdate=true;M.canto.color.set(k?0xf4f2ee:0x161514);TAPAS.forEach(paintTapa);}
setFinish(FIN);const stand=new T.Group();frames.forEach(f=>stand.add(f));scene.add(stand);
/* bisagras alternas para plegar en acordeón */
const HZ=[ZF+LT,-(ZF+LT)];/* el eje de la bisagra queda a ras de las tapas, sobre un taco de 9 mm, para que plegado no choquen */
const hinges=[];[0,1].forEach(k=>HY.forEach(y=>{const h=new T.Group();const l1=new T.Mesh(new T.BoxGeometry(.035,.075,.003),M.hinge),l2=l1.clone();l1.position.x=-.0175;l2.position.x=.0175;const pin=new T.Mesh(new T.CylinderGeometry(.004,.004,.08,10),M.hinge);
  const sp=new T.Mesh(new T.BoxGeometry(.04,.085,LT),M.wood);sp.position.set(-.02,0,(k?1:-1)*LT/2);h.add(sp);
  h.add(l1,l2,pin);h.traverse(o=>o.castShadow=true);h.userData={k,y};scene.add(h);hinges.push(h);}));
/* hilo rojo entre bastidores: de la puntilla del medio a la puntilla del medio, por delante de los listones */
const cylG=new T.CylinderGeometry(.0016,.0016,1,6,1,true);const conn=[0,1].map(()=>[0,1,2,3,4].map(()=>{const m=new T.Mesh(cylG,M.rojo);m.castShadow=true;scene.add(m);return m;}));
const OPEN={a0:.5,r1:-1.0,r2:1.0},FOLD={a0:.0,r1:-Math.PI+.001,r2:Math.PI-.001};
const up=new T.Vector3(0,1,0);
function seg(m,a,b){const d=b.clone().sub(a),L=d.length();m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(up,d.normalize());m.scale.set(1,Math.max(L,1e-4),1);}
/* fold: 0 abierto en zigzag, 1 plegado */
function layout(fold){const a0=OPEN.a0+(FOLD.a0-OPEN.a0)*fold,r1=OPEN.r1+(FOLD.r1-OPEN.r1)*fold,r2=OPEN.r2+(FOLD.r2-OPEN.r2)*fold;
  const M0=new T.Matrix4().makeRotationY(a0);
  const M1=M0.clone().multiply(new T.Matrix4().makeTranslation(W,0,HZ[0])).multiply(new T.Matrix4().makeRotationY(r1)).multiply(new T.Matrix4().makeTranslation(0,0,-HZ[0]));
  const M2=M1.clone().multiply(new T.Matrix4().makeTranslation(W,0,HZ[1])).multiply(new T.Matrix4().makeRotationY(r2)).multiply(new T.Matrix4().makeTranslation(0,0,-HZ[1]));
  [M0,M1,M2].forEach((m,i)=>{frames[i].matrixAutoUpdate=false;frames[i].matrix.copy(m);});
  const c=new T.Vector3();[0,1,2].forEach(i=>c.add(new T.Vector3(W/2,0,0).applyMatrix4(frames[i].matrix)));c.multiplyScalar(1/3);stand.position.set(-c.x,0,-c.z);stand.updateMatrixWorld(true);
  hinges.forEach(h=>{const {k,y}=h.userData;h.position.copy(new T.Vector3(W,y,HZ[k]).applyMatrix4(frames[k].matrixWorld));const q=new T.Quaternion();frames[k].matrixWorld.decompose(new T.Vector3(),q,new T.Vector3());h.quaternion.copy(q);});
  const zf=ZF+.003;conn.forEach((ms,k)=>{const A=frames[k].matrixWorld,B=frames[k+1].matrixWorld;const p=[new T.Vector3(OX1,yM,0).applyMatrix4(A),new T.Vector3(OX1,yM,zf).applyMatrix4(A),new T.Vector3(W,yM,zf).applyMatrix4(A),new T.Vector3(0,yM,zf).applyMatrix4(B),new T.Vector3(OX0,yM,zf).applyMatrix4(B),new T.Vector3(OX0,yM,0).applyMatrix4(B)];
    for(let s=0;s<5;s++)seg(ms[s],p[s],p[s+1]);ms.forEach(m=>m.visible=fold<.02);
});}
layout(0);
/* ================= cotas ================= */
const dimG=new T.Group();scene.add(dimG);dimG.visible=false;const dmat=new T.LineBasicMaterial({color:0xf2efe8});
function dimLine(a,b,tick){const pts=[a,b];const n=tick.clone();[a,b].forEach(p=>{pts.push(p.clone().addScaledVector(n,.025),p.clone().addScaledVector(n,-.025));});
  const geo=new T.BufferGeometry().setFromPoints(pts);dimG.add(new T.LineSegments(geo,dmat));}
const DIMS=[];
function buildDims(){dimG.children.forEach(o=>o.geometry.dispose());dimG.clear();DIMS.length=0;const A=frames[0].matrixWorld;const v=(x,y,z)=>new T.Vector3(x,y,z).applyMatrix4(A);const X=new T.Vector3(1,0,0).transformDirection(A),Yv=new T.Vector3(0,1,0);
  DIMS.push([v(-.09,0,ZF),v(-.09,H,ZF),X],[v(0,H+.08,ZF),v(W,H+.08,ZF),Yv],[v(W+.07,TY0,ZF+LT),v(W+.07,TY0+TAPA,ZF+LT),X],[v(W+.07,OY0,ZF),v(W+.07,OY1,ZF),X],[v(OX0,OY0+.05,ZF+.01),v(OX1,OY0+.05,ZF+.01),Yv]);
  DIMS.forEach(d=>dimLine(d[0],d[1],d[2]));}
const mid=k=>()=>DIMS[k][0].clone().lerp(DIMS[k][1],.5);
const wp=(f,x,y,z)=>()=>new T.Vector3(x,y,z).applyMatrix4(frames[f].matrixWorld);
/* rótulos técnicos: [texto, posición en el mundo, clase] */
const notes=[[m(H)+" m",mid(0),"dim"],[m(W)+" m",mid(1),"dim"],["Tapa: "+m(TAPA)+" m de alto",mid(2),"dim"],[m(OY1-OY0)+" m de hilo",mid(3),"dim"],[m(IN)+" m por dentro",mid(4),"dim"],
  ["Listón de madera "+t*100+" × "+t*100+" cm",wp(2,W+.12,.9,0)],["Puntillas cada 5 cm",wp(0,W/2,OY1-.02,.05)],["Puntillas cada 10 cm, solo a los lados",wp(1,OX0+.02,yM+.2,.05)],["Puntillas cada 2,5 cm",wp(2,W/2,OY1-.02,.05)],["Bisagra de 3″ (4 en total)",wp(1,W+.02,HY[1],-.05)],["Tapa de MDF 9 mm · "+m(TAW)+" × "+m(TAPA)+" m, con propalcote de "+PRW*100+" × "+PRH*100+" cm",wp(2,W/2,TY0+TAPA/2-.01,.06)]];
return {T,tex,rnd,ease,clamp,m,M,t,IN,W,H,MID,LOW,OX0,OX1,OY0,OY1,OW,ZF,yM,LT,TY0,TAPA,TAW,PRW,PRH,FD,HY,setFinish,get fin(){return FIN;},nails:frames.map(f=>f.userData.nails),frames,stand,hinges,conn,hung,dimG,DIMS,layout,buildDims,notes};
};
