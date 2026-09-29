const usernamePattern = /^[a-z0-9_]{3,32}$/;

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export function isValidUsername(username: string) {
  return usernamePattern.test(normalizeUsername(username));
}
