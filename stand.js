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
const LNM=new T.LineBasicMaterial({color:0x151515}),SKM=new T.MeshStandardMaterial({color:0xffffff,roughness:1,emissive:0x2a2a28});
const M={wood:new T.MeshStandardMaterial({map:woodTex,roughness:.72}),hinge:new T.MeshStandardMaterial({color:0xd9b44a,metalness:.8,roughness:.22}),screw:new T.MeshStandardMaterial({color:0x8a6d1f,metalness:.8,roughness:.4}),
  nail:new T.MeshStandardMaterial({color:0xd9d9d4,metalness:.45,roughness:.28}),string:new T.MeshStandardMaterial({color:0xe9e2d3,roughness:.9}),
  rojo:new T.MeshStandardMaterial({color:0xb3261e,roughness:.55,emissive:0x300000}),canto:new T.MeshStandardMaterial({color:0x34322f,roughness:.62})};
/* ================= medidas (m) ================= */
/* listón de 4 × 4 cm; travesaños de 0,50 m por dentro; largueros de 1,60 m; vano de hilos de 0,50 × 1,00 m */
const t=.04,IN=.50,W=IN+2*t,H=1.60,MID=.54;const OX0=t,OX1=W-t,OY0=MID+t/2,OY1=H-t;const OW=OX1-OX0;const ZF=t/2;
const yM=(OY0+OY1)/2;/* altura del hilo rojo: clavo del medio */
/* propalcote: área visible máxima de impresión (47 × 32 cm), centrada en el tablero */
const PRW=.47,PRH=.32;
/* tablero de triplex de 9 mm: deja ver MAR de marco a los lados y abajo, y GAP de travesaño medio arriba (la franja de las puntillas de atrás);
   el borde alrededor del propalcote es parejo, y de ahí sale dónde va el travesaño bajo (LOW = largo de las patas) */
const MAR=.01,GAP=.02,LT=.009,TAW=W-2*MAR,BOR=(TAW-PRW)/2,TAPA=PRH+2*BOR,TY0=OY0-GAP-TAPA,LOW=TY0-MAR;
/* puntillas en la cara de atrás del marco, a NI del borde interior, sobresalen 6 mm; el hilo se amarra en el vástago (plano ZT) */
const NI=.005,NL=.006,ZT=-(t/2+.004);
/* acabado: 1 todo negro (marco y tableros), 0 madera natural y tablero negro */
let FIN=1;
/* bisagras de 2½″ atornilladas directo sobre la madera: entre bastidor y bastidor queda una ranura de HG y el eje va centrado sobre ella.
   PO: del ala al centro del eje. Al cerrar, lo que define el espacio es lo que hay en medio (tableros y puntillas) */
const HG=.01,CZ=0,PO=.0035,HL=.0635;
const AIR=2*(CZ+PO)-2*LT;/* aire entre tableros si cerrara plano (negativo: los tableros se tocan antes) */
const FD=Math.ceil((3*t+6*LT)*100)/100;/* fondo plegado, tablero contra tablero */
/* modo de vista: 0 boceto blanco con contornos, 1 pintado, 2 completo (hilos, tarjetas y propalcotes) */
let MODE=2;
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
  im.castShadow=true;im.instanceColor.needsUpdate=true;im.userData.kind="hilo";g.add(im);return im;}
/* puntillas clavadas en la cara de atrás del marco: desde el frente solo se ven los hilos cruzando el vano.
   Se marcan desde el centro hacia afuera, así siempre hay una en la mitad de cada lado (ahí pasa el hilo rojo); sides: solo en los largueros */
function nails(g,step,sides){const xs=[],ys=[];if(!sides){for(let x=W/2;x<OX1-.012;x+=step)xs.push(x);for(let x=W/2-step;x>OX0+.012;x-=step)xs.push(x);}for(let y=yM;y<OY1-.012;y+=step)ys.push(y);for(let y=yM-step;y>OY0+.012;y-=step)ys.push(y);
  const P={t:xs.map(x=>new T.Vector3(x,OY1+NI,ZT)),b:xs.map(x=>new T.Vector3(x,OY0-NI,ZT)),l:ys.map(y=>new T.Vector3(OX0-NI,y,ZT)),r:ys.map(y=>new T.Vector3(OX1+NI,y,ZT))};
  const all=[].concat(P.t,P.b,P.l,P.r);const sg=new T.CylinderGeometry(.0009,.0009,NL,6).rotateX(Math.PI/2),hg=new T.CylinderGeometry(.0024,.0024,.0008,12).rotateX(Math.PI/2);
  const shank=new T.InstancedMesh(sg,M.nail,all.length),head=new T.InstancedMesh(hg,M.nail,all.length);const m4=new T.Matrix4();
  all.forEach((p,i)=>{m4.makeTranslation(p.x,p.y,-t/2-NL/2);shank.setMatrixAt(i,m4);m4.makeTranslation(p.x,p.y,-t/2-NL);head.setMatrixAt(i,m4);});shank.userData.kind=head.userData.kind="puntilla";g.add(shank,head);
  g.userData.nails={step,n:all.length,tb:xs.length,lr:ys.length};
  const near=(arr,k,v)=>arr.reduce((m,p)=>Math.abs(p[k]-v)<Math.abs(m[k]-v)?p:m);return {P,near};}
