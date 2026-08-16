import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getVisiblePoint } from "@/lib/points";
import { MAP_POINT_TYPES } from "@/lib/mapPoints";
import { PhotoGallery } from "@/components/PhotoGallery";
import { PointDetailSolve } from "@/components/map/PointDetailSolve";
import { ReportButton } from "@/components/ReportButton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return { title: "Detail" };
  const point = await getVisiblePoint(
    id,
    session.user.id,
    session.user.email,
    session.user.role === "admin",
  );
  return { title: point ? point.name : "Detail" };
}

export default async function PointDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/prihlaseni");

  const point = await getVisiblePoint(
    id,
    session.user.id,
    session.user.email,
    session.user.role === "admin",
  );
  if (!point) notFound();

  const meta = MAP_POINT_TYPES[point.type];
  const created = new Date(point.createdAt).toLocaleDateString("cs-CZ");

  return (
    <article className="mx-auto w-full max-w-2xl px-5 py-8">
      <Link
        href="/mapa"
        className="text-sm text-kraj-muted hover:text-kraj-fg"
      >
        ← Zpět na mapu
      </Link>

      <div className="mt-4 flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-black"
          style={{ backgroundColor: meta.color }}
        >
          {meta.emoji} {meta.label}
        </span>
        {point.forMe && (
          <span className="text-xs font-medium text-kraj-gold">
            🎁 Jen pro tebe
          </span>
        )}
      </div>

      <h1 className="mt-2 text-3xl font-semibold">{point.name}</h1>

      {point.imageUrls.length > 0 && (
        <div className="mt-4">
          <PhotoGallery urls={point.imageUrls} thumb="h-24 w-24" />
        </div>
      )}

      {point.description && (
        <p className="mt-5 whitespace-pre-wrap leading-relaxed text-kraj-fg">
          {point.description}
        </p>
      )}

      {point.longDescription && (
        <div className="mt-5 whitespace-pre-wrap leading-relaxed text-kraj-muted">
          {point.longDescription}
        </div>
      )}

      {point.hint && (
        <div className="mt-5 rounded-lg border border-kraj-border bg-kraj-bg2 px-4 py-3">
          <span className="text-sm text-kraj-mist">Nápověda: </span>
          <span className="whitespace-pre-wrap text-sm text-kraj-fg">
            {point.hint}
          </span>
        </div>
      )}

      {point.hasAnswer && (
        <div className="mt-6 rounded-lg border border-kraj-border bg-kraj-bg2 px-4 py-3">
          <PointDetailSolve pointId={point.id} solved={point.solved} />
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-x-4 gap-y-1 border-t border-kraj-border pt-4 text-xs text-kraj-muted">
        <span>Založil: {point.createdByName}</span>
        <span>{created}</span>
        {point.regionName && <span>Oblast: {point.regionName}</span>}
        <span>
          {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
        </span>
      </div>

      <div className="mt-4">
        <ReportButton pointId={point.id} pointName={point.name} />
      </div>
    </article>
  );
}
