import { toPlainText } from "~/lib/vault/plain-text";
import { getActiveNotes } from "~/lib/vault/queries";
import type { NoteSearchResult, Vault } from "~/lib/vault/types";

function getSnippet(text: string, index: number) {
  const start = Math.max(0, index - 40);
  const snippet = text.slice(start, start + 140);
  return `${start > 0 ? "…" : ""}${snippet}${start + 140 < text.length ? "…" : ""}`;
}

export function searchNotes(vault: Vault, query: string, limit = 20): NoteSearchResult[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const notes = getActiveNotes(vault);

  if (terms.length === 0) {
    return notes.slice(0, 8).map((note) => ({
      id: note.id,
      title: note.title,
      snippet: getSnippet(toPlainText(note.content), 0),
    }));
  }

  return notes
    .map((note) => {
      const text = toPlainText(note.content);
      const title = note.title.toLowerCase();
      const content = text.toLowerCase();
      const matchesAll = terms.every((term) => title.includes(term) || content.includes(term));
      if (!matchesAll) return null;

      const titleMatches = terms.filter((term) => title.includes(term)).length;
      const contentIndex = terms
        .map((term) => content.indexOf(term))
        .filter((index) => index >= 0)
        .sort((a, b) => a - b)[0];

      return {
        score: titleMatches * 10 + (title.startsWith(terms[0]) ? 5 : 0),
        result: { id: note.id, title: note.title, snippet: getSnippet(text, contentIndex ?? 0) },
      };
    })
    .filter((match) => match !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((match) => match.result);
}
