export type Note = {
  id: string;
  title: string;
  icon?: string;
  isFavorite: boolean;
  isTrashed: boolean;
};

export type NoteWithContent = Note & {
  content: string;
  // bumps when another tab or device changes the note, so an open editor reloads
  revision: number;
};

export type Collection = {
  id: string;
  name: string;
  parentId: string | null;
  notes: Note[];
  children: Collection[];
};

export type CollectionOption = {
  collection: Collection;
  label: string;
};

export type NoteSearchResult = {
  id: string;
  title: string;
  snippet: string;
};

export type NoteContent = {
  title: string;
  content: string;
  isFavorite: boolean;
  // sort key for the document list; notes without one sort by creation time
  position?: number;
  icon?: string;
};

export type VaultNote = NoteContent & {
  id: string;
  version: number;
  trashedAt: string | null;
  createdAt: string;
  updatedAt: string;
  revision: number;
};

export type VaultCollection = {
  id: string;
  parentId: string | null;
  name: string;
  position: number;
  noteIds: string[];
};

export type Vault = {
  token: string;
  cursor: number;
  workspaceId: string;
  workspaceKey: Uint8Array;
  notes: Map<string, VaultNote>;
  collections: Map<string, VaultCollection>;
};

export type Placement = {
  anchorId: string;
  side: "before" | "after";
};
