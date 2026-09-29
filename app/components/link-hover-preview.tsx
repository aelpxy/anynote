import { FloatingLayer } from "~/components/floating-layer";
import { LinkPreviewCard } from "~/components/link-preview-card";
import { useLinkHover } from "~/hooks/use-link-hover";

type LinkHoverPreviewProps = {
  root: HTMLElement;
  onOpen: (href: string) => void;
};

export function LinkHoverPreview({ root, onOpen }: LinkHoverPreviewProps) {
  const { link, cancelHide, scheduleHide } = useLinkHover(root);
  const href = link?.getAttribute("href");
  if (!link?.isConnected || !href) return null;

  return (
    <FloatingLayer
      key={href}
      reference={link}
      placement="top"
      role="tooltip"
      onMouseEnter={cancelHide}
      onMouseLeave={scheduleHide}
      onClick={() => onOpen(href)}
      className="z-30 w-80 cursor-pointer rounded-lg border border-neutral-200 bg-white p-3 shadow-lg shadow-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-black/40"
    >
      <LinkPreviewCard href={href} />
    </FloatingLayer>
  );
}