/* ================= textos ================= */
const FR1=[["Al principio ellos pedían y pagaban, después ya no, ellos ya solo pedían, ya no pagaban, hasta que se acabó la tienda.","01:20"],["Permiso teníamos solamente hasta las 6 de la tarde. Después ya no podíamos andar.","01:45"],["Llegaban a nuestras casas 2, 3 de la mañana para que nos levantemos y ellos poder descansar.","02:28"],["Tenían personas secuestradas y las llevaban a la casa.","03:40"],["De una loma el ejército, de la otra loma guerrilla y nosotros en la mitad.","04:01"],["Nos metíamos debajo la cama, debajo las mesas.","04:14"],["Los dejaban que amanezcan, amarrados a un árbol y sin nada de ropa, y les ponían un letrero arriba: por sapos.","05:15"],["Nos decían que si nosotros decíamos algo (…) que nos mataban, o si no, que nos quitaban los niños pequeños.","05:37"]];
const FR2=[["Decidimos mejor salir de la vereda y venirnos acá a la ciudad.","05:55"],["Uno llega sin saber qué hacer, dónde irse.","06:10"],["Es muy distinta la vida de ciudad a la vida de campo.","06:22"]];
function torn(x,w,h,fill){x.fillStyle=fill;x.fillRect(0,0,w,h);seed=Math.floor(w+h);for(let k=0;k<900;k++){x.fillStyle=fill!=="#f6f4ee"?`rgba(255,255,255,${rnd()*.03})`:`rgba(0,0,0,${rnd()*.03})`;x.fillRect(rnd()*w,rnd()*h,2,2);}}
/* tarjetas: se dibujan a un tamaño lógico y se pueden pintar a más resolución para imprimir (ART, al final) */
function cvs(w,h,sc,draw){const c=document.createElement("canvas");c.width=Math.round(w*sc);c.height=Math.round(h*sc);const x=c.getContext("2d");x.scale(sc,sc);draw(x,w,h);return c;}
const asTex=c=>{const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;};
function lines(x,s,mw){const out=[];let line="";for(const w of s.split(" ")){const t=line?line+" "+w:w;if(x.measureText(t).width>mw&&line){out.push(line);line=w;}else line=t;}if(line)out.push(line);return out;}
function punch(x,cx,cy,r,ring){if(ring){x.save();x.strokeStyle=ring;x.lineWidth=r*.9;x.beginPath();x.arc(cx,cy,r*1.55,0,7);x.stroke();x.restore();}x.save();x.globalCompositeOperation="destination-out";x.beginPath();x.arc(cx,cy,r,0,7);x.fill();x.restore();}
function track(x,s,X,Y,sp){let xx=X;for(const ch of s){x.fillText(ch,xx,Y);xx+=x.measureText(ch).width+sp;}return xx;}
/* frases de la entrevista: negro en el 1 (lo oscuro), gris en el 2 (el limbo). 15 × 10,7 cm */
const QS={dark:{bg:"#0f0e0d",fg:"#ffffff",mu:"#8f897f",ac:"#e5534b",lab:"01 · LO QUE PASÓ"},gray:{bg:"#6f6b66",fg:"#ffffff",mu:"#d9d3c9",ac:"#ffffff",lab:"02 · LO QUE NO SE VE"}};
const QW=900,QH=642;
const drawQuote=(s,ts,k,n,of)=>(x,w,h)=>{const c=QS[k];torn(x,w,h,c.bg);
  x.fillStyle=c.ac;x.font=`600 21px ${F.body}`;track(x,c.lab,64,82,2.6);
  x.textAlign="right";x.fillStyle=c.mu;x.font=`600 21px ${F.body}`;x.fillText(String(n).padStart(2,"0")+" / "+String(of).padStart(2,"0"),w-64,82);x.textAlign="left";
  x.fillStyle=c.ac;x.font=`800 190px ${F.brand}`;x.fillText("“",50,268);
  x.textAlign="right";x.fillText("”",w-50,h-44);x.textAlign="left";
  let z=58,L;for(;z>30;z-=2){x.font=`500 ${z}px ${F.body}`;L=lines(x,s,w-270);if(L.length*z*1.26<=h-330)break;}
  x.fillStyle=c.fg;const top=180+Math.max(0,(h-330-L.length*z*1.26)/2);L.forEach((l,i)=>x.fillText(l,135,top+z*.95+i*z*1.26));
  x.fillStyle=c.mu;x.globalAlpha=.5;x.fillRect(64,h-98,w-128,2);x.globalAlpha=1;
  x.font=`500 22px ${F.body}`;x.fillText("Entrevista · minuto "+ts,64,h-56);x.textAlign="right";x.fillText("Punto de partida",w-64,h-56);x.textAlign="left";
  punch(x,w/2,62,15);};
