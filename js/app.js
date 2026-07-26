const $=s=>document.querySelector(s);
const modal=$('#authModal'),authMessage=$('#authMessage');
function openModal(tab='login'){
  modal.classList.remove('hidden');
  const login=tab==='login';
  $('#loginForm').classList.toggle('hidden',!login);$('#registerForm').classList.toggle('hidden',login);
  $('#loginTab').classList.toggle('active',login);$('#registerTab').classList.toggle('active',!login);
  authMessage.textContent='';
  if(!login){const pending=sessionStorage.getItem(RPPS_KEYS.pendingSkills)||'';$('#registerSkills').value=pending;$('#registerSkills').required=!pending.trim();$('#skillHelp').textContent=pending.trim()?'Skills copied from your search. You can edit them before registering.':'Skills are required because no skill search was provided.'}
}
$('#menuBtn').onclick=()=>$('#mainNav').classList.toggle('open');
$('#loginOpen').onclick=()=>openModal('login');$('#registerOpen').onclick=()=>openModal('register');$('#modalClose').onclick=()=>modal.classList.add('hidden');
$('#loginTab').onclick=()=>openModal('login');$('#registerTab').onclick=()=>openModal('register');
function renderProjects(){const projects=load(RPPS_KEYS.projects);$('#projectList').innerHTML=projects.map(p=>projectCard(p)).join('')}
function renderRecommendations(skills){const normalized=normalizeSkills(skills);const msg=$('#recommendationMessage');if(!normalized.length){sessionStorage.removeItem(RPPS_KEYS.pendingSkills);msg.textContent='Enter at least one skill. New users will be asked to add skills during registration.';$('#recommendationResults').innerHTML='';if(!getSession())openModal('register');return}
 sessionStorage.setItem(RPPS_KEYS.pendingSkills,normalized.join(', '));$('#heroSkills').value=normalized.join(', ');$('#recommendSkills').value=normalized.join(', ');
 const results=getRecommendations(normalized).slice(0,6);$('#recommendationResults').innerHTML=results.map(p=>projectCard(p,true)).join('');msg.textContent=`Showing ${results.length} ranked projects for: ${normalized.join(', ')}`;
 if(!getSession())openModal('register');
}
$('#heroRecommendBtn').onclick=()=>{renderRecommendations($('#heroSkills').value);location.hash='recommendation'};
$('#recommendBtn').onclick=()=>renderRecommendations($('#recommendSkills').value);
$('#loginForm').onsubmit=async e=>{e.preventDefault();const email=$('#loginEmail').value.trim().toLowerCase(),password=$('#loginPassword').value;const user=load(RPPS_KEYS.users).find(u=>u.email===email);if(!user||await hashPassword(password,user.salt)!==user.passwordHash){authMessage.textContent='Invalid email or password.';return}setSession(user);modal.classList.add('hidden');syncNav();authMessage.textContent='';};
$('#registerForm').onsubmit=async e=>{e.preventDefault();const name=$('#registerName').value.trim(),email=$('#registerEmail').value.trim().toLowerCase(),password=$('#registerPassword').value,skills=normalizeSkills($('#registerSkills').value);if(skills.length===0){authMessage.textContent='Skills are required when no skills were supplied in the search box.';return}if(!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}/.test(password)){authMessage.textContent='Password must contain at least 8 characters, uppercase, lowercase and a number.';return}const users=load(RPPS_KEYS.users);if(users.some(u=>u.email===email)){authMessage.textContent='Email is already registered.';return}const salt=randomHex(16);const user={id:`U${Date.now()}`,name,email,skills,role:'user',salt,passwordHash:await hashPassword(password,salt),createdAt:new Date().toISOString()};users.push(user);save(RPPS_KEYS.users,users);setSession(user);sessionStorage.removeItem(RPPS_KEYS.pendingSkills);modal.classList.add('hidden');syncNav();renderRecommendations(skills)};
renderProjects();
const existing=currentUser();if(existing){$('#heroSkills').value=existing.skills.join(', ');$('#recommendSkills').value=existing.skills.join(', ')}
