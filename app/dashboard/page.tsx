import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardClient from "@/components/DashboardClient";
import { Hotbar } from "@/components/Nav";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const sales = await db.sale.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { amount: true, createdAt: true },
  });

  const total = sales.reduce((acc, s) => acc + s.amount, 0);
  const ticketMedio = sales.length > 0 ? total / sales.length : 0;

  const stats = {
    faturamento: total,
    ticketMedio,
    vendas: sales.length,
  };

  const points = sales.map((s) => ({
    date: s.createdAt.toISOString(),
    amount: s.amount,
  }));

  return (
    <>
      <DashboardClient stats={stats} sales={points} />
      <Hotbar userId={user.id} />
    </>
  );
}
