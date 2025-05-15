import type { BecameSpeakerRequest } from "@/lib/types";
import { API_BASE_URL } from "@/lib/utils";
import NotFoundPage from "@/pages/NotFound";
import SpeakerRequest from "@/pages/manage/SpeakerRequest";
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/manage/speaker-request")({
  beforeLoad: async ({ context }) => {
    const userData = await context.auth.fetchUser();
    const isLoggedIn = !!userData;
    const userRole = userData?.role || "public";

    if (!isLoggedIn) {
      throw redirect({ to: "/auth/login" });
    }
    if (userRole !== "organizer" && userRole !== "superadmin") {
      throw redirect({ to: "/app" });
    }
  },
  loader: async () => {
    const requestCall = await fetch(
      `${API_BASE_URL}/api/speakers-request?status=open`,
      {
        credentials: "include",
      }
    );
    if (!requestCall.ok) {
      throw notFound();
    }

    const talksData = await requestCall.json();

    if (import.meta.env.DEV) {
      console.log("Données des requetes reçues:", talksData);
    }

    return {
      requests: talksData.data as BecameSpeakerRequest[],
      numberOfRequests: talksData.total,
    };
  },
  component: SpeakerRequest,
  errorComponent: NotFoundPage,
  notFoundComponent: NotFoundPage,
  gcTime: 0,
  shouldReload: false,
});
