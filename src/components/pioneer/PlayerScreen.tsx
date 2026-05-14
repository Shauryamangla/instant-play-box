import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle, FolderOpen, List } from "lucide-react";
import { usePioneer } from "@/lib/pioneer-store";

export function PlayerScreen() {
  const {
    current,
    tracks,
    next,
    prev,
    state,
    set,
    pickFolder,
    hasFolder,
    videoRef,
    currentIndex,
    setCurrentIndex,
    setVideoSlot,
  } = usePioneer();
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState({ t: 0, d: 0 });
  const slotRef = useRef<HTMLDivElement | null>(null);

  // Hand the slot element to the persistent video overlay.
  useEffect(() => {
    setVideoSlot(slotRef.current);
    return () => setVideoSlot(null);
  }, [setVideoSlot]);

  // Drive UI state from the shared video element.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () =>
      setProgress({ t: v.currentTime, d: v.duration || 0 });
    setPlaying(!v.paused);
    setProgress({ t: v.currentTime, d: v.duration || 0 });
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", onTime);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("timeupdate", onTime);
    };
  }, [videoRef, current?.url]);

  const fmt = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
  };

  return (
    <div className="grid h-full grid-cols-[1fr_280px] gap-3 p-3">
      <div className="flex flex-col rounded-xl border border-border bg-black">
        <div
          ref={slotRef}
          className="relative flex-1 overflow-hidden rounded-t-xl"
        >
          {!current && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <FolderOpen className="h-12 w-12 text-primary" />
              <div>{hasFolder ? "No videos in folder" : "No folder selected"}</div>
              <button
                onClick={pickFolder}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Choose folder
              </button>
            </div>
          )}
        </div>
        <div className="space-y-2 rounded-b-xl bg-[var(--pioneer-bar)] px-4 py-3">
          <div className="flex items-center gap-3 text-xs tabular-nums text-muted-foreground">
            <span>{fmt(progress.t)}</span>
            <input
              type="range"
              min={0}
              max={progress.d || 0}
              step={0.1}
              value={progress.t}
              onChange={(e) => {
                const v = videoRef.current;
                if (v) v.currentTime = Number(e.target.value);
              }}
              className="flex-1 accent-[var(--primary)]"
            />
            <span>{fmt(progress.d)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="truncate text-sm font-medium text-foreground">
              {current?.name ?? "—"}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  set("playback", { shuffle: !state.playback.shuffle })
                }
                className={`rounded-md p-2 ${state.playback.shuffle ? "text-primary" : "text-muted-foreground"}`}
              >
                <Shuffle className="h-4 w-4" />
              </button>
              <button onClick={prev} className="rounded-md p-2 hover:bg-secondary">
                <SkipBack className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  const v = videoRef.current;
                  if (!v) return;
                  v.paused ? v.play() : v.pause();
                }}
                className="rounded-full bg-primary p-3 text-primary-foreground shadow-[var(--pioneer-glow)]"
              >
                {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
              <button onClick={next} className="rounded-md p-2 hover:bg-secondary">
                <SkipForward className="h-5 w-5" />
              </button>
              <button
                onClick={() =>
                  set("playback", {
                    repeat:
                      state.playback.repeat === "off"
                        ? "all"
                        : state.playback.repeat === "all"
                          ? "one"
                          : "off",
                  })
                }
                className={`rounded-md p-2 ${state.playback.repeat !== "off" ? "text-primary" : "text-muted-foreground"}`}
              >
                {state.playback.repeat === "one" ? (
                  <Repeat1 className="h-4 w-4" />
                ) : (
                  <Repeat className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={pickFolder}
                className="rounded-md p-2 hover:bg-secondary"
                title="Library"
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-widest text-primary">
          Library
          <button onClick={pickFolder} className="text-muted-foreground hover:text-foreground">
            <FolderOpen className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          {tracks.length === 0 ? (
            <div className="p-3 text-xs text-muted-foreground">No tracks</div>
          ) : (
            <ul className="text-sm">
              {tracks.map((t, i) => (
                <li key={t.path}>
                  <button
                    onClick={() => setCurrentIndex(i)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left ${
                      i === currentIndex
                        ? "bg-primary/15 text-primary"
                        : "text-foreground hover:bg-secondary"
                    }`}
                  >
                    <span className="w-6 text-xs tabular-nums text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="truncate">{t.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}