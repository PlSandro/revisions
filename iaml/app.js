(function(){
"use strict";
var D = window.IAML_DATA;
var CH = D.chapters, EXAM = D.exam;
var TOOLS = [["bilan","bilan.html","Bilan de l'examen"],["drill","drill.html","Calculs minutés"],
  ["exam","examen.html","Examen blanc 30 min"],["fiche","fiche.html","Fiche A4"]];

var mem = {};
var store = {
  get:function(k){ try{ var v=window.localStorage.getItem(k); return v===null?mem[k]:v; }catch(e){ return mem[k]; } },
  set:function(k,v){ mem[k]=v; try{ window.localStorage.setItem(k,v); }catch(e){} }
};
var KEY="iaml.v1";
var state={ans:{}, drills:{}};
try{ var raw=store.get(KEY); if(raw){ var p=JSON.parse(raw); state.ans=p.ans||{}; state.drills=p.drills||{}; } }catch(e){}
function save(){ try{ store.set(KEY, JSON.stringify(state)); }catch(e){} }

function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function el(h){ var d=document.createElement("div"); d.innerHTML=h.trim(); return d.firstChild; }
function rnd(a,b){ return a+Math.floor(Math.random()*(b-a+1)); }
function r2(x){ return Math.round(x*100)/100; }

var ALLQ=[]; CH.forEach(function(c){ c.quiz.forEach(function(q){ q._ch=c.id; ALLQ.push(q); }); });

/* ---------- barème Moodle ---------- */
function grade(q, given){
  if(q.type==="num"){
    if(given===null||given===undefined||given==="") return 0;
    var v=parseFloat(String(given).replace(",","."));
    if(isNaN(v)) return 0;
    return Math.abs(v-q.answer)<=(q.tol||0.005)?1:0;
  }
  if(q.type==="single"){ return given===q.answer?1:0; }
  var A=q.answer, g=given||[];
  var right=0,wrong=0;
  g.forEach(function(i){ if(A.indexOf(i)>=0) right++; else wrong++; });
  return Math.max(0,(right-wrong)/A.length);
}

/* ---------- figures ---------- */
var W="#ECEFF3",A1="#5BC8AF",A2="#7FB2F0",WA="#F2A65A",BA="#F0736A",GO="#7ED9A0",DL="#2C3A48";
function sv(w,h){ return '<svg viewBox="0 0 '+w+' '+h+'" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'; }
function tx(x,y,s,c,sz,anc){ return '<text x="'+x+'" y="'+y+'" fill="'+c+'" font-size="'+(sz||10)+
  '" font-family="ui-monospace,monospace" text-anchor="'+(anc||"middle")+'" dominant-baseline="central">'+s+'</text>'; }
function ln(x1,y1,x2,y2,c,w){ return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+c+
  '" stroke-width="'+(w||1.5)+'" stroke-linecap="round"/>'; }
var FIG={};
FIG.supervise=function(){var s=sv(430,150);
  s+='<rect x="14" y="26" width="190" height="106" rx="7" fill="#0F1620" stroke="'+A1+'" stroke-width="1.3"/>';
  s+='<rect x="226" y="26" width="190" height="106" rx="7" fill="#0F1620" stroke="'+WA+'" stroke-width="1.3"/>';
  s+=tx(109,16,"SUPERVISÉ : on a les y",A1,10)+tx(321,16,"NON SUPERVISÉ : pas de y",WA,10);
  [[50,60,GO],[80,52,BA],[110,72,GO],[145,58,BA],[62,100,GO],[100,104,BA],[140,96,GO],[170,80,BA]]
   .forEach(function(p){ s+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="6" fill="'+p[2]+'"/>'; });
  s+=ln(38,120,182,44,W,1.4);
  [[262,60],[292,52],[322,72],[357,58],[274,100],[312,104],[352,96],[382,80]]
   .forEach(function(p){ s+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="6" fill="none" stroke="'+W+'" stroke-width="1.3"/>'; });
  s+='<ellipse cx="290" cy="62" rx="46" ry="26" fill="none" stroke="'+WA+'" stroke-dasharray="3 3"/>';
  s+='<ellipse cx="358" cy="90" rx="42" ry="24" fill="none" stroke="'+WA+'" stroke-dasharray="3 3"/>';
  s+=tx(109,144,"on apprend la frontière",W,9.5)+tx(321,144,"on découvre des groupes",W,9.5);
  return s+"</svg>";};
FIG.fitting=function(){var s=sv(430,150),i;
  var pts=[[30,90],[52,74],[74,96],[96,66],[118,86]];
  function box(ox,lab,col,path){var r='';
    r+='<rect x="'+ox+'" y="24" width="126" height="94" rx="5" fill="#0F1620" stroke="'+DL+'"/>';
    for(i=0;i<5;i++){ r+='<circle cx="'+(ox+18+i*22)+'" cy="'+(50+((i*37)%40))+'" r="4.5" fill="'+GO+'"/>'; }
    for(i=0;i<5;i++){ r+='<circle cx="'+(ox+26+i*21)+'" cy="'+(92-((i*29)%30))+'" r="4.5" fill="'+BA+'"/>'; }
    r+='<path d="'+path+'" fill="none" stroke="'+col+'" stroke-width="2"/>';
    r+=tx(ox+63,14,lab,col,10);
    return r;}
  s+=box(8,"sous-apprentissage",WA,"M 14 34 L 128 108");
  s+=box(152,"bon modèle",GO,"M 158 40 Q 215 70 272 100");
  s+=box(296,"sur-apprentissage",BA,
     "M 302 38 Q 318 78 336 52 Q 352 30 364 76 Q 376 106 392 60 Q 404 32 416 100");
  s+=tx(215,134,"dans les deux cas extrêmes : mauvaise généralisation",W,9.5);
  return s+"</svg>";};
FIG.kfold=function(){var s=sv(430,150),i,j;
  s+=tx(215,14,"1000 exemples, k = 5",A1,10.5);
  for(i=0;i<5;i++){ for(j=0;j<5;j++){
    var on=(i===j);
    s+='<rect x="'+(60+j*66)+'" y="'+(28+i*20)+'" width="62" height="16" rx="2" fill="'+
       (on?"#1E2A22":"#131A23")+'" stroke="'+(on?GO:DL)+'" stroke-width="1.1"/>';
    if(on) s+=tx(91+j*66,36,"test",GO,8);
  }
    s+=tx(48,36+i*20,"t"+(i+1),W,9,"end");
  }
  s+=tx(215,142,"chaque exemple testé exactement 1 fois  ->  1000 au total",GO,10);
  return s+"</svg>";};
FIG.gradient=function(){var s=sv(430,150);
  s+='<path d="M 30 30 Q 215 175 400 30" fill="none" stroke="'+DL+'" stroke-width="1.6"/>';
  [[60,64],[110,102],[160,122],[200,128]].forEach(function(p,i){
    s+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="5" fill="'+A1+'"/>';
    if(i<3) s+=ln(p[0]+6,p[1]+3,p[0]+38,p[1]+14,A1,1.2);
  });
  s+=tx(215,132,"minimum",GO,9);
  [[350,64],[300,110],[380,52]].forEach(function(p){ s+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="5" fill="'+BA+'"/>'; });
  s+=ln(350,64,300,110,BA,1.2)+ln(300,110,380,52,BA,1.2);
  s+=tx(110,26,"eta correct : on descend",A1,9.5)+tx(340,26,"eta trop grand : ça remonte",BA,9.5);
  return s+"</svg>";};
FIG.sigmoid=function(){var s=sv(430,160),i,d="";
  s+=ln(40,140,410,140,DL,1)+ln(225,20,225,150,DL,1);
  for(i=0;i<=60;i++){ var x=-6+i*0.2, y=1/(1+Math.exp(-x));
    d+=(i?"L":"M")+(225+x*30)+" "+(140-y*105); }
  s+='<path d="'+d+'" fill="none" stroke="'+A1+'" stroke-width="2.2"/>';
  s+=ln(40,87.5,410,87.5,WA,1)+"";
  s+='<circle cx="225" cy="87.5" r="5" fill="'+WA+'"/>';
  s+=tx(262,78,"h = 0,5 quand W^T x = 0",WA,10,"start");
  s+=tx(395,30,"h -> 1",A1,10)+tx(60,132,"h -> 0",A1,10);
  s+=tx(225,154,"W^T x",W,9.5);
  return s+"</svg>";};
FIG.confusion=function(){var s=sv(430,168);
  s+=tx(255,16,"CLASSE RÉELLE",W,10);
  s+=tx(200,38,"+",GO,12)+tx(320,38,"-",BA,12);
  s+=tx(120,80,"PRÉDIT  +",W,10,"end")+tx(120,124,"PRÉDIT  -",W,10,"end");
  function c(x,y,lab,val,col){ return '<rect x="'+x+'" y="'+y+'" width="120" height="40" rx="3" fill="#0F1620" stroke="'+
    col+'" stroke-width="1.3"/>'+tx(x+60,y+15,lab,col,11)+tx(x+60,y+29,val,W,9); }
  s+=c(140,60,"TP","bien classés +",GO);
  s+=c(266,60,"FP","fausse alerte",BA);
  s+=c(140,104,"FN","raté",BA);
  s+=c(266,104,"TN","bien classés -",GO);
  s+='<rect x="136" y="56" width="128" height="92" rx="4" fill="none" stroke="'+A2+'" stroke-dasharray="3 3"/>';
  s+=tx(200,158,"rappel = colonne",A2,9.5);
  s+='<rect x="136" y="56" width="254" height="48" rx="4" fill="none" stroke="'+WA+'" stroke-dasharray="3 3"/>';
  s+=tx(350,52,"précision = ligne",WA,9.5);
  return s+"</svg>";};
FIG.kmeans=function(){var s=sv(430,150);
  var g=[[[70,60],[92,48],[58,84],[86,86],[104,68]],[[210,44],[238,60],[218,86],[246,92],[258,52]],
         [[334,66],[358,50],[352,92],[376,72],[326,96]]];
  var cols=[A1,A2,WA], ctr=[[82,69],[234,67],[349,75]];
  g.forEach(function(cl,i){ cl.forEach(function(p){
    s+=ln(p[0],p[1],ctr[i][0],ctr[i][1],cols[i],0.8);
    s+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="5" fill="'+cols[i]+'"/>'; }); });
  ctr.forEach(function(p,i){ s+='<path d="M '+(p[0]-7)+' '+p[1]+' L '+(p[0]+7)+' '+p[1]+
    ' M '+p[0]+' '+(p[1]-7)+' L '+p[0]+' '+(p[1]+7)+'" stroke="'+W+'" stroke-width="2"/>'; });
  s+=tx(215,20,"K centroïdes fixés à l'avance",W,10);
  s+=tx(215,136,"minimise la somme des distances² au centre",A1,9.5);
  return s+"</svg>";};
FIG.dbscan=function(){var s=sv(430,158);
  var core=[[120,70],[142,86],[100,92],[126,108],[158,66]];
  var bord=[[80,62],[172,102],[92,124]];
  var noise=[[300,40],[360,120],[330,80],[395,52]];
  s+='<circle cx="120" cy="70" r="30" fill="none" stroke="'+A1+'" stroke-dasharray="3 3"/>';
  core.forEach(function(p){ s+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="6" fill="'+A1+'"/>'; });
  bord.forEach(function(p){ s+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="6" fill="none" stroke="'+A1+'" stroke-width="1.6"/>'; });
  noise.forEach(function(p){ s+='<path d="M '+(p[0]-4)+' '+(p[1]-4)+' L '+(p[0]+4)+' '+(p[1]+4)+
    ' M '+(p[0]+4)+' '+(p[1]-4)+' L '+(p[0]-4)+' '+(p[1]+4)+'" stroke="'+BA+'" stroke-width="1.8"/>'; });
  s+=tx(155,42,"epsilon",A1,9.5,"start");
  s+=tx(120,146,"● centraux   ○ frontière",A1,10);
  s+=tx(345,146,"✕ bruit (aberrants)",BA,10);
  return s+"</svg>";};
FIG.pca=function(){var s=sv(430,150),i;
  for(i=0;i<26;i++){ var t=(i*37%100)/100, u=((i*53)%100)/100-0.5;
    var x=90+t*230+u*30, y=112-t*66+u*34;
    s+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="4" fill="'+A2+'" opacity="0.85"/>'; }
  s+=ln(84,116,326,46,A1,2.4);
  s+=ln(190,52,232,112,WA,1.8);
  s+=tx(340,40,"PC1",A1,10,"start")+tx(238,46,"PC2",WA,10,"start");
  s+=tx(215,140,"PC1 = axe de plus grande variance",A1,10);
  s+=tx(215,16,"les valeurs propres = variance portée par chaque axe",W,9.5);
  return s+"</svg>";};
FIG.arbre=function(){var s=sv(430,158);
  var N=[[215,30],[130,80],[300,80],[85,128],[175,128]];
  s+=ln(215,42,130,68,W,1.4)+ln(215,42,300,68,W,1.4)+ln(130,92,85,116,W,1.4)+ln(130,92,175,116,W,1.4);
  s+='<rect x="160" y="20" width="110" height="22" rx="4" fill="#0F1620" stroke="'+A1+'"/>'+tx(215,31,"x2 <= 1.8 ?",A1,9.5);
  s+='<rect x="78" y="70" width="104" height="22" rx="4" fill="#0F1620" stroke="'+A1+'"/>'+tx(130,81,"x3 <= 4.9 ?",A1,9.5);
  s+='<rect x="256" y="70" width="88" height="22" rx="4" fill="#0F1620" stroke="'+GO+'"/>'+tx(300,81,"classe 0",GO,9.5);
  s+='<rect x="44" y="118" width="82" height="22" rx="4" fill="#0F1620" stroke="'+GO+'"/>'+tx(85,129,"classe 1",GO,9.5);
  s+='<rect x="136" y="118" width="82" height="22" rx="4" fill="#0F1620" stroke="'+GO+'"/>'+tx(177,129,"classe 2",GO,9.5);
  s+=tx(360,128,"chaque chemin",W,9,"middle")+tx(360,140,"= une règle",W,9,"middle");
  return s+"</svg>";};
FIG.sorties=function(){var s=sv(430,160);
  function row(y,lab,act,col,detail){var r='';
    r+='<rect x="14" y="'+y+'" width="150" height="30" rx="4" fill="#0F1620" stroke="'+DL+'"/>';
    r+=tx(89,y+15,lab,W,10);
    r+='<path d="M 170 '+(y+15)+' L 196 '+(y+15)+'" stroke="'+col+'" stroke-width="1.5"/>';
    r+='<path d="M 190 '+(y+11)+' L 196 '+(y+15)+' L 190 '+(y+19)+'" fill="none" stroke="'+col+'" stroke-width="1.5"/>';
    r+='<rect x="202" y="'+y+'" width="96" height="30" rx="4" fill="#0F1620" stroke="'+col+'"/>';
    r+=tx(250,y+15,act,col,11);
    r+=tx(310,y+15,detail,W,9,"start");
    return r;}
  s+=tx(215,14,"la couche de SORTIE dépend de la tâche",W,10.5);
  s+=row(28,"classification binaire","sigmoïde",A1,"1 proba");
  s+=row(70,"multiclasse (chiffres)","softmax",A2,"n probas, somme 1");
  s+=row(112,"régression","identité",WA,"1 réel libre");
  s+=tx(215,154,"ReLU et tanh : uniquement en couches cachées",BA,9.5);
  return s+"</svg>";};

/* ---------- drills aléatoires ---------- */
function cm(){ return {tp:rnd(40,120), fp:rnd(10,60), fn:rnd(8,50), tn:rnd(15,70)}; }
function cmTxt(m){
  return "                  RÉEL\n                +       -\n"+
   "  PRÉDIT  +   "+String(m.tp).padStart(3)+"     "+String(m.fp).padStart(3)+"\n"+
   "          -   "+String(m.fn).padStart(3)+"     "+String(m.tn).padStart(3);
}
var DRILLS=[
 {id:"acc", t:"Accuracy", d:"(TP + TN) / total", gen:function(){var m=cm();
   return {q:cmTxt(m)+"\n\naccuracy = ?", a:(m.tp+m.tn)/(m.tp+m.fp+m.fn+m.tn),
     s:"(TP+TN)/total = ("+m.tp+"+"+m.tn+")/"+(m.tp+m.fp+m.fn+m.tn)};}},
 {id:"prec", t:"Précision", d:"TP / (TP + FP) — la ligne du haut", gen:function(){var m=cm();
   return {q:cmTxt(m)+"\n\nprécision = ?", a:m.tp/(m.tp+m.fp),
     s:"TP/(TP+FP) = "+m.tp+"/"+(m.tp+m.fp)};}},
 {id:"rec", t:"Rappel", d:"TP / (TP + FN) — la colonne de gauche", gen:function(){var m=cm();
   return {q:cmTxt(m)+"\n\nrappel = ?", a:m.tp/(m.tp+m.fn),
     s:"TP/(TP+FN) = "+m.tp+"/"+(m.tp+m.fn)};}},
 {id:"f1", t:"F1-score", d:"2·P·R / (P+R)", gen:function(){var m=cm();
   var P=m.tp/(m.tp+m.fp), R=m.tp/(m.tp+m.fn);
   return {q:cmTxt(m)+"\n\nF1 = ?", a:2*P*R/(P+R),
     s:"P="+r2(P)+", R="+r2(R)+", F1=2PR/(P+R)"};}},
 {id:"sig", t:"Sigmoïde", d:"h = 1/(1+e^-z)", gen:function(){
   var z=(rnd(-30,30))/10;
   return {q:"W^T x = "+z.toFixed(1)+"\n\nh = 1/(1+e^(-W^T x)) = ?", a:1/(1+Math.exp(-z)),
     s:"1/(1+e^(-("+z.toFixed(1)+"))) ; rappel : z=0 -> 0,5"};}},
 {id:"proba", t:"Probabilité de la classe 0", d:"P(y=0) = 1 - h", gen:function(){
   var h=rnd(5,95)/100;
   return {q:"le classifieur renvoie h(x) = "+h.toFixed(2)+"\n\nP(y = 0 | x) = ?", a:1-h,
     s:"h est la proba du 1, donc P(y=0) = 1 - "+h.toFixed(2)};}},
 {id:"gini", t:"Impureté de Gini", d:"1 - somme des p²", gen:function(){
   var a=rnd(1,19), b=rnd(1,19), n=a+b;
   return {q:"un nœud contient "+a+" exemples de classe A\net "+b+" de classe B  (total "+n+")\n\nGini = ?",
     a:1-Math.pow(a/n,2)-Math.pow(b/n,2),
     s:"1 - ("+a+"/"+n+")² - ("+b+"/"+n+")²"};}},
 {id:"entro", t:"Entropie", d:"-somme p·log2(p)", gen:function(){
   var a=rnd(1,19), b=rnd(1,19), n=a+b, p=a/n, q=b/n;
   return {q:"un nœud contient "+a+" exemples de classe A\net "+b+" de classe B  (total "+n+")\n\nentropie = ?",
     a:-(p*Math.log2(p)+q*Math.log2(q)),
     s:"-"+r2(p)+"·log2("+r2(p)+") - "+r2(q)+"·log2("+r2(q)+")"};}},
 {id:"pca", t:"Variance expliquée (PCA)", d:"part cumulée des valeurs propres", gen:function(){
   var v=[rnd(30,60),rnd(15,29),rnd(5,14),rnd(1,4)];
   var tot=v[0]+v[1]+v[2]+v[3];
   return {q:"valeurs propres : "+v.join(", ")+"\n\npart de variance des 2 premières composantes = ?",
     a:(v[0]+v[1])/tot, s:"("+v[0]+"+"+v[1]+")/"+tot};}},
 {id:"kfold", t:"Validation croisée", d:"taille d'entraînement par tour", gen:function(){
   var n=rnd(2,20)*100, k=[4,5,8,10][rnd(0,3)];
   return {q:n+" exemples, validation croisée à k = "+k+"\n\nnombre d'exemples d'ENTRAÎNEMENT par tour = ?",
     a:n*(k-1)/k, tol:0.5, s:n+" × "+(k-1)+"/"+k+"  (le test en compte "+(n/k)+")"};}},
 {id:"mse", t:"MSE", d:"moyenne des carrés des écarts", gen:function(){
   var y=[rnd(1,9),rnd(1,9),rnd(1,9)], p=[rnd(1,9),rnd(1,9),rnd(1,9)];
   var m=(Math.pow(y[0]-p[0],2)+Math.pow(y[1]-p[1],2)+Math.pow(y[2]-p[2],2))/3;
   return {q:"y réel   : "+y.join(", ")+"\ny prédit : "+p.join(", ")+"\n\nMSE = ?", a:m, tol:0.02,
     s:"moyenne des (y - ŷ)² sur les 3 points"};}},
 {id:"front", t:"Frontière de décision", d:"où W^T x = 0", gen:function(){
   var w0=-rnd(2,12), w1=rnd(1,4);
   return {q:"h(x) = g(w0 + w1·x1 + w2·x2)\nw0 = "+w0+" , w1 = "+w1+" , w2 = 0\n\nla frontière est en x1 = ?",
     a:-w0/w1, tol:0.02, s:"w0 + w1·x1 = 0  ->  x1 = "+(-w0)+"/"+w1};}},
 {id:"grad", t:"Un pas de gradient", d:"w ← w - eta·grad", gen:function(){
   var w=rnd(1,20), g=rnd(-40,40)/10, e=[0.1,0.2,0.5][rnd(0,2)];
   return {q:"w = "+w+" , gradient = "+g.toFixed(1)+" , eta = "+e+"\n\nnouveau w = ?",
     a:w-e*g, tol:0.02, s:w+" - "+e+"×("+g.toFixed(1)+")"};}}
];

/* ---------- rendu ---------- */
var VIEW=document.body.dataset.view||"bilan", cur=0;
if(VIEW.indexOf("ch")===0) cur=parseInt(VIEW.slice(2),10);
function nav(){
  var r=document.querySelector(".rail");
  var h='<a href="../index.html" class="home-btn">← Index</a>';
  h+='<div class="brand">IAML<small>rattrapage · 30 min</small></div>';
  h+='<div><div class="navsec">Réviser</div><div class="nav" id="navch"></div></div>';
  h+='<div><div class="navsec">S\'entraîner</div><div class="nav" id="navtool"></div></div>';
  h+='<div class="railfoot"><div class="k"></div><button class="linkbtn">Tout réinitialiser</button></div>';
  r.innerHTML=h;
  var nc=r.querySelector("#navch");
  CH.forEach(function(c,i){
    var b=el('<a href="'+c.slug+'.html" aria-current="'+(VIEW==="ch"+i?"true":"false")+
             '"><span class="n">'+c.num+'</span><span>'+esc(c.title)+
             '</span><span class="sc"></span></a>');
    nc.appendChild(b);
  });
  var nt=r.querySelector("#navtool");
  TOOLS.forEach(function(t){
    var b=el('<a href="'+t[1]+'" aria-current="'+(VIEW===t[0]?"true":"false")+
             '"><span class="n">›</span><span>'+t[2]+'</span></a>');
    nt.appendChild(b);
  });
  r.querySelector(".linkbtn").addEventListener("click",function(){
    if(!window.confirm("Effacer toute la progression ?")) return;
    state={ans:{},drills:{}}; save(); render(); paintNav();
  });
  paintNav();
}
function paintNav(){
  var bs=document.querySelectorAll("#navch a");
  CH.forEach(function(c,i){
    var got=0,tot=0;
    c.quiz.forEach(function(q){ tot++; if(state.ans[q.id]!==undefined) got+=grade(q,state.ans[q.id]); });
    bs[i].querySelector(".sc").textContent=(Math.round(got*10)/10)+"/"+tot;
  });
  var g=0,t=0;
  ALLQ.forEach(function(q){ t++; if(state.ans[q.id]!==undefined) g+=grade(q,state.ans[q.id]); });
  document.querySelector(".railfoot .k").innerHTML="<b>"+(Math.round(g*10)/10)+"</b> / "+t+" points de quiz";
}

function hero(eyebrow,title,sub,blurb){
  return '<header class="hero"><div class="eyebrow">'+esc(eyebrow)+'</div><h1>'+esc(title)+
    '</h1>'+(sub?'<p class="sub">'+esc(sub)+'</p>':'')+
    (blurb?'<p class="blurb">'+esc(blurb)+'</p>':'')+'</header>';
}
var KINDS={def:"définition",thm:"à retenir",algo:"algorithme",warn:"piège"};

function render(){
  var st=document.querySelector(".stage");
  if(VIEW.indexOf("ch")===0){ renderChapter(st, parseInt(VIEW.slice(2),10)); }
  else if(VIEW==="bilan") renderBilan(st);
  else if(VIEW==="drill") renderDrills(st);
  else if(VIEW==="exam") renderExam(st);
  else if(VIEW==="fiche") renderFiche(st);
}

function renderChapter(st,i){
  cur=i; var c=CH[i];
  st.innerHTML=hero("Chapitre "+c.num,c.title,c.subtitle,c.blurb)+
   '<div class="tabs"><button data-t="n">Fiches<span class="c">'+
     c.notions.filter(function(x){return !x.section;}).length+'</span></button>'+
   '<button data-t="q">Questions<span class="c">'+c.quiz.length+'</span></button></div>'+
   '<section class="panel" data-p="n"></section><section class="panel" data-p="q"></section>';
  st.querySelectorAll(".tabs button").forEach(function(b){
    b.addEventListener("click",function(){ tab(b.dataset.t); });
  });
  notions(c, st.querySelector('[data-p="n"]'));
  questions(c.quiz, st.querySelector('[data-p="q"]'), false);
  tab("n");
}
function tab(t){
  var st=document.querySelector(".stage");
  st.querySelectorAll(".tabs button").forEach(function(b){
    b.setAttribute("aria-selected", b.dataset.t===t?"true":"false"); });
  st.querySelectorAll(".panel").forEach(function(p){ p.hidden=p.dataset.p!==t; });
}

function notions(c,box){
  var w=el('<div class="notions"></div>');
  c.notions.forEach(function(n){
    if(n.section){ w.appendChild(el('<div class="nsec"><h2>'+esc(n.section)+'</h2>'+
      (n.intro?'<p>'+esc(n.intro)+'</p>':'')+'<div class="rule"></div></div>')); return; }
    var h='<article class="notion '+n.kind+'"><span class="kind">'+(KINDS[n.kind]||n.kind)+
      '</span><h3>'+n.title+'</h3>';
    if(n.lead) h+='<p class="lead">'+n.lead+'</p>';
    if(n.body) h+='<div class="nbody">'+n.body+'</div>';
    if(n.formula) h+='<div class="formula">'+n.formula+'</div>';
    if(n.fig&&FIG[n.fig]) h+='<div class="nfig">'+FIG[n.fig]()+'</div>';
    if(n.ex) h+='<div class="nex"><div class="lab">exemple</div><pre>'+esc(n.ex)+'</pre></div>';
    h+='</article>';
    var a=el(h);
    if(n.see&&n.see.length){
      var s=el('<div class="see"><span class="lbl">questions</span></div>');
      n.see.forEach(function(id){
        var b=el('<button type="button">'+id+'</button>');
        b.addEventListener("click",function(){ tab("q"); jump(id); });
        s.appendChild(b);
      });
      a.appendChild(s);
    }
    w.appendChild(a);
  });
  box.innerHTML=""; box.appendChild(w);
}
function jump(id){
  var n=document.querySelector('[data-qid="'+id+'"]');
  if(n) n.scrollIntoView({behavior:"smooth",block:"center"});
}

function questions(list, box, examMode, onAnswer){
  var w=el('<div class="qwrap"></div>');
  if(!examMode){
    var tot=list.length, done=0, pts=0;
    list.forEach(function(q){ if(state.ans[q.id]!==undefined){ done++; pts+=grade(q,state.ans[q.id]); } });
    var bar=el('<div class="bar"></div>');
    bar.innerHTML="<b>"+(Math.round(pts*10)/10)+"</b> / "+tot+" points · "+done+" question"+
      (done>1?"s":"")+" traitée"+(done>1?"s":"")+" sur "+tot;
    w.appendChild(bar);
  }
  list.forEach(function(q,i){ w.appendChild(qCard(q,i,examMode,onAnswer)); });
  box.innerHTML=""; box.appendChild(w);
}

function qCard(q,i,examMode,onAnswer){
  var given=examMode?undefined:state.ans[q.id];
  var sel = (q.type==="multi") ? (Array.isArray(given)?given.slice():[]) :
            (q.type==="single") ? (given===undefined?null:given) : (given===undefined?"":given);
  var locked = !examMode && given!==undefined;
  var card=el('<article class="q'+(locked?" done":"")+'" data-qid="'+q.id+'"></article>');
  var head='<div class="qh"><span class="qn">'+(i+1)+'</span>'+
    (q.exam?'<span class="tagx ex">tombé à l\'examen</span>':'')+
    '<span class="tagx">'+esc(q.topic)+'</span></div>'+
    '<div class="qt">'+esc(q.q)+'</div>';
  if(q.type==="multi") head+='<div class="multi-hint">plusieurs réponses · '+q.answer.length+
    ' à cocher · une mauvaise case en annule une bonne</div>';
  card.innerHTML=head;

  var body=document.createElement("div");
  card.appendChild(body);

  function paint(){
    body.innerHTML="";
    if(q.type==="num"){
      var box2=el('<div class="numin"><input type="text" inputmode="decimal" placeholder="ex : 0.71"></div>');
      var inp=box2.querySelector("input");
      inp.value = sel===null?"":sel;
      inp.disabled=locked;
      inp.addEventListener("input",function(){ sel=inp.value; });
      inp.addEventListener("keydown",function(e){ if(e.key==="Enter"&&!locked) commit(); });
      body.appendChild(box2);
    } else {
      var ch=el('<div class="ch"></div>');
      q.choices.forEach(function(txt,j){
        var isSel = q.type==="multi" ? sel.indexOf(j)>=0 : sel===j;
        var b=el('<button type="button"><span class="bx">'+
          (q.type==="multi"?(isSel?"[x]":"[ ]"):(isSel?"(o)":"( )"))+'</span><span>'+esc(txt)+'</span></button>');
        if(isSel) b.classList.add("sel");
        if(locked){
          b.disabled=true;
          var correct = q.type==="multi" ? q.answer.indexOf(j)>=0 : q.answer===j;
          if(correct&&isSel) b.classList.add("good");
          else if(!correct&&isSel) b.classList.add("bad");
          else if(correct&&!isSel) b.classList.add("miss");
        } else {
          b.addEventListener("click",function(){
            if(q.type==="multi"){
              var k=sel.indexOf(j); if(k>=0) sel.splice(k,1); else sel.push(j);
            } else { sel=j; }
            paint();
          });
        }
        ch.appendChild(b);
      });
      body.appendChild(ch);
    }
    if(!locked){
      var a=el('<div class="act"><button class="btn p">Valider</button></div>');
      a.querySelector("button").addEventListener("click",commit);
      body.appendChild(a);
    } else {
      var sc=grade(q,given);
      var cls=sc>=0.999?"ok":(sc>0?"part":"no");
      var lab=sc>=0.999?"correct — 1,00 point":
              (sc>0?"partiel — "+sc.toFixed(2).replace(".",",")+" point":"0 point");
      body.appendChild(el('<div class="score '+cls+'">'+lab+'</div>'));
      body.appendChild(el('<div class="why"><b>Pourquoi.</b> '+esc(q.why)+'</div>'));
      if(q.type==="num") body.appendChild(el('<div class="score ok">réponse attendue : '+
        String(q.answer).replace(".",",")+'</div>'));
    }
  }
  function commit(){
    var val = q.type==="multi"?sel.slice():sel;
    if(q.type==="single"&&val===null) return;
    if(examMode){ if(onAnswer) onAnswer(q,val); return; }
    state.ans[q.id]=val; given=val; locked=true; save();
    card.classList.add("done"); paint(); paintNav();
    var b=document.querySelector(".bar");
    if(b){ var c=CH[cur]; var tp=0,dn=0;
      c.quiz.forEach(function(x){ if(state.ans[x.id]!==undefined){ dn++; tp+=grade(x,state.ans[x.id]); } });
      b.innerHTML="<b>"+(Math.round(tp*10)/10)+"</b> / "+c.quiz.length+" points · "+dn+
        " question"+(dn>1?"s":"")+" traitée"+(dn>1?"s":"")+" sur "+c.quiz.length; }
  }
  paint();
  return card;
}

/* ---------- bilan ---------- */
function renderBilan(st){
  var e=EXAM;
  var h=hero("Diagnostic","Ce que la copie du 29 juin raconte",
    e.note+"/20 — "+e.points+" points sur "+e.total+", en "+e.duree,
    "Le détail question par question, et où sont partis les points. Le barème Moodle se reconstitue "+
    "exactement : "+e.regle);
  h+='<div class="qwrap">';
  h+='<div class="result"><div class="big">'+String(e.note).replace(".",",")+
     '<small> / 20</small></div>';
  h+='<table class="tbl"><thead><tr><th>Thème</th><th style="text-align:right">Points</th>'+
     '<th style="text-align:right">Obtenus</th><th style="text-align:right">Perdus</th>'+
     '<th style="width:120px">Questions</th></tr></thead><tbody>';
  var srt=e.themes.slice().sort(function(a,b){ return (b.p-b.g)-(a.p-a.g); });
  srt.forEach(function(t){
    var lost=t.p-t.g, w=Math.round(lost/6*110);
    var cls=lost>=3?"lo":(lost>=1.5?"mid":"");
    h+='<tr><td>'+esc(t.t)+'</td><td class="num">'+t.p+'</td><td class="num">'+
       t.g.toFixed(2).replace(".",",")+'</td><td class="num">'+lost.toFixed(2).replace(".",",")+
       '</td><td><span class="pill '+cls+'" style="width:'+Math.max(4,w)+'px"></span></td></tr>';
  });
  h+='</tbody></table></div>';
  e.lecons.forEach(function(l){
    h+='<div class="lesson"><h3>'+esc(l.titre)+'</h3><p>'+esc(l.detail)+'</p>'+
       '<div class="gain">gain potentiel : +'+String(l.gain).replace(".",",")+' points sur 20</div></div>';
  });
  h+='<div class="result"><h2 style="font-size:20px;margin-bottom:10px">Le plan pour 30 minutes</h2>'+
     '<table class="tbl"><thead><tr><th>Ordre</th><th>Ce que tu corriges</th>'+
     '<th style="text-align:right">Note visée</th></tr></thead><tbody>'+
     '<tr><td class="num">1</td><td>Cocher toutes les bonnes cases des QCM (3 sur 5, très souvent)</td><td class="num">8,0</td></tr>'+
     '<tr><td class="num">2</td><td>Accuracy, précision, rappel — trois divisions</td><td class="num">9,5</td></tr>'+
     '<tr><td class="num">3</td><td>Les deux colonnes sur/sous-apprentissage</td><td class="num">12,8</td></tr>'+
     '<tr><td class="num">4</td><td>Sigmoïde : h = proba du 1, et h = 0,5 quand z = 0</td><td class="num">14,3</td></tr>'+
     '<tr><td class="num">5</td><td>Supervisé / non supervisé : y a-t-il des labels ?</td><td class="num">15,8</td></tr>'+
     '<tr><td class="num">6</td><td>Couches de sortie : sigmoïde / softmax / identité</td><td class="num">16,8</td></tr>'+
     '</tbody></table></div>';
  h+='</div>';
  st.innerHTML=h;
}

/* ---------- drills ---------- */
function renderDrills(st){
  st.innerHTML=hero("Entraînement","Calculs minutés",
    "Les questions numériques de l'examen, régénérées à l'infini",
    "Trois questions de calcul t'ont coûté 3 points, et ce sont des divisions. "+
    "Chaque exercice tire de nouveaux chiffres à chaque fois : enchaîne jusqu'à ce que ce soit automatique.")+
    '<div class="dgrid" id="dg"></div>';
  var g=st.querySelector("#dg");
  DRILLS.forEach(function(d){ g.appendChild(drillCard(d)); });
}
function drillCard(d){
  var card=el('<article class="drill"><h3>'+esc(d.t)+'</h3><div class="d">'+esc(d.d)+'</div></article>');
  var body=document.createElement("div"); card.appendChild(body);
  var st=state.drills[d.id]||{ok:0,ko:0};
  var cur=null;
  function fresh(){ cur=d.gen(); paint(false,null); }
  function paint(checked,good){
    body.innerHTML="";
    body.appendChild(el('<div class="dq">'+esc(cur.q)+'</div>'));
    var row=el('<div class="numin"><input type="text" inputmode="decimal" placeholder="ta réponse"></div>');
    var inp=row.querySelector("input");
    body.appendChild(row);
    var act=el('<div class="act"></div>');
    var bv=el('<button class="btn p">Vérifier</button>');
    var bn=el('<button class="btn">Nouveau tirage</button>');
    act.appendChild(bv); act.appendChild(bn);
    act.appendChild(el('<span class="streak">'+st.ok+' réussis · '+st.ko+' ratés</span>'));
    body.appendChild(act);
    if(checked){
      var msg = good
        ? '<span class="ok">✓ correct</span>'
        : '<span class="no">✗ attendu : '+(Math.round(cur.a*1000)/1000).toString().replace(".",",")+'</span>';
      body.appendChild(el('<div class="dstate">'+msg+' &nbsp;·&nbsp; '+esc(cur.s)+'</div>'));
      bv.disabled=true;
    }
    bv.addEventListener("click",function(){
      var v=parseFloat(inp.value.replace(",","."));
      if(isNaN(v)) return;
      var ok=Math.abs(v-cur.a)<=(cur.tol||0.005);
      if(ok) st.ok++; else st.ko++;
      state.drills[d.id]=st; save();
      paint(true,ok);
    });
    bn.addEventListener("click",fresh);
    inp.addEventListener("keydown",function(e){ if(e.key==="Enter"&&!bv.disabled) bv.click(); });
    if(!checked) setTimeout(function(){ },0);
  }
  fresh();
  return card;
}

/* ---------- examen blanc ---------- */
var examState=null;
function renderExam(st){
  if(!examState){ examIntro(st); return; }
  if(examState.finished){ examResult(st); return; }
  examRun(st);
}
function examIntro(st){
  st.innerHTML=hero("Simulation","Examen blanc — 30 minutes",
    "20 questions tirées au sort, barème Moodle réel",
    "Mêmes règles que le vrai : une bonne case rapporte 1/n des points, une mauvaise en annule une, "+
    "et le score d'une question ne descend jamais sous zéro. À la fin, tu obtiens une note sur 20 "+
    "et le détail par thème.")+
    '<div class="qwrap"><div class="result">'+
    '<p style="color:var(--dim);margin:0 0 16px">Au vrai examen tu as mis 51 minutes pour 36 questions. '+
    'Ici tu as 30 minutes pour 20 : c\'est le rythme du rattrapage, environ 1 min 30 par question.</p>'+
    '<div class="act"><button class="btn p" id="startx">Démarrer les 30 minutes</button></div></div></div>';
  st.querySelector("#startx").addEventListener("click",function(){
    var pool=ALLQ.slice();
    for(var i=pool.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=pool[i]; pool[i]=pool[j]; pool[j]=t; }
    var pick=[];
    pool.forEach(function(q){ if(pick.length<20 && q.exam) pick.push(q); });
    pool.forEach(function(q){ if(pick.length<20 && !q.exam) pick.push(q); });
    examState={qs:pick, given:{}, idx:0, t0:Date.now(), finished:false};
    render();
  });
}
function examRun(st){
  st.innerHTML='<div class="exambox"><div class="timer"><span class="t" id="tt">30:00</span>'+
    '<span class="prog"><i id="pp" style="width:100%"></i></span>'+
    '<span class="meta" id="mm"></span>'+
    '<button class="btn" id="fin">Terminer</button></div>'+
    '<div id="qz"></div></div>';
  var box=st.querySelector("#qz");
  questions(examState.qs, box, true, function(q,val){
    examState.given[q.id]=val;
    var n=document.querySelector('[data-qid="'+q.id+'"]');
    if(n){ n.classList.add("done");
      var b=n.querySelector(".act .btn"); if(b){ b.textContent="Réponse enregistrée"; b.disabled=true; }
      n.querySelectorAll(".ch button").forEach(function(x){ x.disabled=true; });
      var inp=n.querySelector(".numin input"); if(inp) inp.disabled=true; }
    meta();
  });
  st.querySelector("#fin").addEventListener("click",function(){ endExam(); });
  function meta(){
    var d=Object.keys(examState.given).length;
    var m=document.querySelector("#mm"); if(m) m.textContent=d+" / "+examState.qs.length+" répondues";
  }
  meta();
  if(examState.timer) clearInterval(examState.timer);
  examState.timer=setInterval(function(){
    if(!examState||examState.finished){ clearInterval(examState.timer); return; }
    var left=30*60-Math.floor((Date.now()-examState.t0)/1000);
    if(left<=0){ endExam(); return; }
    var t=document.querySelector("#tt"), p=document.querySelector("#pp");
    if(!t){ clearInterval(examState.timer); return; }
    t.textContent=String(Math.floor(left/60)).padStart(2,"0")+":"+String(left%60).padStart(2,"0");
    if(left<300) t.classList.add("low");
    p.style.width=(left/(30*60)*100)+"%";
  },1000);
}
function endExam(){
  if(examState.timer) clearInterval(examState.timer);
  examState.finished=true;
  examState.secs=Math.min(30*60,Math.floor((Date.now()-examState.t0)/1000));
  render();
}
function examResult(st){
  var qs=examState.qs, pts=0;
  var byTopic={};
  qs.forEach(function(q){
    var g=grade(q, examState.given[q.id]);
    pts+=g;
    if(!byTopic[q.topic]) byTopic[q.topic]={p:0,g:0};
    byTopic[q.topic].p++; byTopic[q.topic].g+=g;
  });
  var note=pts/qs.length*20;
  var mm=Math.floor(examState.secs/60), ss=examState.secs%60;
  var h=hero("Résultat","Examen blanc terminé","",
    "Note calculée avec le barème Moodle réel, sur les "+qs.length+" questions tirées.");
  h+='<div class="qwrap"><div class="result"><div class="big">'+
     note.toFixed(2).replace(".",",")+'<small> / 20</small></div>'+
     '<p style="color:var(--dim);margin:10px 0 0;font-family:var(--mono);font-size:12px">'+
     (Math.round(pts*100)/100).toString().replace(".",",")+' / '+qs.length+' points · durée '+
     mm+' min '+String(ss).padStart(2,"0")+' s</p>';
  h+='<table class="tbl"><thead><tr><th>Thème</th><th style="text-align:right">Questions</th>'+
     '<th style="text-align:right">Points</th><th style="text-align:right">Réussite</th></tr></thead><tbody>';
  Object.keys(byTopic).sort(function(a,b){
    return byTopic[a].g/byTopic[a].p - byTopic[b].g/byTopic[b].p; }).forEach(function(t){
    var o=byTopic[t], r=o.g/o.p*100;
    h+='<tr><td>'+esc(t)+'</td><td class="num">'+o.p+'</td><td class="num">'+
       (Math.round(o.g*100)/100).toString().replace(".",",")+'</td><td class="num">'+
       Math.round(r)+' %</td></tr>';
  });
  h+='</tbody></table><div class="act" style="margin-top:18px">'+
     '<button class="btn p" id="again">Refaire un tirage</button>'+
     '<button class="btn" id="corr">Voir la correction</button></div></div><div id="cbox"></div></div>';
  st.innerHTML=h;
  st.querySelector("#again").addEventListener("click",function(){ examState=null; render(); });
  st.querySelector("#corr").addEventListener("click",function(){
    var cb=st.querySelector("#cbox");
    if(cb.innerHTML){ cb.innerHTML=""; return; }
    var saved={}; Object.keys(state.ans).forEach(function(k){ saved[k]=state.ans[k]; });
    qs.forEach(function(q){ if(examState.given[q.id]!==undefined) state.ans[q.id]=examState.given[q.id]; });
    questions(qs, cb, false);
    Object.keys(saved).length; save(); paintNav();
  });
}

/* ---------- fiche A4 ---------- */
function renderFiche(st){
  st.innerHTML=hero("Antisèche","Fiche A4 recto",
    "Le modèle à recopier à la main",
    "Les photocopies sont interdites : cette page est un modèle à recopier. Tout ce qui t'a coûté "+
    "des points y est, dans l'ordre de rentabilité. Imprime-la pour l'avoir sous les yeux pendant "+
    "que tu recopies, ou lis-la directement.")+
    '<div class="a4wrap"><div class="act noprint" style="margin-bottom:14px">'+
    '<button class="btn p" onclick="window.print()">Imprimer le modèle</button></div>'+
    '<div class="a4">'+FICHE+'</div></div>';
}

var FICHE = [
'<h2>1 · Type de problème</h2>',
'<ul><li><b>Régression</b> : sortie = nombre continu (prix, nb d\'actions, température)</li>',
'<li><b>Binaire</b> : 2 classes · <b>Multiclasse</b> : ≥ 3 classes</li>',
'<li><b>Supervisé</b> = on a les y (prédire) · <b>Non supervisé</b> = pas de y (découvrir, regrouper)</li></ul>',
'<div class="box"><b>Non supervisé :</b> PCA, K-means, DBSCAN, Affinity Propagation<br>',
'<b>Supervisé :</b> LDA, NCA, rég. linéaire, rég. logistique, arbres, SVM</div>',

'<h2>2 · Sur / sous-apprentissage</h2>',
'<table><tr><th></th><th>train</th><th>test</th></tr>',
'<tr><td>sous-app.</td><td>mauvais</td><td>mauvais</td></tr>',
'<tr><td>sur-app.</td><td>excellent</td><td>mauvais</td></tr>',
'<tr><td>bon</td><td>bon</td><td>bon</td></tr></table>',
'<div class="warn">Dans les <b>deux</b> cas → mauvaise généralisation (2 cases à cocher).</div>',
'<table><tr><th>contre SOUS-app.</th><th>contre SUR-app.</th></tr>',
'<tr><td>+ complexité</td><td>modèle + simple</td></tr>',
'<tr><td>+ features</td><td>− features</td></tr>',
'<tr><td><b>−</b> lambda</td><td><b>+</b> lambda</td></tr>',
'<tr><td>+ époques</td><td>early stopping</td></tr>',
'<tr><td>—</td><td>+ de données</td></tr></table>',
'<div class="warn">+ de données et early stopping n\'aident <b>pas</b> le sous-app.</div>',

'<h2>3 · Validation croisée (k plis)</h2>',
'<ul><li>k tours : train sur k−1 plis, test sur 1</li>',
'<li>N exemples, k plis → train = N(k−1)/k, test = N/k par tour</li>',
'<li><b>Erreur calculée sur les N exemples au total</b> (chacun testé 1 fois)</li></ul>',

'<h2>4 · Régression linéaire</h2>',
'<ul><li>f(x) = w1·x + w0 · coût <span class="f">J = moy (f(x)−y)²</span></li>',
'<li>J = 0 ⟺ tous les points sont <b>exactement alignés</b></li>',
'<li>y décroît quand x croît ⟹ w1 &lt; 0</li>',
'<li>Métrique : <b>MSE</b> (pas de matrice de confusion !)</li></ul>',
'<h3>Descente de gradient</h3>',
'<ul><li><span class="f">w ← w − eta·∇J</span></li>',
'<li>coût qui <b>augmente</b> ⟹ eta trop grand</li>',
'<li>eta très petit ⟹ lent (pas « plus rapide »)</li>',
'<li>départ au minimum ⟹ rien ne bouge</li></ul>',

'<h2>5 · Régression logistique</h2>',
'<ul><li><span class="f">h = 1/(1+e^(−WᵀX))</span> ∈ ]0 ; 1[</li>',
'<li><b>h = P(y = 1 | x)</b> · P(y=0) = 1 − h</li>',
'<li><b>WᵀX = 0 ⟺ h = 0,5</b> ⟹ frontière de décision</li>',
'<li>WᵀX ≫ 0 → h → 1 · WᵀX ≪ 0 → h → 0 (jamais −1)</li>',
'<li>y=1 bien classé ⟹ h &gt; 0,5 ⟹ h &gt; 1−h</li>',
'<li>w0=−6, w1=1, w2=0 → frontière x1 = 6, classe 1 à droite</li></ul>',

'<h2>6 · Matrice de confusion</h2>',
'<table><tr><th></th><th>réel +</th><th>réel −</th></tr>',
'<tr><th>prédit +</th><td>TP</td><td>FP</td></tr>',
'<tr><th>prédit −</th><td>FN</td><td>TN</td></tr></table>',
'<div class="box"><span class="f">accuracy = (TP+TN)/total</span><br>',
'<span class="f">précision = TP/(TP+FP)</span> ← ligne<br>',
'<span class="f">rappel = TP/(TP+FN)</span> ← colonne<br>',
'<span class="f">F1 = 2·P·R/(P+R)</span></div>',
'<div class="warn"><b>Métriques :</b> régression → MSE. Classification → confusion + ROC + précision/rappel (3 cases).</div>',

'<h2>7 · Clustering</h2>',
'<h3>K-means</h3>',
'<ul><li>VRAI : K fixé à l\'avance · dépend de l\'initialisation · minimise la variance intra-cluster</li>',
'<li>FAUX : optimum global · robuste aux aberrants</li>',
'<li>Suppose : sphérique, compact, convexe</li></ul>',
'<h3>DBSCAN</h3>',
'<ul><li>Paramètres : <b>ε</b> (rayon), <b>m</b> (voisins min)</li>',
'<li>Points : <b>central</b> (≥ m voisins) · <b>frontière</b> · <b>bruit</b></li>',
'<li>VRAI : formes arbitraires · détecte le bruit · densité</li>',
'<li>Pas besoin de fixer le nb de clusters</li>',
'<li>ε trop petit → plein de groupes · trop grand → 1 seul</li></ul>',
'<h3>Affinity Propagation</h3>',
'<ul><li>Messages : responsabilité R(i,k), disponibilité A(i,k)</li>',
'<li>Diagonale de S = <b>préférences</b> (souvent la médiane)</li>',
'<li>Nb de clusters non fixé · coût quadratique</li></ul>',

'<h2>8 · PCA</h2>',
'<ul><li>Standardiser → covariance → valeurs/vecteurs propres</li>',
'<li>Valeurs propres = information retenue par axe</li>',
'<li>Features <b>décorrélées</b> (≠ indépendantes !)</li>',
'<li>Résoluble par <b>SVD</b> sans calculer la covariance</li>',
'<li>Sert à : <b>réduire</b> + <b>visualiser 2D/3D</b> (pas prédire, pas regrouper)</li>',
'<li>Garder 95 % de variance ⟺ <span class="f">erreur reconstruction ≤ 0,05</span></li></ul>',

'<h2>9 · Arbres de décision</h2>',
'<ul><li>Seuils sur les variables, partition récursive de l\'espace</li>',
'<li>Numérique <b>et</b> catégoriel · classification <b>et</b> régression</li>',
'<li>Interprétables : chemin racine→feuille = règle</li>',
'<li><b>Pas</b> de normalisation, <b>pas</b> de gradient, <b>pas</b> linéaires</li></ul>',
'<div class="box"><b>Critères :</b> Gini <span class="f">1−Σp²</span> · entropie <span class="f">−Σp·log₂p</span> · réduction de variance<br>',
'(la perte logistique n\'en est pas un)<br>',
'nœud pur → 0 · [5,5] → Gini 0,5 et H 1</div>',
'<div class="warn"><b>Overfitting causé par :</b> arbre très profond, aucun min par feuille.<br>',
'<b>Combattu par :</b> max_depth, pruning, min_samples_split.</div>',

'<h2>10 · Réseaux de neurones</h2>',
'<ul><li>Activation = <b>non-linéarité</b> (sinon = 1 seule couche linéaire)</li></ul>',
'<table><tr><th>tâche</th><th>dernière couche</th></tr>',
'<tr><td>binaire</td><td><b>sigmoïde</b></td></tr>',
'<tr><td>multiclasse</td><td><b>softmax</b></td></tr>',
'<tr><td>régression</td><td><b>identité</b></td></tr></table>',
'<div class="warn">ReLU / tanh = couches <b>cachées</b> uniquement.</div>',

'<h2>11 · Stratégie QCM</h2>',
'<div class="box"><b>score = (bonnes − mauvaises) / nb de bonnes</b>, minimum 0</div>',
'<ul><li>Choix <b>unique</b> : jamais de blanc, une erreur ne coûte rien de plus</li>',
'<li>Choix <b>multiple</b> : très souvent <b>3 bonnes sur 5</b></li>',
'<li>Cocher 1 sur 3 = 0,33 seulement → cocher tout ce dont tu es sûr</li>',
'<li>Une mauvaise case <b>annule</b> une bonne → ne pas cocher au hasard</li>',
'<li>« Aucune de ces réponses » : presque jamais la bonne</li>',
'<li>La « courbe JAZZ » n\'existe pas</li></ul>'
].join("");

nav(); render();
})();
