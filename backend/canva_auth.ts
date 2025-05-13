import express from "express";
import fetch from "node-fetch";

const router = express.Router();

import { generateCodeVerifier, generateCodeChallenge } from "../utils/backend/pkce"; // ja vajag, nomainām ceļu

router.get("/api/auth", (req, res) => {
  const clientId = process.env.CANVA_CLIENT_ID!;
  const redirectUri = "http://127.0.0.1:3001/api/callback";

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Saglabā globāli (vienkāršoti testiem)
  (global as any).codeVerifier = codeVerifier;

  const authUrl = `https://www.canva.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=design:read+design:write&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  res.redirect(authUrl);
});


router.get("/api/callback", async (req, res) => {
  const code = req.query.code as string;
  const redirectUri = "http://127.0.0.1:3001/api/callback"; // tas pats kas /auth URL
  const clientId = process.env.CANVA_CLIENT_ID!;
  if (!clientId) {
    throw new Error("Missing CANVA_CLIENT_ID environment variable");
  }
  const codeVerifier = (global as any).codeVerifier; // pagaidām glabājam globāli

  if (!codeVerifier) {
    return res.status(400).send("Code verifier missing");
  }

  try {
    const response = await fetch("https://api.canva.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: codeVerifier,
      }).toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Token exchange failed:", data);
      return res.status(500).json({ error: "Failed to get access token", details: data });
    }

    const { access_token, refresh_token, expires_in } = data;

    console.log("🎉 Access Token:", access_token);
    console.log("🔁 Refresh Token:", refresh_token);
    console.log("⏳ Expires In:", expires_in);

    // Te vari saglabāt tokenu (piemēram, sesijā vai datubāzē)
    // (global as any).accessToken = access_token;

    res.send("✅ Autorizācija izdevās. Tagad vari sūtīt API pieprasījumus ar šo tokenu.");
  } catch (error: any) {
    console.error("Error apmainot code pret tokenu:", error);
    res.status(500).send("Token request error");
  }
});

export default router;
