"""Execute authored regex solutions in real Vim, in isolated local fixtures."""
import argparse,concurrent.futures,json,os,re,shutil,subprocess,sys
from pathlib import Path
root=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser();parser.add_argument('--all',action='store_true');args=parser.parse_args()
quizzes=json.loads((root/'content/quizzes.json').read_text())
# Search/substitute/global/vimgrep command segments; include search motions anywhere.
def affected(q):
 s=''.join(q['keys'])
 return bool(re.search(r':[%.$+\d,\'<>-]*(?:[sgv][^\w\s]|vimgrep\s)',s) or re.search(r'^[/?].*<Enter>',s) or q['topic'] in ['Search','Search & repeat','Project search','Substitution','Selective substitutions','Pattern cleanup','Capture substitutions','Global commands'])
def vs(s):return json.dumps(s,ensure_ascii=False)
def sequence(keys):
 return '"'+''.join(('\\<'+({'Enter':'CR','BS':'BS'}.get(k[1:-1],k[1:-1]))+'>') if re.fullmatch(r'<(?:Esc|Enter|BS|C-[^>]+)>',k) else k.replace('\\','\\\\').replace('"','\\"').replace('\n','\\n').replace('\r','\\r').replace('\t','\\t') for k in keys)+'"'
def run(item):
 i,q=item;folder=root/'outputs/native-vim'/str(i+1);folder.mkdir(parents=True,exist_ok=True)
 lines=['set nocompatible nomodeline encoding=utf-8','set magic noignorecase nosmartcase wrapscan','set tabstop=2 shiftwidth=2 expandtab noautoindent noswapfile','set shortmess+=I', 'cd '+str(folder)]
 if q.get('workspace'):
  w=q['workspace'];names=list(w['files'])
  for f,text in w['files'].items():p=folder/f;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text+'\n')
  lines+=['edit '+names[0]]+['badd '+f for f in names[1:]]+['edit '+w['start']]
  if w.get('panes'):
   lines+=['edit '+w['panes'][1],('vsplit ' if w['layout']=='vertical' else 'split ')+w['panes'][0]]
  if w.get('quickfix'):lines+=['call setqflist('+json.dumps([{'filename':str(folder/e['file']),'lnum':e['line']+1,'col':e.get('ch',0)+1,'text':e.get('text','')} for e in w['quickfix']],ensure_ascii=False)+')']
 else:lines+=['call setline(1, '+json.dumps(q['before'].split('\n'),ensure_ascii=False)+')','call cursor('+str(q['cursor'][0]+1)+','+str(len(q['before'].split('\n')[q['cursor'][0]][:q['cursor'][1]].encode())+1)+')']
 lines+=['let v:errmsg = ""','try','call feedkeys('+sequence(q['keys'])+', "xt")','catch','let g:failure=v:exception','endtry']
 if q.get('workspace'):
  lines+=['let g:result={"current":expand("%:."),"cursor":[line(".")-1,col(".")-1],"matches":map(getqflist(), {_,e -> {"file":fnamemodify(bufname(e.bufnr),":."),"line":e.lnum-1,"ch":e.col-1}}),"qopen":getqflist({"winid":0}).winid != 0,"files":{}}']
  for f in q['workspace']['files']:lines+=['let g:result.files['+vs(f)+']=join(readfile('+vs(f)+'), "\\n")']
 else:lines+=['let g:result={"actual":join(getline(1,"$"), "\\n")}']
 lines+=['let g:result.error=get(g:,"failure",v:errmsg)','call writefile([json_encode(g:result)], '+vs(str(folder/'result.json'))+')','qa!']
 (folder/'result.json').unlink(missing_ok=True)
 (folder/'run.vim').write_text('\n'.join(lines)+'\n')
 try:
  proc=subprocess.run(['/usr/bin/vim','-Nu','NONE','-n','-i','NONE','-es','-S',str(folder/'run.vim')],capture_output=True,timeout=8)
  r=json.loads((folder/'result.json').read_text())
  if q.get('workspace'):
   g=q['workspace']['goal'];ok=all(r['files'][f]==g.get('files',{}).get(f,text) for f,text in q['workspace']['files'].items())
   for k in ['current','cursor']:ok=ok and (k not in g or r[k]==g[k])
   if 'matches' in g:ok=ok and r['matches']==[{k:e.get(k,0) for k in ['file','line','ch']} for e in g['matches']]
   if 'quickfixOpen' in g:ok=ok and r['qopen']==g['quickfixOpen']
  else:ok=r['actual']==q['after']
  return {'quiz':i+1,'title':q['title'],'pass':bool(ok and not r['error'] and proc.returncode==0),**({} if ok and not r['error'] and proc.returncode==0 else {'result':r,'expected':q.get('workspace',{}).get('goal',q['after'])})}
 except Exception as e:return {'quiz':i+1,'title':q['title'],'pass':False,'error':str(e)}
selected=[(i,q) for i,q in enumerate(quizzes) if args.all or affected(q)]
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:results=list(pool.map(run,selected))
report={'vim':subprocess.check_output(['/usr/bin/vim','--version'],text=True).splitlines()[0],'total':len(results),'passed':sum(r['pass'] for r in results),'failures':[r for r in results if not r['pass']],'results':results}
(root/'outputs/native-vim-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='results'},ensure_ascii=False,indent=2))

sys.exit(0 if not report["failures"] else 1)
