const LOGOUT_LOGIN_KEY = "etomics_logout_plain_login";

/** Call before clearing session so guards send users to /login with no returnUrl. */
export function beginLogoutRedirect(): void {
  try {
    window.sessionStorage.setItem(LOGOUT_LOGIN_KEY, "1");
  } catch {
    // ignore
  }
}

export function isLogoutRedirect(): boolean {
  try {
    return window.sessionStorage.getItem(LOGOUT_LOGIN_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearLogoutRedirect(): void {
  try {
    window.sessionStorage.removeItem(LOGOUT_LOGIN_KEY);
  } catch {
    // ignore
  }
}
