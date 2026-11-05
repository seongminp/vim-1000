const offlineSource = document.documentElement.hasAttribute("data-offline") ? "<!doctype html>\n" + document.documentElement.outerHTML : null;
// CodeMirror's Ex command set omits :delete. Add line-range deletion using
// editor transactions and Vim's register controller, also enabling :global ... d.
CodeMirror.Vim.defineEx('delete','d',(cm,params)=>{
  if(params.argString&&params.argString.trim())throw new Error('Use :[range]d without extra arguments.');
  const first=params.line===undefined?cm.getCursor().line:params.line;
  const last=params.lineEnd===undefined?first:params.lineEnd;
  if(first<0||last<first||last>cm.lastLine())throw new Error('Invalid delete range');
  const text=Array.from({length:last-first+1},(_,i)=>cm.getLine(first+i)).join('\n')+'\n';
  CodeMirror.Vim.getRegisterController().pushText('"','delete',text,true);
  cm.operation(()=>{
    if(last<cm.lastLine())cm.replaceRange('',{line:first,ch:0},{line:last+1,ch:0},'+delete');
    else if(first>0)cm.replaceRange('',{line:first-1,ch:cm.getLine(first-1).length},{line:last,ch:cm.getLine(last).length},'+delete');
    else cm.replaceRange('',{line:0,ch:0},{line:last,ch:cm.getLine(last).length},'+delete');
    cm.setCursor(Math.min(first,cm.lastLine()),0);
  });
});
const $=s=>document.querySelector(s);
const escapeHTML=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label=k=>({'<Esc>':'Esc','<Enter>':'↵',' ':'Space','<BS>':'⌫','<C-r>':'Ctrl+r','<C-v>':'Ctrl+v','<C-a>':'Ctrl+a','<C-x>':'Ctrl+x'}[k]||k);
const keyHTML=k=>`<kbd>${escapeHTML(label(k))}</kbd>`;
const selftest=location.search.includes('selftest');
let localStore=null;try{localStore=localStorage}catch{}
const progress=FieldworkProgress.create(missions,localStore);
let done=progress.done,demoTimer=null,appended=0,activeSnapshot=null,activeAdvance=null,activeDispose=()=>{},activeEditor=null,saveTimer=null;
function progressGroups(){
  return ['core','practice'].map(pass=>{
    const indices=missions.map((m,i)=>m.learning?.pass===pass?i:-1).filter(i=>i>=0);
    return {pass,indices,label:pass==='core'?'Main path':'Extra practice',completed:indices.filter(i=>done.has(i)).length};
  });
}
function persist(){
  if(selftest)return;
  if(activeSnapshot)progress.attempt=activeSnapshot();
  const ok=progress.save(),status=$('#save-status');
  const saveLabel=ok?'Progress':'Progress not saved';
  const group=progressGroups().find(g=>g.pass===missions[progress.current].learning?.pass);
  status.innerHTML=saveLabel+`<span class="progress-count">${group.pass==='practice'?'Extra · ':''}${group.completed} / ${group.indices.length}</span>`;
  status.title=ok?'Saved in this browser. Browse quizzes or back up progress.':'Browser storage is unavailable. Download a progress backup to keep this session.';
  status.setAttribute('aria-label',saveLabel+'. '+group.completed+' of '+group.indices.length+' '+group.label.toLowerCase()+' quizzes completed. Open all quizzes');status.classList.toggle('save-unavailable',!ok);
  $('#shuffle').setAttribute('aria-pressed',String(progress.shuffle));
  $('#shuffle').title=progress.shuffle?'Shuffle on — turn off':'Shuffle quizzes';
}
function scheduleSave(){if(selftest)return;clearTimeout(saveTimer);saveTimer=setTimeout(persist,250)}
window.addEventListener('pagehide',persist);document.addEventListener('visibilitychange',()=>{if(document.hidden)persist()});
// Content-derived identifiers allow progress to survive course additions and reordering.
// Character-level LCS keeps unrelated text unmarked, including repeated edits.
function rawDiff(a,b){const dp=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)dp[i][j]=a[i]===b[j]?1+dp[i+1][j+1]:Math.max(dp[i+1][j],dp[i][j+1]);const removed=new Set(),added=new Set();let i=0,j=0;while(i<a.length||j<b.length){if(i<a.length&&j<b.length&&a[i]===b[j]){i++;j++}else if(i<a.length&&(j===b.length||dp[i+1][j]>=dp[i][j+1]))removed.add(i++);else added.add(j++)}return {removed,added}}
function diff(a,b){const al=a.split('\n'),bl=b.split('\n');if(a!==b&&al.length>1&&al.length===bl.length&&[...al].sort().join('\n')===[...bl].sort().join('\n')){const removed=new Set(),added=new Set();let x=0,y=0;al.forEach((line,i)=>{if(line!==bl[i]){for(let j=0;j<line.length;j++)removed.add(x+j);for(let j=0;j<bl[i].length;j++)added.add(y+j)}x+=line.length+1;y+=bl[i].length+1});return {removed,added}}let start=0,end=0;while(start<a.length&&start<b.length&&a[start]===b[start])start++;while(end<a.length-start&&end<b.length-start&&a[a.length-1-end]===b[b.length-1-end])end++;const d=rawDiff(a.slice(start,a.length-end),b.slice(start,b.length-end));return {removed:new Set([...d.removed].map(i=>i+start)),added:new Set([...d.added].map(i=>i+start))}}
function codeHTML(text,marks,kind){let offset=0;return text.split('\n').map((line,i)=>{const start=offset;offset+=line.length+1;return `<div class="snippet-line"><span class="line-no">${i+1}</span><span>${[...line].map((c,j)=>marks.has(start+j)?`<mark class="${kind}">${c===' '?'␣':escapeHTML(c)}</mark>`:c===' '&&(line[j+1]===' '||line[j-1]===' '||j===line.length-1)?'<span class="visible-space">␣</span>':escapeHTML(c)).join('')||' '}${marks.has(start+line.length)&&i<text.split('\n').length-1?`<mark class="${kind}" title="Line break">↵</mark>`:''}</span></div>`}).join('')}
// Guides are decorations only. They never enter the buffer, registers or undo history.
function editHunks(current,target){
  if(current===target)return [];
  const aLines=current.split('\n'),bLines=target.split('\n');
  if(aLines.length>1&&aLines.length===bLines.length&&[...aLines].sort().join('\n')===[...bLines].sort().join('\n')){
    let offset=0;const hunks=[];aLines.forEach((line,i)=>{if(line!==bLines[i])hunks.push({from:offset,to:offset+line.length,insert:bLines[i]});offset+=line.length+1});return hunks;
  }
  let prefix=0,suffix=0;
  while(prefix<current.length&&prefix<target.length&&current[prefix]===target[prefix])prefix++;
  while(suffix<current.length-prefix&&suffix<target.length-prefix&&current.at(-1-suffix)===target.at(-1-suffix))suffix++;
  const a=current.slice(prefix,current.length-suffix),b=target.slice(prefix,target.length-suffix);
  const dp=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
  for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
  let i=0,j=0,h=null;const out=[];
  function flush(){if(h){out.push(h);h=null}}
  while(i<a.length||j<b.length){
    if(i<a.length&&j<b.length&&a[i]===b[j]){flush();i++;j++;continue}
    if(!h)h={from:prefix+i,to:prefix+i,insert:''};
    if(i<a.length&&(j===b.length||dp[i+1][j]>=dp[i][j+1])){i++;h.to=prefix+i}else h.insert+=b[j++];
  }
  flush();return out;
}
function decorateEditor(editor,target,specialCursor,deletionsOnly=false){
  const marks=[];const value=editor.getValue();let hunks=editHunks(value,target);
  if(specialCursor!==undefined&&value.slice(0,specialCursor)+value.slice(specialCursor+1)===target)hunks=[{from:specialCursor,to:specialCursor+1,insert:''}];
  editor.operation(()=>hunks.forEach(h=>{
    if(h.to>h.from){
      marks.push(editor.markText(editor.posFromIndex(h.from),editor.posFromIndex(h.to),{className:'mission-remove',title:'Remove this text'}));
      for(let n=h.from;n<h.to;n++)if(value[n]==='\n'){
        const sign=document.createElement('span');sign.className='ghost-newline';sign.textContent='− ↵';sign.title='Remove this line break';sign.setAttribute('aria-hidden','true');
        marks.push(editor.setBookmark(editor.posFromIndex(n),{widget:sign,insertLeft:true}));
      }
    }
    if(h.insert&&!deletionsOnly){
      const ghost=document.createElement('span');ghost.className='mission-ghost';ghost.setAttribute('aria-hidden','true');ghost.title='Add this text (guide only)';
      const badge=document.createElement('span');badge.className='ghost-plus';badge.textContent='+';ghost.append(badge);
      const content=document.createElement('span');content.className='ghost-text';content.textContent=h.insert;ghost.append(content);
      if(/^\s+$/.test(h.insert)){ghost.classList.add('ghost-whitespace');ghost.title=h.insert.includes('\n')?'Add a line break':`Add ${h.insert.length} ${h.insert.length===1?'space':'spaces'}`;badge.textContent=h.insert.includes('\n')?'↵':'+'}
      const position=editor.posFromIndex(h.to);
      ghost.addEventListener('mousedown',e=>{e.preventDefault();e.stopPropagation();editor.setCursor(position);editor.focus()});
      if(h.from===h.to&&position.ch===0&&h.insert.endsWith('\n')){
        ghost.classList.add('mission-ghost-block');content.textContent=h.insert.slice(0,-1);marks.push(editor.addLineWidget(position.line,ghost,{above:true,coverGutter:false}));
      }else if(h.from===h.to&&position.ch===editor.getLine(position.line).length&&h.insert.startsWith('\n')){
        ghost.classList.add('mission-ghost-block');content.textContent=h.insert.slice(1);marks.push(editor.addLineWidget(position.line,ghost,{above:false,coverGutter:false}));
      }else marks.push(editor.setBookmark(position,{widget:ghost,insertLeft:true}));
    }
  }));
  return marks;
}
// Target characters retain a mapping to the real buffer; annotations own deleted characters.
function projectTarget(value,target,specialCursor){
  let hunks=editHunks(value,target);
  if(specialCursor!==undefined&&value.slice(0,specialCursor)+value.slice(specialCursor+1)===target)hunks=[{from:specialCursor,to:specialCursor+1,insert:''}];
  const chars=[],removed=[];let source=0;
  for(const h of hunks){
    while(source<h.from){chars.push({text:value[source],source,missing:false});source++}
    if(h.to>h.from)removed.push({at:chars.length,from:h.from,text:value.slice(h.from,h.to)});
    for(const text of h.insert.split(''))chars.push({text,source:h.from,missing:true});
    source=h.to;
  }
  while(source<value.length){chars.push({text:value[source],source,missing:false});source++}
  return {chars,removed};
}
function renderTarget(editor,target,host,specialCursor){
  const value=editor.getValue(),model=projectTarget(value,target,specialCursor);
  const fragment=document.createDocumentFragment();let offset=0;
  function cell(text,source,kind){
    const span=document.createElement('span');span.className='target-char '+kind;span.textContent=text;span.dataset.source=source;if(kind==='target-missing'&&/^[ \t]$/.test(text)){span.classList.add('target-space');span.title=text==='\t'?'Insert a tab':'Insert a space'}

    return span;
  }
  target.split('\n').forEach((line,lineNo)=>{
    const row=document.createElement('div');row.className='target-row';
    const baseline=document.createElement('div');baseline.className='target-baseline';
    const num=document.createElement('span');num.className='target-line-number';num.textContent=lineNo+1;baseline.append(num);
    for(let i=0;i<line.length;i++){
      const c=model.chars[offset+i];
      baseline.append(cell(c.text,c.source,c.missing?'target-missing':'target-kept'));
    }
    const newline=model.chars[offset+line.length];
    const end=cell('\u00a0',newline?newline.source:value.length,newline?.missing?'target-missing target-linebreak':'target-end');
    if(newline?.missing){end.textContent='↵';end.title='Insert a line break'}
    baseline.append(end);row.append(baseline);fragment.append(row);offset+=line.length+1;
  });
  host.replaceChildren(fragment);
}

