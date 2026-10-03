import type { ComponentPropsWithRef, ElementType } from "react";

/**
 * Props for a component that can render as any element via `as`.
 * Own props win over the element's native props of the same name.
 */
export type PolymorphicProps<T extends ElementType, Own = object> = Own & {
  as?: T;
} & Omit<ComponentPropsWithRef<T>, keyof Own | "as">;
