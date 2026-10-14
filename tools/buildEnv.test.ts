import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
// @ts-expect-error a plain ESM tool: it ships no types
import { buildEnv } from "./buildEnv.mjs";
// @ts-expect-error a plain ESM tool: it ships no types
import { buildCsp, formOriginOf } from "./csp.mjs";

const env = buildEnv as (
  root: string,
  processEnv?: Record<string, string>,
) => Record<string, string>;
const origin = formOriginOf as (raw: string | undefined) => string | null;
const csp = buildCsp as (input: { scriptHashes: string[]; formOrigin: string | null }) => string;

let root = "";
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "arena-env-"));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("buildEnv", () => {
  it("reads VITE_FORM_ENDPOINT from a .env file, so its origin reaches the policy", () => {
    writeFileSync(join(root, ".env"), "VITE_FORM_ENDPOINT=https://formspree.io/f/abc123\n");
    const formOrigin = origin(env(root, {}).VITE_FORM_ENDPOINT);
    expect(formOrigin).toBe("https://formspree.io");
    const policy = csp({ scriptHashes: [], formOrigin });
    expect(policy).toContain("connect-src 'self' https://formspree.io;");
    expect(policy).toContain("form-action 'self' mailto: https://formspree.io;");
  });

  it("reads .env.production, which wins over .env", () => {
    writeFileSync(join(root, ".env"), "VITE_FORM_ENDPOINT=https://one.example/f\n");
    writeFileSync(join(root, ".env.production"), "VITE_FORM_ENDPOINT=https://two.example/f\n");
    expect(env(root, {}).VITE_FORM_ENDPOINT).toBe("https://two.example/f");
  });

  it("lets the process environment win over a file", () => {
    writeFileSync(join(root, ".env"), "VITE_FORM_ENDPOINT=https://file.example/f\n");
    expect(env(root, { VITE_FORM_ENDPOINT: "https://shell.example/f" }).VITE_FORM_ENDPOINT).toBe(
      "https://shell.example/f",
    );
  });

  it("has no form origin when nothing sets it", () => {
    expect(origin(env(root, {}).VITE_FORM_ENDPOINT)).toBeNull();
  });
});
