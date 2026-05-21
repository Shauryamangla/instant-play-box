import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { EQ_BANDS } from "./eq";
import {
  ensurePermission,
  listVideoFiles,
  loadDirHandle,
  saveDirHandle,
} from "./idb-handle";

export type Track = {
  name: string;
  path: string;
  file: File;
  url: string;
  kind: "audio" | "video";
};

export interface AudioCfg {
  eq: number[]; // dB per band, length 13
  fader: number; // -1 rear .. +1 front
  balance: number; // -1 left .. +1 right
  subOn: boolean;
  subLevel: number; // 0..1
  crossover: number; // Hz 50..200
  volume: number; // 0..1
  preset: string;
  // Tone control
  bass: number; // -6..+6 dB
  treble: number; // -6..+6 dB
  bassBoost: number; // 0..6
  loudness: "off" | "low" | "mid" | "high";
  // High Pass Filter — Front / Rear
  hpfFrontOn: boolean;
  hpfFrontFreq: number; // 50..200 Hz
  hpfFrontSlope: -6 | -12 | -18 | -24; // dB/oct
  hpfRearOn: boolean;
  hpfRearFreq: number;
  hpfRearSlope: -6 | -12 | -18 | -24;
  // Subwoofer LPF + phase
  subLpfFreq: number; // 50..200 Hz
  subLpfSlope: -6 | -12 | -18 | -24;
  subPhase: "normal" | "reverse";
  // Speaker levels (-24..+10 dB)
  spkFL: number;
  spkFR: number;
  spkRL: number;
  spkRR: number;
  spkSW: number;
  // Time alignment per speaker (cm, 0..500)
  taFL: number;
  taFR: number;
  taRL: number;
  taRR: number;
  taSW: number;
  taOn: boolean;
  listenPosition: "off" | "front-left" | "front-right" | "front" | "all";
  // Enhancers
  soundRetriever: "off" | "low" | "high";
  alc: boolean; // Auto Level Control
  sla: number; // Source Level Adjuster -8..+8 dB
  muteLevel: number; // 0..1 (attenuation when muted/nav)
  beep: boolean;
}
export interface VideoCfg {
  brightness: number; // 0..2
  contrast: number; // 0..2
  saturation: number; // 0..2
  hue: number; // -180..180
  aspect: "fit" | "fill" | "stretch" | "16:9" | "4:3";
}
export interface SystemCfg {
  language: string;
  wallpaper: string; // css gradient id
  illumination: string; // hex / oklch accent
  use24h: boolean;
}
export interface PlaybackCfg {
  autoplay: boolean;
  resumeOnBoot: boolean;
  repeat: "off" | "one" | "all";
  shuffle: boolean;
}
export interface Resume {
  path: string | null;
  time: number;
}

export interface PioneerState {
  audio: AudioCfg;
  video: VideoCfg;
  system: SystemCfg;
  playback: PlaybackCfg;
  resume: Resume;
}

const DEFAULT_STATE: PioneerState = {
  audio: {
    eq: Array(EQ_BANDS.length).fill(0),
    fader: 0,
    balance: 0,
    subOn: false,
    subLevel: 0.5,
    crossover: 80,
    volume: 0.8,
    preset: "Flat",
    bass: 0,
    treble: 0,
    bassBoost: 0,
    loudness: "off",
    hpfFrontOn: false,
    hpfFrontFreq: 80,
    hpfFrontSlope: -12,
    hpfRearOn: false,
    hpfRearFreq: 80,
    hpfRearSlope: -12,
    subLpfFreq: 80,
    subLpfSlope: -12,
    subPhase: "normal",
    spkFL: 0,
    spkFR: 0,
    spkRL: 0,
    spkRR: 0,
    spkSW: 0,
    taFL: 0,
    taFR: 0,
    taRL: 0,
    taRR: 0,
    taSW: 0,
    taOn: false,
    listenPosition: "off",
    soundRetriever: "off",
    alc: false,
    sla: 0,
    muteLevel: 0.2,
    beep: true,
  },
  video: { brightness: 1, contrast: 1, saturation: 1, hue: 0, aspect: "fit" },
  system: {
    language: "English",
    wallpaper: "aurora",
    illumination: "#28b6ff",
    use24h: false,
  },
  playback: { autoplay: true, resumeOnBoot: true, repeat: "all", shuffle: false },
  resume: { path: null, time: 0 },
};

const KEY = "pioneer-state-v1";

function loadState(): PioneerState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...parsed,
      audio: { ...DEFAULT_STATE.audio, ...parsed.audio },
      video: { ...DEFAULT_STATE.video, ...parsed.video },
      system: { ...DEFAULT_STATE.system, ...parsed.system },
      playback: { ...DEFAULT_STATE.playback, ...parsed.playback },
      resume: { ...DEFAULT_STATE.resume, ...parsed.resume },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

