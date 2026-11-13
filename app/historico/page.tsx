import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import HistoryClient from "@/components/HistoryClient";

export const dynamic = "force-dynamic";

export default async function HistoricoPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const products = await db.infoproduct.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      productSales: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return (
    <>
      <HistoryClient products={products} userId={user.id} />
    </>
  );
}
