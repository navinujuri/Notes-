// assemble.mjs — read workflow journal.jsonl, extract per-track interview content,
// merge into interview-content.json (preserving any hand-written entries like nextjs-1).
import fs from "node:fs";
import path from "node:path";

// usage: node assemble.mjs <journal.jsonl> [outFile=interview-content.json] [kind=interview|cheat]
const jpath = process.argv[2];
const outFileArg = process.argv[3] || "interview-content.json";
const kind = process.argv[4] || "interview";
const lines = fs.readFileSync(jpath, "utf8").split(/\r?\n/).filter(Boolean);

const isPayload = (o) =>
  kind === "cheat"
    ? typeof o.trackId === "string" && Array.isArray(o.sections)
    : typeof o.trackId === "string" && Array.isArray(o.bullets) && Array.isArray(o.qa);
const pick = (o) =>
  kind === "cheat"
    ? { sections: o.sections, tips: o.tips || [] }
    : { bullets: o.bullets, example: o.example, qa: o.qa };

function looksJson(s) { return typeof s === "string" && /^[\[{]/.test(s.trim()); }
function findPayload(o, depth = 0) {
  if (depth > 8 || o == null) return null;
  if (looksJson(o)) { try { return findPayload(JSON.parse(o), depth + 1); } catch { return null; } }
  if (typeof o !== "object") return null;
  if (Array.isArray(o)) { for (const x of o) { const r = findPayload(x, depth + 1); if (r) return r; } return null; }
  if (isPayload(o)) return o;
  for (const k of Object.keys(o)) { const r = findPayload(o[k], depth + 1); if (r) return r; }
  return null;
}

const found = {};
for (const ln of lines) {
  let obj; try { obj = JSON.parse(ln); } catch { continue; }
  const p = findPayload(obj);
  if (p && p.trackId) found[p.trackId] = pick(p);
}

const outPath = path.resolve(outFileArg);
const existing = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, "utf8")) : {};

// Merge: keep hand-written flagship (nextjs-1) over generated; add the rest.
const merged = { ...found, ...existing };  // existing wins on conflicts (flagship preserved)
let added = 0;
for (const k of Object.keys(found)) if (!(k in existing)) added++;

fs.writeFileSync(outPath, JSON.stringify(merged, null, 2), "utf8");

const tracks = JSON.parse(fs.readFileSync("out/tracks.json", "utf8"));
const have = new Set(Object.keys(merged));
const missing = tracks.filter((t) => !have.has(t.id)).map((t) => t.id);

console.log(`Extracted ${Object.keys(found).length} track results from journal.`);
console.log(`${outFileArg} now has ${Object.keys(merged).length}/${tracks.length} tracks (added ${added} new).`);
console.log(`\nStill MISSING (${missing.length}): ${missing.join(", ")}`);
