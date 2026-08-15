"use client";

import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export interface RouteStopMarker {
  sequence: number;
  latitude: number;
  longitude: number;
  label: string;
  detail?: string;
}

export function RouteStopsMap({
  origin,
  stops,
  className,
}: {
  origin: { latitude: number; longitude: number };
  stops: RouteStopMarker[];
  className?: string;
}) {
  const positions: [number, number][] = [
    [origin.latitude, origin.longitude],
    ...stops.map((stop) => [stop.latitude, stop.longitude] as [number, number]),
  ];

  return (
    <div className={className}>
      <MapContainer
        center={[origin.latitude, origin.longitude]}
        zoom={13}
        scrollWheelZoom
        className="h-full w-full rounded-2xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={[origin.latitude, origin.longitude]}
          icon={markerIcon}
        >
          <Popup>Rider start</Popup>
        </Marker>
        {stops.map((stop) => (
          <Marker
            key={`${stop.sequence}-${stop.latitude}`}
            position={[stop.latitude, stop.longitude]}
            icon={markerIcon}
          >
            <Popup>
              #{stop.sequence} {stop.label}
              {stop.detail ? <p>{stop.detail}</p> : null}
            </Popup>
          </Marker>
        ))}
        {positions.length > 1 ? (
          <Polyline positions={positions} pathOptions={{ color: "#2d6a4f" }} />
        ) : null}
      </MapContainer>
    </div>
  );
}
