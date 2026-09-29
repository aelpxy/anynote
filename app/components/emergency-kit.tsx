import { Logo } from "~/components/logo";
import { formatSecretKey } from "~/lib/crypto/secret-key";

type EmergencyKitProps = {
  username: string;
  secretKey: string;
};

export function EmergencyKit({ username, secretKey }: EmergencyKitProps) {
  const signInUrl = typeof window === "undefined" ? "" : `${window.location.origin}/signin`;

  return (
    <section
      aria-label="Emergency Kit"
      className="rounded-xl border border-neutral-300 bg-white p-5 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 print:border-neutral-400"
    >
      <div className="flex items-center gap-2">
        <Logo className="size-6" />
        <p className="text-sm font-semibold">Anynote Emergency Kit</p>
      </div>
      <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
        You need this and your password to sign in. It can't be recovered.
      </p>

      <dl className="mt-4 flex flex-col gap-3 text-sm">
        <div>
          <dt className="text-xs text-neutral-600 dark:text-neutral-400">Sign-in address</dt>
          <dd className="font-medium break-all">{signInUrl}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-600 dark:text-neutral-400">Username</dt>
          <dd className="font-medium">{username}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-600 dark:text-neutral-400">Secret Key</dt>
          <dd className="font-mono text-[15px] font-medium tracking-wide break-all">
            {formatSecretKey(secretKey)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-600 dark:text-neutral-400">Password</dt>
          <dd className="mt-1 h-8 rounded-md border border-dashed border-neutral-400 dark:border-neutral-600" />
        </div>
      </dl>
    </section>
  );
}
