export const dialogBackdropClass =
  "fixed inset-0 z-50 bg-black/20 transition-opacity duration-200 ease-out motion-reduce:transition-none data-ending-style:opacity-0 data-starting-style:opacity-0 dark:bg-black/60";

const dialogPopupBase = [
  "fixed z-50 flex max-h-[85dvh] flex-col border border-neutral-200 bg-white text-neutral-900 shadow-xl shadow-neutral-900/10 outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:shadow-black/50",
  "transition-[opacity,translate,scale] duration-200 ease-out motion-reduce:transition-none data-ending-style:opacity-0 data-starting-style:opacity-0",
  "inset-x-0 bottom-0 rounded-t-2xl pb-[env(safe-area-inset-bottom)] data-ending-style:translate-y-full data-starting-style:translate-y-full",
  "sm:inset-x-auto sm:top-[12vh] sm:bottom-auto sm:left-1/2 sm:w-[calc(100%-2rem)] sm:-translate-x-1/2 sm:rounded-xl sm:pb-0 sm:data-ending-style:translate-y-0 sm:data-ending-style:scale-95 sm:data-starting-style:translate-y-0 sm:data-starting-style:scale-95",
].join(" ");

export type DialogSize = "sm" | "md" | "lg";

const dialogWidths: Record<DialogSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
};

export function dialogPopupClass(size: DialogSize) {
  return `${dialogPopupBase} ${dialogWidths[size]}`;
}

export const dialogTitleClass = "text-base font-semibold tracking-tight";

export const dialogDescriptionClass = "mt-1 text-sm text-neutral-600 dark:text-neutral-400";
