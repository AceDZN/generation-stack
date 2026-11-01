// Usage: node assets-src/tools/report.mjs file.glb ...  -> JSON with bbox, tris, clips (exact durations), joints
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/core';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const out = {};
for (const f of process.argv.slice(2)) {
  const doc = await io.read(f);
  const root = doc.getRoot();
  const scene = root.getDefaultScene() || root.listScenes()[0];
  const b = getBounds(scene);
  let tris = 0;
  for (const m of root.listMeshes()) for (const p of m.listPrimitives()) { const i = p.getIndices(); tris += (i ? i.getCount() : p.getAttribute('POSITION').getCount()) / 3; }
  const clips = {};
  for (const a of root.listAnimations()) { let mx = 0; for (const s of a.listSamplers()) { const arr = s.getInput().getArray(); mx = Math.max(mx, arr[arr.length - 1]); } clips[a.getName()] = +mx.toFixed(3); }
  const skins = root.listSkins();
  out[f.split('/').pop()] = {
    bytes: (await import('fs')).statSync(f).size,
    bbox: { min: b.min.map(v => +v.toFixed(3)), max: b.max.map(v => +v.toFixed(3)) },
    tris, clips,
    joints: skins.length ? skins[0].listJoints().length : 0,
    rootNodes: scene.listChildren().map(n => n.getName()),
    extensionsRequired: root.listExtensionsRequired().map(e => e.extensionName),
  };
}
console.log(JSON.stringify(out, null, 1));