const quoteTex=(s,ts,k,n,of)=>asTex(cvs(QW,QH,1,drawQuote(s,ts,k,n,of)));
/* etiquetas de destino del bastidor 2 (5,5 × 9 cm): el destino tachado, en duda o borroneado */
const DEST=[["Vereda",1],["¿?",0],["",2],["Dónde?",1],["¿?",2]];
const GW=330,GH=540;
const drawTag=n=>(x,w,h)=>{const ct=48;x.fillStyle="#efe6d2";x.beginPath();x.moveTo(ct,0);x.lineTo(w-ct,0);x.lineTo(w,ct);x.lineTo(w,h);x.lineTo(0,h);x.lineTo(0,ct);x.closePath();x.fill();
  seed=n*31+7;for(let k=0;k<500;k++){x.fillStyle=`rgba(90,70,40,${rnd()*.05})`;x.fillRect(rnd()*w,rnd()*h,2,2);}
  x.fillStyle="#3a3631";x.font=`600 22px ${F.body}`;track(x,"DESTINO",40,158,4);x.fillStyle="#3a3631";x.globalAlpha=.35;x.fillRect(40,176,w-80,2);x.globalAlpha=1;
  const d=DEST[n%DEST.length];x.font=`700 70px ${F.hand}`;x.fillStyle="#2f2b26";if(d[0])x.fillText(d[0],40,272);
  x.strokeStyle="#2a2620";x.lineWidth=6;x.lineCap="round";if(d[1]===1){x.beginPath();x.moveTo(34,252);x.lineTo(Math.min(w-30,48+x.measureText(d[0]).width),240);x.stroke();}
  if(d[1]===2){seed=n+5;x.beginPath();x.moveTo(44,262);for(let k=0;k<16;k++)x.lineTo(44+rnd()*(w-90),222+rnd()*70);x.stroke();}
  x.strokeStyle="#9c8f74";x.lineWidth=2;x.setLineDash([3,9]);[352,422].forEach(y=>{x.beginPath();x.moveTo(40,y);x.lineTo(w-40,y);x.stroke();});x.setLineDash([]);
  x.fillStyle="#8a7f6a";x.font=`600 17px ${F.body}`;track(x,"02 · LO QUE NO SE VE",40,h-36,1.6);
  punch(x,w/2,64,15,"#d7c9a6");};
const tagTex=n=>asTex(cvs(GW,GH,1,drawTag(n)));
/* tapas de MDF (frente: número, título e historia; atrás: número y símbolo) */
const FI=[{t:"Lo que pasó",n:"01",s:"En La Concepción Alto, entre montañas, ella tenía una tienda, sus cuyes y sus gallinas. Un día llegaron hombres armados: pedían sin pagar, ponían horarios y tocaban la puerta de madrugada. Entre el ejército y la guerrilla, su familia quedó en la mitad.",bg:"#0d0c0b",fg:"#ffffff",mu:"#a9a39a",ac:"#e5534b"},
 {t:"Lo que no se ve",n:"02",s:"Por sus hijos decidieron irse. Llegaron a la ciudad con lo que pudieron cargar, sin casa ni trabajo, sin saber adónde ir. Nadie notó lo que traían: el miedo no se ve, pero pesa.",bg:"#77736d",fg:"#ffffff",mu:"#e4dfd6",ac:"#ffffff"},
 {t:"Lo que volvió a tejer",n:"03",s:"Pero la historia no terminó ahí. Con lana virgen teñida a mano, chaquiras y agujas, ella volvió a empezar. Hoy teje y borda por encargo, y en cada puntada sostiene a su familia.",bg:"#f4f2ee",fg:"#1a1918",mu:"#8a857d",ac:"#e0218a"}];
/* el tablero va negro, con el propalcote de PRW × PRH centrado; el diseño se pinta aparte y se pega en su sitio */
const TW=1280,TH2=Math.round(TW*TAPA/TAW),DW=1280,DH=Math.round(DW*PRH/PRW);const dc=document.createElement("canvas");dc.width=DW;dc.height=DH;const dctx=dc.getContext("2d");
const TAPAS=[];const BLK="#34322f";/* negro con cuerpo: se leen luces, sombras y aristas */
function paintTapa(o){const x=o.t.image.getContext("2d"),w=TW,h=TH2;x.fillStyle=BLK;x.fillRect(0,0,w,h);dctx.clearRect(0,0,DW,DH);o.draw(dctx,DW,DH);
  const pw=w*PRW/TAW,ph=h*PRH/TAPA;x.drawImage(dc,(w-pw)/2,(h-ph)/2,pw,ph);o.t.needsUpdate=true;}
function tapaTex(draw){const o={t:tex(TW,TH2,()=>{}),draw};TAPAS.push(o);paintTapa(o);return o.t;}
const drawFicha=(f,k)=>((x,w,h)=>{x.fillStyle=f.bg;x.fillRect(0,0,w,h);
  /* número enorme abajo a la derecha, saliéndose del borde y subiendo hacia la izquierda: el texto queda encima */
  x.font=`800 700px ${F.brand}`;x.textAlign="right";x.fillStyle=f.ac;x.globalAlpha=k===1?.16:.2;x.fillText(f.n,w+30,h-50);x.globalAlpha=1;
  x.font=`600 26px ${F.body}`;["01","02","03"].forEach((n,j)=>{x.fillStyle=j===k?f.ac:f.mu;x.globalAlpha=j===k?1:.45;x.fillText(n,w-70-(2-j)*64,92);});x.globalAlpha=1;x.textAlign="left";
  x.fillStyle=f.ac;x.font=`600 24px ${F.body}`;track(x,"PUNTO DE PARTIDA",70,92,3.5);
  x.fillStyle=f.fg;let ts=112;do{x.font=`800 ${ts}px ${F.brand}`;ts-=4;}while(x.measureText(f.t).width>w-200);x.fillText(f.t,64,224);
  x.font=`500 46px ${F.body}`;x.fillStyle=f.fg;wrap(x,f.s,w-300,64,70,318);
});
const fichaTex=(f,k)=>tapaTex(drawFicha(f,k));
/* pictogramas de los respaldos: siempre una sola línea roja, delgada y continua, que entra por la izquierda y sale por la
   derecha a media altura en los tres (así el hilo pasa de una tapa a la otra). Cada respaldo tiene varias opciones (SYMV elige):
   01 · 0 lazos curvos · 1 nudo puntudo · 2 nudo de un trazo
   02 · 0 caminos sin destino · 1 hilo tembloroso · 2 latido irregular
   03 · 0 trama de ida y vuelta · 1 cadeneta */
