// Wrap the scene in a root node scaled so the largest extent is 1, base at y=0, centred on X/Z.
// usage: node normalize.mjs in.glb out.glb
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/core';
const [inp, out] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(inp);
const scene = doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0];
const { min, max } = getBounds(scene);
const ext = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]);
const s = 1 / ext;
const root = doc.createNode('root').setScale([s, s, s])
  .setTranslation([-(min[0] + max[0]) / 2 * s, -min[1] * s, -(min[2] + max[2]) / 2 * s]);
for (const n of scene.listChildren()) { scene.removeChild(n); root.addChild(n); }
scene.addChild(root);
console.log('scale', s.toFixed(6), 'from extent', ext.toFixed(3));
await io.write(out, doc);
