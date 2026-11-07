import { existsSync, readdirSync } from "node:fs";
import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-config-prettier";
import { importX, createNodeResolver } from "eslint-plugin-import-x";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import globals from "globals";

// Zod and the content schema are build/test-only: never import them from client code (spec §6).
const ZOD_PATH = { name: "zod", message: "Zod is build-time only (content schema)." };
const SCHEMA_PATTERN = {
  group: ["@/content/schema", "**/content/schema"],
  message: "Import from @/content; the schema is build/test-only.",
};

// Flat config replaces a rule per key, so every client-code block must carry the zod/schema ban itself.
// Only src/content is exempt (content owns the schema and its tests).
const restrictImports = (groups, message, { clientCode = true } = {}) => ({
  "no-restricted-imports": [
    "error",
    clientCode
      ? { paths: [ZOD_PATH], patterns: [{ group: groups, message }, SCHEMA_PATTERN] }
      : { patterns: [{ group: groups, message }] },
  ],
});

// Filesystem-based zones: these catch relative imports as well as the @/ and ~/ aliases.
const FEATURES_DIR = "src/features";
const featureNames = existsSync(FEATURES_DIR)
  ? readdirSync(FEATURES_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
  : [];

const FOLDER_ZONES = [
  {
    target: "./src/design-system",
    from: ["./src/content", "./src/features", "./src/shell", "./app"],
    message: "design-system must not depend on app code (spec §4.2).",
  },
  {
    target: ["./src/content", "./src/lib"],
    from: ["./src/design-system", "./src/features", "./src/shell", "./app"],
    message: "content/ and lib/ are leaf layers (spec §4.2).",
  },
  ...featureNames.map((name) => ({
    target: `./src/features/${name}`,
    from: "./src/features",
    except: [`./${name}`],
    message: "Features never import each other; move shared code down (spec §4.2).",
  })),
];

const RAW_STYLE_LITERALS = [
  {
    selector: "Literal[value=/#[0-9A-Fa-f]{3,8}(?![0-9A-Za-z])/]",
    message: "Use design tokens, not raw hex colours (spec §4.2).",
  },
  {
    selector: "TemplateElement[value.raw=/#[0-9A-Fa-f]{3,8}(?![0-9A-Za-z])/]",
    message: "Use design tokens, not raw hex colours (spec §4.2).",
  },
  {
    selector: "Literal[value=/rgba?\\(/]",
    message: "Use design tokens, not raw rgb()/rgba() (spec §4.2).",
  },
  {
    selector: "TemplateElement[value.raw=/rgba?\\(/]",
    message: "Use design tokens, not raw rgb()/rgba() (spec §4.2).",
  },
  {
    selector: "Literal[value=/cubic-bezier\\(/]",
    message: "Use motion tokens (ease-follow / ease-snap / ease-swing) (spec §4.2).",
  },
  {
    selector: "TemplateElement[value.raw=/cubic-bezier\\(/]",
    message: "Use motion tokens (ease-follow / ease-snap / ease-swing) (spec §4.2).",
  },
  {
    selector: "Literal[value=/\\b(text|leading|tracking)-\\[\\d/]",
    message: "Use type-* recipes, not arbitrary type sizes (spec §4.2).",
  },
  {
    selector: "TemplateElement[value.raw=/\\b(text|leading|tracking)-\\[\\d/]",
    message: "Use type-* recipes, not arbitrary type sizes (spec §4.2).",
  },
  {
    selector: "Literal[value=/\\b(shadow|blur|drop-shadow)-\\[\\d/]",
    message:
      "Use the shadow-* and blur-* tokens (theme.css), not arbitrary shadow or blur geometry (spec §4.2).",
  },
  {
    selector: "TemplateElement[value.raw=/\\b(shadow|blur|drop-shadow)-\\[\\d/]",
    message:
      "Use the shadow-* and blur-* tokens (theme.css), not arbitrary shadow or blur geometry (spec §4.2).",
  },
  {
    selector: "Literal[value=/\\btext-(line-3|line-hover|seg-empty|mast|fixture)\\b/]",
    message: "Decoration colour used as text fails contrast (spec A1).",
  },
  {
    selector: "TemplateElement[value.raw=/\\btext-(line-3|line-hover|seg-empty|mast|fixture)\\b/]",
    message: "Decoration colour used as text fails contrast (spec A1).",
  },
];

export default defineConfig(
  {
    ignores: [
      "build",
      ".react-router",
      "storybook-static",
      "coverage",
      "playwright-report",
      "test-results",
      "design",
      "temp_handoff",
      ".claude",
      "tools/render-artboards/runtime.js",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  jsxA11y.flatConfigs.recommended,
  {
    files: ["**/*.mjs", "*.config.{js,ts}", "tools/**/*"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "import-x": importX },
    settings: {
      "import-x/resolver-next": [
        createTypeScriptImportResolver({ project: "./tsconfig.json" }),
        createNodeResolver(),
      ],
    },
    rules: {
      "import-x/no-restricted-paths": [
        "error",
        { basePath: import.meta.dirname, zones: FOLDER_ZONES },
      ],
    },
  },
  {
    files: ["src/design-system/**/*.{ts,tsx}"],
    rules: restrictImports(
      ["@/content", "@/content/*", "@/features/*", "@/shell", "@/shell/*", "~/*"],
      "design-system must not depend on app code (spec §4.2).",
    ),
  },
  {
    files: ["src/content/**/*.{ts,tsx}"],
    rules: restrictImports(
      ["@/design-system", "@/design-system/*", "@/features/*", "@/shell", "@/shell/*", "~/*"],
      "content/ and lib/ are leaf layers (spec §4.2).",
      { clientCode: false },
    ),
  },
  {
    // lib ships to the client, so it carries the zod/schema ban like every other client folder.
    files: ["src/lib/**/*.{ts,tsx}"],
    rules: restrictImports(
      ["@/design-system", "@/design-system/*", "@/features/*", "@/shell", "@/shell/*", "~/*"],
      "content/ and lib/ are leaf layers (spec §4.2).",
    ),
  },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: restrictImports(
      ["@/features/*"],
      "Features never import each other; move shared code down (spec §4.2).",
    ),
  },
  {
    // Folders with no layer rule of their own still get the zod/schema ban.
    files: ["app/**/*.{ts,tsx}", "src/shell/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { paths: [ZOD_PATH], patterns: [SCHEMA_PATTERN] }],
    },
  },
  {
    files: [
      "app/**/*.{ts,tsx}",
      "src/features/**/*.{ts,tsx}",
      "src/design-system/**/*.{ts,tsx}",
      "src/shell/**/*.{ts,tsx}",
    ],
    rules: { "no-restricted-syntax": ["error", ...RAW_STYLE_LITERALS] },
  },
  prettier,
);
