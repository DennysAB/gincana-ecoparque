"use strict";
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const DEMO_STORE="ecoparque_demo_beta15",REAL_STORE="ecoparque_event_beta15";
const STATIONS=[
 {
  "place": "Caseta 1",
  "title": "El pasaporte destruido",
  "task": "MISIÓN: Reconstruyan sobre el suelo el pasaporte de 12 piezas de cartulina A4, impreso por ambas caras. Lean las seis letras que aparecen al dorso, en el orden indicado, y conviertan cada letra en un dígito mediante el teclado telefónico T9: ABC=2, DEF=3, GHI=4, JKL=5, MNO=6, PQRS=7, TUV=8, WXYZ=9. Comuníquenle al facilitador la secuencia de seis dígitos. El facilitador verificará la respuesta y, si es correcta, introducirá su PIN de validación.",
  "clue": "El siguiente guardián no ruge como león ni vive en una jaula: su figura representa al gran felino andino. Busquen la ESCULTURA DEL PUMA."
 },
 {
  "place": "Escultura del puma",
  "title": "La maleta imposible",
  "task": "MISIÓN: Su expedición parte de inmediato. Elijan exactamente cuatro tarjetas de equipaje, una de cada categoría (orientación, protección, salud y comunicación). La suma de los pesos no debe superar 8 kg y la utilidad total debe alcanzar al menos 21 puntos. Cada tarjeta muestra peso y utilidad. Coloquen su selección en el suelo junto al cartel A4 y expliquen el cálculo. Solo existe una combinación válida. El facilitador la verificará y validará el reto con su PIN.",
  "clue": "No es la primera ni la tercera. Entre los refugios numerados, su próximo destino es la CASETA 2."
 },
 {
  "place": "Caseta 2",
  "title": "El mapa de las siete piezas",
  "task": "MISIÓN: Observen durante diez segundos la figura modelo. Después reconstruyan exactamente esa silueta sobre el suelo con las siete piezas de tangram recortadas de cartulina A4. Pueden intentar tantas veces como sea necesario. Solo se acepta la figura exacta; el facilitador verificará la coincidencia y validará con su PIN.",
  "clue": "Tengo raíces sin pies y copa sin bebida; doy sombra sin llevar sombrero. Su siguiente misión está junto al ÁRBOL señalado."
 },
 {
  "place": "Árbol",
  "title": "La torre del explorador",
  "task": "MISIÓN: Construyan una pirámide de seis vasos (tres en la base, dos en el segundo nivel y uno arriba) usando únicamente el aro elástico sujeto por cuerdas. Cada participante maneja una cuerda para abrir, cerrar, elevar y desplazar el aro. Está prohibido tocar los vasos con las manos mientras construyen. Cuando la torre se sostenga por sí sola, el facilitador introducirá su PIN. No hay cifras impresas en los vasos.",
  "clue": "Tres es el resultado de doce dividido para cuatro. Busquen la CASETA 3."
 },
 {
  "place": "Caseta 3",
  "title": "La ruta que nadie encuentra",
  "task": "MISIÓN: En el mapa ficticio impreso en cartulina A4, tracen una ruta continua desde SALIDA hasta META siguiendo únicamente las conexiones dibujadas y todas las restricciones del cartel. No pueden atravesar zonas prohibidas ni inventar caminos. Comparen la secuencia de lugares con el facilitador; solo validará una ruta que cumpla todas las condiciones.",
  "clue": "No busquen una caseta: donde los más pequeños se divierten hay dos zonas. Vayan al ÁREA DE JUEGOS INFANTILES 1, la primera."
 },
 {
  "place": "Área de juegos infantiles 1",
  "title": "El espejo del espía",
  "task": "MISIÓN: El mensaje de la cartulina A4 está escrito como si se viera en un espejo. Primero lean correctamente las letras reflejadas (pueden utilizar un espejo de mano). Después retrocedan TRES posiciones en el alfabeto latino de 26 letras, sin Ñ, para descifrar la palabra. Ejemplo: D→A, E→B, F→C. Pronuncien la palabra final al facilitador para que la verifique y valide con su PIN.",
  "clue": "No late ni bombea sangre, pero todos reconocen su forma como símbolo del afecto. Busquen el CORAZÓN."
 },
 {
  "place": "Corazón",
  "title": "Operación silencio absoluto",
  "task": "MISIÓN: Transmitan por mímica, en cadena y sin hablar, una secuencia de seis símbolos turísticos. El primer integrante observa la secuencia de fichas; cada integrante comunica los símbolos al siguiente sin mostrar las tarjetas. El último escribe las seis palabras en el orden recibido. El facilitador compara el resultado con las fichas. Si alguien habla, sustituirá una ficha por un símbolo nuevo y se repetirá la transmisión correspondiente. Solo la secuencia completa y correcta permite validar con PIN.",
  "clue": "Dos al cuadrado es cuatro. La investigación continúa en la CASETA 4."
 },
 {
  "place": "Caseta 4",
  "title": "El robo de la brújula dorada",
  "task": "MISIÓN: Resuelvan el caso usando la hoja detectivesca A4: cuatro sospechosos, cuatro horarios, cuatro lugares y cuatro evidencias. Cada persona corresponde a un único horario, lugar y objeto. Marquen descartes y deducciones hasta identificar al culpable, la hora y el lugar del robo. Expliquen su razonamiento. El facilitador comprobará la solución y validará con su PIN; no es necesario convertir la respuesta a números.",
  "clue": "Aún queda una zona para jugar. Busquen el ÁREA DE JUEGOS INFANTILES 2, no la primera."
 },
 {
  "place": "Área de juegos infantiles 2",
  "title": "La bóveda de los nueve secretos",
  "task": "MISIÓN: Completen la cuadrícula numérica 4×4 impresa en cartulina A4. Coloquen los números del 1 al 4 sin repetir en cada fila, columna ni bloque de 2×2. Cuando todas las casillas sean correctas, el facilitador introducirá su PIN de validación. El par de cifras de esta estación se mostrará en la aplicación, como en las demás.",
  "clue": "La serie de casetas comienza en uno. Continúen hacia la CASETA 1. Si allí comenzó su equipo, soliciten la confirmación de retorno; si no, prosigan con el reto E1."
 }
];
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
 h+='<section class="card"><h2>Configuración real de nueve estaciones</h2><p>Se han precargado las nueve ubicaciones, consignas y pistas. Revise y personalice el texto antes de generar los paquetes. Los materiales impresos contienen las respuestas físicas. Se asignarán aleatoriamente 180 PIN distintos de cinco dígitos: 9 de activación, 9 de retorno y 162 de inicio/validación. Cada equipo tendrá PIN diferentes para cada estación.</p><p class="warn">Los PIN de cinco dígitos son más fáciles de teclear, pero se pueden adivinar mediante pruebas exhaustivas sin conexión. El facilitador debe comprobar físicamente el reto antes de validar.</p></section>';
 for(let i=0;i<9;i++)h+='<section class="card"><h3>Estación E'+(i+1)+' · '+esc(STATIONS[i].place)+'</h3><label>Nombre del reto</label><input id="title'+i+'" placeholder="Nombre de la estación"><label>Consigna del reto</label><textarea id="task'+i+'" placeholder="Descripción del desafío"></textarea><label>Pista hacia la siguiente estación</label><textarea id="clue'+i+'">Pista provisional: diríjanse a la estación E'+((i+1)%9+1)+'.</textarea></section>';
 h+='<section class="card"><button id="generate">Generar los nueve equipos con PIN de cinco dígitos</button><p>Los nueve paquetes y sus PIN quedarán guardados en este navegador hasta que borres sus datos. Descarga y conserva el respaldo privado.</p><p id="status" aria-live="polite"></p><div id="real-result"></div></section>';
 $("app").innerHTML=h;$("demo").onclick=generateDemo;$("generate").onclick=generateReal;
 for(let i=0;i<9;i++){const d=STATIONS[i];$("title"+i).value=d.title;$("task"+i).value=d.task;$("clue"+i).value=d.clue}
 const old=stored(REAL_STORE);if(old?.tasks?.length===9){for(let i=0;i<9;i++){$("title"+i).value=old.tasks[i].title;$("task"+i).value=old.tasks[i].task;$("clue"+i).value=old.tasks[i].clue}}
 showDemo(stored(DEMO_STORE));showReal(old);
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
 $("stations-csv").onclick=()=>save("pin-facilitadores.csv",csv([["Estacion","Ubicacion","Equipo","PIN de inicio","PIN de validacion"],...stationPins(d.plan).map(x=>["E"+x.id,STATIONS[x.id-1].place,x.team,x.startKey,x.finishKey])]),"text/csv;charset=utf-8");
 $("teams-csv").onclick=()=>save("pin-equipos.csv",csv([["Equipo","Estacion inicial","Ubicacion inicial","PIN de activacion","PIN de retorno"],...teams.map(x=>[x.team,"E"+x.start,STATIONS[x.start-1].place,x.activation,x.returnKey])]),"text/csv;charset=utf-8");
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
  const plan=pinPlan(),eventId="ECO-"+key(12),kits=[],finalCodes=new Set();
  for(let t=0;t<9;t++){
   const team=String.fromCharCode(65+t),start=t+1,activation=plan.activations[t],returnKey=plan.returns[t],stages=[];
   let fragments,finalCode;
   do{fragments=Array.from({length:9},()=>String(crypto.getRandomValues(new Uint32Array(1))[0]%100).padStart(2,"0"));finalCode=fragments.join("")}while(finalCodes.has(finalCode));
   finalCodes.add(finalCode);
   for(let id=1;id<=9;id++){
    const {title,task,clue}=tasks[id-1],fragment=fragments[id-1];
    stages.push({id,challenge:await seal({id,title,task},plan.starts[t][id-1]),reward:await seal({id,fragment,clue},plan.finishes[t][id-1])});
   }
   kits.push({version:1,eventId,team,start,activationHash:await digest(activation),returnHash:await digest(returnKey),stages});
   $("status").textContent="Cifrando equipo "+team+" de I...";
  }
  const d={eventId,plan,kits,tasks,createdAt:new Date().toISOString()};
  keep(REAL_STORE,d);showReal(d);$("status").textContent="Listo. Descarga los nueve paquetes y las dos hojas de PIN.";
 }catch(err){alert("No se pudieron generar los paquetes: "+err.message)}
 finally{btn.disabled=false}
}
render();
