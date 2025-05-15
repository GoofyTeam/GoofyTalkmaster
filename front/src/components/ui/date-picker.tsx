"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  date?: Date | undefined;
  onDateChange?: (date?: Date) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Sélectionner une date",
  className,
  disabled = false,
}: DatePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    date,
  );

  React.useEffect(() => {
    setSelectedDate(date);
  }, [date]);

  const handleSelect = (date?: Date) => {
    setSelectedDate(date);
    if (onDateChange) {
      onDateChange(date);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className,
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (
            format(selectedDate, "PPP", { locale: fr })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          initialFocus
          locale={fr}
        />
      </PopoverContent>
    </Popover>
  );
}

// Variante avec sélection d'une plage de dates
interface DateRangePickerProps {
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  placeholder = "Sélectionner une période",
  className,
  disabled = false,
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange>(
    dateRange || { from: undefined, to: undefined },
  );

  React.useEffect(() => {
    if (dateRange) {
      setDate(dateRange);
    }
  }, [dateRange]);

  const handleSelect = (range: DateRange) => {
    setDate(range);
    if (onDateRangeChange) {
      onDateRangeChange(range);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date.from && "text-muted-foreground",
            className,
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date.from ? (
            date.to ? (
              <>
                {format(date.from, "PPP", { locale: fr })} -{" "}
                {format(date.to, "PPP", { locale: fr })}
              </>
            ) : (
              format(date.from, "PPP", { locale: fr })
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="range"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          locale={fr}
        />
      </PopoverContent>
    </Popover>
  );
}
