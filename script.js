
const STORAGE_KEY = 'aiCourseCompleted';
const completed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(completed)); }
function slug(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ── Parse markdown ──────────────────────────────────────────────────────────
const tmpl = document.getElementById('courseMarkdown');
const raw  = tmpl ? tmpl.innerHTML.trim() : '';
const lines = raw.split(/\r?\n/);

const rawLessons = [];
let cur = null;

for(let i = 0; i < lines.length; i++){
  const line = lines[i], trim = line.trim();
  if(!trim || trim === '---') continue;

  // Skip H1 lines (# Title, # Module X, # Final Project, # Bonus Templates, # Course Closing Note)
  if(/^# [^#]/.test(line)) continue;

  // H2 = a lesson
  if(/^## [^#]/.test(line)){
    if(cur) rawLessons.push(cur);
    cur = { title: trim.slice(3).trim(), body: '', prompts: [] };
    continue;
  }

  if(!cur) continue;

  // H3 = sub-section label inside a lesson
  if(/^### [^#]/.test(line)){
    cur.body += `<p class="lesson-subhead">${esc(trim.slice(4).trim())}</p>`;
    continue;
  }

  // Code block
  if(trim.startsWith('```')){
    let code = ''; i++;
    while(i < lines.length && !lines[i].trim().startsWith('```')){ code += lines[i] + '\n'; i++; }
    const c = code.trim();
    cur.prompts.push(c);
    cur.body += `<div class="code-box"><button class="copy-btn">Copy</button><pre><code>${esc(c)}</code></pre></div>`;
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
    cur.body += tbl; continue;
  }

  // Unordered list
  if(trim.startsWith('- ')){
    let ul = '<ul>';
    while(i < lines.length && lines[i].trim().startsWith('- ')){ ul += `<li>${esc(lines[i].trim().slice(2))}</li>`; i++; }
    ul += '</ul>'; i--;
    cur.body += ul; continue;
  }

  // Ordered list
  if(/^\d+\. /.test(trim)){
    let ol = '<ol>';
    while(i < lines.length && /^\d+\. /.test((lines[i] || '').trim())){
      ol += `<li>${esc(lines[i].trim().replace(/^\d+\. /,''))}</li>`; i++;
    }
    ol += '</ol>'; i--;
    cur.body += ol; continue;
  }

  // Paragraph
  if(trim) cur.body += `<p>${esc(trim)}</p>`;
}
if(cur) rawLessons.push(cur);

// ── Module definitions ──────────────────────────────────────────────────────
const MODULE_NAMES = [
  'Understanding the Big Picture',        // 1
  'Understanding AI in Plain Language',   // 2
  'The Core Workflow',                    // 3
  'Building Your Model',                  // 4
  'Prompt Writing for Images',            // 5
  'Styling and Posing',                   // 6
  'Backgrounds and Scenes',              // 7
  'Photography Styles',                   // 8
  'Mood Boards and Brand Consistency',    // 9
  'Product Placement in Higgsfield',      // 10
  'Nana Banana Pro Workflow',             // 11
  'Turning Images Into Videos',           // 12
  'Content Strategy and Publishing',      // 13
  'Final Project',                        // 14
  'Bonus Templates'                       // 15
];

const activeModules = MODULE_NAMES.map(name => ({ title: name, id: slug(name), lessons: [] }));

// ── Bucket each lesson into its module by number prefix ─────────────────────
function getModuleIndex(title){
  // Match "Lesson 1.1", "Lesson 13.2", "1.1:", "13.2:", etc.
  const m = title.match(/(?:lesson\s+)?(\d+)\.\d+/i);
  if(m){
    const n = parseInt(m[1], 10);
    if(n >= 1 && n <= 13) return n - 1; // modules 1-13 → index 0-12
  }
  if(/final\s*(assignment|project)/i.test(title)) return 13;
  if(/template/i.test(title)) return 14;
  return -1;
}

rawLessons.forEach(l => {
  const mi = getModuleIndex(l.title);
  if(mi >= 0 && mi < activeModules.length){
    activeModules[mi].lessons.push({ title: l.title, id: slug(l.title), body: l.body, prompts: l.prompts });
  }
});

// Remove any empty modules (safety net)
const modules = activeModules.filter(m => m.lessons.length > 0);

// ── State helpers ───────────────────────────────────────────────────────────
function isModComplete(mod){ return mod.lessons.length > 0 && mod.lessons.every(l => completed[l.id]); }
function isModUnlocked(mi){ return mi === 0 || isModComplete(modules[mi - 1]); }
function allLessons(){ return modules.flatMap(m => m.lessons); }
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
  updateProgress();
  renderNav();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Lesson view ─────────────────────────────────────────────────────────────
function showLesson(lessonId){
  const lesson = allLessons().find(l => l.id === lessonId);
  if(!lesson) return;
  const modIdx = modules.findIndex(m => m.lessons.some(l => l.id === lessonId));
  if(!isModUnlocked(modIdx)) return;

  currentLessonId = lessonId;
  localStorage.setItem('aiCourseLastLesson', lessonId);
  mainView.style.display = 'none';
  lessonView.style.display = 'block';
  lessonView.innerHTML = '';

  const mod = modules[modIdx];
  const lessonIdx = mod.lessons.findIndex(l => l.id === lessonId);
  const done = !!completed[lessonId];
  const prevLesson = lessonIdx > 0 ? mod.lessons[lessonIdx - 1]
    : (modIdx > 0 ? modules[modIdx - 1].lessons.slice(-1)[0] : null);
  const nextLesson = lessonIdx < mod.lessons.length - 1 ? mod.lessons[lessonIdx + 1]
    : (modIdx < modules.length - 1 && isModUnlocked(modIdx + 1) ? modules[modIdx + 1].lessons[0] : null);

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
    <div class="lesson-card-full${done ? ' done' : ''}">
      <div class="lesson-card-header">
        <span class="status-pill${done ? ' done' : ''}">${done ? '&#10003; Complete' : 'Lesson ' + (lessonIdx + 1) + ' of ' + mod.lessons.length}</span>
        <h1 class="lesson-title-main">${esc(lesson.title)}</h1>
      </div>
      <div class="lesson-body">${lesson.body}</div>
      <div class="lesson-footer">
        <div class="lesson-nav-btns">
          ${prevLesson ? `<button class="nav-lesson-btn prev-btn" id="prevBtn">&#8592; Previous</button>` : '<span></span>'}
          ${!done
            ? `<button class="mark-complete" id="markBtn">Mark as Complete</button>`
            : `<button class="mark-complete done" disabled>&#10003; Completed</button>`}
          ${done && nextLesson ? `<button class="nav-lesson-btn next-btn" id="nextBtn">Next &#8594;</button>` : '<span></span>'}
        </div>
        ${isModComplete(mod) ? `<div class="mod-complete-banner">&#127881; ${esc(mod.title)} Complete!${modIdx < modules.length - 1 ? ' Next module is now unlocked.' : ''}</div>` : ''}
      </div>
    </div>`;
  lessonView.appendChild(page);

  document.getElementById('backBtn').addEventListener('click', showDashboard);
  document.getElementById('prevBtn')?.addEventListener('click', () => showLesson(prevLesson.id));
  document.getElementById('nextBtn')?.addEventListener('click', () => showLesson(nextLesson.id));
  document.getElementById('markBtn')?.addEventListener('click', () => {
    completed[lessonId] = true; save();
    showLesson(lessonId);
    updateProgress(); renderNav();
  });

  lessonView.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(btn.nextElementSibling?.innerText || '');
      btn.textContent = 'Copied';
      setTimeout(() => btn.textContent = 'Copy', 1400);
    });
  });

  renderNav(); updateProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Sidebar ─────────────────────────────────────────────────────────────────
function renderNav(){
  const nav = document.getElementById('moduleNav');
  nav.innerHTML = '';
  modules.forEach((mod, mi) => {
    const unlocked = isModUnlocked(mi);
    const complete = isModComplete(mod);
    const doneLessons = mod.lessons.filter(l => completed[l.id]).length;

    const details = document.createElement('details');
    if(!unlocked) details.classList.add('nav-locked');

    const summary = document.createElement('summary');
    summary.innerHTML = `
      <span class="nav-icon">${complete ? '&#10003;' : !unlocked ? '&#128274;' : ''}</span>
      <span class="nav-mod-label">Mod ${mi + 1}</span>
      <span class="nav-mod-name">${esc(mod.title)}</span>
      <span class="nav-count">${doneLessons}/${mod.lessons.length}</span>`;
    if(!unlocked) summary.addEventListener('click', e => e.preventDefault());
    details.appendChild(summary);

    if(unlocked){
      const list = document.createElement('div');
      list.className = 'lesson-list';
      mod.lessons.forEach((l, li) => {
        const btn = document.createElement('button');
        btn.className = 'lesson-link' + (completed[l.id] ? ' done' : '') + (currentLessonId === l.id ? ' active' : '');
        btn.innerHTML = `<span class="ll-num">${li + 1}</span><span class="ll-title">${esc(l.title)}</span>${completed[l.id] ? '<span class="ll-check">&#10003;</span>' : ''}`;
        btn.addEventListener('click', () => { showLesson(l.id); document.getElementById('sidebar').classList.remove('open'); });
        list.appendChild(btn);
      });
      details.appendChild(list);
    }
    nav.appendChild(details);
  });
}

// ── Progress bar ─────────────────────────────────────────────────────────────
function updateProgress(){
  const all = allLessons();
  const done = all.filter(l => completed[l.id]).length;
  const pct = all.length ? Math.round(done / all.length * 100) : 0;
  document.getElementById('progressBar').style.width = pct + '%';
  document.getElementById('progressText').textContent = pct + '%';
  const ld = document.getElementById('lessonsDone');
  const md = document.getElementById('modulesDone');
  if(ld) ld.textContent = done;
  if(md) md.textContent = modules.filter((_, i) => isModComplete(modules[i])).length;
  const next = firstIncomplete();
  if(next){
    const nt = document.getElementById('nextLessonTitle');
    const nd = document.getElementById('nextLessonDesc');
    if(nt) nt.textContent = next.title;
    if(nd) nd.textContent = next.body.replace(/<[^>]+>/g, ' ').trim().slice(0, 140) || 'Continue through the course.';
    localStorage.setItem('aiCourseLastLesson', next.id);
  }
}

// ── Init ─────────────────────────────────────────────────────────────────────
function init(){
  renderNav();
  updateProgress();
  showDashboard();

  function doResume(){
    const id = localStorage.getItem('aiCourseLastLesson') || allLessons()[0]?.id;
    if(id) showLesson(id);
  }

  document.getElementById('startCourseBtn')?.addEventListener('click', () => {
    const first = allLessons()[0];
    if(first) showLesson(first.id);
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
