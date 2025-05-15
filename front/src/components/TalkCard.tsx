import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { KeyboardEvent } from "react";
import { useState } from "react";

// Type principal pour les talks
export type Talk = {
  id: number;
  title: string;
  topic: string;
  description?: string;
  speaker: {
    id: number;
    name: string;
  };
  status?: "pending" | "accepted" | "rejected";
  scheduledDate?: string;
  startTime?: string;
  room?: string;
};

// Pour la compatibilité avec le code existant
export type PendingTalk = {
  id: number;
  title: string;
  topic: string;
  description: string;
  speaker: {
    id: number;
    name: string;
  };
};

// Props pour le composant TalkCard
type TalkCardProps = {
  talk: Talk;
  onClick?: (talk: Talk) => void;
  showStatus?: boolean;
  showSchedule?: boolean;
  className?: string;
};

// Props pour le composant TalkValidationDialog
type TalkValidationDialogProps = {
  talk: PendingTalk | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onValidate: (talkId: number, room: string, time: string) => void;
  onReject: (talkId: number) => void;
};

// Fonctions utilitaires communes
const getStatusLabel = (status: string | undefined) => {
  switch (status) {
    case "pending":
      return "En attente";
    case "accepted":
      return "Accepté";
    case "rejected":
      return "Refusé";
    default:
      return "";
  }
};

const getStatusClass = (status: string | undefined) => {
  switch (status) {
    case "pending":
      return "bg-yellow-500 text-yellow-50";
    case "accepted":
      return "bg-green-500 text-green-50";
    case "rejected":
      return "bg-red-500 text-red-50";
    default:
      return "bg-primary text-primary-foreground";
  }
};

// Conversion entre les types Talk et PendingTalk
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

export const convertToPendingTalk = (talk: Talk): PendingTalk => {
  return {
    id: talk.id,
    title: talk.title,
    topic: talk.topic,
    description: talk.description || "",
    speaker: talk.speaker,
  };
};

// Composant TalkCard
export function TalkCard({
  talk,
  onClick,
  showStatus = false,
  showSchedule = false,
  className = "",
}: TalkCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(talk);
    }
  };

  console.log(talk.status);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick(talk);
    }
  };

  return (
    <div
      className={`w-full rounded-md border p-4 transition-colors h-full flex flex-col ${
        onClick
          ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
          : ""
      } ${className}`}
      onClick={onClick ? handleClick : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? "button" : "article"}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `Détails du talk: ${talk.title}` : undefined}
    >
      <div className="flex flex-col gap-2 relative pb-6 flex-grow">
        <h3 className="font-medium text-sm line-clamp-1">{talk.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {talk.topic}
        </p>

        {talk.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
            {talk.description}
          </p>
        )}

        <div className="flex items-center mt-auto">
          <span className="text-xs text-muted-foreground">
            {talk.speaker.name}
          </span>
        </div>

        {showSchedule && talk.scheduledDate && talk.startTime && talk.room && (
          <div className="mt-2 text-xs border-t pt-2">
            <p className="text-muted-foreground">
              {talk.scheduledDate} à {talk.startTime}
            </p>
            <p className="font-medium">{talk.room}</p>
          </div>
        )}

        {/* Statut placé en bas à droite */}
        {showStatus && talk.status && (
          <div className="absolute bottom-0 right-0 mb-0.5">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent ${getStatusClass(
                talk.status,
              )} hover:opacity-90`}
            >
              {getStatusLabel(talk.status)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Composant TalkValidationDialog
export function TalkValidationDialog({
  talk,
  open,
  onOpenChange,
  onValidate,
  onReject,
}: TalkValidationDialogProps) {
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  const isFormValid = selectedRoom && selectedTime;

  const handleValidate = () => {
    if (talk && isFormValid) {
      onValidate(talk.id, selectedRoom, selectedTime);
      onOpenChange(false);
    }
  };

  const handleReject = () => {
    if (talk) {
      onReject(talk.id);
      onOpenChange(false);
    }
  };

  if (!talk) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{talk.title}</DialogTitle>
          <DialogDescription>Proposé par {talk.speaker.name}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="topic">Sujet</Label>
            <div id="topic" className="rounded-md border p-2 text-sm">
              {talk.topic}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <div
              id="description"
              className="rounded-md border p-2 text-sm max-h-32 overflow-y-auto"
            >
              {talk.description}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="room">Salle</Label>
            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
              <SelectTrigger id="room">
                <SelectValue placeholder="Sélectionner une salle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="salle-a">Salle A</SelectItem>
                <SelectItem value="salle-b">Salle B</SelectItem>
                <SelectItem value="salle-c">Salle C</SelectItem>
                <SelectItem value="amphitheatre">Amphithéâtre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="time">Horaire</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger id="time">
                <SelectValue placeholder="Sélectionner un horaire" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="09:00-10:30">09:00 - 10:30</SelectItem>
                <SelectItem value="11:00-12:30">11:00 - 12:30</SelectItem>
                <SelectItem value="14:00-15:30">14:00 - 15:30</SelectItem>
                <SelectItem value="16:00-17:30">16:00 - 17:30</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleReject}>
            Refuser
          </Button>
          <Button disabled={!isFormValid} onClick={handleValidate}>
            Valider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
