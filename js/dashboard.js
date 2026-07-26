const user=currentUser(),content=document.getElementById('dashboardContent'),message=document.getElementById('sessionMessage');
if(!user){message.innerHTML='Login is required. <a class="btn btn-primary" href="index.html">Go to Login</a>'}else{
 content.classList.remove('hidden');message.textContent=`Welcome, ${user.name}. Analytics use your saved skills: ${user.skills.join(', ')}`;
 const recs=getRecommendations(user.skills),apps=load(RPPS_KEYS.applications).filter(a=>a.userId===user.id);
 document.getElementById('statProjects').textContent=load(RPPS_KEYS.projects).length;
 document.getElementById('statRecommendations').textContent=recs.filter(r=>r.score>0).length;
 document.getElementById('statApplications').textContent=apps.length;
 document.getElementById('statBestMatch').textContent=`${recs[0]?.score||0}%`;
 document.getElementById('analyticsBars').innerHTML=recs.slice(0,6).map(r=>`<div class="analytics-row"><a href="${projectUrl(r.id)}">${escapeHtml(r.title)}</a><div class="bar-track"><div class="bar-fill" style="width:${r.score}%"></div></div><strong>${r.score}%</strong></div>`).join('')||'<p>No recommendations available.</p>';
 document.getElementById('applicationTable').innerHTML=apps.map(a=>`<tr><td>${escapeHtml(a.projectTitle)}</td><td>${a.match}%</td><td>${escapeHtml(a.status)}</td><td>${new Date(a.createdAt).toLocaleDateString()}</td><td><a class="btn btn-primary" href="${projectUrl(a.projectId)}">Open</a></td></tr>`).join('')||'<tr><td colspan="5">No project applications yet.</td></tr>';
}
