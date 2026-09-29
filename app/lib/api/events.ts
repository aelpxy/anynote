import { apiFetch } from "~/lib/api/client";

// EventSource can't send an Authorization header, so the stream is read with fetch
export async function streamWorkspaceChanges(
  token: string,
  workspaceId: string,
  signal: AbortSignal,
  onChange: () => void,
) {
  const response = await apiFetch(`/workspaces/${workspaceId}/events`, {
    token,
    headers: { accept: "text/event-stream" },
    signal,
  });
  if (!response.body) throw new Error("No event stream");

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) return;

    buffer += value;
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    if (events.some((event) => event.split("\n").includes("event: change"))) onChange();
  }
}
