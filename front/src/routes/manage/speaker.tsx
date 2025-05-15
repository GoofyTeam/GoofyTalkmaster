import { type ApiTalk, mapApiTalkToTalk } from "@/lib/mappers";
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
    try {
      // Obtenir un cookie CSRF frais
      await fetch(`${API_BASE_URL}/api/sanctum/csrf-cookie`, {
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      const csrfToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="))
        ?.split("=")[1];

      if (!csrfToken) {
        console.error("Impossible de récupérer le token CSRF");
        throw new Error("Impossible de récupérer le token CSRF");
      }

      // Récupérer les talks
      const talksCall = await fetch(`${API_BASE_URL}/api/talks?per_page=100`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-XSRF-TOKEN": decodeURIComponent(csrfToken),
        },
        credentials: "include",
      });

      if (talksCall.status === 401) {
        console.error("Session expirée ou non autorisé");
        throw redirect({ to: "/auth/login" });
      }

      if (talksCall.status === 404) {
        console.error("Ressource non trouvée");
        throw notFound();
      }

      if (!talksCall.ok) {
        const errorData = await talksCall.json();
        console.error(
          `Erreur ${talksCall.status}: ${talksCall.statusText}`,
          errorData
        );
        throw notFound();
      }

      const talksData = await talksCall.json();

      if (import.meta.env.DEV) {
        console.log("Données des talks reçues:", talksData);
      }

      // Transformation des données brutes en utilisant le mapper
      const allTalks: Talk[] = talksData.data.map((apiTalk: ApiTalk) =>
        mapApiTalkToTalk(apiTalk)
      );

      // Filtrer uniquement les talks programmés (scheduled)
      const scheduledTalks = allTalks.filter(
        (talk) => talk.status === "scheduled"
      );

      return {
        talks: allTalks,
        numberOfTalks: talksData.total,
        onlyAcceptedTalks: scheduledTalks,
      };
    } catch (error) {
      // Si c'est déjà une erreur de redirection ou notFound, la laisser se propager
      if (
        error instanceof Error &&
        (error.message.includes("redirect") ||
          error.message.includes("notFound"))
      ) {
        throw error;
      }

      // Sinon, logger l'erreur et renvoyer vers une page d'erreur
      console.error("Erreur lors du chargement des talks:", error);
      throw notFound();
    }
  },
  component: Speaker,
  notFoundComponent: NotFoundPage,
  gcTime: 0,
  shouldReload: false,
});
