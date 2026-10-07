import { useState } from "react";
import { content, ui } from "@/content";
import { SkyGlow, VenueGlow } from "@/design-system";
import { formEndpoint } from "@/shell/config";
import { ContentPage } from "@/shell/ContentPage";
import { ChallengeForm, type TeamUpDeps } from "./ChallengeForm";
import { DirectLines } from "./DirectLines";
import { SuccessPanel } from "./SuccessPanel";
import { buildTeamUpView, type TeamUpView } from "./view";

/**
 * The page's glows as drawn: a faint pool of volt behind the direct lines, the sky's light from the top left.
 * When a challenge goes out the floodlights pulse once (a brighter pool that rises and settles; none with
 * reduced motion).
 */
function TeamUpBackdrop({ pulse }: { pulse: boolean }) {
  return (
    <>
      <VenueGlow x="78%" y="50%" w="50%" h="60%" alpha={0.06} />
      <SkyGlow x="30%" y="-10%" w="60%" h="40%" alpha={0.14} />
      {pulse ? (
        <VenueGlow
          x="50%"
          y="50%"
          w="80%"
          h="80%"
          alpha={0.16}
          className="animate-floodlight-pulse"
        />
      ) : null}
    </>
  );
}

/**
 * The Team Up page: a pure view of a TeamUpView, plus how it sends (`deps`). The form gives way to the
 * success panel once a challenge is in; "send another" brings back an empty one with the cursor in the name.
 */
export function TeamUpPage({ view, deps }: { view: TeamUpView; deps: TeamUpDeps }) {
  const [sent, setSent] = useState(false);
  // Set by "send another": the fresh form then starts with the cursor in the name field.
  const [again, setAgain] = useState(false);

  return (
    <ContentPage
      route="teamUp"
      trail={[]}
      eyebrow={view.eyebrow}
      titleSize="xl"
      lede={view.intro}
      backdrop={<TeamUpBackdrop pulse={sent} />}
      columns={{ kind: "split", side: <DirectLines view={view} /> }}
    >
      {sent ? (
        <SuccessPanel
          view={view}
          onAgain={() => {
            setAgain(true);
            setSent(false);
          }}
        />
      ) : (
        <ChallengeForm view={view} deps={deps} onSent={() => setSent(true)} focusName={again} />
      )}
      {/* Always in the page, so a screen reader hears the line when it changes (the commentary bar is a picture). */}
      <p role="status" className="sr-only">
        {sent ? view.success.comm : ""}
      </p>
    </ContentPage>
  );
}

// Content is static, so the view is built once.
const view = buildTeamUpView(content, ui);

/** How the real page sends: through the form service when one is set, else the visitor's mail app. */
const deps: TeamUpDeps = {
  endpoint: formEndpoint,
  fetch: (input, init) => window.fetch(input, init),
  // `window.open(…, "_self")`, not `location.assign`: it does the same thing, and tests can stand in for it.
  openUrl: (url) => void window.open(url, "_self"),
};

export function TeamUpScreen() {
  return <TeamUpPage view={view} deps={deps} />;
}
