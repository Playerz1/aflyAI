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

  const W = 700;
  const H = 220;
  const PAD = { t: 24, r: 24, b: 24, l: 40 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;

  const maxVal = Math.max(...series.map((p) => p.amount), 1) * 1.1;
  const pts = series.map((p, i) => ({
    ...p,
    x: PAD.l + (i / Math.max(series.length - 1, 1)) * innerW,
    y: PAD.t + innerH - (p.amount / maxVal) * innerH,
  }));

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

  const total = series.reduce((a, p) => a + p.amount, 0);

  return (
    <div className="card chart-card" style={{ padding: 20 }}>
      <div className="chart-head" style={{ marginBottom: 16 }}>
        <div>
          <h2 className="chart-title">Faturamento</h2>
          <p className="chart-sub">{fmtBRL(total)} no periodo</p>
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
              <stop offset="0%" stopColor="#B8202E" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#B8202E" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
            const v = maxVal * f;
            const y = PAD.t + innerH - (v / maxVal) * innerH;
            return (
              <g key={i}>
                <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="#1f1f1f" strokeWidth="1" />
                <text x={PAD.l - 6} y={y + 4} fill="#71717A" fontSize="10" textAnchor="end">
                  {v >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v)}
                </text>
              </g>
            );
          })}

          {/* Y axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
            const v = maxVal * f;
            const y = PAD.t + innerH - (v / maxVal) * innerH;
            return (
              <text key={i} x={PAD.l - 10} y={y + 4} fill="#71717A" fontSize="10" textAnchor="end">
                {Math.round(v)}
              </text>
            );
          })}

          <path d={linePath} fill="none" stroke="#B8202E" strokeWidth="2" strokeLinecap="round" />
          <path d={`${linePath} L ${pts[pts.length - 1]?.x ?? 0} ${PAD.t + innerH} L ${pts[0]?.x ?? 0} ${PAD.t + innerH} Z`} fill="url(#areaFill)" />

          {/* Hover hit areas */}
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
              <line x1={hover.x} x2={hover.x} y1={PAD.t} y2={PAD.t + innerH} stroke="#2c2c2c" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx={hover.x} cy={hover.y} r="4" fill="#B8202E" stroke="#090909" strokeWidth="1.5" />
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
          .filter((_, i) => i % Math.ceil(series.length / 6) === 0 || i === series.length - 1)
          .map((p) => (
            <span key={p.date}>{p.label}</span>
          ))}
      </div>
    </div>
  );
}
