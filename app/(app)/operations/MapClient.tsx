"use client";

import { useState, Fragment } from "react";
import { Map, Overlay, GeoJson } from "pigeon-maps";
import { FeatureCollection } from "geojson";

// We'll use a pure grayscale map tile to match Nike aesthetic
const mapTilerProvider = (x: number, y: number, z: number, dpr?: number) => {
  return `https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/${z}/${x}/${y}${dpr && dpr >= 2 ? '@2x' : ''}.png`;
};

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
  "On Trip": "#111111", // ink
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
    <div style={{ height: "100%", width: "100%", minHeight: "500px", background: "#f5f5f5" }}>
      <Map 
        provider={mapTilerProvider} 
        defaultCenter={[40.7128, -73.95]} 
        defaultZoom={11}
        mouseEvents={true}
        touchEvents={true}
      >
        {/* Render Hubs */}
        {HUBS.map((hub) => (
          <Overlay key={hub.id} anchor={[hub.lat, hub.lng]} offset={[8, 8]}>
            <div 
              style={{
                backgroundColor: "#111111",
                width: 16,
                height: 16,
                borderRadius: "50%",
                border: "2px solid white",
                cursor: "pointer"
              }} 
              title={hub.label}
            />
          </Overlay>
        ))}

        {/* Render Vehicles - Flattened so Pigeon Maps can inject mapState to GeoJson/Overlay */}
        {vehicles.flatMap((v) => {
          const h = hash(v.id);
          const color = STATUS_COLOR[v.status] || "#707072";
          const isSelected = selected?.id === v.id;

          if (v.status === "On Trip") {
            const origin = DEPOT_IDS[h % DEPOT_IDS.length];
            const dest = DEPOT_IDS[(h + 1 + (h % 2)) % DEPOT_IDS.length];
            const o = HUB[origin], d = HUB[dest];
            const midLat = (o.lat + d.lat) / 2;
            const midLng = (o.lng + d.lng) / 2;
            
            const lineGeoJson: FeatureCollection = {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  geometry: {
                    type: "LineString",
                    coordinates: [[o.lng, o.lat], [d.lng, d.lat]] // geojson is [lng, lat]
                  },
                  properties: {}
                }
              ]
            };

            return [
              <GeoJson 
                key={`${v.id}-line`}
                data={lineGeoJson}
                styleCallback={() => ({ 
                  stroke: color, 
                  strokeWidth: 2, 
                  strokeDasharray: "4 6", 
                  opacity: 0.5,
                  fill: "none"
                })}
              />,
              <Overlay key={`${v.id}-overlay`} anchor={[midLat, midLng]} offset={[6, 6]}>
                <div 
                  onClick={() => setSelected(v)}
                  style={{
                    backgroundColor: color,
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    border: "2px solid white",
                    boxShadow: isSelected ? `0 0 0 4px ${color}40` : 'none',
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-end"
                  }}
                >
                  <div style={{
                    marginTop: 14,
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#111111",
                    textShadow: "1px 1px 0px white, -1px -1px 0px white, 1px -1px 0px white, -1px 1px 0px white",
                    whiteSpace: "nowrap"
                  }}>
                    {v.regNumber}
                  </div>
                </div>
              </Overlay>
            ];
          }

          const hubId = v.status === "In Shop" ? "garage" : v.status === "Retired" ? "retired" : DEPOT_IDS[h % DEPOT_IDS.length];
          const i = parkedCount[hubId] = (parkedCount[hubId] ?? 0) + 1;
          const pos = getOffsetLatLn(HUB[hubId].lat, HUB[hubId].lng, i - 1);

          return [
            <Overlay key={`${v.id}-overlay`} anchor={[pos.lat, pos.lng]} offset={[6, 6]}>
              <div 
                onClick={() => setSelected(v)}
                style={{
                  backgroundColor: color,
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  border: "2px solid white",
                  boxShadow: isSelected ? `0 0 0 4px ${color}40` : 'none',
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "flex-end"
                }}
              >
                <div style={{
                  marginTop: 14,
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#111111",
                  textShadow: "1px 1px 0px white, -1px -1px 0px white, 1px -1px 0px white, -1px 1px 0px white",
                  whiteSpace: "nowrap"
                }}>
                  {v.regNumber}
                </div>
              </div>
            </Overlay>
          ];
        })}
      </Map>
    </div>
  );
}
