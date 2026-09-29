type PageHeaderProps = {
  actions?: React.ReactNode;
};

export function PageHeader({ actions }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-5 flex h-14 items-center justify-end gap-1 bg-white px-4 print:hidden dark:bg-neutral-950">
      {actions}
    </header>
  );
}
