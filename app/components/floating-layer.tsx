import {
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
  type Placement,
  type ReferenceType,
} from "@floating-ui/react-dom";
import { motion } from "motion/react";
import { createPortal } from "react-dom";

type FloatingLayerProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "style" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"
> & {
  reference: ReferenceType;
  placement?: Placement;
};

export function FloatingLayer({
  reference,
  placement = "top",
  children,
  ...props
}: FloatingLayerProps) {
  const { refs, floatingStyles } = useFloating({
    strategy: "fixed",
    placement,
    transform: false,
    elements: { reference },
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip(), shift({ padding: 8 })],
  });

  return createPortal(
    <motion.div
      {...props}
      ref={refs.setFloating}
      style={floatingStyles}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
    >
      {children}
    </motion.div>,
    document.body,
  );
}
