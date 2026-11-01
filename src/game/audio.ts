// Small synthesized sounds (no audio files): squeaks, the crank ratchet, wind, chimes and cheers.
// The context starts on the first user gesture.

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  muted = false;
  private windNode: { src: AudioBufferSourceNode; gain: GainNode } | null = null;

  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    try {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.5;
  }

  private tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.3, slide = 0, delay = 0): void {
    const c = this.ctx;
    if (!c || !this.master) return;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private noise(dur: number, vol: number, freq: number, delay = 0): void {
    const c = this.ctx;
    if (!c || !this.master) return;
    const t = c.currentTime + delay;
    const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t);
  }

  squeak(pitch = 1): void {
    this.tone(700 * pitch, 0.14, 'triangle', 0.25, 1.8);
  }
  slide(): void {
    this.noise(0.25, 0.25, 900);
    this.tone(320, 0.18, 'sine', 0.15, 1.4, 0.15);
  }
  thunk(): void {
    this.tone(140, 0.2, 'sine', 0.4, 0.5);
    this.noise(0.08, 0.3, 300);
  }
  ratchet(): void {
    for (let i = 0; i < 6; i++) this.noise(0.04, 0.35, 2200, i * 0.07);
    this.tone(90, 0.5, 'sawtooth', 0.12, 1.5, 0.1);
  }
  wind(on: boolean): void {
    const c = this.ctx;
    if (!c || !this.master) return;
    if (!on) {
      if (this.windNode) {
        this.windNode.gain.gain.setTargetAtTime(0, c.currentTime, 0.3);
        const n = this.windNode;
        setTimeout(() => n.src.stop(), 1200);
        this.windNode = null;
      }
      return;
    }
    if (this.windNode) return;
    const buf = c.createBuffer(1, c.sampleRate * 3, c.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) d[i] = last = last * 0.97 + (Math.random() * 2 - 1) * 0.03;
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 600;
    const g = c.createGain();
    g.gain.value = 0;
    g.gain.setTargetAtTime(1.6, c.currentTime, 0.4);
    src.connect(f).connect(g).connect(this.master);
    src.start();
    this.windNode = { src, gain: g };
  }
  chime(): void {
    [880, 1108, 1318].forEach((f, i) => this.tone(f, 0.6, 'sine', 0.18, 0, i * 0.08));
  }
  fade(): void {
    this.tone(1200, 0.9, 'sine', 0.08, 1.6);
  }
  cheer(): void {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.2, 0, i * 0.1));
    this.noise(1.0, 0.12, 1500, 0.1);
  }
  oops(): void {
    this.tone(400, 0.3, 'square', 0.12, 0.5);
    this.tone(300, 0.4, 'square', 0.1, 0.5, 0.15);
  }
  crash(): void {
    for (let i = 0; i < 5; i++) this.noise(0.25, 0.4, 200 + i * 150, i * 0.09);
    this.tone(200, 1.0, 'sawtooth', 0.15, 0.3);
  }
  boing(): void {
    this.tone(220, 0.35, 'sine', 0.3, 2.5);
  }
  click(): void {
    this.tone(1400, 0.05, 'square', 0.08);
  }
  flap(): void {
    this.noise(0.12, 0.2, 500);
  }
}
