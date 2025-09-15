import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AmbientLight,
  Box3,
  DirectionalLight,
  GridHelper,
  PerspectiveCamera,
  Color as ThreeColor,
  Scene as ThreeScene,
  Vector3,
  WebGLRenderer,
} from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

export function AssetViewer3D({ gltf, onMeta }: { gltf: GLTF; onMeta: (meta: string) => void }) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const sceneRef = useRef<ThreeScene | null>(null);
  const frameRef = useRef<number | null>(null);
  const [size, setSize] = useState({ width: 256, height: 256 });

  // Observe wrapper size
  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      const width = Math.max(1, r.width);
      const height = Math.max(1, r.height);
      setSize({ width, height });
      const renderer = rendererRef.current;
      const camera = cameraRef.current;
      if (renderer && camera) {
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Init scene once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = new ThreeScene();
    scene.background = new ThreeColor(0x0d141d);
    const camera = new PerspectiveCamera(45, size.width / size.height, 0.1, 100);
    const renderer = new WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(size.width, size.height, false);

    scene.add(new AmbientLight(0xffffff, 0.1));
    const dir = new DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 6, 4);
    dir.lookAt(0, 0, 0);
    scene.add(dir);
    scene.add(new GridHelper(6, 6, 0x223547, 0x152433));

    const model = gltf.scene;
    const box = new Box3().setFromObject(model);
    const dim = box.getSize(new Vector3());
    const maxDim = Math.max(dim.x, dim.y, dim.z) || 1;
    const scale = 2 / maxDim;
    if (scale < 1) model.scale.setScalar(scale);
    model.position.y = 0;
    scene.add(model);

    // Position camera just outside the box, and look at its center
    camera.position.copy(dim);
    camera.lookAt(box.getCenter(new Vector3()));

    onMeta(`Scenes:${gltf.scenes.length} Anim:${gltf.animations.length}`);

    rendererRef.current = renderer;
    cameraRef.current = camera;
    sceneRef.current = scene;

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      scene.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gltf, onMeta]);

  return (
    <div ref={wrapperRef} style={{ width: "100%", height: "100%" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}
