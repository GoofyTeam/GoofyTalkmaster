import { useState, useEffect } from "react";
import { TalkFilters } from "@/components/TalkFilters";
import type { Filters } from "@/components/TalkFilters";
import { TalkCard } from "@/components/Talk";
import type { Talk } from "@/types/talk";
import { API_BASE_URL } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function Homepage() {
  const [talks, setTalks] = useState<Talk[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>({});
  const [selectedTalk, setSelectedTalk] = useState<Talk | null>(null);

  const fetchTalks = async () => {
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
      params.set("per_page", "15");
      params.set("sort_by", "scheduled_date");
      params.set("sort_direction", "asc");

      console.log("🚀 fetching /api/public/talks?", params.toString());
      const res = await fetch(
        `${API_BASE_URL}/api/public/talks?${params.toString()}`,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) throw new Error("Erreur fetching talks");

      const payload = await res.json();
      console.log("🚀 raw API payload:", payload);

      let data = (payload.data ?? payload) as any[];

      console.log("🚀 data before filtering:", data);

      if (fSearch) {
        const q = fSearch.toLowerCase();
        data = data.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.topic.toLowerCase().includes(q)
        );
      }
      if (fSubject) {
        data = data.filter((t) => t.topic === fSubject);
      }
      if (fRoomId) {
        data = data.filter((t) => t.room === fRoomId);
      }
      if (fDate) {
        data = data.filter(
          (t) =>
            typeof t.scheduled_date === "string" &&
            t.scheduled_date.startsWith(fDate)
        );
      }
      if (fLevel) {
        data = data.filter((t) => t.level === fLevel);
      }
      if (fStatus) {
        data = data.filter((t) => t.status === fStatus);
      }

      console.log("🚀 data after filtering:", data);

      const talksList: Talk[] = data.map((t) => ({
        ...t,
        scheduledDate: t.scheduled_date,
        startTime: t.start_time,
      }));

      setTalks(talksList);
    } catch (e) {
      console.error(e);
      setTalks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTalks();
  }, [filters]);

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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
