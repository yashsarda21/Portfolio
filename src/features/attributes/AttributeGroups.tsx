import { SkillGroup } from "@/design-system";
import type { AttributesView } from "./view";

/** The skill groups: a 2×2 grid that fills the panel height on desktop, two columns on a tablet, one on the phone. */
export function AttributeGroups({ groups }: { groups: AttributesView["groups"] }) {
  return (
    <div className="grid min-w-0 gap-4 min-[1200px]:grid-rows-[repeat(2,minmax(0,1fr))] md:grid-cols-2">
      {groups.map((group) => (
        <SkillGroup key={group.name} {...group} animate />
      ))}
    </div>
  );
}
