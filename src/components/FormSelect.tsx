import type { ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type FormSelectOption = { value: string; label: ReactNode };

type FormSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: FormSelectOption[];
  placeholder?: string;
  className?: string;
};

const triggerClass =
  "mt-1 h-auto w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm shadow-none focus:ring-1 focus:ring-primary";

export function FormSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  className,
}: FormSelectProps) {
  if (options.length === 0) {
    return (
      <div
        className={cn(
          "mt-1 flex w-full items-center rounded-xl border border-dashed border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground",
          className,
        )}
      >
        No options available
      </div>
    );
  }

  if (options.length === 1) {
    return (
      <div
        className={cn(
          "mt-1 flex w-full items-center rounded-xl border border-border bg-muted/50 px-3 py-2.5 text-sm text-foreground",
          className,
        )}
      >
        {options[0].label}
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={cn(triggerClass, className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
