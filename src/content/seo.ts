import type { Content } from "./schema";

/** schema.org Person for the Quick View page (spec §10 Phase 1). Only public facts — never a phone number or the private PDF. */
export function getPersonJsonLd(c: Content): Record<string, unknown> {
  const { player, trainingAcademy: a } = c;
  const [locality, country] = player.location.split(",").map((s) => s.trim());
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: player.name,
    jobTitle: player.title,
    description: c.scout.summary,
    email: `mailto:${player.contact.email}`,
    worksFor: { "@type": "Organization", name: player.currentClub },
    address: { "@type": "PostalAddress", addressLocality: locality, addressCountry: country },
    alumniOf: { "@type": "CollegeOrUniversity", name: a.school },
    sameAs: [
      player.contact.linkedin,
      player.contact.github,
      player.contact.leetcode,
      player.contact.codeforces,
      player.contact.codechef,
    ],
  };
}
