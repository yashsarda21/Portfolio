import type { Route } from "./+types/intro";
import { PlaceholderScreen } from "@/shell/PlaceholderScreen";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("intro");

export default function Intro() {
  return <PlaceholderScreen route="intro" />;
}
