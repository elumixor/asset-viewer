export const modelExtensions = [".glb", ".gltf"] as const;
export const textureExtensions = [".png", ".jpg", ".jpeg", ".webp"] as const;
export const supportedExtensions = [...modelExtensions, ...textureExtensions];

export type AssetType = "model" | "texture";

export interface AssetInfo {
  name: string;
  filename: string;
  type: AssetType;
  path: string;
}
