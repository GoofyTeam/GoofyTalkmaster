import { mapApiTalkToTalk } from "@/lib/mappers";
import { API_BASE_URL } from "@/lib/utils";
import NotFoundPage from "@/pages/NotFound";
import AccountPage from "@/pages/account/Index";
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/account/")({
  loader: async () => {
    // /api/user/favorites

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
      const talksCall = await fetch(
        `${API_BASE_URL}/api/user/favorites?per_page=100`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-XSRF-TOKEN": decodeURIComponent(csrfToken),
          },
          credentials: "include",
        },
      );

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
          errorData,
        );
        throw notFound();
      }

      const talksData = await talksCall.json();

      if (import.meta.env.DEV) {
        console.log("Données des talks reçues:", talksData);
      }

      return {
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        favoriteTalks: talksData.data.map((talk: any) => ({
          ...mapApiTalkToTalk(talk.talk),
        })),
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
  component: AccountPage,
  notFoundComponent: NotFoundPage,
  gcTime: 0,
  shouldReload: false,
});
