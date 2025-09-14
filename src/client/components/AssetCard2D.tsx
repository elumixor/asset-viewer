import { Application } from "@pixi/react";
import type { Texture } from "pixi.js";

export function AssetCard2D({ texture, onMeta }: { texture: Texture; onMeta: (meta: string) => void }) {
  onMeta(`${texture.width}x${texture.height}`);

  return (
    <Application>
      <pixiSprite x={100} y={100} texture={texture} />
    </Application>
  );
}
