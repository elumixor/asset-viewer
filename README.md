# Asset Viewer

[![Build](https://github.com/elumixor/asset-viewer/actions/workflows/build.yml/badge.svg)](https://github.com/elumixor/asset-viewer/actions/workflows/build.yml)
[![Latest NPM version](https://img.shields.io/npm/v/@elumixor/asset-viewer.svg)](https://www.npmjs.com/package/@elumixor/asset-viewer)

A simple asset viewer for PixiJS and Three.js projects.

## Usage

```bash
npm install --save-dev @elumixor/asset-viewer

# Start viewer pointing directly to a directory containing .glb/.gltf/.png/.jpg/.jpeg/.webp files
npx asset-viewer ./path/to/assets

# Custom port
npx asset-viewer ./path/to/assets --port 6001
```

Open your browser at the printed URL (defaults to `http://localhost:5735`).

The provided path can be either:

1. A folder that directly contains model/texture files (served under `/assets`).
2. A project root that contains `public/assets` (that subfolder will be used).

Command line options:

```bash
Usage: asset-viewer [options] <path>
    -p, --port <number>  Port to run the server on (default: 5735)
    -V, --version        Output version
    -h, --help           Display help
```

Notes:

- The lightweight client (HTML/CSS/JS) is now built separately instead of being inlined.
- Three.js is resolved from your local `node_modules` when available, with CDN fallback inside the client script.
