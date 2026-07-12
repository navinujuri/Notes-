// scrape.mjs — deep-scrape 100xdevs "projects" notes into CSV + a clickable index.
//
// How it works:
//   1. Opens a real browser. YOU log in once (session is saved to ./.pw-profile,
//      so future runs won't ask again).
//   2. Crawls every /tracks/{track}/{lesson} page reachable from your dashboard.
//   3. On each lesson it records the lesson itself AND every external link it finds
//      (Notion / Google Docs / Excalidraw / GitHub / YouTube ...) — those are the
//      actual "notes" links.
//   4. Writes out/lessons.csv, out/resources.csv, out/index.md, out/index.html
//
// Run:  npm install  &&  npx playwright install chromium  &&  npm run scrape

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const BASE = "https://projects.100xdevs.com";
const HOST = "projects.100xdevs.com";
const USER_DATA_DIR = path.resolve(".pw-profile");
const OUT = path.resolve("out");
const MAX_PAGES = 1500;   // safety cap
const DELAY_MS = 400;     // politeness delay between pages

// Hosts that usually mean "real notes/resources" — used only for tagging/emoji.
const NOTE_HOSTS = [
  "notion.so", "notion.site", "docs.google.com", "drive.google.com",
  "excalidraw.com", "github.com", "githubusercontent.com", "gitlab.com",
  "youtu.be", "youtube.com", "medium.com", "hackmd.io", "figma.com",
];

fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Poll until the user has signed in (no manual ENTER needed — works when driven headless-less by Claude).
async function waitUntilLoggedIn(page, minutes = 15) {
  const deadline = Date.now() + minutes * 60 * 1000;
  let last = "";
  while (Date.now() < deadline) {
    let gated = true, trackLinks = 0, url = "";
    try {
      url = page.url();
      const body = (await page.evaluate(() => document.body.innerText || "")).toLowerCase();
      trackLinks = await page.$$eval("a[href*='/tracks/']", (a) => a.length).catch(() => 0);
      const needLogin = body.includes("login to access") || /\/login|\/signin|accounts\.google/.test(url);
      gated = needLogin || (trackLinks === 0 && !/\/tracks\//.test(url));
    } catch {}
    if (!gated) return true;
    const msg = `waiting for login... url=${url} trackLinks=${trackLinks}`;
    if (msg !== last) { process.stdout.write(msg + "\n"); last = msg; }
    await sleep(4000);
  }
  return false;
}
function csvCell(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function writeCsv(file, headers, rows) {
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(headers.map((h) => csvCell(r[h])).join(","));
  fs.writeFileSync(file, lines.join("\n"), "utf8");
}
function slugOf(u) {
  try {
    const p = new URL(u).pathname.split("/").filter(Boolean); // ["tracks", track, lesson]
    if (p[0] === "tracks") return p[1] || "(root)";
  } catch {}
  return "(root)";
}
function isInternalTrack(u) {
  try { const x = new URL(u); return x.host === HOST && x.pathname.startsWith("/tracks/"); }
  catch { return false; }
}
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const ctx = await chromium.launchPersistentContext(USER_DATA_DIR, {
  headless: false,
  viewport: null,
  channel: "chrome", // use your real installed Chrome (better Google-login success)
  // Reduce Google's "this browser may not be secure" block on automated browsers:
  ignoreDefaultArgs: ["--enable-automation"],
  args: ["--disable-blink-features=AutomationControlled"],
});
const page = ctx.pages()[0] ?? (await ctx.newPage());

await page.goto(BASE + "/", { waitUntil: "domcontentloaded" }).catch(() => {});
console.log("\n>>> A Chrome window is open. Sign in to 100xdevs (Google: navinujuri@gmail.com).");
console.log(">>> I'll detect the login automatically and start scraping — no need to press anything.\n");
const loggedIn = await waitUntilLoggedIn(page, 15);
if (!loggedIn) {
  console.log("Timed out waiting for login. Re-run `npm run scrape` and sign in.");
  await ctx.close();
  process.exit(1);
}
console.log("Login detected. Scraping...\n");

const queue = [page.url(), BASE + "/", BASE + "/tracks"];
const seen = new Set();
const lessons = new Map();      // url -> { url, title, track }
const resources = [];           // { track, lessonTitle, lessonUrl, text, url, host, isNote }
const trackOrder = new Map();   // track -> [urls in sidebar/DOM order]
const pageContent = new Map();  // lesson url -> { docTitle, headings, text }
let debugDumped = 0;

async function extract(u) {
  await page.goto(u, { waitUntil: "domcontentloaded" }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  // nudge lazy-loaded content
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) {
      window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  }).catch(() => {});
  if (debugDumped < 2) {
    fs.writeFileSync(path.join(OUT, `debug-${debugDumped}.html`), await page.content().catch(() => ""), "utf8");
    debugDumped++;
  }
  const anchors = await page.$$eval("a[href]", (as) =>
    as.map((a) => ({ href: a.href, text: (a.textContent || "").replace(/\s+/g, " ").trim() }))
  ).catch(() => []);
  const content = await page.evaluate(() => {
    const main =
      document.querySelector("main") ||
      document.querySelector("article") ||
      document.querySelector('[class*="content"]') ||
      document.body;
    const headings = [...document.querySelectorAll("h1,h2,h3")]
      .map((h) => (h.textContent || "").replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .slice(0, 40);
    const text = ((main && main.innerText) || "").replace(/\s+/g, " ").trim().slice(0, 4000);
    return { docTitle: document.title, headings, text };
  }).catch(() => ({ docTitle: "", headings: [], text: "" }));
  return { anchors, content };
}

let count = 0;
while (queue.length && count < MAX_PAGES) {
  const url = (queue.shift() || "").split("#")[0];
  if (!url || seen.has(url)) continue;
  seen.add(url);
  count++;

  const onLesson = isInternalTrack(url);
  process.stdout.write(`[${count}] ${url}\n`);
  const { anchors, content } = await extract(url);
  if (onLesson) pageContent.set(url, content);
  const currentTrack = onLesson ? slugOf(url) : null;
  const sameTrackOrdered = [];

  for (const a of anchors) {
    const clean = a.href.split("#")[0];
    if (isInternalTrack(clean)) {
      const tr = slugOf(clean);
      if (!lessons.has(clean)) lessons.set(clean, { url: clean, title: a.text || "(untitled)", track: tr });
      else if (a.text && lessons.get(clean).title === "(untitled)") lessons.get(clean).title = a.text;
      if (!seen.has(clean) && !queue.includes(clean)) queue.push(clean);
      if (currentTrack && tr === currentTrack) sameTrackOrdered.push(clean);
    } else if (onLesson && /^https?:/.test(a.href)) {
      let host = ""; try { host = new URL(a.href).host; } catch {}
      if (host && host !== HOST) {
        resources.push({
          track: currentTrack,
          lessonTitle: lessons.get(url)?.title || slugOf(url),
          lessonUrl: url, text: a.text, url: a.href, host,
          isNote: NOTE_HOSTS.some((h) => host.includes(h)) ? "yes" : "",
        });
      }
    }
  }

  if (currentTrack) {
    const dedup = [...new Set(sameTrackOrdered)];
    if (dedup.length > (trackOrder.get(currentTrack)?.length || 0)) trackOrder.set(currentTrack, dedup);
  }
  await sleep(DELAY_MS);
}

// ---- Build ordered outputs ----
const tracks = [...new Set([...lessons.values()].map((l) => l.track))].sort();
const lessonRows = [];
for (const tr of tracks) {
  const order = trackOrder.get(tr) || [];
  const idx = new Map(order.map((u, i) => [u, i]));
  const inTrack = [...lessons.values()].filter((l) => l.track === tr);
  inTrack.sort((a, b) => (idx.get(a.url) ?? 9999) - (idx.get(b.url) ?? 9999));
  inTrack.forEach((l, i) => lessonRows.push({ track: tr, order: i + 1, topic: l.title, lesson_url: l.url }));
}

writeCsv(path.join(OUT, "lessons.csv"), ["track", "order", "topic", "lesson_url"], lessonRows);
writeCsv(
  path.join(OUT, "resources.csv"),
  ["track", "lessonTitle", "lessonUrl", "isNote", "text", "host", "url"],
  resources
);

// Markdown index
let md = `# 100xDevs — Notes Index\n\n_Generated ${new Date().toISOString()}_\n\n`;
for (const tr of tracks) {
  md += `\n## ${tr}\n\n`;
  for (const r of lessonRows.filter((x) => x.track === tr)) {
    md += `${r.order}. [${r.topic}](${r.lesson_url})\n`;
    for (const x of resources.filter((y) => y.lessonUrl === r.lesson_url)) {
      md += `   - ${x.isNote === "yes" ? "📝 " : ""}[${x.text || x.host}](${x.url})\n`;
    }
  }
}
fs.writeFileSync(path.join(OUT, "index.md"), md, "utf8");

// HTML index (open in browser -> Ctrl+P -> Save as PDF; links stay clickable)
let html = `<!doctype html><meta charset="utf8"><title>100xDevs Notes Index</title>
<style>body{font:15px/1.5 system-ui,sans-serif;max-width:900px;margin:2rem auto;padding:0 1rem;color:#222}
h1{border-bottom:2px solid #eee;padding-bottom:.3rem}h2{margin-top:2rem;color:#0a58ca}
ol{padding-left:1.4rem}li{margin:.35rem 0}ul{margin:.2rem 0 .6rem}a{color:#0a58ca;text-decoration:none}
a:hover{text-decoration:underline}.note{color:#666;font-size:.9em}</style>
<h1>100xDevs — Notes Index</h1><p class="note">Generated ${new Date().toISOString()}</p>`;
for (const tr of tracks) {
  html += `<h2>${esc(tr)}</h2><ol>`;
  for (const r of lessonRows.filter((x) => x.track === tr)) {
    html += `<li><a href="${esc(r.lesson_url)}">${esc(r.topic)}</a>`;
    const res = resources.filter((y) => y.lessonUrl === r.lesson_url);
    if (res.length) {
      html += "<ul>";
      for (const x of res) html += `<li>${x.isNote === "yes" ? "📝 " : ""}<a href="${esc(x.url)}">${esc(x.text || x.host)}</a> <span class="note">(${esc(x.host)})</span></li>`;
      html += "</ul>";
    }
    html += "</li>";
  }
  html += "</ol>";
}
fs.writeFileSync(path.join(OUT, "index.html"), html, "utf8");

// all-content.json — the file you hand to Claude to build the revision resource.
// Contains every lesson in learning order, with its text + headings + notes links.
const contentDump = lessonRows.map((r) => {
  const c = pageContent.get(r.lesson_url) || {};
  return {
    track: r.track,
    order: r.order,
    topic: r.topic,
    lesson_url: r.lesson_url,
    headings: c.headings || [],
    text: c.text || "",
    resources: resources
      .filter((x) => x.lessonUrl === r.lesson_url)
      .map((x) => ({ text: x.text, url: x.url, host: x.host, isNote: x.isNote === "yes" })),
  };
});
fs.writeFileSync(
  path.join(OUT, "all-content.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), tracks, lessons: contentDump }, null, 2),
  "utf8"
);

console.log(`\nDone. ${lessonRows.length} lessons, ${resources.length} resource links across ${tracks.length} tracks.`);
console.log(`Output in ${OUT}:`);
console.log(`  all-content.json  <-- SEND THIS TO CLAUDE to build the revision resource`);
console.log(`  lessons.csv   resources.csv   index.md   index.html  (raw backups)`);
console.log(`(If counts look low, open out/debug-0.html and tell Claude what the lesson links look like.)`);
await ctx.close();
process.exit(0);
