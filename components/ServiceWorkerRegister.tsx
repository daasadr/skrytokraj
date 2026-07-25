"use client";

import { useEffect } from "react";

// Registrace service workeru pro PWA (přidání na plochu, offline shell).
// Service worker je záměrně jednoduchý (viz public/sw.js) — plná offline
// strategie přijde v pozdější fázi.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // v dev módu SW neregistrujeme, ať nekešuje během vývoje
    if (process.env.NODE_ENV !== "production") return;

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Registrace service workeru selhala:", err);
      });
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
