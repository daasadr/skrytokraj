"use client";

import { useCallback, useRef, useState } from "react";
import Map, {
  Marker,
  Popup,
  GeolocateControl,
  NavigationControl,
} from "react-map-gl/maplibre";
import type { MapMouseEvent, GeolocateResultEvent } from "react-map-gl/maplibre";
import type { GeolocateControl as MaplibreGeolocateControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  MAP_POINT_TYPES,
  ADMIN_POINT_TYPES,
  DEFAULT_MAP_CENTER,
  type MapPointTypeKey,
} from "@/lib/mapPoints";
import type { MapPointDTO, UserOption } from "@/lib/points";
import { PointForm, type PointFormValues } from "./PointForm";
import { MapLegend } from "./MapLegend";

interface MapViewProps {
  initialPoints: MapPointDTO[];
  users: UserOption[];
  currentUser: { id: string; role: "admin" | "user" };
  /** URL MapLibre stylu (MapTiler outdoor, nebo OpenFreeMap fallback) */
  mapStyleUrl: string;
}

interface PanelState {
  mode: "create" | "edit";
  type: MapPointTypeKey;
  coords: { lat: number; lng: number };
  pointId?: string;
  initial?: PointFormValues;
}

export function MapView({
  initialPoints,
  users,
  currentUser,
  mapStyleUrl,
}: MapViewProps) {
  const [points, setPoints] = useState<MapPointDTO[]>(initialPoints);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [placing, setPlacing] = useState<MapPointTypeKey | null>(null);
  const [panel, setPanel] = useState<PanelState | null>(null);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const geoRef = useRef<MaplibreGeolocateControl | null>(null);

  const isAdmin = currentUser.role === "admin";
  const selected = points.find((p) => p.id === selectedId) ?? null;

  const canEdit = (p: MapPointDTO) =>
    isAdmin || (p.createdById === currentUser.id && p.type === "message_box");

  const refetch = useCallback(async () => {
    const res = await fetch("/api/points");
    if (res.ok) {
      const data = (await res.json()) as { points: MapPointDTO[] };
      setPoints(data.points);
    }
  }, []);

  function startPlacing(type: MapPointTypeKey) {
    setSelectedId(null);
    setAdminMenuOpen(false);
    setPanel(null);
    setPlacing(type);
  }

  function openCreateForm(type: MapPointTypeKey, coords: { lat: number; lng: number }) {
    setPlacing(null);
    setFormError(null);
    setPanel({ mode: "create", type, coords });
  }

  function openEditForm(p: MapPointDTO) {
    setSelectedId(null);
    setFormError(null);
    setPanel({
      mode: "edit",
      type: p.type,
      coords: { lat: p.lat, lng: p.lng },
      pointId: p.id,
      initial: {
        name: p.name,
        description: p.description ?? "",
        visibility: p.visibility,
        recipientId: p.recipientId,
        arContent: p.arContent ?? "",
      },
    });
  }

  function handleMapClick(e: MapMouseEvent) {
    if (placing) {
      openCreateForm(placing, { lat: e.lngLat.lat, lng: e.lngLat.lng });
    } else {
      setSelectedId(null);
    }
  }

  function useCurrentLocationForPlacing() {
    if (!placing) return;
    if (userPos) {
      openCreateForm(placing, userPos);
    } else {
      // vyžádáme polohu; uživatel pak klepne na tlačítko znovu
      geoRef.current?.trigger();
    }
  }

  async function handleSave(values: PointFormValues) {
    if (!panel) return;
    setBusy(true);
    setFormError(null);

    const payload = {
      name: values.name,
      description: values.description || null,
      visibility: values.visibility,
      recipientId: values.recipientId,
      arContent: values.arContent || null,
    };

    try {
      let res: Response;
      if (panel.mode === "create") {
        res = await fetch("/api/points", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            type: panel.type,
            lat: panel.coords.lat,
            lng: panel.coords.lng,
          }),
        });
      } else {
        res = await fetch(`/api/points/${panel.pointId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setFormError(data?.error ?? "Něco se nepovedlo. Zkus to prosím znovu.");
        return;
      }
      await refetch();
      setPanel(null);
    } catch {
      setFormError("Chyba připojení. Zkontroluj internet a zkus to znovu.");
    } finally {
      setBusy(false);
    }
  }

  // Přesun bodu tažením (jen pro body, které uživatel smí editovat).
  async function handleMarkerDragEnd(
    p: MapPointDTO,
    lngLat: { lng: number; lat: number },
  ) {
    const res = await fetch(`/api/points/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: lngLat.lat, lng: lngLat.lng }),
    });
    if (!res.ok) window.alert("Přesun se nepovedl.");
    await refetch();
  }

  async function handleDelete(p: MapPointDTO) {
    if (!window.confirm(`Opravdu smazat „${p.name}"?`)) return;
    const res = await fetch(`/api/points/${p.id}`, { method: "DELETE" });
    if (res.ok) {
      setSelectedId(null);
      await refetch();
    } else {
      window.alert("Smazání se nepovedlo.");
    }
  }

  return (
    <div className="relative flex-1">
      <div className="absolute inset-0">
        <Map
          reuseMaps
          initialViewState={DEFAULT_MAP_CENTER}
          mapStyle={mapStyleUrl}
          style={{ width: "100%", height: "100%" }}
          cursor={placing ? "crosshair" : undefined}
          onClick={handleMapClick}
          onLoad={() => {
            // Vycentruj na polohu hráče (funguje kdekoli — Petřvald, Průhonice…).
            // Když polohu nepovolí, zůstane výchozí střed.
            geoRef.current?.trigger();
          }}
        >
          <GeolocateControl
            ref={geoRef}
            position="top-right"
            trackUserLocation
            positionOptions={{ enableHighAccuracy: true }}
            onGeolocate={(e: GeolocateResultEvent) =>
              setUserPos({
                lat: e.coords.latitude,
                lng: e.coords.longitude,
              })
            }
          />
          <NavigationControl position="top-right" showCompass={false} />

          {points.map((p) => {
            const meta = MAP_POINT_TYPES[p.type];
            const editable = canEdit(p);
            return (
              <Marker
                key={p.id}
                longitude={p.lng}
                latitude={p.lat}
                anchor="center"
                draggable={editable}
                onDragEnd={(e) => handleMarkerDragEnd(p, e.lngLat)}
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setSelectedId(p.id);
                }}
              >
                <span
                  title={
                    editable
                      ? `${p.name} — tažením přesuneš`
                      : p.name
                  }
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-sm shadow-md ${
                    editable
                      ? "cursor-grab border-white/70 active:cursor-grabbing"
                      : "cursor-pointer border-black/40"
                  }`}
                  style={{ backgroundColor: meta.color }}
                >
                  {meta.emoji}
                </span>
              </Marker>
            );
          })}

          {selected && (
            <Popup
              longitude={selected.lng}
              latitude={selected.lat}
              anchor="top"
              closeButton
              closeOnClick={false}
              onClose={() => setSelectedId(null)}
              maxWidth="280px"
            >
              <PointDetail
                point={selected}
                canEdit={canEdit(selected)}
                onEdit={() => openEditForm(selected)}
                onDelete={() => handleDelete(selected)}
              />
            </Popup>
          )}
        </Map>
      </div>

      {/* Ovládání vlevo nahoře */}
      <div className="pointer-events-none absolute inset-x-0 top-0 p-3">
        <div className="pointer-events-auto flex flex-col gap-2">
          {placing ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-kraj-border bg-kraj-bg/90 px-3 py-2 text-sm backdrop-blur">
              <span>
                Klepni do mapy, kam umístit:{" "}
                <strong>{MAP_POINT_TYPES[placing].label}</strong>
              </span>
              <button
                type="button"
                onClick={useCurrentLocationForPlacing}
                className="rounded-md border border-kraj-border px-2 py-1 text-kraj-accent"
              >
                Použít mou polohu
              </button>
              <button
                type="button"
                onClick={() => setPlacing(null)}
                className="rounded-md px-2 py-1 text-kraj-muted hover:text-kraj-fg"
              >
                Zrušit
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => startPlacing("message_box")}
                className="rounded-xl border border-kraj-border bg-kraj-bg/90 px-3 py-2 text-sm backdrop-blur transition-colors hover:bg-kraj-panel"
              >
                ✉️ Přidat schránku se vzkazem
              </button>

              {isAdmin && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setAdminMenuOpen((o) => !o)}
                    className="rounded-xl border border-kraj-gold/40 bg-kraj-bg/90 px-3 py-2 text-sm text-kraj-gold backdrop-blur transition-colors hover:bg-kraj-panel"
                  >
                    ＋ Přidat místo (admin)
                  </button>
                  {adminMenuOpen && (
                    <ul className="absolute z-10 mt-1 w-56 overflow-hidden rounded-xl border border-kraj-border bg-kraj-bg2 text-sm shadow-xl">
                      {ADMIN_POINT_TYPES.map((t) => (
                        <li key={t}>
                          <button
                            type="button"
                            onClick={() => startPlacing(t)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-kraj-panel"
                          >
                            <span
                              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px]"
                              style={{ backgroundColor: MAP_POINT_TYPES[t].color }}
                            >
                              {MAP_POINT_TYPES[t].emoji}
                            </span>
                            {MAP_POINT_TYPES[t].label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Legenda vlevo dole */}
      <div className="pointer-events-none absolute bottom-3 left-3">
        <div className="pointer-events-auto w-56 max-w-[70vw]">
          <MapLegend />
        </div>
      </div>

      {/* Panel s formulářem */}
      {panel && (
        <div className="absolute inset-0 z-30 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-t-2xl border border-kraj-border bg-kraj-bg2 p-5 shadow-2xl sm:rounded-2xl">
            <PointForm
              type={panel.type}
              mode={panel.mode}
              coords={panel.coords}
              users={users}
              currentUserId={currentUser.id}
              initial={panel.initial}
              busy={busy}
              error={formError}
              onSave={handleSave}
              onCancel={() => setPanel(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// --- Detail bodu v popupu ---------------------------------------------------
function PointDetail({
  point,
  canEdit,
  onEdit,
  onDelete,
}: {
  point: MapPointDTO;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = MAP_POINT_TYPES[point.type];
  return (
    <div className="flex flex-col gap-1.5">
      <span
        className="inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs text-black"
        style={{ backgroundColor: meta.color }}
      >
        {meta.emoji} {meta.label}
      </span>
      <h3 className="text-base font-semibold">{point.name}</h3>
      {point.description && (
        <p className="whitespace-pre-wrap text-sm text-kraj-muted">
          {point.description}
        </p>
      )}
      {point.visibility === "private_user" && (
        <p className="text-xs text-kraj-gold">Soukromý vzkaz</p>
      )}
      <p className="text-xs text-kraj-muted">Založil: {point.createdByName}</p>

      {canEdit && (
        <div className="mt-1.5 flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md border border-kraj-border px-2.5 py-1 text-xs hover:bg-kraj-panel"
          >
            Upravit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md border border-red-500/40 px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/10"
          >
            Smazat
          </button>
        </div>
      )}
    </div>
  );
}
