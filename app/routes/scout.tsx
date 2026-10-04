import type { Route } from "./+types/scout";
import { content, getPersonJsonLd } from "@/content";
import { QuickViewScreen } from "@/features/quick-view/QuickView";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () =>
  pageMeta("scout", { type: "profile", jsonLd: getPersonJsonLd(content) });

export default function Scout() {
  return <QuickViewScreen />;
}
