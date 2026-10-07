import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Glass } from "../primitives/Glass";
import { Text } from "../primitives/Text";

type DashedPanelProps = {
  /** The panel's name ("AFTER YOU SEND"); also its accessible name. */
  label: string;
  children: ReactNode;
} & Omit<ComponentPropsWithRef<"div">, "children">;

/** A dashed outline box with a mono label on top: a preview or an aside, not a card. */
export function DashedPanel({ label, children, className, ...rest }: DashedPanelProps) {
  const id = useId();
  return (
    <Glass
      surface="dashed"
      pad="md"
      role="group"
      aria-labelledby={id}
      className={cn("flex flex-col gap-2.5", className)}
      {...rest}
    >
      <Text id={id} variant="mono-label" tone="label" leading="font">
        {label}
      </Text>
      {children}
    </Glass>
  );
}
