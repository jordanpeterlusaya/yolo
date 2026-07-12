import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { getAllProperties } from "@/lib/properties";
import AdminDashboard from "@/components/AdminDashboard";

export default async function AdminDashboardPage() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin");

  const properties = await getAllProperties();

  return <AdminDashboard initialProperties={properties} />;
}
