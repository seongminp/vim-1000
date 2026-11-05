"""One-time migration from the former JS patterns to Vim's default magic syntax."""
import json,re
from pathlib import Path
root=Path(__file__).resolve().parent.parent
source=root/'content/quizzes.json';backup=root/'outputs/pre-native-regex-quizzes.json'
if backup.exists():raise SystemExit('Migration already has a backup; refusing to translate twice.')
quiz=json.loads(source.read_text());backup.write_text(source.read_text())
def pattern(s):
 out='';i=0;cls=False
 while i<len(s):
  c=s[i]
  if c=='\\' and i+1<len(s):
   n=s[i+1]
   if not cls and n in '()+?{}|':out+=n
   elif n=='b':raise ValueError('Review word boundary manually')
   else:out+=c+n
   i+=2;continue
  if c=='[':cls=True
  elif c==']':cls=False
  if not cls and c in '()+?{|':out+='\\'+c
  else:out+=c
  i+=1
 return out
def parts(s,delimiter):
 result=[];start=0;i=0
 while i<len(s):
  if s[i]=='\\':i+=2;continue
  if s[i]==delimiter:result.append(s[start:i]);start=i+1
  i+=1
 result.append(s[start:]);return result
changed=[];affected=[]
def command(s):
 if s.startswith(('vimgrep ','vim ')):
  return s # current workspace patterns already use only shared syntax
 m=re.match(r"([%.$+\d,'<>-]*)(s|g|v)([^\w\s])",s)
 if not m:return s
 prefix,op,d=m.groups();p=parts(s[m.end():],d)
 p[0]=pattern(p[0])
 if op=='s' and len(p)>1:
  p[1]=re.sub(r'\$([1-9])',lambda x:'\\'+x[1],p[1])
  p[1]=p[1].replace('\\n','\\r')
 elif op in ('g','v') and len(p)>1:p[1]=command(d.join(p[1:]));p=p[:2]
 return prefix+op+d+d.join(p)
for index,q in enumerate(quiz):
 seq=''.join(q['keys']);segments=seq.split('<Enter>');new=[];is_affected=False
 for n,s in enumerate(segments):
  if n==len(segments)-1:new.append(s);continue
  if s.startswith(('/','?')):ns=s[0]+pattern(s[1:]);is_affected=True
  else:
   match=re.search(r':(?=[%.$+\d,\'<>-]*(?:[sgv][^\w\s]|vimgrep\s))',s)
   if match:ns=s[:match.start()+1]+command(s[match.start()+1:]);is_affected=True
   else:ns=s
  new.append(ns)
 updated='<Enter>'.join(new)
 if is_affected:affected.append(index+1)
 if updated!=seq:
  # Preserve existing tokens; generated commands use single characters.
  q['keys']=re.findall(r'<(?:Esc|Enter|C-[^>]+|BS|CR)>|[\s\S]',updated)
  changed.append({'quiz':index+1,'title':q['title'],'before':seq,'after':updated})
 for field in ['hint','why']:
  t=q[field]
  if 'JavaScript' in t:
   sentences=re.split(r'(?<=[.!?])\s+',t)
   t=' '.join(x for x in sentences if 'JavaScript' not in x)
   t=(t+' ' if t else '')+'Use native Vim syntax: \\(…\\) captures a group; \\1 and \\2 reuse captured text.'
  t=re.sub(r'\$([1-9])',lambda x:'\\'+x[1],t)
  # Explicit command examples must match their migrated solutions.
  if q['title'].startswith('Remove empty parentheses'):t=t.replace(r'\(\)',r'()')
  if 'core\\+extra' in t:t=t.replace('core\\+extra','core+extra')
  q[field]=t
source.write_text(json.dumps(quiz,ensure_ascii=False,indent=2)+'\n')
(root/'outputs/native-regex-migration.json').write_text(json.dumps({'affected':affected,'changed':changed},ensure_ascii=False,indent=2)+'\n')
print('Regex exercises:',len(affected),'changed solutions:',len(changed))
