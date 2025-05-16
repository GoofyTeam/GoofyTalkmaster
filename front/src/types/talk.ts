// Types pour les présentations/conférences (format interne à l'application)
export type Talk = {
  id: number;
  title: string;
  topic: string; // Correspond à 'subject' dans l'API
  description?: string;
  speaker: {
    id: number;
    name: string;
    email?: string;
  };
  status?: "pending" | "accepted" | "rejected" | "scheduled";
  level?: "beginner" | "intermediate" | "advanced";
  scheduledDate?: string; // Correspond à scheduled_date dans l'API
  startTime?: string; // Correspond à start_time dans l'API
  endTime?: string; // Correspond à end_time dans l'API
  room?: string;
};

// Type pour les talks en attente de validation
export type PendingTalk = {
  id: number;
  title: string;
  topic: string; // Correspond à 'subject' dans l'API
  description: string;
  speaker: {
    id: number;
    name: string;
  };
};
