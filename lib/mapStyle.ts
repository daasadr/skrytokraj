// Výběr mapového podkladu (MapLibre style URL).
// - je-li nastaven NEXT_PUBLIC_MAPTILER_KEY → hezký outdoor styl z MapTiler
// - jinak fallback na OpenFreeMap (bez klíče, bez registrace)
// Díky tomu mapa funguje hned, i než si autorka pořídí MapTiler klíč.

const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export function getMapStyleUrl(): string {
  const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  if (key && key.length > 0) {
    return `https://api.maptiler.com/maps/outdoor/style.json?key=${key}`;
  }
  return OPENFREEMAP_STYLE;
}
