import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { zoomImageEvent, type ZoomImageDetail } from "~/lib/encrypted-image-view";

export function ImageLightbox() {
  const [image, setImage] = useState<ZoomImageDetail | null>(null);

  useEffect(() => {
    function handleZoom(event: Event) {
      setImage((event as CustomEvent<ZoomImageDetail>).detail);
    }
    window.addEventListener(zoomImageEvent, handleZoom);
    return () => window.removeEventListener(zoomImageEvent, handleZoom);
  }, []);

  return (
    <Dialog.Root open={image !== null} onOpenChange={(open) => !open && setImage(null)}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/80 transition-opacity duration-200 ease-out motion-reduce:transition-none data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 p-6 outline-none transition-[opacity,scale] duration-200 ease-out motion-reduce:transition-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
          <Dialog.Title className="sr-only">{image?.alt || "Image"}</Dialog.Title>
          <Dialog.Close
            aria-label="Close"
            className="absolute top-4 right-4 rounded-md p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-white"
          >
            <X className="size-5" />
          </Dialog.Close>
          {image && (
            <>
              <Dialog.Close
                render={
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="max-h-[85dvh] max-w-full cursor-zoom-out rounded-lg object-contain shadow-2xl"
                  />
                }
              />
              {image.caption && (
                <p className="max-w-2xl text-center text-sm text-white/80">{image.caption}</p>
              )}
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
