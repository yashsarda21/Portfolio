import type { Route } from "./+types/locker-room";
import { PlaceholderScreen } from "@/shell/PlaceholderScreen";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("lockerRoom");

export default function LockerRoom() {
  return <PlaceholderScreen route="lockerRoom" />;
}
