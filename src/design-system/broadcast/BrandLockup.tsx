import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { PolymorphicProps } from "../lib/polymorphic";

const MARK = { lg: "size-10", md: "size-9.5", sm: "size-9" } as const;

type Own = { mark: string; label?: ReactNode; size?: "lg" | "md" | "sm" };

/** The YS mark + wordmark/breadcrumb. As a link, pass an aria-label naming the destination. */
export function BrandLockup<T extends ElementType = "div">({
  as,
  mark,
  label,
  size = "lg",
  className,
  ...rest
}: PolymorphicProps<T, Own>) {
  const Comp: ElementType = as ?? "div";
  return (
    <Comp className={cn("inline-flex items-center gap-3.5 text-scout", className)} {...rest}>
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center border-(length:--bw-brand) border-volt type-d5 text-volt",
          MARK[size],
        )}
      >
        {mark}
      </span>
      {label ? <span className="type-mono-brand">{label}</span> : null}
    </Comp>
  );
}
