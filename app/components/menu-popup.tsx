import { Menu } from "@base-ui/react/menu";

type MenuPopupProps = {
  children: React.ReactNode;
};

export function MenuPopup({ children }: MenuPopupProps) {
  return (
    <Menu.Popup className="min-w-48 origin-(--transform-origin) rounded-lg border border-neutral-200 bg-white p-1 shadow-lg shadow-neutral-900/10 transition-[opacity,scale] duration-150 ease-out outline-none motion-reduce:transition-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-black/40">
      {children}
    </Menu.Popup>
  );
}
