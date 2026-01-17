const TOKEN_KEY = "accessToken";
const USERNAME_KEY = "username";

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setAccessToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY);
}
export function setUsername(name: string) {
  localStorage.setItem(USERNAME_KEY, name);
}
export function clearUsername() {
  localStorage.removeItem(USERNAME_KEY);
}
