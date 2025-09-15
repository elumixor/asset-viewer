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

test("parseArgs: open flag default is true", () => {
  withTempAssetsDir((dir) => {
    const old = process.argv;
    process.argv = [old[0], old[1], dir];
    const { open } = parseArgs();
    process.argv = old;
    expect(open).toBe(true);
  });
});

test("parseArgs: --open false disables opening", () => {
  withTempAssetsDir((dir) => {
    const old = process.argv;
    process.argv = [old[0], old[1], dir, "--open", "false"];
    const { open } = parseArgs();
    process.argv = old;
    expect(open).toBe(false);
  });
});

test("parseArgs: --open=false disables opening", () => {
  withTempAssetsDir((dir) => {
    const old = process.argv;
    process.argv = [old[0], old[1], dir, "--open=false"];
    const { open } = parseArgs();
    process.argv = old;
    expect(open).toBe(false);
  });
});

test("parseArgs: -o false disables opening", () => {
  withTempAssetsDir((dir) => {
    const old = process.argv;
    process.argv = [old[0], old[1], dir, "-o", "false"];
    const { open } = parseArgs();
    process.argv = old;
    expect(open).toBe(false);
  });
});

test("parseArgs: -o true explicit true", () => {
  withTempAssetsDir((dir) => {
    const old = process.argv;
    process.argv = [old[0], old[1], dir, "-o", "true"];
    const { open } = parseArgs();
    process.argv = old;
    expect(open).toBe(true);
  });
});
