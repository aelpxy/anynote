import { motion } from "motion/react";
import { Outlet, useLocation } from "react-router";

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
  const { pathname } = useLocation();

  return (
    <AppShell {...loaderData}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      >
        <Outlet />
      </motion.div>
    </AppShell>
  );
}
