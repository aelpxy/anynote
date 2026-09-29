import { Check, Copy, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { formatSecretKey } from "~/lib/crypto/secret-key";

type SecretKeyRevealProps = {
  secretKey: string;
};

export function SecretKeyReveal({ secretKey }: SecretKeyRevealProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const formatted = formatSecretKey(secretKey);

  async function copy() {
    await navigator.clipboard.writeText(formatted);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700">
      <code className="flex-1 truncate font-mono text-sm tracking-wide">
        {isRevealed ? formatted : formatted.replace(/[^-]/g, "•").replace(/^••/, "A1")}
      </code>
      <button
        type="button"
        onClick={() => setIsRevealed((revealed) => !revealed)}
        aria-label={isRevealed ? "Hide Secret Key" : "Reveal Secret Key"}
        className="rounded-md p-1 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        {isRevealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy Secret Key"
        className="rounded-md p-1 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        {isCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}
