// Sdílená metadata typů bodů na mapě — používá je server i klient.
// Klíče musí odpovídat enumu MapPointType v prisma/schema.prisma.

export type MapPointTypeKey =
  | "quest"
  | "treasure"
  | "story_location"
  | "ar_location"
  | "message_box";

export interface MapPointTypeMeta {
  label: string;
  /** barva markeru / odznaku podle typu */
  color: string;
  /** jednoduchá ikona (placeholder, finální grafika přijde později) */
  emoji: string;
  /** true = smí zakládat jen admin */
  adminOnly: boolean;
  /** true = jde nasdílet buď veřejně, nebo jen konkrétnímu uživateli */
  shareable: boolean;
}

export const MAP_POINT_TYPES: Record<MapPointTypeKey, MapPointTypeMeta> = {
  quest: {
    label: "Úkol",
    color: "#7fb3ff",
    emoji: "❓",
    adminOnly: true,
    shareable: false,
  },
  // Poklad může zakládat i běžný uživatel a sdílet ho veřejně / konkrétní osobě.
  treasure: {
    label: "Poklad",
    color: "#e9c46a",
    emoji: "⭐",
    adminOnly: false,
    shareable: true,
  },
  story_location: {
    label: "Příběhové místo",
    color: "#c58cff",
    emoji: "📖",
    adminOnly: true,
    shareable: false,
  },
  ar_location: {
    label: "AR místo",
    color: "#5ad1c0",
    emoji: "✨",
    adminOnly: true,
    shareable: false,
  },
  message_box: {
    label: "Schránka se vzkazem",
    color: "#e0855b",
    emoji: "✉️",
    adminOnly: false,
    shareable: true,
  },
};

const ALL_TYPES = Object.keys(MAP_POINT_TYPES) as MapPointTypeKey[];

/** Typy, které na mapě zakládá jen admin (úkol, příběhové/AR místo). */
export const ADMIN_POINT_TYPES = ALL_TYPES.filter(
  (k) => MAP_POINT_TYPES[k].adminOnly,
);

/** Typy, které smí zakládat i běžný uživatel (schránka, poklad). */
export const USER_POINT_TYPES = ALL_TYPES.filter(
  (k) => !MAP_POINT_TYPES[k].adminOnly,
);

// Výchozí střed mapy — Petřvald na Novojičínsku.
export const DEFAULT_MAP_CENTER = {
  longitude: 18.1667,
  latitude: 49.755,
  zoom: 12.5,
};

// Oblast (kraj) pro použití v klientských komponentách mapy (client-safe,
// bez serverových importů).
export interface RegionOption {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  centerLat: number;
  centerLng: number;
  defaultZoom: number;
  color: string | null;
}
