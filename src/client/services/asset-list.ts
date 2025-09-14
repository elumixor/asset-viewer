import { useCallback, useState } from "react";

export function useAssetList() {
  const [assets, setAssets] = useState<string[]>([]);
  const [basePath, setBasePath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:${import.meta.env.PORT ?? 5735}/asset-list`);
      if (!res.ok) {
        setError(`Error: ${res.status} ${res.statusText}`);
        setAssets([]);
        setBasePath(null);
        setLoading(false);
        return;
      }

      const { assets, basePath } = await res.json();
      setAssets(assets);
      setBasePath(basePath);
      setLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setAssets([]);
      setBasePath(null);
      setLoading(false);
    }
  }, []);

  return { assets, basePath, loading, error, reload };
}
