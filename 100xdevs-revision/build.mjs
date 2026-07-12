// build.mjs — turn tracks.json into a level-wise revision resource (revision.md + revision.html).
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("out");
const tracks = JSON.parse(fs.readFileSync(path.join(OUT, "tracks.json"), "utf8"));
const byId = new Map(tracks.map((t) => [t.id, t]));
const INTERVIEW = fs.existsSync(path.join(path.resolve("."), "interview-content.json"))
  ? JSON.parse(fs.readFileSync(path.resolve("interview-content.json"), "utf8"))
  : {};
const CHEAT = fs.existsSync(path.join(path.resolve("."), "cheatsheet-content.json"))
  ? JSON.parse(fs.readFileSync(path.resolve("cheatsheet-content.json"), "utf8"))
  : {};

// ---- Curated level-wise learning path (all 88 tracks) ----
const LEVELS = [
  { name: "Level 0 · Orientation & Setup", blurb: "Get your machine, tooling and mindset ready before diving in.",
    ids: ["web-orientation", "installing-node-assignments", "senior", "eslint"] },
  { name: "Level 1 · JavaScript Foundations", blurb: "The language everything else is built on — syntax, async model, and the Node runtime.",
    ids: ["javascript-1", "async-js-1", "promises-async-await", "js-runtim"] },
  { name: "Level 2 · Browser, DOM & HTTP", blurb: "How the web actually works: manipulating the page and talking to servers.",
    ids: ["dom-1", "dom-2", "http-intro", "http-deep-dive"] },
  { name: "Level 3 · TypeScript", blurb: "Add types to JavaScript for safer, self-documenting code.",
    ids: ["6SbPPXGkG8QKFOTW9BmL", "ts-hard"] },
  { name: "Level 4 · React & Frontend State", blurb: "Component-driven UIs, state management and rendering strategies.",
    ids: ["react1111", "recoil11", "3Vhp7rCJUVjnvFuPxZSZ", "rendering"] },
  { name: "Level 5 · Next.js (Fullstack React)", blurb: "Server + client React, routing, middleware and data fetching.",
    ids: ["nextjs-1", "nextjs-2", "nextjsss", "mw"] },
  { name: "Level 6 · Databases", blurb: "Persisting data with SQL, Prisma and MongoDB — plus scaling and indexes.",
    ids: ["YOSAherHkqWXhOdlE4yE", "gZf9uBBNSbBR7UCqyyqT", "mongodb", "hor-ver-scaling"] },
  { name: "Level 7 · Authentication", blurb: "Sessions, JWTs, cookies and NextAuth done right.",
    ids: ["Auth", "Next-Auth", "auth-mern"] },
  { name: "Level 8 · Backend, APIs & Design", blurb: "API contracts, serverless, gRPC and backend design patterns.",
    ids: ["openapi", "eooSv7lnuwBO6wl9YA5w", "grpc", "singleton-sm-pubsubs", "rl-ddos-cap"] },
  { name: "Level 9 · Real-time & Messaging", blurb: "WebSockets, WebRTC and message brokers (Redis, Kafka).",
    ids: ["ABEC", "websocket12", "webrtc-1", "Redis", "kafka"] },
  { name: "Level 10 · Monorepos & Testing", blurb: "Structuring big repos and testing across the MERN stack.",
    ids: ["monorepo", "testing-1", "testing-2"] },
  { name: "Level 11 · DevOps · Docker", blurb: "Containerize apps from basics to end-to-end and Swarm.",
    ids: ["docker-easy", "docker-2", "docker-swarm"] },
  { name: "Level 12 · DevOps · CI/CD & Cloud Deploy", blurb: "Automated pipelines and deploying to AWS / Vercel.",
    ids: ["CI-CD", "g0AcDSPl74nk45ZZjRdU", "w5E6PT2t0IyOFM3bZxcM", "ZSQI8YNE0iL6sT1hJpts"] },
  { name: "Level 13 · DevOps · Kubernetes, Monitoring & Scale", blurb: "Orchestrate, observe and scale production systems.",
    ids: ["kubernetes-1", "kubernetes-part-2", "kubernetes-3", "monitoring-1", "prom-graf-1"] },
  { name: "Projects · Build the whole stack", blurb: "Apply everything by building real end-to-end products.",
    ids: ["Paytm", "oAjvkeRNZThPMxZf4aX5", "PayTM2", "blog", "codeforces", "exchange-1", "exchange-2"] },
  { name: "Appendix A · DSA", blurb: "Data structures & algorithms for interviews and problem solving.",
    ids: ["dsa", "dsa2", "DSA-3", "DSA-5", "DSA-6", "recursion", "dsa-9", "dsa-linked-list"] },
  { name: "Appendix B · Web3 Foundations (Solana / Rust)", blurb: "Crypto basics, wallets, Rust and the Solana programming model.",
    ids: ["web3-orientation", "public-private-keys", "web-wallet-rpc", "rust-bootcamp", "sol-tokens", "wallet-adapter", "token-launchpad-react", "auth-and-ownership", "Rust-for-Solana-contracts"] },
  { name: "Appendix C · Web3 (Ethereum / Solidity)", blurb: "EVM, Solidity, tooling and smart-contract patterns.",
    ids: ["eth", "ethfrontend", "Client", "Solidity", "ganache", "dex", "Bridges", "Upgradable-contracts", "Upgradable-staking-contract", "End-to-end-contract-with-FE"] },
];

