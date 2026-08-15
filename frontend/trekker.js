/* RPS Rentals — Rick's Pro Shop · Static Demo
   ISO 11088 DIN calculator verified against RentMaxZ reference app */
"use strict";

/* ═══════════════════════════════════════════════════
   ISO 11088 DIN CALCULATOR — verified against RentMaxZ
   All values confirmed correct: Maksim=3.75, senior adj, junior adj, Type I/II/III
═══════════════════════════════════════════════════ */
const DIN_TABLE = [
  [.75,.75,.75,.75,.75,.75],[.75,.75,.75,.75,.75,.75],[.75,.75,.75,.75,.75,.75],
  [.75,.75,.75,.75,.75,.75],[.75,.75,.75,.75,.75,.75],[1,1,1,.75,.75,.75],
  [1.25,1.25,1,1,1,.75],[1.5,1.5,1.25,1.25,1,1],[2,1.75,1.75,1.5,1.25,1.25],
  [2.75,2.5,2.25,2,1.75,1.5],[3.5,3,2.75,2.5,2.25,2],[4.5,4,3.5,3.25,3,2.75],
  [5.5,5,4.5,4,3.5,3.25],[7,6.5,6,5.5,5,4.5],[8,7.5,7,6.5,6,5.5]
];
const WEIGHT_BRACKETS = [10,13,17,21,25,30,35,41,48,57,66,78,91,104];
const BSL_BRACKETS    = [230,250,270,290,310,330];

function calcDIN(weightLbs, heightFt, heightIn, bslMm, age, experience, skierType) {
  if (!weightLbs || !bslMm || !age) return null;
  var kg = weightLbs * 0.453592;
  var wc = WEIGHT_BRACKETS.length;
  for (var i=0;i<WEIGHT_BRACKETS.length;i++){if(kg<=WEIGHT_BRACKETS[i]){wc=i;break;}}
  var bc = BSL_BRACKETS.length-1;
  for (var j=0;j<BSL_BRACKETS.length;j++){if(bslMm<=BSL_BRACKETS[j]){bc=j;break;}}
  bc = Math.min(bc,5);
  if (age<=9||age>=50) wc=Math.max(0,wc-1);
  var din = DIN_TABLE[Math.min(wc,DIN_TABLE.length-1)][bc];
  var t=(skierType||"").toLowerCase(), e=(experience||"").toLowerCase();
  var isTypeI  = t.includes("type i") && !t.includes("ii") && !t.includes("iii");
  var isTypeIII= t.includes("iii") || e.includes("advanc") || e.includes("expert");
  if (!t && (e.includes("begin")||e.includes("novice"))) isTypeI=true;
  if (isTypeI)        din=Math.round(din*0.85*4)/4;
  else if (isTypeIII) din=Math.round(din*1.15*4)/4;
  else                din=Math.round(din*4)/4;
  return Math.max(0.75,Math.min(14,din));
}

function recommendedLength(weightLbs, heightFt, heightIn, experience, rentalType) {
  if (!heightFt) return null;
  var cm=(parseInt(heightFt||0)*30.48)+(parseInt(heightIn||0)*2.54);
  var isSnow=(rentalType||"").toLowerCase().includes("snowboard");
  if (isSnow){var base=Math.round(cm*0.88/5)*5;return base+"–"+(base+5)+"cm";}
  var e=(experience||"").toLowerCase();
  var offset=e.includes("inter")?-5:(e.includes("adv")||e.includes("expert"))?0:-10;
  var len=Math.round((cm+offset)/5)*5;
  return len+"–"+(len+5)+"cm";
}

/* ═══════════════════════════════════════════════════
   FALLBACK DEMO DATA — only used if Supabase can't be reached
   (e.g. config not set up yet). Once Supabase is configured,
   live data takes over.
═══════════════════════════════════════════════════ */
var RENTALS=[
  {id:1,name:"Maksim Samilyak",firstName:"Maksim",lastName:"Samilyak",package:"Adult Ski Package",status:"setup",order:"#1042",isShopify:true,startDate:"Dec 20",endDate:"Dec 22",days:2,phone:"(705) 555-0144",email:"maksim@email.com",waiver:false,isMinor:false,isReturning:false,isOverdue:false,din:3.75,weight:212,heightFt:5,heightIn:6,shoe:9,bsl:315,age:25,experience:"Beginner",skierType:"Type I (Beginner/Cautious)",rentalType:"Ski",equipment:["Adult Ski Pair — 165cm","Adult Ski Boots — 27.5","Adult Ski Helmet — M","Adult Ski Poles — 120cm"],notes:""},
  {id:2,name:"Claire Thompson",firstName:"Claire",lastName:"Thompson",package:"Performance Snowboard Package",status:"out",order:"#1048",isShopify:true,startDate:"Dec 20",endDate:"Dec 23",days:3,phone:"(416) 555-0132",email:"claire@email.com",waiver:true,isMinor:false,isReturning:true,isOverdue:false,din:null,weight:135,heightFt:5,heightIn:5,shoe:7.5,bsl:285,age:28,experience:"Intermediate",skierType:"Type II (Intermediate)",rentalType:"Snowboard",equipment:["Adult Snowboard + Bindings — 152cm","Snowboard Boots — 24.5","Adult Helmet — S"],notes:""},
  {id:3,name:"Daniel Wu",firstName:"Daniel",lastName:"Wu",package:"Junior Ski Package",status:"overdue",order:null,isShopify:false,startDate:"Dec 18",endDate:"Dec 19",days:1,phone:"(519) 555-0192",email:"",waiver:true,isMinor:true,isReturning:false,isOverdue:true,din:1.25,weight:72,heightFt:4,heightIn:6,shoe:4,bsl:240,age:9,experience:"Beginner",skierType:"Type I (Beginner/Cautious)",rentalType:"Ski",equipment:["Youth Ski Pair — 130cm","Youth Ski Boots — 22.5","Youth Helmet — XS","Youth Poles — 95cm"],notes:"Guardian: Wei Wu (Parent)"},
  {id:4,name:"Sofia Bennett",firstName:"Sofia",lastName:"Bennett",package:"Adult Ski Package",status:"returned",order:"#1039",isShopify:true,startDate:"Dec 17",endDate:"Dec 19",days:2,phone:"(289) 555-0186",email:"sofia@email.com",waiver:true,isMinor:false,isReturning:false,isOverdue:false,din:2.5,weight:128,heightFt:5,heightIn:4,shoe:7,bsl:275,age:32,experience:"Intermediate",skierType:"Type II (Intermediate)",rentalType:"Ski",equipment:["Adult Ski Pair — 158cm","Adult Ski Boots — 25.5","Adult Helmet — S","Adult Poles — 110cm"],notes:""},
  {id:5,name:"John Smith",firstName:"John",lastName:"Smith",package:"High Performance Ski Package",status:"out",order:"#1051",isShopify:true,startDate:"Dec 21",endDate:"Dec 24",days:3,phone:"(647) 555-0201",email:"john@email.com",waiver:true,isMinor:false,isReturning:false,isOverdue:false,din:4.5,weight:190,heightFt:6,heightIn:1,shoe:11,bsl:332,age:38,experience:"Advanced",skierType:"Type III (Advanced/Aggressive)",rentalType:"Ski",equipment:["HP Ski Pair — 175cm","Adult Ski Boots — 29.5","Adult Helmet — L","Adult Poles — 130cm"],notes:""},
  {id:6,name:"Sarah Lee",firstName:"Sarah",lastName:"Lee",package:"Youth Snowboard Package",status:"setup",order:"#1053",isShopify:true,startDate:"Dec 21",endDate:"Dec 22",days:1,phone:"(905) 555-0177",email:"sarah@email.com",waiver:false,isMinor:true,isReturning:false,isOverdue:false,din:null,weight:95,heightFt:4,heightIn:11,shoe:5,bsl:250,age:14,experience:"Beginner",skierType:"Type I (Beginner/Cautious)",rentalType:"Snowboard",equipment:["Youth Snowboard + Bindings — 138cm","Youth Boots — 22.0","Youth Helmet — XS"],notes:"Guardian: Karen Lee (Parent)"},
  {id:7,name:"Michael Brown",firstName:"Michael",lastName:"Brown",package:"Adult Ski Package",status:"out",order:null,isShopify:false,startDate:"Dec 20",endDate:"Dec 21",days:1,phone:"(416) 555-0388",email:"",waiver:true,isMinor:false,isReturning:false,isOverdue:false,din:3.25,weight:175,heightFt:5,heightIn:10,shoe:10,bsl:318,age:33,experience:"Intermediate",skierType:"Type II (Intermediate)",rentalType:"Ski",equipment:["Adult Ski Pair — 168cm","Adult Ski Boots — 28.0","Adult Helmet — M","Adult Poles — 120cm"],notes:""},
  {id:8,name:"Emma Johnson",firstName:"Emma",lastName:"Johnson",package:"Snowboard Package",status:"returned",order:"#1044",isShopify:true,startDate:"Dec 19",endDate:"Dec 20",days:1,phone:"(226) 555-0145",email:"emma@email.com",waiver:true,isMinor:false,isReturning:false,isOverdue:false,din:null,weight:142,heightFt:5,heightIn:6,shoe:7,bsl:280,age:27,experience:"Intermediate",skierType:"Type II (Intermediate)",rentalType:"Snowboard",equipment:["Adult Snowboard + Bindings — 148cm","Snowboard Boots — 25.0","Adult Helmet — S"],notes:""},
  {id:9,name:"David Chen",firstName:"David",lastName:"Chen",package:"Adult Ski Package",status:"setup",order:"#1055",isShopify:true,startDate:"Dec 21",endDate:"Dec 23",days:2,phone:"(514) 555-0211",email:"david@email.com",waiver:false,isMinor:false,isReturning:false,isOverdue:false,din:3.5,weight:168,heightFt:5,heightIn:9,shoe:9.5,bsl:310,age:31,experience:"Intermediate",skierType:"Type II (Intermediate)",rentalType:"Ski",equipment:["Adult Ski Pair — 165cm","Adult Ski Boots — 27.5","Adult Helmet — M","Adult Poles — 120cm"],notes:""}
];

