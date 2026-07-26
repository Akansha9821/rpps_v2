const session=getSession(),adminContent=document.getElementById('adminContent'),adminMessage=document.getElementById('adminMessage');
function refreshAdminAnalytics(){
 const users=load(RPPS_KEYS.users),projects=load(RPPS_KEYS.projects),allSkills=[...new Set(users.flatMap(u=>normalizeSkills(u.skills).map(skillKey)))];
 const scored=users.filter(u=>u.role!=='admin').flatMap(u=>getRecommendations(u.skills));
 document.getElementById('csvUserCount').textContent=users.length;
 document.getElementById('csvSkillCount').textContent=allSkills.length;
 document.getElementById('csvProjectCount').textContent=projects.length;
 document.getElementById('csvAverageMatch').textContent=`${scored.length?Math.round(scored.reduce((a,b)=>a+b.score,0)/scored.length):0}%`;
 const frequency={};users.forEach(u=>normalizeSkills(u.skills).forEach(s=>frequency[s]=(frequency[s]||0)+1));
 document.getElementById('skillAnalytics').innerHTML=Object.entries(frequency).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([s,n])=>`<div class="analytics-row"><span>${escapeHtml(s)}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.min(100,n/Math.max(1,users.length)*100)}%"></div></div><strong>${n}</strong></div>`).join('')||'<p>No user skill data available.</p>';
}
if(session?.role!=='admin'){adminMessage.innerHTML='Access denied. Login using the demo administrator account from the README.'}else{
 adminContent.classList.remove('hidden');adminMessage.textContent='Administrator access granted. Uploaded CSV data is stored in this browser only.';refreshAdminAnalytics();
 document.querySelectorAll('[data-export]').forEach(btn=>btn.onclick=()=>{
   const type=btn.dataset.export,users=load(RPPS_KEYS.users),projects=load(RPPS_KEYS.projects);
   if(type==='users'){const rows=users.map(({id,name,email,role,skills,createdAt})=>({id,name,email,role,skills,createdAt}));downloadCsv('rpps_users.csv',rows,['id','name','email','role','skills','createdAt'])}
   if(type==='projects')downloadCsv('rpps_projects.csv',projects,['id','title','skills','taskType','description','budget','startDate','endDate','resources','videoUrl','analyticsPoints']);
   if(type==='skills'){const rows=users.flatMap(u=>normalizeSkills(u.skills).map(skill=>({email:u.email,skills:skill})));downloadCsv('rpps_skills.csv',rows,['email','skills'])}
   if(type==='analytics'){const rows=users.filter(u=>u.role!=='admin').flatMap(u=>getRecommendations(u.skills).map(r=>({userId:u.id,userEmail:u.email,projectId:r.id,projectTitle:r.title,matchPercent:r.score,analyticsPoints:r.analyticsPoints||0,matchedSkills:r.matched,missingSkills:r.missing})));downloadCsv('rpps_recommendation_analytics.csv',rows,['userId','userEmail','projectId','projectTitle','matchPercent','analyticsPoints','matchedSkills','missingSkills'])}
   if(type==='analyticsPoints'){downloadCsv('rpps_analytics_points.csv',projects.map(p=>({projectId:p.id,analyticsPoints:p.analyticsPoints||0})),['projectId','analyticsPoints'])}
   if(type==='tasks'){const states=load(RPPS_KEYS.taskStates,{}),rows=Object.entries(states).map(([key,v])=>{const [projectId,taskId]=key.split(':');return{projectId,taskId,...v}});downloadCsv('rpps_task_status.csv',rows,['projectId','taskId','status','priority','startDate','endDate','budget','description','updatedAt'])}
 });
 document.getElementById('projectCsvImport').onchange=async e=>{const rows=parseCsv(await e.target.files[0].text());const imported=rows.filter(r=>r.id&&r.title).map(r=>({id:r.id,title:r.title,skills:normalizeSkills((r.skills||'').replace(/\|/g,',')),taskType:(r.taskType||'monthly').toLowerCase(),description:r.description||'',budget:Number(r.budget||0),startDate:r.startDate||'',endDate:r.endDate||'',resources:normalizeSkills((r.resources||'').replace(/\|/g,',')),videoUrl:r.videoUrl||'',analyticsPoints:Number(r.analyticsPoints||0)}));if(!imported.length){adminMessage.textContent='No valid project rows found.';return}save(RPPS_KEYS.projects,imported);adminMessage.textContent=`Imported ${imported.length} projects.`;refreshAdminAnalytics()};
 document.getElementById('skillCsvImport').onchange=async e=>{const rows=parseCsv(await e.target.files[0].text()),users=load(RPPS_KEYS.users);let updated=0;rows.forEach(r=>{const u=users.find(x=>x.email.toLowerCase()===(r.email||'').toLowerCase());if(u){u.skills=normalizeSkills([...(u.skills||[]),...normalizeSkills((r.skills||'').replace(/\|/g,','))]);updated++}});save(RPPS_KEYS.users,users);adminMessage.textContent=`Updated skills for ${updated} CSV rows.`;refreshAdminAnalytics()};
 document.getElementById('analyticsCsvImport').onchange=async e=>{const rows=parseCsv(await e.target.files[0].text()),projects=load(RPPS_KEYS.projects);let updated=0;rows.forEach(r=>{const p=projects.find(x=>x.id===(r.projectId||r.id));if(p){p.analyticsPoints=Math.max(0,Number(r.analyticsPoints||0));updated++}});save(RPPS_KEYS.projects,projects);adminMessage.textContent=`Updated analytics points for ${updated} projects.`;refreshAdminAnalytics()};
}
