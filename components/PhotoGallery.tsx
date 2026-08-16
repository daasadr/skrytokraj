"use client";

import { useEffect, useState } from "react";

// Galerie fotek s prohlížečem přes celou obrazovku: klik otevře fotku v appce,
// šipky/švihnutí přepínají, a zpětné tlačítko telefonu zavře jen prohlížeč
// (ne appku) — díky vloženému stavu do historie.
export function PhotoGallery({
  urls,
  thumb = "h-16 w-16",
}: {
  urls: string[];
  thumb?: string;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const [touchX, setTouchX] = useState<number | null>(null);
  const open = index !== null;

  useEffect(() => {
    if (!open) return;
    window.history.pushState({ photoLightbox: true }, "");
    const onPop = () => setIndex(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") window.history.back();
      else if (e.key === "ArrowRight")
        setIndex((i) => (i === null ? i : Math.min(urls.length - 1, i + 1)));
      else if (e.key === "ArrowLeft")
        setIndex((i) => (i === null ? i : Math.max(0, i - 1)));
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, urls.length]);

  if (urls.length === 0) return null;

  const close = () => window.history.back();
  const prev = () =>
    setIndex((i) => (i === null ? i : Math.max(0, i - 1)));
  const next = () =>
    setIndex((i) => (i === null ? i : Math.min(urls.length - 1, i + 1)));

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {urls.map((url, i) => (
          <button key={url} type="button" onClick={() => setIndex(i)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt="fotka bodu"
              className={`${thumb} rounded-md border border-kraj-border object-cover`}
            />
          </button>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={close}
          onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX === null) return;
            const dx = e.changedTouches[0].clientX - touchX;
            if (dx > 40) prev();
            else if (dx < -40) next();
            setTouchX(null);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={urls[index]}
            alt="fotka bodu"
            className="max-h-[88vh] max-w-[92vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            type="button"
            onClick={close}
            aria-label="Zavřít"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-xl text-white"
          >
            ×
          </button>

          {urls.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                disabled={index === 0}
                aria-label="Předchozí"
                className="absolute left-2 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-2xl text-white disabled:opacity-30"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                disabled={index === urls.length - 1}
                aria-label="Další"
                className="absolute right-2 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-2xl text-white disabled:opacity-30"
              >
                ›
              </button>
              <span className="absolute bottom-3 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
                {index + 1} / {urls.length}
              </span>
            </>
          )}
        </div>
      )}
    </>
  );
}
