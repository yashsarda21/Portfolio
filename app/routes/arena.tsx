import type { Route } from "./+types/arena";
import { PlaceholderScreen } from "@/shell/PlaceholderScreen";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("arena");

export default function Arena() {
  return <PlaceholderScreen route="arena" />;
}
