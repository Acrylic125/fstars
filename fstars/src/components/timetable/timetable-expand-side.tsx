"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { ChevronRight, Hamburger } from "lucide-react";
import { cn } from "@/lib/utils";

export function TimetableExpandSideButton({
  className,
}: {
  className?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setIsExpanded(!isExpanded)}
      className={cn(
        {
          "expand-side-button": isExpanded,
        },
        className
      )}
    >
      <Hamburger />
    </Button>
  );
}
