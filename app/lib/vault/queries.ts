import type {
  Collection,
  CollectionOption,
  Note,
  NoteWithContent,
  Vault,
  VaultNote,
} from "~/lib/vault/types";
import { toPlainText } from "~/lib/vault/plain-text";

function toNote(note: VaultNote): Note {
  return {
    id: note.id,
    title: note.title,
    icon: note.icon,
    isFavorite: note.isFavorite,
    isTrashed: note.trashedAt !== null,
  };
}

export function getSortKey(note: VaultNote) {
  return note.position ?? Date.parse(note.createdAt);
}

function byPosition(a: VaultNote, b: VaultNote) {
  return getSortKey(a) - getSortKey(b);
}

export function getActiveNotes(vault: Vault) {
  return [...vault.notes.values()].filter((note) => note.trashedAt === null).sort(byPosition);
}

export function getNotes(vault: Vault) {
  return getActiveNotes(vault).map(toNote);
}

export function getRecentNotes(vault: Vault, limit = 6) {
  return getActiveNotes(vault)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit)
    .map((note) => ({ ...toNote(note), updatedAt: note.updatedAt }));
}

export function getFavoriteNotes(vault: Vault) {
  return getActiveNotes(vault).filter((note) => note.isFavorite).map(toNote);
}

export function getTrashedNotes(vault: Vault) {
  return [...vault.notes.values()]
    .filter((note) => note.trashedAt !== null)
    .sort((a, b) => (b.trashedAt ?? "").localeCompare(a.trashedAt ?? ""))
    .map(toNote);
}

export function getNote(vault: Vault, id: string): NoteWithContent | undefined {
  const note = vault.notes.get(id);
  return note && note.trashedAt === null
    ? {
        ...toNote(note),
        content: note.content,
        revision: note.revision,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      }
    : undefined;
}

export function getNotePreview(vault: Vault, id: string) {
  const note = getNote(vault, id);
  return note ? { title: note.title, excerpt: toPlainText(note.content).slice(0, 160) } : null;
}

function buildCollectionTree(vault: Vault, parentId: string | null): Collection[] {
  return [...vault.collections.values()]
    .filter((collection) => collection.parentId === parentId)
    .sort((a, b) => a.position - b.position)
    .map((collection) => ({
      id: collection.id,
      name: collection.name,
      parentId,
      notes: collection.noteIds
        .map((noteId) => vault.notes.get(noteId))
        .filter((note): note is VaultNote => note !== undefined && note.trashedAt === null)
        .map(toNote),
      children: buildCollectionTree(vault, collection.id),
    }));
}

export function getCollections(vault: Vault) {
  return buildCollectionTree(vault, null);
}

export function flattenCollections(tree: Collection[], parentLabel = ""): CollectionOption[] {
  return tree.flatMap((collection) => {
    const label = parentLabel ? `${parentLabel} / ${collection.name}` : collection.name;
    return [{ collection, label }, ...flattenCollections(collection.children, label)];
  });
}

export function countCollectionNotes(collection: Collection) {
  const noteIds = new Set<string>();
  const visit = ({ notes, children }: Collection) => {
    for (const note of notes) noteIds.add(note.id);
    children.forEach(visit);
  };
  visit(collection);
  return noteIds.size;
}

export function getBacklinks(vault: Vault, noteId: string) {
  const path = `/notes/${noteId}`;
  return getActiveNotes(vault)
    .filter((note) => note.id !== noteId && note.content.includes(path))
    .map(toNote);
}
