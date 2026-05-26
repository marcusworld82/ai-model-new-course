
// ── State ──────────────────────────────────────────────────────────────
const STORAGE_KEY = 'aiCourseCompleted';
const completed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

// ── DOM refs ────────────────────────────────────────────────────────────
const tmpl        = document.getElementById('courseMarkdown');
const content     = document.getElementById('courseContent');
const nav         = document.getElementById('moduleNav');
const progressBar = document.getElementById('progressBar');
const progressText= document.getElementById('progressText');
const modulesDoneEl = document.getElementById('modulesDone');
const lessonsDoneEl = document.getElementById('lessonsDone');
const resumeBtn   = document.getElementById('resumeBtn');
const nextTitle   = document.getElementById('nextLessonTitle');
const nextDesc    = document.getElementById('nextLessonDesc');
const promptLib   = document.getElementById('promptLibrary');
const sidebar     = document.getElementById('sidebar');
const menuToggle  = document.getElementById('menuToggle');
const closeBtn    = document.getElementById('closeSidebar');

// ── Helpers ─────────────────────────────────────────────────────────────
function slug(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(completed)); }

// ── Parse markdown into modules ─────────────────────────────────────────
const raw = tmpl ? tmpl.innerHTML.trim() : '';
const lines = raw.split(/\r?\n/);
const modules = [];   // [{title, id, lessons:[{title,id,prompts:[],body:''}]}]
let curMod = null, curLesson = null;
let allPrompts = [];  // all code blocks for prompt library

