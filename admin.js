"use strict";
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const DEMO_STORE="ecoparque_demo_beta13",REAL_STORE="ecoparque_event_beta13";
const TOURISM_WORDS=("PASAPORTE SELLO DESTINO RUTA MALETA EQUIPAJE VIAJE TURISTA GUIA BRUJULA MAPA SENDERO MIRADOR HOTEL HOSTAL POSADA ALBERGUE CAMPAMENTO EXCURSION TRAVESIA AVENTURA ITINERARIO RESERVA BOLETO BILLETE EMBARQUE AEROPUERTO TERMINAL ESTACION PUERTO MUELLE CRUCERO VELERO CANOTAJE KAYAK SENDERISMO CICLISMO MONTANA BOSQUE LAGUNA CASCADA VOLCAN PARAMO PLAYA ISLA VALLE CUMBRE REFUGIO FARO MUSEO GALERIA MONUMENTO PATRIMONIO CULTURA ARTESANIA GASTRONOMIA FESTIVAL FERIA MERCADO PLAZA PARQUE JARDIN MURAL TEMPLO FORTALEZA CASTILLO RUINAS ARQUEOLOGIA ECOTURISMO AGROTURISMO GEOTURISMO AVISTAMIENTO OBSERVATORIO BINOCULARES CAMINATA PASEO RECORRIDO EXPEDICION EXPLORADOR MOCHILERO VIAJERO NAVEGANTE PEREGRINO ANFITRION HOSPEDAJE ALOJAMIENTO RECEPCION CONSERJE CIRCUITO ESCALA TRASLADO TRANSPORTE BICICLETA AUTOBUS TREN TELEFERICO FUNICULAR CARAVANA CARRETERA PASARELA CABANA HABITACION TARIFA HUESPED VISITANTE EXPERIENCIA VIVENCIA ATRACCION PANORAMA PAISAJE HORIZONTE BARRANCO ECOLOGIA NATURALEZA SANTUARIO RESERVACION MUSEOGRAFIA ARTESANO MIRADORES ANDINISMO NAVEGACION").split(" ");
function wordPlan(){
 const pool=[...new Set(TOURISM_WORDS.filter(w=>w.length<=9))];
 if(pool.length<36)throw Error("Vocabulario insuficiente");
 for(let i=pool.length-1;i>0;i--){const j=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1);[pool[i],pool[j]]=[pool[j],pool[i]]}
 return{activations:pool.slice(0,9),returns:pool.slice(9,18),starts:pool.slice(18,27),finishes:pool.slice(27,36)};
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
function stationWords(plan){return Array.from({length:9},(_,i)=>({id:i+1,startKey:plan.starts[i],finishKey:plan.finishes[i]}))}
function render(){
 let h='<section class="card"><h2>Prueba técnica rápida</h2><p>Genera un equipo ficticio A con palabras turísticas. Se conservarán el paquete y sus palabras en este navegador.</p><button id="demo">Generar nuevo equipo A de prueba</button><div id="demo-result"></div></section>';
 h+='<section class="card"><h2>Configuración real de nueve estaciones</h2><p>Escribe las consignas privadas y las pistas finales. Las palabras de acceso se asignarán aleatoriamente, serán diferentes entre sí y podrán consultarse en el respaldo privado.</p><p class="warn">Una sola palabra es fácil de teclear, pero más vulnerable a intentos de adivinación. El facilitador debe comprobar físicamente el reto antes de validar.</p></section>';
 for(let i=0;i<9;i++)h+='<section class="card"><h3>Estación E'+(i+1)+'</h3><label>Nombre del reto</label><input id="title'+i+'" placeholder="Nombre de la estación"><label>Consigna del reto</label><textarea id="task'+i+'" placeholder="Descripción del desafío"></textarea><label>Pista hacia la siguiente estación</label><textarea id="clue'+i+'">Pista provisional: diríjanse a la estación E'+((i+1)%9+1)+'.</textarea></section>';
 h+='<section class="card"><button id="generate">Generar los nueve equipos con palabras turísticas</button><p>Los nueve paquetes y las claves quedarán guardados en este navegador hasta que borres sus datos. Descarga y conserva el respaldo privado.</p><p id="status" aria-live="polite"></p><div id="real-result"></div></section>';
 $("app").innerHTML=h;$("demo").onclick=generateDemo;$("generate").onclick=generateReal;
 showDemo(stored(DEMO_STORE));showReal(stored(REAL_STORE));
}
function showDemo(d){
 const box=$("demo-result");if(!box||!d)return;
 box.innerHTML='<h3 class="ok">Equipo A de prueba disponible</h3><p><strong>Identificador:</strong> '+esc(d.kit.eventId)+'</p>'+
 '<p><strong>Palabra de activación:</strong> <code>'+esc(d.activation)+'</code></p>'+
 '<p><strong>Palabra de retorno:</strong> <code>'+esc(d.returnKey)+'</code></p>'+
 '<button id="redownload-kit">Descargar paquete del equipo A</button>'+
 '<button id="redownload-keys" class="alt">Descargar respaldo de palabras</button>'+
 '<div class="grid">'+d.credentials.map(x=>'<div class="tile"><strong>E'+x.id+'</strong><small>Inicio</small><br><code>'+esc(x.startKey)+'</code><br><small>Validación</small><br><code>'+esc(x.finishKey)+'</code></div>').join("")+'</div>'+
 '<p class="warn">El paquete y las palabras corresponden al mismo identificador. No mezcles paquetes de distintas generaciones.</p>';
 $("redownload-kit").onclick=()=>save("equipo-A-PRUEBA.json",d.kit);
 $("redownload-keys").onclick=()=>save("claves-equipo-A-PRUEBA.json",{eventId:d.kit.eventId,activation:d.activation,returnKey:d.returnKey,credentials:d.credentials});
}
function showReal(d){
 const box=$("real-result");if(!box||!d)return;
 const teams=Array.from({length:9},(_,i)=>({team:String.fromCharCode(65+i),start:i+1,activation:d.plan.activations[i],returnKey:d.plan.returns[i]}));
 box.innerHTML='<h3 class="ok">Paquetes reales preparados</h3><p><strong>Identificador:</strong> '+esc(d.eventId)+'</p>'+
 '<p>Descarga los nueve paquetes y las hojas privadas. Cada facilitador utiliza las mismas dos palabras de su estación con todos los equipos.</p>'+
 '<button id="backup-real" class="alt">Descargar respaldo privado completo</button>'+
 '<button id="stations-csv">Descargar palabras de facilitadores (CSV)</button>'+
 '<button id="teams-csv">Descargar palabras de equipos (CSV)</button>'+
 '<h3>Equipos y palabras</h3><div class="grid">'+teams.map(x=>'<div class="tile"><strong>Equipo '+x.team+'</strong><small>Activa</small><br><code>'+esc(x.activation)+'</code><br><small>Retorno</small><br><code>'+esc(x.returnKey)+'</code><button class="alt" data-kit="'+x.team+'">Descargar '+x.team+'</button></div>').join("")+'</div>'+
 '<h3>Palabras de facilitadores</h3><div class="grid">'+stationWords(d.plan).map(x=>'<div class="tile"><strong>E'+x.id+'</strong><small>Inicio</small><br><code>'+esc(x.startKey)+'</code><br><small>Validación</small><br><code>'+esc(x.finishKey)+'</code></div>').join("")+'</div>';
 $("backup-real").onclick=()=>save("RESPALDO-PRIVADO-ECOPARQUE.json",d);
 $("stations-csv").onclick=()=>save("palabras-facilitadores.csv",csv([["Estacion","Palabra de inicio","Palabra de validacion"],...stationWords(d.plan).map(x=>["E"+x.id,x.startKey,x.finishKey])]),"text/csv;charset=utf-8");
 $("teams-csv").onclick=()=>save("palabras-equipos.csv",csv([["Equipo","Estacion inicial","Palabra de activacion","Palabra de retorno"],...teams.map(x=>[x.team,"E"+x.start,x.activation,x.returnKey])]),"text/csv;charset=utf-8");
 box.querySelectorAll("[data-kit]").forEach(b=>b.onclick=()=>save("equipo-"+b.dataset.kit+".json",d.kits[b.dataset.kit.charCodeAt(0)-65]));
}
async function generateDemo(){
 if(stored(DEMO_STORE)&&!confirm("¿Generar otro equipo de prueba? El archivo anterior y sus palabras dejarán de corresponderse con el nuevo."))return;
 const btn=$("demo");btn.disabled=true;
 try{
  const plan=wordPlan(),activation=plan.activations[0],returnKey=plan.returns[0],stages=[],credentials=[];
  const eventId="DEMO-"+key(10);
  for(let id=1;id<=9;id++){
   const startKey=plan.starts[id-1],finishKey=plan.finishes[id-1];
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
 if(stored(REAL_STORE)&&!confirm("Ya existe una generación de nueve equipos. ¿Crear otra? Deberás distribuir los nueve nuevos paquetes y palabras."))return;
 const tasks=[];
 for(let i=0;i<9;i++){
  const title=$("title"+i).value.trim(),task=$("task"+i).value.trim(),clue=$("clue"+i).value.trim();
  if(!title||!task||!clue){alert("Complete nombre, consigna y pista de E"+(i+1));return}
  tasks.push({title,task,clue});
 }
 const btn=$("generate");btn.disabled=true;
 try{
  const plan=wordPlan(),eventId="ECO-"+key(12),kits=[];
  for(let t=0;t<9;t++){
   const team=String.fromCharCode(65+t),start=t+1,activation=plan.activations[t],returnKey=plan.returns[t],stages=[];
   for(let id=1;id<=9;id++){
    const {title,task,clue}=tasks[id-1],fragment=String(crypto.getRandomValues(new Uint32Array(1))[0]%100).padStart(2,"0");
    stages.push({id,challenge:await seal({id,title,task},plan.starts[id-1]),reward:await seal({id,fragment,clue},plan.finishes[id-1])});
   }
   kits.push({version:1,eventId,team,start,activationHash:await digest(activation),returnHash:await digest(returnKey),stages});
   $("status").textContent="Cifrando equipo "+team+" de I...";
  }
  const d={eventId,plan,kits,createdAt:new Date().toISOString()};
  keep(REAL_STORE,d);showReal(d);$("status").textContent="Listo. Descarga los nueve paquetes y las dos hojas de palabras.";
 }catch(err){alert("No se pudieron generar los paquetes: "+err.message)}
 finally{btn.disabled=false}
}
render();
