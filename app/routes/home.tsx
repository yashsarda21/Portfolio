import type { Route } from "./+types/home";
import { LandingPreview } from "@/features/landing-preview/LandingPreview";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("home");

export default function Home() {
  return <LandingPreview />;
}