const RED_I="#c4302b";
const SYMN=[["Lazos curvos","Nudo puntudo","Nudo de un trazo"],["Caminos sin destino","Hilo tembloroso","Latido irregular"],["Trama de ida y vuelta","Cadeneta"]];
let SYMV=[1,1,0];/* opción vigente de cada respaldo */
function symbol(x,k,cx,cy,sz,w,v){v=v??SYMV[k];x.save();x.lineCap=x.lineJoin="round";x.strokeStyle=RED_I;x.lineWidth=7;const r=sz/2;let sd=11;const R=()=>{sd=(sd*16807)%2147483647;return sd/2147483647;};
  x.beginPath();x.moveTo(0,cy);
  if(k===0&&v===0){/* lazos que crecen y vuelven a cerrarse */const N=5,span=sz*1.3,x0=cx-span/2,A=span/(2*Math.PI*N);
    x.lineTo(x0,cy);for(let q=0;q<=600;q++){const u=q/600,t=u*2*Math.PI*N,B=sz*.33*Math.sin(Math.PI*u);x.lineTo(x0+A*t-B*Math.sin(t),cy-B*Math.cos(t));}
    x.lineTo(w,cy);x.stroke();}
  if(k===0&&v===1){/* nudo irregular: tramos rectos y quiebres agudos que se cruzan */
    x.lineJoin="miter";x.miterLimit=12;x.lineTo(cx-r*1.3,cy);
    for(let i=0;i<17;i++){const a=i*2.45+R()*1.1,rr=r*(.38+R()*.62);x.lineTo(cx+Math.cos(a)*rr*1.3,cy+Math.sin(a)*rr*1.0);}
    x.lineTo(cx+r*1.3,cy);x.lineTo(w,cy);x.stroke();}
  if(k===0&&v===2){/* nudo de un trazo (trébol): el hilo llega, da tres vueltas que se cruzan y sigue por el mismo punto */
    const sc=sz*.6/5.06,P=t=>[cx+sc*(Math.sin(t)+2*Math.sin(2*t)),cy-sc*(3+Math.cos(t)-2*Math.cos(2*t))];
    x.lineTo(...P(Math.PI));for(let q=0;q<=720;q++){x.lineTo(...P(Math.PI+q/720*2*Math.PI));}x.lineTo(w,cy);x.stroke();}
  if(k===1&&v===0){/* tres caminos paralelos que terminan en un punto vacío */x.lineTo(w,cy);x.stroke();
    [[-.7,-.75],[-.15,.7],[.4,-.75]].forEach(([o,d])=>{const ax=cx+o*r,ex=ax+Math.abs(d)*r*.6,ey=cy+d*r;x.beginPath();x.moveTo(ax,cy);x.lineTo(ex,ey);x.stroke();
      x.beginPath();x.arc(ex+(ex-ax)*.12,ey+(ey-cy)*.12,11,0,7);x.stroke();});}
  if(k===1&&v===1){/* el hilo tiembla, se devuelve y no sabe hacia dónde ir */sd=5;
    const L=r*2.9,xa=cx-L/2;x.lineTo(xa,cy);
    for(let q=0;q<=900;q++){const u=q/900,env=Math.sin(Math.PI*u);
      x.lineTo(xa+u*L-env*r*.2*Math.sin(u*Math.PI*9),cy+env*r*(.36*Math.sin(u*Math.PI*4.6+1)+.2*Math.sin(u*Math.PI*12.3))+(Math.sin(u*Math.PI*140)*5+(R()-.5)*7)*env);}
    x.lineTo(w,cy);x.stroke();}
  if(k===1&&v===2){/* latido irregular: picos verticales de distinta altura y a destiempo, como un pulso que no se calma */
    x.lineJoin="miter";x.miterLimit=10;const L=r*2.8,xa=cx-L/2;x.lineTo(xa,cy);let px=xa;
    const B=[[.07,.25,-.1],[.1,.95,-.55],[.05,.4,-.2],[.13,.7,-.9],[.06,.3,-.15],[.09,1,-.4],[.07,.5,-.7],[.1,.2,-.1]];
    const gap=(L-B.reduce((a,b)=>a+b[0]*r*2.2,0))/(B.length+1);
    B.forEach(([wd,up,dn])=>{px+=gap*(.6+R()*.8);const ww=wd*r*2.2;x.lineTo(px,cy);x.lineTo(px+ww*.3,cy-up*r);x.lineTo(px+ww*.62,cy-dn*r);x.lineTo(px+ww,cy);px+=ww;});
    x.lineTo(xa+L,cy);x.lineTo(w,cy);x.stroke();}
  if(k===2&&v===0){/* el hilo sube y teje cinco pasadas de ida y vuelta, luego baja y sigue */const n=5,s2=sz*.8/(n-1),x0=cx-r*.8,x1=cx+r*.8,top=cy-s2*(n-1)/2,rt=s2/2;
    x.lineTo(x0-s2,cy);x.lineTo(x0-s2,top+rt);x.arcTo(x0-s2,top,x0-s2+rt,top,rt);x.lineTo(x0,top);
    for(let i=0;i<n;i++){const y=top+i*s2,ltr=i%2===0;x.lineTo(ltr?x1:x0,y);if(i<n-1)x.arc(ltr?x1:x0,y+rt,rt,-Math.PI/2,Math.PI/2,!ltr);}
    const yb=top+(n-1)*s2;x.lineTo(x1+s2-rt,yb);x.arcTo(x1+s2,yb,x1+s2,yb-rt,rt);x.lineTo(x1+s2,cy);x.lineTo(w,cy);x.stroke();}
  if(k===2&&v===1){/* cadeneta: el primer punto del tejido; lazos iguales, en fila y en calma */const N=6,span=sz*1.4,x0=cx-span/2,A=span/(2*Math.PI*N),B=sz*.15,Hh=sz*.42;
    x.lineTo(x0,cy);for(let q=0;q<=840;q++){const u=q/840,t=u*2*Math.PI*N,e=Math.min(1,u*N*1.2,(1-u)*N*1.2);x.lineTo(x0+A*t-B*e*Math.sin(t),cy-Hh*e*(1-Math.cos(t))/2);}
    x.lineTo(w,cy);x.stroke();}
  x.restore();}
