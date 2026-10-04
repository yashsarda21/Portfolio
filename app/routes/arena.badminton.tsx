import type { Route } from "./+types/arena.badminton";
import { PlaceholderScreen } from "@/shell/PlaceholderScreen";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("badminton");

export default function Badminton() {
  return <PlaceholderScreen route="badminton" />;
}
