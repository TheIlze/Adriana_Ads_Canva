const cors = require("cors");


require("dotenv").config();

const express = require("express");
const _fetch = require("node-fetch"); // ← šeit mainīts vārds

const app = express();
app.use(cors({
    origin: "https://app-aagmyybgi1q.canva-apps.com",
    credentials: true
  }));
  
app.use(express.json());

app.post("/api/openai", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await _fetch("https://api.openai.com/v1/chat/completions", { // ← šeit arī
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
        console.error("Could not parse OpenAI response content as JSON:", content);
        res.status(500).json({ error: "Invalid JSON from OpenAI", raw: content });
      }
      

  } catch (error) {
    console.error("OpenAI kļūda:", error);
    res.status(500).send("Server error");
  }
});

app.listen(3001, () => {
  console.log("✅ Backend listening on http://localhost:3001");
});
