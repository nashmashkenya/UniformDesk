import { redirect } from "next/navigation";

/** School purchase / admin setup moved to the supplier portal. */
export function redirectRetiredSchoolRoute() {
  redirect("/");
}
