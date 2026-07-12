# 100xDevs — Full-Stack Revision Resource

A level-wise, categorized revision index of the entire [projects.100xdevs.com](https://projects.100xdevs.com)
course — **88 tracks · 888 lessons** — with per-track **SDE-2 interview-prep pages**.

## The output

**Just double-click `run.cmd`** (Windows) or run `./run.sh` (macOS/Linux) to open it — or open
**`out/revision.html`** in any browser directly (no server needed):

- Searchable, level-wise index of every track and lesson (each links to its notes page + PDF).
- Progress check-boxes per lesson (saved in your browser).
- A **🎯 Interview Prep** button on every track → a page with per-step bullets, a real-world
  example, and SDE-2 interview Q&A (`out/interview/<track>.html`).

`out/revision.md` is the same index in Markdown. Print any page with **Ctrl+P → Save as PDF**.

## Prerequisites
- Node.js 18+
- Google Chrome (the scraper uses your installed Chrome)

## Regenerate from scratch
```powershell
npm install
node scrape.mjs      # opens Chrome; log in to 100xdevs once (session saved to .pw-profile/)
node parse.mjs       # decode the Next.js RSC payload  -> out/flight.txt
node parse2.mjs      # extract tracks + lessons        -> out/tracks.json
node gen-wf.mjs      # emit the interview-prep workflow -> wf-interview.mjs
#   run the workflow (88 agents, one per track) via Claude Code's Workflow tool,
#   then assemble its journal into interview-content.json:
node assemble.mjs <path-to-workflow>/journal.jsonl
node build.mjs       # render out/revision.* + out/interview/
```

If lessons only need re-rendering (content already in `tracks.json` + `interview-content.json`),
just run `node build.mjs`.

## File guide
| File | Role |
|------|------|
| `scrape.mjs` | Logs in + saves the homepage payload (`out/debug-0.html`) |
| `parse.mjs` / `parse2.mjs` | Decode RSC → `out/tracks.json` (the track/lesson tree) |
| `gen-wf.mjs` / `wf-interview.mjs` | Generate + run the interview-prep workflow |
| `assemble.mjs` | Merge workflow output → `interview-content.json` |
| `build.mjs` | Render `revision.html`, `revision.md`, `interview/*.html` (edit LEVELS/SUMMARIES here) |
| `overlap.mjs` | Report topic overlap between Cohort 2.0 and 3.0 |
| `interview-content.json` | Generated SDE-2 content for all 88 tracks (kept so you don't re-generate) |
| `out/tracks.json` | Full structured track/lesson dataset |

> Note: `.pw-profile/` (your login session) and `node_modules/` are gitignored. Do not commit them.
