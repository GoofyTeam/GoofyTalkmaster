import { API_BASE_URL } from "@/lib/utils";
import BecomeSpeaker from "@/pages/account/BecomeSpeaker";
import { createFileRoute, notFound } from "@tanstack/react-router";

interface BecameSpeakerRequest {
  id: number;
  user_id: number;
  phone: string;
  description: string;
  status: "open" | "closed";
  created_at: string;
  updated_at: string;
}

export const Route = createFileRoute("/account/become-speaker")({
  loader: async () => {
    const requestCall = await fetch(`${API_BASE_URL}/api/speakers-request`, {
      credentials: "include",
    });
    if (!requestCall.ok) {
      throw notFound();
    }

    const talksData = await requestCall.json();

    if (import.meta.env.DEV) {
      console.log("Données des requetes reçues:", talksData);
    }

    return {
      requests: talksData.data as BecameSpeakerRequest[],
      numberOfRequests: talksData.total,
    };
  },
  component: BecomeSpeaker,
});
