import { LinkPreviewContent } from "~/components/link-preview-content";
import { LinkPreviewSkeleton } from "~/components/link-preview-skeleton";
import { useLinkPreview } from "~/hooks/use-link-preview";

type LinkPreviewCardProps = {
  href: string;
};

export function LinkPreviewCard({ href }: LinkPreviewCardProps) {
  const preview = useLinkPreview(href);

  return preview ? (
    <LinkPreviewContent preview={preview} />
  ) : (
    <LinkPreviewSkeleton />
  );
}
