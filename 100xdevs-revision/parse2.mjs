// parse2.mjs — extract full track objects (with nested lessons) from decoded flight.txt.
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("out");
const text = fs.readFileSync(path.join(OUT, "flight.txt"), "utf8");

// Scan forward from a "{" index, respecting JSON strings, to the matching "}".
function matchObject(s, start) {
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
    } else {
      if (c === '"') inStr = true;
      else if (c === "{") depth++;
      else if (c === "}") { depth--; if (depth === 0) return s.slice(start, i + 1); }
    }
  }
  return null;
}

const tracks = [];
const seen = new Set();
let parseFail = 0;
const re = /\{"id":"/g;
let m;
while ((m = re.exec(text))) {
  const objStr = matchObject(text, m.index);
  if (!objStr) continue;
  let obj;
  try { obj = JSON.parse(objStr); } catch { parseFail++; continue; }
  if (obj && Array.isArray(obj.problems) && obj.problems.length && !seen.has(obj.id)) {
    seen.add(obj.id);
    tracks.push({
      id: obj.id,
      title: obj.title,
      cohort: obj.cohort,
      hidden: !!obj.hidden,
      lessonCount: obj.problems.length,
      lessons: obj.problems.map((p) => ({
        id: p.id,
        title: (p.title || "").trim(),
        description: (p.description || "").replace(/\s+/g, " ").trim(),
        type: p.type || "",
        url: `https://projects.100xdevs.com/tracks/${obj.id}/${p.id}`,
        pdf: `https://projects.100xdevs.com/pdf/${obj.id}/${p.id}`,
      })),
    });
  }
}

fs.writeFileSync(path.join(OUT, "tracks.json"), JSON.stringify(tracks, null, 2), "utf8");

console.log(`Parsed ${tracks.length} tracks (parse failures on inner objs: ${parseFail}), total lessons: ${tracks.reduce((n, t) => n + t.lessonCount, 0)}\n`);
const byCohort = {};
for (const t of tracks) (byCohort[t.cohort] ??= []).push(t);
for (const c of Object.keys(byCohort).sort()) {
  console.log(`\n===== cohort ${c} (${byCohort[c].length} tracks) =====`);
  for (const t of byCohort[c]) console.log(`  [${String(t.lessonCount).padStart(2)}] ${t.id}${t.hidden ? " (hidden)" : ""}  ::  ${t.title}`);
}
