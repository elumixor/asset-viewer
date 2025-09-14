export const MODEL_EXTS = [".glb", ".gltf"] as const;
export const TEXTURE_EXTS = [".png", ".jpg", ".jpeg", ".webp"] as const;

export type AssetType = "model" | "texture";

export interface AssetInfo {
  name: string;
  filename: string;
  type: AssetType;
  path: string;
}
