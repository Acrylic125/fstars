"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight, Hamburger } from "lucide-react";
import { cn } from "@/lib/utils";

export function TimetableExpandSideButton({
  className,
}: {
  className?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={() => setIsExpanded(!isExpanded)}
      className={cn(
        {
          "expand-side-button-hidden": !isExpanded,
        },
        className
      )}
    >
      {isExpanded ? <ChevronRight /> : <ChevronLeft />}
    </Button>
  );
}
