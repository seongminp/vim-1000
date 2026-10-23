# Vim Fieldwork

All 240 quizzes live in **content/quizzes.json**. Edit or append to that JSON array. Each quiz has topic, title, before, after, cursor, keys, hint, and why. Cursor coordinates are zero-based; keys are individual keypresses with tokens such as <Esc> and <Enter>.

Build both the browser course and the standalone offline HTML:

```sh
python3 scripts/build-offline.py
```

This validates the JSON and generates `dist/course.js` and `dist/vim-fieldwork-offline.html`. The generated JavaScript embeds the quiz data so no fetch or network access is needed offline. Do not edit generated quiz data directly.

Preview:

```sh
python3 -m http.server 8080 --directory dist
```

Open `http://localhost:8080/?selftest` to run every solution, or `/vim-fieldwork-offline.html?selftest` to check the standalone build. Each result must have `pass: true`.

`outputs/` holds downloadable copies and screenshots. `archive/` contains older packs, build scripts and deployment archives; these are not active sources. Both directories are excluded from Git/deployment source synchronization.
