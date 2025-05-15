import { PendingCards } from "@/components/manage/PendingCards";
import { API_BASE_URL } from "@/lib/utils";
import type { PendingTalk } from "@/types/talk";
import { useRouter } from "@tanstack/react-router";
import { useLoaderData } from "@tanstack/react-router";

type LoaderData = {
  pendingTalks: PendingTalk[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    itemsPerPage: number;
  };
};

export default function OrganizerPage() {
  const router = useRouter();

  // Récupérer les données chargées par le router
  const routeData = useLoaderData({
    from: "/manage/organizer",
    structuralSharing: false,
  }) as LoaderData;

  // Fonction pour valider un talk
  const handleValidateTalk = async (
    talkId: number,
    room: string,
    time: string,
  ) => {
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

      // D'abord, accepter le talk
      const statusResponse = await fetch(
        `${API_BASE_URL}/api/talks/${talkId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-XSRF-TOKEN": decodeURIComponent(csrfToken),
          },
          credentials: "include",
          body: JSON.stringify({
            status: "accepted",
          }),
        },
      );

      if (!statusResponse.ok) {
        const errorData = await statusResponse.json();
        throw new Error(
          errorData.message ||
            `Erreur ${statusResponse.status}: ${statusResponse.statusText}`,
        );
      }

      // Puis, programmer la salle et l'horaire
      if (!room.includes("-")) {
        throw new Error(
          `Format de salle invalide: "${room}". Format attendu "date-roomId".`,
        );
      }

      const [date, roomId] = room.split("-"); // Si room contient l'ID de la salle
      const [startTime] = time.split("-"); // Si time contient l'heure de début

      const scheduleResponse = await fetch(
        `${API_BASE_URL}/api/talks/${talkId}/schedule`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-XSRF-TOKEN": decodeURIComponent(csrfToken),
          },
          credentials: "include",
          body: JSON.stringify({
            room_id: roomId || room,
            scheduled_date: date || new Date().toISOString().split("T")[0],
            start_time: startTime || time,
          }),
        },
      );

      if (!scheduleResponse.ok) {
        const errorData = await scheduleResponse.json();
        throw new Error(
          errorData.message ||
            `Erreur ${scheduleResponse.status}: ${scheduleResponse.statusText}`,
        );
      }

      // Invalider le cache du router pour recharger les données
      router.invalidate();
    } catch (error) {
      console.error(`Erreur lors de la validation du talk ${talkId}:`, error);
    }
  };

  // Fonction pour refuser un talk
  const handleRejectTalk = async (talkId: number) => {
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
        `${API_BASE_URL}/api/talks/${talkId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-XSRF-TOKEN": decodeURIComponent(csrfToken),
          },
          credentials: "include",
          body: JSON.stringify({
            status: "rejected",
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Erreur ${response.status}: ${response.statusText}`,
        );
      }

      // Invalider le cache du router pour recharger les données
      router.invalidate();
    } catch (error) {
      console.error(`Erreur lors du rejet du talk ${talkId}:`, error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Espace Gestionnaire</h1>
      <div className="flex gap-4">
        <PendingCards
          pendingTalks={routeData.pendingTalks}
          pagination={routeData.pagination}
          onValidate={handleValidateTalk}
          onReject={handleRejectTalk}
        />
      </div>
    </div>
  );
}