interface Ctx {
  state: PioneerState;
  set: <K extends keyof PioneerState>(k: K, v: Partial<PioneerState[K]>) => void;
  tracks: Track[];
  loadingTracks: boolean;
  hasFolder: boolean;
  pickFolder: () => Promise<void>;
  reloadTracks: () => Promise<void>;
  currentIndex: number;
  setCurrentIndex: (i: number) => void;
  current: Track | null;
  next: () => void;
  prev: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoSlot: HTMLElement | null;
  setVideoSlot: (el: HTMLElement | null) => void;
}

const PioneerCtx = createContext<Ctx | null>(null);

export function PioneerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PioneerState>(DEFAULT_STATE);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loadingTracks, setLoading] = useState(false);
  const [hasFolder, setHasFolder] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoSlot, setVideoSlot] = useState<HTMLElement | null>(null);

  // hydrate
  useEffect(() => {
    setState(loadState());
  }, []);

  // persist
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  // apply illumination accent
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.style.setProperty(
      "--primary",
      `oklch(from ${state.system.illumination} l c h)`
    );
    document.documentElement.style.setProperty(
      "--ring",
      `oklch(from ${state.system.illumination} l c h)`
    );
    document.documentElement.style.setProperty(
      "--accent",
      `oklch(from ${state.system.illumination} l c h)`
    );
  }, [state.system.illumination]);

  const set: Ctx["set"] = (k, v) => {
    setState((s) => ({ ...s, [k]: { ...s[k], ...v } }));
  };

  // try to restore folder on boot
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const handle = await loadDirHandle();
      if (!handle || cancelled) return;
      const ok = await ensurePermission(handle);
      if (!ok || cancelled) return;
      setHasFolder(true);
      setLoading(true);
      try {
        const files = await listVideoFiles(handle);
        if (cancelled) return;
        const list = files.map((f) => ({ ...f, url: URL.createObjectURL(f.file) }));
        setTracks(list);
        // resume index from saved path; if file was renamed/deleted, reset.
        const saved = loadState().resume;
        if (saved.path) {
          const idx = list.findIndex((t) => t.path === saved.path);
          if (idx >= 0) {
            setCurrentIndex(idx);
          } else {
            // Saved track no longer exists — clear stale resume so playback
            // starts fresh from the beginning of the first available track.
            setState((s) => ({ ...s, resume: { path: null, time: 0 } }));
            setCurrentIndex(0);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pickFolder = async () => {
    // @ts-expect-error - showDirectoryPicker is non-standard but supported
    const handle: FileSystemDirectoryHandle = await window.showDirectoryPicker({
      id: "pioneer-videos",
      mode: "read",
    });
    await saveDirHandle(handle);
    setHasFolder(true);
    setLoading(true);
    try {
      const files = await listVideoFiles(handle);
      const list = files.map((f) => ({ ...f, url: URL.createObjectURL(f.file) }));
      setTracks(list);
      setCurrentIndex(0);
    } finally {
      setLoading(false);
    }
  };

  const reloadTracks = async () => {
    const handle = await loadDirHandle();
    if (!handle) return;
    const ok = await ensurePermission(handle);
    if (!ok) return;
    setLoading(true);
    try {
      const files = await listVideoFiles(handle);
      const list = files.map((f) => ({ ...f, url: URL.createObjectURL(f.file) }));
      setTracks(list);
    } finally {
      setLoading(false);
    }
  };

  const current = tracks[currentIndex] ?? null;

  const next = () => {
    if (!tracks.length) return;
    if (state.playback.shuffle) {
      setCurrentIndex(Math.floor(Math.random() * tracks.length));
      return;
    }
    setCurrentIndex((i) => {
      const n = i + 1;
      if (n >= tracks.length) return state.playback.repeat === "off" ? i : 0;
      return n;
    });
  };
  const prev = () => {
    if (!tracks.length) return;
    setCurrentIndex((i) => (i - 1 + tracks.length) % tracks.length);
  };

  const value = useMemo<Ctx>(
    () => ({
      state,
      set,
      tracks,
      loadingTracks,
      hasFolder,
      pickFolder,
      reloadTracks,
      currentIndex,
      setCurrentIndex,
      current,
      next,
      prev,
      videoRef,
      videoSlot,
      setVideoSlot,
    }),
    [state, tracks, loadingTracks, hasFolder, currentIndex, current, videoSlot]
  );

  return <PioneerCtx.Provider value={value}>{children}</PioneerCtx.Provider>;
}

export function usePioneer() {
  const v = useContext(PioneerCtx);
  if (!v) throw new Error("usePioneer must be used within PioneerProvider");
  return v;
}