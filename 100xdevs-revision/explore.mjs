// explore.mjs — reuse the saved login to discover where tracks live + the site's API.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const HOST = "projects.100xdevs.com";
const USER_DATA_DIR = path.resolve(".pw-profile");
const OUT = path.resolve("out");
fs.mkdirSync(OUT, { recursive: true });

const CANDIDATE_PAGES = [
  "https://projects.100xdevs.com/",
  "https://projects.100xdevs.com/home",
  "https://projects.100xdevs.com/dashboard",
  "https://projects.100xdevs.com/tracks",
  "https://projects.100xdevs.com/courses",
  "https://projects.100xdevs.com/my-courses",
  "https://projects.100xdevs.com/tracks/web3-orientation/Web3-Cohort---Orientation-7",
];
const CANDIDATE_APIS = [
  "https://projects.100xdevs.com/api/tracks",
  "https://projects.100xdevs.com/api/track",
  "https://projects.100xdevs.com/api/courses",
  "https://projects.100xdevs.com/api/user/tracks",
  "https://projects.100xdevs.com/api/me",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ctx = await chromium.launchPersistentContext(USER_DATA_DIR, {
  headless: true,
  channel: "chrome",
  ignoreDefaultArgs: ["--enable-automation"],
  args: ["--disable-blink-features=AutomationControlled"],
});
const page = ctx.pages()[0] ?? (await ctx.newPage());

// capture API-ish network traffic
const apiCalls = new Set();
page.on("request", (r) => {
  const u = r.url();
  const t = r.resourceType();
  if ((t === "fetch" || t === "xhr" || /\/api\//.test(u)) && u.includes(HOST)) apiCalls.add(`${r.method()} ${u}`);
});

const report = { pages: [], apiCalls: [], apiProbe: [], trackLinks: [] };

for (const url of CANDIDATE_PAGES) {
  const entry = { url };
  try {
    const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    await sleep(1500);
    entry.status = resp ? resp.status() : null;
    entry.finalUrl = page.url();
    entry.title = await page.title().catch(() => "");
    const body = (await page.evaluate(() => (document.body.innerText || "").slice(0, 400)).catch(() => "")).replace(/\s+/g, " ").trim();
    entry.bodyPreview = body;
    entry.needLogin = /login to access|sign in to|please log ?in/i.test(body);
    const links = await page.$$eval("a[href]", (as) => as.map((a) => ({ href: a.href, text: (a.textContent || "").replace(/\s+/g, " ").trim() }))).catch(() => []);
    const trackLinks = links.filter((l) => { try { const x = new URL(l.href); return x.host === "projects.100xdevs.com" && x.pathname.startsWith("/tracks/"); } catch { return false; } });
    entry.trackLinkCount = trackLinks.length;
    entry.sampleTrackLinks = trackLinks.slice(0, 25);
    if (trackLinks.length) report.trackLinks.push(...trackLinks.map((t) => t.href));
  } catch (e) {
    entry.error = String(e).slice(0, 200);
  }
  report.pages.push(entry);
}

// probe candidate APIs with the logged-in session
for (const api of CANDIDATE_APIS) {
  try {
    const r = await ctx.request.get(api, { timeout: 15000 });
    const txt = (await r.text().catch(() => "")).slice(0, 600);
    report.apiProbe.push({ api, status: r.status(), bodyPreview: txt.replace(/\s+/g, " ").trim() });
  } catch (e) {
    report.apiProbe.push({ api, error: String(e).slice(0, 150) });
  }
}

report.apiCalls = [...apiCalls];
fs.writeFileSync(path.join(OUT, "explore-report.json"), JSON.stringify(report, null, 2), "utf8");

// also dump the known track page's full HTML for inspection
try {
  await page.goto(CANDIDATE_PAGES[CANDIDATE_PAGES.length - 1], { waitUntil: "networkidle", timeout: 25000 }).catch(() => {});
  fs.writeFileSync(path.join(OUT, "track-page.html"), await page.content(), "utf8");
} catch {}

console.log("Explore done. See out/explore-report.json");
console.log(JSON.stringify({ pageSummary: report.pages.map((p) => ({ url: p.url, status: p.status, finalUrl: p.finalUrl, needLogin: p.needLogin, trackLinkCount: p.trackLinkCount })), apiProbe: report.apiProbe.map((a) => ({ api: a.api, status: a.status })), apiCallsFound: report.apiCalls.length }, null, 2));
await ctx.close();
process.exit(0);
