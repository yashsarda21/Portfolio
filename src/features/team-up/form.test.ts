import { describe, expect, it, vi } from "vitest";
import { ui } from "@/content";
import { buildMailto, messageText, submitChallenge, validate, type ChallengeValues } from "./form";

const errors = ui.pages.teamUp.errors;
const valid: ChallengeValues = {
  format: "sign",
  name: "Sam Visitor",
  email: "sam@example.com",
  message: "We are hiring a full-stack engineer.",
  website: "",
};
const with_ = (patch: Partial<ChallengeValues>): ChallengeValues => ({ ...valid, ...patch });

describe("validate", () => {
  it("returns no errors for a complete challenge", () => {
    expect(validate(valid, errors)).toEqual({});
  });

  it("flags an empty name, email and message, each with its own line", () => {
    expect(validate(with_({ name: "", email: "", message: "" }), errors)).toEqual({
      name: errors.name,
      email: errors.email,
      message: errors.message,
    });
  });

  it("trims: a whitespace-only name or message is empty", () => {
    const result = validate(with_({ name: "   ", message: " \n\t " }), errors);
    expect(result.name).toBe(errors.name);
    expect(result.message).toBe(errors.message);
    expect(result.email).toBeUndefined();
  });

  it("wants at least 10 characters of message, counted after trimming", () => {
    expect(validate(with_({ message: "123456789" }), errors).message).toBe(errors.message);
    expect(validate(with_({ message: "  123456789  " }), errors).message).toBe(errors.message);
    expect(validate(with_({ message: "1234567890" }), errors).message).toBeUndefined();
  });

  it.each([
    "a@b",
    "a@b.",
    "a@.co",
    "@b.co",
    "a b@c.co",
    "a@b c.co",
    "a@@b.co",
    "a@b@c.co",
    "ab.co",
  ])("rejects the email %j", (email) => {
    expect(validate(with_({ email }), errors).email).toBe(errors.email);
  });

  it.each(["a@b.co", "  a@b.co  ", "first.last+tag@mail.example.com"])(
    "accepts the email %j",
    (email) => {
      expect(validate(with_({ email }), errors).email).toBeUndefined();
    },
  );
});

describe("buildMailto", () => {
  const to = "yashsarda2002@gmail.com";

  it("is a mailto link to the address with a subject of the format title and the name", () => {
    const url = buildMailto(valid, to, "SIGN A PLAYER");
    expect(url.startsWith(`mailto:${to}?subject=`)).toBe(true);
    const params = new URL(url).searchParams;
    expect(params.get("subject")).toBe("SIGN A PLAYER — Sam Visitor");
    expect(params.get("body")).toContain(valid.message);
    expect(params.get("body")).toContain(valid.email);
  });

  it("encodes & ? and newlines so no part can break the link", () => {
    const url = buildMailto(
      with_({ name: "A&B?C=D", message: "line one\nline two & more?" }),
      to,
      "DOUBLES",
    );
    // Only the two separators are bare: one ? and one & between the subject and the body.
    expect(url.split("?")).toHaveLength(2);
    expect(url.split("&")).toHaveLength(2);
    expect(url).not.toMatch(/\n/);
    const params = new URL(url).searchParams;
    expect(params.get("subject")).toBe("DOUBLES — A&B?C=D");
    expect(params.get("body")).toContain("line one\nline two & more?");
  });

  it("trims the name and message it sends", () => {
    const params = new URL(
      buildMailto(with_({ name: "  Sam  ", message: "  hello there, friend  " }), to, "DOUBLES"),
    ).searchParams;
    expect(params.get("subject")).toBe("DOUBLES — Sam");
    expect(params.get("body")?.startsWith("hello there, friend")).toBe(true);
  });
});

describe("messageText", () => {
  it("is the email's subject, then its body, as one block the visitor can paste", () => {
    expect(messageText(valid, "SIGN A PLAYER")).toBe(
      "SIGN A PLAYER — Sam Visitor\n\nWe are hiring a full-stack engineer.\n\nSam Visitor\nsam@example.com",
    );
  });
});

describe("submitChallenge", () => {
  const ok = () => Promise.resolve(new Response("{}", { status: 200 }));
  const deps = (over: Partial<Parameters<typeof submitChallenge>[1]> = {}) => ({
    endpoint: null as string | null,
    fetch: vi.fn(ok) as unknown as typeof fetch,
    openUrl: vi.fn(),
    to: "yashsarda2002@gmail.com",
    formatTitle: "SIGN A PLAYER",
    ...over,
  });

  it("drops a challenge whose honeypot is filled: pretends it worked, sends nothing", async () => {
    const d = deps({ endpoint: "https://forms.example/f/abc" });
    await expect(submitChallenge(with_({ website: "http://spam.example" }), d)).resolves.toBe(
      "dropped",
    );
    expect(d.fetch).not.toHaveBeenCalled();
    expect(d.openUrl).not.toHaveBeenCalled();
  });

  it("posts JSON to the endpoint (never the honeypot) and says sent on 2xx", async () => {
    const d = deps({ endpoint: "https://forms.example/f/abc" });
    await expect(submitChallenge(valid, d)).resolves.toBe("sent");
    const [url, init] = (d.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]! as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://forms.example/f/abc");
    expect(init.method).toBe("POST");
    const headers = new Headers(init.headers);
    expect(headers.get("Accept")).toBe("application/json");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(JSON.parse(init.body as string)).toEqual({
      format: "sign",
      name: "Sam Visitor",
      email: "sam@example.com",
      message: "We are hiring a full-stack engineer.",
    });
    expect(d.openUrl).not.toHaveBeenCalled();
  });

  it("says error on a non-2xx answer", async () => {
    const d = deps({
      endpoint: "https://forms.example/f/abc",
      fetch: vi.fn(() => Promise.resolve(new Response("no", { status: 500 }))) as never,
    });
    await expect(submitChallenge(valid, d)).resolves.toBe("error");
  });

  it("says error when the network throws", async () => {
    const d = deps({
      endpoint: "https://forms.example/f/abc",
      fetch: vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))) as never,
    });
    await expect(submitChallenge(valid, d)).resolves.toBe("error");
  });

  it("with no endpoint opens the email link and says mailto", async () => {
    const d = deps();
    await expect(submitChallenge(valid, d)).resolves.toBe("mailto");
    expect(d.fetch).not.toHaveBeenCalled();
    expect(d.openUrl).toHaveBeenCalledTimes(1);
    expect(d.openUrl).toHaveBeenCalledWith(
      buildMailto(valid, "yashsarda2002@gmail.com", "SIGN A PLAYER"),
    );
  });

  it("says error rather than throwing when opening the email app throws", async () => {
    const d = deps({
      openUrl: vi.fn(() => {
        throw new Error("blocked");
      }),
    });
    await expect(submitChallenge(valid, d)).resolves.toBe("error");
  });
});
