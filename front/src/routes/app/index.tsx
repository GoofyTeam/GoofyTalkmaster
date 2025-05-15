import { createFileRoute } from "@tanstack/react-router";
import Homepage from "@/pages/homepage/Index";

export const Route = createFileRoute("/app/")({
  component: Homepage,
});
