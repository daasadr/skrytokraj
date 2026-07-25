import { prisma } from "@/lib/prisma";
import type { MapPointTypeKey } from "@/lib/mapPoints";
import { MAP_POINT_TYPES } from "@/lib/mapPoints";

// Serializovaný bod posílaný klientovi (bez citlivých dat).
export interface MapPointDTO {
  id: string;
  type: MapPointTypeKey;
  name: string;
  description: string | null;
  lat: number;
  lng: number;
  visibility: "public" | "private_user";
  recipientId: string | null;
  arContent: string | null;
  createdById: string;
  createdByName: string;
  createdAt: string;
}

export interface UserOption {
  id: string;
  name: string;
}

/**
 * Vrátí body viditelné pro daného uživatele:
 *  - všechny veřejné (public)
 *  - soukromé (private_user) určené právě jemu
 *  - vlastní body (i soukromé, které sám založil)
 * Neaktivní body (isActive = false) se nevrací.
 */
export async function getVisiblePoints(userId: string): Promise<MapPointDTO[]> {
  const points = await prisma.mapPoint.findMany({
    where: {
      isActive: true,
      OR: [
        { visibility: "public" },
        { visibility: "private_user", recipientId: userId },
        { createdById: userId },
      ],
    },
    include: { createdBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return points.map((p) => ({
    id: p.id,
    type: p.type as MapPointTypeKey,
    name: p.name,
    description: p.description,
    lat: p.lat,
    lng: p.lng,
    visibility: p.visibility,
    recipientId: p.recipientId,
    arContent: p.arContent,
    createdById: p.createdById,
    createdByName: p.createdBy.name,
    createdAt: p.createdAt.toISOString(),
  }));
}

/** Seznam uživatelů pro výběr příjemce soukromé schránky (jen id + jméno). */
export async function getUserOptions(): Promise<UserOption[]> {
  return prisma.user.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

/** Ověří, že řetězec je platný klíč typu bodu. */
export function isMapPointType(value: unknown): value is MapPointTypeKey {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(MAP_POINT_TYPES, value)
  );
}
