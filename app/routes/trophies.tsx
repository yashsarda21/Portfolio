import type { Route } from "./+types/trophies";
import { TrophiesScreen } from "@/features/trophies/TrophiesPage";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("trophies");

export default function Trophies() {
  return <TrophiesScreen />;
}
