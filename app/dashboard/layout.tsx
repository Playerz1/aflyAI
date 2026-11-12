import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  return (
    <div style={{ display: "flex" }}>
      <Sidebar user={{ name: user.name, email: user.email }} />
      <main style={{ flex: 1, minWidth: 0, padding: "32px 40px", background: "var(--bg)" }}>
        {children}
      </main>
    </div>
  );
}