const drawBack=(f,k,v)=>((x,w,h)=>{x.fillStyle=f.bg;x.fillRect(0,0,w,h);
  symbol(x,k,w*.5,h*.5,Math.min(w*.42,h*.6),w,v);
  /* número pequeño arriba a la izquierda, con el rótulo debajo; el nombre del momento abajo a la derecha */
  x.textAlign="left";x.textBaseline="alphabetic";x.fillStyle=f.fg;x.font=`800 76px ${F.brand}`;x.fillText(f.n,66,140);
  x.fillStyle=f.mu;x.font=`600 22px ${F.body}`;track(x,"PUNTO DE PARTIDA",70,180,3.5);
  x.font=`600 30px ${F.body}`;x.textAlign="right";x.fillText(f.t,w-64,h-56);x.textAlign="left";});
const backTex=(f,k)=>tapaTex(drawBack(f,k));
/* fotos del bastidor 3: mismo formato que las frases (15 × 10,7 cm). Arriba el rótulo, en medio la foto, abajo de qué es:
   proceso de trabajo, materiales u obras. Provisionales hasta tener las fotos finales */
const CAP=[["Proceso","Tiñendo lana virgen con tintes naturales"],["Proceso","Bordando a mano con lana virgen"],["Obra","Ropa bordada a mano con lana virgen"],["Obra","Mochilas en hilo guajiro hechas a pedido"],
  ["Obra","Sombrero bordado con chaquiras"],["Obra","Monederos, llaveros y bolsitas en lana virgen"],["Obra","Cartera de anillas de lata recicladas e hilo guajiro"],["Obra","Aretes y anillos en chaquiras"]];
const PW_=QW,PH_=QH,COL3P=["#e8b400","#2f6fd6","#2e9e4f","#e0218a"];
const drawPhoto=(k,im)=>(x,w,h)=>{x.fillStyle="#f6f4ee";x.fillRect(0,0,w,h);seed=k*17+3;for(let q=0;q<700;q++){x.fillStyle=`rgba(0,0,0,${rnd()*.025})`;x.fillRect(rnd()*w,rnd()*h,2,2);}
  x.fillStyle="#e0218a";x.font=`600 19px ${F.body}`;track(x,"03 · LO QUE VOLVIÓ A TEJER",64,76,1.8);
  x.textAlign="right";x.fillStyle="#8a857d";x.fillText(String(k+1).padStart(2,"0")+" / 08",w-64,76);x.textAlign="left";
  const px=64,py=100,pw=w-128,ph=Math.round(pw*9/16);/* 16:9 */x.fillStyle="#ddd6c8";x.fillRect(px,py,pw,ph);
  if(im&&im.width){const r=pw/ph;let sw=im.width,sh=im.width/r;if(sh>im.height){sh=im.height;sw=sh*r;}x.drawImage(im,(im.width-sw)/2,(im.height-sh)/2,sw,sh,px,py,pw,ph);}
  const [cat,txt]=CAP[k];x.fillStyle="#1a1918";x.font=`700 19px ${F.body}`;const e=track(x,cat.toUpperCase(),64,h-50,2.2);
  x.fillStyle="#3a3631";let fz=24;do{x.font=`500 ${fz}px ${F.body}`;fz--;}while(fz>17&&x.measureText("·  "+txt).width>w-180-e);x.fillText("·  "+txt,e+10,h-50);
  COL3P.forEach((c,i)=>{x.fillStyle=c;x.beginPath();x.arc(w-72-i*24,h-58,7.5,0,7);x.fill();});
  punch(x,w/2,62,15);};
const photoImg=k=>new Promise(res=>{const src=(window.IMG||{})["ph"+(k+1)];if(!src){res(null);return;}const im=new Image();im.onload=()=>res(im);im.onerror=()=>res(null);im.src=src;});
function photoTex(k){const c=document.createElement("canvas");c.width=PW_;c.height=PH_;const x=c.getContext("2d");drawPhoto(k,null)(x,PW_,PH_);const t=asTex(c);
  photoImg(k).then(im=>{if(im){x.clearRect(0,0,PW_,PH_);drawPhoto(k,im)(x,PW_,PH_);t.needsUpdate=true;}});return t;}
