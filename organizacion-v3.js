import {auth,db,firebaseConfigured,setupNotice,$,esc,PLACES,TITLES,EVENT,
 routeFor,teamRef,tokenRef,rewardRef,eventRef,roleFor,teamLink,randomHex,randomPair,sha256,datetime,errText} from "./firebase-core.js";
import {signInWithEmailAndPassword,signOut,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {collection,doc,getDoc,getDocs,setDoc,updateDoc,writeBatch,onSnapshot,serverTimestamp} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

let currentEvent=null, teams=[], tokens={}, stopTeams=null, stopEvent=null;
const id=i=>String.fromCharCode(65+i);
function message(s){const e=$("notice");if(e)e.textContent=s;}
function loginView(){
 $("app").innerHTML='<section class="card"><h2>Acceso de organización</h2><p>Utilice el correo y contraseña autorizados en Firebase Authentication.</p><label>Correo institucional</label><input id="email" type="email" autocomplete="username"><label>Contraseña</label><input id="password" type="password" autocomplete="current-password"><button id="login">Ingresar</button><p id="notice" role="status"></p></section>';
 $("login").onclick=async()=>{try{await signInWithEmailAndPassword(auth,$("email").value.trim(),$("password").value);}catch(e){message(errText(e));}};
}
function shell(){
 $("app").innerHTML='<div class="toolbar"><p><strong>Administración UPEC</strong> · <span id="state-label">Cargando...</span></p><button id="logout" class="alt compact">Cerrar sesión</button></div><p id="notice" role="status"></p><div id="setup-panel"></div><div id="qr-panel"></div><div id="score-panel"></div>';
 $("logout").onclick=()=>signOut(auth);
}
function renderSetup(){
 const p=$("setup-panel");if(!p)return;
 const status=currentEvent?.status||"setup";
 if(status!=="setup"){
  p.innerHTML='<section class="card"><h2>Evento '+esc(status==="live"?"en desarrollo":"finalizado")+'</h2><p>La asignación de estaciones queda bloqueada al comenzar la gincana.</p>'+(status==="live"?'<button id="end" class="alt">Finalizar evento</button>':'')+'</section>';
  if($("end"))$("end").onclick=()=>changeStatus("finished");
  return;
 }
 p.innerHTML='<section class="card"><h2>1. Asignación de equipos y estaciones</h2><p>Ingrese el nombre y el eslogan de los nueve equipos. Puede cambiar la estación inicial en cada fila; cada equipo debe comenzar en una estación diferente. El circuito siempre avanza E1 → E2 → ... → E9 → E1.</p><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Equipo</th><th>Nombre</th><th>Eslogan</th><th>Estación inicial</th></tr></thead><tbody>'+Array.from({length:9},(_,i)=>{const t=teams.find(x=>x.team===id(i))||{};return '<tr><td><strong>'+id(i)+'</strong></td><td><input id="name'+i+'" maxlength="60" value="'+esc(t.name||"")+'" placeholder="Nombre del equipo"></td><td><input id="slogan'+i+'" maxlength="120" value="'+esc(t.slogan||"")+'" placeholder="Eslogan"></td><td><select id="station'+i+'">'+PLACES.map((x,j)=>'<option value="'+(j+1)+'" '+((t.startKey||("E"+(i+1)))==="E"+(j+1)?"selected":"")+'>'+"E"+(j+1)+" · "+esc(x)+'</option>').join("")+'</select></td></tr>';}).join("")+'</tbody></table></div><button id="save">Guardar equipos y generar QR</button><p class="warn">No pulse «Iniciar» hasta comprobar los nueve QR y la identificación de cada facilitador.</p><button id="begin" class="alt" '+(teams.length===9?"":"disabled")+'>Iniciar evento</button></section>';
 $("save").onclick=saveTeams;
 $("begin").onclick=()=>changeStatus("live");
}
async function saveTeams(){
 const values=Array.from({length:9},(_,i)=>({team:id(i),name:$("name"+i).value.trim(),slogan:$("slogan"+i).value.trim(),start:Number($("station"+i).value)}));
 if(values.some(v=>!v.name||!v.slogan)){alert("Complete nombres y eslóganes de los nueve equipos.");return;}
 if(new Set(values.map(v=>v.start)).size!==9){alert("Cada equipo debe tener una estación inicial distinta.");return;}
 const btn=$("save");btn.disabled=true;
 try{
  const evt=await getDoc(eventRef());
  if(evt.exists()&&evt.data().status!=="setup")throw Error("El evento ya ha comenzado: no se pueden reasignar equipos.");
  if(!evt.exists())await setDoc(eventRef(),{title:"Gincana turística UPEC",venue:"Centro Deportivo de la UPEC",status:"setup",createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
  const batch=writeBatch(db);
  const usedCodes=new Set();
  for(const t of values){
   const tr=await getDoc(tokenRef(t.team)),rr=await getDoc(rewardRef(t.team));
   const token=tr.exists()?tr.data().token:randomHex();
   let fragments;
   if(rr.exists()){fragments=rr.data().fragments;}
   else{
    let code;
    do{
     fragments=Object.fromEntries(Array.from({length:9},(_,i)=>["E"+(i+1),randomPair()]));
     code=Object.values(fragments).join("");
    }while(usedCodes.has(code));
    usedCodes.add(code);
   }
   const data={
    team:t.team,name:t.name,slogan:t.slogan,startKey:"E"+t.start,
    route:routeFor(t.start).map(n=>"E"+n),qrHash:await sha256(token),
    completed:{},inProgress:null,step:0,returned:false,returnedAt:null,
    openedAt:null,openedCode:null,updatedAt:serverTimestamp()
   };
   const existing=teams.find(x=>x.team===t.team);
   if(!existing)data.createdAt=serverTimestamp();
   batch.set(teamRef(t.team),data,{merge:true});
   if(!tr.exists())batch.set(tokenRef(t.team),{team:t.team,token,createdAt:serverTimestamp()});
   if(!rr.exists())batch.set(rewardRef(t.team),{team:t.team,fragments,createdAt:serverTimestamp()});
  }
  await batch.commit();
  message("Se guardaron los nueve equipos, las estaciones iniciales y sus QR.");
  await loadTokens();
 }catch(e){message(errText(e));}finally{btn.disabled=false;}
}
async function loadTokens(){
 if(!firebaseConfigured)return;
 try{
  const ss=await getDocs(collection(db,"events",EVENT,"tokens"));
  tokens=Object.fromEntries(ss.docs.map(d=>[d.id,d.data().token]));
  renderQrs();
 }catch(e){message(errText(e));}
}
function renderQrs(){
 const p=$("qr-panel");if(!p)return;
 if(teams.length!==9||Object.keys(tokens).length!==9){p.innerHTML="";return;}
 p.innerHTML='<section class="card"><h2>2. QR de los nueve líderes</h2><p>Entregue a cada líder únicamente el enlace o QR de su equipo. Debe abrir su enlace en el teléfono que llevará durante la gincana y mostrar el QR a cada facilitador.</p><div class="qr-grid">'+teams.map(t=>'<div class="qr-card"><h3>Equipo '+esc(t.team)+'</h3><p>'+esc(t.name)+'<small> · '+esc(t.startKey)+'</small></p><div class="qr-img" id="qr'+esc(t.team)+'"></div><button class="alt" data-copy="'+esc(t.team)+'">Copiar enlace</button><a target="_blank" rel="noopener noreferrer" href="'+esc(teamLink(t.team,tokens[t.team]))+'">Abrir enlace</a></div>').join("")+'</div><button id="export-qr" class="alt">Descargar respaldo privado de enlaces (JSON)</button></section>';
 for(const t of teams){
  const node=$("qr"+t.team);
  if(node&&typeof QRCode!=="undefined")new QRCode(node,{text:teamLink(t.team,tokens[t.team]),width:170,height:170,correctLevel:QRCode.CorrectLevel.M});
 }
 p.querySelectorAll("[data-copy]").forEach(btn=>btn.onclick=async()=>{
  const t=btn.dataset.copy;
  try{await navigator.clipboard.writeText(teamLink(t,tokens[t]));btn.textContent="Copiado";}catch{prompt("Copie el enlace:",teamLink(t,tokens[t]));}
 });
 $("export-qr").onclick=()=>downloadBackup();
}
function downloadBackup(){
 const payload={venue:"Centro Deportivo de la UPEC",createdAt:new Date().toISOString(),
  teams:teams.map(t=>({team:t.team,name:t.name,slogan:t.slogan,startKey:t.startKey,url:teamLink(t.team,tokens[t.team])}))};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
 const a=document.createElement("a"),u=URL.createObjectURL(blob);
 a.href=u;a.download="RESPALDO-PRIVADO-QR-GINCANA-UPEC.json";a.click();
 setTimeout(()=>URL.revokeObjectURL(u),1500);
}
function renderScore(){
 const p=$("score-panel");if(!p)return;
 if(!teams.length){p.innerHTML="";return;}
 const ordered=[...teams].sort((a,b)=>{
  if(a.openedAt&&!b.openedAt)return -1;
  if(b.openedAt&&!a.openedAt)return 1;
  if(a.openedAt&&b.openedAt)return a.openedAt.toMillis()-b.openedAt.toMillis();
  return b.step-a.step || a.team.localeCompare(b.team);
 });
 p.innerHTML='<section class="card"><h2>3. Seguimiento en tiempo real</h2><p>Los resultados se registran desde los teléfonos de los facilitadores. La clasificación por llegada se basa en la hora de apertura validada en Firestore.</p><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Equipo</th><th>Nombre</th><th>Inicio</th><th>Avance</th><th>Situación</th><th>Apertura</th></tr></thead><tbody>'+ordered.map(t=>'<tr><td>'+esc(t.team)+'</td><td>'+esc(t.name)+'</td><td>'+esc(t.startKey)+'</td><td>'+t.step+'/9</td><td>'+esc(t.openedAt?"COFRE ABIERTO":t.returned?"Retornó":t.inProgress?"En "+t.inProgress.station:t.step===9?"Debe regresar":"En recorrido")+'</td><td>'+esc(datetime(t.openedAt))+'</td></tr>').join("")+'</tbody></table></div></section>';
}
async function changeStatus(status){
 if(status==="live" && teams.length!==9){alert("Primero registre los nueve equipos.");return;}
 const warning=status==="live"?"¿Iniciar la gincana y bloquear la asignación de estaciones?":"¿Finalizar el evento? No se permitirán nuevas validaciones.";
 if(!confirm(warning))return;
 try{await updateDoc(eventRef(),{status,updatedAt:serverTimestamp()});message("Estado actualizado: "+status);}
 catch(e){message(errText(e));}
}
async function authenticated(u){
 try{
  const role=await roleFor(u.uid);
  if(role.role!=="admin")throw Error("La cuenta no tiene el rol de organizador.");
  shell();
  stopEvent=onSnapshot(eventRef(),snapshot=>{
   currentEvent=snapshot.exists()?snapshot.data():null;
   $("state-label").textContent=currentEvent?.status||"Pendiente de creación";
   renderSetup();
  },e=>message(errText(e)));
  stopTeams=onSnapshot(collection(db,"events",EVENT,"teams"),snapshot=>{
   teams=snapshot.docs.map(d=>d.data()).sort((a,b)=>a.team.localeCompare(b.team));
   renderSetup();renderScore();renderQrs();
   if(teams.length===9&&Object.keys(tokens).length!==9)loadTokens();
  },e=>message(errText(e)));
  await loadTokens();
 }catch(e){$("app").innerHTML='<section class="card"><p class="warn">'+esc(errText(e))+'</p><button id="logout">Cerrar sesión</button></section>';$("logout").onclick=()=>signOut(auth);}
}
if(!firebaseConfigured)setupNotice();
else onAuthStateChanged(auth,u=>{
 if(stopEvent){stopEvent();stopEvent=null;}
 if(stopTeams){stopTeams();stopTeams=null;}
 if(u)authenticated(u);
 else{currentEvent=null;teams=[];tokens={};loginView();}
});
