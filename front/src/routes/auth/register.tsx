import Register from "@/pages/auth/Register";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/register")({
  component: Register,
});
