export function decodeToken(token: string | null) {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    // fix padding for base64
    const padded = payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, "=");
    const decoded = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
