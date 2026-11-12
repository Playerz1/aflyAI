import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [logCount, metricCount, lastLogin, recentLogs] = await Promise.all([
    db.activityLog.count({ where: { userId: user.id } }),
    db.metric.count({ where: { userId: user.id } }),
    db.user.findUnique({ where: { id: user.id }, select: { lastLogin: true } }),
    db.activityLog.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const stats = [
    { label: "Eventos registrados", value: logCount, hint: "logs de atividade" },
    { label: "Métricas salvas", value: metricCount, hint: "registros numéricos" },
    {
      label: "Último acesso",
      value: lastLogin?.lastLogin
        ? new Date(lastLogin.lastLogin).toLocaleDateString("pt-BR")
        : "—",
      hint: "data do último login",
    },
    { label: "Status da conta", value: "Ativa", hint: "plano atual" },
  ];

  return (
    <div className="fade-up">
      <header>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>
          Olá, {user.name.split(" ")[0]} 👋
        </h1>
        <p style={{ color: "var(--text-dim)", marginTop: 6 }}>
          Visão geral do seu painel administrativo.
        </p>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 28 }}>
        {stats.map((s) => (
          <div key={s.label} className="card" style={{ padding: 22 }}>
            <div style={{ fontSize: 12.5, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {s.label}
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, marginTop: 10, letterSpacing: "-0.02em" }}>{s.value}</div>
            <div style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 4 }}>{s.hint}</div>
          </div>
        ))}
      </section>

      <section className="card" style={{ marginTop: 24, overflow: "hidden" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Atividade recente</h2>
          <span className="badge badge-red pulse">ao vivo</span>
        </div>
        {recentLogs.length === 0 ? (
          <p style={{ padding: 24, color: "var(--text-mute)", fontSize: 14 }}>
            Nenhuma atividade ainda. Explore o painel para gerar registros.
          </p>
        ) : (
          <ul style={{ listStyle: "none" }}>
            {recentLogs.map((log) => (
              <li
                key={log.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "13px 20px",
                  borderBottom: "1px solid var(--border)",
                  fontSize: 14,
                }}
              >
                <span>
                  <span style={{ color: "var(--red)", fontWeight: 600 }}>{log.action}</span>
                  {log.detail ? ` — ${log.detail}` : ""}
                </span>
                <time style={{ color: "var(--text-mute)", fontSize: 12.5, whiteSpace: "nowrap" }}>
                  {new Date(log.createdAt).toLocaleString("pt-BR")}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
