// Load variables from .env file in the current directory
require("dotenv").config();
const fetch = require("node-fetch");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY environment variable is missing. Please check your .env file.");
  process.exit(1);
}

async function testOpenAIKey() {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: "Say hello in one word." }],
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ OpenAI API error:", error);
      return;
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content?.trim();
    console.log("✅ API Key works! Response:", message);
  } catch (err) {
    console.error("❌ Failed to reach OpenAI:", err.message);
  }
}

testOpenAIKey();
