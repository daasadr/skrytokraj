// Next.js 16: middleware bylo přejmenováno na "proxy" (funkce `proxy`).
// Auth.js `auth` funguje jako proxy handler — chráněné sekce vyžadují
// přihlášení (callback `authorized` v auth.ts). Nepřihlášený je přesměrován
// na /prihlaseni.
export { auth as proxy } from "@/auth";

export const config = {
  // Chráníme jen sekce, které to potřebují. Ostatní (úvod, přihlášení,
  // registrace, statické soubory) zůstávají veřejné.
  matcher: ["/mapa/:path*", "/admin/:path*"],
};
