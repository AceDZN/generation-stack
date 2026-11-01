// Print Hips translation range per clip (detect baked root motion), bind hips position.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
for (const f of process.argv.slice(2)) {
  const doc = await io.read(f);
  const hips = doc.getRoot().listNodes().find(n => /Hips$/.test(n.getName()));
  console.log(f, 'bind hips', hips.getTranslation().map(v=>+v.toFixed(3)), 'parent scale?', doc.getRoot().listNodes().find(n=>n.getName()==='Armature')?.getScale());
  for (const a of doc.getRoot().listAnimations()) for (const c of a.listChannels()) {
    if (c.getTargetNode() === hips && c.getTargetPath() === 'translation') {
      const o = c.getSampler().getOutput().getArray(); const mn=[1e9,1e9,1e9], mx=[-1e9,-1e9,-1e9];
      for (let i=0;i<o.length;i+=3) for (let k=0;k<3;k++){mn[k]=Math.min(mn[k],o[i+k]);mx[k]=Math.max(mx[k],o[i+k]);}
      console.log('  ', a.getName().padEnd(16), 'min', mn.map(v=>v.toFixed(3)).join(','), 'max', mx.map(v=>v.toFixed(3)).join(','));
    }
  }
}
