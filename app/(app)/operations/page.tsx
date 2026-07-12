"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

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

// Colors mapping to Nike's Semantic tokens
const STATUS_COLOR: Record<string, string> = {
  Available: "#1eaa52", // success-bright
  "On Trip": "#111111", // ink (was info, but let's use ink for moving)
  "In Shop": "#d30005", // sale
  Retired: "#707072",   // mute
};

const MapClient = dynamic(() => import("./MapClient"), { ssr: false, loading: () => <div className="absolute inset-0 grid place-items-center bg-soft-cloud text-mute font-display uppercase tracking-widest text-lg">Loading Map...</div> });

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

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const v of vehicles) c[v.status] = (c[v.status] ?? 0) + 1;
    return c;
  }, [vehicles]);

  return (
    <div className="flex flex-col gap-8">
      {/* Campaign Header */}
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-7xl uppercase leading-none tracking-tight text-ink">Operations Map</h1>
        <div className="flex items-center gap-4 text-mute text-sm">
          <span>Real-time fleet positions &middot; {vehicles.length} vehicles</span>
          {updatedAt && <span>&middot; updated {updatedAt.toLocaleTimeString()}</span>}
          <span className="inline-flex items-center gap-1.5 uppercase font-medium tracking-wide">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success-bright" />
            </span>
            Live
          </span>
        </div>
        
        {/* KPI Pills */}
        <div className="flex gap-2 flex-wrap mt-2">
          {[
            ["Active", kpis?.activeVehicles],
            ["On Trip", counts["On Trip"] ?? 0],
            ["Available", kpis?.availableVehicles ?? counts["Available"] ?? 0],
            ["In Shop", kpis?.inMaintenance ?? counts["In Shop"] ?? 0],
            ["Utilization", kpis ? `${kpis.fleetUtilizationPct}%` : "—"],
          ].map(([label, val]) => (
            <div key={String(label)} className="rounded-full bg-soft-cloud px-4 py-2 min-w-[100px] flex items-center justify-between gap-4">
              <div className="text-xs uppercase font-medium tracking-widest text-mute">{label}</div>
              <div className="text-base font-semibold text-ink">{val ?? "—"}</div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-sale/10 text-sale px-4 py-3 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 h-[600px]">
        {/* Map Container */}
        <div className="relative rounded-none overflow-hidden bg-soft-cloud border border-hairline-soft h-full">
          <MapClient vehicles={vehicles} selected={selected} setSelected={setSelected} />

          {/* Legend */}
          <div className="absolute bottom-4 left-4 z-[400] flex flex-col gap-1.5 bg-canvas px-4 py-3 border border-hairline shadow-sm">
            {Object.entries(STATUS_COLOR).map(([s, c]) => (
              <div key={s} className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-charcoal">
                <span className="h-3 w-3 rounded-full border border-canvas" style={{ background: c }} />
                {s} <span className="text-mute ml-2">{counts[s] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <aside className="bg-canvas border border-hairline-soft p-6 flex flex-col h-full overflow-hidden">
          {selected ? (
            <VehicleDetail v={selected} onClose={() => setSelected(null)} />
          ) : (
            <div className="text-sm text-mute flex flex-col h-full">
              <div className="font-display text-2xl uppercase text-ink mb-2">Fleet Roster</div>
              <p className="mb-4 text-charcoal">Select a vehicle on the map.</p>
              <ul className="flex-1 overflow-auto space-y-1">
                {vehicles.map((v) => (
                  <li key={v.id}>
                    <button onClick={() => setSelected(v)}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-soft-cloud text-left transition-colors">
                      <span className="flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[v.status] ?? "#94a3b8" }} />
                        <span className="text-ink font-medium">{v.regNumber}</span>
                      </span>
                      <span className="text-xs uppercase tracking-widest text-mute">{v.status}</span>
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

  const color = STATUS_COLOR[v.status] ?? "#707072";
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="font-display text-4xl uppercase text-ink leading-none mb-1">{v.regNumber}</div>
          <div className="text-sm text-charcoal uppercase tracking-widest">{v.name}</div>
        </div>
        <button onClick={onClose} className="text-mute hover:text-ink text-sm">✕</button>
      </div>
      
      <div className="mb-8">
        <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-widest"
          style={{ background: `${color}15`, color }}>
          <span className="h-2 w-2 rounded-full" style={{ background: color }} /> {v.status}
        </span>
      </div>
      
      <dl className="text-sm flex flex-col gap-4 flex-1">
        <Row k="Type" val={v.type} />
        <Row k="Odometer" val={`${v.odometer.toLocaleString()} km`} />
        <Row k="Acquisition" val={`$${v.acquisitionCost.toLocaleString()}`} />
        <Row k="Op Cost" val={denied ? "— (Restricted)" : cost ? `$${cost.totalCost.toLocaleString()}` : "…"} />
      </dl>
      
      <div className="mt-auto pt-6 border-t border-hairline-soft">
        <button className="w-full rounded-full bg-ink text-canvas py-3 font-medium hover:opacity-80 transition-opacity">
          View Full Profile
        </button>
      </div>
    </div>
  );
}

function Row({ k, val }: { k: string; val: string }) {
  return (
    <div className="flex justify-between items-end border-b border-hairline-soft pb-2">
      <dt className="text-mute text-xs uppercase tracking-widest font-medium">{k}</dt>
      <dd className="text-ink font-semibold">{val}</dd>
    </div>
  );
}
