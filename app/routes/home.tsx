import type { Route } from "./+types/home";
import { ErrorPage } from "~/components/error-page";
import { HomeGetStarted } from "~/components/home-get-started";
import { HomeRecentNotes } from "~/components/home-recent-notes";
import { PageHeader } from "~/components/page-header";
import { getRecentNotes } from "~/lib/vault/queries";
import { requireVault } from "~/lib/vault/require-vault";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Anynote" }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  return { recentNotes: getRecentNotes(await requireVault(request)) };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { recentNotes } = loaderData;

  return (
    <>
      <PageHeader />
      <div className="mx-auto max-w-3xl px-5 pt-2 pb-8 sm:px-12">
        {recentNotes.length === 0 ? (
          <HomeGetStarted />
        ) : (
          <HomeRecentNotes notes={recentNotes} />
        )}
      </div>
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorPage error={error} />;
}
