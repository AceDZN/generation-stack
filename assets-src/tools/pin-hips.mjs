// Pin the Hips X/Z translation of the named clips to the bind pose (removes a baked offset).
// usage: node pin-hips.mjs in.glb out.glb clipName [clipName...]
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const [inp, out, ...clips] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(inp);
const hips = doc.getRoot().listNodes().find(n => /Hips$/.test(n.getName()));
const bind = hips.getTranslation();
for (const a of doc.getRoot().listAnimations()) {
  if (!clips.includes(a.getName())) continue;
  for (const c of a.listChannels()) {
    if (c.getTargetNode() !== hips || c.getTargetPath() !== 'translation') continue;
    const acc = c.getSampler().getOutput();
    const arr = acc.getArray().slice();
    for (let i = 0; i < arr.length; i += 3) { arr[i] = bind[0]; arr[i + 2] = bind[2]; }
    acc.setArray(arr);
    console.log('pinned', a.getName(), 'X/Z to', bind[0].toFixed(3), bind[2].toFixed(3));
  }
}
await io.write(out, doc);
