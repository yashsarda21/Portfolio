import { useId } from "react";
import { ui } from "@/content";
import { ChannelCard, CommentaryBar, DashedPanel, Text } from "@/design-system";
import type { TeamUpView } from "./view";

/**
 * The other ways in: the four channels, then a preview of what happens after a send. Opens in the same tab
 * (the site's way); the arrow is decoration. On a tablet the channels sit two to a row.
 */
export function DirectLines({ view }: { view: TeamUpView }) {
  const labelId = useId();
  return (
    <section aria-labelledby={labelId} className="flex flex-col gap-2.5">
      <Text as="h2" id={labelId} variant="mono-label" tone="label" leading="font">
        {view.skip}
      </Text>
      <ul className="grid grid-cols-1 gap-2.5 md:max-lg:grid-cols-2">
        {view.channels.map((channel) => (
          <li key={channel.id} className="flex flex-col">
            <ChannelCard
              href={channel.href}
              icon={channel.icon}
              title={channel.title}
              sub={channel.sub}
              glyph={ui.glyph.external}
            />
          </li>
        ))}
      </ul>
      <DashedPanel label={view.after.label} className="mt-5">
        <CommentaryBar variant="inline" tag={ui.comm.tag} line={view.after.comm} />
        <Text as="p" variant="caption" tone="label">
          {view.after.text}{" "}
          <Text variant="mono-code" tone="primary">
            {view.after.board}
          </Text>
          {view.after.end}
        </Text>
      </DashedPanel>
    </section>
  );
}
