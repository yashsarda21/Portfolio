import type { Route } from "./+types/arena.badminton";
import { BadmintonScreen } from "@/features/games/badminton/BadmintonScreen";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("badminton");

export default function Badminton() {
  return <BadmintonScreen />;
}
