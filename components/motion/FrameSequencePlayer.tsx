"use client";

import { useEffect, useRef, type RefObject } from "react";

interface FrameSequencePlayerProps {
  frameSrc: (index: number) => string;
  frameCount: number;
  progressRef: RefObject<number>;
  className?: string;
}

/**
 * Canvas-based scroll-scrubbed image sequence player. Preloads every frame,
 * then on each animation frame draws whichever frame corresponds to the
 * current scroll progress (0-1, written into progressRef by a ScrollTrigger
 * elsewhere). Canvas + preloaded stills instead of a <video> element because
 * video.currentTime seeking is unreliable when scrubbed at scroll speed.
 */
export function FrameSequencePlayer({
  frameSrc,
  frameCount,
  progressRef,
  className,
}: FrameSequencePlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const lastDrawnIndex = useRef(-1);

  useEffect(() => {
    const images: HTMLImageElement[] = [];
    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.src = frameSrc(i);
      images.push(img);
    }
    imagesRef.current = images;
    lastDrawnIndex.current = -1;
  }, [frameSrc, frameCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    function resize() {
      if (!canvas || !parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      lastDrawnIndex.current = -1;
    }

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let raf: number;

    function tick() {
      const canvas = canvasRef.current;
      const images = imagesRef.current;
      const progress = progressRef.current ?? 0;

      if (canvas && images.length > 0) {
        const index = Math.min(
          images.length - 1,
          Math.max(0, Math.round(progress * (images.length - 1)))
        );

        if (index !== lastDrawnIndex.current) {
          const img = images[index];
          if (img.complete && img.naturalWidth > 0) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
              const canvasRatio = canvas.width / canvas.height;
              const imgRatio = img.naturalWidth / img.naturalHeight;
              let sx = 0;
              let sy = 0;
              let sWidth = img.naturalWidth;
              let sHeight = img.naturalHeight;

              if (imgRatio > canvasRatio) {
                sWidth = img.naturalHeight * canvasRatio;
                sx = (img.naturalWidth - sWidth) / 2;
              } else {
                sHeight = img.naturalWidth / canvasRatio;
                sy = (img.naturalHeight - sHeight) / 2;
              }

              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
              lastDrawnIndex.current = index;
            }
          }
        }
      }

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progressRef]);

  return <canvas ref={canvasRef} className={className} />;
}
