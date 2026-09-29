import { toPlainText } from "~/lib/vault/plain-text";
import { getActiveNotes } from "~/lib/vault/queries";
import type { NoteSearchResult, SearchFilters, Vault, VaultNote } from "~/lib/vault/types";

const dayMs = 24 * 60 * 60 * 1000;
const editedWindowMs = { week: 7 * dayMs, month: 30 * dayMs };

export const noSearchFilters: SearchFilters = {
  collectionId: null,
  favoritesOnly: false,
  edited: "any",
};

export function readSearchFilters(params: URLSearchParams): SearchFilters {
  const edited = params.get("edited");
  return {
    collectionId: params.get("collection") || null,
    favoritesOnly: params.get("favorites") === "1",
    edited: edited === "week" || edited === "month" ? edited : "any",
  };
}

function getSnippet(text: string, index: number) {
  const start = Math.max(0, index - 40);
  const snippet = text.slice(start, start + 140);
  return `${start > 0 ? "…" : ""}${snippet}${start + 140 < text.length ? "…" : ""}`;
}

function getCollectionNoteIds(vault: Vault, collectionId: string) {
  const noteIds = new Set<string>();
  const visit = (id: string) => {
    const collection = vault.collections.get(id);
    if (!collection) return;
    collection.noteIds.forEach((noteId) => noteIds.add(noteId));
    for (const child of vault.collections.values()) {
      if (child.parentId === id) visit(child.id);
    }
  };
  visit(collectionId);
  return noteIds;
}

function createFilter(vault: Vault, filters: SearchFilters) {
  const collectionNoteIds = filters.collectionId
    ? getCollectionNoteIds(vault, filters.collectionId)
    : null;
  const editedSince =
    filters.edited === "any" ? null : Date.now() - editedWindowMs[filters.edited];

  return (note: VaultNote) =>
    (!collectionNoteIds || collectionNoteIds.has(note.id)) &&
    (!filters.favoritesOnly || note.isFavorite) &&
    (editedSince === null || Date.parse(note.updatedAt) >= editedSince);
}

function toResult(note: VaultNote, text: string, index: number): NoteSearchResult {
  return {
    id: note.id,
    title: note.title,
    icon: note.icon,
    snippet: getSnippet(text, index),
    updatedAt: note.updatedAt,
  };
}

export function searchNotes(
  vault: Vault,
  query: string,
  { limit = 20, filters = noSearchFilters }: { limit?: number; filters?: SearchFilters } = {},
): NoteSearchResult[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const notes = getActiveNotes(vault).filter(createFilter(vault, filters));

  if (terms.length === 0) {
    return notes
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, limit)
      .map((note) => toResult(note, toPlainText(note.content), 0));
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
        result: toResult(note, text, contentIndex ?? 0),
      };
    })
    .filter((match) => match !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((match) => match.result);
}
