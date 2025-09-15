import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { Command } from "commander";

function parseBoolean(value: string | undefined): boolean {
  if (value == null || value === "") return true; // flag present without value
  const v = value.toLowerCase();
  if (["true", "1", "yes", "y", "on"].includes(v)) return true;
  if (["false", "0", "no", "n", "off"].includes(v)) return false;
  throw new Error(`Invalid boolean value for --open: ${value}`);
}

export function parseArgs(): { assetsBaseDir: string; port: number; open: boolean } {
  const program = new Command();
  program
    .name("asset-viewer")
    .argument(
      "[path]",
      "Path to assets directory (or set ASSET_VIEWER_PATH env var). If a project root containing public/assets is provided, that subfolder will be used.",
    )
    .option("-p, --port <number>", "Port to run the server on", "5735")
    .option(
      "-o, --open [value]",
      "Open default browser pointing to the server root after start (pass false to disable)",
      (value: string) => {
        // Commander passes value when provided, otherwise undefined if just flag
        try {
          return parseBoolean(value);
        } catch (e) {
          if (e instanceof Error) {
            program.error(e.message);
          }
          return true;
        }
      },
    )
    .version(process.env.npm_package_version || "0.0.0")
    .allowExcessArguments(false)
    .showHelpAfterError();

  program.parse(process.argv).opts();

  const rawPath: string | undefined = program.args[0];
  if (!rawPath) program.error("Path is required (provide <path>)");

  const assetsBaseDir = resolve(process.cwd(), rawPath);
  if (!existsSync(assetsBaseDir)) program.error(`Provided path does not exist: ${assetsBaseDir}`);

  const opts = program.opts<{ port: string; open?: boolean }>();
  const port = parseInt(opts.port, 10);
  if (Number.isNaN(port) || port < 1 || port > 65535) program.error(`Invalid port number: ${opts.port}`);
  // Default open to true if undefined
  const open = opts.open === undefined ? true : opts.open;
  return { assetsBaseDir, port, open };
}
