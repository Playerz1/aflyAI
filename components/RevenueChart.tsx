"use client";

import { useMemo, useState } from "react";

export type SalePoint = { date: string; amount: number };
type Period = "7d" | "30d" | "90d";

const PERIODS: { key: Period; label: string; days: number }[] = [
  { key: "7d", label: "7 dias", days: 7 },
  { key: "30d", label: "30 dias", days: 30 },
  { key: "90d", label: "90 dias", days: 90 },
];

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function RevenueChart({ sales }: { sales: SalePoint[] }) {
  const [period, setPeriod] = useState<Period>("30d");
  const [hover, setHover] = useState<{ x: number; y: number; label: string; value: number } | null>(null);

  const series = useMemo(() => {
    const days = PERIODS.find((p) => p.key === period)!.days;
    const byDay = new Map<string, number>();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      byDay.set(d.toISOString().slice(0, 10), 0);
    }
    for (const s of sales) {
      const key = s.date.slice(0, 10);
      if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + s.amount);
    }
    return Array.from(byDay.entries()).map(([date, amount]) => ({
      date,
      label: new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      amount,
    }));
  }, [sales, period]);

  const W = 800;
  const H = 260;
  const PAD = { t: 20, r: 16, b: 28, l: 16 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;

  const maxVal = Math.max(...series.map((p) => p.amount), 1) * 1.15;
  const pts = series.map((p, i) => ({
    ...p,
    x: PAD.l + (i / Math.max(series.length - 1, 1)) * innerW,
    y: PAD.t + innerH - (p.amount / maxVal) * innerH,
  }));

  // smooth path (catmull-rom-ish via midpoint curves)
  const linePath = useMemo(() => {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cx = (p0.x + p1.x) / 2;
      d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  }, [pts]);

  const areaPath = useMemo(() => {
    if (!linePath) return "";
    const last = pts[pts.length - 1];
    const first = pts[0];
    return `${linePath} L ${last.x} ${PAD.t + innerH} L ${first.x} ${PAD.t + innerH} Z`;
  }, [linePath, pts, innerH]);

  const total = series.reduce((a, p) => a + p.amount, 0);

  // grid lines
  const gridVals = [0, 0.25, 0.5, 0.75, 1].map((f) => maxVal * f);

  return (
    <div className="card chart-card">
      <div className="chart-head">
        <div>
          <h2 className="chart-title">Faturamento</h2>
          <p className="chart-sub">{fmtBRL(total)} no período</p>
        </div>
        <div className="period-toggle" role="tablist">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              role="tab"
              aria-selected={period === p.key}
              className={"period-btn" + (period === p.key ? " selected" : "")}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E50914" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#E50914" stopOpacity="0" />
            </linearGradient>
          </defs>

          {gridVals.map((v, i) => {
            const y = PAD.t + innerH - (v / maxVal) * innerH;
            return (
              <g key={i}>
                <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="#1c1c21" strokeWidth="1" />
                <text x={PAD.l + 2} y={y - 4} fill="#5c5c64" fontSize="10">
                  {v >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v)}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#areaFill)" />
          <path d={linePath} fill="none" stroke="#E50914" strokeWidth="2.4" strokeLinecap="round" />

          {/* hover hit areas */}
          {pts.map((p, i) => (
            <rect
              key={i}
              x={p.x - innerW / (pts.length * 2)}
              y={PAD.t}
              width={innerW / pts.length + 1}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHover({ x: p.x, y: p.y, label: p.label, value: p.amount })}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "crosshair" }}
            />
          ))}

          {hover && (
            <g pointerEvents="none">
              <line x1={hover.x} x2={hover.x} y1={PAD.t} y2={PAD.t + innerH} stroke="#3a3a42" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx={hover.x} cy={hover.y} r="5" fill="#E50914" stroke="#050505" strokeWidth="2" />
            </g>
          )}
        </svg>

        {hover && (
          <div
            className="chart-tooltip"
            style={{
              left: `${(hover.x / W) * 100}%`,
              top: `${(hover.y / H) * 100}%`,
            }}
          >
            <span className="tooltip-date">{hover.label}</span>
            <span className="tooltip-value">{fmtBRL(hover.value)}</span>
          </div>
        )}
      </div>

      <div className="chart-axis">
        {series
          .filter((_, i) => i % Math.ceil(series.length / 7) === 0)
          .map((p) => (
            <span key={p.date}>{p.label}</span>
          ))}
      </div>
    </div>
  );
}
