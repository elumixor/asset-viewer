// Copy static client assets (index.html, viewer.css) into dist/client
const fs = require("node:fs");
const path = require("node:path");
const srcDir = path.join(__dirname, "..", "src", "client");
const outDir = path.join(__dirname, "..", "dist", "client");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
for (const file of ["index.html", "viewer.css"]) {
  const from = path.join(srcDir, file);
  const to = path.join(outDir, file);
  if (fs.existsSync(from)) {
    fs.copyFileSync(from, to);
  }
}
