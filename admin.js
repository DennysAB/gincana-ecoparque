"use strict";
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const DEMO_STORE="ecoparque_demo_beta14",REAL_STORE="ecoparque_event_beta14";
const PIN_MIN=10000,PIN_RANGE=90000,PIN_LIMIT=Math.floor(4294967296/PIN_RANGE)*PIN_RANGE;
function pinPlan(){
 const used=new Set();
 function next(){
  let result;
  do{
   let value;
   do{value=crypto.getRandomValues(new Uint32Array(1))[0]}while(value>=PIN_LIMIT);
   result=String(PIN_MIN+(value%PIN_RANGE));
  }while(used.has(result));
  used.add(result);
  return result;
 }
 const activations=Array.from({length:9},next);
 const returns=Array.from({length:9},next);
 const starts=Array.from({length:9},()=>Array.from({length:9},next));
 const finishes=Array.from({length:9},()=>Array.from({length:9},next));
 if(used.size!==180)throw Error("No se generaron 180 PIN distintos");
 return{activations,returns,starts,finishes};
}
function stored(k){try{return JSON.parse(localStorage.getItem(k))}catch{return null}}
function keep(k,data){localStorage.setItem(k,JSON.stringify(data))}
const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function key(n=12){const b=crypto.getRandomValues(new Uint8Array(n));return Array.from(b,x=>alphabet[x%alphabet.length]).join("")}
function b64(b){return btoa(String.fromCharCode(...b))}
async function digest(s){const b=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)));return Array.from(b,x=>x.toString(16).padStart(2,"0")).join("")}
async function seal(obj,password){
 const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
 const base=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveKey"]);
 const k=await crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:120000,hash:"SHA-256"},base,{name:"AES-GCM",length:256},false,["encrypt"]);
 const data=await crypto.subtle.encrypt({name:"AES-GCM",iv},k,new TextEncoder().encode(JSON.stringify(obj)));
 return{s:b64(salt),i:b64(iv),c:b64(new Uint8Array(data))};
}
function save(name,data,type="application/json"){
 const b=new Blob([typeof data==="string"?data:JSON.stringify(data,null,2)],{type});
 const u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
}
function csv(rows){return "\uFEFF"+rows.map(row=>row.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")).join("\r\n")}
function stationPins(plan){
 return Array.from({length:9},(_,i)=>Array.from({length:9},(_,t)=>({
  id:i+1,team:String.fromCharCode(65+t),startKey:plan.starts[t][i],finishKey:plan.finishes[t][i]
 }))).flat();
}
function render(){
 let h='<section class="card"><h2>Prueba técnica rápida</h2><p>Genera un equipo ficticio A con PIN numéricos de cinco dígitos. Se conservarán el paquete y los PIN en este navegador.</p><button id="demo">Generar nuevo equipo A de prueba</button><div id="demo-result"></div></section>';
 h+='<section class="card"><h2>Configuración real de nueve estaciones</h2><p>Escribe las consignas privadas y las pistas finales. Se asignarán aleatoriamente 180 PIN distintos de cinco dígitos: 9 de activación, 9 de retorno y 162 de inicio/validación. Cada equipo tendrá PIN diferentes para cada estación.</p><p class="warn">Los PIN de cinco dígitos son más fáciles de teclear, pero se pueden adivinar mediante pruebas exhaustivas sin conexión. El facilitador debe comprobar físicamente el reto antes de validar.</p></section>';
 for(let i=0;i<9;i++)h+='<section class="card"><h3>Estación E'+(i+1)+'</h3><label>Nombre del reto</label><input id="title'+i+'" placeholder="Nombre de la estación"><label>Consigna del reto</label><textarea id="task'+i+'" placeholder="Descripción del desafío"></textarea><label>Pista hacia la siguiente estación</label><textarea id="clue'+i+'">Pista provisional: diríjanse a la estación E'+((i+1)%9+1)+'.</textarea></section>';
 h+='<section class="card"><button id="generate">Generar los nueve equipos con PIN de cinco dígitos</button><p>Los nueve paquetes y sus PIN quedarán guardados en este navegador hasta que borres sus datos. Descarga y conserva el respaldo privado.</p><p id="status" aria-live="polite"></p><div id="real-result"></div></section>';
 $("app").innerHTML=h;$("demo").onclick=generateDemo;$("generate").onclick=generateReal;
 showDemo(stored(DEMO_STORE));showReal(stored(REAL_STORE));
}
function showDemo(d){
 const box=$("demo-result");if(!box||!d)return;
 box.innerHTML='<h3 class="ok">Equipo A de prueba disponible</h3><p><strong>Identificador:</strong> '+esc(d.kit.eventId)+'</p>'+
 '<p><strong>PIN de activación:</strong> <code>'+esc(d.activation)+'</code></p>'+
 '<p><strong>PIN de retorno:</strong> <code>'+esc(d.returnKey)+'</code></p>'+
 '<button id="redownload-kit">Descargar paquete del equipo A</button>'+
 '<button id="redownload-keys" class="alt">Descargar respaldo de PIN</button>'+
 '<div class="grid">'+d.credentials.map(x=>'<div class="tile"><strong>E'+x.id+'</strong><small>Inicio</small><br><code>'+esc(x.startKey)+'</code><br><small>Validación</small><br><code>'+esc(x.finishKey)+'</code></div>').join("")+'</div>'+
 '<p class="warn">El paquete y los PIN corresponden al mismo identificador. No mezcles paquetes de distintas generaciones.</p>';
 $("redownload-kit").onclick=()=>save("equipo-A-PRUEBA.json",d.kit);
 $("redownload-keys").onclick=()=>save("claves-equipo-A-PRUEBA.json",{eventId:d.kit.eventId,activation:d.activation,returnKey:d.returnKey,credentials:d.credentials});
}
function showReal(d){
 const box=$("real-result");if(!box||!d)return;
 const teams=Array.from({length:9},(_,i)=>({team:String.fromCharCode(65+i),start:i+1,activation:d.plan.activations[i],returnKey:d.plan.returns[i]}));
 box.innerHTML='<h3 class="ok">Paquetes reales preparados</h3><p><strong>Identificador:</strong> '+esc(d.eventId)+'</p>'+
 '<p>Descarga los nueve paquetes y las hojas privadas. Cada facilitador dispone de dos PIN diferentes para cada equipo que llega a su estación.</p>'+
 '<button id="backup-real" class="alt">Descargar respaldo privado completo</button>'+
 '<button id="stations-csv">Descargar PIN de facilitadores (CSV)</button>'+
 '<button id="teams-csv">Descargar PIN de equipos (CSV)</button>'+
 '<h3>Equipos y PIN</h3><div class="grid">'+teams.map(x=>'<div class="tile"><strong>Equipo '+x.team+'</strong><small>Activa</small><br><code>'+esc(x.activation)+'</code><br><small>Retorno</small><br><code>'+esc(x.returnKey)+'</code><button class="alt" data-kit="'+x.team+'">Descargar '+x.team+'</button></div>').join("")+'</div>'+
 '<h3>PIN de facilitadores, por estación y equipo</h3>'+Array.from({length:9},(_,i)=>'<details class="card"><summary>Estación E'+(i+1)+' · nueve equipos</summary><div class="grid">'+stationPins(d.plan).filter(x=>x.id===i+1).map(x=>'<div class="tile"><strong>Equipo '+x.team+'</strong><small>Inicio</small><br><code>'+esc(x.startKey)+'</code><br><small>Validación</small><br><code>'+esc(x.finishKey)+'</code></div>').join("")+'</div></details>').join("");
 $("backup-real").onclick=()=>save("RESPALDO-PRIVADO-ECOPARQUE.json",d);
 $("stations-csv").onclick=()=>save("pin-facilitadores.csv",csv([["Estacion","Equipo","PIN de inicio","PIN de validacion"],...stationPins(d.plan).map(x=>["E"+x.id,x.team,x.startKey,x.finishKey])]),"text/csv;charset=utf-8");
 $("teams-csv").onclick=()=>save("pin-equipos.csv",csv([["Equipo","Estacion inicial","PIN de activacion","PIN de retorno"],...teams.map(x=>[x.team,"E"+x.start,x.activation,x.returnKey])]),"text/csv;charset=utf-8");
 box.querySelectorAll("[data-kit]").forEach(b=>b.onclick=()=>save("equipo-"+b.dataset.kit+".json",d.kits[b.dataset.kit.charCodeAt(0)-65]));
}
async function generateDemo(){
 if(stored(DEMO_STORE)&&!confirm("¿Generar otro equipo de prueba? El archivo anterior y sus PIN dejarán de corresponderse con el nuevo."))return;
 const btn=$("demo");btn.disabled=true;
 try{
  const plan=pinPlan(),activation=plan.activations[0],returnKey=plan.returns[0],stages=[],credentials=[];
  const eventId="DEMO-"+key(10);
  for(let id=1;id<=9;id++){
   const startKey=plan.starts[0][id-1],finishKey=plan.finishes[0][id-1];
   const fragment=String(crypto.getRandomValues(new Uint32Array(1))[0]%100).padStart(2,"0");
   stages.push({id,
    challenge:await seal({id,title:"Reto de prueba E"+id,task:"SIMULACION: el facilitador comprueba el reto E"+id+"."},startKey),
    reward:await seal({id,fragment,clue:"SIMULACION: continúen a la estación E"+((id%9)+1)+"."},finishKey)
   });
   credentials.push({id,startKey,finishKey,fragment});
  }
  const kit={version:1,eventId,team:"A",start:1,activationHash:await digest(activation),returnHash:await digest(returnKey),stages};
  const d={kit,activation,returnKey,credentials};keep(DEMO_STORE,d);showDemo(d);save("equipo-A-PRUEBA.json",kit);
 }catch(err){alert(err.message)}
 finally{btn.disabled=false}
}
async function generateReal(){
 if(stored(REAL_STORE)&&!confirm("Ya existe una generación de nueve equipos. ¿Crear otra? Deberás distribuir los nueve nuevos paquetes y PIN."))return;
 const tasks=[];
 for(let i=0;i<9;i++){
  const title=$("title"+i).value.trim(),task=$("task"+i).value.trim(),clue=$("clue"+i).value.trim();
  if(!title||!task||!clue){alert("Complete nombre, consigna y pista de E"+(i+1));return}
  tasks.push({title,task,clue});
 }
 const btn=$("generate");btn.disabled=true;
 try{
  const plan=pinPlan(),eventId="ECO-"+key(12),kits=[];
  for(let t=0;t<9;t++){
   const team=String.fromCharCode(65+t),start=t+1,activation=plan.activations[t],returnKey=plan.returns[t],stages=[];
   for(let id=1;id<=9;id++){
    const {title,task,clue}=tasks[id-1],fragment=String(crypto.getRandomValues(new Uint32Array(1))[0]%100).padStart(2,"0");
    stages.push({id,challenge:await seal({id,title,task},plan.starts[t][id-1]),reward:await seal({id,fragment,clue},plan.finishes[t][id-1])});
   }
   kits.push({version:1,eventId,team,start,activationHash:await digest(activation),returnHash:await digest(returnKey),stages});
   $("status").textContent="Cifrando equipo "+team+" de I...";
  }
  const d={eventId,plan,kits,createdAt:new Date().toISOString()};
  keep(REAL_STORE,d);showReal(d);$("status").textContent="Listo. Descarga los nueve paquetes y las dos hojas de PIN.";
 }catch(err){alert("No se pudieron generar los paquetes: "+err.message)}
 finally{btn.disabled=false}
}
render();
