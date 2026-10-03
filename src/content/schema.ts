import { z } from "zod";

const YearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Expected YYYY-MM");
const Url = z.url();
const Link = z.object({ label: z.string().min(1), href: z.string().min(1) });

export const SkillLevelSchema = z.enum(["shipped", "built", "kit"]);
const Skill = z.union([
  z.tuple([z.string().min(1), SkillLevelSchema]),
  z.tuple([z.string().min(1), SkillLevelSchema, z.string().min(1)]),
]);

export const ContentSchema = z.object({
  player: z.object({
    name: z.string().min(1),
    title: z.string().min(1),
    tagline: z.string().min(1),
    summary: z.string().min(1),
    cardBio: z.string().min(1),
    location: z.string().min(1),
    currentClub: z.string().min(1),
    proSince: YearMonth,
    contact: z.object({
      email: z.email(),
      linkedin: Url,
      github: Url,
      leetcode: Url,
      codeforces: Url,
      codechef: Url,
    }),
    // Only a public file under /public may be linked (the original PDF contains a phone number).
    resumePdf: z
      .string()
      .regex(/^\/[\w./-]+\.pdf$/, "Must be a public path like /Yash-Sarda-Resume-public.pdf")
      .nullable(),
    cardStats: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })).length(6),
  }),
  careerStats: z
    .array(
      z.object({
        innings: z.string().regex(/^\d{2}$/),
        status: z.enum(["NOT OUT", "DEBUT"]),
        team: z.string().min(1),
        role: z.string().min(1),
        location: z.string().min(1),
        start: YearMonth,
        end: YearMonth.nullable(),
        ballByBall: z.array(z.string().min(1)).min(1),
        stack: z.array(z.string().min(1)).min(1),
        scoutLine: z.string().min(1),
      }),
    )
    .min(1),
  matchHighlights: z
    .array(
      z.object({
        round: z.enum(["THE FINAL", "SEMI-FINAL", "QUARTER-FINAL"]),
        name: z.string().min(1),
        kind: z.string().min(1),
        line: z.string().min(1),
        serve: z.string().min(1),
        rally: z.string().min(1),
        winner: z.string().min(1),
        stack: z.array(z.string().min(1)).min(1),
        media: z.string().nullable(),
        facts: z.array(z.object({ k: z.string().min(1), v: z.string().min(1) })).min(1),
        scoutLine: z.string().min(1),
      }),
    )
    .length(3),
  playerAttributes: z.object({
    levels: z.record(SkillLevelSchema, z.string().min(1)),
    groups: z
      .array(
        z.object({
          name: z.string().min(1),
          shot: z.string().min(1),
          note: z.string().min(1),
          skills: z.array(Skill).min(1),
        }),
      )
      .length(4),
    languages: z.array(z.string().min(1)),
    kitBag: z.array(z.string().min(1)),
  }),
  trophyRoom: z
    .array(
      z.object({
        type: z.enum(["cup", "medal", "plaque", "pennant", "round", "locked"]),
        title: z.string().min(1),
        sub: z.string().min(1),
        description: z.string().min(1),
        links: z.array(Link),
        draftCopy: z.boolean(),
      }),
    )
    .length(6),
  trainingAcademy: z.object({
    school: z.string().min(1),
    shortName: z.string().min(1),
    city: z.string().min(1),
    degree: z.string().min(1),
    start: YearMonth,
    end: YearMonth,
    cgpa: z.string().min(1),
    honours: z.string().min(1),
    extras: z.array(z.string().min(1)),
  }),
  commentary: z.record(z.string(), z.array(z.string().min(1)).min(1)),
});

export type Content = z.infer<typeof ContentSchema>;
export type SkillLevel = z.infer<typeof SkillLevelSchema>;

export class ContentError extends Error {
  override name = "ContentError";
}

/** Validate raw content. Throws ContentError listing every bad field path (e.g. "matchHighlights.1.name"). */
export function parseContent(raw: unknown): Content {
  const result = ContentSchema.safeParse(raw);
  if (result.success) return result.data;
  const lines = result.error.issues.map((issue) => `  • ${issue.path.join(".")}: ${issue.message}`);
  throw new ContentError(`content.json is invalid:\n${lines.join("\n")}`);
}
