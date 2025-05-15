import type { PendingTalk, Talk } from "@/types/talk";

/**
 * Obtient le libellé d'un statut de talk
 */
export const getStatusLabel = (status: string | undefined) => {
  switch (status) {
    case "pending":
      return "En attente";
    case "accepted":
      return "Accepté";
    case "rejected":
      return "Refusé";
    case "scheduled":
      return "Programmé";
    default:
      return "";
  }
};

/**
 * Obtient la classe CSS pour l'affichage d'un statut
 */
export const getStatusClass = (status: string | undefined) => {
  switch (status) {
    case "pending":
      return "bg-yellow-500 text-yellow-50";
    case "accepted":
      return "bg-green-500 text-green-50";
    case "rejected":
      return "bg-red-500 text-red-50";
    case "scheduled":
      return "bg-blue-500 text-blue-50";
    default:
      return "bg-primary text-primary-foreground";
  }
};

/**
 * Conversion depuis PendingTalk vers Talk
 * Note: déplacé depuis components/Talk.tsx pour centralisation
 */
export const convertToTalk = (pendingTalk: PendingTalk): Talk => {
  return {
    id: pendingTalk.id,
    title: pendingTalk.title,
    topic: pendingTalk.topic,
    description: pendingTalk.description,
    speaker: pendingTalk.speaker,
    status: "pending",
  };
};

/**
 * Conversion depuis Talk vers PendingTalk
 * Note: déplacé depuis components/Talk.tsx pour centralisation
 */
export const convertToPendingTalk = (talk: Talk): PendingTalk => {
  return {
    id: talk.id,
    title: talk.title,
    topic: talk.topic,
    description: talk.description || "",
    speaker: {
      id: talk.speaker.id,
      name: talk.speaker.name,
    },
  };
};
