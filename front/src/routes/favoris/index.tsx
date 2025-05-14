import FavorisPage from "@/pages/favoris/Index";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/favoris/")({
  beforeLoad: async ({ context }) => {
    const userData = await context.auth.fetchUser();
    if (!userData) {
      throw redirect({
        to: "/auth/login",
        replace: true,
      });
    }
    return { userData };
  },
  component: FavorisPage,
});