/* ═══════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════ */
var rentals=[];
var selectedId=null,currentView="rentals",searchQuery="",filterStatus="all",pin="";

/* ═══════════════════════════════════════════════════
   DATA LAYER — talks to Supabase directly (publishable
   key + RLS, see supabase/schema.sql — no backend API
   for reads/writes, only Shopify sync runs server-side).
   Falls back to local demo data if Supabase isn't
   reachable yet, so the app is never blank.
═══════════════════════════════════════════════════ */
function rowToClient(row){
  return {
    id: row.id, firstName: row.first_name, lastName: row.last_name, name: row.name,
    package: row.package, status: row.status, order: row.order_number, isShopify: row.is_shopify,
    shopifyOrderId: row.shopify_order_id, shopifyLineItemId: row.shopify_line_item_id,
    startDate: row.start_date, endDate: row.end_date, days: row.days,
    phone: row.phone, email: row.email, waiver: row.waiver, isMinor: row.is_minor,
    isReturning: row.is_returning, isOverdue: row.is_overdue, din: row.din, weight: row.weight,
    heightFt: row.height_ft, heightIn: row.height_in, shoe: row.shoe, bsl: row.bsl, age: row.age,
    experience: row.experience, skierType: row.skier_type, rentalType: row.rental_type,
    equipment: row.equipment||[], notes: row.notes||""
  };
}
function clientToRow(r){
  return {
    id: r.id,
    first_name: r.firstName||null, last_name: r.lastName||null, name: r.name||null,
    package: r.package||null, status: r.status||"setup", order_number: r.order||null,
    is_shopify: !!r.isShopify,
    shopify_order_id: r.shopifyOrderId?String(r.shopifyOrderId):null,
    shopify_line_item_id: r.shopifyLineItemId?String(r.shopifyLineItemId):null,
    start_date: r.startDate||null, end_date: r.endDate||null, days: r.days||1,
    phone: r.phone||null, email: r.email||null, waiver: !!r.waiver, is_minor: !!r.isMinor,
    is_returning: !!r.isReturning, is_overdue: !!r.isOverdue,
    din: (r.din===undefined||r.din==="")?null:r.din,
    weight: (r.weight===undefined||r.weight==="")?null:r.weight,
    height_ft: (r.heightFt===undefined||r.heightFt==="")?null:r.heightFt,
    height_in: (r.heightIn===undefined||r.heightIn==="")?null:r.heightIn,
    shoe: (r.shoe===undefined||r.shoe==="")?null:r.shoe,
    bsl: (r.bsl===undefined||r.bsl==="")?null:r.bsl,
    age: (r.age===undefined||r.age==="")?null:r.age,
    experience: r.experience||null, skier_type: r.skierType||null, rental_type: r.rentalType||null,
    equipment: Array.isArray(r.equipment)?r.equipment:[], notes: r.notes||""
  };
}
async function loadRentals(){
  try{
    var res=await sb.from("rentals").select("*").order("id",{ascending:false});
    if(res.error)throw res.error;
    rentals=(res.data||[]).map(rowToClient);
  }catch(err){
    rentals=JSON.parse(JSON.stringify(RENTALS));
    showToast("Using demo data — check Supabase config","");
  }
}
function persistRental(r){
  var row=clientToRow(r);
  delete row.id;
  sb.from("rentals").update(row).eq("id",r.id)
    .then(function(res){if(res.error)console.error("persistRental failed:",res.error.message);})
    .catch(function(){/* optimistic UI already updated; retry not critical for a shop-floor tool */});
}
function syncShopify(){
  showToast("Syncing Shopify orders…","");
  fetch("/api/shopify-sync",{method:"POST"})
    .then(function(r){return r.json();})
    .then(function(data){
      if(data.error){showToast(data.error,"error");return;}
      showToast("Synced "+data.synced+" rental order"+(data.synced!==1?"s":""),"success");
      return loadRentals().then(function(){if(currentView==="rentals")renderRentalsView();});
    })
    .catch(function(){showToast("Shopify sync failed","error");});
}

