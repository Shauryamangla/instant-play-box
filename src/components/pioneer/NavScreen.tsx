import { useState } from "react";
import { Navigation, MapPin, Search, Home, Briefcase, ExternalLink } from "lucide-react";

type Preset = { label: string; query?: string; ll?: string; icon: React.ComponentType<{ className?: string }> };

const PRESETS: Preset[] = [
  { label: "Home", icon: Home },
  { label: "Work", icon: Briefcase },
  { label: "Nearby gas", query: "gas station", icon: MapPin },
  { label: "Parking", query: "parking", icon: MapPin },
];

/**
 * Build a Waze deep-link. On Android the OS resolves these to the installed
 * Waze app (intent), otherwise it falls back to the Waze website.
 * Docs: https://developers.google.com/waze/deeplinks
 */
function wazeUrl(opts: { q?: string; ll?: string; navigate?: boolean }) {
  const params = new URLSearchParams();
  if (opts.ll) params.set("ll", opts.ll);
  if (opts.q) params.set("q", opts.q);
  if (opts.navigate) params.set("navigate", "yes");
  return `https://waze.com/ul?${params.toString()}`;
}

function openWaze(url: string) {
  // Use an explicit anchor click so Android's intent handler picks the
  // installed Waze app instead of staying inside the WebView.
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function NavScreen() {
  const [q, setQ] = useState("");

  const go = (preset: Preset) => {
    const url = wazeUrl({ q: preset.query ?? preset.label, navigate: true });
    openWaze(url);
  };

  const search = () => {
    if (!q.trim()) return;
    openWaze(wazeUrl({ q: q.trim(), navigate: true }));
  };

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between rounded-xl border border-border bg-[var(--pioneer-bar)] px-3 py-2">
        <div className="flex items-center gap-2 text-primary">
          <Navigation className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-widest">Waze Navigation</span>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Music keeps playing
        </span>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Open in Waze
        </div>
        <div className="mt-1 text-lg font-semibold text-foreground">
          Launch the installed Waze app
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Tap a destination — your AI Box will hand off to the Waze application
          installed on your Android system. Audio playback continues in the
          background.
        </p>

        <div className="mt-4 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="Search destination…"
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button
            onClick={search}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-widest text-primary-foreground"
          >
            Go
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {PRESETS.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.label}
              onClick={() => go(p)}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 text-left hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="rounded-lg bg-primary/15 p-2 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{p.label}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Open in Waze
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => openWaze("https://waze.com/ul")}
        className="mt-auto flex items-center justify-center gap-2 rounded-xl border border-border bg-[var(--pioneer-bar)] px-4 py-3 text-xs font-semibold uppercase tracking-widest text-primary"
      >
        <ExternalLink className="h-4 w-4" /> Launch Waze
      </button>
    </div>
  );
}