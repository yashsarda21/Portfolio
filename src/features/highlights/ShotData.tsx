import { ChipList, Glass, Heading, KeyValueList, LinkRow } from "@/design-system";
import { cn } from "@/lib/cn";
import type { HighlightItemView } from "./view";

/** The right column: facts, the stack, and the links pinned to the bottom. Links open in the same tab, as drawn. */
export function ShotData({
  item,
  label,
  className,
}: {
  item: HighlightItemView;
  label: string;
  className?: string;
}) {
  return (
    <Glass pad="md" className={cn("flex min-w-0 flex-col gap-4.5", className)}>
      <Heading level={3} variant="mono-label" tone="label" leading="font">
        {label}
      </Heading>
      <KeyValueList variant="stacked" items={item.facts} />
      <ChipList items={item.stack} size="sm" text="name" heading={item.stackLabel} />
      <div className="mt-auto flex flex-col gap-2">
        {item.links.map((link) => (
          <LinkRow key={link.label} href={link.href} tone={link.tone} glyph={link.glyph}>
            {link.label}
          </LinkRow>
        ))}
      </div>
    </Glass>
  );
}
