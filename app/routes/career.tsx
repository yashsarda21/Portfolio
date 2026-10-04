import type { Route } from "./+types/career";
import { PlaceholderScreen } from "@/shell/PlaceholderScreen";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("career");

export default function Career() {
  return <PlaceholderScreen route="career" />;
}
