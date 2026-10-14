import type { Route } from "./+types/arena.full-time";
import { PlaceholderScreen } from "@/shell/PlaceholderScreen";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("fullTime");

export default function FullTime() {
  return <PlaceholderScreen route="fullTime" />;
}
