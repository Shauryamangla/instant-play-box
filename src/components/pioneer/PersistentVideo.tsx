import { useEffect, useState, type CSSProperties } from "react";
import { usePioneer } from "@/lib/pioneer-store";
import { attachEq } from "@/lib/eq";

export function PersistentVideo() {
  const { current, videoRef, state, videoSlot, next, set } = usePioneer();
  const [rect, setRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  useEffect(() => {
    if (!videoSlot) {
      setRect(null);
      return;
    }
    const update = () => {
      const r = videoSlot.getBoundingClientRect();
      setRect({ x: r.left, y: r.top, w: r.width, h: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(videoSlot);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [videoSlot]);

  // Wire EQ + persistence + autoplay (lives outside any screen so it
  // survives navigation between Player, Nav, Settings, etc).
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    try {
      attachEq(v);
    } catch {
      /* user gesture needed */
    }
    const onTime = () => {
      if (current) set("resume", { path: current.path, time: v.currentTime });
    };
    const onEnded = () => {
      // Track finished — clear resume so next boot starts fresh on the next track.
      set("resume", { path: null, time: 0 });
      if (state.playback.repeat === "one") {
        v.currentTime = 0;
        v.play();
      } else {
        next();
      }
    };
    const onPause = () => {
      if (current && v.currentTime > 0) {
        set("resume", { path: current.path, time: v.currentTime });
      }
    };
    const saveNow = () => {
      if (current && v.currentTime > 0) {
        set("resume", { path: current.path, time: v.currentTime });
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") saveNow();
    };
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnded);
    v.addEventListener("pause", onPause);
    window.addEventListener("pagehide", saveNow);
    window.addEventListener("beforeunload", saveNow);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("pause", onPause);
      window.removeEventListener("pagehide", saveNow);
      window.removeEventListener("beforeunload", saveNow);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [current, next, set, state.playback.repeat, videoRef]);

  // Autoplay + resume position on track change
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !current) return;
    const shouldResume =
      state.playback.resumeOnBoot &&
      state.resume.path === current.path &&
      state.resume.time > 0;
    if (shouldResume) {
      const onLoaded = () => {
        v.currentTime = state.resume.time;
        v.removeEventListener("loadedmetadata", onLoaded);
      };
      v.addEventListener("loadedmetadata", onLoaded);
    }
    if (state.playback.autoplay) {
      v.play().catch(() => {
        v.muted = true;
        v.play().catch(() => undefined);
      });
    }
    try {
      attachEq(v).ctx.resume();
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.url]);

  // Apply audio graph
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    let g;
    try {
      g = attachEq(v);
    } catch {
      return;
    }
    state.audio.eq.forEach((db, i) => {
      if (g!.filters[i]) g!.filters[i].gain.value = db;
    });
    g.balance.pan.value = state.audio.balance;
    g.gain.gain.value = state.audio.volume;
    g.sub.type = state.audio.subOn ? "lowpass" : "allpass";
    g.sub.frequency.value = state.audio.crossover;
    v.volume = 1;
  }, [state.audio, videoRef]);

  const filter = `brightness(${state.video.brightness}) contrast(${state.video.contrast}) saturate(${state.video.saturation}) hue-rotate(${state.video.hue}deg)`;
  const objectFit: CSSProperties["objectFit"] =
    state.video.aspect === "fill"
      ? "cover"
      : state.video.aspect === "stretch"
        ? "fill"
        : "contain";

  const style: CSSProperties = rect
    ? {
        position: "fixed",
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        zIndex: 5,
        background: "#000",
        filter,
        objectFit,
      }
    : {
        position: "fixed",
        left: 0,
        top: 0,
        width: 1,
        height: 1,
        opacity: 0,
        pointerEvents: "none",
        zIndex: -1,
      };

  return (
    <video
      ref={videoRef}
      src={current?.url}
      style={style}
      playsInline
      onClick={() => {
        const v = videoRef.current!;
        if (!v) return;
        v.paused ? v.play() : v.pause();
      }}
    />
  );
}