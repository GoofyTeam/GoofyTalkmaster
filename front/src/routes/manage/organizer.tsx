import {
  type ApiTalk,
  mapApiTalkToPendingTalk,
  mapApiTalkToTalk,
} from "@/lib/mappers";
import { API_BASE_URL } from "@/lib/utils";
import OrganizerPage from "@/pages/manage/organizer/Index";
import type { PendingTalk, Talk } from "@/types/talk";
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
        throw new Error("Impossible de récupérer le token CSRF");
      }

      // Préparation des requêtes pour les exécuter en parallèle
      const fetchPendingTalks = fetch(
        `${API_BASE_URL}/api/talks?status=pending&sort_by=created_at&sort_direction=desc&per_page=50`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-XSRF-TOKEN": decodeURIComponent(csrfToken),
          },
          credentials: "include",
        }
      );

      const fetchAllTalks = fetch(`${API_BASE_URL}/api/talks?per_page=100`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-XSRF-TOKEN": decodeURIComponent(csrfToken),
        },
        credentials: "include",
      });

      // Exécution des requêtes en parallèle
      const [pendingResponse, allTalksResponse] = await Promise.all([
        fetchPendingTalks,
        fetchAllTalks,
      ]);

      // Si l'utilisateur n'est pas autorisé (401) ou la session a expiré
      if (pendingResponse.status === 401 || allTalksResponse.status === 401) {
        console.error("Session expirée ou non autorisé");
        throw redirect({ to: "/auth/login" });
      }

      // Si la ressource n'est pas trouvée (404)
      if (pendingResponse.status === 404 || allTalksResponse.status === 404) {
        console.error("Ressource non trouvée");
        throw notFound();
      }

      // Pour toute autre erreur
      if (!pendingResponse.ok || !allTalksResponse.ok) {
        const errorData = await (
          pendingResponse.ok ? allTalksResponse : pendingResponse
        ).json();
        console.error(
          `Erreur ${pendingResponse.status}: ${pendingResponse.statusText}`,
          errorData
        );
        throw notFound();
      }

      // Traitement des réponses en parallèle
      const [pendingData, allTalksData] = await Promise.all([
        pendingResponse.json(),
        allTalksResponse.json(),
      ]);

      // Transformation des données de l'API au format PendingTalk
      const pendingTalks: PendingTalk[] = pendingData.data.map(
        (apiTalk: ApiTalk) => mapApiTalkToPendingTalk(apiTalk)
      );

      // Transformation de tous les talks
      const allTalks: Talk[] = allTalksData.data.map((apiTalk: ApiTalk) =>
        mapApiTalkToTalk(apiTalk)
      );

      // Filtrer uniquement les talks programmés (scheduled)
      const onlyAcceptedTalks = allTalks.filter(
        (talk) => talk.status === "scheduled"
      );

      if (import.meta.env.DEV) {
        console.log(
          `Tous les talks: ${allTalks.length}, Talks programmés: ${onlyAcceptedTalks.length}`
        );
      }
      return {
        pendingTalks,
        allTalks,
        onlyAcceptedTalks,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(pendingData.meta?.total / itemsPerPage) || 1,
          totalItems: pendingData.meta?.total || pendingTalks.length,
          hasNextPage:
            pendingData.meta?.current_page < pendingData.meta?.last_page,
          hasPreviousPage: pendingData.meta?.current_page > 1,
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
