import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Search, Calendar as CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { SALLES, LEVELS, STATUS } from "@/lib/utils";

export type Filters = {
  search?: string;
  subject?: string;
  date?: string;
  room_id?: string;
  level?: string;
  status?: string;
};

type TalkFiltersProps = {
  filters: Filters;
  onFiltersChange: (newFilters: Filters) => void;
};

export function TalkFilters({ filters, onFiltersChange }: TalkFiltersProps) {
  const { search, subject, date, room_id, level, status } = filters;

  const formattedDate = date
    ? format(parseISO(date), "dd/MM/yyyy", { locale: fr })
    : "";

  const update = (key: keyof Filters, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  return (
    <div
      className="
        grid 
        grid-cols-1 
        sm:grid-cols-2 
        md:grid-cols-3 
        lg:grid-cols-6 
        gap-4 
        mb-8
      "
    >
      <div className="w-full">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            placeholder="Rechercher..."
            value={search ?? ""}
            onChange={(e) => update("search", e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      <div className="w-full">
        <Input
          placeholder="Sujet"
          value={subject ?? ""}
          onChange={(e) => update("subject", e.target.value)}
          className="w-full"
        />
      </div>

      <div className="w-full">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formattedDate || "Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-full max-w-xs p-0">
            <Calendar
              mode="single"
              selected={date ? parseISO(date) : undefined}
              onSelect={(d) =>
                update("date", d ? format(d, "yyyy-MM-dd") : undefined)
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="w-full">
        <Select
          value={room_id ?? "all"}
          onValueChange={(v) => update("room_id", v === "all" ? undefined : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Salle" />
          </SelectTrigger>
          <SelectContent className="w-full">
            <SelectItem value="all">Toutes les salles</SelectItem>
            {SALLES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full">
        <Select
          value={level ?? "all"}
          onValueChange={(v) => update("level", v === "all" ? undefined : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Niveau" />
          </SelectTrigger>
          <SelectContent className="w-full">
            <SelectItem value="all">Tous les niveaux</SelectItem>
            {LEVELS.map((l) => (
              <SelectItem key={l} value={l}>
                {l[0].toUpperCase() + l.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full">
        <Select
          value={status ?? "all"}
          onValueChange={(v) => update("status", v === "all" ? undefined : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent className="w-full">
            <SelectItem value="all">Tous les statuts</SelectItem>
            {STATUS.map((s) => (
              <SelectItem key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
