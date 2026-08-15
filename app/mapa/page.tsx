import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getVisiblePoints, getUserOptions } from "@/lib/points";
import { getAllRegions, getPublishedRegions } from "@/lib/regions";
import { getMapStyleUrl } from "@/lib/mapStyle";
import type { RegionOption } from "@/lib/mapPoints";
import { MapClient } from "@/components/map/MapClient";

export const metadata: Metadata = { title: "Mapa Skrytokraje" };

// Ochranu přihlášením řeší i proxy.ts, tady je pojistka + načtení dat.
export default async function MapPage() {
  const session = await auth();
  if (!session?.user) redirect("/prihlaseni");

  const isAdmin = session.user.role === "admin";
  const [points, users, regionDTOs] = await Promise.all([
    getVisiblePoints(session.user.id, session.user.email),
    getUserOptions(),
    // admin vidí i skryté oblasti (může do nich zařazovat), hráč jen zveřejněné
    isAdmin ? getAllRegions() : getPublishedRegions(),
  ]);

  const regions: RegionOption[] = regionDTOs.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    centerLat: r.centerLat,
    centerLng: r.centerLng,
    defaultZoom: r.defaultZoom,
    color: r.color,
  }));

  return (
    <div className="flex flex-1 flex-col">
      <MapClient
        initialPoints={points}
        users={users}
        regions={regions}
        currentUser={{ id: session.user.id, role: session.user.role }}
        mapStyleUrl={getMapStyleUrl()}
      />
    </div>
  );
}
