import { MouseEventHandler } from "react";

// export const stopPropagation: MouseEventHandler<HTMLDivElement> = (e) => {
//   e.stopPropagation();
// };

export function stopPropagation<T extends HTMLElement>(e: React.MouseEvent<T>) {
  e.stopPropagation();
}
