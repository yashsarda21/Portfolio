import type { Route } from "./+types/catch-all";
import { PlaceholderScreen } from "@/shell/PlaceholderScreen";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("notFound");

export default function CatchAll() {
  return <PlaceholderScreen route="notFound" />;
}
