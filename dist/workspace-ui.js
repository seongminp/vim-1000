function appendWorkspaceCard(m,id,resume){
  const card=document.createElement('article');card.className='challenge-card workspace-card';
  card.innerHTML=`<div class="task-heading"><h2>${escapeHTML(m.title)}</h2></div><p class="workspace-note">Offline practice project · commands affect only these files</p><div class="workspace-goals"></div><div class="workspace-files"></div><div class="workspace-panes"><section class="workspace-active"><div class="editor-caption workspace-caption"></div><div class="live-editor"></div></section><section class="workspace-other" tabindex="0" role="button" aria-label="Focus other pane" hidden><div class="editor-caption"></div><pre></pre></section></div><div class="workspace-qf" hidden></div><div class="workspace-buffer-list" hidden></div><div class="status"><span class="mode">NORMAL</span><button class="text-button reset">↺ Reset</button></div><div class="trail"><span>YOUR KEYS</span><div class="keys"></div></div><div class="actions"><button class="quiet hint">Show a hint</button><button class="text-button skip">Skip →</button></div><div class="hint-box" hidden></div><div class="result" aria-live="polite"></div>`;
  $('#challenge-feed').replaceChildren(card);const q=s=>card.querySelector(s);let timer=null,submitted=false,keys=resume?.keys||[],guided=resume?.guided||false,disposed=false;
  let runtime;
  function render(r){
    if(disposed)return;const state=r.state();
    if(submitted&&!r.solved()){submitted=false;q('.result').innerHTML='';q('.actions').hidden=false}
    q('.workspace-files').textContent=Object.keys(state.files).map(f=>f+(state.files[f]!==state.saved[f]?' [+]':'')).join('   ·   ');
    q('.workspace-caption').textContent=r.current()+' · active';
    q('.workspace-panes').dataset.layout=state.layout;q('.workspace-active').style.order=state.active;
    const other=q('.workspace-other');other.hidden=state.panes.length<2;
    if(!other.hidden){const index=1-state.active;other.style.order=index;other.querySelector('.editor-caption').textContent=state.panes[index];other.querySelector('pre').textContent=state.files[state.panes[index]]}
    q('.workspace-qf').hidden=!state.qopen;q('.workspace-qf').innerHTML='<strong>Quickfix</strong>'+state.quickfix.map((e,i)=>`<div class="${i===state.qi?'current':''}">${i+1} · ${escapeHTML(e.file)}:${e.line+1}:${(e.ch||0)+1} — ${escapeHTML(e.text||state.files[e.file].split('\n')[e.line])}</div>`).join('');
    q('.workspace-buffer-list').hidden=!state.bufferList;q('.workspace-buffer-list').textContent=state.listed.map(f=>(Object.keys(state.files).indexOf(f)+1)+' '+(f===r.current()?'%':f===state.alternate?'#':' ')+' '+f).join('\n');
    q('.workspace-goals').innerHTML='<div class="editor-caption">Target workspace</div>'+r.checks().filter(c=>c.label!=='Other files unchanged').map(c=>`<div class="workspace-goal ${c.pass?'met':''}"><span>${c.pass?'✓':'○'}</span> ${escapeHTML(c.label)}</div>`).join('')+Object.entries(m.workspace.goal.files||{}).map(([file,text])=>`<div class="workspace-target"><span>${escapeHTML(file)}</span><pre>${escapeHTML(text)}</pre></div>`).join('');
    clearTimeout(timer);timer=setTimeout(()=>{if(disposed)return;persist();if(r.solved()&&!submitted)complete()},180);
  }
  runtime=Workspace.create(q('.live-editor'),m,resume?.workspace,render);const cm=runtime.cm;activeEditor=cm;
  q('.workspace-other').onclick=()=>{runtime.command('wincmd','w');cm.focus()};q('.workspace-other').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();runtime.command('wincmd','w');cm.focus()}};
  cm.getInputField().setAttribute('aria-label','Edit workspace: '+m.title);
  function trail(){q('.keys').innerHTML=keys.slice(-70).map(keyHTML).join('')}
  function feedback(){q('.result').innerHTML=`<div class="feedback"><h3>${guided?'Practice this method':'Workspace complete'}</h3><div class="solution">${m.keys.map(keyHTML).join('')}</div><p>${escapeHTML(m.why)}</p><div class="progress-actions"><button class="quiet practice-again">Practice this method</button><button class="quiet replay">Replay steps</button><button class="primary next">Next <kbd>Enter</kbd></button></div></div>`;q('.next').onclick=next;q('.practice-again').onclick=()=>restart(true);q('.replay').onclick=()=>workspaceReplay(m)}
  function complete(){submitted=true;done.add(id);guided=false;persist();feedback();q('.actions').hidden=true}
  function dispose(){disposed=true;clearTimeout(timer);clearTimeout(saveTimer);stopRecording();cm.getInputField().blur();activeSnapshot=null}
  function next(){dispose();progress.next();appendCard();persist()}
  function restart(practice){dispose();progress.attempt=practice?{id:progress.keys[id],value:m.before,cursor:[0,0],keys:[],guided:true}:null;appendCard();persist()}
  activeDispose=dispose;activeAdvance=next;activeSnapshot=()=>({id:progress.keys[id],value:cm.getValue(),cursor:[cm.getCursor().line,cm.getCursor().ch],keys:keys.slice(),guided,workspace:runtime.snapshot()});
  cm.getWrapperElement().addEventListener('keydown',e=>{if(['Shift','Control','Alt','Meta'].includes(e.key)||e.metaKey)return;keys.push(e.key==='Escape'?'<Esc>':e.key==='Enter'?'<Enter>':e.ctrlKey?`<C-${e.key}>`:e.key);trail();scheduleSave()},true);
  card.addEventListener('keydown',e=>{if((submitted||guided)&&e.key==='Enter'&&e.ctrlKey&&!$('#modal').open){e.preventDefault();restart(true);return}if(submitted&&e.key==='Enter'&&!e.ctrlKey&&!e.metaKey&&!e.repeat&&e.target.closest('.live-editor,.next')&&!e.target.closest('.CodeMirror-dialog')&&!$('#modal').open){e.preventDefault();next()}},true);
  cm.on('vim-mode-change',e=>q('.mode').textContent=e.mode.toUpperCase());q('.reset').onclick=()=>restart(false);q('.skip').onclick=next;q('.hint').onclick=()=>{q('.hint-box').hidden=!q('.hint-box').hidden;q('.hint-box').textContent=m.hint};
  trail();if(guided)feedback();if(location.hash!=='#faq')cm.focus();return card;
}
function workspaceReplay(m){
  demoCleanup();clearTimeout(demoTimer);$('#modal-title').textContent='Workspace replay';$('#modal-body').innerHTML='<div id="workspace-demo"></div><pre id="workspace-demo-state"></pre><div class="demo-keys">'+m.keys.map((k,i)=>`<button class="replay-step" data-step="${i+1}" aria-label="Step ${i+1}: ${escapeHTML(label(k))}">${keyHTML(k)}</button>`).join('')+'</div><div class="replay-controls"><button class="quiet" id="workspace-start">Start</button><button class="quiet" id="workspace-step">Next step →</button></div><p class="modal-note">'+escapeHTML(m.why)+'</p>';
  $('#modal').showModal();let r,n=0;
  function go(step){$('#workspace-demo').replaceChildren();r=Workspace.create($('#workspace-demo'),m,null,()=>{});feed(r.cm,m.keys.slice(0,step));n=step;const s=r.snapshot();$('#workspace-demo-state').textContent='Active: '+r.current()+'\nPanes: '+s.panes.join(' | ')+' ('+s.layout+')\nQuickfix: '+s.quickfix.length+' entries'+(s.qopen?' · open':'')+'\n\n'+Object.entries(s.files).map(([f,t])=>f+'\n'+t).join('\n\n');$('#modal-body').querySelectorAll('[data-step]').forEach(b=>b.classList.toggle('played',Number(b.dataset.step)<=step));r.cm.setOption('readOnly',true)}
  $('#modal-body').querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>go(Number(b.dataset.step)));$('#workspace-step').onclick=()=>go(Math.min(n+1,m.keys.length));$('#workspace-start').onclick=()=>go(0);go(0);demoCleanup=()=>{};
}
