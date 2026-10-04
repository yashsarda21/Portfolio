import type { Route } from "./+types/arena.cricket";
import { PlaceholderScreen } from "@/shell/PlaceholderScreen";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("cricket");

export default function Cricket() {
  return <PlaceholderScreen route="cricket" />;
}
