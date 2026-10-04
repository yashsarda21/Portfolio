import { cn } from "@/lib/cn";

/** Numbered innings notes: "0.1", "0.2" … in volt beside each line, hairline-separated. */
export function BallByBall({ items, className }: { items: string[]; className?: string }) {
  return (
    // Explicit role: Tailwind's list-style:none makes Safari/VoiceOver drop the implicit list role.
    // eslint-disable-next-line jsx-a11y/no-redundant-roles
    <ol role="list" className={cn("flex flex-col", className)}>
      {items.map((text, i) => (
        <li
          key={text}
          className="grid grid-cols-[44px_minmax(0,1fr)] gap-2.5 border-t border-line py-2.25"
        >
          <span className="pt-0.5 type-mono-stack text-volt">{`0.${i + 1}`}</span>
          <span className="type-body-ball text-text-1">{text}</span>
        </li>
      ))}
    </ol>
  );
}
