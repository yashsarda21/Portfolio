import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { CommentaryBar } from "@/design-system";
import { cn } from "@/lib/cn";

const HOLD_MS = 4000; // --dur-comm-hold
const EXIT_MS = 300;

type Current = { line: string; state: "in" | "out" } | null;

interface CommentaryApi {
  current: Current;
  say(line: string, opts?: { interrupt?: boolean }): void;
  clear(): void;
}

const Ctx = createContext<CommentaryApi | null>(null);

/**
 * The queue engine: one line at a time, latest-pending-wins (spec §4.6). Plain closure state (no React
 * updaters), so timers are never started from inside a state updater — safe under strict mode.
 */
function createEngine(onChange: (next: Current) => void) {
  let showing: Current = null;
  let pending: string | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const commit = (next: Current) => {
    showing = next;
    onChange(next);
  };
  const schedule = (fn: () => void, ms: number) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(fn, ms);
  };
  function exit() {
    if (!showing) return;
    commit({ ...showing, state: "out" });
    schedule(() => {
      const next = pending;
      pending = null;
      if (next) show(next);
      else commit(null);
    }, EXIT_MS);
  }
  function show(line: string) {
    commit({ line, state: "in" });
    schedule(exit, HOLD_MS);
  }

  return {
    say(line: string, opts?: { interrupt?: boolean }) {
      if (!showing) return show(line);
      if (showing.line === line && showing.state === "in") return;
      pending = line;
      if (opts?.interrupt && showing.state === "in") exit();
    },
    clear() {
      pending = null;
      if (timer) clearTimeout(timer);
      commit(null);
    },
    dispose() {
      if (timer) clearTimeout(timer);
    },
  };
}

export function CommentaryProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Current>(null);
  const [engine] = useState(() => createEngine(setCurrent));

  useEffect(() => () => engine.dispose(), [engine]);

  const api = useMemo(() => ({ current, say: engine.say, clear: engine.clear }), [current, engine]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useCommentary(): CommentaryApi {
  const api = useContext(Ctx);
  if (!api) throw new Error("useCommentary must be used inside <CommentaryProvider>");
  return api;
}

/** The on-screen lower-third plus a polite live region (spec §4.6). Position it with className. */
export function CommentarySlot({ tag, className }: { tag: string; className?: string }) {
  const { current } = useCommentary();
  return (
    <>
      {current ? (
        <CommentaryBar
          aria-hidden="true"
          tag={tag}
          line={current.line}
          state={current.state}
          className={cn("max-md:hidden", className)}
        />
      ) : null}
      <div aria-live="polite" className="sr-only">
        {current?.state === "in" ? current.line : ""}
      </div>
    </>
  );
}
