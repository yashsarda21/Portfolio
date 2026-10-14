import { useLocation } from "react-router";
import type { Route } from "./+types/catch-all";
import { NotFoundScreen } from "@/features/not-found/NotFoundPage";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("notFound", { noindex: true });

export default function CatchAll() {
  const { pathname } = useLocation();
  return <NotFoundScreen path={pathname} />;
}
