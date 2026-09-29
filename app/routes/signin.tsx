import { Link, redirect } from "react-router";

import type { Route } from "./+types/signin";
import { AuthLayout } from "~/components/auth-layout";
import { SignInForm } from "~/components/sign-in-form";
import { getRememberedDevice } from "~/lib/account/device";
import { getSafeRedirect } from "~/lib/account/session";
import { getAccount, restoreAccount } from "~/lib/account/session-store";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Sign in · Anynote" }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const redirectTo = getSafeRedirect(new URL(request.url).searchParams.get("next"));
  await restoreAccount();
  if (getAccount()) throw redirect(redirectTo);
  return { device: getRememberedDevice(), redirectTo };
}

export default function SignInRoute({ loaderData }: Route.ComponentProps) {
  return (
    <AuthLayout title="Sign in to Anynote">
      <SignInForm device={loaderData.device} redirectTo={loaderData.redirectTo} />
      <p className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
        New here?{" "}
        <Link to="/signup" className="font-medium text-neutral-900 underline underline-offset-2 dark:text-neutral-100">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
