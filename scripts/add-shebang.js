// Adds #!/usr/bin/env node to the top of dist/asset-viewer-server.js if not present
const fs = require('fs');
const path = require('path');
const outFile = path.join(__dirname, '../dist/asset-viewer-server.js');
const shebang = '#!/usr/bin/env node\n';
const bunShebang = '#!/usr/bin/env bun\n';
if (fs.existsSync(outFile)) {
  let content = fs.readFileSync(outFile, 'utf8');
  if (content.startsWith(bunShebang)) {
    content = content.replace(bunShebang, '');
  }
  if (!content.startsWith(shebang)) {
    fs.writeFileSync(outFile, shebang + content, 'utf8');
  }
}
if (fs.existsSync(outFile)) {
  const content = fs.readFileSync(outFile, 'utf8');
  if (!content.startsWith(shebang)) {
    fs.writeFileSync(outFile, shebang + content, 'utf8');
  }
}