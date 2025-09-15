import type { ResourceEntry, Resources } from "@elumixor/thrixi-resources";
import type { SupportedFileName } from "@elumixor/thrixi-resources/dist/types";
import { Texture as PixiTexture } from "pixi.js";
import { useEffect, useState } from "react";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { AssetViewer2D } from "./AssetViewer2D";
import { AssetViewer3D } from "./AssetViewer3D";

export function AssetCard({
  assetName,
  resources,
}: {
  assetName: string;
  resources: Resources<Record<string, ResourceEntry<SupportedFileName>>>;
}) {
  const [asset, setAsset] = useState<GLTF | PixiTexture | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<string>("loading");
  const [meta, setMeta] = useState<string>("");

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setType("loading");
    setMeta("");
    setAsset(null);

    resources
      .getLazy(assetName)
      .then((loadedAsset) => {
        setAsset(loadedAsset);
        setType(loadedAsset instanceof PixiTexture ? "2D Image" : "3D Model");
      })
      .catch((err) => {
        setError("Error loading asset");
        console.error(err);
      })
      .finally(() => setIsLoading(false));
  }, [assetName, resources]);

  const filename = assetName;

  return (
    <div className="bg-[#152233] border border-[#223547] rounded-xl p-2.5 flex flex-col gap-2 relative overflow-hidden">
      <div className="bg-[#111] border border-[#223547] rounded-lg flex items-center justify-center aspect-square relative overflow-hidden">
        <div className="absolute top-1.5 left-1.5 bg-[#4ec9ff] text-[#052030] text-[10px] px-1.5 py-[3px] rounded font-bold uppercase tracking-[0.5px]">
          {type}
        </div>
        {isLoading ? (
          <div className="w-[22px] h-[22px] border-[3px] border-[#223547] border-t-[#4ec9ff] rounded-full animate-spin" />
        ) : error ? (
          <div className="text-[#ff6b6b] text-[0.85rem]">{error}</div>
        ) : asset && "scene" in asset ? (
          <AssetViewer3D gltf={asset} onMeta={setMeta} />
        ) : asset ? (
          <AssetViewer2D texture={asset} onMeta={setMeta} />
        ) : null}
      </div>
      <div className="text-[0.85rem] font-semibold text-[#9cd6ff] whitespace-nowrap overflow-hidden text-ellipsis">
        {filename}
      </div>
      <div className="text-[0.65rem] opacity-65 leading-[1.2] min-h-[1em]">{meta}</div>
    </div>
  );
}
