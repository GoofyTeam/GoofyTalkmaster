import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEVELS, SALLES, STATUS } from "@/lib/utils";
import { Route } from "@/routes/app/index";
import { useLocation } from "@tanstack/react-router";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, Search } from "lucide-react";
import { useEffect, useState } from "react";

export function TalkFilters() {
  const navigate = Route.useNavigate();
  const { search } = useLocation();
  const query = new URLSearchParams(search);

  const dateParam = query.get("date") ?? undefined;
  const searchParam = query.get("search") ?? "";
  const subjectParam = query.get("subject") ?? "";
  const roomParam = query.get("room_id") ?? "all";
  const levelParam = query.get("level") ?? "all";
  const statusParam = query.get("status") ?? "all";

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    dateParam ? new Date(dateParam) : undefined,
  );
  useEffect(() => {
    setSelectedDate(dateParam ? new Date(dateParam) : undefined);
  }, [dateParam]);

  const setParam = (key: string, value?: string) => {
    const nxt = new URLSearchParams(search);
    if (value) nxt.set(key, value);
    else nxt.delete(key);
    navigate({ search: nxt.toString() });
  };

  const formatDate = (iso: string) =>
    format(new Date(iso), "dd/MM/yyyy", { locale: fr });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
        <Input
          placeholder="Rechercher..."
          defaultValue={searchParam}
          onBlur={(e) => setParam("search", e.target.value.trim() || undefined)}
          className="pl-10"
        />
      </div>

      <Input
        placeholder="Sujet"
        defaultValue={subjectParam}
        onBlur={(e) => setParam("subject", e.target.value.trim() || undefined)}
      />

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? formatDate(selectedDate.toISOString()) : "Date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(d) => {
              if (!d) return;
              setSelectedDate(d);
              setParam("date", d.toISOString().slice(0, 10));
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Select
        value={roomParam}
        onValueChange={(v) => setParam("room_id", v === "all" ? undefined : v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Salle" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les salles</SelectItem>
          {SALLES.map((salle) => (
            <SelectItem key={salle} value={salle}>
              {salle}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={levelParam}
        onValueChange={(v) => setParam("level", v === "all" ? undefined : v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Niveau" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les niveaux</SelectItem>
          {LEVELS.map((lvl) => (
            <SelectItem key={lvl} value={lvl}>
              {lvl[0].toUpperCase() + lvl.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={statusParam}
        onValueChange={(v) => setParam("status", v === "all" ? undefined : v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          {STATUS.map((st) => (
            <SelectItem key={st} value={st}>
              {st[0].toUpperCase() + st.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
