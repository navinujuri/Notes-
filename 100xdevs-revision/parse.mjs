// parse.mjs — decode the Next.js RSC flight payload from a saved HTML dump into clean text,
// then extract the track/lesson tree.
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("out");
const html = fs.readFileSync(path.join(OUT, "debug-0.html"), "utf8");

// 1) Extract & decode all self.__next_f.push([1,"..."]) chunks
const re = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g;
let m, decoded = "";
let chunks = 0;
while ((m = re.exec(html))) {
  try { decoded += JSON.parse('"' + m[1] + '"'); chunks++; } catch {}
}
fs.writeFileSync(path.join(OUT, "flight.txt"), decoded, "utf8");
console.log(`Decoded ${chunks} chunks -> flight.txt (${decoded.length} chars)`);

// 2) Extract track objects: {"id":"...","title":"...","description":"..."}
const trackRe = /\{"id":"([^"]+)","title":"([^"]+)","description":"([^"]*)"/g;
const tracks = [];
while ((m = trackRe.exec(decoded))) {
  tracks.push({ id: m[1], title: m[2], description: m[3].slice(0, 120) });
}

// 3) Find any explicit lesson/track paths present in the payload
const pathRe = /"path":"([^"]+)"/g;
const paths = new Set();
while ((m = pathRe.exec(decoded))) paths.add(m[1]);

// 4) Find slug-like fields
const slugRe = /"slug":"([^"]+)"/g;
const slugs = new Set();
while ((m = slugRe.exec(decoded))) slugs.add(m[1]);

console.log(`\nTRACKS (${tracks.length}):`);
for (const t of tracks) console.log(`  ${t.id}  ::  ${t.title}`);
console.log(`\nPATH fields (${paths.size}):`);
[...paths].slice(0, 40).forEach((p) => console.log("  " + p));
console.log(`\nSLUG fields (${slugs.size}):`);
[...slugs].slice(0, 40).forEach((s) => console.log("  " + s));

fs.writeFileSync(path.join(OUT, "tracks-raw.json"), JSON.stringify({ tracks, paths: [...paths], slugs: [...slugs] }, null, 2), "utf8");
