/* A bounded, offline Vim workspace. No shell commands or real filesystem access. */
const Workspace=(()=>{
  const clone=x=>JSON.parse(JSON.stringify(x));
  function create(host,mission,saved,onChange=()=>{}){
    const spec=mission.workspace;
    let s=clone(saved||{files:spec.files,saved:spec.files,listed:Object.keys(spec.files),panes:spec.panes||[spec.start],active:0,layout:spec.layout||'single',alternate:null,quickfix:spec.quickfix||[],qi:0,qopen:false,cursors:{}});
    // A damaged backup must not add files or remove exercise files.
    if(Object.keys(spec.files).some(f=>typeof s.files?.[f]!=='string'))throw Error('Invalid workspace backup');
    const docs={};Object.keys(s.files).forEach(f=>docs[f]=new CodeMirror.Doc(s.files[f]));
    const cm=CodeMirror(host,{value:'',keyMap:'vim',lineNumbers:true,indentUnit:2,tabSize:2,viewportMargin:Infinity});
    cm.state.fieldworkWorkspace=apiPlaceholder;let busy=false;
    function current(){return s.panes[s.active]}
    function sync(){Object.keys(docs).forEach(f=>s.files[f]=docs[f].getValue());s.cursors[current()]=cm.getCursor()}
    function show(){busy=true;if(cm.getDoc()!==docs[current()])cm.swapDoc(docs[current()]);const p=s.cursors[current()];if(p)cm.setCursor(p);busy=false;onChange(api)}
    function clean(){sync();if(s.files[current()]!==s.saved[current()]&&s.panes.filter(f=>f===current()).length===1)throw Error('E37: No write since last change. Use :write first.')}
    function select(file){if(!docs[file])throw Error('E94: No matching buffer');if(file!==current()){clean();s.alternate=current();s.panes[s.active]=file;if(!s.listed.includes(file))s.listed.push(file)}show()}
    function qjump(i){if(!s.quickfix.length)throw Error('E42: No quickfix entries');if(i<0||i>=s.quickfix.length)throw Error('E553: No more items');const e=s.quickfix[i];select(e.file);s.qi=i;cm.setCursor(e.line,e.ch||0);sync();onChange(api)}
    function command(name,arg=''){
      sync();arg=arg.trim();
      if(name==='write'){s.saved[current()]=s.files[current()]}
      else if(name==='buffers'){s.bufferList=true}
      else if(name==='buffer'||name==='edit'){const file=arg==='#'?s.alternate:/^\d+$/.test(arg)?Object.keys(docs)[Number(arg)-1]:arg;select(file);return}
      else if(name==='bnext'||name==='bprevious'){const i=s.listed.indexOf(current());select(s.listed[(i+(name==='bnext'?1:s.listed.length-1))%s.listed.length]);return}
      else if(name==='bdelete'){const file=arg||current();if(!s.listed.includes(file))throw Error('No matching buffer');if(s.files[file]!==s.saved[file])throw Error('E89: No write since last change');if(s.listed.length===1)throw Error('Keep at least one buffer');s.listed=s.listed.filter(f=>f!==file);s.panes=s.panes.map(f=>f===file?s.listed[0]:f)}
      else if(name==='split'||name==='vsplit'){if(s.panes.length>=2)throw Error('This exercise supports two panes. Close one first.');const file=arg||current();if(!docs[file])throw Error('Unknown exercise file');s.panes.splice(s.active,0,file);s.layout=name==='vsplit'?'vertical':'horizontal'}
      else if(name==='only'){if(s.panes.some(f=>f!==current()&&s.files[f]!==s.saved[f]))throw Error('E445: Other window contains changes. Save it first.');s.panes=[current()];s.active=0;s.layout='single'}
      else if(name==='close'){if(s.panes.length===1)throw Error('E444: Cannot close last window');clean();s.panes.splice(s.active,1);s.active=0;s.layout='single'}
      else if(name==='wincmd'){
        if(arg==='v')return command('vsplit');if(arg==='s')return command('split');if(arg==='o')return command('only');if(arg==='c')return command('close');
        if(arg==='w')s.active=(s.active+1)%s.panes.length;
        else if('hljk'.includes(arg)&&arg.length===1){const horizontal=arg==='h'||arg==='l';if((horizontal&&s.layout==='vertical')||(!horizontal&&s.layout==='horizontal'))s.active=(arg==='h'||arg==='k')?0:s.panes.length-1}
        else throw Error('Supported window keys: h j k l w s v c o');
      }
      else if(name==='copen'){s.qopen=true}
      else if(name==='cclose'){s.qopen=false}
      else if(name==='cnext')return qjump(s.qi+1);
      else if(name==='cprevious')return qjump(s.qi-1);
      else if(name==='cfirst')return qjump(0);
      else if(name==='clast')return qjump(s.quickfix.length-1);
      else if(name==='cc')return qjump(arg?Number(arg)-1:s.qi);
      else if(name==='vimgrep'){
        const match=arg.match(/^\/(.+)\/([gj]*)\s+(.+)$/);if(!match)throw Error('Use :vimgrep /pattern/[g][j] file-pattern');
        const pattern=match[1];
        const re=VimRegex.compile(pattern,'g');const globs=match[3].split(/\s+/).map(g=>new RegExp('^'+g.split('**/').map(part=>part.split('*').map(x=>x.replace(/[.+?^${}()|[\]\\]/g,'\\$&')).join('[^/]*')).join('(?:.*/)?')+'$'));
        const results=[];Object.keys(s.files).filter(f=>globs.some(g=>g.test(f))).sort().forEach(file=>s.saved[file].split('\n').forEach((line,n)=>{re.lastIndex=0;let m;while((m=re.exec(line))){results.push({file,line:n,ch:m.index,text:line});if(!match[2].includes('g'))break;if(!m[0].length)re.lastIndex++}}));
        if(!results.length)throw Error('E480: Pattern not found');s.quickfix=results;s.qi=0;if(!match[2].includes('j'))return qjump(0);
      }else throw Error('Unsupported workspace command');
      show();
    }
    function snapshot(){sync();return clone(s)}
    function checks(){sync();const g=spec.goal,out=[];
      if(g.alternate)out.push({label:'Alternate file: '+g.alternate,pass:s.alternate===g.alternate});
      if(g.current)out.push({label:'Active file: '+g.current,pass:current()===g.current});
      if(g.panes)out.push({label:'Open panes: '+g.panes.join(' · '),pass:JSON.stringify(s.panes)===JSON.stringify(g.panes)});
      if(g.layout)out.push({label:({single:'One pane',vertical:'Side-by-side panes',horizontal:'Stacked panes'})[g.layout],pass:s.layout===g.layout});
      if(g.listed)out.push({label:'Buffer list: '+g.listed.join(' · '),pass:JSON.stringify(s.listed)===JSON.stringify(g.listed)});
      if(g.quickfixOpen!==undefined)out.push({label:'Quickfix '+(g.quickfixOpen?'visible':'closed'),pass:s.qopen===g.quickfixOpen});
      if(g.matches)out.push({label:'Search results: '+g.matches.map(e=>e.file+':'+(e.line+1)).join(' · '),pass:JSON.stringify(s.quickfix.map(e=>[e.file,e.line,e.ch||0]))===JSON.stringify(g.matches.map(e=>[e.file,e.line,e.ch||0]))});
      if(g.cursor)out.push({label:'Cursor: line '+(g.cursor[0]+1)+', column '+(g.cursor[1]+1),pass:cm.getCursor().line===g.cursor[0]&&cm.getCursor().ch===g.cursor[1]});
      Object.entries(g.files||{}).forEach(([f,text])=>out.push({label:'Save '+f,pass:s.files[f]===text&&s.saved[f]===text}));
      // Unmentioned files must remain untouched.
      out.push({label:'Other files unchanged',pass:Object.entries(spec.files).every(([f,text])=>f in (g.files||{})||s.files[f]===text)});
      return out;
    }
    let windowPending=false;
    function handleWindowKey(key){if(cm.state.vim?.insertMode)return false;if(key==='<C-w>'){windowPending=true;return true}if(windowPending){windowPending=false;if(key==='<Esc>')return true;command('wincmd',key==='<C-w>'?'w':key);return true}return false}
    const api={cm,command,handleWindowKey,snapshot,checks,current,state:()=>s,solved:()=>checks().every(c=>c.pass)};
    function apiPlaceholder(){}cm.state.fieldworkWorkspace=api;
    cm.getWrapperElement().addEventListener('keydown',e=>{const key=e.key==='Escape'?'<Esc>':e.ctrlKey?'<C-'+e.key+'>':e.key;try{if(handleWindowKey(key)){e.preventDefault();e.stopPropagation()}}catch(error){e.preventDefault();e.stopPropagation();cm.openNotification(error.message,{duration:2500})}},true);
    cm.on('change',()=>{if(!busy){sync();onChange(api)}});cm.on('cursorActivity',()=>{if(!busy)onChange(api)});show();return api;
  }
  [['buffer','b'],['buffers','ls'],['bnext','bn'],['bprevious','bp'],['bdelete','bd'],['edit','e'],['write','w'],['split','sp'],['vsplit','vs'],['only','on'],['close','clo'],['wincmd','winc'],['copen','cope'],['cclose','ccl'],['cnext','cn'],['cprevious','cp'],['cfirst','cfir'],['clast','cla'],['cc','cc'],['vimgrep','vim']].forEach(([name,prefix])=>{
    // buffers has the additional :ls alias; defineEx requires a true prefix.
    CodeMirror.Vim.defineEx(name,name==='buffers'?'buffers':prefix,(cm,p)=>{if(!cm.state.fieldworkWorkspace)throw Error('This command is available in workspace exercises.');cm.state.fieldworkWorkspace.command(name,p.argString||'')});
  });
  CodeMirror.Vim.defineEx('ls','ls',cm=>{if(cm.state.fieldworkWorkspace)cm.state.fieldworkWorkspace.command('buffers')});
  CodeMirror.Vim.defineEx('bprev','bprev',(cm,p)=>cm.state.fieldworkWorkspace?.command('bprevious',p.argString||''));
  CodeMirror.Vim.defineEx('cprev','cprev',(cm,p)=>cm.state.fieldworkWorkspace?.command('cprevious',p.argString||''));
  'hjklwvsoc'.split('').forEach(key=>{const name='fieldworkWindow'+key;CodeMirror.Vim.defineAction(name,cm=>cm.state.fieldworkWorkspace?.command('wincmd',key));CodeMirror.Vim.mapCommand('<C-w>'+key,'action',name,{}, {context:'normal'})});
  CodeMirror.Vim.defineAction('fieldworkAlternate',cm=>cm.state.fieldworkWorkspace?.command('buffer','#'));CodeMirror.Vim.mapCommand('<C-^>','action','fieldworkAlternate',{}, {context:'normal'});
  return {create};
})();
