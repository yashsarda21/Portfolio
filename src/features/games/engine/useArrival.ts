import { useEffect, useRef } from "react";
import { loadGsap } from "@/lib/motion";
import { useCommentary } from "@/shell/commentary";

/**
 * What every game does on arrival. The commentary says `line` once, on the stage only (phones are silent, L11), the
 * moment `spoken` is true. And while the visitor reads the board GSAP is fetched, so the first flight leaves on time;
 * with reduced motion nothing flies, so nothing is fetched.
 */
export function useArrival({
  line,
  spoken,
  reduced,
  warm = true,
}: {
  line: string;
  spoken: boolean;
  reduced: boolean;
  /** False for a game whose flights do not use GSAP (the 3D scene draws its own): nothing is fetched. */
  warm?: boolean;
}): void {
  const { say } = useCommentary();
  const arrived = useRef(false);
  useEffect(() => {
    if (!spoken || arrived.current) return;
    arrived.current = true;
    say(line);
  }, [spoken, say, line]);

  useEffect(() => {
    if (!reduced && warm) void loadGsap().catch(() => {});
  }, [reduced, warm]);
}
