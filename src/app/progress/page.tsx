import { redirect } from "next/navigation";

/**
 * Progress lives on the profile page; keep the old path working.
 */
export default function ProgressPage() {
  redirect("/profile");
}
