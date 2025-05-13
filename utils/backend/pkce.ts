import crypto from "crypto";

export function generateCodeVerifier(length = 64) {
  return crypto.randomBytes(length).toString("hex");
}

export function generateCodeChallenge(codeVerifier: string) {
  const hash = crypto.createHash("sha256").update(codeVerifier).digest();
  return hash
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}
