import type { Route } from "./+types/highlights";
import { PlaceholderScreen } from "@/shell/PlaceholderScreen";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("highlights");

export default function Highlights() {
  return <PlaceholderScreen route="highlights" />;
}
