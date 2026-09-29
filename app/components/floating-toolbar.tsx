import type { Placement, ReferenceType } from "@floating-ui/react-dom";

import { FloatingLayer } from "~/components/floating-layer";

type FloatingToolbarProps = {
  reference: ReferenceType;
  label: string;
  placement?: Placement;
  children: React.ReactNode;
};

export function FloatingToolbar({
  reference,
  label,
  placement,
  children,
}: FloatingToolbarProps) {
  return (
    <FloatingLayer
      reference={reference}
      placement={placement}
      role="toolbar"
      aria-label={label}
      className="z-30 flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg shadow-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-black/40"
    >
      {children}
    </FloatingLayer>
  );
}
