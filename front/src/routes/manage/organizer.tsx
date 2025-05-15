import type { PendingTalk } from "@/components/Talk";
import { API_BASE_URL } from "@/lib/utils";
import OrganizerPage from "@/pages/manage/organizer/Index";
import { createFileRoute } from "@tanstack/react-router";

// Définir le type pour la route
export const Route = createFileRoute("/manage/organizer")({
  component: OrganizerPage,
  // Définir les données à charger
  loader: async ({ context }) => {
    // Valeur par défaut
    const pageNumber = 1;
    const itemsPerPage = 12; // Nombre d'éléments par page augmenté pour éviter trop de requêtes

    // Vérifier si l'utilisateur est connecté
    const userData = await context.auth.fetchUser();
    if (
      !userData ||
      (userData.role !== "organizer" && userData.role !== "superadmin")
    ) {
      throw new Error("Unauthorized");
    }

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
        throw new Error("CSRF token not found");
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Erreur ${response.status}: ${response.statusText}`,
        );
      }

      const data = await response.json();

      // Transformation des données de l'API au format PendingTalk
      const pendingTalks: PendingTalk[] = data.data.map(
        (talk: {
          id: number;
          title: string;
          subject: string;
          description: string;
          speaker_id: number;
          speaker?: { id: number; name: string };
        }) => ({
          id: talk.id,
          title: talk.title,
          topic: talk.subject,
          description: talk.description,
          speaker: {
            id: talk.speaker_id,
            name: talk.speaker ? talk.speaker.name : "Inconnu",
          },
        }),
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
      console.error("Erreur lors du chargement des talks:", error);
      return {
        pendingTalks: [],
        pagination: {
          currentPage: pageNumber,
          totalPages: 1,
          totalItems: 0,
          hasNextPage: false,
          hasPreviousPage: false,
          itemsPerPage,
        },
      };
    }
  },
  // Mettre à jour automatiquement toutes les 5 minutes
  loaderDeps: () => {
    return {
      timestamp: Math.floor(Date.now() / 300000), // Toutes les 5 minutes
    };
  },
});
