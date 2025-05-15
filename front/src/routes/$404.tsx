import NotFoundPage from "@/pages/NotFound";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$404")({
  component: NotFoundPage,
});
