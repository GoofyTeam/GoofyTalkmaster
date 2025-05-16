import Homepage from "@/pages/homepage/Index";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/")({
  component: Homepage,
});
