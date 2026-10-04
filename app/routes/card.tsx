import type { Route } from "./+types/card";
import { PlaceholderScreen } from "@/shell/PlaceholderScreen";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("card");

export default function Card() {
  return <PlaceholderScreen route="card" />;
}
