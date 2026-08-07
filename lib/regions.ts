import { prisma } from "@/lib/prisma";

// Serializovaná oblast pro klienta.
export interface RegionDTO {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  centerLat: number;
  centerLng: number;
  defaultZoom: number;
  color: string | null;
  isPublished: boolean;
  pointCount: number;
}

/** Všechny oblasti (pro admina). */
export async function getAllRegions(): Promise<RegionDTO[]> {
  const regions = await prisma.region.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { points: true } } },
  });
  return regions.map(toDTO);
}

/** Jen zveřejněné oblasti (pro hráče). */
export async function getPublishedRegions(): Promise<RegionDTO[]> {
  const regions = await prisma.region.findMany({
    where: { isPublished: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { points: true } } },
  });
  return regions.map(toDTO);
}

function toDTO(r: {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  centerLat: number;
  centerLng: number;
  defaultZoom: number;
  color: string | null;
  isPublished: boolean;
  _count: { points: number };
}): RegionDTO {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    centerLat: r.centerLat,
    centerLng: r.centerLng,
    defaultZoom: r.defaultZoom,
    color: r.color,
    isPublished: r.isPublished,
    pointCount: r._count.points,
  };
}
