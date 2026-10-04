import { content, ui } from "@/content";
import { Button, FluidContainer, SkyGlow, StickyBottomActions } from "@/design-system";
import { ArenaLink } from "@/shell/ArenaLink";
import { ROUTES } from "@/shell/routes";
import { AttributesSection } from "./AttributesSection";
import { CareerSection } from "./CareerSection";
import { HighlightsSection } from "./HighlightsSection";
import { buildScoutReport, type ScoutReport } from "./report";
import { ScoutFooter } from "./ScoutFooter";
import { ScoutHeader } from "./ScoutHeader";
import { ScoutHero } from "./ScoutHero";
import { TeamUpBand } from "./TeamUpBand";
import { TrophiesSection } from "./TrophiesSection";

/** The recruiter's page: one scroll, every section, no game. Pure view of a ScoutReport. */
export function QuickView({ report }: { report: ScoutReport }) {
  return (
    <div className="relative min-h-dvh bg-ground text-floodlight">
      <SkyGlow w="80%" h="500px" alpha={0.12} className="max-md:hidden" />
      <ScoutHeader header={report.header} />
      <FluidContainer as="main" id="main" className="relative flex flex-col gap-24 max-md:gap-4">
        <ScoutHero hero={report.hero} />
        <CareerSection career={report.career} sep={report.hero.sep} />
        <HighlightsSection highlights={report.highlights} />
        <AttributesSection attributes={report.attributes} />
        <TrophiesSection trophies={report.trophies} academy={report.academy} />
        <TeamUpBand teamUp={report.teamUp} />
      </FluidContainer>
      <ScoutFooter footer={report.footer} />
      <StickyBottomActions label={report.actions.label}>
        <Button as={ArenaLink} to={report.actions.card.to} size="bar" variant="panel" skew={false}>
          {report.actions.card.label}
        </Button>
        <Button as="a" href={report.actions.teamUp.href} size="bar" skew={false} glow={false}>
          {report.actions.teamUp.label}
        </Button>
      </StickyBottomActions>
    </div>
  );
}

// Content is static, so the report is built once.
const report = buildScoutReport(content, ui, ROUTES);

export function QuickViewScreen() {
  return <QuickView report={report} />;
}
