const encoder = new TextEncoder();

export async function createUnsubscribeToken(userId: string) {
  const secret = process.env.REMINDER_UNSUBSCRIBE_SECRET?.trim();
  if (!secret) return null;
  const payload = toBase64Url(encoder.encode(userId));
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifyUnsubscribeToken(token: string) {
  const secret = process.env.REMINDER_UNSUBSCRIBE_SECRET?.trim();
  const [payload, signature] = token.split(".");
  if (!secret || !payload || !signature) return null;
  try {
    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const valid = await crypto.subtle.verify("HMAC", key, fromBase64Url(signature), encoder.encode(payload));
    return valid ? new TextDecoder().decode(fromBase64Url(payload)) : null;
  } catch {
    return null;
  }
}

function toBase64Url(value: Uint8Array) {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(normalized);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