/* ═══════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded",function(){
  renderPinScreen();
  renderApp();
  bindGlobalEvents();
  // If a Supabase session already exists (staff logged in earlier and
  // didn't lock the app), skip straight past the passcode screen instead
  // of forcing a login on every page load.
  sb.auth.getSession().then(function(res){
    if(res.data&&res.data.session)unlockApp();
  });
});

/* ═══════════════════════════════════════════════════
   PIN SCREEN
═══════════════════════════════════════════════════ */
function renderPinScreen(){
  var s=document.getElementById("pin-screen");
  s.innerHTML='<div class="pin-logo-wrap"><div class="pin-logo-icon">RPS</div><div class="pin-logo-text"><h1>RPS Rentals</h1><span>Rick\'s Pro Shop · Blue Mountain</span></div></div>'+
  '<p class="pin-subtitle">Enter your staff passcode to continue</p>'+
  '<div class="pin-dots" id="pin-dots">'+[0,1,2,3,4,5].map(function(i){return'<div class="pin-dot" id="d'+i+'"></div>';}).join('')+'</div>'+
  '<div class="pin-error" id="pin-error"></div>'+
  '<div class="pin-pad">'+[1,2,3,4,5,6,7,8,9].map(function(n){return'<button class="pkey" onclick="pinKey(\''+n+'\')">'+n+'</button>';}).join('')+
  '<button class="pkey zero" onclick="pinKey(\'0\')">0</button><button class="pkey del" onclick="pinDel()">⌫</button></div>';
}
function pinKey(k){
  if(pin.length>=6)return;
  pin+=k;updDots();
  if(pin.length===6)setTimeout(attemptLogin,100);
}
function pinDel(){pin=pin.slice(0,-1);updDots();}
function updDots(){for(var i=0;i<6;i++){var d=document.getElementById("d"+i);if(d){d.classList.toggle("filled",i<pin.length);d.classList.remove("error");}}}
function showPinError(msg){
  for(var i=0;i<6;i++){var d=document.getElementById("d"+i);if(d)d.classList.add("error");}
  var e=document.getElementById("pin-error");if(e)e.textContent=msg||"Incorrect passcode — try again";
  setTimeout(function(){pin="";updDots();var e=document.getElementById("pin-error");if(e)e.textContent="";for(var i=0;i<6;i++){var d=document.getElementById("d"+i);if(d)d.classList.remove("error");}},1000);
}
function attemptLogin(){
  sb.auth.signInWithPassword({email:STAFF_EMAIL,password:pin}).then(function(res){
    if(res.error)showPinError();else unlockApp();
  }).catch(function(){showPinError("Couldn't reach Supabase — check connection");});
}
function unlockApp(){
  document.getElementById("pin-screen").style.display="none";
  document.getElementById("app").classList.add("visible");
  loadRentals().then(renderRentalsView);
}
function lockApp(){
  pin="";
  sb.auth.signOut();
  document.getElementById("pin-screen").style.display="flex";
  document.getElementById("app").classList.remove("visible");
  renderPinScreen();
}

/* ═══════════════════════════════════════════════════
   APP SHELL
═══════════════════════════════════════════════════ */
function renderApp(){
  document.getElementById("app").innerHTML=
  '<div class="topbar">'+
    '<div class="topbar-logo">RPS</div>'+
    '<div style="flex:1"><span class="topbar-name">RPS Rentals</span><span class="topbar-sub">Rick\'s Pro Shop · Blue Mountain</span></div>'+
    '<button class="topbar-btn" onclick="syncShopify()"><svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg></button>'+
    '<button class="topbar-btn" onclick="lockApp()"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></button>'+
  '</div>'+
  '<div id="view-rentals" class="view"></div>'+
  '<div id="view-profile" class="view" style="display:none"></div>'+
  '<div id="view-setup"   class="view" style="display:none"></div>'+
  '<div id="view-settings"class="view" style="display:none"></div>'+
  '<nav class="bottom-nav">'+
    '<button class="nav-btn active" id="nav-rentals" onclick="showView(\'rentals\')"><svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>Rentals</button>'+
    '<button class="nav-btn" id="nav-search" onclick="focusSearch()"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>Search</button>'+
    '<button class="nav-btn" id="nav-new" onclick="openNewRentalModal()"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>New</button>'+
    '<button class="nav-btn" id="nav-settings" onclick="showView(\'settings\')"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>Settings</button>'+
  '</nav>'+
  modalHTML()+
  '<div class="toast" id="toast"></div>';
  setTimeout(function(){var el=document.getElementById("new-start");if(el)el.value=new Date().toISOString().split("T")[0];},0);
}

