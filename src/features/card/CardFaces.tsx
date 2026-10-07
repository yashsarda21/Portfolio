import { ui } from "@/content";
import { Heading, LinkRow, PlayerCard } from "@/design-system";
import { ArenaLink } from "@/shell/ArenaLink";
import type { CardView } from "./view";

/** The card's front: position and season, portrait, name, the six stats, and the foot line. */
export function CardFront({ view, year }: { view: CardView["front"]; year: number }) {
  return (
    <>
      <PlayerCard.Header
        position={view.position}
        mark={view.mark}
        season={`${view.season.label} ${year}`}
      />
      <PlayerCard.Portrait src={view.portrait.src} alt={view.portrait.alt} />
      <PlayerCard.Name name={view.name} line={view.line} />
      <PlayerCard.Stats stats={view.stats} />
      <PlayerCard.Footer left={view.footer.left} right={view.footer.right} />
    </>
  );
}

/**
 * The card's back: an index of the other pages (each a row linking to it), the address, and the same foot line. Its links
 * are only reachable while this face shows (the front is inert then, and this one is inert until the flip).
 */
export function CardBack({ view }: { view: CardView["back"] }) {
  return (
    <>
      <div className="flex flex-col gap-3 px-6 pt-5">
        <Heading level={2} variant="d3" tone="volt">
          {view.title}
        </Heading>
        <ul className="flex flex-col gap-2.5">
          {view.items.map((item) => (
            <li key={item.to}>
              <LinkRow as={ArenaLink} to={item.to} tone="outline" glyph={ui.glyph.next}>
                {item.label}
              </LinkRow>
            </li>
          ))}
        </ul>
      </div>
      <PlayerCard.Contact
        label={view.contact.label}
        value={view.contact.value}
        href={view.contact.href}
      />
      {/* The contact block owns the free space above it; the foot line follows it. */}
      <PlayerCard.Footer left={view.footer.left} right={view.footer.right} className="mt-0" />
    </>
  );
}
