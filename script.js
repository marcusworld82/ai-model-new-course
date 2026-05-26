
const STORAGE_KEY = 'aiCourseCompleted';
const completed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(completed)); }
function slug(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ── Parse markdown ──────────────────────────────────────────────────────────
const tmpl = document.getElementById('courseMarkdown');
const raw  = tmpl ? tmpl.innerHTML.trim() : '';
const lines = raw.split(/\r?\n/);

// Skip non-module ## headings (Course Overview, Who This Course Is For, etc.)
const MODULE_PREFIXES = ['module','final project','bonus templates'];
function isModuleHeading(title){
  const t = title.toLowerCase();
  return MODULE_PREFIXES.some(p => t.startsWith(p));
}

const modules = [];
let curMod = null, curLesson = null;

for(let i = 0; i < lines.length; i++){
  const line = lines[i], trim = line.trim();
  if(!trim || trim === '---') continue;
  if(/^# /.test(line)) continue; // skip H1

  // H2 = module (only if it starts with Module, Final Project, or Bonus Templates)
  if(/^## /.test(line)){
    const title = trim.slice(3).trim();
    curLesson = null;
    if(isModuleHeading(title)){
      curMod = { title, id: slug(title), lessons: [] };
      modules.push(curMod);
    } else {
      curMod = null; // skip Course Overview, Who This Course Is For, etc.
    }
    continue;
  }

  // H3 = lesson inside a module
  if(/^### /.test(line)){
    if(!curMod) continue;
    const title = trim.slice(4).trim();
    curLesson = { title, id: slug(title), body: '', prompts: [] };
    curMod.lessons.push(curLesson);
    continue;
  }

  if(!curLesson) continue;

  // Code block
  if(trim.startsWith('```')){
    let code = ''; i++;
    while(i < lines.length && !lines[i].trim().startsWith('```')){ code += lines[i] + '\n'; i++; }
    const c = code.trim();
    curLesson.prompts.push(c);
    curLesson.body += `<div class="code-box"><button class="copy-btn">Copy</button><pre><code>${esc(c)}</code></pre></div>`;
    continue;
  }
  // Table
  if(trim.startsWith('|')){
    let tbl = '<div class="table-wrap"><table><tbody>';
    while(i < lines.length && lines[i].trim().startsWith('|')){
      if(lines[i].includes('---')){ i++; continue; }
      const cells = lines[i].split('|').filter(c => c.trim());
      tbl += '<tr>' + cells.map(c => `<td>${esc(c.trim())}</td>`).join('') + '</tr>'; i++;
    }
    tbl += '</tbody></table></div>'; i--;
    curLesson.body += tbl; continue;
  }
  // Unordered list
  if(trim.startsWith('- ')){
    let ul = '<ul>';
    while(i < lines.length && lines[i].trim().startsWith('- ')){ ul += `<li>${esc(lines[i].trim().slice(2))}</li>`; i++; }
    ul += '</ul>'; i--;
    curLesson.body += ul; continue;
  }
  // Ordered list
  if(/^\d+\. /.test(trim)){
    let ol = '<ol>';
    while(i < lines.length && /^\d+\. /.test((lines[i]||'').trim())){
      ol += `<li>${esc(lines[i].trim().replace(/^\d+\. /,''))}</li>`; i++;
    }
    ol += '</ol>'; i--;
    curLesson.body += ol; continue;
  }
  // Paragraph
  if(trim) curLesson.body += `<p>${esc(trim)}</p>`;
}

// Remove empty modules
const activeModules = modules.filter(m => m.lessons.length > 0);

// ── State helpers ───────────────────────────────────────────────────────────
function isModComplete(mod){ return mod.lessons.length > 0 && mod.lessons.every(l => completed[l.id]); }
function isModUnlocked(mi){ return mi === 0 || isModComplete(activeModules[mi-1]); }
function allLessons(){ return activeModules.flatMap(m => m.lessons); }
function firstIncomplete(){ return allLessons().find(l => !completed[l.id]) || allLessons()[0]; }

let currentLessonId = null;
const mainView   = document.getElementById('mainView');
const lessonView = document.getElementById('lessonView');

// ── Dashboard ───────────────────────────────────────────────────────────────
function showDashboard(){
  currentLessonId = null;
  mainView.style.display = 'block';
  lessonView.style.display = 'none';
  lessonView.innerHTML = '';
  updateProgress(); renderNav();
  window.scrollTo({top:0,behavior:'smooth'});
}

// ── Lesson view ─────────────────────────────────────────────────────────────
function showLesson(lessonId){
  const lesson = allLessons().find(l => l.id === lessonId);
  if(!lesson) return;
  const modIdx = activeModules.findIndex(m => m.lessons.some(l => l.id === lessonId));
  if(!isModUnlocked(modIdx)) return;

  currentLessonId = lessonId;
  localStorage.setItem('aiCourseLastLesson', lessonId);
  mainView.style.display = 'none';
  lessonView.style.display = 'block';
  lessonView.innerHTML = '';

  const mod = activeModules[modIdx];
  const lessonIdx = mod.lessons.findIndex(l => l.id === lessonId);
  const done = !!completed[lessonId];
  const prevLesson = lessonIdx > 0 ? mod.lessons[lessonIdx-1]
    : (modIdx > 0 ? activeModules[modIdx-1].lessons.slice(-1)[0] : null);
  const nextLesson = lessonIdx < mod.lessons.length-1 ? mod.lessons[lessonIdx+1]
    : (modIdx < activeModules.length-1 && isModUnlocked(modIdx+1) ? activeModules[modIdx+1].lessons[0] : null);

  const page = document.createElement('div');
  page.className = 'lesson-page';
  page.innerHTML = `
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
          ${prevLesson?`<button class="nav-lesson-btn" id="prevBtn">&#8592; Previous</button>`:'<span></span>'}
          ${!done?`<button class="mark-complete" id="markBtn">Mark as Complete</button>`:`<button class="mark-complete done" disabled>&#10003; Completed</button>`}
          ${done&&nextLesson?`<button class="nav-lesson-btn next-btn" id="nextBtn">Next &#8594;</button>`:'<span></span>'}
        </div>
        ${isModComplete(mod)?`<div class="mod-complete-banner">&#127881; ${esc(mod.title)} Complete!${modIdx<activeModules.length-1?' Next module is now unlocked.':''}</div>`:''}
      </div>
    </div>`;
  lessonView.appendChild(page);

  document.getElementById('backBtn').addEventListener('click', showDashboard);
  document.getElementById('prevBtn')?.addEventListener('click', () => showLesson(prevLesson.id));
  document.getElementById('nextBtn')?.addEventListener('click', () => showLesson(nextLesson.id));
  document.getElementById('markBtn')?.addEventListener('click', () => {
    completed[lessonId] = true; save();
    showLesson(lessonId); updateProgress(); renderNav();
  });
  lessonView.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(btn.nextElementSibling?.innerText || '');
      btn.textContent = 'Copied';
      setTimeout(() => btn.textContent = 'Copy', 1400);
    });
  });
  renderNav(); updateProgress();
  window.scrollTo({top:0,behavior:'smooth'});
}

// ── Sidebar ─────────────────────────────────────────────────────────────────
function renderNav(){
  const nav = document.getElementById('moduleNav');
  nav.innerHTML = '';
  activeModules.forEach((mod, mi) => {
    const unlocked = isModUnlocked(mi);
    const complete = isModComplete(mod);
    const doneLessons = mod.lessons.filter(l => completed[l.id]).length;
    const details = document.createElement('details');
    if(!unlocked) details.classList.add('nav-locked');
    const summary = document.createElement('summary');
    summary.innerHTML = `
      <span class="nav-icon">${complete?'&#10003;':!unlocked?'&#128274;':''}</span>
      <span class="nav-mod-label">Mod ${mi+1}</span>
      <span class="nav-mod-name">${esc(mod.title)}</span>
      <span class="nav-count">${doneLessons}/${mod.lessons.length}</span>`;
    if(!unlocked) summary.addEventListener('click', e => e.preventDefault());
    details.appendChild(summary);
    if(unlocked){
      const list = document.createElement('div');
      list.className = 'lesson-list';
      mod.lessons.forEach((l, li) => {
        const btn = document.createElement('button');
        btn.className = 'lesson-link'+(completed[l.id]?' done':'')+(currentLessonId===l.id?' active':'');
        btn.innerHTML = `<span class="ll-num">${li+1}</span><span class="ll-title">${esc(l.title)}</span>${completed[l.id]?'<span class="ll-check">&#10003;</span>':''}`;
        btn.addEventListener('click', () => { showLesson(l.id); document.getElementById('sidebar').classList.remove('open'); });
        list.appendChild(btn);
      });
      details.appendChild(list);
    }
    nav.appendChild(details);
  });
}

// ── Progress ─────────────────────────────────────────────────────────────────
function updateProgress(){
  const all = allLessons();
  const done = all.filter(l => completed[l.id]).length;
  const pct = all.length ? Math.round(done/all.length*100) : 0;
  document.getElementById('progressBar').style.width = pct+'%';
  document.getElementById('progressText').textContent = pct+'%';
  const ld = document.getElementById('lessonsDone');
  const md = document.getElementById('modulesDone');
  if(ld) ld.textContent = done;
  if(md) md.textContent = activeModules.filter((_,i) => isModComplete(activeModules[i])).length;
  const next = firstIncomplete();
  if(next){
    const nt = document.getElementById('nextLessonTitle');
    const nd = document.getElementById('nextLessonDesc');
    if(nt) nt.textContent = next.title;
    if(nd) nd.textContent = next.body.replace(/<[^>]+>/g,' ').trim().slice(0,140)||'Continue through the course.';
    localStorage.setItem('aiCourseLastLesson', next.id);
  }
}

// ── Init ─────────────────────────────────────────────────────────────────────
function init(){
  renderNav(); updateProgress(); showDashboard();
  function doResume(){
    const id = localStorage.getItem('aiCourseLastLesson') || allLessons()[0]?.id;
    if(id) showLesson(id);
  }
  document.getElementById('startCourseBtn')?.addEventListener('click', () => {
    const first = allLessons()[0]; if(first) showLesson(first.id);
  });
  document.getElementById('resumeBtn')?.addEventListener('click', doResume);
  document.getElementById('resumeBtn2')?.addEventListener('click', doResume);
  document.getElementById('brandLink')?.addEventListener('click', e => { e.preventDefault(); showDashboard(); });
  document.getElementById('menuToggle')?.addEventListener('click', () => document.getElementById('sidebar')?.classList.add('open'));
  document.getElementById('closeSidebar')?.addEventListener('click', () => document.getElementById('sidebar')?.classList.remove('open'));
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
