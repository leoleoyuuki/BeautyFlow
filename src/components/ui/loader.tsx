"use client";

import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Loader({ className, text = "Carregando..." }: { className?: string; text?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-10', className)}>
      <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

export function FullscreenLoader({ text = "Carregando..." }: { text?: string }) {
    return (
         <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
            <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
            <p className="text-lg font-semibold">{text}</p>
        </div>
    )
}
