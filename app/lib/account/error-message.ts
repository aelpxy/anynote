import { InvalidCredentialsError } from "~/lib/account/sign-in";
import { ApiError } from "~/lib/api/client";

export function getErrorMessage(error: unknown) {
  if (error instanceof InvalidCredentialsError) return error.message;
  if (error instanceof ApiError) {
    if (error.status === 409) return "Username is taken.";
    if (error.status === 429) return "Too many attempts. Try again later.";
    if (error.status === 401) return "Wrong username, password or Secret Key.";
    if (error.status < 500) return error.message;
  }
  if (error instanceof TypeError) return "Can't reach the server.";
  return "Something went wrong.";
}
