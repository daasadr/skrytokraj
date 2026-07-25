"use client";

import { useState } from "react";
import { MAP_POINT_TYPES, type MapPointTypeKey } from "@/lib/mapPoints";

// Legenda typů bodů (rozbalovací, ať na mobilu nezabírá místo).
export function MapLegend() {
  const [open, setOpen] = useState(false);
  const keys = Object.keys(MAP_POINT_TYPES) as MapPointTypeKey[];

  return (
    <div className="rounded-xl border border-kraj-border bg-kraj-bg/85 text-sm backdrop-blur">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-kraj-muted"
      >
        <span>Legenda</span>
        <span className="ml-auto text-xs">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <ul className="flex flex-col gap-1.5 px-3 pb-3">
          {keys.map((k) => (
            <li key={k} className="flex items-center gap-2">
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px]"
                style={{ backgroundColor: MAP_POINT_TYPES[k].color }}
              >
                {MAP_POINT_TYPES[k].emoji}
              </span>
              <span className="text-kraj-fg">{MAP_POINT_TYPES[k].label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
