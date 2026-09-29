import { redirect } from "react-router";

import type { Route } from "./+types/signup";
import { SignUpFlow } from "~/components/sign-up-flow";
import { getAccount, restoreAccount } from "~/lib/account/session-store";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Create account · Anynote" }];
}

export async function clientLoader() {
  await restoreAccount();
  if (getAccount()) throw redirect("/");
  return null;
}

export default function SignUpRoute() {
  return <SignUpFlow />;
}
