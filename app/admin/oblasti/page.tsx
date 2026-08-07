import type { Metadata } from "next";
import { getAllRegions } from "@/lib/regions";
import { RegionManager } from "@/components/admin/RegionManager";

export const metadata: Metadata = { title: "Oblasti · Správa" };

export default async function AdminRegionsPage() {
  const regions = await getAllRegions();
  return <RegionManager initial={regions} />;
}
