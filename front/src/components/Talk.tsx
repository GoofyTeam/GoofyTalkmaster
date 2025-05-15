import { getStatusClass, getStatusLabel } from "@/lib/talk-utils";
import type { Talk } from "@/types/talk";
import type { KeyboardEvent } from "react";

// Props pour le composant TalkCard
type TalkCardProps = {
  talk: Talk;
  onClick?: (talk: Talk) => void;
  showStatus?: boolean;
  showSchedule?: boolean;
  className?: string;
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