// ---- One-line "what to revise here" summaries per track ----
const SUMMARIES = {
  "web-orientation": "Kickoff for the Web Dev + DevOps track — what you'll build and how the cohort runs.",
  "installing-node-assignments": "Environment setup: installing Node.js and the first warm-up assignments.",
  "senior": "Keyboard-first workflow and 5 tools that make you faster (code without your mouse).",
  "eslint": "Enforce code quality automatically with ESLint, Prettier and pre-commit hooks.",
  "javascript-1": "JavaScript 101 — variables, functions, loops, objects and core syntax.",
  "async-js-1": "Callbacks, the event loop and asynchronous thinking in JS.",
  "promises-async-await": "Promises and async/await for clean asynchronous code.",
  "js-runtim": "How the Node.js runtime executes your JavaScript on the server.",
  "dom-1": "Selecting and manipulating page elements with the DOM.",
  "dom-2": "Deeper DOM: events, dynamic UI and browser APIs.",
  "http-intro": "HTTP fundamentals — methods, status codes, headers, request/response.",
  "http-deep-dive": "HTTP in depth: REST, content types, caching and real request flows.",
  "6SbPPXGkG8QKFOTW9BmL": "TypeScript core — tsc, tsconfig, basic types, interfaces, generics, modules.",
  "ts-hard": "Advanced TypeScript APIs and utility types for real projects.",
  "react1111": "React from scratch — components, props, state, hooks and rendering.",
  "recoil11": "Global state management in React with Recoil atoms and selectors.",
  "3Vhp7rCJUVjnvFuPxZSZ": "Writing your own custom React hooks to reuse logic.",
  "rendering": "CSR vs SSR vs SSG — when and why to use each rendering strategy.",
  "nextjs-1": "Next.js on the client — routing, pages and components.",
  "nextjs-2": "Next.js on the server — server components, actions and data fetching.",
  "nextjsss": "Next.js Part 3 — advanced patterns and full-stack features.",
  "mw": "Middleware in Next.js for auth, redirects and request handling.",
  "YOSAherHkqWXhOdlE4yE": "Relational databases and SQL — schemas, queries and joins.",
  "gZf9uBBNSbBR7UCqyyqT": "Prisma ORM — type-safe DB access, schema and migrations.",
  "mongodb": "MongoDB with Zod validation, error handling and input validation.",
  "hor-ver-scaling": "Scaling databases horizontally/vertically and using indexes.",
  "Auth": "Authentication foundations — JWT, cookies and sessions in Express + React.",
  "Next-Auth": "NextAuth — providers (Google/GitHub), credentials and custom pages.",
  "auth-mern": "Authentication end-to-end in the MERN stack.",
  "openapi": "Documenting and contracting APIs with the OpenAPI spec.",
  "eooSv7lnuwBO6wl9YA5w": "Serverless backends — functions, cold starts and deployment.",
  "grpc": "gRPC for fast, typed service-to-service communication.",
  "singleton-sm-pubsubs": "Singleton pattern, backend state management and pub/sub.",
  "rl-ddos-cap": "Protecting APIs with rate limiting, DDoS mitigation and captcha.",
  "ABEC": "Advanced backend comms — WebSockets in Node.js and scaling ws servers.",
  "websocket12": "WebSockets — real-time bidirectional communication.",
  "webrtc-1": "WebRTC — peer-to-peer audio/video/data, basic to advanced.",
  "Redis": "Redis for caching, pub/sub and message queues.",
  "kafka": "Kafka — durable, high-throughput event streaming.",
  "monorepo": "Turborepo and monorepos — sharing code across apps/packages.",
  "testing-1": "Testing in the MERN stack — unit tests and setup.",
  "testing-2": "Integration and end-to-end testing.",
  "docker-easy": "Actionable Docker — images, containers and everyday commands.",
  "docker-2": "Docker end-to-end — multi-stage builds, compose and real workflows.",
  "docker-swarm": "Docker Swarm for simple multi-node container orchestration.",
  "CI-CD": "CI/CD pipelines in GitHub Actions — build, test and deploy.",
  "g0AcDSPl74nk45ZZjRdU": "Deploying apps to AWS EC2.",
  "w5E6PT2t0IyOFM3bZxcM": "Deploying frontends on AWS.",
  "ZSQI8YNE0iL6sT1hJpts": "Code-along: deploying on Vercel.",
  "kubernetes-1": "Kubernetes Part 1 — pods, deployments and services.",
  "kubernetes-part-2": "Kubernetes Part 2 — config, storage and networking.",
  "kubernetes-3": "Kubernetes Part 3 — autoscaling and production scaling.",
  "monitoring-1": "Monitoring and logging with New Relic.",
  "prom-graf-1": "Metrics and dashboards with Prometheus and Grafana.",
  "Paytm": "Paytm clone — full wallet app tying together the stack.",
  "oAjvkeRNZThPMxZf4aX5": "Paytm project (alternate cohort build).",
  "PayTM2": "Paytm Part 2 — onramps, transfers and P2P transactions.",
  "blog": "Build a blogging website end-to-end.",
  "codeforces": "Build a Codeforces-style competitive-programming platform.",
  "exchange-1": "Build a crypto/stock exchange — Part 1.",
  "exchange-2": "Build an exchange — Part 2 (backend).",
  "dsa": "Intro to DSA — how to approach data structures & algorithms.",
  "dsa2": "DSA intro continued — more core concepts.",
  "DSA-3": "Arrays — the fundamental data structure.",
  "DSA-5": "C++ Part 1 for DSA.",
  "DSA-6": "C++ Part 2 for DSA.",
  "recursion": "Recursion — thinking recursively and base cases.",
  "dsa-9": "Binary search, two-sum and string problems.",
  "dsa-linked-list": "Linked lists — nodes, traversal and operations.",
  "web3-orientation": "Web3 cohort orientation — Bitcoin, blockchains and what's ahead.",
  "public-private-keys": "Public-key cryptography — keys, signatures and wallets.",
  "web-wallet-rpc": "Build a web-based crypto wallet and talk to chains via RPC.",
  "rust-bootcamp": "Rust bootcamp — ownership, types and systems programming.",
  "sol-tokens": "Solana programs, accounts and the SPL Token program.",
  "wallet-adapter": "Client-side Solana apps with the wallet adapter.",
  "token-launchpad-react": "Build a token launchpad in React on Solana.",
  "auth-and-ownership": "Solana ownership, authorities and PDAs.",
  "Rust-for-Solana-contracts": "Writing and deploying Solana smart contracts in Rust.",
  "eth": "Ethereum intro and the EVM.",
  "ethfrontend": "Interacting with Ethereum from the frontend.",
  "Client": "Client-side Ethereum apps.",
  "Solidity": "Solidity — the smart-contract language.",
  "ganache": "Smart-contract tooling: Ganache, Truffle, Hardhat and Foundry.",
  "dex": "DEXs and funding mechanisms.",
  "Bridges": "Cross-chain bridges.",
  "Upgradable-contracts": "Upgradable smart-contract patterns.",
  "Upgradable-staking-contract": "Build an upgradable staking contract.",
  "End-to-end-contract-with-FE": "Ship a contract with a full frontend, end to end.",
};

