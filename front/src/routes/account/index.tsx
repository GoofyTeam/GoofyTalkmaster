import AccountPage from "@/pages/account/Index";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/account/")({
  component: AccountPage,
});
