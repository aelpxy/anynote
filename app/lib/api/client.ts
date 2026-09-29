const baseUrl: string = import.meta.env.VITE_API_URL ?? "/api/v1";

type ApiErrorBody = {
  error?: { code?: string; message?: string };
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

type FetchOptions = {
  method?: string;
  token?: string;
  headers?: Record<string, string>;
  body?: BodyInit;
  signal?: AbortSignal;
};

export async function apiFetch(
  path: string,
  { method = "GET", token, headers, body, signal }: FetchOptions = {},
) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { ...headers, ...(token && { authorization: `Bearer ${token}` }) },
    body,
    signal,
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new ApiError(
      response.status,
      error.error?.code ?? "unknown",
      error.error?.message ?? "Something went wrong",
    );
  }
  return response;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
};

export async function apiRequest<T>(path: string, { method, body, token }: RequestOptions = {}) {
  const response = await apiFetch(path, {
    method,
    token,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const isJson = response.headers.get("content-type")?.includes("application/json");
  return (isJson ? await response.json() : undefined) as T;
}
