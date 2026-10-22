import type { Route } from "./+types/arena.badminton";
import { BadmintonGame } from "@/features/games/badminton/BadmintonGame";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("badminton");

export default function Badminton() {
  return <BadmintonGame />;
}
