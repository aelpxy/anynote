import { Link, redirect } from "react-router";

import type { Route } from "./+types/unlock";
import { AuthLayout } from "~/components/auth-layout";
import { UnlockForm } from "~/components/unlock-form";
import { getRememberedDevice } from "~/lib/account/device";
import { getSafeRedirect } from "~/lib/account/session";
import { getAccount, restoreAccount } from "~/lib/account/session-store";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Unlock · Anynote" }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const url = new URL(request.url);
  const redirectTo = getSafeRedirect(url.searchParams.get("next"));
  await restoreAccount();
  if (getAccount()) throw redirect(redirectTo);

  const device = getRememberedDevice();
  if (!device) throw redirect(`/signin${url.search}`);
  return { device, redirectTo };
}

export default function UnlockRoute({ loaderData }: Route.ComponentProps) {
  const { device, redirectTo } = loaderData;

  return (
    <AuthLayout title={`Welcome back, ${device.username}`}>
      <UnlockForm device={device} redirectTo={redirectTo} />
      <p className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
        Not you?{" "}
        <Link to="/signin" className="font-medium text-neutral-900 underline underline-offset-2 dark:text-neutral-100">
          Sign in with another account
        </Link>
      </p>
    </AuthLayout>
  );
}
