export function toPlainText(markdown: string) {
  return markdown
    .replace(/^```.*$/gm, " ")
    .replace(/^\|?[\s:|-]*-{3,}[\s:|-]*$/gm, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s*(#{1,6}|>|[-*+]|\d+\.)\s+(\[[ x]\]\s*)?/gm, "")
    // underscores inside words are identifiers like pg_size_pretty, not emphasis
    .replace(/(^|\W)_+|_+(?=\W|$)/g, "$1")
    .replace(/[*~`]/g, "")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
