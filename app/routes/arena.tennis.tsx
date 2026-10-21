import type { Route } from "./+types/arena.tennis";
import { TennisGame } from "@/features/games/tennis/TennisGame";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("tennis");

export default function Tennis() {
  return <TennisGame />;
}
