// 13-band parametric EQ via Web Audio API, attached to an HTMLMediaElement.
export const EQ_BANDS = [
  50, 80, 125, 200, 315, 500, 800, 1250, 2000, 3150, 5000, 8000, 12500,
] as const;

export interface EqGraph {
  ctx: AudioContext;
  source: MediaElementAudioSourceNode;
  filters: BiquadFilterNode[];
  balance: StereoPannerNode;
  sub: BiquadFilterNode; // parallel low-pass for subwoofer branch
  subGain: GainNode; // 0 when sub off, subLevel when on
  gain: GainNode;
}

const cache = new WeakMap<HTMLMediaElement, EqGraph>();

export function attachEq(media: HTMLMediaElement): EqGraph {
  const existing = cache.get(media);
  if (existing) return existing;
  const ctx = new AudioContext();
  const source = ctx.createMediaElementSource(media);
  const filters = EQ_BANDS.map((freq, i) => {
    const f = ctx.createBiquadFilter();
    f.type = i === 0 ? "lowshelf" : i === EQ_BANDS.length - 1 ? "highshelf" : "peaking";
    f.frequency.value = freq;
    f.Q.value = 1.2;
    f.gain.value = 0;
    return f;
  });
  // Parallel subwoofer branch: a dedicated low-pass + gain that sums into the
  // main output. Toggling subwoofer OFF silences this branch (gain=0) without
  // touching the main full-range signal — turning the subwoofer on adds bass,
  // turning it off removes it (no more "everything becomes a woofer" bug).
  const sub = ctx.createBiquadFilter();
  sub.type = "lowpass";
  sub.frequency.value = 80;
  const subGain = ctx.createGain();
  subGain.gain.value = 0; // sub disabled by default
  const balance = ctx.createStereoPanner();
  const gain = ctx.createGain();
  // Main chain: source -> filters... -> balance -> gain -> destination
  let node: AudioNode = source;
  for (const f of filters) {
    node.connect(f);
    node = f;
  }
  node.connect(balance);
  balance.connect(gain);
  gain.connect(ctx.destination);
  // Parallel sub tap (taken after EQ, before balance) summed into output.
  node.connect(sub);
  sub.connect(subGain);
  subGain.connect(gain);
  const graph: EqGraph = { ctx, source, filters, balance, sub, subGain, gain };
  cache.set(media, graph);
  return graph;
}