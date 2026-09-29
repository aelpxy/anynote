import { Logo } from "~/components/logo";

type AuthLayoutProps = {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
};

export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center print:hidden">
          <Logo className="size-10" />
          <h1 className="mt-4 text-xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {description}
            </p>
          )}
        </div>
        {children}
      </div>
    </main>
  );
}
