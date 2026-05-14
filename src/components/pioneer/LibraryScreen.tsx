import { Shuffle, Play, FolderOpen, Music as MusicIcon } from "lucide-react";
import { usePioneer } from "@/lib/pioneer-store";
import type { Screen } from "./screens";

export function LibraryScreen({ onOpen }: { onOpen: (s: Screen) => void }) {
  const { tracks, currentIndex, setCurrentIndex, current, pickFolder, hasFolder, state, set } =
    usePioneer();

  const playIndex = (i: number) => {
    setCurrentIndex(i);
    onOpen("video");
  };

  const shufflePlay = () => {
    if (!tracks.length) return;
    set("playback", { shuffle: true });
    setCurrentIndex(Math.floor(Math.random() * tracks.length));
    onOpen("video");
  };

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <div className="flex items-center justify-between rounded-xl border border-border bg-[var(--pioneer-bar)] px-4 py-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-primary">Track Library</div>
          <div className="text-lg font-semibold text-foreground">
            {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={shufflePlay}
            disabled={!tracks.length}
            className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--pioneer-glow)] disabled:opacity-50"
          >
            <Shuffle className="h-4 w-4" /> Shuffle Play
          </button>
          <button
            onClick={() =>
              set("playback", { shuffle: !state.playback.shuffle })
            }
            className={`rounded-md border border-border px-3 py-2 text-xs font-medium uppercase tracking-wide ${
              state.playback.shuffle ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Shuffle: {state.playback.shuffle ? "On" : "Off"}
          </button>
          <button
            onClick={pickFolder}
            className="rounded-md border border-border p-2 text-muted-foreground hover:text-foreground"
            title="Choose folder"
          >
            <FolderOpen className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-border bg-card">
        {tracks.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
            <MusicIcon className="h-10 w-10 text-primary" />
            <div className="text-sm">
              {hasFolder ? "No videos in selected folder" : "No folder selected yet"}
            </div>
            <button
              onClick={pickFolder}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Choose folder
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {tracks.map((t, i) => {
              const active = i === currentIndex && current?.path === t.path;
              return (
                <li key={t.path}>
                  <button
                    onClick={() => playIndex(i)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                      active
                        ? "bg-primary/15 text-primary"
                        : "text-foreground hover:bg-secondary"
                    }`}
                  >
                    <span className="w-8 text-xs tabular-nums text-muted-foreground">
                      {(i + 1).toString().padStart(2, "0")}
                    </span>
                    <Play className="h-3.5 w-3.5 opacity-70" />
                    <span className="flex-1 truncate text-sm">
                      {t.name.replace(/\.[^.]+$/, "")}
                    </span>
                    <span className="hidden text-[10px] uppercase tracking-widest text-muted-foreground sm:inline">
                      {t.name.split(".").pop()}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}