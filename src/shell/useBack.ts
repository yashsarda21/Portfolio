import { useCallback } from "react";
import { useNavigate } from "react-router";

/** The router numbers each entry it adds to the browser's history from 0; entry 0 is where the visit began. */
const cameFromInside = () => {
  const idx = (window.history.state as { idx?: unknown } | null)?.idx;
  return typeof idx === "number" && idx > 0;
};

/**
 * What BACK does: one page back when the visitor came from inside the site, else `fallback`. A page opened directly
 * is entry 0, so BACK never leaves the site. (The location's `key` cannot tell: the router gives the first entry a
 * real key too.)
 */
export function useBack(fallback: string): () => void {
  const navigate = useNavigate();
  return useCallback(() => {
    if (cameFromInside()) void navigate(-1);
    else void navigate(fallback);
  }, [navigate, fallback]);
}