for(let i=0;i<lines.length;i++){
  const line = lines[i];
  const trim = line.trim();
  if(!trim || trim==='---') continue;

  // H1 skip
  if(/^# [^#]/.test(line)) continue;

  // H2 = module
  if(/^## [^#]/.test(line)){
    curLesson = null;
    const title = trim.slice(3).trim();
    curMod = {title, id:slug(title), lessons:[]};
    modules.push(curMod);
    continue;
  }

  // H3 = lesson
  if(/^### [^#]/.test(line)){
    const title = trim.slice(4).trim();
    curLesson = {title, id:slug(title), body:'', prompts:[]};
    if(curMod) curMod.lessons.push(curLesson);
    continue;
  }

  // code block
  if(trim.startsWith('```')){
    let code=''; i++;
    while(i<lines.length && !lines[i].trim().startsWith('```')){ code+=lines[i]+'\n'; i++; }
    const codeClean = code.trim();
    allPrompts.push(codeClean);
    if(curLesson) curLesson.prompts.push(codeClean);
    if(curLesson) curLesson.body += `<div class="code-box"><button class="copy-btn">Copy</button><pre><code>${esc(codeClean)}</code></pre></div>`;
    continue;
  }

  // table
  if(trim.startsWith('|')){
    let tbl='<div class="table-wrap"><table><tbody>';
    while(i<lines.length && lines[i].trim().startsWith('|')){
      if(lines[i].includes('---')){i++;continue;}
      const cells=lines[i].split('|').filter(c=>c.trim());
      tbl+='<tr>'+cells.map(c=>`<td>${esc(c.trim())}</td>`).join('')+'</tr>';
      i++;
    }
    tbl+='</tbody></table></div>'; i--;
    if(curLesson) curLesson.body+=tbl;
    continue;
  }

  // ul
  if(trim.startsWith('- ')){
    let ul='<ul>';
    while(i<lines.length && lines[i].trim().startsWith('- ')){
      ul+=`<li>${esc(lines[i].trim().slice(2))}</li>`; i++;
    }
    ul+='</ul>'; i--;
    if(curLesson) curLesson.body+=ul;
    else if(curMod && !curLesson) curMod._intro=(curMod._intro||'') + ul;
    continue;
  }

  // ol
  if(/^\d+\. /.test(trim)){
    let ol='<ol>';
    while(i<lines.length && /^\d+\. /.test((lines[i]||'').trim())){
      ol+=`<li>${esc(lines[i].trim().replace(/^\d+\. /,''))}</li>`; i++;
    }
    ol+='</ol>'; i--;
    if(curLesson) curLesson.body+=ol;
    continue;
  }

  // paragraph
  if(trim){
    const special = /^(pro tip|action step|prompt rule|best practice|review checklist|example)/i.test(trim);
    const tag = special ? `<p class="callout-p">${esc(trim)}</p>` : `<p>${esc(trim)}</p>`;
    if(curLesson) curLesson.body+=tag;
    else if(curMod) curMod._intro=(curMod._intro||'')+tag;
  }
}

// ── Determine unlock state ──────────────────────────────────────────────
function isModuleComplete(mod){
  return mod.lessons.length > 0 && mod.lessons.every(l=>completed[l.id]);
}
function isModuleUnlocked(modIndex){
  if(modIndex===0) return true;
  return isModuleComplete(modules[modIndex-1]);
}
function firstIncompleteLessonId(){
  for(const mod of modules){
    for(const l of mod.lessons){
      if(!completed[l.id]) return l.id;
    }
  }
  return null;
}

// ── Render lesson card HTML ─────────────────────────────────────────────
function lessonCardHTML(lesson, modIndex){
  const unlocked = isModuleUnlocked(modIndex);
  const done = completed[lesson.id];
  return `
  <div class="lesson-card ${done?'done':''} ${!unlocked?'locked':''}" id="${lesson.id}">
    <div class="lesson-card-header">
      <span class="status-pill ${done?'done':''}">${done?'&#10003; Complete':'Lesson'}</span>
      <span class="lesson-title-main">${esc(lesson.title)}</span>
    </div>
    <div class="lesson-body">${lesson.body}</div>
    <div class="lesson-footer">
      <button class="mark-complete ${done?'done':''}" data-id="${lesson.id}" ${!unlocked?'disabled':''}>
        ${done?'&#10003; Completed':'Mark as Complete'}
      </button>
    </div>
  </div>`;
}

// ── Render all module sections ──────────────────────────────────────────
function renderContent(){
  let out='';
  modules.forEach((mod,mi)=>{
    const unlocked = isModuleUnlocked(mi);
    const complete = isModuleComplete(mod);
    out+=`<section class="module-section ${complete?'module-done':''} ${!unlocked?'module-locked':''}" id="mod-${mod.id}">`;
    out+=`<div class="module-header-bar">
      <span class="module-number">Module ${mi+1}</span>
      <h2 class="module-title">${esc(mod.title)}</h2>
      ${complete?'<span class="module-badge">&#10003; Module Complete</span>':''}
      ${!unlocked?'<span class="module-badge locked-badge">&#128274; Locked</span>':''}
    </div>`;
    if(unlocked){
      if(mod._intro) out+=`<div class="module-intro">${mod._intro}</div>`;
      out+=`<div class="lessons-wrap">`;
      mod.lessons.forEach(l=>{ out+=lessonCardHTML(l,mi); });
      out+=`</div>`;
    } else {
      out+=`<div class="locked-notice">Complete the previous module to unlock this one.</div>`;
    }
    out+=`</section>`;
  });
  content.innerHTML=out;
  attachCopyButtons();
}

function attachCopyButtons(){
  document.querySelectorAll('.copy-btn').forEach(btn=>{
    btn.onclick=()=>{
      const txt=btn.nextElementSibling?.innerText||'';
      navigator.clipboard.writeText(txt);
      btn.textContent='Copied';
      setTimeout(()=>btn.textContent='Copy',1400);
    };
  });
}

// ── Render sidebar ──────────────────────────────────────────────────────
function renderNav(){
  nav.innerHTML='';
  modules.forEach((mod,mi)=>{
    const unlocked = isModuleUnlocked(mi);
    const complete = isModuleComplete(mod);
    const doneLessons = mod.lessons.filter(l=>completed[l.id]).length;

    const details = document.createElement('details');
    if(!unlocked) details.classList.add('nav-locked');
    if(unlocked && !complete) details.open=true; // open current module

    const summary = document.createElement('summary');
    summary.innerHTML=`
      <span class="nav-mod-icon">${complete?'&#10003;':!unlocked?'&#128274;':''}</span>
      <span class="nav-mod-title">${esc(mod.title)}</span>
      <span class="nav-mod-count">${doneLessons}/${mod.lessons.length}</span>
    `;
    if(!unlocked){
      summary.onclick=(e)=>{ e.preventDefault(); };
    }
    details.appendChild(summary);

    if(unlocked){
      const list = document.createElement('div');
      list.className='lesson-list';
      mod.lessons.forEach(l=>{
        const a=document.createElement('a');
        a.href=`#${l.id}`;
        a.className='lesson-link'+(completed[l.id]?' done':'');
        a.dataset.target=l.id;
        a.innerHTML=`<span class="ll-check">${completed[l.id]?'&#10003;':''}</span><span>${esc(l.title)}</span>`;
        a.onclick=()=>sidebar.classList.remove('open');
        list.appendChild(a);
      });
      details.appendChild(list);
    }
    nav.appendChild(details);
  });
}

// ── Prompt Library ──────────────────────────────────────────────────────
function renderPromptLibrary(){
  if(!promptLib) return;
  // Group prompts by lesson
  let html='';
  modules.forEach((mod,mi)=>{
    mod.lessons.forEach(l=>{
      if(!l.prompts.length) return;
      const id='pl-'+l.id;
      html+=`<div class="pl-group">
        <button class="pl-toggle" data-target="${id}">${esc(l.title)} <span class="pl-arrow">&#9660;</span></button>
        <div class="pl-body" id="${id}" style="display:none">
          ${l.prompts.map((p,pi)=>`
            <div class="code-box" style="margin-top:10px">
              <button class="copy-btn">Copy</button>
              <pre><code>${esc(p)}</code></pre>
            </div>`).join('')}
        </div>
      </div>`;
    });
  });
  promptLib.innerHTML = html || '<p style="color:#a7a7a7;font-size:14px">Prompts will appear here as you progress through lessons.</p>';
  attachCopyButtons();

  document.querySelectorAll('.pl-toggle').forEach(btn=>{
    btn.onclick=()=>{
      const body=document.getElementById(btn.dataset.target);
      const open=body.style.display==='block';
      body.style.display=open?'none':'block';
      btn.querySelector('.pl-arrow').textContent=open?'\u25BC':'\u25B2';
    };
  });
}

// ── Progress ────────────────────────────────────────────────────────────
function updateProgress(){
  const allLessons=modules.flatMap(m=>m.lessons);
  const done=allLessons.filter(l=>completed[l.id]).length;
  const pct=allLessons.length?Math.round(done/allLessons.length*100):0;
  progressBar.style.width=pct+'%';
  progressText.textContent=pct+'%';
  lessonsDoneEl.textContent=done;
  const completedMods=modules.filter(m=>isModuleComplete(m)).length;
  modulesDoneEl.textContent=completedMods;

  const nextId=firstIncompleteLessonId();
  if(nextId){
    const mod=modules.find(m=>m.lessons.some(l=>l.id===nextId));
    const lesson=mod?.lessons.find(l=>l.id===nextId);
    if(lesson){
      nextTitle.textContent=lesson.title;
      nextDesc.textContent=(lesson.body.replace(/<[^>]+>/g,' ').trim().slice(0,140))||'Continue through the course.';
      localStorage.setItem('aiCourseLastLesson',nextId);
    }
  }
}

// ── Mark complete handler ───────────────────────────────────────────────
document.addEventListener('click',e=>{
  if(e.target.classList.contains('mark-complete') && !e.target.disabled){
    const id=e.target.dataset.id;
    completed[id]=true;
    save();
    renderContent();
    renderNav();
    renderPromptLibrary();
    updateProgress();
    // scroll to next lesson or next module
    const allLessons=modules.flatMap(m=>m.lessons);
    const idx=allLessons.findIndex(l=>l.id===id);
    const nextLesson=allLessons[idx+1];
    if(nextLesson){
      setTimeout(()=>{
        const el=document.getElementById(nextLesson.id);
        if(el) el.scrollIntoView({behavior:'smooth',block:'start'});
      },200);
    }
  }
  if(e.target.id==='resumeBtn'){
    const id=localStorage.getItem('aiCourseLastLesson');
    if(id) document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});
  }
});

// ── Mobile sidebar ──────────────────────────────────────────────────────
menuToggle?.addEventListener('click',()=>sidebar.classList.add('open'));
closeBtn?.addEventListener('click',()=>sidebar.classList.remove('open'));

// ── Scroll active highlight ──────────────────────────────────────────────
const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      document.querySelectorAll('.lesson-link').forEach(a=>a.classList.remove('active'));
      const a=document.querySelector(`.lesson-link[data-target="${entry.target.id}"]`);
      if(a) a.classList.add('active');
    }
  });
},{threshold:0.4});

function observeLessons(){ document.querySelectorAll('.lesson-card').forEach(c=>observer.observe(c)); }

// ── Init ─────────────────────────────────────────────────────────────────
renderContent();
renderNav();
renderPromptLibrary();
updateProgress();
observeLessons();
