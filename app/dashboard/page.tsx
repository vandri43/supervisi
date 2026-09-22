import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminDashboard from "./_components/AdminDashboard";
import SupervisorDashboard from "./_components/SupervisorDashboard";
import GuruDashboard from "./_components/GuruDashboard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = session.user.role;

  if (role === "ADMIN") return <AdminDashboard session={session} />;
  if (role === "SUPERVISOR") return <SupervisorDashboard session={session} />;
  if (role === "GURU") return <GuruDashboard session={session} />;

  redirect("/unauthorized");
}