function appendCard(){
  const seq=appended++,id=progress.current,m=missions[id],resume=progress.attempt?.id===progress.keys[id]?progress.attempt:null;
  if(m.workspace)return appendWorkspaceCard(m,id,resume);
  const card=document.createElement('article');card.className='challenge-card';card.id=`edit-${seq}`;
  card.innerHTML=`<div class="task-heading"><div class="key-pal" aria-hidden="true"><span class="pal-eyes"><i></i><i></i></span><span class="pal-smile"></span><span class="pal-label">esc</span></div><h2>${escapeHTML(m.title)}</h2></div>
  <div class="practice"><div class="editing-pair"><section class="buffer-panel"><div class="editor-caption">Buffer</div><div class="live-editor"></div><div class="status"><span class="mode">NORMAL</span><span class="cursor"></span><button class="text-button reset">↺ Reset</button></div></section><section class="target-panel"><div class="editor-caption">Target <span>read only</span></div><div class="target-box" role="region" aria-label="Final output with remaining differences"><div class="target-projection"></div></div></section></div>
  <span class="sr-only" id="target-${seq}">Target text: ${escapeHTML(m.after)}</span>
  <div class="trail"><span>YOUR KEYS</span><div class="keys"></div><span class="key-count">0 keys</span></div>
  <div class="actions"><button class="quiet hint">Show a hint</button><button class="text-button skip">Skip →</button></div>
  <div class="hint-box" hidden></div><div class="result" aria-live="polite"></div></div>`;
  $('#challenge-feed').replaceChildren(card);
  const q=s=>card.querySelector(s);let keys=resume?.keys?.slice()||[],submitted=false,practicing=false,marks=[],checkTimer=null,drawFrame=null;
  const editor=CodeMirror(q('.live-editor'),{value:resume?.value??m.before,mode:m.ch==='HTML objects'?'xml':null,keyMap:'vim',lineNumbers:true,tabSize:2,indentUnit:2,viewportMargin:Infinity});
  editor.setCursor(...(resume?.cursor||m.cursor));activeEditor=editor;editor.getInputField().setAttribute('aria-label',`Edit: ${m.title}`);editor.getInputField().setAttribute('aria-describedby',`target-${seq}`);
  editor.setOption('extraKeys',{Tab:c=>{if(c.state.vim.insertMode)c.replaceSelection('  ');else q('.hint').focus()}});
  // Clicking to activate the exercise must not discard its intentional starting cursor.
  let pointerActivated=false;
  editor.getWrapperElement().addEventListener('mousedown',e=>{
    if(e.button!==0||e.target.closest('.CodeMirror-dialog,.CodeMirror-scrollbar-filler,.CodeMirror-vscrollbar,.CodeMirror-hscrollbar'))return;
    const activation=!editor.hasFocus()||(!pointerActivated&&keys.length===0);
    pointerActivated=true;
    if(activation){e.preventDefault();e.stopPropagation();editor.focus();return}
    if(e.target.closest('.mission-ghost,.ghost-newline'))return;
    const pos=editor.coordsChar({left:e.clientX,top:e.clientY},'window');
    const start=editor.charCoords({line:pos.line,ch:0},'window');
    const end=editor.charCoords({line:pos.line,ch:editor.getLine(pos.line).length},'window');
    if(e.clientY<start.top||e.clientY>start.bottom||e.clientX>end.right+4||e.clientX<start.left){
      e.preventDefault();e.stopPropagation();editor.focus();
    }
  },true);
  const projection=q('.target-projection');
  function drawGuides(){
    if(!card.isConnected)return;
    const special=id===0&&editor.getValue()===m.before?2:undefined;
    editor.operation(()=>{marks.forEach(mark=>mark.clear());marks=decorateEditor(editor,m.after,special,true)});
    renderTarget(editor,m.after,projection,special);
  }
  function renderKeys(){q('.keys').innerHTML=keys.slice(-70).map(keyHTML).join('');q('.key-count').textContent=`${keys.length} ${keys.length===1?'key':'keys'}`;if(q('.attempt-count'))q('.attempt-count').textContent=keys.length}
  function reset(){practicing=false;card.classList.remove('is-practicing');pointerActivated=false;clearTimeout(checkTimer);stopRecording();CodeMirror.Vim.handleKey(editor,'<Esc>');editor.setValue(m.before);editor.setCursor(...m.cursor);editor.clearHistory();keys=[];submitted=false;card.classList.remove('is-complete');editor.refresh();q('.result').innerHTML='';q('.hint-box').hidden=true;q('.actions').hidden=false;renderKeys();drawGuides();editor.focus()}
  function practiceAgain(){
    const feedback=q('.feedback');if(!feedback)return;
    reset();practicing=true;card.classList.add('is-practicing','is-complete');
    q('.result').append(feedback);q('.actions').hidden=true;
    feedback.querySelector('h3').textContent='Practice this method';
    feedback.querySelector('.success-medal').textContent='↻';
    feedback.querySelector('.attempt-count').textContent='0';
    q('.next kbd').hidden=true;editor.refresh();editor.focus();
  }
  function dispose(){clearTimeout(checkTimer);cancelAnimationFrame(drawFrame);clearTimeout(saveTimer);stopRecording();editor.getInputField().blur();marks.forEach(mark=>mark.clear());activeSnapshot=null}
  function next(){dispose();progress.next();appendCard();persist();window.scrollTo({top:0,behavior:'instant'})}
  activeAdvance=next;activeDispose=dispose;activeSnapshot=()=>({id:progress.keys[id],value:editor.getValue(),cursor:[editor.getCursor().line,editor.getCursor().ch],keys:keys.slice(-5000),guided:practicing});
  function complete(){
    if(!card.isConnected||submitted||editor.getValue()!==m.after)return;
    submitted=true;practicing=false;card.classList.remove('is-practicing');card.classList.add('is-complete');editor.refresh();done.add(id);persist();drawGuides();card.classList.add('celebrate');setTimeout(()=>card.classList.remove('celebrate'),900);q('.actions').hidden=true;
    showFeedback();
  }
  function showFeedback(){
    q('.result').innerHTML=`<div class="feedback"><div class="success-top"><div class="success-medal">✓</div><div><h3>You nailed it!</h3></div></div><p class="solution-label">A handy Vim way to do it:</p><div class="solution">${m.keys.map(keyHTML).join('')}</div><p>${escapeHTML(m.why)}</p><p class="score">Your attempt: <span class="attempt-count">${keys.length}</span> keys · This route: ${m.keys.length} keys</p><div class="feedback-actions"><button class="quiet retry" aria-keyshortcuts="Control+Enter">Practice this method <kbd>Ctrl ↵</kbd></button><button class="quiet watch">▷ Watch it happen</button><button class="primary next" aria-keyshortcuts="Enter">Next edit <kbd>Enter ↵</kbd></button></div></div>`;
    q('.retry').onclick=practiceAgain;q('.watch').onclick=()=>demo(m);q('.next').onclick=next;q('.next kbd').textContent=editor.state.vim.insertMode?'Esc · Enter ↵':'Enter ↵';
  }
  editor.on('vim-mode-change',e=>{q('.mode').textContent=e.mode.toUpperCase();if(submitted&&q('.next kbd'))q('.next kbd').textContent=e.mode==='normal'?'Enter ↵':'Esc · Enter ↵';cancelAnimationFrame(drawFrame);drawFrame=requestAnimationFrame(drawGuides)});
  editor.on('cursorActivity',()=>{const p=editor.getCursor();q('.cursor').textContent=`${p.line+1}:${p.ch+1}`;cancelAnimationFrame(drawFrame);drawFrame=requestAnimationFrame(drawGuides);scheduleSave()});
  editor.on('change',()=>{
    clearTimeout(checkTimer);cancelAnimationFrame(drawFrame);
    if(submitted){submitted=false;card.classList.remove('is-complete');editor.refresh();q('.result').innerHTML='';q('.actions').hidden=false}
    drawFrame=requestAnimationFrame(drawGuides);checkTimer=setTimeout(complete,180);scheduleSave();
  });
  editor.getWrapperElement().addEventListener('keydown',e=>{if(['Shift','Control','Alt','Meta','CapsLock'].includes(e.key)||e.metaKey||(e.key==='Tab'&&!editor.state.vim.insertMode))return;keys.push(e.key==='Escape'?'<Esc>':e.key==='Enter'?'<Enter>':e.key==='Backspace'?'<BS>':e.ctrlKey?`<C-${e.key}>`:e.key);renderKeys();scheduleSave()},true);
  card.addEventListener('keydown',e=>{
    if((submitted||practicing)&&e.key==='Enter'&&e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.shiftKey&&!e.repeat&&!$('#modal').open){e.preventDefault();e.stopPropagation();practiceAgain();return}
    if(!submitted||e.key!=='Enter'||e.repeat||e.ctrlKey||e.metaKey||e.altKey||e.shiftKey||$('#modal').open)return;
    if(!e.target.closest('.live-editor,.next')||e.target.closest('.CodeMirror-dialog'))return;
    if(editor.state.vim.insertMode||editor.state.vim.visualMode)return;
    e.preventDefault();e.stopPropagation();next();
  },true);
  q('.skip').onclick=next;q('.reset').onclick=()=>practicing?practiceAgain():reset();q('.hint').onclick=()=>{q('.hint-box').hidden=!q('.hint-box').hidden;q('.hint-box').textContent=m.hint};

  drawGuides();renderKeys();editor.refresh();
  if(resume?.guided&&editor.getValue()!==m.after){showFeedback();practicing=true;card.classList.add('is-practicing','is-complete');q('.actions').hidden=true;q('.feedback h3').textContent='Practice this method';q('.success-medal').textContent='↻';q('.next kbd').hidden=true}
  if(editor.getValue()===m.after)complete();
  if(location.hash!=='#faq')editor.focus();return card;
}

