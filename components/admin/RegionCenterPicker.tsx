"use client";

import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import type {
  MapMouseEvent,
  ViewStateChangeEvent,
  MarkerDragEvent,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

interface Props {
  mapStyleUrl: string;
  lat: number;
  lng: number;
  zoom: number;
  onChange: (v: { lat: number; lng: number; zoom: number }) => void;
}

// Mini-mapa pro výběr středu oblasti: klepnutím nebo tažením značky nastavíš
// střed, přiblížením mapy nastavíš výchozí zoom.
export function RegionCenterPicker({
  mapStyleUrl,
  lat,
  lng,
  zoom,
  onChange,
}: Props) {
  return (
    <div className="h-64 overflow-hidden rounded-lg border border-kraj-border">
      <Map
        initialViewState={{ latitude: lat, longitude: lng, zoom }}
        mapStyle={mapStyleUrl}
        style={{ width: "100%", height: "100%" }}
        onClick={(e: MapMouseEvent) =>
          onChange({ lat: e.lngLat.lat, lng: e.lngLat.lng, zoom })
        }
        onMoveEnd={(e: ViewStateChangeEvent) =>
          onChange({ lat, lng, zoom: e.viewState.zoom })
        }
      >
        <NavigationControl position="top-right" showCompass={false} />
        <Marker
          longitude={lng}
          latitude={lat}
          anchor="bottom"
          draggable
          onDragEnd={(e: MarkerDragEvent) =>
            onChange({ lat: e.lngLat.lat, lng: e.lngLat.lng, zoom })
          }
        >
          <span className="text-2xl">📍</span>
        </Marker>
      </Map>
    </div>
  );
}
