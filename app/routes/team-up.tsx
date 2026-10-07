import type { Route } from "./+types/team-up";
import { TeamUpScreen } from "@/features/team-up/TeamUpPage";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("teamUp");

export default function TeamUp() {
  return <TeamUpScreen />;
}
