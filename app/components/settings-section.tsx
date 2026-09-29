type SettingsSectionProps = {
  id?: string;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
};

export function SettingsSection({ id, title, description, children }: SettingsSectionProps) {
  return (
    <section id={id} className="flex flex-col border-t border-neutral-200 py-4 first:border-t-0 first:pt-0 last:pb-0 dark:border-neutral-800">
      <h2 className="text-sm font-semibold">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
      )}
      <div className="mt-3 flex flex-col">{children}</div>
    </section>
  );
}
