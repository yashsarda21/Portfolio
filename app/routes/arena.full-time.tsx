import type { Route } from "./+types/arena.full-time";
import { FullTimeScreen } from "@/features/full-time/FullTimeScreen";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("fullTime");

export default function FullTime() {
  return <FullTimeScreen />;
}
