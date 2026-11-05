/* Local-only progress. Content-derived IDs survive appended or reordered courses. */
(function(root){
  function quizKey(m){let a=2166136261,b=5381;const s=m.before+'\0'+m.after;for(let i=0;i<s.length;i++){a=Math.imul(a^s.charCodeAt(i),16777619);b=Math.imul(b,33)^s.charCodeAt(i)}return 'q-'+(a>>>0).toString(16)+'-'+(b>>>0).toString(16)}
  function create(course,storage,random=Math.random){
    const keys=course.map(quizKey),byKey=new Map(keys.map((k,i)=>[k,i])),key='vim-fieldwork-progress-v2';
    let raw={};
    try {
      raw=JSON.parse(storage?.getItem(key)||'null')||{};
      if(raw.version!==2){
        const legacyJSON=storage?.getItem('vim-fieldwork-v1');
        if(legacyJSON){
          const old=JSON.parse(legacyJSON)||{};
          raw={version:2,completed:(old.done||[]).map(i=>keys[course.findIndex(q=>q.legacyIndex===i)]||keys[i]).filter(Boolean),current:keys[course.findIndex(q=>q.legacyIndex===(old.position||0))]||keys[Math.max(0,old.position||0)%keys.length]};
        }else raw={version:2,current:keys[0],completed:[]};
      }
    }catch{raw={}}
    function normalize(input){
      if(!input||input.version!==2)throw new Error('Choose a Vim 1000 progress backup.');
      const completed=[...new Set(Array.isArray(input.completed)?input.completed.filter(k=>byKey.has(k)):[])];
      const current=byKey.has(input.current)?input.current:keys[0];
      const remaining=[...new Set(Array.isArray(input.remaining)?input.remaining.filter(k=>byKey.has(k)&&k!==current):[])];
      let attempt=null;const a=input.attempt;
      if(a&&a.id===current&&typeof a.value==='string'&&a.value.length<100000&&Array.isArray(a.cursor)&&a.cursor.length===2&&a.cursor.every(n=>Number.isInteger(n)&&n>=0))attempt={id:current,value:a.value,cursor:a.cursor,keys:Array.isArray(a.keys)?a.keys.filter(k=>typeof k==='string'&&k.length<30).slice(-5000):[],guided:a.guided===true,...(a.workspace&&typeof a.workspace==='object'?{workspace:a.workspace}:{})};
      if(attempt?.workspace){
        const w=attempt.workspace,spec=course[byKey.get(current)].workspace;
        const files=spec?Object.keys(spec.files):[];
        const valid=spec&&w.files&&w.saved&&files.every(f=>typeof w.files[f]==='string'&&w.files[f].length<100000&&typeof w.saved[f]==='string')&&Object.keys(w.files).length===files.length&&Array.isArray(w.listed)&&w.listed.length&&w.listed.every(f=>files.includes(f))&&Array.isArray(w.panes)&&w.panes.length>0&&w.panes.length<=2&&w.panes.every(f=>files.includes(f))&&Number.isInteger(w.active)&&w.active>=0&&w.active<w.panes.length&&['single','vertical','horizontal'].includes(w.layout)&&Array.isArray(w.quickfix)&&w.quickfix.length<10000&&w.quickfix.every(e=>files.includes(e.file)&&Number.isInteger(e.line)&&e.line>=0&&Number.isInteger(e.ch||0)&&(e.ch||0)>=0)&&Number.isInteger(w.qi)&&w.qi>=0&&w.qi<=Math.max(0,w.quickfix.length-1)&&w.cursors&&typeof w.cursors==='object';
        if(!valid)throw new Error('Invalid workspace in progress backup.');
      }
      return {version:2,current,completed,remaining,shuffle:input.shuffle===true,attempt};
    }
    let state;try{state=normalize({...raw,version:2})}catch{state=normalize({version:2})}let done=new Set(state.completed.map(k=>byKey.get(k)));
    function shuffled(values){for(let i=values.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[values[i],values[j]]=[values[j],values[i]]}return values}
    const api={keys,done,get current(){return byKey.get(state.current)},get shuffle(){return state.shuffle},set shuffle(on){state.shuffle=!!on},get attempt(){return state.attempt},set attempt(a){state.attempt=a},
      snapshot(){return {...state,completed:[...done].map(i=>keys[i]),savedAt:new Date().toISOString()}},
      save(){try{if(!storage)return false;storage.setItem(key,JSON.stringify(api.snapshot()));return true}catch{return false}},
      next(){
        const current=api.current;let next;
        if(state.shuffle){
          const unfinished=keys.filter((k,i)=>!done.has(i)&&i!==current);
          const pool=unfinished.length?unfinished:keys.filter((k,i)=>i!==current);
          const allowed=new Set(pool);state.remaining=state.remaining.filter(k=>allowed.has(k));
          if(!state.remaining.length)state.remaining=shuffled(pool.slice());
          next=state.remaining.pop()||keys[current];
        }else{let i=(current+1)%keys.length;if(done.size<keys.length){for(let n=0;n<keys.length&&done.has(i);n++)i=(i+1)%keys.length}next=keys[i]}
        state.current=next;state.attempt=null;return api.current;
      },
      jump(index){
        if(!Number.isInteger(index)||index<0||index>=keys.length)return false;
        if(index!==api.current){state.current=keys[index];state.attempt=null;state.remaining=state.remaining.filter(k=>k!==state.current)}
        return true;
      },
      restore(input){state=normalize(input);done.clear();state.completed.forEach(k=>done.add(byKey.get(k)));return api.save()},
    };return api;
  }
  root.FieldworkProgress={create,quizKey};
})(typeof globalThis==='undefined'?window:globalThis);
