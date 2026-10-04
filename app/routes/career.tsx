import type { Route } from "./+types/career";
import { CareerScreen } from "@/features/career/CareerPage";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("career");

export default function Career() {
  return <CareerScreen />;
}
