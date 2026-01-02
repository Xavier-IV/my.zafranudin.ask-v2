"use client";

import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RelativeTimeProps {
  date: string;
  className?: string;
}

export function RelativeTime({ date, className }: RelativeTimeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className={className} />;
  }

  const dt = DateTime.fromJSDate(new Date(date));
  const absoluteDate = dt.toLocaleString(DateTime.DATETIME_MED);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <span className={cn("cursor-help", className)}>
            {dt.toRelative()}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">{absoluteDate}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
