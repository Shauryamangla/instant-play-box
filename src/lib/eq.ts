// 13-band parametric EQ via Web Audio API, attached to an HTMLMediaElement.
export const EQ_BANDS = [
  50, 80, 125, 200, 315, 500, 800, 1250, 2000, 3150, 5000, 8000, 12500,
] as const;

export interface EqGraph {
  ctx: AudioContext;
  source: MediaElementAudioSourceNode;
  filters: BiquadFilterNode[];
  balance: StereoPannerNode;
  sub: BiquadFilterNode; // low-pass for sub crossover
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
  const sub = ctx.createBiquadFilter();
  sub.type = "allpass"; // disabled by default; switched to lowpass when sub on
  sub.frequency.value = 80;
  const balance = ctx.createStereoPanner();
  const gain = ctx.createGain();
  // chain: source -> filters... -> sub -> balance -> gain -> destination
  let node: AudioNode = source;
  for (const f of filters) {
    node.connect(f);
    node = f;
  }
  node.connect(sub);
  sub.connect(balance);
  balance.connect(gain);
  gain.connect(ctx.destination);
  const graph: EqGraph = { ctx, source, filters, balance, sub, gain };
  cache.set(media, graph);
  return graph;
}