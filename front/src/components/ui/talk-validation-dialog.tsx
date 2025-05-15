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
import type { PendingTalk } from "@/types/talk";
import { useEffect, useState } from "react";

// Props pour le composant TalkValidationDialog
type TalkValidationDialogProps = {
  talk: PendingTalk | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onValidate: (talkId: number, room: string, time: string) => void;
  onReject: (talkId: number) => void;
};

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

  // Réinitialiser les valeurs quand le talk change ou que la modale se ferme
  useEffect(() => {
    if (!open || !talk) {
      setSelectedRoom("");
      setSelectedTime("");
    }
  }, [open, talk]);

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
          <div className="flex justify-between mt-2 gap-2">
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
