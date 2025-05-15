import { PendingCards } from "@/components/manage/PendingCards";
import UserPlanning from "@/components/user-planning";
import { API_BASE_URL } from "@/lib/utils";
import type { PendingTalk, Talk } from "@/types/talk";
import { useRouter } from "@tanstack/react-router";
import { useLoaderData } from "@tanstack/react-router";
import { toast } from "sonner";

type LoaderData = {
  pendingTalks: PendingTalk[];
  allTalks: Talk[];
  onlyAcceptedTalks: Talk[];
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

  // Log pour vérifier si nous avons des talks

  // Fonction pour valider un talk
  const handleValidateTalk = async (
    talkId: number,
    room: string,
    time: string,
  ) => {
    try {
      // Démarrer la procédure de validation
      toast.info(`Validation du talk #${talkId} en cours...`);

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
        toast.error("Erreur d'authentification : token CSRF introuvable");
        throw new Error("CSRF token not found");
      }

      // Extraire les informations de la date et de la salle
      if (!room.includes(":")) {
        toast.error(
          `Format de salle invalide: "${room}". Format attendu "roomId:date".`,
        );
        throw new Error(
          `Format de salle invalide: "${room}". Format attendu "roomId:date".`,
        );
      }

      const [roomId, date] = room.split(":");

      // Vérifier que la date est au format Y-m-d
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        toast.error(
          `Format de date invalide: "${date}". Format attendu: YYYY-MM-DD`,
        );
        throw new Error(
          `Format de date invalide: "${date}". Format attendu: YYYY-MM-DD`,
        );
      }

      // Extraire les heures de début et fin
      let startTime: string;
      let endTime: string;

      if (time.includes("|")) {
        const timeParts = time.split("|");

        if (timeParts.length >= 2) {
          startTime = timeParts[0].trim();
          endTime = timeParts[1].trim();
        } else {
          throw new Error(
            `Format d'heure invalide (parties insuffisantes): "${time}"`,
          );
        }
      } else if (time.includes(":")) {
        startTime = time.trim();
        // Calculer l'heure de fin (+ 90 minutes)
        const [hours, minutes] = startTime.split(":").map(Number);
        let endHours = hours;
        let endMinutes = minutes + 90;

        if (endMinutes >= 60) {
          endHours += Math.floor(endMinutes / 60);
          endMinutes %= 60;
        }

        endTime = `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;
      } else {
        throw new Error(`Format d'heure invalide: "${time}"`);
      }

      // S'assurer que les heures sont strictement au format H:i (HH:MM)
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        throw new Error(`Format d'heure invalide. Format attendu: HH:MM`);
      }

      // Extraire uniquement les parties HH:MM si des informations supplémentaires sont présentes
      const extractTimeOnly = (timeStr: string): string => {
        const match = timeStr.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]/);
        return match ? match[0] : timeStr;
      };

      startTime = extractTimeOnly(startTime);
      endTime = extractTimeOnly(endTime);

      // Vérifier que l'ID de la salle est un nombre valide
      const roomIdNumber = Number.parseInt(roomId, 10);
      if (Number.isNaN(roomIdNumber) || roomIdNumber <= 0) {
        throw new Error(
          `ID de salle invalide: "${roomId}". Doit être un nombre positif.`,
        );
      }

      // ÉTAPE 0: Récupérer les données actuelles du talk
      const talkInfoResponse = await fetch(
        `${API_BASE_URL}/api/talks/${talkId}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-XSRF-TOKEN": decodeURIComponent(csrfToken),
          },
          credentials: "include",
        },
      );

      if (!talkInfoResponse.ok) {
        throw new Error(
          `Erreur lors de la récupération des informations du talk: ${talkInfoResponse.status}`,
        );
      }

      // Extraire les données actuelles du talk
      const initialTalkData = await talkInfoResponse.json();

      // ÉTAPE 1: Vérifier si le talk est encore en statut "pending"
      if (initialTalkData.status !== "pending") {
        toast.error(
          "Ce talk n'est plus en attente et ne peut pas être modifié",
        );
        throw new Error(
          "Ce talk n'est plus en attente et ne peut pas être modifié",
        );
      }

      // ÉTAPE 2: Accepter le talk (changer son statut en "accepted")
      const statusResponse = await fetch(
        `${API_BASE_URL}/api/talks/${talkId}/status`,
        {
          method: "PUT",
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

      // Si le changement de statut échoue
      if (!statusResponse.ok) {
        try {
          const responseText = await statusResponse.text();
          toast.error(`Erreur lors du changement de statut: ${responseText}`);
          throw new Error(
            `Erreur lors du changement de statut: ${responseText}`,
          );
        } catch (e) {
          toast.error(
            `Erreur ${statusResponse.status}: ${statusResponse.statusText}`,
          );
          throw new Error(
            `Erreur ${statusResponse.status}: ${statusResponse.statusText}`,
          );
        }
      }

      // ÉTAPE 3: Programmer le talk avec toutes les informations
      const schedulingData = {
        // Préserver les données actuelles du talk
        title: initialTalkData.title,
        subject: initialTalkData.subject,
        description: initialTalkData.description,
        level: initialTalkData.level || "beginner",
        status: "scheduled", // Définir directement le statut comme "scheduled"

        // Ajouter les nouvelles données de programmation
        scheduled_date: date,
        start_time: startTime,
        end_time: endTime,
        room_id: roomIdNumber,
      };

      const scheduleResponse = await fetch(
        `${API_BASE_URL}/api/talks/${talkId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-XSRF-TOKEN": decodeURIComponent(csrfToken),
          },
          credentials: "include",
          body: JSON.stringify(schedulingData),
        },
      );

      // Afficher la réponse brute en cas d'erreur pour debug
      if (!scheduleResponse.ok) {
        try {
          const responseText = await scheduleResponse.text();
          toast.error(`Erreur lors de la programmation: ${responseText}`);
          throw new Error(`Erreur lors de la programmation: ${responseText}`);
        } catch (e) {
          toast.error(
            `Erreur ${scheduleResponse.status}: ${scheduleResponse.statusText}`,
          );
          throw new Error(
            `Erreur ${scheduleResponse.status}: ${scheduleResponse.statusText}`,
          );
        }
      }

      // Vérifier que la programmation a réussi en analysant la réponse
      const scheduleData = await scheduleResponse.json();

      // Vérifier que le talk a bien été programmé
      const updatedTalkData = scheduleData.talk || scheduleData;

      // Vérifier si la programmation a réussi
      if (
        !scheduleData.message?.includes("success") &&
        (!updatedTalkData.scheduled_date ||
          !updatedTalkData.start_time ||
          !updatedTalkData.room_id)
      ) {
        toast.error(
          "La programmation n'a pas réussi correctement. Vérifiez les données.",
        );
        throw new Error(
          "Le talk n'a pas été correctement programmé. Vérifiez les données.",
        );
      }

      // Message de réussite final
      toast.success(`Talk #${talkId} validé et programmé avec succès !`);

      // Actualiser les données
      router.invalidate();

      // Actualiser les données manuellement après un court délai
      setTimeout(() => {
        router.invalidate();
      }, 500);
    } catch (error) {
      toast.error(
        `Erreur: ${error instanceof Error ? error.message : "Une erreur inconnue est survenue"}`,
      );
      console.error(`Erreur lors de la validation du talk ${talkId}:`, error);
    }
  };

  // Fonction pour refuser un talk
  const handleRejectTalk = async (talkId: number) => {
    try {
      toast.info(`Refus du talk #${talkId} en cours...`);

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
        toast.error("Erreur d'authentification : token CSRF introuvable");
        throw new Error("CSRF token not found");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/talks/${talkId}/status`,
        {
          method: "PUT",
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
        toast.error(
          errorData.message ||
            `Erreur ${response.status}: ${response.statusText}`,
        );
        throw new Error(
          errorData.message ||
            `Erreur ${response.status}: ${response.statusText}`,
        );
      }

      toast.success(`Le talk #${talkId} a été refusé avec succès`);

      // Invalider le cache du router pour recharger les données
      router.invalidate();

      // Actualiser les données manuellement après un court délai
      setTimeout(() => {
        router.invalidate();
      }, 500);
    } catch (error) {
      toast.error(
        `Erreur: ${error instanceof Error ? error.message : "Une erreur inconnue est survenue"}`,
      );
      console.error(`Erreur lors du rejet du talk ${talkId}:`, error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Espace Gestionnaire</h1>
      <div className="flex flex-col gap-4">
        <PendingCards
          pendingTalks={routeData.pendingTalks}
          pagination={routeData.pagination}
          onValidate={handleValidateTalk}
          onReject={handleRejectTalk}
        />
        <UserPlanning talks={routeData.onlyAcceptedTalks} />
      </div>
    </div>
  );
}
