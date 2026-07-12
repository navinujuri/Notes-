// overlap.mjs — detect topic repetition between Cohort 2.0 (cohort 0) and 3.0 (cohort 3)
import fs from "node:fs";
import path from "node:path";
const tracks = JSON.parse(fs.readFileSync(path.resolve("out/tracks.json"), "utf8"));

const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const lessonSet = (t) => new Set(t.lessons.map((l) => norm(l.title)).filter((x) => x.length > 2));
const jaccard = (a, b) => { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i || 1); };

const c2 = tracks.filter((t) => t.cohort === 0);
const c3 = tracks.filter((t) => t.cohort === 3);

const pairs = [];
for (const a of c2) for (const b of c3) {
  const A = lessonSet(a), B = lessonSet(b);
  const j = jaccard(A, B);
  let shared = 0; for (const x of A) if (B.has(x)) shared++;
  // also loose title match
  const titleMatch = norm(a.title) && (norm(a.title) === norm(b.title) || norm(a.title).includes(norm(b.title)) || norm(b.title).includes(norm(a.title)));
  if (j >= 0.12 || shared >= 3 || titleMatch) pairs.push({ c2: a.title, c3: b.title, shared, jaccard: +j.toFixed(2), titleMatch });
}
pairs.sort((x, y) => y.jaccard - x.jaccard || y.shared - x.shared);

console.log(`Cohort 2.0: ${c2.length} tracks | Cohort 3.0: ${c3.length} tracks\n`);
console.log(`Likely-overlapping topics (shared lesson titles or matching names):\n`);
for (const p of pairs) console.log(`  ${String(p.shared).padStart(2)} shared | J=${p.jaccard} | "${p.c2}" (2.0)  ⇄  "${p.c3}" (3.0)`);
console.log(`\nTotal candidate overlaps: ${pairs.length}`);