/* ===== todo cuelga de un hilito con su argolla y se mece ===== */
const hung=[];
function hang(g,map,w,h,ax,ay,rot,amp,len){const anchor=new T.Group();anchor.position.set(ax,ay,ZT+.004);/* cuelga del hilo, por delante */const piv=new T.Group();anchor.add(piv);const L=len||.022;
  const s=new T.Mesh(new T.CylinderGeometry(.0009,.0009,L,5),M.string);s.position.y=-L/2;piv.add(s);
  const ring=new T.Mesh(new T.TorusGeometry(.0045,.0011,6,14),M.string);ring.position.set(0,-L,.001);piv.add(ring);
  const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map,roughness:.85,transparent:true,alphaTest:.5}));m.position.set(0,-L-h/2+.012,.003);m.castShadow=true;piv.add(m);
  /* el respaldo de cada pieza es el papel en blanco (se imprime por una sola cara): misma silueta, con su agujero */
  {const src=map.image,mk=document.createElement("canvas");mk.width=src.width;mk.height=src.height;const mx=mk.getContext("2d");mx.drawImage(src,0,0);mx.globalCompositeOperation="source-in";mx.fillStyle="#f7f5f0";mx.fillRect(0,0,mk.width,mk.height);
   const bk=new T.Mesh(m.geometry,new T.MeshStandardMaterial({map:asTex(mk),roughness:.9,emissive:0x3a3936,transparent:true,alphaTest:.5}));bk.rotation.y=Math.PI;bk.position.z=-.0004;bk.castShadow=true;m.add(bk);}
  piv.userData={base:rot||0,amp:amp||.03,ph:rnd()*6.28,f:.9+rnd()*.5};anchor.userData.kind="colgante";g.add(anchor);hung.push({anchor,piv,card:m});return anchor;}
/* ================= bastidor ================= */
function frame(i){const g=new T.Group();const bar=(w,h,x,y)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,t),M.wood);m.position.set(x,y,0);m.castShadow=m.receiveShadow=true;m.userData.kind="solido";g.add(m);};
  bar(t,H,t/2,H/2);bar(t,H,W-t/2,H/2);bar(W-2*t,t,W/2,H-t/2);bar(W-2*t,t,W/2,MID);bar(W-2*t,t,W/2,LOW+t/2);
  /* tapas de MDF de 9 mm atornilladas sobre el marco por las dos caras; encima va el propalcote impreso, centrado */
  const tg=new T.BoxGeometry(TAW,TAPA,LT),tf=new T.Mesh(tg,[M.canto,M.canto,M.canto,M.canto,new T.MeshStandardMaterial({map:fichaTex(FI[i],i),roughness:.7}),M.canto]),tb=new T.Mesh(tg,[M.canto,M.canto,M.canto,M.canto,M.canto,new T.MeshStandardMaterial({map:backTex(FI[i],i),roughness:.7})]);
  tf.position.set(W/2,TY0+TAPA/2,t/2+LT/2);tb.position.set(W/2,TY0+TAPA/2,-t/2-LT/2);[tf,tb].forEach((m,j)=>{m.castShadow=true;m.userData.kind="solido";m.userData.mat1=Array(6).fill(M.canto);g.add(m);
    /* en el boceto, el sitio del propalcote marcado con un recuadro negro */
    const r=new T.LineLoop(new T.BufferGeometry().setFromPoints([[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>new T.Vector3(a*PRW/2,b*PRH/2,(j?-1:1)*(LT/2+.0008)))),LNM);r.userData.kind="propal";r.visible=false;m.add(r);});g.userData.tapa=tf;
  /* clavitos que sujetan el tablero: 7 arriba, 7 abajo y 3 más en cada larguero, centrados en la parte montada sobre el marco */
  {const hx=TAW/2-(t-MAR)/2,yb=-TAPA/2+(t-MAR)/2,yt=TAPA/2-(t-GAP)/2,P=[];[-hx,-.18,-.09,0,.09,.18,hx].forEach(x=>P.push([x,yb],[x,yt]));[1,2,3].forEach(k=>{const y=yb+.095*k;P.push([-hx,y],[hx,y]);});/* cada 9 cm a lo ancho, cada 9,5 cm a lo alto */
   const hg=new T.CylinderGeometry(.0021,.0021,.0008,10).rotateX(Math.PI/2),im=new T.InstancedMesh(hg,M.nail,P.length*2),m4=new T.Matrix4();
   P.forEach(([x,y],k)=>{[1,-1].forEach((sd,j)=>{m4.makeTranslation(W/2+x,TY0+TAPA/2+y,sd*(t/2+LT+.0004));im.setMatrixAt(k*2+j,m4);});});im.userData.kind="puntilla";g.add(im);g.userData.clavitos=P.length;}
  const {P,near}=nails(g,STEP[i],i===1);const segs=[];const RED=0xb3261e,RED2=0x7d1a14;
  if(i===0){seed=21;const pk=a=>a[Math.floor(rnd()*a.length)];const pairs=[[P.t,P.b],[P.l,P.r],[P.t,P.r],[P.l,P.b],[P.t,P.l],[P.r,P.b]];
    for(let k=0;k<84;k++){const p=pairs[k%6];segs.push([pk(p[0]),pk(p[1]),rnd()<.4?RED2:RED]);}
    const mr=near(P.r,"y",yM);for(let k=0;k<4;k++)segs.push([pk(k%2?P.t:P.b),mr,RED]);
    /* regadas sin patrón; las frases siguen el orden de la entrevista de arriba abajo */
    /* frases en zigzag irregular, en el orden de la entrevista de arriba abajo: centro x, borde superior y, giro, cordón (m) */
    const P1=[[.38,1.53,.06,.026],[.14,1.46,-.05,.034],[.28,1.31,.04,.018],[.45,1.19,-.07,.03],[.15,1.14,.06,.022],[.33,.99,-.04,.038],[.14,.86,-.06,.02],[.42,.78,.05,.03]];
    g.userData.cards=P1.map(([x,y,r,L],fi)=>hang(g,quoteTex(FR1[fi][0],FR1[fi][1],"dark",fi+1,8),CW,CH,x,y+L-.012,r,.03,L));}
  if(i===1){const ml=near(P.l,"y",yM),mr=near(P.r,"y",yM);segs.push([ml,mr,RED]);
    P.l.forEach(a=>{if(Math.abs(a.y-yM)>.001)segs.push([a,near(P.r,"y",a.y),0x9a9e99]);});
    /* caminos rectos y paralelos (misma inclinación), sin cruzarse */
    const sl=2,BR=[[.10,.10],[.20,.40],[.32,.20],[.15,-.20],[.27,-.30]];/* cada camino termina sobre un hilo gris */const tags=[];
    BR.forEach((b,k)=>{const a=new T.Vector3(b[0],yM,ZT),e=new T.Vector3(b[0]+Math.abs(b[1])/sl,yM+b[1],ZT);segs.push([a,e,RED]);tags.push(hang(g,tagTex(k),.055,.09,e.x,e.y,(k%2?.08:-.08),.16));});
    g.userData.tags=tags;const c0=OX0+.015+CW/2,c2=OX1-.015-CW/2;g.userData.cards=[hang(g,quoteTex(FR2[0][0],FR2[0][1],"gray",1,3),CW,CH,c0,yM+.40,-.03,.03),hang(g,quoteTex(FR2[1][0],FR2[1][1],"gray",2,3),CW,CH,c2,yM-.10,.03,.03),hang(g,quoteTex(FR2[2][0],FR2[2][1],"gray",3,3),CW,CH,c0,yM-.30,-.03,.03)];}
  if(i===2){const PAL=[0xf2c200,0x2f6fd6,0x2e9e4f,0xe0218a];/* amarillo, azul, verde, fucsia: verticales de a 2, horizontales de a 3 */
    P.t.slice().sort((a,b)=>a.x-b.x).forEach((a,k)=>segs.push([a,near(P.b,"x",a.x),PAL[Math.floor(k/2)%PAL.length]]));
    P.l.slice().sort((a,b)=>a.y-b.y).forEach((a,k)=>{const isR=Math.abs(a.y-yM)<.001;segs.push([a.clone().setZ(ZT+.003),near(P.r,"y",a.y).clone().setZ(ZT+.003),isR?RED:PAL[(Math.floor(k/3)+3)%PAL.length]]);});
    /* regadas sin patrón; de arriba abajo conservan el orden de antes (01 arriba) */
    /* fotos en zigzag irregular, de la 01 arriba a la 08 abajo: centro x, borde superior y, giro, largo del cordón (m) */
    const P3=[[.17,1.53,-.07,.022],[.42,1.47,.05,.036],[.30,1.32,-.03,.016],[.13,1.17,.08,.03],[.44,1.13,-.06,.04],[.27,.97,.04,.018],[.45,.84,.07,.028],[.16,.76,-.05,.02]];
    g.userData.photos=P3.map(([x,y,r,L],k)=>hang(g,photoTex(k),CW,CH,x,y+L-.012,r,.022,L));}
  threads(g,segs,i===2?.0013:.0015);
  g.traverse(o=>{if(o.isMesh)o.receiveShadow=true;});return g;}
