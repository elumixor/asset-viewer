import { Resources } from "@elumixor/thrixi-resources";
import type { SupportedFileName } from "@elumixor/thrixi-resources/dist/types";
import type React from "react";
import { useEffect, useState } from "react";
import { AssetCard } from "./components/AssetCard";
import { ResourcesProvider } from "./contexts/resources";
import "./global.css";
import { getFileNameWithoutExtension } from "./lib";
import { useAssetList } from "./services/asset-list";

export const App: React.FC = () => {
  const [resources, setResources] = useState(new Resources("/assets"));

  const { assets, loading, error, reload } = useAssetList();
  const [assetNames, setAssetNames] = useState<string[]>([]);
  const [resourcesProgress, setResourcesProgress] = useState({ loaded: 0, total: 0, percentage: 0 });

  useEffect(() => {
    let r = new Resources(`http://localhost:${import.meta.env.PORT ?? 5735}/assets`);

    for (const assetPath of assets) r = r.add(assetPath as SupportedFileName);

    r.load((p) => setResourcesProgress(p)).catch(console.error);
    setResources(r);
    setAssetNames(assets.map((a) => getFileNameWithoutExtension(a)));
  }, [assets]);

  // Load on start
  useEffect(() => {
    void reload();
  }, []);

  return (
    <ResourcesProvider basePath="/assets">
      <header>
        <h1 className="text-[1.6rem] bg-gradient-to-r from-[#4ec9ff] to-[#66ccff] bg-clip-text text-transparent font-semibold mb-2">
          Asset Viewer
        </h1>
        <div className="flex gap-3 items-center mt-3 flex-wrap">
          <button
            type="button"
            onClick={reload}
            disabled={loading}
            className="bg-gradient-to-tr from-[#4ec9ff] to-[#66ccff] text-[#062030] border-0 px-3.5 py-2 rounded-lg font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reload
          </button>
        </div>
      </header>
      {loading && (
        <div className="flex items-center gap-2.5">
          <div className="w-[22px] h-[22px] border-[3px] border-[#223547] border-t-[#4ec9ff] rounded-full animate-spin" />
          <span>Scanning assets...</span>
        </div>
      )}
      {error && <div className="text-[#ff6b6b] text-[0.85rem] mt-2">{error}</div>}
      {!error && <div>{assets.length === 0 ? "No" : assets.length} assets found</div>}
      {!error && (
        <div>
          {resourcesProgress.loaded} / {resourcesProgress.total} loaded
        </div>
      )}
      <div className="grid [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))] gap-4 mt-5">
        {assetNames.length > 0 && assetNames.map((a) => <AssetCard key={a} assetName={a} resources={resources} />)}
      </div>
      <footer className="mt-8 text-[0.65rem] opacity-50">React build • Three.js • Asset viewer</footer>
    </ResourcesProvider>
  );
};
