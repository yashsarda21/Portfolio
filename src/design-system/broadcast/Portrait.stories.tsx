import type { Meta, StoryObj } from "@storybook/react-vite";
import portrait from "@/assets/portrait-rest.webp";
import { AcademyCard } from "./AcademyCard";
import { PortraitFrame } from "./PortraitFrame";

const meta: Meta = { title: "Broadcast/Portrait and Academy" };
export default meta;

/** Badminton-Attributes: 258px of image in the 300px profile card (20px padding). */
export const AttributesPortrait: StoryObj = {
  render: () => (
    <div className="w-75 glass p-5">
      <PortraitFrame
        src={portrait}
        alt="Yash Sarda"
        size="attr"
        badge={{ value: "SE", label: "POSITION" }}
      />
    </div>
  ),
};

/** Player-Card: a volt glow and a hairline under the frame; no badge inside (the card draws its own above). */
export const CardPortrait: StoryObj = {
  render: () => (
    <div className="w-93 bg-panel px-6 py-4">
      <PortraitFrame src={portrait} alt="Yash Sarda" size="card" />
    </div>
  ),
};

/** A second copy on the same page is decorative: empty alt. */
export const DecorativeCopy: StoryObj = {
  render: () => (
    <div className="w-75 glass p-5">
      <PortraitFrame
        src={portrait}
        alt=""
        size="attr"
        badge={{ value: "SE", label: "POSITION" }}
        loading="lazy"
      />
    </div>
  ),
};

const ACADEMY = {
  eyebrow: "EDUCATION",
  aside: "WHERE THE FUNDAMENTALS CAME FROM",
  title: "TRAINING ACADEMY",
  monogram: "PICT",
  name: "Pune Institute of Computer Technology",
  degree: "B.Tech, Information Technology",
  meta: "JUL 2020 – JUN 2024 · CGPA 8.94 · DISTINCTION",
  extrasLabel: "EXTRA DRILLS",
  extras: [
    "Published paper: AI-Enhanced Interview Grooming Platform",
    "MHT-CET 99.5 percentile, State Merit Rank 709",
  ],
} as const;

/** The Trophy Room's education card at its artboard width (474px). */
export const Academy: StoryObj = {
  render: () => <AcademyCard {...ACADEMY} id="academy" className="w-118.5" />,
};

export const AcademyNoExtras: StoryObj = {
  render: () => <AcademyCard {...ACADEMY} extras={[]} className="w-118.5" />,
};

/** Sits under an h1 and an h2 on a page: headingLevel 3. */
export const AcademyH3: StoryObj = {
  render: () => <AcademyCard {...ACADEMY} headingLevel={3} className="w-118.5" />,
};
