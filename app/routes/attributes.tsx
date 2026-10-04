import type { Route } from "./+types/attributes";
import { PlaceholderScreen } from "@/shell/PlaceholderScreen";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("attributes");

export default function Attributes() {
  return <PlaceholderScreen route="attributes" />;
}
