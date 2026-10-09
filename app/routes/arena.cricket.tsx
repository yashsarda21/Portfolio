import type { Route } from "./+types/arena.cricket";
import { CricketScreen } from "@/features/games/cricket/CricketScreen";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("cricket");

export default function Cricket() {
  return <CricketScreen />;
}
