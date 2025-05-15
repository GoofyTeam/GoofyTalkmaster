import { Button } from "@/components/ui/button";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
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
import type { PendingTalk } from "@/types/talk";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Props pour le composant TalkValidationDialog
type TalkValidationDialogProps = {
  talk: PendingTalk | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onValidate: (talkId: number, room: string, time: string) => void;
  onReject: (talkId: number) => void;
};

// Heures disponibles pour les talks
const AVAILABLE_HOURS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
];

// Durées disponibles en minutes
const AVAILABLE_DURATIONS = [
  { label: "30 minutes", value: 30 },
  { label: "45 minutes", value: 45 },
  { label: "1 heure", value: 60 },
  { label: "1h30", value: 90 },
  { label: "2 heures", value: 120 },
];

export function TalkValidationDialog({
  talk,
  open,
  onOpenChange,
  onValidate,
  onReject,
}: TalkValidationDialogProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("09:00");
  const [duration, setDuration] = useState<number>(90);
  const [endTime, setEndTime] = useState<string>("10:30");
  const [selectedDateObj, setSelectedDateObj] = useState<Date | undefined>(
    undefined,
  );

  // Obtenir la date d'aujourd'hui pour les valeurs par défaut
  const today = new Date().toISOString().split("T")[0];

  const isFormValid = selectedRoomId && selectedDate && startTime && endTime;

  // Calculer l'heure de fin en fonction de l'heure de début et de la durée
  useEffect(() => {
    if (startTime) {
      const [hours, minutes] = startTime.split(":").map(Number);

      // Convertir en minutes totales, ajouter la durée, puis reconvertir en format HH:MM
      const totalMinutes = hours * 60 + minutes + duration;
      const endHours = Math.floor(totalMinutes / 60);
      const endMinutes = totalMinutes % 60;

      const formattedEndTime = `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;
      setEndTime(formattedEndTime);
    }
  }, [startTime, duration]);

  // Réinitialiser les valeurs quand le talk change ou que la modale se ferme
  useEffect(() => {
    if (!open || !talk) {
      setSelectedRoomId("");
      setSelectedDate("");
      setSelectedDateObj(undefined);
      setStartTime("09:00");
      setDuration(90); // Par défaut 1h30
    } else {
      // Initialiser la date à aujourd'hui
      const todayDate = new Date();
      setSelectedDateObj(todayDate);
      setSelectedDate(today);
    }
  }, [open, talk, today]);

  // Gérer le changement de date via le DatePicker
  const handleDateChange = (date?: Date) => {
    setSelectedDateObj(date);
    if (date) {
      const formattedDate = date.toISOString().split("T")[0];
      setSelectedDate(formattedDate);
    } else {
      setSelectedDate("");
    }
  };

  const handleValidate = () => {
    if (talk && isFormValid) {
      // Vérifier que la date est au format Y-m-d
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(selectedDate)) {
        toast.error(
          `Format de date invalide: "${selectedDate}". Format attendu: YYYY-MM-DD`,
        );
        return;
      }

      // Vérifier que les heures sont au format H:i
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        toast.error(`Format d'heure invalide. Format attendu: HH:MM`);
        return;
      }

      // Vérifier que l'heure de fin est après l'heure de début
      if (startTime >= endTime) {
        toast.error("L'heure de fin doit être après l'heure de début");
        return;
      }

      // Vérifier que l'heure de fin est avant 20h00 (ajusté selon votre besoin)
      if (endTime > "20:00") {
        toast.error("L'heure de fin ne peut pas dépasser 20h00");
        return;
      }

      // Format room comme "roomId:date" pour éviter toute confusion
      const roomValue = `${selectedRoomId}:${selectedDate}`;

      // Créer une chaîne pour le temps au format attendu
      const timeValue = `${startTime}|${endTime}`;

      onValidate(talk.id, roomValue, timeValue);
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
            <Label htmlFor="date">Date</Label>
            <CustomDatePicker
              date={selectedDateObj}
              onDateChange={handleDateChange}
              placeholder="Sélectionner une date"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="room">Salle</Label>
            <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
              <SelectTrigger id="room">
                <SelectValue placeholder="Sélectionner une salle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Salle A</SelectItem>
                <SelectItem value="2">Salle B</SelectItem>
                <SelectItem value="3">Salle C</SelectItem>
                <SelectItem value="4">Salle D</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="grid gap-2 flex-1">
              <Label htmlFor="startTime">Heure de début</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger id="startTime">
                  <SelectValue placeholder="Heure de début" />
                </SelectTrigger>
                <SelectContent className="max-h-[250px]">
                  {AVAILABLE_HOURS.map((hour) => (
                    <SelectItem key={hour} value={hour}>
                      {hour}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 flex-1">
              <Label htmlFor="duration">Durée</Label>
              <Select
                value={duration.toString()}
                onValueChange={(value) => setDuration(Number(value))}
              >
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Durée" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_DURATIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value.toString()}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 flex-1">
              <Label htmlFor="endTime">Heure de fin</Label>
              <span id="endTime">{endTime}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <div className="flex justify-end gap-4 sm:gap-2">
            <Button variant="outline" onClick={handleReject}>
              Refuser
            </Button>
            <Button disabled={!isFormValid} onClick={handleValidate}>
              Valider
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
