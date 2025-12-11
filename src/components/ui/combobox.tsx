"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
    options: { value: string; label: string }[];
    value: string;
    onSelect: (value: string, label: string) => void;
    onCreate?: (inputValue: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    notFoundText?: string;
    createText?: string;
    className?: string;
}

export function Combobox({
    options,
    value,
    onSelect,
    onCreate,
    placeholder = "Select an option",
    searchPlaceholder = "Search...",
    notFoundText = "No option found.",
    createText = "Create",
    className
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  const handleSelect = (currentValue: string) => {
    const option = options.find(o => o.value === currentValue);
    onSelect(currentValue, option?.label || '');
    setOpen(false);
  }

  const handleCreate = () => {
    if (onCreate && inputValue) {
        onCreate(inputValue);
    }
    setInputValue('');
    setOpen(false);
  }
  
  const displayLabel = options.find((option) => option.value === value)?.label

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {value ? displayLabel : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput 
            placeholder={searchPlaceholder}
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandEmpty>
            {onCreate ? (
                 <Button className="w-full" variant="outline" onClick={handleCreate}>
                    {createText} "{inputValue}"
                </Button>
            ) : notFoundText}
          </CommandEmpty>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={handleSelect}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

