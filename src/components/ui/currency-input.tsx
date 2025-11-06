"use client";

import * as React from "react";
import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends Omit<InputProps, 'onChange' | 'value'> {
  value: number;
  onValueChange: (value: number | undefined) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(() => format(value));
    const localRef = React.useRef<HTMLInputElement>(null);
    const inputRef = (ref || localRef) as React.RefObject<HTMLInputElement>;


    React.useEffect(() => {
        if(inputRef.current && document.activeElement !== inputRef.current) {
            setDisplayValue(format(value || 0));
        }
    }, [value, inputRef]);

    const format = (num: number) => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(num);
    };

    const parse = (str: string) => {
      const numbers = str.replace(/[^\d]/g, "");
      return parseInt(numbers, 10) / 100;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const numericValue = parse(rawValue);
      
      if (!isNaN(numericValue)) {
        onValueChange(numericValue);
        setDisplayValue(format(numericValue));
      } else {
        onValueChange(undefined);
        setDisplayValue("");
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setDisplayValue(format(value || 0));
        if (props.onBlur) {
            props.onBlur(e);
        }
    }

    // This handles the initial render and external value changes
    React.useEffect(() => {
        setDisplayValue(format(value || 0));
    }, [value]);

    return (
        <Input
            {...props}
            ref={inputRef}
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            className={cn("text-right", className)}
            placeholder="R$ 0,00"
            inputMode="decimal"
        />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
