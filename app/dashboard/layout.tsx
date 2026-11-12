import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/Nav";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  return (
    <div className="dash-shell">
      <Sidebar user={{ name: user.name }} />
      <main className="dash-main">{children}</main>
    </div>
  );
}
