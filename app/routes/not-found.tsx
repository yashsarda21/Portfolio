import type { Route } from "./+types/not-found";
import { PlaceholderScreen } from "@/shell/PlaceholderScreen";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("notFound");

export default function NotFound() {
  return <PlaceholderScreen route="notFound" />;
}
