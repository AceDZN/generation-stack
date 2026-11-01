// Canvas textures drawn at boot: group patterns (so colour is never the only cue),
// lit windows with family silhouettes, plaza stones and the sky.

import * as THREE from 'three';
import type { Group } from '../model/types.ts';

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

function tex(c: HTMLCanvasElement, repeat = false): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export const GROUP_COLOR: Record<Group, string> = { child: '#ffd23f', adult: '#7ccf5a', elder: '#b48cf0' };
const GROUP_PATTERN: Record<Group, string> = { child: '#fff3b8', adult: '#a9e58a', elder: '#e3d3ff' };

function star(g: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath();
  g.fill();
}

/** The face pattern for a group: dots for children, stripes for adults, stars for elders. */
export function groupTexture(group: Group): THREE.CanvasTexture {
  const [c, g] = canvas(256, 256);
  g.fillStyle = GROUP_COLOR[group];
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = GROUP_PATTERN[group];
  if (group === 'child') {
    for (const [x, y, r] of [[40, 50, 22], [170, 30, 16], [120, 130, 26], [220, 150, 18], [50, 200, 18], [180, 230, 22]]) {
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
  } else if (group === 'adult') {
    for (let y = 0; y < 256; y += 64) g.fillRect(0, y + 8, 256, 26);
  } else {
    for (const [x, y, r] of [[50, 50, 26], [190, 70, 20], [110, 160, 30], [220, 210, 18], [40, 220, 16]]) star(g, x, y, r);
  }
  // soft bevel shading toward the edges
  const grad = g.createRadialGradient(128, 110, 60, 128, 128, 190);
  grad.addColorStop(0, 'rgba(255,255,255,0.10)');
  grad.addColorStop(1, 'rgba(0,0,0,0.12)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return tex(c);
}

/** A lit arched window with a little family silhouette. variant 0..3 */
export function windowTexture(variant: number): THREE.CanvasTexture {
  const [c, g] = canvas(128, 128);
  g.clearRect(0, 0, 128, 128);
  // frame
  g.fillStyle = '#c98a3c';
  arch(g, 14, 10, 100, 112, 50);
  g.fill();
  const glow = g.createLinearGradient(0, 20, 0, 118);
  glow.addColorStop(0, '#fff2c4');
  glow.addColorStop(1, '#ffb347');
  g.fillStyle = glow;
  arch(g, 22, 18, 84, 98, 42);
  g.fill();
  // family silhouette: generic people, no faces
  g.fillStyle = '#5a3215';
  const person = (x: number, h: number) => {
    const head = h * 0.17;
    g.beginPath();
    g.arc(x, 112 - h + head, head, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.roundRect(x - head * 1.1, 112 - h + head * 2.1, head * 2.2, h - head * 2.1, head * 0.8);
    g.fill();
  };
  const sets = [
    [[46, 58], [80, 52], [63, 32]],
    [[50, 56], [76, 34], [92, 28]],
    [[56, 60], [82, 56]],
    [[44, 34], [64, 58], [86, 30]],
  ][variant % 4];
  for (const [x, h] of sets) person(x, h);
  // sill and flowers
  g.fillStyle = '#8b5a2b';
  g.fillRect(10, 112, 108, 10);
  g.fillStyle = '#e8506a';
  for (const x of [24, 40, 88, 104]) {
    g.beginPath();
    g.arc(x, 110, 5, 0, Math.PI * 2);
    g.fill();
  }
  return tex(c);
}

function arch(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  g.beginPath();
  g.moveTo(x, y + h);
  g.lineTo(x, y + r);
  g.arc(x + w / 2, y + r, w / 2, Math.PI, 0);
  g.lineTo(x + w, y + h);
  g.closePath();
}

/** A baby block face: a cheerful pacifier face (babies only, not a person's likeness). */
export function babyFaceTexture(): THREE.CanvasTexture {
  const [c, g] = canvas(128, 128);
  g.fillStyle = '#5a3215';
  g.beginPath();
  g.arc(44, 56, 7, 0, Math.PI * 2);
  g.arc(84, 56, 7, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#ff9fb2';
  g.globalAlpha = 0.6;
  g.beginPath();
  g.arc(32, 74, 9, 0, Math.PI * 2);
  g.arc(96, 74, 9, 0, Math.PI * 2);
  g.fill();
  g.globalAlpha = 1;
  g.fillStyle = '#4aa3ff';
  g.beginPath();
  g.ellipse(64, 86, 18, 11, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.arc(64, 86, 6, 0, Math.PI * 2);
  g.fill();
  return tex(c);
}

/** Yellow/black hazard stripes for beams. */
export function beamTexture(): THREE.CanvasTexture {
  const [c, g] = canvas(128, 128);
  g.fillStyle = '#9a6a3a';
  g.fillRect(0, 0, 128, 128);
  g.save();
  g.translate(64, 64);
  g.rotate(Math.PI / 4);
  for (let i = -6; i < 6; i++) {
    g.fillStyle = i % 2 ? '#ffd23f' : '#2b2b2b';
    g.fillRect(i * 22, -100, 22, 200);
  }
  g.restore();
  g.fillStyle = 'rgba(0,0,0,0.15)';
  g.fillRect(0, 0, 128, 10);
  g.fillRect(0, 118, 128, 10);
  return tex(c);
}

/** Warm limestone plaza tiles. */
export function plazaTexture(): THREE.CanvasTexture {
  const [c, g] = canvas(512, 512);
  g.fillStyle = '#e9d6b4';
  g.fillRect(0, 0, 512, 512);
  let s = 3;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let y = 0; y < 512; y += 64) {
    const off = (y / 64) % 2 ? 32 : 0;
    for (let x = -64; x < 576; x += 64) {
      const l = 82 + r() * 10;
      g.fillStyle = `hsl(${34 + r() * 8}, ${38 + r() * 12}%, ${l}%)`;
      g.fillRect(x + off + 2, y + 2, 60, 60);
    }
  }
  const t = tex(c, true);
  t.repeat.set(10, 10);
  return t;
}

/** The sky: a soft gradient with a few painted clouds. */
export function skyTexture(): THREE.CanvasTexture {
  const [c, g] = canvas(512, 512);
  const grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#3d8ee8');
  grad.addColorStop(0.55, '#8cc4f5');
  grad.addColorStop(1, '#fde6c4');
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 512);
  g.fillStyle = 'rgba(255,255,255,0.85)';
  for (const [x, y, w] of [[80, 120, 90], [300, 80, 120], [420, 170, 70], [190, 200, 60]]) {
    for (let k = 0; k < 5; k++) {
      g.beginPath();
      g.ellipse(x + k * w * 0.28 - w * 0.5, y + Math.sin(k * 2) * 8, w * 0.32, w * 0.2, 0, 0, Math.PI * 2);
      g.fill();
    }
  }
  return tex(c);
}

/** Group icon textures for in-world service signs. */
export function iconTexture(kind: 'book' | 'case' | 'heart'): THREE.CanvasTexture {
  const [c, g] = canvas(128, 128);
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.arc(64, 64, 60, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = kind === 'heart' ? '#e8344e' : '#2f6fd6';
  if (kind === 'heart') {
    g.beginPath();
    g.moveTo(64, 100);
    g.bezierCurveTo(10, 60, 30, 20, 64, 44);
    g.bezierCurveTo(98, 20, 118, 60, 64, 100);
    g.fill();
  } else if (kind === 'book') {
    g.fillRect(28, 38, 34, 50);
    g.fillRect(66, 38, 34, 50);
    g.fillStyle = '#ffffff';
    g.fillRect(34, 48, 22, 4);
    g.fillRect(72, 48, 22, 4);
    g.fillRect(34, 60, 22, 4);
    g.fillRect(72, 60, 22, 4);
  } else {
    g.fillRect(26, 46, 76, 48);
    g.fillRect(48, 34, 32, 14);
    g.fillStyle = '#ffffff';
    g.fillRect(56, 40, 16, 8);
    g.fillRect(26, 64, 76, 4);
  }
  return tex(c);
}
