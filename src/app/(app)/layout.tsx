import { getAuthUser } from "@/lib/server/auth";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-[#030305]">
      {children}
    </div>
  );
}
