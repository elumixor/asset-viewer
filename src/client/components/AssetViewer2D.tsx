import { Application, Container, Sprite, type Texture } from "pixi.js";
import { useEffect, useRef } from "react";

export function AssetViewer2D({ texture, onMeta }: { texture: Texture; onMeta: (meta: string) => void }) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Report metadata once per texture
  useEffect(() => {
    onMeta(`${texture.width}x${texture.height}`);
  }, [texture, onMeta]);

  useEffect(() => {
    const app = new Application();

    let ro: ResizeObserver | null = null;

    void (async () => {
      if (!wrapperRef.current) return;

      await app.init({ resizeTo: wrapperRef.current });

      // Append the application canvas to the document body
      wrapperRef.current.appendChild(app.canvas);

      // Create and add a container to the stage
      const container = new Container();
      app.stage.addChild(container);

      // Load the bunny texture
      const sprite = new Sprite(texture);

      container.addChild(sprite);

      container.x = app.screen.width / 2;
      container.y = app.screen.height / 2;

      // Center the bunny sprites in local container coordinates
      container.pivot.x = container.width / 2;
      container.pivot.y = container.height / 2;

      //   requestAnimationFrame(function resize() {
      //     requestAnimationFrame(resize);

      //     // Compute scale to fit while preserving aspect ratio.
      //     const scale = Math.min(app.screen.width / (texture.width || 1), app.screen.height / (texture.height || 1), 1);
      //     container.scale.set(scale);
      //   });

      // Use resize observer to handle resizing
      ro = new ResizeObserver(() => {
        if (!wrapperRef.current) return;

        const rect = wrapperRef.current.getBoundingClientRect();
        const width = Math.max(1, rect.width);
        const height = Math.max(1, rect.height);

        app.renderer.resize(width, height);

        // Compute scale to fit while preserving aspect ratio.
        const scale = Math.min(width / (texture.width || 1), height / (texture.height || 1));
        container.scale.set(scale);

        container.x = width / 2;
        container.y = height / 2;
      });
      ro.observe(wrapperRef.current);
    })();

    return () => {
      app.destroy(true, { children: true });
      ro?.disconnect();
    };
  }, [texture, wrapperRef]);

  return <div ref={wrapperRef} style={{ width: "100%", height: "100%" }}></div>;
}
