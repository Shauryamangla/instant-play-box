import { Home, Music, Film, Sliders, Settings, Phone, Radio, Map } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Screen } from "./screens";

const items: { id: Screen; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "video", label: "Video", icon: Film },
  { id: "audio", label: "Audio", icon: Sliders },
  { id: "radio", label: "Radio", icon: Radio },
  { id: "phone", label: "Phone", icon: Phone },
  { id: "nav", label: "Nav", icon: Map },
  { id: "music", label: "Music", icon: Music },
  { id: "settings", label: "Settings", icon: Settings },
];

export function SourceBar({
  current,
  onChange,
}: {
  current: Screen;
  onChange: (s: Screen) => void;
}) {
  return (
    <div className="flex h-16 items-center gap-1 border-t border-border bg-[var(--pioneer-bar)] px-2">
      {items.map((it) => {
        const Icon = it.icon;
        const active = current === it.id;
        return (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            className={cn(
              "flex h-12 flex-1 flex-col items-center justify-center rounded-md text-[10px] font-medium uppercase tracking-wide transition-all",
              active
                ? "bg-primary/15 text-primary shadow-[inset_0_-2px_0_0_var(--primary)]"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Icon className="mb-0.5 h-5 w-5" />
            {it.label}
          </button>
        );
      })}
    </div>
  );
}