const frames=[0,1,2].map(frame);
function setFinish(k){FIN=k;M.wood.map=k?null:woodTex;M.wood.color.set(k?BLK:0xffffff);M.wood.roughness=k?.62:.72;M.wood.needsUpdate=true;M.canto.color.set(BLK);TAPAS.forEach(paintTapa);}
setFinish(FIN);const stand=new T.Group();frames.forEach(f=>stand.add(f));scene.add(stand);
/* bisagras alternas para plegar en acordeón */
const HZ=[ZF+PO,-(ZF+PO)];/* eje de la bisagra, justo por fuera de la madera */
/* cada bisagra: el eje (canuto) sobre la ranura, un ala atornillada en la cara de cada bastidor; el ala 2 gira con el bastidor vecino */
const hinges=[];[0,1].forEach(k=>HY.forEach(y=>{const h=new T.Group();const lz=(k?1:-1)*(PO-.00075);
  const leaf=sx=>{const g=new T.Group();const l=new T.Mesh(new T.BoxGeometry(.025,HL,.0015),M.hinge);l.position.set(sx*(.0125+.0005),0,lz);g.add(l);
    [-.022,0,.022].forEach(yy=>{const sc=new T.Mesh(new T.CylinderGeometry(.0028,.0028,.001,12),M.screw);sc.rotation.x=Math.PI/2;sc.position.set(sx*.015,yy,lz+(k?-1:1)*.0008);g.add(sc);});return g;};
  const p1=leaf(-1),p2=leaf(1);const pin=new T.Mesh(new T.CylinderGeometry(PO,PO,HL,16),M.hinge);
  h.add(p1,p2,pin);h.traverse(o=>{if(o.isMesh){o.castShadow=true;o.userData.kind="solido";}});h.userData={k,y,p2};scene.add(h);hinges.push(h);}));
