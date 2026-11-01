// Renders the tray card pictures from the same 3D pieces the tower uses (mockup 1's tray shows
// rendered pieces, not flat icons). Done once at boot with the main renderer and a render target.

import * as THREE from 'three';
import type { ServiceType } from '../model/types.ts';
import type { TowerView } from './towerView.ts';

export type ThumbKey = 'baby' | 'beam' | ServiceType;

export function renderThumbnails(renderer: THREE.WebGLRenderer, view: TowerView): Record<ThumbKey, string> {
  const size = 160;
  const rt = new THREE.WebGLRenderTarget(size, size, { colorSpace: THREE.SRGBColorSpace });
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc9a77a, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(-2, 4, 5);
  scene.add(sun);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  const out = {} as Record<ThumbKey, string>;
  const pixels = new Uint8Array(size * size * 4);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const items: [ThumbKey, THREE.Object3D][] = [
    ['baby', view.sample('baby')],
    ['beam', view.sample('beam')],
    ['classroom', view.serviceSample('classroom')],
    ['workplace', view.serviceSample('workplace')],
    ['clinic', view.serviceSample('clinic')],
  ];
  const prevTarget = renderer.getRenderTarget();
  const prevTone = renderer.toneMapping;
  for (const [key, obj] of items) {
    scene.add(obj);
    const box = new THREE.Box3().setFromObject(obj);
    const c = box.getCenter(new THREE.Vector3());
    const r = box.getSize(new THREE.Vector3()).length() / 2;
    cam.position.set(c.x + r * 1.6, c.y + r * 1.3, c.z + r * 3.2);
    cam.lookAt(c);
    renderer.setRenderTarget(rt);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(scene, cam);
    renderer.readRenderTargetPixels(rt, 0, 0, size, size, pixels);
    const img = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) img.data.set(pixels.subarray((size - 1 - y) * size * 4, (size - y) * size * 4), y * size * 4);
    ctx.clearRect(0, 0, size, size);
    ctx.putImageData(img, 0, 0);
    out[key] = canvas.toDataURL('image/png');
    scene.remove(obj);
  }
  renderer.setRenderTarget(prevTarget);
  renderer.toneMapping = prevTone;
  rt.dispose();
  return out;
}
