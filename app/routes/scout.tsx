import type { Route } from "./+types/scout";
import { PlaceholderScreen } from "@/shell/PlaceholderScreen";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("scout");

export default function Scout() {
  return <PlaceholderScreen route="scout" />;
}
