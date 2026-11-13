import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import ConfiguracoesClient from "@/components/ConfiguracoesClient";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return <ConfiguracoesClient user={user} />;
}
