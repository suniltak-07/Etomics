"use client";

import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ServiceAreaRing } from "@/features/pincodes/serviceArea";

const vertexIcon = L.divIcon({
  className: "etomics-vertex",
  html: '<span class="block size-3 rounded-full border-2 border-white bg-[#2d6a4f] shadow"></span>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

function InvalidateAndFit({
  ring,
  center,
}: {
  ring: ServiceAreaRing;
  center: [number, number];
}) {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 100);
    return () => window.clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    map.setView(center, 14, { animate: true });
  }, [center, map]);

  useEffect(() => {
    if (ring.length >= 2) {
      map.fitBounds(L.latLngBounds(ring), { padding: [28, 28], maxZoom: 16 });
    }
  }, [map, ring]);

  return null;
}

function DrawClicks({
  enabled,
  onAdd,
}: {
  enabled: boolean;
  onAdd: (point: [number, number]) => void;
}) {
  useMapEvents({
    click(event) {
      if (!enabled) return;
      onAdd([event.latlng.lat, event.latlng.lng]);
    },
  });
  return null;
}

export function ServiceAreaMap({
  ring,
  draft,
  drawing,
  center,
  onAddPoint,
  onMoveVertex,
}: {
  ring: ServiceAreaRing;
  draft: ServiceAreaRing;
  drawing: boolean;
  center: [number, number];
  onAddPoint: (point: [number, number]) => void;
  onMoveVertex: (index: number, point: [number, number]) => void;
}) {
  const vertices = drawing ? draft : ring;

  return (
    <MapContainer
      center={center}
      zoom={14}
      scrollWheelZoom
      className="z-0 h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <InvalidateAndFit ring={vertices} center={center} />
      <DrawClicks enabled={drawing} onAdd={onAddPoint} />
      {!drawing && ring.length >= 3 ? (
        <Polygon
          positions={ring}
          pathOptions={{
            color: "#2d6a4f",
            fillColor: "#2d6a4f",
            fillOpacity: 0.25,
            weight: 2,
          }}
        />
      ) : null}
      {drawing && draft.length >= 1 ? (
        <Polyline
          positions={draft}
          pathOptions={{ color: "#2d6a4f", dashArray: "6 6", weight: 2 }}
        />
      ) : null}
      {vertices.map((point, index) => (
        <Marker
          key={`${drawing ? "d" : "r"}-${index}-${point[0]}-${point[1]}`}
          position={point}
          icon={vertexIcon}
          draggable={!drawing}
          eventHandlers={{
            dragend: (event) => {
              if (drawing) return;
              const marker = event.target as L.Marker;
              const { lat, lng } = marker.getLatLng();
              onMoveVertex(index, [lat, lng]);
            },
          }}
        />
      ))}
    </MapContainer>
  );
}