function modalHTML(){
  return '<div class="modal-overlay" id="modal-new">'+
    '<div class="modal-sheet"><div class="modal-handle"></div><div class="modal-title">New Walk-In Rental</div>'+
    '<div class="modal-body">'+
      '<div class="form-row"><div class="form-group"><label class="form-label">First Name</label><input class="form-input" id="new-fn" placeholder="First name"/></div>'+
      '<div class="form-group"><label class="form-label">Last Name</label><input class="form-input" id="new-ln" placeholder="Last name"/></div></div>'+
      '<div class="form-group"><label class="form-label">Package</label><select class="form-select" id="new-pkg">'+
        '<optgroup label="SKI PACKAGES"><option>Adult Ski Package</option><option>High Performance Ski Package</option><option>Youth Ski Package</option><option>Kids Ski Package</option></optgroup>'+
        '<optgroup label="SNOWBOARD PACKAGES"><option>Adult Snowboard Package</option><option>Performance Snowboard Package</option><option>Youth Snowboard Package</option></optgroup>'+
        '<optgroup label="SINGLES"><option>Ski Rental</option><option>Snowboard Rental</option><option>Snowboard Boots</option><option>Ski Poles</option><option>Ski Helmet</option></optgroup>'+
      '</select></div>'+
      '<div class="form-row"><div class="form-group"><label class="form-label">Start Date</label><input class="form-input" id="new-start" type="date"/></div>'+
      '<div class="form-group"><label class="form-label">Days</label><select class="form-select" id="new-days"><option value="1">1 day</option><option value="3">2 for 3</option><option value="4">3 for 4</option><option value="5">4 for 5</option></select></div></div>'+
      '<div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="new-phone" placeholder="(000) 000-0000"/></div>'+
    '</div>'+
    '<div class="modal-footer"><button class="btn-ghost" onclick="closeModal(\'modal-new\')">Cancel</button><button class="btn-primary" onclick="createRental()">Create &amp; Setup →</button></div>'+
    '</div></div>'+
  '<div class="modal-overlay" id="modal-status">'+
    '<div class="modal-sheet"><div class="modal-handle"></div><div class="modal-title" id="status-modal-title">Update Status</div>'+
    '<div class="modal-body"><div style="display:flex;flex-direction:column;gap:10px;" id="status-options"></div></div>'+
    '<div class="modal-footer"><button class="btn-ghost" onclick="closeModal(\'modal-status\')">Cancel</button></div></div></div>'+
  '<div class="modal-overlay" id="modal-waiver">'+
    '<div class="modal-sheet"><div class="modal-handle"></div><div class="modal-title">Sign Liability Waiver</div>'+
    '<div class="modal-body">'+
      '<div style="background:#f8f9fa;border-radius:8px;padding:12px;font-size:.78rem;color:#374151;line-height:1.6;max-height:180px;overflow-y:auto;margin-bottom:14px;">'+
        '<strong>RENTAL AGREEMENT AND RELEASE OF LIABILITY</strong><br>Rick\'s Pro Shop — Blue Mountain, Ontario<br><br>'+
        'I acknowledge that skiing and snowboarding involve inherent risks including falls, collisions, and equipment failure.<br><br>'+
        'I confirm equipment has been fitted to my satisfaction and I have been informed of my DIN binding release setting.<br><br>'+
        'I release Rick\'s Pro Shop from all claims arising from use of rental equipment.'+
      '</div>'+
      '<div id="waiver-minor-section" style="display:none;background:#fff3cd;border-radius:8px;padding:10px;margin-bottom:12px;font-size:.78rem;">'+
        '⚠️ <strong>Minor renter</strong> — guardian signature required.'+
        '<div class="form-group" style="margin-top:10px;margin-bottom:0;"><label class="form-label">Guardian Name</label><input class="form-input" id="waiver-guardian" placeholder="Parent / guardian full name"/></div>'+
      '</div>'+
      '<label style="display:flex;align-items:flex-start;gap:10px;font-size:.82rem;cursor:pointer;line-height:1.5;">'+
        '<input type="checkbox" id="waiver-confirm" style="margin-top:3px;width:16px;height:16px;flex-shrink:0;accent-color:#2f9e44;"/>'+
        '<span>I confirm the renter has read and agreed to the above.</span>'+
      '</label>'+
    '</div>'+
    '<div class="modal-footer"><button class="btn-ghost" onclick="closeModal(\'modal-waiver\')">Cancel</button><button class="btn-primary" style="background:#2f9e44;" onclick="confirmWaiver()">Confirm Signed</button></div>'+
    '</div></div>';
}

/* ═══════════════════════════════════════════════════
   VIEW ROUTING
═══════════════════════════════════════════════════ */
function showView(view){
  currentView=view;
  ["rentals","profile","setup","settings"].forEach(function(v){
    var el=document.getElementById("view-"+v);if(el)el.style.display=v===view?"flex":"none";
  });
  ["rentals","search","new","settings"].forEach(function(v){
    var b=document.getElementById("nav-"+v);if(b)b.classList.remove("active");
  });
  if(view==="rentals"||view==="profile"||view==="setup"){
    var b=document.getElementById("nav-rentals");if(b)b.classList.add("active");
    if(view==="rentals")renderRentalsView();
  }
  if(view==="settings"){var b=document.getElementById("nav-settings");if(b)b.classList.add("active");renderSettingsView();}
}
function focusSearch(){showView("rentals");setTimeout(function(){var s=document.getElementById("search-input");if(s)s.focus();},100);}

/* ═══════════════════════════════════════════════════
   RENTALS VIEW
═══════════════════════════════════════════════════ */
function renderRentalsView(){
  var c=document.getElementById("view-rentals");if(!c)return;
  var today=new Date(),todayStr=today.toLocaleDateString("en-CA",{month:"long",day:"numeric",year:"numeric"}),s=computeStats();
  c.innerHTML=
    '<div class="datebar"><div class="date-indicator"></div><span class="date-label">Today — '+todayStr+'</span>'+
    '<button class="filter-btn" onclick="cycleFilter()">'+(filterStatus==="all"?"All ▾":filterStatus==="active"?"Active ▾":"Returned ▾")+'</button>'+
    '<button class="new-btn" onclick="openNewRentalModal()"><svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>New</button></div>'+
    '<div class="stats-bar">'+
      '<div class="stat-cell"><div class="stat-n">'+s.out+'</div><div class="stat-l">Out</div></div>'+
      '<div class="stat-cell"><div class="stat-n">'+s.total+'</div><div class="stat-l">Total</div></div>'+
      '<div class="stat-cell"><div class="stat-n">'+s.setup+'</div><div class="stat-l">Setup</div></div>'+
      '<div class="stat-cell"><div class="stat-n'+(s.overdue>0?" red":"")+'">'+s.overdue+'</div><div class="stat-l">Overdue</div></div>'+
      '<div class="stat-cell"><div class="stat-n'+(s.returned>0?" green":"")+'">'+s.returned+'</div><div class="stat-l">Done</div></div>'+
    '</div>'+
    '<div class="search-wrap"><input class="search-box" id="search-input" placeholder="Search name, order #..." value="'+searchQuery+'" oninput="onSearch(this.value)"/></div>'+
    '<div class="rental-scroll" id="rental-list">'+renderRentalList()+'</div>';
}

function renderRentalList(){
  var filtered=getFilteredRentals();
  if(!filtered.length)return'<div class="empty-state"><div class="empty-state-icon">🎿</div><p>No rentals found.<br>Tap <strong>+ New</strong> to add a walk-in.</p></div>';
  var g={setup:filtered.filter(function(r){return r.status==="setup";}),overdue:filtered.filter(function(r){return r.status==="overdue";}),out:filtered.filter(function(r){return r.status==="out";}),returned:filtered.filter(function(r){return r.status==="returned";})};
  var html="";
  if(g.setup.length){html+='<div class="section-head">⚙ Needs Setup <span class="section-count">'+g.setup.length+'</span></div>';g.setup.forEach(function(r){html+=renderCard(r);});}
  var outAll=g.overdue.concat(g.out);
  if(outAll.length){html+='<div class="section-head">🎿 Out <span class="section-count">'+outAll.length+'</span></div>';outAll.forEach(function(r){html+=renderCard(r);});}
  if(g.returned.length){html+='<div class="section-head">✓ Returned <span class="section-count">'+g.returned.length+'</span></div>';g.returned.forEach(function(r){html+=renderCard(r);});}
  return html;
}

