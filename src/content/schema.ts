import { z } from "zod";

const YearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Expected YYYY-MM");
const Url = z.url({ protocol: /^https$/ });
// https, mailto, or a single-slash root path ("//host" and "/\host" are treated as other hosts by browsers, so both are rejected).
const Link = z.strictObject({
  label: z.string().min(1),
  href: z
    .string()
    .regex(
      /^(https:\/\/|mailto:|\/(?![/\\]))/,
      "Must start with https://, mailto: or a single / (not // or /\\)",
    ),
});

// A media file: https or a single-slash root path (never "//host", "/\\host", http or a scheme such as javascript:).
const AssetPath = z
  .string()
  .regex(/^(https:\/\/|\/(?![/\\]))/, "Must start with https:// or a single / (not // or /\\)");

const PRIVATE_RESUME_NAME = "yash-sarda-resume.pdf"; // the original PDF contains a phone number
const Lines = z.array(z.string().min(1)).min(1);

const isUnique = (values: readonly string[]) => new Set(values).size === values.length;

export const SkillLevelSchema = z.enum(["shipped", "built", "kit"]);
const Skill = z.union([
  z.tuple([z.string().min(1), SkillLevelSchema]),
  z.tuple([z.string().min(1), SkillLevelSchema, z.string().min(1)]),
]);

export const ContentSchema = z.strictObject({
  scout: z.strictObject({
    summary: z.string().min(1),
    summaryShort: z.string().min(1),
    craftAndTools: z
      .array(z.string().min(1))
      .min(1)
      .refine(isUnique, "craftAndTools entries must be unique"),
  }),
  player: z.strictObject({
    name: z.string().min(1),
    title: z.string().min(1),
    tagline: z.string().min(1),
    summary: z.string().min(1),
    cardBio: z.string().min(1),
    location: z.string().min(1),
    currentClub: z.string().min(1),
    clubShort: z.string().min(1),
    position: z.string().min(1),
    playingStyle: z.string().min(1),
    proSince: YearMonth,
    contact: z.strictObject({
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
      .refine((p) => !p.startsWith("//"), "Must not be protocol-relative")
      .refine((p) => !p.split("/").includes(".."), "Must not contain ..")
      .refine(
        (p) => p.split("/").pop()!.toLowerCase() !== PRIVATE_RESUME_NAME,
        "Must not be the private resume file",
      )
      .nullable(),
    // `id` names a stat for code that needs one in particular (`problems`); `label` is only what the card prints.
    cardStats: z
      .array(
        z.strictObject({
          id: z.string().regex(/^[a-z][a-z0-9-]*$/),
          label: z.string().min(1),
          value: z.string().min(1),
        }),
      )
      .length(6)
      .refine(
        (stats) => new Set(stats.map((s) => s.id)).size === stats.length,
        "Ids must be unique",
      )
      .refine((stats) => stats.some((s) => s.id === "problems"), 'Needs a "problems" stat'),
  }),
  careerStats: z
    .array(
      z
        .strictObject({
          innings: z.string().regex(/^\d{2}$/),
          status: z.enum(["NOT OUT", "DEBUT"]),
          team: z.string().min(1),
          role: z.string().min(1),
          shortRole: z.string().min(1),
          location: z.string().min(1),
          start: YearMonth,
          end: YearMonth.nullable(),
          ballByBall: z.array(z.string().min(1)).min(1),
          stack: z.array(z.string().min(1)).min(1),
          scoutLine: z.string().min(1),
        })
        .superRefine((row, ctx) => {
          if (row.end !== null && row.start > row.end) {
            ctx.addIssue({
              code: "custom",
              path: ["end"],
              message: "end must not be before start",
            });
          }
          if ((row.status === "NOT OUT") !== (row.end === null)) {
            ctx.addIssue({
              code: "custom",
              path: ["status"],
              message: 'status "NOT OUT" must go with end: null (and only then)',
            });
          }
        }),
    )
    .min(1),
  matchHighlights: z
    .array(
      z.strictObject({
        round: z.enum(["THE FINAL", "SEMI-FINAL", "QUARTER-FINAL"]),
        name: z.string().min(1),
        shortName: z.string().min(1),
        scoutTag: z.string().min(1),
        scoutShort: z.string().min(1),
        kind: z.string().min(1),
        line: z.string().min(1),
        serve: z.string().min(1),
        rally: z.string().min(1),
        winner: z.string().min(1),
        stack: z.array(z.string().min(1)).min(1),
        // A screen recording. `silent` (WCAG 1.2.1, video-only) needs no captions, only the text alternative the
        // page already shows; a recording with sound must carry captions.
        media: z
          .strictObject({
            src: AssetPath,
            poster: AssetPath.optional(),
            captions: AssetPath.optional(),
            silent: z.boolean(),
          })
          .refine((m) => m.silent || m.captions !== undefined, {
            path: ["captions"],
            message: "A recording with sound needs captions",
          })
          .nullable(),
        facts: z.array(z.strictObject({ k: z.string().min(1), v: z.string().min(1) })).min(1),
        scoutLine: z.string().min(1),
        links: z
          .strictObject({ code: Url.optional(), demo: Url.optional(), caseStudy: Url.optional() })
          .optional(),
      }),
    )
    .length(3)
    .refine(
      (rows) => isUnique(rows.map((r) => r.round)),
      "Each round (QF, SF, FINAL) must appear once",
    ),
  playerAttributes: z.strictObject({
    levels: z.record(SkillLevelSchema, z.string().min(1)),
    groups: z
      .array(
        z.strictObject({
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
      z.strictObject({
        type: z.enum(["cup", "medal", "plaque", "pennant", "round", "locked"]),
        title: z.string().min(1),
        sub: z.string().min(1),
        shortSub: z.string().min(1).optional(),
        description: z.string().min(1),
        links: z.array(Link),
        draftCopy: z.boolean(),
      }),
    )
    .length(6)
    .refine((rows) => isUnique(rows.map((r) => r.type)), "Each trophy type must appear once"),
  trainingAcademy: z
    .strictObject({
      school: z.string().min(1),
      shortName: z.string().min(1),
      city: z.string().min(1),
      degree: z.string().min(1),
      degreeShort: z.string().min(1),
      start: YearMonth,
      end: YearMonth,
      cgpa: z.string().min(1),
      honours: z.string().min(1),
      /** The honours on one short line (Trophy Room card); falls back to `honours`. */
      honoursShort: z.string().min(1).optional(),
      extras: z.array(z.string().min(1)),
    })
    .refine((a) => a.start <= a.end, { path: ["end"], message: "end must not be before start" }),
  commentary: z.strictObject({
    entrance: Lines,
    inPlay: Lines,
    reveal: Lines,
    closeCall: Lines,
    yashWins: Lines,
    intro: Lines,
  }),
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
