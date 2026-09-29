import { apiRequest } from "~/lib/api/client";

export type KeyStretching = "memory-constrained" | "rfc-recommended";

export type Session = {
  token: string;
  expiresAt: string;
};

export type AccountResponse = {
  user: {
    id: string;
    username: string;
    publicKey: string;
    encryptedPrivateKey: string;
  };
  workspaces: {
    id: string;
    role: "owner" | "editor" | "viewer";
    encryptedName: string;
    encryptedWorkspaceKey: string;
  }[];
};

export function registerStart(body: { username: string; registrationRequest: string }) {
  return apiRequest<{ registrationResponse: string }>("/auth/register/start", {
    method: "POST",
    body,
  });
}

export function registerFinish(body: {
  username: string;
  registrationRecord: string;
  keyStretching: KeyStretching;
  publicKey: string;
  encryptedPrivateKey: string;
  workspace: { id: string; encryptedName: string; encryptedWorkspaceKey: string };
}) {
  return apiRequest<{ userId: string; workspaceId: string; session: Session }>(
    "/auth/register/finish",
    { method: "POST", body },
  );
}

export function loginStart(body: { username: string; credentialRequest: string }) {
  return apiRequest<{
    loginId: string;
    credentialResponse: string;
    keyStretching: KeyStretching;
  }>("/auth/login/start", { method: "POST", body });
}

export function loginFinish(body: { loginId: string; credentialFinalization: string }) {
  return apiRequest<{ session: Session; account: AccountResponse }>("/auth/login/finish", {
    method: "POST",
    body,
  });
}

export function logout(token: string) {
  return apiRequest<void>("/auth/logout", { method: "POST", token });
}

export function passwordStart(token: string, body: { registrationRequest: string }) {
  return apiRequest<{ registrationResponse: string }>("/auth/password/start", {
    method: "POST",
    token,
    body,
  });
}

export function passwordFinish(
  token: string,
  body: { registrationRecord: string; keyStretching: KeyStretching; encryptedPrivateKey: string },
) {
  return apiRequest<void>("/auth/password/finish", { method: "POST", token, body });
}

export function deleteAccountRecord(token: string) {
  return apiRequest<void>("/me", { method: "DELETE", token });
}
