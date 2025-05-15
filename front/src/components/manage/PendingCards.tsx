import {
  type PendingTalk,
  type Talk,
  TalkCard,
  TalkValidationDialog,
  convertToPendingTalk,
  convertToTalk,
} from "@/components/Talk";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useRef, useState } from "react";

type PendingCardsProps = {
  pendingTalks: PendingTalk[];
  onTalkClick?: (talk: Talk) => void;
  pagination: {
    totalItems: number;
    currentPage: number;
    itemsPerPage: number;
  };
  onValidate: (talkId: number, room: string, time: string) => void;
  onReject: (talkId: number) => void;
};

export function PendingCards({
  pendingTalks,
  onTalkClick,
  pagination,
  onValidate,
  onReject,
}: PendingCardsProps) {
  // État pour stocker toutes les demandes visibles
  const [visibleTalks, setVisibleTalks] = useState<PendingTalk[]>([]);
  const [page, setPage] = useState(1);
  const [hasMoreVisible, setHasMoreVisible] = useState(false);
  const [selectedTalk, setSelectedTalk] = useState<PendingTalk | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Nombre d'éléments à afficher par page pour le "load more"
  const ITEMS_PER_PAGE = 6;

  // Fonction pour mettre à jour les talks visibles et charger plus
  const updateVisibleTalks = useCallback(
    (newPage: number) => {
      if (!pendingTalks?.length) return;

      const allTalks = pendingTalks;
      const endIndex = newPage * ITEMS_PER_PAGE;
      const hasMore = endIndex < allTalks.length;

      setVisibleTalks(allTalks.slice(0, endIndex));
      setPage(newPage);
      setHasMoreVisible(hasMore);
    },
    [pendingTalks],
  );

  // Fonction pour charger plus de talks
  const loadMoreTalks = useCallback(() => {
    if (!hasMoreVisible) return;
    updateVisibleTalks(page + 1);
  }, [hasMoreVisible, page, updateVisibleTalks]);

  // Initialiser les talks visibles
  useEffect(() => {
    if (pendingTalks?.length) {
      // Initialiser avec les premiers éléments
      updateVisibleTalks(1);
    }
  }, [pendingTalks, updateVisibleTalks]);

  // Référence pour la section des talks - pour le scroll
  const talksContainerRef = useRef<HTMLDivElement>(null);

  // Observer pour l'infini scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreVisible) {
          loadMoreTalks();
        }
      },
      { threshold: 0.1 },
    );

    const loadMoreElement = document.getElementById("load-more-trigger");
    if (loadMoreElement) {
      observer.observe(loadMoreElement);
    }

    return () => {
      if (loadMoreElement) {
        observer.unobserve(loadMoreElement);
      }
    };
  }, [hasMoreVisible, loadMoreTalks]);

  // Gestionnaire de clic sur une carte
  const handleCardClick = (talk: Talk) => {
    const pendingTalk = convertToPendingTalk(talk);
    setSelectedTalk(pendingTalk);
    setDialogOpen(true);

    // Si un gestionnaire externe est fourni, l'appeler également
    if (onTalkClick) {
      onTalkClick(talk);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">
          Demandes en attente de validation
        </h2>
        <p className="text-sm text-muted-foreground">
          {pagination?.totalItems || 0} demandes à traiter
        </p>
      </div>

      {/* Si aucun talk en attente */}
      {pendingTalks.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">Aucune demande en attente</p>
        </div>
      ) : (
        <div className="border rounded-lg p-4" ref={talksContainerRef}>
          <div
            id="talks-container"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {visibleTalks.map((pendingTalk) => (
              <div key={pendingTalk.id}>
                <TalkCard
                  talk={convertToTalk(pendingTalk)}
                  onClick={handleCardClick}
                  showStatus={true}
                />
              </div>
            ))}
          </div>

          {hasMoreVisible && (
            <div id="load-more-trigger" className="text-center py-8">
              <Button variant="outline" onClick={loadMoreTalks}>
                Voir plus de demandes
              </Button>
            </div>
          )}

          {!hasMoreVisible && visibleTalks.length === pendingTalks.length && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Toutes les demandes sont affichées ({pendingTalks.length})
              </p>
            </div>
          )}
        </div>
      )}

      {/* Dialogue de validation des talks */}
      <TalkValidationDialog
        talk={selectedTalk}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onValidate={onValidate}
        onReject={onReject}
      />
    </div>
  );
}
