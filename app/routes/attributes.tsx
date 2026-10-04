import type { Route } from "./+types/attributes";
import { AttributesScreen } from "@/features/attributes/AttributesPage";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("attributes");

export default function Attributes() {
  return <AttributesScreen />;
}
