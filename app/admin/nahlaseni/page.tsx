import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { reportCategoryLabel } from "@/lib/reports";
import { ReportsAdmin, type AdminReport } from "@/components/admin/ReportsAdmin";

export const metadata: Metadata = { title: "Nahlášení · Správa" };

// Nahlášené objekty vidí admin i s obsahem (i u soukromých) — přístup se
// zpřístupní teprve nahlášením. Viz podmínky použití.
export default async function AdminReportsPage() {
  const reports = await prisma.report.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "desc" },
    include: {
      reporter: { select: { name: true } },
      point: {
        include: {
          createdBy: {
            select: { id: true, name: true, email: true, isBlocked: true },
          },
        },
      },
    },
  });

  const data: AdminReport[] = reports.map((r) => ({
    id: r.id,
    category: reportCategoryLabel(r.category),
    message: r.message,
    createdAt: r.createdAt.toLocaleString("cs-CZ"),
    reporterName: r.reporter.name,
    point: {
      id: r.point.id,
      name: r.point.name,
      type: r.point.type,
      description: r.point.description,
      longDescription: r.point.longDescription,
      hint: r.point.hint,
      imageUrls: r.point.imageUrls,
      lat: r.point.lat,
      lng: r.point.lng,
      visibility: r.point.visibility,
      authorId: r.point.createdBy.id,
      authorName: r.point.createdBy.name,
      authorEmail: r.point.createdBy.email,
      authorBlocked: r.point.createdBy.isBlocked,
    },
  }));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-kraj-muted">
        Nahlášené objekty. U soukromých se obsah zpřístupnil až nahlášením. Objekty
        se špatným úmyslem smaž (online i v krajině) a případně zablokuj autora.
      </p>
      {data.length === 0 ? (
        <p className="rounded-xl border border-dashed border-kraj-border px-4 py-8 text-center text-kraj-muted">
          Žádná nevyřízená nahlášení. 🌿
        </p>
      ) : (
        <ReportsAdmin reports={data} />
      )}
    </div>
  );
}
