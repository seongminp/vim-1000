"""Report exact duplicates and near-duplicate candidates for human review.
A candidate is not automatically a duplicate: identical shapes may teach different
motions, and identical commands may solve meaningfully different boundary cases.
"""
import json,re,difflib,argparse
from pathlib import Path
root=Path(__file__).resolve().parent.parent
p=argparse.ArgumentParser();p.add_argument('--new-from',type=int,default=1);a=p.parse_args()
qs=json.loads((root/'content/quizzes.json').read_text())
def shape_pair(q):
 ids={}
 def token(m):
  raw=m[0]; key=raw.lower()
  if key not in ids:ids[key]=len(ids)
  case='U' if raw.isupper() else 'T' if raw.istitle() else 'L'
  return ('N' if raw.isdigit() else case)+str(ids[key])
 return re.sub(r'[A-Za-z]+|[0-9]+',token,q['before']+'\0'+q['after'])
def title_words(s):
 stop={'the','a','an','to','of','in','with','and','each','only','from','its','all','both','every','by','as'}
 return set(re.findall('[a-z]+',s.lower()))-stop
exact=[];structural=[];titles=[];solutions=[]
for j,b in enumerate(qs):
 if j+1<a.new_from:continue
 for i,c in enumerate(qs[:j]):
  item={'earlier':i+1,'new':j+1,'earlier_title':c['title'],'new_title':b['title']}
  if (c['before'],c['after'])==(b['before'],b['after']):exact.append(item);continue
  if shape_pair(c)==shape_pair(b):
   item['same_keys']=c['keys']==b['keys'];structural.append(item);continue
  if c['keys']==b['keys']:solutions.append(item)
  x,y=title_words(c['title']),title_words(b['title']);score=len(x&y)/max(1,len(x|y))
  if score>=.52:titles.append(dict(item,score=round(score,2)))
report={'total':len(qs),'new_from':a.new_from,'exact':exact,'structural':structural,'title_candidates':titles,'same_solution_candidates':solutions}
(root/'outputs/quiz-similarity-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
