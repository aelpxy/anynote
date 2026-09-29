import { Check, Copy, Printer } from "lucide-react";
import { useState } from "react";

import { EmergencyKit } from "~/components/emergency-kit";
import { PrimaryButton } from "~/components/primary-button";
import { formatSecretKey } from "~/lib/crypto/secret-key";
import { printDocument } from "~/lib/print";

type EmergencyKitStepProps = {
  username: string;
  secretKey: string;
  onContinue: () => void;
};

export function EmergencyKitStep({ username, secretKey, onContinue }: EmergencyKitStepProps) {
  const [hasSaved, setHasSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  async function copySecretKey() {
    await navigator.clipboard.writeText(formatSecretKey(secretKey));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-4">
      <EmergencyKit username={username} secretKey={secretKey} />

      <div className="flex gap-2 print:hidden">
        <button
          type="button"
          onClick={() => printDocument(`Anynote Emergency Kit - ${username}`)}
          className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-neutral-300 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          <Printer className="size-4" />
          Save as PDF
        </button>
        <button
          type="button"
          onClick={copySecretKey}
          className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-neutral-300 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          {isCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {isCopied ? "Copied" : "Copy Secret Key"}
        </button>
      </div>

      <label className="flex items-start gap-2 text-sm text-neutral-800 print:hidden dark:text-neutral-200">
        <input
          type="checkbox"
          checked={hasSaved}
          onChange={(event) => setHasSaved(event.target.checked)}
          className="mt-0.5 size-4 accent-neutral-900 dark:accent-neutral-100"
        />
        I've saved my Emergency Kit
      </label>

      <div className="print:hidden">
        <PrimaryButton type="button" disabled={!hasSaved} onClick={onContinue}>
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
}
