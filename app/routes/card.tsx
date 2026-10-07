import type { Route } from "./+types/card";
import { CardScreen } from "@/features/card/CardPage";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("card");

export default function Card() {
  return <CardScreen />;
}
