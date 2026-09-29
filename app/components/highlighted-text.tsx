type HighlightedTextProps = {
  text: string;
  terms: string[];
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function HighlightedText({ text, terms }: HighlightedTextProps) {
  if (terms.length === 0) return text;

  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
  const lowerTerms = terms.map((term) => term.toLowerCase());

  return text.split(pattern).map((part, index) =>
    lowerTerms.includes(part.toLowerCase()) ? (
      <mark
        key={index}
        className="rounded-sm bg-neutral-200 text-neutral-900 dark:bg-neutral-600 dark:text-neutral-100"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}
