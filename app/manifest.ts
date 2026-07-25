import type { MetadataRoute } from "next";

// PWA manifest — umožňuje přidat Skrytokraj na plochu telefonu.
// TODO (pozdější fáze): doplnit rastrové ikony 192/512 px (maskable) a
// apple-touch-icon; zatím používáme SVG placeholder.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Skrytokraj",
    short_name: "Skrytokraj",
    description:
      "Hra na pomezí krajiny a příběhu — hledej skuliny, plň úkoly a piš kroniku skrytého kraje.",
    lang: "cs",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f1512",
    theme_color: "#0f1512",
    categories: ["games", "entertainment", "navigation"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
