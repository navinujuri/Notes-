// open.mjs — open the built revision index in the default browser (cross-platform).
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const file = path.resolve("out/revision.html");
if (!fs.existsSync(file)) {
  console.error("out/revision.html not found — run `npm run build` first.");
  process.exit(1);
}
try {
  if (process.platform === "win32") execSync(`start "" "${file}"`);
  else if (process.platform === "darwin") execSync(`open "${file}"`);
  else execSync(`xdg-open "${file}"`);
  console.log("Opened " + file);
} catch (e) {
  console.log("Could not auto-open. Open this file manually:\n  " + file);
}