const cohortName = (c) => (c === 0 ? "Cohort 2.0" : c === 3 ? "Cohort 3.0" : `Cohort ${c}`);
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s) => esc(s).replace(/"/g, "&quot;");

// Figure out which tracks are placed; append leftovers so nothing is dropped.
const placed = new Set(LEVELS.flatMap((l) => l.ids));
const leftover = tracks.filter((t) => !placed.has(t.id)).map((t) => t.id);
if (leftover.length) LEVELS.push({ name: "Other tracks", blurb: "Not yet categorized.", ids: leftover });

const totalLessons = tracks.reduce((n, t) => n + t.lessonCount, 0);

// ---------- Markdown ----------
let md = `# 100xDevs — Full-Stack Revision Notes\n\n`;
md += `A level-wise, categorized index of every track and lesson on projects.100xdevs.com.\n`;
md += `**${tracks.length} tracks · ${totalLessons} lessons.** Each lesson links to its notes page (and a downloadable PDF).\n\n`;
md += `> Tip: open \`revision.html\` in a browser for search + progress check-boxes. Print it (Ctrl+P) for a PDF.\n\n`;
md += `## Contents\n`;
LEVELS.forEach((l) => { md += `- [${l.name}](#${l.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")})\n`; });
md += `\n`;

for (const level of LEVELS) {
  md += `\n## ${level.name}\n\n_${level.blurb}_\n\n`;
  for (const id of level.ids) {
    const t = byId.get(id);
    if (!t) continue;
    const title = t.title?.trim() || t.id;
    md += `### ${title}  \n`;
    md += `${SUMMARIES[id] || ""}  \n`;
    md += `<sub>${cohortName(t.cohort)} · ${t.lessonCount} lessons</sub>\n\n`;
    t.lessons.forEach((ls, i) => {
      const lt = ls.title?.trim() || ls.id;
      md += `${i + 1}. [${lt}](${ls.url}) · [pdf](${ls.pdf})\n`;
    });
    md += `\n`;
  }
}
fs.writeFileSync(path.join(OUT, "revision.md"), md, "utf8");

// ---------- HTML ----------
const nav = LEVELS.map((l) => `<a href="#${escAttr(l.name.replace(/[^a-zA-Z0-9]+/g, "-"))}">${esc(l.name)}</a>`).join("");
let sections = "";
for (const level of LEVELS) {
  const anchor = level.name.replace(/[^a-zA-Z0-9]+/g, "-");
  const levelLessons = level.ids.reduce((n, id) => n + (byId.get(id)?.lessonCount || 0), 0);
  sections += `<section class="level" id="${escAttr(anchor)}"><h2>${esc(level.name)} <span class="muted">· ${levelLessons} lessons</span></h2><p class="blurb">${esc(level.blurb)}</p>`;
  for (const id of level.ids) {
    const t = byId.get(id);
    if (!t) continue;
    const title = t.title?.trim() || t.id;
    const prep = INTERVIEW[id]
      ? `<a class="prep" href="interview/${escAttr(id)}.html" onclick="event.stopPropagation()">🎯 Interview Prep →</a>`
      : "";
    const cheat = CHEAT[id]
      ? `<a class="cheat" href="cheatsheet/${escAttr(id)}.html" onclick="event.stopPropagation()">📄 Cheat Sheet →</a>`
      : "";
    const btns = prep || cheat ? `<span class="btns">${prep}${cheat}</span>` : "";
    sections += `<details class="track"><summary><span class="ttitle">${esc(title)}</span><span class="tmeta">${esc(cohortName(t.cohort))} · ${t.lessonCount}</span><span class="tsum">${esc(SUMMARIES[id] || "")}</span>${btns}</summary><ol>`;
    for (const ls of t.lessons) {
      const lt = ls.title?.trim() || ls.id;
      sections += `<li data-k="${escAttr(ls.url)}"><input type="checkbox" class="chk"><a href="${escAttr(ls.url)}" target="_blank" rel="noopener">${esc(lt)}</a> <a class="pdf" href="${escAttr(ls.pdf)}" target="_blank" rel="noopener">pdf</a></li>`;
    }
    sections += `</ol></details>`;
  }
  sections += `</section>`;
}

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>100xDevs — Full-Stack Revision Notes</title>
<style>
:root{--bg:#fff;--fg:#1a1a1a;--muted:#6b7280;--line:#e5e7eb;--accent:#2563eb;--card:#f9fafb;--chk:#16a34a}
@media(prefers-color-scheme:dark){:root{--bg:#0f1115;--fg:#e6e6e6;--muted:#9aa0aa;--line:#242833;--accent:#6ea8fe;--card:#171a21;--chk:#34d399}}
*{box-sizing:border-box}body{margin:0;font:15px/1.55 system-ui,Segoe UI,sans-serif;background:var(--bg);color:var(--fg)}
header{position:sticky;top:0;z-index:5;background:var(--bg);border-bottom:1px solid var(--line);padding:.8rem 1rem}
h1{font-size:1.15rem;margin:0 0 .5rem}
.bar{display:flex;gap:.6rem;align-items:center;flex-wrap:wrap}
#q{flex:1;min-width:200px;padding:.5rem .7rem;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--fg);font-size:.95rem}
.btn{padding:.45rem .7rem;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--fg);cursor:pointer;font-size:.85rem}
#prog{font-size:.85rem;color:var(--muted);white-space:nowrap}
nav{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.6rem}
nav a{font-size:.78rem;color:var(--accent);text-decoration:none;border:1px solid var(--line);padding:.15rem .5rem;border-radius:999px}
main{max-width:900px;margin:0 auto;padding:1rem}
.level{margin:1.6rem 0}.level h2{font-size:1.05rem;border-bottom:2px solid var(--line);padding-bottom:.3rem}
.muted{color:var(--muted);font-weight:400;font-size:.85rem}.blurb{color:var(--muted);margin:.3rem 0 .8rem}
.track{border:1px solid var(--line);border-radius:10px;margin:.5rem 0;background:var(--card);overflow:hidden}
.track summary{cursor:pointer;padding:.6rem .8rem;list-style:none;display:grid;grid-template-columns:1fr auto;gap:.1rem .8rem;align-items:baseline}
.track summary::-webkit-details-marker{display:none}
.ttitle{font-weight:600}.tmeta{color:var(--muted);font-size:.78rem;text-align:right}
.tsum{grid-column:1/-1;color:var(--muted);font-size:.85rem}
.btns{grid-column:1/-1;display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.4rem}
.prep,.cheat{font-size:.78rem;font-weight:600;color:#fff!important;padding:.25rem .6rem;border-radius:6px;text-decoration:none}
.prep{background:var(--accent)}.cheat{background:#0d9488}
.prep:hover,.cheat:hover{filter:brightness(1.08)}
.track ol{margin:0;padding:.2rem 1.2rem .8rem 2.2rem}
.track li{margin:.28rem 0}
.track li a{color:var(--accent);text-decoration:none}.track li a:hover{text-decoration:underline}
.chk{margin-right:.5rem;accent-color:var(--chk);transform:translateY(1px)}
li.done a{opacity:.55;text-decoration:line-through}
.pdf{font-size:.72rem;border:1px solid var(--line);border-radius:5px;padding:0 .3rem;color:var(--muted)!important}
.hide{display:none!important}
footer{max-width:900px;margin:0 auto;padding:1rem;color:var(--muted);font-size:.8rem}
</style></head><body>
<header>
<h1>100xDevs — Full-Stack Revision Notes</h1>
<div class="bar">
<input id="q" placeholder="Search topics or lessons… (e.g. websocket, prisma, docker)">
<button class="btn" id="expand">Expand all</button>
<button class="btn" id="collapse">Collapse all</button>
<span id="prog">0 / ${totalLessons} revised</span>
</div>
<nav>${nav}</nav>
</header>
<main>${sections}</main>
<footer>${tracks.length} tracks · ${totalLessons} lessons · generated from projects.100xdevs.com · progress is saved in this browser.</footer>
<script>
const KEY="x100rev";
const state=JSON.parse(localStorage.getItem(KEY)||"{}");
const lis=[...document.querySelectorAll("li[data-k]")];
function updateProg(){const done=lis.filter(li=>li.classList.contains("done")).length;document.getElementById("prog").textContent=done+" / "+lis.length+" revised";}
lis.forEach(li=>{const k=li.dataset.k,c=li.querySelector(".chk");if(state[k]){c.checked=true;li.classList.add("done");}
 c.addEventListener("change",()=>{if(c.checked){state[k]=1;li.classList.add("done");}else{delete state[k];li.classList.remove("done");}localStorage.setItem(KEY,JSON.stringify(state));updateProg();});});
updateProg();
document.getElementById("expand").onclick=()=>document.querySelectorAll("details").forEach(d=>d.open=true);
document.getElementById("collapse").onclick=()=>document.querySelectorAll("details").forEach(d=>d.open=false);
const q=document.getElementById("q");
q.addEventListener("input",()=>{const s=q.value.trim().toLowerCase();
 document.querySelectorAll(".track").forEach(tr=>{const txt=tr.textContent.toLowerCase();const hit=!s||txt.includes(s);tr.classList.toggle("hide",!hit);if(s&&hit)tr.open=true;if(!s)tr.open=false;});
 document.querySelectorAll(".level").forEach(lv=>{const any=[...lv.querySelectorAll(".track")].some(t=>!t.classList.contains("hide"));lv.classList.toggle("hide",!any);});});
</script></body></html>`;
fs.writeFileSync(path.join(OUT, "revision.html"), html, "utf8");

// ---------- Interview-prep pages (one per track that has content) ----------
const IV_CSS = `:root{--bg:#fff;--fg:#1a1a1a;--muted:#6b7280;--line:#e5e7eb;--accent:#2563eb;--card:#f9fafb}
@media(prefers-color-scheme:dark){:root{--bg:#0f1115;--fg:#e6e6e6;--muted:#9aa0aa;--line:#242833;--accent:#6ea8fe;--card:#171a21}}
*{box-sizing:border-box}body{margin:0;font:16px/1.6 system-ui,Segoe UI,sans-serif;background:var(--bg);color:var(--fg)}
.wrap{max-width:820px;margin:0 auto;padding:1.2rem}
a.back{color:var(--accent);text-decoration:none;font-size:.9rem}
h1{font-size:1.5rem;margin:.6rem 0 .2rem}.sub{color:var(--muted);margin:0 0 1.4rem}
h2{font-size:1.15rem;margin:2rem 0 .6rem;border-bottom:2px solid var(--line);padding-bottom:.3rem}
.b{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:.7rem .9rem;margin:.5rem 0}
.b .s{font-weight:700;color:var(--accent);font-size:.82rem;text-transform:uppercase;letter-spacing:.02em}
.b .p{margin-top:.2rem}
.example{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:10px;padding:1rem 1.1rem}
.qa{margin:.8rem 0}.qa .q{font-weight:600;margin-bottom:.25rem}.qa .a{color:var(--fg);opacity:.92}
.qa details{border:1px solid var(--line);border-radius:10px;padding:.6rem .9rem;background:var(--card);margin:.5rem 0}
.qa summary{cursor:pointer;font-weight:600}.qa summary::marker{color:var(--accent)}
.qa .a{margin-top:.5rem}
@media print{.back,.noprint{display:none}details{open:true}}`;

function interviewHtml(t, c) {
  const title = t.title?.trim() || t.id;
  const bullets = (c.bullets || []).map((b) => `<div class="b"><div class="s">${esc(b.step)}</div><div class="p">${esc(b.point)}</div></div>`).join("");
  const ex = c.example ? `<h2>Real-world example</h2><div class="example"><strong>${esc(c.example.title)}</strong><p>${esc(c.example.body)}</p></div>` : "";
  const qa = (c.qa || []).map((x, i) => `<div class="qa"><details${i === 0 ? " open" : ""}><summary>Q${i + 1}. ${esc(x.q)}</summary><div class="a">${esc(x.a)}</div></details></div>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Interview Prep · ${esc(title)}</title><style>${IV_CSS}</style></head><body><div class="wrap">
<a class="back" href="../revision.html">← Back to revision index</a>
<h1>${esc(title)}</h1>
<p class="sub">${esc(cohortName(t.cohort))} · ${t.lessonCount} lessons · SDE-2 (3+ yrs) interview prep</p>
<h2>Concept summary — all ${t.lessonCount} steps</h2>
${bullets}
${ex}
<h2>Interview Q&amp;A (SDE-2)</h2>
${qa}
</div></body></html>`;
}

const ivDir = path.join(OUT, "interview");
fs.mkdirSync(ivDir, { recursive: true });
let ivCount = 0;
for (const t of tracks) {
  const c = INTERVIEW[t.id];
  if (!c) continue;
  fs.writeFileSync(path.join(ivDir, `${t.id}.html`), interviewHtml(t, c), "utf8");
  ivCount++;
}
console.log(`Interview pages generated: ${ivCount} (of ${tracks.length} tracks)`);

// ---------- Cheat-sheet pages (one per track that has content) ----------
const CS_CSS = `:root{--bg:#fff;--fg:#1a1a1a;--muted:#6b7280;--line:#e5e7eb;--accent:#0d9488;--card:#f9fafb;--code:#f3f4f6;--codefg:#111}
@media(prefers-color-scheme:dark){:root{--bg:#0f1115;--fg:#e6e6e6;--muted:#9aa0aa;--line:#242833;--accent:#2dd4bf;--card:#171a21;--code:#0b0e13;--codefg:#e6e6e6}}
*{box-sizing:border-box}body{margin:0;font:16px/1.6 system-ui,Segoe UI,sans-serif;background:var(--bg);color:var(--fg)}
.wrap{max-width:860px;margin:0 auto;padding:1.2rem}
a.back{color:var(--accent);text-decoration:none;font-size:.9rem}
h1{font-size:1.5rem;margin:.6rem 0 .2rem}.sub{color:var(--muted);margin:0 0 1.4rem}
h2{font-size:1.1rem;margin:1.6rem 0 .5rem;color:var(--accent)}
.item{border:1px solid var(--line);border-radius:10px;background:var(--card);padding:.6rem .8rem;margin:.5rem 0}
.item .l{font-weight:700}
.item .n{color:var(--muted);font-size:.92rem;margin-top:.2rem}
pre{margin:.45rem 0 0;background:var(--code);color:var(--codefg);border:1px solid var(--line);border-radius:8px;padding:.6rem .8rem;overflow-x:auto}
code,pre{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:.86rem}
.tips{border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:10px;background:var(--card);padding:.6rem 1rem}
.tips li{margin:.35rem 0}
@media print{.back{display:none}}`;

function cheatHtml(t, c) {
  const title = t.title?.trim() || t.id;
  const secs = (c.sections || []).map((s) => {
    const items = (s.items || []).map((it) => {
      const l = it.label ? `<div class="l">${esc(it.label)}</div>` : "";
      const code = it.code ? `<pre><code>${esc(it.code)}</code></pre>` : "";
      const n = it.note ? `<div class="n">${esc(it.note)}</div>` : "";
      return `<div class="item">${l}${code}${n}</div>`;
    }).join("");
    return `<h2>${esc(s.title)}</h2>${items}`;
  }).join("");
  const tips = (c.tips && c.tips.length)
    ? `<h2>Quick tips &amp; gotchas</h2><ul class="tips">${c.tips.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`
    : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cheat Sheet · ${esc(title)}</title><style>${CS_CSS}</style></head><body><div class="wrap">
<a class="back" href="../revision.html">← Back to revision index</a>
<h1>${esc(title)} — Cheat Sheet</h1>
<p class="sub">${esc(cohortName(t.cohort))} · ${t.lessonCount} lessons · quick reference</p>
${secs}
${tips}
</div></body></html>`;
}

const csDir = path.join(OUT, "cheatsheet");
fs.mkdirSync(csDir, { recursive: true });
let csCount = 0;
for (const t of tracks) {
  const c = CHEAT[t.id];
  if (!c) continue;
  fs.writeFileSync(path.join(csDir, `${t.id}.html`), cheatHtml(t, c), "utf8");
  csCount++;
}
console.log(`Cheat-sheet pages generated: ${csCount} (of ${tracks.length} tracks)`);

console.log(`Built revision.md and revision.html`);
console.log(`Tracks: ${tracks.length} | Lessons: ${totalLessons} | Levels: ${LEVELS.length}`);
if (leftover.length) console.log(`Leftover (auto-added to 'Other'): ${leftover.join(", ")}`);
else console.log(`All tracks categorized into levels. ✅`);
