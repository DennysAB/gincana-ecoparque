"use strict";
const {onCall,HttpsError}=require("firebase-functions/v2/https");
const {initializeApp}=require("firebase-admin/app");
const {getFirestore,Timestamp}=require("firebase-admin/firestore");
const {randomBytes,randomInt,createHash,timingSafeEqual}=require("node:crypto");

initializeApp();
const db=getFirestore();
const eventRef=db.collection("events").doc("current");
const staffRef=uid=>db.collection("staff").doc(uid);
const teamRef=id=>eventRef.collection("teams").doc(id);
const teamInviteRef=id=>eventRef.collection("teamInvites").doc(id);
const facInviteRef=station=>eventRef.collection("facInvites").doc(station);
const rewardRef=id=>eventRef.collection("rewards").doc(id);
const proofRef=(id,station)=>eventRef.collection("proofs").doc(id+"_"+station);
const TEAM_IDS="ABCDEFGHI".split("");
const STATIONS=Array.from({length:9},(_,i)=>"E"+(i+1));
const OPTIONS={region:"us-central1",maxInstances:10,timeoutSeconds:60};

const hash=s=>createHash("sha256").update(String(s)).digest("hex");
const token=()=>randomBytes(24).toString("hex");
const timestamp=()=>Timestamp.now();
const fail=(code,message)=>{throw new HttpsError(code,message);};
const requireAuth=r=>{if(!r.auth?.uid)fail("unauthenticated","Debe iniciar sesión.");return r.auth.uid;};
function requireAnon(r){
 const uid=requireAuth(r);
 if(r.auth.token.firebase?.sign_in_provider!=="anonymous")fail("permission-denied","Debe ingresar desde el dispositivo del equipo o del facilitador.");
 return uid;
}
async function requireLeader(r){
 const uid=requireAuth(r),snap=await staffRef(uid).get();
 if(!snap.exists||!["leader","admin"].includes(snap.data().role))fail("permission-denied","La cuenta no tiene permisos de líder.");
 if(r.auth.token.firebase?.sign_in_provider==="anonymous")fail("permission-denied","El líder debe utilizar una cuenta con contraseña.");
 return uid;
}
async function requireFacilitator(r){
 const uid=requireAnon(r),s=await staffRef(uid).get();
 if(!s.exists||s.data().role!=="facilitator"||!STATIONS.includes(s.data().station))
  fail("permission-denied","Este dispositivo no está vinculado a un facilitador.");
 return {uid,station:s.data().station};
}
function textValue(v,max,label,required=true){
 const s=String(v??"").trim().replace(/\s+/g," ");
 if((required&&!s)||s.length>max)fail("invalid-argument","Revise "+label+" (máximo "+max+" caracteres).");
 return s;
}
function assertId(id){if(!TEAM_IDS.includes(id))fail("invalid-argument","Equipo incorrecto.");return id;}
function assertStation(id){if(!STATIONS.includes(id))fail("invalid-argument","Estación incorrecta.");return id;}
function shuffle(items){
 const a=[...items];
 for(let i=a.length-1;i>0;i--){const j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]];}
 return a;
}
function checkToken(actual,received){
 if(!/^[0-9a-f]{48}$/.test(String(received??"")))return false;
 const a=Buffer.from(hash(received),"hex"),b=Buffer.from(hash(actual??""),"hex");
 return timingSafeEqual(a,b);
}
function checkPlan(raw){
 if(!Array.isArray(raw?.teams)||raw.teams.length!==9||!Array.isArray(raw?.facilitators)||raw.facilitators.length!==9)
  fail("invalid-argument","Se requieren exactamente nueve equipos y nueve facilitadores.");
 const teams=raw.teams.map((x,i)=>({
  id:TEAM_IDS[i],
  name:textValue(x.name,60,"nombre del equipo "+TEAM_IDS[i]),
  slogan:textValue(x.slogan,120,"eslogan",false)
 }));
 const facilitators=raw.facilitators.map((x,i)=>({
  station:STATIONS[i],
  name:textValue(x.name,60,"facilitador de "+STATIONS[i])
 }));
 return {teams,facilitators};
}
function codeFromCompleted(c){
 return STATIONS.map(s=>c?.[s]?.fragment??"").join("");
}
function callable(fn){
 return onCall(OPTIONS,async r=>{
  try{return await fn(r);}
  catch(e){
   if(e instanceof HttpsError)throw e;
   console.error("Error interno",e);
   throw new HttpsError("internal","No se pudo completar la operación. Intente nuevamente o avise al organizador.");
  }
 });
}

