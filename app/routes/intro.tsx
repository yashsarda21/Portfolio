import type { Route } from "./+types/intro";
import { IntroScreen } from "@/features/intro/IntroScreen";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("intro");

export default function Intro() {
  return <IntroScreen />;
}
