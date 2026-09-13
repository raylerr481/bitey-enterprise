const KEY='biteyEnterprise.workspace.v1';
const SESSION_KEY='biteyEnterprise.auth.v1';
const defaults={company:{name:'',website:'',description:'',location:''},assistant:{name:'',role:'',tone:'Professional',language:'Spanish',greeting:'',instructions:''},channels:{web:false,telegram:false,whatsapp:false},knowledge:[]};

function load(){try{return {...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {...defaults}}}
const state=load();
const api=window.BiteyEnterpriseAPI;
let session=null;

function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function field(label,key,value,type='text'){return `<label>${label}<input name="${key}" type="${type}" value="${esc(value)}"></label>`}

function authView(mode='login',message=''){
  const login=mode==='login';
  return `<section class="panel auth-panel"><div class="section-head"><div><h2>${login?'Sign in':'Create account'}</h2><p class="muted">${login?'Access your protected Bitey Enterprise workspace.':'Create an account for a tenant-isolated Enterprise workspace.'}</p></div><span class="status">${api?.configured?'BACKEND READY':'BACKEND NOT CONFIGURED'}</span></div>${message?`<div class="notice">${esc(message)}</div>`:''}<form id="auth-form" class="form-grid">${!login?field('Full name','name',''):''}${field('Email','email','email','email')}${field('Password','password','','password')}${!login?field('Company name','company_name',''):''}<div class="wide actions"><button class="primary" type="submit">${login?'Sign in':'Register'}</button><a class="secondary link" href="#${login?'register':'login'}">${login?'Create account':'Back to sign in'}</a></div></form></section>`;
}

function companyView(){return `<section class="panel"><div class="section-head"><div><h2>Company profile</h2><p class="muted">Define the business context used by the assistant.</p></div><span class="status">LOCAL DRAFT</span></div><form id="company-form" class="form-grid">${field('Business name','name',state.company.name)}${field('Website','website',state.company.website,'url')}${field('Primary location','location',state.company.location)}<label class="wide">Business description<textarea name="description">${esc(state.company.description)}</textarea></label><div class="wide actions"><button class="primary">Save company</button><span id="form-status" class="muted"></span></div></form></section>`}
function assistantView(){return `<section class="panel"><div class="section-head"><div><h2>Personalized assistant</h2><p class="muted">Identity and behavior configuration. Nothing is activated from this screen.</p></div><span class="status">${state.assistant.name?'CONFIGURING':'DRAFT'}</span></div><form id="assistant-form" class="form-grid">${field('Assistant name','name',state.assistant.name)}${field('Business role','role',state.assistant.role)}${field('Tone','tone',state.assistant.tone)}${field('Primary language','language',state.assistant.language)}<label class="wide">Greeting<textarea name="greeting">${esc(state.assistant.greeting)}</textarea></label><label class="wide">System instructions<textarea name="instructions">${esc(state.assistant.instructions)}</textarea></label><div class="wide actions"><button class="primary">Save assistant</button><span id="form-status" class="muted"></span></div></form></section>`}
function knowledgeView(){return `<section class="panel"><div class="section-head"><div><h2>Knowledge sources</h2><p class="muted">Register sources now; ingestion will be connected to a secure backend later.</p></div><span class="status">${state.knowledge.length} SOURCES</span></div><form id="knowledge-form" class="form-grid"><label class="wide">Website or source URL<input name="url" type="url" placeholder="https://example.com" required></label><div class="wide actions"><button class="primary">Add source</button></div></form>${state.knowledge.length?`<div class="source-list">${state.knowledge.map((x,i)=>`<div class="source"><span>${esc(x)}</span><button data-remove-source="${i}" class="danger">Remove</button></div>`).join('')}</div>`:'<div class="empty">No knowledge sources configured.</div>'}</section>`}
function channelsView(){return `<section class="panel"><div class="section-head"><div><h2>Channels</h2><p class="muted">Prepare channel identities without exposing secrets in the browser.</p></div><span class="status">${Object.values(state.channels).filter(Boolean).length} READY</span></div><div class="channel-grid">${[['web','Web'],['telegram','Telegram'],['whatsapp','WhatsApp']].map(([k,n])=>`<button class="channel ${state.channels[k]?'selected':''}" data-channel="${k}"><strong>${n}</strong><span>${state.channels[k]?'Prepared':'Not configured'}</span></button>`).join('')}</div></section>`}

const views={
 dashboard:{title:'Business dashboard',html:()=>`<section class="hero"><span class="status">${state.company.name?'CONFIGURING':'READY TO CONFIGURE'}</span><h2>${state.company.name?esc(state.company.name):'Your AI workspace for business'}</h2><p class="muted">Provision, personalize, test and operate dedicated AI assistants from one control plane.</p><div class="actions"><a class="primary link" href="#company">Configure company</a><a class="secondary link" href="#assistant">Configure assistant</a></div></section><div class="grid"><article class="card"><h3>Assistant</h3><p class="muted">Identity, personality, role and rules.</p><div class="metric">${state.assistant.name?'Configured':'Draft'}</div></article><article class="card"><h3>Knowledge</h3><p class="muted">Websites and business documents.</p><div class="metric">${state.knowledge.length} sources</div></article><article class="card"><h3>Channels</h3><p class="muted">Web, Telegram and WhatsApp.</p><div class="metric">${Object.values(state.channels).filter(Boolean).length} prepared</div></article></div>`},
 company:{title:'Company',html:companyView},assistant:{title:'Assistant',html:assistantView},knowledge:{title:'Knowledge',html:knowledgeView},channels:{title:'Channels',html:channelsView},
 customers:{title:'Customers',html:()=>`<section class="panel"><h2>Customers</h2><p class="muted">Customer identities and conversations will be connected only after secure tenant-aware backend integration.</p></section>`},
 projects:{title:'Projects',html:()=>`<section class="panel"><h2>Projects</h2><p class="muted">Project workspace reserved for business initiatives and assistant deployments.</p></section>`},
 automation:{title:'Automation',html:()=>`<section class="panel"><h2>Automation</h2><p class="muted">Controlled workflows for notifications, routing and operational tasks.</p></section>`},
 analytics:{title:'Analytics',html:()=>`<section class="panel"><h2>Analytics</h2><p class="muted">Usage, channel activity and readiness metrics will be populated from the backend.</p></section>`},
 readiness:{title:'AI Readiness',html:()=>{const checks=[['Company profile',!!state.company.name],['Assistant identity',!!state.assistant.name],['Knowledge review',state.knowledge.length>0],['Channel configuration',Object.values(state.channels).some(Boolean)]];const passed=checks.filter(x=>x[1]).length;return `<section class="panel"><div class="section-head"><div><h2>AI Readiness</h2><p class="muted">Activation remains blocked until backend validation and security checks exist.</p></div><span class="status">${passed}/${checks.length} CHECKS</span></div><div class="checks">${checks.map(x=>`<div class="check"><span>${x[1]?'✓':'○'}</span>${x[0]}<strong>${x[1]?'PASS':'PENDING'}</strong></div>`).join('')}</div><div class="notice">Current lifecycle: <b>${passed===checks.length?'READY (LOCAL ONLY)':'DRAFT'}</b>. This browser-only prototype does not activate production assistants.</div></section>`}}
};

function save(){localStorage.setItem(KEY,JSON.stringify(state));}
function saveSession(data){session=data; if(data)sessionStorage.setItem(SESSION_KEY,JSON.stringify({user:data.user||null,expires_at:data.expires_at||null})); else sessionStorage.removeItem(SESSION_KEY)}
function restoreSession(){try{session=JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null')}catch{session=null}}
async function checkSession(){
  restoreSession();
  if(!api?.configured)return session;
  const result=await api.auth.session();
  if(result?.ok && result.authenticated){saveSession(result);return result}
  if(result?.error?.code==='UNAUTHENTICATED'){saveSession(null);return null}
  return session;
}

function render(){
  const key=(location.hash||'#dashboard').slice(1);
  const authKeys=new Set(['login','register']);
  if(authKeys.has(key)){document.title=`${key==='login'?'Sign in':'Register'} — Bitey Enterprise`;document.querySelector('#page-title').textContent='Authentication';document.querySelector('#app').innerHTML=authView(key);document.querySelectorAll('.sidebar nav a').forEach(a=>a.classList.remove('active'));bind(key);return;}
  if(!session){location.hash='#login';return;}
  const view=views[key]||views.dashboard;document.title=`${view.title} — Bitey Enterprise`;document.querySelector('#page-title').textContent=view.title;document.querySelector('#app').innerHTML=view.html();document.querySelectorAll('.sidebar nav a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')===`#${key}`));bind(key);
}

async function handleAuth(key,form){
  if(!api?.configured){render();const note=document.querySelector('#app .notice');if(note)note.textContent='Backend not configured. No account was created and no password was stored.';return;}
  const data=Object.fromEntries(new FormData(form));
  const result=key==='login'?await api.auth.login({email:data.email,password:data.password}):await api.auth.register(data);
  if(result?.ok || result?.authenticated || result?.user){saveSession(result);location.hash='#dashboard';return;}
  render();const note=document.querySelector('#app .notice');if(note)note.textContent=result?.error?.message||'Authentication request failed.';
}

function bind(key){
  const form=document.querySelector('form');
  if(form&&['login','register'].includes(key))form.addEventListener('submit',e=>{e.preventDefault();handleAuth(key,form)});
  if(form&&!['login','register'].includes(key))form.addEventListener('submit',e=>{e.preventDefault();const data=Object.fromEntries(new FormData(form));if(key==='company')state.company={...state.company,...data};if(key==='assistant')state.assistant={...state.assistant,...data};if(key==='knowledge')state.knowledge.push(data.url);save();render();});
  document.querySelectorAll('[data-remove-source]').forEach(b=>b.onclick=()=>{state.knowledge.splice(Number(b.dataset.removeSource),1);save();render()});
  document.querySelectorAll('[data-channel]').forEach(b=>b.onclick=()=>{const k=b.dataset.channel;state.channels[k]=!state.channels[k];save();render()});
}

window.addEventListener('hashchange',render);
(async()=>{await checkSession();render()})();
