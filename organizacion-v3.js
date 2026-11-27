import {auth,db,firebaseConfigured,notConfigured,call,$,esc,TEAMS,STATIONS,PLACES,
 eventRef,staffRef,teamInvitationLink,facilitatorInvitationLink,safeQr,installHelp,shortError,dateTime} from "./firebase-core.js";
import {signInWithEmailAndPassword,signOut,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {collection,doc,getDoc,onSnapshot} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

let eventData=null,teams={},teamInvites={},facInvites={},unsub=[];
function showError(e){const n=$("notice");if(n)n.textContent=shortError(e);}
function showMessage(t){const n=$("notice");if(n)n.textContent=t;}
function detach(){for(const fn of unsub)fn();unsub=[];}
function login(){
 $("app").innerHTML='<section class="card"><h2>Ingreso del líder</h2><p>Acceso exclusivo a la organización y seguimiento de la gincana.</p><label>Correo</label><input id="email" type="email" autocomplete="username"><label>Contraseña</label><input id="password" type="password" autocomplete="current-password"><button id="login">Ingresar</button><p id="notice" role="status"></p></section>';
 $("login").onclick=async()=>{
  const btn=$("login");btn.disabled=true;
  try{await signInWithEmailAndPassword(auth,$("email").value.trim(),$("password").value);}
  catch(e){showError(e);}finally{if(btn.isConnected)btn.disabled=false;}
 };
}
function layout(){
 $("app").innerHTML='<div class="toolbar"><strong>Panel de control · Líder</strong><button class="alt compact" id="logout">Cerrar sesión</button></div><p id="notice" role="status"></p><div id="summary"></div><div id="editor"></div><div id="enrollment"></div><div id="leaderboard"></div>';
 $("logout").onclick=()=>signOut(auth);
}
function fieldTable(title,items,prefix,defaultName){
 return '<h3>'+title+'</h3><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Identificador</th><th>Nombre</th></tr></thead><tbody>'+
 items.map((id,i)=>'<tr><td><strong>'+esc(id)+'</strong> · '+(prefix==="fac" ? esc(PLACES[i]):"Equipo")+'</td><td><input id="'+prefix+esc(id)+'" maxlength="60" value="'+esc(defaultName(id))+'" placeholder="Escriba el nombre"></td></tr>').join("")+'</tbody></table></div>';
}
function buildForm(){
 const existing=Boolean(eventData),status=eventData?.status||"none",p=$("editor");
 if(!p)return;
 if(existing&&status!=="setup"){p.innerHTML="";return;}
 p.innerHTML='<section class="card"><h2>1. Crear equipos y asignar facilitadores</h2>'+
 '<p>Introduzca exactamente los nueve nombres de equipos. Identifique al facilitador de cada estación. El sistema asignará automáticamente una estación inicial diferente a cada equipo.</p>'+
 fieldTable("Equipos",TEAMS,"team",id=>teams[id]?.name||"")+
 fieldTable("Facilitadores",STATIONS,"fac",id=>facInvites[id]?.name||"")+
 '<button id="save-setup">'+(existing?"Guardar cambios de nombres":"Crear nueve equipos y códigos QR")+'</button>'+
 '<p class="small">La distribución de estaciones se hace automáticamente. Después de generar los QR, cada equipo y facilitador debe escanear su invitación.</p></section>';
 $("save-setup").onclick=async()=>{
  const plan={
   teams:TEAMS.map(id=>({name:$("team"+id).value.trim(),slogan:""})),
   facilitators:STATIONS.map(station=>({name:$("fac"+station).value.trim()}))
  };
  if(plan.teams.some(x=>!x.name)||plan.facilitators.some(x=>!x.name)){
   showMessage("Escriba los nueve nombres de equipos y los nueve nombres de facilitadores.");return;
  }
  const btn=$("save-setup");btn.disabled=true;
  try{
   await call(existing?"editSetup":"setupEvent",plan);
   showMessage("Datos guardados. Distribuya los QR privados a sus destinatarios.");
  }catch(e){showError(e);}finally{if(btn.isConnected)btn.disabled=false;}
 };
}
function cardQr(title,subtitle,link,elId,claimed){
 return '<div class="qr-card"><h3>'+esc(title)+'</h3><p>'+esc(subtitle)+'</p>'+
 '<div class="qr-img" id="'+esc(elId)+'"></div>'+
 '<p class="'+(claimed?"ok":"warn")+'">'+(claimed?"Dispositivo vinculado":"Pendiente de escaneo")+'</p>'+
 '<button class="alt" data-copy="'+esc(elId)+'">Copiar enlace privado</button></div>';
}
function renderInvites(){
 const root=$("enrollment");if(!root)return;
 if(!eventData){root.innerHTML="";return;}
 if(Object.keys(teamInvites).length!==9||Object.keys(facInvites).length!==9)return;
 const teamCards=TEAMS.map(id=>{
  const t=teams[id]||{},invite=teamInvites[id];
  return cardQr("Equipo "+id,t.name+" · inicio "+(t.initial||"—")+" ("+PLACES[STATIONS.indexOf(t.initial)]+")",
   teamInvitationLink(id,invite.token),"team-qr-"+id,Boolean(t.ownerUid));
 }).join("");
 const facCards=STATIONS.map((station,i)=>{
  const invite=facInvites[station];
  return cardQr("Facilitador "+station,invite.name+" · "+PLACES[i],
   facilitatorInvitationLink(station,invite.token),"fac-qr-"+station,Boolean(invite.claimedUid));
 }).join("");
 root.innerHTML='<section class="card"><h2>2. Instalación y registro mediante QR</h2>'+
 '<p>Primero entregue a cada equipo su QR individual. Luego entregue al facilitador el QR de la estación que le corresponde. Cada dispositivo debe abrir el enlace, instalar la aplicación y confirmar su vinculación.</p>'+
 installHelp()+
 '<details open><summary><strong>Nueve QR de los equipos</strong></summary><div class="qr-grid">'+teamCards+'</div></details>'+
 '<details><summary><strong>Nueve QR de facilitadores</strong></summary><div class="qr-grid">'+facCards+'</div></details>'+
 '<p class="warn">Los QR contienen enlaces privados de inscripción. No publique capturas en redes ni comparta enlaces entre equipos.</p></section>';
 const copyMap={};
 for(const id of TEAMS){const x=teamInvites[id],k="team-qr-"+id,l=teamInvitationLink(id,x.token);copyMap[k]=l;safeQr($(k),l,176);}
 for(const station of STATIONS){const x=facInvites[station],k="fac-qr-"+station,l=facilitatorInvitationLink(station,x.token);copyMap[k]=l;safeQr($(k),l,176);}
 root.querySelectorAll("[data-copy]").forEach(btn=>btn.onclick=async()=>{
  const link=copyMap[btn.dataset.copy];
  try{await navigator.clipboard.writeText(link);btn.textContent="Copiado";}catch{prompt("Copie el enlace privado:",link);}
 });
}
function renderSummary(){
 const root=$("summary");if(!root)return;
 if(!eventData){
  root.innerHTML='<section class="card"><h2>Gincana UPEC</h2><p>Evento aún no configurado. Ingrese los nombres de los equipos y los facilitadores para obtener los QR de instalación.</p></section>';
  return;
 }
 const linkedTeams=Object.values(teams).filter(t=>Boolean(t.ownerUid)).length;
 const linkedFac=Object.values(facInvites).filter(t=>Boolean(t.claimedUid)).length;
 const active=eventData.status==="live";
 root.innerHTML='<section class="card"><h2>Estado del evento</h2>'+
 '<p><strong>'+esc(eventData.status==="setup"?"Preparación":active?"En ejecución":"Finalizado")+'</strong></p>'+
 '<p>Equipos inscritos: <strong>'+linkedTeams+'/9</strong> · Facilitadores vinculados: <strong>'+linkedFac+'/9</strong></p>'+
 (eventData.winner?'<p class="ok"><strong>GANADOR: '+esc(eventData.winner.team)+' · '+esc(eventData.winner.name)+'</strong> · '+esc(dateTime(eventData.winner.at))+'</p>':"")+
 (eventData.status==="setup"?'<button id="start-game" '+(linkedTeams===9&&linkedFac===9?"":"disabled")+'>Iniciar gincana</button>':
 active?'<button id="finish-game" class="alt">Finalizar evento</button>':"")+
 '<p class="small">Se exige que estén vinculados los nueve equipos y los nueve facilitadores antes de iniciar.</p></section>';
 if($("start-game"))$("start-game").onclick=async()=>{
  if(!confirm("¿Iniciar la gincana y activar las estaciones asignadas?"))return;
  try{await call("startEvent");showMessage("Gincana iniciada.");}catch(e){showError(e);}
 };
 if($("finish-game"))$("finish-game").onclick=async()=>{
  if(!confirm("¿Finalizar definitivamente la gincana?"))return;
  try{await call("finishEvent");showMessage("Gincana finalizada.");}catch(e){showError(e);}
 };
}
function renderLeaderboard(){
 const root=$("leaderboard");if(!root||!eventData){if(root)root.innerHTML="";return;}
 const arr=TEAMS.map(id=>teams[id]).filter(Boolean);
 const sorted=[...arr].sort((a,b)=>{
  if(a.chestAt&&!b.chestAt)return -1;
  if(b.chestAt&&!a.chestAt)return 1;
  if(a.chestAt&&b.chestAt)return a.chestAt.toMillis()-b.chestAt.toMillis();
  return b.count-a.count||a.id.localeCompare(b.id);
 });
 const reservations=eventData.reservations||{};
 root.innerHTML='<section class="card"><h2>3. Avance en tiempo real</h2>'+
 '<p>El estado se actualiza al escanear un QR de validación. Una estación puede tener más de un equipo cuando las alternativas pendientes estén ocupadas.</p>'+
 '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Equipo</th><th>Inicio</th><th>Estación activa</th><th>Progreso</th><th>Registro por estación</th><th>Cofre</th></tr></thead><tbody>'+
 sorted.map(t=>'<tr><td><strong>'+esc(t.id)+'</strong><p>'+esc(t.name)+'</p></td><td>'+esc(t.initial)+'</td>'+
 '<td>'+esc(t.current? t.current+" · "+PLACES[STATIONS.indexOf(t.current)]:"Completadas")+'</td>'+
 '<td><strong>'+t.count+'/9</strong></td>'+
 '<td class="marks">'+STATIONS.map(s=>'<span class="'+(t.completed?.[s]?"complete":t.current===s?"current":"pending")+'">'+s+'</span>').join(" ")+'</td>'+
 '<td>'+esc(t.chestAt?dateTime(t.chestAt):"Pendiente")+'</td></tr>').join("")+
 '</tbody></table></div>'+
 '<h3>Distribución actual prevista</h3><div class="grid">'+STATIONS.map(s=>'<div class="tile"><small>'+s+'</small><strong>'+esc((reservations[s]||[]).join(", ")||"Libre")+'</strong></div>').join("")+'</div>'+
 '</section>';
}
function rerender(){
 renderSummary();buildForm();renderInvites();renderLeaderboard();
}
async function authorized(user){
 try{
  const snap=await getDoc(staffRef(user.uid));
  if(!snap.exists()||!["leader","admin"].includes(snap.data().role))throw Error("Esta cuenta no tiene permiso de líder.");
  layout();
  unsub.push(onSnapshot(eventRef(),s=>{eventData=s.exists()?s.data():null;rerender();},showError));
  unsub.push(onSnapshot(collection(db,"events","current","teams"),s=>{
   teams=Object.fromEntries(s.docs.map(d=>[d.id,d.data()]));rerender();
  },showError));
  unsub.push(onSnapshot(collection(db,"events","current","teamInvites"),s=>{
   teamInvites=Object.fromEntries(s.docs.map(d=>[d.id,d.data()]));rerender();
  },showError));
  unsub.push(onSnapshot(collection(db,"events","current","facInvites"),s=>{
   facInvites=Object.fromEntries(s.docs.map(d=>[d.id,d.data()]));rerender();
  },showError));
 }catch(e){
  $("app").innerHTML='<section class="card"><p class="warn">'+esc(shortError(e))+'</p><button id="logout">Cerrar sesión</button></section>';
  $("logout").onclick=()=>signOut(auth);
 }
}
if(!firebaseConfigured)notConfigured();
else onAuthStateChanged(auth,user=>{
 detach();eventData=null;teams={};teamInvites={};facInvites={};
 if(user)authorized(user);else login();
});
