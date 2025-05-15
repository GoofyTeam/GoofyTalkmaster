import { API_BASE_URL } from "@/lib/utils";
import NotFoundPage from "@/pages/NotFound";
import Speaker from "@/pages/manage/Speaker";
import type { Talk } from "@/types/talk";
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/manage/speaker")({
  beforeLoad: async ({ context }) => {
    const userData = await context.auth.fetchUser();
    const isLoggedIn = !!userData;
    const userRole = userData?.role || "public";

    if (!isLoggedIn) {
      throw redirect({ to: "/auth/login" });
    }
    if (isLoggedIn && userRole === "public") {
      throw redirect({ to: "/app" });
    }
  },
  loader: async () => {
    const talksCall = await fetch(`${API_BASE_URL}/api/talks?per_page=100`, {
      credentials: "include",
    });
    if (!talksCall.ok) {
      throw notFound();
    }

    const talksData = await talksCall.json();

    if (import.meta.env.DEV) {
      console.log("Données des talks reçues:", talksData);
    }

    return {
      talks: talksData.data,
      numberOfTalks: talksData.total,
      onlyAcceptedTalks: talksData.data.filter(
        (talk: Talk) => talk.status === "accepted",
      ),
    };
  },
  component: Speaker,
  notFoundComponent: NotFoundPage,
  gcTime: 0,
  shouldReload: false,
});
