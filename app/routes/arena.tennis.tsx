import type { Route } from "./+types/arena.tennis";
import { PlaceholderScreen } from "@/shell/PlaceholderScreen";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("tennis");

export default function Tennis() {
  return <PlaceholderScreen route="tennis" />;
}
