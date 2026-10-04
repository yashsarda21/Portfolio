import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

// jsdom can't navigate and logs "Not implemented" when a click lands on a real link. Bubbling reaches window after React's handlers, so only leftover clicks are stopped.
window.addEventListener("click", (e) => {
  const link = e.target instanceof Element ? e.target.closest("a[href]") : null;
  if (link && !e.defaultPrevented && !link.getAttribute("href")?.startsWith("#"))
    e.preventDefault();
});
