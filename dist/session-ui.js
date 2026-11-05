document.addEventListener('DOMContentLoaded',()=>{
const creationPrompt = `Make a super good web app to learn Vim. the core experience should be that the user should be given a mission to edit a text a certain way. Maybe before and after is shown. And when the user edits, the key strokes should be visible. After they submit, we show the more idiomatic way (if any) to achieve the designated task.

The success of this app lies on how well and intuitively we show the text editing task to the user. If the user spends too much time on understanding the supposed edit task, it is a failed app. It should be intuitive above all. Consult the curriculum in Practical Vim book if you need guidance on the course material. BUT DON'T COPY ANYTHING OVER!! Be original in any quizzes you create. It should be fun, no frills, and cover a lot of vim. Make sensible decisions.

Make the app feel fun like Duolingo. But don't blatantly copy duolingo obviously. I mean make it good like them not copy them.`;
$('#creation-prompt').textContent=creationPrompt;

function downloadJSON(value,name){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)+'\n'],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('#download-quizzes').onclick=()=>downloadJSON(missions.map(({ch,instruction,concept,...quiz})=>quiz),'vim-quizzes.json');
const moreTools = $('.more-tools');
const moreToggle = moreTools.querySelector('summary');
document.addEventListener('pointerdown', event => {
  if (!moreTools.contains(event.target)) moreTools.open = false;
});
moreTools.addEventListener('keydown', event => {
  if (event.key === 'Escape' && moreTools.open) {
    event.preventDefault();
    moreTools.open = false;
    moreToggle.focus();
  }
});
moreTools.addEventListener('focusout', event => {
  if (event.relatedTarget && !moreTools.contains(event.relatedTarget)) moreTools.open = false;
});
moreTools.querySelector('nav').addEventListener('click', () => {
  moreTools.open = false;
  moreToggle.focus();
}, true);
function route(focus=true){
  const faq=location.hash==='#faq';
  if(faq){persist();activeEditor?.getInputField().blur()}
  $('.session-tools').hidden=faq;$('#practice-page').hidden=faq;$('#faq-page').hidden=!faq;
  $('#faq-link').setAttribute('aria-current',faq?'page':'false');
  document.title=faq?'FAQ — Vim 1000':'Vim 1000 — learn by editing';
  if(focus){window.scrollTo(0,0);if(faq)$('#faq-page h1').focus();else{activeEditor?.refresh();activeEditor?.focus()}}
}
window.addEventListener('hashchange',()=>route());route(false);
$('#shuffle').onclick=()=>{progress.shuffle=!progress.shuffle;persist()};
$('#save-status').onclick=()=>{
  persist();$('#modal-title').textContent='Your progress';$('#modal').classList.add('progress-overview');
  const groups=progressGroups();
  const square=(m,i)=>`<button class="quiz-square${done.has(i)?' solved':''}${i===progress.current?' current':''}" data-quiz="${i}" tabindex="${i===progress.current?0:-1}" aria-label="${escapeHTML('Quiz '+(i+1)+': '+m.title+(done.has(i)?' — completed':' — not completed'))}" ${i===progress.current?'aria-current="true"':''}></button>`;
  $('#modal-body').innerHTML=`<div class="overview-summary"><span>${done.size} completed overall</span><span class="overview-legend"><i></i> Completed <i class="current"></i> Current</span></div><div class="quiz-maps">${groups.map(g=>`<section class="quiz-map-section"><h3>${g.label}<span>${g.completed} / ${g.indices.length}</span></h3><div class="quiz-map" aria-label="${g.label}">${g.indices.map(i=>square(missions[i],i)).join('')}</div></section>`).join('')}</div><p id="quiz-preview" class="quiz-preview"></p><div class="progress-actions"><button id="export-progress" class="quiet">Download backup</button><button id="import-progress" class="quiet">Restore backup</button></div><p id="progress-message" class="fine-print" role="status"></p>`;
  const map=$('.quiz-maps'),squares=[...map.querySelectorAll('button')];
  function preview(index){$('#quiz-preview').textContent=(index+1)+'. '+missions[index].title}
  preview(progress.current);
  map.addEventListener('pointerover',e=>{const square=e.target.closest('[data-quiz]');if(square)preview(Number(square.dataset.quiz))});
  map.addEventListener('pointerleave',()=>preview(progress.current));
  map.addEventListener('focusin',e=>{if(e.target.dataset.quiz)preview(Number(e.target.dataset.quiz))});
  map.addEventListener('keydown',e=>{
    const i=Number(e.target.dataset.quiz);if(!Number.isInteger(i))return;
    const columns=getComputedStyle(e.target.closest('.quiz-map')).gridTemplateColumns.split(' ').length;
    const delta={ArrowRight:1,ArrowLeft:-1,ArrowDown:columns,ArrowUp:-columns};
    let next=e.key==='Home'?0:e.key==='End'?squares.length-1:delta[e.key]===undefined?null:i+delta[e.key];
    if(next===null)return;e.preventDefault();next=Math.max(0,Math.min(squares.length-1,next));
    squares.forEach(b=>b.tabIndex=-1);squares[next].tabIndex=0;squares[next].focus();
  });
  map.addEventListener('click',e=>{
    const square=e.target.closest('[data-quiz]');if(!square)return;
    const index=Number(square.dataset.quiz);$('#modal').close();
    if(index!==progress.current){activeDispose();progress.jump(index);appendCard();persist()}
    activeEditor?.focus();window.scrollTo({top:0,behavior:'instant'});
  });
  $('#export-progress').onclick=()=>{persist();downloadJSON(progress.snapshot(),'vim-1000-progress.json');$('#progress-message').textContent='Backup downloaded. It contains progress only, not the app.'};
  $('#import-progress').onclick=()=>$('#progress-file').click();$('#modal').showModal();
};
$('#modal').addEventListener('close',()=>$('#modal').classList.remove('progress-overview'));
$('#progress-file').onchange=async e=>{
  const file=e.target.files[0];e.target.value='';if(!file)return;
  try{
    if(file.size>2000000)throw new Error('That file is too large to be a progress backup.');
    const value=JSON.parse(await file.text());
    // Validate without mutating the live session or its saved copy.
    const trial=FieldworkProgress.create(missions,null);trial.restore(value);
    activeDispose();progress.restore(value);appendCard();persist();$('#modal').close();
    if(location.hash==='#faq')location.hash='practice';
  }catch(error){const message=$('#progress-message');if(message)message.textContent=error instanceof SyntaxError?'That file is not valid JSON. Choose a Vim 1000 progress backup.':error.message}
};

});
