"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Live Fleet Operations Map.
 *
 * A self-contained command-center view (inline SVG — no third-party map tiles or
 * geocoding APIs, per the project's "zero external services" rule). It pulls real
 * vehicle + KPI data from the API, positions each unit by status across a
 * stylised depot network, and animates On-Trip vehicles along live routes.
 */

type Vehicle = {
  id: string;
  regNumber: string;
  name: string;
  type: string;
  status: "Available" | "On Trip" | "In Shop" | "Retired" | string;
  odometer: number;
  acquisitionCost: number;
};

type KPIs = {
  activeVehicles: number;
  availableVehicles: number;
  inMaintenance: number;
  activeTrips: number;
  fleetUtilizationPct: number;
};

const STATUS_COLOR: Record<string, string> = {
  Available: "#10b981",
  "On Trip": "#38bdf8",
  "In Shop": "#f59e0b",
  Retired: "#64748b",
};

// Stylised depot network on a 1000x600 canvas.
const HUBS = [
  { id: "north", label: "North Depot", x: 360, y: 120 },
  { id: "east", label: "East Terminal", x: 830, y: 210 },
  { id: "central", label: "Central Hub", x: 520, y: 320 },
  { id: "south", label: "South Yard", x: 520, y: 510 },
  { id: "garage", label: "Service Garage", x: 140, y: 300 },
  { id: "retired", label: "Retired Lot", x: 150, y: 520 },
];
const HUB = Object.fromEntries(HUBS.map((h) => [h.id, h]));
const DEPOT_IDS = ["north", "east", "central", "south"];
const ROADS: [string, string][] = [
  ["garage", "north"], ["garage", "central"], ["north", "central"],
  ["central", "east"], ["central", "south"], ["north", "east"],
  ["south", "east"], ["garage", "retired"],
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// A deterministic small offset so multiple units at one hub don't overlap.
function cluster(i: number): { dx: number; dy: number } {
  const ring = [
    [0, -34], [30, -14], [30, 22], [0, 40], [-30, 22], [-30, -14], [0, 0],
  ];
  return { dx: ring[i % ring.length][0], dy: ring[i % ring.length][1] };
}

type Placed =
  | { v: Vehicle; mode: "parked"; x: number; y: number }
  | { v: Vehicle; mode: "moving"; pathD: string; dur: number; origin: string; dest: string };

function place(vehicles: Vehicle[]): Placed[] {
  const parkedCount: Record<string, number> = {};
  return vehicles.map((v) => {
    const h = hash(v.id);
    if (v.status === "On Trip") {
      const origin = DEPOT_IDS[h % DEPOT_IDS.length];
      const dest = DEPOT_IDS[(h + 1 + (h % 2)) % DEPOT_IDS.length];
      const o = HUB[origin], d = HUB[dest];
      // Curved route via a control point offset perpendicular-ish for a nice arc.
      const mx = (o.x + d.x) / 2 + ((h % 120) - 60);
      const my = (o.y + d.y) / 2 - (40 + (h % 80));
      return {
        v, mode: "moving" as const, origin, dest,
        pathD: `M ${o.x} ${o.y} Q ${mx} ${my} ${d.x} ${d.y}`,
        dur: 9 + (h % 7),
      };
    }
    const hubId =
      v.status === "In Shop" ? "garage" : v.status === "Retired" ? "retired" : DEPOT_IDS[h % DEPOT_IDS.length];
    const i = parkedCount[hubId] = (parkedCount[hubId] ?? 0) + 1;
    const c = cluster(i - 1);
    return { v, mode: "parked" as const, x: HUB[hubId].x + c.dx, y: HUB[hubId].y + c.dy };
  });
}

function VehicleMarker({ v, onClick, selected }: { v: Vehicle; onClick: () => void; selected: boolean }) {
  const color = STATUS_COLOR[v.status] ?? "#94a3b8";
  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      {selected && <circle r={18} fill="none" stroke={color} strokeWidth={2} opacity={0.9} />}
      <circle r={11} fill={color} opacity={0.18} />
      <circle r={6.5} fill={color} stroke="#0b1220" strokeWidth={1.5} />
      {v.status === "On Trip" && (
        <circle r={6.5} fill="none" stroke={color} strokeWidth={1.5}>
          <animate attributeName="r" values="6.5;15;6.5" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.9;0;0.9" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
      <text y={-14} textAnchor="middle" fontSize={9} fontWeight={600} fill="#cbd5e1">
        {v.regNumber}
      </text>
    </g>
  );
}

export default function OperationsMapPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const [vr, kr] = await Promise.all([fetch("/api/vehicles"), fetch("/api/dashboard/kpis")]);
        if (!vr.ok) throw new Error("Failed to load vehicles");
        const vs = await vr.json();
        const ks = kr.ok ? await kr.json() : null;
        if (!alive) return;
        setVehicles(Array.isArray(vs) ? vs : []);
        setKpis(ks);
        setUpdatedAt(new Date());
        setError(null);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    const t = setInterval(load, 10000); // live refresh
    return () => { alive = false; clearInterval(t); };
  }, []);

  const placed = useMemo(() => place(vehicles), [vehicles]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const v of vehicles) c[v.status] = (c[v.status] ?? 0) + 1;
    return c;
  }, [vehicles]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Live Operations Map</h1>
          <p className="text-sm text-muted-foreground">
            Real-time fleet positions · {vehicles.length} vehicles
            {updatedAt && <> · updated {updatedAt.toLocaleTimeString()}</>}
            <span className="ml-2 inline-flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              live
            </span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            ["Active", kpis?.activeVehicles],
            ["On Trip", counts["On Trip"] ?? 0],
            ["Available", kpis?.availableVehicles ?? counts["Available"] ?? 0],
            ["In Shop", kpis?.inMaintenance ?? counts["In Shop"] ?? 0],
            ["Utilization", kpis ? `${kpis.fleetUtilizationPct}%` : "—"],
          ].map(([label, val]) => (
            <div key={String(label)} className="rounded-lg border border-border/50 bg-card px-3 py-2 min-w-[90px]">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
              <div className="text-lg font-semibold text-foreground">{val ?? "—"}</div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        {/* Map canvas */}
        <div className="relative rounded-xl overflow-hidden border border-border/50" style={{ background: "#0b1220" }}>
          <svg viewBox="0 0 1000 600" className="w-full h-auto" role="img" aria-label="Fleet operations map">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#16223a" strokeWidth="1" />
              </pattern>
              <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#0b1220" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="1000" height="600" fill="url(#grid)" />
            <rect width="1000" height="600" fill="url(#glow)" />

            {/* Roads */}
            {ROADS.map(([a, b], i) => (
              <line key={i} x1={HUB[a].x} y1={HUB[a].y} x2={HUB[b].x} y2={HUB[b].y}
                stroke="#243350" strokeWidth={6} strokeLinecap="round" />
            ))}

            {/* Active trip routes (drawn under vehicles) */}
            {placed.filter((p): p is Extract<Placed, { mode: "moving" }> => p.mode === "moving").map((p) => (
              <path key={`route-${p.v.id}`} d={p.pathD} fill="none" stroke="#38bdf8" strokeWidth={2}
                strokeDasharray="6 8" opacity={0.55}>
                <animate attributeName="stroke-dashoffset" from="28" to="0" dur="1s" repeatCount="indefinite" />
              </path>
            ))}

            {/* Hubs */}
            {HUBS.map((h) => (
              <g key={h.id}>
                <circle cx={h.x} cy={h.y} r={16} fill="#0f1c33" stroke="#33507e" strokeWidth={2} />
                <circle cx={h.x} cy={h.y} r={4} fill="#33507e" />
                <text x={h.x} y={h.y + 32} textAnchor="middle" fontSize={11} fontWeight={600} fill="#7b93b8">
                  {h.label}
                </text>
              </g>
            ))}

            {/* Parked vehicles */}
            {placed.filter((p): p is Extract<Placed, { mode: "parked" }> => p.mode === "parked").map((p) => (
              <g key={p.v.id} transform={`translate(${p.x} ${p.y})`}>
                <VehicleMarker v={p.v} selected={selected?.id === p.v.id} onClick={() => setSelected(p.v)} />
              </g>
            ))}

            {/* Moving vehicles (animated along their route) */}
            {placed.filter((p): p is Extract<Placed, { mode: "moving" }> => p.mode === "moving").map((p) => (
              <g key={p.v.id}>
                <VehicleMarker v={p.v} selected={selected?.id === p.v.id} onClick={() => setSelected(p.v)} />
                <animateMotion dur={`${p.dur}s`} repeatCount="indefinite" rotate="0" path={p.pathD} />
              </g>
            ))}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 flex gap-3 rounded-lg bg-black/40 backdrop-blur px-3 py-2 text-[11px]">
            {Object.entries(STATUS_COLOR).map(([s, c]) => (
              <div key={s} className="flex items-center gap-1.5 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
                {s} <span className="text-slate-500">{counts[s] ?? 0}</span>
              </div>
            ))}
          </div>

          {loading && (
            <div className="absolute inset-0 grid place-items-center text-slate-400 text-sm">Loading fleet…</div>
          )}
        </div>

        {/* Detail panel */}
        <aside className="rounded-xl border border-border/50 bg-card p-4">
          {selected ? (
            <VehicleDetail v={selected} onClose={() => setSelected(null)} />
          ) : (
            <div className="text-sm text-muted-foreground">
              <div className="font-medium text-foreground mb-1">Fleet roster</div>
              <p className="mb-3">Click any vehicle on the map for details.</p>
              <ul className="space-y-1.5 max-h-[420px] overflow-auto pr-1">
                {vehicles.map((v) => (
                  <li key={v.id}>
                    <button onClick={() => setSelected(v)}
                      className="w-full flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-accent/50 text-left">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[v.status] ?? "#94a3b8" }} />
                        <span className="text-foreground">{v.regNumber}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">{v.status}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function VehicleDetail({ v, onClose }: { v: Vehicle; onClose: () => void }) {
  const [cost, setCost] = useState<{ totalCost: number } | null>(null);
  const [denied, setDenied] = useState(false);
  useEffect(() => {
    let alive = true;
    setCost(null); setDenied(false);
    fetch(`/api/vehicles/${v.id}/operational-cost`).then(async (r) => {
      if (!alive) return;
      if (r.status === 403) { setDenied(true); return; }
      if (r.ok) setCost(await r.json());
    }).catch(() => {});
    return () => { alive = false; };
  }, [v.id]);

  const color = STATUS_COLOR[v.status] ?? "#94a3b8";
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-lg font-semibold text-foreground">{v.regNumber}</div>
          <div className="text-sm text-muted-foreground">{v.name}</div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">✕</button>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
        style={{ background: `${color}22`, color }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} /> {v.status}
      </span>
      <dl className="text-sm space-y-1.5">
        <Row k="Type" val={v.type} />
        <Row k="Odometer" val={`${v.odometer.toLocaleString()} km`} />
        <Row k="Acquisition" val={`$${v.acquisitionCost.toLocaleString()}`} />
        <Row k="Operational cost" val={denied ? "— (restricted)" : cost ? `$${cost.totalCost.toLocaleString()}` : "…"} />
      </dl>
    </div>
  );
}

function Row({ k, val }: { k: string; val: string }) {
  return (
    <div className="flex justify-between border-b border-border/40 pb-1">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-foreground font-medium">{val}</dd>
    </div>
  );
}
