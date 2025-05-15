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
import { cn } from "@/lib/utils";
import type { Talk } from "@/types/talk";

export function eventMapper(event: Talk): Event {
  return {
    title: `${event.title} - ${event.speaker.id}`,
    start: new Date(event.startTime || ""),
    end: new Date(event.startTime || ""),
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
          events={talks.map(eventMapper)}
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
