"use client";

import { useEffect, useRef, Fragment } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// We'll use a pure grayscale map tile to match Nike aesthetic
const TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

// Depot Coordinates (NYC area as an example)
const HUBS = [
  { id: "north", label: "North Depot", lat: 40.8448, lng: -73.8648 },
  { id: "east", label: "East Terminal", lat: 40.7282, lng: -73.7949 },
  { id: "central", label: "Central Hub", lat: 40.7306, lng: -73.9352 },
  { id: "south", label: "South Yard", lat: 40.6782, lng: -73.9442 },
  { id: "garage", label: "Service Garage", lat: 40.7357, lng: -74.0505 },
  { id: "retired", label: "Retired Lot", lat: 40.5795, lng: -74.1502 },
];
const HUB = Object.fromEntries(HUBS.map((h) => [h.id, h]));
const DEPOT_IDS = ["north", "east", "central", "south"];

type Vehicle = {
  id: string;
  regNumber: string;
  name: string;
  type: string;
  status: string;
  odometer: number;
  acquisitionCost: number;
};

// Colors mapping to Nike's Semantic tokens
const STATUS_COLOR: Record<string, string> = {
  Available: "#1eaa52", // success-bright
  "On Trip": "#111111", // ink (was info, but let's use ink for moving)
  "In Shop": "#d30005", // sale
  Retired: "#707072",   // mute
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Add a slight offset for stacked vehicles
function getOffsetLatLn(lat: number, lng: number, index: number) {
  const ring = [
    [0, 0], [0.005, 0], [0, 0.005], [-0.005, 0], [0, -0.005], [0.005, 0.005], [-0.005, -0.005], [0.005, -0.005], [-0.005, 0.005]
  ];
  const offset = ring[index % ring.length];
  return { lat: lat + offset[0], lng: lng + offset[1] };
}

// Create custom div icons
function createMarkerIcon(color: string, reg: string, isSelected: boolean) {
  return L.divIcon({
    className: "custom-div-icon",
    html: `
      <div style="
        background-color: ${color};
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: ${isSelected ? `0 0 0 4px ${color}40` : 'none'};
      "></div>
      <div style="
        margin-top: 4px;
        font-size: 10px;
        font-weight: 600;
        color: #111111;
        text-shadow: 1px 1px 0px white, -1px -1px 0px white, 1px -1px 0px white, -1px 1px 0px white;
        transform: translateX(-50%);
        margin-left: 6px;
      ">
        ${reg}
      </div>
    `,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

function createHubIcon() {
  return L.divIcon({
    className: "hub-icon",
    html: `
      <div style="
        background-color: #111111;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid white;
      "></div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export default function MapClient({ 
  vehicles, 
  selected, 
  setSelected 
}: { 
  vehicles: Vehicle[], 
  selected: Vehicle | null,
  setSelected: (v: Vehicle | null) => void 
}) {
  const parkedCount: Record<string, number> = {};

  return (
    <MapContainer 
      center={[40.7128, -73.95]} 
      zoom={11} 
      style={{ height: "100%", width: "100%", minHeight: "500px", background: "#f5f5f5" }}
      zoomControl={false}
    >
      <TileLayer url={TILE_URL} attribution="&copy; OpenStreetMap &copy; CARTO" />

      {/* Render Hubs */}
      {HUBS.map((hub) => (
        <Marker 
          key={hub.id} 
          position={[hub.lat, hub.lng]} 
          icon={createHubIcon()}
        >
          <Popup>
            <div className="font-display uppercase text-lg">{hub.label}</div>
          </Popup>
        </Marker>
      ))}

      {/* Render Vehicles */}
      {vehicles.map((v) => {
        const h = hash(v.id);
        const color = STATUS_COLOR[v.status] || "#707072";
        const isSelected = selected?.id === v.id;

        if (v.status === "On Trip") {
          // Animate logic: for simplicity in Leaflet without external plugins, 
          // we'll just draw a polyline between origin and dest, and put the marker in the middle.
          const origin = DEPOT_IDS[h % DEPOT_IDS.length];
          const dest = DEPOT_IDS[(h + 1 + (h % 2)) % DEPOT_IDS.length];
          const o = HUB[origin], d = HUB[dest];
          
          // Polyline
          return (
            <Fragment key={v.id}>
              <Polyline 
                positions={[[o.lat, o.lng], [d.lat, d.lng]]} 
                color={color} 
                weight={2} 
                dashArray="4 6"
                opacity={0.5}
              />
              <Marker 
                position={[(o.lat + d.lat)/2, (o.lng + d.lng)/2]} 
                icon={createMarkerIcon(color, v.regNumber, isSelected)}
                eventHandlers={{
                  click: () => setSelected(v)
                }}
              />
            </Fragment>
          );
        }

        const hubId = v.status === "In Shop" ? "garage" : v.status === "Retired" ? "retired" : DEPOT_IDS[h % DEPOT_IDS.length];
        const i = parkedCount[hubId] = (parkedCount[hubId] ?? 0) + 1;
        const pos = getOffsetLatLn(HUB[hubId].lat, HUB[hubId].lng, i - 1);

        return (
          <Marker 
            key={v.id} 
            position={[pos.lat, pos.lng]} 
            icon={createMarkerIcon(color, v.regNumber, isSelected)}
            eventHandlers={{
              click: () => setSelected(v)
            }}
          />
        );
      })}
    </MapContainer>
  );
}
