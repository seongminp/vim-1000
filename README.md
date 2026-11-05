# Vim 1000

All 1,011 quizzes live in **content/quizzes.json**. Edit or append to that JSON array. Each quiz has topic, title, before, after, cursor, keys, hint, and why. Internal `learning` metadata orders the course; `legacyIndex` preserves migration of older progress. Workspace quizzes additionally carry a `workspace` object. Cursor coordinates are zero-based; keys are individual keypresses with tokens such as <Esc> and <Enter>.

Build both the browser course and the standalone offline HTML:

```sh
python3 scripts/build-offline.py
```

This validates the JSON and generates `dist/course.js` and `dist/vim-1000-offline.html`. The generated JavaScript embeds the quiz data so no fetch or network access is needed offline. Do not edit generated quiz data directly.

Preview:

```sh
python3 -m http.server 8080 --directory dist
```

Open `http://localhost:8080/?selftest` to run every solution, or `/vim-1000-offline.html?selftest` to check the standalone build. Each result must have `pass: true`.

`outputs/` holds downloadable copies and screenshots. `archive/` contains older packs, build scripts and deployment archives; these are not active sources. Both directories are excluded from Git/deployment source synchronization.

## Content quality checks

Run `python3 scripts/audit-quizzes.py` to scan the complete collection for exact
duplicates, identifier-normalized before/after pairs, similar titles, and reused
solution sequences. Use `--new-from 791` to review the newest 200 against all earlier
quizzes as well as each other. The report is written to
`outputs/quiz-similarity-report.json`. Candidates require editorial review: sharing
a Vim command is not by itself duplication, and a clean report cannot guarantee
semantic uniqueness. Browser solution tests remain required for both builds.

Pattern exercises use native Vim default-magic syntax and are verified against actual Vim. See the compatibility section below.

## Progress and offline use

Progress saves automatically in localStorage: completed quiz IDs, the current buffer,
cursor, key trail, guided practice, and shuffle order. Stable content IDs preserve
progress when quizzes are reordered or appended. Existing numeric progress migrates
automatically. Resumed editing starts in Normal mode.

Click “Progress” or its completion count to browse all quizzes in a compact
grid. Green squares are completed; the outlined square is current. Hover for the
title and click to jump; arrow keys, Home, End, and Enter also navigate the grid.
Backup and restore controls are below the grid. Storage is
local to a browser and origin; file URLs may have browser-specific storage behavior.
Moving the standalone file or clearing browser data can separate or erase progress.
The app remains usable when storage is unavailable and displays that status.

The crossed-arrows toggle changes the order of upcoming quizzes without replacing
the current quiz. Next and Skip use a shuffled bag without repetition until it runs out. It also works offline.
Run `node scripts/test-progress.cjs` to check persistence and shuffle behavior.

## FAQ and license

The FAQ is a separate `#faq` view, so it also works inside the single offline HTML.
It includes the original prompt, sponsor link, and complete quiz JSON download.
The FAQ links to [the canonical quiz JSON](https://github.com/seongminp/vim-1000/blob/main/content/quizzes.json).
Source repository: https://github.com/seongminp/vim-1000

App code and quiz data are licensed under Apache 2.0 (see `LICENSE`). Bundled
CodeMirror code retains its MIT license. Both license texts are included in the
offline HTML.

## Curriculum and workspace exercises

The first **300 exercises** form a curated path for **intermediate Vim users**;
the remaining **711** are extra practice. The path assumes familiarity with modes
and basic movement. It mixes precision edits, objects and dot repeat, search,
registers, selections, ranges, native-pattern substitutions, macros, and all 21
supported workspace exercises. Later rounds combine skills and revisit earlier
techniques in different contexts. Sequential navigation follows this order;
shuffle remains a deliberate option across the full bank.

`content/intermediate-curriculum.json` is the editorial manifest: 12 internal
rounds of 25, with rationales and stable content references (not duplicate quiz
data). No round menus or difficulty filters are shown. The progress popover
separates the main path from extra practice; selecting any square still works.
Difficulty is an editorial estimate, not a measured rating. This remains a bounded
Vim trainer; completing the path is not a certification of fluency.

Run `python3 scripts/curate-course.py` to apply the manifest, or add `--check` to
validate without writing. `scripts/build-course.py` checks the manifest on every
build. `scripts/add-workspace-course.py` refreshes the 21 active workspace fixtures
and reapplies the same curated order. Content-derived progress IDs and legacy
indices are preserved. `python3 scripts/test-curriculum.py` checks selection,
coverage, duplicate candidates and ordering. See `content/CURRICULUM.md` for the
reviewable sequence and rationale.

Workspace exercises simulate a small, embedded project; they do not access user files
or run shell commands. They support buffer switching/listing/deletion, writing,
two-pane splits and window navigation, quickfix navigation, and scoped `:vimgrep`.
Search reads saved fixture contents, supports `*` / `**/` globs and `g` / `j` flags,
and shares the native Vim pattern parser with searches and substitutions. This is a
bounded training implementation, not full Vim: arbitrary filesystem, shell, compiler,
plugin, tab-page, nested split, location-list, and all Vim regex behavior are out of scope.

Goals check active file, pane layout, buffer list, saved edits, cursor, and quickfix
results where relevant. Unrelated files must remain unchanged. Workspace snapshots
persist with normal progress and backups. Guided retry and selectable-step replay
are available. All project files and search fixtures are embedded in the same JSON
and in the standalone HTML.

Both `?selftest` builds run all 1,011 solutions plus workspace behavioral checks
(unsaved changes, shared buffers, buffer deletion, search scope, and session restore).

## Native Vim pattern compatibility

`dist/vim-regex.js` translates a bounded subset of native Vim default `magic`
patterns: literals, anchors, character classes, `\(…\)` groups, `\|` alternation,
`*`, `\+`, `\?` / `\=`, numeric `\{n,m}` repetition, `\<` / `\>` word boundaries,
`\d` / `\w` / `\s` classes, tabs, and inline `\c` / `\C` case controls.
Replacements support `&`, `\0`–`\9`, escaped ampersands/backslashes/delimiters,
`\t`, and `\r` line breaks. Dollar signs are literal, as in native Vim.
Search is case-sensitive by default. Substitution flags `g`, `c`, `i`, `I` work.

Very-magic/nomagic modes, lookaround and match-boundary atoms, multiline search,
POSIX classes, search offsets, expression replacements, and case-conversion
replacements are deliberately rejected rather than treated as JavaScript syntax.
The app is still a Vim emulator, not a complete Vim implementation.

The bundled `dist/vendor/vim.js` has a small Vim 1000 integration patch routing
searches, `*`/`#`, substitutions and global commands through this parser. Preserve
that integration when updating CodeMirror. Workspace `:vimgrep` shares it.

Run `python3 scripts/test-native-vim.py` for the retained search/pattern exercises:
it starts real `/usr/bin/vim` with `-Nu NONE -n -i NONE -es`, replays typed keys,
and compares final buffers, saved files, and search results. Fixtures and reports
stay in `outputs/native-vim/` and `outputs/native-vim-results.json`.
Run `node scripts/test-vim-regex.cjs` for independent parser comparisons against
Vim and explicit unsupported-pattern rejection checks. Browser `?selftest` still
checks the entire collection in both builds.

Three project-search exercises involving `:copen` were withheld because the
simulator does not reproduce quickfix focus faithfully. Their original records
and reasons are preserved in `content/omitted-native-compatibility.json`, which
is NOT included in the playable collection or offline export. The course authoring
script honors these omissions. All active quizzes remain in `content/quizzes.json`.
