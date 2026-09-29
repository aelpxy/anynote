export const contexts = {
  privateKey: (username: string) => `anynote/v1/private-key:${username}`,
  workspaceName: (workspaceId: string) => `anynote/v1/workspace-name:${workspaceId}`,
  note: (workspaceId: string, noteId: string) => `anynote/v1/note:${workspaceId}:${noteId}`,
  collection: (workspaceId: string, collectionId: string) =>
    `anynote/v1/collection:${workspaceId}:${collectionId}`,
  attachment: (workspaceId: string, attachmentId: string) =>
    `anynote/v1/attachment:${workspaceId}:${attachmentId}`,
};
