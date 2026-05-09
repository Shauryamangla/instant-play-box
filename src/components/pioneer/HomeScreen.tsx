import { Film, Sliders, Settings as SettingsIcon, Music, Radio, Phone, Map, FolderOpen } from "lucide-react";
import { usePioneer } from "@/lib/pioneer-store";
import type { Screen } from "./screens";

const tiles: { id: Screen; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "video", label: "Video", icon: Film },
  { id: "music", label: "Music", icon: Music },
  { id: "radio", label: "Radio", icon: Radio },
  { id: "phone", label: "Phone", icon: Phone },
  { id: "nav", label: "Navigation", icon: Map },
  { id: "audio", label: "Audio", icon: Sliders },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export function HomeScreen({ onOpen }: { onOpen: (s: Screen) => void }) {
  const { current, tracks, hasFolder, pickFolder } = usePioneer();
  return (
    <div className="grid h-full grid-cols-[1.2fr_1fr] gap-4 p-4">
      <div className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-[var(--pioneer-glow)]">
        <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
          Now Playing
        </div>
        {current ? (
          <>
            <div className="line-clamp-2 text-2xl font-semibold text-foreground">
              {current.name.replace(/\.[^.]+$/, "")}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{current.path}</div>
            <button
              onClick={() => onOpen("video")}
              className="mt-4 self-start rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Open Player
            </button>
            <div className="mt-auto text-xs text-muted-foreground">
              {tracks.length} videos in library
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <FolderOpen className="h-10 w-10 text-primary" />
            <div className="text-sm text-muted-foreground">
              {hasFolder ? "No videos found in selected folder" : "Choose a folder to start"}
            </div>
            <button
              onClick={pickFolder}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Select videos folder
            </button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => onOpen(t.id)}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border p-3 text-xs font-medium uppercase tracking-wide text-foreground transition-all hover:border-primary hover:text-primary"
              style={{ background: "var(--pioneer-tile)" }}
            >
              <Icon className="h-7 w-7 text-primary" />
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}