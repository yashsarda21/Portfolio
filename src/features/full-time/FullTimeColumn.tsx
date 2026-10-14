import {
  BrandLockup,
  Button,
  Glass,
  Heading,
  IconToast,
  MonoLabel,
  ResultBoard,
  ScreenColumn,
  Text,
} from "@/design-system";
import { ArenaLink, TunnelLink } from "@/shell/ArenaLink";
import { QuickViewChip } from "@/shell/QuickViewChip";
import type { FullTimeView } from "./view";

/**
 * Full Time below 1200px (derived: the artboard is a stage; centred and a size step up on a tablet, F7). Plain flow
 * in a ScreenColumn, so a short phone scrolls: the toast, the board, the verdict, its line, the card with its button
 * under the text, the links stacked as bars, and the note. No design space, no commentary. `ready` is false until
 * the saved record has loaded; the parts that depend on it wait (H5).
 */
export function FullTimeColumn({ view, ready }: { view: FullTimeView; ready: boolean }) {
  const pending = ready ? {} : { "data-record-pending": "" };
  const Cta = view.state === "pending" ? TunnelLink : ArenaLink;
  return (
    <ScreenColumn
      until="lg"
      data-full-time-column=""
      top={
        <>
          <BrandLockup mark={view.brand.mark} size="sm" />
          <QuickViewChip tone="glass-line" />
        </>
      }
      actions={
        <>
          <div {...pending} className="flex flex-col gap-3">
            {view.links.map((link, i) => (
              <Button
                key={link.to}
                as={ArenaLink}
                to={link.to}
                size="bar"
                skew={false}
                variant={i === view.links.length - 1 ? "ghost" : "secondary"}
              >
                {link.label}
              </Button>
            ))}
          </div>
          {view.note ? (
            <Text as="p" variant="mono-nav" tone="dim" className="text-center">
              {view.note}
            </Text>
          ) : null}
        </>
      }
    >
      <div className="flex flex-col items-center gap-4 text-center md:gap-5">
        <IconToast
          icon="trophy"
          eyebrow={view.toast.eyebrow}
          title={view.toast.title}
          eyebrowProps={pending}
          className="w-full text-left"
        />
        <div {...pending} className="max-w-full">
          <ResultBoard {...view.board} />
        </div>
        <Heading level={1} className="text-balance" {...pending}>
          {view.headline}
        </Heading>
        <Text as="p" variant="lede" tone="body" className="text-balance italic" {...pending}>
          {view.line}
        </Text>
        <Glass
          edge="volt"
          {...pending}
          className="mt-2 flex w-full flex-col gap-4 px-5 py-5 text-left md:px-7 md:py-6"
        >
          <div className="flex flex-col gap-1.5">
            <MonoLabel tone="volt">{view.card.eyebrow}</MonoLabel>
            <Text as="span" variant="title-lg">
              {view.card.title}
            </Text>
            <Text as="span" variant="body-copy" tone="secondary">
              {view.card.body}
            </Text>
          </div>
          <Button as={Cta} to={view.card.cta.to} size="bar-lg" skew={false}>
            {view.card.cta.label}
          </Button>
        </Glass>
      </div>
    </ScreenColumn>
  );
}
