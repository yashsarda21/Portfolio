import { content, ui } from "@/content";
import { ROUTES } from "@/shell/routes";
import { buildHubView, type HubRecord } from "./view";

/** The Hub artboard's state: cricket played "14* NOT OUT", record 1 to 0, Career seen. */
export const artboardRecord: HubRecord = {
  venuesPlayed: ["cricket"],
  lastScores: { cricket: "14* NOT OUT" },
  sectionsSeen: ["career"],
  record: { yash: 1, you: 0 },
  achievements: [],
  lockerRoomUnlocked: false,
};

export const artboardHubView = buildHubView(content, ui, ROUTES, artboardRecord);
