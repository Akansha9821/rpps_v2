const params=new URLSearchParams(location.search),projectId=params.get('id');
const projects=load(RPPS_KEYS.projects),project=projects.find(p=>p.id===projectId),msg=document.getElementById('workspaceMessage');
let activeType='daily',activeTaskId=null;

if(!project){
 document.querySelector('.workspace-main').innerHTML='<section class="project-form-card"><h1>Project not found</h1><a class="btn btn-primary" href="index.html#projects">Return to projects</a></section>';
}else{
 document.title=`${project.title} | RPPS`;
 const tasks=ensureProjectTasks(project);
 document.getElementById('selectedProjectMini').innerHTML=`<div class="selected-project-mini"><strong>${escapeHtml(project.title)}</strong><small>${escapeHtml(normalizeSkills(project.skills).join(', '))}</small></div>`;

 function taskState(){return load(RPPS_KEYS.taskStates,{})}
 function taskStatus(task){return taskState()[`${project.id}:${task.id}`]||{status:'pending',priority:task.priority}}
 function renderCounts(){
   ['daily','weekly','monthly','yearly'].forEach(type=>{
     const typeTasks=tasks.filter(t=>t.taskType===type),active=typeTasks.filter(t=>taskStatus(t).status==='active').length;
     const high=typeTasks.filter(t=>(taskStatus(t).priority||t.priority)==='high').length;
     document.getElementById(`${type}Count`).textContent=`${active}/${typeTasks.length} Active${high?` • ${high} High`:''}`;
   });
 }
 function renderSidebar(type){
   activeType=type;
   document.querySelectorAll('.summary-tab').forEach(b=>b.classList.toggle('active',b.dataset.type===type));
   const list=tasks.filter(t=>t.taskType===type);
   document.getElementById('sidebarHeading').textContent=`${type[0].toUpperCase()+type.slice(1)} Tasks`;
   document.getElementById('taskSidebarList').innerHTML=list.map(t=>{const state=taskStatus(t);return `<button class="task-list-item ${t.id===activeTaskId?'active':''}" data-task-id="${escapeHtml(t.id)}"><span><strong>${escapeHtml(t.title)}</strong><small>${escapeHtml(t.requiredSkills.join(', '))}</small></span><em class="priority ${escapeHtml(state.priority||t.priority)}">${escapeHtml((state.priority||t.priority).toUpperCase())}</em></button>`}).join('')||'<p class="empty-state">No tasks in this category.</p>';
   document.querySelectorAll('[data-task-id]').forEach(btn=>btn.onclick=()=>selectTask(btn.dataset.taskId));
   if(list.length&&!list.some(t=>t.id===activeTaskId))selectTask(list[0].id);
 }
 function selectTask(id){
   const task=tasks.find(t=>t.id===id);if(!task)return;activeTaskId=id;activeType=task.taskType;
   const saved=taskState()[`${project.id}:${task.id}`]||{};
   document.querySelectorAll('.summary-tab').forEach(b=>b.classList.toggle('active',b.dataset.type===activeType));
   document.querySelectorAll('.task-list-item').forEach(b=>b.classList.toggle('active',b.dataset.taskId===id));
   document.getElementById('taskBadge').textContent=`${task.taskType.toUpperCase()} • ${(saved.priority||task.priority).toUpperCase()}`;
   document.getElementById('detailTitle').value=task.title;
   document.getElementById('detailSkills').value=task.requiredSkills.join(', ');
   document.getElementById('detailStart').value=saved.startDate||task.startDate||project.startDate||'';
   document.getElementById('detailEnd').value=saved.endDate||task.endDate||project.endDate||'';
   document.getElementById('detailPriority').value=saved.priority||task.priority;
   document.getElementById('detailBudget').value=saved.budget??task.budget??project.budget??0;
   document.getElementById('detailDescription').value=saved.description||task.description||project.description||'';
   document.getElementById('detailResources').innerHTML=(task.resources||project.resources||[]).map(r=>`<a href="#" onclick="return false">${escapeHtml(r)}</a>`).join('')||'No resources supplied.';
   renderVideo(task.videoUrl||project.videoUrl);
 }
 function renderVideo(url){
   const box=document.getElementById('videoContainer');
   if(!url){box.innerHTML='<div class="video-placeholder">No project video has been added.</div>';return}
   const yt=url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{6,})/);
   box.innerHTML=yt?`<iframe src="https://www.youtube.com/embed/${escapeHtml(yt[1])}" title="Project video" allowfullscreen></iframe>`:`<video controls preload="metadata"><source src="${escapeHtml(url)}">Your browser does not support video.</video>`;
 }
 document.querySelectorAll('.summary-tab').forEach(btn=>btn.onclick=()=>renderSidebar(btn.dataset.type));
 document.getElementById('saveWorkspaceBtn').onclick=()=>{
   const task=tasks.find(t=>t.id===activeTaskId);if(!task)return;
   const states=taskState(),priority=document.getElementById('detailPriority').value;
   states[`${project.id}:${task.id}`]={status:'active',priority,startDate:document.getElementById('detailStart').value,endDate:document.getElementById('detailEnd').value,budget:Number(document.getElementById('detailBudget').value||0),description:document.getElementById('detailDescription').value,updatedAt:new Date().toISOString()};
   save(RPPS_KEYS.taskStates,states);renderCounts();renderSidebar(task.taskType);selectTask(task.id);
   msg.textContent=`${task.title} saved as an active ${task.taskType} task with ${priority} priority. Task counts have been updated.`;
 };
 renderCounts();
 const firstType=tasks.find(t=>t.taskType==='daily')?'daily':tasks[0]?.taskType||'daily';renderSidebar(firstType);
}
