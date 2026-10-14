import type { Route } from "./+types/not-found";
import { NotFoundScreen } from "@/features/not-found/NotFoundPage";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("notFound", { noindex: true });

export default function NotFound() {
  return <NotFoundScreen />;
}
