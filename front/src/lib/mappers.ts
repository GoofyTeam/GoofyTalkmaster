import type { PendingTalk, Talk } from "@/types/talk";

// Type pour les talks reçus de l'API
export type ApiTalk = {
  id: number;
  title: string;
  subject: string;
  description: string;
  speaker_id: number;
  speaker?: {
    id: number;
    name: string;
    email?: string;
  };
  status?: string;
  scheduled_date?: string;
  start_time?: string;
  room?: string;
};

/**
 * Convertit un talk API en PendingTalk
 */
export const mapApiTalkToPendingTalk = (apiTalk: ApiTalk): PendingTalk => ({
  id: apiTalk.id,
  title: apiTalk.title,
  topic: apiTalk.subject,
  description: apiTalk.description,
  speaker: {
    id: apiTalk.speaker_id,
    name: apiTalk.speaker ? apiTalk.speaker.name : "Inconnu",
  },
});

/**
 * Convertit un talk API en Talk complet
 */
export const mapApiTalkToTalk = (apiTalk: ApiTalk): Talk => ({
  id: apiTalk.id,
  title: apiTalk.title,
  topic: apiTalk.subject,
  description: apiTalk.description,
  speaker: {
    id: apiTalk.speaker_id,
    name: apiTalk.speaker ? apiTalk.speaker.name : "Inconnu",
    email: apiTalk.speaker?.email,
  },
  status: apiTalk.status as "pending" | "accepted" | "rejected" | undefined,
  scheduledDate: apiTalk.scheduled_date,
  startTime: apiTalk.start_time,
  room: apiTalk.room,
});
