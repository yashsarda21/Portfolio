import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Glass } from "./Glass";
import { IconButton } from "./IconButton";

// The dialog is the panel's box and nothing more, so a click that lands on the dialog itself is a click on its
// backdrop. Class strings stay literal so Tailwind sees them.
const SIDES = {
  left: {
    dialog: "mr-auto -translate-x-full open:translate-x-0 starting:open:-translate-x-full",
    panel: "border-l-0",
  },
  right: {
    dialog: "ml-auto translate-x-full open:translate-x-0 starting:open:translate-x-full",
    panel: "border-r-0",
  },
} as const;

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  /** The dialog's accessible name. */
  label: string;
  /** The close button's accessible name. */
  closeLabel: string;
  side?: "left" | "right";
  /** The dialog's id, for the control that opens it (`aria-controls`). */
  id?: string;
  children: ReactNode;
  className?: string;
}

/**
 * A panel that slides in from the edge over a dimmed page, and back out when it closes: a native modal `<dialog>`, so focus is held inside it
 * and the page behind is inert. Esc, the close button or a tap outside calls `onClose`; focus then returns to what
 * had it before the drawer opened. The slide is a CSS transition on the dialog (allow-discrete, so `display` and the top layer wait for it); the `open` attribute still flips at once. Reduced motion has no slide (base.css zeroes transitions).
 */
export function Drawer({
  open,
  onClose,
  label,
  closeLabel,
  side = "left",
  id,
  children,
  className,
}: DrawerProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) {
      returnTo.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      el.showModal();
    } else if (!open && el.open) {
      el.close();
      returnTo.current?.focus();
      returnTo.current = null;
    }
  }, [open]);

  return (
    // A click on the backdrop is a pointer shortcut; the keyboard has Esc (onCancel) and the close button.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialog}
      id={id}
      data-drawer=""
      aria-label={label}
      onCancel={(event) => {
        // Esc: let the parent's state close it, so the two never disagree.
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        "m-0 h-dvh max-h-none w-80 max-w-[85vw] bg-transparent p-0 text-floodlight transition-[transform,overlay,display] transition-discrete duration-(--dur-glide) ease-follow backdrop:bg-ground/0 backdrop:transition-[background-color,overlay,display] backdrop:transition-discrete backdrop:duration-(--dur-glide) open:backdrop:bg-ground/70 starting:open:backdrop:bg-ground/0",
        SIDES[side].dialog,
      )}
    >
      <Glass
        surface="solid"
        className={cn(
          "flex h-full flex-col overflow-y-auto border-y-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
          SIDES[side].panel,
          className,
        )}
      >
        <div className="flex justify-end p-2">
          <IconButton icon="close" label={closeLabel} variant="outline" onClick={onClose} />
        </div>
        <div className="flex grow flex-col px-4.5 pb-5">{children}</div>
      </Glass>
    </dialog>
  );
}
