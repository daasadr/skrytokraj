import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getVisiblePoints, getUserOptions } from "@/lib/points";
import { getMapStyleUrl } from "@/lib/mapStyle";
import { MapClient } from "@/components/map/MapClient";

export const metadata: Metadata = { title: "Mapa Skrytokraje" };

// Ochranu přihlášením řeší i proxy.ts, tady je pojistka + načtení dat.
export default async function MapPage() {
  const session = await auth();
  if (!session?.user) redirect("/prihlaseni");

  const [points, users] = await Promise.all([
    getVisiblePoints(session.user.id),
    getUserOptions(),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <MapClient
        initialPoints={points}
        users={users}
        currentUser={{ id: session.user.id, role: session.user.role }}
        mapStyleUrl={getMapStyleUrl()}
      />
    </div>
  );
}
