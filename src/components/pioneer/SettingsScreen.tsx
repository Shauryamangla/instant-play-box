import { useState } from "react";
import { usePioneer } from "@/lib/pioneer-store";
import { EQ_BANDS } from "@/lib/eq";
import { clearDirHandle } from "@/lib/idb-handle";
import { cn } from "@/lib/utils";

type Tab = "audio" | "video" | "system" | "playback";

const PRESETS: Record<string, number[]> = {
  Flat: Array(13).fill(0),
  PowerfulBass: [8, 6, 4, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  Vocal: [-2, -1, 0, 1, 3, 5, 5, 4, 2, 0, -1, -2, -2],
  SuperBass: [10, 8, 6, 3, 0, 0, 0, 0, 0, 0, 0, 2, 4],
  Dynamic: [4, 3, 0, -1, -2, 0, 2, 4, 5, 5, 4, 3, 2],
  Natural: [2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2],
  Vivid: [3, 2, 1, 0, -1, 0, 1, 2, 3, 4, 4, 3, 2],
};

const SLOPES = [-6, -12, -18, -24] as const;

const WALLPAPERS: Record<string, string> = {
  aurora: "radial-gradient(ellipse at top, oklch(0.35 0.12 230 / 0.6), transparent 60%), linear-gradient(180deg, oklch(0.16 0.02 250), oklch(0.1 0.02 260))",
  carbon: "repeating-linear-gradient(45deg, oklch(0.18 0.02 260) 0 6px, oklch(0.16 0.02 260) 6px 12px)",
  ember: "radial-gradient(ellipse at bottom, oklch(0.4 0.18 30 / 0.5), transparent 60%), linear-gradient(180deg, oklch(0.14 0.02 260), oklch(0.08 0.02 260))",
  city: "linear-gradient(180deg, oklch(0.2 0.05 270), oklch(0.12 0.04 260))",
};

export function SettingsScreen({ initialTab = "audio" as Tab }: { initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  return (
    <div className="flex h-full">
      <div className="flex w-44 flex-col border-r border-border bg-[var(--pioneer-bar)] p-2">
        {(["audio", "video", "system", "playback"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md px-3 py-2 text-left text-sm font-medium uppercase tracking-wide",
              tab === t
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-4">
        {tab === "audio" && <AudioPanel />}
        {tab === "video" && <VideoPanel />}
        {tab === "system" && <SystemPanel />}
        {tab === "playback" && <PlaybackPanel />}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-3">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function AudioPanel() {
  const { state, set } = usePioneer();
  const a = state.audio;
  const setBand = (i: number, v: number) => {
    const eq = a.eq.slice();
    eq[i] = v;
    set("audio", { eq, preset: "Custom" });
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Audio</h2>
        <select
          value={a.preset}
          onChange={(e) => {
            const p = e.target.value;
            set("audio", { preset: p, eq: PRESETS[p] ?? a.eq });
          }}
          className="rounded-md border border-border bg-secondary px-2 py-1 text-sm"
        >
          {Object.keys(PRESETS).concat("Custom").map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-2 text-xs uppercase tracking-widest text-primary">
          13-Band Graphic EQ (±12 dB)
        </div>
        <div className="flex items-end gap-2">
          {EQ_BANDS.map((f, i) => (
            <div key={f} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {a.eq[i] > 0 ? "+" : ""}
                {a.eq[i].toFixed(0)}
              </span>
              <input
                type="range"
                min={-12}
                max={12}
                step={1}
                value={a.eq[i]}
                onChange={(e) => setBand(i, Number(e.target.value))}
                className="h-32 accent-[var(--primary)]"
                style={{ writingMode: "vertical-lr" as const, direction: "rtl" }}
              />
              <span className="text-[10px] text-muted-foreground">
                {f >= 1000 ? `${f / 1000}k` : f}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 text-xs uppercase tracking-widest text-primary">
            Fader / Balance
          </div>
          <Row label={`Balance (${a.balance > 0 ? "R" : a.balance < 0 ? "L" : "C"})`}>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.05}
              value={a.balance}
              onChange={(e) => set("audio", { balance: Number(e.target.value) })}
            />
          </Row>
          <Row label={`Fader (${a.fader > 0 ? "F" : a.fader < 0 ? "R" : "C"})`}>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.05}
              value={a.fader}
              onChange={(e) => set("audio", { fader: Number(e.target.value) })}
            />
          </Row>
          <Row label="Master Volume">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={a.volume}
              onChange={(e) => set("audio", { volume: Number(e.target.value) })}
            />
          </Row>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 text-xs uppercase tracking-widest text-primary">
            Subwoofer / LPF
          </div>
          <Row label="Subwoofer">
            <Toggle
              value={a.subOn}
              onChange={(v) => set("audio", { subOn: v })}
            />
          </Row>
          <Row label={`Sub Level (${Math.round(a.subLevel * 100)}%)`}>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={a.subLevel}
              onChange={(e) => set("audio", { subLevel: Number(e.target.value) })}
            />
          </Row>
          <Row label={`LPF Cutoff (${a.subLpfFreq} Hz)`}>
            <input
              type="range"
              min={50}
              max={200}
              step={5}
              value={a.subLpfFreq}
              onChange={(e) => set("audio", { subLpfFreq: Number(e.target.value), crossover: Number(e.target.value) })}
            />
          </Row>
          <Row label="LPF Slope">
            <SlopeSelect value={a.subLpfSlope} onChange={(v) => set("audio", { subLpfSlope: v })} />
          </Row>
          <Row label="Sub Phase">
            <Toggle value={a.subPhase === "reverse"}
              onChange={(v) => set("audio", { subPhase: v ? "reverse" : "normal" })}
              labels={["Normal", "Reverse"]} />
          </Row>
        </div>
      </div>

      {/* Tone & Enhancers */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 text-xs uppercase tracking-widest text-primary">Tone Control</div>
          <Row label={`Bass (${a.bass > 0 ? "+" : ""}${a.bass} dB)`}>
            <input type="range" min={-6} max={6} step={1} value={a.bass}
              onChange={(e) => set("audio", { bass: Number(e.target.value) })} />
          </Row>
          <Row label={`Treble (${a.treble > 0 ? "+" : ""}${a.treble} dB)`}>
            <input type="range" min={-6} max={6} step={1} value={a.treble}
              onChange={(e) => set("audio", { treble: Number(e.target.value) })} />
          </Row>
          <Row label={`Bass Boost (+${a.bassBoost})`}>
            <input type="range" min={0} max={6} step={1} value={a.bassBoost}
              onChange={(e) => set("audio", { bassBoost: Number(e.target.value) })} />
          </Row>
          <Row label="Loudness">
            <Segmented
              value={a.loudness}
              options={["off", "low", "mid", "high"]}
              onChange={(v) => set("audio", { loudness: v as typeof a.loudness })}
            />
          </Row>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 text-xs uppercase tracking-widest text-primary">Sound Enhancers</div>
          <Row label="Sound Retriever">
            <Segmented
              value={a.soundRetriever}
              options={["off", "low", "high"]}
              onChange={(v) => set("audio", { soundRetriever: v as typeof a.soundRetriever })}
            />
          </Row>
          <Row label="Auto Level Control (ALC)">
            <Toggle value={a.alc} onChange={(v) => set("audio", { alc: v })} />
          </Row>
          <Row label={`Source Level Adj. (${a.sla > 0 ? "+" : ""}${a.sla} dB)`}>
            <input type="range" min={-8} max={8} step={1} value={a.sla}
              onChange={(e) => set("audio", { sla: Number(e.target.value) })} />
          </Row>
          <Row label={`Mute / Nav Attenuate (${Math.round(a.muteLevel * 100)}%)`}>
            <input type="range" min={0} max={1} step={0.05} value={a.muteLevel}
              onChange={(e) => set("audio", { muteLevel: Number(e.target.value) })} />
          </Row>
          <Row label="Beep Tone">
            <Toggle value={a.beep} onChange={(v) => set("audio", { beep: v })} />
          </Row>
        </div>
      </div>

      {/* Crossover Network */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 text-xs uppercase tracking-widest text-primary">HPF — Front</div>
          <Row label="Enabled">
            <Toggle value={a.hpfFrontOn} onChange={(v) => set("audio", { hpfFrontOn: v })} />
          </Row>
          <Row label={`Cutoff (${a.hpfFrontFreq} Hz)`}>
            <input type="range" min={50} max={200} step={5} value={a.hpfFrontFreq}
              onChange={(e) => set("audio", { hpfFrontFreq: Number(e.target.value) })} />
          </Row>
          <Row label="Slope">
            <SlopeSelect value={a.hpfFrontSlope} onChange={(v) => set("audio", { hpfFrontSlope: v })} />
          </Row>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 text-xs uppercase tracking-widest text-primary">HPF — Rear</div>
          <Row label="Enabled">
            <Toggle value={a.hpfRearOn} onChange={(v) => set("audio", { hpfRearOn: v })} />
          </Row>
          <Row label={`Cutoff (${a.hpfRearFreq} Hz)`}>
            <input type="range" min={50} max={200} step={5} value={a.hpfRearFreq}
              onChange={(e) => set("audio", { hpfRearFreq: Number(e.target.value) })} />
          </Row>
          <Row label="Slope">
            <SlopeSelect value={a.hpfRearSlope} onChange={(v) => set("audio", { hpfRearSlope: v })} />
          </Row>
        </div>
      </div>

      {/* Speaker Levels */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 text-xs uppercase tracking-widest text-primary">
          Speaker Levels (-24..+10 dB)
        </div>
        <div className="grid grid-cols-5 gap-3">
          {([
            ["FL", "spkFL"], ["FR", "spkFR"], ["RL", "spkRL"], ["RR", "spkRR"], ["SW", "spkSW"],
          ] as const).map(([lbl, key]) => (
            <div key={key} className="flex flex-col items-center gap-1">
              <span className="text-[10px] uppercase text-muted-foreground">{lbl}</span>
              <span className="text-xs tabular-nums text-foreground">
                {(a[key] as number) > 0 ? "+" : ""}{a[key]}
              </span>
              <input
                type="range" min={-24} max={10} step={1}
                value={a[key] as number}
                onChange={(e) => set("audio", { [key]: Number(e.target.value) } as Partial<typeof a>)}
                className="h-28"
                style={{ writingMode: "vertical-lr" as const, direction: "rtl" }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Time Alignment */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs uppercase tracking-widest text-primary">
            Time Alignment (cm) — distance from listening position
          </div>
          <Toggle value={a.taOn} onChange={(v) => set("audio", { taOn: v })} />
        </div>
        <Row label="Listening Position">
          <Segmented
            value={a.listenPosition}
            options={["off", "front-left", "front-right", "front", "all"]}
            onChange={(v) => set("audio", { listenPosition: v as typeof a.listenPosition })}
          />
        </Row>
        <div className="mt-3 grid grid-cols-5 gap-3">
          {([
            ["FL", "taFL"], ["FR", "taFR"], ["RL", "taRL"], ["RR", "taRR"], ["SW", "taSW"],
          ] as const).map(([lbl, key]) => (
            <div key={key} className="flex flex-col items-center gap-1">
              <span className="text-[10px] uppercase text-muted-foreground">{lbl}</span>
              <span className="text-xs tabular-nums text-foreground">{a[key]} cm</span>
              <input
                type="range" min={0} max={500} step={1}
                value={a[key] as number}
                onChange={(e) => set("audio", { [key]: Number(e.target.value) } as Partial<typeof a>)}
                disabled={!a.taOn}
                className="w-full"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => set("audio", {
          eq: PRESETS.Flat, preset: "Flat", bass: 0, treble: 0, bassBoost: 0, loudness: "off",
          fader: 0, balance: 0, subLevel: 0.5, subLpfFreq: 80, subLpfSlope: -12, subPhase: "normal",
          hpfFrontOn: false, hpfFrontFreq: 80, hpfFrontSlope: -12,
          hpfRearOn: false, hpfRearFreq: 80, hpfRearSlope: -12,
          spkFL: 0, spkFR: 0, spkRL: 0, spkRR: 0, spkSW: 0,
          taFL: 0, taFR: 0, taRL: 0, taRR: 0, taSW: 0, taOn: false, listenPosition: "off",
          soundRetriever: "off", alc: false, sla: 0,
        })}
        className="rounded-md border border-border bg-secondary px-3 py-1.5 text-xs uppercase tracking-wider"
      >
        Reset Audio
      </button>
    </div>
  );
}

function SlopeSelect({
  value, onChange,
}: { value: -6 | -12 | -18 | -24; onChange: (v: -6 | -12 | -18 | -24) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value) as -6 | -12 | -18 | -24)}
      className="rounded-md border border-border bg-secondary px-2 py-1 text-sm"
    >
      {SLOPES.map((s) => (
        <option key={s} value={s}>{s} dB/oct</option>
      ))}
    </select>
  );
}

function Segmented({
  value, options, onChange,
}: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex overflow-hidden rounded-md border border-border bg-secondary">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={cn(
            "px-2 py-1 text-[10px] font-bold uppercase tracking-wider",
            value === o ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function VideoPanel() {
  const { state, set } = usePioneer();
  const v = state.video;
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Video Adjustment</h2>
      <div className="rounded-xl border border-border bg-card p-4">
        <Row label={`Brightness (${v.brightness.toFixed(2)})`}>
          <input type="range" min={0} max={2} step={0.05} value={v.brightness}
            onChange={(e) => set("video", { brightness: Number(e.target.value) })} />
        </Row>
        <Row label={`Contrast (${v.contrast.toFixed(2)})`}>
          <input type="range" min={0} max={2} step={0.05} value={v.contrast}
            onChange={(e) => set("video", { contrast: Number(e.target.value) })} />
        </Row>
        <Row label={`Color / Saturation (${v.saturation.toFixed(2)})`}>
          <input type="range" min={0} max={2} step={0.05} value={v.saturation}
            onChange={(e) => set("video", { saturation: Number(e.target.value) })} />
        </Row>
        <Row label={`Hue (${v.hue}°)`}>
          <input type="range" min={-180} max={180} step={1} value={v.hue}
            onChange={(e) => set("video", { hue: Number(e.target.value) })} />
        </Row>
        <Row label="Aspect Ratio">
          <select
            value={v.aspect}
            onChange={(e) => set("video", { aspect: e.target.value as typeof v.aspect })}
            className="rounded-md border border-border bg-secondary px-2 py-1 text-sm"
          >
            <option value="fit">Fit (Letterbox)</option>
            <option value="fill">Fill (Crop)</option>
            <option value="stretch">Stretch</option>
            <option value="16:9">16:9</option>
            <option value="4:3">4:3</option>
          </select>
        </Row>
        <button
          onClick={() => set("video", { brightness: 1, contrast: 1, saturation: 1, hue: 0 })}
          className="mt-2 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs uppercase tracking-wider"
        >
          Reset Picture
        </button>
      </div>
    </div>
  );
}

function SystemPanel() {
  const { state, set, reloadTracks } = usePioneer();
  const s = state.system;
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">System</h2>
      <div className="rounded-xl border border-border bg-card p-4">
        <Row label="Language">
          <select
            value={s.language}
            onChange={(e) => set("system", { language: e.target.value })}
            className="rounded-md border border-border bg-secondary px-2 py-1 text-sm"
          >
            {["English", "हिन्दी", "தமிழ்", "Español", "Français", "Deutsch", "日本語"].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </Row>
        <Row label="Time Format">
          <Toggle
            value={s.use24h}
            onChange={(v) => set("system", { use24h: v })}
            labels={["12 H", "24 H"]}
          />
        </Row>
        <Row label="Wallpaper">
          <div className="flex gap-2">
            {Object.keys(WALLPAPERS).map((w) => (
              <button
                key={w}
                onClick={() => set("system", { wallpaper: w })}
                className={cn(
                  "h-10 w-14 rounded-md border-2",
                  s.wallpaper === w ? "border-primary" : "border-border"
                )}
                style={{ background: WALLPAPERS[w] }}
                title={w}
              />
            ))}
          </div>
        </Row>
        <Row label="Illumination Color">
          <div className="flex items-center gap-2">
            {["#28b6ff", "#ff3b3b", "#9b5cff", "#22c55e", "#facc15", "#ec4899"].map((c) => (
              <button
                key={c}
                onClick={() => set("system", { illumination: c })}
                className={cn(
                  "h-7 w-7 rounded-full border-2",
                  s.illumination === c ? "border-foreground" : "border-transparent"
                )}
                style={{ background: c }}
              />
            ))}
            <input
              type="color"
              value={s.illumination}
              onChange={(e) => set("system", { illumination: e.target.value })}
              className="h-7 w-10 rounded border border-border bg-transparent"
            />
          </div>
        </Row>
        <Row label="Video Library">
          <button
            onClick={reloadTracks}
            className="rounded-md bg-secondary px-3 py-1.5 text-xs uppercase tracking-wider"
          >
            Rescan
          </button>
          <button
            onClick={async () => {
              await clearDirHandle();
              location.reload();
            }}
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs uppercase tracking-wider text-destructive"
          >
            Forget Folder
          </button>
        </Row>
      </div>
    </div>
  );
}

function PlaybackPanel() {
  const { state, set } = usePioneer();
  const p = state.playback;
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Playback</h2>
      <div className="rounded-xl border border-border bg-card p-4">
        <Row label="Autoplay on Open">
          <Toggle value={p.autoplay} onChange={(v) => set("playback", { autoplay: v })} />
        </Row>
        <Row label="Resume on Boot">
          <Toggle
            value={p.resumeOnBoot}
            onChange={(v) => set("playback", { resumeOnBoot: v })}
          />
        </Row>
        <Row label="Shuffle">
          <Toggle value={p.shuffle} onChange={(v) => set("playback", { shuffle: v })} />
        </Row>
        <Row label="Repeat">
          <select
            value={p.repeat}
            onChange={(e) =>
              set("playback", { repeat: e.target.value as typeof p.repeat })
            }
            className="rounded-md border border-border bg-secondary px-2 py-1 text-sm"
          >
            <option value="off">Off</option>
            <option value="one">Repeat One</option>
            <option value="all">Repeat All</option>
          </select>
        </Row>
      </div>
    </div>
  );
}

function Toggle({
  value,
  onChange,
  labels = ["Off", "On"],
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  labels?: [string, string];
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={cn(
        "relative h-7 w-16 rounded-full border border-border text-[10px] font-bold uppercase",
        value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
      )}
    >
      <span className="absolute inset-0 flex items-center justify-center">
        {value ? labels[1] : labels[0]}
      </span>
    </button>
  );
}