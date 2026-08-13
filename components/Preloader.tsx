"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "bombay-sweets-preloader-shown";
// The source clip is ~8s; play it back faster so the full logo reveal
// still plays out (forming -> resolved "The Bombay Sweets" mark) but
// within a shorter, less obstructive window. Verified end-to-end: mounts,
// plays at this rate, and dismisses itself on the video's natural "ended"
// event in ~3.9s.
const PLAYBACK_RATE = 2.1;
const FADE_MS = 500;
// Safety net in case the video fails to load/play for any reason --
// never leave a visitor staring at a stuck overlay.
const MAX_VISIBLE_MS = 6000;

/**
 * One-time (per browser session) full-screen logo reveal. Renders `true`
 * (visible) on both server and first client render so there's no flash of
 * page content before it -- then a mount effect hides it immediately if
 * this session has already seen it, or if the visitor prefers reduced
 * motion, before the video has any chance to start.
 */
export function Preloader() {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dismissedRef = useRef(false);

  function dismiss() {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    sessionStorage.setItem(STORAGE_KEY, "1");
    setExiting(true);
    window.setTimeout(() => setVisible(false), FADE_MS);
  }

  useEffect(() => {
    const alreadyShown = sessionStorage.getItem(STORAGE_KEY) === "1";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (alreadyShown || reducedMotion) {
      dismissedRef.current = true;
      sessionStorage.setItem(STORAGE_KEY, "1");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(false);
      return;
    }

    const video = videoRef.current;
    if (video) {
      video.playbackRate = PLAYBACK_RATE;
      video.addEventListener("error", dismiss);
      video.play().catch(dismiss);
    }

    const safetyTimer = window.setTimeout(dismiss, MAX_VISIBLE_MS);
    return () => {
      window.clearTimeout(safetyTimer);
      video?.removeEventListener("error", dismiss);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Skip intro"
      onClick={dismiss}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          dismiss();
        }
      }}
      className="fixed inset-0 z-[100] flex cursor-pointer items-center justify-center bg-cream transition-opacity duration-500"
      style={{ opacity: exiting ? 0 : 1 }}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        onEnded={dismiss}
        className="h-auto w-full max-w-[280px] lg:max-w-sm"
      >
        <source src="/videos/logo-reveal.mp4" type="video/mp4" />
      </video>
      <span className="absolute bottom-8 font-label text-[11px] uppercase tracking-[0.2em] text-ink/40">
        Skip
      </span>
    </div>
  );
}
