import { ui } from "@/content";
import { ChipList, Glass, Heading, KeyValueList, LinkRow, Text } from "@/design-system";
import { cn } from "@/lib/cn";
import type { HighlightItemView } from "./view";

const isExternal = (href: string) => /^https?:\/\//.test(href);

/** The right column: facts, the stack, and the links pinned to the bottom. */
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
      <Heading level={3} variant="mono-label" tone="label" className="leading-auto">
        {label}
      </Heading>
      <KeyValueList variant="stacked" items={item.facts} />
      <div className="flex flex-col gap-2.5">
        <Text variant="mono-label" tone="label" aria-hidden="true" className="leading-auto">
          {item.stackLabel}
        </Text>
        <ChipList items={item.stack} size="stack-sm" label={item.stackLabel} />
      </div>
      <div className="mt-auto flex flex-col gap-2">
        {item.links.map((link) => (
          <LinkRow
            key={link.label}
            href={link.href}
            tone={link.tone}
            glyph={link.glyph}
            {...(isExternal(link.href) ? { target: "_blank", rel: "noopener" } : {})}
          >
            {link.label}
            {isExternal(link.href) ? <span className="sr-only"> {ui.scout.newTab}</span> : null}
          </LinkRow>
        ))}
      </div>
    </Glass>
  );
}
