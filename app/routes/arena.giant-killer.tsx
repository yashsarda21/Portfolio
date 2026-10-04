import type { Route } from "./+types/arena.giant-killer";
import { PlaceholderScreen } from "@/shell/PlaceholderScreen";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("giantKiller");

export default function GiantKiller() {
  return <PlaceholderScreen route="giantKiller" />;
}
