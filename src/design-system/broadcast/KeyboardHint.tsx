import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";

export function KeyboardHint({ className, ...rest }: ComponentPropsWithRef<"p">) {
  return <p className={cn("type-mono-md text-dim", className)} {...rest} />;
}
