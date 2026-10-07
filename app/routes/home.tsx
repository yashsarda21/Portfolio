import type { Route } from "./+types/home";
import { LandingScreen } from "@/features/landing/LandingScreen";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("home");

export default function Home() {
  return <LandingScreen />;
}
