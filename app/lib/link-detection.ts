export type DetectedLink = {
  href: string;
  start: number;
  end: number;
};

const urlPattern = /^https?:\/\/[^\s<>]+$/i;
const wwwPattern = /^www\.[^\s<>]+\.[^\s<>]+$/i;
const emailPattern = /^[^\s@<>()]+@[^\s@<>()]+\.[a-z]{2,}$/i;
const leadingPunctuation = /^[(<"'[]+/;
const trailingPunctuation = /[.,;:!?)"'\]>]+$/;
const markdownLinkPattern = /(?<!!)\[([^\]\n]+)\]\(([^()\s]+)$/;

export function toHref(text: string) {
  if (urlPattern.test(text)) {
    const url = new URL(text);
    // same-origin links become relative so they open (and preview) in the app
    return typeof window !== "undefined" && url.origin === window.location.origin
      ? `${url.pathname}${url.search}${url.hash}`
      : url.href;
  }
  if (wwwPattern.test(text)) return `https://${text}`;
  if (emailPattern.test(text)) return `mailto:${text}`;
}

export function isLinkLike(text: string) {
  try {
    return toHref(text.trim()) !== undefined;
  } catch {
    return false;
  }
}

export function detectTrailingLink(textBefore: string): DetectedLink | undefined {
  const wordStart = Math.max(
    textBefore.lastIndexOf(" "),
    textBefore.lastIndexOf(" "),
  ) + 1;
  const word = textBefore.slice(wordStart);
  const leading = leadingPunctuation.exec(word)?.[0].length ?? 0;
  const trailing = trailingPunctuation.exec(word.slice(leading))?.[0].length ?? 0;
  const candidate = word.slice(leading, word.length - trailing);

  try {
    const href = candidate ? toHref(candidate) : undefined;
    if (!href) return;

    const start = wordStart + leading;
    return { href, start, end: start + candidate.length };
  } catch {
    return;
  }
}

export function detectMarkdownLink(textBefore: string) {
  const match = markdownLinkPattern.exec(textBefore);
  if (!match) return;

  return { label: match[1], href: match[2], start: match.index };
}
