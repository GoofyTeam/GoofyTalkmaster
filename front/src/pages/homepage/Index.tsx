import { TalkCard } from "@/components/Talk";
import { type Filters, TalkFilters } from "@/components/TalkFilters";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { API_BASE_URL } from "@/lib/utils";
import type { Talk } from "@/types/talk";
import { Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface RawTalk {
  id: number;
  title: string;
  topic: string;
  description?: string;
  speaker: { id: number; name: string };
  status?: Talk["status"];
  scheduled_date?: string;
  start_time?: string;
  room?: string;
  level?: string;
}

type ApiResponse = { data: RawTalk[] } | RawTalk[];

export default function Homepage() {
  const [talks, setTalks] = useState<Talk[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>({});
  const [selectedTalk, setSelectedTalk] = useState<Talk | null>(null);

  const fetchTalks = useCallback(async () => {
    setLoading(true);
    try {
      const {
        search: fSearch,
        subject: fSubject,
        date: fDate,
        room_id: fRoomId,
        level: fLevel,
        status: fStatus,
      } = filters;

      const params = new URLSearchParams();
      if (fSearch) params.set("search", fSearch);
      if (fSubject) params.set("subject", fSubject);
      if (fDate) params.set("date", fDate);
      if (fRoomId) params.set("room_id", fRoomId);
      if (fLevel) params.set("level", fLevel);
      if (fStatus) params.set("status", fStatus);
      params.set("per_page", "32");
      params.set("sort_by", "scheduled_date");
      params.set("sort_direction", "asc");

      const res = await fetch(
        `${API_BASE_URL}/api/public/talks?${params.toString()}`,
        { headers: { Accept: "application/json" } },
      );
      if (!res.ok) throw new Error("Erreur fetching talks");

      const json = (await res.json()) as ApiResponse;

      const rawArray: RawTalk[] = Array.isArray(json) ? json : json.data;

      const mapped: Talk[] = rawArray.map((t) => ({
        id: t.id,
        title: t.title,
        topic: t.topic,
        description: t.description,
        speaker: t.speaker,
        status: t.status,
        scheduledDate: t.scheduled_date ?? "",
        startTime: t.start_time ?? "",
        room: t.room ?? "",
        level:
          t.level === "beginner" ||
          t.level === "intermediate" ||
          t.level === "advanced"
            ? t.level
            : undefined,
      }));

      let filtered = mapped;
      if (fSearch) {
        const q = fSearch.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.topic.toLowerCase().includes(q),
        );
      }
      if (fSubject) {
        filtered = filtered.filter((t) => t.topic === fSubject);
      }
      if (fRoomId) {
        filtered = filtered.filter((t) => t.room === fRoomId);
      }
      if (fDate) {
        filtered = filtered.filter(
          (t) =>
            typeof t.scheduledDate === "string" &&
            t.scheduledDate.startsWith(fDate),
        );
      }
      if (fLevel) {
        filtered = filtered.filter((t) => t.level === fLevel);
      }
      if (fStatus) {
        filtered = filtered.filter((t) => t.status === fStatus);
      }

      setTalks(filtered);
    } catch (err) {
      console.error(err);
      setTalks([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const addToFavorites = useCallback(async (talk: Talk) => {
    try {
      const csrfResponse = await fetch(
        `${API_BASE_URL}/api/sanctum/csrf-cookie`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          credentials: "include",
        },
      );

      if (!csrfResponse.ok) {
        const errorData = await csrfResponse.json();
        throw new Error(
          errorData.message || "Erreur lors de la récupération du CSRF token",
        );
      }

      const csrfToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="))
        ?.split("=")[1];

      if (!csrfToken) {
        throw new Error("CSRF token not found");
      }

      const res = await fetch(`${API_BASE_URL}/api/talks/${talk.id}/favorite`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-XSRF-TOKEN": decodeURIComponent(csrfToken),
        },
      });
      if (!res.ok) throw new Error("Erreur ajout aux favoris");
      toast("Talk ajouté aux favoris");
    } catch (err) {
      console.error(err);
      toast("Erreur lors de l'ajout aux favoris");
    }
  }, []);

  useEffect(() => {
    fetchTalks();
  }, [fetchTalks]);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Programme des talks</h1>
        <TalkFilters filters={filters} onFiltersChange={setFilters} />
      </header>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
        </div>
      ) : talks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {talks.map((talk) => (
            <TalkCard
              key={talk.id}
              talk={talk}
              showStatus
              showSchedule
              className="h-full"
              onClick={() => setSelectedTalk(talk)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-gray-500">
            Aucun talk ne correspond à vos critères de recherche
          </p>
        </div>
      )}

      <Dialog
        open={!!selectedTalk}
        onOpenChange={(open) => !open && setSelectedTalk(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedTalk?.title}</DialogTitle>
            <DialogDescription>
              Proposé par {selectedTalk?.speaker.name}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {selectedTalk?.description && (
              <p className="text-sm text-muted-foreground">
                {selectedTalk.description}
              </p>
            )}
            <p>
              <strong>Sujet :</strong> {selectedTalk?.topic}
            </p>
            {selectedTalk?.scheduledDate && selectedTalk.startTime && (
              <p>
                <strong>Planifié le :</strong> {selectedTalk.scheduledDate} à{" "}
                {selectedTalk.startTime}
              </p>
            )}
            {selectedTalk?.room && (
              <p>
                <strong>Salle :</strong> {selectedTalk.room}
              </p>
            )}
            {selectedTalk?.status && (
              <p>
                <strong>Statut :</strong>{" "}
                {selectedTalk.status[0].toUpperCase() +
                  selectedTalk.status.slice(1)}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setSelectedTalk(null)}>Fermer</Button>
            {selectedTalk ? (
              <Button
                variant="outline"
                onClick={() => addToFavorites(selectedTalk)}
              >
                <Star /> Ajouter aux favoris
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
