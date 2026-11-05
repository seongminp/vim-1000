"""Compile the single quiz source to an offline-safe browser script."""
import json
import subprocess
import sys
from pathlib import Path
root = Path(__file__).resolve().parent.parent
subprocess.run([sys.executable, str(root / 'scripts/curate-course.py'), '--check'], check=True)
quizzes = json.loads((root / 'content/quizzes.json').read_text())
required = {'topic','title','before','after','cursor','keys','hint','why'}
assert isinstance(quizzes, list) and quizzes, 'Expected a nonempty array'
for i, q in enumerate(quizzes, 1):
    assert required <= set(q) <= required | {'workspace','learning','legacyIndex'}, f'Quiz {i}: unexpected/missing fields'
    for field in required - {'cursor', 'keys'}:
        assert isinstance(q[field], str), f'Quiz {i}: {field} must be text'
    if 'workspace' in q:
        w=q['workspace'];assert w['start'] in w['files'] and w['goal'], f'Quiz {i}: invalid workspace'
        assert all(isinstance(f,str) and isinstance(t,str) for f,t in w['files'].items())
    assert q['before'] != q['after'], f'Quiz {i}: no edit'
    assert isinstance(q['cursor'], list) and len(q['cursor']) == 2, f'Quiz {i}: invalid cursor'
    line, col = q['cursor']
    lines = q['before'].split('\n')
    assert type(line) is int and type(col) is int and 0 <= line < len(lines) and 0 <= col <= len(lines[line]), f'Quiz {i}: cursor out of bounds'
    assert isinstance(q['keys'], list) and q['keys'] and all(isinstance(k,str) and k for k in q['keys']), f'Quiz {i}: invalid keys'
data = json.dumps(quizzes, ensure_ascii=False, separators=(',', ':'))
(root / 'dist/course.js').write_text('// Generated from content/quizzes.json by scripts/build-course.py. Do not edit.\nconst missions = '+data+'.map(q => ({...q, ch:q.topic, instruction:q.title, concept:q.topic}));\n')
print(f'Compiled {len(quizzes)} quizzes from content/quizzes.json')