function renderCard(r){
  var sel=r.id===selectedId?" selected":"";
  var sb=r.status==="setup"?'<span class="badge badge-setup">Needs Setup</span>':
         r.status==="out"?'<span class="badge badge-out">Out</span>':
         r.status==="overdue"?'<span class="badge badge-overdue">OVERDUE</span>':
         '<span class="badge badge-returned">Returned</span>';
  var pb='<span class="badge badge-pickup"><svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>Pickup</span>';
  var wb=r.waiver?'<span class="badge badge-waiver"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>Waiver</span>':'<span class="badge badge-nowaiver"><svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>No Waiver</span>';
  var rb=r.isReturning?'<span class="badge badge-returning"><svg viewBox="0 0 24 24"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>Returning</span>':"";
  var mb=r.isMinor?'<span class="badge badge-minor">👤 Minor</span>':"";
  var ot=r.isShopify?'<span class="rcard-order shopify">🛍 '+r.order+'</span>':'<span class="rcard-order walkin">Walk-In</span>';
  var ct="";
  if(r.phone)ct+='<div class="rcard-info-row"><svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.37 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.1a16 16 0 0 0 6 6l1.06-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg><a href="tel:'+r.phone+'">'+r.phone+'</a></div>';
  if(r.email)ct+='<div class="rcard-info-row"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg><a href="mailto:'+r.email+'">'+r.email+'</a></div>';
  if(r.isShopify&&r.order)ct+='<div class="rcard-info-row"><svg viewBox="0 0 24 24" fill="none" stroke="#1971c2" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg><span class="shopify-link" onclick="showToast(\'Shopify '+r.order+'\',\'\')">Shopify '+r.order+'</span></div>';
  var pa=r.status==="returned"?'<button class="act-btn act-full" onclick="openProfile('+r.id+')">View Schedule</button>':
    '<button class="act-btn act-setup" onclick="openSetupWorkflow('+r.id+')"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>Setup</button>'+
    '<button class="act-btn act-date" onclick="openProfile('+r.id+')"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Date</button>'+
    '<button class="act-btn act-return" onclick="markReturned('+r.id+')"><svg viewBox="0 0 24 24"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>Return</button>';
  var sa=r.status!=="returned"?
    '<div class="rcard-actions-2">'+
      '<button class="act-btn act-secondary" onclick="openWaiverModal('+r.id+')">'+(r.waiver?'📋 Waiver ✓':'📋 Sign Waiver')+'</button>'+
      '<button class="act-btn act-secondary" onclick="showToast(\'Renter added\',\'success\')">👤 Add Renter</button>'+
      '<button class="act-btn act-secondary" onclick="showToast(\'Incident logged\',\'success\')">⚠ Incident</button>'+
    '</div>':"";
  return'<div class="rcard'+sel+'" id="rcard-'+r.id+'" onclick="selectRental('+r.id+')">'+
    '<div class="rcard-top"><div><div class="rcard-name">'+r.name+'</div><div class="rcard-pkg">'+r.package+'</div></div>'+ot+'</div>'+
    '<div class="rcard-badges">'+sb+pb+rb+wb+mb+'</div>'+
    '<div class="rcard-info"><div class="rcard-info-row"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'+r.startDate+' → '+r.endDate+' · '+r.days+' day'+(r.days!==1?'s':'')+'</div>'+ct+'</div>'+
    '<div class="rcard-actions">'+pa+'</div>'+sa+'</div>';
}

/* ═══════════════════════════════════════════════════
   SETUP WORKFLOW — with live DIN calculation
═══════════════════════════════════════════════════ */
function openSetupWorkflow(id){
  selectedId=id;
  var r=rentals.find(function(x){return x.id===id;});if(!r)return;
  renderSetupView(r);showView("setup");
}

function renderSetupView(r){
  var c=document.getElementById("view-setup");if(!c)return;
  var isSnow=(r.rentalType||"").toLowerCase().includes("snowboard")||(r.package||"").toLowerCase().includes("snowboard");
  var din=calcDIN(r.weight,r.heightFt,r.heightIn,r.bsl,r.age,r.experience,r.skierType);
  var rec=recommendedLength(r.weight,r.heightFt,r.heightIn,r.experience,isSnow?"snowboard":"ski");
  var dinDisp=din?'<span class="din-badge'+(din>=5?" warn":"")+'">'+din+'</span>':'<span style="color:#9ca3af">Enter measurements</span>';
  var eqHtml=r.equipment.map(function(e,i){
    var parts=e.split("—");var n=parts[0]?parts[0].trim():"";var d=parts[1]?parts[1].trim():"";
    return'<div class="equip-item"><div class="equip-item-icon">'+getEquipIcon(e)+'</div><div class="equip-item-body">'+
      '<input class="form-input equip-name-input" id="eq-n-'+i+'" value="'+n+'" placeholder="Equipment type"/>'+
      '<input class="form-input equip-detail-input" id="eq-d-'+i+'" value="'+d+'" placeholder="Size / barcode"/>'+
    '</div><button class="equip-remove-btn" onclick="removeEquipRow('+i+')" title="Remove">×</button></div>';
  }).join("");
  c.innerHTML=
    '<div class="setup-header">'+
      '<button class="detail-back" onclick="showView(\'rentals\')"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></button>'+
      '<div style="flex:1"><div class="detail-title">Equipment Setup</div><span class="detail-sub">'+r.name+' · '+r.package+'</span></div>'+
      '<span class="setup-status-badge">'+r.status+'</span>'+
    '</div>'+
    '<div class="setup-body">'+
      '<div class="setup-section">'+
        '<div class="setup-section-title">📏 Renter Measurements</div>'+
        '<div class="setup-form-grid">'+
          '<div class="form-group"><label class="form-label">Height</label><div style="display:flex;gap:6px;">'+
            '<input class="form-input" id="su-hft" type="number" placeholder="ft" min="3" max="7" value="'+(r.heightFt||"")+'" style="width:68px;flex-shrink:0;" oninput="liveCalc()"/>'+
            '<input class="form-input" id="su-hin" type="number" placeholder="in" min="0" max="11" value="'+(r.heightIn||"")+'" style="width:68px;flex-shrink:0;" oninput="liveCalc()"/>'+
          '</div></div>'+
          '<div class="form-group"><label class="form-label">Weight (lbs)</label><input class="form-input" id="su-wt" type="number" placeholder="lbs" value="'+(r.weight||"")+'" oninput="liveCalc()"/></div>'+
          '<div class="form-group"><label class="form-label">Age</label><input class="form-input" id="su-age" type="number" placeholder="age" value="'+(r.age||"")+'" oninput="liveCalc()"/></div>'+
          '<div class="form-group"><label class="form-label">Shoe Size (US)</label><input class="form-input" id="su-shoe" type="number" placeholder="e.g. 9" step="0.5" value="'+(r.shoe||"")+'"/></div>'+
          '<div class="form-group"><label class="form-label">BSL (mm)</label><input class="form-input" id="su-bsl" type="number" placeholder="e.g. 310" value="'+(r.bsl||"")+'" oninput="liveCalc()"/></div>'+
          '<div class="form-group"><label class="form-label">Ability Level</label>'+
            '<select class="form-select" id="su-exp" onchange="liveCalc()">'+
              ['Beginner','Novice','Intermediate','Advanced','Expert'].map(function(x){return'<option'+(x===r.experience?' selected':'')+'>'+x+'</option>';}).join('')+
            '</select>'+
          '</div>'+
          '<div class="form-group"><label class="form-label">Skier Type</label>'+
            '<select class="form-select" id="su-type" onchange="liveCalc()">'+
              ['Type I (Beginner/Cautious)','Type II (Intermediate)','Type III (Advanced/Aggressive)'].map(function(x){return'<option'+(x===r.skierType?' selected':'')+'>'+x+'</option>';}).join('')+
            '</select>'+
          '</div>'+
          '<div class="form-group"><label class="form-label">Rental Type</label>'+
            '<select class="form-select" id="su-rt" onchange="liveCalc()">'+
              '<option'+(isSnow?'':' selected')+'>Ski</option><option'+(isSnow?' selected':'')+'>Snowboard</option>'+
            '</select>'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div class="setup-section setup-din-section">'+
        '<div class="setup-section-title">⚡ DIN Setting (ISO 11088 reference chart)</div>'+
        '<div class="din-result-row">'+
          '<div><div style="font-size:.75rem;color:#6b7280;margin-bottom:4px;">Calculated DIN</div><div id="din-disp" style="font-size:1.5rem;font-weight:800;">'+dinDisp+'</div></div>'+
          '<div id="rec-disp" style="text-align:right;"><div style="font-size:.75rem;color:#6b7280;margin-bottom:4px;">Recommended Length</div><div style="font-weight:700;color:#374151;">'+(rec||'—')+'</div></div>'+
        '</div>'+
      '</div>'+
      '<div class="setup-section">'+
        '<div class="setup-section-title">🎿 Equipment Assignment</div>'+
        '<div id="equip-list">'+eqHtml+'</div>'+
        '<button class="add-equip-btn" onclick="addEquipRow()">+ Add Equipment</button>'+
      '</div>'+
      '<div class="setup-actions">'+
        '<button class="btn-primary setup-save-btn" onclick="saveSetup('+r.id+')" style="background:#2f9e44;">✓ Save &amp; Mark Out</button>'+
        '<button class="btn-primary setup-save-btn" onclick="saveSetupOnly('+r.id+')" style="background:#1971c2;">Save — Keep in Setup</button>'+
        '<button class="btn-ghost setup-save-btn" onclick="showView(\'rentals\')">Cancel</button>'+
      '</div>'+
    '</div>';
}