/* hilo rojo entre bastidores (se ubica en layout) */
const cylG=new T.CylinderGeometry(.0016,.0016,1,6,1,true);const conn=[0,1].map(()=>[0,1,2,3,4].map(()=>{const m=new T.Mesh(cylG,M.rojo);m.castShadow=true;scene.add(m);return m;}));
const OPEN={a0:.5,r1:-1.0,r2:1.0},FOLD={a0:.0,r1:-Math.PI+.001,r2:Math.PI-.001};
const up=new T.Vector3(0,1,0);
function seg(m,a,b){const d=b.clone().sub(a),L=d.length();m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(up,d.normalize());m.scale.set(1,Math.max(L,1e-4),1);}
/* fold: 0 abierto en zigzag, 1 plegado */
function layout(fold){const a0=OPEN.a0+(FOLD.a0-OPEN.a0)*fold,r1=OPEN.r1+(FOLD.r1-OPEN.r1)*fold,r2=OPEN.r2+(FOLD.r2-OPEN.r2)*fold;
  const M0=new T.Matrix4().makeRotationY(a0);
  const M1=M0.clone().multiply(new T.Matrix4().makeTranslation(W+HG/2,0,HZ[0])).multiply(new T.Matrix4().makeRotationY(r1)).multiply(new T.Matrix4().makeTranslation(HG/2,0,-HZ[0]));
  const M2=M1.clone().multiply(new T.Matrix4().makeTranslation(W+HG/2,0,HZ[1])).multiply(new T.Matrix4().makeRotationY(r2)).multiply(new T.Matrix4().makeTranslation(HG/2,0,-HZ[1]));
  [M0,M1,M2].forEach((m,i)=>{frames[i].matrixAutoUpdate=false;frames[i].matrix.copy(m);});
  const c=new T.Vector3();[0,1,2].forEach(i=>c.add(new T.Vector3(W/2,0,0).applyMatrix4(frames[i].matrix)));c.multiplyScalar(1/3);stand.position.set(-c.x,0,-c.z);stand.updateMatrixWorld(true);
  hinges.forEach(h=>{const {k,y,p2}=h.userData;h.position.copy(new T.Vector3(W+HG/2,y,HZ[k]).applyMatrix4(frames[k].matrixWorld));const q=new T.Quaternion();frames[k].matrixWorld.decompose(new T.Vector3(),q,new T.Vector3());h.quaternion.copy(q);p2.rotation.y=k?r2:r1;});
  /* hilo rojo entre bastidores: por detrás, de la puntilla del medio a la del medio, rodeando la junta */
  conn.forEach((ms,k)=>{const A=frames[k].matrixWorld,B=frames[k+1].matrixWorld;const a=new T.Vector3(OX1+NI,yM,ZT).applyMatrix4(A),b=new T.Vector3(W,yM,ZT).applyMatrix4(A),c=new T.Vector3(0,yM,ZT).applyMatrix4(B),d=new T.Vector3(OX0-NI,yM,ZT).applyMatrix4(B);const p=[a,a,b,c,d,d];
    for(let s=0;s<5;s++)seg(ms[s],p[s],p[s+1]);ms.forEach(m=>m.visible=fold<.02&&MODE===2);
});}
layout(0);
function edgesOf(o){if(!o.userData.edges){const e=new T.LineSegments(new T.EdgesGeometry(o.geometry,40),LNM);e.visible=false;o.add(e);o.userData.edges=e;}return o.userData.edges;}
function setMode(k){MODE=k;const walk=o=>{const kd=o.userData.kind;
    if(kd==="hilo"||kd==="colgante")o.visible=k===2;else if(kd==="puntilla")o.visible=k>=1;else if(kd==="propal")o.visible=k===0;
    else if(kd==="solido"){if(!o.userData.mat0)o.userData.mat0=o.material;o.material=k===0?SKM:k===1&&o.userData.mat1?o.userData.mat1:o.userData.mat0;edgesOf(o).visible=k===0;}};
  frames.forEach(f=>f.traverse(walk));hinges.forEach(h=>h.traverse(walk));conn.flat().forEach(m=>{if(k!==2)m.visible=false;});}
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
const notes=[[m(H)+" m",mid(0),"dim"],[m(W)+" m",mid(1),"dim"],["Tablero: "+m(TAPA)+" m de alto",mid(2),"dim"],[m(OY1-OY0)+" m de hilo",mid(3),"dim"],[m(IN)+" m por dentro",mid(4),"dim"],
  ["Listón de madera "+t*100+" × "+t*100+" cm",wp(2,W+.12,.9,0)],["Puntillas atrás cada 5 cm",wp(0,W/2,OY1+NI,-t/2-.04)],["Puntillas atrás cada 10 cm, solo a los lados",wp(1,OX0-NI,yM+.2,-t/2-.04)],["Puntillas atrás cada 2,5 cm",wp(2,W/2,OY1+NI,-t/2-.04)],["Bisagra de 2½″ (4 en total)",wp(1,W+.02,HY[1],-.05)],["Tablero de triplex 9 mm · "+m(TAW)+" × "+m(TAPA)+" m, con propalcote de "+PRW*100+" × "+PRH*100+" cm",wp(2,W/2,TY0+TAPA/2-.01,.06)]];
return {T,tex,rnd,ease,clamp,m,M,t,IN,W,H,MID,LOW,NI,NL,OX0,OX1,OY0,OY1,OW,ZF,yM,LT,TY0,TAPA,TAW,PRW,PRH,FD,HY,HG,CZ,AIR,setFinish,setMode,get mode(){return MODE;},art:{FI,FR1,FR2,DEST,CAP,DW,DH,QW,QH,GW,GH,PW:PW_,PH:PH_,front:(k,sc)=>cvs(DW,DH,sc||1,drawFicha(FI[k],k)),back:(k,sc,v)=>cvs(DW,DH,sc||1,drawBack(FI[k],k,v)),SYMN,get SYMV(){return SYMV;},quote:(set,i,sc)=>{const A=set==='dark'?FR1:FR2;return cvs(QW,QH,sc||1,drawQuote(A[i][0],A[i][1],set,i+1,A.length));},tag:(i,sc)=>cvs(GW,GH,sc||1,drawTag(i)),photo:async(k,sc)=>{const im=await photoImg(k);return cvs(PW_,PH_,sc||1,drawPhoto(k,im));}},get fin(){return FIN;},nails:frames.map(f=>f.userData.nails),frames,stand,hinges,conn,hung,dimG,DIMS,layout,buildDims,notes};
};
