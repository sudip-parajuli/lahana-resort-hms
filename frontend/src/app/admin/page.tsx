import { redirect } from "next/navigation";

export default function AdminRedirect() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  redirect(`${backendUrl}/admin/`);
}