appendCard();persist();
if(offlineSource){$('#download').addEventListener('click',e=>{e.preventDefault();const url=URL.createObjectURL(new Blob([offlineSource],{type:'text/html;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='vim-1000.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)})}

function keyPlayer(editor){
  let command=null,first=true,insertRegister=false;
  return key=>{
    if(command===null&&editor.state.fieldworkWorkspace?.handleWindowKey(key))return;
    if(command!==null){
      if(key==='<Enter>'){
        if(command[0]===':')CodeMirror.Vim.handleEx(editor,command.slice(1));
        else{CodeMirror.Vim.handleKey(editor,command[0]);const input=editor.getWrapperElement().querySelector('.CodeMirror-dialog input');input.value=command.slice(1);input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',keyCode:13,which:13,bubbles:true}))}
        command=null;first=true;
      }else command+=key;
      return;
    }
    if(insertRegister){insertRegister=false;const text=CodeMirror.Vim.getRegisterController().getRegister(key).toString();editor.replaceSelection(text,'end','+input');CodeMirror.signal(editor,'inputRead',editor,{text:text.split('\n'),origin:'+input'});return}
    if(editor.state.vim.insertMode&&key==='<C-r>'){insertRegister=true;return}
    if(editor.state.vim.insertMode&&key==='<Enter>'){CodeMirror.commands.newlineAndIndent(editor);return}
    if((first||(editor.state.fieldworkWorkspace&&key===':'&&!editor.state.vim.insertMode))&&(key===':'||key==='/'||key==='?')){first=false;command=key;return}
    first=false;
    if(editor.state.vim.insertMode&&!/^<.+>$/.test(key)){
      if(editor.state.overwrite&&!editor.somethingSelected()){const pos=editor.getCursor();editor.setSelection(pos,{line:pos.line,ch:Math.min(pos.ch+key.length,editor.getLine(pos.line).length)})}
      editor.replaceSelection(key,'end','+input');CodeMirror.signal(editor,'inputRead',editor,{text:[key],origin:'+input'});
    }
    else CodeMirror.Vim.handleKey(editor,key);
  };
}
function feed(editor,sequence,step){const play=keyPlayer(editor);for(const key of sequence){play(key);if(step)step(key)}}
let demoCleanup=()=>{};
function stopRecording(){const state=CodeMirror.Vim.getVimGlobalState_().macroModeState;if(state.isRecording)state.exitMacroRecordMode()}
function demo(m){
  clearTimeout(demoTimer);demoCleanup();stopRecording();
  const originalVimState=CodeMirror.Vim.getVimGlobalState_();
  $('#modal-title').textContent='One edit, step by step.';
  $('#modal-body').innerHTML='<div id="demo"></div><div class="replay-status" aria-live="polite"></div><div class="demo-keys" aria-label="Choose a replay step">'+m.keys.map((key,i)=>`<button class="replay-step" type="button" data-step="${i+1}" aria-label="Step ${i+1}: ${escapeHTML(label(key))}">${keyHTML(key)}</button>`).join('')+'</div><div class="replay-controls"><button class="quiet" id="replay-start">Start</button><button class="quiet" id="replay-back" aria-label="Previous step">←</button><button class="primary" id="replay-play">Pause</button><button class="quiet" id="replay-next" aria-label="Next step">→</button><label>Speed <select id="replay-speed"><option value="1400">Slow</option><option value="800" selected>Normal</option><option value="400">Fast</option></select></label></div><p class="modal-note">'+escapeHTML(m.why)+'</p>';
  $('#modal').showModal();let d,play,n=0,playing=false;
  function render(){
    $('#replay-play').textContent=playing?'Pause':n===m.keys.length?'Replay':'Play';
    $('#replay-back').disabled=n===0;$('#replay-next').disabled=n===m.keys.length;
    document.querySelectorAll('.replay-step').forEach((button,i)=>{button.classList.toggle('played',i<n);button.setAttribute('aria-current',String(i===n-1))});
    const mode=d.state.vim.insertMode?'INSERT':d.state.vim.visualMode?'VISUAL':'NORMAL';
    $('.replay-status').textContent=`Step ${n} of ${m.keys.length} · ${mode}`;
  }
  function pause(){clearTimeout(demoTimer);playing=false;render()}
  function rebuild(){
    stopRecording();CodeMirror.Vim.resetVimGlobalState_();if(d)d.getInputField().blur();$('#demo').replaceChildren();
    d=CodeMirror($('#demo'),{value:m.before,mode:m.ch==='HTML objects'?'xml':null,keyMap:'vim',lineNumbers:true,tabSize:2,indentUnit:2});
    d.setCursor(...m.cursor);d.refresh();play=keyPlayer(d);n=0;
    // Keep playback deterministic: only the controls can change this buffer.
    d.getWrapperElement().addEventListener('keydown',e=>{if(e.key!=='Tab'){e.preventDefault();e.stopPropagation()}},true);
    d.getWrapperElement().addEventListener('mousedown',e=>{e.preventDefault();e.stopPropagation()},true);
  }
  function step(){if(n<m.keys.length){play(m.keys[n]);n++}if(n===m.keys.length)playing=false;render()}
  function schedule(){clearTimeout(demoTimer);if(playing)demoTimer=setTimeout(()=>{if(!$('#modal').open)return;step();schedule()},Number($('#replay-speed').value))}
  function seek(target){pause();rebuild();while(n<target){play(m.keys[n]);n++}render()}
  $('#replay-start').onclick=()=>seek(0);
  $('#replay-back').onclick=()=>seek(n-1);
  $('#replay-next').onclick=()=>{pause();step()};
  $('#replay-play').onclick=()=>{if(playing){pause();return}if(n===m.keys.length)seek(0);playing=true;render();schedule()};
  $('#replay-speed').onchange=schedule;
  document.querySelectorAll('.replay-step').forEach(button=>button.onclick=()=>seek(Number(button.dataset.step)));
  demoCleanup=()=>{clearTimeout(demoTimer);stopRecording();if(d)d.getInputField().blur();Object.assign(CodeMirror.Vim.getVimGlobalState_(),originalVimState);demoCleanup=()=>{}};
  rebuild();playing=true;render();schedule();
}
$('#close-modal').onclick=()=>$('#modal').close();$('#modal').addEventListener('close',()=>demoCleanup());$('#modal').addEventListener('click',e=>{if(e.target===$('#modal'))$('#modal').close()});
$('#reference').onclick=()=>{$('#modal-title').textContent='Vim reference';$('#modal-body').innerHTML=`<p class="modal-note">Normal mode is home. Press Escape to get back. Combine an operator with a motion or a text object: <kbd>c</kbd> + <kbd>iw</kbd> = change this word.</p><div class="ref-grid">${[
['Move','h j k l — left, down, up, right','w / b / e — next word / back / word end','0 / ^ / $ — line start / content start / end','gg / G — first / last line','f{char} / t{char} — find / stop before'],
['Edit','i / a — insert before / after','I / A — insert at start / end','o / O — new line below / above','x / r{char} — delete / replace character','u / Ctrl+r — undo / redo'],
['Compose','d / c / y — delete / change / yank','iw / aw — inner word / around word','i" / i( / i[ — inside delimiters','dd / cc / yy — operate on whole line','p / P — put after / before'],
['Patterns','\\(…\\) — capture; \\1 / \\2 — reuse captures','\\+ — one or more; * — zero or more','\\<word\\> — whole word; ^ / $ — line edges','& — whole match in replacement; \\& — literal &','\\c / \\C — ignore / respect case','Default Vim magic syntax; unsupported atoms report an error.'],
['Workspace',':ls / :buffer name — list / switch buffers',':bn / :bp / :b # — next / previous / alternate',':w / :bd — save / remove buffer',':sp / :vs file — stacked / side-by-side panes','Ctrl+w h/j/k/l — focus a pane; o — keep only it',':copen / :cn / :cp / :cc N — diagnostics',':vimgrep /pattern/ **/*.js — project search'],
['Go further','v / V — visual / visual line mode','/text then Enter — search; n repeats','* — next occurrence of current word','. — repeat the last change','qa … q / @a — record / play macro']].map(r=>`<section><h3>${r[0]}</h3>${r.slice(1).map(t=>`<p>${escapeHTML(t)}</p>`).join('')}</section>`).join('')}</div><p class="modal-note">Click the editor to capture keys. Tab in Normal mode moves focus to the buttons. A physical keyboard works best. This is a browser Vim sandbox powered by CodeMirror, with original exercises.</p>`;$('#modal').showModal()};

window.runCourseTests=()=>missions.map(m=>{
  if(m.workspace){const node=document.createElement("div");document.body.append(node);try{const r=Workspace.create(node,m,null,()=>{});feed(r.cm,m.keys);return {title:m.title,pass:r.solved(),checks:r.checks(),...(!r.solved()?{state:r.snapshot()}: {})}}catch(e){return {title:m.title,pass:false,error:String(e)}}finally{node.remove()}}
  const node=document.createElement('div');document.body.append(node);const test=CodeMirror(node,{keyMap:'vim',mode:m.ch==='HTML objects'?'xml':null,indentUnit:2,tabSize:2});test.setValue(m.before);test.setCursor(...m.cursor);let result,marks=[];
  function guides(){const value=test.getValue();const projection=projectTarget(value,m.after);if(projection.chars.map(c=>c.text).join('')!==m.after)throw new Error('Projection target mismatch');if(projection.chars.some(c=>c.source<0||c.source>value.length))throw new Error('Projection source out of range');test.operation(()=>{marks.forEach(x=>x.clear());marks=decorateEditor(test,m.after,undefined,true)});if(test.getValue()!==value)throw new Error('A guide changed the buffer');const hunks=editHunks(value,m.after);let rebuilt=value;for(const h of [...hunks].reverse())rebuilt=rebuilt.slice(0,h.from)+h.insert+rebuilt.slice(h.to);if(rebuilt!==m.after)throw new Error('Guide diff does not reconstruct the target')}
  try{guides();feed(test,m.keys,guides);guides();result={title:m.title,pass:test.getValue()===m.after,actual:test.getValue(),expected:m.after}}catch(e){result={title:m.title,pass:false,error:String(e)}}test.getInputField().blur();marks.forEach(x=>x.clear());node.remove();return result;
});
if(location.search.includes('selftest')){const results=runCourseTests();const pre=document.createElement('pre');pre.id='test-results';pre.textContent=JSON.stringify(results,null,2);document.body.prepend(pre);const wp=document.createElement("pre");wp.id="workspace-test-results";wp.textContent=JSON.stringify(runWorkspaceChecks());document.body.append(wp)}
