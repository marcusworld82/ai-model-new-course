
const STORAGE_KEY = 'aiCourseCompleted';
const completed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(completed)); }
function slug(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

const tmpl          = document.getElementById('courseMarkdown');
const mainView      = document.getElementById('mainView');
const lessonView    = document.getElementById('lessonView');
const nav           = document.getElementById('moduleNav');
const progressBar   = document.getElementById('progressBar');
const progressText  = document.getElementById('progressText');
const modulesDoneEl = document.getElementById('modulesDone');
const lessonsDoneEl = document.getElementById('lessonsDone');
const nextTitle     = document.getElementById('nextLessonTitle');
const nextDesc      = document.getElementById('nextLessonDesc');
const promptLib     = document.getElementById('promptLibrary');
const sidebar       = document.getElementById('sidebar');
const menuToggle    = document.getElementById('menuToggle');
const closeBtn      = document.getElementById('closeSidebar');
const startBtn      = document.getElementById('startCourseBtn');
const resumeBtn     = document.getElementById('resumeBtn');
const resumeBtn2    = document.getElementById('resumeBtn2');
const brandLink     = document.getElementById('brandLink');

// Parse markdown into modules
const raw = tmpl ? tmpl.innerHTML.trim() : '';
const lines = raw.split(/\r?\n/);
const modules = [];
let curMod = null, curLesson = null;
const allPromptsFlat = [];

for(let i=0;i<lines.length;i++){
  const line=lines[i], trim=line.trim();
  if(!trim||trim==='---') continue;
  if(/^# [^#]/.test(line)) continue;

  if(/^## [^#]/.test(line)){
    curLesson=null;
    const title=trim.slice(3).trim();
    curMod={title,id:slug(title),lessons:[],_intro:''};
    modules.push(curMod);
    continue;
  }
  if(/^### [^#]/.test(line)){
    const title=trim.slice(4).trim();
    curLesson={title,id:slug(title),body:'',prompts:[]};
    if(curMod) curMod.lessons.push(curLesson);
    continue;
  }
  if(trim.startsWith('```')){
    let code='';i++;
    while(i<lines.length&&!lines[i].trim().startsWith('```')){code+=lines[i]+'\n';i++;}
    const c=code.trim();
    allPromptsFlat.push(c);
    if(curLesson){
      curLesson.prompts.push(c);
      curLesson.body+=`<div class="code-box"><button class="copy-btn">Copy</button><pre><code>${esc(c)}</code></pre></div>`;
    }
    continue;
  }
  if(trim.startsWith('|')){
    let tbl='<div class="table-wrap"><table><tbody>';
    while(i<lines.length&&lines[i].trim().startsWith('|')){
      if(lines[i].includes('---')){i++;continue;}
      const cells=lines[i].split('|').filter(c=>c.trim());
      tbl+='<tr>'+cells.map(c=>`<td>${esc(c.trim())}</td>`).join('')+'</tr>';i++;
    }
    tbl+='</tbody></table></div>';i--;
    if(curLesson)curLesson.body+=tbl;
    continue;
  }
  if(trim.startsWith('- ')){
    let ul='<ul>';
    while(i<lines.length&&lines[i].trim().startsWith('- ')){ul+=`<li>${esc(lines[i].trim().slice(2))}</li>`;i++;}
    ul+='</ul>';i--;
    if(curLesson)curLesson.body+=ul;
    else if(curMod)curMod._intro+=ul;
    continue;
  }
  if(/^\d+\. /.test(trim)){
    let ol='<ol>';
    while(i<lines.length&&/^\d+\. /.test((lines[i]||'').trim())){
      ol+=`<li>${esc(lines[i].trim().replace(/^\d+\. /,''))}</li>`;i++;
    }
    ol+='</ol>';i--;
    if(curLesson)curLesson.body+=ol;
    continue;
  }
  if(trim){
    const tag=`<p>${esc(trim)}</p>`;
    if(curLesson)curLesson.body+=tag;
    else if(curMod)curMod._intro+=tag;
  }
}

// Helpers
function isModComplete(mod){ return mod.lessons.length>0&&mod.lessons.every(l=>completed[l.id]); }
function isModUnlocked(mi){ return mi===0||isModComplete(modules[mi-1]); }
function allLessons(){ return modules.flatMap(m=>m.lessons); }
function firstIncomplete(){ return allLessons().find(l=>!completed[l.id])||null; }

let currentLessonId = null;

// Show dashboard
function showDashboard(){
  currentLessonId=null;
  mainView.style.display='block';
  lessonView.style.display='none';
  lessonView.innerHTML='';
  updateProgress();
  renderNav();
  window.scrollTo({top:0,behavior:'smooth'});
}

// Show single lesson
function showLesson(lessonId){
  const lesson=allLessons().find(l=>l.id===lessonId);
  if(!lesson)return;
  const modIdx=modules.findIndex(m=>m.lessons.some(l=>l.id===lessonId));
  if(!isModUnlocked(modIdx))return;

  currentLessonId=lessonId;
  localStorage.setItem('aiCourseLastLesson',lessonId);
  mainView.style.display='none';
  lessonView.style.display='block';

  const mod=modules[modIdx];
  const lessonIdx=mod.lessons.findIndex(l=>l.id===lessonId);
  const done=!!completed[lessonId];
  const prevLesson=lessonIdx>0?mod.lessons[lessonIdx-1]:(modIdx>0?modules[modIdx-1].lessons.slice(-1)[0]:null);
  const nextLesson=lessonIdx<mod.lessons.length-1
    ?mod.lessons[lessonIdx+1]
    :(modIdx<modules.length-1&&isModUnlocked(modIdx+1)?modules[modIdx+1].lessons[0]:null);

  lessonView.innerHTML=`
    <div class="lesson-page">
      <div class="lesson-breadcrumb">
        <button class="back-btn" id="backBtn">&#8592; Dashboard</button>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-mod">${esc(mod.title)}</span>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-lesson">${esc(lesson.title)}</span>
      </div>
      <div class="lesson-card-full${done?' done':''}">
        <div class="lesson-card-header">
          <span class="status-pill${done?' done':''}">${done?'&#10003; Complete':'Lesson '+(lessonIdx+1)+' of '+mod.lessons.length}</span>
          <h1 class="lesson-title-main">${esc(lesson.title)}</h1>
        </div>
        <div class="lesson-body">${lesson.body}</div>
        <div class="lesson-footer">
          <div class="lesson-nav-btns">
            ${prevLesson?`<button class="nav-lesson-btn" data-id="${prevLesson.id}">&#8592; Previous</button>`:'<span></span>'}
            <button class="mark-complete${done?' done':''}" data-id="${lessonId}"${done?' disabled':''}>
              ${done?'&#10003; Completed':'Mark as Complete'}
            </button>
            ${done&&nextLesson?`<button class="nav-lesson-btn next-btn" data-id="${nextLesson.id}">Next &#8594;</button>`:'<span></span>'}
          </div>
          ${isModComplete(mod)?`<div class="mod-complete-banner">&#127881; ${mod.title} Complete!${modIdx<modules.length-1?' The next module is now unlocked.':''}</div>`:''}
        </div>
      </div>
    </div>`;

  document.getElementById('backBtn')?.addEventListener('click',showDashboard);
  attachCopyBtns(lessonView);
  renderNav();
  updateProgress();
  window.scrollTo({top:0,behavior:'smooth'});
}

function attachCopyBtns(root){
  (root||document).querySelectorAll('.copy-btn').forEach(btn=>{
    btn.onclick=()=>{
      const txt=btn.nextElementSibling?.innerText||'';
      navigator.clipboard.writeText(txt);
      btn.textContent='Copied';
      setTimeout(()=>btn.textContent='Copy',1400);
    };
  });
}

// Event delegation
document.addEventListener('click',e=>{
  if(e.target.classList.contains('mark-complete')&&!e.target.disabled){
    const id=e.target.dataset.id;
    completed[id]=true;
    save();
    showLesson(id);
  }
  if(e.target.classList.contains('nav-lesson-btn')){
    showLesson(e.target.dataset.id);
  }
  if(e.target.classList.contains('pl-toggle')){
    const body=document.getElementById(e.target.dataset.target);
    if(!body)return;
    const open=body.style.display==='block';
    body.style.display=open?'none':'block';
    const arr=e.target.querySelector('.pl-arrow');
    if(arr)arr.textContent=open?'\u25BC':'\u25B2';
  }
});

// Sidebar nav
function renderNav(){
  nav.innerHTML='';
  modules.forEach((mod,mi)=>{
    const unlocked=isModUnlocked(mi);
    const complete=isModComplete(mod);
    const doneLessons=mod.lessons.filter(l=>completed[l.id]).length;
    const details=document.createElement('details');
    if(!unlocked)details.classList.add('nav-locked');

    const summary=document.createElement('summary');
    summary.innerHTML=`
      <span class="nav-icon">${complete?'&#10003;':!unlocked?'&#128274;':''}</span>
      <span class="nav-mod-label">Mod ${mi+1}</span>
      <span class="nav-mod-name">${esc(mod.title)}</span>
      <span class="nav-count">${doneLessons}/${mod.lessons.length}</span>`;
    if(!unlocked) summary.addEventListener('click',e=>e.preventDefault());
    details.appendChild(summary);

    if(unlocked){
      const list=document.createElement('div');
      list.className='lesson-list';
      mod.lessons.forEach((l,li)=>{
        const btn=document.createElement('button');
        btn.className='lesson-link'+(completed[l.id]?' done':'')+(currentLessonId===l.id?' active':'');
        btn.innerHTML=`<span class="ll-num">${li+1}</span><span class="ll-title">${esc(l.title)}</span>${completed[l.id]?'<span class="ll-check">&#10003;</span>':''}`;
        btn.addEventListener('click',()=>{showLesson(l.id);sidebar.classList.remove('open');});
        list.appendChild(btn);
      });
      details.appendChild(list);
    }
    nav.appendChild(details);
  });
}

// Prompt library
function renderPromptLibrary(){
  if(!promptLib)return;
  let html='';
  modules.forEach(mod=>{
    mod.lessons.forEach(l=>{
      if(!l.prompts.length)return;
      const id='pl-'+l.id;
      html+=`<div class="pl-group">
        <button class="pl-toggle" data-target="${id}">
          <span>${esc(l.title)}</span><span class="pl-arrow">&#9660;</span>
        </button>
        <div class="pl-body" id="${id}" style="display:none">
          ${l.prompts.map(p=>`<div class="code-box" style="margin-top:10px"><button class="copy-btn">Copy</button><pre><code>${esc(p)}</code></pre></div>`).join('')}
        </div>
      </div>`;
    });
  });
  promptLib.innerHTML=html||'<p class="muted">Prompts appear here as you work through lessons.</p>';
  attachCopyBtns(promptLib);
}

// Progress
function updateProgress(){
  const all=allLessons();
  const done=all.filter(l=>completed[l.id]).length;
  const pct=all.length?Math.round(done/all.length*100):0;
  progressBar.style.width=pct+'%';
  progressText.textContent=pct+'%';
  if(lessonsDoneEl) lessonsDoneEl.textContent=done;
  if(modulesDoneEl) modulesDoneEl.textContent=modules.filter((_,i)=>isModComplete(modules[i])).length;
  const next=firstIncomplete();
  if(next&&nextTitle){
    nextTitle.textContent=next.title;
    if(nextDesc) nextDesc.textContent=next.body.replace(/<[^>]+>/g,' ').trim().slice(0,140)||'Continue through the course.';
    localStorage.setItem('aiCourseLastLesson',next.id);
  }
}

// Start / Resume
startBtn?.addEventListener('click',()=>{
  const first=allLessons()[0];
  if(first)showLesson(first.id);
});
[resumeBtn,resumeBtn2].forEach(btn=>btn?.addEventListener('click',()=>{
  const id=localStorage.getItem('aiCourseLastLesson')||allLessons()[0]?.id;
  if(id)showLesson(id);
}));
brandLink?.addEventListener('click',e=>{e.preventDefault();showDashboard();});

// Mobile sidebar
menuToggle?.addEventListener('click',()=>sidebar.classList.add('open'));
closeBtn?.addEventListener('click',()=>sidebar.classList.remove('open'));

// Init
renderNav();
renderPromptLibrary();
updateProgress();
showDashboard();
