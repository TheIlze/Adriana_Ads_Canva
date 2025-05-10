export default async function handler(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") {
      // CORS preflight atbilde
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }
  
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }
  
    try {
      const { prompt } = await req.json();
  
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
  
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "{}";
  
      return new Response(text, {
        headers: {
          "Access-Control-Allow-Origin": "*", // ← svarīgi
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      console.error("OpenAI API kļūda:", err);
      return new Response("Server Error", {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  }
  