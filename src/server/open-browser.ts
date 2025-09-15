import { spawn } from "node:child_process";
import { url } from "server";

export function openBrowser() {
  try {
    const platform = process.platform;
    let cmd: string;
    let args: string[] = [];
    if (platform === "darwin") {
      cmd = "open";
      args = [url];
    } else if (platform === "win32") {
      cmd = "cmd";
      args = ["/c", "start", "", url];
    } else {
      cmd = "xdg-open";
      args = [url];
    }
    const child = spawn(cmd, args, { stdio: "ignore", detached: true });
    child.unref();
    console.log(`Opened browser at ${url}`);
  } catch (err) {
    console.warn(`Failed to open browser automatically: ${err}`);
  }
}
