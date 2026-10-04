import type { Route } from "./+types/highlights";
import { HighlightsScreen } from "@/features/highlights/HighlightsPage";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("highlights");

export default function Highlights() {
  return <HighlightsScreen />;
}
