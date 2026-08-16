import type { NextConfig } from "next";

// Bezpečnostní hlavičky. Nastaveny v aplikaci (ne v nginxu, který spravuje jiné
// okno). CSP je záměrně mírnější u map/obrázků (mapové dlaždice z MapTiler /
// OpenFreeMap), ale drží strukturální ochrany (clickjacking, base/form injection).
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  // Next.js potřebuje inline bootstrap; MapLibre občas eval výrazů stylu
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  // mapové dlaždice a markery (různé HTTPS zdroje), data/blob pro ikony
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // MapLibre worker běží z blob URL
  "worker-src 'self' blob:",
  // načítání stylu/dlaždic mapy přes fetch/XHR (MapTiler, OpenFreeMap, …)
  "connect-src 'self' https:",
].join("; ");

const securityHeaders = [
  {
    // HSTS je dočasně VYPNUTÉ (max-age=0). Důvod: O2 „Ochrana" blokuje přes DNS
    // a s aktivním HSTS z toho prohlížeč udělá tvrdý blok bez možnosti pokračovat.
    // max-age=0 navíc řekne prohlížečům, aby si dříve uložené HSTS zapomněly.
    // Až bude doména u O2 přeřazena jako bezpečná (a nebude se přesměrovávat),
    // můžeme HSTS zase zapnout (max-age=31536000; includeSubDomains).
    key: "Strict-Transport-Security",
    value: "max-age=0",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    // geolokaci potřebujeme povolit (mapa), ostatní citlivé API vypnout
    key: "Permissions-Policy",
    value: "geolocation=(self), camera=(), microphone=(), payment=()",
  },
  { key: "Content-Security-Policy", value: CSP },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
