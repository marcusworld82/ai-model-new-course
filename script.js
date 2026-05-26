
const completed = JSON.parse(localStorage.getItem('aiModelsCompleted') || '{}');
const lastLessonKey = 'aiModelsLastLesson';
const tmpl = document.getElementById('courseMarkdown');
const markdown = tmpl ? tmpl.innerHTML.trim() : '';
const content = document.getElementById('courseContent');
const nav = document.getElementById('moduleNav');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const modulesDone = document.getElementById('modulesDone');
const lessonsDone = document.getElementById('lessonsDone');
const resumeBtn = document.getElementById('resumeBtn');
const nextLessonTitle = document.getElementById('nextLessonTitle');
const nextLessonDesc = document.getElementById('nextLessonDesc');
const copyAllPrompts = document.getElementById('copyAllPrompts');
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');
const closeSidebarBtn = document.getElementById('closeSidebar');

function slug(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

const lines = markdown.split(/\r?\n/);
const modules = [];
let currentModule = null;
let allPrompts = [];
let out = '';

for(let i=0; i<lines.length; i++){
  const line = lines[i];
  const trim = line.trim();
  if(!trim || trim==='---') continue;

  // H1 top level title - skip
  if(/^# [^#]/.test(line)){
    continue;
  }
  // H2 = module heading
  if(/^## [^#]/.test(line)){
    const title = trim.slice(3).trim();
    const id = slug(title);
    if(currentModule) out += '</div></section>';
    currentModule = {title, id, lessons:[]};
    modules.push(currentModule);
    out += `<section class="lesson-section" id="${id}">`;
    out += `<h2 class="module-title">${esc(title)}</h2>`;
    out += `<div class="lessons-wrap">`;
    continue;
  }
  // H3 = lesson heading
  if(/^### [^#]/.test(line)){
    const title = trim.slice(4).trim();
    const id = slug(title);
    if(currentModule) currentModule.lessons.push({title, id});
    // check if it's a special callout type
    const isProTip = title.toLowerCase().includes('pro tip') || title.toLowerCase().includes('action step') || title.toLowerCase().includes('prompt rule') || title.toLowerCase().includes('best practices') || title.toLowerCase().includes('example') || title.toLowerCase().includes('review checklist');
    if(isProTip){
      out += `<div class="callout" id="${id}"><h3>${esc(title)}</h3>`;
      let j=i+1;
      while(j<lines.length && lines[j].trim() && !/^#{1,3} /.test(lines[j])){
        const cl = lines[j].trim();
        if(cl.startsWith('- ')){
          out += '<ul>';
          while(j<lines.length && lines[j].trim().startsWith('- ')){
            out += `<li>${esc(lines[j].trim().slice(2))}</li>`;
            j++;
          }
          out += '</ul>';
        } else if(/^\d+\. /.test(cl)){
          out += '<ol>';
          while(j<lines.length && /^\d+\. /.test(lines[j].trim())){
            out += `<li>${esc(lines[j].trim().replace(/^\d+\. /,''))}</li>`;
            j++;
          }
          out += '</ol>';
        } else {
          out += `<p>${esc(cl)}</p>`;
          j++;
        }
      }
      out += '</div>';
      i = j-1;
    } else {
      out += `<div class="lesson-card" id="${id}">`;
      out += `<div class="lesson-card-header"><span class="status-pill ${completed[id]?'done':''}">`;
      out += completed[id] ? 'Complete' : 'Lesson';
      out += `</span><span class="lesson-title-main">${esc(title)}</span></div>`;
    }
    continue;
  }
  // code block
  if(trim.startsWith('```')){
    let code = '';
    i++;
    while(i<lines.length && !lines[i].trim().startsWith('```')){
      code += lines[i] + '\n';
      i++;
    }
    allPrompts.push(code.trim());
    out += `<div class="code-box"><button class="copy-btn">Copy</button><pre><code>${esc(code.trim())}</code></pre></div>`;
    continue;
  }
  // table
  if(trim.startsWith('|')){
    out += '<div class="table-wrap"><table><tbody>';
    while(i<lines.length && lines[i].trim().startsWith('|')){
      if(lines[i].includes('---')){ i++; continue; }
      const cells = lines[i].split('|').filter(c=>c.trim());
      out += '<tr>' + cells.map(c=>`<td>${esc(c.trim())}</td>`).join('') + '</tr>';
      i++;
    }
    out += '</tbody></table></div>';
    i--;
    continue;
  }
  // unordered list
  if(trim.startsWith('- ')){
    out += '<ul>';
    while(i<lines.length && lines[i].trim().startsWith('- ')){
      out += `<li>${esc(lines[i].trim().slice(2))}</li>`;
      i++;
    }
    out += '</ul>';
    i--;
    continue;
  }
  // ordered list
  if(/^\d+\. /.test(trim)){
    out += '<ol>';
    while(i<lines.length && /^\d+\. /.test(lines[i].trim())){
      out += `<li>${esc(lines[i].trim().replace(/^\d+\. /,''))}</li>`;
      i++;
    }
    out += '</ol>';
    i--;
    continue;
  }
  // paragraph
  if(trim){
    out += `<p>${esc(trim)}</p>`;
  }
}
if(currentModule) out += '</div></section>';
content.innerHTML = out;

// Add mark complete buttons to lesson cards
document.querySelectorAll('.lesson-card').forEach(card=>{
  const footer = document.createElement('div');
  footer.className = 'lesson-footer';
  footer.innerHTML = `<button class="mark-complete${completed[card.id]?' done':''}" data-id="${card.id}">${completed[card.id]?'&#10003; Completed':'Mark as Complete'}</button>`;
  card.appendChild(footer);
});

// Build sidebar nav
function buildNav(){
  nav.innerHTML = '';
  modules.forEach(mod=>{
    const details = document.createElement('details');
    details.open = true;
    const summary = document.createElement('summary');
    const doneCount = mod.lessons.filter(l=>completed[l.id]).length;
    summary.innerHTML = `<span class="mod-name">${esc(mod.title)}</span><span class="mod-progress">${doneCount}/${mod.lessons.length}</span>`;
    details.appendChild(summary);
    const list = document.createElement('div');
    list.className = 'lesson-list';
    mod.lessons.forEach(l=>{
      const a = document.createElement('a');
      a.href = `#${l.id}`;
      a.className = 'lesson-link' + (completed[l.id]?' done':'');
      a.dataset.target = l.id;
      a.innerHTML = `${completed[l.id]?'<span class="check">&#10003;</span>':''}<span>${esc(l.title)}</span>`;
      list.appendChild(a);
    });
    details.appendChild(list);
    nav.appendChild(details);
  });
}
buildNav();

// Populate prompt library
const promptLib = document.getElementById('promptLibrary');
if(promptLib && allPrompts.length){
  promptLib.innerHTML = allPrompts.map((p,i)=>`<div class="prompt-item"><button class="copy-btn">Copy</button><pre><code>${esc(p)}</code></pre></div>`).join('');
}

function updateProgress(){
  const all = [...document.querySelectorAll('.lesson-card')];
  const done = all.filter(c=>completed[c.id]).length;
  const pct = all.length ? Math.round(done/all.length*100) : 0;
  progressBar.style.width = pct+'%';
  progressText.textContent = pct+'%';
  lessonsDone.textContent = done;
  const completedMods = modules.filter(m=>m.lessons.length && m.lessons.every(l=>completed[l.id])).length;
  modulesDone.textContent = completedMods;
  const next = all.find(c=>!completed[c.id]) || all[0];
  if(next){
    nextLessonTitle.textContent = next.querySelector('.lesson-title-main')?.textContent || 'Next lesson';
    nextLessonDesc.textContent = next.querySelector('p')?.textContent?.slice(0,140) || 'Continue through the course.';
    localStorage.setItem(lastLessonKey, next.id);
  }
}
updateProgress();

// Event delegation
document.addEventListener('click', e=>{
  if(e.target.classList.contains('mark-complete')){
    const id = e.target.dataset.id;
    completed[id] = !completed[id];
    localStorage.setItem('aiModelsCompleted', JSON.stringify(completed));
    e.target.textContent = completed[id] ? '\u2713 Completed' : 'Mark as Complete';
    e.target.classList.toggle('done', completed[id]);
    const card = document.getElementById(id);
    if(card){
      const pill = card.querySelector('.status-pill');
      if(pill){ pill.textContent = completed[id]?'Complete':'Lesson'; pill.className='status-pill'+(completed[id]?' done':''); }
    }
    buildNav();
    updateProgress();
  }
  if(e.target.classList.contains('copy-btn')){
    const txt = e.target.nextElementSibling?.innerText || '';
    navigator.clipboard.writeText(txt);
    e.target.textContent = 'Copied';
    setTimeout(()=>e.target.textContent='Copy', 1400);
  }
  if(e.target.id==='copyAllPrompts'){
    navigator.clipboard.writeText(allPrompts.join('\n\n'));
    e.target.textContent = 'Copied';
    setTimeout(()=>e.target.textContent='Copy all prompts', 1400);
  }
  if(e.target.id==='resumeBtn'){
    const id = localStorage.getItem(lastLessonKey);
    if(id) document.getElementById(id)?.scrollIntoView({behavior:'smooth', block:'start'});
  }
});

menuToggle?.addEventListener('click', ()=>sidebar.classList.add('open'));
closeSidebarBtn?.addEventListener('click', ()=>sidebar.classList.remove('open'));
document.querySelectorAll('.lesson-link').forEach(a=>a.addEventListener('click', ()=>sidebar.classList.remove('open')));

// Highlight active lesson on scroll
const observer = new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      document.querySelectorAll('.lesson-link').forEach(a=>a.classList.remove('active'));
      const active = document.querySelector(`.lesson-link[data-target="${entry.target.id}"]`);
      if(active) active.classList.add('active');
    }
  });
},{threshold:0.3});
document.querySelectorAll('.lesson-card').forEach(c=>observer.observe(c));
