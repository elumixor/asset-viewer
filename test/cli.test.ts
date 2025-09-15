import { expect, test } from "bun:test";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "../src/server/parse-args";

function withTempAssetsDir(run: (dir: string) => void) {
  const dir = join(process.cwd(), "test-temp-assets");
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  try {
    run(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("parseArgs: open flag default is false", () => {
  withTempAssetsDir((dir) => {
    const old = process.argv;
    process.argv = [old[0], old[1], dir];
    const { open } = parseArgs();
    process.argv = old; // restore
    expect(open).toBe(false);
  });
});

test("parseArgs: --open sets open true", () => {
  withTempAssetsDir((dir) => {
    const old = process.argv;
    process.argv = [old[0], old[1], dir, "--open"]; // pass flag
    const { open } = parseArgs();
    process.argv = old; // restore
    expect(open).toBe(true);
  });
});

test("parseArgs: -o sets open true", () => {
  withTempAssetsDir((dir) => {
    const old = process.argv;
    process.argv = [old[0], old[1], dir, "-o"]; // pass short flag
    const { open } = parseArgs();
    process.argv = old; // restore
    expect(open).toBe(true);
  });
});
