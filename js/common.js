const RPPS_KEYS={users:'rpps_users',projects:'rpps_projects',applications:'rpps_applications',session:'rpps_session',pendingSkills:'rpps_pending_skills',workspaces:'rpps_workspaces',taskStates:'rpps_task_states'};
const defaultProjects=[
{id:'P001',title:'Technical Document Creation',skills:['Technical Writing','MS Word'],taskType:'daily',description:'Create technical manuals, process documents and structured project reports.',budget:500,startDate:'2026-08-01',endDate:'2026-08-15',resources:['Documentation template','Writing checklist'],videoUrl:'https://www.youtube.com/watch?v=dQw4w9WgXcQ',analyticsPoints:82},
{id:'P002',title:'Cloud Support Setup',skills:['AWS','Azure','Docker'],taskType:'weekly',description:'Configure cloud support, container deployment and operational monitoring.',budget:1200,startDate:'2026-08-05',endDate:'2026-09-05',resources:['AWS documentation','Docker guide'],videoUrl:'',analyticsPoints:88},
{id:'P003',title:'UI/UX Media Design',skills:['Figma','Adobe XD','CSS'],taskType:'monthly',description:'Design responsive user flows, wireframes and interface prototypes.',budget:900,startDate:'2026-08-10',endDate:'2026-09-30',resources:['Design system','Figma community'],videoUrl:'',analyticsPoints:76},
{id:'P004',title:'Engineering Validation',skills:['AutoCAD','Simulation'],taskType:'yearly',description:'Validate engineering drawings and simulation output against project requirements.',budget:2500,startDate:'2026-08-15',endDate:'2027-07-31',resources:['Validation checklist','Simulation standards'],videoUrl:'',analyticsPoints:91},
{id:'P005',title:'Software Testing',skills:['Selenium','JUnit','Java'],taskType:'weekly',description:'Build automated test cases, regression suites and quality reports.',budget:1400,startDate:'2026-08-03',endDate:'2026-09-20',resources:['Selenium docs','JUnit guide'],videoUrl:'',analyticsPoints:84},
{id:'P006',title:'JavaScript ETL Dashboard',skills:['JavaScript','HTML','CSS','SQL'],taskType:'monthly',description:'Build a browser-based ETL workflow and analytical project dashboard.',budget:1800,startDate:'2026-08-12',endDate:'2026-10-15',resources:['MDN JavaScript','CSV specification'],videoUrl:'',analyticsPoints:86}
];
function load(key,fallback=[]){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
function save(key,value){localStorage.setItem(key,JSON.stringify(value))}
function initData(){if(!localStorage.getItem(RPPS_KEYS.projects))save(RPPS_KEYS.projects,defaultProjects);if(!localStorage.getItem(RPPS_KEYS.users))save(RPPS_KEYS.users,[]);if(!localStorage.getItem(RPPS_KEYS.applications))save(RPPS_KEYS.applications,[]);seedAdmin()}
async function seedAdmin(){const users=load(RPPS_KEYS.users);if(users.some(u=>u.role==='admin'))return;const salt=randomHex(16);const passwordHash=await hashPassword('Admin@123',salt);users.push({id:'UADMIN',name:'RPPS Admin',email:'admin@rpps.local',skills:['JavaScript','CSV Administration'],role:'admin',salt,passwordHash,createdAt:new Date().toISOString()});save(RPPS_KEYS.users,users)}
function normalizeSkills(value){return [...new Set((Array.isArray(value)?value.join(','):String(value||'')).split(/[,;\n]/).map(s=>s.trim()).filter(Boolean))]}
function skillKey(s){return s.toLowerCase().replace(/[^a-z0-9+#.]/g,'')}
function scoreProject(project,skills){const user=new Set(normalizeSkills(skills).map(skillKey));const required=normalizeSkills(project.skills);const matched=required.filter(s=>user.has(skillKey(s)));return{...project,matched,missing:required.filter(s=>!user.has(skillKey(s))),score:required.length?Math.round(matched.length/required.length*100):0}}
function getRecommendations(skills){return load(RPPS_KEYS.projects).map(p=>scoreProject(p,skills)).sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title))}

function ensureProjectTasks(project){
 if(Array.isArray(project.tasks)&&project.tasks.length)return project.tasks;
 const skills=normalizeSkills(project.skills),base=project.id.replace(/[^a-z0-9]/gi,'');
 return [
  {id:`${base}-D1`,title:`Daily planning for ${project.title}`,taskType:'daily',priority:'high',requiredSkills:skills.slice(0,2),description:`Review the daily work plan, blockers and output for ${project.title}.`,budget:Math.round((project.budget||0)*0.08),startDate:project.startDate,endDate:project.startDate,resources:project.resources||[],videoUrl:project.videoUrl||''},
  {id:`${base}-W1`,title:`Weekly execution review`,taskType:'weekly',priority:'medium',requiredSkills:skills,description:`Complete the weekly implementation and quality review for ${project.title}.`,budget:Math.round((project.budget||0)*0.2),startDate:project.startDate,endDate:project.endDate,resources:project.resources||[],videoUrl:project.videoUrl||''},
  {id:`${base}-M1`,title:`Monthly performance milestone`,taskType:'monthly',priority:'low',requiredSkills:skills,description:`Prepare monthly progress, performance and risk analytics for ${project.title}.`,budget:Math.round((project.budget||0)*0.35),startDate:project.startDate,endDate:project.endDate,resources:project.resources||[],videoUrl:project.videoUrl||''},
  {id:`${base}-Y1`,title:`Yearly project delivery`,taskType:'yearly',priority:'milestone',requiredSkills:skills,description:`Complete final project delivery, validation and closure for ${project.title}.`,budget:project.budget||0,startDate:project.startDate,endDate:project.endDate,resources:project.resources||[],videoUrl:project.videoUrl||''}
 ];
}

function randomHex(bytes){const a=new Uint8Array(bytes);crypto.getRandomValues(a);return [...a].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function hashPassword(password,salt){const data=new TextEncoder().encode(`${salt}:${password}`);const hash=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function setSession(user){sessionStorage.setItem(RPPS_KEYS.session,JSON.stringify({userId:user.id,email:user.email,role:user.role,expiresAt:Date.now()+30*60*1000}))}
function getSession(){try{const s=JSON.parse(sessionStorage.getItem(RPPS_KEYS.session));if(!s||s.expiresAt<Date.now()){sessionStorage.removeItem(RPPS_KEYS.session);return null}return s}catch{return null}}
function currentUser(){const s=getSession();return s?load(RPPS_KEYS.users).find(u=>u.id===s.userId):null}
function logout(){sessionStorage.removeItem(RPPS_KEYS.session);location.href='index.html'}
function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function projectUrl(id){return `project-details.html?id=${encodeURIComponent(id)}`}
function projectCard(p,withScore=false){return `<article class="project-card" data-project-id="${escapeHtml(p.id)}"><h3>${escapeHtml(p.title)}</h3>${withScore?`<div class="match">${p.score}% match</div>`:''}<p>${escapeHtml(p.description)}</p><div class="skill-tags">${normalizeSkills(p.skills).map(s=>`<span>${escapeHtml(s)}</span>`).join('')}</div><p><strong>Task:</strong> ${escapeHtml(p.taskType)}</p><a class="btn btn-primary" href="${projectUrl(p.id)}">Open Project</a></article>`}
function csvEscape(v){const s=Array.isArray(v)?v.join('|'):String(v??'');return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s}
function downloadCsv(name,rows,columns){const content=[columns.join(','),...rows.map(r=>columns.map(c=>csvEscape(r[c])).join(','))].join('\n');const blob=new Blob([content],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href)}
function parseCsv(text){const rows=[];let row=[],field='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];if(c==='"'&&quoted&&n==='"'){field+='"';i++}else if(c==='"'){quoted=!quoted}else if(c===','&&!quoted){row.push(field);field=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&n==='\n')i++;row.push(field);if(row.some(x=>x.trim()))rows.push(row);row=[];field=''}else field+=c}row.push(field);if(row.some(x=>x.trim()))rows.push(row);const headers=(rows.shift()||[]).map(h=>h.trim());return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,(r[i]||'').trim()]))) }
function syncNav(){const s=getSession();document.querySelectorAll('#logoutBtn').forEach(b=>{b.classList.toggle('hidden',!s);b.onclick=logout});document.querySelectorAll('#csvAdminLink').forEach(a=>a.classList.toggle('hidden',s?.role!=='admin'))}
initData();syncNav();
