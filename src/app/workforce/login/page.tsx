import { redirect } from "next/navigation";

export default function WorkforceLoginRedirect() {
  redirect("/command-deck/login?redirect=%2Fworkforce");
}