// El líder crea nueve enlaces de inscripción privada, nueve QR de facilitador
// y asignaciones iniciales distintas. No se publican tokens en GitHub.
exports.setupEvent=callable(async r=>{
 await requireLeader(r);
 const {teams,facilitators}=checkPlan(r.data);
 const shuffled=shuffle(STATIONS);
 const now=timestamp();
 await db.runTransaction(async tx=>{
  const ev=await tx.get(eventRef);
  if(ev.exists)fail("already-exists","El evento ya está configurado. Solo es posible editar nombres antes del inicio.");
  const reservations=Object.fromEntries(STATIONS.map(s=>[s,[]]));
  for(let i=0;i<9;i++)reservations[shuffled[i]]=[TEAM_IDS[i]];
  tx.create(eventRef,{title:"Gincana turística UPEC",venue:"Centro Deportivo UPEC",
    status:"setup",reservations,winner:null,createdAt:now,updatedAt:now});
  for(let i=0;i<9;i++){
   const t=teams[i],starting=shuffled[i],linkToken=token();
   tx.create(teamRef(t.id),{id:t.id,name:t.name,slogan:t.slogan,
     initial:starting,current:starting,completed:{},count:0,
     ownerUid:null,joinedAt:null,chestAt:null,codeEntered:null,
     createdAt:now,updatedAt:now});
   tx.create(teamInviteRef(t.id),{id:t.id,token:linkToken,claimedUid:null,createdAt:now});
   tx.create(rewardRef(t.id),{fragments:Object.fromEntries(STATIONS.map(s=>[s,String(randomInt(100)).padStart(2,"0")]))});
   const st=facilitators[i],facToken=token();
   tx.create(facInviteRef(st.station),{station:st.station,name:st.name,token:facToken,
     claimedUid:null,createdAt:now});
  }
 });
 return {ok:true};
});

// Corrección de nombres sin modificar los QR, las estaciones ni el avance.
exports.editSetup=callable(async r=>{
 await requireLeader(r);
 const {teams,facilitators}=checkPlan(r.data);
 await db.runTransaction(async tx=>{
  const refs=[eventRef,...TEAM_IDS.map(teamRef),...STATIONS.map(facInviteRef)];
  const snaps=await tx.getAll(...refs);
  if(!snaps[0].exists||snaps[0].data().status!=="setup")fail("failed-precondition","Solo puede editar antes de iniciar.");
  if(snaps.slice(1).some(s=>!s.exists))fail("failed-precondition","La configuración está incompleta.");
  for(let i=0;i<9;i++){
   tx.update(refs[1+i],{name:teams[i].name,slogan:teams[i].slogan,updatedAt:timestamp()});
   tx.update(refs[10+i],{name:facilitators[i].name});
   const claimed=snaps[10+i].data().claimedUid;
   if(claimed)tx.update(staffRef(claimed),{name:facilitators[i].name});
  }
 });
 return {ok:true};
});

// Al instalar la PWA, el equipo escanea su enlace individual e ingresa
// mediante autenticación anónima. Durante la preparación puede migrarse
// de Safari a la app instalada sin perder el QR.
exports.joinTeam=callable(async r=>{
 const uid=requireAnon(r),id=assertId(r.data?.team);
 const provided=r.data?.token;
 await db.runTransaction(async tx=>{
  const [ev,team,invite]=await tx.getAll(eventRef,teamRef(id),teamInviteRef(id));
  if(!ev.exists||!team.exists||!invite.exists)fail("not-found","Equipo no registrado.");
  if(!checkToken(invite.data().token,provided))fail("permission-denied","El QR del equipo no es válido.");
  if(ev.data().status==="finished")fail("failed-precondition","El evento terminó.");
  const prior=team.data().ownerUid;
  if(prior&&prior!==uid&&ev.data().status!=="setup")
    fail("failed-precondition","El equipo ya está vinculado a otro teléfono. Solicite ayuda al líder.");
  tx.update(teamRef(id),{ownerUid:uid,joinedAt:timestamp(),updatedAt:timestamp()});
  tx.update(teamInviteRef(id),{claimedUid:uid});
 });
 return {team:id};
});

