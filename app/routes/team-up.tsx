import type { Route } from "./+types/team-up";
import { PlaceholderScreen } from "@/shell/PlaceholderScreen";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("teamUp");

export default function TeamUp() {
  return <PlaceholderScreen route="teamUp" />;
}
