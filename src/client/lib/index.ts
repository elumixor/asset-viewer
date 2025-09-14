export function getFileNameWithoutExtension(path: string): string {
  const parts = path.split(".");
  if (parts.length <= 1) return path;
  parts.pop();
  return parts.join(".") ?? path;
}
