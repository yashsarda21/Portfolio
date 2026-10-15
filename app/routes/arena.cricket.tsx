import type { Route } from "./+types/arena.cricket";
import { CricketGame } from "@/features/games/cricket/CricketGame";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("cricket");

export default function Cricket() {
  return <CricketGame />;
}
