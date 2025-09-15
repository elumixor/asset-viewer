import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { supportedExtensions } from "shared";

// Recursively walk through the directory and collect all files
export async function getAssetsList(currentDir: string): Promise<string[]> {
  return Promise.all(
    (await readdir(currentDir, { withFileTypes: true })).map(async (entry) => {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) return getAssetsList(fullPath);
      else if (entry.isFile()) return [fullPath];
      else return [];
    }),
  ).then((lists) =>
    lists.flat().filter((p) => {
      const extension = p.slice(p.lastIndexOf(".")).toLowerCase();
      return (supportedExtensions as string[]).includes(extension);
    }),
  );
}
