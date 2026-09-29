import { Outlet } from "react-router";

import type { Route } from "./+types/sidebar-layout";
import { AppShell } from "~/components/app-shell";
import { getCollections, getFavoriteNotes, getNotes } from "~/lib/vault/queries";
import { requireVault } from "~/lib/vault/require-vault";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const vault = await requireVault(request);
  return {
    favorites: getFavoriteNotes(vault),
    documents: getNotes(vault),
    collections: getCollections(vault),
  };
}

export default function SidebarLayout({ loaderData }: Route.ComponentProps) {
  return (
    <AppShell {...loaderData}>
      <Outlet />
    </AppShell>
  );
}
