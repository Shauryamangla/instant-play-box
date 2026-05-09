import { useEffect, useState } from "react";
import { usePioneer } from "@/lib/pioneer-store";
import { Wifi, Bluetooth, Signal } from "lucide-react";

export function StatusBar() {
  const { state } = usePioneer();
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const time = state.system.use24h
    ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
    : now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  return (
    <div className="flex h-7 items-center justify-between bg-[var(--pioneer-bar)] px-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <span className="font-semibold tracking-widest text-primary">PIONEER</span>
        <span className="opacity-70">DMH-Z5290BT</span>
      </div>
      <div className="flex items-center gap-3">
        <Bluetooth className="h-3.5 w-3.5" />
        <Wifi className="h-3.5 w-3.5" />
        <Signal className="h-3.5 w-3.5" />
        <span className="tabular-nums">{time}</span>
      </div>
    </div>
  );
}