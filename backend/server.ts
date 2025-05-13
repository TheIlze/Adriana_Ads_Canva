import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

import { generateCodeVerifier, generateCodeChallenge } from "../utils/backend/pkce";

// CONFIG
dotenv.config();
const app = express();
const PORT = 3001;

// CORS — allows Canva to call this server
app.use(
  cors({
    origin: "https://app-aagmyybgi1q.canva-apps.com",
    credentials: true,
  })
);

app.use(express.json());

// ======== GLOBAL STATE (for testing) =========
(global as any).codeVerifier = null;

// ========== /api/auth — start authorisation =============
app.get("/api/auth", (req, res) => {
  const clientId = process.env.CANVA_CLIENT_ID!;
  const redirectUri = "http://127.0.0.1:3001/api/callback";

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  (global as any).codeVerifier = codeVerifier;

  const authUrl = `https://www.canva.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=design:read+design:write&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  res.redirect(authUrl);
});

// ========== /api/callback — receive code and exchanges it to token ============
app.get("/api/callback", async (req, res) => {
  const code = req.query.code as string;
  const redirectUri = "http://127.0.0.1:3001/api/callback";
  const clientId = process.env.CANVA_CLIENT_ID!;
  const codeVerifier = (global as any).codeVerifier;

  if (!code || !codeVerifier || !clientId) {
    return res.status(400).send("❌ Missing code, verifier or clientId");
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
      console.error("❌ Token exchange failed:", data);
      return res.status(500).json({ error: "Failed to get access token", details: data });
    }

    console.log("🎉 Access Token:", data.access_token);
    console.log("🔁 Refresh Token:", data.refresh_token);
    console.log("⏳ Expires In:", data.expires_in);

    return res.send("✅ Authorisation successful. Now can call Canva API.");
  } catch (error: any) {
    console.error("❌ Token error:", error);
    return res.status(500).send("Token request error");
  }
});

app.post("/api/openai", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error response:", errorText);
      return res.status(500).json({ error: "OpenAI API error", detail: errorText });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";

    try {
      const parsed = JSON.parse(content);
      res.json(parsed);
    } catch (e) {
      console.error("❌ Couldn't parse OpenAI response as JSON:", content);
      res.status(500).json({ error: "Invalid JSON from OpenAI", raw: content });
    }

  } catch (error) {
    console.error("OpenAI error:", error);
    res.status(500).send("Server error");
  }
});


// ========== START SERVER ====================
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
