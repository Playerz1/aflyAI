import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardShell from "@/components/DashboardShell";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [sales, products] = await Promise.all([
    db.sale.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      select: { amount: true, createdAt: true },
    }),
    db.infoproduct.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        productSales: {
          orderBy: { createdAt: "desc" },
        },
      },
    }),
  ]);

  const productSales = products.flatMap((p) => (p.productSales || []).map((s: any) => ({ amount: s.amount, createdAt: s.createdAt })));
  const allSales = [...sales, ...productSales].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const allTotal = allSales.reduce((acc: number, s: any) => acc + s.amount, 0);
  const allTicket = allSales.length > 0 ? allTotal / allSales.length : 0;

  const stats = {
    faturamento: allTotal,
    ticketMedio: allTicket,
    vendas: allSales.length,
  };

  const points = allSales.map((s: any) => ({
    date: new Date(s.createdAt).toISOString(),
    amount: s.amount,
  }));

  return <DashboardShell user={user} stats={stats} sales={points} products={products} />;
}
