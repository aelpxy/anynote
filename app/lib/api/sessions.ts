import { apiRequest } from "~/lib/api/client";

export type SessionSummary = {
  id: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

export function listSessions(token: string) {
  return apiRequest<SessionSummary[]>("/sessions", { token });
}

export function revokeSession(token: string, sessionId: string) {
  return apiRequest<void>(`/sessions/${sessionId}`, { method: "DELETE", token });
}