// QR de invitación de facilitador: la aplicación se vincula automáticamente
// a una sola estación. También admite migración antes de iniciar la actividad.
exports.joinFacilitator=callable(async r=>{
 const uid=requireAnon(r),station=assertStation(r.data?.station);
 await db.runTransaction(async tx=>{
  const [ev,inv,currentStaff]=await tx.getAll(eventRef,facInviteRef(station),staffRef(uid));
  if(!ev.exists||!inv.exists)fail("not-found","Invitación no encontrada.");
  if(!checkToken(inv.data().token,r.data?.token))fail("permission-denied","QR del facilitador inválido.");
  if(ev.data().status==="finished")fail("failed-precondition","El evento ha terminado.");
  const prior=inv.data().claimedUid;
  if(currentStaff.exists && (currentStaff.data().role!=="facilitator"||currentStaff.data().station!==station))
    fail("permission-denied","Este dispositivo ya está asignado a otro rol o estación.");
  if(prior&&prior!==uid&&ev.data().status!=="setup")fail("failed-precondition","Esta estación ya tiene facilitador.");
  if(prior&&prior!==uid)tx.delete(staffRef(prior));
  tx.set(staffRef(uid),{role:"facilitator",station,name:inv.data().name,
    joinedAt:timestamp(),updatedAt:timestamp()},{merge:true});
  tx.update(facInviteRef(station),{claimedUid:uid});
 });
 return {station};
});

// Exige los 18 dispositivos inscritos. Las nueve estaciones iniciales ya
// están reservadas en setupEvent, antes de comenzar.
exports.startEvent=callable(async r=>{
 await requireLeader(r);
 await db.runTransaction(async tx=>{
  const refs=[eventRef,...TEAM_IDS.map(teamRef),...STATIONS.map(facInviteRef)];
  const docs=await tx.getAll(...refs);
  if(!docs[0].exists||docs[0].data().status!=="setup")fail("failed-precondition","Evento no preparado o ya iniciado.");
  const missingTeams=docs.slice(1,10).filter(s=>!s.exists||!s.data().ownerUid);
  const missingFacs=docs.slice(10,19).filter(s=>!s.exists||!s.data().claimedUid);
  if(missingTeams.length||missingFacs.length)
   fail("failed-precondition","Deben inscribirse los nueve equipos y los nueve facilitadores antes de iniciar.");
  tx.update(eventRef,{status:"live",startedAt:timestamp(),updatedAt:timestamp()});
 });
 return {ok:true};
});

// Tras comprobar físicamente la misión, el facilitador genera un QR único,
// específico para ese equipo y estación. El QR expira a los 30 minutos.
exports.issueProof=callable(async r=>{
 const {uid,station}=await requireFacilitator(r),id=assertId(r.data?.team);
 const raw=token(),now=timestamp(),until=Timestamp.fromMillis(Date.now()+30*60*1000);
 await db.runTransaction(async tx=>{
  const [ev,team]=await tx.getAll(eventRef,teamRef(id));
  if(!ev.exists||ev.data().status!=="live")fail("failed-precondition","La gincana no está activa.");
  if(!team.exists||!team.data().ownerUid||team.data().current!==station||team.data().completed?.[station])
   fail("failed-precondition","Este equipo no tiene habilitada esta estación o ya la completó.");
  tx.set(proofRef(id,station),{id,station,hash:hash(raw),issuedBy:uid,
    issuedAt:now,expiresAt:until,usedAt:null});
 });
 return {team:id,station,token:raw,expiresAt:until.toMillis()};
});

