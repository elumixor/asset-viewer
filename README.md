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

- Client is a React + Vite bundle (Three.js + GLTF previews).
- Three.js is resolved from local `node_modules` with standard ESM import (no inline import map).

## Development (Hot Reload)

Single command dev environment with Bun hot server + Vite HMR client:

```bash
bun run dev -- ./test/assets --port 5735
```

Details:

1. Starts the asset viewer server via `bun run --hot src/asset-viewer-server.ts ...` (automatic restart on changes).
2. Starts `vite dev` for the React client (port 5173 by default) and proxies `/api` + `/assets` to the Bun server port.
3. Pass any normal CLI arguments to the server after `--` (path, --port, etc.).

Open the Vite dev URL it prints (e.g. http://localhost:5173) during development. For a production-like bundle, run `bun run build` then execute the generated CLI (`npx asset-viewer ...`).
