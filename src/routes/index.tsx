import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PioneerProvider, usePioneer } from "@/lib/pioneer-store";
import { StatusBar } from "@/components/pioneer/StatusBar";
import { SourceBar } from "@/components/pioneer/SourceBar";
import { HomeScreen } from "@/components/pioneer/HomeScreen";
import { PlayerScreen } from "@/components/pioneer/PlayerScreen";
import { SettingsScreen } from "@/components/pioneer/SettingsScreen";
import { NavScreen } from "@/components/pioneer/NavScreen";
import { MusicScreen } from "@/components/pioneer/MusicScreen";
import { PersistentVideo } from "@/components/pioneer/PersistentVideo";
import type { Screen } from "@/components/pioneer/screens";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Pioneer DMH-Z5290BT • Local Video Player" },
      {
        name: "description",
        content:
          "Pioneer-styled local video song player for Android AI Box. Autoplay on open, EQ, audio & video config.",
      },
    ],
  }),
});

function Index() {
  return (
    <PioneerProvider>
      <Shell />
    </PioneerProvider>
  );
}

const WALLPAPERS: Record<string, string> = {
  aurora:
    "radial-gradient(ellipse at top, oklch(0.35 0.12 230 / 0.6), transparent 60%), linear-gradient(180deg, oklch(0.16 0.02 250), oklch(0.1 0.02 260))",
  carbon:
    "repeating-linear-gradient(45deg, oklch(0.18 0.02 260) 0 6px, oklch(0.16 0.02 260) 6px 12px)",
  ember:
    "radial-gradient(ellipse at bottom, oklch(0.4 0.18 30 / 0.5), transparent 60%), linear-gradient(180deg, oklch(0.14 0.02 260), oklch(0.08 0.02 260))",
  city: "linear-gradient(180deg, oklch(0.2 0.05 270), oklch(0.12 0.04 260))",
};

function Shell() {
  const { state } = usePioneer();
  const [screen, setScreen] = useState<Screen>("home");
  return (
    <div
      className="flex h-screen w-full flex-col text-foreground"
      style={{ background: WALLPAPERS[state.system.wallpaper] ?? WALLPAPERS.aurora }}
    >
      <StatusBar />
      <main className="min-h-0 flex-1">
        {screen === "home" && <HomeScreen onOpen={setScreen} />}
        {screen === "video" && <PlayerScreen />}
        {screen === "music" && <MusicScreen onOpen={setScreen} />}
        {screen === "audio" && <SettingsScreen initialTab="audio" />}
        {screen === "settings" && <SettingsScreen initialTab="system" />}
        {screen === "nav" && <NavScreen />}
        {(screen === "radio" || screen === "phone") && (
          <SourcePlaceholder name={screen} />
        )}
      </main>
      <SourceBar current={screen} onChange={setScreen} />
      <PersistentVideo />
    </div>
  );
}

function SourcePlaceholder({ name }: { name: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="rounded-xl border border-border bg-card px-8 py-6 text-center">
        <div className="text-xs uppercase tracking-widest text-primary">{name}</div>
        <div className="mt-1 text-lg font-semibold text-foreground">
          Source not connected
        </div>
        <div className="mt-1 text-sm text-muted-foreground">
          This panel is reserved for the AI Box hardware integration.
        </div>
      </div>
    </div>
  );
}
