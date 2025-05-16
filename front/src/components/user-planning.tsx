import moment from "moment";
import {
  Calendar,
  type Event,
  Views,
  momentLocalizer,
} from "react-big-calendar";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "@/assets/styles/override-calendar.css";
import { cn } from "@/lib/utils";
import type { Talk } from "@/types/talk";

export function eventMapper(event: Talk): Event {
  // Sortir rapidement si les données nécessaires ne sont pas présentes
  if (!event.scheduledDate || !event.startTime) {
    return {
      title: `${event.title} (Non programmé)`,
      start: new Date(),
      end: new Date(),
    };
  }

  // Construire une date correcte en combinant la date programmée et l'heure de début
  const startDateTime = `${event.scheduledDate}T${event.startTime}`;
  const startDate = new Date(startDateTime);

  // Créer une date de fin en ajoutant 1h30 par défaut si endTime n'est pas disponible
  let endDate: Date;
  if (event.endTime) {
    const endDateTime = `${event.scheduledDate}T${event.endTime}`;
    endDate = new Date(endDateTime);
  } else {
    endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + 90); // Par défaut, 1h30 de durée
  }

  // Ajouter des informations supplémentaires au titre
  const speaker =
    event.speaker?.name || `Speaker ${event.speaker?.id || "inconnu"}`;
  const location = event.room ? ` - Salle: ${event.room}` : "";

  return {
    title: `${event.title} - ${speaker}${location}`,
    start: startDate,
    end: endDate,
    resource: event, // Stocker l'objet talk complet pour référence
  };
}

function CustomToolbar({ label = "Votre planning" }) {
  return (
    <div className="rbc-toolbar">
      {/* Titre du mois/année */}
      <span className="rbc-toolbar-label">{label}</span>

      {/* Ici, on n'inclut aucun bouton Today/Prev/Next */}
      <span className={cn("rbc-btn-group", "my-custom-toolbar")}>
        {/* Par exemple, un bouton perso ou vide */}
      </span>
    </div>
  );
}

const minTime = new Date();
minTime.setHours(9, 0, 0);
const maxTime = new Date();
maxTime.setHours(19, 0, 0);

const UserPlanning = ({ talks }: { talks: Talk[] }) => {
  const localizer = momentLocalizer(moment);

  // Filtrer les talks qui ont des dates et heures valides
  const validTalks = talks.filter(
    (talk) => talk.scheduledDate && talk.startTime,
  );

  // Mapper les talks en événements pour le calendrier
  const events = validTalks.map((talk) => eventMapper(talk));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Planning</CardTitle>
        <CardDescription>
          Voici le planning de l&apos;événement. Vous pouvez y voir les
          conférences et les ateliers auxquels vous êtes inscrit.
        </CardDescription>
      </CardHeader>
      <CardContent className="">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          min={minTime}
          max={maxTime}
          defaultView={Views.WEEK}
          views={[Views.WEEK]}
          components={{
            toolbar: CustomToolbar,
          }}
        />
      </CardContent>
    </Card>
  );
};

export default UserPlanning;
