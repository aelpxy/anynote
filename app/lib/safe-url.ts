import { toHref } from "~/lib/link-detection";

const allowedProtocols = new Set(["http:", "https:", "mailto:"]);
const bareDomainPattern = /^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#]\S*)?$/i;

// the only gate for hrefs: anything that isn't web, email or an in-app path is dropped
export function toSafeHref(href: string) {
  const value = href.trim();
  if (value.startsWith("#")) return value;
  if (value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")) return value;

  try {
    // parse like the browser would, so tricks like "java\tscript:" or mixed case can't slip through
    const url = new URL(value);
    return allowedProtocols.has(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function isSafeHref(href: string) {
  return toSafeHref(href) !== null;
}

// what a person types into the link box: full urls, in-app paths, emails, or just "example.com"
export function normalizeLinkInput(input: string) {
  const value = input.trim();
  const detected = (() => {
    try {
      return toHref(value);
    } catch {
      return undefined;
    }
  })();

  return (
    toSafeHref(detected ?? value) ??
    (bareDomainPattern.test(value) ? toSafeHref(`https://${value}`) : null)
  );
}
