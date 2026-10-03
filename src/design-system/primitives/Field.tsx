import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const CONTROL =
  "w-full border border-line-strong bg-inset px-3.5 type-body text-floodlight placeholder:text-dim transition-colors duration-(--dur-snap) ease-snap hover:border-line-hover focus-visible:border-volt aria-invalid:border-live";

interface FieldChromeProps {
  id: string;
  label: string;
  hintId?: string;
  hint?: string;
  errorId?: string;
  error?: string;
  children: ReactNode;
}

function FieldChrome({ id, label, hint, hintId, error, errorId, children }: FieldChromeProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="type-mono-label text-scout">
        {label}
      </label>
      {children}
      {hint ? (
        <p id={hintId} className="type-caption text-text-2">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="flex items-center gap-2 type-caption text-floodlight">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-live" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

function useFieldIds(
  id: string | undefined,
  hint?: string,
  error?: string,
  callerDescribedBy?: string,
) {
  const auto = useId();
  const base = id ?? auto;
  const hintId = hint ? `${base}-hint` : undefined;
  const errorId = error ? `${base}-error` : undefined;
  const describedBy = [callerDescribedBy, hintId, errorId].filter(Boolean).join(" ") || undefined;
  return { base, hintId, errorId, describedBy };
}

type FieldOwn = { label: string; error?: string; hint?: string };

export function TextField({
  label,
  error,
  hint,
  id,
  className,
  "aria-describedby": callerDescribedBy,
  ...rest
}: FieldOwn & ComponentPropsWithRef<"input">) {
  const ids = useFieldIds(id, hint, error, callerDescribedBy);
  return (
    <FieldChrome
      id={ids.base}
      label={label}
      hint={hint}
      hintId={ids.hintId}
      error={error}
      errorId={ids.errorId}
    >
      <input
        {...rest}
        id={ids.base}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        className={cn(CONTROL, "h-13", className)}
      />
    </FieldChrome>
  );
}

export function TextArea({
  label,
  error,
  hint,
  id,
  className,
  "aria-describedby": callerDescribedBy,
  ...rest
}: FieldOwn & ComponentPropsWithRef<"textarea">) {
  const ids = useFieldIds(id, hint, error, callerDescribedBy);
  return (
    <FieldChrome
      id={ids.base}
      label={label}
      hint={hint}
      hintId={ids.hintId}
      error={error}
      errorId={ids.errorId}
    >
      <textarea
        {...rest}
        id={ids.base}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        className={cn(CONTROL, "h-27.5 resize-none py-3.5", className)}
      />
    </FieldChrome>
  );
}

export function Fieldset({
  legend,
  className,
  children,
  ...rest
}: { legend: string } & ComponentPropsWithRef<"fieldset">) {
  return (
    <fieldset className={cn("flex min-w-0 flex-col gap-2.5 border-0 p-0", className)} {...rest}>
      <legend className="mb-2.5 type-mono-label text-scout">{legend}</legend>
      {children}
    </fieldset>
  );
}
