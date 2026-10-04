// Artboard copy for pixel-parity stories only (Badminton-Attributes). Real pages use buildAttributesView().
import portraitSrc from "@/assets/portrait-rest.webp";
import type { AttributesView } from "./view";

export const artboardAttributesView: AttributesView = {
  legend: [
    { label: "SHIPPED AT DEUTSCHE BANK", swatch: "volt" },
    { label: "BUILT IN PROJECTS", swatch: "floodlight" },
    { label: "IN THE KIT BAG", swatch: "dim" },
  ],
  profile: {
    portrait: { src: portraitSrc, alt: "Yash Sarda" },
    badge: { value: "SE", label: "POSITION" },
    name: "YASH SARDA",
    roleLine: "Software Engineer 1 · Deutsche Bank",
    rows: [
      { k: "Playing style", v: "Full-stack" },
      { k: "Languages", v: "Java · JavaScript · Python" },
    ],
    kitBag: {
      label: "Kit bag",
      items: "Git · Google Cloud · CI/CD · Postman · Cursor · Gen AI · TeamCity · uDeploy",
    },
  },
  groups: [
    {
      name: "BACKEND",
      shotLine: "SHOT · SMASH",
      note: "Power and pace — where most of my points are won.",
      skills: [
        { name: "Java", level: "shipped", tierLabel: "SHIPPED" },
        { name: "Spring Boot", level: "shipped", tierLabel: "SHIPPED" },
        { name: "JUnit", level: "shipped", tierLabel: "75+ TESTS" },
        { name: "Apache Kafka", level: "kit", tierLabel: "KIT BAG" },
      ],
    },
    {
      name: "FRONTEND",
      shotLine: "SHOT · DROP SHOT",
      note: "Finesse at the net — the part users actually touch.",
      skills: [
        { name: "React", level: "shipped", tierLabel: "SHIPPED" },
        { name: "Redux", level: "shipped", tierLabel: "SHIPPED" },
        { name: "JavaScript", level: "built", tierLabel: "BUILT" },
        { name: "HTML / CSS", level: "built", tierLabel: "BUILT" },
      ],
    },
    {
      name: "DATA",
      shotLine: "SHOT · DEFENCE",
      note: "Consistent, reliable, never gives away a cheap point.",
      skills: [
        { name: "Oracle", level: "shipped", tierLabel: "SHIPPED" },
        { name: "SQL", level: "shipped", tierLabel: "SHIPPED" },
        { name: "MySQL", level: "kit", tierLabel: "KIT BAG" },
        { name: "MongoDB", level: "kit", tierLabel: "KIT BAG" },
      ],
    },
    {
      name: "CRAFT",
      shotLine: "SHOT · COURT VISION",
      note: "Reading the whole court before the shuttle lands.",
      skills: [
        { name: "DSA", level: "shipped", tierLabel: "750+ SOLVED" },
        { name: "OOP", level: "shipped", tierLabel: "SHIPPED" },
        { name: "System Design", level: "built", tierLabel: "BLOGS" },
        { name: "Gen AI · Gemini", level: "built", tierLabel: "BUILT" },
      ],
    },
  ],
};
