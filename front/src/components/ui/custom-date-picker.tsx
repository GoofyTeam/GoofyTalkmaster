"use client";

import { format, isValid, parse } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  date?: Date;
  onDateChange?: (date?: Date) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CustomDatePicker({
  date,
  onDateChange,
  placeholder = "Sélectionner une date",
  className,
  disabled = false,
}: DatePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    date,
  );
  const [inputValue, setInputValue] = React.useState<string>("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Mettre à jour les états quand la prop date change
  React.useEffect(() => {
    setSelectedDate(date);
    if (date && isValid(date)) {
      setInputValue(format(date, "yyyy-MM-dd"));
    } else {
      setInputValue("");
    }
  }, [date]);

  // Gérer le changement de date
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value) {
      const parsedDate = parse(value, "yyyy-MM-dd", new Date());
      if (isValid(parsedDate)) {
        setSelectedDate(parsedDate);
        onDateChange?.(parsedDate);
      }
    } else {
      setSelectedDate(undefined);
      onDateChange?.(undefined);
    }
  };

  // Formater la date pour l'affichage
  const displayDate =
    selectedDate && isValid(selectedDate)
      ? format(selectedDate, "PPP", { locale: fr })
      : placeholder;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className,
          )}
          onClick={() => inputRef.current?.showPicker()}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span>{displayDate}</span>
          <input
            ref={inputRef}
            type="date"
            value={inputValue}
            onChange={handleDateChange}
            className="sr-only"
            disabled={disabled}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-auto">
        <div className="p-4">
          <div className="space-y-2">
            <div className="grid grid-cols-7 gap-2">
              {["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="text-center my-4">
              <p className="text-sm font-medium">
                Cliquez sur le bouton pour ouvrir le sélecteur de date natif
              </p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Version avec plage de dates
interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onStartDateChange?: (date?: Date) => void;
  onEndDateChange?: (date?: Date) => void;
  startPlaceholder?: string;
  endPlaceholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CustomDateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startPlaceholder = "Date de début",
  endPlaceholder = "Date de fin",
  className,
  disabled = false,
}: DateRangePickerProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row gap-2", className)}>
      <CustomDatePicker
        date={startDate}
        onDateChange={onStartDateChange}
        placeholder={startPlaceholder}
        disabled={disabled}
      />
      <CustomDatePicker
        date={endDate}
        onDateChange={onEndDateChange}
        placeholder={endPlaceholder}
        disabled={disabled}
      />
    </div>
  );
}
