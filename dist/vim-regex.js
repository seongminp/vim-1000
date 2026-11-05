/* Native Vim's default 'magic' syntax, bounded to the constructs taught here.
 * Unsupported Vim atoms fail closed rather than becoming JavaScript patterns.
 */
(function(root){
 const literal=c=>c.replace(/[\\^$.*+?()[\]{}|/]/g,'\\$&');
 function source(pattern){
  let out='',ignoreCase=null,atom=false,inClass=false;
  for(let i=0;i<pattern.length;i++){
   const c=pattern[i];
   if(inClass){
    if(c===']'){out+=c;inClass=false;atom=true;continue}
    if(c==='['&&[':','.','='].includes(pattern[i+1]))throw Error('POSIX/collating classes are not supported in this sandbox.');
    if(c==='\\'){const n=pattern[++i];if(n===undefined)throw Error('Trailing backslash');if(n==='t')out+='\\t';else if('\\]^-/'.includes(n))out+='\\'+n;else throw Error('Unsupported character-class escape: \\'+n)}
    else out+=c;continue;
   }
   if(c==='['){out+='[';if(pattern[i+1]==='^'){out+='^';i++}if(pattern[i+1]===']'){out+='\\]';i++}inClass=true;continue}
   if(c==='\\'){
    const n=pattern[++i];if(n===undefined)throw Error('Trailing backslash');
    if(n==='c'||n==='C'){ignoreCase=n==='c';continue}
    if(n==='m')continue;
    if('vVM'.includes(n))throw Error('Only default Vim magic syntax (\\m) is supported here.');
    if(n==='('){out+='(';atom=false;continue}if(n===')'){out+=')';atom=true;continue}
    if(n==='|'){out+='|';atom=false;continue}
    if(n==='+'||n==='?'||n==='='){if(!atom)throw Error('Quantifier needs an atom');out+=n==='='?'?':n;continue}
    if(n==='{'){const end=pattern.indexOf('}',i+1);if(end<0)throw Error('Unclosed repetition');const body=pattern.slice(i+1,end);if(!atom||!/^\d+(,\d*)?$/.test(body))throw Error('Only numeric greedy repetitions are supported');out+='{'+body+'}';i=end;continue}
    if(n==='<'){out+='(?<![\\p{L}\\p{N}_])(?=[\\p{L}\\p{N}_])';atom=false;continue}
    if(n==='>'){out+='(?<=[\\p{L}\\p{N}_])(?![\\p{L}\\p{N}_])';atom=false;continue}
    if(n==='s'){out+='[ \\t]';atom=true;continue}if(n==='S'){out+='[^ \\t\\r\\n]';atom=true;continue}
    if('dDwW'.includes(n)){out+='\\'+n;atom=true;continue}
    if(n==='t'){out+='\\t';atom=true;continue}
    if(/[1-9]/.test(n)){out+='\\'+n;atom=true;continue}
    if(/[A-Za-z0-9_%@&]/.test(n))throw Error('Unsupported Vim regex atom: \\'+n);
    out+=literal(n);atom=true;continue;
   }
   if(c==='~')throw Error('Previous-replacement patterns are not supported. Escape ~ for a literal.');
   if(c==='^'){out+=(!out||out.endsWith('(')||out.endsWith('|'))?'^':'\\^';atom=false;continue}
   if(c==='$'){const tail=pattern.slice(i+1);out+=(!tail||/^\\[)|]/.test(tail))?'$':'\\$';atom=false;continue}
   if(c==='*'){out+=atom?'*':'\\*';continue}
   if(c==='.'){out+='.';atom=true;continue}
   out+=literal(c);atom=true;
  }
  if(inClass)throw Error('Unclosed character class');
  return {source:out,ignoreCase};
 }
 function compile(pattern,flags=''){
  if(/[^gimI]/.test(flags))throw Error('Unsupported regex flags');
  const p=source(pattern);const ic=p.ignoreCase===null?(flags.includes('i')&&!flags.includes('I')):p.ignoreCase;
  return new RegExp(p.source,'mu'+(ic?'i':'')+(flags.includes('g')?'g':''));
 }
 function replacement(text,delimiter='/'){
  const parts=[];for(let i=0;i<text.length;i++){const c=text[i];if(c==='&'){parts.push({group:0});continue}if(c==='~')throw Error('Previous-replacement expansion is not supported; use \\~ for a literal.');if(c!=='\\'){parts.push(c);continue}const n=text[++i];if(n===undefined)throw Error('Trailing replacement backslash');if(/[0-9]/.test(n))parts.push({group:Number(n)});else if(n==='r')parts.push('\n');else if(n==='t')parts.push('\t');else if(n===delimiter||'\\/&~'.includes(n))parts.push(n);else throw Error('Unsupported Vim replacement escape: \\'+n)}
  return (...args)=>{const matches=args.slice(0,-2);return parts.map(p=>typeof p==='string'?p:matches[p.group]||'').join('')};
 }
 root.VimRegex={compile,source,replacement,escapePattern:text=>text.replace(/[\\.^$*\[\]~]/g,'\\$&')};
})(typeof globalThis==='undefined'?window:globalThis);