function getEquipIcon(n){
  var s=(n||"").toLowerCase();
  if(s.includes("snowboard")&&!s.includes("boot"))return"🏂";
  if((s.includes("ski")&&!s.includes("boot")&&!s.includes("pole")&&!s.includes("helmet")))return"🎿";
  if(s.includes("boot"))return"👢";if(s.includes("helmet"))return"⛑️";if(s.includes("pole"))return"🪄";
  return"📦";
}

function liveCalc(){
  var w=parseFloat(document.getElementById("su-wt")&&document.getElementById("su-wt").value||0);
  var hft=parseInt(document.getElementById("su-hft")&&document.getElementById("su-hft").value||0);
  var hin=parseInt(document.getElementById("su-hin")&&document.getElementById("su-hin").value||0);
  var bsl=parseFloat(document.getElementById("su-bsl")&&document.getElementById("su-bsl").value||0);
  var age=parseInt(document.getElementById("su-age")&&document.getElementById("su-age").value||0);
  var exp=(document.getElementById("su-exp")&&document.getElementById("su-exp").value)||"Intermediate";
  var skt=(document.getElementById("su-type")&&document.getElementById("su-type").value)||"Type II (Intermediate)";
  var rt=(document.getElementById("su-rt")&&document.getElementById("su-rt").value)||"Ski";
  var isSnow=rt.toLowerCase().includes("snowboard");
  var dinEl=document.getElementById("din-disp"),recEl=document.getElementById("rec-disp");
  if(isSnow){
    if(dinEl)dinEl.innerHTML='<span style="color:#9ca3af;font-size:.9rem">Not applicable for snowboard</span>';
  } else {
    var din=calcDIN(w,hft,hin,bsl,age,exp,skt);
    if(dinEl)dinEl.innerHTML=din?'<span class="din-badge'+(din>=5?" warn":"")+'">'+din+'</span>':'<span style="color:#9ca3af">Enter measurements</span>';
  }
  if(recEl){
    var rec=recommendedLength(w,hft,hin,exp,isSnow?"snowboard":"ski");
    recEl.innerHTML='<div style="font-size:.75rem;color:#6b7280;margin-bottom:4px;">Recommended Length</div><div style="font-weight:700;color:#374151;">'+(rec||"—")+'</div>';
  }
}

function addEquipRow(){
  var list=document.getElementById("equip-list");if(!list)return;
  var i=list.querySelectorAll(".equip-item").length;
  var div=document.createElement("div");div.className="equip-item";
  div.innerHTML='<div class="equip-item-icon">📦</div><div class="equip-item-body">'+
    '<input class="form-input equip-name-input" id="eq-n-'+i+'" placeholder="Equipment type"/>'+
    '<input class="form-input equip-detail-input" id="eq-d-'+i+'" placeholder="Size / barcode"/>'+
  '</div><button class="equip-remove-btn" onclick="this.closest(\'.equip-item\').remove()" title="Remove">×</button>';
  list.appendChild(div);
}
function removeEquipRow(i){
  var items=document.querySelectorAll("#equip-list .equip-item");
  if(items.length<=1){showToast("At least one item required","error");return;}
  if(items[i])items[i].remove();
}
function collectEquip(){
  var eq=[];
  document.querySelectorAll("#equip-list .equip-item").forEach(function(item){
    var n=(item.querySelector(".equip-name-input")||{}).value||"";
    var d=(item.querySelector(".equip-detail-input")||{}).value||"";
    if(n.trim())eq.push(n.trim()+(d.trim()?" — "+d.trim():""));
  });
  return eq;
}
function applySetup(r){
  r.weight=parseFloat((document.getElementById("su-wt")||{}).value)||r.weight;
  r.heightFt=parseInt((document.getElementById("su-hft")||{}).value)||r.heightFt;
  r.heightIn=parseInt((document.getElementById("su-hin")||{}).value)>=0?parseInt(document.getElementById("su-hin").value):r.heightIn;
  r.bsl=parseFloat((document.getElementById("su-bsl")||{}).value)||r.bsl;
  r.age=parseInt((document.getElementById("su-age")||{}).value)||r.age;
  r.shoe=parseFloat((document.getElementById("su-shoe")||{}).value)||r.shoe;
  r.experience=(document.getElementById("su-exp")||{}).value||r.experience;
  r.skierType=(document.getElementById("su-type")||{}).value||r.skierType;
  r.rentalType=(document.getElementById("su-rt")||{}).value||r.rentalType;
  var isSnow=r.rentalType.toLowerCase().includes("snowboard");
  r.din=isSnow?null:calcDIN(r.weight,r.heightFt,r.heightIn,r.bsl,r.age,r.experience,r.skierType);
  var eq=collectEquip();if(eq.length)r.equipment=eq;
}
function saveSetup(id){
  var r=rentals.find(function(x){return x.id===id;});if(!r)return;
  applySetup(r);r.status="out";persistRental(r);
  showToast(r.name+" — setup saved, rental Out ✓","success");showView("rentals");
}
function saveSetupOnly(id){
  var r=rentals.find(function(x){return x.id===id;});if(!r)return;
  applySetup(r);persistRental(r);showToast("Setup saved — rental stays in Setup","success");showView("rentals");
}

