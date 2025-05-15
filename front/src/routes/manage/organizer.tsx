import { type ApiTalk, mapApiTalkToPendingTalk } from "@/lib/mappers";
import { API_BASE_URL } from "@/lib/utils";
import OrganizerPage from "@/pages/manage/organizer/Index";
import type { PendingTalk } from "@/types/talk";
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

// Définir le type pour la route
export const Route = createFileRoute("/manage/organizer")({
  // Vérification des permissions avant le chargement
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
  // Définir les données à charger
  loader: async () => {
    // Valeur par défaut
    const pageNumber = 1;
    const itemsPerPage = 12; // Nombre d'éléments par page augmenté pour éviter trop de requêtes

    try {
      // Obtenir un cookie CSRF frais
      await fetch(`${API_BASE_URL}/api/sanctum/csrf-cookie`, {
        credentials: "include",
      });

      const csrfToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="))
        ?.split("=")[1];

      if (!csrfToken) {
        throw new Error("Impossible de récupérer le token CSRF");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/talks?status=pending&sort_by=created_at&sort_direction=desc&per_page=50`,
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

      // Si l'utilisateur n'est pas autorisé (401) ou la session a expiré
      if (response.status === 401) {
        console.error("Session expirée ou non autorisé");
        throw redirect({ to: "/auth/login" });
      }

      // Si la ressource n'est pas trouvée (404)
      if (response.status === 404) {
        console.error("Ressource non trouvée");
        throw notFound();
      }

      // Pour toute autre erreur
      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          `Erreur ${response.status}: ${response.statusText}`,
          errorData,
        );
        throw notFound();
      }

      const data = await response.json();

      // Transformation des données de l'API au format PendingTalk
      const pendingTalks: PendingTalk[] = data.data.map((apiTalk: ApiTalk) =>
        mapApiTalkToPendingTalk(apiTalk),
      );

      return {
        pendingTalks,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(data.meta?.total / itemsPerPage) || 1,
          totalItems: data.meta?.total || pendingTalks.length,
          hasNextPage: data.meta?.current_page < data.meta?.last_page,
          hasPreviousPage: data.meta?.current_page > 1,
          itemsPerPage,
        },
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
  // Composant à afficher
  component: OrganizerPage,
});
