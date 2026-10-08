import type { Route } from "./+types/arena";
import { HubScreen } from "@/features/hub/HubScreen";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("arena");

export default function Arena() {
  return <HubScreen />;
}
