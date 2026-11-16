import { redirect } from "next/navigation";

export default function ApiOverviewRedirectPage() {
  redirect("/dashboard/api-management?tab=overview");
}
