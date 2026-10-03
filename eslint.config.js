import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-config-prettier";
import globals from "globals";

const restrictImports = (groups, message) => ({
  "no-restricted-imports": ["error", { patterns: [{ group: groups, message }] }],
});

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
    selector: "Literal[value=/cubic-bezier\\(/]",
    message: "Use motion tokens (ease-follow / ease-snap / ease-swing) (spec §4.2).",
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
    files: ["src/design-system/**/*.{ts,tsx}"],
    rules: restrictImports(
      ["@/content", "@/content/*", "@/features/*", "@/shell", "@/shell/*", "~/*"],
      "design-system must not depend on app code (spec §4.2).",
    ),
  },
  {
    files: ["src/content/**/*.{ts,tsx}", "src/lib/**/*.{ts,tsx}"],
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
    files: ["app/**/*.{ts,tsx}", "src/features/**/*.{ts,tsx}"],
    rules: { "no-restricted-syntax": ["error", ...RAW_STYLE_LITERALS] },
  },
  prettier,
);
