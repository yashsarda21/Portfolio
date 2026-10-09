import type { Route } from "./+types/arena.tennis";
import { TennisScreen } from "@/features/games/tennis/TennisScreen";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("tennis");

export default function Tennis() {
  return <TennisScreen />;
}
