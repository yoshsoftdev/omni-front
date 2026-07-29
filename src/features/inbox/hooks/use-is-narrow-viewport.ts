"use client";

import { useEffect, useState } from "react";

/** True when viewport width is below `breakpoint` px (default: md = 768). */
export function useIsNarrowViewport(breakpoint = 768): boolean {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setNarrow(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [breakpoint]);

  return narrow;
}
