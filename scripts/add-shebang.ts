// Adds #!/usr/bin/env node to the top of dist/asset-viewer-server.js if not present
import fs from "node:fs";
import path from "node:path";

const outFile = path.join(__dirname, "../dist/asset-viewer-server.js");
const shebang = "#!/usr/bin/env node\n";

if (fs.existsSync(outFile)) {
  const content = fs.readFileSync(outFile, "utf8");
  if (!content.startsWith(shebang)) fs.writeFileSync(outFile, shebang + content, "utf8");
}

if (fs.existsSync(outFile)) {
  const content = fs.readFileSync(outFile, "utf8");
  if (!content.startsWith(shebang)) fs.writeFileSync(outFile, shebang + content, "utf8");
}
