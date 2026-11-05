"""Apply the hand-selected intermediate path; retain the rest as extra practice.

The manifest references content, never array positions. Run --check to validate
without writing. This changes only ordering and internal learning metadata.
"""
import argparse
import collections
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def identity(q):
    return hashlib.sha256((q['before'] + '\0' + q['after']).encode()).hexdigest()

def ordered_course(quizzes, manifest):
    by_id = {identity(q): q for q in quizzes}
    assert len(by_id) == len(quizzes), 'Duplicate quiz content IDs'
    chosen = [entry for section in manifest['rounds'] for entry in section['quizzes']]
    ids = [entry['id'] for entry in chosen]
    assert len(ids) == len(set(ids)) == manifest['main_count'] == 300
    assert all(k in by_id for k in ids), 'A selected quiz changed; review its manifest entry'
    assert {identity(q) for q in quizzes if q.get('workspace')} <= set(ids), 'Workspace coverage lost'
    main = []
    for stage, section in enumerate(manifest['rounds'], 1):
        assert len(section['quizzes']) == 25
        for entry in section['quizzes']:
            q = by_id[entry['id']]
            assert q['title'] == entry['title'], 'Review renamed quiz in curriculum manifest'
            main.append({**q, 'learning': {'stage': stage, 'focus': section['focus'],
                         'difficulty': section['difficulty'], 'pass': 'core'}})
    selected = set(ids)
    extra = [{**q, 'learning': {**q.get('learning', {}), 'pass': 'practice'}}
             for q in quizzes if identity(q) not in selected]
    return main + extra

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    path = ROOT / 'content/quizzes.json'
    quizzes = json.loads(path.read_text())
    manifest = json.loads((ROOT / 'content/intermediate-curriculum.json').read_text())
    ordered = ordered_course(quizzes, manifest)
    if args.check:
        assert quizzes == ordered, 'Run python3 scripts/curate-course.py to apply the curriculum'
    else:
        path.write_text(json.dumps(ordered, ensure_ascii=False, indent=2) + '\n')
    core = ordered[:300]
    print(f'Intermediate curriculum: {len(core)} main + {len(ordered)-len(core)} extra; '
          f'{sum(bool(q.get("workspace")) for q in core)} workspace exercises.')

if __name__ == '__main__':
    main()
