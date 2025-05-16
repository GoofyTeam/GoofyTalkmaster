import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEVELS, SALLES, STATUS } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Search } from "lucide-react";

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

  const update = (key: keyof Filters, value?: string) => {
    onFiltersChange({ ...filters, [key]: value || undefined });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      <div className="w-full">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            className="pl-10 w-full"
            placeholder="Rechercher..."
            value={search ?? ""}
            onChange={(e) => update("search", e.target.value)}
          />
        </div>
      </div>

      <div className="w-full">
        <Input
          className="w-full"
          placeholder="Sujet"
          value={subject ?? ""}
          onChange={(e) => update("subject", e.target.value)}
        />
      </div>

      <div className="w-full">
        <CustomDatePicker
          date={date ? parseISO(date) : undefined}
          onDateChange={(d) =>
            update("date", d ? format(d, "yyyy-MM-dd") : undefined)
          }
          placeholder="Date"
          className="w-full"
        />
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