// La confirmación del QR, la entrega de los dos dígitos y la reserva
// de la siguiente estación ocurren en una única transacción Firestore.
// Si no existe estación libre pendiente, elige aleatoriamente una de
// menor ocupación. Puede coincidir con otro equipo cuando sea inevitable.
exports.redeemProof=callable(async r=>{
 const uid=requireAnon(r),id=assertId(r.data?.team),station=assertStation(r.data?.station);
 const raw=r.data?.token;
 if(!/^[0-9a-f]{48}$/.test(String(raw??"")))fail("invalid-argument","QR de validación incompleto.");
 return await db.runTransaction(async tx=>{
  const refs=[eventRef,teamRef(id),rewardRef(id),proofRef(id,station)];
  const [ev,team,rewards,proof]=await tx.getAll(...refs);
  if(!ev.exists||ev.data().status!=="live")fail("failed-precondition","La gincana no está activa.");
  if(!team.exists||team.data().ownerUid!==uid)fail("permission-denied","Este teléfono no pertenece al equipo.");
  const td=team.data();
  if(td.current!==station||td.completed?.[station])fail("failed-precondition","La estación ya se completó o no corresponde.");
  if(!proof.exists||proof.data().usedAt||proof.data().station!==station||proof.data().id!==id||
    proof.data().expiresAt.toMillis()<Date.now()||proof.data().hash!==hash(raw))
    fail("permission-denied","El QR es incorrecto, caducó o ya fue utilizado.");
  if(!rewards.exists)fail("failed-precondition","Faltan recompensas del equipo.");
  const fragment=rewards.data().fragments?.[station];
  if(!/^[0-9]{2}$/.test(fragment||""))fail("internal","Fragmento inválido.");
  const completed={...(td.completed||{}),[station]:{fragment,at:timestamp()}};
  const count=Object.keys(completed).length;
  const reservations=Object.fromEntries(STATIONS.map(s=>[s,[...(ev.data().reservations?.[s]||[])] ]));
  for(const s of STATIONS)reservations[s]=reservations[s].filter(t=>t!==id);
  let next=null;
  if(count<9){
   const candidates=STATIONS.filter(s=>!completed[s]);
   const load=Math.min(...candidates.map(s=>reservations[s].length));
   const choices=candidates.filter(s=>reservations[s].length===load);
   next=choices[randomInt(choices.length)];
   reservations[next].push(id);
  }
  const now=timestamp();
  tx.update(teamRef(id),{completed,count,current:next,updatedAt:now});
  tx.update(eventRef,{reservations,updatedAt:now});
  tx.update(proofRef(id,station),{usedAt:now,redeemedBy:uid});
  return {station,fragment,next,count};
 });
});

// El código se compone en orden E1..E9; no depende del recorrido aleatorio.
// Dos equipos que abran simultáneamente compiten por el mismo documento del
// evento, por lo que solo uno puede convertirse en ganador.
exports.openChest=callable(async r=>{
 const uid=requireAnon(r),id=assertId(r.data?.team);
 const entered=String(r.data?.code??"").trim();
 if(!/^[0-9]{18}$/.test(entered))fail("invalid-argument","Introduzca exactamente 18 dígitos.");
 return await db.runTransaction(async tx=>{
  const [ev,team]=await tx.getAll(eventRef,teamRef(id));
  if(!ev.exists||ev.data().status!=="live")fail("failed-precondition","El evento no está activo.");
  if(!team.exists||team.data().ownerUid!==uid)fail("permission-denied","Este teléfono no corresponde al equipo.");
  const t=team.data();
  if(t.count!==9||t.current!==null)fail("failed-precondition","Faltan estaciones.");
  if(entered!==codeFromCompleted(t.completed))fail("invalid-argument","El código del cofre no es correcto.");
  if(t.chestAt)return {ok:true,winner:ev.data().winner?.team===id,alreadyOpened:true};
  const now=timestamp(),winner=ev.data().winner;
  tx.update(teamRef(id),{chestAt:now,codeEntered:entered,updatedAt:now});
  if(!winner)tx.update(eventRef,{winner:{team:id,name:t.name,at:now},updatedAt:now});
  return {ok:true,winner:!winner||winner.team===id};
 });
});

exports.finishEvent=callable(async r=>{
 await requireLeader(r);
 await db.runTransaction(async tx=>{
  const snap=await tx.get(eventRef);
  if(!snap.exists||snap.data().status!=="live")fail("failed-precondition","El evento no está en desarrollo.");
  tx.update(eventRef,{status:"finished",finishedAt:timestamp(),updatedAt:timestamp()});
 });
 return {ok:true};
});
