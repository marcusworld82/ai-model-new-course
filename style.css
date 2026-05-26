const completed = JSON.parse(localStorage.getItem('aiModelsCompleted') || '{}');
const lastLessonKey = 'aiModelsLastLesson';
const markdown = document.getElementById('courseMarkdown').textContent.trim();
const content = document.getElementById('courseContent');
const nav = document.getElementById('moduleNav');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const modulesDone = document.getElementById('modulesDone');
const lessonsDone = document.getElementById('lessonsDone');
const resumeBtn = document.getElementById('resumeBtn');
const nextLessonTitle = document.getElementById('nextLessonTitle');
const nextLessonDesc = document.getElementById('nextLessonDesc');
const promptLibrary = document.getElementById('promptLibrary');
const copyAllPrompts = document.getElementById('copyAllPrompts');
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');
const closeSidebar = document.getElementById('closeSidebar');
function slug(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')}
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function parse(md){const lines=md.split(/
?
/);const blocks=[];let i=0;while(i<lines.length){let line=lines[i];if(!line.trim()){i++;continue}if(line.startsWith('# ')){blocks.push({type:'h1',text:line.slice(2)});i++;continue}if(line.startsWith('## ')){blocks.push({type:'h2',text:line.slice(3)});i++;continue}if(line.startsWith('### ')){blocks.push({type:'h3',text:line.slice(4)});i++;continue}if(line.startsWith('```')){let code='';i++;while(i<lines.length&&!lines[i].startsWith('```')){code+=lines[i]+'
';i++}i++;blocks.push({type:'code',text:code.trimEnd()});continue}if(line.startsWith('- ')){const items=[];while(i<lines.length&&lines[i].startsWith('- ')){items.push(lines[i].slice(2));i++}blocks.push({type:'ul',items});continue}if(/^\d+\. /.test(line)){const items=[];while(i<lines.length&&/^\d+\. /.test(lines[i]||'')){items.push(lines[i].replace(/^\d+\. /,''));i++}blocks.push({type:'ol',items});continue}let p=[line.trim()];i++;while(i<lines.length&&lines[i].trim()&&!/^(#|##|###|```|- |\d+\. )/.test(lines[i])){p.push(lines[i].trim());i++}blocks.push({type:'p',text:p.join(' ')})}return blocks}
const blocks = parse(markdown);
let html='';
let promptText=[];
for(const b of blocks){if(b.type==='h1'){continue}if(b.type==='h2'){html+=`<section class="lesson-section" id="${slug(b.text)}"><h2 class="module-title">${esc(b.text)}</h2>`;continue}if(b.type==='h3'){html+=`<div class="lesson-card" id="${slug(b.text)}"><span class="status-pill">Lesson</span><h2>${esc(b.text)}</h2>`;continue}if(b.type==='p'){html+=`<p>${esc(b.text)}</p>`;continue}if(b.type==='ul'){html+=`<ul>${b.items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;continue}if(b.type==='ol'){html+=`<ol>${b.items.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`;continue}if(b.type==='code'){html+=`<div class="code-box"><button class="copy-btn">Copy</button><pre><code>${esc(b.text)}</code></pre></div>`;promptText.push(b.text);continue}}
content.innerHTML = html;
document.querySelectorAll('.module-title').forEach(title=>{const sec=title.parentElement;if(!sec) return;const lessons=[...sec.querySelectorAll('.lesson-card')];if(!lessons.length) return;lessons.forEach((card,i)=>{if(!card.querySelector('.lesson-actions')){const btnWrap=document.createElement('div');btnWrap.className='lesson-actions';btnWrap.innerHTML=`<button class="mark-complete ${completed[card.id]?'done':''}" data-id="${card.id}">${completed[card.id]?'Completed':'Mark as Complete'}</button>`;card.appendChild(btnWrap);if(completed[card.id]){card.querySelector('.status-pill').classList.add('done');card.querySelector('.status-pill').textContent='Complete'}}})});
function renderNav(){nav.innerHTML='';[...document.querySelectorAll('.lesson-section')].forEach(section=>{const moduleTitle=section.querySelector('.module-title');const lessons=[...section.querySelectorAll('.lesson-card')];const details=document.createElement('details');details.open=true;const summary=document.createElement('summary');summary.textContent=moduleTitle.textContent;details.appendChild(summary);const list=document.createElement('div');list.className='lesson-list';lessons.forEach(l=>{const a=document.createElement('a');a.href=`#${l.id}`;a.className='lesson-link';a.dataset.target=l.id;a.textContent=l.querySelector('h2').textContent;list.appendChild(a)});details.appendChild(list);nav.appendChild(details)})}
renderNav();
function updateProgress(){const all=[...document.querySelectorAll('.lesson-card')];const done=all.filter(c=>completed[c.id]).length;const pct=all.length?Math.round(done/all.length*100):0;progressBar.style.width=pct+'%';progressText.textContent=pct+'%';lessonsDone.textContent=done;modulesDone.textContent=0;const next=all.find(c=>!completed[c.id])||all[0];if(next){nextLessonTitle.textContent=next.querySelector('h2').textContent;nextLessonDesc.textContent=next.querySelector('p')?.textContent?.slice(0,140)||'Continue through the course.';localStorage.setItem(lastLessonKey,next.id)}}
updateProgress();
document.addEventListener('click',e=>{if(e.target.classList.contains('mark-complete')){const id=e.target.dataset.id;completed[id]=!completed[id];localStorage.setItem('aiModelsCompleted',JSON.stringify(completed));e.target.textContent=completed[id]?'Completed':'Mark as Complete';e.target.classList.toggle('done',completed[id]);const pill=e.target.closest('.lesson-card').querySelector('.status-pill');pill.textContent=completed[id]?'Complete':'Lesson';pill.classList.toggle('done',completed[id]);updateProgress()}if(e.target.classList.contains('copy-btn')){const txt=e.target.nextElementSibling.innerText;navigator.clipboard.writeText(txt);e.target.textContent='Copied';setTimeout(()=>e.target.textContent='Copy',1200)}if(e.target.id==='copyAllPrompts'){navigator.clipboard.writeText(promptText.join('

'));e.target.textContent='Copied';setTimeout(()=>e.target.textContent='Copy all prompts',1200)}if(e.target.id==='resumeBtn'){const id=localStorage.getItem(lastLessonKey);if(id) document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'})}});
menuToggle?.addEventListener('click',()=>sidebar.classList.add('open'));closeSidebar?.addEventListener('click',()=>sidebar.classList.remove('open'));document.querySelectorAll('.lesson-link').forEach(a=>a.addEventListener('click',()=>sidebar.classList.remove('open')));
