"use client";

import { Resources } from "@elumixor/thrixi-resources";
import { createContext, useContext, useState } from "react";

interface ResourcesState {
  resources: Resources;
}

const ResourcesContext = createContext<ResourcesState | undefined>(undefined);

export function ResourcesProvider({ children, basePath }: { children: React.ReactNode; basePath: string }) {
  const [resources] = useState(new Resources(basePath));
  return <ResourcesContext.Provider value={{ resources }}>{children}</ResourcesContext.Provider>;
}

export function useResources() {
  const ctx = useContext(ResourcesContext);
  if (!ctx) throw new Error("useResources must be used within ResourcesProvider");
  return ctx;
}
