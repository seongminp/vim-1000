const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');require('../dist/vim-regex.js');
const cases=[
 ['groups','red blue',String.raw`\(\w\+\) \(\w\+\)`,String.raw`\2 \1`,''],
 ['literal operators','a+b? (x)|{2}',String.raw`a+b? (x)|{2}`,'yes',''],
 ['alternation','true false falsehood',String.raw`\<\(true\|false\)\>`,String.raw`[\1]`,'g'],
 ['bounds','id user_id id2 id',String.raw`\<id\>`,'key','g'],
 ['unicode bounds','café caféine café',String.raw`\<café\>`,'tea','g'],
 ['case sensitive','Foo foo FOO','foo','x','g'],
 ['case flag','Foo foo FOO','foo','x','gi'],
 ['inline case','Foo foo FOO',String.raw`\cfoo`,'x','g'],
 ['force case','Foo foo FOO',String.raw`\Cfoo`,'x','gi'],
 ['optional','color colour',String.raw`colou\?r`,'paint','g'],
 ['equals optional','color colour',String.raw`colou\=r`,'paint','g'],
 ['count','a aa aaa aaaa',String.raw`\<a\{2,3}\>`,'x','g'],
 ['tabs','12\tAda',String.raw`^[0-9]\+\t`,'',''],
 ['space class','a\tb c',String.raw`\s`,'-','g'],
 ['ampersand','one',String.raw`\(one\)`,String.raw`&:\0:\1:\&:$1`,''],
 ['literal dollars','one','one','$&$1$$',''],
 ['slash class','a/b/c',String.raw`\([^\/]\+\)/\(.*\)`,String.raw`\2/\1`,''],
 ['replace tab','name:value',':',String.raw`\t`,''],
 ['replace newline','one,two',',',String.raw`\r`,''],
 ['literal tilde','x','x',String.raw`\~`,''],
 ['escaped delimiter','a/b/c',String.raw`/`,'-','g'],
 ['literal bracket','[a]',String.raw`\[a\]`,'x',''],
 ['negated bracket','[a]',String.raw`\[\([^\]]\+\)\]`,String.raw`\1`,''],
 ['literal caret dollar','a^b$c','a^b$c','x',''],
 ['empty replacement','banana','a','','g'],
 ['zero width','abc','^','>',''],
 ['first only','a a','a','x',''],
];
const folder=path.resolve(__dirname,'../outputs/regex-oracle');fs.mkdirSync(folder,{recursive:true});
let script=['set nocompatible nomodeline encoding=utf-8','set magic noignorecase nosmartcase','let g:results=[]'];
for(const [name,text,pattern,replacement,flags] of cases){script.push('enew!','call setline(1, '+JSON.stringify(text.split('\n'))+')','let v:errmsg=""','try','execute '+JSON.stringify('%s#'+pattern.replaceAll('#','\\#')+'#'+replacement.replaceAll('#','\\#')+'#'+flags),'catch','let v:errmsg=v:exception','endtry','call add(g:results, {"actual":join(getline(1,"$"), "\\n"),"error":v:errmsg})')}
script.push('call writefile([json_encode(g:results)], '+JSON.stringify(path.join(folder,'results.json'))+')','qa!');fs.writeFileSync(path.join(folder,'run.vim'),script.join('\n'));cp.execFileSync('/usr/bin/vim',['-Nu','NONE','-n','-i','NONE','-es','-S',path.join(folder,'run.vim')]);const expected=JSON.parse(fs.readFileSync(path.join(folder,'results.json'),'utf8'));
const results=cases.map(([name,text,pattern,replacement,flags],i)=>{let actual,error;try{actual=text.replace(VimRegex.compile(pattern,flags),VimRegex.replacement(replacement))}catch(e){error=e.message}return {name,pass:!error&&!expected[i].error&&actual===expected[i].actual,actual,expected:expected[i],error}});
const rejected=[String.raw`\v(foo)`,String.raw`\zsfoo`,String.raw`foo\@!`,String.raw`\_s`,String.raw`\n`,String.raw`[[:alpha:]]`,String.raw`\b`,String.raw`a\{-}`,String.raw`\%23l`,String.raw`\Mfoo`];for(const pattern of rejected)assert.throws(()=>VimRegex.compile(pattern),pattern);
for(const replacement of [String.raw`\=1+1`,String.raw`\Uword`,String.raw`\n`])assert.throws(()=>VimRegex.replacement(replacement));
fs.writeFileSync(path.join(folder,'comparison.json'),JSON.stringify(results,null,2));console.log(JSON.stringify({oracleCases:results.length,failures:results.filter(r=>!r.pass),unsupportedRejected:rejected.length+3},null,2));assert(results.every(r=>r.pass));
