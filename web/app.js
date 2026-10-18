const BASE_KEY = 'biteyEnterprise.workspace.v2';
const SESSION_KEY = 'biteyEnterprise.auth.v2';
const defaults = {
  company: { name: '', website: '', description: '', location: '' },
  assistant: { name: '', role: '', tone: 'Professional', language: 'Spanish', greeting: '', instructions: '' },
  channels: { web: false, telegram: false, whatsapp: false },
  knowledge: []
};
const api = window.BiteyEnterpriseAPI;
let session = null;
let state = structuredClone(defaults);

function tenantKey() {
  const user = session?.user;
  const identity = user?.id || user?.email;
  return identity ? BASE_KEY + ':' + String(identity).toLowerCase() : null;
}
function loadWorkspace() {
  const key = tenantKey();
  if (!key) return structuredClone(defaults);
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    return saved && typeof saved === 'object'
      ? { ...structuredClone(defaults), ...saved,
          company: { ...defaults.company, ...(saved.company || {}) },
          assistant: { ...defaults.assistant, ...(saved.assistant || {}) },
          channels: { ...defaults.channels, ...(saved.channels || {}) },
          knowledge: Array.isArray(saved.knowledge) ? saved.knowledge : [] }
      : structuredClone(defaults);
  } catch { return structuredClone(defaults); }
}
function esc(v = '') {
  return String(v).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}
