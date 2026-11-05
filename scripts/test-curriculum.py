"""Check the curated path's integrity and surface similarity for editorial review."""
import collections
import importlib.util
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('curation', root/'scripts/curate-course.py')
curation = importlib.util.module_from_spec(spec)
spec.loader.exec_module(curation)
quizzes = json.loads((root/'content/quizzes.json').read_text())
manifest = json.loads((root/'content/intermediate-curriculum.json').read_text())
assert quizzes == curation.ordered_course(quizzes, manifest)
core, extra = quizzes[:300], quizzes[300:]
assert all(q['learning']['pass'] == 'core' for q in core)
assert all(q['learning']['pass'] == 'practice' for q in extra)
assert len({curation.identity(q) for q in quizzes}) == len(quizzes)
assert len({tuple(q['keys']) for q in core}) == 300, 'Review identical model solutions'
assert collections.Counter(q['topic'] for q in core if q.get('workspace')) == {
    'Buffers': 6, 'Splits': 6, 'Quickfix': 6, 'Project search': 3}
assert len({q['legacyIndex'] for q in quizzes if 'legacyIndex' in q}) == sum('legacyIndex' in q for q in quizzes)

def shape(q):
    tokens = {}
    def token(m):
        value = m[0].lower()
        if value not in tokens:
            tokens[value] = len(tokens)
        return ('N' if value.isdigit() else 'W') + str(tokens[value])
    return re.sub(r'[A-Za-z]+|[0-9]+', token, q['before']+'\0'+q['after'])

groups = collections.defaultdict(list)
for q in core:
    groups[shape(q)].append(q)
reviewed = [set(note['quizzes']) for note in manifest['similarity_notes']]
structural = []
for group in groups.values():
    if len(group) < 2:
        continue
    ids = {curation.identity(q) for q in group}
    assert any(ids <= note for note in reviewed), 'Unreviewed structurally similar quizzes: '+str([q['title'] for q in group])
    structural.append([q['title'] for q in group])

# Catch accidental topical blocks; review is interleaved even in focus rounds.
longest = max(len(list(g)) for _, g in __import__('itertools').groupby(q['topic'] for q in core))
assert longest <= 3, f'{longest} consecutive quizzes in one topic'
# Advanced operations must appear in both focused practice and later mixed recall.
for topic in ['Macros', 'Registers', 'Substitution', 'Search', 'Visual block', 'Dot repeat']:
    positions = [i for i, q in enumerate(core) if q['topic'] == topic]
    assert len(positions) >= 6 and max(positions)-min(positions) >= 50, topic
report = {'main':len(core), 'extra':len(extra), 'exact_duplicates':0,
          'identical_solutions':0, 'reviewed_structural_groups':structural,
          'max_consecutive_topic':longest,
          'topics':dict(collections.Counter(q['topic'] for q in core))}
(root/'outputs/curriculum-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(f'Curriculum checks passed: 300 unique selections, {len(extra)} extras, '
      f'{len(structural)} reviewed similarity groups, coverage and interleaving intact.')
