import { KeyValueList, Text } from "@/design-system";
import type { CardView } from "./view";

/**
 * The profile under the page title: the bio, then the facts as ruled rows (the academy row in volt).
 * Last on the phone, after the card and the actions; the page's grid places it.
 */
export function Profile({ view }: { view: Pick<CardView, "bio" | "rows"> }) {
  return (
    <div className="flex flex-col gap-5.5 max-md:pt-8">
      <Text as="p" variant="body-lg" tone="body">
        {view.bio}
      </Text>
      <KeyValueList items={view.rows} />
    </div>
  );
}
