import moment from "moment";
import { Calendar, Views, momentLocalizer } from "react-big-calendar";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

import "react-big-calendar/lib/css/react-big-calendar.css";
import { cn } from "@/lib/utils";

function CustomToolbar({ label = "Votre planning" }) {
  return (
    <div className="rbc-toolbar">
      {/* Titre du mois/année */}
      <span className="rbc-toolbar-label">{label}</span>

      {/* Ici, on n’inclut aucun bouton Today/Prev/Next */}
      <span className={cn("rbc-btn-group", "my-custom-toolbar")}>
        {/* Par exemple, un bouton perso ou vide */}
      </span>
    </div>
  );
}

const minTime = new Date();
minTime.setHours(8, 0, 0); // Affiche à partir de 08:00
const maxTime = new Date();
maxTime.setHours(17, 0, 0); // Jusqu’à 17:00

const UserPlanning = () => {
  const localizer = momentLocalizer(moment);

  const events = [
    {
      //Start the 15 may 2025 at 10AM and end at 6PM
      start: new Date(2025, 4, 15, 10, 0, 0),
      end: new Date(2025, 4, 15, 18, 0, 0),
      title: "Conférence d'ouverture",
    },
    {
      // Start the 16 may 2025 at 10AM and end at 6PM
      start: new Date(2025, 4, 16, 10, 0, 0),
      end: new Date(2025, 4, 16, 18, 0, 0),
      title: "Atelier de développement",
    },
    // Add more events as needed
  ];

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
