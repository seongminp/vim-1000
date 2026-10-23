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
let saved={};try{saved=JSON.parse(localStorage.getItem('vim-fieldwork-v1')||'{}')}catch{}
let done=new Set(Array.isArray(saved.done)?saved.done:[]), demoTimer=null, appended=Number.isSafeInteger(saved.position)&&saved.position>=0?saved.position:0;

function persist(){try{localStorage.setItem('vim-fieldwork-v1',JSON.stringify({done:[...done],position:Math.max(0,appended-1)}))}catch{}}
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
function decorateEditor(editor,target,specialCursor){
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
    if(h.insert){
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
function appendCard(){
  const seq=appended++,id=seq<missions.length?seq:(seq*17)%missions.length,m=missions[id];
  const card=document.createElement('article');card.className='challenge-card';card.id=`edit-${seq}`;
  card.innerHTML=`<div class="task-heading"><div class="key-pal" aria-hidden="true"><span class="pal-eyes"><i></i><i></i></span><span class="pal-smile"></span><span class="pal-label">esc</span></div><h2>${escapeHTML(m.title)}</h2></div>
  <div class="guide-toolbar"><div class="guide-legend"><span class="legend-add">add</span><span class="legend-remove">remove</span></div><button class="text-button guides" aria-pressed="true">Hide guides</button></div>
  <div class="practice"><div class="live-editor"></div><div class="status"><span class="mode">NORMAL</span><span class="cursor"></span><button class="text-button reset">↺ Reset</button></div>
  <span class="sr-only" id="target-${seq}">Target text: ${escapeHTML(m.after)}</span>
  <div class="trail"><span>YOUR KEYS</span><div class="keys"></div><span class="key-count">0 keys</span></div>
  <div class="first-tip" ${id===0?'':'hidden'}>The cursor is on the extra <strong>p</strong>. Press <kbd>x</kbd> to delete it.</div>
  <div class="actions"><button class="quiet hint">Show a hint</button><button class="text-button skip">Skip →</button></div>
  <div class="hint-box" hidden></div><div class="result" aria-live="polite"></div></div>`;
  $('#challenge-feed').replaceChildren(card);
  const q=s=>card.querySelector(s);let keys=[],submitted=false,guides=true,marks=[],checkTimer=null,drawFrame=null;
  const editor=CodeMirror(q('.live-editor'),{value:m.before,mode:m.ch==='HTML objects'?'xml':null,keyMap:'vim',lineNumbers:true,tabSize:2,indentUnit:2,viewportMargin:Infinity});
  editor.setCursor(...m.cursor);editor.getInputField().setAttribute('aria-label',`Edit: ${m.title}`);editor.getInputField().setAttribute('aria-describedby',`target-${seq}`);
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
  function drawGuides(){
    if(!card.isConnected)return;
    editor.operation(()=>{marks.forEach(mark=>mark.clear());marks=[];if(guides&&editor.getValue().length<6000)marks=decorateEditor(editor,m.after,id===0&&editor.getValue()===m.before?2:undefined)});
  }
  function renderKeys(){q('.keys').innerHTML=keys.slice(-70).map(keyHTML).join('');q('.key-count').textContent=`${keys.length} ${keys.length===1?'key':'keys'}`;if(submitted&&q('.attempt-count'))q('.attempt-count').textContent=keys.length}
  function reset(){pointerActivated=false;clearTimeout(checkTimer);stopRecording();CodeMirror.Vim.handleKey(editor,'<Esc>');editor.setValue(m.before);editor.setCursor(...m.cursor);editor.clearHistory();keys=[];submitted=false;q('.result').innerHTML='';q('.hint-box').hidden=true;q('.actions').hidden=false;renderKeys();drawGuides();editor.focus()}
  function next(){clearTimeout(checkTimer);cancelAnimationFrame(drawFrame);stopRecording();editor.getInputField().blur();marks.forEach(mark=>mark.clear());appendCard();persist();window.scrollTo({top:0,behavior:'instant'})}
  function complete(){
    if(!card.isConnected||submitted||editor.getValue()!==m.after)return;
    submitted=true;done.add(id);persist();drawGuides();card.classList.add('celebrate');setTimeout(()=>card.classList.remove('celebrate'),900);q('.actions').hidden=true;
    q('.result').innerHTML=`<div class="feedback"><div class="success-top"><div class="success-medal">✓</div><div><div class="success-label">EXACT MATCH</div><h3>You nailed it!</h3></div></div><p class="solution-label">A handy Vim way to do it:</p><div class="solution">${m.keys.map(keyHTML).join('')}</div><p>${escapeHTML(m.why)}</p><p class="score">Your attempt: <span class="attempt-count">${keys.length}</span> keys · This route: ${m.keys.length} keys</p><div class="feedback-actions"><button class="quiet watch">▷ Watch it happen</button><button class="primary next">Next edit →</button></div></div>`;
    q('.watch').onclick=()=>demo(m);q('.next').onclick=next;
  }
  editor.on('vim-mode-change',e=>q('.mode').textContent=e.mode.toUpperCase());
  editor.on('cursorActivity',()=>{const p=editor.getCursor();q('.cursor').textContent=`${p.line+1}:${p.ch+1}`});
  editor.on('change',()=>{
    clearTimeout(checkTimer);cancelAnimationFrame(drawFrame);
    if(submitted){submitted=false;q('.result').innerHTML='';q('.actions').hidden=false}
    drawFrame=requestAnimationFrame(drawGuides);checkTimer=setTimeout(complete,180);
  });
  editor.getWrapperElement().addEventListener('keydown',e=>{if(['Shift','Control','Alt','Meta','CapsLock'].includes(e.key)||e.metaKey||(e.key==='Tab'&&!editor.state.vim.insertMode))return;keys.push(e.key==='Escape'?'<Esc>':e.key==='Enter'?'<Enter>':e.key==='Backspace'?'<BS>':e.ctrlKey?`<C-${e.key}>`:e.key);renderKeys()},true);
  q('.skip').onclick=next;q('.reset').onclick=reset;q('.hint').onclick=()=>{q('.hint-box').hidden=!q('.hint-box').hidden;q('.hint-box').textContent=m.hint};
  q('.guides').onclick=()=>{guides=!guides;q('.guides').textContent=guides?'Hide guides':'Show guides';q('.guides').setAttribute('aria-pressed',String(guides));drawGuides();editor.focus()};
  drawGuides();editor.refresh();editor.focus();return card;
}

appendCard();persist();
if(offlineSource){$('#download').addEventListener('click',e=>{e.preventDefault();const url=URL.createObjectURL(new Blob([offlineSource],{type:'text/html;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='vim-fieldwork.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)})}

function keyPlayer(editor){
  let command=null,first=true;
  return key=>{
    if(command!==null){
      if(key==='<Enter>'){
        if(command[0]===':')CodeMirror.Vim.handleEx(editor,command.slice(1));
        else{CodeMirror.Vim.handleKey(editor,command[0]);const input=editor.getWrapperElement().querySelector('.CodeMirror-dialog input');input.value=command.slice(1);input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',keyCode:13,which:13,bubbles:true}))}
        command=null;
      }else command+=key;
      return;
    }
    if(first&&(key===':'||key==='/'||key==='?')){first=false;command=key;return}
    first=false;
    if(editor.state.vim.insertMode&&!key.startsWith('<')){editor.replaceSelection(key);CodeMirror.signal(editor,'inputRead',editor,{text:[key],origin:'+input'})}
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
$('#reference').onclick=()=>{$('#modal-title').textContent='Your pocket reference';$('#modal-body').innerHTML=`<p class="modal-note">Normal mode is home. Press Escape to get back. Combine an operator with a motion or a text object: <kbd>c</kbd> + <kbd>iw</kbd> = change this word.</p><div class="ref-grid">${[
['Move','h j k l — left, down, up, right','w / b / e — next word / back / word end','0 / ^ / $ — line start / content start / end','gg / G — first / last line','f{char} / t{char} — find / stop before'],
['Edit','i / a — insert before / after','I / A — insert at start / end','o / O — new line below / above','x / r{char} — delete / replace character','u / Ctrl+r — undo / redo'],
['Compose','d / c / y — delete / change / yank','iw / aw — inner word / around word','i" / i( / i[ — inside delimiters','dd / cc / yy — operate on whole line','p / P — put after / before'],
['Go further','v / V — visual / visual line mode','/text then Enter — search; n repeats','* — next occurrence of current word','. — repeat the last change','qa … q / @a — record / play macro']].map(r=>`<section><h3>${r[0]}</h3>${r.slice(1).map(t=>`<p>${escapeHTML(t)}</p>`).join('')}</section>`).join('')}</div><p class="modal-note">Click the editor to capture keys. Tab in Normal mode moves focus to the buttons. A physical keyboard works best. This is a browser Vim sandbox powered by CodeMirror, with original exercises.</p>`;$('#modal').showModal()};

window.runCourseTests=()=>missions.map(m=>{
  const node=document.createElement('div');document.body.append(node);const test=CodeMirror(node,{keyMap:'vim',mode:m.ch==='HTML objects'?'xml':null,indentUnit:2,tabSize:2});test.setValue(m.before);test.setCursor(...m.cursor);let result,marks=[];
  function guides(){const value=test.getValue();test.operation(()=>{marks.forEach(x=>x.clear());marks=decorateEditor(test,m.after)});if(test.getValue()!==value)throw new Error('A guide changed the buffer');const hunks=editHunks(value,m.after);let rebuilt=value;for(const h of [...hunks].reverse())rebuilt=rebuilt.slice(0,h.from)+h.insert+rebuilt.slice(h.to);if(rebuilt!==m.after)throw new Error('Guide diff does not reconstruct the target')}
  try{guides();feed(test,m.keys,guides);guides();result={title:m.title,pass:test.getValue()===m.after,actual:test.getValue(),expected:m.after}}catch(e){result={title:m.title,pass:false,error:String(e)}}test.getInputField().blur();marks.forEach(x=>x.clear());node.remove();return result;
});
if(location.search.includes('selftest')){const results=runCourseTests();const pre=document.createElement('pre');pre.id='test-results';pre.textContent=JSON.stringify(results,null,2);document.body.prepend(pre)}