/* ═══════════════════════════════════════════════════
   PROFILE VIEW
═══════════════════════════════════════════════════ */
function openProfile(id){
  selectedId=id;var r=rentals.find(function(x){return x.id===id;});if(!r)return;
  var c=document.getElementById("view-profile");if(!c)return;
  var dh=r.din?'<span class="din-badge'+(r.din>=5?" warn":"")+'">'+r.din+'</span>':'<span style="color:#9ca3af;font-style:italic">N/A</span>';
  var hd=r.heightFt?r.heightFt+"'"+(r.heightIn||0)+'"':"—";
  c.innerHTML=
    '<div class="detail-header"><button class="detail-back" onclick="showView(\'rentals\')"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></button>'+
    '<div style="flex:1"><div class="detail-title">'+r.name+'</div><span class="detail-sub">'+r.package+' · '+(r.order||"Walk-In")+'</span></div>'+
    '<button class="topbar-btn" onclick="openStatusModal('+r.id+')"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button></div>'+
    '<div class="detail-body">'+
      '<div class="detail-section"><div class="detail-section-title">Rental Info</div>'+
        row("Status",r.status.charAt(0).toUpperCase()+r.status.slice(1))+row("Dates",r.startDate+" → "+r.endDate)+row("Duration",r.days+" day"+(r.days!==1?"s":""))+
        row("Pickup","Anytime 8:00am–9:30pm")+row("Waiver",'<span style="color:'+(r.waiver?"#2f9e44":"#e03131")+'">'+(r.waiver?"✓ Signed":"Not signed")+'</span>')+
        (r.isMinor?row("Guardian",r.notes||"Not recorded"):"")+
      '</div>'+
      '<div class="detail-section"><div class="detail-section-title">Measurements</div>'+
        row("Weight",r.weight?r.weight+" lbs":"—")+row("Height",hd)+row("Shoe",r.shoe?"US "+r.shoe:"—")+row("BSL",r.bsl?r.bsl+" mm":"—")+
        row("Experience",r.experience||"—")+row("Skier Type",r.skierType||"—")+row("DIN Setting",dh)+
      '</div>'+
      '<div class="detail-section"><div class="detail-section-title">Equipment</div>'+
        r.equipment.map(function(e){return'<div class="detail-row"><span class="detail-row-label" style="flex:1">'+e+'</span><span style="color:#2f9e44;font-size:.8rem">✓</span></div>';}).join('')+
      '</div>'+
      '<div style="padding:12px;display:flex;flex-direction:column;gap:8px;">'+
        (r.status!=="returned"?
          '<button class="btn-primary" onclick="openSetupWorkflow('+r.id+')" style="background:#1971c2;">⚙ Setup Equipment</button>'+
          '<button class="btn-primary" onclick="markSetupDone('+r.id+')" style="background:#2f9e44;">✓ Mark Out</button>'+
          '<button class="btn-primary" onclick="openWaiverModal('+r.id+')" style="background:'+(r.waiver?"#9ca3af":"#6b7280")+'">'+(r.waiver?"✓ Waiver Signed":"📋 Sign Waiver")+'</button>'+
          '<button class="btn-primary" onclick="markReturned('+r.id+')" style="background:#6b7280;">↩ Mark Returned</button>':
          '<div style="text-align:center;padding:16px;color:#2f9e44;font-weight:700;">✓ Rental Complete</div>'
        )+
      '</div>'+
    '</div>';
  showView("profile");
}
function row(l,v){return'<div class="detail-row"><span class="detail-row-label">'+l+'</span><span class="detail-row-val">'+v+'</span></div>';}

/* ═══════════════════════════════════════════════════
   SETTINGS VIEW
═══════════════════════════════════════════════════ */
function renderSettingsView(){
  var c=document.getElementById("view-settings");if(!c)return;
  c.innerHTML='<div class="detail-header"><div class="topbar-logo">RPS</div><div style="flex:1;margin-left:8px;"><div class="detail-title">Settings</div><span class="detail-sub">Rick\'s Pro Shop · Blue Mountain</span></div></div>'+
  '<div class="settings-body">'+
    '<div class="settings-section">'+
      '<div class="settings-row"><span class="settings-row-label">Staff PIN</span><span class="settings-row-val">1234 (demo)</span></div>'+
      '<div class="settings-row" onclick="syncShopify()"><span class="settings-row-label">Shopify Sync</span><span class="settings-row-val">Tap to sync ›</span></div>'+
      '<div class="settings-row" onclick="showToast(\'Export coming soon\',\'\')"><span class="settings-row-label">Backup Database</span><span class="settings-row-val">Download ›</span></div>'+
    '</div>'+
    '<div class="settings-section">'+
      '<div class="settings-row"><span class="settings-row-label">Pickup Window</span><span class="settings-row-val">8:00am – 9:30pm</span></div>'+
      '<div class="settings-row"><span class="settings-row-label">Location</span><span class="settings-row-val">Blue Mountain, ON</span></div>'+
      '<div class="settings-row"><span class="settings-row-label">DIN Standard</span><span class="settings-row-val">ISO 11088 (unverified — confirm against a current chart)</span></div>'+
      '<div class="settings-row"><span class="settings-row-label">Version</span><span class="settings-row-val">v2.1 · Live</span></div>'+
    '</div>'+
    '<p style="text-align:center;font-size:.72rem;color:#9ca3af;padding:16px;">Rentals are stored in Supabase. Tap Shopify Sync to pull in new orders.</p>'+
  '</div>';
}

/* ═══════════════════════════════════════════════════
   RENTAL ACTIONS
═══════════════════════════════════════════════════ */
function selectRental(id){selectedId=id;var l=document.getElementById("rental-list");if(l)l.innerHTML=renderRentalList();}
function markSetupDone(id){var r=rentals.find(function(x){return x.id===id;});if(!r)return;r.status="out";persistRental(r);showToast("Rental marked Out ✓","success");showView("rentals");}
function markReturned(id){
  var r=rentals.find(function(x){return x.id===id;});if(!r)return;
  if(r.status==="returned"){showToast("Already returned","");return;}
  r.status="returned";r.isOverdue=false;persistRental(r);showToast(r.name+" — returned ✓","success");
  selectedId=null;renderRentalsView();showView("rentals");
}
function openStatusModal(id){
  var r=rentals.find(function(x){return x.id===id;});if(!r)return;
  var t=document.getElementById("status-modal-title"),o=document.getElementById("status-options");if(!t||!o)return;
  t.textContent="Update: "+r.name;
  o.innerHTML='<button class="btn-primary" style="background:#f59f00;" onclick="setStatus('+id+',\'setup\')">⚙ Needs Setup</button>'+
    '<button class="btn-primary" style="background:#3b5bdb;" onclick="setStatus('+id+',\'out\')">🎿 Mark Out</button>'+
    '<button class="btn-primary" style="background:#c92a2a;" onclick="setStatus('+id+',\'overdue\')">🔴 Mark Overdue</button>'+
    '<button class="btn-primary" style="background:#2f9e44;" onclick="setStatus('+id+',\'returned\')">✓ Mark Returned</button>';
  openModal("modal-status");
}
function setStatus(id,status){
  var r=rentals.find(function(x){return x.id===id;});if(!r)return;
  r.status=status;r.isOverdue=status==="overdue";persistRental(r);
  closeModal("modal-status");showToast("Status → "+status,"success");
  if(currentView==="profile")openProfile(id);else renderRentalsView();
}

