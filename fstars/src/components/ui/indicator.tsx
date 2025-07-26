import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

type IndicatorControls = {
  indicator: {
    message: string;
    status: "success" | "error";
  } | null;
  isVisible: boolean;
};

export function useIndicator(viewDuration: number = 1800) {
  const [indicator, setIndicator] =
    useState<IndicatorControls["indicator"]>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (indicator) {
      setIsVisible(true);

      const hideTimeout = setTimeout(() => {
        setIsVisible(false);
      }, viewDuration - 200);
      const clearIndicatorTimeout = setTimeout(() => {
        setIndicator(null);
      }, viewDuration);

      return () => {
        clearTimeout(hideTimeout);
        clearTimeout(clearIndicatorTimeout);
      };
    }
  }, [indicator]);

  const showIndicator = useCallback(
    (
      message: string,
      status: NonNullable<IndicatorControls["indicator"]>["status"]
    ) => {
      if (indicator) {
        setIsVisible(false);

        setTimeout(() => {
          setIndicator({
            message,
            status,
          });
        }, 200);
      } else {
        setIndicator({
          message,
          status,
        });
      }
    },
    [indicator, setIndicator, setIsVisible]
  );

  const controls = useMemo(() => {
    return {
      indicator,
      isVisible,
      showIndicator,
    };
  }, [indicator, isVisible, showIndicator]);

  return controls;
}

export function Indicator({
  controls,
  className,
}: {
  controls: IndicatorControls;
  className?: string;
}) {
  const { indicator, isVisible } = controls;

  return (
    <div
      className={cn(
        "absolute -left-4 -translate-x-full top-4 -rotate-12 text-base w-24 pointer-events-none transition-all ease-in-out translate-y-4 duration-200",
        {
          "opacity-0 scale-50": !indicator || !isVisible,
          "opacity-100 translate-y-0 scale-100": indicator && isVisible,
          "text-green-600 dark:text-green-400": indicator?.status === "success",
          "text-red-600 dark:text-red-400": indicator?.status === "error",
        },
        className
      )}
    >
      {indicator && indicator.message}
    </div>
  );
}
