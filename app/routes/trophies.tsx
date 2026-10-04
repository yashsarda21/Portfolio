import type { Route } from "./+types/trophies";
import { PlaceholderScreen } from "@/shell/PlaceholderScreen";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("trophies");

export default function Trophies() {
  return <PlaceholderScreen route="trophies" />;
}