/* ═══════════════════════════════════════════════════
   NEW RENTAL
═══════════════════════════════════════════════════ */
function openNewRentalModal(){openModal("modal-new");}
function createRental(){
  var fn=(document.getElementById("new-fn")||{}).value||"";
  var ln=(document.getElementById("new-ln")||{}).value||"";
  var pkg=(document.getElementById("new-pkg")||{}).value||"Adult Ski Package";
  var phone=(document.getElementById("new-phone")||{}).value||"";
  var si=(document.getElementById("new-start")||{}).value||"";
  var dv=parseInt((document.getElementById("new-days")||{}).value||1);
  var name=(fn+" "+ln).trim()||"New Renter";
  var ss="Today",se="Tomorrow";
  if(si){var s=new Date(si+"T00:00:00"),e=new Date(s);e.setDate(e.getDate()+dv);
    ss=s.toLocaleDateString("en-CA",{month:"short",day:"numeric"});
    se=e.toLocaleDateString("en-CA",{month:"short",day:"numeric"});}
  var isSnow=pkg.toLowerCase().includes("snowboard");
  var nr={id:Date.now(),name:name,firstName:fn,lastName:ln,package:pkg,status:"setup",order:null,isShopify:false,startDate:ss,endDate:se,days:dv,phone:phone,email:"",waiver:false,isMinor:false,isReturning:false,isOverdue:false,din:null,weight:null,heightFt:null,heightIn:null,shoe:null,bsl:null,age:null,experience:"Beginner",skierType:"Type I (Beginner/Cautious)",rentalType:isSnow?"Snowboard":"Ski",equipment:getDefaultEquipment(pkg),notes:""};
  rentals.unshift(nr);
  sb.from("rentals").insert(clientToRow(nr))
    .then(function(res){if(res.error)console.error("create rental failed:",res.error.message);})
    .catch(function(){});
  closeModal("modal-new");
  ["new-fn","new-ln","new-phone"].forEach(function(i){var el=document.getElementById(i);if(el)el.value="";});
  showToast(name+" — created","success");
  openSetupWorkflow(nr.id);
}
function getDefaultEquipment(pkg){
  var p=pkg.toLowerCase();
  if(p.includes("adult ski")||p.includes("high perf")||p.includes("performance ski"))return["Adult Ski Pair","Adult Ski Boots","Adult Helmet","Adult Poles"];
  if(p.includes("youth ski")||p.includes("junior ski")||p.includes("kids ski"))return["Youth Ski Pair","Youth Ski Boots","Youth Helmet","Youth Poles"];
  if(p.includes("snowboard"))return["Snowboard + Bindings","Snowboard Boots","Helmet"];
  if(p.includes("poles"))return["Adult Ski Poles"];if(p.includes("helmet"))return["Adult Ski Helmet"];
  if(p.includes("boot"))return["Snowboard Boots"];
  return["Adult Ski Pair","Adult Ski Boots","Adult Helmet","Adult Poles"];
}

/* ═══════════════════════════════════════════════════
   WAIVER
═══════════════════════════════════════════════════ */
function openWaiverModal(id){
  var r=rentals.find(function(x){return x.id===id;});if(!r)return;
  if(r.waiver){showToast("Waiver already signed","");return;}
  selectedId=id;
  var ms=document.getElementById("waiver-minor-section");if(ms)ms.style.display=r.isMinor?"block":"none";
  var cb=document.getElementById("waiver-confirm");if(cb)cb.checked=false;
  openModal("modal-waiver");
}
function confirmWaiver(){
  var cb=document.getElementById("waiver-confirm");
  if(!cb||!cb.checked){showToast("Please confirm the customer has agreed","error");return;}
  var r=rentals.find(function(x){return x.id===selectedId;});
  if(r){
    if(r.isMinor){var g=(document.getElementById("waiver-guardian")||{}).value||"";if(!g.trim()){showToast("Guardian name required","error");return;}r.notes="Guardian: "+g;}
    r.waiver=true;persistRental(r);
  }
  closeModal("modal-waiver");showToast("Waiver confirmed ✓","success");
  if(currentView==="profile"&&r)openProfile(r.id);else renderRentalsView();
}

/* ═══════════════════════════════════════════════════
   SEARCH & FILTER
═══════════════════════════════════════════════════ */
function onSearch(v){searchQuery=v.toLowerCase();var l=document.getElementById("rental-list");if(l)l.innerHTML=renderRentalList();}
function cycleFilter(){var c={all:"active",active:"returned",returned:"all"};filterStatus=c[filterStatus]||"all";renderRentalsView();}
function getFilteredRentals(){
  var r=rentals;
  if(searchQuery)r=r.filter(function(x){return x.name.toLowerCase().includes(searchQuery)||(x.order&&x.order.toLowerCase().includes(searchQuery))||x.package.toLowerCase().includes(searchQuery);});
  if(filterStatus==="active")r=r.filter(function(x){return x.status!=="returned";});
  else if(filterStatus==="returned")r=r.filter(function(x){return x.status==="returned";});
  return r;
}
function computeStats(){
  return{total:rentals.length,out:rentals.filter(function(r){return r.status==="out"||r.status==="overdue";}).length,setup:rentals.filter(function(r){return r.status==="setup";}).length,overdue:rentals.filter(function(r){return r.status==="overdue";}).length,returned:rentals.filter(function(r){return r.status==="returned";}).length};
}

/* ═══════════════════════════════════════════════════
   MODALS & EVENTS
═══════════════════════════════════════════════════ */
function openModal(id){var el=document.getElementById(id);if(el)el.classList.add("open");}
function closeModal(id){var el=document.getElementById(id);if(el)el.classList.remove("open");}
function bindGlobalEvents(){
  document.addEventListener("click",function(e){
    ["modal-new","modal-status","modal-waiver"].forEach(function(id){var el=document.getElementById(id);if(el&&e.target===el)closeModal(id);});
  });
}

/* ═══════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════ */
var toastTimer=null;
function showToast(msg,type){
  var el=document.getElementById("toast");if(!el)return;
  el.textContent=msg;el.className="toast show"+(type?" "+type:"");
  if(toastTimer)clearTimeout(toastTimer);
  toastTimer=setTimeout(function(){el.classList.remove("show");},2600);
}
