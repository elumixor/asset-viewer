import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { Command } from "commander";

export function parseArgs(): { assetsBaseDir: string; port: number; open: boolean } {
  const program = new Command();
  program
    .name("asset-viewer")
    .argument(
      "[path]",
      "Path to assets directory (or set ASSET_VIEWER_PATH env var). If a project root containing public/assets is provided, that subfolder will be used.",
    )
    .option("-p, --port <number>", "Port to run the server on", "5735")
    .option("-o, --open", "Open default browser pointing to the server root after start", false)
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

  return { assetsBaseDir, port, open: Boolean(opts.open) };
}