function field(label, key, value, type = 'text') {
  return `<label>${label}<input name="${key}" type="${type}" value="${esc(value)}" required></label>`;
}
function authView(mode = 'login', message = '') {
  const login = mode === 'login';
  return `<section class="panel auth-panel"><div class="section-head"><div><h2>${login?'Sign in':'Create account'}</h2><p class="muted">${login?'Access your protected Bitey Enterprise workspace.':'Create a tenant-isolated Enterprise workspace.'}</p></div><span class="status">${api?.configured?'API CONFIGURED':'API NOT CONFIGURED'}</span></div>${message?`<div class="notice" role="alert">${esc(message)}</div>`:''}${!api?.configured?'<div class="notice" role="status">Authentication is unavailable until a trusted backend URL is configured. No account or password is stored by this page.</div>':''}<form id="auth-form" class="form-grid" autocomplete="on">${!login?field('Full name','name',''):''}${field('Email','email','','email')}${field('Password','password','','password')}${!login?field('Company name','company_name',''):''}<div class="wide actions"><button class="primary" type="submit" ${api?.configured?'':'disabled'}>${login?'Sign in':'Register'}</button><a class="secondary link" href="#${login?'register':'login'}">${login?'Create account':'Back to sign in'}</a></div></form></section>`;
}
function companyView(){return `<section class="panel"><div class="section-head"><div><h2>Company profile</h2><p class="muted">Business context for the assistant.</p></div><span class="status">LOCAL DRAFT</span></div><form id="company-form" class="form-grid">${field('Business name','name',state.company.name)}${field('Website','website',state.company.website,'url')}${field('Primary location','location',state.company.location)}<label class="wide">Business description<textarea name="description">${esc(state.company.description)}</textarea></label><div class="wide actions"><button class="primary">Save company</button><span id="form-status" class="muted" aria-live="polite"></span></div></form></section>`;}
function assistantView(){return `<section class="panel"><div class="section-head"><div><h2>Personalized assistant</h2><p class="muted">Saving a draft does not activate an assistant.</p></div><span class="status">${state.assistant.name?'CONFIGURING':'DRAFT'}</span></div><form id="assistant-form" class="form-grid">${field('Assistant name','name',state.assistant.name)}${field('Business role','role',state.assistant.role)}${field('Tone','tone',state.assistant.tone)}${field('Primary language','language',state.assistant.language)}<label class="wide">Greeting<textarea name="greeting">${esc(state.assistant.greeting)}</textarea></label><label class="wide">System instructions<textarea name="instructions">${esc(state.assistant.instructions)}</textarea></label><div class="wide actions"><button class="primary">Save assistant</button><span id="form-status" class="muted" aria-live="polite"></span></div></form></section>`;}
function knowledgeView(){return `<section class="panel"><div class="section-head"><div><h2>Knowledge sources</h2><p class="muted">Sources are only registered as local drafts; ingestion is not connected.</p></div><span class="status">${state.knowledge.length} SOURCES</span></div><form id="knowledge-form" class="form-grid"><label class="wide">Website or source URL<input name="url" type="url" placeholder="https://example.com" required></label><div class="wide actions"><button class="primary">Add source</button></div></form>${state.knowledge.length?`<div class="source-list">${state.knowledge.map((x,i)=>`<div class="source"><span>${esc(x)}</span><button type="button" data-remove-source="${i}" class="danger">Remove</button></div>`).join('')}</div>`:'<div class="empty">No knowledge sources configured.</div>'}</section>`;}
function channelsView(){return `<section class="panel"><div class="section-head"><div><h2>Channels</h2><p class="muted">These toggles are local preparation flags, not live connections.</p></div><span class="status">${Object.values(state.channels).filter(Boolean).length} PREPARED</span></div><div class="channel-grid">${[['web','Web'],['telegram','Telegram'],['whatsapp','WhatsApp']].map(([k,n])=>`<button type="button" class="channel ${state.channels[k]?'selected':''}" data-channel="${k}" aria-pressed="${state.channels[k]}"><strong>${n}</strong><span>${state.channels[k]?'Prepared locally':'Not configured'}</span></button>`).join('')}</div></section>`;}
const views = {
 dashboard:{title:'Business dashboard',html:()=>`<section class="hero"><span class="status">${state.company.name?'CONFIGURING':'READY TO CONFIGURE'}</span><h2>${state.company.name?esc(state.company.name):'Your AI workspace for business'}</h2><p class="muted">Configure and validate business assistants from one control plane.</p><div class="actions"><a class="primary link" href="#company">Configure company</a><a class="secondary link" href="#assistant">Configure assistant</a></div></section><div class="grid"><article class="card"><h3>Assistant</h3><p class="muted">Identity, personality and rules.</p><div class="metric">${state.assistant.name?'Configured':'Draft'}</div></article><article class="card"><h3>Knowledge</h3><p class="muted">Registered local sources.</p><div class="metric">${state.knowledge.length} sources</div></article><article class="card"><h3>Channels</h3><p class="muted">Preparation flags only.</p><div class="metric">${Object.values(state.channels).filter(Boolean).length} prepared</div></article></div>`},
 company:{title:'Company',html:companyView}, assistant:{title:'Assistant',html:assistantView}, knowledge:{title:'Knowledge',html:knowledgeView}, channels:{title:'Channels',html:channelsView},
 customers:{title:'Customers',html:()=>`<section class="panel"><h2>Customers</h2><p class="muted">Requires authenticated tenant-aware backend integration; no customer records are exposed here.</p></section>`},
 projects:{title:'Projects',html:()=>`<section class="panel"><h2>Projects</h2><p class="muted">Project persistence and permissions are not yet connected.</p></section>`},
 automation:{title:'Automation',html:()=>`<section class="panel"><h2>Automation</h2><p class="muted">No workflow executes from this prototype.</p></section>`},
 analytics:{title:'Analytics',html:()=>`<section class="panel"><h2>Analytics</h2><p class="muted">Live metrics require backend telemetry.</p></section>`},
 readiness:{title:'AI Readiness',html:()=>{const checks=[['Company profile',!!state.company.name],['Assistant identity',!!state.assistant.name],['Knowledge source registered',state.knowledge.length>0],['Channel prepared',Object.values(state.channels).some(Boolean)],['Backend validation',false],['Tenant security verified',false]];const passed=checks.filter(x=>x[1]).length;return `<section class="panel"><div class="section-head"><div><h2>AI Readiness</h2><p class="muted">Production activation remains blocked until server-side checks pass.</p></div><span class="status">${passed}/${checks.length} CHECKS</span></div><div class="checks">${checks.map(x=>`<div class="check"><span>${x[1]?'✓':'○'}</span>${x[0]}<strong>${x[1]?'PASS':'PENDING'}</strong></div>`).join('')}</div><div class="notice" role="status">Local draft only. This interface cannot activate production assistants.</div></section>`;}}
};
function save(){const key=tenantKey();if(!key)throw new Error('No verified user identity');localStorage.setItem(key,JSON.stringify(state));}
function saveSession(data){session=data;if(data)sessionStorage.setItem(SESSION_KEY,JSON.stringify({user:data.user||null,expires_at:data.expires_at||null}));else sessionStorage.removeItem(SESSION_KEY);}
async function checkSession(){
  // Never trust browser-stored session data as proof of authentication.
  if(!api?.configured){session=null;sessionStorage.removeItem(SESSION_KEY);return null;}
  const result=await api.auth.session();
  if(result?.ok && result.authenticated && result.user){saveSession(result);return result;}
  saveSession(null);return null;
}
function render(){
  const key=(location.hash||'#dashboard').slice(1);
  if(!session){
    const mode=key==='register'?'register':'login';
    document.body.classList.add('auth-mode');
    document.title=`${mode==='login'?'Sign in':'Register'} — Bitey Enterprise`;
    document.querySelector('#page-title').textContent='Authentication';
    document.querySelector('#app').innerHTML=authView(mode);
    document.querySelectorAll('.sidebar nav a').forEach(a=>a.classList.remove('active'));
    bind(mode);return;
  }
  document.body.classList.remove('auth-mode');
  const view=views[key]||views.dashboard;
  document.title=`${view.title} — Bitey Enterprise`;
  document.querySelector('#page-title').textContent=view.title;
  document.querySelector('#app').innerHTML=view.html();
  document.querySelectorAll('.sidebar nav a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')===`#${key}`));
  bind(key);
}
async function handleAuth(key,form){
  if(!api?.configured){render();return;}
  const data=Object.fromEntries(new FormData(form));
  const result=key==='login'?await api.auth.login({email:data.email,password:data.password}):await api.auth.register(data);
  if(result?.ok && result.authenticated && result.user){saveSession(result);state=loadWorkspace();location.hash='#dashboard';render();return;}
  render();
  const note=document.querySelector('#app .notice');
  if(note)note.textContent=result?.error?.message||'Authentication failed. Check your details and try again.';
}
function bind(key){
  const form=document.querySelector('form');
  if(form&&['login','register'].includes(key))form.addEventListener('submit',e=>{e.preventDefault();handleAuth(key,form);});
  if(form&&!['login','register'].includes(key))form.addEventListener('submit',e=>{e.preventDefault();try{const data=Object.fromEntries(new FormData(form));if(key==='company')state.company={...state.company,...data};if(key==='assistant')state.assistant={...state.assistant,...data};if(key==='knowledge'&&data.url){state.knowledge.push(data.url);}save();render();}catch(err){const status=document.querySelector('#form-status');if(status)status.textContent=err.message;}});
  document.querySelectorAll('[data-remove-source]').forEach(b=>b.onclick=()=>{state.knowledge.splice(Number(b.dataset.removeSource),1);save();render();});
  document.querySelectorAll('[data-channel]').forEach(b=>b.onclick=()=>{const k=b.dataset.channel;state.channels[k]=!state.channels[k];save();render();});
}
window.addEventListener('hashchange',render);
(async()=>{session=await checkSession();state=loadWorkspace();render();})();
