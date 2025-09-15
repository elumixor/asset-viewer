// Adds #!/usr/bin/env node to the top of dist/server/index.js if not present
import fs from "node:fs";
import path from "node:path";

const outFile = path.join(__dirname, "../dist/server/index.js");
console.log(`Adding shebang to ${outFile} if not present...`);
const shebang = "#!/usr/bin/env bun\n";

if (fs.existsSync(outFile)) {
  const content = fs.readFileSync(outFile, "utf8");
  if (!content.startsWith(shebang)) {
    console.log("Shebang not present, adding...");
    fs.writeFileSync(outFile, shebang + content, "utf8");
  } else {
    console.log("Shebang already present, skipping.");
  }
} else {
  console.warn(`Warning: could not find output file to add shebang: ${outFile}`);
}

if (fs.existsSync(outFile)) {
  const content = fs.readFileSync(outFile, "utf8");
  if (!content.startsWith(shebang)) fs.writeFileSync(outFile, shebang + content, "utf8");
}
