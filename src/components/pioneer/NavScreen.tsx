import { useState } from "react";
import { Map, ExternalLink, Navigation } from "lucide-react";

const PRESETS = [
  { label: "Current view", url: "https://embed.waze.com/iframe?zoom=12" },
  { label: "New York", url: "https://embed.waze.com/iframe?zoom=12&lat=40.7128&lon=-74.0060&pin=1" },
  { label: "London", url: "https://embed.waze.com/iframe?zoom=12&lat=51.5074&lon=-0.1278&pin=1" },
  { label: "Tokyo", url: "https://embed.waze.com/iframe?zoom=12&lat=35.6762&lon=139.6503&pin=1" },
];

export function NavScreen() {
  const [src, setSrc] = useState(PRESETS[0].url);

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex items-center justify-between rounded-xl border border-border bg-[var(--pioneer-bar)] px-3 py-2">
        <div className="flex items-center gap-2 text-primary">
          <Navigation className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-widest">Waze Navigation</span>
        </div>
        <div className="flex items-center gap-1">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setSrc(p.url)}
              className={`rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-wide ${
                src === p.url
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
          <a
            href="https://www.waze.com/live-map"
            target="_blank"
            rel="noreferrer"
            className="ml-1 rounded-md p-1 text-muted-foreground hover:text-primary"
            title="Open Waze in new tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
      <div className="relative flex-1 overflow-hidden rounded-xl border border-border bg-card">
        <iframe
          key={src}
          title="Waze"
          src={src}
          className="h-full w-full"
          allow="geolocation; fullscreen"
        />
        <div className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-[10px] uppercase tracking-widest text-primary">
          <Map className="h-3 w-3" /> Audio keeps playing in background
        </div>
      </div>
    </div>
  );
}