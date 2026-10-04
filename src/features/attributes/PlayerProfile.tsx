import { useId } from "react";
import { Glass, Heading, KeyValueList, PortraitFrame, Text } from "@/design-system";
import type { AttributesView } from "./view";

/**
 * The player's profile card: portrait with the position badge, name and role, then the spec sheet.
 * A column on desktop and the phone; on a tablet the portrait sits left of the name and the sheet.
 */
export function PlayerProfile({ profile }: { profile: AttributesView["profile"] }) {
  const nameId = useId();
  const { portrait, badge, kitBag } = profile;
  return (
    <Glass
      as="section"
      aria-labelledby={nameId}
      pad="md"
      className="grid min-w-0 content-start gap-4 md:max-[1199px]:grid-cols-[260px_minmax(0,1fr)] md:max-[1199px]:gap-x-6"
    >
      <PortraitFrame
        src={portrait.src}
        alt={portrait.alt}
        badge={badge}
        className="md:max-[1199px]:row-span-2"
      />
      <div className="flex flex-col gap-0.5">
        <Heading level={2} id={nameId} variant="player-name">
          {profile.name}
        </Heading>
        <Text variant="body-sm" tone="secondary" leading="font">
          {profile.roleLine}
        </Text>
      </div>
      <KeyValueList
        variant="profile"
        items={[...profile.rows, { k: kitBag.label, v: kitBag.items, stacked: true }]}
      />
    </Glass>
  );
}
