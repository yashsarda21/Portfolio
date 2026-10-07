/** How loading the head-turn strips went. */
export type RigResult = "ready" | "timeout" | "error";

async function decode(url: string): Promise<void> {
  const img = new Image();
  img.src = url;
  await img.decode();
}

/**
 * Decode every head-turn strip. Resolves "ready" when all are decoded, "error" as soon as one fails (or there
 * is no Image to decode with), and "timeout" if they are not all in by `timeoutMs`. It never rejects and never
 * hangs; the first answer wins.
 */
export function loadRig(
  urls: readonly string[],
  { timeoutMs }: { timeoutMs: number },
): Promise<RigResult> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve("timeout"), timeoutMs);
    const finish = (result: RigResult) => {
      clearTimeout(timer);
      resolve(result);
    };
    Promise.all(urls.map(decode)).then(
      () => finish("ready"),
      () => finish("error"),
    );
  });
}
