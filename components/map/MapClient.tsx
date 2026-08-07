"use client";

import dynamic from "next/dynamic";
import type { MapPointDTO, UserOption } from "@/lib/points";
import type { RegionOption } from "@/lib/mapPoints";

// MapView načítáme dynamicky bez SSR — mapbox-gl potřebuje `window`.
const MapView = dynamic(
  () => import("./MapView").then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 items-center justify-center text-kraj-muted">
        Načítám mapu…
      </div>
    ),
  },
);

interface MapClientProps {
  initialPoints: MapPointDTO[];
  users: UserOption[];
  regions: RegionOption[];
  currentUser: { id: string; role: "admin" | "user" };
  mapStyleUrl: string;
}

export function MapClient(props: MapClientProps) {
  return <MapView {...props} />;
}
