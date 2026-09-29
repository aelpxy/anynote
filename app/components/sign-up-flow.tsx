import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { AuthLayout } from "~/components/auth-layout";
import { EmergencyKitStep } from "~/components/emergency-kit-step";
import { SignUpForm } from "~/components/sign-up-form";
import { rememberDevice } from "~/lib/account/device";
import { setAccount } from "~/lib/account/session-store";
import type { UnlockedAccount } from "~/lib/account/unlocked-account";

type SignedUp = {
  account: UnlockedAccount;
  secretKey: string;
};

export function SignUpFlow() {
  const navigate = useNavigate();
  const [signedUp, setSignedUp] = useState<SignedUp | null>(null);

  function handleSignedUp(result: SignedUp) {
    rememberDevice({ username: result.account.user.username, secretKey: result.secretKey });
    setSignedUp(result);
  }

  function handleContinue() {
    if (!signedUp) return;
    setAccount(signedUp.account);
    navigate("/");
  }

  if (signedUp) {
    return (
      <AuthLayout title="Save your Emergency Kit">
        <EmergencyKitStep
          username={signedUp.account.user.username}
          secretKey={signedUp.secretKey}
          onContinue={handleContinue}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create account" description="End-to-end encrypted.">
      <SignUpForm onSignedUp={handleSignedUp} />
      <p className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
        Already have an account?{" "}
        <Link to="/signin" className="font-medium text-neutral-900 underline underline-offset-2 dark:text-neutral-100">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
