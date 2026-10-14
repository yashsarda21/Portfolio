import { type RouteConfig, index, route } from "@react-router/dev/routes";

// Mirrors ROUTES in src/shell/routes.ts (spec §4.5).
export default [
  index("routes/home.tsx"),
  route("intro", "routes/intro.tsx"),
  route("arena", "routes/arena.tsx"),
  route("arena/cricket", "routes/arena.cricket.tsx"),
  route("arena/tennis", "routes/arena.tennis.tsx"),
  route("arena/badminton", "routes/arena.badminton.tsx"),
  route("arena/full-time", "routes/arena.full-time.tsx"),
  route("career", "routes/career.tsx"),
  route("highlights", "routes/highlights.tsx"),
  route("attributes", "routes/attributes.tsx"),
  route("trophies", "routes/trophies.tsx"),
  route("card", "routes/card.tsx"),
  route("team-up", "routes/team-up.tsx"),
  route("scout", "routes/scout.tsx"),
  route("404", "routes/not-found.tsx"),
  route("*", "routes/catch-all.tsx"),
] satisfies RouteConfig;
