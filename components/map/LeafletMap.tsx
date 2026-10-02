"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";

const waypointIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const riderIcon = new L.DivIcon({
  className: "",
  html: '<div style="width:16px;height:16px;border-radius:9999px;background:#16a34a;border:3px solid white;box-shadow:0 0 0 2px #16a34a99;"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export interface MapPoint {
  lat: number;
  lng: number;
  label?: string;
}

export interface LeafletMapProps {
  pickup: MapPoint;
  dropoff: MapPoint;
  position?: MapPoint | null;
}

export default function LeafletMap({ pickup, dropoff, position }: LeafletMapProps) {
  const center = position ?? {
    lat: (pickup.lat + dropoff.lat) / 2,
    lng: (pickup.lng + dropoff.lng) / 2,
  };

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      scrollWheelZoom={false}
      style={{ height: "320px", width: "100%", borderRadius: "0.75rem", zIndex: 0 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={[pickup.lat, pickup.lng]} icon={waypointIcon}>
        <Popup>Pickup{pickup.label ? `: ${pickup.label}` : ""}</Popup>
      </Marker>
      <Marker position={[dropoff.lat, dropoff.lng]} icon={waypointIcon}>
        <Popup>Dropoff{dropoff.label ? `: ${dropoff.label}` : ""}</Popup>
      </Marker>
      <Polyline
        positions={[
          [pickup.lat, pickup.lng],
          [dropoff.lat, dropoff.lng],
        ]}
        pathOptions={{ color: "#71717a", dashArray: "6 6" }}
      />
      {position && (
        <Marker position={[position.lat, position.lng]} icon={riderIcon}>
          <Popup>Rider is here</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
