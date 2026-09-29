import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  route("search", "routes/search.tsx"),
  route("signin", "routes/signin.tsx"),
  route("signup", "routes/signup.tsx"),
  route("unlock", "routes/unlock.tsx"),
  layout("routes/sidebar-layout.tsx", [
    index("routes/home.tsx"),
    route("notes", "routes/notes.tsx"),
    route("notes/bulk", "routes/notes-bulk.tsx"),
    route("notes/:noteId", "routes/note.tsx"),
    route("notes/:noteId/preview", "routes/note-preview.tsx"),
    route("collections", "routes/collections.tsx"),
    route("collections/:collectionId", "routes/collection.tsx"),
    route("trash", "routes/trash.tsx"),
  ]),
] satisfies RouteConfig;
