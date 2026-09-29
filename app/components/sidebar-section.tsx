import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronRight } from "lucide-react";

type SidebarSectionProps = {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export function SidebarSection({
  title,
  action,
  children,
}: SidebarSectionProps) {
  return (
    <Collapsible.Root defaultOpen>
      <div className="group/section flex items-center">
        <Collapsible.Trigger className="group flex flex-1 items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">
          {title}
          <ChevronRight className="size-3 opacity-0 transition-[rotate,opacity] duration-150 ease-out group-hover:opacity-100 group-data-panel-open:rotate-90 motion-reduce:transition-none" />
        </Collapsible.Trigger>
        {action}
      </div>
      <Collapsible.Panel className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-150 ease-out motion-reduce:transition-none data-ending-style:h-0 data-starting-style:h-0">
        <div className="flex flex-col gap-0.5">{children}</div>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
