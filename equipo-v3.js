import {auth,db,firebaseConfigured,setupNotice,$,esc,PLACES,TITLES,EVENT,
 teamRef,eventRef,parseQr,teamLink,sha256,datetime,errText} from "./firebase-core.js";
import {signInAnonymously,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {getDoc,onSnapshot} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

let identity=null,teamData=null,eventData=null,stopTeam=null,stopEvent=null;
const STORAGE="upec_gincana_equipo_link";
function inform(s){const p=$("notice");if(p)p.textContent=s;}
function accessView(){
 $("app").innerHTML='<section class="card"><h2>Acceso del líder de equipo</h2><p>Abra el enlace QR que le entregó la organización. Si se perdió el enlace, solicite que se lo compartan nuevamente.</p><label>Pegar enlace del equipo</label><input id="link" placeholder="https://.../index.html#team=A&key=..."><button id="join">Abrir mi equipo</button><p id="notice" role="status"></p></section>';
 $("join").onclick=()=>{try{parseQr($("link").value.trim());location.href=$("link").value.trim();}catch(e){inform(errText(e));}};
}
async function initTeam(){
 try{
  let link=location.href;
  if(!location.hash){link=localStorage.getItem(STORAGE)||"";}
  if(!link){accessView();return;}
  const info=parseQr(link);
  const s=await getDoc(teamRef(info.team));
  if(!s.exists())throw Error("La organización aún no ha registrado este equipo.");
  if(await sha256(info.token)!==s.data().qrHash)throw Error("El QR ya no es válido; solicite al organizador un enlace actualizado.");
  identity=info;
  localStorage.setItem(STORAGE,teamLink(info.team,info.token));
  if(stopTeam)stopTeam();if(stopEvent)stopEvent();
  stopTeam=onSnapshot(teamRef(info.team),snap=>{
   if(!snap.exists()){inform("Se eliminó el equipo.");return;}
   teamData=snap.data();render();
  },e=>inform(errText(e)));
  stopEvent=onSnapshot(eventRef(),snap=>{eventData=snap.exists()?snap.data():null;render();},e=>inform(errText(e)));
  render();
 }catch(e){
  $("app").innerHTML='<section class="card"><h2>No se pudo acceder al equipo</h2><p class="warn">'+esc(errText(e))+'</p><button id="retry">Abrir otro enlace</button></section>';
  $("retry").onclick=()=>{localStorage.removeItem(STORAGE);location.hash="";accessView();};
 }
}
function render(){
 if(!identity||!teamData)return;
 const t=teamData,n=t.step;
 let h='<section class="card"><small>Gincana UPEC · Equipo '+esc(t.team)+'</small><h2>'+esc(t.name)+'</h2><p><em>'+esc(t.slogan||"")+'</em></p><p>Estaciones completadas: <strong>'+n+' / 9</strong></p><div class="progress"><div style="width:'+(n/9*100)+'%"></div></div></section>';
 h+='<section class="card"><h2>QR del equipo</h2><p>Muestren este QR al facilitador de cada estación. El facilitador lo escanea desde su teléfono.</p><div class="qr-img qr-team" id="team-qr"></div><p class="small">Identificación: equipo '+esc(t.team)+'</p></section>';
 if(eventData?.status==="setup"||!eventData)h+='<section class="card"><h2>Preparación</h2><p>Su equipo está registrado. El recorrido comenzará cuando el organizador active el evento.</p></section>';
 else if(t.openedAt)h+='<section class="card"><h2 class="ok">¡Cofre abierto!</h2><p>Registro oficial: '+esc(datetime(t.openedAt))+'</p></section>';
 else if(n<9){
  const station=t.route[n],number=Number(station.slice(1));
  const done=Object.entries(t.completed||{}).length;
  h+='<section class="card"><small>MISIÓN '+(n+1)+' DE 9</small><h2>Diríjanse a '+esc(station)+'</h2><p><strong>'+esc(PLACES[number-1])+'</strong></p><p>'+esc(TITLES[number-1])+'</p><p>'+(t.inProgress?"Reto activado por el facilitador. Resuelvan el desafío y soliciten su comprobación.":"Al llegar, muestren su QR. El facilitador escaneará el código, explicará la prueba y registrará el inicio.")+'</p><p>Fragmentos obtenidos: '+done+'.</p></section>';
 }else if(!t.returned){
  h+='<section class="card"><h2>¡Nueve retos superados!</h2><p>Regresen a su estación inicial: <strong>'+esc(t.startKey)+' · '+esc(PLACES[Number(t.startKey.slice(1))-1])+'</strong>. Muestren el QR para que el facilitador confirme el retorno.</p></section>';
 }else{
  const visit=t.route,completed=t.completed||{};
  h+='<section class="card"><h2>El cofre de los nueve secretos</h2><p>Ordenen estos fragmentos por número de estación, desde E1 hasta E9, para formar un código de 18 dígitos.</p><div class="grid">'+visit.map(k=>'<div class="tile"><small>'+esc(k)+'</small><strong>'+esc(completed[k]?.fragment||"??")+'</strong></div>').join("")+'</div><label>Su propuesta de 18 dígitos</label><input id="attempt" inputmode="numeric" maxlength="18" pattern="[0-9]{18}" placeholder="000000000000000000"><button id="test-code">Comprobar combinación</button><p id="result" role="status"></p><p>Cuando la combinación sea correcta, preséntenla al facilitador de <strong>'+esc(t.startKey)+'</strong>. Solo ese facilitador registrará la apertura oficial.</p></section>';
 }
 if(eventData?.status==="finished"&&!t.openedAt)h+='<section class="card"><p class="warn">El evento ha finalizado. No se permiten nuevas validaciones.</p></section>';
 $("app").innerHTML=h;
 if(typeof QRCode!=="undefined")new QRCode($("team-qr"),{text:teamLink(identity.team,identity.token),width:210,height:210,correctLevel:QRCode.CorrectLevel.M});
 if($("test-code"))$("test-code").onclick=()=>{
  const entered=$("attempt").value.trim();
  const expected=Array.from({length:9},(_,i)=>completed["E"+(i+1)]?.fragment||"").join("");
  $("result").textContent=!/^[0-9]{18}$/.test(entered)?"Ingrese exactamente 18 dígitos.":entered===expected?"¡Combinación correcta! Presenten el código al facilitador para registrar el resultado.":"La combinación no es correcta. Revisen el orden E1–E9.";
 };
}
if(!firebaseConfigured)setupNotice();
else onAuthStateChanged(auth,async u=>{
 if(!u){try{await signInAnonymously(auth);}catch(e){$("app").innerHTML='<section class="card"><p class="warn">'+esc(errText(e))+'</p><p>Active el acceso anónimo en Firebase Authentication.</p></section>';}return;}
 await initTeam();
});
